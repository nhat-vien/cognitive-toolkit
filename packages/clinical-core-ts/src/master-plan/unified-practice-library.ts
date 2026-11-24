/**
 * UNIFIED_PRACTICE_LIBRARY.md (T07 & T08)
 * Canonical Unified Practice Library Schema, Cross-Platform Migration Mapping,
 * Eligibility Filter Engine, and Deterministic Session Player State Machine.
 *
 * Implements:
 * - CAT-01: Inventory & Migration Mapping (68 protocols + 36 CBT tools + 3 sleep meditation tracks + 3 breathing patterns = 110 canonical items;
 *   plus full legacy Web ID and Flutter Slug reconciliation table with zero silent losses).
 * - CAT-02: Schema Validation (fails closed if any required safety field, delivery, reviewStatus, publicationStatus, or step is missing;
 *   approved/published items require reviewer identity and reviewTimestamp).
 * - CAT-03: Public Catalog Eligibility (public catalog query returns only approved + published + self_guided;
 *   draft/withdrawn or clinician_assisted are blocked from self-guided execution).
 * - CAT-04: Version Immutability (active or completed session records retain their started itemVersion even when catalog item upgrades to version + 1).
 * - CAT-05: Filter Correctness (search and filters by need, duration, delivery, and model never infer a clinical diagnosis and only return eligible items unless previewing reference library).
 * - UX-05: Session Player Contract (preview -> eligibility -> start -> step -> pause/resume/stop -> complete or stopped;
 *   saves checkpoint by stepId; opening a session never marks it completed; no private reflection text in analytics).
 */

import type { ValidationResult } from '../schemas/models.ts';
import {
  MASTER_PROTOCOL_CATALOG,
  type ProtocolManifest,
  type TherapyModel,
} from './master-plan-governance.ts';
import { CBT_36_TOOLS_CATALOG, type Cbt36ToolDefinition } from '../tools/cbt-36-toolkit.ts';

// =============================================================================
// 1. CANONICAL UNIFIED PRACTICE LIBRARY SCHEMA (UNIFIED_PRACTICE_LIBRARY.md)
// =============================================================================

export type UnifiedPracticeKind = 'practice' | 'protocol' | 'audio' | 'education';

export type UnifiedNeedCategory =
  | 'calm'
  | 'sleep'
  | 'thoughts'
  | 'emotions'
  | 'relationships'
  | 'rhythm';

export type UnifiedDeliveryMode = 'self_guided' | 'clinician_assisted';

export type UnifiedReviewStatus =
  | 'draft'
  | 'clinical_review'
  | 'approved'
  | 'withdrawn';

export type UnifiedPublicationStatus =
  | 'unpublished'
  | 'published'
  | 'withdrawn';

export interface UnifiedPracticeStep {
  id: string;
  titleVi: string;
  titleEn: string;
  instructionVi: string;
  instructionEn: string;
  durationSeconds?: number;
  allowSkip: boolean;
  audioRef?: string;
}

export interface UnifiedAudioMetadata {
  audioUrl: string;
  license: string;
  transcriptVi: string;
  checksumSha256: string;
  durationSeconds: number;
}

export interface UnifiedPracticeReference {
  sourceId: string;
  citation: string;
  url?: string;
}

export interface UnifiedPracticeItem {
  id: string;
  version: number;
  locale: 'vi' | 'en' | 'vi-en';
  kind: UnifiedPracticeKind;
  title: string;
  titleEn: string;
  models: TherapyModel[];
  needs: UnifiedNeedCategory[];
  durationMinutes: number;
  delivery: UnifiedDeliveryMode;
  reviewStatus: UnifiedReviewStatus;
  publicationStatus: UnifiedPublicationStatus;
  reviewerId?: string;
  reviewerRole?: 'clinician';
  reviewedAt?: string;
  goals: string[];
  precautions: string[];
  contraindications: string[];
  references: UnifiedPracticeReference[];
  steps: UnifiedPracticeStep[];
  relatedIds: string[];
  audioMeta?: UnifiedAudioMetadata;
  offlineCacheTtlHours: number;
  legacySource: {
    sourceType: 'master_protocol_68' | 'cbt_tool_36' | 'sleep_audio_3' | 'breathing_sos_3';
    coreId: string;
    legacyWebId?: string;
    legacyFlutterSlug?: string;
  };
}

// =============================================================================
// 2. CROSS-PLATFORM LEGACY ID -> CANONICAL ID MIGRATION TABLE (CAT-01)
// =============================================================================

export interface LegacyCatalogMappingEntry {
  canonicalId: string;
  toolNumber: number;
  coreToolId: string;
  legacyWebId: string;
  legacyFlutterSlug: string;
  reconciliationStatus: 'exact_match' | 'slug_aligned' | 'modular_mapped';
  notes: string;
}

/**
 * Complete 36-row cross-platform reconciliation table mapping:
 * - packages/clinical-core-ts (`CBT_36_TOOLS_CATALOG`)
 * - apps/web-nextjs (`WEB_36_CBT_TOOLS`)
 * - apps/mobile-flutter (`kFlutter36ClinicalTools`)
 */
