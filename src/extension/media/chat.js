// NesCode AI Chat Client Script (Agentic Edition)
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
const btnCloseSidebar = document.getElementById('btnCloseSidebar');
const btnRemoveContext = document.getElementById('btnRemoveContext');
const contextInfo = document.getElementById('contextInfo');
const chkAttachContext = document.getElementById('chkAttachContext');
const currentSessionTitle = document.getElementById('currentSessionTitle');
const historyDrawer = document.getElementById('historyDrawer');
const sessionList = document.getElementById('sessionList');

// Token breakdown & Agent elements
const tokenUsageBadge = document.getElementById('tokenUsageBadge');
const tokenUsageText = document.getElementById('tokenUsageText');
const segCtx = document.getElementById('segCtx');
const segInp = document.getElementById('segInp');
const segThk = document.getElementById('segThk');
const segOut = document.getElementById('segOut');
const tokenPopover = document.getElementById('tokenPopover');
const tokCtx = document.getElementById('tokCtx');
const tokInp = document.getElementById('tokInp');
const tokThk = document.getElementById('tokThk');
const tokOut = document.getElementById('tokOut');
const tokTotal = document.getElementById('tokTotal');

const slashPopup = document.getElementById('slashPopup');
const agentLoopBanner = document.getElementById('agentLoopBanner');
const agentLoopText = document.getElementById('agentLoopText');

let isStreaming = false;
let activeSessionId = '';
window.__actionStore = window.__actionStore || {};

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

// Hàm giải mã HTML entities về ký tự gốc khi áp dụng code vào file hoặc chạy lệnh terminal
function unescapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

