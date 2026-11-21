import { detectCognitiveDistortions, detectSafetyBehaviors } from './detectors.ts';
import type { FeltNeedForSleep, MoodPole } from './types.ts';

/**
 * Phase 2 (Milestone 2: Sprint 3 & Sprint 4) Expansion for Next.js Web Application
 * Includes:
 * 1. Full 36 Interactive CBT, TEAM-CBT, DBT & Bipolar Toolkit (`WEB_36_CBT_TOOLS`) + 0ms `executeWeb36Tool`
 * 2. TEAM-CBT Pleasure-Predicting & Mastery/Pleasure (M/P) Sheet
 * 3. TEAM-CBT Anti-Procrastination 5-Minute Sheet (David Burns)
 * 4. Downward Arrow (Uncovering 23 Self-Defeating Beliefs — Individual & Interpersonal) + Cost-Benefit Analysis
 * 5. DBT `ABC PLEASE` Daily Resilience Tracker + `ACCEPTS` & `5-Senses Self-Soothe` Generator
 * 6. CBT-I Sleep Diary & Sleep Efficiency Calculator with Bipolar Mania Contraindication Guard
 * 7. DBT `Radical Acceptance` & `Urge Surfing` 90-Second Adrenaline Wave Timer
 * 8. Multi-Axis Bipolar Dual-Pole (-5..+5) Mood, Energy & Sleep Chart Series Builder
 */

export type Web36ToolCategory =
  | 'Anxiety & ERP'
  | 'Depression & TEAM-CBT'
  | 'Bipolar & IPSRT'
  | 'DBT Distress & Regulation'
  | 'Work & Burnout';

export interface Web36ClinicalTool {
  id: string;
  number: number;
  category: Web36ToolCategory;
  titleVi: string;
  titleEn: string;
  clinicalOrigin: 'CBT' | 'TEAM-CBT' | 'DBT' | 'IPSRT' | 'CBT-I';
  durationMinutes: number;
  promptPlaceholderVi: string;
  promptPlaceholderEn: string;
  mechanismVi: string;
  mechanismEn: string;
  kbCitation: string;
}

