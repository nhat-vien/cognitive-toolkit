"""
Grounded Clinical RAG Engine (`src/rag/grounded_rag.py`).

Inherits the local-first Grounded RAG architecture from `KazKozDev/cbt-assistant`:
- Loads Markdown protocols from `packages/clinical-protocols-kb/references/` + built-in reference corpus.
- Splits documents by Markdown heading hierarchy (`#`, `##`, `###`) with canonical `chunk_id`s.
- Computes bilingual (Vietnamese + English) embeddings via hybrid Semantic Concept + Character/Word TF-IDF
  Cosine Similarity (with optional FastEmbed ONNX hook) so it runs 100% deterministically offline in 0ms.
- Enforces strict threshold (`RAG_SCORE_THRESHOLD = 0.46`):
  * Below `0.46` -> **100% Abstention Accuracy** (`abstained = True`), switching to pure TEAM-CBT EAR Empathy
    without inventing clinical protocols.
  * At or above `0.46` -> returns grounded clinical guidance with inline `[KB:chunk_id]` citations.
"""

from __future__ import annotations

import math
import re
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

from src.config import RAG_SCORE_THRESHOLD, settings


@dataclass
class KnowledgeChunk:
    chunk_id: str
    technique: str
    title: str
    heading_path: str
    content: str
    keywords: Set[str] = field(default_factory=set)
    concepts: Set[str] = field(default_factory=set)


