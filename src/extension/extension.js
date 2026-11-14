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
var vscode9 = __toESM(require("vscode"));

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
  outputChannel;
  setOutputChannel(channel) {
    this.outputChannel = channel;
  }
  log(message) {
    const time = (/* @__PURE__ */ new Date()).toLocaleTimeString("vi-VN");
    this.outputChannel?.appendLine(`[${time}] ${message}`);
  }
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
      this.log(`Ki\u1EC3m tra k\u1EBFt n\u1ED1i GET ${url}`);
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
        this.log(`L\u1ED7i k\u1EBFt n\u1ED1i: ${errMsg}`);
        return { ok: false, error: errMsg };
      }
      const data = await response.json();
      this.log(`K\u1EBFt n\u1ED1i th\xE0nh c\xF4ng t\u1EDBi ${data.service} (${data.defaultModel})`);
      return { ok: true, data };
    } catch (err) {
      const msg = `Kh\xF4ng th\u1EC3 k\u1EBFt n\u1ED1i t\u1EDBi Worker (${err?.message || "Network error"}). H\xE3y ki\u1EC3m tra l\u1EA1i k\u1EBFt n\u1ED1i m\u1EA1ng ho\u1EB7c Worker URL.`;
      this.log(`L\u1ED7i m\u1EA1ng: ${msg}`);
      return {
        ok: false,
        error: msg
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
    } catch (err) {
      this.log(`L\u1ED7i l\u1EA5y models: ${err?.message}`);
    }
    return null;
  }
  /**
   * Gửi yêu cầu Chat và nhận phản hồi Streaming (Server-Sent Events).
   */
  async sendChatStream(chatRequest, callbacks, signal) {
    const conn = await this.getConfig();
    if (!conn) {
      this.log("Y\xEAu c\u1EA7u b\u1ECB t\u1EEB ch\u1ED1i: Ch\u01B0a c\u1EA5u h\xECnh k\u1EBFt n\u1ED1i Worker URL / API Key.");
      callbacks.onError?.({
        code: "UNAUTHORIZED",
        message: "Ch\u01B0a c\u1EA5u h\xECnh k\u1EBFt n\u1ED1i. Vui l\xF2ng b\u1EA5m v\xE0o bi\u1EC3u t\u01B0\u1EE3ng b\xE1nh r\u0103ng \u0111\u1EC3 nh\u1EADp Worker URL v\xE0 API Key.",
        retryable: false
      });
      return;
    }
    const url = `${conn.baseUrl}/v1/chat`;
    const requestId = chatRequest.requestId || crypto.randomUUID();
    const config = vscode.workspace.getConfiguration("nescode");
    const timeoutMs = config.get("requestTimeoutMs", 6e4);
    this.log(`G\u1EEDi y\xEAu c\u1EA7u POST ${url} [ReqID: ${requestId}] (Timeout: ${timeoutMs / 1e3}s)`);
    const timeoutController = new AbortController();
    const timeoutTimer = setTimeout(() => {
      timeoutController.abort(new Error(`H\u1EBFt th\u1EDDi gian ch\u1EDD ph\u1EA3n h\u1ED3i (${timeoutMs / 1e3}s)`));
    }, timeoutMs);
    const combinedAbortHandler = () => {
      timeoutController.abort();
    };
    if (signal) {
      signal.addEventListener("abort", combinedAbortHandler);
    }
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
        signal: timeoutController.signal
      });
      this.log(`Nh\u1EADn ph\u1EA3n h\u1ED3i HTTP ${response.status} ${response.statusText} [ReqID: ${requestId}]`);
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
        this.log(`M\xE1y ch\u1EE7 tr\u1EA3 v\u1EC1 l\u1ED7i: [${errCode}] ${errMsg}`);
        callbacks.onError?.({
          code: errCode,
          message: errMsg,
          retryable: response.status >= 500
        });
        return;
      }
      const contentType = response.headers.get("content-type") || "";
      this.log(`Content-Type ph\u1EA3n h\u1ED3i: ${contentType}`);
      if (contentType.includes("text/event-stream") && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        const parser = new SseParser(callbacks);
        let receivedChunks = 0;
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            receivedChunks++;
            const textChunk = decoder.decode(value, { stream: true });
            parser.feed(textChunk);
          }
          this.log(`\u0110\xE3 \u0111\u1ECDc xong to\xE0n b\u1ED9 stream (${receivedChunks} chunks nh\u1EADn \u0111\u01B0\u1EE3c).`);
        } finally {
          parser.end();
          reader.releaseLock();
        }
      } else {
        const json = await response.json();
        this.log(`Nh\u1EADn ph\u1EA3n h\u1ED3i JSON \u0111\u1EA7y \u0111\u1EE7: ok=${json.ok}`);
        if (json.ok && json.output?.content) {
          callbacks.onDelta?.({ text: json.output.content });
          callbacks.onDone?.({ requestId: json.requestId });
        }
      }
    } catch (err) {
      if (signal?.aborted) {
        this.log("Ng\u01B0\u1EDDi d\xF9ng \u0111\xE3 b\u1EA5m D\u1EEBng y\xEAu c\u1EA7u.");
        callbacks.onDelta?.({ text: "\n\n*(\u0110\xE3 d\u1EEBng b\u1EDFi ng\u01B0\u1EDDi d\xF9ng)*" });
        callbacks.onDone?.({ requestId });
        return;
      }
      const errorMsg = err?.message || "Kh\xF4ng th\u1EC3 g\u1EEDi y\xEAu c\u1EA7u t\u1EDBi Worker.";
      this.log(`L\u1ED7i k\u1EBFt n\u1ED1i trong sendChatStream: ${errorMsg}`);
      callbacks.onError?.({
        code: "INTERNAL_ERROR",
        message: `L\u1ED7i k\u1EBFt n\u1ED1i: ${errorMsg}`,
        retryable: true
      });
    } finally {
      clearTimeout(timeoutTimer);
      if (signal) {
        signal.removeEventListener("abort", combinedAbortHandler);
      }
    }
  }
};

