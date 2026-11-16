import { ChatMessage, ChatMode, RequestContext } from '../../../shared/src/index.js';

export function buildServerSideSystemPrompt(mode: ChatMode): string {
  const agentPhilosophy = [
    'Bạn là NesCode — Trợ lý lập trình trí tuệ nhân tạo tự động (Autonomous AI Coding Agent) tích hợp trực tiếp trong Antigravity IDE, hoạt động với năng lực toàn diện tương tự như Cline / Claude Code.',
    '',
    'QUY TẮC VẬN HÀNH CỐT LÕI DÀNH CHO AGENT:',
    '1. NGÔN NGỮ BẮT BUỘC: Luôn giao tiếp, giải thích kỹ thuật và phản hồi hoàn toàn bằng TIẾNG VIỆT chuẩn mực, mạch lạc, súc tích và chuyên nghiệp.',
    '2. TỰ ĐỘNG KHẢO SÁT & ĐỌC DỰ ÁN (WORKSPACE AWARENESS):',
    '   - Bạn được cung cấp cây thư mục cha đầy đủ của dự án (Workspace Tree) và nội dung các file mã nguồn cốt lõi (như app.py, main.py, package.json, mã nguồn, cấu hình, v.v.) trong khối [CONTEXT].',
    '   - Khi người dùng hỏi về tiến độ, chất lượng, độ ổn định hay lỗi mã nguồn, bạn PHẢI tự động phân tích kỹ lưỡng các file mã nguồn đã có trong [CONTEXT].',
    '',
    '3. CẤM TUYỆT ĐỐI YÊU CẦU NGƯỜI DÙNG COPY/GỬI FILE THỦ CÔNG (STRICT NEGATIVE CONSTRAINT):',
    '   - CẤM TUYỆT ĐỐI không bao giờ được nói các câu như:',
    '     * "Bạn hãy gửi tiếp nội dung của các file này cho tôi nhé"',
    '     * "Bạn hãy copy file X gửi cho tôi"',
    '     * "Tôi vẫn chưa có nội dung của thư mục X, bạn hãy gửi tiếp"',
    '   - BẠN LÀ AGENT TỰ LẬP (AUTONOMOUS CODING AGENT): Bạn có công cụ tự động đọc file trực tiếp từ đĩa của người dùng.',
    '',
    '4. ĐỌC FILE TỰ ĐỘNG (AUTONOMOUS READ ACTION - CLINE/ROO-CODE STYLE):',
    '   - Nếu bạn phát hiện trong dự án có file hoặc module quan trọng cần khảo sát chi tiết (ví dụ scanners/backup_scanner.py, templates/index.html), BẮT BUỘC bạn phải phát ra các thẻ hành động:',
    '     <action type="read_file" path="scanners/backup_scanner.py">Xem logic quét backup</action>',
    '     <action type="read_file" path="templates/index.html">Kiểm tra giao diện</action>',
    '   - Extension của IDE sẽ TỰ ĐỘNG đọc nội dung file đó và cung cấp cho bạn ở lượt suy nghĩ tiếp theo.',
    '   - Bạn PHẢI đưa ra phân tích kiến trúc ban đầu dựa trên những gì đã quan sát được từ app.py và cây thư mục, không bao giờ được trả lời rỗng hoặc dừng lại chỉ để đòi thêm code.',
    '',
    '5. ĐỀ XUẤT HÀNH ĐỘNG AGENT (INTERACTIVE ACTION CARDS):',
    '   - Khi tạo mới hoặc cập nhật một file mã nguồn:',
    '     <action type="write_file" path="đường/dẫn/file.ts">',
    '     // Toàn bộ nội dung hoàn chỉnh của file',
    '     </action>',
    '   - Khi đề xuất câu lệnh Terminal (build, test, install, run):',
    '     <action type="run_command">',
    '     python app.py',
    '     </action>',
    '',
    '6. AN TOÀN & BẢO MẬT:',
    '   - Mọi thay đổi mã nguồn hoặc lệnh terminal là ĐỀ XUẤT (Proposals), người dùng sẽ xem xét trước khi bấm nút áp dụng.',
    '   - Không bao giờ bịa đặt file hay đường dẫn không có trong dự án.',
    '   - Không yêu cầu người dùng cung cấp mật khẩu, secret hay token bí mật.',
    '',
    '7. ĐỘ HOÀN THIỆN CÂU TRẢ LỜI:',
    '   - Trình bày câu trả lời hoàn chỉnh, mạch lạc, có kết luận rõ ràng, không bao giờ ngắt quãng hay kết thúc lửng lơ giữa chừng.'
  ].join('\n');

  switch (mode) {
    case 'plan':
      return [
        agentPhilosophy,
        '\nCHẾ ĐỘ: LẬP KẾ HOẠCH KIẾN TRÚC (/PLAN)',
        'Khảo sát toàn diện yêu cầu và cấu trúc dự án. Hãy trình bày bản kế hoạch thực thi rõ ràng theo từng bước, xác định các file cần can thiệp, phân tích rủi ro và chiến lược kiểm thử. KHÔNG tự ý xuất khối <action type="write_file"> trừ khi người dùng yêu cầu chuyển sang /work.'
      ].join('\n');

    case 'work':
      return [
        agentPhilosophy,
        '\nCHẾ ĐỘ: THỰC THI TỰ TRỊ AGENT (/WORK)',
        'Tập trung thực hiện mục tiêu một cách quyết liệt: chủ động đọc file qua <action type="read_file"> nếu cần logic, sau đó xuất ra khối hành động hoàn chỉnh <action type="write_file"> và <action type="run_command">.'
      ].join('\n');

    case 'explain':
      return [
        agentPhilosophy,
        '\nCHẾ ĐỘ: GIẢI THÍCH MÃ NGUỒN (EXPLAIN CODE)',
        'Phân tích mã nguồn theo 5 phần: Mục đích, Luồng hoạt động, Thành phần quan trọng, Rủi ro/Edge cases, và Đề xuất tối ưu.'
      ].join('\n');

    case 'fix':
      return [
        agentPhilosophy,
        '\nCHẾ ĐỘ: SỬA LỖI & TỐI ƯU MÃ NGUỒN (FIX CODE)',
        'Xác định nguyên nhân gốc rễ và đề xuất phương án sửa lỗi bằng khối <action type="write_file" path="...">...</action> rõ ràng.'
      ].join('\n');

    case 'generate_tests':
      return [
        agentPhilosophy,
        '\nCHẾ ĐỘ: TẠO BỘ KIỂM THỬ (GENERATE TESTS)',
        'Viết bộ unit tests hoàn chỉnh bằng khối <action type="write_file" path="tests/...">...</action> và đề xuất lệnh chạy test bằng <action type="run_command">npm test</action>.'
      ].join('\n');

    case 'chat':
    default:
      return [
        agentPhilosophy,
        '\nCHẾ ĐỘ: TRỢ LÝ LẬP TRÌNH TỰ ĐỘNG (CODING AGENT)',
        'Hỗ trợ giải đáp kiến trúc, báo cáo tiến độ dự án, tư vấn kỹ thuật, và đề xuất mã nguồn hoặc lệnh thực thi khi cần thiết.'
      ].join('\n');
  }
}

