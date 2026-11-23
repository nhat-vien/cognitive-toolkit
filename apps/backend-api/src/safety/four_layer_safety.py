"""
4-Layer Clinical Safety Gate (`src/safety/four_layer_safety.py`).

Implements:
- Layer 1: Deterministic Crisis & Suicide/Self-Harm Regex/Keyword matcher (Vietnamese & English),
           plus Chain Analysis Hard Stops (self-harm or victimization).
- Layer 2: Contextual Severity & Clinical Assessment Gate (BMS Suicide >= 1, PHQ-9 Q9 > 0,
           ASRM >= 6, Mixed State `Mood <= -2 & Energy >= +2`, Acute Arousal `Intensity >= 8`).
- Layer 3: Real-world Danger / Domestic Abuse detector (switches off cognitive restructuring,
           never treats valid fear as a cognitive distortion -> `justified-exit`).
- Layer 4: Output Guardrail (prevents medication dosage/discontinuation advice, prevents
           clinical diagnosing, enforces `[KB:chunk_id]` citation or pure EAR empathy).
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


# ---------------------------------------------------------------------------
# LAYER 1 PATTERNS: SUICIDE / SELF-HARM / ACUTE PSYCHOSIS (VI + EN)
# ---------------------------------------------------------------------------
SUICIDE_SELF_HARM_PATTERNS = [
    r"\b(tự\s*tử|tự\s*sát|muốn\s*chết|kết\s*liễu|không\s*muốn\s*sống\s*nữa|chấm\s*dứt\s*cuộc\s*đời)\b",
    r"\b(rạch\s*tay|cắt\s*tay|tự\s*hại|tự\s*làm\s*đau|uống\s*thuốc\s*quá\s*liều|nhảy\s*lầu|nhảy\s*cầu)\b",
    r"\b(kill\s*myself|end\s*my\s*life|commit\s*suicide|suicidal|want\s*to\s*die|better\s*off\s*dead)\b",
    r"\b(cut\s*myself|self[\s\-]*harm|hurt\s*myself|overdose\s*on\s*pills|hang\s*myself)\b",
]

PSYCHOSIS_MANIA_EMERGENCY_PATTERNS = [
    r"\b(nghe\s*thấy\s*tiếng\s*nói\s*ra\s*lệnh|có\s*người\s*theo\s*dõi\s*giết\s*tôi|tôi\s*là\s*chúa\s*trời)\b",
    r"\b(command\s*hallucinations|voices\s*telling\s*me\s*to\s*hurt|i\s*am\s*immortal\s*god)\b",
]

# ---------------------------------------------------------------------------
# LAYER 3 PATTERNS: REAL-WORLD DANGER / DOMESTIC ABUSE / VICTIMIZATION (VI + EN)
# ---------------------------------------------------------------------------
REAL_WORLD_DANGER_PATTERNS = [
    r"\b(bạo\s*hành|bạo\s*lực\s*gia\s*đình|đánh\s*đập\s*tôi|đe\s*dọa\s*giết|chồng\s*đánh|bạn\s*trai\s*đánh)\b",
    r"\b(bị\s*xâm\s*hại|bị\s*cưỡng\s*bức|bị\s*bắt\s*cóc|không\s*an\s*toàn\s*trong\s*nhà)\b",
    r"\b(domestic\s*violence|domestic\s*abuse|hitting\s*me|beating\s*me|threatening\s*to\s*kill\s*me)\b",
    r"\b(physically\s*unsafe|partner\s*choked\s*me|abusing\s*me|stalking\s*me|sexually\s*assaulted)\b",
]

# ---------------------------------------------------------------------------
# LAYER 4 PATTERNS: OUTPUT GUARDRAIL (MEDICATION DOSAGE & DIAGNOSIS)
# ---------------------------------------------------------------------------
UNSAFE_MEDICATION_ADVICE_PATTERNS = [
    r"\b(stop\s*taking\s*your\s*lithium|increase\s*your\s*dosage\s*to|double\s*your\s*dose\s*of)\b",
    r"\b(ngưng\s*uống\s*lithium\s*ngay|tự\s*tăng\s*liều\s*thuốc\s*lên|bỏ\s*thuốc\s*ổn\s*định\s*khí\s*sắc)\b",
]

UNSAFE_DIAGNOSIS_PATTERNS = [
    r"\b(i\s*officially\s*diagnose\s*you\s*with|chẩn\s*đoán\s*chính\s*thức\s*bạn\s*mắc\s*bệnh)\b",
]

EMERGENCY_HOTLINES = {
    "vi": [
        "115 (Cấp cứu Y tế Khẩn cấp toàn quốc)",
        "1900 1267 (Viện Sức khỏe Tâm thần - BV Bạch Mai)",
        "028 3923 4675 (BV Tâm thần TP.HCM)",
        "111 (Tổng đài Quốc gia Bảo vệ Trẻ em & Phòng chống Bạo lực)",
    ],
    "en": [
        "988 (Suicide & Crisis Lifeline - US/Canada)",
        "112 / 999 (Emergency Medical Services - EU/UK)",
        "Text HOME to 741741 (Crisis Text Line)",
    ],
}


@dataclass
class SafetyEvaluationResult:
    safe_to_proceed_cbt: bool
    triggered_layer: Optional[int]
    action: str  # 'proceed' | 'safety-stop' | 'route-tipp' | 'justified-exit' | 'chain-hard-stop' | 'hypomania-guard'
    outcome: str  # 'in-progress' | 'safety-stop' | 'justified-exit' | 'stopped-early'
    severity: str  # 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' (legacy internal compatibility; never presented as low clinical risk)
    force_pushback_off: bool
    recommended_technique: Optional[str]
    ui_mode: str  # 'standard' | 'sos-portal' | 'low-energy-depression' | 'low-stimulus-mania'
    crisis_message: Optional[str] = None
    hotlines: List[str] = field(default_factory=list)
    notify_trusted_contacts: bool = False
    reasons: List[str] = field(default_factory=list)
    pathway_state: str = "routine_support"  # Master Plan §2.3: routine_support | distress_support | professional_follow_up_recommended | urgent_human_support | emergency_guidance
    claims_user_is_low_risk: bool = False  # Master Plan §2.3 & §8.2: Never claim a user is "low risk" merely because no warning fired


class FourLayerSafetyGate:
    """
    Executes the 4-Layer Safety & Clinical Routing Gate before and after every turn.
    """

    def evaluate_input(
        self,
        text: str,
        language: str = "vi",
        intensity: int = 5,
        mood_polarity: int = 0,
        energy_level: int = 0,
        bms_suicide_score: int = 0,
        phq9_item9_score: int = 0,
        asrm_score: int = 0,
        requested_technique: Optional[str] = None,
    ) -> SafetyEvaluationResult:
        normalized = (text or "").lower()
        lang_key = "vi" if language == "vi" else "en"

        # ---------------------------------------------------------------------
        # LAYER 1: Deterministic Crisis & Suicide/Self-Harm Regex Matcher
        # ---------------------------------------------------------------------
        for pattern in SUICIDE_SELF_HARM_PATTERNS:
            if re.search(pattern, normalized, flags=re.IGNORECASE):
                # Special check: if user requested Chain Analysis on self-harm -> Hard Stop 1 & Safety Stop
                reasons = ["layer1_suicide_or_self_harm_keyword"]
                if requested_technique == "chain-analysis":
                    reasons.append("chain_analysis_hard_stop_1_self_harm")
                return SafetyEvaluationResult(
                    safe_to_proceed_cbt=False,
                    triggered_layer=1,
                    action="safety-stop",
                    outcome="safety-stop",
                    severity="CRITICAL",
                    force_pushback_off=True,
                    recommended_technique=None,
                    ui_mode="sos-portal",
                    crisis_message=self._build_crisis_message(lang_key),
                    hotlines=EMERGENCY_HOTLINES[lang_key],
                    notify_trusted_contacts=True,
                    reasons=reasons,
                )

        for pattern in PSYCHOSIS_MANIA_EMERGENCY_PATTERNS:
            if re.search(pattern, normalized, flags=re.IGNORECASE):
                return SafetyEvaluationResult(
                    safe_to_proceed_cbt=False,
                    triggered_layer=1,
                    action="safety-stop",
                    outcome="safety-stop",
                    severity="CRITICAL",
                    force_pushback_off=True,
                    recommended_technique=None,
                    ui_mode="sos-portal",
                    crisis_message=self._build_crisis_message(lang_key),
                    hotlines=EMERGENCY_HOTLINES[lang_key],
                    notify_trusted_contacts=True,
                    reasons=["layer1_acute_psychosis_or_command_hallucination"],
                )

        # ---------------------------------------------------------------------
        # LAYER 2: Contextual Severity & Clinical Assessment Cutoffs
        # ---------------------------------------------------------------------
        if bms_suicide_score >= 1 or phq9_item9_score > 0:
            return SafetyEvaluationResult(
                safe_to_proceed_cbt=False,
                triggered_layer=2,
                action="safety-stop",
                outcome="safety-stop",
                severity="CRITICAL",
                force_pushback_off=True,
                recommended_technique=None,
                ui_mode="sos-portal",
                crisis_message=self._build_crisis_message(lang_key),
                hotlines=EMERGENCY_HOTLINES[lang_key],
                notify_trusted_contacts=True,
                reasons=["layer2_clinical_assessment_suicide_cutoff"],
            )

        # Layer 2B: Bipolar Mixed State (Mood <= -2 AND Energy >= +2) -> highest clinical risk
        if mood_polarity <= -2 and energy_level >= 2:
            return SafetyEvaluationResult(
                safe_to_proceed_cbt=False,
                triggered_layer=2,
                action="route-tipp",
                outcome="in-progress",
                severity="HIGH",
                force_pushback_off=True,
                recommended_technique="tipp",
                ui_mode="sos-portal",
                crisis_message=self._build_mixed_state_message(lang_key),
                hotlines=EMERGENCY_HOTLINES[lang_key],
                notify_trusted_contacts=True,
                reasons=["layer2_bipolar_mixed_state_dysphoric_arousal"],
            )

        # ---------------------------------------------------------------------
        # LAYER 3: Real-World Danger / Domestic Abuse / Victimization
        # ---------------------------------------------------------------------
        for pattern in REAL_WORLD_DANGER_PATTERNS:
            if re.search(pattern, normalized, flags=re.IGNORECASE):
                reasons = ["layer3_real_world_danger_or_abuse"]
                action = "justified-exit"
                if requested_technique == "chain-analysis":
                    reasons.append("chain_analysis_hard_stop_2_victimization")
                    action = "chain-hard-stop"
                return SafetyEvaluationResult(
                    safe_to_proceed_cbt=False,
                    triggered_layer=3,
                    action=action,
                    outcome="justified-exit",
                    severity="HIGH",
                    force_pushback_off=True,
                    recommended_technique=None,
                    ui_mode="standard",
                    crisis_message=self._build_real_world_danger_message(lang_key),
                    hotlines=EMERGENCY_HOTLINES[lang_key],
                    notify_trusted_contacts=False,
                    reasons=reasons,
                )

        # Layer 2C: Acute Physiological Arousal (Intensity >= 8/10) -> DBT-First (TIPP)
        if intensity >= 8:
            return SafetyEvaluationResult(
                safe_to_proceed_cbt=False,
                triggered_layer=2,
                action="route-tipp",
                outcome="in-progress",
                severity="HIGH",
                force_pushback_off=True,
                recommended_technique="tipp",
                ui_mode="sos-portal",
                crisis_message=None,
                hotlines=[],
                notify_trusted_contacts=False,
                reasons=["layer2_high_physiological_arousal_dbt_first"],
            )

        # Layer 2D: Hypomania / Mania Guard (ASRM >= 6 or Mood Polarity >= +2)
        if asrm_score >= 6 or mood_polarity >= 2:
            return SafetyEvaluationResult(
                safe_to_proceed_cbt=True,
                triggered_layer=2,
                action="hypomania-guard",
                outcome="in-progress",
                severity="MODERATE",
                force_pushback_off=False,
                recommended_technique="hypomania-guard",
                ui_mode="low-stimulus-mania",
                crisis_message=None,
                hotlines=[],
                notify_trusted_contacts=mood_polarity >= 3 or asrm_score >= 6,
                reasons=["layer2_hypomania_guard_triggered"],
            )

        # Low-Energy Depression UI adaptation (Mood Polarity <= -3)
        ui_mode = "low-energy-depression" if mood_polarity <= -3 else "standard"
        return SafetyEvaluationResult(
            safe_to_proceed_cbt=True,
            triggered_layer=None,
            action="proceed",
            outcome="in-progress",
            severity="LOW",
            force_pushback_off=False,
            recommended_technique=requested_technique,
            ui_mode=ui_mode,
            reasons=[],
        )

    def enforce_layer4_output_guardrail(
        self,
        response_text: str,
        citations: List[str],
        abstained: bool,
        language: str = "vi",
    ) -> Dict[str, Any]:
        """
        Layer 4 Output Guardrail:
        1. Blocks any medication dosage change / discontinuation advice.
        2. Blocks any clinical diagnosis claims.
        3. Ensures `[KB:chunk_id]` inline citation is present when not abstained,
           or pure EAR empathy without invented protocol steps when abstained.
        """
        sanitized = response_text
        guardrail_interventions: List[str] = []

        for pattern in UNSAFE_MEDICATION_ADVICE_PATTERNS:
            if re.search(pattern, sanitized, flags=re.IGNORECASE):
                guardrail_interventions.append("blocked_unsafe_medication_advice")
                sanitized = (
                    "Lưu ý An toàn Y khoa: Ứng dụng không đưa ra lời khuyên thay đổi liều lượng "
                    "hoặc ngưng thuốc (đặc biệt là thuốc ổn định khí sắc). Vui lòng tham khảo trực tiếp "
                    "bác sĩ tâm thần điều trị của bạn."
                    if language == "vi"
                    else "Medical Safety Notice: This application never advises changing dosages or "
                    "discontinuing psychiatric medications. Please consult your prescribing psychiatrist."
                )

        for pattern in UNSAFE_DIAGNOSIS_PATTERNS:
            if re.search(pattern, sanitized, flags=re.IGNORECASE):
                guardrail_interventions.append("blocked_unauthorized_diagnosis")
                sanitized = re.sub(
                    pattern,
                    "công cụ tự theo dõi gợi ý" if language == "vi" else "self-monitoring suggests",
                    sanitized,
                    flags=re.IGNORECASE,
                )

        if not abstained and citations:
            missing_tags = [c for c in citations if f"[KB:{c}]" not in sanitized]
            if missing_tags:
                citation_footer = " ".join(f"[KB:{c}]" for c in citations)
                sanitized = f"{sanitized.rstrip()} {citation_footer}"
                guardrail_interventions.append("appended_required_kb_citations")

        return {
            "text": sanitized,
            "citations": [] if abstained else citations,
            "abstained": abstained,
            "guardrail_interventions": guardrail_interventions,
        }

    @staticmethod
    def _build_crisis_message(lang: str) -> str:
        if lang == "vi":
            return (
                "Mình nghe thấy bạn đang trải qua nỗi đau và sự kiệt sức vô cùng lớn ngay lúc này. "
                "Sự an toàn của bạn là điều quan trọng nhất — chúng ta sẽ dừng toàn bộ bài tập nhận thức tại đây. "
                "Bạn không phải đi qua khoảnh khắc này một mình. Hãy kết nối ngay với đường dây hỗ trợ khẩn cấp "
                "hoặc người thân trong Kế hoạch An toàn (Ulysses Contract) của bạn:"
            )
        return (
            "I hear how much pain and exhaustion you are carrying right now. "
            "Your safety comes first — we are pausing all cognitive exercises right here. "
            "You do not have to carry this alone. Please reach out immediately to an emergency crisis line "
            "or a trusted person from your safety plan:"
        )

    @staticmethod
    def _build_mixed_state_message(lang: str) -> str:
        if lang == "vi":
            return (
                "Cảnh báo Pha Hỗn hợp (Khí sắc trầm cảm đi kèm năng lượng kích động cao): "
                "Đây là trạng thái hệ thần kinh đang chịu áp lực rất lớn. Chúng ta sẽ không phân tích suy nghĩ lúc này "
                "mà ưu tiên hạ nhiệt sinh lý ngay bằng kỹ năng DBT TIPP và liên hệ bác sĩ điều trị."
            )
        return (
            "Mixed State Alert (Depressed mood combined with high agitated energy): "
            "Your nervous system is under intense strain. We are bypassing cognitive analysis and routing "
            "directly to DBT TIPP physiological cooling and clinician notification."
        )

    @staticmethod
    def _build_real_world_danger_message(lang: str) -> str:
        if lang == "vi":
            return (
                "Nỗi sợ và mong muốn tự bảo vệ của bạn là hoàn toàn có căn cứ thực tế — đây KHÔNG phải là "
                "biến dạng nhận thức và chúng ta tuyệt đối không phân tích hay đổ lỗi cho chuỗi hành vi của bạn. "
                "Ưu tiên duy nhất lúc này là sự an toàn thể chất của bạn (rời khỏi khu vực nguy hiểm, gọi người hỗ trợ hoặc đường dây nóng 111/113)."
            )
        return (
            "Your fear and urge to protect yourself are completely justified by real-world danger — this is NOT "
            "a cognitive distortion, and we will never run cognitive restructuring or blame analysis on victimization. "
            "Your physical safety is the only priority right now."
        )
