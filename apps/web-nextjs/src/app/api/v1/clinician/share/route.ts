import { NextResponse } from 'next/server';
import {
  appendSafetyAuditLog,
  upsertE2eeSyncBlobs,
} from '../../../../../lib/supabase-edge.ts';
import type { ServerStoredClinicianShareSnapshot } from '../../../../../clinical/index.ts';

// Serverless in-memory store for Zero-Knowledge Clinician Share snapshots
const clinicianShareStore = new Map<string, ServerStoredClinicianShareSnapshot>();

/**
 * POST /api/v1/clinician/share
 * Creates or revokes a Zero-Knowledge E2EE Clinician Share Snapshot.
 * Strictly enforces that the server NEVER receives the `#key=...` decryption key.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as {
    action?: 'create' | 'revoke';
    snapshot?: ServerStoredClinicianShareSnapshot;
    shareToken?: string;
    userId?: string;
  };

  const action = body.action ?? 'create';
  const userId = body.userId || 'patient-01';

  if (action === 'revoke') {
    const token = body.shareToken || body.snapshot?.shareToken || '';
    const existing = clinicianShareStore.get(token);
    if (!existing) {
      return NextResponse.json(
        { status: 'not_found', message: 'Share token not found.' },
        { status: 404 }
      );
    }

    const revokedSnapshot: ServerStoredClinicianShareSnapshot = {
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

    return NextResponse.json({
      status: 'revoked',
      shareToken: token,
      revokedAt: revokedSnapshot.revokedAt,
      auditHash: audit.entryHash,
    });
  }

  const snapshot = body.snapshot;
  if (!snapshot?.shareToken || !snapshot.ciphertextB64 || !snapshot.ivB64) {
    return NextResponse.json(
      {
        status: 'invalid_payload',
        message: 'Missing required E2EE clinician share snapshot fields (shareToken, ciphertextB64, ivB64).',
      },
      { status: 400 }
    );
  }

  // Zero-Knowledge Guard: reject if client accidentally sent #key= in payload
  if (JSON.stringify(body).includes('#key=')) {
    return NextResponse.json(
      {
        status: 'zero_knowledge_violation_blocked',
        message: 'Decryption key (#key=...) must stay in the client URL hash fragment and never be sent to the server.',
      },
      { status: 400 }
    );
  }

  clinicianShareStore.set(snapshot.shareToken, {
    ...snapshot,
    revoked: Boolean(snapshot.revoked),
  });

  // Also persist as an E2EE blob record in Supabase / Edge store
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

  return NextResponse.json({
    status: 'created',
    shareToken: snapshot.shareToken,
    expiresAt: snapshot.expiresAt,
    storageBackend: syncResult.storageBackend,
    zeroKnowledgeServerOnlyCiphertext: true,
    auditHash: audit.entryHash,
  });
}

/**
 * GET /api/v1/clinician/share?token=share_...
 * Fetches the encrypted clinician share snapshot if it exists, is not revoked, and has not expired.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || '';
  if (!token) {
    return NextResponse.json(
      { status: 'missing_token', message: 'Query parameter ?token=... is required.' },
      { status: 400 }
    );
  }

  const snapshot = clinicianShareStore.get(token);
  if (!snapshot) {
    return NextResponse.json(
      { status: 'not_found', message: 'Clinician share snapshot not found.' },
      { status: 404 }
    );
  }

  if (snapshot.revoked) {
    return NextResponse.json(
      {
        status: 'revoked',
        shareToken: token,
        revokedAt: snapshot.revokedAt,
        message: 'This share link has been revoked by the patient.',
      },
      { status: 410 }
    );
  }

  if (Date.now() > new Date(snapshot.expiresAt).getTime()) {
    return NextResponse.json(
      {
        status: 'expired',
        shareToken: token,
        expiresAt: snapshot.expiresAt,
        message: 'This time-limited clinician share link has expired.',
      },
      { status: 410 }
    );
  }

  return NextResponse.json({
    status: 'active',
    zeroKnowledgeEncrypted: true,
    snapshot,
  });
}
