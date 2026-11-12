import * as vscode from 'vscode';
import { SecretManager } from './security/secretStorage.js';
import { WorkerClient } from './api/workerClient.js';
import { ChatViewProvider } from './providers/ChatViewProvider.js';
import { registerConfigureConnectionCommand } from './commands/configureConnection.js';
import { registerCheckConnectionCommand } from './commands/checkConnection.js';
import { registerOpenChatCommand } from './commands/openChat.js';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const secretManager = new SecretManager(context.secrets);
  const client = new WorkerClient(secretManager);

  // 1. Đăng ký WebviewView Chat Panel
  const chatProvider = new ChatViewProvider(context.extensionUri, client);
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

  // 3. Tự động kiểm tra cấu hình lần đầu khởi động
  const conn = await client.getConfig();
  if (!conn) {
    // Nếu chưa cấu hình, gợi ý người dùng cấu hình
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
  }
}

export function deactivate(): void {}
