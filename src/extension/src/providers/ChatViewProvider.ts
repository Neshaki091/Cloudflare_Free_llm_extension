import * as vscode from 'vscode';
import { AgentThoughtStep, ChatMode, ChatRequest, RequestContext, sanitizeRelativePath } from '../../../shared/src/index.js';
import { WorkerClient } from '../api/workerClient.js';
import { SessionManager, ChatSession, WebviewChatMessage } from '../history/localConversationStore.js';
import { findProjectRootUri, getWorkspaceSummary, collectProjectContextFiles } from '../context/workspaceContext.js';
import { applyFileChange, executeTerminalCommand, openFileInEditor, previewFileDiff } from '../agent/patchManager.js';
import { compressFileContent, compressMessageContext } from '../context/contextCompressor.js';
import { extractCodeLogic } from '../context/logicExtractor.js';
import { calculateTokenBreakdown } from '../context/tokenEstimator.js';

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

        case 'APPLY_FILE_ACTION':
          if (typeof message.path === 'string' && typeof message.content === 'string') {
            const result = await applyFileChange(message.path, message.content);
            if (result.ok) {
              vscode.window.showInformationMessage(`[NesCode] ${result.message}`);
              this.view?.webview.postMessage({
                type: 'ACTION_APPLIED',
                actionId: message.actionId,
                success: true
              });
            } else {
              vscode.window.showErrorMessage(`[NesCode] ${result.message}`);
            }
          }
          break;

        case 'EXECUTE_TERMINAL_COMMAND':
          if (typeof message.command === 'string') {
            const ok = await executeTerminalCommand(message.command);
            if (ok) {
              vscode.window.showInformationMessage(`[NesCode] Đã gửi lệnh tới Terminal: ${message.command}`);
            }
          }
          break;

        case 'OPEN_FILE':
          if (typeof message.path === 'string') {
            await openFileInEditor(message.path);
          }
          break;

        case 'READ_AND_FEED_FILE':
          if (typeof message.path === 'string') {
            await this.handleAgentReadFile(message.path);
          }
          break;

        case 'DIFF_FILE_ACTION':
          if (typeof message.path === 'string' && typeof message.content === 'string') {
            await previewFileDiff(message.path, message.content);
          }
          break;

        case 'CLOSE_VIEW':
          try {
            await vscode.commands.executeCommand('workbench.action.closeSidebar');
          } catch {}
          try {
            await vscode.commands.executeCommand('workbench.action.closeAuxiliaryBar');
          } catch {}
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

  /**
   * Kích hoạt prompt trực tiếp từ các lệnh menu chuột phải (Explain, Fix, Generate Tests).
   */
  public async executeEditorPrompt(mode: ChatMode): Promise<void> {
    await vscode.commands.executeCommand('nescode.chatView.focus');

    const editor = vscode.window.activeTextEditor;
    const hasSelection = editor && !editor.selection.isEmpty && editor.document.getText(editor.selection).trim().length > 0;
    const fileName = editor ? vscode.workspace.asRelativePath(editor.document.uri) : '';

    let prompt = '';
    if (mode === 'explain') {
      prompt = hasSelection
        ? `Hãy giải thích chi tiết mục đích, luồng hoạt động và các điểm lưu ý của đoạn mã đang chọn trong tệp ${fileName}.`
        : `Hãy giải thích tổng quan kiến trúc, chức năng chính và luồng xử lý của tệp ${fileName}.`;
    } else if (mode === 'fix') {
      prompt = hasSelection
        ? `Hãy rà soát đoạn mã đang chọn trong tệp ${fileName}, chỉ ra các lỗi logic, bảo mật hoặc hiệu năng và đề xuất bản sửa lỗi.`
        : `Hãy rà soát toàn bộ tệp ${fileName}, tìm các lỗi tiềm ẩn và đề xuất bản sửa lỗi hoàn chỉnh.`;
    } else if (mode === 'generate_tests') {
      prompt = hasSelection
        ? `Hãy tạo một bộ kiểm thử đơn vị (unit tests) hoàn chỉnh cho đoạn mã đang chọn trong tệp ${fileName}, bao gồm cả các trường hợp biên.`
        : `Hãy tạo bộ kiểm thử đơn vị (unit tests) đầy đủ cho các hàm và lớp trong tệp ${fileName}.`;
    } else {
      prompt = `Xin chào! Tôi cần hỗ trợ lập trình với tệp ${fileName}.`;
    }

    await this.handleUserPrompt(prompt, mode, true);
  }

  public async handleUserPrompt(
    promptText: string,
    mode: ChatMode = 'chat',
    attachContext = true,
    loopOptions?: {
      step: number;
      thoughtHistory: AgentThoughtStep[];
      messageContext?: string;
    }
  ): Promise<void> {
    const cleanPrompt = promptText.trim();
    if (!cleanPrompt) return;

    if (!this.currentSession) {
      this.currentSession = await this.sessionManager.getOrCreateActiveSession();
    }

    // Xử lý các Slash Commands đặc biệt
    if (cleanPrompt.startsWith('/clear')) {
      await this.sessionManager.createSession('Đoạn chat mới');
      await this.syncSessionStateToWebview();
      return;
    }

    if (cleanPrompt.startsWith('/help')) {
      const helpMsg: WebviewChatMessage = {
        id: 'msg-' + Date.now(),
        role: 'assistant',
        content: `### 💡 Danh Sách Lệnh Nhanh (Slash Commands)\n\n- \`/plan <yêu cầu>\`: Phân tích kiến trúc & lập kế hoạch giải pháp chi tiết.\n- \`/work <nhiệm vụ>\`: Chế độ Agent Loop tự trị — tự động đọc code, trích xuất logic vào Message Context và đề xuất code.\n- \`/fix <vấn đề>\`: Chế độ tìm lỗi & sửa mã nguồn.\n- \`/test <hàm/file>\`: Chế độ viết kiểm thử tự động.\n- \`/clear\`: Xóa ngữ cảnh và tạo phiên làm việc mới.\n- \`/help\`: Hiển thị bảng trợ giúp này.`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
      this.currentSession.messages.push(helpMsg);
      await this.sessionManager.updateSessionMessages(this.currentSession.id, this.currentSession.messages);
      this.view?.webview.postMessage({
        type: 'USER_MESSAGE_ADDED',
        message: { id: 'usr-' + Date.now(), role: 'user', content: cleanPrompt, timestamp: helpMsg.timestamp },
        sessionTitle: this.currentSession.title
      });
      this.view?.webview.postMessage({ type: 'ASSISTANT_STREAM_START', message: helpMsg });
      this.view?.webview.postMessage({ type: 'STREAM_COMPLETED', messageId: helpMsg.id, fullContent: helpMsg.content });
      return;
    }

    let actualMode: ChatMode = mode;
    let actualPromptText = cleanPrompt;

    if (cleanPrompt.startsWith('/plan')) {
      actualMode = 'plan';
      actualPromptText = cleanPrompt.replace(/^\/plan\s*/i, '') || 'Hãy lập kế hoạch kiến trúc chi tiết cho dự án.';
    } else if (cleanPrompt.startsWith('/work') || cleanPrompt.startsWith('/act')) {
      actualMode = 'work';
      actualPromptText = cleanPrompt.replace(/^\/(?:work|act)\s*/i, '') || 'Hãy thực thi nhiệm vụ theo chế độ tự trị Agent.';
    } else if (cleanPrompt.startsWith('/fix')) {
      actualMode = 'fix';
      actualPromptText = cleanPrompt.replace(/^\/fix\s*/i, '') || 'Hãy tìm và sửa lỗi trong mã nguồn.';
    } else if (cleanPrompt.startsWith('/test')) {
      actualMode = 'generate_tests';
      actualPromptText = cleanPrompt.replace(/^\/test\s*/i, '') || 'Hãy viết bộ kiểm thử tự động.';
    }

    // 1. Thu thập context an toàn nếu người dùng bật đính kèm
    let contextData: RequestContext | undefined;
    const rootInfo = await findProjectRootUri();

    if (attachContext) {
      contextData = {};

      // 1A. Thu thập cấu trúc thư mục workspace và manifest
      const wsSummary = await getWorkspaceSummary();
      if (wsSummary) {
        contextData.workspaceTree = `Dự án: ${wsSummary.rootName} (${wsSummary.fileCount} files)\n${wsSummary.manifestInfo ? wsSummary.manifestInfo + '\n' : ''}\n${wsSummary.fileTree}`;
      }

      // 1B. Tự động đọc nội dung các file cốt lõi trong dự án
      const editor = vscode.window.activeTextEditor;
      if (rootInfo) {
        const autoFiles = await collectProjectContextFiles(rootInfo.uri, actualPromptText, editor?.document);
        if (autoFiles.length > 0) {
          contextData.files = autoFiles;
        }
      }

      // 1C. Đoạn mã đang bôi đen (nếu có)
      if (editor) {
        const doc = editor.document;
        const relativePath = vscode.workspace.asRelativePath(doc.uri);
        const selectionText = doc.getText(editor.selection);

        if (!editor.selection.isEmpty && selectionText.trim()) {
          contextData.selection = {
            path: relativePath,
            language: doc.languageId,
            content: selectionText.slice(0, 10000)
          };
        }
      }
    }

    // 1D. Đính kèm Message Context & Thought History nếu đang trong chuỗi Agent Loop
    if (loopOptions?.messageContext) {
      if (!contextData) contextData = {};
      contextData.messageContext = loopOptions.messageContext;
    }
    if (loopOptions?.thoughtHistory && loopOptions.thoughtHistory.length > 0) {
      if (!contextData) contextData = {};
      contextData.thoughtHistory = loopOptions.thoughtHistory;
    }

    // 2. Thêm user message vào session hiện tại (chỉ ở lượt đầu tiên)
    const currentStep = loopOptions?.step || 0;
    if (currentStep === 0) {
      const userMsgId = 'msg-' + Date.now();
      const userMsg: WebviewChatMessage = {
        id: userMsgId,
        role: 'user',
        content: cleanPrompt,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
      this.currentSession.messages.push(userMsg);

      await this.sessionManager.updateSessionMessages(
        this.currentSession.id,
        this.currentSession.messages
      );

      this.view?.webview.postMessage({
        type: 'USER_MESSAGE_ADDED',
        message: userMsg,
        sessionTitle: this.currentSession.title
      });
    }

    // 3. Chuẩn bị assistant message để nhận streaming
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
      mode: actualMode,
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

            // Cập nhật Token Usage real-time
            const contextStr = JSON.stringify(contextData || '');
            const inputStr = actualPromptText;
            const tokenBreakdown = calculateTokenBreakdown(contextStr, inputStr, assistantMsg.content, 32768);
            this.view?.webview.postMessage({
              type: 'UPDATE_TOKEN_USAGE',
              tokenBreakdown
            });

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

            if (this.currentSession) {
              await this.sessionManager.updateSessionMessages(
                this.currentSession.id,
                this.currentSession.messages
              );
            }
          },
          onDone: async () => {
            if (!assistantMsg.content || !assistantMsg.content.trim()) {
              assistantMsg.content = 'Xin lỗi, phản hồi từ máy chủ AI bị gián đoạn hoặc chưa kịp tạo dữ liệu. Bạn hãy bấm gửi lại nhé.';
              this.view?.webview.postMessage({
                type: 'STREAM_CHUNK',
                messageId: assistantMsgId,
                delta: assistantMsg.content,
                fullContent: assistantMsg.content
              });
            }

            // Gửi Token Breakdown hoàn tất
            const contextStr = JSON.stringify(contextData || '');
            const inputStr = actualPromptText;
            const finalBreakdown = calculateTokenBreakdown(contextStr, inputStr, assistantMsg.content, 32768);
            this.view?.webview.postMessage({
              type: 'UPDATE_TOKEN_USAGE',
              tokenBreakdown: finalBreakdown
            });

            this.view?.webview.postMessage({
              type: 'STREAM_COMPLETED',
              messageId: assistantMsgId,
              fullContent: assistantMsg.content
            });
            this.currentAbortController = undefined;

            if (this.currentSession) {
              await this.sessionManager.updateSessionMessages(
                this.currentSession.id,
                this.currentSession.messages
              );
              await this.syncSessionStateToWebview();
            }

            // 7. KIỂM TRA TỰ ĐỘNG KÍCH HOẠT VÒNG LẶP TIẾP THEO (AUTONOMOUS AGENT LOOP)
            const MAX_AGENT_LOOP_STEPS = 3;
            const readFileMatch = assistantMsg.content.match(/<action\s+type="read_file"\s+path="([^"]+)"(?:\s+purpose="([^"]*)")?>/i);

            if (readFileMatch && currentStep < MAX_AGENT_LOOP_STEPS && rootInfo) {
              const rawPath = readFileMatch[1]!;
              const cleanPath = sanitizeRelativePath(rawPath);

              if (cleanPath) {
                try {
                  const fileUri = vscode.Uri.joinPath(rootInfo.uri, cleanPath);
                  const bytes = await vscode.workspace.fs.readFile(fileUri);
                  const rawContent = new TextDecoder('utf-8').decode(bytes);
                  const lang = cleanPath.split('.').pop() || 'plaintext';

                  // Trích xuất cấu trúc logic và nén message context
                  const logicResult = extractCodeLogic(cleanPath, rawContent, lang);
                  const compressedLogic = compressMessageContext(logicResult.logicOutline, 3500, actualPromptText, lang);

                  // Bóc tách thinking trước đó
                  let currentThought = 'Cần khảo sát cấu trúc logic của ' + cleanPath;
                  const thinkMatch = assistantMsg.content.match(/<(?:think|thought)>([\s\S]*?)<\/(?:think|thought)>/i);
                  if (thinkMatch && thinkMatch[1]) {
                    currentThought = thinkMatch[1].trim().slice(0, 600);
                  }

                  const newThoughtHistory: AgentThoughtStep[] = [
                    ...(loopOptions?.thoughtHistory || []),
                    {
                      step: currentStep + 1,
                      thought: currentThought,
                      actionTaken: `read_file(${cleanPath})`,
                      logicSummary: `Đã trích xuất ${logicResult.symbolNames.length} hàm/lớp (${logicResult.symbolNames.slice(0, 6).join(', ')})`
                    }
                  ];

                  this.view?.webview.postMessage({
                    type: 'AGENT_LOOP_STATUS',
                    step: currentStep + 1,
                    maxSteps: MAX_AGENT_LOOP_STEPS,
                    file: cleanPath,
                    message: `🔄 [Agent Loop: Vòng ${currentStep + 1}/${MAX_AGENT_LOOP_STEPS}] Đã bóc tách logic của ${cleanPath}, đang suy nghĩ tiếp...`
                  });

                  const nextMessageContext = `--- LOGIC OUTLINE TỆP: ${cleanPath} (Ngôn ngữ: ${lang}, gồm các hàm/lớp: ${logicResult.symbolNames.join(', ')}) ---\n${compressedLogic}`;

                  // Tự động kích hoạt lượt suy nghĩ tiếp theo của Agent Loop sau 400ms
                  setTimeout(() => {
                    this.handleUserPrompt(
                      actualPromptText,
                      actualMode,
                      attachContext,
                      {
                        step: currentStep + 1,
                        thoughtHistory: newThoughtHistory,
                        messageContext: nextMessageContext
                      }
                    ).catch((e) => console.error('Lỗi thực thi Agent Loop:', e));
                  }, 400);

                  return;
                } catch (readErr: any) {
                  console.warn(`[NesCode] Không thể đọc tệp ${cleanPath} trong Agent Loop:`, readErr);
                }
              }
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

  /**
   * Tự động đọc file theo đề xuất của Agent và gửi tiếp ngữ cảnh vào luồng hội thoại
   */
  public async handleAgentReadFile(relativePath: string): Promise<void> {
    const rootInfo = await findProjectRootUri();
    if (!rootInfo) {
      vscode.window.showErrorMessage('[NesCode] Không tìm thấy thư mục dự án đang mở.');
      return;
    }

    const cleanPath = sanitizeRelativePath(relativePath);
    if (!cleanPath) {
      vscode.window.showErrorMessage('[NesCode] Đường dẫn tệp không an toàn hoặc chứa path traversal.');
      return;
    }

    try {
      const fileUri = vscode.Uri.joinPath(rootInfo.uri, cleanPath);
      const bytes = await vscode.workspace.fs.readFile(fileUri);
      const rawContent = new TextDecoder('utf-8').decode(bytes);
      const lang = cleanPath.split('.').pop() || 'plaintext';
      const compressed = compressFileContent(rawContent, 8000, lang);

      const agentFollowUpPrompt = `[HỆ THỐNG AGENT: ĐÃ TỰ ĐỘNG ĐỌC TỆP ${cleanPath}]\n\`\`\`${lang}\n${compressed}\n\`\`\`\nHãy tiếp tục phân tích kỹ lưỡng nội dung tệp này, kiểm tra tính ổn định, tìm lỗi hoặc đề xuất bản sửa lỗi hoàn chỉnh cho tôi.`;

      await this.handleUserPrompt(agentFollowUpPrompt, 'chat', true);
    } catch (err: any) {
      vscode.window.showErrorMessage(`[NesCode] Không thể đọc tệp ${cleanPath}: ${err?.message || err}`);
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
    <div class="token-usage-badge" id="tokenUsageBadge" title="Bấm để xem phân bổ Token chi tiết">
      <span class="token-icon">📊</span>
      <span id="tokenUsageText">0 / 32k</span>
      <div class="token-mini-bar" id="tokenMiniBar">
        <div class="bar-seg ctx" id="segCtx" style="width: 0%"></div>
        <div class="bar-seg inp" id="segInp" style="width: 0%"></div>
        <div class="bar-seg thk" id="segThk" style="width: 0%"></div>
        <div class="bar-seg out" id="segOut" style="width: 0%"></div>
      </div>
    </div>
    <div class="header-actions">
      <button class="icon-btn" id="btnNewSession" title="Tạo đoạn chat mới trong dự án (+)">➕</button>
      <button class="icon-btn" id="btnHistory" title="Lịch sử các phiên chat (Dự án này)">📜</button>
      <button class="icon-btn" id="btnSettings" title="Cấu hình kết nối Worker">⚙</button>
      <button class="icon-btn close-btn" id="btnCloseSidebar" title="Đóng bảng chat (✕)">✕</button>
    </div>
  </header>

  <!-- Popover chi tiết Token Breakdown -->
  <div class="token-popover" id="tokenPopover">
    <div class="popover-title">📊 Phân Bổ Sử Dụng Token</div>
    <div class="popover-row"><span class="dot ctx"></span> Context dự án: <strong id="tokCtx">0 (0%)</strong></div>
    <div class="popover-row"><span class="dot inp"></span> Lời nhắc & Lịch sử: <strong id="tokInp">0 (0%)</strong></div>
    <div class="popover-row"><span class="dot thk"></span> Suy nghĩ (Thinking): <strong id="tokThk">0 (0%)</strong></div>
    <div class="popover-row"><span class="dot out"></span> Phản hồi (Output): <strong id="tokOut">0 (0%)</strong></div>
    <div class="popover-divider"></div>
    <div class="popover-row total">Tổng dung lượng: <strong id="tokTotal">0 / 32.768 (0%)</strong></div>
  </div>

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

  <!-- Banner trạng thái Agent Loop -->
  <div class="agent-loop-banner" id="agentLoopBanner" style="display: none;">
    <span class="loop-spinner"></span>
    <span id="agentLoopText">Đang phân tích logic...</span>
  </div>

  <footer>
    <!-- Autocomplete Popup cho Slash Commands -->
    <div class="slash-popup" id="slashPopup" style="display: none;">
      <div class="slash-item active" data-cmd="/plan">
        <span class="slash-cmd">/plan</span>
        <span class="slash-desc">Lập kế hoạch kiến trúc & khảo sát logic dự án</span>
      </div>
      <div class="slash-item" data-cmd="/work">
        <span class="slash-cmd">/work</span>
        <span class="slash-desc">Chế độ Agent Loop tự trị (Auto Read & Write Code)</span>
      </div>
      <div class="slash-item" data-cmd="/fix">
        <span class="slash-cmd">/fix</span>
        <span class="slash-desc">Tìm & sửa lỗi mã nguồn qua Diff Preview</span>
      </div>
      <div class="slash-item" data-cmd="/test">
        <span class="slash-cmd">/test</span>
        <span class="slash-desc">Viết bộ kiểm thử tự động toàn diện</span>
      </div>
      <div class="slash-item" data-cmd="/clear">
        <span class="slash-cmd">/clear</span>
        <span class="slash-desc">Làm mới phiên trò chuyện (New Session)</span>
      </div>
      <div class="slash-item" data-cmd="/help">
        <span class="slash-cmd">/help</span>
        <span class="slash-desc">Hướng dẫn sử dụng các lệnh</span>
      </div>
    </div>

    <div class="context-bar" id="contextBar">
      <div class="context-chip-wrap">
        <span id="contextInfo">📎 Không có file đang mở</span>
        <button class="chip-close-btn" id="btnRemoveContext" title="Bỏ đính kèm file này" style="display: none;">✕</button>
      </div>
      <label><input type="checkbox" id="chkAttachContext" checked> Đính kèm Context Dự Án</label>
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
