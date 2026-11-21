// lib/presentation/screens/main_shell_screen.dart
// Haven (Equilibria) Mobile Sanctuary Navigation Shell:
// - Compact "Bình tĩnh" (1-Tap SOS) AppBar button + persistent SOS FAB (< 300ms access)
// - Clean 5-Destination Material 3 NavigationBar:
//     1. Trang chủ: Personalized greeting, quick mood switcher pills, adaptive Low-Energy / Dark Rest cards, 4-axis check-in
//     2. Thực hành: Tâm sự & 7 Bài tập (SessionPlayer) | Góc Lo âu (Worry Box & Exposure) | Kho 36 Công cụ
//     3. Khí sắc: Bipolar & IPSRT Hub (Dual-Pole Chart, 5 Anchors, 48h Impulse Vault, Ulysses Contract)
//     4. Trợ lý AI: Grounded AI Companion (0.46), 2-Tier Memory, Voice Burst Studio & Health Connect / HealthKit
//     5. Tự kiểm tra: 6 Interactive Scales (BMS, PHQ-9, GAD-7, ISI, ASRM, MDQ) | Báo cáo Bác sĩ PDF & #key= | Hồ sơ & Sinh trắc học.

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

import '../../domain/engine/clinical_assessments.dart';
import '../../domain/models/clinical_models.dart';
import '../../domain/models/haven_account_model.dart';
import '../theme/adaptive_clinical_theme.dart';
import 'ai_companion_biometrics_screen.dart';
import 'assessment_runner_screen.dart';
import 'bipolar_hub_screen.dart';
import 'e2ee_clinician_qa_screen.dart';
import 'session_player_screen.dart';
import 'sos_portal_screen.dart';
import 'tools_36_and_team_cbt_screen.dart';

class MainShellScreen extends StatefulWidget {
  final HavenAccountProfile accountProfile;
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
  final Future<bool> Function() onAuthenticateBiometrics;
  final VoidCallback onSignOut;

  const MainShellScreen({
    super.key,
    required this.accountProfile,
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
    required this.onAuthenticateBiometrics,
    required this.onSignOut,
  });

  @override
  State<MainShellScreen> createState() => _MainShellScreenState();
}

class _MainShellScreenState extends State<MainShellScreen> {
  int _navIndex = 0;
  int _practiceSubIndex = 0; // 0: SessionPlayer, 1: Anxiety Hub, 2: 36 Tools
  int _checkSubIndex = 0; // 0: 6 Questionnaires, 1: Doctor Report & E2EE, 2: Profile
  bool _showAdvancedBipolarScales = false;

  late int _draftMood;
  late int _draftEnergy;
  late double _draftSleep;
  late FeltNeedForSleep _draftNeedForSleep;

  final TextEditingController _worryCtrl = TextEditingController();
  bool _isProductiveWorry = true;
  final TextEditingController _exposureSituationCtrl = TextEditingController();
  int _exposureSuds = 60;
  String? _biometricStatusVi;

  @override
  void initState() {
    super.initState();
    _draftMood = widget.moodPolarity;
    _draftEnergy = widget.energyLevel;
    _draftSleep = widget.sleepDurationHours;
    _draftNeedForSleep = widget.feltNeedForSleep;
    if (widget.accountProfile.disorderFocus == DisorderFocus.bipolar1 ||
        widget.accountProfile.disorderFocus == DisorderFocus.bipolar2 ||
        widget.accountProfile.disorderFocus == DisorderFocus.cyclothymia) {
      _showAdvancedBipolarScales = true;
    }
  }

