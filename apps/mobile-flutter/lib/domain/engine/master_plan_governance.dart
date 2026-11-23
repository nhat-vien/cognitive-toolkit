// CLINICAL_PROTOCOL_MASTER_PLAN.md — Dart Governance, Safety Engine & Protocol Contract
// Synchronized with `packages/clinical-core-ts/src/master-plan/master-plan-governance.ts`.

enum DataProvenance {
  userSelfReport,
  questionnaire,
  clinicianEntry,
  deviceDerived,
  aiSummaryConfirmed,
  systemDerived,
}

enum PathwayWorkflowState {
  routineSupport,
  distressSupport,
  professionalFollowUpRecommended,
  urgentHumanSupport,
  emergencyGuidance,
}

enum ProtocolLifecycleStatus {
  planned,
  draft,
  inContentReview,
  inClinicalReview,
  inSafetyReview,
  approved,
  released,
  deprecated,
  blocked,
}

class PersonalSafetyPlanModel {
  final String id;
  final String userId;
  final List<String> section1WarningSigns;
  final List<String> section2InternalCopingStrategies;
  final List<String> section3DistractionPeopleAndPlaces;
  final List<String> section4TrustedPeopleToAskForHelp;
  final List<String> section5ProfessionalAndEmergencyContacts;
  final List<String> section6EnvironmentSafetySteps;
  final bool explicitConsentForStoringContacts;
  final bool reviewedWithClinician;

  const PersonalSafetyPlanModel({
    required this.id,
    required this.userId,
    this.section1WarningSigns = const <String>[],
    this.section2InternalCopingStrategies = const <String>[],
    this.section3DistractionPeopleAndPlaces = const <String>[],
    this.section4TrustedPeopleToAskForHelp = const <String>[],
    this.section5ProfessionalAndEmergencyContacts = const <String>[],
    this.section6EnvironmentSafetySteps = const <String>[],
    required this.explicitConsentForStoringContacts,
    this.reviewedWithClinician = false,
  });

  bool get isValid {
    final hasContacts = section4TrustedPeopleToAskForHelp.isNotEmpty ||
        section5ProfessionalAndEmergencyContacts.isNotEmpty;
    if (hasContacts && !explicitConsentForStoringContacts) {
      return false;
    }
    return id.isNotEmpty && userId.isNotEmpty;
  }
}

class Who5EvaluationResult {
  final int rawScore;
  final int percentageScore;
  final bool isDiagnosis;
  final String labelVi;
  final String interpretationVi;

  const Who5EvaluationResult({
    required this.rawScore,
    required this.percentageScore,
    this.isDiagnosis = false,
    required this.labelVi,
    required this.interpretationVi,
  });
}

class MasterPlanGovernanceEngine {
  static const String nonMonitoringNoticeVi =
      'Ứng dụng không có người trực giám sát liên tục 24/7 và không thể tự điều phối xe cấp cứu. Tất cả cuộc gọi đều do bạn chủ động thực hiện.';

  static Who5EvaluationResult scoreWho5(List<int> items) {
    if (items.length != 5) {
      throw ArgumentError('WHO-5 requires exactly 5 items (0..5).');
    }
    var raw = 0;
    for (final item in items) {
      if (item < 0 || item > 5) {
        throw ArgumentError('Each WHO-5 item must be between 0 and 5.');
      }
      raw += item;
    }
    final pct = raw * 4;
    final low = pct <= 50;
    return Who5EvaluationResult(
      rawScore: raw,
      percentageScore: pct,
      isDiagnosis: false,
      labelVi: low
          ? 'Mức độ cảm nhận an vui đang thấp ($pct/100)'
          : 'Mức độ cảm nhận an vui ổn định ($pct/100)',
      interpretationVi:
          'Chỉ số tự theo dõi cảm nhận sức khỏe tinh thần tích cực trong 2 tuần qua (không phải chẩn đoán y khoa).',
    );
  }
}
