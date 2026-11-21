// lib/domain/engine/clinical_assessments.dart
// Validated Clinical Self-Assessment Scoring & Bilingual Interpretation:
// - BMS (David Burns Brief Mood Survey — TEAM-CBT pre/post testing)
// - PHQ-9 (Patient Health Questionnaire-9 for Depression)
// - GAD-7 (Generalized Anxiety Disorder-7)
// - ASRM (Altman Self-Rating Mania Scale — cutoff >= 6)
// - MDQ (Mood Disorder Questionnaire — Bipolar Spectrum Screening)
// - ISI (Insomnia Severity Index — differentiates exhausted insomnia vs hypomanic short sleep)

import '../models/clinical_models.dart';

class ClinicalAssessmentsEngine {
  const ClinicalAssessmentsEngine();

  /// 1. David Burns Brief Mood Survey (BMS)
  /// Scores depression (0-20), suicidal urges (0-8), anxiety (0-20), anger (0-20), positive feelings (0-20).
  /// Any suicidal urge score >= 1 immediately triggers `triggersSafetyStop: true`.
  AssessmentRecord scoreBriefMoodSurvey({
    required String id,
    required int depressionScore, // 0..20
    required int suicidalUrgeScore, // 0..8
    required int anxietyScore, // 0..20
    required int angerScore, // 0..20
    required int positiveMoodScore, // 0..20
    DateTime? completedAt,
  }) {
    final safetyStop = suicidalUrgeScore >= 1;
    final totalDistress =
        depressionScore + suicidalUrgeScore + anxietyScore + angerScore;

    final String severity;
    if (safetyStop) {
      severity = 'crisis_safety_stop';
    } else if (totalDistress >= 35) {
      severity = 'high';
    } else if (totalDistress >= 15) {
      severity = 'moderate';
    } else {
      severity = 'low';
    }

    return AssessmentRecord(
      id: id,
      scaleCode: 'BMS',
      completedAt: completedAt ?? DateTime.now().toUtc(),
      totalScore: totalDistress,
      severityCode: severity,
      interpretationVi: safetyStop
          ? 'CẢNH BÁO AN TOÀN (BMS): Phát hiện điểm ý nghĩ tự sát ($suicidalUrgeScore/8). Kích hoạt ngay giao thức Safety Stop và Đường dây nóng.'
          : 'Khảo sát Khí sắc Ngắn TEAM-CBT (BMS): Trầm cảm $depressionScore/20, Lo âu $anxietyScore/20, Giận dữ $angerScore/20, Cảm xúc Tích cực $positiveMoodScore/20.',
      interpretationEn: safetyStop
          ? 'SAFETY ALERT (BMS): Suicidal urge score ($suicidalUrgeScore/8) >= 1. Immediate Safety Stop activated.'
          : 'TEAM-CBT Brief Mood Survey: Depression $depressionScore/20, Anxiety $anxietyScore/20, Anger $angerScore/20, Positive Mood $positiveMoodScore/20.',
      triggersSafetyStop: safetyStop,
      recommendsClinicianConsult: safetyStop || totalDistress >= 35,
      itemScores: {
        'depression': depressionScore,
        'suicidal_urge': suicidalUrgeScore,
        'anxiety': anxietyScore,
        'anger': angerScore,
        'positive_mood': positiveMoodScore,
      },
    );
  }

  /// 2. PHQ-9 (9 items, each 0..3, total 0..27).
  /// Item 9 (index 8) > 0 triggers immediate Safety Stop.
  AssessmentRecord scorePhq9({
    required String id,
    required List<int> itemResponses, // length 9, each 0..3
    DateTime? completedAt,
  }) {
    final normalized = List<int>.generate(
      9,
      (i) => i < itemResponses.length ? itemResponses[i].clamp(0, 3) : 0,
    );
    final total = normalized.fold<int>(0, (sum, v) => sum + v);
    final item9Score = normalized[8];
    final safetyStop = item9Score > 0;

    final String severity;
    final String labelVi;
    final String labelEn;
    if (total >= 20) {
      severity = 'severe';
      labelVi = 'Trầm cảm mức độ nặng (20–27 điểm)';
      labelEn = 'Severe depressive symptoms (20–27)';
    } else if (total >= 15) {
      severity = 'moderately_severe';
      labelVi = 'Trầm cảm mức độ trung bình - nặng (15–19 điểm)';
      labelEn = 'Moderately severe depressive symptoms (15–19)';
    } else if (total >= 10) {
      severity = 'moderate';
      labelVi = 'Trầm cảm mức độ trung bình (10–14 điểm)';
      labelEn = 'Moderate depressive symptoms (10–14)';
    } else if (total >= 5) {
      severity = 'mild';
      labelVi = 'Trầm cảm mức độ nhẹ (5–9 điểm)';
      labelEn = 'Mild depressive symptoms (5–9)';
    } else {
      severity = 'minimal';
      labelVi = 'Không có hoặc rất ít triệu chứng trầm cảm (0–4 điểm)';
      labelEn = 'Minimal depressive symptoms (0–4)';
    }

    return AssessmentRecord(
      id: id,
      scaleCode: 'PHQ-9',
      completedAt: completedAt ?? DateTime.now().toUtc(),
      totalScore: total,
      severityCode: severity,
      interpretationVi: safetyStop
          ? '$labelVi — LƯU Ý KHẨN: Câu số 9 > 0 ($item9Score điểm). Kích hoạt Safety Stop và khuyến nghị gặp bác sĩ chuyên khoa tâm thần ngay.'
          : '$labelVi (Công cụ tự theo dõi sàng lọc, không thay thế chẩn đoán của bác sĩ).',
      interpretationEn: safetyStop
          ? '$labelEn — URGENT: Item 9 > 0 ($item9Score). Safety Stop triggered; immediate clinical consultation recommended.'
          : '$labelEn (Self-monitoring screening tool, not a medical diagnosis).',
      triggersSafetyStop: safetyStop,
      recommendsClinicianConsult: safetyStop || total >= 15,
      itemScores: {
        for (int i = 0; i < normalized.length; i++) 'q${i + 1}': normalized[i],
      },
    );
  }

