import {
  detectChainAnalysisHardStopOrShame,
  detectCognitiveDistortions,
  detectHarshSelfCriticDisguisedAsLogic,
  generateMoodPaletteFromText,
} from './detectors.ts';
import type {
  AffectFamily,
  IntensityScore,
  MoodPole,
  PushbackLevel,
  PushbackZone,
  SessionOutcome,
  SessionPhase0Mode,
  TechniqueSlug,
  VoiceBurstEntry,
} from './types.ts';

/**
 * 3. DBT-First, CBT-Second Interactive Session Player Engine
 * - Phase 0: Expressive Mode (Venting / Empathy EAR) vs Instrumental Mode (CBT/DBT Skill) + Voice Burst Recorder
 * - Live Socratic Pushback level switcher mid-session ('off', 'gentle', 'moderate', 'firm' + 'softer' / 'harder' buttons)
 * - 7 Guided Interactive Protocols:
 *   1. CBT 7-Step Thought Record (with silent distortion detector, 5-family Affect Labeling, and Accuracy Check between steps 5 & 6)
 *   2. CBT Behavioral Activation 6-Step (Step 0 prediction-error follow-up, Mandatory Rest Check, Confidence >= 7/10 scaling, M/P rating, If-Then barrier)
 *   3. TEAM-CBT Paradoxical Agenda Setting (Magic Button, Positive Reframing, Magic Dial + Externalization of Voices & Double Standard)
 *   4. DBT Opposite Action (4 steps with Justified Check dialectical pivot)
 *   5. DBT Wise Mind (6 steps with Harsh Self-Critic Guard and "Nothing yet" valid outcome)
 *   6. DBT Chain Analysis (6 steps + Missing-Links with Hard Stops for self-harm/victimization and Shame Protocol)
 *   7. DBT DEAR MAN + TEAM-CBT EAR Communication Script Builder with interactive AI Roleplay Rehearsal ('harder'/'softer' resistance)
 */

const PUSHBACK_ORDER: PushbackLevel[] = ['off', 'gentle', 'moderate', 'firm'];

export function adjustPushbackLevel(
  current: PushbackLevel,
  command: 'softer' | 'harder' | PushbackLevel
): PushbackLevel {
  if (command !== 'softer' && command !== 'harder') {
    return command;
  }
  const idx = PUSHBACK_ORDER.indexOf(current);
  if (command === 'softer') {
    return PUSHBACK_ORDER[Math.max(0, idx - 1)] ?? 'off';
  }
  return PUSHBACK_ORDER[Math.min(PUSHBACK_ORDER.length - 1, idx + 1)] ?? 'firm';
}

export function getMaxPushbackAttemptsForZone(level: PushbackLevel, zone: PushbackZone): number {
  if (zone === 'None' || zone === 'Closing' || level === 'off') {
    return 0;
  }
  if (zone === 'Supportive') {
    return 1; // Supportive zone never pushes more than once regardless of level
  }
  // Core zone:
  switch (level) {
    case 'gentle':
      return 1;
    case 'moderate':
      return 2;
    case 'firm':
      return 3;
  }
}

export function generateSocraticPushbackPrompt(params: {
  level: PushbackLevel;
  zone: PushbackZone;
  attemptNumber: number; // 1, 2, or 3
  stepTitleVi: string;
  stepTitleEn: string;
}): { shouldHoldStep: boolean; promptVi: string; promptEn: string } {
  const maxAttempts = getMaxPushbackAttemptsForZone(params.level, params.zone);
  if (params.attemptNumber > maxAttempts) {
    return {
      shouldHoldStep: false,
      promptVi: 'Chúng ta tôn trọng lựa chọn bỏ qua bước này của bạn và chuyển sang bước tiếp theo.',
      promptEn: 'Respecting your choice to skip this step and moving forward.',
    };
  }

  if (params.attemptNumber === 1) {
    const tonePrefix =
      params.level === 'gentle'
        ? '🌿 Gợi mở nhẹ nhàng: '
        : params.level === 'firm'
          ? '🔍 Thử thách góc nhìn: '
          : '💡 Gợi mở suy nghĩ: ';
    return {
      shouldHoldStep: true,
      promptVi: `${tonePrefix}"${params.stepTitleVi}" thường mang lại sự nhẹ nhõm và chuyển hóa lớn nhất. Bạn có muốn thử tìm 1 ý nhỏ trước khi bỏ qua không? (Hoặc bấm "Dịu dàng" để chuyển tiếp)`,
      promptEn: `[Socratic Pushback — ${params.level.toUpperCase()} #1] "${params.stepTitleEn}" often unlocks the biggest shift. Would you be willing to try finding just one small point before skipping?`,
    };
  }

  if (params.attemptNumber === 2) {
    return {
      shouldHoldStep: true,
      promptVi: `🌿 Gợi mở từ lòng trắc ẩn: Nếu một người bạn thân thiết nhất đang ở đúng hoàn cảnh của bạn lúc này, bạn sẽ nói gì để an ủi và khuyên họ ở bước "${params.stepTitleVi}"?`,
      promptEn: `[Socratic Pushback — ${params.level.toUpperCase()} #2 / Double-Standard] If your closest friend were in this exact situation right now, what would you tell them for "${params.stepTitleEn}"?`,
    };
  }

  return {
    shouldHoldStep: true,
    promptVi: `🌿 Lắng nghe cảm xúc: Điều gì khiến việc ngồi lại với bước "${params.stepTitleVi}" trở nên khó khăn hoặc nặng nề với bạn ngay lúc này? Bạn hoàn toàn có thể tạm nghỉ ngơi nếu chưa sẵn sàng.`,
    promptEn: `[Socratic Pushback — FIRM #3 / TEAM-CBT Resistance Inquiry] What makes sitting with "${params.stepTitleEn}" feel difficult or heavy for you right now?`,
  };
}

