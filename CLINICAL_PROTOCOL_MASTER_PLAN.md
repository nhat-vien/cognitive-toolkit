# CLINICAL_PROTOCOL_MASTER_PLAN.md

**Project:** Cognitive Toolkit  
**Document type:** Clinical protocol and product implementation master plan  
**Version:** 0.1.0-draft  
**Status:** Draft for clinical and product review  
**Language:** Vietnamese (clinical terms retained in English)  
**Primary population:** Adults experiencing anxiety and depressive symptoms, people with diagnosed bipolar disorder, and consenting family/caregiver supporters.

> **Important scope statement**
>
> This document is a product-design and clinical-content planning artifact. It is not a clinical practice guideline, diagnostic instrument, treatment prescription, or substitute for review by qualified mental-health professionals. No protocol in this document should be represented as clinically validated merely because it has been implemented in software. Clinical content, screening instruments, safety workflows, localization, and intended-use claims must be reviewed and approved before release.

---

## 0. Document purpose and governing principles

### 0.1 Purpose

Create one source of truth for the clinical content and executable workflows supported by Cognitive Toolkit. The document defines:

- The boundaries between screening, assessment, diagnosis, self-help skills, clinician-led treatment, and emergency response.
- A common structure for therapy protocols.
- The minimum protocol inventory for CBT, TEAM-CBT, DBT, IPSRT, MBCT, Psychoeducation, and FFT.
- Safety gates and escalation requirements.
- Measurement and review principles.
- Data, versioning, audit, and acceptance requirements for implementation.

This document complements the software architecture and implementation specification. It does not replace the repository's `SPEC.md`, architecture documents, API contracts, or implementation plan.

### 0.2 Governing principles

1. **Safety before engagement:** No ordinary exercise may override an active safety escalation.
2. **Screening is not diagnosis:** A score or questionnaire result must never be presented as a diagnosis.
3. **No autonomous treatment decisions:** The application may suggest, remind, and support practice; it must not independently diagnose, prescribe, stop medication, or make high-stakes level-of-care decisions.
4. **Protocol fidelity:** Each exercise must have a named model, intended purpose, eligibility criteria, contraindications/precautions, steps, completion criteria, and evidence references.
5. **Human review:** Clinical content and safety logic require documented review by qualified professionals.
6. **User agency:** Users can pause, skip, stop, or request human support, subject to clear safety escalation behavior.
7. **Trauma-informed and non-stigmatizing design:** Avoid blame, coercion, moralizing, and language that implies symptoms are personal failure.
8. **Privacy by design:** Collect the minimum data necessary; use explicit consent and least-privilege access.
9. **Accessible and culturally appropriate:** Validate Vietnamese language, examples, crisis pathways, and literacy level with local experts and intended users.
10. **Transparent uncertainty:** Clearly distinguish validated instruments, structured clinical interviews, educational content, experimental heuristics, and product-generated suggestions.

### 0.3 Requirement labels

Use these labels in this document and in implementation tickets:

- **[MUST]** Required for safe release.
- **[SHOULD]** Strongly recommended; deviations need rationale.
- **[MAY]** Optional capability.
- **[CLINICAL REVIEW]** Requires sign-off by a qualified clinical reviewer.
- **[LEGAL/PRIVACY REVIEW]** Requires jurisdiction-specific review.
- **[RESEARCH]** Evidence or intended use needs further investigation.

---

## 1. Scope and care boundaries

### 1.1 Intended product role

Cognitive Toolkit is a digital support and skills-practice application. Depending on the approved product claim and local regulatory assessment, it may provide:

- Psychoeducation.
- Self-monitoring and journaling.
- Guided practice of selected coping and cognitive-behavioral skills.
- Medication reminders based only on a user's or clinician-provided regimen.
- User-controlled reports for discussion with a clinician.
- Consented caregiver education and collaboration.
- Safety information and connection to human/emergency support.

### 1.2 Explicit non-goals

The application must not:

- Diagnose depression, anxiety disorders, bipolar disorder, or suicide risk.
- Infer a definitive bipolar diagnosis from MDQ or another screening score.
- Replace psychotherapy, psychiatric care, emergency assessment, or prescribed treatment.
- Recommend starting, stopping, or changing medication or dosage.
- Claim that completing an app pathway is equivalent to completing CBT, DBT, MBCT, IPSRT, or FFT delivered by a trained clinician.
- Guarantee prevention of suicide, mania, relapse, or hospitalization.
- Use engagement, streaks, or gamification to pressure a distressed user to continue.

### 1.3 Care pathways are not diagnoses

Maintain separate concepts:

- `screening_result`: score and screening interpretation.
- `reported_history`: user-reported diagnosis, symptoms, treatment, and history.
- `clinical_assessment`: assessment performed by an appropriately qualified professional.
- `current_self_reported_state`: user's current description of mood, energy, sleep, distress, and functioning.
- `safety_status`: operational state of the app's safety workflow.
- `support_plan`: skills and support options available to the user.
- `clinician_approved_plan`: plan explicitly reviewed/approved by a clinician, if this feature is in scope.

Never collapse these into one `diagnosis` or `assigned_track` field.

---

