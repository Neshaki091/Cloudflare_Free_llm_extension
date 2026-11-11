---
trigger: glob
globs: "**/*.ts, **/*.tsx"
---

# Quy Chuẩn Lập Trình TypeScript (TypeScript Standards)

Tài liệu này bắt buộc áp dụng cho toàn bộ mã nguồn viết bằng TypeScript trong dự án.

## 1. Chế Độ Nghiêm Ngặt (Strict TypeScript)
- Mọi cấu hình `tsconfig` phải bật `strict: true`, bao gồm `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, và `noUnusedLocals`.
- Hạn chế tối đa việc sử dụng kiểu `any`. Trong trường hợp bất khả kháng khi xử lý dữ liệu động từ bên ngoài, phải sử dụng `unknown` kết hợp với type guards hoặc schema validation trước khi ép kiểu.

## 2. Giao Kèo Rõ Ràng (Explicit Interfaces & Contracts)
- Tất cả request payload, response payload, query parameters và error bodies phải được định nghĩa bằng `interface` hoặc `type` rõ ràng tại `src/shared/`.
- Export các hằng số enum hoặc literal types cho các trường cố định như mode (`chat`, `explain`, `fix`, `generate_tests`), vai trò tin nhắn (`user`, `assistant`), mã lỗi (`INVALID_REQUEST`, `UNAUTHORIZED`, `AI_QUOTA_EXCEEDED`, ...).

## 3. Xác Thực Dữ Liệu Không Đáng Tin (Untrusted Input Validation)
- Mọi dữ liệu nhận được từ bên ngoài (Webview messages, HTTP request body tại Worker, model output từ LLM, file đọc từ workspace) đều phải được kiểm tra schema và kiểu dữ liệu trước khi xử lý.
- Khi phân tích patch hoặc mã nguồn do AI trả về, phải sử dụng bộ parser chặt chẽ, không dựa vào regex lỏng lẻo.

## 4. Xử Lý Lỗi Tường Minh (Explicit Error Handling)
- Không bắt lỗi chung chung (`catch (e) {}`) mà không log hoặc không xử lý.
- Chuẩn hóa các lớp lỗi kế thừa từ `Error`, cung cấp mã lỗi (error code) và trạng thái có thể thử lại (`retryable`) theo chuẩn SRS mục 7.7.
- Không để rò rỉ stack trace hoặc thông tin nhạy cảm ra ngoài phản hồi API hoặc giao diện người dùng.

## 5. An Toàn Trong Bất Đồng Bộ (Safe Asynchronous Code)
- Sử dụng `async/await` nhất quán; luôn bắt lỗi cho các Promise.
- Khi gọi HTTP request hoặc luồng xử lý kéo dài, bắt buộc tích hợp `AbortController` / `AbortSignal` để hỗ trợ người dùng bấm nút Dừng (Stop / Cancel).
- Xử lý đóng tài nguyên an toàn (dọn dẹp event listeners, giải phóng file handles, đóng SSE stream).

## 6. Thiết Kế Module Nhỏ Gọn và Dễ Kiểm Thử (Modular & Testable)
- Mỗi file module chỉ đảm nhận một trách nhiệm duy nhất (Single Responsibility Principle).
- Tách rời logic nghiệp vụ (pure functions, parser, validator) khỏi các phụ thuộc hệ thống (VS Code API, fetch, Cloudflare bindings) để có thể viết Unit Test độc lập mà không cần mock phức tạp.
