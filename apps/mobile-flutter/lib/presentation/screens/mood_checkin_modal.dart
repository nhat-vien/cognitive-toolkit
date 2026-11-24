// lib/presentation/screens/mood_checkin_modal.dart
// Minimalist, airy Vietnamese Mood Check-in Modal inspired by modern calm sanctuary UI.
// Replaces cluttered slider walls with a gentle 6-emotion grid, 1 intensity slider,
// and quick life-factor chips.

import 'package:flutter/material.dart';

import '../../domain/models/clinical_models.dart';

class MoodCheckInSelection {
  final String emotionLabel;
  final int moodPolarity; // -5..+5
  final int energyLevel; // -5..+5
  final int intensity; // 1..10
  final double sleepHours;
  final List<String> factors;

  const MoodCheckInSelection({
    required this.emotionLabel,
    required this.moodPolarity,
    required this.energyLevel,
    required this.intensity,
    required this.sleepHours,
    required this.factors,
  });
}

class _EmotionOption {
  final String label;
  final Color dotColor;
  final int defaultMood;
  final int defaultEnergy;

  const _EmotionOption(
    this.label,
    this.dotColor,
    this.defaultMood,
    this.defaultEnergy,
  );
}

const List<_EmotionOption> _kEmotionOptions = [
  _EmotionOption('Bình thường / Bình ổn', Color(0xFF5A8574), 0, 0),
  _EmotionOption('Vui vẻ / Hưng phấn', Color(0xFFD97706), 3, 2),
  _EmotionOption('Buồn bã / Trống rỗng', Color(0xFF7B93B4), -3, -2),
  _EmotionOption('Lo lắng / Bồn chồn', Color(0xFF8368B8), -2, 1),
  _EmotionOption('Căng thẳng / Quá tải', Color(0xFFC19A7B), -2, 2),
  _EmotionOption('Tức giận / Bực bội', Color(0xFFC4553D), -3, 3),
  _EmotionOption('Tự trách / Xấu hổ', Color(0xFF9E7D8A), -3, -1),
];

const List<String> _kFactorChips = [
  'Gia đình',
  'Sức khỏe',
  'Giấc ngủ',
  'Bản thân',
  'Công việc',
  'Tài chính',
  'Mối quan hệ',
];

class MoodCheckInModal extends StatefulWidget {
  final double initialSleepHours;

  const MoodCheckInModal({
    super.key,
    this.initialSleepHours = 7.0,
  });

  static Future<MoodCheckInSelection?> show(
    BuildContext context, {
    double initialSleepHours = 7.0,
  }) {
    return showModalBottomSheet<MoodCheckInSelection>(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFFF3F6F8),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (_) => FractionallySizedBox(
        heightFactor: 0.92,
        child: MoodCheckInModal(initialSleepHours: initialSleepHours),
      ),
    );
  }

  @override
  State<MoodCheckInModal> createState() => _MoodCheckInModalState();
}

class _MoodCheckInModalState extends State<MoodCheckInModal> {
  int _selectedEmotionIdx = 0; // Mặc định: Bình thường / Bình ổn (đã ổn định hoặc sau khi uống thuốc)
  int _intensity = 5;
  late double _sleepHours;
  final Set<String> _selectedFactors = {};

  @override
  void initState() {
    super.initState();
    _sleepHours = widget.initialSleepHours;
  }

  String _intensityWord(int val) {
    if (val <= 3) return 'nhẹ';
    if (val <= 6) return 'vừa';
    return 'mạnh';
  }

