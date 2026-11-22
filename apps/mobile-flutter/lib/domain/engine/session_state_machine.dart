// lib/domain/engine/session_state_machine.dart
// Full Dart Port of the 5-Phase CBT / TEAM-CBT / DBT Session Engine:
// - Phase 0: Expressive Venting (Audio Burst + EAR Empathy) vs Instrumental CBT/DBT Mode
// - Phase 1: Check-in, Biometrics (Baseline-Relative HRV/Sleep) & 4-Layer Safety Screen
// - Arousal Router ("DBT-First, CBT-Second"):
//     * Intensity >= 8/10 or Mixed State -> DBT TIPP
//     * Intensity 5-7/10 or Action Urges -> DBT Opposite Action / Wise Mind / Chain Analysis / DEAR MAN
//     * Intensity 1-6/10 -> CBT Thought Record / Behavioral Activation / TEAM-CBT Paradoxical Agenda
// - Phase 2: Technique Selection with clinical "When NOT to use" guards
// - Phase 3: Guided Protocol with 4-Level Socratic Pushback Controller across 3 Zones
//   (`Supportive`, `Core`, `Closing`) and mandatory Clinical Safety Exits:
//     * `Accuracy Check` (Thought Record between Steps 5 & 6 -> `accurate-thought-exit`)
//     * `Rest Check` (Behavioral Activation Step 2 -> `justified-exit`)
//     * `Justified Check` (Opposite Action Step 3 -> `justified-exit`)
//     * `TIPP Medical Exclusion Screen` (blocks Cold Water if cardiovascular/beta-blocker/eating disorder/unsure)
//     * `Chain Analysis Hard Stops` (blocks self-harm and victimization targets) & `Shame Protocol`
//     * `Wise Mind Harsh Self-Critic Guard` & accepts "Nothing yet"
// - Phase 4: Close & Save with Markdown Frontmatter Exporter (`YYYYMMDD-[technique]-NN.md`).

import '../models/clinical_models.dart';
import 'distortion_detector.dart';

enum SessionInteractionMode {
  expressiveVenting('expressive', 'Giải tỏa Cảm xúc & Thấu cảm EAR (Expressive)'),
  instrumentalProtocol('instrumental', 'Thực hành Kỹ thuật CBT / DBT (Instrumental)');

  final String code;
  final String labelVi;
  const SessionInteractionMode(this.code, this.labelVi);
}

enum SessionPhase {
  phase0ModeCheck,
  phase1CheckIn,
  safetyStopTerminal,
  acuteTippPortal,
  phase2TechniqueSelection,
  phase3GuidedProtocol,
  phase4CloseAndSave,
}

enum PushbackZone {
  supportive,
  core,
  closing,
  none,
}

class ProtocolStepDefinition {
  final String stepId;
  final int stepNumber;
  final String titleVi;
  final String titleEn;
  final String promptVi;
  final String promptEn;
  final PushbackZone zone;
  final bool isClinicalSafetyGate;

  const ProtocolStepDefinition({
    required this.stepId,
    required this.stepNumber,
    required this.titleVi,
    required this.titleEn,
    required this.promptVi,
    required this.promptEn,
    required this.zone,
    this.isClinicalSafetyGate = false,
  });
}

class TippMedicalScreeningAnswer {
  final bool hasHeartConditionOrBradycardia;
  final bool takesBetaBlockers;
  final bool hasColdAllergyOrRaynauds;
  final bool hasEatingDisorderOrMedicalPregnancyConcern;
  final bool isUnsure;

  const TippMedicalScreeningAnswer({
    this.hasHeartConditionOrBradycardia = false,
    this.takesBetaBlockers = false,
    this.hasColdAllergyOrRaynauds = false,
    this.hasEatingDisorderOrMedicalPregnancyConcern = false,
    this.isUnsure = false,
  });

  bool get isColdWaterCleared =>
      !hasHeartConditionOrBradycardia &&
      !takesBetaBlockers &&
      !hasColdAllergyOrRaynauds &&
      !hasEatingDisorderOrMedicalPregnancyConcern &&
      !isUnsure;
}

class PushbackDecision {
  final bool allowImmediateAdvance;
  final int nudgeAttemptNumber;
  final PushbackLevel effectiveLevel;
  final String? socraticPromptVi;
  final String? socraticPromptEn;

  const PushbackDecision({
    required this.allowImmediateAdvance,
    required this.nudgeAttemptNumber,
    required this.effectiveLevel,
    this.socraticPromptVi,
    this.socraticPromptEn,
  });
}

class SessionStateSnapshot {
  final String sessionId;
  final SessionInteractionMode interactionMode;
  final SessionPhase phase;
  final TechniqueSlug selectedTechnique;
  final PushbackLevel pushbackLevel;
  final bool shameProtocolActive;
  final int preIntensity;
  final int? postIntensity;
  final int moodPolarity;
  final int energyLevel;
  final List<String> emotions;
  final HrvContext? hrvContext;
  final int currentStepIndex;
  final int currentStepPushbackCount;
  final Map<String, dynamic> stepResponses;
  final List<String> stepsSkipped;
  final List<String> negativeDistortionsIdentified;
  final List<String> positiveDistortionsIdentified;
  final List<String> selfDefeatingBeliefsIdentified;
  final SessionOutcome? finalOutcome;
  final String? clinicalBannerMessageVi;
  final String? takeaway;

  const SessionStateSnapshot({
    required this.sessionId,
    this.interactionMode = SessionInteractionMode.instrumentalProtocol,
    this.phase = SessionPhase.phase0ModeCheck,
    this.selectedTechnique = TechniqueSlug.thoughtRecord,
    this.pushbackLevel = PushbackLevel.moderate,
    this.shameProtocolActive = false,
    this.preIntensity = 5,
    this.postIntensity,
    this.moodPolarity = 0,
    this.energyLevel = 0,
    this.emotions = const [],
    this.hrvContext,
    this.currentStepIndex = 0,
    this.currentStepPushbackCount = 0,
    this.stepResponses = const {},
    this.stepsSkipped = const [],
    this.negativeDistortionsIdentified = const [],
    this.positiveDistortionsIdentified = const [],
    this.selfDefeatingBeliefsIdentified = const [],
    this.finalOutcome,
    this.clinicalBannerMessageVi,
    this.takeaway,
  });

