// lib/presentation/screens/main_shell_screen.dart
// Haven Calm Sanctuary Mobile Shell — Redesigned for airy, uncluttered serenity:
// - Floating Frosted-Pill 4-Tab Bottom Navigation:
//     0. Cảm xúc  : Soft sky-mist Home with 1 primary check-in card (opens clean MoodCheckInModal),
//                   2 compact quick-action tiles (Thở 2 phút / Thiền Buông Thư),
//                   1 Featured Recommendation card, and soft pastel "Bình tâm ngay" SOS pill.
//     1. Thiền/Thở: Clean categorized audio list opening full-screen minimalist dark player.
//     2. Công cụ  : Clean visual launcher cards for 7 Bài tập CBT/DBT, Trợ lý AI,
//                   Tự kiểm tra 6 thang đo, Khí sắc & IPSRT, Kho 36 công cụ & Báo cáo PDF.
//     3. Lịch sử  : Weekly 7-day mood calendar strip, gentle Haven reminder card,
//                   summary stats, Biometrics lock & OTA Update.

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

import '../../domain/engine/clinical_assessments.dart';
import '../../domain/models/clinical_models.dart';
import '../../domain/models/haven_account_model.dart';
import '../../domain/models/sleep_meditation_script.dart';
import '../../domain/services/ota_update_service.dart';
import '../dialogs/ota_update_dialog.dart';
import '../theme/adaptive_clinical_theme.dart';
import 'ai_companion_biometrics_screen.dart';
import 'assessment_runner_screen.dart';
import 'bipolar_hub_screen.dart';
import 'clinical_master_plan_screen.dart';
import 'e2ee_clinician_qa_screen.dart';
import 'mood_checkin_modal.dart';
import 'session_player_screen.dart';
import 'sleep_meditation_screen.dart';
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
  int _navIndex = 0; // 0: Cảm xúc, 1: Thiền/Thở, 2: Công cụ, 3: Lịch sử & Bạn
  bool _isCheckingOta = false;
  String? _lastEmotionLabel;
  String? _biometricStatusVi;
  final OtaUpdateService _otaService = const OtaUpdateService();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        unawaited(_handleCheckOtaUpdate(manual: false));
      }
    });
  }

  Future<void> _handleCheckOtaUpdate({required bool manual}) async {
    if (_isCheckingOta) return;
    setState(() => _isCheckingOta = true);

    final messenger = ScaffoldMessenger.of(context);
    final result = await _otaService.checkForUpdates();
    if (!mounted) return;

    setState(() => _isCheckingOta = false);

    if (result.hasUpdate) {
      if (!context.mounted) return;
      await OtaUpdateDialog.show(context, result);
    } else if (manual) {
      messenger.showSnackBar(
        SnackBar(
          content: Text(
            result.isError
                ? result.message
                : '✓ Bạn đang ở phiên bản Haven mới nhất (v$kCurrentHavenAppVersion).',
          ),
          backgroundColor: result.isError
              ? Colors.grey.shade800
              : const Color(0xFF2F4A3B),
        ),
      );
    }
  }

  void _openSosPortal({int intensity = 9}) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => SosPortalScreen(initialIntensity: intensity),
      ),
    );
  }

  Future<void> _openMoodCheckInModal() async {
    final selection = await MoodCheckInModal.show(
      context,
      initialSleepHours: widget.sleepDurationHours,
    );
    if (selection == null || !mounted) return;

    setState(() => _lastEmotionLabel = selection.emotionLabel);
    widget.onQuickCheckInSubmit(
      moodPolarity: selection.moodPolarity,
      energyLevel: selection.energyLevel,
      sleepHours: selection.sleepHours,
      feltNeedForSleep: inferFeltNeedForSleep(
        selection.sleepHours,
        selection.moodPolarity,
      ),
    );

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          '✓ Đã ghi nhận cảm xúc "${selection.emotionLabel}" (${selection.intensity}/10).',
        ),
        backgroundColor: const Color(0xFF4F7A65),
      ),
    );
  }

  void _pushToolScreen(String title, Widget body) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => Scaffold(
          backgroundColor: const Color(0xFFF6F8F9),
          appBar: AppBar(
            title: Text(
              title,
              style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
            ),
            backgroundColor: const Color(0xFFF6F8F9),
            elevation: 0,
            scrolledUnderElevation: 0,
          ),
          body: body,
        ),
      ),
    );
  }

  Future<void> _openAssessmentRunner(String scaleCode) async {
    final record = await Navigator.of(context).push<AssessmentRecord>(
      MaterialPageRoute<AssessmentRecord>(
        builder: (_) => AssessmentRunnerScreen(
          scaleCode: scaleCode,
          feltNeedForSleep: widget.feltNeedForSleep,
        ),
      ),
    );
    if (record == null || !mounted) return;
    widget.onAddAssessment(record);
    if (record.triggersSafetyStop) {
      _openSosPortal(intensity: 10);
    }
  }

  Future<void> _exportPrintableA4ClinicianPdf() async {
    final doc = pw.Document();
    doc.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        build: (context) => [
          pw.Header(
            level: 0,
            child: pw.Text(
              'Haven (Equilibria) — Clinician Summary Report',
              style: pw.TextStyle(fontSize: 18, fontWeight: pw.FontWeight.bold),
            ),
          ),
          pw.Paragraph(
            text:
                'Patient: ${widget.accountProfile.displayName} | Focus: ${widget.accountProfile.disorderFocus.labelVi}\n'
                'Generated locally on-device (AES-256 Encrypted).',
          ),
          pw.SizedBox(height: 10),
          pw.Header(level: 1, text: '1. Mood, Energy & Sleep Logs'),
          pw.TableHelper.fromTextArray(
            headers: const ['Date', 'Mood (-5..+5)', 'Energy', 'Sleep (h)'],
            data: widget.moodLogs
                .take(14)
                .map(
                  (l) => [
                    l.loggedAt.toIso8601String().substring(0, 10),
                    '${l.moodPolarity}',
                    '${l.energyLevel}',
                    l.sleepDurationHours.toStringAsFixed(1),
                  ],
                )
                .toList(),
          ),
          pw.SizedBox(height: 12),
          pw.Header(level: 1, text: '2. Clinical Self-Assessments'),
          pw.TableHelper.fromTextArray(
            headers: const ['Scale', 'Score', 'Severity', 'Safety Flag'],
            data: widget.assessments
                .take(10)
                .map(
                  (a) => [
                    a.scaleCode,
                    '${a.totalScore}',
                    a.severityCode,
                    a.triggersSafetyStop ? 'SAFETY STOP' : 'Normal',
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
    final isHome = _navIndex == 0;
    final isManiaDark =
        widget.activeThemeMode == ClinicalThemeMode.lowStimulusManiaDarkRest;

    final bgGradient = isManiaDark
        ? const LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF1A1714), Color(0xFF12100E)],
          )
        : isHome
            ? const LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Color(0xFFD5E6F0),
                  Color(0xFFE7F0F5),
                  Color(0xFFF3F6F8),
                ],
              )
            : const LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Color(0xFFF3F6F8), Color(0xFFF6F8FA)],
              );

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(gradient: bgGradient),
        child: SafeArea(
          bottom: false,
          child: Stack(
            children: [
              // Main Tab Content
              Positioned.fill(child: _buildTabContent()),

              // Soft Pastel "Bình tâm ngay" SOS Pill (Home & Tools)
              if (_navIndex == 0 || _navIndex == 2)
                Positioned(
                  right: 20,
                  bottom: 92,
                  child: Material(
                    color: const Color(0xFFF4BACB),
                    borderRadius: BorderRadius.circular(999),
                    elevation: 3,
                    shadowColor: const Color(0xFFD68AA2).withValues(alpha: 0.35),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(999),
                      onTap: () => _openSosPortal(intensity: 9),
                      child: const Padding(
                        padding:
                            EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                        child: Text(
                          'Bình tâm ngay',
                          style: TextStyle(
                            color: Color(0xFF5D2637),
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),

              // Floating Pill Bottom Navigation Bar (4 Clean Tabs)
              Positioned(
                left: 16,
                right: 16,
                bottom: 16,
                child: SafeArea(
                  top: false,
                  child: _buildFloatingPillNavBar(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFloatingPillNavBar() {
    // V2 4-Tab Navigation Contract (INFORMATION_ARCHITECTURE.md): Hôm nay | Thực hành | Kế hoạch | Tiến trình
    const items = [
      (Icons.wb_sunny_rounded, 'Hôm nay'),
      (Icons.self_improvement_rounded, 'Thực hành'),
      (Icons.explore_rounded, 'Kế hoạch'),
      (Icons.insights_rounded, 'Tiến trình'),
    ];

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 7),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.94),
        borderRadius: BorderRadius.circular(999),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1F3847).withValues(alpha: 0.10),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          for (int i = 0; i < items.length; i++)
            Expanded(
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () => setState(() => _navIndex = i),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  decoration: BoxDecoration(
                    color: _navIndex == i
                        ? const Color(0xFFEDF4F0)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        items[i].$1,
                        size: 22,
                        color: _navIndex == i
                            ? const Color(0xFF5A8A73)
                            : const Color(0xFF7B8A92),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        items[i].$2,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: _navIndex == i
                              ? FontWeight.w700
                              : FontWeight.w500,
                          color: _navIndex == i
                              ? const Color(0xFF4F7A65)
                              : const Color(0xFF7B8A92),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildTabContent() {
    switch (_navIndex) {
      case 0:
        return _buildSereneHomeTab();
      case 1:
        return SleepMeditationScreen(
          onOpenBreathing: () => _openSosPortal(intensity: 6),
        );
      case 2:
        return _buildCleanToolsHubTab();
      default:
        return _buildHistoryAndProfileTab();
    }
  }

  // ===========================================================================
  // TAB 0: SERENE HOME SANCTUARY (Inspired by calm cloud home UI)
  // ===========================================================================
  Widget _buildSereneHomeTab() {
    final featuredTrack = kStudioMeditationTracks[1]; // Vita — Nữ dịu ấm

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 14, 20, 150),
      children: [
        // Subtle top brand row (zero clutter)
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Chào ${widget.accountProfile.displayName}',
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Color(0xFF4E6775),
              ),
            ),
            IconButton(
              tooltip: 'Kiểm tra Cập nhật OTA',
              icon: _isCheckingOta
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(
                      Icons.system_update_outlined,
                      size: 20,
                      color: Color(0xFF4E6775),
                    ),
              onPressed: () => unawaited(_handleCheckOtaUpdate(manual: true)),
            ),
          ],
        ),

        const SizedBox(height: 10),

        // Floating Soft Cloud Emblem
        Center(
          child: Container(
            width: 102,
            height: 70,
            decoration: BoxDecoration(
              color: const Color(0xFFFFFDF8),
              borderRadius: BorderRadius.circular(48),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFFFFEBC1).withValues(alpha: 0.65),
                  blurRadius: 34,
                  spreadRadius: 8,
                ),
              ],
            ),
            child: const Icon(
              Icons.cloud_rounded,
              size: 52,
              color: Color(0xFF8BB8A3),
            ),
          ),
        ),

        const SizedBox(height: 26),

        // Primary Hero Check-In Card
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.96),
            borderRadius: BorderRadius.circular(28),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF3E6173).withValues(alpha: 0.08),
                blurRadius: 24,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Bạn thấy trong người\nthế nào?',
                style: TextStyle(
                  fontSize: 25,
                  fontWeight: FontWeight.w700,
                  height: 1.25,
                  color: Color(0xFF1D282E),
                  letterSpacing: -0.4,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                _lastEmotionLabel != null
                    ? 'Hôm nay bạn đang thấy "$_lastEmotionLabel". Một khoảnh khắc dừng lại, cũng là chăm sóc bản thân.'
                    : 'Một khoảnh khắc dừng lại, cũng là chăm sóc bản thân.',
                style: const TextStyle(
                  fontSize: 14,
                  height: 1.45,
                  color: Color(0xFF667680),
                ),
              ),
              const SizedBox(height: 22),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: FilledButton(
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF6E9883),
                    foregroundColor: Colors.white,
                    shape: const StadiumBorder(),
                    elevation: 0,
                  ),
                  onPressed: _openMoodCheckInModal,
                  child: Text(
                    _lastEmotionLabel != null
                        ? 'Cập nhật cảm xúc hôm nay'
                        : 'Ghi cảm xúc hôm nay',
                    style: const TextStyle(
                      fontSize: 15.5,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 14),

        // 2-Column Quick-Action Tiles (Thở 2 phút | Thiền Buông Thư)
        Row(
          children: [
            Expanded(
              child: _buildQuickActionTile(
                orbColor: const Color(0xFF7CB2DE),
                title: 'Thở 2 phút',
                subtitle: 'Thư giãn nhanh',
                onTap: () => _openSosPortal(intensity: 6),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildQuickActionTile(
                orbColor: const Color(0xFFA78ED4),
                title: 'Thiền 5 phút',
                subtitle: 'Dễ ngủ, bình an',
                onTap: () => setState(() => _navIndex = 1),
              ),
            ),
          ],
        ),

        const SizedBox(height: 14),

        // Featured Meditation Recommendation Card ("HAVEN GỢI Ý CHO BẠN")
        InkWell(
          borderRadius: BorderRadius.circular(24),
          onTap: () {
            Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) =>
                    const MeditationNowPlayingScreen(initialTrackIndex: 1),
              ),
            );
          },
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.96),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF3E6173).withValues(alpha: 0.06),
                  blurRadius: 18,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(18),
                    gradient: const LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Color(0xFFE7C8D4), Color(0xFF6A4573)],
                    ),
                  ),
                  child: const Icon(
                    Icons.spa_outlined,
                    color: Colors.white,
                    size: 30,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Text(
                            'HAVEN GỢI Ý CHO BẠN',
                            style: TextStyle(
                              fontSize: 10.5,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.6,
                              color: Color(0xFF7D8C94),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 7,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFCEAE6),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: const Text(
                              'Mới',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFFC45B47),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Thiền Buông Thư Cùng Haven',
                        style: TextStyle(
                          fontSize: 15.5,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF1F2B31),
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        '${featuredTrack.voiceNameVi} · ${formatMeditationClock(featuredTrack.durationSeconds)}',
                        style: const TextStyle(
                          fontSize: 12.5,
                          color: Color(0xFF6D7B83),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildQuickActionTile({
    required Color orbColor,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return InkWell(
      borderRadius: BorderRadius.circular(22),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.94),
          borderRadius: BorderRadius.circular(22),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF3E6173).withValues(alpha: 0.05),
              blurRadius: 14,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 30,
              height: 30,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: orbColor,
                boxShadow: [
                  BoxShadow(
                    color: orbColor.withValues(alpha: 0.4),
                    blurRadius: 10,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 11),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF1F2B31),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 11.5,
                      color: Color(0xFF718088),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ===========================================================================
  // TAB 2: CLEAN TOOLS HUB (Inspired by uncluttered visual card launcher)
  // ===========================================================================
  Widget _buildCleanToolsHubTab() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 150),
      children: [
        const Text(
          'Công cụ Tâm trí',
          style: TextStyle(
            fontSize: 26,
            fontWeight: FontWeight.w800,
            color: Color(0xFF1D292F),
            letterSpacing: -0.4,
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'Mỗi công cụ mở trong một không gian riêng tư, gọn gàng và không làm bạn choáng ngợp.',
          style: TextStyle(fontSize: 13.5, color: Color(0xFF64737B)),
        ),
        const SizedBox(height: 16),

        // Concise, friendly intro to CBT, DBT, TEAM-CBT, IPSRT
        Card(
          color: Colors.white,
          elevation: 0,
          margin: const EdgeInsets.only(bottom: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: const BorderSide(color: Color(0xFFE3ECE8)),
          ),
          child: const ExpansionTile(
            leading: Icon(Icons.menu_book_outlined, color: Color(0xFF4F7A65)),
            title: Text(
              'Tìm hiểu nhanh 7 phương pháp: CBT, TEAM-CBT, DBT, IPSRT, MBCT, Giáo dục Tâm lý & FFT',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
            ),
            subtitle: Text(
              'Chạm để xem giới thiệu ngắn gọn và tác dụng của từng phương pháp',
              style: TextStyle(fontSize: 12, color: Color(0xFF6B7982)),
            ),
            childrenPadding: EdgeInsets.fromLTRB(16, 0, 16, 14),
            children: [
              Text(
                '• CBT (Nhận thức – Hành vi • 11 phác đồ): Nhận diện suy nghĩ tiêu cực hay tự trách để nhìn sự việc khách quan hơn.\n'
                '  → Tác dụng: Giảm lo âu kéo dài, bớt trầm buồn & kiệt sức, cắt vòng lặp suy nghĩ tiêu cực và lấy lại động lực sống.\n\n'
                '• TEAM-CBT (Gỡ rào cản dịu dàng • 7 phác đồ): Lắng nghe thấu cảm trước khi thay đổi, tháo gỡ tâm lý ngại bắt đầu.\n'
                '  → Tác dụng: Giảm áp lực phải hoàn hảo, vượt qua trì hoãn, bớt tự phán xét.\n\n'
                '• DBT (Điều hòa Cảm xúc • 19 kỹ năng qua 4 nhóm): Chánh niệm, Chịu đựng Căng thẳng, Điều hòa Cảm xúc & Hiệu quả Giao tiếp.\n'
                '  → Tác dụng: Hạ nhiệt nhanh cơn hoảng loạn hoặc nóng giận, tránh hành động bốc đồng và giữ mối quan hệ lành mạnh.\n\n'
                '• IPSRT (Nhịp sinh học • 7 thành phần): Giữ đều 5 mốc thức – ngủ và sinh hoạt theo nền cá nhân.\n'
                '  → Tác dụng: Ổn định khí sắc lưỡng cực và phân biệt mất ngủ với giảm nhu cầu ngủ.\n\n'
                '• MBCT (Chánh niệm Nhận thức • Chuỗi 8 bài): Bước ra khỏi chế độ tự động, nhìn suy nghĩ chỉ là sự kiện tâm trí (có lựa chọn mở mắt tiếp đất).\n'
                '  → Tác dụng: Ngăn cuốn vào dòng suy nghĩ tiêu cực và phòng ngừa tái phát trầm cảm.\n\n'
                '• Giáo dục Tâm lý (10 chuyên đề) & FFT (Đồng hành Gia đình • 6 mô-đun):\n'
                '  → Tác dụng: Cung cấp kiến thức y khoa có nguồn trích dẫn (NICE/WHO) và hỗ trợ gia đình giao tiếp lành mạnh với quyền riêng tư do bạn kiểm soát.',
                style: TextStyle(
                  fontSize: 13,
                  height: 1.5,
                  color: Color(0xFF2B383F),
                ),
              ),
            ],
          ),
        ),

        _buildVisualToolBanner(
          icon: Icons.verified_user_outlined,
          title: '68 Phác đồ Lâm sàng Chuẩn & Kế hoạch An toàn 6 Mục',
          subtitle: 'Đầy đủ 7 liệu pháp (CBT, TEAM-CBT, DBT, IPSRT, MBCT, Giáo dục Tâm lý, FFT), Thuốc, WHO-5 & Ẩn Báo cáo',
          colors: const [Color(0xFF1F5C4B), Color(0xFF12382D)],
          onTap: () => _pushToolScreen(
            '68 Phác đồ Lâm sàng & Kế hoạch An toàn',
            ClinicalMasterPlanScreen(
              currentMoodPolarity: widget.moodPolarity,
              currentEnergyLevel: widget.energyLevel,
              onOpenEmergencySos: _openSosPortal,
            ),
          ),
        ),

        _buildVisualToolBanner(
          icon: Icons.route_outlined,
          title: '7 Lộ trình Gỡ rối Từng bước (CBT & DBT)',
          subtitle: 'Đi sâu từng bước hướng dẫn cụ thể để gỡ rối suy nghĩ & cảm xúc',
          colors: const [Color(0xFF3E6359), Color(0xFF213A34)],
          onTap: () => _pushToolScreen(
            '7 Lộ trình Gỡ rối Từng bước',
            SessionPlayerScreen(
              currentMoodPolarity: widget.moodPolarity,
              currentEnergyLevel: widget.energyLevel,
              onSessionSaved: widget.onSessionSaved,
            ),
          ),
        ),

        _buildVisualToolBanner(
          icon: Icons.forum_outlined,
          title: 'Trợ lý AI & Nhịp tim HRV',
          subtitle: 'Lắng nghe thấu cảm, bộ nhớ 2 tầng & Health Connect',
          colors: const [Color(0xFF475B78), Color(0xFF243144)],
          onTap: () => _pushToolScreen(
            'Trợ lý AI & Dữ liệu Sinh học',
            AiCompanionBiometricsScreen(
              currentMoodPolarity: widget.moodPolarity,
              currentEnergyLevel: widget.energyLevel,
              currentSleepHours: widget.sleepDurationHours,
              currentFeltNeedForSleep: widget.feltNeedForSleep,
            ),
          ),
        ),

        const SizedBox(height: 8),
        const Text(
          'Theo dõi & Đánh giá',
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w800,
            color: Color(0xFF1F2C33),
          ),
        ),
        const SizedBox(height: 12),

        _buildVisualToolBanner(
          icon: Icons.assignment_outlined,
          title: 'Tự kiểm tra Sức khỏe Tâm trí',
          subtitle: '6 thang đo chuẩn y khoa (BMS, PHQ-9, GAD-7, ISI, ASRM, MDQ)',
          colors: const [Color(0xFF6B5B84), Color(0xFF392E4D)],
          onTap: () => _pushToolScreen(
            'Tự kiểm tra Sức khỏe Tâm trí',
            _buildCleanScalesListScreen(),
          ),
        ),

        _buildVisualToolBanner(
          icon: Icons.nights_stay_outlined,
          title: 'Khí sắc, Nhịp sinh học & Khoang 48h',
          subtitle: 'Biểu đồ 2 cực (-5..+5), 5 mốc IPSRT & Bản Giao ước Ulysses',
          colors: const [Color(0xFF36535E), Color(0xFF1A2C34)],
          onTap: () => _pushToolScreen(
            'Khí sắc & Nhịp sinh học',
            BipolarHubScreen(
              moodLogs: widget.moodLogs,
              impulseVaultItems: widget.impulseVaultItems,
              ulyssesContract: widget.ulyssesContract,
              latestAsrmScore: widget.latestAsrmScore,
              onAddMoodLog: (_) {},
              onAddImpulseVaultItem: widget.onAddImpulseVaultItem,
              onUpdateUlyssesContract: widget.onUpdateUlyssesContract,
            ),
          ),
        ),

        _buildVisualToolBanner(
          icon: Icons.auto_awesome_outlined,
          title: 'Thư viện 36 Kỹ thuật Nhanh',
          subtitle: 'Tra cứu nhanh mẹo 3–5 phút khi trì hoãn, mất ngủ, tự trách',
          colors: const [Color(0xFF7B6352), Color(0xFF423228)],
          onTap: () => _pushToolScreen(
            'Thư viện 36 Kỹ thuật Nhanh',
            Tools36AndTeamCbtScreen(
              currentMoodPolarity: widget.moodPolarity,
              currentFeltNeedForSleep: widget.feltNeedForSleep,
            ),
          ),
        ),

        _buildVisualToolBanner(
          icon: Icons.medical_information_outlined,
          title: 'Báo cáo Bác sĩ PDF & Mã hóa E2EE',
          subtitle: 'Xuất tóm tắt chuẩn A4 & liên kết Zero-Knowledge',
          colors: const [Color(0xFF3A5C57), Color(0xFF1C302D)],
          onTap: () => _pushToolScreen(
            'Báo cáo Bác sĩ & Bảo mật E2EE',
            ListView(
              padding: const EdgeInsets.all(16),
              children: [
                FilledButton.icon(
                  onPressed: _exportPrintableA4ClinicianPdf,
                  icon: const Icon(Icons.picture_as_pdf_outlined),
                  label: const Text('Xuất & In Báo Cáo Bác Sĩ PDF (A4)'),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  height: 620,
                  child: E2eeClinicianQaScreen(
                    moodLogs: widget.moodLogs,
                    sessions: widget.sessions,
                    assessments: widget.assessments,
                    onExportClinicianPdf: _exportPrintableA4ClinicianPdf,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildVisualToolBanner({
    required IconData icon,
    required String title,
    required String subtitle,
    required List<Color> colors,
    required VoidCallback onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 20),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            gradient: LinearGradient(
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
              colors: colors,
            ),
            boxShadow: [
              BoxShadow(
                color: colors.last.withValues(alpha: 0.18),
                blurRadius: 14,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Row(
            children: [
              Icon(icon, color: Colors.white, size: 28),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 15.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.82),
                        fontSize: 12.5,
                        height: 1.35,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right_rounded, color: Colors.white70),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCleanScalesListScreen() {
    final latestByScale = <String, AssessmentRecord>{};
    for (final rec in widget.assessments) {
      latestByScale.putIfAbsent(rec.scaleCode, () => rec);
    }
    const codes = ['BMS', 'PHQ-9', 'GAD-7', 'ISI', 'ASRM', 'MDQ'];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        for (final code in codes)
          Builder(
            builder: (_) {
              final def = kClinicalScalesRegistry[code]!;
              final latest = latestByScale[code];
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                color: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(18),
                  side: const BorderSide(color: Color(0xFFE5ECE9)),
                ),
                child: ListTile(
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  title: Text(
                    def.titleVi,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                    ),
                  ),
                  subtitle: Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Text(
                      latest != null
                          ? 'Kết quả gần nhất: ${latest.totalScore}/${def.maxScore}đ — ${latest.interpretationVi}'
                          : def.introVi,
                      style: const TextStyle(fontSize: 12.5, height: 1.4),
                    ),
                  ),
                  trailing: FilledButton.tonal(
                    onPressed: () => unawaited(_openAssessmentRunner(code)),
                    child: Text(latest != null ? 'Làm lại' : 'Bắt đầu'),
                  ),
                ),
              );
            },
          ),
      ],
    );
  }

  // ===========================================================================
  // TAB 3: WEEKLY HISTORY & PROFILE (Inspired by calm weekly calendar UI)
  // ===========================================================================
  Widget _buildHistoryAndProfileTab() {
    final p = widget.accountProfile;
    final now = DateTime.now();
    final monday = now.subtract(Duration(days: now.weekday - 1));
    const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 110),
      children: [
        const Text(
          'Lịch sử',
          style: TextStyle(
            fontSize: 26,
            fontWeight: FontWeight.w800,
            color: Color(0xFF1D292F),
            letterSpacing: -0.4,
          ),
        ),
        const SizedBox(height: 16),

        // Weekly 7-Day Mood Calendar Card
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Column(
            children: [
              Text(
                'Tuần ${monday.day} – ${monday.add(const Duration(days: 6)).day} thg ${now.month}',
                style: const TextStyle(
                  fontSize: 15.5,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF1F2B31),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '${widget.moodLogs.length.clamp(0, 7)} / 7 ngày đã ghi nhận',
                style: const TextStyle(fontSize: 12.5, color: Color(0xFF74838B)),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  for (int i = 0; i < 7; i++)
                    Builder(
                      builder: (_) {
                        final day = monday.add(Duration(days: i));
                        final isToday = day.day == now.day &&
                            day.month == now.month;
                        return Column(
                          children: [
                            Text(
                              dayLabels[i],
                              style: const TextStyle(
                                fontSize: 12,
                                color: Color(0xFF7A8890),
                              ),
                            ),
                            const SizedBox(height: 8),
                            Container(
                              width: 36,
                              height: 36,
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: isToday
                                    ? const Color(0xFFE7F2EC)
                                    : const Color(0xFFF2F4F6),
                                borderRadius: BorderRadius.circular(12),
                                border: isToday
                                    ? Border.all(
                                        color: const Color(0xFF4F7A65),
                                        width: 1.5,
                                      )
                                    : null,
                              ),
                              child: Text(
                                '${day.day}',
                                style: TextStyle(
                                  fontSize: 13.5,
                                  fontWeight: isToday
                                      ? FontWeight.w700
                                      : FontWeight.w500,
                                  color: const Color(0xFF28343A),
                                ),
                              ),
                            ),
                          ],
                        );
                      },
                    ),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(height: 14),

        // Warm Gentle Haven Reminder Card
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: const Color(0xFFFDFBFA),
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: const Color(0xFFECEAE6)),
          ),
          child: const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'HAVEN NHẮN NHỦ',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.7,
                  color: Color(0xFF849198),
                ),
              ),
              SizedBox(height: 8),
              Text(
                'Không phải ngày nào cũng thuận lợi. Điều quan trọng là bạn vẫn có thể bắt đầu lại nhẹ nhàng bất cứ lúc nào.',
                style: TextStyle(
                  fontSize: 15,
                  height: 1.5,
                  color: Color(0xFF253137),
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 14),

        // 2 Summary Stat Cards
        Row(
          children: [
            Expanded(
              child: _buildStatCard(
                label: 'Cảm xúc gần nhất',
                value: _lastEmotionLabel ?? 'Bình ổn',
                caption: 'Ngủ ${widget.sleepDurationHours.toStringAsFixed(1)} giờ',
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                label: 'Phiên thực hành',
                value: '${widget.sessions.length} phiên',
                caption: '${widget.assessments.length} bài tự kiểm tra',
              ),
            ),
          ],
        ),

        const SizedBox(height: 18),

        // Compact Profile, Biometrics & OTA Update Card
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(22),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const CircleAvatar(
                    backgroundColor: Color(0xFFE7F2EC),
                    child: Icon(Icons.person_outline, color: Color(0xFF4F7A65)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          p.displayName,
                          style: const TextStyle(
                            fontSize: 15.5,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        Text(
                          p.disorderFocus.labelVi,
                          style: const TextStyle(
                            fontSize: 12,
                            color: Color(0xFF6B7982),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const Divider(height: 24),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.fingerprint, color: Color(0xFF4F7A65)),
                title: const Text(
                  'Khóa sinh trắc học (Face ID / Vân tay)',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                ),
                subtitle: Text(
                  _biometricStatusVi ?? 'Mã hóa AES-256 riêng tư trên máy',
                  style: const TextStyle(fontSize: 12),
                ),
                trailing: TextButton(
                  onPressed: () async {
                    final ok = await widget.onAuthenticateBiometrics();
                    if (!mounted) return;
                    setState(() {
                      _biometricStatusVi = ok
                          ? '✓ Xác thực thành công'
                          : 'Chưa xác thực trên máy này';
                    });
                  },
                  child: const Text('Kiểm tra'),
                ),
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(
                  Icons.system_update_outlined,
                  color: Color(0xFF4F7A65),
                ),
                title: const Text(
                  'Cập nhật ứng dụng (OTA)',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                ),
                subtitle: const Text(
                  'Phiên bản v$kCurrentHavenAppVersion (Build #$kCurrentHavenBuildNumber)',
                  style: TextStyle(fontSize: 12),
                ),
                trailing: TextButton(
                  onPressed: () =>
                      unawaited(_handleCheckOtaUpdate(manual: true)),
                  child: const Text('Kiểm tra'),
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: widget.onSignOut,
                  child: const Text('Đổi Không gian / Đăng xuất'),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard({
    required String label,
    required String value,
    required String caption,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF6F9F5),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE7EFE6)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 12.5, color: Color(0xFF6B7B75)),
          ),
          const SizedBox(height: 10),
          Text(
            value,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1F2C27),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            caption,
            style: const TextStyle(fontSize: 12, color: Color(0xFF7B8A84)),
          ),
        ],
      ),
    );
  }
}
