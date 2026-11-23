# RELEASE READINESS, APPROVAL GATES & KNOWN LIMITATIONS REPORT (§11.4 & Appendix A/B)

**Project:** Cognitive Toolkit (Haven / Equilibria)  
**Report Version:** `0.1.0-draft`  
**Date:** 2026-11-23  
**Software Implementation Status:** Implemented & Automated Tests Passing (`clinical-core-ts`, `web-nextjs`, `backend-api`, `mobile-flutter`, `supabase/migrations/0002_clinical_master_plan_alignment.sql`)  
**Clinical Approval Status:** `draft` (Awaiting human sign-off on Release Gates 1–6 & 8)

---

## 1. Status of the 9 Mandatory Release Gates (§11.4)

| Gate # | Release Gate | Status | Evidence / Blocker Note |
| :-: | :--- | :---: | :--- |
| **Gate 1** | **Product Owner Approval** | ⏳ `blocked` | Requires Product Owner decision on the 10 Open Questions in §13 of `CLINICAL_PROTOCOL_MASTER_PLAN.md`. |
| **Gate 2** | **Clinical Content Review** | ⏳ `in_clinical_review` | All 68 protocol manifests in `MASTER_PROTOCOL_CATALOG` are enforced at `status: "draft"`; `validateProtocolManifest()` blocks transitioning to `"approved"` until named `clinical_approvals` are recorded. |
| **Gate 3** | **Safety Review** | ⏳ `in_safety_review` | Deterministic Safety Subsystem (`evaluateMasterPlanSafetySubsystem`), 6-Section Personal Safety Plan, and Offline Emergency Directory (`packages/clinical-protocols-kb/safety/emergency_directory.json`) are implemented and tested across all 12 scenarios in §11.2. Requires clinical safety reviewer sign-off. |
| **Gate 4** | **Evidence & Licensing Review** | ⏳ `in_content_review` | Initial register created in [docs/EVIDENCE_AND_REFERENCE_REGISTER.md](file:///d:/NC2026/cognitive-toolkit/docs/EVIDENCE_AND_REFERENCE_REGISTER.md) and `INSTRUMENT_GOVERNANCE_REGISTRY`. Requires licensing verification for MDQ, ASRM, ISI, BMS, C-SSRS, TEAM-CBT, and DBT adaptations. |
| **Gate 5** | **Localization Review (Vietnamese)** | ⏳ `in_content_review` | Bilingual (`vi-VN` / `en`) strings and Vietnamese crisis hotlines (`115`, `111`, `1900 1267`, `028 3923 4675`) are implemented; requires local Vietnamese mental-health expert validation. |
| **Gate 6** | **Privacy / Legal Review** | ⏳ `blocked` | Zero-Knowledge E2EE, granular Caregiver `AccessGrant` (default-off for private journals/sessions/assessments), and Report Preview & Redaction are implemented; requires jurisdiction-specific legal sign-off. |
| **Gate 7** | **Automated Software & Safety Tests** | ✅ **PASSED** | Unit tests, 19-field protocol schema validation, 5-state safety workflow transitions, 12 safety edge cases (§11.2), 105-case AI red-team audit, E2EE/CRDT tests, and offline emergency directory tests all pass 100%. |
| **Gate 8** | **Human Usability Testing** | ⏳ `planned` | Requires supervised usability testing with target adult users and clinicians. |
| **Gate 9** | **Release Notes & Rollback Plan** | ✅ **READY** | Immutable `protocol_versions` table (`0002_clinical_master_plan_alignment.sql`), graceful mid-session deprecation handler (`resolveInProgressSessionOnProtocolUpdate`), and OTA version rollback ready. |

---

## 2. Known Limitations Visible to Users and Maintainers (Appendix A)

1. **Not a Medical Device Diagnosis or Prescription Tool:** Scores from `PHQ-9`, `GAD-7`, `MDQ`, `ASRM`, `ISI`, `BMS`, and `WHO-5` are screening or self-monitoring aids only and are never stored or displayed as clinical diagnoses (`isDiagnosis: false`).
2. **No Autonomous Risk Clearance:** Absence of a safety trigger sets the application state to `routine_support` with `claimsUserIsLowRisk: false` — the app never tells a user or clinician that a user is "low risk" or "safe".
3. **Not Continuously Monitored 24/7:** Emergency banners explicitly inform users and caregivers that the application is not monitored in real time by human responders and cannot automatically dispatch ambulances.
4. **Self-Help Skills ≠ Full Psychotherapy:** Completing an in-app CBT, TEAM-CBT, DBT, IPSRT, MBCT, or FFT skill is explicitly marked `equates_to_full_clinical_treatment: false`.
5. **Individualized Rhythm Regularity ≠ Validated SRM:** Daily IPSRT anchor tracking compares against the user's personal baseline with timezone context and explicitly avoids claiming a licensed Social Rhythm Metric score.
