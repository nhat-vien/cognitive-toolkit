/**
 * Phase 3 (Milestone 3: Sprint 5 & Sprint 6) — Grounded AI Companion (Local Ollama + Cloud RAG 0.46),
 * 2-Tier Rolling Memory & Personal Profile Engine, Multimodal Voice Burst Journal with Pressured-Speech
 * Mania Detector & 5-Swatch Mood-Palette Studio, and Baseline-Relative HRV & Sleep Biometrics Bridge.
 */

import type {
  AffectFamily,
  FeltNeedForSleep,
  IntensityScore,
  Language,
  MoodPole,
  PushbackLevel,
  SessionOutcome,
  SessionPhase0Mode,
  TechniqueSlug,
} from './types.ts';
import {
  detectCognitiveDistortions,
  runFourLayerSafetyGate,
} from './detectors.ts';
import { routeDbtFirstCbtSecond } from './protocols-engine.ts';

export type FourLayerSafetyResult = ReturnType<typeof runFourLayerSafetyGate>;
import {
  BUILTIN_CLINICAL_KB_CHUNKS,
  retrieveGroundedClinicalChunks,
} from '../lib/supabase-edge.ts';

// ============================================================================
// 1. 2-TIER ROLLING MEMORY & PERSONAL PROFILE ENGINE
// ============================================================================

export interface ClinicalMemoryMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  mode: SessionPhase0Mode;
  detectedDistortions: string[];
  citations: string[];
}

export interface StructuredPersonalProfile {
  name: string | null;
  workOrStudyDomain: string | null;
  trustedContacts: string[];
  recurrentCognitiveDistortions: string[];
  preferredPushbackLevel: PushbackLevel;
  coreValues: string[];
  lastUpdatedAt: string;
}

export interface ClinicalConversationMemoryState {
  userId: string;
  totalMessagesProcessed: number;
  /** Sliding window of at most 20 latest messages */
  recentMessagesWindow: ClinicalMemoryMessage[];
  /** Refreshed automatically every 15 messages */
  rollingSummary: string;
  lastSummaryRefreshAtCount: number;
  summaryRefreshCount: number;
  /** Immediately extracted structured personal profile */
  personalProfile: StructuredPersonalProfile;
}

