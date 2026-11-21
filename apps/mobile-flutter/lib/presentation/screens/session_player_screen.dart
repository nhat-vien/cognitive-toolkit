// lib/presentation/screens/session_player_screen.dart
// Interactive Multi-Modal CBT, TEAM-CBT & DBT Session Player:
// - Phase 0 Mode Toggle: Expressive Venting (Voice Burst Journal + Mood Palette + EAR Empathy)
//   vs. Instrumental CBT/DBT Guided Protocol
// - Live Deterministic Distortion & 4-Layer Safety Detection as the user types/speaks
// - Socratic Pushback Controller Bar (`Softer` / `Harder` / `Skip`)
// - Clinical Safety Gates in-flow:
//     * Thought Record `Accuracy Check`
//     * Behavioral Activation `Rest Check`
//     * Opposite Action `Justified Check`
//     * Wise Mind `Harsh Self-Critic Guard`
//     * Chain Analysis `Hard Stops` & `Shame Protocol`
//     * DEAR MAN + David Burns `EAR` Roleplay Rehearsal
//     * TEAM-CBT `Paradoxical Agenda Setting` (Magic Button, Positive Reframing, Magic Dial)
// - Markdown Frontmatter Exporter (`YYYYMMDD-[technique]-NN.md`).

import 'package:flutter/material.dart';

import '../../domain/engine/distortion_detector.dart';
import '../../domain/engine/session_state_machine.dart';
import '../../domain/models/clinical_models.dart';
import 'sos_portal_screen.dart';

class SessionPlayerScreen extends StatefulWidget {
  final int currentMoodPolarity;
  final int currentEnergyLevel;
  final ValueChanged<CognitiveToolkitSession> onSessionSaved;

  const SessionPlayerScreen({
    super.key,
    required this.currentMoodPolarity,
    required this.currentEnergyLevel,
    required this.onSessionSaved,
  });

  @override
  State<SessionPlayerScreen> createState() => _SessionPlayerScreenState();
}

class _SessionPlayerScreenState extends State<SessionPlayerScreen> {
  final SessionStateMachine _engine = const SessionStateMachine();
  final DistortionDetector _detector = const DistortionDetector();
  final TextEditingController _inputController = TextEditingController();

  late SessionStateSnapshot _snapshot;
  bool _isRecordingVoiceBurst = false;
  String? _activePushbackPromptVi;
  List<Color> _moodPalette = const [
    Color(0xFF356872),
    Color(0xFF5D7A68),
    Color(0xFFD8A657),
  ];

  static const List<String> _affectLabelingFamilies = [
    'Lo âu / Sợ hãi (Anxiety)',
    'Buồn bã / Trầm lắng (Sadness)',
    'Giận dữ / Bức bối (Anger)',
    'Tội lỗi — "Tôi làm sai 1 việc" (Guilt)',
    'Xấu hổ — "Tôi tồi tệ" (Shame)',
  ];

  @override
  void initState() {
    super.initState();
    _snapshot = SessionStateSnapshot(
      sessionId: 'sess-${DateTime.now().millisecondsSinceEpoch}',
      moodPolarity: widget.currentMoodPolarity,
      energyLevel: widget.currentEnergyLevel,
      emotions: const ['Lo âu / Sợ hãi (Anxiety)'],
    );
  }

  @override
  void dispose() {
    _inputController.dispose();
    super.dispose();
  }

  void _updateMoodPaletteFromText(String text) {
    final analysis = _detector.analyzeText(
      text: text,
      preIntensity: _snapshot.preIntensity,
      moodPolarity: _snapshot.moodPolarity,
      energyLevel: _snapshot.energyLevel,
    );
    if (analysis.safetyScreen.requiresImmediateSafetyStop) {
      setState(() {
        _moodPalette = const [Color(0xFF8C1D18), Color(0xFFB3261E), Color(0xFF410E0B)];
      });
    } else if (analysis.positiveDistortions.isNotEmpty || _snapshot.moodPolarity >= 2) {
      setState(() {
        _moodPalette = const [Color(0xFFD8A657), Color(0xFFB85D19), Color(0xFF6B3E14)];
      });
    } else if (analysis.negativeDistortions.isNotEmpty) {
      setState(() {
        _moodPalette = const [Color(0xFF2B4C65), Color(0xFF4B6B82), Color(0xFF778DA9)];
      });
    } else {
      setState(() {
        _moodPalette = const [Color(0xFF2C6E63), Color(0xFF528C7E), Color(0xFF89B0A4)];
      });
    }
  }

