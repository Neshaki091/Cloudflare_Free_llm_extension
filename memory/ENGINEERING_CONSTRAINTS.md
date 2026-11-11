# Các Ràng Buộc Kỹ Thuật (Engineering Constraints)

- **Ngày cập nhật gần nhất:** 2026-11-11
- **Trạng thái:** Verified (Căn cứ theo giới hạn công bố của Cloudflare và thiết kế an toàn của `SRS.md`)
- **Nguồn thông tin:** `SRS.md` mục 5, 8.2, 9.4 và tài liệu chính thức Cloudflare Limits (2026-11-11)

---

## 1. Ràng Buộc Tầng Miễn Phí Cloudflare Free Tier

| Ràng buộc | Giá trị tham chiếu (2026-11-11) | Ảnh hưởng kỹ thuật & Giải pháp |
|---|---|---|
| **Số lượt yêu cầu Workers** | 100.000 requests/ngày | Quá đủ cho nhu cầu cá nhân. Không cần pooling quota. |
| **Thời gian CPU Worker** | 10 ms CPU time / request | Logic xử lý trên Worker phải cực kỳ nhẹ; không được parse file lớn hay chạy thuật toán nặng ở edge. |
| **Workers AI Free Allocation** | 10.000 Neurons/ngày (Reset 00:00 UTC) | **Ràng buộc trọng yếu nhất:** Mức tiêu thụ phụ thuộc số token input/output. Hạn ngạch có thể hết sau vài chục lượt hỏi nếu context quá lớn. |
| **Khả dụng của Model** | `@cf/zai-org/glm-4.7-flash` dùng được trên Free plan | Phải cấu hình model ID tập trung; không hard-code khắp nơi để sẵn sàng đổi model nếu Cloudflare điều chỉnh chính sách. |
| **Không dùng dịch vụ trả phí** | Tuyệt đối không bắt buộc D1, KV, R2, Vectorize | Kiến trúc MVP chỉ dùng Workers + Workers AI binding. |

---

## 2. Ràng Buộc Ngân Sách Ngữ Cảnh (Context Budget Constraints)

- **Kích thước Context mặc định:** Tối đa 12.000 token ước lượng (tương đương ~48.000 ký tự).
- **Chặn cứng kích thước Context (Hard cap):** Tối đa 20.000 token ước lượng. Bất kỳ request nào vượt ngưỡng này sẽ bị bộ lọc cắt giảm có kiểm soát hoặc cảnh báo cho người dùng.
- **Giới hạn Output Token mặc định:** Tối đa 1.500 token.
- **Giới hạn kích thước Body HTTP:** Tối đa 256 KiB (`MAX_BODY_BYTES`).
- **Thời gian chờ (Timeouts):** Kết nối Worker tối đa 10 giây; thời gian suy luận AI tối đa 120 giây.

---

## 3. Ràng Buộc Bảo Mật & Quyền Riêng Tư (Security Constraints)

1. **Giao thức mạng:** Chỉ chấp nhận `https://` cho Worker URL. Chỉ cho phép `http://` khi kết nối vào `localhost` hoặc `127.0.0.1` trong môi trường phát triển cục bộ.
2. **Không rò rỉ Token tài khoản:** Tuyệt đối không lưu Cloudflare Account Global Key hay Account API Token trong extension.
3. **Lưu trữ bí mật máy khách:** Khóa API của Worker (`NESCODE_API_KEY`) bắt buộc phải lưu trong `vscode.SecretStorage`.
4. **Quyền riêng tư dữ liệu mã nguồn:**
   - Không tự động quét hay tải lên toàn bộ dự án.
   - Luôn áp dụng bộ lọc file nhạy cảm mặc định (`.env`, private keys, certificates, secrets, thư mục build).
   - Không lưu trữ prompt hay mã nguồn vào cơ sở dữ liệu trên cloud.
5. **Human-in-the-Loop:** Tuyệt đối không tự động ghi đè mã nguồn lên đĩa hoặc tự động chạy lệnh shell trong terminal.

---

## 4. Ràng Buộc Tương Thích Nền Tảng (Platform Constraints)

- **Antigravity IDE:** Antigravity dựa trên lõi IDE hiện đại hỗ trợ VS Code Extension API. Tuy nhiên, tính tương thích của các API cụ thể (`vscode.window.registerWebviewViewProvider`, `vscode.commands`, `vscode.workspace`, `context.secrets`) phải được kiểm chứng thông qua bài thử nghiệm **Milestone M0 (Compatibility Spike)** trước khi triển khai các chức năng sản phẩm.
- **Không dùng Private APIs:** Tuyệt đối không import hoặc can thiệp vào các module nội bộ của Antigravity IDE.