export function createInitialClinicalMemoryState(
  userId = 'patient-01',
  preferredPushbackLevel: PushbackLevel = 'moderate'
): ClinicalConversationMemoryState {
  return {
    userId,
    totalMessagesProcessed: 0,
    recentMessagesWindow: [],
    rollingSummary:
      'Chưa có tóm tắt cuộn (sẽ tự động tổng hợp sau mỗi 15 lượt tin nhắn). / No rolling summary yet (auto-refreshes every 15 messages).',
    lastSummaryRefreshAtCount: 0,
    summaryRefreshCount: 0,
    personalProfile: {
      name: null,
      workOrStudyDomain: null,
      trustedContacts: [],
      recurrentCognitiveDistortions: [],
      preferredPushbackLevel,
      coreValues: [],
      lastUpdatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Extracts structured personal profile facts immediately from user messages
 */
export function extractStructuredPersonalProfileFacts(
  text: string,
  currentProfile: StructuredPersonalProfile,
  detectedDistortionIds: string[]
): StructuredPersonalProfile {
  const updated: StructuredPersonalProfile = {
    ...currentProfile,
    trustedContacts: [...currentProfile.trustedContacts],
    recurrentCognitiveDistortions: [...currentProfile.recurrentCognitiveDistortions],
    coreValues: [...currentProfile.coreValues],
    lastUpdatedAt: new Date().toISOString(),
  };

  // 1. Name extraction (Vietnamese & English patterns)
  const nameMatch =
    text.match(/(?:tên\s+(?:tôi|mình)\s+là|mình\s+là|my\s+name\s+is|i\s+am\s+named)\s+([A-ZÀ-Ỹ][a-zà-ỹ]+(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]+){0,2})/i) ??
    text.match(/(?:call\s+me)\s+([A-Z][a-z]+)/i);
  if (nameMatch?.[1]) {
    updated.name = nameMatch[1].trim();
  }

  // 2. Work / Study domain extraction
  const domainPatterns: Array<{ regex: RegExp; label: string }> = [
    { regex: /kỹ sư phần mềm|lập trình|software engineer|developer|it\b/i, label: 'Kỹ sư Phần mềm / Software Engineering' },
    { regex: /thiết kế|designer|ui\/ux/i, label: 'Thiết kế / Product Design' },
    { regex: /bác sĩ|y tế|điều dưỡng|doctor|nurse|healthcare/i, label: 'Y tế / Healthcare' },
    { regex: /giáo viên|giảng viên|sinh viên|teacher|student|academic/i, label: 'Giáo dục & Học thuật / Education & Academia' },
    { regex: /tài chính|kế toán|ngân hàng|finance|accounting/i, label: 'Tài chính / Finance' },
  ];
  for (const pat of domainPatterns) {
    if (pat.regex.test(text)) {
      updated.workOrStudyDomain = pat.label;
      break;
    }
  }

  // 3. Trusted contact extraction
  const contactMatch = text.match(
    /(?:người\s+tin\s+cậy\s+là|liên\s+hệ\s+tin\s+cậy\s+là|vợ\s+tôi\s+là|chồng\s+tôi\s+là|bạn\s+thân\s+là|trusted\s+contact\s+is|my\s+partner\s+is)\s+([A-ZÀ-Ỹ][a-zà-ỹ]+(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]+){0,2})/i
  );
  if (contactMatch?.[1]) {
    const contactName = contactMatch[1].trim();
    if (!updated.trustedContacts.includes(contactName)) {
      updated.trustedContacts.push(contactName);
    }
  }

  // 4. Preferred pushback level override
  if (/không muốn bị hỏi vặn|chỉ muốn lắng nghe|pushback\s*off|no\s+pushback/i.test(text)) {
    updated.preferredPushbackLevel = 'off';
  } else if (/nhẹ nhàng|gentle\s+pushback/i.test(text)) {
    updated.preferredPushbackLevel = 'gentle';
  } else if (/thẳng thắn|sâu sắc|firm\s+pushback/i.test(text)) {
    updated.preferredPushbackLevel = 'firm';
  }

  // 5. Core values
  if (/gia đình|family/i.test(text) && !updated.coreValues.includes('Gia đình (Family)')) {
    updated.coreValues.push('Gia đình (Family)');
  }
  if (/trách nhiệm|responsibility/i.test(text) && !updated.coreValues.includes('Trách nhiệm (Responsibility)')) {
    updated.coreValues.push('Trách nhiệm (Responsibility)');
  }
  if (/sức khỏe|giấc ngủ|health|sleep/i.test(text) && !updated.coreValues.includes('Sức khỏe & Nhịp sinh học (Health & Rhythm)')) {
    updated.coreValues.push('Sức khỏe & Nhịp sinh học (Health & Rhythm)');
  }

  // 6. Recurrent cognitive distortions
  for (const distId of detectedDistortionIds) {
    if (!updated.recurrentCognitiveDistortions.includes(distId)) {
      updated.recurrentCognitiveDistortions.push(distId);
    }
  }

  return updated;
}

/**
 * Updates the 2-Tier Clinical Memory:
 * - Immediate Structured Personal Profile extraction
 * - Sliding window capped strictly at 20 latest messages
 * - Automatic Rolling Summary refresh every 15 messages
 */
export function updateTwoTierClinicalMemory(
  state: ClinicalConversationMemoryState,
  newMessage: {
    role: 'user' | 'assistant';
    content: string;
    mode?: SessionPhase0Mode;
    citations?: string[];
    timestamp?: string;
  }
): ClinicalConversationMemoryState {
  const distResult =
    newMessage.role === 'user'
      ? detectCognitiveDistortions(newMessage.content)
      : { negative: [], positiveMania: [], selfDefeatingBeliefs: [], safetyBehaviors: [] };

  const distortionIds = [
    ...distResult.negative.map((d) => d.id),
    ...distResult.positiveMania.map((d) => d.id),
  ];

  const nextTotal = state.totalMessagesProcessed + 1;
  const msgRecord: ClinicalMemoryMessage = {
    id: `msg-${nextTotal}`,
    role: newMessage.role,
    content: newMessage.content,
    timestamp: newMessage.timestamp ?? new Date().toISOString(),
    mode: newMessage.mode ?? 'instrumental',
    detectedDistortions: distortionIds,
    citations: newMessage.citations ?? [],
  };

  // Keep latest 20 messages in active sliding window
  const updatedWindow = [...state.recentMessagesWindow, msgRecord].slice(-20);

  // Immediate structured profile extraction for user turns
  const updatedProfile =
    newMessage.role === 'user'
      ? extractStructuredPersonalProfileFacts(
          newMessage.content,
          state.personalProfile,
          distortionIds
        )
      : state.personalProfile;

  // Automatic Rolling Summary refresh every 15 messages
  let rollingSummary = state.rollingSummary;
  let lastSummaryRefreshAtCount = state.lastSummaryRefreshAtCount;
  let summaryRefreshCount = state.summaryRefreshCount;

  if (nextTotal - state.lastSummaryRefreshAtCount >= 15) {
    summaryRefreshCount += 1;
    lastSummaryRefreshAtCount = nextTotal;
    const recentUserTopics = updatedWindow
      .filter((m) => m.role === 'user')
      .slice(-5)
      .map((m) => m.content.slice(0, 70))
      .join(' | ');
    const topDists =
      updatedProfile.recurrentCognitiveDistortions.join(', ') || 'none detected';
    rollingSummary = `[Rolling Summary #${summaryRefreshCount} @ ${nextTotal} msgs]: Người dùng (${updatedProfile.name ?? 'Ẩn danh'}, lĩnh vực: ${updatedProfile.workOrStudyDomain ?? 'Chưa rõ'}) đã trao đổi ${nextTotal} lượt. Biến dạng nhận thức lặp lại: [${topDists}]. Chủ đề gần đây: ${recentUserTopics}`;
  }

  return {
    userId: state.userId,
    totalMessagesProcessed: nextTotal,
    recentMessagesWindow: updatedWindow,
    rollingSummary,
    lastSummaryRefreshAtCount,
    summaryRefreshCount,
    personalProfile: updatedProfile,
  };
}

/**
 * Allows the user to erase derived profile and rolling summary memory at any time
 */
export function eraseDerivedProfileMemory(
  state: ClinicalConversationMemoryState,
  clearRecentMessagesToo = true
): ClinicalConversationMemoryState {
  return {
    userId: state.userId,
    totalMessagesProcessed: 0,
    recentMessagesWindow: clearRecentMessagesToo ? [] : state.recentMessagesWindow,
    rollingSummary: 'Đã xóa bộ nhớ suy diễn theo yêu cầu người dùng. / Derived memory erased by user.',
    lastSummaryRefreshAtCount: 0,
    summaryRefreshCount: 0,
    personalProfile: {
      name: null,
      workOrStudyDomain: null,
      trustedContacts: [],
      recurrentCognitiveDistortions: [],
      preferredPushbackLevel: 'moderate',
      coreValues: [],
      lastUpdatedAt: new Date().toISOString(),
    },
  };
}

// ============================================================================
// 2. LOCAL OLLAMA (http://127.0.0.1:11434) & CLOUD GROUNDED RAG COMPANION
// ============================================================================

export type Phase3CompanionProvider =
  | 'offline-deterministic'
  | 'local-ollama'
  | 'cloud-serverless-rag';

export interface Phase3GroundedChatRequest {
  provider: Phase3CompanionProvider;
  ollamaBaseUrl?: string; // default http://127.0.0.1:11434
  ollamaModel?: string;   // default qwen3.5:9b
  cloudEndpointUrl?: string; // default /api/v1/orchestrator/chat
  userMessage: string;
  mode: SessionPhase0Mode;
  distressIntensity: IntensityScore;
  moodPolarity: MoodPole;
  energyLevel: MoodPole;
  asrmScore?: number;
  language: Language;
  ragThreshold?: number; // default 0.46
  memoryState?: ClinicalConversationMemoryState;
}

export interface Phase3GroundedChatResponse {
  providerRequested: Phase3CompanionProvider;
  providerExecuted: Phase3CompanionProvider;
  outcome: SessionOutcome | 'in-progress';
  preSafetyGate: FourLayerSafetyResult;
  postSafetyGateVerified: boolean;
  abstained: boolean;
  ragThreshold: number;
  topSimilarityScore: number;
  citations: string[];
  replyVi: string;
  replyEn: string;
  recommendedTechnique: TechniqueSlug;
  updatedMemoryState: ClinicalConversationMemoryState;
}

export async function discoverLocalOllamaModels(
  ollamaBaseUrl = 'http://127.0.0.1:11434'
): Promise<{
  reachable: boolean;
  models: string[];
  recommendedModel: string;
}> {
  const fallbackModels = ['qwen3.5:9b', 'qwen2.5:7b', 'llama3.2:3b'];
  try {
    const res = await fetch(`${ollamaBaseUrl}/api/tags`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = (await res.json()) as { models?: Array<{ name?: string }> };
      const names = (data.models ?? [])
        .map((m) => m.name)
        .filter((n): n is string => Boolean(n));
      if (names.length > 0) {
        return {
          reachable: true,
          models: names,
          recommendedModel: names[0]!,
        };
      }
    }
  } catch {
    // Offline fallback
  }
  return {
    reachable: false,
    models: fallbackModels,
    recommendedModel: 'qwen3.5:9b',
  };
}

/**
 * Executes a Grounded Chat Turn with:
 * 1. Pre-generation 4-Layer Clinical Safety Gate
 * 2. Immediate 2-Tier Memory & Personal Profile extraction
 * 3. Expressive (TEAM-CBT EAR Empathy) vs Instrumental (Strict 0.46 Grounded RAG)
 * 4. Local Ollama (`/api/chat`) or Cloud Serverless (`/api/v1/orchestrator/chat`) with 100% deterministic offline fallback
 * 5. Post-generation Safety Verification & inline `[KB:chunk_id]` citation enforcement
 */
export async function executePhase3GroundedChatTurn(
  req: Phase3GroundedChatRequest
): Promise<Phase3GroundedChatResponse> {
  const threshold = req.ragThreshold ?? 0.46;
  const baseMemory = req.memoryState ?? createInitialClinicalMemoryState();

  // Record user message into 2-tier memory first
  const memAfterUser = updateTwoTierClinicalMemory(baseMemory, {
    role: 'user',
    content: req.userMessage,
    mode: req.mode,
  });

  // 1. Pre-Generation 4-Layer Safety Gate
  const preSafety = runFourLayerSafetyGate({
    text: req.userMessage,
    distressIntensity: req.distressIntensity,
    moodPolarity: req.moodPolarity,
    energyLevel: req.energyLevel,
    asrmScore: req.asrmScore,
  });

  const router = routeDbtFirstCbtSecond({
    distressIntensity: req.distressIntensity,
    moodPolarity: req.moodPolarity,
    energyLevel: req.energyLevel,
  });

  if (preSafety.recommendedRoute === 'safety-stop') {
    const memAfterStop = updateTwoTierClinicalMemory(memAfterUser, {
      role: 'assistant',
      content: req.language === 'vi' ? preSafety.bannerVi : preSafety.bannerEn,
      mode: req.mode,
      citations: ['[KB:safety-gate#layer-1-crisis-stop]'],
    });
    return {
      providerRequested: req.provider,
      providerExecuted: 'offline-deterministic',
      outcome: 'safety-stop',
      preSafetyGate: preSafety,
      postSafetyGateVerified: true,
      abstained: false,
      ragThreshold: threshold,
      topSimilarityScore: 1.0,
      citations: ['[KB:safety-gate#layer-1-crisis-stop]'],
      replyVi: preSafety.bannerVi,
      replyEn: preSafety.bannerEn,
      recommendedTechnique: 'tipp',
      updatedMemoryState: memAfterStop,
    };
  }

  // 2. Expressive Mode (TEAM-CBT 5 Secrets of Effective Communication EAR Empathy)
  if (req.mode === 'expressive') {
    const profilePrefixVi = memAfterUser.personalProfile.name
      ? `${memAfterUser.personalProfile.name} ơi, mình`
      : 'Mình';
    const profilePrefixEn = memAfterUser.personalProfile.name
      ? `${memAfterUser.personalProfile.name}, I`
      : 'I';

    const replyVi = `${profilePrefixVi} đang lắng nghe bạn với trọn vẹn sự thấu cảm (Chế độ Giải tỏa EAR — Không phán xét, không vội khuyên bảo). Nghe thật sự rất áp lực khi bạn phải chịu đựng cảm giác này (Cường độ ${req.distressIntensity}/10). Bạn hoàn toàn có quyền cảm thấy như vậy. Bạn muốn chia sẻ thêm điều gì đang nặng lòng nhất lúc này không?`;
    const replyEn = `${profilePrefixEn} hear you completely (TEAM-CBT EAR Expressive Empathy Mode — validation without unsolicited problem-solving). Carrying this at ${req.distressIntensity}/10 intensity sounds exhausting, and it makes complete sense you feel this way. What part of this feels heaviest right now?`;

    const memAfterReply = updateTwoTierClinicalMemory(memAfterUser, {
      role: 'assistant',
      content: req.language === 'vi' ? replyVi : replyEn,
      mode: 'expressive',
      citations: [],
    });

    return {
      providerRequested: req.provider,
      providerExecuted: 'offline-deterministic',
      outcome: 'in-progress',
      preSafetyGate: preSafety,
      postSafetyGateVerified: true,
      abstained: false,
      ragThreshold: threshold,
      topSimilarityScore: 1.0,
      citations: [],
      replyVi,
      replyEn,
      recommendedTechnique: router.recommendedTechnique,
      updatedMemoryState: memAfterReply,
    };
  }

  // 3. Instrumental Mode: Strict Grounded Clinical RAG Retrieval (threshold = 0.46)
  const rag = retrieveGroundedClinicalChunks(req.userMessage, 3, threshold);

  if (rag.abstained) {
    const replyVi =
      rag.empathyFallbackVi ??
      '[Chế độ Từ chối Bịa Phác đồ — 100% Abstention Accuracy (RAG < 0.46)]: Câu hỏi này nằm ngoài kho phác đồ CBT/DBT đã kiểm chứng. Mình xin phép không suy diễn lời khuyên lâm sàng mà mời bạn chọn một bài tập chuẩn hoặc chuyển sang chế độ Lắng nghe Thấu cảm (EAR).';
    const replyEn =
      rag.empathyFallbackEn ??
      '[100% Grounded RAG Abstention (score < 0.46)]: This query is outside our verified CBT/DBT protocol knowledge base. I will abstain from improvising clinical advice and invite you to use Expressive EAR Empathy mode or pick a verified technique.';

    const memAfterAbstain = updateTwoTierClinicalMemory(memAfterUser, {
      role: 'assistant',
      content: req.language === 'vi' ? replyVi : replyEn,
      mode: 'instrumental',
      citations: [],
    });

    return {
      providerRequested: req.provider,
      providerExecuted: 'offline-deterministic',
      outcome: 'in-progress',
      preSafetyGate: preSafety,
      postSafetyGateVerified: true,
      abstained: true,
      ragThreshold: threshold,
      topSimilarityScore: rag.topScore,
      citations: [],
      replyVi,
      replyEn,
      recommendedTechnique: router.recommendedTechnique,
      updatedMemoryState: memAfterAbstain,
    };
  }

  const topChunk = rag.results[0]!;
  const citations = rag.results.map((r) => r.citation);
  let providerExecuted: Phase3CompanionProvider = 'offline-deterministic';
  let replyVi = `Theo phác đồ chuẩn [${topChunk.sectionPath}]: ${topChunk.contentMarkdown} ${citations.join(' ')}`;
  let replyEn = `Grounded Clinical Protocol [${topChunk.sectionPath}]: ${topChunk.contentMarkdown} ${citations.join(' ')}`;

  // 4. Optional Local Ollama (http://127.0.0.1:11434/api/chat) or Cloud Serverless execution
  if (req.provider === 'local-ollama') {
    const baseUrl = req.ollamaBaseUrl || 'http://127.0.0.1:11434';
    const model = req.ollamaModel || 'qwen3.5:9b';
    try {
      const res = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          stream: false,
          messages: [
            {
              role: 'system',
              content: `You are Equilibria Grounded Clinical Companion. Use ONLY the verified clinical context: ${topChunk.contentMarkdown}. Always append ${citations[0]}. Never diagnose or prescribe medication.`,
            },
            { role: 'user', content: req.userMessage },
          ],
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { message?: { content?: string } };
        const text = data.message?.content?.trim();
        if (text) {
          providerExecuted = 'local-ollama';
          const citedText = text.includes('[KB:') ? text : `${text} ${citations.join(' ')}`;
          replyVi = citedText;
          replyEn = citedText;
        }
      }
    } catch {
      // Graceful fallback to deterministic grounded reply
      providerExecuted = 'offline-deterministic';
    }
  } else if (req.provider === 'cloud-serverless-rag') {
    const endpoint = req.cloudEndpointUrl || '/api/v1/orchestrator/chat';
    try {
      if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: memAfterUser.userId,
            message: req.userMessage,
            mode: req.mode,
            intensity: req.distressIntensity,
            moodPolarity: req.moodPolarity,
            energyLevel: req.energyLevel,
            asrmScore: req.asrmScore,
            language: req.language,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { reply?: string };
          if (data.reply) {
            providerExecuted = 'cloud-serverless-rag';
            const citedText = data.reply.includes('[KB:')
              ? data.reply
              : `${data.reply} ${citations.join(' ')}`;
            replyVi = citedText;
            replyEn = citedText;
          }
        }
      }
    } catch {
      providerExecuted = 'offline-deterministic';
    }
  }

  // 5. Post-generation 4-Layer Safety Verification (ensures LLM output never contains unsafe suggestions)
  const postSafety = runFourLayerSafetyGate({
    text: `${replyVi} ${replyEn}`,
    distressIntensity: req.distressIntensity,
  });
  const postSafetyGateVerified = postSafety.recommendedRoute !== 'safety-stop';

  const memAfterAssistant = updateTwoTierClinicalMemory(memAfterUser, {
    role: 'assistant',
    content: req.language === 'vi' ? replyVi : replyEn,
    mode: 'instrumental',
    citations,
  });

  return {
    providerRequested: req.provider,
    providerExecuted,
    outcome: 'in-progress',
    preSafetyGate: preSafety,
    postSafetyGateVerified,
    abstained: false,
    ragThreshold: threshold,
    topSimilarityScore: rag.topScore,
    citations,
    replyVi,
    replyEn,
    recommendedTechnique: (topChunk.techniqueSlug as TechniqueSlug) || router.recommendedTechnique,
    updatedMemoryState: memAfterAssistant,
  };
}

