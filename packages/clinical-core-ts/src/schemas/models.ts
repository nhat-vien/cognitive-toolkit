/**
 * Shared Clinical Domain Models & Zero-Dependency Runtime Validators
 * Equilibria Cognitive Toolkit (CBT, TEAM-CBT, DBT & Bipolar IPSRT)
 */

export type DisorderFocus = 'anxiety' | 'depression' | 'bipolar_1' | 'bipolar_2' | 'cyclothymia';
export type PushbackLevel = 'off' | 'gentle' | 'moderate' | 'firm';
export type PushbackZone = 'Supportive' | 'Core' | 'Closing';
export type BipolarPole = -5 | -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5;
export type IntensityRating = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type SleepQualityRating = 1 | 2 | 3 | 4 | 5;
export type FeltNeedForSleep = 'exhausted' | 'normal' | 'reduced_need' | 'no_need_at_all';
export type HrvBaselineContext = 'below-baseline' | 'within-baseline' | 'above-baseline' | 'stale' | 'insufficient-baseline-data';
export type AdaptiveUiThemeMode = 'standard' | 'low-energy-depression' | 'low-stimulus-mania' | 'sos-crisis';

export type AffectFamily = 'anger' | 'sadness' | 'anxiety' | 'shame' | 'guilt';

export type TechniqueSlug =
  | 'thought-record'
  | 'opposite-action'
  | 'tipp'
  | 'dear-man'
  | 'wise-mind'
  | 'chain-analysis'
  | 'behavioral-activation'
  | 'worry-postponement'
  | 'exposure-hierarchy'
  | 'team-cbt-daily-mood-log'
  | 'paradoxical-agenda-setting'
  | 'pleasure-predicting'
  | 'anti-procrastination'
  | 'prediction-calibration'
  | 'hypomania-guard'
  | 'hypomania-devils-advocate'
  | 'abc-please'
  | 'crisis-pros-cons';

export type SessionOutcome =
  | 'in-progress'
  | 'completed'
  | 'accurate-thought-exit'
  | 'justified-exit'
  | 'stopped-early'
  | 'safety-stop'
  | 'impulse-locked-48h';

export interface TrustedContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  notifyOnSafetyStop: boolean;
  notifyOnSevereProdrome: boolean;
}

export interface UlyssesContract {
  enabled: boolean;
  createdAtWhileEuthymic: string; // ISO-8601 timestamp recorded when moodPolarity == 0
  moodPolarityAtCreation: number;
  personalManiaProdromes: string[];
  personalDepressionProdromes: string[];
  autoActivateLowStimulusUIAtPole: number; // Default +2
  autoEnable48hImpulseVaultAtPole: number; // Default +2
  agreedCoolDownSteps: string[];
  trustedContacts: TrustedContact[];
}

export interface UserClinicalProfile {
  id: string;
  displayName: string;
  preferredLanguage: 'vi' | 'en';
  primaryFocus: DisorderFocus[];
  defaultPushbackLevel: PushbackLevel;
  scheduledWorryWindowTime: string; // HH:mm (e.g., "17:30")
  targetIpsrtAnchors: IpsrtAnchors;
  medicalExclusionsForColdWater: {
    hasHeartCondition: boolean;
    hasBradycardia: boolean;
    takesBetaBlockers: boolean;
    hasColdAllergyOrRaynauds: boolean;
    hasEatingDisorder: boolean;
    hasMedicalPregnancyRestriction: boolean;
  };
  ulyssesContract?: UlyssesContract;
  createdAt: string;
  updatedAt: string;
}

export interface IpsrtAnchors {
  outOfBedTime?: string; // HH:mm
  firstSocialContactTime?: string; // HH:mm
  workOrStudyStartTime?: string; // HH:mm
  dinnerTime?: string; // HH:mm
  bedTime?: string; // HH:mm
}

export interface MedicationDoseLog {
  medicationId: string;
  name: string;
  dosage: string;
  takenAt?: string;
  skippedReason?: string;
}

export interface DailyMoodAndRhythmLog {
  id: string;
  userId: string;
  loggedAt: string; // ISO-8601
  moodPolarity: BipolarPole;
  energyLevel: BipolarPole;
  irritabilityIntensity: IntensityRating;
  anxietyIntensity: IntensityRating;
  sleepDurationHours: number;
  sleepQuality: SleepQualityRating;
  feltNeedForSleep: FeltNeedForSleep;
  hrvContext?: HrvBaselineContext;
  ipsrtAnchors: IpsrtAnchors;
  medicationsTaken: MedicationDoseLog[];
  mixedStateAlertTriggered: boolean; // True when moodPolarity <= -2 AND energyLevel >= +2
  notes?: string;
}

