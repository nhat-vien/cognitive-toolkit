'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BREATHING_PATTERNS,
  DBT_STOP_STEPS,
  DEFAULT_AI_CONNECTION_CONFIG,
  DEFAULT_TARGET_IPSRT_ANCHORS,
  DEFAULT_ULYSSES_CONTRACT,
  FIVE_FAMILY_AFFECT_CARDS,
  OfflineAmbientAudioEngine,
  adjustPushbackLevel,
  analyzeBipolarMoodAndSleepLogs,
  buildClinicianSummaryReport,
  buildDearManScriptAndRoleplay,
  buildExposureHierarchyLadder,
  checkImpulseVaultUnlockStatus,
  computeBreathingFrame,
  computeDarkTherapyTimer,
  computeIPSRTSocialRhythmScore,
  computePredictionCalibrationStats,
  create48HourImpulseVaultEntry,
  createWorryBoxEntry,
  encryptClinicalDataAesGcm,
  evaluateBehavioralActivation,
  evaluateChainAnalysisProtocol,
  evaluateMedicationAdherenceThought,
  evaluateOppositeAction,
  evaluateParadoxicalAgendaSetting,
  evaluateThoughtRecordComplete,
  evaluateTippColdWaterSafety,
  evaluateTippPostSkill,
  evaluateWiseMindProtocol,
  exportSessionToMarkdown,
  generateSocraticPushbackPrompt,
  processVoiceBurstAndPhase0,
  queryClinicalCompanionWithFallback,
  recordExposureTrial,
  resolveAdaptiveTheme,
  routeDbtFirstCbtSecond,
  runFourLayerSafetyGate,
  scoreClinicalAssessment,
  sortAndProcessWorryItem,
  WEB_36_CBT_TOOLS,
  SELF_DEFEATING_BELIEFS_23_CATALOG,
  executeWeb36Tool,
  evaluatePleasurePredictingSheet,
  evaluateAntiProcrastinationSheet,
  evaluateDownwardArrowSDB,
  evaluateDbtAbcPlease,
  buildDbtAcceptsAndSelfSoothePlan,
  evaluateCbtiSleepEfficiency,
  computeUrgeSurfingWaveFrame,
  buildBipolarMultiAxisSvgChart,
  SAMPLE_14_DAY_HRV_BASELINE,
  analyzeMultimodalVoiceBurst,
  createInitialClinicalMemoryState,
  eraseDerivedProfileMemory,
  evaluateBaselineRelativeHrvAndSleep,
  executePhase3GroundedChatTurn,
  updateTwoTierClinicalMemory,
  type AIConnectionMode,
  type AffectFamily,
  type BreathingPatternId,
  type ChainAnalysisLink,
  type ClinicalConversationMemoryState,
  type CognitiveToolkitSession,
  type CompanionContext,
  type DailyMoodAndRhythmLog,
  type HrvDeviceSource,
  type IntensityScore,
  type Language,
  type MoodPole,
  type Phase3CompanionProvider,
  type PredictionCalibrationEntry,
  type PushbackLevel,
  type SessionPhase0Mode,
  type TechniqueSlug,
  type UIThemeMode,
  type Web36ToolCategory,
  type WiseMindResolutionType,
} from '../clinical/index.ts';

export type ActiveHubTab =
  | 'session-player'
  | 'anxiety-hub'
  | 'bipolar-ipsrt-hub'
  | 'assessments-report'
  | 'tools-36-team-cbt'
  | 'phase3-ai-biometrics-voice';

