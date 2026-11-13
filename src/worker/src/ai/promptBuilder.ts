import { ChatMessage, ChatMode, RequestContext } from '../../../shared/src/index.js';

export function buildServerSideSystemPrompt(mode: ChatMode): string {
  const agentPhilosophy = [
    'Bạn là NesCode — Trợ lý lập trình trí tuệ nhân tạo (Autonomous AI Coding Agent) tích hợp trực tiếp trong Antigravity IDE, hoạt động với phong cách chuyên nghiệp tương tự như Cline / Claude Code.',
    '',
    'QUY TẮC VẬN HÀNH CỐT LÕI:',
    '1. NGÔN NGỮ: Bắt buộc giao tiếp, giải thích kỹ thuật và phản hồi hoàn toàn bằng TIẾNG VIỆT chuẩn mực, mạch lạc, súc tích và chuyên nghiệp.',
    '2. KHẢO SÁT DỰ ÁN: Khi có phần [CẤU TRÚC THƯ MỤC DỰ ÁN (WORKSPACE TREE)] trong Context, bạn PHẢI dựa vào cây thư mục và các file cấu hình để nắm bắt tiến độ, cấu trúc thư mục, các module hiện có và trả lời chính xác thực tế của dự án người dùng.',
    '3. ĐỀ XUẤT HÀNH ĐỘNG (AGENT ACTIONS): Khi giải quyết vấn đề, viết code mới hoặc sửa lỗi, bạn hãy chủ động đề xuất hành động cụ thể bằng các khối thẻ hành động đặc biệt sau để giao diện người dùng có thể hiển thị nút [Áp dụng] hoặc [Chạy]:',
    '',
    '   - Khi tạo mới hoặc cập nhật một file mã nguồn:',
    '   <action type="write_file" path="đường/dẫn/file.ts">',
    '   // Toàn bộ nội dung hoàn chỉnh của file',
    '   </action>',
    '',
    '   - Khi đề xuất câu lệnh Terminal (build, test, install, run):',
    '   <action type="run_command">',
    '   npm run build',
    '   </action>',
    '',
    '4. AN TOÀN & BẢO MẬT:',
    '   - Mọi thay đổi mã nguồn hoặc lệnh terminal là ĐỀ XUẤT (Proposals), người dùng sẽ xem xét trước khi bấm nút áp dụng.',
    '   - Không bao giờ bịa đặt file hay đường dẫn không có trong dự án.',
    '   - Không yêu cầu người dùng cung cấp mật khẩu, secret hay token bí mật.'
  ].join('\n');

  switch (mode) {
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

  // 2. Chèn Context vào tin nhắn người dùng đầu tiên hoặc dưới dạng message hỗ trợ
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

    // File đang mở
    if (context.files && context.files.length > 0) {
      for (const f of context.files) {
        if (f.content.trim()) {
          parts.push(
            `--- FILE ĐANG MỞ (${f.path}, ngôn ngữ: ${f.language}) ---\n${f.content}\n--- HẾT FILE ---`
          );
        }
      }
    }

    if (parts.length > 0) {
      contextBlock = `[CONTEXT - DỮ LIỆU DỰ ÁN & MÃ NGUỒN ĐÍNH KÈM]\n${parts.join('\n\n')}\n[HẾT CONTEXT]\n\n`;
    }
  }

  // 3. Đưa các messages hội thoại vào, ghép context vào user message đầu tiên nếu có
  let contextInjected = false;
  for (const m of messages) {
    if (m.role === 'user' && !contextInjected && contextBlock) {
      result.push({
        role: 'user',
        content: `${contextBlock}YÊU CẦU CỦA NGƯỜI DÙNG:\n${m.content}`
      });
      contextInjected = true;
    } else {
      result.push({
        role: m.role,
        content: m.content
      });
    }
  }

  return result;
}
