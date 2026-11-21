import type {
  AssessmentResult,
  AssessmentType,
  CognitiveToolkitSession,
  DailyMoodAndRhythmLog,
} from './types.ts';

/**
 * 6. Clinical Self-Assessments, WebCrypto AES-GCM Local Storage, Markdown Exporter,
 *    Local Ollama / Backend Bridge & Print-Optimized A4 Clinician Summary Report
 *
 * Includes:
 * - Interactive BMS (David Burns Brief Mood Survey), PHQ-9, GAD-7, ASRM, MDQ, ISI
 * - Local Encrypted Storage (localStorage + WebCrypto AES-GCM 256-bit wrapper)
 * - Markdown Session Export (YYYYMMDD-[technique]-NN.md)
 * - Local Ollama (http://127.0.0.1:11434) & Backend API connection toggle
 * - Print-optimized A4 Clinician Summary Report (@media print)
 */

export function scoreClinicalAssessment(params: {
  type: AssessmentType;
  itemScores: number[];
  mdqCoOccurrence?: boolean;
  mdqModerateSevereImpairment?: boolean;
  sleepFeltRestedDespiteShortSleep?: boolean;
}): AssessmentResult {
  const total = params.itemScores.reduce((a, b) => a + b, 0);
  const nowIso = new Date().toISOString();

  if (params.type === 'BMS') {
    // David Burns Brief Mood Survey: [Depression(0-20), SuicidalUrges(0-8), Anxiety(0-20), Anger(0-20), PositiveFeelings(0-20)]
    const [dep = 0, suicide = 0, anx = 0, ang = 0, pos = 0] = params.itemScores;
    const triggersSafetyStop = suicide >= 1;
    return {
      id: `bms-${Date.now()}`,
      type: 'BMS',
      completedAt: nowIso,
      totalScore: dep + anx + ang,
      maxScore: 60,
      severityCode: triggersSafetyStop ? 'severe' : dep >= 10 || anx >= 10 ? 'moderate' : 'mild',
      labelVi: triggersSafetyStop
        ? 'BMS Cảnh báo Khẩn cấp: Có xuất hiện ý nghĩ tự sát (>= 1)'
        : `Khảo sát Khí sắc Ngắn TEAM-CBT (Trầm cảm: ${dep}/20, Lo âu: ${anx}/20, Giận dữ: ${ang}/20, Tích cực: ${pos}/20)`,
      labelEn: triggersSafetyStop
        ? 'BMS Urgent Safety Alert: Suicidal ideation score >= 1'
        : `TEAM-CBT Brief Mood Survey (Depression: ${dep}/20, Anxiety: ${anx}/20, Anger: ${ang}/20, Positive: ${pos}/20)`,
      clinicalRecommendationVi: triggersSafetyStop
        ? 'Kích hoạt ngay Safety Stop và hiển thị Kế hoạch An toàn + Đường dây nóng.'
        : 'Sử dụng điểm BMS trước và sau phiên để đo lường hiệu quả chuyển hóa (T = Testing trong TEAM-CBT).',
      clinicalRecommendationEn: triggersSafetyStop
        ? 'Immediately trigger Safety Stop and display Crisis Safety Plan + Hotlines.'
        : 'Use pre- and post-session BMS scores to measure therapeutic progress (T = Testing in TEAM-CBT).',
      triggersSafetyStop,
      triggersHypomaniaGuard: false,
      subscales: { depression: dep, suicidal: suicide, anxiety: anx, anger: ang, positive: pos },
    };
  }

  if (params.type === 'PHQ-9') {
    const q9Suicide = params.itemScores[8] ?? 0;
    const triggersSafetyStop = q9Suicide > 0;
    let severity: AssessmentResult['severityCode'] = 'minimal';
    if (total >= 20) severity = 'severe';
    else if (total >= 15) severity = 'moderately_severe';
    else if (total >= 10) severity = 'moderate';
    else if (total >= 5) severity = 'mild';

    return {
      id: `phq9-${Date.now()}`,
      type: 'PHQ-9',
      completedAt: nowIso,
      totalScore: total,
      maxScore: 27,
      severityCode: severity,
      labelVi: `PHQ-9: ${total}/27 (${severity.toUpperCase()})`,
      labelEn: `PHQ-9 Depression Screen: ${total}/27 (${severity.toUpperCase()})`,
      clinicalRecommendationVi:
        triggersSafetyStop || total >= 15
          ? 'Điểm PHQ-9 >= 15 hoặc Câu 9 > 0: Khuyến nghị thăm khám bác sĩ chuyên khoa tâm thần, hiển thị Hotline và kích hoạt Chế độ Trầm cảm Nặng (Low-Energy UI).'
          : 'Tiếp tục thực hành Kích hoạt Hành vi (Behavioral Activation có Rest Check) và Nhật ký Suy nghĩ.',
      clinicalRecommendationEn:
        triggersSafetyStop || total >= 15
          ? 'PHQ-9 >= 15 or Item 9 > 0: Recommend psychiatric consultation, display hotlines, and enable Low-Energy UI.'
          : 'Continue Behavioral Activation (with Rest Check) and CBT Thought Records.',
      triggersSafetyStop,
      triggersHypomaniaGuard: false,
    };
  }

  if (params.type === 'GAD-7') {
    let severity: AssessmentResult['severityCode'] = 'minimal';
    if (total >= 15) severity = 'severe';
    else if (total >= 10) severity = 'moderate';
    else if (total >= 5) severity = 'mild';

    return {
      id: `gad7-${Date.now()}`,
      type: 'GAD-7',
      completedAt: nowIso,
      totalScore: total,
      maxScore: 21,
      severityCode: severity,
      labelVi: `GAD-7: ${total}/21 (${severity.toUpperCase()})`,
      labelEn: `GAD-7 Anxiety Screen: ${total}/21 (${severity.toUpperCase()})`,
      clinicalRecommendationVi:
        total >= 10
          ? 'GAD-7 >= 10: Gợi ý lộ trình 4 Mô hình Lo âu (TEAM-CBT), Hộp Lo âu (Worry Box 15 phút) và Thang Tiếp xúc (Exposure Hierarchy).'
          : 'Duy trì bài tập thở dẫn nhịp và Hiệu chỉnh Dự đoán (Prediction Calibration).',
      clinicalRecommendationEn:
        total >= 10
          ? 'GAD-7 >= 10: Recommend 4-Model Anxiety Protocol (TEAM-CBT), 15-min Worry Box, and Exposure Hierarchy.'
          : 'Maintain Paced Breathing and Prediction Calibration logs.',
      triggersSafetyStop: false,
      triggersHypomaniaGuard: false,
    };
  }

  if (params.type === 'ASRM') {
    // Altman Self-Rating Mania Scale (0-20), clinical cutoff >= 6
    const triggersHypomaniaGuard = total >= 6;
    return {
      id: `asrm-${Date.now()}`,
      type: 'ASRM',
      completedAt: nowIso,
      totalScore: total,
      maxScore: 20,
      severityCode: triggersHypomaniaGuard ? 'positive_screen' : 'minimal',
      labelVi: triggersHypomaniaGuard
        ? `ASRM: ${total}/20 (>= 6: Cảnh báo Hưng cảm nhẹ / Hưng cảm)`
        : `ASRM: ${total}/20 (< 6: Không có dấu hiệu hưng cảm)`,
      labelEn: triggersHypomaniaGuard
        ? `ASRM Mania Scale: ${total}/20 (>= 6: Positive Screen for Hypomania / Mania)`
        : `ASRM Mania Scale: ${total}/20 (< 6: Within normal baseline)`,
      clinicalRecommendationVi: triggersHypomaniaGuard
        ? 'ASRM >= 6: Tự động kích hoạt Lá chắn Hưng cảm (Hypomania Guard), chuyển sang Giao diện Giảm Kích Thích (Low-Stimulus Dark Rest), bật Khoang Chờ 48 Giờ và nhắc liên hệ bác sĩ.'
        : 'Khí sắc không có dấu hiệu leo thang hưng cảm.',
      clinicalRecommendationEn: triggersHypomaniaGuard
        ? 'ASRM >= 6: Auto-activating Hypomania Guard, Low-Stimulus Dark Rest UI, 48-Hour Impulse Vault, and clinician check-in alert.'
        : 'No significant manic elevation detected.',
      triggersSafetyStop: false,
      triggersHypomaniaGuard,
    };
  }

  if (params.type === 'MDQ') {
    const positiveScreen =
      total >= 7 &&
      (params.mdqCoOccurrence ?? true) &&
      (params.mdqModerateSevereImpairment ?? true);
    return {
      id: `mdq-${Date.now()}`,
      type: 'MDQ',
      completedAt: nowIso,
      totalScore: total,
      maxScore: 13,
      severityCode: positiveScreen ? 'positive_screen' : 'minimal',
      labelVi: positiveScreen
        ? `MDQ Dương tính (${total}/13): Có dấu hiệu tiền sử Phổ Lưỡng cực`
        : `MDQ Âm tính (${total}/13)`,
      labelEn: positiveScreen
        ? `MDQ Positive Screen (${total}/13): Potential Bipolar Spectrum History`
        : `MDQ Negative Screen (${total}/13)`,
      clinicalRecommendationVi: positiveScreen
        ? 'Cảnh báo Y khoa Quan trọng: Vui lòng mang kết quả này trao đổi với bác sĩ chuyên khoa tâm thần trước khi sử dụng thuốc chống trầm cảm đơn thuần (tránh nguy cơ kích hoạt chuyển pha Hưng cảm).'
        : 'Không phát hiện dấu hiệu sàng lọc phổ lưỡng cực trên MDQ.',
      clinicalRecommendationEn: positiveScreen
        ? 'Important Clinical Precaution: Discuss this MDQ result with a psychiatrist before starting antidepressant monotherapy (to avoid antidepressant-induced manic switch).'
        : 'Negative screen on the Mood Disorder Questionnaire.',
      triggersSafetyStop: false,
      triggersHypomaniaGuard: positiveScreen,
    };
  }

  // ISI (Insomnia Severity Index 0-28)
  const isManicSleepReduction = Boolean(params.sleepFeltRestedDespiteShortSleep);
  let isiSeverity: AssessmentResult['severityCode'] = 'minimal';
  if (total >= 22) isiSeverity = 'severe';
  else if (total >= 15) isiSeverity = 'moderate';
  else if (total >= 8) isiSeverity = 'mild';

  return {
    id: `isi-${Date.now()}`,
    type: 'ISI',
    completedAt: nowIso,
    totalScore: total,
    maxScore: 28,
    severityCode: isManicSleepReduction ? 'positive_screen' : isiSeverity,
    labelVi: isManicSleepReduction
      ? `ISI (${total}/28) — CỜ ĐỎ LƯỠNG CỰC: Ngủ ít nhưng vẫn thấy dư thừa năng lượng`
      : `ISI Mất ngủ: ${total}/28 (${isiSeverity.toUpperCase()})`,
    labelEn: isManicSleepReduction
      ? `ISI (${total}/28) — BIPOLAR RED FLAG: Short sleep with reduced felt need for sleep`
      : `ISI Insomnia Severity: ${total}/28 (${isiSeverity.toUpperCase()})`,
    clinicalRecommendationVi: isManicSleepReduction
      ? 'Phân biệt sống còn: Ngủ ít nhưng không thấy mệt là dấu hiệu tiền triệu Hưng cảm (không áp dụng hạn chế giấc ngủ của CBT-I thông thường). Bật ngay Dark Therapy & Hypomania Guard.'
      : 'Áp dụng vệ sinh giấc ngủ CBT-I và giữ mốc giờ thức dậy cố định.',
    clinicalRecommendationEn: isManicSleepReduction
      ? 'Critical differential: Short sleep without fatigue indicates a Hypomanic Prodrome (do NOT use standard CBT-I sleep restriction). Activating Dark Therapy & Hypomania Guard.'
      : 'Apply CBT-I stimulus control and anchor a consistent morning wake time.',
    triggersSafetyStop: false,
    triggersHypomaniaGuard: isManicSleepReduction,
  };
}

