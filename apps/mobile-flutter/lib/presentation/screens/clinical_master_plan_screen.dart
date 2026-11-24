// lib/presentation/screens/clinical_master_plan_screen.dart
// Full Interactive Mobile UI for CLINICAL_PROTOCOL_MASTER_PLAN.md:
// - Tab 1: 68 Phác đồ Lâm sàng Chuẩn qua 7 Liệu pháp (CBT 11, TEAM-CBT 7, DBT 19 [4 nhóm],
//          IPSRT 7, MBCT Chuỗi 8 bài Chánh niệm, 10 bài Giáo dục Tâm lý, FFT Gia đình 6 bài)
//          với đầy đủ Mục tiêu, Khi nào dùng, Chống chỉ định, Nguồn tham chiếu (NICE/Linehan/Burns),
//          Trạng thái `draft`, và khung thực hành có nút Tạm dừng / Bỏ qua / Dừng / Chạm chọn không cần gõ chữ.
// - Tab 2: Kế hoạch An toàn Cá nhân 6 Mục (§3.4) + Danh bạ Khẩn cấp Ngoại tuyến Đã Kiểm duyệt (§3.3)
//          + Trạng thái luồng 5 mức (`routine_support` -> `emergency_guidance`, không kết luận "nguy cơ thấp").
// - Tab 3: Hỗ trợ Thuốc Tách biệt (§7) + Đa tín hiệu Lưỡng cực (§3.5) + Phân quyền Người thân FFT (§4.7).
// - Tab 4: Thang đo An vui WHO-5 (§6.2) + Xem trước & Ẩn thông tin Nhạy cảm Trước Khi Xuất Báo cáo (§10.3).

import 'package:flutter/material.dart';
import '../../domain/engine/master_plan_governance.dart';

class MobileProtocolSummary {
  final String id;
  final String model;
  final String domain;
  final String titleVi;
  final String goalVi;
  final String precautionVi;
  final String contraindicationVi;
  final String sourceVi;
  final String boundaryVi;
  final int version;
  final String reviewStatus; // 'draft' | 'clinical_review' | 'approved' | 'withdrawn'
  final String publicationStatus; // 'unpublished' | 'published' | 'withdrawn'
  final List<String> applicableConditions; // ['RLLA', 'TC', 'RLLC']
  final List<String> stepsVi;

  const MobileProtocolSummary({
    required this.id,
    required this.model,
    this.domain = '',
    required this.titleVi,
    required this.goalVi,
    required this.precautionVi,
    required this.contraindicationVi,
    required this.sourceVi,
    this.boundaryVi = 'Tự thực hành có hướng dẫn (Self-Guided)',
    this.version = 1,
    this.reviewStatus = 'draft',
    this.publicationStatus = 'unpublished',
    this.applicableConditions = const ['RLLA', 'TC', 'RLLC'],
    this.stepsVi = const <String>[
      'Bước 1: Kiểm tra mức độ phù hợp & mục tiêu',
      'Bước 2: Giải thích kỹ năng ngắn gọn & giới hạn áp dụng',
      'Bước 3: Thực hành từng bước nhỏ (có thể tạm dừng/bỏ qua)',
      'Bước 4: Ghi nhận trải nghiệm & kiểm tra lại sự an toàn',
    ],
  });
}

