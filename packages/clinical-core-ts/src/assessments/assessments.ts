/**
 * Standardized Clinical Self-Assessments Scoring, Bilingual Interpretation & Alert Triggers
 * - BMS (Dr. David Burns Brief Mood Survey - TEAM-CBT Testing)
 * - PHQ-9 (Patient Health Questionnaire-9 for Depression, 0-27)
 * - GAD-7 (Generalized Anxiety Disorder-7, 0-21)
 * - ASRM (Altman Self-Rating Mania Scale, 0-20, cutoff >= 6)
 * - MDQ (Mood Disorder Questionnaire for Bipolar Spectrum Screening)
 * - ISI (Insomnia Severity Index, 0-28, with Bipolar Mania vs. Depressive Insomnia differential)
 */

import type { FeltNeedForSleep } from '../schemas/models.ts';

export type AssessmentScaleId = 'BMS' | 'PHQ-9' | 'GAD-7' | 'ASRM' | 'MDQ' | 'ISI';

export interface AssessmentEvaluationResult {
  scale: AssessmentScaleId;
  totalScore: number;
  maxPossibleScore: number;
  severityCode: string;
  labelVi: string;
  labelEn: string;
  clinicalRecommendationVi: string;
  clinicalRecommendationEn: string;
  safetyStopTriggered: boolean;
  hypomaniaGuardTriggered: boolean;
  clinicianReferralRecommended: boolean;
  subscales?: Record<string, number>;
  disclaimerVi: string;
  disclaimerEn: string;
}

const CLINICAL_DISCLAIMER_VI =
  'Công cụ tự theo dõi và sàng lọc triệu chứng, không thay thế chẩn đoán y khoa hay chỉ định thuốc của bác sĩ chuyên khoa tâm thần.';
const CLINICAL_DISCLAIMER_EN =
  'Self-monitoring and symptom screening tool only; does not replace formal medical diagnosis or psychiatric prescribing.';

function sumScores(items: number[], minItem: number, maxItem: number, expectedLength: number, scaleName: string): number {
  if (items.length !== expectedLength) {
    throw new Error(`${scaleName} requires exactly ${expectedLength} item scores (received ${items.length}).`);
  }
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    const val = items[i]!;
    if (!Number.isInteger(val) || val < minItem || val > maxItem) {
      throw new Error(`${scaleName} item[${i}] must be an integer between ${minItem} and ${maxItem} (received ${val}).`);
    }
    total += val;
  }
  return total;
}

/**
 * 1. BMS (David Burns Brief Mood Survey - TEAM-CBT Testing before & after session)
 * Each subscale item is rated 0..4:
 * - depressionItems: 5 items (0-20)
 * - suicidalUrgesItems: 2 items (0-8) -> ANY score >= 1 triggers immediate Safety Stop!
 * - anxietyItems: 5 items (0-20)
 * - angerItems: 5 items (0-20)
 * - positiveFeelingsItems: 5 items (0-20)
 */
