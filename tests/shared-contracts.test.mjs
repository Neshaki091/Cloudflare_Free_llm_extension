import test from 'node:test';
import assert from 'node:assert/strict';

test('Shared Constants - Verify model and token bounds', async () => {
  const {
    DEFAULT_MODEL,
    ALLOWED_MODELS,
    DEFAULT_MAX_OUTPUT_TOKENS,
    DEFAULT_MAX_BODY_BYTES,
    DEFAULT_MAX_CONTEXT_TOKENS,
    HARD_CAP_CONTEXT_TOKENS,
    DEFAULT_EXCLUDE_PATTERNS
  } = await import('../src/shared/src/constants.ts');

  assert.equal(DEFAULT_MODEL, '@cf/zai-org/glm-4.7-flash');
  assert.ok(ALLOWED_MODELS.includes('@cf/zai-org/glm-4.7-flash'));
  assert.equal(DEFAULT_MAX_OUTPUT_TOKENS, 4096);
  assert.equal(DEFAULT_MAX_BODY_BYTES, 262144);
  assert.equal(DEFAULT_MAX_CONTEXT_TOKENS, 12000);
  assert.equal(HARD_CAP_CONTEXT_TOKENS, 20000);
  assert.ok(DEFAULT_EXCLUDE_PATTERNS.includes('.env'));
  assert.ok(DEFAULT_EXCLUDE_PATTERNS.includes('**/node_modules/**'));
});

test('Error Codes - Verify standard error code definitions', async () => {
  const { ErrorCodes } = await import('../src/shared/src/error-codes.ts');

  assert.equal(ErrorCodes.UNAUTHORIZED, 'UNAUTHORIZED');
  assert.equal(ErrorCodes.INVALID_REQUEST, 'INVALID_REQUEST');
  assert.equal(ErrorCodes.PAYLOAD_TOO_LARGE, 'PAYLOAD_TOO_LARGE');
  assert.equal(ErrorCodes.AI_QUOTA_EXCEEDED, 'AI_QUOTA_EXCEEDED');
  assert.equal(ErrorCodes.AI_CAPACITY_UNAVAILABLE, 'AI_CAPACITY_UNAVAILABLE');
  assert.equal(ErrorCodes.AI_TIMEOUT, 'AI_TIMEOUT');
  assert.equal(ErrorCodes.INTERNAL_ERROR, 'INTERNAL_ERROR');
});