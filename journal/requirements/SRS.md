# Software Requirements Specification (SRS)

## NesCode for Antigravity — Cloudflare Workers AI Edition

| Thuộc tính | Giá trị |
|---|---|
| Tên sản phẩm | NesCode for Antigravity |
| Tên dự án/repository đề xuất | `nescode-antigravity` |
| Phiên bản tài liệu | 1.0.0 |
| Trạng thái | Draft — Baseline for MVP implementation |
| Ngày lập | 2026-11-11 |
| Ngôn ngữ | Tiếng Việt; tên API, identifier và thuật ngữ kỹ thuật giữ nguyên tiếng Anh |
| Nền tảng mục tiêu | Antigravity IDE; VS Code Extension API làm lớp tích hợp dự kiến |
| Backend | Cloudflare Workers |
| Inference | Cloudflare Workers AI |
| Model mặc định đề xuất | `@cf/zai-org/glm-4.7-flash` |
| Phương thức triển khai | Bring Your Own Cloudflare Worker (BYO Worker) |

> **Tài liệu triển khai:** Đây là SRS baseline cho MVP. Các mục được đánh dấu **P0** là điều kiện bắt buộc trước khi phát hành. Đặc biệt, cần thực hiện compatibility spike để xác nhận Antigravity IDE cho phép cài và chạy extension bên thứ ba theo API tương thích VS Code. Không sử dụng API nội bộ/không công khai của Antigravity.

---

## 1. Giới thiệu

### 1.1. Mục đích tài liệu

Tài liệu này định nghĩa yêu cầu sản phẩm, yêu cầu chức năng, phi chức năng, kiến trúc logic, giao thức API, mô hình dữ liệu, bảo mật, triển khai và tiêu chí nghiệm thu cho NesCode for Antigravity.

SRS là nguồn yêu cầu chuẩn để:

- Developer triển khai extension và Cloudflare Worker.
- AI coding agent đọc và thực hiện công việc theo từng milestone.
- Reviewer kiểm tra tính đầy đủ, bảo mật và khả năng kiểm thử.
- Người dùng xác nhận MVP đã đạt điều kiện sử dụng.

### 1.2. Mục tiêu sản phẩm

NesCode là extension hỗ trợ coding trong Antigravity, sử dụng Cloudflare Workers AI qua một backend Worker do chính người dùng triển khai trên tài khoản Cloudflare Free.

Sản phẩm cung cấp:

1. Chat với mô hình AI từ IDE.
2. Giải thích đoạn code đang chọn hoặc file đang mở.
3. Phân tích lỗi và đề xuất bản sửa dưới dạng diff.
4. Sinh unit test từ code/context được chọn.
5. Thu thập context có kiểm soát từ workspace.
6. Hiển thị usage, trạng thái backend và lỗi quota.
7. Tạo nền tảng để phát triển Agent Mode theo quy trình Plan → Patch → Verify ở phiên bản sau.

### 1.3. Mục tiêu kỹ thuật

- Không yêu cầu thuê VPS hoặc server riêng.
- Không yêu cầu extension giữ Cloudflare Account API Token.
- Mỗi người dùng tự triển khai Worker trên tài khoản Cloudflare của mình.
- Không tự động upload toàn bộ repository.
- Không tự ý ghi file hoặc chạy lệnh shell khi chưa có hành động xác nhận.
- Tối ưu request/context để giảm mức tiêu thụ Workers AI Neurons.
- Có khả năng thay đổi model mà không cần thay đổi giao diện extension.

### 1.4. Phạm vi MVP

MVP phiên bản `0.1.x` bao gồm:

- Extension activation và command registration.
- Chat panel trong IDE.
- Kết nối HTTPS tới Cloudflare Worker.
- Bearer API key riêng cho mỗi deployment.
- Workers AI inference, model mặc định GLM-4.7-Flash.
- Explain Code, Fix Code (diff preview), Generate Tests.
- Context từ selection, active file và danh sách file do người dùng chọn.
- Context filtering, size budget và secret exclusion.
- Streaming response nếu model/runtime tương thích; có JSON fallback.
- Health check, lỗi xác thực, lỗi quota, timeout và retry có kiểm soát.
- Packaging VSIX và hướng dẫn cài đặt/triển khai.

### 1.5. Ngoài phạm vi MVP

Các chức năng sau không thuộc MVP và không được tự ý triển khai trước khi có yêu cầu riêng:

- Agent tự động sửa nhiều file mà không cần phê duyệt.
- Chạy shell command tự động hoặc chạy command do model sinh ra không qua policy.
- Tự động commit/push Git.
- Fine-tune hoặc host model riêng trên Cloudflare Workers AI.
- Upload source code để lưu trữ lâu dài trên Cloudflare.
- Đồng bộ hội thoại giữa nhiều máy.
- Tài khoản SaaS nhiều tenant do tác giả extension vận hành.
- Thanh toán, subscription hoặc quota pooling giữa người dùng.
- Tự động sửa file cấu hình hệ điều hành, registry hoặc secrets.
- RAG/vector database, embedding index hoặc project-wide semantic index.
- MCP server/tool marketplace.

### 1.6. Đối tượng sử dụng

- **Developer cá nhân:** sử dụng AI để hiểu, sửa và kiểm thử code.
- **Maintainer:** triển khai Worker, cấu hình model và API key.
- **Contributor:** phát triển extension/backend theo SRS.

### 1.7. Thuật ngữ và viết tắt

| Thuật ngữ | Ý nghĩa |
|---|---|
| IDE | Integrated Development Environment |
| Extension Host | Runtime thực thi extension của IDE |
| Worker | Cloudflare serverless application |
| Workers AI | Dịch vụ inference model của Cloudflare |
| Neurons | Đơn vị usage/billing của Workers AI |
| Context | Nội dung code, selection, file hoặc thông tin workspace gửi model |
| Patch | Thay đổi source code được trình bày dưới dạng unified diff hoặc edit operation |
| BYO Worker | Mỗi người dùng tự triển khai backend Worker trên Cloudflare account của họ |
| SecretStorage | Kho lưu bí mật được IDE cung cấp cho extension |
| SSE | Server-Sent Events |
| P0/P1/P2 | Mức ưu tiên: bắt buộc / quan trọng / có thể để sau |
| DLP | Data Loss Prevention; trong phạm vi dự án là các bộ lọc ngăn gửi dữ liệu nhạy cảm |

---

## 2. Tổng quan sản phẩm

### 2.1. Bối cảnh vận hành

Người dùng đang làm việc trong Antigravity IDE. Extension hiển thị một chat panel riêng và sử dụng các API công khai mà Extension Host cung cấp. Khi người dùng gửi prompt:

1. Extension xác định action/mode.
2. Extension thu thập đúng phần context được người dùng cho phép.
3. Extension loại trừ file nhạy cảm và giới hạn dung lượng context.
4. Extension gửi request tới Worker qua HTTPS.
5. Worker xác thực API key và kiểm tra request.
6. Worker tạo system prompt phía server và gọi Workers AI binding.
7. Worker chuẩn hóa kết quả thành JSON hoặc SSE.
8. Extension hiển thị nội dung; với thao tác sửa code, extension tạo diff preview.
9. Người dùng quyết định Apply hoặc Reject.

### 2.2. Kiến trúc logic

```mermaid
flowchart TD
    U[Developer] --> IDE[Antigravity IDE]
    IDE --> EXT[NesCode Extension]
    EXT --> SC[Context Collector]
    SC --> FILTER[Secret Filter + Ignore Rules]
    FILTER --> BUDGET[Context Budgeter]
    BUDGET -->|HTTPS + Bearer Key| W[Cloudflare Worker]
    W --> AUTH[Authentication + Validation]
    AUTH --> PROMPT[Server-side Prompt Builder]
    PROMPT --> ROUTER[Model Router]
    ROUTER --> AI[Workers AI Binding]
    AI --> ROUTER
    ROUTER --> W
    W --> EXT
    EXT --> DIFF[Diff Preview / Apply / Reject]
    DIFF --> IDE
```