  SessionStateSnapshot copyWith({
    SessionInteractionMode? interactionMode,
    SessionPhase? phase,
    TechniqueSlug? selectedTechnique,
    PushbackLevel? pushbackLevel,
    bool? shameProtocolActive,
    int? preIntensity,
    int? postIntensity,
    int? moodPolarity,
    int? energyLevel,
    List<String>? emotions,
    HrvContext? hrvContext,
    int? currentStepIndex,
    int? currentStepPushbackCount,
    Map<String, dynamic>? stepResponses,
    List<String>? stepsSkipped,
    List<String>? negativeDistortionsIdentified,
    List<String>? positiveDistortionsIdentified,
    List<String>? selfDefeatingBeliefsIdentified,
    SessionOutcome? finalOutcome,
    String? clinicalBannerMessageVi,
    String? takeaway,
  }) {
    return SessionStateSnapshot(
      sessionId: sessionId,
      interactionMode: interactionMode ?? this.interactionMode,
      phase: phase ?? this.phase,
      selectedTechnique: selectedTechnique ?? this.selectedTechnique,
      pushbackLevel: pushbackLevel ?? this.pushbackLevel,
      shameProtocolActive: shameProtocolActive ?? this.shameProtocolActive,
      preIntensity: preIntensity ?? this.preIntensity,
      postIntensity: postIntensity ?? this.postIntensity,
      moodPolarity: moodPolarity ?? this.moodPolarity,
      energyLevel: energyLevel ?? this.energyLevel,
      emotions: emotions ?? this.emotions,
      hrvContext: hrvContext ?? this.hrvContext,
      currentStepIndex: currentStepIndex ?? this.currentStepIndex,
      currentStepPushbackCount:
          currentStepPushbackCount ?? this.currentStepPushbackCount,
      stepResponses: stepResponses ?? this.stepResponses,
      stepsSkipped: stepsSkipped ?? this.stepsSkipped,
      negativeDistortionsIdentified:
          negativeDistortionsIdentified ?? this.negativeDistortionsIdentified,
      positiveDistortionsIdentified:
          positiveDistortionsIdentified ?? this.positiveDistortionsIdentified,
      selfDefeatingBeliefsIdentified:
          selfDefeatingBeliefsIdentified ?? this.selfDefeatingBeliefsIdentified,
      finalOutcome: finalOutcome ?? this.finalOutcome,
      clinicalBannerMessageVi:
          clinicalBannerMessageVi ?? this.clinicalBannerMessageVi,
      takeaway: takeaway ?? this.takeaway,
    );
  }
}

class SessionStateMachine {
  final DistortionDetector detector;

  const SessionStateMachine({
    this.detector = const DistortionDetector(),
  });