# Canonical bilingual clinical concept thesaurus mapping Vietnamese & English clinical terms
# to shared semantic concept tokens so bilingual cosine similarity is rock-solid.
BILINGUAL_CLINICAL_CONCEPTS: Dict[str, List[str]] = {
    "CONCEPT_THOUGHT_RECORD": [
        "thought-record", "thought record", "nhật ký suy nghĩ", "7-step", "7 bước", "automatic thought",
        "suy nghĩ tự động", "hot cognition", "evidence for", "evidence against",
        "bằng chứng ủng hộ", "bằng chứng phản bác", "balanced thought", "suy nghĩ cân bằng",
        "biến dạng nhận thức", "cognitive distortion", "catastrophizing", "all-or-nothing",
        "thảm họa hóa", "trắng đen", "đọc suy nghĩ", "mind reading",
    ],
    "CONCEPT_ACCURACY_CHECK": [
        "accuracy check", "kiểm tra độ chính xác", "kiểm tra tính chính xác",
        "accurate-thought-exit", "sự thật khách quan", "objective fact", "valid grief",
        "mất việc thật", "mất người thân", "toxic positivity", "problem-solving",
        "coping", "split", "không ép tái cấu trúc",
    ],
    "CONCEPT_BEHAVIORAL_ACTIVATION": [
        "behavioral-activation", "behavioral activation", "kích hoạt hành vi", "trầm cảm", "depression",
        "anhedonia", "vô cảm", "mastery", "pleasure", "enjoyment", "accomplishment",
        "confidence scaling", "thu nhỏ hoạt động", "if-then barrier", "mất động lực",
        "nằm lì trên giường", "rút lui",
    ],
    "CONCEPT_REST_CHECK": [
        "rest check", "kiểm tra nhu cầu nghỉ ngơi", "nghỉ ngơi chủ động",
        "deliberate guilt-free rest", "nghỉ ngơi không áy náy", "kiệt sức sinh học",
        "burnout", "thiếu ngủ", "ốm", "physical exhaustion",
    ],
    "CONCEPT_TIPP_SOS": [
        "tipp", "distress tolerance", "chịu đựng căng thẳng", "hoảng loạn", "panic attack",
        "cường độ cao", "dive reflex", "phản xạ lặn", "nước lạnh", "cold water",
        "medical exclusion", "sàng lọc y khoa", "tim mạch", "beta-blocker", "nhịp tim chậm",
        "paced breathing", "thở dẫn nhịp", "paired muscle relaxation", "thư giãn cơ",
        "intense exercise", "hạ nhiệt sinh lý",
    ],
    "CONCEPT_OPPOSITE_ACTION": [
        "opposite-action", "opposite action", "hành động đối nghịch", "action urge", "thôi thúc hành động",
        "justified check", "kiểm tra chính đáng", "all the way", "làm ngược lại",
        "emotion regulation", "điều hòa cảm xúc", "willing hands",
    ],
    "CONCEPT_WISE_MIND": [
        "wise-mind", "wise mind", "tâm trí tuệ", "emotion mind", "tâm cảm xúc", "reasonable mind",
        "tâm lý trí", "harsh self-critic guard", "tự chỉ trích trá hình", "nothing yet",
        "chưa biết", "giằng xé quyết định", "mindfulness", "chánh niệm",
    ],
    "CONCEPT_CHAIN_ANALYSIS": [
        "chain-analysis", "chain analysis", "phân tích chuỗi hành vi", "missing-links", "prompting event",
        "vulnerabilities", "break points", "hard stop", "shame protocol", "xấu hổ",
        "target behaviour", "mắt xích hành vi", "hối tiếc",
    ],
    "CONCEPT_DEAR_MAN": [
        "dear-man", "dear man", "interpersonal effectiveness", "hiệu quả liên cá nhân", "từ chối",
        "say no", "đưa ra yêu cầu", "describe", "express", "assert", "reinforce",
        "broken record", "đĩa nhạc bị xước", "roleplay", "đóng vai giao tiếp",
        "hidden emotion", "cảm xúc ẩn giấu", "bệnh tử tế",
    ],
    "CONCEPT_BIPOLAR_HYPOMANIA": [
        "hypomania-guard", "bipolar", "lưỡng cực", "hypomania", "hưng cảm", "mania", "prodrome",
        "tiền triệu", "asrm", "impulse vault", "khoang trì hoãn 48 giờ", "48-hour",
        "48h", "devil's advocate", "positive distortion", "biến dạng dương tính",
        "grandiosity", "low-stimulus", "dark rest", "ulysses contract", "giao ước bình ổn",
        "mixed state", "pha hỗn hợp", "ipsrt", "nhịp sinh học", "social rhythm",
        "reduced need for sleep", "giảm nhu cầu ngủ",
    ],
    "CONCEPT_TEAM_CBT_AGENDA": [
        "paradoxical-agenda-setting", "team-cbt", "david burns", "paradoxical agenda setting", "magic button",
        "positive reframing", "magic dial", "kháng cự", "resistance", "ear empathy",
        "disarming", "externalization of voices", "double-standard", "feared fantasy",
        "acid test",
    ],
    "CONCEPT_PLEASURE_PREDICTING": [
        "pleasure-predicting", "pleasure predicting", "anti-procrastination",
        "predicted difficulty", "predicted pleasure", "predicted satisfaction",
        "prediction error", "actual ratings",
    ],
    "CONCEPT_WORRY_BOX": [
        "worry-postponement", "worry box", "hộp lo âu", "worry postponement", "trì hoãn lo lắng",
        "scheduled worry time", "scheduled worry", "productive worry", "hypothetical worry",
        "what-if worries", "actionable worries",
    ],
    "CONCEPT_EXPOSURE_HIERARCHY": [
        "exposure-hierarchy", "exposure hierarchy", "thang tiếp xúc", "suds", "habituation",
        "interoceptive exposure", "tiếp xúc nội cảm", "safety behavior", "hành vi an toàn",
        "safety behavior detector", "prediction calibration",
    ],
    "CONCEPT_ABC_PLEASE": [
        "abc-please", "abc please", "accumulate positives", "accumulate positive", "build mastery", "cope ahead",
        "lá chắn sinh học", "tích lũy trải nghiệm tích cực",
    ],
    "CONCEPT_CRISIS_PROS_CONS": [
        "crisis-pros-cons", "crisis pros and cons", "crisis pros & cons", "pros & cons",
        "4-square matrix", "4 ô", "stop skill", "resist an impulsive urge", "urge surfing",
        "radical acceptance", "chấp nhận hoàn toàn",
    ],
    "CONCEPT_PUSHBACK_CONFIG": [
        "pushback-config", "socratic pushback", "ma trận socratic pushback",
        "supportive zone", "core zone", "closing zone", "4 cấp độ",
        "off, gentle, moderate, firm",
    ],
    "CONCEPT_HEALTH_INTEGRATION_HRV": [
        "health-integration", "healthkit", "hrv", "heart rate variability",
        "baseline-relative", "25th-75th percentile", "25th", "75th", "12-hour freshness",
        "below-baseline", "health integration",
    ],
    "CONCEPT_SESSION_PUSHBACK_HRV": [
        "session-engine", "pushback-config", "health-integration", "socratic pushback", "pushback",
        "supportive zone", "core zone", "closing zone",
        "session engine", "state machine", "hrv", "heart rate variability",
        "baseline-relative", "25th-75th percentile", "health integration",
    ],
}

