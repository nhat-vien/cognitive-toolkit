/**
 * Equilibria / Mind Anchor — Core Clinical Domain Types for Web Application
 * Covers CBT, TEAM-CBT (David Burns), DBT (Marsha Linehan), and IPSRT (Ellen Frank)
 * Bilingual support: Vietnamese ('vi') & English ('en')
 */

export type Language = 'vi' | 'en';

export type DisorderFocus = 'anxiety' | 'depression' | 'bipolar_1' | 'bipolar_2' | 'cyclothymia';

export type PushbackLevel = 'off' | 'gentle' | 'moderate' | 'firm';

export type PushbackZone = 'Supportive' | 'Core' | 'Closing' | 'None';

export type UIThemeMode = 'standard' | 'low-energy-depression' | 'low-stimulus-mania';

export type MoodPole = -5 | -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5;

export type IntensityScore = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type FeltNeedForSleep = 'exhausted' | 'normal' | 'reduced_need' | 'no_need_at_all';

export type HrvContext = 'below-baseline' | 'within-baseline' | 'above-baseline';

export type SessionPhase0Mode = 'expressive' | 'instrumental';

export type TechniqueSlug =
  | 'thought-record'
  | 'behavioral-activation'
  | 'paradoxical-agenda-setting'
  | 'opposite-action'
  | 'wise-mind'
  | 'chain-analysis'
  | 'dear-man'
  | 'tipp'
  | 'worry-box'
  | 'exposure-hierarchy'
  | 'prediction-calibration'
  | 'hypomania-devils-advocate';

export type SessionOutcome =
  | 'completed'
  | 'accurate-thought-exit'
  | 'justified-exit'
  | 'stopped-early'
  | 'safety-stop'
  | 'impulse-locked-48h';

export type AffectFamily = 'Anger' | 'Sadness' | 'Anxiety' | 'Shame' | 'Guilt';

export interface AffectLabelCard {
  id: string;
  family: AffectFamily;
  labelVi: string;
  labelEn: string;
  clinicalNoteVi: string;
  clinicalNoteEn: string;
}

export interface AdaptiveThemeConfig {
  mode: UIThemeMode;
  titleVi: string;
  titleEn: string;
  reasonVi: string;
  reasonEn: string;
  palette: {
    background: string;
    surface: string;
    primary: string;
    accent: string;
    textPrimary: string;
    textSecondary: string;
    border: string;
    sosBanner: string;
  };
  animationsEnabled: boolean;
  showStreaks: boolean;
  simplifiedOneSmallStep: boolean;
  voiceBurstPrimary: boolean;
  showAffectLabelingCards: boolean;
  show48hImpulseVaultBanner: boolean;
  showDarkTherapyTimer: boolean;
  blockHighActivationBA: boolean;
  persistentSosVisible: true;
}

export interface UlyssesTrustedContact {
  name: string;
  relationship: string;
  phone: string;
  notifyOnSafetyStop: boolean;
  notifyOnSevereProdrome: boolean;
}

export interface UlyssesContract {
  enabled: boolean;
  createdAtWhileEuthymic: string;
  moodPolarityAtCreation: MoodPole;
  personalManiaProdromes: string[];
  personalDepressionProdromes: string[];
  coolDownStepsVi: string[];
  coolDownStepsEn: string[];
  autoActivateLowStimulusUIAtPole: number;
  autoEnable48hImpulseVaultAtPole: number;
  darkTherapyShutdownHour: string; // e.g. "22:00"
  trustedContacts: UlyssesTrustedContact[];
}

export interface IPSRTAnchors {
  outOfBedTime?: string;          // HH:mm
  firstSocialContactTime?: string;// HH:mm
  workOrStudyStartTime?: string;  // HH:mm
  dinnerTime?: string;            // HH:mm
  bedTime?: string;               // HH:mm
}

export interface MedicationDoseLog {
  medicationId: string;
  name: string;
  dosage: string;
  takenAt?: string;
  skippedReason?: string;
  sideEffectsNote?: string;
}

export interface DailyMoodAndRhythmLog {
  id: string;
  userId: string;
  loggedAt: string; // ISO-8601
  moodPolarity: MoodPole;
  energyLevel: MoodPole;
  irritabilityIntensity: IntensityScore;
  anxietyIntensity: IntensityScore;
  sleepDurationHours: number;
  sleepQuality: 1 | 2 | 3 | 4 | 5;
  feltNeedForSleep: FeltNeedForSleep;
  hrvContext?: HrvContext;
  ipsrtAnchors: IPSRTAnchors;
  medicationsTaken: MedicationDoseLog[];
  mixedStateAlertTriggered: boolean;
  maniaProdromeAlertTriggered: boolean;
}

