# 01 — Kiểm toán hiện trạng UI/UX

Các nhận định dưới đây dựa trên mã nguồn đã review, chưa phải kết quả usability testing hoặc penetration testing. Xác minh lại trên commit triển khai.

| ID | Hiện trạng / vị trí | Rủi ro | Ưu tiên | Hướng sửa |
|---|---|---|---|---|
| A01 | `apps/web-nextjs/src/clinical/auth-account.ts`: fallback Google giả, HS256-LOCAL | Nhầm danh tính, phiên không đáng tin | P0 | Supabase Auth thật, guest tách biệt |
| A02 | Cùng file: role theo email; `EquilibriaClinicalApp.tsx` có toggle admin | Ranh giới quyền không đáng tin | P0 | Quyền server, RLS, kiểm thử truy cập chéo |
| A03 | `ClinicalMasterPlanHub.tsx`: điểm PHQ/GAD, thuốc, consent, số điện thoại mẫu | Dữ liệu mẫu bị hiểu là thật | P0 | Null/unanswered; demo cô lập |
| A04 | Phác đồ có trạng thái chờ chuyên gia duyệt | Nguy cơ tự thực hành không phù hợp | P0 | Publication gate và delivery gate |
| A05 | Hub 6 nhóm chức năng, 68 phác đồ và nhiều nội dung hỗ trợ | Quá tải lựa chọn | P1 | Điều hướng theo nhu cầu, thư viện riêng |
| A06 | `EquilibriaClinicalApp.tsx` >6600 dòng; hub >2000 dòng | Khó bảo trì và kiểm thử | P1 | Feature modules, route boundaries |
| A07 | Flutter `clinical_master_plan_screen.dart` có catalog tĩnh riêng | Drift nội dung và an toàn | P1 | Catalog có version dùng chung |
| A08 | Notes/tiến trình trong state của hub | Chưa xác minh độ bền dữ liệu | P1 | Kiểm tra persistence; repository layer |

## Kiểm chứng trước refactor
- Chụp baseline các màn hình desktop/mobile, guest/account, empty/error/loading; dùng dữ liệu tổng hợp.
- Liệt kê routes, storage keys, API consumers, schema/migrations và dependencies; ghi commit SHA.
- Kiểm thử auth thật, quyền truy cập chéo và refresh/restart trong môi trường staging; không thử trên tài khoản thật.
- Đo task completion cho 5 tác vụ: tìm hỗ trợ khẩn cấp, đăng nhập, tìm bài 5 phút, tiếp tục kế hoạch, xem tiến trình. Ghi thời gian, lỗi, số thao tác và phản hồi; không tự tạo số liệu baseline.

## Quyết định sản phẩm
Không chuyển nguyên hub cũ thành một menu dài. Tách nội dung tra cứu, kế hoạch cá nhân, phiên thực hành, hồ sơ chuyên môn. Không xóa nội dung cũ trước khi có inventory và mapping đầy đủ. P0 chặn phát hành; P1 chặn nghiệm thu V2; P2 là cải tiến sau release.
