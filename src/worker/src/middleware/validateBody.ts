import { Env } from '../env.js';
import {
  ChatMode,
  ChatRequest,
  DEFAULT_MAX_BODY_BYTES,
  DEFAULT_MAX_OUTPUT_TOKENS,
  ErrorCodes
} from '../../../shared/src/index.js';
import { errorResponse } from '../utils/response.js';

export interface ValidationSuccess {
  ok: true;
  requestData: ChatRequest;
}

export interface ValidationFailure {
  ok: false;
  response: Response;
}

export type ValidationResult = ValidationSuccess | ValidationFailure;

/**
 * Kiểm tra tính hợp lệ của đường dẫn file trong context (chặn path traversal).
 */
function isSafeRelativePath(pathStr: string): boolean {
  if (typeof pathStr !== 'string' || pathStr.trim() === '') {
    return false;
  }
  // Chặn path traversal và absolute path
  if (pathStr.includes('..') || pathStr.startsWith('/') || pathStr.startsWith('\\') || /^[a-zA-Z]:/.test(pathStr)) {
    return false;
  }
  return true;
}

/**
 * Xác thực toàn diện body của request POST /v1/chat.
 */
export async function validateChatRequestBody(
  request: Request,
  env: Env,
  requestId: string
): Promise<ValidationResult> {
  const maxBytes = parseInt(env.MAX_BODY_BYTES || '', 10) || DEFAULT_MAX_BODY_BYTES;

  // 1. Kiểm tra Content-Length header nếu có
  const contentLengthHeader = request.headers.get('content-length');
  if (contentLengthHeader) {
    const contentLength = parseInt(contentLengthHeader, 10);
    if (!isNaN(contentLength) && contentLength > maxBytes) {
      return {
        ok: false,
        response: errorResponse(
          requestId,
          ErrorCodes.PAYLOAD_TOO_LARGE,
          `Kích thước request body (${contentLength} bytes) vượt quá giới hạn tối đa cho phép (${maxBytes} bytes).`,
          413,
          false
        )
      };
    }
  }

  // 2. Đọc raw body an toàn và kiểm tra kích thước thực tế
  let rawBodyText: string;
  try {
    const rawBuffer = await request.arrayBuffer();
    if (rawBuffer.byteLength > maxBytes) {
      return {
        ok: false,
        response: errorResponse(
          requestId,
          ErrorCodes.PAYLOAD_TOO_LARGE,
          `Kích thước request body (${rawBuffer.byteLength} bytes) vượt quá giới hạn tối đa cho phép (${maxBytes} bytes).`,
          413,
          false
        )
      };
    }
    const decoder = new TextDecoder('utf-8');
    rawBodyText = decoder.decode(rawBuffer);
  } catch (err) {
    return {
      ok: false,
      response: errorResponse(
        requestId,
        ErrorCodes.INVALID_REQUEST,
        'Không thể đọc dữ liệu từ request body.',
        400,
        false
      )
    };
  }

  // 3. Phân tích cú pháp JSON
  let parsed: any;
  try {
    parsed = JSON.parse(rawBodyText);
  } catch {
    return {
      ok: false,
      response: errorResponse(
        requestId,
        ErrorCodes.INVALID_REQUEST,
        'Dữ liệu request body không phải là định dạng JSON hợp lệ.',
        400,
        false
      )
    };
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      ok: false,
      response: errorResponse(
        requestId,
        ErrorCodes.INVALID_REQUEST,
        'Request body phải là một JSON object.',
        400,
        false
      )
    };
  }

  // 4. Kiểm tra mode
  const validModes: ChatMode[] = ['chat', 'explain', 'fix', 'generate_tests'];
  const mode = parsed.mode;
  if (!validModes.includes(mode)) {
    return {
      ok: false,
      response: errorResponse(
        requestId,
        ErrorCodes.INVALID_REQUEST,
        `Trường 'mode' không hợp lệ. Cho phép: ${validModes.join(', ')}.`,
        400,
        false
      )
    };
  }

  // 5. Kiểm tra danh sách messages
  if (!Array.isArray(parsed.messages) || parsed.messages.length === 0) {
    return {
      ok: false,
      response: errorResponse(
        requestId,
        ErrorCodes.INVALID_REQUEST,
        `Trường 'messages' bắt buộc phải là một mảng không rỗng.`,
        400,
        false
      )
    };
  }

  const sanitizedMessages = [];
  let hasUserMessage = false;

  for (const msg of parsed.messages) {
    if (!msg || typeof msg !== 'object') continue;
    const role = msg.role;
    // Client CHỈ được gửi role user hoặc assistant. Loại bỏ các role can thiệp như system, developer, tool.
    if (role === 'user' || role === 'assistant') {
      const content = typeof msg.content === 'string' ? msg.content : '';
      if (role === 'user' && content.trim().length > 0) {
        hasUserMessage = true;
      }
      sanitizedMessages.push({
        role: role as 'user' | 'assistant',
        content
      });
    }
  }

  if (!hasUserMessage) {
    return {
      ok: false,
      response: errorResponse(
        requestId,
        ErrorCodes.INVALID_REQUEST,
        `Cần có ít nhất một tin nhắn có nội dung từ người dùng ('role': 'user').`,
        400,
        false
      )
    };
  }

  // 6. Kiểm tra context an toàn
  const sanitizedContext: ChatRequest['context'] = {};
  if (parsed.context && typeof parsed.context === 'object') {
    if (parsed.context.selection && typeof parsed.context.selection === 'object') {
      const sel = parsed.context.selection;
      if (typeof sel.content === 'string') {
        const path = isSafeRelativePath(sel.path) ? sel.path : 'active-selection';
        sanitizedContext.selection = {
          path,
          language: typeof sel.language === 'string' ? sel.language : 'plaintext',
          content: sel.content
        };
      }
    }

    if (Array.isArray(parsed.context.files)) {
      sanitizedContext.files = [];
      for (const f of parsed.context.files) {
        if (!f || typeof f !== 'object' || typeof f.content !== 'string') continue;
        if (!isSafeRelativePath(f.path)) continue; // Loại trừ các path chứa traversal
        sanitizedContext.files.push({
          path: f.path,
          language: typeof f.language === 'string' ? f.language : 'plaintext',
          content: f.content
        });
      }
    }

    if (typeof parsed.context.workspaceTree === 'string') {
      sanitizedContext.workspaceTree = parsed.context.workspaceTree.slice(0, 8000);
    }
  }

  // 7. Chuẩn hóa options
  const defaultMaxOutput = parseInt(env.MAX_OUTPUT_TOKENS || '', 10) || DEFAULT_MAX_OUTPUT_TOKENS;
  let maxOutputTokens = defaultMaxOutput;
  if (parsed.options?.maxOutputTokens && typeof parsed.options.maxOutputTokens === 'number') {
    maxOutputTokens = Math.min(Math.max(parsed.options.maxOutputTokens, 100), defaultMaxOutput);
  }

  let temperature = 0.2;
  if (typeof parsed.options?.temperature === 'number') {
    temperature = Math.min(Math.max(parsed.options.temperature, 0), 1);
  }

  const stream = parsed.options?.stream !== false; // Mặc định bật stream nếu không truyền false

  const validatedData: ChatRequest = {
    requestId,
    mode,
    model: typeof parsed.model === 'string' ? parsed.model : undefined,
    messages: sanitizedMessages,
    context: sanitizedContext,
    options: {
      stream,
      maxOutputTokens,
      temperature
    }
  };

  return {
    ok: true,
    requestData: validatedData
  };
}

