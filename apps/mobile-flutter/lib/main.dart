// lib/main.dart
// Equilibria (Mind Anchor) — Multi-Platform Flutter Application Entry Point
// Wires Riverpod State Management, SQLCipher Encrypted Database Service,
// Adaptive Clinical Theme Engine (Standard / Low-Energy Depression / Low-Stimulus Mania),
// and the Persistent 1-Tap SOS Portal.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/security/encrypted_db_service.dart';
import 'domain/models/clinical_models.dart';
import 'presentation/screens/main_shell_screen.dart';
import 'presentation/theme/adaptive_clinical_theme.dart';

final encryptedDbServiceProvider = Provider<EncryptedDbService>((ref) {
  return EncryptedDbService();
});

class AppClinicalState {
  final int currentMoodPolarity;
  final int currentEnergyLevel;
  final double lastSleepDurationHours;
  final FeltNeedForSleep feltNeedForSleep;
  final int latestAsrmScore;
  final List<DailyMoodAndRhythmLog> moodLogs;
  final List<CognitiveToolkitSession> sessions;
  final List<ImpulseVaultItem> impulseVaultItems;
  final List<WorryBoxItem> worryBoxItems;
  final List<ExposureStep> exposureSteps;
  final List<AssessmentRecord> assessments;
  final UlyssesContract ulyssesContract;

  const AppClinicalState({
    required this.currentMoodPolarity,
    required this.currentEnergyLevel,
    required this.lastSleepDurationHours,
    required this.feltNeedForSleep,
    required this.latestAsrmScore,
    required this.moodLogs,
    required this.sessions,
    required this.impulseVaultItems,
    required this.worryBoxItems,
    required this.exposureSteps,
    required this.assessments,
    required this.ulyssesContract,
  });

  ClinicalThemeMode get adaptiveThemeMode =>
      AdaptiveClinicalTheme.resolveThemeMode(
        moodPolarity: currentMoodPolarity,
        latestAsrmScore: latestAsrmScore,
        lowStimulusThreshold:
            ulyssesContract.autoActivateLowStimulusUiAtPole,
      );

  AppClinicalState copyWith({
    int? currentMoodPolarity,
    int? currentEnergyLevel,
    double? lastSleepDurationHours,
    FeltNeedForSleep? feltNeedForSleep,
    int? latestAsrmScore,
    List<DailyMoodAndRhythmLog>? moodLogs,
    List<CognitiveToolkitSession>? sessions,
    List<ImpulseVaultItem>? impulseVaultItems,
    List<WorryBoxItem>? worryBoxItems,
    List<ExposureStep>? exposureSteps,
    List<AssessmentRecord>? assessments,
    UlyssesContract? ulyssesContract,
  }) {
    return AppClinicalState(
      currentMoodPolarity: currentMoodPolarity ?? this.currentMoodPolarity,
      currentEnergyLevel: currentEnergyLevel ?? this.currentEnergyLevel,
      lastSleepDurationHours:
          lastSleepDurationHours ?? this.lastSleepDurationHours,
      feltNeedForSleep: feltNeedForSleep ?? this.feltNeedForSleep,
      latestAsrmScore: latestAsrmScore ?? this.latestAsrmScore,
      moodLogs: moodLogs ?? this.moodLogs,
      sessions: sessions ?? this.sessions,
      impulseVaultItems: impulseVaultItems ?? this.impulseVaultItems,
      worryBoxItems: worryBoxItems ?? this.worryBoxItems,
      exposureSteps: exposureSteps ?? this.exposureSteps,
      assessments: assessments ?? this.assessments,
      ulyssesContract: ulyssesContract ?? this.ulyssesContract,
    );
  }
}

class AppClinicalStateNotifier extends StateNotifier<AppClinicalState> {
  final EncryptedDbService _db;

  AppClinicalStateNotifier(this._db)
      : super(
          AppClinicalState(
            currentMoodPolarity: 0,
            currentEnergyLevel: 0,
            lastSleepDurationHours: 7.5,
            feltNeedForSleep: FeltNeedForSleep.normal,
            latestAsrmScore: 2,
            moodLogs: [
              DailyMoodAndRhythmLog.createValidated(
                id: 'log-seed-1',
                userId: 'local-user',
                loggedAt: DateTime.now().subtract(const Duration(days: 2)),
                moodPolarity: -1,
                energyLevel: -1,
                irritabilityIntensity: 2,
                anxietyIntensity: 4,
                sleepDurationHours: 7.0,
                feltNeedForSleep: FeltNeedForSleep.normal,
                ipsrtAnchors: const IpsrtAnchors(
                  outOfBedTime: '07:00',
                  firstSocialContactTime: '08:00',
                  workOrStudyStartTime: '09:00',
                  dinnerTime: '19:00',
                  bedTime: '23:00',
                ),
              ),
              DailyMoodAndRhythmLog.createValidated(
                id: 'log-seed-2',
                userId: 'local-user',
                loggedAt: DateTime.now().subtract(const Duration(days: 1)),
                moodPolarity: 0,
                energyLevel: 1,
                irritabilityIntensity: 1,
                anxietyIntensity: 3,
                sleepDurationHours: 7.5,
                feltNeedForSleep: FeltNeedForSleep.normal,
                ipsrtAnchors: const IpsrtAnchors(
                  outOfBedTime: '07:10',
                  firstSocialContactTime: '08:15',
                  workOrStudyStartTime: '09:00',
                  dinnerTime: '19:10',
                  bedTime: '23:05',
                ),
              ),
            ],
            sessions: const [],
            impulseVaultItems: const [],
            worryBoxItems: const [],
            exposureSteps: const [],
            assessments: const [],
            ulyssesContract: UlyssesContract(
              enabled: true,
              createdAtWhileEuthymic: DateTime.utc(2026, 1, 15),
              personalManiaProdromes: const [
                'Ngủ dưới 5 giờ nhưng vẫn tràn trề năng lượng',
                'Lên kế hoạch mua sắm hoặc dự án lớn lúc 2 giờ sáng',
                'Nói nhanh, suy nghĩ nhảy vọt',
              ],
              personalDepressionProdromes: const [
                'Không trả lời tin nhắn bạn bè trên 2 ngày',
                'Ngủ dậy muộn sau 10:00 sáng',
              ],
              trustedContacts: const [
                TrustedContact(
                  name: 'Người thân Tin cậy (Gia đình)',
                  relationship: 'Gia đình',
                  phone: '0900000001',
                ),
              ],
            ),
          ),
        );

