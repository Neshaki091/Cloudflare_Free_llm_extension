# Gói Thử Nghiệm Tương Thích Nền Tảng (NesCode Compatibility Spike Extension)

Extension tối thiểu này được thiết kế chuyên biệt cho **Milestone M0 (Compatibility Spike)** nhằm kiểm chứng tính tương thích của Extension Host trong **Antigravity IDE**.

---

## 1. Các Tính Năng Được Kiểm Chứng

1. **Vòng đời Extension:** Kích hoạt thông qua sự kiện `onStartupFinished`.
2. **Commands API:** Đăng ký và gọi các lệnh trong Command Palette:
   - `NesCode Spike: Run Diagnostic Checks` (`nescode.spikeCheck`)
   - `NesCode: Hello World` (`nescode.helloWorld`)
   - `NesCode Spike: Test SecretStorage` (`nescode.spikeSecretTest`)
   - `NesCode Spike: Test Workspace Context` (`nescode.spikeContextTest`)
3. **WebviewView Panel:** Khởi tạo panel trong Activity Bar, kiểm tra render HTML/CSS và giao tiếp hai chiều qua `postMessage`.
4. **SecretStorage API:** Ghi một chuỗi ngẫu nhiên có timestamp vào `context.secrets`, đọc lại và kiểm tra tính khớp 100%.
5. **Workspace API:** Đọc tài liệu đang mở (`activeTextEditor`), đọc chuỗi văn bản đang bôi đen và danh sách các thư mục trong workspace.
6. **OutputChannel Logging:** Ghi log chẩn đoán chi tiết ra channel `NesCode Spike Diagnostics`.

---

## 2. Hướng Dẫn Đóng Gói và Cài Đặt

### Đóng gói file VSIX
Chạy lệnh đóng gói từ thư mục gốc của repository:
```bash
npm run package:spike
```
File tạo phẩm sẽ được lưu tại: `build/nescode-spike-0.1.0.vsix`.

### Cài đặt vào Antigravity IDE
1. Mở Antigravity IDE.
2. Nhấn `Ctrl+Shift+P` chọn `Extensions: Install from VSIX...`.
3. Chọn file `build/nescode-spike-0.1.0.vsix`.
4. Sau khi cài đặt, biểu tượng **NesCode Spike** sẽ xuất hiện trên thanh Activity Bar và các lệnh `NesCode Spike:*` có sẵn trong Command Palette.
