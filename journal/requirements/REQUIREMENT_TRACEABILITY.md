# Ma Trận Truy Vết Yêu Cầu (Requirement Traceability Matrix)

- **Ngày cập nhật:** 2026-11-11
- **Trạng thái:** Baseline Init
- **Tài liệu nguồn:** `journal/requirements/SRS.md` v1.0.0

Ma trận này ánh xạ tất cả các yêu cầu từ SRS sang thành phần kiến trúc, mã nhiệm vụ (Task ID), mã bài kiểm thử (Test ID) và trạng thái triển khai thực tế. Không tự ý tạo thêm ID không có trong SRS.

---

## 1. Yêu Cầu Chức Năng (Functional Requirements)

### 1.1. Extension Lifecycle và Tương Thích

| Requirement ID | Mô Tả Yêu Cầu | Ưu Tiên | Thành Phần | Task ID | Test ID | Trạng Thái |
|---|---|---|---|---|---|---|
| **FR-001** | Extension activate thành công trên Extension Host mục tiêu. | P0 | Extension Core | TASK-001, TASK-101 | TEST-COMPAT-001 | PLANNED |
| **FR-002** | Có compatibility smoke test riêng trên Antigravity IDE. | P0 | Compatibility Test | TASK-001 | TEST-COMPAT-002 | IN_PROGRESS (M0) |
| **FR-003** | Chỉ sử dụng public VS Code Extension API trong MVP. | P0 | Extension Core | TASK-001, TASK-101 | TEST-LINT-001 | PLANNED |
| **FR-004** | Đăng ký command `nescode.openChat`. | P0 | Extension Commands | TASK-102 | TEST-CMD-001 | PLANNED |
| **FR-005** | Đăng ký command `nescode.configureConnection`. | P0 | Extension Commands | TASK-103 | TEST-CMD-002 | PLANNED |
| **FR-006** | Đăng ký command `nescode.checkConnection`. | P0 | Extension Commands | TASK-104 | TEST-CMD-003 | PLANNED |
| **FR-007** | Hỗ trợ Windows, Linux, macOS nếu host hỗ trợ. | P1 | Packaging | TASK-601 | TEST-E2E-001 | BACKLOG |

### 1.2. Chat Webview UI

| Requirement ID | Mô Tả Yêu Cầu | Ưu Tiên | Thành Phần | Task ID | Test ID | Trạng Thái |
|---|---|---|---|---|---|---|
| **FR-010** | Có chat panel riêng trong Activity Bar / View Container. | P0 | Chat UI Provider | TASK-301 | TEST-UI-001 | PLANNED |
| **FR-011** | Gửi prompt bằng nút Send và phím tắt phù hợp. | P0 | Chat UI Composer | TASK-302 | TEST-UI-002 | PLANNED |
| **FR-012** | Hiển thị Markdown, code block và danh sách đã sanitize. | P0 | Markdown Renderer | TASK-303 | TEST-UNIT-MD-001 | PLANNED |
| **FR-013** | Hiển thị trạng thái Idle, Connecting, Streaming, Completed, Error. | P0 | Chat State Manager | TASK-304 | TEST-UI-003 | PLANNED |
| **FR-014** | Có nút Stop/Cancel generation (hủy request qua AbortSignal). | P0 | API Client & UI | TASK-305 | TEST-INT-CANCEL-001 | PLANNED |
| **FR-015** | Lưu lịch sử hội thoại local theo workspace. | P1 | Local Store | TASK-306 | TEST-UNIT-HIST-001 | BACKLOG |
| **FR-016** | Xóa lịch sử hội thoại của workspace. | P1 | Local Store | TASK-307 | TEST-UNIT-HIST-002 | BACKLOG |
| **FR-017** | Nút Copy response văn bản thuần túy. | P1 | Chat UI Transcript | TASK-308 | TEST-UI-004 | BACKLOG |
| **FR-018** | Retry có kiểm soát cho request lỗi tạm thời (tối đa 1 lần). | P1 | API Client | TASK-309 | TEST-UNIT-RETRY-001 | BACKLOG |

