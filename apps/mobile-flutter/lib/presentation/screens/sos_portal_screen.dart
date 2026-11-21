// lib/presentation/screens/sos_portal_screen.dart
// Fullscreen 1-Tap DBT Distress Tolerance SOS Portal:
// - DBT `TIPP` (Temperature with mandatory cardiovascular/medical exclusion screen,
//   Intense Exercise, Paced Breathing with eyes-closed tactile Haptics,
//   Paired Muscle Relaxation)
// - `5-4-3-2-1` Sensory Grounding interactive counter
// - DBT `STOP` Skill (Stop, Take a step back, Observe, Proceed mindfully)
// - Automatic 2-Skill Safety Break: If distress remains >= 7/10 after 2 skills,
//   halts loop (`outcome: stopped-early`) and displays Emergency Hotlines.

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/haptics/haptic_breathing_controller.dart';
import '../../domain/engine/session_state_machine.dart';

class SosPortalScreen extends StatefulWidget {
  final int initialIntensity;
  const SosPortalScreen({super.key, this.initialIntensity = 9});

  @override
  State<SosPortalScreen> createState() => _SosPortalScreenState();
}

class _SosPortalScreenState extends State<SosPortalScreen> {
  late final HapticBreathingController _breathingController;
  int _selectedTabIndex = 0; // 0: Paced Breathing, 1: TIPP Cold Water, 2: 5-4-3-2-1, 3: STOP & PMR
  int _currentIntensity = 9;
  int _skillsCompletedCount = 0;
  bool _safetyBreakTriggered = false;

  // TIPP Temperature (Cold Water) Mandatory Medical Exclusion Screen state
  TippMedicalScreeningAnswer _medicalAnswer = const TippMedicalScreeningAnswer();
  bool _medicalScreenSubmitted = false;
  int _coldWaterCountdownSeconds = 20;
  Timer? _coldWaterTimer;

