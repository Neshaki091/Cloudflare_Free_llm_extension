# Tiêu Chuẩn Nghiệm Thu Thành Công (Success Criteria)

- **Ngày cập nhật:** 2026-11-11
- **Nguồn thông tin:** `journal/requirements/SRS.md` mục 5.3, 13.3 và 13.4

Toàn bộ các tiêu chí dưới đây được trích xuất trực tiếp từ SRS, có thể đo lường và kiểm chứng khách quan. Không tự ý sáng tạo các chỉ số phi thực tế.

---

## 1. Tiêu Chuẩn Tương Thích Nền Tảng (Milestone M0 Gates)

| Mã | Tiêu Chí Kiểm Chứng | Phương Pháp Đo Lường | Kết Quả Kỳ Vọng |
|---|---|---|---|
| **SC-01** | Cài đặt VSIX vào Antigravity IDE | Cài gói `.vsix` thực tế qua Command Palette hoặc Extensions View | Extension xuất hiện trong danh sách Installed Extensions, không có lỗi nạp gói |
| **SC-02** | Kích hoạt Extension (Activation) | Mở một workspace và chạy lệnh `nescode.openChat` | Hàm `activate()` chạy thành công, không có exception chặn Extension Host |
| **SC-03** | Đăng ký & thực thi Commands | Gọi các lệnh `nescode.*` từ Command Palette | IDE nhận diện và gọi được toàn bộ các lệnh đã khai báo |
| **SC-04** | Hiển thị WebviewView | Mở Chat Panel từ thanh bên (Activity Bar) | Webview khởi tạo thành công, nạp được HTML/CSS nội bộ, không vi phạm CSP |
| **SC-05** | Đọc/Ghi SecretStorage | Thực hiện lưu trữ và đọc lại Worker API Key | Dữ liệu được mã hóa bởi IDE, tồn tại qua các lần khởi động lại IDE, không rò rỉ vào `settings.json` |
| **SC-06** | Đọc Workspace Editor State | Đọc đường dẫn file đang mở và đoạn text đang chọn | Trả về đúng relative path, ngôn ngữ và chuỗi ký tự được bôi đen |

---

## 2. Tiêu Chuẩn Hiệu Năng & Quota (Performance & Constraints)

| Mã | Chỉ Tiêu | Giá Trị Mục Tiêu Đo Được | Cơ Sở Xác Thực |
|---|---|---|---|
| **SC-07** | Thời gian kích hoạt Extension | Không thực hiện network call blocking trong `activate()` | NFR-PERF-001 |
| **SC-08** | Thời gian hiển thị Chat Panel | Dưới 1 giây sau khi gọi command trên workspace thông thường (không tính cold start host) | NFR-PERF-002 |
| **SC-09** | Kích thước Context tối đa | Mặc định không vượt quá 12.000 token ước lượng; chặn cứng tại 20.000 token | NFR-PERF-004 |
| **SC-10** | Kích thước Output tối đa | Giới hạn mặc định tối đa 1.500 token | NFR-PERF-005 |
| **SC-11** | Dung lượng Request Body HTTP | Tối đa 256 KiB (`MAX_BODY_BYTES`) | SRS mục 7.1 |
| **SC-12** | Thời gian chờ mạng (Timeout) | Kết nối: 10 giây; Inference: tối đa 120 giây (có thể hủy bằng AbortSignal) | SRS mục 5.4 |

---

## 3. Tiêu Chuẩn Bảo Mật & Toàn Vẹn Mã Nguồn (Security & Integrity)

| Mã | Tiêu Chí | Kiểm Tra |
|---|---|---|
| **SC-13** | Không rò rỉ Secret trong Git | Quét git history không chứa bất kỳ API key, token hay file `.env` thật |
| **SC-14** | Lọc file nhạy cảm | Bộ lọc `contextFilter` loại bỏ 100% các file khớp danh sách exclude mặc định |
| **SC-15** | Chặn Path Traversal | Bất kỳ path nào chứa `../` hoặc nằm ngoài workspace root đều bị từ chối với lỗi an toàn |
| **SC-16** | Không tự động ghi file (Human Approval) | Thao tác Fix Code chỉ tạo Diff Preview; file gốc chỉ thay đổi khi người dùng bấm nút Áp dụng (Apply) |
| **SC-17** | Bảo vệ file bị sửa ngầm (Stale Protection) | Nếu file nguồn bị thay đổi ngoài ý muốn sau khi AI tạo diff, nút Apply sẽ bị khóa và yêu cầu tạo lại diff |
| **SC-18** | Không chạy lệnh Shell | Lệnh test do AI đề xuất chỉ được render dưới dạng văn bản tham khảo |
| **SC-19** | Không log dữ liệu nhạy cảm | Console log của Extension và Worker không in API Key, prompt, mã nguồn hay raw response |

---

## 4. Tiêu Chuẩn Nghiệm Thu Cuối Cùng Của MVP (Checklist SRS mục 13.4)

- [ ] Cài đặt extension vào Antigravity IDE theo tài liệu hướng dẫn thành công.
- [ ] Extension không bị crash khi người dùng chưa cấu hình Worker URL / API Key.
- [ ] Cấu hình URL HTTPS và API Key thành công thông qua lệnh cấu hình.
- [ ] API Key được lưu trong `SecretStorage`, không xuất hiện trong settings hay logs.
- [ ] Lệnh kiểm tra kết nối (`checkConnection`) trả trạng thái Connected/Disconnected chính xác.
- [ ] Gửi câu hỏi chat, backend Worker chuyển tiếp tới Workers AI và nhận được phản hồi Markdown.
- [ ] Streaming SSE hoạt động trơn tru (hoặc tự động chuyển sang JSON fallback nếu stream không khả dụng).
- [ ] Tính năng Explain Selection chỉ gửi đúng đoạn text được chọn, không gửi toàn bộ workspace.
- [ ] Tính năng Fix Code hiển thị Diff trực quan, từ chối áp dụng khi file đã bị sửa đổi trên đĩa.
- [ ] Lỗi hết quota (`AI_QUOTA_EXCEEDED`) hoặc hết capacity hiển thị thông báo rõ ràng, không retry vô hạn.
- [ ] Có bộ Unit Test kiểm thử các module trọng yếu (Filter, Budgeter, PathValidator, SSEParser, PatchParser).
