// lib/domain/engine/distortion_detector.dart
// Deterministic 0ms Bilingual (Vietnamese & English) Pattern Matcher for:
// - 11 Burns Negative Cognitive Distortions
// - 5 Bipolar Positive Cognitive Distortions (Hypomania / Mania Guard)
// - 23 David Burns Self-Defeating Beliefs (SDBs)
// - Safety Behaviors (Anxiety maintenance factors)
// - 4-Layer Crisis & Safety Screen (Suicidal/Self-Harm, Mania/Psychosis Emergency,
//   Acute Distress >= 8/10, Real-World Danger / Domestic Abuse).

class CognitivePatternMatch {
  final String code;
  final String nameVi;
  final String nameEn;
  final String category; // 'negative_distortion' | 'positive_distortion' | 'sdb' | 'safety_behavior'
  final String socraticQuestionVi;
  final String socraticQuestionEn;
  final List<String> matchedPhrases;

  const CognitivePatternMatch({
    required this.code,
    required this.nameVi,
    required this.nameEn,
    required this.category,
    required this.socraticQuestionVi,
    required this.socraticQuestionEn,
    required this.matchedPhrases,
  });
}

enum SafetyGateAlertLevel {
  safe,
  acuteDistressTipp,
  realWorldDangerJustifiedExit,
  hypomaniaGuardAlert,
  crisisSafetyStop,
}

class FourLayerSafetyScreenResult {
  final SafetyGateAlertLevel alertLevel;
  final bool requiresImmediateSafetyStop;
  final bool requiresTippBeforeCbt;
  final bool isRealWorldDangerOrVictimization;
  final bool isSelfHarmTargetForChainAnalysis;
  final bool triggersShameProtocol;
  final List<String> matchedTriggers;
  final String clinicalDirectiveVi;
  final String clinicalDirectiveEn;
  final List<String> emergencyHotlinesVi;

  const FourLayerSafetyScreenResult({
    required this.alertLevel,
    required this.requiresImmediateSafetyStop,
    required this.requiresTippBeforeCbt,
    required this.isRealWorldDangerOrVictimization,
    required this.isSelfHarmTargetForChainAnalysis,
    required this.triggersShameProtocol,
    required this.matchedTriggers,
    required this.clinicalDirectiveVi,
    required this.clinicalDirectiveEn,
    this.emergencyHotlinesVi = const [
      'Cấp cứu Y tế Toàn quốc: 115',
      'Đường dây nóng Ngày Mai (Hỗ trợ Tâm lý & Trầm cảm): 096 306 1414',
      'Tổng đài Quốc gia Bảo vệ Trẻ em & Khủng hoảng: 111',
      'Viện Sức khỏe Tâm thần - BV Bạch Mai / BV Tâm thần TP.HCM',
    ],
  });
}

class DeterministicClinicalAnalysis {
  final List<CognitivePatternMatch> negativeDistortions;
  final List<CognitivePatternMatch> positiveDistortions;
  final List<CognitivePatternMatch> selfDefeatingBeliefs;
  final List<CognitivePatternMatch> safetyBehaviors;
  final FourLayerSafetyScreenResult safetyScreen;

  const DeterministicClinicalAnalysis({
    required this.negativeDistortions,
    required this.positiveDistortions,
    required this.selfDefeatingBeliefs,
    required this.safetyBehaviors,
    required this.safetyScreen,
  });
}

class _PatternRule {
  final String code;
  final String nameVi;
  final String nameEn;
  final String category;
  final List<String> keywords;
  final String socraticVi;
  final String socraticEn;

  const _PatternRule({
    required this.code,
    required this.nameVi,
    required this.nameEn,
    required this.category,
    required this.keywords,
    required this.socraticVi,
    required this.socraticEn,
  });
}

class DistortionDetector {
  const DistortionDetector();