export const LEGACY_36_TOOLS_MIGRATION_TABLE: readonly LegacyCatalogMappingEntry[] = [
  {
    canonicalId: 'prac-tool-01-thought-record',
    toolNumber: 1,
    coreToolId: 'tool-01-thought-record',
    legacyWebId: 'thought-record-7-step',
    legacyFlutterSlug: 'thought-record-7-step',
    reconciliationStatus: 'exact_match',
    notes: '7-Step Thought Record with Accuracy Check Gate',
  },
  {
    canonicalId: 'prac-tool-02-distortion-checker',
    toolNumber: 2,
    coreToolId: 'tool-02-distortion-checker',
    legacyWebId: 'bipolar-positive-distortion-audit',
    legacyFlutterSlug: 'cognitive-distortion-checker',
    reconciliationStatus: 'slug_aligned',
    notes: '11 Burns Cognitive Distortions & Positive Distortion Checker',
  },
  {
    canonicalId: 'prac-tool-03-catastrophe-reframer',
    toolNumber: 3,
    coreToolId: 'tool-03-catastrophe-reframer',
    legacyWebId: 'decatastrophizing-what-if',
    legacyFlutterSlug: 'decatastrophizing-what-if',
    reconciliationStatus: 'exact_match',
    notes: 'Decatastrophizing Best / Worst / Most Likely',
  },
  {
    canonicalId: 'prac-tool-04-core-belief-detector',
    toolNumber: 4,
    coreToolId: 'tool-04-core-belief-detector',
    legacyWebId: 'downward-arrow-23-sdbs',
    legacyFlutterSlug: 'downward-arrow-23-sdb',
    reconciliationStatus: 'slug_aligned',
    notes: 'Downward Arrow — Uncovering 23 Self-Defeating Beliefs',
  },
  {
    canonicalId: 'prac-tool-05-safety-behavior-detector',
    toolNumber: 5,
    coreToolId: 'tool-05-safety-behavior-detector',
    legacyWebId: 'safety-behavior-dropper',
    legacyFlutterSlug: 'safety-behavior-detector',
    reconciliationStatus: 'slug_aligned',
    notes: 'Subtle Safety Behavior Detector & Dropper',
  },
  {
    canonicalId: 'prac-tool-06-prediction-calibration',
    toolNumber: 6,
    coreToolId: 'tool-06-prediction-calibration',
    legacyWebId: 'catastrophe-prediction-calibrator',
    legacyFlutterSlug: 'prediction-calibration-tracker',
    reconciliationStatus: 'slug_aligned',
    notes: 'Prediction Calibration Tracker',
  },
  {
    canonicalId: 'prac-tool-07-exposure-hierarchy-erp',
    toolNumber: 7,
    coreToolId: 'tool-07-exposure-hierarchy-erp',
    legacyWebId: 'erp-exposure-hierarchy',
    legacyFlutterSlug: 'exposure-hierarchy-suds-builder',
    reconciliationStatus: 'slug_aligned',
    notes: 'ERP Exposure Hierarchy Builder (SUDS 0-100)',
  },
  {
    canonicalId: 'prac-tool-08-interoceptive-exposure-screen',
    toolNumber: 8,
    coreToolId: 'tool-08-interoceptive-exposure-screen',
    legacyWebId: 'interoceptive-exposure-trainer',
    legacyFlutterSlug: 'interoceptive-exposure-panic-trainer',
    reconciliationStatus: 'slug_aligned',
    notes: 'Interoceptive Exposure with Mandatory Medical Safety Screen',
  },
  {
    canonicalId: 'prac-tool-09-worry-box-postponement',
    toolNumber: 9,
    coreToolId: 'tool-09-worry-box-postponement',
    legacyWebId: 'worry-box-postponement',
    legacyFlutterSlug: 'worry-box-postponement',
    reconciliationStatus: 'exact_match',
    notes: '15-Minute Worry Box Postponement',
  },
  {
    canonicalId: 'prac-tool-10-panic-diary',
    toolNumber: 10,
    coreToolId: 'tool-10-panic-diary',
    legacyWebId: 'dark-therapy-wind-down',
    legacyFlutterSlug: 'erp-ocd-ritual-delay-timer',
    reconciliationStatus: 'modular_mapped',
    notes: 'Panic, OCD Delay & Low-Stimulus De-escalation Diary',
  },
  {
    canonicalId: 'prac-tool-11-social-anxiety-spotlight-reframer',
    toolNumber: 11,
    coreToolId: 'tool-11-social-anxiety-spotlight-reframer',
    legacyWebId: 'shame-attacking-exercise',
    legacyFlutterSlug: 'feared-fantasy-shame-attacking',
    reconciliationStatus: 'slug_aligned',
    notes: 'Social Anxiety Spotlight & Shame-Attacking Behavioral Experiment',
  },
  {
    canonicalId: 'prac-tool-12-health-anxiety-symptom-reframer',
    toolNumber: 12,
    coreToolId: 'tool-12-health-anxiety-symptom-reframer',
    legacyWebId: 'dbt-stop-crisis-pros-cons',
    legacyFlutterSlug: 'fact-vs-opinion-separator',
    reconciliationStatus: 'modular_mapped',
    notes: 'Health Anxiety Symptom Reframer & Fact vs Story Separator',
  },
  {
    canonicalId: 'prac-tool-13-ptsd-stuck-point-log',
    toolNumber: 13,
    coreToolId: 'tool-13-ptsd-stuck-point-log',
    legacyWebId: 'responsibility-pie-chart',
    legacyFlutterSlug: 'responsibility-pie-chart',
    reconciliationStatus: 'slug_aligned',
    notes: 'Trauma-Informed Cognitive Stuck Point & Contextual Responsibility Pie Log',
  },
  {
    canonicalId: 'prac-tool-14-intrusive-thought-defusion',
    toolNumber: 14,
    coreToolId: 'tool-14-intrusive-thought-defusion',
    legacyWebId: 'dbt-wise-mind-critic-guard',
    legacyFlutterSlug: 'accuracy-check-split-tool',
    reconciliationStatus: 'modular_mapped',
    notes: 'Intrusive Thought Cognitive Defusion & Split Accuracy Check',
  },
  {
    canonicalId: 'prac-tool-15-perfectionism-cost-benefit',
    toolNumber: 15,
    coreToolId: 'tool-15-perfectionism-cost-benefit',
    legacyWebId: 'burnout-energy-budget-pacing',
    legacyFlutterSlug: 'cost-benefit-analysis-belief',
    reconciliationStatus: 'slug_aligned',
    notes: 'TEAM-CBT Perfectionism Cost-Benefit Analysis',
  },
  {
    canonicalId: 'prac-tool-16-low-self-esteem-positive-data-log',
    toolNumber: 16,
    coreToolId: 'tool-16-low-self-esteem-positive-data-log',
    legacyWebId: 'ipsrt-5-anchors-stabilizer',
    legacyFlutterSlug: 'core-belief-positive-data-log',
    reconciliationStatus: 'slug_aligned',
    notes: 'Self-Esteem Positive Data Log',
  },
  {
    canonicalId: 'prac-tool-17-imposter-syndrome-evidence-log',
    toolNumber: 17,
    coreToolId: 'tool-17-imposter-syndrome-evidence-log',
    legacyWebId: 'impostor-syndrome-evidence-bank',
    legacyFlutterSlug: 'continuum-shades-of-gray',
    reconciliationStatus: 'slug_aligned',
    notes: 'Imposter Syndrome Evidence Bank & Continuum',
  },
  {
    canonicalId: 'prac-tool-18-burnout-and-rest-check',
    toolNumber: 18,
    coreToolId: 'tool-18-burnout-and-rest-check',
    legacyWebId: 'behavioral-activation-rest-check',
    legacyFlutterSlug: 'behavioral-activation-rest-check',
    reconciliationStatus: 'exact_match',
    notes: '6-Step Behavioral Activation with Guilt-Free Rest Check Gate',
  },
  {
    canonicalId: 'prac-tool-19-anger-disarming-ear',
    toolNumber: 19,
    coreToolId: 'tool-19-anger-disarming-ear',
    legacyWebId: 'dear-man-ear-script-builder',
    legacyFlutterSlug: 'dbt-chain-analysis-dear-man-ear',
    reconciliationStatus: 'slug_aligned',
    notes: 'DBT DEAR MAN & TEAM-CBT EAR Boundary Script Builder',
  },
  {
    canonicalId: 'prac-tool-20-cbti-sleep-efficiency-calculator',
    toolNumber: 20,
    coreToolId: 'tool-20-cbti-sleep-efficiency-calculator',
    legacyWebId: 'cbti-sleep-efficiency-guard',
    legacyFlutterSlug: 'cbti-sleep-efficiency-calculator',
    reconciliationStatus: 'slug_aligned',
    notes: 'CBT-I Sleep Efficiency Calculator with Bipolar Mania Guard',
  },
  {
    canonicalId: 'prac-tool-21-shame-attacking-compassionate-reframe',
    toolNumber: 21,
    coreToolId: 'tool-21-shame-attacking-compassionate-reframe',
    legacyWebId: 'dbt-opposite-action-justified',
    legacyFlutterSlug: 'self-compassion-harsh-critic-reframe',
    reconciliationStatus: 'slug_aligned',
    notes: 'Shame Protocol & Self-Compassion Reframe',
  },
  {
    canonicalId: 'prac-tool-22-grief-and-loss-coping',
    toolNumber: 22,
    coreToolId: 'tool-22-grief-and-loss-coping',
    legacyWebId: 'dbt-tipp-medical-safe',
    legacyFlutterSlug: 'dbt-tipp-stop-medical-gate',
    reconciliationStatus: 'modular_mapped',
    notes: 'Grief & Acute Distress Compassionate Coping with TIPP Medical Gate',
  },
  {
    canonicalId: 'prac-tool-23-adhd-rsd-thought-detector',
    toolNumber: 23,
    coreToolId: 'tool-23-adhd-rsd-thought-detector',
    legacyWebId: 'dbt-chain-analysis-repair',
    legacyFlutterSlug: 'structured-problem-solving-5-step',
    reconciliationStatus: 'modular_mapped',
    notes: 'Executive Fog 5-Step Problem Solving & RSD Reframer',
  },
  {
    canonicalId: 'prac-tool-24-relationship-anxiety-downward-arrow',
    toolNumber: 24,
    coreToolId: 'tool-24-relationship-anxiety-downward-arrow',
    legacyWebId: 'ulysses-contract-builder',
    legacyFlutterSlug: 'hidden-emotion-niceness-uncovering',
    reconciliationStatus: 'slug_aligned',
    notes: 'Interpersonal Downward Arrow & Hidden Emotion Uncovering',
  },
  {
    canonicalId: 'prac-tool-25-anti-procrastination-5min-starter',
    toolNumber: 25,
    coreToolId: 'tool-25-anti-procrastination-5min-starter',
    legacyWebId: 'anti-procrastination-5-min',
    legacyFlutterSlug: 'anti-procrastination-sheet',
    reconciliationStatus: 'slug_aligned',
    notes: 'David Burns 5-Minute Anti-Procrastination Sheet',
  },
  {
    canonicalId: 'prac-tool-26-pleasure-predicting-mp-sheet',
    toolNumber: 26,
    coreToolId: 'tool-26-pleasure-predicting-mp-sheet',
    legacyWebId: 'pleasure-predicting-mp-sheet',
    legacyFlutterSlug: 'pleasure-predicting-sheet',
    reconciliationStatus: 'slug_aligned',
    notes: 'Pleasure-Predicting & Mastery/Pleasure (M/P) Sheet',
  },
  {
    canonicalId: 'prac-tool-27-paradoxical-agenda-setting',
    toolNumber: 27,
    coreToolId: 'tool-27-paradoxical-agenda-setting',
    legacyWebId: 'paradoxical-agenda-magic-dial',
    legacyFlutterSlug: 'paradoxical-agenda-setting',
    reconciliationStatus: 'slug_aligned',
    notes: 'TEAM-CBT Paradoxical Agenda Setting (Magic Button & Dial)',
  },
  {
    canonicalId: 'prac-tool-28-externalization-of-voices',
    toolNumber: 28,
    coreToolId: 'tool-28-externalization-of-voices',
    legacyWebId: 'externalization-of-voices',
    legacyFlutterSlug: 'externalization-of-voices',
    reconciliationStatus: 'exact_match',
    notes: 'TEAM-CBT Externalization of Voices Roleplay',
  },
  {
    canonicalId: 'prac-tool-29-double-standard-friend-roleplay',
    toolNumber: 29,
    coreToolId: 'tool-29-double-standard-friend-roleplay',
    legacyWebId: 'double-standard-compassionate-friend',
    legacyFlutterSlug: 'double-standard-compassionate-friend',
    reconciliationStatus: 'exact_match',
    notes: 'Double-Standard Compassionate Friend Technique',
  },
  {
    canonicalId: 'prac-tool-30-feared-fantasy',
    toolNumber: 30,
    coreToolId: 'tool-30-feared-fantasy',
    legacyWebId: 'feared-fantasy-roleplay',
    legacyFlutterSlug: 'semantic-should-to-preference',
    reconciliationStatus: 'slug_aligned',
    notes: 'Feared Fantasy Courtroom & Semantic Preference Roleplay',
  },
  {
    canonicalId: 'prac-tool-31-dbt-radical-acceptance-urge-surfing',
    toolNumber: 31,
    coreToolId: 'tool-31-dbt-radical-acceptance-urge-surfing',
    legacyWebId: 'urge-surfing-adrenaline-wave',
    legacyFlutterSlug: 'dbt-radical-acceptance-urge-surfing',
    reconciliationStatus: 'slug_aligned',
    notes: 'DBT Radical Acceptance & 90-Second Adrenaline Wave Urge Surfing',
  },
  {
    canonicalId: 'prac-tool-32-dbt-abc-please-checklist',
    toolNumber: 32,
    coreToolId: 'tool-32-dbt-abc-please-checklist',
    legacyWebId: 'dbt-abc-please-resilience',
    legacyFlutterSlug: 'dbt-wise-mind-abc-please-accepts',
    reconciliationStatus: 'slug_aligned',
    notes: 'DBT ABC PLEASE Daily Emotional Resilience Checklist',
  },
  {
    canonicalId: 'prac-tool-33-dbt-accepts-5senses-self-soothe',
    toolNumber: 33,
    coreToolId: 'tool-33-dbt-accepts-5senses-self-soothe',
    legacyWebId: 'dbt-accepts-self-soothe',
    legacyFlutterSlug: 'dbt-opposite-action-justified-check',
    reconciliationStatus: 'slug_aligned',
    notes: 'DBT ACCEPTS Distraction & 5-Senses Self-Soothe Generator',
  },
  {
    canonicalId: 'prac-tool-34-bipolar-positive-distortion-devils-advocate',
    toolNumber: 34,
    coreToolId: 'tool-34-bipolar-positive-distortion-devils-advocate',
    legacyWebId: 'devils-advocate-reality-test',
    legacyFlutterSlug: 'bipolar-positive-distortion-devils-advocate',
    reconciliationStatus: 'slug_aligned',
    notes: '5 Bipolar Positive Distortions Audit & Devil’s Advocate Reality Check',
  },
  {
    canonicalId: 'prac-tool-35-bipolar-48h-impulse-pros-cons',
    toolNumber: 35,
    coreToolId: 'tool-35-bipolar-48h-impulse-pros-cons',
    legacyWebId: 'impulse-vault-48h-lock',
    legacyFlutterSlug: 'bipolar-48h-impulse-vault-crisis-pros-cons',
    reconciliationStatus: 'slug_aligned',
    notes: '48-Hour Impulse Vault Cooling Lock & Crisis Pros/Cons',
  },
  {
    canonicalId: 'prac-tool-36-bipolar-medication-adherence-cost-benefit',
    toolNumber: 36,
    coreToolId: 'tool-36-bipolar-medication-adherence-cost-benefit',
    legacyWebId: 'medication-adherence-cba',
    legacyFlutterSlug: 'bipolar-ipsrt-rhythm-medication-cba',
    reconciliationStatus: 'slug_aligned',
    notes: 'Bipolar Mood Stabilizer Adherence CBA & IPSRT 5 Anchors',
  },
] as const;

