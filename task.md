# task.md — Lộ trình Triển khai Chi tiết Đối chiếu `CLINICAL_PROTOCOL_MASTER_PLAN.md`

**Căn cứ:** [CLINICAL_PROTOCOL_MASTER_PLAN.md](file:///d:/NC2026/cognitive-toolkit/CLINICAL_PROTOCOL_MASTER_PLAN.md), [SPEC.md](file:///d:/NC2026/cognitive-toolkit/SPEC.md), [GAP_ANALYSIS.md](file:///d:/NC2026/cognitive-toolkit/GAP_ANALYSIS.md)  
**Quy ước nhãn:** `[MUST]` Bắt buộc trước phát hành · `[SHOULD]` Khuyến nghị mạnh · `[MAY]` Tùy chọn · `[CLINICAL REVIEW]` Cần chuyên gia lâm sàng duyệt · `[LEGAL/PRIVACY REVIEW]` Cần duyệt pháp lý/quyền riêng tư  
**Quy ước trạng thái:** `planned` · `draft` · `in_content_review` · `in_clinical_review` · `in_safety_review` · `approved` · `released` · `blocked`

---

## Phase 0 — Quản trị, Chốt Quyết định & Đồng bộ Hợp đồng (Governance & Schema Alignment)

- [x] **T0.1** `[MUST]` Kiểm toán toàn bộ kho mã nguồn, đối chiếu Master Plan với `SPEC.md` và lập báo cáo [GAP_ANALYSIS.md](file:///d:/NC2026/cognitive-toolkit/GAP_ANALYSIS.md). *(Status: `draft` — đã hoàn tất kiểm toán)*
- [ ] **T0.2** `[MUST]` `[CLINICAL REVIEW]` `[LEGAL/PRIVACY REVIEW]` Chốt 10 Quyết định Mở (§13 Master Plan: độ tuổi 18+, định vị sản phẩm, danh bạ khẩn cấp theo khu vực, bản quyền thang đo tiếng Việt, phạm vi Caregiver Mode v1, chính sách lưu trữ/xóa dữ liệu). *(Status: `blocked` — chờ chủ sản phẩm & chuyên gia)*
- [x] **T0.3** `[MUST]` Giải quyết kỹ thuật cho 7 xung đột C1–C7 giữa `SPEC.md` và `CLINICAL_PROTOCOL_MASTER_PLAN.md` thông qua lớp quản trị [master-plan-governance.ts](file:///d:/NC2026/cognitive-toolkit/packages/clinical-core-ts/src/master-plan/master-plan-governance.ts) (không ghi đè âm thầm). *(Status: `in_clinical_review`)*
- [x] **T0.4** `[MUST]` Tạo đặc tả **Protocol Manifest Validator** chuẩn hóa 19 trường metadata bắt buộc (§5.1) + cổng chặn không cho phép gán `approved` / `released` khi thiếu `clinical_approvals` và chặn giá trị `completed` (Appendix B) trong [master-plan-governance.ts](file:///d:/NC2026/cognitive-toolkit/packages/clinical-core-ts/src/master-plan/master-plan-governance.ts). *(Status: `in_clinical_review`)*
- [x] **T0.5** `[MUST]` Khai báo đầy đủ **68 Protocol Manifests** chuẩn hóa (`CBT` 11, `TEAM-CBT` 7, `DBT` 19, `IPSRT` 7, `MBCT` 8, `Psychoeducation` 10, `FFT` 6) trong `MASTER_PROTOCOL_CATALOG` ở trạng thái `status: draft` kèm xử lý an toàn khi protocol bị `deprecated` giữa phiên (`resolveInProgressSessionOnProtocolUpdate`). *(Status: `draft`)*
- [x] **T0.6** `[MUST]` Triển khai Schema Alignment (`SCHEMA_ALIGNMENT`):
  - Tách 7 thực thể khái niệm (§1.3) trong `SeparatedClinicalPathwayRecord` + `validateSeparatedClinicalPathwayRecord()`.
  - Thêm `DataProvenance` & `createProvenancedValue()` chặn lưu suy diễn AI chưa được người dùng xác nhận (§9.1).
  - Tạo migration [0002_clinical_master_plan_alignment.sql](file:///d:/NC2026/cognitive-toolkit/supabase/migrations/0002_clinical_master_plan_alignment.sql) cho `user_profiles`, `reported_histories`, `clinical_assessments`, `pathway_plans`, `safety_plans`, `safety_events`, `medication_reminders`, `medication_logs`, `content_sources`, `protocol_versions`, `caregiver_invitations`, `caregiver_access_grants`. *(Status: `in_clinical_review`)*

---

## Phase 1 — Nền tảng An toàn Bắt buộc (Safety Foundation) `[MUST]`

- [x] **T1.1** `[MUST]` `[CLINICAL REVIEW]` Chuẩn hóa **Deterministic Safety State Machine** đồng bộ 3 nền tảng ([master-plan-governance.ts](file:///d:/NC2026/cognitive-toolkit/packages/clinical-core-ts/src/master-plan/master-plan-governance.ts), [four_layer_safety.py](file:///d:/NC2026/cognitive-toolkit/apps/backend-api/src/safety/four_layer_safety.py), [master_plan_governance.dart](file:///d:/NC2026/cognitive-toolkit/apps/mobile-flutter/lib/domain/engine/master_plan_governance.dart)):
  - Ánh xạ sang 5 trạng thái luồng chuẩn (§2.3): `routine_support`, `distress_support`, `professional_follow_up_recommended`, `urgent_human_support`, `emergency_guidance`.
  - Đảm bảo `claimsUserIsLowRisk: false` (§2.3, §8.2) và quy tắc **Safety before engagement** (`ordinaryExerciseSuspended: true`). *(Status: `in_safety_review`)*
- [x] **T1.2** `[MUST]` `[CLINICAL REVIEW]` Xây dựng **Reviewed Emergency & Crisis Directory** ngoại tuyến ([emergency_directory.json](file:///d:/NC2026/cognitive-toolkit/packages/clinical-protocols-kb/safety/emergency_directory.json) & `evaluateEmergencyDirectoryStatus`) với `lastVerifiedDate`, `verifiedBy`, kiểm tra hạn xác minh (`isStale`) và fallback offline. *(Status: `in_safety_review`)*
- [x] **T1.3** `[MUST]` Xây dựng mô hình & bộ kiểm tra **Personal Safety Plan (6 mục chuẩn §3.4)** (`PersonalSafetyPlan` & `validatePersonalSafetyPlan`) bắt buộc `explicitConsentForStoringContacts === true` trước khi lưu danh bạ nhạy cảm. *(Status: `in_safety_review`)*
- [x] **T1.4** `[MUST]` Đảm bảo cổng khẩn cấp luôn hiển thị thông tin cấp cứu mà không bắt buộc hoàn thành khảo sát (`requiresQuestionnaireBeforeShowingHelp: false`) và hiển thị rõ tuyên bố không giám sát 24/7 (`nonMonitoringNoticeVi`). *(Status: `in_safety_review`)*
- [x] **T1.5** `[MUST]` Chuẩn hóa `SafetyEventAuditRecord` ghi nhận đủ: `pathwayState`, `ordinaryExerciseSuspended`, `interruptedProtocolId`, `guidanceDisplayed`, `userChoice`, `networkOffline`, `aiConflictOverridden`. *(Status: `in_safety_review`)*
- [x] **T1.6** `[MUST]` `[CLINICAL REVIEW]` Chuẩn hóa `DBT_TIPP_SAFE_OPTIONS` trong `MASTER_PROTOCOL_CATALOG` với sàng lọc y khoa bắt buộc và phương án dịu nhẹ thay thế. *(Status: `in_clinical_review`)*
- [x] **T1.7** `[MUST]` Bổ sung bộ **Safety Regression Tests** cho toàn bộ 12 kịch bản bắt buộc trong §11.2 vào [clinical-core.test.ts](file:///d:/NC2026/cognitive-toolkit/packages/clinical-core-ts/tests/clinical-core.test.ts) và [web-clinical-app.test.ts](file:///d:/NC2026/cognitive-toolkit/apps/web-nextjs/tests/web-clinical-app.test.ts). *(Status: `in_safety_review`)*

---

## Phase 2 — Kỹ năng Tự lực Cốt lõi, Quản trị Thang đo & Hỗ trợ Thuốc (Core Skills & Governance)

- [x] **T2.1** `[MUST]` `[CLINICAL REVIEW]` Chuẩn hóa cấu trúc bước protocol có `allowSkip`, `allow_user_pause`, `allow_user_abort`, `nonWritingAlternativeVi` và `equates_to_full_clinical_treatment: false`. *(Status: `in_clinical_review`)*
- [x] **T2.2** `[SHOULD]` `[CLINICAL REVIEW]` Bổ sung đầy đủ 19 kỹ năng DBT thuộc 4 nhóm (`Mindfulness`, `Distress Tolerance`, `Emotion Regulation`, `Interpersonal Effectiveness` gồm cả `DBT_OBSERVE_DESCRIBE`, `DBT_NONJUDGMENTAL_STANCE`, `DBT_ONE_MINDFULLY`, `DBT_CHECK_THE_FACTS`, `DBT_BUILD_POSITIVE_EXPERIENCES`, `DBT_GIVE`, `DBT_FAST`, `DBT_BOUNDARY_SETTING`) vào `MASTER_PROTOCOL_CATALOG`. *(Status: `draft`)*
- [x] **T2.3** `[MUST]` `[CLINICAL REVIEW]` Xây dựng **Instrument Governance Registry** (`INSTRUMENT_GOVERNANCE_REGISTRY`), hàm chấm điểm **`WHO-5`** (`scoreWho5WellBeing`), hồ sơ quản trị **`C-SSRS`**, và `OutcomeMeasurementRecord` theo dõi mục tiêu chức năng & trải nghiệm bất lợi (§6.1–6.4). *(Status: `in_clinical_review`)*
- [x] **T2.4** `[MUST]` Xây dựng phân hệ **Medication Support Boundary** (`MedicationReminderConfig`, `MedicationIntakeRecord`, `evaluateMedicationSupportAction`) tách bạch lời nhắc với xác nhận đã uống, ghi nhận quên liều/tác dụng phụ trung tính và chặn mọi gợi ý đổi liều (§7). *(Status: `in_clinical_review`)*
- [x] **T2.5** `[SHOULD]` `[CLINICAL REVIEW]` Khai báo đủ **10 Mô-đun Giáo dục Tâm lý (Psychoeducation — §4.6)** (`PSYEDU_*`) có phiên bản, nguồn trích dẫn và tuyên bố giới hạn trong `MASTER_PROTOCOL_CATALOG`. *(Status: `draft`)*

---

## Phase 3 — Quy trình Chuyên biệt cho Rối loạn Lo âu (Anxiety-Specific Workflows)

- [x] **T3.1** `[SHOULD]` `[CLINICAL REVIEW]` Bổ sung 4 giao thức Lo âu chuyên biệt (`CBT_INTOLERANCE_UNCERTAINTY`, `CBT_PANIC_PSYCHOEDUCATION`, `CBT_SOCIAL_ANXIETY`, và `CBT_INTEROCEPTIVE_EXPOSURE` với `delivery_boundary: 'clinician_assisted_required'` + `requires_medical_exclusion_screen: true`). *(Status: `draft`)*

---

## Phase 4 — Hỗ trợ Lưỡng cực & IPSRT Nâng cao (Bipolar Support & IPSRT)

- [x] **T4.1** `[MUST]` `[CLINICAL REVIEW]` Triển khai `evaluateMultiSignalBipolarPrecautions()` (§3.5, §4.4): không dùng 1 ngưỡng giờ ngủ đơn lẻ làm bộ phát hiện hưng cảm (`usesSingleSleepThresholdAsManiaDetector: false`), yêu cầu hội tụ đa tín hiệu so với nền cá nhân, khóa bài tập kích hoạt năng lượng cao và khuyến nghị liên hệ bác sĩ. *(Status: `in_clinical_review`)*
- [x] **T4.2** `[SHOULD]` Bổ sung đủ 7 thành phần IPSRT (`IPSRT_RHYTHM_BASELINE`, `IPSRT_DAILY_RHYTHM_LOG`, `IPSRT_SOCIAL_EVENT_LOG`, `IPSRT_RHYTHM_REVIEW`, `IPSRT_ROUTINE_PLANNING`, `IPSRT_EARLY_WARNING_PLAN`, `IPSRT_CLINICIAN_REPORT`) vào `MASTER_PROTOCOL_CATALOG`. *(Status: `draft`)*

---

## Phase 5 — Liệu pháp Nâng cao: TEAM-CBT, MBCT & Hỗ trợ Gia đình FFT (Advanced Therapy Content)

- [x] **T5.1** `[SHOULD]` `[CLINICAL REVIEW]` Hoàn thiện 7 giao thức **TEAM-CBT-informed** (`TEAM_SESSION_AGENDA`, `TEAM_EMPATHY_EXPLORATION`, `TEAM_PARADOXICAL_AGENDA`, `TEAM_POSITIVE_REFRAMING`, `TEAM_COST_BENEFIT_ANALYSIS`, `TEAM_MOTIVATION_CHECK`, `TEAM_SKILL_REVIEW`) với lưu ý không dùng ngôn ngữ đổ lỗi "kháng cự". *(Status: `draft`)*
- [x] **T5.2** `[SHOULD]` `[CLINICAL REVIEW]` Xây dựng chuỗi **8 bài Thực hành MBCT-informed** (`MBCT_AUTOMATIC_PILOT` → `MBCT_RELAPSE_AWARENESS`) kèm lựa chọn mở mắt/tiếp đất và tuyên bố không tương đương khóa MBCT lâm sàng đầy đủ. *(Status: `draft`)*
- [x] **T5.3** `[MAY]` `[CLINICAL REVIEW]` `[LEGAL/PRIVACY REVIEW]` Xây dựng 6 mô-đun **FFT** (`FFT_*`) + bộ phân quyền **Caregiver Access Grant** (`createGranularCaregiverAccessGrant`, `revokeCaregiverAccessGrant`) mặc định ẩn nhật ký riêng tư, phiên trị liệu & câu trả lời thang đo, khóa quyền chỉnh sửa hồ sơ bệnh nhân và hỗ trợ thu hồi tức thì. *(Status: `in_clinical_review` — chờ quyết định §13 #6 trước khi bật trên production)*

---

## Phase 6 — Cầu nối Bác sĩ, Ranh giới AI & Kiểm định Phát hành (Clinician Bridge, AI & Release Gates)

- [x] **T6.1** `[MUST]` Đồng bộ hệ thống quản trị Master Plan vào barrel của Web (`apps/web-nextjs/src/clinical/index.ts`), Core (`packages/clinical-core-ts/src/index.ts`), Mobile (`master_plan_governance.dart`) và Backend (`four_layer_safety.py`). *(Status: `in_clinical_review`)*
- [x] **T6.2** `[MUST]` Xây dựng bộ **Xem trước & Ẩn thông tin nhạy cảm cho Báo cáo Lâm sàng** (`buildUserControlledReportWithRedaction` — §10.3) gắn nhãn `Self-Reported` vs `Clinician-Entered`, phiên bản thang đo, giới hạn diễn giải và loại bỏ hoàn toàn nhãn chẩn đoán/rủi ro tự động. *(Status: `in_clinical_review`)*
- [x] **T6.3** `[MUST]` Cài đặt kiểm chứng xung đột AI vs. Safety Engine (`aiOutputOverriddenBySafetyEngine: true`) và bắt buộc người dùng xác nhận tóm tắt AI (`createProvenancedValue` với `provenance: 'ai_summary_confirmed'`) theo §8.3 & §9.1. *(Status: `in_safety_review`)*
- [x] **T6.4** `[MUST]` Xây dựng **Evidence & Reference Register** (§15) tại [docs/EVIDENCE_AND_REFERENCE_REGISTER.md](file:///d:/NC2026/cognitive-toolkit/docs/EVIDENCE_AND_REFERENCE_REGISTER.md). *(Status: `in_content_review`)*
- [x] **T6.5** `[MUST]` Lập báo cáo **Release Readiness & 9 Release Gates** (§11.4 & Appendix A) tại [docs/RELEASE_READINESS_REPORT.md](file:///d:/NC2026/cognitive-toolkit/docs/RELEASE_READINESS_REPORT.md). *(Status: `in_clinical_review`)*
