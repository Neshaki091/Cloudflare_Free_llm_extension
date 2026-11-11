---
trigger: model_decision
description: "Chỉ dẫn xây dựng chiến lược kiểm thử, viết test tự động và đảm bảo chất lượng phần mềm theo tiêu chuẩn SRS."
---

# Quy Chuẩn Kiểm Thử và Chất Lượng (Testing & Quality Assurance)

Tài liệu này định hình chiến lược kiểm thử cho toàn bộ dự án NesCode for Antigravity, đảm bảo tính ổn định và sự tin cậy cao nhất.

## 1. Nguyên Tắc Kiểm Thử
- **Kiểm thử hành vi, không kiểm thử chi tiết triển khai:** Tập trung kiểm tra đầu vào và đầu ra kỳ vọng của module, không ràng buộc quá chặt vào cấu trúc hàm nội bộ.
- **Bao phủ cả luồng thành công và luồng thất bại:** Không chỉ test kịch bản lý tưởng (happy path), mà phải kiểm thử triệt để các kịch bản ngoại lệ:
  - Sai hoặc thiếu Bearer token (HTTP 401).
  - Vượt quá kích thước payload (HTTP 413).
  - Vượt quá quota của Workers AI (mã `AI_QUOTA_EXCEEDED`).
  - Hết capacity hoặc model không sẵn sàng (mã `AI_CAPACITY_UNAVAILABLE`).
  - Phản hồi dị dạng hoặc luồng SSE bị ngắt kết nối giữa chừng.
  - Quá thời gian chờ (Timeout) và lệnh hủy (AbortSignal).
- **Kiểm thử hồi quy (Regression Testing):** Khi sửa bất kỳ lỗi nào, bắt buộc phải viết bài test tái hiện lỗi trước, sau đó sửa code và xác nhận test đã pass để ngăn ngừa tái diễn.

## 2. Phân Tách Các Cấp Độ Kiểm Thử
Dự án tổ chức kiểm thử thành các tầng riêng biệt trong thư mục `tests/`:
- `tests/unit/`: Kiểm thử đơn vị cô lập, không gọi mạng thật và không cần Antigravity IDE:
  - Bộ lọc file nhạy cảm (`contextFilter`).
  - Bộ tính toán ngân sách context (`contextBudgeter`).
  - Bộ chuẩn hóa và kiểm tra đường dẫn an toàn (`pathValidator`).
  - Bộ giải mã luồng Server-Sent Events (`sseParser`).
  - Bộ phân tích cú pháp patch (`patchParser`).
  - Logic xác thực request và chuẩn hóa lỗi trên Worker.
- `tests/integration/`: Kiểm thử tích hợp giữa Extension client và Worker backend cục bộ (sử dụng Vitest và Cloudflare Miniflare/workerd).
- `tests/compatibility/`: Kiểm chứng thực tế trên môi trường Antigravity IDE thực tế (Milestone M0), xác nhận các API của Extension Host hoạt động như kỳ vọng.
- `tests/fixtures/`: Dữ liệu mẫu (mã nguồn giả lập, mock SSE chunks, diff proposal hợp lệ và không hợp lệ).

## 3. Không Tuyên Bố Tương Thích Nếu Chưa Kiểm Chứng Thực Tế
- Không khẳng định rằng Antigravity hỗ trợ một API cụ thể của VS Code nếu chưa có kết quả kiểm thử thực tế từ bài test tương thích (Compatibility Spike).
- Mọi kết quả kiểm thử phải được báo cáo trung thực kèm lệnh thực thi và log đầu ra.
