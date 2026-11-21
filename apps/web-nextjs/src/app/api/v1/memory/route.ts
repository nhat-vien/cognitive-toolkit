import { NextResponse } from 'next/server';
import {
  BUILTIN_CLINICAL_KB_CHUNKS,
  getSupabaseConfig,
} from '../../../../lib/supabase-edge.ts';
import {
  createInitialClinicalMemoryState,
  eraseDerivedProfileMemory,
  updateTwoTierClinicalMemory,
  type ClinicalConversationMemoryState,
} from '../../../../clinical/index.ts';

// Serverless in-memory store keyed by userId for inspecting & erasing 2-Tier Clinical Memory
const serverlessMemoryStore = new Map<string, ClinicalConversationMemoryState>();

function getOrCreateUserMemory(userId: string): ClinicalConversationMemoryState {
  const existing = serverlessMemoryStore.get(userId);
  if (existing) return existing;
  const initial = createInitialClinicalMemoryState(userId);
  serverlessMemoryStore.set(userId, initial);
  return initial;
}

/**
 * GET /api/v1/memory?userId=patient-01
 * Inspects the user's 2-Tier Rolling Memory (20-message sliding window, 15-message rolling summary,
 * structured personal profile) and Grounded Clinical RAG status (0.46 threshold).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId') || 'patient-01';
  const memory = getOrCreateUserMemory(userId);
  const cfg = getSupabaseConfig();

  return NextResponse.json({
    status: 'ok',
    userId,
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
  });
}

/**
 * POST /api/v1/memory
 * Appends a message turn to the user's 2-Tier Rolling Memory and returns updated state.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as {
    userId?: string;
    role?: 'user' | 'assistant';
    content?: string;
    mode?: 'expressive' | 'instrumental';
    citations?: string[];
  };
  const userId = body.userId || 'patient-01';
  const current = getOrCreateUserMemory(userId);
  const updated = updateTwoTierClinicalMemory(current, {
    role: body.role || 'user',
    content: body.content || '',
    mode: body.mode || 'instrumental',
    citations: body.citations || [],
  });
  serverlessMemoryStore.set(userId, updated);

  return NextResponse.json({
    status: 'updated',
    userId,
    memory: updated,
  });
}

/**
 * DELETE /api/v1/memory?userId=patient-01
 * Immediately erases the user's derived Personal Profile, Rolling Summary, and message window.
 */
export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId') || 'patient-01';
  const current = getOrCreateUserMemory(userId);
  const cleared = eraseDerivedProfileMemory(current, true);
  serverlessMemoryStore.set(userId, cleared);

  return NextResponse.json({
    status: 'erased',
    userId,
    erasedAt: new Date().toISOString(),
    memory: cleared,
  });
}