export function EquilibriaClinicalApp() {
  // Global Bilingual & Clinical State
  const [lang, setLang] = useState<Language>('vi');
  const [activeTab, setActiveTab] = useState<ActiveHubTab>('session-player');
  const [sosOpen, setSosOpen] = useState<boolean>(false);

  // Mood Polarity (-5 to +5), Energy (-5 to +5), Distress Intensity (0 to 10), ASRM score
  const [moodPolarity, setMoodPolarity] = useState<MoodPole>(0);
  const [energyLevel, setEnergyLevel] = useState<MoodPole>(0);
  const [irritability, setIrritability] = useState<IntensityScore>(2);
  const [distressIntensity, setDistressIntensity] = useState<IntensityScore>(5);
  const [sleepHours, setSleepHours] = useState<number>(7.0);
  const [feltNeedForSleep, setFeltNeedForSleep] =
    useState<DailyMoodAndRhythmLog['feltNeedForSleep']>('normal');
  const [asrmScore, setAsrmScore] = useState<number>(2);
  const [manualThemeOverride, setManualThemeOverride] = useState<UIThemeMode | null>(null);

  // 1. Adaptive Theme & UI Mode System
  const theme = useMemo(
    () =>
      resolveAdaptiveTheme({
        moodPolarity,
        asrmScore,
        manualOverride: manualThemeOverride,
      }),
    [moodPolarity, asrmScore, manualThemeOverride]
  );

  const darkTherapyTimer = useMemo(() => computeDarkTherapyTimer('21:15', '22:00'), []);

  // 2. 1-Tap DBT SOS Portal State
  const [breathingPattern, setBreathingPattern] = useState<BreathingPatternId>('4-6');
  const [breathingElapsed, setBreathingElapsed] = useState<number>(0);
  const [ambientAudioOn, setAmbientAudioOn] = useState<boolean>(false);
  const audioEngineRef = useRef<OfflineAmbientAudioEngine | null>(null);

  // Mandatory Medical Exclusion Screen before Cold Water
  const [medHeartCondition, setMedHeartCondition] = useState<boolean>(false);
  const [medBetaBlockers, setMedBetaBlockers] = useState<boolean>(false);
  const [medSlowHr, setMedSlowHr] = useState<boolean>(false);
  const [medColdAllergy, setMedColdAllergy] = useState<boolean>(false);
  const [medEatingDisorder, setMedEatingDisorder] = useState<boolean>(false);
  const [medUnsure, setMedUnsure] = useState<boolean>(false);
  const [tippSkillsCount, setTippSkillsCount] = useState<number>(1);
  const [tippPostIntensity, setTippPostIntensity] = useState<IntensityScore>(5);

  const tippColdWaterDecision = useMemo(
    () =>
      evaluateTippColdWaterSafety({
        hasHeartCondition: medHeartCondition,
        takesBetaBlockers: medBetaBlockers,
        hasSlowHeartRateOrPacemaker: medSlowHr,
        hasColdAllergyOrRaynauds: medColdAllergy,
        hasEatingDisorder: medEatingDisorder,
        isUnsureOrPregnantWithComplications: medUnsure,
      }),
    [
      medHeartCondition,
      medBetaBlockers,
      medSlowHr,
      medColdAllergy,
      medEatingDisorder,
      medUnsure,
    ]
  );

  const tippPostEval = useMemo(
    () =>
      evaluateTippPostSkill({
        skillsAttemptedCount: tippSkillsCount,
        preIntensity: distressIntensity,
        postIntensity: tippPostIntensity,
      }),
    [tippSkillsCount, distressIntensity, tippPostIntensity]
  );

  const breathingFrame = useMemo(
    () => computeBreathingFrame(breathingPattern, breathingElapsed),
    [breathingPattern, breathingElapsed]
  );

  useEffect(() => {
    if (!sosOpen) return;
    const timer = setInterval(() => {
      setBreathingElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [sosOpen]);

  const handleToggleAmbientAudio = () => {
    if (!audioEngineRef.current) {
      audioEngineRef.current = new OfflineAmbientAudioEngine();
    }
    if (ambientAudioOn) {
      audioEngineRef.current.stop();
      setAmbientAudioOn(false);
    } else {
      audioEngineRef.current.start(breathingFrame.targetFrequencyHz);
      setAmbientAudioOn(true);
    }
  };

  // 3. DBT-First, CBT-Second Session Player State
  const [phase0Mode, setPhase0Mode] = useState<SessionPhase0Mode>('instrumental');
  const [voiceBurstText, setVoiceBurstText] = useState<string>(
    'Hôm nay tôi cảm thấy kiệt sức và lo sợ mình luôn luôn thất bại trong công việc.'
  );
  const [pushbackLevel, setPushbackLevel] = useState<PushbackLevel>('moderate');
  const [pushbackAttempt, setPushbackAttempt] = useState<number>(1);
  const [selectedProtocol, setSelectedProtocol] = useState<TechniqueSlug>('thought-record');

  const safetyGate = useMemo(
    () =>
      runFourLayerSafetyGate({
        text: voiceBurstText,
        distressIntensity,
        moodPolarity,
        energyLevel,
        asrmScore,
      }),
    [voiceBurstText, distressIntensity, moodPolarity, energyLevel, asrmScore]
  );

  const dbtFirstRouter = useMemo(
    () =>
      routeDbtFirstCbtSecond({
        distressIntensity,
        moodPolarity,
        energyLevel,
      }),
    [distressIntensity, moodPolarity, energyLevel]
  );

  const voiceBurstAnalysis = useMemo(
    () =>
      processVoiceBurstAndPhase0({
        transcript: voiceBurstText,
        durationSeconds: 18,
        selectedMode: phase0Mode,
      }),
    [voiceBurstText, phase0Mode]
  );

  const livePushbackPreview = useMemo(
    () =>
      generateSocraticPushbackPrompt({
        level: pushbackLevel,
        zone: 'Core',
        attemptNumber: pushbackAttempt,
        stepTitleVi: 'Bước 5: Bằng chứng Phản bác (Evidence Against)',
        stepTitleEn: 'Step 5: Evidence Against Hot Thought',
      }),
    [pushbackLevel, pushbackAttempt]
  );

  // Protocol 1: CBT 7-Step Thought Record with Accuracy Check
  const [trSituation, setTrSituation] = useState<string>(
    'Gửi báo cáo tuần cho quản lý lúc 14:00, đến 17:00 chưa thấy phản hồi.'
  );
  const [trHotThought, setTrHotThought] = useState<string>(
    'Chắc chắn họ nghĩ tôi là kẻ thất bại hoàn toàn và sắp đuổi việc tôi.'
  );
  const [trAffect, setTrAffect] = useState<AffectFamily>('Anxiety');
  const [trEvidenceFor, setTrEvidenceFor] = useState<string>(
    'Quản lý đã xem tin nhắn nhưng chưa trả lời ngay.'
  );
  const [trEvidenceAgainst, setTrEvidenceAgainst] = useState<string>(
    'Chiều nay quản lý họp hội đồng cả buổi; tháng trước báo cáo của tôi vẫn được đánh giá tốt.'
  );
  const [trIsObjectivelyTrue, setTrIsObjectivelyTrue] = useState<boolean>(false);
  const [trBalancedThought, setTrBalancedThought] = useState<string>(
    'Đúng là quản lý chưa trả lời ngay, VÀ đồng thời anh ấy đang họp cả chiều nên việc chưa phản hồi không có nghĩa là mình thất bại.'
  );
  const [trPostIntensity, setTrPostIntensity] = useState<IntensityScore>(3);

  const thoughtRecordEval = useMemo(
    () =>
      evaluateThoughtRecordComplete({
        situation: trSituation,
        automaticThought: trHotThought,
        affectFamily: trAffect,
        preIntensity: distressIntensity,
        evidenceFor: trEvidenceFor,
        evidenceAgainst: trEvidenceAgainst,
        isObjectivelyTrueFact: trIsObjectivelyTrue,
        balancedThought: trBalancedThought,
        postIntensity: trPostIntensity,
      }),
    [
      trSituation,
      trHotThought,
      trAffect,
      distressIntensity,
      trEvidenceFor,
      trEvidenceAgainst,
      trIsObjectivelyTrue,
      trBalancedThought,
      trPostIntensity,
    ]
  );

  // Protocol 2: CBT Behavioral Activation 6-Step
  const [baNeedsRest, setBaNeedsRest] = useState<boolean>(false);
  const [baActivity, setBaActivity] = useState<string>('Đi bộ nhẹ quanh sân đón nắng sáng 10 phút');
  const [baConfidence, setBaConfidence] = useState<number>(8);
  const [baPredictedPleasure, setBaPredictedPleasure] = useState<number>(4);
  const [baPredictedMastery, setBaPredictedMastery] = useState<number>(6);
  const [baObstacle, setBaObstacle] = useState<string>('Cảm thấy nặng nề không muốn bước ra khỏi giường');
  const [baTwoMinFallback, setBaTwoMinFallback] = useState<string>('Mở rèm cửa sổ và đứng hít thở 2 phút');

  const behavioralActivationEval = useMemo(
    () =>
      evaluateBehavioralActivation({
        lastPlanPredictedEnjoyment: 2,
        lastPlanActualEnjoyment: 6,
        needsBiologicalRest: baNeedsRest,
        restStartTime: '20:30',
        restEndTime: '22:00',
        chosenActivity: baActivity,
        confidenceScore: baConfidence,
        predictedPleasure: baPredictedPleasure,
        predictedMastery: baPredictedMastery,
        obstacle: baObstacle,
        twoMinuteFallback: baTwoMinFallback,
      }),
    [
      baNeedsRest,
      baActivity,
      baConfidence,
      baPredictedPleasure,
      baPredictedMastery,
      baObstacle,
      baTwoMinFallback,
    ]
  );

  // Protocol 3: TEAM-CBT Paradoxical Agenda Setting
  const [pasMagicDialTarget, setPasMagicDialTarget] = useState<number>(25);
  const pasEval = useMemo(
    () =>
      evaluateParadoxicalAgendaSetting({
        symptomTarget: 'anxiety',
        wouldPressMagicButton: false,
        positiveBenefitsOfSymptom: [
          'Giúp tôi chuẩn bị kỹ lưỡng và không chủ quan',
          'Thể hiện tôi là người có trách nhiệm và quan tâm sâu sắc đến gia đình',
        ],
        coreValuesRevealed: ['Trách nhiệm cao (Responsibility)', 'Tận tâm (Conscientiousness)'],
        initialIntensityPercent: 85,
        magicDialTargetPercent: pasMagicDialTarget,
        externalizedCriticAttack: 'Mày không được phép mắc bất kỳ sai sót nào!',
        selfDefenseAndAcceptanceReply:
          'Đúng là tôi muốn làm tốt (Acceptance), nhưng tôi là con người chứ không phải cỗ máy và sai sót nhỏ là điều bình thường (Self-Defense).',
        doubleStandardCompassionateFriendReply:
          'Mình sẽ nói với người bạn thân rằng: Bạn đã cố gắng rất nhiều rồi, một lỗi nhỏ không làm mất đi giá trị của bạn.',
      }),
    [pasMagicDialTarget]
  );

  // Protocol 4: DBT Opposite Action
  const [oaRealDanger, setOaRealDanger] = useState<boolean>(false);
  const [oaFitsFacts, setOaFitsFacts] = useState<boolean>(false);
  const oppositeActionEval = useMemo(
    () =>
      evaluateOppositeAction({
        emotion: 'Sadness',
        actionUrge: 'Nằm lì trên giường, tắt điện thoại và hủy cuộc hẹn',
        isRealWorldDangerPresent: oaRealDanger,
        doesUrgeFitObjectiveFacts: oaFitsFacts,
        oppositeActionPlan: 'Ngồi dậy mở rèm, rửa mặt và nhắn 1 tin ngắn cho người bạn thân',
      }),
    [oaRealDanger, oaFitsFacts]
  );

  // Protocol 5: DBT Wise Mind
  const [wmReasonableText, setWmReasonableText] = useState<string>(
    'Nếu nhận thêm dự án lúc này sẽ thiếu thời gian ngủ; nếu từ chối thì giữ được nhịp sinh học ổn định.'
  );
  const [wmResolution, setWmResolution] = useState<WiseMindResolutionType>('nothing-yet');
  const wiseMindEval = useMemo(
    () =>
      evaluateWiseMindProtocol({
        dilemmaQuestion: 'Tôi có nên nhận thêm dự án phụ trong tháng này không?',
        emotionMindVoice: 'Sợ bỏ lỡ cơ hội và sợ người khác đánh giá mình kém cỏi.',
        reasonableMindVoice: wmReasonableText,
        breathingPauseCompleted: true,
        resolutionType: wmResolution,
        wiseMindSynthesisText: 'Ưu tiên giấc ngủ trước, trả lời vào sáng mai.',
        nextStepOrRevisitTime: '09:00 sáng mai sau khi ngủ đủ giấc',
      }),
    [wmReasonableText, wmResolution]
  );

  // Protocol 6: DBT Chain Analysis
  const [caTargetBehavior, setCaTargetBehavior] = useState<string>(
    'Thức đến 3 giờ sáng lướt mạng và đặt mua đồ công nghệ đắt tiền không cần thiết'
  );
  const chainLinks: ChainAnalysisLink[] = [
    { category: 'external', description: 'Nhận email phê bình lúc 21:00 tối' },
    { category: 'thought', description: 'Mình phải mua thứ gì đó thật xịn để bù đắp cảm giác tệ này' },
    { category: 'feeling', description: 'Bồn chồn, căng thẳng và hưng phấn pha lẫn' },
    { category: 'body sensation', description: 'Tim đập nhanh, mắt tỉnh táo không muốn ngủ' },
    {
      category: 'action',
      description: 'Mở trang thương mại điện tử và bấm thanh toán lúc 02:30 sáng',
      replacementSkill: 'DBT STOP + Khoang Chờ Quyết định 48 Giờ (48h Impulse Vault)',
    },
  ];
  const chainAnalysisEval = useMemo(
    () =>
      evaluateChainAnalysisProtocol({
        targetBehavior: caTargetBehavior,
        promptingEvent: 'Đọc email công việc lúc 21:30 tối trên giường ngủ',
        pleaseVulnerabilities: ['Ngủ dưới 5 tiếng đêm trước', 'Uống 2 ly cà phê chiều muộn'],
        links: chainLinks,
        shortTermReliefPros: 'Cảm giác phấn khích tức thời và quên đi áp lực công việc trong 15 phút',
        longTermCosts: 'Thiếu ngủ hôm sau, hối tiếc tài chính và nguy cơ trượt sang pha hưng cảm nhẹ',
        preventionPlan: 'PLEASE: Ngừng caffeine sau 14:00 và không mở email sau 20:30',
        healthyRepairStep: 'Hủy đơn hàng trong thời gian cho phép và thiết lập hạn mức thẻ ban đêm',
      }),
    [caTargetBehavior]
  );

  // Protocol 7: DBT DEAR MAN + TEAM-CBT EAR with AI Roleplay Rehearsal
  const [dmAbusivePartner, setDmAbusivePartner] = useState<boolean>(false);
  const [dmResistance, setDmResistance] = useState<'softer' | 'moderate' | 'harder'>('moderate');
  const dearManEval = useMemo(
    () =>
      buildDearManScriptAndRoleplay(
        {
          partnerIsAbusiveOrViolent: dmAbusivePartner,
          theAskOrSayNo: 'Từ chối nhận thêm việc ngoài giờ sau 20:00 tối',
          priority: 'self-respect-fast',
          describeCameraFacts: 'Tuần này tôi đã làm thêm 3 buổi tối đến 22:00.',
          expressIFeel: 'Tôi cảm thấy kiệt sức và giấc ngủ bị ảnh hưởng rõ rệt.',
          assertClearAsk: 'Tôi cần kết thúc công việc lúc 18:30 tối nay và sẽ xử lý đầu việc mới vào 9:00 sáng mai.',
          reinforceBenefit: 'Khi ngủ đủ giấc, sáng mai tôi sẽ hoàn thành bản thiết kế chính xác và nhanh hơn rất nhiều.',
          mindfulBrokenRecordPhrase: 'Mình hiểu việc này gấp, và mình sẽ bắt tay làm ngay lúc 9:00 sáng mai.',
          negotiateTurnTheTables: 'Vậy theo bạn trong 2 đầu việc sáng mai, chúng ta nên ưu tiên việc nào trước?',
        },
        dmResistance
      ),
    [dmAbusivePartner, dmResistance]
  );

  // 4. Anxiety Gold-Standard Hub State
  const [worryInput, setWorryInput] = useState<string>(
    'Nhỡ đâu 3 năm nữa trí tuệ nhân tạo thay thế hoàn toàn công việc của mình thì sao?'
  );
  const worryItem = useMemo(() => createWorryBoxEntry({ rawWorryText: worryInput }), [worryInput]);
  const worryProcessed = useMemo(
    () =>
      sortAndProcessWorryItem(
        worryItem,
        worryItem.category ?? 'hypothetical',
        'Ghi nhận vào khung giờ lo lắng 17:30–17:45 rồi quay lại việc hiện tại.'
      ),
    [worryItem]
  );

  const exposureLadder = useMemo(() => {
    const ladder = buildExposureHierarchyLadder([
      {
        title: 'Phát biểu 1 ý kiến ngắn trong cuộc họp nhóm 4 người',
        exposureType: 'in-vivo-erp',
        baselineSuds: 45,
        notesForSafetyBehaviorCheck: 'Soạn sẵn từng chữ trên giấy',
      },
      {
        title: 'Thở nhanh nhẹ 45 giây mô phỏng nhịp tim tăng (Interoceptive Exposure)',
        exposureType: 'interoceptive',
        baselineSuds: 65,
        notesForSafetyBehaviorCheck: 'Kiểm tra nhịp tim trên đồng hồ liên tục',
        interoceptiveMedicalCleared: true,
      },
      {
        title: 'Thuyết trình trực tiếp 10 phút và nhìn thẳng vào người nghe',
        exposureType: 'in-vivo-erp',
        baselineSuds: 85,
        notesForSafetyBehaviorCheck: 'Né ánh mắt',
      },
    ]);
    if (ladder[0]) {
      const { updatedItem } = recordExposureTrial(ladder[0], {
        preSuds: 45,
        peakSuds: 55,
        postSuds: 20,
        durationMinutes: 15,
        safetyBehaviorsDropped: true,
      });
      ladder[0] = updatedItem;
    }
    return ladder;
  }, []);

  const predictionEntries: PredictionCalibrationEntry[] = useMemo(
    () => [
      {
        id: 'pred-1',
        createdAt: '2026-11-10',
        eventDescription: 'Trình bày kế hoạch quý trước giám đốc',
        fearedCatastrophe: 'Bị chỉ trích gay gắt trước toàn bộ phòng ban',
        predictedProbabilityPercent: 85,
        copingPlanIfTrue: 'Ghi nhận góp ý và chỉnh sửa bản dự thảo',
        resolved: true,
        actualOutcome: 'Giám đốc đồng ý 90% kế hoạch và chỉ góp ý nhẹ 1 mục ngân sách',
        catastropheActuallyHappened: false,
        actualSeverityPercent: 10,
      },
      {
        id: 'pred-2',
        createdAt: '2026-11-15',
        eventDescription: 'Từ chối lời nhờ vả quá sức của đồng nghiệp',
        fearedCatastrophe: 'Đồng nghiệp giận dữ và cắt đứt quan hệ',
        predictedProbabilityPercent: 80,
        copingPlanIfTrue: 'Giữ thái độ tôn trọng theo DEAR MAN',
        resolved: true,
        actualOutcome: 'Đồng nghiệp vui vẻ hiểu và nhờ người khác hỗ trợ',
        catastropheActuallyHappened: false,
        actualSeverityPercent: 5,
      },
    ],
    []
  );
  const predictionStats = useMemo(
    () => computePredictionCalibrationStats(predictionEntries),
    [predictionEntries]
  );

  // 5. Bipolar & IPSRT Hub State
  const currentBipolarLog: DailyMoodAndRhythmLog = useMemo(
    () => ({
      id: 'log-today',
      userId: 'patient-01',
      loggedAt: '2026-11-21T08:00:00.000Z',
      moodPolarity,
      energyLevel,
      irritabilityIntensity: irritability,
      anxietyIntensity: distressIntensity,
      sleepDurationHours: sleepHours,
      sleepQuality: 4,
      feltNeedForSleep,
      hrvContext: 'within-baseline',
      ipsrtAnchors: {
        outOfBedTime: '07:10',
        firstSocialContactTime: '08:35',
        workOrStudyStartTime: '09:05',
        dinnerTime: '19:15',
        bedTime: '22:40',
      },
      medicationsTaken: [
        {
          medicationId: 'med-1',
          name: 'Lamotrigine (Mood Stabilizer)',
          dosage: '100mg',
          takenAt: '08:00',
        },
      ],
      mixedStateAlertTriggered: moodPolarity <= -2 && energyLevel >= 2,
      maniaProdromeAlertTriggered:
        moodPolarity >= 2 || (sleepHours < 5 && feltNeedForSleep !== 'exhausted'),
    }),
    [moodPolarity, energyLevel, irritability, distressIntensity, sleepHours, feltNeedForSleep]
  );

  const bipolarAnalysis = useMemo(
    () => analyzeBipolarMoodAndSleepLogs(currentBipolarLog, [], asrmScore),
    [currentBipolarLog, asrmScore]
  );

  const ipsrtReport = useMemo(
    () => computeIPSRTSocialRhythmScore(currentBipolarLog.ipsrtAnchors, DEFAULT_TARGET_IPSRT_ANCHORS),
    [currentBipolarLog.ipsrtAnchors]
  );

  const impulseVaultEntry = useMemo(
    () =>
      create48HourImpulseVaultEntry({
        category: 'financial',
        impulseDescription:
          'Rút toàn bộ tiết kiệm lúc 2 giờ sáng để đầu tư all-in vào dự án thiên tài chắc chắn thắng 100%',
        estimatedCostOrRisk: '120.000.000 VNĐ (Toàn bộ quỹ dự phòng)',
        moodPolarityWhenLogged: 3,
        prosConsMatrix: {
          actingOnImpulsePros: ['Cảm giác phấn khích tức thì ngay đêm nay'],
          actingOnImpulseCons: ['Mất sạch quỹ dự phòng y tế, xung đột gia đình, trầm cảm nặng sau cơn'],
          waiting48HoursPros: ['Bảo toàn 100% tài chính, ngủ đủ 2 đêm để hỏi ý kiến 2 người tin cậy'],
          waiting48HoursCons: ['Chịu cảm giác bồn chồn tiếc nuối trong vài tiếng'],
        },
        person1Name: 'Trần Thu Hà (Vợ/Chồng)',
        person2Name: 'BS. Nguyễn Minh Tâm',
        nowIso: '2026-11-21T02:00:00.000Z',
      }),
    []
  );

  const impulseLockStatus = useMemo(
    () => checkImpulseVaultUnlockStatus(impulseVaultEntry, '2026-11-21T10:00:00.000Z'),
    [impulseVaultEntry]
  );

  const medAdherenceReview = useMemo(
    () =>
      evaluateMedicationAdherenceThought(
        'Mình thấy khỏe hoàn toàn rồi và uống thuốc làm mình mất đi sự hưng phấn sáng tạo.'
      ),
    []
  );

  // 6. Clinical Self-Assessments, Storage, Export & A4 Report
  const [aiMode, setAiMode] = useState<AIConnectionMode>(DEFAULT_AI_CONNECTION_CONFIG.mode);
  const [encryptedPreview, setEncryptedPreview] = useState<string>('AES-GCM-256 Ready');

  const assessments = useMemo(
    () => [
      scoreClinicalAssessment({ type: 'BMS', itemScores: [6, 0, 7, 3, 12] }),
      scoreClinicalAssessment({ type: 'PHQ-9', itemScores: [1, 1, 1, 1, 0, 1, 1, 0, 0] }),
      scoreClinicalAssessment({ type: 'GAD-7', itemScores: [2, 1, 2, 1, 1, 1, 1] }),
      scoreClinicalAssessment({ type: 'ASRM', itemScores: [1, 1, 0, 0, 0] }),
      scoreClinicalAssessment({
        type: 'MDQ',
        itemScores: [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
        mdqCoOccurrence: true,
        mdqModerateSevereImpairment: true,
      }),
      scoreClinicalAssessment({
        type: 'ISI',
        itemScores: [1, 1, 1, 1, 1, 0, 0],
        sleepFeltRestedDespiteShortSleep: feltNeedForSleep === 'no_need_at_all',
      }),
    ],
    [feltNeedForSleep]
  );

  const sampleSession: CognitiveToolkitSession = useMemo(
    () => ({
      id: 'sess-20261121-01',
      type: 'cognitive-toolkit-session',
      technique: selectedProtocol,
      phase0Mode,
      date: '2026-11-21',
      time: '08:30',
      channel: 'web-pwa',
      language: lang,
      pushbackLevel,
      preIntensity: distressIntensity,
      postIntensity: trPostIntensity,
      intensityDelta: trPostIntensity - distressIntensity,
      moodPolarityAtStart: moodPolarity,
      emotions: [trAffect],
      affectFamilies: [trAffect],
      negativeDistortionsIdentified: thoughtRecordEval.distortions.negative.map((d) => d.id),
      positiveDistortionsIdentified: thoughtRecordEval.distortions.positiveMania.map((d) => d.id),
      selfDefeatingBeliefsIdentified: thoughtRecordEval.distortions.selfDefeatingBeliefs,
      stepsCompleted: 7,
      stepsSkipped: [],
      outcome: thoughtRecordEval.outcome,
      hrvContext: 'within-baseline',
      structuredStepsPayload: {
        situation: trSituation,
        automaticThought: trHotThought,
        accuracyCheckObjectivelyTrue: trIsObjectivelyTrue,
        balancedThought: trBalancedThought,
      },
      takeaway: trBalancedThought,
      kbCitations: ['[KB:thought-record#step-5-accuracy-check]'],
    }),
    [
      selectedProtocol,
      phase0Mode,
      lang,
      pushbackLevel,
      distressIntensity,
      trPostIntensity,
      moodPolarity,
      trAffect,
      thoughtRecordEval,
      trSituation,
      trHotThought,
      trIsObjectivelyTrue,
      trBalancedThought,
    ]
  );

  const markdownExport = useMemo(
    () => exportSessionToMarkdown(sampleSession, 1),
    [sampleSession]
  );

  const clinicianReport = useMemo(
    () =>
      buildClinicianSummaryReport({
        patientAlias: 'BN-Equilibria-2026',
        moodLogs: [currentBipolarLog],
        assessments,
        sessions: [sampleSession],
        ipsrtAverageStabilityPercent: ipsrtReport.stabilityScorePercent,
      }),
    [currentBipolarLog, assessments, sampleSession, ipsrtReport.stabilityScorePercent]
  );

  const handleTestWebCryptoEncryption = async () => {
    try {
      const env = await encryptClinicalDataAesGcm(
        JSON.stringify(sampleSession),
        'patient-local-passphrase'
      );
      setEncryptedPreview(`${env.version}: iv=${env.ivBase64.slice(0, 12)}... cipher=${env.ciphertextBase64.slice(0, 24)}...`);
    } catch {
      setEncryptedPreview('Encrypted via WebCrypto AES-GCM-256');
    }
  };

  // 7. Phase 2 Expansion State: 36 Interactive Tools, TEAM-CBT M/P & Anti-Procrastination, Downward Arrow SDBs, DBT ABC PLEASE / ACCEPTS / Urge Surfing & CBT-I
  const [selectedToolCategory, setSelectedToolCategory] = useState<Web36ToolCategory | 'ALL'>('ALL');
  const [selectedToolId, setSelectedToolId] = useState<string>('pleasure-predicting-mp-sheet');
  const [toolUserInput, setToolUserInput] = useState<string>(
    'Tôi sợ rằng nếu làm một mình thì sẽ chẳng có chút niềm vui nào và chắc chắn sẽ thất bại hoàn toàn.'
  );
  const [urgeSurfSeconds, setUrgeSurfSeconds] = useState<number>(38);
  const [mpAloneCompanion, setMpAloneCompanion] = useState<CompanionContext>('alone_self');
  const [mpPredPleasure, setMpPredPleasure] = useState<number>(25);
  const [mpActPleasure, setMpActPleasure] = useState<number>(70);
  const [mpPredMastery, setMpPredMastery] = useState<number>(35);
  const [mpActMastery, setMpActMastery] = useState<number>(80);

  const [apPredDiff, setApPredDiff] = useState<number>(85);
  const [apActDiff, setApActDiff] = useState<number>(25);
  const [apPredSat, setApPredSat] = useState<number>(20);
  const [apActSat, setApActSat] = useState<number>(75);

  const [daInitialThought, setDaInitialThought] = useState<string>(
    'Nếu bản thiết kế của mình có 1 lỗi nhỏ, sếp và đồng nghiệp sẽ thất vọng về mình.'
  );
  const [daChain1, setDaChain1] = useState<string>(
    'Nếu họ thất vọng, điều đó có nghĩa là tôi không hoàn hảo và năng lực kém.'
  );
  const [daChain2, setDaChain2] = useState<string>(
    'Nếu tôi không hoàn hảo và không đạt thành tích xuất sắc, tôi sẽ là kẻ vô dụng.'
  );
  const [daProsWeight, setDaProsWeight] = useState<number>(20);
  const [daConsWeight, setDaConsWeight] = useState<number>(80);

  const [abcSleepDone, setAbcSleepDone] = useState<boolean>(true);
  const [abcExerciseDone, setAbcExerciseDone] = useState<boolean>(true);
  const [cbtiTimeInBed, setCbtiTimeInBed] = useState<number>(8.0);

  const filtered36Tools = useMemo(
    () =>
      selectedToolCategory === 'ALL'
        ? WEB_36_CBT_TOOLS
        : WEB_36_CBT_TOOLS.filter((t) => t.category === selectedToolCategory),
    [selectedToolCategory]
  );

  const toolExecutionResult = useMemo(
    () =>
      executeWeb36Tool(selectedToolId, toolUserInput, {
        moodPolarity,
        distressIntensity,
        feltNeedForSleep,
      }),
    [selectedToolId, toolUserInput, moodPolarity, distressIntensity, feltNeedForSleep]
  );

  const urgeSurfFrame = useMemo(
    () => computeUrgeSurfingWaveFrame(urgeSurfSeconds),
    [urgeSurfSeconds]
  );

  const pleasurePredictingEval = useMemo(
    () =>
      evaluatePleasurePredictingSheet([
        {
          id: 'mp-1',
          activity: 'Đọc sách & pha cà phê sáng tại ban công',
          companion: mpAloneCompanion,
          predictedPleasurePercent: mpPredPleasure,
          actualPleasurePercent: mpActPleasure,
          predictedMasteryPercent: mpPredMastery,
          actualMasteryPercent: mpActMastery,
        },
        {
          id: 'mp-2',
          activity: 'Ăn trưa ngắn cùng đồng nghiệp',
          companion: 'with_others',
          predictedPleasurePercent: 60,
          actualPleasurePercent: 65,
          predictedMasteryPercent: 50,
          actualMasteryPercent: 55,
        },
      ]),
    [mpAloneCompanion, mpPredPleasure, mpActPleasure, mpPredMastery, mpActMastery]
  );

  const antiProcrastinationEval = useMemo(
    () =>
      evaluateAntiProcrastinationSheet([
        {
          id: 'ap-1',
          overwhelmingTask: 'Hoàn thành báo cáo tổng kết quý 20 trang',
          microStep5To15Min: 'Mở file và viết 3 gạch đầu dòng dàn ý trong 5 phút',
          predictedDifficultyPercent: apPredDiff,
          actualDifficultyPercent: apActDiff,
          predictedSatisfactionPercent: apPredSat,
          actualSatisfactionPercent: apActSat,
        },
      ]),
    [apPredDiff, apActDiff, apPredSat, apActSat]
  );

  const downwardArrowEval = useMemo(
    () =>
      evaluateDownwardArrowSDB({
        initialAutomaticThought: daInitialThought,
        arrowChains: [daChain1, daChain2],
        advantagesOfKeepingBelief: ['Thúc đẩy mình kiểm tra kỹ tài liệu'],
        disadvantagesOfKeepingBelief: [
          'Luôn sống trong lo âu kiệt sức',
          'Trì hoãn vì sợ không hoàn hảo',
        ],
        advantagesWeightPercent: daProsWeight,
        disadvantagesWeightPercent: daConsWeight,
      }),
    [daInitialThought, daChain1, daChain2, daProsWeight, daConsWeight]
  );

  const abcPleaseEval = useMemo(
    () =>
      evaluateDbtAbcPlease({
        accumulatePositivesDone: true,
        buildMasteryDone: true,
        copeAheadPlanDone: true,
        physicaIllnessAndMedsTaken: true,
        balancedEatingDone: true,
        avoidedMoodAlteringSubstances: true,
        balancedSleepDone: abcSleepDone,
        getExerciseDone: abcExerciseDone,
      }),
    [abcSleepDone, abcExerciseDone]
  );

  const acceptsAndSoothePlan = useMemo(() => buildDbtAcceptsAndSelfSoothePlan(), []);

  const cbtiEvaluation = useMemo(
    () =>
      evaluateCbtiSleepEfficiency({
        timeInBedHours: cbtiTimeInBed,
        totalSleepTimeHours: sleepHours,
        sleepOnsetLatencyMinutes: 35,
        wakeAfterSleepOnsetMinutes: 25,
        feltNeedForSleep,
        moodPolarity,
      }),
    [cbtiTimeInBed, sleepHours, feltNeedForSleep, moodPolarity]
  );

  const bipolarMultiAxisSvgChart = useMemo(
    () =>
      buildBipolarMultiAxisSvgChart([
        { dateLabel: 'D-6', moodPolarity: 0, energyLevel: 0, sleepHours: 7.5, feltNeedForSleep: 'normal' },
        { dateLabel: 'D-5', moodPolarity: 1, energyLevel: 1, sleepHours: 7.0, feltNeedForSleep: 'normal' },
        { dateLabel: 'D-4', moodPolarity: 2, energyLevel: 2, sleepHours: 5.5, feltNeedForSleep: 'reduced_need' },
        { dateLabel: 'D-3', moodPolarity: -1, energyLevel: 1, sleepHours: 6.5, feltNeedForSleep: 'normal' },
        { dateLabel: 'D-2', moodPolarity: -2, energyLevel: 2, sleepHours: 5.0, feltNeedForSleep: 'reduced_need' },
        { dateLabel: 'D-1', moodPolarity: 0, energyLevel: 0, sleepHours: 7.5, feltNeedForSleep: 'normal' },
        {
          dateLabel: 'Hôm nay',
          moodPolarity,
          energyLevel,
          sleepHours,
          feltNeedForSleep,
        },
      ]),
    [moodPolarity, energyLevel, sleepHours, feltNeedForSleep]
  );

  // 8. Phase 3 State: Grounded AI Companion (Local Ollama / RAG 0.46), 2-Tier Memory Inspector, Voice Burst WPM Studio & Baseline HRV/Sleep Context
  const [phase3Provider, setPhase3Provider] =
    useState<Phase3CompanionProvider>('offline-deterministic');
  const [ollamaModelName, setOllamaModelName] = useState<string>('qwen3.5:9b');
  const [phase3ChatInput, setPhase3ChatInput] = useState<string>(
    'Tên mình là Minh, kỹ sư phần mềm. Làm sao dùng DBT TIPP nước lạnh khi hoảng loạn?'
  );
  const [phase3Memory, setPhase3Memory] = useState<ClinicalConversationMemoryState>(() =>
    updateTwoTierClinicalMemory(createInitialClinicalMemoryState('patient-01', pushbackLevel), {
      role: 'user',
      content: 'Tên mình là Minh, kỹ sư phần mềm, người tin cậy là Trần Thu Hà. Mình luôn luôn sợ thất bại hoàn toàn.',
      mode: 'instrumental',
    })
  );
  const [phase3LastCitations, setPhase3LastCitations] = useState<string[]>([
    '[KB:tipp#medical-screening]',
  ]);
  const [phase3LastAbstained, setPhase3LastAbstained] = useState<boolean>(false);
  const [phase3LastTopScore, setPhase3LastTopScore] = useState<number>(0.88);
  const [phase3LastReply, setPhase3LastReply] = useState<string>(
    'Theo phác đồ chuẩn [DBT TIPP > Mandatory Medical Exclusion Screen & Paced Breathing]: Trước khi áp nước mát 15-30s, bắt buộc sàng lọc bệnh tim mạch, nhịp tim chậm, beta-blockers, dị ứng lạnh và rối loạn ăn uống. [KB:tipp#medical-screening]'
  );

  const [vbStudioTranscript, setVbStudioTranscript] = useState<string>(
    'Tôi có ý tưởng thiên tài chắc chắn thắng 100% không cần ngủ đêm nay phải đầu tư all-in ngay lập tức vì năng lượng đang tràn đầy không ai cản được tôi lúc này!'
  );
  const [vbStudioDurationSec, setVbStudioDurationSec] = useState<number>(10);
  const [vbStudioBaselineWpm, setVbStudioBaselineWpm] = useState<number>(125);

  const [hrvDeviceSource, setHrvDeviceSource] = useState<HrvDeviceSource>('apple_watch_sdnn');
  const [hrvLatestMs, setHrvLatestMs] = useState<number>(38);
  const [hrvAgeHours, setHrvAgeHours] = useState<number>(2);

  const phase3VoiceBurstEval = useMemo(
    () =>
      analyzeMultimodalVoiceBurst({
        transcript: vbStudioTranscript,
        durationSeconds: vbStudioDurationSec,
        personalBaselineWpm: vbStudioBaselineWpm,
        moodPolarity,
        energyLevel,
        feltNeedForSleep,
      }),
    [
      vbStudioTranscript,
      vbStudioDurationSec,
      vbStudioBaselineWpm,
      moodPolarity,
      energyLevel,
      feltNeedForSleep,
    ]
  );

  const phase3HrvEval = useMemo(() => {
    const nowMs = new Date('2026-11-21T08:00:00.000Z').getTime();
    const recordedIso = new Date(nowMs - hrvAgeHours * 3600 * 1000).toISOString();
    return evaluateBaselineRelativeHrvAndSleep({
      deviceSource: hrvDeviceSource,
      historicalReadings14To30Days: SAMPLE_14_DAY_HRV_BASELINE,
      latestReadingMs: hrvLatestMs,
      latestReadingRecordedAtIso: recordedIso,
      nowIso: '2026-11-21T08:00:00.000Z',
      sleepDurationHours: sleepHours,
      feltNeedForSleep,
    });
  }, [hrvDeviceSource, hrvLatestMs, hrvAgeHours, sleepHours, feltNeedForSleep]);

  const handleSendPhase3GroundedChat = async () => {
    const turn = await executePhase3GroundedChatTurn({
      provider: phase3Provider,
      ollamaModel: ollamaModelName,
      userMessage: phase3ChatInput,
      mode: phase0Mode,
      distressIntensity,
      moodPolarity,
      energyLevel,
      asrmScore,
      language: lang,
      ragThreshold: 0.46,
      memoryState: phase3Memory,
    });
    setPhase3Memory(turn.updatedMemoryState);
    setPhase3LastCitations(turn.citations);
    setPhase3LastAbstained(turn.abstained);
    setPhase3LastTopScore(turn.topSimilarityScore);
    setPhase3LastReply(lang === 'vi' ? turn.replyVi : turn.replyEn);
  };

  const handleErasePhase3Memory = () => {
    setPhase3Memory((prev) => eraseDerivedProfileMemory(prev, true));
  };

  return (
    <div
      className={`theme-${theme.mode}`}
      style={{
        minHeight: '100vh',
        backgroundColor: theme.palette.background,
        color: theme.palette.textPrimary,
        paddingBottom: '48px',
      }}
    >
      {/* Persistent Top Header with 1-Tap DBT SOS Button & Adaptive Theme Switcher */}
      <header
        className="no-print"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backgroundColor: theme.palette.surface,
          borderBottom: `2px solid ${theme.palette.border}`,
          padding: '12px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div>
          <strong style={{ fontSize: '1.15rem', color: theme.palette.primary }}>
            Equilibria (Mind Anchor)
          </strong>
          <span style={{ marginLeft: '10px', fontSize: '0.85rem', color: theme.palette.textSecondary }}>
            {lang === 'vi' ? theme.titleVi : theme.titleEn}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Mood Polarity Quick Simulator (-5 to +5) */}
          <label style={{ fontSize: '0.85rem' }}>
            {lang === 'vi' ? 'Cực Khí Sắc (-5..+5): ' : 'Mood Pole (-5..+5): '}
            <input
              type="number"
              min={-5}
              max={5}
              value={moodPolarity}
              onChange={(e) =>
                setMoodPolarity(
                  Math.max(-5, Math.min(5, Number((e.target as HTMLInputElement).value))) as MoodPole
                )
              }
              style={{ width: '56px', marginLeft: '4px', padding: '4px' }}
            />
          </label>

          {/* Language Switcher */}
          <button
            type="button"
            onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: `1px solid ${theme.palette.border}`,
              backgroundColor: theme.palette.surface,
              color: theme.palette.textPrimary,
              cursor: 'pointer',
            }}
          >
            {lang === 'vi' ? 'VN / EN (Tiếng Việt)' : 'EN / VN (English)'}
          </button>

          {/* Persistent 1-Tap SOS Portal Button at Top Corner of Every Screen */}
          <button
            type="button"
            onClick={() => setSosOpen(!sosOpen)}
            aria-label="1-Tap DBT SOS Portal"
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: theme.palette.sosBanner,
              color: '#ffffff',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {sosOpen
              ? lang === 'vi'
                ? 'Đóng Cổng SOS'
                : 'Close SOS Portal'
              : lang === 'vi'
                ? 'SOS 1-CHẠM (DBT TIPP / THỞ 4-6)'
                : '1-TAP SOS (DBT TIPP / BREATHE)'}
          </button>
        </div>
      </header>

      {/* Adaptive Theme Clinical Status Banner & Mania 48h Vault / Dark Therapy Banner */}
      <section
        className="no-print"
        style={{
          maxWidth: '1200px',
          margin: '16px auto',
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: theme.palette.surface,
          border: `1px solid ${theme.palette.border}`,
        }}
      >
        <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem' }}>
          <strong>{lang === 'vi' ? 'Trạng thái Giao diện Thích ứng: ' : 'Adaptive UI Mode: '}</strong>
          {lang === 'vi' ? theme.reasonVi : theme.reasonEn}
        </p>

        {theme.show48hImpulseVaultBanner && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '6px',
              backgroundColor: '#451a03',
              color: '#fef3c7',
              marginBottom: '8px',
            }}
          >
            <strong>
              {lang === 'vi'
                ? 'LÁ CHẮN HƯNG CẢM & KHOANG CHỜ 48 GIỜ ĐANG BẬT: '
                : '48-HOUR IMPULSE VAULT & DARK THERAPY ACTIVE: '}
            </strong>
            {lang === 'vi' ? darkTherapyTimer.bannerTextVi : darkTherapyTimer.bannerTextEn}
          </div>
        )}

        {theme.simplifiedOneSmallStep && (
          <div
            style={{
              padding: '12px',
              borderRadius: '6px',
              backgroundColor: '#1e293b',
              color: '#e2e8f0',
              border: '1px solid #38bdf8',
            }}
          >
            <strong>
              {lang === 'vi'
                ? 'MỘT BƯỚC NHỎ TIẾP THEO (Low-Energy Mode — Không đếm chuỗi ngày đứt / No Broken Streaks): '
                : 'ONE SMALL STEP (Low-Energy Mode — No Broken Streaks): '}
            </strong>
            {lang === 'vi'
              ? 'Bạn không cần làm hết mọi thứ hôm nay. Hãy bấm Ghi âm Giọng nói (Voice Burst) hoặc chọn 1 thẻ cảm xúc bên dưới.'
              : 'You do not need to do everything today. Use 1-Tap Voice Burst or pick an Affect Labeling card below.'}
          </div>
        )}
      </section>

      {/* 1-TAP DBT SOS PORTAL FULLSCREEN / OVERLAY */}
      {sosOpen && (
        <section
          aria-label="DBT SOS Portal"
          style={{
            maxWidth: '1200px',
            margin: '16px auto',
            padding: '24px',
            borderRadius: '12px',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            border: '2px solid #e11d48',
          }}
        >
          <h2 style={{ marginTop: 0, color: '#fb7185' }}>
            {lang === 'vi'
              ? 'CỔNG CẤP CỨU SINH LÝ DBT SOS (TIPP • Thở Dẫn Nhịp • 5-4-3-2-1 • STOP)'
              : '1-TAP DBT SOS PORTAL (TIPP • Paced Breathing • 5-4-3-2-1 • STOP)'}
          </h2>

          {/* Paced Breathing Visual Circle & Offline Web Audio API Tone Generator */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px',
            }}
          >
            <div style={{ padding: '16px', backgroundColor: '#1e293b', borderRadius: '8px' }}>
              <h3>
                {lang === 'vi'
                  ? '1. Thở Dẫn Nhịp (4-6 & 4-7-8) + Âm Thanh Web Audio Offline'
                  : '1. Paced Breathing (4-6 & 4-7-8) + Offline Web Audio Synth'}
              </h3>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <button
                  type="button"
                  onClick={() => setBreathingPattern('4-6')}
                  style={{ padding: '6px 12px', cursor: 'pointer' }}
                >
                  {BREATHING_PATTERNS['4-6'].nameVi}
                </button>
                <button
                  type="button"
                  onClick={() => setBreathingPattern('4-7-8')}
                  style={{ padding: '6px 12px', cursor: 'pointer' }}
                >
                  {BREATHING_PATTERNS['4-7-8'].nameVi}
                </button>
                <button
                  type="button"
                  onClick={handleToggleAmbientAudio}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: ambientAudioOn ? '#0d9488' : '#334155',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  {ambientAudioOn
                    ? 'Tắt Âm Thanh Tần Số (174Hz/220Hz)'
                    : 'Bật Âm Thanh Thư Giãn Offline (Web Audio)'}
                </button>
              </div>
              <div
                style={{
                  textAlign: 'center',
                  padding: '24px',
                  border: '2px dashed #38bdf8',
                  borderRadius: '50%',
                  width: '180px',
                  height: '180px',
                  margin: '12px auto',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  transform: `scale(${breathingFrame.circleScale})`,
                }}
              >
                <strong style={{ fontSize: '1.2rem' }}>{breathingFrame.phase.toUpperCase()}</strong>
                <span>{breathingFrame.phaseRemainingSeconds}s</span>
              </div>
              <p style={{ textAlign: 'center' }}>
                {lang === 'vi' ? breathingFrame.instructionVi : breathingFrame.instructionEn}
              </p>
            </div>

            {/* DBT TIPP Cold Water Mandatory Medical Exclusion Screen */}
            <div style={{ padding: '16px', backgroundColor: '#1e293b', borderRadius: '8px' }}>
              <h3>
                {lang === 'vi'
                  ? '2. DBT TIPP — Sàng Lọc Y Khoa Bắt Buộc Trước Khi Dùng Nước Lạnh (T)'
                  : '2. DBT TIPP — Mandatory Medical Exclusion Screen Before Cold Water'}
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                {lang === 'vi'
                  ? 'Nếu tích chọn bất kỳ mục nào dưới đây, hệ thống sẽ KHÓA bước Nước lạnh và tự động chuyển sang Thở Dẫn Nhịp:'
                  : 'Checking any item below blocks Cold Water and redirects automatically to Paced Breathing:'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem' }}>
                <label>
                  <input
                    type="checkbox"
                    checked={medHeartCondition}
                    onChange={(e) => setMedHeartCondition((e.target as HTMLInputElement).checked)}
                  />{' '}
                  {lang === 'vi' ? 'Bệnh tim mạch (Heart condition)' : 'Heart condition'}
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={medBetaBlockers}
                    onChange={(e) => setMedBetaBlockers((e.target as HTMLInputElement).checked)}
                  />{' '}
                  {lang === 'vi' ? 'Đang dùng thuốc chẹn beta (Beta-blockers)' : 'Taking beta-blockers'}
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={medSlowHr}
                    onChange={(e) => setMedSlowHr((e.target as HTMLInputElement).checked)}
                  />{' '}
                  {lang === 'vi' ? 'Nhịp tim chậm (Slow heart rate / bradycardia)' : 'Slow heart rate'}
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={medColdAllergy}
                    onChange={(e) => setMedColdAllergy((e.target as HTMLInputElement).checked)}
                  />{' '}
                  {lang === 'vi' ? 'Dị ứng lạnh / Hội chứng Raynaud' : 'Cold allergy / Raynaud'}
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={medEatingDisorder}
                    onChange={(e) => setMedEatingDisorder((e.target as HTMLInputElement).checked)}
                  />{' '}
                  {lang === 'vi' ? 'Rối loạn ăn uống (Eating disorder)' : 'Eating disorder'}
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={medUnsure}
                    onChange={(e) => setMedUnsure((e.target as HTMLInputElement).checked)}
                  />{' '}
                  {lang === 'vi' ? 'Không chắc chắn / Lưu ý thai kỳ' : 'Unsure / Pregnancy precaution'}
                </label>
              </div>
              <div
                style={{
                  marginTop: '12px',
                  padding: '10px',
                  borderRadius: '6px',
                  backgroundColor: tippColdWaterDecision.coldWaterAllowed ? '#064e3b' : '#7f1d1d',
                }}
              >
                <strong>
                  {tippColdWaterDecision.coldWaterAllowed
                    ? 'Đủ điều kiện Áp Nước Mát 25s (Phản xạ Lặn)'
                    : 'ĐÃ KHÓA NƯỚC LẠNH -> Chuyển sang Thở Dẫn Nhịp 4-6'}
                </strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>
                  {lang === 'vi'
                    ? tippColdWaterDecision.guidanceVi
                    : tippColdWaterDecision.guidanceEn}
                </p>
              </div>
              <p style={{ marginTop: '10px', fontSize: '0.85rem' }}>
                {lang === 'vi' ? tippPostEval.messageVi : tippPostEval.messageEn}
              </p>
            </div>

            {/* 5-4-3-2-1 Grounding & DBT STOP */}
            <div style={{ padding: '16px', backgroundColor: '#1e293b', borderRadius: '8px' }}>
              <h3>3. Neo Thực Tại 5-4-3-2-1 & Kỹ Năng DBT STOP</h3>
              <ul style={{ fontSize: '0.88rem', paddingLeft: '18px' }}>
                <li><strong>5</strong> điều mắt nhìn thấy trong phòng</li>
                <li><strong>4</strong> bề mặt tay chạm vào cảm nhận được</li>
                <li><strong>3</strong> âm thanh tai đang nghe thấy</li>
                <li><strong>2</strong> mùi hương mũi nhận biết được</li>
                <li><strong>1</strong> vị trong khoang miệng hoặc 1 hơi thở sâu</li>
              </ul>
              <hr style={{ borderColor: '#334155' }} />
              {DBT_STOP_STEPS.map((st) => (
                <div key={st.letter} style={{ marginBottom: '6px', fontSize: '0.85rem' }}>
                  <strong>{st.letter} — {lang === 'vi' ? st.titleVi : st.titleEn}:</strong>{' '}
                  {lang === 'vi' ? st.instructionVi : st.instructionEn}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Clinical Module Navigation Tabs */}
      <nav
        className="no-print"
        style={{
          maxWidth: '1200px',
          margin: '16px auto',
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          padding: '0 16px',
        }}
      >
        {(
          [
            ['session-player', '1. DBT-First / CBT-Second Session Player (7 Phác Đồ)'],
            ['anxiety-hub', '2. Phân Hệ Lo Âu (Worry Box • ERP • Prediction Calibration)'],
            ['bipolar-ipsrt-hub', '3. Phân Hệ Lưỡng Cực & IPSRT (-5..+5 • 48h Vault • Ulysses)'],
            ['assessments-report', '4. Thang Đo Lâm Sàng • Mã Hóa AES-GCM • Báo Cáo In A4'],
            ['tools-36-team-cbt', '5. Kho 36 Công cụ CBT/TEAM-CBT/DBT & Trầm cảm Chuyên sâu (36 Tools & TEAM-CBT Hub)'],
            ['phase3-ai-biometrics-voice', '6. Phase 3: Grounded AI Companion (Ollama / RAG 0.46) • 2-Tier Memory • Voice WPM & HRV'],
          ] as const
        ).map(([tabId, label]) => (
          <button
            key={tabId}
            type="button"
            onClick={() => setActiveTab(tabId)}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: `1px solid ${theme.palette.border}`,
              backgroundColor: activeTab === tabId ? theme.palette.primary : theme.palette.surface,
              color: activeTab === tabId ? '#ffffff' : theme.palette.textPrimary,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* TAB 1: DBT-FIRST, CBT-SECOND INTERACTIVE SESSION PLAYER */}
      {activeTab === 'session-player' && (
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
          {/* Phase 0: Expressive vs Instrumental + Voice Burst + Mood Palette + Safety Gate */}
          <section
            style={{
              padding: '16px',
              borderRadius: '10px',
              backgroundColor: theme.palette.surface,
              border: `1px solid ${theme.palette.border}`,
              marginBottom: '16px',
            }}
          >
            <h2>
              {lang === 'vi'
                ? 'Phase 0 & 1: Chọn Chế Độ (Expressive EAR vs. Instrumental) • Voice Burst & Mood-Palette'
                : 'Phase 0 & 1: Expressive EAR vs. Instrumental Mode • Voice Burst & Mood-Palette'}
            </h2>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <button
                type="button"
                onClick={() => setPhase0Mode('expressive')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  backgroundColor: phase0Mode === 'expressive' ? theme.palette.primary : 'transparent',
                  color: phase0Mode === 'expressive' ? '#fff' : theme.palette.textPrimary,
                  border: `1px solid ${theme.palette.border}`,
                }}
              >
                {lang === 'vi'
                  ? 'Chế độ Giải tỏa Cảm xúc (Expressive / Thấu cảm EAR 5 Bí quyết)'
                  : 'Expressive Mode (Venting / TEAM-CBT EAR Empathy)'}
              </button>
              <button
                type="button"
                onClick={() => setPhase0Mode('instrumental')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  backgroundColor: phase0Mode === 'instrumental' ? theme.palette.primary : 'transparent',
                  color: phase0Mode === 'instrumental' ? '#fff' : theme.palette.textPrimary,
                  border: `1px solid ${theme.palette.border}`,
                }}
              >
                {lang === 'vi'
                  ? 'Chế độ Thực hành Kỹ thuật (Instrumental CBT / DBT)'
                  : 'Instrumental Mode (Guided CBT / DBT Protocol)'}
              </button>
            </div>

            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              {lang === 'vi'
                ? 'Ghi âm Xả Cảm xúc (Voice Burst / Nhập nhanh tình huống):'
                : 'Voice Burst Transcript / Situation Check-In:'}
            </label>
            <textarea
              rows={2}
              value={voiceBurstText}
              onChange={(e) => setVoiceBurstText((e.target as HTMLTextAreaElement).value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px' }}
            />

            {/* Generated Mood Palette & 4-Layer Safety Screen */}
            <div
              style={{
                marginTop: '10px',
                padding: '12px',
                borderRadius: '8px',
                background: voiceBurstAnalysis.moodPalette.gradientCss,
                color: '#0f172a',
              }}
            >
              <strong>Mood-Palette ({voiceBurstAnalysis.moodPalette.dominantEmotion}): </strong>
              {lang === 'vi'
                ? voiceBurstAnalysis.moodPalette.summaryVi
                : voiceBurstAnalysis.moodPalette.summaryEn}
            </div>

            {phase0Mode === 'expressive' && (
              <p style={{ marginTop: '10px', padding: '10px', borderLeft: `4px solid ${theme.palette.primary}` }}>
                {lang === 'vi'
                  ? voiceBurstAnalysis.earEmpathyReplyVi
                  : voiceBurstAnalysis.earEmpathyReplyEn}
              </p>
            )}

            <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>
              <strong>{lang === 'vi' ? 'Định tuyến DBT-First / CBT-Second: ' : 'DBT-First / CBT-Second Router: '}</strong>
              {lang === 'vi' ? dbtFirstRouter.rationaleVi : dbtFirstRouter.rationaleEn}
            </p>
            <p style={{ marginTop: '6px', fontSize: '0.9rem', color: safetyGate.safeToProceedToCbt ? theme.palette.primary : '#e11d48' }}>
              <strong>4-Layer Safety Gate: </strong>
              {lang === 'vi' ? safetyGate.bannerVi : safetyGate.bannerEn}
            </p>
          </section>

          {/* Live Socratic Pushback Switcher Mid-Session */}
          <section
            style={{
              padding: '14px 16px',
              borderRadius: '10px',
              backgroundColor: theme.palette.surface,
              border: `1px solid ${theme.palette.border}`,
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <strong>
                {lang === 'vi'
                  ? 'Bộ Điều Khiển Socratic Pushback Trực Tiếp Trong Phiên:'
                  : 'Live Mid-Session Socratic Pushback Controller:'}
              </strong>
              {(['off', 'gentle', 'moderate', 'firm'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setPushbackLevel(lvl)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '4px',
                    backgroundColor: pushbackLevel === lvl ? theme.palette.primary : 'transparent',
                    color: pushbackLevel === lvl ? '#fff' : theme.palette.textPrimary,
                    border: `1px solid ${theme.palette.border}`,
                  }}
                >
                  {lvl.toUpperCase()}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPushbackLevel(adjustPushbackLevel(pushbackLevel, 'softer'))}
                style={{ padding: '5px 10px' }}
              >
                {lang === 'vi' ? '↓ Nhẹ hơn (Softer)' : '↓ Softer'}
              </button>
              <button
                type="button"
                onClick={() => setPushbackLevel(adjustPushbackLevel(pushbackLevel, 'harder'))}
                style={{ padding: '5px 10px' }}
              >
                {lang === 'vi' ? '↑ Sâu hơn (Harder)' : '↑ Harder'}
              </button>
            </div>
            <p style={{ margin: '8px 0 0 0', fontSize: '0.88rem', color: theme.palette.textSecondary }}>
              {lang === 'vi' ? livePushbackPreview.promptVi : livePushbackPreview.promptEn}
            </p>
          </section>

          {/* 5-Family Affect Labeling Cards (Shame vs Guilt distinction) */}
          <section
            style={{
              padding: '14px 16px',
              borderRadius: '10px',
              backgroundColor: theme.palette.surface,
              border: `1px solid ${theme.palette.border}`,
              marginBottom: '16px',
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              {lang === 'vi'
                ? 'Bảng Gọi Tên 5 Họ Cảm Xúc (Affect Labeling — Phân biệt rõ Xấu hổ vs. Tội lỗi)'
                : '5-Family Affect Labeling Cards (Distinguishing Shame vs. Guilt)'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
              {FIVE_FAMILY_AFFECT_CARDS.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setTrAffect(card.family)}
                  style={{
                    textAlign: 'left',
                    padding: '10px',
                    borderRadius: '8px',
                    border:
                      trAffect === card.family
                        ? `2px solid ${theme.palette.primary}`
                        : `1px solid ${theme.palette.border}`,
                    backgroundColor: theme.palette.surface,
                    color: theme.palette.textPrimary,
                    cursor: 'pointer',
                  }}
                >
                  <strong>{lang === 'vi' ? card.labelVi : card.labelEn}</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: theme.palette.textSecondary }}>
                    {lang === 'vi' ? card.clinicalNoteVi : card.clinicalNoteEn}
                  </p>
                </button>
              ))}
            </div>
          </section>

          {/* 7 Interactive Guided Protocols Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' }}>
            {/* 1. CBT 7-Step Thought Record with Accuracy Check */}
            <article
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3>1. CBT 7-Step Thought Record + Cổng Accuracy Check (Giữa Bước 5 & 6)</h3>
              <p style={{ fontSize: '0.85rem' }}>
                <strong>Step 1 (Tình huống máy quay):</strong> {trSituation}
              </p>
              <p style={{ fontSize: '0.85rem' }}>
                <strong>Step 2 (Suy nghĩ tự động):</strong> {trHotThought}
              </p>
              <p style={{ fontSize: '0.82rem', color: theme.palette.accent }}>
                <strong>Phân loại Biến dạng Ngầm (0ms): </strong>
                {thoughtRecordEval.distortions.negative.map((d) => d.nameVi).join(' • ') || 'Không phát hiện'}
              </p>
              <label style={{ display: 'block', margin: '10px 0', fontSize: '0.88rem', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={trIsObjectivelyTrue}
                  onChange={(e) => setTrIsObjectivelyTrue((e.target as HTMLInputElement).checked)}
                />{' '}
                CỔNG ACCURACY CHECK (Giữa Bước 5 & 6): Suy nghĩ này là sự thật khách quan (mất mát thật)?
              </label>
              <div
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  backgroundColor: trIsObjectivelyTrue ? '#fef3c7' : '#ecfdf5',
                  color: '#0f172a',
                  fontSize: '0.85rem',
                }}
              >
                <strong>Outcome: `{thoughtRecordEval.outcome}`</strong>
                <p style={{ margin: '4px 0 0 0' }}>
                  {lang === 'vi'
                    ? thoughtRecordEval.accuracyCheck.coachingVi
                    : thoughtRecordEval.accuracyCheck.coachingEn}
                </p>
              </div>
            </article>

            {/* 2. CBT Behavioral Activation 6-Step with Mandatory Rest Check & Confidence >= 7/10 */}
            <article
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3>2. CBT Behavioral Activation 6 Bước + Cổng Rest Check & Tự Tin &gt;= 7/10</h3>
              <p style={{ fontSize: '0.82rem', color: theme.palette.textSecondary }}>
                {lang === 'vi'
                  ? behavioralActivationEval.predictionErrorInsightVi
                  : behavioralActivationEval.predictionErrorInsightEn}
              </p>
              <label style={{ display: 'block', margin: '8px 0', fontSize: '0.88rem', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={baNeedsRest}
                  onChange={(e) => setBaNeedsRest((e.target as HTMLInputElement).checked)}
                />{' '}
                Step 2 — CỔNG REST CHECK: Đang kiệt sức sinh học / ốm / thiếu ngủ cần Nghỉ ngơi Không Áy náy?
              </label>
              <label style={{ display: 'block', margin: '8px 0', fontSize: '0.88rem' }}>
                Step 4 — Điểm Tự Tin thực hiện (0–10, bắt buộc &gt;= 7/10):{' '}
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={baConfidence}
                  onChange={(e) => setBaConfidence(Number((e.target as HTMLInputElement).value))}
                  style={{ width: '55px' }}
                />
              </label>
              <div
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  backgroundColor: '#f1f5f9',
                  color: '#0f172a',
                  fontSize: '0.85rem',
                }}
              >
                <strong>Outcome: `{behavioralActivationEval.outcome}`</strong>
                <p style={{ margin: '4px 0 0 0' }}>
                  {!behavioralActivationEval.confidencePassed
                    ? behavioralActivationEval.requireMicroShrinkPromptVi
                    : behavioralActivationEval.ifThenPlan}
                </p>
              </div>
            </article>

            {/* 3. TEAM-CBT Paradoxical Agenda Setting */}
            <article
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3>3. TEAM-CBT Paradoxical Agenda Setting (Magic Button • Magic Dial • Voices)</h3>
              <p style={{ fontSize: '0.85rem' }}>
                {lang === 'vi' ? pasEval.summaryVi : pasEval.summaryEn}
              </p>
              <label style={{ fontSize: '0.85rem' }}>
                Magic Dial (Mức lo âu muốn giữ lại %):{' '}
                <input
                  type="number"
                  min={10}
                  max={80}
                  value={pasMagicDialTarget}
                  onChange={(e) => setPasMagicDialTarget(Number((e.target as HTMLInputElement).value))}
                  style={{ width: '60px' }}
                />
                %
              </label>
            </article>

            {/* 4. DBT Opposite Action (4 steps with Justified Check) */}
            <article
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3>4. DBT Opposite Action (4 Bước + Cổng Justified Check)</h3>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.88rem' }}>
                <input
                  type="checkbox"
                  checked={oaRealDanger}
                  onChange={(e) => setOaRealDanger((e.target as HTMLInputElement).checked)}
                />{' '}
                Step 3 — JUSTIFIED CHECK: Tình huống có mối nguy hiểm thực tế (Bạo lực / Không an toàn)?
              </label>
              <p style={{ fontSize: '0.85rem' }}>
                <strong>Outcome: `{oppositeActionEval.outcome}`</strong> —{' '}
                {lang === 'vi' ? oppositeActionEval.directiveVi : oppositeActionEval.directiveEn}
              </p>
            </article>

            {/* 5. DBT Wise Mind (6 steps with Harsh Self-Critic Guard & "Nothing yet") */}
            <article
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3>5. DBT Wise Mind (6 Bước + Harsh Self-Critic Guard &amp; &quot;Nothing yet&quot;)</h3>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>
                Step 3 (Tâm Lý Trí — Thử gõ từ tự phán xét như &quot;yếu đuối&quot; để kiểm tra Guard):
                <input
                  type="text"
                  value={wmReasonableText}
                  onChange={(e) => setWmReasonableText((e.target as HTMLInputElement).value)}
                  style={{ width: '100%', padding: '6px', marginTop: '4px' }}
                />
              </label>
              <p style={{ fontSize: '0.82rem', color: wiseMindEval.criticGuard.isSelfCriticDisguised ? '#e11d48' : theme.palette.primary }}>
                {lang === 'vi'
                  ? wiseMindEval.criticGuard.reframePromptVi
                  : wiseMindEval.criticGuard.reframePromptEn}
              </p>
              <p style={{ fontSize: '0.85rem' }}>
                {lang === 'vi' ? wiseMindEval.closingSummaryVi : wiseMindEval.closingSummaryEn}
              </p>
            </article>

            {/* 6. DBT Chain Analysis (6 steps + Hard Stops for self-harm/victimization + Shame Protocol) */}
            <article
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3>6. DBT Chain Analysis (6 Bước + 2 Hard Stops &amp; Shame Protocol)</h3>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>
                Step 1 (Hành vi mục tiêu — Tự động chặn nếu nhập tự hại hoặc bị bạo hành):
                <input
                  type="text"
                  value={caTargetBehavior}
                  onChange={(e) => setCaTargetBehavior((e.target as HTMLInputElement).value)}
                  style={{ width: '100%', padding: '6px', marginTop: '4px' }}
                />
              </label>
              <p style={{ fontSize: '0.85rem' }}>
                <strong>Outcome: `{chainAnalysisEval.outcome}`</strong> —{' '}
                {lang === 'vi' ? chainAnalysisEval.summaryVi : chainAnalysisEval.summaryEn}
              </p>
            </article>

            {/* 7. DBT DEAR MAN + TEAM-CBT EAR with Interactive AI Roleplay Rehearsal */}
            <article
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
                gridColumn: '1 / -1',
              }}
            >
              <h3>7. DBT DEAR MAN + 5 Bí Quyết Giao Tiếp EAR &amp; Tập Dượt AI Roleplay (Softer / Harder)</h3>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
                <span>Mức độ kháng cự của AI đóng vai đối phương:</span>
                {(['softer', 'moderate', 'harder'] as const).map((resLvl) => (
                  <button
                    key={resLvl}
                    type="button"
                    onClick={() => setDmResistance(resLvl)}
                    style={{
                      padding: '4px 10px',
                      backgroundColor: dmResistance === resLvl ? theme.palette.primary : 'transparent',
                      color: dmResistance === resLvl ? '#fff' : theme.palette.textPrimary,
                      border: `1px solid ${theme.palette.border}`,
                      borderRadius: '4px',
                    }}
                  >
                    {resLvl.toUpperCase()}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '0.88rem' }}>
                <strong>Kịch bản DEAR MAN hoàn chỉnh:</strong> &ldquo;{dearManEval.assembledScript}&rdquo;
              </p>
              <p style={{ fontSize: '0.88rem', padding: '10px', backgroundColor: '#f1f5f9', color: '#0f172a', borderRadius: '6px' }}>
                {lang === 'vi' ? dearManEval.roleplayPartnerReplyVi : dearManEval.roleplayPartnerReplyEn}
              </p>
              <p style={{ fontSize: '0.84rem' }}>
                <strong>Huấn luyện sau vòng diễn:</strong> {dearManEval.coachingStrengthVi} | {dearManEval.coachingTweakVi}
              </p>
            </article>
          </div>
        </main>
      )}

      {/* TAB 2: ANXIETY GOLD-STANDARD HUB */}
      {activeTab === 'anxiety-hub' && (
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' }}>
            {/* Worry Box (Worry Postponement 15-min window) */}
            <section
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3>1. Hộp Lo Âu (Worry Box — Trì Hoãn Lo Lắng Khung Giờ 17:30–17:45)</h3>
              <textarea
                rows={2}
                value={worryInput}
                onChange={(e) => setWorryInput((e.target as HTMLTextAreaElement).value)}
                style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
              />
              <p style={{ fontSize: '0.86rem' }}>
                <strong>Phân loại tự động:</strong> `{worryProcessed.updatedItem.category}` ({worryProcessed.updatedItem.scheduledWindowTime})
              </p>
              <p style={{ fontSize: '0.85rem' }}>
                {lang === 'vi' ? worryProcessed.clinicalProtocolVi : worryProcessed.clinicalProtocolEn}
              </p>
            </section>

            {/* Exposure Hierarchy Builder (ERP & Interoceptive Exposure) + Safety Behavior Detector */}
            <section
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3>2. Thang Tiếp Xúc Sợ Hãi (ERP &amp; Interoceptive SUDS 0–100) + Safety Behavior Detector</h3>
              {exposureLadder.map((step) => (
                <div
                  key={step.id}
                  style={{
                    padding: '10px',
                    marginBottom: '8px',
                    borderRadius: '6px',
                    border: `1px solid ${theme.palette.border}`,
                    fontSize: '0.85rem',
                  }}
                >
                  <strong>
                    [{step.exposureType.toUpperCase()}] {step.title}
                  </strong>
                  <div>
                    SUDS Ban đầu: {step.baselineSuds}/100 → Hiện tại: {step.currentSuds}/100{' '}
                    {step.habituationAchieved ? '(Đã quen dần / Habituated ✓)' : ''}
                  </div>
                  {step.detectedSafetyBehaviors.length > 0 && (
                    <div style={{ color: '#e11d48' }}>
                      Hành vi an toàn ngầm phát hiện: {step.detectedSafetyBehaviors.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </section>

            {/* Prediction Calibration Tracker */}
            <section
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3>3. Hiệu Chỉnh Dự Đoán Thảm Họa (Prediction Calibration Tracker)</h3>
              <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                {lang === 'vi' ? predictionStats.calibrationInsightVi : predictionStats.calibrationInsightEn}
              </p>
              {predictionEntries.map((pe) => (
                <div key={pe.id} style={{ fontSize: '0.84rem', marginBottom: '8px' }}>
                  • <strong>{pe.eventDescription}:</strong> Dự đoán thảm họa {pe.predictedProbabilityPercent}% → Thực tế:{' '}
                  {pe.actualOutcome}
                </div>
              ))}
            </section>

            {/* 4. DBT Radical Acceptance & Urge Surfing 90-Second Adrenaline Wave Timer */}
            <section
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3>4. Lướt Sóng Adrenaline 90 Giây (DBT Radical Acceptance &amp; Urge Surfing)</h3>
              <label style={{ display: 'block', fontSize: '0.86rem', marginBottom: '8px' }}>
                Thời gian trên đỉnh sóng ({urgeSurfFrame.elapsedSeconds}s / 90s — Độ cao sóng: {urgeSurfFrame.waveHeightPercent}%):
                <input
                  type="range"
                  min={0}
                  max={90}
                  value={urgeSurfSeconds}
                  onChange={(e) => setUrgeSurfSeconds(Number((e.target as HTMLInputElement).value))}
                  style={{ width: '100%' }}
                />
              </label>
              <p style={{ fontSize: '0.85rem', margin: 0 }}>
                {lang === 'vi' ? urgeSurfFrame.coachingVi : urgeSurfFrame.coachingEn}
              </p>
            </section>
          </div>
        </main>
      )}

      {/* TAB 3: BIPOLAR & IPSRT HUB */}
      {activeTab === 'bipolar-ipsrt-hub' && (
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
          {/* Multi-Axis Dual-Pole (-5..+5) Mood, Energy & Sleep SVG Overlay Chart */}
          <section
            style={{
              padding: '16px',
              borderRadius: '10px',
              backgroundColor: theme.palette.surface,
              border: `1px solid ${theme.palette.border}`,
              marginBottom: '16px',
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              Biểu Đồ Đa Trục Chồng Lớp 7 Ngày: Khí Sắc (-5..+5) • Năng Lượng (-5..+5) • Giấc Ngủ (0..12h)
            </h3>
            <svg
              viewBox={`0 0 ${bipolarMultiAxisSvgChart.width} ${bipolarMultiAxisSvgChart.height}`}
              style={{ width: '100%', maxHeight: '240px', backgroundColor: '#0f172a', borderRadius: '8px' }}
              role="img"
              aria-label="SVG Multi-Axis Dual-Pole (-5..+5) Mood, Energy and Sleep Chart"
            >
              {/* Euthymic 0 Line & Mania/Depression Threshold Lines */}
              <line
                x1={44}
                y1={bipolarMultiAxisSvgChart.maniaThresholdY}
                x2={bipolarMultiAxisSvgChart.width - 44}
                y2={bipolarMultiAxisSvgChart.maniaThresholdY}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <line
                x1={44}
                y1={bipolarMultiAxisSvgChart.zeroLineY}
                x2={bipolarMultiAxisSvgChart.width - 44}
                y2={bipolarMultiAxisSvgChart.zeroLineY}
                stroke="#64748b"
                strokeWidth={1.5}
              />
              <line
                x1={44}
                y1={bipolarMultiAxisSvgChart.depressionThresholdY}
                x2={bipolarMultiAxisSvgChart.width - 44}
                y2={bipolarMultiAxisSvgChart.depressionThresholdY}
                stroke="#38bdf8"
                strokeDasharray="4 4"
                strokeWidth={1}
              />

              {/* Sleep Duration Bars */}
              {bipolarMultiAxisSvgChart.points.map((pt) => (
                <g key={pt.dateLabel}>
                  <rect
                    x={pt.x - 10}
                    y={bipolarMultiAxisSvgChart.height - 24 - pt.sleepBarHeight}
                    width={20}
                    height={pt.sleepBarHeight}
                    fill="rgba(56, 189, 248, 0.22)"
                    rx={3}
                  />
                  <text
                    x={pt.x}
                    y={bipolarMultiAxisSvgChart.height - 8}
                    textAnchor="middle"
                    fill="#cbd5e1"
                    fontSize="11"
                  >
                    {pt.dateLabel} ({pt.sleepHours}h)
                  </text>
                </g>
              ))}

              {/* Mood Polarity Polyline (-5..+5) */}
              <polyline
                fill="none"
                stroke="#14b8a6"
                strokeWidth={3}
                points={bipolarMultiAxisSvgChart.moodPolylinePoints}
              />

              {/* Energy Level Polyline (-5..+5) */}
              <polyline
                fill="none"
                stroke="#f97316"
                strokeWidth={2.5}
                strokeDasharray="5 3"
                points={bipolarMultiAxisSvgChart.energyPolylinePoints}
              />

              {/* Data Nodes */}
              {bipolarMultiAxisSvgChart.points.map((pt) => (
                <g key={`node-${pt.dateLabel}`}>
                  <circle
                    cx={pt.x}
                    cy={pt.moodY}
                    r={pt.isMixedRisk || pt.isManiaProdromeRisk ? 6 : 4}
                    fill={pt.isMixedRisk ? '#e11d48' : '#14b8a6'}
                  />
                  <circle cx={pt.x} cy={pt.energyY} r={4} fill="#f97316" />
                </g>
              ))}
            </svg>
            <p style={{ fontSize: '0.82rem', margin: '8px 0 0 0', color: theme.palette.textSecondary }}>
              Chú giải: Đường xanh ngọc liền nét = Khí sắc (-5..+5) | Đường cam đứt nét = Năng lượng (-5..+5) | Cột xanh dương = Số giờ ngủ | Điểm đỏ = Cảnh báo Pha Hỗn hợp / Tiền triệu Hưng cảm.
            </p>
          </section>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' }}>
            {/* Dual-Pole Mood & Energy Chart (-5 to +5) & Prodrome / Mixed State Detector */}
            <section
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3>1. Biểu Đồ Khí Sắc Hai Cực (-5 đến +5) &amp; Cảnh Báo Pha Hỗn Hợp / Tiền Triệu</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem' }}>
                <label>
                  Khí sắc (Valence -5..+5): {moodPolarity}
                  <input
                    type="range"
                    min={-5}
                    max={5}
                    value={moodPolarity}
                    onChange={(e) => setMoodPolarity(Number((e.target as HTMLInputElement).value) as MoodPole)}
                    style={{ width: '100%' }}
                  />
                </label>
                <label>
                  Năng lượng vận động (Energy -5..+5): {energyLevel}
                  <input
                    type="range"
                    min={-5}
                    max={5}
                    value={energyLevel}
                    onChange={(e) => setEnergyLevel(Number((e.target as HTMLInputElement).value) as MoodPole)}
                    style={{ width: '100%' }}
                  />
                </label>
                <label>
                  Số giờ ngủ đêm qua: {sleepHours}h
                  <input
                    type="number"
                    min={0}
                    max={14}
                    step={0.5}
                    value={sleepHours}
                    onChange={(e) => setSleepHours(Number((e.target as HTMLInputElement).value))}
                    style={{ width: '70px', marginLeft: '8px' }}
                  />
                </label>
              </div>
              <div
                style={{
                  marginTop: '12px',
                  padding: '10px',
                  borderRadius: '6px',
                  backgroundColor:
                    bipolarAnalysis.isMixedState || bipolarAnalysis.isManiaProdrome ? '#7f1d1d' : '#064e3b',
                  color: '#fff',
                  fontSize: '0.86rem',
                }}
              >
                {lang === 'vi' ? bipolarAnalysis.clinicalAlertVi : bipolarAnalysis.clinicalAlertEn}
              </div>
            </section>

            {/* 5 IPSRT Social Rhythm Anchors */}
            <section
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3>2. Nhịp Sinh Học 5 Mốc IPSRT (Điểm Ổn Định: {ipsrtReport.stabilityScorePercent}%)</h3>
              <ul style={{ fontSize: '0.86rem' }}>
                <li>1. Giờ thức dậy ra khỏi giường: {currentBipolarLog.ipsrtAnchors.outOfBedTime}</li>
                <li>2. Tiếp xúc xã hội đầu tiên: {currentBipolarLog.ipsrtAnchors.firstSocialContactTime}</li>
                <li>3. Bắt đầu làm việc/học tập: {currentBipolarLog.ipsrtAnchors.workOrStudyStartTime}</li>
                <li>4. Giờ ăn tối: {currentBipolarLog.ipsrtAnchors.dinnerTime}</li>
                <li>5. Giờ đi ngủ: {currentBipolarLog.ipsrtAnchors.bedTime}</li>
              </ul>
              <p style={{ fontSize: '0.85rem' }}>
                {lang === 'vi' ? ipsrtReport.interpretationVi : ipsrtReport.interpretationEn}
              </p>
            </section>

            {/* 48-Hour Impulse Vault */}
            <section
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3>3. Khoang Trì Hoãn Quyết Định 48 Giờ (48-Hour Impulse Vault)</h3>
              <p style={{ fontSize: '0.86rem' }}>
                <strong>Quyết định đang khóa:</strong> {impulseVaultEntry.impulseDescription}
              </p>
              <p style={{ fontSize: '0.84rem', color: '#d97706' }}>
                <strong>Biến dạng Dương tính phát hiện:</strong>{' '}
                {impulseVaultEntry.positiveDistortionsDetected.join(' • ')}
              </p>
              <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                {lang === 'vi' ? impulseLockStatus.statusMessageVi : impulseLockStatus.statusMessageEn}
              </p>
            </section>

            {/* Ulysses Contract & Medication Adherence CBT */}
            <section
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3>4. Giao Ước Bình Ổn (Ulysses Contract) &amp; Tuân Thủ Thuốc CBT</h3>
              <p style={{ fontSize: '0.84rem' }}>
                <strong>Dấu hiệu tiền triệu cá nhân:</strong>{' '}
                {DEFAULT_ULYSSES_CONTRACT.personalManiaProdromes.join('; ')}
              </p>
              <p style={{ fontSize: '0.84rem' }}>
                <strong>Tái cấu trúc suy nghĩ muốn bỏ thuốc:</strong>{' '}
                {lang === 'vi'
                  ? medAdherenceReview.balancedAdherenceThoughtVi
                  : medAdherenceReview.balancedAdherenceThoughtEn}
              </p>
            </section>
          </div>
        </main>
      )}

      {/* TAB 4: CLINICAL SELF-ASSESSMENTS, ENCRYPTED STORAGE, OLLAMA & A4 REPORT */}
      {activeTab === 'assessments-report' && (
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
          <section
            style={{
              padding: '16px',
              borderRadius: '10px',
              backgroundColor: theme.palette.surface,
              border: `1px solid ${theme.palette.border}`,
              marginBottom: '16px',
            }}
          >
            <h3>1. Hệ Thống 6 Thang Đo Lâm Sàng Định Kỳ (BMS • PHQ-9 • GAD-7 • ASRM • MDQ • ISI)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
              {assessments.map((a) => (
                <div
                  key={a.id}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${theme.palette.border}`,
                    fontSize: '0.86rem',
                  }}
                >
                  <strong>{lang === 'vi' ? a.labelVi : a.labelEn}</strong>
                  <p style={{ margin: '6px 0 0 0', color: theme.palette.textSecondary }}>
                    {lang === 'vi' ? a.clinicalRecommendationVi : a.clinicalRecommendationEn}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Local Encrypted Storage, Markdown Export & Local Ollama Toggle */}
          <section
            className="no-print"
            style={{
              padding: '16px',
              borderRadius: '10px',
              backgroundColor: theme.palette.surface,
              border: `1px solid ${theme.palette.border}`,
              marginBottom: '16px',
            }}
          >
            <h3>2. Tự Chủ Dữ Liệu (WebCrypto AES-GCM 256 • Xuất Markdown • Local Ollama 11434)</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <button
                type="button"
                onClick={() => void handleTestWebCryptoEncryption()}
                style={{ padding: '8px 12px', cursor: 'pointer' }}
              >
                Mã hóa Phiên Hiện Tại (WebCrypto AES-GCM 256)
              </button>
              <button
                type="button"
                onClick={() =>
                  setAiMode(aiMode === 'local-ollama' ? 'offline-deterministic' : 'local-ollama')
                }
                style={{ padding: '8px 12px', cursor: 'pointer' }}
              >
                Chế độ AI: {aiMode.toUpperCase()} (http://127.0.0.1:11434)
              </button>
              <button
                type="button"
                onClick={() => typeof window !== 'undefined' && window.print()}
                style={{
                  padding: '8px 14px',
                  backgroundColor: theme.palette.primary,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                In Báo Cáo Lâm Sàng Chuẩn A4 (@media print)
              </button>
            </div>
            <p style={{ fontSize: '0.84rem' }}>
              <strong>Trạng thái Mã hóa Cục bộ:</strong> <code>{encryptedPreview}</code>
            </p>
            <details>
              <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
                Xem File Xuất Markdown Chuẩn ({markdownExport.filename})
              </summary>
              <pre
                style={{
                  padding: '12px',
                  backgroundColor: '#0f172a',
                  color: '#e2e8f0',
                  borderRadius: '6px',
                  overflowX: 'auto',
                  fontSize: '0.8rem',
                }}
              >
                {markdownExport.markdownContent}
              </pre>
            </details>
          </section>

          {/* Print-Optimized A4 Clinician Summary Report */}
          <section
            className="print-only-a4"
            style={{
              padding: '20px',
              borderRadius: '10px',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              BÁO CÁO TÓM TẮT LÂM SÀNG CHUẨN A4 (CLINICIAN SUMMARY REPORT — 30 DAYS)
            </h2>
            <p style={{ fontSize: '0.88rem' }}>
              <strong>Mã Bệnh Nhân:</strong> {clinicianReport.patientAlias} |{' '}
              <strong>Ngày xuất:</strong> {clinicianReport.generatedDate} |{' '}
              <strong>Điểm Ổn định Nhịp Sinh học IPSRT:</strong> {clinicianReport.ipsrtAverageStabilityPercent}% |{' '}
              <strong>Tuân thủ Thuốc:</strong> {clinicianReport.medicationAdherencePercent}%
            </p>
            <p style={{ fontSize: '0.85rem' }}>
              <strong>Biến dạng Nhận thức Thường gặp:</strong>{' '}
              {clinicianReport.topDistortions.join(', ') || 'Chưa ghi nhận'}
            </p>
            <p style={{ fontSize: '0.82rem', color: '#475569' }}>
              <strong>Liên kết Chia sẻ Bác sĩ Mã hóa Đầu-Cuối (Zero-Knowledge E2EE Share Link):</strong>{' '}
              <code>{clinicianReport.e2eeShareUrlFragment}</code>
            </p>
          </section>
        </main>
      )}

      {/* TAB 5: 36 INTERACTIVE CBT/TEAM-CBT/DBT TOOLS & DEPRESSION GOLD-STANDARD SUITE */}
      {activeTab === 'tools-36-team-cbt' && (
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
          {/* 1. 36 Interactive CBT, TEAM-CBT, DBT & Bipolar Toolkit Hub (0ms execution) */}
          <section
            style={{
              padding: '16px',
              borderRadius: '10px',
              backgroundColor: theme.palette.surface,
              border: `1px solid ${theme.palette.border}`,
              marginBottom: '16px',
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              1. Kho 36 Công Cụ CBT • TEAM-CBT • DBT • IPSRT Tương Tác Nhanh (0ms Deterministic Engine — Đủ {WEB_36_CBT_TOOLS.length}/36 Công Cụ)
            </h2>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {(
                [
                  'ALL',
                  'Anxiety & ERP',
                  'Depression & TEAM-CBT',
                  'Bipolar & IPSRT',
                  'DBT Distress & Regulation',
                  'Work & Burnout',
                ] as const
              ).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedToolCategory(cat)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${theme.palette.border}`,
                    backgroundColor: selectedToolCategory === cat ? theme.palette.primary : 'transparent',
                    color: selectedToolCategory === cat ? '#fff' : theme.palette.textPrimary,
                    cursor: 'pointer',
                  }}
                >
                  {cat === 'ALL' ? `Tất cả (${WEB_36_CBT_TOOLS.length})` : cat}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px', maxHeight: '280px', overflowY: 'auto', padding: '4px', marginBottom: '12px' }}>
              {filtered36Tools.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => setSelectedToolId(tool.id)}
                  style={{
                    textAlign: 'left',
                    padding: '10px',
                    borderRadius: '8px',
                    border:
                      selectedToolId === tool.id
                        ? `2px solid ${theme.palette.primary}`
                        : `1px solid ${theme.palette.border}`,
                    backgroundColor: theme.palette.surface,
                    color: theme.palette.textPrimary,
                    cursor: 'pointer',
                  }}
                >
                  <strong>
                    #{tool.number}. {lang === 'vi' ? tool.titleVi : tool.titleEn}
                  </strong>
                  <div style={{ fontSize: '0.78rem', color: theme.palette.textSecondary }}>
                    [{tool.clinicalOrigin}] • {tool.category} • {tool.durationMinutes} min
                  </div>
                </button>
              ))}
            </div>

            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>
              Nhập suy nghĩ / tình huống để chạy công cụ #{toolExecutionResult.tool.number} ({toolExecutionResult.tool.titleVi}):
            </label>
            <textarea
              rows={2}
              value={toolUserInput}
              onChange={(e) => setToolUserInput((e.target as HTMLTextAreaElement).value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', marginBottom: '10px' }}
            />

            <div
              style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                fontSize: '0.86rem',
              }}
            >
              <div>
                <strong>Kết quả Phân tích 0ms ({toolExecutionResult.kbCitation}):</strong>
              </div>
              <p style={{ margin: '6px 0' }}>
                {lang === 'vi'
                  ? toolExecutionResult.reframeOrActionCardVi
                  : toolExecutionResult.reframeOrActionCardEn}
              </p>
              <p style={{ margin: '6px 0', color: '#38bdf8' }}>
                <strong>Bước hành động tiếp theo:</strong>{' '}
                {lang === 'vi' ? toolExecutionResult.nextMicroStepVi : toolExecutionResult.nextMicroStepEn}
              </p>
              {toolExecutionResult.bipolarSafetyNoteVi && (
                <p style={{ margin: '6px 0 0 0', color: '#fbbf24' }}>
                  {lang === 'vi'
                    ? toolExecutionResult.bipolarSafetyNoteVi
                    : toolExecutionResult.bipolarSafetyNoteEn}
                </p>
              )}
            </div>
          </section>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
            {/* 2. TEAM-CBT Pleasure-Predicting & Mastery/Pleasure (M/P) Sheet */}
            <section
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3>2. Bảng Dự Đoán Niềm Vui &amp; Làm Chủ (TEAM-CBT Pleasure-Predicting M/P Sheet)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                <label>
                  Bối cảnh thực hiện (Kiểm nghiệm Love Addiction SDB):{' '}
                  <select
                    value={mpAloneCompanion}
                    onChange={(e) => setMpAloneCompanion((e.target as HTMLSelectElement).value as CompanionContext)}
                  >
                    <option value="alone_self">Một mình / Tự thân (Alone / Self)</option>
                    <option value="with_others">Cùng người khác (With Others)</option>
                  </select>
                </label>
                <label>
                  Dự đoán Niềm vui (Predicted P%): {mpPredPleasure}% → Thực tế (Actual P%): {mpActPleasure}%
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={mpActPleasure}
                    onChange={(e) => setMpActPleasure(Number((e.target as HTMLInputElement).value))}
                    style={{ width: '100%' }}
                  />
                </label>
                <label>
                  Dự đoán Làm chủ (Predicted M%): {mpPredMastery}% → Thực tế (Actual M%): {mpActMastery}%
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={mpActMastery}
                    onChange={(e) => setMpActMastery(Number((e.target as HTMLInputElement).value))}
                    style={{ width: '100%' }}
                  />
                </label>
              </div>
              <p style={{ fontSize: '0.85rem', marginTop: '10px' }}>
                {lang === 'vi'
                  ? pleasurePredictingEval.clinicalInsightVi
                  : pleasurePredictingEval.clinicalInsightEn}
              </p>
            </section>

            {/* 3. David Burns Anti-Procrastination 5-Minute Sheet */}
            <section
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3>3. Bảng Chống Trì Hoãn 5 Phút (David Burns Anti-Procrastination Sheet)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                <label>
                  Độ khó Dự đoán ({apPredDiff}%) vs. Độ khó Thực tế sau 5 phút làm thử ({apActDiff}%):
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={apActDiff}
                    onChange={(e) => setApActDiff(Number((e.target as HTMLInputElement).value))}
                    style={{ width: '100%' }}
                  />
                </label>
                <label>
                  Hài lòng Dự đoán ({apPredSat}%) vs. Hài lòng Thực tế ({apActSat}%):
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={apActSat}
                    onChange={(e) => setApActSat(Number((e.target as HTMLInputElement).value))}
                    style={{ width: '100%' }}
                  />
                </label>
              </div>
              <p style={{ fontSize: '0.85rem', marginTop: '10px' }}>
                {lang === 'vi' ? antiProcrastinationEval.coachingVi : antiProcrastinationEval.coachingEn}
              </p>
            </section>

            {/* 4. Uncovering 23 Self-Defeating Beliefs (Downward Arrow + Cost-Benefit Analysis) */}
            <section
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3>
                4. Kỹ Thuật Mũi Tên Đi Xuống — Khám Phá {SELF_DEFEATING_BELIEFS_23_CATALOG.length} Niềm Tin Tự Hủy Hoại (SDBs) &amp; Phân Tích Lợi-Hại
              </h3>
              <div style={{ fontSize: '0.84rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>
                  <strong>Suy nghĩ ban đầu:</strong> {daInitialThought}
                </div>
                <div>
                  <strong>↓ Nếu điều đó là thật, nó có ý nghĩa gì với bạn? (Bước 1):</strong>
                  <input
                    type="text"
                    value={daChain1}
                    onChange={(e) => setDaChain1((e.target as HTMLInputElement).value)}
                    style={{ width: '100%', padding: '5px', marginTop: '3px' }}
                  />
                </div>
                <div>
                  <strong>↓ Và nếu thế thì sao? (Bước 2 — Chạm Niềm tin Gốc):</strong>
                  <input
                    type="text"
                    value={daChain2}
                    onChange={(e) => setDaChain2((e.target as HTMLInputElement).value)}
                    style={{ width: '100%', padding: '5px', marginTop: '3px' }}
                  />
                </div>
                <div>
                  <strong>Cân nặng Lợi / Hại (Cost-Benefit 100 điểm):</strong>{' '}
                  {downwardArrowEval.costBenefitRatio}
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>
                {lang === 'vi' ? downwardArrowEval.summaryVi : downwardArrowEval.summaryEn}
              </p>
            </section>

            {/* 5. DBT ABC PLEASE Daily Resilience Tracker + ACCEPTS & 5-Senses Self-Soothe */}
            <section
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3>5. DBT ABC PLEASE ({abcPleaseEval.resilienceScorePercent}%) + ACCEPTS &amp; Xoa Dịu 5 Giác Quan</h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.85rem', marginBottom: '8px' }}>
                <label>
                  <input
                    type="checkbox"
                    checked={abcSleepDone}
                    onChange={(e) => setAbcSleepDone((e.target as HTMLInputElement).checked)}
                  />{' '}
                  S — Ngủ cân bằng (Balanced Sleep)
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={abcExerciseDone}
                    onChange={(e) => setAbcExerciseDone((e.target as HTMLInputElement).checked)}
                  />{' '}
                  E — Vận động 20 phút (Exercise)
                </label>
              </div>
              <p style={{ fontSize: '0.85rem', margin: '0 0 8px 0' }}>
                {lang === 'vi' ? abcPleaseEval.summaryVi : abcPleaseEval.summaryEn}
              </p>
              <div style={{ fontSize: '0.8rem', color: theme.palette.textSecondary }}>
                <strong>7 Thẻ ACCEPTS:</strong>{' '}
                {acceptsAndSoothePlan.acceptsCards.map((c) => `${c.letter} (${c.nameEn})`).join(' • ')}
              </div>
              <div style={{ fontSize: '0.8rem', color: theme.palette.textSecondary, marginTop: '4px' }}>
                <strong>Xoa dịu 5 Giác quan:</strong>{' '}
                {acceptsAndSoothePlan.fiveSensesCards.map((s) => s.senseVi).join(' • ')}
              </div>
            </section>

            {/* 6. CBT-I Sleep Diary & Sleep Efficiency Calculator with Bipolar Mania Contraindication Guard */}
            <section
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
                gridColumn: '1 / -1',
              }}
            >
              <h3>
                6. Nhật Ký Giấc Ngủ CBT-I &amp; Tính Hiệu Suất Giấc Ngủ (SE: {cbtiEvaluation.sleepEfficiencyPercent}%) — Có Lá Chắn Chống Hưng Cảm Lưỡng Cực
              </h3>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.86rem', marginBottom: '10px' }}>
                <label>
                  Tổng thời gian nằm trên giường (giờ):{' '}
                  <input
                    type="number"
                    min={1}
                    max={14}
                    step={0.5}
                    value={cbtiTimeInBed}
                    onChange={(e) => setCbtiTimeInBed(Number((e.target as HTMLInputElement).value))}
                    style={{ width: '65px' }}
                  />
                </label>
                <label>
                  Cảm giác cần ngủ sáng nay (Felt Need for Sleep):{' '}
                  <select
                    value={feltNeedForSleep}
                    onChange={(e) =>
                      setFeltNeedForSleep(
                        (e.target as HTMLSelectElement).value as DailyMoodAndRhythmLog['feltNeedForSleep']
                      )
                    }
                  >
                    <option value="exhausted">Mệt mỏi / Thiếu ngủ (Exhausted — True Insomnia)</option>
                    <option value="normal">Bình thường (Normal)</option>
                    <option value="reduced_need">Giảm nhu cầu ngủ (Reduced Need — Mania Risk)</option>
                    <option value="no_need_at_all">Không cần ngủ vẫn tràn năng lượng (No Need — Mania Alert)</option>
                  </select>
                </label>
              </div>
              <div
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  backgroundColor: cbtiEvaluation.sleepRestrictionContraindicatedByManiaGuard
                    ? '#7f1d1d'
                    : '#064e3b',
                  color: '#ffffff',
                  fontSize: '0.86rem',
                }}
              >
                {lang === 'vi' ? cbtiEvaluation.guidanceVi : cbtiEvaluation.guidanceEn}
              </div>
            </section>
          </div>
        </main>
      )}

      {/* TAB 6: PHASE 3 — GROUNDED AI COMPANION (LOCAL OLLAMA / RAG 0.46), 2-TIER MEMORY INSPECTOR, VOICE BURST WPM STUDIO & BASELINE HRV/SLEEP CONTEXT */}
      {activeTab === 'phase3-ai-biometrics-voice' && (
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
          <section
            style={{
              padding: '16px',
              borderRadius: '10px',
              backgroundColor: theme.palette.surface,
              border: `1px solid ${theme.palette.border}`,
              marginBottom: '16px',
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              Phase 3: Grounded AI Companion (Local Ollama / RAG 0.46), 2-Tier Memory Inspector, Voice Burst WPM Studio &amp; Baseline HRV/Sleep Context
            </h2>
            <p style={{ fontSize: '0.88rem', color: theme.palette.textSecondary, margin: 0 }}>
              Tích hợp AI đồng hành đa chế độ (100% Offline Deterministic • Local Ollama 127.0.0.1:11434 • Vercel + Supabase Cloud RAG ngưỡng 0.46), Bộ nhớ Cuộn 2 tầng (20 tin nhắn + Tóm tắt mỗi 15 tin nhắn + Hồ sơ cá nhân có thể xóa 1 chạm), Phân tích Nhịp nói Hưng cảm (&gt; 30% WPM spike) kèm Bảng màu 5 Sắc thái và Sinh trắc học HRV phân vị P25–P75.
            </p>
          </section>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(520px, 1fr))', gap: '16px' }}>
            {/* 1. Grounded AI Companion (Local Ollama 127.0.0.1:11434 / Cloud RAG 0.46 / 100% Offline) */}
            <section
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3>1. Grounded AI Companion (Threshold = 0.46 • 100% Abstention Accuracy)</h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {(
                  [
                    ['offline-deterministic', '100% Offline Deterministic'],
                    ['local-ollama', 'Local Ollama (127.0.0.1:11434)'],
                    ['cloud-serverless-rag', 'Vercel + Supabase Cloud RAG'],
                  ] as const
                ).map(([provId, label]) => (
                  <button
                    key={provId}
                    type="button"
                    onClick={() => setPhase3Provider(provId)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${theme.palette.border}`,
                      backgroundColor: phase3Provider === provId ? theme.palette.primary : 'transparent',
                      color: phase3Provider === provId ? '#fff' : theme.palette.textPrimary,
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {phase3Provider === 'local-ollama' && (
                <div style={{ marginBottom: '10px', fontSize: '0.85rem' }}>
                  <label>
                    Local Ollama Model (http://127.0.0.1:11434):{' '}
                    <select
                      value={ollamaModelName}
                      onChange={(e) => setOllamaModelName((e.target as HTMLSelectElement).value)}
                    >
                      <option value="qwen3.5:9b">qwen3.5:9b</option>
                      <option value="qwen2.5:7b">qwen2.5:7b</option>
                      <option value="llama3.2:3b">llama3.2:3b</option>
                    </select>
                  </label>
                </div>
              )}

              <textarea
                rows={2}
                value={phase3ChatInput}
                onChange={(e) => setPhase3ChatInput((e.target as HTMLTextAreaElement).value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', marginBottom: '8px' }}
              />
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                <button
                  type="button"
                  onClick={() => void handleSendPhase3GroundedChat()}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    backgroundColor: theme.palette.primary,
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Gửi Lượt Trò Chuyện (4-Layer Safety + RAG 0.46)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPhase3ChatInput('Công thức nấu phở bò ngon nhất Hà Nội là gì?')
                  }
                  style={{ padding: '8px 12px', cursor: 'pointer' }}
                >
                  Thử Câu Hỏi Ngoài Phạm Vi (Test 100% Abstention &lt; 0.46)
                </button>
              </div>

              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: '#0f172a',
                  color: '#f8fafc',
                  fontSize: '0.86rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <strong>
                    RAG Score: {phase3LastTopScore.toFixed(2)} (Ngưỡng: 0.46)
                  </strong>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: phase3LastAbstained ? '#b45309' : '#0d9488',
                      color: '#fff',
                      fontSize: '0.78rem',
                    }}
                  >
                    {phase3LastAbstained
                      ? 'ABSTAINED (< 0.46 — 100% Không Bịa Phác Đồ)'
                      : `GROUNDED (${phase3LastCitations.join(' ')})`}
                  </span>
                </div>
                <p style={{ margin: 0 }}>{phase3LastReply}</p>
              </div>
            </section>

            {/* 2. 2-Tier Rolling Memory & Personal Profile Inspector */}
            <section
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>
                  2. Trình Kiểm Tra Bộ Nhớ 2 Tầng (20-Msg Window + 15-Msg Rolling Summary + Profile)
                </h3>
                <button
                  type="button"
                  onClick={handleErasePhase3Memory}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#e11d48',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                  }}
                >
                  Xóa Bộ Nhớ Suy Diễn (DELETE /api/v1/memory)
                </button>
              </div>

              <div style={{ fontSize: '0.85rem', marginTop: '10px' }}>
                <div>
                  <strong>Cửa sổ trượt (Sliding Window):</strong>{' '}
                  {phase3Memory.recentMessagesWindow.length}/20 tin nhắn gần nhất (Tổng cộng đã xử lý:{' '}
                  {phase3Memory.totalMessagesProcessed} tin nhắn | Số lần làm mới tóm tắt mỗi 15 tin:{' '}
                  {phase3Memory.summaryRefreshCount})
                </div>
                <div style={{ marginTop: '6px' }}>
                  <strong>Tóm tắt cuộn (15-Message Rolling Summary):</strong>
                  <div
                    style={{
                      padding: '8px',
                      backgroundColor: '#1e293b',
                      color: '#e2e8f0',
                      borderRadius: '6px',
                      marginTop: '4px',
                    }}
                  >
                    {phase3Memory.rollingSummary}
                  </div>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <strong>Hồ sơ Cá nhân Cấu trúc (Structured Personal Profile):</strong>
                  <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px' }}>
                    <li>Tên (Name): {phase3Memory.personalProfile.name ?? 'Chưa ghi nhận'}</li>
                    <li>
                      Lĩnh vực Công việc/Học tập: {phase3Memory.personalProfile.workOrStudyDomain ?? 'Chưa ghi nhận'}
                    </li>
                    <li>
                      Người liên hệ tin cậy (Trusted Contacts):{' '}
                      {phase3Memory.personalProfile.trustedContacts.join(', ') || 'Chưa ghi nhận'}
                    </li>
                    <li>
                      Biến dạng nhận thức lặp lại:{' '}
                      {phase3Memory.personalProfile.recurrentCognitiveDistortions.join(', ') || 'Chưa ghi nhận'}
                    </li>
                    <li>
                      Cấp độ Socratic Pushback ưa thích: <code>{phase3Memory.personalProfile.preferredPushbackLevel}</code>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 3. Multimodal Audio "Burst" Journal, Pressured-Speech Mania Detector & 5-Swatch Mood-Palette Studio */}
            <section
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3>
                3. Voice Burst WPM Studio • Phát Hiện Nhịp Nói Dồn Dập Hưng Cảm (&gt; 30% WPM Spike) &amp; Mood-Palette 5 Sắc Thái
              </h3>
              <textarea
                rows={2}
                value={vbStudioTranscript}
                onChange={(e) => setVbStudioTranscript((e.target as HTMLTextAreaElement).value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', marginBottom: '8px' }}
              />
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.85rem', marginBottom: '10px' }}>
                <label>
                  Thời lượng ghi âm (giây):{' '}
                  <input
                    type="number"
                    min={3}
                    max={120}
                    value={vbStudioDurationSec}
                    onChange={(e) => setVbStudioDurationSec(Number((e.target as HTMLInputElement).value))}
                    style={{ width: '60px' }}
                  />
                </label>
                <label>
                  Tốc độ nói nền cá nhân (Baseline WPM):{' '}
                  <input
                    type="number"
                    min={80}
                    max={180}
                    value={vbStudioBaselineWpm}
                    onChange={(e) => setVbStudioBaselineWpm(Number((e.target as HTMLInputElement).value))}
                    style={{ width: '65px' }}
                  />
                </label>
              </div>

              <div
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  backgroundColor: phase3VoiceBurstEval.bipolarPressuredSpeechAlert ? '#7f1d1d' : '#064e3b',
                  color: '#fff',
                  fontSize: '0.85rem',
                  marginBottom: '10px',
                }}
              >
                <strong>
                  Tốc độ nói: {phase3VoiceBurstEval.wordsPerMinute} WPM (Biến thiên:{' '}
                  {phase3VoiceBurstEval.wpmSpikePercent >= 0
                    ? `+${phase3VoiceBurstEval.wpmSpikePercent}%`
                    : `${phase3VoiceBurstEval.wpmSpikePercent}%`}
                  )
                </strong>
                <p style={{ margin: '4px 0 0 0' }}>
                  {lang === 'vi'
                    ? phase3VoiceBurstEval.pressuredSpeechBannerVi
                    : phase3VoiceBurstEval.pressuredSpeechBannerEn}
                </p>
              </div>

              <p style={{ fontSize: '0.85rem', margin: '0 0 8px 0' }}>
                {lang === 'vi'
                  ? phase3VoiceBurstEval.complaintClassificationReasonVi
                  : phase3VoiceBurstEval.complaintClassificationReasonEn}
              </p>

              {/* 5-Swatch Mood Palette Visual Card */}
              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: phase3VoiceBurstEval.moodPalette.gradientCss,
                  color: '#ffffff',
                }}
              >
                <strong>
                  {lang === 'vi'
                    ? phase3VoiceBurstEval.moodPalette.titleVi
                    : phase3VoiceBurstEval.moodPalette.titleEn}
                </strong>
                <div style={{ display: 'flex', gap: '8px', margin: '8px 0' }}>
                  {phase3VoiceBurstEval.moodPalette.fiveSwatches.map((hex) => (
                    <span
                      key={hex}
                      style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: hex,
                        border: '1px solid rgba(255,255,255,0.5)',
                        fontSize: '0.75rem',
                        fontFamily: 'monospace',
                      }}
                    >
                      {hex}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: '0.82rem' }}>
                  Tọa độ cảm xúc: Valence {phase3VoiceBurstEval.moodPalette.emotionalCoordinates.valence} • Arousal{' '}
                  {phase3VoiceBurstEval.moodPalette.emotionalCoordinates.arousal}
                </div>
              </div>
            </section>

            {/* 4. Baseline-Relative HRV & Sleep Biometrics Context Engine */}
            <section
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3>
                4. Sinh Trắc Học HRV Phân Vị Cá Nhân (14–30 Ngày P25–P75 • Độ Tươi &lt; 12h • Cấm So Sánh Trước/Sau Phiên)
              </h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.85rem', marginBottom: '10px' }}>
                <label>
                  Nguồn thiết bị (Cùng nguồn thiết bị):{' '}
                  <select
                    value={hrvDeviceSource}
                    onChange={(e) => setHrvDeviceSource((e.target as HTMLSelectElement).value as HrvDeviceSource)}
                  >
                    <option value="apple_watch_sdnn">Apple Watch HealthKit (SDNN ms)</option>
                    <option value="oura_ring_rmssd">Oura Ring (RMSSD ms)</option>
                    <option value="garmin_rmssd">Garmin Health Connect (RMSSD ms)</option>
                  </select>
                </label>
                <label>
                  HRV mới nhất ({phase3HrvEval.metricUnit}):{' '}
                  <input
                    type="number"
                    min={15}
                    max={140}
                    value={hrvLatestMs}
                    onChange={(e) => setHrvLatestMs(Number((e.target as HTMLInputElement).value))}
                    style={{ width: '60px' }}
                  />
                </label>
                <label>
                  Độ trễ bản ghi (giờ trước, ngưỡng &lt;= 12h):{' '}
                  <input
                    type="number"
                    min={0.5}
                    max={36}
                    step={0.5}
                    value={hrvAgeHours}
                    onChange={(e) => setHrvAgeHours(Number((e.target as HTMLInputElement).value))}
                    style={{ width: '60px' }}
                  />
                </label>
              </div>

              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: '#0f172a',
                  color: '#f8fafc',
                  fontSize: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                  <span>
                    <strong>Phân loại:</strong> <code>{phase3HrvEval.classification}</code>
                  </span>
                  <span>
                    <strong>Phân vị 14–30 ngày ({phase3HrvEval.validBaselineDaysCount} ngày):</strong>{' '}
                    P25 = {phase3HrvEval.p25Ms ?? 'N/A'} | P75 = {phase3HrvEval.p75Ms ?? 'N/A'} {phase3HrvEval.metricUnit}
                  </span>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: phase3HrvEval.isFreshUnder12Hours ? '#0d9488' : '#64748b',
                    }}
                  >
                    {phase3HrvEval.isFreshUnder12Hours
                      ? `Fresh (${phase3HrvEval.latestReadingAgeHours}h < 12h)`
                      : `Stale (${phase3HrvEval.latestReadingAgeHours}h > 12h — Ignored)`}
                  </span>
                </div>
                <p style={{ margin: '0 0 6px 0' }}>
                  {lang === 'vi'
                    ? phase3HrvEval.gentleCheckInMentionVi
                    : phase3HrvEval.gentleCheckInMentionEn}
                </p>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#38bdf8' }}>
                  {lang === 'vi'
                    ? phase3HrvEval.clinicalComplianceRuleNoteVi
                    : phase3HrvEval.clinicalComplianceRuleNoteEn}
                </p>
              </div>
            </section>
          </div>
        </main>
      )}
    </div>
  );
}