const List<MobileProtocolSummary> kMasterPlanMobileProtocols = <MobileProtocolSummary>[
  // CBT (11)
  MobileProtocolSummary(
    id: 'CBT_THOUGHT_RECORD',
    model: 'CBT',
    titleVi: '1. Nhật ký Suy nghĩ Có Cấu trúc & Kiểm tra Tính Chính xác',
    goalVi: 'Soi chiếu suy nghĩ tự động và tìm góc nhìn cân bằng (không phủ nhận mất mát có thật).',
    precautionVi: 'Dừng tái cấu trúc nếu suy nghĩ là sự thật khách quan (chuyển sang Giải quyết vấn đề/Xoa dịu).',
    contraindicationVi: 'Không dùng khi đang khủng hoảng cấp (cường độ >= 8/10) hoặc đang hưng cảm.',
    sourceVi: 'NICE Guideline NG222 & Beck Cognitive Therapy Manual',
  ),
  MobileProtocolSummary(
    id: 'CBT_COGNITIVE_REAPPRAISAL',
    model: 'CBT',
    titleVi: '2. Đánh giá Bằng chứng & Tìm Cách Lý giải Thay thế',
    goalVi: 'Giảm cách nhìn cứng nhắc hoặc tự quy chụp mà không tranh cãi với cảm xúc của bạn.',
    precautionVi: 'Tạm dừng nếu cảm thấy bị áp lực.',
    contraindicationVi: 'Không áp dụng trong tình huống nguy hiểm thể chất có thật.',
    sourceVi: 'Greenberger & Padesky (Mind Over Mood) • NICE NG222',
  ),
  MobileProtocolSummary(
    id: 'CBT_BEHAVIORAL_ACTIVATION',
    model: 'CBT',
    titleVi: '3. Kích hoạt Hành vi Theo Giá trị (Kèm Cổng Nghỉ ngơi & Giới hạn Lưỡng cực)',
    goalVi: 'Khôi phục hoạt động nhỏ có ý nghĩa, tôn trọng nhu cầu nghỉ ngơi sinh học.',
    precautionVi: 'Luôn kiểm tra kiệt sức thể chất (Rest Check) trước khi lên lịch.',
    contraindicationVi: 'Chống chỉ định kích hoạt cường độ cao khi có dấu hiệu hưng cảm/hưng cảm nhẹ.',
    sourceVi: 'Martell Behavioral Activation & NICE NG222 / CG185',
  ),
  MobileProtocolSummary(
    id: 'CBT_PROBLEM_SOLVING',
    model: 'CBT',
    titleVi: '4. Giải quyết Vấn đề Thực tế Theo 4 Bước',
    goalVi: 'Xác định 1 vấn đề cụ thể, liệt kê phương án và thử 1 bước nhỏ khả thi.',
    precautionVi: 'Chia thật nhỏ khi đang bị sương mù nhận thức.',
    contraindicationVi: 'Không dùng cho nỗi lo giả định không thể kiểm soát.',
    sourceVi: 'Problem-Solving Therapy Manual • NICE NG222',
  ),
  MobileProtocolSummary(
    id: 'CBT_WORRY_MONITORING',
    model: 'CBT',
    titleVi: '5. Theo dõi Mô thức Lo lắng & Hộp Trì hoãn Lo âu',
    goalVi: 'Phân biệt vấn đề giải quyết được với lo lắng giả định "nhỡ đâu".',
    precautionVi: 'Không dùng khung giờ lo lắng sát giờ đi ngủ.',
    contraindicationVi: 'Không trì hoãn các cảnh báo an toàn thực tế.',
    sourceVi: 'NICE Guideline CG113 (GAD)',
  ),
  MobileProtocolSummary(
    id: 'CBT_INTOLERANCE_UNCERTAINTY',
    model: 'CBT',
    titleVi: '6. Thực hành Dung nạp Sự Bất định',
    goalVi: 'Nhận diện thói quen tìm kiếm sự chắc chắn 100% và tập chịu đựng sự bất định nhỏ.',
    precautionVi: 'Bắt đầu từ tình huống đời thường mức độ nhẹ.',
    contraindicationVi: 'Đang trong trạng thái hoảng loạn cấp.',
    sourceVi: 'Dugas & Robichaud GAD Model • NICE CG113',
  ),
  MobileProtocolSummary(
    id: 'CBT_EXPOSURE_PLANNING',
    model: 'CBT',
    titleVi: '7. Lập Kế hoạch Tiếp xúc Theo Bậc Thang (Exposure Planning)',
    goalVi: 'Giảm né tránh và hành vi an toàn ngầm qua từng bậc nhỏ.',
    precautionVi: 'Các nỗi sợ phức tạp hoặc sang chấn nặng cần có nhà trị liệu đồng hành.',
    contraindicationVi: 'Tình huống thực sự không an toàn.',
    sourceVi: 'Craske Inhibitory Learning & NICE CG113',
  ),
  MobileProtocolSummary(
    id: 'CBT_PANIC_PSYCHOEDUCATION',
    model: 'CBT',
    titleVi: '8. Hiểu Chu trình Hoảng loạn & Ranh giới Thăm khám Y khoa',
    goalVi: 'Hiểu phản ứng giao cảm mà không mặc định mọi triệu chứng cơ thể đều do tâm lý.',
    precautionVi: 'Đau ngực, khó thở cấp hoặc ngất xỉu cần được bác sĩ y khoa khám loại trừ trước.',
    contraindicationVi: 'Cấp cứu nội khoa/tim mạch.',
    sourceVi: 'NICE Guideline CG113 (Panic Disorder)',
  ),
  MobileProtocolSummary(
    id: 'CBT_INTEROCEPTIVE_EXPOSURE',
    model: 'CBT',
    titleVi: '9. Tiếp xúc Cảm giác Cơ thể Nội sinh (Yêu cầu Chuyên gia & Sàng lọc Y khoa)',
    goalVi: 'Làm quen an toàn với cảm giác tim đập/chóng mặt nhẹ dưới sự hướng dẫn chuyên môn.',
    precautionVi: 'Bắt buộc sàng lọc tim mạch, hô hấp, tiền đình và có chuyên gia hướng dẫn.',
    contraindicationVi: 'Bệnh lý tim mạch, hô hấp, thai kỳ có lưu ý hoặc chưa có chuyên gia duyệt.',
    sourceVi: 'Barlow & Craske MAP Protocol • NICE CG113',
    boundaryVi: '👩‍⚕️ Yêu cầu Chuyên gia Đồng hành & Sàng lọc Y khoa',
  ),
  MobileProtocolSummary(
    id: 'CBT_SOCIAL_ANXIETY',
    model: 'CBT',
    titleVi: '10. Công thức hóa Tình huống Xã hội & Giảm Hành vi An toàn',
    goalVi: 'Giảm sự chú ý quá mức vào bản thân và thử bỏ dần hành vi phòng vệ ngầm.',
    precautionVi: 'Thực hành từng bước vừa sức.',
    contraindicationVi: 'Môi trường có bắt nạt hoặc bạo lực thực tế.',
    sourceVi: 'Clark & Wells Social Anxiety Model • NICE CG159',
  ),
  MobileProtocolSummary(
    id: 'CBT_RELAPSE_PREVENTION',
    model: 'CBT',
    titleVi: '11. Tổng kết Bài học & Phòng ngừa Tái phát',
    goalVi: 'Ghi lại kỹ năng hữu ích và dấu hiệu cảnh báo sớm cá nhân (không thay thế tái khám).',
    precautionVi: 'Luôn duy trì lịch tái khám bác sĩ nếu đang điều trị.',
    contraindicationVi: 'Đang trong cơn khủng hoảng cấp.',
    sourceVi: 'NICE NG222 & CG185',
  ),

  // TEAM-CBT (7)
  MobileProtocolSummary(
    id: 'TEAM_SESSION_AGENDA',
    model: 'TEAM-CBT',
    titleVi: '1. Thiết lập Trọng tâm Phiên Tự Phản tư',
    goalVi: 'Chọn 1 mục tiêu cụ thể (chỉ cần lắng nghe hoặc thực hành 1 kỹ năng).',
    precautionVi: 'Công cụ tự phản tư lấy cảm hứng từ TEAM-CBT, không thay thế trị liệu đầy đủ.',
    contraindicationVi: 'Đang trong trạng thái cấp cứu.',
    sourceVi: 'Burns TEAM-CBT Manual Overview',
  ),
  MobileProtocolSummary(
    id: 'TEAM_EMPATHY_EXPLORATION',
    model: 'TEAM-CBT',
    titleVi: '2. Lắng nghe Thấu cảm & Xác nhận Cảm xúc (EAR)',
    goalVi: 'Thấu hiểu và làm dịu cảm xúc trước khi bàn đến chuyện thay đổi.',
    precautionVi: 'Không thúc ép chuyển sang bài tập khi chưa sẵn sàng.',
    contraindicationVi: 'Không có.',
    sourceVi: 'Burns 5 Secrets of Effective Communication',
  ),
  MobileProtocolSummary(
    id: 'TEAM_PARADOXICAL_AGENDA',
    model: 'TEAM-CBT',
    titleVi: '3. Khám phá Lưỡng lự Trước Thay đổi (Không Đổ lỗi)',
    goalVi: 'Nhìn nhận lợi ích và cái giá của việc thay đổi mà không ngụ ý người bệnh cố tình chọn triệu chứng.',
    precautionVi: 'Tuyệt đối không dùng ngôn ngữ đổ lỗi "kháng cự".',
    contraindicationVi: 'Ý nghĩ tự hại hoặc sang chấn cấp.',
    sourceVi: 'Burns Paradoxical Agenda Setting',
  ),
  MobileProtocolSummary(
    id: 'TEAM_POSITIVE_REFRAMING',
    model: 'TEAM-CBT',
    titleVi: '4. Nhận diện Ý nghĩa Bảo vệ & Giá trị Đằng sau Cảm xúc',
    goalVi: 'Thấy được phẩm chất tốt đẹp đằng sau nỗi lo/tự trách mà không lãng mạn hóa nỗi đau.',
    precautionVi: 'Giữ thái độ tôn trọng thực tế.',
    contraindicationVi: 'Khủng hoảng cấp tính.',
    sourceVi: 'Burns Positive Reframing',
  ),
  MobileProtocolSummary(
    id: 'TEAM_COST_BENEFIT_ANALYSIS',
    model: 'TEAM-CBT',
    titleVi: '5. Phân tích Lợi ích & Cái giá Ngắn hạn – Dài hạn',
    goalVi: 'So sánh lợi ích tức thời và hệ quả dài hạn của một niềm tin hay thói quen.',
    precautionVi: 'Người dùng toàn quyền quyết định.',
    contraindicationVi: 'Căng thẳng >= 8/10.',
    sourceVi: 'Burns Cost-Benefit Analysis',
  ),
  MobileProtocolSummary(
    id: 'TEAM_MOTIVATION_CHECK',
    model: 'TEAM-CBT',
    titleVi: '6. Kiểm tra Mức độ Sẵn sàng & Rào cản Thực tế',
    goalVi: 'Hỏi nhẹ nhàng về mức độ sẵn sàng; tôn trọng quyền từ chối bài tập.',
    precautionVi: 'Không gây áp lực điểm số.',
    contraindicationVi: 'Không có.',
    sourceVi: 'TEAM-CBT Readiness Exploration',
  ),
  MobileProtocolSummary(
    id: 'TEAM_SKILL_REVIEW',
    model: 'TEAM-CBT',
    titleVi: '7. Nhìn lại Trải nghiệm Thực hành & Chọn Bước Nhỏ Tiếp theo',
    goalVi: 'Ghi nhận điều gì hữu ích và điều gì chưa phù hợp để điều chỉnh.',
    precautionVi: 'Không coi thay đổi điểm ngắn hạn là bằng chứng khỏi bệnh.',
    contraindicationVi: 'Không có.',
    sourceVi: 'TEAM-CBT Session Review',
  ),

  // DBT (19 across 4 Domains)
  MobileProtocolSummary(
    id: 'DBT_WISE_MIND',
    model: 'DBT',
    domain: '1. Chánh niệm (Mindfulness)',
    titleVi: '1. Tâm Trí Tuệ (Wise Mind — Giao điểm Cảm xúc & Lý trí)',
    goalVi: 'Lắng nghe cả cảm xúc lẫn dữ kiện thực tế; chấp nhận kết quả "chưa biết lúc này".',
    precautionVi: 'Phát hiện và gỡ bỏ giọng nói tự chỉ trích trá hình lý trí.',
    contraindicationVi: 'Không thay thế tư vấn y khoa về thuốc.',
    sourceVi: 'Linehan DBT Skills Training Manual (2nd Ed.)',
  ),
  MobileProtocolSummary(
    id: 'DBT_OBSERVE_DESCRIBE',
    model: 'DBT',
    domain: '1. Chánh niệm (Mindfulness)',
    titleVi: '2. Kỹ năng Quan sát & Mô tả Không Gán Nhãn (Observe & Describe)',
    goalVi: 'Ghi nhận cảm giác và sự việc đúng như thực tế mà không thêm suy diễn.',
    precautionVi: 'Có thể thực hành mở mắt.',
    contraindicationVi: 'Đang phân ly nặng.',
    sourceVi: 'Linehan DBT Manual — Core Mindfulness What Skills',
  ),
  MobileProtocolSummary(
    id: 'DBT_NONJUDGMENTAL_STANCE',
    model: 'DBT',
    domain: '1. Chánh niệm (Mindfulness)',
    titleVi: '3. Thái độ Không Phán xét (Nonjudgmental Stance)',
    goalVi: 'Thay thế nhãn phán xét "tồi tệ/vô dụng" bằng mô tả thực tế.',
    precautionVi: 'Không phán xét chính việc mình đang phán xét.',
    contraindicationVi: 'Không có.',
    sourceVi: 'Linehan DBT Manual — Core Mindfulness How Skills',
  ),
  MobileProtocolSummary(
    id: 'DBT_ONE_MINDFULLY',
    model: 'DBT',
    domain: '1. Chánh niệm (Mindfulness)',
    titleVi: '4. Chuyên tâm Một Việc Trong Hiện tại (One-Mindfully)',
    goalVi: 'Neo sự chú ý vào 1 việc nhỏ duy nhất khi tâm trí bị quá tải.',
    precautionVi: 'Thực hành ngắn 1–3 phút.',
    contraindicationVi: 'Không có.',
    sourceVi: 'Linehan DBT Manual — Core Mindfulness',
  ),
  MobileProtocolSummary(
    id: 'DBT_STOP',
    model: 'DBT',
    domain: '2. Chịu đựng Căng thẳng (Distress Tolerance)',
    titleVi: '5. Kỹ năng Dừng Lại Trước Xung động (STOP)',
    goalVi: 'Dừng lại — Lùi 1 bước — Quan sát — Hành động tỉnh thức.',
    precautionVi: 'Kỹ năng sống sót qua cơn khủng hoảng ngắn hạn.',
    contraindicationVi: 'Nguy hiểm tính mạng cần gọi cấp cứu ngay.',
    sourceVi: 'Linehan DBT Manual — Distress Tolerance',
  ),
  MobileProtocolSummary(
    id: 'DBT_TIPP_SAFE_OPTIONS',
    model: 'DBT',
    domain: '2. Chịu đựng Căng thẳng (Distress Tolerance)',
    titleVi: '6. Hạ nhiệt Sinh lý An toàn (TIPP — Có Sàng lọc Y khoa & Phương án Dịu nhẹ)',
    goalVi: 'Làm dịu kích hoạt thần kinh giao cảm bằng thở 4-6, giãn cơ hoặc khăn mát đã sàng lọc y khoa.',
    precautionVi: 'Dừng ngay nếu thấy chóng mặt; không ép ngâm nước đá hay nín thở sâu.',
    contraindicationVi: 'Bệnh tim mạch, nhịp tim chậm, dùng beta-blocker, rối loạn ăn uống (khóa bước nước lạnh).',
    sourceVi: 'Linehan DBT Manual — TIP Skills & Medical Precautions',
  ),
  MobileProtocolSummary(
    id: 'DBT_ACCEPTS',
    model: 'DBT',
    domain: '2. Chịu đựng Căng thẳng (Distress Tolerance)',
    titleVi: '7. Chuyển hướng Chú ý Tạm thời Qua Cơn Bão (ACCEPTS)',
    goalVi: 'Sử dụng 7 nhóm hoạt động phân tâm lành mạnh khi cảm xúc quá mạnh.',
    precautionVi: 'Chỉ dùng tạm thời để qua cơn sóng lớn, không phải né tránh lâu dài.',
    contraindicationVi: 'Không có.',
    sourceVi: 'Linehan DBT Manual — ACCEPTS',
  ),
  MobileProtocolSummary(
    id: 'DBT_SELF_SOOTHE',
    model: 'DBT',
    domain: '2. Chịu đựng Căng thẳng (Distress Tolerance)',
    titleVi: '8. Tự Xoa dịu Qua 5 Giác quan (Self-Soothe)',
    goalVi: 'Vỗ về hệ thần kinh qua thị giác, thính giác, khứu giác, vị giác và xúc giác.',
    precautionVi: 'Chọn giác quan mang lại cảm giác an toàn nhất.',
    contraindicationVi: 'Không có.',
    sourceVi: 'Linehan DBT Manual — Self-Soothe',
  ),
  MobileProtocolSummary(
    id: 'DBT_PROS_CONS',
    model: 'DBT',
    domain: '2. Chịu đựng Căng thẳng (Distress Tolerance)',
    titleVi: '9. Bảng Cân nhắc Lợi/Hại Trước Xung động Khủng hoảng',
    goalVi: 'So sánh lợi/hại của việc làm theo xung động bốc đồng vs. chờ đợi 48 giờ.',
    precautionVi: 'Đặc biệt hữu ích khi có xung động tiêu tiền/nghỉ việc/cãi vã.',
    contraindicationVi: 'Tự hại cấp tính (chuyển thẳng sang Hỗ trợ Khẩn cấp).',
    sourceVi: 'Linehan DBT Manual — Crisis Pros and Cons',
  ),
  MobileProtocolSummary(
    id: 'DBT_RADICAL_ACCEPTANCE',
    model: 'DBT',
    domain: '2. Chịu đựng Căng thẳng (Distress Tolerance)',
    titleVi: '10. Chấp nhận Thực tại Khách quan (Radical Acceptance)',
    goalVi: 'Nhận diện thực tại không thể thay đổi trong quá khứ/hiện tại để bớt khổ đau chồng chất.',
    precautionVi: 'Chấp nhận thực tại không có nghĩa là đồng tình với sự bất công hay từ bỏ bảo vệ bản thân.',
    contraindicationVi: 'Tình huống đang bị bạo hành cần hành động bảo vệ an toàn.',
    sourceVi: 'Linehan DBT Manual — Radical Acceptance',
  ),
  MobileProtocolSummary(
    id: 'DBT_EMOTION_NAMING',
    model: 'DBT',
    domain: '3. Điều hòa Cảm xúc (Emotion Regulation)',
    titleVi: '11. Nhận diện & Gọi tên Cảm xúc (5 Nhóm Cảm xúc)',
    goalVi: 'Gọi đúng tên cảm xúc và phân biệt rõ Xấu hổ (Shame) với Áy náy (Guilt).',
    precautionVi: 'Không có cảm xúc nào là sai trái.',
    contraindicationVi: 'Không có.',
    sourceVi: 'Linehan DBT Manual — Emotion Regulation',
  ),
  MobileProtocolSummary(
    id: 'DBT_CHECK_THE_FACTS',
    model: 'DBT',
    domain: '3. Điều hòa Cảm xúc (Emotion Regulation)',
    titleVi: '12. Kiểm tra Sự thật Khách quan (Check the Facts)',
    goalVi: 'Xem xét mức độ cảm xúc và giả định có khớp với sự thật quan sát được không.',
    precautionVi: 'Tôn trọng khi nỗi sợ/buồn là hoàn toàn phù hợp với sự thật.',
    contraindicationVi: 'Căng thẳng >= 8/10.',
    sourceVi: 'Linehan DBT Manual — Check the Facts',
  ),
  MobileProtocolSummary(
    id: 'DBT_OPPOSITE_ACTION',
    model: 'DBT',
    domain: '3. Điều hòa Cảm xúc (Emotion Regulation)',
    titleVi: '13. Hành động Đối lập (Kèm Cổng Bảo vệ Khi Nguy hiểm Có thật)',
    goalVi: 'Làm ngược lại thôi thúc rút lui/né tránh khi cảm xúc không khớp với sự thật an toàn.',
    precautionVi: 'Nếu nguy hiểm là có thật (Justified Check), xác nhận việc rút lui bảo vệ mình là đúng.',
    contraindicationVi: 'Tình huống nguy hiểm thực tế.',
    sourceVi: 'Linehan DBT Manual — Opposite Action',
  ),
  MobileProtocolSummary(
    id: 'DBT_PLEASE',
    model: 'DBT',
    domain: '3. Điều hòa Cảm xúc (Emotion Regulation)',
    titleVi: '14. Chăm sóc Nền tảng Sinh học Giảm Tổn thương (PLEASE)',
    goalVi: 'Chăm sóc bệnh thể chất, ăn uống, tránh chất kích thích, giữ giấc ngủ và vận động nhẹ.',
    precautionVi: 'Không ép buộc hoàn hảo.',
    contraindicationVi: 'Không có.',
    sourceVi: 'Linehan DBT Manual — ABC PLEASE',
  ),
  MobileProtocolSummary(
    id: 'DBT_BUILD_POSITIVE_EXPERIENCES',
    model: 'DBT',
    domain: '3. Điều hòa Cảm xúc (Emotion Regulation)',
    titleVi: '15. Tích lũy Trải nghiệm Tích cực & Xây dựng Tự chủ',
    goalVi: 'Thực hiện 1 việc nhỏ mang lại sự dễ chịu hoặc cảm giác làm chủ trong ngày.',
    precautionVi: 'Giữ mức năng lượng vừa phải nếu có tiền sử lưỡng cực.',
    contraindicationVi: 'Pha hưng cảm cấp.',
    sourceVi: 'Linehan DBT Manual — Emotion Regulation',
  ),
  MobileProtocolSummary(
    id: 'DBT_DEAR_MAN',
    model: 'DBT',
    domain: '4. Hiệu quả Liên cá nhân (Interpersonal)',
    titleVi: '16. Giao tiếp Đạt Mục tiêu & Từ chối Lành mạnh (DEAR MAN)',
    goalVi: 'Soạn lời đề nghị hoặc từ chối rõ ràng, bình tĩnh.',
    precautionVi: 'Kiểm tra mức độ an toàn của mối quan hệ trước khi áp dụng.',
    contraindicationVi: 'Tuyệt đối không dùng để đối đầu với người có hành vi bạo lực/cưỡng bức.',
    sourceVi: 'Linehan DBT Manual — DEAR MAN',
  ),
  MobileProtocolSummary(
    id: 'DBT_GIVE',
    model: 'DBT',
    domain: '4. Hiệu quả Liên cá nhân (Interpersonal)',
    titleVi: '17. Giao tiếp Giữ gìn Mối quan hệ Ấm áp (GIVE)',
    goalVi: 'Dịu dàng (Gentle), Quan tâm (Interested), Thấu cảm (Validate), Thoải mái (Easy manner).',
    precautionVi: 'Áp dụng trong mối quan hệ an toàn.',
    contraindicationVi: 'Mối quan hệ bạo hành.',
    sourceVi: 'Linehan DBT Manual — GIVE',
  ),
  MobileProtocolSummary(
    id: 'DBT_FAST',
    model: 'DBT',
    domain: '4. Hiệu quả Liên cá nhân (Interpersonal)',
    titleVi: '18. Giao tiếp Giữ Vững Lòng Tự trọng (FAST)',
    goalVi: 'Công bằng (Fair), Không xin lỗi quá mức (no over-Apologizing), Giữ giá trị (Stick to values), Chân thật (Truthful).',
    precautionVi: 'Giúp phục hồi lòng tự trọng sau cơn bệnh.',
    contraindicationVi: 'Tình huống đe dọa an toàn.',
    sourceVi: 'Linehan DBT Manual — FAST',
  ),
  MobileProtocolSummary(
    id: 'DBT_BOUNDARY_SETTING',
    model: 'DBT',
    domain: '4. Hiệu quả Liên cá nhân (Interpersonal)',
    titleVi: '19. Thiết lập Ranh giới Cá nhân An toàn',
    goalVi: 'Nhận diện giới hạn chịu đựng và truyền đạt ranh giới một cách an toàn.',
    precautionVi: 'Ưu tiên an toàn thân thể hơn là tranh luận.',
    contraindicationVi: 'Đối phương đang mất kiểm soát hoặc có bạo lực.',
    sourceVi: 'Linehan DBT Manual — Boundaries',
  ),

  // IPSRT (7)
  MobileProtocolSummary(
    id: 'IPSRT_RHYTHM_BASELINE',
    model: 'IPSRT',
    titleVi: '1. Thiết lập Mốc Nhịp Sinh học Cá nhân (Baseline + Múi giờ)',
    goalVi: 'Xác định 5 mốc giờ sinh hoạt phù hợp với riêng bạn (không áp đặt một lịch chuẩn chung).',
    precautionVi: 'Lưu kèm ngữ cảnh múi giờ.',
    contraindicationVi: 'Không có.',
    sourceVi: 'Frank (2005) IPSRT Manual & NICE CG185',
  ),
  MobileProtocolSummary(
    id: 'IPSRT_DAILY_RHYTHM_LOG',
    model: 'IPSRT',
    titleVi: '2. Nhật ký 5 Mốc Nhịp Sinh học & Cảm giác Cần Ngủ',
    goalVi: 'Ghi nhận giờ thức, tiếp xúc đầu tiên, làm việc, ăn tối, đi ngủ và tách biệt cảm giác cần ngủ với số giờ ngủ.',
    precautionVi: 'Không phạt điểm khi có ngày bỏ trống.',
    contraindicationVi: 'Không dùng để tự chẩn đoán hưng cảm hay tự đổi thuốc.',
    sourceVi: 'Frank (2005) IPSRT Manual & NICE CG185',
  ),
  MobileProtocolSummary(
    id: 'IPSRT_SOCIAL_EVENT_LOG',
    model: 'IPSRT',
    titleVi: '3. Nhật ký Sự kiện Xã hội Làm Xáo trộn Nhịp Sinh hoạt',
    goalVi: 'Ghi chú chuyến đi xa, đổi ca làm, mất mát hoặc xung đột ảnh hưởng đến giấc ngủ.',
    precautionVi: 'Giúp hiểu nguyên nhân lệch nhịp mà không tự trách.',
    contraindicationVi: 'Không có.',
    sourceVi: 'Frank (2005) IPSRT Zeitgebers',
  ),
  MobileProtocolSummary(
    id: 'IPSRT_RHYTHM_REVIEW',
    model: 'IPSRT',
    titleVi: '4. Đối chiếu Nhịp Sinh hoạt Với Mốc Cá nhân (Không gọi là điểm SRM chuẩn hóa)',
    goalVi: 'Nhìn lại mức độ đều đặn so với chính nền cá nhân của bạn.',
    precautionVi: 'Chỉ số tham khảo nội bộ, không phải thang SRM có bản quyền.',
    contraindicationVi: 'Không có.',
    sourceVi: 'Frank (2005) IPSRT Review',
  ),
  MobileProtocolSummary(
    id: 'IPSRT_ROUTINE_PLANNING',
    model: 'IPSRT',
    titleVi: '5. Lập Kế hoạch Điều chỉnh Nhịp Sinh hoạt Từng Bước Nhỏ',
    goalVi: 'Điều chỉnh giờ thức/ngủ từng bước 15–30 phút khả thi.',
    precautionVi: 'Tuyệt đối không áp dụng hạn chế ngủ (sleep restriction) khi có dấu hiệu lưỡng cực.',
    contraindicationVi: 'Pha hưng cảm hoặc pha hỗn hợp.',
    sourceVi: 'Frank (2005) IPSRT & NICE CG185',
  ),
  MobileProtocolSummary(
    id: 'IPSRT_EARLY_WARNING_PLAN',
    model: 'IPSRT',
    titleVi: '6. Kế hoạch Dấu hiệu Cảnh báo Sớm Cá nhân (Ulysses Plan)',
    goalVi: 'Soạn sẵn dấu hiệu sớm và các bước liên hệ bác sĩ khi đang ở trạng thái bình ổn.',
    precautionVi: 'Khuyến khích thống nhất cùng bác sĩ điều trị.',
    contraindicationVi: 'Không lập giao ước mới khi đang trong cơn hưng cảm/trầm cảm nặng.',
    sourceVi: 'NICE Guideline CG185',
  ),
  MobileProtocolSummary(
    id: 'IPSRT_CLINICIAN_REPORT',
    model: 'IPSRT',
    titleVi: '7. Báo cáo Nhịp Sinh học & Khí sắc Do Người dùng Kiểm soát',
    goalVi: 'Tổng hợp dữ liệu tự theo dõi (có bước xem trước & ẩn thông tin nhạy cảm) để trao đổi với bác sĩ.',
    precautionVi: 'Không chứa chẩn đoán tự động.',
    contraindicationVi: 'Không có.',
    sourceVi: 'NICE CG185 Collaborative Care',
  ),

  // MBCT (8)
  MobileProtocolSummary(
    id: 'MBCT_AUTOMATIC_PILOT',
    model: 'MBCT',
    titleVi: 'Bài 1: Nhận diện Chế độ Tự động (Automatic Pilot)',
    goalVi: 'Nhận ra thói quen phản ứng vô thức hằng ngày với lựa chọn mở mắt tiếp đất an toàn.',
    precautionVi: 'Dừng ngay nếu bài tập làm tăng phân ly hoặc bồn chồn.',
    contraindicationVi: 'Hoảng loạn cấp hoặc loạn thần.',
    sourceVi: 'Segal, Williams, & Teasdale (2013) MBCT Manual',
  ),
  MobileProtocolSummary(
    id: 'MBCT_BODY_SCAN',
    model: 'MBCT',
    titleVi: 'Bài 2: Quét Cơ thể Dịu nhẹ (Có Lựa chọn Mở mắt / Tiếp đất)',
    goalVi: 'Quan sát cảm giác cơ thể nhẹ nhàng; có thể chuyển sang cảm nhận bàn chân chạm sàn bất cứ lúc nào.',
    precautionVi: 'Hoàn thành audio không đồng nghĩa hoàn thành khóa MBCT lâm sàng.',
    contraindicationVi: 'Nếu quét cơ thể kích hoạt hồi tưởng sang chấn -> chuyển sang Tiếp đất mở mắt.',
    sourceVi: 'Segal, Williams, & Teasdale (2013) MBCT Manual',
  ),
  MobileProtocolSummary(
    id: 'MBCT_MINDFUL_BREATHING',
    model: 'MBCT',
    titleVi: 'Bài 3: Gom Tâm trí Phân tán Về Nhịp thở Tự nhiên',
    goalVi: 'Dùng hơi thở tự nhiên hoặc âm thanh xung quanh làm điểm tựa chú ý.',
    precautionVi: 'Không ép nín thở hay thở quá sâu gây choáng váng.',
    contraindicationVi: 'Đang khó thở thực thể.',
    sourceVi: 'Segal, Williams, & Teasdale (2013) MBCT Manual',
  ),
  MobileProtocolSummary(
    id: 'MBCT_PRESENT_MOMENT',
    model: 'MBCT',
    titleVi: 'Bài 4: Nhận diện Sự Chống cự & Quay về Hiện tại',
    goalVi: 'Nhận biết cách tâm trí phản ứng khi gặp cảm giác khó chịu mà không ép phải thư giãn ngay.',
    precautionVi: 'Thực hành ngắn vừa sức.',
    contraindicationVi: 'Khủng hoảng cấp.',
    sourceVi: 'Segal, Williams, & Teasdale (2013) MBCT Manual',
  ),
  MobileProtocolSummary(
    id: 'MBCT_ALLOWING_AND_ACCEPTING',
    model: 'MBCT',
    titleVi: 'Bài 5: Cho phép Cảm xúc Hiện diện Không Đấu tranh',
    goalVi: 'Nuôi dưỡng thái độ dịu dàng, không tự trách trước cảm xúc đang có.',
    precautionVi: 'Có thể dừng bất cứ lúc nào.',
    contraindicationVi: 'Khủng hoảng cấp.',
    sourceVi: 'Segal, Williams, & Teasdale (2013) MBCT Manual',
  ),
  MobileProtocolSummary(
    id: 'MBCT_THOUGHTS_ARE_NOT_FACTS',
    model: 'MBCT',
    titleVi: 'Bài 6: Suy nghĩ Chỉ Là Sự kiện Tâm trí, Không Phải Sự thật Tuyệt đối',
    goalVi: 'Lùi lại một bước để quan sát suy nghĩ tiêu cực đến rồi đi (Decentering).',
    precautionVi: 'Kỹ năng tự lực bổ trợ, không thay thế trị liệu chuyên khoa.',
    contraindicationVi: 'Khủng hoảng cấp.',
    sourceVi: 'Segal, Williams, & Teasdale (2013) MBCT Manual',
  ),
  MobileProtocolSummary(
    id: 'MBCT_RESPONDING_NOT_REACTING',
    model: 'MBCT',
    titleVi: 'Bài 7: Phản hồi Tỉnh thức Thay vì Phản ứng Tự động',
    goalVi: 'Dùng khoảng thở 3 phút trước khi chọn 1 hành động chăm sóc bản thân.',
    precautionVi: 'Chọn bước nhỏ vừa sức.',
    contraindicationVi: 'Không có.',
    sourceVi: 'Segal, Williams, & Teasdale (2013) MBCT Manual',
  ),
  MobileProtocolSummary(
    id: 'MBCT_RELAPSE_AWARENESS',
    model: 'MBCT',
    titleVi: 'Bài 8: Duy trì Tỉnh thức & Nhận diện Dấu hiệu Trầm buồn Quay lại',
    goalVi: 'Kết nối chánh niệm với kế hoạch nhận diện sớm và hỗ trợ chuyên môn.',
    precautionVi: 'Không thay thế lịch tái khám bác sĩ.',
    contraindicationVi: 'Không có.',
    sourceVi: 'Segal, Williams, & Teasdale (2013) MBCT Manual & NICE NG222',
  ),

  // Psychoeducation (10)
  MobileProtocolSummary(
    id: 'PSYEDU_DEPRESSION',
    model: 'Psychoeducation',
    titleVi: '1. Hiểu về Trầm cảm & Vòng xoáy Kiệt sức – Rút lui',
    goalVi: 'Hiểu triệu chứng trầm cảm dưới góc nhìn khoa học, không đổ lỗi cho sự yếu đuối cá nhân.',
    precautionVi: 'Bài viết giáo dục sức khỏe, không dùng để tự chẩn đoán.',
    contraindicationVi: 'Không có.',
    sourceVi: 'NICE Guideline NG222 • Ngày duyệt bản nháp: 2026-11-23',
  ),
  MobileProtocolSummary(
    id: 'PSYEDU_ANXIETY_WORRY',
    model: 'Psychoeducation',
    titleVi: '2. Hiểu về Rối loạn Lo âu, Lo lắng Kéo dài & Hành vi An toàn',
    goalVi: 'Giải thích cơ chế né tránh và tìm kiếm trấn an làm duy trì nỗi lo.',
    precautionVi: 'Không thay thế thăm khám chuyên khoa.',
    contraindicationVi: 'Không có.',
    sourceVi: 'NICE Guideline CG113 • Ngày duyệt bản nháp: 2026-11-23',
  ),
  MobileProtocolSummary(
    id: 'PSYEDU_PANIC_MEDICAL',
    model: 'Psychoeducation',
    titleVi: '3. Hiểu Triệu chứng Cơn Hoảng loạn & Khi Nào Cần Khám Y khoa Thực thể',
    goalVi: 'Phân biệt phản ứng hoảng loạn với các dấu hiệu tim mạch/hô hấp cần khám bác sĩ.',
    precautionVi: 'Luôn ưu tiên khám y khoa khi có triệu chứng cơ thể mới hoặc bất thường.',
    contraindicationVi: 'Không có.',
    sourceVi: 'NICE Guideline CG113 • Ngày duyệt bản nháp: 2026-11-23',
  ),
  MobileProtocolSummary(
    id: 'PSYEDU_BIPOLAR_EPISODES',
    model: 'Psychoeducation',
    titleVi: '4. Hiểu về Rối loạn Lưỡng cực & Các Pha Khí sắc',
    goalVi: 'Nhận biết pha trầm cảm, hưng cảm nhẹ, hưng cảm và pha hỗn hợp mà không đơn giản hóa quá mức.',
    precautionVi: 'Chẩn đoán lưỡng cực bắt buộc phải do bác sĩ chuyên khoa tâm thần thực hiện.',
    contraindicationVi: 'Không có.',
    sourceVi: 'NICE Guideline CG185 • Ngày duyệt bản nháp: 2026-11-23',
  ),
  MobileProtocolSummary(
    id: 'PSYEDU_SLEEP_ROUTINE_MOOD',
    model: 'Psychoeducation',
    titleVi: '5. Mối liên hệ Giữa Giấc ngủ, Nhịp Sinh học và Ổn định Khí sắc',
    goalVi: 'Hiểu vì sao giữ đều giờ thức – ngủ lại bảo vệ não bộ khỏi dao động khí sắc.',
    precautionVi: 'Tài liệu giáo dục sức khỏe.',
    contraindicationVi: 'Không có.',
    sourceVi: 'NICE CG185 & IPSRT Literature • Ngày duyệt bản nháp: 2026-11-23',
  ),
  MobileProtocolSummary(
    id: 'PSYEDU_MEDICATION_CONVERSATIONS',
    model: 'Psychoeducation',
    titleVi: '6. Cách Trao đổi Về Thuốc & Tác dụng phụ Cùng Bác sĩ Điều trị',
    goalVi: 'Gợi ý các câu hỏi giúp bạn trao đổi cởi mở với bác sĩ kê đơn hoặc dược sĩ.',
    precautionVi: 'Tuyệt đối không tự ý ngưng hoặc đổi liều thuốc.',
    contraindicationVi: 'Không có.',
    sourceVi: 'NICE CG185 & NG197 • Ngày duyệt bản nháp: 2026-11-23',
  ),
  MobileProtocolSummary(
    id: 'PSYEDU_EARLY_WARNING_SIGNS',
    model: 'Psychoeducation',
    titleVi: '7. Nhận diện Dấu hiệu Cảnh báo Sớm Cá nhân',
    goalVi: 'Cách phát hiện sớm những thay đổi nhỏ về giấc ngủ, năng lượng và giao tiếp.',
    precautionVi: 'Kết hợp cùng kế hoạch thăm khám bác sĩ.',
    contraindicationVi: 'Không có.',
    sourceVi: 'Lam et al. & NICE CG185 • Ngày duyệt bản nháp: 2026-11-23',
  ),
  MobileProtocolSummary(
    id: 'PSYEDU_SUPPORT_FAMILY_MEMBER',
    model: 'Psychoeducation',
    titleVi: '8. Cách Đồng hành & Hỗ trợ Người thân Thấu cảm, Tôn trọng Ranh giới',
    goalVi: 'Hướng dẫn người thân lắng nghe không phán xét và tôn trọng quyền tự quyết của người bệnh.',
    precautionVi: 'Dành cho cả người dùng và người thân được sự đồng ý.',
    contraindicationVi: 'Không có.',
    sourceVi: 'Miklowitz FFT & NICE CG185 • Ngày duyệt bản nháp: 2026-11-23',
  ),
  MobileProtocolSummary(
    id: 'PSYEDU_PREPARE_APPOINTMENT',
    model: 'Psychoeducation',
    titleVi: '9. Chuẩn bị Câu hỏi & Thông tin Trước Buổi Tái khám',
    goalVi: 'Tóm tắt triệu chứng, giấc ngủ, câu hỏi về thuốc và mục tiêu cá nhân trước khi gặp bác sĩ.',
    precautionVi: 'Tài liệu hướng dẫn.',
    contraindicationVi: 'Không có.',
    sourceVi: 'NICE Shared Decision Making NG197 • Ngày duyệt bản nháp: 2026-11-23',
  ),
  MobileProtocolSummary(
    id: 'PSYEDU_MYTHS_STIGMA_COMPASSION',
    model: 'Psychoeducation',
    titleVi: '10. Hóa giải Định kiến, Tự Kỳ thị và Thực hành Tự Trắc ẩn',
    goalVi: 'Tách biệt triệu chứng tâm lý khỏi sự phán xét đạo đức và nuôi dưỡng lòng tử tế với bản thân.',
    precautionVi: 'Tài liệu giáo dục.',
    contraindicationVi: 'Không có.',
    sourceVi: 'WHO Mental Health Anti-Stigma Principles • Ngày duyệt bản nháp: 2026-11-23',
  ),

  // FFT (6)
  MobileProtocolSummary(
    id: 'FFT_PSYCHOEDUCATION',
    model: 'FFT',
    titleVi: '1. Hỗ trợ Gia đình (FFT): Cùng Hiểu Đúng Về Triệu chứng & Điều trị',
    goalVi: 'Xây dựng sự hiểu biết chung không đổ lỗi giữa người bệnh và người thân được mời.',
    precautionVi: 'Tính năng hỗ trợ gia đình trong app không thay thế chương trình FFT lâm sàng đầy đủ.',
    contraindicationVi: 'Không áp dụng khi mối quan hệ gia đình không an toàn hoặc có bạo hành.',
    sourceVi: 'Miklowitz (2010) FFT Manual & NICE CG185',
  ),
  MobileProtocolSummary(
    id: 'FFT_COMMUNICATION_LISTENING',
    model: 'FFT',
    titleVi: '2. Hỗ trợ Gia đình (FFT): Kỹ năng Lắng nghe Chủ động Không Phán xét',
    goalVi: 'Thực hành lắng nghe bình tĩnh và xác nhận cảm xúc trong gia đình.',
    precautionVi: 'Yêu cầu sự đồng thuận từ cả hai phía.',
    contraindicationVi: 'Mối quan hệ có bạo lực hoặc cưỡng ép.',
    sourceVi: 'Miklowitz (2010) FFT Manual',
  ),
  MobileProtocolSummary(
    id: 'FFT_COMMUNICATION_PRACTICE',
    model: 'FFT',
    titleVi: '3. Hỗ trợ Gia đình (FFT): Diễn đạt Nhu cầu & Lời đề nghị Cụ thể, Tích cực',
    goalVi: 'Nêu lời đề nghị rõ ràng, giảm chỉ trích nặng lời trong gia đình.',
    precautionVi: 'Có thể dừng bất cứ lúc nào.',
    contraindicationVi: 'Xung đột bạo lực.',
    sourceVi: 'Miklowitz (2010) FFT Manual',
  ),
  MobileProtocolSummary(
    id: 'FFT_PROBLEM_SOLVING',
    model: 'FFT',
    titleVi: '4. Hỗ trợ Gia đình (FFT): Cùng Giải quyết Vấn đề Chung Từng Bước',
    goalVi: 'Chọn 1 vấn đề sinh hoạt cụ thể và cùng bàn phương án hỗ trợ nhẹ nhàng.',
    precautionVi: 'Tôn trọng quyền quyết định của người bệnh.',
    contraindicationVi: 'Xung đột gay gắt đang leo thang.',
    sourceVi: 'Miklowitz (2010) FFT Manual',
  ),
  MobileProtocolSummary(
    id: 'FFT_EARLY_WARNING_PLAN',
    model: 'FFT',
    titleVi: '5. Hỗ trợ Gia đình (FFT): Thống nhất Dấu hiệu Sớm & Cách Hỗ trợ',
    goalVi: 'Ghi rõ những việc người thân được phép hỗ trợ khi người bệnh có dấu hiệu chuyển pha.',
    precautionVi: 'Do người bệnh toàn quyền phê duyệt và có thể thu hồi bất cứ lúc nào.',
    contraindicationVi: 'Không có sự đồng ý của người bệnh.',
    sourceVi: 'Miklowitz (2010) FFT & NICE CG185',
  ),
  MobileProtocolSummary(
    id: 'FFT_CAREGIVER_SELF_CARE',
    model: 'FFT',
    titleVi: '6. Chăm sóc Sức khỏe Tinh thần & Ranh giới Cho Người thân Đồng hành',
    goalVi: 'Giúp người thân nhận diện căng thẳng, giữ ranh giới lành mạnh và phòng ngừa kiệt sức.',
    precautionVi: 'Dành cho người thân đồng hành.',
    contraindicationVi: 'Không có.',
    sourceVi: 'NICE Guideline CG185 — Support for Carers',
  ),
];