/**
 * DBT-First, CBT-Second Clinical Router based on Arousal / SUDS & Mood Polarity
 */
export function routeDbtFirstCbtSecond(params: {
  distressIntensity: IntensityScore;
  moodPolarity: MoodPole;
  energyLevel?: MoodPole;
  hasInterpersonalConflict?: boolean;
  hasRegrettedImpulse?: boolean;
}): {
  tier: '1-DBT-Distress-Tolerance' | '2-DBT-Emotion-Regulation' | '3-CBT-TEAM-Core';
  recommendedTechnique: TechniqueSlug;
  rationaleVi: string;
  rationaleEn: string;
} {
  const isMixed = params.moodPolarity <= -2 && (params.energyLevel ?? 0) >= 2;
  if (params.distressIntensity >= 8 || isMixed) {
    return {
      tier: '1-DBT-Distress-Tolerance',
      recommendedTechnique: 'tipp',
      rationaleVi:
        'Vùng Đỏ (Intensity >= 8/10 hoặc Pha Hỗn hợp): Hệ thần kinh giao cảm đang ngập lụt. Ưu tiên DBT TIPP để hạ nhiệt sinh lý trước khi làm bất kỳ bài tập CBT nào.',
      rationaleEn:
        'Red Zone (Intensity >= 8/10 or Mixed State): Autonomic flooding detected. Routing to DBT TIPP physiological down-regulation before cognitive work.',
    };
  }

  if (params.distressIntensity >= 5 && params.hasInterpersonalConflict) {
    return {
      tier: '2-DBT-Emotion-Regulation',
      recommendedTechnique: 'dear-man',
      rationaleVi: 'Vùng Cam (Xung đột giao tiếp / Ranh giới): Đề xuất DBT DEAR MAN kết hợp 5 Bí quyết EAR.',
      rationaleEn: 'Orange Zone (Interpersonal conflict / boundaries): Recommending DBT DEAR MAN + TEAM-CBT EAR.',
    };
  }

  if (params.hasRegrettedImpulse) {
    return {
      tier: '2-DBT-Emotion-Regulation',
      recommendedTechnique: 'chain-analysis',
      rationaleVi: 'Vùng Cam (Giải phẫu hành vi bốc đồng/trì hoãn): Đề xuất DBT Chain Analysis (Tò mò, không đổ lỗi).',
      rationaleEn: 'Orange Zone (Unpacking a regretted behavior/miss): Recommending DBT Chain Analysis.',
    };
  }

  if (params.distressIntensity >= 6) {
    return {
      tier: '2-DBT-Emotion-Regulation',
      recommendedTechnique: 'opposite-action',
      rationaleVi:
        'Vùng Cam (Intensity 6-7/10): Cảm xúc đang đi kèm thôi thúc hành động mạnh. Đề xuất DBT Opposite Action hoặc Wise Mind.',
      rationaleEn:
        'Orange Zone (Intensity 6-7/10): Strong emotional action urge present. Recommending DBT Opposite Action or Wise Mind.',
    };
  }

  if (params.moodPolarity <= -2) {
    return {
      tier: '3-CBT-TEAM-Core',
      recommendedTechnique: 'behavioral-activation',
      rationaleVi:
        'Vùng Xanh/Vàng kèm Khí sắc trầm: Đề xuất Kích hoạt Hành vi 6 Bước (Behavioral Activation có cổng Rest Check).',
      rationaleEn:
        'Depressed mood polarity with reflective capacity: Recommending 6-Step Behavioral Activation (with Rest Check gate).',
    };
  }

  return {
    tier: '3-CBT-TEAM-Core',
    recommendedTechnique: 'thought-record',
    rationaleVi:
      'Vùng Xanh/Vàng (Intensity <= 5/10): Tâm trí đủ tĩnh để phản tư. Đề xuất Nhật ký Suy nghĩ 7 Bước (CBT Thought Record có Accuracy Check).',
    rationaleEn:
      'Green/Yellow Zone (Intensity <= 5/10): Prefrontal cortex ready for reflection. Recommending CBT 7-Step Thought Record.',
  };
}

