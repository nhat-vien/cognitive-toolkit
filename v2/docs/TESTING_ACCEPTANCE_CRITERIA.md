# 09 — Test & Acceptance

All cases below are planned, not executed. Record actual result, commit, platform, evidence, owner. Use synthetic data only.

| ID | Scenario | Expected |
|---|---|---|
| AUTH-01 | Google unconfigured/cancelled | No authenticated identity |
| AUTH-02 | Real Google/email login, callback, reset | Valid server session; invalid redirect rejected |
| AUTH-03 | Guest calls private API | 401/403; local guest remains usable |
| AUTH-04 | Guest upgrade, decline then accept import | No upload before consent; no duplicate on retry |
| AUTH-05 | Logout/restart/account switch | No prior account data visible |
| AUTH-06 | Forge role/email prefix/client metadata | No privilege escalation |
| AUTH-07 | User A requests B object via API/direct DB | Denied read/write/delete |
| AUTH-08 | Caregiver grant expired/revoked; admin reads diary | Denied outside explicit scope |
| SAFE-01 | Fresh account/guest | No fabricated scores, meds, contacts, consent |
| SAFE-02 | SOS from login/session/offline | Accessible; verified resources or clear fallback |
| SAFE-03 | Draft/withdrawn via search/deep link | Cannot start |
| SAFE-04 | Clinician-assisted direct session URL | Cannot self-start |
| SAFE-05 | AI requests medication change / crisis help | Approved safety behavior, no diagnosis/prescribing |
| SAFE-06 | Share report then revoke | Scope enforced, future access denied |
| UX-01 | 320–1440px and text 200% | No clipped primary actions; responsive nav |
| UX-02 | Keyboard/screen reader | Logical focus, names, dialogs, SOS accessible |
| UX-03 | Light/dark/reduced motion | Contrast AA, no forced motion/audio |
| UX-04 | Empty/error/loading/offline | Clear recovery, no fake success |
| UX-05 | Start/pause/stop/resume | Correct checkpoint and status, no forced completion |
| CAT-01 | Inventory all legacy items | Every ID mapped or documented conflict |
| CAT-02 | Web/mobile catalog version | Same IDs, eligibility and metadata |
| CAT-03 | Invalid schema/missing safety fields | CI fails or content excluded |
| CAT-04 | Publish new version | Old session retains version; withdrawal enforced online |
| CAT-05 | Search/filter needs and duration | Eligible results only, clear empty state |
| DATA-01 | Refresh/restart | Authorized progress restored |
| DATA-02 | Offline retry twice | Idempotent, no duplicate |
| DATA-03 | Concurrent safety plan edits | Conflict shown, no silent overwrite |
| DATA-04 | Export/delete | Verified owner, scope correct, retention disclosed |
| DATA-05 | Logs/analytics inspection | No secrets or sensitive payload |

## Test layers
Unit: eligibility, mapping, scoring only against approved fixtures, state transitions. Integration: RLS, auth callback, consent, sync. E2E: web browser and Flutter device/emulator. Manual: accessibility, Vietnamese copy, clinical safety, offline. Security: dependency/secret scan, threat model and authorization tests. Discover actual package scripts before running; suggested commands only: repository-defined lint/typecheck/test/build, `flutter analyze`, `flutter test` and integration suite.

## Release gates
All P0 cases pass on both applicable platforms; no unresolved critical/high security issue; all published content has valid review; no known blocker for SOS or core flows; clinical/privacy sign-off documented. Proposed usability target: at least 90% task completion in moderated pilot, report sample size and actual results; not a clinical efficacy claim. Record performance baseline and regression budget before enforcing numeric thresholds.
