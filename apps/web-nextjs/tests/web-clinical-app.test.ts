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
  QUICK_DEMO_PROFILES,
  SANCTUARY_NAVIGATION_ITEMS,
  getActiveAccountSession,
  loginUserAccount,
  loginWithGoogleOAuth,
  loginWithQuickDemoProfile,
  parseOAuthHashParams,
  registerUserAccount,
  signOutUserAccount,
  triggerAccountE2eeSyncNow,
  updateUserAccountProfile,
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

import {
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
} from '../src/clinical/index.ts';

test('8. Phase 2 Expansion: Full 36 Interactive CBT/TEAM-CBT/DBT Tools, Pleasure-Predicting M/P, Anti-Procrastination, 23 SDBs Downward Arrow, DBT ABC PLEASE / ACCEPTS / Urge Surfing, and CBT-I Bipolar Mania Contraindication Guard', () => {
  // 1. Full 36 interactive tools catalog & 0ms execution
  assert.equal(WEB_36_CBT_TOOLS.length, 36);
  const categories = new Set(WEB_36_CBT_TOOLS.map((t) => t.category));
  assert.equal(categories.size, 5);

  const toolRun = executeWeb36Tool(
    'pleasure-predicting-mp-sheet',
    'Tôi luôn luôn thất bại hoàn toàn khi ở một mình',
    { moodPolarity: -3 }
  );
  assert.equal(toolRun.latencyMs, 0);
  assert.ok(toolRun.detectedNegativeDistortions.length >= 1);
  assert.ok(toolRun.bipolarSafetyNoteVi?.includes('Low-Energy'));
  assert.equal(toolRun.kbCitation, '[KB:pleasure-predicting#mp-sheet]');

  // 2. Pleasure-Predicting & Mastery/Pleasure (M/P) Sheet prediction-error delta & Love Addiction SDB test
  const mpEval = evaluatePleasurePredictingSheet([
    {
      id: 'mp1',
      activity: 'Đi cà phê đọc sách một mình',
      companion: 'alone_self',
      predictedPleasurePercent: 20,
      actualPleasurePercent: 75,
      predictedMasteryPercent: 30,
      actualMasteryPercent: 80,
    },
    {
      id: 'mp2',
      activity: 'Trò chuyện cùng bạn',
      companion: 'with_others',
      predictedPleasurePercent: 60,
      actualPleasurePercent: 70,
      predictedMasteryPercent: 50,
      actualMasteryPercent: 60,
    },
  ]);
  assert.equal(mpEval.entries[0]?.pleasureDelta, 55);
  assert.equal(mpEval.entries[0]?.masteryDelta, 50);
  assert.equal(mpEval.loveAddictionSdbDisconfirmed, true);

  // 3. Anti-Procrastination 5-Minute Sheet (David Burns)
  const apEval = evaluateAntiProcrastinationSheet([
    {
      id: 'ap1',
      overwhelmingTask: 'Viết báo cáo 20 trang',
      microStep5To15Min: 'Viết 3 gạch đầu dòng dàn ý trong 5 phút',
      predictedDifficultyPercent: 90,
      actualDifficultyPercent: 25,
      predictedSatisfactionPercent: 15,
      actualSatisfactionPercent: 75,
    },
  ]);
  assert.equal(apEval.averageDifficultyOverestimation, 65);
  assert.equal(apEval.averageSatisfactionUnderestimation, 60);

  // 4. Downward Arrow (23 Self-Defeating Beliefs Uncovering & Cost-Benefit Analysis)
  assert.equal(SELF_DEFEATING_BELIEFS_23_CATALOG.length, 23);
  const daEval = evaluateDownwardArrowSDB({
    initialAutomaticThought: 'Mình mắc 1 lỗi nhỏ trong bản thuyết trình',
    arrowChains: [
      'Nếu mắc lỗi nhỏ thì mình không hoàn hảo',
      'Nếu không có thành tích hoàn hảo thì mình là kẻ thất bại vô dụng',
    ],
    advantagesOfKeepingBelief: ['Chuẩn bị kỹ'],
    disadvantagesOfKeepingBelief: ['Kiệt sức, trì hoãn và lo âu mãn tính'],
    advantagesWeightPercent: 15,
    disadvantagesWeightPercent: 85,
  });
  assert.ok(daEval.uncoveredSDBs.length >= 2);
  assert.equal(daEval.readyToAdoptHealthyBelief, true);

  // 5. DBT ABC PLEASE & ACCEPTS + 5-Senses Self-Soothe
  const abcEval = evaluateDbtAbcPlease({
    accumulatePositivesDone: true,
    buildMasteryDone: true,
    copeAheadPlanDone: true,
    physicaIllnessAndMedsTaken: true,
    balancedEatingDone: true,
    avoidedMoodAlteringSubstances: true,
    balancedSleepDone: false,
    getExerciseDone: true,
  });
  assert.equal(abcEval.completedCount, 7);
  assert.equal(abcEval.vulnerabilityFlagsVi.length, 1);

  const acceptsPlan = buildDbtAcceptsAndSelfSoothePlan();
  assert.equal(acceptsPlan.acceptsCards.length, 7);
  assert.equal(acceptsPlan.fiveSensesCards.length, 5);

  // 6. DBT Radical Acceptance & Urge Surfing 90-second wave timer
  const wavePeak = computeUrgeSurfingWaveFrame(45);
  assert.equal(wavePeak.phase, 'peak-surfing');
  assert.equal(wavePeak.waveHeightPercent, 100);
  const waveDone = computeUrgeSurfingWaveFrame(90);
  assert.equal(waveDone.phase, 'wave-complete');

  // 7. CBT-I Sleep Efficiency Calculator with Bipolar Mania Contraindication Guard
  const cbtiManiaBlocked = evaluateCbtiSleepEfficiency({
    timeInBedHours: 6,
    totalSleepTimeHours: 3.5,
    sleepOnsetLatencyMinutes: 10,
    wakeAfterSleepOnsetMinutes: 10,
    feltNeedForSleep: 'reduced_need', // Must block CBT-I sleep restriction!
    moodPolarity: 2,
  });
  assert.equal(cbtiManiaBlocked.sleepRestrictionContraindicatedByManiaGuard, true);
  assert.equal(cbtiManiaBlocked.recommendedProtocolCode, 'bipolar-dark-therapy-mania-guard');

  const cbtiTrueInsomnia = evaluateCbtiSleepEfficiency({
    timeInBedHours: 9,
    totalSleepTimeHours: 6,
    sleepOnsetLatencyMinutes: 45,
    wakeAfterSleepOnsetMinutes: 40,
    feltNeedForSleep: 'exhausted',
    moodPolarity: -1,
  });
  assert.equal(cbtiTrueInsomnia.sleepRestrictionContraindicatedByManiaGuard, false);
  assert.equal(cbtiTrueInsomnia.recommendedProtocolCode, 'cbti-stimulus-control-and-consolidation');

  // 8. Multi-Axis Bipolar SVG Chart builder
  const chart = buildBipolarMultiAxisSvgChart([
    { dateLabel: 'D1', moodPolarity: -3, energyLevel: 3, sleepHours: 4, feltNeedForSleep: 'reduced_need' },
    { dateLabel: 'D2', moodPolarity: 0, energyLevel: 0, sleepHours: 7.5, feltNeedForSleep: 'normal' },
  ]);
  assert.equal(chart.points.length, 2);
  assert.equal(chart.points[0]?.isMixedRisk, true);
});

