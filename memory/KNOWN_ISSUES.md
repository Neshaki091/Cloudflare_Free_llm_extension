# Các Vấn Đề và Hạn Chế Đã Biết (Known Issues & Limitations)

- **Ngày cập nhật gần nhất:** 2026-11-11
- **Trạng thái:** Verified / Unresolved (Theo dõi các rủi ro kỹ thuật)
- **Nguồn thông tin:** `journal/requirements/SRS.md` mục 15 và phân tích kiến trúc ban đầu

---

## 1. Các Vấn Đề Kỹ Thuật Đang Chờ Kiểm Chứng (Pending Verification)

### KI-01: Mức Độ Hỗ Trợ Đầy Đủ Của Antigravity Extension Host
- **Phân loại:** Rủi ro nền tảng (Platform Feasibility).
- **Mô tả:** Antigravity IDE là một môi trường phát triển hiện đại dựa trên chuẩn mở, nhưng chưa có tài liệu xác nhận công khai rằng 100% các API của VS Code Extension (đặc biệt là WebviewView phức tạp, SecretStorage persistence, và custom command contributions) đều hoạt động y hệt VS Code tiêu chuẩn.
- **Tác động:** Nếu một API bị thiếu hoặc bị hạn chế, kiến trúc UI hoặc lưu trữ bí mật của extension có thể phải điều chỉnh.
- **Biện pháp xử lý:** Tiến hành Milestone M0 (Compatibility Spike) với gói VSIX tối thiểu trước khi code tính năng chính.

### KI-02: Biến Động Hạn Ngạch và Khả Dụng Của Cloudflare Workers AI Free Tier
- **Phân loại:** Phụ thuộc bên thứ ba (Third-party Quota).
- **Mô tả:** Hạn mức 10.000 Neurons/ngày của Workers AI có thể bị cạn kiệt nhanh chóng nếu người dùng gửi context quá lớn, hoặc Cloudflare có thể thay đổi danh mục model khả dụng trên gói Free trong tương lai (tương tự đợt thay đổi ngày 2026-07-28).
- **Tác động:** Người dùng có thể gặp lỗi `AI_QUOTA_EXCEEDED` hoặc `AI_CAPACITY_UNAVAILABLE`.
- **Biện pháp xử lý:** Cấu hình model ID qua biến môi trường Worker thay vì hard-code ở extension; thiết lập ngân sách context chặt chẽ (12k token mặc định); hiển thị thông báo lỗi rõ ràng và không retry vô hạn.

### KI-03: Rủi Ro Phân Mảnh Luồng Dữ Liệu Server-Sent Events (SSE Chunks)
- **Phân loại:** Xử lý mạng (Network / Streaming).
- **Mô tả:** Khi nhận streaming token từ Cloudflare Workers AI qua SSE, các gói tin TCP có thể bị chia cắt giữa chừng (split chunks) hoặc dồn nhiều event vào một chunk.
- **Tác động:** Gây lỗi JSON parse nếu extension đọc stream ngây thơ theo từng chunk thô.
- **Biện pháp xử lý:** Xây dựng module `sseParser` riêng với bộ đệm dòng (line buffer), xử lý chính xác CRLF và có bài Unit Test với fixture mô phỏng split chunks trước khi tích hợp vào UI.

---

## 2. Các Hạn Chế Cố Ý Của Phiên Bản MVP (Intentional Limitations)

- **Chỉ hỗ trợ sửa 1 file trong 1 thao tác Fix Code:** MVP không hỗ trợ Multi-file patch để giảm thiểu rủi ro xung đột mã nguồn.
- **Không tự động chạy câu lệnh:** Lệnh chạy test do AI đề xuất chỉ hiển thị dưới dạng văn bản gợi ý; không có cơ chế tự động chạy shell.
- **Không có RAG / Semantic Search:** Không tự động lập chỉ mục vector toàn bộ workspace trong MVP để đảm bảo gói Free và tối ưu tài nguyên.
