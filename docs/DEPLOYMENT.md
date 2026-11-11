# Hướng Dẫn Triển Khai Backend Cloudflare Worker (BYO Worker Deployment Guide)

- **Sản phẩm:** NesCode for Antigravity
- **Phiên bản:** 1.0.0
- **Tài liệu nguồn:** `journal/requirements/SRS.md` mục 9

Tài liệu này hướng dẫn người dùng cách tự triển khai backend Cloudflare Worker của riêng mình trên gói Cloudflare Free Tier theo mô hình **Bring Your Own Worker (BYO Worker)**.

---

## 1. Tổng Quan Mô Hình BYO Worker

NesCode for Antigravity không sử dụng máy chủ tập trung của tác giả extension. Người dùng tự triển khai backend Worker trên chính tài khoản Cloudflare của mình:
- **Tối ưu chi phí:** Vận hành hoàn toàn miễn phí trên gói Cloudflare Free Tier (100.000 requests/ngày và 10.000 Neurons AI/ngày).
- **Quyền riêng tư:** Mã nguồn và prompt của bạn chỉ đi từ IDE tới Worker cá nhân của bạn, không qua bất kỳ bên trung gian nào.
- **Tự chủ hoàn toàn:** Bạn làm chủ API key và có thể thay đổi model hoặc thu hồi quyền truy cập bất kỳ lúc nào.

---

## 2. Quy Trình Triển Khai Từng Bước (Step-by-Step)

### Bước 1: Chuẩn Bị Tài Khoản Cloudflare
- Đăng ký một tài khoản miễn phí tại [Cloudflare Dashboard](https://dash.cloudflare.com/) (nếu chưa có).
- Bật dịch vụ Workers & Pages trên dashboard.

### Bước 2: Đăng Nhập Cloudflare Bằng Wrangler CLI
Mở terminal trên máy tính của bạn và chạy lệnh:
```bash
npx wrangler login
```
Trình duyệt sẽ mở ra trang xác thực; bấm **Allow** để cấp quyền cho Wrangler CLI cục bộ.

### Bước 3: Thiết Lập Khóa Bí Mật Xác Thực (Worker Secret)
Tạo một chuỗi khóa bí mật ngẫu nhiên (tối thiểu 16 ký tự an toàn) và đưa vào Worker Secret:
```bash
cd src/worker
npx wrangler secret put NESCODE_API_KEY
```
Hệ thống sẽ yêu cầu nhập giá trị secret:
```text
✔ Enter a secret value: ********************************
✨ Success! Uploaded secret NESCODE_API_KEY
```
*Lưu ý: Hãy lưu lại chuỗi khóa này vào một nơi an toàn để cấu hình vào Extension ở Bước 5.*

### Bước 4: Triển Khai Worker Lên Cloudflare Edge
Chạy lệnh deploy:
```bash
npx wrangler deploy
```
Sau khi hoàn tất, terminal sẽ hiển thị địa chỉ URL của Worker:
```text
Uploaded nescode-ai-gateway (1.82 sec)
Deployed nescode-ai-gateway triggers (0.54 sec)
  https://nescode-ai-gateway.<your-account-subdomain>.workers.dev
Current Deployment ID: a1b2c3d4-e5f6-7890-...
```

---

## 3. Cấu Hình Kết Nối Trên Antigravity IDE

1. Mở **Antigravity IDE**.
2. Nhấn tổ hợp phím `Ctrl+Shift+P` (hoặc `Cmd+Shift+P`).
3. Nhập và chọn lệnh: `NesCode: Configure Connection`.
4. Nhập Worker URL: `https://nescode-ai-gateway.<your-account-subdomain>.workers.dev`.
5. Nhập API Key: Dán chuỗi `NESCODE_API_KEY` bạn đã tạo ở Bước 3. (Khóa này sẽ được lưu trữ an toàn trong `SecretStorage` của IDE).
6. Nhấn `Ctrl+Shift+P`, chọn `NesCode: Check Connection` để xác nhận trạng thái **Connected**.

---

## 4. Xử Lý Sự Cố Triển Khai (Troubleshooting)

- **Lỗi 401 Unauthorized:** Kiểm tra lại khóa API đã nhập trong extension có khớp chính xác với `NESCODE_API_KEY` đã upload bằng Wrangler hay không.
- **Lỗi 403 / AI Quota Exceeded:** Tài khoản Cloudflare đã dùng hết hạn ngạch 10.000 Neurons trong ngày. Đợi reset lúc 00:00 UTC hoặc kiểm tra mục Workers AI trên Cloudflare Dashboard.
- **Lỗi 503 AI Capacity Unavailable:** Mô hình AI tạm thời bị nghẽn capacity tại datacenter của Cloudflare. Chờ một vài phút và thử lại.
