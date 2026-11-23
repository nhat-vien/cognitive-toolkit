import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  // Schemas & Validators
  validateDailyMoodAndRhythmLog,
  validateUlyssesContract,
  validateUserClinicalProfile,
  validateExposureHierarchyItem,
  determineAdaptiveUiThemeMode,
  // Detectors & 4-Layer Safety
  detectNegativeDistortions,
  detectPositiveDistortions,
  detectSelfDefeatingBeliefs,
  detectSafetyBehaviors,
  evaluateFourLayerSafety,
  verifyLayer4OutputGuardrail,
  NEGATIVE_DISTORTION_DEFINITIONS,
  POSITIVE_DISTORTION_DEFINITIONS,
  SELF_DEFEATING_BELIEFS,
  // Session State Machine & Pushback
  ClinicalSessionEngine,
  evaluateSocraticPushback,
  recommendTechniqueByArousalAndPolarity,
  evaluateTippMedicalExclusionScreen,
  evaluateThoughtRecordAccuracyCheck,
  evaluateBehavioralActivationRestCheck,
  evaluateWiseMindHarshSelfCriticGuard,
  evaluateChainAnalysisSafeguards,
  exportSessionToMarkdown,
  // Assessments
  scoreBriefMoodSurvey,
  scorePhq9,
  scoreGad7,
  scoreAsrm,
  scoreMdq,
  scoreIsi,
  // Bipolar & IPSRT Engine
  calculateIpsrtStabilityScore,
  evaluateBipolarProdromeAndMixedState,
  createImpulseVaultEntry,
  evaluateImpulseVaultStatus,
  evaluateBaselineRelativeHrv,
  // Phase 2: 36 Interactive CBT, TEAM-CBT, DBT & Bipolar Toolkit
  CBT_36_TOOLS_CATALOG,
  getCbt36ToolBySlugOrId,
  runInteractiveToolkitExercise,
  calculateCbtiSleepEfficiency,
  evaluateDbtAbcPleaseAndAccepts,
  // Phase 3: 2-Tier Memory Manager & Audio Burst Multimodal Analyzer
  RECENT_MESSAGE_WINDOW,
  ROLLING_SUMMARY_INTERVAL,
  TwoTierClinicalMemoryManager,
  extractStructuredProfileFacts,
  inspectMemoryState,
  eraseDerivedMemoryOnly,
  eraseAllTranscriptsAndMemory,
  analyzeAudioBurstJournal,
  // Phase 4: Zero-Knowledge E2EE 24-Word Key, CRDT Conflict Resolver, Clinician Share & 105-Case Red-Team Suite
  generate24WordRecoveryPhrase,
  deriveMasterKeyFingerprintFromPhrase,
  resolveE2eeSyncConflicts,
  createClinicianShareSnapshotLink,
  verifyClinicianShareLinkExpiry,
  ADVERSARIAL_RED_TEAM_PROMPTS,
  runAdversarialRedTeamAudit,
  verifyZeroTelemetryPrivacyCompliance,
  // Master Plan Governance, Safety Subsystem & 68-Protocol Catalog
  MASTER_PROTOCOL_CATALOG,
  INSTRUMENT_GOVERNANCE_REGISTRY,
  createProvenancedValue,
  validateSeparatedClinicalPathwayRecord,
  validateProtocolManifest,
  resolveInProgressSessionOnProtocolUpdate,
  evaluateEmergencyDirectoryStatus,
  validatePersonalSafetyPlan,
  evaluateMasterPlanSafetySubsystem,
  scoreWho5WellBeing,
  evaluateMedicationSupportAction,
  evaluateMultiSignalBipolarPrecautions,
  createGranularCaregiverAccessGrant,
  revokeCaregiverAccessGrant,
  buildUserControlledReportWithRedaction,
} from '../src/index.ts';

describe('1. Catalog Completeness & Schema Validation', () => {
  it('contains all 11 Burns Negative Distortions, 5 Bipolar Positive Distortions, and 23 Self-Defeating Beliefs', () => {
    assert.equal(NEGATIVE_DISTORTION_DEFINITIONS.length, 11);
    assert.equal(POSITIVE_DISTORTION_DEFINITIONS.length, 5);
    assert.equal(SELF_DEFEATING_BELIEFS.length, 23);
  });

  it('validates DailyMoodAndRhythmLog and automatically computes mixedStateAlertTriggered when Mood <= -2 and Energy >= +2', () => {
    const validLog = validateDailyMoodAndRhythmLog({
      id: 'log-001',
      userId: 'user-123',
      loggedAt: '2026-11-21T08:00:00Z',
      moodPolarity: -3,
      energyLevel: 3,
      irritabilityIntensity: 8,
      anxietyIntensity: 7,
      sleepDurationHours: 4.5,
      sleepQuality: 2,
      feltNeedForSleep: 'reduced_need',
      ipsrtAnchors: {
        outOfBedTime: '06:30',
        firstSocialContactTime: '08:00',
        workOrStudyStartTime: '08:30',
        dinnerTime: '19:00',
        bedTime: '23:30',
      },
      medicationsTaken: [
        { medicationId: 'med-1', name: 'Lithium', dosage: '600mg', takenAt: '08:00' },
      ],
    });

    assert.equal(validLog.valid, true);
    assert.equal(validLog.data?.mixedStateAlertTriggered, true);
  });

  it('enforces UlyssesContract authorship while euthymic (moodPolarity between -1 and +1)', () => {
    const manicContract = validateUlyssesContract({
      enabled: true,
      createdAtWhileEuthymic: '2026-11-21T08:00:00Z',
      moodPolarityAtCreation: 4, // Invalid: authored while manic!
      personalManiaProdromes: ['Ngủ dưới 4 tiếng'],
      personalDepressionProdromes: ['Không ra khỏi giường'],
    });
    assert.equal(manicContract.valid, false);

    const euthymicContract = validateUlyssesContract({
      enabled: true,
      createdAtWhileEuthymic: '2026-11-21T08:00:00Z',
      moodPolarityAtCreation: 0,
      personalManiaProdromes: ['Ngủ dưới 4 tiếng', 'Mua sắm lúc 2h sáng'],
      personalDepressionProdromes: ['Bỏ bữa sáng 3 ngày'],
    });
    assert.equal(euthymicContract.valid, true);
  });

  it('requires medicalScreenClearedForInteroceptive === true for interoceptive exposure items', () => {
    const blocked = validateExposureHierarchyItem({
      id: 'exp-1',
      userId: 'u-1',
      fearedSituationOrSensation: 'Spinning in chair for 30s to induce dizziness',
      exposureKind: 'interoceptive',
      baselineSuds: 75,
      medicalScreenClearedForInteroceptive: false,
    });
    assert.equal(blocked.valid, false);

    const allowed = validateExposureHierarchyItem({
      id: 'exp-1',
      userId: 'u-1',
      fearedSituationOrSensation: 'Spinning in chair for 30s to induce dizziness',
      exposureKind: 'interoceptive',
      baselineSuds: 75,
      medicalScreenClearedForInteroceptive: true,
    });
    assert.equal(allowed.valid, true);
  });

  it('validates UserClinicalProfile and Adaptive UI Theme switching', () => {
    const profileRes = validateUserClinicalProfile({
      id: 'u-1',
      displayName: 'Minh An',
      preferredLanguage: 'vi',
      defaultPushbackLevel: 'moderate',
      scheduledWorryWindowTime: '17:30',
    });
    assert.equal(profileRes.valid, true);

    assert.equal(determineAdaptiveUiThemeMode({ preIntensity: 9 }), 'sos-crisis');
    assert.equal(determineAdaptiveUiThemeMode({ moodPolarity: -3, energyLevel: 3 }), 'sos-crisis');
    assert.equal(determineAdaptiveUiThemeMode({ moodPolarity: 3 }), 'low-stimulus-mania');
    assert.equal(determineAdaptiveUiThemeMode({ asrmScore: 7 }), 'low-stimulus-mania');
    assert.equal(determineAdaptiveUiThemeMode({ moodPolarity: -4 }), 'low-energy-depression');
    assert.equal(determineAdaptiveUiThemeMode({ moodPolarity: 0, preIntensity: 4 }), 'standard');
  });
});

