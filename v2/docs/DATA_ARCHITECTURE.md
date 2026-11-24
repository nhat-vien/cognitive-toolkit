# 07 — Kiến trúc dữ liệu

Schema đề xuất, cần đối chiếu migrations hiện hữu. UUID cho entity; UTC timestamps; version cho catalog; timezone riêng cho lịch. Không lưu điểm mặc định hoặc dữ liệu mẫu trong production.

| Entity | Fields chính | Access |
|---|---|---|
| profiles | user_id, locale, timezone, preferences | owner |
| role_assignments | user_id, role, granted_by, revoked_at | privileged server |
| practice_versions | practice_id, version, locale, content, status | public eligible / reviewer |
| sessions | id, user_id, practice_id, version, step_id, status, updated_at | owner |
| plan_items | id, user_id, practice_id, schedule, status | owner / scoped grant |
| checkins | id, user_id, answers, created_at | owner |
| assessments | id, user_id, instrument_version, answers, score nullable | owner / scoped grant |
| safety_plans | id, user_id, content, updated_at | owner / explicit grant |
| medication_logs | id, user_id, user_entered_details, status nullable | owner |
| sharing_grants | owner_id, grantee_id, scope, expires_at, revoked_at | parties, server validated |
| consent_events | user_id, purpose, policy_version, action, timestamp | owner / audit |
| audit_events | actor_id, action, object_type, object_id, timestamp | restricted |

RLS cho mọi bảng nhạy cảm, test owner và non-owner. FK và unique constraints cho version, import idempotency; không cascade xóa audit trái retention policy. Retention, export, deletion và backup expiry cần được thống nhất với chính sách pháp lý áp dụng trước production.

## Sync contract
Guest local repository; account remote repository với cache tối thiểu. Client-generated UUID + idempotency key cho retry. Dùng revision/updated_at server để phát hiện conflict; không silently overwrite safety plan hoặc consent. Consent revoke authoritative server; không cho offline caregiver cache mở dữ liệu khi không thể xác minh quyền. Session checkpoint merge theo revision, conflict hiển thị lựa chọn. Offline queue không gửi sau logout sang account khác.

## API đề xuất
GET `/api/v2/catalog`; GET `/api/v2/catalog/:id`; POST `/api/v2/sessions`; PATCH `/api/v2/sessions/:id`; CRUD `/api/v2/plan-items`; POST `/api/v2/import`; POST/DELETE `/api/v2/sharing-grants`; POST `/api/v2/privacy/export` và `/delete`. Validate payload server, structured errors (401/403/404/409/422/429), pagination catalog, no-store cho dữ liệu riêng tư. Không dùng ID từ client làm quyền truy cập.

## Privacy
TLS, encryption at rest theo hạ tầng đã kiểm chứng, secrets server-side, không log payload nhạy cảm. Telemetry chỉ event kỹ thuật tối thiểu; không gửi nhật ký/điểm/thuốc vào analytics hoặc AI provider nếu không có cơ sở và consent phù hợp. Data flow diagram và threat model là deliverable bắt buộc trước triển khai production.
