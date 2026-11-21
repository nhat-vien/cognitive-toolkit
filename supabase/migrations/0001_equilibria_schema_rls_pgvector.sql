-- =============================================================================
-- EQUILIBRIA (MIND ANCHOR) — SUPABASE FULL-STACK SCHEMA (FREE TIER READY)
-- PostgreSQL 16 + pgvector + Row-Level Security (RLS) + Zero-Knowledge E2EE Sync
-- + Grounded Clinical RAG RPC (Threshold >= 0.46) + Hash-Chained Safety Audit Log
-- =============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =============================================================================
-- 2. ZERO-KNOWLEDGE E2EE SYNC BLOBS (Encrypted Client Records)
-- Stores encrypted Thought Records, Daily Bipolar Logs (-5..+5), IPSRT Anchors,
-- 48h Impulse Vault items, Worry Box items, and Ulysses Contracts.
-- The server only stores AES-GCM-256 ciphertext; decryption key never leaves client.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.e2ee_sync_blobs (
    blob_id TEXT PRIMARY KEY,
    user_id UUID NOT NULL DEFAULT auth.uid(),
    record_type TEXT NOT NULL CHECK (record_type IN (
        'cbt_dbt_session',
        'bipolar_daily_log',
        'ulysses_contract',
        'impulse_vault_48h',
        'worry_box_item',
        'exposure_hierarchy',
        'assessment_result',
        'clinician_share_snapshot'
    )),
    ciphertext_b64 TEXT NOT NULL,
    iv_b64 TEXT NOT NULL,
    auth_tag_b64 TEXT NOT NULL,
    key_id TEXT NOT NULL DEFAULT 'client-master-v1',
    client_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    server_received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_e2ee_sync_user_updated
    ON public.e2ee_sync_blobs (user_id, client_updated_at DESC);

ALTER TABLE public.e2ee_sync_blobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY e2ee_sync_tenant_select ON public.e2ee_sync_blobs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY e2ee_sync_tenant_insert ON public.e2ee_sync_blobs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY e2ee_sync_tenant_update ON public.e2ee_sync_blobs
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY e2ee_sync_tenant_delete ON public.e2ee_sync_blobs
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- 3. PERSISTENT SESSION CHECKPOINTS (Replaces Solace-AI's broken InMemorySaver)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.session_checkpoints (
    session_id TEXT PRIMARY KEY,
    user_id UUID NOT NULL DEFAULT auth.uid(),
    technique TEXT NOT NULL,
    phase TEXT NOT NULL,
    step_index INTEGER NOT NULL DEFAULT 1,
    pushback_level TEXT NOT NULL DEFAULT 'moderate' CHECK (pushback_level IN ('off', 'gentle', 'moderate', 'firm')),
    pushback_attempts_on_step INTEGER NOT NULL DEFAULT 0,
    pre_intensity INTEGER NOT NULL DEFAULT 5 CHECK (pre_intensity BETWEEN 0 AND 10),
    post_intensity INTEGER CHECK (post_intensity BETWEEN 0 AND 10),
    mood_polarity INTEGER NOT NULL DEFAULT 0 CHECK (mood_polarity BETWEEN -5 AND 5),
    energy_level INTEGER NOT NULL DEFAULT 0 CHECK (energy_level BETWEEN -5 AND 5),
    outcome TEXT NOT NULL DEFAULT 'in-progress',
    state_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.session_checkpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY session_checkpoints_tenant_policy ON public.session_checkpoints
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 4. TAMPER-EVIDENT SHA-256 HASH-CHAINED SAFETY AUDIT LOG
-- Records safety-stop events, Chain Analysis Hard Stops, and Ulysses alerts
-- without logging raw sensitive journal transcripts.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.safety_audit_logs (
    seq BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    event_type TEXT NOT NULL,
    layer_triggered INTEGER NOT NULL CHECK (layer_triggered BETWEEN 1 AND 4),
    outcome TEXT NOT NULL,
    metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    prev_hash TEXT NOT NULL,
    entry_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.safety_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY safety_audit_tenant_select ON public.safety_audit_logs
    FOR SELECT USING (auth.uid() = user_id);

-- =============================================================================
-- 5. TRANSACTIONAL OUTBOX EVENTS (For Ulysses Contract & Crisis Alerts)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.outbox_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    topic TEXT NOT NULL CHECK (topic IN (
        'crisis.safety_stop',
        'bipolar.mania_prodrome_alert',
        'bipolar.mixed_state_alert',
        'ulysses.trusted_contact_notify'
    )),
    payload_json JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PUBLISHED', 'DEAD_LETTER')),
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_outbox_pending ON public.outbox_events (status, created_at ASC);

ALTER TABLE public.outbox_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY outbox_tenant_select ON public.outbox_events
    FOR SELECT USING (auth.uid() = user_id);

-- =============================================================================
-- 6. GROUNDED CLINICAL RAG KNOWLEDGE BASE (pgvector + Threshold >= 0.46)
-- Stores CBT, TEAM-CBT, DBT, and IPSRT markdown protocol chunks.
-- Publicly readable by all authenticated & anonymous clients; write-protected.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.clinical_kb_chunks (
    chunk_id TEXT PRIMARY KEY,
    doc_id TEXT NOT NULL,
    technique_slug TEXT NOT NULL,
    therapy_modality TEXT NOT NULL CHECK (therapy_modality IN ('CBT', 'TEAM-CBT', 'DBT', 'IPSRT', 'CORE')),
    section_path TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'bilingual',
    content_markdown TEXT NOT NULL,
    -- 384-dim or 768-dim multilingual vector (paraphrase-multilingual-mpnet-base-v2 = 768)
    embedding vector(768),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.clinical_kb_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY clinical_kb_public_read ON public.clinical_kb_chunks
    FOR SELECT USING (true);

-- RPC function enforcing the Strict RAG Abstention Contract (threshold >= 0.46)
CREATE OR REPLACE FUNCTION public.match_clinical_kb_chunks(
    query_embedding vector(768),
    match_threshold FLOAT DEFAULT 0.46,
    match_count INT DEFAULT 3
)
RETURNS TABLE (
    chunk_id TEXT,
    doc_id TEXT,
    technique_slug TEXT,
    therapy_modality TEXT,
    section_path TEXT,
    content_markdown TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        kb.chunk_id,
        kb.doc_id,
        kb.technique_slug,
        kb.therapy_modality,
        kb.section_path,
        kb.content_markdown,
        1 - (kb.embedding <=> query_embedding) AS similarity
    FROM public.clinical_kb_chunks kb
    WHERE kb.embedding IS NOT NULL
      AND (1 - (kb.embedding <=> query_embedding)) >= match_threshold
    ORDER BY kb.embedding <=> query_embedding ASC
    LIMIT match_count;
END;
$$;

-- =============================================================================
-- 7. TIME-LIMITED ZERO-KNOWLEDGE CLINICIAN SHARE SNAPSHOTS
-- Patient encrypts 30-day summary in browser with an ephemeral key placed in URL
-- hash (#key=...) and stores only ciphertext + expiry here.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.clinician_share_links (
    share_token TEXT PRIMARY KEY,
    user_id UUID NOT NULL DEFAULT auth.uid(),
    ciphertext_b64 TEXT NOT NULL,
    iv_b64 TEXT NOT NULL,
    auth_tag_b64 TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.clinician_share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY clinician_share_owner_manage ON public.clinician_share_links
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY clinician_share_token_read ON public.clinician_share_links
    FOR SELECT USING (revoked = FALSE AND expires_at > NOW());
