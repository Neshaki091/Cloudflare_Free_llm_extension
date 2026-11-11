# AGENTS.md — Quy Chuẩn Dành Cho AI Agent (NesCode for Antigravity)

Tài liệu này là chỉ dẫn vận hành cao nhất và luôn có hiệu lực cho tất cả các AI Agent tham gia phát triển, bảo trì, hoặc kiểm thử trong kho mã nguồn **NesCode for Antigravity**.

---

## 1. Định Danh Dự Án (Project Identity)

- **Tên sản phẩm:** NesCode for Antigravity
- **Kho lưu trữ (Repository):** `nescode-antigravity`
- **Mục đích:** Tiện ích mở rộng (extension) trợ lý lập trình trí tuệ nhân tạo (AI Coding Assistant) tích hợp trực tiếp trong Antigravity IDE, hoạt động theo mô hình Bring Your Own Cloudflare Worker (BYO Worker).
- **Vị trí SRS chuẩn:** `journal/requirements/SRS.md`
- **Ngăn xếp công nghệ cốt lõi:**
  - Ngôn ngữ: TypeScript (Strict mode).
  - Nền tảng Extension: Antigravity IDE (dựa trên VS Code Extension API công khai).
  - Nền tảng Backend: Cloudflare Workers (Serverless Edge Runtime).
  - Dịch vụ AI Inference: Cloudflare Workers AI.
  - Mô hình AI mặc định: `@cf/zai-org/glm-4.7-flash`.
  - Quản lý gói: npm / npm workspaces.
- **Cột mốc hiện tại (Current Milestone):** `M0 — Compatibility Spike` (Kiểm chứng tính tương thích của Antigravity IDE).
- **Trạng thái thực tế:** Đã hoàn thành cấu trúc khung dự án (Project Setup); chưa triển khai mã nguồn chức năng sản phẩm.

---

## 2. Thứ Tự Ưu Tiên Nguồn Chân Lý (Source of Truth Priority)

Khi xuất hiện xung đột thông tin giữa các tài liệu hoặc hướng dẫn, Agent bắt buộc phải tuân thủ thứ tự ưu tiên giảm dần sau:

1. **Chỉ dẫn trực tiếp và tường minh của người dùng** trong phiên làm việc hiện tại.
2. **Đặc tả yêu cầu phần mềm:** `journal/requirements/SRS.md`.
3. **Các quyết định kiến trúc đã được phê duyệt (Approved ADRs):** nằm trong `journal/decisions/`.
4. **Mã nguồn thực tế và kết quả kiểm thử đã được xác minh (Verified Tests).**
5. **Bảng công việc (`journal/tasks/TASK_BOARD.md`) và Lộ trình (`journal/planning/ROADMAP.md`).**
6. **Bộ nhớ dự án dài hạn đã được tuyển chọn (`memory/`).**
7. **Nhật ký phiên làm việc (`journal/sessions/`) và các ghi chú lịch sử.**

*Lưu ý cốt lõi:* Một ghi chép lịch sử trong journal không bao giờ có quyền ghi đè một yêu cầu trong SRS hoặc một quyết định kiến trúc trong ADR.

---

## 3. Chính Sách Ngôn Ngữ Bắt Buộc (Language Policy)

**Ngôn ngữ chính thức của dự án là TIẾNG VIỆT.**

1. **Tài liệu & Giao tiếp:** Bắt buộc viết bằng tiếng Việt cho toàn bộ tài liệu (`AGENTS.md`, `.agents/rules/`, `memory/`, `journal/`, `docs/`, `README.md`), task board, thông báo lỗi, giải thích kỹ thuật và các phản hồi tới người dùng.
2. **Mã nguồn & Kỹ thuật:** Giữ tiếng Anh chuẩn cho định danh kỹ thuật (tên file, tên thư mục, biến, hàm, class, interface, type, API endpoint, JSON schema, commit message, branch).
3. **Thuật ngữ chuyên ngành:** Giữ tiếng Anh nếu dịch làm giảm tính chuẩn xác, nhưng ưu tiên giải thích bằng tiếng Việt ở lần đầu xuất hiện (ví dụ: *Context Engineering - Kỹ thuật xây dựng ngữ cảnh*, *Bring Your Own Worker - Tự triển khai Cloudflare Worker*). Không dịch tên công nghệ (Cloudflare, TypeScript, Antigravity, Wrangler).
4. **Giao diện người dùng:** Mọi văn bản hiển thị (nút bấm, menu, thông báo lỗi, diff preview) phải bằng tiếng Việt.

---

## 4. Hành Vi Làm Việc Của Agent (Working Behavior)

Mỗi Agent khi nhận nhiệm vụ phải thực hiện theo quy trình nghiêm ngặt:

