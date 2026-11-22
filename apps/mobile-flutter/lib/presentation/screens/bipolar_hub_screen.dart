// lib/presentation/screens/bipolar_hub_screen.dart
// Dedicated Bipolar Disorder (Bipolar I, II, Cyclothymia) & IPSRT Clinical Hub:
// 1. Dual-Pole (-5..+5) Mood & Energy Multi-Axis Chart (`fl_chart`) with Sleep correlation
// 2. 5 IPSRT Circadian & Social Rhythm Anchors + Stability Score Calculator
// 3. 48-Hour Impulse Vault (DBT Crisis Pros & Cons 4-box grid + David Burns Devil's Advocate
//    + Two-Person Reality Check lock)
// 4. Ulysses Contract (Relapse Prevention Plan created while euthymic at 0)
// 5. Medication Adherence CBT (Mood stabilizer tracker + Cost-Benefit Analysis against stopping meds).

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../domain/engine/bipolar_ipsrt_engine.dart';
import '../../domain/engine/distortion_detector.dart';
import '../../domain/models/clinical_models.dart';

class BipolarHubScreen extends StatefulWidget {
  final List<DailyMoodAndRhythmLog> moodLogs;
  final List<ImpulseVaultItem> impulseVaultItems;
  final UlyssesContract ulyssesContract;
  final int latestAsrmScore;
  final ValueChanged<DailyMoodAndRhythmLog> onAddMoodLog;
  final ValueChanged<ImpulseVaultItem> onAddImpulseVaultItem;
  final ValueChanged<UlyssesContract> onUpdateUlyssesContract;

  const BipolarHubScreen({
    super.key,
    required this.moodLogs,
    required this.impulseVaultItems,
    required this.ulyssesContract,
    required this.latestAsrmScore,
    required this.onAddMoodLog,
    required this.onAddImpulseVaultItem,
    required this.onUpdateUlyssesContract,
  });

  @override
  State<BipolarHubScreen> createState() => _BipolarHubScreenState();
}

class _BipolarHubScreenState extends State<BipolarHubScreen> {
  final BipolarIpsrtEngine _bipolarEngine = const BipolarIpsrtEngine();
  final DistortionDetector _detector = const DistortionDetector();

  // 48-Hour Impulse Vault form controllers
  final TextEditingController _impulseTitleCtrl = TextEditingController();
  final TextEditingController _prosActCtrl = TextEditingController();
  final TextEditingController _consActCtrl = TextEditingController();
  final TextEditingController _prosWaitCtrl = TextEditingController();
  final TextEditingController _consWaitCtrl = TextEditingController();
  final TextEditingController _devilsAdvocateCtrl = TextEditingController();
  bool _requestTwoPersonCheck = true;

  // IPSRT 5 anchors quick edit state
  String _outOfBed = '07:00';
  String _firstContact = '08:15';
  String _workStart = '09:00';
  String _dinner = '19:00';
  String _bedTime = '23:00';

  @override
  void dispose() {
    _impulseTitleCtrl.dispose();
    _prosActCtrl.dispose();
    _consActCtrl.dispose();
    _prosWaitCtrl.dispose();
    _consWaitCtrl.dispose();
    _devilsAdvocateCtrl.dispose();
    super.dispose();
  }