  /// Canonical step definitions for every core CBT, TEAM-CBT & DBT technique.
  static List<ProtocolStepDefinition> stepsForTechnique(
    TechniqueSlug technique,
  ) {
    switch (technique) {
      case TechniqueSlug.thoughtRecord:
        return const [
          ProtocolStepDefinition(
            stepId: 'step_1_situation',
            stepNumber: 1,
            titleVi: 'Bước 1: Tình huống Khách quan (Situation)',
            titleEn: 'Step 1: Objective Situation',
            promptVi:
                'Chuyện gì đã xảy ra, ở đâu, lúc nào? Chỉ ghi nhận dữ kiện thực tế như "máy quay ghi lại được".',
            promptEn:
                'What happened, where, and when? Stick strictly to camera-verifiable facts.',
            zone: PushbackZone.supportive,
          ),
          ProtocolStepDefinition(
            stepId: 'step_2_automatic_thought',
            stepNumber: 2,
            titleVi: 'Bước 2: Suy nghĩ Tự động (Automatic Thought)',
            titleEn: 'Step 2: Automatic Thought',
            promptVi:
                'Câu nói đầu tiên thoáng qua trong đầu bạn lúc đó là gì, và bạn tin nó bao nhiêu % (0–100%)?',
            promptEn:
                'What exact thought went through your mind, and how much do you believe it (0–100%)?',
            zone: PushbackZone.supportive,
          ),
          ProtocolStepDefinition(
            stepId: 'step_3_emotion_rating',
            stepNumber: 3,
            titleVi: 'Bước 3: Gọi tên Cảm xúc & Cường độ (Emotion & Intensity)',
            titleEn: 'Step 3: Emotion & Pre-Intensity',
            promptVi:
                'Chọn cảm xúc chính xác (Giận dữ / Buồn bã / Lo âu / Xấu hổ / Tội lỗi) và chấm cường độ 0–10.',
            promptEn:
                'Label your core emotion (Anger, Sadness, Anxiety, Shame, Guilt) and rate intensity 0–10.',
            zone: PushbackZone.supportive,
          ),
          ProtocolStepDefinition(
            stepId: 'step_4_evidence_for',
            stepNumber: 4,
            titleVi: 'Bước 4: Bằng chứng Ủng hộ (Evidence FOR)',
            titleEn: 'Step 4: Evidence Supporting the Hot Thought',
            promptVi:
                'Có những dữ kiện thực tế khách quan nào ủng hộ rằng suy nghĩ tự động này là đúng?',
            promptEn:
                'What objective facts support this automatic thought?',
            zone: PushbackZone.core,
          ),
          ProtocolStepDefinition(
            stepId: 'step_5_evidence_against',
            stepNumber: 5,
            titleVi: 'Bước 5: Bằng chứng Phản bác (Evidence AGAINST)',
            titleEn: 'Step 5: Evidence Against the Hot Thought',
            promptVi:
                'Có bằng chứng thực tế nào đi ngược lại suy nghĩ đó? Bạn sẽ nói gì nếu một người bạn thân nghĩ như vậy?',
            promptEn:
                'What facts contradict this thought? What would you tell a dear friend who had this thought?',
            zone: PushbackZone.core,
          ),
          ProtocolStepDefinition(
            stepId: 'gate_accuracy_check',
            stepNumber: 6,
            titleVi: 'Cổng An toàn Lâm sàng: Kiểm tra Tính Chính xác (Accuracy Check)',
            titleEn: 'Clinical Gate: Accuracy Check',
            promptVi:
                'Nhìn vào cả 2 phía bằng chứng: Suy nghĩ ban đầu của bạn có phải là một sự thật khách quan (mất mát thật, rủi ro thật) không?',
            promptEn:
                'Looking at all the evidence: Is the original thought an objective real-world fact?',
            zone: PushbackZone.none,
            isClinicalSafetyGate: true,
          ),
          ProtocolStepDefinition(
            stepId: 'step_6_balanced_thought',
            stepNumber: 7,
            titleVi: 'Bước 6: Suy nghĩ Cân bằng Biện chứng (Balanced Thought)',
            titleEn: 'Step 6: Dialectical Balanced Thought',
            promptVi:
                'Viết một góc nhìn cân bằng: "Đúng là [Bằng chứng ủng hộ], VÀ đồng thời cũng đúng là [Bằng chứng phản bác]."',
            promptEn:
                'Synthesize a balanced view: "It is true that [Evidence FOR], AND it is also true that [Evidence AGAINST]."',
            zone: PushbackZone.core,
          ),
          ProtocolStepDefinition(
            stepId: 'step_7_rerate_emotion',
            stepNumber: 8,
            titleVi: 'Bước 7: Đánh giá lại Cảm xúc (Re-rate Emotion)',
            titleEn: 'Step 7: Re-rate Emotion Intensity (0–10)',
            promptVi:
                'Khi đọc lại Suy nghĩ Cân bằng, cường độ cảm xúc của bạn lúc này là bao nhiêu (0–10)?',
            promptEn:
                'Reading your balanced thought, what is your emotional intensity now (0–10)?',
            zone: PushbackZone.closing,
          ),
        ];

      case TechniqueSlug.behavioralActivation:
        return const [
          ProtocolStepDefinition(
            stepId: 'step_0_followup',
            stepNumber: 1,
            titleVi: 'Bước 0: Đối chiếu Sai số Dự đoán (Follow-up on Last Plan)',
            titleEn: 'Step 0: Prediction-Error Follow-up',
            promptVi:
                'Với hoạt động lần trước, mức độ Hài lòng (Pleasure 0–10) và Hoàn thành (Mastery 0–10) thực tế so với dự đoán thế nào?',
            promptEn:
                'How did your actual Pleasure (0–10) and Mastery (0–10) compare with your prediction?',
            zone: PushbackZone.supportive,
          ),
          ProtocolStepDefinition(
            stepId: 'step_1_dropped_away',
            stepNumber: 2,
            titleVi: 'Bước 1: Hoạt động Đã Đánh mất (What Has Dropped Away)',
            titleEn: 'Step 1: What Has Dropped Away',
            promptVi:
                'Từ khi mệt mỏi/trầm cảm, hoạt động nào trong 5 lĩnh vực (Kết nối, Vận động, Sở thích, Hoàn thành, Không gian sống) đã bị thu hẹp?',
            promptEn:
                'Which nourishing activities have dropped away recently?',
            zone: PushbackZone.supportive,
          ),
          ProtocolStepDefinition(
            stepId: 'gate_rest_check',
            stepNumber: 3,
            titleVi: 'Bước 2 (Cổng Lâm sàng): Kiểm tra Nhu cầu Nghỉ ngơi Sinh học (Rest Check)',
            titleEn: 'Step 2 (Clinical Gate): Biological Rest Check',
            promptVi:
                'Sự kiệt sức lúc này đến từ trầm cảm rút lui hay do cơ thể thực sự cần phục hồi sinh học (thiếu ngủ, ốm, burnout, tang chế)?',
            promptEn:
                'Is this exhaustion depressive withdrawal or genuine biological need for recovery (illness, sleep debt, grief)?',
            zone: PushbackZone.none,
            isClinicalSafetyGate: true,
          ),
          ProtocolStepDefinition(
            stepId: 'step_3_what_matters',
            stepNumber: 4,
            titleVi: 'Bước 3: Lọc bỏ "Tôi Phải" để tìm Giá trị Thật (What Matters)',
            titleEn: 'Step 3: Filter Out "Shoulds" to Find What Matters',
            promptVi:
                'Tách các mệnh lệnh "Tôi phải..." sang một bên — việc nhỏ nào thực sự có ý nghĩa (hoặc ít tệ nhất) với riêng bạn lúc này?',
            promptEn:
                'Setting external "shoulds" aside, what small activity genuinely matters to you right now?',
            zone: PushbackZone.core,
          ),
          ProtocolStepDefinition(
            stepId: 'step_4_made_small_confidence',
            stepNumber: 5,
            titleVi: 'Bước 4: Thu nhỏ Hoạt động đến Tự tin >= 7/10 (Confidence Scaling)',
            titleEn: 'Step 4: One Small Activity (Confidence >= 7/10)',
            promptVi:
                'Chọn 1 bước kéo dài 5–15 phút có Giờ & Địa điểm cụ thể. Độ tự tin thực hiện của bạn là bao nhiêu (0–10)? (Nếu < 7/10, hãy chia nhỏ nữa).',
            promptEn:
                'Pick one 5–15 minute action with a time and place. Rate your confidence 0–10 (must scale down until >= 7/10).',
            zone: PushbackZone.core,
          ),
          ProtocolStepDefinition(
            stepId: 'step_5_6_predict_and_barrier',
            stepNumber: 6,
            titleVi: 'Bước 5 & 6: Dự đoán M/P & Kế hoạch Vượt Rào cản (If-Then Plan)',
            titleEn: 'Step 5 & 6: Predict Pleasure/Mastery & If-Then Barrier Plan',
            promptVi:
                'Dự đoán Pleasure/Mastery (0–10) và hoàn thành câu: "Nếu tới giờ đó tôi không có chút hứng thú nào, thì tôi sẽ chỉ làm đúng 2 phút đầu tiên."',
            promptEn:
                'Predict Pleasure/Mastery (0–10) and set your If-Then 2-minute rule.',
            zone: PushbackZone.closing,
          ),
        ];

      case TechniqueSlug.oppositeAction:
        return const [
          ProtocolStepDefinition(
            stepId: 'step_1_name_emotion',
            stepNumber: 1,
            titleVi: 'Bước 1: Gọi tên Cảm xúc Chủ đạo (Name the Emotion)',
            titleEn: 'Step 1: Name the Primary Emotion',
            promptVi: 'Cảm xúc nào đang điều khiển cơ thể bạn lúc này?',
            promptEn: 'What primary emotion is driving your body right now?',
            zone: PushbackZone.supportive,
          ),
          ProtocolStepDefinition(
            stepId: 'step_2_action_urge',
            stepNumber: 2,
            titleVi: 'Bước 2: Nhận diện Thôi thúc Hành động (Identify the Action Urge)',
            titleEn: 'Step 2: Identify the Action Urge',
            promptVi:
                'Cảm xúc này đang xúi giục bạn làm hành động gì (né tránh, nằm lì, gửi tin nhắn công kích, thức trắng đêm...)?',
            promptEn:
                'What specific action is this emotion urging you to take?',
            zone: PushbackZone.core,
          ),
          ProtocolStepDefinition(
            stepId: 'gate_justified_check',
            stepNumber: 3,
            titleVi: 'Bước 3 (Cổng Lâm sàng): Kiểm tra Tính Chính đáng (Justified Check)',
            titleEn: 'Step 3 (Clinical Gate): Justified & Safety Check',
            promptVi:
                'Cảm xúc của bạn là hợp lệ, nhưng thôi thúc hành động này có phù hợp với sự thật khách quan (hoặc có nguy hiểm thực tế) không?',
            promptEn:
                'Your emotion is valid, but does the action urge fit the objective facts or real-world safety?',
            zone: PushbackZone.none,
            isClinicalSafetyGate: true,
          ),
          ProtocolStepDefinition(
            stepId: 'step_4_act_opposite_all_the_way',
            stepNumber: 4,
            titleVi: 'Bước 4: Hành động Ngược lại Toàn diện 100% (Act Opposite All the Way)',
            titleEn: 'Step 4: Act Opposite All the Way',
            promptVi:
                'Chọn 1 hành động ngược chiều 100% (cả tư thế cơ thể, nét mặt và hành động) bạn có thể làm trong 15 phút tới.',
            promptEn:
                'Choose one 100% opposite action (posture, expression, and behavior) for the next 15 minutes.',
            zone: PushbackZone.core,
          ),
        ];

      case TechniqueSlug.wiseMind:
        return const [
          ProtocolStepDefinition(
            stepId: 'step_1_question',
            stepNumber: 1,
            titleVi: 'Bước 1: Đặt Câu hỏi Đang Giằng xé (Name the Question)',
            titleEn: 'Step 1: Name the Dilemma in One Sentence',
            promptVi: 'Quyết định nào đang làm bạn giằng xé giữa hai phía?',
            promptEn: 'What decision or dilemma is pulling you in two directions?',
            zone: PushbackZone.supportive,
          ),
          ProtocolStepDefinition(
            stepId: 'step_2_emotion_mind',
            stepNumber: 2,
            titleVi: 'Bước 2: Tiếng nói Tâm Cảm xúc (Emotion Mind)',
            titleEn: 'Step 2: Emotion Mind Speaks Fully',
            promptVi:
                'Hãy để phần cảm xúc lên tiếng trọn vẹn mà không phán xét hay đè nén bằng lý lẽ.',
            promptEn:
                'Let Emotion Mind speak candidly without censoring it with logic.',
            zone: PushbackZone.core,
          ),
          ProtocolStepDefinition(
            stepId: 'step_3_reasonable_mind',
            stepNumber: 3,
            titleVi: 'Bước 3: Tiếng nói Tâm Lý trí — Có Bảo vệ Chống Tự Phán xét (Reasonable Mind)',
            titleEn: 'Step 3: Reasonable Mind (With Harsh Self-Critic Guard)',
            promptVi:
                'Chỉ liệt kê dữ kiện khách quan và hệ quả thực tế (không dùng lời tự chỉ trích trá hình lý trí).',
            promptEn:
                'List objective facts and consequences (filtering out the harsh inner critic).',
            zone: PushbackZone.core,
          ),
          ProtocolStepDefinition(
            stepId: 'step_4_mindful_pause',
            stepNumber: 4,
            titleVi: 'Bước 4: Khoảng lặng Hơi thở (Mindful Breathing Pause)',
            titleEn: 'Step 4: Mindful Breathing Pause (4s In, 6s Out)',
            promptVi:
                'Hít vào 4 giây, thở ra 6 giây. Đặt câu hỏi vào hơi thở vào và lắng nghe sự tĩnh lặng khi thở ra.',
            promptEn:
                'Breathe in 4s, out 6s. Rest your attention at the center of your breath.',
            zone: PushbackZone.none,
          ),
          ProtocolStepDefinition(
            stepId: 'step_5_wise_mind_synthesis',
            stepNumber: 5,
            titleVi: 'Bước 5: Lắng nghe Tâm Trí Tuệ (Wise Mind — Chấp nhận cả "Chưa biết")',
            titleEn: 'Step 5: Wise Mind Synthesis ("Nothing yet" is valid)',
            promptVi:
                'Khi cả Cảm xúc và Lý trí đều được tôn trọng, Tâm Trí Tuệ nhận ra điều gì? (Hoàn toàn hợp lệ nếu câu trả lời là "Chưa biết lúc này").',
            promptEn:
                'When both sides are honored, what emerges? ("Nothing yet" is an equally valid outcome).',
            zone: PushbackZone.supportive,
          ),
          ProtocolStepDefinition(
            stepId: 'step_6_next_step',
            stepNumber: 6,
            titleVi: 'Bước 6: Một Bước Nhỏ Tiếp Theo (One Next Step)',
            titleEn: 'Step 6: One Small Next Step or Review Time',
            promptVi: 'Chốt 1 bước hành động nhỏ hoặc thời điểm bạn sẽ quay lại hỏi Tâm Trí Tuệ.',
            promptEn: 'Choose one small step or a time to revisit the question.',
            zone: PushbackZone.closing,
          ),
        ];

      case TechniqueSlug.chainAnalysis:
        return const [
          ProtocolStepDefinition(
            stepId: 'step_1_target_behavior',
            stepNumber: 1,
            titleVi: 'Bước 1: Mô tả Hành vi Mục tiêu (Target Behavior — Có Cổng Chặn Cứng)',
            titleEn: 'Step 1: Target Behavior (With Self-Harm & Victimization Hard Stops)',
            promptVi:
                'Mô tả 1 hành vi cụ thể bạn vừa làm và muốn hiểu rõ chuỗi mắt xích (Lưu ý: Không áp dụng cho hành vi tự hại hoặc khi bạn là nạn nhân bị bạo hành).',
            promptEn:
                'Describe one specific behavior instance objectively (Hard stop on self-harm or victimization).',
            zone: PushbackZone.core,
            isClinicalSafetyGate: true,
          ),
          ProtocolStepDefinition(
            stepId: 'step_2_prompting_event',
            stepNumber: 2,
            titleVi: 'Bước 2: Sự kiện Kích hoạt (Prompting Event)',
            titleEn: 'Step 2: Prompting Event',
            promptVi: 'Khoảnh khắc ngay trước khi mọi thứ trượt đi là gì?',
            promptEn: 'What happened right before the chain started sliding?',
            zone: PushbackZone.core,
          ),
          ProtocolStepDefinition(
            stepId: 'step_3_vulnerabilities',
            stepNumber: 3,
            titleVi: 'Bước 3: Yếu tố Dễ tổn thương Sinh học & Tâm lý (PLEASE Vulnerabilities)',
            titleEn: 'Step 3: Vulnerabilities (DBT PLEASE Factors)',
            promptVi:
                'Hôm đó có yếu tố nào làm giảm sức đề kháng của bạn không (thiếu ngủ, bỏ bữa, quên thuốc, căng thẳng tích tụ)?',
            promptEn:
                'What PLEASE vulnerabilities were present (sleep debt, skipped meals, stress, missed meds)?',
            zone: PushbackZone.supportive,
          ),
          ProtocolStepDefinition(
            stepId: 'step_4_links',
            stepNumber: 4,
            titleVi: 'Bước 4: Giải phẫu Các Mắt xích (The Links: [thought], [feeling], [body], [action])',
            titleEn: 'Step 4: Unpack the Links',
            promptVi:
                'Liệt kê từng mắt xích nối từ Sự kiện kích hoạt đến Hành vi theo thứ tự thời gian.',
            promptEn:
                'Trace the exact links ([thought], [feeling], [body sensation], [action]) in sequence.',
            zone: PushbackZone.core,
          ),
          ProtocolStepDefinition(
            stepId: 'step_5_consequences',
            stepNumber: 5,
            titleVi: 'Bước 5: Hệ quả Ngắn hạn & Dài hạn (Consequences)',
            titleEn: 'Step 5: Short-Term Relief vs. Long-Term Cost',
            promptVi:
                'Hành vi đó mang lại sự khuây khỏa ngắn hạn nào trong khoảnh khắc đó, và cái giá dài hạn là gì?',
            promptEn:
                'What immediate relief did the behavior provide, and what were the longer-term costs?',
            zone: PushbackZone.supportive,
          ),
          ProtocolStepDefinition(
            stepId: 'step_6_break_points_repair',
            stepNumber: 6,
            titleVi: 'Bước 6: Điểm Ngắt Chuỗi & Hàn gắn Lành mạnh (Break Points & Repair)',
            titleEn: 'Step 6: Break Points, Prevention & Healthy Repair',
            promptVi:
                'Chọn 1 mắt xích để chèn Kỹ năng Thay thế cho lần sau, và 1 hành động sửa chữa lành mạnh (không tự sỉ nhục bản thân).',
            promptEn:
                'Identify one link to replace with a skill next time, plus one self-respecting repair action.',
            zone: PushbackZone.closing,
          ),
        ];

      case TechniqueSlug.dearMan:
        return const [
          ProtocolStepDefinition(
            stepId: 'step_1_ask_and_priority',
            stepNumber: 1,
            titleVi: 'Bước 1: Xác định Yêu cầu / Từ chối & Ưu tiên (The Ask & Priority)',
            titleEn: 'Step 1: The Ask/No & Primary Priority',
            promptVi:
                'Bạn muốn yêu cầu hay từ chối điều gì trong 1 câu? (Lưu ý: Nếu người kia có nguy cơ bạo lực, ưu tiên an toàn thay vì thương lượng).',
            promptEn:
                'State your request or refusal in one sentence, and pick your priority (Objective, Relationship, Self-Respect).',
            zone: PushbackZone.core,
            isClinicalSafetyGate: true,
          ),
          ProtocolStepDefinition(
            stepId: 'step_2_describe',
            stepNumber: 2,
            titleVi: 'Bước 2: D — Mô tả Sự thật Khách quan (Describe)',
            titleEn: 'Step 2: D — Describe Objective Facts',
            promptVi: 'Nêu dữ kiện thực tế không kèm từ quy chụp ("luôn luôn / không bao giờ").',
            promptEn: 'Describe observable facts without judgmental labels.',
            zone: PushbackZone.core,
          ),
          ProtocolStepDefinition(
            stepId: 'step_3_express',
            stepNumber: 3,
            titleVi: 'Bước 3: E — Bày tỏ Cảm xúc ("Tôi cảm thấy...")',
            titleEn: 'Step 3: E — Express Using "I Feel" Statements',
            promptVi: 'Diễn đạt cảm xúc của bạn theo cấu trúc "Tôi cảm thấy...", tránh câu "Bạn làm tôi...".',
            promptEn: 'Express your feelings using "I feel..." rather than "You make me...".',
            zone: PushbackZone.supportive,
          ),
          ProtocolStepDefinition(
            stepId: 'step_4_assert',
            stepNumber: 4,
            titleVi: 'Bước 4: A — Khẳng định Rõ ràng Không Rào đón Xin lỗi (Assert)',
            titleEn: 'Step 4: A — Assert Clearly Without Over-Apologizing',
            promptVi: 'Nói thẳng yêu cầu hoặc lời từ chối, bỏ các câu tự hạ thấp ở đầu câu.',
            promptEn: 'Ask clearly or say No directly without pre-apologizing.',
            zone: PushbackZone.core,
          ),
          ProtocolStepDefinition(
            stepId: 'step_5_reinforce',
            stepNumber: 5,
            titleVi: 'Bước 5: R — Củng cố Lợi ích Chung (Reinforce)',
            titleEn: 'Step 5: R — Reinforce Positive Outcome',
            promptVi: 'Nêu lợi ích tích cực cho cả hai hoặc cho công việc nếu họ hợp tác.',
            promptEn: 'Explain the positive benefit of cooperating.',
            zone: PushbackZone.supportive,
          ),
          ProtocolStepDefinition(
            stepId: 'step_6_7_man_and_roleplay',
            stepNumber: 6,
            titleVi: 'Bước 6 & 7: M-A-N (Đĩa nhạc xước) & Tập dượt Đóng vai EAR',
            titleEn: 'Step 6 & 7: Mindful / Appear Confident / Negotiate & EAR Roleplay',
            promptVi:
                'Chọn 1 câu ngắn để lặp lại bình tĩnh (Broken Record) và chạy thử kịch bản đóng vai kết hợp 5 Bí quyết Giao tiếp EAR.',
            promptEn:
                'Draft your Broken Record line and rehearse your complete DEAR MAN + EAR script.',
            zone: PushbackZone.closing,
          ),
        ];

      default:
        // TEAM-CBT Paradoxical Agenda Setting & specialized tools default flow
        return const [
          ProtocolStepDefinition(
            stepId: 'team_step_1_magic_button',
            stepNumber: 1,
            titleVi: 'Bước 1: Câu hỏi Nút bấm Phép thuật (The Magic Button)',
            titleEn: 'Step 1: The Magic Button Question',
            promptVi:
                'Nếu có một nút bấm làm biến mất hoàn toàn cảm xúc khó chịu này ngay lập tức, bạn có chút do dự nào khi bấm nó không?',
            promptEn:
                'If you pressed a magic button that erased this negative feeling instantly, might there be any reason to hesitate?',
            zone: PushbackZone.supportive,
          ),
          ProtocolStepDefinition(
            stepId: 'team_step_2_positive_reframing',
            stepNumber: 2,
            titleVi: 'Bước 2: Tái định khung Tích cực (Positive Reframing)',
            titleEn: 'Step 2: Positive Reframing of Symptoms',
            promptVi:
                'Triệu chứng lo âu/trầm cảm/tội lỗi này đang cố gắng bảo vệ bạn khỏi điều gì và nói lên phẩm chất tốt đẹp nào ở bạn?',
            promptEn:
                'How is this symptom trying to protect you, and what core values or virtues does it reveal about you?',
            zone: PushbackZone.core,
          ),
          ProtocolStepDefinition(
            stepId: 'team_step_3_magic_dial',
            stepNumber: 3,
            titleVi: 'Bước 3: Núm xoay Phép thuật (The Magic Dial)',
            titleEn: 'Step 3: The Magic Dial Target Level',
            promptVi:
                'Thay vì ép cảm xúc này về 0%, bạn muốn vặn Núm xoay giảm nó xuống mức bao nhiêu % là vừa đủ hợp lý?',
            promptEn:
                'Instead of forcing this emotion to 0%, what realistic dial setting (0–100%) feels right to aim for today?',
            zone: PushbackZone.closing,
          ),
        ];
    }
  }

