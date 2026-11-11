# Thư Mục Tập Lệnh Tự Động Hóa (Automation Scripts)

Thư mục này chứa các kịch bản trợ giúp (helper scripts) cho quá trình phát triển, kiểm thử và đóng gói tiện ích mở rộng NesCode for Antigravity.

---

## 1. Các Tập Lệnh Dự Kiến
- `build-extension.mjs`: Script cấu hình `esbuild` biên dịch mã nguồn extension.
- `package-vsix.mjs`: Script gọi `@vscode/vsce` để đóng gói extension thành file `.vsix` trong thư mục `build/`.
- `verify-setup.mjs`: Script kiểm tra tính toàn vẹn của cấu trúc thư mục, rules và tài liệu trước khi commit.

---

## 2. Quy Tắc Vận Hành Scripts
- Các script phải viết bằng JavaScript/TypeScript hiện đại (ES Modules) hoặc PowerShell tương thích đa nền tảng.
- Không tạo các script giả mạo luôn trả về thành công (fake success scripts).
- Không thực hiện các hành động phá hoại, xóa file ngoài phạm vi, hoặc tự ý deploy khi chưa có sự xác nhận của người dùng.
