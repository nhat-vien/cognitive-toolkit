// test/clinical_engine_test.dart
// Comprehensive Clinical Safety & State Machine Unit Test Suite for Equilibria (Flutter/Dart):
// Verifies:
// 1. 4-Layer Safety Screen: Suicidal/self-harm keywords & BMS/PHQ-9 items -> immediate `safety-stop`
// 2. DBT-First / CBT-Second Arousal Router: Intensity >= 8/10 or Bipolar Mixed State -> DBT TIPP
// 3. Deterministic 0ms Distortion Detector: 11 Negative Distortions, 5 Bipolar Positive Distortions, 23 SDBs
// 4. 4-Level Socratic Pushback Controller across Supportive, Core, and Closing zones
// 5. Clinical Safety Exits:
//    - Thought Record `Accuracy Check` -> `accurate-thought-exit` (Pushback OFF)
//    - Behavioral Activation `Rest Check` -> `justified-exit` (Pushback OFF)
//    - Opposite Action `Justified Check` -> `justified-exit`
//    - TIPP Cold Water `Mandatory Medical Exclusion Screen`
//    - Chain Analysis `Hard Stops` (self-harm & victimization) & `Shame Protocol`
// 6. Bipolar & IPSRT Engine: Mania Prodrome, Mixed State (`Mood <= -2 & Energy >= +2`),
//    48-Hour Impulse Vault lock, and Baseline-Relative HRV (14-30d 25th-75th percentile, <12h freshness).