// src/extension/src/history/localConversationStore.ts
var STORAGE_KEY_SESSIONS = "nescode_workspace_sessions_v1";
var STORAGE_KEY_ACTIVE_ID = "nescode_active_session_id_v1";
var SessionManager = class {
  constructor(workspaceState) {
    this.workspaceState = workspaceState;
  }
  workspaceState;
  /**
   * Lấy toàn bộ danh sách sessions thuộc workspace/dự án hiện tại.
   */
  getSessions() {
    return this.workspaceState.get(STORAGE_KEY_SESSIONS, []);
  }
  /**
   * Lưu danh sách sessions vào workspaceState cục bộ.
   */
  async saveSessions(sessions) {
    await this.workspaceState.update(STORAGE_KEY_SESSIONS, sessions);
  }
  /**
   * Lấy ID của session đang hoạt động.
   */
  getActiveSessionId() {
    return this.workspaceState.get(STORAGE_KEY_ACTIVE_ID);
  }
  /**
   * Lấy Session đang hoạt động. Nếu chưa có, tự động tạo mới một session mặc định.
   */
  async getOrCreateActiveSession() {
    const sessions = this.getSessions();
    const activeId = this.getActiveSessionId();
    if (activeId) {
      const found = sessions.find((s) => s.id === activeId);
      if (found) {
        return found;
      }
    }
    if (sessions.length > 0) {
      const first = sessions[0];
      await this.workspaceState.update(STORAGE_KEY_ACTIVE_ID, first.id);
      return first;
    }
    return await this.createSession("\u0110o\u1EA1n chat m\u1EDBi");
  }
  /**
   * Tạo một session mới cho workspace hiện tại.
   */
  async createSession(title = "\u0110o\u1EA1n chat m\u1EDBi") {
    const sessions = this.getSessions();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newSession = {
      id: "session-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      title,
      createdAt: now,
      updatedAt: now,
      messages: []
    };
    sessions.unshift(newSession);
    await this.saveSessions(sessions);
    await this.workspaceState.update(STORAGE_KEY_ACTIVE_ID, newSession.id);
    return newSession;
  }
  /**
   * Chuyển đổi sang session khác theo ID.
   */
  async switchSession(sessionId) {
    const sessions = this.getSessions();
    const target = sessions.find((s) => s.id === sessionId);
    if (target) {
      await this.workspaceState.update(STORAGE_KEY_ACTIVE_ID, target.id);
      return target;
    }
    return void 0;
  }
  /**
   * Cập nhật danh sách tin nhắn và tự động đặt tiêu đề thông minh từ câu hỏi đầu tiên.
   */
  async updateSessionMessages(sessionId, messages) {
    const sessions = this.getSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return void 0;
    session.messages = messages;
    session.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    if (session.title === "\u0110o\u1EA1n chat m\u1EDBi" && messages.length > 0) {
      const firstUserMsg = messages.find((m) => m.role === "user");
      if (firstUserMsg && firstUserMsg.content.trim()) {
        const cleanText = firstUserMsg.content.trim().replace(/\s+/g, " ");
        session.title = cleanText.length > 35 ? cleanText.slice(0, 35) + "..." : cleanText;
      }
    }
    await this.saveSessions(sessions);
    return session;
  }
  /**
   * Xóa một session.
   */
  async deleteSession(sessionId) {
    let sessions = this.getSessions();
    sessions = sessions.filter((s) => s.id !== sessionId);
    await this.saveSessions(sessions);
    const activeId = this.getActiveSessionId();
    if (activeId === sessionId) {
      if (sessions.length > 0) {
        await this.workspaceState.update(STORAGE_KEY_ACTIVE_ID, sessions[0].id);
        return sessions[0];
      } else {
        return await this.createSession("\u0110o\u1EA1n chat m\u1EDBi");
      }
    }
    return await this.getOrCreateActiveSession();
  }
  /**
   * Xóa toàn bộ lịch sử các sessions trong workspace hiện tại.
   */
  async clearAllSessions() {
    await this.saveSessions([]);
    await this.workspaceState.update(STORAGE_KEY_ACTIVE_ID, void 0);
    return await this.createSession("\u0110o\u1EA1n chat m\u1EDBi");
  }
};

// src/extension/src/providers/ChatViewProvider.ts
var vscode4 = __toESM(require("vscode"));