  // 1. 11 Burns Negative Cognitive Distortions
  static const List<_PatternRule> _negativeDistortionRules = [
    _PatternRule(
      code: 'all_or_nothing',
      nameVi: 'Tư duy Trắng - Đen (All-or-Nothing Thinking)',
      nameEn: 'All-or-Nothing Thinking',
      category: 'negative_distortion',
      keywords: [
        'hoàn toàn thất bại',
        'chẳng được tích sự gì',
        'hoặc là hoàn hảo',
        'vô dụng hoàn toàn',
        'total failure',
        'completely useless',
        'all or nothing',
        '100% hoặc không',
      ],
      socraticVi:
          'Liệu giữa "hoàn hảo 100%" và "thất bại hoàn toàn" có khoảng xám hay phần nào bạn vẫn làm được không?',
      socraticEn:
          'Between 100% perfection and total failure, what shades of gray or partial progress exist here?',
    ),
    _PatternRule(
      code: 'overgeneralization',
      nameVi: 'Khái quát hóa Quá mức (Overgeneralization)',
      nameEn: 'Overgeneralization',
      category: 'negative_distortion',
      keywords: [
        'luôn luôn',
        'không bao giờ',
        'lúc nào cũng',
        'mọi người đều',
        'chẳng ai',
        'always',
        'never',
        'everyone always',
        'nobody ever',
      ],
      socraticVi:
          'Đã có dù chỉ 1 lần ngoại lệ nào trong quá khứ không diễn ra như từ "luôn luôn / không bao giờ" này chưa?',
      socraticEn:
          'Has there ever been even a single exception to "always" or "never" in your experience?',
    ),
    _PatternRule(
      code: 'mental_filter',
      nameVi: 'Lọc Tiêu cực (Mental Filter)',
      nameEn: 'Mental Filter',
      category: 'negative_distortion',
      keywords: [
        'chỉ thấy điểm xấu',
        'một lỗi nhỏ làm hỏng hết',
        'chỉ nhớ lời chê',
        'ruined the whole',
        'only notice the bad',
        'one mistake ruined',
      ],
      socraticVi:
          'Nếu lùi ống kính máy quay ra toàn cảnh, có những chi tiết trung tính hoặc tích cực nào đang bị bỏ sót không?',
      socraticEn:
          'If you zoom the camera lens out, what neutral or positive facts are being filtered out?',
    ),
    _PatternRule(
      code: 'discounting_the_positive',
      nameVi: 'Phủ nhận Điều Tích cực (Discounting the Positive)',
      nameEn: 'Discounting the Positive',
      category: 'negative_distortion',
      keywords: [
        'chỉ là ăn may',
        'ai chẳng làm được',
        'họ khen xã giao thôi',
        'không tính',
        'just lucky',
        'doesn\'t count',
        'anyone could do that',
      ],
      socraticVi:
          'Nếu một người bạn thân đạt được điều tương tự, bạn có bảo họ rằng "đó chỉ là ăn may, không tính" không?',
      socraticEn:
          'If a close friend achieved this same thing, would you tell them it doesn\'t count?',
    ),
    _PatternRule(
      code: 'mind_reading',
      nameVi: 'Đọc Suy nghĩ (Mind Reading)',
      nameEn: 'Mind Reading',
      category: 'negative_distortion',
      keywords: [
        'họ đang nghĩ tôi',
        'chắc chắn họ coi thường',
        'cô ấy cố tình phớt lờ',
        'anh ta ghét tôi',
        'they think i am',
        'she thinks i\'m',
        'judging me',
        'looking down on me',
      ],
      socraticVi:
          'Đó là câu chuyện tâm trí dự đoán — còn có bằng chứng trực tiếp hay lý do nào khác khiến họ hành xử như vậy không?',
      socraticEn:
          'What direct evidence do you have of their thoughts, and could there be another explanation for their behavior?',
    ),
    _PatternRule(
      code: 'fortune_telling',
      nameVi: 'Bói toán Tương lai Bi quan (Fortune Telling)',
      nameEn: 'Fortune Telling',
      category: 'negative_distortion',
      keywords: [
        'chắc chắn sẽ thất bại',
        'sẽ không bao giờ khỏi',
        'kiểu gì cũng hỏng',
        'sẽ chẳng đi đến đâu',
        'will definitely fail',
        'going to be a disaster',
        'i will never recover',
      ],
      socraticVi:
          'Trong những lần trước khi bạn dự đoán chắc chắn điều tồi tệ xảy ra, thực tế đã diễn ra như thế nào?',
      socraticEn:
          'In past situations when you predicted certain failure, how often did the prediction match reality?',
    ),
    _PatternRule(
      code: 'catastrophizing',
      nameVi: 'Thảm họa hóa (Catastrophizing)',
      nameEn: 'Catastrophizing',
      category: 'negative_distortion',
      keywords: [
        'thảm họa',
        'chấm hết',
        'sụp đổ hoàn toàn',
        'không thể chịu đựng nổi',
        'kinh khủng nhất',
        'catastrophe',
        'end of the world',
        'unbearable',
        'worst thing possible',
      ],
      socraticVi:
          'Giả sử kịch bản xấu đó xảy ra thật, bạn sẽ đối phó như thế nào sau 1 tuần hoặc 1 tháng nữa?',
      socraticEn:
          'Even if that difficult outcome happened, how would you cope one week or one month later?',
    ),
    _PatternRule(
      code: 'emotional_reasoning',
      nameVi: 'Lập luận theo Cảm xúc (Emotional Reasoning)',
      nameEn: 'Emotional Reasoning',
      category: 'negative_distortion',
      keywords: [
        'tôi cảm thấy mình vô dụng nên',
        'thấy lo nghĩa là sắp có chuyện',
        'cảm thấy tội lỗi nên chắc chắn tôi sai',
        'i feel like a loser so i must be',
        'i feel anxious so it must be dangerous',
      ],
      socraticVi:
          'Cảm xúc là có thật, nhưng cảm giác có luôn luôn là bằng chứng của sự thật khách quan không?',
      socraticEn:
          'Your feelings are very real, but does feeling something automatically make it an objective fact?',
    ),
    _PatternRule(
      code: 'should_statements',
      nameVi: 'Mệnh lệnh "Phải / Nên" (Should Statements)',
      nameEn: 'Should Statements',
      category: 'negative_distortion',
      keywords: [
        'lẽ ra tôi phải',
        'tôi bắt buộc phải',
        'không được phép yếu đuối',
        'tôi nên làm tốt hơn',
        'i should have',
        'i must never',
        'i ought to',
      ],
      socraticVi:
          'Nếu thay từ "Tôi bắt buộc phải..." bằng "Tôi mong muốn / sẽ tốt hơn nếu...", áp lực trong cơ thể bạn thay đổi thế nào?',
      socraticEn:
          'How does the pressure shift if you replace "I must/should" with "I would prefer to"?',
    ),
    _PatternRule(
      code: 'labeling',
      nameVi: 'Gán nhãn Bản thân (Labeling)',
      nameEn: 'Labeling',
      category: 'negative_distortion',
      keywords: [
        'tôi là kẻ thất bại',
        'tôi là đồ bỏ đi',
        'tôi thật ngu ngốc',
        'kẻ vô dụng',
        'i am a failure',
        'i am a loser',
        'i\'m an idiot',
        'i am worthless',
      ],
      socraticVi:
          'Một hành động hay một lỗi lầm cụ thể có thể định nghĩa toàn bộ con người phức tạp của bạn không?',
      socraticEn:
          'Can a single mistake or event define the entirety of who you are as a human being?',
    ),
    _PatternRule(
      code: 'personalization_and_blame',
      nameVi: 'Cá nhân hóa & Tự đổ lỗi (Personalization & Self-Blame)',
      nameEn: 'Personalization & Blame',
      category: 'negative_distortion',
      keywords: [
        'tất cả là lỗi của tôi',
        'tại tôi mà mọi người',
        'do tôi hết',
        'all my fault',
        'because of me everything failed',
      ],
      socraticVi:
          'Nếu vẽ một biểu đồ hình tròn các yếu tố góp phần vào sự việc này, ngoài bạn ra còn những yếu tố khách quan nào khác?',
      socraticEn:
          'If you drew a responsibility pie chart for this outcome, what other factors outside your control contributed?',
    ),
  ];