## 2. Clinical pathway architecture

### 2.1 Recommended conceptual flow

```text
Consent, age and intended-use checks
             |
             v
Role and accessibility preferences
             |
             v
Safety screening and immediate escalation
             |
             v
Screening / reported history / functional needs
             |
             v
Clinical profile (not a diagnosis)
             |
             v
User goals + current needs + clinician plan (if any)
             |
             v
Eligible skills and protocol recommendations
             |
             v
User chooses / clinician-approved pathway
             |
             v
Guided practice + self-monitoring
             |
             v
Outcome review and safety re-check
             |
             v
Continue, adapt, pause, or refer for human review
```

### 2.2 Do not use a single fixed track as a clinical conclusion

The earlier product concept used four tracks (Bipolar, DBT Core, TEAM-CBT, FFT). Retain tracks only as user-facing collections or onboarding shortcuts if useful. Do not use them as diagnostic categories or as automatic treatment assignments.

A pathway recommendation should be based on separate dimensions:

| Dimension | Examples | Product use |
|---|---|---|
| Reported/clinician-confirmed profile | Depression, anxiety, bipolar diagnosis, no diagnosis reported | Select relevant education and guardrails |
| Current self-reported state | Low mood, worry, panic-like distress, elevated energy, reduced sleep | Select safe, relevant support options |
| Safety workflow state | Routine, needs follow-up, urgent, emergency | Restrict ordinary flow and surface human support |
| Functional needs | Sleep routine, avoidance, rumination, emotion regulation, relationships | Match skills to goals |
| Preferences and readiness | Short exercises, audio, writing, caregiver involvement | Adapt delivery, not clinical indication |
| Clinician plan | User-entered or clinician-approved goals | Keep app support consistent with care plan |

### 2.3 Suggested pathway states

These are **application workflow states**, not validated clinical risk categories:

- `routine_support`
- `distress_support`
- `professional_follow_up_recommended`
- `urgent_human_support`
- `emergency_guidance`

Transitions must be governed by an approved safety specification. The app must not claim that a user is “low risk” merely because no warning condition fired.

### 2.4 State and protocol separation

A user may access different skills over time. The pathway engine should determine which protocols are eligible to be offered, not force one therapy label on the user. A protocol can be:

- Available for self-guided use.
- Available only with clinician involvement.
- Temporarily unavailable because a safety or suitability condition is present.
- Completed, paused, abandoned, or awaiting clinician review.

---

## 3. Safety and escalation requirements

### 3.1 Safety is a separate subsystem

Create a dedicated Safety Engine. Do not implement safety solely as a prompt instruction to an LLM.

The Safety Engine must have deterministic, testable rules for:

- Safety-related onboarding questions.
- Reassessment triggers.
- Emergency and urgent support screens.
- Safe interruption of an exercise.
- Contacting trusted people or local emergency services through user-initiated actions.
- Recording what guidance was displayed and what the user chose.
- Offline availability of essential safety information.

### 3.2 Safety assessment design

The product and clinical reviewers must determine the appropriate validated assessment workflow and local adaptation. Do not invent a suicide-risk score or classify risk solely from PHQ-9 item 9.

At minimum, the design review must consider:

- Thoughts of death or suicide.
- Current intent, plan, timing, and access to means, where appropriate to the approved assessment.
- Recent self-harm or suicidal behavior.
- Previous attempts or relevant history.
- Severe agitation, loss of control, psychotic symptoms, or inability to maintain immediate safety.
- Possible mania, mixed symptoms, and marked sleep/energy changes.
- Whether the person is alone and whether a trusted support person is available, where relevant.

The application must not imply that a brief questionnaire can establish that a person is safe.

### 3.3 Safety workflow behavior

**[MUST]**

- Stop or suspend the ordinary exercise when an urgent/emergency condition is identified.
- Display concise, locally appropriate instructions to contact emergency services or go to the nearest emergency department when immediate danger may be present.
- Offer a user-controlled option to contact a trusted person.
- Make clear that the app is not continuously monitored and cannot dispatch emergency help unless an explicitly implemented, tested service exists.
- Do not rely on AI-generated phone numbers or service availability. Maintain a reviewed country/region-specific directory with last-verified date.
- Do not require the user to complete a questionnaire or confirm “I am safe” before showing emergency information.
- Preserve access to safety information offline.
- Do not use a chatbot as the sole response to imminent danger.

### 3.4 Personal Safety Plan

A user-facing plan may include the following sections, completed voluntarily and ideally reviewed with a qualified professional:

1. Personal warning signs.
2. Internal coping strategies.
3. People and places that provide distraction or connection.
4. Trusted people to ask for help.
5. Professional and emergency contacts.
6. Steps to make the environment safer and reduce access to lethal means, developed with appropriate human support.

The app should allow the user to view, edit, export, and delete the plan. Avoid storing sensitive contact details without explicit consent and appropriate protection.

### 3.5 Bipolar-specific safety precautions

Do not use a single sleep threshold as a mania detector. Sleep duration is one signal among several and must be interpreted against personal baseline and context.

Potential monitoring signals for a clinician-reviewed design include:

- Reduced need for sleep (not simply insomnia).
- Elevated or irritable mood.
- Increased energy or goal-directed activity.
- Unusual talkativeness or racing thoughts.
- Increased impulsivity or risky behavior.
- Significant deviation from personal routine.
- Psychotic symptoms or severe functional impairment.

If the user reports signs that may indicate mania, mixed symptoms, psychosis, or rapid deterioration, the app should recommend prompt human clinical contact according to the approved escalation protocol. It must not attempt to manage the episode through productivity, activation, or intensive self-help exercises.

### 3.6 TIPP and physiological techniques

TIPP content requires clinical review and safe alternatives. Do not prescribe ice immersion, intense exercise, or breath-holding as universally safe. Provide gentle alternatives and clear stop instructions. Screen for relevant medical precautions as approved by the clinical reviewer. Avoid forceful or prolonged breathing instructions that may worsen dizziness or panic.

---

## 4. Protocol catalog and implementation inventory

Each therapy is a family of protocols, not one generic exercise. The following inventory is a planning list; inclusion does not imply that every protocol is suitable for every user or can be delivered safely without a clinician.

### 4.1 CBT — Cognitive Behavioral Therapy

**Product purpose:** Support recognition of links among situations, thoughts, emotions, physical sensations, and behaviors; practice selected cognitive and behavioral skills.

**Candidate protocol inventory:**

| ID | Protocol | Core user outcome | Delivery boundary |
|---|---|---|---|
| `CBT_THOUGHT_RECORD` | Structured thought record | Examine an automatic thought and develop a more balanced perspective | Self-guided with stop/skip option |
| `CBT_COGNITIVE_REAPPRAISAL` | Evidence and alternative explanations | Reduce rigid or unhelpful interpretations | Avoid arguing with or invalidating the user |
| `CBT_BEHAVIORAL_ACTIVATION` | Values/activities and activity monitoring | Reintroduce meaningful, manageable activity | Adapt for bipolar safety; no high-energy activation during possible mood elevation |
| `CBT_PROBLEM_SOLVING` | Define problem, options, plan, review | Address practical problems | Self-guided for everyday problems |
| `CBT_WORRY_MONITORING` | Identify worry patterns | Distinguish solvable problems from hypothetical worry | GAD-specific content requires clinical review |
| `CBT_INTOLERANCE_UNCERTAINTY` | Work with uncertainty | Practice tolerating uncertainty | Clinician-reviewed structured pathway preferred |
| `CBT_EXPOSURE_PLANNING` | Build a graded exposure plan | Reduce avoidance and learn from safe approach behavior | Planning may be digital; complex exposure should be clinician-guided |
| `CBT_PANIC_PSYCHOEDUCATION` | Understand panic cycle | Understand bodily sensations and fear cycle | Do not imply medical symptoms are always anxiety |
| `CBT_INTEROCEPTIVE_EXPOSURE` | Clinically designed exposure to bodily sensations | Address fear of bodily sensations | Clinician-led/approved; medical screening and supervision requirements |
| `CBT_SOCIAL_ANXIETY` | Social situation formulation and practice | Reduce avoidance and safety behaviors | Exposure hierarchy requires review |
| `CBT_RELAPSE_PREVENTION` | Identify learning and warning signs | Maintain gains and plan next steps | Not a substitute for clinical follow-up |

**Minimum session structure:**

1. Consent and suitability check.
2. Identify one specific situation or goal.
3. Explain the skill in plain language.
4. Guide the user through a small number of structured steps.
5. Check distress and user experience without treating score change as proof of efficacy.
6. Summarize learning and one optional next step.
7. Re-check safety if concerning content emerged.

### 4.2 TEAM-CBT

**Product purpose:** Add structured collaboration, empathy, agenda setting, and exploration of ambivalence to cognitive-behavioral work.

**Candidate protocol inventory:**

- `TEAM_SESSION_AGENDA`: collaboratively select a session focus.
- `TEAM_EMPATHY_EXPLORATION`: reflect and clarify the user's experience without rushing to correction.
- `TEAM_PARADOXICAL_AGENDA`: explore perceived advantages and disadvantages of change, only when appropriate and without implying that symptoms are chosen.
- `TEAM_POSITIVE_REFRAMING`: identify understandable functions or protective intentions behind a pattern without romanticizing suffering.
- `TEAM_COST_BENEFIT_ANALYSIS`: examine short-term and long-term costs/benefits.
- `TEAM_MOTIVATION_CHECK`: ask about readiness and barriers.
- `TEAM_SKILL_REVIEW`: review practice and collaboratively choose a next step.

**Important boundary:** TEAM-CBT is a structured approach with specific methods and therapist competencies. A simplified app flow must be labeled as a self-reflection aid, not as full TEAM-CBT treatment. Do not use “resistance” language to blame users or infer hidden motives. Users may decline any exercise.

### 4.3 DBT — Dialectical Behavior Therapy skills

Organize skills using the four commonly taught skills domains. Do not claim that an app's skills library constitutes comprehensive DBT, which may include a structured treatment program and therapist/team components.

