/**
 * Bipolar & Circadian Rhythm Engine (IPSRT, Mania/Mixed Prodrome Detector, 48h Impulse Vault & Baseline-Relative HRV)
 */

import type {
  BipolarPole,
  CrisisProsConsGrid,
  DailyMoodAndRhythmLog,
  HrvBaselineContext,
  ImpulseVaultEntry,
  IntensityRating,
  IpsrtAnchors,
} from '../schemas/models.ts';
import { detectPositiveDistortions } from '../detectors/distortion-detector.ts';

export interface IpsrtStabilityReport {
  stabilityScore: number; // 0-100 (100 = perfect circadian regularity)
  meanAbsoluteDeviationMinutes: number;
  anchorDeviationsMinutes: Partial<Record<keyof IpsrtAnchors, number>>;
  missingAnchors: Array<keyof IpsrtAnchors>;
  status: 'highly-stable' | 'moderately-stable' | 'circadian-drift-alert';
  guidanceVi: string;
  guidanceEn: string;
}

export interface BipolarProdromeEvaluation {
  maniaProdromeDetected: boolean;
  mixedStateDetected: boolean;
  depressionRelapseProdromeDetected: boolean;
  consecutiveShortSleepNights: number;
  recommendedUiMode: 'standard' | 'low-energy-depression' | 'low-stimulus-mania' | 'sos-crisis';
  autoLock48hImpulseVault: boolean;
  blockHighIntensityActivation: boolean;
  notifyUlyssesTrustedContacts: boolean;
  reasonsVi: string[];
  reasonsEn: string[];
}

export interface HrvReadingSample {
  timestamp: string; // ISO-8601
  valueMs: number;
  metricType: 'SDNN' | 'RMSSD';
  deviceId: string;
}

export interface HrvBaselineEvaluation {
  context: HrvBaselineContext;
  p25Ms?: number;
  p50Ms?: number;
  p75Ms?: number;
  latestValueMs?: number;
  ageHours?: number;
  validSamplesInWindow: number;
  shouldMentionAtCheckIn: boolean;
  checkInNoteVi?: string;
  checkInNoteEn?: string;
}

const ANCHOR_KEYS: Array<keyof IpsrtAnchors> = [
  'outOfBedTime',
  'firstSocialContactTime',
  'workOrStudyStartTime',
  'dinnerTime',
  'bedTime',
];

function parseHhMmToMinutes(hhmm: string): number {
  const parts = hhmm.split(':');
  const h = Number(parts[0] ?? 0);
  const m = Number(parts[1] ?? 0);
  return h * 60 + m;
}

/**
 * Computes circular time difference in minutes across midnight (max 720 mins)
 */
export function circularMinutesDifference(timeA: string, timeB: string): number {
  const minA = parseHhMmToMinutes(timeA);
  const minB = parseHhMmToMinutes(timeB);
  const diff = Math.abs(minA - minB);
  return Math.min(diff, 1440 - diff);
}

/**
 * 1. IPSRT Social Rhythm Stability Score Calculator
 * Compares logged daily anchors against the user's target IPSRT anchors (or multi-day mean).
 */
