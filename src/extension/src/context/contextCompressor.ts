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
