import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BREATHING_PATTERNS,
  DBT_STOP_STEPS,
  DEFAULT_AI_CONNECTION_CONFIG,
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
  decryptClinicalDataAesGcm,
  detectCognitiveDistortions,
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
  type DailyMoodAndRhythmLog,
} from '../src/clinical/index.ts';

test('1. Adaptive Theme & UI Mode System auto-activates Standard, Low-Energy Depression, and Low-Stimulus Mania modes', () => {
  // Standard mode
  const standard = resolveAdaptiveTheme({ moodPolarity: 0, asrmScore: 2 });
  assert.equal(standard.mode, 'standard');
  assert.equal(standard.persistentSosVisible, true);
  assert.equal(standard.animationsEnabled, true);

  // Low-Energy Depression Mode (Mood Polarity <= -3)
  const depression = resolveAdaptiveTheme({ moodPolarity: -3, asrmScore: 1 });
  assert.equal(depression.mode, 'low-energy-depression');
  assert.equal(depression.simplifiedOneSmallStep, true);
  assert.equal(depression.voiceBurstPrimary, true);
  assert.equal(depression.showAffectLabelingCards, true);
  assert.equal(depression.showStreaks, false); // No Broken Streaks!
  assert.equal(depression.persistentSosVisible, true);
  assert.equal(FIVE_FAMILY_AFFECT_CARDS.length, 5);

  // Low-Stimulus Mania / Dark Rest Mode (Mood Polarity >= +2 or ASRM >= 6)
  const maniaByPole = resolveAdaptiveTheme({ moodPolarity: 2, asrmScore: 0 });
  assert.equal(maniaByPole.mode, 'low-stimulus-mania');
  assert.equal(maniaByPole.animationsEnabled, false); // Zero flashy animations
  assert.equal(maniaByPole.show48hImpulseVaultBanner, true);
  assert.equal(maniaByPole.showDarkTherapyTimer, true);
  assert.equal(maniaByPole.blockHighActivationBA, true);

  const maniaByAsrm = resolveAdaptiveTheme({ moodPolarity: 0, asrmScore: 6 });
  assert.equal(maniaByAsrm.mode, 'low-stimulus-mania');

  const timer = computeDarkTherapyTimer('21:30', '22:00');
  assert.equal(timer.minutesRemaining, 30);
  assert.equal(timer.isDarkRestActiveNow, false);
});

test('2. 1-Tap DBT SOS Portal: Paced Breathing (4-6 & 4-7-8), Offline Web Audio synth, and Mandatory Medical Exclusion Screen', () => {
  assert.equal(BREATHING_PATTERNS['4-6'].totalCycleSeconds, 10);
  assert.equal(BREATHING_PATTERNS['4-7-8'].totalCycleSeconds, 19);

  const inhaleFrame = computeBreathingFrame('4-6', 2);
  assert.equal(inhaleFrame.phase, 'inhale');
  const exhaleFrame = computeBreathingFrame('4-6', 6);
  assert.equal(exhaleFrame.phase, 'exhale');

  const audio = new OfflineAmbientAudioEngine();
  const started = audio.start(174);
  assert.equal(started.started, true);
  audio.modulateFrequency(220);
  audio.stop();
  assert.equal(audio.getStatus(), false);

  // Mandatory Medical Exclusion Screen blocks cold water if any condition is checked
  const blocked = evaluateTippColdWaterSafety({
    hasHeartCondition: false,
    takesBetaBlockers: true,
    hasSlowHeartRateOrPacemaker: false,
    hasColdAllergyOrRaynauds: false,
    hasEatingDisorder: false,
  });
  assert.equal(blocked.coldWaterAllowed, false);
  assert.equal(blocked.redirectedToPacedBreathing, true);
  assert.equal(blocked.activeSkill, 'paced-breathing');

  // Cleared medical screen allows 15-30s cold water facial dive reflex
  const cleared = evaluateTippColdWaterSafety({
    hasHeartCondition: false,
    takesBetaBlockers: false,
    hasSlowHeartRateOrPacemaker: false,
    hasColdAllergyOrRaynauds: false,
    hasEatingDisorder: false,
  });
  assert.equal(cleared.coldWaterAllowed, true);
  assert.equal(cleared.activeSkill, 'temperature-cold-water');

  // Circuit breaker stops after 2 TIPP skills if intensity remains >= 7
  const postLoop = evaluateTippPostSkill({
    skillsAttemptedCount: 2,
    preIntensity: 9,
    postIntensity: 8,
  });
  assert.equal(postLoop.shouldStopLoop, true);
  assert.equal(postLoop.outcome, 'stopped-early');
  assert.equal(DBT_STOP_STEPS.length, 4);
});