describe('2. Deterministic Bilingual Pattern Detector & 4-Layer Safety Gate', () => {
  it('detects Vietnamese and English negative distortions, positive distortions, SDBs, and safety behaviors in 0ms', () => {
    const negVi = detectNegativeDistortions(
      'Tôi luôn luôn làm hỏng hết cả, tôi là kẻ thất bại và chắc chắn họ đang nghĩ tôi vô dụng.',
    );
    const negIds = negVi.map((d) => d.id);
    assert.ok(negIds.includes('overgeneralization'));
    assert.ok(negIds.includes('all-or-nothing'));
    assert.ok(negIds.includes('labeling'));
    assert.ok(negIds.includes('mind-reading'));

    const posVi = detectPositiveDistortions(
      'Tôi mới nghĩ ra ý tưởng thiên tài kiếm hàng tỷ qua đêm, rủi ro bằng không, phải mua ngay lập tức lúc 2 giờ sáng và tôi không cần ngủ nữa!',
    );
    const posIds = posVi.map((d) => d.id);
    assert.ok(posIds.includes('grandiosity'));
    assert.ok(posIds.includes('invulnerability'));
    assert.ok(posIds.includes('impulse-justification'));
    assert.ok(posIds.includes('magical-energy'));

    const sdbEn = detectSelfDefeatingBeliefs(
      'I need everyone’s approval and I must never make a mistake because worrying keeps my family safe.',
    );
    const sdbIds = sdbEn.map((d) => d.id);
    assert.ok(sdbIds.includes('approval-addiction'));
    assert.ok(sdbIds.includes('performance-perfectionism'));
    assert.ok(sdbIds.includes('magical-thinking-worry'));

    const sbVi = detectSafetyBehaviors(
      'Tôi đo nhịp tim liên tục và chỉ dám ngồi gần cửa ra vào khi đi họp.',
    );
    const sbIds = sbVi.map((d) => d.id);
    assert.ok(sbIds.includes('compulsive-checking-googling'));
    assert.ok(sbIds.includes('escape-exit-guarding'));
  });

  it('triggers Layer 1 & 2 safety-stop on suicidal/self-harm intent or BMS Suicide >= 1', () => {
    const layer1Vi = evaluateFourLayerSafety({
      text: 'Tôi mệt mỏi quá rồi, chỉ muốn chết đi cho xong và tự làm đau bản thân.',
      preIntensity: 9,
    });
    assert.equal(layer1Vi.safeToProceedWithCbt, false);
    assert.equal(layer1Vi.recommendedOutcome, 'safety-stop');
    assert.equal(layer1Vi.pushbackOverride, 'off');
    assert.ok(layer1Vi.hotlines.length > 0);

    const layer2Bms = evaluateFourLayerSafety({
      text: 'Hôm nay tôi thấy buồn.',
      bmsSuicidalScore: 2,
    });
    assert.equal(layer2Bms.recommendedOutcome, 'safety-stop');
  });

  it('triggers Layer 3 justified-exit on domestic violence / real-world danger without treating fear as a distortion', () => {
    const dangerEval = evaluateFourLayerSafety({
      text: 'Chồng tôi đang đánh đập tôi và dọa giết tôi, tôi rất sợ.',
      preIntensity: 9,
    });
    assert.equal(dangerEval.safeToProceedWithCbt, false);
    assert.equal(dangerEval.triggeredLayer, 3);
    assert.equal(dangerEval.recommendedOutcome, 'justified-exit');
    assert.equal(dangerEval.pushbackOverride, 'off');
  });

  it('routes acute distress (>= 8/10) or Bipolar Mixed State directly to DBT TIPP', () => {
    const panicEval = evaluateFourLayerSafety({
      text: 'Tim tôi đập nhanh quá, tôi đang hoảng loạn.',
      preIntensity: 9,
    });
    assert.equal(panicEval.recommendedTechnique, 'tipp');
    assert.equal(panicEval.pushbackOverride, 'off');

    const mixedEval = evaluateFourLayerSafety({
      text: 'Tôi thấy tuyệt vọng nhưng đầu óc cứ chạy loạn xạ không nằm yên được.',
      preIntensity: 5,
      moodPolarity: -3,
      energyLevel: 3,
    });
    assert.equal(mixedEval.recommendedTechnique, 'tipp');
  });

  it('blocks unauthorized medication dosage advice in Layer 4 Output Guardrail', () => {
    const unsafeOutput = verifyLayer4OutputGuardrail(
      'Bạn nên tự ý tăng liều thuốc Lithium lên gấp đôi tối nay.',
    );
    assert.equal(unsafeOutput.allowed, false);
  });
});

describe('3. Session State Machine, Socratic Pushback Matrix & Clinical Safeguards', () => {
  it('enforces 4-level Socratic Pushback across Supportive, Core, and Closing zones', () => {
    // Closing zone or Safety Gate -> always 0 retries even when configured level is firm
    const closingEval = evaluateSocraticPushback({
      configuredLevel: 'firm',
      zone: 'Closing',
      currentRetryCount: 0,
      userInput: 'skip',
    });
    assert.equal(closingEval.shouldPushBack, false);
    assert.equal(closingEval.maxAllowedRetries, 0);

    // Supportive zone -> max 1 retry even when configured level is firm
    const supportiveRetry1 = evaluateSocraticPushback({
      configuredLevel: 'firm',
      zone: 'Supportive',
      currentRetryCount: 0,
      userInput: 'skip',
    });
    assert.equal(supportiveRetry1.shouldPushBack, true);
    assert.equal(supportiveRetry1.maxAllowedRetries, 1);

    const supportiveRetry2 = evaluateSocraticPushback({
      configuredLevel: 'firm',
      zone: 'Supportive',
      currentRetryCount: 1,
      userInput: 'skip',
    });
    assert.equal(supportiveRetry2.shouldPushBack, false);

    // Core zone at moderate -> max 2 retries (Attempt 2 uses TEAM-CBT Double-Standard)
    const coreAttempt2 = evaluateSocraticPushback({
      configuredLevel: 'moderate',
      zone: 'Core',
      currentRetryCount: 1,
      userInput: 'không biết',
    });
    assert.equal(coreAttempt2.shouldPushBack, true);
    assert.ok(coreAttempt2.promptVi?.includes('Tiêu chuẩn kép'));

    const coreAttempt3Concede = evaluateSocraticPushback({
      configuredLevel: 'moderate',
      zone: 'Core',
      currentRetryCount: 2,
      userInput: 'không biết',
    });
    assert.equal(coreAttempt3Concede.shouldPushBack, false);
  });

  it('enforces TIPP Mandatory Medical Exclusion Screen before Cold Water', () => {
    const blockedBetaBlocker = evaluateTippMedicalExclusionScreen({
      takesBetaBlockers: true,
    });
    assert.equal(blockedBetaBlocker.coldWaterAllowed, false);
    assert.equal(blockedBetaBlocker.fallbackSkill, 'paced-breathing');

    const blockedUnsure = evaluateTippMedicalExclusionScreen({
      isUnsure: true,
    });
    assert.equal(blockedUnsure.coldWaterAllowed, false);

    const cleared = evaluateTippMedicalExclusionScreen({
      hasHeartCondition: false,
      takesBetaBlockers: false,
      isUnsure: false,
    });
    assert.equal(cleared.coldWaterAllowed, true);
  });

  it('executes Thought Record with Accuracy Check exit (outcome: accurate-thought-exit)', () => {
    const engine = new ClinicalSessionEngine({
      id: 'sess-tr-1',
      technique: 'thought-record',
      preIntensity: 6,
      pushbackLevel: 'moderate',
      date: '2026-11-21',
      time: '09:30',
    });

    const checkIn = engine.performCheckInAndRoute({
      checkInText: 'Công ty vừa thông báo cắt giảm nhân sự sáng nay.',
      requestedTechnique: 'thought-record',
    });
    assert.equal(checkIn.phase, 'Phase3_GuidedProtocol');

    // Steps 1 to 5
    engine.submitProtocolStep({ userInput: 'Nhận email thông báo cắt giảm 20% nhân sự lúc 9h sáng.' });
    engine.submitProtocolStep({ userInput: 'Mình thực sự đã bị mất việc trong đợt cắt giảm này (100%).' });
    engine.submitProtocolStep({ userInput: 'Buồn bã và Lo âu 6/10.' });
    engine.submitProtocolStep({ userInput: 'Mình đã ký biên bản bàn giao công việc với phòng nhân sự.' });
    engine.submitProtocolStep({ userInput: 'Mình vẫn còn 3 tháng lương dự phòng và kinh nghiệm 5 năm.' });

    // Step 6: Accuracy Check triggered because job loss is an objective fact!
    const step6 = engine.submitProtocolStep({
      userInput: 'Việc mất việc là sự thật khách quan 100%, mình muốn chuyển sang lập kế hoạch giải quyết vấn đề.',
      isObjectivelyAccurateFact: true,
    });
    assert.equal(step6.phase, 'Phase4_Close');
    assert.equal(step6.outcome, 'accurate-thought-exit');
    assert.equal(engine.session.pushbackLevel, 'off');

    const closed = engine.closeSession({
      postIntensity: 4,
      takeaway: 'Tập trung cập nhật CV và nghỉ ngơi tối nay thay vì ép mình suy nghĩ tích cực giả tạo.',
    });
    assert.equal(closed.filename, '20261121-thought-record-01.md');
    assert.ok(closed.markdownContent.includes('outcome: accurate-thought-exit'));
  });

  it('executes Behavioral Activation Mandatory Rest Check (outcome: justified-exit)', () => {
    const restGate = evaluateBehavioralActivationRestCheck({
      isBiologicalExhaustionOrIllness: true,
      restStartTime: '21:00',
      restEndTime: '06:30',
    });
    assert.equal(restGate.needsGuiltFreeRest, true);
    assert.equal(restGate.outcome, 'justified-exit');
    assert.equal(restGate.pushbackLevel, 'off');
  });

  it('enforces Chain Analysis Hard Stops on self-harm and victimization, plus Shame Protocol and Wise Mind Critic Guard', () => {
    const selfHarmStop = evaluateChainAnalysisSafeguards('Tối qua tôi đã rạch tay tự hại trong phòng.');
    assert.equal(selfHarmStop.hardStopTriggered, true);
    assert.equal(selfHarmStop.hardStopType, 'self-harm');
    assert.equal(selfHarmStop.outcome, 'safety-stop');

    const victimStop = evaluateChainAnalysisSafeguards('Tôi bị người khác đánh và bạo hành.');
    assert.equal(victimStop.hardStopTriggered, true);
    assert.equal(victimStop.hardStopType, 'victimization');
    assert.equal(victimStop.outcome, 'justified-exit');

    const shameGuard = evaluateChainAnalysisSafeguards('Tôi thật kinh tởm và xấu hổ không dám nhìn ai.');
    assert.equal(shameGuard.hardStopTriggered, false);
    assert.equal(shameGuard.shameProtocolTriggered, true);
    assert.equal(shameGuard.pushbackLevel, 'off');

    const criticGuard = evaluateWiseMindHarshSelfCriticGuard(
      'Lý trí bảo vì tôi yếu đuối và tôi là kẻ vô dụng nên mới không chịu nổi áp lực.',
    );
    assert.equal(criticGuard.selfCriticDetected, true);
  });

  it('routes DBT-First vs CBT-Second based on Arousal and blocks high-activation BA during Hypomania', () => {
    const redRoute = recommendTechniqueByArousalAndPolarity({ preIntensity: 9 });
    assert.equal(redRoute.recommendedTechnique, 'tipp');

    const orangeRoute = recommendTechniqueByArousalAndPolarity({
      preIntensity: 6,
      primarySymptom: 'interpersonal-conflict',
    });
    assert.equal(orangeRoute.recommendedTechnique, 'dear-man');

    const maniaOverrideEngine = new ClinicalSessionEngine({
      id: 'sess-mania-1',
      preIntensity: 4,
      moodPolarityAtStart: 3, // Hypomanic pole!
    });
    const routed = maniaOverrideEngine.performCheckInAndRoute({
      checkInText: 'Tôi đang hưng phấn muốn làm 10 việc cùng lúc!',
      requestedTechnique: 'behavioral-activation', // Should be overridden to hypomania-guard!
    });
    assert.equal(routed.selectedTechnique, 'hypomania-guard');
  });
});

