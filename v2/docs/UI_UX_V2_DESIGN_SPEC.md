# 03 — Đặc tả UI/UX V2

## Design tokens
| Token | Light |
|---|---|
| primary | #426B57 |
| primaryContainer | #DFEBE1 |
| background | #F7F6F2 |
| surface | #FFFFFF |
| text | #263B33 |
| caution | #B58B51 |
| emergency | #A34C48 |

Be Vietnam Pro hoặc Inter có hỗ trợ tiếng Việt; body 16px, line-height 1.5; heading 24/20/18; spacing 4/8/12/16/24/32; radius 12–16; touch target tối thiểu 48dp. Kiểm tra tương phản WCAG 2.2 AA thực tế, không dùng màu caution làm chữ nhỏ nếu không đạt. Dark/system theme dùng semantic tokens riêng, kiểm tra tương phản. Không dùng màu duy nhất để báo trạng thái; hỗ trợ keyboard, screen reader, focus, reduced motion, text scaling 200%.

## Screen contracts
| Màn hình | Nội dung theo thứ tự | Hành động chính | Trạng thái đặc biệt |
|---|---|---|---|
| Welcome | Giá trị ứng dụng, giới hạn, quyền riêng tư ngắn | Tiếp tục không tài khoản | SOS, đăng nhập, offline |
| Login | Google thật nếu cấu hình, email, quên mật khẩu | Đăng nhập | pending, invalid, rate limit, provider unavailable |
| Hôm nay | Lời chào trung tính, check-in, một bài gợi ý, nhu cầu, kế hoạch | Bắt đầu bài | Không dữ liệu, bỏ qua, không gợi ý đủ điều kiện |
| Thực hành | Nhu cầu, search, filter, kết quả | Chọn bài | Empty, offline, nội dung chưa duyệt không xuất hiện |
| Chi tiết bài | Mục tiêu, thời lượng, đối tượng, cảnh báo, nguồn | Bắt đầu nếu đủ điều kiện | Locked/clinician-only, withdrawn |
| Session | Tiến độ bước, nội dung, audio tùy chọn | Tiếp tục | Pause, dừng, resume, lỗi audio |
| Kế hoạch | Mục tiêu, lịch, việc đã chọn, an toàn | Thêm/chỉnh mục | Empty, overdue không phán xét |
| Tiến trình | Lịch sử, xu hướng, đánh giá tùy chọn | Xem chi tiết | Không dữ liệu, không suy diễn điểm thiếu |
| SOS | Hỗ trợ ngay, liên hệ tin cậy, nguồn lực xác minh | Gọi/liên hệ | Offline, không có liên hệ đã lưu |
| Privacy | Dữ liệu lưu ở đâu, consent, export/delete | Quản lý dữ liệu | Re-auth, pending deletion |

## Wireframe Hôm nay (mobile)
```
[Equilibria]                       [Avatar]
Hôm nay bạn cảm thấy thế nào?   [Bỏ qua]
[Check-in tùy chọn]
Gợi ý dành cho bạn
[Bài đã duyệt • 5 phút]       [Bắt đầu]
Bạn cần gì lúc này?
[Bình tâm] [Ngủ] [Suy nghĩ] [Cảm xúc]
Kế hoạch hôm nay
[Tiếp tục mục đã chọn / Chưa có kế hoạch]
[Hỗ trợ khẩn cấp]
[Hôm nay] [Thực hành] [Kế hoạch] [Tiến trình]
```
Desktop: sidebar 240px, main max-width 960px, một cột chính và cột phụ khi đủ rộng; không ép grid trên mobile. Breakpoints đề xuất 600/1024px, kiểm thử 320/375/768/1440px.

## Interaction rules
Mỗi màn hình một primary action; không auto-play audio, không ép đăng nhập, không streak gây áp lực. Session hiển thị một bước chính, luôn có dừng; không đánh dấu hoàn thành khi chỉ mở bài. Meditation player: play/pause, seek, timer, giọng/nền riêng nếu có tracks, tải offline có quyền sử dụng. 432Hz nếu có chỉ là lựa chọn âm thanh, không quảng cáo tác dụng điều trị. Nội dung chuyên môn mở rộng theo yêu cầu, nhưng cảnh báo và điều kiện sử dụng luôn thấy trước khi bắt đầu.

## Components
AppShell, GlobalUrgentHelp, CheckInCard, PracticeCard, PracticeFilters, EligibilityNotice, SessionPlayer, PlanItem, EmptyState, ErrorState, ConsentDialog, AudioControls. Mỗi component có loading/error/disabled/focus states và test accessibility. Không đưa logic phân quyền vào component như nguồn quyết định duy nhất.
