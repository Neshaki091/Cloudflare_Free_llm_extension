# Module Backend Cloudflare Worker (Worker Layer)

Thư mục này chứa toàn bộ mã nguồn của ứng dụng serverless chạy trên nền tảng **Cloudflare Workers** (V8 Edge Isolates).

---

## 1. Trách Nhiệm Chính (Responsibilities)
- Điểm tiếp nhận request duy nhất từ Extension thông qua giao thức HTTPS.
- Định tuyến các endpoint chuẩn hóa:
  - `GET /v1/health`: Kiểm tra trạng thái hoạt động của Worker backend.
  - `GET /v1/models`: Trả danh sách các mô hình AI nằm trong allowlist an toàn.
  - `POST /v1/chat`: Tiếp nhận prompt và context từ extension, gọi Workers AI inference.
- Middleware xác thực Bearer API key (`Authorization: Bearer <NESCODE_API_KEY>`) sử dụng hàm so sánh an toàn thời gian (`timingSafeEqual`).
- Kiểm tra tính hợp lệ của request: Schema validation, giới hạn kích thước body (tối đa 256 KiB), giới hạn độ dài context và các roles được phép.
- Tạo System Prompt bảo vệ ở máy chủ (Server-side Policy) theo từng mode (`chat`, `explain`, `fix`, `generate_tests`), ngăn chặn Prompt Injection từ dữ liệu không tin cậy.
- Tích hợp với dịch vụ Cloudflare Workers AI qua binding `env.AI`.
- Chuẩn hóa luồng phản hồi Server-Sent Events (SSE) theo hợp đồng chuẩn (`meta`, `delta`, `done`, `error`) hoặc trả JSON fallback khi không stream.
- Chuẩn hóa các mã lỗi hệ thống (`AI_QUOTA_EXCEEDED`, `AI_CAPACITY_UNAVAILABLE`, `INVALID_REQUEST`).

---

## 2. Ranh Giới Module và Điều Cấm Kỵ (Boundaries & Invariants)
- **Hoàn toàn phi trạng thái (Stateless):** Không sử dụng D1, KV, R2 để lưu trữ mã nguồn, prompt hay response của người dùng trong phiên bản MVP.
- **Không ghi log nhạy cảm:** Tuyệt đối không in giá trị API key, nội dung prompt, hay mã nguồn vào console log của Worker ở môi trường production.
- **CPU Time siêu nhẹ:** Logic xử lý tại edge phải đảm bảo không vượt quá giới hạn 10 ms CPU time của gói Cloudflare Free.
- **Phụ thuộc bên ngoài:** Chỉ import từ `src/shared/` và Cloudflare Workers types/libraries; không import bất kỳ API nào của IDE hay Node.js runtime (`fs`, `child_process`).

---

## 3. Cấu Trúc Dự Kiến (Planned Structure)
```text
src/worker/
├── wrangler.jsonc            # Cấu hình Wrangler và AI binding
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── index.ts              # Entry point fetch handler
    ├── routes/               # health.ts, models.ts, chat.ts
    ├── middleware/           # auth.ts, requestId.ts, validateBody.ts
    ├── ai/                   # modelRouter.ts, promptBuilder.ts, streamAdapter.ts
    ├── security/             # apiKey.ts, safeErrors.ts
    └── utils/                # json.ts, timing.ts
```

*Lưu ý: Mã nguồn backend sẽ được triển khai trong Milestone M2.*