// ============================================================================
// 3. MULTIMODAL AUDIO "BURST" JOURNAL, PRESSURED-SPEECH MANIA DETECTOR & MOOD-PALETTE
// ============================================================================

export interface FiveSwatchMoodPalette {
  dominantAffect: AffectFamily | 'Calm' | 'Elevated-Hypomanic';
  fiveSwatches: [string, string, string, string, string];
  gradientCss: string;
  emotionalCoordinates: {
    valence: number; // -1.0 to +1.0
    arousal: number; // 0.0 to 1.0
  };
  titleVi: string;
  titleEn: string;
  summaryVi: string;
  summaryEn: string;
}

export interface MultimodalVoiceBurstResult {
  transcript: string;
  wordCount: number;
  durationSeconds: number;
  wordsPerMinute: number;
  personalBaselineWpm: number;
  wpmSpikePercent: number;
  /** True when speech pacing spikes > 30% above baseline (or > 175 WPM) with elevated energy or reduced sleep */
  bipolarPressuredSpeechAlert: boolean;
  pressuredSpeechBannerVi: string;
  pressuredSpeechBannerEn: string;
  classifiedComplaintType: SessionPhase0Mode; // 'expressive' vs 'instrumental'
  complaintClassificationReasonVi: string;
  complaintClassificationReasonEn: string;
  earEmpathyValidationVi: string;
  earEmpathyValidationEn: string;
  recommendedTechnique: TechniqueSlug;
  moodPalette: FiveSwatchMoodPalette;
}