export const WEB_36_CBT_TOOLS: readonly Web36ClinicalTool[] = [
  // Category 1: Anxiety & ERP (Tools 1–8)
  {
    id: 'worry-box-postponement',
    number: 1,
    category: 'Anxiety & ERP',
    titleVi: 'Hộp Trì Hoãn Lo Âu 15 Phút (Worry Box)',
    titleEn: '15-Minute Worry Box Postponement',
    clinicalOrigin: 'CBT',
    durationMinutes: 3,
    promptPlaceholderVi: 'Nhập nỗi lo "Nhỡ đâu..." để cất vào khung giờ 17:30',
    promptPlaceholderEn: 'Enter your "What if..." worry to lock until 17:30',
    mechanismVi: 'Tách lo âu giải quyết được (Productive) khỏi lo âu giả định (Hypothetical) và ngắt vòng lặp nghiền ngẫm.',
    mechanismEn: 'Separates productive vs. hypothetical worry and breaks rumination loops via stimulus control.',
    kbCitation: '[KB:worry-postponement#stimulus-control]',
  },
  {
    id: 'erp-exposure-hierarchy',
    number: 2,
    category: 'Anxiety & ERP',
    titleVi: 'Thang Tiếp Xúc Sợ Hãi ERP (SUDS 0–100)',
    titleEn: 'ERP Exposure Hierarchy Builder (SUDS 0–100)',
    clinicalOrigin: 'CBT',
    durationMinutes: 10,
    promptPlaceholderVi: 'Mô tả tình huống gây sợ và mức SUDS (0-100)',
    promptPlaceholderEn: 'Describe feared situation and SUDS rating (0-100)',
    mechanismVi: 'Tiếp xúc có hệ thống và ngăn ngừa phản ứng an toàn để tạo đường cong quen dần (Habituation).',
    mechanismEn: 'Graduated exposure with response prevention to drive inhibitory learning and habituation.',
    kbCitation: '[KB:exposure-hierarchy#erp-ladder]',
  },
  {
    id: 'interoceptive-exposure-trainer',
    number: 3,
    category: 'Anxiety & ERP',
    titleVi: 'Tiếp Xúc Cảm Giác Cơ Thể (Interoceptive Exposure)',
    titleEn: 'Interoceptive Exposure Panic De-conditioning',
    clinicalOrigin: 'CBT',
    durationMinutes: 5,
    promptPlaceholderVi: 'Triệu chứng cơ thể bạn sợ nhất (tim đập nhanh, chóng mặt...)',
    promptPlaceholderEn: 'Feared bodily sensation (racing heart, dizziness...)',
    mechanismVi: 'Giải mẫn cảm với cảm giác sinh lý của cơn hoảng loạn sau khi đã sàng lọc y khoa.',
    mechanismEn: 'Desensitizes fear of autonomic sensations after medical clearance.',
    kbCitation: '[KB:exposure-hierarchy#interoceptive]',
  },
  {
    id: 'safety-behavior-dropper',
    number: 4,
    category: 'Anxiety & ERP',
    titleVi: 'Gỡ Bỏ Hành Vi An Toàn Ngầm (Safety Behavior Audit)',
    titleEn: 'Subtle Safety Behavior Detector & Dropper',
    clinicalOrigin: 'CBT',
    durationMinutes: 4,
    promptPlaceholderVi: 'Bạn đang làm gì để "phòng hờ" khi lo âu (đo mạch, ngồi gần cửa...)?',
    promptPlaceholderEn: 'What subtle safety crutches are you using (checking pulse, sitting near exit)?',
    mechanismVi: 'Loại bỏ các chiếc nạng tâm lý ngầm duy trì nỗi sợ dài hạn.',
    mechanismEn: 'Identifies and drops subtle avoidance behaviors that prevent disconfirmation of threat.',
    kbCitation: '[KB:exposure-hierarchy#safety-behaviors]',
  },
  {
    id: 'catastrophe-prediction-calibrator',
    number: 5,
    category: 'Anxiety & ERP',
    titleVi: 'Hiệu Chỉnh Dự Đoán Thảm Họa (Prediction Calibration)',
    titleEn: 'Catastrophe Prediction Calibration Tracker',
    clinicalOrigin: 'CBT',
    durationMinutes: 4,
    promptPlaceholderVi: 'Dự đoán thảm họa của bạn và xác suất % bạn nghĩ nó sẽ xảy ra',
    promptPlaceholderEn: 'Your feared catastrophe and predicted probability %',
    mechanismVi: 'Đối chiếu xác suất dự đoán với kết quả thực tế để chứng minh >90% kịch bản thảm họa không xảy ra.',
    mechanismEn: 'Compares predicted catastrophe odds against actual outcomes to recalibrate threat estimation.',
    kbCitation: '[KB:thought-record#fortune-telling]',
  },
  {
    id: 'decatastrophizing-what-if',
    number: 6,
    category: 'Anxiety & ERP',
    titleVi: 'Giải Thảm Họa Hóa Kịch Bản Tệ Nhất (Best / Worst / Most Likely)',
    titleEn: 'Decatastrophizing (Best / Worst / Most Likely & Coping)',
    clinicalOrigin: 'CBT',
    durationMinutes: 5,
    promptPlaceholderVi: 'Điều tệ nhất bạn sợ là gì nếu sự việc diễn ra không như ý?',
    promptPlaceholderEn: 'What is the worst-case scenario you fear right now?',
    mechanismVi: 'Đánh giá xác suất thực tế và lập phương án ứng phó sau 1 tuần nếu kịch bản xấu xảy ra.',
    mechanismEn: 'Evaluates realistic odds and builds a concrete 7-day coping plan even if the worst occurs.',
    kbCitation: '[KB:thought-record#catastrophizing]',
  },
  {
    id: 'shame-attacking-exercise',
    number: 7,
    category: 'Anxiety & ERP',
    titleVi: 'Bài Tập Tấn Công Sự Xấu Hổ Xã Hội (Shame-Attacking)',
    titleEn: 'Social Anxiety Shame-Attacking Behavioral Experiment',
    clinicalOrigin: 'TEAM-CBT',
    durationMinutes: 6,
    promptPlaceholderVi: 'Hành động nhỏ không hoàn hảo bạn sợ người khác đánh giá',
    promptPlaceholderEn: 'Small imperfect social act you fear others will judge',
    mechanismVi: 'Chủ động thực hiện một hành vi "không hoàn hảo" vô hại để phá vỡ nỗi sợ bị phán xét.',
    mechanismEn: 'Deliberately performs a harmless imperfect act in public to disconfirm social catastrophe.',
    kbCitation: '[KB:exposure-hierarchy#shame-attacking]',
  },
  {
    id: 'urge-surfing-adrenaline-wave',
    number: 8,
    category: 'Anxiety & ERP',
    titleVi: 'Lướt Sóng Adrenaline 90 Giây (Urge Surfing & Radical Acceptance)',
    titleEn: '90-Second Adrenaline Wave Urge Surfing',
    clinicalOrigin: 'DBT',
    durationMinutes: 3,
    promptPlaceholderVi: 'Mô tả cơn sóng lo âu hoặc thôi thúc kiểm tra đang dâng lên',
    promptPlaceholderEn: 'Describe the rising anxiety wave or compulsion urge',
    mechanismVi: 'Quan sát cơn sóng sinh hóa đạt đỉnh và tự tan trong 90 giây mà không chống cự hay né tránh.',
    mechanismEn: 'Rides the 90-second neurochemical wave without compulsion or secondary panic.',
    kbCitation: '[KB:opposite-action#urge-surfing]',
  },

  // Category 2: Depression & TEAM-CBT (Tools 9–18)
  {
    id: 'thought-record-7-step',
    number: 9,
    category: 'Depression & TEAM-CBT',
    titleVi: 'Bản Ghi Suy Nghĩ 7 Bước + Cổng Accuracy Check',
    titleEn: '7-Step Thought Record with Accuracy Check Gate',
    clinicalOrigin: 'CBT',
    durationMinutes: 8,
    promptPlaceholderVi: 'Nhập suy nghĩ tự động nóng (Hot Thought) đang làm bạn buồn',
    promptPlaceholderEn: 'Enter the automatic hot thought driving your low mood',
    mechanismVi: 'Kiểm chứng bằng chứng ủng hộ/phản bác và rẽ nhánh Giải quyết vấn đề nếu suy nghĩ là sự thật khách quan.',
    mechanismEn: 'Tests evidence for/against and branches to Problem-Solving if the thought is objectively true.',
    kbCitation: '[KB:thought-record#step-5-accuracy-check]',
  },
  {
    id: 'paradoxical-agenda-magic-dial',
    number: 10,
    category: 'Depression & TEAM-CBT',
    titleVi: 'Đặt Chương Trình Nghịch Lý (Magic Button & Magic Dial)',
    titleEn: 'TEAM-CBT Paradoxical Agenda Setting (Magic Button & Dial)',
    clinicalOrigin: 'TEAM-CBT',
    durationMinutes: 6,
    promptPlaceholderVi: 'Triệu chứng buồn/lo này đang thể hiện giá trị tốt đẹp nào của bạn?',
    promptPlaceholderEn: 'What core personal values does this sadness or anxiety protect?',
    mechanismVi: 'Tôn vinh lợi ích ngầm và giá trị cốt lõi của cảm xúc âm tính để làm tan kháng cự trước khi thay đổi.',
    mechanismEn: 'Honors the hidden benefits and core values behind symptoms to melt outcome resistance.',
    kbCitation: '[KB:paradoxical-agenda-setting#magic-dial]',
  },
  {
    id: 'pleasure-predicting-mp-sheet',
    number: 11,
    category: 'Depression & TEAM-CBT',
    titleVi: 'Bảng Dự Đoán Niềm Vui & Làm Chủ (Pleasure-Predicting M/P)',
    titleEn: 'Pleasure-Predicting & Mastery/Pleasure (M/P) Sheet',
    clinicalOrigin: 'TEAM-CBT',
    durationMinutes: 5,
    promptPlaceholderVi: 'Hoạt động dự định làm (Một mình vs. Cùng người khác) và mức P% dự đoán',
    promptPlaceholderEn: 'Planned activity (Alone vs. With Others) and predicted Pleasure %',
    mechanismVi: 'Kiểm nghiệm niềm tin "Mình không thể vui khi ở một mình" và đo độ lệch Dự đoán vs. Thực tế.',
    mechanismEn: 'Tests Love/Approval Addiction SDBs and corrects anhedonic prediction errors.',
    kbCitation: '[KB:pleasure-predicting#mp-sheet]',
  },
  {
    id: 'anti-procrastination-5-min',
    number: 12,
    category: 'Depression & TEAM-CBT',
    titleVi: 'Bảng Chống Trì Hoãn 5 Phút (Anti-Procrastination Sheet)',
    titleEn: 'David Burns 5-Minute Anti-Procrastination Sheet',
    clinicalOrigin: 'TEAM-CBT',
    durationMinutes: 5,
    promptPlaceholderVi: 'Đầu việc đang trì hoãn và bước nhỏ 5 phút đầu tiên',
    promptPlaceholderEn: 'Overwhelming task and the first 5-minute micro-step',
    mechanismVi: 'Chia nhỏ công việc thành bước 5 phút, so sánh Độ khó dự đoán (90%) với Độ khó thực tế (20%).',
    mechanismEn: 'Breaks tasks into 5-minute micro-steps and contrasts predicted vs. actual difficulty.',
    kbCitation: '[KB:pleasure-predicting#anti-procrastination]',
  },
  {
    id: 'downward-arrow-23-sdbs',
    number: 13,
    category: 'Depression & TEAM-CBT',
    titleVi: 'Mũi Tên Đi Xuống — Khám Phá 23 Niềm Tin Tự Hủy Hoại (SDBs)',
    titleEn: 'Downward Arrow — Uncovering 23 Self-Defeating Beliefs',
    clinicalOrigin: 'TEAM-CBT',
    durationMinutes: 7,
    promptPlaceholderVi: 'Nếu suy nghĩ đó là thật, điều đó có ý nghĩa gì về giá trị con người bạn?',
    promptPlaceholderEn: 'If that thought were true, what would it mean about your worth as a person?',
    mechanismVi: 'Truy tìm gốc rễ 23 SDBs (Hoàn hảo, Nghiện công nhận, Sợ xung đột...) kèm Phân tích Lợi-Hại.',
    mechanismEn: 'Traces automatic thoughts to core Individual/Interpersonal SDBs with Cost-Benefit Analysis.',
    kbCitation: '[KB:paradoxical-agenda-setting#23-sdbs]',
  },
  {
    id: 'externalization-of-voices',
    number: 14,
    category: 'Depression & TEAM-CBT',
    titleVi: 'Đối Thoại Nội Tâm (Externalization of Voices Roleplay)',
    titleEn: 'Externalization of Voices (Self-Defense & Acceptance)',
    clinicalOrigin: 'TEAM-CBT',
    durationMinutes: 6,
    promptPlaceholderVi: 'Lời buộc tội gay gắt của Kẻ Phán Xét Nội Tâm là gì?',
    promptPlaceholderEn: 'What harsh attack is your Inner Critic saying right now?',
    mechanismVi: 'Đáp trả tiếng nói tự chỉ trích bằng sự kết hợp giữa Tự Bảo Vệ (Self-Defense) và Chấp Nhận (Acceptance).',
    mechanismEn: 'Answers the Inner Critic using the synergy of Self-Defense and compassionate Acceptance.',
    kbCitation: '[KB:paradoxical-agenda-setting#externalization-of-voices]',
  },
  {
    id: 'double-standard-compassionate-friend',
    number: 15,
    category: 'Depression & TEAM-CBT',
    titleVi: 'Kỹ Thuật Tiêu Chuẩn Kép (Double-Standard Technique)',
    titleEn: 'Double-Standard Compassionate Friend Technique',
    clinicalOrigin: 'TEAM-CBT',
    durationMinutes: 4,
    promptPlaceholderVi: 'Bạn đang tự mắng mình điều gì mà bạn không bao giờ nói với bạn thân?',
    promptPlaceholderEn: 'What are you telling yourself that you would never say to a dear friend?',
    mechanismVi: 'Áp dụng cùng một chuẩn mực nhân từ mà bạn dành cho người bạn thân vào chính bản thân mình.',
    mechanismEn: 'Applies the same compassionate standard you hold for a close friend to yourself.',
    kbCitation: '[KB:thought-record#double-standard]',
  },
  {
    id: 'feared-fantasy-roleplay',
    number: 16,
    category: 'Depression & TEAM-CBT',
    titleVi: 'Đối Diện Ảo Tưởng Đáng Sợ (Feared Fantasy Courtroom)',
    titleEn: 'Feared Fantasy Social Rejection Roleplay',
    clinicalOrigin: 'TEAM-CBT',
    durationMinutes: 6,
    promptPlaceholderVi: 'Lời chỉ trích phóng đại nhất bạn sợ nghe từ người khác là gì?',
    promptPlaceholderEn: 'What is the most exaggerated criticism you fear hearing from someone?',
    mechanismVi: 'Diễn tập đối diện với lời phán xét phóng đại nhất bằng sự bình thản và hài hước để tước vũ khí nỗi sợ.',
    mechanismEn: 'Disarms fear of disapproval by roleplaying the worst imaginary critic with calm acceptance.',
    kbCitation: '[KB:paradoxical-agenda-setting#feared-fantasy]',
  },
  {
    id: 'behavioral-activation-rest-check',
    number: 17,
    category: 'Depression & TEAM-CBT',
    titleVi: 'Kích Hoạt Hành Vi 6 Bước + Cổng Nghỉ Ngơi Không Áy Náy',
    titleEn: '6-Step Behavioral Activation with Guilt-Free Rest Gate',
    clinicalOrigin: 'CBT',
    durationMinutes: 6,
    promptPlaceholderVi: 'Hoạt động nhỏ hôm nay (hoặc ghi nhận nhu cầu nghỉ ngơi sinh học)',
    promptPlaceholderEn: 'Today’s micro-activity (or biological rest check)',
    mechanismVi: 'Kiểm tra kiệt sức sinh học trước, sau đó thu nhỏ hành động tới khi độ tự tin đạt >= 7/10.',
    mechanismEn: 'Screens for biological exhaustion first, then scales action until confidence >= 7/10.',
    kbCitation: '[KB:behavioral-activation#rest-check]',
  },
  {
    id: 'responsibility-pie-chart',
    number: 18,
    category: 'Depression & TEAM-CBT',
    titleVi: 'Biểu Đồ Hình Quạt Trách Nhiệm (Responsibility Pie)',
    titleEn: 'Personalization & Self-Blame Responsibility Pie',
    clinicalOrigin: 'CBT',
    durationMinutes: 5,
    promptPlaceholderVi: 'Sự việc bạn đang tự nhận 100% lỗi về mình là gì?',
    promptPlaceholderEn: 'What negative outcome are you taking 100% of the blame for?',
    mechanismVi: 'Liệt kê mọi yếu tố khách quan trước khi chia tỷ lệ % trách nhiệm thực tế của bản thân.',
    mechanismEn: 'Lists all external contributing factors before assigning your realistic slice of the pie.',
    kbCitation: '[KB:thought-record#personalization]',
  },

  // Category 3: Bipolar & IPSRT (Tools 19–25)
  {
    id: 'bipolar-positive-distortion-audit',
    number: 19,
    category: 'Bipolar & IPSRT',
    titleVi: 'Rà Soát 5 Biến Dạng Dương Tính Hưng Cảm (Hypomania Check)',
    titleEn: '5 Bipolar Positive Distortions Audit (Hypomania Guard)',
    clinicalOrigin: 'CBT',
    durationMinutes: 4,
    promptPlaceholderVi: 'Ý tưởng lớn, kế hoạch mua sắm hoặc cảm giác "không cần ngủ" lúc này',
    promptPlaceholderEn: 'Grand plan, big purchase, or "no need for sleep" thought right now',
    mechanismVi: 'Phát hiện Tự cao, Bất khả xâm phạm, Lạc quan phi thực tế, Xung động 2h sáng và Năng lượng phép thuật.',
    mechanismEn: 'Detects Grandiosity, Invulnerability, Hyper-optimism, Impulse Justification, and Magical Energy.',
    kbCitation: '[KB:hypomania-guard#positive-distortions]',
  },
  {
    id: 'devils-advocate-reality-test',
    number: 20,
    category: 'Bipolar & IPSRT',
    titleVi: 'Phản Biện Thực Tế (Devil’s Advocate & Two-Person Check)',
    titleEn: 'Devil’s Advocate & Two-Person Reality Check',
    clinicalOrigin: 'CBT',
    durationMinutes: 6,
    promptPlaceholderVi: 'Dự án/quyết định bạn đang tin là "chắc chắn thắng 100%"',
    promptPlaceholderEn: 'Project or decision you currently believe is "100% guaranteed to win"',
    mechanismVi: 'Đặt 3 câu hỏi phản biện tài chính/giấc ngủ và tham khảo 2 người tin cậy trước khi hành động.',
    mechanismEn: 'Applies 3 cool-down counter-arguments and requires 2 trusted contacts to review.',
    kbCitation: '[KB:hypomania-guard#devils-advocate]',
  },
  {
    id: 'impulse-vault-48h-lock',
    number: 21,
    category: 'Bipolar & IPSRT',
    titleVi: 'Khoang Trì Hoãn Quyết Định 48 Giờ (48-Hour Impulse Vault)',
    titleEn: '48-Hour Impulse Vault Cooling Lock',
    clinicalOrigin: 'DBT',
    durationMinutes: 4,
    promptPlaceholderVi: 'Quyết định mua sắm / đầu tư / nghỉ việc muốn khóa 48 giờ',
    promptPlaceholderEn: 'Financial, career, or relationship impulse to lock for 48 hours',
    mechanismVi: 'Khóa quyết định lớn trong 48 giờ kèm Ma trận Lợi/Hại DBT để bảo vệ tài chính và sự nghiệp.',
    mechanismEn: 'Locks major decisions for 48 hours with a 4-box DBT Crisis Pros & Cons matrix.',
    kbCitation: '[KB:hypomania-guard#48h-impulse-vault]',
  },
  {
    id: 'ipsrt-5-anchors-stabilizer',
    number: 22,
    category: 'Bipolar & IPSRT',
    titleVi: 'Neo Nhịp Sinh Học 5 Mốc IPSRT (Social Rhythm Metric)',
    titleEn: 'IPSRT 5 Circadian Social Rhythm Anchors',
    clinicalOrigin: 'IPSRT',
    durationMinutes: 4,
    promptPlaceholderVi: 'Mốc giờ thức dậy / tiếp xúc đầu tiên / đi ngủ hôm nay lệch bao nhiêu phút?',
    promptPlaceholderEn: 'How many minutes did wake time / first contact / bedtime shift today?',
    mechanismVi: 'Giữ độ lệch 5 mốc sinh học <= 30-45 phút mỗi ngày để ngăn ngừa trượt pha khí sắc.',
    mechanismEn: 'Keeps daily variance of 5 circadian anchors within 30-45 minutes to prevent mood switches.',
    kbCitation: '[KB:health-integration#ipsrt-anchors]',
  },
  {
    id: 'dark-therapy-wind-down',
    number: 23,
    category: 'Bipolar & IPSRT',
    titleVi: 'Liệu Pháp Bóng Tối & Hạ Nhiệt Đêm (Dark Therapy Protocol)',
    titleEn: 'Evening Dark Therapy & Low-Stimulus Wind-Down',
    clinicalOrigin: 'IPSRT',
    durationMinutes: 5,
    promptPlaceholderVi: 'Khung giờ bắt đầu tắt ánh sáng xanh và hạ kích thích tối nay',
    promptPlaceholderEn: 'Target time to block blue light and enter low-stimulus dark rest',
    mechanismVi: 'Chặn ánh sáng xanh từ 22:00–06:00 để ổn định melatonin nội sinh và cắt đà hưng cảm nhẹ.',
    mechanismEn: 'Eliminates blue-light stimulation from 22:00–06:00 to stabilize circadian melatonin.',
    kbCitation: '[KB:hypomania-guard#dark-therapy]',
  },
  {
    id: 'medication-adherence-cba',
    number: 24,
    category: 'Bipolar & IPSRT',
    titleVi: 'Tái Cấu Trúc Suy Nghĩ Tuân Thủ Thuốc (Medication Adherence CBT)',
    titleEn: 'Mood Stabilizer Adherence Cost-Benefit Analysis',
    clinicalOrigin: 'CBT',
    durationMinutes: 5,
    promptPlaceholderVi: 'Suy nghĩ muốn tự ý giảm liều hoặc bỏ thuốc ổn định khí sắc',
    promptPlaceholderEn: 'Thought tempting you to skip or stop mood stabilizer medication',
    mechanismVi: 'Phân tích Lợi-Hại dài hạn của thuốc ổn định khí sắc và chuẩn bị câu hỏi trao đổi với bác sĩ.',
    mechanismEn: 'Evaluates long-term relapse prevention benefits and prepares questions for the psychiatrist.',
    kbCitation: '[KB:hypomania-guard#medication-adherence]',
  },
  {
    id: 'ulysses-contract-builder',
    number: 25,
    category: 'Bipolar & IPSRT',
    titleVi: 'Bản Giao Ước Bình Ổn (Ulysses Contract Directives)',
    titleEn: 'Euthymic Ulysses Contract & Early Warning Directives',
    clinicalOrigin: 'IPSRT',
    durationMinutes: 7,
    promptPlaceholderVi: 'Dấu hiệu tiền triệu cá nhân và chỉ dẫn bảo vệ khi khí sắc vượt ngưỡng',
    promptPlaceholderEn: 'Personal prodrome signs and pre-authorized protective directives',
    mechanismVi: 'Thiết lập quy tắc bảo vệ tự động khi đang bình ổn (cực 0) để kích hoạt khi chớm hưng cảm/trầm cảm.',
    mechanismEn: 'Pre-commits protective rules while euthymic (pole 0) for automatic activation during prodromes.',
    kbCitation: '[KB:hypomania-guard#ulysses-contract]',
  },

  // Category 4: DBT Distress & Regulation (Tools 26–32)
  {
    id: 'dbt-tipp-medical-safe',
    number: 26,
    category: 'DBT Distress & Regulation',
    titleVi: 'Cấp Cứu Sinh Lý DBT TIPP (Có Sàng Lọc Y Khoa Nước Lạnh)',
    titleEn: 'DBT TIPP Physiological Reset (With Medical Screen)',
    clinicalOrigin: 'DBT',
    durationMinutes: 3,
    promptPlaceholderVi: 'Mức độ kích động hiện tại (0-10) và tình trạng tim mạch',
    promptPlaceholderEn: 'Current distress intensity (0-10) and cardiac screening status',
    mechanismVi: 'Kích hoạt hệ thần kinh phó giao cảm qua Nước mát (nếu đủ điều kiện y khoa) hoặc Thở dẫn nhịp 4-6.',
    mechanismEn: 'Activates parasympathetic dive reflex or 4-6 paced breathing after mandatory cardiac screening.',
    kbCitation: '[KB:tipp#medical-screening]',
  },
  {
    id: 'dbt-stop-crisis-pros-cons',
    number: 27,
    category: 'DBT Distress & Regulation',
    titleVi: 'Kỹ Năng DBT STOP & Ma Trận Lợi/Hại Khủng Hoảng',
    titleEn: 'DBT STOP & 4-Box Crisis Pros and Cons',
    clinicalOrigin: 'DBT',
    durationMinutes: 4,
    promptPlaceholderVi: 'Xung động bạn muốn dừng lại ngay lúc này (nổi nóng, nhắn tin, chi tiêu...)',
    promptPlaceholderEn: 'Impulse you need to freeze right now (lashing out, texting, spending...)',
    mechanismVi: 'Đóng băng hành động (Stop - Take a step back - Observe - Proceed mindfully) và so sánh 4 ô Lợi/Hại.',
    mechanismEn: 'Freezes impulsive action and weighs short-term relief against long-term values.',
    kbCitation: '[KB:crisis-pros-cons#4-box-matrix]',
  },
  {
    id: 'dbt-accepts-self-soothe',
    number: 28,
    category: 'DBT Distress & Regulation',
    titleVi: 'Đánh Lạc Hướng Khôn Ngoan ACCEPTS & Xoa Dịu 5 Giác Quan',
    titleEn: 'DBT ACCEPTS Distraction & 5-Senses Self-Soothe',
    clinicalOrigin: 'DBT',
    durationMinutes: 4,
    promptPlaceholderVi: 'Tình huống chưa thể giải quyết ngay cần tạm thời hạ nhiệt cảm xúc',
    promptPlaceholderEn: 'Unresolvable acute stressor requiring healthy temporary distraction',
    mechanismVi: 'Sử dụng 7 chiến lược ACCEPTS kết hợp xoa dịu 5 giác quan để đi qua cơn khủng hoảng an toàn.',
    mechanismEn: 'Combines 7 ACCEPTS distraction skills with 5-senses self-soothing to survive acute distress.',
    kbCitation: '[KB:tipp#accepts-self-soothe]',
  },
  {
    id: 'dbt-opposite-action-justified',
    number: 29,
    category: 'DBT Distress & Regulation',
    titleVi: 'Hành Động Đối Nghịch (Opposite Action + Justified Check)',
    titleEn: 'DBT Opposite Action with Justified Emotion Gate',
    clinicalOrigin: 'DBT',
    durationMinutes: 5,
    promptPlaceholderVi: 'Cảm xúc hiện tại và thôi thúc hành động (rút lui, né tránh, tấn công...)',
    promptPlaceholderEn: 'Current emotion and action urge (withdraw, avoid, attack...)',
    mechanismVi: 'Kiểm tra cảm xúc có khớp sự thật/nguy hiểm thực tế không; nếu không, làm ngược lại 100% thôi thúc.',
    mechanismEn: 'Checks if emotion fits objective danger; if not, acts 100% opposite to the maladaptive urge.',
    kbCitation: '[KB:opposite-action#justified-check]',
  },
  {
    id: 'dbt-abc-please-resilience',
    number: 30,
    category: 'DBT Distress & Regulation',
    titleVi: 'Xây Dựng Sức Bền Cảm Xúc Hàng Ngày (DBT ABC PLEASE)',
    titleEn: 'DBT ABC PLEASE Daily Emotional Resilience Checklist',
    clinicalOrigin: 'DBT',
    durationMinutes: 4,
    promptPlaceholderVi: 'Kiểm tra Tích lũy tích cực (A), Làm chủ (B), Dự phòng (C) và Sinh lý (PLEASE)',
    promptPlaceholderEn: 'Audit Accumulate positives, Build mastery, Cope ahead & PLEASE physiology',
    mechanismVi: 'Giảm tính dễ tổn thương cảm xúc bằng cách chăm sóc giấc ngủ, dinh dưỡng, vận động và tích lũy làm chủ.',
    mechanismEn: 'Reduces emotional vulnerability by stabilizing sleep, nutrition, exercise, and daily mastery.',
    kbCitation: '[KB:abc-please#daily-resilience]',
  },
  {
    id: 'dbt-wise-mind-critic-guard',
    number: 31,
    category: 'DBT Distress & Regulation',
    titleVi: 'Tâm Khôn Ngoan (Wise Mind + Bộ Lọc Chống Tự Phán Xét)',
    titleEn: 'DBT Wise Mind Synthesis with Harsh Self-Critic Guard',
    clinicalOrigin: 'DBT',
    durationMinutes: 6,
    promptPlaceholderVi: 'Tiếng nói Tâm Cảm Xúc và Tâm Lý Trí về quyết định bạn đang phân vân',
    promptPlaceholderEn: 'Emotion Mind and Reasonable Mind perspectives on your dilemma',
    mechanismVi: 'Tách Kẻ Tự Phán Xét đội lốt lý trí và hợp nhất Cảm xúc + Lý trí tại điểm lặng của hơi thở.',
    mechanismEn: 'Filters out the Harsh Inner Critic disguised as logic and synthesizes Emotion + Reasonable Mind.',
    kbCitation: '[KB:wise-mind#critic-guard]',
  },
  {
    id: 'dbt-chain-analysis-repair',
    number: 32,
    category: 'DBT Distress & Regulation',
    titleVi: 'Giải Phẫu Chuỗi Hành Vi & Sửa Chữa (DBT Chain Analysis)',
    titleEn: 'DBT Behavioral Chain Analysis & Missing-Links Repair',
    clinicalOrigin: 'DBT',
    durationMinutes: 8,
    promptPlaceholderVi: 'Hành vi mục tiêu muốn giải phẫu (tự động chặn nếu là tự hại/bị bạo hành)',
    promptPlaceholderEn: 'Target behavior to analyze (hard-stops on self-harm or victimization)',
    mechanismVi: 'Tìm yếu tố dễ tổn thương PLEASE, sự kiện kích hoạt và chèn kỹ năng thay thế vào từng mắt xích.',
    mechanismEn: 'Maps PLEASE vulnerabilities, prompting event, and link-by-link replacement skills.',
    kbCitation: '[KB:chain-analysis#hard-stops]',
  },

  // Category 5: Work & Burnout (Tools 33–36)
  {
    id: 'dear-man-ear-script-builder',
    number: 33,
    category: 'Work & Burnout',
    titleVi: 'Kịch Bản Giao Tiếp Quyết Đoán & Từ Chối (DEAR MAN + EAR)',
    titleEn: 'DBT DEAR MAN & TEAM-CBT EAR Boundary Script Builder',
    clinicalOrigin: 'DBT',
    durationMinutes: 6,
    promptPlaceholderVi: 'Lời đề nghị hoặc lời từ chối ranh giới công việc bạn cần nói',
    promptPlaceholderEn: 'Workplace request or boundary refusal you need to communicate',
    mechanismVi: 'Kết hợp cấu trúc DEAR MAN với 5 Bí quyết Thấu cảm EAR để giữ ranh giới mà vẫn tôn trọng.',
    mechanismEn: 'Combines DEAR MAN assertiveness with 5 Secrets of Effective Communication (EAR).',
    kbCitation: '[KB:dear-man#ear-integration]',
  },
  {
    id: 'cbti-sleep-efficiency-guard',
    number: 34,
    category: 'Work & Burnout',
    titleVi: 'Nhật Ký Giấc Ngủ CBT-I & Lá Chắn Chống Hưng Cảm',
    titleEn: 'CBT-I Sleep Efficiency Calculator with Bipolar Mania Guard',
    clinicalOrigin: 'CBT-I',
    durationMinutes: 4,
    promptPlaceholderVi: 'Số giờ nằm trên giường, số giờ thực ngủ và cảm giác cần ngủ',
    promptPlaceholderEn: 'Hours in bed, hours asleep, and felt need for sleep',
    mechanismVi: 'Tính Hiệu suất Giấc ngủ (SE%) và TỰ ĐỘNG CHẶN hạn chế giấc ngủ CBT-I nếu có dấu hiệu giảm nhu cầu ngủ.',
    mechanismEn: 'Calculates Sleep Efficiency % and BLOCKS sleep restriction if bipolar reduced need for sleep is present.',
    kbCitation: '[KB:health-integration#cbti-bipolar-guard]',
  },
  {
    id: 'impostor-syndrome-evidence-bank',
    number: 35,
    category: 'Work & Burnout',
    titleVi: 'Ngân Hàng Bằng Chứng Chống Hội Chứng Kẻ Mạo Danh',
    titleEn: 'Impostor Syndrome Evidence Bank & Discounting Filter',
    clinicalOrigin: 'CBT',
    durationMinutes: 5,
    promptPlaceholderVi: 'Thành tựu bạn vừa cho là "chỉ do ăn may / ai làm cũng được"',
    promptPlaceholderEn: 'Accomplishment you dismissed as "just luck / anyone could do it"',
    mechanismVi: 'Gỡ bỏ biến dạng Lọc bỏ tích cực (Discounting the Positive) và ghi nhận năng lực thực tế.',
    mechanismEn: 'Counters Discounting the Positive by cataloging objective skills and effort.',
    kbCitation: '[KB:thought-record#mental-filter]',
  },
  {
    id: 'burnout-energy-budget-pacing',
    number: 36,
    category: 'Work & Burnout',
    titleVi: 'Ngân Sách Năng Lượng & Phục Hồi Kiệt Sức (Burnout Pacing)',
    titleEn: 'Burnout Energy Budget & Guilt-Free Recovery Pacing',
    clinicalOrigin: 'CBT',
    durationMinutes: 5,
    promptPlaceholderVi: 'Các hoạt động đang rút cạn năng lượng và hoạt động nạp lại năng lượng',
    promptPlaceholderEn: 'Energy-draining tasks vs. restorative micro-breaks today',
    mechanismVi: 'Cân bằng giữa hoạt động Tiêu hao và Phục hồi, gỡ bỏ niềm tin "Nghỉ ngơi là lười biếng".',
    mechanismEn: 'Balances energy drains vs. chargers while dismantling the Achievement Addiction SDB.',
    kbCitation: '[KB:behavioral-activation#burnout-pacing]',
  },
] as const;