// Markdown & Agent Action parser chuẩn xác, an toàn
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

  // 3. Parse Agent Action: write_file (Đề xuất ghi hoặc sửa file)
  const writeFileRegex = new RegExp('&lt;action\\s+type="write_file"\\s+path="([^"]+)"&gt;([\\s\\S]*?)&lt;\\/action&gt;', 'gi');
  escaped = escaped.replace(writeFileRegex, (match, filePath, codeContent) => {
    const actionId = 'act-' + Math.random().toString(36).substring(2, 9);
    const cleanFilePath = unescapeHtml(filePath.trim());
    const realCode = unescapeHtml(codeContent.trim());
    window.__actionStore[actionId] = { path: cleanFilePath, content: realCode };
    return '<div class="action-card file-action" id="' + actionId + '">' +
      '<div class="action-card-header">' +
        '<div class="action-card-title">📝 Đề xuất cập nhật file: <span class="action-card-path">' + cleanFilePath + '</span></div>' +
      '</div>' +
      '<div class="action-card-body">' + codeContent.trim() + '</div>' +
      '<div class="action-card-footer">' +
        '<button class="action-btn dismiss-btn" onclick="dismissActionCard(this)">✕ Bỏ qua</button>' +
        '<button class="action-btn diff-btn" onclick="diffFileAction(\'' + actionId + '\')">🔍 Xem So Sánh (Diff)</button>' +
        '<button class="action-btn apply-btn" onclick="applyFileAction(\'' + actionId + '\')">✓ Áp Dụng Thay Đổi</button>' +
      '</div>' +
    '</div>';
  });

  // 4. Parse Agent Action: run_command (Đề xuất chạy lệnh terminal)
  const runCmdRegex = new RegExp('&lt;action\\s+type="run_command"&gt;([\\s\\S]*?)&lt;\\/action&gt;', 'gi');
  escaped = escaped.replace(runCmdRegex, (match, cmdContent) => {
    const cleanCmd = cmdContent.trim();
    const realCmd = unescapeHtml(cleanCmd);
    return '<div class="action-card command-action">' +
      '<div class="action-card-header">' +
        '<div class="action-card-title">💻 Lệnh Terminal Đề Xuất</div>' +
      '</div>' +
      '<div class="action-card-body">' + cleanCmd + '</div>' +
      '<div class="action-card-footer">' +
        '<button class="action-btn dismiss-btn" onclick="dismissActionCard(this)">✕ Bỏ qua</button>' +
        '<button class="action-btn run-btn" onclick="executeCommandAction(\'' + encodeURIComponent(realCmd) + '\')">▶ Chạy Trong Terminal</button>' +
      '</div>' +
    '</div>';
  });

  // 4B. Parse Agent Action: read_file (Đề xuất xem/đọc file trong dự án)
  const readFileRegex = new RegExp('&lt;action\\s+type="read_file"\\s+path="([^"]+)"&gt;([\\s\\S]*?)&lt;\\/action&gt;', 'gi');
  escaped = escaped.replace(readFileRegex, (match, filePath, desc) => {
    const cleanFilePath = unescapeHtml(filePath.trim());
    const cleanDesc = desc ? desc.trim() : '';
    return '<div class="action-card file-action">' +
      '<div class="action-card-header">' +
        '<div class="action-card-title">📖 Tệp Dự Án Cần Khảo Sát</div>' +
        '<div class="action-card-path">' + cleanFilePath + '</div>' +
      '</div>' +
      (cleanDesc ? '<div class="action-card-desc">' + cleanDesc + '</div>' : '') +
      '<div class="action-card-footer">' +
        '<button class="action-btn dismiss-btn" onclick="dismissActionCard(this)">✕ Bỏ qua</button>' +
        '<button class="action-btn open-btn" onclick="openFileAction(\'' + encodeURIComponent(cleanFilePath) + '\')">👁 Mở File</button>' +
        '<button class="action-btn apply-btn" onclick="readAndFeedAction(\'' + encodeURIComponent(cleanFilePath) + '\')">⚡ Tự Động Đọc & Phân Tích</button>' +
      '</div>' +
    '</div>';
  });

  // 5. Code blocks thông thường
  const codeBlockRegex = new RegExp('```(\\w*)?\\r?\\n([\\s\\S]*?)```', 'g');
  escaped = escaped.replace(codeBlockRegex, (match, lang, code) => {
    return '<div class="code-container"><div class="code-header"><span>' + (lang || 'code') + '</span><button class="copy-btn" onclick="copyCode(this)">Sao chép</button></div><pre><code>' + code + '</code></pre></div>';
  });

  // 6. Inline code
  const inlineCodeRegex = new RegExp('`([^`]+)`', 'g');
  escaped = escaped.replace(inlineCodeRegex, '<code>$1</code>');

  // 7. Bold & Italic
  const boldRegex = new RegExp('\\*\\*([^\\*]+)\\*\\*', 'g');
  escaped = escaped.replace(boldRegex, '<strong>$1</strong>');

  const italicRegex = new RegExp('\\*([^\\*]+)\\*', 'g');
  escaped = escaped.replace(italicRegex, '<em>$1</em>');

  // 8. Line breaks
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

window.applyFileAction = function(actionId) {
  const act = window.__actionStore && window.__actionStore[actionId];
  if (act) {
    vscode.postMessage({
      type: 'APPLY_FILE_ACTION',
      actionId,
      path: act.path,
      content: act.content
    });
    const card = document.getElementById(actionId);
    if (card) {
      const btn = card.querySelector('.apply-btn');
      if (btn) {
        btn.className = 'action-btn applied';
        btn.textContent = '✓ Đang áp dụng...';
        btn.disabled = true;
      }
    }
  }
};

window.diffFileAction = function(actionId) {
  const act = window.__actionStore && window.__actionStore[actionId];
  if (act) {
    vscode.postMessage({
      type: 'DIFF_FILE_ACTION',
      actionId,
      path: act.path,
      content: act.content
    });
  }
};

window.executeCommandAction = function(encodedCmd) {
  const cmd = decodeURIComponent(encodedCmd);
  vscode.postMessage({
    type: 'EXECUTE_TERMINAL_COMMAND',
    command: cmd
  });
};

window.openFileAction = function(encodedPath) {
  const filePath = decodeURIComponent(encodedPath);
  vscode.postMessage({
    type: 'OPEN_FILE',
    path: filePath
  });
};

window.readAndFeedAction = function(encodedPath) {
  const filePath = decodeURIComponent(encodedPath);
  vscode.postMessage({
    type: 'READ_AND_FEED_FILE',
    path: filePath
  });
};

