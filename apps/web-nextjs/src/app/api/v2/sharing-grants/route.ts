import { verifyServerSessionToken } from '../../../../clinical/auth-account.ts';
import {
  globalV2ClinicalRepository,
  type V2SharingScopeField,
} from '../../../../clinical/v2-data-sync-and-grants.ts';

/**
 * V2 Scoped Sharing Grants API (`/api/v2/sharing-grants`) — `SAFE-06`, `AUTH-07`, `AUTH-08`
 * - Patient owner creates or revokes a grant with explicit scopes and expiration.
 * - Caregiver/clinician grantee reads ONLY granted scopes, verified online on the server.
 * - Private journal notes are ALWAYS denied (`PRIVATE_JOURNAL_ALWAYS_DENIED`).
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
  const grantId = searchParams.get('grantId') || '';
  const scope = (searchParams.get('scope') || '') as V2SharingScopeField | 'private_journal_notes';

  const result = globalV2ClinicalRepository.readSharedPatientDataWithGrant({
    grantId,
    granteeUserId: verified.userId,
    requestedScope: scope,
    serverOnlineVerified: true,
  });

  return Response.json(result, {
    status: result.httpStatus,
    headers: { 'Cache-Control': 'no-store' },
  });
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
    grantId?: string;
    ownerUserId?: string;
    granteeUserId?: string;
    granteeRole?: 'caregiver' | 'clinician';
    allowedScopes?: V2SharingScopeField[];
    expiresAt?: string;
  };

  if (body.ownerUserId && body.ownerUserId !== verified.userId) {
    return Response.json(
      { status: 'forbidden', errorCode: 'cross_user_grant_creation_denied' },
      { status: 403, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const created = globalV2ClinicalRepository.createSharingGrant({
    grantId: body.grantId || `grant_${Date.now()}`,
    ownerUserId: verified.userId,
    granteeUserId: body.granteeUserId || '',
    granteeRole: body.granteeRole || 'caregiver',
    allowedScopes: body.allowedScopes || [],
    expiresAt: body.expiresAt || new Date(Date.now() + 7 * 86400000).toISOString(),
  });

  if (!created.valid) {
    return Response.json(
      { status: 'unprocessable', errors: created.errors },
      { status: 422, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  return Response.json(
    { status: 'created', grant: created.data },
    { status: 201, headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function DELETE(request: Request) {
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
  const grantId = searchParams.get('grantId') || '';

  const revoked = globalV2ClinicalRepository.revokeSharingGrant({
    grantId,
    actorUserId: verified.userId,
  });

  if (!revoked.valid) {
    const isForbidden = revoked.errors.some((e) => e.includes('403'));
    return Response.json(
      { status: isForbidden ? 'forbidden' : 'not_found', errors: revoked.errors },
      { status: isForbidden ? 403 : 404, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  return Response.json(
    { status: 'revoked', grant: revoked.data },
    { status: 200, headers: { 'Cache-Control': 'no-store' } },
  );
}