describe('4. Clinical Self-Assessments (BMS, PHQ-9, GAD-7, ASRM, MDQ, ISI)', () => {
  it('scores BMS and triggers safetyStopTriggered if suicidal urges >= 1', () => {
    const safeBms = scoreBriefMoodSurvey({
      depressionItems: [1, 1, 1, 0, 1],
      suicidalUrgesItems: [0, 0],
      anxietyItems: [2, 1, 1, 1, 0],
      angerItems: [0, 1, 0, 0, 0],
      positiveFeelingsItems: [2, 2, 3, 2, 2],
    });
    assert.equal(safeBms.safetyStopTriggered, false);

    const crisisBms = scoreBriefMoodSurvey({
      depressionItems: [3, 3, 3, 3, 3],
      suicidalUrgesItems: [1, 0],
      anxietyItems: [2, 2, 2, 2, 2],
      angerItems: [1, 1, 1, 1, 1],
      positiveFeelingsItems: [0, 0, 0, 0, 0],
    });
    assert.equal(crisisBms.safetyStopTriggered, true);
  });

  it('scores PHQ-9, GAD-7, ASRM (cutoff >= 6), MDQ, and ISI (with Bipolar Mania differential)', () => {
    const phq = scorePhq9([2, 2, 2, 2, 2, 2, 2, 1, 0]); // Total 15
    assert.equal(phq.totalScore, 15);
    assert.equal(phq.clinicianReferralRecommended, true);
    assert.equal(phq.safetyStopTriggered, false);

    const gad = scoreGad7([2, 2, 2, 1, 1, 1, 1]); // Total 10
    assert.equal(gad.totalScore, 10);
    assert.equal(gad.severityCode, 'moderate');

    const asrm = scoreAsrm([2, 2, 2, 1, 1]); // Total 8 >= 6
    assert.equal(asrm.totalScore, 8);
    assert.equal(asrm.hypomaniaGuardTriggered, true);

    const mdqPos = scoreMdq({
      symptomItems: [true, true, true, true, true, true, true, false, false, false, false, false, false],
      coOccurredInSamePeriod: true,
      functionalImpairment: 'moderate',
    });
    assert.equal(mdqPos.severityCode, 'positive-bipolar-spectrum-screen');

    const isiMania = scoreIsi([1, 1, 1, 0, 0, 0, 0], 'no_need_at_all', 3.5);
    assert.equal(isiMania.hypomaniaGuardTriggered, true);
    assert.equal(isiMania.severityCode, 'bipolar-reduced-need-for-sleep-red-flag');
  });
});

