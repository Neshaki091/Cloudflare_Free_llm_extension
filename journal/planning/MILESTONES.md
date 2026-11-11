# Chi Tiết Các Cột Mốc Triển Khai (Milestones Specification)

- **Ngày cập nhật:** 2026-11-11
- **Tài liệu nguồn:** `journal/requirements/SRS.md` Phần 14

Tài liệu này xác định chi tiết mục tiêu, sản phẩm bàn giao, điều kiện phụ thuộc, tiêu chí nghiệm thu và rủi ro cho từng cột mốc từ M0 đến M6.

---

## Cột Mốc M0: Compatibility Spike (Ưu Tiên P0 Cao Nhất)

- **Mục tiêu:** Kiểm chứng tính khả thi của Extension Host trong Antigravity IDE thực tế; xác định chính xác danh sách API VS Code hoạt động và không hoạt động.
- **Sản phẩm bàn giao (Deliverables):**
  - Gói extension thử nghiệm tối thiểu (`test-spike.vsix`).
  - Mã nguồn spike trong `tests/compatibility/`.
  - Báo cáo kết quả kiểm chứng chi tiết `docs/COMPATIBILITY.md`.
- **Yêu cầu SRS liên quan:** `FR-001`, `FR-002`, `FR-003`, `SC-01`, `SC-02`, `SC-03`, `SC-04`, `SC-05`, `SC-06`.
- **Phụ thuộc:** Antigravity IDE cài đặt trên máy người dùng.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - Cài đặt được VSIX vào Antigravity IDE.
  - Extension activate thành công, không có exception làm sập Extension Host.
  - Command Palette hiển thị và gọi được command.
  - WebviewView hiển thị được nội dung HTML/CSS.
  - `SecretStorage` ghi và đọc lại được chuỗi bí mật.
  - Workspace API đọc được thông tin file đang mở và text đang chọn.
- **Lệnh kiểm tra (Verification Commands):**
  ```bash
  npm run package:spike
  # Cài đặt file .vsix vào Antigravity IDE và thực thi kịch bản kiểm tra
  ```
- **Rủi ro (Risks):** R-01 (Antigravity IDE hạn chế API WebviewView hoặc SecretStorage). Nếu phát hiện lỗi, phải có giải pháp dự phòng trước khi làm M1.

---

## Cột Mốc M1: Project Foundation (Nền Tảng Dự Án)

- **Mục tiêu:** Thiết lập hoàn chỉnh cấu trúc TypeScript Monorepo, định nghĩa toàn bộ types dùng chung và hệ thống đóng gói build/test.
- **Sản phẩm bàn giao (Deliverables):**
  - Cấu hình workspace npm hoàn chỉnh cho `src/extension`, `src/worker`, `src/shared`.
  - Bộ API contracts, interfaces, error codes, constants trong `src/shared/`.
  - Cấu hình biên dịch `esbuild` cho extension.
  - Thiết lập test runner `Vitest`.
- **Yêu cầu SRS liên quan:** `NFR-PERF-001`, `SRS 10.1`, `SRS 10.2`.
- **Phụ thuộc:** M0 hoàn thành với kết luận Go.
- **Tiêu chí nghiệm thu:**
  - `npm run typecheck` vượt qua 100% không có lỗi type.
  - `npm test` chạy thành công bộ unit test mẫu.
  - Script build tạo ra file bundle hợp lệ trong `build/`.
- **Lệnh kiểm tra:**
  ```bash
  npm run typecheck
  npm test
  npm run build
  ```
- **Rủi ro:** Xung đột cấu hình `tsconfig` giữa runtime Node.js của Extension và Cloudflare Worker runtime.

---

## Cột Mốc M2: Cloudflare Backend MVP (Gateway & Workers AI)

- **Mục tiêu:** Xây dựng Worker API gateway hoàn chỉnh kết nối với Cloudflare Workers AI trên gói Free.
- **Sản phẩm bàn giao:**
  - Toàn bộ mã nguồn `src/worker/` (routes: `health`, `models`, `chat`).
  - Middleware xác thực Bearer token bằng `timingSafeEqual`.
  - Bộ kiểm tra tính hợp lệ của request (Schema validation, payload size limit 256 KiB).
  - Model router và System prompt builder bảo vệ máy chủ.
  - Adapter chuẩn hóa Server-Sent Events (SSE) và mã lỗi.
  - File cấu hình `wrangler.jsonc`.
- **Yêu cầu SRS liên quan:** `FR-040` đến `FR-051`, `NFR-SEC-004`, `NFR-SEC-005`, `NFR-SEC-010`, `NFR-SEC-011`.
- **Phụ thuộc:** M1 hoàn thành.
- **Tiêu chí nghiệm thu:**
  - Kiểm thử tích hợp với Miniflare cục bộ thành công.
  - Lệnh `curl` gọi được Worker test trên Cloudflare Free và nhận phản hồi từ `@cf/zai-org/glm-4.7-flash`.
  - Sai Bearer token trả về đúng HTTP 401.
  - Không có raw prompt/code trong console log của Worker.
- **Lệnh kiểm tra:**
  ```bash
  npm run test:worker
  npx wrangler dev --test-scheduled
  ```
- **Rủi ro:** R-02, R-03 (Hạn ngạch Workers AI Free bị thay đổi hoặc model hết capacity).

---

## Cột Mốc M3: Extension MVP (Giao Diện Chat & Tích Hợp)

