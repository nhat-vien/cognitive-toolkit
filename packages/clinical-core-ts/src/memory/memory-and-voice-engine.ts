/**
 * Phase 3 (Milestone 3: Sprint 5 & Sprint 6):
 * 1. 2-Tier Clinical Session Memory Manager (ported from `KazKozDev/cbt-assistant`)
 *    - Sliding window of latest 20 messages (`RECENT_MESSAGE_WINDOW = 20`)
 *    - Automatic Rolling Summary refresh every 15 new messages (`ROLLING_SUMMARY_INTERVAL = 15`)
 *    - Immediate Structured Personal Profile Fact extraction (`extractStructuredProfileFacts`)
 *    - Full transparency inspection & selective erasure (`inspectMemoryState`, `eraseDerivedMemoryOnly`, `eraseAllTranscriptsAndMemory`)
 *
 * 2. Audio "Burst" Multimodal Analyzer & Speech-Pace Mania Detector (ported from `Andrew-FungKinHo/whynot` & Bipolar Prodrome spec)
 *    - Pressured-speech / logorrhea detection (`wpm > baselineWordsPerMinute * 1.30`, default baseline 130 WPM)
 *    - Expressive Complaint (empathy/validation) vs. Instrumental Complaint (action/CBT-DBT problem-solving) classifier
 *    - 5-Color Mood-Palette generator (`dominantEmotion`, `hexColors`, `valenceScore`, `arousalScore`)
 *    - Baseline-Relative HRV Context integration (25th-75th percentile over 14-30 days, < 12h freshness gate, no single-session pre/post comparison)
 */

import type {
  AdaptiveUiThemeMode,
  HrvBaselineContext,
  PushbackLevel,
  TechniqueSlug,
} from '../schemas/models.ts';
import {
  analyzeClinicalText,
  evaluateFourLayerSafety,
  type DetectedPatternMatch,
  type FourLayerSafetyEvaluation,
} from '../detectors/distortion-detector.ts';
import {
  evaluateBaselineRelativeHrv,
  type HrvBaselineEvaluation,
  type HrvReadingSample,
} from '../bipolar/bipolar-engine.ts';

// ============================================================================
// PART 1: 2-TIER CLINICAL SESSION MEMORY MANAGER (KazKozDev/cbt-assistant)
// ============================================================================

export const RECENT_MESSAGE_WINDOW = 20;
export const ROLLING_SUMMARY_INTERVAL = 15;

export interface SessionMemoryMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestampIso: string;
  technique?: TechniqueSlug;
  detectedDistortions?: string[];
}

export interface StructuredPersonalProfileFacts {
  preferredName?: string;
  coreValues: string[];
  workOrStudyContext?: string;
  trustedSupportPeople: string[];
  knownBipolarProdromes: string[];
  preferredPushbackLevel?: PushbackLevel;
  extractedTriggers: string[];
  effectiveSkillsNoted: string[];
  lastUpdatedIso: string;
}

export interface RollingClinicalSummary {
  summaryTextVi: string;
  summaryTextEn: string;
  keyClinicalThemes: string[];
  recurringTriggers: string[];
  distortionPatterns: string[];
  effectiveSkills: string[];
  summarizedMessageCount: number;
  refreshCount: number;
  lastRefreshedIso: string | null;
}

export interface TwoTierMemoryState {
  sessionId: string;
  userId: string;
  windowLimit: number;
  rollingSummaryInterval: number;
  totalMessagesProcessed: number;
  messagesSinceLastSummary: number;
  recentMessages: SessionMemoryMessage[];
  rollingSummary: RollingClinicalSummary;
  structuredProfileFacts: StructuredPersonalProfileFacts;
}

const VALUE_KEYWORDS_MAP: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /(family|children|parents|kids|gia đình|con cái|bố mẹ)/i, label: 'Gia đình / Family' },
  { pattern: /(autonomy|freedom|independence|tự chủ|tự do|độc lập)/i, label: 'Tự chủ / Autonomy' },
  { pattern: /(health|sleep|wellbeing|sức khỏe|giấc ngủ|bình an)/i, label: 'Sức khỏe & Bình an / Health & Peace' },
  { pattern: /(creativity|art|music|writing|sáng tạo|nghệ thuật|âm nhạc)/i, label: 'Sáng tạo / Creativity' },
  { pattern: /(honesty|integrity|kindness|compassion|chân thành|tử tế|chính trực)/i, label: 'Chân thành & Tử tế / Integrity & Kindness' },
  { pattern: /(learning|growth|education|career|học hỏi|phát triển|sự nghiệp)/i, label: 'Học hỏi & Phát triển / Growth & Mastery' },
];

