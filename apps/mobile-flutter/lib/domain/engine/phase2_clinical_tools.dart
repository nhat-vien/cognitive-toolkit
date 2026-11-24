// lib/domain/engine/phase2_clinical_tools.dart
// Phase 2 (Milestone 2: Sprint 3 & Sprint 4) Clinical Expansion for Flutter (Android/iOS):
// 1. Complete 36 Interactive CBT, TEAM-CBT, DBT & Bipolar Tools Catalog (`kFlutter36ClinicalTools`, length == 36)
//    and 0ms deterministic execution engine `runFlutterClinicalTool(slug, userInput, moodPolarity: ...)`.
// 2. TEAM-CBT Pleasure-Predicting (Mastery & Pleasure M/P) Sheet model & prediction-error calculator.
// 3. TEAM-CBT Anti-Procrastination 5-Minute Sheet model & difficulty/satisfaction calibrator.
// 4. Downward Arrow (23 Self-Defeating Beliefs Uncovering & Cost-Benefit Analysis) engine.
// 5. DBT `ABC PLEASE` Daily Checklist + `ACCEPTS` & `5-Senses Self-Soothe` + `Radical Acceptance / Urge Surfing` guide.
// 6. CBT-I Sleep Efficiency Calculator with Bipolar Mania Contraindication Guard
//    (blocks sleep restriction if `feltNeedForSleep` is reducedNeed or noNeedAtAll).

import '../models/clinical_models.dart';
import 'distortion_detector.dart';

class FlutterClinicalToolDescriptor {
  final int number;
  final String slug;
  final String titleVi;
  final String titleEn;
  final String category; // 'CBT-Core' | 'TEAM-CBT' | 'Anxiety-ERP' | 'Depression-BA' | 'DBT' | 'Bipolar-IPSRT'
  final String modality; // 'CBT' | 'TEAM-CBT' | 'DBT' | 'Bipolar-CBT'
  final String clinicalSummaryVi;
  final String promptHintVi;
  final String reframeTemplateVi;
  final List<String> applicableConditions; // ['RLLA', 'TC', 'RLLC']

  const FlutterClinicalToolDescriptor({
    required this.number,
    required this.slug,
    required this.titleVi,
    required this.titleEn,
    required this.category,
    required this.modality,
    required this.clinicalSummaryVi,
    required this.promptHintVi,
    required this.reframeTemplateVi,
    this.applicableConditions = const ['RLLA', 'TC', 'RLLC'],
  });
}

class FlutterClinicalToolExecutionResult {
  final FlutterClinicalToolDescriptor tool;
  final String userInput;
  final int moodPolarity;
  final bool safetyStopTriggered;
  final bool requiresTippFirst;
  final bool hypomaniaGuardActive;
  final List<String> detectedNegativeDistortions;
  final List<String> detectedPositiveDistortions;
  final List<String> detectedSelfDefeatingBeliefs;
  final List<String> detectedSafetyBehaviors;
  final String deterministicReframeVi;
  final String socraticQuestionVi;
  final String recommendedNextActionVi;

  const FlutterClinicalToolExecutionResult({
    required this.tool,
    required this.userInput,
    required this.moodPolarity,
    required this.safetyStopTriggered,
    required this.requiresTippFirst,
    required this.hypomaniaGuardActive,
    required this.detectedNegativeDistortions,
    required this.detectedPositiveDistortions,
    required this.detectedSelfDefeatingBeliefs,
    required this.detectedSafetyBehaviors,
    required this.deterministicReframeVi,
    required this.socraticQuestionVi,
    required this.recommendedNextActionVi,
  });
}