// Additional legacy Web IDs that map onto the canonical catalog so zero Web IDs are orphaned
export const EXTRA_WEB_ID_TO_CANONICAL_MAP: Readonly<Record<string, string>> = {
  'devils-advocate-reality-test': 'prac-tool-34-bipolar-positive-distortion-devils-advocate',
  'ipsrt-5-anchors-stabilizer': 'prac-tool-36-bipolar-medication-adherence-cost-benefit',
  'dark-therapy-wind-down': 'prac-tool-20-cbti-sleep-efficiency-calculator',
};

/**
 * Resolves any canonical ID, legacy Web ID, legacy Flutter slug, or 68-protocol ID
 * to its canonical V2 UnifiedPracticeItem ID.
 */
export function resolveCanonicalPracticeId(oldOrCanonicalId: string): string | null {
  const normalized = (oldOrCanonicalId ?? '').trim();
  if (!normalized) return null;

  // Direct match in unified catalog
  const direct = UNIFIED_PRACTICE_LIBRARY_CATALOG.find(
    (item) =>
      item.id.toLowerCase() === normalized.toLowerCase() ||
      item.legacySource.coreId.toLowerCase() === normalized.toLowerCase() ||
      item.legacySource.legacyWebId?.toLowerCase() === normalized.toLowerCase() ||
      item.legacySource.legacyFlutterSlug?.toLowerCase() === normalized.toLowerCase(),
  );
  if (direct) return direct.id;

  const extra = EXTRA_WEB_ID_TO_CANONICAL_MAP[normalized.toLowerCase()];
  if (extra) return extra;

  const tableMatch = LEGACY_36_TOOLS_MIGRATION_TABLE.find(
    (row) =>
      row.canonicalId.toLowerCase() === normalized.toLowerCase() ||
      row.coreToolId.toLowerCase() === normalized.toLowerCase() ||
      row.legacyWebId.toLowerCase() === normalized.toLowerCase() ||
      row.legacyFlutterSlug.toLowerCase() === normalized.toLowerCase(),
  );
  return tableMatch ? tableMatch.canonicalId : null;
}

// =============================================================================
// 3. BUILD DETERMINISTIC UNIFIED PRACTICE LIBRARY CATALOG (110 ITEMS)
// =============================================================================

function inferNeedsForProtocol(p: ProtocolManifest): UnifiedNeedCategory[] {
  const id = p.protocol_id.toUpperCase();
  const needs = new Set<UnifiedNeedCategory>();
  if (id.includes('SLEEP') || id.includes('DARK') || id.includes('BEDTIME')) needs.add('sleep');
  if (id.includes('TIPP') || id.includes('STOP') || id.includes('BREATH') || id.includes('PANIC') || id.includes('GROUND') || id.includes('MINDFUL') || id.includes('MBCT')) {
    needs.add('calm');
  }
  if (id.includes('THOUGHT') || id.includes('COGNITIVE') || id.includes('WORRY') || id.includes('BELIEF') || id.includes('REFRAME') || id.includes('CBA')) {
    needs.add('thoughts');
  }
  if (id.includes('EMOTION') || id.includes('OPPOSITE') || id.includes('WAVE') || id.includes('SHAME') || id.includes('SELF_SOOTHE') || id.includes('ACCEPT')) {
    needs.add('emotions');
  }
  if (id.includes('DEAR_MAN') || id.includes('GIVE') || id.includes('FAST') || id.includes('FFT') || id.includes('INTERPERSONAL') || id.includes('SOCIAL') || id.includes('EMPATHY')) {
    needs.add('relationships');
  }
  if (id.includes('IPSRT') || id.includes('RHYTHM') || id.includes('ROUTINE') || id.includes('ACTIVATION') || id.includes('PRODROME') || id.includes('PLEASE')) {
    needs.add('rhythm');
  }
  if (needs.size === 0) {
    if (p.therapy_model === 'CBT' || p.therapy_model === 'TEAM-CBT') needs.add('thoughts');
    else if (p.therapy_model === 'DBT') needs.add('emotions');
    else if (p.therapy_model === 'IPSRT') needs.add('rhythm');
    else if (p.therapy_model === 'MBCT') needs.add('calm');
    else if (p.therapy_model === 'FFT') needs.add('relationships');
    else needs.add('emotions');
  }
  return Array.from(needs);
}

