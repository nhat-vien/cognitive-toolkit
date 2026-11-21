/**
 * 36 Interactive CBT, TEAM-CBT, DBT & Bipolar Tools Catalog & 0ms Deterministic Analyzer
 * Ported & expanded from:
 * - alexcoledev/cbt-toolkit (36 CBT tools catalog)
 * - Dr. David Burns Feeling Good / TEAM-CBT (Paradoxical Agenda Setting, Pleasure-Predicting M/P, Anti-Procrastination, 23 SDBs, EAR)
 * - glebis/claude-cognitive-toolkit & Linehan DBT (ABC PLEASE, ACCEPTS, 5-Senses Self-Soothe, Radical Acceptance, Urge Surfing, Hypomania Guard)
 */

import type { FeltNeedForSleep } from '../schemas/models.ts';
import {
  analyzeClinicalText,
  evaluateFourLayerSafety,
  type DetectedPatternMatch,
  type FourLayerSafetyEvaluation,
} from '../detectors/distortion-detector.ts';

export type ClinicalToolCategory =
  | 'core-cbt'
  | 'anxiety-erp'
  | 'depression-team-cbt'
  | 'bipolar-ipsrt'
  | 'dbt-regulation'
  | 'work-burnout';

export type ClinicalToolConditionFocus = 'anxiety' | 'depression' | 'bipolar' | 'universal';

export interface Cbt36ToolDefinition {
  id: string;
  number: number; // 1..36
  slug: string;
  category: ClinicalToolCategory;
  titleVi: string;
  titleEn: string;
  conditionFocus: ClinicalToolConditionFocus;
  whenToUseVi: string;
  whenToUseEn: string;
  whenNotToUseVi: string;
  whenNotToUseEn: string;
  interactivePromptsVi: string[];
  interactivePromptsEn: string[];
}

export interface InteractiveToolkitContext {
  moodPolarity?: number;
  intensity?: number;
  sleepHours?: number;
}

export interface InteractiveToolkitAnalysisResult {
  toolId: string;
  toolNumber: number;
  toolSlug: string;
  category: ClinicalToolCategory;
  conditionFocus: ClinicalToolConditionFocus;
  titleVi: string;
  titleEn: string;
  userInput: string;
  executionLatencyMs: 0;
  safetyEvaluation: FourLayerSafetyEvaluation;
  safeToProceed: boolean;
  detectedPatterns: {
    negativeDistortions: DetectedPatternMatch[];
    positiveDistortions: DetectedPatternMatch[];
    selfDefeatingBeliefs: DetectedPatternMatch[];
    safetyBehaviors: DetectedPatternMatch[];
  };
  instantAnalysisVi: string;
  instantAnalysisEn: string;
  guidedReframeVi: string;
  guidedReframeEn: string;
  nextActionStepVi: string;
  nextActionStepEn: string;
  clinicalGuardrailNoteVi: string;
  clinicalGuardrailNoteEn: string;
}

export interface CbtiSleepEfficiencyInput {
  timeInBedMinutes: number;
  totalSleepMinutes: number;
  sleepOnsetLatencyMinutes: number;
  wakeAfterSleepOnsetMinutes: number;
  feltNeedForSleep: FeltNeedForSleep;
}

export interface CbtiSleepEfficiencyResult {
  sleepEfficiencyPercent: number;
  wakeTimeInBedMinutes: number;
  sleepEfficiencyCategory:
    | 'optimal'
    | 'mild-fragmentation'
    | 'clinical-insomnia'
    | 'bipolar-mania-contraindication';
  bipolarManiaContraindicationTriggered: boolean;
  sleepRestrictionAllowed: boolean;
  hypomaniaGuardTriggered: boolean;
  recommendedTimeInBedMinutes: number | null;
  recommendationVi: string;
  recommendationEn: string;
  safetyWarningVi?: string;
  safetyWarningEn?: string;
}

export interface DbtAbcPleaseInput {
  accumulatedPositivesToday: boolean;
  buildMasteryCompleted: boolean;
  copeAheadPrepared: boolean;
  physicalIllnessTreated: boolean;
  balancedEating: boolean;
  avoidedMoodAlteringSubstances: boolean;
  balancedSleep: boolean;
  gotGentleExercise: boolean;
  currentEmotionOrUrge?: string;
  emptinessOrDepressionIntensity?: number; // 0-10
  moodPolarity?: number; // -5..+5
}

export interface DbtAcceptsAndSelfSoothePlan {
  resilienceScorePercent: number;
  completedPillarsCount: number;
  totalPillarsCount: 8;
  lowEnergyDepressionModeActive: boolean;
  missingVulnerabilityFactorsVi: string[];
  missingVulnerabilityFactorsEn: string[];
  acceptsSkillsVi: Array<{ letter: string; skill: string; microAction: string }>;
  acceptsSkillsEn: Array<{ letter: string; skill: string; microAction: string }>;
  fiveSensesSelfSootheVi: Array<{ sense: string; suggestion: string }>;
  fiveSensesSelfSootheEn: Array<{ sense: string; suggestion: string }>;
  summaryVi: string;
  summaryEn: string;
}

/**
 * Complete Catalog of all 36 Interactive CBT, TEAM-CBT, DBT & Bipolar Tools
 */