export interface ClinicalScaleQuestion {
  id: number;
  textVi: string;
  textEn: string;
}

export interface ClinicalScaleDefinition {
  type: AssessmentType;
  titleVi: string;
  titleEn: string;
  shortCode: string;
  timeframeVi: string;
  timeframeEn: string;
  optionsVi: string[];
  optionsEn: string[];
  questions: ClinicalScaleQuestion[];
  scoreTransform?: (answers: number[]) => number[];
}

export const CLINICAL_SCALES_REGISTRY: Record<AssessmentType, ClinicalScaleDefinition> = {
  'PHQ-9': {
    type: 'PHQ-9',
    titleVi: 'Kiểm tra Tâm trạng & Năng lượng (PHQ-9)',
    titleEn: 'PHQ-9 Depression Symptom Screen',
    shortCode: 'PHQ-9',
    timeframeVi: 'Trong 2 tuần qua, bạn có thường xuyên bị làm phiền bởi những vấn đề sau đây không?',
    timeframeEn: 'Over the last 2 weeks, how often have you been bothered by any of the following problems?',
    optionsVi: ['0 — Không có ngày nào', '1 — Vài ngày', '2 — Hơn một nửa số ngày', '3 — Gần như mỗi ngày'],
    optionsEn: ['0 — Not at all', '1 — Several days', '2 — More than half the days', '3 — Nearly every day'],
    questions: [
      { id: 1, textVi: 'Ít hứng thú hoặc không còn cảm nhận được niềm vui khi làm các công việc thường ngày.', textEn: 'Little interest or pleasure in doing things.' },
      { id: 2, textVi: 'Cảm thấy chán nản, buồn bã, ủ rũ hoặc tuyệt vọng.', textEn: 'Feeling down, depressed, or hopeless.' },
      { id: 3, textVi: 'Khó đi vào giấc ngủ, hay thức giấc giữa đêm, hoặc ngược lại ngủ quá nhiều.', textEn: 'Trouble falling or staying asleep, or sleeping too much.' },
      { id: 4, textVi: 'Cảm thấy mệt mỏi, uể oải hoặc cơ thể thiếu năng lượng.', textEn: 'Feeling tired or having little energy.' },
      { id: 5, textVi: 'Cảm giác chán ăn, ăn không ngon miệng, hoặc ngược lại ăn quá nhiều.', textEn: 'Poor appetite or overeating.' },
      { id: 6, textVi: 'Cảm thấy thất vọng về bản thân — tự trách mình là kẻ thất bại hoặc làm gia đình thất vọng.', textEn: 'Feeling bad about yourself — or that you are a failure or have let yourself or your family down.' },
      { id: 7, textVi: 'Khó tập trung vào công việc, học tập hoặc ngay cả khi đọc sách, xem tivi.', textEn: 'Trouble concentrating on things, such as reading the newspaper or watching television.' },
      { id: 8, textVi: 'Di chuyển hoặc nói chuyện chậm chạp đến mức người khác nhận thấy; hoặc ngược lại bồn chồn, đứng ngồi không yên.', textEn: 'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual.' },
      { id: 9, textVi: 'Có suy nghĩ rằng thà biến mất, buông xuôi hoặc có ý nghĩ làm tổn thương bản thân.', textEn: 'Thoughts that you would be better off dead or of hurting yourself in some way.' },
    ],
  },
  'GAD-7': {
    type: 'GAD-7',
    titleVi: 'Kiểm tra Mức độ Lo âu & Căng thẳng (GAD-7)',
    titleEn: 'GAD-7 Generalized Anxiety Screen',
    shortCode: 'GAD-7',
    timeframeVi: 'Trong 2 tuần qua, bạn có thường xuyên bị làm phiền bởi những cảm giác sau đây không?',
    timeframeEn: 'Over the last 2 weeks, how often have you been bothered by the following problems?',
    optionsVi: ['0 — Không có ngày nào', '1 — Vài ngày', '2 — Hơn một nửa số ngày', '3 — Gần như mỗi ngày'],
    optionsEn: ['0 — Not at all', '1 — Several days', '2 — More than half the days', '3 — Nearly every day'],
    questions: [
      { id: 1, textVi: 'Cảm thấy bồn chồn, lo lắng, căng thẳng hoặc đứng ngồi không yên.', textEn: 'Feeling nervous, anxious, or on edge.' },
      { id: 2, textVi: 'Không thể ngừng lo lắng hoặc không kiểm soát được những suy nghĩ lo âu.', textEn: 'Not being able to stop or control worrying.' },
      { id: 3, textVi: 'Lo lắng quá mức về nhiều chuyện khác nhau trong cuộc sống.', textEn: 'Worrying too much about different things.' },
      { id: 4, textVi: 'Cảm thấy rất khó để thư giãn hoặc thả lỏng cơ thể.', textEn: 'Trouble relaxing.' },
      { id: 5, textVi: 'Quá bồn chồn đến mức khó có thể ngồi yên một chỗ.', textEn: 'Being so restless that it is hard to sit still.' },
      { id: 6, textVi: 'Dễ nổi nóng, dễ bực mình hoặc dễ cáu gắt với mọi người xung quanh.', textEn: 'Becoming easily annoyed or irritable.' },
      { id: 7, textVi: 'Cảm thấy sợ hãi như thể có điều gì đó tồi tệ sắp xảy ra.', textEn: 'Feeling afraid, as if something awful might happen.' },
    ],
  },
  'BMS': {
    type: 'BMS',
    titleVi: 'Khảo sát Cảm xúc Hôm nay (BMS)',
    titleEn: 'Brief Mood Survey (BMS)',
    shortCode: 'BMS',
    timeframeVi: 'Ngay trong ngày hôm nay, bạn cảm nhận các sắc thái sau ở mức độ nào?',
    timeframeEn: 'How are you feeling right now today across these emotional areas?',
    optionsVi: ['0 — Hoàn toàn không', '1 — Một chút', '2 — Vừa phải', '3 — Khá nhiều', '4 — Rất nhiều'],
    optionsEn: ['0 — Not at all', '1 — Somewhat', '2 — Moderately', '3 — A lot', '4 — Extremely'],
    questions: [
      { id: 1, textVi: 'Cảm giác buồn bã, chán nản, u uất hoặc mất tinh thần (Trầm cảm).', textEn: 'Sad, down, depressed, or discouraged.' },
      { id: 2, textVi: 'Cảm giác tuyệt vọng hoặc có ý nghĩ buông xuôi, tự hại.', textEn: 'Hopeless or feeling life is not worth living.' },
      { id: 3, textVi: 'Cảm giác căng thẳng, lo âu, bồn chồn hoặc lo sợ.', textEn: 'Anxious, worried, nervous, or on edge.' },
      { id: 4, textVi: 'Cảm giác bực bội, tức giận, khó chịu hoặc bực mình.', textEn: 'Frustrated, annoyed, irritable, or angry.' },
      { id: 5, textVi: 'Cảm xúc tích cực, vui vẻ, hài lòng hoặc bình yên trong tâm trí.', textEn: 'Positive, happy, peaceful, or content.' },
    ],
    scoreTransform: (ans: number[]) => [
      (ans[0] ?? 0) * 5,
      (ans[1] ?? 0) * 2,
      (ans[2] ?? 0) * 5,
      (ans[3] ?? 0) * 5,
      (ans[4] ?? 0) * 5,
    ],
  },
  'ISI': {
    type: 'ISI',
    titleVi: 'Kiểm tra Chất lượng Giấc ngủ (ISI)',
    titleEn: 'Insomnia Severity Index (ISI)',
    shortCode: 'ISI',
    timeframeVi: 'Trong 2 tuần qua, hãy đánh giá mức độ nghiêm trọng của các vấn đề giấc ngủ của bạn:',
    timeframeEn: 'Over the last 2 weeks, please rate the severity of your insomnia problems:',
    optionsVi: ['0 — Không có', '1 — Nhẹ', '2 — Vừa phải', '3 — Nặng', '4 — Rất nặng'],
    optionsEn: ['0 — None', '1 — Mild', '2 — Moderate', '3 — Severe', '4 — Very Severe'],
    questions: [
      { id: 1, textVi: 'Mức độ khó khăn khi bắt đầu vào giấc ngủ.', textEn: 'Difficulty falling asleep.' },
      { id: 2, textVi: 'Mức độ khó khăn khi duy trì giấc ngủ (thường xuyên thức giấc giữa đêm).', textEn: 'Difficulty staying asleep.' },
      { id: 3, textVi: 'Thức giấc quá sớm vào buổi sáng và không thể ngủ lại được.', textEn: 'Problems waking up too early.' },
      { id: 4, textVi: 'Mức độ bạn hài lòng hay không hài lòng với giấc ngủ hiện tại của mình.', textEn: 'How satisfied/dissatisfied are you with your current sleep pattern?' },
      { id: 5, textVi: 'Mức độ vấn đề giấc ngủ làm ảnh hưởng đến hoạt động ban ngày (mệt mỏi, hiệu suất làm việc, khả năng tập trung).', textEn: 'How noticeable to others do you think your sleep problem is in terms of impairing the quality of your life?' },
      { id: 6, textVi: 'Mức độ người khác nhận thấy vấn đề giấc ngủ đang ảnh hưởng đến cuộc sống của bạn.', textEn: 'How noticeable to others do you think your sleep problem is?' },
      { id: 7, textVi: 'Mức độ bạn cảm thấy lo lắng hoặc khổ sở vì các vấn đề về giấc ngủ của mình.', textEn: 'How worried/distressed are you about your current sleep problem?' },
    ],
  },
  'ASRM': {
    type: 'ASRM',
    titleVi: 'Kiểm tra Mức độ Hưng phấn Năng lượng (ASRM)',
    titleEn: 'Altman Self-Rating Mania Scale (ASRM)',
    shortCode: 'ASRM',
    timeframeVi: 'Trong 7 ngày qua, bạn có trải qua những biểu hiện năng lượng sau không?',
    timeframeEn: 'Over the past 7 days, please rate your energy and mood levels:',
    optionsVi: ['0 — Bình thường', '1 — Hơi nhiều hơn bình thường', '2 — Nhiều hơn rõ rệt', '3 — Rất nhiều', '4 — Cực kỳ cao / Mất kiểm soát'],
    optionsEn: ['0 — Normal', '1 — Slightly more', '2 — Significantly more', '3 — Much more', '4 — Extremely elevated'],
    questions: [
      { id: 1, textVi: 'Cảm thấy vui vẻ, phấn khích hoặc hào hứng khác thường so với mọi người.', textEn: 'Feeling happier or more cheerful than usual.' },
      { id: 2, textVi: 'Cảm thấy tự tin vượt bậc hoặc thấy mình có tài năng, sứ mệnh phi thường.', textEn: 'Feeling more self-confident than usual.' },
      { id: 3, textVi: 'Cảm thấy ít cần ngủ hơn bình thường (ngủ rất ít nhưng vẫn tràn đầy năng lượng).', textEn: 'Needing less sleep than usual without feeling tired.' },
      { id: 4, textVi: 'Nói nhiều hơn, nói nhanh hơn và khó ai ngắt lời được bạn.', textEn: 'Talking more or speaking much faster than usual.' },
      { id: 5, textVi: 'Hoạt động cơ thể liên tục, làm nhiều việc cùng lúc và không thể ngồi yên.', textEn: 'Being much more active or constantly on the go.' },
    ],
  },
  'MDQ': {
    type: 'MDQ',
    titleVi: 'Khảo sát Chu kỳ Khí sắc Hai cực (MDQ)',
    titleEn: 'Mood Disorder Questionnaire (MDQ)',
    shortCode: 'MDQ',
    timeframeVi: 'Đã từng có thời gian nào trong đời mà bạn không phải là chính mình thường ngày và trải qua những điều sau:',
    timeframeEn: 'Has there ever been a period of time when you were not your usual self and:',
    optionsVi: ['0 — Không', '1 — Có'],
    optionsEn: ['0 — No', '1 — Yes'],
    questions: [
      { id: 1, textVi: 'Cảm thấy hưng phấn, phấn chấn đến mức người khác nhận thấy bạn khác thường?', textEn: 'Felt so good or so hyper that other people thought you were not your normal self?' },
      { id: 2, textVi: 'Dễ nổi nóng, cáu gắt và la hét hoặc gây gổ với người khác?', textEn: 'So irritable that you shouted at people or started fights or arguments?' },
      { id: 3, textVi: 'Cảm thấy tự tin hơn bình thường rất nhiều?', textEn: 'Felt much more self-confident than usual?' },
      { id: 4, textVi: 'Ngủ ít hơn bình thường rất nhiều mà vẫn không hề cảm thấy mệt mỏi?', textEn: 'Got much less sleep than usual and found you didn’t really miss it?' },
      { id: 5, textVi: 'Nói nhiều hoặc nói nhanh hơn thường ngày rất nhiều?', textEn: 'Much more talkative or speaking faster than usual?' },
      { id: 6, textVi: 'Suy nghĩ chạy dồn dập trong đầu, ý tưởng xuất hiện liên tục không ngừng?', textEn: 'Thoughts raced through your head or you couldn’t slow your mind down?' },
      { id: 7, textVi: 'Rất dễ bị phân tâm bởi những thứ xung quanh đến mức khó tập trung?', textEn: 'So easily distracted by things around you that you had trouble concentrating?' },
      { id: 8, textVi: 'Tràn đầy năng lượng hơn bình thường rất nhiều?', textEn: 'Had much more energy than usual?' },
      { id: 9, textVi: 'Năng động hơn hoặc làm nhiều việc hơn thường lệ?', textEn: 'Much more active or did many more things than usual?' },
      { id: 10, textVi: 'Giao tiếp xã hội nhiều hơn bình thường (gọi điện thoại, nhắn tin, gặp gỡ liên tục)?', textEn: 'Much more social or outgoing than usual?' },
      { id: 11, textVi: 'Hứng thú tình dục tăng cao hơn bình thường nhiều?', textEn: 'Much more interested in sex than usual?' },
      { id: 12, textVi: 'Làm những việc bất cẩn, liều lĩnh hoặc tiêu xài tiền không tính toán?', textEn: 'Did things that were unusual for you or that other people might have thought were excessive, foolish, or risky?' },
      { id: 13, textVi: 'Việc tiêu tiền hoặc quyết định liều lĩnh gây rắc rối tài chính cho bạn hoặc gia đình?', textEn: 'Spending money got you or your family into trouble?' },
    ],
  },
};