describe('5. Bipolar Engine: IPSRT Rhythm, Prodrome/Mixed State, 48h Impulse Vault & Baseline HRV', () => {
  it('calculates IPSRT Social Rhythm stability score across 5 daily anchors', () => {
    const target = {
      outOfBedTime: '07:00',
      firstSocialContactTime: '08:30',
      workOrStudyStartTime: '09:00',
      dinnerTime: '19:00',
      bedTime: '23:00',
    };
    const stableLog = calculateIpsrtStabilityScore(
      {
        outOfBedTime: '07:10',
        firstSocialContactTime: '08:35',
        workOrStudyStartTime: '09:00',
        dinnerTime: '19:15',
        bedTime: '23:10',
      },
      target,
    );
    assert.ok(stableLog.stabilityScore >= 90);
    assert.equal(stableLog.status, 'highly-stable');

    const driftedLog = calculateIpsrtStabilityScore(
      {
        outOfBedTime: '11:30',
        firstSocialContactTime: '13:00',
        workOrStudyStartTime: '14:00',
        dinnerTime: '22:30',
        bedTime: '03:30',
      },
      target,
    );
    assert.equal(driftedLog.status, 'circadian-drift-alert');
  });

  it('detects Bipolar Mania Prodrome (2 nights sleep < 5h + reduced need) and Mixed State (Mood <= -2 & Energy >= +2)', () => {
    const maniaEval = evaluateBipolarProdromeAndMixedState({
      recentLogs: [
        {
          id: 'd1',
          userId: 'u1',
          loggedAt: '2026-11-20T08:00:00Z',
          moodPolarity: 1,
          energyLevel: 2,
          irritabilityIntensity: 3,
          anxietyIntensity: 2,
          sleepDurationHours: 4,
          sleepQuality: 4,
          feltNeedForSleep: 'reduced_need',
          ipsrtAnchors: {},
          medicationsTaken: [],
          mixedStateAlertTriggered: false,
        },
        {
          id: 'd2',
          userId: 'u1',
          loggedAt: '2026-11-21T08:00:00Z',
          moodPolarity: 2,
          energyLevel: 3,
          irritabilityIntensity: 4,
          anxietyIntensity: 2,
          sleepDurationHours: 3.5,
          sleepQuality: 5,
          feltNeedForSleep: 'no_need_at_all',
          ipsrtAnchors: {},
          medicationsTaken: [],
          mixedStateAlertTriggered: false,
        },
      ],
    });
    assert.equal(maniaEval.maniaProdromeDetected, true);
    assert.equal(maniaEval.consecutiveShortSleepNights, 2);
    assert.equal(maniaEval.recommendedUiMode, 'low-stimulus-mania');
    assert.equal(maniaEval.autoLock48hImpulseVault, true);

    const mixedEval = evaluateBipolarProdromeAndMixedState({
      recentLogs: [
        {
          id: 'd3',
          userId: 'u1',
          loggedAt: '2026-11-21T09:00:00Z',
          moodPolarity: -3,
          energyLevel: 3,
          irritabilityIntensity: 9,
          anxietyIntensity: 8,
          sleepDurationHours: 4,
          sleepQuality: 1,
          feltNeedForSleep: 'exhausted',
          ipsrtAnchors: {},
          medicationsTaken: [],
          mixedStateAlertTriggered: true,
        },
      ],
    });
    assert.equal(mixedEval.mixedStateDetected, true);
    assert.equal(mixedEval.recommendedUiMode, 'sos-crisis');
  });

  it('enforces the 48-Hour Impulse Vault lock and Two-Person Reality Check', () => {
    const entry = createImpulseVaultEntry({
      id: 'vault-1',
      userId: 'u1',
      impulseTitle: 'Rút toàn bộ tiết kiệm đầu tư vào ý tưởng thiên tài lúc 2 giờ sáng',
      category: 'financial',
      estimatedCostOrImpact: '200,000,000 VND',
      moodPolarityAtLock: 3,
      energyLevelAtLock: 4,
      urgeIntensityAtLock: 9,
      twoPersonRealityCheckContacts: ['Bác sĩ Lan', 'Anh Minh'],
      createdAt: '2026-11-21T02:00:00Z',
    });

    assert.ok(entry.positiveDistortionsDetected.includes('grandiosity'));
    assert.ok(entry.positiveDistortionsDetected.includes('impulse-justification'));

    // Check 12 hours later -> still locked (36h remaining)
    const status12h = evaluateImpulseVaultStatus(entry, '2026-11-21T14:00:00Z', 2);
    assert.equal(status12h.canUnlock, false);
    assert.equal(status12h.remainingHours, 36);

    // Check 50 hours later, 2 people consulted, euthymic mood -> can unlock
    entry.twoPersonConsultedCount = 2;
    const status50h = evaluateImpulseVaultStatus(entry, '2026-11-23T04:00:00Z', 0);
    assert.equal(status50h.canUnlock, true);
  });

  it('computes Baseline-Relative HRV (25th-75th percentile over 14-30 days) with < 12h freshness gate', () => {
    const baseTime = Date.parse('2026-11-21T08:00:00Z');
    const history = Array.from({ length: 14 }, (_, idx) => ({
      timestamp: new Date(baseTime - (idx + 1) * 24 * 60 * 60 * 1000).toISOString(),
      valueMs: 40 + idx * 2, // 40..66 ms
      metricType: 'RMSSD' as const,
      deviceId: 'apple-watch-s9',
    }));

    // Fresh reading (< 12h) below 25th percentile (28ms < ~46.5ms)
    const belowEval = evaluateBaselineRelativeHrv({
      latestReading: {
        timestamp: '2026-11-21T06:00:00Z',
        valueMs: 28,
        metricType: 'RMSSD',
        deviceId: 'apple-watch-s9',
      },
      historicalReadings: history,
      nowIso: '2026-11-21T08:00:00Z',
    });
    assert.equal(belowEval.context, 'below-baseline');
    assert.equal(belowEval.shouldMentionAtCheckIn, true);

    // Stale reading (> 12h old) -> never mention at check-in
    const staleEval = evaluateBaselineRelativeHrv({
      latestReading: {
        timestamp: '2026-11-20T10:00:00Z', // 22 hours old
        valueMs: 28,
        metricType: 'RMSSD',
        deviceId: 'apple-watch-s9',
      },
      historicalReadings: history,
      nowIso: '2026-11-21T08:00:00Z',
    });
    assert.equal(staleEval.context, 'stale');
    assert.equal(staleEval.shouldMentionAtCheckIn, false);
  });
});

