// lib/presentation/screens/tools_36_and_team_cbt_screen.dart
// Phase 2 (Sprint 3 & Sprint 4) Flutter Clinical Screen providing:
// 1. Searchable & filterable 36 CBT/TEAM-CBT/DBT/Bipolar Interactive Tools hub
//    with instant 0ms deterministic reframe cards.
// 2. Interactive TEAM-CBT Pleasure-Predicting (Mastery & Pleasure M/P) Sheet
//    & Anti-Procrastination 5-Minute Sheet.
// 3. Downward Arrow (23 Self-Defeating Beliefs Uncovering & Cost-Benefit Analysis).
// 4. DBT `ABC PLEASE` Daily Checklist, `ACCEPTS` / 5-Senses Self-Soothe,
//    and `Radical Acceptance` 90-Second Urge Surfing Wave.
// 5. CBT-I Sleep Efficiency Calculator with Bipolar Mania Contraindication Safety Guard.

import 'package:flutter/material.dart';

import '../../domain/engine/phase2_clinical_tools.dart';
import '../../domain/models/clinical_models.dart';

class Tools36AndTeamCbtScreen extends StatefulWidget {
  final int currentMoodPolarity;
  final FeltNeedForSleep currentFeltNeedForSleep;

  const Tools36AndTeamCbtScreen({
    super.key,
    required this.currentMoodPolarity,
    required this.currentFeltNeedForSleep,
  });

  @override
  State<Tools36AndTeamCbtScreen> createState() =>
      _Tools36AndTeamCbtScreenState();
}

class _Tools36AndTeamCbtScreenState extends State<Tools36AndTeamCbtScreen> {
  // 1. 36 Tools Hub state
  String _searchQuery = '';
  String _selectedCategory = 'ALL';
  String _selectedToolSlug = kFlutter36ClinicalTools.first.slug;
  final TextEditingController _toolInputCtrl = TextEditingController(
    text: 'Một lỗi nhỏ làm hỏng hết, tôi sợ mọi người sẽ đánh giá tôi thất bại.',
  );
  FlutterClinicalToolExecutionResult? _lastToolResult;

  // 2. Pleasure-Predicting (M/P) Sheet state
  final TextEditingController _mpActivityCtrl = TextEditingController(
    text: 'Đi bộ 10 phút quanh công viên & pha 1 tách trà ấm',
  );
  int _predictedPleasure = 20;
  int _actualPleasure = 65;
  int _predictedMastery = 3;
  int _actualMastery = 8;
  final List<PleasurePredictingEntry> _mpEntries = [];

  // 3. Anti-Procrastination 5-Minute Sheet state
  final TextEditingController _apTaskCtrl = TextEditingController(
    text: 'Hoàn thành báo cáo tổng kết dự án dài 15 trang',
  );
  final TextEditingController _apMicroStepCtrl = TextEditingController(
    text: 'Mở file tài liệu và viết đúng 3 gạch đầu dòng dàn ý trong 5 phút',
  );
  int _predictedDifficulty = 85;
  int _actualDifficulty = 30;
  int _predictedSatisfaction = 25;
  int _actualSatisfaction = 75;
  final List<AntiProcrastinationStepEvaluation> _apEntries = [];

  // 4. Downward Arrow 23 SDBs state
  final TextEditingController _downwardThoughtCtrl = TextEditingController(
    text: 'Nếu tôi mắc một lỗi nhỏ trong buổi thuyết trình, mọi người sẽ coi thường tôi.',
  );
  String _downwardMode = 'individual';
  late DownwardArrowSdbResult _downwardResult;

  // 5. DBT ABC PLEASE, ACCEPTS & Radical Acceptance Urge Surfing state
  DbtAbcPleaseChecklistState _abcPleaseState = const DbtAbcPleaseChecklistState(
    accumulatePositives: true,
    buildMastery: true,
    balancedSleep: true,
    avoidMoodAlteringSubstances: true,
  );
  int _urgeWaveSeconds = 35;

  // 6. CBT-I Sleep Efficiency Calculator state
  double _timeInBedHours = 8.5;
  double _totalSleepHours = 6.0;
  late FeltNeedForSleep _cbtiFeltNeed;