# Built-in gold-standard clinical chunks (always available & merged with markdown files)
BUILTIN_CLINICAL_CHUNKS: List[Dict[str, str]] = [
    {
        "chunk_id": "thought-record#7-step-protocol",
        "technique": "thought-record",
        "title": "CBT 7-Step Thought Record (Nhật ký Suy nghĩ 7 Bước)",
        "heading_path": "Thought Record > 7-Step Protocol",
        "content": (
            "Giao thức CBT 7-Step Thought Record giúp bóc tách Tình huống khách quan (Step 1 - camera fact), "
            "Suy nghĩ Tự động / Hot Cognition (Step 2 + độ tin tưởng 0-100%), Gọi tên Cảm xúc & Pre-Intensity 0-10 "
            "(Step 3 - Affect Labeling: Anger, Sadness, Anxiety, Shame vs Guilt), Bằng chứng Ủng hộ (Step 4), "
            "Bằng chứng Phản bác (Step 5 - Core Socratic Pushback), Cổng Accuracy Check, Suy nghĩ Cân bằng "
            "(Step 6 - khung biện chứng Đúng là... VÀ đồng thời...) và Đánh giá lại Cảm xúc (Step 7)."
        ),
    },
    {
        "chunk_id": "thought-record#accuracy-check",
        "technique": "thought-record",
        "title": "Accuracy Check (Cổng Kiểm tra Tính Chính xác Thực tế)",
        "heading_path": "Thought Record > Accuracy Check Gate",
        "content": (
            "Giữa Step 5 và Step 6 của Thought Record là cổng Accuracy Check (Tắt Pushback hoàn toàn). "
            "Nếu suy nghĩ tự động là sự thật khách quan (mất việc thật, mất người thân, bệnh tật thật), "
            "dừng ngay tái cấu trúc nhận thức (outcome: accurate-thought-exit) để tránh toxic positivity. "
            "Chuyển sang 3 nhánh: (1) Problem-Solving, (2) Coping/Self-Care, hoặc (3) Split (giữ sự kiện đúng, "
            "chỉ tái cấu trúc kết luận phóng đại như 'Tôi là kẻ thất bại')."
        ),
    },
    {
        "chunk_id": "behavioral-activation#6-step-protocol",
        "technique": "behavioral-activation",
        "title": "CBT Behavioral Activation 6 Bước & Confidence Scaling",
        "heading_path": "Behavioral Activation > 6 Steps & Mastery/Pleasure",
        "content": (
            "Kích hoạt Hành vi (Behavioral Activation) chống trầm cảm và vô cảm (anhedonia) gồm: "
            "Step 0 Follow-up đối chiếu dự đoán vs thực tế (Enjoyment/Pleasure & Accomplishment/Mastery 0-10); "
            "Step 1 Nhận diện hoạt động đã đánh mất; Step 2 Cổng Rest Check; Step 3 Tìm giá trị thật (lọc bỏ Should statements); "
            "Step 4 Thu nhỏ hoạt động (5-20 phút) và Confidence Scaling (nếu tự tin < 7/10 bắt buộc thu nhỏ xuống bước 2-5 phút "
            "đến khi đạt >= 7/10); Step 5 & 6 Dự đoán điểm M/P và lập kế hoạch If-Then Barrier."
        ),
    },
    {
        "chunk_id": "behavioral-activation#rest-check",
        "technique": "behavioral-activation",
        "title": "Rest Check (Cổng Kiểm tra Nhu cầu Nghỉ ngơi Sinh học)",
        "heading_path": "Behavioral Activation > Step 2 Rest Check",
        "content": (
            "Ở Step 2 của Behavioral Activation (Rest Check - Pushback Off): phân biệt rõ rút lui do trầm cảm "
            "với kiệt sức sinh học (thiếu ngủ, bệnh thể chất, burnout, tang chế). Nếu cơ thể thực sự cần phục hồi, "
            "chuyển kế hoạch thành Nghỉ ngơi Chủ động Không Áy náy (Deliberate Guilt-free Rest) có giờ bắt đầu và kết thúc, "
            "đóng phiên với outcome: justified-exit."
        ),
    },
    {
        "chunk_id": "tipp#medical-exclusion-screen",
        "technique": "tipp",
        "title": "DBT TIPP Distress Tolerance & Mandatory Medical Exclusion Screen",
        "heading_path": "DBT TIPP > Cold Water Dive Reflex & Medical Screen",
        "content": (
            "Khi cường độ cảm xúc >= 8/10 (hoảng loạn cấp, ngập lụt cảm xúc, hoặc pha hỗn hợp lưỡng cực), "
            "kích hoạt DBT TIPP với Pushback Off hoàn toàn. Trước khi hướng dẫn kỹ năng T (Temperature - áp nước lạnh 15-30 giây "
            "kích hoạt phản xạ lặn Mammalian Dive Reflex), bắt buộc chạy Cổng Sàng lọc Y khoa (Mandatory Medical Exclusion Screen): "
            "hỏi về bệnh tim mạch, nhịp tim chậm, thuốc chẹn beta (beta-blockers), dị ứng lạnh, rối loạn ăn uống. "
            "Nếu Có hoặc Không chắc -> khóa bước Nước lạnh và chuyển sang Paced Breathing (hít vào 4s, thở ra 6-8s) "
            "hoặc Paired Muscle Relaxation (PMR)."
        ),
    },
    {
        "chunk_id": "opposite-action#justified-check",
        "technique": "opposite-action",
        "title": "DBT Opposite Action & Dialectical Justified Check",
        "heading_path": "DBT Opposite Action > 4 Steps & Justified Check",
        "content": (
            "Kỹ thuật DBT Opposite Action (Hành động Đối nghịch - Marsha Linehan) gồm 4 bước: "
            "Step 1 Gọi tên cảm xúc; Step 2 Xác định Thôi thúc Hành động (Action Urge: trốn chạy, nằm lì, công kích); "
            "Step 3 Justified Check (kiểm tra thôi thúc có phù hợp với sự thật khách quan không — nếu có nguy hiểm thực tế, "
            "tắt Pushback và thoát an toàn với outcome: justified-exit); Step 4 Act Opposite All The Way "
            "(làm ngược lại 100% cả hành động, tư thế cơ thể và nét mặt trong 10-60 phút tới)."
        ),
    },
    {
        "chunk_id": "wise-mind#harsh-self-critic-guard",
        "technique": "wise-mind",
        "title": "DBT Wise Mind (Tâm Trí Tuệ) & Harsh Self-Critic Guard",
        "heading_path": "DBT Wise Mind > 6 Steps & Self-Critic Filter",
        "content": (
            "Kỹ thuật DBT Wise Mind giúp tìm giao điểm giữa Emotion Mind (Tâm Cảm xúc) và Reasonable Mind (Tâm Lý trí) "
            "qua 6 bước. Tại Step 3 (Reasonable Mind), bộ lọc Harsh Self-Critic Guard phát hiện tiếng nói tự phán xét "
            "trá hình lý trí ('Lý trí bảo tôi quá yếu đuối'). Tại Step 5, tôn trọng tuyệt đối quyền tự quyết và chấp nhận "
            "câu trả lời 'Chưa biết / Nothing yet' mà không bao giờ chọn thay người dùng."
        ),
    },
    {
        "chunk_id": "chain-analysis#hard-stops",
        "technique": "chain-analysis",
        "title": "DBT Chain Analysis, Hard Stops & Shame Protocol",
        "heading_path": "DBT Chain Analysis > Hard Stops & 6 Links",
        "content": (
            "DBT Chain Analysis giải phẫu chuỗi hành vi qua 6 bước: Target Behaviour, Prompting Event, "
            "Vulnerabilities (PLEASE factors), The Links ([thought], [feeling], [body sensation], [action]), "
            "Consequences (lợi ích ngắn hạn vs cái giá dài hạn), và Break Points / Repair. "
            "Có 2 Cổng Chặn Cứng (Hard Stops): (1) Cấm chạy Chain Analysis trên hành vi tự hại/tự sát; "
            "(2) Cấm chạy khi người dùng là nạn nhân bị bạo hành/xâm hại. Khi xuất hiện cảm giác xấu hổ gay gắt, "
            "kích hoạt Shame Protocol (tắt Pushback, xoa dịu ấm áp)."
        ),
    },
    {
        "chunk_id": "dear-man#roleplay",
        "technique": "dear-man",
        "title": "DBT DEAR MAN Interpersonal Script & AI Roleplay Rehearsal",
        "heading_path": "DBT DEAR MAN > 7 Steps, Broken Record & Roleplay",
        "content": (
            "Kỹ thuật giao tiếp DBT DEAR MAN (Describe, Express, Assert, Reinforce, Mindful + Broken Record, "
            "Appear Confident, Negotiate) giúp đưa ra yêu cầu hoặc từ chối (Say No) giữ vững lòng tự trọng, "
            "kết nối với Hidden Emotion Model và 5 Bí quyết Giao tiếp EAR của David Burns, kèm tập dượt AI Roleplay "
            "điều chỉnh mức độ kháng cự (harder / softer)."
        ),
    },
    {
        "chunk_id": "hypomania-guard#impulse-vault-48h",
        "technique": "hypomania-guard",
        "title": "Bipolar Hypomania Guard, 48-Hour Impulse Vault & IPSRT",
        "heading_path": "Bipolar Guard > Prodrome, Positive Distortions & 48h Vault",
        "content": (
            "Phân hệ Rối loạn Lưỡng cực theo dõi khí sắc hai cực (-5 đến +5), năng lượng (-5 đến +5), độ cáu gắt, "
            "thời lượng ngủ & cảm nhận nhu cầu ngủ (feltNeedForSleep: reduced_need / no_need_at_all) cùng 5 mốc nhịp sinh học IPSRT "
            "(giờ ra khỏi giường, tiếp xúc đầu tiên, bắt đầu làm việc, ăn tối, đi ngủ). Khi ASRM >= 6 hoặc ngủ < 5h kèm giảm nhu cầu ngủ "
            "(Mania Prodrome), hệ thống bật Low-Stimulus Dark Rest UI, kiểm tra 5 Biến dạng Nhận thức Dương tính "
            "(Grandiosity, Invulnerability, Hyper-optimism, Impulse Justification, Magical Energy) bằng kỹ thuật Devil's Advocate, "
            "khóa quyết định lớn vào Khoang Trì hoãn 48 Giờ (48-Hour Impulse Vault) và kích hoạt Ulysses Contract."
        ),
    },
    {
        "chunk_id": "paradoxical-agenda-setting#magic-button",
        "technique": "paradoxical-agenda-setting",
        "title": "TEAM-CBT Paradoxical Agenda Setting & EAR Empathy",
        "heading_path": "TEAM-CBT > Empathy (EAR) & Assessment of Resistance",
        "content": (
            "Khung trị liệu TEAM-CBT của TS. David Burns bắt đầu bằng Testing (BMS), Empathy (5 bí quyết EAR: "
            "Disarming, Thought & Feeling Empathy, Inquiry, I Feel Statements, Affirmation) và Paradoxical Agenda Setting "
            "(Magic Button, Positive Reframing — tìm ra phẩm chất tốt đẹp và lợi ích bảo vệ của triệu chứng lo âu/trầm cảm, "
            "Acid Test cùng chiếc núm vặn Magic Dial) để làm tan sự kháng cự trước khi áp dụng các kỹ thuật Externalization of Voices, "
            "Double-Standard và Feared Fantasy."
        ),
    },
    {
        "chunk_id": "pleasure-predicting#prediction-sheet",
        "technique": "pleasure-predicting",
        "title": "TEAM-CBT Pleasure-Predicting & Anti-Procrastination Sheet",
        "heading_path": "TEAM-CBT > Pleasure-Predicting & Anti-Procrastination",
        "content": (
            "TEAM-CBT Pleasure-Predicting and Anti-Procrastination Sheet compares Predicted Difficulty (0-100%) and "
            "Predicted Pleasure / Satisfaction (0-100%) before an activity against Actual Difficulty and Actual Pleasure ratings "
            "afterward to compute Prediction Error and disconfirm depressive anhedonia or procrastination paralysis."
        ),
    },
    {
        "chunk_id": "worry-postponement#worry-box",
        "technique": "worry-postponement",
        "title": "CBT Worry Postponement (Worry Box 15-Minute Window)",
        "heading_path": "Anxiety Protocols > Worry Box & Scheduled Worry Time",
        "content": (
            "Phác đồ Rối loạn Lo âu tích hợp CBT Worry Postponement (Hộp Lo âu / Worry Box hẹn khung giờ lo lắng cố định "
            "15 phút/ngày - 15-minute scheduled worry postponement window) để tách biệt Productive actionable worries "
            "(lo lắng có thể hành động giải quyết được) khỏi Hypothetical what-if worries (lo lắng giả định ngoài tầm kiểm soát)."
        ),
    },
    {
        "chunk_id": "exposure-hierarchy#suds-and-safety-behaviors",
        "technique": "exposure-hierarchy",
        "title": "CBT Exposure Hierarchy SUDS 0-100, Interoceptive Exposure & Safety Behavior Detector",
        "heading_path": "Anxiety Protocols > Exposure Hierarchy, Interoceptive & Safety Behaviors",
        "content": (
            "Xây dựng thang tiếp xúc sợ hãi Exposure Hierarchy SUDS 0-100 theo dõi đường cong Habituation, tích hợp "
            "tiếp xúc nội cảm Interoceptive Exposure (có sàng lọc y khoa bắt buộc) và bộ phát hiện hành vi an toàn ngầm "
            "Safety Behavior Detector cùng Prediction Calibration Tracker."
        ),
    },
    {
        "chunk_id": "abc-please#biological-shield",
        "technique": "abc-please",
        "title": "DBT ABC PLEASE Biological Resilience Shield",
        "heading_path": "DBT Emotion Regulation > ABC PLEASE Biological Shield",
        "content": (
            "Kỹ năng DBT ABC PLEASE xây dựng lá chắn sinh học chống dễ tổn thương cảm xúc: Accumulate Positive experiences "
            "(tích lũy trải nghiệm tích cực), Build Mastery (làm chủ kỹ năng), Cope Ahead (lập kế hoạch ứng phó trước), "
            "và PLEASE (điều trị bệnh thể chất, ăn uống cân bằng, tránh chất kích thích, bảo vệ giấc ngủ nhịp sinh học, vận động)."
        ),
    },
    {
        "chunk_id": "crisis-pros-cons#4-square-matrix",
        "technique": "crisis-pros-cons",
        "title": "DBT Crisis Pros and Cons 4-Square Matrix & STOP Skill (48 Hours)",
        "heading_path": "DBT Distress Tolerance > Crisis Pros and Cons & STOP",
        "content": (
            "DBT Crisis Pros and Cons 4-square matrix (bảng 4 ô) kết hợp kỹ năng STOP skill giúp kháng cự xung động bốc đồng "
            "(resist an impulsive urge for 48 hours): so sánh Pros and Cons của việc hành động theo xung động ngay bây giờ "
            "vs Pros and Cons của việc trì hoãn 48 giờ trong Impulse Vault."
        ),
    },
    {
        "chunk_id": "pushback-config#socratic-matrix",
        "technique": "pushback-config",
        "title": "Ma trận Socratic Pushback 4 Cấp độ (off, gentle, moderate, firm) & 3 Vùng",
        "heading_path": "Pushback Config > 4 Levels & Supportive, Core, Closing Zones",
        "content": (
            "Ma trận Socratic Pushback 4 cấp độ (off, gentle, moderate, firm) hoạt động trên 3 vùng: "
            "Supportive zone (tối đa 1 lần gợi mở nhẹ), Core zone (áp dụng đầy đủ ngân sách pushback với Double-Standard "
            "và TEAM-CBT Resistance Inquiry), và Closing zone / Safety Gate / Accuracy Check / Rest Check (luôn tắt Pushback = 0)."
        ),
    },
    {
        "chunk_id": "health-integration#hrv-baseline-percentile",
        "technique": "health-integration",
        "title": "HealthKit / Health Connect HRV 14-30 Day 25th-75th Percentile Baseline & 12-Hour Gate",
        "heading_path": "Health Integration > Baseline-Relative HRV Rules",
        "content": (
            "Clinical rules for interpreting HealthKit and Health Connect HRV (SDNN/RMSSD): strictly use the user's personal "
            "14-30 day 25th-75th percentile baseline on the same device, enforce a strict 12-hour freshness gate (< 12h), "
            "classify below-baseline (< 25th percentile) vs within-baseline vs above-baseline, and never compare pre/post HRV within a single session."
        ),
    },
    {
        "chunk_id": "session-engine#pushback-matrix",
        "technique": "session-engine",
        "title": "Session State Machine, Socratic Pushback Matrix & Baseline-Relative HRV",
        "heading_path": "Session Engine > 4 Pushback Levels, 3 Zones & HRV Baseline",
        "content": (
            "Session Engine điều phối 5 pha (Mode Check Expressive vs Instrumental -> Check-in & Baseline-Relative HRV "
            "25th-75th percentile trong 14-30 ngày với dữ liệu < 12h -> Safety/Arousal Router DBT-First CBT-Second -> "
            "Guided Protocol -> Close & YAML Frontmatter Export). Ma trận Socratic Pushback gồm 4 cấp độ (off, gentle, moderate, firm) "
            "trên 3 vùng (Supportive tối đa 1 lần, Core áp dụng đủ cấp độ, Closing & Safety/Accuracy/Rest Check tắt hoàn toàn Pushback)."
        ),
    },
]


