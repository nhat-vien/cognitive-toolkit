# Equilibria (Mind Anchor) — TypeScript Web & Clinician Portal (`apps/web-nextjs`)

Bilingual (Vietnamese / English) production-grade Web Application & Clinician Portal for **Anxiety**, **Depression**, and **Bipolar Disorder** built on evidence-based **CBT**, **TEAM-CBT (David Burns)**, **DBT (Marsha Linehan)**, and **IPSRT (Ellen Frank)**.

## Core Clinical & Technical Modules

1. **Adaptive Theme & UI Mode System (`src/clinical/theme-adapter.ts`)**
   - **Standard Mode**: Balanced calming slate & teal palette.
   - **Low-Energy Depression Mode**: Auto-activates when `Mood Polarity <= -3` (simplified *"One Small Step"* view, Voice Burst priority, 5-family Affect Labeling cards, **No Broken Streaks**).
   - **Low-Stimulus Mania / Dark Rest Mode**: Auto-activates when `Mood Polarity >= +2` or `ASRM >= 6` (warm dark amber palette with zero blue light, zero flashy animations, 48-Hour Impulse Vault banner, Dark Therapy wind-down timer).
   - **Persistent 1-Tap SOS Portal Button** at the top/corner of every screen.

2. **1-Tap DBT SOS Portal (`src/clinical/sos-portal.ts`)**
   - Fullscreen **Paced Breathing (`4-6` and `4-7-8`)** with visual breathing circle & **Web Audio API soothing ambient tone generator** (100% offline harmonic synthesizer, zero external MP3 dependencies).
   - **DBT `TIPP` Guided Wizard** with **Mandatory Medical Exclusion Screen** before Cold Water (blocks cold water and redirects to Paced Breathing if heart condition, beta-blockers, slow heart rate, cold allergy, or eating disorder is checked).
   - **`5-4-3-2-1 Grounding`** interactive stepper & **DBT `STOP`** skill.

3. **DBT-First, CBT-Second Interactive Session Player (`src/clinical/protocols-engine.ts`)**
   - **Phase 0**: Expressive Mode (*Venting / TEAM-CBT EAR Empathy*) vs. Instrumental Mode (*Guided CBT/DBT Skill*) + Voice Burst processor & Mood-Palette color generator.
   - **Live Socratic Pushback Switcher**: Mid-session switching (`off`, `gentle`, `moderate`, `firm` + `softer` / `harder` buttons).
   - **7 Guided Interactive Protocols**:
     1. **CBT 7-Step Thought Record** (silent distortion detector, 5-family Affect Labeling distinguishing *Shame* vs. *Guilt*, and **Accuracy Check** between steps 5 & 6).
     2. **CBT Behavioral Activation 6-Step** (Step 0 prediction-error follow-up, **Mandatory Rest Check** for guilt-free rest, Confidence `>= 7/10` micro-shrinking gate, Mastery & Pleasure rating, `If-Then` barrier).
     3. **TEAM-CBT Paradoxical Agenda Setting** (*Magic Button*, *Positive Reframing*, *Magic Dial* + *Externalization of Voices* & *Double Standard*).
     4. **DBT Opposite Action** (4 steps with *Justified Check* dialectical pivot).
     5. **DBT Wise Mind** (6 steps with *Harsh Self-Critic Guard* and *"Nothing yet"* valid outcome).
     6. **DBT Chain Analysis** (6 steps + Missing-Links with **Hard Stops** for self-harm/victimization and *Shame Protocol*).
     7. **DBT DEAR MAN + TEAM-CBT EAR Script Builder** with interactive **AI Roleplay Rehearsal** (`softer` / `moderate` / `harder` resistance).

4. **Anxiety Gold-Standard Hub (`src/clinical/anxiety-hub.ts`)**
   - **Worry Box (Worry Postponement)** with scheduled 15-minute window & Productive vs. Hypothetical sorter.
   - **Exposure Hierarchy Builder (ERP & Interoceptive Exposure)** with SUDS 0–100 habituation tracking & **Safety Behavior Detector**.
   - **Prediction Calibration Tracker** (predicted catastrophe % vs. actual outcome history).

5. **Bipolar & IPSRT Hub (`src/clinical/bipolar-hub.ts`)**
   - **Dual-Pole Mood & Energy Chart (`-5` to `+5`)** tracking Valence, Energy, Irritability, Sleep Duration & *Felt Need for Sleep* (detecting **Mania Prodrome** and **Mixed State**).
   - **5 IPSRT Social Rhythm Anchors** tracker & circadian stability score calculator.
   - **48-Hour Impulse Vault** (DBT `Crisis Pros & Cons` + `Devil's Advocate` + `Two-Person Reality Check`).
   - **Ulysses Contract (Relapse Prevention Plan)** & **Medication Adherence CBT**.

6. **Clinical Self-Assessments, Encrypted Storage & Print-Optimized A4 Report (`src/clinical/assessments-and-storage.ts`)**
   - Interactive `BMS`, `PHQ-9`, `GAD-7`, `ASRM`, `MDQ`, `ISI` assessments.
   - **WebCrypto AES-GCM 256-bit** local encrypted storage wrapper, Markdown Session Exporter (`YYYYMMDD-[technique]-NN.md`), Local Ollama (`http://127.0.0.1:11434`) & Backend API bridge with strict `0.46` Grounded RAG abstention, and `@media print` A4 Clinician Summary Report.
