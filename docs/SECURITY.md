# Chính Sách An Toàn và Quyền Riêng Tư (Security & Threat Model)

- **Sản phẩm:** NesCode for Antigravity
- **Phiên bản:** 1.0.0
- **Tài liệu nguồn:** `journal/requirements/SRS.md` mục 5.1, 5.2 và NFR-SEC

Tài liệu này xác định mô hình đe dọa (threat model), các ranh giới tin cậy (trust boundaries) và chính sách quản lý bí mật nhằm bảo vệ tuyệt đối mã nguồn và thông tin xác thực của người dùng.

---

## 1. Mô Hình Đe Dọa và Ranh Giới Tin Cậy (Threat Boundaries)

```text
[ VÙNG TIN CẬY CỤC BỘ (LOCAL TRUST ZONE) ]
  • File mã nguồn workspace trên máy người dùng.
  • Extension Host và IDE SecretStorage.
  • Bộ lọc SecretFilter & PathValidator.
                     │
                     ▼  (Chỉ gửi context đã được người dùng chọn & cho phép)
           [ MẠNG HTTPS CÔNG CỘNG ]
                     │
                     ▼  (Xác thực bắt buộc qua Bearer API Key)
[ VÙNG CLOUDFLARE EDGE (BYO WORKER) ]
  • Cloudflare Worker của chính người dùng.
  • System Policy được cấu hình ở máy chủ.
  • Không lưu persistent storage (Không D1, KV, R2).
                     │
                     ▼  (Internal Cloudflare AI Binding)
[ DỊCH VỤ SUY LUẬN AI (WORKERS AI) ]
  • Mô hình ngôn ngữ lớn: @cf/zai-org/glm-4.7-flash.
```

---

## 2. Các Rủi Ro Trọng Yếu và Cơ Chế Phòng Vệ

### 2.1. Nguy Cơ Rò Rỉ Bí Mật (Credential Leakage)
- **Mối đe dọa:** Người dùng vô tình gửi file `.env`, private key, hoặc Cloudflare account token lên AI.
- **Biện pháp phòng vệ:**
  - Danh sách loại trừ file nhạy cảm mặc định (`contextFilter`) tự động chặn `.env*`, `*.pem`, `*.key`, `*credentials*`, `*secret*`, `~/.ssh/`.
  - Extension không lưu trữ bất kỳ Cloudflare Account API Token nào.
  - Khóa Worker API Key lưu trữ trong `vscode.SecretStorage`, được mã hóa bởi hệ thống bảo mật của hệ điều hành.

### 2.2. Tấn Công Đường Dẫn (Path Traversal Attacks)
- **Mối đe dọa:** Mô hình AI sinh ra patch đề xuất ghi vào các file hệ thống ngoài workspace (ví dụ: `../../etc/passwd` hoặc `C:\Windows\...`).
- **Biện pháp phòng vệ:**
  - `pathValidator` chuẩn hóa mọi đường dẫn thành relative path và kiểm tra nghiêm ngặt `filePath.startsWith(workspaceRoot)`.
  - Từ chối ngay lập tức mọi patch chứa đường dẫn tuyệt đối hoặc `..`.

### 2.3. Mã Độc và Prompt Injection Từ Mã Nguồn Không Đáng Tin
- **Mối đe dọa:** File mã nguồn hoặc README của bên thứ ba chứa các chỉ dẫn độc hại nhằm lừa mô hình ghi đè system prompt hoặc thực thi hành vi phá hoại.
- **Biện pháp phòng vệ:**
  - Toàn bộ nội dung mã nguồn được đóng gói dưới dạng dữ liệu (data), không bao giờ có quyền ghi đè System Prompt của máy chủ.
  - Phía Extension không có quyền tự động thực thi bất kỳ câu lệnh shell nào do mô hình AI trả về.

### 2.4. Sửa Đổi Mã Nguồn Ngoài Ý Muốn (Unintended Code Destruction)
- **Mối đe dọa:** AI sinh patch sai làm mất code người dùng khi tự động lưu.
- **Biện pháp phòng vệ:**
  - **Cơ chế Phê Duyệt Bắt Buộc (Human Approval Gate):** AI chỉ trả về bản đề xuất; người dùng bắt buộc phải xem trên giao diện Diff Preview và bấm nút Áp dụng (Apply).
  - **Bảo Vệ Tài Liệu Bị Sửa Ngầm (Stale Document Protection):** Nếu nội dung file trên đĩa đã bị thay đổi kể từ lúc tạo diff, lệnh Apply sẽ bị từ chối và yêu cầu tạo lại diff mới.

---

## 3. Chính Sách Không Ghi Nhật Ký Dữ Liệu Nhạy Cảm (Safe Logging Policy)
- Tuyệt đối cấm ghi giá trị header `Authorization`, khóa API, nội dung prompt, mã nguồn, hoặc raw AI response vào console log của Worker hay Extension ở môi trường production.
- Chỉ log metadata phục vụ gỡ lỗi: timestamp, requestId, status code, model ID, duration, error code.