  // 5-4-3-2-1 Grounding progress
  final Map<int, int> _groundingProgress = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0};

  @override
  void initState() {
    super.initState();
    _currentIntensity = widget.initialIntensity.clamp(0, 10);
    _breathingController = HapticBreathingController();
  }

  @override
  void dispose() {
    _coldWaterTimer?.cancel();
    _breathingController.dispose();
    super.dispose();
  }

  void _recordSkillCompletionAndRerate(int newIntensity) {
    setState(() {
      _currentIntensity = newIntensity;
      _skillsCompletedCount++;
      if (_skillsCompletedCount >= 2 && _currentIntensity >= 7) {
        _safetyBreakTriggered = true;
      }
    });
  }

  void _startColdWaterTimer() {
    _coldWaterTimer?.cancel();
    setState(() => _coldWaterCountdownSeconds = 25);
    _coldWaterTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      if (_coldWaterCountdownSeconds <= 1) {
        timer.cancel();
        setState(() => _coldWaterCountdownSeconds = 0);
      } else {
        setState(() => _coldWaterCountdownSeconds--);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F1E22),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F1E22),
        foregroundColor: Colors.white,
        title: const Text(
          'CỔNG SOS TỨC THÌ (DBT TIPP & GROUNDING)',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Chip(
              backgroundColor: _currentIntensity >= 8
                  ? const Color(0xFF8C1D18)
                  : const Color(0xFF1F5E55),
              label: Text(
                'Cường độ: $_currentIntensity/10',
                style: const TextStyle(color: Colors.white),
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            if (_safetyBreakTriggered) _buildTwoSkillSafetyBreakBanner(),
            _buildModuleSelectorBar(),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: _buildActiveSkillView(),
              ),
            ),
            _buildIntensityRerateFooter(),
          ],
        ),
      ),
    );
  }

  Future<void> _dialHotline(String phoneNumber) async {
    final uri = Uri(scheme: 'tel', path: phoneNumber);
    try {
      await launchUrl(uri);
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Vui lòng gọi số hỗ trợ: $phoneNumber')),
      );
    }
  }

  Widget _buildTwoSkillSafetyBreakBanner() {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 4),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF5A1A1A),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.redAccent),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'NGẮT VÒNG LẶP AN TOÀN — ĐÃ ĐẾN LÚC KẾT NỐI NGƯỜI HỖ TRỢ',
            style: TextStyle(
              color: Colors.amberAccent,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Bạn đã thử 2 kỹ năng nhưng cường độ căng thẳng vẫn >= 7/10. '
            'Hãy dừng việc cố làm thêm bài tập, ngồi hoặc nằm ở nơi an toàn và chạm để gọi ngay:',
            style: TextStyle(color: Colors.white, height: 1.4),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              FilledButton.icon(
                style: FilledButton.styleFrom(
                  backgroundColor: Colors.redAccent,
                  foregroundColor: Colors.white,
                ),
                onPressed: () => unawaited(_dialHotline('115')),
                icon: const Icon(Icons.call, size: 16),
                label: const Text('Gọi Cấp cứu 115'),
              ),
              FilledButton.tonalIcon(
                onPressed: () => unawaited(_dialHotline('0963061414')),
                icon: const Icon(Icons.support_agent, size: 16),
                label: const Text('Đường dây nóng Ngày Mai'),
              ),
              FilledButton.tonalIcon(
                onPressed: () => unawaited(_dialHotline('111')),
                icon: const Icon(Icons.phone_in_talk, size: 16),
                label: const Text('Tổng đài 111'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildModuleSelectorBar() {
    final labels = [
      '1. Thở Haptics 4-6',
      '2. Nước lạnh (TIPP-T)',
      '3. Neo 5-4-3-2-1',
      '4. STOP & Thư giãn Cơ',
    ];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        children: List.generate(labels.length, (i) {
          final selected = _selectedTabIndex == i;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              selected: selected,
              selectedColor: const Color(0xFF2E8B78),
              backgroundColor: const Color(0xFF1A2F35),
              labelStyle: TextStyle(
                color: Colors.white,
                fontWeight: selected ? FontWeight.bold : FontWeight.normal,
              ),
              label: Text(labels[i]),
              onSelected: (_) => setState(() => _selectedTabIndex = i),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildActiveSkillView() {
    switch (_selectedTabIndex) {
      case 0:
        return _buildHapticPacedBreathingView();
      case 1:
        return _buildTippColdWaterWithMandatoryMedicalScreen();
      case 2:
        return _build54321GroundingView();
      default:
        return _buildStopAndPmrView();
    }
  }

  Widget _buildHapticPacedBreathingView() {
    return ValueListenableBuilder<BreathingTickState>(
      valueListenable: _breathingController,
      builder: (context, state, _) {
        return Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Wrap(
              spacing: 10,
              children: BreathingPatternType.values.map((pattern) {
                final isSelected = state.pattern == pattern;
                return OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    foregroundColor:
                        isSelected ? Colors.amberAccent : Colors.white70,
                    side: BorderSide(
                      color: isSelected ? Colors.amberAccent : Colors.white24,
                    ),
                  ),
                  onPressed: () => _breathingController.selectPattern(pattern),
                  child: Text(pattern.code),
                );
              }).toList(),
            ),
            const SizedBox(height: 24),
            AnimatedContainer(
              duration: const Duration(milliseconds: 800),
              width: 220 * state.circleScale,
              height: 220 * state.circleScale,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: const RadialGradient(
                  colors: [Color(0xFF3DA58E), Color(0xFF1A4E46)],
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF3DA58E).withValues(alpha: 0.35),
                    blurRadius: 28,
                    spreadRadius: 6,
                  ),
                ],
              ),
              alignment: Alignment.center,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    state.isRunning
                        ? '${state.secondsRemainingInPhase}s'
                        : state.pattern.code,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 38,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Chu kỳ: ${state.completedCycles}',
                    style: const TextStyle(color: Colors.white70, fontSize: 13),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Text(
              state.phase.instructionVi,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              state.phase.subtitleVi,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white70, fontSize: 14),
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              style: FilledButton.styleFrom(
                backgroundColor: state.isRunning
                    ? Colors.redAccent
                    : const Color(0xFF2E8B78),
                padding:
                    const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
              ),
              onPressed: state.isRunning
                  ? _breathingController.stop
                  : _breathingController.start,
              icon: Icon(state.isRunning ? Icons.stop : Icons.play_arrow),
              label: Text(
                state.isRunning
                    ? 'Dừng Nhịp Thở'
                    : 'Bắt đầu Thở Dẫn Nhịp (Có Rung Xúc Giác)',
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildTippColdWaterWithMandatoryMedicalScreen() {
    if (!_medicalScreenSubmitted) {
      return SingleChildScrollView(
        child: Card(
          color: const Color(0xFF172A30),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.medical_information, color: Colors.amberAccent),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'CỔNG SÀNG LỌC Y KHOA BẮT BUỘC TRƯỚC KHI DÙNG NƯỚC LẠNH (TIPP - TEMPERATURE)',
                        style: TextStyle(
                          color: Colors.amberAccent,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                const Text(
                  'Phản xạ lặn (Mammalian Dive Reflex) làm giảm nhịp tim nhanh chóng. '
                  'Trước khi áp nước lạnh, vui lòng xác nhận bạn có bất kỳ tình trạng nào sau đây không:',
                  style: TextStyle(color: Colors.white70),
                ),
                const SizedBox(height: 12),
                _buildMedicalCheckbox(
                  title: '1. Bệnh tim mạch, rối loạn nhịp tim hoặc nhịp tim chậm (Bradycardia)',
                  value: _medicalAnswer.hasHeartConditionOrBradycardia,
                  onChanged: (v) => setState(
                    () => _medicalAnswer = TippMedicalScreeningAnswer(
                      hasHeartConditionOrBradycardia: v,
                      takesBetaBlockers: _medicalAnswer.takesBetaBlockers,
                      hasColdAllergyOrRaynauds:
                          _medicalAnswer.hasColdAllergyOrRaynauds,
                      hasEatingDisorderOrMedicalPregnancyConcern: _medicalAnswer
                          .hasEatingDisorderOrMedicalPregnancyConcern,
                      isUnsure: _medicalAnswer.isUnsure,
                    ),
                  ),
                ),
                _buildMedicalCheckbox(
                  title: '2. Đang dùng thuốc chẹn beta (Beta-blockers) hoặc thuốc hạ nhịp tim',
                  value: _medicalAnswer.takesBetaBlockers,
                  onChanged: (v) => setState(
                    () => _medicalAnswer = TippMedicalScreeningAnswer(
                      hasHeartConditionOrBradycardia:
                          _medicalAnswer.hasHeartConditionOrBradycardia,
                      takesBetaBlockers: v,
                      hasColdAllergyOrRaynauds:
                          _medicalAnswer.hasColdAllergyOrRaynauds,
                      hasEatingDisorderOrMedicalPregnancyConcern: _medicalAnswer
                          .hasEatingDisorderOrMedicalPregnancyConcern,
                      isUnsure: _medicalAnswer.isUnsure,
                    ),
                  ),
                ),
                _buildMedicalCheckbox(
                  title: '3. Dị ứng lạnh (Cold urticaria) hoặc hội chứng Raynaud',
                  value: _medicalAnswer.hasColdAllergyOrRaynauds,
                  onChanged: (v) => setState(
                    () => _medicalAnswer = TippMedicalScreeningAnswer(
                      hasHeartConditionOrBradycardia:
                          _medicalAnswer.hasHeartConditionOrBradycardia,
                      takesBetaBlockers: _medicalAnswer.takesBetaBlockers,
                      hasColdAllergyOrRaynauds: v,
                      hasEatingDisorderOrMedicalPregnancyConcern: _medicalAnswer
                          .hasEatingDisorderOrMedicalPregnancyConcern,
                      isUnsure: _medicalAnswer.isUnsure,
                    ),
                  ),
                ),
                _buildMedicalCheckbox(
                  title: '4. Rối loạn ăn uống hoặc thai kỳ có lưu ý y khoa',
                  value: _medicalAnswer
                      .hasEatingDisorderOrMedicalPregnancyConcern,
                  onChanged: (v) => setState(
                    () => _medicalAnswer = TippMedicalScreeningAnswer(
                      hasHeartConditionOrBradycardia:
                          _medicalAnswer.hasHeartConditionOrBradycardia,
                      takesBetaBlockers: _medicalAnswer.takesBetaBlockers,
                      hasColdAllergyOrRaynauds:
                          _medicalAnswer.hasColdAllergyOrRaynauds,
                      hasEatingDisorderOrMedicalPregnancyConcern: v,
                      isUnsure: _medicalAnswer.isUnsure,
                    ),
                  ),
                ),
                _buildMedicalCheckbox(
                  title: '5. Tôi KHÔNG CHẮC CHẮN về tình trạng tim mạch/thuốc của mình',
                  value: _medicalAnswer.isUnsure,
                  onChanged: (v) => setState(
                    () => _medicalAnswer = TippMedicalScreeningAnswer(
                      hasHeartConditionOrBradycardia:
                          _medicalAnswer.hasHeartConditionOrBradycardia,
                      takesBetaBlockers: _medicalAnswer.takesBetaBlockers,
                      hasColdAllergyOrRaynauds:
                          _medicalAnswer.hasColdAllergyOrRaynauds,
                      hasEatingDisorderOrMedicalPregnancyConcern: _medicalAnswer
                          .hasEatingDisorderOrMedicalPregnancyConcern,
                      isUnsure: v,
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFF2E8B78),
                    ),
                    onPressed: () {
                      if (!_medicalAnswer.isColdWaterCleared) {
                        // Automatically lock Cold Water and redirect to Paced Breathing
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text(
                              'An toàn y khoa: Đã khóa bước Nước lạnh và chuyển sang Thở dẫn nhịp 4-6.',
                            ),
                          ),
                        );
                        setState(() => _selectedTabIndex = 0);
                      } else {
                        setState(() => _medicalScreenSubmitted = true);
                      }
                    },
                    child: Text(
                      _medicalAnswer.isColdWaterCleared
                          ? 'Tôi xác nhận KHÔNG có các tình trạng trên → Tiếp tục'
                          : 'Có lưu ý y khoa / Không chắc → Chuyển sang Thở Dẫn Nhịp An Toàn',
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Icon(Icons.ac_unit, color: Colors.lightBlueAccent, size: 54),
        const SizedBox(height: 16),
        const Text(
          'TIPP — Kích hoạt Phản xạ Lặn (15–30 Giây)',
          style: TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        const Text(
          '1. Dùng túi chườm mát hoặc khăn/chậu nước mát (không dùng bồn đá ngâm toàn thân).\n'
          '2. Hơi cúi người về phía trước, nín thở nhẹ và áp vùng mắt + gò má vào nước mát trong 15–30 giây.',
          textAlign: TextAlign.center,
          style: TextStyle(color: Colors.white70, height: 1.5),
        ),
        const SizedBox(height: 24),
        Text(
          '$_coldWaterCountdownSeconds giây',
          style: const TextStyle(
            color: Colors.lightBlueAccent,
            fontSize: 44,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        FilledButton.icon(
          onPressed: _startColdWaterTimer,
          icon: const Icon(Icons.timer),
          label: const Text('Bắt đầu Đếm Ngược 25 Giây'),
        ),
      ],
    );
  }

  Widget _buildMedicalCheckbox({
    required String title,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return CheckboxListTile(
      value: value,
      onChanged: (v) => onChanged(v ?? false),
      title: Text(
        title,
        style: const TextStyle(color: Colors.white, fontSize: 14),
      ),
      activeColor: Colors.amberAccent,
      checkColor: Colors.black,
      controlAffinity: ListTileControlAffinity.leading,
      contentPadding: EdgeInsets.zero,
    );
  }

  Widget _build54321GroundingView() {
    final steps = [
      (5, '5 đồ vật bạn NHÌN thấy quanh mình lúc này'),
      (4, '4 bề mặt bạn CHẠM tay cảm nhận được rõ ràng'),
      (3, '3 âm thanh bạn NGHE thấy trong không gian'),
      (2, '2 mùi hương bạn NGỬI thấy quanh đây'),
      (1, '1 điều an toàn ở HIỆN TẠI bạn nhận biết được'),
    ];
    return ListView(
      children: [
        const Text(
          'Kỹ thuật Neo Thực tại 5-4-3-2-1 (Chạm để đếm từng giác quan)',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        for (final item in steps)
          Card(
            color: const Color(0xFF172A30),
            margin: const EdgeInsets.only(bottom: 10),
            child: ListTile(
              title: Text(
                item.$2,
                style: const TextStyle(color: Colors.white),
              ),
              subtitle: Text(
                'Đã ghi nhận: ${_groundingProgress[item.$1]}/${item.$1}',
                style: const TextStyle(color: Colors.amberAccent),
              ),
              trailing: FilledButton(
                onPressed: () {
                  final curr = _groundingProgress[item.$1] ?? 0;
                  if (curr < item.$1) {
                    setState(() => _groundingProgress[item.$1] = curr + 1);
                  }
                },
                child: Text('+1 (${_groundingProgress[item.$1]}/${item.$1})'),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildStopAndPmrView() {
    return ListView(
      children: const [
        Card(
          color: Color(0xFF172A30),
          child: Padding(
            padding: EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Kỹ năng DBT STOP (Chặn Đứng Xung Động Tức Thì)',
                  style: TextStyle(
                    color: Colors.amberAccent,
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 10),
                Text(
                  '• S — Stop (Dừng lại): Đóng băng cơ thể, không để cảm xúc điều khiển tay chân.\n'
                  '• T — Take a step back (Lùi lại 1 bước): Rời tay khỏi bàn phím/điện thoại, hít 1 hơi sâu.\n'
                  '• O — Observe (Quan sát): Gọi tên cảm giác trong cơ thể và suy nghĩ đang chạy qua.\n'
                  '• P — Proceed Mindfully (Hành động Tỉnh thức): Hỏi Tâm Trí Tuệ điều gì giúp tình hình BỚT tệ đi.',
                  style: TextStyle(color: Colors.white, height: 1.5),
                ),
              ],
            ),
          ),
        ),
        SizedBox(height: 12),
        Card(
          color: Color(0xFF172A30),
          child: Padding(
            padding: EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'TIPP — Thư giãn Cơ Kết hợp Nhịp thở (Paired Muscle Relaxation)',
                  style: TextStyle(
                    color: Colors.lightBlueAccent,
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 10),
                Text(
                  '1. Hít vào sâu và gồng căng nhóm cơ Bàn tay & Cánh tay trong 5 giây.\n'
                  '2. Thở ra chậm, buông lỏng hoàn toàn và nói thầm "Thư giãn".\n'
                  '3. Lặp lại với nhóm cơ Vai – Cổ – Trán và Bàn chân.',
                  style: TextStyle(color: Colors.white, height: 1.5),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildIntensityRerateFooter() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      color: const Color(0xFF15272C),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Sau khi thực hiện kỹ năng, chấm lại cường độ lúc này ($_currentIntensity/10):',
            style: const TextStyle(color: Colors.white70, fontSize: 13),
          ),
          Row(
            children: [
              Expanded(
                child: Slider(
                  value: _currentIntensity.toDouble(),
                  min: 0,
                  max: 10,
                  divisions: 10,
                  label: '$_currentIntensity/10',
                  onChanged: (v) =>
                      setState(() => _currentIntensity = v.round()),
                ),
              ),
              FilledButton(
                onPressed: () =>
                    _recordSkillCompletionAndRerate(_currentIntensity),
                child: const Text('Cập nhật'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
