# Mục Tiêu Phiên Bản MVP (MVP Goals — v0.1.x)

- **Ngày cập nhật:** 2026-11-11
- **Nguồn thông tin:** `journal/requirements/SRS.md` mục 1.4

Mục tiêu duy nhất của phiên bản MVP là cung cấp một tiện ích mở rộng hoạt động ổn định, an toàn và hoàn chỉnh trên Antigravity IDE, kết nối với Cloudflare Worker cá nhân trên gói Free.

---

## 1. Các Mục Tiêu Khả Thi Của MVP (P0 Scope)

1. **Khả năng tương thích trên Antigravity IDE (Host Compatibility):**
   - Đăng ký và kích hoạt extension thành công từ gói VSIX đóng gói cục bộ.
   - Hoạt động trơn tru với các API cốt lõi: Command Palette, WebviewView panel, SecretStorage, và Workspace Editor API.

2. **Giao Diện Trợ Lý Trực Quan (Chat Webview UI):**
   - Tích hợp một Chat Panel chuyên dụng ở thanh Activity Bar / Side Panel.
   - Nhập prompt, hiển thị phản hồi Markdown định dạng đẹp với code blocks và nút sao chép (Copy).
   - Hiển thị đầy đủ các trạng thái của vòng đời request: Nghỉ (Idle), Đang kết nối (Connecting), Đang nhận dữ liệu (Streaming), Hoàn thành (Completed), và Lỗi (Error).
   - Nút Dừng (Stop / Cancel) cho phép người dùng ngắt request bất kỳ lúc nào.

3. **Backend Cloudflare Worker Tự Triển Khai (BYO Worker Gateway):**
   - Cung cấp mã nguồn Worker TypeScript tối giản, triển khai một chạm bằng Wrangler CLI.
   - Tích hợp binding `env.AI` với mô hình mặc định `@cf/zai-org/glm-4.7-flash`.
   - Cung cấp các endpoint chuẩn hóa: `GET /v1/health`, `GET /v1/models`, `POST /v1/chat`.
   - Xác thực an toàn bằng Bearer API key và thiết lập System Prompt bảo vệ ở máy chủ.

4. **Tính Năng Hỗ Trợ Lập Trình Cơ Bản (Core Coding Actions):**
   - **Giải thích mã nguồn (Explain Selection & Explain Active File):** Phân tích luồng thực thi, các thành phần chính và cảnh báo lỗi tiềm ẩn.
   - **Sửa mã nguồn trực quan (Fix Code with Diff Preview):** Nhận đề xuất sửa code dưới dạng diff, hỗ trợ hai nút thao tác độc lập: Áp dụng (Apply) và Từ chối (Reject), đi kèm cơ chế kiểm tra file không bị thay đổi ngầm (Stale Document Protection).
   - **Tạo kiểm thử (Generate Tests):** Sinh mã unit test đề xuất để người dùng xem trước, không tự ý chạy lệnh shell.

5. **Kỹ Thuật Xây Dựng Ngữ Cảnh An Toàn (Context Engineering):**
   - Chỉ thu thập ngữ cảnh từ selection, active file, hoặc danh sách file do người dùng chủ động chọn qua Context Picker.
   - Bộ lọc tự động loại trừ các file bí mật (`.env`, private keys, secrets) và thư mục build (`node_modules/`, `dist/`, `.git/`).
   - Giới hạn ngân sách context (Context Budgeter) mặc định tối đa 12.000 token ước lượng để không làm tràn quota của Cloudflare Free.

6. **Đóng Gói và Hướng Dẫn Vận Hành (Packaging & Documentation):**
   - Đóng gói file cài đặt VSIX hoàn chỉnh (`npm run package:extension`).
   - Tài liệu hướng dẫn người dùng tự deploy Worker và cấu hình API key trên extension từ A-Z mà không gặp trở ngại.
