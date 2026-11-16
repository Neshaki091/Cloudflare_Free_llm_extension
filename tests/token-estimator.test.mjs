import test from 'node:test';
import assert from 'node:assert/strict';
import { estimateTokens, calculateTokenBreakdown } from '../src/extension/src/context/tokenEstimator.ts';

test('Token Estimator - Estimates tokens for code and Vietnamese text cleanly', () => {
  const code = 'function calculateSum(a: number, b: number): number { return a + b; }';
  const tokensCode = estimateTokens(code);
  assert.ok(tokensCode > 10 && tokensCode < 30);

  const vnText = 'Xin chào trợ lý lập trình NesCode, hãy hỗ trợ tôi kiểm tra đoạn mã này.';
  const tokensVn = estimateTokens(vnText);
  assert.ok(tokensVn > 15 && tokensVn < 45);
});

test('Token Estimator - Correctly breaks down tokens into context, input, thinking, and output', () => {
  const context = 'File: app.py\ndef main(): pass';
  const input = 'Kiểm tra hàm main';
  const assistantWithThink = '<think>Cần rà soát hàm main xem có ngoại lệ không.</think>\nHàm main hoạt động ổn định.';

  const breakdown = calculateTokenBreakdown(context, input, assistantWithThink, 32768);

  assert.ok(breakdown.contextTokens > 0);
  assert.ok(breakdown.inputTokens > 0);
  assert.ok(breakdown.thinkingTokens > 0);
  assert.ok(breakdown.outputTokens > 0);
  assert.equal(
    breakdown.totalTokens,
    breakdown.contextTokens + breakdown.inputTokens + breakdown.thinkingTokens + breakdown.outputTokens
  );
  assert.ok(breakdown.usagePercentage > 0 && breakdown.usagePercentage <= 100);
  assert.equal(
    breakdown.details.contextPercent +
    breakdown.details.inputPercent +
    breakdown.details.thinkingPercent +
    breakdown.details.outputPercent,
    100
  );
});