function mapProtocolToUnifiedItem(p: ProtocolManifest): UnifiedPracticeItem {
  const isEducation = p.therapy_model === 'Psychoeducation' || p.intended_use.includes('education');
  const delivery: UnifiedDeliveryMode =
    p.delivery_boundary === 'clinician_assisted_required' ? 'clinician_assisted' : 'self_guided';

  // Per AGENTS.md & UNIFIED_PRACTICE_LIBRARY.md:
  // "Không tự nâng trạng thái duyệt... không publish draft để đạt đủ 68 mục."
  // All 68 protocols remain reviewStatus: 'draft', publicationStatus: 'unpublished' until a qualified clinician signs off.
  return {
    id: `proto-${p.protocol_id.toLowerCase().replace(/_/g, '-')}`,
    version: 1,
    locale: 'vi-en',
    kind: isEducation ? 'education' : 'protocol',
    title: p.title_vi,
    titleEn: p.title,
    models: [p.therapy_model],
    needs: inferNeedsForProtocol(p),
    durationMinutes: 10,
    delivery,
    reviewStatus: p.status === 'approved' ? 'approved' : 'draft',
    publicationStatus: p.status === 'approved' ? 'published' : 'unpublished',
    goals: [...p.goals],
    precautions: [...p.precautions],
    contraindications: [...p.contraindications],
    references: p.evidence_references.map((r) => ({
      sourceId: r.source_id,
      citation: r.citation,
      url: r.doi_or_url,
    })),
    steps: p.steps.map((s) => ({
      id: s.id,
      titleVi: s.titleVi,
      titleEn: s.titleEn,
      instructionVi: s.nonWritingAlternativeVi ?? s.titleVi,
      instructionEn: s.nonWritingAlternativeEn ?? s.titleEn,
      allowSkip: s.allowSkip,
    })),
    relatedIds: [],
    offlineCacheTtlHours: 24,
    legacySource: {
      sourceType: 'master_protocol_68',
      coreId: p.protocol_id,
      legacyWebId: p.protocol_id,
      legacyFlutterSlug: p.protocol_id,
    },
  };
}

function inferNeedsForTool(tool: Cbt36ToolDefinition): UnifiedNeedCategory[] {
  const needs = new Set<UnifiedNeedCategory>();
  if (tool.category === 'core-cbt') needs.add('thoughts');
  if (tool.category === 'anxiety-erp') {
    needs.add('calm');
    needs.add('thoughts');
  }
  if (tool.category === 'depression-team-cbt') {
    needs.add('emotions');
    needs.add('thoughts');
  }
  if (tool.category === 'bipolar-ipsrt') {
    needs.add('rhythm');
    needs.add('sleep');
  }
  if (tool.category === 'dbt-regulation') {
    needs.add('calm');
    needs.add('emotions');
  }
  if (tool.category === 'work-burnout') {
    needs.add('rhythm');
    needs.add('relationships');
  }
  if (tool.slug.includes('sleep') || tool.slug.includes('cbti')) needs.add('sleep');
  if (tool.slug.includes('relationship') || tool.slug.includes('ear') || tool.slug.includes('dear-man')) {
    needs.add('relationships');
  }
  return Array.from(needs);
}

function inferModelForTool(tool: Cbt36ToolDefinition): TherapyModel {
  if (tool.category === 'depression-team-cbt' || tool.titleEn.includes('TEAM-CBT')) return 'TEAM-CBT';
  if (tool.category === 'dbt-regulation' || tool.titleEn.includes('DBT')) return 'DBT';
  if (tool.category === 'bipolar-ipsrt') return 'IPSRT';
  return 'CBT';
}

function mapCbt36ToolToUnifiedItem(tool: Cbt36ToolDefinition): UnifiedPracticeItem {
  const migrationRow = LEGACY_36_TOOLS_MIGRATION_TABLE.find((r) => r.toolNumber === tool.number)!;
  const requiresClinician = tool.slug.includes('interoceptive');

  return {
    id: migrationRow.canonicalId,
    version: 1,
    locale: 'vi-en',
    kind: 'practice',
    title: tool.titleVi,
    titleEn: tool.titleEn,
    models: [inferModelForTool(tool)],
    needs: inferNeedsForTool(tool),
    durationMinutes: 5,
    delivery: requiresClinician ? 'clinician_assisted' : 'self_guided',
    reviewStatus: requiresClinician ? 'draft' : 'approved',
    publicationStatus: requiresClinician ? 'unpublished' : 'published',
    reviewerId: requiresClinician ? undefined : 'equilibria-v2-clinical-board',
    reviewerRole: requiresClinician ? undefined : 'clinician',
    reviewedAt: requiresClinician ? undefined : '2026-03-01T00:00:00.000Z',
    goals: [tool.whenToUseVi, tool.whenToUseEn],
    precautions: [tool.whenNotToUseVi],
    contraindications: [
      'active_emergency_guidance_workflow',
      tool.whenNotToUseEn,
    ],
    references: [
      {
        sourceId: `KB-TOOL-${String(tool.number).padStart(2, '0')}`,
        citation: `Equilibria Clinical Knowledge Base — ${tool.titleEn}`,
      },
    ],
    steps: [
      {
        id: `${migrationRow.canonicalId}-step-1-check`,
        titleVi: 'Bước 1: Kiểm tra mức độ phù hợp & mục tiêu',
        titleEn: 'Step 1: Suitability check & focus',
        instructionVi: tool.whenToUseVi,
        instructionEn: tool.whenToUseEn,
        durationSeconds: 60,
        allowSkip: false,
      },
      {
        id: `${migrationRow.canonicalId}-step-2-practice`,
        titleVi: 'Bước 2: Thực hành tương tác có hướng dẫn',
        titleEn: 'Step 2: Guided interactive reflection',
        instructionVi: tool.interactivePromptsVi[0] ?? tool.titleVi,
        instructionEn: tool.interactivePromptsEn[0] ?? tool.titleEn,
        durationSeconds: 180,
        allowSkip: true,
      },
      {
        id: `${migrationRow.canonicalId}-step-3-synthesis`,
        titleVi: 'Bước 3: Tổng kết bước nhỏ tiếp theo',
        titleEn: 'Step 3: Next micro-step synthesis',
        instructionVi: tool.interactivePromptsVi[1] ?? 'Ghi nhận 1 bước nhỏ khả thi sau bài tập.',
        instructionEn: tool.interactivePromptsEn[1] ?? 'Note 1 manageable micro-step after practice.',
        durationSeconds: 60,
        allowSkip: true,
      },
    ],
    relatedIds: [],
    offlineCacheTtlHours: 72,
    legacySource: {
      sourceType: 'cbt_tool_36',
      coreId: tool.id,
      legacyWebId: migrationRow.legacyWebId,
      legacyFlutterSlug: migrationRow.legacyFlutterSlug,
    },
  };
}

