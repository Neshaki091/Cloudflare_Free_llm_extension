# Hệ Thống Bộ Nhớ Dự Án (Project Memory System)

Thư mục `memory/` là nơi lưu trữ tri thức dài hạn đã qua tuyển chọn của dự án **NesCode for Antigravity**. Mục tiêu là giúp các AI Agent nhanh chóng nắm bắt bức tranh toàn cảnh mà không cần quét lại toàn bộ repository hay đọc hàng loạt file nhật ký cũ.

---

## 1. Danh Sách Các Tài Liệu Bộ Nhớ

| Tệp | Trách Nhiệm Chính |
|---|---|
| `PROJECT_CONTEXT.md` | Mục đích sản phẩm, đối tượng người dùng, phạm vi MVP và ranh giới hệ thống. |
| `ARCHITECTURE_CONTEXT.md` | Bức tranh kiến trúc đã xác minh, mối quan hệ giữa Extension, Worker và Shared. |
| `TECH_STACK.md` | Ngôn ngữ, framework, phiên bản công cụ, môi trường thực thi và build tooling. |
| `ENGINEERING_CONSTRAINTS.md` | Các ràng buộc kỹ thuật cốt lõi: bảo mật, Cloudflare Free tier, giới hạn context và chi phí. |
| `CURRENT_STATE.md` | Trạng thái cột mốc hiện tại, tiến độ các module và nhiệm vụ kế tiếp cần thực hiện. |
| `KNOWN_ISSUES.md` | Các hạn chế kỹ thuật đã biết, bug chưa giải quyết và các rào cản phụ thuộc. |
| `archive/` | Nơi lưu trữ các tài liệu bộ nhớ cũ đã bị thay thế hoặc không còn phản ánh đúng hiện trạng. |

---

## 2. Nguyên Tắc Quản Trị Bộ Nhớ (Memory Governance)

1. **Chỉ ghi nhận tri thức bền vững:** Không cập nhật bộ nhớ cho các thay đổi mã nguồn nhỏ lẻ hoặc mang tính tạm thời.
2. **Phân định rõ ràng Sự Thật và Giả Định:**
   - **Đã xác minh (Verified Fact):** Thông tin đã được kiểm chứng thực tế qua code, test hoặc tài liệu chính thức.
   - **Đề xuất / Giả định (Proposed / Assumption):** Thiết kế đang chờ kiểm chứng (ví dụ: khả năng tương thích của Antigravity IDE trong Milestone M0).
   - **Chưa giải quyết (Unresolved):** Vấn đề đang chờ phương án xử lý.
3. **Tuyệt đối không lưu bí mật:** Không bao giờ đưa API key, token, mật khẩu, dữ liệu cá nhân hay toàn bộ nội dung file mã nguồn vào memory.
4. **Không biến memory thành task board:** Tiến độ chi tiết từng task thuộc về `journal/tasks/TASK_BOARD.md`. `CURRENT_STATE.md` chỉ ghi nhận ngắn gọn trạng thái mức cao và hành động kế tiếp.
5. **Lưu trữ lịch sử:** Khi một quyết định kiến trúc bị thay thế, chuyển nội dung cũ vào `memory/archive/` kèm lý do thay vì xóa bỏ âm thầm.
