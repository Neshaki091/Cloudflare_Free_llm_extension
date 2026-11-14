# Bảng Công Việc Hiện Tại (Task Board)

- **Ngày cập nhật:** 2026-11-14
- **Cột mốc:** Đã hoàn thành `M0`, `M1`, `M2`, `M3`, `M4 (Context Engineering)` và `M5 (Safe Code Assistance)`

Bảng công việc tập trung vào các nhiệm vụ đang kích hoạt (`IN_PROGRESS`) và các nhiệm vụ sẵn sàng thực hiện kế tiếp (`TODO`).

---

## 1. Nhiệm Vụ Kế Tiếp (Milestone M6 — Quality & Official Release)

### TASK-601 — Bộ Kiểm Thử Tự Động Toàn Diện (Unit & Integration Tests)
- **Status:** TODO (Sẵn sàng triển khai)
- **Priority:** P0 (Chất lượng phần mềm)
- **Milestone:** M6 — Quality & Release
- **Related SRS:** FR-007, SRS mục 13.4
- **Dependencies:** Hoàn thành M5
- **Owner:** AI Lead Architect
- **Created:** 2026-11-14
- **Objective:** Viết bài kiểm thử tự động cho Shared types, SSE Parser, Patch Manager, Unescape HTML và Worker Middleware.

### TASK-602 — Hoàn Thiện Tài Liệu Phát Hành & Hướng Dẫn BYO Worker (README.md)
- **Status:** TODO
- **Priority:** P0
- **Milestone:** M6 — Quality & Release
- **Related SRS:** SRS mục 9, 12, 19
- **Dependencies:** TASK-601
- **Owner:** AI Lead Architect
- **Created:** 2026-11-14
- **Objective:** Cập nhật tài liệu hướng dẫn triển khai Worker miễn phí, hình ảnh giao diện thực tế và quy trình cài đặt v0.1.0.

---

## 2. Các Cột Mốc Đã Nghiệm Thu Hoàn Thành
- **M0 — Compatibility Spike:** Xác nhận 100% tính tương thích của Antigravity Extension Host.
- **M1 — Project Foundation:** Khung Monorepo, Shared Contracts, Build scripts.
- **M2 — Cloudflare Backend:** Worker live gateway (`@cf/zai-org/glm-4.7-flash`), SSE streaming, 4096 tokens limit.
- **M3 — Extension MVP:** Webview chat panel, multi-session, local storage, output channel.
- **M4 — Context Engineering:** Nhận diện thư mục cha, đọc tự động file dự án, bộ lọc bảo mật, nút đóng (✕).
- **M5 — Safe Code Assistance:** Menu chuột phải (Explain/Fix/Tests), Diff Editor Preview (`vscode.diff`), bảo vệ thay đổi ngầm (Stale Document Protection), giải mã unescape HTML cho Action Cards.