export const CBT_36_TOOLS_CATALOG: Cbt36ToolDefinition[] = [
  {
    id: 'tool-01-thought-record',
    number: 1,
    slug: 'thought-record',
    category: 'core-cbt',
    titleVi: '1. Nhật ký Suy nghĩ 7 Bước & Kiểm tra Sự thật (Thought Record)',
    titleEn: '1. 7-Step Thought Record & Accuracy Check',
    conditionFocus: 'universal',
    whenToUseVi: 'Khi một sự kiện kích hoạt suy nghĩ tự động tiêu cực và cường độ cảm xúc dưới 8/10.',
    whenToUseEn: 'When a situation triggers a hot automatic thought and distress is below 8/10.',
    whenNotToUseVi: 'Không dùng khi đang hoảng loạn cấp (>= 8/10) hoặc khi nguy hiểm thực tế đang xảy ra.',
    whenNotToUseEn: 'Do not use during acute panic (>= 8/10) or active physical danger.',
    interactivePromptsVi: [
      'Sự việc cụ thể gì vừa xảy ra (Ai, ở đâu, khi nào)?',
      'Suy nghĩ nóng nhất trong đầu bạn lúc đó là gì (0-100%)?',
      'Bằng chứng thực tế nào ủng hộ và phản biện lại suy nghĩ này?',
    ],
    interactivePromptsEn: [
      'What objective event occurred (who, where, when)?',
      'What was your hottest automatic thought (0-100% belief)?',
      'What factual evidence supports vs. contradicts this thought?',
    ],
  },
  {
    id: 'tool-02-distortion-checker',
    number: 2,
    slug: 'distortion-checker',
    category: 'core-cbt',
    titleVi: '2. Máy Quét 11 Biến dạng Nhận thức (Distortion Checker)',
    titleEn: '2. 11 Burns Cognitive Distortion Checker',
    conditionFocus: 'universal',
    whenToUseVi: 'Khi bạn muốn nhận diện nhanh các bẫy tư duy như Trắng-Đen, Khái quát hóa hay Đọc suy nghĩ.',
    whenToUseEn: 'When you want to instantly spot thinking traps like All-or-Nothing or Mind Reading.',
    whenNotToUseVi: 'Không dùng để bác bỏ nỗi buồn tự nhiên trước mất mát thực tế.',
    whenNotToUseEn: 'Do not use to invalidate natural grief or objective loss.',
    interactivePromptsVi: [
      'Nhập nguyên văn câu suy nghĩ đang làm bạn khó chịu:',
      'Có từ ngữ tuyệt đối nào ("luôn luôn", "không bao giờ", "hoàn toàn") trong câu không?',
    ],
    interactivePromptsEn: [
      'Write the exact thought bothering you right now:',
      'Are there absolute words ("always", "never", "completely") in this thought?',
    ],
  },
  {
    id: 'tool-03-catastrophe-reframer',
    number: 3,
    slug: 'catastrophe-reframer',
    category: 'anxiety-erp',
    titleVi: '3. Giải cấu trúc Kịch bản Thảm họa (Catastrophe Reframer)',
    titleEn: '3. Catastrophe Reframer (Worst / Best / Most Likely)',
    conditionFocus: 'anxiety',
    whenToUseVi: 'Khi tâm trí phóng đại một rủi ro thành thảm họa tận thế không thể cứu vãn.',
    whenToUseEn: 'When your mind magnifies an uncertain event into an unbearable catastrophe.',
    whenNotToUseVi: 'Không dùng khi đang có cấp cứu y khoa hoặc đe dọa an toàn thực tế.',
    whenNotToUseEn: 'Do not use during a genuine medical or physical emergency.',
    interactivePromptsVi: [
      'Kịch bản tồi tệ nhất mà bạn đang hình dung là gì (xác suất thực tế bao nhiêu %)?',
      'Kịch bản tốt nhất và kịch bản có khả năng xảy ra cao nhất ngoài đời thực là gì?',
      'Nếu kịch bản xấu xảy ra, bạn sẽ ứng phó bằng 2 nguồn lực nào?',
    ],
    interactivePromptsEn: [
      'What is the absolute worst-case scenario you imagine (and realistic probability %)?',
      'What is the best-case and most likely realistic scenario?',
      'If the difficult outcome happened, what 2 coping resources would you use?',
    ],
  },
  {
    id: 'tool-04-core-belief-detector',
    number: 4,
    slug: 'core-belief-detector',
    category: 'depression-team-cbt',
    titleVi: '4. Thang Mũi tên Đi xuống & 23 Niềm tin Tự hủy hoại (Core Belief / Downward Arrow)',
    titleEn: '4. Core Belief Detector & Downward Arrow (23 SDBs)',
    conditionFocus: 'depression',
    whenToUseVi: 'Khi một phản ứng cảm xúc lặp đi lặp lại bắt nguồn từ niềm tin gốc rễ (Cầu toàn, Nghiện công nhận).',
    whenToUseEn: 'When recurring emotional pain stems from a deeper Self-Defeating Belief.',
    whenNotToUseVi: 'Không đào sâu niềm tin cốt lõi khi người dùng đang kiệt sức nặng hoặc khủng hoảng.',
    whenNotToUseEn: 'Do not excavate core beliefs during acute crisis or severe exhaustion.',
    interactivePromptsVi: [
      'Giả sử suy nghĩ ban đầu của bạn là đúng, điều đó có ý nghĩa gì về con người bạn?',
      'Và nếu điều đó xảy ra, vì sao nó lại đáng sợ đối với bạn?',
    ],
    interactivePromptsEn: [
      'Suppose your automatic thought were true—what would that mean about you?',
      'And if that were true, why would that be upsetting to you?',
    ],
  },
  {
    id: 'tool-05-safety-behavior-detector',
    number: 5,
    slug: 'safety-behavior-detector',
    category: 'anxiety-erp',
    titleVi: '5. Máy Dò Hành vi An toàn Ngầm (Safety Behavior Detector)',
    titleEn: '5. Safety Behavior & Avoidance Crutch Detector',
    conditionFocus: 'anxiety',
    whenToUseVi: 'Khi bạn đi qua tình huống sợ hãi nhưng vẫn thấy lo âu vì phụ thuộc vào nạng chống ngầm.',
    whenToUseEn: 'When anxiety persists because subtle safety crutches prevent inhibitory learning.',
    whenNotToUseVi: 'Không bỏ các biện pháp an toàn y khoa thực sự (ví dụ thuốc cấp cứu hen suyễn).',
    whenNotToUseEn: 'Never drop genuine prescribed medical precautions.',
    interactivePromptsVi: [
      'Bạn đang làm gì để cố kiểm soát, che giấu hoặc tìm đường thoát trong tình huống này?',
      'Bạn có đang xin trấn an liên tục, tra Google triệu chứng hay canh cửa thoát hiểm không?',
    ],
    interactivePromptsEn: [
      'What subtle things are you doing to hide, control, or prepare an escape?',
      'Are you seeking reassurance, googling symptoms, or guarding the exit?',
    ],
  },
  {
    id: 'tool-06-prediction-calibration',
    number: 6,
    slug: 'prediction-calibration',
    category: 'anxiety-erp',
    titleVi: '6. Hiệu chỉnh Tiên tri Lo âu (Prediction Calibration Tracker)',
    titleEn: '6. Prediction Calibration & Reality Tracker',
    conditionFocus: 'anxiety',
    whenToUseVi: 'Trước khi bước vào cuộc họp, bài thi hoặc sự kiện khiến bạn tiên tri kết cục xấu.',
    whenToUseEn: 'Before entering a feared meeting, exam, or event to test fortune-telling against reality.',
    whenNotToUseVi: 'Không dùng cho các quyết định bốc đồng hưng cảm (hãy dùng Khoang 48 Giờ).',
    whenNotToUseEn: 'Do not use to justify hypomanic risk-taking (use the 48h Impulse Vault instead).',
    interactivePromptsVi: [
      'Dự đoán cụ thể có thể kiểm chứng của bạn là gì (Mức độ chắc chắn 0-100%)?',
      'Sau khi sự việc diễn ra, điều gì đã thực sự xảy ra ngoài đời?',
    ],
    interactivePromptsEn: [
      'What is your specific testable prediction (0-100% certainty)?',
      'After the event, what actually happened in reality?',
    ],
  },
  {
    id: 'tool-07-exposure-hierarchy-erp',
    number: 7,
    slug: 'exposure-hierarchy-erp',
    category: 'anxiety-erp',
    titleVi: '7. Thiết kế Thang Tiếp xúc & Phòng ngừa Phản ứng (Exposure Hierarchy ERP)',
    titleEn: '7. Exposure Hierarchy Builder (SUDS 0-100 & ERP)',
    conditionFocus: 'anxiety',
    whenToUseVi: 'Khi xây dựng lộ trình bước nhỏ đối diện nỗi sợ ám ảnh, lo âu xã hội hoặc OCD.',
    whenToUseEn: 'When building a gradual step-by-step ladder (SUDS 0-100) for phobias, social anxiety, or OCD.',
    whenNotToUseVi: 'Không bắt đầu ở bậc SUDS 90-100 ngay lập tức; luôn đi từ bậc 25-40.',
    whenNotToUseEn: 'Do not start with a SUDS 90-100 flood; begin with a manageable SUDS 25-40 rung.',
    interactivePromptsVi: [
      'Tình huống bạn đang né tránh là gì và mức độ sợ hãi SUDS hiện tại (0-100)?',
      'Hành vi an toàn nào bạn cam kết buông bỏ trong 15 phút tiếp xúc này?',
    ],
    interactivePromptsEn: [
      'What avoided situation are you targeting and what is its baseline SUDS (0-100)?',
      'Which safety behavior will you drop during this 15-minute exposure trial?',
    ],
  },
  {
    id: 'tool-08-interoceptive-exposure-screen',
    number: 8,
    slug: 'interoceptive-exposure-screen',
    category: 'anxiety-erp',
    titleVi: '8. Tiếp xúc Cảm giác Cơ thể & Sàng lọc Y khoa (Interoceptive Exposure)',
    titleEn: '8. Interoceptive Exposure & Medical Safety Screen',
    conditionFocus: 'anxiety',
    whenToUseVi: 'Khi người bệnh Rối loạn Hoảng sợ sợ các cảm giác sinh lý vô hại (tim đập nhanh, chóng mặt).',
    whenToUseEn: 'For panic disorder when harmless bodily sensations (racing heart, dizziness) trigger fear of dying.',
    whenNotToUseVi: 'BẮT BUỘC loại trừ bệnh tim mạch, hô hấp, động kinh, thai kỳ nguy cơ cao trước khi tập.',
    whenNotToUseEn: 'MANDATORY medical clearance required for cardiac, respiratory, seizure, or pregnancy conditions.',
    interactivePromptsVi: [
      'Bạn đã xác nhận không có chống chỉ định tim mạch/hô hấp cho bài tập cảm giác cơ thể chưa?',
      'Cảm giác cơ thể nào (tim đập nhanh khi chạy tại chỗ 30s, xoay ghế nhẹ) làm bạn sợ nhất?',
    ],
    interactivePromptsEn: [
      'Have you confirmed no cardiac/respiratory contraindications for interoceptive exercises?',
      'Which physical sensation (heart rate from 30s jogging in place, mild dizziness) scares you most?',
    ],
  },
  {
    id: 'tool-09-worry-box-postponement',
    number: 9,
    slug: 'worry-box-postponement',
    category: 'anxiety-erp',
    titleVi: '9. Hộp Trì hoãn Lo âu & Phân loại Lo âu (Worry Box Postponement)',
    titleEn: '9. Worry Box Postponement & Productive vs. Hypothetical Triage',
    conditionFocus: 'anxiety',
    whenToUseVi: 'Khi các câu hỏi "Nhỡ đâu... (What if...)" xâm chiếm tâm trí làm bạn mất tập trung hoặc mất ngủ.',
    whenToUseEn: 'When repetitive "What if..." worries hijack your workday or bedtime.',
    whenNotToUseVi: 'Không trì hoãn các vấn đề khẩn cấp cần hành động bảo vệ an toàn ngay trong 5 phút tới.',
    whenNotToUseEn: 'Do not postpone immediate physical emergencies requiring action in the next 5 minutes.',
    interactivePromptsVi: [
      'Viết câu lo âu "Nhỡ đâu..." để cất vào Hộp Lo âu tới khung giờ 17:30:',
      'Đây là Lo âu Thực tế có thể hành động ngay hay Lo âu Giả định ngoài tầm kiểm soát?',
    ],
    interactivePromptsEn: [
      'Deposit your "What if..." worry into the Worry Box until your scheduled 17:30 worry window:',
      'Is this a Productive actionable problem or a Hypothetical uncontrollable worry?',
    ],
  },
  {
    id: 'tool-10-panic-diary',
    number: 10,
    slug: 'panic-diary',
    category: 'anxiety-erp',
    titleVi: '10. Nhật ký Giải mã Cơn Hoảng loạn (Panic Attack Diary)',
    titleEn: '10. Panic Attack De-escalation & Loop Diary',
    conditionFocus: 'anxiety',
    whenToUseVi: 'Sau khi cơn hoảng loạn đi qua để thấy rõ đường cong adrenaline luôn tự hạ xuống sau 10-15 phút.',
    whenToUseEn: 'After a panic wave subsides to map the adrenaline curve and disprove catastrophic predictions.',
    whenNotToUseVi: 'Khi đang ở đỉnh cơn hoảng loạn (8-10/10), hãy dùng DBT TIPP trước rồi mới ghi nhật ký sau.',
    whenNotToUseEn: 'At peak panic (8-10/10), use DBT TIPP first and log the diary after physiology cools down.',
    interactivePromptsVi: [
      'Triệu chứng cơ thể đầu tiên xuất hiện là gì và bạn đã diễn giải nó thành mối nguy hiểm gì?',
      'Cơn sóng hoảng loạn đã tự đạt đỉnh và hạ nhiệt sau bao nhiêu phút mà thảm họa không xảy ra?',
    ],
    interactivePromptsEn: [
      'What was the first bodily sensation noticed and what catastrophe did you think it meant?',
      'How many minutes did it take for the adrenaline wave to peak and subside safely?',
    ],
  },
  {
    id: 'tool-11-social-anxiety-spotlight-reframer',
    number: 11,
    slug: 'social-anxiety-spotlight-reframer',
    category: 'anxiety-erp',
    titleVi: '11. Hạ Đèn Sân khấu Lo âu Xã hội (Social Anxiety Spotlight & Brushfire Reframer)',
    titleEn: '11. Social Anxiety Spotlight & Brushfire Fallacy Reframer',
    conditionFocus: 'anxiety',
    whenToUseVi: 'Khi bạn sợ mọi người trong phòng đang săm soi lỗi nói vấp, đỏ mặt hoặc sự ngập ngừng của bạn.',
    whenToUseEn: 'When you feel everyone in the room is scrutinizing your blushing, pause, or minor slip.',
    whenNotToUseVi: 'Không dùng khi bạn đang ở trong môi trường bắt nạt hoặc độc hại thực sự.',
    whenNotToUseEn: 'Do not use to excuse genuine workplace harassment or bullying.',
    interactivePromptsVi: [
      'Bạn đang sợ mọi người chú ý tới chi tiết nào của bạn?',
      'Nếu một đồng nghiệp khác cũng nói vấp 3 giây như vậy, bạn sẽ nhớ việc đó bao lâu?',
    ],
    interactivePromptsEn: [
      'What flaw or awkward moment do you fear everyone is staring at?',
      'If a colleague stumbled over a word for 3 seconds, how long would you remember it?',
    ],
  },
  {
    id: 'tool-12-health-anxiety-symptom-reframer',
    number: 12,
    slug: 'health-anxiety-symptom-reframer',
    category: 'anxiety-erp',
    titleVi: '12. Tái khung Lo âu Bệnh tật & Cai Google Triệu chứng (Health Anxiety Reframer)',
    titleEn: '12. Health Anxiety Symptom Reframer & Cyberchondria Stop',
    conditionFocus: 'anxiety',
    whenToUseVi: 'Khi bạn tra Google triệu chứng hàng giờ hoặc kiểm tra cơ thể liên tục dù bác sĩ đã khám bình thường.',
    whenToUseEn: 'When compulsive symptom googling and body-checking amplify health panic despite medical review.',
    whenNotToUseVi: 'Không thay thế thăm khám y khoa khi có triệu chứng cấp cứu mới xuất hiện.',
    whenNotToUseEn: 'Never replaces legitimate medical evaluation for new acute medical red flags.',
    interactivePromptsVi: [
      'Triệu chứng cơ thể nào đang khiến bạn muốn tra Google hoặc kiểm tra liên tục?',
      'Có những cách giải thích sinh lý lành tính nào (căng cơ, thiếu ngủ, lo âu) cho cảm giác này?',
    ],
    interactivePromptsEn: [
      'Which bodily sensation is triggering the urge to Google or repeatedly check?',
      'What benign physiological explanations (muscle tension, fatigue, caffeine, stress) exist?',
    ],
  },
  {
    id: 'tool-13-ptsd-stuck-point-log',
    number: 13,
    slug: 'ptsd-stuck-point-log',
    category: 'core-cbt',
    titleVi: '13. Nhật ký Điểm Mắc kẹt Nhận thức Sau Sang chấn (CPT Stuck Point Log)',
    titleEn: '13. Trauma-Informed Cognitive Stuck Point Log (Self-Blame vs. Context)',
    conditionFocus: 'anxiety',
    whenToUseVi: 'Khi bạn tự đổ lỗi bất hợp lý ("Đáng lẽ tôi phải biết trước") sau một biến cố đau lòng.',
    whenToUseEn: 'When hindsight bias or unfair self-blame ("I should have known") keeps you stuck after an event.',
    whenNotToUseVi: 'Không tự làm bài tập phơi nhiễm sang chấn sâu một mình nếu đang có flashback phân ly.',
    whenNotToUseEn: 'Do not run solo trauma processing during active dissociation or severe flashbacks (use 5-4-3-2-1 Grounding).',
    interactivePromptsVi: [
      'Câu kết luận "Điểm mắc kẹt" (Stuck Point) nào đang khiến bạn tự trách mình?',
      'Tại thời điểm sự việc xảy ra, bạn chỉ biết những thông tin gì (tránh bẫy Phán xét Hậu nghiệm)?',
    ],
    interactivePromptsEn: [
      'What "Stuck Point" belief is causing you to blame yourself right now?',
      'At the exact moment back then, what information did you actually have (without hindsight bias)?',
    ],
  },
  {
    id: 'tool-14-intrusive-thought-defusion',
    number: 14,
    slug: 'intrusive-thought-defusion',
    category: 'anxiety-erp',
    titleVi: '14. Tách rời Suy nghĩ Xâm nhập Không Mong muốn (Intrusive Thought Defusion)',
    titleEn: '14. Intrusive Thought Cognitive Defusion (Thought != Action)',
    conditionFocus: 'anxiety',
    whenToUseVi: 'Khi có suy nghĩ xâm nhập kỳ lạ/đáng sợ (Ego-dystonic OCD) và bạn sợ có suy nghĩ đó nghĩa là bạn xấu xa.',
    whenToUseEn: 'When unwanted ego-dystonic intrusive thoughts trigger Thought-Action Fusion guilt.',
    whenNotToUseVi: 'Không áp dụng cho ý định tự sát hoặc làm hại có kế hoạch thực tế (Layer 1 Safety Stop).',
    whenNotToUseEn: 'Not for genuine suicidal or violent intent with desire to act (triggers Layer 1 Safety Stop).',
    interactivePromptsVi: [
      'Hãy thêm cụm từ "Tôi nhận thấy tâm trí vừa phát ra dòng chữ..." vào trước suy nghĩ xâm nhập:',
      'Việc bạn thấy khó chịu với suy nghĩ này chứng tỏ giá trị đạo đức thật của bạn là gì?',
    ],
    interactivePromptsEn: [
      'Prefix the thought with: "I notice my brain is generating the random noisy story that..."',
      'What does your distress about this unwanted thought prove about your true values?',
    ],
  },
  {
    id: 'tool-15-perfectionism-cost-benefit',
    number: 15,
    slug: 'perfectionism-cost-benefit',
    category: 'work-burnout',
    titleVi: '15. Phân tích Lợi - Hại của Chủ nghĩa Cầu toàn (Perfectionism Cost-Benefit)',
    titleEn: '15. TEAM-CBT Perfectionism Cost-Benefit Analysis',
    conditionFocus: 'depression',
    whenToUseVi: 'Khi niềm tin "Tôi không được phép mắc bất kỳ sai sót nào" làm bạn kiệt sức và trì hoãn.',
    whenToUseEn: 'When "I must never make a mistake" drives chronic exhaustion, anxiety, and procrastination.',
    whenNotToUseVi: 'Không có chống chỉ định; rất tốt cho người cầu toàn thành tích.',
    whenNotToUseEn: 'Safe for any non-crisis state; ideal for high-achieving perfectionists.',
    interactivePromptsVi: [
      'Liệt kê các LỢI ÍCH và CÁI GIÁ PHẢI TRẢ của việc ép bản thân phải hoàn hảo 100%:',
      'Cân bàn (0-100): Chủ nghĩa cầu toàn đang giúp bạn hay đang lấy đi bình yên của bạn nhiều hơn?',
    ],
    interactivePromptsEn: [
      'List the ADVANTAGES vs. DISADVANTAGES of demanding 100% flawlessness from yourself:',
      'Balance scale (0-100): Does perfectionism help you or cost you more peace and creativity?',
    ],
  },
  {
    id: 'tool-16-low-self-esteem-positive-data-log',
    number: 16,
    slug: 'low-self-esteem-positive-data-log',
    category: 'depression-team-cbt',
    titleVi: '16. Sổ Thu thập Dữ kiện Giá trị Bản thân (Positive Data Log)',
    titleEn: '16. Self-Esteem Positive Data Log (Countering Mental Filter)',
    conditionFocus: 'depression',
    whenToUseVi: 'Khi bộ lọc tiêu cực khiến bạn gạch bỏ mọi nỗ lực nhỏ và tự dán nhãn "Tôi vô dụng".',
    whenToUseEn: 'When depression filters out every small win and labels you "worthless" or "inadequate".',
    whenNotToUseVi: 'Không biến thành tự cao phi thực tế khi đang ở pha Hưng cảm (Mood >= +2).',
    whenNotToUseEn: 'Do not use to fuel grandiose inflation during hypomania (Mood >= +2).',
    interactivePromptsVi: [
      'Ghi lại 2 hành động nhỏ nhưng có thật hôm nay cho thấy bạn có cố gắng hoặc tử tế:',
      'Nếu tâm trí bảo "Việc đó nhỏ xíu không tính", bạn sẽ bảo vệ dữ kiện thực tế này thế nào?',
    ],
    interactivePromptsEn: [
      'Record 2 small, concrete facts today showing effort, resilience, or kindness:',
      'If your inner critic says "That doesn’t count", how will you defend this factual evidence?',
    ],
  },
  {
    id: 'tool-17-imposter-syndrome-evidence-log',
    number: 17,
    slug: 'imposter-syndrome-evidence-log',
    category: 'work-burnout',
    titleVi: '17. Hồ sơ Thực chứng Chống Hội chứng Kẻ Mạo danh (Imposter Syndrome Log)',
    titleEn: '17. Imposter Syndrome Evidence & Attribution Log',
    conditionFocus: 'anxiety',
    whenToUseVi: 'Khi bạn sợ mọi người sẽ "phát hiện ra mình chỉ ăn may và không đủ năng lực".',
    whenToUseEn: 'When you fear colleagues will "discover I am a fraud who only succeeded by luck".',
    whenNotToUseVi: 'Không có chống chỉ định.',
    whenNotToUseEn: 'No contraindications.',
    interactivePromptsVi: [
      'Thành quả nào bạn đang quy hết cho "ăn may" và phủ nhận công sức học hỏi của mình?',
      'Kỹ năng và giờ làm việc thực tế nào của bạn đã đóng góp vào kết quả đó?',
    ],
    interactivePromptsEn: [
      'Which accomplishment are you attributing purely to "luck" while discounting your skill?',
      'What concrete hours of preparation and problem-solving did you actually invest?',
    ],
  },
  {
    id: 'tool-18-burnout-and-rest-check',
    number: 18,
    slug: 'burnout-and-rest-check',
    category: 'work-burnout',
    titleVi: '18. Cổng Kiểm tra Kiệt sức & Nghỉ ngơi Không Áy náy (Burnout & Rest Check)',
    titleEn: '18. Burnout Audit & Guilt-Free Rest Check Gate',
    conditionFocus: 'depression',
    whenToUseVi: 'Khi bạn phân vân không biết mình đang né tránh do trầm cảm hay đang kiệt sức sinh học thực sự.',
    whenToUseEn: 'To distinguish depressive avoidance from genuine biological exhaustion requiring guilt-free rest.',
    whenNotToUseVi: 'Không ép kích hoạt hành vi cường độ cao khi cơ thể đang ốm hoặc thiếu ngủ trầm trọng.',
    whenNotToUseEn: 'Never force behavioral activation when biologically ill or severely sleep-deprived.',
    interactivePromptsVi: [
      'Bạn đang kiệt sức thể chất/thiếu ngủ thực sự hay đang thu mình vì cảm giác tội lỗi?',
      'Nếu cơ thể cần nghỉ, hãy chốt khung giờ Nghỉ ngơi Có Chủ đích (từ mấy giờ đến mấy giờ) hoàn toàn không áy náy:',
    ],
    interactivePromptsEn: [
      'Is your body biologically exhausted/ill, or is depression telling you to isolate?',
      'If biological rest is needed, define your Guilt-Free Intentional Rest window (start to end time):',
    ],
  },
  {
    id: 'tool-19-anger-disarming-ear',
    number: 19,
    slug: 'anger-disarming-ear',
    category: 'dbt-regulation',
    titleVi: '19. Hóa giải Cơn giận & 5 Bí quyết Giao tiếp EAR (Anger Disarming & DEAR MAN)',
    titleEn: '19. Anger Disarming (TEAM-CBT EAR) & DEAR MAN Script Builder',
    conditionFocus: 'universal',
    whenToUseVi: 'Khi xung đột quan hệ hoặc cơn giận xuất phát từ tư duy "Họ hoàn toàn sai, lẽ ra họ phải...".',
    whenToUseEn: 'During interpersonal conflict or anger fueled by "They shouldn’t act this way".',
    whenNotToUseVi: 'KHÔNG dùng kỹ thuật Disarming (nhận lỗi/tìm điểm đúng) với người đang bạo hành bạn.',
    whenNotToUseEn: 'NEVER use Disarming or self-blame with an abusive or violent partner.',
    interactivePromptsVi: [
      'Lời phàn nàn của đối phương là gì và có "1% hạt nhân sự thật" nào bạn có thể công nhận (Disarming)?',
      'Viết câu bày tỏ cảm xúc bằng ngôi "Tôi cảm thấy..." và đề xuất giải pháp rõ ràng (DEAR MAN):',
    ],
    interactivePromptsEn: [
      'What did the other person say, and what 1% grain of truth can you validate (Disarming)?',
      'Draft your "I feel..." statement and clear request using EAR + DEAR MAN:',
    ],
  },
  {
    id: 'tool-20-cbti-sleep-efficiency-calculator',
    number: 20,
    slug: 'cbti-sleep-efficiency-calculator',
    category: 'bipolar-ipsrt',
    titleVi: '20. Tính Hiệu suất Giấc ngủ CBT-I & Chốt Chặn Lưỡng cực (CBT-I Sleep Calculator)',
    titleEn: '20. CBT-I Sleep Efficiency Calculator (with Bipolar Mania Contraindication Guard)',
    conditionFocus: 'bipolar',
    whenToUseVi: 'Khi mất ngủ kéo dài và muốn tối ưu hóa thời gian nằm trên giường (Sleep Efficiency >= 85%).',
    whenToUseEn: 'For chronic insomnia to calculate Sleep Efficiency % and optimize your sleep window.',
    whenNotToUseVi: 'CẤM hạn chế giấc ngủ (Sleep Restriction) nếu người bệnh Lưỡng cực giảm nhu cầu ngủ (nguy cơ kích hoạt Hưng cảm!).',
    whenNotToUseEn: 'CONTRAINDICATED: Never apply CBT-I sleep restriction when feltNeedForSleep is reduced/none (triggers Mania!).',
    interactivePromptsVi: [
      'Đêm qua bạn nằm trên giường bao nhiêu phút và thực sự ngủ được bao nhiêu phút?',
      'Sáng nay bạn thấy Kiệt sức muốn ngủ tiếp hay thấy Khỏe re không cần ngủ (Cổng phân biệt Lưỡng cực)?',
    ],
    interactivePromptsEn: [
      'How many minutes did you spend in bed vs. actually asleep last night?',
      'Do you feel exhausted wanting sleep, or energized with reduced need for sleep (Bipolar Gate)?',
    ],
  },
  {
    id: 'tool-21-shame-attacking-compassionate-reframe',
    number: 21,
    slug: 'shame-attacking-compassionate-reframe',
    category: 'depression-team-cbt',
    titleVi: '21. Giải độc Xấu hổ & Tái khung Từ bi (Shame Protocol & Compassionate Reframe)',
    titleEn: '21. Shame Protocol & Self-Compassion Reframe',
    conditionFocus: 'depression',
    whenToUseVi: 'Khi cảm giác xấu hổ làm bạn muốn trốn chạy và tự gọi mình là "kinh tởm / hỏng bét".',
    whenToUseEn: 'When toxic shame makes you want to hide and attacks your core human dignity.',
    whenNotToUseVi: 'Khi đang ngập trong xấu hổ, hệ thống tự động tắt Pushback để ưu tiên sự thấu cảm.',
    whenNotToUseEn: 'Socratic pushback is automatically turned OFF during toxic shame to prioritize warmth.',
    interactivePromptsVi: [
      'Điều gì đang khiến bạn cảm thấy xấu hổ hoặc muốn thu mình lại lúc này?',
      'Nếu tách riêng "một hành vi chưa khéo" khỏi "phẩm giá con người bạn", bạn sẽ nói lời từ bi nào?',
    ],
    interactivePromptsEn: [
      'What experience is triggering feelings of shame or the urge to hide right now?',
      'Separating a single human mistake from your core worth, what compassionate truth can you offer yourself?',
    ],
  },
  {
    id: 'tool-22-grief-and-loss-coping',
    number: 22,
    slug: 'grief-and-loss-coping',
    category: 'depression-team-cbt',
    titleVi: '22. Đồng hành Đau buồn & Mất mát Thực tế (Grief & Loss Compassionate Coping)',
    titleEn: '22. Grief & Objective Loss Compassionate Coping (Non-Pathologizing)',
    conditionFocus: 'depression',
    whenToUseVi: 'Khi nỗi buồn đến từ sự mất mát có thật (người thân, chia tay, mất việc) không phải là biến dạng nhận thức.',
    whenToUseEn: 'When sadness reflects a real loss—honoring grief while challenging only secondary self-blame.',
    whenNotToUseVi: 'Không bao giờ coi nỗi đau mất mát tự nhiên là "suy nghĩ sai lệch cần sửa".',
    whenNotToUseEn: 'Never treat natural grief over a real loss as a cognitive distortion to be "fixed".',
    interactivePromptsVi: [
      'Mất mát thực tế nào đang làm trái tim bạn đau buồn lúc này?',
      'Nỗi buồn ấy nói lên điều gì đẹp đẽ về tình yêu thương và những gì bạn trân quý?',
    ],
    interactivePromptsEn: [
      'What real-world loss or transition are you grieving right now?',
      'What does this sadness honor about what you love and value deeply?',
    ],
  },
  {
    id: 'tool-23-adhd-rsd-thought-detector',
    number: 23,
    slug: 'adhd-rsd-thought-detector',
    category: 'work-burnout',
    titleVi: '23. Giải mã Nhạy cảm Bị Từ chối & Quá tải Điều hành (ADHD / RSD Thought Detector)',
    titleEn: '23. ADHD Executive Dysfunction & Rejection Sensitive Dysphoria (RSD) Reframer',
    conditionFocus: 'universal',
    whenToUseVi: 'Khi một tin nhắn ngắn gọn của sếp/bạn bè kích hoạt cơn đau bị từ chối (RSD) hoặc tê liệt bắt đầu việc.',
    whenToUseEn: 'When a brief message triggers intense Rejection Sensitive Dysphoria (RSD) or task paralysis.',
    whenNotToUseVi: 'Không dùng nhãn "lười biếng" cho sự quá tải chức năng điều hành.',
    whenNotToUseEn: 'Never label executive dysfunction as moral laziness.',
    interactivePromptsVi: [
      'Tín hiệu mơ hồ nào (tin nhắn ngắn, nét mặt) vừa kích hoạt cảm giác bị từ chối trong bạn?',
      'Có 3 lý do trung tính nào giải thích cho phản ứng của họ mà không liên quan đến việc ghét bạn?',
    ],
    interactivePromptsEn: [
      'What ambiguous cue (a short text, a pause) triggered the Rejection Sensitive Dysphoria surge?',
      'What are 3 neutral explanations for their brevity that have nothing to do with rejecting you?',
    ],
  },
  {
    id: 'tool-24-relationship-anxiety-downward-arrow',
    number: 24,
    slug: 'relationship-anxiety-downward-arrow',
    category: 'anxiety-erp',
    titleVi: '24. Mũi tên Đi xuống cho Lo âu Quan hệ & Sợ Bỏ rơi (Relationship Downward Arrow)',
    titleEn: '24. Interpersonal Downward Arrow (Relationship Anxiety & Abandonment)',
    conditionFocus: 'anxiety',
    whenToUseVi: 'Khi bạn lo âu quá mức trong tình cảm, sợ xung đột hoặc sợ bị bỏ rơi nếu nói ra nhu cầu thật.',
    whenToUseEn: 'When relationship anxiety, conflict phobia, or fear of abandonment silences your authentic needs.',
    whenNotToUseVi: 'Không áp dụng nếu mối quan hệ có yếu tố bạo hành thể chất/tinh thần nguy hiểm.',
    whenNotToUseEn: 'Do not apply to stay in a physically or emotionally dangerous relationship.',
    interactivePromptsVi: [
      'Nếu bạn nói thật suy nghĩ của mình với người ấy, bạn sợ điều gì sẽ xảy ra tiếp theo?',
      'Niềm tin ẩn sâu ("Đã yêu nhau thì không bao giờ bất đồng" hay "Tôi không thể sống thiếu họ") là gì?',
    ],
    interactivePromptsEn: [
      'If you expressed your honest feeling to your partner, what do you fear would happen next?',
      'Which interpersonal belief ("Conflict Phobia" or "Love Addiction") is operating underneath?',
    ],
  },
  {
    id: 'tool-25-anti-procrastination-5min-starter',
    number: 25,
    slug: 'anti-procrastination-5min-starter',
    category: 'depression-team-cbt',
    titleVi: '25. Bảng Chống Trì hoãn & Khởi động 5 Phút (Anti-Procrastination 5-Min Sheet)',
    titleEn: '25. TEAM-CBT Anti-Procrastination 5-Minute Starter Sheet',
    conditionFocus: 'depression',
    whenToUseVi: 'Khi một công việc trông như quả núi khổng lồ khiến bạn tê liệt không thể bắt đầu.',
    whenToUseEn: 'When an overwhelming task triggers avoidance and predictions of 95% misery.',
    whenNotToUseVi: 'Không dùng khi cơ thể đang cần nghỉ ngơi y khoa (hãy chạy Rest Check trước).',
    whenNotToUseEn: 'Check the Rest Check gate first if you are biologically ill.',
    interactivePromptsVi: [
      'Chia công việc lớn thành 1 bước siêu nhỏ chỉ làm trong 5 phút:',
      'Dự đoán Độ khó (0-100%) và Độ hài lòng (0-100%) trước khi làm 5 phút vs. Thực tế sau 5 phút:',
    ],
    interactivePromptsEn: [
      'Break the daunting task into one tiny 5-minute micro-step:',
      'Rate Predicted Difficulty (0-100%) & Predicted Satisfaction (0-100%) vs. Actual after 5 minutes:',
    ],
  },
  {
    id: 'tool-26-pleasure-predicting-mp-sheet',
    number: 26,
    slug: 'pleasure-predicting-mp-sheet',
    category: 'depression-team-cbt',
    titleVi: '26. Bảng Dự đoán Niềm vui & Điểm M/P (Pleasure-Predicting Mastery & Pleasure Sheet)',
    titleEn: '26. TEAM-CBT Pleasure-Predicting Sheet (Mastery & Pleasure M/P)',
    conditionFocus: 'depression',
    whenToUseVi: 'Khi trầm cảm hoặc mất hứng thú (Anhedonia) thì thầm: "Làm việc đó cũng chẳng vui gì đâu, đừng làm".',
    whenToUseEn: 'When depressive anhedonia predicts "Nothing will feel rewarding anyway" or "I can’t be happy alone".',
    whenNotToUseVi: 'Không dùng để lên lịch hoạt động kích thích mạnh vào ban đêm ở người bệnh Lưỡng cực.',
    whenNotToUseEn: 'Do not schedule late-night high-stimulation activities during Bipolar hypomania.',
    interactivePromptsVi: [
      'Hoạt động nhỏ bạn định thử là gì và bạn dự đoán độ Hài lòng/Làm chủ (0-100%) là bao nhiêu?',
      'Sau khi thực hiện, điểm Mastery (M 0-10) và Pleasure (P 0-10) thực tế chênh lệch thế nào so với dự đoán?',
    ],
    interactivePromptsEn: [
      'What small activity will you test, and what is your Predicted Satisfaction (0-100%)?',
      'After doing it, what were your Actual Mastery (M 0-10) & Pleasure (P 0-10) scores vs. prediction?',
    ],
  },
  {
    id: 'tool-27-paradoxical-agenda-setting',
    number: 27,
    slug: 'paradoxical-agenda-setting',
    category: 'depression-team-cbt',
    titleVi: '27. Thiết lập Mục tiêu Nghịch lý & Chiết áp Nỗi buồn (Paradoxical Agenda Setting)',
    titleEn: '27. TEAM-CBT Paradoxical Agenda Setting (Magic Button & Magic Dial)',
    conditionFocus: 'depression',
    whenToUseVi: 'TRƯỚC khi phản biện suy nghĩ: giúp tôn trọng các giá trị tốt đẹp ẩn sau nỗi buồn, lo âu hay tự trách.',
    whenToUseEn: 'BEFORE challenging thoughts: honors what your depression, anxiety, or guilt says that is noble and sweet about you.',
    whenNotToUseVi: 'Tuyệt đối KHÔNG dùng kỹ thuật tìm lợi ích của triệu chứng cho ý nghĩ tự sát hoặc tự hại.',
    whenNotToUseEn: 'NEVER run paradoxical agenda setting on suicidal or self-harm urges.',
    interactivePromptsVi: [
      'Nếu bấm "Nút bấm Phép thuật" để xóa sạch 100% nỗi lo/tự trách này ngay lập tức, bạn có sợ mất đi điều gì quý giá không?',
      'Cảm xúc này đang chứng minh phẩm chất tốt đẹp nào của bạn? Bạn muốn vặn "Chiết áp" xuống mức mấy phần trăm (ví dụ 20%) thay vì 0%?',
    ],
    interactivePromptsEn: [
      'If you pressed a Magic Button to erase 100% of this anxiety/guilt forever, what valuable quality might you lose?',
      'What does this emotion prove that is noble and caring about you? To what level (e.g., 20%) would you turn the Magic Dial?',
    ],
  },
  {
    id: 'tool-28-externalization-of-voices',
    number: 28,
    slug: 'externalization-of-voices',
    category: 'depression-team-cbt',
    titleVi: '28. Phân vai Đối thoại Hai Giọng nói Nội tâm (Externalization of Voices)',
    titleEn: '28. TEAM-CBT Externalization of Voices Roleplay',
    conditionFocus: 'depression',
    whenToUseVi: 'Khi lý trí hiểu lời khuyên nhưng tiếng nói tự chỉ trích trong đầu vẫn áp đảo bạn.',
    whenToUseEn: 'When you intellectually understand a reframe, but the harsh inner critic still overwhelms you emotionally.',
    whenNotToUseVi: 'Không dùng nếu người bệnh đang có ảo thanh loạn thần thực sự (Layer 1 Psychosis Stop).',
    whenNotToUseEn: 'Do not use if experiencing psychotic auditory hallucinations (Layer 1 Safety Stop).',
    interactivePromptsVi: [
      'Giọng Tự chỉ trích (Negative Voice) đang tấn công bạn bằng câu nói nào?',
      'Hãy đáp trả từ Giọng Tự bảo vệ (Self-Defense Voice) bằng cả3 vũ khí: Tự chấp nhận + Thấu cảm (Disarming) + Sự thật khách quan:',
    ],
    interactivePromptsEn: [
      'What exact accusation is the Negative Inner Critic throwing at you?',
      'Respond from your Compassionate Self-Defense Voice combining Acceptance + Disarming + Factual Truth:',
    ],
  },
  {
    id: 'tool-29-double-standard-friend-roleplay',
    number: 29,
    slug: 'double-standard-friend-roleplay',
    category: 'core-cbt',
    titleVi: '29. Kỹ thuật Tiêu chuẩn Kép / Lời khuyên cho Bạn thân (Double-Standard Technique)',
    titleEn: '29. Double-Standard Technique (Compassionate Dear Friend Roleplay)',
    conditionFocus: 'universal',
    whenToUseVi: 'Khi bạn đối xử với bản thân khắc nghiệt gấp 10 lần cách bạn đối xử với một người bạn thân.',
    whenToUseEn: 'When you judge yourself by a harsh, unforgiving standard you would never apply to a dear friend.',
    whenNotToUseVi: 'Không có chống chỉ định; đây là kỹ thuật nhẹ nhàng và hiệu quả nhất trong CBT.',
    whenNotToUseEn: 'Safe and universally effective across anxiety and depression.',
    interactivePromptsVi: [
      'Nếu một người bạn thân thiết nhất gặp đúng hoàn cảnh và lỗi lầm này, bạn có mắng họ như đang mắng mình không?',
      'Hãy viết nguyên văn lời ấm áp, công bằng mà bạn sẽ nói với người bạn thân ấy rồi tặng lại cho chính mình:',
    ],
    interactivePromptsEn: [
      'If a dear friend came to you with this exact struggle or mistake, would you attack them the way you are attacking yourself?',
      'Write the exact warm, truthful words you would say to your friend—and direct them to yourself:',
    ],
  },
  {
    id: 'tool-30-feared-fantasy',
    number: 30,
    slug: 'feared-fantasy',
    category: 'anxiety-erp',
    titleVi: '30. Đối diện Cơn Ác mộng Tưởng tượng (TEAM-CBT Feared Fantasy)',
    titleEn: '30. TEAM-CBT Feared Fantasy Courtroom Roleplay',
    conditionFocus: 'anxiety',
    whenToUseVi: 'Khi nỗi sợ bị phán xét phi thực tế ("Họ sẽ nghĩ tôi ngu ngốc nhất thế giới") làm bạn tê liệt.',
    whenToUseEn: 'When an exaggerated social judgment fantasy paralyzes you and needs playful paradoxical exposure.',
    whenNotToUseVi: 'Chỉ dùng khi người dùng sẵn sàng; không dùng trong khủng hoảng hoặc bạo hành thực tế.',
    whenNotToUseEn: 'Only use when ready for paradoxical humor/exposure; never for real abuse.',
    interactivePromptsVi: [
      'Trong cơn ác mộng xã hội phóng đại nhất của bạn, người phán xét sẽ nói câu gì vô lý tới mức nào?',
      'Khi đối diện trực tiếp với câu phán xét phóng đại đó bằng sự tự chấp nhận bình thản, nỗi sợ giảm đi bao nhiêu?',
    ],
    interactivePromptsEn: [
      'In your wildest feared social fantasy, what absurdly exaggerated criticism do you imagine them saying?',
      'When you face that absurd critic with calm self-acceptance and disarming, how does the fear shift?',
    ],
  },
  {
    id: 'tool-31-dbt-radical-acceptance-urge-surfing',
    number: 31,
    slug: 'dbt-radical-acceptance-urge-surfing',
    category: 'dbt-regulation',
    titleVi: '31. Chấp nhận Triệt để & Lướt sóng Cơn thúc đẩy 90 Giây (Radical Acceptance & Urge Surfing)',
    titleEn: '31. DBT Radical Acceptance & 90-Second Adrenaline Urge Surfing',
    conditionFocus: 'anxiety',
    whenToUseVi: 'Khi một sự thật đã xảy ra không thể đảo ngược hoặc khi cơn sóng lo âu/thúc đẩy dâng cao.',
    whenToUseEn: 'When fighting an unchangeable reality causes secondary suffering, or an urge/anxiety wave peaks.',
    whenNotToUseVi: 'Chấp nhận thực tại KHÔNG có nghĩa là tán thành sự bất công hay từ bỏ việc bảo vệ ranh giới.',
    whenNotToUseEn: 'Radical Acceptance does NOT mean approving of mistreatment or giving up healthy boundaries.',
    interactivePromptsVi: [
      'Sự thật khách quan nào đã xảy ra mà việc chống cự ("Lẽ ra không được thế này!") chỉ làm bạn đau gấp đôi?',
      'Hãy quan sát cơn sóng cảm xúc trong cơ thể suốt 90 giây như người lướt sóng mà không làm theo xung động:',
    ],
    interactivePromptsEn: [
      'What unchangeable fact has occurred where fighting reality ("It shouldn’t be this way!") creates secondary suffering?',
      'Observe the physical sensation wave for 90 seconds with Half-Smile & Willing Hands without acting on the urge:',
    ],
  },
  {
    id: 'tool-32-dbt-abc-please-checklist',
    number: 32,
    slug: 'dbt-abc-please-checklist',
    category: 'dbt-regulation',
    titleVi: '32. Bảng Kiểm Sức đề kháng Cảm xúc Hàng ngày (DBT ABC PLEASE Checklist)',
    titleEn: '32. DBT ABC PLEASE Daily Emotional Vulnerability & Resilience Checklist',
    conditionFocus: 'depression',
    whenToUseVi: 'Hàng ngày để củng cố nền tảng sinh học (ngủ, ăn, thuốc, vận động) và tích lũy cảm xúc tích cực.',
    whenToUseEn: 'Daily to reduce biological vulnerability to emotion mind and accumulate mastery and positive moments.',
    whenNotToUseVi: 'Ở chế độ Low-Energy Depression (Mood <= -3), chỉ cần chọn 1 mục nhỏ nhất thay vì áp lực đủ 8 mục.',
    whenNotToUseEn: 'In Low-Energy Depression mode (Mood <= -3), celebrate completing just 1 micro-pillar.',
    interactivePromptsVi: [
      'Hôm nay bạn đã chăm sóc yếu tố sinh học PLEASE nào (Thuốc/Sức khỏe, Ăn uống, Tránh chất kích thích, Giấc ngủ, Vận động nhẹ)?',
      '1 hành động tích lũy niềm vui nhỏ (A) hoặc làm chủ (B) bạn có thể làm trong 5 phút tới là gì?',
    ],
    interactivePromptsEn: [
      'Which PLEASE biological pillars (Physical illness/meds, Eating, Avoiding substances, Sleep, Exercise) are supported today?',
      'What 5-minute Accumulate Positive (A) or Build Mastery (B) action can you do today?',
    ],
  },
  {
    id: 'tool-33-dbt-accepts-5senses-self-soothe',
    number: 33,
    slug: 'dbt-accepts-5senses-self-soothe',
    category: 'dbt-regulation',
    titleVi: '33. Thẻ Đánh lạc hướng Lành mạnh & Xoa dịu 5 Giác quan (DBT ACCEPTS & Self-Soothe)',
    titleEn: '33. DBT ACCEPTS Distraction & 5-Senses Self-Soothe Generator',
    conditionFocus: 'depression',
    whenToUseVi: 'Khi cảm giác trống rỗng cấp tính, đau khổ hoặc nghiền ngẫm tiêu cực chưa thể giải quyết ngay lúc này.',
    whenToUseEn: 'When acute emotional pain, emptiness, or rumination cannot be solved immediately and needs safe soothing.',
    whenNotToUseVi: 'Đánh lạc hướng ngắn hạn để qua cơn bão cảm xúc, không dùng để né tránh vĩnh viễn.',
    whenNotToUseEn: 'Use for short-term distress survival, not permanent emotional suppression.',
    interactivePromptsVi: [
      'Chọn 1 chữ cái trong ACCEPTS (Activities, Contributing, Comparisons, Emotions, Pushing away, Thoughts, Sensations):',
      'Chọn 1 giác quan (Thị giác, Thính giác, Khứu giác, Vị giác, Xúc giác) để tự xoa dịu cơ thể ngay lúc này:',
    ],
    interactivePromptsEn: [
      'Choose 1 ACCEPTS distraction skill (Activities, Contributing, Comparisons, Emotions, Pushing away, Thoughts, Sensations):',
      'Choose 1 of your 5 Senses (Vision, Hearing, Smell, Taste, Touch) to gently soothe your nervous system now:',
    ],
  },
  {
    id: 'tool-34-bipolar-positive-distortion-devils-advocate',
    number: 34,
    slug: 'bipolar-positive-distortion-devils-advocate',
    category: 'bipolar-ipsrt',
    titleVi: '34. Phản biện Hưng cảm Nhẹ & Nhận diện Biến dạng Dương tính (Bipolar Devil’s Advocate)',
    titleEn: '34. Bipolar Positive Distortion Checker & Devil’s Advocate',
    conditionFocus: 'bipolar',
    whenToUseVi: 'Khi khí sắc tăng cao (Mood >= +2), ngủ ít mà thấy tràn trề năng lượng, có ý tưởng lớn muốn làm ngay.',
    whenToUseEn: 'When mood is elevated (Mood >= +2) with reduced sleep need and urgent "zero-risk genius" ideas.',
    whenNotToUseVi: 'Nếu có hoang tưởng loạn thần hoặc mất ngủ trắng đêm nhiều ngày, kích hoạt ngay Safety Stop liên hệ bác sĩ.',
    whenNotToUseEn: 'If acute mania with psychosis or multi-day total sleeplessness is present, trigger immediate medical Safety Stop.',
    interactivePromptsVi: [
      'Ý tưởng hoặc kế hoạch nào đang khiến bạn thấy "chắc chắn thắng 100%, không thể chờ tới ngày mai"?',
      'Đóng vai Devil’s Advocate (Người phản biện tỉnh táo): Đâu là 2 rủi ro tài chính/sức khỏe bị dopamine che khuất?',
    ],
    interactivePromptsEn: [
      'What exciting plan or decision feels "100% zero-risk and too urgent to wait until tomorrow"?',
      'Play Devil’s Advocate: What 2 financial, career, or health blind spots could elevated dopamine be hiding?',
    ],
  },
  {
    id: 'tool-35-bipolar-48h-impulse-pros-cons',
    number: 35,
    slug: 'bipolar-48h-impulse-pros-cons',
    category: 'bipolar-ipsrt',
    titleVi: '35. Ma trận Lợi - Hại Khoang Trì hoãn Quyết định 48 Giờ (Bipolar 48h Impulse Pros & Cons)',
    titleEn: '35. Bipolar 48-Hour Impulse Vault & Crisis Pros/Cons Matrix',
    conditionFocus: 'bipolar',
    whenToUseVi: 'Trước khi chi tiêu lớn, đầu tư, nộp đơn nghỉ việc, bắt đầu dự án lớn hoặc nhắn tin bốc đồng lúc nửa đêm.',
    whenToUseEn: 'Before major spending, investing, quitting a job, launching a project, or sending impulsive late-night messages.',
    whenNotToUseVi: 'Luôn khóa tối thiểu 48 giờ và kiểm chứng với 2 người tin cậy trong Giao ước Ulysses khi khí sắc >= +2.',
    whenNotToUseEn: 'Enforce the full 48-hour cool-down and Two-Person Reality Check whenever mood polarity >= +2.',
    interactivePromptsVi: [
      'Quyết định lớn nào bạn đang muốn thực hiện ngay lập tức và chi phí/tác động của nó là bao nhiêu?',
      'So sánh Lợi/Hại của việc Làm ngay trong đêm nay vs. Đợi đủ 48 giờ và ngủ đủ 2 đêm:',
    ],
    interactivePromptsEn: [
      'What high-stakes impulse do you want to act on right now, and what is its financial/life impact?',
      'Compare Pros & Cons of Acting Impulsively Tonight vs. Locking in the 48-Hour Vault and sleeping 2 nights:',
    ],
  },
  {
    id: 'tool-36-bipolar-medication-adherence-cost-benefit',
    number: 36,
    slug: 'bipolar-medication-adherence-cost-benefit',
    category: 'bipolar-ipsrt',
    titleVi: '36. Phân tích Lợi - Hại Tuân thủ Thuốc Ổn định Khí sắc (Bipolar Medication Adherence CBT)',
    titleEn: '36. Bipolar Medication Adherence Cost-Benefit & IPSRT Shield',
    conditionFocus: 'bipolar',
    whenToUseVi: 'Khi xuất hiện suy nghĩ "Tôi khỏi hẳn rồi không cần uống thuốc nữa" hoặc muốn tự ý bỏ thuốc vì nhớ cảm giác hưng phấn.',
    whenToUseEn: 'When thoughts like "I feel great so I’m cured and can stop my mood stabilizer" or missing hypomania arise.',
    whenNotToUseVi: 'Ứng dụng tuyệt đối không kê đơn hay đổi liều; mọi điều chỉnh thuốc phải trao đổi trực tiếp với bác sĩ tâm thần.',
    whenNotToUseEn: 'Never alters prescriptions; any dosage or medication question must be discussed directly with your psychiatrist.',
    interactivePromptsVi: [
      'Suy nghĩ hoặc tác dụng phụ nào đang khiến bạn muốn bỏ hoặc tự ý ngưng thuốc ổn định khí sắc?',
      'Nhìn lại lịch sử các đợt tái phát trước đây: Cái giá của việc tự ý ngưng thuốc đột ngột là gì, và câu hỏi nào bạn sẽ ghi lại để hỏi bác sĩ?',
    ],
    interactivePromptsEn: [
      'What thought or side-effect frustration is tempting you to skip or stop your prescribed mood stabilizer?',
      'Looking at past relapse history: What are the risks of abrupt discontinuation, and what specific question will you bring to your psychiatrist?',
    ],
  },
];

