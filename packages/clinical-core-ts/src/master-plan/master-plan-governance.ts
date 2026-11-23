/**
 * CLINICAL_PROTOCOL_MASTER_PLAN.md — Core Governance, Safety Subsystem, Protocol Contract & Clinical Modules
 *
 * Implements:
 * - §1.3 & §9.1: 7 Separated Pathway Concepts & Data Provenance (blocks unconfirmed AI inference as fact)
 * - §2.3 & §3.1–3.6: Dedicated Deterministic Safety Engine (5 non-diagnostic workflow states, zero "low risk" claim,
 *   Reviewed Offline Emergency Directory with freshness check, 6-Section Personal Safety Plan, SafetyEvent audit)
 * - §4.1–4.7 & §5.1–5.3: 19-Field Protocol Manifest Validator, Lifecycle Enforcer (blocks `approved` without
 *   clinical sign-off), and Complete 68-Protocol Catalog (CBT 11, TEAM-CBT 7, DBT 19, IPSRT 7, MBCT 8, Psychoeducation 10, FFT 6)
 * - §6.1–6.4: Instrument Governance Registry, WHO-5 Well-Being Scale, C-SSRS Governance Guard & Non-Symptom Outcome Domains
 * - §7: Medication Reminder vs. Intake Log Separation & Anti-Prescribing Guard
 * - §3.5 & §4.4: Multi-Signal Bipolar Monitoring & Timezone-Aware Individualized Routine Regularity (Non-SRM)
 * - §4.7 & §9.2: Granular Caregiver Access Grants with Default Privacy & Instant Revocation
 * - §10.3: User-Controlled Clinical Report Preview & Field-Level Redaction
 */

import type { ValidationResult } from '../schemas/models.ts';

// =============================================================================
// 1. DATA PROVENANCE & 7 SEPARATED CLINICAL PATHWAY CONCEPTS (§1.3, §9.1)
// =============================================================================

export type DataProvenance =
  | 'user_self_report'
  | 'questionnaire'
  | 'clinician_entry'
  | 'device_derived'
  | 'ai_summary_confirmed'
  | 'system_derived';

export interface ProvenancedValue<T> {
  value: T;
  provenance: DataProvenance;
  recordedAt: string; // ISO-8601
  confirmedByUser?: boolean;
  sourceId?: string;
}

const VALID_PROVENANCE = new Set<DataProvenance>([
  'user_self_report',
  'questionnaire',
  'clinician_entry',
  'device_derived',
  'ai_summary_confirmed',
  'system_derived',
]);

/**
 * §9.1 Rule: "Never silently convert AI inference into a clinical fact.
 * AI-generated summary must be user-confirmed before becoming a user record."
 */
export function createProvenancedValue<T>(input: {
  value: T;
  provenance: DataProvenance;
  recordedAt?: string;
  confirmedByUser?: boolean;
  sourceId?: string;
}): ValidationResult<ProvenancedValue<T>> {
  const errors: string[] = [];
  if (!VALID_PROVENANCE.has(input.provenance)) {
    errors.push(`Invalid provenance: ${String(input.provenance)}`);
  }
  if (input.provenance === 'ai_summary_confirmed' && input.confirmedByUser !== true) {
    errors.push(
      'AI-generated summary or inference cannot be stored as a clinical record without explicit user confirmation (confirmedByUser === true).',
    );
  }
  const recordedAt = input.recordedAt ?? new Date().toISOString();
  if (Number.isNaN(Date.parse(recordedAt))) {
    errors.push('recordedAt must be a valid ISO-8601 timestamp.');
  }
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return {
    valid: true,
    errors: [],
    data: {
      value: input.value,
      provenance: input.provenance,
      recordedAt,
      confirmedByUser: input.confirmedByUser,
      sourceId: input.sourceId,
    },
  };
}

/**
 * §2.3 Application workflow states (NOT validated clinical risk categories).
 */
export type PathwayWorkflowState =
  | 'routine_support'
  | 'distress_support'
  | 'professional_follow_up_recommended'
  | 'urgent_human_support'
  | 'emergency_guidance';

/**
 * §1.3 Separate concepts — never collapse into one `diagnosis` or `assigned_track` field.
 */
export interface SeparatedClinicalPathwayRecord {
  userId: string;
  screeningResults: Array<{
    instrumentCode: string;
    instrumentVersion: string;
    score: number;
    interpretationBand: string;
    isDiagnosis: false;
    provenance: 'questionnaire';
    recordedAt: string;
  }>;
  reportedHistory: {
    userReportedConditions: string[];
    userReportedTreatments: string[];
    isDiagnosis: false;
    provenance: 'user_self_report';
    recordedAt: string;
  };
  clinicalAssessments: Array<{
    clinicianRole: string;
    summaryNote: string;
    provenance: 'clinician_entry';
    recordedAt: string;
  }>;
  currentSelfReportedState: {
    moodDescription: string;
    moodPolarity?: number;
    energyLevel?: number;
    sleepHours?: number;
    feltNeedForSleep?: 'exhausted' | 'normal' | 'reduced_need' | 'no_need_at_all';
    distressIntensity: number;
    functioningNote?: string;
    provenance: 'user_self_report';
    recordedAt: string;
  };
  safetyStatus: {
    workflowState: PathwayWorkflowState;
    claimsUserIsLowRisk: false;
    activeTriggerReasons: string[];
    updatedAt: string;
  };
  supportPlan: {
    functionalNeeds: string[];
    eligibleProtocolIds: string[];
    temporarilyUnavailableProtocolIds: string[];
    userSelectedGoals: string[];
    provenance: 'system_derived' | 'user_self_report';
    updatedAt: string;
  };
  clinicianApprovedPlan?: {
    clinicianNameOrId: string;
    approvedProtocolIds: string[];
    approvedAt: string;
    provenance: 'clinician_entry';
  };
}

export function validateSeparatedClinicalPathwayRecord(
  record: Partial<SeparatedClinicalPathwayRecord> & {
    diagnosis?: unknown;
    assigned_track?: unknown;
    assignedTrack?: unknown;
  },
): ValidationResult<SeparatedClinicalPathwayRecord> {
  const errors: string[] = [];
  if ('diagnosis' in record || 'assigned_track' in record || 'assignedTrack' in record) {
    errors.push(
      '§1.3 Violation: Must not collapse pathway concepts into a single diagnosis or assigned_track field.',
    );
  }
  if (!record.userId || typeof record.userId !== 'string') {
    errors.push('userId is required.');
  }
  if (!record.reportedHistory || record.reportedHistory.isDiagnosis !== false) {
    errors.push('reportedHistory is required and must explicitly declare isDiagnosis: false.');
  }
  if (!record.safetyStatus || record.safetyStatus.claimsUserIsLowRisk !== false) {
    errors.push('safetyStatus is required and must never claim a user is "low risk" (claimsUserIsLowRisk: false).');
  }
  if (!record.currentSelfReportedState) {
    errors.push('currentSelfReportedState is required.');
  }
  if (!record.supportPlan) {
    errors.push('supportPlan is required.');
  }
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return {
    valid: true,
    errors: [],
    data: record as SeparatedClinicalPathwayRecord,
  };
}

// =============================================================================
// 2. PROTOCOL SPECIFICATION FORMAT & LIFECYCLE CONTRACT (§5.1–5.3, Appendix A & B)
// =============================================================================

export type ProtocolLifecycleStatus =
  | 'planned'
  | 'draft'
  | 'in_content_review'
  | 'in_clinical_review'
  | 'in_safety_review'
  | 'approved'
  | 'released'
  | 'deprecated'
  | 'blocked';

export type TherapyModel =
  | 'CBT'
  | 'TEAM-CBT'
  | 'DBT'
  | 'IPSRT'
  | 'MBCT'
  | 'Psychoeducation'
  | 'FFT';

export type ProtocolAudience = 'adult_user' | 'caregiver' | 'clinician_assisted';
export type ProtocolIntendedUse =
  | 'education'
  | 'self_monitoring'
  | 'guided_skills_practice'
  | 'clinician_assisted';

export type ProtocolDeliveryBoundary =
  | 'self_guided'
  | 'clinician_assisted_required'
  | 'temporarily_unavailable';

export interface ProtocolStepSpec {
  id: string;
  titleVi: string;
  titleEn: string;
  type: 'structured_input' | 'guided_reflection' | 'emotion_check_in' | 'non_writing_tap' | 'audio_grounding' | 'summary';
  required: boolean;
  allowSkip: boolean;
  nonWritingAlternativeVi?: string;
  nonWritingAlternativeEn?: string;
}

export interface EvidenceReferenceSpec {
  source_id: string;
  citation: string;
  doi_or_url: string;
  publication_date: string;
  relevant_section: string;
  license_status: 'public_domain' | 'adapted_with_attribution' | 'pending_license_verification';
}

export interface ClinicalApprovalSpec {
  reviewer_name: string;
  reviewer_role: string;
  approved_at: string; // ISO-8601
  scope: string;
}

export interface ProtocolManifest {
  protocol_id: string;
  title: string;
  title_vi: string;
  therapy_model: TherapyModel;
  dbt_domain?: 'Mindfulness' | 'Distress Tolerance' | 'Emotion Regulation' | 'Interpersonal Effectiveness';
  version: string;
  status: ProtocolLifecycleStatus;
  delivery_boundary: ProtocolDeliveryBoundary;
  intended_audience: ProtocolAudience[];
  intended_use: ProtocolIntendedUse[];
  goals: string[];
  eligibility: string[];
  precautions: string[];
  contraindications: string[];
  safety_requirements: {
    allowed_pathway_states: PathwayWorkflowState[];
    recheck_on_concerning_disclosure: boolean;
    escalate_to_safety_engine: boolean;
    requires_medical_exclusion_screen?: boolean;
  };
  estimated_duration: string;
  steps: ProtocolStepSpec[];
  completion_criteria: {
    allow_partial_completion: boolean;
    allow_user_pause: boolean;
    allow_user_abort: boolean;
    save_session: 'explicit_user_consent';
    equates_to_full_clinical_treatment: false;
  };
  outcome_fields: Array<{
    field_name: string;
    purpose: string;
  }>;
  evidence_references: EvidenceReferenceSpec[];
  clinical_approvals: ClinicalApprovalSpec[];
  localization: {
    language: 'vi-VN' | 'bilingual-vi-en';
    vietnamese_review_status: 'draft' | 'in_localization_review' | 'reviewed';
    regional_crisis_pathway_country: string;
  };
  limitations_statement_vi: string;
  limitations_statement_en: string;
}

const VALID_LIFECYCLE_STATUSES = new Set<ProtocolLifecycleStatus>([
  'planned',
  'draft',
  'in_content_review',
  'in_clinical_review',
  'in_safety_review',
  'approved',
  'released',
  'deprecated',
  'blocked',
]);

const VALID_THERAPY_MODELS = new Set<TherapyModel>([
  'CBT',
  'TEAM-CBT',
  'DBT',
  'IPSRT',
  'MBCT',
  'Psychoeducation',
  'FFT',
]);

/**
 * Validates all 19 mandatory fields from §5.1 and enforces Appendix A & B governance rules:
 * - Status `'completed'` is strictly prohibited.
 * - Status `'approved'` or `'released'` is blocked unless `clinical_approvals` has >= 1 named reviewer
 *   and `evidence_references` has >= 1 traceable source.
 */
