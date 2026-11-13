import * as vscode from 'vscode';
import { ChatMode, ChatRequest, RequestContext } from '../../../shared/src/index.js';
import { WorkerClient } from '../api/workerClient.js';
import { SessionManager, ChatSession, WebviewChatMessage } from '../history/localConversationStore.js';

export class ChatViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private currentAbortController?: AbortController;
  private currentSession?: ChatSession;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly client: WorkerClient,
    private readonly sessionManager: SessionManager
  ) {}

  async resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): Promise<void> {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'media')]
    };

    // Khởi tạo session đang hoạt động từ workspaceState của dự án
    this.currentSession = await this.sessionManager.getOrCreateActiveSession();

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    // Lắng nghe sự kiện từ Webview
    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case 'WEBVIEW_READY':
          await this.syncSessionStateToWebview();
          this.sendEditorContext();
          break;

        case 'SEND_PROMPT':
          await this.handleUserPrompt(message.prompt, message.mode, message.attachContext);
          break;

        case 'STOP_GENERATION':
          if (this.currentAbortController) {
            this.currentAbortController.abort();
            this.currentAbortController = undefined;
          }
          break;

        case 'CREATE_NEW_SESSION':
          this.currentSession = await this.sessionManager.createSession('Đoạn chat mới');
          await this.syncSessionStateToWebview();
          break;

        case 'SWITCH_SESSION':
          if (typeof message.sessionId === 'string') {
            const switched = await this.sessionManager.switchSession(message.sessionId);
            if (switched) {
              this.currentSession = switched;
              await this.syncSessionStateToWebview();
            }
          }
          break;

        case 'DELETE_SESSION':
          if (typeof message.sessionId === 'string') {
            this.currentSession = await this.sessionManager.deleteSession(message.sessionId);
            await this.syncSessionStateToWebview();
          }
          break;

        case 'CLEAR_ALL_SESSIONS':
          this.currentSession = await this.sessionManager.clearAllSessions();
          await this.syncSessionStateToWebview();
          vscode.window.showInformationMessage('Đã xóa toàn bộ lịch sử chat trong dự án này.');
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

        case 'REQUEST_EDITOR_CONTEXT':
          this.sendEditorContext();
          break;
      }
    });

    // Cập nhật ngữ cảnh khi đổi tab soạn thảo hoặc vùng chọn
    vscode.window.onDidChangeActiveTextEditor(() => {
      this.sendEditorContext();
    });

    vscode.window.onDidChangeTextEditorSelection(() => {
      this.sendEditorContext();
    });
  }

  /**
   * Đồng bộ trạng thái Session và lịch sử tin nhắn xuống Webview
   */
  private async syncSessionStateToWebview(): Promise<void> {
    if (!this.view) return;
    const sessions = this.sessionManager.getSessions();
    if (!this.currentSession) {
      this.currentSession = await this.sessionManager.getOrCreateActiveSession();
    }

    this.view.webview.postMessage({
      type: 'SESSION_STATE_SYNC',
      activeSessionId: this.currentSession.id,
      activeSessionTitle: this.currentSession.title,
      messages: this.currentSession.messages,
      sessions: sessions.map((s) => ({
        id: s.id,
        title: s.title,
        updatedAt: s.updatedAt,
        messageCount: s.messages.length
      }))
    });
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
      selectedLines: hasSelection ? selection.end.line - selection.start.line + 1 : 0
    });
  }

  private async handleUserPrompt(
    promptText: string,
    mode: ChatMode = 'chat',
    attachContext = true
  ): Promise<void> {
    const cleanPrompt = promptText.trim();
    if (!cleanPrompt) return;

    if (!this.currentSession) {
      this.currentSession = await this.sessionManager.getOrCreateActiveSession();
    }

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

    // 2. Thêm user message vào session hiện tại
    const userMsgId = 'msg-' + Date.now();
    const userMsg: WebviewChatMessage = {
      id: userMsgId,
      role: 'user',
      content: cleanPrompt,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
    this.currentSession.messages.push(userMsg);

    // Lưu ngay tin nhắn user và cập nhật tiêu đề session nếu cần
    await this.sessionManager.updateSessionMessages(
      this.currentSession.id,
      this.currentSession.messages
    );

    // Báo cho UI hiển thị tin nhắn của user
    this.view?.webview.postMessage({
      type: 'USER_MESSAGE_ADDED',
      message: userMsg,
      sessionTitle: this.currentSession.title
    });

    // 3. Chuẩn bị assistant message rỗng để nhận streaming
    const assistantMsgId = 'msg-' + (Date.now() + 1);
    const assistantMsg: WebviewChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
    this.currentSession.messages.push(assistantMsg);

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
      messages: this.currentSession.messages.slice(0, -1).map((m) => ({
        role: m.role,
        content: m.content
      })),
      context: contextData,
      options: {
        stream: true
      }
    };

    let lastSaveTime = Date.now();

    try {
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

            // Định kỳ lưu state mỗi 1.2 giây để tránh mất dữ liệu nếu bị ngắt đột ngột
            const now = Date.now();
            if (now - lastSaveTime > 1200) {
              lastSaveTime = now;
              if (this.currentSession) {
                this.sessionManager.updateSessionMessages(
                  this.currentSession.id,
                  this.currentSession.messages
                ).catch(() => {});
              }
            }
          },
          onError: async (err) => {
            assistantMsg.content += `\n\n⚠️ **[Lỗi ${err.code}]**: ${err.message}`;
            this.view?.webview.postMessage({
              type: 'STREAM_ERROR',
              messageId: assistantMsgId,
              error: err,
              fullContent: assistantMsg.content
            });

            // Lưu phản hồi kèm thông báo lỗi vào session
            if (this.currentSession) {
              await this.sessionManager.updateSessionMessages(
                this.currentSession.id,
                this.currentSession.messages
              );
            }
          },
          onDone: async () => {
            this.view?.webview.postMessage({
              type: 'STREAM_COMPLETED',
              messageId: assistantMsgId,
              fullContent: assistantMsg.content
            });
            this.currentAbortController = undefined;

            // Lưu phản hồi hoàn chỉnh vào session cục bộ
            if (this.currentSession) {
              await this.sessionManager.updateSessionMessages(
                this.currentSession.id,
                this.currentSession.messages
              );
              // Đồng bộ lại danh sách session để cập nhật thời gian / số tin nhắn
              await this.syncSessionStateToWebview();
            }
          }
        },
        this.currentAbortController.signal
      );
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      assistantMsg.content += `\n\n⚠️ **[Lỗi kết nối]**: ${errorMsg}`;
      this.view?.webview.postMessage({
        type: 'STREAM_ERROR',
        messageId: assistantMsgId,
        error: { code: 'NETWORK_ERROR', message: errorMsg },
        fullContent: assistantMsg.content
      });
      this.currentAbortController = undefined;

      if (this.currentSession) {
        await this.sessionManager.updateSessionMessages(
          this.currentSession.id,
          this.currentSession.messages
        );
      }
    }
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'chat.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'chat.css')
    );

    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-inline';">
  <title>NesCode AI Chat</title>
  <link rel="stylesheet" href="${styleUri}">