  // 2. 5 Bipolar Positive Cognitive Distortions (David Burns & Lam Bipolar CBT)
  static const List<_PatternRule> _positiveDistortionRules = [
    _PatternRule(
      code: 'bipolar_grandiosity',
      nameVi: 'Tự cao / Ý tưởng Thiên tài (Grandiosity)',
      nameEn: 'Grandiosity',
      category: 'positive_distortion',
      keywords: [
        'ý tưởng thiên tài',
        'tôi được chọn',
        'sứ mệnh vĩ đại',
        'không ai hiểu kịp tầm nhìn',
        'tỷ phú ngay tuần sau',
        'genius idea',
        'change the world overnight',
        'unstoppable genius',
      ],
      socraticVi:
          '[Devil\'s Advocate] Ý tưởng này rất cuốn hút — nếu mời 2 người bạn tin cậy phản biện lúc 10 giờ sáng mai, họ sẽ hỏi câu hỏi thực tế nào?',
      socraticEn:
          '[Devil\'s Advocate] This vision feels thrilling right now — what practical questions would two trusted allies ask tomorrow morning?',
    ),
    _PatternRule(
      code: 'bipolar_invulnerability',
      nameVi: 'Ảo tưởng Bất khả Xâm phạm (Invulnerability / Zero Risk)',
      nameEn: 'Invulnerability',
      category: 'positive_distortion',
      keywords: [
        'không thể thua được',
        'rủi ro bằng 0',
        'chắc chắn thắng 100%',
        'không có gì cản nổi',
        'cannot lose',
        'zero risk',
        '100% guaranteed win',
        'invincible',
      ],
      socraticVi:
          '[Devil\'s Advocate] Trong mọi khoản đầu tư hay quyết định lớn, nếu có 20% khả năng xảy ra rủi ro ngoài ý muốn thì điểm yếu nằm ở đâu?',
      socraticEn:
          '[Devil\'s Advocate] If there were a 20% chance of an unexpected downside, where would the vulnerability be?',
    ),
    _PatternRule(
      code: 'bipolar_hyper_optimism',
      nameVi: 'Lạc quan Phi thực tế & Muốn Bỏ thuốc (Hyper-Optimism)',
      nameEn: 'Hyper-Optimism & Cure Illusion',
      category: 'positive_distortion',
      keywords: [
        'khỏi bệnh hoàn toàn rồi',
        'không cần uống thuốc nữa',
        'thuốc làm mất sáng tạo',
        'mọi thứ hoàn hảo tuyệt đối',
        'i am completely cured',
        'stop taking my meds',
        'don\'t need lithium',
        'meds kill my creativity',
      ],
      socraticVi:
          'Cảm giác khỏe khoắn lúc này rất quý giá. Liệu sự ổn định đó có phải nhờ thuốc đang phát huy tác dụng, và những lần tự ngưng thuốc trước đây đã dẫn tới điều gì?',
      socraticEn:
          'Feeling good is wonderful. Could your medication be helping maintain that foundation, and what happened the last time meds were stopped early?',
    ),
    _PatternRule(
      code: 'bipolar_impulse_justification',
      nameVi: 'Hợp thức hóa Xung động Cấp bách (Impulse Justification)',
      nameEn: 'Impulse Justification',
      category: 'positive_distortion',
      keywords: [
        'phải mua ngay kẻo lỡ',
        'all-in ngay bây giờ',
        'nghỉ việc ngay đêm nay',
        'chuyển tiền ngay lập tức',
        'must buy right now',
        'invest everything tonight',
        'quit my job right now',
      ],
      socraticVi:
          'Nếu cơ hội này thực sự bền vững và đúng đắn, nó có còn giá trị sau khi được khóa vào Khoang Chờ 48 Giờ và qua 2 giấc ngủ trọn vẹn không?',
      socraticEn:
          'If this decision is truly sound, will it still be worth making after resting in the 48-Hour Impulse Vault across two full nights of sleep?',
    ),
    _PatternRule(
      code: 'bipolar_magical_energy',
      nameVi: 'Ảo tưởng Năng lượng Vô tận / Không cần ngủ (Magical Energy)',
      nameEn: 'Magical Energy & No Need for Sleep',
      category: 'positive_distortion',
      keywords: [
        'không cần ngủ',
        'ngủ là phí thời gian',
        'thức trắng 3 đêm vẫn khỏe',
        'năng lượng vô tận',
        'don\'t need sleep',
        'sleep is a waste of time',
        'infinite energy',
        'awake for days and feel great',
      ],
      socraticVi:
          'Não bộ đang tiết rất nhiều dopamine và adrenaline nên bạn không cảm thấy mệt. Bạn có sẵn lòng nằm nghỉ trong phòng tối (Dark Rest) 30 phút để bảo vệ hệ thần kinh không?',
      socraticEn:
          'High dopamine can mask physical exhaustion. Would you be willing to practice Dark Rest for 30 minutes to protect your nervous system?',
    ),
  ];

