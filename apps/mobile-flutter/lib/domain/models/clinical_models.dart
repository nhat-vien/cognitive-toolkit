// lib/domain/models/clinical_models.dart
// Immutable Domain Models for Equilibria (CBT, TEAM-CBT, DBT & Bipolar IPSRT).

import 'dart:convert';

enum DisorderFocus {
  anxiety('anxiety', 'Rối loạn Lo âu (GAD / Panic / Social / OCD)'),
  depression('depression', 'Rối loạn Trầm cảm (MDD / Burnout)'),
  bipolar1('bipolar_1', 'Rối loạn Lưỡng cực I (Bipolar I)'),
  bipolar2('bipolar_2', 'Rối loạn Lưỡng cực II (Bipolar II)'),
  cyclothymia('cyclothymia', 'Khí sắc Chu kỳ (Cyclothymia)');

  final String code;
  final String labelVi;
  const DisorderFocus(this.code, this.labelVi);

  static DisorderFocus fromCode(String code) {
    return DisorderFocus.values.firstWhere(
      (e) => e.code == code,
      orElse: () => DisorderFocus.anxiety,
    );
  }
}

enum PushbackLevel {
  off('off', 0, 'Tắt (Không hỏi lại khi bỏ qua)'),
  gentle('gentle', 1, 'Nhẹ nhàng (1 lần gợi mở)'),
  moderate('moderate', 2, 'Vừa phải (2 lần gợi mở - Mặc định)'),
  firm('firm', 3, 'Sâu sắc (3 lần khám phá kháng cự TEAM-CBT)');

  final String code;
  final int maxNudgesInCoreZone;
  final String labelVi;
  const PushbackLevel(this.code, this.maxNudgesInCoreZone, this.labelVi);

  static PushbackLevel fromCode(String code) {
    return PushbackLevel.values.firstWhere(
      (e) => e.code == code,
      orElse: () => PushbackLevel.moderate,
    );
  }

  PushbackLevel softer() {
    switch (this) {
      case PushbackLevel.firm:
        return PushbackLevel.moderate;
      case PushbackLevel.moderate:
        return PushbackLevel.gentle;
      case PushbackLevel.gentle:
      case PushbackLevel.off:
        return PushbackLevel.off;
    }
  }

  PushbackLevel harder() {
    switch (this) {
      case PushbackLevel.off:
        return PushbackLevel.gentle;
      case PushbackLevel.gentle:
        return PushbackLevel.moderate;
      case PushbackLevel.moderate:
      case PushbackLevel.firm:
        return PushbackLevel.firm;
    }
  }
}

enum FeltNeedForSleep {
  exhausted('exhausted', 'Mệt mỏi rã rời / Thiếu ngủ (Insomnia)'),
  normal('normal', 'Bình thường (Đủ giấc)'),
  reducedNeed('reduced_need', 'Ngủ ít nhưng vẫn khỏe (Cảnh báo Hưng cảm nhẹ)'),
  noNeedAtAll('no_need_at_all', 'Không thấy cần ngủ, dư năng lượng (Cờ đỏ Hưng cảm)');

  final String code;
  final String labelVi;
  const FeltNeedForSleep(this.code, this.labelVi);

  bool get isReducedSleepNeed =>
      this == FeltNeedForSleep.reducedNeed ||
      this == FeltNeedForSleep.noNeedAtAll;

  static FeltNeedForSleep fromCode(String code) {
    return FeltNeedForSleep.values.firstWhere(
      (e) => e.code == code,
      orElse: () => FeltNeedForSleep.normal,
    );
  }
}

enum HrvContext {
  belowBaseline('below-baseline', 'Thấp hơn ngưỡng cá nhân (25th percentile)'),
  withinBaseline('within-baseline', 'Trong ngưỡng ổn định (25th–75th percentile)'),
  aboveBaseline('above-baseline', 'Cao hơn ngưỡng cá nhân (>75th percentile)');

  final String code;
  final String labelVi;
  const HrvContext(this.code, this.labelVi);

  static HrvContext? fromCode(String? code) {
    if (code == null) return null;
    for (final value in HrvContext.values) {
      if (value.code == code) return value;
    }
    return null;
  }
}

enum TechniqueSlug {
  thoughtRecord(
    'thought-record',
    'Nhật ký Suy nghĩ 7 Bước (CBT Thought Record)',
    'CBT',
  ),
  behavioralActivation(
    'behavioral-activation',
    'Kích hoạt Hành vi 6 Bước (Behavioral Activation)',
    'CBT',
  ),
  paradoxicalAgendaSetting(
    'paradoxical-agenda-setting',
    'Làm tan Kháng cự (TEAM-CBT Paradoxical Agenda Setting)',
    'TEAM-CBT',
  ),
  pleasurePredicting(
    'pleasure-predicting',
    'Dự đoán Niềm vui & Thành tựu (Pleasure-Predicting Sheet)',
    'TEAM-CBT',
  ),
  antiProcrastination(
    'anti-procrastination',
    'Bảng Chống Trì hoãn (Anti-Procrastination Sheet)',
    'TEAM-CBT',
  ),
  predictionCalibration(
    'prediction-calibration',
    'Hiệu chỉnh Dự đoán Thảm họa (Prediction Calibration)',
    'CBT',
  ),
  hypomaniaDevilsAdvocate(
    'hypomania-devils-advocate',
    'Phản biện Hưng cảm nhẹ (Devil\'s Advocate & 48h Rule)',
    'Bipolar-CBT',
  ),
  tipp(
    'tipp',
    'Hạ nhiệt Sinh lý Khẩn cấp (DBT TIPP)',
    'DBT',
  ),
  oppositeAction(
    'opposite-action',
    'Hành động Đối nghịch 4 Bước (DBT Opposite Action)',
    'DBT',
  ),
  wiseMind(
    'wise-mind',
    'Tâm Trí Tuệ 6 Bước (DBT Wise Mind)',
    'DBT',
  ),
  chainAnalysis(
    'chain-analysis',
    'Phân tích Chuỗi Hành vi 6 Bước (DBT Chain Analysis)',
    'DBT',
  ),
  dearMan(
    'dear-man',
    'Giao tiếp Hiệu quả & Đóng vai (DBT DEAR MAN + EAR)',
    'DBT',
  );