const BIPOLAR_PRODROME_KEYWORDS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /(ngủ dưới [2345] tiếng|ngủ ít hơn [45]h|slept less than [345] hours|don't need sleep|không cần ngủ)/i, label: 'Giảm nhu cầu ngủ (< 5h) / Reduced need for sleep' },
  { pattern: /(mua sắm lúc [1234]h sáng|shopping at [1234]am|tiêu tiền bốc đồng|overspending at night)/i, label: 'Mua sắm/quyết định ban đêm / Late-night impulsive spending' },
  { pattern: /(nói nhanh|ý tưởng dồn dập|racing thoughts|pressured speech|đầu nhảy số liên tục)/i, label: 'Nói nhanh & Ý tưởng phi mã / Racing thoughts & pressured speech' },
  { pattern: /(nhận 10 dự án|làm nhiều việc cùng lúc|starting 10 projects at once|hyper-focused all night)/i, label: 'Ôm đồm nhiều dự án / Goal-directed overactivity' },
  { pattern: /(bỏ bữa sáng|không ra khỏi giường|can't get out of bed|isolating for days)/i, label: 'Thu mình & Bỏ mốc sinh học / Social withdrawal & anchor drop' },
];

const TRIGGER_KEYWORDS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /(deadline|meeting|boss|manager|sếp|họp|áp lực công việc|cắt giảm nhân sự|layoff)/i, label: 'Áp lực công việc / Workplace & performance stress' },
  { pattern: /(conflict|argument|partner|spouse|cãi nhau|xung đột|bất đồng|từ chối)/i, label: 'Xung đột quan hệ / Interpersonal conflict' },
  { pattern: /(insomnia|mất ngủ|thức khuya|jetlag|lệch múi giờ|ca đêm)/i, label: 'Xáo trộn giấc ngủ / Sleep & circadian disruption' },
  { pattern: /(financial|debt|money|tiền bạc|tài chính|nợ)/i, label: 'Lo âu tài chính / Financial stress' },
];

const SKILL_KEYWORDS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /(tipp|paced breathing|thở 4-6|nước lạnh|cold water|grounding 5-4-3-2-1)/i, label: 'DBT TIPP & Paced Breathing' },
  { pattern: /(thought record|nhật ký suy nghĩ|bằng chứng phản bác|suy nghĩ cân bằng)/i, label: 'CBT 7-Step Thought Record' },
  { pattern: /(wise mind|tâm trí tuệ)/i, label: 'DBT Wise Mind' },
  { pattern: /(opposite action|hành động đối nghịch)/i, label: 'DBT Opposite Action' },
  { pattern: /(dear man|ear empathy)/i, label: 'DBT DEAR MAN & EAR Communication' },
  { pattern: /(worry box|hộp lo âu|trì hoãn lo lắng)/i, label: 'CBT Worry Box Postponement' },
  { pattern: /(48h|impulse vault|khoang trì hoãn|dark rest|ipsrt)/i, label: 'Bipolar 48h Impulse Vault & IPSRT' },
];

function uniqueMerge(existing: string[], incoming: string[]): string[] {
  const seen = new Set(existing);
  const out = [...existing];
  for (const item of incoming) {
    const trimmed = item.trim();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      out.push(trimmed);
    }
  }
  return out;
}

/**
 * Extracts Structured Personal Profile Facts immediately from user text (Vietnamese & English).
 * Captures:
 * - preferredName
 * - coreValues
 * - workOrStudyContext
 * - trustedSupportPeople
 * - knownBipolarProdromes
 * - preferredPushbackLevel
 */