export function calculateIpsrtStabilityScore(
  loggedAnchors: IpsrtAnchors,
  targetAnchors: IpsrtAnchors,
): IpsrtStabilityReport {
  const anchorDeviationsMinutes: Partial<Record<keyof IpsrtAnchors, number>> = {};
  const missingAnchors: Array<keyof IpsrtAnchors> = [];
  let totalDeviation = 0;
  let count = 0;

  for (const key of ANCHOR_KEYS) {
    const logged = loggedAnchors[key];
    const target = targetAnchors[key];
    if (!logged || !target) {
      missingAnchors.push(key);
      continue;
    }
    const dev = circularMinutesDifference(logged, target);
    anchorDeviationsMinutes[key] = dev;
    totalDeviation += dev;
    count += 1;
  }

  if (count === 0) {
    return {
      stabilityScore: 0,
      meanAbsoluteDeviationMinutes: 0,
      anchorDeviationsMinutes,
      missingAnchors,
      status: 'circadian-drift-alert',
      guidanceVi: 'Chưa có mốc nhịp sinh học IPSRT nào được ghi nhận hôm nay. Hãy ưu tiên cố định Giờ thức dậy và Giờ đi ngủ.',
      guidanceEn: 'No IPSRT circadian anchors logged today. Prioritize fixing your out-of-bed and bedtime anchors.',
    };
  }

  const meanDev = totalDeviation / count;
  // Penalty: each 1.5 minutes of average deviation deducts 1 point, plus 5 points penalty per missing anchor
  const rawScore = 100 - meanDev / 1.5 - missingAnchors.length * 5;
  const stabilityScore = Math.max(0, Math.min(100, Math.round(rawScore)));

  let status: IpsrtStabilityReport['status'] = 'highly-stable';
  let guidanceVi = 'Nhịp sinh học IPSRT của bạn rất ổn định (độ lệch thấp). Đây là lá chắn tốt nhất bảo vệ bình ổn khí sắc.';
  let guidanceEn = 'Your IPSRT social rhythm is highly stable. Circadian regularity is your strongest shield for mood stability.';

  if (stabilityScore < 60 || meanDev > 60) {
    status = 'circadian-drift-alert';
    guidanceVi =
      'Cảnh báo lệch nhịp sinh học (> 60 phút): Sự xáo trộn giờ giấc ngủ/thức dễ châm ngòi chuyển pha Lưỡng cực. Hãy neo lại Giờ thức dậy sáng mai đúng giờ.';
    guidanceEn =
      'Circadian Drift Alert (> 60 min deviation): Irregular sleep/wake timing can trigger a bipolar mood switch. Anchor tomorrow morning’s wake time strictly.';
  } else if (stabilityScore < 80) {
    status = 'moderately-stable';
    guidanceVi = 'Nhịp sinh học ở mức khá ổn định, hãy chú ý giữ giờ đi ngủ đêm nay không lệch quá 30 phút.';
    guidanceEn = 'Social rhythm is moderately stable; aim to keep tonight’s bedtime within 30 minutes of your target anchor.';
  }

  return {
    stabilityScore,
    meanAbsoluteDeviationMinutes: Math.round(meanDev),
    anchorDeviationsMinutes,
    missingAnchors,
    status,
    guidanceVi,
    guidanceEn,
  };
}

/**
 * 2. Bipolar Mania Prodrome & Mixed State Detector
 * - Mixed State: Mood <= -2 AND Energy >= +2 -> Immediate DBT TIPP + Clinician Alert
 * - Mania Prodrome:
 *   * Sleep < 5h for >= 2 nights + reduced_need / no_need_at_all, OR
 *   * Latest Sleep < 5h + reduced_need AND Mood >= +2, OR
 *   * ASRM >= 6, OR
 *   * Mood >= +2
 */
