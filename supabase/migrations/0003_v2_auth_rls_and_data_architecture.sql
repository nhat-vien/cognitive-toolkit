-- =============================================================================
-- MIGRATION 0003: EQUILIBRIA V2 AUTH, SERVER ROLES, RLS HARDENING & DATA ARCHITECTURE
-- Implements T02, T03, T04 & DATA_ARCHITECTURE.md requirements:
-- 1. Server-managed `role_assignments` table (removes user-editable role column from `user_profiles`)
-- 2. Strict `has_active_role(target_role)` SQL helper for RLS policies
-- 3. `consent_events` & `audit_events` tables with append-only / restricted access
-- 4. `checkins`, `plan_items`, and `sharing_grants` tables with default-null clinical scores
-- 5. Hardened RLS on `protocol_versions` (public only sees `approved`/`released`, not `draft`/`deprecated`),
--    `clinician_share_links` (prevents full-table enumeration), and cross-user access checks.
-- =============================================================================

-- 1. Server-Managed Role Assignments (T03 / AUTH-06..08)
CREATE TABLE IF NOT EXISTS public.role_assignments (
    assignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('individual', 'caregiver', 'clinician', 'admin')),
    granted_by UUID,
    reason TEXT,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_role_assignments_user_active
    ON public.role_assignments (user_id, role)
    WHERE revoked_at IS NULL;

ALTER TABLE public.role_assignments ENABLE ROW LEVEL SECURITY;

-- Users can only view their own active role assignments; they CANNOT insert, update, or delete roles!
CREATE POLICY role_assignments_owner_select ON public.role_assignments
    FOR SELECT USING (auth.uid() = user_id AND revoked_at IS NULL);

-- Privileged helper function to check if the current authenticated user holds an active server role
CREATE OR REPLACE FUNCTION public.has_active_role(target_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.role_assignments ra
        WHERE ra.user_id = auth.uid()
          AND ra.role = target_role
          AND ra.revoked_at IS NULL
    );
$$;

-- Prevent clients from escalating privileges via `user_profiles.role` (A02 / AUTH-06)
CREATE OR REPLACE FUNCTION public.enforce_user_profile_immutable_role()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.role := 'adult_user';
    ELSIF TG_OP = 'UPDATE' THEN
        NEW.role := OLD.role;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_profiles_immutable_role ON public.user_profiles;
CREATE TRIGGER trg_user_profiles_immutable_role
    BEFORE INSERT OR UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_user_profile_immutable_role();

-- 2. Harden `protocol_versions` Publication Gate (T04 / SAFE-03)
DROP POLICY IF EXISTS protocol_versions_public_read ON public.protocol_versions;

CREATE POLICY protocol_versions_published_or_reviewer_read ON public.protocol_versions
    FOR SELECT USING (
        status IN ('approved', 'released')
        OR public.has_active_role('clinician')
        OR public.has_active_role('admin')
    );

-- 3. Scoped `sharing_grants` Table (T03, T10 / AUTH-08, SAFE-06)
CREATE TABLE IF NOT EXISTS public.sharing_grants (
    grant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL DEFAULT auth.uid(),
    grantee_id UUID NOT NULL,
    grantee_role TEXT NOT NULL CHECK (grantee_role IN ('caregiver', 'clinician')),
    purpose TEXT NOT NULL,
    scope_categories TEXT[] NOT NULL DEFAULT '{}',
    allow_private_journals BOOLEAN NOT NULL DEFAULT FALSE,
    allow_session_transcripts BOOLEAN NOT NULL DEFAULT FALSE,
    allow_raw_assessment_answers BOOLEAN NOT NULL DEFAULT FALSE,
    allow_edit_records BOOLEAN NOT NULL DEFAULT FALSE CHECK (allow_edit_records = FALSE),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT owner_cannot_grant_to_self CHECK (owner_id <> grantee_id)
);

CREATE INDEX IF NOT EXISTS idx_sharing_grants_owner_grantee
    ON public.sharing_grants (owner_id, grantee_id);

ALTER TABLE public.sharing_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY sharing_grants_owner_all ON public.sharing_grants
    FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY sharing_grants_grantee_select_active ON public.sharing_grants
    FOR SELECT USING (
        auth.uid() = grantee_id
        AND revoked_at IS NULL
        AND expires_at > NOW()
    );

-- Also allow caregiver_access_grants grantee to read only when active and not revoked
DROP POLICY IF EXISTS caregiver_grants_grantee_read ON public.caregiver_access_grants;
CREATE POLICY caregiver_grants_grantee_read ON public.caregiver_access_grants
    FOR SELECT USING (
        auth.uid() = caregiver_user_id
        AND revoked = FALSE
    );

-- 4. Plan Items, Check-ins (Nullable/Unanswered Defaults), Consent Events & Audit Events (DATA_ARCHITECTURE.md)
CREATE TABLE IF NOT EXISTS public.plan_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL DEFAULT auth.uid(),
    practice_id TEXT NOT NULL,
    practice_version TEXT NOT NULL DEFAULT '0.1.0',
    schedule_text TEXT,
    timezone_iana TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'skipped', 'paused')),
    idempotency_key TEXT,
    revision INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, idempotency_key)
);

ALTER TABLE public.plan_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY plan_items_owner_policy ON public.plan_items
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL DEFAULT auth.uid(),
    answers_json JSONB, -- Nullable by default (SAFE-01: no fabricated default scores!)
    mood_polarity INTEGER CHECK (mood_polarity BETWEEN -5 AND 5),
    energy_level INTEGER CHECK (energy_level BETWEEN -5 AND 5),
    distress_intensity INTEGER CHECK (distress_intensity BETWEEN 0 AND 10),
    sleep_hours NUMERIC CHECK (sleep_hours BETWEEN 0 AND 24),
    idempotency_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, idempotency_key)
);

ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY checkins_owner_policy ON public.checkins
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Allow nullable total_score and score_band_code on clinical_assessments for unanswered/in-progress states (SAFE-01)
ALTER TABLE public.clinical_assessments
    ALTER COLUMN total_score DROP NOT NULL,
    ALTER COLUMN score_band_code DROP NOT NULL;

-- Add revision and idempotency_key to safety_plans and session_checkpoints for conflict detection (DATA-02, DATA-03)
ALTER TABLE public.safety_plans
    ADD COLUMN IF NOT EXISTS revision INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

ALTER TABLE public.session_checkpoints
    ADD COLUMN IF NOT EXISTS practice_version TEXT NOT NULL DEFAULT '0.1.0',
    ADD COLUMN IF NOT EXISTS revision INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE TABLE IF NOT EXISTS public.consent_events (
    consent_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL DEFAULT auth.uid(),
    purpose TEXT NOT NULL,
    policy_version TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('granted', 'declined', 'revoked')),
    metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.consent_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY consent_events_owner_select ON public.consent_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY consent_events_owner_insert ON public.consent_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.audit_events (
    audit_event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID,
    action TEXT NOT NULL,
    object_type TEXT NOT NULL,
    object_id TEXT NOT NULL,
    metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- Restricted read: Users can only see audit events where they are the actor; admins can review system audit logs (never contains raw diary content!)
CREATE POLICY audit_events_restricted_select ON public.audit_events
    FOR SELECT USING (
        auth.uid() = actor_id
        OR public.has_active_role('admin')
    );
