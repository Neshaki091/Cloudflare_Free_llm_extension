# Tuyên Bố Tầm Nhìn Dự Án Dài Hạn (Project Goal)

- **Tên sản phẩm:** NesCode for Antigravity
- **Phiên bản tài liệu:** 1.0.0
- **Ngày lập:** 2026-11-11

---

## 1. Vấn Đề Thực Tế (The Problem)
Hiện nay, các công cụ trợ lý lập trình trí tuệ nhân tạo (AI Coding Assistant) thương mại thường yêu cầu chi phí thuê bao hàng tháng cao, bắt buộc gửi mã nguồn lên máy chủ trung tâm của nhà cung cấp dịch vụ bên thứ ba (tiềm ẩn rủi ro lộ bí mật kinh doanh), hoặc đòi hỏi cấu hình hạ tầng phức tạp, tốn kém. Trong khi đó, các nền tảng serverless hiện đại như Cloudflare Workers AI đã cung cấp năng lực suy luận mô hình ngôn ngữ lớn (LLM) mạnh mẽ trên tầng miễn phí (Free Tier) nhưng chưa có một tiện ích mở rộng nào được tối ưu hóa riêng cho môi trường **Antigravity IDE**.

## 2. Tầm Nhìn Dài Hạn (Long-term Vision)
Trở thành tiện ích mở rộng AI mã nguồn mở hàng đầu cho Antigravity IDE, trao quyền tự chủ hoàn toàn cho lập trình viên:
- **Tự do hạ tầng:** Hoạt động theo mô hình Bring Your Own Worker (BYO Worker), người dùng hoàn toàn làm chủ backend, API key và dữ liệu của chính mình.
- **Tiết kiệm tối đa chi phí:** Tối ưu hóa triệt để mức tiêu thụ tài nguyên để lập trình viên cá nhân có thể sử dụng hàng ngày hoàn toàn trong phạm vi gói Cloudflare Free Tier.
- **Bảo mật và riêng tư cao nhất:** Không có cơ chế tự động gửi mã nguồn khi chưa được phép; mọi thay đổi code đều phải được người dùng phê duyệt qua giao diện xem trước trực quan (Diff Preview).
- **Tiến tới Agent Mode tự chủ an toàn:** Đặt nền móng để phát triển quy trình tự động hóa lập trình nâng cao (Plan → Patch → Verify) với cơ chế kiểm soát của con người (Human-in-the-Loop) trong các phiên bản tương lai.

## 3. Đối Tượng Người Dùng Mục Tiêu
- **Lập trình viên độc lập / Cá nhân:** Cần một công cụ hỗ trợ code thông minh, miễn phí, không tốn phí bản quyền định kỳ.
- **Kỹ sư quan tâm đến bảo mật & quyền riêng tư:** Muốn kiểm soát tuyệt đối luồng dữ liệu rời khỏi máy tính và không chia sẻ mã nguồn với dịch vụ đám mây công cộng.
- **Cộng đồng phát triển trên Antigravity IDE:** Những người muốn xây dựng hệ sinh thái công cụ mã nguồn mở phong phú cho Antigravity.

## 4. Giá Trị Đem Lại (Expected Value)
- Giảm thời gian đọc hiểu mã nguồn lạ hoặc thư viện phức tạp nhờ tính năng Giải thích mã nguồn (Explain Code).
- Rút ngắn chu kỳ gỡ lỗi với các đề xuất sửa chữa trực quan (Fix Code Diff Preview).
- Tăng độ bao phủ kiểm thử với tính năng sinh test tự động (Generate Tests).
- An tâm làm việc mà không sợ rò rỉ API key, token hoặc file bí mật.

## 5. Những Điều Dự Án Không Thực Hiện (Non-Goals)
- Không biến dự án thành một dịch vụ SaaS thương mại có thu phí hay quản lý người dùng tập trung.
- Không phát triển hệ thống lưu trữ mã nguồn hay kho vector database nặng nề trên cloud.
- Không tự động hóa toàn bộ việc lập trình mà loại bỏ sự can thiệp của con người (không auto-commit, không auto-run shell vô điều kiện).