  final String slug;
  final String titleVi;
  final String modality;
  const TechniqueSlug(this.slug, this.titleVi, this.modality);

  static TechniqueSlug fromSlug(String slug) {
    return TechniqueSlug.values.firstWhere(
      (e) => e.slug == slug,
      orElse: () => TechniqueSlug.thoughtRecord,
    );
  }
}

enum SessionOutcome {
  completed('completed'),
  accurateThoughtExit('accurate-thought-exit'),
  justifiedExit('justified-exit'),
  stoppedEarly('stopped-early'),
  safetyStop('safety-stop'),
  impulseLocked48h('impulse-locked-48h');

  final String code;
  const SessionOutcome(this.code);

  static SessionOutcome fromCode(String code) {
    return SessionOutcome.values.firstWhere(
      (e) => e.code == code,
      orElse: () => SessionOutcome.completed,
    );
  }
}

class TrustedContact {
  final String name;
  final String relationship;
  final String phone;
  final bool notifyOnSafetyStop;
  final bool notifyOnSevereProdrome;

  const TrustedContact({
    required this.name,
    required this.relationship,
    required this.phone,
    this.notifyOnSafetyStop = true,
    this.notifyOnSevereProdrome = true,
  });

  Map<String, dynamic> toJson() => {
        'name': name,
        'relationship': relationship,
        'phone': phone,
        'notifyOnSafetyStop': notifyOnSafetyStop,
        'notifyOnSevereProdrome': notifyOnSevereProdrome,
      };

  factory TrustedContact.fromJson(Map<String, dynamic> json) {
    return TrustedContact(
      name: json['name'] as String? ?? '',
      relationship: json['relationship'] as String? ?? '',
      phone: json['phone'] as String? ?? '',
      notifyOnSafetyStop: json['notifyOnSafetyStop'] as bool? ?? true,
      notifyOnSevereProdrome: json['notifyOnSevereProdrome'] as bool? ?? true,
    );
  }
}

class UlyssesContract {
  final bool enabled;
  final DateTime createdAtWhileEuthymic;
  final List<String> personalManiaProdromes;
  final List<String> personalDepressionProdromes;
  final int autoActivateLowStimulusUiAtPole;
  final int autoEnable48hImpulseVaultAtPole;
  final List<TrustedContact> trustedContacts;
  final List<String> agreedDeescalationSteps;

  const UlyssesContract({
    required this.enabled,
    required this.createdAtWhileEuthymic,
    required this.personalManiaProdromes,
    required this.personalDepressionProdromes,
    this.autoActivateLowStimulusUiAtPole = 2,
    this.autoEnable48hImpulseVaultAtPole = 2,
    this.trustedContacts = const [],
    this.agreedDeescalationSteps = const [
      'Khóa mọi quyết định chi tiêu / đầu tư / nghỉ việc vào Khoang Chờ 48 Giờ',
      'Bật giao diện Dark Rest giảm kích thích và tắt thiết bị lúc 22:30',
      'Duy trì đúng liều thuốc ổn định khí sắc và liên hệ bác sĩ điều trị',
    ],
  });

  UlyssesContract copyWith({
    bool? enabled,
    DateTime? createdAtWhileEuthymic,
    List<String>? personalManiaProdromes,
    List<String>? personalDepressionProdromes,
    int? autoActivateLowStimulusUiAtPole,
    int? autoEnable48hImpulseVaultAtPole,
    List<TrustedContact>? trustedContacts,
    List<String>? agreedDeescalationSteps,
  }) {
    return UlyssesContract(
      enabled: enabled ?? this.enabled,
      createdAtWhileEuthymic:
          createdAtWhileEuthymic ?? this.createdAtWhileEuthymic,
      personalManiaProdromes:
          personalManiaProdromes ?? this.personalManiaProdromes,
      personalDepressionProdromes:
          personalDepressionProdromes ?? this.personalDepressionProdromes,
      autoActivateLowStimulusUiAtPole: autoActivateLowStimulusUiAtPole ??
          this.autoActivateLowStimulusUiAtPole,
      autoEnable48hImpulseVaultAtPole: autoEnable48hImpulseVaultAtPole ??
          this.autoEnable48hImpulseVaultAtPole,
      trustedContacts: trustedContacts ?? this.trustedContacts,
      agreedDeescalationSteps:
          agreedDeescalationSteps ?? this.agreedDeescalationSteps,
    );
  }