### 1.3. Context Collection & Filtering

| Requirement ID | Mô Tả Yêu Cầu | Ưu Tiên | Thành Phần | Task ID | Test ID | Trạng Thái |
|---|---|---|---|---|---|---|
| **FR-020** | Hỗ trợ context từ editor selection đang chọn. | P0 | Context Collector | TASK-401 | TEST-UNIT-CTX-001 | PLANNED |
| **FR-021** | Hỗ trợ context từ active file đang mở. | P0 | Context Collector | TASK-402 | TEST-UNIT-CTX-002 | PLANNED |
| **FR-022** | Cho phép người dùng chủ động chọn file bổ sung qua picker. | P0 | Context Picker | TASK-403 | TEST-UI-CTX-001 | PLANNED |
| **FR-023** | Không tự động gửi toàn bộ workspace (No recursive upload). | P0 | Context Collector | TASK-404 | TEST-UNIT-CTX-003 | PLANNED |
| **FR-024** | Bỏ qua file theo danh sách exclude patterns mặc định. | P0 | Context Filter | TASK-405 | TEST-UNIT-FLT-001 | PLANNED |
| **FR-025** | Giới hạn tổng context budget (12k mặc định, hard cap 20k token). | P0 | Context Budgeter | TASK-406 | TEST-UNIT-BDG-001 | PLANNED |
| **FR-026** | Phân biệt file văn bản (text) và binary; từ chối binary. | P0 | Context Filter | TASK-407 | TEST-UNIT-FLT-002 | PLANNED |
| **FR-027** | Chặn path traversal và file ngoài workspace root. | P0 | Path Validator | TASK-408 | TEST-UNIT-PATH-001 | PLANNED |
| **FR-028** | Hỗ trợ file loại trừ bổ sung `.nescodeignore`. | P1 | Context Filter | TASK-409 | TEST-UNIT-IGN-001 | BACKLOG |
| **FR-029** | Cho phép xem trước context preview trước khi gửi. | P1 | Chat UI Preview | TASK-410 | TEST-UI-CTX-002 | BACKLOG |

### 1.4. Coding Actions & Diff Preview

| Requirement ID | Mô Tả Yêu Cầu | Ưu Tiên | Thành Phần | Task ID | Test ID | Trạng Thái |
|---|---|---|---|---|---|---|
| **FR-030** | Explain Selection: giải thích đoạn mã đang chọn. | P0 | Coding Commands | TASK-501 | TEST-INT-EXP-001 | PLANNED |
| **FR-031** | Explain Active File: giải thích toàn bộ file đang mở. | P0 | Coding Commands | TASK-502 | TEST-INT-EXP-002 | PLANNED |
| **FR-032** | Fix Code trả về patch proposal, không sửa trực tiếp. | P0 | Patch Parser | TASK-503 | TEST-UNIT-PTC-001 | PLANNED |
| **FR-033** | Validate đường dẫn patch nằm trọn vẹn trong workspace. | P0 | Path Validator | TASK-504 | TEST-UNIT-PTC-002 | PLANNED |
| **FR-034** | Cung cấp hai nút Apply và Reject patch độc lập. | P0 | Diff Preview UI | TASK-505 | TEST-UI-DIFF-001 | PLANNED |
| **FR-035** | Kiểm tra phiên bản/nội dung file không bị sửa ngầm trước khi Apply. | P0 | Stale Protection | TASK-506 | TEST-UNIT-DIFF-001 | PLANNED |
| **FR-036** | Generate Tests: xuất mã test đề xuất, không tự động chạy. | P1 | Coding Commands | TASK-507 | TEST-INT-TST-001 | BACKLOG |
| **FR-037** | Cho phép xem trước diff tạo test file mới trước khi ghi. | P1 | Diff Preview UI | TASK-508 | TEST-UI-DIFF-002 | BACKLOG |
| **FR-038** | Hỗ trợ Multi-file patch có validation nghiêm ngặt. | P2 | Patch Engine | TASK-509 | TEST-UNIT-PTC-003 | BACKLOG |