export function evaluateBipolarProdromeAndMixedState(params: {
  recentLogs: DailyMoodAndRhythmLog[]; // Ordered chronologically or reverse; sorted internally by loggedAt
  asrmScore?: number;
  hrvConsecutiveBelowBaselineDays?: number;
}): BipolarProdromeEvaluation {
  const sorted = [...params.recentLogs].sort(
    (a, b) => Date.parse(a.loggedAt) - Date.parse(b.loggedAt),
  );
  const latest = sorted[sorted.length - 1];
  const asrm = params.asrmScore ?? 0;

  const reasonsVi: string[] = [];
  const reasonsEn: string[] = [];

  if (!latest) {
    return {
      maniaProdromeDetected: asrm >= 6,
      mixedStateDetected: false,
      depressionRelapseProdromeDetected: false,
      consecutiveShortSleepNights: 0,
      recommendedUiMode: asrm >= 6 ? 'low-stimulus-mania' : 'standard',
      autoLock48hImpulseVault: asrm >= 6,
      blockHighIntensityActivation: asrm >= 6,
      notifyUlyssesTrustedContacts: asrm >= 6,
      reasonsVi: asrm >= 6 ? ['Điểm thang đo Hưng cảm ASRM >= 6.'] : [],
      reasonsEn: asrm >= 6 ? ['Altman Mania Scale (ASRM) score >= 6.'] : [],
    };
  }

  // Count consecutive short-sleep nights (< 5 hours) from the tail
  let consecutiveShortSleepNights = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const log = sorted[i]!;
    if (log.sleepDurationHours < 5) {
      consecutiveShortSleepNights += 1;
    } else {
      break;
    }
  }

  // 1. Check Mixed State (Dysphoric Arousal: Mood <= -2 AND Energy >= +2)
  const mixedStateDetected = latest.moodPolarity <= -2 && latest.energyLevel >= 2;
  if (mixedStateDetected) {
    reasonsVi.push(
      `Phát hiện Pha Hỗn hợp (Mixed State): Khí sắc trầm (${latest.moodPolarity}) đi kèm Năng lượng kích động cao (+${latest.energyLevel}). Ưu tiên tuyệt đối DBT TIPP và liên hệ bác sĩ điều trị.`,
    );
    reasonsEn.push(
      `Mixed State Detected (Dysphoric Arousal): Depressed mood (${latest.moodPolarity}) combined with elevated energy (+${latest.energyLevel}). Immediately prioritize DBT TIPP and contact your psychiatrist.`,
    );
  }

  // 2. Check Mania Prodrome
  const hasReducedNeedForSleep =
    latest.feltNeedForSleep === 'reduced_need' || latest.feltNeedForSleep === 'no_need_at_all';
  const sleepProdrome =
    (consecutiveShortSleepNights >= 2 && hasReducedNeedForSleep) ||
    (latest.sleepDurationHours < 5 && hasReducedNeedForSleep && latest.moodPolarity >= 1);
  const moodOrAsrmMania = latest.moodPolarity >= 2 || asrm >= 6;
  const maniaProdromeDetected = sleepProdrome || moodOrAsrmMania;

  if (sleepProdrome) {
    reasonsVi.push(
      `Cảnh báo Tiền triệu Hưng cảm (Mania Prodrome): Ngủ < 5 giờ (${latest.sleepDurationHours}h) kèm giảm nhu cầu ngủ (${latest.feltNeedForSleep}).`,
    );
    reasonsEn.push(
      `Mania Prodrome Alert: Sleep < 5 hours (${latest.sleepDurationHours}h) with reduced felt need for sleep (${latest.feltNeedForSleep}).`,
    );
  }
  if (latest.moodPolarity >= 2) {
    reasonsVi.push(`Cực khí sắc đang ở vùng Hưng cảm nhẹ / Hưng cảm (+${latest.moodPolarity}).`);
    reasonsEn.push(`Mood polarity is in the Hypomanic / Manic zone (+${latest.moodPolarity}).`);
  }
  if (asrm >= 6) {
    reasonsVi.push(`Điểm thang đo ASRM = ${asrm} (vượt ngưỡng >= 6).`);
    reasonsEn.push(`ASRM Mania Scale score = ${asrm} (exceeds cutoff >= 6).`);
  }

  // 3. Check Depression Relapse Prodrome
  const hrvLowDays = params.hrvConsecutiveBelowBaselineDays ?? 0;
  const depressionRelapseProdromeDetected =
    !mixedStateDetected &&
    (latest.moodPolarity <= -3 ||
      (latest.sleepDurationHours > 10 && hrvLowDays >= 3) ||
      (latest.moodPolarity <= -2 && latest.energyLevel <= -2));

  if (depressionRelapseProdromeDetected) {
    reasonsVi.push(
      'Dấu hiệu Trầm cảm Lưỡng cực: Kích hoạt giao diện Low-Energy Mode và Micro-Activation có trần năng lượng (tránh Manic Switch).',
    );
    reasonsEn.push(
      'Bipolar Depressive Pole detected: Activating Low-Energy UI Mode and paced Micro-Activation (preventing Manic Switch).',
    );
  }

  let recommendedUiMode: BipolarProdromeEvaluation['recommendedUiMode'] = 'standard';
  if (mixedStateDetected) {
    recommendedUiMode = 'sos-crisis';
  } else if (maniaProdromeDetected) {
    recommendedUiMode = 'low-stimulus-mania';
  } else if (latest.moodPolarity <= -3) {
    recommendedUiMode = 'low-energy-depression';
  }

  return {
    maniaProdromeDetected,
    mixedStateDetected,
    depressionRelapseProdromeDetected,
    consecutiveShortSleepNights,
    recommendedUiMode,
    autoLock48hImpulseVault: maniaProdromeDetected,
    blockHighIntensityActivation: maniaProdromeDetected || mixedStateDetected,
    notifyUlyssesTrustedContacts:
      mixedStateDetected || latest.moodPolarity >= 3 || latest.moodPolarity <= -3 || asrm >= 10,
    reasonsVi,
    reasonsEn,
  };
}

/**
 * 3. 48-Hour Impulse Vault Manager (Khoang Trì hoãn Quyết định 48 Giờ)
 */
export const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