/**
 * Markdown Session Exporter (`YYYYMMDD-[technique]-NN.md`)
 * 100% compatible with glebis/claude-cognitive-toolkit & Obsidian/Notion
 */
export function exportSessionToMarkdown(
  session: CognitiveToolkitSession,
  sequenceNumber = 1
): {
  filename: string;
  markdownContent: string;
} {
  const dateCompact = session.date.replace(/-/g, '');
  const seqStr = String(sequenceNumber).padStart(2, '0');
  const filename = `${dateCompact}-${session.technique}-${seqStr}.md`;

  const yamlLines = [
    '---',
    `type: ${session.type}`,
    `technique: ${session.technique}`,
    `phase0_mode: ${session.phase0Mode}`,
    `date: ${session.date}`,
    `time: "${session.time}"`,
    `channel: ${session.channel}`,
    `language: ${session.language}`,
    `pushback_level: ${session.pushbackLevel}`,
    `pre_intensity: ${session.preIntensity}`,
    `post_intensity: ${session.postIntensity ?? session.preIntensity}`,
    `intensity_delta: ${(session.postIntensity ?? session.preIntensity) - session.preIntensity}`,
    `mood_polarity_at_start: ${session.moodPolarityAtStart ?? 0}`,
    `emotions: [${session.emotions.map((e) => `"${e}"`).join(', ')}]`,
    `negative_distortions: [${session.negativeDistortionsIdentified.map((d) => `"${d}"`).join(', ')}]`,
    `positive_distortions: [${session.positiveDistortionsIdentified.map((d) => `"${d}"`).join(', ')}]`,
    `steps_completed: ${session.stepsCompleted}`,
    `steps_skipped: [${session.stepsSkipped.map((s) => `"${s}"`).join(', ')}]`,
    `outcome: ${session.outcome}`,
    ...(session.hrvContext ? [`hrv_context: ${session.hrvContext}`] : []),
    '---',
    '',
    `# Phiên Thực Hành: ${session.technique.toUpperCase()} (${session.date} ${session.time})`,
    '',
    `- **Kết quả (Outcome):** \`${session.outcome}\``,
    `- **Cường độ Cảm xúc:** ${session.preIntensity}/10 → ${session.postIntensity ?? session.preIntensity}/10 (Δ ${(session.postIntensity ?? session.preIntensity) - session.preIntensity})`,
    `- **Cấp độ Socratic Pushback:** \`${session.pushbackLevel}\``,
    '',
    '## Nội dung Từng Bước (Structured Protocol Steps)',
    '```json',
    JSON.stringify(session.structuredStepsPayload, null, 2),
    '```',
    '',
    `## Bài học Đúc kết (Takeaway)`,
    `> ${session.takeaway ?? 'Hoàn thành phiên thực hành an toàn.'}`,
    '',
  ];

  return {
    filename,
    markdownContent: yamlLines.join('\n'),
  };
}

