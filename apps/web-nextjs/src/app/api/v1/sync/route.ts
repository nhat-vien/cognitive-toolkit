import { NextResponse } from 'next/server';
import {
  pullE2eeSyncBlobs,
  upsertE2eeSyncBlobs,
  verifySafetyAuditChain,
  type E2eeSyncBlobRecord,
} from '../../../../lib/supabase-edge.ts';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id') || 'anon-patient';
  const since = searchParams.get('since') || undefined;
  const authHeader = request.headers.get('authorization') || undefined;

  const result = await pullE2eeSyncBlobs(userId, since, authHeader);
  const auditStatus = verifySafetyAuditChain();

  return NextResponse.json({
    status: 'ok',
    userId,
    storageBackend: result.storageBackend,
    blobs: result.blobs,
    auditChainIntegrity: auditStatus,
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    blobs?: E2eeSyncBlobRecord[];
  };
  const authHeader = request.headers.get('authorization') || undefined;
  const blobs = body.blobs || [];

  const result = await upsertE2eeSyncBlobs(blobs, authHeader);

  return NextResponse.json({
    status: 'ok',
    syncedCount: result.syncedCount,
    storageBackend: result.storageBackend,
  });
}
