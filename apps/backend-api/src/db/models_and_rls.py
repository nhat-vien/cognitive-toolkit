"""
Persistence Layer for Equilibria Modular Monolith (`src/db/models_and_rls.py`).

Remediates `Solace-AI` architectural flaws:
1. Row-Level Security (RLS) policies for PostgreSQL + strict tenant isolation in SQLite.
2. Hash-Chained Audit Log (`audit_logs`): tamper-evident SHA-256 chain for every safety/crisis event.
3. Transactional Outbox table (`outbox_events`): atomic event creation within the same DB transaction.
4. Zero-Knowledge E2EE Sync blobs table (`e2ee_sync_blobs`): client-encrypted ciphertext storage.
5. Persistent Conversation Checkpoints (`session_checkpoints`): replaces Solace-AI's broken `InMemorySaver`.
"""

from __future__ import annotations

import hashlib
import json
import sqlite3
import threading
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Generator, List, Optional, Tuple

from src.config import settings


POSTGRES_RLS_DDL = """
-- PostgreSQL 16 + pgvector Schema & Row-Level Security (RLS) Policies
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS session_checkpoints (
    session_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    phase TEXT NOT NULL,
    mode TEXT NOT NULL,
    technique TEXT,
    current_step INTEGER NOT NULL DEFAULT 0,
    pushback_level TEXT NOT NULL DEFAULT 'moderate',
    pushback_attempts_at_step INTEGER NOT NULL DEFAULT 0,
    pre_intensity INTEGER NOT NULL DEFAULT 5,
    post_intensity INTEGER,
    mood_polarity INTEGER NOT NULL DEFAULT 0,
    energy_level INTEGER NOT NULL DEFAULT 0,
    outcome TEXT NOT NULL DEFAULT 'in-progress',
    state_json JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS e2ee_sync_blobs (
    blob_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    ciphertext_b64 TEXT NOT NULL,
    iv_b64 TEXT NOT NULL,
    auth_tag_b64 TEXT NOT NULL,
    key_version INTEGER NOT NULL DEFAULT 1,
    client_updated_at TEXT NOT NULL,
    server_received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outbox_events (
    event_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    destination TEXT NOT NULL,
    payload_json JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    retry_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    dispatched_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS audit_logs (
    seq_id BIGSERIAL PRIMARY KEY,
    audit_id TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    prev_hash TEXT NOT NULL,
    entry_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clinician_share_links (
    share_token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    encrypted_payload_b64 TEXT NOT NULL,
    iv_b64 TEXT NOT NULL,
    auth_tag_b64 TEXT NOT NULL,
    report_period_days INTEGER NOT NULL DEFAULT 30,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    revoked INTEGER NOT NULL DEFAULT 0
);

-- Enable Row-Level Security (RLS) on all patient-scoped tables
ALTER TABLE session_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE e2ee_sync_blobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinician_share_links ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies using app.current_user_id session setting
CREATE POLICY tenant_isolation_checkpoints ON session_checkpoints
    USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY tenant_isolation_e2ee_blobs ON e2ee_sync_blobs
    USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY tenant_isolation_outbox ON outbox_events
    USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY tenant_isolation_audit ON audit_logs
    USING (user_id = current_setting('app.current_user_id', true)
           OR current_setting('app.current_role', true) = 'safety_auditor');
"""


def get_postgres_rls_ddl() -> str:
    """Return the PostgreSQL 16 + pgvector DDL with Row-Level Security policies."""
    return POSTGRES_RLS_DDL


def compute_audit_entry_hash(
    prev_hash: str,
    created_at: str,
    user_id: str,
    event_type: str,
    severity: str,
    payload_json: str,
) -> str:
    """Compute deterministic SHA-256 hash linking an audit record to its predecessor."""
    canonical = f"{prev_hash}|{created_at}|{user_id}|{event_type}|{severity}|{payload_json}"
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