  void _handleSave() {
    final opt = _kEmotionOptions[_selectedEmotionIdx];
    Navigator.of(context).pop(
      MoodCheckInSelection(
        emotionLabel: opt.label,
        moodPolarity: opt.defaultMood,
        energyLevel: opt.defaultEnergy,
        intensity: _intensity,
        sleepHours: _sleepHours,
        factors: _selectedFactors.toList(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final selectedOpt = _kEmotionOptions[_selectedEmotionIdx];

    return SafeArea(
      child: Column(
        children: [
          // Top Minimal Header: Đóng / Lưu
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text(
                    'Đóng',
                    style: TextStyle(
                      color: Color(0xFF6B7780),
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
                TextButton(
                  onPressed: _handleSave,
                  child: const Text(
                    'Lưu',
                    style: TextStyle(
                      color: Color(0xFF4F7A65),
                      fontSize: 15.5,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
          ),

          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(22, 4, 22, 28),
              children: [
                // Soft Floating Cloud Illustration
                Center(
                  child: Container(
                    width: 88,
                    height: 62,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(40),
                      boxShadow: [
                        BoxShadow(
                          color: selectedOpt.dotColor.withValues(alpha: 0.22),
                          blurRadius: 24,
                          spreadRadius: 4,
                        ),
                      ],
                    ),
                    child: Icon(
                      Icons.cloud_rounded,
                      size: 46,
                      color: selectedOpt.dotColor.withValues(alpha: 0.55),
                    ),
                  ),
                ),
                const SizedBox(height: 22),

                const Text(
                  'Bạn đang cảm thấy thế nào?',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1F2A30),
                    letterSpacing: -0.3,
                  ),
                ),
                const SizedBox(height: 18),

                // 2x3 Soft Emotion Grid
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _kEmotionOptions.length,
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 1.08,
                  ),
                  itemBuilder: (_, idx) {
                    final item = _kEmotionOptions[idx];
                    final isSelected = idx == _selectedEmotionIdx;
                    return InkWell(
                      borderRadius: BorderRadius.circular(20),
                      onTap: () => setState(() => _selectedEmotionIdx = idx),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 180),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: isSelected
                                ? item.dotColor
                                : Colors.transparent,
                            width: 2,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.03),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              width: 14,
                              height: 14,
                              decoration: BoxDecoration(
                                color: item.dotColor,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(height: 10),
                            Text(
                              item.label,
                              style: TextStyle(
                                fontSize: 13.5,
                                fontWeight: isSelected
                                    ? FontWeight.w700
                                    : FontWeight.w500,
                                color: const Color(0xFF2B353B),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),

                const SizedBox(height: 24),

                // Intensity Slider
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Mức độ',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF233036),
                      ),
                    ),
                    Text(
                      '${_intensityWord(_intensity)} · $_intensity/10',
                      style: const TextStyle(
                        fontSize: 14,
                        color: Color(0xFF6B7780),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
                SliderTheme(
                  data: SliderTheme.of(context).copyWith(
                    activeTrackColor: const Color(0xFF6E9883),
                    inactiveTrackColor: const Color(0xFFDCE4E8),
                    thumbColor: Colors.white,
                    trackHeight: 5,
                  ),
                  child: Slider(
                    value: _intensity.toDouble(),
                    min: 1,
                    max: 10,
                    divisions: 9,
                    onChanged: (v) => setState(() => _intensity = v.round()),
                  ),
                ),

                const SizedBox(height: 14),

                // Life Factors Pills
                const Text(
                  'Điều gì ảnh hưởng đến bạn?',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF233036),
                  ),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final factor in _kFactorChips)
                      FilterChip(
                        label: Text(factor),
                        selected: _selectedFactors.contains(factor),
                        backgroundColor: Colors.white,
                        selectedColor: const Color(0xFFE1EFE8),
                        checkmarkColor: const Color(0xFF4F7A65),
                        side: BorderSide(
                          color: _selectedFactors.contains(factor)
                              ? const Color(0xFF6E9883)
                              : Colors.transparent,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(999),
                        ),
                        onSelected: (sel) {
                          setState(() {
                            if (sel) {
                              _selectedFactors.add(factor);
                            } else {
                              _selectedFactors.remove(factor);
                            }
                          });
                        },
                      ),
                  ],
                ),

                const SizedBox(height: 20),

                // Compact Sleep Hours Row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Giấc ngủ đêm qua',
                      style: TextStyle(
                        fontSize: 14.5,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF233036),
                      ),
                    ),
                    Text(
                      '${_sleepHours.toStringAsFixed(1)} giờ',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF4F7A65),
                      ),
                    ),
                  ],
                ),
                Slider(
                  value: _sleepHours.clamp(0.0, 12.0),
                  min: 0,
                  max: 12,
                  divisions: 24,
                  onChanged: (v) => setState(() => _sleepHours = v),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

FeltNeedForSleep inferFeltNeedForSleep(double sleepHours, int moodPolarity) {
  if (sleepHours < 5.0 && moodPolarity >= 2) {
    return FeltNeedForSleep.reducedNeed;
  }
  if (sleepHours < 6.0 || moodPolarity <= -3) {
    return FeltNeedForSleep.exhausted;
  }
  return FeltNeedForSleep.normal;
}
