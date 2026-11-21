---
id: thought-record
title: "CBT 7-Step Thought Record with Accuracy Check (Nhật ký Suy nghĩ 7 Bước)"
modality: "CBT / TEAM-CBT"
disorder_focus: ["anxiety", "depression", "bipolar_depression"]
arousal_zone: "green_yellow_1_to_6"
steps_count: 7
version: "1.0.0"
language: "vi-en"
safety_critical: true
---

# CBT 7-Step Thought Record (thought-record)

## When NOT to Use (Chống chỉ định Lâm sàng)
- Do **NOT** use when emotional distress `pre_intensity >= 8/10` (route to `tipp` first).
- Do **NOT** use during acute Mania / Hypomania (`moodPolarity >= +2`, route to `hypomania-guard`).
- Do **NOT** force cognitive restructuring on objectively true tragedies or active physical danger (use the **Accuracy Check** gate between Step 5 and Step 6).

## Structured Clinical Steps

### Step 1: Situation (Tình huống Khách quan) — Zone: `Supportive`
- **Goal**: Capture the objective facts of what happened (who, what, when, where) as a video camera would record it.
- **Clinical Rule**: Strip out mind-reading or interpretations. If the user writes *"My boss hates me and ignored my email"*, separate fact from story: *"That is the painful conclusion your mind drew — what did the camera actually record? (e.g., 'Sent email at 9 AM, no reply by 5 PM')."*

### Step 2: Automatic Thought (Suy nghĩ Tự động / Hot Cognition) — Zone: `Supportive`
- **Goal**: Identify the exact raw sentence flashing through the mind and rate belief (`0–100%`).
- **Silent Distortion Classification**: Silently detect any of Burns' 11 Negative Cognitive Distortions (*All-or-Nothing, Overgeneralization, Mental Filter, Discounting the Positive, Mind Reading, Fortune Telling, Magnification/Catastrophizing, Emotional Reasoning, Should Statements, Labeling, Personalization/Blame*) without lecturing the user.

### Step 3: Emotion & Pre-Intensity (Gọi tên Cảm xúc & Cường độ Đầu vào) — Zone: `Supportive`
- **Goal**: Label specific emotions from the 5 Affect Families (*Anger, Sadness, Anxiety, Shame, Guilt*) and rate `pre_intensity` (`0–10`).
- **Clinical Distinction**: Help distinguish **Guilt** (*"I made a mistake in my action"*) from **Shame** (*"I am a bad, defective person"*).

### Step 4: Evidence FOR the Hot Thought (Bằng chứng Ủng hộ Suy nghĩ) — Zone: `Core`
- **Goal**: Validate why the thought feels convincing by listing only hard, courtroom-admissible facts supporting it. Filter out emotional reasoning (*"I feel it, so it must be true"*).

### Step 5: Evidence AGAINST the Hot Thought (Bằng chứng Phản bác / Góc nhìn Khác) — Zone: `Core` (Primary Socratic Step)
- **Goal**: Discover overlooked facts, past exceptions, and alternative explanations.
- **Socratic Prompts**:
  - *"Has there ever been a time when you had this thought and it turned out differently?"*
  - **Double-Standard**: *"What would you say to a dear friend who had this exact thought in the same situation?"*
  - **Shades of Grey**: *"If it isn't 100% catastrophic or 100% perfect, where on the 0–100 spectrum does reality fall?"*

### Gate Between Step 5 & Step 6: Accuracy Check (Cổng Kiểm tra Tính Chính xác Thực tế) — Zone: `Closing` (Pushback `off`)
- **Critical Clinical Safeguard**: Ask whether the automatic thought is objectively true (e.g., actual job loss, bereavement, medical diagnosis, real rejection).
- If the thought is **objectively accurate**:
  - **Halt cognitive restructuring immediately** (`outcome: accurate-thought-exit`) to prevent toxic positivity or invalidation.
  - Offer 3 clinical branches:
    1. **Problem-Solving**: Identify one small practical action for the next 24 hours.
    2. **Compassionate Coping**: Focus on self-soothing and support through a real loss.
    3. **Split the Thought**: Keep the accurate core (*"I failed this exam"*) and only restructure the globalized label (*"Therefore I am a total failure forever"*).

### Step 6: Balanced / Realistic Thought (Suy nghĩ Cân bằng & Thực tế) — Zone: `Core`
- **Goal**: Synthesize Step 4 and Step 5 into a believable dialectical statement (`0–100%` belief rating):
  - *"It is true that [Evidence For], AND at the same time it is also true that [Evidence Against]."*
- Reject fake positive affirmations that the user believes less than 50%.

### Step 7: Re-rate Emotion & Action Takeaway (Đánh giá lại Cảm xúc & Chốt Bài học) — Zone: `Closing` (Pushback `off`)
- **Goal**: Re-rate emotional intensity (`post_intensity`: `0–10`) and compute `intensity_delta`.
- If `post_intensity - pre_intensity >= 3`, offer immediate grounding/TIPP Paced Breathing before closing.