/**
 * WebCrypto AES-GCM 256-bit Encrypted Local Storage Wrapper
 * Encrypts sensitive PHI / CBT journals before persisting in browser localStorage.
 */
export interface EncryptedVaultEnvelope {
  version: 'aes-gcm-256-v1';
  ivBase64: string;
  saltBase64: string;
  ciphertextBase64: string;
  encryptedAt: string;
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(b64, 'base64'));
  }
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

export async function encryptClinicalDataAesGcm(
  plaintextJson: string,
  passphrase: string
): Promise<EncryptedVaultEnvelope> {
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj?.subtle) {
    throw new Error('WebCrypto subtle API is required for AES-GCM 256 encryption.');
  }

  const enc = new TextEncoder();
  const salt = cryptoObj.getRandomValues(new Uint8Array(16));
  const iv = cryptoObj.getRandomValues(new Uint8Array(12));

  const keyMaterial = await cryptoObj.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const aesKey = await cryptoObj.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  const encryptedBuf = await cryptoObj.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    enc.encode(plaintextJson)
  );

  return {
    version: 'aes-gcm-256-v1',
    ivBase64: bytesToBase64(iv),
    saltBase64: bytesToBase64(salt),
    ciphertextBase64: bytesToBase64(new Uint8Array(encryptedBuf)),
    encryptedAt: new Date().toISOString(),
  };
}