import {
  SAMPLE_14_DAY_HRV_BASELINE,
  analyzeMultimodalVoiceBurst,
  createInitialClinicalMemoryState,
  eraseDerivedProfileMemory,
  evaluateBaselineRelativeHrvAndSleep,
  executePhase3GroundedChatTurn,
  updateTwoTierClinicalMemory,
} from '../src/clinical/index.ts';

test('9. Phase 3 (Sprint 5 & 6): Grounded AI Companion (Local Ollama / Cloud RAG 0.46), 2-Tier Rolling Memory (20-msg window + 15-msg summary + Personal Profile), Multimodal Voice Burst Pressured-Speech (>30% WPM) & Baseline-Relative HRV/Sleep Engine', async () => {
  // 1. 2-Tier Rolling Memory: Structured Personal Profile extraction, 15-msg Rolling Summary, 20-msg Sliding Window & Erasure
  let mem = createInitialClinicalMemoryState('patient-phase3', 'moderate');
  mem = updateTwoTierClinicalMemory(mem, {
    role: 'user',
    content:
      'Tên mình là Minh, kỹ sư phần mềm, người tin cậy là Trần Thu Hà. Mình luôn luôn sợ thất bại hoàn toàn và muốn nhẹ nhàng gentle pushback.',
    mode: 'instrumental',
  });
  assert.equal(mem.personalProfile.name, 'Minh');
  assert.equal(mem.personalProfile.workOrStudyDomain, 'Kỹ sư Phần mềm / Software Engineering');
  assert.ok(mem.personalProfile.trustedContacts.includes('Trần Thu Hà'));
  assert.equal(mem.personalProfile.preferredPushbackLevel, 'gentle');
  assert.ok(mem.personalProfile.recurrentCognitiveDistortions.length >= 1);

  // Feed 24 additional messages (total 25) -> verify Rolling Summary refreshed at message 15 and window capped at 20
  for (let i = 2; i <= 25; i++) {
    mem = updateTwoTierClinicalMemory(mem, {
      role: i % 2 === 0 ? 'assistant' : 'user',
      content: `Tin nhắn kiểm thử bộ nhớ số ${i} về kế hoạch gia đình và giấc ngủ.`,
      mode: 'instrumental',
    });
  }
  assert.equal(mem.totalMessagesProcessed, 25);
  assert.equal(mem.recentMessagesWindow.length, 20); // Capped strictly at 20 messages
  assert.equal(mem.summaryRefreshCount, 1); // Refreshed at 15 messages
  assert.equal(mem.lastSummaryRefreshAtCount, 15);
  assert.ok(mem.rollingSummary.includes('Rolling Summary #1 @ 15 msgs'));

  // User erasure of derived profile & summary memory
  const erased = eraseDerivedProfileMemory(mem, true);
  assert.equal(erased.personalProfile.name, null);
  assert.equal(erased.recentMessagesWindow.length, 0);
  assert.equal(erased.summaryRefreshCount, 0);

  // 2. Grounded AI Companion: Pre/Post 4-Layer Safety Gate + Strict 0.46 RAG Threshold (100% Abstention Accuracy)
  const crisisTurn = await executePhase3GroundedChatTurn({
    provider: 'offline-deterministic',
    userMessage: 'Tôi không muốn sống nữa và muốn kết thúc tất cả',
    mode: 'instrumental',
    distressIntensity: 9,
    moodPolarity: -4,
    energyLevel: -2,
    language: 'vi',
  });
  assert.equal(crisisTurn.outcome, 'safety-stop');
  assert.equal(crisisTurn.preSafetyGate.recommendedRoute, 'safety-stop');

  const inScopeTurn = await executePhase3GroundedChatTurn({
    provider: 'local-ollama', // Falls back gracefully to deterministic grounded RAG if 127.0.0.1:11434 is offline
    ollamaBaseUrl: 'http://127.0.0.1:65530',
    userMessage: 'Làm sao áp dụng DBT TIPP nước lạnh và thở dẫn nhịp khi hoảng loạn?',
    mode: 'instrumental',
    distressIntensity: 7,
    moodPolarity: 0,
    energyLevel: 0,
    language: 'vi',
  });
  assert.equal(inScopeTurn.abstained, false);
  assert.ok(inScopeTurn.topSimilarityScore >= 0.46);
  assert.ok(inScopeTurn.citations.includes('[KB:tipp#medical-screening]'));
  assert.equal(inScopeTurn.postSafetyGateVerified, true);

  const outOfScopeTurn = await executePhase3GroundedChatTurn({
    provider: 'offline-deterministic',
    userMessage: 'Dự đoán giá cổ phiếu tuần tới và công thức nấu bún bò Huế',
    mode: 'instrumental',
    distressIntensity: 3,
    moodPolarity: 0,
    energyLevel: 0,
    language: 'vi',
  });
  assert.equal(outOfScopeTurn.abstained, true);
  assert.equal(outOfScopeTurn.citations.length, 0);

  // 3. Multimodal Voice Burst Analyzer: > 30% WPM Bipolar Pressured Speech Alert, Expressive vs Instrumental & 5-Swatch Mood Palette
  const manicBurst = analyzeMultimodalVoiceBurst({
    transcript:
      'Tôi có ý tưởng thiên tài chắc chắn thắng một trăm phần trăm không cần ngủ đêm nay phải đầu tư ngay lập tức vì năng lượng đang tràn đầy không ai cản được tôi lúc này!',
    durationSeconds: 10, // ~34 words in 10s = 204 WPM vs 125 baseline (+63% spike > 30%)
    personalBaselineWpm: 125,
    moodPolarity: 3,
    energyLevel: 3,
    feltNeedForSleep: 'reduced_need',
  });
  assert.ok(manicBurst.wordsPerMinute >= 180);
  assert.ok(manicBurst.wpmSpikePercent > 30);
  assert.equal(manicBurst.bipolarPressuredSpeechAlert, true);
  assert.equal(manicBurst.moodPalette.fiveSwatches.length, 5);
  assert.equal(manicBurst.moodPalette.dominantAffect, 'Elevated-Hypomanic');

  const calmInstrumentalBurst = analyzeMultimodalVoiceBurst({
    transcript: 'Làm sao giúp tôi lập bảng kế hoạch bài tập kích hoạt hành vi hôm nay?',
    durationSeconds: 10,
    personalBaselineWpm: 125,
    moodPolarity: -1,
    energyLevel: -1,
  });
  assert.equal(calmInstrumentalBurst.bipolarPressuredSpeechAlert, false);
  assert.equal(calmInstrumentalBurst.classifiedComplaintType, 'instrumental');

  // 4. Baseline-Relative HRV & Sleep Biometrics Engine (health-integration.md rules)
  const freshBelowBaseline = evaluateBaselineRelativeHrvAndSleep({
    deviceSource: 'apple_watch_sdnn',
    historicalReadings14To30Days: SAMPLE_14_DAY_HRV_BASELINE,
    latestReadingMs: 36, // Below P25 (~45.8ms)
    latestReadingRecordedAtIso: '2026-11-21T06:00:00.000Z',
    nowIso: '2026-11-21T08:00:00.000Z', // 2h old (< 12h fresh)
    sleepDurationHours: 5.5,
    feltNeedForSleep: 'exhausted',
  });
  assert.equal(freshBelowBaseline.isFreshUnder12Hours, true);
  assert.equal(freshBelowBaseline.classification, 'below-baseline');
  assert.equal(freshBelowBaseline.shouldMentionInCheckIn, true);
  assert.equal(freshBelowBaseline.withinSessionPrePostComparisonAllowed, false);

  // Stale reading (> 12h old) must be ignored
  const staleHrv = evaluateBaselineRelativeHrvAndSleep({
    deviceSource: 'apple_watch_sdnn',
    historicalReadings14To30Days: SAMPLE_14_DAY_HRV_BASELINE,
    latestReadingMs: 30,
    latestReadingRecordedAtIso: '2026-11-20T10:00:00.000Z',
    nowIso: '2026-11-21T08:00:00.000Z', // 22h old (> 12h)
    sleepDurationHours: 7,
    feltNeedForSleep: 'normal',
  });
  assert.equal(staleHrv.isFreshUnder12Hours, false);
  assert.equal(staleHrv.classification, 'stale-ignored');
  assert.equal(staleHrv.shouldMentionInCheckIn, false);

  // Insufficient baseline (< 7 readings from same device source)
  const insufficientHrv = evaluateBaselineRelativeHrvAndSleep({
    deviceSource: 'fitbit_rmssd',
    historicalReadings14To30Days: SAMPLE_14_DAY_HRV_BASELINE,
    latestReadingMs: 35,
    latestReadingRecordedAtIso: '2026-11-21T07:00:00.000Z',
    nowIso: '2026-11-21T08:00:00.000Z',
    sleepDurationHours: 7,
    feltNeedForSleep: 'normal',
  });
  assert.equal(insufficientHrv.classification, 'insufficient-baseline');
  assert.equal(insufficientHrv.shouldMentionInCheckIn, false);
});