test('3. DBT-First, CBT-Second Session Player & All 7 Guided Interactive Protocols with Clinical Gates', () => {
  // DBT-First arousal routing
  const redRoute = routeDbtFirstCbtSecond({ distressIntensity: 9, moodPolarity: 0 });
  assert.equal(redRoute.tier, '1-DBT-Distress-Tolerance');
  assert.equal(redRoute.recommendedTechnique, 'tipp');

  // Phase 0 Voice Burst + Mood Palette
  const vb = processVoiceBurstAndPhase0({
    transcript: 'Tôi chỉ muốn tâm sự vì hôm nay quá mệt mỏi và kiệt sức.',
    durationSeconds: 15,
  });
  assert.equal(vb.detectedMode, 'expressive');
  assert.ok(vb.moodPalette.colors.length === 3);

  // Live Socratic Pushback switcher
  assert.equal(adjustPushbackLevel('moderate', 'softer'), 'gentle');
  assert.equal(adjustPushbackLevel('moderate', 'harder'), 'firm');
  const pbPrompt = generateSocraticPushbackPrompt({
    level: 'moderate',
    zone: 'Core',
    attemptNumber: 2,
    stepTitleVi: 'Bằng chứng Phản bác',
    stepTitleEn: 'Evidence Against',
  });
  assert.equal(pbPrompt.shouldHoldStep, true);

  // Protocol 1: CBT 7-Step Thought Record with Accuracy Check
  const trTrue = evaluateThoughtRecordComplete({
    situation: 'Công ty thông báo cắt giảm nhân sự',
    automaticThought: 'Tôi vừa bị mất việc hôm nay',
    affectFamily: 'Sadness',
    preIntensity: 8,
    evidenceFor: 'Đã nhận quyết định chính thức',
    evidenceAgainst: '',
    isObjectivelyTrueFact: true,
    postIntensity: 7,
  });
  assert.equal(trTrue.outcome, 'accurate-thought-exit');
  assert.equal(trTrue.accuracyCheck.pushbackLevelForcedTo, 'off');

  // Protocol 2: CBT Behavioral Activation with Mandatory Rest Check & Confidence >= 7/10
  const baRest = evaluateBehavioralActivation({
    needsBiologicalRest: true,
    chosenActivity: 'Chạy bộ',
    confidenceScore: 8,
    predictedPleasure: 5,
    predictedMastery: 5,
    obstacle: 'Mệt',
    twoMinuteFallback: 'Nghỉ',
  });
  assert.equal(baRest.restCheckTriggered, true);
  assert.equal(baRest.outcome, 'justified-exit');

  const baLowConf = evaluateBehavioralActivation({
    needsBiologicalRest: false,
    chosenActivity: 'Dọn toàn bộ ngôi nhà 3 tầng',
    confidenceScore: 4, // < 7/10 must require micro-shrinking!
    predictedPleasure: 3,
    predictedMastery: 8,
    obstacle: 'Quá mệt',
    twoMinuteFallback: 'Dọn 1 góc bàn 2 phút',
  });
  assert.equal(baLowConf.confidencePassed, false);
  assert.ok(baLowConf.requireMicroShrinkPromptVi);

  // Protocol 3: TEAM-CBT Paradoxical Agenda Setting
  const pas = evaluateParadoxicalAgendaSetting({
    symptomTarget: 'anxiety',
    wouldPressMagicButton: false,
    positiveBenefitsOfSymptom: ['Bảo vệ gia đình', 'Chuẩn bị kỹ'],
    coreValuesRevealed: ['Trách nhiệm'],
    initialIntensityPercent: 85,
    magicDialTargetPercent: 25,
    externalizedCriticAttack: 'Mày phải hoàn hảo',
    selfDefenseAndAcceptanceReply: 'Tôi là con người',
    doubleStandardCompassionateFriendReply: 'Tôi sẽ thông cảm cho bạn mình',
  });
  assert.equal(pas.outcomeResistanceMelted, true);

  // Protocol 4: DBT Opposite Action with Justified Check
  const oaDanger = evaluateOppositeAction({
    emotion: 'Anxiety',
    actionUrge: 'Rút lui khỏi nơi nguy hiểm',
    isRealWorldDangerPresent: true,
    doesUrgeFitObjectiveFacts: true,
    oppositeActionPlan: '',
  });
  assert.equal(oaDanger.outcome, 'justified-exit');
  assert.equal(oaDanger.pushbackOff, true);

  // Protocol 5: DBT Wise Mind with Harsh Self-Critic Guard & "Nothing yet" outcome
  const wm = evaluateWiseMindProtocol({
    dilemmaQuestion: 'Có nên đổi việc lúc này?',
    emotionMindVoice: 'Muốn nghỉ ngay',
    reasonableMindVoice: 'Lý trí bảo tôi là kẻ yếu đuối và vô dụng',
    breathingPauseCompleted: true,
    resolutionType: 'nothing-yet',
    wiseMindSynthesisText: '',
    nextStepOrRevisitTime: 'Cuối tuần này',
  });
  assert.equal(wm.criticGuard.isSelfCriticDisguised, true);
  assert.equal(wm.isValidOutcome, true);

  // Protocol 6: DBT Chain Analysis with Hard Stops for self-harm & victimization
  const caSelfHarm = evaluateChainAnalysisProtocol({
    targetBehavior: 'Cắt tay tự hại khi tuyệt vọng',
    promptingEvent: 'Cãi nhau',
    pleaseVulnerabilities: ['Thiếu ngủ'],
    links: [],
    shortTermReliefPros: '',
    longTermCosts: '',
    preventionPlan: '',
    healthyRepairStep: '',
  });
  assert.equal(caSelfHarm.safetyAndShameCheck.hardStopSelfHarm, true);
  assert.equal(caSelfHarm.outcome, 'safety-stop');

  // Protocol 7: DBT DEAR MAN + EAR Roleplay
  const dm = buildDearManScriptAndRoleplay(
    {
      partnerIsAbusiveOrViolent: false,
      theAskOrSayNo: 'Từ chối làm thêm đêm',
      priority: 'self-respect-fast',
      describeCameraFacts: 'Tôi đã làm thêm 3 tối tuần này.',
      expressIFeel: 'Tôi cảm thấy mệt.',
      assertClearAsk: 'Tôi sẽ hoàn thành vào 9h sáng mai.',
      reinforceBenefit: 'Bản báo cáo sáng mai sẽ chính xác hơn.',
      mindfulBrokenRecordPhrase: 'Mình sẽ gửi lúc 9h sáng mai.',
      negotiateTurnTheTables: 'Theo bạn ta ưu tiên mục nào trước?',
    },
    'harder'
  );
  assert.equal(dm.safeToRoleplay, true);
  assert.ok(dm.assembledScript.length > 20);
});