/**
 * Helper to look up a tool from CBT_36_TOOLS_CATALOG by slug, id, or number
 */
export function getCbt36ToolBySlugOrId(toolSlugOrId: string): Cbt36ToolDefinition {
  const normalized = (toolSlugOrId ?? '').trim().toLowerCase();
  const exact = CBT_36_TOOLS_CATALOG.find(
    (t) =>
      t.slug.toLowerCase() === normalized ||
      t.id.toLowerCase() === normalized ||
      `tool-${t.number}` === normalized ||
      String(t.number) === normalized,
  );
  if (exact) return exact;

  const partial = CBT_36_TOOLS_CATALOG.find(
    (t) =>
      t.slug.toLowerCase().includes(normalized) ||
      normalized.includes(t.slug.toLowerCase()) ||
      t.titleEn.toLowerCase().includes(normalized) ||
      t.titleVi.toLowerCase().includes(normalized),
  );
  return partial ?? CBT_36_TOOLS_CATALOG[0];
}

/**
 * Deterministic 0ms Execution Engine for all 36 Interactive CBT, TEAM-CBT, DBT & Bipolar Tools
 */
export function runInteractiveToolkitExercise(
  toolSlug: string,
  userInput: string,
  context?: InteractiveToolkitContext,
): InteractiveToolkitAnalysisResult {
  const tool = getCbt36ToolBySlugOrId(toolSlug);
  const cleanInput = (userInput ?? '').trim();
  const moodPolarity = context?.moodPolarity ?? 0;
  const intensity = context?.intensity ?? 4;

  // 1. Always run the 4-Layer Safety & Crisis Gate first (0ms)
  const safetyEvaluation = evaluateFourLayerSafety({
    text: cleanInput,
    preIntensity: intensity,
    moodPolarity,
  });

  // 2. Run Deterministic Bilingual Pattern Detection (Negative, Positive, SDBs, Safety Behaviors)
  const detectedPatterns = analyzeClinicalText(cleanInput);

  // If 4-Layer Safety blocks CBT (crisis, real-world danger, or acute distress >= 8/10), return safety-first guidance
  if (!safetyEvaluation.safeToProceedWithCbt) {
    return {
      toolId: tool.id,
      toolNumber: tool.number,
      toolSlug: tool.slug,
      category: tool.category,
      conditionFocus: tool.conditionFocus,
      titleVi: tool.titleVi,
      titleEn: tool.titleEn,
      userInput: cleanInput,
      executionLatencyMs: 0,
      safetyEvaluation,
      safeToProceed: false,
      detectedPatterns,
      instantAnalysisVi: safetyEvaluation.messageVi,
      instantAnalysisEn: safetyEvaluation.messageEn,
      guidedReframeVi:
        safetyEvaluation.recommendedOutcome === 'justified-exit'
          ? 'Không chất vấn hay phản biện suy nghĩ trước nguy hiểm thực tế. Ưu tiên tuyệt đối sự an toàn thể chất của bạn.'
          : safetyEvaluation.recommendedTechnique === 'tipp'
            ? 'Tạm dừng phân tích nhận thức (Socratic Pushback = OFF). Chuyển sang kỹ năng sinh lý DBT TIPP (Nhịp thở 4-6 / Nước lạnh có sàng lọc y khoa).'
            : 'Dừng toàn bộ bài tập nhận thức (Safety Stop). Kết nối ngay đường dây nóng khủng hoảng và người liên hệ khẩn cấp.',
      guidedReframeEn:
        safetyEvaluation.recommendedOutcome === 'justified-exit'
          ? 'Do not challenge thoughts during real-world physical danger. Prioritize physical safety immediately.'
          : safetyEvaluation.recommendedTechnique === 'tipp'
            ? 'Pause cognitive restructuring (Socratic Pushback = OFF). Switch immediately to DBT TIPP physiological regulation.'
            : 'Safety Stop activated. All cognitive exercises paused to display crisis hotlines and trusted safety contacts.',
      nextActionStepVi:
        safetyEvaluation.recommendedTechnique === 'tipp'
          ? 'Thực hiện 6 nhịp thở chậm 4 giây hít vào - 6 giây thở ra để kích hoạt thần kinh phế vị.'
          : 'Gọi ngay Đường dây nóng Ngày Mai (096 306 1414) hoặc Cấp cứu 115 / 988.',
      nextActionStepEn:
        safetyEvaluation.recommendedTechnique === 'tipp'
          ? 'Complete 6 slow paced breaths (4s inhale, 6s exhale) to engage the parasympathetic vagal brake.'
          : 'Contact crisis support immediately (096 306 1414 in Vietnam / 115 / 988 Lifeline).',
      clinicalGuardrailNoteVi: 'Cổng An toàn 4 Lớp đã can thiệp ưu tiên bảo vệ người dùng (Pushback = OFF).',
      clinicalGuardrailNoteEn: '4-Layer Safety Gate override active (Pushback = OFF).',
    };
  }

  // 3. Build rich deterministic analysis summaries from detected patterns + tool specialty
  const negNamesVi = detectedPatterns.negativeDistortions.map((d) => d.nameVi);
  const negNamesEn = detectedPatterns.negativeDistortions.map((d) => d.nameEn);
  const posNamesVi = detectedPatterns.positiveDistortions.map((d) => d.nameVi);
  const posNamesEn = detectedPatterns.positiveDistortions.map((d) => d.nameEn);
  const sdbNamesVi = detectedPatterns.selfDefeatingBeliefs.map((d) => d.nameVi);
  const sdbNamesEn = detectedPatterns.selfDefeatingBeliefs.map((d) => d.nameEn);
  const sbNamesVi = detectedPatterns.safetyBehaviors.map((d) => d.nameVi);
  const sbNamesEn = detectedPatterns.safetyBehaviors.map((d) => d.nameEn);

  const primaryReframeVi =
    detectedPatterns.positiveDistortions[0]?.clinicalReframeVi ??
    detectedPatterns.negativeDistortions[0]?.clinicalReframeVi ??
    detectedPatterns.selfDefeatingBeliefs[0]?.clinicalReframeVi ??
    detectedPatterns.safetyBehaviors[0]?.clinicalReframeVi;

  const primaryReframeEn =
    detectedPatterns.positiveDistortions[0]?.clinicalReframeEn ??
    detectedPatterns.negativeDistortions[0]?.clinicalReframeEn ??
    detectedPatterns.selfDefeatingBeliefs[0]?.clinicalReframeEn ??
    detectedPatterns.safetyBehaviors[0]?.clinicalReframeEn;

  const patternSummaryVi = [
    negNamesVi.length > 0 ? `Biến dạng âm tính: ${negNamesVi.join(', ')}` : '',
    posNamesVi.length > 0 ? `Biến dạng dương tính (Hưng cảm): ${posNamesVi.join(', ')}` : '',
    sdbNamesVi.length > 0 ? `Niềm tin tự hủy hoại (SDB): ${sdbNamesVi.join(', ')}` : '',
    sbNamesVi.length > 0 ? `Hành vi an toàn ngầm: ${sbNamesVi.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join(' | ');

  const patternSummaryEn = [
    negNamesEn.length > 0 ? `Negative Distortions: ${negNamesEn.join(', ')}` : '',
    posNamesEn.length > 0 ? `Bipolar Positive Distortions: ${posNamesEn.join(', ')}` : '',
    sdbNamesEn.length > 0 ? `Self-Defeating Beliefs (SDB): ${sdbNamesEn.join(', ')}` : '',
    sbNamesEn.length > 0 ? `Safety Behaviors: ${sbNamesEn.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join(' | ');

  // 4. Tool-family specialized deterministic clinical framing
  let instantAnalysisVi = patternSummaryVi
    ? `[Phân tích 0ms - ${tool.titleVi}] Phát hiện: ${patternSummaryVi}.`
    : `[Phân tích 0ms - ${tool.titleVi}] Đã ghi nhận dữ kiện cho bài tập "${tool.slug}".`;
  let instantAnalysisEn = patternSummaryEn
    ? `[0ms Analysis - ${tool.titleEn}] Detected: ${patternSummaryEn}.`
    : `[0ms Analysis - ${tool.titleEn}] Captured clinical input for "${tool.slug}".`;

  let guidedReframeVi =
    primaryReframeVi ??
    'Hãy tách biệt cảm xúc có thật (luôn cần được thấu cảm) khỏi những dự đoán tuyệt đối hóa chưa được kiểm chứng.';
  let guidedReframeEn =
    primaryReframeEn ??
    'Separate valid human feelings (which always deserve empathy) from untested absolute predictions.';

  let nextActionStepVi = tool.interactivePromptsVi[0];
  let nextActionStepEn = tool.interactivePromptsEn[0];
  let clinicalGuardrailNoteVi = `Áp dụng đúng chỉ định: ${tool.whenToUseVi} | Lưu ý: ${tool.whenNotToUseVi}`;
  let clinicalGuardrailNoteEn = `Clinical indication: ${tool.whenToUseEn} | Guardrail: ${tool.whenNotToUseEn}`;

  switch (tool.slug) {
    case 'paradoxical-agenda-setting':
      guidedReframeVi =
        'TEAM-CBT Paradoxical Agenda Setting: Đừng vội ép mình xóa bỏ cảm xúc này. Hãy hỏi: "Nỗi lo âu hay tự trách này đang nói lên phẩm chất tốt đẹp, có trách nhiệm và biết quan tâm nào của bạn?" Khi trân trọng giá trị cốt lõi đó, bạn có thể vặn Chiết áp (Magic Dial) xuống mức vừa đủ (20%) thay vì tự dằn vặt ở mức 95%.';
      guidedReframeEn =
        'TEAM-CBT Paradoxical Agenda Setting: Do not rush to erase this emotion. Ask: "What does this anxiety or guilt reveal that is caring, conscientious, and noble about my core values?" Honoring that value lets you turn the Magic Dial down to a healthy 20% instead of suffering at 95%.';
      break;

    case 'pleasure-predicting-mp-sheet':
      guidedReframeVi =
        'Bảng Dự đoán Niềm vui (Mastery & Pleasure M/P): Trầm cảm thường dự đoán "Làm việc này chỉ đạt 10% niềm vui". Hãy thực hiện một bước nhỏ 10 phút rồi chấm riêng điểm Làm chủ (M 0-10) và Hài lòng (P 0-10) thực tế để điều chỉnh sai số dự đoán của não bộ.';
      guidedReframeEn =
        'Pleasure-Predicting (Mastery & Pleasure M/P) Sheet: Depression predicts "This activity will yield 10% satisfaction". Test a 10-minute micro-activity and score actual Mastery (M 0-10) and Pleasure (P 0-10) separately to recalibrate your reward prediction error.';
      break;

    case 'anti-procrastination-5min-starter':
      guidedReframeVi =
        'Bảng Chống Trì hoãn 5 Phút: Khi nhìn cả công việc lớn, não bộ dự đoán Độ khó 90% và Hài lòng 10%. Hãy cắt nhỏ thành đúng 5 phút đầu tiên — bạn hoàn toàn có quyền dừng lại sau 5 phút nếu muốn.';
      guidedReframeEn =
        'Anti-Procrastination 5-Minute Starter: Viewing the whole mountain makes your brain predict 90% difficulty and 10% reward. Shrink the task to a single 5-minute step—with full permission to stop after 5 minutes.';
      break;

    case 'bipolar-positive-distortion-devils-advocate':
    case 'bipolar-48h-impulse-pros-cons':
      instantAnalysisVi =
        posNamesVi.length > 0
          ? `[Lá chắn Hưng cảm nhẹ - 0ms] Phát hiện Biến dạng Dương tính: ${posNamesVi.join(', ')}.`
          : `[Lá chắn Hưng cảm nhẹ - 0ms] Đang kích hoạt quy trình Devil's Advocate & Khoang Trì hoãn 48 Giờ.`;
      instantAnalysisEn =
        posNamesEn.length > 0
          ? `[Hypomania Guard - 0ms] Detected Bipolar Positive Distortions: ${posNamesEn.join(', ')}.`
          : `[Hypomania Guard - 0ms] Activating Devil's Advocate & 48-Hour Impulse Vault evaluation.`;
      guidedReframeVi =
        'Khi dopamine tăng cao hoặc khí sắc >= +2, cảm giác "cơ hội ngàn năm có một phải làm ngay trong đêm" là tín hiệu sinh học chứ không phải sự khẩn cấp thực tế. Một ý tưởng thực sự tốt sẽ vẫn còn nguyên giá trị sau 48 giờ và 2 đêm ngủ đủ 7 tiếng.';
      guidedReframeEn =
        'When dopamine is elevated or mood polarity >= +2, the feeling of "zero-risk urgency tonight" is a neurobiological surge rather than objective urgency. A genuinely sound decision will still be sound after a 48-hour cool-down and two full nights of sleep.';
      nextActionStepVi =
        'Khóa quyết định này vào Khoang Trì hoãn 48 Giờ và gửi yêu cầu Kiểm chứng Thực tế 2 Người (Two-Person Reality Check) trong Giao ước Ulysses.';
      nextActionStepEn =
        'Lock this decision in the 48-Hour Impulse Vault and trigger a Two-Person Reality Check with your Ulysses Contract contacts.';
      break;

    case 'bipolar-medication-adherence-cost-benefit':
      guidedReframeVi =
        'CBT Tuân thủ Thuốc Ổn định Khí sắc: Cảm giác "Tôi khỏe hẳn rồi nên không cần thuốc nữa" thường xuất hiện chính nhờ thuốc đang giữ nền khí sắc ổn định hoặc khi bắt đầu chớm lên pha hưng cảm nhẹ. Tuyệt đối không tự ý ngưng hoặc đổi liều thuốc — hãy ghi rõ tác dụng phụ để bàn trực tiếp với bác sĩ tâm thần.';
      guidedReframeEn =
        'Bipolar Medication Adherence CBT: The thought "I feel stable/energized so I don’t need my mood stabilizer anymore" often arises precisely because the medication is working or an early hypomanic shift is starting. Never stop or alter prescribed doses abruptly—log your questions for your psychiatrist.';
      break;

    case 'cbti-sleep-efficiency-calculator':
      guidedReframeVi =
        'Tính Hiệu suất Giấc ngủ CBT-I có Cổng Bảo vệ Lưỡng cực: Nếu bạn mất ngủ và thấy KIỆT SỨC vào ban ngày, CBT-I giúp gom thời gian nằm trên giường để tăng hiệu suất ngủ >= 85%. NHƯNG nếu bạn ngủ < 5 tiếng mà vẫn thấy DƯ THỪA NĂNG LƯỢNG / KHÔNG CẦN NGỦ, hệ thống nghiêm cấm hạn chế giấc ngủ để phòng ngừa kích hoạt cơn Hưng cảm.';
      guidedReframeEn =
        'CBT-I Sleep Efficiency with Bipolar Mania Safety Gate: If you experience insomnia with daytime exhaustion, CBT-I sleep window consolidation improves efficiency >= 85%. HOWEVER, if you sleep < 5h and feel a REDUCED NEED FOR SLEEP, CBT-I sleep restriction is strictly contraindicated to prevent triggering mania.';
      break;

    case 'dbt-radical-acceptance-urge-surfing':
      guidedReframeVi =
        'DBT Chấp nhận Triệt để & Lướt sóng 90 Giây: Đau đớn thực tế + Không chấp nhận ("Không được phép như vậy!") = Đau khổ kéo dài. Hãy thả lỏng bàn tay (Willing Hands), mỉm cười nhẹ (Half-Smile) và quan sát cơn sóng adrenaline tự dâng lên rồi rút xuống trong 90 giây mà không dùng hành vi an toàn.';
      guidedReframeEn =
        'DBT Radical Acceptance & 90-Second Urge Surfing: Pain + Non-Acceptance ("It shouldn’t be this way!") = Secondary Suffering. Adopt Willing Hands and a Half-Smile, riding the 90-second physiological adrenaline wave without acting on safety behaviors.';
      break;

    case 'dbt-abc-please-checklist':
    case 'dbt-accepts-5senses-self-soothe':
      guidedReframeVi =
        moodPolarity <= -3
          ? 'Chế độ Low-Energy Depression đang bật: Bạn không cần hoàn thành cả danh sách hôm nay. Hãy chọn đúng 1 bước nhỏ xoa dịu giác quan hoặc uống 1 cốc nước ấm — như vậy đã là chiến thắng.'
          : 'DBT ABC PLEASE & ACCEPTS: Củng cố nền tảng sinh học (Giấc ngủ, Ăn uống, Thuốc, Vận động nhẹ) và dùng 5 Giác quan tự xoa dịu để giảm tính dễ tổn thương cảm xúc.';
      guidedReframeEn =
        moodPolarity <= -3
          ? 'Low-Energy Depression Mode active: No pressure to complete the whole checklist. Pick just ONE micro self-soothe action or drink a glass of water—that counts as a full win today.'
          : 'DBT ABC PLEASE & ACCEPTS: Support your biological PLEASE foundation and use 5-Senses Self-Soothe to lower vulnerability to Emotion Mind.';
      break;

    case 'worry-box-postponement':
      guidedReframeVi =
        'Hộp Lo âu (Worry Box): Đã ghi nhận câu hỏi "Nhỡ đâu..." vào hộp lưu trữ an toàn đến khung giờ Lo âu Có Chủ đích (15 phút buổi chiều). Bây giờ bạn được tự do quay lại hiện tại bằng 5 giác quan.';
      guidedReframeEn =
        'Worry Box Postponement: Your "What if..." thought is safely deposited until your scheduled 15-minute afternoon Worry Window. You are free to return your attention to the present moment.';
      break;

    case 'double-standard-friend-roleplay':
    case 'externalization-of-voices':
    case 'shame-attacking-compassionate-reframe':
      guidedReframeVi =
        'Tiêu chuẩn Kép & Tự Bảo vệ Từ bi: Bạn sẽ không bao giờ mắng một người bạn thân đang đau khổ là "đồ vô dụng". Hãy dùng đúng giọng nói ấm áp, công bằng và tôn trọng phẩm giá đó để trò chuyện với chính mình.';
      guidedReframeEn =
        'Double-Standard & Compassionate Self-Defense: You would never tell a hurting friend that they are "worthless". Offer yourself the exact same fair, warm, evidence-based compassion.';
      break;

    default:
      break;
  }

  return {
    toolId: tool.id,
    toolNumber: tool.number,
    toolSlug: tool.slug,
    category: tool.category,
    conditionFocus: tool.conditionFocus,
    titleVi: tool.titleVi,
    titleEn: tool.titleEn,
    userInput: cleanInput,
    executionLatencyMs: 0,
    safetyEvaluation,
    safeToProceed: true,
    detectedPatterns,
    instantAnalysisVi,
    instantAnalysisEn,
    guidedReframeVi,
    guidedReframeEn,
    nextActionStepVi,
    nextActionStepEn,
    clinicalGuardrailNoteVi,
    clinicalGuardrailNoteEn,
  };
}

/**
 * CBT-I Sleep Efficiency Calculator with Mandatory Bipolar Mania Differential Safety Gate
 * - Never prescribes CBT-I sleep restriction if feltNeedForSleep is 'reduced_need' or 'no_need_at_all'
 *   because sleep restriction can precipitate mania in Bipolar Disorder!
 */
export function calculateCbtiSleepEfficiency(
  params: CbtiSleepEfficiencyInput,
): CbtiSleepEfficiencyResult {
  const safeTimeInBed = Math.max(1, params.timeInBedMinutes);
  const safeTotalSleep = Math.max(0, Math.min(params.totalSleepMinutes, safeTimeInBed));
  const wakeTimeInBedMinutes = Math.max(
    0,
    params.sleepOnsetLatencyMinutes + params.wakeAfterSleepOnsetMinutes,
  );
  const rawEfficiency = (safeTotalSleep / safeTimeInBed) * 100;
  const sleepEfficiencyPercent = Math.round(rawEfficiency * 10) / 10;

  // MANDATORY BIPOLAR MANIA DIFFERENTIAL SAFETY GATE
  if (
    params.feltNeedForSleep === 'reduced_need' ||
    params.feltNeedForSleep === 'no_need_at_all'
  ) {
    return {
      sleepEfficiencyPercent,
      wakeTimeInBedMinutes,
      sleepEfficiencyCategory: 'bipolar-mania-contraindication',
      bipolarManiaContraindicationTriggered: true,
      sleepRestrictionAllowed: false,
      hypomaniaGuardTriggered: true,
      recommendedTimeInBedMinutes: null,
      recommendationVi:
        'CHỐT CHẶN AN TOÀN LƯỠNG CỰC: Bạn đang ngủ ít nhưng cảm thấy giảm hoặc không có nhu cầu ngủ. Hệ thống TUYỆT ĐỐI KHÔNG áp dụng hạn chế giấc ngủ (CBT-I Sleep Restriction) vì có thể kích hoạt cơn Hưng cảm. Hãy ưu tiên nằm nghỉ trong phòng tối yên tĩnh (Dark Rest Therapy), giữ mốc giờ đi ngủ IPSRT và liên hệ bác sĩ tâm thần.',
      recommendationEn:
        'BIPOLAR MANIA SAFETY GATE: You reported short sleep with a reduced or absent need for sleep. CBT-I Sleep Restriction is STRICTLY CONTRAINDICATED because restricting time in bed can trigger a manic episode. Prioritize Dark Rest Therapy in a quiet dark room, protect your IPSRT bedtime anchor, and consult your psychiatrist.',
      safetyWarningVi:
        'Cảnh báo Tiền triệu Hưng cảm: Nghiêm cấm áp dụng CBT-I Sleep Restriction khi giảm nhu cầu ngủ.',
      safetyWarningEn:
        'Mania Prodrome Contraindication: CBT-I Sleep Restriction is blocked when feltNeedForSleep is reduced or absent.',
    };
  }

  // Standard CBT-I Sleep Window Calculation (minimum 300 minutes = 5.0 hours clinical safety floor)
  const recommendedWindow = Math.max(300, Math.min(540, Math.round(safeTotalSleep + 30)));

  if (sleepEfficiencyPercent >= 85) {
    return {
      sleepEfficiencyPercent,
      wakeTimeInBedMinutes,
      sleepEfficiencyCategory: 'optimal',
      bipolarManiaContraindicationTriggered: false,
      sleepRestrictionAllowed: true,
      hypomaniaGuardTriggered: false,
      recommendedTimeInBedMinutes: Math.min(540, Math.max(safeTimeInBed, recommendedWindow)),
      recommendationVi: `Hiệu suất giấc ngủ đạt ${sleepEfficiencyPercent}% (>= 85% — Tối ưu). Bạn có thể giữ nguyên khung giờ ngủ hiện tại hoặc mở rộng thêm 15 phút nằm trên giường nếu ban ngày vẫn còn buồn ngủ.`,
      recommendationEn: `Sleep Efficiency is ${sleepEfficiencyPercent}% (>= 85% — Optimal). Maintain your current consistent wake anchor or expand your sleep window by 15 minutes if daytime fatigue persists.`,
    };
  }

  if (sleepEfficiencyPercent >= 75) {
    return {
      sleepEfficiencyPercent,
      wakeTimeInBedMinutes,
      sleepEfficiencyCategory: 'mild-fragmentation',
      bipolarManiaContraindicationTriggered: false,
      sleepRestrictionAllowed: true,
      hypomaniaGuardTriggered: false,
      recommendedTimeInBedMinutes: recommendedWindow,
      recommendationVi: `Hiệu suất giấc ngủ đạt ${sleepEfficiencyPercent}% (75–84% — Phân mảnh nhẹ). Hãy áp dụng Kiểm soát Kích thích (Stimulus Control): chỉ lên giường khi buồn ngủ, rời giường nếu trằn trọc > 20 phút, và giữ khung giờ nằm trên giường khoảng ${recommendedWindow} phút (${(recommendedWindow / 60).toFixed(1)} giờ).`,
      recommendationEn: `Sleep Efficiency is ${sleepEfficiencyPercent}% (75–84% — Mild Fragmentation). Apply CBT-I Stimulus Control: use the bed only for sleep, get up for quiet reading if awake > 20 minutes, and target a sleep window of ${recommendedWindow} minutes (${(recommendedWindow / 60).toFixed(1)} hours).`,
    };
  }

  return {
    sleepEfficiencyPercent,
    wakeTimeInBedMinutes,
    sleepEfficiencyCategory: 'clinical-insomnia',
    bipolarManiaContraindicationTriggered: false,
    sleepRestrictionAllowed: true,
    hypomaniaGuardTriggered: false,
    recommendedTimeInBedMinutes: recommendedWindow,
    recommendationVi: `Hiệu suất giấc ngủ đạt ${sleepEfficiencyPercent}% (< 75% — Mất ngủ cần củng cố khung ngủ). Khuyến nghị CBT-I: thu gọn thời gian nằm trên giường xuống ${recommendedWindow} phút (${(recommendedWindow / 60).toFixed(1)} giờ, không bao giờ dưới 5 giờ) với giờ thức dậy cố định mỗi sáng để tái tạo áp lực ngủ tự nhiên.`,
    recommendationEn: `Sleep Efficiency is ${sleepEfficiencyPercent}% (< 75% — Clinical Insomnia Consolidation). CBT-I Recommendation: consolidate time in bed to ${recommendedWindow} minutes (${(recommendedWindow / 60).toFixed(1)} hours, minimum 5.0h safety floor) with a fixed morning wake anchor to rebuild homeostatic sleep drive.`,
  };
}

/**
 * DBT ABC PLEASE Daily Vulnerability Resilience Scorer & ACCEPTS + 5-Senses Self-Soothe Recommender
 */
export function evaluateDbtAbcPleaseAndAccepts(
  params: DbtAbcPleaseInput,
): DbtAcceptsAndSelfSoothePlan {
  const pillars: Array<{
    done: boolean;
    labelVi: string;
    labelEn: string;
  }> = [
    {
      done: params.accumulatedPositivesToday,
      labelVi: 'A - Tích lũy 1 khoảnh khắc tích cực nhỏ trong ngày (Accumulate Positives)',
      labelEn: 'A - Accumulate at least 1 small positive moment today',
    },
    {
      done: params.buildMasteryCompleted,
      labelVi: 'B - Làm 1 việc nhỏ tạo cảm giác làm chủ (Build Mastery)',
      labelEn: 'B - Build Mastery with 1 manageable daily task',
    },
    {
      done: params.copeAheadPrepared,
      labelVi: 'C - Chuẩn bị trước phương án ứng phó tình huống khó (Cope Ahead)',
      labelEn: 'C - Cope Ahead rehearsal for upcoming stressors',
    },
    {
      done: params.physicalIllnessTreated,
      labelVi: 'PL - Chăm sóc cơ thể & uống thuốc đúng giờ (Treat Physical Illness)',
      labelEn: 'PL - Treat Physical Illness and take prescribed medications on time',
    },
    {
      done: params.balancedEating,
      labelVi: 'E - Ăn uống cân bằng, không bỏ bữa (Balanced Eating)',
      labelEn: 'E - Balanced Eating (avoid skipping meals or blood-sugar crashes)',
    },
    {
      done: params.avoidedMoodAlteringSubstances,
      labelVi: 'A - Tránh rượu bia, chất kích thích và quá nhiều caffeine (Avoid Substances)',
      labelEn: 'A - Avoid mood-altering substances and excess late caffeine',
    },
    {
      done: params.balancedSleep,
      labelVi: 'S - Bảo vệ giấc ngủ đều đặn theo nhịp sinh học (Balanced Sleep)',
      labelEn: 'S - Balanced Sleep protecting circadian anchors',
    },
    {
      done: params.gotGentleExercise,
      labelVi: 'E - Vận động cơ thể nhẹ nhàng 10–20 phút (Gentle Exercise)',
      labelEn: 'E - Gentle Exercise or stretching for 10–20 minutes',
    },
  ];

  const completedPillarsCount = pillars.filter((p) => p.done).length;
  const resilienceScorePercent = Math.round((completedPillarsCount / 8) * 100);
  const missingVulnerabilityFactorsVi = pillars.filter((p) => !p.done).map((p) => p.labelVi);
  const missingVulnerabilityFactorsEn = pillars.filter((p) => !p.done).map((p) => p.labelEn);

  const moodPolarity = params.moodPolarity ?? 0;
  const emptinessIntensity = params.emptinessOrDepressionIntensity ?? 0;
  const lowEnergyDepressionModeActive = moodPolarity <= -3 || emptinessIntensity >= 7;

  const acceptsSkillsVi: Array<{ letter: string; skill: string; microAction: string }> = [
    {
      letter: 'A',
      skill: 'Activities (Hoạt động nhẹ)',
      microAction: lowEnergyDepressionModeActive
        ? 'Bước nhỏ 2 phút: Mở rèm cửa đón ánh sáng hoặc tưới 1 chậu cây nhỏ.'
        : 'Đi bộ chậm 10 phút, gấp quần áo hoặc nghe một tập podcast nhẹ nhàng.',
    },
    {
      letter: 'C',
      skill: 'Contributing (Đóng góp / Kết nối ấm áp)',
      microAction: 'Gửi 1 tin nhắn hỏi thăm ngắn hoặc thả tim/lời chúc tốt đẹp cho một người bạn.',
    },
    {
      letter: 'C',
      skill: 'Comparisons (So sánh với lúc đã từng vượt qua)',
      microAction: 'Nhớ lại một giai đoạn khó khăn trước đây mà bạn từng nghĩ không qua nổi nhưng đã kiên cường đi qua.',
    },
    {
      letter: 'E',
      skill: 'Emotions (Khơi gợi cảm xúc đối lập dịu dàng)',
      microAction: 'Xem một đoạn video hài hước nhẹ nhàng hoặc nghe bản nhạc gắn với kỷ niệm êm đềm.',
    },
    {
      letter: 'P',
      skill: 'Pushing Away (Tạm cất lên kệ)',
      microAction: 'Tưởng tượng đặt vấn đề chưa giải quyết được vào chiếc hộp gỗ trên kệ trong 1 giờ tới để cơ thể được nghỉ.',
    },
    {
      letter: 'T',
      skill: 'Thoughts (Chiếm chỗ tâm trí bằng đếm/đọc)',
      microAction: 'Đếm ngược từ 100 trừ đi 7 hoặc gọi tên 5 đồ vật màu xanh dương quanh phòng.',
    },
    {
      letter: 'S',
      skill: 'Sensations (Cảm giác sinh lý an toàn)',
      microAction: 'Cầm một cốc trà ấm bằng hai tay hoặc rửa mặt bằng nước mát.',
    },
  ];

  const acceptsSkillsEn: Array<{ letter: string; skill: string; microAction: string }> = [
    {
      letter: 'A',
      skill: 'Activities',
      microAction: lowEnergyDepressionModeActive
        ? '2-minute micro-step: Open the curtains for natural light or water one plant.'
        : 'Take a 10-minute gentle walk, tidy one small surface, or listen to a calm podcast.',
    },
    {
      letter: 'C',
      skill: 'Contributing',
      microAction: 'Send one brief, kind check-in message to a friend or family member.',
    },
    {
      letter: 'C',
      skill: 'Comparisons (Perspective on Past Resilience)',
      microAction: 'Recall a hard storm in the past that you survived despite feeling overwhelmed at the time.',
    },
    {
      letter: 'E',
      skill: 'Emotions (Generate Soothing Opposite Emotion)',
      microAction: 'Watch a comforting clip or play a song linked to a peaceful memory.',
    },
    {
      letter: 'P',
      skill: 'Pushing Away (Temporary Mental Shelf)',
      microAction: 'Visualize placing an unsolvable worry in a wooden box on a shelf for the next 60 minutes.',
    },
    {
      letter: 'T',
      skill: 'Thoughts (Neutral Cognitive Load)',
      microAction: 'Count backward from 100 by 7s or name 5 blue objects in your room.',
    },
    {
      letter: 'S',
      skill: 'Sensations',
      microAction: 'Hold a warm mug with both hands or splash cool water on your face.',
    },
  ];

  const fiveSensesSelfSootheVi: Array<{ sense: string; suggestion: string }> = [
    {
      sense: 'Thị giác (Vision)',
      suggestion: 'Nhìn ngắm tán cây xanh ngoài cửa sổ, ánh đèn vàng ấm áp hoặc một bức ảnh kỷ niệm bình yên.',
    },
    {
      sense: 'Thính giác (Hearing)',
      suggestion: 'Lắng nghe tiếng mưa rơi, tiếng sóng biển hoặc một bản nhạc không lời nhịp 60 BPM.',
    },
    {
      sense: 'Khứu giác (Smell)',
      suggestion: 'Hít thở hương tinh dầu oải hương, hương cam chanh, mùi trà thảo mộc hoặc mùi chăn gối sạch.',
    },
    {
      sense: 'Vị giác (Taste)',
      suggestion: 'Nhấp từng ngụm nhỏ nước ấm, trà hoa cúc hoặc một miếng sô-cô-la/trái cây và cảm nhận thật chậm.',
    },
    {
      sense: 'Xúc giác (Touch)',
      suggestion: 'Quấn một chiếc chăn mềm quanh vai, tắm nước ấm hoặc đặt bàn tay lên ngực cảm nhận hơi ấm cơ thể.',
    },
  ];

  const fiveSensesSelfSootheEn: Array<{ sense: string; suggestion: string }> = [
    {
      sense: 'Vision',
      suggestion: 'Look out at green trees, warm amber lighting, or a calming photograph.',
    },
    {
      sense: 'Hearing',
      suggestion: 'Listen to rainfall, ocean waves, or a 60 BPM instrumental track.',
    },
    {
      sense: 'Smell',
      suggestion: 'Breathe in lavender, citrus, herbal tea, or fresh clean linen.',
    },
    {
      sense: 'Taste',
      suggestion: 'Slowly sip warm chamomile tea or savor one piece of fruit mindfully.',
    },
    {
      sense: 'Touch',
      suggestion: 'Wrap a soft blanket around your shoulders, take a warm shower, or place a hand gently over your heart.',
    },
  ];

  const summaryVi = lowEnergyDepressionModeActive
    ? `Điểm nền tảng ABC PLEASE hôm nay: ${completedPillarsCount}/8 (${resilienceScorePercent}%). Chế độ Năng lượng Thấp (Low-Energy Mode) đang bật: Không tính chuỗi ngày đứt (No Broken Streaks). Hãy chọn đúng 1 gợi ý Xoa dịu 5 Giác quan hoặc 1 bước nhỏ ACCEPTS bên dưới.`
    : `Điểm sức đề kháng cảm xúc ABC PLEASE hôm nay: ${completedPillarsCount}/8 (${resilienceScorePercent}%). ${
        missingVulnerabilityFactorsVi.length > 0
          ? `Gợi ý ưu tiên chăm sóc thêm: ${missingVulnerabilityFactorsVi[0]}.`
          : 'Bạn đã duy trì trọn vẹn cả 8 trụ cột bảo vệ khí sắc hôm nay!'
      }`;

  const summaryEn = lowEnergyDepressionModeActive
    ? `Today's ABC PLEASE score: ${completedPillarsCount}/8 (${resilienceScorePercent}%). Low-Energy Mode active (No Broken Streaks): Pick just ONE 5-Senses Self-Soothe or ACCEPTS micro-step below.`
    : `Today's ABC PLEASE Emotional Resilience score: ${completedPillarsCount}/8 (${resilienceScorePercent}%). ${
        missingVulnerabilityFactorsEn.length > 0
          ? `Suggested next pillar to nurture: ${missingVulnerabilityFactorsEn[0]}.`
          : 'All 8 biological and emotional resilience pillars are supported today!'
      }`;

  return {
    resilienceScorePercent,
    completedPillarsCount,
    totalPillarsCount: 8,
    lowEnergyDepressionModeActive,
    missingVulnerabilityFactorsVi,
    missingVulnerabilityFactorsEn,
    acceptsSkillsVi,
    acceptsSkillsEn,
    fiveSensesSelfSootheVi,
    fiveSensesSelfSootheEn,
    summaryVi,
    summaryEn,
  };
}