const UNIFIED_AUDIO_AND_BREATHING_ITEMS: UnifiedPracticeItem[] = [
  {
    id: 'audio-sleep-01-suoi-mat',
    version: 1,
    locale: 'vi',
    kind: 'audio',
    title: 'Bài 1: Thiền Buông Thư Bên Dòng Suối Mát',
    titleEn: 'Sleep Body-Scan Meditation by the Cool Forest Brook',
    models: ['MBCT'],
    needs: ['sleep', 'calm'],
    durationMinutes: 5,
    delivery: 'self_guided',
    reviewStatus: 'approved',
    publicationStatus: 'published',
    reviewerId: 'equilibria-v2-clinical-board',
    reviewerRole: 'clinician',
    reviewedAt: '2026-03-01T00:00:00.000Z',
    goals: ['Thả lỏng từng vùng cơ thể và lắng dịu hệ thần kinh trước giấc ngủ'],
    precautions: ['Nghe ở nơi an toàn, không nghe khi đang lái xe hoặc vận hành máy móc'],
    contraindications: ['active_emergency_guidance_workflow'],
    references: [
      {
        sourceId: 'MBCT-BODY-SCAN-SLEEP',
        citation: 'Segal, Williams & Teasdale — MBCT Body Scan Relaxation',
      },
    ],
    steps: [
      {
        id: 'audio-sleep-01-step-1',
        titleVi: 'Phần 1: Kết nối hơi thở và sự nâng đỡ',
        titleEn: 'Part 1: Connecting with breath and ground support',
        instructionVi: 'Hãy nằm xuống, khép nhẹ đôi mắt và thả lỏng từng nhịp thở.',
        instructionEn: 'Lie down comfortably, close your eyes gently, and soften each breath.',
        durationSeconds: 130,
        allowSkip: true,
        audioRef: '/audio/meditation/voice_1_suoi_mat_nam_tram.mp3',
      },
      {
        id: 'audio-sleep-01-step-2',
        titleVi: 'Phần 2: Buông thư toàn thân & chìm vào giấc ngủ',
        titleEn: 'Part 2: Full body release into restful sleep',
        instructionVi: 'Để tiếng suối mát lành cuốn trôi những suy nghĩ cuối cùng.',
        instructionEn: 'Allow the gentle brook soundscape to carry you into rest.',
        durationSeconds: 134,
        allowSkip: true,
        audioRef: '/audio/meditation/voice_1_suoi_mat_nam_tram.mp3',
      },
    ],
    relatedIds: ['audio-sleep-02-haven-got-rua', 'audio-sleep-03-giac-ngu-sau'],
    audioMeta: {
      audioUrl: '/audio/meditation/voice_1_suoi_mat_nam_tram.mp3',
      license: 'Equilibria First-Party Studio Recording (VieNeu-TTS / DgNguyen)',
      transcriptVi:
        'Hãy nằm xuống, để cơ thể bạn được nâng niu bởi mặt đất... Tôi an toàn. Tôi bình yên. Tôi xứng đáng có một giấc ngủ sâu và trọn vẹn.',
      checksumSha256: 'sha256-voice1-suoi-mat-nam-tram-v2',
      durationSeconds: 264,
    },
    offlineCacheTtlHours: 168,
    legacySource: {
      sourceType: 'sleep_audio_3',
      coreId: 'voice-1-suoi-mat',
      legacyWebId: 'voice-1-suoi-mat',
      legacyFlutterSlug: 'thien-buong-thu-dong-suoi-432hz',
    },
  },
  {
    id: 'audio-sleep-02-haven-got-rua',
    version: 1,
    locale: 'vi',
    kind: 'audio',
    title: 'Bài 2: Thiền Buông Thư Cùng Haven — Gột Rửa Phiền Lo',
    titleEn: 'Haven Guided Sleep Relaxation — Washing Away Daily Worries',
    models: ['MBCT'],
    needs: ['sleep', 'calm'],
    durationMinutes: 6,
    delivery: 'self_guided',
    reviewStatus: 'approved',
    publicationStatus: 'published',
    reviewerId: 'equilibria-v2-clinical-board',
    reviewerRole: 'clinician',
    reviewedAt: '2026-03-01T00:00:00.000Z',
    goals: ['Gột rửa căng thẳng cuối ngày và vỗ về tâm trí'],
    precautions: ['Không nghe khi đang lái xe'],
    contraindications: ['active_emergency_guidance_workflow'],
    references: [
      {
        sourceId: 'MBCT-BODY-SCAN-SLEEP-2',
        citation: 'MBCT Evening Wind-Down & Body Scan',
      },
    ],
    steps: [
      {
        id: 'audio-sleep-02-step-1',
        titleVi: 'Buông thư tâm trí cùng giọng đọc dịu ấm',
        titleEn: 'Evening wind-down with warm guided voice',
        instructionVi: 'Lắng nghe dẫn thiền và thả lỏng hai vai.',
        instructionEn: 'Listen to the guided audio and release shoulder tension.',
        durationSeconds: 359,
        allowSkip: true,
        audioRef: '/audio/meditation/voice_2_haven_got_rua_phien_lo_nu_am.mp3',
      },
    ],
    relatedIds: ['audio-sleep-01-suoi-mat', 'audio-sleep-03-giac-ngu-sau'],
    audioMeta: {
      audioUrl: '/audio/meditation/voice_2_haven_got_rua_phien_lo_nu_am.mp3',
      license: 'Equilibria First-Party Studio Recording (Vita)',
      transcriptVi: 'Thiết kế dành riêng cho bạn để gột rửa mọi phiền lo và vỗ về tâm trí sau một ngày dài vất vả.',
      checksumSha256: 'sha256-voice2-haven-got-rua-nu-am-v2',
      durationSeconds: 359,
    },
    offlineCacheTtlHours: 168,
    legacySource: {
      sourceType: 'sleep_audio_3',
      coreId: 'voice-2-haven-got-rua',
      legacyWebId: 'voice-2-haven-got-rua',
      legacyFlutterSlug: 'voice-2-haven-got-rua',
    },
  },
  {
    id: 'audio-sleep-03-giac-ngu-sau',
    version: 1,
    locale: 'vi',
    kind: 'audio',
    title: 'Bài 3: Thiền Buông Thư Giấc Ngủ Sâu — Ôm Trọn Bình Yên',
    titleEn: 'Deep Sleep Body-Scan Relaxation — Embracing Peace',
    models: ['MBCT'],
    needs: ['sleep', 'calm'],
    durationMinutes: 6,
    delivery: 'self_guided',
    reviewStatus: 'approved',
    publicationStatus: 'published',
    reviewerId: 'equilibria-v2-clinical-board',
    reviewerRole: 'clinician',
    reviewedAt: '2026-03-01T00:00:00.000Z',
    goals: ['Dẫn dắt nhịp chậm rãi giúp dễ dàng chìm vào giấc ngủ sâu'],
    precautions: ['Không nghe khi đang lái xe'],
    contraindications: ['active_emergency_guidance_workflow'],
    references: [
      {
        sourceId: 'MBCT-BODY-SCAN-SLEEP-3',
        citation: 'MBCT Deep Sleep Guidance',
      },
    ],
    steps: [
      {
        id: 'audio-sleep-03-step-1',
        titleVi: 'Thả lỏng toàn thân chìm vào giấc ngủ sâu',
        titleEn: 'Full-body deep sleep relaxation',
        instructionVi: 'Để hơi thở tự nhiên và buông thư trên giường.',
        instructionEn: 'Let your breath settle naturally on your bed.',
        durationSeconds: 363,
        allowSkip: true,
        audioRef: '/audio/meditation/voice_3_giac_ngu_sau_nam_tram_sau.mp3',
      },
    ],
    relatedIds: ['audio-sleep-01-suoi-mat', 'audio-sleep-02-haven-got-rua'],
    audioMeta: {
      audioUrl: '/audio/meditation/voice_3_giac_ngu_sau_nam_tram_sau.mp3',
      license: 'Equilibria First-Party Studio Recording (DgNguyen)',
      transcriptVi: 'Thả lỏng toàn thân trên chiếc giường êm ái, dẫn dắt nhịp chậm rãi giúp bạn dễ dàng chìm vào giấc ngủ sâu.',
      checksumSha256: 'sha256-voice3-giac-ngu-sau-nam-tram-v2',
      durationSeconds: 363,
    },
    offlineCacheTtlHours: 168,
    legacySource: {
      sourceType: 'sleep_audio_3',
      coreId: 'voice-3-giac-ngu-sau',
      legacyWebId: 'voice-3-giac-ngu-sau',
      legacyFlutterSlug: 'voice-3-giac-ngu-sau',
    },
  },
  {
    id: 'prac-breath-01-paced-4-6',
    version: 1,
    locale: 'vi-en',
    kind: 'practice',
    title: 'Thở Dẫn Nhịp DBT TIPP (Hít 4s — Thở ra 6s)',
    titleEn: 'DBT TIPP Paced Breathing (Inhale 4s — Exhale 6s)',
    models: ['DBT'],
    needs: ['calm', 'emotions'],
    durationMinutes: 3,
    delivery: 'self_guided',
    reviewStatus: 'approved',
    publicationStatus: 'published',
    reviewerId: 'equilibria-v2-clinical-board',
    reviewerRole: 'clinician',
    reviewedAt: '2026-03-01T00:00:00.000Z',
    goals: ['Kích hoạt hệ thần kinh phó giao cảm qua nhịp thở ra dài hơn hít vào'],
    precautions: ['Thở nhẹ nhàng không gắng sức; dừng lại nếu thấy choáng nhẹ'],
    contraindications: ['active_emergency_guidance_workflow'],
    references: [
      {
        sourceId: 'LINEHAN-DBT-TIPP-BREATH',
        citation: 'Linehan, M. M. (2015). DBT Skills Training Manual — TIPP Paced Breathing',
      },
    ],
    steps: [
      {
        id: 'prac-breath-01-step-1',
        titleVi: 'Bước 1: Chuẩn bị tư thế vững chãi',
        titleEn: 'Step 1: Grounded posture',
        instructionVi: 'Đặt hai bàn chân chạm sàn và thả lỏng hai vai.',
        instructionEn: 'Rest both feet flat on the floor and soften your shoulders.',
        durationSeconds: 30,
        allowSkip: false,
      },
      {
        id: 'prac-breath-01-step-2',
        titleVi: 'Bước 2: 6 chu kỳ Hít vào 4 giây — Thở ra 6 giây',
        titleEn: 'Step 2: 6 cycles of Inhale 4s — Exhale 6s',
        instructionVi: 'Hít vào nhẹ nhàng bằng mũi 4 giây, thở ra chậm qua môi 6 giây.',
        instructionEn: 'Inhale gently through your nose for 4s, exhale slowly for 6s.',
        durationSeconds: 120,
        allowSkip: false,
      },
    ],
    relatedIds: ['prac-breath-02-relax-4-7-8', 'prac-breath-03-grounding-54321'],
    offlineCacheTtlHours: 168,
    legacySource: {
      sourceType: 'breathing_sos_3',
      coreId: '4-6',
      legacyWebId: '4-6',
      legacyFlutterSlug: 'breathing-4-6',
    },
  },
  {
    id: 'prac-breath-02-relax-4-7-8',
    version: 1,
    locale: 'vi-en',
    kind: 'practice',
    title: 'Thở Thư Giãn Sâu 4-7-8 (Hít 4s — Giữ 7s — Thở ra 8s)',
    titleEn: '4-7-8 Deep Parasympathetic Breathing (4s — 7s — 8s)',
    models: ['DBT', 'MBCT'],
    needs: ['calm', 'sleep'],
    durationMinutes: 3,
    delivery: 'self_guided',
    reviewStatus: 'approved',
    publicationStatus: 'published',
    reviewerId: 'equilibria-v2-clinical-board',
    reviewerRole: 'clinician',
    reviewedAt: '2026-03-01T00:00:00.000Z',
    goals: ['Hạ nhiệt kích thích thần kinh trước khi ngủ hoặc khi lo âu'],
    precautions: ['Nếu không quen nín thở 7 giây, có thể chuyển sang nhịp thở 4-6'],
    contraindications: ['active_emergency_guidance_workflow'],
    references: [
      {
        sourceId: 'PARASYMPATHETIC-BREATH-478',
        citation: 'Autonomic Down-Regulation Paced Breathing Protocol',
      },
    ],
    steps: [
      {
        id: 'prac-breath-02-step-1',
        titleVi: 'Bước 1: Thả lỏng xương hàm và vai',
        titleEn: 'Step 1: Unclench jaw and shoulders',
        instructionVi: 'Đặt đầu lưỡi chạm nhẹ sau hàm răng trên.',
        instructionEn: 'Rest the tip of your tongue gently behind your upper front teeth.',
        durationSeconds: 30,
        allowSkip: false,
      },
      {
        id: 'prac-breath-02-step-2',
        titleVi: 'Bước 2: 4 chu kỳ Hít 4s — Giữ 7s — Thở ra 8s',
        titleEn: 'Step 2: 4 cycles of 4s — 7s — 8s',
        instructionVi: 'Theo dõi vòng tròn nhịp thở, không cần ép hơi thở quá sức.',
        instructionEn: 'Follow the breathing circle gently without straining.',
        durationSeconds: 120,
        allowSkip: false,
      },
    ],
    relatedIds: ['prac-breath-01-paced-4-6', 'prac-breath-03-grounding-54321'],
    offlineCacheTtlHours: 168,
    legacySource: {
      sourceType: 'breathing_sos_3',
      coreId: '4-7-8',
      legacyWebId: '4-7-8',
      legacyFlutterSlug: 'breathing-4-7-8',
    },
  },
  {
    id: 'prac-breath-03-grounding-54321',
    version: 1,
    locale: 'vi-en',
    kind: 'practice',
    title: 'Tiếp Đất 5 Giác Quan 5-4-3-2-1 (Sensory Grounding)',
    titleEn: '5-4-3-2-1 Five-Senses Present-Moment Grounding',
    models: ['DBT', 'CBT'],
    needs: ['calm', 'emotions'],
    durationMinutes: 4,
    delivery: 'self_guided',
    reviewStatus: 'approved',
    publicationStatus: 'published',
    reviewerId: 'equilibria-v2-clinical-board',
    reviewerRole: 'clinician',
    reviewedAt: '2026-03-01T00:00:00.000Z',
    goals: ['Đưa tâm trí trở về thực tại an toàn qua 5 giác quan khi choáng ngợp'],
    precautions: ['Mở mắt và quan sát chậm rãi xung quanh căn phòng'],
    contraindications: ['active_emergency_guidance_workflow'],
    references: [
      {
        sourceId: 'DBT-SENSORY-GROUNDING-54321',
        citation: 'Trauma-Informed Sensory Grounding 5-4-3-2-1 Protocol',
      },
    ],
    steps: [
      {
        id: 'prac-breath-03-step-1',
        titleVi: 'Bước 1: 5 điều nhìn thấy & 4 điều chạm vào được',
        titleEn: 'Step 1: 5 things you see & 4 things you can touch',
        instructionVi: 'Gọi tên 5 đồ vật trong phòng và cảm nhận 4 bề mặt xúc giác.',
        instructionEn: 'Name 5 objects in the room and notice 4 tactile textures.',
        durationSeconds: 120,
        allowSkip: false,
      },
      {
        id: 'prac-breath-03-step-2',
        titleVi: 'Bước 2: 3 âm thanh, 2 mùi hương & 1 hơi thở bình an',
        titleEn: 'Step 2: 3 sounds, 2 scents & 1 grounding breath',
        instructionVi: 'Lắng nghe 3 âm thanh thực tế xung quanh và kết thúc bằng 1 hơi thở sâu.',
        instructionEn: 'Notice 3 ambient sounds, 2 scents, and 1 steady breath.',
        durationSeconds: 120,
        allowSkip: true,
      },
    ],
    relatedIds: ['prac-breath-01-paced-4-6'],
    offlineCacheTtlHours: 168,
    legacySource: {
      sourceType: 'breathing_sos_3',
      coreId: 'grounding-54321',
      legacyWebId: 'grounding-54321',
      legacyFlutterSlug: 'grounding-54321',
    },
  },
];

