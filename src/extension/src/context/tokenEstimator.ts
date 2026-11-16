import type { TokenBreakdown } from '../../../shared/src/index.js';

/**
 * Ước lượng số lượng Token từ chuỗi văn bản.
 * Hỗ trợ đa ngôn ngữ (Tiếng Việt và mã nguồn code).
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;

  // Đếm sơ bộ ký tự tiếng Việt (có dấu)
  const vietnameseRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/gi;
  const vnMatches = text.match(vietnameseRegex);
  const vnCharCount = vnMatches ? vnMatches.length : 0;
  const otherCharCount = text.length - vnCharCount;

  // 1 token VN ~ 2.5 ký tự; 1 token code/EN ~ 3.8 ký tự
  const estimated = Math.ceil(vnCharCount / 2.5 + otherCharCount / 3.8);
  return Math.max(1, estimated);
}

/**
 * Tính toán bảng phân tích sử dụng Token theo từng phần (Context, Input, Thinking, Output).
 */
export function calculateTokenBreakdown(
  contextText: string,
  inputText: string,
  assistantContent: string,
  maxContextTokens = 32768
): TokenBreakdown {
  const contextTokens = estimateTokens(contextText);
  const inputTokens = estimateTokens(inputText);

  // Bóc tách phần suy nghĩ trong <think> hoặc <thought>
  let thinkingText = '';
  let outputText = assistantContent;

  const thinkMatch = assistantContent.match(/<(?:think|thought)>([\s\S]*?)<\/(?:think|thought)>/i);
  if (thinkMatch && thinkMatch[1]) {
    thinkingText = thinkMatch[1];
    outputText = assistantContent.replace(/<(?:think|thought)>[\s\S]*?<\/(?:think|thought)>/gi, '').trim();
  } else {
    // Trường hợp đang stream dở <think>...
    const thinkStreamMatch = assistantContent.match(/<(?:think|thought)>([\s\S]*)$/i);
    if (thinkStreamMatch && thinkStreamMatch[1]) {
      thinkingText = thinkStreamMatch[1];
      outputText = assistantContent.replace(/<(?:think|thought)>[\s\S]*$/gi, '').trim();
    }
  }

  const thinkingTokens = estimateTokens(thinkingText);
  const outputTokens = estimateTokens(outputText);

  const totalTokens = contextTokens + inputTokens + thinkingTokens + outputTokens;
  const usagePercentage = Math.min(100, Number(((totalTokens / maxContextTokens) * 100).toFixed(1)));

  // Tính % phân bổ của từng phần trên tổng tokens đã dùng
  const safeTotal = Math.max(1, totalTokens);
  const contextPercent = Math.round((contextTokens / safeTotal) * 100);
  const inputPercent = Math.round((inputTokens / safeTotal) * 100);
  const thinkingPercent = Math.round((thinkingTokens / safeTotal) * 100);
  const outputPercent = Math.max(0, 100 - contextPercent - inputPercent - thinkingPercent);

  return {
    contextTokens,
    inputTokens,
    thinkingTokens,
    outputTokens,
    totalTokens,
    maxContextTokens,
    usagePercentage,
    details: {
      contextPercent,
      inputPercent,
      thinkingPercent,
      outputPercent
    }
  };
}
