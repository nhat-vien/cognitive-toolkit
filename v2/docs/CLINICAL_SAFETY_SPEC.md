# 06 — An toàn lâm sàng

Ứng dụng hỗ trợ sức khỏe tinh thần, không thay thế chẩn đoán, điều trị hay dịch vụ khẩn cấp. Nội dung và luồng nguy cơ cần chuyên gia phù hợp phê duyệt trước release.

## Safety requirements
- SOS luôn có thể truy cập không login; thông tin nguồn lực theo quốc gia/khu vực, có nguồn, ngày xác minh và người phụ trách. Không dùng số điện thoại mẫu. Nếu nguy hiểm tức thời, hướng dẫn liên hệ dịch vụ cấp cứu địa phương hoặc cơ sở cấp cứu gần nhất; không chờ AI phản hồi.
- Check-in/PHQ/GAD/WHO-5 bắt đầu unanswered; không mặc định điểm, không diễn giải dữ liệu thiếu. Công cụ đánh giá cần xác minh phiên bản, quyền sử dụng, cách chấm và ngưỡng bởi chuyên gia. Không dùng điểm làm chẩn đoán.
- Thuốc: danh sách trống, trạng thái chưa ghi nhận. Chỉ theo dõi thông tin người dùng nhập; không đề xuất đổi liều, dừng thuốc hoặc tự động đánh dấu đã uống.
- Consent caregiver mặc định false; chia sẻ theo mục đích, loại dữ liệu, thời hạn; thu hồi chặn truy cập tương lai, giải thích bản sao đã xuất không thể thu hồi.
- AI không kê đơn, chẩn đoán, hứa theo dõi khẩn cấp hay thay thế chuyên gia. Khi có tín hiệu nguy cơ, hiển thị luồng hỗ trợ đã duyệt; không chỉ dựa vào classifier hoặc LLM. Cho phép người dùng tự mở SOS bất cứ lúc nào.

## Content governance
Draft → clinical review → approved → published → withdrawn. Reviewer có danh tính/quyền phù hợp, version, ngày, nguồn, phạm vi đối tượng, contraindications, delivery boundary. Thay đổi nội dung chuyên môn tạo version và review lại. Admin kỹ thuật không tự duyệt lâm sàng. Ghi audit không chứa nội dung nhật ký.

## Release blockers
Không phát hành nếu có dữ liệu lâm sàng giả hiển thị như thật, nội dung chưa duyệt có thể start, SOS bị khóa login, chia sẻ không consent, hoặc AI đưa lời khuyên thuốc nguy hiểm trong bộ test. Có quy trình báo cáo sự cố, owner và khả năng disable nội dung/provider. Không tuyên bố hiệu quả điều trị nếu chưa có bằng chứng phù hợp.
