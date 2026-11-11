# Bản Ghi Quyết Định Kiến Trúc (Architecture Decision Records — ADR)

Thư mục này lưu trữ các quyết định kiến trúc quan trọng có ảnh hưởng lâu dài tới thiết kế, tính bảo mật, cấu trúc phụ thuộc hoặc tính khả chuyển của dự án **NesCode for Antigravity**.

---

## Nguyên Tắc Ghi Nhận ADR
1. **Chỉ ghi nhận quyết định trọng yếu:** Không tạo ADR cho các thay đổi mã nguồn nhỏ lẻ hoặc lựa chọn thư viện hiển nhiên. Chỉ tạo khi quyết định ảnh hưởng đến kiến trúc, ranh giới module, mô hình bảo mật hoặc giao tiếp hệ thống.
2. **Tuân thủ mẫu chuẩn:** Sử dụng file `ADR_TEMPLATE.md` làm khung định dạng chuẩn.
3. **Tính bất biến của lịch sử:** Một ADR đã được chấp thuận (`Accepted`) không bao giờ bị xóa. Nếu có quyết định mới thay thế, đổi trạng thái thành `Superseded` và dẫn link tới ADR mới.

---

## Danh Sách Các Quyết Định Kiến Trúc

| Mã | Tiêu Đề Quyết Định | Ngày | Trạng Thái |
|---|---|---|---|
| [ADR-001](./ADR-001-byo-worker-architecture.md) | Kiến trúc Bring Your Own Cloudflare Worker (BYO Worker) trên Tầng Miễn Phí | 2026-11-11 | Accepted |
