# Danh Sách Công Việc Tồn Đọng (Backlog)

- **Ngày cập nhật:** 2026-11-11
- **Tài liệu nguồn:** `journal/requirements/SRS.md` và `journal/planning/ROADMAP.md`

Tập hợp các nhiệm vụ đã được quy hoạch cho các cột mốc tiếp theo (từ M1 đến M6) và các tính năng sau MVP (v0.2/v0.3). Mỗi nhiệm vụ đều tuân thủ cấu trúc chuẩn.

---

## 1. Cột Mốc M1 — Project Foundation

### TASK-102 — Thiết lập Base Extension Lifecycle & Activation
- **Status:** TODO | **Priority:** P0 | **Milestone:** M1 | **Related SRS:** FR-001, FR-003
- **Objective:** Tạo module kích hoạt extension tối thiểu, đăng ký lifecycle `activate()` và `deactivate()`.

### TASK-103 — Đăng ký các Commands cơ bản
- **Status:** TODO | **Priority:** P0 | **Milestone:** M1 | **Related SRS:** FR-004, FR-005, FR-006
- **Objective:** Đăng ký các lệnh `openChat`, `configureConnection`, `checkConnection` vào `package.json` của extension.

---

## 2. Cột Mốc M2 — Cloudflare Backend

### TASK-201 — Khởi tạo Cloudflare Worker và Wrangler Configuration
- **Status:** TODO | **Priority:** P0 | **Milestone:** M2 | **Related SRS:** FR-040, SRS mục 9.1
- **Objective:** Thiết lập Worker runtime với file `wrangler.jsonc`, cấu hình AI binding `AI`.

### TASK-202 — Triển khai Middleware xác thực Bearer Token
- **Status:** TODO | **Priority:** P0 | **Milestone:** M2 | **Related SRS:** FR-043, NFR-SEC-004, NFR-SEC-005
- **Objective:** Xác thực `Authorization: Bearer <KEY>` sử dụng phương thức so sánh an toàn thời gian (`timingSafeEqual`).

### TASK-203 — Triển khai Endpoint `GET /v1/health` và `GET /v1/models`
- **Status:** TODO | **Priority:** P0 | **Milestone:** M2 | **Related SRS:** FR-040, FR-041
- **Objective:** Cung cấp thông tin trạng thái backend và danh sách model allowlist an toàn.

### TASK-204 — Triển khai Endpoint `POST /v1/chat` và Model Routing
- **Status:** TODO | **Priority:** P0 | **Milestone:** M2 | **Related SRS:** FR-042, FR-044, FR-045, FR-046
- **Objective:** Xử lý request chat, validate schema, inject system prompt máy chủ, gọi `@cf/zai-org/glm-4.7-flash` qua binding.

### TASK-205 — Adapter Server-Sent Events (SSE) và Chuẩn Hóa Lỗi
- **Status:** TODO | **Priority:** P0 | **Milestone:** M2 | **Related SRS:** FR-047, FR-049, FR-050
- **Objective:** Chuyển đổi định dạng streaming thô từ Cloudflare sang hợp đồng SSE chuẩn (`meta`, `delta`, `done`, `error`).

---

## 3. Cột Mốc M3 — Extension MVP

### TASK-301 — Xây dựng Chat Webview Provider với Content Security Policy
- **Status:** TODO | **Priority:** P0 | **Milestone:** M3 | **Related SRS:** FR-010, NFR-SEC-007
- **Objective:** Tạo Chat Panel trong thanh bên, áp dụng CSP nghiêm ngặt không nạp script ngoài.

### TASK-302 — Quản Lý Secret và Cấu Hình Kết Nối Worker
- **Status:** TODO | **Priority:** P0 | **Milestone:** M3 | **Related SRS:** FR-005, FR-060, NFR-SEC-002
- **Objective:** Lưu Worker API Key bằng `SecretStorage`, cấu hình URL qua settings.

