# Ngăn Xếp Công Nghệ Dự Án (Tech Stack)

- **Ngày cập nhật gần nhất:** 2026-11-11
- **Trạng thái:** Verified (Theo đặc tả `SRS.md` và kiểm tra môi trường máy phát triển)
- **Nguồn thông tin:** Môi trường Node.js local (v24.13.1), `SRS.md` mục 10.1 và Wrangler CLI ecosystem

---

## 1. Môi Trường Phát Triển & Công Cụ Hệ Thống

| Thành phần | Phiên bản / Công nghệ | Vai trò |
|---|---|---|
| **Hệ điều hành** | Windows | Môi trường máy trạm lập trình |
| **Node.js** | v24.13.1 (LTS/Current) | Runtime cho các công cụ build, test và phát triển extension |
| **npm** | 11.8.0 | Trình quản lý gói và monorepo workspaces |
| **Git** | 2.45.2.windows.1 | Quản lý mã nguồn và phiên bản |
| **Ngôn ngữ** | TypeScript 5.x (Strict mode) | Ngôn ngữ phát triển duy nhất cho toàn bộ dự án |

---

## 2. Ngăn Xếp Phía Extension (`src/extension/`)

| Lớp | Công nghệ dự kiến | Lý do lựa chọn |
|---|---|---|
| **Host Runtime** | Antigravity IDE Extension Host | Nền tảng IDE mục tiêu của sản phẩm |
| **Extension API** | VS Code Extension API (`@types/vscode`) | Chuẩn giao tiếp công khai mà Antigravity hỗ trợ |
| **Giao diện (UI)** | HTML5 + CSS thuần + Vanilla TypeScript trong Webview | Tối ưu kích thước gói, tránh tải nặng framework (React/Vue) cho MVP |
| **Đóng gói (Bundler)** | `esbuild` | Tốc độ biên dịch cực nhanh, tạo file bundle JavaScript duy nhất |
| **Lưu trữ bí mật** | `vscode.SecretStorage` (`context.secrets`) | Lưu API Key mã hóa an toàn do hệ điều hành/IDE quản lý |
| **Giao tiếp mạng** | Native `fetch` với `AbortController` | Hỗ trợ Streaming SSE và tính năng bấm dừng sinh nội dung (Cancel/Stop) |
| **Đóng gói VSIX** | `@vscode/vsce` | Tạo file cài đặt `.vsix` để cài vào Antigravity IDE |

---

## 3. Ngăn Xếp Phía Backend Worker (`src/worker/`)

| Lớp | Công nghệ dự kiến | Lý do lựa chọn |
|---|---|---|
| **Runtime** | Cloudflare Workers (V8 Edge Isolates) | Serverless edge có độ trễ cực thấp, không tốn chi phí duy trì server |
| **CLI & Deploy** | Wrangler CLI (`wrangler`) | Công cụ chính thức của Cloudflare để build, test local và deploy |
| **AI Inference** | Cloudflare Workers AI Binding (`env.AI`) | Tích hợp trực tiếp với phần cứng GPU tại edge của Cloudflare |
| **Mô hình AI mặc định** | `@cf/zai-org/glm-4.7-flash` | Hỗ trợ trên gói Free, context window 131k token, tối ưu cho tác vụ lập trình |
| **Quản lý bí mật** | Wrangler Secrets (`NESCODE_API_KEY`) | Quản lý khóa xác thực an toàn không lưu vào mã nguồn |
| **Streaming** | Server-Sent Events (`TransformStream` / SSE) | Truyền tải từng token theo thời gian thực về extension |

---

## 4. Ngăn Xếp Kiểm Thử & Chất Lượng Mã Nguồn

| Công cụ | Phạm vi áp dụng | Mục đích |
|---|---|---|
| **TypeScript Compiler (`tsc`)** | Toàn bộ dự án | Kiểm tra tính đúng đắn của kiểu dữ liệu (`--noEmit`) |
| **Vitest** | Unit & Integration tests | Framework kiểm thử nhanh hiện đại, tương thích hoàn hảo với TypeScript |
| **Miniflare / workerd** | Integration test phía Worker | Chạy giả lập Cloudflare Workers runtime cục bộ mà không cần kết nối mạng |
| **Antigravity Extension Test Host** | Compatibility Spike (M0) | Kiểm chứng hành vi thực tế của các API trong Antigravity IDE |