/**
 * Phase 0: Voice Burst & Expressive (EAR Empathy) vs Instrumental Processor
 */
export function processVoiceBurstAndPhase0(params: {
  transcript: string;
  durationSeconds: number;
  selectedMode?: SessionPhase0Mode;
}): VoiceBurstEntry {
  const { palette, detectedIntensity, suggestedTechnique } = generateMoodPaletteFromText(params.transcript);
  const mode: SessionPhase0Mode =
    params.selectedMode ??
    (/(chỉ muốn tâm sự|lắng nghe tôi|xả stress|just need to vent|just listen)/i.test(params.transcript)
      ? 'expressive'
      : 'instrumental');

  return {
    id: `vb-${Date.now()}`,
    recordedAt: new Date().toISOString(),
    durationSeconds: params.durationSeconds,
    transcript: params.transcript,
    detectedMode: mode,
    detectedDistressIntensity: detectedIntensity,
    moodPalette: palette,
    earEmpathyReplyVi:
      'Mình nghe rất rõ sự nặng nề và áp lực trong từng lời bạn vừa chia sẻ. Hoàn toàn dễ hiểu khi bạn cảm thấy như vậy trước những gì đang diễn ra. Bạn không hề đơn độc — ở chế độ lắng nghe thấu cảm, mình luôn ở đây để đồng hành và chia sẻ cùng bạn.',
    earEmpathyReplyEn:
      '[TEAM-CBT EAR Empathy — Disarming + Feeling/Thought Empathy + Affirmation] I hear the weight and exhaustion in what you just shared. It makes complete sense that you feel this way given what you are carrying. In Expressive Mode, I am here simply to listen and validate without rushing to fix.',
    suggestedTechnique,
  };
}

/**
 * Protocol 1: CBT 7-Step Thought Record with Accuracy Check between Step 5 & Step 6
 */
export interface ThoughtRecordAccuracyCheckResult {
  isThoughtObjectivelyTrue: boolean;
  pushbackLevelForcedTo: 'off';
  outcome: SessionOutcome;
  selectedBranch: 'problem-solving' | 'coping-self-care' | 'split-fact-from-overgeneralization' | 'continue-to-step6-balanced-thought';
  coachingVi: string;
  coachingEn: string;
}

export function evaluateThoughtRecordAccuracyCheck(params: {
  automaticThought: string;
  isObjectivelyTrueFact: boolean;
  preferredBranch?: 'problem-solving' | 'coping-self-care' | 'split-fact-from-overgeneralization';
}): ThoughtRecordAccuracyCheckResult {
  if (params.isObjectivelyTrueFact) {
    const branch = params.preferredBranch ?? 'problem-solving';
    return {
      isThoughtObjectivelyTrue: true,
      pushbackLevelForcedTo: 'off',
      outcome: 'accurate-thought-exit',
      selectedBranch: branch,
      coachingVi:
        'Ghi nhận sự thật khách quan: Suy nghĩ của bạn phản ánh một thực tế hoặc mất mát có thật. Haven sẽ không ép bạn phải tìm suy nghĩ tích cực giả tạo, mà tôn trọng trọn vẹn cảm xúc của bạn và đồng hành cùng bạn tìm hướng giải quyết thực tế hoặc vỗ về, xoa dịu bản thân.',
      coachingEn:
        'ACCURACY CHECK GATE (Pushback OFF — Zero Toxic Positivity): Your thought reflects an objective reality or real loss. We immediately STOP cognitive restructuring to honor your valid pain, pivoting to Practical Problem-Solving, Self-Compassion Coping, or Splitting the true event from global self-labeling.',
    };
  }

  return {
    isThoughtObjectivelyTrue: false,
    pushbackLevelForcedTo: 'off',
    outcome: 'completed',
    selectedBranch: 'continue-to-step6-balanced-thought',
    coachingVi:
      'Nhận diện góc nhìn mới: Suy nghĩ ban đầu có thể đang bị phóng đại bởi cảm xúc. Hãy chuyển sang Bước 6: Viết Suy nghĩ Cân bằng (kết hợp cả dữ kiện thực tế và góc nhìn rộng mở hơn).',
    coachingEn:
      'The automatic thought contains modifiable cognitive distortions. Proceed to Step 6: Craft a Balanced Dialectical Thought ("It is true that [Evidence For], AND it is also true that [Evidence Against]").',
  };
}