class ClinicalMasterPlanScreen extends StatefulWidget {
  final int currentMoodPolarity;
  final int currentEnergyLevel;
  final VoidCallback onOpenEmergencySos;

  const ClinicalMasterPlanScreen({
    super.key,
    required this.currentMoodPolarity,
    required this.currentEnergyLevel,
    required this.onOpenEmergencySos,
  });

  @override
  State<ClinicalMasterPlanScreen> createState() => _ClinicalMasterPlanScreenState();
}

class _ClinicalMasterPlanScreenState extends State<ClinicalMasterPlanScreen> {
  int _activeSectionIndex = 0; // 0: Lộ trình 3 Tầng, 1: 68 Phác đồ, 2: An toàn & 115, 3: Thuốc & FFT, 4: WHO-5 & Báo cáo
  String _selectedModel = 'CBT';
  String _selectedCondition = 'ALL'; // 'ALL' | 'RLLA' | 'TC' | 'RLLC'
  String _highlightedProtocolHint = '';
  bool _nonWritingTapMode = false;
  bool _mbctEyesOpenGrounding = true;
  String _selectedTapChip = 'Mình muốn đi từng bước thật nhỏ và chậm rãi';

  // 3-Tier Onboarding & 4-Stage Phased Care Pathway State (T04 SAFE-01: Clean unanswered defaults!)
  int _onboardingStep = 1;
  bool _isCaregiverRole = false;
  bool _acuteRedFlag48h = false;
  bool _confirmedSafeAfterSos = false;
  int _phq9Score = 0;
  int _phq9Item9Score = 0;
  int _gad7Score = 0;
  bool _mdqBipolarPositive = false;
  String _emotionalStyle = 'A'; // 'A' -> CBT/TEAM-CBT, 'B' -> DBT Core
  int _resistanceScore = 0; // >= 4 unlocks Stage 2 Gỡ rào cản
  final List<String> _worryBoxItems = <String>[];

