/**
 * Danh sách tên thư mục bị cấm tuyệt đối đưa vào context hoặc chỉnh sửa.
 */
export const EXCLUDED_DIRECTORIES = [
  'node_modules',
  '.git',
  '.antigravity-ide',
  '.gemini',
  'dist',
  'build',
  'coverage',
  '.next',
  '.venv',
  'venv',
  '__pycache__',
  '.idea',
  '.vscode'
] as const;

/**
 * Kiểm tra xem một file hoặc thư mục có thuộc danh sách loại trừ bảo mật không.
 */
export function isExcludedPath(name: string, relativePath: string): boolean {
  const lowerName = name.toLowerCase();
  const lowerPath = relativePath.toLowerCase().replace(/\\/g, '/');

  for (const dir of EXCLUDED_DIRECTORIES) {
    if (lowerName === dir || lowerPath.startsWith(dir + '/') || lowerPath.includes('/' + dir + '/')) {
      return true;
    }
  }

  // File nhạy cảm / bí mật
  if (
    lowerName === '.env' ||
    lowerName.startsWith('.env.') ||
    lowerName.endsWith('.pem') ||
    lowerName.endsWith('.key') ||
    lowerName.includes('credentials') ||
    lowerName.includes('secret')
  ) {
    return true;
  }

  return false;
}

/**
 * Chuẩn hóa và xác thực đường dẫn tương đối, ngăn chặn Path Traversal.
 * Trả về đường dẫn chuẩn hóa hoặc null nếu không an toàn.
 */
export function sanitizeRelativePath(rawPath: string): string | null {
  if (!rawPath || typeof rawPath !== 'string') {
    return null;
  }

  const normalized = rawPath.trim().replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalized) {
    return null;
  }

  // Chống Path Traversal: không được chứa .. hoặc segment rỗng nguy hiểm
  const segments = normalized.split('/');
  for (const seg of segments) {
    if (seg === '..' || seg === '.') {
      return null;
    }
  }

  return normalized;
}
