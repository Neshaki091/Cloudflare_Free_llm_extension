# Quản Lý Rủi Ro Kỹ Thuật (Technical Risks Management)

- **Ngày cập nhật:** 2026-11-11
- **Tài liệu nguồn:** `journal/requirements/SRS.md` Phần 15

Bảng phân tích rủi ro kỹ thuật, mức độ tác động, xác suất xảy ra, biện pháp giảm thiểu và trạng thái theo dõi hiện tại của dự án NesCode for Antigravity.

---

## Bảng Ma Trận Rủi Ro (Risk Matrix)

| Mã | Rủi Ro Kỹ Thuật | Tác Động | Xác Suất | Mức Rủi Ro | Biện Pháp Giảm Thiểu | Trạng Thái |
|---|---|---|---|---|---|---|
| **R-01** | Antigravity IDE không hỗ trợ đầy đủ VS Code Extension API cần dùng (WebviewView, SecretStorage). | Rất cao (Không chạy được extension) | Trung bình | **NGUY CẤP** | Thực hiện Milestone M0 (Compatibility Spike) ngay từ đầu với extension tối thiểu; chỉ dùng public API đã kiểm chứng; có phương án fallback. | Đang điều tra (M0) |
| **R-02** | Workers AI Free quota (10.000 Neurons/ngày) bị cạn kiệt giữa phiên làm việc. | Cao (Chat thất bại) | Cao | **CAO** | Thiết lập ngân sách context (Context Budget 12k token), giới hạn output (1.500 token), hiển thị cảnh báo quota rõ ràng, không retry vô hạn. | Đã có giải pháp thiết kế |
| **R-03** | Model hết capacity tạm thời hoặc Cloudflare thay đổi danh mục model Free. | Cao (Inference bị gián đoạn) | Trung bình | **CAO** | Quản lý model allowlist qua biến môi trường Worker (không hard-code ở client); chuẩn hóa mã lỗi `AI_CAPACITY_UNAVAILABLE`. | Đã có giải pháp thiết kế |
| **R-04** | Mã nguồn hoặc file bí mật (`.env`, private keys) bị gửi ngoài ý muốn. | Nghiêm trọng (Rò rỉ dữ liệu) | Thấp | **CAO** | Thu thập context theo cơ chế opt-in; áp dụng danh sách loại trừ mặc định; cung cấp Context Preview trước khi gửi; không lưu payload ở Worker. | Đã có giải pháp thiết kế |
| **R-05** | Model sinh patch lỗi cú pháp hoặc làm hỏng mã nguồn đang chạy. | Cao (Gây regression) | Trung bình | **TRUNG BÌNH** | Schema validation chặt chẽ cho patch; hiển thị Diff Preview trực quan; bắt buộc bấm Apply mới ghi file; kiểm tra stale document. | Đã có giải pháp thiết kế |
| **R-06** | Worker API Key bị lộ ra ngoài do lưu sai chỗ hoặc ghi log. | Cao (Bị người lạ gọi cạn quota) | Thấp | **TRUNG BÌNH** | Lưu khóa bằng `SecretStorage` của IDE; so sánh an toàn thời gian (`timingSafeEqual`); không ghi log header hay URL; hỗ trợ rotate key. | Đã có giải pháp thiết kế |
| **R-07** | Prompt Injection từ nội dung file mã nguồn/README không đáng tin cậy. | Trung bình (Model làm sai hướng dẫn) | Trung bình | **TRUNG BÌNH** | Xây dựng System Prompt ở máy chủ; đánh dấu toàn bộ context là untrusted data; tuyệt đối không cấp quyền chạy lệnh shell tự động. | Đã có giải pháp thiết kế |
| **R-08** | Định dạng Server-Sent Events (SSE) bị phân mảnh TCP hoặc lệch format. | Trung bình (Lỗi streaming UI) | Trung bình | **TRUNG BÌNH** | Xây dựng Stream Adapter riêng ở Worker; phía client có bộ đệm dòng (line buffer) và fallback sang JSON thông thường nếu stream lỗi. | Đã có giải pháp thiết kế |
| **R-09** | Worker công khai bị quét và gọi trái phép từ Internet. | Trung bình (Hết quota Worker) | Thấp | **THẤP** | Bắt buộc có Bearer API Key cho mọi request; mô hình BYO Worker giúp cách ly hạn ngạch giữa các người dùng độc lập. | Đã có giải pháp thiết kế |
| **R-10** | Cắt giảm context quá mức khiến mô hình AI không đủ dữ liệu trả lời chính xác. | Thấp (Chất lượng câu trả lời giảm) | Cao | **THẤP** | Cảnh báo rõ ràng file nào bị cắt giảm; hiển thị số token ước lượng; cho phép người dùng chủ động đính kèm file liên quan. | Đã có giải pháp thiết kế |