// src/extension/src/context/workspaceContext.ts
var vscode2 = __toESM(require("vscode"));
function isExcluded(name, relativePath) {
  const lowerName = name.toLowerCase();
  const lowerPath = relativePath.toLowerCase().replace(/\\/g, "/");
  const excludedDirs = [
    "node_modules",
    ".git",
    ".antigravity-ide",
    ".gemini",
    "dist",
    "build",
    "coverage",
    ".next",
    ".venv",
    "venv",
    "__pycache__",
    ".idea",
    ".vscode"
  ];
  for (const dir of excludedDirs) {
    if (lowerName === dir || lowerPath.startsWith(dir + "/") || lowerPath.includes("/" + dir + "/")) {
      return true;
    }
  }
  if (lowerName === ".env" || lowerName.startsWith(".env.") || lowerName.endsWith(".pem") || lowerName.endsWith(".key") || lowerName.includes("credentials") || lowerName.includes("secret")) {
    return true;
  }
  return false;
}
function getRelativePath(baseUri, targetUri) {
  const basePath = baseUri.path.replace(/\/+$/, "");
  const targetPath = targetUri.path;
  if (targetPath.startsWith(basePath)) {
    return targetPath.slice(basePath.length).replace(/^\/+/, "");
  }
  return vscode2.workspace.asRelativePath(targetUri, false);
}
async function findProjectRootUri() {
  const folders = vscode2.workspace.workspaceFolders;
  if (folders && folders.length > 0) {
    const primaryFolderUri = folders[0].uri;
    const detectedParent = await searchUpwardsForRoot(primaryFolderUri);
    if (detectedParent) {
      return detectedParent;
    }
    return {
      uri: primaryFolderUri,
      name: folders[0].name
    };
  }
  const activeDoc = vscode2.window.activeTextEditor?.document;
  if (activeDoc && activeDoc.uri.scheme === "file") {
    const detected = await searchUpwardsForRoot(activeDoc.uri);
    if (detected) {
      return detected;
    }
    const parentDir = vscode2.Uri.joinPath(activeDoc.uri, "..");
    const folderName = parentDir.path.split("/").filter(Boolean).pop() || "workspace";
    return {
      uri: parentDir,
      name: folderName
    };
  }
  return null;
}
async function searchUpwardsForRoot(startUri) {
  try {
    let currentDir = startUri;
    const stat = await vscode2.workspace.fs.stat(startUri);
    if (stat.type !== vscode2.FileType.Directory) {
      currentDir = vscode2.Uri.joinPath(startUri, "..");
    }
    const markers = [".git", "package.json", "wrangler.jsonc", "wrangler.toml", "Cargo.toml", "pyproject.toml", "go.mod"];
    for (let depth = 0; depth < 6; depth++) {
      for (const marker of markers) {
        try {
          const markerUri = vscode2.Uri.joinPath(currentDir, marker);
          await vscode2.workspace.fs.stat(markerUri);
          const name = currentDir.path.split("/").filter(Boolean).pop() || "project";
          return { uri: currentDir, name };
        } catch {
        }
      }
      const parentDir = vscode2.Uri.joinPath(currentDir, "..");
      if (parentDir.path === currentDir.path) {
        break;
      }
      currentDir = parentDir;
    }
  } catch {
  }
  return null;
}
async function getWorkspaceSummary(maxFiles = 45, maxDepth = 3) {
  const rootInfo = await findProjectRootUri();
  if (!rootInfo) {
    return null;
  }
  const { uri: rootUri, name: rootName } = rootInfo;
  let totalFiles = 0;
  const lines = [];
  async function walk(dirUri, depth, prefix) {
    if (depth > maxDepth || totalFiles >= maxFiles) {
      return;
    }
    try {
      const entries = await vscode2.workspace.fs.readDirectory(dirUri);
      entries.sort((a, b) => {
        if (a[1] === vscode2.FileType.Directory && b[1] !== vscode2.FileType.Directory) return -1;
        if (a[1] !== vscode2.FileType.Directory && b[1] === vscode2.FileType.Directory) return 1;
        return a[0].localeCompare(b[0]);
      });
      for (let i = 0; i < entries.length; i++) {
        if (totalFiles >= maxFiles) break;
        const [name, type] = entries[i];
        const itemUri = vscode2.Uri.joinPath(dirUri, name);
        const relPath = getRelativePath(rootUri, itemUri);
        if (isExcluded(name, relPath)) {
          continue;
        }
        const isLast = i === entries.length - 1;
        const pointer = isLast ? "\u2514\u2500\u2500 " : "\u251C\u2500\u2500 ";
        const nextPrefix = prefix + (isLast ? "    " : "\u2502   ");
        if (type === vscode2.FileType.Directory) {
          lines.push(`${prefix}${pointer}\u{1F4C1} ${name}/`);
          await walk(itemUri, depth + 1, nextPrefix);
        } else if (type === vscode2.FileType.File) {
          totalFiles++;
          lines.push(`${prefix}${pointer}\u{1F4C4} ${name}`);
        }
      }
    } catch {
    }
  }
  await walk(rootUri, 1, "");
  let manifestInfo;
  try {
    const pkgUri = vscode2.Uri.joinPath(rootUri, "package.json");
    const bytes = await vscode2.workspace.fs.readFile(pkgUri);
    const text = new TextDecoder("utf-8").decode(bytes);
    const pkg = JSON.parse(text);
    manifestInfo = `D\u1EF1 \xE1n: ${pkg.name || "N/A"} (v${pkg.version || "0.1.0"})
Dependencies ch\xEDnh: ${Object.keys(pkg.dependencies || {}).slice(0, 8).join(", ") || "kh\xF4ng c\xF3"}`;
  } catch {
  }
  return {
    rootUri,
    rootName,
    fileTree: lines.join("\n"),
    manifestInfo,
    fileCount: totalFiles
  };
}
async function collectProjectContextFiles(rootUri, promptText, activeDoc) {
  const result = [];
  const readPaths = /* @__PURE__ */ new Set();
  async function tryReadFile(relativeFilePath, maxChars = 2500) {
    const normalized = relativeFilePath.replace(/\\/g, "/").replace(/^\/+/, "");
    if (readPaths.has(normalized)) return false;
    const baseName = normalized.split("/").pop() || "";
    if (isExcluded(baseName, normalized)) return false;
    try {
      const fileUri = vscode2.Uri.joinPath(rootUri, normalized);
      const stat = await vscode2.workspace.fs.stat(fileUri);
      if (stat.type !== vscode2.FileType.File) return false;
      if (stat.size > 200 * 1024) return false;
      const bytes = await vscode2.workspace.fs.readFile(fileUri);
      const content = new TextDecoder("utf-8").decode(bytes);
      if (!content.trim()) return false;
      const lang = getLanguageFromPath(normalized);
      result.push({
        path: normalized,
        language: lang,
        content: content.slice(0, maxChars)
      });
      readPaths.add(normalized);
      return true;
    } catch {
      return false;
    }
  }
  const taskPaths = [
    "journal/tasks/TASK_BOARD.md",
    "TASK_BOARD.md",
    "TODO.md"
  ];
  for (const tPath of taskPaths) {
    if (await tryReadFile(tPath, 2500)) break;
  }
  const docPaths = [
    "README.md",
    "journal/requirements/SRS.md"
  ];
  for (const dPath of docPaths) {
    if (await tryReadFile(dPath, 2500)) break;
  }
  await tryReadFile("package.json", 1500);
  const fileMentionRegex = /(?:[\w.-]+[\\/])*[\w.-]+\.(?:ts|js|tsx|jsx|json|md|html|css|py|rs|go|ps1|yml|yaml)/gi;
  const matches = promptText.match(fileMentionRegex);
  if (matches) {
    for (const match of matches) {
      if (result.length >= 5) break;
      const cleanMatch = match.replace(/^[./\\]+/, "").trim();
      const ok = await tryReadFile(cleanMatch, 4e3);
      if (!ok) {
        try {
          const fileNameOnly = cleanMatch.split(/[\\/]/).pop();
          if (fileNameOnly) {
            const foundUris = await vscode2.workspace.findFiles(`**/${fileNameOnly}`, "**/node_modules/**", 1);
            for (const fUri of foundUris) {
              const rel = getRelativePath(rootUri, fUri);
              await tryReadFile(rel, 4e3);
              break;
            }
          }
        } catch {
        }
      }
    }
  }
  if (activeDoc && activeDoc.uri.scheme === "file") {
    const activeRelPath = getRelativePath(rootUri, activeDoc.uri);
    const activeBaseName = activeRelPath.split(/[\\/]/).pop() || "";
    if (!readPaths.has(activeRelPath) && !isExcluded(activeBaseName, activeRelPath)) {
      const content = activeDoc.getText();
      if (content.trim()) {
        result.push({
          path: activeRelPath,
          language: activeDoc.languageId,
          content: content.slice(0, 3e3)
        });
      }
    }
  }
  return result;
}
function getLanguageFromPath(pathStr) {
  const ext = pathStr.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "ts":
      return "typescript";
    case "tsx":
      return "typescriptreact";
    case "js":
    case "mjs":
    case "cjs":
      return "javascript";
    case "json":
    case "jsonc":
      return "json";
    case "md":
      return "markdown";
    case "html":
      return "html";
    case "css":
      return "css";
    case "ps1":
      return "powershell";
    case "py":
      return "python";
    case "rs":
      return "rust";
    case "go":
      return "go";
    default:
      return "plaintext";
  }
}

