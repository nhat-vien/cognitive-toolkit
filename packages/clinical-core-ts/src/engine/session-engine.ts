/**
 * Full 5-Phase Clinical Session State Machine & Socratic Pushback Controller
 * - Phase 0: Expressive (EAR Empathy) vs. Instrumental Mode
 * - Phase 1: Check-in, Polarity & HRV/Sleep Baseline
 * - Safety/Arousal Router ("DBT-First, CBT-Second")
 * - Phase 2: Technique Selection
 * - Phase 3: Guided Protocol with 4-Level Socratic Pushback (off, gentle, moderate, firm)
 *   across Supportive, Core, Closing zones + Clinical Safeguard Gates:
 *   * Accuracy Check (thought-record)
 *   * Rest Check (behavioral-activation)
 *   * Justified Check (opposite-action)
 *   * Mandatory Medical Exclusion Screen (tipp cold water)
 *   * Hard Stops & Shame Protocol (chain-analysis)
 *   * Harsh Self-Critic Guard (wise-mind)
 * - Phase 4: Close & Portable Markdown Frontmatter Exporter (YYYYMMDD-[technique]-NN.md)
 */

import type {
  BipolarPole,
  CognitiveToolkitSession,
  HrvBaselineContext,
  PushbackLevel,
  PushbackZone,
  SessionOutcome,
  TechniqueSlug,
} from '../schemas/models.ts';
import {
  analyzeClinicalText,
  evaluateFourLayerSafety,
  type FourLayerSafetyEvaluation,
} from '../detectors/distortion-detector.ts';

export type SessionPhase =
  | 'Phase0_ModeCheck'
  | 'Phase1_CheckIn'
  | 'Phase2_TechniqueSelection'
  | 'Phase3_GuidedProtocol'
  | 'Phase4_Close'
  | 'SafetyStop';

export interface ProtocolStepDefinition {
  stepNumber: number;
  slug: string;
  titleEn: string;
  titleVi: string;
  zone: PushbackZone;
  promptEn: string;
  promptVi: string;
  isClinicalSafetyGate?: boolean;
}

