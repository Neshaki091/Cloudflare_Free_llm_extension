# Kiến Trúc Kỹ Thuật Hệ Thống (System Architecture)

- **Sản phẩm:** NesCode for Antigravity
- **Phiên bản kiến trúc:** 1.0.0 (Baseline MVP)
- **Tài liệu nguồn:** `journal/requirements/SRS.md` Phần 2, 7, 10

Tài liệu này trình bày chi tiết kiến trúc tổng thể, các luồng dữ liệu chính và ranh giới trách nhiệm của các thành phần trong NesCode for Antigravity.

---

## 1. Sơ Đồ Kiến Trúc Tổng Thể (Architecture Diagram)

```mermaid
flowchart TD
    subgraph Host["Môi Trường Antigravity IDE (Local Host)"]
        subgraph Webview["Giao Diện Người Dùng (Chat UI)"]
            UI_View["Chat Webview Panel"]
            UI_Composer["Textarea Composer & Shortcuts"]
            UI_Status["Status Bar & Usage Footer"]
            UI_Diff["Diff Preview Viewer"]
        end

        subgraph Core["Lớp Extension Core (TypeScript)"]
            Ext_Act["Extension Activation & Commands"]
            Ext_Sec["SecretStorage Manager"]
            Ext_Client["Worker API Client (Fetch + AbortController)"]
            Ext_SSE["SSE Parser & Line Buffer"]
            Ext_Diff["Diff Engine & Stale Protection"]
        end

        subgraph ContextEng["Kỹ Thuật Ngữ Cảnh (Context Engineering)"]
            Ctx_Collect["Context Collector (Selection / Active File)"]
            Ctx_Picker["Context File Picker"]
            Ctx_Filter["Secret & Exclude Filter"]
            Ctx_Budget["Context Budgeter (12k / 20k Token Cap)"]
            Ctx_Path["Path Validator (Traversal Protection)"]
        end
    end

    subgraph EdgeBackend["Backend Cloudflare Worker (BYO Worker)"]
        W_Fetch["Fetch Event Handler (Entry)"]
        W_Auth["Bearer Auth Middleware (timingSafeEqual)"]
        W_Rate["Request & Body Size Validator (256 KiB)"]
        W_Prompt["Server-Side System Prompt Builder"]
        W_Router["Model Allowlist Router"]
        W_SSE["SSE Stream Adapter"]
        W_Err["Safe Error Normalizer"]
    end

    subgraph CloudflareAI["Nền Tảng Cloudflare Workers AI"]
        Binding["Binding: env.AI"]
        GLM["Model: @cf/zai-org/glm-4.7-flash"]
    end

    %% Tương tác UI và Extension Core
    UI_Composer -->|postMessage| Ext_Act
    Ext_Act --> UI_View
    Ext_Act --> Ext_Sec
    Ext_Act --> Ctx_Collect

    %% Luồng thu thập và lọc Context
    Ctx_Collect --> Ctx_Picker
    Ctx_Picker --> Ctx_Filter
    Ctx_Filter --> Ctx_Path
    Ctx_Path --> Ctx_Budget
    Ctx_Budget --> Ext_Client

    %% Giao tiếp mạng ra Cloudflare Edge
    Ext_Sec -.->|Bearer Key| Ext_Client
    Ext_Client -->|HTTPS POST /v1/chat| W_Fetch

    %% Luồng xử lý tại Worker
    W_Fetch --> W_Auth
    W_Auth --> W_Rate
    W_Rate --> W_Prompt
    W_Prompt --> W_Router
    W_Router --> Binding
    Binding --> GLM
    GLM --> Binding
    Binding --> W_SSE
    W_SSE -->|Text/Event-Stream| Ext_Client

    %% Phản hồi về Extension và hiển thị Diff
    Ext_Client --> Ext_SSE
    Ext_SSE -->|Parsed Delta Events| UI_View
    Ext_SSE -->|Patch Proposal| Ext_Diff
    Ext_Diff --> UI_Diff
    UI_Diff -->|Người dùng bấm Apply| Ext_Diff
    Ext_Diff -->|Ghi file an toàn| Host
```

---

## 2. Phân Tách Trách Nhiệm Chi Tiết

### 2.1. Phía Máy Cục Bộ (Extension Client)
- **Quyền riêng tư tuyệt đối:** Dữ liệu mã nguồn không bao giờ tự động rời máy người dùng khi chưa có thao tác chủ động.
- **Tiền xử lý an toàn (Pre-processing):** Toàn bộ file bí mật và file cấu hình bị loại trừ ngay tại máy cục bộ bằng `contextFilter`.
- **Cắt giảm ngữ cảnh (Budgeting):** Ước lượng token và giới hạn ngân sách ngữ cảnh (12k token mặc định) để bảo toàn hạn ngạch 10.000 Neurons/ngày của Cloudflare Free.
- **Diff Preview & Human Approval:** Mọi đề xuất thay đổi mã nguồn phải được render dưới dạng unified diff trực quan; chỉ khi người dùng bấm Apply, file mới được cập nhật sau khi kiểm tra tính toàn vẹn (Stale Document Protection).

### 2.2. Phía Cloudflare Worker Backend (BYO Worker)
- **Kiến trúc Serverless Edge:** Vận hành trên Cloudflare Workers với độ trễ tối thiểu toàn cầu, không tốn chi phí máy chủ.
- **Bảo mật bằng Bearer Key:** Mọi request bắt buộc phải có `Authorization: Bearer <NESCODE_API_KEY>` hợp lệ; từ chối mọi truy cập trái phép.
- **Không tin tưởng Client (Server-side Policy):** System Prompt được lưu trữ và xây dựng tại máy chủ; xem toàn bộ mã nguồn của người dùng là dữ liệu không tin cậy (untrusted context), ngăn ngừa triệt để kỹ thuật Prompt Injection.
- **Chuẩn hóa lỗi:** Mọi lỗi từ dịch vụ Workers AI được chuẩn hóa thành mã lỗi an toàn (`AI_QUOTA_EXCEEDED`, `AI_CAPACITY_UNAVAILABLE`) và không bao giờ rò rỉ stack trace.

---

## 3. Trạng Thái Hiện Thực Hóa (Implementation Status)

- **Đã thiết lập (Established):** Cấu trúc phân rã ranh giới module, các interface giao tiếp, quy chuẩn an toàn và sơ đồ logic.
- **Đang chờ kiểm chứng (Pending M0):** Khả năng tương thích thực tế của Extension Host trong Antigravity IDE (`WebviewView`, `SecretStorage`).
- **Kế hoạch triển khai (Planned):** Mã nguồn các module sẽ được lập trình trong các Milestone M1 đến M5.