  @override
  void didUpdateWidget(covariant MainShellScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.moodPolarity != widget.moodPolarity ||
        oldWidget.energyLevel != widget.energyLevel) {
      _draftMood = widget.moodPolarity;
      _draftEnergy = widget.energyLevel;
    }
  }

  @override
  void dispose() {
    _worryCtrl.dispose();
    _exposureSituationCtrl.dispose();
    super.dispose();
  }

  void _openSosPortal({int intensity = 9}) {
    unawaited(
      Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (_) => SosPortalScreen(initialIntensity: intensity),
        ),
      ),
    );
  }

  Future<void> _launchQuestionnaire(String scaleCode) async {
    final result = await Navigator.of(context).push<AssessmentRecord>(
      MaterialPageRoute<AssessmentRecord>(
        builder: (_) => AssessmentRunnerScreen(
          scaleCode: scaleCode,
          feltNeedForSleep: widget.feltNeedForSleep,
        ),
      ),
    );

    if (result == null || !mounted) return;
    widget.onAddAssessment(result);

    if (result.triggersSafetyStop) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Color(0xFFB3261E),
          content: Text(
            'Đã phát hiện tín hiệu cần bảo vệ an toàn. Đang mở Cổng An Toàn Khẩn Cấp (SOS)...',
          ),
        ),
      );
      _openSosPortal(intensity: 10);
    } else if (result.triggersHypomaniaGuard) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Color(0xFFD97706),
          content: Text(
            'Đã bật Lá chắn Hạ nhiệt Hưng cảm & Khoang Chờ 48 Giờ để bảo vệ giấc ngủ.',
          ),
        ),
      );
    }
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
              'HAVEN (EQUILIBRIA) — CLINICAL SUMMARY REPORT (CBT / DBT / IPSRT)',
              style: pw.TextStyle(
                fontSize: 15,
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
              'Felt Need',
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
              'Steps Done',
            ],
            data: widget.sessions
                .take(10)
                .map(
                  (s) => [
                    '${s.date} ${s.time}',
                    s.technique.slug,
                    '${s.preIntensity} -> ${s.postIntensity ?? s.preIntensity}',
                    s.outcome.code,
                    '${s.stepsCompleted}',
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
      name: 'Haven_Clinical_Report_30d.pdf',
    );
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 16,
        title: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.asset(
                'assets/icon/haven_icon.png',
                width: 30,
                height: 30,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Haven',
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17),
                  ),
                  Text(
                    widget.activeThemeMode.titleVi,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 11,
                      color: scheme.onSurface.withValues(alpha: 0.7),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: FilledButton.icon(
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFFC56548),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                visualDensity: VisualDensity.compact,
              ),
              onPressed: () => _openSosPortal(intensity: 9),
              icon: const Icon(Icons.shield_moon_outlined, size: 16),
              label: const Text(
                'Bình tĩnh',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12),
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          _buildAdaptiveThemeStatusStrip(),
          Expanded(child: _buildSelectedTabBody()),
        ],
      ),
      floatingActionButton: FloatingActionButton.small(
        tooltip: 'Mở Cổng Bình tĩnh SOS Tức thì',
        backgroundColor: const Color(0xFFC56548),
        foregroundColor: Colors.white,
        onPressed: () => _openSosPortal(intensity: 9),
        child: const Icon(Icons.sos),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _navIndex,
        onDestinationSelected: (i) => setState(() => _navIndex = i),
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.spa_outlined),
            selectedIcon: Icon(Icons.spa),
            label: 'Trang chủ',
          ),
          NavigationDestination(
            icon: Icon(Icons.psychology_outlined),
            selectedIcon: Icon(Icons.psychology),
            label: 'Thực hành',
          ),
          NavigationDestination(
            icon: Icon(Icons.nights_stay_outlined),
            selectedIcon: Icon(Icons.nights_stay),
            label: 'Khí sắc',
          ),
          NavigationDestination(
            icon: Icon(Icons.forum_outlined),
            selectedIcon: Icon(Icons.forum),
            label: 'Trợ lý AI',
          ),
          NavigationDestination(
            icon: Icon(Icons.assignment_outlined),
            selectedIcon: Icon(Icons.assignment),
            label: 'Tự kiểm tra',
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
      bg = const Color(0xFF281F17);
      fg = const Color(0xFFF59E0B);
    } else if (mode == ClinicalThemeMode.lowEnergyDepression) {
      bg = const Color(0xFFEBE7DC);
      fg = const Color(0xFF2F2F2B);
    } else {
      bg = const Color(0xFFEFF3EE);
      fg = const Color(0xFF2F4A3B);
    }
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
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
        return _buildPracticeHubTab();
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
        return AiCompanionBiometricsScreen(
          currentMoodPolarity: widget.moodPolarity,
          currentEnergyLevel: widget.energyLevel,
          currentSleepHours: widget.sleepDurationHours,
          currentFeltNeedForSleep: widget.feltNeedForSleep,
        );
      default:
        return _buildAssessmentsAndProfileHubTab();
    }
  }

  Widget _buildCheckInAndAdaptiveHomeTab() {
    final scheme = Theme.of(context).colorScheme;
    final isLowEnergy =
        widget.activeThemeMode == ClinicalThemeMode.lowEnergyDepression;
    final isManiaDarkRest =
        widget.activeThemeMode == ClinicalThemeMode.lowStimulusManiaDarkRest;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 84),
      children: [
        // Personalized Warm Greeting + Quick Mood Switcher Pills
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Xin chào ${widget.accountProfile.displayName}, hôm nay tâm trí bạn thế nào?',
                  style: const TextStyle(
                    fontSize: 16.5,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Chọn nhanh trạng thái hiện tại để Haven điều chỉnh ánh sáng và nhịp độ dịu mắt nhất cho bạn:',
                  style: TextStyle(
                    fontSize: 12.5,
                    color: scheme.onSurface.withValues(alpha: 0.72),
                  ),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    ChoiceChip(
                      label: const Text('🌿 Trầm mệt'),
                      selected: isLowEnergy,
                      onSelected: (_) {
                        setState(() {
                          _draftMood = -3;
                          _draftEnergy = -2;
                        });
                        widget.onQuickCheckInSubmit(
                          moodPolarity: -3,
                          energyLevel: -2,
                          sleepHours: _draftSleep,
                          feltNeedForSleep: FeltNeedForSleep.exhausted,
                        );
                      },
                    ),
                    ChoiceChip(
                      label: const Text('⚖️ Cân bằng'),
                      selected: !isLowEnergy && !isManiaDarkRest,
                      onSelected: (_) {
                        setState(() {
                          _draftMood = 0;
                          _draftEnergy = 0;
                        });
                        widget.onQuickCheckInSubmit(
                          moodPolarity: 0,
                          energyLevel: 0,
                          sleepHours: _draftSleep,
                          feltNeedForSleep: FeltNeedForSleep.normal,
                        );
                      },
                    ),
                    ChoiceChip(
                      label: const Text('🌙 Hạ nhiệt'),
                      selected: isManiaDarkRest,
                      onSelected: (_) {
                        setState(() {
                          _draftMood = 3;
                          _draftEnergy = 3;
                        });
                        widget.onQuickCheckInSubmit(
                          moodPolarity: 3,
                          energyLevel: 3,
                          sleepHours: 4.5,
                          feltNeedForSleep: FeltNeedForSleep.reducedNeed,
                        );
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: 12),

        if (isLowEnergy)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Không gian Dịu dàng — Hôm nay một bước nhỏ thôi là đủ',
                    style: TextStyle(fontSize: 15.5, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Khi cơ thể và tâm trí đang mệt (<= -3), Haven ẩn toàn bộ bảng biểu gây áp lực và không bao giờ đếm chuỗi ngày đứt.\n'
                    'Bạn chỉ cần chọn một việc thật nhỏ dưới đây:',
                    style: TextStyle(fontSize: 13, height: 1.45),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      FilledButton.tonal(
                        onPressed: () => setState(() => _navIndex = 1),
                        child: const Text('🎙️ Nói ra nhẹ lòng 30 giây'),
                      ),
                      FilledButton.tonal(
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'Tuyệt vời — một cốc nước ấm & 2 phút mở rèm cửa là đủ cho lúc này.',
                              ),
                            ),
                          );
                        },
                        child: const Text('💧 Uống 1 cốc nước ấm'),
                      ),
                      FilledButton.tonal(
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'Bạn được phép nghỉ ngơi chủ động mà không cần áy náy.',
                              ),
                            ),
                          );
                        },
                        child: const Text('🛋️ Nghỉ ngơi không áy náy'),
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
                    'Không gian Trầm ấm Hạ nhiệt & Khoang Chờ 48 Giờ',
                    style: TextStyle(fontSize: 15.5, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Màu sắc đã chuyển sang hổ phách trầm dịu mắt, tắt toàn bộ hiệu ứng chuyển động để bảo vệ giấc ngủ và hệ thần kinh.',
                    style: TextStyle(fontSize: 13, height: 1.45),
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

        // 4-Axis Daily Check-in
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Check-in Hôm nay (Khí sắc • Năng lượng • Giấc ngủ)',
                  style: TextStyle(fontSize: 15.5, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                Text('1. Tâm trạng / Khí sắc (-5 .. +5): $_draftMood'),
                Slider(
                  value: _draftMood.toDouble(),
                  min: -5,
                  max: 5,
                  divisions: 10,
                  label: '$_draftMood',
                  onChanged: (v) => setState(() => _draftMood = v.round()),
                ),
                Text('2. Mức Năng lượng cơ thể (-5 .. +5): $_draftEnergy'),
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
                    labelText: '4. Cảm giác sau khi thức dậy',
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
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Đã lưu Check-in hôm nay an toàn.'),
                        ),
                      );
                    },
                    icon: const Icon(Icons.check_circle_outline),
                    label: const Text('Lưu Check-in Hôm nay'),
                  ),
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: 12),

        // Quick Shortcuts to Practice & Self-Check
        Card(
          child: Column(
            children: [
              ListTile(
                leading: const Icon(Icons.psychology_outlined),
                title: const Text(
                  'Tâm sự & Thực hành 7 Bài tập Hướng dẫn',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
                subtitle: const Text(
                  'Nhật ký Suy nghĩ, Kích hoạt Hành vi, Tâm Trí Tuệ Wise Mind & Giao tiếp DEAR MAN',
                ),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => setState(() => _navIndex = 1),
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.assignment_outlined),
                title: const Text(
                  'Làm Bài Tự Kiểm Tra Định Kỳ (PHQ-9, GAD-7, Giấc ngủ)',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
                subtitle: const Text(
                  'Trả lời bảng câu hỏi chi tiết và nhận định hướng lâm sàng tức thì',
                ),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => setState(() {
                  _navIndex = 4;
                  _checkSubIndex = 0;
                }),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPracticeHubTab() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 4),
          child: SizedBox(
            width: double.infinity,
            child: SegmentedButton<int>(
              segments: const [
                ButtonSegment(value: 0, label: Text('7 Bài tập')),
                ButtonSegment(value: 1, label: Text('Góc Lo âu')),
                ButtonSegment(value: 2, label: Text('36 Công cụ')),
              ],
              selected: {_practiceSubIndex},
              onSelectionChanged: (s) =>
                  setState(() => _practiceSubIndex = s.first),
            ),
          ),
        ),
        Expanded(
          child: _practiceSubIndex == 0
              ? SessionPlayerScreen(
                  currentMoodPolarity: widget.moodPolarity,
                  currentEnergyLevel: widget.energyLevel,
                  onSessionSaved: widget.onSessionSaved,
                )
              : _practiceSubIndex == 1
                  ? _buildAnxietyHubView()
                  : Tools36AndTeamCbtScreen(
                      currentMoodPolarity: widget.moodPolarity,
                      currentFeltNeedForSleep: widget.feltNeedForSleep,
                    ),
        ),
      ],
    );
  }

  Widget _buildAnxietyHubView() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 84),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Chiếc hộp Gác lại Âu lo (Worry Box • Hẹn 17:30)',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Tạm gửi suy nghĩ lo âu vào hộp để tâm trí được nghỉ ngơi và xử lý đúng khung giờ hẹn 17:30.',
                  style: TextStyle(fontSize: 13),
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
                        ? 'Lo âu thực tế có thể hành động giải quyết'
                        : 'Lo âu giả định "Nhỡ đâu..." ngoài tầm kiểm soát',
                    style: const TextStyle(fontSize: 13.5),
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
                  label: const Text('Cất vào Chiếc hộp Âu lo'),
                ),
                for (final w in widget.worryBoxItems)
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(Icons.inbox_outlined),
                    title: Text(w.worryText),
                    subtitle: Text(
                      w.isProductiveActionableWorry
                          ? 'Gỡ rối thực tế lúc ${w.scheduledReviewTime}'
                          : 'Quan sát trôi qua lúc ${w.scheduledReviewTime}',
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
                  'Thang Bước Nhỏ Đối Diện Nỗi Sợ (Exposure Hierarchy)',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _exposureSituationCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Tình huống bạn muốn tập đối diện từng bước',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 8),
                Text('Mức độ lo lắng dự đoán (0–100): $_exposureSuds/100'),
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
                          'Không kiểm tra mạch liên tục',
                          'Giữ hơi thở chậm 4-6',
                        ],
                      ),
                    );
                    _exposureSituationCtrl.clear();
                  },
                  child: const Text('Thêm vào Thang Tiếp xúc'),
                ),
                for (final step in widget.exposureSteps)
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(step.fearSituation),
                    subtitle: Text(
                      'Mức sợ ban đầu: ${step.baselineSuds}/100 • Ghi chú: ${step.safetyBehaviorsToDrop.join(", ")}',
                    ),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildAssessmentsAndProfileHubTab() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 4),
          child: SizedBox(
            width: double.infinity,
            child: SegmentedButton<int>(
              segments: const [
                ButtonSegment(value: 0, label: Text('Bài kiểm tra')),
                ButtonSegment(value: 1, label: Text('Bác sĩ & PDF')),
                ButtonSegment(value: 2, label: Text('Hồ sơ')),
              ],
              selected: {_checkSubIndex},
              onSelectionChanged: (s) =>
                  setState(() => _checkSubIndex = s.first),
            ),
          ),
        ),
        Expanded(
          child: _checkSubIndex == 0
              ? _buildInteractiveScalesView()
              : _checkSubIndex == 1
                  ? _buildDoctorReportView()
                  : _buildProfileAndSecurityView(),
        ),
      ],
    );
  }

  Widget _buildInteractiveScalesView() {
    final scheme = Theme.of(context).colorScheme;
    final latestByScale = <String, AssessmentRecord>{};
    for (final rec in widget.assessments) {
      latestByScale.putIfAbsent(rec.scaleCode, () => rec);
    }

    final isBipolarUser =
        widget.accountProfile.disorderFocus == DisorderFocus.bipolar1 ||
            widget.accountProfile.disorderFocus == DisorderFocus.bipolar2 ||
            widget.accountProfile.disorderFocus == DisorderFocus.cyclothymia;

    final scaleCodes = <String>[
      'BMS',
      'PHQ-9',
      'GAD-7',
      'ISI',
      if (_showAdvancedBipolarScales || isBipolarUser) ...['ASRM', 'MDQ'],
    ];

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 84),
      children: [
        Row(
          children: [
            const Expanded(
              child: Text(
                'Các Bài Tự Kiểm Tra Sức Khỏe Tâm Trí Định Kỳ',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
              ),
            ),
            TextButton(
              onPressed: () => setState(
                () => _showAdvancedBipolarScales = !_showAdvancedBipolarScales,
              ),
              child: Text(
                _showAdvancedBipolarScales
                    ? 'Ẩn thang đo chuyên sâu'
                    : '+ Hiện thêm ASRM/MDQ',
                style: const TextStyle(fontSize: 12),
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          'Chạm vào bài kiểm tra để trả lời từng câu hỏi thực tế và nhận kết quả thẩm định tức thì.',
          style: TextStyle(
            fontSize: 12.5,
            color: scheme.onSurface.withValues(alpha: 0.72),
          ),
        ),
        const SizedBox(height: 12),
        for (final code in scaleCodes)
          _buildScaleCard(
            definition: kClinicalScalesRegistry[code]!,
            latestResult: latestByScale[code],
            scheme: scheme,
          ),
      ],
    );
  }

  Widget _buildScaleCard({
    required ClinicalScaleDefinition definition,
    required AssessmentRecord? latestResult,
    required ColorScheme scheme,
  }) {
    final isDone = latestResult != null;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: isDone ? scheme.primary : const Color(0xFFE6E4DC),
          width: isDone ? 1.6 : 1.0,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(15),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    definition.titleVi,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 9,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: isDone
                        ? scheme.secondary.withValues(alpha: 0.18)
                        : scheme.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    isDone
                        ? '✓ ${latestResult.totalScore}/${definition.maxScore}đ'
                        : 'Chưa làm',
                    style: TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w700,
                      color: isDone ? scheme.secondary : scheme.primary,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              isDone ? latestResult.interpretationVi : definition.introVi,
              style: TextStyle(
                fontSize: 13,
                height: 1.45,
                color: scheme.onSurface.withValues(alpha: 0.8),
              ),
            ),
            if (isDone && latestResult.triggersSafetyStop) ...[
              const SizedBox(height: 10),
              FilledButton.icon(
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFFB3261E),
                  foregroundColor: Colors.white,
                ),
                onPressed: () => _openSosPortal(intensity: 10),
                icon: const Icon(Icons.sos),
                label: const Text('Mở Cổng An Toàn Khẩn Cấp SOS'),
              ),
            ],
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: isDone
                  ? OutlinedButton(
                      onPressed: () =>
                          _launchQuestionnaire(definition.scaleCode),
                      child: const Text('Làm lại bài kiểm tra ↺'),
                    )
                  : FilledButton(
                      onPressed: () =>
                          _launchQuestionnaire(definition.scaleCode),
                      child: const Text('Bắt đầu kiểm tra (2 phút) →'),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDoctorReportView() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 84),
      children: [
        SizedBox(
          width: double.infinity,
          child: FilledButton.icon(
            onPressed: _generateAndShareClinicianPdfReport,
            icon: const Icon(Icons.picture_as_pdf),
            label: const Text('Xuất Báo cáo Lâm sàng PDF Chuẩn A4 Cho Bác Sĩ'),
          ),
        ),
        const SizedBox(height: 12),
        E2eeClinicianQaScreen(
          moodLogs: widget.moodLogs,
          sessions: widget.sessions,
          assessments: widget.assessments,
          onExportClinicianPdf: _generateAndShareClinicianPdfReport,
        ),
      ],
    );
  }

  Widget _buildProfileAndSecurityView() {
    final p = widget.accountProfile;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 84),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Hồ sơ & Bảo mật Dữ liệu Đầu-Cuối',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 10),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const CircleAvatar(child: Icon(Icons.person)),
                  title: Text(
                    p.displayName,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  subtitle: Text('${p.email}\nTrọng tâm: ${p.disorderFocus.labelVi}'),
                ),
                const Divider(),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.contact_phone_outlined),
                  title: const Text('Liên hệ khẩn cấp đã cài đặt'),
                  subtitle: Text(
                    p.emergencyContactName.isEmpty &&
                            p.emergencyContactPhone.isEmpty
                        ? 'Chưa cài đặt người thân hỗ trợ'
                        : '${p.emergencyContactName} — ${p.emergencyContactPhone}',
                  ),
                ),
                const Divider(),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.fingerprint),
                  title: const Text('Kiểm tra Mở khóa Sinh trắc học (Face ID / Vân tay)'),
                  subtitle: Text(
                    _biometricStatusVi ??
                        'Bảo vệ nhật ký AES-256 trên thiết bị (Cổng SOS luôn mở không cần khóa)',
                  ),
                  trailing: FilledButton.tonal(
                    onPressed: () async {
                      final ok = await widget.onAuthenticateBiometrics();
                      if (!mounted) return;
                      setState(() {
                        _biometricStatusVi = ok
                            ? '✓ Xác thực sinh trắc học thành công'
                            : 'Chưa xác thực được sinh trắc học trên thiết bị này';
                      });
                    },
                    child: const Text('Kiểm tra'),
                  ),
                ),
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: widget.onSignOut,
                    icon: const Icon(Icons.swap_horiz),
                    label: const Text('Đổi Không gian / Đăng xuất khỏi Phiên Hiện tại'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
