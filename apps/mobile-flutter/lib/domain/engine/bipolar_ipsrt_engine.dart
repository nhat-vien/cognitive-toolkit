// lib/domain/engine/bipolar_ipsrt_engine.dart
// Bipolar I, II & Cyclothymia Clinical Engine:
// - Mania Prodrome Detector (Sleep < 5h for >= 2 nights + reduced need for sleep, or ASRM >= 6)
// - Mixed State Detector (Mood <= -2 AND Energy >= +2)
// - IPSRT (Interpersonal and Social Rhythm Therapy) 5-Anchor Stability Calculator
// - Baseline-Relative HRV & Sleep Analyzer (14-30 days, 25th-75th percentile,
//   same-device source grouping, < 12h freshness check, NEVER within-session delta).

import '../models/clinical_models.dart';

class BipolarClinicalEvaluation {
  final bool maniaProdromeDetected;
  final bool mixedStateDetected;
  final bool severeDepressionDetected;
  final bool shouldActivateLowStimulusDarkUi;
  final bool shouldLockHighActivationExercises;
  final bool shouldPrompt48hImpulseVault;
  final double ipsrtStabilityScore; // 0..100
  final List<String> clinicalWarningsVi;
  final List<String> recommendedActionsVi;

  const BipolarClinicalEvaluation({
    required this.maniaProdromeDetected,
    required this.mixedStateDetected,
    required this.severeDepressionDetected,
    required this.shouldActivateLowStimulusDarkUi,
    required this.shouldLockHighActivationExercises,
    required this.shouldPrompt48hImpulseVault,
    required this.ipsrtStabilityScore,
    required this.clinicalWarningsVi,
    required this.recommendedActionsVi,
  });
}

class HrvSamplePoint {
  final DateTime timestamp;
  final double valueMs; // SDNN or RMSSD in ms
  final String sourceDeviceId;

  const HrvSamplePoint({
    required this.timestamp,
    required this.valueMs,
    required this.sourceDeviceId,
  });
}

class BaselineHrvAnalysisResult {
  final HrvContext? context;
  final bool isFreshWithin12Hours;
  final bool hasSufficientBaselineHistory;
  final double? latestValueMs;
  final double? percentile25Ms;
  final double? percentile75Ms;
  final String? checkInOneLineNoticeVi;

  const BaselineHrvAnalysisResult({
    required this.context,
    required this.isFreshWithin12Hours,
    required this.hasSufficientBaselineHistory,
    this.latestValueMs,
    this.percentile25Ms,
    this.percentile75Ms,
    this.checkInOneLineNoticeVi,
  });
}

class BipolarIpsrtEngine {
  const BipolarIpsrtEngine();

