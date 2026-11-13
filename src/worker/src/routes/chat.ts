import { Env } from '../env.js';
import {
  ALLOWED_MODELS,
  ChatRequest,
  ChatResponse,
  DEFAULT_MODEL,
  ErrorCodes
} from '../../../shared/src/index.js';
import { errorResponse, jsonResponse } from '../utils/response.js';
import { buildModelMessages } from '../ai/promptBuilder.js';
import { createSseResponseStream } from '../ai/streamAdapter.js';
import { normalizeAiError } from '../utils/safeErrors.js';

export async function handleChat(
  request: Request,
  env: Env,
  validatedData: ChatRequest,
  requestId: string
): Promise<Response> {
  const startTime = Date.now();

  // 1. Kiểm tra model allowlist
  const requestedModel = validatedData.model || env.DEFAULT_MODEL || DEFAULT_MODEL;
  if (!ALLOWED_MODELS.includes(requestedModel as any)) {
    return errorResponse(
      requestId,
      ErrorCodes.MODEL_NOT_ALLOWED,
      `Mô hình '${requestedModel}' không nằm trong allowlist của deployment hoặc không được hỗ trợ trên gói Free.`,
      403,
      false
    );
  }

  // 2. Chuẩn bị payload gửi tới Workers AI
  const modelMessages = buildModelMessages(
    validatedData.mode,
    validatedData.messages,
    validatedData.context
  );

  const maxTokens = validatedData.options?.maxOutputTokens || 1500;
  const temperature = validatedData.options?.temperature ?? 0.2;
  const shouldStream = validatedData.options?.stream !== false && env.ENABLE_STREAMING !== 'false';

  const aiInput: Record<string, unknown> = {
    messages: modelMessages,
    max_tokens: maxTokens,
    temperature,
    ...(shouldStream ? { stream: true } : {})
  };

  console.log(`[Worker:${requestId}] Model: ${requestedModel}, Stream: ${shouldStream}, Messages: ${modelMessages.length}`);

  try {
    if (shouldStream) {
      console.log(`[Worker:${requestId}] Đang gọi env.AI.run với stream=true...`);
      const upstreamResponse = await env.AI.run(requestedModel, aiInput, {
        stream: true
      });

      console.log(`[Worker:${requestId}] upstreamResponse nhận được:`, typeof upstreamResponse, upstreamResponse?.constructor?.name, 'isReadableStream:', upstreamResponse instanceof ReadableStream);

      if (upstreamResponse instanceof ReadableStream) {
        return createSseResponseStream(upstreamResponse, requestId, requestedModel);
      }

      // Fallback nếu upstream không trả ReadableStream
      console.warn(`[Worker:${requestId}] upstreamResponse không phải ReadableStream! Trả về JSON fallback.`);
      const textOutput = upstreamResponse?.response || upstreamResponse?.text || '';
      const totalMs = Date.now() - startTime;
      const fallbackBody: ChatResponse = {
        requestId,
        ok: true,
        model: requestedModel,
        output: {
          role: 'assistant',
          content: textOutput
        },
        usage: {
          inputTokens: null,
          outputTokens: null,
          neurons: null
        },
        timing: {
          totalMs
        }
      };
      return jsonResponse(fallbackBody, 200, { 'X-Request-ID': requestId });
    } else {
      // 3B. JSON response non-streaming
      console.log(`[Worker:${requestId}] Đang gọi env.AI.run non-streaming...`);
      const upstreamResponse = await env.AI.run(requestedModel, aiInput);
      const textOutput =
        typeof upstreamResponse === 'string'
          ? upstreamResponse
          : upstreamResponse?.response || upstreamResponse?.output || upstreamResponse?.choices?.[0]?.message?.content || '';

      const totalMs = Date.now() - startTime;
      console.log(`[Worker:${requestId}] Hoàn thành non-streaming sau ${totalMs}ms. Output length: ${textOutput.length}`);
      const responseBody: ChatResponse = {
        requestId,
        ok: true,
        model: requestedModel,
        output: {
          role: 'assistant',
          content: textOutput
        },
        usage: {
          inputTokens: null,
          outputTokens: null,
          neurons: null
        },
        timing: {
          totalMs
        }
      };

      return jsonResponse(responseBody, 200, { 'X-Request-ID': requestId });
    }
  } catch (err: any) {
    console.error(`[Worker:${requestId}] Lỗi khi chạy Workers AI:`, err?.message || err);
    const { status, detail } = normalizeAiError(err);
    return errorResponse(requestId, detail.code, detail.message, status, detail.retryable);
  }
}
