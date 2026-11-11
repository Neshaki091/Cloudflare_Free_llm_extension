# Bối Cảnh Dự Án (Project Context)

- **Ngày cập nhật gần nhất:** 2026-11-11
- **Trạng thái:** Verified (Đã xác minh theo `SRS.md`)
- **Nguồn thông tin:** `journal/requirements/SRS.md` v1.0.0

---

## 1. Tuyên Bố Sản Phẩm (Product Vision)
**NesCode for Antigravity** là một tiện ích mở rộng (extension) trợ lý lập trình thông minh chạy trong môi trường Antigravity IDE. Sản phẩm cho phép lập trình viên tận dụng năng lực suy luận của các mô hình AI lớn (LLM) thông qua dịch vụ Cloudflare Workers AI trên tầng miễn phí (Cloudflare Free Tier), mà không phải chịu chi phí duy trì server hay trả phí API định kỳ cho các nền tảng thương mại.

## 2. Đối Tượng Người Dùng
- **Lập trình viên cá nhân:** Cần công cụ giải thích code, sửa lỗi trực quan bằng Diff Preview, sinh unit test tự động mà không muốn lộ toàn bộ repo ra ngoài.
- **Maintainer / Người triển khai:** Có tài khoản Cloudflare Free, muốn tự vận hành backend Worker an toàn và kiểm soát toàn bộ lưu lượng dữ liệu (BYO Worker).

## 3. Mô Hình Vận Hành (Operating Model)
- **Bring Your Own Cloudflare Worker (BYO Worker):**
  - Tác giả extension không vận hành một SaaS backend tập trung để chia sẻ chung cho cộng đồng (tránh chi phí phát sinh và rủi ro quyền riêng tư).
  - Mỗi người dùng tự triển khai Cloudflare Worker trên tài khoản Cloudflare của chính họ thông qua mã nguồn có sẵn trong dự án.
  - Extension kết nối trực tiếp tới Worker URL của người dùng thông qua giao thức HTTPS bảo mật bằng Bearer API Key.

## 4. Phạm Vi Chức Năng MVP (MVP Scope - v0.1.x)
- Chat tự do với mô hình AI trong panel Webview tích hợp trong IDE.
- Giải thích đoạn mã được chọn (Explain Selection) và giải thích file đang mở (Explain Active File).
- Đề xuất sửa lỗi mã nguồn (Fix Code) và hiển thị xem trước khác biệt (Diff Preview) với hai nút thao tác: Áp dụng (Apply) và Từ chối (Reject).
- Sinh kiểm thử đơn vị (Generate Tests) dưới dạng code proposal.
- Thu thập ngữ cảnh có kiểm soát (Workspace Context Collection) từ selection, active file và file người dùng chọn thủ công.
- Lọc bỏ file bí mật (Secret Filtering) và kiểm soát ngân sách token (Context Budgeting).
- Tích hợp kiểm tra trạng thái kết nối, mã lỗi Quota, và ước lượng mức tiêu thụ tài nguyên.

## 5. Ngoài Phạm Vi MVP (Non-Goals)
- Không có Agent tự động sửa nhiều file đồng thời mà không qua phê duyệt của người dùng.
- Không tự động thực thi các câu lệnh terminal/shell do AI sinh ra.
- Không tự động commit hoặc push Git.
- Không sao lưu mã nguồn của người dùng lên Cloudflare bền vững (D1, KV, R2).
- Không xây dựng hệ thống tài khoản SaaS đa người dùng, thanh toán hoặc gộp hạn ngạch.
- Không lập chỉ mục ngữ nghĩa toàn bộ dự án (Semantic Index / RAG / Vector DB) trong MVP.