export interface Web36ToolExecutionContext {
  moodPolarity?: MoodPole;
  distressIntensity?: number;
  feltNeedForSleep?: FeltNeedForSleep;
}

export interface Web36ToolExecutionResult {
  tool: Web36ClinicalTool;
  latencyMs: 0;
  detectedNegativeDistortions: string[];
  detectedPositiveManiaDistortions: string[];
  detectedSafetyBehaviors: string[];
  detectedSDBs: string[];
  bipolarSafetyNoteVi?: string;
  bipolarSafetyNoteEn?: string;
  reframeOrActionCardVi: string;
  reframeOrActionCardEn: string;
  nextMicroStepVi: string;
  nextMicroStepEn: string;
  kbCitation: string;
}

export function executeWeb36Tool(
  toolId: string,
  userInput: string,
  context: Web36ToolExecutionContext = {}
): Web36ToolExecutionResult {
  const tool =
    WEB_36_CBT_TOOLS.find((t) => t.id === toolId) ??
    WEB_36_CBT_TOOLS[0]!;
  const cleanInput = userInput.trim() || tool.promptPlaceholderVi;

  const distortions = detectCognitiveDistortions(cleanInput);
  const safetyBehaviors = detectSafetyBehaviors(cleanInput);
  const moodPole = context.moodPolarity ?? 0;

  let bipolarSafetyNoteVi: string | undefined;
  let bipolarSafetyNoteEn: string | undefined;

  if (moodPole >= 2 || distortions.positiveMania.length > 0) {
    bipolarSafetyNoteVi =
      'Lá chắn Hưng cảm nhẹ (Hypomania Guard): Phát hiện khí sắc lên cao (>= +2) hoặc biến dạng dương tính. Ưu tiên hạ kích thích, khóa quyết định lớn vào Khoang Chờ 48 Giờ và không tăng tải công việc.';
    bipolarSafetyNoteEn =
      'Hypomania Guard Active: Elevated mood polarity (>= +2) or positive mania distortion detected. Prioritize low-stimulus wind-down and lock major decisions in the 48-Hour Impulse Vault.';
  } else if (moodPole <= -3) {
    bipolarSafetyNoteVi =
      'Chế độ Năng lượng Thấp (Low-Energy Mode <= -3): Thu nhỏ bài tập thành 1 bước siêu nhỏ 2–5 phút, không đếm chuỗi ngày đứt.';
    bipolarSafetyNoteEn =
      'Low-Energy Depression Mode (<= -3): Shrinking exercise to a single 2–5 minute micro-step with zero streak pressure.';
  }

  const negNamesVi = distortions.negative.map((d) => d.nameVi);
  const posNamesVi = distortions.positiveMania.map((d) => d.nameVi);
  const firstSocraticVi =
    distortions.positiveMania[0]?.socraticQuestionVi ??
    distortions.negative[0]?.socraticQuestionVi ??
    'Dữ kiện thực tế khách quan nào ủng hộ và phản bác lại góc nhìn này?';
  const firstSocraticEn =
    distortions.positiveMania[0]?.socraticQuestionEn ??
    distortions.negative[0]?.socraticQuestionEn ??
    'What objective camera facts support vs. challenge this perspective?';

  return {
    tool,
    latencyMs: 0,
    detectedNegativeDistortions: negNamesVi,
    detectedPositiveManiaDistortions: posNamesVi,
    detectedSafetyBehaviors: safetyBehaviors,
    detectedSDBs: distortions.selfDefeatingBeliefs,
    bipolarSafetyNoteVi,
    bipolarSafetyNoteEn,
    reframeOrActionCardVi: `🌿 Công cụ số ${tool.number}: ${tool.titleVi} — ${tool.mechanismVi} (Gợi ý thực hành: ${firstSocraticVi})`,
    reframeOrActionCardEn: `[#${tool.number} ${tool.titleEn}] Mechanism: ${tool.mechanismEn} | Socratic Reframe / Action: ${firstSocraticEn}`,
    nextMicroStepVi:
      moodPole <= -3
        ? `Bước siêu nhỏ (2 phút): Hít thở chậm 1 nhịp và chỉ thực hiện 10% đầu tiên của công cụ "${tool.titleVi}".`
        : `Bước tiếp theo (${tool.durationMinutes} phút): Áp dụng "${tool.titleVi}" cho tình huống: "${cleanInput.slice(0, 90)}".`,
    nextMicroStepEn:
      moodPole <= -3
        ? `Micro-step (2 min): Take one slow breath and do just the first 10% of "${tool.titleEn}".`
        : `Next step (${tool.durationMinutes} min): Apply "${tool.titleEn}" to: "${cleanInput.slice(0, 90)}".`,
    kbCitation: tool.kbCitation,
  };
}

