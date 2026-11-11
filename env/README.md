# Quản Lý Môi Trường và Bí Mật (Environment & Secrets Management)

Thư mục `env/` chứa các tài liệu quy chuẩn và file mẫu biến môi trường phục vụ việc phát triển và triển khai dự án **NesCode for Antigravity**.

---

## 1. Nguyên Tắc An Toàn Tối Cao (Zero Secrets in Git)
- **Tuyệt đối không lưu bí mật thật vào Git:** Không bao giờ commit file chứa API key, mật khẩu, private keys, hoặc Cloudflare account token thật vào repository.
- **Thư mục mẫu (`env/templates/`):** Chỉ chứa các giá trị giả định (placeholders), không chứa thông tin định danh cá nhân hay dữ liệu sản xuất.

---

## 2. Phân Biệt Các Cấp Độ Cấu Hình và Bí Mật

| Cấp Độ | Ví Dụ | Nơi Lưu Trữ | Cơ Chế Bảo Vệ |
|---|---|---|---|
| **1. Cấu hình công khai (Public Config)** | `nescode.apiBaseUrl`, model mặc định, timeout | `settings.json` trong IDE hoặc `wrangler.jsonc` (vars) | Công khai, không chứa dữ liệu nhạy cảm |
| **2. Biến môi trường dev cục bộ (Local Dev Vars)** | `NESCODE_API_KEY` (cho Miniflare dev cục bộ) | `.dev.vars` tại thư mục Worker | Đã thêm vào `.gitignore`, chỉ nằm trên máy dev |
| **3. Khóa bí mật Cloudflare Worker (Worker Secret)** | `NESCODE_API_KEY` (trên edge production) | Cloudflare Secret Vault | Thiết lập qua lệnh `npx wrangler secret put NESCODE_API_KEY` |
| **4. Bí mật trên Extension (Extension Credentials)** | Worker Bearer API Key | `vscode.SecretStorage` (`context.secrets`) | Được mã hóa an toàn bởi OS Keychain / IDE, không lộ ra file text |

---

## 3. Cảnh Báo Về Token Tài Khoản Cloudflare
- `CLOUDFLARE_API_TOKEN` hoặc Global API Key chỉ được dùng duy nhất trên máy cục bộ của người dùng khi chạy lệnh `wrangler login` hoặc `wrangler deploy`.
- **Tuyệt đối không bao giờ** nhúng hay yêu cầu người dùng nhập Cloudflare Account API Token vào trong tiện ích mở rộng Extension.
