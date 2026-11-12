import { Env } from '../env.js';
import { ErrorCodes } from '../../../shared/src/index.js';
import { errorResponse } from '../utils/response.js';

/**
 * So sánh an toàn thời gian hai chuỗi ký tự (ngăn chặn tấn công timing attacks).
 */
export async function timingSafeEqualString(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const aBuf = encoder.encode(a);
  const bBuf = encoder.encode(b);

  if (aBuf.byteLength !== bBuf.byteLength) {
    return false;
  }

  // Sử dụng crypto.subtle.timingSafeEqual nếu môi trường runtime hỗ trợ
  if (typeof crypto !== 'undefined' && crypto.subtle && typeof (crypto.subtle as any).timingSafeEqual === 'function') {
    return (crypto.subtle as any).timingSafeEqual(aBuf, bBuf);
  }

  // Thuật toán so sánh XOR hằng số thời gian fallback
  let mismatch = 0;
  for (let i = 0; i < aBuf.byteLength; i++) {
    mismatch |= aBuf[i]! ^ bBuf[i]!;
  }
  return mismatch === 0;
}

/**
 * Middleware xác thực Bearer API Key.
 * Trả về Response lỗi nếu xác thực thất bại, hoặc null nếu hợp lệ.
 */
export async function authenticateRequest(
  request: Request,
  env: Env,
  requestId: string
): Promise<Response | null> {
  const configuredKey = env.NESCODE_API_KEY;

  // Nếu Worker chưa được thiết lập secret
  if (!configuredKey) {
    return errorResponse(
      requestId,
      ErrorCodes.INTERNAL_ERROR,
      'Backend Worker chưa được thiết lập bí mật NESCODE_API_KEY. Vui lòng chạy lệnh: npx wrangler secret put NESCODE_API_KEY.',
      500,
      false
    );
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return errorResponse(
      requestId,
      ErrorCodes.UNAUTHORIZED,
      'Thiếu Authorization header trong request.',
      401,
      false
    );
  }

  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0]?.toLowerCase() !== 'bearer') {
    return errorResponse(
      requestId,
      ErrorCodes.UNAUTHORIZED,
      'Định dạng Authorization header không hợp lệ. Bắt buộc: Bearer <API_KEY>.',
      401,
      false
    );
  }

  const providedKey = parts[1] || '';
  const isMatch = await timingSafeEqualString(providedKey, configuredKey);

  if (!isMatch) {
    return errorResponse(
      requestId,
      ErrorCodes.UNAUTHORIZED,
      'Khóa API không chính xác hoặc không có quyền truy cập.',
      401,
      false
    );
  }

  return null;
}
