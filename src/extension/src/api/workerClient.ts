import * as vscode from 'vscode';
import {
  ChatRequest,
  ChatResponse,
  ErrorResponse,
  HealthResponse,
  ModelsResponse
} from '../../../shared/src/index.js';
import { SecretManager } from '../security/secretStorage.js';
import { SseParser, SseParserCallbacks } from './sseParser.js';

export interface WorkerConnectionConfig {
  baseUrl: string;
  apiKey: string;
}

export class WorkerClient {
  private outputChannel?: vscode.OutputChannel;

  constructor(private readonly secretManager: SecretManager) {}

  setOutputChannel(channel: vscode.OutputChannel): void {
    this.outputChannel = channel;
  }

  private log(message: string): void {
    const time = new Date().toLocaleTimeString('vi-VN');
    this.outputChannel?.appendLine(`[${time}] ${message}`);
  }

  /**
   * Lấy cấu hình kết nối hiện tại (Worker URL từ settings và API Key từ SecretStorage).
   */
  async getConfig(): Promise<WorkerConnectionConfig | null> {
    const config = vscode.workspace.getConfiguration('nescode');
    const rawUrl = config.get<string>('apiBaseUrl', '').trim().replace(/\/+$/, '');
    const apiKey = await this.secretManager.getApiKey();

    if (!rawUrl || !apiKey) {
      return null;
    }

    return {
      baseUrl: rawUrl,
      apiKey: apiKey
    };
  }

  /**
   * Kiểm tra kết nối tới Worker (GET /v1/health).
   */
  async checkHealth(): Promise<{ ok: boolean; data?: HealthResponse; error?: string }> {
    const conn = await this.getConfig();
    if (!conn) {
      return {
        ok: false,
        error: 'Chưa cấu hình Worker URL hoặc API Key. Vui lòng chạy lệnh: NesCode: Cấu Hình Kết Nối Worker.'
      };
    }

    try {
      const url = `${conn.baseUrl}/v1/health`;
      this.log(`Kiểm tra kết nối GET ${url}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${conn.apiKey}`,
          Accept: 'application/json'
        }
      });

      if (!response.ok) {
        let errMsg = `Máy chủ trả về HTTP ${response.status} (${response.statusText})`;
        try {
          const errBody = (await response.json()) as ErrorResponse;
          if (errBody.error?.message) {
            errMsg = errBody.error.message;
          }
        } catch {}
        this.log(`Lỗi kết nối: ${errMsg}`);
        return { ok: false, error: errMsg };
      }