/// Complete Catalog of 36 Interactive CBT, TEAM-CBT, DBT & Bipolar Tools (`length == 36`).
const List<FlutterClinicalToolDescriptor> kFlutter36ClinicalTools = [
  // --- I. CBT CORE & COGNITIVE RESTRUCTURING (Tools 1..10) ---
  FlutterClinicalToolDescriptor(
    number: 1,
    slug: 'cognitive-distortion-checker',
    titleVi: '1. Quét 11 Biến dạng Nhận thức Âm tính (Cognitive Distortion Checker)',
    titleEn: 'Cognitive Distortion Checker',
    category: 'CBT-Core',
    modality: 'CBT',
    clinicalSummaryVi:
        'Phát hiện tức thì 0ms 11 bẫy suy nghĩ tiêu cực của Aaron Beck & David Burns kèm câu hỏi Socratic.',
    promptHintVi: 'Nhập suy nghĩ tự động đang làm bạn nặng nề...',
    reframeTemplateVi:
        'Tách bạch cảm giác nhất thời khỏi sự thật khách quan trước tòa án.',
  ),
  FlutterClinicalToolDescriptor(
    number: 2,
    slug: 'thought-record-7-step',
    titleVi: '2. Nhật ký Suy nghĩ 7 Bước & Accuracy Check (7-Step Thought Record)',
    titleEn: '7-Step Thought Record with Accuracy Check',
    category: 'CBT-Core',
    modality: 'CBT',
    clinicalSummaryVi:
        'Phân tích Tình huống -> Suy nghĩ tự động -> Bằng chứng Ủng hộ/Phản bác -> Cổng Kiểm tra Độ chính xác -> Suy nghĩ Cân bằng.',
    promptHintVi: 'Mô tả sự việc khách quan như máy quay ghi lại...',
    reframeTemplateVi:
        'Đúng là có phần khó khăn thực tế, VÀ đồng thời vẫn có bằng chứng cho thấy bạn có khả năng ứng phó.',
  ),
  FlutterClinicalToolDescriptor(
    number: 3,
    slug: 'accuracy-check-split-tool',
    titleVi: '3. Cổng Tách Sự thật vs. Kết luận Phóng đại (Accuracy Check & Split)',
    titleEn: 'Accuracy Check & Cognitive Split Tool',
    category: 'CBT-Core',
    modality: 'CBT',
    clinicalSummaryVi:
        'Tránh "tích cực độc hại" khi nỗi đau có thật: Giữ lại phần sự kiện đúng (Problem-Solving/Coping) và chỉ sửa phần tự gán nhãn.',
    promptHintVi: 'Nhập suy nghĩ mà bạn tin là hoàn toàn đúng sự thật...',
    reframeTemplateVi:
        'Giữ lại dữ kiện thực tế để giải quyết vấn đề, và buông bỏ nhãn dán phán xét toàn bộ giá trị bản thân.',
  ),
  FlutterClinicalToolDescriptor(
    number: 4,
    slug: 'decatastrophizing-what-if',
    titleVi: '4. Giải Thảm họa hóa Kịch bản Xấu nhất (Decatastrophizing)',
    titleEn: 'Decatastrophizing Worst/Best/Most-Likely',
    category: 'CBT-Core',
    modality: 'CBT',
    clinicalSummaryVi:
        'Đối chiếu 3 kịch bản: Xấu nhất (kèm kế hoạch sống sót sau 1 tuần/1 tháng), Tốt nhất, và Thực tế dễ xảy ra nhất.',
    promptHintVi: 'Kịch bản thảm họa nào đang lặp đi lặp lại trong đầu bạn?',
    reframeTemplateVi:
        'Ngay cả khi kịch bản khó khăn xảy ra một phần, bạn vẫn có nguồn lực đối phó sau 7 ngày và 30 ngày.',
  ),
  FlutterClinicalToolDescriptor(
    number: 5,
    slug: 'prediction-calibration-tracker',
    titleVi: '5. Hiệu chỉnh Dự đoán Thảm họa (Prediction Calibration Tracker)',
    titleEn: 'Prediction Calibration Tracker',
    category: 'CBT-Core',
    modality: 'CBT',
    clinicalSummaryVi:
        'Ghi lại xác suất lo sợ (0–100%) trước sự kiện và đối chiếu kết quả thực tế để hiệu chỉnh hệ thống báo động hạnh nhân.',
    promptHintVi: 'Bạn dự đoán điều tồi tệ gì sẽ xảy ra với xác suất bao nhiêu %?',
    reframeTemplateVi:
        'Hơn 85% dự đoán thảm họa của bộ não lo âu không xảy ra như kịch bản đen tối ban đầu.',
  ),
  FlutterClinicalToolDescriptor(
    number: 6,
    slug: 'responsibility-pie-chart',
    titleVi: '6. Biểu đồ Tròn Trách nhiệm (Responsibility Pie Chart)',
    titleEn: 'Responsibility Pie Chart',
    category: 'CBT-Core',
    modality: 'CBT',
    clinicalSummaryVi:
        'Hóa giải biến dạng Cá nhân hóa & Tự đổ lỗi bằng cách chia tỷ lệ % cho các yếu tố khách quan, hoàn cảnh và người khác.',
    promptHintVi: 'Sự việc nào bạn đang tự nhận 100% lỗi về mình?',
    reframeTemplateVi:
        'Bạn chỉ chịu trách nhiệm cho phần hành động trong tầm kiểm soát của mình, không phải 100% mọi biến số của thế giới.',
  ),
  FlutterClinicalToolDescriptor(
    number: 7,
    slug: 'continuum-shades-of-gray',
    titleVi: '7. Thước đo Phổ Xám 0–100% (Continuum / Shades of Gray)',
    titleEn: 'Cognitive Continuum (Shades of Gray)',
    category: 'CBT-Core',
    modality: 'CBT',
    clinicalSummaryVi:
        'Phá vỡ tư duy Trắng-Đen (All-or-Nothing) bằng cách đặt sự việc lên phổ liên tục từ 0% đến 100%.',
    promptHintVi: 'Nhập phán xét "100% hoàn hảo hoặc thất bại hoàn toàn"...',
    reframeTemplateVi:
        'Thành công từng phần (40%–75%) vẫn là bước tiến có thật trên phổ phát triển của con người.',
  ),
  FlutterClinicalToolDescriptor(
    number: 8,
    slug: 'core-belief-positive-data-log',
    titleVi: '8. Sổ Thu thập Bằng chứng Tích cực Cốt lõi (Positive Data Log)',
    titleEn: 'Core Belief Tracker & Positive Data Log',
    category: 'CBT-Core',
    modality: 'CBT',
    clinicalSummaryVi:
        'Ghi nhận các dữ kiện nhỏ mỗi ngày phản bác lại niềm tin cốt lõi tiêu cực ("Tôi bất lực", "Tôi không đáng yêu").',
    promptHintVi: 'Niềm tin cốt lõi tiêu cực hoặc 1 việc nhỏ bạn đã làm được hôm nay...',
    reframeTemplateVi:
        'Mỗi hành động nhỏ đều là một viên gạch bằng chứng xây dựng lại niềm tin cốt lõi khỏe mạnh.',
  ),
  FlutterClinicalToolDescriptor(
    number: 9,
    slug: 'fact-vs-opinion-separator',
    titleVi: '9. Bộ Lọc Sự thật vs. Suy diễn Tâm trí (Fact vs. Story Separator)',
    titleEn: 'Fact vs. Opinion Camera Lens Separator',
    category: 'CBT-Core',
    modality: 'CBT',
    clinicalSummaryVi:
        'Kiểm tra dữ kiện bằng "Bài test Máy quay Tòa án": Tách hành vi quan sát được khỏi câu chuyện đọc suy nghĩ.',
    promptHintVi: 'Nhập câu chuyện tâm trí đang kể về người khác hoặc bản thân...',
    reframeTemplateVi:
        'Máy quay chỉ ghi nhận sự kiện bề mặt; câu chuyện đằng sau là giả thuyết cần được kiểm chứng chứ không phải bản án.',
  ),
  FlutterClinicalToolDescriptor(
    number: 10,
    slug: 'semantic-should-to-preference',
    titleVi: '10. Chuyển hóa Mệnh lệnh "Phải/Nên" (Semantic Method: Should -> Prefer)',
    titleEn: 'Semantic Method (Shoulds to Preferences)',
    category: 'CBT-Core',
    modality: 'CBT',
    clinicalSummaryVi:
        'Thay thế từ "Tôi bắt buộc phải / Lẽ ra tôi phải" bằng "Tôi mong muốn / Sẽ tốt hơn nếu..." để hạ áp lực tội lỗi.',
    promptHintVi: 'Nhập câu mệnh lệnh "Tôi phải..." hoặc "Họ lẽ ra phải..."',
    reframeTemplateVi:
        'Thay "Tôi bắt buộc phải hoàn hảo" bằng "Tôi ưu tiên cố gắng trong khả năng hiện tại và tôn trọng giới hạn con người".',
  ),

  // --- II. TEAM-CBT (DAVID BURNS) RESISTANCE & ROLEPLAY (Tools 11..18) ---
  FlutterClinicalToolDescriptor(
    number: 11,
    slug: 'paradoxical-agenda-setting',
    titleVi: '11. Làm tan Kháng cự Nghịch lý (TEAM-CBT Paradoxical Agenda Setting)',
    titleEn: 'TEAM-CBT Paradoxical Agenda Setting',
    category: 'TEAM-CBT',
    modality: 'TEAM-CBT',
    clinicalSummaryVi:
        'Magic Button + Positive Reframing + Magic Dial: Tôn vinh những giá trị tốt đẹp ẩn sau triệu chứng lo âu/trầm cảm trước khi thay đổi.',
    promptHintVi: 'Triệu chứng lo âu/tự chỉ trích này đang nói lên phẩm chất đáng quý nào của bạn?',
    reframeTemplateVi:
        'Sự lo âu/tự trách cho thấy bạn là người có trách nhiệm và biết quan tâm sâu sắc. Bạn có thể giữ lại giá trị đẹp đẽ đó mà chỉ vặn nhỏ nỗi đau xuống 20–30% trên Magic Dial.',
  ),
  FlutterClinicalToolDescriptor(
    number: 12,
    slug: 'pleasure-predicting-sheet',
    titleVi: '12. Bảng Dự đoán Niềm vui & Thành tựu M/P (Pleasure-Predicting Sheet)',
    titleEn: 'TEAM-CBT Pleasure-Predicting (Mastery & Pleasure) Sheet',
    category: 'TEAM-CBT',
    modality: 'TEAM-CBT',
    clinicalSummaryVi:
        'Đối chiếu Niềm vui & Cảm giác hoàn thành Dự đoán vs. Thực tế để phá vỡ ảo tưởng vô cảm (anhedonia) và "phải có đôi mới vui".',
    promptHintVi: 'Nhập hoạt động bạn dự đoán sẽ không mang lại niềm vui...',
    reframeTemplateVi:
        'Khi trầm cảm, não bộ thường dự đoán niềm vui thấp hơn thực tế 30–50%. Trải nghiệm thực tế luôn mang lại điểm M/P cao hơn dự báo.',
  ),
  FlutterClinicalToolDescriptor(
    number: 13,
    slug: 'anti-procrastination-sheet',
    titleVi: '13. Bảng Chống Trì hoãn 5 Phút (Anti-Procrastination 5-Minute Sheet)',
    titleEn: 'TEAM-CBT Anti-Procrastination 5-Minute Sheet',
    category: 'TEAM-CBT',
    modality: 'TEAM-CBT',
    clinicalSummaryVi:
        'Chia việc lớn thành bước 5 phút, đo Độ khó Dự đoán vs. Thực tế để chứng minh: "Hành động đi trước, động lực theo sau".',
    promptHintVi: 'Công việc nào bạn đang trì hoãn vì cảm thấy quá nặng nề?',
    reframeTemplateVi:
        'Cam kết chỉ làm đúng 5 phút đầu tiên rồi được phép dừng sẽ hạ độ khó thực tế xuống thấp hơn rất nhiều so với tưởng tượng.',
  ),
  FlutterClinicalToolDescriptor(
    number: 14,
    slug: 'downward-arrow-23-sdb',
    titleVi: '14. Mũi tên Đi xuống Khai quật 23 SDBs (Downward Arrow & SDB Uncovering)',
    titleEn: 'Downward Arrow (Uncovering 23 Self-Defeating Beliefs)',
    category: 'TEAM-CBT',
    modality: 'TEAM-CBT',
    clinicalSummaryVi:
        'Truy tìm chuỗi "Nếu điều đó đúng thì có ý nghĩa gì với tôi?" để lộ diện 23 Niềm tin Tự hủy hoại (SDBs).',
    promptHintVi: 'Nhập suy nghĩ tự động để chạy chuỗi Mũi tên Đi xuống...',
    reframeTemplateVi:
        'Giá trị nội tại của con người không bao giờ phụ thuộc tuyệt đối vào thành tích, sự tán thưởng hay sự hoàn hảo.',
  ),
  FlutterClinicalToolDescriptor(
    number: 15,
    slug: 'cost-benefit-analysis-belief',
    titleVi: '15. Phân tích Lợi ích - Cái giá của Niềm tin (Cost-Benefit Analysis)',
    titleEn: 'TEAM-CBT Cost-Benefit Analysis (CBA)',
    category: 'TEAM-CBT',
    modality: 'TEAM-CBT',
    clinicalSummaryVi:
        'Đặt lên bàn cân Lợi ích vs. Cái giá của việc giữ một niềm tin cầu toàn, tự trách hoặc lo lắng kinh niên.',
    promptHintVi: 'Niềm tin hoặc thói quen tự ép mình nào bạn muốn đặt lên bàn cân CBA?',
    reframeTemplateVi:
        'Khi cái giá phải trả về sức khỏe tâm thần lớn hơn lợi ích bảo vệ giả tạo, bạn có quyền chọn một tiêu chuẩn nhân văn hơn.',
  ),
  FlutterClinicalToolDescriptor(
    number: 16,
    slug: 'double-standard-compassionate-friend',
    titleVi: '16. Kỹ thuật Tiêu chuẩn Kép với Bạn thân (Double-Standard Technique)',
    titleEn: 'TEAM-CBT Double-Standard Technique',
    category: 'TEAM-CBT',
    modality: 'TEAM-CBT',
    clinicalSummaryVi:
        'Đối chiếu lời tự phán xét khắc nghiệt với lời bạn sẽ nói với một người bạn thân yêu đang gặp đúng hoàn cảnh đó.',
    promptHintVi: 'Nhập câu bạn đang dùng để mắng mỏ chính mình...',
    reframeTemplateVi:
        'Bạn xứng đáng nhận được cùng một sự công bằng, dịu dàng và thấu hiểu mà bạn luôn sẵn lòng dành cho người bạn thân.',
  ),
  FlutterClinicalToolDescriptor(
    number: 17,
    slug: 'externalization-of-voices',
    titleVi: '17. Đóng vai Tách Giọng nói Tự chỉ trích (Externalization of Voices)',
    titleEn: 'TEAM-CBT Externalization of Voices Roleplay',
    category: 'TEAM-CBT',
    modality: 'TEAM-CBT',
    clinicalSummaryVi:
        'Đưa tiếng nói tự kết tội ra ngoài để phản hồi bằng sự Kết hợp giữa Tự bảo vệ (Self-Defense) và Chấp nhận Nghịch lý (Acceptance Paradox).',
    promptHintVi: 'Tiếng nói chỉ trích bên trong đang tấn công bạn bằng câu gì?',
    reframeTemplateVi:
        '[Acceptance + Self-Defense]: Đúng là tôi có những thiếu sót cụ thể của một con người đang học hỏi, nhưng tôi từ chối bản án phủ nhận toàn bộ nhân phẩm của mình.',
  ),
  FlutterClinicalToolDescriptor(
    number: 18,
    slug: 'feared-fantasy-shame-attacking',
    titleVi: '18. Đối diện Kịch bản Ác mộng & Tấn công Sự Xấu hổ (Feared Fantasy)',
    titleEn: 'Feared Fantasy & Shame-Attacking Exercise',
    category: 'TEAM-CBT',
    modality: 'TEAM-CBT',
    clinicalSummaryVi:
        'Bước thẳng vào cơn ác mộng bị phán xét xã hội bằng sự hài hước và chấp nhận để dập tắt nỗi sợ ánh đèn sân khấu.',
    promptHintVi: 'Bạn sợ người khác sẽ nghĩ gì hoặc đánh giá gì về mình nhất?',
    reframeTemplateVi:
        'Khi bạn bình thản chấp nhận việc không hoàn hảo trước mặt người khác, nỗi sợ bị phán xét mất đi toàn bộ quyền lực.',
  ),

  // --- III. ANXIETY, WORRY, EXPOSURE & ERP (Tools 19..24) ---
  FlutterClinicalToolDescriptor(
    number: 19,
    slug: 'worry-box-postponement',
    titleVi: '19. Hộp Trì hoãn Lo âu 17:30 (Worry Box & Scheduled Worry Time)',
    titleEn: 'Worry Postponement Box (GAD)',
    category: 'Anxiety-ERP',
    modality: 'CBT',
    clinicalSummaryVi:
        'Cất nỗi lo vào hộp khóa đến 17:30 và phân loại: Productive Worry (có bước giải quyết ngay) vs. Hypothetical What-If Worry.',
    promptHintVi: 'Nỗi lo nào đang quấy nhiễu sự tập trung của bạn lúc này?',
    reframeTemplateVi:
        'Nỗi lo đã được ghi nhận an toàn vào Hộp Lo âu 17:30; lúc này bạn được phép quay lại với hiện tại.',
  ),
  FlutterClinicalToolDescriptor(
    number: 20,
    slug: 'exposure-hierarchy-suds-builder',
    titleVi: '20. Thang Tiếp xúc Sợ hãi SUDS 0–100 (Exposure Hierarchy Builder)',
    titleEn: 'Exposure Hierarchy Builder (Inhibitory Learning)',
    category: 'Anxiety-ERP',
    modality: 'CBT',
    clinicalSummaryVi:
        'Thiết kế bậc thang tiếp xúc từ SUDS 20 đến 90 và theo dõi sự sụt giảm nỗi sợ qua cơ chế học tập ức chế mới.',
    promptHintVi: 'Tình huống nào bạn đang né tránh và mức SUDS (0–100) là bao nhiêu?',
    reframeTemplateVi:
        'Mỗi lần ở lại trong tình huống sợ hãi mà không bỏ chạy, não bộ học được bài học mới rằng bạn đủ sức đi qua cơn sóng.',
  ),
  FlutterClinicalToolDescriptor(
    number: 21,
    slug: 'safety-behavior-detector',
    titleVi: '21. Máy Quét Hành vi An toàn Ngầm (Safety Behavior Detector)',
    titleEn: 'Safety Behavior Detector',
    category: 'Anxiety-ERP',
    modality: 'CBT',
    clinicalSummaryVi:
        'Phát hiện các nạng chống ngầm (đo nhịp tim liên tục, hỏi trấn an, né ánh mắt) đang vô tình duy trì rối loạn lo âu.',
    promptHintVi: 'Bạn thường làm gì để tự trấn an mỗi khi thấy lo âu?',
    reframeTemplateVi:
        'Thử buông bỏ 1 hành vi kiểm tra/trấn an nhỏ trong lần tiếp xúc tới để não thấy bạn an toàn thực sự mà không cần "nạng chống".',
  ),
  FlutterClinicalToolDescriptor(
    number: 22,
    slug: 'interoceptive-exposure-panic-trainer',
    titleVi: '22. Tiếp xúc Cảm giác Cơ thể Hoảng loạn (Interoceptive Exposure)',
    titleEn: 'Interoceptive Exposure & Panic De-escalation',
    category: 'Anxiety-ERP',
    modality: 'CBT',
    clinicalSummaryVi:
        'Hóa giải nỗi sợ cảm giác cơ thể (tim đập nhanh, choáng nhẹ) có sàng lọc y khoa, chứng minh triệu chứng giao cảm hoàn toàn lành tính.',
    promptHintVi: 'Triệu chứng cơ thể nào khiến bạn sợ rằng mình sắp ngất hoặc đau tim?',
    reframeTemplateVi:
        'Tim đập nhanh khi hoảng loạn là phản ứng adrenaline lành tính giống như khi tập thể dục, không phải dấu hiệu ngừng tim.',
  ),
  FlutterClinicalToolDescriptor(
    number: 23,
    slug: 'erp-ocd-ritual-delay-timer',
    titleVi: '23. Trì hoãn Nghi thức Cưỡng chế OCD (ERP Ritual Delay & Urge Tracker)',
    titleEn: 'ERP Ritual Delay & Compulsion Surf Timer',
    category: 'Anxiety-ERP',
    modality: 'CBT',
    clinicalSummaryVi:
        'Luyện tập trì hoãn hành vi kiểm tra/rửa tay/đếm 5–15 phút để cắt đứt vòng lặp Ám ảnh – Cưỡng chế (OCD).',
    promptHintVi: 'Xung động kiểm tra hoặc nghi thức nào đang thúc giục bạn làm ngay?',
    reframeTemplateVi:
        'Chấp nhận sự không chắc chắn 100% và trì hoãn nghi thức thêm 10 phút sẽ làm suy yếu dần tín hiệu báo động giả của OCD.',
  ),
  FlutterClinicalToolDescriptor(
    number: 24,
    slug: 'hidden-emotion-niceness-uncovering',
    titleVi: '24. Khai mở Cảm xúc Ẩn & "Bệnh Tử tế" (Hidden Emotion Technique)',
    titleEn: 'Hidden Emotion Technique (David Burns)',
    category: 'Anxiety-ERP',
    modality: 'TEAM-CBT',
    clinicalSummaryVi:
        'Tìm ra nỗi ấm ức, tức giận hoặc tổn thương bị đè nén dưới vỏ bọc "luôn tử tế, sợ mất lòng" — nguyên nhân phổ biến gây lo âu vô cớ.',
    promptHintVi: 'Có điều gì bạn đang ấm ức hoặc muốn nói "Không" nhưng lại cố nhịn không?',
    reframeTemplateVi:
        'Khi cảm xúc thật được thừa nhận và bày tỏ khéo léo qua DEAR MAN / EAR, cơn lo âu vô cớ sẽ tự động lắng xuống.',
  ),

  // --- IV. DEPRESSION, BEHAVIORAL ACTIVATION & CBT-I SLEEP (Tools 25..28) ---
  FlutterClinicalToolDescriptor(
    number: 25,
    slug: 'behavioral-activation-rest-check',
    titleVi: '25. Kích hoạt Hành vi 6 Bước & Cổng Rest Check (Behavioral Activation)',
    titleEn: 'Behavioral Activation with Guilt-Free Rest Check',
    category: 'Depression-BA',
    modality: 'CBT',
    clinicalSummaryVi:
        'Kiểm tra nhu cầu nghỉ ngơi sinh học không áy náy (Rest Check), thu nhỏ việc đến ngưỡng tự tin >= 7/10 và lập phương án If-Then.',
    promptHintVi: 'Hôm nay bạn đang mệt do kiệt sức sinh học hay do trầm cảm kéo tụt xuống?',
    reframeTemplateVi:
        'Nếu cơ thể cần phục hồi sinh học, Nghỉ ngơi Chủ động Không Áy náy là y lệnh chính đáng; nếu là trầm cảm rút lui, chỉ cần 1 bước 2 phút.',
  ),
  FlutterClinicalToolDescriptor(
    number: 26,
    slug: 'structured-problem-solving-5-step',
    titleVi: '26. Giải quyết Vấn đề 5 Bước chống Sương mù Não (Problem-Solving Therapy)',
    titleEn: '5-Step Structured Problem-Solving Therapy (PST)',
    category: 'Depression-BA',
    modality: 'CBT',
    clinicalSummaryVi:
        'Gỡ rối "sương mù não" khi trầm cảm: Định nghĩa 1 vấn đề nhỏ -> Động não 3 cách -> Chọn 1 bước dễ nhất -> Thử nghiệm 5 phút.',
    promptHintVi: 'Vấn đề thực tế nào đang làm bạn cảm thấy bế tắc không biết bắt đầu từ đâu?',
    reframeTemplateVi:
        'Không cần giải quyết toàn bộ cuộc đời hôm nay — chỉ cần chọn 1 phương án khả thi khoảng 60% và làm bước đầu tiên trong 5 phút.',
  ),
  FlutterClinicalToolDescriptor(
    number: 27,
    slug: 'cbti-sleep-efficiency-calculator',
    titleVi: '27. Nhật ký Giấc ngủ CBT-I & Lá chắn Chống Hưng cảm (CBT-I Sleep Calculator)',
    titleEn: 'CBT-I Sleep Efficiency Calculator with Bipolar Safety Guard',
    category: 'Depression-BA',
    modality: 'CBT',
    clinicalSummaryVi:
        'Tính Hiệu suất Giấc ngủ (SE% = Tổng giờ ngủ / Tổng giờ nằm trên giường) kèm Cổng Chặn Hạn chế Ngủ khi có dấu hiệu Hưng cảm.',
    promptHintVi: 'Nhập số giờ ngủ và cảm nhận nhu cầu ngủ đêm qua...',
    reframeTemplateVi:
        'Kiểm soát kích thích giường ngủ giúp tái lập phản xạ ngủ sâu, trong khi luôn ưu tiên bảo vệ nhịp sinh học cho người bệnh Lưỡng cực.',
  ),
  FlutterClinicalToolDescriptor(
    number: 28,
    slug: 'self-compassion-harsh-critic-reframe',
    titleVi: '28. Từ bi Tự thân & Chặn Kẻ Phán xét Nội tâm (Self-Compassion Reframe)',
    titleEn: 'Self-Compassion & Harsh Self-Critic Guard',
    category: 'Depression-BA',
    modality: 'CBT',
    clinicalSummaryVi:
        'Chuyển giọng nói đay nghiến bản thân sang 3 trụ cột Từ bi Tự thân (Chánh niệm, Nhân loại chung, Sự tử tế với chính mình).',
    promptHintVi: 'Bạn đang tự trách mình điều gì trong lúc đang kiệt sức?',
    reframeTemplateVi:
        'Đau khổ và vấp ngã là một phần của trải nghiệm làm người; bạn xứng đáng được nâng đỡ thay vì bị trừng phạt thêm.',
  ),

  // --- V. DBT DISTRESS TOLERANCE, EMOTION REGULATION & INTERPERSONAL (Tools 29..33) ---
  FlutterClinicalToolDescriptor(
    number: 29,
    slug: 'dbt-tipp-stop-medical-gate',
    titleVi: '29. Hạ nhiệt Sinh lý Cấp DBT TIPP & STOP (kèm Sàng lọc Y khoa Nước lạnh)',
    titleEn: 'DBT TIPP & STOP Distress Tolerance with Medical Gate',
    category: 'DBT',
    modality: 'DBT',
    clinicalSummaryVi:
        'Hạ kích hoạt giao cảm cấp tính (Intensity >= 8/10) qua Nhiệt độ (có sàng lọc tim mạch/beta-blockers), Vận động, Thở 4-6 và Giãn cơ PMR.',
    promptHintVi: 'Mức độ căng thẳng hiện tại (0–10) và triệu chứng cơ thể...',
    reframeTemplateVi:
        'Khi cường độ >= 8/10, ưu tiên số 1 là làm dịu cơ thể bằng thở ra chậm 6 giây hoặc TIPP trước khi phân tích bất kỳ suy nghĩ nào.',
  ),
  FlutterClinicalToolDescriptor(
    number: 30,
    slug: 'dbt-opposite-action-justified-check',
    titleVi: '30. Hành động Đối nghịch 4 Bước & Justified Check (DBT Opposite Action)',
    titleEn: 'DBT Opposite Action with Justified Check',
    category: 'DBT',
    modality: 'DBT',
    clinicalSummaryVi:
        'Kiểm tra xem thôi thúc cảm xúc có phù hợp sự thật khách quan không; nếu không chính đáng, làm ngược lại 100% cả tư thế lẫn hành động.',
    promptHintVi: 'Cảm xúc nào đang xúi giục bạn rút lui, công kích hoặc hủy bỏ kế hoạch?',
    reframeTemplateVi:
        'Khi mối đe dọa không có thật, hành động ngược lại toàn diện (mở lòng bàn tay, bước tới nhẹ nhàng) sẽ tái lập trình cảm xúc.',
  ),
  FlutterClinicalToolDescriptor(
    number: 31,
    slug: 'dbt-wise-mind-abc-please-accepts',
    titleVi: '31. Tâm Trí Tuệ, ABC PLEASE & ACCEPTS 5 Giác quan (DBT Resilience Suite)',
    titleEn: 'DBT Wise Mind, ABC PLEASE & ACCEPTS Self-Soothe',
    category: 'DBT',
    modality: 'DBT',
    clinicalSummaryVi:
        'Kết nối Tâm Cảm xúc & Tâm Lý trí thành Wise Mind, củng cố sức đề kháng sinh học ABC PLEASE và xoa dịu qua ACCEPTS / 5 giác quan.',
    promptHintVi: 'Quyết định nào đang làm bạn giằng xé giữa Lý trí và Cảm xúc?',
    reframeTemplateVi:
        'Khi cả Cảm xúc lẫn Lý trí đều được lắng nghe không phán xét, Tâm Trí Tuệ (Wise Mind) sẽ chỉ ra bước đi nhỏ tiếp theo.',
  ),
  FlutterClinicalToolDescriptor(
    number: 32,
    slug: 'dbt-chain-analysis-dear-man-ear',
    titleVi: '32. Phân tích Chuỗi Hành vi & Giao tiếp DEAR MAN + EAR (DBT Chain & DEAR MAN)',
    titleEn: 'DBT Chain Analysis (with Hard Stops) & DEAR MAN + EAR',
    category: 'DBT',
    modality: 'DBT',
    clinicalSummaryVi:
        'Giải phẫu mắt xích hành vi không phán xét (có Hard Stops bảo vệ) và soạn kịch bản giao tiếp giữ vững tự trọng DEAR MAN + 5 Bí quyết EAR.',
    promptHintVi: 'Nhập tình huống giao tiếp khó hoặc thói quen bạn muốn tìm điểm ngắt mạch...',
    reframeTemplateVi:
        'Mô tả sự thật khách quan (D), Bày tỏ cảm xúc "Tôi cảm thấy" (E), Đưa ra yêu cầu rõ ràng (A) và Thấu cảm giải giáp (EAR).',
  ),
  FlutterClinicalToolDescriptor(
    number: 33,
    slug: 'dbt-radical-acceptance-urge-surfing',
    titleVi: '33. Chấp nhận Hoàn toàn & Cưỡi Sóng Xung động 90 Giây (Radical Acceptance & Urge Surfing)',
    titleEn: 'DBT Radical Acceptance & 90-Second Urge Surfing Wave',
    category: 'DBT',
    modality: 'DBT',
    clinicalSummaryVi:
        'Ngừng chiến đấu chống lại thực tại không thể thay đổi (Đau × Chống cự = Khổ) và cưỡi trên đỉnh sóng adrenaline 90 giây mà không hành động bốc đồng.',
    promptHintVi: 'Thực tại hoặc cơn sóng xung động nào bạn đang cố chống cự?',
    reframeTemplateVi:
        'Chấp nhận thực tại không có nghĩa là tán thành nó, mà là giải phóng năng lượng khỏi sự cay đắng để nhìn thấy bước đi thực tế.',
  ),

  // --- VI. BIPOLAR DISORDER, HYPOMANIA GUARD & IPSRT (Tools 34..36) ---
  FlutterClinicalToolDescriptor(
    number: 34,
    slug: 'bipolar-positive-distortion-devils-advocate',
    titleVi: '34. Lá chắn Hưng cảm & Phản biện Devil\'s Advocate (Bipolar Positive Distortion Guard)',
    titleEn: 'Bipolar Positive Distortion Checker & Devil\'s Advocate',
    category: 'Bipolar-IPSRT',
    modality: 'Bipolar-CBT',
    clinicalSummaryVi:
        'Phát hiện 5 Biến dạng Nhận thức Dương tính (Ý tưởng thiên tài, Rủi ro bằng 0, Không cần ngủ, Muốn bỏ thuốc) và phản biện bảo vệ.',
    promptHintVi: 'Nhập ý tưởng lớn, kế hoạch đầu tư hoặc suy nghĩ muốn ngưng thuốc...',
    reframeTemplateVi:
        '[Devil\'s Advocate]: Ý tưởng này rất cuốn hút, nhưng nếu có 20% rủi ro ẩn giấu và nếu chờ qua 2 đêm ngủ đủ giấc (48 giờ), nó có còn vẹn nguyên giá trị không?',
  ),
  FlutterClinicalToolDescriptor(
    number: 35,
    slug: 'bipolar-48h-impulse-vault-crisis-pros-cons',
    titleVi: '35. Khoang Khóa Xung động 48 Giờ & Bàn cân 4 Ô (48h Impulse Vault & Crisis Pros/Cons)',
    titleEn: '48-Hour Impulse Vault & DBT Crisis Pros/Cons',
    category: 'Bipolar-IPSRT',
    modality: 'Bipolar-CBT',
    clinicalSummaryVi:
        'Khóa các quyết định tài chính/sự nghiệp/tình cảm lớn trong 48 giờ khi khí sắc >= +2 và chạy bàn cân 4 ô kèm Two-Person Reality Check.',
    promptHintVi: 'Quyết định cấp bách nào đang thúc giục bạn phải thực hiện ngay lập tức?',
    reframeTemplateVi:
        'Một cơ hội thực sự bền vững sẽ vẫn còn đó sau 48 giờ và sau khi tham khảo ý kiến 1 người thân tin cậy trong Giao ước Ulysses.',
  ),
  FlutterClinicalToolDescriptor(
    number: 36,
    slug: 'bipolar-ipsrt-rhythm-medication-cba',
    titleVi: '36. Neo Nhịp Sinh học IPSRT & Bàn cân Tuân thủ Thuốc (IPSRT & Medication Adherence CBA)',
    titleEn: 'IPSRT Social Rhythm Anchor & Medication Adherence CBA',
    category: 'Bipolar-IPSRT',
    modality: 'Bipolar-CBT',
    clinicalSummaryVi:
        'Bảo vệ 5 điểm neo nhịp sinh học IPSRT (Giờ thức, Tiếp xúc xã hội, Làm việc, Ăn tối, Ngủ) và hóa giải ảo tưởng "đã khỏi bệnh nên bỏ thuốc".',
    promptHintVi: 'Nhập trăn trở về lịch sinh hoạt hoặc suy nghĩ muốn giảm/ngưng thuốc ổn định khí sắc...',
    reframeTemplateVi:
        'Sự bình ổn hiện tại chính là bằng chứng thuốc và nhịp sinh học IPSRT đang bảo vệ não bộ. Tuyệt đối không tự ý thay đổi liều khi chưa hỏi bác sĩ điều trị.',
  ),
];