### 1.5. Cloudflare Worker Backend & Workers AI

| Requirement ID | Mô Tả Yêu Cầu | Ưu Tiên | Thành Phần | Task ID | Test ID | Trạng Thái |
|---|---|---|---|---|---|---|
| **FR-040** | Worker cung cấp endpoint `GET /v1/health`. | P0 | Worker Router | TASK-201 | TEST-WRK-HLT-001 | PLANNED |
| **FR-041** | Worker cung cấp endpoint `GET /v1/models`. | P0 | Worker Router | TASK-202 | TEST-WRK-MDL-001 | PLANNED |
| **FR-042** | Worker cung cấp endpoint `POST /v1/chat`. | P0 | Worker Router | TASK-203 | TEST-WRK-CHT-001 | PLANNED |
| **FR-043** | Worker yêu cầu xác thực Bearer API key (`timingSafeEqual`). | P0 | Auth Middleware | TASK-204 | TEST-WRK-AUTH-001 | PLANNED |
| **FR-044** | Worker chỉ cho phép gọi các model nằm trong allowlist. | P0 | Model Router | TASK-205 | TEST-WRK-ROUT-001 | PLANNED |
| **FR-045** | Worker tạo System Prompt an toàn ở phía máy chủ. | P0 | Prompt Builder | TASK-206 | TEST-WRK-PRM-001 | PLANNED |
| **FR-046** | Worker giới hạn input/output size và body size (256 KiB). | P0 | Body Validator | TASK-207 | TEST-WRK-VAL-001 | PLANNED |
| **FR-047** | Worker chuẩn hóa các lỗi của Workers AI thành mã lỗi ổn định. | P0 | Error Normalizer | TASK-208 | TEST-WRK-ERR-001 | PLANNED |
| **FR-048** | Worker tuyệt đối không ghi prompt/source code vào log mặc định. | P0 | Safe Logger | TASK-209 | TEST-WRK-LOG-001 | PLANNED |
| **FR-049** | Worker hỗ trợ streaming phản hồi Server-Sent Events (SSE). | P1 | Stream Adapter | TASK-210 | TEST-WRK-SSE-001 | BACKLOG |
| **FR-050** | Worker hỗ trợ phản hồi JSON fallback khi không stream. | P1 | Worker Chat Route | TASK-211 | TEST-WRK-JSN-001 | BACKLOG |
| **FR-051** | Worker đính kèm `requestId` tương quan vào mỗi phản hồi. | P1 | Request Middleware | TASK-212 | TEST-WRK-REQ-001 | BACKLOG |

### 1.6. Quản Lý Kết Nối & Usage

| Requirement ID | Mô Tả Yêu Cầu | Ưu Tiên | Thành Phần | Task ID | Test ID | Trạng Thái |
|---|---|---|---|---|---|---|
| **FR-060** | Hiển thị rõ ràng trạng thái API Connection (Connected/Disconnected). | P0 | UI Status Bar | TASK-105 | TEST-UI-STAT-001 | PLANNED |
| **FR-061** | Thông báo rõ ràng khi gặp lỗi Quota hoặc Capacity của Workers AI. | P0 | Error Handler | TASK-106 | TEST-UI-ERR-001 | PLANNED |
| **FR-062** | Không tự ý chuyển đổi sang model trả phí khi hết hạn mức Free. | P0 | Model Router | TASK-205 | TEST-WRK-ROUT-002 | PLANNED |
| **FR-063** | Hiển thị token/Neurons usage nếu provider trả về số liệu. | P1 | Chat UI Footer | TASK-310 | TEST-UI-USG-001 | BACKLOG |
| **FR-064** | Cung cấp cấu hình max context và max output an toàn. | P1 | Settings Manager | TASK-107 | TEST-CFG-001 | BACKLOG |
| **FR-065** | Cho phép thay đổi model mặc định qua Worker variables. | P1 | Worker Config | TASK-213 | TEST-WRK-CFG-001 | BACKLOG |