export function evaluateThoughtRecordComplete(params: {
  situation: string;
  automaticThought: string;
  affectFamily: AffectFamily;
  preIntensity: IntensityScore;
  evidenceFor: string;
  evidenceAgainst: string;
  isObjectivelyTrueFact: boolean;
  balancedThought?: string;
  postIntensity: IntensityScore;
}): {
  distortions: ReturnType<typeof detectCognitiveDistortions>;
  accuracyCheck: ThoughtRecordAccuracyCheckResult;
  intensityDelta: number;
  recommendGroundingBeforeClose: boolean;
  outcome: SessionOutcome;
} {
  const distortions = detectCognitiveDistortions(params.automaticThought);
  const accuracyCheck = evaluateThoughtRecordAccuracyCheck({
    automaticThought: params.automaticThought,
    isObjectivelyTrueFact: params.isObjectivelyTrueFact,
  });
  const intensityDelta = params.postIntensity - params.preIntensity;
  const recommendGroundingBeforeClose = intensityDelta >= 3;

  return {
    distortions,
    accuracyCheck,
    intensityDelta,
    recommendGroundingBeforeClose,
    outcome: accuracyCheck.isThoughtObjectivelyTrue ? 'accurate-thought-exit' : 'completed',
  };
}

/**
 * Protocol 2: CBT Behavioral Activation 6-Step
 * - Step 0: Prediction-error follow-up
 * - Step 2: Mandatory Rest Check (guilt-free rest -> outcome: 'justified-exit')
 * - Step 4: Confidence >= 7/10 scaling
 * - Step 5 & 6: Mastery & Pleasure (M/P) rating + If-Then barrier
 */
export interface BehavioralActivationEvaluation {
  predictionErrorInsightVi?: string;
  predictionErrorInsightEn?: string;
  restCheckTriggered: boolean;
  guiltFreeRestWindow?: { startTime: string; endTime: string };
  confidencePassed: boolean;
  requireMicroShrinkPromptVi?: string;
  requireMicroShrinkPromptEn?: string;
  outcome: SessionOutcome;
  ifThenPlan: string;
}

