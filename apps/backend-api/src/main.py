"""
FastAPI Application for the Equilibria / Mind Anchor Modular Monolith Backend (`src/main.py`).

Exposes:
- `GET  /api/v1/health`
- `GET  /api/v1/knowledge/status` & `GET /api/v1/knowledge/search`
- `POST /api/v1/orchestrator/chat` (Multi-agent CBT/DBT session step + RAG + 4-Layer Safety Gate)
- `POST /api/v1/bipolar/analyze` (Prodrome, Mixed State, IPSRT & 48h Impulse Vault evaluation)
- `POST /api/v1/assessments/score` (`BMS`, `PHQ-9`, `GAD-7`, `ASRM`, `MDQ`, `ISI`)
- `POST /api/v1/sync/push` & `GET /api/v1/sync/pull` (Zero-Knowledge E2EE encrypted blob sync)
- `GET  /api/v1/audit/verify` (Verifies integrity of the SHA-256 hash-chained safety audit log)
- `POST /api/v1/outbox/flush` (Flushes pending transactional outbox crisis & Ulysses notifications)
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from src.config import RAG_SCORE_THRESHOLD, settings
from src.db.models_and_rls import ClinicalDatabase, get_postgres_rls_ddl
from src.orchestrator.multi_agent_orchestrator import MultiAgentOrchestrator
from src.outbox.outbox_worker import OutboxWorker
from src.rag.grounded_rag import GroundedClinicalRAG
from src.safety.four_layer_safety import FourLayerSafetyGate


# ---------------------------------------------------------------------------
# PYDANTIC REQUEST / RESPONSE SCHEMAS
# ---------------------------------------------------------------------------
class ChatTurnRequest(BaseModel):
    session_id: str = Field(default="sess_default")
    user_id: str = Field(default="user_default")
    message: str
    language: str = Field(default="vi")
    mode: Optional[str] = Field(default=None, description="'expressive' or 'instrumental'")
    technique: Optional[str] = Field(default=None)
    pushback_level: Optional[str] = Field(default=None, description="'off' | 'gentle' | 'moderate' | 'firm'")
    intensity: Optional[int] = Field(default=None, ge=0, le=10)
    mood_polarity: Optional[int] = Field(default=None, ge=-5, le=5)
    energy_level: Optional[int] = Field(default=None, ge=-5, le=5)
    bms_suicide_score: int = Field(default=0, ge=0)
    phq9_item9_score: int = Field(default=0, ge=0)
    asrm_score: int = Field(default=0, ge=0)
    is_skip_attempt: bool = Field(default=False)
    is_accurate_objective_thought: bool = Field(default=False)
    needs_biological_rest: bool = Field(default=False)
    has_medical_contraindication: Optional[bool] = Field(default=None)
    strict_rag_query_only: bool = Field(default=False)
    check_rag_abstention: bool = Field(default=False)


class BipolarAnalyzeRequest(BaseModel):
    user_id: str = Field(default="user_default")
    mood_polarity: int = Field(default=0, ge=-5, le=5)
    energy_level: int = Field(default=0, ge=-5, le=5)
    irritability_intensity: int = Field(default=0, ge=0, le=10)
    sleep_duration_hours: float = Field(default=7.5, ge=0.0, le=24.0)
    felt_need_for_sleep: str = Field(default="normal")
    asrm_score: int = Field(default=0, ge=0, le=20)
    consecutive_short_sleep_nights: int = Field(default=0, ge=0)
    ipsrt_anchors: Dict[str, Optional[str]] = Field(default_factory=dict)
    anchor_deviation_minutes: float = Field(default=15.0, ge=0.0)
    hrv_data: Optional[Dict[str, Any]] = Field(default=None)
    impulse_decision: Optional[str] = Field(default=None)


class AssessmentScoreRequest(BaseModel):
    scale: str = Field(..., description="'BMS' | 'PHQ-9' | 'GAD-7' | 'ASRM' | 'MDQ' | 'ISI'")
    answers: List[int] = Field(default_factory=list)
    subscores: Dict[str, int] = Field(default_factory=dict)
    co_occurrence: bool = Field(default=True)
    moderate_or_serious_problem: bool = Field(default=True)


class E2EEBlobItem(BaseModel):
    blob_id: str
    entity_type: str = Field(default="cognitive_session")
    ciphertext_b64: str
    iv_b64: str
    auth_tag_b64: str
    key_version: int = Field(default=1)
    client_updated_at: str


class E2EESyncPushRequest(BaseModel):
    user_id: str
    blobs: List[E2EEBlobItem]


class VoiceBurstAnalyzeRequest(BaseModel):
    user_id: str = Field(default="user_default")
    session_id: Optional[str] = Field(default=None)
    transcript: str
    duration_seconds: float = Field(default=30.0, gt=0.0)
    baseline_wpm: float = Field(default=130.0, gt=0.0)
    language: str = Field(default="vi")
    hrv_data: Optional[Dict[str, Any]] = Field(default=None)
    recent_hrv_readings: Optional[List[Dict[str, Any]]] = Field(default=None)


class ClinicianShareCreateRequest(BaseModel):
    user_id: str = Field(default="user_default")
    encrypted_payload_b64: str
    iv_b64: str
    auth_tag_b64: str
    ttl_hours: int = Field(default=24, ge=1, le=720)
    report_period_days: int = Field(default=30)
    share_token: Optional[str] = Field(default=None)
    now_iso: Optional[str] = Field(default=None)
    revoke: bool = Field(default=False)



# ---------------------------------------------------------------------------
# APPLICATION FACTORY
# ---------------------------------------------------------------------------
def create_app(sqlite_path: Optional[str] = None) -> FastAPI:
    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description=(
            "Modular Monolith Backend for Anxiety, Depression & Bipolar Disorder "
            "(TEAM-CBT, DBT & IPSRT) with 4-Layer Safety Gate, Grounded RAG (threshold=0.46), "
            "Persistent Checkpoints, Transactional Outbox, and SHA-256 Hash-Chained Audit Log."
        ),
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    db = ClinicalDatabase(sqlite_path=sqlite_path)
    rag = GroundedClinicalRAG(threshold=RAG_SCORE_THRESHOLD)
    safety_gate = FourLayerSafetyGate()
    orchestrator = MultiAgentOrchestrator(db=db, rag=rag, safety_gate=safety_gate)
    outbox_worker = OutboxWorker(db=db)

    application.state.db = db
    application.state.rag = rag
    application.state.safety_gate = safety_gate
    application.state.orchestrator = orchestrator
    application.state.outbox_worker = outbox_worker

    @application.get("/api/v1/health")
    def get_health() -> Dict[str, Any]:
        return {
            "status": "healthy",
            "service": settings.app_name,
            "version": settings.app_version,
            "architecture": "modular-monolith",
            "rag_threshold": RAG_SCORE_THRESHOLD,
            "rls_enabled": settings.postgres_rls_enabled,
            "outbox_stats": db.get_outbox_stats(),
        }

    @application.get("/api/v1/knowledge/status")
    def get_knowledge_status() -> Dict[str, Any]:
        return rag.status()

    @application.get("/api/v1/knowledge/search")
    def search_knowledge(
        q: str = Query(..., description="Clinical query in Vietnamese or English"),
        top_k: int = Query(default=3, ge=1, le=10),
        technique: Optional[str] = Query(default=None),
    ) -> Dict[str, Any]:
        return rag.search(query=q, top_k=top_k, technique_filter=technique)

    @application.post("/api/v1/orchestrator/chat")
    def orchestrator_chat(req: ChatTurnRequest) -> Dict[str, Any]:
        result = orchestrator.process_chat_turn(req.model_dump(exclude_none=True))
        return result

    @application.get("/api/v1/memory/{session_id}")
    def get_memory_state(
        session_id: str,
        user_id: Optional[str] = Query(default=None),
    ) -> Dict[str, Any]:
        return orchestrator.get_session_memory(session_id=session_id, user_id=user_id)

    @application.delete("/api/v1/memory/{session_id}")
    def delete_memory_state(
        session_id: str,
        mode: str = Query(
            default="derived_only",
            description="'derived_only' (erases rolling summary & profile facts) or 'all' (wipes transcripts & memory)",
        ),
        user_id: Optional[str] = Query(default=None),
    ) -> Dict[str, Any]:
        return orchestrator.delete_session_memory(
            session_id=session_id, mode=mode, user_id=user_id
        )

    @application.post("/api/v1/voice-burst/analyze")
    def analyze_voice_burst(req: VoiceBurstAnalyzeRequest) -> Dict[str, Any]:
        return orchestrator.analyze_voice_burst(req.model_dump(exclude_none=True))

    @application.post("/api/v1/bipolar/analyze")
    def bipolar_analyze(req: BipolarAnalyzeRequest) -> Dict[str, Any]:
        return orchestrator.analyze_bipolar_state(req.model_dump())

    @application.post("/api/v1/assessments/score")
    def score_assessment(req: AssessmentScoreRequest) -> Dict[str, Any]:
        return orchestrator.score_assessment(req.model_dump())

    @application.post("/api/v1/sync/push")
    def sync_push(req: E2EESyncPushRequest) -> Dict[str, Any]:
        results = []
        for item in req.blobs:
            try:
                res = db.upsert_e2ee_blob(
                    user_id=req.user_id,
                    blob_id=item.blob_id,
                    entity_type=item.entity_type,
                    ciphertext_b64=item.ciphertext_b64,
                    iv_b64=item.iv_b64,
                    auth_tag_b64=item.auth_tag_b64,
                    client_updated_at=item.client_updated_at,
                    key_version=item.key_version,
                )
                results.append(res)
            except PermissionError as exc:
                raise HTTPException(status_code=403, detail=str(exc)) from exc
        return {
            "user_id": req.user_id,
            "synced_count": len(results),
            "results": results,
            "zero_knowledge": True,
        }

    @application.get("/api/v1/sync/pull")
    def sync_pull(
        user_id: str = Query(...),
        since: Optional[str] = Query(default=None),
    ) -> Dict[str, Any]:
        blobs = db.pull_e2ee_blobs(user_id=user_id, since_timestamp=since)
        return {
            "user_id": user_id,
            "count": len(blobs),
            "blobs": blobs,
            "zero_knowledge": True,
        }

    @application.get("/api/v1/audit/verify")
    def audit_verify() -> Dict[str, Any]:
        verification = db.verify_audit_chain()
        verification["postgres_rls_policies_configured"] = "ENABLE ROW LEVEL SECURITY" in get_postgres_rls_ddl()
        return verification

    @application.post("/api/v1/outbox/flush")
    def flush_outbox() -> Dict[str, Any]:
        return outbox_worker.poll_and_flush()

    @application.post("/api/v1/clinician/share")
    def create_or_revoke_clinician_share(req: ClinicianShareCreateRequest) -> Dict[str, Any]:
        if req.revoke and req.share_token:
            try:
                return db.revoke_clinician_share_link(
                    share_token=req.share_token, user_id=req.user_id
                )
            except PermissionError as exc:
                raise HTTPException(status_code=403, detail=str(exc)) from exc
        try:
            return db.create_clinician_share_link(
                user_id=req.user_id,
                encrypted_payload_b64=req.encrypted_payload_b64,
                iv_b64=req.iv_b64,
                auth_tag_b64=req.auth_tag_b64,
                ttl_hours=req.ttl_hours,
                report_period_days=req.report_period_days,
                share_token=req.share_token,
                now_iso=req.now_iso,
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @application.get("/api/v1/clinician/share/{share_token}")
    def get_clinician_share(
        share_token: str,
        now_iso: Optional[str] = Query(default=None),
    ) -> Dict[str, Any]:
        record = db.get_clinician_share_link(share_token=share_token, now_iso=now_iso)
        if record["status"] == "not_found":
            raise HTTPException(status_code=404, detail="Clinician share snapshot not found.")
        if record["status"] in ("revoked", "expired"):
            raise HTTPException(
                status_code=410,
                detail=f"Clinician share link is {record['status']}.",
            )
        return record

    @application.get("/api/v1/redteam/audit")
    def get_redteam_audit() -> Dict[str, Any]:
        from scripts.run_redteam_audit import run_redteam_audit

        return run_redteam_audit()

    return application


app = create_app()
