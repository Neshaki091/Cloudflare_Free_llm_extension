import * as vscode from 'vscode';
import { ContextFile, isExcludedPath } from '../../../shared/src/index.js';
import { compressContextFiles } from './contextCompressor.js';

export interface WorkspaceSummary {
  rootUri: vscode.Uri;
  rootName: string;
  fileTree: string;
  manifestInfo?: string;
  fileCount: number;
}

/**
 * Kiểm tra xem một file/thư mục có thuộc danh sách loại trừ bảo mật không.
 */
export const isExcluded = isExcludedPath;

/**
 * Tính toán đường dẫn tương đối an toàn giữa baseUri và targetUri.
 */
function getRelativePath(baseUri: vscode.Uri, targetUri: vscode.Uri): string {
  const basePath = baseUri.path.replace(/\/+$/, '');
  const targetPath = targetUri.path;
  if (targetPath.startsWith(basePath)) {
    return targetPath.slice(basePath.length).replace(/^\/+/, '');
  }
  return vscode.workspace.asRelativePath(targetUri, false);
}

/**
 * Tự động tìm thư mục cha / thư mục gốc của dự án (Project Root).
 * Dò tìm từ workspaceFolders hoặc duyệt ngược từ active file lên trên để tìm .git, package.json, wrangler.jsonc.
 */
export async function findProjectRootUri(): Promise<{ uri: vscode.Uri; name: string } | null> {
  // 1. Kiểm tra workspaceFolders mở trong IDE
  const folders = vscode.workspace.workspaceFolders;
  if (folders && folders.length > 0) {
    const primaryFolderUri = folders[0]!.uri;
    // Kiểm tra xem primaryFolderUri có thư mục cha chứa .git hay package.json không (trường hợp mở thư mục con)
    const detectedParent = await searchUpwardsForRoot(primaryFolderUri);
    if (detectedParent) {
      return detectedParent;
    }
    return {
      uri: primaryFolderUri,
      name: folders[0]!.name
    };
  }

  // 2. Nếu không có workspaceFolder (chỉ mở file đơn lẻ), dò từ activeTextEditor
  const activeDoc = vscode.window.activeTextEditor?.document;
  if (activeDoc && activeDoc.uri.scheme === 'file') {
    const detected = await searchUpwardsForRoot(activeDoc.uri);
    if (detected) {
      return detected;
    }
    const parentDir = vscode.Uri.joinPath(activeDoc.uri, '..');
    const folderName = parentDir.path.split('/').filter(Boolean).pop() || 'workspace';
    return {
      uri: parentDir,
      name: folderName
    };
  }

  return null;
}

/**
 * Duyệt ngược lên các thư mục cha để tìm thư mục gốc chứa .git, package.json hoặc các file định danh dự án.
 */
async function searchUpwardsForRoot(startUri: vscode.Uri): Promise<{ uri: vscode.Uri; name: string } | null> {
  try {
    let currentDir = startUri;
    const stat = await vscode.workspace.fs.stat(startUri);
    if (stat.type !== vscode.FileType.Directory) {
      currentDir = vscode.Uri.joinPath(startUri, '..');
    }

    const markers = [
      '.git',
      'package.json',
      'requirements.txt',
      'pyproject.toml',
      'setup.py',
      'app.py',
      'main.py',
      'wrangler.jsonc',
      'wrangler.toml',
      'Cargo.toml',
      'go.mod'
    ];

    // Lặp ngược lên tối đa 6 cấp thư mục cha
    for (let depth = 0; depth < 6; depth++) {
      for (const marker of markers) {
        try {
          const markerUri = vscode.Uri.joinPath(currentDir, marker);
          await vscode.workspace.fs.stat(markerUri);
          const name = currentDir.path.split('/').filter(Boolean).pop() || 'project';
          return { uri: currentDir, name };
        } catch {
          // Marker không tồn tại ở cấp này
        }
      }

      const parentDir = vscode.Uri.joinPath(currentDir, '..');
      if (parentDir.path === currentDir.path) {
        break; // Đã tới thư mục gốc của ổ đĩa
      }
      currentDir = parentDir;
    }
  } catch {
    // Bỏ qua lỗi truy cập
  }

  return null;
}

/**
 * Thu thập cấu trúc cây thư mục workspace rút gọn cho Agent.
 */