// ============================================================================
// 2. TEAM-CBT PLEASURE-PREDICTING & MASTERY/PLEASURE (M/P) SHEET
// ============================================================================

export type CompanionContext = 'alone_self' | 'with_others';

export interface PleasurePredictingEntry {
  id: string;
  activity: string;
  companion: CompanionContext;
  predictedPleasurePercent: number; // 0-100
  actualPleasurePercent: number;    // 0-100
  predictedMasteryPercent: number;  // 0-100
  actualMasteryPercent: number;     // 0-100
}

export interface PleasurePredictingSheetEvaluation {
  entries: Array<
    PleasurePredictingEntry & {
      pleasureDelta: number;
      masteryDelta: number;
    }
  >;
  averagePleasurePredictionError: number;
  averageMasteryPredictionError: number;
  aloneActualPleasureAverage: number;
  withOthersActualPleasureAverage: number;
  loveAddictionSdbDisconfirmed: boolean;
  clinicalInsightVi: string;
  clinicalInsightEn: string;
}

export function evaluatePleasurePredictingSheet(
  entries: PleasurePredictingEntry[]
): PleasurePredictingSheetEvaluation {
  const enriched = entries.map((e) => ({
    ...e,
    pleasureDelta: e.actualPleasurePercent - e.predictedPleasurePercent,
    masteryDelta: e.actualMasteryPercent - e.predictedMasteryPercent,
  }));

  const count = enriched.length || 1;
  const avgPleasureDelta = Math.round(
    enriched.reduce((acc, cur) => acc + cur.pleasureDelta, 0) / count
  );
  const avgMasteryDelta = Math.round(
    enriched.reduce((acc, cur) => acc + cur.masteryDelta, 0) / count
  );

  const aloneRows = enriched.filter((e) => e.companion === 'alone_self');
  const othersRows = enriched.filter((e) => e.companion === 'with_others');

  const aloneActualPleasureAverage = aloneRows.length
    ? Math.round(aloneRows.reduce((a, c) => a + c.actualPleasurePercent, 0) / aloneRows.length)
    : 0;
  const withOthersActualPleasureAverage = othersRows.length
    ? Math.round(othersRows.reduce((a, c) => a + c.actualPleasurePercent, 0) / othersRows.length)
    : 0;

  // Disconfirms "I cannot be happy or fulfilled alone" when solo activities yield >= 50% pleasure or outperform predictions
  const loveAddictionSdbDisconfirmed =
    aloneRows.some((r) => r.actualPleasurePercent >= 50 || r.pleasureDelta >= 15);

  return {
    entries: enriched,
    averagePleasurePredictionError: avgPleasureDelta,
    averageMasteryPredictionError: avgMasteryDelta,
    aloneActualPleasureAverage,
    withOthersActualPleasureAverage,
    loveAddictionSdbDisconfirmed,
    clinicalInsightVi: `Hiệu chỉnh Sai số Dự đoán (TEAM-CBT M/P): Niềm vui thực tế cao hơn dự đoán trung bình ${avgPleasureDelta >= 0 ? `+${avgPleasureDelta}%` : `${avgPleasureDelta}%`}, Cảm giác Làm chủ (Mastery) lệch ${avgMasteryDelta >= 0 ? `+${avgMasteryDelta}%` : `${avgMasteryDelta}%`}. Hoạt động Một mình đạt trung bình ${aloneActualPleasureAverage}% niềm vui (${loveAddictionSdbDisconfirmed ? 'Bác bỏ thành công Niềm tin Tự hủy hoại "Mình không thể hạnh phúc khi ở một mình"' : 'Tiếp tục thử nghiệm các hoạt động tự chăm sóc độc lập'}).`,
    clinicalInsightEn: `TEAM-CBT M/P Prediction-Error Correction: Actual Pleasure exceeded predictions by ${avgPleasureDelta >= 0 ? `+${avgPleasureDelta}%` : `${avgPleasureDelta}%`} and Mastery by ${avgMasteryDelta >= 0 ? `+${avgMasteryDelta}%` : `${avgMasteryDelta}%`}. Solo activities averaged ${aloneActualPleasureAverage}% pleasure (${loveAddictionSdbDisconfirmed ? 'Disconfirming the Love/Dependence SDB that happiness requires another person' : 'Continue testing independent mastery/pleasure activities'}).`,
  };
}