export function extractStructuredProfileFacts(
  text: string,
  existing?: Partial<StructuredPersonalProfileFacts>,
  nowIso: string = new Date().toISOString(),
): StructuredPersonalProfileFacts {
  const base: StructuredPersonalProfileFacts = {
    preferredName: existing?.preferredName,
    coreValues: [...(existing?.coreValues ?? [])],
    workOrStudyContext: existing?.workOrStudyContext,
    trustedSupportPeople: [...(existing?.trustedSupportPeople ?? [])],
    knownBipolarProdromes: [...(existing?.knownBipolarProdromes ?? [])],
    preferredPushbackLevel: existing?.preferredPushbackLevel,
    extractedTriggers: [...(existing?.extractedTriggers ?? [])],
    effectiveSkillsNoted: [...(existing?.effectiveSkillsNoted ?? [])],
    lastUpdatedIso: nowIso,
  };

  if (!text || !text.trim()) {
    return base;
  }

  // 1. Preferred Name extraction (VI & EN)
  const namePatterns = [
    /(?:[Tt]ên tôi là|[Mm]ình tên là|[Gg]ọi tôi là|[Hh]ãy gọi mình là|[Tt]ên mình là)\s+([A-ZÀ-Ỹ][a-zà-ỹ]+(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]+){0,2})/u,
    /(?:[Mm]y name is|[Cc]all me|[Ii] am|[Ii]'m)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,1})\b/,
  ];
  for (const regex of namePatterns) {
    const m = text.match(regex);
    if (m && m[1]) {
      const candidate = m[1].trim();
      const disallowed = new Set(['Feeling', 'Anxious', 'Depressed', 'Tired', 'So', 'Very', 'Not']);
      if (!disallowed.has(candidate)) {
        base.preferredName = candidate;
        break;
      }
    }
  }

  // 2. Work / Study Context extraction
  const workPatterns = [
    /(?:tôi làm nghề|mình làm việc ở|tôi là một|hiện đang làm|công việc của tôi là|tôi đang học)\s+([^.,;!\n]{3,60})/i,
    /(?:i work as a|i work as an|i work at|i'm a software|i am a|my job is|i study)\s+([^.,;!\n]{3,60})/i,
  ];
  for (const regex of workPatterns) {
    const m = text.match(regex);
    if (m && m[1]) {
      base.workOrStudyContext = m[1].trim();
      break;
    }
  }

  // 3. Trusted Support People (Ulysses contacts, therapist, family, partner)
  const supportMatches: string[] = [];
  const supportPatterns = [
    /(?:[Nn]gười tin cậy là|[Ll]iên hệ khẩn cấp là|[Bb]ác sĩ điều trị là|[Vv]ợ tôi|[Cc]hồng tôi|[Bb]ạn thân|[Cc]hị|[Aa]nh|[Bb]ác sĩ)\s+([A-ZÀ-Ỹ][a-zà-ỹ]+(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]+)?)/gu,
    /(?:[Tt]rusted contact is|[Mm]y psychiatrist|[Mm]y therapist|[Mm]y partner|[Mm]y wife|[Mm]y husband|[Mm]y friend|Dr\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g,
  ];
  for (const regex of supportPatterns) {
    for (const m of text.matchAll(regex)) {
      if (m[0]) {
        supportMatches.push(m[0].trim());
      }
    }
  }
  base.trustedSupportPeople = uniqueMerge(base.trustedSupportPeople, supportMatches);

  // 4. Core Values
  const matchedValues: string[] = [];
  for (const v of VALUE_KEYWORDS_MAP) {
    if (v.pattern.test(text)) {
      matchedValues.push(v.label);
    }
  }
  base.coreValues = uniqueMerge(base.coreValues, matchedValues);

  // 5. Known Bipolar Prodromes
  const matchedProdromes: string[] = [];
  for (const p of BIPOLAR_PRODROME_KEYWORDS) {
    if (p.pattern.test(text)) {
      matchedProdromes.push(p.label);
    }
  }
  base.knownBipolarProdromes = uniqueMerge(base.knownBipolarProdromes, matchedProdromes);

  // 6. Preferred Socratic Pushback Level
  if (/(pushback off|tắt pushback|không muốn bị hỏi vặn|chỉ muốn được lắng nghe|no pushback)/i.test(text)) {
    base.preferredPushbackLevel = 'off';
  } else if (/(pushback nhẹ|nhẹ nhàng thôi|gentle pushback|hỏi nhẹ nhàng)/i.test(text)) {
    base.preferredPushbackLevel = 'gentle';
  } else if (/(pushback vừa phải|moderate pushback)/i.test(text)) {
    base.preferredPushbackLevel = 'moderate';
  } else if (/(pushback sâu|hỏi phản biện mạnh|firm pushback|challenge me firmly)/i.test(text)) {
    base.preferredPushbackLevel = 'firm';
  }

  // 7. Clinical Triggers & Effective Skills
  const matchedTriggers: string[] = [];
  for (const t of TRIGGER_KEYWORDS) {
    if (t.pattern.test(text)) {
      matchedTriggers.push(t.label);
    }
  }
  base.extractedTriggers = uniqueMerge(base.extractedTriggers, matchedTriggers);

  const matchedSkills: string[] = [];
  for (const s of SKILL_KEYWORDS) {
    if (s.pattern.test(text)) {
      matchedSkills.push(s.label);
    }
  }
  base.effectiveSkillsNoted = uniqueMerge(base.effectiveSkillsNoted, matchedSkills);

  return base;
}

/**
 * Stateful 2-Tier Clinical Session Memory Manager (`KazKozDev/cbt-assistant` architecture).
 * - Tier 1: Sliding window of the latest 20 raw messages (`RECENT_MESSAGE_WINDOW = 20`)
 * - Tier 2: Rolling Clinical Summary refreshed automatically every 15 messages (`ROLLING_SUMMARY_INTERVAL = 15`)
 *           + Immediate Structured Personal Profile Facts extraction
 */
export class TwoTierClinicalMemoryManager {
  private state: TwoTierMemoryState;

  constructor(params?: {
    sessionId?: string;
    userId?: string;
    initialState?: Partial<TwoTierMemoryState>;
  }) {
    const nowIso = new Date().toISOString();
    this.state = {
      sessionId: params?.sessionId ?? params?.initialState?.sessionId ?? 'sess-default',
      userId: params?.userId ?? params?.initialState?.userId ?? 'user-default',
      windowLimit: RECENT_MESSAGE_WINDOW,
      rollingSummaryInterval: ROLLING_SUMMARY_INTERVAL,
      totalMessagesProcessed: params?.initialState?.totalMessagesProcessed ?? 0,
      messagesSinceLastSummary: params?.initialState?.messagesSinceLastSummary ?? 0,
      recentMessages: [...(params?.initialState?.recentMessages ?? [])].slice(-RECENT_MESSAGE_WINDOW),
      rollingSummary: params?.initialState?.rollingSummary ?? {
        summaryTextVi: '',
        summaryTextEn: '',
        keyClinicalThemes: [],
        recurringTriggers: [],
        distortionPatterns: [],
        effectiveSkills: [],
        summarizedMessageCount: 0,
        refreshCount: 0,
        lastRefreshedIso: null,
      },
      structuredProfileFacts: params?.initialState?.structuredProfileFacts ?? {
        coreValues: [],
        trustedSupportPeople: [],
        knownBipolarProdromes: [],
        extractedTriggers: [],
        effectiveSkillsNoted: [],
        lastUpdatedIso: nowIso,
      },
    };
  }

  /**
   * Append a single dialogue message (user or assistant) to the 2-Tier Memory.
   * - Immediately updates Structured Personal Profile Facts on user messages
   * - Triggers a Rolling Summary refresh every 15 new messages (`ROLLING_SUMMARY_INTERVAL = 15`)
   * - Trims `recentMessages` to a sliding window of the latest 20 messages (`RECENT_MESSAGE_WINDOW = 20`)
   */
  public addMessage(input: {
    id?: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestampIso?: string;
    technique?: TechniqueSlug;
  }): TwoTierMemoryState {
    const nowIso = input.timestampIso ?? new Date().toISOString();
    const detected = analyzeClinicalText(input.content);
    const distortionIds = [
      ...detected.negativeDistortions.map((d) => d.id),
      ...detected.positiveDistortions.map((d) => d.id),
      ...detected.selfDefeatingBeliefs.map((d) => d.id),
    ];

    const message: SessionMemoryMessage = {
      id: input.id ?? `msg-${this.state.totalMessagesProcessed + 1}`,
      role: input.role,
      content: input.content,
      timestampIso: nowIso,
      technique: input.technique,
      detectedDistortions: distortionIds,
    };

    this.state.recentMessages.push(message);
    this.state.totalMessagesProcessed += 1;
    this.state.messagesSinceLastSummary += 1;

    // Immediately extract structured profile facts from user utterances
    if (input.role === 'user') {
      this.state.structuredProfileFacts = extractStructuredProfileFacts(
        input.content,
        this.state.structuredProfileFacts,
        nowIso,
      );
    }

    // Trigger Rolling Summary refresh every 15 new messages
    if (this.state.messagesSinceLastSummary >= ROLLING_SUMMARY_INTERVAL) {
      this.refreshRollingSummary(nowIso);
    }

    // Enforce sliding window of 20 most recent messages
    if (this.state.recentMessages.length > RECENT_MESSAGE_WINDOW) {
      this.state.recentMessages = this.state.recentMessages.slice(-RECENT_MESSAGE_WINDOW);
    }

    return this.inspectMemoryState();
  }

  /**
   * Compress accumulated dialogue into the Tier-2 Rolling Clinical Summary.
   */
  public refreshRollingSummary(nowIso: string = new Date().toISOString()): RollingClinicalSummary {
    const allDistortions: string[] = [];
    const techniquesUsed: string[] = [];

    for (const msg of this.state.recentMessages) {
      if (msg.detectedDistortions) {
        allDistortions.push(...msg.detectedDistortions);
      }
      if (msg.technique) {
        techniquesUsed.push(msg.technique);
      }
    }

    const prev = this.state.rollingSummary;
    const distortionPatterns = uniqueMerge(prev.distortionPatterns, allDistortions);
    const recurringTriggers = uniqueMerge(
      prev.recurringTriggers,
      this.state.structuredProfileFacts.extractedTriggers,
    );
    const effectiveSkills = uniqueMerge(
      prev.effectiveSkills,
      uniqueMerge(techniquesUsed, this.state.structuredProfileFacts.effectiveSkillsNoted),
    );
    const keyClinicalThemes = uniqueMerge(prev.keyClinicalThemes, [
      ...(distortionPatterns.length > 0 ? ['Nhận diện & tái cấu trúc biến dạng nhận thức'] : []),
      ...(recurringTriggers.length > 0 ? recurringTriggers : ['Theo dõi khí sắc & điều hòa cảm xúc']),
      ...(this.state.structuredProfileFacts.knownBipolarProdromes.length > 0
        ? ['Theo dõi tiền triệu Lưỡng cực & bảo vệ nhịp sinh học IPSRT']
        : []),
    ]);

    const refreshCount = prev.refreshCount + 1;
    const summarizedMessageCount = this.state.totalMessagesProcessed;
    const nameLabel = this.state.structuredProfileFacts.preferredName ?? 'Người dùng';

    const summaryTextVi =
      `[Rolling Summary #${refreshCount} - ${summarizedMessageCount} tin nhắn] ` +
      `${nameLabel}: Chủ đề lâm sàng chính: ${keyClinicalThemes.join(', ') || 'Đồng hành CBT/DBT'}. ` +
      `Tác nhân kích hoạt: ${recurringTriggers.join(', ') || 'Chưa ghi nhận'}. ` +
      `Biến dạng nhận thức: ${distortionPatterns.join(', ') || 'Chưa phát hiện'}. ` +
      `Kỹ năng hiệu quả: ${effectiveSkills.join(', ') || 'Lắng nghe thấu cảm EAR'}.`;

    const summaryTextEn =
      `[Rolling Summary #${refreshCount} - ${summarizedMessageCount} messages] ` +
      `${nameLabel}: Key themes: ${keyClinicalThemes.join(', ') || 'CBT/DBT support'}. ` +
      `Triggers: ${recurringTriggers.join(', ') || 'None noted'}. ` +
      `Distortions: ${distortionPatterns.join(', ') || 'None detected'}. ` +
      `Effective skills: ${effectiveSkills.join(', ') || 'EAR Empathy'}.`;

    this.state.rollingSummary = {
      summaryTextVi,
      summaryTextEn,
      keyClinicalThemes,
      recurringTriggers,
      distortionPatterns,
      effectiveSkills,
      summarizedMessageCount,
      refreshCount,
      lastRefreshedIso: nowIso,
    };
    this.state.messagesSinceLastSummary = 0;

    return this.state.rollingSummary;
  }

  /**
   * Inspect full 2-Tier Memory state (Transparency & Auditability).
   */
  public inspectMemoryState(): TwoTierMemoryState {
    return JSON.parse(JSON.stringify(this.state)) as TwoTierMemoryState;
  }

  /**
   * Selective Erasure Mode 1: Erase derived AI memory (`rollingSummary` + `structuredProfileFacts`)
   * while preserving the raw recent message transcript window.
   */
  public eraseDerivedMemoryOnly(nowIso: string = new Date().toISOString()): TwoTierMemoryState {
    this.state.messagesSinceLastSummary = 0;
    this.state.rollingSummary = {
      summaryTextVi: '',
      summaryTextEn: '',
      keyClinicalThemes: [],
      recurringTriggers: [],
      distortionPatterns: [],
      effectiveSkills: [],
      summarizedMessageCount: 0,
      refreshCount: 0,
      lastRefreshedIso: null,
    };
    this.state.structuredProfileFacts = {
      coreValues: [],
      trustedSupportPeople: [],
      knownBipolarProdromes: [],
      extractedTriggers: [],
      effectiveSkillsNoted: [],
      lastUpdatedIso: nowIso,
    };
    return this.inspectMemoryState();
  }

  /**
   * Selective Erasure Mode 2: Erase ALL transcripts, sliding window messages, rolling summaries, and profile facts.
   */
  public eraseAllTranscriptsAndMemory(nowIso: string = new Date().toISOString()): TwoTierMemoryState {
    this.eraseDerivedMemoryOnly(nowIso);
    this.state.recentMessages = [];
    this.state.totalMessagesProcessed = 0;
    return this.inspectMemoryState();
  }
}

export function inspectMemoryState(
  target: TwoTierClinicalMemoryManager | TwoTierMemoryState,
): TwoTierMemoryState {
  if (target instanceof TwoTierClinicalMemoryManager) {
    return target.inspectMemoryState();
  }
  return JSON.parse(JSON.stringify(target)) as TwoTierMemoryState;
}

export function eraseDerivedMemoryOnly(
  target: TwoTierClinicalMemoryManager | TwoTierMemoryState,
  nowIso: string = new Date().toISOString(),
): TwoTierMemoryState {
  if (target instanceof TwoTierClinicalMemoryManager) {
    return target.eraseDerivedMemoryOnly(nowIso);
  }
  const copy = inspectMemoryState(target);
  copy.messagesSinceLastSummary = 0;
  copy.rollingSummary = {
    summaryTextVi: '',
    summaryTextEn: '',
    keyClinicalThemes: [],
    recurringTriggers: [],
    distortionPatterns: [],
    effectiveSkills: [],
    summarizedMessageCount: 0,
    refreshCount: 0,
    lastRefreshedIso: null,
  };
  copy.structuredProfileFacts = {
    coreValues: [],
    trustedSupportPeople: [],
    knownBipolarProdromes: [],
    extractedTriggers: [],
    effectiveSkillsNoted: [],
    lastUpdatedIso: nowIso,
  };
  return copy;
}

export function eraseAllTranscriptsAndMemory(
  target: TwoTierClinicalMemoryManager | TwoTierMemoryState,
  nowIso: string = new Date().toISOString(),
): TwoTierMemoryState {
  if (target instanceof TwoTierClinicalMemoryManager) {
    return target.eraseAllTranscriptsAndMemory(nowIso);
  }
  const copy = eraseDerivedMemoryOnly(target, nowIso);
  copy.recentMessages = [];
  copy.totalMessagesProcessed = 0;
  return copy;
}

// ============================================================================
// PART 2: AUDIO "BURST" MULTIMODAL ANALYZER & SPEECH-PACE MANIA DETECTOR
// (Ported from `Andrew-FungKinHo/whynot` & Bipolar Prodrome Spec)
// ============================================================================

export const DEFAULT_BASELINE_WPM = 130;
export const PRESSURED_SPEECH_WPM_SPIKE_THRESHOLD = 0.30; // > 30% increase over personal baseline

export interface MoodPalette5Color {
  dominantEmotion: 'anxiety-panic' | 'depression-melancholy' | 'hypomanic-elation' | 'anger-frustration' | 'calm-grounded';
  hexColors: [string, string, string, string, string];
  valenceScore: number; // -1.0 to +1.0
  arousalScore: number; // 0.0 to 1.0
  paletteNameVi: string;
  paletteNameEn: string;
}

export interface AudioBurstHrvInput {
  value: number;
  timestampIso: string;
  deviceSource: string;
  metricType?: 'SDNN' | 'RMSSD';
}

export interface AudioBurstAnalysisResult {
  wordCount: number;
  durationSeconds: number;
  wpm: number;
  baselineWordsPerMinute: number;
  wpmIncreaseRatio: number;
  wpmSpikePercent: number;
  pressuredSpeechManiaAlert: boolean;
  complaintIntent: 'expressive' | 'instrumental';
  recommendedResponseMode: 'ear-empathy-only' | 'structured-cbt-dbt';
  recommendedTechnique: TechniqueSlug;
  recommendedUiMode: AdaptiveUiThemeMode;
  moodPalette: MoodPalette5Color;
  dominantEmotion: MoodPalette5Color['dominantEmotion'];
  hexColors: [string, string, string, string, string];
  valenceScore: number;
  arousalScore: number;
  hrvContext: HrvBaselineContext;
  hrvEvaluation?: HrvBaselineEvaluation;
  singleSessionHrvComparisonBlocked: true;
  detectedPatterns: {
    negativeDistortions: DetectedPatternMatch[];
    positiveDistortions: DetectedPatternMatch[];
    selfDefeatingBeliefs: DetectedPatternMatch[];
    safetyBehaviors: DetectedPatternMatch[];
  };
  safetyEvaluation: FourLayerSafetyEvaluation;
  responseGuidanceVi: string;
  responseGuidanceEn: string;
}

const EXPRESSIVE_INTENT_PATTERNS: RegExp[] = [
  /(chỉ muốn tâm sự|chỉ muốn xả|chỉ cần người lắng nghe|đừng khuyên|không cần lời khuyên|mệt mỏi quá|buồn quá|tủi thân quá|khóc|cô đơn quá|kiệt sức rồi)/i,
  /\b(just need to vent|just want someone to listen|don't give me advice|no advice please|so exhausted|just venting|feel so alone|overwhelmed and tired|crying)\b/i,
];

const INSTRUMENTAL_INTENT_PATTERNS: RegExp[] = [
  /(làm sao để|cách vượt qua|giúp tôi phân tích|tìm giải pháp|kế hoạch hành động|bài tập cbt|kỹ thuật dbt|sửa suy nghĩ|kiểm tra bằng chứng|lập kế hoạch|phải làm gì)/i,
  /\b(how do i fix|help me solve|what should i do|action plan|challenge this thought|reframe this|cbt exercise|dbt skill|step by step|problem solve)\b/i,
];

/**
 * Analyzes an Audio "Burst" Voice Journal entry:
 * 1. Computes WPM and checks against `baselineWordsPerMinute` (default 130 WPM).
 *    Flags `pressuredSpeechManiaAlert = true` if WPM exceeds baseline by > 30% (logorrhea / pressured speech).
 * 2. Classifies complaint intent into `expressive` (seeking validation & TEAM-CBT EAR empathy)
 *    vs `instrumental` (seeking action, problem-solving, or CBT/DBT restructuring).
 * 3. Generates a rich 5-Color Mood-Palette (`dominantEmotion`, `hexColors`, `valenceScore`, `arousalScore`).
 * 4. Integrates optional Baseline-Relative HRV Context (25th-75th percentile over 14-30 days, < 12h freshness gate,
 *    strictly blocking pre/post single-session HRV comparisons).
 */
export function analyzeAudioBurstJournal(params: {
  transcript: string;
  durationSeconds: number;
  baselineWordsPerMinute?: number;
  recentHrvReadings?: AudioBurstHrvInput[];
  nowIso?: string;
}): AudioBurstAnalysisResult {
  const transcript = (params.transcript ?? '').trim();
  const durationSeconds = Math.max(1, params.durationSeconds);
  const baselineWpm = params.baselineWordsPerMinute ?? DEFAULT_BASELINE_WPM;

  const words = transcript.length > 0 ? transcript.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const wpm = Number(((wordCount / durationSeconds) * 60).toFixed(1));
  const wpmIncreaseRatio = Number(((wpm - baselineWpm) / Math.max(1, baselineWpm)).toFixed(4));
  const wpmSpikePercent = Number((wpmIncreaseRatio * 100).toFixed(1));

  // 1. Speech-Pace Mania Detector (> 30% increase over personal baseline WPM)
  const pressuredSpeechManiaAlert = wpmIncreaseRatio > PRESSURED_SPEECH_WPM_SPIKE_THRESHOLD;

  // 2. Detect Cognitive Distortions & 4-Layer Safety
  const detectedPatterns = analyzeClinicalText(transcript);
  const hasPositiveDistortions = detectedPatterns.positiveDistortions.length > 0;
  const safetyEvaluation = evaluateFourLayerSafety({
    text: transcript,
    moodPolarity: pressuredSpeechManiaAlert || hasPositiveDistortions ? 3 : 0,
  });

  // 3. Classify Complaint Intent: Expressive vs. Instrumental
  const hasExplicitExpressive = EXPRESSIVE_INTENT_PATTERNS.some((rx) => rx.test(transcript));
  const hasExplicitInstrumental = INSTRUMENTAL_INTENT_PATTERNS.some((rx) => rx.test(transcript));

  let complaintIntent: 'expressive' | 'instrumental' = 'expressive';
  if (hasExplicitInstrumental && !hasExplicitExpressive) {
    complaintIntent = 'instrumental';
  } else if (hasExplicitExpressive) {
    complaintIntent = 'expressive';
  } else if (/\?/.test(transcript) || detectedPatterns.negativeDistortions.length >= 2) {
    complaintIntent = 'instrumental';
  }

  // 4. Generate 5-Color Mood-Palette (`Andrew-FungKinHo/whynot` mood visualization)
  let moodPalette: MoodPalette5Color;
  if (pressuredSpeechManiaAlert || hasPositiveDistortions) {
    // Low-Stimulus Warm Amber/Slate palette to calm hypomanic arousal
    moodPalette = {
      dominantEmotion: 'hypomanic-elation',
      hexColors: ['#2C221E', '#5C3D2E', '#B85D19', '#E08E45', '#F4C095'],
      valenceScore: 0.75,
      arousalScore: 0.92,
      paletteNameVi: 'Hổ Phách Trầm Ấm (Hạ Nhiệt Hưng Cảm / Dark Rest)',
      paletteNameEn: 'Low-Stimulus Warm Amber (Hypomania Cool-Down)',
    };
  } else if (
    /(hoảng loạn|sợ hãi|tim đập nhanh|lo âu|khó thở|panic|anxious|terrified|racing heart)/i.test(
      transcript,
    )
  ) {
    moodPalette = {
      dominantEmotion: 'anxiety-panic',
      hexColors: ['#0F2027', '#203A43', '#2C5364', '#4CA1AF', '#C4E0E5'],
      valenceScore: -0.65,
      arousalScore: 0.85,
      paletteNameVi: 'Lam Sâu Hạ Nhịp Thở (Xoa Dịu Lo Âu)',
      paletteNameEn: 'Deep Ocean Paced-Breathing Teal (Anxiety Soothing)',
    };
  } else if (
    /(tức giận|bực bội|phẫn nộ|bất công|ghét|angry|furious|frustrated|unfair|mad)/i.test(
      transcript,
    )
  ) {
    moodPalette = {
      dominantEmotion: 'anger-frustration',
      hexColors: ['#3B1D2E', '#6B2D3E', '#9E4747', '#C86D51', '#E8A598'],
      valenceScore: -0.6,
      arousalScore: 0.8,
      paletteNameVi: 'Đỏ Đất Chuyển Hóa (Hạ Nhiệt Cơn Giận)',
      paletteNameEn: 'Grounded Terracotta Rose (Anger De-escalation)',
    };
  } else if (
    /(buồn|trống rỗng|mệt mỏi|tuyệt vọng|vô dụng|cô đơn|sad|empty|hopeless|exhausted|lonely|depressed)/i.test(
      transcript,
    )
  ) {
    moodPalette = {
      dominantEmotion: 'depression-melancholy',
      hexColors: ['#1F2430', '#353C4B', '#525E75', '#789395', '#B4CFB0'],
      valenceScore: -0.75,
      arousalScore: 0.22,
      paletteNameVi: 'Xanh Rêu Chiều Tĩnh Lặng (Nâng Đỡ Trầm Cảm)',
      paletteNameEn: 'Gentle Dusk & Sage Moss (Low-Energy Compassionate Support)',
    };
  } else {
    moodPalette = {
      dominantEmotion: 'calm-grounded',
      hexColors: ['#1D352D', '#2D5A4C', '#488B76', '#76B89F', '#BCE3D4'],
      valenceScore: 0.25,
      arousalScore: 0.35,
      paletteNameVi: 'Lục Bảo Tâm Trí Tuệ (Cân Bằng & Tĩnh Tại)',
      paletteNameEn: 'Wise Mind Forest Emerald (Balanced & Grounded)',
    };
  }

  // 5. Baseline-Relative HRV Evaluation (25th-75th percentile over 14-30 days, < 12h freshness gate)
  let hrvContext: HrvBaselineContext = 'insufficient-baseline-data';
  let hrvEvaluation: HrvBaselineEvaluation | undefined;
  if (params.recentHrvReadings && params.recentHrvReadings.length > 0) {
    const mappedSamples: HrvReadingSample[] = params.recentHrvReadings
      .map((r) => ({
        timestamp: r.timestampIso,
        valueMs: r.value,
        metricType: r.metricType ?? ('RMSSD' as const),
        deviceId: r.deviceSource,
      }))
      .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));

    const latestReading = mappedSamples[mappedSamples.length - 1]!;
    const nowIso = params.nowIso ?? latestReading.timestamp;
    hrvEvaluation = evaluateBaselineRelativeHrv({
      latestReading,
      historicalReadings: mappedSamples,
      nowIso,
    });
    hrvContext = hrvEvaluation.context;
  }

  // 6. Routing & Clinical Guidance
  let recommendedTechnique: TechniqueSlug =
    complaintIntent === 'expressive' ? 'wise-mind' : 'thought-record';
  let recommendedUiMode: AdaptiveUiThemeMode = 'standard';

  if (!safetyEvaluation.safeToProceedWithCbt) {
    recommendedTechnique = safetyEvaluation.recommendedTechnique ?? 'tipp';
    recommendedUiMode = 'sos-crisis';
  } else if (pressuredSpeechManiaAlert || hasPositiveDistortions) {
    recommendedTechnique = 'hypomania-guard';
    recommendedUiMode = 'low-stimulus-mania';
  } else if (moodPalette.dominantEmotion === 'anxiety-panic' && moodPalette.arousalScore >= 0.8) {
    recommendedTechnique = 'tipp';
  } else if (moodPalette.dominantEmotion === 'depression-melancholy') {
    recommendedTechnique = 'behavioral-activation';
    recommendedUiMode = 'low-energy-depression';
  }

  const recommendedResponseMode =
    complaintIntent === 'expressive' ? 'ear-empathy-only' : 'structured-cbt-dbt';

  const responseGuidanceVi = pressuredSpeechManiaAlert
    ? `Cảnh báo Tốc độ Nói Tăng vọt (Pressured Speech: ${wpm} WPM, tăng +${wpmSpikePercent}% so với ngưỡng cá nhân ${baselineWpm} WPM): Dấu hiệu tiền triệu Hưng cảm (logorrhea). Đã chuyển giao diện sang Low-Stimulus Dark Rest và kích hoạt lá chắn Hypomania Guard / Khoang Trì hoãn 48 Giờ.`
    : complaintIntent === 'expressive'
      ? `Phân loại Audio Burst: Tâm sự Giải tỏa (Expressive Complaint - ${wpm} WPM). Hệ thống giữ nguyên chế độ Lắng nghe Thấu cảm (5 Bí quyết EAR), tuyệt đối không ép phân tích hay sửa suy nghĩ lúc này.`
      : `Phân loại Audio Burst: Tìm kiếm Giải pháp (Instrumental Complaint - ${wpm} WPM). Đề xuất bước vào giao thức ${recommendedTechnique} để bóc tách suy nghĩ và lập kế hoạch hành động nhỏ.`;

  const responseGuidanceEn = pressuredSpeechManiaAlert
    ? `Pressured Speech Mania Alert (${wpm} WPM, +${wpmSpikePercent}% above personal baseline ${baselineWpm} WPM): Early hypomanic logorrhea signal detected. Switching to Low-Stimulus Dark Rest UI and activating Hypomania Guard / 48-Hour Impulse Vault.`
    : complaintIntent === 'expressive'
      ? `Audio Burst Intent: Expressive Venting (${wpm} WPM). Responding strictly with TEAM-CBT EAR Empathy and validation without unsolicited problem-solving.`
      : `Audio Burst Intent: Instrumental Problem-Solving (${wpm} WPM). Recommending structured ${recommendedTechnique} protocol.`;

  return {
    wordCount,
    durationSeconds,
    wpm,
    baselineWordsPerMinute: baselineWpm,
    wpmIncreaseRatio,
    wpmSpikePercent,
    pressuredSpeechManiaAlert,
    complaintIntent,
    recommendedResponseMode,
    recommendedTechnique,
    recommendedUiMode,
    moodPalette,
    dominantEmotion: moodPalette.dominantEmotion,
    hexColors: moodPalette.hexColors,
    valenceScore: moodPalette.valenceScore,
    arousalScore: moodPalette.arousalScore,
    hrvContext,
    hrvEvaluation,
    singleSessionHrvComparisonBlocked: true,
    detectedPatterns,
    safetyEvaluation,
    responseGuidanceVi,
    responseGuidanceEn,
  };
}