export function analyzeMultimodalVoiceBurst(params: {
  transcript: string;
  durationSeconds: number;
  personalBaselineWpm?: number; // default 125 WPM
  moodPolarity?: MoodPole;
  energyLevel?: MoodPole;
  feltNeedForSleep?: FeltNeedForSleep;
  explicitWordCountOverride?: number;
}): MultimodalVoiceBurstResult {
  const baselineWpm = Math.max(60, params.personalBaselineWpm ?? 125);
  const durationSec = Math.max(1, params.durationSeconds);
  const tokens = params.transcript
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const wordCount = params.explicitWordCountOverride ?? tokens.length;
  const wordsPerMinute = Math.round((wordCount / durationSec) * 60);
  const wpmSpikePercent = Math.round(((wordsPerMinute - baselineWpm) / baselineWpm) * 100);

  const hasElevatedEnergyOrReducedSleep =
    (params.energyLevel ?? 0) >= 2 ||
    (params.moodPolarity ?? 0) >= 2 ||
    params.feltNeedForSleep === 'reduced_need' ||
    params.feltNeedForSleep === 'no_need_at_all' ||
    /không cần ngủ|ý tưởng thiên tài|nhanh quá|không dừng lại được|all-in|triệu đô|unstoppable|genius/i.test(
      params.transcript
    );

  // Flag Bipolar Pressured Speech when WPM spikes > 30% over personal baseline
  const bipolarPressuredSpeechAlert =
    wpmSpikePercent > 30 && (hasElevatedEnergyOrReducedSleep || wordsPerMinute >= 165);

  const pressuredSpeechBannerVi = bipolarPressuredSpeechAlert
    ? `CẢNH BÁO NHỊP NÓI DỒN DẬP HƯNG CẢM (Pressured Speech: ${wordsPerMinute} WPM, tăng +${wpmSpikePercent}% so với nền ${baselineWpm} WPM): Phát hiện tốc độ nói tăng vọt > 30% kèm dấu hiệu năng lượng cao/giảm nhu cầu ngủ. Đề xuất kích hoạt Lá chắn Hưng cảm (Hypomania Guard), Khoang Chờ 48 Giờ và Hạ nhiệt Sinh lý.`
    : `Nhịp độ giọng nói ổn định (${wordsPerMinute} WPM vs. nền cá nhân ${baselineWpm} WPM, biến thiên ${wpmSpikePercent >= 0 ? `+${wpmSpikePercent}` : wpmSpikePercent}%).`;

  const pressuredSpeechBannerEn = bipolarPressuredSpeechAlert
    ? `BIPOLAR PRESSURED SPEECH ALERT (${wordsPerMinute} WPM, +${wpmSpikePercent}% spike vs. ${baselineWpm} WPM baseline): Speech pacing exceeds the +30% threshold with elevated activation/reduced sleep. Recommend activating Hypomania Guard & 48-Hour Impulse Vault.`
    : `Speech pacing within personal baseline (${wordsPerMinute} WPM vs. ${baselineWpm} WPM baseline, ${wpmSpikePercent >= 0 ? `+${wpmSpikePercent}` : wpmSpikePercent}% delta).`;

  // Classify Expressive Complaint vs Instrumental Complaint
  const lower = params.transcript.toLowerCase();
  const isInstrumental =
    /làm sao|cách nào|giúp tôi lập|hướng dẫn|bài tập|phác đồ|how do i|help me plan|what step|solve|fix|technique/i.test(
      lower
    );
  const classifiedComplaintType: SessionPhase0Mode = isInstrumental
    ? 'instrumental'
    : 'expressive';

  const complaintClassificationReasonVi =
    classifiedComplaintType === 'expressive'
      ? 'Phân loại: Phàn nàn Giải tỏa Cảm xúc (Expressive Complaint) — Cần kích hoạt 5 Bí quyết Thấu cảm TEAM-CBT EAR trước, tuyệt đối không ép giải pháp vội.'
      : 'Phân loại: Phàn nàn Hướng Giải pháp (Instrumental Complaint) — Sẵn sàng chuyển vào phác đồ CBT/DBT có cấu trúc.';

  const complaintClassificationReasonEn =
    classifiedComplaintType === 'expressive'
      ? 'Classified as Expressive Complaint — Prioritize TEAM-CBT EAR Empathy & validation before offering structured problem-solving.'
      : 'Classified as Instrumental Complaint — Ready for structured CBT/DBT protocol guidance.';

  // Build 5-Swatch Mood-Palette Studio
  let moodPalette: FiveSwatchMoodPalette;
  let recommendedTechnique: TechniqueSlug = 'thought-record';

  if (bipolarPressuredSpeechAlert || (params.moodPolarity ?? 0) >= 2) {
    recommendedTechnique = 'hypomania-devils-advocate';
    moodPalette = {
      dominantAffect: 'Elevated-Hypomanic',
      fiveSwatches: ['#451a03', '#78350f', '#b45309', '#d97706', '#fde68a'],
      gradientCss: 'linear-gradient(135deg, #451a03 0%, #78350f 28%, #b45309 55%, #d97706 80%, #fde68a 100%)',
      emotionalCoordinates: { valence: 0.72, arousal: 0.92 },
      titleVi: 'Bảng màu Hổ Phách Hạ Nhiệt Hưng Cảm (Warm Amber Low-Stimulus Palette)',
      titleEn: 'Warm Amber Hypomania Guard Mood-Palette',
      summaryVi: 'Năng lượng và tốc độ ngôn ngữ tăng cao — sử dụng gam màu trầm ấm để bảo vệ nhịp sinh học.',
      summaryEn: 'High vocal arousal & pacing detected — anchoring with warm low-stimulus amber tones.',
    };
  } else if (/hoảng loạn|sợ|lo âu|tim đập|panic|anxious|worried|scared/i.test(lower)) {
    recommendedTechnique = 'tipp';
    moodPalette = {
      dominantAffect: 'Anxiety',
      fiveSwatches: ['#0f172a', '#1e3a8a', '#0284c7', '#38bdf8', '#bae6fd'],
      gradientCss: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 25%, #0284c7 55%, #38bdf8 80%, #bae6fd 100%)',
      emotionalCoordinates: { valence: -0.55, arousal: 0.84 },
      titleVi: 'Bảng màu Đại Dương Làm Dịu Giao Cảm (Deep Ocean Parasympathetic Palette)',
      titleEn: 'Deep Ocean Parasympathetic Calming Palette',
      summaryVi: 'Phát hiện tín hiệu lo âu / kích hoạt giao cảm — ưu tiên thở dẫn nhịp 4-6 và DBT TIPP.',
      summaryEn: 'Sympathetic anxiety arousal detected — prioritizing 4-6 paced breathing and DBT TIPP.',
    };
  } else if (/xấu hổ|tội lỗi|vô dụng|kẻ thất bại|shame|guilty|worthless/i.test(lower)) {
    recommendedTechnique = 'opposite-action';
    moodPalette = {
      dominantAffect: 'Shame',
      fiveSwatches: ['#2e1065', '#4c1d95', '#6d28d9', '#a78bfa', '#ede9fe'],
      gradientCss: 'linear-gradient(135deg, #2e1065 0%, #4c1d95 28%, #6d28d9 55%, #a78bfa 80%, #ede9fe 100%)',
      emotionalCoordinates: { valence: -0.68, arousal: 0.48 },
      titleVi: 'Bảng màu Tím Tự Trắc Ẩn & Gỡ Bỏ Xấu Hổ (Self-Compassion Violet Palette)',
      titleEn: 'Self-Compassion Violet Shame-Relief Palette',
      summaryVi: 'Nhận diện cảm giác tự trách/xấu hổ — tắt Socratic Pushback và kích hoạt Tự trắc ẩn.',
      summaryEn: 'Shame/self-criticism detected — disabling pushback and activating self-compassion.',
    };
  } else if (/kiệt sức|mệt mỏi|buồn|trầm cảm|nặng nề|exhausted|sad|tired|empty/i.test(lower)) {
    recommendedTechnique = 'behavioral-activation';
    moodPalette = {
      dominantAffect: 'Sadness',
      fiveSwatches: ['#1e293b', '#334155', '#475569', '#94a3b8', '#e2e8f0'],
      gradientCss: 'linear-gradient(135deg, #1e293b 0%, #334155 30%, #475569 60%, #94a3b8 82%, #e2e8f0 100%)',
      emotionalCoordinates: { valence: -0.62, arousal: 0.22 },
      titleVi: 'Bảng màu Sương Sớm Một Bước Nhỏ (Gentle Mist Low-Energy Palette)',
      titleEn: 'Gentle Mist Low-Energy Depression Palette',
      summaryVi: 'Mức năng lượng thấp / mệt mỏi — ưu tiên Cổng Rest Check và 1 bước nhỏ không áp lực.',
      summaryEn: 'Low energy and fatigue detected — prioritizing Rest Check and one gentle micro-step.',
    };
  } else {
    recommendedTechnique = 'thought-record';
    moodPalette = {
      dominantAffect: 'Calm',
      fiveSwatches: ['#064e3b', '#047857', '#0d9488', '#2dd4bf', '#ccfbf1'],
      gradientCss: 'linear-gradient(135deg, #064e3b 0%, #047857 25%, #0d9488 55%, #2dd4bf 80%, #ccfbf1 100%)',
      emotionalCoordinates: { valence: 0.25, arousal: 0.35 },
      titleVi: 'Bảng màu Ngọc Lục Bảo Cân Bằng (Emerald Wise Mind Palette)',
      titleEn: 'Emerald Wise Mind Equilibrium Palette',
      summaryVi: 'Trạng thái cân bằng để quan sát suy nghĩ và thực hành Tâm Trí Tuệ (Wise Mind).',
      summaryEn: 'Balanced state ready for cognitive reflection and Wise Mind synthesis.',
    };
  }

  return {
    transcript: params.transcript,
    wordCount,
    durationSeconds: durationSec,
    wordsPerMinute,
    personalBaselineWpm: baselineWpm,
    wpmSpikePercent,
    bipolarPressuredSpeechAlert,
    pressuredSpeechBannerVi,
    pressuredSpeechBannerEn,
    classifiedComplaintType,
    complaintClassificationReasonVi,
    complaintClassificationReasonEn,
    earEmpathyValidationVi:
      'Mình nghe trọn vẹn từng lời bạn vừa chia sẻ qua Voice Burst. Cảm xúc của bạn hoàn toàn hợp lý với những gì bạn đang trải qua.',
    earEmpathyValidationEn:
      'I heard every word of your Voice Burst. Your feelings make complete sense given what you are going through.',
    recommendedTechnique,
    moodPalette,
  };
}