export function scoreBriefMoodSurvey(input: {
  depressionItems: number[]; // 5 items (0-4 each)
  suicidalUrgesItems: number[]; // 2 items (0-4 each)
  anxietyItems: number[]; // 5 items (0-4 each)
  angerItems: number[]; // 5 items (0-4 each)
  positiveFeelingsItems: number[]; // 5 items (0-4 each)
}): AssessmentEvaluationResult {
  const dep = sumScores(input.depressionItems, 0, 4, 5, 'BMS.depressionItems');
  const sui = sumScores(input.suicidalUrgesItems, 0, 4, 2, 'BMS.suicidalUrgesItems');
  const anx = sumScores(input.anxietyItems, 0, 4, 5, 'BMS.anxietyItems');
  const ang = sumScores(input.angerItems, 0, 4, 5, 'BMS.angerItems');
  const pos = sumScores(input.positiveFeelingsItems, 0, 4, 5, 'BMS.positiveFeelingsItems');

  const safetyStopTriggered = sui >= 1;
  const totalDistress = dep + sui + anx + ang;

  let severityCode = 'low-distress';
  let labelVi = 'Khí sắc ổn định / Căng thẳng thấp';
  let labelEn = 'Low Distress / Stable Mood';

  if (safetyStopTriggered) {
    severityCode = 'suicidal-alert';
    labelVi = 'CẢNH BÁO AN TOÀN: Phát hiện ý nghĩ hoặc xung động tự sát (BMS Suicide >= 1)';
    labelEn = 'SAFETY ALERT: Suicidal ideation or urges detected (BMS Suicide >= 1)';
  } else if (dep >= 11 || anx >= 11 || ang >= 11) {
    severityCode = 'moderate-to-severe';
    labelVi = 'Căng thẳng cảm xúc mức Trung bình - Nặng';
    labelEn = 'Moderate to Severe Emotional Distress';
  } else if (dep >= 5 || anx >= 5 || ang >= 5) {
    severityCode = 'mild';
    labelVi = 'Căng thẳng cảm xúc mức Nhẹ';
    labelEn = 'Mild Emotional Distress';
  }

  return {
    scale: 'BMS',
    totalScore: totalDistress,
    maxPossibleScore: 68,
    severityCode,
    labelVi,
    labelEn,
    clinicalRecommendationVi: safetyStopTriggered
      ? 'Kích hoạt ngay luồng Safety Stop, hiển thị Đường dây nóng Khủng hoảng và Kế hoạch An toàn.'
      : 'Sử dụng điểm BMS trước và sau phiên để đo lường hiệu quả kỹ thuật TEAM-CBT (T = Testing).',
    clinicalRecommendationEn: safetyStopTriggered
      ? 'Trigger immediate Safety Stop, display Crisis Hotlines and Safety Plan.'
      : 'Use pre- and post-session BMS scores to measure TEAM-CBT session efficacy (T = Testing).',
    safetyStopTriggered,
    hypomaniaGuardTriggered: false,
    clinicianReferralRecommended: safetyStopTriggered || dep >= 13 || anx >= 13,
    subscales: {
      depression: dep,
      suicidalUrges: sui,
      anxiety: anx,
      anger: ang,
      positiveFeelings: pos,
    },
    disclaimerVi: CLINICAL_DISCLAIMER_VI,
    disclaimerEn: CLINICAL_DISCLAIMER_EN,
  };
}

/**
 * 2. PHQ-9 (Patient Health Questionnaire-9, 9 items rated 0-3, total 0-27)
 * Item 9 (index 8) measures thoughts of death or self-harm -> score > 0 triggers Safety Stop!
 */
export function scorePhq9(items: number[]): AssessmentEvaluationResult {
  const total = sumScores(items, 0, 3, 9, 'PHQ-9');
  const item9Score = items[8]!;
  const safetyStopTriggered = item9Score > 0;

  let severityCode = 'minimal';
  let labelVi = 'Không có hoặc Trầm cảm tối thiểu (0-4)';
  let labelEn = 'Minimal or No Depression (0-4)';

  if (total >= 20) {
    severityCode = 'severe';
    labelVi = 'Trầm cảm Nặng (20-27)';
    labelEn = 'Severe Depression (20-27)';
  } else if (total >= 15) {
    severityCode = 'moderately-severe';
    labelVi = 'Trầm cảm Trung bình - Nặng (15-19)';
    labelEn = 'Moderately Severe Depression (15-19)';
  } else if (total >= 10) {
    severityCode = 'moderate';
    labelVi = 'Trầm cảm Trung bình (10-14)';
    labelEn = 'Moderate Depression (10-14)';
  } else if (total >= 5) {
    severityCode = 'mild';
    labelVi = 'Trầm cảm Nhẹ (5-9)';
    labelEn = 'Mild Depression (5-9)';
  }

  return {
    scale: 'PHQ-9',
    totalScore: total,
    maxPossibleScore: 27,
    severityCode,
    labelVi,
    labelEn,
    clinicalRecommendationVi: safetyStopTriggered
      ? 'Câu số 9 > 0: Kích hoạt ngay Safety Stop & Đường dây nóng. Khuyến nghị gặp bác sĩ chuyên khoa tâm thần ngay.'
      : total >= 15
        ? 'Điểm PHQ-9 >= 15: Khuyến nghị thăm khám bác sĩ chuyên khoa tâm thần kết hợp Kích hoạt Hành vi (Behavioral Activation có Rest Check) và giao diện Low-Energy Mode.'
        : 'Thực hành Behavioral Activation, Thought Record và chăm sóc nhịp sinh học ABC PLEASE.',
    clinicalRecommendationEn: safetyStopTriggered
      ? 'Item 9 > 0: Immediate Safety Stop & Crisis Hotline activation. Urgent psychiatric evaluation recommended.'
      : total >= 15
        ? 'PHQ-9 >= 15: Recommend psychiatric consultation alongside Behavioral Activation (with Rest Check) and Low-Energy UI Mode.'
        : 'Practice Behavioral Activation, Thought Record, and DBT ABC PLEASE biological care.',
    safetyStopTriggered,
    hypomaniaGuardTriggered: false,
    clinicianReferralRecommended: total >= 15 || safetyStopTriggered,
    subscales: {
      item9SuicidalIdeation: item9Score,
    },
    disclaimerVi: CLINICAL_DISCLAIMER_VI,
    disclaimerEn: CLINICAL_DISCLAIMER_EN,
  };
}

