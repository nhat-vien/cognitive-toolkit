---
id: pushback-config
title: "4-Level Socratic Pushback Controller & Clinical Zone Matrix"
modality: "Core Engine (Socratic Dialogue & TEAM-CBT Resistance)"
version: "1.0.0"
language: "vi-en"
safety_critical: true
---

# Socratic Pushback Configuration (pushback-config)

## 1. Three Clinical Protocol Zones (Ba Vùng Tương tác Lâm sàng)
Every step in a CBT or DBT protocol belongs to one of three zones:
1. **`Supportive` Zone (Vùng Thiết lập & Thấu cảm)**:
   - Used for context gathering, naming emotions, vulnerabilities, and mindfulness pauses.
   - Maximum **1 gentle prompt** regardless of how high the user's pushback setting is.
2. **`Core` Zone (Vùng Chuyển hóa Nhận thức & Hành vi)**:
   - Used for Evidence For/Against, Balanced Thought, Action Urges, Opposite Action, Chain Links, and DEAR MAN Assertiveness.
   - Applies the full selected Socratic Pushback level (`off`, `gentle`, `moderate`, `firm`).
3. **`Closing` & `Clinical Safety Gate` Zone (Vùng Đóng phiên & Cổng An toàn Lâm sàng)**:
   - Applies to **Safety Stop**, **TIPP**, **Accuracy Check**, **Rest Check**, **Justified Check (Real Danger)**, **Wise Mind Pause**, **Shame Protocol**, and **Phase 4 Closing**.
   - **Pushback is strictly `off` (0 retries).** Never challenge or push back at safety or biological rest gates.

## 2. Four Socratic Pushback Levels (Bốn Cấp độ Gợi mở Socratic)
Users can switch levels mid-session using `Softer / Nhẹ hơn`, `Harder / Sâu hơn`, or `Skip / Bỏ qua luôn`:

### Level 0: `off` (Tắt Gợi mở — Max 0 Retries)
- Immediately accepts any user answer, `"skip"`, or `"I don't know"` and advances to the next step without friction.
- Mandatory default during crisis, acute panic (`TIPP`), `Accuracy Check`, `Rest Check`, and `Shame Protocol`.

### Level 1: `gentle` (Nhẹ nhàng — Max 1 Retry in Core Zone)
- **Attempt 1**: Offers one warm, low-pressure invitation:
  - *VI*: "Bước này thường mang lại góc nhìn rất hữu ích — bạn có muốn thử tìm 1 ý nhỏ thôi trước khi mình đi tiếp không?"
  - *EN*: "This step often unlocks the biggest shift — would you like to try finding just one small detail before we move on?"
- **Attempt 2**: Concedes immediately and moves to the next step.

### Level 2: `moderate` (Vừa phải / Mặc định — Max 2 Retries in Core Zone)
- **Attempt 1**: Scaffolds the question by narrowing scope (asking for a 5% exception or a single factual observation).
- **Attempt 2**: Pivots to the **TEAM-CBT Double-Standard Technique** (Kỹ thuật Tiêu chuẩn kép):
  - *VI*: "Nếu một người bạn thân mà bạn rất yêu quý đang ở đúng hoàn cảnh này và nói câu đó, bạn sẽ nói gì với họ?"
  - *EN*: "If a close friend you deeply care about were in this exact situation saying this to themselves, what would you tell them?"
- **Attempt 3**: Concedes warmly, logs the step as skipped if empty, and advances.

### Level 3: `firm` (Sâu sắc — Max 3 Retries in Core Zone)
- **Attempt 1**: Narrowed factual inquiry.
- **Attempt 2**: Double-Standard or Temporal Perspective shift (*"5 năm nữa nhìn lại..."*).
- **Attempt 3**: Explores internal resistance using **TEAM-CBT Paradoxical Inquiry**:
  - *VI*: "Mình nhận thấy bước này đang rất khó để đi tiếp. Điều gì khiến việc ngồi lại với câu hỏi này trở nên nặng nề hoặc chưa an toàn với bạn lúc này?"
  - *EN*: "I notice this step feels tough to stay with right now. What makes sitting with this question feel heavy or protective for you in this moment?"
- **Attempt 4**: Always concedes with validation and advances.