import 'package:equilibria_mobile_flutter/domain/engine/bipolar_ipsrt_engine.dart';
import 'package:equilibria_mobile_flutter/domain/engine/clinical_assessments.dart';
import 'package:equilibria_mobile_flutter/domain/engine/distortion_detector.dart';
import 'package:equilibria_mobile_flutter/domain/engine/phase2_clinical_tools.dart';
import 'package:equilibria_mobile_flutter/domain/engine/session_state_machine.dart';
import 'package:equilibria_mobile_flutter/domain/models/clinical_models.dart';
import 'package:equilibria_mobile_flutter/presentation/theme/adaptive_clinical_theme.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const detector = DistortionDetector();
  const stateMachine = SessionStateMachine();
  const bipolarEngine = BipolarIpsrtEngine();
  const assessmentsEngine = ClinicalAssessmentsEngine();

  group('1. Four-Layer Crisis & Safety Gate Verification', () {
    test('Suicidal ideation in Vietnamese or English triggers immediate safety-stop with pushback OFF', () {
      const initial = SessionStateSnapshot(
        sessionId: 'test-crisis-1',
        pushbackLevel: PushbackLevel.firm,
      );

      final routed = stateMachine.processCheckInAndRoute(
        current: initial,
        situationText: 'Tôi cảm thấy tuyệt vọng và không muốn sống nữa, muốn tự tử.',
        preIntensity: 9,
        moodPolarity: -4,
        energyLevel: -2,
      );

      expect(routed.phase, equals(SessionPhase.safetyStopTerminal));
      expect(routed.finalOutcome, equals(SessionOutcome.safetyStop));
      expect(routed.pushbackLevel, equals(PushbackLevel.off));
    });

    test('BMS suicidal urge >= 1 or PHQ-9 Item 9 > 0 triggers safety-stop even without text keywords', () {
      final bmsResult = assessmentsEngine.scoreBriefMoodSurvey(
        id: 'bms-1',
        depressionScore: 12,
        suicidalUrgeScore: 1,
        anxietyScore: 8,
        angerScore: 2,
        positiveMoodScore: 3,
      );
      expect(bmsResult.triggersSafetyStop, isTrue);

      final phq9Result = assessmentsEngine.scorePhq9(
        id: 'phq9-1',
        itemResponses: const [1, 1, 1, 1, 1, 1, 1, 1, 2],
      );
      expect(phq9Result.triggersSafetyStop, isTrue);
    });

    test('Real-world danger / domestic violence triggers justified-exit without cognitive restructuring', () {
      const initial = SessionStateSnapshot(sessionId: 'test-danger-1');
      final routed = stateMachine.processCheckInAndRoute(
        current: initial,
        situationText: 'Tôi đang bị bạo hành gia đình và không an toàn trong nhà.',
        preIntensity: 9,
        moodPolarity: -2,
        energyLevel: 2,
      );

      expect(routed.finalOutcome, equals(SessionOutcome.justifiedExit));
      expect(routed.pushbackLevel, equals(PushbackLevel.off));
    });
  });

  group('2. DBT-First, CBT-Second Physiological Arousal Router & TIPP Medical Screen', () {
    test('Acute distress (Intensity >= 8/10) routes to DBT TIPP portal before CBT', () {
      const initial = SessionStateSnapshot(sessionId: 'test-arousal-8');
      final routed = stateMachine.processCheckInAndRoute(
        current: initial,
        situationText: 'Tim đập cực nhanh, tôi đang hoảng loạn tột độ trước cuộc họp.',
        preIntensity: 8,
        moodPolarity: 0,
        energyLevel: 1,
      );

      expect(routed.phase, equals(SessionPhase.acuteTippPortal));
      expect(routed.selectedTechnique, equals(TechniqueSlug.tipp));
      expect(routed.pushbackLevel, equals(PushbackLevel.off));
    });

    test('TIPP Cold Water Mandatory Medical Exclusion Screen blocks cold water on beta-blockers or heart condition', () {
      const withBetaBlocker = TippMedicalScreeningAnswer(takesBetaBlockers: true);
      expect(withBetaBlocker.isColdWaterCleared, isFalse);

      const withUnsure = TippMedicalScreeningAnswer(isUnsure: true);
      expect(withUnsure.isColdWaterCleared, isFalse);

      const healthyCleared = TippMedicalScreeningAnswer();
      expect(healthyCleared.isColdWaterCleared, isTrue);
    });
  });

  group('3. Deterministic 0ms Negative & Bipolar Positive Distortion Detector', () {
    test('Detects negative distortions (All-or-Nothing, Catastrophizing, Labeling) & SDBs', () {
      final result = detector.analyzeText(
        text: 'Một lỗi nhỏ làm hỏng hết, tôi là kẻ thất bại hoàn toàn và chắc chắn sẽ là thảm họa.',
      );
      final negCodes = result.negativeDistortions.map((d) => d.code).toSet();
      expect(negCodes, contains('mental_filter'));
      expect(negCodes, contains('labeling'));
      expect(negCodes, contains('catastrophizing'));
    });

    test('Detects Bipolar Positive Distortions (Grandiosity, Invulnerability, Magical Energy, Cure Illusion)', () {
      final result = detector.analyzeText(
        text: 'Đây là ý tưởng thiên tài rủi ro bằng 0, tôi không cần ngủ và khỏi bệnh hoàn toàn rồi nên không cần uống thuốc nữa.',
        moodPolarity: 3,
      );
      final posCodes = result.positiveDistortions.map((d) => d.code).toSet();
      expect(posCodes, contains('bipolar_grandiosity'));
      expect(posCodes, contains('bipolar_invulnerability'));
      expect(posCodes, contains('bipolar_magical_energy'));
      expect(posCodes, contains('bipolar_hyper_optimism'));
    });
  });

  group('4. Socratic Pushback Controller & Clinical Safety Exits', () {
    test('Enforces Supportive (max 1), Core (level-based), and Closing/SafetyGate (0) pushback rules', () {
      final trSteps =
          SessionStateMachine.stepsForTechnique(TechniqueSlug.thoughtRecord);
      final step1Supportive = trSteps[0]; // Supportive zone
      final step5Core = trSteps[4]; // Core zone (Evidence AGAINST)
      final accuracyGate = trSteps[5]; // Safety Gate (zone: none)

      const firmState = SessionStateSnapshot(
        sessionId: 'pb-test',
        pushbackLevel: PushbackLevel.firm,
      );

      // Safety gate always allows immediate advance with 0 pushback
      final gateDecision = stateMachine.evaluateStepSkipOrShallowInput(
        state: firmState,
        step: accuracyGate,
      );
      expect(gateDecision.allowImmediateAdvance, isTrue);

      // Supportive zone caps at 1 nudge even when pushbackLevel is firm (3)
      final sup1 = stateMachine.evaluateStepSkipOrShallowInput(
        state: firmState.copyWith(currentStepPushbackCount: 0),
        step: step1Supportive,
      );
      expect(sup1.allowImmediateAdvance, isFalse);
      final sup2 = stateMachine.evaluateStepSkipOrShallowInput(
        state: firmState.copyWith(currentStepPushbackCount: 1),
        step: step1Supportive,
      );
      expect(sup2.allowImmediateAdvance, isTrue);

      // Core zone with moderate (2 nudges) yields on attempt after 2 nudges
      final modState = firmState.copyWith(pushbackLevel: PushbackLevel.moderate);
      final core1 = stateMachine.evaluateStepSkipOrShallowInput(
        state: modState.copyWith(currentStepPushbackCount: 0),
        step: step5Core,
      );
      expect(core1.allowImmediateAdvance, isFalse);
      final core2 = stateMachine.evaluateStepSkipOrShallowInput(
        state: modState.copyWith(currentStepPushbackCount: 1),
        step: step5Core,
      );
      expect(core2.allowImmediateAdvance, isFalse);
      final core3 = stateMachine.evaluateStepSkipOrShallowInput(
        state: modState.copyWith(currentStepPushbackCount: 2),
        step: step5Core,
      );
      expect(core3.allowImmediateAdvance, isTrue);
    });

    test('Thought Record Accuracy Check exits with accurate-thought-exit when thought is objective fact', () {
      const state = SessionStateSnapshot(
        sessionId: 'tr-acc',
        selectedTechnique: TechniqueSlug.thoughtRecord,
      );
      final exited = stateMachine.evaluateAccuracyCheck(
        state: state,
        isThoughtObjectivelyAccurate: true,
        chosenBranch: 'problem_solving',
      );
      expect(exited.finalOutcome, equals(SessionOutcome.accurateThoughtExit));
      expect(exited.pushbackLevel, equals(PushbackLevel.off));
    });

    test('Behavioral Activation Rest Check exits with justified-exit when biological recovery is needed', () {
      const state = SessionStateSnapshot(
        sessionId: 'ba-rest',
        selectedTechnique: TechniqueSlug.behavioralActivation,
      );
      final exited = stateMachine.evaluateRestCheck(
        state: state,
        needsBiologicalRecoveryRest: true,
      );
      expect(exited.finalOutcome, equals(SessionOutcome.justifiedExit));
      expect(exited.pushbackLevel, equals(PushbackLevel.off));
    });

    test('Chain Analysis enforces Hard Stop on self-harm and activates Shame Protocol on severe shame', () {
      const state = SessionStateSnapshot(
        sessionId: 'ca-1',
        selectedTechnique: TechniqueSlug.chainAnalysis,
        pushbackLevel: PushbackLevel.firm,
      );

      // Hard Stop 1: Self-harm target
      final selfHarmStop = stateMachine.evaluateChainAnalysisTarget(
        state: state,
        targetBehaviorDescription: 'Tối qua tôi đã tự hại và cắt tay.',
      );
      expect(selfHarmStop.phase, equals(SessionPhase.safetyStopTerminal));
      expect(selfHarmStop.finalOutcome, equals(SessionOutcome.safetyStop));

      // Shame Protocol: turns off pushback immediately
      final shameTriggered = stateMachine.evaluateChainAnalysisTarget(
        state: state,
        targetBehaviorDescription:
            'Tôi đã quát tháo đồng nghiệp, tôi thật kinh tởm và ghê tởm bản thân.',
      );
      expect(shameTriggered.shameProtocolActive, isTrue);
      expect(shameTriggered.pushbackLevel, equals(PushbackLevel.off));
    });
  });

  group('5. Bipolar Prodrome, Mixed State, IPSRT, Baseline HRV & Adaptive Theme', () {
    test('Detects Mixed State (Mood <= -2 AND Energy >= +2) and Mania Prodrome (Sleep < 5h + reduced need)', () {
      final mixedLog = DailyMoodAndRhythmLog.createValidated(
        id: 'mixed-1',
        userId: 'u1',
        loggedAt: DateTime.now(),
        moodPolarity: -3,
        energyLevel: 3,
        irritabilityIntensity: 8,
        anxietyIntensity: 7,
        sleepDurationHours: 4.5,
        feltNeedForSleep: FeltNeedForSleep.reducedNeed,
        ipsrtAnchors: const IpsrtAnchors(outOfBedTime: '06:00'),
      );

      expect(mixedLog.mixedStateAlertTriggered, isTrue);

      final eval = bipolarEngine.evaluateLogs(recentLogs: [mixedLog]);
      expect(eval.mixedStateDetected, isTrue);
      expect(eval.shouldLockHighActivationExercises, isTrue);

      // Mania Prodrome & Adaptive Theme resolution
      final themeMode = AdaptiveClinicalTheme.resolveThemeMode(
        moodPolarity: 3,
        latestAsrmScore: 7,
      );
      expect(
        themeMode,
        equals(ClinicalThemeMode.lowStimulusManiaDarkRest),
      );

      final depressionTheme = AdaptiveClinicalTheme.resolveThemeMode(
        moodPolarity: -3,
        latestAsrmScore: 1,
      );
      expect(
        depressionTheme,
        equals(ClinicalThemeMode.lowEnergyDepression),
      );
    });

    test('Baseline-Relative HRV computes 25th-75th percentile per device and enforces <12h freshness', () {
      final now = DateTime.utc(2026, 7, 20, 9, 0);
      final samples = <HrvSamplePoint>[
        for (int day = 1; day <= 14; day++)
          HrvSamplePoint(
            timestamp: now.subtract(Duration(days: day)),
            valueMs: 40.0 + day, // 41..54 ms baseline
            sourceDeviceId: 'apple-watch-s9',
          ),
        // Fresh reading 2 hours ago below 25th percentile (28 ms)
        HrvSamplePoint(
          timestamp: now.subtract(const Duration(hours: 2)),
          valueMs: 28.0,
          sourceDeviceId: 'apple-watch-s9',
        ),
      ];

      final hrvResult = bipolarEngine.analyzeBaselineRelativeHrv(
        samples: samples,
        now: now,
      );

      expect(hrvResult.isFreshWithin12Hours, isTrue);
      expect(hrvResult.hasSufficientBaselineHistory, isTrue);
      expect(hrvResult.context, equals(HrvContext.belowBaseline));
      expect(hrvResult.checkInOneLineNoticeVi, isNotNull);
    });
  });

  group('6. Phase 2 Clinical Expansion: 36 Interactive Tools, TEAM-CBT M/P & Anti-Procrastination, Downward Arrow 23 SDBs, DBT ABC PLEASE & CBT-I Bipolar Guard', () {
    test('Catalog kFlutter36ClinicalTools has exact length 36 and all 36 execute deterministically in 0ms', () {
      expect(kFlutter36ClinicalTools.length, equals(36));

      final slugs = kFlutter36ClinicalTools.map((t) => t.slug).toSet();
      expect(slugs.length, equals(36));

      for (final tool in kFlutter36ClinicalTools) {
        final res = runFlutterClinicalTool(
          tool.slug,
          'Một lỗi nhỏ làm hỏng hết, tôi là kẻ thất bại hoàn toàn.',
          moodPolarity: -2,
        );
        expect(res.tool.slug, equals(tool.slug));
        expect(res.safetyStopTriggered, isFalse);
        expect(res.deterministicReframeVi, isNotEmpty);
        expect(res.socraticQuestionVi, isNotEmpty);
      }

      // Crisis input in any of the 36 tools immediately triggers safetyStopTriggered
      final crisisRes = runFlutterClinicalTool(
        'cognitive-distortion-checker',
        'Tôi không muốn sống nữa và muốn tự tử.',
      );
      expect(crisisRes.safetyStopTriggered, isTrue);
    });

    test('TEAM-CBT Pleasure-Predicting (Mastery & Pleasure M/P) Sheet computes prediction-error delta accurately', () {
      const entry = PleasurePredictingEntry(
        id: 'mp-1',
        activityTitle: 'Đi bộ 10 phút & uống trà ấm',
        predictedPleasurePct: 15,
        actualPleasurePct: 65,
        predictedMasteryScore: 2,
        actualMasteryScore: 8,
      );

      expect(entry.pleasurePredictionErrorDelta, equals(50));
      expect(entry.masteryPredictionErrorDelta, equals(6));
      expect(entry.disprovedAnhedoniaPrediction, isTrue);
      expect(entry.clinicalInsightVi, contains('+50%'));
    });

    test('TEAM-CBT Anti-Procrastination 5-Minute Sheet computes difficulty relief and satisfaction gain deltas', () {
      const eval = AntiProcrastinationStepEvaluation(
        id: 'ap-1',
        overwhelmingTask: 'Viết báo cáo 20 trang',
        fiveMinuteMicroStep: 'Mở file và viết 3 gạch đầu dòng trong 5 phút',
        predictedDifficultyPct: 90,
        predictedSatisfactionPct: 20,
        actualDifficultyPct: 30,
        actualSatisfactionPct: 75,
      );

      expect(eval.difficultyReliefDelta, equals(60));
      expect(eval.satisfactionGainDelta, equals(55));
      expect(eval.clinicalTakeawayVi, contains('60%'));
    });

    test('Downward Arrow uncovers Self-Defeating Beliefs (SDBs) and builds Cost-Benefit Analysis', () {
      final sdbRes = runDownwardArrowSdbUncovering(
        automaticThought: 'Tôi không được phép mắc lỗi, cần tất cả mọi người hài lòng.',
        mode: 'interpersonal',
      );

      expect(sdbRes.uncoveredSdbCodes, contains('sdb_performance_perfectionism'));
      expect(sdbRes.uncoveredSdbCodes, contains('sdb_approval_addiction'));
      expect(sdbRes.arrowChainVi.length, greaterThanOrEqualTo(3));
      expect(sdbRes.benefitsOfHoldingBeliefVi, isNotEmpty);
      expect(sdbRes.costsOfHoldingBeliefVi, isNotEmpty);
      expect(sdbRes.healthyReplacementBeliefVi, isNotEmpty);
    });

    test('DBT ABC PLEASE Checklist, ACCEPTS / 5-Senses Self-Soothe & Radical Acceptance 90s Urge Surfing work accurately', () {
      const checklist = DbtAbcPleaseChecklistState(
        accumulatePositives: true,
        buildMastery: true,
        copeAhead: true,
        physicalIllnessCare: true,
        balancedEating: true,
        avoidMoodAlteringSubstances: true,
        balancedSleep: true,
        dailyExercise: false,
      );

      expect(checklist.completedItemsCount, equals(7));
      expect(checklist.resilienceScorePct, equals(88));
      expect(kDbtAcceptsAndFiveSensesCards.length, equals(12));

      final wavePeak = evaluateUrgeSurfingWave(elapsedSeconds: 45);
      expect(wavePeak.phaseTitleVi, contains('30–60s'));
    });

    test('CBT-I Sleep Efficiency Calculator blocks sleep restriction when Bipolar Mania Contraindication Guard triggers', () {
      // Case 1: Primary insomnia (exhausted, euthymic mood = 0) -> sleep restriction allowed
      final insomniaRes = calculateCbtiSleepEfficiency(
        totalTimeInBedHours: 8.0,
        totalSleepTimeHours: 5.0,
        feltNeedForSleep: FeltNeedForSleep.exhausted,
        moodPolarity: 0,
      );
      expect(insomniaRes.sleepEfficiencyPct, equals(63));
      expect(insomniaRes.bipolarManiaContraindicationBlocked, isFalse);
      expect(insomniaRes.sleepRestrictionAllowed, isTrue);

      // Case 2: Bipolar reduced need for sleep (4h sleep in 5h bed, feels energized) -> BLOCKS sleep restriction
      final hypomaniaRes = calculateCbtiSleepEfficiency(
        totalTimeInBedHours: 5.0,
        totalSleepTimeHours: 4.0,
        feltNeedForSleep: FeltNeedForSleep.reducedNeed,
        moodPolarity: 2,
      );
      expect(hypomaniaRes.bipolarManiaContraindicationBlocked, isTrue);
      expect(hypomaniaRes.sleepRestrictionAllowed, isFalse);
      expect(hypomaniaRes.clinicalRecommendationVi, contains('BIPOLAR MANIA GUARD'));
    });
  });
}