export function createImpulseVaultEntry(params: {
  id: string;
  userId: string;
  impulseTitle: string;
  category: ImpulseVaultEntry['category'];
  estimatedCostOrImpact: string;
  moodPolarityAtLock: BipolarPole;
  energyLevelAtLock: BipolarPole;
  urgeIntensityAtLock: IntensityRating;
  crisisProsCons?: CrisisProsConsGrid;
  twoPersonRealityCheckContacts?: string[];
  createdAt?: string;
}): ImpulseVaultEntry {
  const nowIso = params.createdAt ?? new Date().toISOString();
  const createdMs = Date.parse(nowIso);
  const unlocksAtIso = new Date(createdMs + FORTY_EIGHT_HOURS_MS).toISOString();

  const detectedPos = detectPositiveDistortions(params.impulseTitle).map((d) => d.id);

  const devilsAdvocateReflections = [
    'Nếu ý tưởng/quyết định này thực sự xuất sắc hôm nay, sau 48 giờ và 2 đêm ngủ đủ 7 tiếng nó vẫn sẽ còn nguyên giá trị.',
    'Đâu là 2 rủi ro tài chính, sức khỏe hoặc mối quan hệ mà trạng thái hưng phấn đang tạm thời che khuất?',
    'Hai người tin cậy trong Giao ước Ulysses của bạn sẽ nhận xét thế nào về quyết định này?',
  ];

  return {
    id: params.id,
    userId: params.userId,
    impulseTitle: params.impulseTitle,
    category: params.category,
    estimatedCostOrImpact: params.estimatedCostOrImpact,
    moodPolarityAtLock: params.moodPolarityAtLock,
    energyLevelAtLock: params.energyLevelAtLock,
    urgeIntensityAtLock: params.urgeIntensityAtLock,
    positiveDistortionsDetected: detectedPos,
    devilsAdvocateReflections,
    crisisProsCons: params.crisisProsCons ?? {
      actingNowPros: ['Giải tỏa cơn bốc đồng / hưng phấn tức thời trong 15 phút đầu'],
      actingNowCons: ['Nguy cơ thiệt hại tài chính, mất ngủ, hối tiếc sâu sắc khi qua pha hưng cảm'],
      waiting48hPros: ['Bảo toàn tài chính, uy tín, giữ quyền tự chủ và tham khảo được 2 người tin cậy'],
      waiting48hCons: ['Chịu đựng cảm giác bồn chồn, sốt ruột tạm thời trong hôm nay'],
    },
    twoPersonRealityCheckContacts: params.twoPersonRealityCheckContacts ?? [],
    twoPersonConsultedCount: 0,
    createdAt: nowIso,
    unlocksAt: unlocksAtIso,
    status: 'locked',
  };
}

export function evaluateImpulseVaultStatus(
  entry: ImpulseVaultEntry,
  nowIso: string = new Date().toISOString(),
  currentMoodPolarity: BipolarPole = 0,
): {
  canUnlock: boolean;
  remainingHours: number;
  twoPersonCheckSatisfied: boolean;
  recommendationVi: string;
  recommendationEn: string;
} {
  const nowMs = Date.parse(nowIso);
  const unlockMs = Date.parse(entry.unlocksAt);
  const diffMs = unlockMs - nowMs;
  const remainingHours = Math.max(0, Number((diffMs / (1000 * 60 * 60)).toFixed(1)));
  const timeElapsed = diffMs <= 0;
  const twoPersonCheckSatisfied =
    entry.twoPersonRealityCheckContacts.length === 0 || entry.twoPersonConsultedCount >= 2;
  const canUnlock = timeElapsed && twoPersonCheckSatisfied && currentMoodPolarity < 3;

  let recommendationVi = '';
  let recommendationEn = '';

  if (!timeElapsed) {
    recommendationVi = `Khoang Trì hoãn 48 Giờ đang khóa bảo vệ bạn (còn ${remainingHours} giờ). Hãy thực hành Dark Rest và ngủ đủ giấc trước khi xem lại.`;
    recommendationEn = `48-Hour Impulse Vault is actively protecting this decision (${remainingHours}h remaining). Practice Dark Rest and get full sleep first.`;
  } else if (!twoPersonCheckSatisfied) {
    recommendationVi =
      'Đã hết 48 giờ chờ, nhưng bạn cần hoàn thành Quy tắc Tham khảo 2 Người Tin cậy (Two-Person Reality Check) trước khi mở khóa.';
    recommendationEn =
      '48 hours have elapsed, but please complete your Two-Person Reality Check with 2 trusted contacts before unlocking.';
  } else if (currentMoodPolarity >= 3) {
    recommendationVi =
      'Cực khí sắc hiện tại vẫn đang ở mức Hưng cảm cao (>= +3). Khuyến nghị gia hạn khóa thêm 24-48 giờ để bảo vệ an toàn.';
    recommendationEn =
      'Current mood polarity remains elevated (>= +3). Extending the vault lock for another 24-48 hours is strongly recommended.';
  } else {
    recommendationVi =
      'Đã đủ 48 giờ và qua kiểm chứng thực tế. Bạn có thể xem lại quyết định này bằng Tâm Trí Tuệ (Wise Mind) hoặc hủy bỏ nếu thấy không còn cần thiết.';
    recommendationEn =
      '48 hours elapsed and reality check complete. You may now review this decision in Wise Mind or cancel it if the urge has passed.';
  }

  return {
    canUnlock,
    remainingHours,
    twoPersonCheckSatisfied,
    recommendationVi,
    recommendationEn,
  };
}

