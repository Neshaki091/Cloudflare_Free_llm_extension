"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension/src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode6 = __toESM(require("vscode"));

// src/extension/src/security/secretStorage.ts
var API_KEY_SECRET_KEY = "nescode_api_key";
var SecretManager = class {
  constructor(secretStorage) {
    this.secretStorage = secretStorage;
  }
  secretStorage;
  /**
   * Lấy API key từ SecretStorage của IDE.
   */
  async getApiKey() {
    try {
      return await this.secretStorage.get(API_KEY_SECRET_KEY);
    } catch {
      return void 0;
    }
  }
  /**
   * Lưu API key an toàn vào SecretStorage (mã hóa cấp OS).
   */
  async setApiKey(apiKey) {
    await this.secretStorage.store(API_KEY_SECRET_KEY, apiKey.trim());
  }
  /**
   * Xóa API key khỏi SecretStorage.
   */
  async deleteApiKey() {
    await this.secretStorage.delete(API_KEY_SECRET_KEY);
  }
  /**
   * Kiểm tra xem đã có API key được lưu hay chưa.
   */
  async hasApiKey() {
    const key = await this.getApiKey();
    return Boolean(key && key.trim().length > 0);
  }
};

// src/extension/src/api/workerClient.ts
var vscode = __toESM(require("vscode"));

// src/extension/src/api/sseParser.ts
var SseParser = class {
  constructor(callbacks) {
    this.callbacks = callbacks;
  }
  callbacks;
  buffer = "";
  currentEventName = "delta";
  /**
   * Đẩy một chunk chuỗi ký tự nhận được từ HTTP stream vào parser.
   */
  feed(chunk) {
    this.buffer += chunk;
    const lines = this.buffer.split(/\r?\n/);
    this.buffer = lines.pop() || "";
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        this.currentEventName = "delta";
        continue;
      }
      if (line.startsWith("event:")) {
        this.currentEventName = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        const dataStr = line.slice(5).trim();
        this.dispatch(this.currentEventName, dataStr);
      }
    }
  }
  /**
   * Phân phối dữ liệu tới callback tương ứng dựa trên tên event.
   */
  dispatch(eventName, dataStr) {
    try {
      const parsed = JSON.parse(dataStr);
      switch (eventName) {
        case "meta":
          this.callbacks.onMeta?.(parsed);
          break;
        case "delta":
          this.callbacks.onDelta?.(parsed);
          break;
        case "usage":
          this.callbacks.onUsage?.(parsed);
          break;
        case "done":
          this.callbacks.onDone?.(parsed);
          break;
        case "error":
          this.callbacks.onError?.(parsed);
          break;
        default:
          if (parsed && typeof parsed.text === "string") {
            this.callbacks.onDelta?.(parsed);
          }
          break;
      }
    } catch {
      if (eventName === "delta" && dataStr) {
        this.callbacks.onDelta?.({ text: dataStr });
      }
    }
  }
  /**
   * Đóng stream và xử lý phần buffer còn sót lại.
   */
  end() {
    if (this.buffer.trim().startsWith("data:")) {
      const dataStr = this.buffer.trim().slice(5).trim();
      this.dispatch(this.currentEventName, dataStr);
    }
    this.buffer = "";
  }
};