  Map<String, dynamic> toJson() => {
        'enabled': enabled,
        'createdAtWhileEuthymic': createdAtWhileEuthymic.toIso8601String(),
        'personalManiaProdromes': personalManiaProdromes,
        'personalDepressionProdromes': personalDepressionProdromes,
        'autoActivateLowStimulusUIAtPole': autoActivateLowStimulusUiAtPole,
        'autoEnable48hImpulseVaultAtPole': autoEnable48hImpulseVaultAtPole,
        'trustedContacts': trustedContacts.map((c) => c.toJson()).toList(),
        'agreedDeescalationSteps': agreedDeescalationSteps,
      };

  factory UlyssesContract.fromJson(Map<String, dynamic> json) {
    return UlyssesContract(
      enabled: json['enabled'] as bool? ?? true,
      createdAtWhileEuthymic: DateTime.tryParse(
            json['createdAtWhileEuthymic'] as String? ?? '',
          ) ??
          DateTime.now().toUtc(),
      personalManiaProdromes:
          (json['personalManiaProdromes'] as List<dynamic>? ?? const [])
              .map((e) => e.toString())
              .toList(),
      personalDepressionProdromes:
          (json['personalDepressionProdromes'] as List<dynamic>? ?? const [])
              .map((e) => e.toString())
              .toList(),
      autoActivateLowStimulusUiAtPole:
          json['autoActivateLowStimulusUIAtPole'] as int? ?? 2,
      autoEnable48hImpulseVaultAtPole:
          json['autoEnable48hImpulseVaultAtPole'] as int? ?? 2,
      trustedContacts: (json['trustedContacts'] as List<dynamic>? ?? const [])
          .map((e) => TrustedContact.fromJson(e as Map<String, dynamic>))
          .toList(),
      agreedDeescalationSteps:
          (json['agreedDeescalationSteps'] as List<dynamic>? ?? const [])
              .map((e) => e.toString())
              .toList(),
    );
  }
}

class UserClinicalProfile {
  final String userId;
  final String displayName;
  final List<DisorderFocus> disorderFocuses;
  final PushbackLevel preferredPushbackLevel;
  final String preferredLanguage; // 'vi' or 'en'
  final UlyssesContract ulyssesContract;
  final bool healthIntegrationOptIn;
  final bool healthPromptDeclinedPermanently;

  const UserClinicalProfile({
    required this.userId,
    required this.displayName,
    required this.disorderFocuses,
    this.preferredPushbackLevel = PushbackLevel.moderate,
    this.preferredLanguage = 'vi',
    required this.ulyssesContract,
    this.healthIntegrationOptIn = false,
    this.healthPromptDeclinedPermanently = false,
  });

  bool get hasBipolarSpectrum => disorderFocuses.any(
        (d) =>
            d == DisorderFocus.bipolar1 ||
            d == DisorderFocus.bipolar2 ||
            d == DisorderFocus.cyclothymia,
      );

  UserClinicalProfile copyWith({
    String? userId,
    String? displayName,
    List<DisorderFocus>? disorderFocuses,
    PushbackLevel? preferredPushbackLevel,
    String? preferredLanguage,
    UlyssesContract? ulyssesContract,
    bool? healthIntegrationOptIn,
    bool? healthPromptDeclinedPermanently,
  }) {
    return UserClinicalProfile(
      userId: userId ?? this.userId,
      displayName: displayName ?? this.displayName,
      disorderFocuses: disorderFocuses ?? this.disorderFocuses,
      preferredPushbackLevel:
          preferredPushbackLevel ?? this.preferredPushbackLevel,
      preferredLanguage: preferredLanguage ?? this.preferredLanguage,
      ulyssesContract: ulyssesContract ?? this.ulyssesContract,
      healthIntegrationOptIn:
          healthIntegrationOptIn ?? this.healthIntegrationOptIn,
      healthPromptDeclinedPermanently: healthPromptDeclinedPermanently ??
          this.healthPromptDeclinedPermanently,
    );
  }

  Map<String, dynamic> toJson() => {
        'userId': userId,
        'displayName': displayName,
        'disorderFocuses': disorderFocuses.map((e) => e.code).toList(),
        'preferredPushbackLevel': preferredPushbackLevel.code,
        'preferredLanguage': preferredLanguage,
        'ulyssesContract': ulyssesContract.toJson(),
        'healthIntegrationOptIn': healthIntegrationOptIn,
        'healthPromptDeclinedPermanently': healthPromptDeclinedPermanently,
      };

  factory UserClinicalProfile.fromJson(Map<String, dynamic> json) {
    return UserClinicalProfile(
      userId: json['userId'] as String? ?? 'local-user',
      displayName: json['displayName'] as String? ?? 'Người dùng',
      disorderFocuses: (json['disorderFocuses'] as List<dynamic>? ?? const [])
          .map((e) => DisorderFocus.fromCode(e.toString()))
          .toList(),
      preferredPushbackLevel: PushbackLevel.fromCode(
        json['preferredPushbackLevel'] as String? ?? 'moderate',
      ),
      preferredLanguage: json['preferredLanguage'] as String? ?? 'vi',
      ulyssesContract: json['ulyssesContract'] != null
          ? UlyssesContract.fromJson(
              json['ulyssesContract'] as Map<String, dynamic>,
            )
          : UlyssesContract(
              enabled: true,
              createdAtWhileEuthymic: DateTime.now().toUtc(),
              personalManiaProdromes: const [
                'Ngủ dưới 5 giờ nhưng không thấy mệt',
                'Lên kế hoạch dự án lớn lúc nửa đêm',
              ],
              personalDepressionProdromes: const [
                'Không trả lời tin nhắn trên 2 ngày',
                'Nằm trên giường cả buổi sáng',
              ],
            ),
      healthIntegrationOptIn: json['healthIntegrationOptIn'] as bool? ?? false,
      healthPromptDeclinedPermanently:
          json['healthPromptDeclinedPermanently'] as bool? ?? false,
    );
  }
}

