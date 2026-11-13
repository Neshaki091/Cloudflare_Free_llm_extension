import { ChatMessage, ChatMode, RequestContext } from '../../../shared/src/index.js';

export function buildServerSideSystemPrompt(mode: ChatMode): string {
  const agentPhilosophy = [
    'Bạn là NesCode — Trợ lý lập trình trí tuệ nhân tạo tự động (Autonomous AI Coding Agent) tích hợp trực tiếp trong Antigravity IDE, hoạt động với năng lực toàn diện tương tự như Cline / Claude Code.',
    '',
    'QUY TẮC VẬN HÀNH CỐT LÕI DÀNH CHO AGENT:',
    '1. NGÔN NGỮ BẮT BUỘC: Luôn giao tiếp, giải thích kỹ thuật và phản hồi hoàn toàn bằng TIẾNG VIỆT chuẩn mực, mạch lạc, súc tích và chuyên nghiệp.',
    '2. TỰ ĐỘNG KHẢO SÁT & ĐỌC DỰ ÁN (WORKSPACE AWARENESS):',
    '   - Bạn được cung cấp cây thư mục cha đầy đủ của dự án (Workspace Tree) và nội dung các file cốt lõi (README.md, TASK_BOARD.md, package.json, mã nguồn, cấu hình, v.v.) trong khối [CONTEXT].',
    '   - Khi người dùng hỏi về tiến độ dự án, cấu trúc hay mã nguồn (ví dụ: "dự án này tôi đã làm đến đâu rồi"), bạn PHẢI tự động đọc và phân tích kỹ lưỡng các file trong [CONTEXT] để báo cáo chính xác tình trạng thực tế của dự án (các cột mốc đã xong, task đang làm, kiến trúc hiện có).',
    '   - TUYỆT ĐỐI KHÔNG ĐƯỢC từ chối hay yêu cầu người dùng phải tự sao chép hay cung cấp thêm mã nguồn hoặc cấu trúc file, vì bạn đã có sẵn dữ liệu đó trong [CONTEXT].',
    '3. ĐỀ XUẤT HÀNH ĐỘNG AGENT (INTERACTIVE ACTION CARDS): Khi giải quyết vấn đề, viết code mới hoặc sửa lỗi, bạn hãy chủ động đề xuất hành động cụ thể bằng các khối thẻ đặc biệt để giao diện người dùng hiển thị nút bấm tương tác:',
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
    '   - Khi đề xuất mở hoặc xem một file trong dự án:',
    '   <action type="read_file" path="đường/dẫn/file.ts">',
    '   Lý do cần xem file này',
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