describe('6. Phase 2 Expansion: 36 Interactive CBT/TEAM-CBT/DBT/Bipolar Tools, CBT-I Mania Guard & ABC PLEASE', () => {
  it('verifies CBT_36_TOOLS_CATALOG has all 36 complete tools with numbers 1..36 and bilingual metadata', () => {
    assert.equal(CBT_36_TOOLS_CATALOG.length, 36);

    const seenNumbers = new Set<number>();
    const seenSlugs = new Set<string>();

    for (const tool of CBT_36_TOOLS_CATALOG) {
      assert.ok(tool.number >= 1 && tool.number <= 36);
      seenNumbers.add(tool.number);
      seenSlugs.add(tool.slug);
      assert.ok(tool.titleVi.length > 5);
      assert.ok(tool.titleEn.length > 5);
      assert.ok(tool.whenToUseVi.length > 5);
      assert.ok(tool.whenToUseEn.length > 5);
      assert.ok(tool.whenNotToUseVi.length > 5);
      assert.ok(tool.whenNotToUseEn.length > 5);
      assert.ok(tool.interactivePromptsVi.length >= 2);
      assert.ok(tool.interactivePromptsEn.length >= 2);

      // Every single tool in the catalog must execute deterministically in 0ms
      const result = runInteractiveToolkitExercise(
        tool.slug,
        'Tôi luôn luôn lo lắng rằng nếu mắc sai sót nhỏ thì mọi người sẽ nghĩ tôi là kẻ thất bại hoàn toàn.',
        { moodPolarity: -1, intensity: 5, sleepHours: 6.5 },
      );
      assert.equal(result.toolNumber, tool.number);
      assert.equal(result.toolSlug, tool.slug);
      assert.equal(result.executionLatencyMs, 0);
      assert.equal(result.safeToProceed, true);
      assert.ok(result.instantAnalysisVi.length > 10);
      assert.ok(result.instantAnalysisEn.length > 10);
      assert.ok(result.guidedReframeVi.length > 10);
      assert.ok(result.guidedReframeEn.length > 10);
    }

    assert.equal(seenNumbers.size, 36);
    assert.equal(seenSlugs.size, 36);
    assert.equal(getCbt36ToolBySlugOrId('27').slug, 'paradoxical-agenda-setting');
  });

  it('executes specialized 0ms analysis across Anxiety, Depression TEAM-CBT, DBT, and Bipolar tools', () => {
    // 1. Anxiety ERP / Safety Behavior Detector
    const anxietyRes = runInteractiveToolkitExercise(
      'safety-behavior-detector',
      'Tôi đo nhịp tim liên tục và chỉ dám ngồi gần cửa ra vào vì sợ ngất.',
      { moodPolarity: 0, intensity: 6 },
    );
    assert.equal(anxietyRes.conditionFocus, 'anxiety');
    assert.ok(
      anxietyRes.detectedPatterns.safetyBehaviors.some((sb) => sb.id === 'compulsive-checking-googling'),
    );
    assert.ok(
      anxietyRes.detectedPatterns.safetyBehaviors.some((sb) => sb.id === 'escape-exit-guarding'),
    );

    // 2. Depression TEAM-CBT Paradoxical Agenda Setting
    const teamCbtRes = runInteractiveToolkitExercise(
      'paradoxical-agenda-setting',
      'Tôi không được phép mắc bất kỳ sai sót nào vì giá trị của tôi phụ thuộc hoàn toàn vào thành tích.',
      { moodPolarity: -2, intensity: 6 },
    );
    assert.equal(teamCbtRes.category, 'depression-team-cbt');
    assert.ok(
      teamCbtRes.detectedPatterns.selfDefeatingBeliefs.some((s) => s.id === 'performance-perfectionism'),
    );
    assert.ok(teamCbtRes.guidedReframeVi.includes('Chiết áp'));
    assert.ok(teamCbtRes.guidedReframeEn.includes('Magic Dial'));

    // 3. DBT Radical Acceptance & Urge Surfing
    const dbtRes = runInteractiveToolkitExercise(
      'dbt-radical-acceptance-urge-surfing',
      'Chuyện đã xảy ra rồi nhưng tôi thấy không thể chịu đựng nổi.',
      { moodPolarity: -1, intensity: 6 },
    );
    assert.equal(dbtRes.category, 'dbt-regulation');
    assert.ok(dbtRes.guidedReframeVi.includes('90 giây'));
    assert.ok(dbtRes.guidedReframeEn.includes('90-second'));

    // 4. Bipolar Positive Distortion Devil's Advocate
    const bipolarRes = runInteractiveToolkitExercise(
      'bipolar-positive-distortion-devils-advocate',
      'Tôi có ý tưởng thiên tài kiếm hàng tỷ qua đêm, rủi ro bằng không, phải mua ngay lập tức lúc 2 giờ sáng!',
      { moodPolarity: 3, intensity: 5, sleepHours: 3.5 },
    );
    assert.equal(bipolarRes.conditionFocus, 'bipolar');
    assert.ok(
      bipolarRes.detectedPatterns.positiveDistortions.some((p) => p.id === 'grandiosity'),
    );
    assert.ok(
      bipolarRes.detectedPatterns.positiveDistortions.some((p) => p.id === 'invulnerability'),
    );
    assert.ok(bipolarRes.nextActionStepVi.includes('Khoang Trì hoãn 48 Giờ'));

    // 5. 4-Layer Safety Override inside runInteractiveToolkitExercise
    const crisisOverride = runInteractiveToolkitExercise(
      'thought-record',
      'Tôi muốn chết đi cho xong, không còn lý do gì để sống.',
      { moodPolarity: -4, intensity: 9 },
    );
    assert.equal(crisisOverride.safeToProceed, false);
    assert.equal(crisisOverride.safetyEvaluation.recommendedOutcome, 'safety-stop');
  });

  it('calculates CBT-I Sleep Efficiency and enforces the Bipolar Mania Differential Safety Gate', () => {
    // Case A: Chronic Insomnia with daytime exhaustion -> Sleep Restriction allowed (>= 300 min floor)
    const insomniaEval = calculateCbtiSleepEfficiency({
      timeInBedMinutes: 540, // 9 hours in bed
      totalSleepMinutes: 330, // 5.5 hours asleep -> 61.1% efficiency
      sleepOnsetLatencyMinutes: 90,
      wakeAfterSleepOnsetMinutes: 120,
      feltNeedForSleep: 'exhausted',
    });
    assert.equal(insomniaEval.sleepEfficiencyPercent, 61.1);
    assert.equal(insomniaEval.sleepEfficiencyCategory, 'clinical-insomnia');
    assert.equal(insomniaEval.bipolarManiaContraindicationTriggered, false);
    assert.equal(insomniaEval.sleepRestrictionAllowed, true);
    assert.equal(insomniaEval.recommendedTimeInBedMinutes, 360); // 330 + 30 = 360 min (6.0h)

    // Case B: Optimal Sleep Efficiency >= 85%
    const optimalEval = calculateCbtiSleepEfficiency({
      timeInBedMinutes: 480,
      totalSleepMinutes: 432, // 90%
      sleepOnsetLatencyMinutes: 20,
      wakeAfterSleepOnsetMinutes: 28,
      feltNeedForSleep: 'normal',
    });
    assert.equal(optimalEval.sleepEfficiencyPercent, 90);
    assert.equal(optimalEval.sleepEfficiencyCategory, 'optimal');
    assert.equal(optimalEval.sleepRestrictionAllowed, true);

    // Case C: BIPOLAR MANIA CONTRAINDICATION -> Short sleep + reduced_need or no_need_at_all
    const maniaBlockReduced = calculateCbtiSleepEfficiency({
      timeInBedMinutes: 240,
      totalSleepMinutes: 210, // 3.5 hours sleep
      sleepOnsetLatencyMinutes: 15,
      wakeAfterSleepOnsetMinutes: 15,
      feltNeedForSleep: 'reduced_need',
    });
    assert.equal(maniaBlockReduced.bipolarManiaContraindicationTriggered, true);
    assert.equal(maniaBlockReduced.sleepRestrictionAllowed, false);
    assert.equal(maniaBlockReduced.hypomaniaGuardTriggered, true);
    assert.equal(maniaBlockReduced.sleepEfficiencyCategory, 'bipolar-mania-contraindication');
    assert.equal(maniaBlockReduced.recommendedTimeInBedMinutes, null);

    const maniaBlockNone = calculateCbtiSleepEfficiency({
      timeInBedMinutes: 180,
      totalSleepMinutes: 150,
      sleepOnsetLatencyMinutes: 10,
      wakeAfterSleepOnsetMinutes: 20,
      feltNeedForSleep: 'no_need_at_all',
    });
    assert.equal(maniaBlockNone.bipolarManiaContraindicationTriggered, true);
    assert.equal(maniaBlockNone.sleepRestrictionAllowed, false);
    assert.equal(maniaBlockNone.recommendedTimeInBedMinutes, null);
  });

  it('evaluates DBT ABC PLEASE daily resilience and generates ACCEPTS & 5-Senses Self-Soothe plan', () => {
    const standardPlan = evaluateDbtAbcPleaseAndAccepts({
      accumulatedPositivesToday: true,
      buildMasteryCompleted: true,
      copeAheadPrepared: false,
      physicalIllnessTreated: true,
      balancedEating: true,
      avoidedMoodAlteringSubstances: true,
      balancedSleep: true,
      gotGentleExercise: false,
      moodPolarity: 0,
      emptinessOrDepressionIntensity: 3,
    });
    assert.equal(standardPlan.completedPillarsCount, 6);
    assert.equal(standardPlan.resilienceScorePercent, 75);
    assert.equal(standardPlan.lowEnergyDepressionModeActive, false);
    assert.equal(standardPlan.missingVulnerabilityFactorsVi.length, 2);
    assert.equal(standardPlan.acceptsSkillsVi.length, 7);
    assert.equal(standardPlan.fiveSensesSelfSootheVi.length, 5);

    const lowEnergyPlan = evaluateDbtAbcPleaseAndAccepts({
      accumulatedPositivesToday: false,
      buildMasteryCompleted: false,
      copeAheadPrepared: false,
      physicalIllnessTreated: true,
      balancedEating: false,
      avoidedMoodAlteringSubstances: true,
      balancedSleep: false,
      gotGentleExercise: false,
      moodPolarity: -4,
      emptinessOrDepressionIntensity: 8,
    });
    assert.equal(lowEnergyPlan.completedPillarsCount, 2);
    assert.equal(lowEnergyPlan.resilienceScorePercent, 25);
    assert.equal(lowEnergyPlan.lowEnergyDepressionModeActive, true);
    assert.ok(lowEnergyPlan.summaryVi.includes('Low-Energy Mode'));
    assert.ok(lowEnergyPlan.acceptsSkillsVi[0]!.microAction.includes('Bước nhỏ 2 phút'));
  });
});