export function evaluateBehavioralActivation(params: {
  lastPlanPredictedEnjoyment?: number;
  lastPlanActualEnjoyment?: number;
  lastPlanPredictedMastery?: number;
  lastPlanActualMastery?: number;
  needsBiologicalRest: boolean; // Step 2 Rest Check
  restStartTime?: string;
  restEndTime?: string;
  chosenActivity: string;
  confidenceScore: number; // 0-10 (Must be >= 7)
  predictedPleasure: number; // 0-10
  predictedMastery: number; // 0-10
  obstacle: string;
  twoMinuteFallback: string;
}): BehavioralActivationEvaluation {
  let predictionErrorInsightVi: string | undefined;
  let predictionErrorInsightEn: string | undefined;

  if (
    typeof params.lastPlanPredictedEnjoyment === 'number' &&
    typeof params.lastPlanActualEnjoyment === 'number'
  ) {
    const diff = params.lastPlanActualEnjoyment - params.lastPlanPredictedEnjoyment;
    predictionErrorInsightVi = `🌱 Kinh nghiệm từ lần trước: Phiên trước bạn dự đoán Niềm vui chỉ là ${params.lastPlanPredictedEnjoyment}/10 nhưng thực tế khi bắt tay làm lại đạt ${params.lastPlanActualEnjoyment}/10 (chênh lệch +${diff}). Khi tâm trạng xuống thấp, não bộ thường đánh lừa rằng làm gì cũng sẽ mệt mỏi, nhưng thực tế thường dễ chịu hơn nhiều.`;
    predictionErrorInsightEn = `Step 0 (Prediction-Error Correction): Last time you predicted Enjoyment at ${params.lastPlanPredictedEnjoyment}/10, but actually experienced ${params.lastPlanActualEnjoyment}/10 (${diff >= 0 ? '+' : ''}${diff}). Depression systematically under-predicts reward.`;
  }

  // Mandatory Step 2: Rest Check (Pushback always OFF)
  if (params.needsBiologicalRest) {
    const start = params.restStartTime ?? '20:00';
    const end = params.restEndTime ?? '22:00';
    return {
      predictionErrorInsightVi,
      predictionErrorInsightEn,
      restCheckTriggered: true,
      guiltFreeRestWindow: { startTime: start, endTime: end },
      confidencePassed: true,
      outcome: 'justified-exit',
      ifThenPlan: `Nghỉ ngơi trọn vẹn và không áy náy từ ${start} đến ${end}. Bạn xứng đáng được nghỉ ngơi để nạp lại năng lượng.`,
    };
  }

  // Step 4: Confidence >= 7/10 Scaling Gate
  if (params.confidenceScore < 7) {
    return {
      predictionErrorInsightVi,
      predictionErrorInsightEn,
      restCheckTriggered: false,
      confidencePassed: false,
      requireMicroShrinkPromptVi: `Điểm tự tin hiện tại là ${params.confidenceScore}/10 (dưới mức khuyến nghị 7/10). Lời khuyên: Hãy thu nhỏ hoạt động "${params.chosenActivity}" xuống phiên bản siêu ngắn chỉ 2–5 phút (ví dụ: chỉ dọn 1 góc bàn nhỏ hoặc bước ra hiên hít thở 2 phút) để bạn cảm thấy nhẹ nhàng và sẵn sàng bắt đầu.`,
      requireMicroShrinkPromptEn: `Confidence is ${params.confidenceScore}/10 (< 7/10). Clinical Rule: Let's shrink "${params.chosenActivity}" into a 2–5 minute micro-step until your confidence reaches at least 7/10.`,
      outcome: 'stopped-early',
      ifThenPlan: '',
    };
  }

  const ifThenPlan = `Nếu tới giờ thực hiện mà "${params.obstacle}" xuất hiện, THÌ tôi sẽ chỉ thực hiện phiên bản 2 phút: "${params.twoMinuteFallback}" rồi được phép dừng.`;

  return {
    predictionErrorInsightVi,
    predictionErrorInsightEn,
    restCheckTriggered: false,
    confidencePassed: true,
    outcome: 'completed',
    ifThenPlan,
  };
}

/**
 * Protocol 3: TEAM-CBT Paradoxical Agenda Setting (David Burns)
 * - Magic Button, Positive Reframing, Magic Dial + Externalization of Voices & Double Standard
 */
export interface ParadoxicalAgendaSettingState {
  symptomTarget: 'anxiety' | 'depression' | 'guilt' | 'perfectionism' | 'anger';
  wouldPressMagicButton: boolean;
  positiveBenefitsOfSymptom: string[]; // What values/beauty does the symptom show?
  coreValuesRevealed: string[];
  initialIntensityPercent: number; // e.g. 85%
  magicDialTargetPercent: number;  // e.g. 25% (realistic rather than forcing 0%)
  externalizedCriticAttack: string;
  selfDefenseAndAcceptanceReply: string;
  doubleStandardCompassionateFriendReply: string;
}

export function evaluateParadoxicalAgendaSetting(state: ParadoxicalAgendaSettingState): {
  outcomeResistanceMelted: boolean;
  summaryVi: string;
  summaryEn: string;
} {
  const safeTarget = Math.max(10, Math.min(state.initialIntensityPercent, state.magicDialTargetPercent));
  const symptomMap: Record<string, string> = {
    anxiety: 'lo âu',
    depression: 'trầm buồn',
    guilt: 'áy náy',
    perfectionism: 'cầu toàn',
    anger: 'tức giận',
  };
  const symptomVi = symptomMap[state.symptomTarget] || state.symptomTarget;
  return {
    outcomeResistanceMelted: state.positiveBenefitsOfSymptom.length >= 1,
    summaryVi: `Khám phá giá trị tích cực đằng sau cảm giác ${symptomVi}: Cảm giác này cho thấy bạn là người có những phẩm chất đáng quý (${state.coreValuesRevealed.join(', ') || 'tinh thần trách nhiệm, sự tận tâm'}). Thay vì cố gắng dập tắt hoàn toàn về 0% một cách gượng ép, chúng ta chỉ cần hạ bớt mức căng thẳng từ ${state.initialIntensityPercent}% xuống khoảng ${safeTarget}% để giữ lại sự cẩn thận mà không làm cơ thể kiệt sức.`,
    summaryEn: `TEAM-CBT Paradoxical Agenda Setting: Your "${state.symptomTarget}" reflects beautiful core values (${state.coreValuesRevealed.join(', ') || 'care, high standards'}). Rather than forcing it to 0% with the Magic Button, we set the Magic Dial from ${state.initialIntensityPercent}% down to a healthy ${safeTarget}%.`,
  };
}