export function validateProtocolManifest(
  manifest: Partial<ProtocolManifest>,
): ValidationResult<ProtocolManifest> {
  const errors: string[] = [];

  if ((manifest.status as string) === 'completed') {
    errors.push(
      'Appendix B Violation: Do not use "completed" as a protocol status to imply clinical effectiveness or validation.',
    );
  }
  if (!manifest.protocol_id || typeof manifest.protocol_id !== 'string') {
    errors.push('protocol_id is required.');
  }
  if (!manifest.title || typeof manifest.title !== 'string') {
    errors.push('title is required.');
  }
  if (!manifest.therapy_model || !VALID_THERAPY_MODELS.has(manifest.therapy_model)) {
    errors.push('therapy_model must be one of CBT, TEAM-CBT, DBT, IPSRT, MBCT, Psychoeducation, FFT.');
  }
  if (!manifest.version || !/^\d+\.\d+\.\d+(-[a-z0-9.]+)?$/i.test(manifest.version)) {
    errors.push('version must be a valid semantic version.');
  }
  if (!manifest.status || !VALID_LIFECYCLE_STATUSES.has(manifest.status)) {
    errors.push('status must be a valid Appendix B status value.');
  }
  if (!Array.isArray(manifest.intended_audience) || manifest.intended_audience.length === 0) {
    errors.push('intended_audience must be a non-empty array.');
  }
  if (!Array.isArray(manifest.intended_use) || manifest.intended_use.length === 0) {
    errors.push('intended_use must be a non-empty array.');
  }
  if (!Array.isArray(manifest.goals) || manifest.goals.length === 0) {
    errors.push('goals must be a non-empty array.');
  }
  if (!Array.isArray(manifest.eligibility) || manifest.eligibility.length === 0) {
    errors.push('eligibility must be a non-empty array.');
  }
  if (!Array.isArray(manifest.precautions) || manifest.precautions.length === 0) {
    errors.push('precautions must be a non-empty array.');
  }
  if (!Array.isArray(manifest.contraindications) || manifest.contraindications.length === 0) {
    errors.push('contraindications must be a non-empty array.');
  }
  if (!manifest.safety_requirements) {
    errors.push('safety_requirements is required.');
  }
  if (!manifest.estimated_duration || typeof manifest.estimated_duration !== 'string') {
    errors.push('estimated_duration is required.');
  }
  if (!Array.isArray(manifest.steps) || manifest.steps.length === 0) {
    errors.push('steps must contain at least 1 workflow step.');
  }
  if (
    !manifest.completion_criteria ||
    manifest.completion_criteria.allow_user_abort !== true ||
    manifest.completion_criteria.equates_to_full_clinical_treatment !== false
  ) {
    errors.push(
      'completion_criteria must allow_user_abort: true and declare equates_to_full_clinical_treatment: false.',
    );
  }
  if (!Array.isArray(manifest.outcome_fields) || manifest.outcome_fields.length === 0) {
    errors.push('outcome_fields must be a non-empty array.');
  }
  if (!Array.isArray(manifest.evidence_references) || manifest.evidence_references.length === 0) {
    errors.push('evidence_references must contain at least 1 traceable source reference.');
  }
  if (!Array.isArray(manifest.clinical_approvals)) {
    errors.push('clinical_approvals array is required.');
  }
  if (!manifest.localization) {
    errors.push('localization metadata is required.');
  }

  // §5.3 & §14 Gate: Cannot mark `approved` or `released` without named clinical reviewer sign-off!
  if (manifest.status === 'approved' || manifest.status === 'released') {
    const approvals = manifest.clinical_approvals ?? [];
    const hasValidApproval =
      approvals.length > 0 &&
      approvals.every(
        (a) =>
          Boolean(a.reviewer_name?.trim()) &&
          Boolean(a.reviewer_role?.trim()) &&
          !Number.isNaN(Date.parse(a.approved_at)) &&
          Boolean(a.scope?.trim()),
      );
    if (!hasValidApproval) {
      errors.push(
        '§5.3 & §14 Violation: No protocol may move to "approved" or "released" without named clinical_approvals (reviewer_name, reviewer_role, approved_at, scope).',
      );
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return {
    valid: true,
    errors: [],
    data: manifest as ProtocolManifest,
  };
}

/**
 * §11.2 Edge Case: Safely handle when a protocol is deprecated while a user has an in-progress session.
 */
export function resolveInProgressSessionOnProtocolUpdate(input: {
  protocolManifest: ProtocolManifest;
  sessionAlreadyInProgress: boolean;
  replacementProtocolId?: string;
}): {
  canContinueCurrentStep: boolean;
  canStartNewSession: boolean;
  action: 'allow_graceful_finish_or_save_draft' | 'block_new_and_migrate' | 'normal';
  noticeVi: string;
  noticeEn: string;
} {
  if (input.protocolManifest.status === 'deprecated') {
    if (input.sessionAlreadyInProgress) {
      return {
        canContinueCurrentStep: false,
        canStartNewSession: false,
        action: 'allow_graceful_finish_or_save_draft',
        noticeVi: `Bài tập "${input.protocolManifest.title_vi}" vừa được cập nhật/ngưng lưu hành để đảm bảo an toàn lâm sàng. Nội dung bạn đang viết đã được lưu nháp an toàn${input.replacementProtocolId ? ` — bạn có thể chuyển sang phiên bản mới (${input.replacementProtocolId})` : ''}.`,
        noticeEn: `Protocol "${input.protocolManifest.title}" has been deprecated during your session. Your current notes are safely saved as a draft${input.replacementProtocolId ? ` and you may switch to ${input.replacementProtocolId}` : ''}.`,
      };
    }
    return {
      canContinueCurrentStep: false,
      canStartNewSession: false,
      action: 'block_new_and_migrate',
      noticeVi: `Bài tập này đã ngưng lưu hành. Vui lòng chọn bài tập thay thế hiện hành.`,
      noticeEn: `This protocol is deprecated and cannot be started.`,
    };
  }
  return {
    canContinueCurrentStep: true,
    canStartNewSession: true,
    action: 'normal',
    noticeVi: 'Bài tập sẵn sàng.',
    noticeEn: 'Protocol ready.',
  };
}

// Helper to construct compliant draft protocol manifests across all 7 therapy models
function buildDraftProtocolManifest(params: {
  protocol_id: string;
  title: string;
  title_vi: string;
  therapy_model: TherapyModel;
  dbt_domain?: ProtocolManifest['dbt_domain'];
  delivery_boundary?: ProtocolDeliveryBoundary;
  intended_audience?: ProtocolAudience[];
  intended_use?: ProtocolIntendedUse[];
  goals: string[];
  precautions?: string[];
  contraindications?: string[];
  estimated_duration?: string;
  reference_id: string;
  reference_citation: string;
  reference_url: string;
  reference_section: string;
  requires_medical_exclusion_screen?: boolean;
}): ProtocolManifest {
  return {
    protocol_id: params.protocol_id,
    title: params.title,
    title_vi: params.title_vi,
    therapy_model: params.therapy_model,
    dbt_domain: params.dbt_domain,
    version: '0.1.0-draft',
    status: 'draft',
    delivery_boundary: params.delivery_boundary ?? 'self_guided',
    intended_audience: params.intended_audience ?? ['adult_user'],
    intended_use: params.intended_use ?? ['guided_skills_practice'],
    goals: params.goals,
    eligibility: [
      'safety_engine_allows_routine_or_distress_practice',
      'user_provides_informed_consent_18_plus',
    ],
    precautions: params.precautions ?? [
      'user_reports_increased_distress_during_exercise',
      'user_requests_human_clinical_support',
    ],
    contraindications: params.contraindications ?? [
      'active_emergency_guidance_workflow',
      'active_urgent_human_support_workflow',
      'acute_psychosis_or_command_hallucinations',
    ],
    safety_requirements: {
      allowed_pathway_states: ['routine_support', 'distress_support', 'professional_follow_up_recommended'],
      recheck_on_concerning_disclosure: true,
      escalate_to_safety_engine: true,
      requires_medical_exclusion_screen: params.requires_medical_exclusion_screen,
    },
    estimated_duration: params.estimated_duration ?? '5-15 minutes',
    steps: [
      {
        id: 'consent_and_suitability',
        titleVi: 'Bước 1: Kiểm tra mức độ phù hợp & mục tiêu',
        titleEn: 'Step 1: Suitability check & single specific goal',
        type: 'emotion_check_in',
        required: true,
        allowSkip: false,
        nonWritingAlternativeVi: 'Chạm chọn trạng thái cảm xúc hiện tại bằng thẻ trực quan.',
        nonWritingAlternativeEn: 'Tap a visual emotion card.',
      },
      {
        id: 'plain_language_skill_explanation',
        titleVi: 'Bước 2: Giải thích kỹ năng ngắn gọn & giới hạn áp dụng',
        titleEn: 'Step 2: Plain-language explanation & when not to use',
        type: 'guided_reflection',
        required: false,
        allowSkip: true,
        nonWritingAlternativeVi: 'Nghe hướng dẫn âm thanh ngắn.',
        nonWritingAlternativeEn: 'Listen to brief audio guide.',
      },
      {
        id: 'structured_practice_core',
        titleVi: 'Bước 3: Thực hành từng bước nhỏ (có thể tạm dừng/bỏ qua)',
        titleEn: 'Step 3: Guided practice steps (with pause/skip/stop)',
        type: 'structured_input',
        required: false,
        allowSkip: true,
        nonWritingAlternativeVi: 'Chọn gợi ý có sẵn hoặc ghi âm giọng nói ngắn.',
        nonWritingAlternativeEn: 'Select tap chips or use voice burst.',
      },
      {
        id: 'experience_and_safety_recheck',
        titleVi: 'Bước 4: Ghi nhận trải nghiệm & kiểm tra lại sự an toàn',
        titleEn: 'Step 4: Check distress/experience & safety re-check',
        type: 'summary',
        required: false,
        allowSkip: true,
      },
    ],
    completion_criteria: {
      allow_partial_completion: true,
      allow_user_pause: true,
      allow_user_abort: true,
      save_session: 'explicit_user_consent',
      equates_to_full_clinical_treatment: false,
    },
    outcome_fields: [
      { field_name: 'pre_post_distress_feedback', purpose: 'Subjective user feedback, not proof of clinical efficacy' },
      { field_name: 'session_usability_and_adverse_notes', purpose: 'Monitor acceptability and any unwanted distress increase' },
    ],
    evidence_references: [
      {
        source_id: params.reference_id,
        citation: params.reference_citation,
        doi_or_url: params.reference_url,
        publication_date: '2022-06-29',
        relevant_section: params.reference_section,
        license_status: 'pending_license_verification',
      },
    ],
    clinical_approvals: [],
    localization: {
      language: 'bilingual-vi-en',
      vietnamese_review_status: 'draft',
      regional_crisis_pathway_country: 'VN',
    },
    limitations_statement_vi:
      'Kỹ năng thực hành tự lực trong ứng dụng không tương đương với liệu pháp tâm lý toàn diện do nhà trị liệu có chuyên môn trực tiếp thực hiện.',
    limitations_statement_en:
      'Completing this in-app self-help skill is not equivalent to completing comprehensive psychotherapy delivered by a qualified clinician.',
  };
}

/**
 * Complete 68-Protocol Inventory defined in §4.1–§4.7 of CLINICAL_PROTOCOL_MASTER_PLAN.md:
 * - CBT: 11 protocols
 * - TEAM-CBT: 7 protocols
 * - DBT: 19 protocols across 4 domains
 * - IPSRT: 7 protocols
 * - MBCT: 8 protocols
 * - Psychoeducation: 10 modules
 * - FFT: 6 modules
 */
export const MASTER_PROTOCOL_CATALOG: ProtocolManifest[] = [
  // --- 4.1 CBT (11 Protocols) ---
  buildDraftProtocolManifest({
    protocol_id: 'CBT_THOUGHT_RECORD',
    title: 'Structured Thought Record with Accuracy Check',
    title_vi: 'Nhật ký Suy nghĩ Có Cấu trúc & Kiểm tra Tính Chính xác',
    therapy_model: 'CBT',
    goals: ['Examine an automatic thought and develop a more balanced perspective without invalidating objective reality'],
    reference_id: 'NICE-NG222-BECK-CBT',
    reference_citation: 'NICE Guideline NG222 (Depression in adults) & Beck Cognitive Therapy Manual',
    reference_url: 'https://www.nice.org.uk/guidance/ng222',
    reference_section: 'Cognitive restructuring & thought records',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'CBT_COGNITIVE_REAPPRAISAL',
    title: 'Evidence and Alternative Explanations',
    title_vi: 'Đánh giá Bằng chứng & Tìm Cách Lý giải Thay thế',
    therapy_model: 'CBT',
    goals: ['Reduce rigid or unhelpful interpretations without arguing with or invalidating the user'],
    reference_id: 'NICE-NG222-REAPPRAISAL',
    reference_citation: 'Greenberger & Padesky, Mind Over Mood (2nd Ed.)',
    reference_url: 'https://www.nice.org.uk/guidance/ng222',
    reference_section: 'Cognitive reappraisal',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'CBT_BEHAVIORAL_ACTIVATION',
    title: 'Values, Activity Monitoring & Paced Behavioral Activation',
    title_vi: 'Kích hoạt Hành vi Theo Giá trị (Kèm Cổng Nghỉ ngơi & Giới hạn Lưỡng cực)',
    therapy_model: 'CBT',
    goals: ['Reintroduce meaningful, manageable activity while respecting biological rest needs and bipolar mood elevation guardrails'],
    contraindications: [
      'active_emergency_guidance_workflow',
      'possible_mania_or_hypomania_elevation',
      'biological_exhaustion_requiring_guilt_free_rest',
    ],
    reference_id: 'NICE-NG222-MARTELL-BA',
    reference_citation: 'NICE NG222 & Martell et al., Behavioral Activation for Depression',
    reference_url: 'https://www.nice.org.uk/guidance/ng222',
    reference_section: 'Behavioral Activation & Bipolar Activity Pacing',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'CBT_PROBLEM_SOLVING',
    title: 'Structured Problem Solving (Define, Options, Plan, Review)',
    title_vi: 'Giải quyết Vấn đề Thực tế Theo 4 Bước',
    therapy_model: 'CBT',
    goals: ['Address practical everyday problems step by step when cognitive fog is present'],
    reference_id: 'NICE-NG222-PST',
    reference_citation: 'Problem-Solving Therapy Clinical Manual & NICE NG222',
    reference_url: 'https://www.nice.org.uk/guidance/ng222',
    reference_section: 'Problem-solving therapy',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'CBT_WORRY_MONITORING',
    title: 'Worry Monitoring & Scheduled Worry Postponement',
    title_vi: 'Theo dõi Mô thức Lo lắng & Hộp Trì hoãn Lo âu',
    therapy_model: 'CBT',
    goals: ['Distinguish solvable practical problems from hypothetical "what-if" worry'],
    reference_id: 'NICE-CG113-GAD',
    reference_citation: 'NICE Guideline CG113 (Generalized anxiety disorder and panic disorder in adults)',
    reference_url: 'https://www.nice.org.uk/guidance/cg113',
    reference_section: 'GAD worry monitoring',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'CBT_INTOLERANCE_UNCERTAINTY',
    title: 'Working with Intolerance of Uncertainty',
    title_vi: 'Thực hành Dung nạp Sự Bất định',
    therapy_model: 'CBT',
    goals: ['Recognize certainty-seeking behaviors and practice tolerating everyday uncertainty safely'],
    reference_id: 'NICE-CG113-IU',
    reference_citation: 'Dugas & Robichaud, Cognitive-Behavioral Treatment for GAD; NICE CG113',
    reference_url: 'https://www.nice.org.uk/guidance/cg113',
    reference_section: 'Intolerance of uncertainty',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'CBT_EXPOSURE_PLANNING',
    title: 'Graded Exposure Hierarchy Planning',
    title_vi: 'Lập Kế hoạch Tiếp xúc Theo Bậc Thang (Có Ranh giới Chuyên gia)',
    therapy_model: 'CBT',
    goals: ['Reduce avoidance and safety behaviors through gradual, safe approach steps'],
    precautions: [
      'complex_trauma_or_severe_ocd_requires_clinician_guidance',
      'user_reports_increased_distress_during_exercise',
    ],
    reference_id: 'NICE-CG113-EXPOSURE',
    reference_citation: 'Craske et al. Inhibitory Learning Exposure Model & NICE CG113',
    reference_url: 'https://www.nice.org.uk/guidance/cg113',
    reference_section: 'Graded exposure planning',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'CBT_PANIC_PSYCHOEDUCATION',
    title: 'Understanding the Panic Cycle & Medical Assessment Boundary',
    title_vi: 'Hiểu Chu trình Hoảng loạn & Ranh giới Thăm khám Y khoa Thực thể',
    therapy_model: 'CBT',
    intended_use: ['education', 'guided_skills_practice'],
    goals: ['Understand bodily fight-or-flight sensations without assuming physical symptoms are always anxiety'],
    precautions: ['Never imply chest pain, shortness of breath, or syncope are definitely psychological; advise medical rule-out'],
    reference_id: 'NICE-CG113-PANIC',
    reference_citation: 'NICE Guideline CG113 — Panic Disorder Psychoeducation',
    reference_url: 'https://www.nice.org.uk/guidance/cg113',
    reference_section: 'Panic disorder cycle & differential medical rule-out',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'CBT_INTEROCEPTIVE_EXPOSURE',
    title: 'Clinician-Supervised Interoceptive Exposure',
    title_vi: 'Tiếp xúc Cảm giác Cơ thể Nội sinh (Yêu cầu Sàng lọc Y khoa & Hướng dẫn Chuyên gia)',
    therapy_model: 'CBT',
    delivery_boundary: 'clinician_assisted_required',
    intended_audience: ['adult_user', 'clinician_assisted'],
    intended_use: ['clinician_assisted'],
    requires_medical_exclusion_screen: true,
    goals: ['Address fear of benign bodily sensations under clinician supervision and medical clearance'],
    contraindications: [
      'active_emergency_guidance_workflow',
      'unscreened_cardiovascular_respiratory_or_vestibular_condition',
      'no_clinician_supervision_confirmed',
    ],
    reference_id: 'NICE-CG113-INTEROCEPTIVE',
    reference_citation: 'Barlow & Craske Mastery of Your Anxiety and Panic; NICE CG113',
    reference_url: 'https://www.nice.org.uk/guidance/cg113',
    reference_section: 'Interoceptive exposure medical & supervision boundary',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'CBT_SOCIAL_ANXIETY',
    title: 'Social Situation Formulation & Dropping Safety Behaviors',
    title_vi: 'Công thức hóa Tình huống Xã hội & Giảm Hành vi An toàn Ngầm',
    therapy_model: 'CBT',
    goals: ['Identify self-focused attention, feared social predictions, and subtle safety behaviors'],
    reference_id: 'NICE-CG159-SOCIAL',
    reference_citation: 'Clark & Wells Social Anxiety Model; NICE Guideline CG159',
    reference_url: 'https://www.nice.org.uk/guidance/cg159',
    reference_section: 'Social anxiety cognitive formulation',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'CBT_RELAPSE_PREVENTION',
    title: 'Identify Learning, Personal Warning Signs & Next Steps',
    title_vi: 'Tổng kết Bài học, Nhận diện Dấu hiệu Sớm & Phòng ngừa Tái phát',
    therapy_model: 'CBT',
    goals: ['Consolidate helpful skills and document early warning signs without replacing clinical follow-up'],
    reference_id: 'NICE-NG222-RELAPSE',
    reference_citation: 'NICE NG222 & CG185 Relapse Prevention Recommendations',
    reference_url: 'https://www.nice.org.uk/guidance/ng222',
    reference_section: 'Staying well & relapse prevention',
  }),

  // --- 4.2 TEAM-CBT (7 Protocols — Explicitly labeled as self-reflection aids) ---
  buildDraftProtocolManifest({
    protocol_id: 'TEAM_SESSION_AGENDA',
    title: 'Collaborative Session Focus & Agenda Selection',
    title_vi: 'Thiết lập Trọng tâm Phiên Tự Phản tư (TEAM-CBT)',
    therapy_model: 'TEAM-CBT',
    goals: ['Collaboratively choose one specific focus (listening vs. specific skill practice) with full user agency'],
    reference_id: 'BURNS-TEAM-AGENDA',
    reference_citation: 'Burns, D. D. Feeling Great / TEAM-CBT Manual Overview',
    reference_url: 'https://feelinggood.com/',
    reference_section: 'Agenda setting & collaborative choice',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'TEAM_EMPATHY_EXPLORATION',
    title: 'Empathy & Disarming Reflection (EAR)',
    title_vi: 'Lắng nghe Thấu cảm & Xác nhận Cảm xúc Không Vội Sửa đổi',
    therapy_model: 'TEAM-CBT',
    goals: ['Reflect and clarify the user experience warmly before attempting any cognitive or behavioral change'],
    reference_id: 'BURNS-TEAM-EMPATHY',
    reference_citation: 'Burns, D. D. 5 Secrets of Effective Communication (EAR)',
    reference_url: 'https://feelinggood.com/',
    reference_section: 'Empathy & validation before change',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'TEAM_PARADOXICAL_AGENDA',
    title: 'Exploring Ambivalence & Pros/Cons of Change',
    title_vi: 'Khám phá Lưỡng lự Trước Thay đổi (Không Đổ lỗi Cho Người dùng)',
    therapy_model: 'TEAM-CBT',
    goals: ['Explore perceived advantages and disadvantages of a pattern without implying symptoms are chosen'],
    precautions: ['Never use "resistance" language to blame users or infer hidden motives'],
    reference_id: 'BURNS-TEAM-PARADOXICAL',
    reference_citation: 'Burns, D. D. Assessment of Ambivalence / Paradoxical Agenda Setting',
    reference_url: 'https://feelinggood.com/',
    reference_section: 'Ambivalence exploration',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'TEAM_POSITIVE_REFRAMING',
    title: 'Positive Reframing of Protective Intentions',
    title_vi: 'Nhận diện Ý nghĩa Bảo vệ & Giá trị Đằng sau Cảm xúc',
    therapy_model: 'TEAM-CBT',
    goals: ['Identify understandable protective intentions or core values behind a pattern without romanticizing suffering'],
    reference_id: 'BURNS-TEAM-REFRAME',
    reference_citation: 'Burns, D. D. Positive Reframing in TEAM-CBT',
    reference_url: 'https://feelinggood.com/',
    reference_section: 'Positive reframing',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'TEAM_COST_BENEFIT_ANALYSIS',
    title: 'Short-Term vs. Long-Term Cost-Benefit Analysis',
    title_vi: 'Phân tích Lợi ích & Cái giá Ngắn hạn – Dài hạn',
    therapy_model: 'TEAM-CBT',
    goals: ['Weigh short-term and long-term costs and benefits of a belief, habit, or avoidance pattern'],
    reference_id: 'BURNS-TEAM-CBA',
    reference_citation: 'Burns, D. D. Cost-Benefit Analysis Worksheet',
    reference_url: 'https://feelinggood.com/',
    reference_section: 'Cost-benefit analysis',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'TEAM_MOTIVATION_CHECK',
    title: 'Readiness & Practical Barriers Check',
    title_vi: 'Kiểm tra Mức độ Sẵn sàng & Rào cản Thực tế',
    therapy_model: 'TEAM-CBT',
    goals: ['Check user readiness gently and respect a user decision to decline or pause any exercise'],
    reference_id: 'BURNS-TEAM-MOTIVATION',
    reference_citation: 'TEAM-CBT Readiness & Barrier Exploration',
    reference_url: 'https://feelinggood.com/',
    reference_section: 'Motivation & agency check',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'TEAM_SKILL_REVIEW',
    title: 'Collaborative Skill Review & Next Small Step',
    title_vi: 'Nhìn lại Trải nghiệm Thực hành & Chọn Bước Nhỏ Tiếp theo',
    therapy_model: 'TEAM-CBT',
    goals: ['Review what felt helpful or unhelpful in a skill and choose a next step collaboratively'],
    reference_id: 'BURNS-TEAM-REVIEW',
    reference_citation: 'TEAM-CBT Session Review Principles',
    reference_url: 'https://feelinggood.com/',
    reference_section: 'Collaborative review',
  }),

  // --- 4.3 DBT Skills (19 Protocols across 4 Domains) ---
  // Domain 1: Mindfulness (4)
  buildDraftProtocolManifest({
    protocol_id: 'DBT_WISE_MIND',
    title: 'Wise Mind (Balancing Emotion Mind & Reasonable Mind)',
    title_vi: 'Tâm Trí Tuệ (Wise Mind — Giao điểm Cảm xúc & Lý trí)',
    therapy_model: 'DBT',
    dbt_domain: 'Mindfulness',
    goals: ['Listen to both emotion and objective facts without self-criticism, accepting "not knowing yet" as valid'],
    reference_id: 'LINEHAN-DBT-MINDFULNESS',
    reference_citation: 'Linehan, M. M. (2015). DBT Skills Training Manual (2nd Ed.)',
    reference_url: 'https://www.guilford.com/books/DBT-Skills-Training-Manual/Marsha-Linehan/9781462516995',
    reference_section: 'Core Mindfulness — Wise Mind',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'DBT_OBSERVE_DESCRIBE',
    title: 'Mindfulness What Skills: Observe & Describe',
    title_vi: 'Kỹ năng Quan sát & Mô tả Không Gán Nhãn (Observe & Describe)',
    therapy_model: 'DBT',
    dbt_domain: 'Mindfulness',
    goals: ['Notice internal experiences and external facts and describe them in words without adding judgment'],
    reference_id: 'LINEHAN-DBT-OBSERVE',
    reference_citation: 'Linehan, M. M. (2015). DBT Skills Training Manual (2nd Ed.)',
    reference_url: 'https://www.guilford.com/books/DBT-Skills-Training-Manual/Marsha-Linehan/9781462516995',
    reference_section: 'Core Mindfulness — What Skills',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'DBT_NONJUDGMENTAL_STANCE',
    title: 'Mindfulness How Skill: Nonjudgmental Stance',
    title_vi: 'Thái độ Không Phán xét (Nonjudgmental Stance)',
    therapy_model: 'DBT',
    dbt_domain: 'Mindfulness',
    goals: ['Replace global "good/bad/worthless" judgments with factual descriptions of consequences and feelings'],
    reference_id: 'LINEHAN-DBT-NONJUDGMENTAL',
    reference_citation: 'Linehan, M. M. (2015). DBT Skills Training Manual (2nd Ed.)',
    reference_url: 'https://www.guilford.com/books/DBT-Skills-Training-Manual/Marsha-Linehan/9781462516995',
    reference_section: 'Core Mindfulness — How Skills',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'DBT_ONE_MINDFULLY',
    title: 'Mindfulness How Skill: One-Mindfully in the Present',
    title_vi: 'Chuyên tâm Một Việc Trong Hiện tại (One-Mindfully)',
    therapy_model: 'DBT',
    dbt_domain: 'Mindfulness',
    goals: ['Anchor attention gently to one single task or sensory experience when the mind is scattered'],
    reference_id: 'LINEHAN-DBT-ONEMINDFULLY',
    reference_citation: 'Linehan, M. M. (2015). DBT Skills Training Manual (2nd Ed.)',
    reference_url: 'https://www.guilford.com/books/DBT-Skills-Training-Manual/Marsha-Linehan/9781462516995',
    reference_section: 'Core Mindfulness — One-Mindfully',
  }),

  // Domain 2: Distress Tolerance (6)
  buildDraftProtocolManifest({
    protocol_id: 'DBT_STOP',
    title: 'Crisis Survival Skill: STOP',
    title_vi: 'Kỹ năng Dừng Lại Trước Xung động (STOP)',
    therapy_model: 'DBT',
    dbt_domain: 'Distress Tolerance',
    estimated_duration: '1-3 minutes',
    goals: ['Pause an intense impulse (Stop, Take a step back, Observe, Proceed mindfully)'],
    reference_id: 'LINEHAN-DBT-STOP',
    reference_citation: 'Linehan, M. M. (2015). DBT Skills Training Manual (2nd Ed.)',
    reference_url: 'https://www.guilford.com/books/DBT-Skills-Training-Manual/Marsha-Linehan/9781462516995',
    reference_section: 'Distress Tolerance — STOP Skill',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'DBT_TIPP_SAFE_OPTIONS',
    title: 'Physiological Down-Regulation: TIPP with Safe Alternatives',
    title_vi: 'Hạ nhiệt Sinh lý An toàn (TIPP — Có Sàng lọc Y khoa & Phương án Dịu nhẹ)',
    therapy_model: 'DBT',
    dbt_domain: 'Distress Tolerance',
    estimated_duration: '2-5 minutes',
    requires_medical_exclusion_screen: true,
    goals: ['Reduce acute physiological arousal safely using gentle paced breathing, paired muscle relaxation, or medically screened cool compress'],
    precautions: [
      'Never prescribe ice immersion, intense exercise, or forceful breath-holding as universally safe',
      'Provide immediate stop instructions if dizziness or discomfort occurs',
    ],
    reference_id: 'LINEHAN-DBT-TIPP',
    reference_citation: 'Linehan, M. M. (2015). DBT Skills Training Manual (2nd Ed.)',
    reference_url: 'https://www.guilford.com/books/DBT-Skills-Training-Manual/Marsha-Linehan/9781462516995',
    reference_section: 'Distress Tolerance — TIP Skills & Medical Precautions',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'DBT_ACCEPTS',
    title: 'Crisis Distraction: Wise Mind ACCEPTS',
    title_vi: 'Chuyển hướng Chú ý Tạm thời Qua Cơn Bão (ACCEPTS)',
    therapy_model: 'DBT',
    dbt_domain: 'Distress Tolerance',
    goals: ['Use healthy short-term distraction to get through an acute wave of distress without worsening the situation'],
    reference_id: 'LINEHAN-DBT-ACCEPTS',
    reference_citation: 'Linehan, M. M. (2015). DBT Skills Training Manual (2nd Ed.)',
    reference_url: 'https://www.guilford.com/books/DBT-Skills-Training-Manual/Marsha-Linehan/9781462516995',
    reference_section: 'Distress Tolerance — ACCEPTS',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'DBT_SELF_SOOTHE',
    title: 'Self-Soothing with the Five Senses',
    title_vi: 'Tự Xoa dịu Qua 5 Giác quan (Self-Soothe)',
    therapy_model: 'DBT',
    dbt_domain: 'Distress Tolerance',
    goals: ['Comfort the nervous system gently through sight, sound, smell, taste, and touch'],
    reference_id: 'LINEHAN-DBT-SELFSOOTHE',
    reference_citation: 'Linehan, M. M. (2015). DBT Skills Training Manual (2nd Ed.)',
    reference_url: 'https://www.guilford.com/books/DBT-Skills-Training-Manual/Marsha-Linehan/9781462516995',
    reference_section: 'Distress Tolerance — Self-Soothe',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'DBT_PROS_CONS',
    title: 'Crisis Pros and Cons of Acting on an Urge',
    title_vi: 'Bảng Cân nhắc Lợi/Hại Trước Xung động Khủng hoảng',
    therapy_model: 'DBT',
    dbt_domain: 'Distress Tolerance',
    goals: ['Compare pros and cons of acting on a destructive impulse vs. tolerating the distress'],
    reference_id: 'LINEHAN-DBT-PROSCONS',
    reference_citation: 'Linehan, M. M. (2015). DBT Skills Training Manual (2nd Ed.)',
    reference_url: 'https://www.guilford.com/books/DBT-Skills-Training-Manual/Marsha-Linehan/9781462516995',
    reference_section: 'Distress Tolerance — Pros and Cons',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'DBT_RADICAL_ACCEPTANCE',
    title: 'Radical Acceptance of Unchangeable Reality',
    title_vi: 'Chấp nhận Thực tại Khách quan (Radical Acceptance)',
    therapy_model: 'DBT',
    dbt_domain: 'Distress Tolerance',
    goals: ['Acknowledge painful reality as it is without approving of it or giving up on safe future steps'],
    reference_id: 'LINEHAN-DBT-RADICAL',
    reference_citation: 'Linehan, M. M. (2015). DBT Skills Training Manual (2nd Ed.)',
    reference_url: 'https://www.guilford.com/books/DBT-Skills-Training-Manual/Marsha-Linehan/9781462516995',
    reference_section: 'Distress Tolerance — Radical Acceptance',
  }),

  // Domain 3: Emotion Regulation (5)
  buildDraftProtocolManifest({
    protocol_id: 'DBT_EMOTION_NAMING',
    title: 'Understanding and Naming Emotions (5 Affect Families)',
    title_vi: 'Nhận diện & Gọi tên Cảm xúc (Phân biệt Xấu hổ và Áy náy)',
    therapy_model: 'DBT',
    dbt_domain: 'Emotion Regulation',
    goals: ['Observe and accurately name primary emotions and their action urges'],
    reference_id: 'LINEHAN-DBT-EMOTIONNAMING',
    reference_citation: 'Linehan, M. M. (2015). DBT Skills Training Manual (2nd Ed.)',
    reference_url: 'https://www.guilford.com/books/DBT-Skills-Training-Manual/Marsha-Linehan/9781462516995',
    reference_section: 'Emotion Regulation — Model of Emotions',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'DBT_CHECK_THE_FACTS',
    title: 'Check the Facts',
    title_vi: 'Kiểm tra Sự thật Khách quan (Check the Facts)',
    therapy_model: 'DBT',
    dbt_domain: 'Emotion Regulation',
    goals: ['Examine whether emotional intensity and assumptions match the observable facts of a situation'],
    reference_id: 'LINEHAN-DBT-CHECKFACTS',
    reference_citation: 'Linehan, M. M. (2015). DBT Skills Training Manual (2nd Ed.)',
    reference_url: 'https://www.guilford.com/books/DBT-Skills-Training-Manual/Marsha-Linehan/9781462516995',
    reference_section: 'Emotion Regulation — Check the Facts',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'DBT_OPPOSITE_ACTION',
    title: 'Opposite Action with Justified Safety Pivot',
    title_vi: 'Hành động Đối lập (Kèm Cổng Bảo vệ Khi Nguy hiểm Có thật)',
    therapy_model: 'DBT',
    dbt_domain: 'Emotion Regulation',
    goals: ['Act opposite to an unhelpful action urge only when the emotion or urge does not fit objective safety facts'],
    reference_id: 'LINEHAN-DBT-OPPOSITE',
    reference_citation: 'Linehan, M. M. (2015). DBT Skills Training Manual (2nd Ed.)',
    reference_url: 'https://www.guilford.com/books/DBT-Skills-Training-Manual/Marsha-Linehan/9781462516995',
    reference_section: 'Emotion Regulation — Opposite Action',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'DBT_PLEASE',
    title: 'Reducing Biological Vulnerability: PLEASE Skills',
    title_vi: 'Chăm sóc Nền tảng Sinh học Giảm Tổn thương Cảm xúc (PLEASE)',
    therapy_model: 'DBT',
    dbt_domain: 'Emotion Regulation',
    goals: ['Support physical illness care, balanced eating, avoiding mood-altering substances, sleep, and gentle movement'],
    reference_id: 'LINEHAN-DBT-PLEASE',
    reference_citation: 'Linehan, M. M. (2015). DBT Skills Training Manual (2nd Ed.)',
    reference_url: 'https://www.guilford.com/books/DBT-Skills-Training-Manual/Marsha-Linehan/9781462516995',
    reference_section: 'Emotion Regulation — ABC PLEASE',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'DBT_BUILD_POSITIVE_EXPERIENCES',
    title: 'Accumulating Positive Experiences & Building Mastery',
    title_vi: 'Tích lũy Trải nghiệm Tích cực & Xây dựng Cảm giác Tự chủ',
    therapy_model: 'DBT',
    dbt_domain: 'Emotion Regulation',
    goals: ['Plan small daily pleasant events and values-aligned steps without over-activating bipolar mood'],
    reference_id: 'LINEHAN-DBT-POSITIVES',
    reference_citation: 'Linehan, M. M. (2015). DBT Skills Training Manual (2nd Ed.)',
    reference_url: 'https://www.guilford.com/books/DBT-Skills-Training-Manual/Marsha-Linehan/9781462516995',
    reference_section: 'Emotion Regulation — Accumulating Positive Emotions',
  }),

  // Domain 4: Interpersonal Effectiveness (4)
  buildDraftProtocolManifest({
    protocol_id: 'DBT_DEAR_MAN',
    title: 'Objectives Effectiveness: DEAR MAN Script Builder',
    title_vi: 'Giao tiếp Đạt Mục tiêu & Từ chối Lành mạnh (DEAR MAN)',
    therapy_model: 'DBT',
    dbt_domain: 'Interpersonal Effectiveness',
    goals: ['Ask for a need or say no clearly while checking relationship safety first'],
    contraindications: [
      'active_emergency_guidance_workflow',
      'abusive_violent_or_coercive_relationship_where_confrontation_is_unsafe',
    ],
    reference_id: 'LINEHAN-DBT-DEARMAN',
    reference_citation: 'Linehan, M. M. (2015). DBT Skills Training Manual (2nd Ed.)',
    reference_url: 'https://www.guilford.com/books/DBT-Skills-Training-Manual/Marsha-Linehan/9781462516995',
    reference_section: 'Interpersonal Effectiveness — DEAR MAN',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'DBT_GIVE',
    title: 'Relationship Effectiveness: GIVE',
    title_vi: 'Giao tiếp Giữ gìn Mối quan hệ Ấm áp (GIVE)',
    therapy_model: 'DBT',
    dbt_domain: 'Interpersonal Effectiveness',
    goals: ['Be Gentle, act Interested, Validate, and use an Easy manner in safe relationships'],
    reference_id: 'LINEHAN-DBT-GIVE',
    reference_citation: 'Linehan, M. M. (2015). DBT Skills Training Manual (2nd Ed.)',
    reference_url: 'https://www.guilford.com/books/DBT-Skills-Training-Manual/Marsha-Linehan/9781462516995',
    reference_section: 'Interpersonal Effectiveness — GIVE',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'DBT_FAST',
    title: 'Self-Respect Effectiveness: FAST',
    title_vi: 'Giao tiếp Giữ Vững Lòng Tự trọng (FAST)',
    therapy_model: 'DBT',
    dbt_domain: 'Interpersonal Effectiveness',
    goals: ['Be Fair, avoid over-Apologizing, Stick to values, and be Truthful'],
    reference_id: 'LINEHAN-DBT-FAST',
    reference_citation: 'Linehan, M. M. (2015). DBT Skills Training Manual (2nd Ed.)',
    reference_url: 'https://www.guilford.com/books/DBT-Skills-Training-Manual/Marsha-Linehan/9781462516995',
    reference_section: 'Interpersonal Effectiveness — FAST',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'DBT_BOUNDARY_SETTING',
    title: 'Safe Personal Boundary Setting',
    title_vi: 'Thiết lập Ranh giới Cá nhân An toàn',
    therapy_model: 'DBT',
    dbt_domain: 'Interpersonal Effectiveness',
    goals: ['Identify personal limits and communicate boundaries safely without coaching dangerous confrontation'],
    contraindications: [
      'active_emergency_guidance_workflow',
      'abusive_violent_or_coercive_relationship_where_confrontation_is_unsafe',
    ],
    reference_id: 'LINEHAN-DBT-BOUNDARIES',
    reference_citation: 'Linehan, M. M. (2015). DBT Skills Training Manual (2nd Ed.)',
    reference_url: 'https://www.guilford.com/books/DBT-Skills-Training-Manual/Marsha-Linehan/9781462516995',
    reference_section: 'Interpersonal Effectiveness — Boundaries & Safety',
  }),

  // --- 4.4 IPSRT (7 Components) ---
  buildDraftProtocolManifest({
    protocol_id: 'IPSRT_RHYTHM_BASELINE',
    title: 'Establish Individualized Social Rhythm Baseline',
    title_vi: 'Thiết lập Mốc Nhịp Sinh học Cá nhân (Baseline)',
    therapy_model: 'IPSRT',
    intended_use: ['self_monitoring'],
    goals: ['Define personal baseline routine anchors with timezone context rather than a universal schedule'],
    reference_id: 'FRANK-IPSRT-MANUAL',
    reference_citation: 'Frank, E. (2005). Treating Bipolar Disorder: A Clinician’s Guide to IPSRT; NICE CG185',
    reference_url: 'https://www.nice.org.uk/guidance/cg185',
    reference_section: 'IPSRT individualized rhythm baseline',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'IPSRT_DAILY_RHYTHM_LOG',
    title: 'Daily Rhythm & Perceived Sleep Need Log',
    title_vi: 'Nhật ký 5 Mốc Nhịp Sinh học & Cảm giác Cần Ngủ',
    therapy_model: 'IPSRT',
    intended_use: ['self_monitoring'],
    goals: ['Log daily anchor timestamps and distinguish perceived need for sleep from hours slept'],
    reference_id: 'FRANK-IPSRT-LOG',
    reference_citation: 'Frank, E. (2005). IPSRT Manual & NICE CG185',
    reference_url: 'https://www.nice.org.uk/guidance/cg185',
    reference_section: 'Daily rhythm & sleep need tracking',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'IPSRT_SOCIAL_EVENT_LOG',
    title: 'Interpersonal & Routine-Disrupting Event Log',
    title_vi: 'Nhật ký Sự kiện Xã hội & Thay đổi Làm Xáo trộn Nhịp Sinh hoạt',
    therapy_model: 'IPSRT',
    intended_use: ['self_monitoring'],
    goals: ['Note travel, shift work, bereavement, or interpersonal stress that may disrupt circadian routine'],
    reference_id: 'FRANK-IPSRT-EVENTS',
    reference_citation: 'Frank, E. (2005). IPSRT Interpersonal & Social Zeitgebers',
    reference_url: 'https://www.nice.org.uk/guidance/cg185',
    reference_section: 'Zeitgeber disruption & interpersonal events',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'IPSRT_RHYTHM_REVIEW',
    title: 'Personal Baseline Rhythm Comparison Review',
    title_vi: 'Đối chiếu Nhịp Sinh hoạt Với Mốc Cá nhân (Không Phạt Ngày Trống)',
    therapy_model: 'IPSRT',
    intended_use: ['self_monitoring'],
    goals: ['Compare recent rhythm patterns against the user’s own baseline without labeling heuristic summary as a validated SRM'],
    reference_id: 'FRANK-IPSRT-REVIEW',
    reference_citation: 'Frank, E. (2005). IPSRT Rhythm Review',
    reference_url: 'https://www.nice.org.uk/guidance/cg185',
    reference_section: 'Baseline comparison & non-diagnostic interpretation',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'IPSRT_ROUTINE_PLANNING',
    title: 'Collaborative Routine Stabilization Planning',
    title_vi: 'Lập Kế hoạch Điều chỉnh Nhịp Sinh hoạt Khả thi',
    therapy_model: 'IPSRT',
    goals: ['Plan gentle, feasible adjustments to sleep and wake anchors'],
    reference_id: 'FRANK-IPSRT-PLANNING',
    reference_citation: 'Frank, E. (2005). IPSRT Routine Stabilization',
    reference_url: 'https://www.nice.org.uk/guidance/cg185',
    reference_section: 'Routine planning',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'IPSRT_EARLY_WARNING_PLAN',
    title: 'Individualized Bipolar Early Warning Plan (Ulysses Agreement)',
    title_vi: 'Kế hoạch Nhận diện Dấu hiệu Sớm & Ứng phó (Ulysses Plan)',
    therapy_model: 'IPSRT',
    goals: ['Document individually identified early warning signs and agreed clinical contact steps while stable'],
    reference_id: 'NICE-CG185-EARLYWARNING',
    reference_citation: 'NICE Guideline CG185 (Bipolar disorder: assessment and management)',
    reference_url: 'https://www.nice.org.uk/guidance/cg185',
    reference_section: 'Early warning signs & relapse prevention',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'IPSRT_CLINICIAN_REPORT',
    title: 'User-Controlled IPSRT & Mood Summary for Clinical Discussion',
    title_vi: 'Báo cáo Nhịp Sinh học & Khí sắc Do Người dùng Kiểm soát Để Trao đổi Với Bác sĩ',
    therapy_model: 'IPSRT',
    intended_use: ['self_monitoring', 'clinician_assisted'],
    goals: ['Export a transparent, redacted summary of self-reported mood and rhythm logs for clinical review'],
    reference_id: 'NICE-CG185-REPORT',
    reference_citation: 'NICE CG185 Collaborative Care & Monitoring',
    reference_url: 'https://www.nice.org.uk/guidance/cg185',
    reference_section: 'Collaborative monitoring',
  }),

  // --- 4.5 MBCT (8-Step Mindfulness Learning Sequence) ---
  buildDraftProtocolManifest({
    protocol_id: 'MBCT_AUTOMATIC_PILOT',
    title: 'MBCT-Informed Step 1: Stepping Out of Automatic Pilot',
    title_vi: 'MBCT Bài 1: Nhận diện Chế độ Tự động (Automatic Pilot)',
    therapy_model: 'MBCT',
    goals: ['Notice automatic habits of attention in everyday life with eyes-open grounding option'],
    reference_id: 'SEGAL-MBCT-STEP1',
    reference_citation: 'Segal, Williams, & Teasdale (2013). Mindfulness-Based Cognitive Therapy for Depression (2nd Ed.)',
    reference_url: 'https://www.nice.org.uk/guidance/ng222',
    reference_section: 'Session 1 — Awareness and Automatic Pilot',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'MBCT_BODY_SCAN',
    title: 'MBCT-Informed Step 2: Gentle Body Awareness & Grounding',
    title_vi: 'MBCT Bài 2: Quét Cơ thể Dịu nhẹ (Có Lựa chọn Mở mắt / Tiếp đất)',
    therapy_model: 'MBCT',
    goals: ['Practice gentle attention to physical sensations with immediate stop or grounding option if discomfort arises'],
    reference_id: 'SEGAL-MBCT-STEP2',
    reference_citation: 'Segal, Williams, & Teasdale (2013). MBCT Manual (2nd Ed.)',
    reference_url: 'https://www.nice.org.uk/guidance/ng222',
    reference_section: 'Session 2 — Living in Our Heads / Body Scan',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'MBCT_MINDFUL_BREATHING',
    title: 'MBCT-Informed Step 3: Gathering the Scattered Mind',
    title_vi: 'MBCT Bài 3: Gom Tâm trí Phân tán Về Nhịp thở Tự nhiên',
    therapy_model: 'MBCT',
    goals: ['Use natural breathing or external anchor (sounds/feet on floor) to gather scattered attention'],
    reference_id: 'SEGAL-MBCT-STEP3',
    reference_citation: 'Segal, Williams, & Teasdale (2013). MBCT Manual (2nd Ed.)',
    reference_url: 'https://www.nice.org.uk/guidance/ng222',
    reference_section: 'Session 3 — Gathering the Scattered Mind',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'MBCT_PRESENT_MOMENT',
    title: 'MBCT-Informed Step 4: Recognizing Aversion & Returning to the Present',
    title_vi: 'MBCT Bài 4: Nhận diện Sự Chống cự & Quay về Hiện tại',
    therapy_model: 'MBCT',
    goals: ['Notice how the mind reacts to unpleasant feelings without forcing relaxation'],
    reference_id: 'SEGAL-MBCT-STEP4',
    reference_citation: 'Segal, Williams, & Teasdale (2013). MBCT Manual (2nd Ed.)',
    reference_url: 'https://www.nice.org.uk/guidance/ng222',
    reference_section: 'Session 4 — Recognizing Aversion',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'MBCT_ALLOWING_AND_ACCEPTING',
    title: 'MBCT-Informed Step 5: Allowing and Letting Be',
    title_vi: 'MBCT Bài 5: Cho phép Cảm xúc Hiện diện Không Đấu tranh',
    therapy_model: 'MBCT',
    goals: ['Practice a kindly awareness toward difficult sensations or thoughts'],
    reference_id: 'SEGAL-MBCT-STEP5',
    reference_citation: 'Segal, Williams, & Teasdale (2013). MBCT Manual (2nd Ed.)',
    reference_url: 'https://www.nice.org.uk/guidance/ng222',
    reference_section: 'Session 5 — Allowing/Letting Be',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'MBCT_THOUGHTS_ARE_NOT_FACTS',
    title: 'MBCT-Informed Step 6: Thoughts Are Not Facts (Decentering)',
    title_vi: 'MBCT Bài 6: Suy nghĩ Chỉ Là Sự kiện Trong Tâm trí, Không Phải Sự thật Tuyệt đối',
    therapy_model: 'MBCT',
    goals: ['Observe negative thoughts as passing mental events rather than objective truths'],
    reference_id: 'SEGAL-MBCT-STEP6',
    reference_citation: 'Segal, Williams, & Teasdale (2013). MBCT Manual (2nd Ed.)',
    reference_url: 'https://www.nice.org.uk/guidance/ng222',
    reference_section: 'Session 6 — Thoughts Are Not Facts',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'MBCT_RESPONDING_NOT_REACTING',
    title: 'MBCT-Informed Step 7: Skillful Responding vs. Automatic Reacting',
    title_vi: 'MBCT Bài 7: Phản hồi Tỉnh thức Thay vì Phản ứng Tự động',
    therapy_model: 'MBCT',
    goals: ['Use a brief breathing space before choosing one nourishing or mastering small action'],
    reference_id: 'SEGAL-MBCT-STEP7',
    reference_citation: 'Segal, Williams, & Teasdale (2013). MBCT Manual (2nd Ed.)',
    reference_url: 'https://www.nice.org.uk/guidance/ng222',
    reference_section: 'Session 7 — How Can I Best Take Care of Myself?',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'MBCT_RELAPSE_AWARENESS',
    title: 'MBCT-Informed Step 8: Maintaining Practice & Early Relapse Awareness',
    title_vi: 'MBCT Bài 8: Duy trì Tỉnh thức & Nhận diện Dấu hiệu Trầm buồn Quay lại',
    therapy_model: 'MBCT',
    goals: ['Connect mindfulness skills with personal early warning signs and professional support plans'],
    reference_id: 'SEGAL-MBCT-STEP8',
    reference_citation: 'Segal, Williams, & Teasdale (2013). MBCT Manual (2nd Ed.)',
    reference_url: 'https://www.nice.org.uk/guidance/ng222',
    reference_section: 'Session 8 — Maintaining and Extending New Learning',
  }),

  // --- 4.6 Psychoeducation (10 Versioned Learning Modules) ---
  buildDraftProtocolManifest({
    protocol_id: 'PSYEDU_DEPRESSION',
    title: 'Understanding Depression & the Inactivity Cycle',
    title_vi: 'Hiểu về Trầm cảm & Vòng xoáy Kiệt sức – Rút lui',
    therapy_model: 'Psychoeducation',
    intended_use: ['education'],
    goals: ['Provide non-stigmatizing education on depressive symptoms and when to seek professional care'],
    reference_id: 'NICE-NG222-EDU',
    reference_citation: 'NICE Guideline NG222 Patient Information',
    reference_url: 'https://www.nice.org.uk/guidance/ng222',
    reference_section: 'Understanding depression',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'PSYEDU_ANXIETY_WORRY',
    title: 'Understanding Anxiety, Worry & Safety Behaviors',
    title_vi: 'Hiểu về Rối loạn Lo âu, Lo lắng Kéo dài & Hành vi An toàn',
    therapy_model: 'Psychoeducation',
    intended_use: ['education'],
    goals: ['Explain how avoidance and reassurance-seeking maintain anxiety over time'],
    reference_id: 'NICE-CG113-EDU',
    reference_citation: 'NICE Guideline CG113 Patient Education',
    reference_url: 'https://www.nice.org.uk/guidance/cg113',
    reference_section: 'Understanding generalized anxiety',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'PSYEDU_PANIC_MEDICAL',
    title: 'Understanding Panic Symptoms & When to Seek Medical Assessment',
    title_vi: 'Hiểu Triệu chứng Cơn Hoảng loạn & Khi Nào Cần Thăm khám Y khoa Thực thể',
    therapy_model: 'Psychoeducation',
    intended_use: ['education'],
    goals: ['Explain acute autonomic arousal while clearly stating red-flag physical symptoms requiring medical evaluation'],
    reference_id: 'NICE-CG113-PANIC-EDU',
    reference_citation: 'NICE Guideline CG113 — Panic vs. Medical Assessment',
    reference_url: 'https://www.nice.org.uk/guidance/cg113',
    reference_section: 'Panic symptoms & medical differential',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'PSYEDU_BIPOLAR_EPISODES',
    title: 'Understanding Bipolar Disorder & Mood Episodes',
    title_vi: 'Hiểu về Rối loạn Lưỡng cực & Các Pha Khí sắc (Trầm cảm, Hưng cảm, Hỗn hợp)',
    therapy_model: 'Psychoeducation',
    intended_use: ['education'],
    goals: ['Explain depression, hypomania, mania, and mixed features without oversimplifying neurobiology'],
    reference_id: 'NICE-CG185-EDU',
    reference_citation: 'NICE Guideline CG185 — Bipolar Disorder Information',
    reference_url: 'https://www.nice.org.uk/guidance/cg185',
    reference_section: 'Understanding bipolar disorder',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'PSYEDU_SLEEP_ROUTINE_MOOD',
    title: 'Sleep, Circadian Routine, and Mood Stability',
    title_vi: 'Mối liên hệ Giữa Giấc ngủ, Nhịp Sinh học và Ổn định Khí sắc',
    therapy_model: 'Psychoeducation',
    intended_use: ['education'],
    goals: ['Explain how regular sleep-wake anchors protect mood stability and why reduced sleep need requires attention'],
    reference_id: 'NICE-CG185-SLEEP-EDU',
    reference_citation: 'NICE CG185 & IPSRT Sleep-Mood Education',
    reference_url: 'https://www.nice.org.uk/guidance/cg185',
    reference_section: 'Sleep and circadian regularity',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'PSYEDU_MEDICATION_CONVERSATIONS',
    title: 'Medication Conversations & Adherence Support with Your Prescriber',
    title_vi: 'Cách Trao đổi Về Thuốc & Tác dụng phụ Cùng Bác sĩ Điều trị',
    therapy_model: 'Psychoeducation',
    intended_use: ['education'],
    goals: ['Help users prepare questions about benefits and side effects for their psychiatrist or pharmacist without giving dosing advice'],
    reference_id: 'NICE-CG185-MED-EDU',
    reference_citation: 'NICE CG185 & NG222 Shared Decision-Making in Medication',
    reference_url: 'https://www.nice.org.uk/guidance/cg185',
    reference_section: 'Medication discussions',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'PSYEDU_EARLY_WARNING_SIGNS',
    title: 'Recognizing Personal Early Warning Signs',
    title_vi: 'Nhận diện Dấu hiệu Cảnh báo Sớm Cá nhân',
    therapy_model: 'Psychoeducation',
    intended_use: ['education'],
    goals: ['Learn how to spot subtle personal shifts in sleep, energy, or withdrawal early'],
    reference_id: 'NICE-CG185-PRODROME-EDU',
    reference_citation: 'Lam et al. & NICE CG185 Early Warning Signs',
    reference_url: 'https://www.nice.org.uk/guidance/cg185',
    reference_section: 'Early warning sign recognition',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'PSYEDU_SUPPORT_FAMILY_MEMBER',
    title: 'How to Support a Family Member Compassionate & Safely',
    title_vi: 'Cách Đồng hành & Hỗ trợ Người thân Một cách Thấu cảm, Tôn trọng Ranh giới',
    therapy_model: 'Psychoeducation',
    intended_audience: ['adult_user', 'caregiver'],
    intended_use: ['education'],
    goals: ['Guide consenting family members on low-expressed-emotion support, active listening, and crisis help'],
    reference_id: 'MIKLOWITZ-FFT-EDU',
    reference_citation: 'Miklowitz, D. J. Bipolar Disorder Survival Guide & NICE CG185 Carer Support',
    reference_url: 'https://www.nice.org.uk/guidance/cg185',
    reference_section: 'Carer and family support',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'PSYEDU_PREPARE_APPOINTMENT',
    title: 'How to Prepare for a Clinical Appointment',
    title_vi: 'Chuẩn bị Câu hỏi & Thông tin Trước Buổi Tái khám Bác sĩ / Nhà trị liệu',
    therapy_model: 'Psychoeducation',
    intended_use: ['education'],
    goals: ['Help users summarize key symptoms, sleep changes, medication questions, and goals for their clinician'],
    reference_id: 'NICE-SHARED-CARE-EDU',
    reference_citation: 'NICE Shared Decision Making Guideline NG197',
    reference_url: 'https://www.nice.org.uk/guidance/ng197',
    reference_section: 'Preparing for clinical appointments',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'PSYEDU_MYTHS_STIGMA_COMPASSION',
    title: 'Mental Health Myths, Stigma, and Self-Compassion',
    title_vi: 'Hóa giải Định kiến, Tự Kỳ thị và Thực hành Tự Trắc ẩn',
    therapy_model: 'Psychoeducation',
    intended_use: ['education'],
    goals: ['Separate psychological symptoms from moral failure and encourage compassionate help-seeking'],
    reference_id: 'WHO-STIGMA-EDU',
    reference_citation: 'WHO Mental Health Anti-Stigma & Trauma-Informed Care Principles',
    reference_url: 'https://www.who.int/health-topics/mental-health',
    reference_section: 'Non-stigmatizing & trauma-informed care',
  }),

  // --- 4.7 FFT / Family Support (6 Components) ---
  buildDraftProtocolManifest({
    protocol_id: 'FFT_PSYCHOEDUCATION',
    title: 'Family Support: Shared Understanding of Mood & Anxiety Conditions',
    title_vi: 'Hỗ trợ Gia đình (FFT): Cùng Hiểu Đúng Về Triệu chứng & Điều trị',
    therapy_model: 'FFT',
    intended_audience: ['adult_user', 'caregiver'],
    intended_use: ['education'],
    goals: ['Build a shared, non-blaming understanding of symptoms and recovery boundaries'],
    reference_id: 'MIKLOWITZ-FFT-1',
    reference_citation: 'Miklowitz, D. J. (2010). Bipolar Disorder: A Family-Focused Treatment Approach (2nd Ed.)',
    reference_url: 'https://www.nice.org.uk/guidance/cg185',
    reference_section: 'FFT Module 1 — Psychoeducation',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'FFT_COMMUNICATION_LISTENING',
    title: 'Family Support: Active Listening & Validation',
    title_vi: 'Hỗ trợ Gia đình (FFT): Kỹ năng Lắng nghe Chủ động Không Phán xét',
    therapy_model: 'FFT',
    intended_audience: ['adult_user', 'caregiver'],
    goals: ['Practice calm, non-defensive listening and summarizing within a consented family relationship'],
    reference_id: 'MIKLOWITZ-FFT-2',
    reference_citation: 'Miklowitz, D. J. (2010). FFT Manual (2nd Ed.)',
    reference_url: 'https://www.nice.org.uk/guidance/cg185',
    reference_section: 'FFT Module 2 — Active Listening',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'FFT_COMMUNICATION_PRACTICE',
    title: 'Family Support: Structured Expression of Needs & Positive Requests',
    title_vi: 'Hỗ trợ Gia đình (FFT): Diễn đạt Nhu cầu & Lời đề nghị Cụ thể, Tích cực',
    therapy_model: 'FFT',
    intended_audience: ['adult_user', 'caregiver'],
    goals: ['Express appreciation or make specific, low-stress requests without criticism or coercion'],
    reference_id: 'MIKLOWITZ-FFT-3',
    reference_citation: 'Miklowitz, D. J. (2010). FFT Manual (2nd Ed.)',
    reference_url: 'https://www.nice.org.uk/guidance/cg185',
    reference_section: 'FFT Module 2 — Communication Enhancement',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'FFT_PROBLEM_SOLVING',
    title: 'Family Support: Collaborative Shared Problem Solving',
    title_vi: 'Hỗ trợ Gia đình (FFT): Cùng Giải quyết Vấn đề Chung Theo Từng Bước',
    therapy_model: 'FFT',
    intended_audience: ['adult_user', 'caregiver'],
    goals: ['Define one practical shared challenge, brainstorm options without criticism, and agree on a small plan'],
    reference_id: 'MIKLOWITZ-FFT-4',
    reference_citation: 'Miklowitz, D. J. (2010). FFT Manual (2nd Ed.)',
    reference_url: 'https://www.nice.org.uk/guidance/cg185',
    reference_section: 'FFT Module 3 — Problem Solving',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'FFT_EARLY_WARNING_PLAN',
    title: 'Family Support: Agreed Early Warning Signs & Support Actions',
    title_vi: 'Hỗ trợ Gia đình (FFT): Thống nhất Dấu hiệu Sớm & Cách Người thân Hỗ trợ Khi Cần',
    therapy_model: 'FFT',
    intended_audience: ['adult_user', 'caregiver'],
    goals: ['Document patient-approved support actions for family members when early warning signs appear'],
    reference_id: 'MIKLOWITZ-FFT-5',
    reference_citation: 'Miklowitz, D. J. (2010). FFT Relapse Prevention Planning',
    reference_url: 'https://www.nice.org.uk/guidance/cg185',
    reference_section: 'FFT Relapse Prevention',
  }),
  buildDraftProtocolManifest({
    protocol_id: 'FFT_CAREGIVER_SELF_CARE',
    title: 'Caregiver Self-Care, Boundaries & Stress Awareness',
    title_vi: 'Chăm sóc Sức khỏe Tinh thần & Ranh giới Cho Người thân Đồng hành',
    therapy_model: 'FFT',
    intended_audience: ['caregiver'],
    goals: ['Support caregiver well-being, burnout prevention, healthy boundaries, and independent support resources'],
    reference_id: 'NICE-CG185-CARER-CARE',
    reference_citation: 'NICE CG185 Support for Carers & Family Members',
    reference_url: 'https://www.nice.org.uk/guidance/cg185',
    reference_section: 'Carer health and boundaries',
  }),
];

export function getMasterProtocolById(protocolId: string): ProtocolManifest | undefined {
  return MASTER_PROTOCOL_CATALOG.find((p) => p.protocol_id === protocolId);
}

// =============================================================================
// 3. DEDICATED DETERMINISTIC SAFETY SUBSYSTEM, EMERGENCY DIRECTORY & SAFETY PLAN (§3)
// =============================================================================

export interface EmergencyContactDirectoryEntry {
  id: string;
  nameVi: string;
  nameEn: string;
  phone: string;
  hours: string;
  isEmergencyDispatch: boolean;
  notesVi: string;
}

export interface RegionalEmergencyDirectory {
  countryCode: string;
  regionNameVi: string;
  regionNameEn: string;
  lastVerifiedDate: string; // YYYY-MM-DD
  verifiedBy: string;
  maxStaleDays: number;
  contacts: EmergencyContactDirectoryEntry[];
}

export const OFFLINE_EMERGENCY_DIRECTORY: Record<string, RegionalEmergencyDirectory> = {
  VN: {
    countryCode: 'VN',
    regionNameVi: 'Việt Nam (Toàn quốc & Tuyến Trung ương)',
    regionNameEn: 'Vietnam (National & Psychiatric Referral Centers)',
    lastVerifiedDate: '2026-11-23',
    verifiedBy: 'Clinical Safety Review Pending (v0.1.0-draft)',
    maxStaleDays: 90,
    contacts: [
      {
        id: 'vn-115',
        nameVi: '115 — Cấp cứu Y tế Khẩn cấp Toàn quốc',
        nameEn: '115 — National Emergency Medical Services',
        phone: '115',
        hours: '24/7',
        isEmergencyDispatch: true,
        notesVi: 'Gọi ngay khi có nguy cơ đe dọa tính mạng hoặc cần cấp cứu y tế tại chỗ.',
      },
      {
        id: 'vn-111',
        nameVi: '111 — Tổng đài Quốc gia Bảo vệ & Phòng chống Bạo lực',
        nameEn: '111 — National Protection & Domestic Abuse Helpline',
        phone: '111',
        hours: '24/7 (Miễn phí)',
        isEmergencyDispatch: false,
        notesVi: 'Hỗ trợ khẩn cấp khi bị bạo hành, đe dọa hoặc không an toàn.',
      },
      {
        id: 'vn-bach-mai',
        nameVi: '1900 1267 — Viện Sức khỏe Tâm thần (BV Bạch Mai, Hà Nội)',
        nameEn: '1900 1267 — National Institute of Mental Health (Bach Mai Hospital)',
        phone: '1900 1267',
        hours: 'Liên hệ chuyên khoa tâm thần',
        isEmergencyDispatch: false,
        notesVi: 'Tư vấn và tiếp nhận thăm khám chuyên khoa tâm thần.',
      },
      {
        id: 'vn-hcmc-psych',
        nameVi: '028 3923 4675 — Bệnh viện Tâm thần TP. Hồ Chí Minh',
        nameEn: '028 3923 4675 — Ho Chi Minh City Psychiatric Hospital',
        phone: '028 3923 4675',
        hours: '24/7',
        isEmergencyDispatch: false,
        notesVi: 'Trực cấp cứu và thăm khám chuyên khoa tâm thần khu vực phía Nam.',
      },
    ],
  },
  US: {
    countryCode: 'US',
    regionNameVi: 'Hoa Kỳ & Canada',
    regionNameEn: 'United States & Canada',
    lastVerifiedDate: '2026-11-23',
    verifiedBy: 'Clinical Safety Review Pending (v0.1.0-draft)',
    maxStaleDays: 90,
    contacts: [
      {
        id: 'us-911',
        nameVi: '911 — Dịch vụ Cấp cứu Khẩn cấp',
        nameEn: '911 — Emergency Medical Services',
        phone: '911',
        hours: '24/7',
        isEmergencyDispatch: true,
        notesVi: 'Gọi khi có nguy hiểm tức thì đến tính mạng.',
      },
      {
        id: 'us-988',
        nameVi: '988 — Đường dây Hỗ trợ Khủng hoảng & Phòng ngừa Tự sát',
        nameEn: '988 — Suicide & Crisis Lifeline',
        phone: '988',
        hours: '24/7',
        isEmergencyDispatch: false,
        notesVi: 'Gọi hoặc nhắn tin miễn phí 24/7.',
      },
    ],
  },
};

export function evaluateEmergencyDirectoryStatus(input: {
  countryCode?: string;
  referenceDateIso?: string;
  customDirectory?: RegionalEmergencyDirectory | null;
}): {
  directoryAvailable: boolean;
  isStale: boolean;
  daysSinceVerification: number;
  directory: RegionalEmergencyDirectory;
  warningVi?: string;
  warningEn?: string;
  nonMonitoringNoticeVi: string;
  nonMonitoringNoticeEn: string;
} {
  const code = (input.countryCode ?? 'VN').toUpperCase();
  const matched =
    input.customDirectory === null
      ? undefined
      : input.customDirectory ?? OFFLINE_EMERGENCY_DIRECTORY[code];

  const fallback = OFFLINE_EMERGENCY_DIRECTORY.VN!;
  const directory = matched ?? fallback;
  const refMs = Date.parse(input.referenceDateIso ?? new Date().toISOString());
  const verMs = Date.parse(directory.lastVerifiedDate);
  const daysSinceVerification = Number.isNaN(refMs) || Number.isNaN(verMs)
    ? 999
    : Math.max(0, Math.floor((refMs - verMs) / (1000 * 60 * 60 * 24)));

  const isMissingCountry = !matched;
  const isStale = isMissingCountry || daysSinceVerification > directory.maxStaleDays;

  return {
    directoryAvailable: Boolean(matched),
    isStale,
    daysSinceVerification,
    directory,
    warningVi: isMissingCountry
      ? `Chưa có danh bạ khẩn cấp riêng đã xác minh cho mã vùng "${code}". Đang hiển thị danh bạ dự phòng ngoại tuyến (VN / Quốc tế) — hãy gọi ngay số cấp cứu y tế tại địa phương của bạn hoặc đến khoa cấp cứu bệnh viện gần nhất.`
      : isStale
        ? `Lưu ý: Danh bạ khẩn cấp lần cuối được xác minh vào ngày ${directory.lastVerifiedDate} (${daysSinceVerification} ngày trước). Nếu số chuyên khoa thay đổi, vui lòng gọi trực tiếp số cấp cứu y tế quốc gia (115 / 911 / 112) hoặc đến bệnh viện gần nhất.`
        : undefined,
    warningEn: isMissingCountry
      ? `No verified regional emergency directory found for "${code}". Showing offline fallback contacts — please contact your local emergency services or nearest hospital emergency department.`
      : isStale
        ? `Notice: This emergency directory was last verified on ${directory.lastVerifiedDate} (${daysSinceVerification} days ago). If a local number has changed, call national emergency services (115 / 911 / 112) or go to the nearest emergency department.`
        : undefined,
    nonMonitoringNoticeVi:
      'Ứng dụng không có người trực giám sát liên tục 24/7 và không thể tự điều phối xe cấp cứu. Tất cả cuộc gọi liên hệ đều do bạn chủ động thực hiện.',
    nonMonitoringNoticeEn:
      'This application is not continuously monitored 24/7 and cannot automatically dispatch emergency help. All calls are user-initiated.',
  };
}

/**
 * §3.4 Personal Safety Plan (6 Structured Voluntary Sections)
 */
export interface PersonalSafetyPlan {
  id: string;
  userId: string;
  section1PersonalWarningSigns: string[];
  section2InternalCopingStrategies: string[];
  section3DistractionPeopleAndPlaces: Array<{ label: string; contactOrLocation?: string }>;
  section4TrustedPeopleToAskForHelp: Array<{ name: string; relationship: string; phone: string }>;
  section5ProfessionalAndEmergencyContacts: Array<{ name: string; roleOrService: string; phone: string }>;
  section6EnvironmentSafetySteps: string[];
  explicitConsentForStoringContacts: boolean;
  reviewedWithClinician: boolean;
  updatedAt: string;
}

export function validatePersonalSafetyPlan(
  plan: Partial<PersonalSafetyPlan>,
): ValidationResult<PersonalSafetyPlan> {
  const errors: string[] = [];
  if (!plan.id || !plan.userId) {
    errors.push('id and userId are required.');
  }
  const hasSensitiveContacts =
    (plan.section4TrustedPeopleToAskForHelp?.length ?? 0) > 0 ||
    (plan.section5ProfessionalAndEmergencyContacts?.length ?? 0) > 0;
  if (hasSensitiveContacts && plan.explicitConsentForStoringContacts !== true) {
    errors.push(
      '§3.4 Violation: Storing trusted or professional contact details in the Safety Plan requires explicitConsentForStoringContacts === true.',
    );
  }
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return {
    valid: true,
    errors: [],
    data: {
      id: plan.id!,
      userId: plan.userId!,
      section1PersonalWarningSigns: plan.section1PersonalWarningSigns ?? [],
      section2InternalCopingStrategies: plan.section2InternalCopingStrategies ?? [],
      section3DistractionPeopleAndPlaces: plan.section3DistractionPeopleAndPlaces ?? [],
      section4TrustedPeopleToAskForHelp: plan.section4TrustedPeopleToAskForHelp ?? [],
      section5ProfessionalAndEmergencyContacts: plan.section5ProfessionalAndEmergencyContacts ?? [],
      section6EnvironmentSafetySteps: plan.section6EnvironmentSafetySteps ?? [],
      explicitConsentForStoringContacts: plan.explicitConsentForStoringContacts ?? false,
      reviewedWithClinician: plan.reviewedWithClinician ?? false,
      updatedAt: plan.updatedAt ?? new Date().toISOString(),
    },
  };
}

export type SafetyUserChoice =
  | 'call_emergency_services'
  | 'contact_trusted_person'
  | 'open_personal_safety_plan'
  | 'pause_or_stop_exercise'
  | 'decline_safety_questions_show_help'
  | 'acknowledged_guidance';

export interface SafetyEventAuditRecord {
  eventId: string;
  userId: string;
  userRole: 'adult_user' | 'caregiver';
  pathwayState: PathwayWorkflowState;
  claimsUserIsLowRisk: false;
  ordinaryExerciseSuspended: boolean;
  interruptedProtocolId?: string;
  guidanceDisplayed: string[];
  userChoice: SafetyUserChoice;
  networkOffline: boolean;
  directoryStaleOrMissingWarningShown: boolean;
  aiConflictOverridden: boolean;
  timestamp: string;
}

/**
 * §3.1–3.5 & §11.2 Comprehensive Deterministic Safety Subsystem Evaluator
 * Covers all 12 mandatory safety test scenarios in §11.2 without relying solely on keywords.
 */
export function evaluateMasterPlanSafetySubsystem(input: {
  userId: string;
  userRole?: 'adult_user' | 'caregiver';
  textDisclosure?: string;
  positiveSuicideOrSelfHarmScreen?: boolean;
  currentIntentOrPlanReported?: boolean;
  recentSelfHarmReported?: boolean;
  psychosisOrSevereAgitationReported?: boolean;
  userRequestedEmergencyHelpDirectly?: boolean;
  userDeclinedSafetyQuestions?: boolean;
  multiSignalManiaOrMixedStateDetected?: boolean;
  acuteDistressIntensity?: number; // 0-10
  inProgressProtocol?: ProtocolManifest;
  aiSuggestedOverrideSafeToContinue?: boolean;
  networkOffline?: boolean;
  countryCode?: string;
  directoryReferenceDateIso?: string;
  customEmergencyDirectory?: RegionalEmergencyDirectory | null;
  userSelectedAction?: SafetyUserChoice;
}): {
  pathwayState: PathwayWorkflowState;
  claimsUserIsLowRisk: false;
  ordinaryExerciseSuspended: boolean;
  requiresImmediateEmergencyScreen: boolean;
  requiresQuestionnaireBeforeShowingHelp: false;
  aiOutputOverriddenBySafetyEngine: boolean;
  deprecatedProtocolNotice?: ReturnType<typeof resolveInProgressSessionOnProtocolUpdate>;
  emergencyDirectoryStatus: ReturnType<typeof evaluateEmergencyDirectoryStatus>;
  caregiverSpecificGuidanceVi?: string;
  caregiverSpecificGuidanceEn?: string;
  guidanceBannerVi: string;
  guidanceBannerEn: string;
  auditRecord: SafetyEventAuditRecord;
} {
  const role = input.userRole ?? 'adult_user';
  const text = (input.textDisclosure ?? '').toLowerCase();
  const dirStatus = evaluateEmergencyDirectoryStatus({
    countryCode: input.countryCode,
    referenceDateIso: input.directoryReferenceDateIso,
    customDirectory: input.customEmergencyDirectory,
  });

  const keywordSuicideOrSelfHarm =
    /\b(tự\s*tử|tự\s*sát|muốn\s*chết|kết\s*liễu|không\s*muốn\s*sống|rạch\s*tay|tự\s*hại|uống\s*thuốc\s*quá\s*liều|kill\s*myself|end\s*my\s*life|suicide|self[\s-]*harm|overdose)\b/i.test(
      text,
    );
  const keywordPsychosis =
    /\b(tiếng\s*nói\s*ra\s*lệnh|theo\s*dõi\s*giết\s*tôi|command\s*hallucination|voices\s*telling\s*me\s*to\s*hurt)\b/i.test(
      text,
    );

  const isEmergency =
    Boolean(input.userRequestedEmergencyHelpDirectly) ||
    Boolean(input.currentIntentOrPlanReported) ||
    Boolean(input.recentSelfHarmReported) ||
    Boolean(input.psychosisOrSevereAgitationReported) ||
    keywordSuicideOrSelfHarm ||
    keywordPsychosis;

  const isUrgentHumanSupport =
    !isEmergency &&
    (Boolean(input.positiveSuicideOrSelfHarmScreen) ||
      Boolean(input.multiSignalManiaOrMixedStateDetected) ||
      Boolean(input.userDeclinedSafetyQuestions));

  const isDistressSupport =
    !isEmergency && !isUrgentHumanSupport && (input.acuteDistressIntensity ?? 0) >= 7;

  let pathwayState: PathwayWorkflowState = 'routine_support';
  if (isEmergency) {
    pathwayState = 'emergency_guidance';
  } else if (isUrgentHumanSupport) {
    pathwayState = 'urgent_human_support';
  } else if (isDistressSupport) {
    pathwayState = 'distress_support';
  }

  const ordinaryExerciseSuspended =
    pathwayState === 'emergency_guidance' || pathwayState === 'urgent_human_support';

  // §8.3 & §11.2 Rule: Never let AI output or retrieved documents override the deterministic Safety Engine
  const aiOutputOverriddenBySafetyEngine =
    ordinaryExerciseSuspended && input.aiSuggestedOverrideSafeToContinue === true;

  const deprecatedProtocolNotice = input.inProgressProtocol
    ? resolveInProgressSessionOnProtocolUpdate({
        protocolManifest: input.inProgressProtocol,
        sessionAlreadyInProgress: true,
      })
    : undefined;

  const caregiverSpecificGuidanceVi =
    role === 'caregiver'
      ? 'Bạn đang sử dụng chế độ Người thân Đồng hành: Nếu người thân của bạn có nguy cơ tự hại, loạn thần hoặc kích động cấp tính, hãy giữ bình tĩnh, không để họ ở một mình nếu an toàn, và gọi ngay 115 hoặc đưa tới cơ sở y tế gần nhất. Bạn không thể chỉnh sửa hồ sơ lâm sàng của người bệnh.'
      : undefined;
  const caregiverSpecificGuidanceEn =
    role === 'caregiver'
      ? 'Caregiver Mode: If your family member is in immediate danger, stay calm, do not leave them alone if safe to stay, and call local emergency services (115 / 911 / 112) or go to the nearest emergency department. Caregivers cannot edit patient clinical records.'
      : undefined;

  const guidanceBannerVi =
    pathwayState === 'emergency_guidance'
      ? '🚨 HỖ TRỢ KHẨN CẤP TỨC THÌ: Bài tập thông thường đã được tạm dừng để ưu tiên sự an toàn của bạn. Bạn không cần trả lời thêm câu hỏi nào để xem thông tin hỗ trợ. Hãy gọi ngay 115, liên hệ người tin cậy hoặc mở Kế hoạch An toàn bên dưới (hoạt động cả khi mất mạng).'
      : pathwayState === 'urgent_human_support'
        ? '⚠️ KHUYẾN NGHỊ KẾT NỐI HỖ TRỢ CON NGƯỜI NGAY: Bài tập hiện tại đã được tạm dừng. Hệ thống ghi nhận dấu hiệu cần được bác sĩ hoặc người thân hỗ trợ trực tiếp. Dưới đây là danh bạ khẩn cấp và Kế hoạch An toàn của bạn.'
        : pathwayState === 'distress_support'
          ? '🌿 Cảm xúc hiện tại đang khá mạnh. Hãy ưu tiên làm dịu cơ thể nhẹ nhàng hoặc tạm dừng bất cứ lúc nào bạn muốn.'
          : 'Không gian hỗ trợ sẵn sàng. Lưu ý: việc không có cảnh báo tự động không đồng nghĩa với kết luận y khoa rằng bạn hoàn toàn không có rủi ro — bạn luôn có thể mở mục Hỗ trợ & Khẩn cấp bất cứ lúc nào.';

  const guidanceBannerEn =
    pathwayState === 'emergency_guidance'
      ? '🚨 IMMEDIATE EMERGENCY GUIDANCE: Ordinary exercises are suspended. No questionnaire is required to view emergency contacts. Please call emergency services (115 / 911 / 112), contact a trusted person, or open your offline Personal Safety Plan.'
      : pathwayState === 'urgent_human_support'
        ? '⚠️ URGENT HUMAN SUPPORT RECOMMENDED: The current exercise is paused. Please connect promptly with a qualified clinician, crisis line, or trusted support person.'
        : pathwayState === 'distress_support'
          ? '🌿 Distress is elevated. Focus on gentle grounding or pause whenever you wish.'
          : 'Support workspace ready. Note: absence of an automated alert does not establish a clinical "low risk" determination — emergency resources remain accessible at any time.';

  const guidanceDisplayed = [
    pathwayState,
    ...dirStatus.directory.contacts.map((c) => c.id),
    ...(dirStatus.isStale ? ['stale_or_fallback_directory_warning'] : []),
    ...(input.networkOffline ? ['offline_emergency_cache_served'] : []),
  ];

  const auditRecord: SafetyEventAuditRecord = {
    eventId: `se-${Date.now()}`,
    userId: input.userId,
    userRole: role,
    pathwayState,
    claimsUserIsLowRisk: false,
    ordinaryExerciseSuspended,
    interruptedProtocolId: ordinaryExerciseSuspended ? input.inProgressProtocol?.protocol_id : undefined,
    guidanceDisplayed,
    userChoice:
      input.userSelectedAction ??
      (input.userDeclinedSafetyQuestions
        ? 'decline_safety_questions_show_help'
        : ordinaryExerciseSuspended
          ? 'open_personal_safety_plan'
          : 'acknowledged_guidance'),
    networkOffline: Boolean(input.networkOffline),
    directoryStaleOrMissingWarningShown: dirStatus.isStale,
    aiConflictOverridden: aiOutputOverriddenBySafetyEngine,
    timestamp: new Date().toISOString(),
  };

  return {
    pathwayState,
    claimsUserIsLowRisk: false,
    ordinaryExerciseSuspended,
    requiresImmediateEmergencyScreen: ordinaryExerciseSuspended,
    requiresQuestionnaireBeforeShowingHelp: false,
    aiOutputOverriddenBySafetyEngine,
    deprecatedProtocolNotice,
    emergencyDirectoryStatus: dirStatus,
    caregiverSpecificGuidanceVi,
    caregiverSpecificGuidanceEn,
    guidanceBannerVi,
    guidanceBannerEn,
    auditRecord,
  };
}

// =============================================================================
// 4. ASSESSMENT GOVERNANCE, WHO-5 WELL-BEING & OUTCOME DOMAINS (§6.1–6.4)
// =============================================================================

export interface InstrumentGovernanceRecord {
  instrumentCode: 'PHQ-9' | 'GAD-7' | 'MDQ' | 'ASRM' | 'ISI' | 'BMS' | 'WHO-5' | 'C-SSRS';
  fullName: string;
  version: string;
  intendedPurpose: 'screening_and_monitoring' | 'symptom_monitoring' | 'wellbeing_monitoring' | 'structured_suicide_assessment';
  validatedPopulation: string;
  vietnameseTranslationStatus: 'pending_local_clinical_validation' | 'validated';
  licensingStatus: 'public_domain' | 'permission_required_pending_verification';
  recallPeriodVi: string;
  recallPeriodEn: string;
  keyLimitationVi: string;
  keyLimitationEn: string;
  reassessmentPolicyNoteVi: string;
  reviewerStatus: 'draft_awaiting_clinical_reviewer';
}

export const INSTRUMENT_GOVERNANCE_REGISTRY: Record<InstrumentGovernanceRecord['instrumentCode'], InstrumentGovernanceRecord> = {
  'PHQ-9': {
    instrumentCode: 'PHQ-9',
    fullName: 'Patient Health Questionnaire-9',
    version: '1.0',
    intendedPurpose: 'screening_and_monitoring',
    validatedPopulation: 'Adults (18+)',
    vietnameseTranslationStatus: 'pending_local_clinical_validation',
    licensingStatus: 'public_domain',
    recallPeriodVi: 'Trong 2 tuần qua',
    recallPeriodEn: 'Over the last 2 weeks',
    keyLimitationVi: 'Kết quả chỉ hỗ trợ sàng lọc và theo dõi triệu chứng, tuyệt đối không phải là chẩn đoán trầm cảm. Câu số 9 không đủ để phân loại toàn diện nguy cơ tự sát.',
    keyLimitationEn: 'Not a clinical diagnosis; item 9 alone cannot establish or rule out suicide risk.',
    reassessmentPolicyNoteVi: 'Chỉ gợi ý làm lại khi có lý do theo dõi tiến triển và người dùng đồng ý, không ép buộc lặp lại máy móc.',
    reviewerStatus: 'draft_awaiting_clinical_reviewer',
  },
  'GAD-7': {
    instrumentCode: 'GAD-7',
    fullName: 'Generalized Anxiety Disorder-7',
    version: '1.0',
    intendedPurpose: 'screening_and_monitoring',
    validatedPopulation: 'Adults (18+)',
    vietnameseTranslationStatus: 'pending_local_clinical_validation',
    licensingStatus: 'public_domain',
    recallPeriodVi: 'Trong 2 tuần qua',
    recallPeriodEn: 'Over the last 2 weeks',
    keyLimitationVi: 'Không phải là chẩn đoán y khoa và không nhận diện được mọi dạng rối loạn lo âu chuyên biệt.',
    keyLimitationEn: 'Not a diagnosis; does not identify every specific anxiety disorder.',
    reassessmentPolicyNoteVi: 'Thực hiện theo nhu cầu theo dõi của người dùng hoặc kế hoạch cùng bác sĩ.',
    reviewerStatus: 'draft_awaiting_clinical_reviewer',
  },
  MDQ: {
    instrumentCode: 'MDQ',
    fullName: 'Mood Disorder Questionnaire',
    version: '1.0',
    intendedPurpose: 'screening_and_monitoring',
    validatedPopulation: 'Adults (18+)',
    vietnameseTranslationStatus: 'pending_local_clinical_validation',
    licensingStatus: 'permission_required_pending_verification',
    recallPeriodVi: 'Tiền sử các giai đoạn khí sắc trong đời',
    recallPeriodEn: 'Lifetime history of mood periods',
    keyLimitationVi: 'Kết quả dương tính KHÔNG phải là chẩn đoán Rối loạn Lưỡng cực; cần bác sĩ chuyên khoa tâm thần thăm khám trực tiếp.',
    keyLimitationEn: 'A positive screen is NEVER a definitive bipolar diagnosis; requires comprehensive psychiatric assessment.',
    reassessmentPolicyNoteVi: 'Chỉ dùng sàng lọc tham khảo ban đầu, không lặp lại định kỳ 14 ngày.',
    reviewerStatus: 'draft_awaiting_clinical_reviewer',
  },
  ASRM: {
    instrumentCode: 'ASRM',
    fullName: 'Altman Self-Rating Mania Scale',
    version: '1.0',
    intendedPurpose: 'symptom_monitoring',
    validatedPopulation: 'Adults with bipolar spectrum monitoring needs (18+)',
    vietnameseTranslationStatus: 'pending_local_clinical_validation',
    licensingStatus: 'permission_required_pending_verification',
    recallPeriodVi: 'Trong tuần qua',
    recallPeriodEn: 'Over the past week',
    keyLimitationVi: 'Không phải công cụ chẩn đoán độc lập hay đánh giá cấp cứu.',
    keyLimitationEn: 'Not a standalone diagnostic instrument or emergency assessment.',
    reassessmentPolicyNoteVi: 'Theo dõi khi có thay đổi giấc ngủ/năng lượng hoặc theo lịch bác sĩ hướng dẫn.',
    reviewerStatus: 'draft_awaiting_clinical_reviewer',
  },
  ISI: {
    instrumentCode: 'ISI',
    fullName: 'Insomnia Severity Index',
    version: '1.0',
    intendedPurpose: 'symptom_monitoring',
    validatedPopulation: 'Adults (18+)',
    vietnameseTranslationStatus: 'pending_local_clinical_validation',
    licensingStatus: 'permission_required_pending_verification',
    recallPeriodVi: 'Trong 2 tuần qua',
    recallPeriodEn: 'Over the last 2 weeks',
    keyLimitationVi: 'Đo mức độ khó ngủ chủ quan nhưng không xác định nguyên nhân thực thể hay tâm thần gây mất ngủ.',
    keyLimitationEn: 'Measures subjective insomnia severity; does not establish underlying medical or psychiatric cause.',
    reassessmentPolicyNoteVi: 'Theo dõi khi thực hành chăm sóc giấc ngủ.',
    reviewerStatus: 'draft_awaiting_clinical_reviewer',
  },
  BMS: {
    instrumentCode: 'BMS',
    fullName: 'Brief Mood Survey (TEAM-CBT)',
    version: '1.0',
    intendedPurpose: 'symptom_monitoring',
    validatedPopulation: 'Adults (18+)',
    vietnameseTranslationStatus: 'pending_local_clinical_validation',
    licensingStatus: 'permission_required_pending_verification',
    recallPeriodVi: 'Ngay tại thời điểm hiện tại',
    recallPeriodEn: 'Right now',
    keyLimitationVi: 'Phản ánh cảm xúc chủ quan tức thời; sự thay đổi điểm ngắn hạn không phải bằng chứng hiệu quả điều trị lâm sàng.',
    keyLimitationEn: 'Reflects momentary subjective state; short-term score changes are not proof of clinical treatment efficacy.',
    reassessmentPolicyNoteVi: 'Tùy chọn trước/sau phiên thực hành.',
    reviewerStatus: 'draft_awaiting_clinical_reviewer',
  },
  'WHO-5': {
    instrumentCode: 'WHO-5',
    fullName: 'WHO-5 Well-Being Index',
    version: '1998.1',
    intendedPurpose: 'wellbeing_monitoring',
    validatedPopulation: 'Adults (18+)',
    vietnameseTranslationStatus: 'pending_local_clinical_validation',
    licensingStatus: 'public_domain',
    recallPeriodVi: 'Trong 2 tuần qua',
    recallPeriodEn: 'Over the last 2 weeks',
    keyLimitationVi: 'Đo cảm nhận sức khỏe tinh thần tích cực chủ quan, không phải là công cụ chẩn đoán bệnh lý.',
    keyLimitationEn: 'Subjective well-being measure; not a diagnostic instrument.',
    reassessmentPolicyNoteVi: 'Tùy chọn theo dõi định kỳ không bắt buộc.',
    reviewerStatus: 'draft_awaiting_clinical_reviewer',
  },
  'C-SSRS': {
    instrumentCode: 'C-SSRS',
    fullName: 'Columbia-Suicide Severity Rating Scale (Screener Governance Record)',
    version: 'Screener-Draft',
    intendedPurpose: 'structured_suicide_assessment',
    validatedPopulation: 'Requires formal clinical governance & training policy before activation',
    vietnameseTranslationStatus: 'pending_local_clinical_validation',
    licensingStatus: 'permission_required_pending_verification',
    recallPeriodVi: 'Trong tháng qua / Tiền sử',
    recallPeriodEn: 'Past month / Lifetime',
    keyLimitationVi: 'Đòi hỏi phiên bản chuẩn xác, chính sách quản trị lâm sàng và không bao giờ dùng để kết luận một người "hoàn toàn an toàn".',
    keyLimitationEn: 'Requires exact approved version and clinical governance; never establishes that a person is guaranteed safe.',
    reassessmentPolicyNoteVi: 'Chỉ kích hoạt theo quy trình an toàn đã được hội đồng lâm sàng phê duyệt.',
    reviewerStatus: 'draft_awaiting_clinical_reviewer',
  },
};

/**
 * §6.2 WHO-5 Well-Being Index Scorer (5 items rated 0..5 -> raw 0..25, percentage 0..100)
 */
export function scoreWho5WellBeing(items: number[]): {
  scale: 'WHO-5';
  rawScore: number;
  percentageScore: number;
  isDiagnosis: false;
  labelVi: string;
  labelEn: string;
  interpretationVi: string;
  interpretationEn: string;
  governance: InstrumentGovernanceRecord;
} {
  if (items.length !== 5) {
    throw new Error(`WHO-5 requires exactly 5 item scores (received ${items.length}).`);
  }
  let rawScore = 0;
  for (let i = 0; i < items.length; i++) {
    const v = items[i]!;
    if (!Number.isInteger(v) || v < 0 || v > 5) {
      throw new Error(`WHO-5 item[${i}] must be an integer between 0 and 5.`);
    }
    rawScore += v;
  }
  const percentageScore = rawScore * 4;
  const lowWellBeing = percentageScore <= 50;

  return {
    scale: 'WHO-5',
    rawScore,
    percentageScore,
    isDiagnosis: false,
    labelVi: lowWellBeing
      ? `Mức độ cảm nhận an vui đang thấp (${percentageScore}/100)`
      : `Mức độ cảm nhận an vui ổn định (${percentageScore}/100)`,
    labelEn: lowWellBeing
      ? `Reduced subjective well-being (${percentageScore}/100)`
      : `Moderate to good subjective well-being (${percentageScore}/100)`,
    interpretationVi:
      'Đây là chỉ số tự theo dõi cảm nhận sức khỏe tinh thần tích cực trong 2 tuần qua (không phải chẩn đoán y khoa). Nếu điểm <= 50/100 kéo dài, bạn có thể trao đổi thêm với chuyên gia tâm lý hoặc bác sĩ.',
    interpretationEn:
      'Self-reported well-being score over the past 2 weeks (not a medical diagnosis). A score <= 50/100 suggests discussing your well-being and mood with a healthcare professional.',
    governance: INSTRUMENT_GOVERNANCE_REGISTRY['WHO-5'],
  };
}

/**
 * §6.4 Non-Symptom Outcome Domains
 */
export interface OutcomeMeasurementRecord {
  userId: string;
  recordedAt: string;
  userDefinedFunctioningGoals: Array<{ goalText: string; progressNote: string }>;
  preSkillDistress?: number;
  postSkillDistress?: number;
  treatsDistressChangeAsProofOfEfficacy: false;
  exerciseUsabilityRating?: 1 | 2 | 3 | 4 | 5;
  adverseOrUnwantedExperienceReported: boolean;
  adverseExperienceNote?: string;
  helpSeekingActionTaken?: string;
}

// =============================================================================
// 5. MEDICATION SUPPORT BOUNDARY (§7)
// =============================================================================

export interface MedicationReminderConfig {
  reminderId: string;
  userId: string;
  medicationName: string;
  userEnteredScheduleText: string;
  enteredSource: 'user_self_entered' | 'clinician_verified_import';
  appPrescribesOrVerifiesRegimen: false;
  active: boolean;
}

export interface MedicationIntakeRecord {
  logId: string;
  reminderId: string;
  userId: string;
  intakeStatus: 'taken' | 'missed' | 'uncertain';
  isConfirmedByReminderAlone: false;
  possibleSideEffectNote?: string;
  loggedAt: string;
}

export function evaluateMedicationSupportAction(input: {
  intakeStatus: 'taken' | 'missed' | 'uncertain';
  possibleSideEffectNote?: string;
  userAskedForDoseChangeOrStopping?: boolean;
}): {
  allowed: boolean;
  blockedDoseRecommendation: boolean;
  guidanceVi: string;
  guidanceEn: string;
  disclaimerVi: string;
  disclaimerEn: string;
} {
  const blockedDoseRecommendation = Boolean(input.userAskedForDoseChangeOrStopping);
  return {
    allowed: !blockedDoseRecommendation,
    blockedDoseRecommendation,
    guidanceVi: blockedDoseRecommendation
      ? 'Ứng dụng tuyệt đối không khuyến nghị tăng/giảm liều, uống bù gấp đôi, thay thế hay tự ý ngưng thuốc. Vui lòng trao đổi trực tiếp với bác sĩ kê đơn hoặc dược sĩ của bạn.'
      : input.intakeStatus === 'missed' || input.possibleSideEffectNote
        ? 'Đã ghi nhận trung tính tình trạng quên liều / tác dụng phụ nghi ngờ để bạn tiện trao đổi với bác sĩ kê đơn hoặc dược sĩ trong buổi khám tới. Không tự ý uống gấp đôi liều.'
        : 'Đã ghi nhận nhật ký uống thuốc do bạn xác nhận (nhắc lịch không tự động tính là đã uống).',
    guidanceEn: blockedDoseRecommendation
      ? 'This application never recommends dose changes, discontinuation, doubling missed doses, or substitutions. Please speak directly with your prescriber or pharmacist.'
      : input.intakeStatus === 'missed' || input.possibleSideEffectNote
        ? 'Missed dose or possible side effect recorded neutrally for discussion with your prescriber or pharmacist. Never double a missed dose without prescriber advice.'
        : 'User-confirmed medication log saved (a reminder alone is never treated as confirmation of intake).',
    disclaimerVi:
      'Tính năng thuốc chỉ dùng để nhắc lịch và ghi chép cá nhân; ứng dụng không kê đơn và không thẩm định tính phù hợp của toa thuốc.',
    disclaimerEn:
      'Medication features are reminders and record-keeping tools only; the app does not prescribe or verify regimen appropriateness.',
  };
}

// =============================================================================
// 6. BIPOLAR MULTI-SIGNAL MONITORING & TIMEZONE-AWARE IPSRT (§3.5, §4.4)
// =============================================================================

export interface MultiSignalBipolarCheckInput {
  sleepDurationHours?: number;
  personalBaselineSleepHours?: number;
  reducedNeedForSleepReported: boolean; // Distinguished from insomnia!
  elevatedOrIrritableMoodReported: boolean;
  increasedEnergyOrGoalDirectedActivity: boolean;
  unusualTalkativenessOrRacingThoughts: boolean;
  increasedImpulsivityOrRiskyBehavior: boolean;
  significantRoutineDeviation: boolean;
  psychoticSymptomsOrSevereImpairment: boolean;
}

export function evaluateMultiSignalBipolarPrecautions(input: MultiSignalBipolarCheckInput): {
  usesSingleSleepThresholdAsManiaDetector: false;
  activeSignalCount: number;
  signalsTriggered: string[];
  promptHumanClinicalContactRecommended: boolean;
  restrictHighEnergyActivationAndIntensiveExercises: boolean;
  recommendedPathwayState: PathwayWorkflowState;
  guidanceVi: string;
  guidanceEn: string;
} {
  const signals: string[] = [];
  if (input.reducedNeedForSleepReported) signals.push('reduced_need_for_sleep');
  if (input.elevatedOrIrritableMoodReported) signals.push('elevated_or_irritable_mood');
  if (input.increasedEnergyOrGoalDirectedActivity) signals.push('increased_energy_or_goal_activity');
  if (input.unusualTalkativenessOrRacingThoughts) signals.push('talkativeness_or_racing_thoughts');
  if (input.increasedImpulsivityOrRiskyBehavior) signals.push('impulsivity_or_risky_behavior');
  if (input.significantRoutineDeviation) signals.push('significant_routine_deviation');
  if (input.psychoticSymptomsOrSevereImpairment) signals.push('psychotic_symptoms_or_severe_impairment');

  // §3.5 Rule: Do not use a single sleep threshold as a mania detector!
  // Require multi-signal convergence (>= 2 signals) or psychosis/severe impairment.
  const promptHumanClinicalContactRecommended =
    input.psychoticSymptomsOrSevereImpairment || signals.length >= 2;

  const recommendedPathwayState: PathwayWorkflowState = input.psychoticSymptomsOrSevereImpairment
    ? 'emergency_guidance'
    : promptHumanClinicalContactRecommended
      ? 'urgent_human_support'
      : signals.length === 1
        ? 'professional_follow_up_recommended'
        : 'routine_support';

  return {
    usesSingleSleepThresholdAsManiaDetector: false,
    activeSignalCount: signals.length,
    signalsTriggered: signals,
    promptHumanClinicalContactRecommended,
    restrictHighEnergyActivationAndIntensiveExercises: promptHumanClinicalContactRecommended,
    recommendedPathwayState,
    guidanceVi: promptHumanClinicalContactRecommended
      ? 'Hệ thống ghi nhận tổ hợp nhiều dấu hiệu thay đổi về nhu cầu ngủ, năng lượng và khí sắc so với nền cá nhân. Ứng dụng tạm khóa các bài tập kích hoạt năng lượng cao và khuyến nghị bạn liên hệ sớm với bác sĩ điều trị (không tự điều chỉnh thuốc).'
      : 'Chưa ghi nhận tổ hợp đa tín hiệu cảnh báo chuyển pha. Lưu ý: thời lượng ngủ đơn lẻ không bao giờ được dùng để tự chẩn đoán hưng cảm.',
    guidanceEn: promptHumanClinicalContactRecommended
      ? 'Multiple converging changes in sleep need, energy, and mood relative to personal baseline were reported. High-energy activation exercises are paused and prompt contact with your clinician is recommended.'
      : 'No multi-signal mood-episode escalation triggered. Sleep duration alone is never used as a standalone mania detector.',
  };
}

/**
 * §4.7 Granular Caregiver Consent & Access Grant Engine
 */
export interface CaregiverAccessGrantRecord {
  grantId: string;
  patientUserId: string;
  caregiverUserId: string;
  patientInvitedCaregiver: boolean;
  permissions: {
    viewEarlyWarningPlan: boolean;
    viewSharedFftEducation: boolean;
    viewRhythmSummary: boolean;
    viewPrivateJournalEntries: boolean;
    viewTherapySessionContent: boolean;
    viewAssessmentAnswers: boolean;
    editClinicalRecordsOrImpersonatePatient: false;
  };
  revoked: boolean;
  createdAt: string;
  revokedAt?: string;
  auditTrail: Array<{ action: string; timestamp: string; actorId: string }>;
}

export function createGranularCaregiverAccessGrant(input: {
  grantId: string;
  patientUserId: string;
  caregiverUserId: string;
  patientInvitedCaregiver: boolean;
  explicitOverrides?: Partial<{
    viewEarlyWarningPlan: boolean;
    viewSharedFftEducation: boolean;
    viewRhythmSummary: boolean;
    viewPrivateJournalEntries: boolean;
    viewTherapySessionContent: boolean;
    viewAssessmentAnswers: boolean;
  }>;
}): ValidationResult<CaregiverAccessGrantRecord> {
  if (!input.patientInvitedCaregiver) {
    return {
      valid: false,
      errors: ['§4.7 Violation: Patient must explicitly control and initiate any caregiver invitation.'],
    };
  }
  const now = new Date().toISOString();
  return {
    valid: true,
    errors: [],
    data: {
      grantId: input.grantId,
      patientUserId: input.patientUserId,
      caregiverUserId: input.caregiverUserId,
      patientInvitedCaregiver: true,
      permissions: {
        viewEarlyWarningPlan: input.explicitOverrides?.viewEarlyWarningPlan ?? true,
        viewSharedFftEducation: input.explicitOverrides?.viewSharedFftEducation ?? true,
        viewRhythmSummary: input.explicitOverrides?.viewRhythmSummary ?? false,
        // §4.7 Rule: Do NOT expose private journal entries, therapy-session content, or assessment answers by default!
        viewPrivateJournalEntries: input.explicitOverrides?.viewPrivateJournalEntries ?? false,
        viewTherapySessionContent: input.explicitOverrides?.viewTherapySessionContent ?? false,
        viewAssessmentAnswers: input.explicitOverrides?.viewAssessmentAnswers ?? false,
        editClinicalRecordsOrImpersonatePatient: false,
      },
      revoked: false,
      createdAt: now,
      auditTrail: [{ action: 'grant_created_by_patient', timestamp: now, actorId: input.patientUserId }],
    },
  };
}

export function revokeCaregiverAccessGrant(
  grant: CaregiverAccessGrantRecord,
  patientUserId: string,
): CaregiverAccessGrantRecord {
  const now = new Date().toISOString();
  return {
    ...grant,
    revoked: true,
    revokedAt: now,
    permissions: {
      viewEarlyWarningPlan: false,
      viewSharedFftEducation: false,
      viewRhythmSummary: false,
      viewPrivateJournalEntries: false,
      viewTherapySessionContent: false,
      viewAssessmentAnswers: false,
      editClinicalRecordsOrImpersonatePatient: false,
    },
    auditTrail: [
      ...grant.auditTrail,
      { action: 'grant_revoked_by_patient', timestamp: now, actorId: patientUserId },
    ],
  };
}

// =============================================================================
// 7. USER-CONTROLLED CLINICAL REPORT PREVIEW & REDACTION (§10.3)
// =============================================================================

export interface RedactedClinicalReportPreview {
  generatedByExplicitUserRequest: true;
  containsAutomatedDiagnosisOrRiskLabels: false;
  redactionOptionsApplied: {
    redactPrivateJournals: boolean;
    redactSessionTranscripts: boolean;
    redactRawAssessmentItems: boolean;
    redactMedicationNotes: boolean;
  };
  selfReportedMoodSummary?: string;
  clinicianEnteredNotesSummary?: string;
  privateJournalsDisplayed: string[];
  assessmentsDisplayed: Array<{
    instrumentCode: string;
    version: string;
    date: string;
    totalScore: number;
    provenance: 'questionnaire';
    limitationVi: string;
    rawItemsIncluded: boolean;
  }>;
  disclaimerVi: string;
  disclaimerEn: string;
}

export function buildUserControlledReportWithRedaction(input: {
  explicitUserRequestConfirmed: boolean;
  redactPrivateJournals?: boolean;
  redactSessionTranscripts?: boolean;
  redactRawAssessmentItems?: boolean;
  redactMedicationNotes?: boolean;
  selfReportedMoodSummary: string;
  clinicianEnteredNotesSummary?: string;
  privateJournals: string[];
  assessments: Array<{
    instrumentCode: InstrumentGovernanceRecord['instrumentCode'];
    date: string;
    totalScore: number;
  }>;
}): ValidationResult<RedactedClinicalReportPreview> {
  if (!input.explicitUserRequestConfirmed) {
    return {
      valid: false,
      errors: ['§10.3 Violation: Reports may only be generated at the user’s explicit request and consent.'],
    };
  }
  const redactJournals = input.redactPrivateJournals ?? true;
  const redactSessions = input.redactSessionTranscripts ?? true;
  const redactItems = input.redactRawAssessmentItems ?? true;
  const redactMeds = input.redactMedicationNotes ?? false;

  return {
    valid: true,
    errors: [],
    data: {
      generatedByExplicitUserRequest: true,
      containsAutomatedDiagnosisOrRiskLabels: false,
      redactionOptionsApplied: {
        redactPrivateJournals: redactJournals,
        redactSessionTranscripts: redactSessions,
        redactRawAssessmentItems: redactItems,
        redactMedicationNotes: redactMeds,
      },
      selfReportedMoodSummary: `[Dữ liệu Người dùng Tự báo cáo / Self-Reported]: ${input.selfReportedMoodSummary}`,
      clinicianEnteredNotesSummary: input.clinicianEnteredNotesSummary
        ? `[Dữ liệu Chuyên gia Nhập / Clinician-Entered]: ${input.clinicianEnteredNotesSummary}`
        : undefined,
      privateJournalsDisplayed: redactJournals ? ['[ĐÃ ẨN THEO LỰA CHỌN NGƯỜI DÙNG / REDACTED BY USER]'] : input.privateJournals,
      assessmentsDisplayed: input.assessments.map((a) => {
        const gov = INSTRUMENT_GOVERNANCE_REGISTRY[a.instrumentCode];
        return {
          instrumentCode: a.instrumentCode,
          version: gov.version,
          date: a.date,
          totalScore: a.totalScore,
          provenance: 'questionnaire',
          limitationVi: gov.keyLimitationVi,
          rawItemsIncluded: !redactItems,
        };
      }),
      disclaimerVi:
        'Báo cáo này do người dùng chủ động trích xuất và kiểm duyệt nội dung trước khi chia sẻ. Toàn bộ điểm số là dữ liệu tự theo dõi, không chứa chẩn đoán tự động hay phân loại rủi ro lâm sàng.',
      disclaimerEn:
        'This report was generated and redacted under explicit user control. All scores reflect self-reported monitoring and contain no automated diagnoses or clinical risk labels.',
    },
  };
}