export interface CognitiveToolkitSession {
  id: string;
  type: 'cognitive-toolkit-session';
  technique: TechniqueSlug;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  channel: 'flutter-mobile' | 'web-pwa' | 'voice-burst';
  language: 'vi' | 'en';
  mode: 'expressive' | 'instrumental';
  pushbackLevel: PushbackLevel;
  preIntensity: number; // 0-10
  postIntensity?: number; // 0-10
  intensityDelta?: number; // post - pre
  moodPolarityAtStart?: number; // -5..+5
  energyLevelAtStart?: number; // -5..+5
  emotions: string[];
  affectFamilies?: AffectFamily[];
  negativeDistortionsIdentified?: string[];
  positiveDistortionsIdentified?: string[];
  selfDefeatingBeliefsIdentified?: string[];
  safetyBehaviorsIdentified?: string[];
  stepsCompleted: number;
  stepsSkipped: string[];
  outcome: SessionOutcome;
  hrvContext?: HrvBaselineContext;
  structuredStepsPayload: Record<string, unknown>;
  takeaway?: string;
}

export interface CrisisProsConsGrid {
  actingNowPros: string[];
  actingNowCons: string[];
  waiting48hPros: string[];
  waiting48hCons: string[];
}

export interface ImpulseVaultEntry {
  id: string;
  userId: string;
  impulseTitle: string;
  category: 'financial' | 'career' | 'relationship' | 'project' | 'medication' | 'other';
  estimatedCostOrImpact: string;
  moodPolarityAtLock: BipolarPole;
  energyLevelAtLock: BipolarPole;
  urgeIntensityAtLock: IntensityRating;
  positiveDistortionsDetected: string[];
  devilsAdvocateReflections: string[];
  crisisProsCons: CrisisProsConsGrid;
  twoPersonRealityCheckContacts: string[];
  twoPersonConsultedCount: number;
  createdAt: string; // ISO-8601
  unlocksAt: string; // ISO-8601 (createdAt + 48 hours)
  status: 'locked' | 'cooled-down-cancelled' | 'unlocked-reviewed';
}

export interface WorryBoxItem {
  id: string;
  userId: string;
  rawWorryThought: string;
  createdAt: string; // ISO-8601
  scheduledWindowTime: string; // HH:mm
  preAnxietyIntensity: IntensityRating;
  postReviewAnxietyIntensity?: IntensityRating;
  worryType?: 'productive-actionable' | 'hypothetical-uncontrollable' | 'already-resolved';
  nextSmallActionOrAcceptanceNote?: string;
  status: 'postponed-in-box' | 'reviewed-actioned' | 'reviewed-accepted' | 'faded-resolved';
}

export interface ExposureTrialLog {
  trialDate: string; // ISO-8601
  peakSuds: number; // 0-100
  endSuds: number; // 0-100
  durationMinutes: number;
  safetyBehaviorsDropped: string[];
  catastropheOccurred: boolean;
  learnedTakeaway: string;
}

export interface ExposureHierarchyItem {
  id: string;
  userId: string;
  fearedSituationOrSensation: string;
  exposureKind: 'in-vivo' | 'interoceptive' | 'imaginal-feared-fantasy' | 'shame-attacking';
  catastrophicPrediction: string;
  predictedProbabilityPercent: number; // 0-100
  baselineSuds: number; // 0-100
  currentSuds: number; // 0-100
  identifiedSafetyBehaviors: string[];
  medicalScreenClearedForInteroceptive: boolean;
  trials: ExposureTrialLog[];
  completed: boolean;
}

export interface ValidationResult<T> {
  valid: boolean;
  errors: string[];
  data?: T;
}

const VALID_BIPOLAR_POLES = new Set([-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5]);
const VALID_PUSHBACK_LEVELS = new Set<PushbackLevel>(['off', 'gentle', 'moderate', 'firm']);
const VALID_FELT_NEED_FOR_SLEEP = new Set<FeltNeedForSleep>([
  'exhausted',
  'normal',
  'reduced_need',
  'no_need_at_all',
]);
const HH_MM_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidHhMm(timeStr: string): boolean {
  return HH_MM_REGEX.test(timeStr);
}

