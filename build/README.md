# Thư Mục Tạo Phẩm Biên Dịch (Build Artifacts)

Thư mục `build/` được dành riêng để chứa các sản phẩm đầu ra được sinh ra tự động trong quá trình biên dịch, đóng gói hoặc kiểm thử của dự án **NesCode for Antigravity**.

---

## 1. Các Loại Tạo Phẩm Được Chứa Tại Đây
- Mã nguồn tiện ích mở rộng đã được bundle qua `esbuild` (ví dụ: `build/extension/index.js`).
- File gói cài đặt tiện ích mở rộng (`*.vsix`).
- Báo cáo kết quả kiểm thử tự động (Test reports, coverage reports).
- Báo cáo phân tích tương thích (`docs/COMPATIBILITY.md` hoặc raw spike artifacts).

---

## 2. Quy Tắc Quản Trị Thư Mục Build
- **Không chứa mã nguồn gốc:** Mã nguồn chỉ nằm trong `src/` và `tests/`.
- **Không commit tạo phẩm lên Git:** Toàn bộ nội dung trong thư mục này (ngoại trừ file `.gitkeep` và `README.md`) đều bị bỏ qua bởi `.gitignore`.
- **Làm sạch dễ dàng (Cleanable):** Thư mục này có thể bị xóa toàn bộ bất kỳ lúc nào mà không làm ảnh hưởng đến mã nguồn dự án.