/// Deterministic 0ms execution engine for all 36 clinical tools in Dart.
FlutterClinicalToolExecutionResult runFlutterClinicalTool(
  String slug,
  String userInput, {
  int moodPolarity = 0,
  int preIntensity = 5,
}) {
  final tool = kFlutter36ClinicalTools.firstWhere(
    (t) => t.slug == slug,
    orElse: () => kFlutter36ClinicalTools.first,
  );

  const detector = DistortionDetector();
  final analysis = detector.analyzeText(
    text: userInput,
    preIntensity: preIntensity,
    moodPolarity: moodPolarity,
  );

  final negNames =
      analysis.negativeDistortions.map((d) => d.nameVi).toList(growable: false);
  final posNames =
      analysis.positiveDistortions.map((d) => d.nameVi).toList(growable: false);
  final sdbNames =
      analysis.selfDefeatingBeliefs.map((d) => d.nameVi).toList(growable: false);
  final sbNames =
      analysis.safetyBehaviors.map((d) => d.nameVi).toList(growable: false);

  final safety = analysis.safetyScreen;
  if (safety.requiresImmediateSafetyStop) {
    return FlutterClinicalToolExecutionResult(
      tool: tool,
      userInput: userInput,
      moodPolarity: moodPolarity,
      safetyStopTriggered: true,
      requiresTippFirst: false,
      hypomaniaGuardActive: false,
      detectedNegativeDistortions: negNames,
      detectedPositiveDistortions: posNames,
      detectedSelfDefeatingBeliefs: sdbNames,
      detectedSafetyBehaviors: sbNames,
      deterministicReframeVi: safety.clinicalDirectiveVi,
      socraticQuestionVi:
          'An toàn tính mạng là ưu tiên tuyệt đối. Pushback đã tắt hoàn toàn — xin hãy kết nối ngay với đường dây nóng 115 / 096 306 1414 hoặc người thân trong Giao ước Ulysses.',
      recommendedNextActionVi:
          'Mở Cổng Khẩn cấp Safety Stop & Gọi Hotline Hỗ trợ Tâm lý ngay lập tức.',
    );
  }

  final hypomaniaActive = moodPolarity >= 2 ||
      posNames.isNotEmpty ||
      tool.modality == 'Bipolar-CBT';

  String socratic = 'Nếu nhìn sự việc này qua ống kính công bằng và tử tế như với một người bạn thân, bạn sẽ nhận ra góc nhìn mới nào?';
  if (analysis.positiveDistortions.isNotEmpty) {
    socratic = analysis.positiveDistortions.first.socraticQuestionVi;
  } else if (analysis.negativeDistortions.isNotEmpty) {
    socratic = analysis.negativeDistortions.first.socraticQuestionVi;
  } else if (analysis.selfDefeatingBeliefs.isNotEmpty) {
    socratic = analysis.selfDefeatingBeliefs.first.socraticQuestionVi;
  } else if (analysis.safetyBehaviors.isNotEmpty) {
    socratic = analysis.safetyBehaviors.first.socraticQuestionVi;
  }

  final trimmed = userInput.trim();
  final reframeBuffer = StringBuffer()
    ..write('[${tool.titleVi}] ')
    ..write(tool.reframeTemplateVi);

  if (trimmed.isNotEmpty) {
    reframeBuffer.write(
      ' • Phản hồi định hướng cho "$trimmed": Ghi nhận cảm xúc hiện tại là hợp lệ, đồng thời kiểm chứng dữ kiện thực tế theo nguyên lý ${tool.modality}.',
    );
  }

  String nextAction =
      'Áp dụng câu hỏi Socratic ở trên và ghi nhận 1 bước hành động nhỏ trong 5 phút tới.';
  if (safety.requiresTippBeforeCbt) {
    nextAction =
        'Cường độ cảm xúc đang ở vùng đỏ (>= 8/10) — hãy chuyển sang Cổng SOS DBT TIPP (Thở dẫn nhịp 4-6s) trước khi phân tích nhận thức.';
  } else if (hypomaniaActive) {
    nextAction =
        'Cảnh báo Lá chắn Hưng cảm nhẹ: Đưa mọi quyết định chi tiêu/dự án lớn vào Khoang Chờ 48 Giờ và bật giao diện Dark Rest.';
  } else if (moodPolarity <= -3) {
    nextAction =
        'Chế độ Low-Energy Depression: Chỉ cần chọn 1 bước vi mô 2 phút (hoặc Nghỉ ngơi Chủ động Không Áy náy - Rest Check).';
  }

  return FlutterClinicalToolExecutionResult(
    tool: tool,
    userInput: userInput,
    moodPolarity: moodPolarity,
    safetyStopTriggered: false,
    requiresTippFirst: safety.requiresTippBeforeCbt,
    hypomaniaGuardActive: hypomaniaActive,
    detectedNegativeDistortions: negNames,
    detectedPositiveDistortions: posNames,
    detectedSelfDefeatingBeliefs: sdbNames,
    detectedSafetyBehaviors: sbNames,
    deterministicReframeVi: reframeBuffer.toString(),
    socraticQuestionVi: socratic,
    recommendedNextActionVi: nextAction,
  );
}