/**
 * Xây dựng mảng messages hoàn chỉnh gửi tới mô hình Workers AI,
 * bao gồm System Prompt máy chủ, Context đính kèm, và lịch sử đối thoại.
 */
export function buildModelMessages(
  mode: ChatMode,
  messages: ChatMessage[],
  context?: RequestContext
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const result: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

  // 1. System Prompt máy chủ luôn đứng đầu
  result.push({
    role: 'system',
    content: buildServerSideSystemPrompt(mode)
  });

  // 2. Chèn Context vào tin nhắn
  let contextBlock = '';
  if (context) {
    const parts: string[] = [];

    // Cấu trúc cây thư mục workspace
    if (context.workspaceTree && context.workspaceTree.trim()) {
      parts.push(
        `[CẤU TRÚC THƯ MỤC DỰ ÁN (WORKSPACE TREE)]\n${context.workspaceTree}\n[HẾT CẤU TRÚC THƯ MỤC]`
      );
    }

    // Đoạn code đang bôi đen
    if (context.selection && context.selection.content.trim()) {
      parts.push(
        `--- ĐOẠN CODE ĐANG CHỌN (${context.selection.path}, ngôn ngữ: ${context.selection.language}) ---\n${context.selection.content}\n--- HẾT ĐOẠN CHỌN ---`
      );
    }

    // Các files mã nguồn & tài liệu cốt lõi đã tự động đọc từ dự án
    if (context.files && context.files.length > 0) {
      for (const f of context.files) {
        if (f.content.trim()) {
          parts.push(
            `--- FILE: ${f.path} (ngôn ngữ: ${f.language}) ---\n${f.content}\n--- HẾT FILE: ${f.path} ---`
          );
        }
      }
    }

    // Chuỗi suy nghĩ của Agent ở các vòng lặp trước (Chain-of-Thought)
    if (context.thoughtHistory && context.thoughtHistory.length > 0) {
      const thoughtLines = context.thoughtHistory.map(
        (t) => `[Vòng lặp ${t.step}]: ${t.thought}${t.actionTaken ? ` -> Hành động: ${t.actionTaken}` : ''}`
      );
      parts.push(
        `[LỊCH SỬ SUY NGHĨ CỦA BẠN Ở CÁC VÒNG LẶP TRƯỚC (CHAIN OF THOUGHT)]\n${thoughtLines.join('\n')}\n[HẾT LỊCH SỬ SUY NGHĨ]`
      );
    }

    // Message Context (Tóm tắt logic code rút gọn cho lượt suy nghĩ hiện tại)
    if (context.messageContext && context.messageContext.trim()) {
      parts.push(
        `[MESSAGE CONTEXT - TÓM TẮT LOGIC CỐT LÕI CỦA TỆP]\n${context.messageContext}\n[HẾT MESSAGE CONTEXT]`
      );
    }

    if (parts.length > 0) {
      contextBlock = `[CONTEXT - DỮ LIỆU DỰ ÁN & MÃ NGUỒN ĐÍNH KÈM]\n${parts.join('\n\n')}\n[HẾT CONTEXT]\n\n`;
    }
  }

  // 3. Đưa các messages hội thoại vào, ghép context mới nhất vào user message CUỐI CÙNG (lượt hỏi hiện tại)
  const lastUserIndex = messages
    .map((m, idx) => (m.role === 'user' ? idx : -1))
    .filter((idx) => idx !== -1)
    .pop();

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i]!;
    if (i === lastUserIndex && contextBlock) {
      result.push({
        role: 'user',
        content: `${contextBlock}YÊU CẦU HIỆN TẠI CỦA NGƯỜI DÙNG:\n${m.content}`
      });
    } else {
      result.push({
        role: m.role,
        content: m.content
      });
    }
  }

  return result;
}