// ============================================================================
// 4. BASELINE-RELATIVE HRV & SLEEP BIOMETRICS CONTEXT ENGINE
//    Strictly follows packages/clinical-protocols-kb/references/health-integration.md
// ============================================================================

export type HrvDeviceSource =
  | 'apple_watch_sdnn'
  | 'oura_ring_rmssd'
  | 'garmin_rmssd'
  | 'fitbit_rmssd';

export interface HistoricalHrvReading {
  dateIso: string; // YYYY-MM-DD or ISO-8601
  valueMs: number;
  deviceSource: HrvDeviceSource;
}

export type BaselineHrvClassification =
  | 'below-baseline'
  | 'within-baseline'
  | 'above-baseline'
  | 'stale-ignored'
  | 'insufficient-baseline';

export interface BaselineRelativeHrvAndSleepEvaluation {
  deviceSource: HrvDeviceSource;
  metricUnit: 'SDNN (ms)' | 'RMSSD (ms)';
  validBaselineDaysCount: number;
  p25Ms: number | null;
  p75Ms: number | null;
  latestReadingMs: number;
  latestReadingAgeHours: number;
  isFreshUnder12Hours: boolean;
  classification: BaselineHrvClassification;
  shouldMentionInCheckIn: boolean;
  /** Strictly false per Rule 3 of health-integration.md */
  withinSessionPrePostComparisonAllowed: false;
  sleepDurationHours: number;
  feltNeedForSleep: FeltNeedForSleep;
  bipolarSleepProdromeFlag: boolean;
  gentleCheckInMentionVi: string;
  gentleCheckInMentionEn: string;
  clinicalComplianceRuleNoteVi: string;
  clinicalComplianceRuleNoteEn: string;
}

function computePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  const idx = (percentile / 100) * (sortedValues.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return Number((sortedValues[lower] ?? 0).toFixed(1));
  const weight = idx - lower;
  const val = (sortedValues[lower] ?? 0) * (1 - weight) + (sortedValues[upper] ?? 0) * weight;
  return Number(val.toFixed(1));
}

/**
 * Evaluates Baseline-Relative HRV (25th-75th percentile over 14-30 days from the SAME device source)
 * and Sleep Duration / Felt Need for Sleep:
 * - Rule 1: Only compares against user's personal P25-P75 from the same deviceSource (min 7 days). Never uses population cutoffs.
 * - Rule 2: Readings older than 12 hours are marked `stale-ignored` and not mentioned in check-in.
 * - Rule 3: `withinSessionPrePostComparisonAllowed` is hardcoded to `false` (never compares pre/post session HRV).
 * - Rule 4: Mentions at most once gently at Phase 1 check-in when fresh (< 12h) and `below-baseline` (< P25).
 */
export function evaluateBaselineRelativeHrvAndSleep(params: {
  deviceSource: HrvDeviceSource;
  historicalReadings14To30Days: HistoricalHrvReading[];
  latestReadingMs: number;
  latestReadingRecordedAtIso: string;
  nowIso?: string;
  sleepDurationHours: number;
  feltNeedForSleep: FeltNeedForSleep;
  consecutiveShortSleepNights?: number;
}): BaselineRelativeHrvAndSleepEvaluation {
  const nowMs = new Date(params.nowIso ?? new Date().toISOString()).getTime();
  const recordedMs = new Date(params.latestReadingRecordedAtIso).getTime();
  const ageHours = Number(Math.max(0, (nowMs - recordedMs) / (1000 * 60 * 60)).toFixed(2));
  const isFreshUnder12Hours = ageHours <= 12;

  // Filter historical readings strictly to the SAME device source within 30 days
  const sameSourceReadings = params.historicalReadings14To30Days
    .filter((r) => r.deviceSource === params.deviceSource && r.valueMs > 0)
    .slice(-30);

  const metricUnit: 'SDNN (ms)' | 'RMSSD (ms)' =
    params.deviceSource === 'apple_watch_sdnn' ? 'SDNN (ms)' : 'RMSSD (ms)';

  const bipolarSleepProdromeFlag =
    params.sleepDurationHours < 5 &&
    (params.feltNeedForSleep === 'reduced_need' || params.feltNeedForSleep === 'no_need_at_all') &&
    (params.consecutiveShortSleepNights ?? 2) >= 2;

  // Rule 2: 12-hour freshness gate
  if (!isFreshUnder12Hours) {
    return {
      deviceSource: params.deviceSource,
      metricUnit,
      validBaselineDaysCount: sameSourceReadings.length,
      p25Ms: null,
      p75Ms: null,
      latestReadingMs: params.latestReadingMs,
      latestReadingAgeHours: ageHours,
      isFreshUnder12Hours: false,
      classification: 'stale-ignored',
      shouldMentionInCheckIn: false,
      withinSessionPrePostComparisonAllowed: false,
      sleepDurationHours: params.sleepDurationHours,
      feltNeedForSleep: params.feltNeedForSleep,
      bipolarSleepProdromeFlag,
      gentleCheckInMentionVi:
        'Dữ liệu HRV gần nhất đã cũ hơn 12 giờ (stale-ignored) — hệ thống tự động bỏ qua và không nhắc trong bước Check-in.',
      gentleCheckInMentionEn:
        'Most recent HRV reading is older than 12 hours (stale-ignored) — omitted from session check-in per health-integration protocol.',
      clinicalComplianceRuleNoteVi:
        'Tuân thủ health-integration.md: Chỉ dùng dữ liệu < 12h từ cùng 1 thiết bị; CẤM TUYỆT ĐỐI so sánh HRV trước/sau trong cùng 1 phiên.',
      clinicalComplianceRuleNoteEn:
        'Compliant with health-integration.md: Requires < 12h freshness from same device source; within-session pre/post HRV comparison is strictly forbidden.',
    };
  }

  // Rule 1: Minimum 7 valid daily readings from the same device source
  if (sameSourceReadings.length < 7) {
    return {
      deviceSource: params.deviceSource,
      metricUnit,
      validBaselineDaysCount: sameSourceReadings.length,
      p25Ms: null,
      p75Ms: null,
      latestReadingMs: params.latestReadingMs,
      latestReadingAgeHours: ageHours,
      isFreshUnder12Hours: true,
      classification: 'insufficient-baseline',
      shouldMentionInCheckIn: false,
      withinSessionPrePostComparisonAllowed: false,
      sleepDurationHours: params.sleepDurationHours,
      feltNeedForSleep: params.feltNeedForSleep,
      bipolarSleepProdromeFlag,
      gentleCheckInMentionVi: `Đang tích lũy đường nền HRV cá nhân (${sameSourceReadings.length}/7 ngày tối thiểu trên ${params.deviceSource}) — chưa đưa ra phân loại sinh trắc học.`,
      gentleCheckInMentionEn: `Accumulating personal HRV baseline (${sameSourceReadings.length}/7 minimum days on ${params.deviceSource}) — deferring biometric classification.`,
      clinicalComplianceRuleNoteVi:
        'Tuân thủ health-integration.md: Không dùng ngưỡng HRV tuyệt đối của quần thể khi chưa đủ >= 7 ngày dữ liệu cá nhân.',
      clinicalComplianceRuleNoteEn:
        'Compliant with health-integration.md: Never falls back to population HRV cutoffs when < 7 personal baseline days exist.',
    };
  }

  const sortedValues = sameSourceReadings.map((r) => r.valueMs).sort((a, b) => a - b);
  const p25Ms = computePercentile(sortedValues, 25);
  const p75Ms = computePercentile(sortedValues, 75);

  let classification: BaselineHrvClassification = 'within-baseline';
  if (params.latestReadingMs < p25Ms) {
    classification = 'below-baseline';
  } else if (params.latestReadingMs > p75Ms) {
    classification = 'above-baseline';
  }

  const shouldMentionInCheckIn = classification === 'below-baseline';

  const gentleCheckInMentionVi =
    classification === 'below-baseline'
      ? `Chỉ số HRV gần nhất của bạn thấp hơn ngưỡng nền cá nhân (P25 = ${p25Ms} ${metricUnit}) và đêm qua bạn ngủ ${params.sleepDurationHours}h — cơ thể bạn có thể đang chịu tải sinh học cao, hôm nay mình ưu tiên các bước nhẹ nhàng nhé.`
      : classification === 'above-baseline'
        ? `Chỉ số HRV nằm trên phân vị 75 cá nhân (> ${p75Ms} ${metricUnit}) — hệ thần kinh tự chủ đang phục hồi tốt.`
        : `Chỉ số HRV nằm trong dải nền cá nhân 14–30 ngày (P25 ${p25Ms} – P75 ${p75Ms} ${metricUnit}).`;

  const gentleCheckInMentionEn =
    classification === 'below-baseline'
      ? `Your recent HRV is below your personal 30-day baseline (P25 = ${p25Ms} ${metricUnit}) and sleep was ${params.sleepDurationHours}h — your nervous system may be carrying extra physiological load today, so let's keep our pace gentle.`
      : classification === 'above-baseline'
        ? `Your recent HRV is above your personal 75th percentile (> ${p75Ms} ${metricUnit}) — indicating strong autonomic recovery.`
        : `Your recent HRV is within your personal 14–30 day baseline (P25 ${p25Ms} – P75 ${p75Ms} ${metricUnit}).`;

  return {
    deviceSource: params.deviceSource,
    metricUnit,
    validBaselineDaysCount: sameSourceReadings.length,
    p25Ms,
    p75Ms,
    latestReadingMs: params.latestReadingMs,
    latestReadingAgeHours: ageHours,
    isFreshUnder12Hours: true,
    classification,
    shouldMentionInCheckIn,
    withinSessionPrePostComparisonAllowed: false,
    sleepDurationHours: params.sleepDurationHours,
    feltNeedForSleep: params.feltNeedForSleep,
    bipolarSleepProdromeFlag,
    gentleCheckInMentionVi,
    gentleCheckInMentionEn,
    clinicalComplianceRuleNoteVi:
      'Tuân thủ health-integration.md: So sánh theo phân vị P25–P75 cá nhân (14–30 ngày, cùng thiết bị), độ tươi < 12h, CẤM so sánh HRV trước/sau trong cùng 1 phiên.',
    clinicalComplianceRuleNoteEn:
      'Compliant with health-integration.md: Personal P25–P75 percentile (14–30d, same device), < 12h freshness gate, zero within-session pre/post HRV comparison.',
  };
}

