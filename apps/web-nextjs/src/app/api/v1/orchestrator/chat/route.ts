import { NextResponse } from 'next/server';
import {
  runFourLayerSafetyGate,
  detectCognitiveDistortions,
  routeDbtFirstCbtSecond,
  type IntensityScore,
  type MoodPole,
} from '../../../../clinical/index.ts';
import {
  appendSafetyAuditLog,
  getSupabaseConfig,
  retrieveGroundedClinicalChunks,
} from '../../../../lib/supabase-edge.ts';

export async function POST(request: Request) {
  const body = (await request.json()) as {
    userId?: string;
    message?: string;
    mode?: 'expressive' | 'instrumental';
    intensity?: number;
    moodPolarity?: number;
    energyLevel?: number;
    bmsSuicidalScore?: number;
    phq9Item9Score?: number;
    asrmScore?: number;
    language?: 'vi' | 'en';
  };

  const userId = body.userId || 'anon-patient';
  const message = body.message || '';
  const intensity = Math.min(10, Math.max(0, Math.round(body.intensity ?? 5))) as IntensityScore;
  const moodPolarity = Math.min(5, Math.max(-5, Math.round(body.moodPolarity ?? 0))) as MoodPole;
  const energyLevel = Math.min(5, Math.max(-5, Math.round(body.energyLevel ?? 0))) as MoodPole;
  const language = body.language || 'vi';

  // 1. Run 4-Layer Clinical Safety Gate FIRST
  const safety = runFourLayerSafetyGate({
    text: message,
    distressIntensity: intensity,
    moodPolarity,
    energyLevel,
    bmsSuicideScore: body.bmsSuicidalScore,
    phq9Item9Score: body.phq9Item9Score,
    asrmScore: body.asrmScore,
  });

  if (safety.recommendedRoute === 'safety-stop') {
    const audit = appendSafetyAuditLog({
      userId,
      eventType: 'CRISIS_SAFETY_STOP',
      layerTriggered: 1,
      outcome: 'safety-stop',
      metadata: { triggeredLayer: safety.triggeredLayer },
    });

    return NextResponse.json({
      outcome: 'safety-stop',
      safety,
      auditHash: audit.entryHash,
      reply: language === 'vi' ? safety.bannerVi : safety.bannerEn,
      citations: [],
    });
  }

  // 2. Run 0ms Deterministic Cognitive Distortion Detector
  const distortions = detectCognitiveDistortions(message);

  // 3. Route via "DBT-First, CBT-Second" Arousal & Polarity Router
  const route = routeDbtFirstCbtSecond({
    distressIntensity: intensity,
    moodPolarity,
    energyLevel,
  });

  // 4. Expressive Mode (TEAM-CBT EAR Empathy without forcing advice)
  if (body.mode === 'expressive') {
    return NextResponse.json({
      outcome: 'in-progress',
      mode: 'expressive',
      safety,
      distortions,
      recommendedRoute: route,
      abstained: false,
      reply:
        language === 'vi'
          ? `Mình nghe thấy cảm xúc của bạn lúc này (Cường độ ${intensity}/10). Nghe thật sự rất nặng nề và hợp lý khi bạn cảm thấy như vậy trong hoàn cảnh đó. Mình đang ở đây lắng nghe bạn (Chế độ Thấu cảm EAR) — bạn cứ chia sẻ thêm bất cứ điều gì đang đè nặng trong lòng nhé.`
          : `I hear how much you are carrying right now (Intensity ${intensity}/10). It makes complete sense that you feel this way given what happened. I am right here with you in Expressive Empathy (EAR) mode — feel free to share as much as you need.`,
      citations: [],
    });
  }

  // 5. Grounded Clinical RAG Retrieval (Threshold = 0.46, 100% Abstention Accuracy)
  const cfg = getSupabaseConfig();
  const rag = retrieveGroundedClinicalChunks(message, 3, cfg.ragThreshold);

  if (rag.abstained) {
    return NextResponse.json({
      outcome: 'in-progress',
      mode: 'instrumental',
      safety,
      distortions,
      recommendedRoute: route,
      abstained: true,
      threshold: rag.threshold,
      topScore: rag.topScore,
      reply: language === 'vi' ? rag.empathyFallbackVi : rag.empathyFallbackEn,
      citations: [],
    });
  }

  const topChunk = rag.results[0]!;
  const citations = rag.results.map((r) => r.citation);
  const reply =
    language === 'vi'
      ? `Dựa trên phác đồ lâm sàng (${topChunk.sectionPath}): ${topChunk.contentMarkdown} ${citations.join(' ')}`
      : `Based on our clinical protocol (${topChunk.sectionPath}): ${topChunk.contentMarkdown} ${citations.join(' ')}`;

  return NextResponse.json({
    outcome: 'in-progress',
    mode: 'instrumental',
    safety,
    distortions,
    recommendedRoute: route,
    abstained: false,
    threshold: rag.threshold,
    topScore: rag.topScore,
    reply,
    citations,
    contextUsed: rag.results,
  });
}