class ClinicalDatabase:
    """
    Thread-safe SQLite/PostgreSQL-compatible persistence engine implementing:
    - Persistent session checkpointing (replacing Solace-AI InMemorySaver)
    - Tamper-evident SHA-256 Hash-Chained Audit Log
    - Transactional Outbox storage & atomic crisis event recording
    - Zero-Knowledge E2EE Sync Blob storage with Last-Write-Wins conflict resolution
    """

    def __init__(self, sqlite_path: Optional[str] = None) -> None:
        self.sqlite_path = sqlite_path or settings.sqlite_path
        self._lock = threading.RLock()
        self._memory_conn: Optional[sqlite3.Connection] = None
        if self.sqlite_path == ":memory:":
            self._memory_conn = sqlite3.connect(":memory:", check_same_thread=False)
            self._memory_conn.row_factory = sqlite3.Row
        else:
            Path(self.sqlite_path).parent.mkdir(parents=True, exist_ok=True)
        self._init_schema()

    @contextmanager
    def connection(self) -> Generator[sqlite3.Connection, None, None]:
        with self._lock:
            if self._memory_conn is not None:
                try:
                    yield self._memory_conn
                    self._memory_conn.commit()
                except Exception:
                    self._memory_conn.rollback()
                    raise
            else:
                conn = sqlite3.connect(self.sqlite_path, check_same_thread=False)
                conn.row_factory = sqlite3.Row
                try:
                    yield conn
                    conn.commit()
                except Exception:
                    conn.rollback()
                    raise
                finally:
                    conn.close()

    def _init_schema(self) -> None:
        with self.connection() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS session_checkpoints (
                    session_id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    phase TEXT NOT NULL,
                    mode TEXT NOT NULL,
                    technique TEXT,
                    current_step INTEGER NOT NULL DEFAULT 0,
                    pushback_level TEXT NOT NULL DEFAULT 'moderate',
                    pushback_attempts_at_step INTEGER NOT NULL DEFAULT 0,
                    pre_intensity INTEGER NOT NULL DEFAULT 5,
                    post_intensity INTEGER,
                    mood_polarity INTEGER NOT NULL DEFAULT 0,
                    energy_level INTEGER NOT NULL DEFAULT 0,
                    outcome TEXT NOT NULL DEFAULT 'in-progress',
                    state_json TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS e2ee_sync_blobs (
                    blob_id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    entity_type TEXT NOT NULL,
                    ciphertext_b64 TEXT NOT NULL,
                    iv_b64 TEXT NOT NULL,
                    auth_tag_b64 TEXT NOT NULL,
                    key_version INTEGER NOT NULL DEFAULT 1,
                    client_updated_at TEXT NOT NULL,
                    server_received_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS outbox_events (
                    event_id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    destination TEXT NOT NULL,
                    payload_json TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'PENDING',
                    retry_count INTEGER NOT NULL DEFAULT 0,
                    last_error TEXT,
                    created_at TEXT NOT NULL,
                    dispatched_at TEXT
                );

                CREATE TABLE IF NOT EXISTS audit_logs (
                    seq_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    audit_id TEXT UNIQUE NOT NULL,
                    user_id TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    severity TEXT NOT NULL,
                    payload_json TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    prev_hash TEXT NOT NULL,
                    entry_hash TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS clinician_share_links (
                    share_token TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    encrypted_payload_b64 TEXT NOT NULL,
                    iv_b64 TEXT NOT NULL,
                    auth_tag_b64 TEXT NOT NULL,
                    report_period_days INTEGER NOT NULL DEFAULT 30,
                    created_at TEXT NOT NULL,
                    expires_at TEXT NOT NULL,
                    revoked INTEGER NOT NULL DEFAULT 0
                );
                """
            )

    # -------------------------------------------------------------------------
    # 1. HASH-CHAINED AUDIT LOG (Tamper-evident SHA-256 chain)
    # -------------------------------------------------------------------------
    def _append_audit_in_tx(
        self,
        conn: sqlite3.Connection,
        user_id: str,
        event_type: str,
        severity: str,
        payload: Dict[str, Any],
    ) -> Dict[str, Any]:
        row = conn.execute(
            "SELECT entry_hash FROM audit_logs ORDER BY seq_id DESC LIMIT 1"
        ).fetchone()
        prev_hash = row["entry_hash"] if row else settings.audit_genesis_hash
        created_at = datetime.now(timezone.utc).isoformat()
        audit_id = f"aud_{uuid.uuid4().hex[:12]}"
        payload_json = json.dumps(payload, ensure_ascii=False, sort_keys=True)
        entry_hash = compute_audit_entry_hash(
            prev_hash=prev_hash,
            created_at=created_at,
            user_id=user_id,
            event_type=event_type,
            severity=severity,
            payload_json=payload_json,
        )
        conn.execute(
            """
            INSERT INTO audit_logs (
                audit_id, user_id, event_type, severity,
                payload_json, created_at, prev_hash, entry_hash
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                audit_id,
                user_id,
                event_type,
                severity,
                payload_json,
                created_at,
                prev_hash,
                entry_hash,
            ),
        )
        return {
            "audit_id": audit_id,
            "user_id": user_id,
            "event_type": event_type,
            "severity": severity,
            "created_at": created_at,
            "prev_hash": prev_hash,
            "entry_hash": entry_hash,
        }

    def append_audit_log(
        self,
        user_id: str,
        event_type: str,
        severity: str,
        payload: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Append a cryptographically chained SHA-256 audit log entry."""
        with self.connection() as conn:
            return self._append_audit_in_tx(conn, user_id, event_type, severity, payload)

    def verify_audit_chain(self) -> Dict[str, Any]:
        """
        Verify the integrity of the entire SHA-256 hash-chained safety audit log.
        Detects any modified payload, altered timestamp, or broken prev_hash link.
        """
        with self.connection() as conn:
            rows = conn.execute(
                "SELECT * FROM audit_logs ORDER BY seq_id ASC"
            ).fetchall()

        expected_prev_hash = settings.audit_genesis_hash
        verified_count = 0
        for row in rows:
            actual_prev = row["prev_hash"]
            if actual_prev != expected_prev_hash:
                return {
                    "valid": False,
                    "total_entries": len(rows),
                    "verified_entries": verified_count,
                    "broken_at_seq_id": row["seq_id"],
                    "broken_audit_id": row["audit_id"],
                    "reason": "prev_hash_mismatch",
                }
            recomputed = compute_audit_entry_hash(
                prev_hash=actual_prev,
                created_at=row["created_at"],
                user_id=row["user_id"],
                event_type=row["event_type"],
                severity=row["severity"],
                payload_json=row["payload_json"],
            )
            if recomputed != row["entry_hash"]:
                return {
                    "valid": False,
                    "total_entries": len(rows),
                    "verified_entries": verified_count,
                    "broken_at_seq_id": row["seq_id"],
                    "broken_audit_id": row["audit_id"],
                    "reason": "entry_hash_tampered",
                }
            expected_prev_hash = row["entry_hash"]
            verified_count += 1

        return {
            "valid": True,
            "total_entries": len(rows),
            "verified_entries": verified_count,
            "head_hash": expected_prev_hash,
            "rls_enabled": settings.postgres_rls_enabled,
        }

    # -------------------------------------------------------------------------
    # 2. TRANSACTIONAL OUTBOX + ATOMIC SAFETY RECORDING
    # -------------------------------------------------------------------------
    def record_safety_event_with_outbox(
        self,
        user_id: str,
        event_type: str,
        severity: str,
        audit_payload: Dict[str, Any],
        outbox_notifications: Optional[List[Dict[str, Any]]] = None,
    ) -> Tuple[Dict[str, Any], List[str]]:
        """
        Atomically record a safety/crisis audit entry AND enqueue transactional outbox
        notifications within a single ACID database transaction.
        """
        created_event_ids: List[str] = []
        with self.connection() as conn:
            audit_entry = self._append_audit_in_tx(
                conn=conn,
                user_id=user_id,
                event_type=event_type,
                severity=severity,
                payload=audit_payload,
            )
            for notif in outbox_notifications or []:
                event_id = f"out_{uuid.uuid4().hex[:12]}"
                created_at = datetime.now(timezone.utc).isoformat()
                conn.execute(
                    """
                    INSERT INTO outbox_events (
                        event_id, user_id, event_type, destination,
                        payload_json, status, retry_count, created_at
                    ) VALUES (?, ?, ?, ?, ?, 'PENDING', 0, ?)
                    """,
                    (
                        event_id,
                        user_id,
                        notif.get("event_type", event_type),
                        notif.get("destination", "trusted_contact_webhook"),
                        json.dumps(notif.get("payload", audit_payload), ensure_ascii=False),
                        created_at,
                    ),
                )
                created_event_ids.append(event_id)
        return audit_entry, created_event_ids

    def fetch_pending_outbox_events(self, limit: int = 50) -> List[Dict[str, Any]]:
        with self.connection() as conn:
            rows = conn.execute(
                """
                SELECT * FROM outbox_events
                WHERE status IN ('PENDING', 'FAILED')
                ORDER BY created_at ASC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()
        return [dict(r) for r in rows]

    def mark_outbox_event_sent(self, event_id: str) -> None:
        now = datetime.now(timezone.utc).isoformat()
        with self.connection() as conn:
            conn.execute(
                """
                UPDATE outbox_events
                SET status = 'SENT', dispatched_at = ?, last_error = NULL
                WHERE event_id = ?
                """,
                (now, event_id),
            )

    def mark_outbox_event_failed(
        self, event_id: str, error_msg: str, max_retries: int = 3
    ) -> str:
        with self.connection() as conn:
            row = conn.execute(
                "SELECT retry_count FROM outbox_events WHERE event_id = ?",
                (event_id,),
            ).fetchone()
            new_retries = (row["retry_count"] if row else 0) + 1
            new_status = "DEAD_LETTER" if new_retries >= max_retries else "FAILED"
            conn.execute(
                """
                UPDATE outbox_events
                SET status = ?, retry_count = ?, last_error = ?
                WHERE event_id = ?
                """,
                (new_status, new_retries, error_msg, event_id),
            )
            return new_status

    def get_outbox_stats(self) -> Dict[str, int]:
        with self.connection() as conn:
            rows = conn.execute(
                "SELECT status, COUNT(*) as cnt FROM outbox_events GROUP BY status"
            ).fetchall()
        stats = {"PENDING": 0, "SENT": 0, "FAILED": 0, "DEAD_LETTER": 0}
        for r in rows:
            stats[r["status"]] = r["cnt"]
        return stats

    # -------------------------------------------------------------------------
    # 3. PERSISTENT CONVERSATION CHECKPOINTS (Replaces Solace-AI InMemorySaver)
    # -------------------------------------------------------------------------
    def save_session_checkpoint(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Persist full therapy session state to SQLite/PostgreSQL."""
        now = datetime.now(timezone.utc).isoformat()
        session_id = state["session_id"]
        user_id = state["user_id"]
        with self.connection() as conn:
            conn.execute(
                """
                INSERT INTO session_checkpoints (
                    session_id, user_id, phase, mode, technique,
                    current_step, pushback_level, pushback_attempts_at_step,
                    pre_intensity, post_intensity, mood_polarity, energy_level,
                    outcome, state_json, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(session_id) DO UPDATE SET
                    phase = excluded.phase,
                    mode = excluded.mode,
                    technique = excluded.technique,
                    current_step = excluded.current_step,
                    pushback_level = excluded.pushback_level,
                    pushback_attempts_at_step = excluded.pushback_attempts_at_step,
                    pre_intensity = excluded.pre_intensity,
                    post_intensity = excluded.post_intensity,
                    mood_polarity = excluded.mood_polarity,
                    energy_level = excluded.energy_level,
                    outcome = excluded.outcome,
                    state_json = excluded.state_json,
                    updated_at = excluded.updated_at
                """,
                (
                    session_id,
                    user_id,
                    state.get("phase", "Phase1_CheckIn"),
                    state.get("mode", "instrumental"),
                    state.get("technique"),
                    int(state.get("current_step", 0)),
                    state.get("pushback_level", "moderate"),
                    int(state.get("pushback_attempts_at_step", 0)),
                    int(state.get("pre_intensity", 5)),
                    state.get("post_intensity"),
                    int(state.get("mood_polarity", 0)),
                    int(state.get("energy_level", 0)),
                    state.get("outcome", "in-progress"),
                    json.dumps(state, ensure_ascii=False),
                    now,
                ),
            )
        return state

    def load_session_checkpoint(
        self, session_id: str, user_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Load a persisted session checkpoint with tenant isolation (RLS equivalent)."""
        with self.connection() as conn:
            if user_id:
                row = conn.execute(
                    "SELECT state_json FROM session_checkpoints WHERE session_id = ? AND user_id = ?",
                    (session_id, user_id),
                ).fetchone()
            else:
                row = conn.execute(
                    "SELECT state_json FROM session_checkpoints WHERE session_id = ?",
                    (session_id,),
                ).fetchone()
        if not row:
            return None
        return json.loads(row["state_json"])

    # -------------------------------------------------------------------------
    # 4. ZERO-KNOWLEDGE E2EE SYNC BLOBS (Last-Write-Wins, Tenant Isolated)
    # -------------------------------------------------------------------------
    def upsert_e2ee_blob(
        self,
        user_id: str,
        blob_id: str,
        entity_type: str,
        ciphertext_b64: str,
        iv_b64: str,
        auth_tag_b64: str,
        client_updated_at: str,
        key_version: int = 1,
    ) -> Dict[str, Any]:
        """Store client-encrypted AES-GCM blob with Last-Write-Wins timestamp resolution."""
        now = datetime.now(timezone.utc).isoformat()
        with self.connection() as conn:
            existing = conn.execute(
                "SELECT user_id, client_updated_at FROM e2ee_sync_blobs WHERE blob_id = ?",
                (blob_id,),
            ).fetchone()
            if existing and existing["user_id"] != user_id:
                raise PermissionError("RLS violation: cannot overwrite another user's E2EE blob.")
            if existing and existing["client_updated_at"] > client_updated_at:
                return {
                    "blob_id": blob_id,
                    "status": "skipped_older_timestamp",
                    "kept_timestamp": existing["client_updated_at"],
                }
            conn.execute(
                """
                INSERT INTO e2ee_sync_blobs (
                    blob_id, user_id, entity_type, ciphertext_b64,
                    iv_b64, auth_tag_b64, key_version, client_updated_at, server_received_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(blob_id) DO UPDATE SET
                    entity_type = excluded.entity_type,
                    ciphertext_b64 = excluded.ciphertext_b64,
                    iv_b64 = excluded.iv_b64,
                    auth_tag_b64 = excluded.auth_tag_b64,
                    key_version = excluded.key_version,
                    client_updated_at = excluded.client_updated_at,
                    server_received_at = excluded.server_received_at
                """,
                (
                    blob_id,
                    user_id,
                    entity_type,
                    ciphertext_b64,
                    iv_b64,
                    auth_tag_b64,
                    key_version,
                    client_updated_at,
                    now,
                ),
            )
        return {
            "blob_id": blob_id,
            "status": "upserted",
            "client_updated_at": client_updated_at,
            "server_received_at": now,
        }

    def pull_e2ee_blobs(
        self, user_id: str, since_timestamp: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Pull encrypted blobs strictly isolated to the authenticated `user_id`."""
        with self.connection() as conn:
            if since_timestamp:
                rows = conn.execute(
                    """
                    SELECT * FROM e2ee_sync_blobs
                    WHERE user_id = ? AND client_updated_at >= ?
                    ORDER BY client_updated_at ASC
                    """,
                    (user_id, since_timestamp),
                ).fetchall()
            else:
                rows = conn.execute(
                    """
                    SELECT * FROM e2ee_sync_blobs
                    WHERE user_id = ?
                    ORDER BY client_updated_at ASC
                    """,
                    (user_id,),
                ).fetchall()
        return [dict(r) for r in rows]

    # -------------------------------------------------------------------------
    # 5. TIME-LIMITED ZERO-KNOWLEDGE CLINICIAN SHARE SNAPSHOTS
    # -------------------------------------------------------------------------
    def create_clinician_share_link(
        self,
        user_id: str,
        encrypted_payload_b64: str,
        iv_b64: str,
        auth_tag_b64: str,
        ttl_hours: int = 24,
        report_period_days: int = 30,
        share_token: Optional[str] = None,
        now_iso: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Store an encrypted Clinician Share Snapshot (ciphertext + IV + auth_tag + expiry only).
        Never accepts or stores the `#key=...` decryption fragment.
        """
        if "#key=" in encrypted_payload_b64:
            raise ValueError("Zero-knowledge violation: decryption key fragment must never be sent to server.")

        created_dt = (
            datetime.fromisoformat(now_iso.replace("Z", "+00:00"))
            if now_iso
            else datetime.now(timezone.utc)
        )
        from datetime import timedelta

        expires_dt = created_dt + timedelta(hours=max(1, int(ttl_hours)))
        created_at = created_dt.isoformat()
        expires_at = expires_dt.isoformat()
        token = share_token or f"shr_{uuid.uuid4().hex[:20]}"

        with self.connection() as conn:
            conn.execute(
                """
                INSERT INTO clinician_share_links (
                    share_token, user_id, encrypted_payload_b64, iv_b64,
                    auth_tag_b64, report_period_days, created_at, expires_at, revoked
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
                ON CONFLICT(share_token) DO UPDATE SET
                    encrypted_payload_b64 = excluded.encrypted_payload_b64,
                    iv_b64 = excluded.iv_b64,
                    auth_tag_b64 = excluded.auth_tag_b64,
                    report_period_days = excluded.report_period_days,
                    created_at = excluded.created_at,
                    expires_at = excluded.expires_at,
                    revoked = 0
                """,
                (
                    token,
                    user_id,
                    encrypted_payload_b64,
                    iv_b64,
                    auth_tag_b64,
                    int(report_period_days),
                    created_at,
                    expires_at,
                ),
            )
            self._append_audit_in_tx(
                conn=conn,
                user_id=user_id,
                event_type="CLINICIAN_SHARE_LINK_CREATED",
                severity="LOW",
                payload={
                    "share_token": token,
                    "report_period_days": int(report_period_days),
                    "expires_at": expires_at,
                    "zero_knowledge_fragment_only": True,
                },
            )

        return {
            "share_token": token,
            "user_id": user_id,
            "report_period_days": int(report_period_days),
            "created_at": created_at,
            "expires_at": expires_at,
            "ttl_hours": int(ttl_hours),
            "revoked": False,
            "zero_knowledge": True,
            "key_stored_on_server": False,
        }

    def revoke_clinician_share_link(
        self, share_token: str, user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Revoke an existing clinician share link immediately."""
        with self.connection() as conn:
            row = conn.execute(
                "SELECT * FROM clinician_share_links WHERE share_token = ?",
                (share_token,),
            ).fetchone()
            if not row:
                return {"found": False, "share_token": share_token, "revoked": False}
            if user_id and row["user_id"] != user_id:
                raise PermissionError("RLS violation: cannot revoke another user's clinician share link.")
            conn.execute(
                "UPDATE clinician_share_links SET revoked = 1 WHERE share_token = ?",
                (share_token,),
            )
            self._append_audit_in_tx(
                conn=conn,
                user_id=row["user_id"],
                event_type="CLINICIAN_SHARE_LINK_REVOKED",
                severity="LOW",
                payload={"share_token": share_token},
            )
        return {"found": True, "share_token": share_token, "revoked": True}

    def get_clinician_share_link(
        self, share_token: str, now_iso: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Retrieve an encrypted clinician share snapshot if and only if it exists,
        is not revoked, and has not expired.
        """
        with self.connection() as conn:
            row = conn.execute(
                "SELECT * FROM clinician_share_links WHERE share_token = ?",
                (share_token,),
            ).fetchone()
        if not row:
            return {"status": "not_found", "share_token": share_token}

        if int(row["revoked"]) == 1:
            return {
                "status": "revoked",
                "share_token": share_token,
                "revoked": True,
                "expired": False,
            }

        now_dt = (
            datetime.fromisoformat(now_iso.replace("Z", "+00:00"))
            if now_iso
            else datetime.now(timezone.utc)
        )
        expires_dt = datetime.fromisoformat(str(row["expires_at"]).replace("Z", "+00:00"))
        if now_dt >= expires_dt:
            return {
                "status": "expired",
                "share_token": share_token,
                "revoked": False,
                "expired": True,
                "expires_at": row["expires_at"],
            }

        return {
            "status": "active",
            "share_token": row["share_token"],
            "user_id": row["user_id"],
            "encrypted_payload_b64": row["encrypted_payload_b64"],
            "iv_b64": row["iv_b64"],
            "auth_tag_b64": row["auth_tag_b64"],
            "report_period_days": int(row["report_period_days"]),
            "created_at": row["created_at"],
            "expires_at": row["expires_at"],
            "revoked": False,
            "expired": False,
            "zero_knowledge": True,
            "key_stored_on_server": False,
        }

