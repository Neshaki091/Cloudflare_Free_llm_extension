# Cấu Trúc Bộ Kiểm Thử (Testing Architecture)

Thư mục `tests/` tổ chức toàn bộ các kịch bản kiểm thử của dự án **NesCode for Antigravity** theo các tầng cô lập rõ ràng.

---

## 1. Phân Chia Các Tầng Kiểm Thử

### `tests/unit/` (Kiểm Thử Đơn Vị Cục Bộ)
- Kiểm thử các hàm thuần túy (pure functions), bộ lọc, bộ phân tích cú pháp không phụ thuộc vào mạng hay Extension Host:
  - `contextFilter.test.ts`: Kiểm tra việc loại trừ các file bí mật (`.env`, `*.key`) và thư mục build.
  - `contextBudgeter.test.ts`: Kiểm tra việc cắt giảm token và giới hạn kích thước context.
  - `pathValidator.test.ts`: Kiểm tra khả năng chặn đứng tấn công Path Traversal (`../`, absolute paths).
  - `sseParser.test.ts`: Kiểm tra khả năng xử lý luồng Server-Sent Events bị phân mảnh (split chunks, CRLF).
  - `patchParser.test.ts`: Kiểm tra việc phân tích cú pháp patch đề xuất và tính hợp lệ của schema.
  - `workerAuth.test.ts`: Kiểm tra middleware xác thực Bearer token trên Worker.

### `tests/integration/` (Kiểm Thử Tích Hợp)
- Kiểm thử luồng giao tiếp giữa Extension Client và Worker Backend:
  - Khởi chạy Worker giả lập qua Miniflare cục bộ.
  - Kiểm tra các endpoint `GET /v1/health`, `GET /v1/models`, `POST /v1/chat`.
  - Kiểm tra việc xử lý mã lỗi Quota (`AI_QUOTA_EXCEEDED`) và cơ chế hủy request (`AbortSignal`).

### `tests/compatibility/` (Kiểm Chứng Tương Thích Nền Tảng — M0)
- Kiểm thử thực tế trên Extension Host của Antigravity IDE:
  - `spike-extension/`: Mã nguồn extension thử nghiệm tối thiểu kiểm tra các API cốt lõi (`activate`, `commands`, `WebviewView`, `SecretStorage`, `workspace`).

### `tests/fixtures/` (Dữ Liệu Mẫu)
- Chứa các file giả lập để phục vụ kiểm thử:
  - File mã nguồn mẫu để test Context Collector.
  - Luồng SSE stream mẫu có lỗi và không có lỗi.
  - Các khối unified diff mẫu hợp lệ và bất thường.

---

## 2. Quy Chuẩn Thực Thi Kiểm Thử
- **Không giả mạo kết quả:** Không bao giờ tuyên bố kiểm thử thành công nếu chưa thực sự chạy lệnh.
- **Báo cáo kết quả trung thực:** Ghi nhận rõ ràng trạng thái: `PASS`, `FAIL`, `BLOCKED`, hoặc `NOT RUN`.
