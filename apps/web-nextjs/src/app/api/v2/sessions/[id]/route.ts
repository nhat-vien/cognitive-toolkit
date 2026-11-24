import { verifyServerSessionToken } from '../../../../../clinical/auth-account.ts';
import { globalV2ClinicalRepository } from '../../../../../clinical/v2-data-sync-and-grants.ts';
import {
  checkpointPracticeSessionStep,
  transitionPracticeSessionLifecycle,
} from '../../../../../clinical/unified-practice-library.ts';

/**
 * V2 Practice Session Detail & Step Checkpoint API (`PATCH /api/v2/sessions/:id`) — `DATA_ARCHITECTURE.md`, `UX-05`, `CAT-04`
 * - Saves step checkpoint by `stepId` or transitions session lifecycle (`pause`, `resume`, `stop`, `complete`).
 * - Preserves the session's locked `itemVersion` (`CAT-04`).
 * - Idempotent on `(userId, idempotencyKey)` (`DATA-02`).
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authHeader = request.headers.get('authorization') || undefined;
  const verified = verifyServerSessionToken(authHeader);

  if (!verified.valid || !verified.userId) {
    return Response.json(
      { status: 'unauthorized', errorCode: verified.errorCode },
      {
        status: verified.errorCode === 'guest_or_demo_not_authenticated' ? 403 : 401,
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  }

  const resolvedParams = await context.params;
  const sessionId = resolvedParams.id || '';

  const body = (await request.json()) as {
    idempotencyKey?: string;
    stepCheckpoint?: {
      stepId: string;
      outcome: 'completed' | 'skipped';
      privateNoteLocalOnly?: string;
    };
    lifecycleTransition?: 'pause' | 'resume' | 'stop' | 'complete';
  };

  if (!body.idempotencyKey) {
    return Response.json(
      { status: 'unprocessable', errorCode: 'missing_idempotency_key' },
      { status: 422, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const sessions = globalV2ClinicalRepository.getPracticeSessions(verified.userId);
  const existing = sessions.find((s) => s.sessionId === sessionId);

  if (!existing) {
    return Response.json(
      { status: 'not_found', errorCode: 'session_not_found' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  let updated = existing;

  if (body.stepCheckpoint) {
    const cp = checkpointPracticeSessionStep(updated, body.stepCheckpoint);
    if (!cp.valid || !cp.data) {
      return Response.json(
        { status: 'unprocessable', errors: cp.errors },
        { status: 422, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    updated = cp.data;
  }

  if (body.lifecycleTransition) {
    const tr = transitionPracticeSessionLifecycle(updated, body.lifecycleTransition);
    if (!tr.valid || !tr.data) {
      return Response.json(
        { status: 'unprocessable', errors: tr.errors },
        { status: 422, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    updated = tr.data;
  }

  const saved = globalV2ClinicalRepository.savePracticeSession(
    verified.userId,
    updated,
    body.idempotencyKey,
  );

  return Response.json(saved, {
    status: 200,
    headers: { 'Cache-Control': 'no-store' },
  });
}
