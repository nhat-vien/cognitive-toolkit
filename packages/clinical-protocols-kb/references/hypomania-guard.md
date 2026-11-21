---
id: hypomania-guard
title: "Bipolar Hypomania Guard: Positive Distortion Checker, Devil's Advocate & 48h Impulse Vault"
modality: "Bipolar-Adapted CBT / TEAM-CBT / DBT / IPSRT"
disorder_focus: ["bipolar_1", "bipolar_2", "cyclothymia"]
arousal_zone: "orange_red_bipolar_mania"
steps_count: 5
version: "1.0.0"
language: "vi-en"
safety_critical: true
---

# Bipolar Hypomania Guard Protocol (hypomania-guard)

## Clinical Trigger & Purpose
Triggered automatically when:
- Bipolar Mood Polarity `>= +2` (Hypomania / Mania range) or Energy `>= +2` with `sleepDurationHours < 5` and `feltNeedForSleep` = `'reduced_need' | 'no_need_at_all'`, OR
- Altman Self-Rating Mania Scale (**ASRM**) score `>= 6`, OR
- The user detects **Bipolar Positive Cognitive Distortions** (major financial, career, relationship, or late-night project impulses).

Standard depressive CBT fails during hypomania because the user feels euphoric, unstoppable, and convinced every impulse is a stroke of genius. Hypomania Guard applies non-confrontational collaborative reality testing, circadian deceleration (**IPSRT & Dark Rest**), and a **48-Hour Impulse Lock**.

## Structured Clinical Steps

### Step 1: Detect the 5 Bipolar Positive Cognitive Distortions (Phát hiện 5 Biến dạng Nhận thức Dương tính) — Zone: `Supportive`
Scan the user's impulse or thought for the 5 Mania/Hypomania Positive Distortions:
1. **Grandiosity (Tự cao / Ý tưởng Vĩ đại)**: *"I have discovered a revolutionary business/system that will make millions overnight; ordinary rules don't apply to me."*
2. **Invulnerability / Risk Blindness (Bất khả Xâm phạm / Mù Rủi ro)**: *"Nothing can go wrong; I can invest all my savings or drive/act recklessly without consequences."*
3. **Hyper-Optimism / Rose-Colored Fortune Telling (Lạc quan Phi thực tế)**: *"This has a 100% chance of succeeding immediately with zero downsides."*
4. **Impulse Justification / Urgency Trap (Hợp thức hóa Bốc đồng / Bẫy Khẩn cấp)**: *"I must buy this / quit my job / send this message at 2:00 AM tonight or the opportunity will vanish forever!"*
5. **Magical Energy / Sleep Invincibility (Ảo tưởng Năng lượng Vô tận / Không cần Ngủ)**: *"I only slept 3 hours and feel electric — I don't need sleep or mood stabilizers anymore!"*

### Step 2: DBT STOP & Crisis Pros/Cons 4-Grid (Phanh Khẩn cấp STOP & Bảng Lợi/Hại 4 Ô) — Zone: `Core`
- Execute **STOP** (*Stop — Take a step back — Observe body speed & sleep debt — Proceed mindfully*).
- Evaluate the 4-cell **Crisis Pros & Cons**:
  - Short-term thrill vs. long-term wreckage of **Acting on the impulse tonight**.
  - Short-term frustration vs. long-term safety of **Waiting 48 hours**.

### Step 3: TEAM-CBT Devil's Advocate Reality Test (Phản biện Devil's Advocate Không Đối đầu) — Zone: `Core`
- Ask collaboratively:
  - *"If this idea is truly brilliant and solid today, will it still be brilliant in 48 hours after two full nights of 7-hour sleep?"*
  - *"What are 2 hidden financial, relationship, or health risks that your elevated dopamine might be glossing over right now?"*
  - **Medication Adherence Check**: If the impulse involves stopping mood stabilizers (*"I'm cured / pills dull my creativity"*), run a Cost-Benefit Analysis recalling past relapse episodes from the user's **Ulysses Contract**.

### Step 4: Lock in the 48-Hour Impulse Vault & Two-Person Reality Check (Khóa vào Khoang Trì hoãn 48 Giờ) — Zone: `Core`
- Place the decision into the **48-Hour Impulse Vault** (`unlocksAt = createdAt + 48 hours`, `outcome: impulse-locked-48h`).
- Prompt the user to run a **Two-Person Reality Check**: consult 2 grounded trusted contacts from their Ulysses Contract before taking any irreversible action.

### Step 5: Activate Low-Stimulus Dark Rest & IPSRT Anchor Protection (Kích hoạt Giao diện Giảm Kích thích & Liệu pháp Bóng tối) — Zone: `Closing` (Pushback `off`)
- Switch UI to **Low-Stimulus Warm Amber / Dark Rest Mode** (disable flashy animations, streaks, and high-stimulation tasks).
- Schedule **Dark Therapy / Wind-Down Protocol**: dim lights, stop screens, avoid caffeine/stimulants (**DBT PLEASE**), and protect tonight's **IPSRT Bedtime Anchor**.