describe('7. Phase 3 Expansion: 2-Tier Clinical Session Memory Manager & Audio Burst Speech-Pace Mania Detector', () => {
  it('enforces 20-message sliding window, triggers Rolling Summary every 15 messages, extracts profile facts, and supports selective erasure', () => {
    assert.equal(RECENT_MESSAGE_WINDOW, 20);
    assert.equal(ROLLING_SUMMARY_INTERVAL, 15);

    const memory = new TwoTierClinicalMemoryManager({
      sessionId: 'sess-p3-mem',
      userId: 'user-p3-01',
    });

    // Immediate Structured Personal Profile Facts extraction
    const extracted = extractStructuredProfileFacts(
      'Tên tôi là Minh Anh, tôi làm nghề kỹ sư phần mềm tại Hà Nội. Giá trị cốt lõi của tôi là gia đình và sự tự chủ. Người tin cậy là bác sĩ Lan và chồng tôi Hoàng. Khi hưng cảm tôi thường ngủ dưới 3 tiếng và mua sắm lúc 2h sáng. Tôi thích hỏi nhẹ nhàng thôi (gentle pushback).',
    );
    assert.equal(extracted.preferredName, 'Minh Anh');
    assert.ok(extracted.workOrStudyContext?.includes('kỹ sư phần mềm'));
    assert.ok(extracted.coreValues.some((v) => v.includes('Gia đình')));
    assert.ok(extracted.coreValues.some((v) => v.includes('Tự chủ')));
    assert.ok(extracted.trustedSupportPeople.some((p) => p.includes('Lan')));
    assert.ok(extracted.knownBipolarProdromes.some((p) => p.includes('Giảm nhu cầu ngủ')));
    assert.ok(extracted.knownBipolarProdromes.some((p) => p.includes('Mua sắm')));
    assert.equal(extracted.preferredPushbackLevel, 'gentle');

    // Feed 25 messages (should trigger rolling summary at message #15 and cap recentMessages at 20)
    for (let i = 1; i <= 25; i++) {
      const isUser = i % 2 === 1;
      memory.addMessage({
        id: `m-${i}`,
        role: isUser ? 'user' : 'assistant',
        content:
          i === 1
            ? 'Mình tên là Minh Anh, tôi làm nghề thiết kế sản phẩm. Gia đình là điều quan trọng nhất, bác sĩ điều trị là Bác sĩ Tuấn. Khi mất ngủ tôi hay ngủ dưới 4 tiếng và luôn luôn sợ thất bại trước deadline công việc.'
            : `Tin nhắn trao đổi thực hành Thought Record và thở 4-6 TIPP bước thứ ${i}.`,
        technique: 'thought-record',
      });

      if (i === 14) {
        assert.equal(memory.inspectMemoryState().rollingSummary.refreshCount, 0);
      }
      if (i === 15) {
        const stateAt15 = memory.inspectMemoryState();
        assert.equal(stateAt15.rollingSummary.refreshCount, 1);
        assert.equal(stateAt15.rollingSummary.summarizedMessageCount, 15);
        assert.ok(stateAt15.rollingSummary.summaryTextVi.includes('Minh Anh'));
      }
    }

    const stateAt25 = inspectMemoryState(memory);
    assert.equal(stateAt25.totalMessagesProcessed, 25);
    assert.equal(stateAt25.recentMessages.length, 20);
    assert.equal(stateAt25.recentMessages[0]?.id, 'm-6');
    assert.equal(stateAt25.recentMessages[19]?.id, 'm-25');
    assert.equal(stateAt25.rollingSummary.refreshCount, 1);
    assert.equal(stateAt25.structuredProfileFacts.preferredName, 'Minh Anh');

    // Selective Erasure 1: eraseDerivedMemoryOnly preserves the 20-message window while clearing summary & profile facts
    const afterDerivedErase = eraseDerivedMemoryOnly(memory);
    assert.equal(afterDerivedErase.recentMessages.length, 20);
    assert.equal(afterDerivedErase.rollingSummary.refreshCount, 0);
    assert.equal(afterDerivedErase.rollingSummary.summaryTextVi, '');
    assert.equal(afterDerivedErase.structuredProfileFacts.preferredName, undefined);
    assert.equal(afterDerivedErase.structuredProfileFacts.coreValues.length, 0);

    // Selective Erasure 2: eraseAllTranscriptsAndMemory wipes transcripts, counters, summary, and profile facts
    const afterFullErase = eraseAllTranscriptsAndMemory(memory);
    assert.equal(afterFullErase.recentMessages.length, 0);
    assert.equal(afterFullErase.totalMessagesProcessed, 0);
    assert.equal(afterFullErase.rollingSummary.refreshCount, 0);
  });

  it('detects pressured-speech mania (> 30% WPM spike over baseline), classifies Expressive vs. Instrumental intent, and generates 5-Color Mood-Palette with HRV context', () => {
    // 1. Pressured Speech Mania Alert: 110 words in 30 seconds = 220 WPM (> 130 * 1.30 = 169 WPM)
    const fastWords = Array.from(
      { length: 22 },
      () => 'Tôi có ý tưởng thiên tài không cần ngủ nữa phải làm ngay',
    ).join(' '); // 22 * 12 = 264 words in 60s -> 264 WPM (+103% over 130 WPM baseline)

    const baseTime = Date.parse('2026-11-21T08:00:00Z');
    const hrvReadings = Array.from({ length: 14 }, (_, idx) => ({
      value: idx === 13 ? 22 : 45 + idx * 2, // Latest reading (idx 13) is 22ms (< 25th percentile)
      timestampIso: new Date(baseTime - (13 - idx) * 24 * 60 * 60 * 1000).toISOString(),
      deviceSource: 'apple-watch-s9',
    }));

    const maniaBurst = analyzeAudioBurstJournal({
      transcript: fastWords,
      durationSeconds: 60,
      baselineWordsPerMinute: 130,
      recentHrvReadings: hrvReadings,
      nowIso: '2026-11-21T08:30:00Z',
    });

    assert.ok(maniaBurst.wpm > 169);
    assert.equal(maniaBurst.pressuredSpeechManiaAlert, true);
    assert.equal(maniaBurst.recommendedTechnique, 'hypomania-guard');
    assert.equal(maniaBurst.recommendedUiMode, 'low-stimulus-mania');
    assert.equal(maniaBurst.moodPalette.dominantEmotion, 'hypomanic-elation');
    assert.equal(maniaBurst.hexColors.length, 5);
    assert.equal(maniaBurst.hrvContext, 'below-baseline');
    assert.equal(maniaBurst.singleSessionHrvComparisonBlocked, true);

    // 2. Expressive Complaint (normal WPM, seeking EAR empathy & emotional release)
    const expressiveBurst = analyzeAudioBurstJournal({
      transcript:
        'Hôm nay mình mệt mỏi quá và buồn quá, mình chỉ muốn tâm sự và chỉ cần người lắng nghe thôi, đừng khuyên gì cả.',
      durationSeconds: 20, // ~25 words in 20s = 75 WPM (no mania alert)
      baselineWordsPerMinute: 130,
    });
    assert.equal(expressiveBurst.pressuredSpeechManiaAlert, false);
    assert.equal(expressiveBurst.complaintIntent, 'expressive');
    assert.equal(expressiveBurst.recommendedResponseMode, 'ear-empathy-only');
    assert.equal(expressiveBurst.hexColors.length, 5);

    // 3. Instrumental Complaint (normal WPM, seeking CBT/DBT restructuring & action plan)
    const instrumentalBurst = analyzeAudioBurstJournal({
      transcript:
        'Làm sao để vượt qua suy nghĩ sếp ghét mình? Hãy giúp tôi phân tích bằng chứng và lập kế hoạch hành động bằng bài tập CBT.',
      durationSeconds: 20,
      baselineWordsPerMinute: 130,
    });
    assert.equal(instrumentalBurst.pressuredSpeechManiaAlert, false);
    assert.equal(instrumentalBurst.complaintIntent, 'instrumental');
    assert.equal(instrumentalBurst.recommendedResponseMode, 'structured-cbt-dbt');
  });
});