// ============================================================================
// 2. TEAM-CBT PLEASURE-PREDICTING (MASTERY & PLEASURE M/P) SHEET
// ============================================================================

class PleasurePredictingEntry {
  final String id;
  final String activityTitle;
  final String companionMode; // 'alone' | 'with_others'
  final int predictedPleasurePct; // 0..100
  final int actualPleasurePct; // 0..100
  final int predictedMasteryScore; // 0..10
  final int actualMasteryScore; // 0..10

  const PleasurePredictingEntry({
    required this.id,
    required this.activityTitle,
    this.companionMode = 'alone',
    required this.predictedPleasurePct,
    required this.actualPleasurePct,
    required this.predictedMasteryScore,
    required this.actualMasteryScore,
  });

  int get pleasurePredictionErrorDelta =>
      actualPleasurePct.clamp(0, 100) - predictedPleasurePct.clamp(0, 100);

  int get masteryPredictionErrorDelta =>
      actualMasteryScore.clamp(0, 10) - predictedMasteryScore.clamp(0, 10);

  bool get disprovedAnhedoniaPrediction =>
      pleasurePredictionErrorDelta > 0 || masteryPredictionErrorDelta > 0;

  String get clinicalInsightVi {
    final pDelta = pleasurePredictionErrorDelta;
    final mDelta = masteryPredictionErrorDelta;
    if (pDelta > 0 || mDelta > 0) {
      return 'Hiệu chỉnh Sai số Dự đoán (Prediction-Error Correction): Thực tế mang lại Niềm vui cao hơn dự đoán ${pDelta >= 0 ? "+$pDelta%" : "$pDelta%"} và Cảm giác hoàn thành (Mastery) ${mDelta >= 0 ? "+$mDelta" : "$mDelta"}/10. Khi trầm cảm, não bộ thường dự báo thấp hơn thực tế!';
    }
    return 'Ghi nhận trải nghiệm thực tế: Ngay cả khi niềm vui chưa tăng vọt, việc hoàn thành bước nhỏ vẫn đạt điểm Mastery $actualMasteryScore/10.';
  }
}