class IpsrtAnchors {
  final String? outOfBedTime; // HH:mm
  final String? firstSocialContactTime; // HH:mm
  final String? workOrStudyStartTime; // HH:mm
  final String? dinnerTime; // HH:mm
  final String? bedTime; // HH:mm

  const IpsrtAnchors({
    this.outOfBedTime,
    this.firstSocialContactTime,
    this.workOrStudyStartTime,
    this.dinnerTime,
    this.bedTime,
  });

  List<String?> get allAnchors => [
        outOfBedTime,
        firstSocialContactTime,
        workOrStudyStartTime,
        dinnerTime,
        bedTime,
      ];

  int get completedCount =>
      allAnchors.where((t) => t != null && t.trim().isNotEmpty).length;

  IpsrtAnchors copyWith({
    String? outOfBedTime,
    String? firstSocialContactTime,
    String? workOrStudyStartTime,
    String? dinnerTime,
    String? bedTime,
  }) {
    return IpsrtAnchors(
      outOfBedTime: outOfBedTime ?? this.outOfBedTime,
      firstSocialContactTime:
          firstSocialContactTime ?? this.firstSocialContactTime,
      workOrStudyStartTime: workOrStudyStartTime ?? this.workOrStudyStartTime,
      dinnerTime: dinnerTime ?? this.dinnerTime,
      bedTime: bedTime ?? this.bedTime,
    );
  }

  Map<String, dynamic> toJson() => {
        'outOfBedTime': outOfBedTime,
        'firstSocialContactTime': firstSocialContactTime,
        'workOrStudyStartTime': workOrStudyStartTime,
        'dinnerTime': dinnerTime,
        'bedTime': bedTime,
      };

  factory IpsrtAnchors.fromJson(Map<String, dynamic> json) {
    return IpsrtAnchors(
      outOfBedTime: json['outOfBedTime'] as String?,
      firstSocialContactTime: json['firstSocialContactTime'] as String?,
      workOrStudyStartTime: json['workOrStudyStartTime'] as String?,
      dinnerTime: json['dinnerTime'] as String?,
      bedTime: json['bedTime'] as String?,
    );
  }
}

class MedicationIntakeRecord {
  final String medicationId;
  final String name;
  final String dosage;
  final String? takenAt; // HH:mm or ISO
  final String? skippedReason;
  final String? sideEffectNote;

  const MedicationIntakeRecord({
    required this.medicationId,
    required this.name,
    required this.dosage,
    this.takenAt,
    this.skippedReason,
    this.sideEffectNote,
  });

  bool get isTaken => takenAt != null && takenAt!.isNotEmpty;

  Map<String, dynamic> toJson() => {
        'medicationId': medicationId,
        'name': name,
        'dosage': dosage,
        'takenAt': takenAt,
        'skippedReason': skippedReason,
        'sideEffectNote': sideEffectNote,
      };

  factory MedicationIntakeRecord.fromJson(Map<String, dynamic> json) {
    return MedicationIntakeRecord(
      medicationId: json['medicationId'] as String? ?? '',
      name: json['name'] as String? ?? '',
      dosage: json['dosage'] as String? ?? '',
      takenAt: json['takenAt'] as String?,
      skippedReason: json['skippedReason'] as String?,
      sideEffectNote: json['sideEffectNote'] as String?,
    );
  }
}

class DailyMoodAndRhythmLog {
  final String id;
  final String userId;
  final DateTime loggedAt;
  final int moodPolarity; // -5..+5
  final int energyLevel; // -5..+5
  final int irritabilityIntensity; // 0..10
  final int anxietyIntensity; // 0..10
  final double sleepDurationHours;
  final int sleepQuality; // 1..5
  final FeltNeedForSleep feltNeedForSleep;
  final HrvContext? hrvContext;
  final IpsrtAnchors ipsrtAnchors;
  final List<MedicationIntakeRecord> medicationsTaken;
  final bool mixedStateAlertTriggered;
  final String? journalNote;

  const DailyMoodAndRhythmLog({
    required this.id,
    required this.userId,
    required this.loggedAt,
    required this.moodPolarity,
    required this.energyLevel,
    required this.irritabilityIntensity,
    required this.anxietyIntensity,
    required this.sleepDurationHours,
    required this.sleepQuality,
    required this.feltNeedForSleep,
    this.hrvContext,
    required this.ipsrtAnchors,
    this.medicationsTaken = const [],
    required this.mixedStateAlertTriggered,
    this.journalNote,
  });

