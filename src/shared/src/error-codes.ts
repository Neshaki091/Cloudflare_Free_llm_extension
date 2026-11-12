/**
 * Mã lỗi chuẩn hóa cho toàn bộ hệ thống NesCode for Antigravity.
 * Tuân thủ mục 7.7 của SRS.md.
 */
export const ErrorCodes = {
  INVALID_REQUEST: 'INVALID_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  MODEL_NOT_ALLOWED: 'MODEL_NOT_ALLOWED',
  NOT_FOUND: 'NOT_FOUND',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  RATE_LIMITED: 'RATE_LIMITED',
  AI_QUOTA_EXCEEDED: 'AI_QUOTA_EXCEEDED',
  AI_CAPACITY_UNAVAILABLE: 'AI_CAPACITY_UNAVAILABLE',
  AI_TIMEOUT: 'AI_TIMEOUT',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

export interface ErrorDetail {
  code: ErrorCode;
  message: string;
  retryable: boolean;
}