  // 3. 23 Self-Defeating Beliefs (SDBs — David Burns TEAM-CBT)
  static const List<_PatternRule> _selfDefeatingBeliefRules = [
    _PatternRule(
      code: 'sdb_performance_perfectionism',
      nameVi: 'Cầu toàn Thành tích (Performance Perfectionism)',
      nameEn: 'Performance Perfectionism',
      category: 'sdb',
      keywords: ['không được phép mắc lỗi', 'never make a mistake', 'phải hoàn hảo mọi việc'],
      socraticVi: 'Có lợi ích gì và cái giá nào khi đặt tiêu chuẩn không bao giờ được phép sai sót?',
      socraticEn: 'What are the costs and benefits of demanding zero mistakes from yourself?',
    ),
    _PatternRule(
      code: 'sdb_perceived_perfectionism',
      nameVi: 'Cầu toàn Hình ảnh (Perceived Perfectionism)',
      nameEn: 'Perceived Perfectionism',
      category: 'sdb',
      keywords: ['sợ người khác thấy điểm yếu', 'hide my flaws', 'không ai yêu nếu thấy khuyết điểm'],
      socraticVi: 'Sự chân thật và dám bộc lộ điểm chưa hoàn hảo có giúp kết nối gần gũi hơn không?',
      socraticEn: 'Could allowing yourself to be human and imperfect actually deepen connection?',
    ),
    _PatternRule(
      code: 'sdb_achievement_addiction',
      nameVi: 'Nghiện Thành tựu (Achievement Addiction)',
      nameEn: 'Achievement Addiction',
      category: 'sdb',
      keywords: ['giá trị của tôi phụ thuộc vào thành công', 'worth depends on achievement', 'nếu không thành công tôi vô giá trị'],
      socraticVi: 'Giá trị con người bạn có mất đi khi bạn nghỉ ngơi hoặc khi một dự án gặp trắc trở không?',
      socraticEn: 'Does a human being\'s intrinsic worth disappear when they rest?',
    ),
    _PatternRule(
      code: 'sdb_approval_addiction',
      nameVi: 'Nghiện Sự Công nhận (Approval Addiction)',
      nameEn: 'Approval Addiction',
      category: 'sdb',
      keywords: ['cần tất cả mọi người hài lòng', 'everyone must approve of me', 'sợ bị chê trách'],
      socraticVi: 'Liệu có ai trên thế giới có thể làm hài lòng 100% mọi người mà không đánh mất chính mình?',
      socraticEn: 'Is it possible to please 100% of people without losing your own voice?',
    ),
    _PatternRule(
      code: 'sdb_love_addiction',
      nameVi: 'Nghiện Tình yêu (Love Addiction)',
      nameEn: 'Love Addiction',
      category: 'sdb',
      keywords: ['không có người yêu thì không thể hạnh phúc', 'nothing without a partner', 'cô đơn là vô nghĩa'],
      socraticVi: 'Hạnh phúc tự thân và hạnh phúc trong tình yêu có thể song hành mà không phụ thuộc tuyệt đối không?',
      socraticEn: 'Can you experience meaningful moments and self-respect independently of romance?',
    ),
    _PatternRule(
      code: 'sdb_rejection_phobia',
      nameVi: 'Ám ảnh Bị Từ chối (Fear of Rejection)',
      nameEn: 'Fear of Rejection',
      category: 'sdb',
      keywords: ['bị từ chối là chấm hết', 'rejection means i am unlovable', 'sợ bị bỏ rơi'],
      socraticVi: 'Một lời từ chối phản ánh sự không phù hợp giữa hai phía hay định đoạt giá trị của bạn?',
      socraticEn: 'Does one rejection reflect mismatch, or does it erase your worth?',
    ),
    _PatternRule(
      code: 'sdb_pleasing_others',
      nameVi: 'Bệnh Tử tế / Làm hài lòng Người khác (Pleasing Others)',
      nameEn: 'Pleasing Others',
      category: 'sdb',
      keywords: ['không dám từ chối', 'sợ làm mất lòng', 'luôn nhường nhịn dù ấm ức', 'can\'t say no'],
      socraticVi: 'Khi bạn luôn nói "Vâng" với người khác trong khi lòng muốn nói "Không", cảm xúc ẩn giấu bên trong là gì?',
      socraticEn: 'When you say Yes while wanting to say No, what hidden emotion builds up inside?',
    ),
    _PatternRule(
      code: 'sdb_conflict_phobia',
      nameVi: 'Ám ảnh Xung đột (Conflict Phobia)',
      nameEn: 'Conflict Phobia',
      category: 'sdb',
      keywords: ['sợ cãi nhau', 'tránh né bất đồng bằng mọi giá', 'conflict is dangerous'],
      socraticVi: 'Bày tỏ bất đồng một cách tôn trọng (DEAR MAN / EAR) có thể giúp mối quan hệ lành mạnh hơn không?',
      socraticEn: 'Can respectful disagreement via DEAR MAN actually strengthen a relationship?',
    ),
    _PatternRule(
      code: 'sdb_self_blame',
      nameVi: 'Tự Đổ lỗi Toàn diện (Self-Blame)',
      nameEn: 'Self-Blame',
      category: 'sdb',
      keywords: ['mọi vấn đề đều do lỗi của tôi', 'i am to blame for everything'],
      socraticVi: 'Bạn đang nhận trách nhiệm hợp lý hay đang gánh luôn phần trách nhiệm của người khác?',
      socraticEn: 'Are you taking healthy accountability or carrying responsibility that isn\'t yours?',
    ),
    _PatternRule(
      code: 'sdb_other_blame',
      nameVi: 'Đổ lỗi cho Người khác (Other-Blame)',
      nameEn: 'Other-Blame',
      category: 'sdb',
      keywords: ['tất cả là tại họ', 'họ phải thay đổi trước', 'they ruined my life'],
      socraticVi: 'Dù người kia có sai, phần hành động nào nằm trong tầm kiểm soát của chính bạn lúc này?',
      socraticEn: 'Even when others act unfairly, what small step remains within your own control?',
    ),
    _PatternRule(
      code: 'sdb_entitlement',
      nameVi: 'Đòi hỏi Đặc quyền (Entitlement)',
      nameEn: 'Entitlement',
      category: 'sdb',
      keywords: ['mọi thứ phải theo ý tôi', 'things should always go my way'],
      socraticVi: 'Chấp nhận thực tế không hoàn hảo (Radical Acceptance) giúp bạn giảm bớt cơn giận như thế nào?',
      socraticEn: 'How might Radical Acceptance of reality reduce your frustration right now?',
    ),
    _PatternRule(
      code: 'sdb_subhuman',
      nameVi: 'Hạ thấp Nhân phẩm Bản thân (Subhuman Belief)',
      nameEn: 'Worthlessness / Defectiveness',
      category: 'sdb',
      keywords: ['tôi thấp kém hơn mọi người', 'tôi bị lỗi từ trong bản chất', 'fundamentally defective'],
      socraticVi: 'Nếu nói chuyện với chính mình bằng sự tử tế như với một đứa trẻ đang tổn thương, bạn sẽ nói gì?',
      socraticEn: 'If you spoke to yourself with the compassion you\'d offer a hurting child, what would you say?',
    ),
    _PatternRule(
      code: 'sdb_hopelessness',
      nameVi: 'Tuyệt vọng Tuyệt đối (Hopelessness)',
      nameEn: 'Hopelessness',
      category: 'sdb',
      keywords: ['không bao giờ khá lên được', 'mãi mãi tăm tối', 'things will never improve'],
      socraticVi: 'Khi trầm cảm hoặc mệt mỏi, não bộ dự đoán tương lai qua lăng kính nào?',
      socraticEn: 'How does depression color predictions about the future?',
    ),
    _PatternRule(
      code: 'sdb_emotional_perfectionism',
      nameVi: 'Cầu toàn Cảm xúc (Emotional Perfectionism)',
      nameEn: 'Emotional Perfectionism',
      category: 'sdb',
      keywords: ['tôi không được phép buồn', 'phải luôn tích cực', 'i shouldn\'t feel anxious'],
      socraticVi: 'Cho phép mình cảm nhận nỗi buồn hoặc lo âu tự nhiên có làm bạn nhẹ nhõm hơn việc chống cự nó không?',
      socraticEn: 'Does allowing natural human emotion feel lighter than fighting against it?',
    ),
    _PatternRule(
      code: 'sdb_anger_phobia',
      nameVi: 'Sợ Cơn giận (Anger Phobia)',
      nameEn: 'Anger Phobia',
      category: 'sdb',
      keywords: ['tức giận là người xấu', 'không bao giờ được nổi giận', 'anger is bad'],
      socraticVi: 'Cơn giận đang báo hiệu ranh giới nào của bạn cần được bảo vệ một cách điềm tĩnh?',
      socraticEn: 'What boundary is your frustration asking you to protect calmly?',
    ),
    _PatternRule(
      code: 'sdb_emotophobia',
      nameVi: 'Sợ Cảm xúc Mạnh (Emotophobia)',
      nameEn: 'Emotophobia',
      category: 'sdb',
      keywords: ['sợ mất kiểm soát cảm xúc', 'cảm xúc này sẽ nuốt chửng tôi', 'emotions will overwhelm me'],
      socraticVi: 'Mọi cơn sóng cảm xúc đều có đỉnh rồi tự hạ xuống (Urge Surfing) — bạn có thể quan sát nó thêm 2 phút không?',
      socraticEn: 'Every emotional wave peaks and subsides — can you surf this wave for two minutes?',
    ),
    _PatternRule(
      code: 'sdb_perceived_narcissism',
      nameVi: 'Nghi ngờ Người khác Ích kỷ (Perceived Narcissism)',
      nameEn: 'Perceived Narcissism',
      category: 'sdb',
      keywords: ['ai cũng chỉ biết lợi dụng', 'không ai thực sự quan tâm', 'nobody truly cares'],
      socraticVi: 'Có ai từng dành cho bạn một cử chỉ quan tâm nhỏ dù họ chưa hoàn hảo không?',
      socraticEn: 'Has anyone shown a small gesture of care, even imperfectly?',
    ),
    _PatternRule(
      code: 'sdb_brushfire_fallacy',
      nameVi: 'Ngụy biện Cháy rừng (Brushfire Fallacy)',
      nameEn: 'Brushfire Fallacy',
      category: 'sdb',
      keywords: ['một người chê là cả thiên hạ đều chê', 'if one person dislikes me everyone will'],
      socraticVi: 'Ý kiến của một cá nhân có đại diện cho toàn bộ những người khác trong cuộc đời bạn không?',
      socraticEn: 'Does one person\'s opinion represent everyone else in your life?',
    ),
    _PatternRule(
      code: 'sdb_spotlight_fallacy',
      nameVi: 'Ngụy biện Ánh đèn Sân khấu (Spotlight Fallacy)',
      nameEn: 'Spotlight Fallacy',
      category: 'sdb',
      keywords: ['mọi người đều đang nhìn chằm chằm vào lỗi của tôi', 'everyone is staring at me'],
      socraticVi: 'Trong thực tế, mỗi người thường bận tâm đến việc riêng của họ bao nhiêu phần trăm thời gian?',
      socraticEn: 'How much of the time are other people focused on their own worries rather than watching you?',
    ),
    _PatternRule(
      code: 'sdb_magical_thinking',
      nameVi: 'Tư duy Ma thuật về Lo lắng (Magical Thinking)',
      nameEn: 'Magical Worry Thinking',
      category: 'sdb',
      keywords: ['phải lo lắng thì mới tránh được xui xẻo', 'worrying keeps my family safe', 'nếu không lo sẽ gặp họa'],
      socraticVi: 'Việc chuẩn bị thực tế (Problem-Solving) khác với việc dằn vặt lo âu (Worry) ở điểm nào?',
      socraticEn: 'How does practical preparation differ from repetitive worrying?',
    ),
    _PatternRule(
      code: 'sdb_low_frustration_tolerance',
      nameVi: 'Ngưỡng Chịu đựng Khó khăn Thấp (Low Frustration Tolerance)',
      nameEn: 'Low Frustration Tolerance',
      category: 'sdb',
      keywords: ['việc này quá khó không làm nổi đâu', 'phải có hứng mới làm được', 'too hard to even start'],
      socraticVi: 'Nếu chỉ làm thử đúng 2 phút đầu tiên rồi được phép dừng, bạn có sẵn sàng thử không?',
      socraticEn: 'If you only committed to the first 2 minutes, how manageable would that feel?',
    ),
    _PatternRule(
      code: 'sdb_superman_superwoman',
      nameVi: 'Hội chứng Siêu nhân (Superman / Superwoman)',
      nameEn: 'Superman / Superwoman Complex',
      category: 'sdb',
      keywords: ['tôi phải tự gánh vác hết một mình', 'nhờ giúp đỡ là yếu đuối', 'must carry everything alone'],
      socraticVi: 'Cho phép bản thân nghỉ ngơi hoặc chia sẻ gánh nặng có phải là sự khôn ngoan bền vững không?',
      socraticEn: 'Is sharing the load or resting a sign of sustainable wisdom?',
    ),
    _PatternRule(
      code: 'sdb_chronic_martyrdom',
      nameVi: 'Hy sinh Chịu đựng Thầm lặng (Chronic Martyrdom)',
      nameEn: 'Chronic Martyrdom',
      category: 'sdb',
      keywords: ['tôi hy sinh hết mà chẳng ai tự hiểu', 'họ phải tự biết tôi cần gì', 'they should know what i need'],
      socraticVi: 'Người khác không thể đọc suy nghĩ — nếu bạn nói rõ nhu cầu của mình bằng DEAR MAN, điều gì sẽ thay đổi?',
      socraticEn: 'Since others cannot read minds, what changes when you ask clearly using DEAR MAN?',
    ),
  ];

