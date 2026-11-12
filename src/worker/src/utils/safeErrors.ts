import { ErrorCodes, ErrorDetail } from '../../../shared/src/index.js';

export function normalizeAiError(err: unknown): { status: number; detail: ErrorDetail } {
  const errMsg = String(err && typeof err === 'object' && 'message' in err ? (err as any).message : err || '');
  const errLower = errMsg.toLowerCase();

  // Kiểm tra lỗi hạn ngạch (Quota / Rate Limit)
  if (
    errLower.includes('quota') ||
    errLower.includes('daily limit') ||
    errLower.includes('exceeded limit') ||
    errLower.includes('out of neurons')
  ) {
    return {
      status: 429,
      detail: {
        code: ErrorCodes.AI_QUOTA_EXCEEDED,
        message: 'Đã đạt giới hạn hạn ngạch Workers AI của tài khoản Cloudflare Free. Vui lòng đợi reset (00:00 UTC) hoặc kiểm tra dashboard.',
        retryable: false
      }
    };
  }

  // Kiểm tra lỗi quá tải / hết capacity
  if (
    errLower.includes('capacity') ||
    errLower.includes('unavailable') ||
    errLower.includes('temporarily') ||
    errLower.includes('overloaded')
  ) {
    return {
      status: 503,
      detail: {
        code: ErrorCodes.AI_CAPACITY_UNAVAILABLE,
        message: 'Mô hình AI hiện đang quá tải tại datacenter của Cloudflare. Vui lòng thử lại sau giây lát.',
        retryable: true
      }
    };
  }

  // Kiểm tra lỗi quá thời gian chờ (Timeout)
  if (errLower.includes('timeout') || errLower.includes('timed out')) {
    return {
      status: 504,
      detail: {
        code: ErrorCodes.AI_TIMEOUT,
        message: 'Yêu cầu suy luận AI đã quá thời gian chờ (Timeout). Vui lòng thử lại với ngữ cảnh ngắn hơn.',
        retryable: true
      }
    };
  }

  // Lỗi nội bộ không dự kiến
  return {
    status: 500,
    detail: {
      code: ErrorCodes.INTERNAL_ERROR,
      message: 'Đã xảy ra lỗi nội bộ khi kết nối tới Cloudflare Workers AI.',
      retryable: true
    }
  };
}
