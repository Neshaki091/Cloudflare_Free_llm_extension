# Hướng Dẫn Thiết Lập Môi Trường Phát Triển (Development Setup)

- **Sản phẩm:** NesCode for Antigravity
- **Phiên bản:** 1.0.0
- **Ngày lập:** 2026-11-11

Tài liệu này hướng dẫn lập trình viên và các AI Agent thiết lập môi trường phát triển cục bộ từ đầu.

---

## 1. Yêu Cầu Tiên Quyết (Prerequisites)

- **Hệ điều hành:** Windows 10/11, macOS, hoặc Linux.
- **Node.js:** Phiên bản `>= 20.x` (Khuyến nghị `v24.x LTS`).
- **npm:** Phiên bản `>= 10.x`.
- **Git:** Đã cài đặt và cấu hình SSH/HTTPS.
- **Wrangler CLI:** Được cài đặt qua npm (`npx wrangler`).
- **Antigravity IDE:** Môi trường IDE đích để cài đặt và thử nghiệm tiện ích mở rộng.

---

## 2. Các Bước Cài Đặt Ban Đầu (Step-by-Step Setup)

### Bước 1: Khởi Tạo Dự Án
```bash
# Clone repository (hoặc mở thư mục làm việc hiện tại)
cd nescode-antigravity

# Cài đặt toàn bộ dependencies cho các workspaces (M1 trở đi)
npm install
```

### Bước 2: Chuẩn Bị Môi Trường Worker Cục Bộ
```bash
# Sao chép template biến môi trường phát triển cho Worker
cp env/templates/worker.dev.vars.example src/worker/.dev.vars

# Chỉnh sửa khóa bí mật cục bộ nếu cần
# (Khóa này chỉ dùng để test local, không dùng trên production)
```

### Bước 3: Kiểm Tra Tính Đúng Đắn Của Kiểu Dữ Liệu
```bash
# Chạy kiểm tra kiểu TypeScript trên toàn bộ workspaces
npm run typecheck
```

### Bước 4: Chạy Bộ Kiểm Thử Đơn Vị (Unit Tests)
```bash
# Chạy test qua Vitest
npm test
```

---

## 3. Quy Trình Phát Triển & Thử Nghiệm

### 3.1. Chạy Backend Worker Cục Bộ
```bash
# Khởi chạy Worker giả lập với Miniflare và Workers AI binding local
cd src/worker
npx wrangler dev
# Worker sẽ lắng nghe tại: http://localhost:8787
```

### 3.2. Biên Dịch và Đóng Gói Extension
```bash
# Biên dịch extension qua esbuild
npm run build:extension

# Đóng gói file cài đặt VSIX vào thư mục build/
npm run package:extension
```

### 3.3. Cài Đặt File VSIX Vào Antigravity IDE
1. Mở Antigravity IDE.
2. Nhấn `Ctrl+Shift+P` (hoặc `Cmd+Shift+P` trên macOS).
3. Gõ và chọn lệnh: `Extensions: Install from VSIX...`.
4. Trỏ tới file `.vsix` vừa tạo trong thư mục `build/`.
5. Sau khi cài đặt, nhấn `Ctrl+Shift+P` gọi lệnh `NesCode: Open Chat` để bắt đầu thử nghiệm.
