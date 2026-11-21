import { detectSafetyBehaviors } from './detectors.ts';
import type {
  ExposureHierarchyItem,
  ExposureTrialLog,
  PredictionCalibrationEntry,
  WorryBoxItem,
} from './types.ts';

/**
 * 4. Anxiety Gold-Standard Hub
 * - Worry Box (Worry Postponement) with scheduled 15-min worry window & Productive vs. Hypothetical sorter
 * - Exposure Hierarchy Builder (ERP & Interoceptive Exposure) with SUDS 0-100 habituation tracking & Safety Behavior Detector
 * - Prediction Calibration Tracker (predicted catastrophe % vs. actual outcome history)
 */

export function createWorryBoxEntry(params: {
  rawWorryText: string;
  scheduledWindowTime?: string;
}): WorryBoxItem {
  const isHypothetical = /(nhỡ đâu|lỡ như|3 năm nữa|what if|someday|might happen in the future|không kiểm soát được)/i.test(
    params.rawWorryText
  );
  return {
    id: `worry-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    rawWorryText: params.rawWorryText,
    scheduledWindowTime: params.scheduledWindowTime ?? '17:30 - 17:45 (15 min)',
    category: isHypothetical ? 'hypothetical' : 'productive',
    status: 'postponed',
  };
}

export function sortAndProcessWorryItem(
  item: WorryBoxItem,
  category: 'productive' | 'hypothetical',
  userActionOrAcceptanceNote: string
): {
  updatedItem: WorryBoxItem;
  clinicalProtocolVi: string;
  clinicalProtocolEn: string;
} {
  const updatedItem: WorryBoxItem = {
    ...item,
    category,
    status: category === 'productive' ? 'processed' : 'let_go',
    actionPlanOrAcceptanceNote: userActionOrAcceptanceNote,
  };

  if (category === 'productive') {
    return {
      updatedItem,
      clinicalProtocolVi:
        'Lo lắng Có thể Giải quyết (Productive Worry): Đã chuyển sang Hành động Giải quyết Vấn đề (1 bước nhỏ thực hiện được ngay hôm nay).',
      clinicalProtocolEn:
        'Productive / Actionable Worry: Converted into a concrete 5-minute Problem-Solving step today.',
    };
  }

  return {
    updatedItem,
    clinicalProtocolVi:
      'Lo lắng Giả định "Nhỡ đâu..." (Hypothetical What-If Worry): Không thể giải quyết bằng hành động lúc này. Áp dụng DBT Radical Acceptance & Urge Surfing (quan sát suy nghĩ trôi qua như đám mây trong khung giờ 15 phút rồi đóng hộp).',
    clinicalProtocolEn:
      'Hypothetical "What-If" Worry: Outside immediate control. Apply DBT Radical Acceptance & Urge Surfing within your 15-minute window, then gently let it go.',
  };
}

/**
 * Exposure Hierarchy Builder (In-Vivo ERP, Interoceptive Exposure, Shame-Attacking)
 */
export function buildExposureHierarchyLadder(
  items: Array<{
    id?: string;
    title: string;
    exposureType: 'in-vivo-erp' | 'interoceptive' | 'shame-attacking';
    baselineSuds: number; // 0-100
    notesForSafetyBehaviorCheck?: string;
    interoceptiveMedicalCleared?: boolean;
  }>
): ExposureHierarchyItem[] {
  return items
    .map((raw, idx) => {
      const clampedSuds = Math.max(0, Math.min(100, Math.round(raw.baselineSuds)));
      const safetyBehaviors = detectSafetyBehaviors(
        `${raw.title} ${raw.notesForSafetyBehaviorCheck ?? ''}`
      );
      return {
        id: raw.id ?? `exp-${idx + 1}`,
        title: raw.title,
        exposureType: raw.exposureType,
        baselineSuds: clampedSuds,
        currentSuds: clampedSuds,
        detectedSafetyBehaviors: safetyBehaviors,
        interoceptiveMedicalCleared:
          raw.exposureType === 'interoceptive' ? Boolean(raw.interoceptiveMedicalCleared) : true,
        trials: [],
        habituationAchieved: false,
      };
    })
    .sort((a, b) => a.baselineSuds - b.baselineSuds); // Ladder sorted from lowest SUDS to highest SUDS
}

export function recordExposureTrial(
  item: ExposureHierarchyItem,
  trialInput: {
    preSuds: number;
    peakSuds: number;
    postSuds: number;
    durationMinutes: number;
    safetyBehaviorsDropped: boolean;
  }
): {
  updatedItem: ExposureHierarchyItem;
  inhibitoryLearningFeedbackVi: string;
  inhibitoryLearningFeedbackEn: string;
} {
  if (item.exposureType === 'interoceptive' && !item.interoceptiveMedicalCleared) {
    throw new Error(
      'Medical Safety Gate: Interoceptive exposure requires medical clearance before starting trial.'
    );
  }

  const trialNumber = item.trials.length + 1;
  const newTrial: ExposureTrialLog = {
    trialNumber,
    timestamp: new Date().toISOString(),
    preSuds: Math.max(0, Math.min(100, trialInput.preSuds)),
    peakSuds: Math.max(0, Math.min(100, trialInput.peakSuds)),
    postSuds: Math.max(0, Math.min(100, trialInput.postSuds)),
    durationMinutes: trialInput.durationMinutes,
    safetyBehaviorsDropped: trialInput.safetyBehaviorsDropped,
  };

  const trials = [...item.trials, newTrial];
  const habituationDrop = item.baselineSuds - newTrial.postSuds;
  const habituationAchieved =
    trialInput.safetyBehaviorsDropped &&
    (newTrial.postSuds <= item.baselineSuds * 0.5 || newTrial.postSuds <= 25);

  const updatedItem: ExposureHierarchyItem = {
    ...item,
    currentSuds: newTrial.postSuds,
    trials,
    habituationAchieved,
  };

  const warningSafetyVi = !trialInput.safetyBehaviorsDropped
    ? ' Lưu ý: Bạn vẫn còn giữ hành vi an toàn ngầm — lần tới hãy thả bỏ hành vi an toàn để não bộ học được rằng bạn thực sự an toàn (Inhibitory Learning).'
    : ' Tuyệt vời: Bạn đã bỏ hoàn toàn hành vi an toàn!';

  const warningSafetyEn = !trialInput.safetyBehaviorsDropped
    ? ' Note: Subtle safety behaviors were used — drop them on the next trial to maximize Inhibitory Learning.'
    : ' Excellent: You dropped all safety behaviors!';

  return {
    updatedItem,
    inhibitoryLearningFeedbackVi: `Lần tiếp xúc #${trialNumber}: SUDS đỉnh ${newTrial.peakSuds}/100 -> hạ xuống ${newTrial.postSuds}/100 (Giảm ${habituationDrop} điểm so với ban đầu).${warningSafetyVi}`,
    inhibitoryLearningFeedbackEn: `Exposure Trial #${trialNumber}: Peak SUDS ${newTrial.peakSuds}/100 -> dropped to ${newTrial.postSuds}/100 (${habituationDrop} pt drop from baseline).${warningSafetyEn}`,
  };
}