// ============================================================================
// 3. TEAM-CBT ANTI-PROCRASTINATION 5-MINUTE SHEET (DAVID BURNS)
// ============================================================================

export interface AntiProcrastinationStep {
  id: string;
  overwhelmingTask: string;
  microStep5To15Min: string;
  predictedDifficultyPercent: number;   // 0-100
  actualDifficultyPercent: number;      // 0-100
  predictedSatisfactionPercent: number; // 0-100
  actualSatisfactionPercent: number;    // 0-100
}

export interface AntiProcrastinationEvaluation {
  steps: Array<
    AntiProcrastinationStep & {
      difficultyDropDelta: number; // predicted - actual (positive means easier than feared)
      satisfactionGainDelta: number; // actual - predicted
    }
  >;
  averageDifficultyOverestimation: number;
  averageSatisfactionUnderestimation: number;
  coachingVi: string;
  coachingEn: string;
}

export function evaluateAntiProcrastinationSheet(
  steps: AntiProcrastinationStep[]
): AntiProcrastinationEvaluation {
  const enriched = steps.map((s) => ({
    ...s,
    difficultyDropDelta: s.predictedDifficultyPercent - s.actualDifficultyPercent,
    satisfactionGainDelta: s.actualSatisfactionPercent - s.predictedSatisfactionPercent,
  }));

  const count = enriched.length || 1;
  const avgDiffDrop = Math.round(
    enriched.reduce((acc, cur) => acc + cur.difficultyDropDelta, 0) / count
  );
  const avgSatGain = Math.round(
    enriched.reduce((acc, cur) => acc + cur.satisfactionGainDelta, 0) / count
  );

  return {
    steps: enriched,
    averageDifficultyOverestimation: avgDiffDrop,
    averageSatisfactionUnderestimation: avgSatGain,
    coachingVi: `Bảng Chống Trì Hoãn 5 Phút: Khi chia thành bước nhỏ 5–15 phút, công việc thực tế DỄ HƠN dự đoán trung bình ${avgDiffDrop}% và mang lại sự hài lòng CAO HƠN dự đoán +${avgSatGain}%. Động lực luôn xuất hiện SAU hành động nhỏ đầu tiên, không phải trước đó.`,
    coachingEn: `5-Minute Anti-Procrastination Sheet: Breaking tasks into 5–15 min micro-steps made them ${avgDiffDrop}% EASIER than predicted and +${avgSatGain}% MORE satisfying. Action precedes motivation.`,
  };
}

// ============================================================================
// 4. DOWNWARD ARROW (UNCOVERING 23 SELF-DEFEATING BELIEFS) + COST-BENEFIT ANALYSIS
// ============================================================================

export interface SelfDefeatingBeliefCatalogItem {
  id: string;
  category: 'Individual' | 'Interpersonal';
  nameVi: string;
  nameEn: string;
  typicalRuleVi: string;
  healthyReplacementBeliefVi: string;
  healthyReplacementBeliefEn: string;
}