---

## 2. Yêu Cầu Phi Chức Năng (Non-Functional Requirements)

### 2.1. Bảo Mật (Security)

| Requirement ID | Mô Tả Yêu Cầu | Mức Độ | Trạng Thái |
|---|---|---|---|
| **NFR-SEC-001** | Chỉ dùng HTTPS cho endpoint Worker; từ chối HTTP trừ localhost. | MUST | PLANNED |
| **NFR-SEC-002** | API key extension bắt buộc lưu bằng `SecretStorage`, không lưu `settings.json`. | MUST | PLANNED |
| **NFR-SEC-003** | Không nhúng Cloudflare Account API Token vào extension/package/repo. | MUST | PLANNED |
| **NFR-SEC-004** | Worker secret `NESCODE_API_KEY` chỉ quản lý qua cơ chế secret của Cloudflare. | MUST | PLANNED |
| **NFR-SEC-005** | So sánh API key an toàn thời gian (`timingSafeEqual`); không phản hồi lại key. | MUST | PLANNED |
| **NFR-SEC-006** | Không đưa secret hay raw payload vào exception telemetry. | MUST | PLANNED |
| **NFR-SEC-007** | Render Markdown đã được sanitize, không thực thi HTML/script tùy ý. | MUST | PLANNED |
| **NFR-SEC-008** | Patch chỉ được áp dụng vào file URI nằm trong workspace root hợp lệ. | MUST | PLANNED |
| **NFR-SEC-009** | Không tự động thực thi các câu lệnh shell do model trả về. | MUST | PLANNED |
| **NFR-SEC-010** | Worker validate chặt chẽ schema, độ dài, message roles và kích thước body. | MUST | PLANNED |
| **NFR-SEC-011** | Worker không lưu prompt, mã nguồn hay response vào persistent storage. | MUST | PLANNED |
| **NFR-SEC-012** | CORS không thay thế xác thực. Bearer API key là lớp xác thực bắt buộc. | MUST | PLANNED |
| **NFR-SEC-013** | Hỗ trợ quy trình rotate/revoke API key độc lập. | SHOULD | PLANNED |
| **NFR-SEC-014** | Hiển thị thông báo quyền riêng tư trước lần gửi context đầu tiên. | SHOULD | PLANNED |

### 2.2. Hiệu Năng & Độ Tin Cậy (Performance & Reliability)

| Requirement ID | Mô Tả Yêu Cầu | Mức Độ | Trạng Thái |
|---|---|---|---|
| **NFR-PERF-001** | `activate()` extension không thực hiện network call blocking. | MUST | PLANNED |
| **NFR-PERF-002** | Chat panel hiển thị trong vòng 1 giây trên workspace thông thường. | TARGET | PLANNED |
| **NFR-PERF-003** | Logic Worker CPU phải nhẹ (dưới ngưỡng 10 ms CPU time của Free plan). | MUST | PLANNED |
| **NFR-PERF-004** | Giới hạn context mặc định tối đa 12.000 token; hard cap 20.000 token. | MUST | PLANNED |
| **NFR-PERF-005** | Giới hạn output mặc định tối đa 1.500 token. | MUST | PLANNED |
| **NFR-PERF-006** | Không quét đệ quy toàn bộ workspace trong MVP. | MUST | PLANNED |
| **NFR-PERF-007** | Streaming UI render tăng dần, tránh re-render toàn bộ transcript mỗi token. | MUST | PLANNED |