  // Safety Plan 6 Sections (§3.4 — T04 SAFE-01: Empty unfabricated defaults!)
  final TextEditingController _sp1Ctrl = TextEditingController();
  final TextEditingController _sp2Ctrl = TextEditingController();
  final TextEditingController _sp3Ctrl = TextEditingController();
  final TextEditingController _sp4NameCtrl = TextEditingController();
  final TextEditingController _sp4PhoneCtrl = TextEditingController();
  final TextEditingController _sp5Ctrl = TextEditingController();
  final TextEditingController _sp6Ctrl = TextEditingController();
  bool _spConsentContacts = false;
  String _spSaveStatus = '';

  // Medication (§7) & Multi-Signal Bipolar (§3.5) (T04 SAFE-01: Empty regimen & unanswered status!)
  final TextEditingController _medNameCtrl = TextEditingController();
  final TextEditingController _medScheduleCtrl = TextEditingController();
  final TextEditingController _medSideEffectCtrl = TextEditingController();
  String _medIntakeStatus = '';
  final List<String> _medLogEntries = <String>[];

  bool _sigReducedSleepNeed = false;
  bool _sigElevatedIrritable = false;
  bool _sigIncreasedEnergy = false;
  bool _sigRacingThoughts = false;
  bool _sigImpulsivity = false;
  bool _sigRoutineDeviation = false;