/**
 * 3. GAD-7 (Generalized Anxiety Disorder-7, 7 items rated 0-3, total 0-21)
 */
export function scoreGad7(items: number[]): AssessmentEvaluationResult {
  const total = sumScores(items, 0, 3, 7, 'GAD-7');

  let severityCode = 'minimal';
  let labelVi = 'Lo âu tối thiểu (0-4)';
  let labelEn = 'Minimal Anxiety (0-4)';

  if (total >= 15) {
    severityCode = 'severe';
    labelVi = 'Rối loạn Lo âu Nặng (15-21)';
    labelEn = 'Severe Anxiety (15-21)';
  } else if (total >= 10) {
    severityCode = 'moderate';
    labelVi = 'Rối loạn Lo âu Trung bình (10-14)';
    labelEn = 'Moderate Anxiety (10-14)';
  } else if (total >= 5) {
    severityCode = 'mild';
    labelVi = 'Lo âu Nhẹ (5-9)';
    labelEn = 'Mild Anxiety (5-9)';
  }

  return {
    scale: 'GAD-7',
    totalScore: total,
    maxPossibleScore: 21,
    severityCode,
    labelVi,
    labelEn,
    clinicalRecommendationVi:
      total >= 10
        ? 'Điểm GAD-7 >= 10: Gợi ý lộ trình 4 Mô hình Lo âu (TEAM-CBT Paradoxical Agenda Setting, Worry Box 15 phút/ngày, Exposure Hierarchy) kèm thở dẫn nhịp hàng ngày.'
        : 'Duy trì Hộp Lo âu (Worry Box) và bài tập thở chánh niệm khi cần.',
    clinicalRecommendationEn:
      total >= 10
        ? 'GAD-7 >= 10: Recommend the 4-Model Anxiety Protocol (TEAM-CBT Paradoxical Agenda Setting, 15-min Worry Box, Exposure Hierarchy) plus daily paced breathing.'
        : 'Maintain Worry Postponement and mindful breathing as needed.',
    safetyStopTriggered: false,
    hypomaniaGuardTriggered: false,
    clinicianReferralRecommended: total >= 10,
    disclaimerVi: CLINICAL_DISCLAIMER_VI,
    disclaimerEn: CLINICAL_DISCLAIMER_EN,
  };
}

/**
 * 4. ASRM (Altman Self-Rating Mania Scale, 5 items rated 0-4, total 0-20)
 * Clinical cutoff >= 6 indicates high sensitivity (85.5%) for Acute Mania / Hypomania!
 */