export interface CognitiveToolkitSession {
  id: string;
  type: 'cognitive-toolkit-session';
  technique: TechniqueSlug;
  phase0Mode: SessionPhase0Mode;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  channel: 'web-pwa' | 'flutter-mobile' | 'voice-burst';
  language: Language;
  pushbackLevel: PushbackLevel;
  preIntensity: number; // 0-10
  postIntensity?: number; // 0-10
  intensityDelta?: number; // post - pre
  moodPolarityAtStart?: MoodPole;
  emotions: string[];
  affectFamilies?: AffectFamily[];
  negativeDistortionsIdentified: string[];
  positiveDistortionsIdentified: string[];
  selfDefeatingBeliefsIdentified: string[];
  stepsCompleted: number;
  stepsSkipped: string[];
  outcome: SessionOutcome;
  hrvContext?: HrvContext;
  structuredStepsPayload: Record<string, unknown>;
  takeaway?: string;
  kbCitations?: string[];
}

export interface WorryBoxItem {
  id: string;
  createdAt: string;
  rawWorryText: string;
  scheduledWindowTime: string; // e.g. "17:30 - 17:45"
  category?: 'productive' | 'hypothetical';
  status: 'postponed' | 'processed' | 'let_go';
  actionPlanOrAcceptanceNote?: string;
}

export interface ExposureTrialLog {
  trialNumber: number;
  timestamp: string;
  preSuds: number;  // 0-100
  peakSuds: number; // 0-100
  postSuds: number; // 0-100
  durationMinutes: number;
  safetyBehaviorsDropped: boolean;
}

export interface ExposureHierarchyItem {
  id: string;
  title: string;
  exposureType: 'in-vivo-erp' | 'interoceptive' | 'shame-attacking';
  baselineSuds: number; // 0-100
  currentSuds: number;  // 0-100
  detectedSafetyBehaviors: string[];
  interoceptiveMedicalCleared: boolean;
  trials: ExposureTrialLog[];
  habituationAchieved: boolean;
}

export interface PredictionCalibrationEntry {
  id: string;
  createdAt: string;
  eventDescription: string;
  fearedCatastrophe: string;
  predictedProbabilityPercent: number; // 0-100
  copingPlanIfTrue: string;
  resolved: boolean;
  actualOutcome?: string;
  catastropheActuallyHappened?: boolean;
  actualSeverityPercent?: number; // 0-100
}

export interface CrisisProsConsMatrix {
  actingOnImpulsePros: string[];
  actingOnImpulseCons: string[];
  waiting48HoursPros: string[];
  waiting48HoursCons: string[];
}

export interface ImpulseVaultEntry {
  id: string;
  createdAt: string; // ISO-8601
  unlocksAt: string; // ISO-8601 (+48 hours)
  category: 'financial' | 'career' | 'relationship' | 'project_2am' | 'medication_stop';
  impulseDescription: string;
  estimatedCostOrRisk: string;
  moodPolarityWhenLogged: MoodPole;
  positiveDistortionsDetected: string[];
  dbtStopCompleted: boolean;
  prosConsMatrix: CrisisProsConsMatrix;
  devilsAdvocateCounterArguments: string[];
  twoPersonRealityCheck: {
    person1Name: string;
    person1Approved: boolean | null;
    person2Name: string;
    person2Approved: boolean | null;
  };
  status: 'locked_48h' | 'cancelled_wisely' | 'unlocked_reviewed';
}

export interface MoodPalette {
  dominantEmotion: AffectFamily | 'Calm' | 'Elevated';
  colors: [string, string, string];
  gradientCss: string;
  summaryVi: string;
  summaryEn: string;
}

export interface VoiceBurstEntry {
  id: string;
  recordedAt: string;
  durationSeconds: number;
  transcript: string;
  detectedMode: SessionPhase0Mode;
  detectedDistressIntensity: IntensityScore;
  moodPalette: MoodPalette;
  earEmpathyReplyVi: string;
  earEmpathyReplyEn: string;
  suggestedTechnique: TechniqueSlug;
}

export type AssessmentType = 'BMS' | 'PHQ-9' | 'GAD-7' | 'ASRM' | 'MDQ' | 'ISI';

export interface AssessmentResult {
  id: string;
  type: AssessmentType;
  completedAt: string;
  totalScore: number;
  maxScore: number;
  severityCode: 'minimal' | 'mild' | 'moderate' | 'moderately_severe' | 'severe' | 'positive_screen';
  labelVi: string;
  labelEn: string;
  clinicalRecommendationVi: string;
  clinicalRecommendationEn: string;
  triggersSafetyStop: boolean;
  triggersHypomaniaGuard: boolean;
  subscales?: Record<string, number>;
}