export async function getWorkspaceSummary(maxFiles = 45, maxDepth = 3): Promise<WorkspaceSummary | null> {
  const rootInfo = await findProjectRootUri();
  if (!rootInfo) {
    return null;
  }

  const { uri: rootUri, name: rootName } = rootInfo;
  let totalFiles = 0;
  const lines: string[] = [];

  async function walk(dirUri: vscode.Uri, depth: number, prefix: string): Promise<void> {
    if (depth > maxDepth || totalFiles >= maxFiles) {
      return;
    }

    try {
      const entries = await vscode.workspace.fs.readDirectory(dirUri);
      entries.sort((a, b) => {
        if (a[1] === vscode.FileType.Directory && b[1] !== vscode.FileType.Directory) return -1;
        if (a[1] !== vscode.FileType.Directory && b[1] === vscode.FileType.Directory) return 1;
        return a[0].localeCompare(b[0]);
      });

      for (let i = 0; i < entries.length; i++) {
        if (totalFiles >= maxFiles) break;

        const [name, type] = entries[i]!;
        const itemUri = vscode.Uri.joinPath(dirUri, name);
        const relPath = getRelativePath(rootUri, itemUri);

        if (isExcluded(name, relPath)) {
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
    manifestInfo = `Dự án: ${pkg.name || 'N/A'} (v${pkg.version || '0.1.0'})\nDependencies chính: ${Object.keys(pkg.dependencies || {}).slice(0, 8).join(', ') || 'không có'}`;
  } catch {
    // Không có package.json
  }

  return {
    rootUri,
    rootName,
    fileTree: lines.join('\n'),
    manifestInfo,
    fileCount: totalFiles
  };
}

/**
 * Tự động đọc nội dung các file cốt lõi trong thư mục dự án và file liên quan đến câu hỏi.
 * Tối ưu hóa kích thước context để Workers AI phản hồi tức thì và không bị nghẽn stream.
 */
export async function collectProjectContextFiles(
  rootUri: vscode.Uri,
  promptText: string,
  activeDoc?: vscode.TextDocument
): Promise<ContextFile[]> {
  const result: ContextFile[] = [];
  const readPaths = new Set<string>();

  async function tryReadFile(relativeFilePath: string, maxChars = 2500): Promise<boolean> {
    const normalized = relativeFilePath.replace(/\\/g, '/').replace(/^\/+/, '');
    if (readPaths.has(normalized)) return false;

    const baseName = normalized.split('/').pop() || '';
    if (isExcluded(baseName, normalized)) return false;

    try {
      const fileUri = vscode.Uri.joinPath(rootUri, normalized);
      const stat = await vscode.workspace.fs.stat(fileUri);
      if (stat.type !== vscode.FileType.File) return false;

      if (stat.size > 200 * 1024) return false;

      const bytes = await vscode.workspace.fs.readFile(fileUri);
      const content = new TextDecoder('utf-8').decode(bytes);
      if (!content.trim()) return false;

      const lang = getLanguageFromPath(normalized);
      result.push({
        path: normalized,
        language: lang,
        content: content.slice(0, maxChars)
      });
      readPaths.add(normalized);
      return true;
    } catch {
      return false;
    }
  }

  // 1. Đọc tệp tiến độ Task Board (chứa thông tin chính xác cột mốc nào đã xong, cột mốc nào đang làm)
  const taskPaths = [
    'journal/tasks/TASK_BOARD.md',
    'TASK_BOARD.md',
    'TODO.md'
  ];
  for (const tPath of taskPaths) {
    if (await tryReadFile(tPath, 3000)) break;
  }

  // 2. Đọc tệp tổng quan dự án (README.md)
  const docPaths = [
    'README.md',
    'journal/requirements/SRS.md'
  ];
  for (const dPath of docPaths) {
    if (await tryReadFile(dPath, 3000)) break;
  }

  // 3. Đọc manifest dự án (package.json, requirements.txt, pyproject.toml)
  const manifestCandidates = ['package.json', 'requirements.txt', 'pyproject.toml', 'Cargo.toml', 'go.mod'];
  for (const mPath of manifestCandidates) {
    await tryReadFile(mPath, 2000);
  }

  // 4. Tự động tìm và nạp các entry point / file mã nguồn cốt lõi của dự án (Python, TS, JS, Go, Rust)
  const coreEntryCandidates = [
    'app.py',
    'main.py',
    'server.py',
    'manage.py',
    'src/index.ts',
    'src/app.ts',
    'src/main.ts',
    'src/server.ts',
    'index.js',
    'app.js',
    'server.js',
    'main.go',
    'src/main.rs',
    'index.html'
  ];
  for (const entryPath of coreEntryCandidates) {
    if (result.length >= 8) break;
    await tryReadFile(entryPath, 5000);
  }

  // 5. Quét tệp được nhắc tên cụ thể trong prompt của người dùng (có hoặc không có đuôi mở rộng)
  const fileMentionRegex = /(?:[\w.-]+[\\/])*[\w.-]+\.(?:ts|js|tsx|jsx|json|md|html|css|py|rs|go|ps1|yml|yaml)/gi;
  const matches = promptText.match(fileMentionRegex);
  if (matches) {
    for (const match of matches) {
      if (result.length >= 10) break;
      const cleanMatch = match.replace(/^[./\\]+/, '').trim();
      const ok = await tryReadFile(cleanMatch, 5000);
      if (!ok) {
        try {
          const fileNameOnly = cleanMatch.split(/[\\/]/).pop();
          if (fileNameOnly) {
            const foundUris = await vscode.workspace.findFiles(`**/${fileNameOnly}`, '**/node_modules/**', 1);
            for (const fUri of foundUris) {
              const rel = getRelativePath(rootUri, fUri);
              await tryReadFile(rel, 5000);
              break;
            }
          }
        } catch {
          // Bỏ qua lỗi
        }
      }
    }
  }

  // 6. Quét từ khóa tiềm năng trong câu hỏi (ví dụ: "app", "scanners", "scanner", "model", "primes")
  const potentialWords = promptText
    .split(/[\s,.;:!?()[\]{}"'`]+/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length >= 3 && !['cho', 'tôi', 'hãy', 'xem', 'code', 'file', 'kiem', 'tra', 'chay', 'du', 'an', 'nay', 'lam', 'the', 'nao', 'what', 'this', 'that', 'with'].includes(w));

  for (const word of potentialWords) {
    if (result.length >= 8) break;
    try {
      const matchedUris = await vscode.workspace.findFiles(
        `**/*${word}*.{py,ts,js,tsx,jsx,go,rs,json}`,
        '{**/node_modules/**,**/.git/**,**/dist/**,**/build/**,**/.venv/**}',
        2
      );
      for (const fUri of matchedUris) {
        const rel = getRelativePath(rootUri, fUri);
        await tryReadFile(rel, 5000);
        if (result.length >= 8) break;
      }
    } catch {
      // Bỏ qua
    }
  }

  // 7. Tự động phân giải các module được import trong code đã nạp (Dependency/Import Crawling)
  const importedModuleCandidates = new Set<string>();
  for (const existingFile of result) {
    if (existingFile.language === 'python' || existingFile.path.endsWith('.py')) {
      // Regex trích xuất 'from xyz import ...' hoặc 'import xyz'
      const pyImportRegex = /(?:from\s+([a-zA-Z0-9_.]+)\s+import\s+([a-zA-Z0-9_,\s]+)|import\s+([a-zA-Z0-9_.]+))/g;
      let m: RegExpExecArray | null;
      while ((m = pyImportRegex.exec(existingFile.content)) !== null) {
        if (m[1]) {
          const modPath = m[1].replace(/\./g, '/');
          importedModuleCandidates.add(`${modPath}.py`);
          if (m[2]) {
            const subItems = m[2].split(',').map((s) => s.trim()).filter(Boolean);
            for (const sub of subItems) {
              importedModuleCandidates.add(`${modPath}/${sub}.py`);
            }
          }
        } else if (m[3]) {
          const modPath = m[3].replace(/\./g, '/');
          importedModuleCandidates.add(`${modPath}.py`);
        }
      }
    } else if (['typescript', 'javascript'].includes(existingFile.language)) {
      const jsImportRegex = /(?:from|import)\s+['"]([.\\/a-zA-Z0-9_-]+)['"]/g;
      let m: RegExpExecArray | null;
      while ((m = jsImportRegex.exec(existingFile.content)) !== null) {
        const importPath = m[1]!.replace(/^\.\//, '');
        importedModuleCandidates.add(`${importPath}.ts`);
        importedModuleCandidates.add(`${importPath}.js`);
      }
    }
  }

  for (const modCandidate of importedModuleCandidates) {
    if (result.length >= 10) break;
    await tryReadFile(modCandidate, 4000);
  }

  // 8. Tự động khám phá các file mã nguồn cốt lõi trong toàn bộ workspace (scanners/**, routes/**, templates/**, etc.)
  try {
    const commonCodeFiles = await vscode.workspace.findFiles(
      '**/*.{py,ts,js,tsx,jsx,go,rs,html,css}',
      '{**/node_modules/**,**/.git/**,**/dist/**,**/build/**,**/.venv/**,**/venv/**,**/__pycache__/**}',
      15
    );
    for (const fUri of commonCodeFiles) {
      if (result.length >= 10) break;
      const rel = getRelativePath(rootUri, fUri);
      await tryReadFile(rel, 3500);
    }
  } catch {
    // Bỏ qua
  }

  // 9. Nếu có active editor và chưa được đọc, thêm vào (tối đa 4000 ký tự)
  if (activeDoc && activeDoc.uri.scheme === 'file') {
    const activeRelPath = getRelativePath(rootUri, activeDoc.uri);
    const activeBaseName = activeRelPath.split(/[\\/]/).pop() || '';
    if (!readPaths.has(activeRelPath) && !isExcluded(activeBaseName, activeRelPath)) {
      const content = activeDoc.getText();
      if (content.trim()) {
        result.push({
          path: activeRelPath,
          language: activeDoc.languageId,
          content: content.slice(0, 4000)
        });
      }
    }
  }

  // 10. Nén ngữ cảnh thông minh: phân bổ ngân sách, loại bỏ dòng trống thừa và bảo toàn code
  return compressContextFiles(result, 24000);
}

function getLanguageFromPath(pathStr: string): string {
  const ext = pathStr.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts': return 'typescript';
    case 'tsx': return 'typescriptreact';
    case 'js':
    case 'mjs':
    case 'cjs': return 'javascript';
    case 'json':
    case 'jsonc': return 'json';
    case 'md': return 'markdown';
    case 'html': return 'html';
    case 'css': return 'css';
    case 'ps1': return 'powershell';
    case 'py': return 'python';
    case 'rs': return 'rust';
    case 'go': return 'go';
    default: return 'plaintext';
  }
}