export function validateUlyssesContract(input: Partial<UlyssesContract>): ValidationResult<UlyssesContract> {
  const errors: string[] = [];

  if (typeof input.enabled !== 'boolean') {
    errors.push('enabled must be a boolean.');
  }
  if (!input.createdAtWhileEuthymic || Number.isNaN(Date.parse(input.createdAtWhileEuthymic))) {
    errors.push('createdAtWhileEuthymic must be a valid ISO timestamp.');
  }
  if (typeof input.moodPolarityAtCreation !== 'number' || Math.abs(input.moodPolarityAtCreation) > 1) {
    errors.push('Ulysses Contract must be authored while euthymic (moodPolarity between -1 and +1).');
  }
  if (!Array.isArray(input.personalManiaProdromes) || input.personalManiaProdromes.length === 0) {
    errors.push('personalManiaProdromes must contain at least 1 early warning sign.');
  }
  if (!Array.isArray(input.personalDepressionProdromes) || input.personalDepressionProdromes.length === 0) {
    errors.push('personalDepressionProdromes must contain at least 1 early warning sign.');
  }

  const lowStimPole = input.autoActivateLowStimulusUIAtPole ?? 2;
  const vaultPole = input.autoEnable48hImpulseVaultAtPole ?? 2;
  if (lowStimPole < 1 || lowStimPole > 4) {
    errors.push('autoActivateLowStimulusUIAtPole must be between +1 and +4.');
  }
  if (vaultPole < 1 || vaultPole > 4) {
    errors.push('autoEnable48hImpulseVaultAtPole must be between +1 and +4.');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    data: {
      enabled: input.enabled!,
      createdAtWhileEuthymic: input.createdAtWhileEuthymic!,
      moodPolarityAtCreation: input.moodPolarityAtCreation!,
      personalManiaProdromes: input.personalManiaProdromes!,
      personalDepressionProdromes: input.personalDepressionProdromes!,
      autoActivateLowStimulusUIAtPole: lowStimPole,
      autoEnable48hImpulseVaultAtPole: vaultPole,
      agreedCoolDownSteps: input.agreedCoolDownSteps ?? [],
      trustedContacts: input.trustedContacts ?? [],
    },
  };
}