  // 4. Safety Behaviors (Maintaining Anxiety)
  static const List<_PatternRule> _safetyBehaviorRules = [
    _PatternRule(
      code: 'sb_reassurance_seeking',
      nameVi: 'Tìm kiếm Trấn an Liên tục (Excessive Reassurance Seeking)',
      nameEn: 'Reassurance Seeking',
      category: 'safety_behavior',
      keywords: ['hỏi đi hỏi lại xem có sao không', 'tra google triệu chứng liên tục', 'asking for reassurance'],
      socraticVi: 'Việc hỏi trấn an giúp bạn yên tâm trong vài phút, nhưng về lâu dài nó dạy não bộ điều gì về nỗi sợ?',
      socraticEn: 'Reassurance relieves anxiety for minutes, but what does it teach your brain long-term?',
    ),
    _PatternRule(
      code: 'sb_physiological_checking',
      nameVi: 'Kiểm tra Nhịp tim / Cơ thể Liên tục (Body & Pulse Checking)',
      nameEn: 'Body & Pulse Checking',
      category: 'safety_behavior',
      keywords: ['đo nhịp tim liên tục', 'kiểm tra mạch', 'đo huyết áp chục lần', 'checking my pulse constantly'],
      socraticVi: 'Khi bạn càng chú ý đo nhịp tim, hệ thần kinh giao cảm càng kích hoạt hay càng dịu xuống?',
      socraticEn: 'Does constantly checking your pulse calm your nervous system or amplify the alarm?',
    ),
    _PatternRule(
      code: 'sb_over_preparation_avoidance',
      nameVi: 'Chuẩn bị Quá mức & Né tránh Ánh mắt (Over-Preparation & Subtle Avoidance)',
      nameEn: 'Over-Preparation & Subtle Avoidance',
      category: 'safety_behavior',
      keywords: ['né tránh ánh mắt', 'ngồi gần cửa thoát hiểm', 'học thuộc từng chữ mới dám nói', 'avoiding eye contact'],
      socraticVi: 'Trong lần tiếp xúc tới, bạn có muốn thử bỏ 1 hành vi an toàn nhỏ này để thấy mình vẫn an toàn không?',
      socraticEn: 'In your next exposure step, could you test dropping this one safety behavior?',
    ),
  ];

