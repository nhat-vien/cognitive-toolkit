/**
 * Deterministic 0ms Bilingual (Vietnamese + English) Clinical Pattern Detector
 * - 11 Burns Negative Cognitive Distortions
 * - 5 Bipolar Positive Cognitive Distortions (Hypomania / Mania)
 * - 23 Self-Defeating Beliefs (SDBs - Dr. David Burns TEAM-CBT)
 * - Safety Behaviors (Anxiety maintenance crutches)
 * - 4-Layer Safety & Crisis Detector
 */

import type { BipolarPole, SessionOutcome, TechniqueSlug } from '../schemas/models.ts';

export interface DetectedPatternMatch {
  id: string;
  nameEn: string;
  nameVi: string;
  category:
    | 'negative_distortion'
    | 'positive_distortion'
    | 'self_defeating_belief'
    | 'safety_behavior';
  matchedPhrases: string[];
  clinicalReframeEn: string;
  clinicalReframeVi: string;
}

export interface FourLayerSafetyEvaluation {
  safeToProceedWithCbt: boolean;
  triggeredLayer: 0 | 1 | 2 | 3 | 4;
  severity: 'safe' | 'real-world-danger' | 'acute-distress-tipp' | 'mania-emergency' | 'crisis-safety-stop';
  recommendedOutcome: SessionOutcome;
  recommendedTechnique?: TechniqueSlug;
  pushbackOverride?: 'off';
  matchedTriggers: string[];
  messageVi: string;
  messageEn: string;
  hotlines: Array<{ name: string; phone: string; hours: string }>;
}

interface PatternDefinition {
  id: string;
  nameEn: string;
  nameVi: string;
  patterns: RegExp[];
  clinicalReframeEn: string;
  clinicalReframeVi: string;
}

/**
 * 1. 11 Burns Negative Cognitive Distortions (Biến dạng Nhận thức Âm tính)
 */
