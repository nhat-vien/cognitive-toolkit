// lib/domain/engine/clinical_assessments.dart
// Validated Clinical Self-Assessment Scoring, Interactive Questionnaire Registry & Bilingual Interpretation:
// - BMS (David Burns Brief Mood Survey — TEAM-CBT pre/post testing)
// - PHQ-9 (Patient Health Questionnaire-9 for Depression)
// - GAD-7 (Generalized Anxiety Disorder-7)
// - ASRM (Altman Self-Rating Mania Scale — cutoff >= 6)
// - MDQ (Mood Disorder Questionnaire — Bipolar Spectrum Screening)
// - ISI (Insomnia Severity Index — differentiates exhausted insomnia vs hypomanic short sleep)

import '../models/clinical_models.dart';

class ClinicalScaleQuestion {
  final int id;
  final String textVi;
  final String textEn;

  const ClinicalScaleQuestion({
    required this.id,
    required this.textVi,
    required this.textEn,
  });
}

class ClinicalScaleDefinition {
  final String scaleCode;
  final String titleVi;
  final String titleEn;
  final String introVi;
  final String timeframeVi;
  final String timeframeEn;
  final int maxScore;
  final List<String> optionsVi;
  final List<String> optionsEn;
  final List<ClinicalScaleQuestion> questions;

  const ClinicalScaleDefinition({
    required this.scaleCode,
    required this.titleVi,
    required this.titleEn,
    required this.introVi,
    required this.timeframeVi,
    required this.timeframeEn,
    required this.maxScore,
    required this.optionsVi,
    required this.optionsEn,
    required this.questions,
  });
}

