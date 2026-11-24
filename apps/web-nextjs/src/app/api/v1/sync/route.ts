import {
  pullE2eeSyncBlobs,
  upsertE2eeSyncBlobs,
  verifySafetyAuditChain,
  type E2eeSyncBlobRecord,
} from '../../../../lib/supabase-edge.ts';
import { verifyServerSessionToken } from '../../../../clinical/auth-account.ts';

/**
 * Hardened in V2 (T02 & T03 — `AUTH-03`, `AUTH-07`):
 * - Requires a valid authenticated server session token (`Authorization: Bearer <token>`).
 * - Rejects Guest and Demo tokens with 401/403 (`AUTH-03`).
 * - Prevents cross-user read/write by enforcing `verified.userId === targetUserId` (`AUTH-07`).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const authHeader = request.headers.get('authorization') || undefined;
  const verified = verifyServerSessionToken(authHeader);

  if (!verified.valid || !verified.userId) {
    return Response.json(
      {
        status: 'unauthorized',
        errorCode: verified.errorCode,
        message: 'Authentication required. Guest and demo sessions cannot call private sync APIs.',
      },
      {
        status: verified.errorCode === 'guest_or_demo_not_authenticated' ? 403 : 401,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }

  const requestedUserId = searchParams.get('user_id');
  if (requestedUserId && requestedUserId !== verified.userId) {
    return Response.json(
      {
        status: 'forbidden',
        errorCode: 'cross_user_access_denied',
        message: 'AUTH-07 Forbidden: Cannot read sync blobs belonging to another user.',
      },
      { status: 403, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const since = searchParams.get('since') || undefined;
  const result = await pullE2eeSyncBlobs(verified.userId, since, authHeader);
  const auditStatus = verifySafetyAuditChain();

  return Response.json(
    {
      status: 'ok',
      userId: verified.userId,
      storageBackend: result.storageBackend,
      blobs: result.blobs,
      auditChainIntegrity: auditStatus,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization') || undefined;
  const verified = verifyServerSessionToken(authHeader);

  if (!verified.valid || !verified.userId) {
    return Response.json(
      {
        status: 'unauthorized',
        errorCode: verified.errorCode,
        message: 'Authentication required. Guest and demo sessions cannot push to private sync APIs.',
      },
      {
        status: verified.errorCode === 'guest_or_demo_not_authenticated' ? 403 : 401,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }

  const body = (await request.json()) as {
    blobs?: E2eeSyncBlobRecord[];
  };
  const blobs = body.blobs || [];

  // AUTH-07: Reject if any blob attempts to write to another user's userId
  const hasCrossUserBlob = blobs.some((b) => b.userId && b.userId !== verified.userId);
  if (hasCrossUserBlob) {
    return Response.json(
      {
        status: 'forbidden',
        errorCode: 'cross_user_write_denied',
        message: 'AUTH-07 Forbidden: Cannot write sync blobs for another user_id.',
      },
      { status: 403, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const normalizedBlobs = blobs.map((b) => ({
    ...b,
    userId: verified.userId!,
  }));

  const result = await upsertE2eeSyncBlobs(normalizedBlobs, authHeader);

  return Response.json(
    {
      status: 'ok',
      syncedCount: result.syncedCount,
      storageBackend: result.storageBackend,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
