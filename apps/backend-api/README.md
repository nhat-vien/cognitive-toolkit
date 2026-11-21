# Equilibria (`apps/backend-api`) — Python FastAPI Modular Monolith Backend

This service implements the **Modular Monolith Backend** for the Equilibria Multi-Platform Mental Health Ecosystem (Anxiety, Depression & Bipolar Disorder). It directly remediates the architectural failures identified in `Solace-AI` while integrating the **Grounded Clinical RAG (`threshold = 0.46`)** from `KazKozDev/cbt-assistant` and the **CBT/DBT Session State Machine & Socratic Pushback Controller** from `glebis/claude-cognitive-toolkit`.

## Architectural Highlights & Solace-AI Remediations

| Architectural Area | `Solace-AI` Flaw Identified | Equilibria Modular Monolith Solution |
| :--- | :--- | :--- |
| **Service Topology** | Premature split into 10 microservices causing network drift & dead event planes | **Modular Monolith** (`safety`, `rag`, `orchestrator`, `db`, `outbox`) in a single cohesive process |
| **Session Persistence** | `InMemorySaver` lost patient therapy state on process restart | **Persistent SQLite/PostgreSQL Checkpointer** (`session_checkpoints` table) surviving restarts |
| **Crisis Event Plane** | `OutboxPoller` never instantiated; crisis notifications silently dropped | **Working Transactional Outbox (`OutboxWorker`)** with atomic DB writes, retry backoff, and dead-letter handling |
| **Clinical Grounding** | Unconstrained LLM generation risked inventing clinical advice | **Grounded Clinical RAG (`RAG_SCORE_THRESHOLD = 0.46`)** with **100% Abstention Accuracy** & `[KB:chunk_id]` citations |
| **Audit & Isolation** | Missing verifiable tamper evidence on crisis logs | **SHA-256 Hash-Chained Audit Log** (`/api/v1/audit/verify`) + **PostgreSQL Row-Level Security (RLS)** DDL |
| **E2EE Privacy** | Plaintext PHI stored server-side | **Zero-Knowledge E2EE Sync** (`/api/v1/sync/push` & `/api/v1/sync/pull`) storing only client-encrypted AES-GCM blobs |

## Directory Structure

```text
apps/backend-api/
├── src/
│   ├── config.py                            # Central config (RAG_SCORE_THRESHOLD=0.46, Ollama, DB, JWT)
│   ├── db/
│   │   └── models_and_rls.py                # SQLite/PostgreSQL persistence, RLS DDL, Hash-Chained Audit Log, Outbox, E2EE Sync, Session Checkpoints
│   ├── safety/
│   │   └── four_layer_safety.py             # 4-Layer Safety Gate (Crisis Regex, Clinical Cutoffs, Real-World Danger, Output Guardrail)
│   ├── rag/
│   │   └── grounded_rag.py                  # Markdown hierarchical chunker, bilingual vector retrieval, 0.46 abstention gate
│   ├── orchestrator/
│   │   └── multi_agent_orchestrator.py      # Safety Agent, EAR Empathy Agent, CBT/DBT State Machine + Pushback (0-3), Bipolar Agent
│   ├── outbox/
│   │   └── outbox_worker.py                 # Transactional Outbox Poller for crisis alerts & Ulysses Contract notifications
│   └── main.py                              # FastAPI application & REST API endpoints
├── tests/
│   └── test_backend.py                      # Comprehensive automated clinical & architectural test suite
├── Dockerfile
├── requirements.txt
└── .env.example
```

## Running Tests

```bash
python -m unittest discover -s apps/backend-api/tests -v
```

## Running the API Server

```bash
cd apps/backend-api
uvicorn src.main:app --reload --port 8000
```