### 2.3. Thành phần

| Thành phần | Trách nhiệm | Nơi chạy |
|---|---|---|
| Extension Core | Activation, commands, settings, state | Antigravity Extension Host |
| Chat UI | Chat panel, Markdown, status, usage | IDE Webview |
| Context Collector | Lấy selection, active file và file người dùng chọn | Local machine |
| Context Filter | Bỏ secrets, file binary, file bị ignore | Local machine |
| Context Budgeter | Giới hạn file, ký tự và ước lượng token | Local machine |
| API Client | HTTPS, timeout, SSE parsing, retry | Local machine |
| Diff Service | Tạo và preview thay đổi, Apply/Reject | Local machine |
| Cloudflare Worker | Auth, validation, prompt, model routing | Cloudflare edge |
| Workers AI | Model inference | Cloudflare |

### 2.4. Quyết định kiến trúc

1. Extension không gọi trực tiếp Cloudflare Account REST API.
2. Cloudflare Account API Token chỉ dùng trong quá trình deploy nếu cần; tuyệt đối không lưu trong extension.
3. Worker AI binding được cấu hình trong deployment của người dùng.
4. Extension chỉ giữ `apiBaseUrl` trong setting thông thường và API key trong SecretStorage.
5. MVP không bắt buộc D1/KV/R2/Vectorize. Không thêm dịch vụ chỉ để làm kiến trúc phức tạp hơn.
6. Worker không được nhận hoặc thực thi lệnh shell.
7. Worker không lưu prompt, source code hoặc response vào database/log mặc định.
8. Mọi thay đổi source code phải được preview và người dùng chủ động Apply.

### 2.5. Giả định và ràng buộc

- Người dùng có tài khoản Cloudflare và tự triển khai Worker.
- Người dùng có kết nối Internet khi sử dụng inference.
- Extension host tương thích với API mà extension sử dụng; điều này phải được chứng minh bằng compatibility spike.
- Workers AI model catalog, giới hạn và giá có thể thay đổi; model ID/quota không được hard-code vào UI như cam kết vĩnh viễn.
- Free plan không đảm bảo SLA, throughput hoặc khả năng truy cập model không giới hạn.
- Dung lượng context gửi đi là nội dung rời khỏi máy người dùng. Extension phải thông báo rõ trước lần gửi đầu tiên và cung cấp cơ chế opt-out.

---

## 3. Người dùng, use case và luồng chính

### 3.1. Use case

| ID | Actor | Use case | Kết quả |
|---|---|---|---|
| UC-01 | Developer | Mở NesCode | Chat panel được khởi tạo |
| UC-02 | Developer | Cấu hình Worker URL và API key | Extension kết nối được backend |
| UC-03 | Developer | Kiểm tra kết nối | Nhận trạng thái backend/model |
| UC-04 | Developer | Chat | Nhận câu trả lời từ model |
| UC-05 | Developer | Explain Selection | AI giải thích đoạn code được chọn |
| UC-06 | Developer | Explain Active File | AI giải thích file đang mở |
| UC-07 | Developer | Fix Code | Nhận đề xuất sửa và diff preview |
| UC-08 | Developer | Apply/Reject Patch | Chấp nhận hoặc từ chối thay đổi |
| UC-09 | Developer | Generate Tests | Nhận mã test được đề xuất |
| UC-10 | Developer | Chọn file context | Chỉ file được chọn mới được đưa vào request |
| UC-11 | Developer | Xem usage và lỗi quota | Hiểu trạng thái sử dụng AI |
| UC-12 | Maintainer | Deploy Worker | Backend chạy trên tài khoản Cloudflare riêng |

### 3.2. Luồng cấu hình lần đầu

1. Người dùng deploy Worker theo README.
2. Người dùng thiết lập Worker secret `NESCODE_API_KEY`.
3. Người dùng mở Antigravity và chạy `NesCode: Configure Connection`.
4. Người dùng nhập HTTPS Worker URL.
5. Người dùng nhập API key; extension lưu bằng SecretStorage.
6. Extension gọi `GET /v1/health`.
7. Nếu hợp lệ, extension hiển thị trạng thái Connected và model mặc định.
8. Nếu thất bại, hiển thị nguyên nhân và hướng khắc phục, không in API key ra log.

### 3.3. Luồng Chat

1. Người dùng nhập prompt.
2. Extension kiểm tra prompt rỗng, độ dài và trạng thái cấu hình.
3. Extension tạo request ID.
4. Extension gửi messages đã giới hạn và context được chọn.
5. Worker xác thực, validate và gọi model.
6. Worker trả streaming events hoặc JSON.
7. Extension render Markdown an toàn; HTML trong nội dung model phải được sanitize.
8. Extension lưu lịch sử chat local theo workspace nếu chức năng history được bật.

### 3.4. Luồng Fix Code

1. Người dùng chọn đoạn code hoặc chọn file.
2. Người dùng cung cấp yêu cầu sửa.
3. Extension gửi context theo allowlist.
4. Model trả lời theo schema kết quả fix.
5. Extension validate schema và đường dẫn file.
6. Extension tạo diff preview, không ghi trực tiếp vào file.
7. Người dùng chọn Apply hoặc Reject.
8. Khi Apply, extension xác nhận nội dung file trên đĩa chưa thay đổi ngoài dự kiến; nếu file đã đổi, yêu cầu tạo diff mới.
9. Extension ghi patch qua API file của IDE, sau khi kiểm tra URI nằm trong workspace được phép.

### 3.5. Luồng lỗi quota

1. Worker AI trả lỗi quota/limit/out-of-capacity.
2. Worker chuẩn hóa thành mã lỗi `AI_QUOTA_EXCEEDED` hoặc `AI_CAPACITY_UNAVAILABLE` khi có thể xác định.
3. Extension hiển thị thông báo, không retry vô hạn.
4. Extension gợi ý giảm context, giảm output limit hoặc đợi quota reset/kiểm tra Cloudflare dashboard.
5. Không tự động đổi sang model trả phí.

---

## 4. Yêu cầu chức năng (Functional Requirements)

### 4.1. Extension lifecycle và compatibility

| ID | Ưu tiên | Yêu cầu | Tiêu chí kiểm thử |
|---|---|---|---|
| FR-001 | P0 | Extension phải activate thành công trên Extension Host mục tiêu. | Cài VSIX, mở workspace, không có activation error. |
| FR-002 | P0 | Extension phải có compatibility smoke test riêng trên Antigravity IDE. | Xác nhận command, Webview, SecretStorage và Workspace API hoạt động. |
| FR-003 | P0 | Extension chỉ sử dụng public VS Code Extension API trong MVP. | Không import module nội bộ/private của Antigravity. |
| FR-004 | P0 | Extension đăng ký command `nescode.openChat`. | Command mở/focus chat panel. |
| FR-005 | P0 | Extension đăng ký command `nescode.configureConnection`. | Chạy được cấu hình URL và key. |
| FR-006 | P0 | Extension đăng ký command `nescode.checkConnection`. | Gọi health endpoint và hiển thị trạng thái. |
| FR-007 | P1 | Extension hỗ trợ Windows, Linux và macOS nếu host hỗ trợ. | Smoke test trên các nền tảng có sẵn. |

### 4.2. Chat UI

| ID | Ưu tiên | Yêu cầu | Tiêu chí kiểm thử |
|---|---|---|---|
| FR-010 | P0 | Có chat panel riêng. | Panel mở từ Activity Bar/command. |
| FR-011 | P0 | Gửi prompt bằng nút Send và shortcut phù hợp. | Prompt được gửi đúng một lần. |
| FR-012 | P0 | Hiển thị Markdown, code fence và danh sách. | Code block hiển thị đúng; không thực thi HTML từ model. |
| FR-013 | P0 | Hiển thị trạng thái Idle, Connecting, Streaming, Completed, Error. | UI chuyển trạng thái đúng theo request lifecycle. |
| FR-014 | P0 | Có nút Stop/Cancel generation. | Client abort request; backend/model cancellation tùy khả năng runtime. |
| FR-015 | P1 | Lưu lịch sử hội thoại local theo workspace. | Sau restart có thể mở lại lịch sử; dữ liệu chỉ local. |
| FR-016 | P1 | Xóa lịch sử hội thoại. | Người dùng có thể xóa một conversation hoặc toàn bộ local history. |
| FR-017 | P1 | Có nút Copy response. | Copy nội dung văn bản, không chứa metadata nội bộ. |
| FR-018 | P1 | Có retry cho request lỗi tạm thời. | Chỉ retry lỗi đủ điều kiện, tối đa cấu hình mặc định 1 lần. |

