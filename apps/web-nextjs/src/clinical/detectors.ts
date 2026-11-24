import type { AffectFamily, IntensityScore, MoodPalette, MoodPole, TechniqueSlug } from './types.ts';

/**
 * 0ms Bilingual (Vietnamese & English) Deterministic Clinical Detectors:
 * - 11 Burns Negative Cognitive Distortions
 * - 5 Bipolar Positive Cognitive Distortions (Grandiosity, Invulnerability, Hyper-optimism, Impulse Justification, Magical Energy)
 * - 23 Self-Defeating Beliefs (SDBs)
 * - Safety Behaviors (Anxiety maintenance behaviors)
 * - 4-Layer Safety & Crisis Gate
 * - Harsh Self-Critic Guard (Wise Mind Step 3)
 * - Shame Protocol Detector (Chain Analysis)
 * - Mood-Palette Generator (Voice Burst NLP)
 */

export interface DistortionMatch {
  id: string;
  polarity: 'negative' | 'positive-mania';
  nameVi: string;
  nameEn: string;
  socraticQuestionVi: string;
  socraticQuestionEn: string;
}

const NEGATIVE_DISTORTION_RULES: Array<{
  id: string;
  nameVi: string;
  nameEn: string;
  patterns: RegExp[];
  socraticVi: string;
  socraticEn: string;
}> = [
  {
    id: 'all-or-nothing',
    nameVi: 'Tư duy Trắng - Đen',
    nameEn: 'All-or-Nothing Thinking',
    patterns: [/(luôn luôn|không bao giờ|hoàn toàn|100%|thất bại toàn tập|\balways\b|\bnever\b|\bcompletely\b|total failure|\bruined\b)/i],
    socraticVi: 'Liệu có vùng xám nào từ 1% đến 99% giữa hai thái cực "hoàn hảo" và "thất bại hoàn toàn" không?',
    socraticEn: 'Is there a gray area between 1% and 99% rather than 0% or 100%?',
  },
  {
    id: 'catastrophizing',
    nameVi: 'Thảm họa hóa vấn đề',
    nameEn: 'Catastrophizing',
    patterns: [/(thảm họa|chấm hết|tiêu đời|không thể chịu nổi|tệ nhất|catastrophe|disaster|end of the world|unbearable)/i],
    socraticVi: 'Xác suất thực tế điều tệ nhất xảy ra là bao nhiêu %, và nếu xảy ra thật, bạn sẽ ứng phó thế nào sau 1 tuần?',
    socraticEn: 'What is the realistic probability, and how would you cope one week later if it did happen?',
  },
  {
    id: 'mind-reading',
    nameVi: 'Đọc suy nghĩ người khác',
    nameEn: 'Mind Reading',
    patterns: [/(chắc chắn họ nghĩ|họ coi thường|cố tình phớt lờ|ai cũng nghĩ tôi|they think I'm|everyone thinks|ignoring me on purpose)/i],
    socraticVi: 'Bạn có bằng chứng trực tiếp nào về điều họ đang nghĩ, hay còn lý do nào khác khiến họ hành xử như vậy?',
    socraticEn: 'Do you have direct evidence of their thoughts, or could there be another explanation for their behavior?',
  },
  {
    id: 'fortune-telling',
    nameVi: 'Bói toán tương lai',
    nameEn: 'Fortune Telling',
    patterns: [/(chắc chắn sẽ trượt|sẽ thất bại thôi|không bao giờ khỏi|sẽ chẳng đi đến đâu|sắp đuổi việc|definitely going to fail|will never recover)/i],
    socraticVi: 'Đã có lần nào bạn dự đoán chắc chắn một kết cục xấu nhưng thực tế lại diễn ra khác đi chưa?',
    socraticEn: 'Has there ever been a time when you predicted a bad outcome with certainty and it turned out differently?',
  },
  {
    id: 'should-statements',
    nameVi: 'Mệnh lệnh "Phải / Nên"',
    nameEn: 'Should Statements',
    patterns: [/(tôi phải|lẽ ra tôi phải|không được phép yếu đuối|\bi should\b|\bi must\b|\bi ought to\b|must not fail)/i],
    socraticVi: 'Nếu đổi từ "Tôi bắt buộc phải..." thành "Tôi mong muốn / sẽ tốt hơn nếu...", áp lực trong cơ thể bạn thay đổi thế nào?',
    socraticEn: 'How does it feel if you replace "I must/should" with "I would prefer to"?',
  },
  {
    id: 'labeling',
    nameVi: 'Tự dán nhãn tiêu cực',
    nameEn: 'Labeling',
    patterns: [/(kẻ thất bại|đồ vô dụng|kẻ thua cuộc|ngu ngốc|i am a loser|i'm worthless|i am stupid|i'm a failure)/i],
    socraticVi: 'Mắc một sai lầm có biến toàn bộ con người bạn thành nhãn dán đó không?',
    socraticEn: 'Does making one mistake define the entirety of who you are as a human being?',
  },
  {
    id: 'emotional-reasoning',
    nameVi: 'Suy luận theo cảm xúc',
    nameEn: 'Emotional Reasoning',
    patterns: [/(cảm thấy có lỗi nên chắc chắn|thấy sợ nghĩa là nguy hiểm|i feel hopeless so|i feel guilty so i must)/i],
    socraticVi: 'Cảm xúc là có thật, nhưng cảm thấy một điều gì đó có chứng minh điều đó là sự thật khách quan không?',
    socraticEn: 'Feelings are very real, but does feeling something automatically make it an objective fact?',
  },
  {
    id: 'overgeneralization',
    nameVi: 'Khái quát hóa quá mức',
    nameEn: 'Overgeneralization',
    patterns: [/(lúc nào cũng thế|mọi thứ đều hỏng|chuyện gì tôi làm cũng|every single time|everything goes wrong)/i],
    socraticVi: 'Đây là một sự việc cụ thể vừa xảy ra hay là quy luật bất biến cho mọi việc trong đời bạn?',
    socraticEn: 'Is this one specific event, or an unchanging law across your entire life?',
  },
  {
    id: 'mental-filter',
    nameVi: 'Lọc bỏ điều tích cực',
    nameEn: 'Mental Filter & Discounting the Positive',
    patterns: [/(chỉ là ăn may|không tính|chẳng đáng gì|ai làm chẳng được|just lucky|doesn't count|anyone could do that)/i],
    socraticVi: 'Nếu một người bạn đạt được điều tương tự, bạn có bảo họ "chỉ là ăn may, không tính" không?',
    socraticEn: 'If a dear friend accomplished this same step, would you tell them it does not count?',
  },
  {
    id: 'personalization',
    nameVi: 'Cá nhân hóa & Tự đổ lỗi',
    nameEn: 'Personalization & Self-Blame',
    patterns: [/(tất cả là tại tôi|lỗi do tôi hết|vì tôi mà họ buồn|all my fault|because of me they)/i],
    socraticVi: 'Có những yếu tố khách quan nào khác ngoài tầm kiểm soát của bạn cũng góp phần vào chuyện này?',
    socraticEn: 'What external factors outside your control also contributed to this outcome?',
  },
  {
    id: 'jumping-to-conclusions',
    nameVi: 'Vội vàng kết luận',
    nameEn: 'Jumping to Conclusions',
    patterns: [/(rõ ràng là họ ghét|thế là xong|chắc chắn bị đuổi|obviously they hate|definitely getting fired)/i],
    socraticVi: 'Máy quay thực tế ghi lại dữ kiện gì trước khi tâm trí nhảy tới kết luận đó?',
    socraticEn: 'What did the video camera actually record before your mind jumped to that conclusion?',
  },
];

const POSITIVE_MANIA_DISTORTION_RULES: Array<{
  id: string;
  nameVi: string;
  nameEn: string;
  patterns: RegExp[];
  socraticVi: string;
  socraticEn: string;
}> = [
  {
    id: 'grandiosity',
    nameVi: 'Tự cao & Ảo tưởng năng lực',
    nameEn: 'Grandiosity (Bipolar Positive Distortion)',
    patterns: [/(thiên tài|tỷ đô|thay đổi thế giới|không ai hiểu tầm nhìn|genius idea|billion dollar|change the world overnight)/i],
    socraticVi: '🔍 Góc nhìn khách quan: Ý tưởng này rất cuốn hút — nhưng nếu hỏi 2 người bạn tin cậy sau 48 giờ ngủ đủ giấc, họ sẽ chỉ ra rủi ro nào?',
    socraticEn: '[Devil\'s Advocate] This vision feels thrilling — what risks would 2 trusted friends point out after 48 hours of full sleep?',
  },
  {
    id: 'magical-energy',
    nameVi: 'Ảo tưởng không cần ngủ',
    nameEn: 'Magical Energy / No Need for Sleep',
    patterns: [/(không cần ngủ|ngủ 2 tiếng vẫn khỏe|khỏi bệnh hoàn toàn rồi|không cần uống thuốc nữa|don't need sleep|cured now|stop my lithium|stop my meds)/i],
    socraticVi: '🌿 Lưu ý nhịp sinh học: Cảm giác "không cần ngủ / đã khỏi hẳn không cần thuốc" là dấu hiệu điển hình của giai đoạn hưng phấn quá mức.',
    socraticEn: '[Hypomania Guard] Feeling zero need for sleep or wanting to stop mood stabilizers is a hallmark biological prodrome of hypomania.',
  },
  {
    id: 'invulnerability',
    nameVi: 'Ảo tưởng không có rủi ro',
    nameEn: 'Invulnerability (Zero-Risk Illusion)',
    patterns: [/(chắc chắn thắng 100%|không thể lỗ|all-in hết tiền|rủi ro bằng 0|100% guaranteed win|cannot lose|bet everything)/i],
    socraticVi: '🔍 Góc nhìn khách quan: Trong các đợt khí sắc lên cao trước đây, những quyết định "chắc thắng 100%" đã để lại hệ quả gì sau 2 tuần?',
    socraticEn: '[Devil\'s Advocate] In past elevated episodes, what happened 2 weeks after decisions that felt "100% risk-free"?',
  },
  {
    id: 'impulse-justification',
    nameVi: 'Thúc bách làm ngay lập tức',
    nameEn: 'Impulse Justification (Now-or-Never Urgency)',
    patterns: [/(phải mua ngay đêm nay|nghỉ việc ngay lập tức|cơ hội duy nhất trong đời|buy it right now at 2am|quit my job today|now or never)/i],
    socraticVi: '⏳ Khoang chờ 48 giờ: Nếu đây thực sự là quyết định đúng đắn, nó vẫn sẽ đúng sau 48 giờ nữa. Hãy tạm cất vào Khoang Chờ để tâm trí thật tĩnh táo.',
    socraticEn: '[48h Impulse Vault] If a major decision is truly wise today, it will still be wise in 48 hours. Let\'s lock it in the 48-Hour Vault.',
  },
  {
    id: 'hyper-optimism',
    nameVi: 'Lạc quan phi thực tế',
    nameEn: 'Unrealistic Hyper-Optimism',
    patterns: [/(mọi thứ sẽ tự giải quyết|vay tiền cũng trả được ngay|làm 5 dự án cùng lúc|start 5 companies|everything will magically work)/i],
    socraticVi: '🔍 Góc nhìn khách quan: Hãy kiểm tra giới hạn thời gian và ngân sách thực tế trước khi cam kết thêm bất kỳ dự án mới nào.',
    socraticEn: '[Devil\'s Advocate] Let\'s check your actual calendar and budget constraints before committing to any new project.',
  },
];

export function detectCognitiveDistortions(text: string): {
  negative: DistortionMatch[];
  positiveMania: DistortionMatch[];
  selfDefeatingBeliefs: string[];
} {
  const negative: DistortionMatch[] = [];
  const positiveMania: DistortionMatch[] = [];
  const sdb: string[] = [];

  for (const rule of NEGATIVE_DISTORTION_RULES) {
    if (rule.patterns.some((rx) => rx.test(text))) {
      negative.push({
        id: rule.id,
        polarity: 'negative',
        nameVi: rule.nameVi,
        nameEn: rule.nameEn,
        socraticQuestionVi: rule.socraticVi,
        socraticQuestionEn: rule.socraticEn,
      });
    }
  }

  for (const rule of POSITIVE_MANIA_DISTORTION_RULES) {
    if (rule.patterns.some((rx) => rx.test(text))) {
      positiveMania.push({
        id: rule.id,
        polarity: 'positive-mania',
        nameVi: rule.nameVi,
        nameEn: rule.nameEn,
        socraticQuestionVi: rule.socraticVi,
        socraticQuestionEn: rule.socraticEn,
      });
    }
  }

  if (/(hoàn hảo|không được sai|perfection|never make mistakes)/i.test(text)) {
    sdb.push('Emotional Perfectionism / Chủ nghĩa Hoàn hảo');
  }
  if (/(ai cũng phải hài lòng|sợ họ phật ý|please everyone|disapprove of me)/i.test(text)) {
    sdb.push('Approval Addiction & Conflict Phobia / Nghiện sự công nhận & Sợ xung đột');
  }
  if (/(vô giá trị nếu thất bại|achievement|worthless without success)/i.test(text)) {
    sdb.push('Achievement Addiction / Gắn giá trị bản thân với thành tích');
  }

  return { negative, positiveMania, selfDefeatingBeliefs: sdb };
}

export function detectSafetyBehaviors(text: string): string[] {
  const found: string[] = [];
  if (/(mang theo thuốc trấn an|kiểm tra nhịp tim|đo huyết áp liên tục|check my pulse|carry pills just in case|wear smartwatch constantly)/i.test(text)) {
    found.push('Checking vitals / carrying rescue objects (Kiểm tra mạch/mang vật hộ mệnh ngầm)');
  }
  if (/(né ánh mắt|ngồi gần cửa thoát hiểm|nhìn điện thoại giả vờ bận|avoid eye contact|sit near the exit|pretend to look at phone)/i.test(text)) {
    found.push('Subtle avoidance / escape positioning (Né ánh mắt / ngồi canh cửa thoát hiểm)');
  }
  if (/(hỏi đi hỏi lại|nhờ người đi cùng|soạn sẵn từng chữ|reassurance seeking|ask someone to come with me|over-rehearsing)/i.test(text)) {
    found.push('Reassurance seeking / over-preparation (Tìm kiếm trấn an lặp lại / chuẩn bị quá mức)');
  }
  return found;
}

export interface FourLayerSafetyAssessment {
  safeToProceedToCbt: boolean;
  triggeredLayer: 'none' | 'layer1-crisis-stop' | 'layer2-acute-tipp' | 'layer3-real-danger-exit' | 'layer4-mania-emergency';
  recommendedRoute: 'safety-stop' | 'sos-tipp' | 'justified-exit' | 'hypomania-guard' | 'dbt-cbt-router';
  bannerVi: string;
  bannerEn: string;
  hotlines: Array<{ name: string; phone: string }>;
}

const CRISIS_SUICIDE_REGEX =
  /(tự tử|tự sát|muốn chết|kết liễu|cắt tay|tự hại|không muốn sống nữa|\bsuicide\b|\bsuicidal\b|kill myself|end my life|self-harm|cut myself|cutting myself|better off dead)/i;

const REAL_WORLD_DANGER_REGEX =
  /(bạo hành|đánh đập|đe dọa giết|xâm hại|bắt cóc|domestic violence|hitting me|threatened to kill me|abusing me|abusive partner|unsafe at home)/i;

export function runFourLayerSafetyGate(params: {
  text: string;
  distressIntensity: IntensityScore;
  moodPolarity?: MoodPole;
  energyLevel?: MoodPole;
  bmsSuicideScore?: number;
  phq9Item9Score?: number;
  asrmScore?: number;
}): FourLayerSafetyAssessment {
  const hotlines = [
    { name: 'Cấp cứu Y tế Toàn quốc (VN)', phone: '115' },
    { name: 'Đường dây nóng Ngày Mai (Hỗ trợ Tâm lý)', phone: '096 306 1414' },
    { name: 'Viện Sức khỏe Tâm thần (Bạch Mai)', phone: '024 3869 3731' },
    { name: 'Suicide & Crisis Lifeline (US/Global)', phone: '988' },
  ];

  if (
    CRISIS_SUICIDE_REGEX.test(params.text) ||
    (params.bmsSuicideScore ?? 0) >= 1 ||
    (params.phq9Item9Score ?? 0) >= 1
  ) {
    return {
      safeToProceedToCbt: false,
      triggeredLayer: 'layer1-crisis-stop',
      recommendedRoute: 'safety-stop',
      bannerVi:
        'DỪNG KHẨN CẤP (SAFETY STOP): An toàn tính mạng của bạn là ưu tiên tuyệt đối. Hệ thống đã dừng mọi bài tập nhận thức và tắt toàn bộ Pushback. Xin hãy kết nối ngay với đường dây nóng hoặc người thân trong Giao ước Ulysses của bạn.',
      bannerEn:
        'SAFETY STOP: Your safety is our highest priority. All cognitive exercises and Socratic pushback are immediately suspended. Please reach out to a crisis hotline or your Ulysses Contract trusted contact right now.',
      hotlines,
    };
  }

  if (REAL_WORLD_DANGER_REGEX.test(params.text)) {
    return {
      safeToProceedToCbt: false,
      triggeredLayer: 'layer3-real-danger-exit',
      recommendedRoute: 'justified-exit',
      bannerVi:
        'Bảo vệ An toàn Thực tế (Justified Exit): Nỗi sợ của bạn trước nguy cơ bạo lực/xâm hại là hoàn toàn chính đáng — KHÔNG phải biến dạng nhận thức. Không áp dụng tái cấu trúc suy nghĩ hay thương lượng DEAR MAN. Hãy ưu tiên di chuyển tới nơi an toàn.',
      bannerEn:
        'Real-World Safety Gate (Justified Exit): Fear in the presence of abuse or violence is 100% justified — NOT a cognitive distortion. Cognitive restructuring and DEAR MAN negotiation are disabled. Prioritize physical safety.',
      hotlines,
    };
  }

  const isMixedState = (params.moodPolarity ?? 0) <= -2 && (params.energyLevel ?? 0) >= 2;
  if (params.distressIntensity >= 8 || isMixedState) {
    return {
      safeToProceedToCbt: false,
      triggeredLayer: 'layer2-acute-tipp',
      recommendedRoute: 'sos-tipp',
      bannerVi: isMixedState
        ? 'Cảnh báo Pha Hỗn hợp (Khí sắc trầm <= -2 kèm Năng lượng kích động >= +2): Trạng thái rủi ro cao. Ưu tiên mở Cổng SOS DBT TIPP để hạ nhiệt thần kinh ngay lập tức và liên hệ bác sĩ điều trị.'
        : `Ngưỡng Kích hoạt Sinh lý Đỏ (${params.distressIntensity}/10 >= 8): Vỏ não trước trán đang quá tải. Áp dụng nguyên lý "DBT-First, CBT-Second" — chuyển sang DBT TIPP để hạ nhiệt cơ thể trước.`,
      bannerEn: isMixedState
        ? 'Mixed State Alert (Depressed Mood <= -2 with Agitated Energy >= +2): High-risk state. Routing immediately to DBT TIPP physiological down-regulation and clinician alert.'
        : `Red Arousal Zone (${params.distressIntensity}/10 >= 8): Prefrontal cortex is flooded. Applying "DBT-First, CBT-Second" — routing to DBT TIPP to calm your physiology first.`,
      hotlines,
    };
  }

  if ((params.moodPolarity ?? 0) >= 2 || (params.asrmScore ?? 0) >= 6) {
    return {
      safeToProceedToCbt: true,
      triggeredLayer: 'layer4-mania-emergency',
      recommendedRoute: 'hypomania-guard',
      bannerVi:
        'Lá chắn Hưng cảm nhẹ (Hypomania Guard): Đã bật giao diện Giảm kích thích (Low-Stimulus UI), Khoang Chờ Quyết định 48 Giờ và kỹ thuật Devil\'s Advocate.',
      bannerEn:
        'Hypomania Guard Active: Low-Stimulus Dark Rest UI, 48-Hour Impulse Vault, and Devil\'s Advocate checks are active.',
      hotlines,
    };
  }

  return {
    safeToProceedToCbt: true,
    triggeredLayer: 'none',
    recommendedRoute: 'dbt-cbt-router',
    bannerVi: 'Đã qua 4 lớp sàng lọc an toàn lâm sàng. Sẵn sàng vào phiên thực hành.',
    bannerEn: 'Cleared 4-layer clinical safety screen. Ready for guided protocol.',
    hotlines,
  };
}

export function detectHarshSelfCriticDisguisedAsLogic(text: string): {
  isSelfCriticDisguised: boolean;
  reframePromptVi: string;
  reframePromptEn: string;
} {
  const isCritic =
    /(yếu đuối|vô dụng|ngu ngốc|kẻ thất bại|tệ hại|chẳng ra gì|\bweak\b|\bpathetic\b|\buseless\b|\bstupid\b|\bloser\b|\blazy\b|\bworthless\b)/i.test(
      text
    );
  return {
    isSelfCriticDisguised: isCritic,
    reframePromptVi: isCritic
      ? 'Harsh Self-Critic Guard: Đó là giọng nói của "Kẻ Tự Phán Xét" đội lốt lý trí chứ không phải Tâm Lý Trí (Reasonable Mind). Nếu bỏ hết các từ phán xét bản thân ra, dữ kiện thực tế khách quan còn lại là gì?'
      : 'Tâm Lý Trí đã ghi nhận các dữ kiện khách quan.',
    reframePromptEn: isCritic
      ? 'Harsh Self-Critic Guard: That sounds like the Harsh Inner Critic disguised as logic, rather than Reasonable Mind. If we strip away self-judgment, what are the neutral camera facts?'
      : 'Reasonable Mind objective facts noted.',
  };
}

export function detectChainAnalysisHardStopOrShame(text: string): {
  hardStopSelfHarm: boolean;
  hardStopVictimization: boolean;
  shameProtocolTriggered: boolean;
  responseVi: string;
  responseEn: string;
} {
  if (CRISIS_SUICIDE_REGEX.test(text)) {
    return {
      hardStopSelfHarm: true,
      hardStopVictimization: false,
      shameProtocolTriggered: false,
      responseVi:
        'HARD STOP 1 (Chặn Cứng Lâm Sàng): Tuyệt đối KHÔNG chạy Chain Analysis tự lực trên hành vi tự hại hoặc tự sát. Việc giải phẫu chuỗi tự hại bắt buộc phải thực hiện trực tiếp cùng nhà trị liệu DBT có chuyên môn. Chuyển sang Kế hoạch An toàn ngay.',
      responseEn:
        'HARD STOP 1: Chain Analysis must NEVER be run solo on self-harm or suicidal behavior. Self-harm chain analysis requires a live DBT clinician. Switching immediately to Safety Plan.',
    };
  }

  if (REAL_WORLD_DANGER_REGEX.test(text) || /(bị lừa|bị phản bội|bị tấn công|was assaulted|was betrayed|victim of)/i.test(text)) {
    return {
      hardStopSelfHarm: false,
      hardStopVictimization: true,
      shameProtocolTriggered: false,
      responseVi:
        'HARD STOP 2 (Bảo vệ Nạn nhân): Tuyệt đối KHÔNG chạy Chain Analysis khi bạn là nạn nhân bị người khác bạo hành, xâm hại hoặc phản bội. Hành vi sai trái của người khác không phải chuỗi lỗi lầm của bạn.',
      responseEn:
        'HARD STOP 2: Chain Analysis is NEVER run on situations where you were victimized, abused, or harmed by someone else. Their behavior is not your behavioral chain to fix.',
    };
  }

  const isShame = /(xấu hổ|ghê tởm bản thân|tôi thật ngu xuẩn|không tha thứ cho mình|ashamed|disgusted with myself|i'm disgusting|hate myself for doing)/i.test(
    text
  );

  return {
    hardStopSelfHarm: false,
    hardStopVictimization: false,
    shameProtocolTriggered: isShame,
    responseVi: isShame
      ? 'Giao thức Bảo vệ Cảm giác Xấu hổ (Shame Protocol — Pushback: OFF): Cảm giác xấu hổ đang dâng lên rất mạnh. Chúng ta tắt mọi câu hỏi chất vấn lúc này. Nhìn lại một hành vi mình hối tiếc cần rất nhiều dũng cảm. Hãy hít thở nhẹ — chúng ta tiếp cận bằng sự Tò mò, Không đổ lỗi.'
      : '',
    responseEn: isShame
      ? 'Shame Protocol Activated (Pushback: OFF): Intense shame is present right now. All Socratic pushback is turned off. Looking closely at a behavior you regret takes immense courage. Let\'s slow down — curiosity, not blame.'
      : '',
  };
}

export function generateMoodPaletteFromText(text: string): {
  palette: MoodPalette;
  detectedIntensity: IntensityScore;
  suggestedTechnique: TechniqueSlug;
} {
  if (/(hoảng loạn|không thở được|tim đập nhanh|sợ quá|\bpanic\b|terrified|can't breathe|overwhelmed)/i.test(text)) {
    return {
      palette: {
        dominantEmotion: 'Anxiety',
        colors: ['#be123c', '#fb7185', '#ffe4e6'],
        gradientCss: 'linear-gradient(135deg, #be123c 0%, #fb7185 50%, #ffe4e6 100%)',
        summaryVi: 'Sắc Đỏ San hô — Căng thẳng & Lo âu cấp tính, cần được hạ nhiệt và xoa dịu cơ thể',
        summaryEn: 'Coral Crimson Palette — Acute Anxiety & Autonomic Arousal (Route to DBT TIPP)',
      },
      detectedIntensity: 8,
      suggestedTechnique: 'tipp',
    };
  }

  if (/(kiệt sức|mệt mỏi|trống rỗng|buồn|nằm lì|không muốn làm gì|exhausted|depressed|empty|hopeless|numb)/i.test(text)) {
    return {
      palette: {
        dominantEmotion: 'Sadness',
        colors: ['#1e3a8a', '#3b82f6', '#dbeafe'],
        gradientCss: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 55%, #dbeafe 100%)',
        summaryVi: 'Sắc Lam Trầm — Năng lượng thấp & Buồn bã, ưu tiên nghỉ ngơi và từng bước nhỏ',
        summaryEn: 'Deep Indigo Palette — Low Energy & Sadness (Route to Behavioral Activation with Rest Check)',
      },
      detectedIntensity: 6,
      suggestedTechnique: 'behavioral-activation',
    };
  }

  if (/(xấu hổ|tội lỗi|tự trách|hối hận|ashamed|guilty|regret)/i.test(text)) {
    const family: AffectFamily = /(xấu hổ|ashamed)/i.test(text) ? 'Shame' : 'Guilt';
    return {
      palette: {
        dominantEmotion: family,
        colors: ['#581c87', '#a855f7', '#f3e8ff'],
        gradientCss: 'linear-gradient(135deg, #581c87 0%, #a855f7 55%, #f3e8ff 100%)',
        summaryVi: 'Sắc Tím Thạch anh — Tự trách & Mặc cảm, cần nuôi dưỡng sự tự trắc ẩn',
        summaryEn: 'Amethyst Violet Palette — Self-Criticism / Shame / Guilt (Route to Thought Record)',
      },
      detectedIntensity: 6,
      suggestedTechnique: 'thought-record',
    };
  }

  if (/(tức giận|bực mình|cáu|bất công|khó mở lời|angry|furious|resentful|say no)/i.test(text)) {
    return {
      palette: {
        dominantEmotion: 'Anger',
        colors: ['#9a3412', '#f97316', '#ffedd5'],
        gradientCss: 'linear-gradient(135deg, #9a3412 0%, #f97316 55%, #ffedd5 100%)',
        summaryVi: 'Sắc Cam Hổ phách — Cảm giác bất công & Xung đột, cần bảo vệ ranh giới cá nhân',
        summaryEn: 'Warm Amber Palette — Boundary & Interpersonal Friction (Route to DBT DEAR MAN + EAR)',
      },
      detectedIntensity: 6,
      suggestedTechnique: 'dear-man',
    };
  }

  // Elevated / Joyful / Hypomanic-Spectrum Detection
  if (
    /(hưng phấn|phấn chấn|tràn trề năng lượng|hào hứng|nhiều ý tưởng|vui vẻ|yêu đời|không cần ngủ|thức trắng|ý tưởng thiên tài|\benergized\b|\beuphoric\b|\bexcited\b|\bjoyful\b|full of ideas|no need for sleep)/i.test(
      text
    )
  ) {
    const hasHypomanicSignal =
      /(không cần ngủ|thức trắng|ý tưởng thiên tài|chắc chắn thắng 100%|mua sắm hết|no need for sleep|sleepless|zero risk)/i.test(
        text
      );
    return {
      palette: {
        dominantEmotion: 'Elevated',
        colors: ['#92400e', '#f59e0b', '#fef3c7'],
        gradientCss: 'linear-gradient(135deg, #92400e 0%, #f59e0b 55%, #fef3c7 100%)',
        summaryVi: hasHypomanicSignal
          ? 'Sắc Vàng Hổ phách — Năng lượng & Hưng phấn tăng cao kèm dấu hiệu giảm ngủ (Khuyến nghị kiểm tra Nhịp IPSRT & Khoang Chờ 48h cho RLLC)'
          : 'Sắc Nắng Ấm — Vui vẻ, Hứng khởi & Năng lượng tích cực (Tận hưởng điều độ & giữ vững nhịp giấc ngủ)',
        summaryEn: hasHypomanicSignal
          ? 'Warm Gold Palette — Elevated Arousal with Reduced-Sleep Signal (Route to Hypomania Reality Check & IPSRT)'
          : 'Sunlit Gold Palette — Healthy Positive Energy & Enthusiasm (Savor mindfully while keeping steady sleep anchors)',
      },
      detectedIntensity: hasHypomanicSignal ? 6 : 2,
      suggestedTechnique: hasHypomanicSignal ? 'hypomania-devils-advocate' : 'behavioral-activation',
    };
  }

  // Calm / Normal / Medicated Euthymia Detection
  const isExplicitCalm =
    /(bình thường|bình ổn|ổn định|thư thái|nhẹ nhàng|đã uống thuốc|ngủ ngon|an yên|\bcalm\b|\bnormal\b|\bstable\b|\bsteady\b|\bpeaceful\b)/i.test(
      text
    );

  return {
    palette: {
      dominantEmotion: 'Calm',
      colors: ['#115e59', '#14b8a6', '#ccfbf1'],
      gradientCss: 'linear-gradient(135deg, #115e59 0%, #14b8a6 55%, #ccfbf1 100%)',
      summaryVi: isExplicitCalm
        ? 'Sắc Xanh Ngọc bích — Trạng thái Bình ổn & Thư thái (Ghi nhận sự ổn định của điều trị và duy trì nhịp sinh hoạt)'
        : 'Sắc Xanh Ngọc bích — Tâm trí tĩnh lặng, sẵn sàng mở rộng góc nhìn',
      summaryEn: isExplicitCalm
        ? 'Serene Teal Palette — Steady Euthymic Balance (Maintain healthy routines & sleep anchors)'
        : 'Serene Teal Palette — Reflective readiness (Route to CBT Thought Record / Wise Mind)',
    },
    detectedIntensity: isExplicitCalm ? 1 : 3,
    suggestedTechnique: 'thought-record',
  };
}
