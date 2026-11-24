import { verifyServerSessionToken } from '../../../../clinical/auth-account.ts';
import {
  globalV2ClinicalRepository,
} from '../../../../clinical/v2-data-sync-and-grants.ts';
import {
  UNIFIED_PRACTICE_LIBRARY_CATALOG,
  createPracticeSessionPreview,
  startPracticeSession,
  checkpointPracticeSessionStep,
  transitionPracticeSessionLifecycle,
} from '../../../../clinical/unified-practice-library.ts';

/**
 * V2 Sessions & Safety Plan Idempotent API (`/api/v2/sessions`) — `DATA-01..03`, `CAT-03..04`, `UX-05`
 * - Enforces authenticated server session token (`AUTH-03`, `AUTH-07`).
 * - Supports idempotent session creation/checkpointing (`DATA-02`) and versioned SafetyPlan conflict detection (`DATA-03`).
 */
export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const requestedUserId = searchParams.get('userId');
  if (requestedUserId && requestedUserId !== verified.userId) {
    return Response.json(
      { status: 'forbidden', errorCode: 'cross_user_access_denied' },
      { status: 403, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  return Response.json(
    {
      status: 'ok',
      userId: verified.userId,
      sessions: globalV2ClinicalRepository.getPracticeSessions(verified.userId),
      checkins: globalV2ClinicalRepository.getCheckIns(verified.userId),
      safetyPlan: globalV2ClinicalRepository.getSafetyPlan(verified.userId),
    },
    { status: 200, headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function POST(request: Request) {
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

  const body = (await request.json()) as {
    entityType: 'checkin' | 'safety_plan' | 'practice_session';
    idempotencyKey?: string;
    userId?: string;
    payload?: Record<string, unknown>;
  };

  if (body.userId && body.userId !== verified.userId) {
    return Response.json(
      { status: 'forbidden', errorCode: 'cross_user_write_denied' },
      { status: 403, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const idempotencyKey = (body.idempotencyKey ?? '').trim();
  if (!idempotencyKey) {
    return Response.json(
      { status: 'unprocessable', errorCode: 'missing_idempotency_key' },
      { status: 422, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  if (body.entityType === 'checkin') {
    const p = body.payload ?? {};
    const res = globalV2ClinicalRepository.saveCheckIn({
      id: typeof p.id === 'string' && p.id ? p.id : `chk_${Date.now()}`,
      userId: verified.userId,
      idempotencyKey,
      moodPolarity: typeof p.moodPolarity === 'number' ? p.moodPolarity : undefined,
      energyLevel: typeof p.energyLevel === 'number' ? p.energyLevel : undefined,
      distressIntensity: typeof p.distressIntensity === 'number' ? p.distressIntensity : undefined,
      sleepHours: typeof p.sleepHours === 'number' ? p.sleepHours : undefined,
      note: typeof p.note === 'string' ? p.note : undefined,
    });
    return Response.json(res, {
      status: res.httpStatus,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  if (body.entityType === 'safety_plan') {
    const p = body.payload ?? {};
    const res = globalV2ClinicalRepository.upsertSafetyPlan({
      id: typeof p.id === 'string' && p.id ? p.id : `sp_${verified.userId}`,
      userId: verified.userId,
      idempotencyKey,
      expectedRevision: typeof p.expectedRevision === 'number' ? p.expectedRevision : 0,
      section1WarningSigns: Array.isArray(p.section1WarningSigns) ? (p.section1WarningSigns as string[]) : [],
      section2InternalCoping: Array.isArray(p.section2InternalCoping) ? (p.section2InternalCoping as string[]) : [],
      section3SocialDistractions: Array.isArray(p.section3SocialDistractions)
        ? (p.section3SocialDistractions as string[])
        : [],
      section4TrustedContacts: Array.isArray(p.section4TrustedContacts)
        ? (p.section4TrustedContacts as Array<{ name: string; phone: string; relationship: string }>)
        : [],
      section5ProfessionalContacts: Array.isArray(p.section5ProfessionalContacts)
        ? (p.section5ProfessionalContacts as Array<{ name: string; phone: string }>)
        : [],
      section6EnvironmentSafety: Array.isArray(p.section6EnvironmentSafety)
        ? (p.section6EnvironmentSafety as string[])
        : [],
      explicitContactStorageConsent: p.explicitContactStorageConsent === true,
    });
    return Response.json(res, {
      status: res.httpStatus,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  if (body.entityType === 'practice_session') {
    const p = body.payload ?? {};
    const itemId = typeof p.itemId === 'string' ? p.itemId : '';
    const item = UNIFIED_PRACTICE_LIBRARY_CATALOG.find((i) => i.id === itemId);
    if (!item) {
      return Response.json(
        { status: 'not_found', errorCode: 'practice_item_not_found' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    const preview = createPracticeSessionPreview(item);
    const started = startPracticeSession(preview, item);
    if (!started.valid || !started.data) {
      return Response.json(
        { status: 'forbidden', errorCode: 'practice_not_eligible', errors: started.errors },
        { status: 403, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    let session = started.data;
    if (p.checkpointFirstStep === true && session.stepsSnapshot[0]) {
      const cp = checkpointPracticeSessionStep(session, {
        stepId: session.stepsSnapshot[0].id,
        outcome: 'completed',
      });
      if (cp.valid && cp.data) session = cp.data;
    }
    if (p.lifecycleAction === 'complete' || p.lifecycleAction === 'stop' || p.lifecycleAction === 'pause') {
      const tr = transitionPracticeSessionLifecycle(session, p.lifecycleAction);
      if (tr.valid && tr.data) session = tr.data;
    }

    const saved = globalV2ClinicalRepository.savePracticeSession(
      verified.userId,
      session,
      idempotencyKey,
    );
    return Response.json(saved, {
      status: saved.httpStatus,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  return Response.json(
    { status: 'unprocessable', errorCode: 'unsupported_entity_type' },
    { status: 422, headers: { 'Cache-Control': 'no-store' } },
  );
}