### 4.3. Context collection

| ID | Ưu tiên | Yêu cầu | Tiêu chí kiểm thử |
|---|---|---|---|
| FR-020 | P0 | Hỗ trợ context từ editor selection. | Chỉ nội dung được chọn được thu thập. |
| FR-021 | P0 | Hỗ trợ context từ active file. | Gửi đường dẫn tương đối, ngôn ngữ và nội dung trong giới hạn. |
| FR-022 | P0 | Người dùng có thể chủ động chọn file bổ sung. | Chỉ file đã chọn được thêm vào request. |
| FR-023 | P0 | Không tự động gửi toàn bộ workspace. | Không có recursive upload mặc định. |
| FR-024 | P0 | Bỏ qua file theo exclude patterns. | `.env`, key, credentials, binary, dependency/build dirs bị loại. |
| FR-025 | P0 | Có tổng context budget. | Request vượt ngưỡng bị cắt có kiểm soát hoặc báo người dùng. |
| FR-026 | P0 | Phân biệt file text và binary. | Binary không được decode rồi gửi ngẫu nhiên. |
| FR-027 | P0 | Chặn path traversal và file ngoài workspace. | `../` hoặc URI ngoài workspace không được đưa vào context/patch. |
| FR-028 | P1 | Hỗ trợ `.nescodeignore`. | Pattern tương thích glob cơ bản; README mô tả cú pháp. |
| FR-029 | P1 | Người dùng có thể xem context preview trước khi gửi. | Preview liệt kê path, size và nội dung sẽ gửi. |

**Exclude mặc định tối thiểu:**

```text
.env
.env.*
!.env.example
**/*.pem
**/*.key
**/*private_key*
**/*credentials*
**/*secret*
**/.ssh/**
**/.aws/**
**/.config/gcloud/**
**/node_modules/**
**/.git/**
**/dist/**
**/build/**
**/coverage/**
**/.next/**
**/.venv/**
**/venv/**
**/target/**
**/__pycache__/**
```

Danh sách trên chỉ là lớp lọc mặc định, không phải bảo đảm phát hiện toàn bộ secrets. Không được dựa riêng vào pattern matching để cam kết dữ liệu nhạy cảm luôn bị loại.

### 4.4. Coding actions

| ID | Ưu tiên | Yêu cầu | Tiêu chí kiểm thử |
|---|---|---|---|
| FR-030 | P0 | Explain Selection. | Gửi selection với ngôn ngữ/path và trả lời giải thích. |
| FR-031 | P0 | Explain Active File. | Gửi active file nếu người dùng xác nhận/đã bật chức năng. |
| FR-032 | P0 | Fix Code trả về patch proposal, không sửa trực tiếp. | Kết quả hiển thị diff trước Apply. |
| FR-033 | P0 | Validate đường dẫn patch nằm trong workspace. | Patch chứa absolute path ngoài workspace bị từ chối. |
| FR-034 | P0 | Apply và Reject patch riêng biệt. | Reject không thay đổi file; Apply chỉ áp dụng patch đã xem. |
| FR-035 | P0 | Kiểm tra file version/content trước Apply. | File bị thay đổi từ lúc preview sẽ yêu cầu re-preview. |
| FR-036 | P1 | Generate Tests. | Đầu ra được hiển thị như code/patch, không tự động chạy. |
| FR-037 | P1 | Tạo test file mới qua preview. | Có thể xem diff tạo file mới trước khi ghi. |
| FR-038 | P2 | Multi-file patch. | Chỉ bật sau khi format và validation multi-file được kiểm thử. |

### 4.5. Backend/Cloudflare integration

| ID | Ưu tiên | Yêu cầu | Tiêu chí kiểm thử |
|---|---|---|---|
| FR-040 | P0 | Worker cung cấp `GET /v1/health`. | Trả health payload không tiết lộ secret. |
| FR-041 | P0 | Worker cung cấp `GET /v1/models`. | Trả allowlist model và model mặc định. |
| FR-042 | P0 | Worker cung cấp `POST /v1/chat`. | Validate request và gọi Workers AI. |
| FR-043 | P0 | Worker yêu cầu Bearer API key hợp lệ. | Thiếu/sai key trả 401. |
| FR-044 | P0 | Worker chỉ gọi model nằm trong allowlist. | Model ID tùy ý từ client bị từ chối. |
| FR-045 | P0 | Worker tạo system prompt phía server. | Client không thể thay system policy bằng role message. |
| FR-046 | P0 | Worker giới hạn input/output. | Request vượt giới hạn bị từ chối với 413/400 phù hợp. |
| FR-047 | P0 | Worker chuẩn hóa lỗi Workers AI. | UI nhận mã lỗi ổn định, không nhận stack trace. |
| FR-048 | P0 | Worker không log prompt/source code mặc định. | Unit test/log review xác nhận không ghi payload. |
| FR-049 | P1 | Worker hỗ trợ streaming. | Client nhận event delta theo thứ tự. |
| FR-050 | P1 | Worker hỗ trợ JSON response fallback. | Streaming tắt vẫn trả response hợp lệ. |
| FR-051 | P1 | Worker có request correlation ID. | Mỗi request/response có `requestId`. |

### 4.6. Usage và cài đặt

| ID | Ưu tiên | Yêu cầu | Tiêu chí kiểm thử |
|---|---|---|---|
| FR-060 | P0 | Hiển thị trạng thái API connection. | Connected/Disconnected/Error rõ ràng. |
| FR-061 | P0 | Thông báo lỗi quota/capacity. | Không hiển thị chung chung “unknown error” nếu phân loại được. |
| FR-062 | P0 | Không tự động chuyển model trả phí. | Model router chỉ chọn allowlist cấu hình. |
| FR-063 | P1 | Hiển thị token/Neurons usage nếu provider trả về. | Trường không có thì hiển thị “không được cung cấp”. |
| FR-064 | P1 | Cấu hình max context và max output. | Giá trị ngoài khoảng cho phép bị từ chối. |
| FR-065 | P1 | Cấu hình model mặc định qua Worker vars. | Không cần build lại extension khi đổi model allowlisted. |

---

## 5. Yêu cầu phi chức năng (Non-Functional Requirements)

### 5.1. Bảo mật

| ID | Mức | Yêu cầu |
|---|---|---|
| NFR-SEC-001 | MUST | Chỉ dùng HTTPS cho endpoint Worker; từ chối URL HTTP trừ localhost trong môi trường dev. |
| NFR-SEC-002 | MUST | API key extension lưu bằng SecretStorage của IDE, không lưu trong `settings.json`, globalState hoặc log. |
| NFR-SEC-003 | MUST | Cloudflare Account API Token không bao giờ được nhúng vào extension/package/repository. |
| NFR-SEC-004 | MUST | Worker secret `NESCODE_API_KEY` chỉ được quản lý bằng Cloudflare secret mechanism. |
| NFR-SEC-005 | MUST | So sánh API key theo cách hạn chế timing leakage; không phản hồi lại key hoặc một phần key. |
| NFR-SEC-006 | MUST | Không đưa secret, API key hay raw request payload vào exception telemetry. |
| NFR-SEC-007 | MUST | Render model output dưới dạng text/Markdown đã sanitize; không chạy script hoặc HTML tùy ý. |
| NFR-SEC-008 | MUST | Patch chỉ được áp dụng vào file URI nằm trong workspace root được người dùng cho phép. |
| NFR-SEC-009 | MUST | Không tự động thực thi shell/tool calls do model trả về. |
| NFR-SEC-010 | MUST | Worker validate schema, field length, message roles, model ID và request body size. |
| NFR-SEC-011 | MUST | Worker không lưu nội dung prompt/code/response vào persistent storage trong MVP. |
| NFR-SEC-012 | MUST | CORS không được xem là cơ chế xác thực. Bearer API key là lớp xác thực bắt buộc. |
| NFR-SEC-013 | SHOULD | Có cơ chế rotate/revoke API key bằng Cloudflare secret update và cập nhật SecretStorage. |
| NFR-SEC-014 | SHOULD | Có thông báo quyền riêng tư trước lần gửi context đầu tiên. |