// src/extension/src/agent/patchManager.ts
var vscode3 = __toESM(require("vscode"));
var path = __toESM(require("path"));
var os = __toESM(require("os"));
var fs = __toESM(require("fs"));
async function previewFileDiff(relativePath, newContent) {
  const rootInfo = await findProjectRootUri();
  if (!rootInfo) {
    vscode3.window.showErrorMessage("[NesCode] Kh\xF4ng t\xECm th\u1EA5y th\u01B0 m\u1EE5c d\u1EF1 \xE1n \u0111ang m\u1EDF.");
    return false;
  }
  const cleanPath = relativePath.trim().replace(/\\/g, "/").replace(/^\/+/, "");
  if (!cleanPath || cleanPath.includes("..")) {
    vscode3.window.showErrorMessage("[NesCode] \u0110\u01B0\u1EDDng d\u1EABn file kh\xF4ng an to\xE0n.");
    return false;
  }
  const targetUri = vscode3.Uri.joinPath(rootInfo.uri, cleanPath);
  try {
    const fileName = path.basename(cleanPath);
    const tempDir = path.join(os.tmpdir(), "nescode_diff_previews");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempFilePath = path.join(tempDir, `proposed_${Date.now()}_${fileName}`);
    fs.writeFileSync(tempFilePath, newContent, "utf-8");
    const previewUri = vscode3.Uri.file(tempFilePath);
    let originalUri = targetUri;
    try {
      await vscode3.workspace.fs.stat(targetUri);
    } catch {
      const emptyOrigPath = path.join(tempDir, `empty_${Date.now()}_${fileName}`);
      fs.writeFileSync(emptyOrigPath, "", "utf-8");
      originalUri = vscode3.Uri.file(emptyOrigPath);
    }
    const diffTitle = `So S\xE1nh: ${cleanPath} (G\u1ED1c \u27F7 AI \u0110\u1EC1 Xu\u1EA5t)`;
    await vscode3.commands.executeCommand("vscode.diff", originalUri, previewUri, diffTitle);
    return true;
  } catch (err) {
    vscode3.window.showErrorMessage(`[NesCode] Kh\xF4ng th\u1EC3 m\u1EDF Diff Preview: ${err?.message || err}`);
    return false;
  }
}
async function applyFileChange(relativePath, newContent) {
  const rootInfo = await findProjectRootUri();
  if (!rootInfo) {
    return { ok: false, message: "Kh\xF4ng t\xECm th\u1EA5y th\u01B0 m\u1EE5c d\u1EF1 \xE1n \u0111ang m\u1EDF." };
  }
  const cleanPath = relativePath.trim().replace(/\\/g, "/").replace(/^\/+/, "");
  if (!cleanPath || cleanPath.includes("..")) {
    return { ok: false, message: "\u0110\u01B0\u1EDDng d\u1EABn file kh\xF4ng an to\xE0n ho\u1EB7c ch\u1EE9a path traversal." };
  }
  const targetUri = vscode3.Uri.joinPath(rootInfo.uri, cleanPath);
  const openDoc = vscode3.workspace.textDocuments.find(
    (d) => d.uri.fsPath.toLowerCase() === targetUri.fsPath.toLowerCase()
  );
  if (openDoc && openDoc.isDirty) {
    const choice = await vscode3.window.showWarningMessage(
      `T\u1EC7p '${cleanPath}' \u0111ang c\xF3 c\xE1c thay \u0111\u1ED5i ch\u01B0a l\u01B0u trong tr\xECnh so\u1EA1n th\u1EA3o. B\u1EA1n c\xF3 ch\u1EAFc mu\u1ED1n ghi \u0111\xE8 n\u1ED9i dung do AI \u0111\u1EC1 xu\u1EA5t kh\xF4ng?`,
      { modal: true },
      "Ghi \u0110\xE8",
      "H\u1EE7y B\u1ECF"
    );
    if (choice !== "Ghi \u0110\xE8") {
      return {
        ok: false,
        message: `\u0110\xE3 h\u1EE7y \xE1p d\u1EE5ng thay \u0111\u1ED5i cho '${cleanPath}' v\xEC t\u1EC7p c\xF3 s\u1EEDa \u0111\u1ED5i ch\u01B0a l\u01B0u.`
      };
    }
  }
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(newContent);
    await vscode3.workspace.fs.writeFile(targetUri, data);
    const doc = await vscode3.workspace.openTextDocument(targetUri);
    await vscode3.window.showTextDocument(doc, { preview: false });
    return {
      ok: true,
      message: `\u0110\xE3 c\u1EADp nh\u1EADt th\xE0nh c\xF4ng file: ${cleanPath}`,
      uri: targetUri
    };
  } catch (err) {
    return {
      ok: false,
      message: `L\u1ED7i khi ghi file ${cleanPath}: ${err?.message || err}`
    };
  }
}
async function openFileInEditor(relativePath) {
  const rootInfo = await findProjectRootUri();
  if (!rootInfo) return false;
  const cleanPath = relativePath.trim().replace(/\\/g, "/").replace(/^\/+/, "");
  if (!cleanPath || cleanPath.includes("..")) return false;
  const targetUri = vscode3.Uri.joinPath(rootInfo.uri, cleanPath);
  try {
    const doc = await vscode3.workspace.openTextDocument(targetUri);
    await vscode3.window.showTextDocument(doc, { preview: false });
    return true;
  } catch {
    return false;
  }
}
async function executeTerminalCommand(commandText) {
  const cleanCmd = commandText.trim();
  if (!cleanCmd) return false;
  let terminal = vscode3.window.terminals.find((t) => t.name === "NesCode Terminal");
  if (!terminal) {
    terminal = vscode3.window.createTerminal("NesCode Terminal");
  }
  terminal.show();
  terminal.sendText(cleanCmd);
  return true;
}

