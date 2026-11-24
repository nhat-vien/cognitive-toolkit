import { verifyServerSessionToken } from '../../../../clinical/auth-account.ts';
import {
  globalV2ClinicalRepository,
} from '../../../../clinical/v2-data-sync-and-grants.ts';

/**
 * V2 Plan Items CRUD API (`/api/v2/plan-items`) — `DATA-01`, `DATA-02`, `AUTH-07`
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

  return Response.json(
    {
      status: 'ok',
      userId: verified.userId,
      planItems: globalV2ClinicalRepository.getPlanItems(verified.userId),
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
    id?: string;
    userId?: string;
    idempotencyKey?: string;
    practiceId?: string;
    schedule?: string;
    status?: 'planned' | 'completed' | 'skipped' | 'paused';
    expectedRevision?: number;
  };

  if (body.userId && body.userId !== verified.userId) {
    return Response.json(
      { status: 'forbidden', errorCode: 'cross_user_write_denied' },
      { status: 403, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  if (!body.idempotencyKey || !body.practiceId) {
    return Response.json(
      { status: 'unprocessable', errorCode: 'missing_required_fields' },
      { status: 422, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const res = globalV2ClinicalRepository.upsertPlanItem({
    id: body.id || `plan_${Date.now()}`,
    userId: verified.userId,
    idempotencyKey: body.idempotencyKey,
    practiceId: body.practiceId,
    schedule: body.schedule || 'daily',
    status: body.status || 'planned',
    expectedRevision: body.expectedRevision,
  });

  return Response.json(res, {
    status: res.httpStatus,
    headers: { 'Cache-Control': 'no-store' },
  });
}