### 5.2. Quyền riêng tư và xử lý dữ liệu

- Mặc định chỉ selection, active file hoặc file do người dùng chọn được gửi.
- Không gửi workspace tree hoặc nội dung file nền tự động.
- Không có upload repository/background indexing trong MVP.
- Không lưu code trên Worker/D1/KV/R2.
- Không ghi body request/response vào log.
- History (nếu bật) chỉ lưu local trong storage extension và phải có chức năng xóa.
- Người dùng chịu trách nhiệm xem context preview và không gửi code/dữ liệu họ không có quyền chia sẻ.
- Cần ghi rõ dữ liệu được gửi tới Cloudflare Workers AI để inference; việc model có chính sách zero data retention không thay thế nghĩa vụ bảo vệ dữ liệu ở extension, Worker và log.

### 5.3. Hiệu năng

| ID | Chỉ tiêu mục tiêu |
|---|---|
| NFR-PERF-001 | Extension activation không thực hiện network call blocking. |
| NFR-PERF-002 | Chat panel hiển thị trong vòng 1 giây sau khi command chạy trên workspace thông thường (mục tiêu; không bao gồm cold start của host). |
| NFR-PERF-003 | Worker CPU logic phải nhẹ; không parse hoặc transform repository lớn ở edge. |
| NFR-PERF-004 | Context mặc định tối đa 12.000 token ước lượng; configurable, hard cap mặc định 20.000 token ước lượng cho MVP. |
| NFR-PERF-005 | Output mặc định tối đa 1.500 tokens; configurable trong một khoảng an toàn. |
| NFR-PERF-006 | Extension không đọc đệ quy toàn bộ workspace trong MVP. |
| NFR-PERF-007 | Streaming UI render incrementally, tránh re-render toàn bộ transcript mỗi token. |

Các giá trị token là giới hạn ứng dụng để kiểm soát quota, không phải token limit tối đa của GLM-4.7-Flash.

### 5.4. Độ tin cậy

- Timeout mặc định cho kết nối Worker: 10 giây; timeout inference: 120 giây, có thể điều chỉnh.
- Không retry lỗi 400, 401, 403, 413 hoặc quota.
- Retry tối đa một lần với lỗi mạng tạm thời/429/5xx khi có thể, có jitter/backoff và tôn trọng `Retry-After`.
- Khi stream lỗi giữa chừng, giữ phần text đã nhận và hiển thị trạng thái interrupted.
- Hủy request phía client bằng AbortController khi người dùng nhấn Stop hoặc đóng panel. Việc hủy inference ở phía server phụ thuộc khả năng runtime/provider; không được cam kết chắc chắn rằng inference đã dừng.
- Worker trả lỗi JSON chuẩn, không trả stack trace.

### 5.5. Khả năng bảo trì

- TypeScript strict mode.
- Shared API types giữa Worker và extension.
- Unit tests cho context filtering, budgeter, API validation và response parser.
- Không để logic UI phụ thuộc trực tiếp vào Cloudflare SDK.
- Có abstraction `ModelProvider` để thay model/provider trong tương lai.
- Có changelog và Semantic Versioning.
- Các biến môi trường, model ID, giới hạn context phải được cấu hình tập trung.

### 5.6. Khả năng tương thích

- Extension ưu tiên public VS Code Extension API.
- Phiên bản engine và `engines.vscode` phải được chốt sau compatibility spike với Antigravity IDE.
- Không tuyên bố tương thích tất cả VS Code forks trước khi có kiểm thử.
- Webview phải hỗ trợ CSP nghiêm ngặt và không load script từ CDN không cần thiết.

### 5.7. Khả năng truy cập và UX

- Các button có tooltip/accessible label.
- Có keyboard navigation cho chat input và action controls.
- Lỗi phải kèm hướng khắc phục cụ thể.
- Màu trạng thái không phải tín hiệu duy nhất; luôn có text label.
- Có trạng thái Empty, Loading, Streaming, Error và Offline.

---

## 6. Thiết kế giao diện

### 6.1. Chat panel

Các vùng UI:

1. Header: tên NesCode, trạng thái kết nối, model hiện tại.
2. Transcript: user/assistant messages, Markdown, code blocks.
3. Context chips: selection/file(s) được đính kèm.
4. Composer: textarea, Send, Stop, Attach Context.
5. Footer: usage nếu có, thông báo Free quota và trạng thái backend.

### 6.2. Context picker

- Hiển thị file path tương đối, dung lượng và lý do bị exclude.
- Không tự động tick file chưa được người dùng chọn.
- Cho phép remove file trước khi gửi.
- Có preview số ký tự/token ước lượng.

### 6.3. Diff review

- Hiển thị file path, additions/deletions và unified diff.
- Có nút Apply và Reject.
- Với MVP, chỉ hỗ trợ patch cho một file trong một thao tác fix đầu tiên.
- Không áp dụng patch nếu base document version đã thay đổi.
- Không tự động format hoặc sửa các file khác ngoài patch.

### 6.4. Settings

| Setting | Kiểu | Mặc định | Ghi chú |
|---|---|---|---|
| `nescode.apiBaseUrl` | string | rỗng | Worker URL, không chứa key |
| `nescode.defaultMode` | enum | `chat` | chat/explain/fix/tests |
| `nescode.maxContextTokens` | number | 12000 | Budget mặc định |
| `nescode.maxOutputTokens` | number | 1500 | Giới hạn output |
| `nescode.requestTimeoutMs` | number | 120000 | Timeout inference |
| `nescode.enableLocalHistory` | boolean | true | Chỉ lưu local |
| `nescode.showContextPreview` | boolean | true | Preview trước khi gửi |
| `nescode.excludePatterns` | string[] | default patterns | Bổ sung ignore patterns |
| `nescode.streamResponses` | boolean | true | Fallback JSON nếu stream không hỗ trợ |

API key không được khai báo thành setting thông thường. Phải sử dụng SecretStorage.

---

## 7. API Specification

### 7.1. Quy tắc chung

- Base URL: `https://<worker-name>.<account-subdomain>.workers.dev` hoặc custom domain HTTPS.
- API prefix: `/v1`.
- Request/response: UTF-8 JSON, trừ SSE stream.
- Authentication: `Authorization: Bearer <NESCODE_API_KEY>`.
- Correlation: `X-Request-ID: <uuid>`; Worker có thể tạo ID nếu client không gửi.
- Không chấp nhận API key qua query string.
- Không đưa prompt vào URL.
- Body size giới hạn ở mức cấu hình; mặc định ứng dụng 256 KiB.

### 7.2. `GET /v1/health`

**Mục đích:** kiểm tra kết nối và trạng thái Worker. Endpoint có thể cho phép unauthenticated ở mức health tối thiểu, nhưng không được tiết lộ thông tin nhạy cảm. Khuyến nghị yêu cầu auth thống nhất với MVP.

Request headers:

```http
GET /v1/health HTTP/1.1
Authorization: Bearer <API_KEY>
Accept: application/json
```

Response `200`:

```json
{
  "ok": true,
  "service": "nescode-worker",
  "apiVersion": "v1",
  "defaultModel": "@cf/zai-org/glm-4.7-flash",
  "streamingEnabled": true,
  "timestamp": "2026-11-11T12:00:00.000Z"
}
```