export function scoreAsrm(items: number[]): AssessmentEvaluationResult {
  const total = sumScores(items, 0, 4, 5, 'ASRM');
  const hypomaniaGuardTriggered = total >= 6;

  let severityCode = 'euthymic-normal';
  let labelVi = 'Không có dấu hiệu Hưng cảm (0-5)';
  let labelEn = 'No Significant Manic Symptoms (0-5)';

  if (total >= 12) {
    severityCode = 'high-mania-probability';
    labelVi = 'CẢNH BÁO ĐỎ: Khả năng Hưng cảm Cấp rất cao (ASRM >= 12)';
    labelEn = 'RED ALERT: High Probability of Acute Mania (ASRM >= 12)';
  } else if (total >= 6) {
    severityCode = 'hypomania-or-mania-threshold';
    labelVi = 'CẢNH BÁO: Vượt ngưỡng Sàng lọc Hưng cảm nhẹ / Hưng cảm (ASRM >= 6)';
    labelEn = 'ALERT: Positive Screen for Hypomania / Mania (ASRM >= 6)';
  }

  return {
    scale: 'ASRM',
    totalScore: total,
    maxPossibleScore: 20,
    severityCode,
    labelVi,
    labelEn,
    clinicalRecommendationVi: hypomaniaGuardTriggered
      ? 'ASRM >= 6: Tự động bật Lá chắn Hưng cảm (Hypomania Guard), chuyển giao diện sang Low-Stimulus Dark Rest UI, kích hoạt Khoang Trì hoãn Quyết định 48 Giờ và nhắc liên hệ bác sĩ tâm thần.'
      : 'Tiếp tục duy trì 5 mốc nhịp sinh học IPSRT và giấc ngủ đều đặn.',
    clinicalRecommendationEn: hypomaniaGuardTriggered
      ? 'ASRM >= 6: Auto-activate Hypomania Guard, switch to Low-Stimulus Dark Rest UI, enable 48-Hour Impulse Vault, and recommend contacting your psychiatrist.'
      : 'Continue maintaining your 5 daily IPSRT circadian rhythm anchors.',
    safetyStopTriggered: false,
    hypomaniaGuardTriggered,
    clinicianReferralRecommended: hypomaniaGuardTriggered,
    subscales: {
      elevatedMood: items[0]!,
      inflatedSelfConfidence: items[1]!,
      reducedNeedForSleep: items[2]!,
      pressuredSpeech: items[3]!,
      increasedMotorActivity: items[4]!,
    },
    disclaimerVi: CLINICAL_DISCLAIMER_VI,
    disclaimerEn: CLINICAL_DISCLAIMER_EN,
  };
}

/**
 * 5. MDQ (Mood Disorder Questionnaire - Bipolar Spectrum Onboarding Screen)
 * Positive screen requires ALL THREE:
 * 1) >= 7 of 13 Part-1 symptom items answered "Yes" (true)
 * 2) Part-2 co-occurrence in the same time period === true
 * 3) Part-3 functional impairment is 'moderate' or 'serious'
 */
export function scoreMdq(input: {
  symptomItems: boolean[]; // 13 items
  coOccurredInSamePeriod: boolean;
  functionalImpairment: 'no_problem' | 'minor' | 'moderate' | 'serious';
}): AssessmentEvaluationResult {
  if (input.symptomItems.length !== 13) {
    throw new Error(`MDQ requires exactly 13 boolean symptomItems (received ${input.symptomItems.length}).`);
  }
  const yesCount = input.symptomItems.filter(Boolean).length;
  const impairmentPositive =
    input.functionalImpairment === 'moderate' || input.functionalImpairment === 'serious';
  const isPositiveScreen = yesCount >= 7 && input.coOccurredInSamePeriod && impairmentPositive;

  return {
    scale: 'MDQ',
    totalScore: yesCount,
    maxPossibleScore: 13,
    severityCode: isPositiveScreen ? 'positive-bipolar-spectrum-screen' : 'negative-screen',
    labelVi: isPositiveScreen
      ? 'Dương tính Sàng lọc Phổ Rối loạn Lưỡng cực (MDQ Positive)'
      : 'Âm tính Sàng lọc Phổ Lưỡng cực trên MDQ',
    labelEn: isPositiveScreen
      ? 'Positive Screen for Bipolar Spectrum Disorder (MDQ Positive)'
      : 'Negative Screen on Mood Disorder Questionnaire',
    clinicalRecommendationVi: isPositiveScreen
      ? 'LƯU Ý QUAN TRỌNG: Kết quả sàng lọc gợi ý dấu hiệu thuộc phổ Lưỡng cực. Hãy trao đổi với bác sĩ chuyên khoa tâm thần trước khi sử dụng thuốc chống trầm cảm đơn thuần, và bật chế độ theo dõi Khí sắc Hai cực (-5..+5) & IPSRT.'
      : 'Tiếp tục theo dõi khí sắc định kỳ.',
    clinicalRecommendationEn: isPositiveScreen
      ? 'IMPORTANT CLINICAL NOTE: Positive bipolar spectrum screen. Please consult a psychiatrist before taking antidepressant monotherapy, and enable Dual-Pole Mood (-5..+5) & IPSRT tracking.'
      : 'Continue routine mood monitoring.',
    safetyStopTriggered: false,
    hypomaniaGuardTriggered: false,
    clinicianReferralRecommended: isPositiveScreen,
    disclaimerVi: CLINICAL_DISCLAIMER_VI,
    disclaimerEn: CLINICAL_DISCLAIMER_EN,
  };
}

