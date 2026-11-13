// NesCode AI Chat Client Script
const vscode = acquireVsCodeApi();

const transcript = document.getElementById('transcript');
const emptyState = document.getElementById('emptyState');
const promptInput = document.getElementById('promptInput');
const btnSend = document.getElementById('btnSend');
const btnStop = document.getElementById('btnStop');
const btnNewSession = document.getElementById('btnNewSession');
const btnHistory = document.getElementById('btnHistory');
const btnToggleHistory = document.getElementById('btnToggleHistory');
const btnCloseDrawer = document.getElementById('btnCloseDrawer');
const btnClearAll = document.getElementById('btnClearAll');
const btnSettings = document.getElementById('btnSettings');
const contextInfo = document.getElementById('contextInfo');
const chkAttachContext = document.getElementById('chkAttachContext');
const currentSessionTitle = document.getElementById('currentSessionTitle');
const historyDrawer = document.getElementById('historyDrawer');
const sessionList = document.getElementById('sessionList');

let isStreaming = false;
let activeSessionId = '';

// Khôi phục Persistent State của Webview (draft text, checkbox, drawer)
try {
  const savedState = vscode.getState() || {};
  if (savedState.draftPrompt) {
    promptInput.value = savedState.draftPrompt;
  }
  if (typeof savedState.attachContext === 'boolean') {
    chkAttachContext.checked = savedState.attachContext;
  }
  if (savedState.isDrawerOpen) {
    historyDrawer.classList.add('open');
  }
} catch (e) {
  console.warn('Lỗi khôi phục state:', e);
}

function updateState(partial) {
  try {
    const current = vscode.getState() || {};
    vscode.setState(Object.assign({}, current, partial));
  } catch (e) {
    console.warn('Lỗi ghi state:', e);
  }
}

// Tự động lưu bản nháp khi người dùng gõ
promptInput.addEventListener('input', () => {
  updateState({ draftPrompt: promptInput.value });
});

chkAttachContext.addEventListener('change', () => {
  updateState({ attachContext: chkAttachContext.checked });
});

// Markdown & Reasoning parser chuẩn xác, an toàn
function renderMarkdown(rawText) {
  if (!rawText) return '';
  let escaped = rawText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 1. Parse khối suy nghĩ hoàn chỉnh <think>...</think>
  const thinkRegex = new RegExp('&lt;(?:think|thought)&gt;([\\s\\S]*?)&lt;\\/(?:think|thought)&gt;', 'gi');
  escaped = escaped.replace(thinkRegex, (match, thoughtText) => {
    return '<details class="thought-details" open><summary class="thought-summary">💭 <span>Quá trình suy nghĩ của AI</span></summary><div class="thought-content">' + thoughtText.trim() + '</div></details>';
  });

  // 2. Parse khối suy nghĩ đang stream dở <think>...
  const thinkStreamRegex = new RegExp('&lt;(?:think|thought)&gt;([\\s\\S]*)$', 'gi');
  escaped = escaped.replace(thinkStreamRegex, (match, thoughtText) => {
    return '<details class="thought-details" open><summary class="thought-summary">💭 <span class="thinking-spinner-sm"></span> <span>AI đang suy nghĩ...</span></summary><div class="thought-content">' + thoughtText.trim() + '</div></details>';
  });

  // 3. Code blocks
  const codeBlockRegex = new RegExp('```(\\w*)?\\r?\\n([\\s\\S]*?)```', 'g');
  escaped = escaped.replace(codeBlockRegex, (match, lang, code) => {
    return '<div class="code-container"><div class="code-header"><span>' + (lang || 'code') + '</span><button class="copy-btn" onclick="copyCode(this)">Sao chép</button></div><pre><code>' + code + '</code></pre></div>';
  });

  // 4. Inline code
  const inlineCodeRegex = new RegExp('`([^`]+)`', 'g');
  escaped = escaped.replace(inlineCodeRegex, '<code>$1</code>');

  // 5. Bold & Italic
  const boldRegex = new RegExp('\\*\\*([^\\*]+)\\*\\*', 'g');
  escaped = escaped.replace(boldRegex, '<strong>$1</strong>');

  const italicRegex = new RegExp('\\*([^\\*]+)\\*', 'g');
  escaped = escaped.replace(italicRegex, '<em>$1</em>');

  // 6. Line breaks
  escaped = escaped.replace(/\n/g, '<br>');

  return escaped;
}

window.copyCode = function(button) {
  const container = button.closest('.code-container');
  if (container) {
    const code = container.querySelector('code').innerText;
    vscode.postMessage({ type: 'COPY_TEXT', text: code });
  }
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
  updateState({ draftPrompt: '' });
  setStreamingState(true);
}

function setStreamingState(streaming) {
  isStreaming = streaming;
  btnSend.style.display = streaming ? 'none' : 'block';
  btnStop.style.display = streaming ? 'block' : 'none';
  promptInput.disabled = streaming;
  if (!streaming) {
    promptInput.focus();
  }
}

function toggleHistoryDrawer(open) {
  let isOpen;
  if (typeof open === 'boolean') {
    isOpen = open;
    if (open) historyDrawer.classList.add('open');
    else historyDrawer.classList.remove('open');
  } else {
    isOpen = historyDrawer.classList.toggle('open');
  }
  updateState({ isDrawerOpen: isOpen });
}