| Domain | Candidate skill protocols |
|---|---|
| Mindfulness | `DBT_WISE_MIND`, `DBT_OBSERVE_DESCRIBE`, `DBT_NONJUDGMENTAL_STANCE`, `DBT_ONE_MINDFULLY` |
| Distress Tolerance | `DBT_STOP`, `DBT_TIPP_SAFE_OPTIONS`, `DBT_ACCEPTS`, `DBT_SELF_SOOTHE`, `DBT_PROS_CONS`, `DBT_RADICAL_ACCEPTANCE` |
| Emotion Regulation | `DBT_EMOTION_NAMING`, `DBT_CHECK_THE_FACTS`, `DBT_OPPOSITE_ACTION`, `DBT_PLEASE`, `DBT_BUILD_POSITIVE_EXPERIENCES` |
| Interpersonal Effectiveness | `DBT_DEAR_MAN`, `DBT_GIVE`, `DBT_FAST`, `DBT_BOUNDARY_SETTING` |

**DBT module requirements:**

- Explain when the skill may be useful and when it may not be suitable.
- Offer brief, accessible steps and a non-writing alternative.
- Include a stop/exit action.
- Do not imply a skill will always reduce distress.
- Distinguish crisis-survival skills from longer-term emotion-regulation work.
- Do not use the app to coach dangerous confrontation or coercive relationship situations.
- Include clinician guidance for users who need comprehensive DBT.

### 4.4 IPSRT — Interpersonal and Social Rhythm Therapy

**Product purpose:** Support regularity in daily social rhythms and help users notice changes that may be relevant to mood stability, particularly for people with bipolar disorder.

**Candidate components:**

- `IPSRT_RHYTHM_BASELINE`: establish an individualized routine baseline.
- `IPSRT_DAILY_RHYTHM_LOG`: record selected daily rhythm anchors.
- `IPSRT_SOCIAL_EVENT_LOG`: note events and interpersonal changes that may disrupt routine.
- `IPSRT_RHYTHM_REVIEW`: compare current patterns with the user's own baseline.
- `IPSRT_ROUTINE_PLANNING`: collaboratively plan feasible routine adjustments.
- `IPSRT_EARLY_WARNING_PLAN`: document individually identified warning signs and agreed responses.
- `IPSRT_CLINICIAN_REPORT`: user-controlled summary for clinical discussion.

**Data design cautions:**

- Do not label an invented weighted score as a validated Social Rhythm Metric.
- If a published measure is implemented, preserve its exact definition, scoring, attribution, and licensing requirements.
- Store raw timestamps and timezone context where needed; derive summary values transparently.
- Allow missing entries; do not punish users for irregular data.
- Compare against personal baseline rather than a universal “perfect schedule.”
- Track perceived need for sleep separately from hours slept.
- Do not diagnose mania or make medication recommendations from rhythm data.

### 4.5 MBCT — Mindfulness-Based Cognitive Therapy

**Product purpose:** Provide structured mindfulness and cognitive-awareness practices as an adjunctive skills resource.

**Candidate learning sequence:**

1. `MBCT_AUTOMATIC_PILOT`
2. `MBCT_BODY_SCAN`
3. `MBCT_MINDFUL_BREATHING`
4. `MBCT_PRESENT_MOMENT`
5. `MBCT_ALLOWING_AND_ACCEPTING`
6. `MBCT_THOUGHTS_ARE_NOT_FACTS`
7. `MBCT_RESPONDING_NOT_REACTING`
8. `MBCT_RELAPSE_AWARENESS`

**Requirements and cautions:**

- Audio duration options may be offered, but audio completion alone must not be described as completion of an MBCT course.
- Provide grounding or eyes-open alternatives.
- Allow users to stop if practice increases distress, dissociation, agitation, or unwanted memories.
- Do not imply mindfulness is appropriate in every acute state.
- Full MBCT is a structured program; label app content as mindfulness skills or MBCT-informed practice unless the complete program and delivery requirements are met.

### 4.6 Psychoeducation

Create reviewed, versioned learning modules:

- Understanding depression.
- Understanding anxiety and worry.
- Understanding panic symptoms and when to seek medical assessment.
- Understanding bipolar disorder and mood episodes.
- Sleep, routine, and mood.
- Medication conversations and adherence support.
- Recognizing early warning signs.
- How to support a family member.
- How to prepare for a clinical appointment.
- Myths, stigma, and self-compassion.

Each article must show author/reviewer, source references, publication/review date, intended audience, and a clear statement of limitations. Avoid presenting simplified neurobiology as a complete explanation of a person's condition.

### 4.7 FFT — Family-Focused Therapy / family support

Distinguish between a full clinician-delivered FFT program and an app-based family support feature.

**Candidate components:**

- `FFT_PSYCHOEDUCATION`: shared understanding of the condition and treatment.
- `FFT_COMMUNICATION_LISTENING`: active listening and clear communication.
- `FFT_COMMUNICATION_PRACTICE`: structured expression of needs and requests.
- `FFT_PROBLEM_SOLVING`: define a shared problem, brainstorm options, select and review a plan.
- `FFT_EARLY_WARNING_PLAN`: agree on individually relevant warning signs and support actions.
- `FFT_CAREGIVER_SELF_CARE`: boundaries, stress awareness, and support for caregivers.