  void _handleCheckInContinue() {
    final text = _inputController.text.trim();
    _updateMoodPaletteFromText(text);
    final next = _engine.processCheckInAndRoute(
      current: _snapshot,
      situationText: text,
      preIntensity: _snapshot.preIntensity,
      moodPolarity: _snapshot.moodPolarity,
      energyLevel: _snapshot.energyLevel,
      emotions: _snapshot.emotions,
    );
    setState(() {
      _snapshot = next;
      _activePushbackPromptVi = null;
    });
  }

  void _handleStepSubmit() {
    final steps =
        SessionStateMachine.stepsForTechnique(_snapshot.selectedTechnique);
    if (_snapshot.currentStepIndex >= steps.length) return;
    final currentStep = steps[_snapshot.currentStepIndex];
    final text = _inputController.text.trim();

    // Chain Analysis Step 1 Hard Stops & Shame Protocol
    if (_snapshot.selectedTechnique == TechniqueSlug.chainAnalysis &&
        currentStep.stepId == 'step_1_target_behavior') {
      final evaluated = _engine.evaluateChainAnalysisTarget(
        state: _snapshot,
        targetBehaviorDescription: text,
      );
      _inputController.clear();
      setState(() {
        _snapshot = evaluated;
        _activePushbackPromptVi = null;
      });
      return;
    }

    // Wise Mind Step 3 Harsh Self-Critic Guard
    if (_snapshot.selectedTechnique == TechniqueSlug.wiseMind &&
        currentStep.stepId == 'step_3_reasonable_mind' &&
        _engine.detectsHarshSelfCriticMasqueradingAsReason(text)) {
      setState(() {
        _activePushbackPromptVi =
            '[Harsh Self-Critic Guard] Đó là giọng nói của kẻ tự phán xét chứ không phải Tâm Lý trí. '
            'Nếu bỏ lời tự mắng bản thân ra, dữ kiện thực tế còn lại là gì?';
      });
      return;
    }

    if (text.isEmpty) {
      _handleAttemptSkipCurrentStep();
      return;
    }

    final updatedResponses = Map<String, dynamic>.from(_snapshot.stepResponses)
      ..[currentStep.stepId] = text;

    _inputController.clear();
    final isLastStep = _snapshot.currentStepIndex + 1 >= steps.length;

    setState(() {
      _activePushbackPromptVi = null;
      _snapshot = _snapshot.copyWith(
        stepResponses: updatedResponses,
        currentStepIndex:
            isLastStep ? _snapshot.currentStepIndex : _snapshot.currentStepIndex + 1,
        currentStepPushbackCount: 0,
        phase: isLastStep
            ? SessionPhase.phase4CloseAndSave
            : SessionPhase.phase3GuidedProtocol,
        finalOutcome: isLastStep ? SessionOutcome.completed : _snapshot.finalOutcome,
      );
    });
  }

