---
trigger: always_on
---

# Quy Chuẩn An Toàn và Quyền Riêng Tư (Security & Privacy)

Bảo mật mã nguồn của người dùng và bảo vệ bí mật xác thực là yêu cầu sống còn của NesCode for Antigravity. Quy tắc này có hiệu lực thường trực và bắt buộc tuân thủ.

## 1. Quản Lý Bí Mật Xác Thực (Credentials & Secret Management)
- **Lưu trữ API Key trên Extension:** Khóa xác thực backend Worker (`NESCODE_API_KEY`) bắt buộc phải lưu trong `SecretStorage` do IDE cung cấp. Tuyệt đối không lưu vào `settings.json`, `globalState`, hay workspace configuration.
- **Không nhúng Cloudflare Account Token:** Extension tuyệt đối không yêu cầu hoặc lưu trữ `CLOUDFLARE_API_TOKEN` hay Account Global Key. Token này chỉ dùng khi người dùng deploy Worker qua CLI tại máy cục bộ.
- **Worker Secret:** Khóa bí mật trên Cloudflare Worker chỉ được thiết lập qua cơ chế bí mật an toàn (`wrangler secret put NESCODE_API_KEY`), không ghi đè vào file code hoặc `wrangler.jsonc`.

## 2. Bảo Vệ Dữ Liệu và Quyền Riêng Tư (Privacy & Context Protection)
- **Không tự ý quét toàn bộ dự án:** Mặc định chỉ thu thập context từ đoạn mã đang chọn (selection), file đang mở (active file), hoặc file được người dùng chọn rõ ràng qua Context Picker. Không tự động quét đệ quy thư mục workspace.
- **Bộ lọc file nhạy cảm (Secret & Exclude Filter):** Luôn loại trừ các file bí mật (`.env`, `*.pem`, `*.key`, `*credentials*`, `*secret*`, `~/.ssh/`, `~/.aws/`) và các thư mục phụ thuộc (`node_modules/`, `.git/`, `dist/`, `build/`, `venv/`).
- **Ngân sách Context (Context Budget):** Giới hạn tối đa kích thước context gửi đi (mặc định 12.000 token ước lượng; chặn cứng tại 20.000 token) để tránh rò rỉ dữ liệu lớn và vượt quota.
- **Chống đọc file trái phép (Path Traversal Prevention):** Mọi đường dẫn file đưa vào context hoặc áp dụng patch phải được chuẩn hóa (canonical relative path) và xác thực chặt chẽ nằm trọn trong workspace root. Từ chối mọi đường dẫn chứa `../` hoặc đường dẫn tuyệt đối ra ngoài workspace.

## 3. Không Ghi Nhật Ký Dữ Liệu Nhạy Cảm (Safe Logging)
- Không bao giờ ghi giá trị `Authorization` header, API key, nội dung prompt, mã nguồn người dùng, hoặc raw response vào console log hoặc file log.
- Chỉ log metadata cần thiết cho chẩn đoán: timestamp, requestId, status code, duration, errorCode.

## 4. Kiểm Soát Thay Đổi Mã Nguồn (Code Modification Controls)
- **Cơ chế Phê Duyệt Bắt Buộc (Approval Gate):** AI không bao giờ được phép tự động ghi đè file trên đĩa mà không có sự đồng ý của người dùng. Mọi sửa đổi phải được trình bày dưới dạng Diff Preview để người dùng bấm Áp dụng (Apply) hoặc Từ chối (Reject).
- **Bảo vệ nội dung file cũ (Stale Document Protection):** Trước khi áp dụng patch, phải kiểm tra phiên bản hoặc hash nội dung file trên đĩa. Nếu file đã bị chỉnh sửa từ lúc AI sinh diff, phải yêu cầu tạo lại diff mới để tránh ghi đè mất mát mã nguồn.

## 5. Chặn Lệnh Shell Nguy Hiểm (No Shell Execution)
- Không tự động thực thi các câu lệnh terminal hoặc shell script do mô hình AI gợi ý.
- Nếu mô hình đề xuất lệnh chạy test (trong chế độ Generate Tests), chỉ hiển thị dưới dạng văn bản gợi ý để người dùng tự quyết định chạy.