**Privacy and consent requirements:**

- Patient controls whether a caregiver is invited.
- Consent must be granular by data category and purpose.
- Do not expose private journal entries, therapy-session content, or assessment answers by default.
- Provide access review, revocation, and an audit trail.
- Do not allow a caregiver to impersonate the patient or edit clinical records.
- Family participation must not be assumed safe or appropriate in every relationship.

---

## 5. Protocol specification format

Every executable protocol must use a common metadata and workflow contract. The exact schema must be reconciled with the repository's technical specification before implementation.

### 5.1 Required metadata

| Field | Description |
|---|---|
| `protocol_id` | Stable machine-readable identifier |
| `title` | User-facing title |
| `therapy_model` | CBT, TEAM-CBT, DBT, IPSRT, MBCT, Psychoeducation, FFT |
| `version` | Immutable protocol version |
| `status` | draft, clinical_review, approved, deprecated |
| `intended_audience` | User, caregiver, clinician-assisted |
| `intended_use` | Education, self-monitoring, skills practice, clinician-assisted |
| `goals` | Explicit learning/practice objectives |
| `eligibility` | Approved inclusion conditions |
| `precautions` | Conditions requiring caution or review |
| `contraindications` | Conditions where the protocol must not be offered |
| `safety_requirements` | Required safety state and escalation behavior |
| `estimated_duration` | Approximate duration, not a performance target |
| `steps` | Ordered workflow steps |
| `completion_criteria` | What counts as a completed session |
| `outcome_fields` | Data recorded, with purpose |
| `evidence_references` | Source citations and version |
| `clinical_approvals` | Reviewer, role, date, scope |
| `localization` | Language and regional review status |

### 5.2 Example protocol manifest (illustrative only)

```yaml
protocol_id: CBT_THOUGHT_RECORD
title: Examine an automatic thought
therapy_model: CBT
version: 0.1.0
status: draft
intended_audience:
  - adult_user
intended_use:
  - guided_skills_practice

goals:
  - identify a situation and associated automatic thought
  - consider evidence and alternative perspectives

eligibility:
  - safety_engine_allows_routine_practice
  - user_provides_informed_consent

precautions:
  - user_reports_increased_distress
  - user_requests_human_support

contraindications:
  - active_emergency_workflow

steps:
  - id: choose_situation
    type: structured_input
    required: true
  - id: identify_thought
    type: guided_reflection
    required: false
  - id: identify_emotion
    type: emotion_check_in
    required: false
  - id: examine_evidence
    type: guided_reflection
    required: false
  - id: consider_alternative
    type: guided_reflection
    required: false
  - id: summarize_learning
    type: summary
    required: false

completion:
  allow_partial_completion: true
  allow_user_abort: true
  save_session: explicit_user_consent

safety:
  recheck_on_concerning_disclosure: true
  escalate_to_safety_engine: true
```

This example is a software-contract illustration, not a clinically approved CBT protocol.

### 5.3 Protocol lifecycle

```text
draft
  -> content_review
  -> clinical_review
  -> safety_review
  -> localization_review
  -> approved
  -> released
  -> deprecated
```

No protocol may move to `approved` without named reviewers and recorded evidence. A change to steps, eligibility, safety behavior, scoring, or intended use requires a new version and review.

---

## 6. Assessment and measurement framework

### 6.1 Instrument governance

For every questionnaire or scale, maintain:

- Instrument name and version.
- Intended purpose (screening, symptom monitoring, or outcome measure).
- Validated population and language version.
- Full item source and permission/licensing status.
- Exact administration instructions and recall period.
- Scoring implementation and unit tests.
- Interpretation source and limitations.
- Safety response for relevant items.
- Date and identity/role of reviewer.

Do not assume an English-language validation automatically validates a Vietnamese translation or a different population.

### 6.2 Candidate measures to review

The following is an inventory for clinical review, not a directive to deploy every instrument:

| Measure | Potential role | Key limitation |
|---|---|---|
| PHQ-9 | Depressive symptom screening/monitoring | Not a diagnosis; item 9 needs a separate safety workflow |
| GAD-7 | Anxiety symptom screening/monitoring | Does not identify every anxiety disorder |
| MDQ | Bipolar-spectrum screening aid | Positive result is not a bipolar diagnosis |
| ASRM | Self-reported manic symptom monitoring | Not a standalone diagnosis or emergency assessment |
| ISI | Insomnia symptom measure | Does not establish cause of sleep difficulty |
| Sleep diary | Pattern monitoring | Data quality and burden need consideration |
| C-SSRS or another approved suicide assessment | Structured suicide-related assessment | Requires exact version, training/administration policy, and clinical governance |
| WHO-5 | Well-being monitoring | Not a diagnostic instrument |

### 6.3 Score interpretation and reassessment

- Preserve raw answers, total score, instrument version, date, and context.
- Display score bands only when the selected version and source support them.
- Avoid presenting small score changes as definitive treatment response.
- Do not automatically switch therapy or move a user to a “maintenance phase” based on one score threshold.
- Consider symptom trajectory, functioning, safety, user goals, adverse experience, and clinician input.
- Define a clinician-approved reassessment schedule; do not assume every instrument should be repeated every 14 days.
- Minimize questionnaire burden and explain why a reassessment is being requested.

