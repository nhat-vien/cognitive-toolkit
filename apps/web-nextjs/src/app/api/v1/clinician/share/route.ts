import {
  appendSafetyAuditLog,
  upsertE2eeSyncBlobs,
} from '../../../../../lib/supabase-edge.ts';
import {
  verifyServerSessionToken,
  type ServerStoredClinicianShareSnapshot,
} from '../../../../../clinical/index.ts';

// Serverless in-memory store for Zero-Knowledge Clinician Share snapshots (with ownerId tracking for AUTH-07)
const clinicianShareStore = new Map<
  string,
  ServerStoredClinicianShareSnapshot & { ownerUserId: string }
>();

/**
 * POST /api/v1/clinician/share
 * Creates or revokes a Zero-Knowledge E2EE Clinician Share Snapshot.
 * Hardened in V2 (T02 & T03 — `AUTH-03`, `AUTH-07`, `SAFE-06`):
 * - Requires a valid authenticated session token.
 * - Only the snapshot owner (`verified.userId === existing.ownerUserId`) can revoke or overwrite it.
 * - Strictly enforces that the server NEVER receives the `#key=...` decryption key.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const verified = verifyServerSessionToken(authHeader);

  if (!verified.valid || !verified.userId) {
    return Response.json(
      {
        status: 'unauthorized',
        errorCode: verified.errorCode,
        message: 'Authentication required to create or revoke a clinician share link.',
      },
      {
        status: verified.errorCode === 'guest_or_demo_not_authenticated' ? 403 : 401,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }

  const body = (await request.json()) as {
    action?: 'create' | 'revoke';
    snapshot?: ServerStoredClinicianShareSnapshot;
    shareToken?: string;
    userId?: string;
  };

  if (body.userId && body.userId !== verified.userId) {
    return Response.json(
      {
        status: 'forbidden',
        errorCode: 'cross_user_share_denied',
        message: 'AUTH-07 Forbidden: Cannot create or revoke share links for another user_id.',
      },
      { status: 403, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const action = body.action ?? 'create';
  const userId = verified.userId;

  if (action === 'revoke') {
    const token = body.shareToken || body.snapshot?.shareToken || '';
    const existing = clinicianShareStore.get(token);
    if (!existing) {
      return Response.json(
        { status: 'not_found', message: 'Share token not found.' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    if (existing.ownerUserId !== userId) {
      return Response.json(
        {
          status: 'forbidden',
          errorCode: 'cross_user_revoke_denied',
          message: 'AUTH-07 Forbidden: Only the patient owner can revoke this share link.',
        },
        { status: 403, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const revokedSnapshot = {
      ...existing,
      revoked: true,
      revokedAt: new Date().toISOString(),
    };
    clinicianShareStore.set(token, revokedSnapshot);

    const audit = appendSafetyAuditLog({
      userId,
      eventType: 'CLINICIAN_SHARE_REVOKED',
      layerTriggered: 4,
      outcome: 'revoked',
      metadata: { shareToken: token, revokedAt: revokedSnapshot.revokedAt },
    });

    return Response.json(
      {
        status: 'revoked',
        shareToken: token,
        revokedAt: revokedSnapshot.revokedAt,
        auditHash: audit.entryHash,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const snapshot = body.snapshot;
  if (!snapshot?.shareToken || !snapshot.ciphertextB64 || !snapshot.ivB64) {
    return Response.json(
      {
        status: 'invalid_payload',
        message: 'Missing required E2EE clinician share snapshot fields (shareToken, ciphertextB64, ivB64).',
      },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // Zero-Knowledge Guard: reject if client accidentally sent #key= in payload
  if (JSON.stringify(body).includes('#key=')) {
    return Response.json(
      {
        status: 'zero_knowledge_violation_blocked',
        message: 'Decryption key (#key=...) must stay in the client URL hash fragment and never be sent to the server.',
      },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const existing = clinicianShareStore.get(snapshot.shareToken);
  if (existing && existing.ownerUserId !== userId) {
    return Response.json(
      {
        status: 'forbidden',
        errorCode: 'cross_user_overwrite_denied',
        message: 'AUTH-07 Forbidden: Cannot overwrite another user’s share token.',
      },
      { status: 403, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  clinicianShareStore.set(snapshot.shareToken, {
    ...snapshot,
    ownerUserId: userId,
    revoked: Boolean(snapshot.revoked),
  });

  const syncResult = await upsertE2eeSyncBlobs([
    {
      blobId: snapshot.shareToken,
      userId,
      recordType: 'clinician_share_snapshot',
      ciphertextB64: snapshot.ciphertextB64,
      ivB64: snapshot.ivB64,
      authTagB64: 'INCLUDED_IN_AES_GCM_CIPHERTEXT',
      keyId: 'ephemeral-url-fragment-key',
      clientUpdatedAt: snapshot.createdAt,
      deleted: snapshot.revoked,
    },
  ]);

  const audit = appendSafetyAuditLog({
    userId,
    eventType: 'CLINICIAN_SHARE_CREATED',
    layerTriggered: 4,
    outcome: 'created',
    metadata: {
      shareToken: snapshot.shareToken,
      periodDays: snapshot.periodDays,
      ttlPreset: snapshot.ttlPreset,
      expiresAt: snapshot.expiresAt,
    },
  });

  return Response.json(
    {
      status: 'created',
      shareToken: snapshot.shareToken,
      expiresAt: snapshot.expiresAt,
      storageBackend: syncResult.storageBackend,
      zeroKnowledgeServerOnlyCiphertext: true,
      auditHash: audit.entryHash,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

/**
 * GET /api/v1/clinician/share?token=share_...
 * Fetches the encrypted clinician share snapshot if it exists, is not revoked, and has not expired.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || '';
  if (!token) {
    return Response.json(
      { status: 'missing_token', message: 'Query parameter ?token=... is required.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const snapshot = clinicianShareStore.get(token);
  if (!snapshot) {
    return Response.json(
      { status: 'not_found', message: 'Clinician share snapshot not found.' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  if (snapshot.revoked) {
    return Response.json(
      {
        status: 'revoked',
        shareToken: token,
        revokedAt: snapshot.revokedAt,
        message: 'This share link has been revoked by the patient.',
      },
      { status: 410, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  if (Date.now() > new Date(snapshot.expiresAt).getTime()) {
    return Response.json(
      {
        status: 'expired',
        shareToken: token,
        expiresAt: snapshot.expiresAt,
        message: 'This time-limited clinician share link has expired.',
      },
      { status: 410, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  return Response.json(
    {
      status: 'active',
      zeroKnowledgeEncrypted: true,
      snapshot,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
