import { detectCognitiveDistortions } from './detectors.ts';
import type {
  CrisisProsConsMatrix,
  DailyMoodAndRhythmLog,
  IPSRTAnchors,
  ImpulseVaultEntry,
  MoodPole,
  UlyssesContract,
} from './types.ts';

/**
 * 5. Bipolar & IPSRT Hub
 * - Dual-Pole Mood & Energy Chart (-5 to +5) tracking Valence, Energy, Irritability, Sleep Duration & Felt Need for Sleep
 *   (detecting Mania Prodrome and Mixed State)
 * - 5 IPSRT Social Rhythm Anchors tracker & stability score
 * - 48-Hour Impulse Vault (locks major financial/career/relationship decisions for 48h with DBT Crisis Pros & Cons + Devil's Advocate + Two-Person Reality Check)
 * - Ulysses Contract (Relapse Prevention Plan) & Medication Adherence CBT
 */

export interface BipolarStateAnalysis {
  isMixedState: boolean;
  isManiaProdrome: boolean;
  isBipolarDepression: boolean;
  activateLowStimulusDarkUI: boolean;
  activate48hImpulseVault: boolean;
  recommendedImmediateProtocol: 'tipp' | 'hypomania-devils-advocate' | 'micro-behavioral-activation' | 'maintain-ipsrt';
  clinicalAlertVi: string;
  clinicalAlertEn: string;
}

export function analyzeBipolarMoodAndSleepLogs(
  currentLog: DailyMoodAndRhythmLog,
  recentLogs: DailyMoodAndRhythmLog[] = [],
  asrmScore = 0
): BipolarStateAnalysis {
  // 1. Mixed State Detection: Mood <= -2 AND Energy >= +2 (or depressed mood with severe irritability >= 7 and positive energy)
  const isMixedState =
    (currentLog.moodPolarity <= -2 && currentLog.energyLevel >= 2) ||
    (currentLog.moodPolarity <= -2 && currentLog.energyLevel >= 1 && currentLog.irritabilityIntensity >= 7);

  // 2. Mania Prodrome Detection:
  // Sleep < 5h with reduced/no need for sleep, OR >= 2 consecutive nights < 5h, OR Mood >= +2, OR ASRM >= 6
  const shortSleepRecentCount = [currentLog, ...recentLogs.slice(0, 2)].filter(
    (l) => l.sleepDurationHours < 5
  ).length;
  const reducedSleepNeed =
    currentLog.feltNeedForSleep === 'reduced_need' || currentLog.feltNeedForSleep === 'no_need_at_all';

  const isManiaProdrome =
    currentLog.moodPolarity >= 2 ||
    asrmScore >= 6 ||
    (currentLog.sleepDurationHours < 5 && reducedSleepNeed) ||
    (shortSleepRecentCount >= 2 && reducedSleepNeed);

  const isBipolarDepression = !isMixedState && currentLog.moodPolarity <= -2;

  if (isMixedState) {
    return {
      isMixedState: true,
      isManiaProdrome: false,
      isBipolarDepression: false,
      activateLowStimulusDarkUI: true,
      activate48hImpulseVault: true,
      recommendedImmediateProtocol: 'tipp',
      clinicalAlertVi:
        'CẢNH BÁO ĐỎ PHA HỖN HỢP (MIXED STATE — Khí sắc trầm <= -2 kèm Năng lượng kích động >= +2): Đây là trạng thái nhạy cảm và rủi ro cao nhất. Bắt buộc ưu tiên DBT TIPP để hạ kích động thần kinh và liên hệ bác sĩ tâm thần theo Giao ước Ulysses.',
      clinicalAlertEn:
        'RED ALERT — MIXED STATE (Depressed Mood <= -2 with Agitated Energy >= +2): Highest-risk dysphoric arousal state. Prioritizing DBT TIPP physiological down-regulation and alerting clinician per Ulysses Contract.',
    };
  }

  if (isManiaProdrome) {
    return {
      isMixedState: false,
      isManiaProdrome: true,
      isBipolarDepression: false,
      activateLowStimulusDarkUI: true,
      activate48hImpulseVault: true,
      recommendedImmediateProtocol: 'hypomania-devils-advocate',
      clinicalAlertVi:
        'CẢNH BÁO TIỀN TRIỆU HƯNG CẢM (MANIA PRODROME / HYPOMANIA GUARD): Phát hiện ngủ ít (< 5h) kèm giảm nhu cầu ngủ hoặc khí sắc >= +2 / ASRM >= 6. Đã bật giao diện Giảm Kích Thích (Low-Stimulus Dark Rest), Khoang Chờ 48 Giờ và bảo vệ giấc ngủ IPSRT.',
      clinicalAlertEn:
        'MANIA PRODROME / HYPOMANIA GUARD: Short sleep (< 5h) with reduced felt need for sleep or Mood >= +2 / ASRM >= 6 detected. Low-Stimulus Dark Rest UI, 48-Hour Impulse Vault, and IPSRT Dark Therapy are now active.',
    };
  }

  if (isBipolarDepression) {
    return {
      isMixedState: false,
      isManiaProdrome: false,
      isBipolarDepression: true,
      activateLowStimulusDarkUI: false,
      activate48hImpulseVault: false,
      recommendedImmediateProtocol: 'micro-behavioral-activation',
      clinicalAlertVi:
        'Pha Trầm cảm Lưỡng cực (Bipolar Depression): Áp dụng Kích hoạt Hành vi Vi mô Có Trần Năng lượng (Activity Pacing — tránh kích hoạt quá đà gây chuyển pha Manic Switch) kết hợp giữ vững giờ thức dậy IPSRT.',
      clinicalAlertEn:
        'Bipolar Depression Phase: Apply paced Micro-Behavioral Activation (avoiding over-activation to prevent Manic Switch) while anchoring IPSRT wake time.',
    };
  }

  return {
    isMixedState: false,
    isManiaProdrome: false,
    isBipolarDepression: false,
    activateLowStimulusDarkUI: false,
    activate48hImpulseVault: false,
    recommendedImmediateProtocol: 'maintain-ipsrt',
    clinicalAlertVi: 'Khí sắc Bình ổn (Euthymia): Duy trì đều đặn 5 mốc nhịp sinh học IPSRT và lịch thuốc.',
    clinicalAlertEn: 'Euthymic State: Continue maintaining your 5 IPSRT circadian anchors and medication schedule.',
  };
}