### 6.4 Outcome domains

Where appropriate and consented, monitor more than symptom scores:

- User-defined functioning goals.
- Sleep and daily rhythm.
- Distress before/after a skill (as subjective feedback, not proof of efficacy).
- Exercise usability and acceptability.
- Adverse or unwanted experiences.
- Help-seeking and follow-up actions.
- User-reported quality of life or well-being using an approved measure.

---

## 7. Medication support

Medication features are reminders and record-keeping tools only.

**[MUST]**

- A regimen must be entered by the user or imported from a verified, consented source.
- Show that the app does not prescribe or verify the appropriateness of the regimen.
- Never recommend dose changes, discontinuation, doubling missed doses, or substitutions.
- Provide a neutral way to record a missed dose or possible side effect.
- Encourage users to discuss medication concerns with their prescriber or pharmacist.
- Keep medication data private and access-controlled.
- Clearly distinguish a reminder from confirmation that a medication was actually taken.

---

## 8. AI assistant boundaries

### 8.1 Permitted roles

The AI may:

- Explain approved educational content in simpler language.
- Help the user navigate an approved protocol.
- Ask the next approved question in a protocol.
- Summarize the user's own entries with confirmation.
- Suggest from a clinician-reviewed list of eligible skills.
- Encourage professional help when defined conditions are met.
- Help prepare questions for a clinician.

### 8.2 Prohibited roles

The AI must not:

- Diagnose or rule out a disorder.
- Assign a definitive clinical risk level.
- Invent or modify a therapy protocol.
- Present generated content as a validated intervention.
- Recommend medication changes.
- Encourage exposure, activation, intense exercise, sleep restriction, or other potentially destabilizing activity outside approved protocol rules.
- Tell a user that they are safe based on absence of detected keywords.
- Promise confidentiality beyond the actual product privacy policy.
- Claim a clinician has reviewed content when no such review occurred.

### 8.3 Retrieval and response requirements

- Retrieve only from an approved, versioned knowledge base for clinical claims.
- Store source, version, and review date with content.
- Separate retrieved facts from generated supportive language.
- If retrieval is missing or conflicting, say that the app cannot provide a reliable answer and offer human support.
- Never let retrieved documents override the deterministic Safety Engine.
- Log protocol ID/version and relevant source IDs for audit, subject to data-minimization and retention policy.

### 8.4 Conversation handling

- Use short, nonjudgmental prompts.
- Ask one question at a time when the user is distressed.
- Do not pressure users to disclose trauma or highly sensitive information.
- Allow “skip”, “pause”, “stop”, and “talk to a person” controls.
- Do not simulate a therapist relationship or imply continuous monitoring.

---

## 9. Data model and audit requirements

The following is a conceptual entity inventory. Final names and relations must be aligned with the current repository schema.

| Entity | Purpose |
|---|---|
| `UserProfile` | Preferences, role, consent references |
| `ReportedHistory` | User-reported history; not a diagnosis |
| `ClinicalAssessment` | Assessment result, instrument version, date |
| `SafetyEvent` | Safety trigger, action shown, user choice, review status |
| `SafetyPlan` | User-authored support plan |
| `ClinicalProfile` | Structured profile with provenance |
| `PathwayPlan` | Eligible/selected support plan and rationale |
| `TherapyProtocol` | Protocol metadata and current approved version |
| `ProtocolVersion` | Immutable version and approval records |
| `TherapySession` | Session state and outcome |
| `SessionStep` | User progress and responses, with consent |
| `DailyMoodLog` | Mood, energy, functioning, optional notes |
| `SocialRhythmLog` | User-selected routine anchors |
| `MedicationReminder` | Reminder configuration |
| `MedicationLog` | User-reported taken/missed/uncertain status |
| `RelapsePlan` | Personal warning signs and agreed actions |
| `CaregiverInvitation` | Consent and invitation lifecycle |
| `AccessGrant` | Granular caregiver permissions |
| `ClinicianReview` | Human review and approval record |
| `ContentSource` | Evidence source, version, license, review date |
| `AuditEvent` | Security- and safety-relevant system action |

### 9.1 Data provenance

For every clinical field, record whether it came from:

- User self-report.
- Questionnaire response.
- Clinician entry/review.
- Device-derived data.
- AI-generated summary (must be user-confirmed before becoming a user record).
- System-derived calculation.

Never silently convert AI inference into a clinical fact.

### 9.2 Privacy and security

- Encryption in transit and at rest.
- Least-privilege access and explicit caregiver consent.
- Data export and deletion workflows consistent with applicable law.
- Retention schedule and deletion policy.
- Audit access to sensitive records.
- Avoid collecting precise location unless required for a user-requested local emergency feature and explicitly consented.
- Separate analytics identifiers from direct identity where feasible.
- No use of sensitive health content for model training without explicit, informed, legally valid consent.

---

## 10. UX requirements

### 10.1 Primary navigation (candidate)