  /// 3. GAD-7 (7 items, each 0..3, total 0..21).
  AssessmentRecord scoreGad7({
    required String id,
    required List<int> itemResponses, // length 7, each 0..3
    DateTime? completedAt,
  }) {
    final normalized = List<int>.generate(
      7,
      (i) => i < itemResponses.length ? itemResponses[i].clamp(0, 3) : 0,
    );
    final total = normalized.fold<int>(0, (sum, v) => sum + v);

    final String severity;
    final String labelVi;
    final String labelEn;
    if (total >= 15) {
      severity = 'severe';
      labelVi = 'Lo âu lan tỏa mức độ nặng (15–21 điểm)';
      labelEn = 'Severe anxiety symptoms (15–21)';
    } else if (total >= 10) {
      severity = 'moderate';
      labelVi = 'Lo âu lan tỏa mức độ trung bình (10–14 điểm)';
      labelEn = 'Moderate anxiety symptoms (10–14)';
    } else if (total >= 5) {
      severity = 'mild';
      labelVi = 'Lo âu mức độ nhẹ (5–9 điểm)';
      labelEn = 'Mild anxiety symptoms (5–9)';
    } else {
      severity = 'minimal';
      labelVi = 'Lo âu mức độ tối thiểu (0–4 điểm)';
      labelEn = 'Minimal anxiety symptoms (0–4)';
    }

    return AssessmentRecord(
      id: id,
      scaleCode: 'GAD-7',
      completedAt: completedAt ?? DateTime.now().toUtc(),
      totalScore: total,
      severityCode: severity,
      interpretationVi:
          '$labelVi — Gợi ý: Thực hành 4 mô hình Lo âu TEAM-CBT, Hộp Lo âu (Worry Box) và Thở dẫn nhịp 4-6.',
      interpretationEn:
          '$labelEn — Recommended: TEAM-CBT 4 Anxiety Models, Worry Box, and 4-6 Paced Breathing.',
      recommendsClinicianConsult: total >= 10,
      itemScores: {
        for (int i = 0; i < normalized.length; i++) 'q${i + 1}': normalized[i],
      },
    );
  }

  /// 4. ASRM (Altman Self-Rating Mania Scale — 5 items, each 0..4, total 0..20).
  /// Cutoff >= 6 has high sensitivity for Hypomania / Mania -> activates Hypomania Guard & Low-Stimulus UI.
  AssessmentRecord scoreAsrm({
    required String id,
    required List<int> itemResponses, // length 5, each 0..4
    DateTime? completedAt,
  }) {
    final normalized = List<int>.generate(
      5,
      (i) => i < itemResponses.length ? itemResponses[i].clamp(0, 4) : 0,
    );
    final total = normalized.fold<int>(0, (sum, v) => sum + v);
    final triggersHypomania = total >= 6;

    return AssessmentRecord(
      id: id,
      scaleCode: 'ASRM',
      completedAt: completedAt ?? DateTime.now().toUtc(),
      totalScore: total,
      severityCode: triggersHypomania ? 'hypomania_or_mania_alert' : 'euthymic_range',
      interpretationVi: triggersHypomania
          ? 'ASRM = $total/20 (>= 6): Dấu hiệu Hưng cảm nhẹ / Hưng cảm xác suất cao. Tự động kích hoạt Lá chắn Hypomania Guard, giao diện Dark Rest và Khoang Chờ 48 Giờ.'
          : 'ASRM = $total/20 (< 6): Nằm trong ngưỡng bình ổn.',
      interpretationEn: triggersHypomania
          ? 'ASRM = $total/20 (>= 6): High probability of Hypomania/Mania. Hypomania Guard, Low-Stimulus Dark Rest UI, and 48h Impulse Vault activated.'
          : 'ASRM = $total/20 (< 6): Within euthymic range.',
      triggersHypomaniaGuard: triggersHypomania,
      recommendsClinicianConsult: triggersHypomania,
      itemScores: {
        for (int i = 0; i < normalized.length; i++) 'q${i + 1}': normalized[i],
      },
    );
  }