/**
 * 5 IPSRT Social Rhythm Anchors Stability Score Calculator (0 - 100%)
 */
function parseHHmmToMinutes(hhmm?: string): number | null {
  if (!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm)) return null;
  const [h = 0, m = 0] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function circularMinuteDiff(m1: number, m2: number): number {
  const diff = Math.abs(m1 - m2);
  return Math.min(diff, 1440 - diff);
}

export interface IPSRTStabilityReport {
  stabilityScorePercent: number; // 0-100
  anchorsCompletedCount: number;
  maxDeviationMinutes: number;
  anchorDeviationsMinutes: Record<keyof IPSRTAnchors, number | null>;
  interpretationVi: string;
  interpretationEn: string;
}

export const DEFAULT_TARGET_IPSRT_ANCHORS: Required<IPSRTAnchors> = {
  outOfBedTime: '07:00',
  firstSocialContactTime: '08:30',
  workOrStudyStartTime: '09:00',
  dinnerTime: '19:00',
  bedTime: '22:30',
};

export function computeIPSRTSocialRhythmScore(
  actual: IPSRTAnchors,
  target: Required<IPSRTAnchors> = DEFAULT_TARGET_IPSRT_ANCHORS
): IPSRTStabilityReport {
  const keys: Array<keyof IPSRTAnchors> = [
    'outOfBedTime',
    'firstSocialContactTime',
    'workOrStudyStartTime',
    'dinnerTime',
    'bedTime',
  ];

  const deviations: Record<keyof IPSRTAnchors, number | null> = {
    outOfBedTime: null,
    firstSocialContactTime: null,
    workOrStudyStartTime: null,
    dinnerTime: null,
    bedTime: null,
  };

  let completed = 0;
  let totalPenalty = 0;
  let maxDev = 0;

  for (const k of keys) {
    const actMin = parseHHmmToMinutes(actual[k]);
    const tarMin = parseHHmmToMinutes(target[k]);
    if (actMin !== null && tarMin !== null) {
      completed++;
      const dev = circularMinuteDiff(actMin, tarMin);
      deviations[k] = dev;
      if (dev > maxDev) maxDev = dev;
      // Within 30 mins = 0 penalty; > 30 mins penalizes proportionally up to 20 pts per anchor
      const penalty = Math.min(20, Math.max(0, (dev - 15) / 6));
      totalPenalty += penalty;
    } else {
      totalPenalty += 15;
    }
  }

  const score = Math.max(0, Math.min(100, Math.round(100 - totalPenalty)));

  return {
    stabilityScorePercent: score,
    anchorsCompletedCount: completed,
    maxDeviationMinutes: maxDev,
    anchorDeviationsMinutes: deviations,
    interpretationVi:
      score >= 80
        ? `Nhịp sinh học IPSRT rất ổn định (${score}%). Giữ vững giờ thức dậy và giờ đi ngủ là lá chắn tốt nhất bảo vệ khỏi tái phát lưỡng cực.`
        : `Nhịp sinh học IPSRT đang dao động (${score}%, lệch tối đa ${maxDev} phút). Hãy ưu tiên cố định mốc Giờ thức dậy và Giờ đi ngủ đêm nay.`,
    interpretationEn:
      score >= 80
        ? `High IPSRT Circadian Stability (${score}%). Regular wake and bed times strongly protect against bipolar phase shifts.`
        : `IPSRT Social Rhythm fluctuation detected (${score}%, max drift ${maxDev} min). Prioritize anchoring your Out-of-Bed and Bedtime targets tonight.`,
  };
}