// ============================================================================
// 3. TEAM-CBT ANTI-PROCRASTINATION 5-MINUTE SHEET
// ============================================================================

class AntiProcrastinationStepEvaluation {
  final String id;
  final String overwhelmingTask;
  final String fiveMinuteMicroStep;
  final int predictedDifficultyPct; // 0..100
  final int predictedSatisfactionPct; // 0..100
  final int actualDifficultyPct; // 0..100
  final int actualSatisfactionPct; // 0..100

  const AntiProcrastinationStepEvaluation({
    required this.id,
    required this.overwhelmingTask,
    required this.fiveMinuteMicroStep,
    required this.predictedDifficultyPct,
    required this.predictedSatisfactionPct,
    required this.actualDifficultyPct,
    required this.actualSatisfactionPct,
  });

  /// Positive value means actual task was EASIER than predicted (Predicted - Actual).
  int get difficultyReliefDelta =>
      predictedDifficultyPct.clamp(0, 100) - actualDifficultyPct.clamp(0, 100);

  /// Positive value means actual satisfaction was HIGHER than predicted (Actual - Predicted).
  int get satisfactionGainDelta =>
      actualSatisfactionPct.clamp(0, 100) -
      predictedSatisfactionPct.clamp(0, 100);

  String get clinicalTakeawayVi =>
      'Bước 5 phút "$fiveMinuteMicroStep" thực tế dễ hơn dự đoán $difficultyReliefDelta% và mang lại sự hài lòng cao hơn dự đoán +$satisfactionGainDelta%. Nguyên lý TEAM-CBT: Hành động đi trước, động lực theo sau!';
}