  void _handleAttemptSkipCurrentStep() {
    final steps =
        SessionStateMachine.stepsForTechnique(_snapshot.selectedTechnique);
    if (_snapshot.currentStepIndex >= steps.length) return;
    final currentStep = steps[_snapshot.currentStepIndex];

    final decision = _engine.evaluateStepSkipOrShallowInput(
      state: _snapshot,
      step: currentStep,
    );

    if (decision.allowImmediateAdvance) {
      final updatedSkipped = List<String>.from(_snapshot.stepsSkipped)
        ..add(currentStep.stepId);
      final isLastStep = _snapshot.currentStepIndex + 1 >= steps.length;
      _inputController.clear();
      setState(() {
        _activePushbackPromptVi = null;
        _snapshot = _snapshot.copyWith(
          stepsSkipped: updatedSkipped,
          currentStepIndex: isLastStep
              ? _snapshot.currentStepIndex
              : _snapshot.currentStepIndex + 1,
          currentStepPushbackCount: 0,
          phase: isLastStep
              ? SessionPhase.phase4CloseAndSave
              : SessionPhase.phase3GuidedProtocol,
          finalOutcome:
              isLastStep ? SessionOutcome.completed : _snapshot.finalOutcome,
        );
      });
    } else {
      setState(() {
        _activePushbackPromptVi = decision.socraticPromptVi;
        _snapshot = _snapshot.copyWith(
          currentStepPushbackCount: decision.nudgeAttemptNumber,
        );
      });
    }
  }

