# Equilibria Cognitive Toolkit — V2 Implementation Pack

Baseline: review of repository `nhat-vien/cognitive-toolkit`, branch main. This is a proposed specification, not evidence of completed implementation or clinical approval. Revalidate source paths and baseline commit before editing.

## Reading order
1. UI_UX_AUDIT — baseline and risks.
2. INFORMATION_ARCHITECTURE + UI_UX_V2_DESIGN_SPEC — product contract.
3. AUTH_SECURITY_REFACTOR + CLINICAL_SAFETY_SPEC — release blockers.
4. UNIFIED_PRACTICE_LIBRARY + DATA_ARCHITECTURE — content and persistence.
5. IMPLEMENTATION_PLAN_V2 + TESTING_ACCEPTANCE_CRITERIA — execution and gates.
6. AGENTS.md — copy to repository root only after merging existing instructions.

All other documents are in `docs/`. Merge with existing repository documents; do not overwrite existing policies blindly. Vietnamese is the default UI language. Code identifiers are English. Clinical content must be reviewed by qualified professionals before publication. No real patient data in fixtures, prompts or logs.

## Definition of success
A person can access emergency help without authentication, choose guest or real account, identify a need, find an eligible practice, complete it, and optionally save progress. Web and mobile share content IDs, safety rules and access policies. No fake authentication, client-controlled roles or invented clinical records.
