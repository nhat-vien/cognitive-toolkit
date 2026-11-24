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

  /// V2 T04 Gate (`SAFE-03`, `SAFE-04`):
  /// Blocks self-starting protocols that are in `draft` / `deprecated` status or require clinician assistance.
  static bool canStartProtocolSelfGuided({
    required ProtocolLifecycleStatus status,
    required bool isClinicianAssistedRequired,
    required PathwayWorkflowState pathwayState,
    bool hasActiveClinicianGrant = false,
  }) {
    if (pathwayState == PathwayWorkflowState.emergencyGuidance ||
        pathwayState == PathwayWorkflowState.urgentHumanSupport) {
      return false;
    }
    if (isClinicianAssistedRequired && !hasActiveClinicianGrant) {
      return false;
    }
    return status == ProtocolLifecycleStatus.approved ||
        status == ProtocolLifecycleStatus.released;
  }

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

  /// V2 T07 (`CAT-01..03`): Canonical Legacy Flutter Slug -> Canonical V2 Practice ID map
  static const Map<String, String> kCanonicalPracticeIdByFlutterSlug = <String, String>{
    'thought-record-7-step': 'prac-tool-01-thought-record',
    'cognitive-distortion-checker': 'prac-tool-02-distortion-checker',
    'decatastrophizing-what-if': 'prac-tool-03-catastrophe-reframer',
    'downward-arrow-23-sdb': 'prac-tool-04-core-belief-detector',
    'safety-behavior-detector': 'prac-tool-05-safety-behavior-detector',
    'prediction-calibration-tracker': 'prac-tool-06-prediction-calibration',
    'exposure-hierarchy-suds-builder': 'prac-tool-07-exposure-hierarchy-erp',
    'interoceptive-exposure-panic-trainer': 'prac-tool-08-interoceptive-exposure-screen',
    'worry-box-postponement': 'prac-tool-09-worry-box-postponement',
    'erp-ocd-ritual-delay-timer': 'prac-tool-10-panic-diary',
    'feared-fantasy-shame-attacking': 'prac-tool-11-social-anxiety-spotlight-reframer',
    'fact-vs-opinion-separator': 'prac-tool-12-health-anxiety-symptom-reframer',
    'responsibility-pie-chart': 'prac-tool-13-ptsd-stuck-point-log',
    'accuracy-check-split-tool': 'prac-tool-14-intrusive-thought-defusion',
    'cost-benefit-analysis-belief': 'prac-tool-15-perfectionism-cost-benefit',
    'core-belief-positive-data-log': 'prac-tool-16-low-self-esteem-positive-data-log',
    'continuum-shades-of-gray': 'prac-tool-17-imposter-syndrome-evidence-log',
    'behavioral-activation-rest-check': 'prac-tool-18-burnout-and-rest-check',
    'dbt-chain-analysis-dear-man-ear': 'prac-tool-19-anger-disarming-ear',
    'cbti-sleep-efficiency-calculator': 'prac-tool-20-cbti-sleep-efficiency-calculator',
    'self-compassion-harsh-critic-reframe': 'prac-tool-21-shame-attacking-compassionate-reframe',
    'dbt-tipp-stop-medical-gate': 'prac-tool-22-grief-and-loss-coping',
    'structured-problem-solving-5-step': 'prac-tool-23-adhd-rsd-thought-detector',
    'hidden-emotion-niceness-uncovering': 'prac-tool-24-relationship-anxiety-downward-arrow',
    'anti-procrastination-sheet': 'prac-tool-25-anti-procrastination-5min-starter',
    'pleasure-predicting-sheet': 'prac-tool-26-pleasure-predicting-mp-sheet',
    'paradoxical-agenda-setting': 'prac-tool-27-paradoxical-agenda-setting',
    'externalization-of-voices': 'prac-tool-28-externalization-of-voices',
    'double-standard-compassionate-friend': 'prac-tool-29-double-standard-friend-roleplay',
    'semantic-should-to-preference': 'prac-tool-30-feared-fantasy',
    'dbt-radical-acceptance-urge-surfing': 'prac-tool-31-dbt-radical-acceptance-urge-surfing',
    'dbt-wise-mind-abc-please-accepts': 'prac-tool-32-dbt-abc-please-checklist',
    'dbt-opposite-action-justified-check': 'prac-tool-33-dbt-accepts-5senses-self-soothe',
    'bipolar-positive-distortion-devils-advocate': 'prac-tool-34-bipolar-positive-distortion-devils-advocate',
    'bipolar-48h-impulse-vault-crisis-pros-cons': 'prac-tool-35-bipolar-48h-impulse-pros-cons',
    'bipolar-ipsrt-rhythm-medication-cba': 'prac-tool-36-bipolar-medication-adherence-cost-benefit',
  };

  static String? resolveCanonicalPracticeId(String slugOrProtocolId) {
    final trimmed = slugOrProtocolId.trim();
    if (trimmed.isEmpty) return null;
    if (kCanonicalPracticeIdByFlutterSlug.containsKey(trimmed)) {
      return kCanonicalPracticeIdByFlutterSlug[trimmed];
    }
    if (trimmed == trimmed.toUpperCase() && trimmed.contains('_')) {
      return 'proto-${trimmed.toLowerCase().replaceAll('_', '-')}';
    }
    return trimmed;
  }
}
