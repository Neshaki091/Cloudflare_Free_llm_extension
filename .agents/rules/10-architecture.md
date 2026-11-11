---
trigger: model_decision
description: "Hướng dẫn thiết kế kiến trúc, phân tách ranh giới giữa extension, worker backend và module dùng chung (shared)."
---

# Quy Chuẩn Kiến Trúc Hệ Thống (Architecture Guidelines)

Tài liệu này định hướng thiết kế và phân tách trách nhiệm giữa các tầng của NesCode for Antigravity.

## 1. Phân Tách Tuyệt Đối Các Thành Phần
Dự án được chia thành 3 vùng trách nhiệm độc lập:
- `src/extension/`: Mã nguồn của tiện ích mở rộng chạy trên Antigravity Extension Host (Node.js/VS Code API environment).
- `src/worker/`: Mã nguồn backend chạy trên Cloudflare Workers edge runtime (V8 isolates).
- `src/shared/`: Định nghĩa kiểu dữ liệu (types), mã lỗi (error codes), và hằng số dùng chung giữa Extension và Worker.

## 2. Ranh Giới Runtime và Phụ Thuộc (Dependency Inversion)
- **Extension Layer:** Chỉ chứa logic giao tiếp với IDE (Webview, Workspace, Commands, SecretStorage, Diff Editor). Không import trực tiếp SDK của Cloudflare hoặc mã nguồn chuyên biệt của Worker runtime.
- **Worker Layer:** Chỉ chứa logic xác thực, định tuyến API, chuẩn hóa prompt và gọi Workers AI binding (`env.AI`). Không phụ thuộc vào bất kỳ API nào của IDE hoặc VS Code.
- **Shared Layer:** Phải là TypeScript thuần khiết, không chứa bất kỳ import nào từ Node.js (`fs`, `path`), VS Code API (`vscode`), hay Cloudflare Workers runtime (`@cloudflare/workers-types` hoặc global bindings). Không có circular dependencies.

## 3. Không Ghép Chặt Giao Diện Với Nhà Cung Cấp AI (Decoupling)
- Giao diện chat (Chat UI) và các lệnh coding chỉ giao tiếp qua giao thức API chuẩn hóa (`POST /v1/chat`, `GET /v1/health`).
- Sử dụng interface trừu tượng (`ModelProvider`) ở phía Worker để sẵn sàng mở rộng hỗ trợ nhiều mô hình hoặc nhà cung cấp AI trong tương lai mà không làm thay đổi Extension.

## 4. Backend Phi Trạng Thái (Stateless Worker)
- Backend Cloudflare Worker trong phạm vi MVP phải hoàn toàn phi trạng thái (stateless).
- Không lưu trữ phiên làm việc, prompt, source code, hay lịch sử chat vào cơ sở dữ liệu bền vững (D1, KV, R2) nhằm đảm bảo tối đa quyền riêng tư và tối ưu chi phí gói Free.