window.dismissActionCard = function(button) {
  const card = button.closest('.action-card');
  if (card) {
    card.style.opacity = '0';
    card.style.transform = 'scale(0.96)';
    card.style.transition = 'all 0.15s ease';
    setTimeout(() => {
      card.remove();
    }, 150);
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
    const metaPrefix = m.role === 'user' ? '' : ' - NesCode AI Agent';
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

if (btnCloseSidebar) {
  btnCloseSidebar.addEventListener('click', () => {
    vscode.postMessage({ type: 'CLOSE_VIEW' });
  });
}

if (btnRemoveContext) {
  btnRemoveContext.addEventListener('click', () => {
    chkAttachContext.checked = false;
    btnRemoveContext.style.display = 'none';
    contextInfo.textContent = '📎 Đã bỏ chọn tệp đính kèm';
    updateState({ attachContext: false });
  });
}

// Token Popover toggle
if (tokenUsageBadge) {
  tokenUsageBadge.addEventListener('click', (e) => {
    e.stopPropagation();
    if (tokenPopover) {
      tokenPopover.classList.toggle('open');
    }
  });
}

// Bấm ra ngoài drawer và popover để tự động đóng lại
document.addEventListener('click', (e) => {
  if (tokenPopover && tokenPopover.classList.contains('open')) {
    if (!tokenPopover.contains(e.target) && !tokenUsageBadge.contains(e.target)) {
      tokenPopover.classList.remove('open');
    }
  }

  if (slashPopup && slashPopup.style.display !== 'none') {
    if (!slashPopup.contains(e.target) && e.target !== promptInput) {
      slashPopup.style.display = 'none';
    }
  }

  if (historyDrawer && historyDrawer.classList.contains('open')) {
    if (
      !historyDrawer.contains(e.target) &&
      !btnHistory.contains(e.target) &&
      !btnToggleHistory.contains(e.target)
    ) {
      toggleHistoryDrawer(false);
    }
  }
});

// Xử lý Autocomplete Slash Commands (/plan, /work, /fix, /test, /clear, /help)
promptInput.addEventListener('input', () => {
  updateState({ draftPrompt: promptInput.value });
  checkSlashCommands();
});

function checkSlashCommands() {
  if (!slashPopup) return;
  const val = promptInput.value;
  if (val.startsWith('/')) {
    const query = val.toLowerCase().trim();
    const items = slashPopup.querySelectorAll('.slash-item');
    let hasVisible = false;

    items.forEach((item, index) => {
      const cmd = item.getAttribute('data-cmd') || '';
      if (cmd.startsWith(query) || query === '/') {
        item.style.display = 'flex';
        hasVisible = true;
      } else {
        item.style.display = 'none';
      }
    });

    if (hasVisible) {
      slashPopup.style.display = 'flex';
      // Đảm bảo có ít nhất 1 item được highlight
      const visibleItems = Array.from(items).filter((it) => it.style.display !== 'none');
      items.forEach((it) => it.classList.remove('active'));
      if (visibleItems.length > 0) {
        visibleItems[0].classList.add('active');
      }
    } else {
      slashPopup.style.display = 'none';
    }
  } else {
    slashPopup.style.display = 'none';
  }
}

function selectSlashCommand(cmd) {
  promptInput.value = cmd + ' ';
  promptInput.focus();
  if (slashPopup) slashPopup.style.display = 'none';
  updateState({ draftPrompt: promptInput.value });
}

if (slashPopup) {
  slashPopup.querySelectorAll('.slash-item').forEach((item) => {
    item.addEventListener('click', () => {
      const cmd = item.getAttribute('data-cmd');
      if (cmd) selectSlashCommand(cmd);
    });
  });
}

promptInput.addEventListener('keydown', (e) => {
  if (slashPopup && slashPopup.style.display !== 'none') {
    const visibleItems = Array.from(slashPopup.querySelectorAll('.slash-item')).filter(
      (it) => it.style.display !== 'none'
    );
    const activeIndex = visibleItems.findIndex((it) => it.classList.contains('active'));

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (activeIndex + 1) % visibleItems.length;
      visibleItems.forEach((it) => it.classList.remove('active'));
      visibleItems[nextIndex]?.classList.add('active');
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (activeIndex - 1 + visibleItems.length) % visibleItems.length;
      visibleItems.forEach((it) => it.classList.remove('active'));
      visibleItems[prevIndex]?.classList.add('active');
      return;
    }
    if (e.key === 'Tab' || (e.key === 'Enter' && activeIndex >= 0 && promptInput.value.trim() === promptInput.value)) {
      const activeItem = visibleItems[activeIndex];
      const cmd = activeItem?.getAttribute('data-cmd');
      if (cmd && !promptInput.value.includes(' ')) {
        e.preventDefault();
        selectSlashCommand(cmd);
        return;
      }
    }
    if (e.key === 'Escape') {
      slashPopup.style.display = 'none';
      return;
    }
  }

  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (slashPopup) slashPopup.style.display = 'none';
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
      div.innerHTML = '<div class="message-meta">' + msg.message.timestamp + ' - NesCode AI Agent</div>' +
        '<div class="thinking-banner" id="banner-' + msg.message.id + '">' +
          '<div class="thinking-spinner"></div>' +
          '<div class="thinking-info">' +
            '<span class="thinking-title">NesCode Agent đang suy nghĩ...</span>' +
            '<span class="thinking-subtitle">Đang phân tích cấu trúc dự án và lập kế hoạch xử lý</span>' +
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
      if (agentLoopBanner) agentLoopBanner.style.display = 'none';
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

    case 'AGENT_LOOP_STATUS': {
      if (agentLoopBanner && agentLoopText) {
        agentLoopBanner.style.display = 'flex';
        agentLoopText.textContent = msg.message || 'Agent đang phân tích logic...';
        transcript.scrollTop = transcript.scrollHeight;
      }
      break;
    }

    case 'UPDATE_TOKEN_USAGE': {
      const tb = msg.tokenBreakdown;
      if (!tb) break;

      if (tokenUsageText) {
        tokenUsageText.textContent = `${tb.totalTokens.toLocaleString()} / 32k (${tb.usagePercentage}%)`;
      }
      if (segCtx) segCtx.style.width = tb.details.contextPercent + '%';
      if (segInp) segInp.style.width = tb.details.inputPercent + '%';
      if (segThk) segThk.style.width = tb.details.thinkingPercent + '%';
      if (segOut) segOut.style.width = tb.details.outputPercent + '%';

      if (tokCtx) tokCtx.textContent = `${tb.contextTokens.toLocaleString()} (${tb.details.contextPercent}%)`;
      if (tokInp) tokInp.textContent = `${tb.inputTokens.toLocaleString()} (${tb.details.inputPercent}%)`;
      if (tokThk) tokThk.textContent = `${tb.thinkingTokens.toLocaleString()} (${tb.details.thinkingPercent}%)`;
      if (tokOut) tokOut.textContent = `${tb.outputTokens.toLocaleString()} (${tb.details.outputPercent}%)`;
      if (tokTotal) tokTotal.textContent = `${tb.totalTokens.toLocaleString()} / ${tb.maxContextTokens.toLocaleString()} (${tb.usagePercentage}%)`;
      break;
    }

    case 'ACTION_APPLIED': {
      const card = document.getElementById(msg.actionId);
      if (card) {
        const btn = card.querySelector('.apply-btn, .applied');
        if (btn) {
          btn.className = 'action-btn applied';
          btn.textContent = '✓ Đã áp dụng thành công';
        }
      }
      break;
    }

    case 'UPDATE_CONTEXT': {
      if (!msg.hasContext) {
        contextInfo.textContent = '📎 Không có file đang mở (sẽ gửi Workspace Tree)';
        if (btnRemoveContext) btnRemoveContext.style.display = 'none';
      } else {
        if (msg.hasSelection) {
          contextInfo.textContent = '📎 ' + msg.fileName + ' (' + msg.selectedLines + ' dòng chọn)';
        } else {
          contextInfo.textContent = '📎 ' + msg.fileName + ' (' + msg.language + ')';
        }
        if (btnRemoveContext && chkAttachContext.checked) {
          btnRemoveContext.style.display = 'inline-flex';
        }
      }
      break;
    }
  }
});

// Thông báo Webview đã sẵn sàng nhận dữ liệu ban đầu
vscode.postMessage({ type: 'WEBVIEW_READY' });
