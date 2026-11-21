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