</head>
<body>
  <header>
    <div class="session-title-badge" id="btnToggleHistory" title="Bấm để xem danh sách lịch sử các phiên chat trong dự án này">
      <div class="status-dot"></div>
      <span id="currentSessionTitle">Đoạn chat mới</span>
      <span style="font-size: 9px; opacity: 0.6;">▼</span>
    </div>
    <div class="header-actions">
      <button class="icon-btn" id="btnNewSession" title="Tạo đoạn chat mới trong dự án (+)">➕</button>
      <button class="icon-btn" id="btnHistory" title="Lịch sử các phiên chat (Dự án này)">📜</button>
      <button class="icon-btn" id="btnSettings" title="Cấu hình kết nối Worker">⚙</button>
    </div>
  </header>

  <!-- Drawer danh sách sessions trong dự án -->
  <div id="historyDrawer">
    <div class="drawer-header">
      <h5>Lịch sử phiên chat (Dự án này)</h5>
      <div class="drawer-actions">
        <button class="drawer-btn danger" id="btnClearAll" title="Xóa toàn bộ lịch sử trong dự án">Xóa tất cả</button>
        <button class="drawer-btn" id="btnCloseDrawer">✕</button>
      </div>
    </div>
    <div class="session-list" id="sessionList">
      <!-- Session items will be dynamically rendered here -->
    </div>
  </div>

  <div id="transcript">
    <div class="empty-state" id="emptyState">
      <h4>Xin chào! Tôi là NesCode</h4>
      <p>Trợ lý lập trình AI vận hành trên Cloudflare Workers AI.<br>Mọi phiên chat và trạng thái đều được tự động lưu riêng biệt theo từng dự án của bạn.</p>
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

  <script src="${scriptUri}"></script>
</body>
</html>`;
  }
}
