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

/**
 * Calming Pastel Vector Illustrations (Inspired by irolinski/Well_CBT & KazKozDev/cbt-assistant)
 */
function SanctuaryHeroBanner(props: {
  scene: 'sunrise-hills' | 'calm-waves' | 'moon-stars' | 'botanical-garden' | 'care-notebook';
  title: string;
  subtitle: string;
  isDark: boolean;
}) {
  const bgGradient = props.isDark
    ? 'linear-gradient(135deg, #231D19 0%, #1B1613 100%)'
    : props.scene === 'sunrise-hills'
      ? 'linear-gradient(135deg, #F4EFFA 0%, #EAF4EE 55%, #FDF6EC 100%)'
      : props.scene === 'calm-waves'
        ? 'linear-gradient(135deg, #EBF3F5 0%, #F2EFF9 60%, #FAF8F5 100%)'
        : props.scene === 'moon-stars'
          ? 'linear-gradient(135deg, #EFEBF7 0%, #F9F3E8 100%)'
          : props.scene === 'botanical-garden'
            ? 'linear-gradient(135deg, #EAF4EE 0%, #F6F3EB 100%)'
            : 'linear-gradient(135deg, #F3F0F8 0%, #EEF5F0 100%)';

  return (
    <div
      className="no-print"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        padding: '20px 26px',
        borderRadius: '22px',
        background: bgGradient,
        border: props.isDark ? '1px solid #38302A' : '1px solid #E5E2D9',
        marginBottom: '18px',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: '1 1 320px' }}>
        <h2 style={{ margin: '0 0 6px 0', fontSize: '1.35rem', color: props.isDark ? '#FAF3E0' : '#2F2F2B' }}>
          {props.title}
        </h2>
        <p style={{ margin: 0, fontSize: '0.92rem', color: props.isDark ? '#C8C2B8' : '#5E5E56', lineHeight: 1.55 }}>
          {props.subtitle}
        </p>
      </div>

      {/* Gentle Vector Artwork */}
      <div style={{ flexShrink: 0 }}>
        {props.scene === 'sunrise-hills' && (
          <svg width="160" height="84" viewBox="0 0 160 84" fill="none" aria-hidden="true">
            <rect width="160" height="84" rx="16" fill={props.isDark ? '#2B231D' : '#FFFFFF'} fillOpacity="0.6" />
            <circle cx="118" cy="28" r="16" fill="#F6D59E" />
            <circle cx="118" cy="28" r="22" fill="#F6D59E" fillOpacity="0.3" />
            <path d="M0 64 Q40 38 85 58 T160 52 L160 84 L0 84 Z" fill="#C5BEDC" fillOpacity="0.7" />
            <path d="M0 72 Q55 50 110 66 T160 62 L160 84 L0 84 Z" fill="#9BC4AE" fillOpacity="0.85" />
            <path d="M32 24 Q36 20 40 24 Q44 20 48 24" stroke="#797298" strokeWidth="1.6" strokeLinecap="round" fill="none" />
            <path d="M52 18 Q55 15 58 18 Q61 15 64 18" stroke="#797298" strokeWidth="1.4" strokeLinecap="round" fill="none" />
          </svg>
        )}
        {props.scene === 'calm-waves' && (
          <svg width="160" height="84" viewBox="0 0 160 84" fill="none" aria-hidden="true">
            <rect width="160" height="84" rx="16" fill={props.isDark ? '#2B231D' : '#FFFFFF'} fillOpacity="0.6" />
            <circle cx="44" cy="26" r="12" fill="#E2DCF2" />
            <path d="M75 26 C75 20 83 18 88 22 C92 16 104 17 106 24 C112 24 114 31 108 33 L76 33 C71 32 71 27 75 26 Z" fill="#FFFFFF" fillOpacity="0.9" />
            <path d="M0 54 Q28 44 56 54 T112 54 T160 54 L160 84 L0 84 Z" fill="#B5D3D8" fillOpacity="0.65" />
            <path d="M0 66 Q32 57 64 66 T128 66 T160 66 L160 84 L0 84 Z" fill="#8FB9AA" fillOpacity="0.8" />
          </svg>
        )}
        {props.scene === 'moon-stars' && (
          <svg width="160" height="84" viewBox="0 0 160 84" fill="none" aria-hidden="true">
            <rect width="160" height="84" rx="16" fill={props.isDark ? '#2B231D' : '#FFFFFF'} fillOpacity="0.6" />
            <path d="M88 18 A16 16 0 1 0 106 42 A13 13 0 1 1 88 18 Z" fill="#EAB308" fillOpacity="0.8" />
            <circle cx="42" cy="24" r="2" fill="#797298" />
            <circle cx="64" cy="16" r="1.5" fill="#797298" />
            <circle cx="128" cy="22" r="2" fill="#6AA882" />
            <path d="M0 65 Q48 48 96 63 T160 58 L160 84 L0 84 Z" fill="#B8B0D0" fillOpacity="0.6" />
          </svg>
        )}
        {props.scene === 'botanical-garden' && (
          <svg width="160" height="84" viewBox="0 0 160 84" fill="none" aria-hidden="true">
            <rect width="160" height="84" rx="16" fill={props.isDark ? '#2B231D' : '#FFFFFF'} fillOpacity="0.6" />
            <circle cx="80" cy="44" r="28" fill="#D5E8DC" fillOpacity="0.7" />
            <path d="M80 68 L80 28" stroke="#528767" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M80 52 C66 48 64 36 78 38" fill="#6AA882" />
            <path d="M80 44 C94 40 96 28 82 30" fill="#797298" fillOpacity="0.85" />
            <circle cx="80" cy="24" r="4" fill="#F2C078" />
          </svg>
        )}
        {props.scene === 'care-notebook' && (
          <svg width="160" height="84" viewBox="0 0 160 84" fill="none" aria-hidden="true">
            <rect width="160" height="84" rx="16" fill={props.isDark ? '#2B231D' : '#FFFFFF'} fillOpacity="0.6" />
            <rect x="52" y="14" width="56" height="56" rx="10" fill="#FFFFFF" stroke="#797298" strokeWidth="2" />
            <line x1="64" y1="28" x2="96" y2="28" stroke="#B8B0D0" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="64" y1="38" x2="90" y2="38" stroke="#B8B0D0" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="80" cy="53" r="7" fill="#9BC4AE" />
            <path d="M77 53 L79.5 55.5 L84 50.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        )}
      </div>
    </div>
  );
}

