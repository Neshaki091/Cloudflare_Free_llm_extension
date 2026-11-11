# Module Tiện Ích Mở Rộng (Extension Layer)

Thư mục này chứa toàn bộ mã nguồn của tiện ích mở rộng chạy trên môi trường Extension Host của **Antigravity IDE**.

---

## 1. Trách Nhiệm Chính (Responsibilities)
- Quản lý vòng đời kích hoạt của extension (`activate`, `deactivate`).
- Đăng ký và xử lý các câu lệnh (`commands`): `openChat`, `configureConnection`, `checkConnection`, `explainSelection`, `fixSelection`, `generateTests`.
- Khởi tạo và quản lý Chat Webview Panel với Content Security Policy (CSP) chặt chẽ.
- Quản lý lưu trữ bí mật bằng `vscode.SecretStorage` (`context.secrets`) để lưu trữ an toàn Worker Bearer API Key.
- Thu thập ngữ cảnh (Context Collection) từ selection, active file và context picker.
- Lọc file nhạy cảm (Secret & Exclude Filter) và kiểm soát ngân sách token (Context Budgeter).
- Kết nối tới Cloudflare Worker qua API Client hỗ trợ Server-Sent Events (SSE) streaming và `AbortController`.
- Hiển thị giao diện xem trước thay đổi mã nguồn (Diff Preview) với hai nút thao tác Apply/Reject độc lập, đi kèm cơ chế kiểm tra bảo vệ tài liệu bị sửa ngầm (Stale Document Protection).

---

## 2. Ranh Giới Module và Điều Cấm Kỵ (Boundaries & Invariants)
- **Chỉ sử dụng Public VS Code API:** Tuyệt đối không import hoặc dựa dẫm vào các API nội bộ không công khai của Antigravity IDE.
- **Không nhúng Cloudflare Account Token:** Extension chỉ lưu Worker API Key; không bao giờ yêu cầu Cloudflare Account Global Key hay Account API Token.
- **Không tự động ghi file trực tiếp:** Mọi thay đổi mã nguồn phải đi qua giao diện Diff Preview và chỉ được ghi xuống đĩa khi người dùng chủ động bấm nút Áp dụng (Apply).
- **Không tự động chạy lệnh shell:** Các lệnh chạy test do AI gợi ý chỉ hiển thị dưới dạng văn bản tham khảo.
- **Phụ thuộc bên ngoài:** Chỉ import từ `src/shared/` và các thư viện môi trường Node.js / VS Code; không import mã nguồn chuyên biệt của Cloudflare Worker runtime.

---

## 3. Cấu Trúc Dự Kiến (Planned Structure)
```text
src/extension/
├── package.json
├── tsconfig.json
├── esbuild.js
├── README.md
└── src/
    ├── extension.ts              # Entry point
    ├── commands/                 # Các lệnh của extension
    ├── providers/                # ChatViewProvider (WebviewView)
    ├── context/                  # Thu thập, lọc và tính toán ngân sách context
    ├── api/                      # Client gọi Worker, SSE parser
    ├── diff/                     # Patch parser, Diff preview, Apply logic
    ├── security/                 # SecretStorage wrapper, CSP
    └── utils/                    # Logger an toàn, token estimator
```

*Lưu ý: Mã nguồn chức năng sẽ được triển khai tuần tự trong các Milestone M1, M3, M4, M5 sau khi hoàn thành M0.*
