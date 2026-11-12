import { ErrorCode, ErrorResponse } from '../../../shared/src/index.js';

export function getCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
    'Access-Control-Max-Age': '86400'
  };
}

export function jsonResponse(
  data: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...getCorsHeaders(),
      ...extraHeaders
    }
  });
}

export function errorResponse(
  requestId: string,
  code: ErrorCode,
  message: string,
  status = 400,
  retryable = false
): Response {
  const payload: ErrorResponse = {
    requestId,
    ok: false,
    error: {
      code,
      message,
      retryable
    }
  };

  return jsonResponse(payload, status, {
    'X-Request-ID': requestId
  });
}