export function EquilibriaClinicalApp() {
  // Global Bilingual & Clinical State
  const [lang, setLang] = useState<Language>('vi');
  const [activeTab, setActiveTab] = useState<ActiveHubTab>('session-player');
  const [sosOpen, setSosOpen] = useState<boolean>(false);
  const [activeProtocolStep, setActiveProtocolStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 'all'>(1);
  const [activeToolkitSubTab, setActiveToolkitSubTab] = useState<
    'catalog-36' | 'mp-sheet' | 'anti-procrastination' | 'downward-arrow' | 'abc-please' | 'cbti-sleep' | 'all'
  >('catalog-36');
  const [tab1SubView, setTab1SubView] = useState<'companion' | 'practice-7' | 'emotions'>('companion');
  const [tab2SubView, setTab2SubView] = useState<'worry-box' | 'wave-90s' | 'exposure' | 'prediction'>('worry-box');
  const [tab3SubView, setTab3SubView] = useState<'mood-chart' | 'ipsrt-rhythm' | 'safety-plan'>('mood-chart');
  const [tab4SubView, setTab4SubView] = useState<'scales-6' | 'doctor-report'>('scales-6');
  const [tab6SubView, setTab6SubView] = useState<'ai-chat' | 'voice-palette' | 'hrv-memory'>('ai-chat');
  const [tab7SubView, setTab7SubView] = useState<'profile' | 'doctor-link' | 'recovery-key'>('profile');

  // Patient Account Authentication & Profile State (null = show Welcome Sign-In Gate on startup)
  const [accountSession, setAccountSession] = useState<UserAccountSession | null>(null);
  const [accountModalOpen, setAccountModalOpen] = useState<boolean>(false);
  const [authView, setAuthView] = useState<'profile' | 'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authDisplayName, setAuthDisplayName] = useState<string>('');
  const [authDisorderFocus, setAuthDisorderFocus] = useState<'anxiety' | 'depression' | 'bipolar'>('anxiety');
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

  // Restore saved session if user previously signed in; otherwise start on the Welcome Sign-In Gate
  useEffect(() => {
    const sess = getActiveAccountSession();
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
      disorderFocus: authDisorderFocus,
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
    setAccountSession(null);
    setAccountModalOpen(false);
    setAuthView('login');
    setAuthStatusMessage({
      ok: true,
      text: lang === 'vi'
        ? 'Bạn đã đăng xuất an toàn. Vui lòng đăng nhập hoặc chọn hồ sơ đồng hành để tiếp tục.'
        : 'You have signed out safely. Please sign in or select a companion profile to continue.',
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

  // Soft Sanctuary surface tokens replacing harsh dark terminal boxes (#0f172a / #1e293b)
  const resultSurfaceBg = theme.mode === 'low-stimulus-mania' ? '#251F1B' : '#F3F1F8';
  const resultSurfaceText = theme.mode === 'low-stimulus-mania' ? '#FAF3E0' : '#2F2F2B';
  const resultSurfaceBorder = theme.mode === 'low-stimulus-mania' ? '#42372F' : '#DCD7E8';
  const resultAccentColor = theme.mode === 'low-stimulus-mania' ? '#F59E0B' : '#585076';
  const calmAlertBg = theme.mode === 'low-stimulus-mania' ? '#1E2923' : '#EAF4EE';
  const calmAlertText = theme.mode === 'low-stimulus-mania' ? '#A7F3D0' : '#1E4631';
  const warnAlertBg = theme.mode === 'low-stimulus-mania' ? '#3B1D16' : '#FDF1EE';
  const warnAlertText = theme.mode === 'low-stimulus-mania' ? '#FECDD3' : '#8C2D19';

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
        position: 'relative',
        minHeight: '100vh',
        color: theme.palette.textPrimary,
        paddingBottom: '56px',
        overflowX: 'hidden',
      }}
    >
      {/* Subtle Biophilic Botanical & Zen Wave Ambient Backdrop Artwork */}
      <div
        className="no-print"
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        {/* Top-Left Soft Botanical Leaf & Zen Breathing Rings */}
        <svg
          width="420"
          height="420"
          viewBox="0 0 420 420"
          fill="none"
          style={{
            position: 'absolute',
            top: '52px',
            left: '-70px',
            opacity: theme.mode === 'low-stimulus-mania' ? 0.07 : 0.28,
          }}
        >
          <circle cx="190" cy="190" r="145" stroke="#797298" strokeWidth="1.2" strokeDasharray="6 8" />
          <circle cx="190" cy="190" r="105" stroke="#6AA882" strokeWidth="1" />
          <path
            d="M70 310 C115 230 175 165 265 110"
            stroke="#6AA882"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path d="M135 235 C105 215 110 178 148 190 C154 214 146 228 135 235 Z" fill="#9BC4AE" fillOpacity="0.45" />
          <path d="M180 185 C212 195 224 162 192 152 C178 164 176 176 180 185 Z" fill="#C5BEDC" fillOpacity="0.5" />
          <path d="M215 148 C192 130 198 98 230 112 C234 130 225 142 215 148 Z" fill="#9BC4AE" fillOpacity="0.45" />
        </svg>

        {/* Bottom-Right Serene Rolling Hills & Floating Sun/Moon Glow */}
        <svg
          width="540"
          height="320"
          viewBox="0 0 540 320"
          fill="none"
          style={{
            position: 'absolute',
            bottom: 0,
            right: '-40px',
            opacity: theme.mode === 'low-stimulus-mania' ? 0.08 : 0.32,
          }}
        >
          <circle cx="410" cy="110" r="54" fill="#F6D59E" fillOpacity="0.45" />
          <path
            d="M40 320 Q170 210 320 265 T540 220 L540 320 Z"
            fill="#C5BEDC"
            fillOpacity="0.42"
          />
          <path
            d="M120 320 Q280 235 430 278 T540 255 L540 320 Z"
            fill="#9BC4AE"
            fillOpacity="0.45"
          />
        </svg>
      </div>

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
          {accountSession && (
            <>
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
                    backgroundColor: accountSession.user.avatarMoodColor || theme.palette.primary,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                  }}
                >
                  {accountSession.user.displayName ? accountSession.user.displayName.charAt(0).toUpperCase() : '👤'}
                </span>
                <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: theme.palette.textPrimary }}>
                    {accountSession.user.displayName}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: theme.palette.accent }}>
                    {accountSession.user.e2eeSyncEnabled
                      ? (lang === 'vi' ? '🟢 Đã bật mã hóa E2EE' : '🟢 E2EE Sync Active')
                      : (lang === 'vi' ? '🔒 Lưu riêng trên máy' : '🔒 Local Device Only')}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.palette.border}`,
                  backgroundColor: 'transparent',
                  color: theme.palette.textSecondary,
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {lang === 'vi' ? 'Đăng xuất' : 'Sign Out'}
              </button>

              {/* Gentle 1-Tap Mood State Switcher (Replaces raw developer number input on Header) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px',
                  borderRadius: '12px',
                  backgroundColor: theme.palette.background,
                  border: `1px solid ${theme.palette.border}`,
                }}
              >
                {(
                  [
                    [-3 as MoodPole, '🌱', lang === 'vi' ? 'Trầm mệt' : 'Low Energy'],
                    [0 as MoodPole, '🌿', lang === 'vi' ? 'Cân bằng' : 'Balanced'],
                    [3 as MoodPole, '🌙', lang === 'vi' ? 'Hạ nhiệt' : 'Wind-Down'],
                  ] as const
                ).map(([poleVal, icon, label]) => {
                  const isCurrentMode =
                    (poleVal <= -3 && moodPolarity <= -3) ||
                    (poleVal === 0 && moodPolarity > -3 && moodPolarity < 2) ||
                    (poleVal >= 2 && moodPolarity >= 2);
                  return (
                    <button
                      key={poleVal}
                      type="button"
                      onClick={() => setMoodPolarity(poleVal)}
                      title={
                        lang === 'vi'
                          ? 'Chuyển chế độ giao diện theo trạng thái năng lượng của bạn'
                          : 'Switch sanctuary interface mode to match your energy level'
                      }
                      style={{
                        padding: '4px 10px',
                        borderRadius: '9px',
                        border: 'none',
                        backgroundColor: isCurrentMode ? theme.palette.primary : 'transparent',
                        color: isCurrentMode ? '#ffffff' : theme.palette.textSecondary,
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {icon} {label}
                    </button>
                  );
                })}
              </div>
            </>
          )}

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

      {/* 1-TAP DBT SOS PORTAL FULLSCREEN / OVERLAY (Always accessible even before signing in) */}
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

      {/* WELCOME & SIGN-IN GATE ON APP STARTUP WHEN NOT AUTHENTICATED */}
      {!accountSession ? (
        <main style={{ maxWidth: '1060px', margin: '32px auto', padding: '0 20px' }}>
          <section
            style={{
              padding: '32px',
              borderRadius: '24px',
              backgroundColor: theme.palette.surface,
              border: `1px solid ${theme.palette.border}`,
              boxShadow: '0 12px 32px rgba(47, 47, 43, 0.06)',
            }}
          >
            <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
                <svg width="240" height="100" viewBox="0 0 240 100" fill="none" aria-hidden="true">
                  <rect width="240" height="100" rx="22" fill="#F4EFFA" />
                  <circle cx="176" cy="34" r="18" fill="#F6D59E" />
                  <circle cx="176" cy="34" r="26" fill="#F6D59E" fillOpacity="0.32" />
                  <path d="M0 74 Q60 44 128 68 T240 58 L240 100 L0 100 Z" fill="#C5BEDC" fillOpacity="0.72" />
                  <path d="M0 84 Q82 58 164 76 T240 72 L240 100 L0 100 Z" fill="#9BC4AE" fillOpacity="0.88" />
                  <path d="M54 30 Q59 25 64 30 Q69 25 74 30" stroke="#797298" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                  <path d="M82 22 Q86 18 90 22 Q94 18 98 22" stroke="#797298" strokeWidth="1.6" strokeLinecap="round" fill="none" />
                </svg>
              </div>
              <h1 style={{ margin: '0 0 10px 0', fontSize: '1.75rem', color: theme.palette.textPrimary }}>
                {lang === 'vi'
                  ? 'Chào mừng bạn đến với Không gian Bình yên Equilibria Care'
                  : 'Welcome to Your Equilibria Care Serene Sanctuary'}
              </h1>
              <p style={{ margin: 0, fontSize: '1rem', color: theme.palette.textSecondary, lineHeight: 1.6 }}>
                {lang === 'vi'
                  ? 'Không gian trị liệu nhận thức hành vi (CBT & DBT) ấm áp, an toàn và không phán xét dành cho người trầm cảm, rối loạn lo âu và cân bằng nhịp sinh học. Vui lòng đăng nhập tài khoản cá nhân hoặc chọn chế độ vào nhanh bên dưới để bắt đầu.'
                  : 'A warm, judgment-free CBT & DBT therapeutic space designed for depression recovery, anxiety relief, and circadian rhythm balance. Please sign in to your account or choose a 1-tap sanctuary profile below to begin.'}
              </p>
            </div>

            {authStatusMessage && (
              <div
                style={{
                  maxWidth: '680px',
                  margin: '0 auto 22px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  textAlign: 'center',
                  backgroundColor: authStatusMessage.ok ? 'rgba(106, 168, 130, 0.16)' : 'rgba(197, 101, 72, 0.16)',
                  color: authStatusMessage.ok ? theme.palette.accent : theme.palette.sosBanner,
                  border: `1px solid ${authStatusMessage.ok ? theme.palette.accent : theme.palette.sosBanner}`,
                }}
              >
                {authStatusMessage.text}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
              {/* Left Column: Email & Password Sign In / Sign Up */}
              <div
                style={{
                  padding: '24px',
                  borderRadius: '18px',
                  backgroundColor: theme.palette.background,
                  border: `1px solid ${theme.palette.border}`,
                }}
              >
                <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
                  <button
                    type="button"
                    onClick={() => setAuthView('login')}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: authView !== 'register' ? theme.palette.primary : 'transparent',
                      color: authView !== 'register' ? '#ffffff' : theme.palette.textPrimary,
                      border: `1px solid ${theme.palette.border}`,
                      fontWeight: 600,
                      fontSize: '0.92rem',
                      cursor: 'pointer',
                    }}
                  >
                    {lang === 'vi' ? '🔐 Đăng Nhập Tài Khoản' : '🔐 Sign In'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthView('register')}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: authView === 'register' ? theme.palette.primary : 'transparent',
                      color: authView === 'register' ? '#ffffff' : theme.palette.textPrimary,
                      border: `1px solid ${theme.palette.border}`,
                      fontWeight: 600,
                      fontSize: '0.92rem',
                      cursor: 'pointer',
                    }}
                  >
                    {lang === 'vi' ? '✨ Tạo Tài Khoản Mới' : '✨ Create Account'}
                  </button>
                </div>

                <form
                  onSubmit={authView === 'register' ? handleEmailRegister : handleEmailLogin}
                  style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
                >
                  {authView === 'register' && (
                    <>
                      <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                        {lang === 'vi' ? 'Tên gọi hoặc biệt danh của bạn:' : 'Your Name or Preferred Nickname:'}
                        <input
                          type="text"
                          value={authDisplayName}
                          onChange={(e) => setAuthDisplayName((e.target as HTMLInputElement).value)}
                          placeholder={lang === 'vi' ? 'Ví dụ: Minh Anh' : 'e.g., Minh Anh'}
                          className="sanctuary-input"
                          style={{ width: '100%', marginTop: '6px', boxSizing: 'border-box' }}
                        />
                      </label>
                      <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                        {lang === 'vi' ? 'Mục tiêu đồng hành ưu tiên:' : 'Primary Therapeutic Focus:'}
                        <select
                          value={authDisorderFocus}
                          onChange={(e) =>
                            setAuthDisorderFocus(
                              (e.target as HTMLSelectElement).value as 'anxiety' | 'depression' | 'bipolar'
                            )
                          }
                          className="sanctuary-input"
                          style={{ width: '100%', marginTop: '6px', boxSizing: 'border-box' }}
                        >
                          <option value="anxiety">
                            {lang === 'vi'
                              ? '🌊 Làm dịu Rối loạn Lo âu & Căng thẳng'
                              : '🌊 Anxiety & Stress Relief'}
                          </option>
                          <option value="depression">
                            {lang === 'vi'
                              ? '🌱 Vượt qua Trầm cảm (Bước nhỏ dịu dàng)'
                              : '🌱 Gentle Depression Recovery (Small Steps)'}
                          </option>
                          <option value="bipolar">
                            {lang === 'vi'
                              ? '🌙 Cân bằng Khí sắc & Nhịp sinh học IPSRT'
                              : '🌙 Mood & Circadian Rhythm Balance (IPSRT)'}
                          </option>
                        </select>
                      </label>
                    </>
                  )}

                  <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                    {lang === 'vi' ? 'Địa chỉ Email:' : 'Email Address:'}
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail((e.target as HTMLInputElement).value)}
                      placeholder="ban@example.com"
                      className="sanctuary-input"
                      style={{ width: '100%', marginTop: '6px', boxSizing: 'border-box' }}
                    />
                  </label>

                  <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                    {lang === 'vi' ? 'Mật khẩu bảo vệ (tối thiểu 6 ký tự):' : 'Password (at least 6 characters):'}
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword((e.target as HTMLInputElement).value)}
                      placeholder="••••••••"
                      className="sanctuary-input"
                      style={{ width: '100%', marginTop: '6px', boxSizing: 'border-box' }}
                    />
                  </label>

                  <button
                    type="submit"
                    style={{
                      padding: '12px 18px',
                      borderRadius: '12px',
                      backgroundColor: theme.palette.primary,
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.96rem',
                      cursor: 'pointer',
                      marginTop: '6px',
                      boxShadow: '0 4px 12px rgba(121, 114, 152, 0.25)',
                    }}
                  >
                    {authView === 'register'
                      ? (lang === 'vi' ? 'Tạo Tài Khoản & Bắt Đầu Hành Trình →' : 'Create Account & Enter Sanctuary →')
                      : (lang === 'vi' ? 'Đăng Nhập Vào Không Gian Bình Yên →' : 'Sign In to Sanctuary →')}
                  </button>
                </form>

                <p style={{ margin: '16px 0 0 0', fontSize: '0.8rem', color: theme.palette.textSecondary, lineHeight: 1.5 }}>
                  {lang === 'vi'
                    ? '🔒 Bảo mật tuyệt đối: Mật khẩu được băm bằng thuật toán PBKDF2-SHA256 và toàn bộ nhật ký tâm lý được mã hóa đầu-cuối WebCrypto AES-GCM-256.'
                    : '🔒 Zero-knowledge privacy: Credentials are hashed with PBKDF2-SHA256 and your journals are encrypted with WebCrypto AES-GCM-256.'}
                </p>
              </div>

              {/* Right Column: 1-Tap Quick Sanctuary Profiles & Anonymous Guest Mode */}
              <div
                style={{
                  padding: '24px',
                  borderRadius: '18px',
                  backgroundColor: theme.palette.background,
                  border: `1px solid ${theme.palette.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', color: theme.palette.textPrimary }}>
                    {lang === 'vi'
                      ? '⚡ Vào Nhanh 1-Chạm (Không cần gõ mật khẩu)'
                      : '⚡ 1-Tap Instant Entry (No Password Needed)'}
                  </h3>
                  <p style={{ margin: '0 0 14px 0', fontSize: '0.86rem', color: theme.palette.textSecondary }}>
                    {lang === 'vi'
                      ? 'Nếu hôm nay bạn đang mệt mỏi hoặc muốn trải nghiệm ngay, hãy chạm vào một hồ sơ đồng hành phù hợp với tâm trạng của bạn:'
                      : 'If you are feeling low on energy today or want to explore immediately, tap any companion profile below:'}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {QUICK_DEMO_PROFILES.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectQuickDemo(p.id)}
                        style={{
                          textAlign: 'left',
                          padding: '12px 16px',
                          borderRadius: '14px',
                          border: `1px solid ${theme.palette.border}`,
                          backgroundColor: theme.palette.surface,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: p.avatarMoodColor,
                                display: 'inline-block',
                              }}
                            />
                            <strong style={{ fontSize: '0.92rem', color: theme.palette.textPrimary }}>
                              {lang === 'vi' ? p.displayNameVi : p.displayNameEn}
                            </strong>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                backgroundColor: 'rgba(121, 114, 152, 0.12)',
                                color: theme.palette.primary,
                                fontWeight: 600,
                              }}
                            >
                              {lang === 'vi' ? p.badgeVi : p.badgeEn}
                            </span>
                          </div>
                          <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: theme.palette.textSecondary }}>
                            {lang === 'vi' ? p.descriptionVi : p.descriptionEn}
                          </p>
                        </div>
                        <span style={{ fontSize: '1.1rem', color: theme.palette.primary, fontWeight: 700 }}>→</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      ) : (
        <>
      {/* Gentle Clinical Alert Banner (Only visible when Low-Energy Depression or Night Wind-Down is active) */}
      {(theme.show48hImpulseVaultBanner || theme.simplifiedOneSmallStep) && (
        <section
          className="no-print"
          style={{
            maxWidth: '940px',
            margin: '14px auto 0',
            padding: '12px 18px',
            borderRadius: '16px',
            backgroundColor: theme.show48hImpulseVaultBanner ? '#451a03' : '#F4F1EA',
            color: theme.show48hImpulseVaultBanner ? '#fef3c7' : '#2F2F2B',
            border: `1px solid ${theme.palette.border}`,
          }}
        >
          {theme.show48hImpulseVaultBanner ? (
            <div>
              <strong>
                {lang === 'vi'
                  ? '🌙 Chế độ Hạ nhiệt Ban đêm & Khoang chờ 48 giờ đang bật: '
                  : '🌙 Evening Wind-Down & 48-Hour Delay Guard Active: '}
              </strong>
              {lang === 'vi' ? darkTherapyTimer.bannerTextVi : darkTherapyTimer.bannerTextEn}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.3rem' }}>🌱</span>
              <div>
                <strong>
                  {lang === 'vi'
                    ? 'Hôm nay một bước nhỏ thôi là đủ: '
                    : 'One gentle small step today is enough: '}
                </strong>
                <span style={{ fontSize: '0.88rem', color: '#6B6B63' }}>
                  {lang === 'vi'
                    ? 'Bạn không cần làm hết mọi thứ. Hãy chọn một điều nhẹ nhàng nhất hoặc nghỉ ngơi.'
                    : 'You do not need to do everything today. Pick one tiny step or simply rest.'}
                </span>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Main Clinical Module Sanctuary Navigation Tabs */}
      <nav
        className="no-print"
        style={{
          maxWidth: '940px',
          margin: '18px auto 12px',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          padding: '0 16px',
        }}
      >
        {(
          [
            ['session-player', '🌿', lang === 'vi' ? 'Tâm sự & Nhật ký' : 'Journal & Practice'],
            ['anxiety-hub', '🌊', lang === 'vi' ? 'Làm dịu Lo âu' : 'Anxiety Relief'],
            ['bipolar-ipsrt-hub', '🌙', lang === 'vi' ? 'Khí sắc & Giấc ngủ' : 'Mood & Sleep'],
            ['tools-36-team-cbt', '✨', lang === 'vi' ? 'Bài tập Tự lực' : 'Self-Care Tools'],
            ['ai-companion-biometrics', '🤖', lang === 'vi' ? 'Trợ lý AI & HRV' : 'AI Companion'],
            ['assessments-report', '📋', lang === 'vi' ? 'Trắc nghiệm & Bác sĩ' : 'Self-Checks'],
            ['account-privacy-vault', '🔐', lang === 'vi' ? 'Hồ sơ & Bảo mật' : 'Account'],
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
                gap: '6px',
                padding: '9px 16px',
                borderRadius: '14px',
                border: isSelected ? `2px solid ${theme.palette.primary}` : `1px solid ${theme.palette.border}`,
                backgroundColor: isSelected ? theme.palette.primary : theme.palette.surface,
                color: isSelected ? '#ffffff' : theme.palette.textPrimary,
                fontWeight: 600,
                fontSize: '0.89rem',
                cursor: 'pointer',
                boxShadow: isSelected ? '0 4px 12px rgba(121, 114, 152, 0.2)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* TAB 1: DBT-FIRST, CBT-SECOND INTERACTIVE SESSION PLAYER (Clean 1-Card-Per-View Layout) */}
      {activeTab === 'session-player' && (
        <main style={{ maxWidth: '940px', margin: '0 auto', padding: '0 16px' }}>
          <SanctuaryHeroBanner
            scene="sunrise-hills"
            isDark={theme.mode === 'low-stimulus-mania'}
            title={
              lang === 'vi'
                ? `Xin chào ${accountSession.user.displayName}, hôm nay tâm trí bạn thế nào?`
                : `Hello ${accountSession.user.displayName}, how is your mind feeling today?`
            }
            subtitle={
              lang === 'vi'
                ? 'Hãy chọn một hoạt động nhẹ nhàng bên dưới. Mỗi lần chỉ mở một không gian duy nhất để bạn thật sự thư thái.'
                : 'Choose one gentle activity below. Only one focused card opens at a time so your mind stays calm and uncluttered.'
            }
          />

          {/* 3-Mode Pill Switcher for Tab 1 (Only 1 panel rendered below!) */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
            {(
              [
                ['companion', '💬', lang === 'vi' ? '1. Tâm sự & Giải tỏa Cảm xúc' : '1. Share & Emotional Relief'],
                ['practice-7', '🌱', lang === 'vi' ? '2. Thực hành 7 Bài tập CBT/DBT' : '2. Guided CBT/DBT Practice'],
                ['emotions', '🎨', lang === 'vi' ? '3. Gọi tên 5 Nhóm Cảm xúc' : '3. 5-Family Emotion Cards'],
              ] as const
            ).map(([viewId, icon, label]) => (
              <button
                key={viewId}
                type="button"
                onClick={() => setTab1SubView(viewId)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  border: tab1SubView === viewId ? `2px solid ${theme.palette.primary}` : `1px solid ${theme.palette.border}`,
                  backgroundColor: tab1SubView === viewId ? theme.palette.surface : 'transparent',
                  color: tab1SubView === viewId ? theme.palette.primary : theme.palette.textSecondary,
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                }}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          {/* VIEW 1: Expressive vs Instrumental + Voice Burst + Mood Palette (Single Focused Card) */}
          {tab1SubView === 'companion' && (
          <section
            style={{
              padding: '20px',
              borderRadius: '18px',
              backgroundColor: theme.palette.surface,
              border: `1px solid ${theme.palette.border}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
              <h3 style={{ margin: 0 }}>
                {lang === 'vi'
                  ? 'Chia sẻ tâm sự & Nhận diện sắc thái cảm xúc'
                  : 'Share Your Thoughts & Mood Reflection'}
              </h3>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setPhase0Mode('expressive')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '10px',
                    backgroundColor: phase0Mode === 'expressive' ? theme.palette.primary : 'transparent',
                    color: phase0Mode === 'expressive' ? '#fff' : theme.palette.textSecondary,
                    border: `1px solid ${theme.palette.border}`,
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                  }}
                >
                  {lang === 'vi' ? '💛 Chỉ cần lắng nghe thấu cảm' : '💛 Just Empathy & Listening'}
                </button>
                <button
                  type="button"
                  onClick={() => setPhase0Mode('instrumental')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '10px',
                    backgroundColor: phase0Mode === 'instrumental' ? theme.palette.primary : 'transparent',
                    color: phase0Mode === 'instrumental' ? '#fff' : theme.palette.textSecondary,
                    border: `1px solid ${theme.palette.border}`,
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                  }}
                >
                  {lang === 'vi' ? '🌱 Gợi ý bài tập gỡ rối' : '🌱 Suggest Helpful Skills'}
                </button>
              </div>
            </div>

            <textarea
              rows={3}
              value={voiceBurstText}
              onChange={(e) => setVoiceBurstText((e.target as HTMLTextAreaElement).value)}
              className="sanctuary-input"
              placeholder={lang === 'vi' ? 'Viết ra điều đang làm bạn bận lòng...' : 'Write down what is on your mind...'}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />

            {/* Generated Mood Palette */}
            <div
              style={{
                marginTop: '12px',
                padding: '14px 16px',
                borderRadius: '14px',
                background: voiceBurstAnalysis.moodPalette.gradientCss,
                color: '#1e293b',
              }}
            >
              <strong>{lang === 'vi' ? 'Sắc thái cảm xúc ghi nhận' : 'Detected Mood-Palette'} ({voiceBurstAnalysis.moodPalette.dominantEmotion}): </strong>
              {lang === 'vi'
                ? voiceBurstAnalysis.moodPalette.summaryVi
                : voiceBurstAnalysis.moodPalette.summaryEn}
            </div>

            {phase0Mode === 'expressive' ? (
              <p style={{ marginTop: '12px', padding: '12px 14px', borderLeft: `4px solid ${theme.palette.primary}`, backgroundColor: resultSurfaceBg, color: resultSurfaceText, borderRadius: '8px', marginBottom: 0 }}>
                {lang === 'vi'
                  ? voiceBurstAnalysis.earEmpathyReplyVi
                  : voiceBurstAnalysis.earEmpathyReplyEn}
              </p>
            ) : (
              <p style={{ marginTop: '12px', padding: '12px 14px', backgroundColor: calmAlertBg, color: calmAlertText, borderRadius: '10px', fontSize: '0.9rem', marginBottom: 0 }}>
                <strong>{lang === 'vi' ? 'Gợi ý bước tiếp theo: ' : 'Recommended Step: '}</strong>
                {lang === 'vi' ? dbtFirstRouter.rationaleVi : dbtFirstRouter.rationaleEn}
              </p>
            )}
          </section>
          )}

          {/* VIEW 3: 5-Family Affect Labeling & Socratic Gentle Prompt (Single Focused Card) */}
          {tab1SubView === 'emotions' && (
          <section
            style={{
              padding: '20px',
              borderRadius: '18px',
              backgroundColor: theme.palette.surface,
              border: `1px solid ${theme.palette.border}`,
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              {lang === 'vi'
                ? 'Gọi Tên 5 Nhóm Cảm Xúc Tự Nhiên (Phân biệt Xấu hổ và Áy náy)'
                : '5-Family Affect Labeling Cards (Distinguishing Shame vs. Guilt)'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '16px' }}>
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

            <div style={{ paddingTop: '12px', borderTop: `1px solid ${theme.palette.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <strong style={{ fontSize: '0.88rem' }}>
                  {lang === 'vi' ? 'Phong cách gợi mở Socratic:' : 'Socratic Reflection Tone:'}
                </strong>
                {(['off', 'gentle', 'moderate', 'firm'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setPushbackLevel(lvl)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      backgroundColor: pushbackLevel === lvl ? theme.palette.primary : 'transparent',
                      color: pushbackLevel === lvl ? '#fff' : theme.palette.textPrimary,
                      border: `1px solid ${theme.palette.border}`,
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}
                  >
                    {lvl === 'off'
                      ? (lang === 'vi' ? 'Tắt' : 'Off')
                      : lvl === 'gentle'
                        ? (lang === 'vi' ? 'Dịu dàng' : 'Gentle')
                        : lvl === 'moderate'
                          ? (lang === 'vi' ? 'Tiêu chuẩn' : 'Moderate')
                          : (lang === 'vi' ? 'Sâu sắc' : 'Firm')}
                  </button>
                ))}
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.88rem', color: theme.palette.textSecondary }}>
                {lang === 'vi' ? livePushbackPreview.promptVi : livePushbackPreview.promptEn}
              </p>
            </div>
          </section>
          )}

          {/* VIEW 2: 7 Guided Protocols (Only visible when tab1SubView === 'practice-7') */}
          {tab1SubView === 'practice-7' && (
          <>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
            {(
              [
                [1, '📝', lang === 'vi' ? '1. Nhật ký Suy nghĩ' : '1. Thought Record'],
                [2, '🌱', lang === 'vi' ? '2. Kích hoạt Hành vi' : '2. Behavioral Activation'],
                [3, '🎯', lang === 'vi' ? '3. Mục tiêu Nghịch lý' : '3. Paradoxical Agenda'],
                [4, '🔄', lang === 'vi' ? '4. Hành động Đối lập' : '4. Opposite Action'],
                [5, '🧘', lang === 'vi' ? '5. Trí tuệ Wise Mind' : '5. Wise Mind'],
                [6, '🔗', lang === 'vi' ? '6. Chuỗi Hành vi' : '6. Chain Analysis'],
                [7, '💬', lang === 'vi' ? '7. Giao tiếp DEAR MAN' : '7. DEAR MAN Roleplay'],
              ] as const
            ).map(([num, icon, title]) => {
              const isSelected = activeProtocolStep === num;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => setActiveProtocolStep(num)}
                  style={{
                    padding: '7px 13px',
                    borderRadius: '11px',
                    border: isSelected ? `2px solid ${theme.palette.primary}` : `1px solid ${theme.palette.border}`,
                    backgroundColor: isSelected ? theme.palette.primary : theme.palette.surface,
                    color: isSelected ? '#ffffff' : theme.palette.textPrimary,
                    fontWeight: 600,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                  }}
                >
                  {icon} {title}
                </button>
              );
            })}
          </div>

          {/* 7 Interactive Guided Protocols Grid (Filtered by activeProtocolStep for low cognitive load) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' }}>
            {/* 1. CBT 7-Step Thought Record with Accuracy Check */}
            {(activeProtocolStep === 1 || activeProtocolStep === 'all') && (
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
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: trIsObjectivelyTrue ? warnAlertBg : calmAlertBg,
                  color: trIsObjectivelyTrue ? warnAlertText : calmAlertText,
                  fontSize: '0.86rem',
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
            )}

            {/* 2. CBT Behavioral Activation 6-Step with Mandatory Rest Check & Confidence >= 7/10 */}
            {(activeProtocolStep === 2 || activeProtocolStep === 'all') && (
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
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: resultSurfaceBg,
                  color: resultSurfaceText,
                  border: `1px solid ${resultSurfaceBorder}`,
                  fontSize: '0.86rem',
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
            )}

            {/* 3. TEAM-CBT Paradoxical Agenda Setting */}
            {(activeProtocolStep === 3 || activeProtocolStep === 'all') && (
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
            )}

            {/* 4. DBT Opposite Action (4 steps with Justified Check) */}
            {(activeProtocolStep === 4 || activeProtocolStep === 'all') && (
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
            )}

            {/* 5. DBT Wise Mind (6 steps with Harsh Self-Critic Guard & "Nothing yet") */}
            {(activeProtocolStep === 5 || activeProtocolStep === 'all') && (
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
            )}

            {/* 6. DBT Chain Analysis (6 steps + Hard Stops for self-harm/victimization + Shame Protocol) */}
            {(activeProtocolStep === 6 || activeProtocolStep === 'all') && (
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
            )}

            {/* 7. DBT DEAR MAN + TEAM-CBT EAR with Interactive AI Roleplay Rehearsal */}
            {(activeProtocolStep === 7 || activeProtocolStep === 'all') && (
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
            )}
          </div>
          </>
          )}
        </main>
      )}

      {/* TAB 2: ANXIETY GOLD-STANDARD HUB (Clean 1-Card-Per-View with Calm Waves Illustration) */}
      {activeTab === 'anxiety-hub' && (
        <main style={{ maxWidth: '940px', margin: '0 auto', padding: '0 16px' }}>
          <SanctuaryHeroBanner
            scene="calm-waves"
            isDark={theme.mode === 'low-stimulus-mania'}
            title={lang === 'vi' ? 'Góc Bình Yên Làm Dịu Lo Âu' : 'Anxiety Relief & Calm Waves Sanctuary'}
            subtitle={
              lang === 'vi'
                ? 'Khi lo lắng dâng lên, bạn không cần giải quyết mọi thứ ngay lúc này. Hãy chọn một phương pháp nhẹ nhàng bên dưới.'
                : 'When worry rises, you do not have to solve everything at once. Choose one gentle exercise below.'
            }
          />

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
            {(
              [
                ['worry-box', '📦', lang === 'vi' ? '1. Chiếc hộp gác lại âu lo' : '1. Worry Box'],
                ['wave-90s', '🌊', lang === 'vi' ? '2. Lướt sóng cảm xúc 90 giây' : '2. 90-Second Wave Surfing'],
                ['exposure', '🪜', lang === 'vi' ? '3. Thang đối diện từng bước' : '3. Gentle Exposure Ladder'],
                ['prediction', '🔍', lang === 'vi' ? '4. Kiểm chứng dự đoán' : '4. Prediction Calibration'],
              ] as const
            ).map(([subId, icon, label]) => (
              <button
                key={subId}
                type="button"
                onClick={() => setTab2SubView(subId)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  border: tab2SubView === subId ? `2px solid ${theme.palette.primary}` : `1px solid ${theme.palette.border}`,
                  backgroundColor: tab2SubView === subId ? theme.palette.surface : 'transparent',
                  color: tab2SubView === subId ? theme.palette.primary : theme.palette.textSecondary,
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                }}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          <div>
            {/* Worry Box (Worry Postponement 15-min window) */}
            {tab2SubView === 'worry-box' && (
            <section
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                {lang === 'vi'
                  ? 'Chiếc Hộp Gác Lại Âu Lo (Khung giờ xử lý 17:30–17:45)'
                  : 'Worry Box (17:30–17:45 Postponement Window)'}
              </h3>
              <textarea
                rows={3}
                value={worryInput}
                onChange={(e) => setWorryInput((e.target as HTMLTextAreaElement).value)}
                style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
              />
              <p style={{ fontSize: '0.88rem' }}>
                <strong>{lang === 'vi' ? 'Phân loại tự động:' : 'Automated Classification:'}</strong>{' '}
                `{worryProcessed.updatedItem.category === 'hypothetical'
                  ? (lang === 'vi' ? 'Giả định tương lai' : 'Hypothetical Worry')
                  : (lang === 'vi' ? 'Thực tế trước mắt' : 'Actionable/Current')}`{' '}
                ({worryProcessed.updatedItem.scheduledWindowTime})
              </p>
              <p style={{ fontSize: '0.88rem', margin: 0, padding: '12px', borderRadius: '10px', backgroundColor: calmAlertBg, color: calmAlertText }}>
                {lang === 'vi' ? worryProcessed.clinicalProtocolVi : worryProcessed.clinicalProtocolEn}
              </p>
            </section>
            )}

            {/* Exposure Hierarchy Builder (ERP & Interoceptive Exposure) + Safety Behavior Detector */}
            {tab2SubView === 'exposure' && (
            <section
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                {lang === 'vi'
                  ? 'Thang Đối Diện Nỗi Sợ Từng Bước (ERP & Cảm Giác Cơ Thể 0–100)'
                  : 'Exposure Hierarchy Ladder (ERP & Interoceptive SUDS 0–100)'}
              </h3>
              {exposureLadder.map((step) => (
                <div
                  key={step.id}
                  style={{
                    padding: '12px',
                    marginBottom: '10px',
                    borderRadius: '12px',
                    border: `1px solid ${theme.palette.border}`,
                    fontSize: '0.88rem',
                  }}
                >
                  <strong>
                    [{step.exposureType === 'interoceptive'
                      ? (lang === 'vi' ? 'CẢM GIÁC CƠ THỂ' : 'INTEROCEPTIVE')
                      : (lang === 'vi' ? 'THỰC TẾ TRỰC TIẾP' : 'IN-VIVO ERP')}] {step.title}
                  </strong>
                  <div style={{ marginTop: '4px' }}>
                    {lang === 'vi'
                      ? `Mức khó chịu ban đầu: ${step.baselineSuds}/100 → Hiện tại: ${step.currentSuds}/100 ${step.habituationAchieved ? '(Đã thích nghi và hạ nhiệt ✓)' : ''}`
                      : `Baseline SUDS: ${step.baselineSuds}/100 → Current: ${step.currentSuds}/100 ${step.habituationAchieved ? '(Habituated ✓)' : ''}`}
                  </div>
                  {step.detectedSafetyBehaviors.length > 0 && (
                    <div style={{ color: theme.palette.sosBanner, marginTop: '4px' }}>
                      {lang === 'vi'
                        ? `Hành vi né tránh / an toàn ngầm phát hiện: ${step.detectedSafetyBehaviors.join(', ')}`
                        : `Detected subtle safety behaviors: ${step.detectedSafetyBehaviors.join(', ')}`}
                    </div>
                  )}
                </div>
              ))}
            </section>
            )}

            {/* Prediction Calibration Tracker */}
            {tab2SubView === 'prediction' && (
            <section
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                {lang === 'vi'
                  ? 'Kiểm Chứng & Hiệu Chỉnh Dự Đoán Lo Âu'
                  : 'Prediction Calibration Tracker'}
              </h3>
              <p style={{ fontSize: '0.92rem', fontWeight: 600, padding: '12px', borderRadius: '10px', backgroundColor: calmAlertBg, color: calmAlertText }}>
                {lang === 'vi' ? predictionStats.calibrationInsightVi : predictionStats.calibrationInsightEn}
              </p>
              {predictionEntries.map((pe) => (
                <div key={pe.id} style={{ fontSize: '0.88rem', marginBottom: '10px', padding: '10px 12px', borderRadius: '10px', border: `1px solid ${theme.palette.border}` }}>
                  • <strong>{pe.eventDescription}:</strong>{' '}
                  {lang === 'vi' ? 'Dự đoán thảm họa' : 'Feared prediction'}{' '}
                  {pe.predictedProbabilityPercent}% →{' '}
                  {lang === 'vi' ? 'Thực tế:' : 'Actual Outcome:'} {pe.actualOutcome}
                </div>
              ))}
            </section>
            )}

            {/* 4. DBT Radical Acceptance & Urge Surfing 90-Second Adrenaline Wave Timer */}
            {tab2SubView === 'wave-90s' && (
            <section
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                {lang === 'vi'
                  ? 'Lướt Sóng Cảm Xúc 90 Giây (Chấp Nhận Triệt Để & Thả Lỏng Cơn Thôi Thúc)'
                  : '90-Second Emotion Wave Surfing (DBT Radical Acceptance)'}
              </h3>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '12px' }}>
                {lang === 'vi'
                  ? `Thời gian trên đỉnh sóng (${urgeSurfFrame.elapsedSeconds}s / 90s — Độ cao sóng: ${urgeSurfFrame.waveHeightPercent}%):`
                  : `Time on peak of wave (${urgeSurfFrame.elapsedSeconds}s / 90s — Wave height: ${urgeSurfFrame.waveHeightPercent}%):`}
                <input
                  type="range"
                  min={0}
                  max={90}
                  value={urgeSurfSeconds}
                  onChange={(e) => setUrgeSurfSeconds(Number((e.target as HTMLInputElement).value))}
                  style={{ width: '100%', marginTop: '8px' }}
                />
              </label>
              <p style={{ fontSize: '0.9rem', margin: 0, padding: '12px', borderRadius: '10px', backgroundColor: resultSurfaceBg, color: resultSurfaceText }}>
                {lang === 'vi' ? urgeSurfFrame.coachingVi : urgeSurfFrame.coachingEn}
              </p>
            </section>
            )}
          </div>
        </main>
      )}

      {/* TAB 3: BIPOLAR & IPSRT HUB (Clean 1-Card-Per-View with Moon & Starlight Illustration) */}
      {activeTab === 'bipolar-ipsrt-hub' && (
        <main style={{ maxWidth: '940px', margin: '0 auto', padding: '0 16px' }}>
          <SanctuaryHeroBanner
            scene="moon-stars"
            isDark={theme.mode === 'low-stimulus-mania'}
            title={lang === 'vi' ? 'Nhật Ký Khí Sắc, Giấc Ngủ & Nhịp Sinh Học' : 'Mood, Sleep & Circadian Rhythm Sanctuary'}
            subtitle={
              lang === 'vi'
                ? 'Theo dõi nhẹ nhàng sự thay đổi năng lượng, giữ nhịp sinh học ổn định và bảo vệ giấc ngủ của bạn.'
                : 'Gently track your energy and sleep patterns, maintain daily rhythm anchors, and protect restful sleep.'
            }
          />

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
            {(
              [
                ['mood-chart', '📊', lang === 'vi' ? '1. Biểu đồ Khí sắc & Giấc ngủ' : '1. Mood & Sleep Chart'],
                ['ipsrt-rhythm', '🕰️', lang === 'vi' ? '2. 5 Mốc Nhịp Sinh Học IPSRT' : '2. 5 Daily Rhythm Anchors'],
                ['safety-plan', '🛡️', lang === 'vi' ? '3. Khoang chờ 48h & Kế hoạch Ulysses' : '3. 48h Delay & Care Plan'],
              ] as const
            ).map(([subId, icon, label]) => (
              <button
                key={subId}
                type="button"
                onClick={() => setTab3SubView(subId)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  border: tab3SubView === subId ? `2px solid ${theme.palette.primary}` : `1px solid ${theme.palette.border}`,
                  backgroundColor: tab3SubView === subId ? theme.palette.surface : 'transparent',
                  color: tab3SubView === subId ? theme.palette.primary : theme.palette.textSecondary,
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                }}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          {/* VIEW 1: Multi-Axis Chart + Today's Sliders combined into 1 clean card */}
          {tab3SubView === 'mood-chart' && (
          <section
            style={{
              padding: '16px',
              borderRadius: '10px',
              backgroundColor: theme.palette.surface,
              border: `1px solid ${theme.palette.border}`,
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              {lang === 'vi'
                ? 'Biểu Đồ 7 Ngày: Khí Sắc (-5..+5) • Năng Lượng (-5..+5) • Giấc Ngủ (0..12h)'
                : '7-Day Chart: Mood (-5..+5) • Energy (-5..+5) • Sleep (0..12h)'}
            </h3>
            <svg
              viewBox={`0 0 ${bipolarMultiAxisSvgChart.width} ${bipolarMultiAxisSvgChart.height}`}
              style={{
                width: '100%',
                maxHeight: '220px',
                backgroundColor: resultSurfaceBg,
                border: `1px solid ${resultSurfaceBorder}`,
                borderRadius: '14px',
              }}
              role="img"
              aria-label="SVG Multi-Axis Dual-Pole (-5..+5) Mood, Energy and Sleep Chart"
            >
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

              {bipolarMultiAxisSvgChart.points.map((pt) => (
                <g key={pt.dateLabel}>
                  <rect
                    x={pt.x - 10}
                    y={bipolarMultiAxisSvgChart.height - 24 - pt.sleepBarHeight}
                    width={20}
                    height={pt.sleepBarHeight}
                    fill="rgba(106, 168, 130, 0.25)"
                    rx={3}
                  />
                  <text
                    x={pt.x}
                    y={bipolarMultiAxisSvgChart.height - 8}
                    textAnchor="middle"
                    fill={resultSurfaceText}
                    fontSize="11"
                  >
                    {pt.dateLabel} ({pt.sleepHours}h)
                  </text>
                </g>
              ))}

              <polyline
                fill="none"
                stroke="#6AA882"
                strokeWidth={3}
                points={bipolarMultiAxisSvgChart.moodPolylinePoints}
              />

              <polyline
                fill="none"
                stroke="#797298"
                strokeWidth={2.5}
                strokeDasharray="5 3"
                points={bipolarMultiAxisSvgChart.energyPolylinePoints}
              />

              {bipolarMultiAxisSvgChart.points.map((pt) => (
                <g key={`node-${pt.dateLabel}`}>
                  <circle
                    cx={pt.x}
                    cy={pt.moodY}
                    r={pt.isMixedRisk || pt.isManiaProdromeRisk ? 6 : 4}
                    fill={pt.isMixedRisk ? '#C56548' : '#6AA882'}
                  />
                  <circle cx={pt.x} cy={pt.energyY} r={4} fill="#797298" />
                </g>
              ))}
            </svg>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '16px', fontSize: '0.88rem' }}>
              <label>
                {lang === 'vi' ? `Khí sắc hôm nay (-5..+5): ${moodPolarity}` : `Today's Mood (-5..+5): ${moodPolarity}`}
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
                {lang === 'vi' ? `Mức năng lượng (-5..+5): ${energyLevel}` : `Energy Level (-5..+5): ${energyLevel}`}
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
                {lang === 'vi' ? `Số giờ ngủ đêm qua:` : `Sleep hours last night:`}
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
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor:
                  bipolarAnalysis.isMixedState || bipolarAnalysis.isManiaProdrome ? warnAlertBg : calmAlertBg,
                color:
                  bipolarAnalysis.isMixedState || bipolarAnalysis.isManiaProdrome ? warnAlertText : calmAlertText,
                fontSize: '0.88rem',
              }}
            >
              {lang === 'vi' ? bipolarAnalysis.clinicalAlertVi : bipolarAnalysis.clinicalAlertEn}
            </div>
          </section>
          )}

          {/* VIEW 2: 5 IPSRT Social Rhythm Anchors */}
          {tab3SubView === 'ipsrt-rhythm' && (
            <section
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                {lang === 'vi'
                  ? `Nhịp Sinh Học Xã Hội 5 Mốc IPSRT (Độ ổn định: ${ipsrtReport.stabilityScorePercent}%)`
                  : `5-Anchor Social Rhythm Metric IPSRT (Stability: ${ipsrtReport.stabilityScorePercent}%)`}
              </h3>
              <ul style={{ fontSize: '0.9rem', lineHeight: 1.8 }}>
                <li>{lang === 'vi' ? '1. Giờ thức dậy ra khỏi giường:' : '1. Out of bed time:'} <strong>{currentBipolarLog.ipsrtAnchors.outOfBedTime}</strong></li>
                <li>{lang === 'vi' ? '2. Giao tiếp xã hội đầu tiên trong ngày:' : '2. First social contact:'} <strong>{currentBipolarLog.ipsrtAnchors.firstSocialContactTime}</strong></li>
                <li>{lang === 'vi' ? '3. Bắt đầu làm việc hoặc học tập:' : '3. Work/study start time:'} <strong>{currentBipolarLog.ipsrtAnchors.workOrStudyStartTime}</strong></li>
                <li>{lang === 'vi' ? '4. Bữa ăn tối:' : '4. Dinner time:'} <strong>{currentBipolarLog.ipsrtAnchors.dinnerTime}</strong></li>
                <li>{lang === 'vi' ? '5. Giờ lên giường ngủ:' : '5. Bedtime:'} <strong>{currentBipolarLog.ipsrtAnchors.bedTime}</strong></li>
              </ul>
              <p style={{ fontSize: '0.88rem', margin: 0, padding: '12px', borderRadius: '10px', backgroundColor: calmAlertBg, color: calmAlertText }}>
                {lang === 'vi' ? ipsrtReport.interpretationVi : ipsrtReport.interpretationEn}
              </p>
            </section>
          )}

          {/* VIEW 3: 48-Hour Impulse Vault & Ulysses Care Plan combined in 1 clean card */}
          {tab3SubView === 'safety-plan' && (
            <section
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                {lang === 'vi'
                  ? 'Khoang Trì Hoãn Quyết Định 48 Giờ & Kế Hoạch Bình Ổn Ulysses'
                  : '48-Hour Decision Delay Vault & Ulysses Care Plan'}
              </h3>
              <p style={{ fontSize: '0.88rem' }}>
                <strong>{lang === 'vi' ? 'Quyết định đang tạm khóa 48h:' : 'Locked Impulse Decision:'}</strong> {impulseVaultEntry.impulseDescription}
              </p>
              <p style={{ fontSize: '0.88rem', padding: '10px 12px', borderRadius: '10px', backgroundColor: resultSurfaceBg, color: resultSurfaceText }}>
                {lang === 'vi' ? impulseLockStatus.statusMessageVi : impulseLockStatus.statusMessageEn}
              </p>
              <hr style={{ border: 'none', borderTop: `1px solid ${theme.palette.border}`, margin: '14px 0' }} />
              <p style={{ fontSize: '0.88rem' }}>
                <strong>{lang === 'vi' ? 'Dấu hiệu tiền triệu cá nhân cần lưu ý:' : 'Personal Prodromal Signs:'}</strong>{' '}
                {DEFAULT_ULYSSES_CONTRACT.personalManiaProdromes.join('; ')}
              </p>
              <p style={{ fontSize: '0.88rem', margin: 0 }}>
                <strong>{lang === 'vi' ? 'Góc nhìn cân bằng về tuân thủ điều trị:' : 'Balanced Thought on Adherence:'}</strong>{' '}
                {lang === 'vi'
                  ? medAdherenceReview.balancedAdherenceThoughtVi
                  : medAdherenceReview.balancedAdherenceThoughtEn}
              </p>
            </section>
          )}
        </main>
      )}

      {/* TAB 4: CLINICAL SELF-ASSESSMENTS & A4 REPORT (Clean 1-Card-Per-View) */}
      {activeTab === 'assessments-report' && (
        <main style={{ maxWidth: '940px', margin: '0 auto', padding: '0 16px' }}>
          <SanctuaryHeroBanner
            scene="care-notebook"
            isDark={theme.mode === 'low-stimulus-mania'}
            title={lang === 'vi' ? 'Tự Đánh Giá Sức Khỏe Tâm Trí & Báo Cáo Bác Sĩ' : 'Mental Health Self-Checks & Clinician Report'}
            subtitle={
              lang === 'vi'
                ? 'Theo dõi tiến trình hồi phục qua 6 thang đo chuẩn quốc tế và xuất bản tóm tắt riêng tư gửi bác sĩ.'
                : 'Track your recovery gently through 6 validated self-checks and generate a private summary for your doctor.'
            }
          />

          <div className="no-print" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
            {(
              [
                ['scales-6', '📋', lang === 'vi' ? '1. 6 Thang Đo Tâm Lý Định Kỳ' : '1. 6 Clinical Self-Checks'],
                ['doctor-report', '🩺', lang === 'vi' ? '2. Báo Cáo Bác Sĩ & Xuất Dữ Liệu' : '2. Doctor Summary & Export'],
              ] as const
            ).map(([subId, icon, label]) => (
              <button
                key={subId}
                type="button"
                onClick={() => setTab4SubView(subId)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  border: tab4SubView === subId ? `2px solid ${theme.palette.primary}` : `1px solid ${theme.palette.border}`,
                  backgroundColor: tab4SubView === subId ? theme.palette.surface : 'transparent',
                  color: tab4SubView === subId ? theme.palette.primary : theme.palette.textSecondary,
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                }}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          {tab4SubView === 'scales-6' && (
          <section
            style={{
              padding: '16px',
              borderRadius: '10px',
              backgroundColor: theme.palette.surface,
              border: `1px solid ${theme.palette.border}`,
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              {lang === 'vi'
                ? '6 Thang Đo Đánh Giá Định Kỳ (BMS • PHQ-9 • GAD-7 • ASRM • MDQ • ISI)'
                : 'Routine Clinical Assessments Suite (BMS • PHQ-9 • GAD-7 • ASRM • MDQ • ISI)'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {assessments.map((a) => (
                <div
                  key={a.id}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    border: `1px solid ${theme.palette.border}`,
                    fontSize: '0.88rem',
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
          )}

          {tab4SubView === 'doctor-report' && (
          <section
            className="print-only-a4"
            style={{
              padding: '20px',
              borderRadius: '10px',
              backgroundColor: theme.palette.surface,
              color: theme.palette.textPrimary,
              border: `1px solid ${theme.palette.border}`,
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              {lang === 'vi'
                ? 'Báo Cáo Tóm Tắt Lâm Sàng Gửi Bác Sĩ (Chu Kỳ 30 Ngày)'
                : 'Clinician Summary Report (30-Day Longitudinal)'}
            </h3>
            <p style={{ fontSize: '0.88rem' }}>
              <strong>{lang === 'vi' ? 'Mã Người Dùng:' : 'Patient Alias:'}</strong> {clinicianReport.patientAlias} |{' '}
              <strong>{lang === 'vi' ? 'Ngày xuất:' : 'Date:'}</strong> {clinicianReport.generatedDate} |{' '}
              <strong>{lang === 'vi' ? 'Độ ổn định nhịp sinh học:' : 'IPSRT Stability:'}</strong> {clinicianReport.ipsrtAverageStabilityPercent}% |{' '}
              <strong>{lang === 'vi' ? 'Tuân thủ điều trị:' : 'Medication Adherence:'}</strong> {clinicianReport.medicationAdherencePercent}%
            </p>
            <p style={{ fontSize: '0.88rem' }}>
              <strong>{lang === 'vi' ? 'Khuôn mẫu suy nghĩ thường gặp:' : 'Frequent Cognitive Distortions:'}</strong>{' '}
              {clinicianReport.topDistortions.join(', ') || (lang === 'vi' ? 'Chưa ghi nhận' : 'None detected')}
            </p>

            <div className="no-print" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '14px', marginBottom: '12px' }}>
              <button
                type="button"
                onClick={() => typeof window !== 'undefined' && window.print()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: theme.palette.primary,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {lang === 'vi' ? '🖨️ In Báo Cáo Chuẩn A4' : '🖨️ Print A4 Report'}
              </button>
              <button
                type="button"
                onClick={() => void handleTestWebCryptoEncryption()}
                style={{ padding: '8px 14px', borderRadius: '10px', border: `1px solid ${theme.palette.border}`, backgroundColor: 'transparent', cursor: 'pointer' }}
              >
                {lang === 'vi'
                  ? '🔒 Mã hóa Phiên Hiện Tại (AES-256)'
                  : '🔒 Encrypt Current Session'}
              </button>
            </div>

            <details className="no-print">
              <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.86rem' }}>
                {lang === 'vi'
                  ? `Xem Tệp Xuất Nhật Ký Markdown (${markdownExport.filename})`
                  : `View Exported Markdown (${markdownExport.filename})`}
              </summary>
              <pre
                style={{
                  padding: '14px',
                  backgroundColor: resultSurfaceBg,
                  color: resultSurfaceText,
                  border: `1px solid ${resultSurfaceBorder}`,
                  borderRadius: '12px',
                  overflowX: 'auto',
                  fontSize: '0.82rem',
                  marginTop: '8px',
                }}
              >
                {markdownExport.markdownContent}
              </pre>
            </details>
          </section>
          )}
        </main>
      )}

      {/* TAB 5: 36 INTERACTIVE CBT/TEAM-CBT/DBT TOOLS & DEPRESSION GOLD-STANDARD SUITE */}
      {activeTab === 'tools-36-team-cbt' && (
        <main style={{ maxWidth: '940px', margin: '0 auto', padding: '0 16px' }}>
          <SanctuaryHeroBanner
            scene="botanical-garden"
            isDark={theme.mode === 'low-stimulus-mania'}
            title={lang === 'vi' ? 'Khu Vườn 36 Bài Tập Tự Lực Tâm Lý' : 'Self-Care Garden & 36 Interactive Exercises'}
            subtitle={
              lang === 'vi'
                ? 'Chọn một công cụ nhỏ để thực hành trong 3–5 phút. Mỗi bước nhỏ đều nuôi dưỡng sự bình an của bạn.'
                : 'Choose one gentle exercise to practice in 3–5 minutes. Every small step nurtures your inner calm.'
            }
          />

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
            {(
              [
                ['catalog-36', '🧰', lang === 'vi' ? '1. Kho 36 Bài Tập Nhanh' : '1. 36 Quick Tools'],
                ['mp-sheet', '☀️', lang === 'vi' ? '2. Dự Đoán Niềm Vui' : '2. Pleasure-Predicting'],
                ['anti-procrastination', '⏱️', lang === 'vi' ? '3. Vượt Trì Hoãn 5 Phút' : '3. 5-Min Anti-Procrastination'],
                ['downward-arrow', '🏹', lang === 'vi' ? '4. Mũi Tên Đi Xuống' : '4. Downward Arrow'],
                ['abc-please', '🌿', lang === 'vi' ? '5. Chăm Sóc ABC PLEASE' : '5. ABC PLEASE & ACCEPTS'],
                ['cbti-sleep', '🌙', lang === 'vi' ? '6. Giấc Ngủ CBT-I' : '6. CBT-I Sleep Diary'],
              ] as const
            ).map(([subId, icon, label]) => {
              const isSelected = activeToolkitSubTab === subId;
              return (
                <button
                  key={subId}
                  type="button"
                  onClick={() => setActiveToolkitSubTab(subId)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '12px',
                    border: isSelected ? `2px solid ${theme.palette.primary}` : `1px solid ${theme.palette.border}`,
                    backgroundColor: isSelected ? theme.palette.surface : 'transparent',
                    color: isSelected ? theme.palette.primary : theme.palette.textSecondary,
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                  }}
                >
                  {icon} {label}
                </button>
              );
            })}
          </div>

          {/* 1. 36 Interactive CBT, TEAM-CBT, DBT & Bipolar Toolkit Hub (0ms execution) */}
          {(activeToolkitSubTab === 'catalog-36' || activeToolkitSubTab === 'all') && (
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
                padding: '14px 16px',
                borderRadius: '14px',
                backgroundColor: resultSurfaceBg,
                color: resultSurfaceText,
                border: `1px solid ${resultSurfaceBorder}`,
                fontSize: '0.88rem',
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
              <p style={{ margin: '6px 0', color: resultAccentColor }}>
                <strong>{lang === 'vi' ? 'Bước hành động tiếp theo:' : 'Next Action Step:'}</strong>{' '}
                {lang === 'vi' ? toolExecutionResult.nextMicroStepVi : toolExecutionResult.nextMicroStepEn}
              </p>
              {toolExecutionResult.bipolarSafetyNoteVi && (
                <p style={{ margin: '6px 0 0 0', color: theme.palette.sosBanner, fontWeight: 600 }}>
                  {lang === 'vi'
                    ? toolExecutionResult.bipolarSafetyNoteVi
                    : toolExecutionResult.bipolarSafetyNoteEn}
                </p>
              )}
            </div>
          </section>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
            {/* 2. TEAM-CBT Pleasure-Predicting & Mastery/Pleasure (M/P) Sheet */}
            {(activeToolkitSubTab === 'mp-sheet' || activeToolkitSubTab === 'all') && (
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
            )}

            {/* 3. David Burns Anti-Procrastination 5-Minute Sheet */}
            {(activeToolkitSubTab === 'anti-procrastination' || activeToolkitSubTab === 'all') && (
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
            )}

            {/* 4. Uncovering 23 Self-Defeating Beliefs (Downward Arrow + Cost-Benefit Analysis) */}
            {(activeToolkitSubTab === 'downward-arrow' || activeToolkitSubTab === 'all') && (
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
            )}

            {/* 5. DBT ABC PLEASE Daily Resilience Tracker + ACCEPTS & 5-Senses Self-Soothe */}
            {(activeToolkitSubTab === 'abc-please' || activeToolkitSubTab === 'all') && (
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
            )}

            {/* 6. CBT-I Sleep Diary & Sleep Efficiency Calculator with Bipolar Mania Contraindication Guard */}
            {(activeToolkitSubTab === 'cbti-sleep' || activeToolkitSubTab === 'all') && (
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
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: cbtiEvaluation.sleepRestrictionContraindicatedByManiaGuard
                    ? warnAlertBg
                    : calmAlertBg,
                  color: cbtiEvaluation.sleepRestrictionContraindicatedByManiaGuard
                    ? warnAlertText
                    : calmAlertText,
                  fontSize: '0.86rem',
                }}
              >
                {lang === 'vi' ? cbtiEvaluation.guidanceVi : cbtiEvaluation.guidanceEn}
              </div>
            </section>
            )}
          </div>
        </main>
      )}

      {/* TAB 6: GROUNDED AI COMPANION, VOICE MOOD STUDIO & BASELINE HRV CONTEXT (Clean 1-Card-Per-View) */}
      {(activeTab === 'ai-companion-biometrics' || activeTab === 'phase3-ai-biometrics-voice') && (
        <main style={{ maxWidth: '940px', margin: '0 auto', padding: '0 16px' }}>
          <SanctuaryHeroBanner
            scene="sunrise-hills"
            isDark={theme.mode === 'low-stimulus-mania'}
            title={
              lang === 'vi'
                ? 'Người Bạn Đồng Hành Trí Tuệ AI & Nhịp Sinh Trắc'
                : 'Empathetic AI Companion & Biometric Harmony'
            }
            subtitle={
              lang === 'vi'
                ? 'Trò chuyện thấu cảm dựa trên y học thực chứng, lắng nghe nhịp giọng nói và theo dõi độ biến thiên nhịp tim HRV.'
                : 'Evidence-grounded empathetic dialogue, voice tone reflection, and baseline-relative HRV insights.'
            }
          />

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
            {(
              [
                ['ai-chat', '🤖', lang === 'vi' ? '1. Trò chuyện cùng Trợ lý AI' : '1. Chat with AI Companion'],
                ['voice-palette', '🎙️', lang === 'vi' ? '2. Phân tích Nhịp nói & Bảng màu' : '2. Voice Tone & Mood-Palette'],
                ['hrv-memory', '💓', lang === 'vi' ? '3. Sinh trắc HRV & Bộ nhớ' : '3. Wearable HRV & Memory'],
              ] as const
            ).map(([subId, icon, label]) => (
              <button
                key={subId}
                type="button"
                onClick={() => setTab6SubView(subId)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  border: tab6SubView === subId ? `2px solid ${theme.palette.primary}` : `1px solid ${theme.palette.border}`,
                  backgroundColor: tab6SubView === subId ? theme.palette.surface : 'transparent',
                  color: tab6SubView === subId ? theme.palette.primary : theme.palette.textSecondary,
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                }}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          <div>
            {/* 1. Grounded AI Companion */}
            {tab6SubView === 'ai-chat' && (
            <section
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                {lang === 'vi'
                  ? 'Trò Chuyện Cùng Người Bạn Đồng Hành AI'
                  : 'Grounded AI Companion Dialogue'}
              </h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {(
                  [
                    ['offline-deterministic', lang === 'vi' ? 'Chế độ Nhanh Cục Bộ' : 'Offline Deterministic'],
                    ['local-ollama', lang === 'vi' ? 'Mô Hình Cục Bộ Ollama' : 'Local Ollama'],
                    ['cloud-serverless-rag', lang === 'vi' ? 'Đám Mây Bảo Mật' : 'Cloud RAG'],
                  ] as const
                ).map(([provId, label]) => (
                  <button
                    key={provId}
                    type="button"
                    onClick={() => setPhase3Provider(provId)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${theme.palette.border}`,
                      backgroundColor: phase3Provider === provId ? theme.palette.primary : 'transparent',
                      color: phase3Provider === provId ? '#fff' : theme.palette.textPrimary,
                      cursor: 'pointer',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {phase3Provider === 'local-ollama' && (
                <div style={{ marginBottom: '10px', fontSize: '0.85rem' }}>
                  <label>
                    {lang === 'vi' ? 'Mô hình Ollama cục bộ:' : 'Local Ollama Model:'}{' '}
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
                rows={3}
                value={phase3ChatInput}
                onChange={(e) => setPhase3ChatInput((e.target as HTMLTextAreaElement).value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', marginBottom: '10px' }}
              />
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <button
                  type="button"
                  onClick={() => void handleSendPhase3GroundedChat()}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '10px',
                    backgroundColor: theme.palette.primary,
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {lang === 'vi' ? 'Gửi Tin Nhắn Tâm Sự' : 'Send Message'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPhase3ChatInput(lang === 'vi' ? 'Công thức nấu phở bò ngon nhất là gì?' : 'What is the best beef pho recipe?')
                  }
                  style={{ padding: '8px 12px', borderRadius: '10px', border: `1px solid ${theme.palette.border}`, backgroundColor: 'transparent', cursor: 'pointer', fontSize: '0.84rem' }}
                >
                  {lang === 'vi' ? 'Thử Câu Hỏi Ngoài Phạm Vi Tâm Lý' : 'Test Out-of-Scope Query'}
                </button>
              </div>

              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '14px',
                  backgroundColor: resultSurfaceBg,
                  color: resultSurfaceText,
                  border: `1px solid ${resultSurfaceBorder}`,
                  fontSize: '0.9rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                  <strong>
                    {lang === 'vi' ? 'Phản hồi từ Người bạn Đồng hành AI:' : 'AI Companion Response:'}
                  </strong>
                  <span
                    style={{
                      padding: '2px 10px',
                      borderRadius: '8px',
                      backgroundColor: phase3LastAbstained ? '#b45309' : theme.palette.accent,
                      color: '#fff',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                    }}
                  >
                    {phase3LastAbstained
                      ? (lang === 'vi' ? 'Ngoài phạm vi hỗ trợ tâm lý' : 'Out of Clinical Scope')
                      : (lang === 'vi' ? 'Đạt chuẩn Y học Thực chứng' : 'Evidence-Grounded')}
                  </span>
                </div>
                <p style={{ margin: 0, lineHeight: 1.6 }}>{phase3LastReply}</p>
              </div>
            </section>
            )}

            {/* 3. Multimodal Audio "Burst" Journal & 5-Swatch Mood-Palette Studio */}
            {tab6SubView === 'voice-palette' && (
            <section
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                {lang === 'vi'
                  ? 'Phân Tích Nhịp Nói & Bảng Màu Cảm Xúc 5 Sắc Thái'
                  : 'Voice Speaking Rate & 5-Swatch Mood-Palette'}
              </h3>
              <textarea
                rows={3}
                value={vbStudioTranscript}
                onChange={(e) => setVbStudioTranscript((e.target as HTMLTextAreaElement).value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', marginBottom: '10px' }}
              />
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.88rem', marginBottom: '12px' }}>
                <label>
                  {lang === 'vi' ? 'Thời lượng chia sẻ (giây):' : 'Audio Duration (seconds):'}{' '}
                  <input
                    type="number"
                    min={3}
                    max={120}
                    value={vbStudioDurationSec}
                    onChange={(e) => setVbStudioDurationSec(Number((e.target as HTMLInputElement).value))}
                    style={{ width: '65px' }}
                  />
                </label>
                <label>
                  {lang === 'vi' ? 'Tốc độ nói trung bình của bạn (từ/phút):' : 'Your Baseline Rate (WPM):'}{' '}
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
                  padding: '12px 14px',
                  borderRadius: '10px',
                  backgroundColor: phase3VoiceBurstEval.bipolarPressuredSpeechAlert ? warnAlertBg : calmAlertBg,
                  color: phase3VoiceBurstEval.bipolarPressuredSpeechAlert ? warnAlertText : calmAlertText,
                  fontSize: '0.88rem',
                  marginBottom: '12px',
                }}
              >
                <strong>
                  {lang === 'vi'
                    ? `Tốc độ nói hiện tại: ${phase3VoiceBurstEval.wordsPerMinute} từ/phút`
                    : `Current Speaking Rate: ${phase3VoiceBurstEval.wordsPerMinute} WPM`}
                </strong>
                <p style={{ margin: '4px 0 0 0' }}>
                  {lang === 'vi'
                    ? phase3VoiceBurstEval.pressuredSpeechBannerVi
                    : phase3VoiceBurstEval.pressuredSpeechBannerEn}
                </p>
              </div>

              {/* 5-Swatch Mood Palette Visual Card */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '14px',
                  background: phase3VoiceBurstEval.moodPalette.gradientCss,
                  color: '#1e293b',
                }}
              >
                <strong>
                  {lang === 'vi'
                    ? phase3VoiceBurstEval.moodPalette.titleVi
                    : phase3VoiceBurstEval.moodPalette.titleEn}
                </strong>
                <div style={{ display: 'flex', gap: '8px', margin: '8px 0', flexWrap: 'wrap' }}>
                  {phase3VoiceBurstEval.moodPalette.fiveSwatches.map((hex) => (
                    <span
                      key={hex}
                      style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: hex,
                        color: '#ffffff',
                        border: '1px solid rgba(255,255,255,0.6)',
                        fontSize: '0.76rem',
                        fontFamily: 'monospace',
                      }}
                    >
                      {hex}
                    </span>
                  ))}
                </div>
              </div>
            </section>
            )}

            {/* 4. Baseline-Relative HRV & Rolling Memory combined in 1 clean view */}
            {tab6SubView === 'hrv-memory' && (
            <section
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                {lang === 'vi'
                  ? 'Đồng Bộ Thiết Bị Đeo HRV & Quản Lý Bộ Nhớ Trò Chuyện'
                  : 'Wearable HRV Context & Conversation Memory Privacy'}
              </h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.88rem', marginBottom: '12px' }}>
                <label>
                  {lang === 'vi' ? 'Thiết bị đeo:' : 'Wearable Source:'}{' '}
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
                  {lang === 'vi' ? `Chỉ số HRV (${phase3HrvEval.metricUnit}):` : `Latest HRV (${phase3HrvEval.metricUnit}):`}{' '}
                  <input
                    type="number"
                    min={15}
                    max={140}
                    value={hrvLatestMs}
                    onChange={(e) => setHrvLatestMs(Number((e.target as HTMLInputElement).value))}
                    style={{ width: '65px' }}
                  />
                </label>
              </div>

              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '14px',
                  backgroundColor: resultSurfaceBg,
                  color: resultSurfaceText,
                  border: `1px solid ${resultSurfaceBorder}`,
                  fontSize: '0.88rem',
                  marginBottom: '16px',
                }}
              >
                <p style={{ margin: '0 0 6px 0' }}>
                  {lang === 'vi'
                    ? phase3HrvEval.gentleCheckInMentionVi
                    : phase3HrvEval.gentleCheckInMentionEn}
                </p>
                <div style={{ fontSize: '0.82rem', color: theme.palette.textSecondary }}>
                  {lang === 'vi'
                    ? `Khoảng bình thường của bạn (P25–P75): ${phase3HrvEval.p25Ms ?? 'N/A'} – ${phase3HrvEval.p75Ms ?? 'N/A'} ${phase3HrvEval.metricUnit}`
                    : `Your 14–30 Day Baseline (P25–P75): ${phase3HrvEval.p25Ms ?? 'N/A'} – ${phase3HrvEval.p75Ms ?? 'N/A'} ${phase3HrvEval.metricUnit}`}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingTop: '12px', borderTop: `1px solid ${theme.palette.border}` }}>
                <div>
                  <strong style={{ fontSize: '0.9rem' }}>
                    {lang === 'vi' ? 'Quyền riêng tư bộ nhớ hội thoại:' : 'Conversation Memory Privacy:'}
                  </strong>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: theme.palette.textSecondary }}>
                    {phase3Memory.rollingSummary}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleErasePhase3Memory}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '10px',
                    backgroundColor: theme.palette.sosBanner,
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                  }}
                >
                  {lang === 'vi' ? 'Xóa Bộ Nhớ Hội Thoại' : 'Clear Conversation Memory'}
                </button>
              </div>
            </section>
            )}
          </div>
        </main>
      )}

      {/* TAB 7: ACCOUNT SANCTUARY, DOCTOR SHARE LINK & E2EE RECOVERY KEY (Clean 1-Card-Per-View) */}
      {(activeTab === 'account-privacy-vault' || activeTab === 'phase4-e2ee-clinician-qa') && (
        <main style={{ maxWidth: '940px', margin: '0 auto', padding: '0 16px' }}>
          <SanctuaryHeroBanner
            scene="care-notebook"
            isDark={theme.mode === 'low-stimulus-mania'}
            title={
              lang === 'vi'
                ? 'Hồ Sơ Cá Nhân, Quyền Riêng Tư & Kết Nối Bác Sĩ'
                : 'Your Personal Profile, Privacy & Doctor Connection'
            }
            subtitle={
              lang === 'vi'
                ? 'Quản lý thông tin người thân hỗ trợ, chia sẻ báo cáo mã hóa cho bác sĩ và lưu khóa khôi phục dữ liệu.'
                : 'Manage your support contacts, share encrypted summaries with your clinician, and safeguard your recovery key.'
            }
          />

          <div className="no-print" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
            {(
              [
                ['profile', '👤', lang === 'vi' ? '1. Hồ sơ & Người thân Hỗ trợ' : '1. Profile & Support Contact'],
                ['doctor-link', '🩺', lang === 'vi' ? '2. Chia sẻ Báo cáo cho Bác sĩ' : '2. Share Report with Doctor'],
                ['recovery-key', '🔐', lang === 'vi' ? '3. Khóa Khôi phục 24 từ & Bảo mật' : '3. 24-Word Key & Security'],
              ] as const
            ).map(([subId, icon, label]) => (
              <button
                key={subId}
                type="button"
                onClick={() => setTab7SubView(subId)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  border: tab7SubView === subId ? `2px solid ${theme.palette.primary}` : `1px solid ${theme.palette.border}`,
                  backgroundColor: tab7SubView === subId ? theme.palette.surface : 'transparent',
                  color: tab7SubView === subId ? theme.palette.primary : theme.palette.textSecondary,
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                }}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          {/* VIEW 1: Clean Personal Profile Card (No duplicate login form!) */}
          {tab7SubView === 'profile' && (
          <section
            className="no-print"
            style={{
              padding: '20px',
              borderRadius: '16px',
              backgroundColor: theme.palette.surface,
              border: `1px solid ${theme.palette.border}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    backgroundColor: accountSession?.user.avatarMoodColor || theme.palette.primary,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.4rem',
                    fontWeight: 700,
                  }}
                >
                  {accountSession?.user.displayName ? accountSession.user.displayName.charAt(0).toUpperCase() : '👤'}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem' }}>
                    {accountSession?.user.displayName}
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: theme.palette.textSecondary }}>
                    {accountSession?.user.email}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
                  {lang === 'vi' ? '🔄 Đồng bộ Dữ liệu' : '🔄 Sync Data'}
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'transparent',
                    color: theme.palette.textSecondary,
                    border: `1px solid ${theme.palette.border}`,
                    cursor: 'pointer',
                  }}
                >
                  {lang === 'vi' ? 'Đăng xuất' : 'Sign Out'}
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <label style={{ fontSize: '0.88rem' }}>
                {lang === 'vi' ? 'Tên gọi của bạn:' : 'Display Name:'}
                <input
                  type="text"
                  value={profileFormName}
                  onChange={(e) => setProfileFormName((e.target as HTMLInputElement).value)}
                  className="sanctuary-input"
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </label>
              <label style={{ fontSize: '0.88rem' }}>
                {lang === 'vi' ? 'Người thân hỗ trợ khi cần:' : 'Emergency Support Contact:'}
                <input
                  type="text"
                  value={profileEmergencyName}
                  onChange={(e) => setProfileEmergencyName((e.target as HTMLInputElement).value)}
                  className="sanctuary-input"
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </label>
              <label style={{ fontSize: '0.88rem' }}>
                {lang === 'vi' ? 'Số điện thoại người thân:' : 'Support Contact Phone:'}
                <input
                  type="text"
                  value={profileEmergencyPhone}
                  onChange={(e) => setProfileEmergencyPhone((e.target as HTMLInputElement).value)}
                  className="sanctuary-input"
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </label>
            </div>

            <button
              type="button"
              onClick={handleSaveProfile}
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                backgroundColor: theme.palette.primary,
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {lang === 'vi' ? 'Lưu Thông Tin Hồ Sơ' : 'Save Profile Changes'}
            </button>
          </section>
          )}

          {/* VIEW 2: Clinician Share Link */}
          {tab7SubView === 'doctor-link' && (
            <section
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                {lang === 'vi'
                  ? 'Chia Sẻ Báo Cáo Riêng Tư Cho Bác Sĩ Điều Trị'
                  : 'Private Doctor Report Sharing'}
              </h3>
              <div
                className="no-print"
                style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.88rem', marginBottom: '12px' }}
              >
                <label>
                  {lang === 'vi' ? 'Chu kỳ báo cáo:' : 'Report Period:'}{' '}
                  <select
                    value={sharePeriodDays}
                    onChange={(e) => setSharePeriodDays(Number((e.target as HTMLSelectElement).value) as 30 | 90)}
                  >
                    <option value={30}>{lang === 'vi' ? '30 Ngày gần nhất' : 'Last 30 Days'}</option>
                    <option value={90}>{lang === 'vi' ? '90 Ngày gần nhất' : 'Last 90 Days'}</option>
                  </select>
                </label>
                <label>
                  {lang === 'vi' ? 'Thời hạn hiệu lực:' : 'Link Expiry:'}{' '}
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

              <div className="no-print" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <button
                  type="button"
                  onClick={() => void handleCreateAndDecryptClinicianShare()}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '10px',
                    backgroundColor: theme.palette.primary,
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {lang === 'vi'
                    ? 'Tạo Liên Kết Chia Sẻ Bác Sĩ'
                    : 'Create Private Doctor Link'}
                </button>
                {clinicianSharePkg && !clinicianSharePkg.serverSnapshot.revoked && (
                  <button
                    type="button"
                    onClick={() => void handleRevokeClinicianShare()}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '10px',
                      backgroundColor: theme.palette.sosBanner,
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {lang === 'vi' ? 'Thu Hồi Liên Kết' : 'Revoke Link'}
                  </button>
                )}
              </div>

              {clinicianSharePkg && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    backgroundColor: resultSurfaceBg,
                    color: resultSurfaceText,
                    border: `1px solid ${resultSurfaceBorder}`,
                    fontSize: '0.85rem',
                  }}
                >
                  <div style={{ wordBreak: 'break-all', color: resultAccentColor, fontFamily: 'monospace', fontWeight: 600 }}>
                    {clinicianSharePkg.fullShareUrlWithFragment}
                  </div>
                  {clinicianDecryptedView?.status === 'decrypted' && clinicianDecryptedView.report && (
                    <div style={{ marginTop: '6px', color: theme.palette.accent, fontWeight: 600 }}>
                      {lang === 'vi'
                        ? `Báo cáo ${clinicianDecryptedView.report.periodDays} ngày đã sẵn sàng • Độ ổn định nhịp sinh học: ${clinicianDecryptedView.report.ipsrtAverageStabilityPercent}%`
                        : `${clinicianDecryptedView.report.periodDays}-day report ready • IPSRT Stability: ${clinicianDecryptedView.report.ipsrtAverageStabilityPercent}%`}
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* VIEW 3: 24-Word Recovery Key & Security Certificate */}
          {tab7SubView === 'recovery-key' && (
            <section
              className="no-print"
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: theme.palette.surface,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                {lang === 'vi'
                  ? 'Khóa Khôi Phục Bí Mật 24 Từ & Đồng Bộ Đa Thiết Bị'
                  : '24-Word Master Recovery Key & Encrypted Sync'}
              </h3>
              <button
                type="button"
                onClick={() => void handleGenerate24WordKeyAndRunCrdtSync()}
                style={{
                  padding: '9px 16px',
                  borderRadius: '10px',
                  backgroundColor: theme.palette.primary,
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginBottom: '12px',
                }}
              >
                {lang === 'vi'
                  ? 'Tạo Cụm 24 Từ Khôi Phục & Kiểm Tra Đồng Bộ'
                  : 'Generate 24-Word Key & Verify Sync'}
              </button>

              {masterKey24 && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    backgroundColor: resultSurfaceBg,
                    color: resultSurfaceText,
                    border: `1px solid ${resultSurfaceBorder}`,
                    fontSize: '0.85rem',
                    marginBottom: '12px',
                    fontFamily: 'monospace',
                  }}
                >
                  {masterKey24.words.map((w, idx) => `${idx + 1}.${w}`).join(' ')}
                </div>
              )}

              <p style={{ margin: 0, fontSize: '0.86rem', color: theme.palette.textSecondary }}>
                {crdtDecryptedSampleText}
              </p>
            </section>
          )}
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
        </>
      )}
    </div>
  );
}
