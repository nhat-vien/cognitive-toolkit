"""
Multi-Agent Clinical Orchestrator (`src/orchestrator/multi_agent_orchestrator.py`).

Coordinates:
1. Safety Agent (4-Layer Safety Gate + Hash-Chained Audit Log + Transactional Outbox)
2. Empathy EAR Agent (TEAM-CBT 5 Secrets of Effective Communication; Expressive vs. Instrumental mode)
3. CBT/DBT Protocol State Machine Agent:
   - Socratic Pushback Controller (Levels 0-3: `off`, `gentle`, `moderate`, `firm` across `Supportive`, `Core`, `Closing` zones)
   - Clinical Safety Gates: `Accuracy Check`, `Rest Check`, `Justified Check`, `TIPP Medical Exclusion Screen`, `Chain Analysis Hard Stops & Shame Protocol`
   - Persistent session checkpointing via `ClinicalDatabase` (replaces Solace-AI's broken `InMemorySaver`)
4. Bipolar Prodrome, Mixed State, IPSRT & 48-Hour Impulse Vault Agent + Clinical Assessment Scorer (`BMS`, `PHQ-9`, `GAD-7`, `ASRM`, `MDQ`, `ISI`)
"""

from __future__ import annotations

import json
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from src.config import settings
from src.db.models_and_rls import ClinicalDatabase
from src.rag.grounded_rag import GroundedClinicalRAG
from src.safety.four_layer_safety import FourLayerSafetyGate


PUSHBACK_BUDGET_BY_LEVEL: Dict[str, int] = {
    "off": 0,
    "gentle": 1,
    "moderate": 2,
    "firm": 3,
}

