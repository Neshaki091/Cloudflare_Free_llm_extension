# Kế Hoạch và Hồ Sơ Kiểm Chứng Tương Thích Nền Tảng (Milestone M0 — Compatibility Spike)

- **Ngày lập:** 2026-11-11
- **Trạng thái:** IN_PROGRESS / PENDING_HOST_EXECUTION
- **Cột mốc:** `M0 — Compatibility Spike`
- **Tài liệu nguồn:** `journal/requirements/SRS.md` mục 13.3, 14 (Milestone 0) và Phụ lục A (Appendix A)

---

## 1. Mục Đích và Tầm Quan Trọng Của M0

Antigravity IDE là môi trường phát triển đích của tiện ích mở rộng **NesCode for Antigravity**. Mặc dù Antigravity IDE hỗ trợ kiến trúc tiện ích mở rộng tương thích chuẩn mở của VS Code, nhưng các khác biệt nội tại giữa Extension Host của Antigravity và VS Code tiêu chuẩn có thể ảnh hưởng trực tiếp đến kiến trúc của extension.

**Nguyên tắc chỉ đạo:** Không bắt đầu viết bất kỳ dòng mã tính năng sản phẩm nào (AI chat, Worker API, diff preview) trước khi hoàn thành bài kiểm thử tương thích (Compatibility Spike) và có kết luận **Go / No-Go** rõ ràng.

---

## 2. Các Câu Hỏi Trọng Yếu Cần Xác Minh (Key Questions)

1. **Khả năng cài đặt Extension bên thứ ba:** Antigravity IDE có cho phép cài đặt trực tiếp file gói `.vsix` từ máy cục bộ không?
2. **Kích hoạt Extension Host:** Extension có được phát hiện và kích hoạt thành công qua sự kiện `onStartupFinished` hoặc khi gọi command không?
3. **Đăng ký và gọi Command:** Lệnh do extension đăng ký có hiển thị trong Command Palette và phản hồi khi người dùng bấm không?
4. **Khả năng hỗ trợ Webview / WebviewView:** Antigravity có hỗ trợ `vscode.window.registerWebviewViewProvider` (để nhúng panel chat vào thanh bên) không? Giao diện Webview có render đúng HTML/CSS và cho phép gửi nhận thông điệp hai chiều (`postMessage`) không?
5. **Khả năng hỗ trợ SecretStorage:** API `context.secrets` có hoạt động để lưu trữ API key an toàn không? Dữ liệu có được bảo toàn sau khi đóng và mở lại IDE không?
6. **Khả năng truy xuất Workspace:** Các API đọc file đang mở (`vscode.window.activeTextEditor`), đọc vùng chọn (`editor.selection`), và mở tài liệu (`vscode.workspace.openTextDocument`) có hoạt động chính xác không?
7. **Các API bị hạn chế hoặc không hỗ trợ:** Có API công khai nào của VS Code bị Antigravity IDE chặn hoặc trả về lỗi không?

---

## 3. Thiết Kế Kịch Bản Kiểm Thử (Test Cases)

| Mã Test | Mục Tiêu | Kịch Bản Kiểm Tra | Kết Quả Kỳ Vọng | Trạng Thái Thực Tế |
|---|---|---|---|---|
| **TC-SPIKE-01** | Đóng gói và cài đặt VSIX | Dùng `@vscode/vsce package` đóng gói extension thử nghiệm tối thiểu, cài vào Antigravity IDE. | File `.vsix` cài đặt thành công, extension xuất hiện trong Extensions view. | PENDING |
| **TC-SPIKE-02** | Extension Activation | Mở một thư mục workspace trong Antigravity IDE. | Hàm `activate(context)` chạy, xuất log thông báo khởi động thành công. | PENDING |
| **TC-SPIKE-03** | Command Registration | Nhấn `Ctrl+Shift+P`, tìm lệnh `NesCode: Spike Ping`. | Lệnh hiển thị, khi bấm hiện thông báo `vscode.window.showInformationMessage("NesCode Spike: OK")`. | PENDING |
| **TC-SPIKE-04** | WebviewView Side Panel | Mở biểu tượng NesCode trên thanh Activity Bar. | Webview panel mở ra, hiển thị tiêu đề và nội dung HTML5, có ô input và nút bấm phản hồi. | PENDING |
| **TC-SPIKE-05** | SecretStorage Persistence | Gọi lệnh `NesCode: Spike Secret Test` lưu chuỗi `"test-secret-value-123"`, sau đó khởi động lại IDE và đọc lại. | Đọc lại đúng giá trị ban đầu, không bị rò rỉ vào file `settings.json`. | PENDING |
| **TC-SPIKE-06** | Workspace Editor Inspection | Mở một file bất kỳ, bôi đen 1 dòng chữ, gọi `NesCode: Spike Context Test`. | Trả về đúng tên file, đường dẫn tương đối và nội dung dòng chữ đang chọn. | PENDING |
| **TC-SPIKE-07** | CSP & Script Isolation | Thử chạy script inline không có nonce trong Webview. | Bị chặn bởi Content Security Policy; script có nonce hợp lệ chạy bình thường. | PENDING |

---

## 4. Môi Trường Thử Nghiệm

- **Hệ điều hành:** Windows 11 / Windows 10
- **Phiên bản Antigravity IDE:** *(Sẽ ghi nhận chính xác phiên bản build cụ thể khi người dùng thực hiện cài đặt spike)*
- **Extension Host Runtime:** Node.js tích hợp trong Antigravity
- **Engines Compatibility:** `^1.85.0` (hoặc phiên bản tương thích được khuyến nghị bởi Antigravity)

---

## 5. Danh Sách API Đã Xác Minh & Chưa Xác Minh (API Support Matrix)

*Phần này sẽ được cập nhật ngay sau khi thực thi TASK-001:*

- **Danh sách API được hỗ trợ (Supported APIs):**
  - *(Chờ ghi nhận sau bài test spike thực tế)*
- **Danh sách API không được hỗ trợ hoặc bị giới hạn (Unsupported / Restricted APIs):**
  - *(Chờ ghi nhận sau bài test spike thực tế)*
- **Giải pháp thay thế đã kiểm chứng (Workarounds):**
  - *(Ghi nhận nếu có sự cố với Webview hoặc SecretStorage)*

---

## 6. Tiêu Chí Quyết Định Go / No-Go

- **GO:** Nếu Antigravity IDE hỗ trợ đầy đủ các tính năng: Cài đặt VSIX, `commands`, `WebviewView` (hoặc `WebviewPanel`), `SecretStorage` và `Workspace API`. Dự án được phép chuyển sang Milestone M1.
- **NO-GO / BLOCKED:** Nếu Antigravity IDE hoàn toàn không cho phép cài extension bên thứ ba, hoặc chặn các API giao diện cơ bản mà không có giải pháp thay thế công khai. Báo cáo ngay cho người dùng để điều chỉnh mục tiêu nền tảng.
