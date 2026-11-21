---
id: health-integration
title: "Baseline-Relative HRV & Sleep Biometrics Integration Rules"
modality: "Biometrics & IPSRT Circadian Rhythm"
version: "1.0.0"
language: "vi-en"
safety_critical: true
---

# Health & Biometrics Integration Protocol (health-integration)

## 1. Core Clinical Principles for Biometrics (Nguyên tắc Lâm sàng Sinh trắc học)
Biometric data from Apple HealthKit (iOS) and Google Health Connect (Android)—specifically **Heart Rate Variability (HRV: SDNN / RMSSD)** and **Sleep Stages / Duration**—must never be over-interpreted or used as a diagnostic instrument.

### Rule 1: Personal Baseline Percentile Only (25th–75th Percentile over 14–30 Days)
- **Never use absolute population HRV thresholds** (e.g., never say "HRV of 35ms is low"). HRV varies dramatically by age, genetics, medication, and measurement metric (SDNN vs. RMSSD).
- Compute the user's personal **25th percentile (`P25`)** and **75th percentile (`P75`)** from **14 to 30 days** of historical readings recorded on the **same device and metric**.
- Minimum data requirement: At least **7 valid daily readings** within the 14–30 day window before computing baseline context. If fewer than 7 readings exist, return `insufficient-baseline-data`.
- Classification:
  - `below-baseline`: Latest reading `< P25`
  - `within-baseline`: Latest reading between `P25` and `P75` (inclusive)
  - `above-baseline`: Latest reading `> P75`

### Rule 2: Strict 12-Hour Freshness Gate (Ngưỡng Độ tươi Dữ liệu < 12 Giờ)
- If the most recent HRV reading is older than **12 hours**, mark it as `stale` and **do not mention HRV** during the session check-in.

### Rule 3: Zero Within-Session Pre/Post HRV Comparison (Cấm So sánh HRV Trước/Sau trong Cùng 1 Phiên)
- Short-term HRV fluctuates with posture, breathing cadence, digestion, and time of day.
- **Strictly forbidden**: Never compare HRV before and after a 10-minute CBT/DBT session to claim a technique "worked" or "failed". Session efficacy is measured via subjective emotional intensity (`pre_intensity` vs. `post_intensity`) and Brief Mood Survey (BMS).

### Rule 4: Single Gentle Check-In Mention & Graceful Fallback
- If HRV is fresh (`< 12h`) and `below-baseline` (`< P25`), mention it **at most once** during Phase 1 Check-in as gentle context:
  - *VI*: "Chỉ số HRV gần nhất của bạn thấp hơn ngưỡng nền cá nhân và đêm qua bạn ngủ ít hơn thường lệ — cơ thể bạn có thể đang chịu tải sinh học cao, hôm nay mình ưu tiên các bước nhẹ nhàng nhé."
  - *EN*: "Your recent HRV is below your personal 30-day baseline and sleep was short — your nervous system may be carrying extra physiological load today, so let's keep our pace gentle."
- If the user declines HealthKit/Health Connect permissions, the app operates 100% normally without nagging.

## 2. Bipolar Sleep & Circadian Red Flags (Cờ đỏ Giấc ngủ trong Rối loạn Lưỡng cực)
- Distinguish **Insomnia with Fatigue** (`feltNeedForSleep: 'exhausted'`, common in anxiety/depression) from **Reduced Need for Sleep** (`feltNeedForSleep: 'reduced_need' | 'no_need_at_all'`, the cardinal prodrome of hypomania/mania).
- When `sleepDurationHours < 5` for `>= 2` consecutive nights combined with `reduced_need` or `no_need_at_all`, trigger **Mania Prodrome Alert** and activate **Hypomania Guard**.