export const NEGATIVE_DISTORTION_DEFINITIONS: PatternDefinition[] = [
  {
    id: 'all-or-nothing',
    nameEn: 'All-or-Nothing Thinking',
    nameVi: 'Tư duy Trắng-Đen (Tuyệt đối hóa)',
    patterns: [
      /\b(completely|totally|100%|zero|nothing at all|either .* or|total failure|utterly)\b/i,
      /(hoàn toàn thất bại|hoặc là .* hoặc là|chẳng được tích sự gì|con số không|tất cả hoặc không gì cả|hỏng hết cả)/i,
    ],
    clinicalReframeEn: 'Look for shades of grey between 0% and 100%. Did partial progress happen?',
    clinicalReframeVi: 'Hãy tìm các sắc thái xám giữa 0% và 100%. Có phần nào bạn đã làm được dù chưa trọn vẹn không?',
  },
  {
    id: 'overgeneralization',
    nameEn: 'Overgeneralization',
    nameVi: 'Khái quát hóa Quá mức',
    patterns: [
      /\b(always|never|every single time|everyone|nobody ever|forever)\b/i,
      /(luôn luôn|không bao giờ|lần nào cũng vậy|mọi người đều|chẳng ai thèm|mãi mãi không)/i,
    ],
    clinicalReframeEn: 'Is this a single painful event rather than an eternal law of "always" or "never"?',
    clinicalReframeVi: 'Đây là một sự việc cụ thể vừa xảy ra hay là quy luật "luôn luôn / không bao giờ" của cả cuộc đời?',
  },
  {
    id: 'mental-filter',
    nameEn: 'Mental Filter',
    nameVi: 'Sàng lọc Tiêu cực (Chỉ nhìn điểm xấu)',
    patterns: [
      /\b(only noticed the one mistake|ruined the whole|one bad comment|can only think about the flaw)\b/i,
      /(chỉ nghĩ đến đúng một lỗi|làm hỏng cả ngày|một lời chê duy nhất|chỉ thấy toàn điểm xấu)/i,
    ],
    clinicalReframeEn: 'Zoom out from the single drop of ink: what neutral or positive facts also existed in the full picture?',
    clinicalReframeVi: 'Hãy lùi ống kính ra khỏi giọt mực đen duy nhất: toàn cảnh sự việc còn có những chi tiết trung tính hay tích cực nào?',
  },
  {
    id: 'discounting-the-positive',
    nameEn: 'Discounting the Positive',
    nameVi: 'Phủ nhận Điều Tích cực',
    patterns: [
      /\b(doesn't count|just lucky|anyone could do that|fluke|they were just being nice)\b/i,
      /(không tính|chỉ là ăn may|ai mà chẳng làm được|họ chỉ khen xã giao thôi|chẳng có gì đáng kể)/i,
    ],
    clinicalReframeEn: 'Why disqualify a real strength or good moment? Even small wins count as real data.',
    clinicalReframeVi: 'Tại sao lại gạch bỏ nỗ lực có thật của bạn? Dù là bước nhỏ thì đó vẫn là dữ kiện thực tế.',
  },
  {
    id: 'mind-reading',
    nameEn: 'Jumping to Conclusions: Mind Reading',
    nameVi: 'Đọc Suy nghĩ Người khác',
    patterns: [
      /\b(they think i'm|she thinks i am|he hates me|they are judging me|must be thinking|secretly despises)\b/i,
      /(họ đang nghĩ tôi|cô ấy coi thường tôi|anh ta ghét tôi|chắc chắn họ đánh giá tôi|họ ngầm chê cười)/i,
    ],
    clinicalReframeEn: 'Do you have direct evidence of their thoughts, or could they be busy/distracted with their own life?',
    clinicalReframeVi: 'Bạn có bằng chứng trực tiếp nào về suy nghĩ của họ không, hay có thể họ đang bận tâm chuyện riêng của họ?',
  },
  {
    id: 'fortune-telling',
    nameEn: 'Jumping to Conclusions: Fortune Telling',
    nameVi: 'Tiên tri Bi quan (Bói toán Tương lai)',
    patterns: [
      /\b(going to fail|will definitely go wrong|bound to disaster|i'll never recover|pointless to try because it will)\b/i,
      /(chắc chắn sẽ thất bại|kiểu gì cũng hỏng|sẽ không bao giờ khỏi|sẽ thảm hại lắm|tương lai mù mịt)/i,
    ],
    clinicalReframeEn: 'No one has a crystal ball. Let’s test this prediction with the Prediction Calibration tracker.',
    clinicalReframeVi: 'Không ai có quả cầu tiên tri cả. Hãy coi đây là một giả thuyết để kiểm chứng thực tế thay vì kết án trước.',
  },
  {
    id: 'magnification-catastrophizing',
    nameEn: 'Magnification & Catastrophizing',
    nameVi: 'Phóng đại & Thảm họa hóa',
    patterns: [
      /\b(end of the world|unbearable|catastrophe|worst thing ever|ruined my life|can't survive this)\b/i,
      /(thảm họa|tận thế|không thể chịu đựng nổi|hủy hoại cả cuộc đời|kinh khủng nhất trên đời)/i,
    ],
    clinicalReframeEn: 'How significant will this event be in 6 months or 1 year? How have you coped with hard things before?',
    clinicalReframeVi: 'Sau 6 tháng hay 1 năm nữa nhìn lại, việc này sẽ ở mức nào? Bạn đã từng vượt qua những khó khăn trước đây ra sao?',
  },
  {
    id: 'emotional-reasoning',
    nameEn: 'Emotional Reasoning',
    nameVi: 'Suy luận theo Cảm xúc',
    patterns: [
      /\b(i feel like a failure so i am|feels hopeless so it must be|i feel guilty so i must have done)\b/i,
      /(tôi cảm thấy mình thất bại nên chắc chắn|thấy tội lỗi nghĩa là tôi sai|cảm giác tuyệt vọng chứng tỏ)/i,
    ],
    clinicalReframeEn: 'Feelings are real experiences, not objective facts. Feeling inadequate does not make you inadequate.',
    clinicalReframeVi: 'Cảm xúc là trải nghiệm có thật nhưng không phải là sự thật khách quan. Cảm thấy kém cỏi không biến bạn thành người kém cỏi.',
  },
  {
    id: 'should-statements',
    nameEn: 'Should / Must Statements',
    nameVi: 'Mệnh lệnh "Phải / Nên / Đáng lẽ"',
    patterns: [
      /\b(i should have|i must never|i ought to|shouldn't feel|have to be perfect)\b/i,
      /(tôi phải luôn|đáng lẽ tôi không được|lẽ ra phải|tôi không được phép buồn|bắt buộc phải hoàn hảo)/i,
    ],
    clinicalReframeEn: 'Replace rigid "I must/should" whips with compassionate preference: "I would prefer to..."',
    clinicalReframeVi: 'Hãy đổi roi vọt "Tôi bắt buộc phải..." sang mong muốn linh hoạt và nhân từ hơn: "Tôi mong muốn có thể..."',
  },
  {
    id: 'labeling',
    nameEn: 'Labeling & Mislabeling',
    nameVi: 'Dán nhãn Nhân cách',
    patterns: [
      /\b(i am a loser|i'm an idiot|i'm worthless|i am defective|i'm a monster|pathetic failure)\b/i,
      /(tôi là kẻ thất bại|tôi là đồ vô dụng|tôi thật ngu ngốc|đồ bỏ đi|kẻ kém cỏi)/i,
    ],
    clinicalReframeEn: 'A human being is vastly more complex than a single mistake. Label the specific action, never your whole self.',
    clinicalReframeVi: 'Con người bạn rộng lớn hơn nhiều so với một lỗi lầm. Hãy gọi tên hành vi cụ thể thay vì đóng dấu lên toàn bộ giá trị bản thân.',
  },
  {
    id: 'personalization-blame',
    nameEn: 'Personalization & Self-Blame',
    nameVi: 'Cá nhân hóa & Tự đổ lỗi',
    patterns: [
      /\b(all my fault|because of me that they|i ruined everything for everyone|i am responsible for their mood)\b/i,
      /(tất cả là lỗi tại tôi|vì tôi mà mọi người|do tôi làm khổ cả nhà|tôi phải chịu trách nhiệm cho tâm trạng của họ)/i,
    ],
    clinicalReframeEn: 'What percentage of this outcome actually depended on other people, timing, and external circumstances?',
    clinicalReframeVi: 'Bao nhiêu phần trăm của kết quả này thực chất phụ thuộc vào hoàn cảnh bên ngoài và lựa chọn của người khác?',
  },
];

/**
 * 2. 5 Bipolar Positive Cognitive Distortions (Biến dạng Nhận thức Dương tính - Hưng cảm / Hưng cảm nhẹ)
 */
export const POSITIVE_DISTORTION_DEFINITIONS: PatternDefinition[] = [
  {
    id: 'grandiosity',
    nameEn: 'Grandiosity (Bipolar Positive Distortion)',
    nameVi: 'Tự cao / Ý tưởng Vĩ đại (Biến dạng Dương tính)',
    patterns: [
      /\b(genius idea|make millions overnight|chosen for a special mission|revolutionary breakthrough|ordinary rules don't apply)\b/i,
      /(ý tưởng thiên tài|kiếm hàng tỷ qua đêm|sứ mệnh vĩ đại|thay đổi cả thế giới ngay lập tức|không ai sánh kịp tôi)/i,
    ],
    clinicalReframeEn: 'Hypomania amplifies creative confidence. Will this still look grounded after 48 hours and two 7-hour nights of sleep?',
    clinicalReframeVi: 'Khi khí sắc tăng cao, não bộ thường khuếch đại sự tự tin. Liệu ý tưởng này có còn vững chắc sau 48 giờ và 2 đêm ngủ đủ giấc không?',
  },
  {
    id: 'invulnerability',
    nameEn: 'Invulnerability & Risk Blindness',
    nameVi: 'Ảo tưởng Bất khả Xâm phạm & Mù Rủi ro',
    patterns: [
      /\b(nothing can go wrong|zero risk|invincible|can't lose|all my savings into|no consequences)\b/i,
      /(không thể nào thua được|rủi ro bằng không|bất khả chiến bại|đặt cược toàn bộ tiết kiệm|chẳng có hậu quả gì đâu)/i,
    ],
    clinicalReframeEn: 'Elevated dopamine hides downside risk. Let’s run Devil’s Advocate and list 2 potential blind spots.',
    clinicalReframeVi: 'Dopamine tăng cao thường che khuất rủi ro. Hãy dùng kỹ thuật Devil’s Advocate để tìm 2 điểm mù tài chính/sức khỏe trước khi quyết định.',
  },
  {
    id: 'hyper-optimism',
    nameEn: 'Hyper-Optimism (Rose-Colored Fortune Telling)',
    nameVi: 'Lạc quan Phi thực tế (Tiên tri Màu hồng)',
    patterns: [
      /\b(100% guaranteed success|everything will work out magically|instant fortune|everyone will immediately agree)\b/i,
      /(thành công 100% chắc chắn|mọi thứ sẽ tự khắc hoàn hảo|giàu to ngay lập tức|ai cũng sẽ lập tức tán thành)/i,
    ],
    clinicalReframeEn: 'Even great plans face friction. Let’s check with 2 trusted contacts (Two-Person Reality Check).',
    clinicalReframeVi: 'Ngay cả kế hoạch tốt cũng luôn có lực cản thực tế. Hãy tham khảo ý kiến 2 người tin cậy trong Giao ước Ulysses của bạn.',
  },
  {
    id: 'impulse-justification',
    nameEn: 'Impulse Justification & Urgency Trap',
    nameVi: 'Hợp thức hóa Bốc đồng & Bẫy Khẩn cấp',
    patterns: [
      /\b(must buy right now|quit my job tonight|at 2am|at 3am|opportunity will vanish forever|can't wait until tomorrow)\b/i,
      /(phải mua ngay lập tức|nộp đơn nghỉ việc ngay đêm nay|lúc 2 giờ sáng|cơ hội ngàn năm có một không thể chờ|không thể đợi tới mai)/i,
    ],
    clinicalReframeEn: 'Urgency at night is a classic hypomanic signal. Lock this in the 48-Hour Impulse Vault first.',
    clinicalReframeVi: 'Cảm giác "phải làm ngay trong đêm" là tín hiệu điển hình của pha hưng cảm nhẹ. Hãy gửi quyết định này vào Khoang Trì hoãn 48 Giờ.',
  },
  {
    id: 'magical-energy',
    nameEn: 'Magical Energy & Sleep/Medication Invincibility',
    nameVi: 'Ảo tưởng Năng lượng Vô tận (Không cần Ngủ / Thuốc)',
    patterns: [
      /\b(don't need sleep|slept 2 hours and feel amazing|slept 3 hours and feel electric|cured so i can stop my medication|stop taking lithium)\b/i,
      /(không cần ngủ nữa|ngủ 2 tiếng vẫn khỏe re|ngủ 3 tiếng vẫn tràn trề năng lượng|khỏi hẳn rồi không cần uống thuốc nữa|bỏ thuốc ổn định khí sắc)/i,
    ],
    clinicalReframeEn: 'Feeling energized on <5 hours of sleep is a cardinal Bipolar Mania Prodrome. Protect your sleep anchor and consult your psychiatrist before any medication change.',
    clinicalReframeVi: 'Ngủ dưới 5 tiếng mà vẫn thấy dư thừa năng lượng là dấu hiệu tiền triệu quan trọng nhất của Hưng cảm. Hãy bảo vệ giấc ngủ và tuyệt đối không tự ý ngưng thuốc khi chưa hỏi bác sĩ.',
  },
];

/**
 * 3. 23 Self-Defeating Beliefs (SDBs - Dr. David Burns TEAM-CBT)
 */
export const SELF_DEFEATING_BELIEFS: PatternDefinition[] = [
  {
    id: 'emotional-perfectionism',
    nameEn: 'Emotional Perfectionism',
    nameVi: 'Cầu toàn Cảm xúc',
    patterns: [/\b(should always feel happy|never feel anxious or sad)\b/i, /(luôn phải vui vẻ tích cực|không được phép lo âu hay buồn)/i],
    clinicalReframeEn: 'All human emotions—including sadness and anxiety—are natural, meaningful signals.',
    clinicalReframeVi: 'Mọi cảm xúc tự nhiên của con người đều có ý nghĩa, không ai có thể vui vẻ 100% mọi lúc.',
  },
  {
    id: 'performance-perfectionism',
    nameEn: 'Performance Perfectionism',
    nameVi: 'Cầu toàn Thành tích',
    patterns: [/\b(must never make a mistake|anything less than 100% is failure)\b/i, /(không được phép mắc bất kỳ sai sót nào|chưa hoàn hảo tức là thất bại)/i],
    clinicalReframeEn: 'Mistakes are how humans learn; excellence does not require perfection.',
    clinicalReframeVi: 'Sai sót là cách con người học hỏi; sự xuất sắc không đòi hỏi sự hoàn hảo tuyệt đối.',
  },
  {
    id: 'perceived-perfectionism',
    nameEn: 'Perceived Perfectionism',
    nameVi: 'Sợ Lộ Khuyết điểm trước Người khác',
    patterns: [/\b(people won't respect me if they see my flaws)\b/i, /(người khác sẽ coi thường nếu thấy điểm yếu của tôi)/i],
    clinicalReframeEn: 'Vulnerability and authenticity actually build deeper human connection.',
    clinicalReframeVi: 'Sự chân thành và dám bộc lộ thiếu sót thực chất giúp kết nối giữa người với người sâu sắc hơn.',
  },
  {
    id: 'achievement-addiction',
    nameEn: 'Achievement Addiction',
    nameVi: 'Nghiện Thành tựu (Giá trị = Năng suất)',
    patterns: [/\b(my worth depends on my productivity|worthless without success)\b/i, /(giá trị của tôi phụ thuộc hoàn toàn vào thành tích|không thành công thì vô giá trị)/i],
    clinicalReframeEn: 'Your intrinsic human worth exists even when you are resting.',
    clinicalReframeVi: 'Giá trị làm người của bạn luôn tồn tại nguyên vẹn ngay cả khi bạn đang nghỉ ngơi.',
  },
  {
    id: 'approval-addiction',
    nameEn: 'Approval Addiction',
    nameVi: 'Nghiện Sự Công nhận',
    patterns: [/\b(need everyone['’]?s approval|everyone must like me)\b/i, /(cần tất cả mọi người hài lòng về tôi|ai cũng phải quý mến tôi)/i],
    clinicalReframeEn: 'Disapproval from one person does not diminish your core worth.',
    clinicalReframeVi: 'Việc ai đó không hài lòng không làm giảm đi giá trị cốt lõi của bạn.',
  },
  {
    id: 'love-addiction',
    nameEn: 'Love Addiction',
    nameVi: 'Phụ thuộc Tình cảm Tuyệt đối',
    patterns: [/\b(nothing without a partner|can't be happy if i am single)\b/i, /(không thể sống thiếu người yêu|cô đơn đồng nghĩa với vô nghĩa)/i],
    clinicalReframeEn: 'Romantic love is wonderful, AND you can cultivate meaning and joy within yourself.',
    clinicalReframeVi: 'Tình yêu đôi lứa rất đẹp, VÀ bạn vẫn có thể tự tạo dựng niềm vui, ý nghĩa tự thân.',
  },
  {
    id: 'fear-of-rejection',
    nameEn: 'Fear of Rejection',
    nameVi: 'Sợ Bị Từ chối / Bỏ rơi',
    patterns: [/\b(if they reject me it proves i am unlovable)\b/i, /(bị từ chối chứng tỏ tôi không đáng được yêu thương)/i],
    clinicalReframeEn: 'Rejection reflects incompatibility in one relationship, not a verdict on your lovability.',
    clinicalReframeVi: 'Sự từ chối chỉ phản ánh sự chưa phù hợp ở một mối quan hệ, không phải bản án về giá trị của bạn.',
  },
  {
    id: 'pleasing-others',
    nameEn: 'People-Pleasing Compulsion',
    nameVi: 'Ám ảnh Làm hài lòng Người khác',
    patterns: [/\b(always put others first|never say no to anyone)\b/i, /(luôn phải chiều lòng người khác|không dám từ chối ai bao giờ)/i],
    clinicalReframeEn: 'Healthy boundaries ("DEAR MAN") allow you to care for others without erasing yourself.',
    clinicalReframeVi: 'Ranh giới lành mạnh (kỹ năng DEAR MAN) giúp bạn quan tâm người khác mà không đánh mất chính mình.',
  },
  {
    id: 'conflict-phobia',
    nameEn: 'Conflict Phobia',
    nameVi: 'Ám ảnh Sợ Xung đột (Bệnh Tử tế)',
    patterns: [/\b(people who care never argue|must avoid conflict at all costs)\b/i, /(đã yêu quý nhau thì không bao giờ bất đồng|phải né tránh va chạm bằng mọi giá)/i],
    clinicalReframeEn: 'Respectful disagreement is a doorway to genuine intimacy.',
    clinicalReframeVi: 'Bày tỏ bất đồng một cách tôn trọng chính là cánh cửa dẫn tới sự thấu hiểu chân thật.',
  },
  {
    id: 'self-blame',
    nameEn: 'Chronic Self-Blame',
    nameVi: 'Tự Đổ lỗi Kinh niên',
    patterns: [/\b(responsible for everyone's problems|always the bad guy)\b/i, /(mọi rắc rối trên đời đều do lỗi của tôi)/i],
    clinicalReframeEn: 'Take responsibility only for your own actions, not the entire universe.',
    clinicalReframeVi: 'Hãy chỉ chịu trách nhiệm cho phần hành động của bạn, đừng gánh thay cả thế giới.',
  },
  {
    id: 'other-blame',
    nameEn: 'Other-Blame',
    nameVi: 'Đổ lỗi cho Người khác',
    patterns: [/\b(they are 100% to blame for my misery|other people are the problem)\b/i, /(họ hoàn toàn có lỗi cho nỗi khổ của tôi)/i],
    clinicalReframeEn: 'Focusing on your own 10% contribution restores your power to change the relationship.',
    clinicalReframeVi: 'Nhìn vào phần mình có thể thay đổi sẽ trả lại quyền chủ động cho chính bạn.',
  },
  {
    id: 'entitlement',
    nameEn: 'Entitlement',
    nameVi: 'Tư duy Đặc quyền (Đòi hỏi Thế giới Phải Theo Ý mình)',
    patterns: [/\b(people should always treat me the way i expect|life owes me)\b/i, /(mọi người bắt buộc phải cư xử đúng ý tôi|cuộc đời nợ tôi)/i],
    clinicalReframeEn: 'Trading rigid demands for flexible requests drastically reduces chronic anger.',
    clinicalReframeVi: 'Chuyển từ đòi hỏi cứng nhắc sang mong muốn linh hoạt sẽ giúp hạ nhiệt cơn giận mãn tính.',
  },
  {
    id: 'truth-fallacy',
    nameEn: 'I-Am-Right / Truth Fallacy',
    nameVi: 'Ảo tưởng Chân lý (Tôi luôn đúng)',
    patterns: [/\b(i am right and they are completely wrong)\b/i, /(tôi hoàn toàn đúng còn họ hoàn toàn sai)/i],
    clinicalReframeEn: 'Use TEAM-CBT Disarming to find the valid grain of truth in the other person’s perspective.',
    clinicalReframeVi: 'Hãy dùng kỹ thuật Disarming (Tìm điểm đúng trong lời đối phương) để tháo ngòi xung đột.',
  },
  {
    id: 'fallacy-of-fairness',
    nameEn: 'Fallacy of Fairness',
    nameVi: 'Ảo tưởng Công bằng Tuyệt đối',
    patterns: [/\b(life must always be fair|it's so unfair that)\b/i, /(cuộc đời lúc nào cũng phải công bằng tuyệt đối)/i],
    clinicalReframeEn: 'Radical Acceptance of unfair events frees your energy for constructive action.',
    clinicalReframeVi: 'Chấp nhận thực tại (Radical Acceptance) giúp bạn giải phóng năng lượng để hành động thiết thực.',
  },
  {
    id: 'fallacy-of-change',
    nameEn: 'Fallacy of Change',
    nameVi: 'Ảo tưởng Ép Người khác Thay đổi',
    patterns: [/\b(if i pressure them enough they will change)\b/i, /(nếu tôi ép buộc đủ nhiều thì họ sẽ phải thay đổi)/i],
    clinicalReframeEn: 'We can only control our own boundaries and responses, never another person.',
    clinicalReframeVi: 'Ta chỉ làm chủ được ranh giới và phản ứng của chính mình, không thể kiểm soát người khác.',
  },
  {
    id: 'learned-helplessness',
    nameEn: 'Learned Helplessness',
    nameVi: 'Bất lực Tập nhiễm',
    patterns: [/\b(nothing i do can change how i feel|powerless over my mood)\b/i, /(dù tôi có làm gì cũng không thể thay đổi được tâm trạng)/i],
    clinicalReframeEn: 'Even a 2-minute micro-step can shift brain chemistry and prove agency.',
    clinicalReframeVi: 'Chỉ một bước hành động nhỏ 2 phút cũng có thể tạo ra dịch chuyển sinh học trong não bộ.',
  },
  {
    id: 'martyrdom',
    nameEn: 'Martyrdom',
    nameVi: 'Tâm lý Hy sinh Chịu đựng Ngầm',
    patterns: [/\b(i sacrifice everything and nobody notices|suffer in silence for everyone)\b/i, /(tôi hy sinh tất cả mà chẳng ai hiểu cho|âm thầm chịu thiệt vì mọi người)/i],
    clinicalReframeEn: 'Ask directly for what you need using DEAR MAN instead of hoping others read your mind.',
    clinicalReframeVi: 'Hãy dùng DEAR MAN để nói rõ nhu cầu của bạn thay vì âm thầm chịu đựng rồi tủi thân.',
  },
  {
    id: 'brushfire-fallacy',
    nameEn: 'Brushfire Fallacy',
    nameVi: 'Ám ảnh Dập tắt Mọi Bất mãn Tức thì',
    patterns: [/\b(can't rest until everyone is happy with me)\b/i, /(không thể yên lòng nếu còn ai đó chưa hài lòng)/i],
    clinicalReframeEn: 'You can tolerate temporary tension without rushing to fix someone else’s mood.',
    clinicalReframeVi: 'Bạn hoàn toàn có thể bình tĩnh chịu đựng khoảng lặng mà không cần vội vã dỗ dành tâm trạng người khác.',
  },
  {
    id: 'spotlight-fallacy',
    nameEn: 'Spotlight Fallacy',
    nameVi: 'Hiệu ứng Đèn Sân khấu',
    patterns: [/\b(everyone in the room is staring at my awkwardness|all eyes on my mistake)\b/i, /(tất cả mọi người trong phòng đều đang săm soi lỗi của tôi)/i],
    clinicalReframeEn: 'Most people are 90% focused on themselves, not scrutinizing you.',
    clinicalReframeVi: 'Hầu hết mọi người đều đang bận nghĩ về bản thân họ chứ không săm soi bạn đâu.',
  },
  {
    id: 'magical-thinking-worry',
    nameEn: 'Magical Thinking About Worry',
    nameVi: 'Tư duy Ma thuật về Sự Lo lắng',
    patterns: [/\b(worrying keeps my family safe|if i stop worrying disaster will strike)\b/i, /(lo lắng giúp ngăn chặn tai họa|nếu tôi ngừng lo thì chuyện xấu sẽ ập đến)/i],
    clinicalReframeEn: 'Preparation prevents problems; chronic worrying only exhausts your body.',
    clinicalReframeVi: 'Sự chuẩn bị thực tế mới giúp giải quyết vấn đề, còn lo âu triền miên chỉ bào mòn cơ thể bạn.',
  },
  {
    id: 'low-frustration-tolerance',
    nameEn: 'Low Frustration Tolerance',
    nameVi: 'Ngưỡng Chịu đựng Khó khăn Thấp',
    patterns: [/\b(things should always be easy|i can't stand discomfort)\b/i, /(mọi việc lẽ ra phải dễ dàng|tôi không chịu nổi chút bất tiện nào)/i],
    clinicalReframeEn: 'Discomfort is temporary and survivable; building distress tolerance expands your freedom.',
    clinicalReframeVi: 'Cảm giác khó chịu chỉ là tạm thời; rèn kỹ năng chịu đựng căng thẳng sẽ mở rộng tự do của bạn.',
  },
  {
    id: 'superman-superwoman',
    nameEn: 'Superman / Superwoman Complex',
    nameVi: 'Hội chứng Siêu nhân (Không được Mệt mỏi)',
    patterns: [/\b(must handle everything alone|asking for help is weakness)\b/i, /(phải tự gánh vác mọi thứ một mình|nhờ giúp đỡ là yếu đuối)/i],
    clinicalReframeEn: 'Resting and asking for support are acts of wisdom and courage, not weakness.',
    clinicalReframeVi: 'Nghỉ ngơi và đón nhận sự nâng đỡ là biểu hiện của trí tuệ và lòng dũng cảm.',
  },
  {
    id: 'subhuman-defectiveness',
    nameEn: 'Core Defectiveness / Subhuman Belief',
    nameVi: 'Niềm tin Cốt lõi Mình Thấp kém / Khiếm khuyết',
    patterns: [/\b(fundamentally broken|less than other humans|undeserving of kindness)\b/i, /(bẩm sinh khiếm khuyết|không xứng đáng được đối xử tử tế)/i],
    clinicalReframeEn: 'You possess the exact same human dignity and right to compassion as every person alive.',
    clinicalReframeVi: 'Bạn có đầy đủ phẩm giá và quyền được yêu thương, trân trọng như bất kỳ con người nào.',
  },
];

/**
 * 4. Safety Behaviors (Hành vi An toàn Ngầm làm duy trì Lo âu)
 */
export const SAFETY_BEHAVIOR_DEFINITIONS: PatternDefinition[] = [
  {
    id: 'reassurance-seeking',
    nameEn: 'Excessive Reassurance Seeking',
    nameVi: 'Tìm kiếm Sự Trấn an Lặp đi Lặp lại',
    patterns: [
      /\b(asked 5 people if|keep asking if they're mad|constantly asking for reassurance)\b/i,
      /(hỏi đi hỏi lại xem họ có giận không|liên tục hỏi người thân xem có sao không|xin trấn an liên tục)/i,
    ],
    clinicalReframeEn: 'Practice delaying reassurance requests for 30 minutes to let your own confidence grow.',
    clinicalReframeVi: 'Hãy thử trì hoãn việc hỏi xin trấn an trong 30 phút để hệ thần kinh tự nhận ra bạn vẫn an toàn.',
  },
  {
    id: 'compulsive-checking-googling',
    nameEn: 'Compulsive Checking & Symptom Googling',
    nameVi: 'Kiểm tra Cưỡng bức & Tra cứu Triệu chứng',
    patterns: [
      /\b(checking my pulse|googling symptoms for hours|re-read the email 10 times|checking the lock repeatedly)\b/i,
      /(đo nhịp tim liên tục|tra google triệu chứng bệnh hàng giờ|đọc lại email chục lần|kiểm tra khóa cửa liên tục)/i,
    ],
    clinicalReframeEn: 'Checking feeds the alarm center. Drop the check during exposure to build inhibitory learning.',
    clinicalReframeVi: 'Việc kiểm tra liên tục càng nuôi dưỡng trung tâm báo động của não. Hãy giảm dần số lần kiểm tra khi thực hành tiếp xúc.',
  },
  {
    id: 'escape-exit-guarding',
    nameEn: 'Exit Guarding & Escape Crutches',
    nameVi: 'Canh Cửa thoát hiểm & Phụ thuộc Vật bảo hộ',
    patterns: [
      /\b(only sit near the exit|can't leave home without my rescue|staring at my phone to avoid eye contact)\b/i,
      /(chỉ dám ngồi gần cửa ra vào|dán mắt vào điện thoại để né ánh mắt|không dám ra ngoài nếu thiếu vật hộ thân)/i,
    ],
    clinicalReframeEn: 'Try one small exposure rung while sitting slightly further from the exit and keeping eyes level.',
    clinicalReframeVi: 'Hãy thử một bậc tiếp xúc nhỏ: ngẩng đầu nhìn tự nhiên hoặc ngồi xa cửa ra vào hơn một chút.',
  },
  {
    id: 'over-preparation-rehearsal',
    nameEn: 'Over-Preparation & Mental Scripting',
    nameVi: 'Chuẩn bị Quá mức & Học thuộc Kịch bản trong Đầu',
    patterns: [
      /\b(rehearsed every word 20 times|prepared for 10 hours for a 5 minute talk)\b/i,
      /(nhẩm đi nhẩm lại từng câu 20 lần|chuẩn bị 10 tiếng cho cuộc gọi 5 phút)/i,
    ],
    clinicalReframeEn: 'Experiment with speaking spontaneously on a low-stakes topic to see that imperfect speech is safe.',
    clinicalReframeVi: 'Hãy thử nói chuyện tự nhiên không kịch bản ở một tình huống nhỏ để thấy rằng sự không hoàn hảo vẫn hoàn toàn an toàn.',
  },
];

/**
 * 5. Crisis & Safety Layer Regex Patterns
 */
const LAYER1_SUICIDE_SELF_HARM_PATTERNS: RegExp[] = [
  /\b(want to die|kill myself|end my life|suicide|suicidal|cut myself|self-harm|self harm|overdose on pills|better off dead|no reason to live)\b/i,
  /(muốn chết|tự tử|tự sát|kết liễu cuộc đời|tự làm đau bản thân|rạch tay|tự hại|uống thuốc quá liều|sống không còn ý nghĩa gì nữa|chết đi cho xong)/i,
];

const LAYER1_MANIA_PSYCHOSIS_EMERGENCY_PATTERNS: RegExp[] = [
  /\b(hearing voices telling me to|cia is tracking my brain|i am a god and can fly|haven't slept in 4 days)\b/i,
  /(nghe thấy tiếng nói trong đầu sai khiến|có tổ chức theo dõi gắn chip vào não|tôi là thánh thần bất tử|4 ngày đêm không ngủ chút nào)/i,
];

const LAYER3_REAL_WORLD_DANGER_PATTERNS: RegExp[] = [
  /\b(hitting me|beating me|threatened to kill me|domestic violence|physically abused|partner is violent|stalking me with a weapon)\b/i,
  /(đánh đập tôi|bạo hành gia đình|dọa giết tôi|chồng đánh|người yêu bạo lực|bị xâm hại|đang bị đe dọa tính mạng)/i,
];

const DEFAULT_HOTLINES = [
  {
    name: 'Đường dây nóng Ngày Mai (Hỗ trợ Tâm lý & Khủng hoảng Việt Nam)',
    phone: '096 306 1414',
    hours: '13:00 - 20:30 hàng ngày (Miễn phí)',
  },
  {
    name: 'Cấp cứu Y tế Toàn quốc (Việt Nam)',
    phone: '115',
    hours: '24/7',
  },
  {
    name: 'Tổng đài Bảo vệ Phụ nữ & Trẻ em / Phòng chống Bạo lực (Việt Nam)',
    phone: '111 / 1900 969 680',
    hours: '24/7',
  },
  {
    name: '988 Suicide & Crisis Lifeline (International / US)',
    phone: '988',
    hours: '24/7',
  },
];

function matchPatternCatalog(
  text: string,
  catalog: PatternDefinition[],
  category: DetectedPatternMatch['category'],
): DetectedPatternMatch[] {
  if (!text || !text.trim()) return [];
  const results: DetectedPatternMatch[] = [];

  for (const item of catalog) {
    const matchedPhrases: string[] = [];
    for (const regex of item.patterns) {
      const m = text.match(regex);
      if (m && m[0]) {
        matchedPhrases.push(m[0]);
      }
    }
    if (matchedPhrases.length > 0) {
      results.push({
        id: item.id,
        nameEn: item.nameEn,
        nameVi: item.nameVi,
        category,
        matchedPhrases,
        clinicalReframeEn: item.clinicalReframeEn,
        clinicalReframeVi: item.clinicalReframeVi,
      });
    }
  }

  return results;
}

export function detectNegativeDistortions(text: string): DetectedPatternMatch[] {
  return matchPatternCatalog(text, NEGATIVE_DISTORTION_DEFINITIONS, 'negative_distortion');
}

export function detectPositiveDistortions(text: string): DetectedPatternMatch[] {
  return matchPatternCatalog(text, POSITIVE_DISTORTION_DEFINITIONS, 'positive_distortion');
}

export function detectSelfDefeatingBeliefs(text: string): DetectedPatternMatch[] {
  return matchPatternCatalog(text, SELF_DEFEATING_BELIEFS, 'self_defeating_belief');
}

export function detectSafetyBehaviors(text: string): DetectedPatternMatch[] {
  return matchPatternCatalog(text, SAFETY_BEHAVIOR_DEFINITIONS, 'safety_behavior');
}

export function analyzeClinicalText(text: string): {
  negativeDistortions: DetectedPatternMatch[];
  positiveDistortions: DetectedPatternMatch[];
  selfDefeatingBeliefs: DetectedPatternMatch[];
  safetyBehaviors: DetectedPatternMatch[];
} {
  return {
    negativeDistortions: detectNegativeDistortions(text),
    positiveDistortions: detectPositiveDistortions(text),
    selfDefeatingBeliefs: detectSelfDefeatingBeliefs(text),
    safetyBehaviors: detectSafetyBehaviors(text),
  };
}

/**
 * 4-Layer Safety & Crisis Detector
 * - Layer 1: Explicit Suicidal / Self-Harm Intent or Acute Psychosis/Mania Emergency -> safety-stop
 * - Layer 2: Clinical Assessment / Bipolar Polarity Gate (BMS Suicide >= 1, PHQ-9 Q9 > 0, Mixed State, Acute Distress >= 8/10)
 * - Layer 3: Real-world Physical Danger / Domestic Abuse -> justified-exit (never treat valid danger as distortion)
 * - Layer 4: Output Guardrail verification helper
 */
export function evaluateFourLayerSafety(params: {
  text: string;
  preIntensity?: number;
  moodPolarity?: BipolarPole | number;
  energyLevel?: BipolarPole | number;
  bmsSuicidalScore?: number;
  phq9Item9Score?: number;
  asrmScore?: number;
}): FourLayerSafetyEvaluation {
  const text = params.text ?? '';
  const intensity = params.preIntensity ?? 0;
  const mood = params.moodPolarity ?? 0;
  const energy = params.energyLevel ?? 0;
  const bmsSuicide = params.bmsSuicidalScore ?? 0;
  const phq9Q9 = params.phq9Item9Score ?? 0;

  // LAYER 1A: Explicit Suicidal / Self-Harm keywords
  const suicideMatches: string[] = [];
  for (const regex of LAYER1_SUICIDE_SELF_HARM_PATTERNS) {
    const m = text.match(regex);
    if (m && m[0]) suicideMatches.push(m[0]);
  }
  if (suicideMatches.length > 0 || bmsSuicide >= 1 || phq9Q9 > 0) {
    const triggers = [...suicideMatches];
    if (bmsSuicide >= 1) triggers.push(`BMS_Suicidal_Score=${bmsSuicide}`);
    if (phq9Q9 > 0) triggers.push(`PHQ9_Item9_Score=${phq9Q9}`);
    return {
      safeToProceedWithCbt: false,
      triggeredLayer: suicideMatches.length > 0 ? 1 : 2,
      severity: 'crisis-safety-stop',
      recommendedOutcome: 'safety-stop',
      pushbackOverride: 'off',
      matchedTriggers: triggers,
      messageVi:
        'An toàn của bạn là ưu tiên cao nhất lúc này. Hệ thống đã dừng mọi bài tập phân tích để kết nối bạn với đường dây hỗ trợ khủng hoảng và người liên hệ khẩn cấp trong Kế hoạch An toàn.',
      messageEn:
        'Your safety is the highest priority right now. All cognitive exercises have been paused to connect you immediately with crisis hotlines and your trusted safety contacts.',
      hotlines: DEFAULT_HOTLINES,
    };
  }

  // LAYER 1B: Acute Mania / Psychosis Emergency
  const psychosisMatches: string[] = [];
  for (const regex of LAYER1_MANIA_PSYCHOSIS_EMERGENCY_PATTERNS) {
    const m = text.match(regex);
    if (m && m[0]) psychosisMatches.push(m[0]);
  }
  if (psychosisMatches.length > 0 || mood >= 5) {
    return {
      safeToProceedWithCbt: false,
      triggeredLayer: 1,
      severity: 'mania-emergency',
      recommendedOutcome: 'safety-stop',
      pushbackOverride: 'off',
      matchedTriggers: psychosisMatches.length > 0 ? psychosisMatches : ['moodPolarity=+5'],
      messageVi:
        'Bạn đang có dấu hiệu kích hoạt thần kinh hoặc hưng cảm cấp cần được hỗ trợ y khoa ngay. Hãy liên hệ bác sĩ tâm thần điều trị hoặc người thân trong Giao ước Ulysses của bạn.',
      messageEn:
        'You are showing signs of an acute manic or neurological emergency requiring immediate medical support. Please contact your psychiatrist or your Ulysses Contract trusted contact now.',
      hotlines: DEFAULT_HOTLINES,
    };
  }

  // LAYER 3: Real-world Physical Danger / Domestic Abuse -> justified-exit (never treat valid fear as a cognitive distortion)
  const dangerMatches: string[] = [];
  for (const regex of LAYER3_REAL_WORLD_DANGER_PATTERNS) {
    const m = text.match(regex);
    if (m && m[0]) dangerMatches.push(m[0]);
  }
  if (dangerMatches.length > 0) {
    return {
      safeToProceedWithCbt: false,
      triggeredLayer: 3,
      severity: 'real-world-danger',
      recommendedOutcome: 'justified-exit',
      pushbackOverride: 'off',
      matchedTriggers: dangerMatches,
      messageVi:
        'Nỗi sợ và sự lo lắng của bạn là hoàn toàn có cơ sở trước nguy hiểm thực tế. Chúng ta sẽ không phân tích hay sửa đổi suy nghĩ lúc này — hãy ưu tiên bảo vệ an toàn thể chất của bạn.',
      messageEn:
        'Your fear is completely valid in the face of real-world danger. We will not challenge your thoughts — let us focus strictly on your physical safety right now.',
      hotlines: DEFAULT_HOTLINES,
    };
  }

  // LAYER 2: Acute Physiological Distress >= 8/10 OR Bipolar Mixed State (Mood <= -2 AND Energy >= +2) -> DBT TIPP
  const isMixedState = mood <= -2 && energy >= 2;
  if (intensity >= 8 || isMixedState) {
    const triggers: string[] = [];
    if (intensity >= 8) triggers.push(`preIntensity=${intensity}/10`);
    if (isMixedState) triggers.push(`MixedState(mood=${mood},energy=${energy})`);
    return {
      safeToProceedWithCbt: false,
      triggeredLayer: 2,
      severity: 'acute-distress-tipp',
      recommendedOutcome: 'in-progress',
      recommendedTechnique: 'tipp',
      pushbackOverride: 'off',
      matchedTriggers: triggers,
      messageVi:
        'Cường độ căng thẳng của cơ thể đang ở mức rất cao (Vùng Đỏ). Khi hệ thần kinh giao cảm quá tải, việc phân tích suy nghĩ sẽ không hiệu quả — hãy cùng dùng kỹ năng DBT TIPP để hạ nhiệt cơ thể trước nhé.',
      messageEn:
        'Your physiological arousal is in the Red Zone. When the nervous system is flooded, cognitive analysis backfires — let’s use DBT TIPP to cool down your body physiology first.',
      hotlines: DEFAULT_HOTLINES,
    };
  }

  return {
    safeToProceedWithCbt: true,
    triggeredLayer: 0,
    severity: 'safe',
    recommendedOutcome: 'in-progress',
    matchedTriggers: [],
    messageVi: 'An toàn để bắt đầu phiên thực hành CBT/DBT.',
    messageEn: 'Safe to proceed with structured CBT/DBT session.',
    hotlines: [],
  };
}

/**
 * Layer 4 Output Guardrail: Ensures AI or system responses never give unauthorized
 * medication dosage instructions or clinical diagnoses.
 */
export function verifyLayer4OutputGuardrail(responseText: string): {
  allowed: boolean;
  violationReason?: string;
  sanitizedText: string;
} {
  const prohibitedDosageRegex =
    /\b(increase your lithium to|stop taking your prescribed|double your dose of|i officially diagnose you with)\b|(tự ý tăng liều thuốc|ngưng uống thuốc bác sĩ kê|tôi chẩn đoán chính thức bạn mắc bệnh)/i;
  if (prohibitedDosageRegex.test(responseText)) {
    return {
      allowed: false,
      violationReason: 'Layer 4 Guardrail: Unauthorized medical prescribing or clinical diagnosis detected.',
      sanitizedText:
        'Lưu ý Y khoa: Ứng dụng là công cụ đồng hành thực hành CBT/DBT tự lực, không thay thế chẩn đoán y khoa và không tự ý thay đổi liều thuốc. Vui lòng trao đổi trực tiếp với bác sĩ chuyên khoa tâm thần của bạn.',
    };
  }
  return {
    allowed: true,
    sanitizedText: responseText,
  };
}
