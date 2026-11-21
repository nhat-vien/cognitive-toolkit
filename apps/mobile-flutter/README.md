# Equilibria (Mind Anchor) — Flutter Mobile Client (Android & iOS)

> **Evidence-Based Local-First Clinical Companion for Anxiety, Depression, and Bipolar Disorder**  
> Built with **CBT (Beck / Mind Over Mood)**, **TEAM-CBT (Dr. David Burns)**, **DBT (Dr. Marsha Linehan)**, and **IPSRT (Interpersonal and Social Rhythm Therapy)**.

---

## 1. Clinical & Architectural Highlights

1. **DBT-First, CBT-Second Physiological Arousal Router**:
   - **Red Zone (`Intensity >= 8/10`, Panic, Mixed State)**: Automatically routes to **DBT Distress Tolerance (`TIPP`, `STOP`, `5-4-3-2-1 Grounding`)** with mandatory cardiovascular/medical exclusion screening before Cold Water (`TIPP - Temperature`) and tactile haptic paced breathing (`4-6` and `4-7-8`).
   - **Orange Zone (`Intensity 5-7/10`, Action Urges, Hypomanic Impulses)**: Routes to **DBT Emotion Regulation & Mindfulness (`Opposite Action` with `Justified Check`, `Wise Mind` with `Harsh Self-Critic Guard`, `Chain Analysis` with Hard Stops & Shame Protocol, `DEAR MAN` with EAR Roleplay)**.
   - **Green/Yellow Zone (`Intensity 1-6/10`)**: Routes to **CBT & TEAM-CBT (`7-Step Thought Record` with `Accuracy Check`, `6-Step Behavioral Activation` with `Rest Check`, `Paradoxical Agenda Setting`, `Worry Box`, `Exposure Hierarchy Builder`)**.
2. **Bipolar Disorder Dual-Pole Guard (`-5` to `+5`) & IPSRT**:
   - Tracks 4 independent axes: **Mood Polarity (`-5..+5`)**, **Energy (`-5..+5`)**, **Irritability (`0..10`)**, and **Sleep Duration + Felt Need for Sleep** (`exhausted`, `normal`, `reduced_need`, `no_need_at_all`).
   - On-device **Mania Prodrome Detector** (`Sleep < 5h` for `>= 2` nights with reduced need for sleep, or `ASRM >= 6`) and **Mixed State Detector** (`Mood <= -2` AND `Energy >= +2`).
   - **48-Hour Impulse Vault**: Locks major financial/career/relationship decisions behind **DBT Crisis Pros & Cons**, **David Burns Devil's Advocate**, and a 48-hour cooling timer with optional **Two-Person Reality Check**.
   - **Ulysses Contract** (created while euthymic at `0`) and **Medication Adherence CBT**.
3. **Adaptive Clinical UI Engine**:
   - **Standard Clinical Theme**: Calm sage/slate palette.
   - **Low-Energy Depression Theme (`Polarity <= -3`)**: Collapses cognitive overload into **"One Small Step"**, prioritizes **Voice Burst Journal**, and enforces **No Broken Streaks**.
   - **Low-Stimulus Mania Dark Rest Theme (`Polarity >= +2` or `ASRM >= 6`)**: Warm dark amber palette (zero blue-light excitement), disables all animations (`NoSplash`, zero transitions), and surfaces the **48-Hour Impulse Vault** & Dark Therapy countdown.
4. **Zero-Latency Deterministic Engine & Hardware-Backed Encryption**:
   - `0ms` bilingual (Vietnamese & English) detection of **11 Burns Negative Distortions**, **5 Bipolar Positive Distortions**, **23 Self-Defeating Beliefs (SDBs)**, **Safety Behaviors**, and **4-Layer Crisis/Safety Gates**.
   - SQLite encrypted at rest via **SQLCipher AES-256** (`sqlcipher_flutter_libs` + `drift`) with keys stored in iOS Keychain / Android Keystore (`flutter_secure_storage`) and unlocked via FaceID / Biometrics (`local_auth`).
   - **HealthKit & Health Connect Bridge** (`health`): Strictly computes personal **14–30 day 25th–75th percentile baselines** per device source with a `< 12h` freshness check and **never** computes within-session HRV deltas.

---

## 2. Directory Structure

```text
apps/mobile-flutter/
├── pubspec.yaml
├── analysis_options.yaml
├── lib/
│   ├── main.dart                                      # App entry point, Riverpod providers & Adaptive Theme
│   ├── domain/
│   │   ├── models/
│   │   │   └── clinical_models.dart                   # Immutable clinical models & YAML/JSON serialization
│   │   └── engine/
│   │       ├── distortion_detector.dart               # 0ms 11 Neg + 5 Pos Distortions, 23 SDBs, 4-Layer Safety
│   │       ├── session_state_machine.dart             # 5-Phase Engine, 4-Level Pushback, Clinical Safety Exits
│   │       ├── bipolar_ipsrt_engine.dart              # Mania Prodrome, Mixed State, IPSRT & HRV Baseline
│   │       └── clinical_assessments.dart              # BMS, PHQ-9, GAD-7, ASRM, MDQ, ISI scoring
│   ├── core/
│   │   ├── security/
│   │   │   └── encrypted_db_service.dart              # SQLCipher AES-256, Keychain/Keystore & Biometric Auth
│   │   ├── biometrics/
│   │   │   └── health_bridge_service.dart             # HealthKit & Health Connect Baseline-Relative HRV/Sleep
│   │   └── haptics/
│   │       └── haptic_breathing_controller.dart       # Eyes-closed tactile 4-6 & 4-7-8 breathing haptics
│   └── presentation/
│       ├── theme/
│       │   └── adaptive_clinical_theme.dart           # Standard, Low-Energy Depression & Low-Stimulus Mania UI
│       └── screens/
│           ├── main_shell_screen.dart                 # Persistent 1-Tap SOS FAB & Adaptive Navigation Shell
│           ├── sos_portal_screen.dart                 # TIPP (with Cold Water Medical Screen), Breathing, 5-4-3-2-1, STOP
│           ├── session_player_screen.dart             # Expressive Voice Burst vs Instrumental CBT/DBT Player
│           └── bipolar_hub_screen.dart                # Dual-Pole Chart, IPSRT, 48h Impulse Vault, Ulysses Contract
└── test/
    └── clinical_engine_test.dart                      # Automated clinical safety & state machine unit test suite
```

---

## 3. Running & Testing

```bash
# Fetch dependencies
flutter pub get

# Run clinical engine & safety gate unit tests
flutter test test/clinical_engine_test.dart

# Run on Android / iOS device or simulator
flutter run
```