  @override
  void initState() {
    super.initState();
    _cbtiFeltNeed = widget.currentFeltNeedForSleep;
    _lastToolResult = runFlutterClinicalTool(
      _selectedToolSlug,
      _toolInputCtrl.text,
      moodPolarity: widget.currentMoodPolarity,
    );
    _downwardResult = runDownwardArrowSdbUncovering(
      automaticThought: _downwardThoughtCtrl.text,
      mode: _downwardMode,
    );
    _mpEntries.add(
      const PleasurePredictingEntry(
        id: 'mp-seed-1',
        activityTitle: 'Đọc 3 trang sách tâm lý & uống trà',
        predictedPleasurePct: 15,
        actualPleasurePct: 60,
        predictedMasteryScore: 2,
        actualMasteryScore: 7,
      ),
    );
    _apEntries.add(
      const AntiProcrastinationStepEvaluation(
        id: 'ap-seed-1',
        overwhelmingTask: 'Dọn dẹp toàn bộ căn phòng bừa bộn',
        fiveMinuteMicroStep: 'Chỉ thu gọn mặt bàn làm việc trong đúng 5 phút',
        predictedDifficultyPct: 90,
        predictedSatisfactionPct: 20,
        actualDifficultyPct: 30,
        actualSatisfactionPct: 75,
      ),
    );
  }

  @override
  void dispose() {
    _toolInputCtrl.dispose();
    _mpActivityCtrl.dispose();
    _apTaskCtrl.dispose();
    _apMicroStepCtrl.dispose();
    _downwardThoughtCtrl.dispose();
    super.dispose();
  }

  List<FlutterClinicalToolDescriptor> get _filteredTools {
    final q = _searchQuery.trim().toLowerCase();
    return kFlutter36ClinicalTools.where((tool) {
      final matchesCat =
          _selectedCategory == 'ALL' || tool.category == _selectedCategory;
      final matchesQuery = q.isEmpty ||
          tool.titleVi.toLowerCase().contains(q) ||
          tool.titleEn.toLowerCase().contains(q) ||
          tool.slug.toLowerCase().contains(q) ||
          tool.clinicalSummaryVi.toLowerCase().contains(q);
      return matchesCat && matchesQuery;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _build36ToolsCatalogCard(),
        const SizedBox(height: 14),
        _buildPleasurePredictingSheetCard(),
        const SizedBox(height: 14),
        _buildAntiProcrastinationSheetCard(),
        const SizedBox(height: 14),
        _buildDownwardArrowSdbCard(),
        const SizedBox(height: 14),
        _buildDbtAbcPleaseAndAcceptsCard(),
        const SizedBox(height: 14),
        _buildRadicalAcceptanceUrgeSurfingCard(),
        const SizedBox(height: 14),
        _buildCbtiSleepEfficiencyCard(),
        const SizedBox(height: 80),
      ],
    );
  }

