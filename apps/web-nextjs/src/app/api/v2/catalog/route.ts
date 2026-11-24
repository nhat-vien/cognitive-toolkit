import {
  queryUnifiedPracticeLibrary,
  type UnifiedNeedCategory,
  type UnifiedDeliveryMode,
  type UnifiedPracticeKind,
} from '../../../../clinical/unified-practice-library.ts';
import type { TherapyModel } from '../../../../clinical/master-plan-governance.ts';

/**
 * V2 Public Practice Catalog API (`/api/v2/catalog`) — `UNIFIED_PRACTICE_LIBRARY.md` & `DATA_ARCHITECTURE.md`
 * - By default returns ONLY `approved + published + self_guided` items (`CAT-03`).
 * - Supports filters by `need`, `model`, `maxDuration`, `delivery`, `kind`, and `q` (`CAT-05`).
 * - Never infers a clinical diagnosis from filter parameters (`inferredDiagnosis: null`).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const need = (searchParams.get('need') || undefined) as UnifiedNeedCategory | undefined;
  const therapyModel = (searchParams.get('model') || undefined) as TherapyModel | undefined;
  const maxDurationRaw = searchParams.get('maxDuration');
  const maxDurationMinutes = maxDurationRaw ? Number(maxDurationRaw) : undefined;
  const delivery = (searchParams.get('delivery') || undefined) as UnifiedDeliveryMode | undefined;
  const kind = (searchParams.get('kind') || undefined) as UnifiedPracticeKind | undefined;
  const searchQuery = searchParams.get('q') || undefined;

  const result = queryUnifiedPracticeLibrary({
    need,
    therapyModel,
    maxDurationMinutes,
    delivery,
    kind,
    searchQuery,
    includeDraftReferencePreview: false,
    includeClinicianAssistedPreview: false,
  });

  return Response.json(
    {
      status: 'ok',
      totalEligibleSelfGuidedCount: result.totalEligibleSelfGuidedCount,
      inferredDiagnosis: result.inferredDiagnosis,
      items: result.items,
    },
    { status: 200, headers: { 'Cache-Control': 'no-store' } },
  );
}