export function validateDailyMoodAndRhythmLog(
  input: Partial<DailyMoodAndRhythmLog>,
): ValidationResult<DailyMoodAndRhythmLog> {
  const errors: string[] = [];

  if (!input.id || typeof input.id !== 'string') {
    errors.push('id is required.');
  }
  if (!input.userId || typeof input.userId !== 'string') {
    errors.push('userId is required.');
  }
  if (!input.loggedAt || Number.isNaN(Date.parse(input.loggedAt))) {
    errors.push('loggedAt must be a valid ISO-8601 timestamp.');
  }
  if (typeof input.moodPolarity !== 'number' || !VALID_BIPOLAR_POLES.has(input.moodPolarity)) {
    errors.push('moodPolarity must be an integer from -5 to +5.');
  }
  if (typeof input.energyLevel !== 'number' || !VALID_BIPOLAR_POLES.has(input.energyLevel)) {
    errors.push('energyLevel must be an integer from -5 to +5.');
  }
  if (
    typeof input.irritabilityIntensity !== 'number' ||
    input.irritabilityIntensity < 0 ||
    input.irritabilityIntensity > 10
  ) {
    errors.push('irritabilityIntensity must be between 0 and 10.');
  }
  if (
    typeof input.anxietyIntensity !== 'number' ||
    input.anxietyIntensity < 0 ||
    input.anxietyIntensity > 10
  ) {
    errors.push('anxietyIntensity must be between 0 and 10.');
  }
  if (
    typeof input.sleepDurationHours !== 'number' ||
    input.sleepDurationHours < 0 ||
    input.sleepDurationHours > 24
  ) {
    errors.push('sleepDurationHours must be between 0 and 24.');
  }
  if (
    typeof input.sleepQuality !== 'number' ||
    input.sleepQuality < 1 ||
    input.sleepQuality > 5
  ) {
    errors.push('sleepQuality must be an integer from 1 to 5.');
  }
  if (!input.feltNeedForSleep || !VALID_FELT_NEED_FOR_SLEEP.has(input.feltNeedForSleep)) {
    errors.push('feltNeedForSleep must be one of exhausted, normal, reduced_need, no_need_at_all.');
  }

  const anchors = input.ipsrtAnchors ?? {};
  for (const [anchorKey, anchorVal] of Object.entries(anchors)) {
    if (anchorVal !== undefined && !isValidHhMm(anchorVal)) {
      errors.push(`ipsrtAnchors.${anchorKey} must be in HH:mm format.`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const mixedStateAlertTriggered = input.moodPolarity! <= -2 && input.energyLevel! >= 2;

  return {
    valid: true,
    errors: [],
    data: {
      id: input.id!,
      userId: input.userId!,
      loggedAt: input.loggedAt!,
      moodPolarity: input.moodPolarity as BipolarPole,
      energyLevel: input.energyLevel as BipolarPole,
      irritabilityIntensity: input.irritabilityIntensity as IntensityRating,
      anxietyIntensity: input.anxietyIntensity as IntensityRating,
      sleepDurationHours: input.sleepDurationHours!,
      sleepQuality: input.sleepQuality as SleepQualityRating,
      feltNeedForSleep: input.feltNeedForSleep!,
      hrvContext: input.hrvContext,
      ipsrtAnchors: anchors,
      medicationsTaken: input.medicationsTaken ?? [],
      mixedStateAlertTriggered,
      notes: input.notes,
    },
  };
}

export function validateUserClinicalProfile(
  input: Partial<UserClinicalProfile>,
): ValidationResult<UserClinicalProfile> {
  const errors: string[] = [];
  if (!input.id) errors.push('id is required.');
  if (!input.displayName) errors.push('displayName is required.');
  if (input.preferredLanguage !== 'vi' && input.preferredLanguage !== 'en') {
    errors.push('preferredLanguage must be vi or en.');
  }
  if (!input.defaultPushbackLevel || !VALID_PUSHBACK_LEVELS.has(input.defaultPushbackLevel)) {
    errors.push('defaultPushbackLevel must be off, gentle, moderate, or firm.');
  }
  if (!input.scheduledWorryWindowTime || !isValidHhMm(input.scheduledWorryWindowTime)) {
    errors.push('scheduledWorryWindowTime must be in HH:mm format.');
  }
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  const now = new Date().toISOString();
  return {
    valid: true,
    errors: [],
    data: {
      id: input.id!,
      displayName: input.displayName!,
      preferredLanguage: input.preferredLanguage!,
      primaryFocus: input.primaryFocus ?? ['anxiety', 'depression'],
      defaultPushbackLevel: input.defaultPushbackLevel!,
      scheduledWorryWindowTime: input.scheduledWorryWindowTime!,
      targetIpsrtAnchors: input.targetIpsrtAnchors ?? {
        outOfBedTime: '07:00',
        firstSocialContactTime: '08:30',
        workOrStudyStartTime: '09:00',
        dinnerTime: '19:00',
        bedTime: '23:00',
      },
      medicalExclusionsForColdWater: input.medicalExclusionsForColdWater ?? {
        hasHeartCondition: false,
        hasBradycardia: false,
        takesBetaBlockers: false,
        hasColdAllergyOrRaynauds: false,
        hasEatingDisorder: false,
        hasMedicalPregnancyRestriction: false,
      },
      ulyssesContract: input.ulyssesContract,
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? now,
    },
  };
}

export function validateExposureHierarchyItem(
  input: Partial<ExposureHierarchyItem>,
): ValidationResult<ExposureHierarchyItem> {
  const errors: string[] = [];
  if (!input.id) errors.push('id is required.');
  if (!input.userId) errors.push('userId is required.');
  if (!input.fearedSituationOrSensation) errors.push('fearedSituationOrSensation is required.');
  if (
    typeof input.baselineSuds !== 'number' ||
    input.baselineSuds < 0 ||
    input.baselineSuds > 100
  ) {
    errors.push('baselineSuds must be between 0 and 100.');
  }
  if (
    input.exposureKind === 'interoceptive' &&
    input.medicalScreenClearedForInteroceptive !== true
  ) {
    errors.push('Interoceptive exposure requires medicalScreenClearedForInteroceptive === true.');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    data: {
      id: input.id!,
      userId: input.userId!,
      fearedSituationOrSensation: input.fearedSituationOrSensation!,
      exposureKind: input.exposureKind ?? 'in-vivo',
      catastrophicPrediction: input.catastrophicPrediction ?? '',
      predictedProbabilityPercent: input.predictedProbabilityPercent ?? 80,
      baselineSuds: input.baselineSuds!,
      currentSuds: input.currentSuds ?? input.baselineSuds!,
      identifiedSafetyBehaviors: input.identifiedSafetyBehaviors ?? [],
      medicalScreenClearedForInteroceptive: input.medicalScreenClearedForInteroceptive ?? false,
      trials: input.trials ?? [],
      completed: input.completed ?? false,
    },
  };
}

export function determineAdaptiveUiThemeMode(params: {
  preIntensity?: number;
  moodPolarity?: number;
  energyLevel?: number;
  asrmScore?: number;
  ulyssesLowStimulusThreshold?: number;
}): AdaptiveUiThemeMode {
  const intensity = params.preIntensity ?? 0;
  const mood = params.moodPolarity ?? 0;
  const energy = params.energyLevel ?? 0;
  const asrm = params.asrmScore ?? 0;
  const maniaThreshold = params.ulyssesLowStimulusThreshold ?? 2;

  // Mixed state or acute crisis intensity >= 8 activates SOS Crisis mode
  if (intensity >= 8 || (mood <= -2 && energy >= 2)) {
    return 'sos-crisis';
  }
  // Hypomania / Mania protection activates Low-Stimulus Dark Rest mode
  if (mood >= maniaThreshold || asrm >= 6) {
    return 'low-stimulus-mania';
  }
  // Severe depression activates Low-Energy One-Small-Step mode
  if (mood <= -3) {
    return 'low-energy-depression';
  }
  return 'standard';
}