  /// Evaluates recent daily mood & rhythm logs for Mania Prodrome, Mixed State,
  /// Bipolar Depression Pacing, and IPSRT rhythm stability.
  BipolarClinicalEvaluation evaluateLogs({
    required List<DailyMoodAndRhythmLog> recentLogs,
    int latestAsrmScore = 0,
    UlyssesContract? contract,
  }) {
    if (recentLogs.isEmpty) {
      final asrmTrigger = latestAsrmScore >= 6;
      return BipolarClinicalEvaluation(
        maniaProdromeDetected: asrmTrigger,
        mixedStateDetected: false,
        severeDepressionDetected: false,
        shouldActivateLowStimulusDarkUi: asrmTrigger,
        shouldLockHighActivationExercises: asrmTrigger,
        shouldPrompt48hImpulseVault: asrmTrigger,
        ipsrtStabilityScore: 100.0,
        clinicalWarningsVi: asrmTrigger
            ? ['Điểm ASRM >= 6: Cảnh báo sớm pha Hưng cảm nhẹ / Hưng cảm.']
            : const [],
        recommendedActionsVi: asrmTrigger
            ? ['Bật giao diện Dark Rest, khóa quyết định lớn vào Khoang Chờ 48 Giờ.']
            : const [],
      );
    }

    // Sort newest first
    final sorted = List<DailyMoodAndRhythmLog>.from(recentLogs)
      ..sort((a, b) => b.loggedAt.compareTo(a.loggedAt));
    final latest = sorted.first;

    final lowStimulusThreshold =
        contract?.autoActivateLowStimulusUiAtPole ?? 2;
    final vaultThreshold = contract?.autoEnable48hImpulseVaultAtPole ?? 2;

    // 1. Mixed State Detection: Mood <= -2 AND Energy >= +2
    final isMixedState =
        latest.moodPolarity <= -2 && latest.energyLevel >= 2;

    // 2. Mania Prodrome Detection:
    // - Sleep < 5.0 hours for >= 2 consecutive recent logs with reduced need for sleep, OR
    // - Latest log has sleep < 5.0h + reducedNeed/noNeedAtAll + moodPolarity >= +2, OR
    // - ASRM score >= 6
    int consecutiveShortSleepNights = 0;
    bool hasReducedSleepNeedFlag = false;
    for (final log in sorted.take(3)) {
      if (log.sleepDurationHours < 5.0) {
        consecutiveShortSleepNights++;
        if (log.feltNeedForSleep.isReducedSleepNeed) {
          hasReducedSleepNeedFlag = true;
        }
      } else {
        break;
      }
    }

    final isManiaProdrome = (consecutiveShortSleepNights >= 2 &&
            hasReducedSleepNeedFlag) ||
        (latest.sleepDurationHours < 5.0 &&
            latest.feltNeedForSleep.isReducedSleepNeed &&
            latest.moodPolarity >= 2) ||
        latestAsrmScore >= 6 ||
        latest.moodPolarity >= 3;

    // 3. Severe Depression Detection
    final isSevereDepression = latest.moodPolarity <= -3;

    // 4. IPSRT Social Rhythm Stability Score (0..100) across up to 7 days
    final ipsrtScore = calculateIpsrtStabilityScore(sorted.take(7).toList());

    final shouldLowStimulusUi =
        latest.moodPolarity >= lowStimulusThreshold ||
            isManiaProdrome ||
            latestAsrmScore >= 6;
    final shouldVault =
        latest.moodPolarity >= vaultThreshold || isManiaProdrome;

    final warnings = <String>[];
    final actions = <String>[];

    if (isMixedState) {
      warnings.add(
        'CẢNH BÁO PHA HỖN HỢP (MIXED STATE): Khí sắc trầm (${latest.moodPolarity}) đi kèm Năng lượng kích động cao (+${latest.energyLevel}). Đây là trạng thái cần bảo vệ an toàn cao nhất.',
      );
      actions.add(
        'Thực hiện ngay kỹ thuật hạ nhiệt sinh lý DBT TIPP (Thở dẫn nhịp 4-6 hoặc Nước lạnh) và liên hệ bác sĩ điều trị.',
      );
    }

    if (isManiaProdrome) {
      warnings.add(
        'CẢNH BÁO TIỀN TRIỆU HƯNG CẢM (MANIA PRODROME): Giấc ngủ < 5 giờ kèm giảm nhu cầu ngủ hoặc khí sắc tăng cao (+${latest.moodPolarity}).',
      );
      actions.add(
        'Kích hoạt Giao diện Giảm Kích thích (Low-Stimulus Dark Rest), khóa mọi quyết định tài chính/công việc vào Khoang Chờ 48 Giờ và giữ nguyên liều thuốc ổn định khí sắc.',
      );
    }

    if (isSevereDepression && !isMixedState) {
      warnings.add(
        'PHA TRẦM CẢM LƯỠNG CỰC (${latest.moodPolarity}): Năng lượng đang cạn kiệt.',
      );
      actions.add(
        'Áp dụng Kích hoạt Vi mô An toàn (Micro-Activation 5 phút) có trần năng lượng để chống chuyển pha hưng cảm (Manic Switch), ưu tiên giữ mốc giờ thức dậy IPSRT.',
      );
    }

    if (ipsrtScore < 65.0) {
      warnings.add(
        'Nhịp sinh học IPSRT đang dao động mạnh (Độ ổn định: ${ipsrtScore.toStringAsFixed(0)}/100).',
      );
      actions.add(
        'Neo cố định Giờ thức dậy và Giờ đi ngủ chênh lệch không quá ±30 phút mỗi ngày.',
      );
    }

    return BipolarClinicalEvaluation(
      maniaProdromeDetected: isManiaProdrome,
      mixedStateDetected: isMixedState,
      severeDepressionDetected: isSevereDepression,
      shouldActivateLowStimulusDarkUi: shouldLowStimulusUi,
      shouldLockHighActivationExercises: shouldLowStimulusUi || isMixedState,
      shouldPrompt48hImpulseVault: shouldVault,
      ipsrtStabilityScore: ipsrtScore,
      clinicalWarningsVi: warnings,
      recommendedActionsVi: actions,
    );
  }

  /// Calculates IPSRT Social Rhythm Metric stability (0..100) from daily anchor times.
  /// Penalizes large day-to-day variance in minutes across the 5 circadian anchors.
  double calculateIpsrtStabilityScore(List<DailyMoodAndRhythmLog> logs) {
    if (logs.isEmpty) return 100.0;
    if (logs.length == 1) {
      final filledRatio = logs.first.ipsrtAnchors.completedCount / 5.0;
      return (70.0 + 30.0 * filledRatio).clamp(0.0, 100.0);
    }

    final anchorextractors = <String? Function(IpsrtAnchors)>[
      (a) => a.outOfBedTime,
      (a) => a.firstSocialContactTime,
      (a) => a.workOrStudyStartTime,
      (a) => a.dinnerTime,
      (a) => a.bedTime,
    ];

    double totalAnchorScores = 0.0;
    int evaluatedAnchors = 0;

    for (final extractor in anchorextractors) {
      final minutesList = <int>[];
      for (final log in logs) {
        final raw = extractor(log.ipsrtAnchors);
        final mins = _parseHhMmToMinutes(raw);
        if (mins != null) {
          minutesList.add(mins);
        }
      }
      if (minutesList.length >= 2) {
        evaluatedAnchors++;
        final mean =
            minutesList.reduce((a, b) => a + b) / minutesList.length;
        double sumAbsDeviation = 0.0;
        for (final m in minutesList) {
          sumAbsDeviation += (m - mean).abs();
        }
        final avgDeviationMins = sumAbsDeviation / minutesList.length;
        // 0 min deviation = 100 pts; >= 120 min avg deviation = 20 pts
        final anchorScore =
            (100.0 - (avgDeviationMins / 120.0) * 80.0).clamp(20.0, 100.0);
        totalAnchorScores += anchorScore;
      }
    }

    if (evaluatedAnchors == 0) return 75.0;
    return (totalAnchorScores / evaluatedAnchors).clamp(0.0, 100.0);
  }