  /// Phase 1: Evaluates Check-in inputs and routes according to "DBT-First, CBT-Second".
  SessionStateSnapshot processCheckInAndRoute({
    required SessionStateSnapshot current,
    required String situationText,
    required int preIntensity,
    required int moodPolarity,
    required int energyLevel,
    List<String> emotions = const [],
    HrvContext? hrvContext,
    int bmsSuicideScore = 0,
    int phq9Item9Score = 0,
    int asrmScore = 0,
  }) {
    final analysis = detector.analyzeText(
      text: situationText,
      preIntensity: preIntensity,
      moodPolarity: moodPolarity,
      energyLevel: energyLevel,
      bmsSuicideItemScore: bmsSuicideScore,
      phq9Item9Score: phq9Item9Score,
      asrmScore: asrmScore,
    );

    final negCodes =
        analysis.negativeDistortions.map((d) => d.code).toList();
    final posCodes =
        analysis.positiveDistortions.map((d) => d.code).toList();
    final sdbCodes =
        analysis.selfDefeatingBeliefs.map((d) => d.code).toList();

    // 1. Immediate Crisis Safety Stop
    if (analysis.safetyScreen.requiresImmediateSafetyStop) {
      return current.copyWith(
        phase: SessionPhase.safetyStopTerminal,
        pushbackLevel: PushbackLevel.off,
        preIntensity: preIntensity,
        moodPolarity: moodPolarity,
        energyLevel: energyLevel,
        emotions: emotions,
        hrvContext: hrvContext,
        negativeDistortionsIdentified: negCodes,
        positiveDistortionsIdentified: posCodes,
        selfDefeatingBeliefsIdentified: sdbCodes,
        finalOutcome: SessionOutcome.safetyStop,
        clinicalBannerMessageVi: analysis.safetyScreen.clinicalDirectiveVi,
      );
    }

    // 2. Real-World Danger -> Justified Exit
    if (analysis.safetyScreen.isRealWorldDangerOrVictimization) {
      return current.copyWith(
        phase: SessionPhase.phase4CloseAndSave,
        pushbackLevel: PushbackLevel.off,
        preIntensity: preIntensity,
        moodPolarity: moodPolarity,
        energyLevel: energyLevel,
        emotions: emotions,
        hrvContext: hrvContext,
        finalOutcome: SessionOutcome.justifiedExit,
        clinicalBannerMessageVi: analysis.safetyScreen.clinicalDirectiveVi,
      );
    }

    // 3. Acute Distress (Intensity >= 8/10) or Bipolar Mixed State -> DBT TIPP Portal
    if (analysis.safetyScreen.requiresTippBeforeCbt) {
      return current.copyWith(
        phase: SessionPhase.acuteTippPortal,
        selectedTechnique: TechniqueSlug.tipp,
        pushbackLevel: PushbackLevel.off,
        preIntensity: preIntensity,
        moodPolarity: moodPolarity,
        energyLevel: energyLevel,
        emotions: emotions,
        hrvContext: hrvContext,
        negativeDistortionsIdentified: negCodes,
        positiveDistortionsIdentified: posCodes,
        selfDefeatingBeliefsIdentified: sdbCodes,
        clinicalBannerMessageVi: analysis.safetyScreen.clinicalDirectiveVi,
      );
    }

    // 4. Arousal-Based Technique Recommendation ("DBT-First, CBT-Second")
    late final TechniqueSlug recommendedTechnique;
    if (moodPolarity >= 2 || asrmScore >= 6 || posCodes.isNotEmpty) {
      recommendedTechnique = TechniqueSlug.hypomaniaDevilsAdvocate;
    } else if (preIntensity >= 6) {
      // Orange Zone (5-7/10): DBT Emotion Regulation / Mindfulness
      recommendedTechnique = TechniqueSlug.oppositeAction;
    } else if (moodPolarity <= -2) {
      recommendedTechnique = TechniqueSlug.behavioralActivation;
    } else {
      recommendedTechnique = TechniqueSlug.thoughtRecord;
    }

    return current.copyWith(
      phase: SessionPhase.phase2TechniqueSelection,
      selectedTechnique: recommendedTechnique,
      shameProtocolActive: analysis.safetyScreen.triggersShameProtocol,
      preIntensity: preIntensity,
      moodPolarity: moodPolarity,
      energyLevel: energyLevel,
      emotions: emotions,
      hrvContext: hrvContext,
      negativeDistortionsIdentified: negCodes,
      positiveDistortionsIdentified: posCodes,
      selfDefeatingBeliefsIdentified: sdbCodes,
      clinicalBannerMessageVi: analysis.safetyScreen.clinicalDirectiveVi,
    );
  }