  // Layer 1: Suicidal / Self-Harm Crisis Keywords (Vietnamese & English)
  static const List<String> _crisisSuicideSelfHarmKeywords = [
    'muốn tự tử',
    'muốn chết',
    'kết liễu cuộc đời',
    'không muốn sống nữa',
    'tự làm đau bản thân',
    'tự hại',
    'cắt tay',
    'uống thuốc quá liều',
    'nhảy lầu',
    'chết đi cho xong',
    'kill myself',
    'want to die',
    'end my life',
    'suicide',
    'suicidal',
    'self-harm',
    'self harm',
    'cut myself',
    'overdose',
    'better off dead',
  ];

  // Layer 1b: Acute Mania / Psychosis Emergency Keywords
  static const List<String> _maniaPsychosisEmergencyKeywords = [
    'nghe thấy tiếng nói trong đầu ra lệnh',
    'có người theo dõi cài chip',
    'tôi là chúa trời',
    'bất tử không thể chết',
    'command hallucinations',
    'voices telling me to hurt',
    'implanted a chip in my brain',
  ];

  // Layer 3: Real-world Danger / Domestic Violence / Victimization Keywords
  static const List<String> _realWorldDangerKeywords = [
    'đang bị đánh',
    'bạo hành gia đình',
    'đe dọa giết',
    'chồng đánh',
    'bị xâm hại',
    'cầm dao đe dọa',
    'không an toàn trong nhà',
    'domestic violence',
    'hitting me',
    'threatened to kill me',
    'physically abused',
    'unsafe at home',
    'being assaulted',
  ];

