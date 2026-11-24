import { verifyServerSessionToken } from '../../../../../clinical/auth-account.ts';
import { globalV2ClinicalRepository } from '../../../../../clinical/v2-data-sync-and-grants.ts';

/**
 * V2 User Right-to-Erasure Privacy Delete API (`/api/v2/privacy/delete`) — `DATA-05`, `AUTH-07`
 * Purges all user-owned clinical records, revokes all active sharing grants, clears offline queues,
 * and preserves non-PHI audit trail metadata per retention policy.
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

  const body = (await request.json().catch(() => ({}))) as {
    userId?: string;
    confirmDelete?: boolean;
  };

  if (body.userId && body.userId !== verified.userId) {
    return Response.json(
      { status: 'forbidden', errorCode: 'cross_user_delete_denied' },
      { status: 403, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  if (body.confirmDelete !== true) {
    return Response.json(
      {
        status: 'unprocessable',
        errorCode: 'explicit_delete_confirmation_required',
        messageVi: 'Vui lòng xác nhận rõ ràng (confirmDelete: true) trước khi xóa toàn bộ dữ liệu.',
      },
      { status: 422, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const result = globalV2ClinicalRepository.deleteUserData(verified.userId);
  return Response.json(
    {
      status: 'deleted',
      result,
    },
    { status: 200, headers: { 'Cache-Control': 'no-store' } },
  );
}