  /// Evaluates Socratic Pushback when the user tries to skip or gives a minimal response.
  /// Enforces Zone rules:
  /// - `PushbackZone.none` or `PushbackZone.closing` or `shameProtocolActive` -> ALWAYS 0 nudges (`off`).
  /// - `PushbackZone.supportive` -> at most 1 gentle nudge regardless of level.
  /// - `PushbackZone.core` -> up to `pushbackLevel.maxNudgesInCoreZone` (0, 1, 2, or 3).
  PushbackDecision evaluateStepSkipOrShallowInput({
    required SessionStateSnapshot state,
    required ProtocolStepDefinition step,
  }) {
    if (state.shameProtocolActive ||
        step.isClinicalSafetyGate ||
        step.zone == PushbackZone.none ||
        step.zone == PushbackZone.closing ||
        state.pushbackLevel == PushbackLevel.off ||
        state.selectedTechnique == TechniqueSlug.tipp) {
      return const PushbackDecision(
        allowImmediateAdvance: true,
        nudgeAttemptNumber: 0,
        effectiveLevel: PushbackLevel.off,
      );
    }

    final int maxAllowedNudges = step.zone == PushbackZone.supportive
        ? 1
        : state.pushbackLevel.maxNudgesInCoreZone;

    if (state.currentStepPushbackCount >= maxAllowedNudges) {
      // Always yield gracefully once max nudges for this step have been reached
      return PushbackDecision(
        allowImmediateAdvance: true,
        nudgeAttemptNumber: state.currentStepPushbackCount,
        effectiveLevel: state.pushbackLevel,
      );
    }

    final nextAttempt = state.currentStepPushbackCount + 1;
    late final String promptVi;
    late final String promptEn;

    if (nextAttempt == 1) {
      promptVi =
          '[Gợi mở Socratic Lần 1] "${step.titleVi}" thường mang lại chuyển hóa lớn nhất. Bạn có muốn thử tìm dù chỉ 1 ý nhỏ trước khi đi tiếp không?';
      promptEn =
          '[Socratic Nudge 1] "${step.titleEn}" often brings the biggest shift. Would you be willing to try jotting down just one small point?';
    } else if (nextAttempt == 2) {
      promptVi =
          '[Gợi mở Socratic Lần 2 — Tiêu chuẩn kép] Nếu một người bạn thân nhất của bạn đang ở đúng hoàn cảnh này, bạn sẽ nhìn nhận hoặc nói với họ điều gì ở bước này?';
      promptEn =
          '[Socratic Nudge 2 — Double Standard] If your closest friend were in this exact situation, what perspective would you offer them on this step?';
    } else {
      promptVi =
          '[Gợi mở Socratic Lần 3 — Khám phá Kháng cự TEAM-CBT] Điều gì khiến việc ngồi lại với bước này trở nên khó khăn với bạn lúc này? Chúng ta có thể tôn trọng điều đó hoặc thử 1 góc nhìn nhỏ.';
      promptEn =
          '[Socratic Nudge 3 — TEAM-CBT Resistance Inquiry] What makes sitting with this step feel difficult right now?';
    }

    return PushbackDecision(
      allowImmediateAdvance: false,
      nudgeAttemptNumber: nextAttempt,
      effectiveLevel: state.pushbackLevel,
      socraticPromptVi: promptVi,
      socraticPromptEn: promptEn,
    );
  }

