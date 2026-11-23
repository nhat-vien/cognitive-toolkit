-- =============================================================================
-- MIGRATION 0002: CLINICAL_PROTOCOL_MASTER_PLAN.md SCHEMA ALIGNMENT
-- Adds:
-- 1. Data Provenance enum (§9.1) & Protocol Lifecycle Status enum (Appendix B)
-- 2. Conceptually separated Clinical Profile & Pathway State tables (§1.3, §2.3)
-- 3. Immutable Protocol Registry, Version & Clinical Review Approvals (§5.1-5.3)
-- 4. Personal Safety Plans (6 sections, §3.4) & Detailed Safety Events (§3.1, §9)
-- 5. Separated Medication Reminders vs. Medication Logs (§7)
-- 6. Granular Caregiver Invitations & Access Grants with Revocation (§4.7, §9)
-- 7. Evidence Content Sources & Instrument Governance Registry (§6.1, §15)
-- =============================================================================

DO $$ BEGIN
    CREATE TYPE public.data_provenance AS ENUM (
        'user_self_report',
        'questionnaire',
        'clinician_entry',
        'device_derived',
        'ai_summary_confirmed',
        'system_derived'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.protocol_lifecycle_status AS ENUM (
        'planned',
        'draft',
        'in_content_review',
        'in_clinical_review',
        'in_safety_review',
        'approved',
        'released',
        'deprecated',
        'blocked'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.pathway_workflow_state AS ENUM (
        'routine_support',
        'distress_support',
        'professional_follow_up_recommended',
        'urgent_human_support',
        'emergency_guidance'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 1. User Profiles & Explicit Consent / Age Gate (§2.1, §9)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    user_id UUID PRIMARY KEY DEFAULT auth.uid(),
    role TEXT NOT NULL DEFAULT 'adult_user' CHECK (role IN ('adult_user', 'caregiver', 'clinician')),
    age_verified_18_plus BOOLEAN NOT NULL DEFAULT FALSE,
    informed_consent_version TEXT NOT NULL,
    informed_consent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    preferred_language TEXT NOT NULL DEFAULT 'vi' CHECK (preferred_language IN ('vi', 'en')),
    country_code TEXT NOT NULL DEFAULT 'VN',
    timezone_iana TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    accessibility_preferences_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_profiles_self_policy ON public.user_profiles
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. Reported History (Explicitly NOT a clinical diagnosis — §1.3, §9)
CREATE TABLE IF NOT EXISTS public.reported_histories (
    history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL DEFAULT auth.uid(),
    reported_conditions TEXT[] NOT NULL DEFAULT '{}',
    is_clinician_confirmed_diagnosis BOOLEAN NOT NULL DEFAULT FALSE,
    provenance public.data_provenance NOT NULL DEFAULT 'user_self_report',
    notes TEXT,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.reported_histories ENABLE ROW LEVEL SECURITY;

CREATE POLICY reported_histories_self_policy ON public.reported_histories
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Clinical Assessments with Instrument Version & Provenance (§6.1-6.4, §9)
CREATE TABLE IF NOT EXISTS public.clinical_assessments (
    assessment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL DEFAULT auth.uid(),
    instrument_code TEXT NOT NULL CHECK (instrument_code IN ('PHQ-9', 'GAD-7', 'MDQ', 'ASRM', 'ISI', 'BMS', 'WHO-5', 'C-SSRS')),
    instrument_version TEXT NOT NULL,
    language_version TEXT NOT NULL DEFAULT 'vi-VN',
    raw_answers_json JSONB NOT NULL,
    total_score NUMERIC NOT NULL,
    score_band_code TEXT NOT NULL,
    is_diagnosis BOOLEAN NOT NULL DEFAULT FALSE CHECK (is_diagnosis = FALSE),
    provenance public.data_provenance NOT NULL DEFAULT 'questionnaire',
    safety_workflow_triggered BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.clinical_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY clinical_assessments_self_policy ON public.clinical_assessments
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Pathway Plans & Operational Safety Status (§1.3, §2.2-2.4, §9)
CREATE TABLE IF NOT EXISTS public.pathway_plans (
    plan_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL DEFAULT auth.uid(),
    safety_workflow_state public.pathway_workflow_state NOT NULL DEFAULT 'routine_support',
    functional_needs TEXT[] NOT NULL DEFAULT '{}',
    eligible_protocol_ids TEXT[] NOT NULL DEFAULT '{}',
    temporarily_unavailable_protocol_ids TEXT[] NOT NULL DEFAULT '{}',
    clinician_approved BOOLEAN NOT NULL DEFAULT FALSE,
    clinician_reviewer_id UUID,
    rationale_text TEXT,
    provenance public.data_provenance NOT NULL DEFAULT 'system_derived',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.pathway_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY pathway_plans_self_policy ON public.pathway_plans
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. Personal Safety Plan (6 Sections — §3.4, §9)
CREATE TABLE IF NOT EXISTS public.safety_plans (
    safety_plan_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL DEFAULT auth.uid(),
    warning_signs TEXT[] NOT NULL DEFAULT '{}',
    internal_coping_strategies TEXT[] NOT NULL DEFAULT '{}',
    distraction_people_and_places JSONB NOT NULL DEFAULT '[]'::jsonb,
    trusted_support_contacts JSONB NOT NULL DEFAULT '[]'::jsonb,
    professional_and_emergency_contacts JSONB NOT NULL DEFAULT '[]'::jsonb,
    environment_safety_steps TEXT[] NOT NULL DEFAULT '{}',
    explicit_contact_storage_consent BOOLEAN NOT NULL DEFAULT FALSE,
    reviewed_with_clinician BOOLEAN NOT NULL DEFAULT FALSE,
    provenance public.data_provenance NOT NULL DEFAULT 'user_self_report',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.safety_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY safety_plans_self_policy ON public.safety_plans
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. Deterministic Safety Events (§3.1, §9 — records guidance shown & user choice)
CREATE TABLE IF NOT EXISTS public.safety_events (
    safety_event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL DEFAULT auth.uid(),
    trigger_category TEXT NOT NULL,
    pathway_state public.pathway_workflow_state NOT NULL,
    interrupted_protocol_id TEXT,
    guidance_displayed_ids TEXT[] NOT NULL DEFAULT '{}',
    user_choice TEXT NOT NULL,
    network_offline BOOLEAN NOT NULL DEFAULT FALSE,
    review_status TEXT NOT NULL DEFAULT 'logged',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.safety_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY safety_events_self_policy ON public.safety_events
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. Separated Medication Reminders vs. Medication Logs (§7, §9)
CREATE TABLE IF NOT EXISTS public.medication_reminders (
    reminder_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL DEFAULT auth.uid(),
    medication_label TEXT NOT NULL,
    user_entered_schedule TEXT NOT NULL,
    source_type TEXT NOT NULL DEFAULT 'user_entered' CHECK (source_type IN ('user_entered', 'clinician_imported')),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.medication_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY medication_reminders_self_policy ON public.medication_reminders
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.medication_logs (
    med_log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL DEFAULT auth.uid(),
    reminder_id UUID REFERENCES public.medication_reminders(reminder_id) ON DELETE SET NULL,
    intake_status TEXT NOT NULL CHECK (intake_status IN ('taken', 'missed', 'uncertain')),
    possible_side_effect_note TEXT,
    provenance public.data_provenance NOT NULL DEFAULT 'user_self_report',
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY medication_logs_self_policy ON public.medication_logs
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. Protocol Registry, Immutable Versions, Clinical Reviews & Content Sources (§5, §9, §15)
CREATE TABLE IF NOT EXISTS public.content_sources (
    source_id TEXT PRIMARY KEY,
    citation_text TEXT NOT NULL,
    doi_or_url TEXT NOT NULL,
    publication_date TEXT NOT NULL,
    access_date DATE NOT NULL DEFAULT CURRENT_DATE,
    relevant_section TEXT NOT NULL,
    license_status TEXT NOT NULL,
    reviewer_name TEXT NOT NULL,
    supported_protocol_ids TEXT[] NOT NULL DEFAULT '{}'
);

ALTER TABLE public.content_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY content_sources_public_read ON public.content_sources
    FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.protocol_versions (
    protocol_id TEXT NOT NULL,
    version TEXT NOT NULL,
    therapy_model TEXT NOT NULL CHECK (therapy_model IN ('CBT', 'TEAM-CBT', 'DBT', 'IPSRT', 'MBCT', 'Psychoeducation', 'FFT')),
    status public.protocol_lifecycle_status NOT NULL DEFAULT 'draft',
    manifest_json JSONB NOT NULL,
    clinical_approvals_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (protocol_id, version),
    -- Constraint: A protocol cannot be marked 'approved' or 'released' without at least 1 clinical approval record
    CONSTRAINT approved_requires_clinical_signoff CHECK (
        status NOT IN ('approved', 'released')
        OR jsonb_array_length(clinical_approvals_json) >= 1
    )
);

ALTER TABLE public.protocol_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY protocol_versions_public_read ON public.protocol_versions
    FOR SELECT USING (true);

-- 9. Granular Caregiver Invitations & Access Grants (§4.7, §9)
CREATE TABLE IF NOT EXISTS public.caregiver_invitations (
    invitation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_user_id UUID NOT NULL DEFAULT auth.uid(),
    caregiver_email_hash TEXT NOT NULL,
    relationship_label TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

ALTER TABLE public.caregiver_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY caregiver_invitations_patient_policy ON public.caregiver_invitations
    FOR ALL USING (auth.uid() = patient_user_id) WITH CHECK (auth.uid() = patient_user_id);

CREATE TABLE IF NOT EXISTS public.caregiver_access_grants (
    grant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invitation_id UUID NOT NULL REFERENCES public.caregiver_invitations(invitation_id) ON DELETE CASCADE,
    patient_user_id UUID NOT NULL DEFAULT auth.uid(),
    caregiver_user_id UUID NOT NULL,
    -- Granular permissions by data category (Private journals, sessions & assessment answers FALSE by default!)
    allow_view_early_warning_plan BOOLEAN NOT NULL DEFAULT TRUE,
    allow_view_shared_fft_modules BOOLEAN NOT NULL DEFAULT TRUE,
    allow_view_rhythm_summary BOOLEAN NOT NULL DEFAULT FALSE,
    allow_view_private_journals BOOLEAN NOT NULL DEFAULT FALSE,
    allow_view_therapy_session_content BOOLEAN NOT NULL DEFAULT FALSE,
    allow_view_assessment_answers BOOLEAN NOT NULL DEFAULT FALSE,
    allow_edit_patient_clinical_records BOOLEAN NOT NULL DEFAULT FALSE CHECK (allow_edit_patient_clinical_records = FALSE),
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

ALTER TABLE public.caregiver_access_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY caregiver_grants_patient_manage ON public.caregiver_access_grants
    FOR ALL USING (auth.uid() = patient_user_id) WITH CHECK (auth.uid() = patient_user_id);