### TASK-303 — Tích Hợp Markdown Renderer và Code Blocks
- **Status:** TODO | **Priority:** P0 | **Milestone:** M3 | **Related SRS:** FR-012, FR-017
- **Objective:** Render Markdown an toàn, highlight cú pháp code và cung cấp nút sao chép (Copy).

### TASK-304 — Xây dựng Worker API Client và SSE Parser
- **Status:** TODO | **Priority:** P0 | **Milestone:** M3 | **Related SRS:** FR-011, FR-013, FR-014
- **Objective:** Gửi request kèm `AbortController`, phân tích luồng SSE và xử lý trạng thái UI.

---

## 4. Cột Mốc M4 — Context Engineering

### TASK-401 — Bộ Thu Thập Ngữ Cảnh (Context Collector)
- **Status:** TODO | **Priority:** P0 | **Milestone:** M4 | **Related SRS:** FR-020, FR-021, FR-022, FR-023
- **Objective:** Đọc selection và file đang mở; hỗ trợ chọn file bổ sung qua picker mà không quét cả workspace.

### TASK-402 — Bộ Lọc File Bí Mật (Context Filter & Secret Exclusion)
- **Status:** TODO | **Priority:** P0 | **Milestone:** M4 | **Related SRS:** FR-024, FR-026
- **Objective:** Tự động bỏ qua các file bí mật (`.env`, `*.key`) và các thư mục build (`node_modules/`, `dist/`).

### TASK-403 — Ngân Sách Ngữ Cảnh và Chống Path Traversal
- **Status:** TODO | **Priority:** P0 | **Milestone:** M4 | **Related SRS:** FR-025, FR-027, NFR-PERF-004
- **Objective:** Giới hạn context dưới 12k token (hard cap 20k token) và chặn đứng đường dẫn `../`.

---

## 5. Cột Mốc M5 — Safe Code Assistance

### TASK-501 — Triển Khai Tính Năng Giải Thích Mã Nguồn (Explain Code)
- **Status:** TODO | **Priority:** P0 | **Milestone:** M5 | **Related SRS:** FR-030, FR-031
- **Objective:** Tích hợp menu chuột phải và command giải thích selection hoặc active file.

### TASK-502 — Triển Khai Tính Năng Sửa Mã Nguồn Trực Quan (Fix Code Diff Preview)
- **Status:** TODO | **Priority:** P0 | **Milestone:** M5 | **Related SRS:** FR-032, FR-033, FR-034
- **Objective:** Nhận patch đề xuất từ AI, hiển thị giao diện Diff trực quan với hai nút Apply và Reject.

### TASK-503 — Cơ Chế Bảo Vệ File Thay Đổi Ngầm (Stale Document Protection)
- **Status:** TODO | **Priority:** P0 | **Milestone:** M5 | **Related SRS:** FR-035, NFR-SEC-008
- **Objective:** Kiểm tra hash nội dung file trên đĩa trước khi Apply patch để tránh mất dữ liệu người dùng.

### TASK-504 — Triển Khai Tính Năng Sinh Kiểm Thử (Generate Tests)
- **Status:** TODO | **Priority:** P1 | **Milestone:** M5 | **Related SRS:** FR-036, FR-037, NFR-SEC-009
- **Objective:** Sinh code test đề xuất để người dùng xem trước, không tự động chạy command shell.

---

## 6. Cột Mốc M6 — Quality & Release

### TASK-601 — Đóng Gói VSIX và Kiểm Thử Tự Động Toàn Diện
- **Status:** TODO | **Priority:** P0 | **Milestone:** M6 | **Related SRS:** FR-007, SRS mục 13.4
- **Objective:** Đóng gói file `.vsix` chuẩn, chạy toàn bộ Unit và Integration tests, nghiệm thu theo checklist.

### TASK-602 — Hoàn Thiện Bộ Tài Liệu BYO Worker và Bảo Mật
- **Status:** TODO | **Priority:** P0 | **Milestone:** M6 | **Related SRS:** SRS mục 9, 12, 19
- **Objective:** Viết tài liệu hướng dẫn triển khai Worker, giải thích chính sách bảo mật và hướng dẫn gỡ lỗi.