  factory DailyMoodAndRhythmLog.createValidated({
    required String id,
    required String userId,
    required DateTime loggedAt,
    required int moodPolarity,
    required int energyLevel,
    required int irritabilityIntensity,
    required int anxietyIntensity,
    required double sleepDurationHours,
    int sleepQuality = 3,
    required FeltNeedForSleep feltNeedForSleep,
    HrvContext? hrvContext,
    required IpsrtAnchors ipsrtAnchors,
    List<MedicationIntakeRecord> medicationsTaken = const [],
    String? journalNote,
  }) {
    final clampedMood = moodPolarity.clamp(-5, 5);
    final clampedEnergy = energyLevel.clamp(-5, 5);
    final clampedIrritability = irritabilityIntensity.clamp(0, 10);
    final clampedAnxiety = anxietyIntensity.clamp(0, 10);
    final isMixed = clampedMood <= -2 && clampedEnergy >= 2;
    return DailyMoodAndRhythmLog(
      id: id,
      userId: userId,
      loggedAt: loggedAt,
      moodPolarity: clampedMood,
      energyLevel: clampedEnergy,
      irritabilityIntensity: clampedIrritability,
      anxietyIntensity: clampedAnxiety,
      sleepDurationHours: sleepDurationHours.clamp(0.0, 24.0),
      sleepQuality: sleepQuality.clamp(1, 5),
      feltNeedForSleep: feltNeedForSleep,
      hrvContext: hrvContext,
      ipsrtAnchors: ipsrtAnchors,
      medicationsTaken: medicationsTaken,
      mixedStateAlertTriggered: isMixed,
      journalNote: journalNote,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'userId': userId,
        'loggedAt': loggedAt.toIso8601String(),
        'moodPolarity': moodPolarity,
        'energyLevel': energyLevel,
        'irritabilityIntensity': irritabilityIntensity,
        'anxietyIntensity': anxietyIntensity,
        'sleepDurationHours': sleepDurationHours,
        'sleepQuality': sleepQuality,
        'feltNeedForSleep': feltNeedForSleep.code,
        'hrvContext': hrvContext?.code,
        'ipsrtAnchors': ipsrtAnchors.toJson(),
        'medicationsTaken': medicationsTaken.map((m) => m.toJson()).toList(),
        'mixedStateAlertTriggered': mixedStateAlertTriggered,
        'journalNote': journalNote,
      };

  factory DailyMoodAndRhythmLog.fromJson(Map<String, dynamic> json) {
    final mood = (json['moodPolarity'] as num? ?? 0).toInt().clamp(-5, 5);
    final energy = (json['energyLevel'] as num? ?? 0).toInt().clamp(-5, 5);
    return DailyMoodAndRhythmLog(
      id: json['id'] as String? ?? '',
      userId: json['userId'] as String? ?? 'local-user',
      loggedAt: DateTime.tryParse(json['loggedAt'] as String? ?? '') ??
          DateTime.now().toUtc(),
      moodPolarity: mood,
      energyLevel: energy,
      irritabilityIntensity:
          (json['irritabilityIntensity'] as num? ?? 0).toInt().clamp(0, 10),
      anxietyIntensity:
          (json['anxietyIntensity'] as num? ?? 0).toInt().clamp(0, 10),
      sleepDurationHours:
          (json['sleepDurationHours'] as num? ?? 7.0).toDouble(),
      sleepQuality: (json['sleepQuality'] as num? ?? 3).toInt().clamp(1, 5),
      feltNeedForSleep: FeltNeedForSleep.fromCode(
        json['feltNeedForSleep'] as String? ?? 'normal',
      ),
      hrvContext: HrvContext.fromCode(json['hrvContext'] as String?),
      ipsrtAnchors: json['ipsrtAnchors'] != null
          ? IpsrtAnchors.fromJson(json['ipsrtAnchors'] as Map<String, dynamic>)
          : const IpsrtAnchors(),
      medicationsTaken:
          (json['medicationsTaken'] as List<dynamic>? ?? const [])
              .map(
                (e) => MedicationIntakeRecord.fromJson(
                  e as Map<String, dynamic>,
                ),
              )
              .toList(),
      mixedStateAlertTriggered:
          json['mixedStateAlertTriggered'] as bool? ?? (mood <= -2 && energy >= 2),
      journalNote: json['journalNote'] as String?,
    );
  }
}

class CognitiveToolkitSession {
  final String id;
  final TechniqueSlug technique;
  final String date; // YYYY-MM-DD
  final String time; // HH:mm
  final String channel; // 'flutter-mobile' | 'voice-burst'
  final String language; // 'vi' | 'en'
  final PushbackLevel pushbackLevel;
  final int preIntensity; // 0..10
  final int? postIntensity; // 0..10
  final int? intensityDelta; // post - pre
  final int? moodPolarityAtStart; // -5..+5
  final List<String> emotions;
  final List<String> negativeDistortionsIdentified;
  final List<String> positiveDistortionsIdentified;
  final List<String> selfDefeatingBeliefsIdentified;
  final int stepsCompleted;
  final List<String> stepsSkipped;
  final SessionOutcome outcome;
  final HrvContext? hrvContext;
  final Map<String, dynamic> structuredStepsPayload;
  final String? takeaway;