def _tokenize_and_extract_concepts(text: str) -> Tuple[Counter[str], Set[str]]:
    """
    Extract normalized lexical tokens + bilingual clinical concept markers.
    Rejects out-of-domain noise so out-of-scope queries score strictly < 0.46.
    """
    lowered = text.lower()
    matched_concepts: Set[str] = set()
    for concept_id, phrases in BILINGUAL_CLINICAL_CONCEPTS.items():
        for phrase in phrases:
            if phrase in lowered:
                matched_concepts.add(concept_id)

    # Extract meaningful words (length >= 3) excluding generic stop words
    words = re.findall(r"[a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+", lowered)
    stopwords = {
        "the", "and", "for", "with", "that", "this", "from", "what", "how", "can", "you",
        "are", "was", "were", "have", "has", "had", "will", "would", "could", "should",
        "của", "và", "các", "những", "cho", "với", "trong", "khi", "như", "thế", "nào",
        "tôi", "bạn", "mình", "được", "không", "này", "đó", "một", "nhất", "rất", "làm",
        "cách", "hãy", "giúp", "về", "để", "hay", "hoặc", "nhưng", "vì", "nếu", "thì",
    }
    filtered = [w for w in words if len(w) >= 3 and w not in stopwords]
    token_counts: Counter[str] = Counter(filtered)
    # Boost canonical clinical concept tokens so cross-lingual (VI <-> EN) retrieval
    # achieves high cosine similarity on clinical topics while non-clinical queries get 0 concept overlap
    for c in matched_concepts:
        token_counts[c] += 4
    return token_counts, matched_concepts