/**
 * 6. ISI (Insomnia Severity Index, 7 items rated 0-4, total 0-28)
 * Includes Bipolar Mania Prodrome vs. Depressive/Anxious Insomnia differential!
 */
export function scoreIsi(
  items: number[],
  feltNeedForSleep: FeltNeedForSleep = 'exhausted',
  recentSleepDurationHours = 6,
): AssessmentEvaluationResult {
  const total = sumScores(items, 0, 4, 7, 'ISI');
  const isHypomanicSleepLoss =
    recentSleepDurationHours < 5 &&
    (feltNeedForSleep === 'reduced_need' || feltNeedForSleep === 'no_need_at_all');

  let severityCode = 'no-clinically-significant-insomnia';
  let labelVi = 'Không có mất ngủ đáng kể trên lâm sàng (0-7)';
  let labelEn = 'No Clinically Significant Insomnia (0-7)';

  if (isHypomanicSleepLoss) {
    severityCode = 'bipolar-reduced-need-for-sleep-red-flag';
    labelVi = 'CỜ ĐỎ LƯỠNG CỰC: Ngủ ít (< 5h) nhưng không thấy mệt / Giảm nhu cầu ngủ';
    labelEn = 'BIPOLAR RED FLAG: Short Sleep (< 5h) with Reduced Need for Sleep (Mania Prodrome)';
  } else if (total >= 22) {
    severityCode = 'severe-clinical-insomnia';
    labelVi = 'Mất ngủ Lâm sàng Nặng (22-28)';
    labelEn = 'Severe Clinical Insomnia (22-28)';
  } else if (total >= 15) {
    severityCode = 'moderate-clinical-insomnia';
    labelVi = 'Mất ngủ Lâm sàng Trung bình (15-21)';
    labelEn = 'Clinical Insomnia, Moderate Severity (15-21)';
  } else if (total >= 8) {
    severityCode = 'subthreshold-insomnia';
    labelVi = 'Mất ngủ Dưới ngưỡng Lâm sàng (8-14)';
    labelEn = 'Subthreshold Insomnia (8-14)';
  }

  return {
    scale: 'ISI',
    totalScore: total,
    maxPossibleScore: 28,
    severityCode,
    labelVi,
    labelEn,
    clinicalRecommendationVi: isHypomanicSleepLoss
      ? 'Ngủ dưới 5 giờ đi kèm cảm giác tràn trề năng lượng là dấu hiệu tiền triệu Hưng cảm (khác với mất ngủ mệt mỏi trong lo âu). Bật ngay Hypomania Guard, Dark Rest và bảo vệ giờ đi ngủ IPSRT.'
      : total >= 15
        ? 'Gợi ý lộ trình CBT-I (Kiểm soát kích thích giường ngủ, Nhật ký Hiệu suất Giấc ngủ) và kiểm tra kỹ năng DBT PLEASE.'
        : 'Duy trì vệ sinh giấc ngủ và giờ thức dậy cố định mỗi sáng.',
    clinicalRecommendationEn: isHypomanicSleepLoss
      ? 'Sleeping < 5 hours while feeling energized is a cardinal Bipolar Mania Prodrome (distinct from fatigued insomnia). Activate Hypomania Guard, Dark Therapy, and protect your IPSRT bedtime anchor.'
      : total >= 15
        ? 'Recommend CBT-I (Stimulus Control, Sleep Efficiency Diary) and DBT PLEASE sleep hygiene.'
        : 'Maintain consistent wake times and wind-down routines.',
    safetyStopTriggered: false,
    hypomaniaGuardTriggered: isHypomanicSleepLoss,
    clinicianReferralRecommended: total >= 15 || isHypomanicSleepLoss,
    disclaimerVi: CLINICAL_DISCLAIMER_VI,
    disclaimerEn: CLINICAL_DISCLAIMER_EN,
  };
}