// src/extension/src/api/workerClient.ts
var WorkerClient = class {
  constructor(secretManager) {
    this.secretManager = secretManager;
  }
  secretManager;
  /**
   * Lấy cấu hình kết nối hiện tại (Worker URL từ settings và API Key từ SecretStorage).
   */
  async getConfig() {
    const config = vscode.workspace.getConfiguration("nescode");
    const rawUrl = config.get("apiBaseUrl", "").trim().replace(/\/+$/, "");
    const apiKey = await this.secretManager.getApiKey();
    if (!rawUrl || !apiKey) {
      return null;
    }
    return {
      baseUrl: rawUrl,
      apiKey
    };
  }
  /**
   * Kiểm tra kết nối tới Worker (GET /v1/health).
   */
  async checkHealth() {
    const conn = await this.getConfig();
    if (!conn) {
      return {
        ok: false,
        error: "Ch\u01B0a c\u1EA5u h\xECnh Worker URL ho\u1EB7c API Key. Vui l\xF2ng ch\u1EA1y l\u1EC7nh: NesCode: C\u1EA5u H\xECnh K\u1EBFt N\u1ED1i Worker."
      };
    }
    try {
      const url = `${conn.baseUrl}/v1/health`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${conn.apiKey}`,
          Accept: "application/json"
        }
      });
      if (!response.ok) {
        let errMsg = `M\xE1y ch\u1EE7 tr\u1EA3 v\u1EC1 HTTP ${response.status} (${response.statusText})`;
        try {
          const errBody = await response.json();
          if (errBody.error?.message) {
            errMsg = errBody.error.message;
          }
        } catch {
        }
        return { ok: false, error: errMsg };
      }
      const data = await response.json();
      return { ok: true, data };
    } catch (err) {
      return {
        ok: false,
        error: `Kh\xF4ng th\u1EC3 k\u1EBFt n\u1ED1i t\u1EDBi Worker (${err?.message || "Network error"}). H\xE3y ki\u1EC3m tra l\u1EA1i k\u1EBFt n\u1ED1i m\u1EA1ng ho\u1EB7c Worker URL.`
      };
    }
  }
  /**
   * Lấy danh sách models được hỗ trợ (GET /v1/models).
   */
  async getModels() {
    const conn = await this.getConfig();
    if (!conn) return null;
    try {
      const url = `${conn.baseUrl}/v1/models`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${conn.apiKey}`,
          Accept: "application/json"
        }
      });
      if (response.ok) {
        return await response.json();
      }
    } catch {
    }
    return null;
  }
  /**
   * Gửi yêu cầu Chat và nhận phản hồi Streaming (Server-Sent Events).
   */
  async sendChatStream(chatRequest, callbacks, signal) {
    const conn = await this.getConfig();
    if (!conn) {
      callbacks.onError?.({
        code: "UNAUTHORIZED",
        message: "Ch\u01B0a c\u1EA5u h\xECnh k\u1EBFt n\u1ED1i. Vui l\xF2ng b\u1EA5m v\xE0o bi\u1EC3u t\u01B0\u1EE3ng b\xE1nh r\u0103ng \u0111\u1EC3 nh\u1EADp Worker URL v\xE0 API Key.",
        retryable: false
      });
      return;
    }
    const url = `${conn.baseUrl}/v1/chat`;
    const requestId = chatRequest.requestId || crypto.randomUUID();
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Authorization: `Bearer ${conn.apiKey}`,
          "X-Request-ID": requestId,
          Accept: "text/event-stream, application/json"
        },
        body: JSON.stringify(chatRequest),
        signal
      });
      if (!response.ok) {
        let errCode = "INTERNAL_ERROR";
        let errMsg = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errJson = await response.json();
          if (errJson.error) {
            errCode = errJson.error.code;
            errMsg = errJson.error.message;
          }
        } catch {
        }
        callbacks.onError?.({
          code: errCode,
          message: errMsg,
          retryable: response.status >= 500
        });
        return;
      }
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("text/event-stream") && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        const parser = new SseParser(callbacks);
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const textChunk = decoder.decode(value, { stream: true });
            parser.feed(textChunk);
          }
        } finally {
          parser.end();
          reader.releaseLock();
        }
      } else {
        const json = await response.json();
        if (json.ok && json.output?.content) {
          callbacks.onDelta?.({ text: json.output.content });
          callbacks.onDone?.({ requestId: json.requestId });
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        callbacks.onDelta?.({ text: "\n\n*(\u0110\xE3 d\u1EEBng b\u1EDFi ng\u01B0\u1EDDi d\xF9ng)*" });
        callbacks.onDone?.({ requestId });
        return;
      }
      callbacks.onError?.({
        code: "INTERNAL_ERROR",
        message: `L\u1ED7i k\u1EBFt n\u1ED1i: ${err?.message || "Kh\xF4ng th\u1EC3 g\u1EEDi y\xEAu c\u1EA7u t\u1EDBi Worker."}`,
        retryable: true
      });
    }
  }
};

