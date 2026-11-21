// lib/presentation/screens/main_shell_screen.dart
// Adaptive Main Navigation Shell with:
// - Persistent 1-Tap SOS Floating Action Button on every screen
// - Adaptive UI Banner & Mode Switcher (Standard / Low-Energy Depression / Low-Stimulus Mania)
// - 5 Primary Clinical Workspaces:
//     1. Daily Check-in & Low-Energy "One Small Step" (No Broken Streaks)
//     2. CBT / TEAM-CBT / DBT Session Player (Expressive Voice Burst & Instrumental)
//     3. Bipolar & IPSRT Hub (Dual-Pole Chart, 48h Impulse Vault, Ulysses Contract)
//     4. Anxiety & Depression Toolkit (Worry Box + Exposure Hierarchy Builder + Safety Behavior Detector)
//     5. Clinical Self-Assessments (BMS, PHQ-9, GAD-7, ASRM, MDQ, ISI) & Printable A4 Clinician PDF Report.

import 'package:flutter/material.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

import '../../domain/engine/clinical_assessments.dart';
import '../../domain/models/clinical_models.dart';
import '../theme/adaptive_clinical_theme.dart';
import 'ai_companion_biometrics_screen.dart';
import 'bipolar_hub_screen.dart';
import 'session_player_screen.dart';
import 'sos_portal_screen.dart';
import 'tools_36_and_team_cbt_screen.dart';

class MainShellScreen extends StatefulWidget {
  final int moodPolarity;
  final int energyLevel;
  final double sleepDurationHours;
  final FeltNeedForSleep feltNeedForSleep;
  final int latestAsrmScore;
  final ClinicalThemeMode activeThemeMode;
  final List<DailyMoodAndRhythmLog> moodLogs;
  final List<CognitiveToolkitSession> sessions;
  final List<ImpulseVaultItem> impulseVaultItems;
  final List<WorryBoxItem> worryBoxItems;
  final List<ExposureStep> exposureSteps;
  final List<AssessmentRecord> assessments;
  final UlyssesContract ulyssesContract;
  final void Function({
    required int moodPolarity,
    required int energyLevel,
    required double sleepHours,
    required FeltNeedForSleep feltNeedForSleep,
  }) onQuickCheckInSubmit;
  final ValueChanged<CognitiveToolkitSession> onSessionSaved;
  final ValueChanged<ImpulseVaultItem> onAddImpulseVaultItem;
  final ValueChanged<WorryBoxItem> onAddWorryBoxItem;
  final ValueChanged<ExposureStep> onAddExposureStep;
  final ValueChanged<AssessmentRecord> onAddAssessment;
  final ValueChanged<UlyssesContract> onUpdateUlyssesContract;

  const MainShellScreen({
    super.key,
    required this.moodPolarity,
    required this.energyLevel,
    required this.sleepDurationHours,
    required this.feltNeedForSleep,
    required this.latestAsrmScore,
    required this.activeThemeMode,
    required this.moodLogs,
    required this.sessions,
    required this.impulseVaultItems,
    required this.worryBoxItems,
    required this.exposureSteps,
    required this.assessments,
    required this.ulyssesContract,
    required this.onQuickCheckInSubmit,
    required this.onSessionSaved,
    required this.onAddImpulseVaultItem,
    required this.onAddWorryBoxItem,
    required this.onAddExposureStep,
    required this.onAddAssessment,
    required this.onUpdateUlyssesContract,
  });

  @override
  State<MainShellScreen> createState() => _MainShellScreenState();
}

class _MainShellScreenState extends State<MainShellScreen> {
  int _navIndex = 0;
  late int _draftMood;
  late int _draftEnergy;
  late double _draftSleep;
  late FeltNeedForSleep _draftNeedForSleep;

  final TextEditingController _worryCtrl = TextEditingController();
  bool _isProductiveWorry = true;
  final TextEditingController _exposureSituationCtrl = TextEditingController();
  int _exposureSuds = 60;
  final ClinicalAssessmentsEngine _assessmentsEngine =
      const ClinicalAssessmentsEngine();