  /// Thought Record Accuracy Check (between Step 5 and Step 6).
  /// If the thought is an objective fact (`isThoughtObjectivelyAccurate == true`),
  /// halts cognitive restructuring immediately with `outcome: accurate-thought-exit`
  /// and branches to Problem-Solving, Coping, or Split.
  SessionStateSnapshot evaluateAccuracyCheck({
    required SessionStateSnapshot state,
    required bool isThoughtObjectivelyAccurate,
    String chosenBranch = 'problem_solving', // 'problem_solving' | 'coping' | 'split'
  }) {
    if (!isThoughtObjectivelyAccurate) {
      return state.copyWith(
        currentStepIndex: state.currentStepIndex + 1,
        currentStepPushbackCount: 0,
      );
    }

    final updatedPayload = Map<String, dynamic>.from(state.stepResponses)
      ..['accuracy_check'] = 'accurate_fact'
      ..['accurate_branch'] = chosenBranch;

    return state.copyWith(
      phase: SessionPhase.phase4CloseAndSave,
      pushbackLevel: PushbackLevel.off,
      stepResponses: updatedPayload,
      finalOutcome: SessionOutcome.accurateThoughtExit,
      clinicalBannerMessageVi:
          'THOÁT AN TOÀN LÂM SÀNG (ACCURACY CHECK): Suy nghĩ của bạn phản ánh một sự thật/mất mát khách quan. '
          'Ứng dụng dừng việc tìm bằng chứng phản bác để tránh "tích cực độc hại" và chuyển sang hướng Hỗ trợ Thực tế ($chosenBranch).',
    );
  }

