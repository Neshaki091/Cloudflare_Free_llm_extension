# Tầng Dùng Chung (Shared Layer)

Thư mục này chứa các định nghĩa TypeScript thuần túy (pure types, interfaces, error codes, constants) được chia sẻ đồng bộ giữa Extension và Cloudflare Worker.

---

## 1. Trách Nhiệm Chính (Responsibilities)
- Định nghĩa kiểu dữ liệu cho toàn bộ các request và response của API (`ChatRequest`, `ChatResponse`, `HealthResponse`, `ModelsResponse`).
- Định nghĩa các sự kiện của luồng Server-Sent Events (`SSEEvent`, `DeltaEvent`, `ErrorEvent`, `MetaEvent`).
- Định nghĩa các mã lỗi chuẩn (`ErrorCode`) và cấu trúc phản hồi lỗi an toàn (`ErrorResponse`).
- Định nghĩa các hằng số dùng chung an toàn (kích thước body tối đa, giới hạn token, danh sách model mặc định, default ignore patterns).

---

## 2. Ranh Giới Module và Điều Cấm Kỵ (Boundaries & Invariants)
- **TypeScript thuần khiết (Pure TypeScript):** Tuyệt đối không import các module của Node.js (như `fs`, `path`, `crypto`, `os`), không import VS Code API (`vscode`), và không import Cloudflare runtime (`@cloudflare/workers-types`).
- **Không chứa bí mật:** Tuyệt đối không hard-code bất kỳ secret, API key hay token nào trong code shared.
- **Không có phụ thuộc vòng lặp (No Circular Dependencies):** Shared layer là gốc rễ của hệ thống types và không phụ thuộc vào `src/extension/` hay `src/worker/`.

---

## 3. Cấu Trúc Dự Kiến (Planned Structure)
```text
src/shared/
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── index.ts              # Re-export toàn bộ shared contracts
    ├── api-types.ts          # Request & Response interfaces
    ├── sse-types.ts          # Server-Sent Events interfaces
    ├── error-codes.ts        # Mã lỗi chuẩn hóa (AI_QUOTA_EXCEEDED, ...)
    └── constants.ts          # Hằng số an toàn dùng chung
```

*Lưu ý: Các file type definitions sẽ được lập trình trong Milestone M1.*