/**
 * Protocol 4: DBT Opposite Action (4 Steps with Justified Check Dialectical Pivot)
 */
export function evaluateOppositeAction(params: {
  emotion: AffectFamily;
  actionUrge: string;
  isRealWorldDangerPresent: boolean;
  doesUrgeFitObjectiveFacts: boolean;
  oppositeActionPlan: string;
}): {
  outcome: SessionOutcome;
  pushbackOff: boolean;
  directiveVi: string;
  directiveEn: string;
} {
  if (params.isRealWorldDangerPresent) {
    return {
      outcome: 'justified-exit',
      pushbackOff: true,
      directiveVi:
        'Bảo vệ an toàn là trên hết: Tình huống có mối đe dọa thực tế. Cảm giác sợ hãi và mong muốn rút lui/bảo vệ bản thân là hoàn toàn chính đáng. Đừng ép mình làm ngược lại — hãy ưu tiên sự an toàn của bạn.',
      directiveEn:
        'JUSTIFIED CHECK GATE (Real Danger — Pushback OFF): Objective danger is present. Your fear and urge to withdraw/protect yourself are 100% justified. Do NOT act opposite — prioritize safety.',
    };
  }

  if (params.doesUrgeFitObjectiveFacts) {
    return {
      outcome: 'justified-exit',
      pushbackOff: true,
      directiveVi:
        'Thôi thúc hành động phù hợp với thực tế khách quan. Hãy tiến hành các bước giải quyết vấn đề một cách khéo léo và bình tĩnh.',
      directiveEn:
        'Your action urge fits the objective facts. Proceed with Skillful Action and problem-solving.',
    };
  }

  return {
    outcome: 'completed',
    pushbackOff: false,
    directiveVi: `Hành động đối lập giúp đổi hướng cảm xúc: Cảm xúc "${params.emotion}" đang thôi thúc bạn "${params.actionUrge}", nhưng điều đó sẽ khiến bạn càng thêm mệt mỏi. Trong 15 phút tới, hãy thử làm ngược lại một cách trọn vẹn (thả lỏng nét mặt, ngồi thẳng lưng và bắt đầu): "${params.oppositeActionPlan}".`,
    directiveEn: `Step 4 — Act Opposite All The Way: "${params.emotion}" is urging you to "${params.actionUrge}". For the next 15 minutes, commit 100% (posture, facial expression, and behavior) to the opposite action: "${params.oppositeActionPlan}".`,
  };
}

/**
 * Protocol 5: DBT Wise Mind (6 Steps with Harsh Self-Critic Guard & "Nothing yet" valid outcome)
 */
export type WiseMindResolutionType = 'clear-decision' | 'small-experiment' | 'nothing-yet';

export function evaluateWiseMindProtocol(params: {
  dilemmaQuestion: string;
  emotionMindVoice: string;
  reasonableMindVoice: string;
  breathingPauseCompleted: boolean;
  resolutionType: WiseMindResolutionType;
  wiseMindSynthesisText: string;
  nextStepOrRevisitTime: string;
}): {
  criticGuard: ReturnType<typeof detectHarshSelfCriticDisguisedAsLogic>;
  isMedicationDisclaimerShown: boolean;
  isValidOutcome: true;
  outcome: SessionOutcome;
  closingSummaryVi: string;
  closingSummaryEn: string;
} {
  const criticGuard = detectHarshSelfCriticDisguisedAsLogic(params.reasonableMindVoice);
  const isMedQuestion = /(thuốc|lithium|lamotrigine|valproate|quetiapine|medication|dose|liều)/i.test(
    params.dilemmaQuestion
  );

  const resolutionVi =
    params.resolutionType === 'nothing-yet'
      ? 'Kết quả hợp lệ: "Chưa cần quyết định ngay lúc này" — Tâm trí sáng suốt không bao giờ bị thúc ép phải có câu trả lời ngay. Hãy cho phép mình nghỉ ngơi và xem lại vào: ' +
        params.nextStepOrRevisitTime
      : `Kết luận từ Tâm Trí Tuệ: ${params.wiseMindSynthesisText} -> Bước tiếp theo: ${params.nextStepOrRevisitTime}`;

  const resolutionEn =
    params.resolutionType === 'nothing-yet'
      ? 'Valid Wise Mind Outcome: "Nothing yet" — Wise Mind cannot be forced on a schedule. We will revisit at: ' +
        params.nextStepOrRevisitTime
      : `Wise Mind Synthesis (${params.resolutionType}): ${params.wiseMindSynthesisText} -> Next step: ${params.nextStepOrRevisitTime}`;

  return {
    criticGuard,
    isMedicationDisclaimerShown: isMedQuestion,
    isValidOutcome: true,
    outcome: 'completed',
    closingSummaryVi: resolutionVi,
    closingSummaryEn: resolutionEn,
  };
}