  Widget _build36ToolsCatalogCard() {
    final filtered = _filteredTools;
    const categories = <String>[
      'ALL',
      'CBT-Core',
      'TEAM-CBT',
      'Anxiety-ERP',
      'Depression-BA',
      'DBT',
      'Bipolar-IPSRT',
    ];

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Kho 36 Công cụ Tương tác CBT • TEAM-CBT • DBT • Lưỡng cực (0ms Deterministic Engine • Hiện có ${kFlutter36ClinicalTools.length}/36 công cụ)',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            TextField(
              decoration: const InputDecoration(
                labelText: 'Tìm kiếm trong 36 công cụ (VD: Thought Record, Devil\'s Advocate, TIPP, SDB...)',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
              ),
              onChanged: (val) => setState(() => _searchQuery = val),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: categories
                  .map(
                    (cat) => ChoiceChip(
                      label: Text(cat),
                      selected: _selectedCategory == cat,
                      onSelected: (_) => setState(() => _selectedCategory = cat),
                    ),
                  )
                  .toList(),
            ),
            const SizedBox(height: 10),
            Text(
              'Đang hiển thị ${filtered.length}/36 công cụ. Chạm vào 1 công cụ để chạy phân tích 0ms:',
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 6),
            SizedBox(
              height: 185,
              child: ListView.builder(
                itemCount: filtered.length,
                itemBuilder: (context, idx) {
                  final tool = filtered[idx];
                  final selected = tool.slug == _selectedToolSlug;
                  return ListTile(
                    dense: true,
                    selected: selected,
                    leading: CircleAvatar(
                      radius: 14,
                      child: Text(
                        '${tool.number}',
                        style: const TextStyle(fontSize: 11),
                      ),
                    ),
                    title: Text(
                      tool.titleVi,
                      style: TextStyle(
                        fontWeight:
                            selected ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                    subtitle: Text('${tool.modality} • ${tool.clinicalSummaryVi}'),
                    onTap: () {
                      setState(() {
                        _selectedToolSlug = tool.slug;
                        _lastToolResult = runFlutterClinicalTool(
                          tool.slug,
                          _toolInputCtrl.text,
                          moodPolarity: widget.currentMoodPolarity,
                        );
                      });
                    },
                  );
                },
              ),
            ),
            const Divider(height: 20),
            TextField(
              controller: _toolInputCtrl,
              maxLines: 2,
              decoration: const InputDecoration(
                labelText: 'Nhập tình huống / suy nghĩ để chạy công cụ đã chọn (0ms Offline)',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 8),
            FilledButton.icon(
              onPressed: () {
                setState(() {
                  _lastToolResult = runFlutterClinicalTool(
                    _selectedToolSlug,
                    _toolInputCtrl.text,
                    moodPolarity: widget.currentMoodPolarity,
                  );
                });
              },
              icon: const Icon(Icons.bolt),
              label: const Text('Chạy Công cụ 0ms & Sinh Thẻ Tái cấu trúc Socratic'),
            ),
            if (_lastToolResult != null) ...[
              const SizedBox(height: 10),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: _lastToolResult!.safetyStopTriggered
                      ? const Color(0xFFFFDAD6)
                      : const Color(0xFFE8F3EE),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _lastToolResult!.deterministicReframeVi,
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 6),
                    Text('Câu hỏi Socratic: ${_lastToolResult!.socraticQuestionVi}'),
                    const SizedBox(height: 4),
                    Text(
                      'Bước gợi ý tiếp theo: ${_lastToolResult!.recommendedNextActionVi}',
                      style: const TextStyle(fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildPleasurePredictingSheetCard() {
    final previewEntry = PleasurePredictingEntry(
      id: 'preview',
      activityTitle: _mpActivityCtrl.text,
      predictedPleasurePct: _predictedPleasure,
      actualPleasurePct: _actualPleasure,
      predictedMasteryScore: _predictedMastery,
      actualMasteryScore: _actualMastery,
    );

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'TEAM-CBT Pleasure-Predicting Sheet (Dự đoán Niềm vui P & Thành tựu M)',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            const Text(
              'Ghi nhận riêng 2 điểm M (Mastery - Cảm giác hoàn thành 0..10) và P (Pleasure - Niềm vui 0..100%) trước và sau khi làm để hiệu chỉnh sai số dự đoán trầm cảm.',
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _mpActivityCtrl,
              decoration: const InputDecoration(
                labelText: 'Hoạt động nhỏ thử nghiệm',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Niềm vui Dự đoán (Predicted P): $_predictedPleasure%  •  Thực tế (Actual P): $_actualPleasure% (Delta: ${previewEntry.pleasurePredictionErrorDelta >= 0 ? "+${previewEntry.pleasurePredictionErrorDelta}" : previewEntry.pleasurePredictionErrorDelta}%)',
            ),
            Slider(
              value: _predictedPleasure.toDouble(),
              min: 0,
              max: 100,
              divisions: 20,
              label: 'Dự đoán P: $_predictedPleasure%',
              onChanged: (v) => setState(() => _predictedPleasure = v.round()),
            ),
            Slider(
              value: _actualPleasure.toDouble(),
              min: 0,
              max: 100,
              divisions: 20,
              label: 'Thực tế P: $_actualPleasure%',
              onChanged: (v) => setState(() => _actualPleasure = v.round()),
            ),
            Text(
              'Thành tựu Dự đoán (Predicted M): $_predictedMastery/10  •  Thực tế (Actual M): $_actualMastery/10 (Delta: +${previewEntry.masteryPredictionErrorDelta}/10)',
            ),
            Slider(
              value: _actualMastery.toDouble(),
              min: 0,
              max: 10,
              divisions: 10,
              label: 'Thực tế M: $_actualMastery/10',
              onChanged: (v) => setState(() => _actualMastery = v.round()),
            ),
            FilledButton.tonalIcon(
              onPressed: () {
                final title = _mpActivityCtrl.text.trim();
                if (title.isEmpty) return;
                setState(() {
                  _mpEntries.insert(
                    0,
                    PleasurePredictingEntry(
                      id: 'mp-${DateTime.now().millisecondsSinceEpoch}',
                      activityTitle: title,
                      predictedPleasurePct: _predictedPleasure,
                      actualPleasurePct: _actualPleasure,
                      predictedMasteryScore: _predictedMastery,
                      actualMasteryScore: _actualMastery,
                    ),
                  );
                });
              },
              icon: const Icon(Icons.add_chart),
              label: const Text('Lưu Bản ghi M/P & Tính Sai số Dự đoán'),
            ),
            const SizedBox(height: 8),
            for (final entry in _mpEntries.take(3))
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(entry.activityTitle),
                subtitle: Text(entry.clinicalInsightVi),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildAntiProcrastinationSheetCard() {
    final preview = AntiProcrastinationStepEvaluation(
      id: 'ap-preview',
      overwhelmingTask: _apTaskCtrl.text,
      fiveMinuteMicroStep: _apMicroStepCtrl.text,
      predictedDifficultyPct: _predictedDifficulty,
      predictedSatisfactionPct: _predictedSatisfaction,
      actualDifficultyPct: _actualDifficulty,
      actualSatisfactionPct: _actualSatisfaction,
    );

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'TEAM-CBT Anti-Procrastination 5-Minute Sheet (Bảng Chống Trì hoãn 5 Phút)',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _apTaskCtrl,
              decoration: const InputDecoration(
                labelText: 'Việc lớn đang bị trì hoãn',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _apMicroStepCtrl,
              decoration: const InputDecoration(
                labelText: 'Bước vi mô làm thử trong đúng 5 phút đầu tiên',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Độ khó Dự đoán: $_predictedDifficulty% vs. Độ khó Thực tế: $_actualDifficulty% (Dễ hơn dự đoán: ${preview.difficultyReliefDelta}%)',
            ),
            Slider(
              value: _actualDifficulty.toDouble(),
              min: 0,
              max: 100,
              divisions: 20,
              label: 'Độ khó thực tế: $_actualDifficulty%',
              onChanged: (v) => setState(() => _actualDifficulty = v.round()),
            ),
            Text(
              'Hài lòng Dự đoán: $_predictedSatisfaction% vs. Thực tế: $_actualSatisfaction% (Tăng: +${preview.satisfactionGainDelta}%)',
            ),
            FilledButton.tonalIcon(
              onPressed: () {
                setState(() {
                  _apEntries.insert(0, preview);
                });
              },
              icon: const Icon(Icons.timer_outlined),
              label: const Text('Ghi nhận Bước 5 Phút Đã Hoàn thành'),
            ),
            for (final item in _apEntries.take(2))
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(item.fiveMinuteMicroStep),
                subtitle: Text(item.clinicalTakeawayVi),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildDownwardArrowSdbCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Downward Arrow — Khai quật 23 Niềm tin Tự hủy hoại (SDBs) & Cost-Benefit Analysis',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _downwardThoughtCtrl,
              decoration: const InputDecoration(
                labelText: 'Suy nghĩ tự động khởi đầu chuỗi Mũi tên Đi xuống',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: [
                ChoiceChip(
                  label: const Text('Individual Downward Arrow'),
                  selected: _downwardMode == 'individual',
                  onSelected: (_) {
                    setState(() {
                      _downwardMode = 'individual';
                      _downwardResult = runDownwardArrowSdbUncovering(
                        automaticThought: _downwardThoughtCtrl.text,
                        mode: _downwardMode,
                      );
                    });
                  },
                ),
                ChoiceChip(
                  label: const Text('Interpersonal Downward Arrow'),
                  selected: _downwardMode == 'interpersonal',
                  onSelected: (_) {
                    setState(() {
                      _downwardMode = 'interpersonal';
                      _downwardResult = runDownwardArrowSdbUncovering(
                        automaticThought: _downwardThoughtCtrl.text,
                        mode: _downwardMode,
                      );
                    });
                  },
                ),
              ],
            ),
            const SizedBox(height: 8),
            for (final step in _downwardResult.arrowChainVi)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 2),
                child: Text(step),
              ),
            const SizedBox(height: 6),
            Text(
              'Niềm tin thay thế lành mạnh (CBA): ${_downwardResult.healthyReplacementBeliefVi}',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDbtAbcPleaseAndAcceptsCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'DBT ABC PLEASE Daily Checklist & Thẻ Xoa dịu ACCEPTS / 5 Giác quan',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            Text(
              _abcPleaseState.clinicalSummaryVi,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            CheckboxListTile(
              dense: true,
              value: _abcPleaseState.accumulatePositives,
              onChanged: (v) => setState(
                () => _abcPleaseState =
                    _abcPleaseState.copyWith(accumulatePositives: v ?? false),
              ),
              title: const Text('A — Accumulate Positives (Tích lũy 1 khoảnh khắc dễ chịu nhỏ)'),
            ),
            CheckboxListTile(
              dense: true,
              value: _abcPleaseState.buildMastery,
              onChanged: (v) => setState(
                () => _abcPleaseState =
                    _abcPleaseState.copyWith(buildMastery: v ?? false),
              ),
              title: const Text('B — Build Mastery (Làm 1 việc nhỏ tạo cảm giác tự chủ)'),
            ),
            CheckboxListTile(
              dense: true,
              value: _abcPleaseState.copeAhead,
              onChanged: (v) => setState(
                () => _abcPleaseState =
                    _abcPleaseState.copyWith(copeAhead: v ?? false),
              ),
              title: const Text('C — Cope Ahead (Diễn tập trước phương án ứng phó tình huống khó)'),
            ),
            CheckboxListTile(
              dense: true,
              value: _abcPleaseState.balancedSleep,
              onChanged: (v) => setState(
                () => _abcPleaseState =
                    _abcPleaseState.copyWith(balancedSleep: v ?? false),
              ),
              title: const Text('PLEASE — Giấc ngủ, Dinh dưỡng, Uống thuốc đúng giờ & Vận động nhẹ'),
            ),
            const Divider(),
            const Text(
              'Thẻ Xoa dịu Nhanh DBT ACCEPTS & 5 Giác quan (Self-Soothe):',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            for (final card in kDbtAcceptsAndFiveSensesCards.take(5))
              ListTile(
                dense: true,
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.spa_outlined),
                title: Text(card.titleVi),
                subtitle: Text(card.microActionVi),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildRadicalAcceptanceUrgeSurfingCard() {
    final guide = evaluateUrgeSurfingWave(elapsedSeconds: _urgeWaveSeconds);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'DBT Radical Acceptance & Cưỡi Sóng Xung động 90 Giây (Urge Surfing)',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text('Thời gian trên con sóng adrenaline: $_urgeWaveSeconds / 90 giây'),
            Slider(
              value: _urgeWaveSeconds.toDouble(),
              min: 0,
              max: 90,
              divisions: 18,
              label: '${_urgeWaveSeconds}s',
              onChanged: (v) => setState(() => _urgeWaveSeconds = v.round()),
            ),
            Text(
              guide.phaseTitleVi,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            Text(guide.somaticInstructionVi),
            const SizedBox(height: 4),
            Text(
              guide.dialecticalReminderVi,
              style: const TextStyle(fontStyle: FontStyle.italic),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCbtiSleepEfficiencyCard() {
    final cbti = calculateCbtiSleepEfficiency(
      totalTimeInBedHours: _timeInBedHours,
      totalSleepTimeHours: _totalSleepHours,
      feltNeedForSleep: _cbtiFeltNeed,
      moodPolarity: widget.currentMoodPolarity,
    );

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'CBT-I Sleep Efficiency Calculator & Lá chắn Chống Hưng cảm (Bipolar Safety Guard)',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Tổng thời gian nằm trên giường (TIB): ${_timeInBedHours.toStringAsFixed(1)}h • Tổng thời gian thực ngủ (TST): ${_totalSleepHours.toStringAsFixed(1)}h',
            ),
            Slider(
              value: _timeInBedHours,
              min: 2,
              max: 14,
              divisions: 24,
              label: 'TIB: ${_timeInBedHours.toStringAsFixed(1)}h',
              onChanged: (v) => setState(() {
                _timeInBedHours = v;
                if (_totalSleepHours > _timeInBedHours) {
                  _totalSleepHours = _timeInBedHours;
                }
              }),
            ),
            Slider(
              value: _totalSleepHours,
              min: 0,
              max: _timeInBedHours,
              divisions: 24,
              label: 'TST: ${_totalSleepHours.toStringAsFixed(1)}h',
              onChanged: (v) => setState(() => _totalSleepHours = v),
            ),
            DropdownButtonFormField<FeltNeedForSleep>(
              value: _cbtiFeltNeed,
              isExpanded: true,
              decoration: const InputDecoration(
                labelText: 'Cảm nhận Nhu cầu Ngủ (Cổng kiểm tra chống chỉ định Lưỡng cực)',
                border: OutlineInputBorder(),
              ),
              items: FeltNeedForSleep.values
                  .map(
                    (f) => DropdownMenuItem(
                      value: f,
                      child: Text(f.labelVi),
                    ),
                  )
                  .toList(),
              onChanged: (v) {
                if (v != null) setState(() => _cbtiFeltNeed = v);
              },
            ),
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: cbti.bipolarManiaContraindicationBlocked
                    ? const Color(0xFFFFDAD6)
                    : const Color(0xFFE8F3EE),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Hiệu suất giấc ngủ (Sleep Efficiency): ${cbti.sleepEfficiencyPct}%',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(cbti.clinicalRecommendationVi),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