  void _lockImpulseIn48hVault() {
    final title = _impulseTitleCtrl.text.trim();
    if (title.isEmpty) return;

    final analysis = _detector.analyzeText(
      text: '$title ${_prosActCtrl.text}',
      moodPolarity:
          widget.moodLogs.isNotEmpty ? widget.moodLogs.first.moodPolarity : 2,
    );
    final now = DateTime.now();
    final item = ImpulseVaultItem(
      id: 'vault-${now.millisecondsSinceEpoch}',
      impulseTitle: title,
      category: 'financial_or_major_decision',
      moodPolarityWhenLogged:
          widget.moodLogs.isNotEmpty ? widget.moodLogs.first.moodPolarity : 2,
      createdAt: now,
      unlocksAt: now.add(const Duration(hours: 48)),
      prosOfActingNow: _prosActCtrl.text.trim(),
      consOfActingNow: _consActCtrl.text.trim(),
      prosOfWaiting48h: _prosWaitCtrl.text.trim(),
      consOfWaiting48h: _consWaitCtrl.text.trim(),
      devilsAdvocateCounterArgument: _devilsAdvocateCtrl.text.trim(),
      twoPersonRealityCheckRequested: _requestTwoPersonCheck,
      positiveDistortionsDetected:
          analysis.positiveDistortions.map((d) => d.nameVi).toList(),
    );

    widget.onAddImpulseVaultItem(item);
    _impulseTitleCtrl.clear();
    _prosActCtrl.clear();
    _consActCtrl.clear();
    _prosWaitCtrl.clear();
    _consWaitCtrl.clear();
    _devilsAdvocateCtrl.clear();
  }

