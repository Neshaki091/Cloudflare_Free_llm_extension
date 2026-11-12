import { Env } from '../env.js';
import { ALLOWED_MODELS, DEFAULT_MODEL, ModelsResponse } from '../../../shared/src/index.js';
import { jsonResponse } from '../utils/response.js';

export async function handleModels(request: Request, env: Env): Promise<Response> {
  const defaultModel = env.DEFAULT_MODEL || DEFAULT_MODEL;

  const body: ModelsResponse = {
    defaultModel,
    models: ALLOWED_MODELS.map((modelId) => ({
      id: modelId,
      label: 'GLM-4.7-Flash',
      capabilities: ['chat', 'reasoning', 'coding'],
      enabled: true
    }))
  };

  return jsonResponse(body, 200);
}

