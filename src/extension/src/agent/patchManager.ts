import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { findProjectRootUri } from '../context/workspaceContext.js';

export interface ApplyFileResult {
  ok: boolean;
  message: string;
  uri?: vscode.Uri;
}

/**
 * Hiển thị giao diện so sánh trực quan (Diff Preview) giữa file hiện tại và đề xuất của AI.
 * Tuân thủ SRS FR-032 & FR-034.
 */
export async function previewFileDiff(relativePath: string, newContent: string): Promise<boolean> {
  const rootInfo = await findProjectRootUri();
  if (!rootInfo) {
    vscode.window.showErrorMessage('[NesCode] Không tìm thấy thư mục dự án đang mở.');
    return false;
  }

  const cleanPath = relativePath.trim().replace(/\\/g, '/').replace(/^\/+/, '');
  if (!cleanPath || cleanPath.includes('..')) {
    vscode.window.showErrorMessage('[NesCode] Đường dẫn file không an toàn.');
    return false;
  }

  const targetUri = vscode.Uri.joinPath(rootInfo.uri, cleanPath);

  try {
    const fileName = path.basename(cleanPath);
    const tempDir = path.join(os.tmpdir(), 'nescode_diff_previews');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Tệp tạm chứa nội dung mới đề xuất từ AI
    const tempFilePath = path.join(tempDir, `proposed_${Date.now()}_${fileName}`);
    fs.writeFileSync(tempFilePath, newContent, 'utf-8');
    const previewUri = vscode.Uri.file(tempFilePath);

    // Xác định URI file gốc
    let originalUri = targetUri;
    try {
      await vscode.workspace.fs.stat(targetUri);
    } catch {
      // Nếu file chưa tồn tại (tạo file mới), dùng file rỗng làm gốc để diff
      const emptyOrigPath = path.join(tempDir, `empty_${Date.now()}_${fileName}`);
      fs.writeFileSync(emptyOrigPath, '', 'utf-8');
      originalUri = vscode.Uri.file(emptyOrigPath);
    }

    const diffTitle = `So Sánh: ${cleanPath} (Gốc ⟷ AI Đề Xuất)`;
    await vscode.commands.executeCommand('vscode.diff', originalUri, previewUri, diffTitle);
    return true;
  } catch (err: any) {
    vscode.window.showErrorMessage(`[NesCode] Không thể mở Diff Preview: ${err?.message || err}`);
    return false;
  }
}

/**
 * Áp dụng nội dung file do AI Agent đề xuất vào workspace của người dùng
 * (Tuân thủ Stale Document Protection và Human Approval Gate).
 */
export async function applyFileChange(
  relativePath: string,
  newContent: string
): Promise<ApplyFileResult> {
  const rootInfo = await findProjectRootUri();
  if (!rootInfo) {
    return { ok: false, message: 'Không tìm thấy thư mục dự án đang mở.' };
  }

  const cleanPath = relativePath.trim().replace(/\\/g, '/').replace(/^\/+/, '');
  if (!cleanPath || cleanPath.includes('..')) {
    return { ok: false, message: 'Đường dẫn file không an toàn hoặc chứa path traversal.' };
  }

  const targetUri = vscode.Uri.joinPath(rootInfo.uri, cleanPath);

  // Bảo vệ thay đổi ngầm (Stale Document Protection):
  // Nếu người dùng đang mở file và có chỉnh sửa chưa lưu (dirty)
  const openDoc = vscode.workspace.textDocuments.find(
    (d) => d.uri.fsPath.toLowerCase() === targetUri.fsPath.toLowerCase()
  );

  if (openDoc && openDoc.isDirty) {
    const choice = await vscode.window.showWarningMessage(
      `Tệp '${cleanPath}' đang có các thay đổi chưa lưu trong trình soạn thảo. Bạn có chắc muốn ghi đè nội dung do AI đề xuất không?`,
      { modal: true },
      'Ghi Đè',
      'Hủy Bỏ'
    );

    if (choice !== 'Ghi Đè') {
      return {
        ok: false,
        message: `Đã hủy áp dụng thay đổi cho '${cleanPath}' vì tệp có sửa đổi chưa lưu.`
      };
    }
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(newContent);
    await vscode.workspace.fs.writeFile(targetUri, data);

    // Mở tài liệu để người dùng thấy ngay trên màn hình soạn thảo
    const doc = await vscode.workspace.openTextDocument(targetUri);
    await vscode.window.showTextDocument(doc, { preview: false });

    return {
      ok: true,
      message: `Đã cập nhật thành công file: ${cleanPath}`,
      uri: targetUri
    };
  } catch (err: any) {
    return {
      ok: false,
      message: `Lỗi khi ghi file ${cleanPath}: ${err?.message || err}`
    };
  }
}

/**
 * Mở một file trong trình soạn thảo của Antigravity IDE.
 */
export async function openFileInEditor(relativePath: string): Promise<boolean> {
  const rootInfo = await findProjectRootUri();
  if (!rootInfo) return false;

  const cleanPath = relativePath.trim().replace(/\\/g, '/').replace(/^\/+/, '');
  if (!cleanPath || cleanPath.includes('..')) return false;

  const targetUri = vscode.Uri.joinPath(rootInfo.uri, cleanPath);
  try {
    const doc = await vscode.workspace.openTextDocument(targetUri);
    await vscode.window.showTextDocument(doc, { preview: false });
    return true;
  } catch {
    return false;
  }
}

/**
 * Thực thi câu lệnh Terminal do AI đề xuất sau khi người dùng phê duyệt
 */
export async function executeTerminalCommand(commandText: string): Promise<boolean> {
  const cleanCmd = commandText.trim();
  if (!cleanCmd) return false;

  let terminal = vscode.window.terminals.find((t) => t.name === 'NesCode Terminal');
  if (!terminal) {
    terminal = vscode.window.createTerminal('NesCode Terminal');
  }

  terminal.show();
  terminal.sendText(cleanCmd);
  return true;
}
