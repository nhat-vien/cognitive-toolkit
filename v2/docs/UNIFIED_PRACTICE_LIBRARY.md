# 05 — Thư viện thực hành thống nhất

## Phân loại
68 phác đồ hiện có được review theo nhóm: CBT 11, TEAM-CBT 7, DBT 19, IPSRT 7, MBCT 8, psychoeducation 10, FFT 6. Xác minh inventory bằng mã nguồn trước migration. Không đồng nhất phác đồ chuyên môn với bài tự thực hành. Tích hợp công cụ hiện có, thiền, thở và audio vào catalog chung bằng quan hệ, không gộp nội dung chỉ vì tên giống nhau.

Hai chế độ khám phá: mặc định theo nhu cầu (bình tâm, giấc ngủ, suy nghĩ, cảm xúc, quan hệ, nhịp sinh hoạt); nâng cao theo mô hình trị liệu. Filter thời lượng, hình thức, mức năng lượng tự chọn, offline. Không suy diễn chẩn đoán từ filter.

## Schema contract (minh họa, không phải nội dung đã duyệt)
```json
{"id":"example-draft","version":1,"locale":"vi","kind":"practice","title":"Bản nháp minh họa","models":[],"needs":[],"durationMinutes":5,"delivery":"self_guided","reviewStatus":"draft","publicationStatus":"unpublished","goals":[],"precautions":[],"contraindications":[],"references":[],"steps":[],"relatedIds":[]}
```
Required: stable ID, version, locale, kind (practice/protocol/audio/education), title, delivery (self_guided/clinician_assisted), review status, publication status, safety fields, provenance, reviewer and review timestamp for approved content. Steps có stable ID, text/audio reference, optional duration; audio có license, transcript và checksum. JSON Schema validate ở CI; sinh TypeScript/Dart types hoặc kiểm tra parity bằng fixture.

## Eligibility
Public catalog chỉ trả approved + published + self-guided; clinician-assisted chỉ xuất hiện trong luồng được cấp quyền và không mở session tự hướng dẫn. Draft/withdrawn không thể truy cập qua deep link hoặc cache mới. Nếu thiếu dữ liệu an toàn bắt buộc, fail closed. Nội dung offline có version, thời hạn kiểm tra cập nhật và cơ chế thu hồi khi online; không hứa thu hồi tức thì trên thiết bị mất mạng.

## Migration checklist
Export từng ID từ web/Flutter; đối chiếu tên, steps, nguồn, version, delivery, review. Tạo mapping old_id → canonical_id và báo cáo duplicate/conflict/orphan. Không tự nâng trạng thái duyệt; chuyên gia quyết định các conflict. Giữ lịch sử session gắn version cũ. Catalog build deterministic, parity test, rollback version; không publish draft để đạt đủ 68 mục.

## Session player
Preview → eligibility → start → step → pause/resume/stop → complete hoặc stopped. Lưu checkpoint theo step ID; không ghi nội dung riêng tư vào analytics. Cho phép bỏ qua bước nếu nội dung đã duyệt cho phép. Không tự động tăng cấp độ điều trị hoặc gán kế hoạch từ điểm số.