1. **Today:** Brief check-in, user-selected goals, optional reminders.
2. **Tools:** Skills grouped by the user's stated need, not by diagnosis alone.
3. **Progress:** User-controlled summaries and trends with plain-language limitations.
4. **Support:** Safety plan, trusted contacts, professional support, caregiver settings.

A persistent SOS entry point may be appropriate, but it must not be visually confused with a decorative feature.

### 10.2 Distress-aware interaction

- Default to short interactions.
- Do not require long-form journaling.
- Offer audio, text, and tap-based alternatives.
- Do not punish missed days or interrupted sessions.
- Use neutral language such as “pause” and “try a smaller step,” not “failed.”
- Avoid streaks and competitive gamification for symptom-related activity.
- Let users control notification timing and frequency.

### 10.3 Reports

Reports should:

- Be generated only at the user's request or under explicit consent.
- Clearly label self-reported and clinician-entered data.
- Include instrument names, versions, dates, and limitations.
- Avoid automated diagnoses or risk labels.
- Allow preview and redaction before sharing.
- Use secure export and sharing mechanisms.

---

## 11. Testing and release gates

### 11.1 Clinical content tests

- Every clinical claim has a traceable source.
- Every protocol has an owner and reviewer.
- Every instrument has verified item wording, scoring, and licensing.
- Vietnamese translation is reviewed for meaning and readability.
- Protocol steps do not contradict the approved source model.
- Content clearly distinguishes self-help skills from full treatment.

### 11.2 Safety tests

Test at least:

- Positive response to self-harm/suicide-related screening items.
- Concerning disclosure during an ordinary exercise.
- Possible mania/mixed-state indicators.
- Psychosis or severe disorganization disclosure.
- User requests emergency help.
- User declines to answer safety questions.
- User loses network access.
- Emergency directory is missing or stale.
- User is a caregiver, not the patient.
- User revokes caregiver access.
- AI output conflicts with Safety Engine.
- A protocol is deprecated while a user has an in-progress session.

Expected behavior must be specified by the clinical safety reviewer. Do not rely only on keyword matching.

### 11.3 Software tests

- Unit tests for scoring and deterministic rules.
- Schema validation for every protocol.
- State-machine transition tests.
- Access-control and consent tests.
- Encryption and secure-storage tests.
- Offline safety access tests.
- Accessibility tests.
- Localization tests.
- Regression tests for each protocol version.
- Audit-log integrity tests.
- AI red-team tests for diagnosis, medication, crisis, mania, hallucination, and prompt injection.

### 11.4 Release gates

A protocol may be released only when all applicable gates pass:

1. Product owner approval.
2. Clinical content review.
3. Safety review.
4. Evidence and licensing review.
5. Localization review.
6. Privacy/legal review.
7. Automated tests.
8. Human usability testing.
9. Release notes and rollback plan.

---

## 12. Prioritized implementation roadmap

The sequence below is a planning recommendation. Re-estimate after inspecting the current codebase and `SPEC.md`.

### Phase 0 — Repository and clinical inventory

- Compare this master plan with current `SPEC.md`, implementation plan, existing protocol files, and database schema.
- Inventory implemented, partially implemented, planned, and missing features.
- Identify contradictions and duplicate sources of truth.
- Assign clinical owners/reviewers.
- Confirm target age group, intended-use claims, operating jurisdictions, and crisis support model.

**Exit criteria:** Signed-off gap analysis and updated technical mapping.

### Phase 1 — Safety foundation

- Deterministic Safety Engine.
- Reviewed local emergency/support directory.
- Offline safety screen and user-authored Safety Plan.
- Safety event audit.
- Clear AI limitations and emergency behavior.
- Basic consent and privacy controls.

**Exit criteria:** Clinical safety review and passing safety test suite.

### Phase 2 — Core self-help skills

- Psychoeducation foundation.
- CBT Thought Record.
- Behavioral Activation with bipolar-specific restrictions.
- Problem-solving.
- DBT basic skills library with safe alternatives.
- Session pause/stop and distress-aware UX.

**Exit criteria:** Each released protocol has an approved version, evidence references, and tests.

### Phase 3 — Anxiety-specific workflows

- Worry monitoring and uncertainty skills.
- Panic psychoeducation.
- Social anxiety skills.
- Exposure planning with clinician boundary.
- Interoceptive exposure only if the clinical team approves the delivery model.

**Exit criteria:** Disorder-specific content and suitability rules reviewed.

### Phase 4 — Bipolar support and IPSRT

- Mood and sleep/rhythm baseline.
- Social rhythm logging.
- Early-warning plan.
- Clinician-facing/user-controlled report.
- Bipolar-specific restrictions and escalation.
- No automatic medication or treatment changes.

**Exit criteria:** Bipolar specialist review and validation of all alert logic.

### Phase 5 — Advanced therapy content

- TEAM-CBT-informed workflows.
- Structured MBCT-informed practice.
- FFT/family support with granular consent.
- Caregiver self-care and communication tools.

**Exit criteria:** Clear distinction between app skills and full clinician-delivered therapies.

### Phase 6 — Clinician bridge and AI assistance

- User-controlled clinical report.
- Clinician review workflow if supported.
- Grounded AI navigation of approved protocols.
- Audit, evaluation, and safety monitoring.
- Pilot evaluation before broad claims of effectiveness.