  /// 5. MDQ (Mood Disorder Questionnaire — 13 yes/no items + co-occurrence + moderate/serious impairment).
  /// Positive screen: >= 7 "Yes" items AND coOccurredInSamePeriod == true AND moderateOrSeriousImpairment == true.
  AssessmentRecord scoreMdq({
    required String id,
    required int yesSymptomCount, // 0..13
    required bool coOccurredInSamePeriod,
    required bool moderateOrSeriousImpairment,
    DateTime? completedAt,
  }) {
    final clampedCount = yesSymptomCount.clamp(0, 13);
    final isPositiveScreen = clampedCount >= 7 &&
        coOccurredInSamePeriod &&
        moderateOrSeriousImpairment;

    return AssessmentRecord(
      id: id,
      scaleCode: 'MDQ',
      completedAt: completedAt ?? DateTime.now().toUtc(),
      totalScore: clampedCount,
      severityCode:
          isPositiveScreen ? 'bipolar_spectrum_positive_screen' : 'negative_screen',
      interpretationVi: isPositiveScreen
          ? 'MDQ Dương tính ($clampedCount/13 triệu chứng xuất hiện cùng thời điểm kèm ảnh hưởng chức năng): Khuyến nghị thăm khám bác sĩ chuyên khoa tâm thần trước khi dùng thuốc chống trầm cảm đơn thuần.'
          : 'MDQ Âm tính ($clampedCount/13): Chưa đủ tiêu chí sàng lọc dương tính trên thang MDQ.',
      interpretationEn: isPositiveScreen
          ? 'MDQ Positive Screen ($clampedCount/13 co-occurring symptoms with functional impairment): Discuss with a psychiatrist before antidepressant monotherapy.'
          : 'MDQ Negative Screen ($clampedCount/13).',
      recommendsClinicianConsult: isPositiveScreen,
      itemScores: {
        'yes_count': clampedCount,
        'co_occurred': coOccurredInSamePeriod ? 1 : 0,
        'impairment': moderateOrSeriousImpairment ? 1 : 0,
      },
    );
  }

  /// 6. ISI (Insomnia Severity Index — 7 items, each 0..4, total 0..28)
  /// Combined with `FeltNeedForSleep` to differentiate True Insomnia vs Bipolar Reduced Sleep Need.
  AssessmentRecord scoreIsi({
    required String id,
    required List<int> itemResponses, // length 7, each 0..4
    FeltNeedForSleep feltNeedForSleep = FeltNeedForSleep.exhausted,
    DateTime? completedAt,
  }) {
    final normalized = List<int>.generate(
      7,
      (i) => i < itemResponses.length ? itemResponses[i].clamp(0, 4) : 0,
    );
    final total = normalized.fold<int>(0, (sum, v) => sum + v);
    final isHypomanicSleepAlert = feltNeedForSleep.isReducedSleepNeed;

    final String severity;
    if (isHypomanicSleepAlert) {
      severity = 'bipolar_reduced_sleep_need_flag';
    } else if (total >= 22) {
      severity = 'severe_insomnia';
    } else if (total >= 15) {
      severity = 'moderate_insomnia';
    } else if (total >= 8) {
      severity = 'subthreshold_insomnia';
    } else {
      severity = 'no_clinically_significant_insomnia';
    }

    return AssessmentRecord(
      id: id,
      scaleCode: 'ISI',
      completedAt: completedAt ?? DateTime.now().toUtc(),
      totalScore: total,
      severityCode: severity,
      interpretationVi: isHypomanicSleepAlert
          ? 'CẢNH BÁO GIẤC NGỦ LƯỠNG CỰC (ISI = $total/28): Bạn ngủ ít nhưng KHÔNG cảm thấy mệt (${feltNeedForSleep.labelVi}). Đây là dấu hiệu tiền triệu Hưng cảm nhẹ (không áp dụng hạn chế giấc ngủ CBT-I lúc này; ưu tiên Dark Rest).'
          : 'Chỉ số Mất ngủ ISI = $total/28: Mất ngủ kèm mệt mỏi ban ngày — phù hợp áp dụng vệ sinh giấc ngủ CBT-I.',
      interpretationEn: isHypomanicSleepAlert
          ? 'BIPOLAR SLEEP RED FLAG (ISI = $total/28): Short sleep with reduced felt need for sleep. Prioritize Dark Rest & Hypomania Guard (do not use CBT-I sleep restriction).'
          : 'Insomnia Severity Index = $total/28: Suitable for CBT-I stimulus control & sleep hygiene.',
      triggersHypomaniaGuard: isHypomanicSleepAlert,
      recommendsClinicianConsult: isHypomanicSleepAlert || total >= 15,
      itemScores: {
        for (int i = 0; i < normalized.length; i++) 'q${i + 1}': normalized[i],
      },
    );
  }
}