// src/extension/src/providers/ChatViewProvider.ts
var ChatViewProvider = class {
  constructor(extensionUri, client, sessionManager) {
    this.extensionUri = extensionUri;
    this.client = client;
    this.sessionManager = sessionManager;
  }
  extensionUri;
  client;
  sessionManager;
  view;
  currentAbortController;
  currentSession;
  async resolveWebviewView(webviewView, _context, _token) {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode4.Uri.joinPath(this.extensionUri, "media")]
    };
    this.currentSession = await this.sessionManager.getOrCreateActiveSession();
    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);
    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case "WEBVIEW_READY":
          await this.syncSessionStateToWebview();
          this.sendEditorContext();
          break;
        case "SEND_PROMPT":
          await this.handleUserPrompt(message.prompt, message.mode, message.attachContext);
          break;
        case "STOP_GENERATION":
          if (this.currentAbortController) {
            this.currentAbortController.abort();
            this.currentAbortController = void 0;
          }
          break;
        case "CREATE_NEW_SESSION":
          this.currentSession = await this.sessionManager.createSession("\u0110o\u1EA1n chat m\u1EDBi");
          await this.syncSessionStateToWebview();
          break;
        case "SWITCH_SESSION":
          if (typeof message.sessionId === "string") {
            const switched = await this.sessionManager.switchSession(message.sessionId);
            if (switched) {
              this.currentSession = switched;
              await this.syncSessionStateToWebview();
            }
          }
          break;
        case "DELETE_SESSION":
          if (typeof message.sessionId === "string") {
            this.currentSession = await this.sessionManager.deleteSession(message.sessionId);
            await this.syncSessionStateToWebview();
          }
          break;
        case "CLEAR_ALL_SESSIONS":
          this.currentSession = await this.sessionManager.clearAllSessions();
          await this.syncSessionStateToWebview();
          vscode4.window.showInformationMessage("\u0110\xE3 x\xF3a to\xE0n b\u1ED9 l\u1ECBch s\u1EED chat trong d\u1EF1 \xE1n n\xE0y.");
          break;
        case "OPEN_SETTINGS":
          await vscode4.commands.executeCommand("nescode.configureConnection");
          break;
        case "CHECK_CONNECTION":
          await vscode4.commands.executeCommand("nescode.checkConnection");
          break;
        case "COPY_TEXT":
          if (typeof message.text === "string") {
            await vscode4.env.clipboard.writeText(message.text);
            vscode4.window.showInformationMessage("\u0110\xE3 sao ch\xE9p v\xE0o b\u1ED9 nh\u1EDB t\u1EA1m.");
          }
          break;
        case "APPLY_FILE_ACTION":
          if (typeof message.path === "string" && typeof message.content === "string") {
            const result = await applyFileChange(message.path, message.content);
            if (result.ok) {
              vscode4.window.showInformationMessage(`[NesCode] ${result.message}`);
              this.view?.webview.postMessage({
                type: "ACTION_APPLIED",
                actionId: message.actionId,
                success: true
              });
            } else {
              vscode4.window.showErrorMessage(`[NesCode] ${result.message}`);
            }
          }
          break;
        case "EXECUTE_TERMINAL_COMMAND":
          if (typeof message.command === "string") {
            const ok = await executeTerminalCommand(message.command);
            if (ok) {
              vscode4.window.showInformationMessage(`[NesCode] \u0110\xE3 g\u1EEDi l\u1EC7nh t\u1EDBi Terminal: ${message.command}`);
            }
          }
          break;
        case "OPEN_FILE":
          if (typeof message.path === "string") {
            await openFileInEditor(message.path);
          }
          break;
        case "DIFF_FILE_ACTION":
          if (typeof message.path === "string" && typeof message.content === "string") {
            await previewFileDiff(message.path, message.content);
          }
          break;
        case "CLOSE_VIEW":
          try {
            await vscode4.commands.executeCommand("workbench.action.closeSidebar");
          } catch {
          }
          try {
            await vscode4.commands.executeCommand("workbench.action.closeAuxiliaryBar");
          } catch {
          }
          break;
        case "REQUEST_EDITOR_CONTEXT":
          this.sendEditorContext();
          break;
      }
    });
    vscode4.window.onDidChangeActiveTextEditor(() => {
      this.sendEditorContext();
    });
    vscode4.window.onDidChangeTextEditorSelection(() => {
      this.sendEditorContext();
    });
  }
  /**
   * Đồng bộ trạng thái Session và lịch sử tin nhắn xuống Webview
   */
  async syncSessionStateToWebview() {
    if (!this.view) return;
    const sessions = this.sessionManager.getSessions();
    if (!this.currentSession) {
      this.currentSession = await this.sessionManager.getOrCreateActiveSession();
    }
    this.view.webview.postMessage({
      type: "SESSION_STATE_SYNC",
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
  sendEditorContext() {
    const editor = vscode4.window.activeTextEditor;
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
      filePath: vscode4.workspace.asRelativePath(doc.uri),
      language: doc.languageId,
      hasSelection,
      selectedLines: hasSelection ? selection.end.line - selection.start.line + 1 : 0
    });
  }
  /**
   * Kích hoạt prompt trực tiếp từ các lệnh menu chuột phải (Explain, Fix, Generate Tests).
   */
  async executeEditorPrompt(mode) {
    await vscode4.commands.executeCommand("nescode.chatView.focus");
    const editor = vscode4.window.activeTextEditor;
    const hasSelection = editor && !editor.selection.isEmpty && editor.document.getText(editor.selection).trim().length > 0;
    const fileName = editor ? vscode4.workspace.asRelativePath(editor.document.uri) : "";
    let prompt = "";
    if (mode === "explain") {
      prompt = hasSelection ? `H\xE3y gi\u1EA3i th\xEDch chi ti\u1EBFt m\u1EE5c \u0111\xEDch, lu\u1ED3ng ho\u1EA1t \u0111\u1ED9ng v\xE0 c\xE1c \u0111i\u1EC3m l\u01B0u \xFD c\u1EE7a \u0111o\u1EA1n m\xE3 \u0111ang ch\u1ECDn trong t\u1EC7p ${fileName}.` : `H\xE3y gi\u1EA3i th\xEDch t\u1ED5ng quan ki\u1EBFn tr\xFAc, ch\u1EE9c n\u0103ng ch\xEDnh v\xE0 lu\u1ED3ng x\u1EED l\xFD c\u1EE7a t\u1EC7p ${fileName}.`;
    } else if (mode === "fix") {
      prompt = hasSelection ? `H\xE3y r\xE0 so\xE1t \u0111o\u1EA1n m\xE3 \u0111ang ch\u1ECDn trong t\u1EC7p ${fileName}, ch\u1EC9 ra c\xE1c l\u1ED7i logic, b\u1EA3o m\u1EADt ho\u1EB7c hi\u1EC7u n\u0103ng v\xE0 \u0111\u1EC1 xu\u1EA5t b\u1EA3n s\u1EEDa l\u1ED7i.` : `H\xE3y r\xE0 so\xE1t to\xE0n b\u1ED9 t\u1EC7p ${fileName}, t\xECm c\xE1c l\u1ED7i ti\u1EC1m \u1EA9n v\xE0 \u0111\u1EC1 xu\u1EA5t b\u1EA3n s\u1EEDa l\u1ED7i ho\xE0n ch\u1EC9nh.`;
    } else if (mode === "generate_tests") {
      prompt = hasSelection ? `H\xE3y t\u1EA1o m\u1ED9t b\u1ED9 ki\u1EC3m th\u1EED \u0111\u01A1n v\u1ECB (unit tests) ho\xE0n ch\u1EC9nh cho \u0111o\u1EA1n m\xE3 \u0111ang ch\u1ECDn trong t\u1EC7p ${fileName}, bao g\u1ED3m c\u1EA3 c\xE1c tr\u01B0\u1EDDng h\u1EE3p bi\xEAn.` : `H\xE3y t\u1EA1o b\u1ED9 ki\u1EC3m th\u1EED \u0111\u01A1n v\u1ECB (unit tests) \u0111\u1EA7y \u0111\u1EE7 cho c\xE1c h\xE0m v\xE0 l\u1EDBp trong t\u1EC7p ${fileName}.`;
    } else {
      prompt = `Xin ch\xE0o! T\xF4i c\u1EA7n h\u1ED7 tr\u1EE3 l\u1EADp tr\xECnh v\u1EDBi t\u1EC7p ${fileName}.`;
    }
    await this.handleUserPrompt(prompt, mode, true);
  }
  async handleUserPrompt(promptText, mode = "chat", attachContext = true) {
    const cleanPrompt = promptText.trim();
    if (!cleanPrompt) return;
    if (!this.currentSession) {
      this.currentSession = await this.sessionManager.getOrCreateActiveSession();
    }
    let contextData;
    if (attachContext) {
      contextData = {};
      const rootInfo = await findProjectRootUri();
      const wsSummary = await getWorkspaceSummary();
      if (wsSummary) {
        contextData.workspaceTree = `D\u1EF1 \xE1n: ${wsSummary.rootName} (${wsSummary.fileCount} files)
${wsSummary.manifestInfo ? wsSummary.manifestInfo + "\n" : ""}
${wsSummary.fileTree}`;
      }
      const editor = vscode4.window.activeTextEditor;
      if (rootInfo) {
        const autoFiles = await collectProjectContextFiles(rootInfo.uri, cleanPrompt, editor?.document);
        if (autoFiles.length > 0) {
          contextData.files = autoFiles;
        }
      }
      if (editor) {
        const doc = editor.document;
        const relativePath = vscode4.workspace.asRelativePath(doc.uri);
        const selectionText = doc.getText(editor.selection);
        if (!editor.selection.isEmpty && selectionText.trim()) {
          contextData.selection = {
            path: relativePath,
            language: doc.languageId,
            content: selectionText.slice(0, 1e4)
          };
        }
      }
    }
    const userMsgId = "msg-" + Date.now();
    const userMsg = {
      id: userMsgId,
      role: "user",
      content: cleanPrompt,
      timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    };
    this.currentSession.messages.push(userMsg);
    await this.sessionManager.updateSessionMessages(
      this.currentSession.id,
      this.currentSession.messages
    );
    this.view?.webview.postMessage({
      type: "USER_MESSAGE_ADDED",
      message: userMsg,
      sessionTitle: this.currentSession.title
    });
    const assistantMsgId = "msg-" + (Date.now() + 1);
    const assistantMsg = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    };
    this.currentSession.messages.push(assistantMsg);
    this.view?.webview.postMessage({
      type: "ASSISTANT_STREAM_START",
      message: assistantMsg
    });
    this.currentAbortController = new AbortController();
    const chatRequest = {
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
            const now = Date.now();
            if (now - lastSaveTime > 1200) {
              lastSaveTime = now;
              if (this.currentSession) {
                this.sessionManager.updateSessionMessages(
                  this.currentSession.id,
                  this.currentSession.messages
                ).catch(() => {
                });
              }
            }
          },
          onError: async (err) => {
            assistantMsg.content += `

\u26A0\uFE0F **[L\u1ED7i ${err.code}]**: ${err.message}`;
            this.view?.webview.postMessage({
              type: "STREAM_ERROR",
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
              assistantMsg.content = "Xin l\u1ED7i, ph\u1EA3n h\u1ED3i t\u1EEB m\xE1y ch\u1EE7 AI b\u1ECB gi\xE1n \u0111o\u1EA1n ho\u1EB7c ch\u01B0a k\u1ECBp t\u1EA1o d\u1EEF li\u1EC7u. B\u1EA1n h\xE3y b\u1EA5m g\u1EEDi l\u1EA1i nh\xE9.";
              this.view?.webview.postMessage({
                type: "STREAM_CHUNK",
                messageId: assistantMsgId,
                delta: assistantMsg.content,
                fullContent: assistantMsg.content
              });
            }
            this.view?.webview.postMessage({
              type: "STREAM_COMPLETED",
              messageId: assistantMsgId,
              fullContent: assistantMsg.content
            });
            this.currentAbortController = void 0;
            if (this.currentSession) {
              await this.sessionManager.updateSessionMessages(
                this.currentSession.id,
                this.currentSession.messages
              );
              await this.syncSessionStateToWebview();
            }
          }
        },
        this.currentAbortController.signal
      );
    } catch (error) {
      const errorMsg = error?.message || String(error);
      assistantMsg.content += `

\u26A0\uFE0F **[L\u1ED7i k\u1EBFt n\u1ED1i]**: ${errorMsg}`;
      this.view?.webview.postMessage({
        type: "STREAM_ERROR",
        messageId: assistantMsgId,
        error: { code: "NETWORK_ERROR", message: errorMsg },
        fullContent: assistantMsg.content
      });
      this.currentAbortController = void 0;
      if (this.currentSession) {
        await this.sessionManager.updateSessionMessages(
          this.currentSession.id,
          this.currentSession.messages
        );
      }
    }
  }
  getHtmlForWebview(webview) {
    const scriptUri = webview.asWebviewUri(
      vscode4.Uri.joinPath(this.extensionUri, "media", "chat.js")
    );
    const styleUri = webview.asWebviewUri(
      vscode4.Uri.joinPath(this.extensionUri, "media", "chat.css")
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
    <div class="session-title-badge" id="btnToggleHistory" title="B\u1EA5m \u0111\u1EC3 xem danh s\xE1ch l\u1ECBch s\u1EED c\xE1c phi\xEAn chat trong d\u1EF1 \xE1n n\xE0y">
      <div class="status-dot"></div>
      <span id="currentSessionTitle">\u0110o\u1EA1n chat m\u1EDBi</span>
      <span style="font-size: 9px; opacity: 0.6;">\u25BC</span>
    </div>
    <div class="header-actions">
      <button class="icon-btn" id="btnNewSession" title="T\u1EA1o \u0111o\u1EA1n chat m\u1EDBi trong d\u1EF1 \xE1n (+)">\u2795</button>
      <button class="icon-btn" id="btnHistory" title="L\u1ECBch s\u1EED c\xE1c phi\xEAn chat (D\u1EF1 \xE1n n\xE0y)">\u{1F4DC}</button>
      <button class="icon-btn" id="btnSettings" title="C\u1EA5u h\xECnh k\u1EBFt n\u1ED1i Worker">\u2699</button>
      <button class="icon-btn close-btn" id="btnCloseSidebar" title="\u0110\xF3ng b\u1EA3ng chat (\u2715)">\u2715</button>
    </div>
  </header>

  <!-- Drawer danh s\xE1ch sessions trong d\u1EF1 \xE1n -->
  <div id="historyDrawer">
    <div class="drawer-header">
      <h5>L\u1ECBch s\u1EED phi\xEAn chat (D\u1EF1 \xE1n n\xE0y)</h5>
      <div class="drawer-actions">
        <button class="drawer-btn danger" id="btnClearAll" title="X\xF3a to\xE0n b\u1ED9 l\u1ECBch s\u1EED trong d\u1EF1 \xE1n">X\xF3a t\u1EA5t c\u1EA3</button>
        <button class="drawer-btn" id="btnCloseDrawer">\u2715</button>
      </div>
    </div>
    <div class="session-list" id="sessionList">
      <!-- Session items will be dynamically rendered here -->
    </div>
  </div>

  <div id="transcript">
    <div class="empty-state" id="emptyState">
      <h4>Xin ch\xE0o! T\xF4i l\xE0 NesCode</h4>
      <p>Tr\u1EE3 l\xFD l\u1EADp tr\xECnh AI v\u1EADn h\xE0nh tr\xEAn Cloudflare Workers AI.<br>M\u1ECDi phi\xEAn chat v\xE0 tr\u1EA1ng th\xE1i \u0111\u1EC1u \u0111\u01B0\u1EE3c t\u1EF1 \u0111\u1ED9ng l\u01B0u ri\xEAng bi\u1EC7t theo t\u1EEBng d\u1EF1 \xE1n c\u1EE7a b\u1EA1n.</p>
    </div>
  </div>

  <footer>
    <div class="context-bar" id="contextBar">
      <div class="context-chip-wrap">
        <span id="contextInfo">\u{1F4CE} Kh\xF4ng c\xF3 file \u0111ang m\u1EDF</span>
        <button class="chip-close-btn" id="btnRemoveContext" title="B\u1ECF \u0111\xEDnh k\xE8m file n\xE0y" style="display: none;">\u2715</button>
      </div>
      <label><input type="checkbox" id="chkAttachContext" checked> \u0110\xEDnh k\xE8m Context D\u1EF1 \xC1n</label>
    </div>
    <div class="composer">
      <textarea id="promptInput" placeholder="Nh\u1EADp c\xE2u h\u1ECFi l\u1EADp tr\xECnh... (Enter \u0111\u1EC3 g\u1EEDi, Shift+Enter xu\u1ED1ng d\xF2ng)"></textarea>
      <button class="send-btn" id="btnSend">G\u1EEDi</button>
      <button class="stop-btn" id="btnStop">D\u1EEBng</button>
    </div>
  </footer>

  <script src="${scriptUri}"></script>
</body>
</html>`;
  }
};

// src/extension/src/commands/configureConnection.ts
var vscode5 = __toESM(require("vscode"));
async function registerConfigureConnectionCommand(secretManager, client) {
  return vscode5.commands.registerCommand("nescode.configureConnection", async () => {
    const config = vscode5.workspace.getConfiguration("nescode");
    const currentUrl = config.get("apiBaseUrl", "");
    const enteredUrl = await vscode5.window.showInputBox({
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
    const enteredKey = await vscode5.window.showInputBox({
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
    await config.update("apiBaseUrl", cleanUrl, vscode5.ConfigurationTarget.Global);
    await secretManager.setApiKey(enteredKey.trim());
    vscode5.window.withProgress(
      {
        location: vscode5.ProgressLocation.Notification,
        title: "NesCode: \u0110ang ki\u1EC3m tra k\u1EBFt n\u1ED1i t\u1EDBi Cloudflare Worker...",
        cancellable: false
      },
      async () => {
        const health = await client.checkHealth();
        if (health.ok && health.data) {
          vscode5.window.showInformationMessage(
            `K\u1EBFt n\u1ED1i th\xE0nh c\xF4ng! Worker: ${health.data.service} (Model: ${health.data.defaultModel})`
          );
        } else {
          vscode5.window.showWarningMessage(
            `\u0110\xE3 l\u01B0u c\u1EA5u h\xECnh nh\u01B0ng ki\u1EC3m tra k\u1EBFt n\u1ED1i th\u1EA5t b\u1EA1i: ${health.error}`
          );
        }
      }
    );
  });
}

// src/extension/src/commands/checkConnection.ts
var vscode6 = __toESM(require("vscode"));
function registerCheckConnectionCommand(client) {
  return vscode6.commands.registerCommand("nescode.checkConnection", async () => {
    vscode6.window.withProgress(
      {
        location: vscode6.ProgressLocation.Notification,
        title: "NesCode: \u0110ang ki\u1EC3m tra tr\u1EA1ng th\xE1i k\u1EBFt n\u1ED1i Cloudflare Worker...",
        cancellable: false
      },
      async () => {
        const health = await client.checkHealth();
        if (health.ok && health.data) {
          vscode6.window.showInformationMessage(
            `Tr\u1EA1ng th\xE1i: \u0110\xC3 K\u1EBET N\u1ED0I (Connected) | Model: ${health.data.defaultModel} | Streaming: ${health.data.streamingEnabled ? "B\u1EADt" : "T\u1EAFt"}`
          );
        } else {
          const action = await vscode6.window.showErrorMessage(
            `Tr\u1EA1ng th\xE1i: M\u1EA4T K\u1EBET N\u1ED0I (Disconnected) | ${health.error}`,
            "C\u1EA5u H\xECnh L\u1EA1i"
          );
          if (action === "C\u1EA5u H\xECnh L\u1EA1i") {
            vscode6.commands.executeCommand("nescode.configureConnection");
          }
        }
      }
    );
  });
}

// src/extension/src/commands/openChat.ts
var vscode7 = __toESM(require("vscode"));
function registerOpenChatCommand() {
  return vscode7.commands.registerCommand("nescode.openChat", async () => {
    await vscode7.commands.executeCommand("nescode.chatView.focus");
  });
}

// src/extension/src/commands/codeActions.ts
var vscode8 = __toESM(require("vscode"));
function registerCodeActionCommands(chatProvider) {
  return [
    vscode8.commands.registerCommand("nescode.explainCode", async () => {
      await chatProvider.executeEditorPrompt("explain");
    }),
    vscode8.commands.registerCommand("nescode.fixCode", async () => {
      await chatProvider.executeEditorPrompt("fix");
    }),
    vscode8.commands.registerCommand("nescode.generateTests", async () => {
      await chatProvider.executeEditorPrompt("generate_tests");
    })
  ];
}

// src/extension/src/extension.ts
async function activate(context) {
  const outputChannel = vscode9.window.createOutputChannel("NesCode AI");
  context.subscriptions.push(outputChannel);
  const secretManager = new SecretManager(context.secrets);
  const client = new WorkerClient(secretManager);
  client.setOutputChannel(outputChannel);
  const sessionManager = new SessionManager(context.workspaceState);
  const chatProvider = new ChatViewProvider(context.extensionUri, client, sessionManager);
  context.subscriptions.push(
    vscode9.window.registerWebviewViewProvider("nescode.chatView", chatProvider)
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
  context.subscriptions.push(
    ...registerCodeActionCommands(chatProvider)
  );
  outputChannel.appendLine("[NesCode] Ti\u1EC7n \xEDch NesCode for Antigravity \u0111\xE3 k\xEDch ho\u1EA1t th\xE0nh c\xF4ng.");
  const conn = await client.getConfig();
  if (!conn) {
    vscode9.window.showInformationMessage(
      "Ch\xE0o m\u1EEBng \u0111\u1EBFn v\u1EDBi NesCode for Antigravity! Vui l\xF2ng c\u1EA5u h\xECnh Cloudflare Worker URL v\xE0 API Key \u0111\u1EC3 b\u1EAFt \u0111\u1EA7u.",
      "C\u1EA5u H\xECnh Ngay"
    ).then((action) => {
      if (action === "C\u1EA5u H\xECnh Ngay") {
        vscode9.commands.executeCommand("nescode.configureConnection");
      }
    });
  } else {
    outputChannel.appendLine(`[NesCode] Worker URL hi\u1EC7n t\u1EA1i: ${conn.baseUrl}`);
  }
}
function deactivate() {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