// src/extension/src/providers/ChatViewProvider.ts
var vscode2 = __toESM(require("vscode"));
var ChatViewProvider = class {
  constructor(extensionUri, client) {
    this.extensionUri = extensionUri;
    this.client = client;
  }
  extensionUri;
  client;
  view;
  currentAbortController;
  conversation = [];
  resolveWebviewView(webviewView, _context, _token) {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri]
    };
    webviewView.webview.html = this.getHtmlForWebview();
    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case "SEND_PROMPT":
          await this.handleUserPrompt(message.prompt, message.mode, message.attachContext);
          break;
        case "STOP_GENERATION":
          if (this.currentAbortController) {
            this.currentAbortController.abort();
            this.currentAbortController = void 0;
          }
          break;
        case "OPEN_SETTINGS":
          await vscode2.commands.executeCommand("nescode.configureConnection");
          break;
        case "CHECK_CONNECTION":
          await vscode2.commands.executeCommand("nescode.checkConnection");
          break;
        case "COPY_TEXT":
          if (typeof message.text === "string") {
            await vscode2.env.clipboard.writeText(message.text);
            vscode2.window.showInformationMessage("\u0110\xE3 sao ch\xE9p v\xE0o b\u1ED9 nh\u1EDB t\u1EA1m.");
          }
          break;
        case "CLEAR_CHAT":
          this.conversation = [];
          this.view?.webview.postMessage({ type: "CHAT_CLEARED" });
          break;
        case "REQUEST_EDITOR_CONTEXT":
          this.sendEditorContext();
          break;
      }
    });
    vscode2.window.onDidChangeActiveTextEditor(() => {
      this.sendEditorContext();
    });
    vscode2.window.onDidChangeTextEditorSelection(() => {
      this.sendEditorContext();
    });
    this.sendEditorContext();
  }
  sendEditorContext() {
    const editor = vscode2.window.activeTextEditor;
    if (!editor) {
      this.view?.webview.postMessage({
        type: "UPDATE_CONTEXT",
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
      type: "UPDATE_CONTEXT",
      hasContext: true,
      fileName,
      filePath: vscode2.workspace.asRelativePath(doc.uri),
      language: doc.languageId,
      hasSelection,
      selectedLines: hasSelection ? selection.end.line - selection.start.line + 1 : 0
    });
  }
  async handleUserPrompt(promptText, mode = "chat", attachContext = true) {
    const cleanPrompt = promptText.trim();
    if (!cleanPrompt) return;
    let contextData;
    if (attachContext) {
      const editor = vscode2.window.activeTextEditor;
      if (editor) {
        const doc = editor.document;
        const relativePath = vscode2.workspace.asRelativePath(doc.uri);
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
    const userMsgId = "msg-" + Date.now();
    const userMsg = {
      id: userMsgId,
      role: "user",
      content: cleanPrompt,
      timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString()
    };
    this.conversation.push(userMsg);
    this.view?.webview.postMessage({
      type: "USER_MESSAGE_ADDED",
      message: userMsg
    });
    const assistantMsgId = "msg-" + (Date.now() + 1);
    const assistantMsg = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString()
    };
    this.conversation.push(assistantMsg);
    this.view?.webview.postMessage({
      type: "ASSISTANT_STREAM_START",
      message: assistantMsg
    });
    this.currentAbortController = new AbortController();
    const chatRequest = {
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
    await this.client.sendChatStream(
      chatRequest,
      {
        onDelta: (delta) => {
          assistantMsg.content += delta.text;
          this.view?.webview.postMessage({
            type: "STREAM_CHUNK",
            messageId: assistantMsgId,
            delta: delta.text,
            fullContent: assistantMsg.content
          });
        },
        onError: (err) => {
          assistantMsg.content += `

\u26A0\uFE0F **[L\u1ED7i ${err.code}]**: ${err.message}`;
          this.view?.webview.postMessage({
            type: "STREAM_ERROR",
            messageId: assistantMsgId,
            error: err,
            fullContent: assistantMsg.content
          });
        },
        onDone: () => {
          this.view?.webview.postMessage({
            type: "STREAM_COMPLETED",
            messageId: assistantMsgId,
            fullContent: assistantMsg.content
          });
          this.currentAbortController = void 0;
        }
      },
      this.currentAbortController.signal
    );
  }
  getHtmlForWebview() {
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
      <button class="icon-btn" id="btnClear" title="X\xF3a l\u1ECBch s\u1EED chat">\u{1F5D1}</button>
      <button class="icon-btn" id="btnSettings" title="C\u1EA5u h\xECnh k\u1EBFt n\u1ED1i">\u2699</button>
    </div>
  </header>

  <div id="transcript">
    <div class="empty-state" id="emptyState">
      <h4>Xin ch\xE0o! T\xF4i l\xE0 NesCode</h4>
      <p>Tr\u1EE3 l\xFD l\u1EADp tr\xECnh AI v\u1EADn h\xE0nh tr\xEAn Cloudflare Workers AI.<br>B\u1EA1n c\xF3 th\u1EC3 \u0111\u1EB7t c\xE2u h\u1ECFi k\u1EF9 thu\u1EADt, nh\u1EDD gi\u1EA3i th\xEDch code ho\u1EB7c \u0111\u1EC1 xu\u1EA5t b\u1EA3n s\u1EEDa l\u1ED7i.</p>
    </div>
  </div>

  <footer>
    <div class="context-bar" id="contextBar">
      <span id="contextInfo">\u{1F4CE} Kh\xF4ng c\xF3 file \u0111ang m\u1EDF</span>
      <label><input type="checkbox" id="chkAttachContext" checked> \u0110\xEDnh k\xE8m Context</label>
    </div>
    <div class="composer">
      <textarea id="promptInput" placeholder="Nh\u1EADp c\xE2u h\u1ECFi l\u1EADp tr\xECnh... (Enter \u0111\u1EC3 g\u1EEDi, Shift+Enter xu\u1ED1ng d\xF2ng)"></textarea>
      <button class="send-btn" id="btnSend">G\u1EEDi</button>
      <button class="stop-btn" id="btnStop">D\u1EEBng</button>
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

    // Helper render markdown \u0111\u01A1n gi\u1EA3n & an to\xE0n
    function renderMarkdown(rawText) {
      if (!rawText) return '';
      // Escape HTML
      let escaped = rawText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // Code blocks
      escaped = escaped.replace(/\`\`\`(\\w*)?\\n([\\s\\S]*?)\`\`\`/g, (match, lang, code) => {
        return '<div class="code-container"><div class="code-header"><span>' + (lang || 'code') + '</span><button class="copy-btn" onclick="copyCode(this)">Sao ch\xE9p</button></div><pre><code>' + code + '</code></pre></div>';
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
          div.innerHTML = '<div class="message-meta">' + msg.message.timestamp + ' - NesCode AI</div><div class="message-content" id="content-' + msg.message.id + '"><em>\u0110ang suy ngh\u0129...</em></div>';
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
            contextInfo.textContent = '\u{1F4CE} Kh\xF4ng c\xF3 file \u0111ang m\u1EDF';
          } else if (msg.hasSelection) {
            contextInfo.textContent = '\u{1F4CE} ' + msg.fileName + ' (' + msg.selectedLines + ' d\xF2ng ch\u1ECDn)';
          } else {
            contextInfo.textContent = '\u{1F4CE} ' + msg.fileName + ' (' + msg.language + ')';
          }
          break;
        }
      }
    });

    // Y\xEAu c\u1EA7u l\u1EA5y context editor ban \u0111\u1EA7u
    vscode.postMessage({ type: 'REQUEST_EDITOR_CONTEXT' });
  </script>
</body>
</html>`;
  }
};

// src/extension/src/commands/configureConnection.ts
var vscode3 = __toESM(require("vscode"));
async function registerConfigureConnectionCommand(secretManager, client) {
  return vscode3.commands.registerCommand("nescode.configureConnection", async () => {
    const config = vscode3.workspace.getConfiguration("nescode");
    const currentUrl = config.get("apiBaseUrl", "");
    const enteredUrl = await vscode3.window.showInputBox({
      title: "NesCode: C\u1EA5u H\xECnh Worker URL",
      prompt: "Nh\u1EADp \u0111\u1ECBa ch\u1EC9 Cloudflare Worker c\u1EE7a b\u1EA1n (v\xED d\u1EE5: https://nescode-ai-gateway.xxx.workers.dev)",
      value: currentUrl || "https://",
      ignoreFocusOut: true,
      validateInput: (value) => {
        const trimmed = value.trim();
        if (!trimmed) {
          return "URL kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng.";
        }
        if (!trimmed.startsWith("https://") && !trimmed.startsWith("http://localhost") && !trimmed.startsWith("http://127.0.0.1")) {
          return "Worker URL b\u1EAFt bu\u1ED9c ph\u1EA3i s\u1EED d\u1EE5ng giao th\u1EE9c b\u1EA3o m\u1EADt HTTPS (tr\u1EEB localhost khi dev).";
        }
        return null;
      }
    });
    if (enteredUrl === void 0) {
      return;
    }
    const currentKey = await secretManager.getApiKey();
    const enteredKey = await vscode3.window.showInputBox({
      title: "NesCode: C\u1EA5u H\xECnh API Key",
      prompt: "Nh\u1EADp kh\xF3a NESCODE_API_KEY m\xE0 b\u1EA1n \u0111\xE3 \u0111\u1EB7t tr\xEAn Worker (\u0110\u01B0\u1EE3c l\u01B0u m\xE3 h\xF3a an to\xE0n trong SecretStorage)",
      password: true,
      value: currentKey || "",
      ignoreFocusOut: true,
      validateInput: (value) => {
        if (!value.trim()) {
          return "API Key kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng.";
        }
        return null;
      }
    });
    if (enteredKey === void 0) {
      return;
    }
    const cleanUrl = enteredUrl.trim().replace(/\/+$/, "");
    await config.update("apiBaseUrl", cleanUrl, vscode3.ConfigurationTarget.Global);
    await secretManager.setApiKey(enteredKey.trim());
    vscode3.window.withProgress(
      {
        location: vscode3.ProgressLocation.Notification,
        title: "NesCode: \u0110ang ki\u1EC3m tra k\u1EBFt n\u1ED1i t\u1EDBi Cloudflare Worker...",
        cancellable: false
      },
      async () => {
        const health = await client.checkHealth();
        if (health.ok && health.data) {
          vscode3.window.showInformationMessage(
            `K\u1EBFt n\u1ED1i th\xE0nh c\xF4ng! Worker: ${health.data.service} (Model: ${health.data.defaultModel})`
          );
        } else {
          vscode3.window.showWarningMessage(
            `\u0110\xE3 l\u01B0u c\u1EA5u h\xECnh nh\u01B0ng ki\u1EC3m tra k\u1EBFt n\u1ED1i th\u1EA5t b\u1EA1i: ${health.error}`
          );
        }
      }
    );
  });
}

// src/extension/src/commands/checkConnection.ts
var vscode4 = __toESM(require("vscode"));
function registerCheckConnectionCommand(client) {
  return vscode4.commands.registerCommand("nescode.checkConnection", async () => {
    vscode4.window.withProgress(
      {
        location: vscode4.ProgressLocation.Notification,
        title: "NesCode: \u0110ang ki\u1EC3m tra tr\u1EA1ng th\xE1i k\u1EBFt n\u1ED1i Cloudflare Worker...",
        cancellable: false
      },
      async () => {
        const health = await client.checkHealth();
        if (health.ok && health.data) {
          vscode4.window.showInformationMessage(
            `Tr\u1EA1ng th\xE1i: \u0110\xC3 K\u1EBET N\u1ED0I (Connected) | Model: ${health.data.defaultModel} | Streaming: ${health.data.streamingEnabled ? "B\u1EADt" : "T\u1EAFt"}`
          );
        } else {
          const action = await vscode4.window.showErrorMessage(
            `Tr\u1EA1ng th\xE1i: M\u1EA4T K\u1EBET N\u1ED0I (Disconnected) | ${health.error}`,
            "C\u1EA5u H\xECnh L\u1EA1i"
          );
          if (action === "C\u1EA5u H\xECnh L\u1EA1i") {
            vscode4.commands.executeCommand("nescode.configureConnection");
          }
        }
      }
    );
  });
}

// src/extension/src/commands/openChat.ts
var vscode5 = __toESM(require("vscode"));
function registerOpenChatCommand() {
  return vscode5.commands.registerCommand("nescode.openChat", async () => {
    await vscode5.commands.executeCommand("nescode.chatView.focus");
  });
}

// src/extension/src/extension.ts
async function activate(context) {
  const secretManager = new SecretManager(context.secrets);
  const client = new WorkerClient(secretManager);
  const chatProvider = new ChatViewProvider(context.extensionUri, client);
  context.subscriptions.push(
    vscode6.window.registerWebviewViewProvider("nescode.chatView", chatProvider)
  );
  context.subscriptions.push(
    await registerConfigureConnectionCommand(secretManager, client)
  );
  context.subscriptions.push(
    registerCheckConnectionCommand(client)
  );
  context.subscriptions.push(
    registerOpenChatCommand()
  );
  const conn = await client.getConfig();
  if (!conn) {
    vscode6.window.showInformationMessage(
      "Ch\xE0o m\u1EEBng \u0111\u1EBFn v\u1EDBi NesCode for Antigravity! Vui l\xF2ng c\u1EA5u h\xECnh Cloudflare Worker URL v\xE0 API Key \u0111\u1EC3 b\u1EAFt \u0111\u1EA7u.",
      "C\u1EA5u H\xECnh Ngay"
    ).then((action) => {
      if (action === "C\u1EA5u H\xECnh Ngay") {
        vscode6.commands.executeCommand("nescode.configureConnection");
      }
    });
  }
}
function deactivate() {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
