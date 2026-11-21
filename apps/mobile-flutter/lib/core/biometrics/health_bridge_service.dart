// lib/core/biometrics/health_bridge_service.dart
// Apple HealthKit (iOS) & Google Health Connect (Android) Bridge
// Strictly adheres to `health-integration.md` rules:
// 1. Completely optional: if the user declines permission, the app works 100%
//    normally and NEVER re-prompts on subsequent sessions.
// 2. Same-device baseline only: HRV (SDNN / RMSSD) is grouped by `sourceId`
//    over a 14-30 day personal window (25th-75th percentile).
// 3. Freshness gate: HRV readings older than 12 hours are ignored for Check-in context.
// 4. Prohibition of within-session deltas: Never compares pre-session vs post-session
//    HRV during a 10-minute CBT/DBT exercise.

import 'package:health/health.dart';

import '../../domain/engine/bipolar_ipsrt_engine.dart';
import '../../domain/models/clinical_models.dart';

class HealthSnapshotSummary {
  final BaselineHrvAnalysisResult hrvAnalysis;
  final double? lastNightSleepHours;
  final String? sourceDeviceName;
  final bool permissionGranted;

  const HealthSnapshotSummary({
    required this.hrvAnalysis,
    this.lastNightSleepHours,
    this.sourceDeviceName,
    required this.permissionGranted,
  });
}

class HealthBridgeService {
  final Health _health;
  final BipolarIpsrtEngine _bipolarEngine;

  bool _hasDeclinedPermissionThisInstall = false;

  HealthBridgeService({
    Health? health,
    BipolarIpsrtEngine? bipolarEngine,
  })  : _health = health ?? Health(),
        _bipolarEngine = bipolarEngine ?? const BipolarIpsrtEngine();

  bool get hasDeclinedPermission => _hasDeclinedPermissionThisInstall;

  /// Requests read-only permission for HRV and Sleep Analysis once.
  /// If declined, records the user's choice and never nags again.
  Future<bool> requestOptionalHealthPermissionsIfAllowed({
    required UserClinicalProfile profile,
  }) async {
    if (profile.healthPromptDeclinedPermanently ||
        _hasDeclinedPermissionThisInstall) {
      return false;
    }

    final types = <HealthDataType>[
      HealthDataType.HEART_RATE_VARIABILITY_SDNN,
      HealthDataType.SLEEP_ASLEEP,
    ];
    final permissions = <HealthDataAccess>[
      HealthDataAccess.READ,
      HealthDataAccess.READ,
    ];

    try {
      await _health.configure();
      final granted = await _health.requestAuthorization(
        types,
        permissions: permissions,
      );
      if (!granted) {
        _hasDeclinedPermissionThisInstall = true;
      }
      return granted;
    } catch (_) {
      // Gracefully degrade on simulators or devices without Health Connect installed
      return false;
    }
  }

  /// Reads 30 days of HRV and last night's sleep duration, computing the
  /// personal 25th-75th percentile baseline on the primary device source.
  Future<HealthSnapshotSummary> fetchCheckInBiometricContext({
    required UserClinicalProfile profile,
    DateTime? referenceNow,
  }) async {
    final now = referenceNow ?? DateTime.now();

    if (!profile.healthIntegrationOptIn ||
        profile.healthPromptDeclinedPermanently ||
        _hasDeclinedPermissionThisInstall) {
      return const HealthSnapshotSummary(
        hrvAnalysis: BaselineHrvAnalysisResult(
          context: null,
          isFreshWithin12Hours: false,
          hasSufficientBaselineHistory: false,
        ),
        permissionGranted: false,
      );
    }

    try {
      final start30d = now.subtract(const Duration(days: 30));
      final rawPoints = await _health.getHealthDataFromTypes(
        types: const [
          HealthDataType.HEART_RATE_VARIABILITY_SDNN,
          HealthDataType.SLEEP_ASLEEP,
        ],
        startTime: start30d,
        endTime: now,
      );

      final hrvSamples = <HrvSamplePoint>[];
      double sleepMinutesLast24h = 0.0;
      final sleepCutoff = now.subtract(const Duration(hours: 24));
      String? primarySource;

      for (final point in rawPoints) {
        primarySource ??= point.sourceName;
        if (point.type == HealthDataType.HEART_RATE_VARIABILITY_SDNN) {
          final numericVal = point.value;
          if (numericVal is NumericHealthValue) {
            hrvSamples.add(
              HrvSamplePoint(
                timestamp: point.dateTo,
                valueMs: numericVal.numericValue.toDouble(),
                sourceDeviceId: point.sourceId,
              ),
            );
          }
        } else if (point.type == HealthDataType.SLEEP_ASLEEP &&
            point.dateTo.isAfter(sleepCutoff)) {
          sleepMinutesLast24h +=
              point.dateTo.difference(point.dateFrom).inMinutes.toDouble();
        }
      }

      final hrvAnalysis = _bipolarEngine.analyzeBaselineRelativeHrv(
        samples: hrvSamples,
        now: now,
      );

      return HealthSnapshotSummary(
        hrvAnalysis: hrvAnalysis,
        lastNightSleepHours:
            sleepMinutesLast24h > 0 ? sleepMinutesLast24h / 60.0 : null,
        sourceDeviceName: primarySource,
        permissionGranted: true,
      );
    } catch (_) {
      return const HealthSnapshotSummary(
        hrvAnalysis: BaselineHrvAnalysisResult(
          context: null,
          isFreshWithin12Hours: false,
          hasSufficientBaselineHistory: false,
        ),
        permissionGranted: false,
      );
    }
  }
}