  // FFT Caregiver Granular Access Grant (§4.7 — T04 SAFE-01: Default false until patient explicitly grants!)
  bool _cgAllowEarlyWarning = false;
  bool _cgAllowFftModules = false;
  bool _cgAllowRhythmSummary = false;
  bool _cgAllowPrivateJournals = false;
  bool _cgAllowSessionContent = false;
  bool _cgAllowAssessmentAnswers = false;
  bool _cgRevoked = false;

  // WHO-5 (§6.2) & Report Redaction (§10.3) (T04 SAFE-01: Zero/Unanswered by default!)
  final List<int> _who5Scores = <int>[0, 0, 0, 0, 0];
  bool _redactJournals = true;
  bool _redactSessions = true;
  bool _redactRawItems = true;

  @override
  void dispose() {
    _sp1Ctrl.dispose();
    _sp2Ctrl.dispose();
    _sp3Ctrl.dispose();
    _sp4NameCtrl.dispose();
    _sp4PhoneCtrl.dispose();
    _sp5Ctrl.dispose();
    _sp6Ctrl.dispose();
    _medNameCtrl.dispose();
    _medScheduleCtrl.dispose();
    _medSideEffectCtrl.dispose();
    super.dispose();
  }

  void _jumpToProtocolSection(String model, String hintMessage) {
    setState(() {
      _selectedModel = model;
      _highlightedProtocolHint = hintMessage;
      _activeSectionIndex = 1;
    });
  }