export const SELF_DEFEATING_BELIEFS_23_CATALOG: readonly SelfDefeatingBeliefCatalogItem[] = [
  {
    id: 'performance-perfectionism',
    category: 'Individual',
    nameVi: '1. Chủ nghĩa Hoàn hảo Năng lực (Performance Perfectionism)',
    nameEn: '1. Performance Perfectionism',
    typicalRuleVi: 'Tôi không bao giờ được phép thất bại hay mắc sai lầm.',
    healthyReplacementBeliefVi: 'Tôi hướng tới sự xuất sắc nhưng chấp nhận sai sót là một phần tự nhiên của việc học hỏi.',
    healthyReplacementBeliefEn: 'I aim for excellence while embracing mistakes as an essential part of learning and being human.',
  },
  {
    id: 'perceived-perfectionism',
    category: 'Individual',
    nameVi: '2. Chủ nghĩa Hoàn hảo Hình ảnh (Perceived Perfectionism)',
    nameEn: '2. Perceived Perfectionism',
    typicalRuleVi: 'Mọi người sẽ coi thường tôi nếu họ thấy bất kỳ khuyết điểm nào của tôi.',
    healthyReplacementBeliefVi: 'Sự chân thật và dám bộc lộ điểm chưa hoàn hảo giúp kết nối con người sâu sắc hơn.',
    healthyReplacementBeliefEn: 'Authenticity and vulnerability create deeper human connection than a flawless facade.',
  },
  {
    id: 'achievement-addiction',
    category: 'Individual',
    nameVi: '3. Nghiện Thành tích (Achievement Addiction)',
    nameEn: '3. Achievement Addiction',
    typicalRuleVi: 'Giá trị con người tôi phụ thuộc hoàn toàn vào năng suất, địa vị và thành công.',
    healthyReplacementBeliefVi: 'Giá trị con người tôi là nội tại và bất biến, ngay cả khi tôi nghỉ ngơi hoặc thất bại.',
    healthyReplacementBeliefEn: 'My human worth is intrinsic and constant, whether I succeed, fail, or rest.',
  },
  {
    id: 'emotional-perfectionism',
    category: 'Individual',
    nameVi: '4. Chủ nghĩa Hoàn hảo Cảm xúc (Emotional Perfectionism)',
    nameEn: '4. Emotional Perfectionism',
    typicalRuleVi: 'Tôi phải luôn vui vẻ, kiểm soát được cảm xúc và không bao giờ được lo âu hay buồn bã.',
    healthyReplacementBeliefVi: 'Mọi cảm xúc buồn, lo, giận đều là tín hiệu tự nhiên của con người và đều được phép tồn tại.',
    healthyReplacementBeliefEn: 'All human emotions—including sadness, anxiety, and anger—are natural and valid.',
  },
  {
    id: 'approval-addiction',
    category: 'Interpersonal',
    nameVi: '5. Nghiện Sự Công nhận (Approval Addiction)',
    nameEn: '5. Approval Addiction',
    typicalRuleVi: 'Tôi cần tất cả mọi người phải hài lòng và tán thưởng mình để cảm thấy có giá trị.',
    healthyReplacementBeliefVi: 'Sự không đồng tình của người khác không làm giảm đi giá trị bản thân tôi.',
    healthyReplacementBeliefEn: 'Someone else’s disapproval reflects their preferences, not my worth as a person.',
  },
  {
    id: 'love-addiction',
    category: 'Interpersonal',
    nameVi: '6. Nghiện Tình yêu / Phụ thuộc (Love Addiction)',
    nameEn: '6. Love Addiction',
    typicalRuleVi: 'Tôi không thể nào hạnh phúc hay trọn vẹn nếu ở một mình mà không có người yêu.',
    healthyReplacementBeliefVi: 'Tình yêu rất đẹp, nhưng tôi hoàn toàn có thể tạo ra niềm vui và ý nghĩa khi ở một mình.',
    healthyReplacementBeliefEn: 'Intimacy is wonderful, AND I can experience rich pleasure and mastery on my own.',
  },
  {
    id: 'rejection-phobia',
    category: 'Interpersonal',
    nameVi: '7. Ám ảnh Sợ Bị Từ chối (Fear of Rejection)',
    nameEn: '7. Fear of Rejection',
    typicalRuleVi: 'Nếu bị từ chối, điều đó chứng tỏ tôi hoàn toàn kém cỏi và không đáng được yêu thương.',
    healthyReplacementBeliefVi: 'Một lời từ chối chỉ là sự không phù hợp ở thời điểm đó, không phải bản án về con người tôi.',
    healthyReplacementBeliefEn: 'Rejection simply signals a mismatch in a specific context, never a verdict on my humanity.',
  },
  {
    id: 'conflict-phobia',
    category: 'Interpersonal',
    nameVi: '8. Ám ảnh Sợ Xung đột (Conflict Phobia / Pleasing)',
    nameEn: '8. Conflict Phobia & People-Pleasing',
    typicalRuleVi: 'Những người yêu quý hoặc làm việc cùng nhau thì không bao giờ được bất đồng hay nói Không.',
    healthyReplacementBeliefVi: 'Bày tỏ bất đồng và đặt ranh giới tôn trọng (DEAR MAN + EAR) là nền tảng của mối quan hệ lành mạnh.',
    healthyReplacementBeliefEn: 'Respectful disagreement and clear boundaries strengthen healthy relationships.',
  },
  {
    id: 'self-blame',
    category: 'Interpersonal',
    nameVi: '9. Tự Đổ lỗi Toàn phần (Self-Blame)',
    nameEn: '9. Chronic Self-Blame',
    typicalRuleVi: 'Mọi vấn đề trên đời và cảm xúc tiêu cực của người khác đều là lỗi của tôi.',
    healthyReplacementBeliefVi: 'Tôi chỉ chịu trách nhiệm cho phần hành vi của mình, không gánh thay toàn bộ thế giới.',
    healthyReplacementBeliefEn: 'I am responsible only for my own choices, not for everyone else’s reactions.',
  },
  {
    id: 'other-blame',
    category: 'Interpersonal',
    nameVi: '10. Đổ lỗi Cho Người khác (Other-Blame)',
    nameEn: '10. Other-Blame',
    typicalRuleVi: 'Người khác là nguyên nhân của mọi đau khổ trong tôi và họ phải thay đổi trước.',
    healthyReplacementBeliefVi: 'Tôi giành lại quyền chủ động bằng cách tập trung vào phần phản ứng và lựa chọn của chính mình.',
    healthyReplacementBeliefEn: 'I reclaim my power by focusing on my own responses rather than waiting for others to change.',
  },
  {
    id: 'entitlement',
    category: 'Interpersonal',
    nameVi: '11. Tư duy Đặc quyền (Entitlement)',
    nameEn: '11. Entitlement',
    typicalRuleVi: 'Mọi người và cuộc đời bắt buộc phải đối xử với tôi đúng như cách tôi mong muốn.',
    healthyReplacementBeliefVi: 'Tôi trân trọng sự công bằng nhưng chấp nhận thế giới không phải lúc nào cũng xoay quanh ý muốn của mình.',
    healthyReplacementBeliefEn: 'I prefer fairness while accepting that life and people do not always conform to my wishes.',
  },
  {
    id: 'submissiveness',
    category: 'Interpersonal',
    nameVi: '12. Phục tùng & Tự Đặt Mình Phía Sau (Submissiveness)',
    nameEn: '12. Submissiveness',
    typicalRuleVi: 'Nhu cầu của người khác luôn quan trọng hơn nhu cầu và giấc ngủ của tôi.',
    healthyReplacementBeliefVi: 'Nhu cầu, sức khỏe và giấc ngủ của tôi có giá trị ngang bằng với mọi người khác.',
    healthyReplacementBeliefEn: 'My needs, health, and sleep matter just as much as anyone else’s.',
  },
  {
    id: 'hopelessness',
    category: 'Individual',
    nameVi: '13. Tuyệt vọng Đóng khung (Hopelessness)',
    nameEn: '13. Chronic Hopelessness',
    typicalRuleVi: 'Vấn đề của tôi sẽ không bao giờ có thể cải thiện được dù tôi có làm gì đi nữa.',
    healthyReplacementBeliefVi: 'Cảm giác tuyệt vọng là triệu chứng của trầm cảm chứ không phải lời tiên tri về tương lai.',
    healthyReplacementBeliefEn: 'Hopelessness is a symptom of depression, not an accurate prophecy of the future.',
  },
  {
    id: 'worthlessness-inferiority',
    category: 'Individual',
    nameVi: '14. Tự ti & Vô giá trị (Worthlessness / Inferiority)',
    nameEn: '14. Worthlessness & Inferiority',
    typicalRuleVi: 'Về bản chất tôi kém cỏi và thua kém những người xung quanh.',
    healthyReplacementBeliefVi: 'Mọi con người đều có những điểm mạnh và giới hạn riêng; không tồn tại thang đo "giá trị con người" chung.',
    healthyReplacementBeliefEn: 'Every human has unique strengths and limits; there is no global hierarchy of human worth.',
  },
  {
    id: 'spotlight-fallacy',
    category: 'Interpersonal',
    nameVi: '15. Ảo tưởng Ánh đèn Sân khấu (Spotlight Fallacy)',
    nameEn: '15. Spotlight Fallacy',
    typicalRuleVi: 'Mọi người luôn chú ý soi xét từng lỗi nhỏ và sự lúng túng của tôi.',
    healthyReplacementBeliefVi: 'Phần lớn mọi người đều đang bận tâm tới cuộc sống của chính họ chứ không soi xét tôi.',
    healthyReplacementBeliefEn: 'Most people are focused on their own lives rather than scrutinizing my minor missteps.',
  },
  {
    id: 'brushfire-fallacy',
    category: 'Interpersonal',
    nameVi: '16. Ảo tưởng Cháy rừng (Brushfire Fallacy)',
    nameEn: '16. Brushfire Fallacy',
    typicalRuleVi: 'Nếu một người chê tôi, tin đồn đó sẽ lan ra và tất cả mọi người đều sẽ coi thường tôi.',
    healthyReplacementBeliefVi: 'Ý kiến của một cá nhân chỉ là góc nhìn riêng lẻ của họ, không đại diện cho cả thế giới.',
    healthyReplacementBeliefEn: 'One person’s opinion is just a single perspective, not a contagious universal verdict.',
  },
  {
    id: 'magic-thinking-worry',
    category: 'Individual',
    nameVi: '17. Tư duy Ma thuật về Lo âu (Hyper-Vigilance Magic Belief)',
    nameEn: '17. Hyper-Vigilance Worry Belief',
    typicalRuleVi: 'Nếu tôi không lo lắng và căng thẳng liên tục, thảm họa sẽ ập đến khi tôi mất cảnh giác.',
    healthyReplacementBeliefVi: 'Chuẩn bị thực tế khác với tự hành hạ bằng lo âu; sự bình tĩnh giúp tôi xử lý tình huống tốt hơn.',
    healthyReplacementBeliefEn: 'Practical preparation helps, whereas chronic anxiety only drains the clarity needed to respond well.',
  },
  {
    id: 'emotional-reasoning-belief',
    category: 'Individual',
    nameVi: '18. Đồng nhất Cảm xúc với Sự thật (Emotional Truth Fallacy)',
    nameEn: '18. Emotional Truth Fallacy',
    typicalRuleVi: 'Vì tôi cảm thấy tội lỗi/vô dụng rất mạnh nên chắc chắn tôi phải là kẻ tồi tệ.',
    healthyReplacementBeliefVi: 'Cảm xúc phản ánh suy nghĩ hiện tại của tôi, không phải bằng chứng pháp lý về sự thật.',
    healthyReplacementBeliefEn: 'Emotions reflect my current thoughts, not objective evidence of reality.',
  },
  {
    id: 'Low-frustration-tolerance',
    category: 'Individual',
    nameVi: '19. Ngưỡng Chịu đựng Khó khăn Thấp (Low Frustration Tolerance)',
    nameEn: '19. Low Frustration Tolerance',
    typicalRuleVi: 'Mọi việc phải luôn dễ dàng; tôi không thể chịu đựng được sự khó chịu hay trì hoãn.',
    healthyReplacementBeliefVi: 'Tôi hoàn toàn có thể bước qua cảm giác khó chịu tạm thời để đạt được mục tiêu dài hạn.',
    healthyReplacementBeliefEn: 'I can tolerate temporary discomfort in the service of my long-term values.',
  },
  {
    id: 'control-fallacy',
    category: 'Individual',
    nameVi: '20. Nghiện Kiểm soát Tuyệt đối (Omnipotent Control Belief)',
    nameEn: '20. Omnipotent Control Fallacy',
    typicalRuleVi: 'Tôi phải kiểm soát được 100% mọi kết quả và sự bất định trong tương lai.',
    healthyReplacementBeliefVi: 'Tôi làm tốt phần trong tầm tay và thực hành Chấp nhận Triệt để (Radical Acceptance) với phần bất định.',
    healthyReplacementBeliefEn: 'I focus on what is within my control and practice Radical Acceptance for uncertainty.',
  },
  {
    id: 'martyrdom-burnout',
    category: 'Interpersonal',
    nameVi: '21. Chủ nghĩa Tử vì đạo / Tự Hy sinh Kiệt quệ (Martyrdom)',
    nameEn: '21. Martyrdom & Self-Sacrifice',
    typicalRuleVi: 'Chăm sóc bản thân hay nghỉ ngơi là ích kỷ; tôi phải gánh vác hết cho mọi người.',
    healthyReplacementBeliefVi: 'Chăm sóc sức khỏe và giấc ngủ của mình là điều kiện tiên quyết để tôi có thể đồng hành bền vững với người thân.',
    healthyReplacementBeliefEn: 'Protecting my own health and rest is essential for sustainably caring for others.',
  },
  {
    id: 'vulnerability-phobia',
    category: 'Interpersonal',
    nameVi: '22. Sợ Bộc lộ Cảm xúc (Emotional Vulnerability Phobia)',
    nameEn: '22. Fear of Emotional Vulnerability',
    typicalRuleVi: 'Chia sẻ nỗi buồn hay xin trợ giúp là dấu hiệu của sự yếu đuối đáng xấu hổ.',
    healthyReplacementBeliefVi: 'Dám chia sẻ và kết nối khi khó khăn là biểu hiện của lòng dũng cảm và trí tuệ cảm xúc.',
    healthyReplacementBeliefEn: 'Reaching out and sharing honestly requires courage and emotional wisdom.',
  },
  {
    id: 'superhuman-mania-belief',
    category: 'Individual',
    nameVi: '23. Niềm tin Siêu nhân Không Cần Nghỉ (Superhuman / Hypomania Belief)',
    nameEn: '23. Superhuman Invincibility Belief',
    typicalRuleVi: 'Khi đang hứng khởi, tôi không cần ngủ hay tuân thủ nhịp sinh học như người bình thường.',
    healthyReplacementBeliefVi: 'Bộ não sáng tạo nhất là bộ não được bảo vệ bởi giấc ngủ 7–8 tiếng và nhịp sinh học IPSRT ổn định.',
    healthyReplacementBeliefEn: 'My best creativity and stability depend on protecting 7–8 hours of sleep and IPSRT rhythms.',
  },
] as const;

export interface DownwardArrowInput {
  initialAutomaticThought: string;
  arrowChains: string[]; // 2-4 "If that were true, what would it mean to you?" steps
  advantagesOfKeepingBelief: string[];
  disadvantagesOfKeepingBelief: string[];
  advantagesWeightPercent: number; // e.g. 20
  disadvantagesWeightPercent: number; // e.g. 80
}

export interface DownwardArrowEvaluation {
  uncoveredSDBs: SelfDefeatingBeliefCatalogItem[];
  costBenefitRatio: string;
  readyToAdoptHealthyBelief: boolean;
  recommendedHealthyBeliefVi: string;
  recommendedHealthyBeliefEn: string;
  summaryVi: string;
  summaryEn: string;
}