  const CognitiveToolkitSession({
    required this.id,
    required this.technique,
    required this.date,
    required this.time,
    this.channel = 'flutter-mobile',
    this.language = 'vi',
    required this.pushbackLevel,
    required this.preIntensity,
    this.postIntensity,
    this.intensityDelta,
    this.moodPolarityAtStart,
    this.emotions = const [],
    this.negativeDistortionsIdentified = const [],
    this.positiveDistortionsIdentified = const [],
    this.selfDefeatingBeliefsIdentified = const [],
    required this.stepsCompleted,
    this.stepsSkipped = const [],
    required this.outcome,
    this.hrvContext,
    this.structuredStepsPayload = const {},
    this.takeaway,
  });

  CognitiveToolkitSession copyWith({
    String? id,
    TechniqueSlug? technique,
    String? date,
    String? time,
    String? channel,
    String? language,
    PushbackLevel? pushbackLevel,
    int? preIntensity,
    int? postIntensity,
    int? intensityDelta,
    int? moodPolarityAtStart,
    List<String>? emotions,
    List<String>? negativeDistortionsIdentified,
    List<String>? positiveDistortionsIdentified,
    List<String>? selfDefeatingBeliefsIdentified,
    int? stepsCompleted,
    List<String>? stepsSkipped,
    SessionOutcome? outcome,
    HrvContext? hrvContext,
    Map<String, dynamic>? structuredStepsPayload,
    String? takeaway,
  }) {
    return CognitiveToolkitSession(
      id: id ?? this.id,
      technique: technique ?? this.technique,
      date: date ?? this.date,
      time: time ?? this.time,
      channel: channel ?? this.channel,
      language: language ?? this.language,
      pushbackLevel: pushbackLevel ?? this.pushbackLevel,
      preIntensity: preIntensity ?? this.preIntensity,
      postIntensity: postIntensity ?? this.postIntensity,
      intensityDelta: intensityDelta ?? this.intensityDelta,
      moodPolarityAtStart: moodPolarityAtStart ?? this.moodPolarityAtStart,
      emotions: emotions ?? this.emotions,
      negativeDistortionsIdentified:
          negativeDistortionsIdentified ?? this.negativeDistortionsIdentified,
      positiveDistortionsIdentified:
          positiveDistortionsIdentified ?? this.positiveDistortionsIdentified,
      selfDefeatingBeliefsIdentified:
          selfDefeatingBeliefsIdentified ?? this.selfDefeatingBeliefsIdentified,
      stepsCompleted: stepsCompleted ?? this.stepsCompleted,
      stepsSkipped: stepsSkipped ?? this.stepsSkipped,
      outcome: outcome ?? this.outcome,
      hrvContext: hrvContext ?? this.hrvContext,
      structuredStepsPayload:
          structuredStepsPayload ?? this.structuredStepsPayload,
      takeaway: takeaway ?? this.takeaway,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': 'cognitive-toolkit-session',
        'technique': technique.slug,
        'date': date,
        'time': time,
        'channel': channel,
        'language': language,
        'pushbackLevel': pushbackLevel.code,
        'preIntensity': preIntensity,
        'postIntensity': postIntensity,
        'intensityDelta': intensityDelta,
        'moodPolarityAtStart': moodPolarityAtStart,
        'emotions': emotions,
        'negativeDistortionsIdentified': negativeDistortionsIdentified,
        'positiveDistortionsIdentified': positiveDistortionsIdentified,
        'selfDefeatingBeliefsIdentified': selfDefeatingBeliefsIdentified,
        'stepsCompleted': stepsCompleted,
        'stepsSkipped': stepsSkipped,
        'outcome': outcome.code,
        'hrvContext': hrvContext?.code,
        'structuredStepsPayload': structuredStepsPayload,
        'takeaway': takeaway,
      };

  factory CognitiveToolkitSession.fromJson(Map<String, dynamic> json) {
    return CognitiveToolkitSession(
      id: json['id'] as String? ?? '',
      technique: TechniqueSlug.fromSlug(
        json['technique'] as String? ?? 'thought-record',
      ),
      date: json['date'] as String? ?? '',
      time: json['time'] as String? ?? '',
      channel: json['channel'] as String? ?? 'flutter-mobile',
      language: json['language'] as String? ?? 'vi',
      pushbackLevel: PushbackLevel.fromCode(
        json['pushbackLevel'] as String? ?? 'moderate',
      ),
      preIntensity: (json['preIntensity'] as num? ?? 5).toInt(),
      postIntensity: (json['postIntensity'] as num?)?.toInt(),
      intensityDelta: (json['intensityDelta'] as num?)?.toInt(),
      moodPolarityAtStart: (json['moodPolarityAtStart'] as num?)?.toInt(),
      emotions: (json['emotions'] as List<dynamic>? ?? const [])
          .map((e) => e.toString())
          .toList(),
      negativeDistortionsIdentified:
          (json['negativeDistortionsIdentified'] as List<dynamic>? ?? const [])
              .map((e) => e.toString())
              .toList(),
      positiveDistortionsIdentified:
          (json['positiveDistortionsIdentified'] as List<dynamic>? ?? const [])
              .map((e) => e.toString())
              .toList(),
      selfDefeatingBeliefsIdentified:
          (json['selfDefeatingBeliefsIdentified'] as List<dynamic>? ?? const [])
              .map((e) => e.toString())
              .toList(),
      stepsCompleted: (json['stepsCompleted'] as num? ?? 0).toInt(),
      stepsSkipped: (json['stepsSkipped'] as List<dynamic>? ?? const [])
          .map((e) => e.toString())
          .toList(),
      outcome: SessionOutcome.fromCode(
        json['outcome'] as String? ?? 'completed',
      ),
      hrvContext: HrvContext.fromCode(json['hrvContext'] as String?),
      structuredStepsPayload:
          json['structuredStepsPayload'] as Map<String, dynamic>? ?? const {},
      takeaway: json['takeaway'] as String?,
    );
  }
}

class ImpulseVaultItem {
  final String id;
  final String impulseTitle;
  final String category; // 'financial' | 'career' | 'relationship' | 'project'
  final double? estimatedCostVnd;
  final int moodPolarityWhenLogged;
  final DateTime createdAt;
  final DateTime unlocksAt; // createdAt + 48 hours
  final String prosOfActingNow;
  final String consOfActingNow;
  final String prosOfWaiting48h;
  final String consOfWaiting48h;
  final String devilsAdvocateCounterArgument;
  final bool twoPersonRealityCheckRequested;
  final List<String> positiveDistortionsDetected;
  final String status; // 'locked_48h' | 'cancelled_wisely' | 'reviewed_after_48h'

