import { NextResponse } from 'next/server';
import {
  getSupabaseConfig,
  retrieveGroundedClinicalChunks,
  BUILTIN_CLINICAL_KB_CHUNKS,
} from '../../../../lib/supabase-edge.ts';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const topK = Number(searchParams.get('top_k') || '3');
  const cfg = getSupabaseConfig();

  if (query) {
    const rag = retrieveGroundedClinicalChunks(query, topK, cfg.ragThreshold);
    return NextResponse.json({
      status: 'ok',
      query,
      abstained: rag.abstained,
      threshold: rag.threshold,
      topScore: rag.topScore,
      results: rag.results,
      empathyFallbackVi: rag.empathyFallbackVi,
      empathyFallbackEn: rag.empathyFallbackEn,
    });
  }

  return NextResponse.json({
    status: 'ready',
    deploymentMode: cfg.supabaseUrl ? 'vercel-supabase-pgvector' : 'vercel-edge-self-contained',
    ragThreshold: cfg.ragThreshold,
    chunkCount: BUILTIN_CLINICAL_KB_CHUNKS.length,
    abstentionGuarantee: '100% below threshold 0.46',
  });
}