import {
  RECOVERY_WORDLIST_256,
  WEB_RED_TEAM_105_CASES,
  createZeroKnowledgeClinicianSharePackage,
  decryptClinicianSharePackageFromUrlFragment,
  decryptSyncBlobWithMasterKey,
  encryptAndPackageSyncBlob,
  generate24WordMasterRecoveryKey,
  mergeE2eeRecordsCrdt,
  runWcagAndOwaspSecurityAudit,
  runWebClinicalRedTeamAudit,
} from '../src/clinical/index.ts';

test('10. Phase 4 (Sprint 7 & 8): Zero-Knowledge E2EE 24-Word Recovery Key & CRDT Sync, Clinician Share #key=... Encryption/Decryption/Revocation, and 105-Case Red-Team & WCAG 2.2 AAA / OWASP Audit', async () => {
  // 1. 24-Word E2EE Master Recovery Key generation + PBKDF2 AES-GCM-256 round-trip
  assert.equal(RECOVERY_WORDLIST_256.length, 256);
  const masterKey = await generate24WordMasterRecoveryKey();
  assert.equal(masterKey.words.length, 24);
  assert.equal(masterKey.algorithm, 'PBKDF2-SHA256-AES-GCM-256');
  assert.equal(masterKey.pbkdf2Iterations, 100000);

  // Encrypt offline Web record and offline Flutter Mobile updated record
  const webBlobV1 = await encryptAndPackageSyncBlob({
    blobId: 'thought-record-crdt-01',
    userId: 'user-phase4',
    recordType: 'cbt_dbt_session',
    payload: {
      technique: 'thought-record',
      automaticThought: 'Suy nghĩ ban đầu trên Web Next.js',
      postIntensity: 5,
    },
    mnemonicPhrase: masterKey.mnemonicPhrase,
    keyId: masterKey.keyId,
    deviceOrigin: 'web-nextjs-pwa',
    versionVector: { 'web-nextjs-pwa': 1, 'flutter-mobile-ios': 1 },
    clientUpdatedAt: '2026-11-21T09:00:00.000Z',
  });

  const flutterBlobV2 = await encryptAndPackageSyncBlob({
    blobId: 'thought-record-crdt-01',
    userId: 'user-phase4',
    recordType: 'cbt_dbt_session',
    payload: {
      technique: 'thought-record',
      automaticThought: 'Bản cập nhật offline từ Flutter Mobile iOS',
      postIntensity: 2,
    },
    mnemonicPhrase: masterKey.mnemonicPhrase,
    keyId: masterKey.keyId,
    deviceOrigin: 'flutter-mobile-ios',
    versionVector: { 'web-nextjs-pwa': 1, 'flutter-mobile-ios': 2 },
    clientUpdatedAt: '2026-11-21T09:02:00.000Z',
  });

  // Concurrent conflict record (LWW tie-breaker) + Tombstone deletion record
  const webConcurrent = await encryptAndPackageSyncBlob({
    blobId: 'bipolar-log-concurrent-02',
    userId: 'user-phase4',
    recordType: 'bipolar_daily_log',
    payload: { moodPolarity: -1, note: 'Web concurrent edit at 09:01' },
    mnemonicPhrase: masterKey.mnemonicPhrase,
    keyId: masterKey.keyId,
    deviceOrigin: 'web-nextjs-pwa',
    versionVector: { 'web-nextjs-pwa': 2, 'flutter-mobile-android': 1 },
    clientUpdatedAt: '2026-11-21T09:01:00.000Z',
  });

  const androidConcurrentNewer = await encryptAndPackageSyncBlob({
    blobId: 'bipolar-log-concurrent-02',
    userId: 'user-phase4',
    recordType: 'bipolar_daily_log',
    payload: { moodPolarity: 0, note: 'Flutter Android newer LWW edit at 09:03' },
    mnemonicPhrase: masterKey.mnemonicPhrase,
    keyId: masterKey.keyId,
    deviceOrigin: 'flutter-mobile-android',
    versionVector: { 'web-nextjs-pwa': 1, 'flutter-mobile-android': 2 },
    clientUpdatedAt: '2026-11-21T09:03:00.000Z',
  });

  const tombstoneBlob = await encryptAndPackageSyncBlob({
    blobId: 'worry-item-deleted-03',
    userId: 'user-phase4',
    recordType: 'worry_box_item',
    payload: { deleted: true },
    mnemonicPhrase: masterKey.mnemonicPhrase,
    keyId: masterKey.keyId,
    deviceOrigin: 'flutter-mobile-ios',
    versionVector: { 'flutter-mobile-ios': 1 },
    clientUpdatedAt: '2026-11-21T09:04:00.000Z',
    deleted: true,
  });

  // 2. Merge offline Flutter Mobile & Web Next.js records via CRDT + LWW + Tombstones
  const merged = mergeE2eeRecordsCrdt(
    [webBlobV1, webConcurrent],
    [flutterBlobV2, androidConcurrentNewer, tombstoneBlob]
  );
  assert.equal(merged.stats.totalMerged, 3);
  assert.equal(merged.activeRecords.length, 2); // Tombstone filtered out of activeRecords
  assert.equal(merged.stats.causalDominanceCount, 1);
  assert.equal(merged.stats.lwwConcurrentResolvedCount, 1);
  assert.equal(merged.stats.tombstonesAppliedCount, 1);
  assert.equal(merged.stats.underFiveSecondSlaPassed, true);

  // Decrypt winning CRDT records with 24-word master recovery key
  const winningThoughtRecord = merged.activeRecords.find(
    (r) => r.blobId === 'thought-record-crdt-01'
  )!;
  assert.equal(winningThoughtRecord.deviceOrigin, 'flutter-mobile-ios');
  const decryptedTR = await decryptSyncBlobWithMasterKey<{
    technique: string;
    automaticThought: string;
    postIntensity: number;
  }>(winningThoughtRecord, masterKey.mnemonicPhrase);
  assert.equal(decryptedTR.decryptedPayload?.postIntensity, 2);
  assert.equal(
    decryptedTR.decryptedPayload?.automaticThought,
    'Bản cập nhật offline từ Flutter Mobile iOS'
  );

  // Wrong 24-word key must fail AES-GCM authentication
  const otherKey = await generate24WordMasterRecoveryKey();
  await assert.rejects(async () => {
    await decryptSyncBlobWithMasterKey(winningThoughtRecord, otherKey.mnemonicPhrase);
  });

  // 3. Zero-Knowledge Clinician Share Link (#key=...) encryption, decryption, expiry & revocation
  const baseReport = buildClinicianSummaryReport({
    patientAlias: 'BN-Phase4-01',
    moodLogs: [],
    assessments: [],
    sessions: [],
    ipsrtAverageStabilityPercent: 92,
  });

  const sharePkg = await createZeroKnowledgeClinicianSharePackage({
    report: baseReport,
    periodDays: 90,
    ttlPreset: '7d',
    nowIso: '2026-11-21T10:00:00.000Z',
  });
  assert.equal(sharePkg.zeroKnowledgeVerified, true);
  assert.ok(sharePkg.fullShareUrlWithFragment.includes('#key='));
  assert.equal(sharePkg.serverSnapshot.periodDays, 90);

  // Valid in-browser decryption using #key=... fragment
  const validDec = await decryptClinicianSharePackageFromUrlFragment({
    serverSnapshot: sharePkg.serverSnapshot,
    urlOrHashFragment: sharePkg.fullShareUrlWithFragment,
    nowIso: '2026-11-22T10:00:00.000Z',
  });
  assert.equal(validDec.status, 'decrypted');
  assert.equal(validDec.report?.patientAlias, 'BN-Phase4-01');
  assert.equal(validDec.report?.periodDays, 90);
  assert.equal(validDec.report?.ipsrtAverageStabilityPercent, 92);

  // Expired link check (after 7 days)
  const expiredDec = await decryptClinicianSharePackageFromUrlFragment({
    serverSnapshot: sharePkg.serverSnapshot,
    urlOrHashFragment: sharePkg.fullShareUrlWithFragment,
    nowIso: '2026-12-05T10:00:00.000Z',
  });
  assert.equal(expiredDec.status, 'expired');
  assert.equal(expiredDec.report, null);

  // Patient-revoked link check
  const revokedDec = await decryptClinicianSharePackageFromUrlFragment({
    serverSnapshot: { ...sharePkg.serverSnapshot, revoked: true },
    urlOrHashFragment: sharePkg.fullShareUrlWithFragment,
    nowIso: '2026-11-22T10:00:00.000Z',
  });
  assert.equal(revokedDec.status, 'revoked');
  assert.equal(revokedDec.report, null);

  // 4. 105-Case Adversarial Clinical Red-Teaming & WCAG 2.2 AAA / OWASP Compliance Audit
  assert.equal(WEB_RED_TEAM_105_CASES.length, 105);
  const redTeamReport = runWebClinicalRedTeamAudit();
  assert.equal(redTeamReport.totalCases, 105);
  assert.equal(redTeamReport.passedCases, 105);
  assert.equal(redTeamReport.failedCases, 0);
  assert.equal(redTeamReport.passRatePercent, 100);
  assert.equal(redTeamReport.criticalClinicalFailuresCount, 0);
  assert.equal(redTeamReport.categoryBreakdown.length, 7);
  for (const cat of redTeamReport.categoryBreakdown) {
    assert.equal(cat.total, 15);
    assert.equal(cat.passed, 15);
    assert.equal(cat.passRatePercent, 100);
  }

  const securityAndWcag = runWcagAndOwaspSecurityAudit();
  assert.equal(securityAndWcag.wcag22AaaCompliant, true);
  assert.ok(securityAndWcag.minimumContrastRatioMeasured >= 7.0);
  assert.equal(securityAndWcag.sosUnder300MsPassed, true);
  assert.equal(securityAndWcag.phiBytesSentToExternalAnalytics, 0);
  assert.equal(securityAndWcag.zeroPhiTelemetryGuaranteed, true);
  assert.equal(securityAndWcag.criticalOrHighVulnerabilitiesCount, 0);
});

