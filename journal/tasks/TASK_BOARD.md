# Bảng Công Việc Hiện Tại (Task Board)

- **Ngày cập nhật:** 2026-11-11
- **Cột mốc:** Hoàn thành `M0 — Compatibility Spike` ➔ Chuyển giao sang `M1 — Project Foundation`

Bảng công việc tập trung vào các nhiệm vụ đang kích hoạt (`IN_PROGRESS`) và các nhiệm vụ sẵn sàng thực hiện kế tiếp (`TODO`).

---

## 1. Nhiệm Vụ Đang Kích Hoạt / Kế Tiếp (Active / Next)

### TASK-100 — Thiết lập hạ tầng TypeScript Monorepo và Packages Tooling
- **Status:** TODO (Sẵn sàng thực hiện cho Milestone M1)
- **Priority:** P0 (Nền tảng dự án)
- **Milestone:** M1 — Project Foundation
- **Related SRS:** SRS mục 10.1, 10.2
- **Dependencies:** Hoàn thành TASK-001 (Kết luận GO từ Compatibility Spike)
- **Owner:** AI Lead Architect
- **Created:** 2026-11-11
- **Updated:** 2026-11-11

#### Objective
Cấu hình hoàn chỉnh npm workspaces, cài đặt dev dependencies nền tảng (`typescript`, `@types/vscode`, `esbuild`, `vitest`), thiết lập cấu hình tsconfig cho từng workspace và chuẩn bị script build cho toàn dự án.

#### Scope
- Cài đặt dependencies cho `src/extension`, `src/worker`, `src/shared`.
- Kiểm tra `npm run typecheck` trên toàn bộ workspaces.
- Thiết lập kịch bản build với `esbuild`.

#### Acceptance Criteria
1. Lệnh `npm run typecheck` chạy qua toàn bộ workspaces mà không có lỗi.
2. Build script biên dịch thành công mã nguồn ra thư mục `build/`.

---

## 2. Nhiệm Vụ Tiếp Theo Trong M1 (Upcoming Tasks)

### TASK-101 — Xây dựng Shared Contracts (API Types, Error Codes, Constants)
- **Status:** TODO
- **Priority:** P0
- **Milestone:** M1 — Project Foundation
- **Related SRS:** SRS mục 7.4, 7.5, 7.6, 7.7
- **Dependencies:** TASK-100
- **Owner:** AI Agent
- **Created:** 2026-11-11
- **Updated:** 2026-11-11
- **Objective:** Định nghĩa toàn bộ interfaces, types cho Chat Request, SSE Delta Events, Error Contracts và Constants tại `src/shared/`.
