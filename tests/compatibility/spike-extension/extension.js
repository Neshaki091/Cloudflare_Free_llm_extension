// @ts-check
const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  const channel = vscode.window.createOutputChannel('NesCode Spike Diagnostics');
  const startTime = new Date().toISOString();

  channel.appendLine('====================================================');
  channel.appendLine('[NesCode Spike] Extension activate() triggered successfully!');
  channel.appendLine(`[NesCode Spike] Timestamp: ${startTime}`);
  channel.appendLine(`[NesCode Spike] Host VS Code API Version: ${vscode.version}`);
  channel.appendLine(`[NesCode Spike] Node.js Runtime Version: ${process.version}`);
  channel.appendLine(`[NesCode Spike] Platform: ${process.platform} (${process.arch})`);
  channel.appendLine('====================================================');

  // Diagnostic helper functions
  async function testSecretStorage() {
    const testKey = 'nescode_spike_secret_test';
    const testValue = `test-secret-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    try {
      await context.secrets.store(testKey, testValue);
      const retrieved = await context.secrets.get(testKey);
      const isMatch = (retrieved === testValue);
      return {
        pass: isMatch,
        key: testKey,
        value: testValue,
        retrieved: retrieved,
        message: isMatch
          ? 'SecretStorage ghi và đọc lại thành công (Match 100%)'
          : 'SecretStorage đọc lại không khớp giá trị ghi'
      };
    } catch (err) {
      return {
        pass: false,
        error: String(err && err.message ? err.message : err),
        message: 'Lỗi thực thi SecretStorage: ' + String(err)
      };
    }
  }

  function testWorkspaceContext() {
    try {
      const editor = vscode.window.activeTextEditor;
      const workspaceFolders = vscode.workspace.workspaceFolders || [];
      const result = {
        pass: true,
        hasActiveEditor: Boolean(editor),
        workspaceCount: workspaceFolders.length,
        workspacePaths: workspaceFolders.map(w => w.uri.fsPath),
        activeFile: null,
        languageId: null,
        selectionText: '',
        message: ''
      };

      if (editor) {
        result.activeFile = editor.document.fileName;
        result.languageId = editor.document.languageId;
        const selection = editor.selection;
        result.selectionText = editor.document.getText(selection);
        result.message = `Active file: ${editor.document.fileName} (Ngôn ngữ: ${editor.document.languageId}, Vùng chọn: ${result.selectionText.length} ký tự)`;
      } else {
        result.message = `Không có editor nào đang mở. Workspace folders: ${workspaceFolders.length}`;
      }
      return result;
    } catch (err) {
      return {
        pass: false,
        error: String(err && err.message ? err.message : err),
        message: 'Lỗi đọc Workspace context: ' + String(err)
      };
    }
  }

  async function runAllDiagnostics() {
    channel.appendLine('\n--- [BẮT ĐẦU CHẠY KIỂM CHỨNG TỔNG THỂ] ---');
    const secretResult = await testSecretStorage();
    channel.appendLine(`[SecretStorage] ${secretResult.pass ? 'PASS' : 'FAIL'}: ${secretResult.message}`);

    const contextResult = testWorkspaceContext();
    channel.appendLine(`[Workspace API] ${contextResult.pass ? 'PASS' : 'FAIL'}: ${contextResult.message}`);

    const hasCommands = typeof vscode.commands.registerCommand === 'function';
    channel.appendLine(`[Commands API] ${hasCommands ? 'PASS' : 'FAIL'}: registerCommand có sẵn`);

    const hasWebview = typeof vscode.window.registerWebviewViewProvider === 'function';
    channel.appendLine(`[WebviewView API] ${hasWebview ? 'PASS' : 'FAIL'}: registerWebviewViewProvider có sẵn`);

    channel.appendLine('--- [KẾT THÚC KIỂM CHỨNG] ---\n');

    return {
      hostVersion: vscode.version,
      platform: `${process.platform} (${process.arch})`,
      nodeVersion: process.version,
      secretStorage: secretResult,
      workspaceContext: contextResult,
      hasCommands: hasCommands,
      hasWebview: hasWebview,
      allPassed: secretResult.pass && contextResult.pass && hasCommands && hasWebview
    };
  }

  // Register WebviewViewProvider
  const viewProvider = {
    /**
     * @param {vscode.WebviewView} webviewView
     * @param {vscode.WebviewViewResolveContext} _context
     * @param {vscode.CancellationToken} _token
     */
    resolveWebviewView(webviewView, _context, _token) {
      webviewView.webview.options = {
        enableScripts: true
      };

      webviewView.webview.html = getWebviewContent(vscode.version);

      webviewView.webview.onDidReceiveMessage(async (message) => {
        switch (message.type) {
          case 'RUN_DIAGNOSTICS': {
            const results = await runAllDiagnostics();
            webviewView.webview.postMessage({ type: 'DIAGNOSTICS_RESULT', data: results });
            vscode.window.showInformationMessage('NesCode Spike: Kiểm tra tổng thể hoàn tất!');
            break;
          }
          case 'TEST_SECRET': {
            const res = await testSecretStorage();
            channel.appendLine(`[Thử nghiệm Secret] ${res.pass ? 'PASS' : 'FAIL'}: ${res.message}`);
            webviewView.webview.postMessage({ type: 'SECRET_RESULT', data: res });
            if (res.pass) {
              vscode.window.showInformationMessage(`SecretStorage OK! Đã ghi và đọc lại: ${res.value}`);
            } else {
              vscode.window.showErrorMessage(`SecretStorage Thất bại: ${res.error}`);
            }
            break;
          }
          case 'TEST_CONTEXT': {
            const res = testWorkspaceContext();
            channel.appendLine(`[Thử nghiệm Context] ${res.pass ? 'PASS' : 'FAIL'}: ${res.message}`);
            webviewView.webview.postMessage({ type: 'CONTEXT_RESULT', data: res });
            vscode.window.showInformationMessage(res.message);
            break;
          }
          case 'SHOW_TOAST': {
            vscode.window.showInformationMessage('NesCode Compatibility Spike: Webview gửi thông điệp thành công!');
            break;
          }
        }
      });
    }
  };

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('nescode.spikeView', viewProvider)
  );

  // Register Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('nescode.spikeCheck', async () => {
      channel.show(true);
      const res = await runAllDiagnostics();
      if (res.allPassed) {
        vscode.window.showInformationMessage(`NesCode Spike: TẤT CẢ API ĐÃ XÁC MINH HOẠT ĐỘNG TRÊN ANTIGRAVITY (Host v${vscode.version})!`);
      } else {
        vscode.window.showWarningMessage('NesCode Spike: Một số API gặp vấn đề, xem chi tiết trong Output Channel.');
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('nescode.helloWorld', () => {
      vscode.window.showInformationMessage(`Xin chào từ NesCode Spike! Antigravity Host v${vscode.version}`);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('nescode.spikeSecretTest', async () => {
      const res = await testSecretStorage();
      if (res.pass) {
        vscode.window.showInformationMessage(`SecretStorage Test: PASS! Key="${res.key}", Value="${res.value}"`);
      } else {
        vscode.window.showErrorMessage(`SecretStorage Test: FAIL! ${res.error}`);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('nescode.spikeContextTest', () => {
      const res = testWorkspaceContext();
      vscode.window.showInformationMessage(res.message);
    })
  );
}

function deactivate() {}

/**
 * @param {string} hostVersion
 */
function getWebviewContent(hostVersion) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NesCode Compatibility Spike</title>
  <style>
    body {
      font-family: var(--vscode-font-family, sans-serif);
      padding: 12px;
      color: var(--vscode-foreground);
      background-color: var(--vscode-sideBar-background);
      font-size: var(--vscode-font-size, 13px);
      line-height: 1.4;
    }
    h3 {
      margin-top: 0;
      color: var(--vscode-editor-foreground);
      border-bottom: 1px solid var(--vscode-panel-border);
      padding-bottom: 6px;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      font-size: 11px;
      border-radius: 3px;
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      margin-bottom: 12px;
    }
    .card {
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-widget-border, #444);
      border-radius: 6px;
      padding: 10px;
      margin-bottom: 12px;
    }
    button {
      display: block;
      width: 100%;
      padding: 8px 12px;
      margin-bottom: 8px;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    }
    button:hover {
      background: var(--vscode-button-hoverBackground);
    }
    button.secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    button.secondary:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }
    pre {
      background: var(--vscode-textCodeBlock-background, rgba(0,0,0,0.2));
      padding: 8px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 11px;
      max-height: 180px;
      overflow-y: auto;
    }
    .status-ok { color: #4caf50; font-weight: bold; }
    .status-fail { color: #f44336; font-weight: bold; }
  </style>
</head>
<body>
  <h3>Kiểm Chứng Antigravity</h3>
  <div class="badge">Host: v${hostVersion}</div>

  <div class="card">
    <button id="btnRunAll">▶ Chạy Kiểm Tra Tổng Thể</button>
    <button id="btnSecret" class="secondary">🔑 Thử Nghiệm SecretStorage</button>
    <button id="btnContext" class="secondary">📄 Đọc Ngữ Cảnh Workspace</button>
    <button id="btnToast" class="secondary">💬 Thử Gửi Toast Message</button>
  </div>

  <div class="card">
    <strong>Nhật Ký Thực Thi Trực Tiếp:</strong>
    <pre id="logBox">Sẵn sàng kiểm thử. Nhấn một nút phía trên để bắt đầu.</pre>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const logBox = document.getElementById('logBox');

    function log(text) {
      const time = new Date().toLocaleTimeString();
      logBox.textContent = '[' + time + '] ' + text + '\\n' + logBox.textContent;
    }

    document.getElementById('btnRunAll').addEventListener('click', () => {
      log('Đang chạy kiểm tra toàn bộ API...');
      vscode.postMessage({ type: 'RUN_DIAGNOSTICS' });
    });

    document.getElementById('btnSecret').addEventListener('click', () => {
      log('Đang kiểm tra SecretStorage...');
      vscode.postMessage({ type: 'TEST_SECRET' });
    });

    document.getElementById('btnContext').addEventListener('click', () => {
      log('Đang kiểm tra Workspace Editor...');
      vscode.postMessage({ type: 'TEST_CONTEXT' });
    });

    document.getElementById('btnToast').addEventListener('click', () => {
      vscode.postMessage({ type: 'SHOW_TOAST' });
    });

    window.addEventListener('message', event => {
      const msg = event.data;
      if (msg.type === 'DIAGNOSTICS_RESULT') {
        const d = msg.data;
        log('KẾT QUẢ KIỂM TRA TỔNG THỂ:');
        log('- Commands API: ' + (d.hasCommands ? 'PASS' : 'FAIL'));
        log('- WebviewView: ' + (d.hasWebview ? 'PASS' : 'FAIL'));
        log('- SecretStorage: ' + (d.secretStorage.pass ? 'PASS' : 'FAIL'));
        log('- Workspace Context: ' + (d.workspaceContext.pass ? 'PASS' : 'FAIL'));
        log('==> TẤT CẢ VƯỢT QUA: ' + (d.allPassed ? 'CÓ (GO)' : 'KHÔNG (NO-GO)'));
      } else if (msg.type === 'SECRET_RESULT') {
        log('SecretStorage: ' + msg.data.message);
      } else if (msg.type === 'CONTEXT_RESULT') {
        log('Workspace Context: ' + msg.data.message);
      }
    });
  </script>
</body>
</html>`;
}

module.exports = {
  activate,
  deactivate
};
