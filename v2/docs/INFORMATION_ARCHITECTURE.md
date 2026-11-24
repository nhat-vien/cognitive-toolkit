# 02 — Kiến trúc thông tin

## Navigation contract
| Tab | Mục đích | Nội dung |
|---|---|---|
| Hôm nay | Việc phù hợp ngay lúc này | Check-in tùy chọn, một gợi ý, tiếp tục phiên, kế hoạch hôm nay |
| Thực hành | Tìm và thực hiện | Theo nhu cầu, tìm kiếm, lọc, thiền, công cụ, thư viện chuyên sâu |
| Kế hoạch | Mục tiêu cá nhân | Việc đã chọn, lịch, kế hoạch an toàn, hỗ trợ chuyên gia |
| Tiến trình | Nhìn lại | Nhật ký, lịch sử, đánh giá tự nguyện, báo cáo có consent |

Avatar: hồ sơ, tài khoản, quyền riêng tư, cài đặt, trợ năng. SOS là hành động toàn cục, không phải tab. Trợ lý AI là công cụ hỗ trợ có giới hạn, không là bác sĩ; truy cập từ Hôm nay/Thực hành. Tâm sự là một lựa chọn hỗ trợ, không ép người dùng nhập nhật ký.

## Mapping hub cũ
| Nhóm cũ | Đích V2 |
|---|---|
| Hành trình/onboarding | Onboarding ngắn + Kế hoạch |
| 68 phác đồ/7 mô hình | Thực hành > Thư viện chuyên sâu |
| Kế hoạch an toàn | SOS + Kế hoạch > An toàn |
| Thuốc/lưỡng cực | Kế hoạch > Theo dõi điều trị, tùy chọn |
| FFT/người chăm sóc | Kế hoạch > Người hỗ trợ, consent riêng |
| WHO-5/báo cáo | Tiến trình > Đánh giá/báo cáo |

## Routes đề xuất (không khẳng định đã tồn tại)
`/welcome`, `/auth/login`, `/auth/callback`, `/auth/reset`, `/help/urgent`, `/today`, `/practice`, `/practice/library`, `/practice/[id]`, `/session/[id]`, `/plan`, `/plan/safety`, `/plan/support`, `/progress`, `/settings/privacy`, `/clinician`, `/admin`.
Flutter dùng route names tương ứng, bottom navigation 4 tab; web sidebar desktop, bottom nav mobile. Deep link phải kiểm tra quyền và eligibility trước khi mở nội dung. Giữ redirect cho route cũ sau khi inventory.

## Luồng chính
Welcome → guest hoặc account → check-in có thể bỏ qua → Hôm nay → nhu cầu → bài đủ điều kiện → xem mục tiêu/cảnh báo → bắt đầu → từng bước → kết thúc hoặc dừng → lưu tùy chọn. SOS truy cập từ mọi trạng thái, kể cả offline (thông tin đã xác minh được cache). Không yêu cầu hoàn thành check-in để tiếp cận trợ giúp.

## Kế hoạch cá nhân
Các nhóm ổn định/an toàn, nền tảng, kỹ năng, duy trì chỉ là cấu trúc tùy chọn, không phải phác đồ bắt buộc hoặc chẩn đoán. Người dùng có thể bỏ qua, đổi lịch, xóa mục; chỉ chuyên gia có quyền thích hợp mới gán nội dung clinician-assisted.