  const ImpulseVaultItem({
    required this.id,
    required this.impulseTitle,
    required this.category,
    this.estimatedCostVnd,
    required this.moodPolarityWhenLogged,
    required this.createdAt,
    required this.unlocksAt,
    required this.prosOfActingNow,
    required this.consOfActingNow,
    required this.prosOfWaiting48h,
    required this.consOfWaiting48h,
    required this.devilsAdvocateCounterArgument,
    this.twoPersonRealityCheckRequested = false,
    this.positiveDistortionsDetected = const [],
    this.status = 'locked_48h',
  });

  bool isStillLocked(DateTime now) =>
      status == 'locked_48h' && now.isBefore(unlocksAt);

  Duration remainingLockDuration(DateTime now) {
    if (!isStillLocked(now)) return Duration.zero;
    return unlocksAt.difference(now);
  }

  ImpulseVaultItem copyWith({
    String? status,
    bool? twoPersonRealityCheckRequested,
  }) {
    return ImpulseVaultItem(
      id: id,
      impulseTitle: impulseTitle,
      category: category,
      estimatedCostVnd: estimatedCostVnd,
      moodPolarityWhenLogged: moodPolarityWhenLogged,
      createdAt: createdAt,
      unlocksAt: unlocksAt,
      prosOfActingNow: prosOfActingNow,
      consOfActingNow: consOfActingNow,
      prosOfWaiting48h: prosOfWaiting48h,
      consOfWaiting48h: consOfWaiting48h,
      devilsAdvocateCounterArgument: devilsAdvocateCounterArgument,
      twoPersonRealityCheckRequested:
          twoPersonRealityCheckRequested ?? this.twoPersonRealityCheckRequested,
      positiveDistortionsDetected: positiveDistortionsDetected,
      status: status ?? this.status,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'impulseTitle': impulseTitle,
        'category': category,
        'estimatedCostVnd': estimatedCostVnd,
        'moodPolarityWhenLogged': moodPolarityWhenLogged,
        'createdAt': createdAt.toIso8601String(),
        'unlocksAt': unlocksAt.toIso8601String(),
        'prosOfActingNow': prosOfActingNow,
        'consOfActingNow': consOfActingNow,
        'prosOfWaiting48h': prosOfWaiting48h,
        'consOfWaiting48h': consOfWaiting48h,
        'devilsAdvocateCounterArgument': devilsAdvocateCounterArgument,
        'twoPersonRealityCheckRequested': twoPersonRealityCheckRequested,
        'positiveDistortionsDetected': positiveDistortionsDetected,
        'status': status,
      };

  factory ImpulseVaultItem.fromJson(Map<String, dynamic> json) {
    final created = DateTime.tryParse(json['createdAt'] as String? ?? '') ??
        DateTime.now().toUtc();
    return ImpulseVaultItem(
      id: json['id'] as String? ?? '',
      impulseTitle: json['impulseTitle'] as String? ?? '',
      category: json['category'] as String? ?? 'financial',
      estimatedCostVnd: (json['estimatedCostVnd'] as num?)?.toDouble(),
      moodPolarityWhenLogged:
          (json['moodPolarityWhenLogged'] as num? ?? 2).toInt(),
      createdAt: created,
      unlocksAt: DateTime.tryParse(json['unlocksAt'] as String? ?? '') ??
          created.add(const Duration(hours: 48)),
      prosOfActingNow: json['prosOfActingNow'] as String? ?? '',
      consOfActingNow: json['consOfActingNow'] as String? ?? '',
      prosOfWaiting48h: json['prosOfWaiting48h'] as String? ?? '',
      consOfWaiting48h: json['consOfWaiting48h'] as String? ?? '',
      devilsAdvocateCounterArgument:
          json['devilsAdvocateCounterArgument'] as String? ?? '',
      twoPersonRealityCheckRequested:
          json['twoPersonRealityCheckRequested'] as bool? ?? false,
      positiveDistortionsDetected:
          (json['positiveDistortionsDetected'] as List<dynamic>? ?? const [])
              .map((e) => e.toString())
              .toList(),
      status: json['status'] as String? ?? 'locked_48h',
    );
  }
}

class WorryBoxItem {
  final String id;
  final String worryText;
  final DateTime capturedAt;
  final String scheduledReviewTime; // e.g., '17:30'
  final bool isProductiveActionableWorry;
  final String? nextSmallActionOrAcceptanceNote;
  final bool reviewed;

