import * as vscode from 'vscode';
import { DEFAULT_EXCLUDE_PATTERNS } from '../../../shared/src/index.js';

export interface WorkspaceSummary {
  rootName: string;
  fileTree: string;
  manifestInfo?: string;
  fileCount: number;
}

/**
 * Kiểm tra xem một file/thư mục có thuộc danh sách loại trừ bảo mật không.
 */
function isExcluded(name: string, relativePath: string): boolean {
  const lowerName = name.toLowerCase();
  const lowerPath = relativePath.toLowerCase().replace(/\\/g, '/');

  // Thư mục cấm tuyệt đối
  const excludedDirs = [
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
  ];

  for (const dir of excludedDirs) {
    if (lowerName === dir || lowerPath.startsWith(dir + '/') || lowerPath.includes('/' + dir + '/')) {
      return true;
    }
  }

  // File nhạy cảm / bí mật cấm tuyệt đối
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
 * Thu thập cấu trúc cây thư mục workspace rút gọn cho Agent.
 */
export async function getWorkspaceSummary(maxFiles = 60, maxDepth = 3): Promise<WorkspaceSummary | null> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    return null;
  }

  const rootUri = folders[0]!.uri;
  const rootName = folders[0]!.name;

  let totalFiles = 0;
  const lines: string[] = [];

  async function walk(dirUri: vscode.Uri, depth: number, prefix: string): Promise<void> {
    if (depth > maxDepth || totalFiles >= maxFiles) {
      return;
    }

    try {
      const entries = await vscode.workspace.fs.readDirectory(dirUri);
      // Sắp xếp: Thư mục trước, file sau
      entries.sort((a, b) => {
        if (a[1] === vscode.FileType.Directory && b[1] !== vscode.FileType.Directory) return -1;
        if (a[1] !== vscode.FileType.Directory && b[1] === vscode.FileType.Directory) return 1;
        return a[0].localeCompare(b[0]);
      });

      for (let i = 0; i < entries.length; i++) {
        if (totalFiles >= maxFiles) break;

        const [name, type] = entries[i]!;
        const itemUri = vscode.Uri.joinPath(dirUri, name);
        const relativePath = vscode.workspace.asRelativePath(itemUri, false);

        if (isExcluded(name, relativePath)) {
          continue;
        }

        const isLast = i === entries.length - 1;
        const pointer = isLast ? '└── ' : '├── ';
        const nextPrefix = prefix + (isLast ? '    ' : '│   ');

        if (type === vscode.FileType.Directory) {
          lines.push(`${prefix}${pointer}📁 ${name}/`);
          await walk(itemUri, depth + 1, nextPrefix);
        } else if (type === vscode.FileType.File) {
          totalFiles++;
          lines.push(`${prefix}${pointer}📄 ${name}`);
        }
      }
    } catch {
      // Bỏ qua nếu không đọc được quyền thư mục
    }
  }

  await walk(rootUri, 1, '');

  // Đọc tóm tắt package.json nếu có
  let manifestInfo: string | undefined;
  try {
    const pkgUri = vscode.Uri.joinPath(rootUri, 'package.json');
    const bytes = await vscode.workspace.fs.readFile(pkgUri);
    const text = new TextDecoder('utf-8').decode(bytes);
    const pkg = JSON.parse(text);
    manifestInfo = `Tên gói: ${pkg.name || 'N/A'}, Phiên bản: ${pkg.version || 'N/A'}\nDependencies: ${Object.keys(pkg.dependencies || {}).join(', ') || 'không có'}\nDevDependencies: ${Object.keys(pkg.devDependencies || {}).join(', ') || 'không có'}`;
  } catch {
    // Không có package.json
  }

  return {
    rootName,
    fileTree: lines.join('\n'),
    manifestInfo,
    fileCount: totalFiles
  };
}