**Exit criteria:** Formal clinical, privacy, security, and product approval.

---

## 13. Open decisions requiring product/clinical approval

Do not let an AI coding agent invent answers to these questions.

1. Is the first release adults only (18+), or will adolescents be included?
2. Is the app self-help only, clinician-supported, or intended as a regulated digital therapeutic?
3. Which countries/regions will be supported at launch, and what emergency resources are verified there?
4. Will a qualified clinician review user pathways, or will the app only provide non-diagnostic skill recommendations?
5. Which Vietnamese versions of screening instruments are licensed and validated for the intended population?
6. Will caregiver mode be included in the first release?
7. What data is stored locally, synced to a server, or shared with clinicians?
8. What is the human response model for urgent messages, given that the app may not be continuously monitored?
9. Which protocols are self-guided versus clinician-assisted?
10. What evidence standard is required before a protocol is labeled “approved” or “evidence-based”?

---

## 14. Guidance for AI coding agents

When implementing this plan:

- Read the repository's `SPEC.md`, architecture documents, implementation plan, current schema, and existing protocol files first.
- Treat the repository's approved technical specification as the source of truth for software architecture.
- Treat this document as the source of truth for clinical-content planning only after clinical approval.
- Do not overwrite existing implementations before producing a gap analysis.
- Do not create new diagnosis or risk-classification logic without an approved clinical specification.
- Do not invent questionnaire items, translations, scoring thresholds, clinical references, emergency numbers, or treatment rules.
- Do not mark a protocol as clinically approved unless approval metadata exists.
- Implement protocols as versioned data/workflows where consistent with the existing architecture.
- Add tests for every deterministic scoring rule and state transition.
- Keep clinical content, UI copy, business logic, and AI prompts separate.
- Report any conflict between this plan and `SPEC.md`; do not silently resolve it.
- Work in small, reviewable changes and provide a file-level implementation plan before modifying code.

### Suggested agent task sequence

1. `AUDIT_REPOSITORY`: inventory current implementation and map it to this document.
2. `GAP_ANALYSIS`: report implemented/partial/missing/conflicting items.
3. `SCHEMA_ALIGNMENT`: propose data model changes without applying them.
4. `SAFETY_SPEC`: draft deterministic safety state machine for clinical review.
5. `PROTOCOL_TEMPLATE`: implement schema validation and one non-risky sample protocol.
6. `PROTOCOL_MIGRATION`: migrate existing protocols with version preservation.
7. `TEST_AND_REVIEW`: run unit, integration, accessibility, and safety tests.
8. `RELEASE_READINESS`: produce evidence, approval, and known-limitations report.

---

## 15. Evidence and reference register

This register must be completed and verified by the clinical content owner. The following are starting points for review, not proof that a specific app workflow is approved.

| Topic | Reference to verify |
|---|---|
| Depression | NICE guideline NG222 and relevant national/local guidance |
| Bipolar disorder | NICE guideline CG185 and relevant national/local guidance |
| Generalized anxiety and panic | NICE guideline CG113 and relevant national/local guidance |
| CBT | Relevant treatment manuals and disorder-specific clinical guidelines |
| TEAM-CBT | Primary TEAM-CBT training/manual sources; verify terminology and scope |
| DBT | Marsha Linehan's DBT skills training materials; verify copyright and adaptation rights |
| IPSRT | Primary IPSRT manuals and bipolar treatment literature |
| MBCT | Segal, Williams, and Teasdale materials; verify program fidelity and adaptation rights |
| FFT | Primary Family-Focused Therapy manuals and bipolar family intervention literature |
| Suicide safety planning | Evidence-based safety planning guidance and locally approved crisis pathways |
| Digital mental health | Applicable digital health, privacy, medical device, and AI regulations |

For each source, store: bibliographic citation, DOI/official URL, publication date, access date, relevant section/page, license/permission status, reviewer, and the exact protocol requirements it supports.

---

## Appendix A — Protocol acceptance checklist

A protocol is not ready for release unless all applicable items are complete:

- [ ] Stable protocol ID and immutable version.
- [ ] Clear intended use and intended audience.
- [ ] Clinical model and source references identified.
- [ ] Evidence and licensing reviewed.
- [ ] Eligibility, precautions, and contraindications documented.
- [ ] Safety preconditions and interruption behavior defined.
- [ ] Steps are understandable and accessible.
- [ ] User can pause, skip where appropriate, or stop.
- [ ] Completion criteria do not equate app completion with treatment completion.
- [ ] Data collection is minimal and purpose-limited.
- [ ] Outcome interpretation avoids unsupported efficacy claims.
- [ ] Vietnamese language reviewed.
- [ ] Clinical reviewer approval recorded.
- [ ] Automated tests pass.
- [ ] Known limitations visible to users and maintainers.

## Appendix B — Status vocabulary

Use consistent status values:

- `planned`
- `draft`
- `in_content_review`
- `in_clinical_review`
- `in_safety_review`
- `approved`
- `released`
- `deprecated`
- `blocked`

Do not use `completed` to imply clinical effectiveness or validation. Software implementation status and clinical approval status must be tracked separately.