      const data = (await response.json()) as HealthResponse;
      this.log(`Kết nối thành công tới ${data.service} (${data.defaultModel})`);
      return { ok: true, data };
    } catch (err: any) {
      const msg = `Không thể kết nối tới Worker (${err?.message || 'Network error'}). Hãy kiểm tra lại kết nối mạng hoặc Worker URL.`;
      this.log(`Lỗi mạng: ${msg}`);
      return {
        ok: false,
        error: msg
      };
    }
  }

  /**
   * Lấy danh sách models được hỗ trợ (GET /v1/models).
   */
  async getModels(): Promise<ModelsResponse | null> {
    const conn = await this.getConfig();
    if (!conn) return null;

    try {
      const url = `${conn.baseUrl}/v1/models`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${conn.apiKey}`,
          Accept: 'application/json'
        }
      });
      if (response.ok) {
        return (await response.json()) as ModelsResponse;
      }
    } catch (err: any) {
      this.log(`Lỗi lấy models: ${err?.message}`);
    }
    return null;
  }

  /**
   * Gửi yêu cầu Chat và nhận phản hồi Streaming (Server-Sent Events).
   */
  async sendChatStream(
    chatRequest: ChatRequest,
    callbacks: SseParserCallbacks,
    signal?: AbortSignal
  ): Promise<void> {
    const conn = await this.getConfig();
    if (!conn) {
      this.log('Yêu cầu bị từ chối: Chưa cấu hình kết nối Worker URL / API Key.');
      callbacks.onError?.({
        code: 'UNAUTHORIZED',
        message: 'Chưa cấu hình kết nối. Vui lòng bấm vào biểu tượng bánh răng để nhập Worker URL và API Key.',
        retryable: false
      });
      return;
    }

    const url = `${conn.baseUrl}/v1/chat`;
    const requestId = chatRequest.requestId || crypto.randomUUID();

    const config = vscode.workspace.getConfiguration('nescode');
    const timeoutMs = config.get<number>('requestTimeoutMs', 60000);

    this.log(`Gửi yêu cầu POST ${url} [ReqID: ${requestId}] (Timeout: ${timeoutMs / 1000}s)`);

    // Thiết lập timeout controller
    const timeoutController = new AbortController();
    const timeoutTimer = setTimeout(() => {
      timeoutController.abort(new Error(`Hết thời gian chờ phản hồi (${timeoutMs / 1000}s)`));
    }, timeoutMs);

    // Kết hợp abort signals
    const combinedAbortHandler = () => {
      timeoutController.abort();
    };
    if (signal) {
      signal.addEventListener('abort', combinedAbortHandler);
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Authorization: `Bearer ${conn.apiKey}`,
          'X-Request-ID': requestId,
          Accept: 'text/event-stream, application/json'
        },
        body: JSON.stringify(chatRequest),
        signal: timeoutController.signal
      });

      this.log(`Nhận phản hồi HTTP ${response.status} ${response.statusText} [ReqID: ${requestId}]`);

      if (!response.ok) {
        let errCode = 'INTERNAL_ERROR';
        let errMsg = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errJson = (await response.json()) as ErrorResponse;
          if (errJson.error) {
            errCode = errJson.error.code;
            errMsg = errJson.error.message;
          }
        } catch {}

        this.log(`Máy chủ trả về lỗi: [${errCode}] ${errMsg}`);
        callbacks.onError?.({
          code: errCode as any,
          message: errMsg,
          retryable: response.status >= 500
        });
        return;
      }

      const contentType = response.headers.get('content-type') || '';
      this.log(`Content-Type phản hồi: ${contentType}`);

      // Nếu server trả về SSE stream
      if (contentType.includes('text/event-stream') && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        const parser = new SseParser(callbacks);

        let receivedChunks = 0;
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            receivedChunks++;
            const textChunk = decoder.decode(value, { stream: true });
            parser.feed(textChunk);
          }
          this.log(`Đã đọc xong toàn bộ stream (${receivedChunks} chunks nhận được).`);
        } finally {
          parser.end();
          reader.releaseLock();
        }
      } else {
        // Fallback nếu trả JSON thông thường
        const json = (await response.json()) as ChatResponse;
        this.log(`Nhận phản hồi JSON đầy đủ: ok=${json.ok}`);
        if (json.ok && json.output?.content) {
          callbacks.onDelta?.({ text: json.output.content });
          callbacks.onDone?.({ requestId: json.requestId });
        }
      }
    } catch (err: any) {
      if (signal?.aborted) {
        this.log('Người dùng đã bấm Dừng yêu cầu.');
        callbacks.onDelta?.({ text: '\n\n*(Đã dừng bởi người dùng)*' });
        callbacks.onDone?.({ requestId });
        return;
      }

      const errorMsg = err?.message || 'Không thể gửi yêu cầu tới Worker.';
      this.log(`Lỗi kết nối trong sendChatStream: ${errorMsg}`);
      callbacks.onError?.({
        code: 'INTERNAL_ERROR',
        message: `Lỗi kết nối: ${errorMsg}`,
        retryable: true
      });
    } finally {
      clearTimeout(timeoutTimer);
      if (signal) {
        signal.removeEventListener('abort', combinedAbortHandler);
      }
    }
  }
}
