# 08 — Kế hoạch triển khai

12 tuần là ước lượng lập kế hoạch, không phải cam kết. Chốt effort sau inventory. Mỗi task có PR nhỏ, owner được chỉ định, test evidence và rollback. Không mở rộng feature khi P0 chưa xử lý.

| ID | Tuần | Task | Phụ thuộc | Nghiệm thu |
|---|---|---|---|---|
| T01 | 1 | Baseline SHA, routes, storage, catalog inventory | — | Báo cáo có mapping và test baseline |
| T02 | 1–2 | Auth thật, guest/demo tách biệt | T01 | AUTH-01..05 pass |
| T03 | 1–2 | Server roles, RLS, remove toggle | T01,T02 | AUTH-06..08 pass |
| T04 | 1–2 | Empty clinical defaults, SOS, content gate | T01 | SAFE-01..05 pass |
| T05 | 3–4 | Tokens, AppShell, 4 tabs, redirects | T04 | UX-01..04 pass |
| T06 | 3–4 | Welcome, login, Hôm nay | T02,T05 | Guest/account flows pass |
| T07 | 5–6 | Canonical schema, catalog migration, parity | T01,T04 | CAT-01..04 pass |
| T08 | 5–6 | Library, filters, session player | T05,T07 | CAT-05, UX-05 pass |
| T09 | 7–8 | Persistence, sync, plan, progress | T03,T08 | DATA-01..05 pass |
| T10 | 9–10 | Caregiver/clinician consent, reviewer workflow | T03,T07,T09 | SAFE-06, AUTH-08 pass |
| T11 | 11–12 | Accessibility, E2E, security, clinical UAT | T02–T10 | All release gates pass |
| T12 | 12 | Staging rollout, backup/rollback drill, release | T11 | Sign-off engineering + clinical + privacy |

## Architecture targets
Next.js: keep current framework; route groups `(public)`, `(patient)`, `(clinician)`, `(admin)`; `src/features/{auth,onboarding,practice-library,session-player,care-plan,safety-plan,meditation,progress,caregiver}`; shared UI and server authorization modules. Flutter: equivalent feature modules, repositories, router guards, shared tokens. Canonical catalog/schema in shared package or generated assets. Confirm monorepo tooling before choosing path.

## Refactor sequence
Extract pure logic and add characterization tests before splitting `EquilibriaClinicalApp.tsx` and `ClinicalMasterPlanHub.tsx`. Move one feature at a time, preserve working routes, replace old implementation only after parity. Avoid rewriting both apps simultaneously without contract tests. Feature flags default off for unfinished work; flags never bypass safety/auth gates. Database migrations additive first; destructive cleanup only after backup and validation.

## PR template
Task ID; baseline; scope/non-scope; files; migration; security/clinical impact; screenshots (synthetic); commands and actual results; known failures; rollback; reviewer. Never report tests as passed unless executed.

## Release strategy
Staging with synthetic accounts → internal QA → clinical review → limited rollout → general release after gates. Monitor technical error rates without sensitive payload. Roll back UI/catalog version on regressions; security fixes must not roll back to insecure legacy auth. Stop rollout on access leakage, unsafe content or blocked SOS.