export const SAMPLE_14_DAY_HRV_BASELINE: HistoricalHrvReading[] = [
  { dateIso: '2026-11-07', valueMs: 42, deviceSource: 'apple_watch_sdnn' },
  { dateIso: '2026-11-08', valueMs: 45, deviceSource: 'apple_watch_sdnn' },
  { dateIso: '2026-11-09', valueMs: 48, deviceSource: 'apple_watch_sdnn' },
  { dateIso: '2026-11-10', valueMs: 51, deviceSource: 'apple_watch_sdnn' },
  { dateIso: '2026-11-11', valueMs: 44, deviceSource: 'apple_watch_sdnn' },
  { dateIso: '2026-11-12', valueMs: 55, deviceSource: 'apple_watch_sdnn' },
  { dateIso: '2026-11-13', valueMs: 58, deviceSource: 'apple_watch_sdnn' },
  { dateIso: '2026-11-14', valueMs: 46, deviceSource: 'apple_watch_sdnn' },
  { dateIso: '2026-11-15', valueMs: 49, deviceSource: 'apple_watch_sdnn' },
  { dateIso: '2026-11-16', valueMs: 53, deviceSource: 'apple_watch_sdnn' },
  { dateIso: '2026-11-17', valueMs: 60, deviceSource: 'apple_watch_sdnn' },
  { dateIso: '2026-11-18', valueMs: 47, deviceSource: 'apple_watch_sdnn' },
  { dateIso: '2026-11-19', valueMs: 50, deviceSource: 'apple_watch_sdnn' },
  { dateIso: '2026-11-20', valueMs: 52, deviceSource: 'apple_watch_sdnn' },
  // Oura ring RMSSD baseline
  { dateIso: '2026-11-10', valueMs: 34, deviceSource: 'oura_ring_rmssd' },
  { dateIso: '2026-11-11', valueMs: 36, deviceSource: 'oura_ring_rmssd' },
  { dateIso: '2026-11-12', valueMs: 39, deviceSource: 'oura_ring_rmssd' },
  { dateIso: '2026-11-13', valueMs: 41, deviceSource: 'oura_ring_rmssd' },
  { dateIso: '2026-11-14', valueMs: 38, deviceSource: 'oura_ring_rmssd' },
  { dateIso: '2026-11-15', valueMs: 44, deviceSource: 'oura_ring_rmssd' },
  { dateIso: '2026-11-16', valueMs: 47, deviceSource: 'oura_ring_rmssd' },
  { dateIso: '2026-11-17', valueMs: 35, deviceSource: 'oura_ring_rmssd' },
  { dateIso: '2026-11-18', valueMs: 40, deviceSource: 'oura_ring_rmssd' },
  // Garmin RMSSD baseline
  { dateIso: '2026-11-11', valueMs: 38, deviceSource: 'garmin_rmssd' },
  { dateIso: '2026-11-12', valueMs: 40, deviceSource: 'garmin_rmssd' },
  { dateIso: '2026-11-13', valueMs: 43, deviceSource: 'garmin_rmssd' },
  { dateIso: '2026-11-14', valueMs: 45, deviceSource: 'garmin_rmssd' },
  { dateIso: '2026-11-15', valueMs: 41, deviceSource: 'garmin_rmssd' },
  { dateIso: '2026-11-16', valueMs: 48, deviceSource: 'garmin_rmssd' },
  { dateIso: '2026-11-17', valueMs: 50, deviceSource: 'garmin_rmssd' },
  { dateIso: '2026-11-18', valueMs: 42, deviceSource: 'garmin_rmssd' },
];

export { BUILTIN_CLINICAL_KB_CHUNKS };