  // Shame Protocol Triggers (for Chain Analysis & CBT)
  static const List<String> _shameProtocolKeywords = [
    'tôi thật kinh tởm',
    'quá nhục nhã',
    'ghê tởm bản thân',
    'tôi thật ngu xuẩn',
    'không đáng làm người',
    'i am disgusting',
    'so ashamed of myself',
    'i hate myself so much',
    'deeply humiliated',
  ];

  DeterministicClinicalAnalysis analyzeText({
    required String text,
    int preIntensity = 5,
    int moodPolarity = 0,
    int energyLevel = 0,
    int bmsSuicideItemScore = 0,
    int phq9Item9Score = 0,
    int asrmScore = 0,
  }) {
    final normalized = text.toLowerCase();

    final negMatches = _matchRules(normalized, _negativeDistortionRules);
    final posMatches = _matchRules(normalized, _positiveDistortionRules);
    final sdbMatches = _matchRules(normalized, _selfDefeatingBeliefRules);
    final sbMatches = _matchRules(normalized, _safetyBehaviorRules);

    final safety = evaluateFourLayerSafetyGate(
      text: text,
      preIntensity: preIntensity,
      moodPolarity: moodPolarity,
      energyLevel: energyLevel,
      bmsSuicideItemScore: bmsSuicideItemScore,
      phq9Item9Score: phq9Item9Score,
      asrmScore: asrmScore,
    );

    return DeterministicClinicalAnalysis(
      negativeDistortions: negMatches,
      positiveDistortions: posMatches,
      selfDefeatingBeliefs: sdbMatches,
      safetyBehaviors: sbMatches,
      safetyScreen: safety,
    );
  }