export const PROTOCOL_STEP_DEFINITIONS: Record<TechniqueSlug, ProtocolStepDefinition[]> = {
  'thought-record': [
    {
      stepNumber: 1,
      slug: 'situation',
      titleEn: 'Step 1: Objective Situation',
      titleVi: 'Bước 1: Tình huống Khách quan',
      zone: 'Supportive',
      promptEn: 'What happened? Describe only objective facts a video camera would record.',
      promptVi: 'Chuyện gì đã xảy ra? Chỉ mô tả dữ kiện khách quan như máy quay ghi lại được.',
    },
    {
      stepNumber: 2,
      slug: 'automatic-thought',
      titleEn: 'Step 2: Automatic Thought (Hot Cognition)',
      titleVi: 'Bước 2: Suy nghĩ Tự động',
      zone: 'Supportive',
      promptEn: 'What exact raw thought flashed through your mind, and how much do you believe it (0-100%)?',
      promptVi: 'Câu nói tự động nào thoáng qua đầu bạn lúc đó và bạn tin nó bao nhiêu phần trăm (0-100%)?',
    },
    {
      stepNumber: 3,
      slug: 'emotion-rating',
      titleEn: 'Step 3: Emotion & Pre-Intensity',
      titleVi: 'Bước 3: Gọi tên Cảm xúc & Cường độ (0-10)',
      zone: 'Supportive',
      promptEn: 'Name your emotions (Anger, Sadness, Anxiety, Shame, Guilt) and rate intensity 0-10.',
      promptVi: 'Gọi tên cảm xúc (Giận dữ, Buồn bã, Lo âu, Xấu hổ, Tội lỗi) và chấm cường độ 0-10.',
    },
    {
      stepNumber: 4,
      slug: 'evidence-for',
      titleEn: 'Step 4: Evidence FOR the Hot Thought',
      titleVi: 'Bước 4: Bằng chứng Ủng hộ Suy nghĩ',
      zone: 'Core',
      promptEn: 'What objective, courtroom-admissible facts support this thought?',
      promptVi: 'Những dữ kiện thực tế khách quan nào ủng hộ suy nghĩ này?',
    },
    {
      stepNumber: 5,
      slug: 'evidence-against',
      titleEn: 'Step 5: Evidence AGAINST the Hot Thought',
      titleVi: 'Bước 5: Bằng chứng Phản bác / Góc nhìn Khác',
      zone: 'Core',
      promptEn: 'What facts contradict this thought, or what would you tell a close friend in this exact situation?',
      promptVi: 'Có dữ kiện nào đi ngược lại suy nghĩ này, hoặc bạn sẽ nói gì với người bạn thân nếu họ nghĩ vậy?',
    },
    {
      stepNumber: 6,
      slug: 'accuracy-check-and-balanced-thought',
      titleEn: 'Step 6: Accuracy Check & Balanced Thought',
      titleVi: 'Bước 6: Kiểm tra Tính Chính xác & Suy nghĩ Cân bằng',
      zone: 'Core',
      promptEn: 'If the thought is objectively true, we pivot to Problem-Solving/Coping. Otherwise, synthesize a balanced "Both/And" statement.',
      promptVi: 'Nếu suy nghĩ là sự thật khách quan, ta chuyển sang Giải quyết vấn đề. Nếu có biến dạng, hãy viết Suy nghĩ Cân bằng ("Đúng là... VÀ đồng thời...").',
      isClinicalSafetyGate: true,
    },
    {
      stepNumber: 7,
      slug: 'rerate-emotion',
      titleEn: 'Step 7: Re-rate Emotion & Takeaway',
      titleVi: 'Bước 7: Đánh giá lại Cảm xúc (0-10)',
      zone: 'Closing',
      promptEn: 'Re-rate your emotional intensity (0-10) now and note one takeaway.',
      promptVi: 'Chấm lại cường độ cảm xúc (0-10) hiện tại và ghi lại 1 điều bạn rút ra được.',
    },
  ],
  'behavioral-activation': [
    {
      stepNumber: 0,
      slug: 'follow-up-prediction-error',
      titleEn: 'Step 0: Follow-up on Last Activity Plan',
      titleVi: 'Bước 0: Đối chiếu Sai số Dự đoán Phiên trước',
      zone: 'Supportive',
      promptEn: 'How did your last planned activity go compared to your predicted Mastery & Pleasure?',
      promptVi: 'Hoạt động phiên trước thực tế đạt mức độ Hoàn thành (M) và Niềm vui (P) bao nhiêu so với dự đoán?',
    },
    {
      stepNumber: 1,
      slug: 'dropped-away-domains',
      titleEn: 'Step 1: What Has Dropped Away',
      titleVi: 'Bước 1: Nhận diện Lĩnh vực Bị Thu hẹp',
      zone: 'Supportive',
      promptEn: 'Which life domain has shrunk recently (connection, movement, play, order, self-care)?',
      promptVi: 'Lĩnh vực nào đang bị thu hẹp gần đây (kết nối, vận động, sở thích, hoàn thành việc, chăm sóc bản thân)?',
    },
    {
      stepNumber: 2,
      slug: 'mandatory-rest-check',
      titleEn: 'Step 2: Mandatory Biological Rest Check',
      titleVi: 'Bước 2: Cổng Kiểm tra Nhu cầu Nghỉ ngơi Sinh học (Rest Check)',
      zone: 'Closing',
      promptEn: 'Is your fatigue from depressive withdrawal or genuine biological exhaustion (illness, sleep debt, burnout)?',
      promptVi: 'Sự mệt mỏi này đến từ trầm cảm rút lui hay cơ thể thực sự cần phục hồi sinh học (thiếu ngủ, ốm, kiệt sức)?',
      isClinicalSafetyGate: true,
    },
    {
      stepNumber: 3,
      slug: 'what-matters-values',
      titleEn: 'Step 3: What Matters (Filter Out Shoulds)',
      titleVi: 'Bước 3: Giá trị Thật (Lọc bỏ Mệnh lệnh "Phải/Nên")',
      zone: 'Core',
      promptEn: 'Setting aside external "shoulds", what small activity feels meaningful or slightly less heavy today?',
      promptVi: 'Tạm gác lại những chữ "phải/nên", việc nhỏ nào thực sự có ý nghĩa hoặc dễ thở nhất với bạn hôm nay?',
    },
    {
      stepNumber: 4,
      slug: 'one-activity-confidence-scaling',
      titleEn: 'Step 4: One Small Activity (Confidence >= 7/10)',
      titleVi: 'Bước 4: Thu nhỏ Việc làm đến Ngưỡng Tự tin >= 7/10',
      zone: 'Core',
      promptEn: 'Pick one 5-15 min activity with day/time/place. Rate confidence 0-10 (shrink task if < 7/10).',
      promptVi: 'Chọn 1 việc nhỏ 5-15 phút có giờ và nơi cụ thể. Chấm độ tự tin 0-10 (thu nhỏ việc nếu < 7/10).',
    },
    {
      stepNumber: 5,
      slug: 'predict-mp-and-if-then',
      titleEn: 'Step 5: Predict Mastery/Pleasure & If-Then Barrier Plan',
      titleVi: 'Bước 5: Dự đoán M/P & Kế hoạch Vượt Rào cản Nếu-Thì',
      zone: 'Core',
      promptEn: 'Predict Mastery (0-10) & Pleasure (0-10), and complete: "IF I have zero motivation at that hour, THEN I will..."',
      promptVi: 'Dự đoán M (0-10) & P (0-10), và lập phương án: "NẾU đến giờ đó tôi không có chút hứng thú nào, THÌ tôi sẽ..."',
    },
  ],
  tipp: [
    {
      stepNumber: 1,
      slug: 'medical-exclusion-screen',
      titleEn: 'Step 1: Mandatory Medical Exclusion Screen for Cold Water',
      titleVi: 'Bước 1: Sàng lọc Y khoa Bắt buộc Trước Khi Dùng Nước Lạnh',
      zone: 'Closing',
      promptEn: 'Do you have a heart condition, slow heart rate, take beta-blockers, have cold allergy, or an eating disorder?',
      promptVi: 'Bạn có mắc bệnh tim mạch, nhịp tim chậm, dùng thuốc chẹn beta, dị ứng lạnh hoặc rối loạn ăn uống không?',
      isClinicalSafetyGate: true,
    },
    {
      stepNumber: 2,
      slug: 'physiological-skill-execution',
      titleEn: 'Step 2: Execute Physiological Down-Regulation (Paced Breathing 4-6 / Cold Water 15-30s / PMR)',
      titleVi: 'Bước 2: Thực hành Hạ nhiệt Sinh lý (Thở 4-6 / Nước lạnh 15-30s / Giãn cơ PMR)',
      zone: 'Closing',
      promptEn: 'Inhale 4 seconds, exhale slowly 6-8 seconds. Focus only on the breath and physical sensation.',
      promptVi: 'Hít vào bằng mũi 4 giây, thở ra chậm 6-8 giây. Chỉ tập trung vào nhịp thở và cảm giác cơ thể.',
    },
    {
      stepNumber: 3,
      slug: 'rerate-arousal',
      titleEn: 'Step 3: Re-rate Physiological Arousal (0-10)',
      titleVi: 'Bước 3: Chấm lại Cường độ Căng thẳng (0-10)',
      zone: 'Closing',
      promptEn: 'Where is your distress level now from 0 to 10?',
      promptVi: 'Mức độ căng thẳng của cơ thể bạn hiện tại còn bao nhiêu trên thang 0-10?',
    },
  ],
  'opposite-action': [
    {
      stepNumber: 1,
      slug: 'name-emotion',
      titleEn: 'Step 1: Name the Primary Emotion',
      titleVi: 'Bước 1: Gọi tên Cảm xúc Chủ đạo',
      zone: 'Supportive',
      promptEn: 'What emotion is strongest in your body right now, and what is its intensity (0-10)?',
      promptVi: 'Cảm xúc nào đang mạnh nhất trong cơ thể bạn lúc này và cường độ là bao nhiêu (0-10)?',
    },
    {
      stepNumber: 2,
      slug: 'action-urge',
      titleEn: 'Step 2: Identify the Action Urge',
      titleVi: 'Bước 2: Xác định Thôi thúc Hành động',
      zone: 'Core',
      promptEn: 'What specific action is this emotion urging you to do (avoid, hide, attack, isolate, overspend)?',
      promptVi: 'Cảm xúc này đang xúi giục bạn làm hành động gì (né tránh, trốn chạy, công kích, nằm lì, tiêu tiền)?',
    },
    {
      stepNumber: 3,
      slug: 'justified-check',
      titleEn: 'Step 3: The Justified Check (Dialectical Pivot)',
      titleVi: 'Bước 3: Kiểm tra Sự thật Khách quan (Justified Check)',
      zone: 'Core',
      promptEn: 'Does this action urge fit the objective facts, or is there real-world danger requiring safety exit?',
      promptVi: 'Thôi thúc hành động này có phù hợp với sự thật khách quan không, hay có nguy hiểm thực tế cần bảo vệ an toàn?',
      isClinicalSafetyGate: true,
    },
    {
      stepNumber: 4,
      slug: 'act-opposite-all-the-way',
      titleEn: 'Step 4: Act Opposite All The Way',
      titleVi: 'Bước 4: Làm Ngược lại 100% Toàn diện',
      zone: 'Core',
      promptEn: 'What concrete opposite action (posture, face, behavior) can you take in the next 10-60 minutes?',
      promptVi: 'Hành động ngược chiều cụ thể nào (cả tư thế, nét mặt và việc làm) bạn có thể thực hiện trong 10-60 phút tới?',
    },
  ],
  'wise-mind': [
    {
      stepNumber: 1,
      slug: 'frame-question',
      titleEn: 'Step 1: Name the Dilemma Question',
      titleVi: 'Bước 1: Đặt Câu hỏi cho Quyết định Đang Giằng xé',
      zone: 'Supportive',
      promptEn: 'State the decision or dilemma you are facing in one clear question.',
      promptVi: 'Đặt 1 câu hỏi ngắn gọn cho quyết định hoặc sự giằng xé mà bạn đang đối diện.',
    },
    {
      stepNumber: 2,
      slug: 'emotion-mind',
      titleEn: 'Step 2: Emotion Mind Voice',
      titleVi: 'Bước 2: Tiếng nói của Tâm Cảm xúc',
      zone: 'Core',
      promptEn: 'What does your Emotion Mind want, fear, or feel urged to do without filtering?',
      promptVi: 'Tâm Cảm xúc của bạn đang khao khát, lo sợ hay thôi thúc làm điều gì?',
    },
    {
      stepNumber: 3,
      slug: 'reasonable-mind-with-critic-guard',
      titleEn: 'Step 3: Reasonable Mind (with Harsh Self-Critic Guard)',
      titleVi: 'Bước 3: Tâm Lý trí (Có Bộ lọc Chống Tự Chỉ trích Trá hình)',
      zone: 'Core',
      promptEn: 'What are the neutral facts and pros/cons without harsh self-judgment?',
      promptVi: 'Những dữ kiện thực tế và hệ quả khách quan là gì (khi đã bỏ ra ngoài những lời tự phán xét)?',
      isClinicalSafetyGate: true,
    },
    {
      stepNumber: 4,
      slug: 'mindful-pause',
      titleEn: 'Step 4: Mindful Breathing Pause',
      titleVi: 'Bước 4: Khoảng Lặng Hít thở Chánh niệm',
      zone: 'Closing',
      promptEn: 'Take 3 slow breaths (in 4s, out 6s) and drop your attention into your center.',
      promptVi: 'Hít thở chậm 3 nhịp (vào 4 giây, ra 6 giây) và lắng tâm xuống vùng ngực/bụng.',
    },
    {
      stepNumber: 5,
      slug: 'wise-mind-synthesis',
      titleEn: 'Step 5: Wise Mind Synthesis ("Nothing Yet" is Valid)',
      titleVi: 'Bước 5: Lắng nghe Tâm Trí Tuệ (Chấp nhận "Chưa có câu trả lời")',
      zone: 'Supportive',
      promptEn: 'Hearing both sides fairly, what does Wise Mind notice? ("Nothing yet" is completely valid).',
      promptVi: 'Khi cả hai phía đều được lắng nghe, Tâm Trí Tuệ nhận ra điều gì? ("Chưa biết lúc này" cũng hoàn toàn hợp lệ).',
    },
    {
      stepNumber: 6,
      slug: 'one-next-step',
      titleEn: 'Step 6: One Next Step',
      titleVi: 'Bước 6: Một Bước Nhỏ Tiếp theo',
      zone: 'Closing',
      promptEn: 'What is one small next step or a scheduled time to revisit this question?',
      promptVi: 'Bước nhỏ tiếp theo của bạn là gì, hoặc khi nào bạn sẽ quay lại hỏi Tâm Trí Tuệ?',
    },
  ],
  'chain-analysis': [
    {
      stepNumber: 1,
      slug: 'target-behavior-and-hard-stops',
      titleEn: 'Step 1: Specific Target Behavior (with Self-Harm & Victimization Hard Stops)',
      titleVi: 'Bước 1: Mô tả Hành vi Cụ thể (Kèm Cổng Chặn Tự hại & Nạn nhân)',
      zone: 'Core',
      promptEn: 'Describe one specific episode of a behavior you want to understand (curiosity, not blame).',
      promptVi: 'Mô tả chính xác 1 lần cụ thể hành vi bạn muốn giải phẫu theo tinh thần tò mò, không tự kết tội.',
      isClinicalSafetyGate: true,
    },
    {
      stepNumber: 2,
      slug: 'prompting-event',
      titleEn: 'Step 2: The Prompting Event',
      titleVi: 'Bước 2: Sự kiện Kích hoạt (Giọt nước Tràn ly)',
      zone: 'Core',
      promptEn: 'What happened right before things started sliding toward the behavior?',
      promptVi: 'Khoảnh khắc ngay trước khi mọi thứ trượt đi là sự kiện gì?',
    },
    {
      stepNumber: 3,
      slug: 'vulnerabilities-please',
      titleEn: 'Step 3: Vulnerability Factors (DBT PLEASE)',
      titleVi: 'Bước 3: Yếu tố Dễ Tổn thương (Thiếu ngủ, Bỏ bữa, Căng thẳng)',
      zone: 'Supportive',
      promptEn: 'What made you extra vulnerable that day (sleep debt, hunger, substances, illness, prior stress)?',
      promptVi: 'Yếu tố nào làm sức đề kháng tâm lý suy yếu hôm đó (thiếu ngủ, bỏ bữa, quên thuốc, căng thẳng tích tụ)?',
    },
    {
      stepNumber: 4,
      slug: 'chain-links',
      titleEn: 'Step 4: The Chain Links ([thought], [feeling], [body], [action])',
      titleVi: 'Bước 4: Chuỗi Mắt xích ([suy nghĩ], [cảm xúc], [cơ thể], [hành động])',
      zone: 'Core',
      promptEn: 'List the step-by-step links connecting the prompting event to the target behavior.',
      promptVi: 'Liệt kê các mắt xích nối từ sự kiện kích hoạt tới hành vi (suy nghĩ -> cảm giác cơ thể -> cảm xúc -> hành động).',
    },
    {
      stepNumber: 5,
      slug: 'consequences',
      titleEn: 'Step 5: Short-Term Relief vs. Long-Term Cost',
      titleVi: 'Bước 5: Lợi ích Ngắn hạn & Cái giá Dài hạn',
      zone: 'Supportive',
      promptEn: 'What immediate short-term payoff did the behavior give you, and what was the long-term cost?',
      promptVi: 'Hành vi đó mang lại sự khuây khỏa ngắn hạn gì ngay lúc đó, và cái giá dài hạn sau đó là gì?',
    },
    {
      stepNumber: 6,
      slug: 'break-points-and-repair',
      titleEn: 'Step 6: Break Points, Prevention & Healthy Repair',
      titleVi: 'Bước 6: Điểm Ngắt Chuỗi, Phòng ngừa & Sửa chữa',
      zone: 'Core',
      promptEn: 'Which early link can you interrupt with a skill next time, and what is 1 healthy repair action?',
      promptVi: 'Bạn có thể chèn kỹ năng nào vào mắt xích sớm cho lần sau, và 1 bước sửa chữa lành mạnh là gì?',
    },
  ],
  'dear-man': [
    {
      stepNumber: 1,
      slug: 'ask-and-priority',
      titleEn: 'Step 1: The Ask & Priority (Objective / Relationship / Self-Respect)',
      titleVi: 'Bước 1: Xác định Yêu cầu/Từ chối & Ưu tiên Cốt lõi',
      zone: 'Core',
      promptEn: 'What are you asking for (or saying No to) in 1 sentence, and what is your top priority?',
      promptVi: 'Bạn muốn yêu cầu hay từ chối điều gì trong 1 câu ngắn, và ưu tiên lớn nhất của bạn là gì?',
    },
    {
      stepNumber: 2,
      slug: 'describe-facts',
      titleEn: 'Step 2: D — Describe Observable Facts',
      titleVi: 'Bước 2: D — Mô tả Sự thật Khách quan (Không quy chụp)',
      zone: 'Core',
      promptEn: 'Describe the situation using pure camera facts without "always/never" or mind-reading.',
      promptVi: 'Mô tả tình huống bằng sự thật khách quan như máy quay, không dùng từ "luôn luôn / không bao giờ".',
    },
    {
      stepNumber: 3,
      slug: 'express-feelings',
      titleEn: 'Step 3: E — Express with "I Feel" Statements',
      titleVi: 'Bước 3: E — Bày tỏ Cảm xúc ("Tôi cảm thấy...")',
      zone: 'Supportive',
      promptEn: 'Express your feeling using "I feel..." without "You make me feel...".',
      promptVi: 'Diễn đạt cảm xúc theo cấu trúc "Tôi cảm thấy..." thay vì đổ lỗi "Bạn làm tôi thấy...".',
    },
    {
      stepNumber: 4,
      slug: 'assert-clearly',
      titleEn: 'Step 4: A — Assert Directly Without Pre-Apologizing',
      titleVi: 'Bước 4: A — Nói Thẳng Yêu cầu / Lời Từ chối (Không rào đón xin lỗi)',
      zone: 'Core',
      promptEn: 'State your clear request or "No" without apologizing for having a boundary.',
      promptVi: 'Nói rõ yêu cầu hoặc lời từ chối trực diện, bỏ các câu xin lỗi rào đón ở đầu câu.',
    },
    {
      stepNumber: 5,
      slug: 'reinforce-outcome',
      titleEn: 'Step 5: R — Reinforce Positive Benefit',
      titleVi: 'Bước 5: R — Củng cố Lợi ích Hợp tác',
      zone: 'Supportive',
      promptEn: 'What positive benefit happens for them or the relationship if they agree?',
      promptVi: 'Người kia hoặc mối quan hệ sẽ nhận được lợi ích tích cực gì nếu họ đồng ý?',
    },
    {
      stepNumber: 6,
      slug: 'man-and-ear-delivery',
      titleEn: 'Step 6: M-A-N Delivery & TEAM-CBT EAR Disarming',
      titleVi: 'Bước 6: Chiến lược M-A-N (Đĩa nhạc xước) & 5 Bí quyết EAR',
      zone: 'Supportive',
      promptEn: 'Draft your 1-sentence Broken Record line and how you will disarm defensive criticism.',
      promptVi: 'Chọn 1 câu ngắn để lặp lại bình tĩnh (Broken Record) và câu tìm điểm đúng (Disarming) nếu họ phản ứng.',
    },
    {
      stepNumber: 7,
      slug: 'script-and-roleplay',
      titleEn: 'Step 7: Complete Script & AI Roleplay Rehearsal',
      titleVi: 'Bước 7: Ghép Kịch bản Hoàn chỉnh & Tập dượt Đóng vai',
      zone: 'Closing',
      promptEn: 'Read back your full 4-6 sentence script and practice 1-3 roleplay rounds.',
      promptVi: 'Đọc lại kịch bản 4-6 câu hoàn chỉnh và tập dượt đóng vai 1-3 vòng.',
    },
  ],
  'paradoxical-agenda-setting': [
    {
      stepNumber: 1,
      slug: 'magic-button',
      titleEn: 'Step 1: The Magic Button Question',
      titleVi: 'Bước 1: Câu hỏi Nút bấm Phép thuật',
      zone: 'Supportive',
      promptEn: 'If pressing a magic button erased this emotion 100% right now, would you press it?',
      promptVi: 'Nếu có một nút bấm làm biến mất hoàn toàn cảm xúc này ngay lập tức, bạn có bấm không?',
    },
    {
      stepNumber: 2,
      slug: 'positive-reframing',
      titleEn: 'Step 2: Positive Reframing (Benefits & Noble Values of the Symptom)',
      titleVi: 'Bước 2: Lợi ích & Phẩm chất Đẹp đẽ Đằng sau Triệu chứng',
      zone: 'Core',
      promptEn: 'What are 3-5 ways this anxiety, guilt, or sadness tries to protect you or shows your core values?',
      promptVi: 'Nỗi lo âu, buồn bã hay tự trách này đang cố bảo vệ bạn khỏi điều gì và nói lên phẩm chất tốt đẹp nào ở bạn?',
    },
    {
      stepNumber: 3,
      slug: 'acid-test',
      titleEn: 'Step 3: The Acid Test',
      titleVi: 'Bước 3: Phép thử Thực tế (Acid Test)',
      zone: 'Core',
      promptEn: 'Do you truly need to suffer at this intensity to keep those values, or does it drain you?',
      promptVi: 'Bạn có thực sự cần phải đau khổ ở cường độ cao như vậy mới giữ được phẩm chất tốt đẹp đó không?',
    },
    {
      stepNumber: 4,
      slug: 'magic-dial',
      titleEn: 'Step 4: The Magic Dial (0-100%)',
      titleVi: 'Bước 4: Chiếc Núm vặn Phép thuật (0-100%)',
      zone: 'Supportive',
      promptEn: 'Instead of 0%, what comfortable level (e.g., 20-30%) would you like to dial this emotion down to today?',
      promptVi: 'Thay vì ép về 0%, hôm nay bạn muốn vặn chiếc núm cảm xúc này xuống mức bao nhiêu phần trăm (VD: 20-30%)?',
    },
  ],
  'hypomania-guard': [
    {
      stepNumber: 1,
      slug: 'positive-distortion-scan',
      titleEn: 'Step 1: Bipolar Positive Cognitive Distortion Scan',
      titleVi: 'Bước 1: Rà soát 5 Biến dạng Nhận thức Dương tính',
      zone: 'Supportive',
      promptEn: 'Describe the urgent decision, project, or purchase you feel driven to execute right now.',
      promptVi: 'Mô tả ý tưởng, dự án hoặc quyết định mua sắm/thay đổi lớn bạn đang muốn làm ngay lúc này.',
    },
    {
      stepNumber: 2,
      slug: 'stop-and-crisis-pros-cons',
      titleEn: 'Step 2: DBT STOP & 4-Cell Crisis Pros and Cons',
      titleVi: 'Bước 2: Kỹ năng STOP & Bảng Lợi/Hại 4 Ô',
      zone: 'Core',
      promptEn: 'Compare the short-term rush vs. long-term cost of acting tonight versus waiting 48 hours.',
      promptVi: 'So sánh cảm giác hưng phấn ngắn hạn với rủi ro dài hạn nếu làm ngay đêm nay so với chờ 48 giờ.',
    },
    {
      stepNumber: 3,
      slug: 'devils-advocate-reality-test',
      titleEn: 'Step 3: Devil’s Advocate Reality Testing',
      titleVi: 'Bước 3: Phản biện Devil’s Advocate Không Đối đầu',
      zone: 'Core',
      promptEn: 'What are 2 hidden financial, health, or relationship risks that elevated energy might be hiding?',
      promptVi: 'Đâu là 2 rủi ro ẩn về tài chính, sức khỏe hoặc mối quan hệ mà năng lượng hưng phấn đang che khuất?',
    },
    {
      stepNumber: 4,
      slug: 'lock-48h-impulse-vault',
      titleEn: 'Step 4: Lock in 48-Hour Impulse Vault & Two-Person Reality Check',
      titleVi: 'Bước 4: Khóa vào Khoang Trì hoãn 48 Giờ & Tham khảo 2 Người Tin cậy',
      zone: 'Closing',
      promptEn: 'Lock this decision for 48 hours and select 2 trusted contacts from your Ulysses Contract to consult.',
      promptVi: 'Khóa quyết định này vào Khoang Chờ 48 Giờ và chọn 2 người tin cậy trong Giao ước Ulysses để tham vấn.',
      isClinicalSafetyGate: true,
    },
  ],
  'worry-postponement': [
    {
      stepNumber: 1,
      slug: 'deposit-worry-box',
      titleEn: 'Step 1: Catch & Deposit into Worry Box',
      titleVi: 'Bước 1: Ghi nhận & Cất vào Hộp Lo âu',
      zone: 'Supportive',
      promptEn: 'Write the intrusive "What-if" thought in 1 sentence to store until your 15-minute worry window.',
      promptVi: 'Viết ngắn gọn 1 câu suy nghĩ "Nhỡ đâu..." để gửi vào Hộp Lo âu đến khung giờ 15 phút cố định.',
    },
    {
      stepNumber: 2,
      slug: 'triage-productive-vs-hypothetical',
      titleEn: 'Step 2: Triage Productive vs. Hypothetical Worry',
      titleVi: 'Bước 2: Phân loại Lo lắng Thực tế vs. Lo lắng Giả định',
      zone: 'Core',
      promptEn: 'Is there a concrete physical action available today (Productive), or is it an uncontrollable "What-if" (Hypothetical)?',
      promptVi: 'Nỗi lo này có bước hành động vật lý cụ thể nào làm được ngay (Thực tế) hay là kịch bản xa xôi không kiểm soát được (Giả định)?',
    },
  ],
  'exposure-hierarchy': [
    {
      stepNumber: 1,
      slug: 'build-suds-ladder',
      titleEn: 'Step 1: Define Feared Target & SUDS 0-100 Rating',
      titleVi: 'Bước 1: Xác định Tình huống Sợ hãi & Điểm SUDS (0-100)',
      zone: 'Supportive',
      promptEn: 'Describe the avoided situation or bodily sensation and rate baseline SUDS (0-100).',
      promptVi: 'Mô tả tình huống hoặc cảm giác cơ thể bạn đang né tránh và chấm mức độ sợ SUDS (0-100).',
    },
    {
      stepNumber: 2,
      slug: 'safety-behavior-elimination',
      titleEn: 'Step 2: Detect & Drop Safety Behaviors',
      titleVi: 'Bước 2: Phát hiện & Gỡ bỏ Hành vi An toàn Ngầm',
      zone: 'Core',
      promptEn: 'Which subtle crutch (checking, reassurance seeking, exit guarding) will you drop during this exposure?',
      promptVi: 'Bạn sẽ gỡ bỏ hành vi an toàn ngầm nào (kiểm tra mạch, xin trấn an, canh cửa thoát) trong lần tiếp xúc này?',
    },
  ],
  'pleasure-predicting': [
    {
      stepNumber: 1,
      slug: 'predict-difficulty-and-pleasure',
      titleEn: 'Step 1: Predict Difficulty & Satisfaction (0-100%)',
      titleVi: 'Bước 1: Dự đoán Độ khó & Độ hài lòng (0-100%)',
      zone: 'Core',
      promptEn: 'Before starting this 5-minute task, predict Difficulty (0-100%) and Pleasure/Satisfaction (0-100%).',
      promptVi: 'Trước khi làm thử 5 phút, bạn dự đoán Độ khó (0-100%) và Độ hài lòng (0-100%) là bao nhiêu?',
    },
    {
      stepNumber: 2,
      slug: 'actual-ratings-calibration',
      titleEn: 'Step 2: Log Actual Ratings & Prediction Error',
      titleVi: 'Bước 2: Ghi nhận Thực tế & Hiệu chỉnh Sai số Dự đoán',
      zone: 'Closing',
      promptEn: 'After completing the step, what were your Actual Difficulty and Actual Satisfaction (0-100%)?',
      promptVi: 'Sau khi làm xong, Độ khó thực tế và Độ hài lòng thực tế của bạn là bao nhiêu phần trăm?',
    },
  ],
  'abc-please': [
    {
      stepNumber: 1,
      slug: 'accumulate-mastery-cope',
      titleEn: 'Step 1: Accumulate Positives, Build Mastery & Cope Ahead',
      titleVi: 'Bước 1: Tích lũy Điều Tích cực, Tự chủ (Mastery) & Diễn tập Đối phó',
      zone: 'Core',
      promptEn: 'Choose 1 small positive moment, 1 mastery task, and 1 upcoming situation to Cope Ahead for.',
      promptVi: 'Chọn 1 trải nghiệm dễ chịu nhỏ, 1 việc tạo cảm giác làm chủ và 1 tình huống sắp tới để diễn tập đối phó.',
    },
    {
      stepNumber: 2,
      slug: 'please-biological-audit',
      titleEn: 'Step 2: PLEASE Biological Vulnerability Shield',
      titleVi: 'Bước 2: Rà soát Lá chắn Sinh học PLEASE',
      zone: 'Supportive',
      promptEn: 'Which biological anchor (Medication, Balanced Eating, Avoiding Caffeine/Alcohol, Sleep, Exercise) needs care today?',
      promptVi: 'Mốc sinh học nào (Thuốc men, Ăn uống, Tránh chất kích thích, Giấc ngủ cố định, Vận động) cần được ưu tiên hôm nay?',
    },
  ],
  'crisis-pros-cons': [
    {
      stepNumber: 1,
      slug: 'four-cell-crisis-matrix',
      titleEn: 'Step 1: 4-Cell Crisis Pros & Cons Matrix',
      titleVi: 'Bước 1: Bảng 4 Ô Lợi/Hại của Việc Hành động theo Xung động vs. Chờ 48 Giờ',
      zone: 'Core',
      promptEn: 'List Pros & Cons of acting on the urge right now versus resisting and waiting 48 hours.',
      promptVi: 'Liệt kê Lợi/Hại của việc làm theo xung động ngay lúc này so với việc chịu đựng và chờ 48 giờ.',
    },
  ],
  'team-cbt-daily-mood-log': [],
  'anti-procrastination': [],
  'prediction-calibration': [],
  'hypomania-devils-advocate': [],
};