test('4. Anxiety Gold-Standard Hub: Worry Box, Exposure Hierarchy ERP + Safety Behaviors, Prediction Calibration', () => {
  const worry = createWorryBoxEntry({
    rawWorryText: 'Nhỡ đâu 3 năm nữa kinh tế suy thoái thì sao?',
  });
  assert.equal(worry.category, 'hypothetical');
  const sorted = sortAndProcessWorryItem(worry, 'hypothetical', 'Radical Acceptance');
  assert.equal(sorted.updatedItem.status, 'let_go');

  const ladder = buildExposureHierarchyLadder([
    {
      title: 'Đi thang máy 5 tầng',
      exposureType: 'in-vivo-erp',
      baselineSuds: 70,
      notesForSafetyBehaviorCheck: 'Mang theo thuốc trấn an và kiểm tra nhịp tim',
    },
    {
      title: 'Nhìn ảnh thang máy',
      exposureType: 'in-vivo-erp',
      baselineSuds: 30,
    },
  ]);
  assert.equal(ladder[0]?.baselineSuds, 30); // Sorted ascending
  assert.ok((ladder[1]?.detectedSafetyBehaviors.length ?? 0) > 0);

  const stats = computePredictionCalibrationStats([
    {
      id: 'p1',
      createdAt: '2026-11-01',
      eventDescription: 'Họp',
      fearedCatastrophe: 'Bị đuổi',
      predictedProbabilityPercent: 90,
      copingPlanIfTrue: '',
      resolved: true,
      catastropheActuallyHappened: false,
    },
  ]);
  assert.equal(stats.catastrophesThatNeverHappenedCount, 1);
  assert.equal(stats.actualCatastropheRatePercent, 0);
});

