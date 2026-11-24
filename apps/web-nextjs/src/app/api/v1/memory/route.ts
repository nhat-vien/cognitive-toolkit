import {
  BUILTIN_CLINICAL_KB_CHUNKS,
  getSupabaseConfig,
} from '../../../../lib/supabase-edge.ts';
import {
  createInitialClinicalMemoryState,
  eraseDerivedProfileMemory,
  updateTwoTierClinicalMemory,
  verifyServerSessionToken,
  type ClinicalConversationMemoryState,
} from '../../../../clinical/index.ts';

// Serverless in-memory store keyed by verified userId for 2-Tier Clinical Memory
const serverlessMemoryStore = new Map<string, ClinicalConversationMemoryState>();

function getOrCreateUserMemory(userId: string): ClinicalConversationMemoryState {
  const existing = serverlessMemoryStore.get(userId);
  if (existing) return existing;
  const initial = createInitialClinicalMemoryState(userId);
  serverlessMemoryStore.set(userId, initial);
  return initial;
}

/**
 * Hardened in V2 (T02 & T03 — `AUTH-03`, `AUTH-07`, `AUTH-08`):
 * - Requires a valid authenticated session token.
 * - Denies cross-user read/write/delete even if the caller has `admin` role (`AUTH-08`: admin cannot read private diary/memory).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const authHeader = request.headers.get('authorization');
  const verified = verifyServerSessionToken(authHeader);

  if (!verified.valid || !verified.userId) {
    return Response.json(
      {
        status: 'unauthorized',
        errorCode: verified.errorCode,
        message: 'Authentication required to access private conversation memory.',
      },
      {
        status: verified.errorCode === 'guest_or_demo_not_authenticated' ? 403 : 401,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }

  const requestedUserId = url.searchParams.get('userId');
  if (requestedUserId && requestedUserId !== verified.userId) {
    return Response.json(
      {
        status: 'forbidden',
        errorCode: 'cross_user_access_denied',
        message: 'AUTH-07 / AUTH-08 Forbidden: Cannot read another user’s private clinical memory.',
      },
      { status: 403, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const memory = getOrCreateUserMemory(verified.userId);
  const cfg = getSupabaseConfig();

  return Response.json(
    {
      status: 'ok',
      userId: verified.userId,
      ragStatus: {
        strictThreshold: cfg.ragThreshold,
        abstentionAccuracyTargetPercent: 100,
        indexedProtocolChunksCount: BUILTIN_CLINICAL_KB_CHUNKS.length,
      },
      memoryPolicy: {
        slidingWindowMaxMessages: 20,
        rollingSummaryRefreshInterval: 15,
        userErasableAtAnyTime: true,
      },
      memory,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const verified = verifyServerSessionToken(authHeader);

  if (!verified.valid || !verified.userId) {
    return Response.json(
      {
        status: 'unauthorized',
        errorCode: verified.errorCode,
        message: 'Authentication required to update private conversation memory.',
      },
      {
        status: verified.errorCode === 'guest_or_demo_not_authenticated' ? 403 : 401,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }

  const body = (await request.json()) as {
    userId?: string;
    role?: 'user' | 'assistant';
    content?: string;
    mode?: 'expressive' | 'instrumental';
    citations?: string[];
  };

  if (body.userId && body.userId !== verified.userId) {
    return Response.json(
      {
        status: 'forbidden',
        errorCode: 'cross_user_write_denied',
        message: 'AUTH-07 Forbidden: Cannot modify another user’s clinical memory.',
      },
      { status: 403, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const current = getOrCreateUserMemory(verified.userId);
  const updated = updateTwoTierClinicalMemory(current, {
    role: body.role || 'user',
    content: body.content || '',
    mode: body.mode || 'instrumental',
    citations: body.citations || [],
  });
  serverlessMemoryStore.set(verified.userId, updated);

  return Response.json(
    {
      status: 'updated',
      userId: verified.userId,
      memory: updated,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const authHeader = request.headers.get('authorization');
  const verified = verifyServerSessionToken(authHeader);

  if (!verified.valid || !verified.userId) {
    return Response.json(
      {
        status: 'unauthorized',
        errorCode: verified.errorCode,
        message: 'Authentication required to delete private conversation memory.',
      },
      {
        status: verified.errorCode === 'guest_or_demo_not_authenticated' ? 403 : 401,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }

  const requestedUserId = url.searchParams.get('userId');
  if (requestedUserId && requestedUserId !== verified.userId) {
    return Response.json(
      {
        status: 'forbidden',
        errorCode: 'cross_user_delete_denied',
        message: 'AUTH-07 Forbidden: Cannot delete another user’s clinical memory.',
      },
      { status: 403, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const current = getOrCreateUserMemory(verified.userId);
  const cleared = eraseDerivedProfileMemory(current, true);
  serverlessMemoryStore.set(verified.userId, cleared);

  return Response.json(
    {
      status: 'erased',
      userId: verified.userId,
      erasedAt: new Date().toISOString(),
      memory: cleared,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