/**
 * 48-Hour Impulse Vault (Hypomania Guard)
 * Locks major financial, career, relationship, or 2am project decisions for 48 hours
 * with DBT STOP + Crisis Pros & Cons + Devil's Advocate + Two-Person Reality Check
 */
export function create48HourImpulseVaultEntry(params: {
  category: ImpulseVaultEntry['category'];
  impulseDescription: string;
  estimatedCostOrRisk: string;
  moodPolarityWhenLogged: MoodPole;
  prosConsMatrix: CrisisProsConsMatrix;
  person1Name: string;
  person2Name: string;
  nowIso?: string;
}): ImpulseVaultEntry {
  const now = params.nowIso ? new Date(params.nowIso) : new Date();
  const unlocksAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const { positiveMania } = detectCognitiveDistortions(params.impulseDescription);

  const devilsAdvocateCounterArguments = [
    'Quy tắc 48 Giờ (Devil\'s Advocate #1): Nếu cơ hội này thực sự tốt và bền vững, nó vẫn sẽ còn nguyên giá trị sau 48 giờ và 2 đêm ngủ đủ giấc.',
    'Devil\'s Advocate #2: Nếu bạn thực hiện quyết định này ngay bây giờ nhưng 2 tuần nữa khí sắc hạ xuống -2, bạn sẽ cảm thấy thế nào về khoản chi phí/rủi ro "' +
      params.estimatedCostOrRisk +
      '"?',
    'Devil\'s Advocate #3 (Two-Person Reality Check): Hai người tin cậy (' +
      params.person1Name +
      ' & ' +
      params.person2Name +
      ') có đồng ý rằng đây là thời điểm an toàn để quyết định không?',
  ];

  return {
    id: `vault-${now.getTime()}`,
    createdAt: now.toISOString(),
    unlocksAt: unlocksAt.toISOString(),
    category: params.category,
    impulseDescription: params.impulseDescription,
    estimatedCostOrRisk: params.estimatedCostOrRisk,
    moodPolarityWhenLogged: params.moodPolarityWhenLogged,
    positiveDistortionsDetected: positiveMania.map((d) => d.nameVi),
    dbtStopCompleted: true,
    prosConsMatrix: params.prosConsMatrix,
    devilsAdvocateCounterArguments,
    twoPersonRealityCheck: {
      person1Name: params.person1Name,
      person1Approved: null,
      person2Name: params.person2Name,
      person2Approved: null,
    },
    status: 'locked_48h',
  };
}

export function checkImpulseVaultUnlockStatus(
  entry: ImpulseVaultEntry,
  currentTimeIso: string
): {
  hoursRemaining: number;
  timeLockExpired: boolean;
  twoPersonCheckPassed: boolean;
  canUnlockSafely: boolean;
  statusMessageVi: string;
  statusMessageEn: string;
} {
  const nowMs = new Date(currentTimeIso).getTime();
  const unlockMs = new Date(entry.unlocksAt).getTime();
  const hoursRemaining = Math.max(0, Number(((unlockMs - nowMs) / (1000 * 60 * 60)).toFixed(1)));
  const timeLockExpired = nowMs >= unlockMs;
  const twoPersonCheckPassed =
    entry.twoPersonRealityCheck.person1Approved === true &&
    entry.twoPersonRealityCheck.person2Approved === true;

  const canUnlockSafely = timeLockExpired && twoPersonCheckPassed;

  return {
    hoursRemaining,
    timeLockExpired,
    twoPersonCheckPassed,
    canUnlockSafely,
    statusMessageVi: canUnlockSafely
      ? 'Đã qua 48 giờ chờ và được 2 người tin cậy xác nhận thực tế. Bạn có thể xem xét lại quyết định từ Tâm Trí Tuệ.'
      : `ĐANG KHÓA BẢO VỆ (Còn ${hoursRemaining} giờ; Xác nhận từ 2 người tin cậy: ${twoPersonCheckPassed ? 'Đã duyệt' : 'Chưa đủ 2 người'}).`,
    statusMessageEn: canUnlockSafely
      ? '48-hour cool-down elapsed and Two-Person Reality Check passed. You may now review from Wise Mind.'
      : `LOCKED IN 48H VAULT (${hoursRemaining}h remaining; Two-Person Reality Check: ${twoPersonCheckPassed ? 'Approved' : 'Pending'}).`,
  };
}

