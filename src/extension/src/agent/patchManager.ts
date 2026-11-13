import * as vscode from 'vscode';

export interface ApplyFileResult {
  ok: boolean;
  message: string;
  uri?: vscode.Uri;
}

/**
 * Áp dụng nội dung file do AI Agent đề xuất vào workspace của người dùng
 * (Tuân thủ Stale Document Protection và Human Approval Gate).
 */
export async function applyFileChange(
  relativePath: string,
  newContent: string
): Promise<ApplyFileResult> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    return { ok: false, message: 'Không tìm thấy workspace đang mở.' };
  }

  const cleanPath = relativePath.trim().replace(/\\/g, '/').replace(/^\/+/, '');
  if (!cleanPath || cleanPath.includes('..')) {
    return { ok: false, message: 'Đường dẫn file không an toàn hoặc chứa path traversal.' };
  }

  const targetUri = vscode.Uri.joinPath(folders[0]!.uri, cleanPath);

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
 * Thực thi câu lệnh Terminal do AI đề xuất sau khi người dùng phê duyệt
 */
export async function executeTerminalCommand(commandText: string): Promise<boolean> {
  const cleanCmd = commandText.trim();
  if (!cleanCmd) return false;

  // Mở hoặc tạo Terminal của NesCode AI
  let terminal = vscode.window.terminals.find((t) => t.name === 'NesCode Terminal');
  if (!terminal) {
    terminal = vscode.window.createTerminal('NesCode Terminal');
  }

  terminal.show();
  terminal.sendText(cleanCmd);
  return true;
}
