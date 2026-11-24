import {
  UNIFIED_PRACTICE_LIBRARY_CATALOG,
  resolveCanonicalPracticeId,
  evaluateUnifiedItemSelfGuidedEligibility,
} from '../../../../../clinical/unified-practice-library.ts';

/**
 * V2 Practice Catalog Detail API (`GET /api/v2/catalog/:id`) — `DATA_ARCHITECTURE.md` & `UNIFIED_PRACTICE_LIBRARY.md`
 * - Resolves canonical V2 ID or legacy Web/Flutter ID (`CAT-01`).
 * - Blocks `draft`, `unpublished`, `withdrawn`, or `clinician_assisted` items from public self-guided access (`CAT-03`, `SAFE-03`, `SAFE-04`).
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const resolvedParams = await context.params;
  const rawId = resolvedParams.id || '';
  const canonicalId = resolveCanonicalPracticeId(rawId);

  if (!canonicalId) {
    return Response.json(
      {
        status: 'not_found',
        errorCode: 'practice_item_not_found',
        messageVi: 'Không tìm thấy mục thực hành trong thư viện.',
      },
      { status: 404, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const item = UNIFIED_PRACTICE_LIBRARY_CATALOG.find((i) => i.id === canonicalId);
  const eligibility = evaluateUnifiedItemSelfGuidedEligibility(item);

  if (!item || !eligibility.canStartSelfGuided) {
    return Response.json(
      {
        status: 'forbidden',
        errorCode: eligibility.blockReasonCode ?? 'ITEM_NOT_ELIGIBLE',
        messageVi: eligibility.messageVi,
        canonicalId,
      },
      { status: 403, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  return Response.json(
    {
      status: 'ok',
      canonicalId: item.id,
      eligibility,
      item,
    },
    { status: 200, headers: { 'Cache-Control': 'no-store' } },
  );
}