  void _openQuickWorryBoxDialog() {
    final TextEditingController worryCtrl = TextEditingController();
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('📦 Cất Nỗi Lo Vào Hộp Tạm Thời', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Khi một nỗi lo "nhỡ đâu..." ập đến làm bạn mất tập trung hoặc khó ngủ, hãy viết ngắn gọn để cất vào Hộp Lo Âu và hẹn giờ xem lại lúc 17:30:',
              style: TextStyle(fontSize: 12.5, height: 1.4),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: worryCtrl,
              maxLines: 2,
              decoration: InputDecoration(
                hintText: 'Ví dụ: Lo ngày mai công việc không kịp tiến độ...',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Đóng'),
          ),
          ElevatedButton(
            onPressed: () {
              final text = worryCtrl.text.trim().isEmpty
                  ? 'Nỗi lo chưa đặt tên (đã cất tạm vào hộp)'
                  : worryCtrl.text.trim();
              setState(() => _worryBoxItems.insert(0, text));
              Navigator.of(ctx).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('📦 Đã cất nỗi lo vào Hộp Lo Âu an toàn. Tâm trí bạn được phép nghỉ ngơi lúc này!'),
                  backgroundColor: Color(0xFF2B4C43),
                ),
              );
            },
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF2B4C43), foregroundColor: Colors.white),
            child: const Text('Cất vào Hộp Lo Âu'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final activeSignalsCount = <bool>[
      _sigReducedSleepNeed,
      _sigElevatedIrritable,
      _sigIncreasedEnergy,
      _sigRacingThoughts,
      _sigImpulsivity,
      _sigRoutineDeviation,
    ].where((b) => b).length;

    final pathwayStateLabel = activeSignalsCount >= 2
        ? 'Cần kết nối bác sĩ hỗ trợ sớm'
        : 'Hỗ trợ thường quy (Không tự kết luận nguy cơ thấp)';

    final sectionTabs = <Map<String, Object>>[
      {'index': 0, 'label': '🎯 1. Lộ trình 3 Tầng'},
      {'index': 1, 'label': '🧭 2. Kho 68 Phác đồ'},
      {'index': 2, 'label': '🛡️ 3. An toàn & 115'},
      {'index': 3, 'label': '💊 4. Thuốc & Gia đình'},
      {'index': 4, 'label': '📋 5. WHO-5 & Báo cáo'},
    ];

    return Column(
      children: [
        if (_phq9Item9Score >= 1 || _acuteRedFlag48h)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            color: const Color(0xFFFFF1F2),
            child: Row(
              children: [
                const Icon(Icons.push_pin, color: Color(0xFFBE123C), size: 18),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    '📌 ĐÃ GHIM KẾ HOẠCH AN TOÀN: ${_sp2Ctrl.text} • Liên hệ: ${_sp4PhoneCtrl.text} / 115',
                    style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: Color(0xFF881337)),
                  ),
                ),
                TextButton(
                  onPressed: () => setState(() => _activeSectionIndex = 2),
                  child: const Text('Mở ngay', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800, color: Color(0xFFBE123C))),
                ),
              ],
            ),
          ),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
          color: const Color(0xFFECFDF5),
          child: Row(
            children: [
              const Icon(Icons.verified_user_outlined, color: Color(0xFF065F46), size: 18),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Trạng thái: $pathwayStateLabel • Sàng lọc không phải chẩn đoán.',
                  style: const TextStyle(fontSize: 11.5, color: Color(0xFF065F46), height: 1.3),
                ),
              ),
              TextButton(
                onPressed: widget.onOpenEmergencySos,
                style: TextButton.styleFrom(
                  backgroundColor: const Color(0xFFBE123C),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                ),
                child: const Text('SOS / 115', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700)),
              ),
            ],
          ),
        ),
        // Wrapped 5-Section Selector Grid — 100% visible without horizontal scrolling!
        Container(
          width: double.infinity,
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
          child: Wrap(
            spacing: 6,
            runSpacing: 6,
            children: sectionTabs.map((item) {
              final idx = item['index']! as int;
              final label = item['label']! as String;
              final isSelected = _activeSectionIndex == idx;
              return InkWell(
                borderRadius: BorderRadius.circular(10),
                onTap: () => setState(() => _activeSectionIndex = idx),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 7),
                  decoration: BoxDecoration(
                    color: isSelected ? const Color(0xFF2B4C43) : const Color(0xFFF3F7F5),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: isSelected ? const Color(0xFF2B4C43) : const Color(0xFFD5E0DC),
                    ),
                  ),
                  child: Text(
                    label,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: isSelected ? Colors.white : const Color(0xFF1F2C33),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
        const Divider(height: 1),
        Expanded(
          child: _buildActiveSectionBody(activeSignalsCount),
        ),
      ],
    );
  }

  Widget _buildActiveSectionBody(int activeSignalsCount) {
    switch (_activeSectionIndex) {
      case 0:
        return _buildThreeTierJourneyTab();
      case 1:
        return _buildProtocols68Tab();
      case 2:
        return _buildSafetyPlanAndDirectoryTab();
      case 3:
        return _buildMedicationBipolarAndFftTab(activeSignalsCount);
      default:
        return _buildWho5AndRedactionTab();
    }
  }

  Widget _buildThreeTierJourneyTab() {
    final String suggestedTrackTitle = _isCaregiverRole
        ? 'Track 4: Lộ trình Đồng hành Gia đình (FFT)'
        : _mdqBipolarPositive
            ? 'Track 1: Lộ trình Cân bằng Nhịp Sinh học & Khí sắc (IPSRT + DBT/CBT)'
            : _emotionalStyle == 'B'
                ? 'Track 2: Lộ trình Điều tiết Cảm xúc Mạnh & Chịu đựng Căng thẳng (DBT Core)'
                : 'Track 3: Lộ trình Gỡ rối Suy nghĩ & Kích hoạt Hành vi (CBT / TEAM-CBT)';

    final String suggestedCoreModel = _isCaregiverRole
        ? 'FFT'
        : _mdqBipolarPositive
            ? 'IPSRT'
            : _emotionalStyle == 'B'
                ? 'DBT'
                : 'CBT';

    final bool stage2Unlocked = _resistanceScore >= 4;
    final bool blockedByRedFlag = _acuteRedFlag48h && !_confirmedSafeAfterSos;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // TIER 1: 4-SCREEN ONBOARDING & TRIAGE
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFD8E3DF)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'TẦNG 1: SÀNG LỌC & PHÂN LUỒNG AN TOÀN (4 MÀN HÌNH NGẮN)',
                style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800, color: Color(0xFF2B4C43)),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 6,
                children: [1, 2, 3, 4].map((step) {
                  final active = _onboardingStep == step;
                  return ChoiceChip(
                    showCheckmark: false,
                    label: Text('Màn $step/4', style: const TextStyle(fontSize: 12)),
                    selected: active,
                    selectedColor: const Color(0xFF2B4C43),
                    labelStyle: TextStyle(
                      color: active ? Colors.white : const Color(0xFF1F2C33),
                      fontWeight: FontWeight.w700,
                    ),
                    onSelected: (_) => setState(() => _onboardingStep = step),
                  );
                }).toList(),
              ),
              const Divider(height: 18),
              if (_onboardingStep == 1) ...[
                const Text('Câu 1 (Vai trò): Bạn dùng ứng dụng cho chính mình hay hỗ trợ người thân?', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: [
                    ChoiceChip(
                      showCheckmark: false,
                      label: const Text('🙋 Cho chính mình'),
                      selected: !_isCaregiverRole,
                      selectedColor: const Color(0xFFDCFCE7),
                      onSelected: (_) => setState(() => _isCaregiverRole = false),
                    ),
                    ChoiceChip(
                      showCheckmark: false,
                      label: const Text('🤝 Hỗ trợ người thân (→ Track 4 FFT)'),
                      selected: _isCaregiverRole,
                      selectedColor: const Color(0xFFDCFCE7),
                      onSelected: (_) => setState(() => _isCaregiverRole = true),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                const Text(
                  'Câu 2: Trong 48 giờ qua, bạn có ý định tự làm hại bản thân, hoặc mất ngủ nhiều ngày liên tục kèm kích động mất kiểm soát không?',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 10,
                  runSpacing: 6,
                  children: [
                    ChoiceChip(
                      showCheckmark: false,
                      avatar: const Icon(Icons.check_circle, color: Color(0xFF16A34A), size: 18),
                      label: const Text('Không có', style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF166534))),
                      selected: !_acuteRedFlag48h,
                      selectedColor: const Color(0xFFDCFCE7),
                      backgroundColor: Colors.white,
                      onSelected: (_) => setState(() {
                        _acuteRedFlag48h = false;
                        _confirmedSafeAfterSos = false;
                      }),
                    ),
                    ChoiceChip(
                      showCheckmark: false,
                      avatar: const Icon(Icons.emergency_rounded, color: Color(0xFFDC2626), size: 18),
                      label: const Text('Có', style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF991B1B))),
                      selected: _acuteRedFlag48h,
                      selectedColor: const Color(0xFFFEE2E2),
                      backgroundColor: Colors.white,
                      onSelected: (_) => setState(() {
                        _acuteRedFlag48h = true;
                        _confirmedSafeAfterSos = false;
                      }),
                    ),
                  ],
                ),
                if (blockedByRedFlag) ...[
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFDC2626), width: 1.5),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          '🚨 ĐÃ TẠM KHÓA LUỒNG THƯỜNG ĐỂ ƯU TIÊN AN TOÀN CỦA BẠN',
                          style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800, color: Color(0xFF991B1B)),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          '• Tổng đài: 115 / 1900 1267 (BV Bạch Mai) / 028 3923 4675 (BV Tâm thần TP.HCM)\n'
                          '• Hạ nhiệt tức thì: DBT TIPP (Hít nhẹ bằng mũi 4s – thở chậm bằng miệng 6s)',
                          style: TextStyle(fontSize: 12, color: Color(0xFF7F1D1D)),
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            ElevatedButton(
                              onPressed: widget.onOpenEmergencySos,
                              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFDC2626), foregroundColor: Colors.white),
                              child: const Text('Mở Màn hình SOS & Thở Mũi/Miệng', style: TextStyle(fontSize: 12)),
                            ),
                            OutlinedButton(
                              onPressed: () => setState(() => _confirmedSafeAfterSos = true),
                              child: const Text('Tôi đã ở trạng thái an toàn để vào app', style: TextStyle(fontSize: 12)),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ] else if (_onboardingStep == 2) ...[
                Text(
                  'Câu 1. Mức độ trầm buồn, mệt mỏi, mất hứng thú trong 2 tuần qua (Thang PHQ-9: $_phq9Score/27):',
                  style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700),
                ),
                Slider(
                  value: _phq9Score.toDouble(),
                  min: 0,
                  max: 27,
                  divisions: 27,
                  onChanged: (v) => setState(() => _phq9Score = v.round()),
                ),
                Text(
                  'Câu 2. Tần suất xuất hiện ý nghĩ tự làm hại bản thân hoặc nghĩ rằng mình biến mất sẽ tốt hơn ($_phq9Item9Score/3 — nếu ≥ 1 sẽ tự động ghim Kế hoạch An toàn):',
                  style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700),
                ),
                Slider(
                  value: _phq9Item9Score.toDouble(),
                  min: 0,
                  max: 3,
                  divisions: 3,
                  onChanged: (v) => setState(() => _phq9Item9Score = v.round()),
                ),
                const Text(
                  '0: Không lúc nào • 1: Vài ngày • 2: Hơn nửa số ngày • 3: Gần như mỗi ngày',
                  style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                ),
                const SizedBox(height: 8),
                Text(
                  'Câu 3. Mức độ lo âu, bồn chồn, căng thẳng khó kiểm soát trong 2 tuần qua (Thang GAD-7: $_gad7Score/21):',
                  style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700),
                ),
                Slider(
                  value: _gad7Score.toDouble(),
                  min: 0,
                  max: 21,
                  divisions: 21,
                  onChanged: (v) => setState(() => _gad7Score = v.round()),
                ),
              ] else if (_onboardingStep == 3) ...[
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text(
                    'Sàng lọc Lưỡng cực (MDQ rút gọn + Tiền sử): Từng có giai đoạn ngủ 3–4 tiếng không mệt, tăng năng lượng bất thường kèm bốc đồng hoặc có tiền sử Lưỡng cực',
                    style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600),
                  ),
                  value: _mdqBipolarPositive,
                  onChanged: (v) => setState(() => _mdqBipolarPositive = v ?? false),
                ),
              ] else ...[
                const Text('Câu 1. Cường độ & Phong cách Cảm xúc (Phân loại CBT vs. DBT):', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                RadioListTile<String>(
                  dense: true,
                  contentPadding: EdgeInsets.zero,
                  value: 'A',
                  groupValue: _emotionalStyle,
                  onChanged: (v) => setState(() => _emotionalStyle = v ?? 'A'),
                  title: const Text('Lựa chọn A: Suy nghĩ luẩn quẩn, tự trách, lo xa kịch bản xấu (→ CBT / TEAM-CBT)', style: TextStyle(fontSize: 12.5)),
                ),
                RadioListTile<String>(
                  dense: true,
                  contentPadding: EdgeInsets.zero,
                  value: 'B',
                  groupValue: _emotionalStyle,
                  onChanged: (v) => setState(() => _emotionalStyle = v ?? 'B'),
                  title: const Text('Lựa chọn B: Cảm xúc bùng nổ dữ dội, hoảng loạn, tức giận hoặc trống rỗng (→ DBT)', style: TextStyle(fontSize: 12.5)),
                ),
                Text('Câu 2. Mức độ mệt mỏi, trì hoãn hoặc tâm lý "biết nhưng không làm được" ($_resistanceScore/10):', style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700)),
                Slider(
                  value: _resistanceScore.toDouble(),
                  min: 0,
                  max: 10,
                  divisions: 10,
                  onChanged: (v) => setState(() => _resistanceScore = v.round()),
                ),
              ],
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFF0FDF4),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '🎯 Lộ trình Gợi ý Hiện tại (Không phải chẩn đoán): $suggestedTrackTitle',
                  style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: Color(0xFF065F46)),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // TIER 2: 4-STAGE PHASED CARE PATHWAY (Interactive clickable stages!)
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFD8E3DF)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'TẦNG 2: LỘ TRÌNH TRỊ LIỆU 4 CHẶNG (PHASED CARE PATHWAY)',
                style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800, color: Color(0xFF2B4C43)),
              ),
              const SizedBox(height: 4),
              const Text(
                '💡 Ý nghĩa của Tầng 2: Thay vì bắt bạn làm ngay bài tập phân tích sâu khi đang kiệt sức hay hoảng loạn, hệ thống chia hành trình hồi phục thành 4 bước đi tuần tự vừa sức. Chạm vào bất kỳ Chặng nào bên dưới để mở ngay các bài tập của chặng đó:',
                style: TextStyle(fontSize: 12, color: Color(0xFF475569), height: 1.4),
              ),
              const SizedBox(height: 10),
              _buildInteractiveStageCard(
                stageTitle: 'Chặng 1: Ổn định cấp tính',
                subtitle: 'Hạ nhiệt sinh lý DBT TIPP, thở 4-6, Kế hoạch An toàn 6 mục & cố định giấc ngủ.',
                buttonLabel: 'Mở bài tập Chặng 1 (DBT Ổn định) →',
                onTap: () => _jumpToProtocolSection(
                  'DBT',
                  'Đang hiển thị các bài tập thuộc Chặng 1: Ổn định cấp tính (DBT Chịu đựng Căng thẳng: STOP, TIPP, Tự xoa dịu 5 giác quan).',
                ),
              ),
              _buildInteractiveStageCard(
                stageTitle: 'Chặng 2: Gỡ rào cản (TEAM-CBT) ${stage2Unlocked ? "• 🔓 ĐÃ MỞ KHÓA" : ""}',
                subtitle: 'Thấu cảm EAR, Mục tiêu Nghịch lý & Khởi động 5 phút cho tâm lý "biết nhưng mệt/ngại chưa làm được".',
                buttonLabel: 'Mở bài tập Chặng 2 (TEAM-CBT Gỡ rào cản) →',
                onTap: () => _jumpToProtocolSection(
                  'TEAM-CBT',
                  'Đang hiển thị các bài tập thuộc Chặng 2: Gỡ rào cản & Khơi thông động lực (TEAM-CBT).',
                ),
              ),
              _buildInteractiveStageCard(
                stageTitle: 'Chặng 3: Can thiệp lõi ($suggestedCoreModel)',
                subtitle: 'Thực hành chuyên sâu theo $suggestedTrackTitle.',
                buttonLabel: 'Mở bài tập Chặng 3 ($suggestedCoreModel) →',
                onTap: () => _jumpToProtocolSection(
                  suggestedCoreModel,
                  'Đang hiển thị các bài tập thuộc Chặng 3: Can thiệp lõi theo $suggestedTrackTitle.',
                ),
              ),
              _buildInteractiveStageCard(
                stageTitle: 'Chặng 4: Duy trì & Phòng tái phát (MBCT & Ulysses)',
                subtitle: 'Chuỗi 8 bài Chánh niệm MBCT (có lựa chọn mở mắt tiếp đất) & Bản đồ Dấu hiệu Sớm.',
                buttonLabel: 'Mở bài tập Chặng 4 (8 Bài MBCT) →',
                onTap: () => _jumpToProtocolSection(
                  'MBCT',
                  'Đang hiển thị Chuỗi 8 bài Thực hành Chánh niệm Nhận thức MBCT thuộc Chặng 4: Duy trì & Phòng tái phát.',
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // TIER 3: ON-DEMAND 1-TAP TOOLKIT & SOS (Separated terminology + immediate working actions!)
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFFFFF1F2),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFFECDD3)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'TẦNG 3: KHO CÔNG CỤ TỨC THỜI 1 CHẠM (ON-DEMAND TOOLKIT & SOS)',
                style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800, color: Color(0xFF881337)),
              ),
              const SizedBox(height: 4),
              const Text(
                'Truy cập ngay bằng 1 chạm khi đang lên cơn hoảng loạn, khó ngủ đêm, tự trách hoặc có nỗi lo ập đến:',
                style: TextStyle(fontSize: 12, color: Color(0xFF881337)),
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  ElevatedButton.icon(
                    onPressed: widget.onOpenEmergencySos,
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFBE123C), foregroundColor: Colors.white),
                    icon: const Icon(Icons.emergency_outlined, size: 16),
                    label: const Text('🚨 Hoảng loạn Cấp (SOS / Thở Mũi - Miệng)', style: TextStyle(fontSize: 12)),
                  ),
                  OutlinedButton.icon(
                    onPressed: () => _jumpToProtocolSection(
                      'MBCT',
                      '🌙 Đã mở Chuỗi 8 bài Chánh niệm & Quét Cơ thể Dịu nhẹ (MBCT Body Scan) giúp thả lỏng dễ ngủ.',
                    ),
                    icon: const Icon(Icons.nights_stay_outlined, size: 16),
                    label: const Text('🌙 Dẫn Thiền Dễ Ngủ & Thả Lỏng Cơ Thể', style: TextStyle(fontSize: 12)),
                  ),
                  OutlinedButton.icon(
                    onPressed: () => _jumpToProtocolSection(
                      'CBT',
                      '📝 Đã mở Nhật ký Suy nghĩ Có Cấu trúc (CBT) để giúp bạn gỡ rối nhanh một suy nghĩ tiêu cực.',
                    ),
                    icon: const Icon(Icons.edit_note_outlined, size: 16),
                    label: const Text('📝 Gỡ rối Nhanh Một Suy Nghĩ Tiêu Cực', style: TextStyle(fontSize: 12)),
                  ),
                  OutlinedButton.icon(
                    onPressed: _openQuickWorryBoxDialog,
                    icon: const Icon(Icons.inventory_2_outlined, size: 16),
                    label: const Text('📦 Cất Nỗi Lo Vào Hộp Tạm Thời (Hộp Lo Âu)', style: TextStyle(fontSize: 12)),
                  ),
                ],
              ),
              if (_worryBoxItems.isNotEmpty) ...[
                const SizedBox(height: 10),
                Text(
                  '📦 Đã cất trong Hộp Lo Âu (${_worryBoxItems.length}): ${_worryBoxItems.first}',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF2B4C43)),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildInteractiveStageCard({
    required String stageTitle,
    required String subtitle,
    required String buttonLabel,
    required VoidCallback onTap,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAF9),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFD5E2DD)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(stageTitle, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Color(0xFF1F2C33))),
          const SizedBox(height: 3),
          Text(subtitle, style: const TextStyle(fontSize: 12, color: Color(0xFF475569), height: 1.35)),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: onTap,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2B4C43),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 8),
              ),
              child: Text(buttonLabel, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProtocols68Tab() {
    final models = <Map<String, String>>[
      {'id': 'CBT', 'label': '📝 CBT (11)'},
      {'id': 'TEAM-CBT', 'label': '🎯 TEAM-CBT (7)'},
      {'id': 'DBT', 'label': '🧘 DBT (19 • 4 nhóm)'},
      {'id': 'IPSRT', 'label': '🌙 IPSRT (7)'},
      {'id': 'MBCT', 'label': '🍃 MBCT (8 bài)'},
      {'id': 'Psychoeducation', 'label': '📖 Giáo dục Tâm lý (10)'},
      {'id': 'FFT', 'label': '🤝 Gia đình FFT (6)'},
    ];

    final filtered = kMasterPlanMobileProtocols.where((p) {
      final matchesModel = p.model == _selectedModel;
      final matchesCond = _selectedCondition == 'ALL' ||
          p.applicableConditions.contains(_selectedCondition);
      return matchesModel && matchesCond;
    }).toList();

    const conditionOptions = <Map<String, String>>[
      {'code': 'ALL', 'label': 'Tất cả nhóm'},
      {'code': 'RLLA', 'label': '[RLLA] Lo âu'},
      {'code': 'TC', 'label': '[TC] Trầm cảm'},
      {'code': 'RLLC', 'label': '[RLLC] Lưỡng cực'},
    ];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (_highlightedProtocolHint.isNotEmpty)
          Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFECFDF5),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFA7F3D0)),
            ),
            child: Row(
              children: [
                const Icon(Icons.auto_awesome, color: Color(0xFF065F46), size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _highlightedProtocolHint,
                    style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: Color(0xFF065F46)),
                  ),
                ),
              ],
            ),
          ),
        const Text(
          'Lọc theo Nhóm bệnh chuẩn đoán [RLLA • TC • RLLC]:',
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF1F2C33)),
        ),
        const SizedBox(height: 6),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: conditionOptions.map((cond) {
            final code = cond['code']!;
            final selected = _selectedCondition == code;
            return ChoiceChip(
              label: Text(cond['label']!),
              selected: selected,
              selectedColor: const Color(0xFF1E3A8A),
              labelStyle: TextStyle(
                color: selected ? Colors.white : const Color(0xFF1F2C33),
                fontWeight: FontWeight.w700,
                fontSize: 12,
              ),
              onSelected: (_) => setState(() => _selectedCondition = code),
            );
          }).toList(),
        ),
        const SizedBox(height: 12),
        const Text(
          'Chọn 1 trong 7 Hệ thống Phác đồ Lâm sàng (§4.1–§4.7):',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Color(0xFF1F2C33)),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: models.map((m) {
            final id = m['id']!;
            final selected = _selectedModel == id;
            return ChoiceChip(
              label: Text(m['label']!),
              selected: selected,
              selectedColor: const Color(0xFF2B4C43),
              labelStyle: TextStyle(
                color: selected ? Colors.white : const Color(0xFF1F2C33),
                fontWeight: FontWeight.w700,
                fontSize: 12.5,
              ),
              onSelected: (_) => setState(() => _selectedModel = id),
            );
          }).toList(),
        ),
        const SizedBox(height: 12),

        // Distress-aware mode toggle (§10.2)
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFFF4F8F6),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFD5E2DD)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                dense: true,
                title: const Text(
                  'Chế độ Chạm chọn Không cần gõ chữ (§4.3 & §10.2)',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                ),
                subtitle: const Text(
                  'Giảm tải khi mệt mỏi: chạm chọn thẻ cảm nhận và luôn có nút Tạm dừng / Bỏ qua / Dừng.',
                  style: TextStyle(fontSize: 11.5),
                ),
                value: _nonWritingTapMode,
                onChanged: (v) => setState(() => _nonWritingTapMode = v),
              ),
              if (_selectedModel == 'MBCT')
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  dense: true,
                  title: const Text(
                    'MBCT: Thực hành Mở mắt & Tiếp đất an toàn (§4.5)',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF1E3A8A)),
                  ),
                  subtitle: const Text(
                    'Cho phép mở mắt nhìn điểm cố định hoặc cảm nhận chân chạm sàn; dừng ngay nếu thấy bồn chồn/phân ly.',
                    style: TextStyle(fontSize: 11.5),
                  ),
                  value: _mbctEyesOpenGrounding,
                  onChanged: (v) => setState(() => _mbctEyesOpenGrounding = v),
                ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        ...filtered.map((p) {
          return Card(
            elevation: 0,
            margin: const EdgeInsets.only(bottom: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: const BorderSide(color: Color(0xFFDCE5E1)),
            ),
            child: ExpansionTile(
              tilePadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
              childrenPadding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
              title: Text(
                p.titleVi,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF1F2C33)),
              ),
              subtitle: Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  '${p.applicableConditions.map((c) => '[$c]').join(' ')} • ${p.id} • v0.1.0-draft • Trạng thái: draft (Chờ duyệt)${p.domain.isNotEmpty ? ' • ${p.domain}' : ''}',
                  style: const TextStyle(fontSize: 11.5, color: Color(0xFF4F7A65), fontWeight: FontWeight.w600),
                ),
              ),
              children: [
                Align(
                  alignment: Alignment.centerLeft,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('🎯 Mục tiêu & Tác dụng: ${p.goalVi}', style: const TextStyle(fontSize: 12.5, height: 1.45)),
                      const SizedBox(height: 6),
                      Text('⚠️ Lưu ý thận trọng: ${p.precautionVi}', style: const TextStyle(fontSize: 12.5, color: Color(0xFF92400E), height: 1.45)),
                      const SizedBox(height: 6),
                      Text('⛔ Chống chỉ định: ${p.contraindicationVi}', style: const TextStyle(fontSize: 12.5, color: Color(0xFF991B1B), height: 1.45)),
                      const SizedBox(height: 6),
                      Text('📚 Nguồn bằng chứng (§15): ${p.sourceVi}', style: const TextStyle(fontSize: 12, color: Color(0xFF1E40AF), height: 1.45)),
                      const SizedBox(height: 6),
                      Text('🛡️ Ranh giới: ${p.boundaryVi} • Không tương đương khóa trị liệu lâm sàng đầy đủ.', style: const TextStyle(fontSize: 11.5, color: Color(0xFF64748B))),
                      const Divider(height: 18),
                      if (_nonWritingTapMode) ...[
                        const Text(
                          '👆 Chọn nhanh phản hồi (Không cần gõ chữ):',
                          style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 6),
                        Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: [
                            'Mình muốn đi từng bước thật nhỏ và chậm rãi',
                            'Mình muốn ghi nhận cảm xúc mà không tự trách',
                            'Mình muốn tạm dừng nghỉ ngơi nhẹ nhàng',
                          ].map((chip) {
                            final active = _selectedTapChip == chip;
                            return ActionChip(
                              backgroundColor: active ? const Color(0xFFE6F2ED) : Colors.white,
                              label: Text(chip, style: const TextStyle(fontSize: 11.5)),
                              onPressed: () => setState(() => _selectedTapChip = chip),
                            );
                          }).toList(),
                        ),
                      ],
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          OutlinedButton.icon(
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('⏸️ Đã tạm dừng bài tập an toàn. Bạn có thể tiếp tục bất cứ lúc nào.')),
                              );
                            },
                            icon: const Icon(Icons.pause_circle_outline, size: 16),
                            label: const Text('Tạm dừng', style: TextStyle(fontSize: 12)),
                          ),
                          OutlinedButton.icon(
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('⏭️ Đã bỏ qua bước hiện tại theo quyền tự quyết của bạn.')),
                              );
                            },
                            icon: const Icon(Icons.skip_next_outlined, size: 16),
                            label: const Text('Bỏ qua bước', style: TextStyle(fontSize: 12)),
                          ),
                          OutlinedButton.icon(
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('⏹️ Đã dừng bài tập an toàn. Không tính là thất bại.')),
                              );
                            },
                            icon: const Icon(Icons.stop_circle_outlined, size: 16, color: Color(0xFFDC2626)),
                            label: const Text('Dừng bài tập', style: TextStyle(fontSize: 12, color: Color(0xFFDC2626))),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        }),
      ],
    );
  }

  Widget _buildSafetyPlanAndDirectoryTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFFFFF1F2),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFFECDD3)),
          ),
          child: const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '📞 Danh bạ Khẩn cấp Ngoại tuyến Đã Kiểm duyệt (§3.3)',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Color(0xFF881337)),
              ),
              SizedBox(height: 6),
              Text(
                MasterPlanGovernanceEngine.nonMonitoringNoticeVi,
                style: TextStyle(fontSize: 12, color: Color(0xFF881337), height: 1.4),
              ),
              SizedBox(height: 8),
              Text('• 115 — Cấp cứu Y tế Khẩn cấp Toàn quốc (24/7)', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700)),
              Text('• 111 — Tổng đài Quốc gia Bảo vệ & Phòng chống Bạo lực (24/7)', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700)),
              Text('• 1900 1267 — Viện Sức khỏe Tâm thần (Bệnh viện Bạch Mai, Hà Nội)', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700)),
              Text('• 028 3923 4675 — Bệnh viện Tâm thần TP. Hồ Chí Minh (24/7)', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700)),
              SizedBox(height: 4),
              Text('Ngày xác minh gần nhất: 2026-11-23 • Không cần trả lời khảo sát để xem danh bạ này.', style: TextStyle(fontSize: 11, color: Color(0xFF9F1239))),
            ],
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          '🛡️ Kế hoạch An toàn Cá nhân 6 Mục (§3.4 Personal Safety Plan)',
          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Color(0xFF1F2C33)),
        ),
        const SizedBox(height: 10),
        _buildTextField('1. Dấu hiệu cảnh báo cá nhân', _sp1Ctrl),
        _buildTextField('2. Chiến lược tự làm dịu bên trong', _sp2Ctrl),
        _buildTextField('3. Người & nơi giúp phân tâm an toàn', _sp3Ctrl),
        _buildTextField('4. Người tin cậy để nhờ giúp (Tên)', _sp4NameCtrl),
        _buildTextField('4b. Số điện thoại người tin cậy', _sp4PhoneCtrl),
        _buildTextField('5. Liên hệ chuyên môn & cơ sở cấp cứu', _sp5Ctrl),
        _buildTextField('6. Các bước làm môi trường xung quanh an toàn hơn', _sp6Ctrl),
        CheckboxListTile(
          contentPadding: EdgeInsets.zero,
          value: _spConsentContacts,
          onChanged: (v) => setState(() => _spConsentContacts = v ?? false),
          title: const Text(
            'Tôi đồng ý rõ ràng cho phép lưu thông tin liên hệ của người tin cậy trên thiết bị (§3.4).',
            style: TextStyle(fontSize: 12.5),
          ),
        ),
        Row(
          children: [
            ElevatedButton(
              onPressed: () {
                final model = PersonalSafetyPlanModel(
                  id: 'sp-mobile-1',
                  userId: 'user-local',
                  section1WarningSigns: <String>[_sp1Ctrl.text],
                  section2InternalCopingStrategies: <String>[_sp2Ctrl.text],
                  section3DistractionPeopleAndPlaces: <String>[_sp3Ctrl.text],
                  section4TrustedPeopleToAskForHelp: _sp4PhoneCtrl.text.trim().isNotEmpty
                      ? <String>['${_sp4NameCtrl.text}: ${_sp4PhoneCtrl.text}']
                      : const <String>[],
                  section5ProfessionalAndEmergencyContacts: <String>[_sp5Ctrl.text],
                  section6EnvironmentSafetySteps: <String>[_sp6Ctrl.text],
                  explicitConsentForStoringContacts: _spConsentContacts,
                );
                setState(() {
                  _spSaveStatus = model.isValid
                      ? '✓ Đã lưu Kế hoạch An toàn 6 mục ngoại tuyến trên thiết bị.'
                      : '⚠️ Vui lòng tích đồng ý lưu thông tin liên hệ nhạy cảm (§3.4).';
                });
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2B4C43),
                foregroundColor: Colors.white,
              ),
              child: const Text('Lưu Kế hoạch An toàn'),
            ),
            const SizedBox(width: 10),
            OutlinedButton(
              onPressed: () {
                setState(() {
                  _sp4NameCtrl.clear();
                  _sp4PhoneCtrl.clear();
                  _spSaveStatus = '🗑️ Đã xóa thông tin liên hệ nhạy cảm khỏi Kế hoạch An toàn.';
                });
              },
              child: const Text('Xóa Liên hệ'),
            ),
          ],
        ),
        if (_spSaveStatus.isNotEmpty) ...[
          const SizedBox(height: 8),
          Text(_spSaveStatus, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: Color(0xFF065F46))),
        ],
      ],
    );
  }

  Widget _buildMedicationBipolarAndFftTab(int activeSignalsCount) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text(
          '💊 1. Hỗ trợ Nhắc lịch & Ghi chép Thuốc Tách biệt (§7)',
          style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 4),
        const Text(
          'Ứng dụng chỉ nhắc lịch và ghi chép do bạn tự nhập; không kê đơn, không xác minh toa và tuyệt đối không khuyên tăng/giảm/ngưng hay uống bù gấp đôi liều thuốc.',
          style: TextStyle(fontSize: 12, color: Color(0xFF92400E)),
        ),
        const SizedBox(height: 8),
        _buildTextField('Tên thuốc (Lịch nhắc độc lập với xác nhận đã uống)', _medNameCtrl),
        _buildTextField('Khung giờ nhắc', _medScheduleCtrl),
        Wrap(
          spacing: 8,
          children: ['Đã uống (Taken)', 'Quên liều (Missed)', 'Không chắc (Uncertain)'].map((st) {
            return ChoiceChip(
              label: Text(st, style: const TextStyle(fontSize: 12)),
              selected: _medIntakeStatus == st,
              onSelected: (_) => setState(() => _medIntakeStatus = st),
            );
          }).toList(),
        ),
        const SizedBox(height: 8),
        _buildTextField('Ghi chú tác dụng phụ nghi ngờ để hỏi bác sĩ/dược sĩ', _medSideEffectCtrl),
        ElevatedButton(
          onPressed: () {
            setState(() {
              _medLogEntries.insert(
                0,
                '${_medNameCtrl.text}: $_medIntakeStatus (${_medSideEffectCtrl.text.isEmpty ? "Không có ghi chú tác dụng phụ" : "Lưu ý hỏi bác sĩ: ${_medSideEffectCtrl.text}"})',
              );
              _medSideEffectCtrl.clear();
            });
          },
          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF2B4C43), foregroundColor: Colors.white),
          child: const Text('Ghi nhận Nhật ký Thuốc'),
        ),
        ..._medLogEntries.map((e) => Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text('• $e', style: const TextStyle(fontSize: 12)),
            )),
        const Divider(height: 28),

        const Text(
          '🌙 2. Theo dõi Đa Tín hiệu Lưỡng cực (§3.5 — Không dùng 1 ngưỡng giờ ngủ đơn lẻ)',
          style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w800),
        ),
        CheckboxListTile(
          dense: true,
          contentPadding: EdgeInsets.zero,
          title: const Text('Giảm nhu cầu ngủ (ngủ ít nhưng vẫn thấy dư năng lượng — khác mất ngủ)', style: TextStyle(fontSize: 12.5)),
          value: _sigReducedSleepNeed,
          onChanged: (v) => setState(() => _sigReducedSleepNeed = v ?? false),
        ),
        CheckboxListTile(
          dense: true,
          contentPadding: EdgeInsets.zero,
          title: const Text('Khí sắc hưng phấn bất thường hoặc cáu gắt', style: TextStyle(fontSize: 12.5)),
          value: _sigElevatedIrritable,
          onChanged: (v) => setState(() => _sigElevatedIrritable = v ?? false),
        ),
        CheckboxListTile(
          dense: true,
          contentPadding: EdgeInsets.zero,
          title: const Text('Năng lượng & hoạt động hướng mục tiêu tăng vọt', style: TextStyle(fontSize: 12.5)),
          value: _sigIncreasedEnergy,
          onChanged: (v) => setState(() => _sigIncreasedEnergy = v ?? false),
        ),
        CheckboxListTile(
          dense: true,
          contentPadding: EdgeInsets.zero,
          title: const Text('Nói nhanh bất thường hoặc suy nghĩ chạy dồn dập', style: TextStyle(fontSize: 12.5)),
          value: _sigRacingThoughts,
          onChanged: (v) => setState(() => _sigRacingThoughts = v ?? false),
        ),
        CheckboxListTile(
          dense: true,
          contentPadding: EdgeInsets.zero,
          title: const Text('Tăng tính bốc đồng (mua sắm, quyết định vội vàng)', style: TextStyle(fontSize: 12.5)),
          value: _sigImpulsivity,
          onChanged: (v) => setState(() => _sigImpulsivity = v ?? false),
        ),
        CheckboxListTile(
          dense: true,
          contentPadding: EdgeInsets.zero,
          title: const Text('Lệch đáng kể khỏi nhịp sinh hoạt cá nhân', style: TextStyle(fontSize: 12.5)),
          value: _sigRoutineDeviation,
          onChanged: (v) => setState(() => _sigRoutineDeviation = v ?? false),
        ),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: activeSignalsCount >= 2 ? const Color(0xFFFEF2F2) : const Color(0xFFF0FDF4),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            activeSignalsCount >= 2
                ? '⚠️ Ghi nhận $activeSignalsCount/6 tín hiệu hội tụ: Tạm khóa các bài tập kích hoạt năng lượng cao và khuyến nghị bạn liên hệ sớm với bác sĩ điều trị.'
                : '✓ Hiện có $activeSignalsCount/6 tín hiệu: Thời lượng ngủ đơn lẻ không bao giờ bị dùng làm bộ phát hiện hưng cảm tự động.',
            style: TextStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.w700,
              color: activeSignalsCount >= 2 ? const Color(0xFF991B1B) : const Color(0xFF166534),
            ),
          ),
        ),
        const Divider(height: 28),

        const Text(
          '🤝 3. Phân quyền Người thân Đồng hành (FFT Caregiver AccessGrant — §4.7)',
          style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w800),
        ),
        const Text(
          'Mặc định KHÓA nhật ký riêng tư, nội dung phiên và câu trả lời thang đo. Người thân không thể sửa hồ sơ của bạn.',
          style: TextStyle(fontSize: 12, color: Color(0xFF475569)),
        ),
        SwitchListTile(
          dense: true,
          contentPadding: EdgeInsets.zero,
          title: const Text('Cho phép xem Kế hoạch Dấu hiệu Sớm', style: TextStyle(fontSize: 12.5)),
          value: !_cgRevoked && _cgAllowEarlyWarning,
          onChanged: (v) => setState(() {
            _cgRevoked = false;
            _cgAllowEarlyWarning = v;
          }),
        ),
        SwitchListTile(
          dense: true,
          contentPadding: EdgeInsets.zero,
          title: const Text('Cho phép cùng học 6 bài Giao tiếp Gia đình (FFT)', style: TextStyle(fontSize: 12.5)),
          value: !_cgRevoked && _cgAllowFftModules,
          onChanged: (v) => setState(() {
            _cgRevoked = false;
            _cgAllowFftModules = v;
          }),
        ),
        SwitchListTile(
          dense: true,
          contentPadding: EdgeInsets.zero,
          title: const Text('Cho phép xem Tóm tắt Nhịp Sinh hoạt', style: TextStyle(fontSize: 12.5)),
          value: !_cgRevoked && _cgAllowRhythmSummary,
          onChanged: (v) => setState(() {
            _cgRevoked = false;
            _cgAllowRhythmSummary = v;
          }),
        ),
        SwitchListTile(
          dense: true,
          contentPadding: EdgeInsets.zero,
          title: const Text('🔒 Nhật ký Tâm sự Riêng tư (Mặc định KHÓA)', style: TextStyle(fontSize: 12.5)),
          value: !_cgRevoked && _cgAllowPrivateJournals,
          onChanged: (v) => setState(() {
            _cgRevoked = false;
            _cgAllowPrivateJournals = v;
          }),
        ),
        SwitchListTile(
          dense: true,
          contentPadding: EdgeInsets.zero,
          title: const Text('🔒 Nội dung Phiên Trị liệu (Mặc định KHÓA)', style: TextStyle(fontSize: 12.5)),
          value: !_cgRevoked && _cgAllowSessionContent,
          onChanged: (v) => setState(() {
            _cgRevoked = false;
            _cgAllowSessionContent = v;
          }),
        ),
        SwitchListTile(
          dense: true,
          contentPadding: EdgeInsets.zero,
          title: const Text('🔒 Câu trả lời Thang đo (Mặc định KHÓA)', style: TextStyle(fontSize: 12.5)),
          value: !_cgRevoked && _cgAllowAssessmentAnswers,
          onChanged: (v) => setState(() {
            _cgRevoked = false;
            _cgAllowAssessmentAnswers = v;
          }),
        ),
        OutlinedButton.icon(
          onPressed: () => setState(() => _cgRevoked = true),
          icon: const Icon(Icons.block, color: Color(0xFFDC2626), size: 16),
          label: Text(
            _cgRevoked ? 'Đã thu hồi toàn bộ quyền truy cập (Revoked)' : 'Thu hồi Toàn bộ Quyền Người thân Ngay lập tức',
            style: const TextStyle(color: Color(0xFFDC2626), fontWeight: FontWeight.w700, fontSize: 12.5),
          ),
        ),
      ],
    );
  }

  Widget _buildWho5AndRedactionTab() {
    final who5 = MasterPlanGovernanceEngine.scoreWho5(_who5Scores);
    final questions = <String>[
      '1. Tôi cảm thấy vui vẻ và có tinh thần tốt',
      '2. Tôi cảm thấy bình tĩnh và thư thái',
      '3. Tôi cảm thấy năng động và có sinh lực',
      '4. Khi thức dậy tôi cảm thấy khỏe khoắn',
      '5. Cuộc sống hằng ngày có những điều tôi quan tâm',
    ];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text(
          '☀️ 1. Thang đo An vui Tinh thần WHO-5 (§6.2 Well-Being Monitoring)',
          style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w800),
        ),
        const Text(
          'Khoảng hồi tưởng: Trong 2 tuần qua (0..5). Chỉ số tự theo dõi, không phải công cụ chẩn đoán.',
          style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
        ),
        const SizedBox(height: 8),
        for (int i = 0; i < 5; i++) ...[
          Text('${questions[i]}: ${_who5Scores[i]}/5', style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600)),
          Slider(
            value: _who5Scores[i].toDouble(),
            min: 0,
            max: 5,
            divisions: 5,
            activeColor: const Color(0xFF2B4C43),
            onChanged: (v) => setState(() => _who5Scores[i] = v.round()),
          ),
        ],
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFFF0FDF4),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            '${who5.labelVi}\n${who5.interpretationVi}',
            style: const TextStyle(fontSize: 12.5, color: Color(0xFF166534), fontWeight: FontWeight.w600, height: 1.4),
          ),
        ),
        const Divider(height: 28),
        const Text(
          '📋 2. Xem trước & Ẩn Thông tin Nhạy cảm Trước Khi Chia sẻ Báo cáo (§10.3)',
          style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w800),
        ),
        CheckboxListTile(
          dense: true,
          contentPadding: EdgeInsets.zero,
          title: const Text('Ẩn toàn bộ Nhật ký Tâm sự Riêng tư (Redact Private Journals)', style: TextStyle(fontSize: 12.5)),
          value: _redactJournals,
          onChanged: (v) => setState(() => _redactJournals = v ?? true),
        ),
        CheckboxListTile(
          dense: true,
          contentPadding: EdgeInsets.zero,
          title: const Text('Ẩn chi tiết nội dung Phiên Thực hành (Redact Session Content)', style: TextStyle(fontSize: 12.5)),
          value: _redactSessions,
          onChanged: (v) => setState(() => _redactSessions = v ?? true),
        ),
        CheckboxListTile(
          dense: true,
          contentPadding: EdgeInsets.zero,
          title: const Text('Chỉ hiện Tổng điểm Thang đo, ẩn từng câu trả lời lẻ', style: TextStyle(fontSize: 12.5)),
          value: _redactRawItems,
          onChanged: (v) => setState(() => _redactRawItems = v ?? true),
        ),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAF9),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFCBD5E1)),
          ),
          child: Text(
            '🔍 BẢN XEM TRƯỚC BÁO CÁO (§10.3):\n'
            '• [Dữ liệu Người dùng Tự báo cáo / Self-Reported]: Khí sắc ${widget.currentMoodPolarity}, Năng lượng ${widget.currentEnergyLevel}, WHO-5: ${who5.percentageScore}/100 (v1998.1).\n'
            '• Nhật ký cá nhân: ${_redactJournals ? "[ĐÃ ẨN THEO LỰA CHỌN NGƯỜI DÙNG]" : "Hiển thị nhật ký"}\n'
            '• Nội dung phiên: ${_redactSessions ? "[ĐÃ ẨN THEO LỰA CHỌN NGƯỜI DÙNG]" : "Hiển thị tóm tắt phiên"}\n'
            '• Giới hạn: Không chứa nhãn chẩn đoán tự động hay phân loại rủi ro lâm sàng.',
            style: const TextStyle(fontSize: 12, height: 1.45, color: Color(0xFF1E293B)),
          ),
        ),
      ],
    );
  }

  Widget _buildTextField(String label, TextEditingController ctrl) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: TextField(
        controller: ctrl,
        style: const TextStyle(fontSize: 13),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: const TextStyle(fontSize: 12),
          isDense: true,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
        ),
      ),
    );
  }
}