test('5. Bipolar & IPSRT Hub: Dual-Pole (-5..+5) Mixed State & Mania Prodrome, IPSRT Anchors, 48h Impulse Vault', () => {
  const mixedLog: DailyMoodAndRhythmLog = {
    id: 'm1',
    userId: 'u1',
    loggedAt: '2026-11-21T08:00:00Z',
    moodPolarity: -3,
    energyLevel: 3, // Depressed mood <= -2 AND High energy >= +2 -> Mixed State!
    irritabilityIntensity: 8,
    anxietyIntensity: 7,
    sleepDurationHours: 4,
    sleepQuality: 2,
    feltNeedForSleep: 'reduced_need',
    ipsrtAnchors: {
      outOfBedTime: '07:05',
      firstSocialContactTime: '08:30',
      workOrStudyStartTime: '09:00',
      dinnerTime: '19:00',
      bedTime: '22:30',
    },
    medicationsTaken: [],
    mixedStateAlertTriggered: true,
    maniaProdromeAlertTriggered: false,
  };

  const analysis = analyzeBipolarMoodAndSleepLogs(mixedLog);
  assert.equal(analysis.isMixedState, true);
  assert.equal(analysis.recommendedImmediateProtocol, 'tipp');

  const ipsrt = computeIPSRTSocialRhythmScore(mixedLog.ipsrtAnchors);
  assert.ok(ipsrt.stabilityScorePercent >= 90);

  const vault = create48HourImpulseVaultEntry({
    category: 'financial',
    impulseDescription: 'All-in hết tiền lúc 2h sáng vì ý tưởng thiên tài chắc chắn thắng 100%',
    estimatedCostOrRisk: '100M VND',
    moodPolarityWhenLogged: 3,
    prosConsMatrix: {
      actingOnImpulsePros: [],
      actingOnImpulseCons: [],
      waiting48HoursPros: [],
      waiting48HoursCons: [],
    },
    person1Name: 'A',
    person2Name: 'B',
    nowIso: '2026-11-21T00:00:00.000Z',
  });
  assert.ok(vault.positiveDistortionsDetected.length >= 1);
  const lockCheck = checkImpulseVaultUnlockStatus(vault, '2026-11-21T12:00:00.000Z');
  assert.equal(lockCheck.canUnlockSafely, false);
  assert.equal(lockCheck.hoursRemaining, 36);

  const medCbt = evaluateMedicationAdherenceThought('Mình khỏi rồi không cần Lithium nữa');
  assert.ok(medCbt.balancedAdherenceThoughtVi.length > 20);
  assert.equal(DEFAULT_ULYSSES_CONTRACT.enabled, true);
});

test('6. Clinical Self-Assessments, WebCrypto AES-GCM-256 Encryption, Markdown Export, Grounded RAG Abstention & Clinician Report', async () => {
  const bmsCrisis = scoreClinicalAssessment({ type: 'BMS', itemScores: [12, 2, 10, 5, 2] });
  assert.equal(bmsCrisis.triggersSafetyStop, true);

  const asrmHigh = scoreClinicalAssessment({ type: 'ASRM', itemScores: [2, 2, 2, 1, 1] });
  assert.equal(asrmHigh.triggersHypomaniaGuard, true);

  const safetyStop = runFourLayerSafetyGate({
    text: 'Tôi không muốn sống nữa',
    distressIntensity: 9,
  });
  assert.equal(safetyStop.recommendedRoute, 'safety-stop');

  // WebCrypto AES-GCM-256 round-trip encryption & decryption
  const secretPayload = JSON.stringify({ thought: 'Private CBT Thought Record', mood: -2 });
  const encrypted = await encryptClinicalDataAesGcm(secretPayload, 'strong-user-passphrase');
  assert.equal(encrypted.version, 'aes-gcm-256-v1');
  const decrypted = await decryptClinicalDataAesGcm(encrypted, 'strong-user-passphrase');
  assert.equal(decrypted, secretPayload);

  // Markdown session export YYYYMMDD-[technique]-NN.md
  const exported = exportSessionToMarkdown(
    {
      id: 's1',
      type: 'cognitive-toolkit-session',
      technique: 'thought-record',
      phase0Mode: 'instrumental',
      date: '2026-11-21',
      time: '09:15',
      channel: 'web-pwa',
      language: 'vi',
      pushbackLevel: 'moderate',
      preIntensity: 7,
      postIntensity: 3,
      emotions: ['Anxiety'],
      negativeDistortionsIdentified: ['catastrophizing'],
      positiveDistortionsIdentified: [],
      selfDefeatingBeliefsIdentified: [],
      stepsCompleted: 7,
      stepsSkipped: [],
      outcome: 'completed',
      structuredStepsPayload: { step1: 'Situation' },
    },
    1
  );
  assert.equal(exported.filename, '20261121-thought-record-01.md');
  assert.ok(exported.markdownContent.includes('outcome: completed'));

  // Grounded RAG strict 0.46 threshold abstention
  const abstained = await queryClinicalCompanionWithFallback({
    config: DEFAULT_AI_CONNECTION_CONFIG,
    userPrompt: 'Cách đầu tư chứng khoán?',
    activeTechnique: 'thought-record',
    ragSimilarityScore: 0.21, // < 0.46 -> 100% abstention
  });
  assert.equal(abstained.abstainedFromUncitedProtocol, true);
  assert.equal(abstained.citationTag, null);

  const cited = await queryClinicalCompanionWithFallback({
    config: DEFAULT_AI_CONNECTION_CONFIG,
    userPrompt: 'Làm sao tìm bằng chứng phản bác?',
    activeTechnique: 'thought-record',
    ragSimilarityScore: 0.82,
    ragChunkId: 'thought-record#step-5',
  });
  assert.equal(cited.abstainedFromUncitedProtocol, false);
  assert.equal(cited.citationTag, '[KB:thought-record#step-5]');

  const report = buildClinicianSummaryReport({
    patientAlias: 'BN-01',
    moodLogs: [],
    assessments: [asrmHigh],
    sessions: [],
    ipsrtAverageStabilityPercent: 88,
  });
  assert.ok(report.e2eeShareUrlFragment.includes('#key='));
});

