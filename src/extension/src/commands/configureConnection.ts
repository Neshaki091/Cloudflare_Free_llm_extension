import * as vscode from 'vscode';
import { SecretManager } from '../security/secretStorage.js';
import { WorkerClient } from '../api/workerClient.js';

export async function registerConfigureConnectionCommand(
  secretManager: SecretManager,
  client: WorkerClient
): Promise<vscode.Disposable> {
  return vscode.commands.registerCommand('nescode.configureConnection', async () => {
    const config = vscode.workspace.getConfiguration('nescode');
    const currentUrl = config.get<string>('apiBaseUrl', '');

    // 1. Nhập Worker URL
    const enteredUrl = await vscode.window.showInputBox({
      title: 'NesCode: Cấu Hình Worker URL',
      prompt: 'Nhập địa chỉ Cloudflare Worker của bạn (ví dụ: https://nescode-ai-gateway.xxx.workers.dev)',
      value: currentUrl || 'https://',
      ignoreFocusOut: true,
      validateInput: (value) => {
        const trimmed = value.trim();
        if (!trimmed) {
          return 'URL không được để trống.';
        }
        if (!trimmed.startsWith('https://') && !trimmed.startsWith('http://localhost') && !trimmed.startsWith('http://127.0.0.1')) {
          return 'Worker URL bắt buộc phải sử dụng giao thức bảo mật HTTPS (trừ localhost khi dev).';
        }
        return null;
      }
    });

    if (enteredUrl === undefined) {
      return; // Người dùng nhấn Esc
    }

    // 2. Nhập API Key
    const currentKey = await secretManager.getApiKey();
    const enteredKey = await vscode.window.showInputBox({
      title: 'NesCode: Cấu Hình API Key',
      prompt: 'Nhập khóa NESCODE_API_KEY mà bạn đã đặt trên Worker (Được lưu mã hóa an toàn trong SecretStorage)',
      password: true,
      value: currentKey || '',
      ignoreFocusOut: true,
      validateInput: (value) => {
        if (!value.trim()) {
          return 'API Key không được để trống.';
        }
        return null;
      }
    });

    if (enteredKey === undefined) {
      return;
    }

    // 3. Lưu cấu hình
    const cleanUrl = enteredUrl.trim().replace(/\/+$/, '');
    await config.update('apiBaseUrl', cleanUrl, vscode.ConfigurationTarget.Global);
    await secretManager.setApiKey(enteredKey.trim());

    // 4. Kiểm tra kết nối ngay lập tức
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'NesCode: Đang kiểm tra kết nối tới Cloudflare Worker...',
        cancellable: false
      },
      async () => {
        const health = await client.checkHealth();
        if (health.ok && health.data) {
          vscode.window.showInformationMessage(
            `Kết nối thành công! Worker: ${health.data.service} (Model: ${health.data.defaultModel})`
          );
        } else {
          vscode.window.showWarningMessage(
            `Đã lưu cấu hình nhưng kiểm tra kết nối thất bại: ${health.error}`
          );
        }
      }
    );
  });
}