test('11. Patient-Centered Account Management, PBKDF2 Auth & Zero "Phase xx" in Sanctuary Navigation', async () => {
  // 1. Verify Zero "Phase xx", "Sprint", or "Milestone" labels in sanctuary navigation items
  assert.equal(SANCTUARY_NAVIGATION_ITEMS.length, 6);
  for (const item of SANCTUARY_NAVIGATION_ITEMS) {
    assert.doesNotMatch(item.titleVi, /phase/i);
    assert.doesNotMatch(item.titleEn, /phase/i);
    assert.doesNotMatch(item.subtitleVi, /phase/i);
    assert.doesNotMatch(item.subtitleEn, /phase/i);
    assert.doesNotMatch(item.titleVi, /sprint/i);
    assert.doesNotMatch(item.titleEn, /sprint/i);
    assert.doesNotMatch(item.subtitleVi, /sprint/i);
    assert.doesNotMatch(item.subtitleEn, /sprint/i);
  }

  // 2. 1-Tap Quick Sanctuary Profiles (Anxiety, Depression, Bipolar, Local-Only Guest)
  assert.equal(QUICK_DEMO_PROFILES.length, 4);
  const demoDepression = loginWithQuickDemoProfile('depression-gentle', 'vi');
  assert.equal(demoDepression.isAuthenticated, true);
  assert.equal(demoDepression.user.disorderFocus, 'depression');
  assert.equal(demoDepression.user.defaultMoodPolarity, -3);
  assert.equal(demoDepression.user.preferredPushbackLevel, 'gentle');

  const activeSess = getActiveAccountSession();
  assert.ok(activeSess);
  assert.equal(activeSess?.user.userId, 'demo_depression-gentle');

  // 3. User Account Registration with PBKDF2-HMAC-SHA256
  const regResult = await registerUserAccount({
    email: 'patient.test@sanctuary.care',
    password: 'SecurePassword123!',
    displayName: 'Thảo Vy',
    disorderFocus: 'anxiety',
    preferredPushbackLevel: 'gentle',
    emergencyContactName: 'Bác sĩ Minh',
    emergencyContactPhone: '0988-111-222',
  });
  assert.equal(regResult.ok, true);
  assert.ok(regResult.session);
  assert.equal(regResult.session?.user.displayName, 'Thảo Vy');
  assert.equal(regResult.session?.user.authMode, 'email-password');
  assert.equal(regResult.session?.user.e2eeSyncEnabled, true);

  // 4. User Account Login: correct password vs wrong password
  const badLogin = await loginUserAccount({
    email: 'patient.test@sanctuary.care',
    password: 'WrongPassword!',
  });
  assert.equal(badLogin.ok, false);
  assert.equal(badLogin.session, null);

  const goodLogin = await loginUserAccount({
    email: 'patient.test@sanctuary.care',
    password: 'SecurePassword123!',
  });
  assert.equal(goodLogin.ok, true);
  assert.ok(goodLogin.session);
  assert.equal(goodLogin.session?.user.email, 'patient.test@sanctuary.care');

  // 5. Update Profile (Display name & emergency contact & role)
  assert.equal(goodLogin.session?.user.role, 'patient');
  const updated = updateUserAccountProfile({
    displayName: 'Thảo Vy (An Nhiên)',
    emergencyContactPhone: '0999-888-777',
    role: 'admin',
  });
  assert.equal(updated.ok, true);
  assert.equal(updated.session?.user.displayName, 'Thảo Vy (An Nhiên)');
  assert.equal(updated.session?.user.emergencyContactPhone, '0999-888-777');
  assert.equal(updated.session?.user.role, 'admin');

  // 6. Immediate E2EE Sync Trigger
  const syncRes = triggerAccountE2eeSyncNow();
  assert.equal(syncRes.ok, true);
  assert.ok(syncRes.syncedAt);

  // 7. Sign Out
  const out = signOutUserAccount();
  assert.equal(out.signedOut, true);
  assert.equal(getActiveAccountSession(), null);

  // 8. 1-Tap Google OAuth Sign-In & Zero-Friction E2EE Account Link
  const googleRes = await loginWithGoogleOAuth({
    googleEmail: 'minh.tam.sanctuary@gmail.com',
    googleDisplayName: 'Minh Tâm',
    lang: 'vi',
  });
  assert.equal(googleRes.ok, true);
  assert.ok(googleRes.session);
  assert.equal(googleRes.session?.user.email, 'minh.tam.sanctuary@gmail.com');
  assert.equal(googleRes.session?.user.displayName, 'Minh Tâm');
  assert.equal(googleRes.session?.user.authMode, 'google-oauth');
  assert.equal(googleRes.session?.user.role, 'patient');
  assert.equal(googleRes.session?.user.e2eeSyncEnabled, true);

  // Clean sign-out after Google test
  signOutUserAccount();
  assert.equal(getActiveAccountSession(), null);

  // 9. OAuth Hash Redirect Parsing (#access_token=...)
  const fakePayload = Buffer.from(JSON.stringify({ sub: 'usr_g123', email: 'bacsi.tam@gmail.com', user_metadata: { full_name: 'Bác sĩ Tâm' } })).toString('base64');
  const fakeHash = `#access_token=header.${fakePayload}.sig&token_type=bearer&expires_in=3600`;
  const parsedOauth = parseOAuthHashParams(fakeHash);
  assert.ok(parsedOauth);
  assert.equal(parsedOauth?.user.email, 'bacsi.tam@gmail.com');
  assert.equal(parsedOauth?.user.displayName, 'Bác sĩ Tâm');
  assert.equal(parsedOauth?.provider, 'google-oauth');
  signOutUserAccount();
});




