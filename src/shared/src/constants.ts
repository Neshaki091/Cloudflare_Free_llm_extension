/**
 * Các hằng số an toàn dùng chung giữa Extension và Cloudflare Worker.
 * Tuân thủ mục 4.3, 7.1, 8.1 của SRS.md.
 */

export const DEFAULT_MODEL = '@cf/zai-org/glm-4.7-flash';

export const ALLOWED_MODELS = [
  '@cf/zai-org/glm-4.7-flash'
] as const;

export const DEFAULT_MAX_BODY_BYTES = 262144; // 256 KiB
export const DEFAULT_MAX_CONTEXT_TOKENS = 12000;
export const HARD_CAP_CONTEXT_TOKENS = 20000;
export const DEFAULT_MAX_OUTPUT_TOKENS = 1500;
export const DEFAULT_REQUEST_TIMEOUT_MS = 120000; // 120 giây
export const DEFAULT_CONNECT_TIMEOUT_MS = 10000; // 10 giây

export const API_VERSION = 'v1';
export const SERVICE_NAME = 'nescode-worker';

export const DEFAULT_EXCLUDE_PATTERNS = [
  '.env',
  '.env.*',
  '!.env.example',
  '**/*.pem',
  '**/*.key',
  '**/*private_key*',
  '**/*credentials*',
  '**/*secret*',
  '**/.ssh/**',
  '**/.aws/**',
  '**/.config/gcloud/**',
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/coverage/**',
  '**/.next/**',
  '**/.venv/**',
  '**/venv/**',
  '**/target/**',
  '**/__pycache__/**'
] as const;