  void _finalizeAndSaveSession() {
    final now = DateTime.now();
    final dateStr =
        '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
    final timeStr =
        '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';
    final post = _snapshot.postIntensity ?? (_snapshot.preIntensity - 2).clamp(0, 10);

    final session = CognitiveToolkitSession(
      id: _snapshot.sessionId,
      technique: _snapshot.selectedTechnique,
      date: dateStr,
      time: timeStr,
      channel: _snapshot.interactionMode ==
              SessionInteractionMode.expressiveVenting
          ? 'voice-burst'
          : 'flutter-mobile',
      pushbackLevel: _snapshot.pushbackLevel,
      preIntensity: _snapshot.preIntensity,
      postIntensity: post,
      intensityDelta: post - _snapshot.preIntensity,
      moodPolarityAtStart: _snapshot.moodPolarity,
      emotions: _snapshot.emotions,
      negativeDistortionsIdentified: _snapshot.negativeDistortionsIdentified,
      positiveDistortionsIdentified: _snapshot.positiveDistortionsIdentified,
      selfDefeatingBeliefsIdentified: _snapshot.selfDefeatingBeliefsIdentified,
      stepsCompleted: _snapshot.stepResponses.length,
      stepsSkipped: _snapshot.stepsSkipped,
      outcome: _snapshot.finalOutcome ?? SessionOutcome.completed,
      structuredStepsPayload: _snapshot.stepResponses,
      takeaway: _snapshot.takeaway ??
          'Tách biệt sự thật khách quan khỏi câu chuyện phán xét của tâm trí.',
    );

    widget.onSessionSaved(session);
    final markdown = _engine.exportSessionToMarkdown(session: session);

    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Đã Lưu & Xuất Markdown (Obsidian/Notion)'),
        content: SingleChildScrollView(
          child: SelectableText(
            markdown,
            style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
          ),
        ),
        actions: [
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Đóng'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildModeAndPushbackHeader(),
        const SizedBox(height: 12),
        if (_snapshot.clinicalBannerMessageVi != null)
          _buildClinicalBanner(_snapshot.clinicalBannerMessageVi!),
        if (_snapshot.interactionMode ==
            SessionInteractionMode.expressiveVenting)
          _buildExpressiveVoiceBurstAndMoodPaletteCard()
        else
          _buildInstrumentalPhaseContent(),
      ],
    );
  }

  Widget _buildModeAndPushbackHeader() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SegmentedButton<SessionInteractionMode>(
              segments: const [
                ButtonSegment(
                  value: SessionInteractionMode.expressiveVenting,
                  icon: Icon(Icons.mic),
                  label: Text('Xả Cảm xúc (Voice Burst & EAR)'),
                ),
                ButtonSegment(
                  value: SessionInteractionMode.instrumentalProtocol,
                  icon: Icon(Icons.psychology),
                  label: Text('Thực hành CBT / DBT'),
                ),
              ],
              selected: {_snapshot.interactionMode},
              onSelectionChanged: (s) => setState(() {
                _snapshot = _snapshot.copyWith(interactionMode: s.first);
              }),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Socratic Pushback: ${_snapshot.pushbackLevel.code.toUpperCase()}',
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                ),
                TextButton.icon(
                  onPressed: () => setState(() {
                    _snapshot = _snapshot.copyWith(
                      pushbackLevel: _snapshot.pushbackLevel.softer(),
                    );
                  }),
                  icon: const Icon(Icons.arrow_downward, size: 16),
                  label: const Text('Nhẹ hơn (Softer)'),
                ),
                TextButton.icon(
                  onPressed: () => setState(() {
                    _snapshot = _snapshot.copyWith(
                      pushbackLevel: _snapshot.pushbackLevel.harder(),
                    );
                  }),
                  icon: const Icon(Icons.arrow_upward, size: 16),
                  label: const Text('Sâu hơn (Harder)'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildClinicalBanner(String message) {
    final isSafetyStop = _snapshot.phase == SessionPhase.safetyStopTerminal;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isSafetyStop ? const Color(0xFF7A1C1C) : const Color(0xFF1F4E46),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        message,
        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500),
      ),
    );
  }

  Widget _buildExpressiveVoiceBurstAndMoodPaletteCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Audio "Burst" Journal & Bảng màu Tâm trạng (Mood-Palette)',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            const Text(
              'Chế độ Expressive (Lắng nghe & Thấu cảm theo 5 Bí quyết Giao tiếp EAR của TS. David Burns): '
              'Không phân tích đúng/sai, không vội đưa lời khuyên.',
            ),
            const SizedBox(height: 14),
            Row(
              children: _moodPalette
                  .map(
                    (c) => Expanded(
                      child: Container(
                        height: 32,
                        margin: const EdgeInsets.symmetric(horizontal: 3),
                        decoration: BoxDecoration(
                          color: c,
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                  )
                  .toList(),
            ),
            const SizedBox(height: 16),
            Center(
              child: FilledButton.icon(
                style: FilledButton.styleFrom(
                  backgroundColor: _isRecordingVoiceBurst
                      ? Colors.redAccent
                      : Theme.of(context).colorScheme.primary,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                ),
                onPressed: () {
                  setState(() {
                    _isRecordingVoiceBurst = !_isRecordingVoiceBurst;
                    if (!_isRecordingVoiceBurst &&
                        _inputController.text.isEmpty) {
                      _inputController.text =
                          'Hôm nay tôi thực sự quá tải và chỉ cần được lắng nghe mà không bị phán xét.';
                      _updateMoodPaletteFromText(_inputController.text);
                    }
                  });
                },
                icon: Icon(_isRecordingVoiceBurst ? Icons.stop : Icons.mic),
                label: Text(
                  _isRecordingVoiceBurst
                      ? 'Đang ghi âm Voice Burst... (Chạm để dừng)'
                      : 'Nhấn để Xả Cảm xúc bằng Giọng nói (Audio Burst)',
                ),
              ),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _inputController,
              maxLines: 3,
              onChanged: _updateMoodPaletteFromText,
              decoration: const InputDecoration(
                labelText: 'Nội dung Voice Burst / Tâm sự tự do',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Text(
                'Phản hồi Thấu cảm TEAM-CBT (EAR — Disarming + Feeling Empathy + Affirmation):\n'
                '"Bạn hoàn toàn có lý khi cảm thấy kiệt sức và nặng nề như vậy trước những gì đang diễn ra. '
                'Tôi đang ở đây lắng nghe bạn trọn vẹn. Khi nào bạn muốn chuyển sang tìm 1 bước tháo gỡ nhỏ, hãy bật chế độ Thực hành CBT/DBT nhé."',
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInstrumentalPhaseContent() {
    switch (_snapshot.phase) {
      case SessionPhase.phase0ModeCheck:
      case SessionPhase.phase1CheckIn:
        return _buildPhase1CheckInCard();
      case SessionPhase.safetyStopTerminal:
        return _buildSafetyStopTerminalCard();
      case SessionPhase.acuteTippPortal:
        return _buildAcuteTippRedirectCard();
      case SessionPhase.phase2TechniqueSelection:
        return _buildPhase2TechniqueSelectionCard();
      case SessionPhase.phase3GuidedProtocol:
        return _buildPhase3GuidedProtocolCard();
      case SessionPhase.phase4CloseAndSave:
        return _buildPhase4CloseAndSaveCard();
    }
  }

  Widget _buildPhase1CheckInCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Pha 1: Check-in Lâm sàng & Bộ Định tuyến Sinh lý (DBT-First, CBT-Second)',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _inputController,
              maxLines: 3,
              onChanged: _updateMoodPaletteFromText,
              decoration: const InputDecoration(
                labelText:
                    'Chuyện gì đang làm bạn bận tâm hoặc suy nghĩ tự động lúc này là gì?',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            const Text('Gọi tên Họ Cảm xúc (Affect Labeling — Phân biệt Shame vs Guilt):'),
            const SizedBox(height: 6),
            Wrap(
              spacing: 8,
              runSpacing: 6,
              children: _affectLabelingFamilies.map((emotion) {
                final selected = _snapshot.emotions.contains(emotion);
                return FilterChip(
                  label: Text(emotion),
                  selected: selected,
                  onSelected: (v) {
                    final list = List<String>.from(_snapshot.emotions);
                    if (v) {
                      list.add(emotion);
                    } else if (list.length > 1) {
                      list.remove(emotion);
                    }
                    setState(() => _snapshot = _snapshot.copyWith(emotions: list));
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 12),
            Text(
              'Cường độ Cảm xúc (SUDS): ${_snapshot.preIntensity}/10 '
              '(${_snapshot.preIntensity >= 8 ? "Vùng Đỏ -> DBT TIPP" : _snapshot.preIntensity >= 6 ? "Vùng Cam -> DBT Regulation" : "Vùng Xanh -> CBT / TEAM-CBT"})',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            Slider(
              value: _snapshot.preIntensity.toDouble(),
              min: 0,
              max: 10,
              divisions: 10,
              label: '${_snapshot.preIntensity}/10',
              onChanged: (v) => setState(
                () => _snapshot = _snapshot.copyWith(preIntensity: v.round()),
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: _handleCheckInContinue,
                icon: const Icon(Icons.alt_route),
                label: const Text('Qua Cổng An Toàn & Định Tuyến Kỹ Thuật'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSafetyStopTerminalCard() {
    return Card(
      color: const Color(0xFF5A1616),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.emergency, color: Colors.amberAccent, size: 32),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'GIAO THỨC DỪNG KHẨN CẤP (OUTCOME: SAFETY-STOP)',
                    style: TextStyle(
                      color: Colors.amberAccent,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            const Text(
              'Mọi bài tập CBT/DBT đã được khóa để bảo vệ bạn. Bạn không phải đối mặt với khoảnh khắc này một mình:\n\n'
              '• Cấp cứu Y tế Toàn quốc: 115\n'
              '• Đường dây nóng Ngày Mai (Hỗ trợ Tâm lý): 096 306 1414\n'
              '• Tổng đài Bảo vệ & Khủng hoảng Quốc gia: 111\n'
              '• Liên hệ ngay Người thân Tin cậy trong Bản Giao ước Ulysses của bạn.',
              style: TextStyle(color: Colors.white, height: 1.5),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _finalizeAndSaveSession,
              child: const Text('Lưu Bản Ghi Safety-Stop (YAML Frontmatter)'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAcuteTippRedirectCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Định tuyến Sinh lý: DBT TIPPTrước — CBT Sau',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Khi cường độ cảm xúc >= 8/10 hoặc đang ở Pha Hỗn hợp Lưỡng cực, vỏ não trước trán đang quá tải. '
              'Hãy mở Cổng SOS Toàn màn hình để hạ nhiệt sinh lý xuống <= 6/10 trước.',
            ),
            const SizedBox(height: 14),
            FilledButton.icon(
              style: FilledButton.styleFrom(backgroundColor: Colors.redAccent),
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) =>
                        SosPortalScreen(initialIntensity: _snapshot.preIntensity),
                  ),
                );
              },
              icon: const Icon(Icons.sos),
              label: const Text('Mở Cổng SOS / DBT TIPP Toàn Màn Hình'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPhase2TechniqueSelectionCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Pha 2: Chọn Phác đồ CBT / TEAM-CBT / DBT',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            Text(
              'Đề xuất tự động theo trạng thái hiện tại: ${_snapshot.selectedTechnique.titleVi}',
              style: TextStyle(
                color: Theme.of(context).colorScheme.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
            if (_snapshot.negativeDistortionsIdentified.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(
                'Biến dạng âm tính nhận diện ngầm (0ms): ${_snapshot.negativeDistortionsIdentified.join(", ")}',
                style: const TextStyle(fontSize: 12),
              ),
            ],
            if (_snapshot.positiveDistortionsIdentified.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(
                'Biến dạng dương tính Hưng cảm nhận diện (0ms): ${_snapshot.positiveDistortionsIdentified.join(", ")}',
                style: const TextStyle(fontSize: 12, color: Colors.deepOrange),
              ),
            ],
            const SizedBox(height: 12),
            DropdownButtonFormField<TechniqueSlug>(
              value: _snapshot.selectedTechnique,
              isExpanded: true,
              decoration: const InputDecoration(
                labelText: 'Đổi kỹ thuật thực hành',
                border: OutlineInputBorder(),
              ),
              items: TechniqueSlug.values
                  .map(
                    (t) => DropdownMenuItem(
                      value: t,
                      child: Text('[${t.modality}] ${t.titleVi}'),
                    ),
                  )
                  .toList(),
              onChanged: (val) {
                if (val != null) {
                  setState(() {
                    _snapshot = _snapshot.copyWith(
                      selectedTechnique: val,
                      currentStepIndex: 0,
                      currentStepPushbackCount: 0,
                    );
                  });
                }
              },
            ),
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () {
                  _inputController.clear();
                  setState(() {
                    _snapshot = _snapshot.copyWith(
                      phase: SessionPhase.phase3GuidedProtocol,
                      currentStepIndex: 0,
                      currentStepPushbackCount: 0,
                    );
                  });
                },
                child: const Text('Bắt đầu Thực hành Từng Bước (Pha 3)'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPhase3GuidedProtocolCard() {
    final steps =
        SessionStateMachine.stepsForTechnique(_snapshot.selectedTechnique);
    final step = steps[_snapshot.currentStepIndex.clamp(0, steps.length - 1)];

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    step.titleVi,
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                Chip(
                  label: Text(
                    'Bước ${_snapshot.currentStepIndex + 1}/${steps.length} • Zone: ${step.zone.name}',
                    style: const TextStyle(fontSize: 12),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(step.promptVi, style: const TextStyle(fontSize: 15)),
            const SizedBox(height: 14),
            if (_activePushbackPromptVi != null)
              Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.amber.withOpacity(0.18),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.amber.shade700),
                ),
                child: Text(
                  _activePushbackPromptVi!,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
            if (step.stepId == 'gate_accuracy_check')
              _buildAccuracyCheckGateButtons()
            else if (step.stepId == 'gate_rest_check')
              _buildRestCheckGateButtons()
            else if (step.stepId == 'gate_justified_check')
              _buildJustifiedCheckGateButtons()
            else ...[
              TextField(
                controller: _inputController,
                maxLines: 3,
                decoration: const InputDecoration(
                  hintText: 'Nhập câu trả lời của bạn tại bước này...',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  OutlinedButton(
                    onPressed: _handleAttemptSkipCurrentStep,
                    child: const Text('Bỏ qua bước này (Skip)'),
                  ),
                  const Spacer(),
                  FilledButton.icon(
                    onPressed: _handleStepSubmit,
                    icon: const Icon(Icons.arrow_forward),
                    label: const Text('Tiếp tục'),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildAccuracyCheckGateButtons() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'Pushback đã TẮT hoàn toàn ở cổng này. Nếu suy nghĩ là sự thật khách quan, ứng dụng sẽ dừng tái cấu trúc để tôn trọng cảm xúc của bạn:',
          style: TextStyle(fontSize: 13),
        ),
        const SizedBox(height: 10),
        FilledButton.tonal(
          onPressed: () => setState(() {
            _snapshot = _engine.evaluateAccuracyCheck(
              state: _snapshot,
              isThoughtObjectivelyAccurate: true,
              chosenBranch: 'problem_solving_and_coping',
            );
          }),
          child: const Text(
            'Đúng, đây là Sự thật Khách quan → Dừng tái cấu trúc & Chuyển sang Giải quyết Vấn đề / Chăm sóc Bản thân (accurate-thought-exit)',
          ),
        ),
        const SizedBox(height: 8),
        FilledButton(
          onPressed: () => setState(() {
            _snapshot = _engine.evaluateAccuracyCheck(
              state: _snapshot,
              isThoughtObjectivelyAccurate: false,
            );
          }),
          child: const Text(
            'Không, có phần phóng đại/biến dạng nhận thức → Sang Bước 6: Viết Suy nghĩ Cân bằng',
          ),
        ),
      ],
    );
  }

  Widget _buildRestCheckGateButtons() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        FilledButton.tonal(
          onPressed: () => setState(() {
            _snapshot = _engine.evaluateRestCheck(
              state: _snapshot,
              needsBiologicalRecoveryRest: true,
            );
          }),
          child: const Text(
            'Cơ thể tôi đang thiếu ngủ / ốm / burnout thực sự → Lên kế hoạch Nghỉ ngơi Chủ động Không Áy náy (justified-exit)',
          ),
        ),
        const SizedBox(height: 8),
        FilledButton(
          onPressed: () => setState(() {
            _snapshot = _engine.evaluateRestCheck(
              state: _snapshot,
              needsBiologicalRecoveryRest: false,
            );
          }),
          child: const Text(
            'Đó là sự rút lui của trầm cảm → Tiếp tục chọn 1 Hoạt động Nhỏ (Tự tin >= 7/10)',
          ),
        ),
      ],
    );
  }

  Widget _buildJustifiedCheckGateButtons() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        FilledButton.tonal(
          onPressed: () => setState(() {
            _snapshot = _engine.evaluateJustifiedCheck(
              state: _snapshot,
              isActionUrgeJustifiedByFactsOrDanger: true,
            );
          }),
          child: const Text(
            'Thôi thúc này hoàn toàn chính đáng / có nguy hiểm thực tế → Bảo vệ an toàn, không làm ngược lại (justified-exit)',
          ),
        ),
        const SizedBox(height: 8),
        FilledButton(
          onPressed: () => setState(() {
            _snapshot = _engine.evaluateJustifiedCheck(
              state: _snapshot,
              isActionUrgeJustifiedByFactsOrDanger: false,
            );
          }),
          child: const Text(
            'Thôi thúc không phù hợp thực tế → Sang Bước 4: Làm Ngược Lại Toàn Diện 100%',
          ),
        ),
      ],
    );
  }

  Widget _buildPhase4CloseAndSaveCard() {
    final post = _snapshot.postIntensity ?? _snapshot.preIntensity;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Pha 4: Đóng Phiên & Đánh giá lại (Outcome: ${(_snapshot.finalOutcome ?? SessionOutcome.completed).code})',
              style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            Text('Chấm lại Cường độ Cảm xúc sau phiên: $post/10'),
            Slider(
              value: post.toDouble(),
              min: 0,
              max: 10,
              divisions: 10,
              label: '$post/10',
              onChanged: (v) => setState(
                () => _snapshot = _snapshot.copyWith(postIntensity: v.round()),
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                OutlinedButton(
                  onPressed: () => setState(() {
                    _snapshot = SessionStateSnapshot(
                      sessionId: 'sess-${DateTime.now().millisecondsSinceEpoch}',
                      moodPolarity: widget.currentMoodPolarity,
                      energyLevel: widget.currentEnergyLevel,
                      emotions: const ['Lo âu / Sợ hãi (Anxiety)'],
                    );
                  }),
                  child: const Text('Phiên Mới'),
                ),
                const Spacer(),
                FilledButton.icon(
                  onPressed: _finalizeAndSaveSession,
                  icon: const Icon(Icons.save),
                  label: const Text('Lưu DB Mã hóa & Xuất Markdown'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