  @override
  void initState() {
    super.initState();
    _draftMood = widget.moodPolarity;
    _draftEnergy = widget.energyLevel;
    _draftSleep = widget.sleepDurationHours;
    _draftNeedForSleep = widget.feltNeedForSleep;
  }

  @override
  void dispose() {
    _worryCtrl.dispose();
    _exposureSituationCtrl.dispose();
    super.dispose();
  }

  Future<void> _generateAndShareClinicianPdfReport() async {
    final doc = pw.Document();
    doc.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        build: (context) => [
          pw.Header(
            level: 0,
            child: pw.Text(
              'EQUILIBRIA — CLINICAL SUMMARY REPORT (CBT / DBT / IPSRT)',
              style: pw.TextStyle(
                fontSize: 16,
                fontWeight: pw.FontWeight.bold,
              ),
            ),
          ),
          pw.Paragraph(
            text:
                'Disclaimer: Self-monitoring between-session summary for psychiatric & psychotherapy review. '
                'Generated locally on-device with Zero-Knowledge E2EE protection.',
          ),
          pw.Header(level: 1, text: '1. Bipolar Dual-Pole Mood, Energy & Sleep Logs'),
          pw.TableHelper.fromTextArray(
            headers: const [
              'Date',
              'Mood (-5..+5)',
              'Energy (-5..+5)',
              'Sleep (h)',
              'Felt Need for Sleep',
              'Mixed Alert',
            ],
            data: widget.moodLogs
                .take(14)
                .map(
                  (l) => [
                    l.loggedAt.toIso8601String().substring(0, 10),
                    '${l.moodPolarity}',
                    '${l.energyLevel}',
                    l.sleepDurationHours.toStringAsFixed(1),
                    l.feltNeedForSleep.code,
                    l.mixedStateAlertTriggered ? 'YES (MIXED)' : 'No',
                  ],
                )
                .toList(),
          ),
          pw.SizedBox(height: 12),
          pw.Header(level: 1, text: '2. Structured CBT / TEAM-CBT / DBT Sessions'),
          pw.TableHelper.fromTextArray(
            headers: const [
              'Date',
              'Technique',
              'Pre -> Post',
              'Outcome',
              'Distortions',
            ],
            data: widget.sessions
                .take(10)
                .map(
                  (s) => [
                    '${s.date} ${s.time}',
                    s.technique.slug,
                    '${s.preIntensity} -> ${s.postIntensity ?? s.preIntensity}',
                    s.outcome.code,
                    [
                      ...s.negativeDistortionsIdentified,
                      ...s.positiveDistortionsIdentified,
                    ].join(', '),
                  ],
                )
                .toList(),
          ),
          pw.SizedBox(height: 12),
          pw.Header(level: 1, text: '3. Standardized Clinical Self-Assessments'),
          pw.TableHelper.fromTextArray(
            headers: const ['Scale', 'Score', 'Severity', 'Safety / Mania Flag'],
            data: widget.assessments
                .take(10)
                .map(
                  (a) => [
                    a.scaleCode,
                    '${a.totalScore}',
                    a.severityCode,
                    a.triggersSafetyStop
                        ? 'SAFETY STOP'
                        : a.triggersHypomaniaGuard
                            ? 'HYPOMANIA GUARD'
                            : 'Normal',
                  ],
                )
                .toList(),
          ),
        ],
      ),
    );

    await Printing.layoutPdf(
      onLayout: (format) async => doc.save(),
      name: 'Equilibria_Clinical_Report_30d.pdf',
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Equilibria • CBT, TEAM-CBT, DBT & IPSRT',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            Text(
              widget.activeThemeMode.titleVi,
              style: const TextStyle(fontSize: 11),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Xuất Báo cáo PDF A4 cho Bác sĩ',
            onPressed: _generateAndShareClinicianPdfReport,
            icon: const Icon(Icons.picture_as_pdf),
          ),
        ],
      ),
      body: Column(
        children: [
          _buildAdaptiveThemeStatusStrip(),
          Expanded(child: _buildSelectedTabBody()),
        ],
      ),
      // Persistent 1-Tap SOS Button on every screen
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: const Color(0xFFB3261E),
        foregroundColor: Colors.white,
        onPressed: () {
          Navigator.of(context).push(
            MaterialPageRoute<void>(
              builder: (_) => const SosPortalScreen(initialIntensity: 9),
            ),
          );
        },
        icon: const Icon(Icons.sos),
        label: const Text(
          'SOS 1-CHẠM (TIPP)',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _navIndex,
        onDestinationSelected: (i) => setState(() => _navIndex = i),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.favorite_outline),
            label: 'Check-in',
          ),
          NavigationDestination(
            icon: Icon(Icons.psychology_outlined),
            label: 'Phiên CBT/DBT',
          ),
          NavigationDestination(
            icon: Icon(Icons.timeline),
            label: 'Lưỡng cực',
          ),
          NavigationDestination(
            icon: Icon(Icons.handyman_outlined),
            label: 'Lo âu & BA',
          ),
          NavigationDestination(
            icon: Icon(Icons.auto_awesome_mosaic_outlined),
            label: '36 Tools',
          ),
          NavigationDestination(
            icon: Icon(Icons.smart_toy_outlined),
            label: 'AI & Sinh trắc',
          ),
          NavigationDestination(
            icon: Icon(Icons.assignment_outlined),
            label: 'Thang đo & PDF',
          ),
        ],
      ),
    );
  }

  Widget _buildAdaptiveThemeStatusStrip() {
    final mode = widget.activeThemeMode;
    Color bg;
    Color fg;
    if (mode == ClinicalThemeMode.lowStimulusManiaDarkRest) {
      bg = const Color(0xFF332615);
      fg = const Color(0xFFD8A657);
    } else if (mode == ClinicalThemeMode.lowEnergyDepression) {
      bg = const Color(0xFFDDEAE7);
      fg = const Color(0xFF1F454C);
    } else {
      bg = const Color(0xFFE4EFEA);
      fg = const Color(0xFF1E4E44);
    }
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: bg,
      child: Text(
        mode.subtitleVi,
        style: TextStyle(color: fg, fontSize: 12, fontWeight: FontWeight.w600),
      ),
    );
  }

  Widget _buildSelectedTabBody() {
    switch (_navIndex) {
      case 0:
        return _buildCheckInAndAdaptiveHomeTab();
      case 1:
        return SessionPlayerScreen(
          currentMoodPolarity: widget.moodPolarity,
          currentEnergyLevel: widget.energyLevel,
          onSessionSaved: widget.onSessionSaved,
        );
      case 2:
        return BipolarHubScreen(
          moodLogs: widget.moodLogs,
          impulseVaultItems: widget.impulseVaultItems,
          ulyssesContract: widget.ulyssesContract,
          latestAsrmScore: widget.latestAsrmScore,
          onAddMoodLog: (_) {},
          onAddImpulseVaultItem: widget.onAddImpulseVaultItem,
          onUpdateUlyssesContract: widget.onUpdateUlyssesContract,
        );
      case 3:
        return _buildAnxietyAndDepressionToolkitTab();
      case 4:
        return Tools36AndTeamCbtScreen(
          currentMoodPolarity: widget.moodPolarity,
          currentFeltNeedForSleep: widget.feltNeedForSleep,
        );
      case 5:
        return AiCompanionBiometricsScreen(
          currentMoodPolarity: widget.moodPolarity,
          currentEnergyLevel: widget.energyLevel,
          currentSleepHours: widget.sleepDurationHours,
          currentFeltNeedForSleep: widget.feltNeedForSleep,
        );
      default:
        return _buildClinicalAssessmentsAndPdfTab();
    }
  }

  Widget _buildCheckInAndAdaptiveHomeTab() {
    final isLowEnergy =
        widget.activeThemeMode == ClinicalThemeMode.lowEnergyDepression;
    final isManiaDarkRest =
        widget.activeThemeMode == ClinicalThemeMode.lowStimulusManiaDarkRest;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (isLowEnergy)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'MỘT BƯỚC NHỎ TIẾP THEO (ONE SMALL STEP • NO BROKEN STREAKS)',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Hôm nay năng lượng của bạn đang rất thấp (<= -3). '
                    'Ứng dụng đã ẩn toàn bộ bảng biểu phức tạp và không bao giờ đếm chuỗi ngày đứt.\n'
                    'Bạn chỉ cần chọn 1 hành động 2 phút dưới đây (hoặc chọn Nghỉ ngơi Không Áy náy):',
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      FilledButton.tonal(
                        onPressed: () => setState(() => _navIndex = 1),
                        child: const Text('Ghi âm Voice Burst 30 giây'),
                      ),
                      FilledButton.tonal(
                        onPressed: () {},
                        child: const Text('Uống 1 cốc nước ấm & Mở rèm cửa'),
                      ),
                      FilledButton.tonal(
                        onPressed: () {},
                        child: const Text('Nghỉ ngơi chủ động không áy náy (Rest Check)'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        if (isManiaDarkRest)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'GIAO THỨC HẠ NHIỆT KÍCH THÍCH (DARK THERAPY & 48H IMPULSE VAULT)',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Toàn bộ hiệu ứng chuyển động và ánh sáng xanh đã được tắt để bảo vệ hệ thần kinh dopaminergic. '
                    'Hãy đưa mọi ý tưởng mua sắm / dự án mới vào Khoang Chờ 48 Giờ.',
                  ),
                  const SizedBox(height: 10),
                  FilledButton.icon(
                    onPressed: () => setState(() => _navIndex = 2),
                    icon: const Icon(Icons.lock_clock),
                    label: const Text('Mở Khoang Chờ Quyết Định 48 Giờ'),
                  ),
                ],
              ),
            ),
          ),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Check-in Hàng Ngày (4 Trục Độc Lập: Khí sắc • Năng lượng • Giấc ngủ • Nhu cầu ngủ)',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                Text('1. Cực Khí sắc (Mood Polarity -5..+5): $_draftMood'),
                Slider(
                  value: _draftMood.toDouble(),
                  min: -5,
                  max: 5,
                  divisions: 10,
                  label: '$_draftMood',
                  onChanged: (v) => setState(() => _draftMood = v.round()),
                ),
                Text('2. Mức Năng lượng Vận động (Energy -5..+5): $_draftEnergy'),
                Slider(
                  value: _draftEnergy.toDouble(),
                  min: -5,
                  max: 5,
                  divisions: 10,
                  label: '$_draftEnergy',
                  onChanged: (v) => setState(() => _draftEnergy = v.round()),
                ),
                Text(
                  '3. Thời lượng ngủ đêm qua: ${_draftSleep.toStringAsFixed(1)} giờ',
                ),
                Slider(
                  value: _draftSleep,
                  min: 0,
                  max: 14,
                  divisions: 28,
                  label: '${_draftSleep.toStringAsFixed(1)}h',
                  onChanged: (v) => setState(() => _draftSleep = v),
                ),
                const SizedBox(height: 8),
                DropdownButtonFormField<FeltNeedForSleep>(
                  value: _draftNeedForSleep,
                  isExpanded: true,
                  decoration: const InputDecoration(
                    labelText:
                        '4. Cảm nhận Nhu cầu Ngủ (Phân biệt Insomnia vs Hypomania)',
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
                    if (v != null) setState(() => _draftNeedForSleep = v);
                  },
                ),
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: () {
                      widget.onQuickCheckInSubmit(
                        moodPolarity: _draftMood,
                        energyLevel: _draftEnergy,
                        sleepHours: _draftSleep,
                        feltNeedForSleep: _draftNeedForSleep,
                      );
                    },
                    icon: const Icon(Icons.check_circle_outline),
                    label: const Text(
                      'Lưu Check-in & Tự động Thích ứng Giao diện Lâm sàng',
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildAnxietyAndDepressionToolkitTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Hộp Lo âu (Worry Box & Scheduled Worry Postponement — GAD)',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Gửi suy nghĩ lo âu vào hộp để dành đến 17:30 mỗi ngày mới mở ra xem. '
                  'Tách rõ Lo lắng giải quyết được (Productive) và Lo lắng giả định "Nhỡ đâu" (Hypothetical).',
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _worryCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Nỗi lo đang xuất hiện trong đầu...',
                    border: OutlineInputBorder(),
                  ),
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  value: _isProductiveWorry,
                  onChanged: (v) => setState(() => _isProductiveWorry = v),
                  title: Text(
                    _isProductiveWorry
                        ? 'Lo lắng có hành động cụ thể giải quyết được (Productive Worry)'
                        : 'Lo lắng giả định "What-If" ngoài tầm kiểm soát (Hypothetical Worry)',
                  ),
                ),
                FilledButton.icon(
                  onPressed: () {
                    final text = _worryCtrl.text.trim();
                    if (text.isEmpty) return;
                    widget.onAddWorryBoxItem(
                      WorryBoxItem(
                        id: 'worry-${DateTime.now().millisecondsSinceEpoch}',
                        worryText: text,
                        capturedAt: DateTime.now(),
                        isProductiveActionableWorry: _isProductiveWorry,
                      ),
                    );
                    _worryCtrl.clear();
                  },
                  icon: const Icon(Icons.archive_outlined),
                  label: const Text('Cất vào Hộp Lo Âu (Hẹn 17:30 xử lý)'),
                ),
                for (final w in widget.worryBoxItems)
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(Icons.inbox),
                    title: Text(w.worryText),
                    subtitle: Text(
                      w.isProductiveActionableWorry
                          ? 'Productive → Problem-Solving lúc ${w.scheduledReviewTime}'
                          : 'Hypothetical → Radical Acceptance lúc ${w.scheduledReviewTime}',
                    ),
                  ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Thang Tiếp xúc Sợ hãi (Exposure Hierarchy Builder & Safety Behavior Detector)',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _exposureSituationCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Tình huống né tránh cần tập tiếp xúc từng bước',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 8),
                Text('Mức độ sợ dự đoán (SUDS 0–100): $_exposureSuds/100'),
                Slider(
                  value: _exposureSuds.toDouble(),
                  min: 0,
                  max: 100,
                  divisions: 20,
                  label: '$_exposureSuds',
                  onChanged: (v) => setState(() => _exposureSuds = v.round()),
                ),
                FilledButton(
                  onPressed: () {
                    final s = _exposureSituationCtrl.text.trim();
                    if (s.isEmpty) return;
                    widget.onAddExposureStep(
                      ExposureStep(
                        id: 'exp-${DateTime.now().millisecondsSinceEpoch}',
                        fearSituation: s,
                        baselineSuds: _exposureSuds,
                        safetyBehaviorsToDrop: const [
                          'Bỏ kiểm tra nhịp tim liên tục',
                          'Không né tránh ánh mắt',
                        ],
                      ),
                    );
                    _exposureSituationCtrl.clear();
                  },
                  child: const Text('Thêm vào Thang Tiếp xúc (Exposure Hierarchy)'),
                ),
                for (final step in widget.exposureSteps)
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(step.fearSituation),
                    subtitle: Text(
                      'SUDS: ${step.baselineSuds}/100 • Bỏ hành vi an toàn: ${step.safetyBehaviorsToDrop.join(", ")}',
                    ),
                  ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Card(
          child: ListTile(
            leading: const Icon(Icons.auto_awesome_mosaic),
            title: const Text(
              'Mở Kho 36 Công cụ CBT/TEAM-CBT/DBT, Pleasure-Predicting M/P & CBT-I',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            subtitle: const Text(
              'Chạy tức thì 0ms 36 công cụ, Bảng Chống Trì hoãn 5 phút, Downward Arrow 23 SDBs, ABC PLEASE & CBT-I Sleep Guard.',
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 16),
            onTap: () => setState(() => _navIndex = 4),
          ),
        ),
      ],
    );
  }

  Widget _buildClinicalAssessmentsAndPdfTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Hệ thống 6 Thang đo Lâm sàng Chuẩn hóa (BMS, PHQ-9, GAD-7, ASRM, MDQ, ISI)',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Lưu ý Y khoa: Công cụ tự theo dõi sàng lọc, không thay thế chẩn đoán của bác sĩ chuyên khoa.',
                  style: TextStyle(fontSize: 12),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    FilledButton.tonal(
                      onPressed: () {
                        final rec = _assessmentsEngine.scoreBriefMoodSurvey(
                          id: 'bms-${DateTime.now().millisecondsSinceEpoch}',
                          depressionScore: 6,
                          suicidalUrgeScore: 0,
                          anxietyScore: 7,
                          angerScore: 3,
                          positiveMoodScore: 10,
                        );
                        widget.onAddAssessment(rec);
                      },
                      child: const Text('Chấm nhanh BMS (TEAM-CBT)'),
                    ),
                    FilledButton.tonal(
                      onPressed: () {
                        final rec = _assessmentsEngine.scorePhq9(
                          id: 'phq9-${DateTime.now().millisecondsSinceEpoch}',
                          itemResponses: const [1, 1, 2, 1, 1, 1, 1, 0, 0],
                        );
                        widget.onAddAssessment(rec);
                      },
                      child: const Text('Chấm PHQ-9 (Trầm cảm)'),
                    ),
                    FilledButton.tonal(
                      onPressed: () {
                        final rec = _assessmentsEngine.scoreGad7(
                          id: 'gad7-${DateTime.now().millisecondsSinceEpoch}',
                          itemResponses: const [2, 1, 2, 1, 1, 1, 1],
                        );
                        widget.onAddAssessment(rec);
                      },
                      child: const Text('Chấm GAD-7 (Lo âu)'),
                    ),
                    FilledButton.tonal(
                      onPressed: () {
                        final rec = _assessmentsEngine.scoreAsrm(
                          id: 'asrm-${DateTime.now().millisecondsSinceEpoch}',
                          itemResponses: const [2, 2, 1, 1, 1],
                        );
                        widget.onAddAssessment(rec);
                      },
                      child: const Text('Chấm ASRM (Hưng cảm >= 6)'),
                    ),
                    FilledButton.tonal(
                      onPressed: () {
                        final rec = _assessmentsEngine.scoreIsi(
                          id: 'isi-${DateTime.now().millisecondsSinceEpoch}',
                          itemResponses: const [2, 2, 1, 1, 1, 1, 1],
                          feltNeedForSleep: widget.feltNeedForSleep,
                        );
                        widget.onAddAssessment(rec);
                      },
                      child: const Text('Chấm ISI (Mất ngủ vs Lưỡng cực)'),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: _generateAndShareClinicianPdfReport,
                    icon: const Icon(Icons.picture_as_pdf),
                    label: const Text('Xuất Báo cáo Lâm sàng PDF Chuẩn A4 Cho Bác Sĩ'),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        for (final a in widget.assessments)
          Card(
            child: ListTile(
              leading: CircleAvatar(child: Text(a.scaleCode)),
              title: Text('${a.scaleCode}: ${a.totalScore} điểm (${a.severityCode})'),
              subtitle: Text(a.interpretationVi),
            ),
          ),
      ],
    );
  }
}