  @override
  Widget build(BuildContext context) {
    final eval = _bipolarEngine.evaluateLogs(
      recentLogs: widget.moodLogs,
      latestAsrmScore: widget.latestAsrmScore,
      contract: widget.ulyssesContract,
    );

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildProdromeAndMixedStateAlertCard(eval),
        const SizedBox(height: 12),
        _buildDualPoleMoodAndEnergyChartCard(),
        const SizedBox(height: 12),
        _buildIpsrtFiveAnchorsCard(eval.ipsrtStabilityScore),
        const SizedBox(height: 12),
        _build48HourImpulseVaultCard(),
        const SizedBox(height: 12),
        _buildMedicationAdherenceCbtCard(),
        const SizedBox(height: 12),
        _buildUlyssesContractCard(),
      ],
    );
  }

  Widget _buildProdromeAndMixedStateAlertCard(BipolarClinicalEvaluation eval) {
    final hasAlert =
        eval.mixedStateDetected || eval.maniaProdromeDetected || eval.severeDepressionDetected;
    return Card(
      color: eval.mixedStateDetected
          ? const Color(0xFF691919)
          : eval.maniaProdromeDetected
              ? const Color(0xFF4A3212)
              : null,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  hasAlert ? Icons.warning_amber_rounded : Icons.verified_user,
                  color: hasAlert ? Colors.amberAccent : Colors.teal,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    eval.mixedStateDetected
                        ? 'CẢNH BÁO ĐỎ: PHA HỖN HỢP (MIXED STATE) — ƯU TIÊN DBT TIPP'
                        : eval.maniaProdromeDetected
                            ? 'LÁ CHẮN HƯNG CẢM NHẸ (HYPOMANIA GUARD ĐANG BẬT)'
                            : 'Trạng thái Lưỡng cực & Nhịp Sinh học IPSRT',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: hasAlert ? Colors.white : null,
                    ),
                  ),
                ),
              ],
            ),
            if (eval.clinicalWarningsVi.isNotEmpty) ...[
              const SizedBox(height: 8),
              for (final w in eval.clinicalWarningsVi)
                Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Text(
                    '• $w',
                    style: TextStyle(
                      color: hasAlert ? Colors.amberAccent : null,
                    ),
                  ),
                ),
            ],
            if (eval.recommendedActionsVi.isNotEmpty) ...[
              const SizedBox(height: 6),
              for (final a in eval.recommendedActionsVi)
                Text(
                  '→ $a',
                  style: TextStyle(color: hasAlert ? Colors.white70 : null),
                ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDualPoleMoodAndEnergyChartCard() {
    final logsChronological = List<DailyMoodAndRhythmLog>.from(widget.moodLogs)
      ..sort((a, b) => a.loggedAt.compareTo(b.loggedAt));

    final moodSpots = <FlSpot>[];
    final energySpots = <FlSpot>[];
    for (int i = 0; i < logsChronological.length; i++) {
      moodSpots.add(
        FlSpot(i.toDouble(), logsChronological[i].moodPolarity.toDouble()),
      );
      energySpots.add(
        FlSpot(i.toDouble(), logsChronological[i].energyLevel.toDouble()),
      );
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Biểu đồ Khí sắc & Năng lượng Hai Cực (-5 Trầm cảm .. 0 Bình ổn .. +5 Hưng cảm)',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            const Text(
              'Đường Xanh: Khí sắc (Mood Valence) • Đường Cam: Năng lượng (Energy/Activation). '
              'Khi hai đường tách ngược chiều (Mood <= -2 & Energy >= +2) là dấu hiệu Pha Hỗn hợp.',
              style: TextStyle(fontSize: 12),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 210,
              child: moodSpots.isEmpty
                  ? const Center(child: Text('Chưa có dữ liệu biểu đồ'))
                  : LineChart(
                      LineChartData(
                        minY: -5,
                        maxY: 5,
                        gridData: const FlGridData(show: true),
                        titlesData: const FlTitlesData(
                          topTitles: AxisTitles(
                            sideTitles: SideTitles(showTitles: false),
                          ),
                          rightTitles: AxisTitles(
                            sideTitles: SideTitles(showTitles: false),
                          ),
                        ),
                        lineBarsData: [
                          LineChartBarData(
                            spots: moodSpots,
                            isCurved: true,
                            color: const Color(0xFF2C6E63),
                            barWidth: 3,
                            dotData: const FlDotData(show: true),
                          ),
                          LineChartBarData(
                            spots: energySpots,
                            isCurved: true,
                            color: const Color(0xFFD88B28),
                            barWidth: 3,
                            dotData: const FlDotData(show: true),
                          ),
                        ],
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildIpsrtFiveAnchorsCard(double stabilityScore) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Wrap(
              alignment: WrapAlignment.spaceBetween,
              crossAxisAlignment: WrapCrossAlignment.center,
              spacing: 8,
              runSpacing: 6,
              children: [
                const Text(
                  '5 Điểm Neo Nhịp Sinh Học (IPSRT)',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.teal.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.teal.shade300),
                  ),
                  child: Text(
                    'Ổn định: ${stabilityScore.toStringAsFixed(0)}/100',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Colors.teal.shade900,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 10,
              runSpacing: 8,
              children: [
                _buildAnchorChip('1. Ra khỏi giường', _outOfBed, (v) => setState(() => _outOfBed = v)),
                _buildAnchorChip('2. Tiếp xúc đầu tiên', _firstContact, (v) => setState(() => _firstContact = v)),
                _buildAnchorChip('3. Bắt đầu làm/học', _workStart, (v) => setState(() => _workStart = v)),
                _buildAnchorChip('4. Ăn tối', _dinner, (v) => setState(() => _dinner = v)),
                _buildAnchorChip('5. Đi ngủ', _bedTime, (v) => setState(() => _bedTime = v)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAnchorChip(
    String label,
    String timeValue,
    ValueChanged<String> onSelected,
  ) {
    return ActionChip(
      avatar: const Icon(Icons.schedule, size: 16),
      label: Text('$label: $timeValue'),
      onPressed: () async {
        final parts = timeValue.split(':');
        final picked = await showTimePicker(
          context: context,
          initialTime: TimeOfDay(
            hour: int.tryParse(parts[0]) ?? 7,
            minute: int.tryParse(parts[1]) ?? 0,
          ),
        );
        if (picked != null) {
          final formatted =
              '${picked.hour.toString().padLeft(2, '0')}:${picked.minute.toString().padLeft(2, '0')}';
          onSelected(formatted);
        }
      },
    );
  }

  Widget _build48HourImpulseVaultCard() {
    final now = DateTime.now();
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.lock_clock, color: Colors.amber),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Khoang Trì hoãn Quyết định 48 Giờ (48-Hour Impulse Vault)',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            const Text(
              'Kết hợp DBT Crisis Pros & Cons (4 ô) + Kỹ thuật Devil\'s Advocate của David Burns + Tham khảo 2 Người Tin cậy.',
              style: TextStyle(fontSize: 13),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _impulseTitleCtrl,
              decoration: const InputDecoration(
                labelText: 'Quyết định / Khoản chi tiêu / Dự án đang muốn làm ngay',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _prosActCtrl,
                    decoration: const InputDecoration(
                      labelText: '1. Lợi ích nếu làm ngay',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: _consActCtrl,
                    decoration: const InputDecoration(
                      labelText: '2. Rủi ro nếu làm ngay',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _prosWaitCtrl,
                    decoration: const InputDecoration(
                      labelText: '3. Lợi ích nếu chờ 48h',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: _consWaitCtrl,
                    decoration: const InputDecoration(
                      labelText: '4. Bất lợi nếu chờ 48h',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _devilsAdvocateCtrl,
              decoration: const InputDecoration(
                labelText:
                    'Devil\'s Advocate: "Nếu có 20% khả năng đây là xung động hưng cảm nhẹ, dấu hiệu đó là gì?"',
                border: OutlineInputBorder(),
              ),
            ),
            CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              value: _requestTwoPersonCheck,
              onChanged: (v) =>
                  setState(() => _requestTwoPersonCheck = v ?? true),
              title: const Text(
                'Bật quy tắc "Two-Person Reality Check" (Hỏi ý kiến 2 người tin cậy trước khi mở khóa)',
                style: TextStyle(fontSize: 13),
              ),
            ),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: _lockImpulseIn48hVault,
                icon: const Icon(Icons.lock),
                label: const Text('Khóa Quyết Định Vào Khoang Chờ 48 Giờ'),
              ),
            ),
            if (widget.impulseVaultItems.isNotEmpty) ...[
              const Divider(height: 24),
              const Text(
                'Các Quyết định Đang Khóa Bảo Vệ:',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              for (final item in widget.impulseVaultItems)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.hourglass_top, color: Colors.amber),
                  title: Text(item.impulseTitle),
                  subtitle: Text(
                    'Còn lại: ${item.remainingLockDuration(now).inHours}h • '
                    'Two-Person Check: ${item.twoPersonRealityCheckRequested ? "Có" : "Không"}'
                    '${item.positiveDistortionsDetected.isNotEmpty ? "\nBiến dạng Dương tính: ${item.positiveDistortionsDetected.join(", ")}" : ""}',
                  ),
                ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildMedicationAdherenceCbtCard() {
    return const Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.medication, color: Colors.teal),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Tuân thủ Thuốc Ổn định Khí sắc & CBT Chống Bỏ Thuốc',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            SizedBox(height: 8),
            Text(
              'Phản biện Niềm tin Tự ý Ngưng thuốc (Cost-Benefit Analysis):\n'
              '• Suy nghĩ: "Mình đã khỏe hoàn toàn rồi, không cần uống thuốc nữa" hoặc "Thuốc làm mình mất sự sáng tạo".\n'
              '• Thực tế Lâm sàng: Cảm giác bình ổn hiện tại chính là bằng chứng thuốc đang bảo vệ não bộ khỏi chu kỳ sụp đổ trầm cảm sau cơn hưng cảm. Tuyệt đối không tự ý thay đổi liều khi chưa trao đổi với bác sĩ tâm thần.',
              style: TextStyle(fontSize: 13, height: 1.45),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUlyssesContractCard() {
    final c = widget.ulyssesContract;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.shield_outlined, color: Colors.indigo),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Bản Giao ước Bình ổn (Ulysses Contract — Lập khi Khí sắc = 0)',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              '• Dấu hiệu Tiền triệu Hưng cảm của riêng tôi: ${c.personalManiaProdromes.join("; ")}\n'
              '• Dấu hiệu Tiền triệu Trầm cảm của riêng tôi: ${c.personalDepressionProdromes.join("; ")}\n'
              '• Tự động bật Low-Stimulus Dark Rest UI khi Cực khí sắc >= +${c.autoActivateLowStimulusUiAtPole}\n'
              '• Các bước Hạ nhiệt đã cam kết:\n  - ${c.agreedDeescalationSteps.join("\n  - ")}',
              style: const TextStyle(fontSize: 13, height: 1.5),
            ),
          ],
        ),
      ),
    );
  }
}