Không trả account ID, Worker secret, Cloudflare token hoặc thông tin cấu hình bí mật.

### 7.3. `GET /v1/models`

**Mục đích:** trả danh sách model mà deployment cho phép client yêu cầu.

Response `200`:

```json
{
  "defaultModel": "@cf/zai-org/glm-4.7-flash",
  "models": [
    {
      "id": "@cf/zai-org/glm-4.7-flash",
      "label": "GLM-4.7-Flash",
      "capabilities": ["chat", "reasoning", "function_calling"],
      "enabled": true
    }
  ]
}
```

Danh sách trên là allowlist cấu hình của Worker, không có nghĩa extension được tự do gọi mọi model trong catalog.

### 7.4. `POST /v1/chat`

**Mục đích:** gửi prompt/context đến model và nhận phản hồi.

Request JSON:

```json
{
  "requestId": "4f6e5e9b-6b21-4a84-b0e2-45dca08e5c80",
  "mode": "chat",
  "model": "@cf/zai-org/glm-4.7-flash",
  "messages": [
    { "role": "user", "content": "Giải thích đoạn code này." },
    { "role": "assistant", "content": "Đoạn code..." },
    { "role": "user", "content": "Hãy đề xuất cách cải thiện." }
  ],
  "context": {
    "selection": {
      "path": "src/example.ts",
      "language": "typescript",
      "content": "const value = 1;"
    },
    "files": [
      {
        "path": "src/helper.ts",
        "language": "typescript",
        "content": "export function helper() {}"
      }
    ]
  },
  "options": {
    "stream": true,
    "maxOutputTokens": 1500,
    "temperature": 0.2
  }
}
```

**Quy tắc validation:**

- `mode`: một trong `chat | explain | fix | generate_tests`.
- `model`: optional; nếu gửi phải thuộc allowlist Worker.
- `messages`: bắt buộc có ít nhất một user message.
- Client chỉ được gửi role `user` và `assistant`; Worker loại bỏ hoặc từ chối `system`, `developer`, `tool` và role khác.
- Worker không tin system prompt do client gửi.
- `context.selection.content` và mỗi file content có giới hạn riêng.
- `path` phải là relative path đã chuẩn hóa, không chứa `..`, không chứa URI scheme và không là absolute path.
- Tổng request payload không vượt body limit.
- `maxOutputTokens` bị clamp theo giới hạn Worker; client không được tùy ý tăng vô hạn.
- `temperature` bị clamp trong khoảng model hỗ trợ và khoảng do Worker cấu hình.
- Không nhận executable tool definitions từ client trong MVP.

### 7.5. JSON response khi `stream=false`

```json
{
  "requestId": "4f6e5e9b-6b21-4a84-b0e2-45dca08e5c80",
  "ok": true,
  "model": "@cf/zai-org/glm-4.7-flash",
  "output": {
    "role": "assistant",
    "content": "Đây là phần giải thích..."
  },
  "usage": {
    "inputTokens": null,
    "outputTokens": null,
    "neurons": null
  },
  "timing": {
    "totalMs": 12400
  }
}
```

Các trường usage được phép `null` nếu Workers AI không trả về số liệu tương ứng. Không được ước lượng rồi trình bày như usage thực.

### 7.6. SSE response khi `stream=true`

Response headers:

```http
Content-Type: text/event-stream; charset=utf-8
Cache-Control: no-cache, no-transform
X-Accel-Buffering: no
```

Event contract chuẩn hóa:

```text
event: meta
data: {"requestId":"...","model":"@cf/zai-org/glm-4.7-flash"}

event: delta
data: {"text":"Xin chào"}

event: delta
data: {"text":" bạn"}

event: usage
data: {"inputTokens":null,"outputTokens":null,"neurons":null}

event: done
data: {"requestId":"..."}
```

Error event:

```text
event: error
data: {"code":"AI_CAPACITY_UNAVAILABLE","message":"Model hiện không khả dụng.","retryable":true}
```

Quy tắc:

- Worker adapter phải chuyển format stream gốc của model sang contract trên.
- Không chuyển tiếp thông tin nội bộ/stack trace.
- Client phải parse event theo dòng, xử lý chunk bị chia giữa hai lần read và kết thúc stream sạch.
- Nếu model/provider không stream được, Worker có thể trả JSON fallback khi client cho phép.

### 7.7. Error contract

Mọi lỗi JSON ngoài stream dùng cấu trúc:

```json
{
  "requestId": "...",
  "ok": false,
  "error": {
    "code": "AI_QUOTA_EXCEEDED",
    "message": "Đã đạt giới hạn Workers AI của tài khoản.",
    "retryable": false
  }
}
```

Mã lỗi tối thiểu:

| HTTP | Code | Ý nghĩa | Retry |
|---:|---|---|---|
| 400 | `INVALID_REQUEST` | Body/field không hợp lệ | No |
| 401 | `UNAUTHORIZED` | Thiếu/sai API key | No |
| 403 | `MODEL_NOT_ALLOWED` | Model không thuộc allowlist hoặc không có entitlement | No |
| 404 | `NOT_FOUND` | Endpoint không tồn tại | No |
| 413 | `PAYLOAD_TOO_LARGE` | Body/context vượt giới hạn | No |
| 429 | `RATE_LIMITED` | Request bị rate limit | Có điều kiện |
| 429/403/503* | `AI_QUOTA_EXCEEDED` | Vượt quota Workers AI | No; hiển thị quota |
| 503 | `AI_CAPACITY_UNAVAILABLE` | Model tạm hết capacity | Có điều kiện |
| 504 | `AI_TIMEOUT` | Inference timeout | Có điều kiện, tối đa 1 retry |
| 500 | `INTERNAL_ERROR` | Lỗi không dự kiến | Có điều kiện, tối đa 1 retry |

`*` Worker phải map dựa trên HTTP status và error metadata thực tế từ Cloudflare; không được chỉ dựa vào status code nếu status dùng chung cho nhiều loại lỗi.

---

## 8. Model và quản lý quota

### 8.1. Model mặc định

MVP dùng model ID cấu hình mặc định:

```text
@cf/zai-org/glm-4.7-flash
```

Model router phải đọc model ID từ cấu hình Worker và allowlist. Không hard-code model ID ở nhiều module.

### 8.2. Quota Cloudflare Free

Theo tài liệu Cloudflare được kiểm tra ngày 2026-11-11:

- Workers Free: 100.000 request/ngày.
- Workers Free CPU time: 10 ms cho mỗi invocation HTTP. Đây là CPU time của Worker code, không phải cam kết tổng thời gian inference.
- Workers AI Free allocation: 10.000 Neurons/ngày; reset lúc 00:00 UTC.
- GLM-4.7-Flash được Cloudflare nêu trong nhóm model vẫn có thể truy cập trên Workers Free trong cập nhật ngày 2026-07-28.
- Giá/usage model được Cloudflare hiển thị theo đơn vị token và Neurons; mức tiêu thụ phụ thuộc input/output token.

Các con số này là thông tin tham chiếu tại ngày lập tài liệu, phải kiểm tra lại khi deploy/release. Khi vượt quota Free, request có thể thất bại; không thiết kế giả định tự động tính phí hoặc tự động nâng cấp.

### 8.3. Chiến lược tiết kiệm quota

- Default context budget 12.000 tokens ước lượng.
- Default output cap 1.500 tokens.
- Không gửi file không liên quan.
- Không gửi trùng lặp nội dung đã có trong cùng request.
- History gửi lên chỉ giữ số lượt gần nhất trong budget.
- Có thể thêm context summarization local hoặc server-side trong bản sau; không gọi thêm model chỉ để summarize trong MVP.
- Không tự động retry inference khi quota đã hết.
- Có thể cung cấp preset `Compact`, `Balanced`, `Large Context` nhưng chỉ `Compact` và `Balanced` được bật mặc định.

### 8.4. Usage reporting

