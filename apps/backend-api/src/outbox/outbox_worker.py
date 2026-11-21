"""
Working Transactional Outbox Poller (`src/outbox/outbox_worker.py`).

Fixes `Solace-AI`'s dead event plane (where `OutboxPoller` was never instantiated and
crisis alerts were silently dropped). Flushes pending crisis alerts and Ulysses Contract
trusted-contact notifications with retry and dead-letter handling.
"""

from __future__ import annotations

import json
from typing import Any, Callable, Dict, List, Optional

from src.config import settings
from src.db.models_and_rls import ClinicalDatabase


class OutboxWorker:
    """
    Transactional Outbox Poller that reads `PENDING` / `FAILED` records from `outbox_events`,
    dispatches them to the configured transport handler, and updates status to `SENT`, `FAILED`,
    or `DEAD_LETTER`.
    """

    def __init__(
        self,
        db: ClinicalDatabase,
        transport_fn: Optional[Callable[[Dict[str, Any]], bool]] = None,
        max_retries: int = settings.outbox_max_retries,
    ) -> None:
        self.db = db
        self.transport_fn = transport_fn or self._default_transport
        self.max_retries = max_retries
        self.delivered_events: List[Dict[str, Any]] = []

    def _default_transport(self, event: Dict[str, Any]) -> bool:
        """Default in-process sink recording dispatched crisis & Ulysses Contract notifications."""
        self.delivered_events.append(
            {
                "event_id": event["event_id"],
                "user_id": event["user_id"],
                "event_type": event["event_type"],
                "destination": event["destination"],
                "payload": json.loads(event["payload_json"])
                if isinstance(event.get("payload_json"), str)
                else event.get("payload_json"),
            }
        )
        return True

    def poll_and_flush(self, batch_size: int = 50) -> Dict[str, Any]:
        """
        Poll pending outbox events and flush them through the transport handler.
        Implements retry accounting and moves exhausted events to `DEAD_LETTER`.
        """
        pending = self.db.fetch_pending_outbox_events(limit=batch_size)
        sent_ids: List[str] = []
        failed_ids: List[str] = []
        dead_letter_ids: List[str] = []

        for event in pending:
            event_id = event["event_id"]
            try:
                ok = self.transport_fn(event)
                if not ok:
                    raise RuntimeError("Transport handler returned False")
                self.db.mark_outbox_event_sent(event_id)
                sent_ids.append(event_id)
            except Exception as exc:
                new_status = self.db.mark_outbox_event_failed(
                    event_id=event_id,
                    error_msg=str(exc),
                    max_retries=self.max_retries,
                )
                if new_status == "DEAD_LETTER":
                    dead_letter_ids.append(event_id)
                else:
                    failed_ids.append(event_id)

        return {
            "polled_count": len(pending),
            "sent_count": len(sent_ids),
            "failed_count": len(failed_ids),
            "dead_letter_count": len(dead_letter_ids),
            "sent_event_ids": sent_ids,
            "failed_event_ids": failed_ids,
            "dead_letter_event_ids": dead_letter_ids,
            "outbox_stats": self.db.get_outbox_stats(),
        }