  /// Behavioral Activation Step 2 Rest Check.
  /// Never uses pushback. If the user is biologically exhausted/ill/grieving,
  /// schedules Deliberate Guilt-Free Rest and closes with `outcome: justified-exit`.
  SessionStateSnapshot evaluateRestCheck({
    required SessionStateSnapshot state,
    required bool needsBiologicalRecoveryRest,
    String restWindowPlan = 'Nghỉ ngơi chủ động không áy náy từ 21:00 đến 06:30',
  }) {
    if (!needsBiologicalRecoveryRest) {
      return state.copyWith(
        currentStepIndex: state.currentStepIndex + 1,
        currentStepPushbackCount: 0,
      );
    }

    final updatedPayload = Map<String, dynamic>.from(state.stepResponses)
      ..['rest_check'] = 'biological_recovery_needed'
      ..['deliberate_guilt_free_rest_plan'] = restWindowPlan;

    return state.copyWith(
      phase: SessionPhase.phase4CloseAndSave,
      pushbackLevel: PushbackLevel.off,
      stepResponses: updatedPayload,
      finalOutcome: SessionOutcome.justifiedExit,
      clinicalBannerMessageVi:
          'NGHỈ NGƠI CHỦ ĐỘNG KHÔNG ÁY NÁY (REST CHECK): Cơ thể bạn đang cần phục hồi sinh học thực sự. '
          'Kế hoạch hôm nay là nghỉ ngơi trọn vẹn có giờ bắt đầu và kết thúc rõ ràng ($restWindowPlan).',
    );
  }

  /// Opposite Action Step 3 Justified Check.
  /// If the action urge is justified by real-world danger or objective facts,
  /// turns off pushback and exits with `outcome: justified-exit`.
  SessionStateSnapshot evaluateJustifiedCheck({
    required SessionStateSnapshot state,
    required bool isActionUrgeJustifiedByFactsOrDanger,
  }) {
    if (!isActionUrgeJustifiedByFactsOrDanger) {
      return state.copyWith(
        currentStepIndex: state.currentStepIndex + 1,
        currentStepPushbackCount: 0,
      );
    }

    final updatedPayload = Map<String, dynamic>.from(state.stepResponses)
      ..['justified_check'] = 'urge_justified_by_facts';

    return state.copyWith(
      phase: SessionPhase.phase4CloseAndSave,
      pushbackLevel: PushbackLevel.off,
      stepResponses: updatedPayload,
      finalOutcome: SessionOutcome.justifiedExit,
      clinicalBannerMessageVi:
          'XÁC NHẬN THÔI THÚC CHÍNH ĐÁNG (JUSTIFIED CHECK): Cảm xúc và thôi thúc bảo vệ bản thân của bạn hoàn toàn phù hợp với thực tế. '
          'Không làm ngược lại; chuyển sang Hành động Khéo léo & Bảo vệ An toàn.',
    );
  }