- Worker trả usage provider nếu có.
- Extension phân biệt `reported` và `unavailable`.
- Nếu model không trả Neurons chính xác, UI dẫn người dùng đến Cloudflare dashboard thay vì tự tính usage giả định.
- Không lưu usage ở backend trong MVP.

---

## 9. Cloudflare deployment specification

### 9.1. Binding

Worker sử dụng Workers AI binding có tên `AI`.

Ví dụ cấu hình `wrangler.jsonc` (cần đồng bộ với Wrangler version sử dụng):

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "nescode-ai-gateway",
  "main": "src/index.ts",
  "compatibility_date": "2026-11-11",
  "ai": {
    "binding": "AI"
  },
  "vars": {
    "DEFAULT_MODEL": "@cf/zai-org/glm-4.7-flash",
    "MAX_BODY_BYTES": "262144",
    "MAX_OUTPUT_TOKENS": "1500",
    "ENABLE_STREAMING": "true"
  }
}
```

Không commit secret vào file cấu hình. Giá trị `compatibility_date` phải được maintainer cập nhật theo thời điểm deploy và phiên bản Cloudflare Workers runtime.

### 9.2. Worker secret

Secret bắt buộc:

```bash
npx wrangler secret put NESCODE_API_KEY
```

Không lưu giá trị secret trong `.env.example` thật, screenshot, issue, CI log hoặc repository. `.dev.vars.example` chỉ chứa placeholder.

### 9.3. Lệnh triển khai dự kiến

```bash
npm install
npx wrangler login
npx wrangler secret put NESCODE_API_KEY
npx wrangler deploy
```

Sau deploy, cấu hình Worker URL và API key trong extension.

### 9.4. Free-first design

MVP chỉ bắt buộc:

- Workers Free.
- Workers AI Free allocation.

Không bắt buộc D1, KV, R2, Vectorize, Durable Objects, Pages hoặc domain trả phí. Nếu người dùng thêm custom domain thì chi phí domain do người dùng tự chịu.

Không dùng dịch vụ có thể tạo phí mà không có cảnh báo/giải thích. Nếu sau này thêm dịch vụ, README phải nêu rõ free allowance, giới hạn và điều kiện billing tại ngày release.

### 9.5. BYO Worker provisioning

Mỗi người dùng triển khai một Worker instance riêng. Extension package không chứa endpoint dùng chung của tác giả làm mặc định.

Lợi ích:

- Quota gắn với Cloudflare account của người dùng.
- Không để tác giả extension trả chi phí inference cho cộng đồng.
- Người dùng kiểm soát API key/model.
- Có thể rotate/redeploy độc lập.

MVP không cung cấp OAuth onboarding hoặc tự động tạo Worker. Người dùng deploy bằng Wrangler CLI theo README.

---

## 10. Extension implementation specification

### 10.1. Technology stack

| Layer | Công nghệ đề xuất |
|---|---|
| Language | TypeScript |
| Runtime | VS Code Extension Host API |
| UI | Webview + TypeScript/HTML/CSS hoặc framework nhẹ |
| Build | esbuild |
| Tests | Vitest + VS Code Extension Test Runner |
| Lint/format | ESLint + Prettier |
| Package | `vsce` |
| Network | Fetch API hoặc wrapper có AbortController |

Không chọn React/Vue ngay nếu chat UI đơn giản; tránh tăng kích thước bundle và độ phức tạp.

### 10.2. Folder structure

```text
nescode-antigravity/
├── extension/
│   ├── package.json
│   ├── tsconfig.json
│   ├── esbuild.js
│   └── src/
│       ├── extension.ts
│       ├── commands/
│       │   ├── openChat.ts
│       │   ├── configureConnection.ts
│       │   ├── checkConnection.ts
│       │   ├── explainSelection.ts
│       │   ├── fixSelection.ts
│       │   └── generateTests.ts
│       ├── providers/
│       │   └── ChatViewProvider.ts
│       ├── context/
│       │   ├── contextCollector.ts
│       │   ├── contextFilter.ts
│       │   ├── contextBudgeter.ts
│       │   ├── pathValidator.ts
│       │   └── nescodeIgnore.ts
│       ├── api/
│       │   ├── workerClient.ts
│       │   ├── sseParser.ts
│       │   ├── schemas.ts
│       │   └── errors.ts
│       ├── diff/
│       │   ├── patchParser.ts
│       │   ├── diffPreview.ts
│       │   └── applyPatch.ts
│       ├── security/
│       │   ├── secretStorage.ts
│       │   └── webviewSecurity.ts
│       ├── history/
│       │   └── localConversationStore.ts
│       └── utils/
│           ├── logger.ts
│           └── tokenEstimate.ts
│
├── cloudflare/
│   ├── wrangler.jsonc
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       ├── routes/
│       │   ├── health.ts
│       │   ├── models.ts
│       │   └── chat.ts
│       ├── middleware/
│       │   ├── auth.ts
│       │   ├── requestId.ts
│       │   └── validateBody.ts
│       ├── ai/
│       │   ├── modelRouter.ts
│       │   ├── promptBuilder.ts
│       │   ├── streamAdapter.ts
│       │   └── responseNormalizer.ts
│       ├── schemas/
│       │   └── chatRequest.ts
│       ├── security/
│       │   ├── apiKey.ts
│       │   └── safeErrors.ts
│       └── utils/
│           ├── json.ts
│           └── timing.ts
│
├── shared/
│   └── src/
│       ├── api-types.ts
│       ├── error-codes.ts
│       └── constants.ts
├── docs/
│   ├── PRIVACY.md
│   ├── DEPLOYMENT.md
│   └── COMPATIBILITY.md
├── tests/
│   ├── fixtures/
│   └── e2e/
├── .github/workflows/
├── .gitignore
├── README.md
├── LICENSE
└── SRS.md
```

Đây là cấu trúc tham chiếu. Có thể dùng npm workspaces hoặc tách extension/cloudflare thành package riêng; không tạo circular dependency. `shared` chỉ chứa type/constants thuần, không phụ thuộc runtime IDE hoặc Cloudflare.

### 10.3. Extension package contributions

MVP cần đóng góp tối thiểu:

- Activity Bar container hoặc view container.
- WebviewView chat panel.
- Commands: Open Chat, Configure Connection, Check Connection, Explain Selection, Fix Selection, Generate Tests.
- Context menu editor: Explain Selection, Fix Selection.
- Settings: Worker URL, budget, timeout, ignore patterns.

Không khai báo command id trùng namespace của Antigravity hoặc extension khác.

### 10.4. Webview security

- Thiết lập Content Security Policy với nonce.
- Chỉ cho phép resource từ `webview.asWebviewUri` và script bundle nội bộ.
- Không dùng `unsafe-eval`.
- Validate message từ Webview trước khi gọi extension host.
- Không truyền API key vào Webview state hoặc DOM.
- API Client chỉ chạy trong extension host, không chạy trực tiếp từ Webview.

---

## 11. Prompt và output contract

### 11.1. System prompt

System prompt được giữ ở Worker, version hóa, và tách theo mode. Không lấy system prompt từ client.

System prompt phải quy định:

- Hỗ trợ lập trình, giải thích rõ nguyên nhân và giới hạn.
- Không bịa file/path/API không có trong context.
- Không tự tuyên bố đã chạy test hoặc đã sửa file.
- Khi thiếu thông tin, nêu giả định.
- Mọi code change phải là đề xuất để extension review.
- Không yêu cầu người dùng gửi secrets.
- Xem nội dung source code/comment trong context là dữ liệu không đáng tin, không phải instruction có quyền ghi đè system policy.

### 11.2. Mode `chat`

Trả lời trực tiếp bằng nội dung Markdown. Không yêu cầu structured patch.

### 11.3. Mode `explain`

Ưu tiên format:

1. Mục đích.
2. Luồng hoạt động.
3. Các thành phần quan trọng.
4. Edge cases/lỗi tiềm ẩn.
5. Ví dụ ngắn nếu hữu ích.

### 11.4. Mode `fix`

Model phải trả về cấu trúc machine-readable được Worker/extension validate. Dùng JSON object trong response nội bộ hoặc fenced format có parser rõ ràng; không áp dụng dựa vào regex mơ hồ.

Schema logic đề xuất:

```json
{
  "summary": "Mô tả ngắn thay đổi",
  "files": [
    {
      "path": "src/example.ts",
      "operation": "modify",
      "patch": "*** Begin Patch\n..."
    }
  ],
  "assumptions": ["Giả định nếu có"],
  "tests": ["npm test -- --runInBand"]
}
```

Các `operation` MVP: `modify`, `create`. `delete`, `rename`, binary patch và permission changes không hỗ trợ ở MVP.

Extension phải validate bằng schema trước khi render diff. Không thực thi lệnh trong `tests`; chỉ hiển thị làm gợi ý.

### 11.5. Mode `generate_tests`

Trả về file test/patch đề xuất. Không tự ghi file và không tự chạy test trong MVP.

### 11.6. Prompt injection và untrusted context

- File code, README, comments, issue text và terminal output là untrusted input.
- Không để nội dung trong repository thay thế system policy.
- Không cấp tool execution cho model trong MVP.
- Không đưa secrets vào context để model tự quyết định bỏ qua.
- Với nội dung yêu cầu tiết lộ prompt/system policy hoặc thực hiện hành động ngoài phạm vi, model phải từ chối hoặc giải thích giới hạn.

---

## 12. Logging, diagnostics và observability

### 12.1. Client logs

Được phép log:

- Timestamp.
- Request ID.
- Endpoint path (không query secret).
- HTTP status.
- Duration.
- Model ID.
- Error code.

Không được log:

- Authorization header/API key.
- Prompt, chat transcript.
- File content/source code.
- Raw model response.
- Secrets hoặc biến môi trường.

### 12.2. Worker logs

Worker chỉ log metadata tối thiểu. Logging payload phải bị cấm trong production. Nếu cần debug payload, phải là opt-in rõ ràng ở local development, không bật trên production.

### 12.3. Diagnostics

Lệnh `NesCode: Show Diagnostics` có thể hiển thị:

- Extension version.
- Host version.
- Worker URL hostname (không có credential).
- Health status.
- Model ID.
- Streaming support.
- Thời gian request gần nhất.
- Error code gần nhất.

Diagnostics không bao gồm API key, prompt hay source code.

---

## 13. Kiểm thử và tiêu chí nghiệm thu

### 13.1. Unit tests

**Extension:**

- Context filter loại file theo pattern.
- File binary bị loại.
- Path traversal bị từ chối.
- Budgeter giới hạn file count/size/token estimate.
- SecretStorage wrapper không ghi key vào settings.
- SSE parser xử lý split chunks, nhiều events, CRLF và stream kết thúc bất thường.
- Patch parser reject absolute path/`..`/unsupported operation.
- Diff Apply phát hiện file bị sửa sau preview.

**Worker:**

- Auth thành công/thất bại.
- Request schema validation.
- Role filtering.
- Model allowlist.
- Max body/output limits.
- Error normalization.
- Prompt builder theo từng mode.
- Không ghi payload vào logs.

### 13.2. Integration tests

- Extension → local Worker dev → mocked Workers AI.
- Worker → Workers AI binding trên môi trường test/development.
- Streaming end-to-end.
- JSON fallback.
- API key rotation.
- Quota/capacity error mapping.

### 13.3. Compatibility tests

**P0 gate:** cài một extension Hello World tối thiểu vào phiên bản Antigravity IDE thực tế mà người dùng đang chạy, xác nhận:

1. Extension Host discover package.
2. Activation event chạy.
3. Command Palette hiển thị command.
4. WebviewView có thể mở.
5. SecretStorage write/read hoạt động.
6. Workspace API đọc active file/selection hoạt động.
7. VSIX có thể package và cài lại.

Nếu một API không được hỗ trợ, phải thay bằng public capability được hỗ trợ hoặc ghi rõ limitation. Không patch file cài đặt Antigravity và không hook private internal modules.

### 13.4. End-to-end acceptance criteria

MVP chỉ được xem là hoàn thành khi:

- [ ] Cài extension vào Antigravity theo quy trình được tài liệu hóa.
- [ ] Extension không crash khi chưa cấu hình Worker.
- [ ] Cấu hình HTTPS Worker URL và API key thành công.
- [ ] API key được lưu trong SecretStorage và không xuất hiện trong log/settings.
- [ ] Health check trả Connected/Disconnected đúng.
- [ ] Chat request đi qua Worker và nhận được phản hồi model.
- [ ] Streaming hoạt động hoặc tự fallback JSON theo cấu hình.
- [ ] Explain Selection gửi đúng selection, không gửi cả workspace.
- [ ] Context preview và exclude patterns hoạt động.
- [ ] Fix Code chỉ hiển thị diff, không ghi file trước Apply.
- [ ] Reject không làm thay đổi file.
- [ ] Apply bị chặn khi file đã thay đổi sau lúc tạo diff.
- [ ] Model ID ngoài allowlist bị Worker từ chối.
- [ ] Quota error được hiển thị rõ ràng và không retry vô hạn.
- [ ] Không có code/prompt/key trong production logs.
- [ ] README hướng dẫn BYO Worker từ đầu đến cuối.
- [ ] Có test tự động cho các thành phần quan trọng.

### 13.5. Definition of Done cho mỗi task

Một task chỉ Done khi:

- Code có type checking và lint pass.
- Unit tests liên quan pass.
- Không thêm secret thật vào repository.
- Có xử lý lỗi và empty state.
- Có cập nhật docs nếu thay đổi hành vi/API.
- Được kiểm tra thủ công trong Antigravity nếu task liên quan host/UI.

---

## 14. Roadmap triển khai

### Milestone 0 — Compatibility Spike (P0)

**Mục tiêu:** giảm rủi ro lớn nhất trước khi xây feature.

- Tạo extension Hello World TypeScript.
- Package VSIX.
- Cài vào Antigravity IDE.
- Verify activation, Webview, SecretStorage, Workspace API và commands.
- Ghi lại host version, API hoạt động/không hoạt động.

**Exit criteria:** có báo cáo compatibility và quyết định tiếp tục/điều chỉnh target.

### Milestone 1 — Cloudflare Worker MVP (P0)

- Khởi tạo Worker TypeScript.
- Cấu hình AI binding.
- Thêm `NESCODE_API_KEY` secret.
- Implement health/models/chat.
- Implement request schema, model allowlist, safe errors.
- Test gọi GLM-4.7-Flash trên Workers Free.

**Exit criteria:** curl có thể gọi Worker và nhận response an toàn.

### Milestone 2 — Extension foundation (P0)

- Extension activation và commands.
- Settings Worker URL.
- SecretStorage API key.
- Worker API client.
- Connection status.

**Exit criteria:** extension gọi được health/chat qua Worker.

### Milestone 3 — Context & chat UI (P0)

- Chat Webview.
- Markdown renderer.
- SSE parser/JSON fallback.
- Selection/active file context.
- Ignore rules và context budget.
- Privacy/context preview.

**Exit criteria:** Chat và Explain Selection dùng được trong workspace thật.

### Milestone 4 — Safe patch flow (P0)

- Fix prompt mode.
- Structured patch schema.
- Patch parser/path validator.
- Diff preview.
- Apply/Reject.
- Stale document protection.

**Exit criteria:** Fix Code không thể tự ghi file trước sự phê duyệt.

### Milestone 5 — Quality, packaging, release (P0)

- Unit/integration tests.
- Security review.
- Docs: README, DEPLOYMENT, PRIVACY, COMPATIBILITY.
- Package VSIX.
- Manual acceptance test trên Antigravity.

**Exit criteria:** checklist mục 13.4 hoàn thành.

### Sau MVP — Version 0.2/0.3 (P1/P2)

- Local conversation history tốt hơn.
- `.nescodeignore` hoàn chỉnh.
- Context retrieval theo symbol/import graph.
- Multi-file patch.
- Generate tests nâng cao.
- Optional D1/KV usage tracking.
- Agent Mode Plan → Patch → Verify với approval gate.
- Provider abstraction cho model khác.
- Benchmark chất lượng coding và quota/token efficiency.

---

## 15. Rủi ro và biện pháp giảm thiểu

| ID | Rủi ro | Tác động | Biện pháp |
|---|---|---|---|
| R-01 | Antigravity IDE không hỗ trợ đầy đủ VS Code extension API cần dùng | Không cài/chạy được extension | Compatibility Spike trước; chỉ dùng public API; giữ fallback target VS Code nếu cần. |
| R-02 | Workers AI Free quota hết giữa phiên | Chat thất bại | Context budget, output cap, usage message, không retry vô hạn. |
| R-03 | Model hết capacity hoặc model ID thay đổi | Inference thất bại | Model allowlist cấu hình, health/error mapping, kiểm tra catalog khi release. |
| R-04 | Source code/secrets bị gửi ra ngoài | Rủi ro dữ liệu | Opt-in context, exclusion, preview, privacy notice, không lưu payload. |
| R-05 | Model sinh patch lỗi hoặc phá code | Regression | Schema validation, diff preview, stale check, Apply/Reject. |
| R-06 | API key bị lộ | Worker bị dùng trái phép | SecretStorage, Worker secret, rotate key, không log. |
| R-07 | Prompt injection từ source/README | Model làm theo instruction không đáng tin | System policy server-side, đánh dấu context untrusted, không tool execution. |
| R-08 | SSE format thay đổi theo model/runtime | Streaming hỏng | Stream adapter riêng, contract nội bộ, JSON fallback và tests. |
| R-09 | Public Worker bị người khác gọi | Hết quota | Bearer key, BYO Worker, key rotation; rate limiting nâng cao để sau. |
| R-10 | Context bị cắt làm model thiếu thông tin | Đề xuất sai | Hiển thị file bị cắt, token estimate, để người dùng chọn thêm context. |

---

## 16. Quyết định cần giữ nhất quán khi triển khai

1. **BYO Worker là mô hình phát hành mặc định.** Không triển khai một backend công cộng dùng chung trong MVP.
2. **Không chứa Cloudflare Account API Token trong extension.** Chỉ API key của Worker nằm trong SecretStorage.
3. **Không upload toàn bộ repository.** Context phải do người dùng chọn hoặc giới hạn ở selection/active file.
4. **Không auto-apply patch.** Mọi patch phải có preview và approval.
5. **Không chạy command do model sinh ra.** Generate Tests chỉ đề xuất test command; chưa thực thi ở MVP.
6. **Không sử dụng private Antigravity API.** Compatibility phải dựa vào public extension API và test thật.
7. **Không giả định quota là số câu hỏi cố định.** Quota phụ thuộc token/model usage.
8. **Không add D1/KV nếu chưa có nhu cầu.** MVP phải tối giản và Free-first.
9. **Không tự động fallback sang model có thể phát sinh phí.**
10. **Không lưu prompt/code/response ở Worker logs hoặc database mặc định.**

---

## 17. Tài liệu tham khảo chính thức

Các trang sau được tham chiếu khi lập SRS. Do giới hạn Cloudflare/Antigravity có thể thay đổi, maintainer phải kiểm tra lại khi release.

1. Google Antigravity — IDE extensions: <https://antigravity.google/docs/ide/extensions/>
2. Google Antigravity — VS Code extension guide: <https://antigravity.google/docs/ide/extensions/vscode/>
3. Google Antigravity — Getting started: <https://antigravity.google/docs/getting-started>
4. Cloudflare Workers — Limits: <https://developers.cloudflare.com/workers/platform/limits/>
5. Cloudflare Workers — Pricing: <https://developers.cloudflare.com/workers/platform/pricing/>
6. Cloudflare Workers AI — Pricing: <https://developers.cloudflare.com/workers-ai/platform/pricing/>
7. Cloudflare Workers AI — GLM-4.7-Flash model page: <https://developers.cloudflare.com/workers-ai/models/glm-4.7-flash/>
8. Cloudflare changelog — Models available on Free plan (2026-07-28): <https://developers.cloudflare.com/changelog/post/2026-07-28-models-require-workers-paid/>
9. VS Code Extension API: <https://code.visualstudio.com/api>

### Ghi chú xác minh quota/model tại 2026-11-11

- Cloudflare Workers Free công bố 100.000 requests/ngày và CPU time 10 ms/request.
- Workers AI công bố 10.000 Neurons/ngày cho Free allocation, reset 00:00 UTC.
- Cloudflare changelog ngày 2026-07-28 nêu `@cf/zai-org/glm-4.7-flash` vẫn nằm trong nhóm model dùng được trên Workers Free; một số model khác bị chuyển sang yêu cầu Workers Paid.
- Model page của GLM-4.7-Flash công bố context window 131.072 tokens và hỗ trợ function calling/reasoning. MVP không sử dụng function execution; model chỉ trả văn bản/structured patch.
- Không diễn giải 10.000 Neurons/ngày thành 10.000 request/ngày hoặc số câu hỏi cố định.

---

## 18. Appendix A — AI coding agent implementation instructions

Khi giao SRS này cho coding agent, agent phải tuân thủ quy trình:

1. Đọc toàn bộ `SRS.md` trước khi sửa code.
2. Kiểm tra repository hiện trạng; không giả định repository rỗng.
3. Thực hiện Milestone 0 trước: compatibility spike cho Antigravity.
4. Báo cáo API host nào đã kiểm chứng, API nào chưa kiểm chứng.
5. Sau đó triển khai từng milestone, không nhảy thẳng sang Agent Mode.
6. Trước khi thêm dependency, nêu lý do và alternative.
7. Không tạo secret thật, không yêu cầu user paste Cloudflare Account API Token vào source code.
8. Không tự đổi scope, không thêm database/service chưa được yêu cầu.
9. Mỗi milestone phải có test, file thay đổi và kết quả thực thi cụ thể.
10. Không tuyên bố test pass nếu chưa thực sự chạy test.

### Definition of first task

Task đầu tiên duy nhất:

- Tạo một extension TypeScript tối thiểu có command `nescode.helloWorld`.
- Package VSIX.
- Cài thử trong Antigravity IDE người dùng đang sử dụng.
- Xác nhận `activate`, command, Webview, SecretStorage và Workspace API.
- Xuất báo cáo `docs/COMPATIBILITY.md`.

Chưa triển khai chat, Cloudflare Worker hoặc model trước khi compatibility spike có kết luận.

---

## 19. Appendix B — Release checklist

### Security

- [ ] Không có token/key trong git history.
- [ ] API key chỉ lưu SecretStorage.
- [ ] Worker secret được thiết lập ngoài source code.
- [ ] Webview CSP cấu hình.
- [ ] Context excludes và path validator được test.
- [ ] Không thực thi shell/tool từ model.
- [ ] Không log payload.

### Cloudflare

- [ ] Workers Free deployment thành công.
- [ ] AI binding hoạt động.
- [ ] Model ID có thể gọi trên account hiện tại.
- [ ] Quota behavior được kiểm tra.
- [ ] Quota/limit message hiển thị đúng.
- [ ] Không có dependency trả phí bắt buộc.

### Extension

- [ ] Activation không lỗi.
- [ ] Chat UI hoạt động.
- [ ] Context preview hoạt động.
- [ ] Explain Selection hoạt động.
- [ ] Fix Code preview hoạt động.
- [ ] Apply/Reject hoạt động.
- [ ] Stop/cancel hoạt động.
- [ ] VSIX cài lại được.

### Documentation

- [ ] README có hướng dẫn cài extension.
- [ ] DEPLOYMENT có hướng dẫn deploy Worker.
- [ ] PRIVACY giải thích dữ liệu nào được gửi đi.
- [ ] COMPATIBILITY ghi rõ host/version đã kiểm thử.
- [ ] Có troubleshooting cho 401, 403, 429, 5xx và timeout.

---

**Kết thúc SRS — NesCode for Antigravity v1.0.0**
