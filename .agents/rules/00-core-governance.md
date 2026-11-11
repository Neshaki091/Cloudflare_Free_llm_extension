---
trigger: always_on
---

# Quy Tắc Quản Trị Cốt Lõi (Core Governance)

Quy tắc này áp dụng vô điều kiện cho mọi hành động của Agent trong toàn bộ dự án NesCode for Antigravity.

## 1. Tuân Thủ AGENTS.md và SRS
- `AGENTS.md` là chỉ dẫn vận hành cao nhất. Mọi kế hoạch hoặc mã nguồn phải đối chiếu với các nguyên tắc trong `AGENTS.md`.
- `journal/requirements/SRS.md` là nguồn đặc tả yêu cầu duy nhất. Không tự ý thêm bớt tính năng ngoài phạm vi SRS khi chưa có yêu cầu từ người dùng.

## 2. Bảo Tồn Thành Quả và Mã Nguồn Hiện Hữu
- Tuyệt đối không xóa mã nguồn hiện hữu trừ khi nhiệm vụ yêu cầu thay thế hoặc tái cấu trúc có chủ đích.
- Tôn trọng và bảo tồn các chỉnh sửa thủ công của người dùng. Không bao giờ ghi đè file mà không kiểm tra nội dung trước đó.

## 3. Không Tái Cấu Trúc Ngoài Phạm Vi (No Unrelated Refactoring)
- Chỉ tập trung sửa đổi các file và chức năng thuộc phạm vi nhiệm vụ được giao.
- Không tự ý định dạng lại mã nguồn diện rộng (format toàn bộ repo) hoặc đổi tên biến/hàm ở các module không liên quan.

## 4. Báo Cáo Chướng Ngại Vật Trung Thực (Honest Reporting)
- Khi gặp lỗi phụ thuộc bên ngoài, thiếu cấu hình, hoặc API chưa tương thích, phải ghi nhận trạng thái `BLOCKED` và báo cáo rõ nguyên nhân.
- Không che giấu lỗi, không đưa ra giả định chủ quan rằng hệ thống đã hoạt động mà chưa kiểm tra.

## 5. Quy Chuẩn Đánh Dấu Hoàn Thành
- Không bao giờ đánh dấu một task là `DONE` chỉ vì các file vừa được tạo ra.
- Nhiệm vụ chỉ hoàn thành khi có bằng chứng xác minh cụ thể (lệnh kiểm thử, kết quả typecheck, log kiểm tra thực tế).
