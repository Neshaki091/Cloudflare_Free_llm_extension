# Bảng Công Việc Hiện Tại (Task Board)

- **Ngày cập nhật:** 2026-11-11
- **Cột mốc hiện tại:** `M0 — Compatibility Spike`

Bảng công việc tập trung vào các nhiệm vụ đang kích hoạt (`IN_PROGRESS`) và các nhiệm vụ sẵn sàng thực hiện kế tiếp (`TODO`).

---

## 1. Nhiệm Vụ Đang Thực Hiện (In Progress / Active)

### TASK-001 — Xây dựng và thực thi bài kiểm chứng tương thích Antigravity IDE (Compatibility Spike)

- **Status:** TODO (Sẵn sàng kích hoạt ngay sau khởi tạo)
- **Priority:** P0 (Tối cao — Điều kiện tiên quyết trước mọi code tính năng)
- **Milestone:** M0 — Compatibility Spike
- **Related SRS:** FR-001, FR-002, FR-003, mục 13.3, mục 14 (Milestone 0)
- **Dependencies:** Hoàn thành TASK-000 (Cấu trúc repo chuẩn)
- **Owner:** AI Agent & Human Developer
- **Created:** 2026-11-11
- **Updated:** 2026-11-11

#### Objective
Xác nhận xem Antigravity IDE có hỗ trợ đầy đủ các API cần thiết của VS Code Extension (Extension Host, commands, WebviewView panel, SecretStorage, Workspace editor state) hay không, trước khi tiến hành code các tính năng sản phẩm.

#### Scope
- Tạo mã nguồn extension thử nghiệm tối thiểu trong `tests/compatibility/spike-extension/`.
- Đóng gói file `.vsix` thử nghiệm.
- Cài đặt vào Antigravity IDE và chạy kịch bản kiểm tra tự động/thủ công.
- Thu thập nhật ký (logs), chụp ảnh màn hình và xuất báo cáo `docs/COMPATIBILITY.md`.

#### Acceptance Criteria
1. Extension spike cài đặt thành công vào Antigravity IDE.
2. Hàm `activate()` thực thi không phát sinh lỗi.
3. Lệnh `nescode.spikeCheck` xuất hiện trong Command Palette và chạy được.
4. Panel WebviewView hiển thị nội dung kiểm tra thành công.
5. Ghi một chuỗi thử nghiệm vào `SecretStorage` và đọc lại chính xác.
6. Đọc được đường dẫn file và văn bản đang chọn trong editor.
7. Xuất tài liệu `docs/COMPATIBILITY.md` với kết luận Go/No-Go rõ ràng.

#### Verification
```bash
# Đóng gói extension spike
npm run package:spike
# Cài đặt file .vsix vào Antigravity IDE và xác nhận kết quả kiểm tra
```

#### Risks / Notes
Nếu Antigravity IDE thiếu hỗ trợ cho `WebviewView` hoặc `SecretStorage`, phải ghi nhận `BLOCKED` và báo cáo ngay để tìm phương án kiến trúc thay thế (ví dụ: dùng WebviewPanel độc lập hoặc file cấu hình mã hóa cục bộ).

---

## 2. Nhiệm Vụ Tiếp Theo (Upcoming Tasks)

### TASK-100 — Thiết lập hạ tầng TypeScript Monorepo và Packages Tooling
- **Status:** TODO
- **Priority:** P0
- **Milestone:** M1 — Project Foundation
- **Related SRS:** SRS mục 10.1, 10.2
- **Dependencies:** TASK-001 (Kết luận Go từ Compatibility Spike)
- **Owner:** AI Agent
- **Created:** 2026-11-11
- **Updated:** 2026-11-11
- **Objective:** Cấu hình hoàn chỉnh npm workspaces, `tsconfig.base.json`, script build `esbuild` và test runner `Vitest`.

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