/**
 * Protocol 6: DBT Chain Analysis (6 Steps + Missing-Links with Hard Stops & Shame Protocol)
 */
export type ChainLinkCategory = 'thought' | 'feeling' | 'body sensation' | 'action' | 'external' | 'missing-link';

export interface ChainAnalysisLink {
  category: ChainLinkCategory;
  description: string;
  replacementSkill?: string;
}

export function evaluateChainAnalysisProtocol(params: {
  targetBehavior: string;
  promptingEvent: string;
  pleaseVulnerabilities: string[];
  links: ChainAnalysisLink[];
  shortTermReliefPros: string;
  longTermCosts: string;
  preventionPlan: string;
  healthyRepairStep: string;
}): {
  safetyAndShameCheck: ReturnType<typeof detectChainAnalysisHardStopOrShame>;
  pushbackForcedOff: boolean;
  outcome: SessionOutcome;
  summaryVi: string;
  summaryEn: string;
} {
  const combinedText = `${params.targetBehavior} ${params.promptingEvent} ${params.links.map((l) => l.description).join(' ')}`;
  const safetyAndShameCheck = detectChainAnalysisHardStopOrShame(combinedText);

  if (safetyAndShameCheck.hardStopSelfHarm) {
    return {
      safetyAndShameCheck,
      pushbackForcedOff: true,
      outcome: 'safety-stop',
      summaryVi: safetyAndShameCheck.responseVi,
      summaryEn: safetyAndShameCheck.responseEn,
    };
  }

  if (safetyAndShameCheck.hardStopVictimization) {
    return {
      safetyAndShameCheck,
      pushbackForcedOff: true,
      outcome: 'justified-exit',
      summaryVi: safetyAndShameCheck.responseVi,
      summaryEn: safetyAndShameCheck.responseEn,
    };
  }

  return {
    safetyAndShameCheck,
    pushbackForcedOff: safetyAndShameCheck.shameProtocolTriggered,
    outcome: 'completed',
    summaryVi: `Đã nhận diện chuỗi ${params.links.length} mắt xích với tinh thần thấu hiểu, không phán xét. Kế hoạch chăm sóc cơ thể: "${params.preventionPlan}". Bước hàn gắn nhẹ nhàng: "${params.healthyRepairStep}".`,
    summaryEn: `Completed ${params.links.length}-link Chain Analysis with Curiosity, Not Blame. PLEASE Prevention: "${params.preventionPlan}". Healthy Repair: "${params.healthyRepairStep}".`,
  };
}

/**
 * Protocol 7: DBT DEAR MAN + TEAM-CBT EAR Communication Script Builder & AI Roleplay Rehearsal
 */
export interface DearManScriptInput {
  partnerIsAbusiveOrViolent: boolean;
  theAskOrSayNo: string;
  priority: 'objective-goal' | 'relationship-give' | 'self-respect-fast';
  describeCameraFacts: string;
  expressIFeel: string;
  assertClearAsk: string;
  reinforceBenefit: string;
  mindfulBrokenRecordPhrase: string;
  negotiateTurnTheTables: string;
}

export interface DearManRoleplayFeedback {
  safeToRoleplay: boolean;
  outcome: SessionOutcome;
  assembledScript: string;
  warningsVi: string[];
  warningsEn: string[];
  roleplayPartnerReplyVi: string;
  roleplayPartnerReplyEn: string;
  coachingStrengthVi: string;
  coachingStrengthEn: string;
  coachingTweakVi: string;
  coachingTweakEn: string;
}

