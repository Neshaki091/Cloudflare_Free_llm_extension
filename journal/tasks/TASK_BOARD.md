# Bảng Công Việc Hiện Tại (Task Board)

- **Ngày cập nhật:** 2026-11-14
- **Cột mốc:** Đã hoàn thành toàn diện toàn bộ các Milestone từ `M0` đến `M6` (Official Release v0.1.0).

---

## 1. Trạng Thái Tổng Thể Dự Án (All Milestones Completed)

| Milestone | Tên Cột Mốc | Trạng Thái | Ghi Chú Nghiệm Thu |
| :--- | :--- | :---: | :--- |
| **M0** | Compatibility Spike | **DONE** | Antigravity IDE hoàn toàn tương thích với VS Code Extension API. |
| **M1** | Project Foundation | **DONE** | Cấu trúc Monorepo, Shared contracts, Build pipeline hoàn chỉnh. |
| **M2** | Cloudflare Backend | **DONE** | Worker Gateway trực tuyến (`@cf/zai-org/glm-4.7-flash`), SSE streaming, 4096 tokens limit. |
| **M3** | Extension MVP | **DONE** | Chat Webview Panel, Multi-session, SecretStorage, Output Channel. |
| **M4** | Context Engineering | **DONE** | Tự nhận diện thư mục cha, nạp tài liệu tự động, bảo mật file, nút đóng [✕]. |
| **M5** | Safe Code Assistance | **DONE** | Menu chuột phải (Explain/Fix/Tests), Diff Preview, Stale Document Protection, Unescape HTML. |
| **M6** | Quality & Official Release | **DONE** | 13/13 tests tự động PASS (100%), hoàn thiện README.md, VSIX v0.1.0 xuất bản. |

---

## 2. Nhiệm Vụ Milestone M6 (Đã Hoàn Thành)

### TASK-601 — Bộ Kiểm Thử Tự Động Toàn Diện (Unit & Integration Tests)
- **Status:** DONE
- **Priority:** P0 (Chất lượng phần mềm)
- **Milestone:** M6 — Quality & Release
- **Related SRS:** FR-007, SRS mục 13.4
- **Verification Evidence:** Chạy `npm test` với Node.js Native Runner: 13/13 tests vượt qua thành công 100%.

### TASK-602 — Hoàn Thiện Tài Liệu Phát Hành & Hướng Dẫn BYO Worker (README.md)
- **Status:** DONE
- **Priority:** P0
- **Milestone:** M6 — Quality & Release
- **Related SRS:** SRS mục 9, 12, 19
- **Verification Evidence:** Cập nhật toàn diện `README.md` v0.1.0 với hướng dẫn cài đặt VSIX, 3 bước deploy BYO Worker, danh mục lệnh và bảng tiến độ.