const Map<String, ClinicalScaleDefinition> kClinicalScalesRegistry = {
  'BMS': ClinicalScaleDefinition(
    scaleCode: 'BMS',
    titleVi: 'Khảo sát Cảm xúc Hôm nay (BMS)',
    titleEn: 'Brief Mood Survey (BMS)',
    introVi:
        '5 câu hỏi đánh giá nhanh cảm giác buồn, lo lắng, bực bội và mức độ tích cực ngay trong ngày hôm nay.',
    timeframeVi:
        'Ngay trong ngày hôm nay, bạn cảm nhận các sắc thái sau ở mức độ nào?',
    timeframeEn:
        'How are you feeling right now today across these emotional areas?',
    maxScore: 68,
    optionsVi: [
      '0 — Hoàn toàn không',
      '1 — Một chút',
      '2 — Vừa phải',
      '3 — Khá nhiều',
      '4 — Rất nhiều',
    ],
    optionsEn: [
      '0 — Not at all',
      '1 — Somewhat',
      '2 — Moderately',
      '3 — A lot',
      '4 — Extremely',
    ],
    questions: [
      ClinicalScaleQuestion(
        id: 1,
        textVi: 'Cảm giác buồn bã, chán nản, u uất hoặc mất tinh thần.',
        textEn: 'Sad, down, depressed, or discouraged.',
      ),
      ClinicalScaleQuestion(
        id: 2,
        textVi: 'Cảm giác tuyệt vọng hoặc có ý nghĩ buông xuôi, tự hại.',
        textEn: 'Hopeless or feeling life is not worth living.',
      ),
      ClinicalScaleQuestion(
        id: 3,
        textVi: 'Cảm giác căng thẳng, lo âu, bồn chồn hoặc lo sợ.',
        textEn: 'Anxious, worried, nervous, or on edge.',
      ),
      ClinicalScaleQuestion(
        id: 4,
        textVi: 'Cảm giác bực bội, tức giận, khó chịu hoặc bực mình.',
        textEn: 'Frustrated, annoyed, irritable, or angry.',
      ),
      ClinicalScaleQuestion(
        id: 5,
        textVi: 'Cảm xúc tích cực, vui vẻ, hài lòng hoặc bình yên trong tâm trí.',
        textEn: 'Positive, happy, peaceful, or content.',
      ),
    ],
  ),
  'PHQ-9': ClinicalScaleDefinition(
    scaleCode: 'PHQ-9',
    titleVi: 'Kiểm tra Tâm trạng & Năng lượng (PHQ-9)',
    titleEn: 'PHQ-9 Depression Symptom Screen',
    introVi:
        '9 câu hỏi chuẩn quốc tế giúp nhận diện tình trạng mệt mỏi, giảm hứng thú và trầm lắng trong 2 tuần qua.',
    timeframeVi:
        'Trong 2 tuần qua, bạn có thường xuyên bị làm phiền bởi những vấn đề sau đây không?',
    timeframeEn:
        'Over the last 2 weeks, how often have you been bothered by any of the following problems?',
    maxScore: 27,
    optionsVi: [
      '0 — Không có ngày nào',
      '1 — Vài ngày',
      '2 — Hơn một nửa số ngày',
      '3 — Gần như mỗi ngày',
    ],
    optionsEn: [
      '0 — Not at all',
      '1 — Several days',
      '2 — More than half the days',
      '3 — Nearly every day',
    ],
    questions: [
      ClinicalScaleQuestion(
        id: 1,
        textVi:
            'Ít hứng thú hoặc không còn cảm nhận được niềm vui khi làm các công việc thường ngày.',
        textEn: 'Little interest or pleasure in doing things.',
      ),
      ClinicalScaleQuestion(
        id: 2,
        textVi: 'Cảm thấy chán nản, buồn bã, ủ rũ hoặc tuyệt vọng.',
        textEn: 'Feeling down, depressed, or hopeless.',
      ),
      ClinicalScaleQuestion(
        id: 3,
        textVi:
            'Khó đi vào giấc ngủ, hay thức giấc giữa đêm, hoặc ngược lại ngủ quá nhiều.',
        textEn: 'Trouble falling or staying asleep, or sleeping too much.',
      ),
      ClinicalScaleQuestion(
        id: 4,
        textVi: 'Cảm thấy mệt mỏi, uể oải hoặc cơ thể thiếu năng lượng.',
        textEn: 'Feeling tired or having little energy.',
      ),
      ClinicalScaleQuestion(
        id: 5,
        textVi: 'Cảm giác chán ăn, ăn không ngon miệng, hoặc ngược lại ăn quá nhiều.',
        textEn: 'Poor appetite or overeating.',
      ),
      ClinicalScaleQuestion(
        id: 6,
        textVi:
            'Cảm thấy thất vọng về bản thân — tự trách mình là kẻ thất bại hoặc làm gia đình thất vọng.',
        textEn:
            'Feeling bad about yourself — or that you are a failure or have let yourself or your family down.',
      ),
      ClinicalScaleQuestion(
        id: 7,
        textVi:
            'Khó tập trung vào công việc, học tập hoặc ngay cả khi đọc sách, xem tivi.',
        textEn:
            'Trouble concentrating on things, such as reading the newspaper or watching television.',
      ),
      ClinicalScaleQuestion(
        id: 8,
        textVi:
            'Di chuyển hoặc nói chuyện chậm chạp đến mức người khác nhận thấy; hoặc ngược lại bồn chồn, đứng ngồi không yên.',
        textEn:
            'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless.',
      ),
      ClinicalScaleQuestion(
        id: 9,
        textVi:
            'Có suy nghĩ rằng thà biến mất, buông xuôi hoặc có ý nghĩ làm tổn thương bản thân.',
        textEn:
            'Thoughts that you would be better off dead or of hurting yourself in some way.',
      ),
    ],
  ),
  'GAD-7': ClinicalScaleDefinition(
    scaleCode: 'GAD-7',
    titleVi: 'Kiểm tra Mức độ Lo âu & Căng thẳng (GAD-7)',
    titleEn: 'GAD-7 Generalized Anxiety Screen',
    introVi:
        '7 câu hỏi giúp đo lường mức độ bồn chồn, lo nghĩ quá mức và khó thư giãn trong 2 tuần qua.',
    timeframeVi:
        'Trong 2 tuần qua, bạn có thường xuyên bị làm phiền bởi những cảm giác sau đây không?',
    timeframeEn:
        'Over the last 2 weeks, how often have you been bothered by the following problems?',
    maxScore: 21,
    optionsVi: [
      '0 — Không có ngày nào',
      '1 — Vài ngày',
      '2 — Hơn một nửa số ngày',
      '3 — Gần như mỗi ngày',
    ],
    optionsEn: [
      '0 — Not at all',
      '1 — Several days',
      '2 — More than half the days',
      '3 — Nearly every day',
    ],
    questions: [
      ClinicalScaleQuestion(
        id: 1,
        textVi: 'Cảm thấy bồn chồn, lo lắng, căng thẳng hoặc đứng ngồi không yên.',
        textEn: 'Feeling nervous, anxious, or on edge.',
      ),
      ClinicalScaleQuestion(
        id: 2,
        textVi:
            'Không thể ngừng lo lắng hoặc không kiểm soát được những suy nghĩ lo âu.',
        textEn: 'Not being able to stop or control worrying.',
      ),
      ClinicalScaleQuestion(
        id: 3,
        textVi: 'Lo lắng quá mức về nhiều chuyện khác nhau trong cuộc sống.',
        textEn: 'Worrying too much about different things.',
      ),
      ClinicalScaleQuestion(
        id: 4,
        textVi: 'Cảm thấy rất khó để thư giãn hoặc thả lỏng cơ thể.',
        textEn: 'Trouble relaxing.',
      ),
      ClinicalScaleQuestion(
        id: 5,
        textVi: 'Quá bồn chồn đến mức khó có thể ngồi yên một chỗ.',
        textEn: 'Being so restless that it is hard to sit still.',
      ),
      ClinicalScaleQuestion(
        id: 6,
        textVi: 'Dễ nổi nóng, dễ bực mình hoặc dễ cáu gắt với mọi người xung quanh.',
        textEn: 'Becoming easily annoyed or irritable.',
      ),
      ClinicalScaleQuestion(
        id: 7,
        textVi: 'Cảm thấy sợ hãi như thể có điều gì đó tồi tệ sắp xảy ra.',
        textEn: 'Feeling afraid, as if something awful might happen.',
      ),
    ],
  ),
  'ISI': ClinicalScaleDefinition(
    scaleCode: 'ISI',
    titleVi: 'Kiểm tra Chất lượng Giấc ngủ (ISI)',
    titleEn: 'Insomnia Severity Index (ISI)',
    introVi:
        '7 câu hỏi đánh giá tình trạng khó vào giấc, thức giấc giữa đêm và cảm giác mệt mỏi sau khi ngủ dậy.',
    timeframeVi:
        'Trong 2 tuần qua, hãy đánh giá mức độ nghiêm trọng của các vấn đề giấc ngủ của bạn:',
    timeframeEn:
        'Over the last 2 weeks, please rate the severity of your insomnia problems:',
    maxScore: 28,
    optionsVi: [
      '0 — Không có',
      '1 — Nhẹ',
      '2 — Vừa phải',
      '3 — Nặng',
      '4 — Rất nặng',
    ],
    optionsEn: [
      '0 — None',
      '1 — Mild',
      '2 — Moderate',
      '3 — Severe',
      '4 — Very Severe',
    ],
    questions: [
      ClinicalScaleQuestion(
        id: 1,
        textVi: 'Mức độ khó khăn khi bắt đầu vào giấc ngủ.',
        textEn: 'Difficulty falling asleep.',
      ),
      ClinicalScaleQuestion(
        id: 2,
        textVi:
            'Mức độ khó khăn khi duy trì giấc ngủ (thường xuyên thức giấc giữa đêm).',
        textEn: 'Difficulty staying asleep.',
      ),
      ClinicalScaleQuestion(
        id: 3,
        textVi: 'Thức giấc quá sớm vào buổi sáng và không thể ngủ lại được.',
        textEn: 'Problems waking up too early.',
      ),
      ClinicalScaleQuestion(
        id: 4,
        textVi:
            'Mức độ bạn hài lòng hay không hài lòng với giấc ngủ hiện tại của mình.',
        textEn:
            'How satisfied/dissatisfied are you with your current sleep pattern?',
      ),
      ClinicalScaleQuestion(
        id: 5,
        textVi:
            'Mức độ vấn đề giấc ngủ làm ảnh hưởng đến hoạt động ban ngày (mệt mỏi, tập trung).',
        textEn:
            'How much do your sleep problems interfere with your daily functioning?',
      ),
      ClinicalScaleQuestion(
        id: 6,
        textVi:
            'Mức độ người khác nhận thấy vấn đề giấc ngủ đang ảnh hưởng đến cuộc sống của bạn.',
        textEn:
            'How noticeable to others do you think your sleep problem is?',
      ),
      ClinicalScaleQuestion(
        id: 7,
        textVi:
            'Mức độ bạn cảm thấy lo lắng hoặc khổ sở vì các vấn đề về giấc ngủ của mình.',
        textEn:
            'How worried/distressed are you about your current sleep problem?',
      ),
    ],
  ),
  'ASRM': ClinicalScaleDefinition(
    scaleCode: 'ASRM',
    titleVi: 'Kiểm tra Mức độ Hưng phấn Năng lượng (ASRM)',
    titleEn: 'Altman Self-Rating Mania Scale (ASRM)',
    introVi:
        '5 câu hỏi chuyên sâu đo lường mức độ năng lượng hưng phấn cao và giảm nhu cầu ngủ.',
    timeframeVi:
        'Trong 7 ngày qua, bạn có trải qua những biểu hiện năng lượng sau không?',
    timeframeEn:
        'Over the past 7 days, please rate your energy and mood levels:',
    maxScore: 20,
    optionsVi: [
      '0 — Bình thường',
      '1 — Hơi nhiều hơn bình thường',
      '2 — Nhiều hơn rõ rệt',
      '3 — Rất nhiều',
      '4 — Cực kỳ cao / Mất kiểm soát',
    ],
    optionsEn: [
      '0 — Normal',
      '1 — Slightly more',
      '2 — Significantly more',
      '3 — Much more',
      '4 — Extremely elevated',
    ],
    questions: [
      ClinicalScaleQuestion(
        id: 1,
        textVi:
            'Cảm thấy vui vẻ, phấn khích hoặc hào hứng khác thường so với mọi người.',
        textEn: 'Feeling happier or more cheerful than usual.',
      ),
      ClinicalScaleQuestion(
        id: 2,
        textVi:
            'Cảm thấy tự tin vượt bậc hoặc thấy mình có tài năng, sứ mệnh phi thường.',
        textEn: 'Feeling more self-confident than usual.',
      ),
      ClinicalScaleQuestion(
        id: 3,
        textVi:
            'Cảm thấy ít cần ngủ hơn bình thường (ngủ rất ít nhưng vẫn tràn đầy năng lượng).',
        textEn: 'Needing less sleep than usual without feeling tired.',
      ),
      ClinicalScaleQuestion(
        id: 4,
        textVi: 'Nói nhiều hơn, nói nhanh hơn và khó ai ngắt lời được bạn.',
        textEn: 'Talking more or speaking much faster than usual.',
      ),
      ClinicalScaleQuestion(
        id: 5,
        textVi:
            'Hoạt động cơ thể liên tục, làm nhiều việc cùng lúc và không thể ngồi yên.',
        textEn: 'Being much more active or constantly on the go.',
      ),
    ],
  ),
  'MDQ': ClinicalScaleDefinition(
    scaleCode: 'MDQ',
    titleVi: 'Khảo sát Chu kỳ Khí sắc Hai cực (MDQ)',
    titleEn: 'Mood Disorder Questionnaire (MDQ)',
    introVi:
        '13 câu hỏi sàng lọc tiền sử các giai đoạn tăng năng lượng, giảm nhu cầu ngủ và dao động khí sắc.',
    timeframeVi:
        'Đã từng có thời gian nào trong đời mà bạn không phải là chính mình thường ngày và trải qua những điều sau:',
    timeframeEn:
        'Has there ever been a period of time when you were not your usual self and:',
    maxScore: 13,
    optionsVi: ['0 — Không', '1 — Có'],
    optionsEn: ['0 — No', '1 — Yes'],
    questions: [
      ClinicalScaleQuestion(
        id: 1,
        textVi:
            'Cảm thấy hưng phấn, phấn chấn đến mức người khác nhận thấy bạn khác thường?',
        textEn:
            'Felt so good or so hyper that other people thought you were not your normal self?',
      ),
      ClinicalScaleQuestion(
        id: 2,
        textVi: 'Dễ nổi nóng, cáu gắt và la hét hoặc gây gổ với người khác?',
        textEn:
            'So irritable that you shouted at people or started fights or arguments?',
      ),
      ClinicalScaleQuestion(
        id: 3,
        textVi: 'Cảm thấy tự tin hơn bình thường rất nhiều?',
        textEn: 'Felt much more self-confident than usual?',
      ),
      ClinicalScaleQuestion(
        id: 4,
        textVi:
            'Ngủ ít hơn bình thường rất nhiều mà vẫn không hề cảm thấy mệt mỏi?',
        textEn:
            'Got much less sleep than usual and found you did not really miss it?',
      ),
      ClinicalScaleQuestion(
        id: 5,
        textVi: 'Nói nhiều hoặc nói nhanh hơn thường ngày rất nhiều?',
        textEn: 'Much more talkative or speaking faster than usual?',
      ),
      ClinicalScaleQuestion(
        id: 6,
        textVi:
            'Suy nghĩ chạy dồn dập trong đầu, ý tưởng xuất hiện liên tục không ngừng?',
        textEn:
            'Thoughts raced through your head or you could not slow your mind down?',
      ),
      ClinicalScaleQuestion(
        id: 7,
        textVi:
            'Rất dễ bị phân tâm bởi những thứ xung quanh đến mức khó tập trung?',
        textEn: 'So easily distracted that you had trouble concentrating?',
      ),
      ClinicalScaleQuestion(
        id: 8,
        textVi: 'Tràn đầy năng lượng hơn bình thường rất nhiều?',
        textEn: 'Had much more energy than usual?',
      ),
      ClinicalScaleQuestion(
        id: 9,
        textVi: 'Năng động hơn hoặc làm nhiều việc hơn thường lệ?',
        textEn: 'Much more active or did many more things than usual?',
      ),
      ClinicalScaleQuestion(
        id: 10,
        textVi:
            'Giao tiếp xã hội nhiều hơn bình thường (gọi điện thoại, nhắn tin, gặp gỡ liên tục)?',
        textEn: 'Much more social or outgoing than usual?',
      ),
      ClinicalScaleQuestion(
        id: 11,
        textVi: 'Hứng thú tình dục tăng cao hơn bình thường nhiều?',
        textEn: 'Much more interested in sex than usual?',
      ),
      ClinicalScaleQuestion(
        id: 12,
        textVi:
            'Làm những việc bất cẩn, liều lĩnh hoặc tiêu xài tiền không tính toán?',
        textEn:
            'Did things that were unusual for you or excessive, foolish, or risky?',
      ),
      ClinicalScaleQuestion(
        id: 13,
        textVi:
            'Việc tiêu tiền hoặc quyết định liều lĩnh gây rắc rối tài chính cho bạn hoặc gia đình?',
        textEn: 'Spending money got you or your family into trouble?',
      ),
    ],
  ),
};

