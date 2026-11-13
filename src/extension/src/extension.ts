import * as vscode from 'vscode';
import { SecretManager } from './security/secretStorage.js';
import { WorkerClient } from './api/workerClient.js';
import { SessionManager } from './history/localConversationStore.js';
import { ChatViewProvider } from './providers/ChatViewProvider.js';
import { registerConfigureConnectionCommand } from './commands/configureConnection.js';
import { registerCheckConnectionCommand } from './commands/checkConnection.js';
import { registerOpenChatCommand } from './commands/openChat.js';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const outputChannel = vscode.window.createOutputChannel('NesCode AI');
  context.subscriptions.push(outputChannel);

  const secretManager = new SecretManager(context.secrets);
  const client = new WorkerClient(secretManager);
  client.setOutputChannel(outputChannel);

  const sessionManager = new SessionManager(context.workspaceState);

  // 1. Đăng ký WebviewView Chat Panel với SessionManager theo workspace
  const chatProvider = new ChatViewProvider(context.extensionUri, client, sessionManager);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('nescode.chatView', chatProvider)
  );

  // 2. Đăng ký các câu lệnh của extension
  context.subscriptions.push(
    await registerConfigureConnectionCommand(secretManager, client)
  );
  context.subscriptions.push(
    registerCheckConnectionCommand(client)
  );
  context.subscriptions.push(
    registerOpenChatCommand()
  );

  outputChannel.appendLine('[NesCode] Tiện ích NesCode for Antigravity đã kích hoạt thành công.');

  // 3. Tự động kiểm tra cấu hình lần đầu khởi động
  const conn = await client.getConfig();
  if (!conn) {
    vscode.window
      .showInformationMessage(
        'Chào mừng đến với NesCode for Antigravity! Vui lòng cấu hình Cloudflare Worker URL và API Key để bắt đầu.',
        'Cấu Hình Ngay'
      )
      .then((action) => {
        if (action === 'Cấu Hình Ngay') {
          vscode.commands.executeCommand('nescode.configureConnection');
        }
      });
  } else {
    outputChannel.appendLine(`[NesCode] Worker URL hiện tại: ${conn.baseUrl}`);
  }
}

export function deactivate(): void {}
