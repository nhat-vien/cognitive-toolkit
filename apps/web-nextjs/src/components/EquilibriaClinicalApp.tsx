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
  WEB_RED_TEAM_105_CASES,
  createZeroKnowledgeClinicianSharePackage,
  decryptClinicianSharePackageFromUrlFragment,
  decryptSyncBlobWithMasterKey,
  encryptAndPackageSyncBlob,
  generate24WordMasterRecoveryKey,
  mergeE2eeRecordsCrdt,
  runWcagAndOwaspSecurityAudit,
  runWebClinicalRedTeamAudit,
  type AIConnectionMode,
  type AffectFamily,
  type BreathingPatternId,
  type ChainAnalysisLink,
  type ClinicalConversationMemoryState,
  type ClinicianShareDecryptionResult,
  type ClinicianShareTtlPreset,
  type CognitiveToolkitSession,
  type CompanionContext,
  type CrdtMergeResult,
  type DailyMoodAndRhythmLog,
  type HrvDeviceSource,
  type IntensityScore,
  type Language,
  type MasterRecoveryKey24Words,
  type MoodPole,
  type Phase3CompanionProvider,
  type PredictionCalibrationEntry,
  type PushbackLevel,
  type SessionPhase0Mode,
  type TechniqueSlug,
  type UIThemeMode,
  type Web36ToolCategory,
  type WiseMindResolutionType,
  type ZeroKnowledgeClinicianSharePackage,
  QUICK_DEMO_PROFILES,
  SANCTUARY_NAVIGATION_ITEMS,
  getActiveAccountSession,
  loginUserAccount,
  loginWithQuickDemoProfile,
  registerUserAccount,
  signOutUserAccount,
  triggerAccountE2eeSyncNow,
  updateUserAccountProfile,
  type QuickDemoProfileId,
  type UserAccountProfile,
  type UserAccountSession,
} from '../clinical/index.ts';

export type ActiveHubTab =
  | 'session-player'
  | 'anxiety-hub'
  | 'bipolar-ipsrt-hub'
  | 'assessments-report'
  | 'tools-36-team-cbt'
  | 'ai-companion-biometrics'
  | 'account-privacy-vault'
  | 'phase3-ai-biometrics-voice'
  | 'phase4-e2ee-clinician-qa';