1. **Đọc luật và yêu cầu trước khi chỉnh sửa:** Luôn kiểm tra các file quy tắc liên quan trong `.agents/rules/` và đọc kỹ yêu cầu SRS tương ứng với task.
2. **Khảo sát trước khi tạo mới:** Kiểm tra mã nguồn, cấu hình và bài kiểm thử hiện có trước khi viết mã mới. Không bao giờ giả định môi trường hoặc API mà không kiểm chứng.
3. **Tập trung vào phạm vi được giao:** Chỉ thực hiện đúng nhiệm vụ được yêu cầu; không tự ý refactor các module không liên quan; không thêm các thư viện bên ngoài khi chưa có lý do xác đáng.
4. **Thay đổi nhỏ, có thể kiểm chứng (Small & Testable):** Chia nhỏ công việc, viết test kèm theo, đảm bảo code compile được và vượt qua kiểm tra kiểu dữ liệu (typecheck).
5. **Cập nhật tài liệu đồng bộ:** Khi thay đổi kiến trúc hoặc giao diện API, phải cập nhật tài liệu kiến trúc, memory và requirement traceability tương ứng.
6. **Ghi chép trung thực:**
   - Cập nhật tiến độ trên `journal/tasks/TASK_BOARD.md`.
   - Ghi lại các quyết định quan trọng thành ADR.
   - Báo cáo kết quả kiểm chứng thực tế (`PASS`, `FAIL`, `BLOCKED`, `NOT RUN`). Không được giả mạo kết quả hoặc tuyên bố hoàn thành khi chưa kiểm thử.

---

## 5. Các Điều Cấm Kỵ Tuyệt Đối (Development Restrictions)

- **Không lưu bí mật (Secrets):** Tuyệt đối không đưa API Key, Token, mật khẩu vào mã nguồn, file cấu hình được commit, hoặc bản log.
- **Không nhúng Cloudflare Account API Token vào Extension:** Extension chỉ lưu trữ Worker Bearer API Key vào `SecretStorage` của IDE. Token cấp tài khoản Cloudflare chỉ được dùng cục bộ khi deploy Worker qua Wrangler.
- **Không tự động tải mã nguồn lên ngoài ý muốn:** Mọi context gửi đến Cloudflare Worker phải thông qua bộ lọc bảo mật (Secret Filter), kiểm soát ngân sách (Budgeter) và có sự xác nhận/opt-in từ người dùng.
- **Không tự ý thực thi lệnh Shell do LLM sinh ra:** Extension không tự động chạy command trong terminal của người dùng nếu chưa có sự phê duyệt tường minh.
- **Không tự ý ghi đè file ngoài ý muốn:** Thay đổi mã nguồn từ AI phải hiển thị qua Diff Preview; người dùng bấm Áp dụng (Apply) mới được ghi vào đĩa sau khi đã kiểm tra tính toàn vẹn (stale document protection).
- **Không sử dụng API nội bộ không công khai:** Chỉ sử dụng các API công khai của VS Code Extension API mà Antigravity IDE hỗ trợ.
- **Không phụ thuộc vào dịch vụ trả phí:** Toàn bộ kiến trúc MVP phải vận hành hoàn toàn trên tầng miễn phí (Cloudflare Workers Free & Workers AI Free tier). Không bắt buộc dùng D1, KV, R2, Vectorize trừ khi có yêu cầu riêng.
- **Không phá vỡ cấu trúc workspace:** Không khởi tạo repo Git lồng nhau bên trong thư mục con; không sửa đổi file nằm ngoài thư mục gốc của repository.

---

## 6. Tiêu Chuẩn Hoàn Thành Nhiệm Vụ (Task Completion Policy / Definition of Done)

Một task chỉ được đánh dấu là `DONE` trên Task Board khi thỏa mãn toàn bộ các điều kiện:

1. **Mã nguồn hoàn chỉnh:** Đã lập trình đầy đủ chức năng theo tiêu chí chấp nhận (Acceptance Criteria).
2. **Kiểm tra kiểu dữ liệu (Typecheck):** Lệnh kiểm tra kiểu TypeScript vượt qua không có lỗi.
3. **Kiểm thử tự động (Unit / Integration Tests):** Các bài kiểm thử liên quan chạy thành công.
4. **Không tồn đọng lỗi nghiêm trọng:** Không có lỗi chưa được xử lý làm sập runtime hoặc vi phạm bảo mật.
5. **Cập nhật tài liệu:** SRS Traceability, Memory, và tài liệu liên quan đã được đồng bộ.
6. **Bằng chứng xác thực (Verification Evidence):** Báo cáo phiên làm việc phải ghi lại lệnh kiểm thử và kết quả đầu ra thực tế.

Nếu có trở ngại bên ngoài ngăn cản việc kiểm thử (ví dụ: thiếu thông tin xác thực, host IDE chưa hỗ trợ API), Agent phải chuyển trạng thái task sang `BLOCKED` và giải thích nguyên nhân rõ ràng, tuyệt đối không được đánh dấu `DONE` giả tạo.