# Step definitions and Pushback Zones for the core CBT & DBT protocols
PROTOCOL_STEPS: Dict[str, List[Dict[str, str]]] = {
    "thought-record": [
        {"step": "1", "name": "Situation (Tình huống khách quan)", "zone": "Supportive", "prompt": "Hãy mô tả tình huống khách quan như những gì một chiếc máy quay ghi lại được."},
        {"step": "2", "name": "Automatic Thought (Suy nghĩ tự động)", "zone": "Supportive", "prompt": "Suy nghĩ tự động đầu tiên thoáng qua đầu bạn lúc đó là gì (và mức độ tin tưởng 0-100%)?"},
        {"step": "3", "name": "Emotion & Pre-Intensity (Cảm xúc & Cường độ 0-10)", "zone": "Supportive", "prompt": "Bạn gọi tên cảm xúc chính là gì (Lo âu, Buồn bã, Giận dữ, Xấu hổ, Tội lỗi) và cường độ từ 0-10?"},
        {"step": "4", "name": "Evidence FOR (Bằng chứng ủng hộ)", "zone": "Core", "prompt": "Những bằng chứng thực tế (Hard Facts) nào đang ủng hộ suy nghĩ tự động này?"},
        {"step": "5", "name": "Evidence AGAINST (Bằng chứng phản bác)", "zone": "Core", "prompt": "Đã có bằng chứng hoặc trải nghiệm nào phản bác lại suy nghĩ này chưa? Bạn sẽ nói gì nếu người bạn thân của mình nghĩ như vậy?"},
        {"step": "5b", "name": "Accuracy Check (Kiểm tra Tính Chính xác Thực tế)", "zone": "Closing", "prompt": "Cổng Accuracy Check: Suy nghĩ này có phải là một sự thật khách quan/mất mát thực tế không? Nếu đúng sự thật, chúng ta dừng tái cấu trúc và chuyển sang Problem-Solving / Coping."},
        {"step": "6", "name": "Balanced Thought (Suy nghĩ cân bằng)", "zone": "Core", "prompt": "Hãy ghép lại thành Suy nghĩ Cân bằng theo khung biện chứng: 'Đúng là [Bằng chứng ủng hộ], VÀ đồng thời cũng đúng là [Bằng chứng phản bác].'"},
        {"step": "7", "name": "Re-rate Emotion (Đánh giá lại 0-10)", "zone": "Closing", "prompt": "Bây giờ khi đọc lại suy nghĩ cân bằng, cường độ cảm xúc của bạn từ 0-10 là bao nhiêu?"},
    ],
    "behavioral-activation": [
        {"step": "0", "name": "Follow-up on Last Plan (Đối chiếu sai số dự đoán)", "zone": "Supportive", "prompt": "So với dự đoán lần trước, điểm Hài lòng (Pleasure 0-10) và Hoàn thành (Mastery 0-10) thực tế của bạn là bao nhiêu?"},
        {"step": "1", "name": "What Has Dropped Away (Hoạt động đã thu hẹp)", "zone": "Supportive", "prompt": "Từ khi mệt mỏi/trầm cảm, hoạt động mang lại ý nghĩa hoặc kết nối nào bạn đã tạm bỏ qua?"},
        {"step": "2", "name": "Rest Check (Cổng Kiểm tra Nghỉ ngơi Sinh học)", "zone": "Closing", "prompt": "Cổng Rest Check: Sự mệt mỏi này là do trầm cảm rút lui hay do cơ thể thiếu ngủ/ốm/kiệt sức cần Nghỉ ngơi Chủ động Không Áy náy?"},
        {"step": "3", "name": "What Matters (Lọc bỏ Should Statements)", "zone": "Core", "prompt": "Nếu bỏ qua chữ 'Tôi phải/nên', điều gì thực sự có ý nghĩa (hoặc ít nặng nề nhất) với riêng bạn hôm nay?"},
        {"step": "4", "name": "One Activity Made Small & Confidence Scaling (>= 7/10)", "zone": "Core", "prompt": "Hãy chọn 1 hành động nhỏ kéo dài 5-15 phút. Điểm tự tin thực hiện của bạn từ 0-10 là bao nhiêu (nếu < 7/10 chúng ta sẽ thu nhỏ tiếp)?"},
        {"step": "5", "name": "Predict M/P & If-Then Barrier Plan", "zone": "Closing", "prompt": "Dự đoán điểm Mastery/Pleasure (0-10) và đặt kế hoạch: 'Nếu tới giờ đó không có cảm hứng, thì tôi sẽ chỉ làm đúng 2 phút đầu tiên.'"},
    ],
    "tipp": [
        {"step": "1", "name": "Mandatory Medical Exclusion Screen (Sàng lọc Y khoa Nước lạnh)", "zone": "Closing", "prompt": "Sàng lọc Y khoa Bắt buộc trước khi dùng Nước lạnh (Dive Reflex): Bạn có mắc bệnh tim mạch, nhịp tim chậm, đang dùng thuốc chẹn beta (beta-blockers), dị ứng lạnh, hoặc rối loạn ăn uống không?"},
        {"step": "2", "name": "Physiological Cooling Skill (Paced Breathing 4-6 / Cold Water)", "zone": "Closing", "prompt": "Hãy thực hiện kỹ năng hạ nhiệt sinh lý: Hít vào bằng mũi 4 giây, thở ra chậm 6-8 giây (nhịp thở ra dài hơn hít vào để kích hoạt thần kinh đối giao cảm)."},
        {"step": "3", "name": "Re-rate Distress Intensity (0-10)", "zone": "Closing", "prompt": "Sau 2 phút thực hiện, cường độ căng thẳng trên cơ thể bạn hiện tại còn bao nhiêu trên 10?"},
    ],
    "opposite-action": [
        {"step": "1", "name": "Name the Emotion (Gọi tên cảm xúc)", "zone": "Supportive", "prompt": "Cảm xúc chủ đạo đang điều khiển cơ thể bạn lúc này là gì?"},
        {"step": "2", "name": "Identify Action Urge (Thôi thúc hành động)", "zone": "Core", "prompt": "Cảm xúc đó đang xúi giục bạn làm hành động gì (trốn chạy, nằm lì, công kích, che giấu)?"},
        {"step": "3", "name": "Justified Check (Kiểm tra tính chính đáng thực tế)", "zone": "Closing", "prompt": "Cổng Justified Check: Cảm xúc của bạn là hợp lệ, nhưng thôi thúc hành động này có phù hợp với sự thật khách quan và an toàn thực tế không?"},
        {"step": "4", "name": "Act Opposite All The Way (Làm ngược lại 100%)", "zone": "Core", "prompt": "Hành động ngược chiều 100% (cả tư thế cơ thể, nét mặt và hành động) mà bạn có thể làm ngay trong 15 phút tới là gì?"},
    ],
    "wise-mind": [
        {"step": "1", "name": "Name the Question", "zone": "Supportive", "prompt": "Quyết định nào đang làm bạn giằng xé lúc này (trong 1 câu ngắn)?"},
        {"step": "2", "name": "Emotion Mind (Tâm Cảm xúc)", "zone": "Core", "prompt": "Phần Tâm Cảm xúc bên trong bạn đang muốn hét lên hoặc thôi thúc điều gì?"},
        {"step": "3", "name": "Reasonable Mind & Harsh Self-Critic Guard", "zone": "Core", "prompt": "Nếu bỏ qua mọi lời tự chỉ trích bản thân, những dữ kiện thực tế của Tâm Lý trí là gì?"},
        {"step": "4", "name": "Mindful Pause (Hít thở 4-6)", "zone": "Closing", "prompt": "Dừng lại hít vào 4 giây, thở ra 6 giây, đặt câu hỏi vào vùng tĩnh lặng ở giữa."},
        {"step": "5", "name": "Wise Mind Recognition (Chấp nhận cả 'Nothing yet')", "zone": "Closing", "prompt": "Khi cả hai phía đều được lắng nghe, Tâm Trí Tuệ nhận ra điều gì (hoặc 'Chưa biết / Nothing yet' cũng hoàn toàn hợp lệ)?"},
    ],
    "chain-analysis": [
        {"step": "1", "name": "Target Behaviour (Hành vi mục tiêu - sau khi qua Hard Stops)", "zone": "Core", "prompt": "Mô tả cụ thể 1 lần hành vi bạn muốn hiểu rõ (ở đâu, lúc nào, kéo dài bao lâu) với tinh thần tò mò không tự trách."},
        {"step": "2", "name": "Prompting Event (Sự kiện kích hoạt)", "zone": "Core", "prompt": "Khoảnh khắc ngay trước khi mọi thứ trượt đi là gì?"},
        {"step": "3", "name": "Vulnerabilities (Yếu tố dễ tổn thương PLEASE)", "zone": "Supportive", "prompt": "Ngày hôm đó có yếu tố sinh học nào làm bạn suy giảm sức đề kháng (thiếu ngủ, bỏ bữa, caffeine, căng thẳng tích tụ)?"},
        {"step": "4", "name": "The Links ([thought], [feeling], [body], [action])", "zone": "Core", "prompt": "Liệt kê các mắt xích nối từ sự kiện kích hoạt tới hành vi."},
        {"step": "5", "name": "Consequences & Break Points / Repair", "zone": "Core", "prompt": "Điểm ngắt (Break Point) và kỹ năng thay thế cho lần sau cùng bước sửa chữa lành mạnh là gì?"},
    ],
    "hypomania-guard": [
        {"step": "1", "name": "Positive Distortion Check & Devil's Advocate", "zone": "Core", "prompt": "Ý tưởng/quyết định lớn bạn đang muốn làm ngay lúc này là gì? Hãy đóng vai Devil's Advocate: nếu có 1 rủi ro thực tế bị che khuất bởi sự hưng phấn, đó là gì?"},
        {"step": "2", "name": "48-Hour Impulse Vault & Two-Person Reality Check", "zone": "Closing", "prompt": "Chúng ta sẽ cất quyết định này vào Khoang Trì hoãn 48 Giờ (48h Impulse Vault) và tham khảo 2 người tin cậy sau khi bạn đã ngủ đủ giấc."},
    ],
}