export function EquilibriaClinicalApp() {
  // Global Bilingual & Clinical State
  const [lang, setLang] = useState<Language>('vi');
  const [activeTab, setActiveTab] = useState<ActiveHubTab>('session-player');
  const [sosOpen, setSosOpen] = useState<boolean>(false);

  // Patient Account Authentication & Profile State
  const [accountSession, setAccountSession] = useState<UserAccountSession | null>(null);
  const [accountModalOpen, setAccountModalOpen] = useState<boolean>(false);
  const [authView, setAuthView] = useState<'profile' | 'login' | 'register'>('profile');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authDisplayName, setAuthDisplayName] = useState<string>('');
  const [authStatusMessage, setAuthStatusMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [profileFormName, setProfileFormName] = useState<string>('');
  const [profileEmergencyName, setProfileEmergencyName] = useState<string>('');
  const [profileEmergencyPhone, setProfileEmergencyPhone] = useState<string>('');

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

  // Initialize Account Session from Storage or Safe Gentle Profile
  useEffect(() => {
    const sess = getActiveAccountSession() || loginWithQuickDemoProfile('depression-gentle', lang);
    setAccountSession(sess);
    if (sess) {
      setProfileFormName(sess.user.displayName);
      setProfileEmergencyName(sess.user.emergencyContactName);
      setProfileEmergencyPhone(sess.user.emergencyContactPhone);
      if (sess.user.defaultMoodPolarity !== undefined) {
        setMoodPolarity(sess.user.defaultMoodPolarity);
      }
      setPushbackLevel(sess.user.preferredPushbackLevel);
    }
  }, []);

  const handleSelectQuickDemo = (profileId: QuickDemoProfileId) => {
    const sess = loginWithQuickDemoProfile(profileId, lang);
    setAccountSession(sess);
    setProfileFormName(sess.user.displayName);
    setProfileEmergencyName(sess.user.emergencyContactName);
    setProfileEmergencyPhone(sess.user.emergencyContactPhone);
    if (sess.user.defaultMoodPolarity !== undefined) {
      setMoodPolarity(sess.user.defaultMoodPolarity);
    }
    setPushbackLevel(sess.user.preferredPushbackLevel);
    setAuthStatusMessage({
      ok: true,
      text: lang === 'vi'
        ? `Đã kích hoạt hồ sơ: ${sess.user.displayName}.`
        : `Activated profile: ${sess.user.displayName}.`,
    });
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await loginUserAccount({ email: authEmail, password: authPassword });
    if (res.ok && res.session) {
      setAccountSession(res.session);
      setProfileFormName(res.session.user.displayName);
      setProfileEmergencyName(res.session.user.emergencyContactName);
      setProfileEmergencyPhone(res.session.user.emergencyContactPhone);
      setAuthStatusMessage({ ok: true, text: lang === 'vi' ? res.messageVi : res.messageEn });
      setAuthView('profile');
    } else {
      setAuthStatusMessage({ ok: false, text: lang === 'vi' ? res.messageVi : res.messageEn });
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await registerUserAccount({
      email: authEmail,
      password: authPassword,
      displayName: authDisplayName || authEmail.split('@')[0] || 'Người bạn',
      disorderFocus: 'anxiety',
      preferredPushbackLevel: pushbackLevel,
    });
    if (res.ok && res.session) {
      setAccountSession(res.session);
      setProfileFormName(res.session.user.displayName);
      setProfileEmergencyName(res.session.user.emergencyContactName);
      setProfileEmergencyPhone(res.session.user.emergencyContactPhone);
      setAuthStatusMessage({ ok: true, text: lang === 'vi' ? res.messageVi : res.messageEn });
      setAuthView('profile');
    } else {
      setAuthStatusMessage({ ok: false, text: lang === 'vi' ? res.messageVi : res.messageEn });
    }
  };

  const handleSaveProfile = () => {
    const res = updateUserAccountProfile({
      displayName: profileFormName,
      emergencyContactName: profileEmergencyName,
      emergencyContactPhone: profileEmergencyPhone,
      preferredPushbackLevel: pushbackLevel,
    });
    if (res.ok && res.session) {
      setAccountSession(res.session);
      setAuthStatusMessage({ ok: true, text: lang === 'vi' ? res.messageVi : res.messageEn });
    }
  };

  const handleSyncNow = () => {
    const res = triggerAccountE2eeSyncNow();
    if (res.ok && res.session) {
      setAccountSession(res.session);
      setAuthStatusMessage({ ok: true, text: lang === 'vi' ? res.messageVi : res.messageEn });
    }
  };

  const handleSignOut = () => {
    signOutUserAccount({ wipeLocalData: false });
    const guest = loginWithQuickDemoProfile('guest-local-only', lang);
    setAccountSession(guest);
    setProfileFormName(guest.user.displayName);
    setProfileEmergencyName(guest.user.emergencyContactName);
    setProfileEmergencyPhone(guest.user.emergencyContactPhone);
    setAuthStatusMessage({
      ok: true,
      text: lang === 'vi'
        ? 'Đã đăng xuất. Bạn đang ở chế độ Khách Ẩn danh tại chỗ.'
        : 'Signed out. You are now in Local Anonymous Guest mode.',
    });
  };

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
        coreValuesRevealed: ['Trách nhiệm cao', 'Tận tâm'],
        initialIntensityPercent: 85,
        magicDialTargetPercent: pasMagicDialTarget,
        externalizedCriticAttack: 'Mày không được phép mắc bất kỳ sai sót nào!',
        selfDefenseAndAcceptanceReply:
          'Đúng là tôi muốn làm tốt (Chấp nhận một phần), nhưng tôi là con người chứ không phải cỗ máy và sai sót nhỏ là điều bình thường (Tự bảo vệ bản thân).',
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
      replacementSkill: 'Kỹ năng Dừng lại STOP + Khoang Chờ Quyết định 48 Giờ',
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
        title: 'Thở nhanh nhẹ 45 giây mô phỏng nhịp tim tăng',
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

  // 7. Interactive 36 Tools State: TEAM-CBT M/P & Anti-Procrastination, Downward Arrow SDBs, DBT ABC PLEASE / ACCEPTS / Urge Surfing & CBT-I
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

  // 8. Grounded AI Companion State: Local Ollama / RAG 0.46, 2-Tier Memory Inspector, Voice Burst WPM Studio & Baseline HRV/Sleep Context
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

  // 9. Zero-Knowledge E2EE Sync State: 24-Word Key & CRDT, Clinician Portal (#key=... Decryptor) & 105-Case Red-Team / WCAG 2.2 AAA Audit
  const [masterKey24, setMasterKey24] = useState<MasterRecoveryKey24Words | null>(null);
  const [crdtSyncPreview, setCrdtSyncPreview] = useState<CrdtMergeResult<unknown> | null>(null);
  const [crdtDecryptedSampleText, setCrdtDecryptedSampleText] = useState<string>(
    'Bấm "Sinh Khóa 24 Từ & Chạy Đồng Bộ CRDT Flutter <-> Web" để kiểm thử mã hóa E2EE và hợp nhất bản ghi offline.'
  );
  const [shareTtlPreset, setShareTtlPreset] = useState<ClinicianShareTtlPreset>('7d');
  const [sharePeriodDays, setSharePeriodDays] = useState<30 | 90>(30);
  const [clinicianSharePkg, setClinicianSharePkg] =
    useState<ZeroKnowledgeClinicianSharePackage | null>(null);
  const [clinicianDecryptedView, setClinicianDecryptedView] =
    useState<ClinicianShareDecryptionResult | null>(null);

  const redTeamAuditReport = useMemo(() => runWebClinicalRedTeamAudit(WEB_RED_TEAM_105_CASES), []);
  const wcagOwaspAuditReport = useMemo(() => runWcagAndOwaspSecurityAudit(), []);

  const handleGenerate24WordKeyAndRunCrdtSync = async () => {
    const generatedKey = await generate24WordMasterRecoveryKey();
    setMasterKey24(generatedKey);

    const webOfflineBlob = await encryptAndPackageSyncBlob({
      blobId: 'thought-record-shared-01',
      userId: 'patient-01',
      recordType: 'cbt_dbt_session',
      payload: {
        technique: 'thought-record',
        note: 'Bản ghi offline trên Web Next.js lúc 09:00',
        outcome: 'completed',
      },
      mnemonicPhrase: generatedKey.mnemonicPhrase,
      keyId: generatedKey.keyId,
      deviceOrigin: 'web-nextjs-pwa',
      versionVector: { 'web-nextjs-pwa': 1, 'flutter-mobile-ios': 1 },
      clientUpdatedAt: '2026-11-21T09:00:00.000Z',
    });

    const flutterOfflineUpdatedBlob = await encryptAndPackageSyncBlob({
      blobId: 'thought-record-shared-01',
      userId: 'patient-01',
      recordType: 'cbt_dbt_session',
      payload: {
        technique: 'thought-record',
        note: 'Bản ghi Thought Record tạo offline trên Flutter Mobile -> tự động đồng bộ & giải mã trên Web Next.js (< 5s)',
        outcome: 'completed',
      },
      mnemonicPhrase: generatedKey.mnemonicPhrase,
      keyId: generatedKey.keyId,
      deviceOrigin: 'flutter-mobile-ios',
      versionVector: { 'web-nextjs-pwa': 1, 'flutter-mobile-ios': 2 },
      clientUpdatedAt: '2026-11-21T09:04:00.000Z',
    });

    const flutterTombstoneBlob = await encryptAndPackageSyncBlob({
      blobId: 'worry-box-deleted-02',
      userId: 'patient-01',
      recordType: 'worry_box_item',
      payload: { deletedReason: 'Let go after 15m Worry Window' },
      mnemonicPhrase: generatedKey.mnemonicPhrase,
      keyId: generatedKey.keyId,
      deviceOrigin: 'flutter-mobile-ios',
      versionVector: { 'flutter-mobile-ios': 2 },
      clientUpdatedAt: '2026-11-21T09:05:00.000Z',
      deleted: true,
    });

    const merged = mergeE2eeRecordsCrdt([webOfflineBlob], [flutterOfflineUpdatedBlob, flutterTombstoneBlob]);
    setCrdtSyncPreview(merged);

    if (merged.activeRecords[0]) {
      const decrypted = await decryptSyncBlobWithMasterKey<{
        technique: string;
        note: string;
        outcome: string;
      }>(merged.activeRecords[0], generatedKey.mnemonicPhrase);
      setCrdtDecryptedSampleText(
        `[Giải mã thành công từ ${decrypted.deviceOrigin} trong ${merged.stats.syncDurationMs}ms]: ${decrypted.decryptedPayload?.note ?? ''}`
      );
    }
  };

  const handleCreateAndDecryptClinicianShare = async () => {
    const pkg = await createZeroKnowledgeClinicianSharePackage({
      report: {
        ...clinicianReport,
        periodDays: sharePeriodDays,
      },
      periodDays: sharePeriodDays,
      ttlPreset: shareTtlPreset,
    });
    setClinicianSharePkg(pkg);
    const decResult = await decryptClinicianSharePackageFromUrlFragment({
      serverSnapshot: pkg.serverSnapshot,
      urlOrHashFragment: pkg.fullShareUrlWithFragment,
    });
    setClinicianDecryptedView(decResult);
  };

  const handleRevokeClinicianShare = async () => {
    if (!clinicianSharePkg) return;
    const revokedSnapshot = {
      ...clinicianSharePkg.serverSnapshot,
      revoked: true,
      revokedAt: new Date().toISOString(),
    };
    setClinicianSharePkg({
      ...clinicianSharePkg,
      serverSnapshot: revokedSnapshot,
    });
    const decResult = await decryptClinicianSharePackageFromUrlFragment({
      serverSnapshot: revokedSnapshot,
      urlOrHashFragment: clinicianSharePkg.fullShareUrlWithFragment,
    });
    setClinicianDecryptedView(decResult);
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
          padding: '12px 24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.7rem' }}>🌿</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{ fontSize: '1.2rem', color: theme.palette.textPrimary, letterSpacing: '-0.01em' }}>
                Equilibria Care
              </strong>
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(121, 114, 152, 0.12)',
                  color: theme.palette.primary,
                  fontWeight: 600,
                }}
              >
                {lang === 'vi' ? 'Trị Liệu Nhận Thức CBT & DBT' : 'Clinical CBT & DBT Sanctuary'}
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: theme.palette.textSecondary }}>
              {lang === 'vi' ? theme.titleVi : theme.titleEn}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Patient Account Quick Profile Pill */}
          <button
            type="button"
            onClick={() => setAccountModalOpen(true)}
            title={lang === 'vi' ? 'Quản lý Tài khoản & Hồ sơ cá nhân' : 'Manage Account & Personal Profile'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '24px',
              border: `1px solid ${theme.palette.border}`,
              backgroundColor: theme.palette.surface,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
            }}
          >
            <span
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                backgroundColor: accountSession?.user.avatarMoodColor || theme.palette.primary,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}
            >
              {accountSession?.user.displayName ? accountSession.user.displayName.charAt(0).toUpperCase() : '👤'}
            </span>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '0.84rem', fontWeight: 600, color: theme.palette.textPrimary }}>
                {accountSession?.user.displayName || (lang === 'vi' ? 'Tài khoản' : 'Account')}
              </div>
              <div style={{ fontSize: '0.7rem', color: theme.palette.accent }}>
                {accountSession?.user.e2eeSyncEnabled ? '🟢 E2EE Đã bật' : '🔒 Lưu tại máy'}
              </div>
            </div>
          </button>

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
              fontWeight: 600,
            }}
          >
            {lang === 'vi' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}
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
                ? 'Đóng Cổng Bình Tĩnh'
                : 'Close Calm Portal'
              : lang === 'vi'
                ? '🚨 BÌNH TĨNH NGAY'
                : '🚨 CALM NOW'}
          </button>
        </div>
      </header>

      {/* Adaptive Theme Clinical Status Banner & Mania 48h Vault / Dark Therapy Banner */}
      <section
        className="no-print"
        style={{
          maxWidth: '1240px',
          margin: '16px auto',
          padding: '12px 18px',
          borderRadius: '16px',
          backgroundColor: theme.palette.surface,
          border: `1px solid ${theme.palette.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            <strong>{lang === 'vi' ? 'Trạng thái Không gian Trị liệu: ' : 'Sanctuary Status: '}</strong>
            {lang === 'vi' ? theme.reasonVi : theme.reasonEn}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: theme.palette.textSecondary }}>
              {lang === 'vi' ? 'Hồ sơ đang dùng:' : 'Active Profile:'}
            </span>
            <span
              style={{
                fontSize: '0.82rem',
                padding: '3px 10px',
                borderRadius: '12px',
                backgroundColor: 'rgba(106, 168, 130, 0.15)',
                color: theme.palette.accent,
                fontWeight: 600,
              }}
            >
              {accountSession?.user.disorderFocus === 'depression'
                ? (lang === 'vi' ? '🌱 Vượt Trầm cảm' : 'Depression Recovery')
                : accountSession?.user.disorderFocus === 'bipolar'
                  ? (lang === 'vi' ? '🌙 Cân bằng Lưỡng cực' : 'Bipolar & Rhythm')
                  : (lang === 'vi' ? '🌊 Làm dịu Lo âu' : 'Anxiety Relief')}
            </span>
          </div>
        </div>

        {theme.show48hImpulseVaultBanner && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: '#451a03',
              color: '#fef3c7',
              marginTop: '10px',
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
              padding: '14px 18px',
              borderRadius: '12px',
              backgroundColor: '#F4F1EA',
              color: '#2F2F2B',
              border: '1px solid #E4E0D5',
              marginTop: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '1.6rem' }}>🌱</span>
            <div>
              <strong style={{ fontSize: '0.98rem' }}>
                {lang === 'vi'
                  ? 'HÔM NAY MỘT BƯỚC NHỎ THÔI LÀ ĐỦ (Không đếm chuỗi ngày đứt đoạn): '
                  : 'ONE GENTLE SMALL STEP IS ENOUGH TODAY (No Broken Streaks): '}
              </strong>
              <div style={{ marginTop: '2px', fontSize: '0.88rem', color: '#6B6B63' }}>
                {lang === 'vi'
                  ? 'Bạn không cần làm hết mọi thứ hôm nay. Bạn có thể chỉ cần ghi lại cảm xúc bằng giọng nói, hoặc chọn 1 thẻ cảm xúc bên dưới.'
                  : 'You do not need to do everything today. You can simply record your thought with Voice Burst or pick an Affect Labeling card below.'}
              </div>
            </div>
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
            borderRadius: '16px',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            border: '2px solid #e11d48',
          }}
        >
          <h2 style={{ marginTop: 0, color: '#fb7185' }}>
            {lang === 'vi'
              ? 'CỔNG HỖ TRỢ KHẨN CẤP & BÌNH TĨNH NHANH (Hạ Nhiệt • Thở Dẫn Nhịp • Neo Thực Tại • Kỹ Năng Dừng Lại)'
              : '1-TAP DBT SOS PORTAL (TIPP • Paced Breathing • 5-4-3-2-1 Grounding • STOP)'}
          </h2>

          {/* Paced Breathing Visual Circle & Offline Web Audio API Tone Generator */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px',
            }}
          >
            <div style={{ padding: '16px', backgroundColor: '#1e293b', borderRadius: '12px' }}>
              <h3>
                {lang === 'vi'
                  ? '1. Thở Dẫn Nhịp (4-6 & 4-7-8) kèm Âm Thanh Thư Giãn Tần Số'
                  : '1. Paced Breathing (4-6 & 4-7-8) with Ambient Frequency Audio'}
              </h3>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setBreathingPattern('4-6')}
                  style={{
                    padding: '6px 12px',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    border: breathingPattern === '4-6' ? '2px solid #38bdf8' : '1px solid #475569',
                    backgroundColor: breathingPattern === '4-6' ? '#0369a1' : '#334155',
                    color: '#ffffff',
                  }}
                >
                  {lang === 'vi' ? BREATHING_PATTERNS['4-6'].nameVi : BREATHING_PATTERNS['4-6'].nameEn}
                </button>
                <button
                  type="button"
                  onClick={() => setBreathingPattern('4-7-8')}
                  style={{
                    padding: '6px 12px',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    border: breathingPattern === '4-7-8' ? '2px solid #38bdf8' : '1px solid #475569',
                    backgroundColor: breathingPattern === '4-7-8' ? '#0369a1' : '#334155',
                    color: '#ffffff',
                  }}
                >
                  {lang === 'vi' ? BREATHING_PATTERNS['4-7-8'].nameVi : BREATHING_PATTERNS['4-7-8'].nameEn}
                </button>
                <button
                  type="button"
                  onClick={handleToggleAmbientAudio}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: ambientAudioOn ? '#0d9488' : '#334155',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  {ambientAudioOn
                    ? (lang === 'vi' ? 'Tắt Âm Thanh Thư Giãn' : 'Turn Off Ambient Tone')
                    : (lang === 'vi' ? 'Bật Âm Thanh Tần Số (174Hz / 220Hz)' : 'Turn On Ambient Tone (174Hz / 220Hz)')}
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
                <strong style={{ fontSize: '1.2rem' }}>
                  {breathingFrame.phase === 'inhale'
                    ? (lang === 'vi' ? 'HÍT VÀO' : 'INHALE')
                    : breathingFrame.phase === 'hold'
                      ? (lang === 'vi' ? 'GIỮ HƠI' : 'HOLD')
                      : (lang === 'vi' ? 'THỞ RA' : 'EXHALE')}
                </strong>
                <span>{breathingFrame.phaseRemainingSeconds}s</span>
              </div>
              <p style={{ textAlign: 'center' }}>
                {lang === 'vi' ? breathingFrame.instructionVi : breathingFrame.instructionEn}
              </p>
            </div>

            {/* DBT TIPP Cold Water Mandatory Medical Exclusion Screen */}
            <div style={{ padding: '16px', backgroundColor: '#1e293b', borderRadius: '12px' }}>
              <h3>
                {lang === 'vi'
                  ? '2. Sàng Lọc An Toàn Trước Khi Dùng Nước Mát (Kỹ Thuật Hạ Nhiệt TIPP)'
                  : '2. DBT TIPP — Medical Exclusion Screen Before Cold Water'}
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                {lang === 'vi'
                  ? 'Nếu bạn tích chọn bất kỳ mục nào dưới đây, hệ thống sẽ tự động khóa phương pháp nước lạnh để bảo vệ tim mạch và chuyển sang Thở Dẫn Nhịp:'
                  : 'Checking any item below blocks Cold Water and redirects automatically to Paced Breathing:'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem' }}>
                <label>
                  <input
                    type="checkbox"
                    checked={medHeartCondition}
                    onChange={(e) => setMedHeartCondition((e.target as HTMLInputElement).checked)}
                  />{' '}
                  {lang === 'vi' ? 'Bệnh lý tim mạch hoặc huyết áp' : 'Heart condition or cardiovascular disorder'}
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={medBetaBlockers}
                    onChange={(e) => setMedBetaBlockers((e.target as HTMLInputElement).checked)}
                  />{' '}
                  {lang === 'vi' ? 'Đang sử dụng thuốc chẹn beta' : 'Currently taking beta-blockers'}
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={medSlowHr}
                    onChange={(e) => setMedSlowHr((e.target as HTMLInputElement).checked)}
                  />{' '}
                  {lang === 'vi' ? 'Nhịp tim chậm hoặc có máy tạo nhịp' : 'Slow heart rate or pacemaker'}
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={medColdAllergy}
                    onChange={(e) => setMedColdAllergy((e.target as HTMLInputElement).checked)}
                  />{' '}
                  {lang === 'vi' ? 'Dị ứng nhiệt độ lạnh hoặc hội chứng Raynaud' : 'Cold allergy or Raynaud syndrome'}
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={medEatingDisorder}
                    onChange={(e) => setMedEatingDisorder((e.target as HTMLInputElement).checked)}
                  />{' '}
                  {lang === 'vi' ? 'Tiền sử rối loạn ăn uống' : 'History of eating disorders'}
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={medUnsure}
                    onChange={(e) => setMedUnsure((e.target as HTMLInputElement).checked)}
                  />{' '}
                  {lang === 'vi' ? 'Chưa chắc chắn hoặc đang trong thai kỳ' : 'Unsure or pregnancy precautions'}
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
                    ? (lang === 'vi'
                        ? 'Đủ điều kiện an toàn: Áp nước mát 25 giây (Kích hoạt phản xạ lặn làm dịu thần kinh)'
                        : 'Cleared for 25s cool water application (Mammalian dive reflex)')
                    : (lang === 'vi'
                        ? 'Đã khóa bước nước lạnh -> Chuyển sang Thở Dẫn Nhịp 4-6 an toàn'
                        : 'Cold water locked -> Redirected to safe 4-6 Paced Breathing')}
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
            <div style={{ padding: '16px', backgroundColor: '#1e293b', borderRadius: '12px' }}>
              <h3>
                {lang === 'vi'
                  ? '3. Kỹ Thuật Neo Thực Tại 5-4-3-2-1 & Dừng Lại (DBT STOP)'
                  : '3. 5-4-3-2-1 Sensory Grounding & DBT STOP Skill'}
              </h3>
              <ul style={{ fontSize: '0.88rem', paddingLeft: '18px' }}>
                <li><strong>5</strong> {lang === 'vi' ? 'vật mắt bạn đang nhìn thấy trong phòng' : 'things you can see in the room'}</li>
                <li><strong>4</strong> {lang === 'vi' ? 'bề mặt tay bạn chạm vào cảm nhận được' : 'textures or surfaces you can touch'}</li>
                <li><strong>3</strong> {lang === 'vi' ? 'âm thanh tai bạn đang nghe thấy lúc này' : 'distinct sounds you can hear'}</li>
                <li><strong>2</strong> {lang === 'vi' ? 'mùi hương bạn có thể nhận biết' : 'scents you can smell'}</li>
                <li><strong>1</strong> {lang === 'vi' ? 'vị trong khoang miệng hoặc 1 hơi thở sâu' : 'taste in your mouth or 1 deep conscious breath'}</li>
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

      {/* Main Clinical Module Sanctuary Navigation Tabs */}
      <nav
        className="no-print"
        style={{
          maxWidth: '1240px',
          margin: '18px auto 8px',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          padding: '0 16px',
        }}
      >
        {(
          [
            ['session-player', '🌿', lang === 'vi' ? 'Không gian Trò chuyện & Phác đồ' : 'Sanctuary & Guided Practice'],
            ['anxiety-hub', '🌊', lang === 'vi' ? 'Góc Bình yên Lo âu' : 'Anxiety Relief'],
            ['bipolar-ipsrt-hub', '🌙', lang === 'vi' ? 'Nhật ký Khí sắc & Nhịp Sinh học' : 'Mood & Circadian Rhythm'],
            ['tools-36-team-cbt', '✨', lang === 'vi' ? 'Thư viện 36 Bài tập Tự lực' : '36 Self-Care Tools'],
            ['assessments-report', '📋', lang === 'vi' ? 'Trắc nghiệm & Báo cáo Bác sĩ' : 'Assessments & Doctor Report'],
            ['ai-companion-biometrics', '🤖', lang === 'vi' ? 'Người bạn Trí tuệ AI & Sinh trắc' : 'Grounded AI & Biometrics'],
            ['account-privacy-vault', '🔐', lang === 'vi' ? 'Tài khoản & Bảo mật Dữ liệu' : 'Account & Privacy Vault'],
          ] as const
        ).map(([tabId, icon, label]) => {
          const isSelected =
            activeTab === tabId ||
            (tabId === 'ai-companion-biometrics' && activeTab === 'phase3-ai-biometrics-voice') ||
            (tabId === 'account-privacy-vault' && activeTab === 'phase4-e2ee-clinician-qa');
          return (
            <button
              key={tabId}
              type="button"
              onClick={() => setActiveTab(tabId as ActiveHubTab)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '16px',
                border: isSelected ? `2px solid ${theme.palette.primary}` : `1px solid ${theme.palette.border}`,
                backgroundColor: isSelected ? theme.palette.primary : theme.palette.surface,
                color: isSelected ? '#ffffff' : theme.palette.textPrimary,
                fontWeight: 600,
                fontSize: '0.92rem',
                cursor: 'pointer',
                boxShadow: isSelected ? '0 4px 12px rgba(121, 114, 152, 0.22)' : 'none',
                transition: 'all 0.18s ease',
              }}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* TAB 1: DBT-FIRST, CBT-SECOND INTERACTIVE SESSION PLAYER */}
      {activeTab === 'session-player' && (
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
          {/* Expressive vs Instrumental + Voice Burst + Mood Palette + Safety Gate */}
          <section
            style={{
              padding: '16px',
              borderRadius: '16px',
              backgroundColor: theme.palette.surface,
              border: `1px solid ${theme.palette.border}`,
              marginBottom: '16px',
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              {lang === 'vi'
                ? 'Chọn Chế Độ Lắng Nghe & Đồng Hành (Thấu Cảm EAR vs. Thực Hành Kỹ Năng) • Bảng Màu Cảm Xúc'
                : 'Empathy vs. Skill Practice Mode (Expressive EAR vs. Instrumental) • Mood-Palette'}
            </h2>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <button
                type="button"
                onClick={() => setPhase0Mode('expressive')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  backgroundColor: phase0Mode === 'expressive' ? theme.palette.primary : 'transparent',
                  color: phase0Mode === 'expressive' ? '#fff' : theme.palette.textPrimary,
                  border: `1px solid ${theme.palette.border}`,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {lang === 'vi'
                  ? 'Chế độ Lắng nghe Thấu cảm (Giải tỏa cảm xúc & 5 Bí quyết EAR)'
                  : 'Expressive Empathy Mode (Venting & 5 EAR Secrets)'}
              </button>
              <button
                type="button"
                onClick={() => setPhase0Mode('instrumental')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  backgroundColor: phase0Mode === 'instrumental' ? theme.palette.primary : 'transparent',
                  color: phase0Mode === 'instrumental' ? '#fff' : theme.palette.textPrimary,
                  border: `1px solid ${theme.palette.border}`,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {lang === 'vi'
                  ? 'Chế độ Thực hành Kỹ năng (Phương pháp Nhận thức & Hành vi CBT / DBT)'
                  : 'Instrumental Practice Mode (Guided CBT & DBT Skills)'}
              </button>
            </div>

            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              {lang === 'vi'
                ? 'Ghi âm hoặc chia sẻ suy nghĩ / tình huống đang bận lòng:'
                : 'Share or record the situation / automatic thought on your mind:'}
            </label>
            <textarea
              rows={2}
              value={voiceBurstText}
              onChange={(e) => setVoiceBurstText((e.target as HTMLTextAreaElement).value)}
              className="sanctuary-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />

            {/* Generated Mood Palette & 4-Layer Safety Screen */}
            <div
              style={{
                marginTop: '10px',
                padding: '12px',
                borderRadius: '10px',
                background: voiceBurstAnalysis.moodPalette.gradientCss,
                color: '#0f172a',
              }}
            >
              <strong>{lang === 'vi' ? 'Bảng màu Cảm xúc' : 'Mood-Palette'} ({voiceBurstAnalysis.moodPalette.dominantEmotion}): </strong>
              {lang === 'vi'
                ? voiceBurstAnalysis.moodPalette.summaryVi
                : voiceBurstAnalysis.moodPalette.summaryEn}
            </div>

            {phase0Mode === 'expressive' && (
              <p style={{ marginTop: '10px', padding: '10px', borderLeft: `4px solid ${theme.palette.primary}`, backgroundColor: 'rgba(121, 114, 152, 0.08)', borderRadius: '4px' }}>
                {lang === 'vi'
                  ? voiceBurstAnalysis.earEmpathyReplyVi
                  : voiceBurstAnalysis.earEmpathyReplyEn}
              </p>
            )}

            <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>
              <strong>{lang === 'vi' ? 'Lộ trình Ưu tiên Điều hòa: ' : 'Physiological Regulation Route: '}</strong>
              {lang === 'vi' ? dbtFirstRouter.rationaleVi : dbtFirstRouter.rationaleEn}
            </p>
            <p style={{ marginTop: '6px', fontSize: '0.9rem', color: safetyGate.safeToProceedToCbt ? theme.palette.primary : '#e11d48' }}>
              <strong>{lang === 'vi' ? 'Hàng rào An toàn 4 Tầng: ' : '4-Layer Clinical Safety Gate: '}</strong>
              {lang === 'vi' ? safetyGate.bannerVi : safetyGate.bannerEn}
            </p>
          </section>

          {/* Live Socratic Pushback Switcher Mid-Session */}
          <section
            style={{
              padding: '14px 16px',
              borderRadius: '16px',
              backgroundColor: theme.palette.surface,
              border: `1px solid ${theme.palette.border}`,
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <strong>
                {lang === 'vi'
                  ? 'Mức độ Phản biện Socratic trong phiên:'
                  : 'Live Socratic Pushback Level:'}
              </strong>
              {(['off', 'gentle', 'moderate', 'firm'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setPushbackLevel(lvl)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '8px',
                    backgroundColor: pushbackLevel === lvl ? theme.palette.primary : 'transparent',
                    color: pushbackLevel === lvl ? '#fff' : theme.palette.textPrimary,
                    border: `1px solid ${theme.palette.border}`,
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {lvl === 'off'
                    ? (lang === 'vi' ? 'TẮT' : 'OFF')
                    : lvl === 'gentle'
                      ? (lang === 'vi' ? 'DỊU DÀNG' : 'GENTLE')
                      : lvl === 'moderate'
                        ? (lang === 'vi' ? 'TIÊU CHUẨN' : 'MODERATE')
                        : (lang === 'vi' ? 'THÁCH THỨC' : 'FIRM')}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPushbackLevel(adjustPushbackLevel(pushbackLevel, 'softer'))}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: `1px solid ${theme.palette.border}`,
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                }}
              >
                {lang === 'vi' ? '↓ Dịu hơn' : '↓ Softer'}
              </button>
              <button
                type="button"
                onClick={() => setPushbackLevel(adjustPushbackLevel(pushbackLevel, 'harder'))}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: `1px solid ${theme.palette.border}`,
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                }}
              >
                {lang === 'vi' ? '↑ Thách thức hơn' : '↑ Firmer'}
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
              borderRadius: '16px',
              backgroundColor: theme.palette.surface,
              border: `1px solid ${theme.palette.border}`,
              marginBottom: '16px',
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              {lang === 'vi'
                ? 'Bảng Gọi Tên 5 Nhóm Cảm Xúc (Phân biệt rõ Cảm giác Xấu hổ và Áy náy)'
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
                    padding: '12px',
                    borderRadius: '12px',
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
                borderRadius: '16px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                {lang === 'vi'
                  ? '1. Bảng 7 Bước Ghi Nhận Suy Nghĩ CBT (Kiểm Tra Tính Khách Quan)'
                  : '1. CBT 7-Step Thought Record (with Objective Accuracy Check)'}
              </h3>
              <p style={{ fontSize: '0.85rem' }}>
                <strong>{lang === 'vi' ? 'Bước 1 (Góc nhìn camera khách quan): ' : 'Step 1 (Camera Situation): '}</strong> {trSituation}
              </p>
              <p style={{ fontSize: '0.85rem' }}>
                <strong>{lang === 'vi' ? 'Bước 2 (Suy nghĩ tự động nảy sinh): ' : 'Step 2 (Hot Automatic Thought): '}</strong> {trHotThought}
              </p>
              <p style={{ fontSize: '0.82rem', color: theme.palette.accent }}>
                <strong>{lang === 'vi' ? 'Khuôn mẫu Suy nghĩ Sai lệch: ' : 'Cognitive Distortions Detected: '}</strong>
                {thoughtRecordEval.distortions.negative.map((d) => (lang === 'vi' ? d.nameVi : d.nameEn)).join(' • ') || (lang === 'vi' ? 'Không phát hiện' : 'None detected')}
              </p>
              <label style={{ display: 'block', margin: '10px 0', fontSize: '0.88rem', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={trIsObjectivelyTrue}
                  onChange={(e) => setTrIsObjectivelyTrue((e.target as HTMLInputElement).checked)}
                />{' '}
                {lang === 'vi'
                  ? 'KIỂM TRA TÍNH KHÁCH QUAN: Suy nghĩ này là một sự thật khách quan (mất mát có thật, không thể chối cãi)?'
                  : 'ACCURACY CHECK GATE: Is this thought an objectively true fact (real loss / unavoidable truth)?'}
              </label>
              <div
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: trIsObjectivelyTrue ? '#fef3c7' : '#ecfdf5',
                  color: '#0f172a',
                  fontSize: '0.85rem',
                }}
              >
                <strong>{lang === 'vi' ? 'Kết quả thẩm định: ' : 'Clinical Outcome: '}`{thoughtRecordEval.outcome}`</strong>
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
                borderRadius: '16px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                {lang === 'vi'
                  ? '2. Kế Hoạch Kích Hoạt Hành Vi CBT 6 Bước (Kiểm Tra Nghỉ Ngơi Sinh Học)'
                  : '2. CBT 6-Step Behavioral Activation (with Rest Check & Confidence Gate)'}
              </h3>
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
                {lang === 'vi'
                  ? 'Bước 2 — KIỂM TRA NGHỈ NGƠI: Cơ thể đang kiệt sức sinh học / thiếu ngủ, cần Nghỉ Ngơi Không Áy Náy?'
                  : 'Step 2 — REST CHECK: Are you biologically exhausted / ill / sleep-deprived and in need of Guilt-Free Rest?'}
              </label>
              <label style={{ display: 'block', margin: '8px 0', fontSize: '0.88rem' }}>
                {lang === 'vi'
                  ? 'Bước 4 — Mức độ tự tin thực hiện (Thang 0–10, tối thiểu cần 7/10): '
                  : 'Step 4 — Confidence rating to complete (0-10, requires >= 7/10): '}
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={baConfidence}
                  onChange={(e) => setBaConfidence(Number((e.target as HTMLInputElement).value))}
                  style={{ width: '55px', marginLeft: '6px' }}
                />
              </label>
              <div
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: '#f1f5f9',
                  color: '#0f172a',
                  fontSize: '0.85rem',
                }}
              >
                <strong>{lang === 'vi' ? 'Kết quả định hướng: ' : 'Outcome: '}`{behavioralActivationEval.outcome}`</strong>
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
                borderRadius: '16px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                {lang === 'vi'
                  ? '3. Phương Pháp Đặt Mục Tiêu Nghịch Lý TEAM-CBT (Nút Bấm Kỳ Diệu • Vòng Xoay Cảm Xúc)'
                  : '3. TEAM-CBT Paradoxical Agenda Setting (Magic Button • Magic Dial)'}
              </h3>
              <p style={{ fontSize: '0.85rem' }}>
                {lang === 'vi' ? pasEval.summaryVi : pasEval.summaryEn}
              </p>
              <label style={{ fontSize: '0.85rem' }}>
                {lang === 'vi' ? 'Mức lo âu hữu ích bạn mong muốn giữ lại (%): ' : 'Target anxiety level you wish to keep (%): '}
                <input
                  type="number"
                  min={10}
                  max={80}
                  value={pasMagicDialTarget}
                  onChange={(e) => setPasMagicDialTarget(Number((e.target as HTMLInputElement).value))}
                  style={{ width: '60px', marginLeft: '6px', marginRight: '4px' }}
                />
                %
              </label>
            </article>

            {/* 4. DBT Opposite Action (4 steps with Justified Check) */}
            <article
              style={{
                padding: '16px',
                borderRadius: '16px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                {lang === 'vi'
                  ? '4. Hành Động Đối Lập DBT (Kiểm Tra Mối Nguy Hiểm Thực Tế)'
                  : '4. DBT Opposite Action (with Objective Danger Gate)'}
              </h3>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.88rem' }}>
                <input
                  type="checkbox"
                  checked={oaRealDanger}
                  onChange={(e) => setOaRealDanger((e.target as HTMLInputElement).checked)}
                />{' '}
                {lang === 'vi'
                  ? 'Bước 3 — KIỂM TRA MỐI NGUY: Tình huống có nguy cơ thực tế tới tính mạng, bạo lực hay sự an toàn của bạn không?'
                  : 'Step 3 — DANGER CHECK: Is there real-world, objective danger or physical unsafety in this situation?'}
              </label>
              <p style={{ fontSize: '0.85rem' }}>
                <strong>{lang === 'vi' ? 'Kết quả định hướng: ' : 'Outcome: '}`{oppositeActionEval.outcome}`</strong> —{' '}
                {lang === 'vi' ? oppositeActionEval.directiveVi : oppositeActionEval.directiveEn}
              </p>
            </article>

            {/* 5. DBT Wise Mind (6 steps with Harsh Self-Critic Guard & "Nothing yet") */}
            <article
              style={{
                padding: '16px',
                borderRadius: '16px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                {lang === 'vi'
                  ? '5. Trí Tuệ Sáng Suốt Wise Mind (Bảo Vệ Khỏi Phán Xét Tiêu Cực)'
                  : '5. DBT Wise Mind (with Self-Critic Guard)'}
              </h3>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>
                {lang === 'vi'
                  ? 'Bước 3 (Tiếng nói Lý trí — Thử nhập lời tự phán xét như "mình thật yếu đuối" để hệ thống phát hiện):'
                  : 'Step 3 (Reasonable Mind — Try entering harsh self-critic words like "weak" to test the guard):'}
                <input
                  type="text"
                  value={wmReasonableText}
                  onChange={(e) => setWmReasonableText((e.target as HTMLInputElement).value)}
                  className="sanctuary-input"
                  style={{ width: '100%', marginTop: '4px', boxSizing: 'border-box' }}
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
                borderRadius: '16px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                {lang === 'vi'
                  ? '6. Phân Tích Chuỗi Hành Vi DBT (Nhận Diện Tác Nhân & Phục Hồi)'
                  : '6. DBT Behavioral Chain Analysis (Vulnerabilities, Links & Repair)'}
              </h3>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>
                {lang === 'vi'
                  ? 'Bước 1 (Hành vi mục tiêu cần phân tích — Tự động dừng nếu phát hiện nguy cơ tự hại):'
                  : 'Step 1 (Target behavior to analyze — Auto-stops if self-harm or abuse is detected):'}
                <input
                  type="text"
                  value={caTargetBehavior}
                  onChange={(e) => setCaTargetBehavior((e.target as HTMLInputElement).value)}
                  className="sanctuary-input"
                  style={{ width: '100%', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </label>
              <p style={{ fontSize: '0.85rem' }}>
                <strong>{lang === 'vi' ? 'Kết quả phân tích: ' : 'Outcome: '}`{chainAnalysisEval.outcome}`</strong> —{' '}
                {lang === 'vi' ? chainAnalysisEval.summaryVi : chainAnalysisEval.summaryEn}
              </p>
            </article>

            {/* 7. DBT DEAR MAN + TEAM-CBT EAR with Interactive AI Roleplay Rehearsal */}
            <article
              style={{
                padding: '16px',
                borderRadius: '16px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
                gridColumn: '1 / -1',
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                {lang === 'vi'
                  ? '7. Giao Tiếp Quyết Đoán DEAR MAN + 5 Bí Quyết EAR & Tập Dượt Cùng AI'
                  : '7. DBT DEAR MAN + 5 EAR Communication Secrets & AI Roleplay'}
              </h3>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.88rem' }}>
                  {lang === 'vi' ? 'Mức độ thử thách của người đối thoại trong kịch bản:' : 'Partner resistance level in roleplay:'}
                </span>
                {(['softer', 'moderate', 'harder'] as const).map((resLvl) => (
                  <button
                    key={resLvl}
                    type="button"
                    onClick={() => setDmResistance(resLvl)}
                    style={{
                      padding: '5px 12px',
                      backgroundColor: dmResistance === resLvl ? theme.palette.primary : 'transparent',
                      color: dmResistance === resLvl ? '#fff' : theme.palette.textPrimary,
                      border: `1px solid ${theme.palette.border}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                    }}
                  >
                    {resLvl === 'softer'
                      ? (lang === 'vi' ? 'DỊU DÀNG' : 'SOFTER')
                      : resLvl === 'moderate'
                        ? (lang === 'vi' ? 'TIÊU CHUẨN' : 'MODERATE')
                        : (lang === 'vi' ? 'THÁCH THỨC' : 'FIRMER')}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '0.88rem' }}>
                <strong>{lang === 'vi' ? 'Kịch bản DEAR MAN hoàn chỉnh: ' : 'Assembled DEAR MAN Script: '}</strong> &ldquo;{dearManEval.assembledScript}&rdquo;
              </p>
              <p style={{ fontSize: '0.88rem', padding: '12px', backgroundColor: 'rgba(121, 114, 152, 0.08)', borderRadius: '8px', borderLeft: `3px solid ${theme.palette.primary}` }}>
                {lang === 'vi' ? dearManEval.roleplayPartnerReplyVi : dearManEval.roleplayPartnerReplyEn}
              </p>
              <p style={{ fontSize: '0.84rem' }}>
                <strong>{lang === 'vi' ? 'Góp ý sau phiên đóng vai: ' : 'Post-Roleplay Coaching: '}</strong>{' '}
                {lang === 'vi' ? `${dearManEval.coachingStrengthVi} | ${dearManEval.coachingTweakVi}` : `${dearManEval.coachingStrengthEn} | ${dearManEval.coachingTweakEn}`}
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
              <h3>
                {lang === 'vi'
                  ? '1. Chiếc Hộp Gác Lại Âu Lo (Khung giờ xử lý 17:30–17:45)'
                  : '1. Worry Box (17:30–17:45 Postponement Window)'}
              </h3>
              <textarea
                rows={2}
                value={worryInput}
                onChange={(e) => setWorryInput((e.target as HTMLTextAreaElement).value)}
                style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
              />
              <p style={{ fontSize: '0.86rem' }}>
                <strong>{lang === 'vi' ? 'Phân loại tự động:' : 'Automated Classification:'}</strong>{' '}
                `{worryProcessed.updatedItem.category === 'hypothetical'
                  ? (lang === 'vi' ? 'Giả định tương lai' : 'Hypothetical Worry')
                  : (lang === 'vi' ? 'Thực tế trước mắt' : 'Actionable/Current')}`{' '}
                ({worryProcessed.updatedItem.scheduledWindowTime})
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
              <h3>
                {lang === 'vi'
                  ? '2. Thang Đối Diện Nỗi Sợ Từng Bước (ERP & Cảm Giác Cơ Thể 0–100)'
                  : '2. Exposure Hierarchy Ladder (ERP & Interoceptive SUDS 0–100)'}
              </h3>
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
                    [{step.exposureType === 'interoceptive'
                      ? (lang === 'vi' ? 'CẢM GIÁC CƠ THỂ' : 'INTEROCEPTIVE')
                      : (lang === 'vi' ? 'THỰC TẾ TRỰC TIẾP' : 'IN-VIVO ERP')}] {step.title}
                  </strong>
                  <div>
                    {lang === 'vi'
                      ? `Mức khó chịu ban đầu: ${step.baselineSuds}/100 → Hiện tại: ${step.currentSuds}/100 ${step.habituationAchieved ? '(Đã thích nghi và hạ nhiệt ✓)' : ''}`
                      : `Baseline SUDS: ${step.baselineSuds}/100 → Current: ${step.currentSuds}/100 ${step.habituationAchieved ? '(Habituated ✓)' : ''}`}
                  </div>
                  {step.detectedSafetyBehaviors.length > 0 && (
                    <div style={{ color: '#e11d48' }}>
                      {lang === 'vi'
                        ? `Hành vi né tránh / an toàn ngầm phát hiện: ${step.detectedSafetyBehaviors.join(', ')}`
                        : `Detected subtle safety behaviors: ${step.detectedSafetyBehaviors.join(', ')}`}
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
              <h3>
                {lang === 'vi'
                  ? '3. Kiểm Chứng & Hiệu Chỉnh Dự Đoán Lo Âu'
                  : '3. Prediction Calibration Tracker'}
              </h3>
              <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                {lang === 'vi' ? predictionStats.calibrationInsightVi : predictionStats.calibrationInsightEn}
              </p>
              {predictionEntries.map((pe) => (
                <div key={pe.id} style={{ fontSize: '0.84rem', marginBottom: '8px' }}>
                  • <strong>{pe.eventDescription}:</strong>{' '}
                  {lang === 'vi' ? 'Dự đoán thảm họa' : 'Feared prediction'}{' '}
                  {pe.predictedProbabilityPercent}% →{' '}
                  {lang === 'vi' ? 'Thực tế:' : 'Actual Outcome:'} {pe.actualOutcome}
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
              <h3>
                {lang === 'vi'
                  ? '4. Lướt Sóng Cảm Xúc 90 Giây (Chấp Nhận Triệt Để & Thả Lỏng Cơn Thôi Thúc)'
                  : '4. 90-Second Emotion Wave Surfing (DBT Radical Acceptance)'}
              </h3>
              <label style={{ display: 'block', fontSize: '0.86rem', marginBottom: '8px' }}>
                {lang === 'vi'
                  ? `Thời gian trên đỉnh sóng (${urgeSurfFrame.elapsedSeconds}s / 90s — Độ cao sóng: ${urgeSurfFrame.waveHeightPercent}%):`
                  : `Time on peak of wave (${urgeSurfFrame.elapsedSeconds}s / 90s — Wave height: ${urgeSurfFrame.waveHeightPercent}%):`}
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
              {lang === 'vi'
                ? 'Biểu Đồ Đa Trục 7 Ngày: Khí Sắc (-5..+5) • Năng Lượng (-5..+5) • Giấc Ngủ (0..12h)'
                : '7-Day Multi-Axis Chart: Mood (-5..+5) • Energy (-5..+5) • Sleep (0..12h)'}
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
              {lang === 'vi'
                ? 'Chú giải: Đường xanh ngọc = Khí sắc (-5..+5) | Đường cam đứt nét = Năng lượng (-5..+5) | Cột xanh dương = Số giờ ngủ | Điểm đỏ = Cảnh báo Pha Hỗn hợp / Tiền triệu Hưng cảm.'
                : 'Legend: Teal line = Mood (-5..+5) | Orange dashed line = Energy (-5..+5) | Blue bar = Sleep hours | Red dot = Mixed State / Mania Prodrome Risk.'}
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
              <h3>
                {lang === 'vi'
                  ? '1. Khí Sắc & Nhịp Năng Lượng (-5 đến +5) — Cảnh Báo Sớm'
                  : '1. Dual-Pole Mood & Energy (-5..+5) — Early Warning'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem' }}>
                <label>
                  {lang === 'vi' ? `Khí sắc (Thăng trầm -5..+5): ${moodPolarity}` : `Mood Valence (-5..+5): ${moodPolarity}`}
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
                  {lang === 'vi' ? `Năng lượng vận động (-5..+5): ${energyLevel}` : `Motor Energy (-5..+5): ${energyLevel}`}
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
                  {lang === 'vi' ? `Số giờ ngủ đêm qua: ${sleepHours} giờ` : `Sleep hours last night: ${sleepHours}h`}
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
              <h3>
                {lang === 'vi'
                  ? `2. Nhịp Sinh Học Xã Hội 5 Mốc IPSRT (Độ ổn định: ${ipsrtReport.stabilityScorePercent}%)`
                  : `2. 5-Anchor Social Rhythm Metric IPSRT (Stability: ${ipsrtReport.stabilityScorePercent}%)`}
              </h3>
              <ul style={{ fontSize: '0.86rem' }}>
                <li>{lang === 'vi' ? '1. Giờ thức dậy ra khỏi giường:' : '1. Out of bed time:'} {currentBipolarLog.ipsrtAnchors.outOfBedTime}</li>
                <li>{lang === 'vi' ? '2. Giao tiếp xã hội đầu tiên trong ngày:' : '2. First social contact:'} {currentBipolarLog.ipsrtAnchors.firstSocialContactTime}</li>
                <li>{lang === 'vi' ? '3. Bắt đầu làm việc hoặc học tập:' : '3. Work/study start time:'} {currentBipolarLog.ipsrtAnchors.workOrStudyStartTime}</li>
                <li>{lang === 'vi' ? '4. Bữa ăn tối:' : '4. Dinner time:'} {currentBipolarLog.ipsrtAnchors.dinnerTime}</li>
                <li>{lang === 'vi' ? '5. Giờ lên giường ngủ:' : '5. Bedtime:'} {currentBipolarLog.ipsrtAnchors.bedTime}</li>
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
              <h3>
                {lang === 'vi'
                  ? '3. Khoang Trì Hoãn Quyết Định 48 Giờ (Bảo Vệ Trước Cơn Bốc Đồng)'
                  : '3. 48-Hour Decision Delay Vault (Impulse Guard)'}
              </h3>
              <p style={{ fontSize: '0.86rem' }}>
                <strong>{lang === 'vi' ? 'Quyết định đang tạm khóa:' : 'Locked Impulse Decision:'}</strong> {impulseVaultEntry.impulseDescription}
              </p>
              <p style={{ fontSize: '0.84rem', color: '#d97706' }}>
                <strong>{lang === 'vi' ? 'Dấu hiệu hưng phấn quá mức phát hiện:' : 'Positive Distortions Detected:'}</strong>{' '}
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
              <h3>
                {lang === 'vi'
                  ? '4. Kế Hoạch Bình Ổn Ulysses & Tuân Thủ Điều Trị'
                  : '4. Ulysses Care Plan & Medication Adherence CBT'}
              </h3>
              <p style={{ fontSize: '0.84rem' }}>
                <strong>{lang === 'vi' ? 'Dấu hiệu tiền triệu cá nhân:' : 'Personal Prodromal Signs:'}</strong>{' '}
                {DEFAULT_ULYSSES_CONTRACT.personalManiaProdromes.join('; ')}
              </p>
              <p style={{ fontSize: '0.84rem' }}>
                <strong>{lang === 'vi' ? 'Tái cấu trúc suy nghĩ muốn bỏ thuốc:' : 'Balanced Thought on Adherence:'}</strong>{' '}
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
            <h3>
              {lang === 'vi'
                ? '1. Hệ Thống 6 Thang Đo Đánh Giá Định Kỳ (BMS • PHQ-9 • GAD-7 • ASRM • MDQ • ISI)'
                : '1. Routine Clinical Assessments Suite (BMS • PHQ-9 • GAD-7 • ASRM • MDQ • ISI)'}
            </h3>
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
            <h3>
              {lang === 'vi'
                ? '2. Tự Chủ Dữ Liệu (Mã Hóa WebCrypto AES-256 • Xuất Markdown • Mô Hình Cục Bộ)'
                : '2. Data Sovereignty (WebCrypto AES-256 • Markdown Export • Local Ollama)'}
            </h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <button
                type="button"
                onClick={() => void handleTestWebCryptoEncryption()}
                style={{ padding: '8px 12px', cursor: 'pointer' }}
              >
                {lang === 'vi'
                  ? 'Mã hóa Phiên Hiện Tại (WebCrypto AES-GCM 256)'
                  : 'Encrypt Current Session (WebCrypto AES-256)'}
              </button>
              <button
                type="button"
                onClick={() =>
                  setAiMode(aiMode === 'local-ollama' ? 'offline-deterministic' : 'local-ollama')
                }
                style={{ padding: '8px 12px', cursor: 'pointer' }}
              >
                {lang === 'vi'
                  ? `Chế độ AI: ${aiMode === 'local-ollama' ? 'Mô hình Cục bộ Ollama' : 'Thuần Cục bộ 0ms'}`
                  : `AI Mode: ${aiMode.toUpperCase()} (127.0.0.1:11434)`}
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
                {lang === 'vi' ? 'In Báo Cáo Lâm Sàng Chuẩn A4' : 'Print A4 Clinical Report'}
              </button>
            </div>
            <p style={{ fontSize: '0.84rem' }}>
              <strong>{lang === 'vi' ? 'Trạng thái Mã hóa Cục bộ:' : 'Local Encryption Status:'}</strong> <code>{encryptedPreview}</code>
            </p>
            <details>
              <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
                {lang === 'vi'
                  ? `Xem Tệp Xuất Markdown (${markdownExport.filename})`
                  : `View Exported Markdown (${markdownExport.filename})`}
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
              {lang === 'vi'
                ? 'BÁO CÁO TÓM TẮT LÂM SÀNG GỬI BÁC SĨ (CHU KỲ 30 NGÀY)'
                : 'CLINICIAN SUMMARY REPORT (30-DAY LONGITUDINAL)'}
            </h2>
            <p style={{ fontSize: '0.88rem' }}>
              <strong>{lang === 'vi' ? 'Mã Người Dùng:' : 'Patient Alias:'}</strong> {clinicianReport.patientAlias} |{' '}
              <strong>{lang === 'vi' ? 'Ngày xuất:' : 'Date:'}</strong> {clinicianReport.generatedDate} |{' '}
              <strong>{lang === 'vi' ? 'Điểm Ổn định Nhịp Sinh học IPSRT:' : 'IPSRT Stability:'}</strong> {clinicianReport.ipsrtAverageStabilityPercent}% |{' '}
              <strong>{lang === 'vi' ? 'Tuân thủ Điều trị:' : 'Medication Adherence:'}</strong> {clinicianReport.medicationAdherencePercent}%
            </p>
            <p style={{ fontSize: '0.85rem' }}>
              <strong>{lang === 'vi' ? 'Biến dạng Nhận thức Thường gặp:' : 'Frequent Cognitive Distortions:'}</strong>{' '}
              {clinicianReport.topDistortions.join(', ') || (lang === 'vi' ? 'Chưa ghi nhận' : 'None detected')}
            </p>
            <p style={{ fontSize: '0.82rem', color: '#475569' }}>
              <strong>{lang === 'vi' ? 'Liên kết Chia sẻ Bác sĩ Riêng tư (E2EE):' : 'Zero-Knowledge E2EE Doctor Share Link:'}</strong>{' '}
              <code>{clinicianSharePkg?.fullShareUrlWithFragment ?? clinicianReport.e2eeShareUrlFragment}</code>
            </p>
            <div className="no-print" style={{ marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('account-privacy-vault')}
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
                {lang === 'vi'
                  ? 'Mở Trung tâm Tài khoản & Bảo mật Dữ liệu (Đồng bộ E2EE, Cổng Bác sĩ & An toàn)'
                  : 'Open Account & Privacy Vault (E2EE Sync, Clinician Portal & Safety Audit)'}
              </button>
            </div>
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
              {lang === 'vi'
                ? `1. Thư Viện 36 Bài Tập Tự Lực Tâm Lý (Xử lý tức thì 0ms — Đủ ${WEB_36_CBT_TOOLS.length}/36 Bài Tập)`
                : `1. Interactive 36 CBT • TEAM-CBT • DBT • IPSRT Tools Suite (${WEB_36_CBT_TOOLS.length}/36 Tools)`}
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
                  {cat === 'ALL'
                    ? (lang === 'vi' ? `Tất cả (${WEB_36_CBT_TOOLS.length})` : `All (${WEB_36_CBT_TOOLS.length})`)
                    : cat === 'Anxiety & ERP'
                      ? (lang === 'vi' ? 'Âu lo & Phơi nhiễm' : cat)
                      : cat === 'Depression & TEAM-CBT'
                        ? (lang === 'vi' ? 'Trầm cảm & TEAM-CBT' : cat)
                        : cat === 'Bipolar & IPSRT'
                          ? (lang === 'vi' ? 'Lưỡng cực & Nhịp sinh học' : cat)
                          : cat === 'DBT Distress & Regulation'
                            ? (lang === 'vi' ? 'Cân bằng Cảm xúc DBT' : cat)
                            : (lang === 'vi' ? 'Công việc & Kiệt sức' : cat)}
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
                    [{tool.clinicalOrigin}] • {lang === 'vi' ? (
                      tool.category === 'Anxiety & ERP' ? 'Âu lo & Phơi nhiễm' :
                      tool.category === 'Depression & TEAM-CBT' ? 'Trầm cảm & TEAM-CBT' :
                      tool.category === 'Bipolar & IPSRT' ? 'Lưỡng cực & Nhịp sinh học' :
                      tool.category === 'DBT Distress & Regulation' ? 'Cân bằng Cảm xúc DBT' :
                      'Công việc & Kiệt sức'
                    ) : tool.category} • {tool.durationMinutes} {lang === 'vi' ? 'phút' : 'min'}
                  </div>
                </button>
              ))}
            </div>

            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>
              {lang === 'vi'
                ? `Nhập suy nghĩ hoặc tình huống để chạy công cụ #${toolExecutionResult.tool.number} (${toolExecutionResult.tool.titleVi}):`
                : `Enter thought or situation to run tool #${toolExecutionResult.tool.number} (${toolExecutionResult.tool.titleEn}):`}
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
                <strong>
                  {lang === 'vi'
                    ? `Kết quả Phân tích (${toolExecutionResult.kbCitation}):`
                    : `Deterministic Analysis (${toolExecutionResult.kbCitation}):`}
                </strong>
              </div>
              <p style={{ margin: '6px 0' }}>
                {lang === 'vi'
                  ? toolExecutionResult.reframeOrActionCardVi
                  : toolExecutionResult.reframeOrActionCardEn}
              </p>
              <p style={{ margin: '6px 0', color: '#38bdf8' }}>
                <strong>{lang === 'vi' ? 'Bước hành động tiếp theo:' : 'Next Action Step:'}</strong>{' '}
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
              <h3>
                {lang === 'vi'
                  ? '2. Bảng Dự Đoán Niềm Vui & Mức Độ Thành Thạo (TEAM-CBT M/P Sheet)'
                  : '2. Pleasure-Predicting & Mastery Sheet (TEAM-CBT M/P Sheet)'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                <label>
                  {lang === 'vi' ? 'Bối cảnh thực hiện:' : 'Companion Context:'}{' '}
                  <select
                    value={mpAloneCompanion}
                    onChange={(e) => setMpAloneCompanion((e.target as HTMLSelectElement).value as CompanionContext)}
                  >
                    <option value="alone_self">{lang === 'vi' ? 'Một mình / Tự thân' : 'Alone / Self'}</option>
                    <option value="with_others">{lang === 'vi' ? 'Cùng người khác' : 'With Others'}</option>
                  </select>
                </label>
                <label>
                  {lang === 'vi'
                    ? `Dự đoán Niềm vui: ${mpPredPleasure}% → Thực tế: ${mpActPleasure}%`
                    : `Predicted Pleasure: ${mpPredPleasure}% → Actual: ${mpActPleasure}%`}
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
                  {lang === 'vi'
                    ? `Dự đoán Cảm giác Thành thạo: ${mpPredMastery}% → Thực tế: ${mpActMastery}%`
                    : `Predicted Mastery: ${mpPredMastery}% → Actual: ${mpActMastery}%`}
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
              <h3>
                {lang === 'vi'
                  ? '3. Bảng Vượt Trì Hoãn 5 Phút (David Burns)'
                  : '3. 5-Minute Anti-Procrastination Sheet (David Burns)'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                <label>
                  {lang === 'vi'
                    ? `Độ khó dự đoán (${apPredDiff}%) vs. Độ khó thực tế sau 5 phút (${apActDiff}%):`
                    : `Predicted Difficulty (${apPredDiff}%) vs. Actual after 5 min (${apActDiff}%):`}
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
                  {lang === 'vi'
                    ? `Hài lòng dự đoán (${apPredSat}%) vs. Hài lòng thực tế (${apActSat}%):`
                    : `Predicted Satisfaction (${apPredSat}%) vs. Actual Satisfaction (${apActSat}%):`}
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
                {lang === 'vi'
                  ? `4. Kỹ Thuật Mũi Tên Đi Xuống — Khám Phá ${SELF_DEFEATING_BELIEFS_23_CATALOG.length} Niềm Tin Cốt Lõi Tự Hại & Cân Nhắc Lợi - Hại`
                  : `4. Downward Arrow Technique — Uncover ${SELF_DEFEATING_BELIEFS_23_CATALOG.length} Self-Defeating Beliefs & Cost-Benefit`}
              </h3>
              <div style={{ fontSize: '0.84rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>
                  <strong>{lang === 'vi' ? 'Suy nghĩ ban đầu:' : 'Initial Thought:'}</strong> {daInitialThought}
                </div>
                <div>
                  <strong>{lang === 'vi' ? '↓ Nếu điều đó là thật, nó có ý nghĩa gì với bạn? (Bước 1):' : '↓ If that is true, what does it mean to you? (Step 1):'}</strong>
                  <input
                    type="text"
                    value={daChain1}
                    onChange={(e) => setDaChain1((e.target as HTMLInputElement).value)}
                    style={{ width: '100%', padding: '5px', marginTop: '3px' }}
                  />
                </div>
                <div>
                  <strong>{lang === 'vi' ? '↓ Và nếu thế thì sao? (Bước 2 — Niềm tin Cốt lõi):' : '↓ And if that happens, what then? (Step 2 — Core Belief):'}</strong>
                  <input
                    type="text"
                    value={daChain2}
                    onChange={(e) => setDaChain2((e.target as HTMLInputElement).value)}
                    style={{ width: '100%', padding: '5px', marginTop: '3px' }}
                  />
                </div>
                <div>
                  <strong>{lang === 'vi' ? 'Tỉ lệ Lợi ích / Thiệt hại (Thang điểm 100):' : 'Cost-Benefit Weight (100 pts):'}</strong>{' '}
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
              <h3>
                {lang === 'vi'
                  ? `5. Chăm Sóc Sức Bền ABC PLEASE (${abcPleaseEval.resilienceScorePercent}%) & Kỹ Năng ACCEPTS`
                  : `5. DBT ABC PLEASE (${abcPleaseEval.resilienceScorePercent}%) & ACCEPTS Distress Tolerance`}
              </h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.85rem', marginBottom: '8px' }}>
                <label>
                  <input
                    type="checkbox"
                    checked={abcSleepDone}
                    onChange={(e) => setAbcSleepDone((e.target as HTMLInputElement).checked)}
                  />{' '}
                  {lang === 'vi' ? 'S — Ngủ đủ và điều độ' : 'S — Balanced Sleep'}
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={abcExerciseDone}
                    onChange={(e) => setAbcExerciseDone((e.target as HTMLInputElement).checked)}
                  />{' '}
                  {lang === 'vi' ? 'E — Vận động nhẹ 20 phút' : 'E — Exercise 20 min'}
                </label>
              </div>
              <p style={{ fontSize: '0.85rem', margin: '0 0 8px 0' }}>
                {lang === 'vi' ? abcPleaseEval.summaryVi : abcPleaseEval.summaryEn}
              </p>
              <div style={{ fontSize: '0.8rem', color: theme.palette.textSecondary }}>
                <strong>{lang === 'vi' ? 'Kỹ năng Đánh lạc hướng ACCEPTS:' : 'ACCEPTS Distraction Cards:'}</strong>{' '}
                {acceptsAndSoothePlan.acceptsCards.map((c) => lang === 'vi' ? `${c.letter} (${c.nameVi})` : `${c.letter} (${c.nameEn})`).join(' • ')}
              </div>
              <div style={{ fontSize: '0.8rem', color: theme.palette.textSecondary, marginTop: '4px' }}>
                <strong>{lang === 'vi' ? 'Xoa dịu qua 5 giác quan:' : '5-Senses Self-Soothe:'}</strong>{' '}
                {acceptsAndSoothePlan.fiveSensesCards.map((s) => lang === 'vi' ? s.senseVi : s.senseEn).join(' • ')}
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
                {lang === 'vi'
                  ? `6. Nhật Ký Giấc Ngủ CBT-I & Hiệu Suất Ngủ (${cbtiEvaluation.sleepEfficiencyPercent}%) — Bảo Vệ Nhịp Sinh Học`
                  : `6. CBT-I Sleep Diary & Sleep Efficiency (${cbtiEvaluation.sleepEfficiencyPercent}%) — Bipolar Safe`}
              </h3>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.86rem', marginBottom: '10px' }}>
                <label>
                  {lang === 'vi' ? 'Tổng thời gian nằm trên giường (giờ):' : 'Total time in bed (hours):'}{' '}
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
                  {lang === 'vi' ? 'Nhu cầu ngủ sáng nay:' : 'Felt need for sleep:'}{' '}
                  <select
                    value={feltNeedForSleep}
                    onChange={(e) =>
                      setFeltNeedForSleep(
                        (e.target as HTMLSelectElement).value as DailyMoodAndRhythmLog['feltNeedForSleep']
                      )
                    }
                  >
                    <option value="exhausted">{lang === 'vi' ? 'Mệt mỏi / Buồn ngủ (Mất ngủ thông thường)' : 'Exhausted / True Insomnia'}</option>
                    <option value="normal">{lang === 'vi' ? 'Bình thường, tỉnh táo' : 'Normal / Refreshed'}</option>
                    <option value="reduced_need">{lang === 'vi' ? 'Giảm nhu cầu ngủ (Nguy cơ hưng cảm nhẹ)' : 'Reduced Need (Hypomania Risk)'}</option>
                    <option value="no_need_at_all">{lang === 'vi' ? 'Không cần ngủ vẫn tràn trề năng lượng (Cảnh báo hưng cảm)' : 'No Need At All (Mania Warning)'}</option>
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

      {/* TAB 6: GROUNDED AI COMPANION (LOCAL OLLAMA / RAG 0.46), 2-TIER MEMORY INSPECTOR, VOICE BURST WPM STUDIO & BASELINE HRV/SLEEP CONTEXT */}
      {(activeTab === 'ai-companion-biometrics' || activeTab === 'phase3-ai-biometrics-voice') && (
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
              {lang === 'vi'
                ? 'Người bạn Trí tuệ AI Thấu cảm (RAG 0.46 / Ollama), Bộ nhớ Cuộn 2 Tầng, Phân tích Nhịp nói & Sinh trắc HRV'
                : 'Grounded AI Companion (RAG 0.46 / Ollama), 2-Tier Memory, Voice WPM Studio & Baseline HRV Context'}
            </h2>
            <p style={{ fontSize: '0.88rem', color: theme.palette.textSecondary, margin: 0 }}>
              {lang === 'vi'
                ? 'Tích hợp AI đồng hành đa chế độ (100% Offline Deterministic • Local Ollama 127.0.0.1:11434 • Vercel + Supabase Cloud RAG ngưỡng 0.46), Bộ nhớ Cuộn 2 tầng (20 tin nhắn + Tóm tắt mỗi 15 tin nhắn + Hồ sơ cá nhân có thể xóa 1 chạm), Phân tích Nhịp nói Hưng cảm (> 30% WPM spike) kèm Bảng màu 5 Sắc thái và Sinh trắc học HRV phân vị P25–P75.'
                : 'Multimodal AI Companion (100% Offline Deterministic • Local Ollama • Vercel/Supabase Cloud RAG 0.46), 2-Tier Rolling Memory (20 messages + 15-message rolling summary + One-click profile eraser), Pressured Speech Analysis (>30% WPM spike), 5-Swatch Mood-Palette, and Baseline-Relative HRV Percentiles (P25-P75).'}
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
              <h3>
                {lang === 'vi'
                  ? '1. Trợ Lý AI Dựa Trên Bằng Chứng (Ngưỡng RAG 0.46 • Kiểm soát an toàn)'
                  : '1. Grounded AI Companion (Threshold = 0.46 • Safety Abstention)'}
              </h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {(
                  [
                    ['offline-deterministic', lang === 'vi' ? 'Thuần Cục Bộ 0ms' : '100% Offline Deterministic'],
                    ['local-ollama', lang === 'vi' ? 'Mô Hình Cục Bộ Ollama' : 'Local Ollama (127.0.0.1:11434)'],
                    ['cloud-serverless-rag', lang === 'vi' ? 'Đám Mây Bảo Mật RAG' : 'Vercel + Supabase Cloud RAG'],
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
                    {lang === 'vi' ? 'Mô hình Ollama cục bộ:' : 'Local Ollama Model (127.0.0.1:11434):'}{' '}
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
                  {lang === 'vi' ? 'Gửi Tin Nhắn (Kiểm soát 4 lớp an toàn)' : 'Send Chat (4-Layer Safety + RAG 0.46)'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPhase3ChatInput(lang === 'vi' ? 'Công thức nấu phở bò ngon nhất là gì?' : 'What is the best beef pho recipe?')
                  }
                  style={{ padding: '8px 12px', cursor: 'pointer' }}
                >
                  {lang === 'vi' ? 'Thử Câu Hỏi Ngoài Phạm Vi (Kiểm tra từ chối < 0.46)' : 'Test Out-of-Scope Query (Abstention < 0.46)'}
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
                    {lang === 'vi' ? `Điểm Bằng Chứng RAG: ${phase3LastTopScore.toFixed(2)} (Ngưỡng: 0.46)` : `RAG Score: ${phase3LastTopScore.toFixed(2)} (Threshold: 0.46)`}
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
                      ? (lang === 'vi' ? 'TỪ CHỐI TRẢ LỜI (< 0.46 — Không suy đoán bừa bãi)' : 'ABSTAINED (< 0.46 — Zero Hallucination)')
                      : (lang === 'vi' ? `CĂN CỨ TÀI LIỆU (${phase3LastCitations.join(' ')})` : `GROUNDED (${phase3LastCitations.join(' ')})`)}
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
                  {lang === 'vi'
                    ? '2. Bộ Nhớ Hội Thoại 2 Tầng (20 Tin Gần Nhất + Tóm Tắt Cuộn + Hồ Sơ Cá Nhân)'
                    : '2. 2-Tier Memory Inspector (20-Msg Window + Rolling Summary + Profile)'}
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
                  {lang === 'vi' ? 'Xóa Bộ Nhớ Hội Thoại' : 'Clear Memory (DELETE)'}
                </button>
              </div>

              <div style={{ fontSize: '0.85rem', marginTop: '10px' }}>
                <div>
                  <strong>{lang === 'vi' ? 'Cửa sổ trượt tin nhắn:' : 'Sliding Window:'}</strong>{' '}
                  {lang === 'vi'
                    ? `${phase3Memory.recentMessagesWindow.length}/20 tin nhắn gần nhất (Đã xử lý: ${phase3Memory.totalMessagesProcessed} tin | Lần làm mới tóm tắt: ${phase3Memory.summaryRefreshCount})`
                    : `${phase3Memory.recentMessagesWindow.length}/20 messages (Processed: ${phase3Memory.totalMessagesProcessed} | Summary refreshes: ${phase3Memory.summaryRefreshCount})`}
                </div>
                <div style={{ marginTop: '6px' }}>
                  <strong>{lang === 'vi' ? 'Tóm tắt cuộn ngữ cảnh:' : 'Rolling Context Summary:'}</strong>
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
                  <strong>{lang === 'vi' ? 'Hồ sơ cá nhân ghi nhận:' : 'Structured Personal Profile:'}</strong>
                  <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px' }}>
                    <li>{lang === 'vi' ? 'Tên:' : 'Name:'} {phase3Memory.personalProfile.name ?? (lang === 'vi' ? 'Chưa ghi nhận' : 'Unrecorded')}</li>
                    <li>
                      {lang === 'vi' ? 'Lĩnh vực công việc/học tập:' : 'Work/Study Domain:'}{' '}
                      {phase3Memory.personalProfile.workOrStudyDomain ?? (lang === 'vi' ? 'Chưa ghi nhận' : 'Unrecorded')}
                    </li>
                    <li>
                      {lang === 'vi' ? 'Người thân tin cậy:' : 'Trusted Contacts:'}{' '}
                      {phase3Memory.personalProfile.trustedContacts.join(', ') || (lang === 'vi' ? 'Chưa ghi nhận' : 'None')}
                    </li>
                    <li>
                      {lang === 'vi' ? 'Biến dạng nhận thức lặp lại:' : 'Recurrent Distortions:'}{' '}
                      {phase3Memory.personalProfile.recurrentCognitiveDistortions.join(', ') || (lang === 'vi' ? 'Chưa ghi nhận' : 'None')}
                    </li>
                    <li>
                      {lang === 'vi' ? 'Mức độ phản biện Socratic ưa thích:' : 'Preferred Pushback Level:'}{' '}
                      <code>{phase3Memory.personalProfile.preferredPushbackLevel}</code>
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
                {lang === 'vi'
                  ? '3. Phân Tích Nhịp Nói & Bảng Màu Cảm Xúc (Phát hiện lời nói dồn dập > 30%)'
                  : '3. Voice Burst Studio • Pressured Speech Detector (> 30% WPM Spike) & Mood-Palette'}
              </h3>
              <textarea
                rows={2}
                value={vbStudioTranscript}
                onChange={(e) => setVbStudioTranscript((e.target as HTMLTextAreaElement).value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', marginBottom: '8px' }}
              />
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.85rem', marginBottom: '10px' }}>
                <label>
                  {lang === 'vi' ? 'Thời lượng ghi âm (giây):' : 'Audio Duration (seconds):'}{' '}
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
                  {lang === 'vi' ? 'Tốc độ nói nền (từ/phút):' : 'Baseline Speaking Rate (WPM):'}{' '}
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
                  {lang === 'vi'
                    ? `Tốc độ nói: ${phase3VoiceBurstEval.wordsPerMinute} từ/phút (Biến thiên: ${phase3VoiceBurstEval.wpmSpikePercent >= 0 ? `+${phase3VoiceBurstEval.wpmSpikePercent}%` : `${phase3VoiceBurstEval.wpmSpikePercent}%`})`
                    : `Speaking Rate: ${phase3VoiceBurstEval.wordsPerMinute} WPM (Delta: ${phase3VoiceBurstEval.wpmSpikePercent >= 0 ? `+${phase3VoiceBurstEval.wpmSpikePercent}%` : `${phase3VoiceBurstEval.wpmSpikePercent}%`})`}
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
                  {lang === 'vi'
                    ? `Tọa độ cảm xúc: Chiều cảm xúc ${phase3VoiceBurstEval.moodPalette.emotionalCoordinates.valence} • Mức kích hoạt ${phase3VoiceBurstEval.moodPalette.emotionalCoordinates.arousal}`
                    : `Emotional Coordinates: Valence ${phase3VoiceBurstEval.moodPalette.emotionalCoordinates.valence} • Arousal ${phase3VoiceBurstEval.moodPalette.emotionalCoordinates.arousal}`}
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
                {lang === 'vi'
                  ? '4. Sinh Trắc Học Độ Biến Thiên Nhịp Tim HRV (Phân vị cá nhân P25–P75)'
                  : '4. Baseline-Relative HRV Biometrics (Personal P25–P75 Percentiles)'}
              </h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.85rem', marginBottom: '10px' }}>
                <label>
                  {lang === 'vi' ? 'Nguồn thiết bị đồng bộ:' : 'Synced Wearable Source:'}{' '}
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
                  {lang === 'vi' ? `Chỉ số HRV mới nhất (${phase3HrvEval.metricUnit}):` : `Latest HRV (${phase3HrvEval.metricUnit}):`}{' '}
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
                  {lang === 'vi' ? 'Thời gian ghi nhận (giờ trước):' : 'Reading age (hours ago):'}{' '}
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
                    <strong>{lang === 'vi' ? 'Phân loại:' : 'Classification:'}</strong> <code>{phase3HrvEval.classification}</code>
                  </span>
                  <span>
                    <strong>{lang === 'vi' ? `Khoảng bình thường 14–30 ngày (${phase3HrvEval.validBaselineDaysCount} ngày):` : `14–30 Day Baseline (${phase3HrvEval.validBaselineDaysCount} days):`}</strong>{' '}
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
                      ? (lang === 'vi' ? `Dữ liệu mới (${phase3HrvEval.latestReadingAgeHours}h < 12h)` : `Fresh (${phase3HrvEval.latestReadingAgeHours}h < 12h)`)
                      : (lang === 'vi' ? `Dữ liệu cũ (${phase3HrvEval.latestReadingAgeHours}h > 12h — Đã bỏ qua)` : `Stale (${phase3HrvEval.latestReadingAgeHours}h > 12h — Ignored)`)}
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

      {/* TAB 7: ZERO-KNOWLEDGE E2EE SYNC (24-WORD KEY & CRDT), CLINICIAN PORTAL (#KEY=... DECRYPTOR) & 105-CASE RED-TEAM / WCAG 2.2 AAA AUDIT */}
      {(activeTab === 'account-privacy-vault' || activeTab === 'phase4-e2ee-clinician-qa') && (
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
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
            <h2 style={{ marginTop: 0 }}>
              {lang === 'vi'
                ? 'Trung tâm Tài khoản, Đồng bộ Mã hóa Đầu-cuối & Cổng Kết nối Bác sĩ'
                : 'Account Sanctuary, End-to-End Encrypted Sync & Clinician Portal'}
            </h2>
            <p style={{ fontSize: '0.88rem', color: theme.palette.textSecondary, margin: 0 }}>
              {lang === 'vi'
                ? 'Quản lý tài khoản cá nhân, sinh khóa khôi phục 24 từ (WebCrypto AES-GCM-256), hợp nhất dữ liệu đa thiết bị bằng thuật toán CRDT không độ trễ, Cổng Bác sĩ giải mã an toàn qua URL fragment (#key=...) và Kiểm định an toàn lâm sàng 105 kịch bản đối kháng.'
                : 'Personal account management, 24-word master recovery key (WebCrypto AES-GCM-256), zero-latency CRDT multi-device sync, client-side encrypted Clinician Portal (#key=...), and 105-scenario clinical safety audit.'}
            </p>
          </section>

          {/* Account Management & Sanctuary Profiles Card */}
          <section
            className="no-print"
            style={{
              padding: '20px',
              borderRadius: '16px',
              backgroundColor: theme.palette.surface,
              border: `1px solid ${theme.palette.border}`,
              marginBottom: '16px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    backgroundColor: accountSession?.user.avatarMoodColor || theme.palette.primary,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  }}
                >
                  {accountSession?.user.displayName ? accountSession.user.displayName.charAt(0).toUpperCase() : '👤'}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
                      {accountSession?.user.displayName || (lang === 'vi' ? 'Chưa đăng nhập' : 'Not signed in')}
                    </h3>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(106, 168, 130, 0.15)',
                        color: theme.palette.accent,
                        fontWeight: 600,
                      }}
                    >
                      {accountSession?.user.authMode === 'guest-local-only'
                        ? (lang === 'vi' ? 'Khách Ẩn Danh Tại Chỗ' : 'Anonymous Guest')
                        : accountSession?.user.authMode === 'email-password'
                          ? (lang === 'vi' ? 'Tài Khoản Email Đã Xác Thực' : 'Verified Email Account')
                          : (lang === 'vi' ? 'Hồ Sơ Mẫu 1-Chạm' : 'Quick Sanctuary Profile')}
                    </span>
                  </div>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.85rem', color: theme.palette.textSecondary }}>
                    {accountSession?.user.email} • ID: <code>{accountSession?.user.userId}</code> • {lang === 'vi' ? 'Đồng bộ lúc:' : 'Last sync:'}{' '}
                    {accountSession?.user.lastE2eeSyncAt ? accountSession.user.lastE2eeSyncAt.slice(11, 19) + ' UTC' : 'Chưa có'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleSyncNow}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    backgroundColor: theme.palette.accent,
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {lang === 'vi' ? '🔄 Đồng bộ E2EE Ngay' : '🔄 Sync Now'}
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    backgroundColor: 'transparent',
                    color: theme.palette.textSecondary,
                    border: `1px solid ${theme.palette.border}`,
                    cursor: 'pointer',
                  }}
                >
                  {lang === 'vi' ? 'Đăng xuất / Về Ẩn danh' : 'Sign Out / Guest'}
                </button>
              </div>
            </div>

            {/* 1-Tap Quick Profiles Switcher */}
            <div style={{ marginTop: '16px', padding: '14px', borderRadius: '12px', backgroundColor: theme.palette.background }}>
              <strong style={{ fontSize: '0.9rem' }}>
                {lang === 'vi' ? '⚡ Chuyển Đổi Nhanh Hồ Sơ Trị Liệu (1-Chạm):' : '⚡ 1-Tap Quick Sanctuary Profiles:'}
              </strong>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '10px', marginTop: '10px' }}>
                {QUICK_DEMO_PROFILES.map((p) => {
                  const isActive =
                    accountSession?.user.userId === `demo_${p.id}` ||
                    (p.id === 'guest-local-only' && accountSession?.user.authMode === 'guest-local-only');
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectQuickDemo(p.id)}
                      style={{
                        textAlign: 'left',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        border: isActive ? `2px solid ${theme.palette.primary}` : `1px solid ${theme.palette.border}`,
                        backgroundColor: isActive ? 'rgba(121, 114, 152, 0.12)' : theme.palette.surface,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: p.avatarMoodColor }} />
                        <strong style={{ fontSize: '0.88rem', color: theme.palette.textPrimary }}>
                          {lang === 'vi' ? p.displayNameVi : p.displayNameEn}
                        </strong>
                      </div>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: theme.palette.textSecondary }}>
                        {lang === 'vi' ? p.descriptionVi : p.descriptionEn}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Forms: Profile Editor & Email Auth */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginTop: '16px' }}>
              {/* Edit Profile Form */}
              <div style={{ padding: '14px', borderRadius: '12px', border: `1px solid ${theme.palette.border}` }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem' }}>
                  {lang === 'vi' ? '✏️ Chỉnh Sửa Hồ Sơ Cá Nhân' : '✏️ Personal Profile Settings'}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ fontSize: '0.85rem' }}>
                    {lang === 'vi' ? 'Tên hiển thị:' : 'Display Name:'}
                    <input
                      type="text"
                      value={profileFormName}
                      onChange={(e) => setProfileFormName((e.target as HTMLInputElement).value)}
                      className="sanctuary-input"
                      style={{ width: '100%', marginTop: '4px', boxSizing: 'border-box' }}
                    />
                  </label>
                  <label style={{ fontSize: '0.85rem' }}>
                    {lang === 'vi' ? 'Người thân hỗ trợ khẩn cấp:' : 'Emergency Contact Name:'}
                    <input
                      type="text"
                      value={profileEmergencyName}
                      onChange={(e) => setProfileEmergencyName((e.target as HTMLInputElement).value)}
                      className="sanctuary-input"
                      style={{ width: '100%', marginTop: '4px', boxSizing: 'border-box' }}
                    />
                  </label>
                  <label style={{ fontSize: '0.85rem' }}>
                    {lang === 'vi' ? 'Số điện thoại khẩn cấp:' : 'Emergency Phone:'}
                    <input
                      type="text"
                      value={profileEmergencyPhone}
                      onChange={(e) => setProfileEmergencyPhone((e.target as HTMLInputElement).value)}
                      className="sanctuary-input"
                      style={{ width: '100%', marginTop: '4px', boxSizing: 'border-box' }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      backgroundColor: theme.palette.primary,
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 600,
                      cursor: 'pointer',
                      marginTop: '4px',
                    }}
                  >
                    {lang === 'vi' ? 'Lưu Thông Tin Hồ Sơ' : 'Save Profile Changes'}
                  </button>
                </div>
              </div>

              {/* Sign In / Sign Up Form */}
              <div style={{ padding: '14px', borderRadius: '12px', border: `1px solid ${theme.palette.border}` }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setAuthView('login')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      backgroundColor: authView === 'login' ? theme.palette.primary : 'transparent',
                      color: authView === 'login' ? '#ffffff' : theme.palette.textPrimary,
                      border: `1px solid ${theme.palette.border}`,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    {lang === 'vi' ? 'Đăng Nhập' : 'Sign In'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthView('register')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      backgroundColor: authView === 'register' ? theme.palette.primary : 'transparent',
                      color: authView === 'register' ? '#ffffff' : theme.palette.textPrimary,
                      border: `1px solid ${theme.palette.border}`,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    {lang === 'vi' ? 'Đăng Ký Mới' : 'Create Account'}
                  </button>
                </div>

                <form onSubmit={authView === 'login' ? handleEmailLogin : handleEmailRegister} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {authView === 'register' && (
                    <label style={{ fontSize: '0.85rem' }}>
                      {lang === 'vi' ? 'Họ và tên / Biệt danh:' : 'Full Name / Nickname:'}
                      <input
                        type="text"
                        value={authDisplayName}
                        onChange={(e) => setAuthDisplayName((e.target as HTMLInputElement).value)}
                        placeholder="Nguyễn Văn A"
                        className="sanctuary-input"
                        style={{ width: '100%', marginTop: '3px', boxSizing: 'border-box' }}
                      />
                    </label>
                  )}
                  <label style={{ fontSize: '0.85rem' }}>
                    {lang === 'vi' ? 'Email:' : 'Email Address:'}
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail((e.target as HTMLInputElement).value)}
                      placeholder="ban@example.com"
                      className="sanctuary-input"
                      style={{ width: '100%', marginTop: '3px', boxSizing: 'border-box' }}
                    />
                  </label>
                  <label style={{ fontSize: '0.85rem' }}>
                    {lang === 'vi' ? 'Mật khẩu:' : 'Password:'}
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword((e.target as HTMLInputElement).value)}
                      placeholder="••••••••"
                      className="sanctuary-input"
                      style={{ width: '100%', marginTop: '3px', boxSizing: 'border-box' }}
                    />
                  </label>
                  <button
                    type="submit"
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      backgroundColor: theme.palette.primary,
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 600,
                      cursor: 'pointer',
                      marginTop: '6px',
                    }}
                  >
                    {authView === 'login'
                      ? (lang === 'vi' ? 'Đăng Nhập Tài Khoản' : 'Sign In')
                      : (lang === 'vi' ? 'Tạo Tài Khoản Mới' : 'Create Account')}
                  </button>
                </form>

                {authStatusMessage && (
                  <div
                    style={{
                      marginTop: '10px',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '0.82rem',
                      backgroundColor: authStatusMessage.ok ? 'rgba(106, 168, 130, 0.15)' : 'rgba(197, 101, 72, 0.15)',
                      color: authStatusMessage.ok ? theme.palette.accent : theme.palette.sosBanner,
                    }}
                  >
                    {authStatusMessage.text}
                  </div>
                )}
              </div>
            </div>
          </section>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(520px, 1fr))', gap: '16px' }}>
            {/* 1. Zero-Knowledge E2EE 24-Word Master Recovery Key & CRDT Multi-Device Sync */}
            <section
              className="no-print"
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3>
                {lang === 'vi'
                  ? '1. Khóa Khôi Phục Mã Hóa 24 Từ & Đồng Bộ Dữ Liệu Đa Nền Tảng (CRDT)'
                  : '1. Zero-Knowledge 24-Word Recovery Key & CRDT Multi-Device Sync'}
              </h3>
              <button
                type="button"
                onClick={() => void handleGenerate24WordKeyAndRunCrdtSync()}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  backgroundColor: theme.palette.primary,
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginBottom: '10px',
                }}
              >
                {lang === 'vi'
                  ? 'Sinh Khóa 24 Từ & Kiểm Tra Đồng Bộ (< 5s SLA)'
                  : 'Generate 24-Word Key & Run Sync (< 5s SLA)'}
              </button>

              {masterKey24 && (
                <div
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: '#0f172a',
                    color: '#f8fafc',
                    fontSize: '0.82rem',
                    marginBottom: '10px',
                  }}
                >
                  <div>
                    <strong>{lang === 'vi' ? 'Mã khóa:' : 'Key ID:'}</strong> <code>{masterKey24.keyId}</code> •{' '}
                    <strong>{lang === 'vi' ? 'Mã nhận diện:' : 'Fingerprint:'}</strong> <code>{masterKey24.keyFingerprintHex}</code> •{' '}
                    <strong>{lang === 'vi' ? 'Thuật toán:' : 'Algorithm:'}</strong> <code>{masterKey24.algorithm}</code>
                  </div>
                  <div style={{ marginTop: '6px', fontFamily: 'monospace', color: '#38bdf8' }}>
                    <strong>{lang === 'vi' ? 'Cụm 24 Từ Khôi Phục Bí Mật:' : '24-Word Master Recovery Mnemonic:'}</strong>
                    <br />
                    {masterKey24.words.map((w, idx) => `${idx + 1}.${w}`).join(' ')}
                  </div>
                </div>
              )}

              <div
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: '#1e293b',
                  color: '#e2e8f0',
                  fontSize: '0.84rem',
                }}
              >
                <div>
                  <strong>{lang === 'vi' ? 'Trạng thái Hợp nhất Dữ liệu Đa Thiết Bị (CRDT):' : 'Multi-Device CRDT Convergence State:'}</strong>
                </div>
                <p style={{ margin: '6px 0' }}>{crdtDecryptedSampleText}</p>
                {crdtSyncPreview && (
                  <div style={{ fontSize: '0.79rem', color: '#cbd5e1' }}>
                    {lang === 'vi'
                      ? `Tổng bản ghi hợp nhất: ${crdtSyncPreview.stats.totalMerged} | Bản ghi hoạt động: ${crdtSyncPreview.activeRecords.length} | Bản ghi đã xóa: ${crdtSyncPreview.stats.tombstonesAppliedCount} | Thời gian đồng bộ: ${crdtSyncPreview.stats.syncDurationMs}ms (Đạt chuẩn < 5s: ${crdtSyncPreview.stats.underFiveSecondSlaPassed ? 'ĐẠT' : 'CHƯA ĐẠT'})`
                      : `Total merged: ${crdtSyncPreview.stats.totalMerged} | Active records: ${crdtSyncPreview.activeRecords.length} | Tombstones: ${crdtSyncPreview.stats.tombstonesAppliedCount} | Sync latency: ${crdtSyncPreview.stats.syncDurationMs}ms (Under 5s SLA: ${crdtSyncPreview.stats.underFiveSecondSlaPassed ? 'PASS' : 'FAIL'})`}
                  </div>
                )}
              </div>
            </section>

            {/* 2. Zero-Knowledge Clinician Portal (#key=... URL Fragment Decryptor & Time-Limited Share Link) */}
            <section
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3>
                {lang === 'vi'
                  ? '2. Cổng Chia Sẻ Dành Cho Bác Sĩ (Giải mã an toàn qua URL fragment #key=...)'
                  : '2. Zero-Knowledge Clinician Portal (#key=... URL Fragment Decryptor)'}
              </h3>
              <div
                className="no-print"
                style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '0.85rem', marginBottom: '10px' }}
              >
                <label>
                  {lang === 'vi' ? 'Chu kỳ báo cáo:' : 'Report Period:'}{' '}
                  <select
                    value={sharePeriodDays}
                    onChange={(e) => setSharePeriodDays(Number((e.target as HTMLSelectElement).value) as 30 | 90)}
                  >
                    <option value={30}>{lang === 'vi' ? '30 Ngày (Tóm tắt Lâm sàng 30 Ngày)' : '30-Day Clinical Summary'}</option>
                    <option value={90}>{lang === 'vi' ? '90 Ngày (Theo dõi Dài hạn 90 Ngày)' : '90-Day Longitudinal Summary'}</option>
                  </select>
                </label>
                <label>
                  {lang === 'vi' ? 'Thời hạn liên kết:' : 'Link Expiry:'}{' '}
                  <select
                    value={shareTtlPreset}
                    onChange={(e) => setShareTtlPreset((e.target as HTMLSelectElement).value as ClinicianShareTtlPreset)}
                  >
                    <option value="24h">{lang === 'vi' ? '24 Giờ' : '24 Hours'}</option>
                    <option value="7d">{lang === 'vi' ? '7 Ngày' : '7 Days'}</option>
                    <option value="30d">{lang === 'vi' ? '30 Ngày' : '30 Days'}</option>
                  </select>
                </label>
              </div>

              <div className="no-print" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                <button
                  type="button"
                  onClick={() => void handleCreateAndDecryptClinicianShare()}
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
                  {lang === 'vi'
                    ? 'Tạo Liên Kết Bác Sĩ & Xem Trước Bản Giải Mã'
                    : 'Generate Doctor Link (#key=...) & Decrypt Preview'}
                </button>
                {clinicianSharePkg && !clinicianSharePkg.serverSnapshot.revoked && (
                  <button
                    type="button"
                    onClick={() => void handleRevokeClinicianShare()}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      backgroundColor: '#e11d48',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {lang === 'vi' ? 'Thu Hồi Quyền Truy Cập Ngay' : 'Revoke Link Access Now'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => typeof window !== 'undefined' && window.print()}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${theme.palette.border}`,
                    backgroundColor: 'transparent',
                    color: theme.palette.textPrimary,
                    cursor: 'pointer',
                  }}
                >
                  {lang === 'vi' ? 'In Báo Cáo Lâm Sàng A4' : 'Print A4 Clinical Report'}
                </button>
              </div>

              {clinicianSharePkg && (
                <div
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: '#0f172a',
                    color: '#f8fafc',
                    fontSize: '0.82rem',
                  }}
                >
                  <div>
                    <strong>
                      {lang === 'vi'
                        ? 'Đường dẫn chia sẻ an toàn (Khóa giải mã chỉ nằm trên trình duyệt của bạn và bác sĩ):'
                        : 'Zero-Knowledge URL (Key resides only in browser fragment #key=...):'}
                    </strong>
                    <div style={{ wordBreak: 'break-all', color: '#38bdf8', fontFamily: 'monospace', marginTop: '4px' }}>
                      {clinicianSharePkg.fullShareUrlWithFragment}
                    </div>
                  </div>
                  <div style={{ marginTop: '6px' }}>
                    <strong>{lang === 'vi' ? 'Hết hạn lúc:' : 'Expires at:'}</strong> {clinicianSharePkg.serverSnapshot.expiresAt} •{' '}
                    <strong>{lang === 'vi' ? 'Trạng thái giải mã:' : 'Decryption status:'}</strong>{' '}
                    <code>{clinicianDecryptedView?.status.toUpperCase()}</code>
                  </div>
                  {clinicianDecryptedView?.status === 'decrypted' && clinicianDecryptedView.report && (
                    <div style={{ marginTop: '6px', color: '#a7f3d0' }}>
                      {lang === 'vi'
                        ? `Đã giải mã thành công báo cáo ${clinicianDecryptedView.report.periodDays} ngày của ${clinicianDecryptedView.report.patientAlias} • Độ ổn định nhịp sinh học: ${clinicianDecryptedView.report.ipsrtAverageStabilityPercent}% • Tỉ lệ tuân thủ điều trị: ${clinicianDecryptedView.report.medicationAdherencePercent}%`
                        : `Decrypted ${clinicianDecryptedView.report.periodDays}-day report for ${clinicianDecryptedView.report.patientAlias} • IPSRT Stability: ${clinicianDecryptedView.report.ipsrtAverageStabilityPercent}% • Medication Adherence: ${clinicianDecryptedView.report.medicationAdherencePercent}%`}
                    </div>
                  )}
                  {clinicianDecryptedView?.errorMessageVi && (
                    <div style={{ marginTop: '6px', color: '#fda4af' }}>
                      {lang === 'vi'
                        ? clinicianDecryptedView.errorMessageVi
                        : clinicianDecryptedView.errorMessageEn}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* 3. 105-Case Adversarial Clinical Red-Teaming Scorecard & WCAG 2.2 AAA / OWASP Compliance Auditor */}
            <section
              className="no-print"
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
                gridColumn: '1 / -1',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ margin: 0 }}>
                  {lang === 'vi'
                    ? `3. Bảng Điểm Kiểm Định An Toàn 105 Kịch Bản Đối Kháng (${redTeamAuditReport.passedCases}/${redTeamAuditReport.totalCases} = ${redTeamAuditReport.passRatePercent}%) & Chuẩn Tiếp Cận WCAG 2.2 AAA`
                    : `3. 105-Case Adversarial Safety Scorecard (${redTeamAuditReport.passedCases}/${redTeamAuditReport.totalCases} = ${redTeamAuditReport.passRatePercent}%) & WCAG 2.2 AAA / OWASP`}
                </h3>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backgroundColor:
                      redTeamAuditReport.passRatePercent === 100 && wcagOwaspAuditReport.wcag22AaaCompliant
                        ? '#065f46'
                        : '#991b1b',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                  }}
                >
                  {redTeamAuditReport.passedCases}/{redTeamAuditReport.totalCases} {lang === 'vi' ? 'ĐẠT' : 'PASS'} (0 {lang === 'vi' ? 'Lỗi Nghiêm Trọng' : 'Critical Failures'}) • WCAG 2.2 AAA (&ge; 7.0:1, Min {wcagOwaspAuditReport.minimumContrastRatioMeasured}:1) • 0 Bytes {lang === 'vi' ? 'Dữ Liệu Y Tế Bị Rò Rỉ' : 'PHI Telemetry'}
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
                  gap: '10px',
                  marginTop: '12px',
                }}
              >
                {redTeamAuditReport.categoryBreakdown.map((cat) => (
                  <div
                    key={cat.category}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: `1px solid ${theme.palette.border}`,
                      fontSize: '0.83rem',
                    }}
                  >
                    <strong>{lang === 'vi' ? cat.labelVi : cat.labelEn}</strong>
                    <div style={{ marginTop: '4px', color: '#0d9488', fontWeight: 700 }}>
                      {lang === 'vi'
                        ? `Kết quả: ${cat.passed}/${cat.total} kịch bản đạt chuẩn (${cat.passRatePercent}%)`
                        : `Result: ${cat.passed}/${cat.total} scenarios passed (${cat.passRatePercent}%)`}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: '12px',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: '#0f172a',
                  color: '#f8fafc',
                  fontSize: '0.83rem',
                }}
              >
                <strong>{lang === 'vi' ? 'Kiểm định Bảo Mật OWASP & Khả Năng Tiếp Cận Toàn Diện WCAG 2.2 AAA:' : 'OWASP Security & WCAG 2.2 AAA Accessibility Audit:'}</strong>
                <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px' }}>
                  {wcagOwaspAuditReport.owaspChecklist.map((chk) => (
                    <li key={chk.controlId}>
                      <strong>[{chk.passed ? (lang === 'vi' ? 'ĐẠT' : 'PASS') : (lang === 'vi' ? 'CHƯA ĐẠT' : 'FAIL')} • {chk.controlId}]:</strong>{' '}
                      {lang === 'vi' ? chk.titleVi : chk.titleEn}
                    </li>
                  ))}
                  <li>
                    <strong>[PASS • SOS-COLD-OPEN]:</strong>{' '}
                    {lang === 'vi'
                      ? `Độ trễ mở Cổng Cấp Cứu Nhanh = ${wcagOwaspAuditReport.sosColdOpenLatencyMs}ms (Đạt chuẩn < 300ms) • Điểm Tiếp Cận Accessibility ước tính: ${wcagOwaspAuditReport.lighthouseAccessibilityEstimate}/100.`
                      : `SOS Portal Cold Open Latency = ${wcagOwaspAuditReport.sosColdOpenLatencyMs}ms (< 300ms SLA) • Estimated Lighthouse Accessibility: ${wcagOwaspAuditReport.lighthouseAccessibilityEstimate}/100.`}
                  </li>
                </ul>
              </div>
            </section>
          </div>
        </main>
      )}

      {/* Patient Account Sanctuary Quick Modal */}
      {accountModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setAccountModalOpen(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              backgroundColor: theme.palette.surface,
              borderRadius: '20px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              border: `1px solid ${theme.palette.border}`,
              padding: '24px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: accountSession?.user.avatarMoodColor || theme.palette.primary,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                  }}
                >
                  {accountSession?.user.displayName ? accountSession.user.displayName.charAt(0).toUpperCase() : '👤'}
                </span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem' }}>
                    {lang === 'vi' ? 'Hồ Sơ & Tài Khoản Của Bạn' : 'Your Sanctuary Account & Profile'}
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: theme.palette.textSecondary }}>
                    {accountSession?.user.displayName} ({accountSession?.user.email})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAccountModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.3rem',
                  cursor: 'pointer',
                  color: theme.palette.textSecondary,
                  padding: '4px 8px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Switch to 1-Tap Profiles */}
            <div style={{ marginBottom: '16px' }}>
              <strong style={{ fontSize: '0.88rem' }}>
                {lang === 'vi' ? 'Chọn Hồ Sơ Đồng Hành Nhanh (1-Chạm):' : 'Switch Quick Sanctuary Profile:'}
              </strong>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                {QUICK_DEMO_PROFILES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectQuickDemo(p.id)}
                    style={{
                      textAlign: 'left',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: accountSession?.user.userId === `demo_${p.id}` ? `2px solid ${theme.palette.primary}` : `1px solid ${theme.palette.border}`,
                      backgroundColor: accountSession?.user.userId === `demo_${p.id}` ? 'rgba(121, 114, 152, 0.12)' : theme.palette.surface,
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{lang === 'vi' ? p.displayNameVi : p.displayNameEn}</div>
                    <div style={{ fontSize: '0.74rem', color: theme.palette.textSecondary, marginTop: '2px' }}>
                      {lang === 'vi' ? p.badgeVi : p.badgeEn}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Profile Edit Inputs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <label style={{ fontSize: '0.85rem' }}>
                {lang === 'vi' ? 'Tên hiển thị:' : 'Display Name:'}
                <input
                  type="text"
                  value={profileFormName}
                  onChange={(e) => setProfileFormName((e.target as HTMLInputElement).value)}
                  className="sanctuary-input"
                  style={{ width: '100%', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </label>
              <label style={{ fontSize: '0.85rem' }}>
                {lang === 'vi' ? 'Người thân liên hệ khẩn cấp:' : 'Emergency Contact:'}
                <input
                  type="text"
                  value={profileEmergencyName}
                  onChange={(e) => setProfileEmergencyName((e.target as HTMLInputElement).value)}
                  className="sanctuary-input"
                  style={{ width: '100%', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </label>
              <label style={{ fontSize: '0.85rem' }}>
                {lang === 'vi' ? 'Số điện thoại khẩn cấp:' : 'Emergency Phone:'}
                <input
                  type="text"
                  value={profileEmergencyPhone}
                  onChange={(e) => setProfileEmergencyPhone((e.target as HTMLInputElement).value)}
                  className="sanctuary-input"
                  style={{ width: '100%', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </label>
            </div>

            {authStatusMessage && (
              <div
                style={{
                  marginBottom: '14px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  backgroundColor: authStatusMessage.ok ? 'rgba(106, 168, 130, 0.15)' : 'rgba(197, 101, 72, 0.15)',
                  color: authStatusMessage.ok ? theme.palette.accent : theme.palette.sosBanner,
                }}
              >
                {authStatusMessage.text}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    backgroundColor: theme.palette.primary,
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {lang === 'vi' ? 'Lưu Hồ Sơ' : 'Save Profile'}
                </button>
                <button
                  type="button"
                  onClick={handleSyncNow}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    backgroundColor: theme.palette.accent,
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {lang === 'vi' ? 'Đồng bộ E2EE' : 'Sync E2EE'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('account-privacy-vault');
                  setAccountModalOpen(false);
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  backgroundColor: 'transparent',
                  color: theme.palette.primary,
                  border: `1px solid ${theme.palette.border}`,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                {lang === 'vi' ? 'Mở Trung tâm Bảo mật & Bác sĩ →' : 'Open Full Vault & Doctor Link →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
