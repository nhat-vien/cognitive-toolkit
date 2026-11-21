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
    return {
      shouldHoldStep: true,
      promptVi: `[Socratic Pushback — ${params.level.toUpperCase()} #1] Bước "${params.stepTitleVi}" thường mang lại sự chuyển hóa lớn nhất. Bạn có muốn thử tìm 1 ý nhỏ thôi trước khi bỏ qua không? (Hoặc bấm "Nhẹ hơn / Bỏ qua")`,
      promptEn: `[Socratic Pushback — ${params.level.toUpperCase()} #1] "${params.stepTitleEn}" often unlocks the biggest shift. Would you be willing to try finding just one small point before skipping?`,
    };
  }

  if (params.attemptNumber === 2) {
    return {
      shouldHoldStep: true,
      promptVi: `[Socratic Pushback — ${params.level.toUpperCase()} #2 / Double-Standard] Nếu một người bạn thân thiết nhất đang ở đúng hoàn cảnh của bạn lúc này, bạn sẽ nói gì với họ ở bước "${params.stepTitleVi}"?`,
      promptEn: `[Socratic Pushback — ${params.level.toUpperCase()} #2 / Double-Standard] If your closest friend were in this exact situation right now, what would you tell them for "${params.stepTitleEn}"?`,
    };
  }

  return {
    shouldHoldStep: true,
    promptVi: `[Socratic Pushback — FIRM #3 / Khám phá Kháng cự TEAM-CBT] Điều gì khiến việc ngồi lại với bước "${params.stepTitleVi}" trở nên khó khăn hoặc nặng nề với bạn ngay lúc này?`,
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
      '[TEAM-CBT EAR Empathy — Disarming + Feeling/Thought Empathy + Affirmation] Mình nghe rất rõ sự nặng nề và áp lực trong từng lời bạn vừa chia sẻ. Hoàn toàn dễ hiểu khi bạn cảm thấy như vậy trước những gì đang diễn ra. Bạn không hề đơn độc — ở chế độ Giải tỏa (Expressive), mình sẽ chỉ lắng nghe và đồng hành cùng bạn mà không vội đưa ra lời khuyên.',
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
        'CỔNG ACCURACY CHECK (Tắt Pushback — Tránh Tích cực Độc hại): Suy nghĩ của bạn phản ánh một sự thật khách quan hoặc mất mát có thật. Chúng ta DỪNG ngay việc tìm bằng chứng phản bác để tôn trọng cảm xúc thật của bạn, và chuyển sang Giải quyết Vấn đề thực tế / Tự nâng đỡ (Coping) hoặc Tách sự kiện thật khỏi nhãn dán phóng đại.',
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
      'Suy nghĩ tự động có chứa các biến dạng nhận thức có thể điều chỉnh. Hãy chuyển sang Bước 6: Viết Suy nghĩ Cân bằng ("Đúng là [Bằng chứng ủng hộ], VÀ đồng thời cũng đúng là [Bằng chứng phản bác]").',
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
    predictionErrorInsightVi = `Step 0 (Hiệu chỉnh Sai số Dự đoán): Phiên trước bạn dự đoán Niềm vui là ${params.lastPlanPredictedEnjoyment}/10 nhưng thực tế đạt ${params.lastPlanActualEnjoyment}/10 (chênh lệch ${diff >= 0 ? '+' : ''}${diff}). Trầm cảm luôn đánh lừa não bộ rằng hành động sẽ chẳng mang lại chút dễ chịu nào.`;
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
      ifThenPlan: `Nghỉ ngơi Chủ động Không Áy náy (Deliberate Guilt-Free Rest) từ ${start} đến ${end}.`,
    };
  }

  // Step 4: Confidence >= 7/10 Scaling Gate
  if (params.confidenceScore < 7) {
    return {
      predictionErrorInsightVi,
      predictionErrorInsightEn,
      restCheckTriggered: false,
      confidencePassed: false,
      requireMicroShrinkPromptVi: `Điểm tự tin hiện tại là ${params.confidenceScore}/10 (< 7/10). Quy tắc Lâm sàng: Hãy thu nhỏ hoạt động "${params.chosenActivity}" xuống phiên bản siêu nhỏ chỉ tốn 2–5 phút (ví dụ: chỉ làm 1 góc bàn hoặc bước ra cửa 3 phút) cho đến khi điểm tự tin đạt >= 7/10.`,
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
  return {
    outcomeResistanceMelted: state.positiveBenefitsOfSymptom.length >= 1,
    summaryVi: `TEAM-CBT Paradoxical Agenda Setting: Triệu chứng "${state.symptomTarget}" cho thấy bạn là người có phẩm chất đẹp (${state.coreValuesRevealed.join(', ') || 'trách nhiệm, tận tâm'}). Thay vì ép triệu chứng về 0% bằng Nút bấm Phép thuật, chúng ta dùng Magic Dial hạ từ ${state.initialIntensityPercent}% xuống mức vừa phải ${safeTarget}% để giữ lại giá trị cốt lõi mà không bị kiệt sức.`,
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
        'CỔNG JUSTIFIED CHECK (An toàn Thực tế — Pushback OFF): Tình huống có mối đe dọa thực tế. Nỗi sợ và thôi thúc rút lui/bảo vệ bản thân là 100% chính đáng. Không làm ngược lại cảm xúc này — hãy ưu tiên sự an toàn của bạn.',
      directiveEn:
        'JUSTIFIED CHECK GATE (Real Danger — Pushback OFF): Objective danger is present. Your fear and urge to withdraw/protect yourself are 100% justified. Do NOT act opposite — prioritize safety.',
    };
  }

  if (params.doesUrgeFitObjectiveFacts) {
    return {
      outcome: 'justified-exit',
      pushbackOff: true,
      directiveVi:
        'Thôi thúc hành động phù hợp với sự thật khách quan. Hãy thực hiện Hành động Khéo léo (Skillful Action / Giải quyết vấn đề).',
      directiveEn:
        'Your action urge fits the objective facts. Proceed with Skillful Action and problem-solving.',
    };
  }

  return {
    outcome: 'completed',
    pushbackOff: false,
    directiveVi: `Step 4 — Làm Ngược Lại Toàn Diện (Act Opposite All The Way): Cảm xúc "${params.emotion}" đang xúi giục bạn "${params.actionUrge}", nhưng điều đó không giúp ích cho bạn. Trong 15 phút tới, hãy thực hiện 100% hành động ngược lại (cả nét mặt, tư thế cơ thể và hành động): "${params.oppositeActionPlan}".`,
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
      ? 'Kết quả hợp lệ: "Chưa biết lúc này (Nothing yet)" — Tâm Trí Tuệ không bao giờ bị ép phải có câu trả lời ngay. Hẹn xem lại vào: ' +
        params.nextStepOrRevisitTime
      : `Kết luận từ Tâm Trí Tuệ (${params.resolutionType}): ${params.wiseMindSynthesisText} -> Bước tiếp theo: ${params.nextStepOrRevisitTime}`;

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
    summaryVi: `Đã giải phẫu chuỗi ${params.links.length} mắt xích với tinh thần Tò mò, Không phán xét. Phòng ngừa PLEASE: "${params.preventionPlan}". Hàn gắn lành mạnh (Repair): "${params.healthyRepairStep}".`,
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
      vi: '[AI Đóng vai Đối phương — Kháng cự Nhẹ (Softer)]: "À mình không nhận ra chuyện đó làm bạn áp lực vậy. Để mình xem lại xem có thu xếp giúp bạn được không nhé."',
      en: '[AI Roleplay Partner — Softer Resistance]: "Oh, I didn\'t realize that was putting so much pressure on you. Let me see how we can adjust this."',
    },
    moderate: {
      vi: '[AI Đóng vai Đối phương — Kháng cự Vừa (Moderate)]: "Sao tự nhiên hôm nay bạn lại căng thẳng chuyện này thế? Ai chẳng bận rộn, bạn cố thêm một chút không được sao?"',
      en: '[AI Roleplay Partner — Moderate Resistance]: "Why are you making a big deal out of this today? Everyone is busy — can\'t you just handle it this once?"',
    },
    harder: {
      vi: '[AI Đóng vai Đối phương — Kháng cự Cao (Harder / Đánh trống lảng & Gây cảm giác tội lỗi)]: "Bạn lúc nào cũng chỉ nghĩ cho bản thân! Trước giờ tôi giúp bạn bao nhiêu việc thì sao? Nếu bạn từ chối tức là bạn không coi trọng mối quan hệ này!"',
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
      'Điểm bạn làm rất tốt: Bạn đã nêu rõ yêu cầu (Assert) và chuẩn bị sẵn câu lặp lại bình tĩnh (Broken Record): "' +
      input.mindfulBrokenRecordPhrase +
      '".',
    coachingStrengthEn:
      'What you did well: You stated your core ask clearly and anchored your Mindful Broken Record phrase: "' +
      input.mindfulBrokenRecordPhrase +
      '".',
    coachingTweakVi:
      warningsVi[0] ??
      'Gợi ý tinh chỉnh (Kết hợp TEAM-CBT EAR Disarming): Ở vòng tiếp theo, hãy bắt đầu bằng 1 câu tìm điểm đúng trong lời đối phương (Disarming) trước khi lặp lại câu Broken Record.',
    coachingTweakEn:
      warningsEn[0] ??
      'Refinement for next round (TEAM-CBT EAR Disarming): Find a grain of truth to disarm their pushback before calmly repeating your Broken Record phrase.',
  };
}