  /// Baseline-Relative HRV Analyzer following `health-integration.md`:
  /// - Only compares samples from the same device source (`sourceDeviceId`)
  /// - Requires 14–30 days baseline window (at least 7 samples on that device)
  /// - Computes 25th and 75th percentiles
  /// - Enforces < 12h freshness check on the latest sample
  /// - NEVER computes within-session pre/post HRV delta.
  BaselineHrvAnalysisResult analyzeBaselineRelativeHrv({
    required List<HrvSamplePoint> samples,
    required DateTime now,
  }) {
    if (samples.isEmpty) {
      return const BaselineHrvAnalysisResult(
        context: null,
        isFreshWithin12Hours: false,
        hasSufficientBaselineHistory: false,
      );
    }

    final sortedByTime = List<HrvSamplePoint>.from(samples)
      ..sort((a, b) => b.timestamp.compareTo(a.timestamp));
    final latest = sortedByTime.first;

    final ageHours = now.difference(latest.timestamp).inMinutes / 60.0;
    final isFresh = ageHours >= 0 && ageHours <= 12.0;

    // Filter to same device source within the last 30 days
    final cutoff30d = now.subtract(const Duration(days: 30));
    final sameSourceWindow = sortedByTime
        .where(
          (s) =>
              s.sourceDeviceId == latest.sourceDeviceId &&
              s.timestamp.isAfter(cutoff30d),
        )
        .map((s) => s.valueMs)
        .toList()
      ..sort();

    if (sameSourceWindow.length < 7) {
      return BaselineHrvAnalysisResult(
        context: null,
        isFreshWithin12Hours: isFresh,
        hasSufficientBaselineHistory: false,
        latestValueMs: latest.valueMs,
      );
    }

    final p25 = _percentile(sameSourceWindow, 0.25);
    final p75 = _percentile(sameSourceWindow, 0.75);

    if (!isFresh) {
      return BaselineHrvAnalysisResult(
        context: null,
        isFreshWithin12Hours: false,
        hasSufficientBaselineHistory: true,
        latestValueMs: latest.valueMs,
        percentile25Ms: p25,
        percentile75Ms: p75,
      );
    }

    late final HrvContext ctx;
    String? noticeVi;
    if (latest.valueMs < p25) {
      ctx = HrvContext.belowBaseline;
      noticeVi =
          'Nhịp sinh học (HRV) hôm nay thấp hơn ngưỡng quen thuộc của bạn — cơ thể có thể đang cần sự nhẹ nhàng và ưu tiên hạ nhiệt sinh lý.';
    } else if (latest.valueMs > p75) {
      ctx = HrvContext.aboveBaseline;
    } else {
      ctx = HrvContext.withinBaseline;
    }

    return BaselineHrvAnalysisResult(
      context: ctx,
      isFreshWithin12Hours: true,
      hasSufficientBaselineHistory: true,
      latestValueMs: latest.valueMs,
      percentile25Ms: p25,
      percentile75Ms: p75,
      checkInOneLineNoticeVi: noticeVi,
    );
  }

  int? _parseHhMmToMinutes(String? hhmm) {
    if (hhmm == null || !hhmm.contains(':')) return null;
    final parts = hhmm.trim().split(':');
    if (parts.length < 2) return null;
    final h = int.tryParse(parts[0]);
    final m = int.tryParse(parts[1]);
    if (h == null || m == null) return null;
    // Normalize late-night bedtimes (00:00 - 03:59) to 24:00+ so 23:30 and 00:15 are 45 mins apart
    final normalizedHour = h < 4 ? h + 24 : h;
    return normalizedHour * 60 + m;
  }

  double _percentile(List<double> sortedValues, double p) {
    if (sortedValues.isEmpty) return 0.0;
    final pos = p * (sortedValues.length - 1);
    final lower = pos.floor();
    final upper = pos.ceil();
    if (lower == upper) return sortedValues[lower];
    final weight = pos - lower;
    return sortedValues[lower] * (1.0 - weight) + sortedValues[upper] * weight;
  }
}
