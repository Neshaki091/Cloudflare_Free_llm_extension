import { Env } from '../env.js';
import { API_VERSION, DEFAULT_MODEL, HealthResponse, SERVICE_NAME } from '../../../shared/src/index.js';
import { jsonResponse } from '../utils/response.js';

export async function handleHealth(request: Request, env: Env): Promise<Response> {
  const defaultModel = env.DEFAULT_MODEL || DEFAULT_MODEL;
  const streamingEnabled = env.ENABLE_STREAMING !== 'false';

  const body: HealthResponse = {
    ok: true,
    service: SERVICE_NAME,
    apiVersion: API_VERSION,
    defaultModel,
    streamingEnabled,
    timestamp: new Date().toISOString()
  };

  return jsonResponse(body, 200);
}