class ClinicalAssessmentsEngine {
  const ClinicalAssessmentsEngine();

  /// Unified dispatcher for interactive questionnaires in `kClinicalScalesRegistry`.
  AssessmentRecord scoreFromQuestionnaire({
    required String scaleCode,
    required List<int> rawAnswers,
    bool mdqCoOccurred = true,
    bool mdqModerateImpairment = true,
    FeltNeedForSleep feltNeedForSleep = FeltNeedForSleep.normal,
    DateTime? completedAt,
  }) {
    final now = completedAt ?? DateTime.now().toUtc();
    final id = '${scaleCode.toLowerCase()}-${now.millisecondsSinceEpoch}';

    switch (scaleCode) {
      case 'BMS':
        final a0 = rawAnswers.isNotEmpty ? rawAnswers[0].clamp(0, 4) * 5 : 0;
        final a1 = rawAnswers.length > 1 ? rawAnswers[1].clamp(0, 4) * 2 : 0;
        final a2 = rawAnswers.length > 2 ? rawAnswers[2].clamp(0, 4) * 5 : 0;
        final a3 = rawAnswers.length > 3 ? rawAnswers[3].clamp(0, 4) * 5 : 0;
        final a4 = rawAnswers.length > 4 ? rawAnswers[4].clamp(0, 4) * 5 : 0;
        return scoreBriefMoodSurvey(
          id: id,
          depressionScore: a0,
          suicidalUrgeScore: a1,
          anxietyScore: a2,
          angerScore: a3,
          positiveMoodScore: a4,
          completedAt: now,
        );
      case 'PHQ-9':
        return scorePhq9(
          id: id,
          itemResponses: rawAnswers,
          completedAt: now,
        );
      case 'GAD-7':
        return scoreGad7(
          id: id,
          itemResponses: rawAnswers,
          completedAt: now,
        );
      case 'ASRM':
        return scoreAsrm(
          id: id,
          itemResponses: rawAnswers,
          completedAt: now,
        );
      case 'MDQ':
        final yesCount = rawAnswers.fold<int>(0, (s, v) => s + (v > 0 ? 1 : 0));
        return scoreMdq(
          id: id,
          yesSymptomCount: yesCount,
          coOccurredInSamePeriod: mdqCoOccurred,
          moderateOrSeriousImpairment: mdqModerateImpairment,
          completedAt: now,
        );
      case 'ISI':
      default:
        return scoreIsi(
          id: id,
          itemResponses: rawAnswers,
          feltNeedForSleep: feltNeedForSleep,
          completedAt: now,
        );
    }
  }

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
          : 'Khảo sát Cảm xúc Hôm nay (BMS): Buồn $depressionScore/20, Lo âu $anxietyScore/20, Bực bội $angerScore/20, Tích cực $positiveMoodScore/20.',
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
      labelVi = 'Trầm cảm mức độ nặng ($total/27 điểm)';
      labelEn = 'Severe depressive symptoms ($total/27)';
    } else if (total >= 15) {
      severity = 'moderately_severe';
      labelVi = 'Trầm cảm mức độ trung bình - nặng ($total/27 điểm)';
      labelEn = 'Moderately severe depressive symptoms ($total/27)';
    } else if (total >= 10) {
      severity = 'moderate';
      labelVi = 'Trầm cảm mức độ trung bình ($total/27 điểm)';
      labelEn = 'Moderate depressive symptoms ($total/27)';
    } else if (total >= 5) {
      severity = 'mild';
      labelVi = 'Trầm cảm mức độ nhẹ ($total/27 điểm)';
      labelEn = 'Mild depressive symptoms ($total/27)';
    } else {
      severity = 'minimal';
      labelVi = 'Không có hoặc rất ít triệu chứng trầm cảm ($total/27 điểm)';
      labelEn = 'Minimal depressive symptoms ($total/27)';
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
      labelVi = 'Lo âu lan tỏa mức độ nặng ($total/21 điểm)';
      labelEn = 'Severe anxiety symptoms ($total/21)';
    } else if (total >= 10) {
      severity = 'moderate';
      labelVi = 'Lo âu lan tỏa mức độ trung bình ($total/21 điểm)';
      labelEn = 'Moderate anxiety symptoms ($total/21)';
    } else if (total >= 5) {
      severity = 'mild';
      labelVi = 'Lo âu mức độ nhẹ ($total/21 điểm)';
      labelEn = 'Mild anxiety symptoms ($total/21)';
    } else {
      severity = 'minimal';
      labelVi = 'Lo âu mức độ tối thiểu ($total/21 điểm)';
      labelEn = 'Minimal anxiety symptoms ($total/21)';
    }

    return AssessmentRecord(
      id: id,
      scaleCode: 'GAD-7',
      completedAt: completedAt ?? DateTime.now().toUtc(),
      totalScore: total,
      severityCode: severity,
      interpretationVi:
          '$labelVi — Gợi ý: Thực hành Hộp Lo âu (Worry Box), Thở dẫn nhịp 4-6 và Thang bước nhỏ vượt sợ hãi.',
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
      severityCode:
          triggersHypomania ? 'hypomania_or_mania_alert' : 'euthymic_range',
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
      severityCode: isPositiveScreen
          ? 'bipolar_spectrum_positive_screen'
          : 'negative_screen',
      interpretationVi: isPositiveScreen
          ? 'MDQ Dương tính ($clampedCount/13 triệu chứng xuất hiện cùng thời điểm kèm ảnh hưởng chức năng): Khuyến nghị thăm khám bác sĩ chuyên khoa tâm thần trước khi dùng thuốc chống trầm cảm đơn thuần.'
          : 'MDQ Âm tính ($clampedCount/13): Chưa đủ tiêu chí sàng lọc dương tính trên thang MDQ.',
      interpretationEn: isPositiveScreen
          ? 'MDQ Positive Screen ($clampedCount/13 co-occurring symptoms with functional impairment): Discuss with a psychiatrist before antidepressant monotherapy.'
          : 'MDQ Negative Screen ($clampedCount/13).',
      triggersHypomaniaGuard: isPositiveScreen,
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
          : 'Chỉ số Chất lượng Giấc ngủ ISI = $total/28: Hãy duy trì giờ thức dậy cố định và vệ sinh giấc ngủ lành mạnh.',
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
