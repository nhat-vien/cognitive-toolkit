"""
Central configuration for the Equilibria / Mind Anchor Modular Monolith Backend.
Enforces strict clinical thresholds (RAG_SCORE_THRESHOLD = 0.46) and local-first defaults.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path


def _resolve_default_kb_dir() -> Path:
    """Locate packages/clinical-protocols-kb/references relative to apps/backend-api/src."""
    here = Path(__file__).resolve().parent
    candidate = here.parent.parent.parent / "packages" / "clinical-protocols-kb" / "references"
    return candidate


@dataclass(frozen=True)
class Settings:
    app_name: str = os.getenv("APP_NAME", "Equilibria Cognitive Toolkit Backend API")
    app_version: str = os.getenv("APP_VERSION", "1.0.0")
    app_env: str = os.getenv("APP_ENV", "development")

    # Grounded RAG configuration (KazKozDev/cbt-assistant architecture)
    rag_score_threshold: float = float(os.getenv("RAG_SCORE_THRESHOLD", "0.46"))
    rag_top_k: int = int(os.getenv("RAG_TOP_K", "3"))
    embedding_model_name: str = os.getenv(
        "EMBEDDING_MODEL", "sentence-transformers/paraphrase-multilingual-mpnet-base-v2"
    )
    knowledge_base_dir: Path = field(
        default_factory=lambda: Path(
            os.getenv("KNOWLEDGE_BASE_DIR", str(_resolve_default_kb_dir()))
        )
    )

    # Local Ollama AI configuration
    ollama_base_url: str = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
    ollama_model: str = os.getenv("OLLAMA_MODEL", "qwen2.5:7b")
    ollama_timeout_seconds: float = float(os.getenv("OLLAMA_TIMEOUT_SECONDS", "3.0"))
    enable_ollama_live_call: bool = os.getenv("ENABLE_OLLAMA_LIVE_CALL", "false").lower() == "true"

    # Database & Persistence (fixes Solace-AI InMemorySaver flaw)
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./equilibria_clinical.db")
    sqlite_path: str = os.getenv(
        "SQLITE_PATH",
        str(Path(__file__).resolve().parent.parent / "equilibria_clinical.db"),
    )
    postgres_rls_enabled: bool = os.getenv("POSTGRES_RLS_ENABLED", "true").lower() == "true"

    # Security, JWT & Audit Chain
    jwt_secret_key: str = os.getenv(
        "JWT_SECRET_KEY", "equilibria-local-first-jwt-secret-key-2026-change-in-prod"
    )
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    audit_genesis_hash: str = "0" * 64

    # Transactional Outbox Worker (fixes Solace-AI dead event plane)
    outbox_poll_interval_seconds: float = float(os.getenv("OUTBOX_POLL_INTERVAL_SECONDS", "5.0"))
    outbox_max_retries: int = int(os.getenv("OUTBOX_MAX_RETRIES", "3"))

    # Clinical Safety Cutoffs
    asrm_mania_cutoff: int = 6
    phq9_moderately_severe_cutoff: int = 15
    gad7_moderate_cutoff: int = 10
    suds_high_arousal_cutoff: int = 8
    bipolar_mixed_mood_threshold: int = -2
    bipolar_mixed_energy_threshold: int = 2
    bipolar_mania_sleep_hours_threshold: float = 5.0


RAG_SCORE_THRESHOLD: float = 0.46
settings = Settings()
