---
id: tipp
title: "DBT Distress Tolerance: TIPP Physiological Down-Regulation & Mandatory Medical Exclusion Screen"
modality: "DBT Distress Tolerance (Marsha Linehan)"
disorder_focus: ["anxiety", "depression", "bipolar_1", "bipolar_2", "cyclothymia"]
arousal_zone: "red_8_to_10"
steps_count: 5
version: "1.0.0"
language: "vi-en"
safety_critical: true
---

# DBT TIPP Physiological Crisis Protocol (tipp)

## Clinical Indication & Zero-Pushback Rule
- **When to Trigger**: Acute emotional distress `pre_intensity >= 8/10`, panic attack, emotional flooding, severe anger/agitation, or **Bipolar Mixed State (`moodPolarity <= -2 AND energyLevel >= +2`)**.
- **Socratic Pushback Rule**: **Strictly `off` at all levels.** Keep sentences ultra-short (1 instruction per screen). Never ask *"Why are you feeling this way?"* or attempt cognitive restructuring while the user is in physiological crisis.

## The 4 TIPP Physiological Skills (User Selects 1; Default: Paced Breathing)

### Skill 1: T — Temperature (Thay đổi Nhiệt độ / Phản xạ Lặn Mammalian Dive Reflex) — Zone: `Closing` (Pushback `off`)
- **Mandatory Medical Exclusion Screen (Cổng Sàng lọc Y khoa Bắt buộc Trước Khi Dùng Nước Lạnh)**:
  - Before displaying cold-water instructions, the system **MUST** ask:
    - *VI*: "Sàng lọc an toàn y khoa bắt buộc trước khi dùng nước lạnh: Bạn có mắc bệnh tim mạch, rối loạn nhịp tim / nhịp tim chậm (bradycardia), đang dùng thuốc chẹn beta (beta-blockers), dị ứng lạnh (cold urticaria / Raynaud), rối loạn ăn uống (eating disorder), hoặc đang mang thai có lưu ý y khoa không?"
    - *EN*: "Mandatory medical safety screen before cold water: Do you have a heart condition, slow heart rate (bradycardia), take beta-blocker medication, have cold allergy/Raynaud's, an active eating disorder, or medical pregnancy restrictions?"
  - **Hard Gate**: If the user answers **`Yes / Có`** or **`Unsure / Không chắc`**, **immediately lock Cold Water Temperature** (`coldWaterBlocked: true`) and automatically redirect to **P — Paced Breathing**.
  - **If `No / Không`**: Guide the user to lean forward, hold their breath, and apply a cold gel pack or bowl of cool water to the eyes and upper cheeks (trigeminal nerve zone) for **15 to 30 seconds** with an on-screen countdown timer. Never recommend full-body ice bath immersion.

### Skill 2: I — Intense Exercise (Vận động Cường độ Cao Ngắn hạn) — Zone: `Closing` (Pushback `off`)
- Perform 5–10 minutes of brisk physical movement in place (jumping jacks, fast stair climbing, brisk wall push-ups) to metabolize excess adrenaline and cortisol. Skip if physically injured, dizzy, or biologically exhausted.

### Skill 3: P — Paced Breathing (Thở Dẫn nhịp Kích hoạt Đối giao cảm) — Zone: `Closing` (Pushback `off`)
- **4-6 or 4-7-8 Cadence**: Inhale gently through the nose for **4 seconds**, exhale slowly through pursed lips for **6 to 8 seconds**.
- **Clinical Mechanism**: The exhale **must be longer than the inhale** to stimulate the vagus nerve and parasympathetic brake. If lightheaded, pause and breathe normally.

### Skill 4: P — Paired Muscle Relaxation (Thư giãn Cơ Tiến triển Kết hợp Nhịp thở - PMR) — Zone: `Closing` (Pushback `off`)
- Inhale and intentionally tense one muscle group for **5 seconds** (hands/forearms → shoulders → face → stomach → legs/feet), then exhale and release completely while saying *"Relax / Buông lỏng"* internally, noticing the warmth of tension draining away.

## Re-Rate & Two-Cycle Safety Loop Breaker (Ngắt Vòng lặp An toàn Sau 2 Lần)
- Re-rate distress (`0–10`) after completing 1 TIPP skill.
- If `post_intensity >= 7`, offer at most **1 additional TIPP skill** (or `5-4-3-2-1 Grounding` / `STOP`).
- If distress remains `>= 7` after **2 cycles**, **stop the loop immediately** (`outcome: stopped-early`), switch to quiet companionship, and surface emergency support contacts.