export interface PushbackEvaluationResult {
  shouldPushBack: boolean;
  effectivePushbackLevel: PushbackLevel;
  maxAllowedRetries: number;
  currentRetryCount: number;
  promptVi?: string;
  promptEn?: string;
}

/**
 * Evaluates the 4-Level Socratic Pushback matrix across Supportive, Core, and Closing zones.
 */
export function evaluateSocraticPushback(params: {
  configuredLevel: PushbackLevel;
  zone: PushbackZone;
  isClinicalSafetyGate?: boolean;
  currentRetryCount: number;
  userInput: string;
}): PushbackEvaluationResult {
  const { configuredLevel, zone, isClinicalSafetyGate, currentRetryCount, userInput } = params;

  // Closing zone or any clinical safety/rest/accuracy gate ALWAYS forces pushback to 'off'
  if (zone === 'Closing' || isClinicalSafetyGate) {
    return {
      shouldPushBack: false,
      effectivePushbackLevel: 'off',
      maxAllowedRetries: 0,
      currentRetryCount,
    };
  }

  // Supportive zone allows at most 1 gentle prompt regardless of configured level
  let maxAllowedRetries = 0;
  let effectiveLevel: PushbackLevel = configuredLevel;

  if (zone === 'Supportive') {
    if (configuredLevel === 'off') {
      maxAllowedRetries = 0;
    } else {
      maxAllowedRetries = 1;
      effectiveLevel = 'gentle';
    }
  } else {
    // Core zone
    switch (configuredLevel) {
      case 'off':
        maxAllowedRetries = 0;
        break;
      case 'gentle':
        maxAllowedRetries = 1;
        break;
      case 'moderate':
        maxAllowedRetries = 2;
        break;
      case 'firm':
        maxAllowedRetries = 3;
        break;
    }
  }

  const trimmed = userInput.trim();
  const isSkipOrLowEffort =
    trimmed.length < 4 ||
    /^(skip|pass|idk|i don't know|nothing|none|bỏ qua|không biết|chịu|không có)$/i.test(trimmed);

  if (!isSkipOrLowEffort || currentRetryCount >= maxAllowedRetries) {
    return {
      shouldPushBack: false,
      effectivePushbackLevel: effectiveLevel,
      maxAllowedRetries,
      currentRetryCount,
    };
  }

  // Generate Socratic Pushback prompt by retry attempt (1, 2, or 3)
  const nextAttempt = currentRetryCount + 1;
  let promptVi = '';
  let promptEn = '';

  if (nextAttempt === 1) {
    promptVi =
      'Bước này thường mang lại góc nhìn rất hữu ích — bạn có muốn thử tìm 1 chi tiết nhỏ thôi trước khi mình đi tiếp không?';
    promptEn =
      'This step often unlocks the biggest shift — would you like to try finding just one small detail before we move on?';
  } else if (nextAttempt === 2) {
    // Double-Standard technique (TEAM-CBT)
    promptVi =
      'Thử góc nhìn Tiêu chuẩn kép nhé: Nếu một người bạn thân mà bạn rất yêu quý đang ở đúng hoàn cảnh này và nói câu đó, bạn sẽ nói gì với họ?';
    promptEn =
      'Let’s try the Double-Standard lens: If a close friend you deeply care about were in this exact situation saying this, what would you tell them?';
  } else {
    // Attempt 3 (Firm level): Paradoxical resistance inquiry
    promptVi =
      'Mình nhận thấy bước này đang rất khó để đi tiếp. Điều gì khiến việc ngồi lại với câu hỏi này trở nên nặng nề hoặc mang tính bảo vệ cho bạn lúc này?';
    promptEn =
      'I notice this step feels tough to stay with right now. What makes sitting with this question feel heavy or protective for you in this moment?';
  }

  return {
    shouldPushBack: true,
    effectivePushbackLevel: effectiveLevel,
    maxAllowedRetries,
    currentRetryCount: nextAttempt,
    promptVi,
    promptEn,
  };
}

/**
 * "DBT-First, CBT-Second" Arousal & Polarity Clinical Router
 */
export function recommendTechniqueByArousalAndPolarity(params: {
  preIntensity: number;
  moodPolarity?: BipolarPole | number;
  energyLevel?: BipolarPole | number;
  asrmScore?: number;
  primarySymptom?: 'panic' | 'worry' | 'avoidance' | 'depression-inertia' | 'interpersonal-conflict' | 'regrettable-behavior' | 'dilemma' | 'resistance' | 'self-criticism';
}): {
  modality: 'DBT-Distress-Tolerance' | 'DBT-Regulation-Mindfulness' | 'CBT-TEAM-CBT' | 'Bipolar-Hypomania-Guard';
  arousalZone: 'red_8_to_10' | 'orange_5_to_7' | 'green_yellow_1_to_6';
  recommendedTechnique: TechniqueSlug;
  rationaleVi: string;
  rationaleEn: string;
} {
  const intensity = params.preIntensity;
  const mood = params.moodPolarity ?? 0;
  const energy = params.energyLevel ?? 0;
  const asrm = params.asrmScore ?? 0;

  // 1. Red Zone: Intensity >= 8/10 OR Bipolar Mixed State (Mood <= -2 AND Energy >= +2) -> DBT TIPP
  if (intensity >= 8 || (mood <= -2 && energy >= 2)) {
    return {
      modality: 'DBT-Distress-Tolerance',
      arousalZone: 'red_8_to_10',
      recommendedTechnique: 'tipp',
      rationaleVi:
        'Nguyên lý DBT-First: Cường độ kích hoạt sinh lý đang ở Vùng Đỏ (>= 8/10 hoặc Pha Hỗn hợp). Cần dùng DBT TIPP để hạ nhiệt hệ thần kinh giao cảm trước khi làm bài tập nhận thức.',
      rationaleEn:
        'DBT-First Principle: Physiological arousal is in the Red Zone (>= 8/10 or Bipolar Mixed State). Use DBT TIPP to down-regulate sympathetic flooding before any cognitive work.',
    };
  }

  // 2. Bipolar Hypomania / Mania Guard: Mood >= +2 or ASRM >= 6
  if (mood >= 2 || asrm >= 6) {
    return {
      modality: 'Bipolar-Hypomania-Guard',
      arousalZone: 'orange_5_to_7',
      recommendedTechnique: 'hypomania-guard',
      rationaleVi:
        'Cực khí sắc đang ở vùng Hưng cảm nhẹ (>= +2 hoặc ASRM >= 6). Kích hoạt Lá chắn Hưng cảm (Hypomania Guard, Devil’s Advocate & Khoang Trì hoãn 48 Giờ).',
      rationaleEn:
        'Mood polarity is in the Hypomanic range (>= +2 or ASRM >= 6). Activating Hypomania Guard with Devil’s Advocate reality testing and the 48-Hour Impulse Vault.',
    };
  }

  // 3. Orange Zone: Intensity 5-7/10 -> DBT Emotion Regulation / Mindfulness / Interpersonal
  if (intensity >= 5 && intensity <= 7) {
    let technique: TechniqueSlug = 'opposite-action';
    if (params.primarySymptom === 'interpersonal-conflict') {
      technique = 'dear-man';
    } else if (params.primarySymptom === 'regrettable-behavior') {
      technique = 'chain-analysis';
    } else if (params.primarySymptom === 'dilemma') {
      technique = 'wise-mind';
    }
    return {
      modality: 'DBT-Regulation-Mindfulness',
      arousalZone: 'orange_5_to_7',
      recommendedTechnique: technique,
      rationaleVi:
        'Cường độ cảm xúc ở Vùng Cam (5-7/10): Ưu tiên kỹ năng Điều hòa Cảm xúc & Chánh niệm DBT để cân bằng xung động trước.',
      rationaleEn:
        'Emotional intensity is in the Orange Zone (5-7/10): Prioritizing DBT Emotion Regulation & Mindfulness to stabilize action urges.',
    };
  }

  // 4. Green/Yellow Zone: Intensity 1-6/10 -> CBT & TEAM-CBT Core Restructuring & Activation
  let cbtTechnique: TechniqueSlug = 'thought-record';
  if (params.primarySymptom === 'depression-inertia' || mood <= -2) {
    cbtTechnique = 'behavioral-activation';
  } else if (params.primarySymptom === 'worry') {
    cbtTechnique = 'worry-postponement';
  } else if (params.primarySymptom === 'avoidance') {
    cbtTechnique = 'exposure-hierarchy';
  } else if (params.primarySymptom === 'resistance') {
    cbtTechnique = 'paradoxical-agenda-setting';
  }

  return {
    modality: 'CBT-TEAM-CBT',
    arousalZone: 'green_yellow_1_to_6',
    recommendedTechnique: cbtTechnique,
    rationaleVi:
      'Cường độ cảm xúc ở Vùng Xanh/Vàng (1-6/10): Vỏ não trước trán đủ tĩnh lặng để thực hành tái cấu trúc nhận thức hoặc kích hoạt hành vi CBT / TEAM-CBT.',
    rationaleEn:
      'Arousal is in the Green/Yellow Zone (1-6/10): Prefrontal cortex is online for structured CBT / TEAM-CBT cognitive restructuring or behavioral activation.',
  };
}

/**
 * Specialized Clinical Safeguard Evaluators for Phase 3 Protocols
 */
export function evaluateTippMedicalExclusionScreen(answers: {
  hasHeartCondition?: boolean;
  hasBradycardia?: boolean;
  takesBetaBlockers?: boolean;
  hasColdAllergyOrRaynauds?: boolean;
  hasEatingDisorder?: boolean;
  hasMedicalPregnancyRestriction?: boolean;
  isUnsure?: boolean;
}): {
  coldWaterAllowed: boolean;
  fallbackSkill: 'paced-breathing';
  pushbackLevel: 'off';
  reasonVi: string;
  reasonEn: string;
} {
  const anyExclusion =
    Boolean(answers.hasHeartCondition) ||
    Boolean(answers.hasBradycardia) ||
    Boolean(answers.takesBetaBlockers) ||
    Boolean(answers.hasColdAllergyOrRaynauds) ||
    Boolean(answers.hasEatingDisorder) ||
    Boolean(answers.hasMedicalPregnancyRestriction) ||
    Boolean(answers.isUnsure);

  if (anyExclusion) {
    return {
      coldWaterAllowed: false,
      fallbackSkill: 'paced-breathing',
      pushbackLevel: 'off',
      reasonVi:
        'Vì lý do an toàn y khoa (tim mạch / thuốc chẹn beta / dị ứng lạnh / chưa chắc chắn), hệ thống đã khóa bước Nước lạnh và chuyển sang Thở dẫn nhịp (Paced Breathing 4-6).',
      reasonEn:
        'For your medical safety (cardiac/beta-blocker/cold-allergy exclusion or uncertainty), Cold Water Temperature is locked and redirected to Paced Breathing (4-6).',
    };
  }

  return {
    coldWaterAllowed: true,
    fallbackSkill: 'paced-breathing',
    pushbackLevel: 'off',
    reasonVi: 'Đã qua sàng lọc y khoa: Bạn có thể áp nước mát/lạnh lên vùng mắt và gò má trong 15–30 giây.',
    reasonEn: 'Medical screen cleared: You may safely apply cool/cold water to your eyes and upper cheeks for 15–30 seconds.',
  };
}

export function evaluateThoughtRecordAccuracyCheck(params: {
  automaticThought: string;
  isObjectivelyTrueFact: boolean;
  preferredBranch?: 'problem-solving' | 'compassionate-coping' | 'split-thought';
}): {
  haltRestructuring: boolean;
  outcome: SessionOutcome;
  pushbackLevel: 'off';
  branch: 'problem-solving' | 'compassionate-coping' | 'split-thought' | 'continue-balanced-thought';
  guidanceVi: string;
  guidanceEn: string;
} {
  if (params.isObjectivelyTrueFact) {
    const branch = params.preferredBranch ?? 'problem-solving';
    return {
      haltRestructuring: true,
      outcome: 'accurate-thought-exit',
      pushbackLevel: 'off',
      branch,
      guidanceVi:
        'Cổng Accuracy Check: Suy nghĩ này phản ánh một sự thật/mất mát khách quan có thật. Hệ thống dừng ngay việc tìm bằng chứng phản bác để tránh "tích cực độc hại" và chuyển sang Giải quyết vấn đề thực tế / Tự nâng đỡ bản thân.',
      guidanceEn:
        'Accuracy Check Gate: This thought reflects an objectively real event or loss. Stopping cognitive restructuring immediately to avoid toxic positivity and pivoting to compassionate coping / problem-solving.',
    };
  }

  return {
    haltRestructuring: false,
    outcome: 'in-progress',
    pushbackLevel: 'off',
    branch: 'continue-balanced-thought',
    guidanceVi: 'Tiếp tục Bước 6: Tổng hợp Suy nghĩ Cân bằng từ bằng chứng ủng hộ và phản bác.',
    guidanceEn: 'Proceed to Step 6: Synthesize a Balanced Thought combining evidence for and against.',
  };
}

export function evaluateBehavioralActivationRestCheck(params: {
  isBiologicalExhaustionOrIllness: boolean;
  restStartTime?: string;
  restEndTime?: string;
}): {
  needsGuiltFreeRest: boolean;
  outcome: SessionOutcome;
  pushbackLevel: 'off';
  planVi: string;
  planEn: string;
} {
  if (params.isBiologicalExhaustionOrIllness) {
    const windowStr =
      params.restStartTime && params.restEndTime
        ? ` (${params.restStartTime} - ${params.restEndTime})`
        : '';
    return {
      needsGuiltFreeRest: true,
      outcome: 'justified-exit',
      pushbackLevel: 'off',
      planVi: `Cổng Rest Check: Cơ thể bạn đang cần phục hồi sinh học thực sự. Kế hoạch hôm nay được chuyển thành "Nghỉ ngơi Chủ động Không Áy náy"${windowStr}.`,
      planEn: `Rest Check Gate: Your body genuinely requires biological recovery. Today's plan is converted into "Deliberate Guilt-Free Rest"${windowStr}.`,
    };
  }

  return {
    needsGuiltFreeRest: false,
    outcome: 'in-progress',
    pushbackLevel: 'off',
    planVi: 'Tiếp tục Bước 3: Chọn 1 hoạt động nhỏ mang lại ý nghĩa và thu nhỏ đến độ tự tin >= 7/10.',
    planEn: 'Proceed to Step 3: Select 1 small meaningful activity and scale until confidence >= 7/10.',
  };
}

export function evaluateWiseMindHarshSelfCriticGuard(reasonableMindInput: string): {
  selfCriticDetected: boolean;
  coachingVi?: string;
  coachingEn?: string;
} {
  const criticRegex =
    /\b(i'm a pathetic|i am worthless|because i'm weak|i'm too stupid|i am a loser|defective)\b|(vì tôi yếu đuối|tôi là kẻ vô dụng|tôi quá ngu ngốc|kẻ thất bại thảm hại)/i;
  if (criticRegex.test(reasonableMindInput)) {
    return {
      selfCriticDetected: true,
      coachingVi:
        'Bộ lọc Harsh Self-Critic Guard: Đó là giọng nói của kẻ tự phán xét khắc nghiệt chứ không phải Tâm Lý trí khách quan. Nếu bỏ lời chì chiết bản thân ra, dữ kiện thực tế còn lại là gì?',
      coachingEn:
        'Harsh Self-Critic Guard: That sounds like the Harsh Inner Critic wearing a disguise, not objective Reasonable Mind. If we strip away the self-attack, what are the neutral facts?',
    };
  }
  return { selfCriticDetected: false };
}

export function evaluateChainAnalysisSafeguards(targetBehaviorText: string): {
  hardStopTriggered: boolean;
  hardStopType?: 'self-harm' | 'victimization';
  shameProtocolTriggered: boolean;
  outcome: SessionOutcome;
  pushbackLevel?: 'off';
  messageVi: string;
  messageEn: string;
} {
  const selfHarmRegex =
    /\b(cut myself|burned myself|self-harm|self harm|suicide attempt|overdosed|hit myself)\b|(tự hại|rạch tay|tự làm đau|toan tự sát|uống thuốc quá liều)/i;
  if (selfHarmRegex.test(targetBehaviorText)) {
    return {
      hardStopTriggered: true,
      hardStopType: 'self-harm',
      shameProtocolTriggered: false,
      outcome: 'safety-stop',
      pushbackLevel: 'off',
      messageVi:
        'Hard Stop 1 (An toàn Lâm sàng): Không bao giờ chạy Phân tích Chuỗi tự động trên hành vi tự hại hoặc tự sát. Việc này cần được thực hiện trực tiếp cùng nhà trị liệu DBT để đảm bảo an toàn cho bạn.',
      messageEn:
        'Hard Stop 1 (Clinical Safety): Automated Chain Analysis must never be run on self-harm or suicidal behavior. Please work through this safely with a live DBT clinician and use crisis support right now.',
    };
  }

  const victimizationRegex =
    /\b(he hit me|she assaulted me|was abused by|partner beat me|was cheated on|someone attacked me)\b|(bị người khác đánh|bị bạo hành|bị xâm hại|bị họ lừa dối|họ tấn công tôi)/i;
  if (victimizationRegex.test(targetBehaviorText)) {
    return {
      hardStopTriggered: true,
      hardStopType: 'victimization',
      shameProtocolTriggered: false,
      outcome: 'justified-exit',
      pushbackLevel: 'off',
      messageVi:
        'Hard Stop 2: Việc người khác xâm hại, bạo hành hoặc đối xử tệ với bạn không phải là lỗi hay chuỗi hành vi của bạn. Chúng ta dừng phân tích chuỗi tại đây và chuyển sang bảo vệ an toàn cho bạn.',
      messageEn:
        'Hard Stop 2: Being mistreated or harmed by another person is not your target behavior to analyze. Halting Chain Analysis and pivoting to boundary and safety support.',
    };
  }

  const shameRegex =
    /\b(i am disgusting|i hate myself so much|so ashamed i can't look|i'm a horrible monster)\b|(tôi thật kinh tởm|xấu hổ không dám nhìn ai|tôi ghê tởm chính mình|tôi là con quái vật)/i;
  if (shameRegex.test(targetBehaviorText)) {
    return {
      hardStopTriggered: false,
      shameProtocolTriggered: true,
      outcome: 'in-progress',
      pushbackLevel: 'off',
      messageVi:
        'Giao thức Bảo vệ Xấu hổ (Shame Protocol): Mình nghe thấy cảm giác xấu hổ và tự trách đang rất nặng nề lúc này. Chúng ta đã tắt toàn bộ Pushback — hãy hít thở nhẹ nhàng, mọi mắt xích đều có lý do của nó trong bối cảnh đó.',
      messageEn:
        'Shame Protocol Activated: I hear how heavy the shame feels right now. Pushback is turned completely off — let’s slow down and remember with compassion that every link made sense in context.',
    };
  }

  return {
    hardStopTriggered: false,
    shameProtocolTriggered: false,
    outcome: 'in-progress',
    messageVi: 'Hợp lệ để tiếp tục phân tích chuỗi hành vi.',
    messageEn: 'Safe to proceed with Behavioral Chain Analysis.',
  };
}

/**
 * Stateful Session Engine Class managing the full 5-Phase Lifecycle
 */
export class ClinicalSessionEngine {
  public session: CognitiveToolkitSession;
  public phase: SessionPhase;
  public currentStepIndex: number;
  public currentStepRetryCount: number;
  public lastSafetyEvaluation?: FourLayerSafetyEvaluation;

  constructor(init: {
    id: string;
    technique?: TechniqueSlug;
    channel?: 'flutter-mobile' | 'web-pwa' | 'voice-burst';
    language?: 'vi' | 'en';
    mode?: 'expressive' | 'instrumental';
    pushbackLevel?: PushbackLevel;
    preIntensity: number;
    moodPolarityAtStart?: BipolarPole | number;
    energyLevelAtStart?: BipolarPole | number;
    emotions?: string[];
    hrvContext?: HrvBaselineContext;
    date?: string;
    time?: string;
  }) {
    const now = new Date();
    const defaultDate = now.toISOString().slice(0, 10);
    const defaultTime = now.toISOString().slice(11, 16);

    const routed = recommendTechniqueByArousalAndPolarity({
      preIntensity: init.preIntensity,
      moodPolarity: init.moodPolarityAtStart,
      energyLevel: init.energyLevelAtStart,
    });

    this.session = {
      id: init.id,
      type: 'cognitive-toolkit-session',
      technique: init.technique ?? routed.recommendedTechnique,
      date: init.date ?? defaultDate,
      time: init.time ?? defaultTime,
      channel: init.channel ?? 'web-pwa',
      language: init.language ?? 'vi',
      mode: init.mode ?? 'instrumental',
      pushbackLevel: init.pushbackLevel ?? 'moderate',
      preIntensity: init.preIntensity,
      moodPolarityAtStart: init.moodPolarityAtStart,
      energyLevelAtStart: init.energyLevelAtStart,
      emotions: init.emotions ?? [],
      negativeDistortionsIdentified: [],
      positiveDistortionsIdentified: [],
      selfDefeatingBeliefsIdentified: [],
      safetyBehaviorsIdentified: [],
      stepsCompleted: 0,
      stepsSkipped: [],
      outcome: 'in-progress',
      hrvContext: init.hrvContext,
      structuredStepsPayload: {},
    };

    this.phase = 'Phase0_ModeCheck';
    this.currentStepIndex = 0;
    this.currentStepRetryCount = 0;
  }

  public setPushbackLevel(level: PushbackLevel): void {
    this.session.pushbackLevel = level;
  }

  public adjustPushbackRelative(direction: 'softer' | 'harder'): PushbackLevel {
    const order: PushbackLevel[] = ['off', 'gentle', 'moderate', 'firm'];
    const idx = order.indexOf(this.session.pushbackLevel);
    const nextIdx =
      direction === 'softer' ? Math.max(0, idx - 1) : Math.min(order.length - 1, idx + 1);
    this.session.pushbackLevel = order[nextIdx]!;
    return this.session.pushbackLevel;
  }

  /**
   * Advances from Phase 0/1 Check-In through the 4-Layer Safety & Arousal Router
   */
  public performCheckInAndRoute(params: {
    checkInText: string;
    bmsSuicidalScore?: number;
    phq9Item9Score?: number;
    asrmScore?: number;
    requestedTechnique?: TechniqueSlug;
  }): {
    phase: SessionPhase;
    safety: FourLayerSafetyEvaluation;
    selectedTechnique: TechniqueSlug;
    earEmpathyOnly: boolean;
  } {
    this.phase = 'Phase1_CheckIn';

    // Silently classify distortions and SDBs on check-in text
    const textAnalysis = analyzeClinicalText(params.checkInText);
    this.mergeDetectedPatterns(textAnalysis);

    const safety = evaluateFourLayerSafety({
      text: params.checkInText,
      preIntensity: this.session.preIntensity,
      moodPolarity: this.session.moodPolarityAtStart,
      energyLevel: this.session.energyLevelAtStart,
      bmsSuicidalScore: params.bmsSuicidalScore,
      phq9Item9Score: params.phq9Item9Score,
      asrmScore: params.asrmScore,
    });
    this.lastSafetyEvaluation = safety;

    if (safety.recommendedOutcome === 'safety-stop') {
      this.session.outcome = 'safety-stop';
      this.session.pushbackLevel = 'off';
      this.phase = 'SafetyStop';
      return {
        phase: this.phase,
        safety,
        selectedTechnique: this.session.technique,
        earEmpathyOnly: false,
      };
    }

    if (safety.recommendedOutcome === 'justified-exit') {
      this.session.outcome = 'justified-exit';
      this.session.pushbackLevel = 'off';
      this.phase = 'Phase4_Close';
      return {
        phase: this.phase,
        safety,
        selectedTechnique: this.session.technique,
        earEmpathyOnly: true,
      };
    }

    // If Expressive mode was selected (and safe), stay in supportive EAR listening without pushing CBT steps
    if (this.session.mode === 'expressive' && safety.severity === 'safe') {
      return {
        phase: 'Phase0_ModeCheck',
        safety,
        selectedTechnique: this.session.technique,
        earEmpathyOnly: true,
      };
    }

    // Route via "DBT-First, CBT-Second"
    if (safety.recommendedTechnique === 'tipp') {
      this.session.technique = 'tipp';
      this.session.pushbackLevel = 'off';
    } else if (params.requestedTechnique) {
      // Check "When NOT to use": if user is in hypomania (mood >= +2), override high-activation BA with hypomania-guard
      if (
        (this.session.moodPolarityAtStart ?? 0) >= 2 &&
        params.requestedTechnique === 'behavioral-activation'
      ) {
        this.session.technique = 'hypomania-guard';
      } else {
        this.session.technique = params.requestedTechnique;
      }
    } else {
      const routed = recommendTechniqueByArousalAndPolarity({
        preIntensity: this.session.preIntensity,
        moodPolarity: this.session.moodPolarityAtStart,
        energyLevel: this.session.energyLevelAtStart,
        asrmScore: params.asrmScore,
      });
      this.session.technique = routed.recommendedTechnique;
    }

    this.phase = 'Phase3_GuidedProtocol';
    this.currentStepIndex = 0;
    this.currentStepRetryCount = 0;

    return {
      phase: this.phase,
      safety,
      selectedTechnique: this.session.technique,
      earEmpathyOnly: false,
    };
  }

  public getCurrentStepDefinition(): ProtocolStepDefinition | undefined {
    const steps = PROTOCOL_STEP_DEFINITIONS[this.session.technique] ?? [];
    return steps[this.currentStepIndex];
  }

  /**
   * Submits user input for the current protocol step in Phase 3
   */
  public submitProtocolStep(params: {
    userInput: string;
    isObjectivelyAccurateFact?: boolean;
    needsBiologicalRest?: boolean;
    isRealWorldDangerOrJustified?: boolean;
  }): {
    phase: SessionPhase;
    outcome: SessionOutcome;
    pushedBack: boolean;
    pushbackPromptVi?: string;
    pushbackPromptEn?: string;
    clinicalNoteVi?: string;
    clinicalNoteEn?: string;
    currentStep?: ProtocolStepDefinition;
  } {
    // Always run 4-layer safety screen on every turn
    const safety = evaluateFourLayerSafety({
      text: params.userInput,
      preIntensity: 0, // Already routed in Phase 1
    });
    if (safety.recommendedOutcome === 'safety-stop') {
      this.session.outcome = 'safety-stop';
      this.session.pushbackLevel = 'off';
      this.phase = 'SafetyStop';
      return {
        phase: this.phase,
        outcome: this.session.outcome,
        pushedBack: false,
        clinicalNoteVi: safety.messageVi,
        clinicalNoteEn: safety.messageEn,
      };
    }

    // Silently analyze text for distortions / SDBs / safety behaviors
    const textAnalysis = analyzeClinicalText(params.userInput);
    this.mergeDetectedPatterns(textAnalysis);

    const steps = PROTOCOL_STEP_DEFINITIONS[this.session.technique] ?? [];
    const stepDef = steps[this.currentStepIndex];
    if (!stepDef) {
      this.phase = 'Phase4_Close';
      this.session.outcome = 'completed';
      return {
        phase: this.phase,
        outcome: this.session.outcome,
        pushedBack: false,
      };
    }

    // Check protocol-specific Clinical Gates
    if (
      this.session.technique === 'thought-record' &&
      stepDef.slug === 'accuracy-check-and-balanced-thought' &&
      params.isObjectivelyAccurateFact
    ) {
      const acc = evaluateThoughtRecordAccuracyCheck({
        automaticThought: params.userInput,
        isObjectivelyTrueFact: true,
      });
      this.session.outcome = acc.outcome;
      this.session.pushbackLevel = 'off';
      this.session.structuredStepsPayload[stepDef.slug] = params.userInput;
      this.session.stepsCompleted += 1;
      this.phase = 'Phase4_Close';
      return {
        phase: this.phase,
        outcome: this.session.outcome,
        pushedBack: false,
        clinicalNoteVi: acc.guidanceVi,
        clinicalNoteEn: acc.guidanceEn,
      };
    }

    if (
      this.session.technique === 'behavioral-activation' &&
      stepDef.slug === 'mandatory-rest-check' &&
      params.needsBiologicalRest
    ) {
      const rest = evaluateBehavioralActivationRestCheck({
        isBiologicalExhaustionOrIllness: true,
      });
      this.session.outcome = rest.outcome;
      this.session.pushbackLevel = 'off';
      this.session.structuredStepsPayload[stepDef.slug] = params.userInput;
      this.session.stepsCompleted += 1;
      this.phase = 'Phase4_Close';
      return {
        phase: this.phase,
        outcome: this.session.outcome,
        pushedBack: false,
        clinicalNoteVi: rest.planVi,
        clinicalNoteEn: rest.planEn,
      };
    }

    if (
      this.session.technique === 'opposite-action' &&
      stepDef.slug === 'justified-check' &&
      params.isRealWorldDangerOrJustified
    ) {
      this.session.outcome = 'justified-exit';
      this.session.pushbackLevel = 'off';
      this.session.structuredStepsPayload[stepDef.slug] = params.userInput;
      this.session.stepsCompleted += 1;
      this.phase = 'Phase4_Close';
      return {
        phase: this.phase,
        outcome: this.session.outcome,
        pushedBack: false,
        clinicalNoteVi:
          'Justified Check: Cảm xúc và thôi thúc bảo vệ bản thân của bạn là hoàn toàn chính đáng trước nguy hiểm thực tế. Đóng phiên an toàn.',
        clinicalNoteEn:
          'Justified Check: Your emotion and protective urge fit the objective facts. Closing session with justified-exit.',
      };
    }

    if (this.session.technique === 'chain-analysis') {
      const chainGuard = evaluateChainAnalysisSafeguards(params.userInput);
      if (chainGuard.hardStopTriggered) {
        this.session.outcome = chainGuard.outcome;
        this.session.pushbackLevel = 'off';
        this.phase = chainGuard.outcome === 'safety-stop' ? 'SafetyStop' : 'Phase4_Close';
        return {
          phase: this.phase,
          outcome: this.session.outcome,
          pushedBack: false,
          clinicalNoteVi: chainGuard.messageVi,
          clinicalNoteEn: chainGuard.messageEn,
        };
      }
      if (chainGuard.shameProtocolTriggered) {
        this.session.pushbackLevel = 'off';
      }
    }

    let wiseMindCriticNoteVi: string | undefined;
    let wiseMindCriticNoteEn: string | undefined;
    if (
      this.session.technique === 'wise-mind' &&
      stepDef.slug === 'reasonable-mind-with-critic-guard'
    ) {
      const criticCheck = evaluateWiseMindHarshSelfCriticGuard(params.userInput);
      if (criticCheck.selfCriticDetected) {
        wiseMindCriticNoteVi = criticCheck.coachingVi;
        wiseMindCriticNoteEn = criticCheck.coachingEn;
      }
    }

    // Evaluate Socratic Pushback if user tried to skip or gave ultra-brief answer
    const pushbackEval = evaluateSocraticPushback({
      configuredLevel: this.session.pushbackLevel,
      zone: stepDef.zone,
      isClinicalSafetyGate: stepDef.isClinicalSafetyGate,
      currentRetryCount: this.currentStepRetryCount,
      userInput: params.userInput,
    });

    if (pushbackEval.shouldPushBack) {
      this.currentStepRetryCount = pushbackEval.currentRetryCount;
      return {
        phase: this.phase,
        outcome: this.session.outcome,
        pushedBack: true,
        pushbackPromptVi: pushbackEval.promptVi,
        pushbackPromptEn: pushbackEval.promptEn,
        currentStep: stepDef,
      };
    }

    // Step accepted (or pushback conceded after max retries)
    const isSkipped =
      params.userInput.trim().length < 4 ||
      /^(skip|pass|idk|bỏ qua|không biết)$/i.test(params.userInput.trim());

    if (isSkipped) {
      this.session.stepsSkipped.push(stepDef.slug);
    } else {
      this.session.stepsCompleted += 1;
    }
    this.session.structuredStepsPayload[stepDef.slug] = params.userInput;

    // Special outcome for Hypomania Guard Step 4 (48h Impulse Vault Lock)
    if (
      this.session.technique === 'hypomania-guard' &&
      stepDef.slug === 'lock-48h-impulse-vault'
    ) {
      this.session.outcome = 'impulse-locked-48h';
      this.phase = 'Phase4_Close';
      return {
        phase: this.phase,
        outcome: this.session.outcome,
        pushedBack: false,
        clinicalNoteVi: 'Quyết định đã được khóa an toàn vào Khoang Trì hoãn 48 Giờ.',
        clinicalNoteEn: 'Decision safely locked in the 48-Hour Impulse Vault.',
      };
    }

    // Advance to next step or Phase 4 Close
    this.currentStepIndex += 1;
    this.currentStepRetryCount = 0;

    if (this.currentStepIndex >= steps.length) {
      this.phase = 'Phase4_Close';
      if (this.session.outcome === 'in-progress') {
        this.session.outcome = 'completed';
      }
      return {
        phase: this.phase,
        outcome: this.session.outcome,
        pushedBack: false,
        clinicalNoteVi: wiseMindCriticNoteVi,
        clinicalNoteEn: wiseMindCriticNoteEn,
      };
    }

    return {
      phase: this.phase,
      outcome: this.session.outcome,
      pushedBack: false,
      clinicalNoteVi: wiseMindCriticNoteVi,
      clinicalNoteEn: wiseMindCriticNoteEn,
      currentStep: steps[this.currentStepIndex],
    };
  }

  /**
   * Phase 4: Closes session, records postIntensity & takeaway, and checks for distress spike (>= +3)
   */
  public closeSession(params: {
    postIntensity: number;
    takeaway?: string;
  }): {
    session: CognitiveToolkitSession;
    distressSpikeTriggeredGrounding: boolean;
    filename: string;
    markdownContent: string;
  } {
    this.session.postIntensity = params.postIntensity;
    this.session.intensityDelta = params.postIntensity - this.session.preIntensity;
    if (params.takeaway) {
      this.session.takeaway = params.takeaway;
    }
    if (this.session.outcome === 'in-progress') {
      this.session.outcome = 'completed';
    }
    this.phase = 'Phase4_Close';

    const distressSpikeTriggeredGrounding = (this.session.intensityDelta ?? 0) >= 3;
    const exported = exportSessionToMarkdown(this.session, 1);

    return {
      session: this.session,
      distressSpikeTriggeredGrounding,
      filename: exported.filename,
      markdownContent: exported.markdownContent,
    };
  }

  private mergeDetectedPatterns(analysis: ReturnType<typeof analyzeClinicalText>): void {
    const negSet = new Set(this.session.negativeDistortionsIdentified ?? []);
    for (const d of analysis.negativeDistortions) negSet.add(d.id);
    this.session.negativeDistortionsIdentified = Array.from(negSet);

    const posSet = new Set(this.session.positiveDistortionsIdentified ?? []);
    for (const d of analysis.positiveDistortions) posSet.add(d.id);
    this.session.positiveDistortionsIdentified = Array.from(posSet);

    const sdbSet = new Set(this.session.selfDefeatingBeliefsIdentified ?? []);
    for (const d of analysis.selfDefeatingBeliefs) sdbSet.add(d.id);
    this.session.selfDefeatingBeliefsIdentified = Array.from(sdbSet);

    const sbSet = new Set(this.session.safetyBehaviorsIdentified ?? []);
    for (const d of analysis.safetyBehaviors) sbSet.add(d.id);
    this.session.safetyBehaviorsIdentified = Array.from(sbSet);
  }
}

/**
 * Portable Markdown Frontmatter Exporter (`YYYYMMDD-[technique]-NN.md`)
 * 100% compatible with `glebis/claude-cognitive-toolkit` & Obsidian
 */
export function exportSessionToMarkdown(
  session: CognitiveToolkitSession,
  sequenceNumber = 1,
): {
  filename: string;
  markdownContent: string;
} {
  const yyyymmdd = session.date.replace(/-/g, '');
  const nn = String(sequenceNumber).padStart(2, '0');
  const filename = `${yyyymmdd}-${session.technique}-${nn}.md`;

  const lines: string[] = [
    '---',
    `type: ${session.type}`,
    `id: ${session.id}`,
    `technique: ${session.technique}`,
    `date: ${session.date}`,
    `time: "${session.time}"`,
    `channel: ${session.channel}`,
    `language: ${session.language}`,
    `pushback_level: ${session.pushbackLevel}`,
    `pre_intensity: ${session.preIntensity}`,
    `post_intensity: ${session.postIntensity ?? 'null'}`,
    `intensity_delta: ${session.intensityDelta ?? 'null'}`,
    `mood_polarity_at_start: ${session.moodPolarityAtStart ?? 0}`,
    `emotions: [${session.emotions.map((e) => `"${e}"`).join(', ')}]`,
    `negative_distortions: [${(session.negativeDistortionsIdentified ?? []).map((d) => `"${d}"`).join(', ')}]`,
    `positive_distortions: [${(session.positiveDistortionsIdentified ?? []).map((d) => `"${d}"`).join(', ')}]`,
    `self_defeating_beliefs: [${(session.selfDefeatingBeliefsIdentified ?? []).map((d) => `"${d}"`).join(', ')}]`,
    `steps_completed: ${session.stepsCompleted}`,
    `steps_skipped: [${session.stepsSkipped.map((s) => `"${s}"`).join(', ')}]`,
    `outcome: ${session.outcome}`,
    `hrv_context: ${session.hrvContext ?? 'none'}`,
    '---',
    '',
    `# Clinical Session: ${session.technique} (${session.date} ${session.time})`,
    '',
    `## Steps Recorded`,
  ];

  for (const [stepSlug, value] of Object.entries(session.structuredStepsPayload)) {
    lines.push(`### ${stepSlug}`);
    lines.push(String(value));
    lines.push('');
  }

  if (session.takeaway) {
    lines.push('## Key Takeaway');
    lines.push(session.takeaway);
    lines.push('');
  }

  return {
    filename,
    markdownContent: lines.join('\n'),
  };
}