// ============================================================================
// 4. DOWNWARD ARROW (23 SDBs UNCOVERING & COST-BENEFIT ANALYSIS)
// ============================================================================

class DownwardArrowSdbResult {
  final String initialAutomaticThought;
  final List<String> arrowChainVi;
  final List<String> uncoveredSdbCodes;
  final List<String> uncoveredSdbNamesVi;
  final List<String> benefitsOfHoldingBeliefVi;
  final List<String> costsOfHoldingBeliefVi;
  final String healthyReplacementBeliefVi;

  const DownwardArrowSdbResult({
    required this.initialAutomaticThought,
    required this.arrowChainVi,
    required this.uncoveredSdbCodes,
    required this.uncoveredSdbNamesVi,
    required this.benefitsOfHoldingBeliefVi,
    required this.costsOfHoldingBeliefVi,
    required this.healthyReplacementBeliefVi,
  });
}

DownwardArrowSdbResult runDownwardArrowSdbUncovering({
  required String automaticThought,
  String mode = 'individual', // 'individual' | 'interpersonal'
}) {
  const detector = DistortionDetector();
  final analysis = detector.analyzeText(text: automaticThought);

  final sdbCodes =
      analysis.selfDefeatingBeliefs.map((s) => s.code).toList(growable: true);
  final sdbNames =
      analysis.selfDefeatingBeliefs.map((s) => s.nameVi).toList(growable: true);

  final normalized = automaticThought.toLowerCase();
  if (sdbCodes.isEmpty) {
    if (normalized.contains('lỗi') ||
        normalized.contains('hoàn hảo') ||
        normalized.contains('thất bại') ||
        normalized.contains('mistake')) {
      sdbCodes.add('sdb_performance_perfectionism');
      sdbNames.add('Cầu toàn Thành tích (Performance Perfectionism)');
    } else if (normalized.contains('chê') ||
        normalized.contains('hài lòng') ||
        normalized.contains('từ chối') ||
        normalized.contains('reject')) {
      sdbCodes.add('sdb_approval_addiction');
      sdbNames.add('Nghiện Sự Công nhận (Approval Addiction)');
    } else {
      sdbCodes.add('sdb_achievement_addiction');
      sdbNames.add('Nghiện Thành tựu (Achievement Addiction)');
    }
  }

  final chain = mode == 'interpersonal'
      ? <String>[
          'Suy nghĩ ban đầu: "$automaticThought"',
          '↓ Giả sử điều đó đúng, người kia sẽ nghĩ gì về tôi? -> "Họ sẽ thất vọng hoặc không còn tôn trọng tôi."',
          '↓ Nếu họ không hài lòng với tôi, điều đó có ý nghĩa gì? -> "Tôi phải luôn làm hài lòng mọi người và tránh xung đột bằng mọi giá để được an toàn."',
          '↓ Niềm tin Tự hủy hoại gốc rễ (SDB): ${sdbNames.join(", ")}',
        ]
      : <String>[
          'Suy nghĩ ban đầu: "$automaticThought"',
          '↓ Giả sử điều đó xảy ra thật, nó có ý nghĩa gì với tôi? -> "Điều đó chứng tỏ tôi kém cỏi và không đạt chuẩn."',
          '↓ Nếu tôi không hoàn hảo hoặc thất bại ở việc này thì sao? -> "Giá trị con người tôi sẽ mất đi nếu tôi mắc sai lầm."',
          '↓ Niềm tin Tự hủy hoại gốc rễ (SDB): ${sdbNames.join(", ")}',
        ];

  return DownwardArrowSdbResult(
    initialAutomaticThought: automaticThought,
    arrowChainVi: chain,
    uncoveredSdbCodes: sdbCodes,
    uncoveredSdbNamesVi: sdbNames,
    benefitsOfHoldingBeliefVi: const [
      'Tạo cảm giác có động lực thúc ép bản thân cố gắng và cẩn thận hơn',
      'Giữ ảo tưởng rằng nếu mình cầu toàn/nhường nhịn thì sẽ tránh được bị chỉ trích',
    ],
    costsOfHoldingBeliefVi: const [
      'Gây lo âu mãn tính, kiệt sức (burnout) và tê liệt trì hoãn vì sợ sai',
      'Đánh mất sự tự chủ, luôn sống trong nỗi sợ ánh nhìn của người khác',
      'Tự tước đi quyền được làm một con người bình thường có lúc nghỉ ngơi và học qua sai lầm',
    ],
    healthyReplacementBeliefVi:
        'Tôi hướng tới sự tiến bộ và chân thành với tốc độ bền vững, nhưng giá trị làm người của tôi là vô điều kiện — ngay cả khi tôi mắc lỗi hay khi có người không hài lòng.',
  );
}

