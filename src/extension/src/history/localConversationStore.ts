import * as vscode from 'vscode';
import { ChatMessage } from '../../../shared/src/index.js';

export interface WebviewChatMessage extends ChatMessage {
  id: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: WebviewChatMessage[];
}

const STORAGE_KEY_SESSIONS = 'nescode_workspace_sessions_v1';
const STORAGE_KEY_ACTIVE_ID = 'nescode_active_session_id_v1';

export class SessionManager {
  constructor(private readonly workspaceState: vscode.Memento) {}

  /**
   * Lấy toàn bộ danh sách sessions thuộc workspace/dự án hiện tại.
   */
  getSessions(): ChatSession[] {
    return this.workspaceState.get<ChatSession[]>(STORAGE_KEY_SESSIONS, []);
  }

  /**
   * Lưu danh sách sessions vào workspaceState cục bộ.
   */
  private async saveSessions(sessions: ChatSession[]): Promise<void> {
    await this.workspaceState.update(STORAGE_KEY_SESSIONS, sessions);
  }

  /**
   * Lấy ID của session đang hoạt động.
   */
  getActiveSessionId(): string | undefined {
    return this.workspaceState.get<string>(STORAGE_KEY_ACTIVE_ID);
  }

  /**
   * Lấy Session đang hoạt động. Nếu chưa có, tự động tạo mới một session mặc định.
   */
  async getOrCreateActiveSession(): Promise<ChatSession> {
    const sessions = this.getSessions();
    const activeId = this.getActiveSessionId();

    if (activeId) {
      const found = sessions.find((s) => s.id === activeId);
      if (found) {
        return found;
      }
    }

    if (sessions.length > 0) {
      const first = sessions[0]!;
      await this.workspaceState.update(STORAGE_KEY_ACTIVE_ID, first.id);
      return first;
    }

    return await this.createSession('Đoạn chat mới');
  }

  /**
   * Tạo một session mới cho workspace hiện tại.
   */
  async createSession(title = 'Đoạn chat mới'): Promise<ChatSession> {
    const sessions = this.getSessions();
    const now = new Date().toISOString();
    const newSession: ChatSession = {
      id: 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      title,
      createdAt: now,
      updatedAt: now,
      messages: []
    };

    // Đưa session mới lên đầu danh sách
    sessions.unshift(newSession);
    await this.saveSessions(sessions);
    await this.workspaceState.update(STORAGE_KEY_ACTIVE_ID, newSession.id);

    return newSession;
  }

  /**
   * Chuyển đổi sang session khác theo ID.
   */
  async switchSession(sessionId: string): Promise<ChatSession | undefined> {
    const sessions = this.getSessions();
    const target = sessions.find((s) => s.id === sessionId);
    if (target) {
      await this.workspaceState.update(STORAGE_KEY_ACTIVE_ID, target.id);
      return target;
    }
    return undefined;
  }

  /**
   * Cập nhật danh sách tin nhắn và tự động đặt tiêu đề thông minh từ câu hỏi đầu tiên.
   */
  async updateSessionMessages(
    sessionId: string,
    messages: WebviewChatMessage[]
  ): Promise<ChatSession | undefined> {
    const sessions = this.getSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return undefined;

    session.messages = messages;
    session.updatedAt = new Date().toISOString();

    // Nếu tiêu đề vẫn là mặc định và đã có tin nhắn người dùng đầu tiên, tự động đặt tiêu đề
    if (session.title === 'Đoạn chat mới' && messages.length > 0) {
      const firstUserMsg = messages.find((m) => m.role === 'user');
      if (firstUserMsg && firstUserMsg.content.trim()) {
        const cleanText = firstUserMsg.content.trim().replace(/\s+/g, ' ');
        session.title = cleanText.length > 35 ? cleanText.slice(0, 35) + '...' : cleanText;
      }
    }

    await this.saveSessions(sessions);
    return session;
  }

  /**
   * Xóa một session.
   */
  async deleteSession(sessionId: string): Promise<ChatSession> {
    let sessions = this.getSessions();
    sessions = sessions.filter((s) => s.id !== sessionId);
    await this.saveSessions(sessions);

    const activeId = this.getActiveSessionId();
    if (activeId === sessionId) {
      if (sessions.length > 0) {
        await this.workspaceState.update(STORAGE_KEY_ACTIVE_ID, sessions[0]!.id);
        return sessions[0]!;
      } else {
        return await this.createSession('Đoạn chat mới');
      }
    }

    return await this.getOrCreateActiveSession();
  }

  /**
   * Xóa toàn bộ lịch sử các sessions trong workspace hiện tại.
   */
  async clearAllSessions(): Promise<ChatSession> {
    await this.saveSessions([]);
    await this.workspaceState.update(STORAGE_KEY_ACTIVE_ID, undefined);
    return await this.createSession('Đoạn chat mới');
  }
}