/**
 * 4. Baseline-Relative HRV Calculator (health-integration.md)
 * - Uses ONLY personal 25th-75th percentile over 14-30 days on the SAME device and metric
 * - Requires >= 7 valid readings in the 14-30 day baseline window
 * - Enforces strict < 12 hours freshness gate
 * - Never compares pre/post HRV within a single session
 */
function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  const index = (percentile / 100) * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sortedValues[lower]!;
  const weight = index - lower;
  return sortedValues[lower]! * (1 - weight) + sortedValues[upper]! * weight;
}

export function evaluateBaselineRelativeHrv(params: {
  latestReading: HrvReadingSample;
  historicalReadings: HrvReadingSample[];
  nowIso?: string;
}): HrvBaselineEvaluation {
  const nowMs = Date.parse(params.nowIso ?? new Date().toISOString());
  const latestMs = Date.parse(params.latestReading.timestamp);
  const ageHours = Number(((nowMs - latestMs) / (1000 * 60 * 60)).toFixed(2));

  // Filter historical readings to:
  // 1) Same deviceId and same metricType (SDNN vs RMSSD cannot be mixed)
  // 2) Within the 30-day window prior to now
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const matchingWindowSamples = params.historicalReadings.filter((sample) => {
    const t = Date.parse(sample.timestamp);
    return (
      sample.deviceId === params.latestReading.deviceId &&
      sample.metricType === params.latestReading.metricType &&
      nowMs - t <= thirtyDaysMs &&
      t <= nowMs
    );
  });

  if (matchingWindowSamples.length < 7) {
    return {
      context: 'insufficient-baseline-data',
      latestValueMs: params.latestReading.valueMs,
      ageHours,
      validSamplesInWindow: matchingWindowSamples.length,
      shouldMentionAtCheckIn: false,
    };
  }

  const sortedValues = matchingWindowSamples.map((s) => s.valueMs).sort((a, b) => a - b);
  const p25Ms = Number(calculatePercentile(sortedValues, 25).toFixed(2));
  const p50Ms = Number(calculatePercentile(sortedValues, 50).toFixed(2));
  const p75Ms = Number(calculatePercentile(sortedValues, 75).toFixed(2));

  // Strict 12-hour freshness rule
  if (ageHours > 12) {
    return {
      context: 'stale',
      p25Ms,
      p50Ms,
      p75Ms,
      latestValueMs: params.latestReading.valueMs,
      ageHours,
      validSamplesInWindow: matchingWindowSamples.length,
      shouldMentionAtCheckIn: false,
    };
  }

  let context: HrvBaselineContext = 'within-baseline';
  if (params.latestReading.valueMs < p25Ms) {
    context = 'below-baseline';
  } else if (params.latestReading.valueMs > p75Ms) {
    context = 'above-baseline';
  }

  const shouldMentionAtCheckIn = context === 'below-baseline';

  return {
    context,
    p25Ms,
    p50Ms,
    p75Ms,
    latestValueMs: params.latestReading.valueMs,
    ageHours,
    validSamplesInWindow: matchingWindowSamples.length,
    shouldMentionAtCheckIn,
    checkInNoteVi: shouldMentionAtCheckIn
      ? `Chỉ số HRV (${params.latestReading.metricType}) gần nhất thấp hơn ngưỡng phân vị 25th cá nhân 30 ngày của bạn — hệ thần kinh có thể đang chịu tải sinh học cao, hôm nay mình ưu tiên nhịp độ nhẹ nhàng nhé.`
      : undefined,
    checkInNoteEn: shouldMentionAtCheckIn
      ? `Your latest HRV (${params.latestReading.metricType}) is below your personal 30-day 25th percentile baseline — your nervous system may be carrying extra load today, so let’s keep our pace gentle.`
      : undefined,
  };
}