// ============================================================================
// 5. DBT `ABC PLEASE` CHECKLIST + `ACCEPTS` & 5-SENSES + `RADICAL ACCEPTANCE`
// ============================================================================

class DbtAbcPleaseChecklistState {
  final bool accumulatePositives; // A
  final bool buildMastery; // B
  final bool copeAhead; // C
  final bool physicalIllnessCare; // PL
  final bool balancedEating; // E
  final bool avoidMoodAlteringSubstances; // A
  final bool balancedSleep; // S
  final bool dailyExercise; // E

  const DbtAbcPleaseChecklistState({
    this.accumulatePositives = false,
    this.buildMastery = false,
    this.copeAhead = false,
    this.physicalIllnessCare = false,
    this.balancedEating = false,
    this.avoidMoodAlteringSubstances = false,
    this.balancedSleep = false,
    this.dailyExercise = false,
  });

  int get completedItemsCount => [
        accumulatePositives,
        buildMastery,
        copeAhead,
        physicalIllnessCare,
        balancedEating,
        avoidMoodAlteringSubstances,
        balancedSleep,
        dailyExercise,
      ].where((v) => v).length;

  int get resilienceScorePct => ((completedItemsCount / 8.0) * 100).round();

  String get clinicalSummaryVi {
    if (completedItemsCount >= 6) {
      return 'Lá chắn Sinh học & Cảm xúc DBT ABC PLEASE rất vững vàng ($completedItemsCount/8 • $resilienceScorePct%). Sức đề kháng trước cơn bão cảm xúc ở mức tối ưu.';
    }
    if (completedItemsCount >= 3) {
      return 'Đã hoàn thành $completedItemsCount/8 trụ cột ABC PLEASE ($resilienceScorePct%). Hãy ưu tiên thêm Giấc ngủ (S) hoặc Ăn uống cân bằng (E) để giảm tính dễ tổn thương.';
    }
    return 'Hôm nay cơ thể đang có nhiều yếu tố dễ tổn thương ($completedItemsCount/8 • $resilienceScorePct%). Hãy đối xử thật nhẹ nhàng với bản thân và chỉ chọn 1 việc chăm sóc cơ bản nhất.';
  }

  DbtAbcPleaseChecklistState copyWith({
    bool? accumulatePositives,
    bool? buildMastery,
    bool? copeAhead,
    bool? physicalIllnessCare,
    bool? balancedEating,
    bool? avoidMoodAlteringSubstances,
    bool? balancedSleep,
    bool? dailyExercise,
  }) {
    return DbtAbcPleaseChecklistState(
      accumulatePositives: accumulatePositives ?? this.accumulatePositives,
      buildMastery: buildMastery ?? this.buildMastery,
      copeAhead: copeAhead ?? this.copeAhead,
      physicalIllnessCare: physicalIllnessCare ?? this.physicalIllnessCare,
      balancedEating: balancedEating ?? this.balancedEating,
      avoidMoodAlteringSubstances:
          avoidMoodAlteringSubstances ?? this.avoidMoodAlteringSubstances,
      balancedSleep: balancedSleep ?? this.balancedSleep,
      dailyExercise: dailyExercise ?? this.dailyExercise,
    );
  }
}

class DbtAcceptsAndSelfSootheCard {
  final String code;
  final String group; // 'ACCEPTS' | 'SELF_SOOTHE_5_SENSES'
  final String titleVi;
  final String microActionVi;

  const DbtAcceptsAndSelfSootheCard({
    required this.code,
    required this.group,
    required this.titleVi,
    required this.microActionVi,
  });
}

const List<DbtAcceptsAndSelfSootheCard> kDbtAcceptsAndFiveSensesCards = [
  DbtAcceptsAndSelfSootheCard(
    code: 'accepts_activities',
    group: 'ACCEPTS',
    titleVi: 'A — Activities (Hoạt động Thu hút Sự chú ý)',
    microActionVi: 'Đi bộ ngắn 5 phút, sắp xếp lại 1 ngăn bàn hoặc nghe 1 bản nhạc không lời.',
  ),
  DbtAcceptsAndSelfSootheCard(
    code: 'accepts_contributing',
    group: 'ACCEPTS',
    titleVi: 'C — Contributing (Đóng góp Nhỏ cho Người khác)',
    microActionVi: 'Gửi 1 tin nhắn hỏi thăm chân thành hoặc giúp đỡ một việc nhỏ trong nhà.',
  ),
  DbtAcceptsAndSelfSootheCard(
    code: 'accepts_comparisons',
    group: 'ACCEPTS',
    titleVi: 'C — Comparisons (Đối chiếu Bối cảnh Chịu đựng)',
    microActionVi: 'Nhớ lại một giai đoạn khó khăn trước đây mà bạn đã từng kiên cường vượt qua được.',
  ),
  DbtAcceptsAndSelfSootheCard(
    code: 'accepts_emotions',
    group: 'ACCEPTS',
    titleVi: 'E — Emotions (Khơi gợi Cảm xúc Đối lập Nhẹ nhàng)',
    microActionVi: 'Xem một đoạn phim hài hước nhẹ nhàng hoặc đọc một trang sách truyền cảm hứng.',
  ),
  DbtAcceptsAndSelfSootheCard(
    code: 'accepts_pushing_away',
    group: 'ACCEPTS',
    titleVi: 'P — Pushing Away (Tạm Gác lại trên Kệ Tâm trí)',
    microActionVi: 'Hình dung đặt nỗi đau vào một chiếc hộp gỗ chắc chắn trên kệ trong 1 giờ tới để cơ thể nghỉ ngơi.',
  ),
  DbtAcceptsAndSelfSootheCard(
    code: 'accepts_thoughts',
    group: 'ACCEPTS',
    titleVi: 'T — Thoughts (Lấp đầy Bộ nhớ Làm việc bằng Nhận thức Trung tính)',
    microActionVi: 'Đếm ngược từ 100 trừ đi 7 (100, 93, 86...) hoặc liệt kê 10 đồ vật màu xanh trong phòng.',
  ),
  DbtAcceptsAndSelfSootheCard(
    code: 'accepts_sensations',
    group: 'ACCEPTS',
    titleVi: 'S — Sensations (Kích thích Giác quan An toàn)',
    microActionVi: 'Cầm một viên đá lạnh trong lòng bàn tay hoặc tắm nước ấm và chú ý từng giọt nước.',
  ),
  DbtAcceptsAndSelfSootheCard(
    code: 'soothe_vision',
    group: 'SELF_SOOTHE_5_SENSES',
    titleVi: 'Giác quan 1 — Thị giác (Vision Self-Soothe)',
    microActionVi: 'Nhìn ngắm tán cây xanh ngoài cửa sổ, bầu trời hoặc ánh đèn vàng dịu ấm.',
  ),
  DbtAcceptsAndSelfSootheCard(
    code: 'soothe_hearing',
    group: 'SELF_SOOTHE_5_SENSES',
    titleVi: 'Giác quan 2 — Thính giác (Hearing Self-Soothe)',
    microActionVi: 'Lắng nghe tiếng mưa rơi offline, tiếng sóng biển hoặc tiếng quạt quay đều đặn.',
  ),
  DbtAcceptsAndSelfSootheCard(
    code: 'soothe_smell',
    group: 'SELF_SOOTHE_5_SENSES',
    titleVi: 'Giác quan 3 — Khứu giác (Smell Self-Soothe)',
    microActionVi: 'Hít sâu hương trà ấm, tinh dầu oải hương/cam ngọt hoặc mùi cà phê rang.',
  ),
  DbtAcceptsAndSelfSootheCard(
    code: 'soothe_taste',
    group: 'SELF_SOOTHE_5_SENSES',
    titleVi: 'Giác quan 4 — Vị giác (Taste Self-Soothe)',
    microActionVi: 'Nhấp từng ngụm nhỏ nước ấm hoặc trà thảo mộc, cảm nhận nhiệt độ lan tỏa chậm rãi.',
  ),
  DbtAcceptsAndSelfSootheCard(
    code: 'soothe_touch',
    group: 'SELF_SOOTHE_5_SENSES',
    titleVi: 'Giác quan 5 — Xúc giác (Touch Self-Soothe)',
    microActionVi: 'Khoác một chiếc chăn mềm, đặt tay lên ngực cảm nhận hơi ấm hoặc thả lỏng cơ vai.',
  ),
];

