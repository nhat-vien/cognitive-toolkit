---
id: session-engine
title: "5-Phase Clinical Session State Machine & DBT-First Arousal Router"
modality: "Core Engine (CBT / TEAM-CBT / DBT / IPSRT)"
version: "1.0.0"
language: "vi-en"
safety_critical: true
---

# Session State Machine (session-engine)

## 1. Phase 0: Expressive vs. Instrumental Mode Check (Chọn Chế độ Lắng nghe hoặc Thực hành)
- **Expressive Mode (Venting / Empathy EAR)**: When the user needs emotional validation without problem-solving, activate David Burns' 5 Secrets of Effective Communication (**EAR**: Disarming, Thought/Feeling Empathy, Inquiry, "I Feel" Statements, Affirmation / Stroking). Never push cognitive restructuring during expressive venting.
- **Instrumental Mode (Structured CBT/DBT/IPSRT Protocol)**: When the user wants actionable symptom relief, cognitive restructuring, or behavioral regulation, proceed to Phase 1 Check-in.

## 2. Phase 1: Check-in, Polarity & Biometrics Baseline (Ghi nhận Trạng thái & Sinh trắc học)
- Collect situation summary, primary emotion(s) from the 5 Affect Labeling families (*Anger / Giận dữ, Sadness / Buồn bã, Anxiety / Lo âu, Shame / Xấu hổ, Guilt / Tội lỗi*).
- Record emotional distress intensity (`pre_intensity`: `0-10`) and Bipolar Mood & Energy Polarity (`-5` severe depression to `+5` acute mania, `0` euthymia).
- Optional Health context (`hrv_context`: `below-baseline`, `within-baseline`, `above-baseline` relative to 14-30 day personal 25th-75th percentile; sleep duration & felt need for sleep).

## 3. Safety Screen & "DBT-First, CBT-Second" Arousal Router (Định tuyến An toàn & Ngưỡng Kích hoạt Sinh lý)
- **Layer 1 & 2 Crisis / Safety Stop (`outcome: safety-stop`)**:
  - Triggered immediately upon suicidal ideation, self-harm intent, acute psychosis, severe manic emergency, or BMS Suicidal Ideation >= 1 / PHQ-9 Item 9 > 0.
  - Action: Turn Pushback `off`, halt all cognitive protocols immediately, display crisis hotlines, Ulysses Contract trusted contacts, and safety plan.
- **Layer 3 Real-World Danger (`outcome: justified-exit`)**:
  - Triggered by domestic violence, physical threat, abuse, or objective emergency.
  - Action: Turn Pushback `off`, validate fear as accurate, never treat valid danger as a cognitive distortion, switch to practical safety planning.
- **Red Zone Arousal (`pre_intensity >= 8/10` or Bipolar Mixed State `Mood <= -2 AND Energy >= +2`)**:
  - Prefrontal cortex is offline due to sympathetic flooding. Route automatically to **DBT Distress Tolerance (`tipp`)** to down-regulate physiology before any cognitive analysis.
- **Orange Zone Arousal (`pre_intensity 5-7/10` or Hypomanic Impulse `Mood +2..+3`)**:
  - Route to **DBT Emotion Regulation / Mindfulness (`opposite-action`, `wise-mind`, `chain-analysis`, `dear-man`, `crisis-pros-cons`, `hypomania-guard`)**.
- **Green/Yellow Zone Arousal (`pre_intensity 1-6/10`)**:
  - Prefrontal cortex is online for reflection. Route to **CBT & TEAM-CBT (`thought-record`, `behavioral-activation`, `paradoxical-agenda-setting`, `worry-postponement`, `exposure-hierarchy`, `pleasure-predicting`)**.

## 4. Phase 2 & Phase 3: Technique Selection & Guided Protocol Execution
- Enforce protocol-specific clinical gates:
  - `thought-record`: **Accuracy Check** between Steps 5 & 6 (`outcome: accurate-thought-exit`).
  - `behavioral-activation`: **Mandatory Rest Check** at Step 2 (`outcome: justified-exit`).
  - `opposite-action`: **Justified Check** at Step 3 (`outcome: justified-exit`).
  - `tipp`: **Mandatory Medical Exclusion Screen** before Cold Water Temperature skill.
  - `chain-analysis`: **Hard Stops** on self-harm behavior and victimization, plus **Shame Protocol**.
  - `wise-mind`: **Harsh Self-Critic Guard** in Reasonable Mind and `"Nothing yet"` valid outcome.
  - `hypomania-guard`: **48-Hour Impulse Vault** (`outcome: impulse-locked-48h`) and **Devil's Advocate**.

## 5. Phase 4: Close, Re-rate & Portable Markdown Frontmatter Export
- Summarize session in the user's own words, capture 1 concrete takeaway, and re-rate emotional intensity (`post_intensity`: `0-10`, calculating `intensity_delta = post - pre`).
- If `intensity_delta >= +3` (distress spiked by 3 or more points), offer an immediate grounding or TIPP Paced Breathing cool-down before closing.
- Export session to portable Markdown file `YYYYMMDD-[technique]-NN.md` with YAML frontmatter compatible with Obsidian and local encrypted storage.