export function evaluateDownwardArrowSDB(
  input: DownwardArrowInput
): DownwardArrowEvaluation {
  const combinedText = [input.initialAutomaticThought, ...input.arrowChains].join(' ');
  const matches: SelfDefeatingBeliefCatalogItem[] = [];

  if (/(hoàn hảo|sai sót|mistake|flawless|perfect)/i.test(combinedText)) {
    matches.push(SELF_DEFEATING_BELIEFS_23_CATALOG[0]!);
  }
  if (/(thành tích|thất bại|vô dụng|năng suất|achievement|worthless|failure|career)/i.test(combinedText)) {
    matches.push(SELF_DEFEATING_BELIEFS_23_CATALOG[2]!);
  }
  if (/(công nhận|hài lòng|chê|phán xét|approval|disapprove|criticize)/i.test(combinedText)) {
    matches.push(SELF_DEFEATING_BELIEFS_23_CATALOG[4]!);
  }
  if (/(một mình|cô đơn|không ai yêu|alone|lonely|unlovable)/i.test(combinedText)) {
    matches.push(SELF_DEFEATING_BELIEFS_23_CATALOG[5]!);
  }
  if (/(xung đột|từ chối|nói không|phật ý|conflict|say no|angry at me)/i.test(combinedText)) {
    matches.push(SELF_DEFEATING_BELIEFS_23_CATALOG[7]!);
  }
  if (matches.length === 0) {
    matches.push(SELF_DEFEATING_BELIEFS_23_CATALOG[0]!);
  }

  const primary = matches[0]!;
  const ready = input.disadvantagesWeightPercent > input.advantagesWeightPercent;

  return {
    uncoveredSDBs: matches,
    costBenefitRatio: `${input.advantagesWeightPercent}% Lợi / ${input.disadvantagesWeightPercent}% Hại`,
    readyToAdoptHealthyBelief: ready,
    recommendedHealthyBeliefVi: primary.healthyReplacementBeliefVi,
    recommendedHealthyBeliefEn: primary.healthyReplacementBeliefEn,
    summaryVi: `Chuỗi Mũi tên Đi xuống đã chạm tới Niềm tin Gốc: "${primary.nameVi}". Phân tích Lợi-Hại (${input.advantagesWeightPercent}% lợi ích / ${input.disadvantagesWeightPercent}% cái giá phải trả) cho thấy niềm tin này gây hại nhiều hơn lợi. Niềm tin thay thế lành mạnh: "${primary.healthyReplacementBeliefVi}"`,
    summaryEn: `Downward Arrow uncovered Core SDB: "${primary.nameEn}". Cost-Benefit Analysis (${input.advantagesWeightPercent}% pros / ${input.disadvantagesWeightPercent}% cons) confirms the belief costs far more than it helps. Healthy replacement belief: "${primary.healthyReplacementBeliefEn}"`,
  };
}

// ============================================================================
// 5. DBT `ABC PLEASE` DAILY RESILIENCE + `ACCEPTS` & `5-SENSES SELF-SOOTHE`
// ============================================================================

export interface AbcPleaseChecklistInput {
  accumulatePositivesDone: boolean;
  buildMasteryDone: boolean;
  copeAheadPlanDone: boolean;
  physicaIllnessAndMedsTaken: boolean;
  balancedEatingDone: boolean;
  avoidedMoodAlteringSubstances: boolean;
  balancedSleepDone: boolean;
  getExerciseDone: boolean;
}

export interface AbcPleaseEvaluation {
  completedCount: number;
  totalPillars: 8;
  resilienceScorePercent: number;
  vulnerabilityFlagsVi: string[];
  vulnerabilityFlagsEn: string[];
  summaryVi: string;
  summaryEn: string;
}

export function evaluateDbtAbcPlease(
  input: AbcPleaseChecklistInput
): AbcPleaseEvaluation {
  const flagsVi: string[] = [];
  const flagsEn: string[] = [];

  if (!input.physicaIllnessAndMedsTaken) {
    flagsVi.push('PL (Physical Illness/Meds): Chưa uống thuốc đúng giờ hoặc chưa chăm sóc triệu chứng cơ thể');
    flagsEn.push('PL (Physical Illness/Meds): Medication or physical health care missed');
  }
  if (!input.balancedEatingDone) {
    flagsVi.push('E (Eating): Bỏ bữa hoặc ăn uống thất thường làm hạ đường huyết/tăng cáu gắt');
    flagsEn.push('E (Eating): Irregular nutrition increasing emotional vulnerability');
  }
  if (!input.avoidedMoodAlteringSubstances) {
    flagsVi.push('A (Avoid substances): Sử dụng quá nhiều caffeine/rượu bia gây bất ổn thần kinh');
    flagsEn.push('A (Avoid substances): Excess caffeine or alcohol destabilizing mood');
  }
  if (!input.balancedSleepDone) {
    flagsVi.push('S (Sleep): Thiếu ngủ hoặc thức quá khuya — yếu tố dễ tổn thương hàng đầu');
    flagsEn.push('S (Sleep): Sleep disruption — primary biological vulnerability factor');
  }
  if (!input.getExerciseDone) {
    flagsVi.push('E (Exercise): Chưa vận động nhẹ nhàng 15-20 phút hôm nay');
    flagsEn.push('E (Exercise): No gentle physical movement logged today');
  }

  const bools = [
    input.accumulatePositivesDone,
    input.buildMasteryDone,
    input.copeAheadPlanDone,
    input.physicaIllnessAndMedsTaken,
    input.balancedEatingDone,
    input.avoidedMoodAlteringSubstances,
    input.balancedSleepDone,
    input.getExerciseDone,
  ];
  const completedCount = bools.filter(Boolean).length;
  const resilienceScorePercent = Math.round((completedCount / 8) * 100);

  return {
    completedCount,
    totalPillars: 8,
    resilienceScorePercent,
    vulnerabilityFlagsVi: flagsVi,
    vulnerabilityFlagsEn: flagsEn,
    summaryVi: `Chỉ số Sức bền Cảm xúc DBT ABC PLEASE: ${resilienceScorePercent}% (${completedCount}/8 trụ cột). ${flagsVi.length === 0 ? 'Nền tảng sinh lý và tâm lý hôm nay rất vững vàng!' : `Cần lưu ý bù đắp ${flagsVi.length} yếu tố dễ tổn thương sinh học.`}`,
    summaryEn: `DBT ABC PLEASE Emotional Resilience Score: ${resilienceScorePercent}% (${completedCount}/8 pillars). ${flagsEn.length === 0 ? 'Strong physiological and psychological shield today!' : `Address ${flagsEn.length} biological vulnerability factor(s).`}`,
  };
}

export interface AcceptsAndSelfSoothePlan {
  acceptsCards: Array<{
    letter: string;
    nameVi: string;
    nameEn: string;
    microActionVi: string;
    microActionEn: string;
  }>;
  fiveSensesCards: Array<{
    senseVi: string;
    senseEn: string;
    sootheActionVi: string;
    sootheActionEn: string;
  }>;
}

export function buildDbtAcceptsAndSelfSoothePlan(): AcceptsAndSelfSoothePlan {
  return {
    acceptsCards: [
      {
        letter: 'A',
        nameVi: 'Hoạt động lôi cuốn',
        nameEn: 'Activities',
        microActionVi: 'Đi bộ nhanh 10 phút, gấp quần áo hoặc sắp xếp lại góc bàn làm việc.',
        microActionEn: 'Take a 10-minute walk, fold laundry, or organize one desk drawer.',
      },
      {
        letter: 'C',
        nameVi: 'Giúp đỡ người khác',
        nameEn: 'Contributing',
        microActionVi: 'Gửi 1 lời hỏi thăm chân thành hoặc giúp đỡ một việc nhỏ cho người thân.',
        microActionEn: 'Send a kind check-in message or do a small helpful act for someone.',
      },
      {
        letter: 'C',
        nameVi: 'So sánh tạo góc nhìn',
        nameEn: 'Comparisons',
        microActionVi: 'Nhớ lại một giai đoạn khó khăn trước đây mà bạn đã kiên cường vượt qua được.',
        microActionEn: 'Recall a tougher past crisis that you survived and grew through.',
      },
      {
        letter: 'E',
        nameVi: 'Tạo cảm xúc đối nghịch',
        nameEn: 'Opposite Emotions',
        microActionVi: 'Xem một trích đoạn hài hước nhẹ nhàng hoặc nghe bản nhạc mang lại cảm giác bình yên.',
        microActionEn: 'Watch a lighthearted comedy clip or listen to a soothing melody.',
      },
      {
        letter: 'P',
        nameVi: 'Tạm cất lên kệ',
        nameEn: 'Pushing Away Temporarily',
        microActionVi: 'Hình dung đặt vấn đề chưa giải quyết được vào chiếc hộp khóa trên kệ trong 2 giờ tới.',
        microActionEn: 'Visualize placing the unresolvable problem in a locked box on a shelf for 2 hours.',
      },
      {
        letter: 'T',
        nameVi: 'Đổi hướng suy nghĩ',
        nameEn: 'Competing Thoughts',
        microActionVi: 'Đếm ngược từ 100 trừ đi 7 (100, 93, 86...) hoặc liệt kê 10 thành phố bắt đầu bằng chữ H.',
        microActionEn: 'Count backward from 100 by 7s or name 10 cities starting with the letter S.',
      },
      {
        letter: 'S',
        nameVi: 'Cảm giác an toàn mạnh mẽ',
        nameEn: 'Safe Intense Sensations',
        microActionVi: 'Cầm một viên đá mát trong lòng bàn tay hoặc tắm nước ấm xen kẽ mát nhẹ.',
        microActionEn: 'Hold a cool ice cube in your palm or splash cool water on your wrists.',
      },
    ],
    fiveSensesCards: [
      {
        senseVi: '1. Thị giác (Ngắm nhìn bình yên)',
        senseEn: '1. Vision',
        sootheActionVi: 'Ngắm tán cây xanh ngoài cửa sổ, bầu trời chiều hoặc ánh đèn vàng ấm áp.',
        sootheActionEn: 'Gaze at green trees outside, clouds, or soft warm amber lighting.',
      },
      {
        senseVi: '2. Thính giác (Lắng nghe êm dịu)',
        senseEn: '2. Hearing',
        sootheActionVi: 'Lắng nghe tiếng mưa rơi, sóng biển hoặc âm thanh tần số 174Hz/220Hz offline.',
        sootheActionEn: 'Listen to rainfall, ocean waves, or the offline 174Hz/220Hz ambient synth.',
      },
      {
        senseVi: '3. Khứu giác (Hương thơm nhẹ nhàng)',
        senseEn: '3. Smell',
        sootheActionVi: 'Ngửi hương tinh dầu oải hương, sả chanh hoặc tách trà thảo mộc ấm.',
        sootheActionEn: 'Inhale lavender essential oil, lemongrass, or warm herbal tea.',
      },
      {
        senseVi: '4. Vị giác (Nhâm nhi ấm áp)',
        senseEn: '4. Taste',
        sootheActionVi: 'Nhấp từng ngụm chậm trà hoa cúc ấm hoặc một miếng sô-cô-la đen nhỏ.',
        sootheActionEn: 'Slowly sip warm chamomile tea or savor a small piece of dark chocolate.',
      },
      {
        senseVi: '5. Xúc giác (Chạm êm ái)',
        senseEn: '5. Touch',
        sootheActionVi: 'Quấn một chiếc chăn mềm quanh vai hoặc đặt bàn tay ấm lên vùng ngực trái.',
        sootheActionEn: 'Wrap a soft blanket around your shoulders or place a warm hand over your heart.',
      },
    ],
  };
}

