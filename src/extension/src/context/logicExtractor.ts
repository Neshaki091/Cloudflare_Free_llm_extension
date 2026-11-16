/**
 * Module trích xuất cấu trúc logic cốt lõi (Code Skeleton & Signatures) của mã nguồn.
 * Giúp tạo Message Context tinh gọn cho Agent suy nghĩ mà không làm phình to Token Budget.
 */

export interface LogicExtractionResult {
  path: string;
  language: string;
  logicOutline: string;
  symbolNames: string[];
  totalOriginalLines: number;
  extractedLines: number;
}

/**
 * Trích xuất cấu trúc logic của file Python: imports, classes, functions, docstrings và main flow.
 */
function extractPythonLogic(content: string): { outline: string; symbols: string[] } {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const resultLines: string[] = [];
  const symbols: string[] = [];

  let inDocstring = false;
  let docstringQuote = '';
  let insideFuncOrClass = false;
  let currentIndent = 0;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]!;
    const trimmed = rawLine.trim();

    // 1. Xử lý multi-line docstring
    if (!inDocstring && (trimmed.startsWith('"""') || trimmed.startsWith("'''"))) {
      inDocstring = true;
      docstringQuote = trimmed.slice(0, 3);
      resultLines.push(rawLine);
      if (trimmed.length > 3 && trimmed.endsWith(docstringQuote)) {
        inDocstring = false;
      }
      continue;
    }
    if (inDocstring) {
      resultLines.push(rawLine);
      if (trimmed.endsWith(docstringQuote)) {
        inDocstring = false;
      }
      continue;
    }

    // 2. Giữ lại import statements
    if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
      resultLines.push(rawLine);
      continue;
    }

    // 3. Giữ lại decorators (@app.route, @staticmethod, etc.)
    if (trimmed.startsWith('@')) {
      resultLines.push(rawLine);
      continue;
    }

    // 4. Nhận diện Class definition
    if (trimmed.startsWith('class ')) {
      const match = trimmed.match(/^class\s+([A-Za-z0-9_]+)/);
      if (match && match[1]) {
        symbols.push(match[1]);
      }
      resultLines.push(rawLine);
      continue;
    }

    // 5. Nhận diện Function / Method definition
    if (trimmed.startsWith('def ') || trimmed.startsWith('async def ')) {
      const match = trimmed.match(/^(?:async\s+)?def\s+([A-Za-z0-9_]+)/);
      if (match && match[1]) {
        symbols.push(match[1]);
      }
      resultLines.push(rawLine);

      // Nếu dòng tiếp theo là docstring, giữ lại docstring
      const nextLine = lines[i + 1]?.trim() || '';
      if (nextLine.startsWith('"""') || nextLine.startsWith("'''")) {
        continue;
      } else {
        // Rút gọn thân hàm bằng placeholder
        const indentMatch = rawLine.match(/^(\s*)/);
        const indent = (indentMatch ? indentMatch[1] : '') + '    ';
        resultLines.push(`${indent}... # [logic thực thi]`);
      }
      continue;
    }

    // 6. Nhận diện main execution block hoặc biến toàn cục quan trọng
    if (trimmed.startsWith('if __name__') || trimmed.startsWith('app =') || trimmed.startsWith('router =')) {
      resultLines.push(rawLine);
      continue;
    }
  }

  // Nếu file quá ngắn hoặc không có hàm/lớp rõ ràng, trả về toàn bộ
  if (resultLines.length < 5 && lines.length < 50) {
    return { outline: content, symbols };
  }

  return { outline: resultLines.join('\n'), symbols };
}

/**
 * Trích xuất cấu trúc logic của file TypeScript/JavaScript: imports, types, interfaces, classes, functions.
 */
function extractTsJsLogic(content: string): { outline: string; symbols: string[] } {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const resultLines: string[] = [];
  const symbols: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]!;
    const trimmed = rawLine.trim();

    // 1. Imports
    if (trimmed.startsWith('import ') || trimmed.startsWith('require(')) {
      resultLines.push(rawLine);
      continue;
    }

    // 2. Types & Interfaces
    if (trimmed.startsWith('export interface ') || trimmed.startsWith('interface ') ||
        trimmed.startsWith('export type ') || trimmed.startsWith('type ') ||
        trimmed.startsWith('export enum ') || trimmed.startsWith('enum ')) {
      resultLines.push(rawLine);
      const match = trimmed.match(/(?:interface|type|enum)\s+([A-Za-z0-9_]+)/);
      if (match && match[1]) symbols.push(match[1]);
      continue;
    }

    // 3. Classes
    if (trimmed.startsWith('export class ') || trimmed.startsWith('class ') ||
        trimmed.startsWith('export abstract class ')) {
      resultLines.push(rawLine);
      const match = trimmed.match(/class\s+([A-Za-z0-9_]+)/);
      if (match && match[1]) symbols.push(match[1]);
      continue;
    }

    // 4. Functions & Exported Consts
    if (trimmed.match(/^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)/) ||
        trimmed.match(/^(?:export\s+)?(?:const|let)\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?\(/)) {
      resultLines.push(rawLine);
      const match = trimmed.match(/(?:function|(?:const|let))\s+([A-Za-z0-9_]+)/);
      if (match && match[1]) symbols.push(match[1]);

      const indentMatch = rawLine.match(/^(\s*)/);
      const indent = (indentMatch ? indentMatch[1] : '') + '  ';
      resultLines.push(`${indent}// ... [logic thực thi]`);
      continue;
    }

    // 5. Method in class
    if (trimmed.match(/^(?:public|private|protected|async|static|\*)\s+([A-Za-z0-9_]+)\s*\(/)) {
      resultLines.push(rawLine);
      const match = trimmed.match(/([A-Za-z0-9_]+)\s*\(/);
      if (match && match[1]) symbols.push(match[1]);
      continue;
    }
  }

  if (resultLines.length < 5 && lines.length < 50) {
    return { outline: content, symbols };
  }

  return { outline: resultLines.join('\n'), symbols };
}

/**
 * Trích xuất logic của bất kỳ file nào dựa trên ngôn ngữ.
 */
export function extractCodeLogic(
  filePath: string,
  content: string,
  language: string
): LogicExtractionResult {
  const normalizedLang = language.toLowerCase();
  const totalOriginalLines = content.split(/\r?\n/).length;

  let extracted: { outline: string; symbols: string[] };

  if (normalizedLang === 'python' || filePath.endsWith('.py')) {
    extracted = extractPythonLogic(content);
  } else if (
    ['typescript', 'javascript', 'typescriptreact', 'javascriptreact'].includes(normalizedLang) ||
    filePath.match(/\.(?:ts|js|tsx|jsx|mjs|cjs)$/)
  ) {
    extracted = extractTsJsLogic(content);
  } else {
    // Với các ngôn ngữ khác, lọc bỏ các dòng trống dư thừa
    const cleaned = content.replace(/\n{3,}/g, '\n\n').trim();
    extracted = { outline: cleaned, symbols: [] };
  }

  const extractedLines = extracted.outline.split('\n').length;

  return {
    path: filePath,
    language,
    logicOutline: extracted.outline,
    symbolNames: extracted.symbols,
    totalOriginalLines,
    extractedLines
  };
}