describe('8. Phase 4 Expansion: Zero-Knowledge E2EE 24-Word Key, CRDT Sync Resolver, Clinician Share & 105-Case Red-Team Audit', () => {
  it('generates a 24-word recovery phrase and deterministically derives a PBKDF2-HMAC-SHA256 master key fingerprint', () => {
    const phrase1 = generate24WordRecoveryPhrase('patient-seed-equilibria-001');
    const words1 = phrase1.trim().split(/\s+/);
    assert.equal(words1.length, 24);

    // Deterministic derivation from the same 24-word phrase on Flutter & Web
    const derivedFlutter = deriveMasterKeyFingerprintFromPhrase(phrase1);
    const derivedWeb = deriveMasterKeyFingerprintFromPhrase(words1.join('   ').toUpperCase());

    assert.equal(derivedFlutter.valid, true);
    assert.equal(derivedFlutter.wordCount, 24);
    assert.equal(derivedFlutter.kdfAlgorithm, 'PBKDF2-HMAC-SHA256');
    assert.equal(derivedFlutter.cipherSuite, 'AES-256-GCM');
    assert.equal(derivedFlutter.zeroKnowledgeClientOnly, true);
    assert.equal(derivedFlutter.masterKeyHex.length, 64);
    assert.equal(derivedFlutter.fingerprintHex.length, 64);
    assert.ok(derivedFlutter.shortFingerprint.startsWith('EQ-'));
    assert.equal(derivedFlutter.masterKeyHex, derivedWeb.masterKeyHex);
    assert.equal(derivedFlutter.fingerprintHex, derivedWeb.fingerprintHex);

    // Invalid phrase length (< 24 words) is flagged
    const invalidDerived = deriveMasterKeyFingerprintFromPhrase('anchor balance breathe');
    assert.equal(invalidDerived.valid, false);
    assert.equal(invalidDerived.wordCount, 3);
  });

  it('resolves offline Flutter vs. offline Web E2EE sync conflicts deterministically via CRDT version vectors, LWW, and tombstones', () => {
    interface EncryptedJournalRecord {
      id: string;
      clientUpdatedAt: string;
      deviceId: string;
      ciphertextB64: string;
      deleted?: boolean;
      versionVector?: Record<string, number>;
    }

    const flutterLocalRecords: EncryptedJournalRecord[] = [
      // Record 1: Exists only on Flutter offline
      {
        id: 'rec-flutter-only',
        clientUpdatedAt: '2026-11-21T08:00:00Z',
        deviceId: 'flutter-ios-1',
        ciphertextB64: 'cipher_flutter_only',
        versionVector: { 'flutter-ios-1': 1 },
      },
      // Record 2: Version vector on Web dominates Flutter -> Web wins
      {
        id: 'rec-vv-dominance',
        clientUpdatedAt: '2026-11-21T08:10:00Z',
        deviceId: 'flutter-ios-1',
        ciphertextB64: 'cipher_old_v1',
        versionVector: { 'flutter-ios-1': 1, 'web-nextjs-1': 1 },
      },
      // Record 3: Concurrent edit -> Last-Write-Wins timestamp (Flutter is newer) + merged version vector
      {
        id: 'rec-concurrent-lww',
        clientUpdatedAt: '2026-11-21T09:30:00Z',
        deviceId: 'flutter-ios-1',
        ciphertextB64: 'cipher_flutter_newer',
        versionVector: { 'flutter-ios-1': 2, 'web-nextjs-1': 1 },
      },
      // Record 4: Deleted on Web (tombstone) -> tombstone deletion must be preserved so it never resurrects
      {
        id: 'rec-tombstone',
        clientUpdatedAt: '2026-11-21T08:00:00Z',
        deviceId: 'flutter-ios-1',
        ciphertextB64: 'cipher_alive_on_flutter',
        deleted: false,
        versionVector: { 'flutter-ios-1': 1 },
      },
    ];

    const webRemoteRecords: EncryptedJournalRecord[] = [
      // Record 5: Exists only on Web Next.js
      {
        id: 'rec-web-only',
        clientUpdatedAt: '2026-11-21T08:05:00Z',
        deviceId: 'web-nextjs-1',
        ciphertextB64: 'cipher_web_only',
        versionVector: { 'web-nextjs-1': 1 },
      },
      // Record 2: Web has causally newer versionVector
      {
        id: 'rec-vv-dominance',
        clientUpdatedAt: '2026-11-21T08:15:00Z',
        deviceId: 'web-nextjs-1',
        ciphertextB64: 'cipher_web_v2',
        versionVector: { 'flutter-ios-1': 1, 'web-nextjs-1': 2 },
      },
      // Record 3: Concurrent edit on Web (older timestamp than Flutter)
      {
        id: 'rec-concurrent-lww',
        clientUpdatedAt: '2026-11-21T09:15:00Z',
        deviceId: 'web-nextjs-1',
        ciphertextB64: 'cipher_web_older',
        versionVector: { 'flutter-ios-1': 1, 'web-nextjs-1': 2 },
      },
      // Record 4: Tombstone deletion on Web
      {
        id: 'rec-tombstone',
        clientUpdatedAt: '2026-11-21T09:00:00Z',
        deviceId: 'web-nextjs-1',
        ciphertextB64: '',
        deleted: true,
        versionVector: { 'flutter-ios-1': 1, 'web-nextjs-1': 1 },
      },
    ];

    const syncRes = resolveE2eeSyncConflicts(flutterLocalRecords, webRemoteRecords);

    assert.equal(syncRes.totalMergedCount, 5);
    assert.equal(syncRes.localOnlyCount, 1);
    assert.equal(syncRes.remoteOnlyCount, 1);
    assert.equal(syncRes.conflictsResolvedCount, 3);
    assert.equal(syncRes.activeRecords.length, 4);
    assert.deepEqual(syncRes.tombstoneIds, ['rec-tombstone']);

    const byId = new Map(syncRes.mergedRecords.map((r) => [r.id, r]));
    assert.equal(byId.get('rec-vv-dominance')?.ciphertextB64, 'cipher_web_v2');
    assert.equal(byId.get('rec-concurrent-lww')?.ciphertextB64, 'cipher_flutter_newer');
    // Merged version vector on concurrent record must combine max counters from both devices
    assert.deepEqual(byId.get('rec-concurrent-lww')?.versionVector, {
      'flutter-ios-1': 2,
      'web-nextjs-1': 2,
    });
    assert.equal(byId.get('rec-tombstone')?.deleted, true);
  });

  it('creates time-limited Zero-Knowledge Clinician Share links with decryption key strictly in #key fragment and enforces expiry/revocation', () => {
    const share = createClinicianShareSnapshotLink({
      baseUrl: 'https://equilibria.clinical.app/',
      encryptedPayloadB64: 'U2FsdGVkX1+clinician30dayReportCiphertext==',
      ivB64: 'MTIzNDU2Nzg5MDEy',
      authTagB64: 'YWJjZGVmZ2hpamtsbW5vcA==',
      ephemeralKeyHex: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      ttlHours: 24,
      nowIso: '2026-11-21T10:00:00.000Z',
    });

    assert.ok(share.shareToken.startsWith('shr_'));
    assert.ok(share.shareUrl.includes('#key=9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'));
    assert.equal(share.zeroKnowledgeKeyInFragmentOnly, true);
    assert.equal(share.serverSawDecryptionKey, false);
    assert.equal(share.serverStoredRecord.keyStoredOnServer, false);
    assert.equal(
      JSON.stringify(share.serverStoredRecord).includes('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'),
      false,
    );

    // Active 2 hours later
    const activeCheck = verifyClinicianShareLinkExpiry({
      expiresAtIso: share.expiresAtIso,
      nowIso: '2026-11-21T12:00:00.000Z',
      revoked: false,
      shareUrl: share.shareUrl,
    });
    assert.equal(activeCheck.valid, true);
    assert.equal(activeCheck.status, 'active');
    assert.equal(activeCheck.remainingHours, 22);
    assert.equal(activeCheck.hasZeroKnowledgeFragmentKey, true);

    // Expired 25 hours later
    const expiredCheck = verifyClinicianShareLinkExpiry({
      expiresAtIso: share.expiresAtIso,
      nowIso: '2026-11-22T11:00:00.000Z',
      revoked: false,
      shareUrl: share.shareUrl,
    });
    assert.equal(expiredCheck.valid, false);
    assert.equal(expiredCheck.expired, true);
    assert.equal(expiredCheck.status, 'expired');

    // Revoked by patient before expiry
    const revokedCheck = verifyClinicianShareLinkExpiry({
      expiresAtIso: share.expiresAtIso,
      nowIso: '2026-11-21T11:00:00.000Z',
      revoked: true,
      shareUrl: share.shareUrl,
    });
    assert.equal(revokedCheck.valid, false);
    assert.equal(revokedCheck.revoked, true);
    assert.equal(revokedCheck.status, 'revoked');
  });

  it('passes 105/105 (100%) Adversarial Clinical Safety Red-Team cases across all 7 categories and verifies WCAG 2.2 AAA & Zero-Telemetry privacy', () => {
    assert.equal(ADVERSARIAL_RED_TEAM_PROMPTS.length, 105);

    const audit = runAdversarialRedTeamAudit();
    assert.equal(audit.totalCases, 105);
    assert.equal(audit.passedCases, 105);
    assert.equal(audit.failedCount, 0);
    assert.equal(audit.passRatePercent, 100);
    assert.equal(audit.allPassed, true);
    assert.equal(audit.failedCases.length, 0);

    // Verify exact category counts: 20 + 15 + 15 + 15 + 15 + 15 + 10 = 105
    assert.equal(audit.categoryBreakdown.suicidal_ideation.total, 20);
    assert.equal(audit.categoryBreakdown.suicidal_ideation.passed, 20);
    assert.equal(audit.categoryBreakdown.self_harm_chain_hard_stop_1.total, 15);
    assert.equal(audit.categoryBreakdown.self_harm_chain_hard_stop_1.passed, 15);
    assert.equal(audit.categoryBreakdown.domestic_violence_hard_stop_2.total, 15);
    assert.equal(audit.categoryBreakdown.domestic_violence_hard_stop_2.passed, 15);
    assert.equal(audit.categoryBreakdown.bipolar_mania_psychosis_lithium.total, 15);
    assert.equal(audit.categoryBreakdown.bipolar_mania_psychosis_lithium.passed, 15);
    assert.equal(audit.categoryBreakdown.mixed_state_cbti_contraindication.total, 15);
    assert.equal(audit.categoryBreakdown.mixed_state_cbti_contraindication.passed, 15);
    assert.equal(audit.categoryBreakdown.prompt_injection_rag_abstention.total, 15);
    assert.equal(audit.categoryBreakdown.prompt_injection_rag_abstention.passed, 15);
    assert.equal(audit.categoryBreakdown.biological_exhaustion_objective_tragedy.total, 10);
    assert.equal(audit.categoryBreakdown.biological_exhaustion_objective_tragedy.passed, 10);

    // Verify Zero-Telemetry Privacy, WCAG 2.2 AAA (>= 7.0:1), and < 300ms SOS latency compliance
    const compliance = verifyZeroTelemetryPrivacyCompliance();
    assert.equal(compliance.compliant, true);
    assert.equal(compliance.zeroPhiTelemetryVerified, true);
    assert.equal(compliance.journalPayloadsSentToAnalyticsBytes, 0);
    assert.equal(compliance.wcag22AaaCompliant, true);
    assert.ok(compliance.minContrastRatioVerified >= 7.0);
    assert.equal(compliance.sosLatencyCompliant, true);
    assert.ok(compliance.sosLaunchLatencyMs < 300);

    // Verify violation detection if someone misconfigures telemetry or WCAG contrast
    const nonCompliant = verifyZeroTelemetryPrivacyCompliance({
      crashlyticsIncludesJournalText: true,
      telemetryPayloadFields: ['journal_text', 'recovery_phrase_24_words'],
      sosLaunchLatencyMs: 450,
    });
    assert.equal(nonCompliant.compliant, false);
    assert.equal(nonCompliant.zeroPhiTelemetryVerified, false);
    assert.equal(nonCompliant.blockedPhiFields.length, 2);
  });
});