class MultiAgentOrchestrator:
    """
    Coordinates the Safety Agent, Empathy EAR Agent, CBT/DBT State Machine Agent,
    Grounded RAG Engine, and Bipolar Prodrome & IPSRT Agent with durable SQLite/PostgreSQL checkpointing.
    """

    def __init__(
        self,
        db: ClinicalDatabase,
        rag: GroundedClinicalRAG,
        safety_gate: Optional[FourLayerSafetyGate] = None,
    ) -> None:
        self.db = db
        self.rag = rag
        self.safety_gate = safety_gate or FourLayerSafetyGate()

    # -------------------------------------------------------------------------
    # MAIN SESSION STEP ORCHESTRATION (`POST /api/v1/orchestrator/chat`)
    # -------------------------------------------------------------------------
    def process_chat_turn(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        session_id = payload.get("session_id") or "sess_default"
        user_id = payload.get("user_id") or "user_default"
        user_message = (payload.get("message") or "").strip()
        language = payload.get("language") or "vi"

        # Load existing checkpoint from SQLite/PostgreSQL (or initialize new session state)
        state = self.db.load_session_checkpoint(session_id, user_id=user_id)
        if state is None:
            state = {
                "session_id": session_id,
                "user_id": user_id,
                "phase": "Phase1_CheckIn",
                "mode": payload.get("mode", "instrumental"),
                "technique": payload.get("technique") or "thought-record",
                "current_step": 0,
                "pushback_level": payload.get("pushback_level", "moderate"),
                "pushback_attempts_at_step": 0,
                "pre_intensity": int(payload.get("intensity", 5)),
                "post_intensity": None,
                "mood_polarity": int(payload.get("mood_polarity", 0)),
                "energy_level": int(payload.get("energy_level", 0)),
                "outcome": "in-progress",
                "medical_exclusion_cleared": None,
                "structured_steps": {},
                "recent_messages": [],
                "rolling_summary": "",
            }
        else:
            # Allow dynamic updates to pushback level, mode, technique, or biometrics
            if "pushback_level" in payload and payload["pushback_level"]:
                state["pushback_level"] = payload["pushback_level"]
            if "mode" in payload and payload["mode"]:
                state["mode"] = payload["mode"]
            if "technique" in payload and payload["technique"] and state["current_step"] == 0:
                state["technique"] = payload["technique"]
            if "intensity" in payload and payload["intensity"] is not None:
                if state["current_step"] == 0:
                    state["pre_intensity"] = int(payload["intensity"])
                else:
                    state["post_intensity"] = int(payload["intensity"])
            if "mood_polarity" in payload and payload["mood_polarity"] is not None:
                state["mood_polarity"] = int(payload["mood_polarity"])
            if "energy_level" in payload and payload["energy_level"] is not None:
                state["energy_level"] = int(payload["energy_level"])

        # Dynamic in-chat command to adjust pushback level
        lower_msg = user_message.lower()
        if lower_msg in ("nhẹ hơn", "softer", "gentle"):
            state["pushback_level"] = "gentle"
        elif lower_msg in ("bỏ qua luôn", "pushback off", "off"):
            state["pushback_level"] = "off"
        elif lower_msg in ("sâu hơn", "harder", "firm"):
            state["pushback_level"] = "firm"

        # 1. SAFETY AGENT PRE-CHECK (4-Layer Safety Gate)
        safety_eval = self.safety_gate.evaluate_input(
            text=user_message,
            language=language,
            intensity=int(payload.get("intensity", state.get("pre_intensity", 5))),
            mood_polarity=int(state.get("mood_polarity", 0)),
            energy_level=int(state.get("energy_level", 0)),
            bms_suicide_score=int(payload.get("bms_suicide_score", 0)),
            phq9_item9_score=int(payload.get("phq9_item9_score", 0)),
            asrm_score=int(payload.get("asrm_score", 0)),
            requested_technique=state.get("technique"),
        )

        outbox_event_ids: List[str] = []
        audit_record: Optional[Dict[str, Any]] = None

        if not safety_eval.safe_to_proceed_cbt or safety_eval.triggered_layer is not None:
            outbox_list = []
            if safety_eval.notify_trusted_contacts:
                outbox_list.append(
                    {
                        "event_type": f"SAFETY_ALERT_{safety_eval.action.upper()}",
                        "destination": "ulysses_trusted_contact_dispatcher",
                        "payload": {
                            "session_id": session_id,
                            "user_id": user_id,
                            "action": safety_eval.action,
                            "reasons": safety_eval.reasons,
                        },
                    }
                )
            audit_record, outbox_event_ids = self.db.record_safety_event_with_outbox(
                user_id=user_id,
                event_type=f"SAFETY_GATE_L{safety_eval.triggered_layer}_{safety_eval.action}",
                severity=safety_eval.severity,
                audit_payload={
                    "session_id": session_id,
                    "action": safety_eval.action,
                    "reasons": safety_eval.reasons,
                    "mood_polarity": state.get("mood_polarity"),
                    "energy_level": state.get("energy_level"),
                },
                outbox_notifications=outbox_list,
            )

        # Handle immediate terminal stops (Safety Stop, Real-world danger / Chain Analysis Hard Stop)
        if safety_eval.action in ("safety-stop", "justified-exit", "chain-hard-stop"):
            state["phase"] = "SafetyStop" if safety_eval.action == "safety-stop" else "Phase4_Close"
            state["outcome"] = safety_eval.outcome
            state["pushback_level"] = "off"
            self._append_memory(state, user_message, safety_eval.crisis_message or "")
            self.db.save_session_checkpoint(state)
            return {
                "session_id": session_id,
                "user_id": user_id,
                "phase": state["phase"],
                "mode": state["mode"],
                "technique": state["technique"],
                "current_step": state["current_step"],
                "pushback_level": "off",
                "outcome": state["outcome"],
                "ui_mode": safety_eval.ui_mode,
                "safety": {
                    "triggered_layer": safety_eval.triggered_layer,
                    "action": safety_eval.action,
                    "severity": safety_eval.severity,
                    "reasons": safety_eval.reasons,
                    "hotlines": safety_eval.hotlines,
                    "audit_id": audit_record["audit_id"] if audit_record else None,
                    "outbox_event_ids": outbox_event_ids,
                },
                "rag": {"abstained": True, "citations": [], "top_score": 0.0},
                "response": safety_eval.crisis_message,
            }

        # Route high physiological arousal (Intensity >= 8) or Mixed State directly to DBT TIPP
        if safety_eval.action == "route-tipp" and state["technique"] != "tipp":
            state["technique"] = "tipp"
            state["current_step"] = 0
            state["pushback_level"] = "off"
            state["phase"] = "Phase3_GuidedProtocol"
        elif safety_eval.action == "hypomania-guard" and state["current_step"] == 0:
            state["technique"] = "hypomania-guard"

        # 2. PHASE 0: EXPRESSIVE VENTING MODE (Empathy EAR Agent only, no CBT pushback)
        if state.get("mode") == "expressive":
            rag_res = self.rag.search(user_message, top_k=2)
            ear_reply = self._build_ear_expressive_response(user_message, language)
            guardrail_res = self.safety_gate.enforce_layer4_output_guardrail(
                response_text=ear_reply,
                citations=rag_res["citations"],
                abstained=True,
                language=language,
            )
            self._append_memory(state, user_message, guardrail_res["text"])
            self.db.save_session_checkpoint(state)
            return {
                "session_id": session_id,
                "user_id": user_id,
                "phase": "Phase0_ExpressiveVenting",
                "mode": "expressive",
                "technique": state["technique"],
                "current_step": state["current_step"],
                "pushback_level": "off",
                "outcome": state["outcome"],
                "ui_mode": safety_eval.ui_mode,
                "safety": {"triggered_layer": safety_eval.triggered_layer, "action": "proceed"},
                "rag": {
                    "abstained": True,
                    "citations": [],
                    "top_score": rag_res["top_score"],
                },
                "response": guardrail_res["text"],
            }

        # 3. GROUNDED RAG RETRIEVAL (Threshold = 0.46)
        # If user asks a standalone knowledge query outside active step progression, check RAG
        rag_query = f"{state.get('technique', '')} {user_message}".strip()
        if payload.get("strict_rag_query_only"):
            rag_res = self.rag.search(user_message, top_k=settings.rag_top_k)
        else:
            rag_res = self.rag.search(user_message, top_k=settings.rag_top_k)
            if rag_res["abstained"] and not payload.get("check_rag_abstention", False):
                # When inside a structured protocol turn (e.g. answering a step), ground on the active technique
                rag_res = self.rag.search(rag_query, top_k=settings.rag_top_k)

        # If caller explicitly tests an out-of-scope query or RAG abstains:
        if rag_res["abstained"]:
            ear_fallback = self.rag.build_ear_empathy_fallback(user_message, language=language)
            guardrail_res = self.safety_gate.enforce_layer4_output_guardrail(
                response_text=ear_fallback,
                citations=[],
                abstained=True,
                language=language,
            )
            self._append_memory(state, user_message, guardrail_res["text"])
            self.db.save_session_checkpoint(state)
            return {
                "session_id": session_id,
                "user_id": user_id,
                "phase": state["phase"],
                "mode": state["mode"],
                "technique": state["technique"],
                "current_step": state["current_step"],
                "pushback_level": state["pushback_level"],
                "outcome": state["outcome"],
                "ui_mode": safety_eval.ui_mode,
                "safety": {"triggered_layer": None, "action": "proceed"},
                "rag": {
                    "abstained": True,
                    "citations": [],
                    "top_score": rag_res["top_score"],
                },
                "response": guardrail_res["text"],
            }

        # 4. CBT/DBT PROTOCOL STATE MACHINE & SOCRATIC PUSHBACK CONTROLLER
        protocol_reply = self._advance_protocol_state_machine(
            state=state,
            user_message=user_message,
            payload=payload,
            language=language,
        )

        # 5. LAYER 4 OUTPUT GUARDRAIL (Medication safety + Mandatory [KB:chunk_id] citation)
        guardrail_res = self.safety_gate.enforce_layer4_output_guardrail(
            response_text=protocol_reply,
            citations=rag_res["citations"],
            abstained=False,
            language=language,
        )

        self._append_memory(state, user_message, guardrail_res["text"])
        self.db.save_session_checkpoint(state)

        return {
            "session_id": session_id,
            "user_id": user_id,
            "phase": state["phase"],
            "mode": state["mode"],
            "technique": state["technique"],
            "current_step": state["current_step"],
            "pushback_level": state["pushback_level"],
            "pushback_attempts_at_step": state["pushback_attempts_at_step"],
            "outcome": state["outcome"],
            "ui_mode": safety_eval.ui_mode,
            "safety": {
                "triggered_layer": safety_eval.triggered_layer,
                "action": safety_eval.action,
                "outbox_event_ids": outbox_event_ids,
            },
            "rag": {
                "abstained": False,
                "citations": guardrail_res["citations"],
                "top_score": rag_res["top_score"],
            },
            "response": guardrail_res["text"],
        }

    def _advance_protocol_state_machine(
        self,
        state: Dict[str, Any],
        user_message: str,
        payload: Dict[str, Any],
        language: str,
    ) -> str:
        technique = state.get("technique") or "thought-record"
        steps = PROTOCOL_STEPS.get(technique, PROTOCOL_STEPS["thought-record"])
        step_idx = min(int(state.get("current_step", 0)), len(steps) - 1)
        current_step_def = steps[step_idx]
        zone = current_step_def["zone"]
        lower_msg = user_message.lower()

        # Check Special Clinical Escape Gates:
        # A. DBT Chain Analysis Shame Protocol
        if technique == "chain-analysis" and any(
            kw in lower_msg for kw in ("tôi thật ngu ngốc", "xấu hổ quá", "i am so stupid", "ashamed of myself")
        ):
            state["pushback_level"] = "off"
            return (
                "Shame Protocol Activated: Mình nghe thấy cảm giác xấu hổ và tự trách đang dâng lên rất mạnh. "
                "Chúng ta sẽ tắt hoàn toàn Pushback tại đây. Sự xấu hổ khiến bạn muốn thu mình lại, nhưng bạn đang rất dũng cảm "
                "khi nhìn lại sự việc với sự tò mò thay vì phán xét."
            )

        # B. DBT TIPP Mandatory Medical Exclusion Screen
        if technique == "tipp" and step_idx == 0:
            has_contraindication = payload.get("has_medical_contraindication") or any(
                kw in lower_msg
                for kw in ("có", "yes", "không chắc", "not sure", "tim mạch", "beta-blocker", "nhịp tim chậm", "heart")
            )
            if has_contraindication and not any(kw in lower_msg for kw in ("không có", "no medical")):
                state["medical_exclusion_cleared"] = False
                state["current_step"] = 1
                state["phase"] = "Phase3_GuidedProtocol"
                return (
                    "Cổng Sàng lọc Y khoa TIPP: Vì bạn có lưu ý y khoa (hoặc chưa chắc chắn), hệ thống ĐÃ KHÓA "
                    "bước áp Nước lạnh (Temperature) để bảo vệ tim mạch của bạn. Chúng ta chuyển sang kỹ năng an toàn "
                    "Paced Breathing (Thở dẫn nhịp): Hít vào nhẹ nhàng bằng mũi 4 giây, thở ra chậm 6-8 giây."
                )

        # C. Thought Record Accuracy Check (accurate-thought-exit)
        if technique == "thought-record" and (
            payload.get("is_accurate_objective_thought")
            or "sự thật khách quan" in lower_msg
            or "mất việc thật" in lower_msg
            or "accurate thought" in lower_msg
        ):
            state["phase"] = "Phase4_Close"
            state["outcome"] = "accurate-thought-exit"
            state["pushback_level"] = "off"
            return (
                "Cổng Accuracy Check: Suy nghĩ của bạn phản ánh một sự thật hoặc mất mát khách quan. "
                "Chúng ta dừng ngay việc tái cấu trúc nhận thức (outcome: accurate-thought-exit) để tránh phủ nhận cảm xúc "
                "(toxic positivity) và chuyển sang Problem-Solving (1 bước nhỏ thực tế) cùng Coping chăm sóc bản thân."
            )

        # D. Behavioral Activation Rest Check (justified-exit)
        if technique == "behavioral-activation" and (
            payload.get("needs_biological_rest")
            or "kiệt sức sinh học" in lower_msg
            or "thiếu ngủ" in lower_msg
            or "đang ốm" in lower_msg
            or "biological exhaustion" in lower_msg
        ):
            state["phase"] = "Phase4_Close"
            state["outcome"] = "justified-exit"
            state["pushback_level"] = "off"
            return (
                "Cổng Rest Check: Cơ thể bạn đang cần phục hồi sinh học thực sự chứ không phải né tránh do trầm cảm. "
                "Kế hoạch hôm nay được chuyển thành Nghỉ ngơi Chủ động Không Áy náy (Deliberate Guilt-Free Rest) "
                "và đóng phiên an toàn (outcome: justified-exit)."
            )

        # E. Socratic Pushback Controller when user tries to skip or gives a minimal dismissal
        is_skip_attempt = payload.get("is_skip_attempt", False) or lower_msg in (
            "skip", "bỏ qua", "không biết", "không có gì", "i don't know", "nothing", "none"
        )
        pushback_level = state.get("pushback_level", "moderate")
        if zone == "Closing":
            effective_budget = 0
        elif zone == "Supportive":
            effective_budget = min(1, PUSHBACK_BUDGET_BY_LEVEL.get(pushback_level, 2))
        else:
            effective_budget = PUSHBACK_BUDGET_BY_LEVEL.get(pushback_level, 2)

        attempts = int(state.get("pushback_attempts_at_step", 0))
        if is_skip_attempt and attempts < effective_budget:
            state["pushback_attempts_at_step"] = attempts + 1
            state["phase"] = "Phase3_GuidedProtocol"
            return self._build_socratic_pushback_prompt(
                step_def=current_step_def,
                attempt_number=attempts + 1,
                pushback_level=pushback_level,
                language=language,
            )

        # Record completed step & advance to next step
        state["structured_steps"][f"step_{current_step_def['step']}"] = user_message
        state["pushback_attempts_at_step"] = 0

        if step_idx + 1 < len(steps):
            state["current_step"] = step_idx + 1
            state["phase"] = "Phase3_GuidedProtocol"
            next_step_def = steps[step_idx + 1]
            return (
                f"Đã ghi nhận {current_step_def['name']}. "
                f"Bước tiếp theo ({next_step_def['name']}): {next_step_def['prompt']}"
            )

        # Final step completed -> Phase 4 Close
        state["phase"] = "Phase4_Close"
        if state.get("outcome") == "in-progress":
            state["outcome"] = (
                "impulse-locked-48h" if technique == "hypomania-guard" else "completed"
            )
        return (
            f"Bạn đã hoàn thành toàn bộ giao thức {technique} (outcome: {state['outcome']}). "
            f"Hãy giữ lại 1 bài học cốt lõi (Takeaway) cho bản thân từ phiên thực hành hôm nay."
        )

    @staticmethod
    def _build_socratic_pushback_prompt(
        step_def: Dict[str, str],
        attempt_number: int,
        pushback_level: str,
        language: str,
    ) -> str:
        if attempt_number == 1:
            return (
                f"[Socratic Pushback L1 - {pushback_level}] Bước '{step_def['name']}' thường mang lại góc nhìn chuyển hóa "
                f"rất lớn. Bạn có muốn thử tìm 1 chi tiết nhỏ thôi trước khi chúng ta đi tiếp không?"
            )
        if attempt_number == 2:
            return (
                f"[Socratic Pushback L2 - Double-Standard] Nếu một người bạn thân mà bạn rất yêu quý đang ở trong "
                f"tình huống này, bạn sẽ nói gì với họ ở bước '{step_def['name']}'?"
            )
        return (
            f"[Socratic Pushback L3 - TEAM-CBT Resistance Inquiry] Điều gì khiến việc ngồi lại với bước "
            f"'{step_def['name']}' trở nên khó khăn với bạn ngay lúc này? Nếu muốn bỏ qua, lần tiếp theo mình sẽ chuyển bước ngay."
        )

    @staticmethod
    def _build_ear_expressive_response(user_message: str, language: str = "vi") -> str:
        if language == "vi":
            return (
                "Chế độ Lắng nghe Thấu cảm (TEAM-CBT EAR Expressive Mode): Mình hoàn toàn nghe thấy nỗi mệt mỏi "
                "và cảm xúc của bạn trong những điều bạn vừa chia sẻ. Bạn hoàn toàn có lý khi cảm thấy như vậy. "
                "Mình sẽ chỉ ở đây lắng nghe mà không đưa ra lời khuyên hay bài tập nào cho đến khi bạn sẵn sàng."
            )
        return (
            "TEAM-CBT EAR Expressive Mode: I hear the weight of what you are going through, and it makes complete "
            "sense that you feel this way. I am here simply to listen and validate your feelings without pushing any exercises."
        )

    @staticmethod
    def _append_memory(state: Dict[str, Any], user_msg: str, assistant_msg: str) -> None:
        msgs: List[Dict[str, str]] = state.setdefault("recent_messages", [])
        msgs.append({"role": "user", "content": user_msg})
        msgs.append({"role": "assistant", "content": assistant_msg})
        # Two-tier memory: keep 20 most recent messages + rolling summary every 15 messages
        if len(msgs) >= 15:
            state["rolling_summary"] = (
                f"Session {state.get('session_id')} on {state.get('technique')} "
                f"(step {state.get('current_step')}, mood={state.get('mood_polarity')})."
            )
        if len(msgs) > 20:
            state["recent_messages"] = msgs[-20:]

    # -------------------------------------------------------------------------
    # BIPOLAR PRODROME, MIXED STATE, IPSRT & 48H IMPULSE VAULT (`POST /api/v1/bipolar/analyze`)
    # -------------------------------------------------------------------------
    def analyze_bipolar_state(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        user_id = payload.get("user_id") or "user_default"
        mood_polarity = int(payload.get("mood_polarity", 0))
        energy_level = int(payload.get("energy_level", 0))
        irritability = int(payload.get("irritability_intensity", 0))
        sleep_hours = float(payload.get("sleep_duration_hours", 7.5))
        felt_need = payload.get("felt_need_for_sleep", "normal")
        asrm_score = int(payload.get("asrm_score", 0))
        consecutive_short_sleep_nights = int(payload.get("consecutive_short_sleep_nights", 1 if sleep_hours < 5.0 else 0))

        # 1. Mixed State Detection (Mood <= -2 AND Energy >= +2)
        mixed_state_alert = mood_polarity <= -2 and energy_level >= 2

        # 2. Mania Prodrome Detection (Sleep < 5h with reduced need for sleep, or ASRM >= 6, or Mood >= +2)
        reduced_sleep_need = felt_need in ("reduced_need", "no_need_at_all")
        mania_prodrome_alert = (
            (sleep_hours < 5.0 and reduced_sleep_need)
            or consecutive_short_sleep_nights >= 2
            or asrm_score >= 6
            or mood_polarity >= 2
        )

        # 3. IPSRT 5 Social Rhythm Anchors Stability Score (0..100)
        anchors = payload.get("ipsrt_anchors") or {}
        expected_anchors = ["outOfBedTime", "firstSocialContactTime", "workOrStudyStartTime", "dinnerTime", "bedTime"]
        logged_anchors_count = sum(1 for k in expected_anchors if anchors.get(k))
        deviation_minutes = float(payload.get("anchor_deviation_minutes", 15.0))
        ipsrt_stability_score = max(
            0.0,
            min(100.0, round((logged_anchors_count / 5.0) * 100.0 - max(0.0, deviation_minutes - 15.0) * 0.5, 1)),
        )

        # 4. Baseline-Relative HRV (25th-75th percentile over 14-30 days, < 12h freshness)
        hrv_context = self._evaluate_baseline_relative_hrv(payload.get("hrv_data"))

        # 5. 48-Hour Impulse Vault lock
        impulse_description = payload.get("impulse_decision")
        impulse_vault_entry = None
        if impulse_description or mania_prodrome_alert:
            now = datetime.now(timezone.utc)
            unlock_at = (now + timedelta(hours=48)).isoformat()
            impulse_vault_entry = {
                "locked": True,
                "decision": impulse_description or "High-risk decision during elevated mood polarity",
                "locked_at": now.isoformat(),
                "unlock_at": unlock_at,
                "required_checks": ["DBT STOP", "Crisis Pros & Cons", "Devil's Advocate", "Two-Person Reality Check"],
            }

        # 6. UI Theme & Clinical Protocol Routing
        if mixed_state_alert:
            ui_mode = "sos-portal"
            recommended_protocol = "tipp"
        elif mania_prodrome_alert:
            ui_mode = "low-stimulus-mania"
            recommended_protocol = "hypomania-guard"
        elif mood_polarity <= -3:
            ui_mode = "low-energy-depression"
            recommended_protocol = "behavioral-activation-micro"
        else:
            ui_mode = "standard"
            recommended_protocol = "ipsrt-maintenance"

        # 7. Atomic Hash-Chained Audit Log + Transactional Outbox for Ulysses Contract
        outbox_event_ids: List[str] = []
        audit_id: Optional[str] = None
        if mixed_state_alert or mania_prodrome_alert:
            outbox_notifications = [
                {
                    "event_type": "ULYSSES_CONTRACT_BIPOLAR_ALERT",
                    "destination": "trusted_contact_and_clinician_webhook",
                    "payload": {
                        "user_id": user_id,
                        "mood_polarity": mood_polarity,
                        "energy_level": energy_level,
                        "sleep_hours": sleep_hours,
                        "mixed_state_alert": mixed_state_alert,
                        "mania_prodrome_alert": mania_prodrome_alert,
                    },
                }
            ]
            audit_entry, outbox_event_ids = self.db.record_safety_event_with_outbox(
                user_id=user_id,
                event_type="BIPOLAR_PRODROME_OR_MIXED_STATE",
                severity="CRITICAL" if mixed_state_alert else "HIGH",
                audit_payload={
                    "mood_polarity": mood_polarity,
                    "energy_level": energy_level,
                    "irritability": irritability,
                    "sleep_hours": sleep_hours,
                    "mixed_state_alert": mixed_state_alert,
                    "mania_prodrome_alert": mania_prodrome_alert,
                },
                outbox_notifications=outbox_notifications,
            )
            audit_id = audit_entry["audit_id"]

        return {
            "user_id": user_id,
            "mood_polarity": mood_polarity,
            "energy_level": energy_level,
            "mixed_state_alert_triggered": mixed_state_alert,
            "mania_prodrome_detected": mania_prodrome_alert,
            "ipsrt_stability_score": ipsrt_stability_score,
            "hrv_context": hrv_context,
            "ui_mode": ui_mode,
            "recommended_protocol": recommended_protocol,
            "impulse_vault_48h": impulse_vault_entry,
            "audit_id": audit_id,
            "outbox_event_ids": outbox_event_ids,
        }

    @staticmethod
    def _evaluate_baseline_relative_hrv(hrv_data: Optional[Dict[str, Any]]) -> Optional[str]:
        """
        Evaluate HRV strictly against the user's personal 14-30 day baseline (25th-75th percentile).
        Ignores readings older than 12 hours. Never uses absolute thresholds.
        """
        if not hrv_data:
            return None
        age_hours = float(hrv_data.get("age_hours", 1.0))
        if age_hours > 12.0:
            return None
        history: List[float] = [float(x) for x in hrv_data.get("history_14_30_days", [])]
        current_rmssd = hrv_data.get("current_rmssd")
        if current_rmssd is None or len(history) < 5:
            return None
        sorted_hist = sorted(history)
        n = len(sorted_hist)
        p25 = sorted_hist[max(0, int(0.25 * (n - 1)))]
        p75 = sorted_hist[min(n - 1, int(0.75 * (n - 1)))]
        val = float(current_rmssd)
        if val < p25:
            return "below-baseline"
        if val > p75:
            return "above-baseline"
        return "within-baseline"

    # -------------------------------------------------------------------------
    # CLINICAL SELF-ASSESSMENTS SCORER (`POST /api/v1/assessments/score`)
    # -------------------------------------------------------------------------
    def score_assessment(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        scale = (payload.get("scale") or "PHQ-9").upper()
        answers: List[int] = [int(x) for x in payload.get("answers", [])]
        total = sum(answers)
        subscores: Dict[str, int] = payload.get("subscores") or {}

        alerts: List[str] = []
        severity_label = "minimal"
        recommended_action = "continue_self_monitoring"

        if scale == "BMS":
            suicide_score = int(subscores.get("suicidal_urges", answers[0] if answers else 0))
            if suicide_score >= 1:
                alerts.append("safety-stop")
                severity_label = "critical_suicidal_ideation"
                recommended_action = "activate_safety_stop_and_hotline"
            else:
                severity_label = "monitored"
        elif scale == "PHQ-9":
            q9 = answers[8] if len(answers) >= 9 else int(subscores.get("q9", 0))
            if q9 > 0:
                alerts.append("safety-stop")
                recommended_action = "activate_safety_stop_and_hotline"
            if total >= 20:
                severity_label = "severe_depression"
            elif total >= 15:
                severity_label = "moderately_severe_depression"
                alerts.append("clinician_referral_recommended")
            elif total >= 10:
                severity_label = "moderate_depression"
            elif total >= 5:
                severity_label = "mild_depression"
        elif scale == "GAD-7":
            if total >= 15:
                severity_label = "severe_anxiety"
                alerts.append("anxiety_4_models_and_grounding")
            elif total >= 10:
                severity_label = "moderate_anxiety"
                alerts.append("anxiety_4_models_and_grounding")
            elif total >= 5:
                severity_label = "mild_anxiety"
        elif scale == "ASRM":
            if total >= 6:
                severity_label = "hypomania_or_mania_high_probability"
                alerts.extend(["hypomania-guard", "low-stimulus-ui", "clinician_alert"])
                recommended_action = "activate_hypomania_guard_and_48h_vault"
        elif scale == "MDQ":
            symptom_yes_count = sum(1 for a in answers[:13] if a > 0)
            co_occurrence = bool(payload.get("co_occurrence", True))
            moderate_or_serious_problem = bool(payload.get("moderate_or_serious_problem", True))
            if symptom_yes_count >= 7 and co_occurrence and moderate_or_serious_problem:
                severity_label = "positive_bipolar_spectrum_screen"
                alerts.append("consult_psychiatrist_before_unipolar_antidepressant")
        elif scale == "ISI":
            if total >= 22:
                severity_label = "severe_clinical_insomnia"
            elif total >= 15:
                severity_label = "moderate_clinical_insomnia"
                alerts.append("cbt_i_sleep_diary_and_bipolar_sleep_guard")
            elif total >= 8:
                severity_label = "subthreshold_insomnia"

        return {
            "scale": scale,
            "total_score": total,
            "severity": severity_label,
            "alerts": alerts,
            "recommended_action": recommended_action,
            "disclaimer": (
                "Công cụ tự theo dõi sàng lọc lâm sàng, không thay thế chẩn đoán chính thức của bác sĩ tâm thần."
            ),
        }
