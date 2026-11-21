// lib/main.dart
// Haven (Equilibria) — Multi-Platform Flutter Application Entry Point
// Wires Riverpod State Management, Hardware-Backed EncryptedDbService,
// Welcome Gate Sanctuary Onboarding, Adaptive Clinical Theme Engine,
// and the Persistent 1-Tap SOS Portal.

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/security/encrypted_db_service.dart';
import 'domain/models/clinical_models.dart';
import 'domain/models/haven_account_model.dart';
import 'presentation/screens/main_shell_screen.dart';
import 'presentation/screens/welcome_gate_screen.dart';
import 'presentation/theme/adaptive_clinical_theme.dart';

final encryptedDbServiceProvider = Provider<EncryptedDbService>((ref) {
  return EncryptedDbService();
});

class AppClinicalState {
  final HavenAccountProfile? accountProfile;
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
    this.accountProfile,
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
    HavenAccountProfile? accountProfile,
    bool clearAccountProfile = false,
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
      accountProfile:
          clearAccountProfile ? null : (accountProfile ?? this.accountProfile),
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

  AppClinicalStateNotifier(
    this._db, {
    HavenAccountProfile? initialProfile,
  }) : super(
          AppClinicalState(
            accountProfile: initialProfile,
            currentMoodPolarity: 0,
            currentEnergyLevel: 0,
            lastSleepDurationHours: 7.5,
            feltNeedForSleep: FeltNeedForSleep.normal,
            latestAsrmScore: 2,
            moodLogs: _db.getDailyMoodLogs().isNotEmpty
                ? _db.getDailyMoodLogs()
                : [
                    DailyMoodAndRhythmLog.createValidated(
                      id: 'log-seed-1',
                      userId: initialProfile?.userId ?? 'local-user',
                      loggedAt: DateTime.now().subtract(const Duration(days: 1)),
                      moodPolarity: 0,
                      energyLevel: 0,
                      irritabilityIntensity: 2,
                      anxietyIntensity: 3,
                      sleepDurationHours: 7.5,
                      feltNeedForSleep: FeltNeedForSleep.normal,
                      ipsrtAnchors: const IpsrtAnchors(
                        outOfBedTime: '07:05',
                        firstSocialContactTime: '08:15',
                        workOrStudyStartTime: '09:00',
                        dinnerTime: '19:00',
                        bedTime: '23:00',
                      ),
                    ),
                  ],
            sessions: _db.getSessions(),
            impulseVaultItems: _db.getImpulseVaultItems(),
            worryBoxItems: _db.getWorryBoxItems(),
            exposureSteps: _db.getExposureSteps(),
            assessments: _db.getAssessments(),
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
                  phone: '',
                ),
              ],
            ),
          ),
        );

  void signInWithProfile({
    required HavenAccountProfile profile,
    int initialMood = 0,
    int initialEnergy = 0,
  }) {
    unawaited(_db.saveAccountProfile(profile));
    state = state.copyWith(
      accountProfile: profile,
      currentMoodPolarity: initialMood,
      currentEnergyLevel: initialEnergy,
    );
  }

  void signOut() {
    unawaited(_db.clearAccountProfile());
    state = state.copyWith(clearAccountProfile: true);
  }

  void submitQuickCheckIn({
    required int moodPolarity,
    required int energyLevel,
    required double sleepHours,
    required FeltNeedForSleep feltNeedForSleep,
  }) {
    final newLog = DailyMoodAndRhythmLog.createValidated(
      id: 'log-${DateTime.now().millisecondsSinceEpoch}',
      userId: state.accountProfile?.userId ?? 'local-user',
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
    unawaited(_db.saveDailyMoodLog(newLog));
    state = state.copyWith(
      currentMoodPolarity: moodPolarity,
      currentEnergyLevel: energyLevel,
      lastSleepDurationHours: sleepHours,
      feltNeedForSleep: feltNeedForSleep,
      moodLogs: [newLog, ...state.moodLogs],
    );
  }

  void addSession(CognitiveToolkitSession session) {
    unawaited(_db.saveSession(session));
    state = state.copyWith(sessions: [session, ...state.sessions]);
  }

  void addImpulseVaultItem(ImpulseVaultItem item) {
    unawaited(_db.saveImpulseVaultItem(item));
    state = state.copyWith(
      impulseVaultItems: [item, ...state.impulseVaultItems],
    );
  }

  void addWorryBoxItem(WorryBoxItem item) {
    unawaited(_db.saveWorryBoxItem(item));
    state = state.copyWith(worryBoxItems: [item, ...state.worryBoxItems]);
  }

  void addExposureStep(ExposureStep step) {
    unawaited(_db.saveExposureStep(step));
    state = state.copyWith(exposureSteps: [...state.exposureSteps, step]);
  }

  void addAssessment(AssessmentRecord record) {
    unawaited(_db.saveAssessmentRecord(record));
    final updatedAsrm =
        record.scaleCode == 'ASRM' ? record.totalScore : state.latestAsrmScore;
    final filtered = state.assessments
        .where((a) => a.scaleCode != record.scaleCode)
        .toList();
    state = state.copyWith(
      latestAsrmScore: updatedAsrm,
      assessments: [record, ...filtered],
    );
  }

  void updateUlyssesContract(UlyssesContract contract) {
    state = state.copyWith(ulyssesContract: contract);
  }

  Future<bool> authenticateBiometrics() => _db.authenticateWithBiometrics();
}

final initialHavenProfileProvider = Provider<HavenAccountProfile?>((ref) {
  return null;
});

final appClinicalStateProvider =
    StateNotifierProvider<AppClinicalStateNotifier, AppClinicalState>((ref) {
  final db = ref.watch(encryptedDbServiceProvider);
  final initialProfile = ref.watch(initialHavenProfileProvider);
  return AppClinicalStateNotifier(db, initialProfile: initialProfile);
});

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final dbService = EncryptedDbService();
  await dbService.initializeSqlCipherPragma();
  await dbService.hydrateVaultFromSecureStorage();
  final savedProfile = await dbService.loadAccountProfile();

  runApp(
    ProviderScope(
      overrides: [
        encryptedDbServiceProvider.overrideWithValue(dbService),
        initialHavenProfileProvider.overrideWithValue(savedProfile),
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
    final profile = clinicalState.accountProfile;

    return MaterialApp(
      title: 'Haven — Nơi Bình Yên',
      debugShowCheckedModeBanner: false,
      theme: AdaptiveClinicalTheme.buildThemeData(themeMode),
      home: profile == null
          ? WelcomeGateScreen(
              onEnterSanctuary: (payload) => notifier.signInWithProfile(
                profile: payload.profile,
                initialMood: payload.initialMood,
                initialEnergy: payload.initialEnergy,
              ),
            )
          : MainShellScreen(
              accountProfile: profile,
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
              onAuthenticateBiometrics: notifier.authenticateBiometrics,
              onSignOut: notifier.signOut,
            ),
    );
  }
}