function formatTime(isoString) {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  } catch {
    return '';
  }
}

function renderMessages(messages) {
  transcript.innerHTML = '';
  if (!messages || messages.length === 0) {
    transcript.appendChild(emptyState);
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';
  messages.forEach((m) => {
    const div = document.createElement('div');
    div.className = 'message ' + m.role;
    div.id = m.id;
    const metaPrefix = m.role === 'user' ? '' : ' - NesCode AI';
    div.innerHTML = '<div class="message-meta">' + m.timestamp + metaPrefix + '</div><div class="message-content" id="content-' + m.id + '">' + renderMarkdown(m.content) + '</div>';
    transcript.appendChild(div);
  });
  transcript.scrollTop = transcript.scrollHeight;
}

function renderSessionList(sessions, activeId) {
  sessionList.innerHTML = '';
  if (!sessions || sessions.length === 0) {
    sessionList.innerHTML = '<div style="padding: 12px; text-align: center; opacity: 0.6; font-size: 11px;">Chưa có lịch sử phiên chat nào</div>';
    return;
  }

  sessions.forEach((s) => {
    const item = document.createElement('div');
    item.className = 'session-item' + (s.id === activeId ? ' active' : '');

    const info = document.createElement('div');
    info.className = 'session-item-info';
    info.innerHTML = '<div class="session-item-title">' + (s.id === activeId ? '💬 ' : '🗨️ ') + s.title + '</div>' +
      '<div class="session-item-meta">' + s.messageCount + ' tin nhắn • ' + formatTime(s.updatedAt) + '</div>';

    info.addEventListener('click', () => {
      vscode.postMessage({ type: 'SWITCH_SESSION', sessionId: s.id });
      toggleHistoryDrawer(false);
    });

    const delBtn = document.createElement('button');
    delBtn.className = 'session-item-del';
    delBtn.title = 'Xóa phiên chat này';
    delBtn.textContent = '🗑';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      vscode.postMessage({ type: 'DELETE_SESSION', sessionId: s.id });
    });

    item.appendChild(info);
    item.appendChild(delBtn);
    sessionList.appendChild(item);
  });
}

btnSend.addEventListener('click', sendPrompt);

btnStop.addEventListener('click', () => {
  vscode.postMessage({ type: 'STOP_GENERATION' });
  setStreamingState(false);
});

btnNewSession.addEventListener('click', () => {
  vscode.postMessage({ type: 'CREATE_NEW_SESSION' });
  toggleHistoryDrawer(false);
});

btnHistory.addEventListener('click', () => toggleHistoryDrawer());
btnToggleHistory.addEventListener('click', () => toggleHistoryDrawer());
btnCloseDrawer.addEventListener('click', () => toggleHistoryDrawer(false));

btnClearAll.addEventListener('click', () => {
  vscode.postMessage({ type: 'CLEAR_ALL_SESSIONS' });
  toggleHistoryDrawer(false);
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
    case 'SESSION_STATE_SYNC': {
      activeSessionId = msg.activeSessionId;
      updateState({ activeSessionId });
      currentSessionTitle.textContent = msg.activeSessionTitle || 'Đoạn chat mới';
      renderMessages(msg.messages);
      renderSessionList(msg.sessions, activeSessionId);
      setStreamingState(false);
      break;
    }

    case 'USER_MESSAGE_ADDED': {
      if (emptyState) emptyState.style.display = 'none';
      if (msg.sessionTitle) {
        currentSessionTitle.textContent = msg.sessionTitle;
      }
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
      div.innerHTML = '<div class="message-meta">' + msg.message.timestamp + ' - NesCode AI</div>' +
        '<div class="thinking-banner" id="banner-' + msg.message.id + '">' +
          '<div class="thinking-spinner"></div>' +
          '<div class="thinking-info">' +
            '<span class="thinking-title">NesCode đang suy nghĩ...</span>' +
            '<span class="thinking-subtitle">Đang phân tích ngữ cảnh và suy luận câu trả lời</span>' +
          '</div>' +
        '</div>' +
        '<div class="message-content" id="content-' + msg.message.id + '"></div>';
      transcript.appendChild(div);
      transcript.scrollTop = transcript.scrollHeight;
      break;
    }

    case 'STREAM_CHUNK': {
      const banner = document.getElementById('banner-' + msg.messageId);
      const contentBox = document.getElementById('content-' + msg.messageId);

      // Khi đã bắt đầu có nội dung thực tế (và không nằm trong thẻ suy nghĩ)
      if (banner && msg.fullContent && !msg.fullContent.startsWith('<think>')) {
        banner.style.display = 'none';
      }

      if (contentBox) {
        contentBox.innerHTML = renderMarkdown(msg.fullContent);
        transcript.scrollTop = transcript.scrollHeight;
      }
      break;
    }

    case 'STREAM_COMPLETED':
    case 'STREAM_ERROR': {
      setStreamingState(false);
      const banner = document.getElementById('banner-' + msg.messageId);
      if (banner) {
        banner.style.display = 'none';
      }
      const contentBox = document.getElementById('content-' + msg.messageId);
      if (contentBox) {
        contentBox.innerHTML = renderMarkdown(msg.fullContent);
        transcript.scrollTop = transcript.scrollHeight;
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

// Thông báo Webview đã sẵn sàng nhận dữ liệu ban đầu
vscode.postMessage({ type: 'WEBVIEW_READY' });
