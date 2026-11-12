import * as vscode from 'vscode';
import { WorkerClient } from '../api/workerClient.js';

export function registerCheckConnectionCommand(client: WorkerClient): vscode.Disposable {
  return vscode.commands.registerCommand('nescode.checkConnection', async () => {
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'NesCode: Đang kiểm tra trạng thái kết nối Cloudflare Worker...',
        cancellable: false
      },
      async () => {
        const health = await client.checkHealth();
        if (health.ok && health.data) {
          vscode.window.showInformationMessage(
            `Trạng thái: ĐÃ KẾT NỐI (Connected) | Model: ${health.data.defaultModel} | Streaming: ${health.data.streamingEnabled ? 'Bật' : 'Tắt'}`
          );
        } else {
          const action = await vscode.window.showErrorMessage(
            `Trạng thái: MẤT KẾT NỐI (Disconnected) | ${health.error}`,
            'Cấu Hình Lại'
          );
          if (action === 'Cấu Hình Lại') {
            vscode.commands.executeCommand('nescode.configureConnection');
          }
        }
      }
    );
  });
}

