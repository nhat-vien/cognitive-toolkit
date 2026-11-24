# Agent instructions — Equilibria V2

Read README and docs before changes. Existing repository instructions take precedence where compatible; surface conflicts rather than silently replacing them. Work from task IDs in IMPLEMENTATION_PLAN_V2. Start by inspecting repository, commit, package scripts, migrations and current tests. Do not assume proposed routes or schema exist.

## Non-negotiable
- No fake auth, client-controlled roles, hardcoded clinical records, invented references, or unreviewed clinical publication.
- Never expose secrets or real patient data in logs, prompts, fixtures or commits. Do not run destructive migrations against production.
- SOS remains available without auth; safety and authorization checks enforced server-side where applicable.
- Do not make clinical decisions or claim clinical approval. Escalate to qualified reviewer.
- Preserve unrelated changes; do not force push, rewrite history, or deploy without authorization.
- No fabricated test outcomes. State commands actually run and failures.

## Workflow
1. Inspect and write a short task plan with affected contracts and risk.
2. Add regression tests; implement smallest coherent change.
3. Run applicable lint/typecheck/unit/integration/build; inspect UI at target sizes.
4. Review authorization, privacy, accessibility and clinical gates.
5. Report diff summary, evidence, limitations, rollback and next task. Stop for human approval before destructive migration, production deployment or clinical publication.

## Agent roles
Coordinator assigns tasks and resolves dependencies; UX agent owns tokens/navigation and accessibility; security agent owns auth/RLS/threat model; content engineer owns catalog migration and parity; web/mobile agents implement shared contracts; QA agent independently tests; qualified human clinical reviewer approves content. AI agents cannot substitute for clinical sign-off.

## First execution prompt
Implement T01 only. Inventory current routes, authentication paths, storage keys, database policies, catalog IDs and existing tests on both platforms. Record baseline commit SHA, actual test outputs, discrepancies with V2 documents and proposed PR boundaries. Do not modify production code yet. Then propose T02–T04 sequence and request review.