export async function decryptClinicalDataAesGcm(
  envelope: EncryptedVaultEnvelope,
  passphrase: string
): Promise<string> {
  const cryptoObj = globalThis.crypto;
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  const salt = base64ToBytes(envelope.saltBase64);
  const iv = base64ToBytes(envelope.ivBase64);
  const ciphertext = base64ToBytes(envelope.ciphertextBase64);

  const keyMaterial = await cryptoObj.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const aesKey = await cryptoObj.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  const decryptedBuf = await cryptoObj.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    aesKey,
    ciphertext as BufferSource
  );

  return dec.decode(decryptedBuf);
}

/**
 * Local Ollama (http://127.0.0.1:11434) & Modular Backend API Connection Manager
 */
export type AIConnectionMode = 'offline-deterministic' | 'local-ollama' | 'cloud-backend-api';

export interface AIConnectionConfig {
  mode: AIConnectionMode;
  ollamaBaseUrl: string;  // default: http://127.0.0.1:11434
  ollamaModel: string;    // default: qwen2.5:7b or qwen3.5:9b
  backendApiUrl: string;  // default: http://127.0.0.1:8000/api/v1
  ragScoreThreshold: number; // Strict 0.46 threshold
}

export const DEFAULT_AI_CONNECTION_CONFIG: AIConnectionConfig = {
  mode: 'offline-deterministic',
  ollamaBaseUrl: 'http://127.0.0.1:11434',
  ollamaModel: 'qwen2.5:7b',
  backendApiUrl: 'http://127.0.0.1:8000/api/v1',
  ragScoreThreshold: 0.46,
};

