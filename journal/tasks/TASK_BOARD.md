# Bảng Công Việc Hiện Tại (Task Board)

- **Ngày cập nhật:** 2026-11-12
- **Cột mốc:** Đã hoàn thành `M0 (Compatibility Spike)`, `M1 (Shared Contracts)`, `M2 (Worker Backend)`, và `M3 (Extension MVP)`

Bảng công việc tập trung vào các nhiệm vụ đang kích hoạt (`IN_PROGRESS`) và các nhiệm vụ sẵn sàng thực hiện kế tiếp (`TODO`).

---

## 1. Nhiệm Vụ Kế Tiếp (Milestone M4 — Context Engineering)

### TASK-401 — Bộ Thu Thập Ngữ Cảnh Nâng Cao (Context Collector)
- **Status:** TODO (Sẵn sàng triển khai)
- **Priority:** P0 (Kỹ thuật ngữ cảnh)
- **Milestone:** M4 — Context Engineering
- **Related SRS:** FR-020, FR-021, FR-022, FR-023
- **Dependencies:** Hoàn thành M3 (Extension MVP)
- **Owner:** AI Lead Architect
- **Created:** 2026-11-11
- **Updated:** 2026-11-12
- **Objective:** Hoàn thiện bộ chọn file chủ động (Context Picker) và chỉ gửi các file người dùng chủ động cho phép.

### TASK-402 — Bộ Lọc File Bí Mật và Ngân Sách Ngữ Cảnh (Context Filter & Budgeter)
- **Status:** TODO
- **Priority:** P0
- **Milestone:** M4 — Context Engineering
- **Related SRS:** FR-024, FR-025, FR-026, FR-027, NFR-SEC-008
- **Dependencies:** TASK-401
- **Owner:** AI Lead Architect
- **Created:** 2026-11-11
- **Updated:** 2026-11-12
- **Objective:** Tích hợp bộ lọc 20 file loại trừ bí mật (`.env`, `*.key`), kiểm soát ngân sách token (12k mặc định, hard cap 20k token) và chặn path traversal.