import {
  retrieveGroundedClinicalChunks,
  appendSafetyAuditLog,
  verifySafetyAuditChain,
  upsertE2eeSyncBlobs,
  pullE2eeSyncBlobs,
} from '../src/lib/supabase-edge.ts';

test('7. Vercel + Supabase Serverless Edge Stack: Grounded RAG (0.46), Zero-Knowledge E2EE Sync & Hash-Chained Audit Log', async () => {
  // 1. In-scope clinical query passes 0.46 threshold and cites [KB:chunk_id]
  const inScope = retrieveGroundedClinicalChunks('Làm sao dùng DBT TIPP nước lạnh khi hoảng loạn?', 3, 0.46);
  assert.equal(inScope.abstained, false);
  assert.ok(inScope.topScore >= 0.46);
  assert.equal(inScope.results[0]?.citation, '[KB:tipp#medical-screening]');

  // 2. Out-of-scope query strictly abstains (< 0.46) with 100% Abstention Accuracy
  const outOfScope = retrieveGroundedClinicalChunks('Công thức nấu phở bò ngon nhất Hà Nội', 3, 0.46);
  assert.equal(outOfScope.abstained, true);
  assert.equal(outOfScope.results.length, 0);
  assert.ok((outOfScope.empathyFallbackVi?.length ?? 0) > 20);

  // 3. Zero-Knowledge E2EE Sync round-trip on Serverless / Supabase Adapter
  const pushRes = await upsertE2eeSyncBlobs([
    {
      blobId: 'blob-thought-01',
      userId: 'user-vn-01',
      recordType: 'cbt_dbt_session',
      ciphertextB64: 'AES_GCM_CIPHERTEXT_BASE64',
      ivB64: 'IV_BASE64',
      authTagB64: 'TAG_BASE64',
      keyId: 'client-master-v1',
      clientUpdatedAt: '2026-11-21T08:30:00.000Z',
    },
  ]);
  assert.equal(pushRes.syncedCount, 1);

  const pullRes = await pullE2eeSyncBlobs('user-vn-01');
  assert.equal(pullRes.blobs.length, 1);
  assert.equal(pullRes.blobs[0]?.blobId, 'blob-thought-01');

  // 4. SHA-256 Hash-Chained Safety Audit Log integrity
  appendSafetyAuditLog({
    userId: 'user-vn-01',
    eventType: 'CRISIS_SAFETY_STOP',
    layerTriggered: 1,
    outcome: 'safety-stop',
  });
  appendSafetyAuditLog({
    userId: 'user-vn-01',
    eventType: 'CHAIN_ANALYSIS_HARD_STOP',
    layerTriggered: 1,
    outcome: 'safety-stop',
  });
  const verified = verifySafetyAuditChain();
  assert.equal(verified.valid, true);
  assert.equal(verified.totalEntries, 2);
});

