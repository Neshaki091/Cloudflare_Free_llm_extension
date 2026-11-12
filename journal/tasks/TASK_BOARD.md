# Bảng Công Việc Hiện Tại (Task Board)

- **Ngày cập nhật:** 2026-11-12
- **Cột mốc:** Đã hoàn thành `M1 (Shared Contracts)` & `M2 (Cloudflare Worker Backend MVP)`

Bảng công việc tập trung vào các nhiệm vụ đang kích hoạt (`IN_PROGRESS`) và các nhiệm vụ sẵn sàng thực hiện kế tiếp (`TODO`).

---

## 1. Nhiệm Vụ Kế Tiếp (Milestone M3 — Extension MVP)

### TASK-301 — Xây dựng Chat Webview Provider với Content Security Policy
- **Status:** TODO (Sẵn sàng triển khai)
- **Priority:** P0 (Giao diện Extension)
- **Milestone:** M3 — Extension MVP
- **Related SRS:** FR-010, FR-011, FR-012, FR-013, FR-014, NFR-SEC-007
- **Dependencies:** Hoàn thành M0, M1, M2
- **Owner:** AI Lead Architect
- **Created:** 2026-11-11
- **Updated:** 2026-11-12
- **Objective:** Tích hợp Chat Webview Panel vào thanh bên Antigravity IDE, hỗ trợ hiển thị Markdown, code blocks, streaming thời gian thực, nút Cancel và quản lý trạng thái kết nối.

### TASK-302 — Quản Lý Secret và Cấu Hình Kết Nối Worker
- **Status:** TODO
- **Priority:** P0
- **Milestone:** M3 — Extension MVP
- **Related SRS:** FR-005, FR-006, FR-060, NFR-SEC-002
- **Dependencies:** TASK-301
- **Owner:** AI Lead Architect
- **Created:** 2026-11-11
- **Updated:** 2026-11-12
- **Objective:** Tích hợp `SecretStorage` (`context.secrets`) để lưu trữ an toàn Worker Bearer API Key và cấu hình URL Worker.
