# Ma Trận Môi Trường Vận Hành (Environment Matrix)

- **Ngày cập nhật:** 2026-11-11
- **Tài liệu nguồn:** `journal/requirements/SRS.md` mục 7, 9 và NFR-SEC

Tài liệu này mô tả chi tiết các biến cấu hình và thông tin xác thực cho từng môi trường: Phát triển cục bộ (Local Development), Môi trường kiểm thử tự động (CI/Test), và Môi trường sản xuất (Production / BYO Worker).

---

## 1. Môi Trường Phía Cloudflare Worker

| Tên Biến / Secret | Kiểu | Bắt Buộc | Môi Trường Local Dev | Môi Trường Production | Mục Đích |
|---|---|---|---|---|---|
| `NESCODE_API_KEY` | Secret | Có | Đặt trong `.dev.vars` (ví dụ: `dev-secret-key-123`) | Thiết lập qua `wrangler secret put NESCODE_API_KEY` | Khóa Bearer token dùng để xác thực các request từ Extension |
| `DEFAULT_MODEL` | Var (String) | Không | `@cf/zai-org/glm-4.7-flash` (trong `wrangler.jsonc`) | Cấu hình trong `wrangler.jsonc` | Định danh model AI mặc định khi client không chỉ định |
| `MAX_BODY_BYTES` | Var (Number) | Không | `262144` (256 KiB) | Cấu hình trong `wrangler.jsonc` | Giới hạn kích thước payload tối đa cho mỗi HTTP request |
| `MAX_OUTPUT_TOKENS` | Var (Number) | Không | `1500` | Cấu hình trong `wrangler.jsonc` | Giới hạn số token đầu ra tối đa của model |
| `ENABLE_STREAMING` | Var (Boolean) | Không | `true` | `true` | Bật/tắt khả năng trả lời bằng Server-Sent Events |

---

## 2. Môi Trường Phía Extension (Antigravity IDE)

| Tên Cấu Hình / Secret | Cơ Chế Lưu Trữ | Giá Trị Mặc Định | Giá Trị Local Dev | Giá Trị Production (BYO) | Mục Đích |
|---|---|---|---|---|---|
| `nescode.apiBaseUrl` | IDE Settings (`settings.json`) | `""` (Rỗng) | `http://localhost:8787` | `https://<worker-name>.<subdomain>.workers.dev` | Địa chỉ URL của Cloudflare Worker |
| `nescode_api_key` | `SecretStorage` (`context.secrets`) | Không có | `dev-secret-key-123` | Chuỗi secret do người dùng tự tạo ngẫu nhiên | Khóa Bearer API Key để gửi kèm trong `Authorization` header |
| `nescode.defaultMode` | IDE Settings | `chat` | `chat` | `chat` | Chế độ mặc định khi mở chat panel |
| `nescode.maxContextTokens` | IDE Settings | `12000` | `12000` | `12000` | Ngân sách token tối đa cho context gửi đi |
| `nescode.maxOutputTokens` | IDE Settings | `1500` | `1500` | `1500` | Giới hạn token đầu ra |
| `nescode.requestTimeoutMs` | IDE Settings | `120000` | `120000` | `120000` | Thời gian chờ tối đa (120 giây) |
| `nescode.excludePatterns` | IDE Settings | *(Default patterns)* | *(Default patterns)* | *(Default patterns)* | Danh sách các glob pattern loại trừ file |
| `nescode.streamResponses` | IDE Settings | `true` | `true` | `true` | Bật streaming SSE hoặc fallback JSON |

---

## 3. Quy Tắc Luân Chuyển Khóa (Key Rotation)
Khi cần đổi khóa API:
1. Chạy lệnh: `npx wrangler secret put NESCODE_API_KEY` và nhập khóa mới.
2. Mở Antigravity IDE, nhấn `Ctrl+Shift+P` gọi lệnh `NesCode: Configure Connection` và nhập khóa mới.
3. Chạy lệnh `NesCode: Check Connection` để xác nhận kết nối thành công.
