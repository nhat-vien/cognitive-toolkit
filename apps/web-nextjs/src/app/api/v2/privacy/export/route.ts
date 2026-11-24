import { verifyServerSessionToken } from '../../../../../clinical/auth-account.ts';
import { globalV2ClinicalRepository } from '../../../../../clinical/v2-data-sync-and-grants.ts';

/**
 * V2 User Privacy Export API (`/api/v2/privacy/export`) — `DATA-04`, `AUTH-07`
 * Exports all user-owned clinical records with explicit self-report provenance and non-diagnostic notice.
 */
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

  const body = (await request.json().catch(() => ({}))) as { userId?: string };
  if (body.userId && body.userId !== verified.userId) {
    return Response.json(
      { status: 'forbidden', errorCode: 'cross_user_export_denied' },
      { status: 403, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const bundle = globalV2ClinicalRepository.exportUserData(verified.userId);
  return Response.json(
    {
      status: 'ok',
      bundle,
    },
    { status: 200, headers: { 'Cache-Control': 'no-store' } },
  );
}
