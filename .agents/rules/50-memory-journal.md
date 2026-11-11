---
trigger: always_on
---

# Quy Chuẩn Quản Lý Bộ Nhớ và Nhật Ký (Memory & Journal Governance)

Hệ thống tài liệu `memory/` và `journal/` là nền tảng tri thức dài hạn giúp duy trì tính nhất quán xuyên suốt các phiên làm việc của các AI Agent.

## 1. Vai Trò Của Thư Mục `memory/` (Tri Thức Bền Vững Đã Tuyển Chọn)
- `memory/` chỉ lưu trữ các sự thật kiến trúc đã được kiểm chứng, ràng buộc kỹ thuật bền vững và bối cảnh cốt lõi của dự án.
- **Quy tắc cập nhật:**
  - Chỉ cập nhật khi có sự thay đổi mang tính bền vững (ví dụ: xác nhận Antigravity hỗ trợ Webview, bổ sung quy ước kiến trúc mới).
  - Không sao chép toàn bộ hội thoại hay nhật ký làm việc chi tiết vào `memory/`.
  - Tuyệt đối không ghi thông tin nhạy cảm, API key, token hay toàn bộ mã nguồn vào `memory/`.
  - Phân định rõ ràng giữa "Sự thật đã kiểm chứng" (Verified Fact) và "Giả định/Đề xuất" (Assumption/Proposal).
  - Khi một thông tin cũ không còn đúng, chuyển vào `memory/archive/` thay vì xóa âm thầm.

## 2. Vai Trò Của Thư Mục `journal/` (Tiến Trình Phát Triển Có Thể Kiểm Toán)
- `journal/` lưu giữ toàn bộ tiến trình lịch sử, mục tiêu, lộ trình, quản lý công việc và nhật ký từng phiên làm việc:
  - `journal/goals/`: Mục tiêu dự án dài hạn, mục tiêu MVP và tiêu chí thành công có thể đo lường.
  - `journal/requirements/`: Bản gốc `SRS.md` và bảng ma trận truy vết yêu cầu (`REQUIREMENT_TRACEABILITY.md`).
  - `journal/planning/`: Lộ trình (`ROADMAP.md`), các cột mốc (`MILESTONES.md`), và quản lý rủi ro kỹ thuật (`TECHNICAL_RISKS.md`).
  - `journal/tasks/`: Bảng công việc hiện tại (`TASK_BOARD.md`), tồn đọng tương lai (`BACKLOG.md`), và công việc đã hoàn thành (`COMPLETED_TASKS.md`).
  - `journal/decisions/`: Các bản ghi quyết định kiến trúc (`ADR-*.md`).
  - `journal/milestones/`: Tài liệu chi tiết kế hoạch và kết quả cho từng cột mốc (bắt đầu bằng `M0_COMPATIBILITY_SPIKE.md`).
  - `journal/sessions/`: Nhật ký chi tiết của từng phiên làm việc (theo mẫu `SESSION_TEMPLATE.md`).

## 3. Quy Trình Cập Nhật Công Việc (Task Board Workflow)
- Mọi task phải có mã định danh duy nhất (ví dụ: `TASK-001`, `TASK-002`) và liên kết chặt chẽ với Requirement ID của SRS.
- Cập nhật trạng thái nhiệm vụ kịp thời: `TODO` → `IN_PROGRESS` → `BLOCKED` / `IN_REVIEW` → `DONE`.
- Khi một task đạt trạng thái `DONE` (đủ tiêu chuẩn nghiệm thu và có bằng chứng xác thực), chuyển thông tin tóm tắt sang `COMPLETED_TASKS.md`.