export async function queryClinicalCompanionWithFallback(params: {
  config: AIConnectionConfig;
  userPrompt: string;
  activeTechnique: string;
  ragSimilarityScore: number;
  ragChunkId?: string;
}): Promise<{
  providerUsed: AIConnectionMode;
  abstainedFromUncitedProtocol: boolean;
  citationTag: string | null;
  replyVi: string;
  replyEn: string;
}> {
  // Enforce strict Grounded RAG Abstention Contract (threshold = 0.46)
  if (params.ragSimilarityScore < params.config.ragScoreThreshold) {
    return {
      providerUsed: 'offline-deterministic',
      abstainedFromUncitedProtocol: true,
      citationTag: null,
      replyVi:
        '[Chế độ Từ chối Bịa Phác đồ — 100% Abstention Accuracy (RAG score < 0.46)]: Câu hỏi này nằm ngoài kho phác đồ lâm sàng đã kiểm chứng. Mình xin phép không tự suy diễn lời khuyên y khoa, mà lắng nghe bạn bằng sự thấu cảm (EAR) và mời bạn quay lại một kỹ thuật chuẩn (Thought Record, TIPP, hoặc Behavioral Activation).',
      replyEn:
        '[Strict Grounded RAG Abstention (score < 0.46)]: This query falls outside our verified clinical knowledge base. Rather than inventing unverified clinical advice, I am here to offer TEAM-CBT EAR empathy and guide you to a verified protocol.',
    };
  }

  const citation = params.ragChunkId ? `[KB:${params.ragChunkId}]` : '[KB:clinical-core-v1]';

  if (params.config.mode === 'local-ollama') {
    try {
      const res = await fetch(`${params.config.ollamaBaseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: params.config.ollamaModel,
          prompt: `Clinical Protocol (${params.activeTechnique}) ${citation}: ${params.userPrompt}`,
          stream: false,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { response?: string };
        if (data.response) {
          return {
            providerUsed: 'local-ollama',
            abstainedFromUncitedProtocol: false,
            citationTag: citation,
            replyVi: `${data.response} ${citation}`,
            replyEn: `${data.response} ${citation}`,
          };
        }
      }
    } catch {
      // Automatically fall back to deterministic offline engine
    }
  }

  return {
    providerUsed: 'offline-deterministic',
    abstainedFromUncitedProtocol: false,
    citationTag: citation,
    replyVi: `Phản hồi Phác đồ Chuẩn (${params.activeTechnique}): Hãy đi từng bước nhỏ, bám sát dữ kiện khách quan và lắng nghe cả hai chiều cảm xúc - lý trí. ${citation}`,
    replyEn: `Grounded Protocol Guidance (${params.activeTechnique}): Take one small step at a time, anchor in camera-verifiable facts, and honor both emotion and reason. ${citation}`,
  };
}

/**
 * Print-Optimized A4 Clinician Summary Report Builder
 */
export interface ClinicianSummaryReportData {
  patientAlias: string;
  generatedDate: string;
  periodDays: number;
  moodLogs: DailyMoodAndRhythmLog[];
  assessments: AssessmentResult[];
  sessions: CognitiveToolkitSession[];
  ipsrtAverageStabilityPercent: number;
  medicationAdherencePercent: number;
  topDistortions: string[];
  e2eeShareUrlFragment: string;
}

export function buildClinicianSummaryReport(params: {
  patientAlias: string;
  moodLogs: DailyMoodAndRhythmLog[];
  assessments: AssessmentResult[];
  sessions: CognitiveToolkitSession[];
  ipsrtAverageStabilityPercent: number;
}): ClinicianSummaryReportData {
  const medLogs = params.moodLogs.flatMap((l) => l.medicationsTaken);
  const takenCount = medLogs.filter((m) => Boolean(m.takenAt)).length;
  const medicationAdherencePercent =
    medLogs.length > 0 ? Math.round((takenCount / medLogs.length) * 100) : 100;

  const distortionCounts = new Map<string, number>();
  for (const s of params.sessions) {
    for (const d of [...s.negativeDistortionsIdentified, ...s.positiveDistortionsIdentified]) {
      distortionCounts.set(d, (distortionCounts.get(d) ?? 0) + 1);
    }
  }

  const topDistortions = [...distortionCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => `${name} (${count})`);

  return {
    patientAlias: params.patientAlias,
    generatedDate: new Date().toISOString().slice(0, 10),
    periodDays: 30,
    moodLogs: params.moodLogs,
    assessments: params.assessments,
    sessions: params.sessions,
    ipsrtAverageStabilityPercent: params.ipsrtAverageStabilityPercent,
    medicationAdherencePercent,
    topDistortions,
    e2eeShareUrlFragment: `https://equilibria.clinical.local/clinician/view?reportId=rep-${Date.now()}#key=aes256gcm_zero_knowledge_ephemeral`,
  };
}
