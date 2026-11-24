# 04 — Auth & Security

## Quyết định
Supabase Auth là nguồn danh tính duy nhất cho account; guest là chế độ local không giả token. Demo tách storage namespace và không sync. Xóa fallback Google giả, HS256-LOCAL, role theo prefix email và toggle role phía client. Không tuyên bố E2EE nếu chưa có thiết kế và kiểm chứng tương ứng.

## Flows
- Google: provider thật → PKCE/callback theo SDK → xác minh session server → profile. Nếu thiếu config, ẩn/disable provider và báo rõ; không tạo identity giả.
- Email: đăng ký, xác minh email theo cấu hình, login, reset password với callback allowlist. Thông báo lỗi tránh tiết lộ account tồn tại; rate limit.
- Guest: random local ID chỉ để phân vùng dữ liệu, không cấp quyền API account. Giải thích dữ liệu có thể mất khi xóa app/browser.
- Upgrade: login thật → preview dữ liệu local → consent chọn loại dữ liệu → import idempotent → xác nhận thành công → tùy chọn xóa bản local. Không tự động upload nhật ký.
- Logout: revoke/clear session theo SDK, xóa cache account nhạy cảm, không làm mất guest data khác. Mobile lưu credential bằng secure storage; web dùng mô hình SSR cookie/session theo SDK và threat model, không tự chế token.

## Authorization
| Role | Quyền |
|---|---|
| Guest | Nội dung công khai đủ điều kiện, dữ liệu local |
| Individual | Dữ liệu của chính mình |
| Caregiver | Chỉ phạm vi chia sẻ còn hiệu lực |
| Clinician | Chỉ hồ sơ được cấp quyền hợp lệ, đúng phạm vi |
| Admin | Quản trị hệ thống/nội dung; không mặc định đọc nhật ký |

Role assignments chỉ do server privileged workflow, audit đầy đủ; không lấy role từ user-editable metadata. RLS deny-by-default cho bảng riêng tư, kiểm tra `auth.uid()` và grants còn hiệu lực; service role key chỉ server, không dùng để bypass kiểm tra nghiệp vụ. API xác minh token/session và quyền từng object; không tin user_id từ body. Clinician/admin cần MFA theo chính sách phát hành.

## Migration
Inventory session keys và tài khoản cũ. Không coi local token/email prefix là chứng cứ danh tính. Buộc xác thực lại; không tự liên kết dữ liệu cũ theo email chưa xác minh. Backup có kiểm soát, migration staging, rollback không khôi phục cơ chế auth giả. Revoke legacy endpoints hoặc trả lỗi rõ ràng; kiểm tra consumers của `/api/v1/auth`.

## Security gates
Test cross-user read/write, forged role, expired token, OAuth cancellation, redirect tampering, guest sync denial, consent revoke, account deletion, log redaction, secret scan. Không ghi token, nhật ký, điểm đánh giá vào telemetry. Kiểm tra CSRF theo mô hình cookie, XSS, dependency vulnerabilities, rate limits và backup restore. Không phát hành khi còn lỗi P0.