  /// Chain Analysis Step 1 Hard Stops & Shame Protocol.
  /// Hard Stop 1: Target behavior involves self-harm / suicidal act -> immediate `safety-stop`.
  /// Hard Stop 2: User is the victim of another person's abuse/harm -> `justified-exit`.
  /// Shame Protocol: If intense self-hatred/shame appears, turns off pushback immediately.
  SessionStateSnapshot evaluateChainAnalysisTarget({
    required SessionStateSnapshot state,
    required String targetBehaviorDescription,
  }) {
    final screen = detector.evaluateFourLayerSafetyGate(
      text: targetBehaviorDescription,
      preIntensity: state.preIntensity,
      moodPolarity: state.moodPolarity,
      energyLevel: state.energyLevel,
    );

    if (screen.requiresImmediateSafetyStop ||
        screen.isSelfHarmTargetForChainAnalysis) {
      return state.copyWith(
        phase: SessionPhase.safetyStopTerminal,
        pushbackLevel: PushbackLevel.off,
        finalOutcome: SessionOutcome.safetyStop,
        clinicalBannerMessageVi:
            'CỔNG CHẶN CỨNG CHAIN ANALYSIS (HARD STOP 1): Tuyệt đối không tự chạy Phân tích Chuỗi Hành vi trên hành vi tự hại/tự sát khi không có nhà trị liệu DBT bên cạnh.',
      );
    }

    if (screen.isRealWorldDangerOrVictimization) {
      return state.copyWith(
        phase: SessionPhase.phase4CloseAndSave,
        pushbackLevel: PushbackLevel.off,
        finalOutcome: SessionOutcome.justifiedExit,
        clinicalBannerMessageVi:
            'CỔNG CHẶN CỨNG CHAIN ANALYSIS (HARD STOP 2): Việc người khác xâm hại hoặc đối xử tệ với bạn không phải là lỗi hay chuỗi hành vi của bạn.',
      );
    }

    final updatedPayload = Map<String, dynamic>.from(state.stepResponses)
      ..['step_1_target_behavior'] = targetBehaviorDescription;

    return state.copyWith(
      shameProtocolActive:
          state.shameProtocolActive || screen.triggersShameProtocol,
      pushbackLevel: (state.shameProtocolActive || screen.triggersShameProtocol)
          ? PushbackLevel.off
          : state.pushbackLevel,
      stepResponses: updatedPayload,
      currentStepIndex: state.currentStepIndex + 1,
      currentStepPushbackCount: 0,
      clinicalBannerMessageVi: screen.triggersShameProtocol
          ? 'GIAO THỨC BẢO VỆ CẢM GIÁC XẤU HỔ (SHAME PROTOCOL): Hệ thống đã tắt toàn bộ Pushback. Chúng ta cùng nhìn nhận mắt xích với sự tò mò ấm áp, không phán xét.'
          : state.clinicalBannerMessageVi,
    );
  }

  /// Wise Mind Step 3 Harsh Self-Critic Guard.
  /// Detects when self-attack masquerades as "Reasonable Mind".
  bool detectsHarshSelfCriticMasqueradingAsReason(String reasonableMindInput) {
    final analysis = detector.analyzeText(text: reasonableMindInput);
    return analysis.negativeDistortions.any(
      (d) =>
          d.code == 'labeling' ||
          d.code == 'all_or_nothing' ||
          d.code == 'personalization_and_blame',
    );
  }

  /// Exports a completed or safely exited session to standard YAML-frontmatter Markdown
  /// (`YYYYMMDD-[technique]-NN.md`) compatible with Obsidian, Notion, and `glebis/claude-cognitive-toolkit`.
  String exportSessionToMarkdown({
    required CognitiveToolkitSession session,
    int sequenceNumberForDay = 1,
  }) {
    final compactDate = session.date.replaceAll('-', '');
    final seqStr = sequenceNumberForDay.toString().padLeft(2, '0');
    final fileName = '$compactDate-${session.technique.slug}-$seqStr.md';

    final buffer = StringBuffer()
      ..writeln('---')
      ..writeln('id: "${session.id}"')
      ..writeln('filename: "$fileName"')
      ..writeln('type: "cognitive-toolkit-session"')
      ..writeln('technique: "${session.technique.slug}"')
      ..writeln('date: "${session.date}"')
      ..writeln('time: "${session.time}"')
      ..writeln('channel: "${session.channel}"')
      ..writeln('language: "${session.language}"')
      ..writeln('pushback_level: "${session.pushbackLevel.code}"')
      ..writeln('pre_intensity: ${session.preIntensity}')
      ..writeln('post_intensity: ${session.postIntensity ?? session.preIntensity}')
      ..writeln('intensity_delta: ${session.intensityDelta ?? 0}')
      ..writeln('mood_polarity_at_start: ${session.moodPolarityAtStart ?? 0}')
      ..writeln('emotions: [${session.emotions.map((e) => '"$e"').join(', ')}]')
      ..writeln(
        'negative_distortions: [${session.negativeDistortionsIdentified.map((e) => '"$e"').join(', ')}]',
      )
      ..writeln(
        'positive_distortions: [${session.positiveDistortionsIdentified.map((e) => '"$e"').join(', ')}]',
      )
      ..writeln('steps_completed: ${session.stepsCompleted}')
      ..writeln(
        'steps_skipped: [${session.stepsSkipped.map((e) => '"$e"').join(', ')}]',
      )
      ..writeln('outcome: "${session.outcome.code}"');
    if (session.hrvContext != null) {
      buffer.writeln('hrv_context: "${session.hrvContext!.code}"');
    }
    buffer
      ..writeln('---')
      ..writeln()
      ..writeln('# ${session.technique.titleVi}')
      ..writeln()
      ..writeln('- **Ngày giờ:** ${session.date} ${session.time}')
      ..writeln('- **Kết quả phiên (Outcome):** `${session.outcome.code}`')
      ..writeln(
        '- **Cường độ cảm xúc:** ${session.preIntensity}/10 → ${session.postIntensity ?? session.preIntensity}/10 (Δ = ${session.intensityDelta ?? 0})',
      )
      ..writeln();

    if (session.structuredStepsPayload.isNotEmpty) {
      buffer.writeln('## Chi tiết Các Bước Thực hành');
      session.structuredStepsPayload.forEach((key, value) {
        buffer.writeln('- **$key:** $value');
      });
      buffer.writeln();
    }

    if (session.takeaway != null && session.takeaway!.isNotEmpty) {
      buffer
        ..writeln('## Điểm Đúc kết (Takeaway)')
        ..writeln('> ${session.takeaway}');
    }

    return buffer.toString();
  }
}