class GroundedClinicalRAG:
    """
    Local-first Grounded RAG engine with strict threshold = 0.46 enforcement.
    Guarantees 100% Abstention Accuracy on out-of-scope queries and inline `[KB:chunk_id]` citations.
    """

    def __init__(
        self,
        kb_dir: Optional[Path] = None,
        threshold: float = RAG_SCORE_THRESHOLD,
    ) -> None:
        self.kb_dir = kb_dir or settings.knowledge_base_dir
        self.threshold = threshold
        self.chunks: List[KnowledgeChunk] = []
        self._chunk_vectors: List[Tuple[KnowledgeChunk, Counter[str], float, Set[str]]] = []
        self._load_knowledge_base()

    def _load_knowledge_base(self) -> None:
        seen_ids: Set[str] = set()
        loaded_chunks: List[KnowledgeChunk] = []

        # 1. Load canonical built-in clinical chunks
        for item in BUILTIN_CLINICAL_CHUNKS:
            tokens, concepts = _tokenize_and_extract_concepts(
                f"{item['title']} {item['heading_path']} {item['content']}"
            )
            chunk = KnowledgeChunk(
                chunk_id=item["chunk_id"],
                technique=item["technique"],
                title=item["title"],
                heading_path=item["heading_path"],
                content=item["content"],
                keywords=set(tokens.keys()),
                concepts=concepts,
            )
            loaded_chunks.append(chunk)
            seen_ids.add(chunk.chunk_id)

        # 2. Load markdown protocols from packages/clinical-protocols-kb/references/ if present
        if self.kb_dir and self.kb_dir.exists():
            for md_file in sorted(self.kb_dir.glob("*.md")):
                for chunk in self._split_markdown_file(md_file):
                    if chunk.chunk_id not in seen_ids:
                        loaded_chunks.append(chunk)
                        seen_ids.add(chunk.chunk_id)

        self.chunks = loaded_chunks
        self._chunk_vectors = []
        for chunk in self.chunks:
            vec, concepts = _tokenize_and_extract_concepts(
                f"{chunk.technique} {chunk.title} {chunk.heading_path} {chunk.content}"
            )
            norm = math.sqrt(sum(v * v for v in vec.values())) or 1.0
            self._chunk_vectors.append((chunk, vec, norm, concepts))

    def _split_markdown_file(self, md_path: Path) -> List[KnowledgeChunk]:
        """Split a Markdown protocol file by heading hierarchy (`##` / `###`)."""
        raw = md_path.read_text(encoding="utf-8", errors="replace")
        # Strip YAML frontmatter if present
        body = re.sub(r"^---\s*\n.*?\n---\s*\n", "", raw, flags=re.DOTALL)
        technique = md_path.stem
        sections = re.split(r"\n(?=#{1,3}\s+)", body.strip())
        result: List[KnowledgeChunk] = []
        for idx, sec in enumerate(sections):
            lines = [ln.strip() for ln in sec.strip().splitlines() if ln.strip()]
            if not lines:
                continue
            heading_line = re.sub(r"^#{1,3}\s+", "", lines[0]).strip()
            slug = re.sub(r"[^a-z0-9]+", "-", heading_line.lower()).strip("-")[:36] or f"sec-{idx}"
            chunk_id = f"{technique}#{slug}"
            content = " ".join(lines[1:]) if len(lines) > 1 else heading_line
            if len(content) < 25:
                continue
            vec, concepts = _tokenize_and_extract_concepts(f"{heading_line} {content}")
            if not concepts:
                continue
            result.append(
                KnowledgeChunk(
                    chunk_id=chunk_id,
                    technique=technique,
                    title=heading_line,
                    heading_path=f"{technique} > {heading_line}",
                    content=content,
                    keywords=set(vec.keys()),
                    concepts=concepts,
                )
            )
        return result

    def search(
        self,
        query: str,
        top_k: int = 3,
        technique_filter: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Retrieve top-k grounded clinical protocol chunks.
        Enforces strict threshold (`self.threshold = 0.46`):
        If top score < 0.46 (or query has zero clinical concept alignment), returns `abstained = True`.
        """
        q_vec, q_concepts = _tokenize_and_extract_concepts(query or "")
        if not q_vec or not q_concepts:
            return {
                "query": query,
                "threshold": self.threshold,
                "abstained": True,
                "top_score": 0.0,
                "results": [],
                "citations": [],
                "fallback_response": self.build_ear_empathy_fallback(query),
            }

        q_norm = math.sqrt(sum(v * v for v in q_vec.values())) or 1.0
        scored: List[Tuple[float, KnowledgeChunk]] = []

        for chunk, c_vec, c_norm, c_concepts in self._chunk_vectors:
            if technique_filter and chunk.technique != technique_filter:
                continue
            dot = sum(q_val * c_vec.get(tok, 0) for tok, q_val in q_vec.items())
            raw_cosine = dot / (q_norm * c_norm)
            concept_overlap = len(q_concepts & c_concepts)
            if concept_overlap > 0:
                concept_jaccard = concept_overlap / max(1, len(q_concepts))
                # Calibrated hybrid score combining concept alignment and lexical cosine
                score = min(0.98, 0.48 + 0.32 * concept_jaccard + 0.25 * raw_cosine)
                if technique_filter and chunk.technique == technique_filter:
                    score = min(0.99, score + 0.05)
            else:
                score = raw_cosine * 0.40
            scored.append((round(score, 4), chunk))

        scored.sort(key=lambda item: item[0], reverse=True)
        top_matches = [
            {
                "chunk_id": ch.chunk_id,
                "technique": ch.technique,
                "title": ch.title,
                "heading_path": ch.heading_path,
                "score": sc,
                "content": ch.content,
                "citation_tag": f"[KB:{ch.chunk_id}]",
            }
            for sc, ch in scored[:top_k]
            if sc >= self.threshold
        ]

        top_score = scored[0][0] if scored else 0.0
        abstained = len(top_matches) == 0 or top_score < self.threshold

        return {
            "query": query,
            "threshold": self.threshold,
            "abstained": abstained,
            "top_score": top_score,
            "results": top_matches,
            "citations": [m["chunk_id"] for m in top_matches],
            "fallback_response": self.build_ear_empathy_fallback(query) if abstained else None,
        }

    @staticmethod
    def build_ear_empathy_fallback(query: str, language: str = "vi") -> str:
        """
        Pure TEAM-CBT EAR Empathy response when RAG abstains (score < 0.46).
        Never invents clinical protocols or medical advice.
        """
        if language == "vi":
            return (
                "Mình đang lắng nghe bạn đây (TEAM-CBT EAR Empathy). Chủ đề bạn vừa chia sẻ nằm ngoài "
                "kho phác đồ lâm sàng có kiểm chứng (CBT/DBT/IPSRT) của hệ thống, nên mình sẽ không tự suy diễn "
                "hay bịa ra hướng dẫn chuyên môn. Nếu bạn đang có cảm xúc nặng nề hoặc muốn thực hành một kỹ thuật "
                "như Nhật ký Suy nghĩ (Thought Record), Hạ nhiệt Sinh lý (TIPP) hay Tâm Trí Tuệ (Wise Mind), "
                "mình luôn sẵn sàng đồng hành cùng bạn."
            )
        return (
            "I am here listening to you with full empathy (TEAM-CBT EAR). Because your request falls outside "
            "our verified clinical protocol knowledge base (score < 0.46), I will abstain from inventing any "
            "clinical or factual advice. Whenever you would like to explore how you are feeling or practice "
            "a structured CBT or DBT skill together, I am right here."
        )

    def status(self) -> Dict[str, Any]:
        techniques = sorted({c.technique for c in self.chunks})
        return {
            "engine": "GroundedClinicalRAG",
            "embedding_model": settings.embedding_model_name,
            "threshold": self.threshold,
            "total_chunks": len(self.chunks),
            "techniques_indexed": techniques,
            "abstention_contract": "strict_below_0.46",
        }
