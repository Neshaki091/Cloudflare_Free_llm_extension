import type { ContextFile } from '../../../shared/src/index.js';

export interface CompressionOptions {
  maxCharsPerFile?: number;
  totalBudgetChars?: number;
}

const DEFAULT_MAX_CHARS_PER_FILE = 6000;
const DEFAULT_TOTAL_BUDGET_CHARS = 24000;

/**
 * Nén nội dung file mã nguồn/tài liệu: loại bỏ dòng trống thừa,
 * cắt tỉa trailing whitespace và cắt tại ranh giới dòng hoàn chỉnh khi vượt ngân sách.
 */
export function compressFileContent(
  content: string,
  maxChars: number = DEFAULT_MAX_CHARS_PER_FILE,
  language = 'plaintext'
): string {
  if (!content) return '';

  // 1. Chuẩn hóa xuống dòng và loại bỏ trailing whitespace
  const normalized = content
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n');

  // 2. Thu gọn các khối dòng trống liên tiếp (nhiều hơn 2 dòng trống liên tiếp thành 1 dòng trống)
  const collapsed = normalized.replace(/\n{3,}/g, '\n\n').trim();

  // 3. Nếu dung lượng đã nằm trong giới hạn, trả về ngay
  if (collapsed.length <= maxChars) {
    return collapsed;
  }

  // 4. Cắt tại ranh giới dòng hoàn chỉnh gần maxChars nhất
  const sliceIndex = collapsed.lastIndexOf('\n', maxChars);
  const truncatedText = sliceIndex > 0 ? collapsed.slice(0, sliceIndex) : collapsed.slice(0, maxChars);

  const commentPrefix = language === 'python' || language === 'shellscript' ? '#' : '//';
  return `${truncatedText}\n\n${commentPrefix} ... [Đã nén và rút gọn phần còn lại để tối ưu hóa ngân sách ngữ cảnh] ...`;
}

/**
 * Điều phối nén toàn bộ danh sách files context để không vượt quá tổng hạn ngạch (Context Budget).
 */
export function compressContextFiles(
  files: ContextFile[],
  totalBudgetChars: number = DEFAULT_TOTAL_BUDGET_CHARS
): ContextFile[] {
  if (!files || files.length === 0) return [];

  // Tính toán ngân sách phân bổ trung bình cho mỗi file
  const maxPerFile = Math.max(2000, Math.floor(totalBudgetChars / files.length));

  let currentTotal = 0;
  const compressedFiles: ContextFile[] = [];

  for (const file of files) {
    if (currentTotal >= totalBudgetChars) break;

    const remainingBudget = totalBudgetChars - currentTotal;
    const allowedForThisFile = Math.min(maxPerFile, remainingBudget);

    const compressedContent = compressFileContent(file.content, allowedForThisFile, file.language);
    if (compressedContent.trim()) {
      compressedFiles.push({
        path: file.path,
        language: file.language,
        content: compressedContent
      });
      currentTotal += compressedContent.length;
    }
  }

  return compressedFiles;
}

/**
 * Nén Message Context (logic code tóm tắt hoặc chuỗi suy nghĩ) để không vượt quá hạn ngạch cho lượt suy nghĩ hiện tại.
 */
export function compressMessageContext(
  rawLogic: string,
  maxBudgetChars = 3500,
  userQuery = '',
  language = 'plaintext'
): string {
  if (!rawLogic) return '';

  const cleaned = rawLogic
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (cleaned.length <= maxBudgetChars) {
    return cleaned;
  }

  const lines = cleaned.split('\n');
  const queryTerms = userQuery
    .toLowerCase()
    .split(/[\s,.;:!?()[\]{}"'`]+/)
    .filter((w) => w.length >= 3);

  // Nếu người dùng có từ khóa cụ thể, ưu tiên giữ lại các dòng chứa từ khóa đó
  const priorityLines: string[] = [];
  const secondaryLines: string[] = [];

  for (const line of lines) {
    const lower = line.toLowerCase();
    const isPriority = queryTerms.some((term) => lower.includes(term));
    if (isPriority) {
      priorityLines.push(line);
    } else {
      secondaryLines.push(line);
    }
  }

  let result = priorityLines.join('\n');
  if (result.length < maxBudgetChars) {
    for (const sLine of secondaryLines) {
      if ((result + '\n' + sLine).length > maxBudgetChars - 120) break;
      result += '\n' + sLine;
    }
  } else {
    // Nếu chỉ riêng priority lines đã dài, cắt ở ranh giới dòng gần nhất
    const sliceIdx = result.lastIndexOf('\n', maxBudgetChars - 120);
    result = sliceIdx > 0 ? result.slice(0, sliceIdx) : result.slice(0, maxBudgetChars - 120);
  }

  const commentPrefix = language === 'python' || language === 'shellscript' ? '#' : '//';
  return `${result}\n\n${commentPrefix} ... [Đã nén Message Context để tối ưu hóa token cho lượt suy nghĩ tiếp theo] ...`;
}
