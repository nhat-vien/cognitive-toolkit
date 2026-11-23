# GAP ANALYSIS — `CLINICAL_PROTOCOL_MASTER_PLAN.md` vs. `SPEC.md` & Repository Implementation

**Project:** Cognitive Toolkit (Haven / Equilibria)  
**Audit Date:** 2026-11-23  
**Baseline Documents:**
- [CLINICAL_PROTOCOL_MASTER_PLAN.md](file:///d:/NC2026/cognitive-toolkit/CLINICAL_PROTOCOL_MASTER_PLAN.md) (`v0.1.0-draft`)
- [SPEC.md](file:///d:/NC2026/cognitive-toolkit/SPEC.md)
- Repository HEAD: `4dfacb3` (`packages/clinical-core-ts`, `packages/clinical-protocols-kb`, `apps/web-nextjs`, `apps/mobile-flutter`, `apps/backend-api`, `supabase/migrations/0001_equilibria_schema_rls_pgvector.sql`)

> **Trạng thái Kiểm toán:** Báo cáo này tách biệt rõ **trạng thái triển khai phần mềm** (`implemented` / `partial` / `missing` / `conflict`) và **trạng thái phê duyệt lâm sàng** (`draft` — hiện chưa có protocol nào đạt `approved` có chữ ký chuyên gia theo Appendix A & B của Master Plan).

---

## 1. Tóm tắt Điều hành (Executive Summary)

| Nhóm Yêu cầu trong Master Plan | Mức độ Đáp ứng Hiện tại (Code) | Phê duyệt Lâm sàng | Ghi chú Chính |
| :--- | :---: | :---: | :--- |
| **§1. Scope, Boundaries & Concept Separation** | 🟡 Partial (~45%) | `draft` | Đã có disclaimer & không kê đơn; **chưa tách** 7 thực thể khái niệm (`screening_result`, `reported_history`, `clinical_assessment`, `safety_status`, `support_plan`, `clinician_approved_plan`) và thiếu age/consent gate lúc onboarding. |
| **§2. Clinical Pathway Architecture** | 🟡 Partial (~55%) | `draft` | Đã có DBT-First/CBT-Second router & adaptive UI; **chưa dùng** 5 workflow states chuẩn (`routine_support` → `emergency_guidance`) và còn nhãn `severity: "LOW"`. |
| **§3. Safety & Escalation Subsystem** | 🟡 Partial (~65%) | `draft` | Đã có `FourLayerSafetyGate`, TIPP medical exclusion, Chain Analysis Hard Stops, hash-chained audit; **thiếu** Personal Safety Plan 6 mục, Emergency Directory có `last_verified_date`, ghi nhận lựa chọn người dùng trong `SafetyEvent`, và quy trình C-SSRS / không chỉ dựa vào PHQ-9 Q9 & regex. |
| **§4.1–4.4 CBT, TEAM-CBT, DBT, IPSRT** | 🟢 Strong Partial (~75%) | `draft` | Đã có 7 giao thức tương tác, 36 công cụ 0ms, 17 file KB Markdown, Bipolar/IPSRT hub & 48h Impulse Vault; **thiếu** 1 số giao thức chuyên biệt (`CBT_INTOLERANCE_UNCERTAINTY`, `CBT_PANIC_PSYCHOEDUCATION`, `CBT_SOCIAL_ANXIETY`, `DBT_GIVE/FAST/BOUNDARY`, `IPSRT_SOCIAL_EVENT_LOG`) và cảnh báo timezone/SRM. |
| **§4.5 MBCT (8-Step Sequence)** | 🔴 Missing (~10%) | `planned` | Hiện chỉ có "Thiền Buông Thư" (Sleep Meditation 3 giọng đọc), **chưa có** chuỗi 8 bài MBCT-informed, lựa chọn mở mắt/grounding và cảnh báo dừng khi kích hoạt phân ly/ký ức đau buồn. |
| **§4.6 Psychoeducation (10 Modules)** | 🔴 Missing (~5%) | `planned` | Mới chỉ có đoạn giới thiệu ngắn CBT/TEAM-CBT/DBT/IPSRT; **chưa có** 10 bài học có phiên bản, tác giả, người duyệt, nguồn trích dẫn và giới hạn y khoa. |
| **§4.7 FFT & Caregiver Support** | 🔴 Missing (0%) | `planned` | **Chưa triển khai** cả trong `SPEC.md` lẫn code (6 thành phần FFT, lời mời người thân `CaregiverInvitation`, phân quyền chi tiết `AccessGrant`, thu hồi & audit). |
| **§5. Protocol Spec Format & Lifecycle** | 🔴 Missing (~20%) | `draft` | 17 file trong `packages/clinical-protocols-kb/references/` mới có 9 trường frontmatter cơ bản; **thiếu** 10+ trường quản trị bắt buộc (`status`, `intended_audience`, `eligibility`, `evidence_references`, `clinical_approvals`, `localization`) và **chưa có** schema validator + lifecycle gate. |
| **§6. Assessment & Measurement Framework** | 🟡 Partial (~60%) | `draft` | Đã có `BMS`, `PHQ-9`, `GAD-7`, `ASRM`, `MDQ`, `ISI` + unit test; **thiếu** `WHO-5`, `C-SSRS` (hoặc thang đánh giá tự sát được duyệt), metadata bản quyền/thẩm định tiếng Việt, và các **Outcome Domains** ngoài điểm triệu chứng. |
| **§7. Medication Support** | 🟡 Partial (~25%) | `draft` | Mới chỉ có mảng `medicationsTaken` trong `DailyMoodAndRhythmLog`; **thiếu** tách biệt `MedicationReminder` vs `MedicationLog`, ghi nhận tác dụng phụ trung tính và banner xác nhận không thay đổi liều. |
| **§8. AI Assistant Boundaries & Grounded RAG** | 🟢 Strong (~80%) | `draft` | Đã có Grounded RAG threshold `0.46`, `[KB:chunk_id]`, abstention, Layer 4 Output Guardrail, Ollama/Cloud fallback; **cần bổ sung** tách biệt rõ phần trích xuất KB vs lời hỗ trợ, xác nhận người dùng trước khi lưu tóm tắt AI, nút `skip/pause/stop/talk to a person` đồng nhất. |
| **§9. Data Model, Provenance & Privacy** | 🟡 Partial (~45%) | `draft` | Đã có 6 bảng Supabase (RLS, pgvector, E2EE blobs, hash-chained audit, clinician share `#key=`); **thiếu** trường `provenance` trên dữ liệu lâm sàng và 15 thực thể khái niệm (hoặc ánh xạ chính thức vào schema hiện tại). |
| **§10. UX Requirements & Reports** | 🟡 Partial (~70%) | `draft` | Mobile đã tối giản 4 tab + nút SOS + không phạt chuỗi ngày; Web còn 6 tab và **thiếu** khu vực **Support** (Safety Plan + danh bạ xác minh + caregiver), **thiếu** bước **Preview & Redaction** trước khi xuất/chia sẻ báo cáo. |
| **§11. Testing & Release Gates** | 🟡 Partial (~60%) | `draft` | Đã có 12 test Web, `clinical-core.test.ts`, `test_backend.py`, `evaluate_rag.py`, `run_redteam_audit.py` (105 case), Flutter tests; **thiếu** protocol schema validation tests, safety edge-case tests (offline, stale directory, deprecated protocol mid-session, caregiver revocation), và bảng theo dõi 9 Release Gates. |

---

## 2. Xung đột & Điểm Vênh Cần Quyết định Giữa `CLINICAL_PROTOCOL_MASTER_PLAN.md` và `SPEC.md`

Theo **§14 (Guidance for AI coding agents)**, mọi xung đột dưới đây được báo cáo minh bạch và **không tự ý ghi đè**:

| # | Hạng mục Xung đột | Trong `SPEC.md` & Code Hiện tại | Trong `CLINICAL_PROTOCOL_MASTER_PLAN.md` | Khuyến nghị Xử lý |
| :-: | :--- | :--- | :--- | :--- |
| **C1** | **Phạm vi Liệu pháp** | Chỉ gồm CBT, TEAM-CBT, DBT, IPSRT (+ Thiền ngủ). | Mở rộng thêm **MBCT** (§4.5), **Psychoeducation 10 bài** (§4.6) và **FFT / Caregiver** (§4.7). | Giữ `SPEC.md` làm kiến trúc kỹ thuật; bổ sung 3 phân hệ này ở Phase 2–5 theo quyết định sản phẩm (#6 trong §13). |
| **C2** | **Trạng thái An toàn & Phân loại Rủi ro** | `four_layer_safety.py` trả về `severity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL"` và `action: "proceed" | "safety-stop" | ...`. | §2.3 yêu cầu 5 trạng thái luồng ứng dụng (`routine_support`, `distress_support`, `professional_follow_up_recommended`, `urgent_human_support`, `emergency_guidance`) và **cấm tuyên bố "low risk"** chỉ vì không có cảnh báo kích hoạt. | Ánh xạ `severity` nội bộ sang 5 `pathway_state` chuẩn và loại bỏ hoàn toàn nhãn "Low Risk" ở UI/API. |
| **C3** | **Phát hiện Nguy cơ Tự sát** | Kích hoạt `safety-stop` trực tiếp từ Regex Layer 1 + `PHQ-9 item 9 > 0` + `BMS Suicide >= 1`. | §3.2 & §11.2 cấm phân loại nguy cơ chỉ từ PHQ-9 câu 9 hoặc chỉ từ từ khóa; yêu cầu quy trình đánh giá có cấu trúc (ví dụ C-SSRS) được chuyên gia duyệt. | Giữ lớp chặn nhanh (fail-safe) hiện tại, nhưng bổ sung luồng sàng lọc an toàn có cấu trúc + màn hình hỗ trợ tức thì không bắt buộc trả lời khảo sát (§3.3). |
| **C4** | **Chấm điểm IPSRT & Ngưỡng Hưng cảm** | `bipolar-engine.ts` tính `stabilityScore (0–100)` và cảnh báo `maniaProdromeDetected` khi ngủ `< 5h` trong `>= 2` đêm; lưu `HH:mm` không có timezone. | §3.5 & §4.4 cấm dùng 1 ngưỡng giờ ngủ duy nhất làm bộ phát hiện hưng cảm, cấm gọi điểm tự chế là Social Rhythm Metric đã kiểm chứng, yêu cầu lưu raw timestamp + timezone và so sánh với baseline cá nhân. | Đổi nhãn `stabilityScore` thành "Chỉ số đều đặn tham khảo (không phải SRM chuẩn hóa)", lưu thêm `timezoneOffset`, và yêu cầu đa tín hiệu (giảm nhu cầu ngủ + khí sắc/năng lượng/lời nói). |
| **C5** | **Hồ sơ Lâm sàng & `DisorderFocus`** | `models.ts` dùng `UserClinicalProfile.primaryFocus: DisorderFocus[]` (gồm `'bipolar_1'`, `'bipolar_2'`...). | §1.3 & §2.2 cấm gộp chẩn đoán, sàng lọc và lựa chọn người dùng vào 1 trường; phải tách 7 thực thể (`screening_result`, `reported_history`, `clinical_assessment`, `current_self_reported_state`, `safety_status`, `support_plan`, `clinician_approved_plan`). | Tái cấu trúc domain model sang dạng tách bạch + gắn `provenance` cho từng trường. |
| **C6** | **Chu kỳ Đánh giá lại (Reassessment)** | `SPEC.md` §8 ấn định cứng PHQ-9/GAD-7/ISI mỗi 2 tuần, ASRM hàng tuần. | §6.3 yêu cầu lịch đánh giá lại do chuyên gia duyệt, không mặc định mọi thang đo đều lặp lại mỗi 14 ngày, và giải thích lý do khi nhắc làm lại. | Chuyển lịch nhắc thành cấu hình linh hoạt (`reassessment_policy`) kèm lý do hiển thị cho người dùng. |
| **C7** | **Quản trị Phiên bản & Trạng thái Protocol** | 17 file KB Markdown gắn sẵn `version: "1.0.0"` dù chưa có biên bản duyệt lâm sàng. | §5.1–5.3 & Appendix B cấm đánh dấu `approved` / `released` nếu thiếu `clinical_approvals` có tên người duyệt, vai trò, ngày duyệt và nguồn tham khảo. | Hạ trạng thái toàn bộ 17 protocol hiện tại về `status: draft` (hoặc `in_clinical_review`) trong metadata cho đến khi có sign-off. |

---

## 3. Đối chiếu Chi tiết Theo Từng Module & Kho Mã nguồn

### 3.1. Danh mục Protocol (§4) — Đã có vs. Còn thiếu

| Liệu pháp | Đã có trong Code / KB (`implemented` hoặc `partial`) | Còn thiếu theo Master Plan (`missing`) |
| :--- | :--- | :--- |
| **CBT (11)** | `CBT_THOUGHT_RECORD` (7 bước + Accuracy Check), `CBT_COGNITIVE_REAPPRAISAL` (trong Thought Record & 36 tools), `CBT_BEHAVIORAL_ACTIVATION` (6 bước + Rest Check), `CBT_WORRY_MONITORING` (Worry Box), `CBT_EXPOSURE_PLANNING` (Exposure Hierarchy + Safety Behavior), `CBT_PROBLEM_SOLVING` (trong 36 tools), `CBT_RELAPSE_PREVENTION` (Ulysses/Prodrome). | `CBT_INTOLERANCE_UNCERTAINTY`, `CBT_PANIC_PSYCHOEDUCATION` (tách bạch rõ triệu chứng thực thể cần khám y khoa), `CBT_INTEROCEPTIVE_EXPOSURE` (gắn cờ `clinician-assisted` + medical screen riêng), `CBT_SOCIAL_ANXIETY` (formulation riêng). |
| **TEAM-CBT (7)** | `TEAM_EMPATHY_EXPLORATION` (EAR mode), `TEAM_PARADOXICAL_AGENDA`, `TEAM_POSITIVE_REFRAMING`, `TEAM_COST_BENEFIT_ANALYSIS` (trong 36 tools). | `TEAM_SESSION_AGENDA`, `TEAM_MOTIVATION_CHECK`, `TEAM_SKILL_REVIEW`; cần gắn nhãn rõ *"công cụ tự phản tư lấy cảm hứng từ TEAM-CBT, không phải trị liệu TEAM-CBT đầy đủ"* và loại bỏ ngôn ngữ đổ lỗi "kháng cự" (§4.2). |
| **DBT (19)** | **Mindfulness:** `DBT_WISE_MIND`. **Distress Tolerance:** `DBT_STOP`, `DBT_TIPP_SAFE_OPTIONS` (có medical screen), `DBT_ACCEPTS`, `DBT_SELF_SOOTHE`, `DBT_PROS_CONS`, `DBT_RADICAL_ACCEPTANCE`. **Emotion Reg:** `DBT_EMOTION_NAMING` (5-Family Affect), `DBT_OPPOSITE_ACTION`, `DBT_PLEASE` (`abc-please`). **Interpersonal:** `DBT_DEAR_MAN`. *(Bonus: `Chain Analysis` + 2 Hard Stops).* | **Mindfulness:** `DBT_OBSERVE_DESCRIBE`, `DBT_NONJUDGMENTAL_STANCE`, `DBT_ONE_MINDFULLY`. **Emotion Reg:** `DBT_CHECK_THE_FACTS` (giao thức độc lập), `DBT_BUILD_POSITIVE_EXPERIENCES`. **Interpersonal:** `DBT_GIVE`, `DBT_FAST`, `DBT_BOUNDARY_SETTING`. Cần thêm phương án **không cần gõ chữ** & nút **Dừng/Thoát an toàn** chuẩn hóa trên mọi kỹ năng. |
| **IPSRT (7)** | `IPSRT_DAILY_RHYTHM_LOG` (5 mốc), `IPSRT_RHYTHM_REVIEW` (so sánh target anchors), `IPSRT_EARLY_WARNING_PLAN` (Ulysses Contract), `IPSRT_CLINICIAN_REPORT` (PDF/Markdown). | `IPSRT_RHYTHM_BASELINE` (thiết lập baseline cá nhân có timezone), `IPSRT_SOCIAL_EVENT_LOG` (nhật ký sự kiện xã hội làm xáo trộn nhịp), `IPSRT_ROUTINE_PLANNING` (lập kế hoạch điều chỉnh từng bước). |
| **MBCT (8)** | Chỉ có 3 bài audio *Thiền Buông Thư* (`sleep-meditation.ts` / `sleep_meditation_script.dart`). | Toàn bộ 8 bài: `MBCT_AUTOMATIC_PILOT`, `MBCT_BODY_SCAN`, `MBCT_MINDFUL_BREATHING`, `MBCT_PRESENT_MOMENT`, `MBCT_ALLOWING_AND_ACCEPTING`, `MBCT_THOUGHTS_ARE_NOT_FACTS`, `MBCT_RESPONDING_NOT_REACTING`, `MBCT_RELAPSE_AWARENESS` + cảnh báo dừng khi phân ly/kích động. |
| **Psychoeducation (10)** | Chưa có kho bài viết có cấu trúc. | Toàn bộ 10 bài viết được duyệt & quản lý phiên bản (§4.6) kèm tác giả, người duyệt, nguồn trích dẫn, ngày duyệt và giới hạn y khoa. |
| **FFT (6)** | Chưa có. | `FFT_PSYCHOEDUCATION`, `FFT_COMMUNICATION_LISTENING`, `FFT_COMMUNICATION_PRACTICE`, `FFT_PROBLEM_SOLVING`, `FFT_EARLY_WARNING_PLAN`, `FFT_CAREGIVER_SELF_CARE` + luồng phân quyền Caregiver. |

### 3.2. Khoảng trống Kiến trúc Dữ liệu (`supabase/migrations/0001_...sql` & `models.ts`)
- **Đã có (6 bảng SQL):** `e2ee_sync_blobs`, `session_checkpoints`, `safety_audit_logs`, `outbox_events`, `clinical_kb_chunks`, `clinician_share_links`.
- **Còn thiếu so với §9 Master Plan:**
  1. `provenance` enum (`user_self_report`, `questionnaire`, `clinician_entry`, `device_derived`, `ai_summary_confirmed`, `system_derived`) trên mọi bản ghi lâm sàng.
  2. Tách bảng/schema rõ ràng cho: `UserProfile` (kèm consent & age gate), `ReportedHistory`, `ClinicalAssessment` (kèm `instrument_version`, `license_status`), `SafetyEvent` (lưu *hướng dẫn đã hiển thị* + *lựa chọn của người dùng*), `SafetyPlan` (6 mục chuẩn §3.4), `PathwayPlan`, `TherapyProtocol` / `ProtocolVersion` / `ClinicianReview` / `ContentSource`.
  3. `MedicationReminder` tách biệt hoàn toàn với `MedicationLog` (`taken | missed | uncertain` + side effects).
  4. `CaregiverInvitation` & `AccessGrant` (granular permissions + revocation + audit) nếu bật Caregiver Mode.

### 3.3. 10 Quyết định Mở Bắt buộc Phải Được Chủ sản phẩm / Chuyên gia Lâm sàng / Pháp lý Chốt (§13)
*(AI coding agent không được tự ý giả định — các task phụ thuộc sẽ được gắn trạng thái `blocked` cho đến khi có quyết định):*
1. Độ tuổi mục tiêu bản phát hành đầu tiên: chỉ người lớn (`18+`) hay có vị thành niên?
2. Định vị sản phẩm: `self-help only`, `clinician-supported`, hay `regulated digital therapeutic (SaMD)`?
3. Quốc gia/khu vực triển khai ban đầu và danh mục đường dây nóng khẩn cấp đã xác minh (có `last_verified_date`)?
4. Có quy trình bác sĩ duyệt lộ trình trong app hay chỉ gợi ý kỹ thuật phi chẩn đoán?
5. Phiên bản tiếng Việt nào của `PHQ-9`, `GAD-7`, `MDQ`, `ASRM`, `ISI`, `WHO-5`, `C-SSRS` đã có bản quyền/thẩm định?
6. Có đưa `Caregiver Mode` (FFT) vào bản phát hành đầu tiên (v1) không?
7. Phạm vi dữ liệu lưu cục bộ vs đồng bộ server vs chia sẻ bác sĩ & chính sách lưu giữ/xóa dữ liệu?
8. Mô hình phản hồi của con người cho tin nhắn khẩn cấp (xác nhận rõ app **không** giám sát 24/7)?
9. Danh sách phân loại protocol nào là `self-guided` vs `clinician-assisted` (đặc biệt `CBT_INTEROCEPTIVE_EXPOSURE`, `CBT_EXPOSURE_PLANNING`, `DBT` toàn diện)?
10. Chuẩn bằng chứng tối thiểu để nâng trạng thái một protocol từ `draft` lên `approved`?