/**
 * Prediction Calibration Tracker (Catastrophe Predicted % vs Actual Reality)
 */
export interface PredictionCalibrationStats {
  totalLogged: number;
  resolvedCount: number;
  averagePredictedCatastrophePercent: number;
  actualCatastropheRatePercent: number;
  catastrophesThatNeverHappenedCount: number;
  calibrationInsightVi: string;
  calibrationInsightEn: string;
}

export function computePredictionCalibrationStats(
  entries: PredictionCalibrationEntry[]
): PredictionCalibrationStats {
  const totalLogged = entries.length;
  const resolved = entries.filter((e) => e.resolved);
  const resolvedCount = resolved.length;

  if (resolvedCount === 0) {
    return {
      totalLogged,
      resolvedCount: 0,
      averagePredictedCatastrophePercent: 0,
      actualCatastropheRatePercent: 0,
      catastrophesThatNeverHappenedCount: 0,
      calibrationInsightVi: 'Chưa có dự đoán nào được đối chiếu kết quả thực tế.',
      calibrationInsightEn: 'No predictions resolved with actual outcomes yet.',
    };
  }

  const avgPredicted = Math.round(
    resolved.reduce((acc, e) => acc + e.predictedProbabilityPercent, 0) / resolvedCount
  );
  const happenedCount = resolved.filter((e) => e.catastropheActuallyHappened).length;
  const neverHappenedCount = resolvedCount - happenedCount;
  const actualRate = Math.round((happenedCount / resolvedCount) * 100);

  return {
    totalLogged,
    resolvedCount,
    averagePredictedCatastrophePercent: avgPredicted,
    actualCatastropheRatePercent: actualRate,
    catastrophesThatNeverHappenedCount: neverHappenedCount,
    calibrationInsightVi: `Hiệu chỉnh Dự đoán (Prediction Calibration): Trong ${resolvedCount} lần tâm trí dự đoán thảm họa xảy ra (xác suất dự đoán trung bình ${avgPredicted}%), có tới ${neverHappenedCount}/${resolvedCount} lần mọi việc diễn ra an toàn (tỷ lệ thảm họa thực tế chỉ ${actualRate}%).`,
    calibrationInsightEn: `Prediction Calibration: Across ${resolvedCount} feared events (average predicted catastrophe probability ${avgPredicted}%), ${neverHappenedCount} out of ${resolvedCount} never happened (actual rate: ${actualRate}%).`,
  };
}