class RadicalAcceptanceUrgeSurfingGuide {
  final int waveElapsedSeconds; // 0..90
  final String phaseTitleVi;
  final String somaticInstructionVi;
  final String dialecticalReminderVi;

  const RadicalAcceptanceUrgeSurfingGuide({
    required this.waveElapsedSeconds,
    required this.phaseTitleVi,
    required this.somaticInstructionVi,
    required this.dialecticalReminderVi,
  });
}

RadicalAcceptanceUrgeSurfingGuide evaluateUrgeSurfingWave({
  required int elapsedSeconds,
}) {
  final clamped = elapsedSeconds.clamp(0, 90);
  if (clamped < 30) {
    return RadicalAcceptanceUrgeSurfingGuide(
      waveElapsedSeconds: clamped,
      phaseTitleVi: 'Pha 1 (0–30s): Nhận diện Chân sóng & Bàn tay Sẵn lòng (Willing Hands)',
      somaticInstructionVi:
          'Thả lỏng hai vai, đặt hai bàn tay ngửa nhẹ trên đùi (Willing Hands). Quan sát cảm giác căng trong ngực/bụng mà không tìm cách đè nén.',
      dialecticalReminderVi:
          'Đau đớn × Chống cự = Đau khổ kéo dài. Tôi không thích cảm giác này, VÀ tôi cho phép nó có mặt ở đây lúc này.',
    );
  }
  if (clamped < 60) {
    return RadicalAcceptanceUrgeSurfingGuide(
      waveElapsedSeconds: clamped,
      phaseTitleVi: 'Pha 2 (30–60s): Cưỡi trên Đỉnh sóng Adrenaline (Peak Surf)',
      somaticInstructionVi:
          'Cơn sóng lo âu/xung động đang ở đỉnh cao nhất. Hãy hít vào 4 giây, thở ra 6 giây như tấm ván lướt trên ngọn sóng mà không làm theo hành vi an toàn.',
      dialecticalReminderVi:
          'Không có cơn sóng sinh học nào đứng yên ở đỉnh mãi mãi. Chu kỳ sống của adrenaline trong máu chỉ kéo dài khoảng 90 giây nếu không tiếp thêm nhiên liệu suy diễn.',
    );
  }
  return RadicalAcceptanceUrgeSurfingGuide(
    waveElapsedSeconds: clamped,
    phaseTitleVi: 'Pha 3 (60–90s): Sóng Tan vào Bờ & Chấp nhận Thực tại (Radical Acceptance)',
    somaticInstructionVi:
      'Cảm nhận cơn sóng đang hạ dần cường độ. Ghi nhận rằng bạn vừa đi qua trọn vẹn 90 giây mà không bị cơn sóng cuốn trôi.',
    dialecticalReminderVi:
        'Chấp nhận hoàn toàn thực tại hiện tại giúp tâm trí lấy lại tự do để chọn 1 bước đi khôn ngoan (Wise Mind).',
  );
}

// ============================================================================
// 6. CBT-I SLEEP EFFICIENCY CALCULATOR WITH BIPOLAR MANIA CONTRAINDICATION GUARD
// ============================================================================

class CbtiSleepEfficiencyResult {
  final double totalTimeInBedHours;
  final double totalSleepTimeHours;
  final int sleepEfficiencyPct; // (TST / TIB) * 100
  final FeltNeedForSleep feltNeedForSleep;
  final int moodPolarity;
  final bool bipolarManiaContraindicationBlocked;
  final bool sleepRestrictionAllowed;
  final String clinicalRecommendationVi;

  const CbtiSleepEfficiencyResult({
    required this.totalTimeInBedHours,
    required this.totalSleepTimeHours,
    required this.sleepEfficiencyPct,
    required this.feltNeedForSleep,
    required this.moodPolarity,
    required this.bipolarManiaContraindicationBlocked,
    required this.sleepRestrictionAllowed,
    required this.clinicalRecommendationVi,
  });
}

CbtiSleepEfficiencyResult calculateCbtiSleepEfficiency({
  required double totalTimeInBedHours,
  required double totalSleepTimeHours,
  required FeltNeedForSleep feltNeedForSleep,
  int moodPolarity = 0,
}) {
  final safeTib = totalTimeInBedHours <= 0.5 ? 0.5 : totalTimeInBedHours;
  final safeTst = totalSleepTimeHours.clamp(0.0, safeTib);
  final sePct = ((safeTst / safeTib) * 100).round().clamp(0, 100);

  // Critical Bipolar Safety Guard:
  // Never recommend CBT-I Sleep Restriction when feltNeedForSleep is reduced/none
  // or when moodPolarity >= +2 (risk of triggering a manic switch!).
  final maniaBlocked =
      feltNeedForSleep.isReducedSleepNeed || moodPolarity >= 2;

  if (maniaBlocked) {
    return CbtiSleepEfficiencyResult(
      totalTimeInBedHours: safeTib,
      totalSleepTimeHours: safeTst,
      sleepEfficiencyPct: sePct,
      feltNeedForSleep: feltNeedForSleep,
      moodPolarity: moodPolarity,
      bipolarManiaContraindicationBlocked: true,
      sleepRestrictionAllowed: false,
      clinicalRecommendationVi:
          'CẢNH BÁO CHỐNG CHỈ ĐỊNH LƯỠNG CỰC (BIPOLAR MANIA GUARD): Bạn đang có dấu hiệu giảm nhu cầu ngủ (${feltNeedForSleep.labelVi}) hoặc khí sắc tăng cao. '
          'Hệ thống ĐÃ KHÓA phác đồ Hạn chế Giấc ngủ CBT-I (Sleep Restriction) vì hạn chế thời gian nằm có nguy cơ kích hoạt chuyển pha Hưng cảm (Manic Switch). '
          'Hãy áp dụng Liệu pháp Nghỉ Tối (Dark Rest Therapy), giữ phòng tối tĩnh lặng đủ 7.5–8 giờ và liên hệ bác sĩ điều trị.',
    );
  }

  final allowRestriction = sePct < 85;
  final recommendation = sePct >= 85
      ? 'Hiệu suất giấc ngủ đạt $sePct% (>= 85% — Ngưỡng Tốt). Hãy tiếp tục duy trì giờ thức dậy cố định theo mốc neo nhịp sinh học IPSRT.'
      : 'Hiệu suất giấc ngủ hiện tại là $sePct% (< 85% do nằm trằn trọc trên giường nhưng mệt mỏi thiếu ngủ). '
          'Áp dụng Kiểm soát Kích thích CBT-I: Chỉ lên giường khi buồn ngủ, rời giường đọc sách dưới ánh đèn vàng dịu nếu trằn trọc > 20 phút, và giữ cố định giờ thức dậy buổi sáng.';

  return CbtiSleepEfficiencyResult(
    totalTimeInBedHours: safeTib,
    totalSleepTimeHours: safeTst,
    sleepEfficiencyPct: sePct,
    feltNeedForSleep: feltNeedForSleep,
    moodPolarity: moodPolarity,
    bipolarManiaContraindicationBlocked: false,
    sleepRestrictionAllowed: allowRestriction,
    clinicalRecommendationVi: recommendation,
  );
}