  void submitQuickCheckIn({
    required int moodPolarity,
    required int energyLevel,
    required double sleepHours,
    required FeltNeedForSleep feltNeedForSleep,
  }) {
    final newLog = DailyMoodAndRhythmLog.createValidated(
      id: 'log-${DateTime.now().millisecondsSinceEpoch}',
      userId: 'local-user',
      loggedAt: DateTime.now(),
      moodPolarity: moodPolarity,
      energyLevel: energyLevel,
      irritabilityIntensity: (energyLevel >= 2 && moodPolarity <= -2) ? 8 : 3,
      anxietyIntensity: 4,
      sleepDurationHours: sleepHours,
      feltNeedForSleep: feltNeedForSleep,
      ipsrtAnchors: const IpsrtAnchors(
        outOfBedTime: '07:05',
        firstSocialContactTime: '08:10',
        workOrStudyStartTime: '09:00',
        dinnerTime: '19:00',
        bedTime: '23:00',
      ),
    );
    _db.saveDailyMoodLog(newLog);
    state = state.copyWith(
      currentMoodPolarity: moodPolarity,
      currentEnergyLevel: energyLevel,
      lastSleepDurationHours: sleepHours,
      feltNeedForSleep: feltNeedForSleep,
      moodLogs: [newLog, ...state.moodLogs],
    );
  }

  void addSession(CognitiveToolkitSession session) {
    _db.saveSession(session);
    state = state.copyWith(sessions: [session, ...state.sessions]);
  }

  void addImpulseVaultItem(ImpulseVaultItem item) {
    _db.saveImpulseVaultItem(item);
    state = state.copyWith(
      impulseVaultItems: [item, ...state.impulseVaultItems],
    );
  }

  void addWorryBoxItem(WorryBoxItem item) {
    _db.saveWorryBoxItem(item);
    state = state.copyWith(worryBoxItems: [item, ...state.worryBoxItems]);
  }

  void addExposureStep(ExposureStep step) {
    _db.saveExposureStep(step);
    state = state.copyWith(exposureSteps: [...state.exposureSteps, step]);
  }

  void addAssessment(AssessmentRecord record) {
    _db.saveAssessmentRecord(record);
    final updatedAsrm =
        record.scaleCode == 'ASRM' ? record.totalScore : state.latestAsrmScore;
    state = state.copyWith(
      latestAsrmScore: updatedAsrm,
      assessments: [record, ...state.assessments],
    );
  }

  void updateUlyssesContract(UlyssesContract contract) {
    state = state.copyWith(ulyssesContract: contract);
  }
}

final appClinicalStateProvider =
    StateNotifierProvider<AppClinicalStateNotifier, AppClinicalState>((ref) {
  final db = ref.watch(encryptedDbServiceProvider);
  return AppClinicalStateNotifier(db);
});

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final dbService = EncryptedDbService();
  await dbService.initializeSqlCipherPragma();

  runApp(
    ProviderScope(
      overrides: [
        encryptedDbServiceProvider.overrideWithValue(dbService),
      ],
      child: const EquilibriaMobileApp(),
    ),
  );
}

class EquilibriaMobileApp extends ConsumerWidget {
  const EquilibriaMobileApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final clinicalState = ref.watch(appClinicalStateProvider);
    final notifier = ref.read(appClinicalStateProvider.notifier);
    final themeMode = clinicalState.adaptiveThemeMode;

    return MaterialApp(
      title: 'Equilibria — CBT, TEAM-CBT, DBT & IPSRT',
      debugShowCheckedModeBanner: false,
      theme: AdaptiveClinicalTheme.buildThemeData(themeMode),
      home: MainShellScreen(
        moodPolarity: clinicalState.currentMoodPolarity,
        energyLevel: clinicalState.currentEnergyLevel,
        sleepDurationHours: clinicalState.lastSleepDurationHours,
        feltNeedForSleep: clinicalState.feltNeedForSleep,
        latestAsrmScore: clinicalState.latestAsrmScore,
        activeThemeMode: themeMode,
        moodLogs: clinicalState.moodLogs,
        sessions: clinicalState.sessions,
        impulseVaultItems: clinicalState.impulseVaultItems,
        worryBoxItems: clinicalState.worryBoxItems,
        exposureSteps: clinicalState.exposureSteps,
        assessments: clinicalState.assessments,
        ulyssesContract: clinicalState.ulyssesContract,
        onQuickCheckInSubmit: notifier.submitQuickCheckIn,
        onSessionSaved: notifier.addSession,
        onAddImpulseVaultItem: notifier.addImpulseVaultItem,
        onAddWorryBoxItem: notifier.addWorryBoxItem,
        onAddExposureStep: notifier.addExposureStep,
        onAddAssessment: notifier.addAssessment,
        onUpdateUlyssesContract: notifier.updateUlyssesContract,
      ),
    );
  }
}
