import * as vscode from 'vscode';
import { ChatMessage, ChatMode, ChatRequest, RequestContext } from '../../../shared/src/index.js';
import { WorkerClient } from '../api/workerClient.js';

interface WebviewChatMessage extends ChatMessage {
  id: string;
  timestamp: string;
}

export class ChatViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private currentAbortController?: AbortController;
  private conversation: WebviewChatMessage[] = [];

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly client: WorkerClient
  ) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri]
    };

    webviewView.webview.html = this.getHtmlForWebview();

    // Lắng nghe sự kiện từ Webview
    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case 'SEND_PROMPT':
          await this.handleUserPrompt(message.prompt, message.mode, message.attachContext);
          break;

        case 'STOP_GENERATION':
          if (this.currentAbortController) {
            this.currentAbortController.abort();
            this.currentAbortController = undefined;
          }
          break;

        case 'OPEN_SETTINGS':
          await vscode.commands.executeCommand('nescode.configureConnection');
          break;

        case 'CHECK_CONNECTION':
          await vscode.commands.executeCommand('nescode.checkConnection');
          break;

        case 'COPY_TEXT':
          if (typeof message.text === 'string') {
            await vscode.env.clipboard.writeText(message.text);
            vscode.window.showInformationMessage('Đã sao chép vào bộ nhớ tạm.');
          }
          break;

        case 'CLEAR_CHAT':
          this.conversation = [];
          this.view?.webview.postMessage({ type: 'CHAT_CLEARED' });
          break;

        case 'REQUEST_EDITOR_CONTEXT':
          this.sendEditorContext();
          break;
      }
    });

    // Cập nhật ngữ cảnh khi đổi tab soạn thảo
    vscode.window.onDidChangeActiveTextEditor(() => {
      this.sendEditorContext();
    });

    vscode.window.onDidChangeTextEditorSelection(() => {
      this.sendEditorContext();
    });

    // Gửi thông tin editor hiện tại
    this.sendEditorContext();
  }

  private sendEditorContext(): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      this.view?.webview.postMessage({
        type: 'UPDATE_CONTEXT',
        hasContext: false
      });
      return;
    }

    const doc = editor.document;
    const fileName = doc.fileName.split(/[\\/]/).pop() || doc.fileName;
    const selection = editor.selection;
    const selectedText = doc.getText(selection);
    const hasSelection = !selection.isEmpty && selectedText.trim().length > 0;

    this.view?.webview.postMessage({
      type: 'UPDATE_CONTEXT',
      hasContext: true,
      fileName,
      filePath: vscode.workspace.asRelativePath(doc.uri),
      language: doc.languageId,
      hasSelection,
      selectedLines: hasSelection ? (selection.end.line - selection.start.line + 1) : 0
    });
  }

  private async handleUserPrompt(
    promptText: string,
    mode: ChatMode = 'chat',
    attachContext = true
  ): Promise<void> {
    const cleanPrompt = promptText.trim();
    if (!cleanPrompt) return;

    // 1. Thu thập context an toàn nếu người dùng bật đính kèm
    let contextData: RequestContext | undefined;
    if (attachContext) {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const doc = editor.document;
        const relativePath = vscode.workspace.asRelativePath(doc.uri);
        const selectionText = doc.getText(editor.selection);

        if (!editor.selection.isEmpty && selectionText.trim()) {
          contextData = {
            selection: {
              path: relativePath,
              language: doc.languageId,
              content: selectionText
            }
          };
        } else {
          // Nếu không bôi đen, đính kèm active file
          contextData = {
            files: [
              {
                path: relativePath,
                language: doc.languageId,
                content: doc.getText()
              }
            ]
          };
        }
      }
    }

    // 2. Thêm user message vào lịch sử
    const userMsgId = 'msg-' + Date.now();
    const userMsg: WebviewChatMessage = {
      id: userMsgId,
      role: 'user',
      content: cleanPrompt,
      timestamp: new Date().toLocaleTimeString()
    };
    this.conversation.push(userMsg);

    // Báo cho UI hiển thị tin nhắn của user
    this.view?.webview.postMessage({
      type: 'USER_MESSAGE_ADDED',
      message: userMsg
    });

    // 3. Chuẩn bị assistant message rỗng để nhận streaming
    const assistantMsgId = 'msg-' + (Date.now() + 1);
    const assistantMsg: WebviewChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString()
    };
    this.conversation.push(assistantMsg);

    this.view?.webview.postMessage({
      type: 'ASSISTANT_STREAM_START',
      message: assistantMsg
    });

    // 4. Khởi tạo AbortController cho request
    this.currentAbortController = new AbortController();

    // 5. Chuẩn bị ChatRequest
    const chatRequest: ChatRequest = {
      requestId: crypto.randomUUID(),
      mode,
      messages: this.conversation.slice(0, -1).map((m) => ({
        role: m.role,
        content: m.content
      })),
      context: contextData,
      options: {
        stream: true
      }
    };

    // 6. Gọi streaming tới Worker
    await this.client.sendChatStream(
      chatRequest,
      {
        onDelta: (delta) => {
          assistantMsg.content += delta.text;
          this.view?.webview.postMessage({
            type: 'STREAM_CHUNK',
            messageId: assistantMsgId,
            delta: delta.text,
            fullContent: assistantMsg.content
          });
        },
        onError: (err) => {
          assistantMsg.content += `\n\n⚠️ **[Lỗi ${err.code}]**: ${err.message}`;
          this.view?.webview.postMessage({
            type: 'STREAM_ERROR',
            messageId: assistantMsgId,
            error: err,
            fullContent: assistantMsg.content
          });
        },
        onDone: () => {
          this.view?.webview.postMessage({
            type: 'STREAM_COMPLETED',
            messageId: assistantMsgId,
            fullContent: assistantMsg.content
          });
          this.currentAbortController = undefined;
        }
      },
      this.currentAbortController.signal
    );
  }

  private getHtmlForWebview(): string {
    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NesCode AI Chat</title>
  <style>
    :root {
      --bg: var(--vscode-sideBar-background, #1e1e1e);
      --fg: var(--vscode-foreground, #cccccc);
      --btn-bg: var(--vscode-button-background, #007acc);
      --btn-fg: var(--vscode-button-foreground, #ffffff);
      --btn-hover: var(--vscode-button-hoverBackground, #0062a3);
      --input-bg: var(--vscode-input-background, #2d2d2d);
      --input-fg: var(--vscode-input-foreground, #cccccc);
      --input-border: var(--vscode-input-border, #3c3c3c);
      --user-bubble: var(--vscode-editor-inactiveSelectionBackground, #264f78);
      --ai-bubble: var(--vscode-editor-background, #181818);
      --border-color: var(--vscode-panel-border, #333333);
      --code-bg: var(--vscode-textCodeBlock-background, rgba(0, 0, 0, 0.3));
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--vscode-font-family, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      color: var(--fg);
      background-color: var(--bg);
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }
    header {
      padding: 8px 12px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--bg);
    }
    .status-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 500;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #4caf50;
    }
    .header-actions {
      display: flex;
      gap: 6px;
    }
    .icon-btn {
      background: transparent;
      border: none;
      color: var(--fg);
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      opacity: 0.8;
    }
    .icon-btn:hover { opacity: 1; background: var(--input-border); }
    #transcript {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .empty-state {
      margin: auto;
      text-align: center;
      padding: 24px 12px;
      opacity: 0.7;
    }
    .empty-state h4 { margin-bottom: 8px; }
    .empty-state p { font-size: 12px; line-height: 1.5; }
    .message {
      display: flex;
      flex-direction: column;
      max-width: 95%;
      word-break: break-word;
    }
    .message.user {
      align-self: flex-end;
      background: var(--user-bubble);
      color: #ffffff;
      padding: 8px 12px;
      border-radius: 12px 12px 2px 12px;
    }
    .message.assistant {
      align-self: flex-start;
      background: var(--ai-bubble);
      border: 1px solid var(--border-color);
      padding: 10px 12px;
      border-radius: 12px 12px 12px 2px;
      width: 100%;
    }
    .message-meta {
      font-size: 10px;
      opacity: 0.6;
      margin-bottom: 4px;
    }
    .message-content {
      line-height: 1.5;
    }
    .code-container {
      position: relative;
      background: var(--code-bg);
      border-radius: 6px;
      margin: 8px 0;
      overflow: hidden;
      border: 1px solid var(--border-color);
    }
    .code-header {
      display: flex;
      justify-content: space-between;
      padding: 4px 8px;
      background: rgba(255,255,255,0.05);
      font-size: 10px;
      text-transform: uppercase;
      opacity: 0.8;
    }
    pre {
      padding: 8px;
      overflow-x: auto;
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: 12px;
    }
    .copy-btn {
      background: transparent;
      border: none;
      color: var(--fg);
      cursor: pointer;
      font-size: 11px;
    }
    .copy-btn:hover { text-decoration: underline; }
    footer {
      border-top: 1px solid var(--border-color);
      padding: 8px 12px;
      background: var(--bg);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .context-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      background: rgba(255,255,255,0.05);
      padding: 4px 8px;
      border-radius: 4px;
    }
    .composer {
      display: flex;
      gap: 6px;
    }
    textarea {
      flex: 1;
      min-height: 40px;
      max-height: 120px;
      padding: 8px;
      background: var(--input-bg);
      color: var(--input-fg);
      border: 1px solid var(--input-border);
      border-radius: 4px;
      resize: vertical;
      font-family: inherit;
      font-size: inherit;
    }
    textarea:focus { outline: 1px solid var(--btn-bg); }
    .send-btn {
      padding: 0 14px;
      background: var(--btn-bg);
      color: var(--btn-fg);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    }
    .send-btn:hover { background: var(--btn-hover); }
    .stop-btn {
      padding: 0 12px;
      background: #f44336;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      display: none;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <header>
    <div class="status-badge">
      <div class="status-dot"></div>
      <span id="statusText">GLM-4.7-Flash (Free)</span>
    </div>
    <div class="header-actions">
      <button class="icon-btn" id="btnClear" title="Xóa lịch sử chat">🗑</button>
      <button class="icon-btn" id="btnSettings" title="Cấu hình kết nối">⚙</button>
    </div>
  </header>

  <div id="transcript">
    <div class="empty-state" id="emptyState">
      <h4>Xin chào! Tôi là NesCode</h4>
      <p>Trợ lý lập trình AI vận hành trên Cloudflare Workers AI.<br>Bạn có thể đặt câu hỏi kỹ thuật, nhờ giải thích code hoặc đề xuất bản sửa lỗi.</p>
    </div>
  </div>

  <footer>
    <div class="context-bar" id="contextBar">
      <span id="contextInfo">📎 Không có file đang mở</span>
      <label><input type="checkbox" id="chkAttachContext" checked> Đính kèm Context</label>
    </div>
    <div class="composer">
      <textarea id="promptInput" placeholder="Nhập câu hỏi lập trình... (Enter để gửi, Shift+Enter xuống dòng)"></textarea>
      <button class="send-btn" id="btnSend">Gửi</button>
      <button class="stop-btn" id="btnStop">Dừng</button>
    </div>
  </footer>

  <script>
    const vscode = acquireVsCodeApi();
    const transcript = document.getElementById('transcript');
    const emptyState = document.getElementById('emptyState');
    const promptInput = document.getElementById('promptInput');
    const btnSend = document.getElementById('btnSend');
    const btnStop = document.getElementById('btnStop');
    const btnClear = document.getElementById('btnClear');
    const btnSettings = document.getElementById('btnSettings');
    const contextInfo = document.getElementById('contextInfo');
    const chkAttachContext = document.getElementById('chkAttachContext');

    let isStreaming = false;

    // Helper render markdown đơn giản & an toàn
    function renderMarkdown(rawText) {
      if (!rawText) return '';
      // Escape HTML
      let escaped = rawText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // Code blocks
      escaped = escaped.replace(/\`\`\`(\\w*)?\\n([\\s\\S]*?)\`\`\`/g, (match, lang, code) => {
        return '<div class="code-container"><div class="code-header"><span>' + (lang || 'code') + '</span><button class="copy-btn" onclick="copyCode(this)">Sao chép</button></div><pre><code>' + code + '</code></pre></div>';
      });

      // Inline code
      escaped = escaped.replace(/\`([^\`]+)\`/g, '<code>$1</code>');

      // Bold & Italic
      escaped = escaped.replace(/\\*\\*([^\\*]+)\\*\\*/g, '<strong>$1</strong>');
      escaped = escaped.replace(/\\*([^\\*]+)\\*/g, '<em>$1</em>');

      // Line breaks
      escaped = escaped.replace(/\\n/g, '<br>');

      return escaped;
    }

    window.copyCode = function(button) {
      const container = button.closest('.code-container');
      const code = container.querySelector('code').innerText;
      vscode.postMessage({ type: 'COPY_TEXT', text: code });
    };

    function sendPrompt() {
      const text = promptInput.value.trim();
      if (!text || isStreaming) return;

      if (emptyState) emptyState.style.display = 'none';

      vscode.postMessage({
        type: 'SEND_PROMPT',
        prompt: text,
        mode: 'chat',
        attachContext: chkAttachContext.checked
      });

      promptInput.value = '';
      setStreamingState(true);
    }

    function setStreamingState(streaming) {
      isStreaming = streaming;
      btnSend.style.display = streaming ? 'none' : 'block';
      btnStop.style.display = streaming ? 'block' : 'none';
      promptInput.disabled = streaming;
    }

    btnSend.addEventListener('click', sendPrompt);

    btnStop.addEventListener('click', () => {
      vscode.postMessage({ type: 'STOP_GENERATION' });
      setStreamingState(false);
    });

    btnClear.addEventListener('click', () => {
      vscode.postMessage({ type: 'CLEAR_CHAT' });
    });

    btnSettings.addEventListener('click', () => {
      vscode.postMessage({ type: 'OPEN_SETTINGS' });
    });

    promptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendPrompt();
      }
    });

    window.addEventListener('message', (event) => {
      const msg = event.data;
      switch (msg.type) {
        case 'USER_MESSAGE_ADDED': {
          const div = document.createElement('div');
          div.className = 'message user';
          div.id = msg.message.id;
          div.innerHTML = '<div class="message-meta">' + msg.message.timestamp + '</div><div class="message-content">' + renderMarkdown(msg.message.content) + '</div>';
          transcript.appendChild(div);
          transcript.scrollTop = transcript.scrollHeight;
          break;
        }

        case 'ASSISTANT_STREAM_START': {
          const div = document.createElement('div');
          div.className = 'message assistant';
          div.id = msg.message.id;
          div.innerHTML = '<div class="message-meta">' + msg.message.timestamp + ' - NesCode AI</div><div class="message-content" id="content-' + msg.message.id + '"><em>Đang suy nghĩ...</em></div>';
          transcript.appendChild(div);
          transcript.scrollTop = transcript.scrollHeight;
          break;
        }

        case 'STREAM_CHUNK': {
          const contentBox = document.getElementById('content-' + msg.messageId);
          if (contentBox) {
            contentBox.innerHTML = renderMarkdown(msg.fullContent);
            transcript.scrollTop = transcript.scrollHeight;
          }
          break;
        }

        case 'STREAM_COMPLETED':
        case 'STREAM_ERROR': {
          setStreamingState(false);
          const contentBox = document.getElementById('content-' + msg.messageId);
          if (contentBox) {
            contentBox.innerHTML = renderMarkdown(msg.fullContent);
            transcript.scrollTop = transcript.scrollHeight;
          }
          break;
        }

        case 'CHAT_CLEARED': {
          transcript.innerHTML = '';
          if (emptyState) {
            transcript.appendChild(emptyState);
            emptyState.style.display = 'block';
          }
          break;
        }

        case 'UPDATE_CONTEXT': {
          if (!msg.hasContext) {
            contextInfo.textContent = '📎 Không có file đang mở';
          } else if (msg.hasSelection) {
            contextInfo.textContent = '📎 ' + msg.fileName + ' (' + msg.selectedLines + ' dòng chọn)';
          } else {
            contextInfo.textContent = '📎 ' + msg.fileName + ' (' + msg.language + ')';
          }
          break;
        }
      }
    });

    // Yêu cầu lấy context editor ban đầu
    vscode.postMessage({ type: 'REQUEST_EDITOR_CONTEXT' });
  </script>
</body>
</html>`;
  }
}