  const WorryBoxItem({
    required this.id,
    required this.worryText,
    required this.capturedAt,
    this.scheduledReviewTime = '17:30',
    required this.isProductiveActionableWorry,
    this.nextSmallActionOrAcceptanceNote,
    this.reviewed = false,
  });

  WorryBoxItem copyWith({
    bool? isProductiveActionableWorry,
    String? nextSmallActionOrAcceptanceNote,
    bool? reviewed,
  }) {
    return WorryBoxItem(
      id: id,
      worryText: worryText,
      capturedAt: capturedAt,
      scheduledReviewTime: scheduledReviewTime,
      isProductiveActionableWorry:
          isProductiveActionableWorry ?? this.isProductiveActionableWorry,
      nextSmallActionOrAcceptanceNote: nextSmallActionOrAcceptanceNote ??
          this.nextSmallActionOrAcceptanceNote,
      reviewed: reviewed ?? this.reviewed,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'worryText': worryText,
        'capturedAt': capturedAt.toIso8601String(),
        'scheduledReviewTime': scheduledReviewTime,
        'isProductiveActionableWorry': isProductiveActionableWorry,
        'nextSmallActionOrAcceptanceNote': nextSmallActionOrAcceptanceNote,
        'reviewed': reviewed,
      };
}

class ExposureStep {
  final String id;
  final String fearSituation;
  final int baselineSuds; // 0..100
  final int? postExposureSuds; // 0..100
  final List<String> safetyBehaviorsToDrop;
  final bool isInteroceptive;
  final bool medicalScreeningCleared;
  final bool completed;

  const ExposureStep({
    required this.id,
    required this.fearSituation,
    required this.baselineSuds,
    this.postExposureSuds,
    this.safetyBehaviorsToDrop = const [],
    this.isInteroceptive = false,
    this.medicalScreeningCleared = true,
    this.completed = false,
  });

  ExposureStep copyWith({
    int? postExposureSuds,
    bool? completed,
  }) {
    return ExposureStep(
      id: id,
      fearSituation: fearSituation,
      baselineSuds: baselineSuds,
      postExposureSuds: postExposureSuds ?? this.postExposureSuds,
      safetyBehaviorsToDrop: safetyBehaviorsToDrop,
      isInteroceptive: isInteroceptive,
      medicalScreeningCleared: medicalScreeningCleared,
      completed: completed ?? this.completed,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'fearSituation': fearSituation,
        'baselineSuds': baselineSuds,
        'postExposureSuds': postExposureSuds,
        'safetyBehaviorsToDrop': safetyBehaviorsToDrop,
        'isInteroceptive': isInteroceptive,
        'medicalScreeningCleared': medicalScreeningCleared,
        'completed': completed,
      };
}

class AssessmentRecord {
  final String id;
  final String scaleCode; // 'BMS' | 'PHQ-9' | 'GAD-7' | 'ASRM' | 'MDQ' | 'ISI'
  final DateTime completedAt;
  final int totalScore;
  final String severityCode;
  final String interpretationVi;
  final String interpretationEn;
  final bool triggersSafetyStop;
  final bool triggersHypomaniaGuard;
  final bool recommendsClinicianConsult;
  final Map<String, int> itemScores;

  const AssessmentRecord({
    required this.id,
    required this.scaleCode,
    required this.completedAt,
    required this.totalScore,
    required this.severityCode,
    required this.interpretationVi,
    required this.interpretationEn,
    this.triggersSafetyStop = false,
    this.triggersHypomaniaGuard = false,
    this.recommendsClinicianConsult = false,
    this.itemScores = const {},
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'scaleCode': scaleCode,
        'completedAt': completedAt.toIso8601String(),
        'totalScore': totalScore,
        'severityCode': severityCode,
        'interpretationVi': interpretationVi,
        'interpretationEn': interpretationEn,
        'triggersSafetyStop': triggersSafetyStop,
        'triggersHypomaniaGuard': triggersHypomaniaGuard,
        'recommendsClinicianConsult': recommendsClinicianConsult,
        'itemScores': itemScores,
      };

  factory AssessmentRecord.fromJson(Map<String, dynamic> json) {
    return AssessmentRecord(
      id: json['id'] as String? ?? '',
      scaleCode: json['scaleCode'] as String? ?? 'PHQ-9',
      completedAt: DateTime.tryParse(json['completedAt'] as String? ?? '') ??
          DateTime.now().toUtc(),
      totalScore: (json['totalScore'] as num? ?? 0).toInt(),
      severityCode: json['severityCode'] as String? ?? 'minimal',
      interpretationVi: json['interpretationVi'] as String? ?? '',
      interpretationEn: json['interpretationEn'] as String? ?? '',
      triggersSafetyStop: json['triggersSafetyStop'] as bool? ?? false,
      triggersHypomaniaGuard: json['triggersHypomaniaGuard'] as bool? ?? false,
      recommendsClinicianConsult:
          json['recommendsClinicianConsult'] as bool? ?? false,
      itemScores: (json['itemScores'] as Map<String, dynamic>? ?? const {})
          .map((k, v) => MapEntry(k, (v as num).toInt())),
    );
  }

  String toJsonString() => jsonEncode(toJson());
}