export function buildDearManScriptAndRoleplay(
  input: DearManScriptInput,
  roleplayResistance: 'softer' | 'moderate' | 'harder' = 'moderate'
): DearManRoleplayFeedback {
  if (input.partnerIsAbusiveOrViolent) {
    return {
      safeToRoleplay: false,
      outcome: 'justified-exit',
      assembledScript: '',
      warningsVi: [
        'CỔNG AN TOÀN QUAN HỆ: Đối phương có hành vi bạo hành/đe dọa. Tuyệt đối KHÔNG dùng kịch bản thương lượng DEAR MAN khi sự an toàn thể chất bị đe dọa. Chuyển sang kế hoạch bảo vệ an toàn.',
      ],
      warningsEn: [
        'RELATIONSHIP SAFETY GATE: Partner is abusive or violent. Do NOT use DEAR MAN negotiation when physical safety is at risk. Prioritize safety planning.',
      ],
      roleplayPartnerReplyVi: '',
      roleplayPartnerReplyEn: '',
      coachingStrengthVi: '',
      coachingStrengthEn: '',
      coachingTweakVi: '',
      coachingTweakEn: '',
    };
  }

  const warningsVi: string[] = [];
  const warningsEn: string[] = [];

  if (/(luôn luôn|không bao giờ|\balways\b|\bnever\b)/i.test(input.describeCameraFacts)) {
    warningsVi.push('Gợi ý bước D (Describe): Lọc bỏ từ quy chụp "luôn luôn / không bao giờ" để chỉ nêu dữ kiện máy quay ghi lại.');
    warningsEn.push('Tip for D (Describe): Replace "always / never" with specific camera-verifiable facts.');
  }

  if (/(bạn làm tôi|tại bạn mà|you make me feel|because of you)/i.test(input.expressIFeel)) {
    warningsVi.push('Gợi ý bước E (Express): Đổi từ "Bạn làm tôi..." sang câu chủ ngữ "Tôi cảm thấy..." để giảm phòng vệ.');
    warningsEn.push('Tip for E (Express): Shift from "You make me feel..." to an "I feel..." statement.');
  }

  if (/(xin lỗi làm phiền|không biết có được không|sorry to bother|i'm terrible for asking)/i.test(input.assertClearAsk)) {
    warningsVi.push('Gợi ý bước A (Assert): Bỏ lời rào đón xin lỗi quá mức ở đầu câu — yêu cầu của bạn hoàn toàn chính đáng.');
    warningsEn.push('Tip for A (Assert): Drop over-apologizing before your ask — your boundary is legitimate.');
  }

  const assembledScript = `${input.describeCameraFacts.trim()} ${input.expressIFeel.trim()} ${input.assertClearAsk.trim()} ${input.reinforceBenefit.trim()}`.trim();

  const partnerReplies = {
    softer: {
      vi: '🌿 Người đối thoại: "À mình không nhận ra chuyện đó làm bạn áp lực vậy. Để mình xem lại xem có thu xếp giúp bạn được không nhé."',
      en: '[AI Roleplay Partner — Softer Resistance]: "Oh, I didn\'t realize that was putting so much pressure on you. Let me see how we can adjust this."',
    },
    moderate: {
      vi: '🌿 Người đối thoại: "Sao tự nhiên hôm nay bạn lại căng thẳng chuyện này thế? Ai chẳng bận rộn, bạn cố thêm một chút không được sao?"',
      en: '[AI Roleplay Partner — Moderate Resistance]: "Why are you making a big deal out of this today? Everyone is busy — can\'t you just handle it this once?"',
    },
    harder: {
      vi: '🌿 Người đối thoại: "Bạn lúc nào cũng chỉ nghĩ cho bản thân! Trước giờ tôi giúp bạn bao nhiêu việc thì sao? Nếu bạn từ chối tức là bạn không coi trọng mối quan hệ này!"',
      en: '[AI Roleplay Partner — Harder Resistance / Guilt-Tripping & Sidetracking]: "You only care about yourself! After everything I\'ve done for you, saying no proves you don\'t value this relationship!"',
    },
  };

  return {
    safeToRoleplay: true,
    outcome: 'completed',
    assembledScript,
    warningsVi,
    warningsEn,
    roleplayPartnerReplyVi: partnerReplies[roleplayResistance].vi,
    roleplayPartnerReplyEn: partnerReplies[roleplayResistance].en,
    coachingStrengthVi:
      'Điểm bạn làm rất tốt: Bạn đã nêu rõ ràng mong muốn của mình và chuẩn bị sẵn câu từ chối bình tĩnh, kiên định: "' +
      input.mindfulBrokenRecordPhrase +
      '".',
    coachingStrengthEn:
      'What you did well: You stated your core ask clearly and anchored your Mindful Broken Record phrase: "' +
      input.mindfulBrokenRecordPhrase +
      '".',
    coachingTweakVi:
      warningsVi[0] ??
      'Gợi ý tinh chỉnh: Ở lượt trò chuyện tiếp theo, bạn có thể thử công nhận cảm xúc hoặc điểm hợp lý của người kia trước khi kiên định nhắc lại mong muốn của mình.',
    coachingTweakEn:
      warningsEn[0] ??
      'Refinement for next round (TEAM-CBT EAR Disarming): Find a grain of truth to disarm their pushback before calmly repeating your Broken Record phrase.',
  };
}