// ============================================================================
// 6. CBT-I SLEEP DIARY & SLEEP EFFICIENCY CALCULATOR WITH BIPOLAR MANIA GUARD
// ============================================================================

export interface CbtiSleepDiaryInput {
  timeInBedHours: number;        // e.g. 8.5
  totalSleepTimeHours: number;   // e.g. 6.0
  sleepOnsetLatencyMinutes: number;
  wakeAfterSleepOnsetMinutes: number;
  feltNeedForSleep: FeltNeedForSleep;
  moodPolarity?: MoodPole;
}

export interface CbtiSleepEvaluation {
  sleepEfficiencyPercent: number;
  sleepRestrictionContraindicatedByManiaGuard: boolean;
  recommendedProtocolCode:
    | 'bipolar-dark-therapy-mania-guard'
    | 'cbti-stimulus-control-and-consolidation'
    | 'healthy-sleep-maintenance';
  guidanceVi: string;
  guidanceEn: string;
}

export function evaluateCbtiSleepEfficiency(
  input: CbtiSleepDiaryInput
): CbtiSleepEvaluation {
  const safeBedHours = Math.max(0.5, input.timeInBedHours);
  const clampedSleep = Math.min(safeBedHours, Math.max(0, input.totalSleepTimeHours));
  const sleepEfficiencyPercent = Math.round((clampedSleep / safeBedHours) * 100);

  // CRITICAL CLINICAL GUARD: Never recommend CBT-I Sleep Restriction when feltNeedForSleep is reduced/none or moodPolarity >= +2
  const maniaGuardTriggered =
    input.feltNeedForSleep === 'reduced_need' ||
    input.feltNeedForSleep === 'no_need_at_all' ||
    (input.moodPolarity ?? 0) >= 2;

  if (maniaGuardTriggered) {
    return {
      sleepEfficiencyPercent,
      sleepRestrictionContraindicatedByManiaGuard: true,
      recommendedProtocolCode: 'bipolar-dark-therapy-mania-guard',
      guidanceVi:
        'CHẶN AN TOÀN LƯỠNG CỰC (Bipolar Mania Contraindication Guard): Phát hiện Giảm nhu cầu ngủ / Không thấy cần ngủ hoặc Khí sắc >= +2. TUYỆT ĐỐI KHÔNG áp dụng kỹ thuật Hạn chế Giấc ngủ (CBT-I Sleep Restriction) vì thiếu ngủ sẽ kích hoạt cơn Hưng cảm. Chuyển sang Liệu pháp Bóng tối (Dark Therapy 22:00–06:00) và nằm nghỉ trong phòng tối yên tĩnh.',
      guidanceEn:
        'BIPOLAR MANIA CONTRAINDICATION GUARD: Reduced need for sleep or elevated mood (>= +2) detected. CBT-I Sleep Restriction is STRICTLY CONTRAINDICATED because sleep deprivation triggers mania. Switching to Dark Therapy (22:00–06:00) and low-stimulus dark rest.',
    };
  }

  if (sleepEfficiencyPercent < 85 || input.sleepOnsetLatencyMinutes > 30 || input.wakeAfterSleepOnsetMinutes > 30) {
    return {
      sleepEfficiencyPercent,
      sleepRestrictionContraindicatedByManiaGuard: false,
      recommendedProtocolCode: 'cbti-stimulus-control-and-consolidation',
      guidanceVi: `Hiệu suất Giấc ngủ CBT-I đạt ${sleepEfficiencyPercent}% (< 85% kèm cảm giác mệt mỏi khi thiếu ngủ — Mất ngủ thực sự). Khuyến nghị Kiểm soát Kích thích (Stimulus Control): Chỉ lên giường khi buồn ngủ, rời giường đọc sách nhẹ dưới ánh đèn vàng nếu trằn trọc > 20 phút, và giữ cố định giờ thức dậy IPSRT buổi sáng.`,
      guidanceEn: `CBT-I Sleep Efficiency is ${sleepEfficiencyPercent}% (< 85% with daytime fatigue — true insomnia). Apply Stimulus Control: use bed only for sleep, do a quiet dim-light wind-down if awake > 20 min, and keep a fixed IPSRT morning wake anchor.`,
    };
  }

  return {
    sleepEfficiencyPercent,
    sleepRestrictionContraindicatedByManiaGuard: false,
    recommendedProtocolCode: 'healthy-sleep-maintenance',
    guidanceVi: `Hiệu suất Giấc ngủ CBT-I rất tốt (${sleepEfficiencyPercent}% >= 85%). Hãy tiếp tục duy trì mốc giờ thức dậy và giờ tắt màn hình ban đêm.`,
    guidanceEn: `Healthy CBT-I Sleep Efficiency (${sleepEfficiencyPercent}% >= 85%). Continue maintaining your consistent wake anchor and evening wind-down.`,
  };
}

// ============================================================================
// 7. DBT `RADICAL ACCEPTANCE` & `URGE SURFING` 90-SECOND ADRENALINE WAVE TIMER
// ============================================================================

export interface UrgeSurfingWaveFrame {
  elapsedSeconds: number;
  remainingSeconds: number;
  waveHeightPercent: number; // 0-100 bell curve of the 90s catecholamine wave
  phase: 'rising-crest' | 'peak-surfing' | 'subsiding-shore' | 'wave-complete';
  coachingVi: string;
  coachingEn: string;
}

export function computeUrgeSurfingWaveFrame(
  elapsedSeconds: number
): UrgeSurfingWaveFrame {
  const clamped = Math.max(0, Math.min(90, elapsedSeconds));
  const remainingSeconds = 90 - clamped;
  // Smooth sine bell curve peaking at 45s
  const waveHeightPercent = Math.round(Math.sin((clamped / 90) * Math.PI) * 100);

  if (clamped < 30) {
    return {
      elapsedSeconds: clamped,
      remainingSeconds,
      waveHeightPercent,
      phase: 'rising-crest',
      coachingVi:
        'Pha 1 (0–30s — Sóng đang dâng): Chấp nhận Triệt để (Radical Acceptance) cảm giác cơ thể lúc này. Không chống cự, không dùng hành vi an toàn — chỉ đặt tên: "Một cơn sóng adrenaline đang dâng lên".',
      coachingEn:
        'Phase 1 (0–30s — Rising Wave): Practice Radical Acceptance of bodily sensations. Do not fight or perform safety behaviors—simply label: "An adrenaline wave is rising."',
    };
  }

  if (clamped < 60) {
    return {
      elapsedSeconds: clamped,
      remainingSeconds,
      waveHeightPercent,
      phase: 'peak-surfing',
      coachingVi:
        'Pha 2 (30–60s — Lướt trên đỉnh sóng): Cơn sóng đang ở đỉnh sinh hóa. Giữ hơi thở ra dài hơn hít vào (4-6) và thả lỏng vai/hàm (Willing Hands). Mọi cơn sóng đều phải đổ xuống.',
      coachingEn:
        'Phase 2 (30–60s — Surfing the Crest): The neurochemical wave is at its peak. Keep exhales longer than inhales (4-6) with Willing Hands. Every wave peaks and must fall.',
    };
  }

  if (clamped < 90) {
    return {
      elapsedSeconds: clamped,
      remainingSeconds,
      waveHeightPercent,
      phase: 'subsiding-shore',
      coachingVi:
        'Pha 3 (60–90s — Sóng rút dần vào bờ): Adrenaline đang được phân giải tự nhiên khi bạn không tiếp thêm củi lo âu thứ cấp.',
      coachingEn:
        'Phase 3 (60–90s — Subsiding to Shore): Adrenaline is metabolizing naturally because you did not feed it secondary panic.',
    };
  }

  return {
    elapsedSeconds: 90,
    remainingSeconds: 0,
    waveHeightPercent: 0,
    phase: 'wave-complete',
    coachingVi:
      'Hoàn tất 90 giây Lướt Sóng: Bạn đã đi xuyên qua cơn sóng lo âu mà không cần hành vi an toàn hay né tránh. Bộ não vừa học được rằng bạn hoàn toàn an toàn.',
    coachingEn:
      '90-Second Wave Complete: You surfed the full adrenaline wave without safety behaviors or avoidance. Your amygdala just recorded a new safety memory.',
  };
}

// ============================================================================
// 8. MULTI-AXIS BIPOLAR DUAL-POLE (-5..+5) MOOD, ENERGY & SLEEP CHART BUILDER
// ============================================================================

export interface BipolarMultiAxisDayPoint {
  dateLabel: string;
  moodPolarity: MoodPole;
  energyLevel: MoodPole;
  sleepHours: number;
  feltNeedForSleep: FeltNeedForSleep;
}

export interface BipolarMultiAxisSvgChartData {
  width: number;
  height: number;
  zeroLineY: number;
  maniaThresholdY: number;
  depressionThresholdY: number;
  moodPolylinePoints: string;
  energyPolylinePoints: string;
  points: Array<
    BipolarMultiAxisDayPoint & {
      x: number;
      moodY: number;
      energyY: number;
      sleepBarHeight: number;
      isMixedRisk: boolean;
      isManiaProdromeRisk: boolean;
    }
  >;
}

export function buildBipolarMultiAxisSvgChart(
  days: BipolarMultiAxisDayPoint[],
  width = 640,
  height = 220
): BipolarMultiAxisSvgChartData {
  const padX = 44;
  const padY = 24;
  const plotW = width - padX * 2;
  const plotH = height - padY * 2;
  const poleToY = (pole: number) =>
    Math.round(padY + ((5 - Math.max(-5, Math.min(5, pole))) / 10) * plotH);

  const count = Math.max(1, days.length);
  const stepX = count > 1 ? plotW / (count - 1) : 0;

  const points = days.map((d, idx) => {
    const x = Math.round(padX + idx * stepX);
    const moodY = poleToY(d.moodPolarity);
    const energyY = poleToY(d.energyLevel);
    const sleepBarHeight = Math.round((Math.min(12, Math.max(0, d.sleepHours)) / 12) * plotH);
    const isMixedRisk = d.moodPolarity <= -2 && d.energyLevel >= 2;
    const isManiaProdromeRisk =
      d.moodPolarity >= 2 || (d.sleepHours < 5 && d.feltNeedForSleep !== 'exhausted');
    return {
      ...d,
      x,
      moodY,
      energyY,
      sleepBarHeight,
      isMixedRisk,
      isManiaProdromeRisk,
    };
  });

  return {
    width,
    height,
    zeroLineY: poleToY(0),
    maniaThresholdY: poleToY(2),
    depressionThresholdY: poleToY(-2),
    moodPolylinePoints: points.map((p) => `${p.x},${p.moodY}`).join(' '),
    energyPolylinePoints: points.map((p) => `${p.x},${p.energyY}`).join(' '),
    points,
  };
}