/**
 * Medication Adherence CBT (Cost-Benefit Analysis & Thought Restructuring for Bipolar Mood Stabilizers)
 */
export interface MedicationAdherenceCBTReview {
  temptationThought: string;
  medicalDisclaimerVi: string;
  medicalDisclaimerEn: string;
  prosOfStayingConsistent: string[];
  risksOfAbruptDiscontinuation: string[];
  balancedAdherenceThoughtVi: string;
  balancedAdherenceThoughtEn: string;
}

export function evaluateMedicationAdherenceThought(
  temptationThought: string
): MedicationAdherenceCBTReview {
  return {
    temptationThought,
    medicalDisclaimerVi:
      'Tuyên bố Giới hạn Y khoa: Ứng dụng không kê đơn hay thay đổi liều thuốc. Tuyệt đối không tự ý ngưng hoặc giảm liều thuốc ổn định khí sắc (Lithium, Lamotrigine, Valproate, Quetiapine...) khi chưa trao đổi trực tiếp với bác sĩ tâm thần điều trị.',
    medicalDisclaimerEn:
      'Clinical Disclaimer: This app never prescribes or alters medication doses. Never abruptly stop or change mood stabilizers without consulting your prescribing psychiatrist.',
    prosOfStayingConsistent: [
      'Bảo vệ sự ổn định lâu dài để bạn theo đuổi đam mê và sáng tạo bền vững mà không bị gián đoạn bởi nhập viện hoặc sụp đổ trầm cảm sau cơn.',
      'Giữ nồng độ thuốc ổn định trong máu giúp ngăn ngừa hiệu ứng dội ngược (Rebound Mania/Depression).',
    ],
    risksOfAbruptDiscontinuation: [
      'Ảo tưởng "Mình khỏe hẳn rồi nên không cần thuốc nữa": Chính thuốc đang giúp duy trì sự bình ổn đó.',
      'Ngưng thuốc đột ngột làm tăng nguy cơ tái phát cơn Hưng cảm hoặc Trầm cảm nặng gấp nhiều lần trong 4 tuần tiếp theo.',
    ],
    balancedAdherenceThoughtVi:
      'Đúng là mình đang cảm thấy khỏe khoắn hoặc gặp một số tác dụng phụ khó chịu, VÀ đồng thời việc duy trì đúng liều hôm nay rồi ghi chú lại để bàn với bác sĩ vào buổi tái khám là cách bảo vệ bộ não và sự tự do của mình tốt nhất.',
    balancedAdherenceThoughtEn:
      'It is true that I feel good right now (or notice side effects), AND staying consistent with my prescribed dose today while logging questions for my psychiatrist is the safest way to protect my long-term freedom and creativity.',
  };
}

export const DEFAULT_ULYSSES_CONTRACT: UlyssesContract = {
  enabled: true,
  createdAtWhileEuthymic: '2026-11-01T09:00:00.000Z',
  moodPolarityAtCreation: 0,
  personalManiaProdromes: [
    'Ngủ dưới 4.5 tiếng nhưng vẫn thấy tràn trề năng lượng (Reduced need for sleep)',
    'Lên kế hoạch mua sắm lớn hoặc mở dự án mới sau 23:00 đêm',
    'Nói nhanh, nhảy ý liên tục, bực bội khi người khác không theo kịp',
  ],
  personalDepressionProdromes: [
    'Không ra khỏi giường sau 10:00 sáng trong 2 ngày liên tiếp',
    'Ngừng trả lời tin nhắn của người thân và bỏ bữa sáng',
  ],
  coolDownStepsVi: [
    '1. Chuyển ngay sang chế độ Giao diện Giảm Kích Thích (Low-Stimulus Dark Rest) & tắt thiết bị lúc 22:00.',
    '2. Đưa mọi quyết định chi tiêu > 2.000.000đ hoặc quyết định công việc vào Khoang Chờ 48 Giờ.',
    '3. Duy trì đúng liều thuốc ổn định khí sắc và liên hệ bác sĩ điều trị nếu ngủ < 5h trong 2 đêm.',
  ],
  coolDownStepsEn: [
    '1. Activate Low-Stimulus Dark Rest UI immediately and begin Dark Therapy wind-down at 22:00.',
    '2. Lock all major financial or career decisions in the 48-Hour Impulse Vault.',
    '3. Maintain prescribed mood stabilizers and contact psychiatrist if sleep < 5h for 2 nights.',
  ],
  autoActivateLowStimulusUIAtPole: 2,
  autoEnable48hImpulseVaultAtPole: 2,
  darkTherapyShutdownHour: '22:00',
  trustedContacts: [],
};