describe('11. CLINICAL_PROTOCOL_MASTER_PLAN.md Full Governance, 68-Protocol Catalog & 12 Safety Scenarios', () => {
  it('validates all 68 protocol manifests across 7 therapy models and blocks unapproved "approved" or "completed" status', () => {
    assert.equal(MASTER_PROTOCOL_CATALOG.length, 68);
    for (const manifest of MASTER_PROTOCOL_CATALOG) {
      const check = validateProtocolManifest(manifest);
      assert.equal(check.valid, true, `Failed manifest validation for ${manifest.protocol_id}: ${check.errors.join(', ')}`);
      assert.equal(manifest.status, 'draft');
    }

    // Attempting to mark a protocol as 'approved' without clinical_approvals MUST fail (§5.3 & §14)
    const sample = MASTER_PROTOCOL_CATALOG[0]!;
    const prematureApprove = validateProtocolManifest({
      ...sample,
      status: 'approved',
      clinical_approvals: [],
    });
    assert.equal(prematureApprove.valid, false);

    // Attempting to use 'completed' status MUST fail (Appendix B)
    const illegalCompleted = validateProtocolManifest({
      ...sample,
      status: 'completed' as unknown as 'draft',
    });
    assert.equal(illegalCompleted.valid, false);
  });

  it('enforces §1.3 7-concept pathway separation and §9.1 data provenance (blocking unconfirmed AI inference)', () => {
    const unconfirmedAi = createProvenancedValue({
      value: 'User has severe depression',
      provenance: 'ai_summary_confirmed',
      confirmedByUser: false,
    });
    assert.equal(unconfirmedAi.valid, false);

    const confirmedAi = createProvenancedValue({
      value: 'User noted feeling tired after work this week',
      provenance: 'ai_summary_confirmed',
      confirmedByUser: true,
    });
    assert.equal(confirmedAi.valid, true);

    const collapsed = validateSeparatedClinicalPathwayRecord({
      userId: 'u-1',
      diagnosis: 'Bipolar I',
    });
    assert.equal(collapsed.valid, false);
  });

  it('passes all 12 mandatory Safety Test scenarios (§11.2), 6-Section Personal Safety Plan consent, WHO-5, Medication Support, Multi-Signal Bipolar, Caregiver RBAC, and Report Redaction', () => {
    // 1. Positive suicide screen -> urgent_human_support + suspends ordinary exercise + never claims low risk
    const s1 = evaluateMasterPlanSafetySubsystem({
      userId: 'u-1',
      positiveSuicideOrSelfHarmScreen: true,
      inProgressProtocol: MASTER_PROTOCOL_CATALOG[0],
    });
    assert.equal(s1.pathwayState, 'urgent_human_support');
    assert.equal(s1.ordinaryExerciseSuspended, true);
    assert.equal(s1.claimsUserIsLowRisk, false);

    // 2. Concerning disclosure during exercise + AI conflict -> emergency_guidance + AI overridden
    const s2 = evaluateMasterPlanSafetySubsystem({
      userId: 'u-1',
      textDisclosure: 'Tôi không muốn sống nữa, tôi muốn tự tử',
      aiSuggestedOverrideSafeToContinue: true,
      networkOffline: true,
    });
    assert.equal(s2.pathwayState, 'emergency_guidance');
    assert.equal(s2.aiOutputOverriddenBySafetyEngine, true);
    assert.equal(s2.auditRecord.networkOffline, true);

    // 3. User declines safety questions -> still shows emergency help without requiring questionnaire
    const s3 = evaluateMasterPlanSafetySubsystem({
      userId: 'u-1',
      userDeclinedSafetyQuestions: true,
    });
    assert.equal(s3.requiresQuestionnaireBeforeShowingHelp, false);
    assert.ok(s3.emergencyDirectoryStatus.directory.contacts.length >= 2);

    // 4. Stale or missing emergency directory detection + Caregiver mode
    const s4 = evaluateMasterPlanSafetySubsystem({
      userId: 'caregiver-1',
      userRole: 'caregiver',
      countryCode: 'UNKNOWN_COUNTRY',
      directoryReferenceDateIso: '2028-01-01T00:00:00Z',
    });
    assert.equal(s4.emergencyDirectoryStatus.isStale, true);
    assert.ok(s4.caregiverSpecificGuidanceVi?.includes('Người thân Đồng hành'));

    // 5. Deprecated protocol mid-session
    const depNotice = resolveInProgressSessionOnProtocolUpdate({
      protocolManifest: { ...MASTER_PROTOCOL_CATALOG[0]!, status: 'deprecated' },
      sessionAlreadyInProgress: true,
      replacementProtocolId: 'CBT_THOUGHT_RECORD_V2',
    });
    assert.equal(depNotice.canContinueCurrentStep, false);
    assert.equal(depNotice.action, 'allow_graceful_finish_or_save_draft');

    // 6. Personal Safety Plan requires explicit consent for storing contacts
    const planNoConsent = validatePersonalSafetyPlan({
      id: 'sp-1',
      userId: 'u-1',
      section4TrustedPeopleToAskForHelp: [{ name: 'Lan', relationship: 'Sister', phone: '0901234567' }],
      explicitConsentForStoringContacts: false,
    });
    assert.equal(planNoConsent.valid, false);

    // 7. WHO-5 Well-Being Index & Instrument Governance
    assert.ok(INSTRUMENT_GOVERNANCE_REGISTRY['WHO-5']);
    const who5 = scoreWho5WellBeing([4, 3, 4, 3, 4]);
    assert.equal(who5.rawScore, 18);
    assert.equal(who5.percentageScore, 72);
    assert.equal(who5.isDiagnosis, false);

    // 8. Medication support blocks dose change recommendations
    const medBlocked = evaluateMedicationSupportAction({
      intakeStatus: 'missed',
      userAskedForDoseChangeOrStopping: true,
    });
    assert.equal(medBlocked.allowed, false);
    assert.equal(medBlocked.blockedDoseRecommendation, true);

    // 9. Multi-signal Bipolar check does NOT trigger mania from a single sleep signal alone (§3.5)
    const singleSignal = evaluateMultiSignalBipolarPrecautions({
      reducedNeedForSleepReported: true,
      elevatedOrIrritableMoodReported: false,
      increasedEnergyOrGoalDirectedActivity: false,
      unusualTalkativenessOrRacingThoughts: false,
      increasedImpulsivityOrRiskyBehavior: false,
      significantRoutineDeviation: false,
      psychoticSymptomsOrSevereImpairment: false,
    });
    assert.equal(singleSignal.usesSingleSleepThresholdAsManiaDetector, false);
    assert.equal(singleSignal.promptHumanClinicalContactRecommended, false);

    const multiSignal = evaluateMultiSignalBipolarPrecautions({
      reducedNeedForSleepReported: true,
      elevatedOrIrritableMoodReported: true,
      increasedEnergyOrGoalDirectedActivity: true,
      unusualTalkativenessOrRacingThoughts: false,
      increasedImpulsivityOrRiskyBehavior: false,
      significantRoutineDeviation: false,
      psychoticSymptomsOrSevereImpairment: false,
    });
    assert.equal(multiSignal.promptHumanClinicalContactRecommended, true);
    assert.equal(multiSignal.restrictHighEnergyActivationAndIntensiveExercises, true);

    // 10. Caregiver granular consent (private journals, sessions, assessments FALSE by default) + instant revocation
    const grantRes = createGranularCaregiverAccessGrant({
      grantId: 'g-1',
      patientUserId: 'p-1',
      caregiverUserId: 'c-1',
      patientInvitedCaregiver: true,
    });
    assert.equal(grantRes.valid, true);
    assert.equal(grantRes.data?.permissions.viewPrivateJournalEntries, false);
    assert.equal(grantRes.data?.permissions.viewTherapySessionContent, false);
    assert.equal(grantRes.data?.permissions.viewAssessmentAnswers, false);
    assert.equal(grantRes.data?.permissions.editClinicalRecordsOrImpersonatePatient, false);

    const revoked = revokeCaregiverAccessGrant(grantRes.data!, 'p-1');
    assert.equal(revoked.revoked, true);
    assert.equal(revoked.permissions.viewEarlyWarningPlan, false);

    // 11. User-controlled clinical report preview & redaction (§10.3)
    const report = buildUserControlledReportWithRedaction({
      explicitUserRequestConfirmed: true,
      redactPrivateJournals: true,
      selfReportedMoodSummary: 'Khí sắc ổn định 7 ngày qua',
      privateJournals: ['Nhật ký riêng tư cần ẩn'],
      assessments: [{ instrumentCode: 'PHQ-9', date: '2026-11-23', totalScore: 6 }],
    });
    assert.equal(report.valid, true);
    assert.equal(report.data?.containsAutomatedDiagnosisOrRiskLabels, false);
    assert.ok(report.data?.privateJournalsDisplayed[0]?.includes('REDACTED'));
  });
});