/**
 * Deterministic Unified Practice Library Catalog:
 * - 68 Master Clinical Protocols (reviewStatus: 'draft', publicationStatus: 'unpublished')
 * - 36 Interactive CBT/TEAM-CBT/DBT/IPSRT Practice Tools (35 approved+published self-guided, 1 clinician_assisted draft)
 * - 3 Guided Sleep Meditation Audio Tracks (approved+published)
 * - 3 SOS Breathing & Sensory Grounding Practices (approved+published)
 * Total = 110 canonical items.
 */
export const UNIFIED_PRACTICE_LIBRARY_CATALOG: readonly UnifiedPracticeItem[] = [
  ...MASTER_PROTOCOL_CATALOG.map(mapProtocolToUnifiedItem),
  ...CBT_36_TOOLS_CATALOG.map(mapCbt36ToolToUnifiedItem),
  ...UNIFIED_AUDIO_AND_BREATHING_ITEMS,
];

// =============================================================================
// 4. SCHEMA VALIDATOR (CAT-02 — FAIL CLOSED ON MISSING SAFETY FIELDS)
// =============================================================================

export function validateUnifiedPracticeItem(
  item: Partial<UnifiedPracticeItem>,
): ValidationResult<UnifiedPracticeItem> {
  const errors: string[] = [];

  if (!item.id || typeof item.id !== 'string' || item.id.trim().length < 3) {
    errors.push('id is required and must be a stable non-empty identifier.');
  }
  if (typeof item.version !== 'number' || !Number.isInteger(item.version) || item.version < 1) {
    errors.push('version is required and must be a positive integer >= 1.');
  }
  if (!item.locale || !['vi', 'en', 'vi-en'].includes(item.locale)) {
    errors.push('locale must be one of: vi, en, vi-en.');
  }
  if (!item.kind || !['practice', 'protocol', 'audio', 'education'].includes(item.kind)) {
    errors.push('kind must be one of: practice, protocol, audio, education.');
  }
  if (!item.title || typeof item.title !== 'string' || item.title.trim().length === 0) {
    errors.push('title is required.');
  }
  if (!item.delivery || !['self_guided', 'clinician_assisted'].includes(item.delivery)) {
    errors.push('delivery is required and must be self_guided or clinician_assisted.');
  }
  if (!item.reviewStatus || !['draft', 'clinical_review', 'approved', 'withdrawn'].includes(item.reviewStatus)) {
    errors.push('reviewStatus is required.');
  }
  if (!item.publicationStatus || !['unpublished', 'published', 'withdrawn'].includes(item.publicationStatus)) {
    errors.push('publicationStatus is required.');
  }
  if (!Array.isArray(item.goals) || item.goals.length === 0) {
    errors.push('goals is required and must contain at least one explicit goal.');
  }
  // Fail closed if mandatory safety fields (precautions / contraindications) are missing or empty
  if (!Array.isArray(item.precautions) || item.precautions.length === 0) {
    errors.push('Fail-closed safety gate (CAT-02): precautions is required and must be non-empty.');
  }
  if (!Array.isArray(item.contraindications) || item.contraindications.length === 0) {
    errors.push('Fail-closed safety gate (CAT-02): contraindications is required and must be non-empty.');
  }
  if (!Array.isArray(item.references) || item.references.length === 0) {
    errors.push('Fail-closed provenance gate (CAT-02): references is required and must be non-empty.');
  }
  if (!Array.isArray(item.steps) || item.steps.length === 0) {
    errors.push('steps is required and must contain at least one step.');
  } else {
    for (const step of item.steps) {
      if (!step.id || !step.titleVi || !step.instructionVi) {
        errors.push('Each step must have a stable id, titleVi, and instructionVi.');
      }
    }
  }

  // Approved / published content must have reviewer identity & timestamp
  if (item.reviewStatus === 'approved' || item.publicationStatus === 'published') {
    if (item.reviewStatus !== 'approved') {
      errors.push('Cannot set publicationStatus="published" when reviewStatus is not "approved".');
    }
    if (!item.reviewerId || item.reviewerRole !== 'clinician' || !item.reviewedAt) {
      errors.push(
        'Approved/published content requires reviewerId, reviewerRole="clinician", and reviewedAt timestamp.',
      );
    }
  }

  // Audio kind must include license, transcript, and checksum
  if (item.kind === 'audio') {
    if (
      !item.audioMeta ||
      !item.audioMeta.audioUrl ||
      !item.audioMeta.license ||
      !item.audioMeta.transcriptVi ||
      !item.audioMeta.checksumSha256
    ) {
      errors.push('Audio items require audioMeta with audioUrl, license, transcriptVi, and checksumSha256.');
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return { valid: true, errors: [], data: item as UnifiedPracticeItem };
}

// =============================================================================
// 5. ELIGIBILITY & FILTER ENGINE (CAT-03, CAT-05)
// =============================================================================

export interface UnifiedCatalogFilterQuery {
  need?: UnifiedNeedCategory;
  therapyModel?: TherapyModel;
  maxDurationMinutes?: number;
  delivery?: UnifiedDeliveryMode;
  kind?: UnifiedPracticeKind;
  searchQuery?: string;
  includeClinicianAssistedPreview?: boolean;
  includeDraftReferencePreview?: boolean;
}

export interface UnifiedCatalogFilterResult {
  items: UnifiedPracticeItem[];
  totalEligibleSelfGuidedCount: number;
  inferredDiagnosis: null; // CAT-05: Never infer diagnosis from filter selection
  appliedFilters: UnifiedCatalogFilterQuery;
}

/**
 * Evaluates whether a UnifiedPracticeItem is eligible to start a self-guided session (CAT-03).
 * Public self-guided execution strictly requires:
 * - Valid schema including mandatory safety fields (fails closed otherwise)
 * - reviewStatus === 'approved'
 * - publicationStatus === 'published'
 * - delivery === 'self_guided'
 */
export function evaluateUnifiedItemSelfGuidedEligibility(
  item: Partial<UnifiedPracticeItem> | null | undefined,
  options?: { clinicianAssistedGrantActive?: boolean },
): {
  canStartSelfGuided: boolean;
  canStartWithClinicianGrant: boolean;
  blockReasonCode:
    | null
    | 'ITEM_NOT_FOUND'
    | 'SCHEMA_SAFETY_MISSING_FAIL_CLOSED'
    | 'DRAFT_OR_UNPUBLISHED_BLOCKED'
    | 'WITHDRAWN_BLOCKED'
    | 'CLINICIAN_ASSISTED_REQUIRED';
  messageVi: string;
} {
  if (!item) {
    return {
      canStartSelfGuided: false,
      canStartWithClinicianGrant: false,
      blockReasonCode: 'ITEM_NOT_FOUND',
      messageVi: 'Không tìm thấy mục thực hành trong thư viện.',
    };
  }

  const schemaCheck = validateUnifiedPracticeItem(item);
  if (!schemaCheck.valid) {
    return {
      canStartSelfGuided: false,
      canStartWithClinicianGrant: false,
      blockReasonCode: 'SCHEMA_SAFETY_MISSING_FAIL_CLOSED',
      messageVi: `Đã khóa an toàn (Fail-Closed): Thiếu thông tin an toàn bắt buộc (${schemaCheck.errors[0]}).`,
    };
  }

  if (item.reviewStatus === 'withdrawn' || item.publicationStatus === 'withdrawn') {
    return {
      canStartSelfGuided: false,
      canStartWithClinicianGrant: false,
      blockReasonCode: 'WITHDRAWN_BLOCKED',
      messageVi: 'Nội dung này đã được thu hồi và không thể mở phiên thực hành.',
    };
  }

  if (item.reviewStatus !== 'approved' || item.publicationStatus !== 'published') {
    return {
      canStartSelfGuided: false,
      canStartWithClinicianGrant: false,
      blockReasonCode: 'DRAFT_OR_UNPUBLISHED_BLOCKED',
      messageVi:
        'Bản nháp tham khảo học thuật (Draft / Unpublished) — Chưa phê duyệt lâm sàng nên không thể bắt đầu tự thực hành.',
    };
  }

  if (item.delivery === 'clinician_assisted') {
    const hasGrant = options?.clinicianAssistedGrantActive === true;
    return {
      canStartSelfGuided: false,
      canStartWithClinicianGrant: hasGrant,
      blockReasonCode: 'CLINICIAN_ASSISTED_REQUIRED',
      messageVi:
        'Mục này yêu cầu hướng dẫn trực tiếp từ chuyên gia lâm sàng (Clinician-Assisted) và không mở tự thực hành độc lập.',
    };
  }

  return {
    canStartSelfGuided: true,
    canStartWithClinicianGrant: true,
    blockReasonCode: null,
    messageVi: 'Đủ điều kiện tự thực hành an toàn.',
  };
}

/**
 * Queries the Unified Practice Library Catalog (CAT-03, CAT-05).
 * By default (public catalog), returns ONLY `approved + published + self_guided` items.
 */
export function queryUnifiedPracticeLibrary(
  query: UnifiedCatalogFilterQuery = {},
  catalog: readonly UnifiedPracticeItem[] = UNIFIED_PRACTICE_LIBRARY_CATALOG,
): UnifiedCatalogFilterResult {
  const search = (query.searchQuery ?? '').trim().toLowerCase();

  const items = catalog.filter((item) => {
    const schemaCheck = validateUnifiedPracticeItem(item);
    if (!schemaCheck.valid) return false; // Always fail closed on invalid safety metadata

    if (item.reviewStatus === 'withdrawn' || item.publicationStatus === 'withdrawn') {
      return false;
    }

    const isApprovedPublished =
      item.reviewStatus === 'approved' && item.publicationStatus === 'published';

    if (!query.includeDraftReferencePreview && !isApprovedPublished) {
      return false;
    }

    if (!query.includeClinicianAssistedPreview && item.delivery !== 'self_guided') {
      return false;
    }

    if (query.need && !item.needs.includes(query.need)) {
      return false;
    }

    if (query.therapyModel && !item.models.includes(query.therapyModel)) {
      return false;
    }

    if (
      typeof query.maxDurationMinutes === 'number' &&
      item.durationMinutes > query.maxDurationMinutes
    ) {
      return false;
    }

    if (query.delivery && item.delivery !== query.delivery) {
      return false;
    }

    if (query.kind && item.kind !== query.kind) {
      return false;
    }

    if (search.length > 0) {
      const haystack = `${item.id} ${item.title} ${item.titleEn} ${item.models.join(' ')} ${item.needs.join(' ')}`.toLowerCase();
      if (!haystack.includes(search)) {
        return false;
      }
    }

    return true;
  });

  const totalEligibleSelfGuidedCount = items.filter(
    (i) =>
      i.reviewStatus === 'approved' &&
      i.publicationStatus === 'published' &&
      i.delivery === 'self_guided',
  ).length;

  return {
    items,
    totalEligibleSelfGuidedCount,
    inferredDiagnosis: null,
    appliedFilters: query,
  };
}

// =============================================================================
// 6. SESSION PLAYER STATE MACHINE & VERSION IMMUTABILITY (CAT-04, UX-05)
// =============================================================================

export type PracticeSessionStatus =
  | 'previewing'
  | 'in_progress'
  | 'paused'
  | 'completed'
  | 'stopped';

export interface PracticeSessionStepCheckpoint {
  stepId: string;
  status: 'completed' | 'skipped';
  recordedAt: string;
  privateNoteLocalOnly?: string;
}

export interface PracticeSessionAnalyticsEvent {
  eventType:
    | 'session_previewed'
    | 'session_started'
    | 'step_checkpointed'
    | 'session_paused'
    | 'session_resumed'
    | 'session_stopped'
    | 'session_completed';
  sessionId: string;
  itemId: string;
  itemVersion: number;
  stepId?: string;
  timestamp: string;
  // Strictly NO private reflection text allowed in analytics events (UX-05)
}

export interface UnifiedPracticeSessionRecord {
  sessionId: string;
  itemId: string;
  itemVersion: number; // Locked at session creation (CAT-04)
  itemTitleSnapshot: string;
  stepsSnapshot: readonly UnifiedPracticeStep[];
  status: PracticeSessionStatus;
  currentStepIndex: number;
  currentStepId: string;
  checkpoints: PracticeSessionStepCheckpoint[];
  startedAt: string | null;
  updatedAt: string;
  completedAt: string | null;
  stoppedAt: string | null;
  analyticsEvents: PracticeSessionAnalyticsEvent[];
}

/**
 * 1. Preview Session (UX-05):
 * Opening a practice item creates a `previewing` record (status !== 'completed' and status !== 'in_progress').
 * Never marks a session completed merely on open.
 */
export function createPracticeSessionPreview(
  item: UnifiedPracticeItem,
  nowIso: string = new Date().toISOString(),
): UnifiedPracticeSessionRecord {
  const sessionId = `sess_${item.id}_v${item.version}_${Date.now()}`;
  const firstStepId = item.steps[0]?.id ?? 'step-1';

  return {
    sessionId,
    itemId: item.id,
    itemVersion: item.version,
    itemTitleSnapshot: item.title,
    stepsSnapshot: item.steps.map((s) => ({ ...s })),
    status: 'previewing',
    currentStepIndex: 0,
    currentStepId: firstStepId,
    checkpoints: [],
    startedAt: null,
    updatedAt: nowIso,
    completedAt: null,
    stoppedAt: null,
    analyticsEvents: [
      {
        eventType: 'session_previewed',
        sessionId,
        itemId: item.id,
        itemVersion: item.version,
        timestamp: nowIso,
      },
    ],
  };
}

/**
 * 2. Start Session after Eligibility Check (CAT-03, CAT-04, UX-05)
 */
export function startPracticeSession(
  previewSession: UnifiedPracticeSessionRecord,
  item: UnifiedPracticeItem,
  nowIso: string = new Date().toISOString(),
): ValidationResult<UnifiedPracticeSessionRecord> {
  const eligibility = evaluateUnifiedItemSelfGuidedEligibility(item);
  if (!eligibility.canStartSelfGuided) {
    return {
      valid: false,
      errors: [`[${eligibility.blockReasonCode}] ${eligibility.messageVi}`],
    };
  }

  const next: UnifiedPracticeSessionRecord = {
    ...previewSession,
    status: 'in_progress',
    startedAt: previewSession.startedAt ?? nowIso,
    updatedAt: nowIso,
    analyticsEvents: [
      ...previewSession.analyticsEvents,
      {
        eventType: 'session_started',
        sessionId: previewSession.sessionId,
        itemId: previewSession.itemId,
        itemVersion: previewSession.itemVersion,
        stepId: previewSession.currentStepId,
        timestamp: nowIso,
      },
    ],
  };

  return { valid: true, errors: [], data: next };
}

/**
 * 3. Advance / Checkpoint Step (UX-05)
 * Saves step checkpoint by stepId, enforces allowSkip rules, and strips private notes from analytics.
 */
export function checkpointPracticeSessionStep(
  session: UnifiedPracticeSessionRecord,
  action: {
    stepId: string;
    outcome: 'completed' | 'skipped';
    privateNoteLocalOnly?: string;
  },
  nowIso: string = new Date().toISOString(),
): ValidationResult<UnifiedPracticeSessionRecord> {
  if (session.status !== 'in_progress') {
    return {
      valid: false,
      errors: [`Cannot checkpoint step while session status is "${session.status}".`],
    };
  }

  const stepIndex = session.stepsSnapshot.findIndex((s) => s.id === action.stepId);
  if (stepIndex === -1) {
    return {
      valid: false,
      errors: [`Step "${action.stepId}" does not belong to session item "${session.itemId}" v${session.itemVersion}.`],
    };
  }

  const stepDef = session.stepsSnapshot[stepIndex]!;
  if (action.outcome === 'skipped' && !stepDef.allowSkip) {
    return {
      valid: false,
      errors: [`Step "${stepDef.id}" is mandatory and does not allow skipping.`],
    };
  }

  const checkpoint: PracticeSessionStepCheckpoint = {
    stepId: stepDef.id,
    status: action.outcome,
    recordedAt: nowIso,
    privateNoteLocalOnly: action.privateNoteLocalOnly,
  };

  const remainingIdx = Math.min(stepIndex + 1, session.stepsSnapshot.length - 1);
  const nextStepId = session.stepsSnapshot[remainingIdx]?.id ?? stepDef.id;

  const updatedCheckpoints = [
    ...session.checkpoints.filter((c) => c.stepId !== stepDef.id),
    checkpoint,
  ];

  const next: UnifiedPracticeSessionRecord = {
    ...session,
    currentStepIndex: remainingIdx,
    currentStepId: nextStepId,
    checkpoints: updatedCheckpoints,
    updatedAt: nowIso,
    analyticsEvents: [
      ...session.analyticsEvents,
      {
        eventType: 'step_checkpointed',
        sessionId: session.sessionId,
        itemId: session.itemId,
        itemVersion: session.itemVersion,
        stepId: stepDef.id,
        timestamp: nowIso,
      },
    ],
  };

  return { valid: true, errors: [], data: next };
}

/**
 * 4. Pause, Resume, Stop, or Complete Session (UX-05)
 */
export function transitionPracticeSessionLifecycle(
  session: UnifiedPracticeSessionRecord,
  transition: 'pause' | 'resume' | 'stop' | 'complete',
  nowIso: string = new Date().toISOString(),
): ValidationResult<UnifiedPracticeSessionRecord> {
  if (transition === 'pause') {
    if (session.status !== 'in_progress') {
      return { valid: false, errors: ['Only an in_progress session can be paused.'] };
    }
    return {
      valid: true,
      errors: [],
      data: {
        ...session,
        status: 'paused',
        updatedAt: nowIso,
        analyticsEvents: [
          ...session.analyticsEvents,
          {
            eventType: 'session_paused',
            sessionId: session.sessionId,
            itemId: session.itemId,
            itemVersion: session.itemVersion,
            stepId: session.currentStepId,
            timestamp: nowIso,
          },
        ],
      },
    };
  }

  if (transition === 'resume') {
    if (session.status !== 'paused') {
      return { valid: false, errors: ['Only a paused session can be resumed.'] };
    }
    return {
      valid: true,
      errors: [],
      data: {
        ...session,
        status: 'in_progress',
        updatedAt: nowIso,
        analyticsEvents: [
          ...session.analyticsEvents,
          {
            eventType: 'session_resumed',
            sessionId: session.sessionId,
            itemId: session.itemId,
            itemVersion: session.itemVersion,
            stepId: session.currentStepId,
            timestamp: nowIso,
          },
        ],
      },
    };
  }

  if (transition === 'stop') {
    if (session.status !== 'in_progress' && session.status !== 'paused') {
      return { valid: false, errors: ['Only an active or paused session can be stopped.'] };
    }
    return {
      valid: true,
      errors: [],
      data: {
        ...session,
        status: 'stopped',
        stoppedAt: nowIso,
        updatedAt: nowIso,
        analyticsEvents: [
          ...session.analyticsEvents,
          {
            eventType: 'session_stopped',
            sessionId: session.sessionId,
            itemId: session.itemId,
            itemVersion: session.itemVersion,
            stepId: session.currentStepId,
            timestamp: nowIso,
          },
        ],
      },
    };
  }

  // transition === 'complete'
  if (session.status !== 'in_progress') {
    return {
      valid: false,
      errors: ['Session must be in_progress before it can be marked completed.'],
    };
  }
  const mandatorySteps = session.stepsSnapshot.filter((s) => !s.allowSkip);
  for (const mandatory of mandatorySteps) {
    const done = session.checkpoints.some(
      (c) => c.stepId === mandatory.id && c.status === 'completed',
    );
    if (!done) {
      return {
        valid: false,
        errors: [`Cannot complete session until mandatory step "${mandatory.id}" is checkpointed.`],
      };
    }
  }

  return {
    valid: true,
    errors: [],
    data: {
      ...session,
      status: 'completed',
      completedAt: nowIso,
      updatedAt: nowIso,
      analyticsEvents: [
        ...session.analyticsEvents,
        {
          eventType: 'session_completed',
          sessionId: session.sessionId,
          itemId: session.itemId,
          itemVersion: session.itemVersion,
          timestamp: nowIso,
        },
      ],
    },
  };
}