  FourLayerSafetyScreenResult evaluateFourLayerSafetyGate({
    required String text,
    int preIntensity = 5,
    int moodPolarity = 0,
    int energyLevel = 0,
    int bmsSuicideItemScore = 0,
    int phq9Item9Score = 0,
    int asrmScore = 0,
  }) {
    final normalized = text.toLowerCase();
    final matchedCrisis = <String>[];

    for (final kw in _crisisSuicideSelfHarmKeywords) {
      if (normalized.contains(kw)) {
        matchedCrisis.add(kw);
      }
    }
    for (final kw in _maniaPsychosisEmergencyKeywords) {
      if (normalized.contains(kw)) {
        matchedCrisis.add(kw);
      }
    }

    final hasAssessmentSuicideFlag =
        bmsSuicideItemScore >= 1 || phq9Item9Score >= 1;

    final triggersShame =
        _shameProtocolKeywords.any((kw) => normalized.contains(kw));

    // Layer 1 & Layer 2: Immediate Crisis Safety Stop
    if (matchedCrisis.isNotEmpty || hasAssessmentSuicideFlag) {
      if (hasAssessmentSuicideFlag && matchedCrisis.isEmpty) {
        matchedCrisis.add('assessment_suicide_item_positive');
      }
      return FourLayerSafetyScreenResult(
        alertLevel: SafetyGateAlertLevel.crisisSafetyStop,
        requiresImmediateSafetyStop: true,
        requiresTippBeforeCbt: false,
        isRealWorldDangerOrVictimization: false,
        isSelfHarmTargetForChainAnalysis: true,
        triggersShameProtocol: triggersShame,
        matchedTriggers: matchedCrisis,
        clinicalDirectiveVi:
            'DỪNG KHẨN CẤP (SAFETY STOP): An toàn của bạn là ưu tiên số 1 lúc này. '
            'Hệ thống đã tắt mọi bài tập phân tích nhận thức và kết nối ngay tới Đường dây nóng Khẩn cấp cùng Bản Giao ước An toàn (Ulysses Contract).',
        clinicalDirectiveEn:
            'IMMEDIATE SAFETY STOP: Your safety comes first. All cognitive exercises are paused. '
            'Please connect immediately with crisis hotlines or your trusted contacts.',
      );
    }

    // Layer 3: Real-world Danger / Domestic Abuse / Victimization
    final matchedDanger = <String>[];
    for (final kw in _realWorldDangerKeywords) {
      if (normalized.contains(kw)) {
        matchedDanger.add(kw);
      }
    }
    if (matchedDanger.isNotEmpty) {
      return FourLayerSafetyScreenResult(
        alertLevel: SafetyGateAlertLevel.realWorldDangerJustifiedExit,
        requiresImmediateSafetyStop: false,
        requiresTippBeforeCbt: false,
        isRealWorldDangerOrVictimization: true,
        isSelfHarmTargetForChainAnalysis: false,
        triggersShameProtocol: triggersShame,
        matchedTriggers: matchedDanger,
        clinicalDirectiveVi:
            'BẢO VỆ AN TOÀN THỰC TẾ (JUSTIFIED EXIT): Nỗi sợ của bạn là hoàn toàn chính đáng trước nguy hiểm thực tế. '
            'Tuyệt đối không tái cấu trúc suy nghĩ hay chạy Chain Analysis. Hãy ưu tiên rời khỏi nơi nguy hiểm và gọi hỗ trợ (113 / 111).',
        clinicalDirectiveEn:
            'REAL-WORLD SAFETY PRIORITY (JUSTIFIED EXIT): Your fear is completely justified given real-world danger. '
            'Do not use cognitive restructuring or Chain Analysis. Focus on physical safety and emergency support.',
      );
    }

    // Layer 2b: Mixed State or Acute Arousal (Intensity >= 8/10) -> DBT TIPP First
    final isMixedState = moodPolarity <= -2 && energyLevel >= 2;
    if (preIntensity >= 8 || isMixedState) {
      final triggers = <String>[
        if (preIntensity >= 8) 'pre_intensity_${preIntensity}_gte_8',
        if (isMixedState) 'bipolar_mixed_state_mood_${moodPolarity}_energy_$energyLevel',
      ];
      return FourLayerSafetyScreenResult(
        alertLevel: SafetyGateAlertLevel.acuteDistressTipp,
        requiresImmediateSafetyStop: false,
        requiresTippBeforeCbt: true,
        isRealWorldDangerOrVictimization: false,
        isSelfHarmTargetForChainAnalysis: false,
        triggersShameProtocol: triggersShame,
        matchedTriggers: triggers,
        clinicalDirectiveVi:
            'NGƯỠNG KÍCH HOẠT SINH LÝ CAO (DBT-FIRST ROUTER): Khi cường độ cảm xúc >= 8/10 hoặc đang ở Pha Hỗn hợp, '
            'hệ thần kinh cần hạ nhiệt sinh lý trước tiên bằng DBT TIPP / Thở dẫn nhịp (không ép làm CBT Thought Record lúc này).',
        clinicalDirectiveEn:
            'HIGH PHYSIOLOGICAL AROUSAL (DBT-FIRST): At intensity >= 8/10 or during a Mixed State, '
            'physiological de-escalation via DBT TIPP is required before cognitive work.',
      );
    }

    // Layer 2c: Hypomania Guard (Mood >= +2 or ASRM >= 6)
    if (moodPolarity >= 2 || asrmScore >= 6) {
      return FourLayerSafetyScreenResult(
        alertLevel: SafetyGateAlertLevel.hypomaniaGuardAlert,
        requiresImmediateSafetyStop: false,
        requiresTippBeforeCbt: false,
        isRealWorldDangerOrVictimization: false,
        isSelfHarmTargetForChainAnalysis: false,
        triggersShameProtocol: triggersShame,
        matchedTriggers: [
          if (moodPolarity >= 2) 'mood_polarity_plus_$moodPolarity',
          if (asrmScore >= 6) 'asrm_score_$asrmScore',
        ],
        clinicalDirectiveVi:
            'LÁ CHẮN HƯNG CẢM NHẸ (HYPOMANIA GUARD): Kích hoạt giao diện Low-Stimulus Dark Rest, '
            'Khoang Chờ Quyết định 48 Giờ và kỹ thuật Devil\'s Advocate.',
        clinicalDirectiveEn:
            'HYPOMANIA GUARD ACTIVE: Low-Stimulus Dark Rest UI, 48-Hour Impulse Vault, and Devil\'s Advocate enabled.',
      );
    }

    return FourLayerSafetyScreenResult(
      alertLevel: SafetyGateAlertLevel.safe,
      requiresImmediateSafetyStop: false,
      requiresTippBeforeCbt: false,
      isRealWorldDangerOrVictimization: false,
      isSelfHarmTargetForChainAnalysis: false,
      triggersShameProtocol: triggersShame,
      matchedTriggers: const [],
      clinicalDirectiveVi: 'An toàn lâm sàng: Đủ điều kiện thực hành CBT / TEAM-CBT / DBT.',
      clinicalDirectiveEn: 'Clinically safe for structured CBT / TEAM-CBT / DBT protocols.',
    );
  }

  List<CognitivePatternMatch> _matchRules(
    String normalizedText,
    List<_PatternRule> rules,
  ) {
    final results = <CognitivePatternMatch>[];
    for (final rule in rules) {
      final matched = <String>[];
      for (final kw in rule.keywords) {
        if (normalizedText.contains(kw.toLowerCase())) {
          matched.add(kw);
        }
      }
      if (matched.isNotEmpty) {
        results.add(
          CognitivePatternMatch(
            code: rule.code,
            nameVi: rule.nameVi,
            nameEn: rule.nameEn,
            category: rule.category,
            socraticQuestionVi: rule.socraticVi,
            socraticQuestionEn: rule.socraticEn,
            matchedPhrases: matched,
          ),
        );
      }
    }
    return results;
  }
}
