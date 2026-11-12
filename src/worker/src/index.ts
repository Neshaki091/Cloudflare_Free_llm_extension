/**
 * Entry point của Cloudflare Worker Backend cho NesCode for Antigravity.
 * Tuân thủ SRS.md mục 4.5, 7, 9 và các quy chuẩn bảo mật.
 */
import { Env } from './env.js';
import { ErrorCodes } from '../../shared/src/index.js';
import { errorResponse, getCorsHeaders } from './utils/response.js';
import { authenticateRequest } from './middleware/auth.js';
import { validateChatRequestBody } from './middleware/validateBody.js';
import { handleHealth } from './routes/health.js';
import { handleModels } from './routes/models.js';
import { handleChat } from './routes/chat.js';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // 1. Xử lý CORS Preflight (OPTIONS)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders()
      });
    }

    // 2. Tạo hoặc lấy Correlation Request ID
    const requestId = request.headers.get('X-Request-ID') || crypto.randomUUID();

    try {
      const url = new URL(request.url);
      const path = url.pathname.replace(/\/+$/, ''); // Chuẩn hóa bỏ dấu gạch chéo cuối

      // 3. Định tuyến các endpoints
      // Endpoint: GET /v1/health
      if (path === '/v1/health' && request.method === 'GET') {
        const authError = await authenticateRequest(request, env, requestId);
        if (authError) return authError;
        return await handleHealth(request, env);
      }

      // Endpoint: GET /v1/models
      if (path === '/v1/models' && request.method === 'GET') {
        const authError = await authenticateRequest(request, env, requestId);
        if (authError) return authError;
        return await handleModels(request, env);
      }

      // Endpoint: POST /v1/chat
      if (path === '/v1/chat' && request.method === 'POST') {
        const authError = await authenticateRequest(request, env, requestId);
        if (authError) return authError;

        const validation = await validateChatRequestBody(request, env, requestId);
        if (!validation.ok) {
          return validation.response;
        }

        return await handleChat(request, env, validation.requestData, requestId);
      }

      // Nếu không khớp endpoint nào
      return errorResponse(
        requestId,
        ErrorCodes.NOT_FOUND,
        `Endpoint '${path}' với phương thức '${request.method}' không tồn tại.`,
        404,
        false
      );
    } catch (err) {
      // Bắt mọi exception bất thường để không làm sập Worker hoặc rò rỉ stack trace
      return errorResponse(
        requestId,
        ErrorCodes.INTERNAL_ERROR,
        'Lỗi máy chủ nội bộ không mong muốn.',
        500,
        true
      );
    }
  }
};
