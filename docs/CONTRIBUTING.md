# Quy Chuẩn Đóng Góp và Phát Triển (Contributing Guide)

- **Sản phẩm:** NesCode for Antigravity
- **Phiên bản:** 1.0.0
- **Ngày cập nhật:** 2026-11-11

Tất cả lập trình viên và các AI Agent tham gia phát triển dự án **NesCode for Antigravity** bắt buộc phải tuân thủ quy trình đóng góp dưới đây để đảm bảo chất lượng và tính nhất quán cao nhất.

---

## 1. Quy Trình Nhận và Hoàn Thành Công Việc (Task Lifecycle)

Mỗi công việc kỹ thuật phải được theo dõi trên `journal/tasks/TASK_BOARD.md` theo chu trình:

```text
[TODO] ──> [IN_PROGRESS] ──> [IN_REVIEW / VERIFIED] ──> [DONE]
                │
                └──> [BLOCKED] (Khi gặp trở ngại phụ thuộc bên ngoài)
```

1. **Nhận việc:** Chỉ làm việc trên một task cụ thể tại một thời điểm. Chuyển trạng thái task sang `IN_PROGRESS`.
2. **Đối chiếu yêu cầu:** Đọc kỹ Requirement ID tương ứng trong `journal/requirements/SRS.md` và các quy tắc liên quan trong `.agents/rules/`.
3. **Phát triển & Viết Test:** Thực hiện thay đổi nhỏ, viết kèm Unit Test hoặc Integration Test tương ứng.
4. **Kiểm tra chất lượng (Verification):**
   - Chạy kiểm tra kiểu: `npm run typecheck`.
   - Chạy bộ kiểm thử: `npm test`.
5. **Cập nhật tài liệu:** Cập nhật `REQUIREMENT_TRACEABILITY.md`, ghi lại quyết định mới vào `journal/decisions/` nếu có, cập nhật `CURRENT_STATE.md`.
6. **Đánh dấu hoàn thành:** Chỉ chuyển sang `DONE` khi có bằng chứng xác minh cụ thể (lệnh đã chạy, kết quả test thực tế). Chuyển thông tin task sang `journal/tasks/COMPLETED_TASKS.md`.

---

## 2. Quy Chuẩn Ngôn Ngữ và Đặt Tên (Language & Naming Policy)

- **Tài liệu & Giao diện:** Bắt buộc viết bằng **Tiếng Việt**.
- **Mã nguồn:** Giữ tiếng Anh chuẩn cho định danh kỹ thuật (tên biến, hàm, class, interface, type, file, thư mục, Git branch, commit message).
- **Quy ước đặt tên mã nguồn:**
  - File: `camelCase.ts` hoặc `kebab-case.ts`.
  - Class, Interface, Type: `PascalCase`.
  - Function, Variable: `camelCase`.
  - Constant: `UPPER_SNAKE_CASE`.

---

## 3. Quy Chuẩn Viết Nhật Ký Phiên Làm Việc (Session Journaling)

Sau mỗi phiên làm việc có thay đổi kỹ thuật đáng kể, lập trình viên/Agent phải tạo một file nhật ký trong `journal/sessions/YYYY-MM-DD-ten-phien.md` theo đúng mẫu `SESSION_TEMPLATE.md`, ghi nhận:
- Mục tiêu phiên làm việc.
- Các file đã thay đổi.
- Các lệnh kiểm thử đã chạy kèm kết quả thực tế.
- Các trở ngại gặp phải và quyết định kỹ thuật đã đưa ra.
- Nhiệm vụ hành động tiếp theo.

---

## 4. Quy Trình Đánh Giá Mã Nguồn (Code Review Gates)

Một pull request hoặc phiên làm việc chỉ được phê duyệt khi đáp ứng:
- [ ] Không chứa bất kỳ API key, token thật hoặc mật khẩu nào.
- [ ] TypeScript strict mode vượt qua không có lỗi (`noImplicitAny`, không lạm dụng `any`).
- [ ] Các bài kiểm thử liên quan chạy thành công 100%.
- [ ] Mọi đường dẫn file xử lý qua bộ xác thực an toàn `pathValidator`.
- [ ] Văn bản giao diện hiển thị cho người dùng hoàn toàn bằng Tiếng Việt.
- [ ] Báo cáo kiểm thử trung thực, không giả tạo kết quả.