- **Mục tiêu:** Hoàn thiện giao diện Chat Webview và kết nối với Worker backend.
- **Sản phẩm bàn giao:**
  - Mã nguồn Chat Webview (`ChatViewProvider.ts`, HTML/CSS).
  - Module `workerClient.ts` và `sseParser.ts`.
  - Quản lý cấu hình `apiBaseUrl` và lưu API key trong `SecretStorage`.
  - Các command: `openChat`, `configureConnection`, `checkConnection`.
  - Giao diện hiển thị Markdown, code block, nút Copy, nút Cancel (Stop).
- **Yêu cầu SRS liên quan:** `FR-004`, `FR-005`, `FR-006`, `FR-010` đến `FR-014`, `FR-060`, `FR-061`, `NFR-SEC-002`, `NFR-SEC-007`.
- **Phụ thuộc:** M0 (kết quả Webview/SecretStorage) và M2 (Worker API sẵn sàng).
- **Tiêu chí nghiệm thu:**
  - Người dùng nhập prompt và nhận được câu trả lời hiển thị liên tục (streaming) trong chat panel.
  - Bấm Stop ngắt kết nối thành công.
  - Trạng thái kết nối hiển thị rõ ràng.
- **Lệnh kiểm tra:**
  ```bash
  npm run test:extension
  npm run package:extension
  ```
- **Rủi ro:** R-08 (SSE chunk bị phân mảnh gây lỗi render UI).

---

## Cột Mốc M4: Context Engineering (Thu Thập & Lọc Ngữ Cảnh)

- **Mục tiêu:** Thu thập ngữ cảnh an toàn từ workspace, lọc dữ liệu nhạy cảm và kiểm soát ngân sách token.
- **Sản phẩm bàn giao:**
  - `contextCollector.ts`: Lấy nội dung selection và active file.
  - `contextFilter.ts`: Loại trừ file nhạy cảm theo danh sách exclude patterns mặc định.
  - `contextBudgeter.ts`: Giới hạn dung lượng (12k mặc định, hard cap 20k token).
  - `pathValidator.ts`: Ngăn chặn path traversal ra ngoài workspace root.
  - Giao diện Context Picker & Context Preview trong Chat UI.
- **Yêu cầu SRS liên quan:** `FR-020` đến `FR-029`, `NFR-SEC-008`, `NFR-PERF-004`, `NFR-PERF-006`.
- **Phụ thuộc:** M3 hoàn thành.
- **Tiêu chí nghiệm thu:**
  - Unit test xác nhận `.env`, file key, thư mục `node_modules/` không bao giờ bị đưa vào context.
  - Gửi context vượt 20k token bị cắt gọt an toàn kèm thông báo.
  - File ngoài workspace bị từ chối 100%.
- **Lệnh kiểm tra:**
  ```bash
  npm run test:context
  ```
- **Rủi ro:** R-04, R-10 (Rò rỉ dữ liệu nhạy cảm hoặc cắt cụt context làm model thiếu thông tin).

---

## Cột Mốc M5: Safe Code Assistance (Hỗ Trợ Lập Trình An Toàn)

- **Mục tiêu:** Hiện thực hóa các tính năng Giải thích code, Sửa code trực quan bằng Diff Preview và Sinh kiểm thử.
- **Sản phẩm bàn giao:**
  - Commands: `explainSelection`, `fixSelection`, `generateTests`.
  - Module `patchParser.ts` phân tích định dạng patch đề xuất.
  - Giao diện Diff Preview với nút Apply và Reject độc lập.
  - Module `staleProtection.ts` kiểm tra hash/version của file trên đĩa trước khi Apply.
- **Yêu cầu SRS liên quan:** `FR-030` đến `FR-037`, `NFR-SEC-008`, `NFR-SEC-009`.
- **Phụ thuộc:** M4 hoàn thành.
- **Tiêu chí nghiệm thu:**
  - Thao tác Fix Code không bao giờ tự ý ghi file trực tiếp.
  - Người dùng bấm Reject: file giữ nguyên 100%.
  - Người dùng bấm Apply: file được cập nhật chính xác nếu nội dung trên đĩa chưa bị đổi; nếu file đã bị đổi ngầm, báo lỗi và yêu cầu tạo lại diff.
  - Generate Tests chỉ xuất code đề xuất, không tự động chạy command.
- **Lệnh kiểm tra:**
  ```bash
  npm run test:diff
  ```
- **Rủi ro:** R-05, R-07 (Model sinh patch sai hoặc prompt injection).

---

## Cột Mốc M6: Quality, Packaging & Release (Đóng Gói & Phát Hành)

- **Mục tiêu:** Kiểm thử toàn diện, đóng gói bản phát hành VSIX chính thức và hoàn thiện hồ sơ tài liệu.
- **Sản phẩm bàn giao:**
  - File đóng gói hoàn chỉnh `nescode-antigravity-0.1.0.vsix`.
  - Bộ tài liệu: `README.md`, `DEPLOYMENT.md`, `SECURITY.md`, `DEVELOPMENT_SETUP.md`.
  - Báo cáo đánh giá bảo mật (Security audit) và bảng nghiệm thu checklist SRS 13.4.
- **Yêu cầu SRS liên quan:** Toàn bộ checklist mục 13.4 và 19 (Release Checklist).
- **Phụ thuộc:** Toàn bộ M0 - M5 hoàn thành.
- **Tiêu chí nghiệm thu:**
  - Cài đặt bản VSIX mới trên máy sạch thành công.
  - Làm theo tài liệu DEPLOYMENT.md triển khai Worker thành công từ đầu đến cuối mà không có lỗi.
  - Vượt qua toàn bộ checklist nghiệm thu mục 13.4.
- **Lệnh kiểm tra:**
  ```bash
  npm run test:all
  npm run package:extension
  ```
- **Rủi ro:** Hướng dẫn triển khai thiếu rõ ràng khiến người dùng không tự cấu hình được.
