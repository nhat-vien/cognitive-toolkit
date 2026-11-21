// lib/presentation/screens/ai_companion_biometrics_screen.dart
// Phase 3 (Milestone 3: Sprint 5 & Sprint 6) Flutter Screen:
// 1. Grounded AI Chat Companion with inline `[KB:chunk_id]` citation pills,
//    `Abstained (< 0.46)` safety badge, and On-Device Offline / Local Ollama LAN / Cloud selector.
// 2. 2-Tier Memory Inspector Card (latest 20 messages window, 15-msg Rolling Summary,
//    Structured Personal Profile facts, and 1-tap "Erase Derived Memory" button).
// 3. Hold-to-Record Voice Burst Studio with live WPM speech-rate meter
//    (highlighting `> 30%` Bipolar Pressured Speech alert), Expressive vs. Instrumental toggle,
//    and 5-color Mood-Palette visual preview.
// 4. HealthKit (iOS) & Health Connect (Android) Baseline-Relative HRV & Sleep Card
//    showing 14–30 day 25th–75th percentile classification (`below-baseline`, `within-baseline`,
//    `above-baseline`), `< 12h` freshness check, and explicit notice that pre/post session
//    HRV deltas are never computed.

import 'package:flutter/material.dart';

import '../../domain/engine/phase3_memory_biometrics_voice.dart';
import '../../domain/models/clinical_models.dart';

class AiCompanionBiometricsScreen extends StatefulWidget {
  final int currentMoodPolarity;
  final int currentEnergyLevel;
  final double currentSleepHours;
  final FeltNeedForSleep currentFeltNeedForSleep;

  const AiCompanionBiometricsScreen({
    super.key,
    required this.currentMoodPolarity,
    required this.currentEnergyLevel,
    required this.currentSleepHours,
    required this.currentFeltNeedForSleep,
  });

  @override
  State<AiCompanionBiometricsScreen> createState() =>
      _AiCompanionBiometricsScreenState();
}

class _AiCompanionBiometricsScreenState
    extends State<AiCompanionBiometricsScreen> {
  late final GroundedAiCompanionService _companionService;
  final MobileBiometricsBridgeService _biometricsBridge =
      const MobileBiometricsBridgeService();

  final TextEditingController _chatInputCtrl = TextEditingController();
  final TextEditingController _ollamaEndpointCtrl = TextEditingController(
    text: 'http://127.0.0.1:11434/api/chat',
  );
  final List<GroundedCompanionResponse> _responses = [];

  // Voice Burst Studio state
  final TextEditingController _voiceTranscriptCtrl = TextEditingController(
    text:
        'Tôi vừa nảy ra ý tưởng thiên tài đêm qua, chỉ ngủ 3 tiếng nhưng tràn trề năng lượng, muốn rút hết tiết kiệm đầu tư ngay bây giờ vì chắc chắn thắng 100% không thể thua được, không cần ngủ luôn!',
  );
  int _voiceDurationSeconds = 12;
  final double _personalBaselineWpm = 125.0;
  ComplaintIntent? _intentOverride;
  bool _isHoldingMic = false;
  late VoiceBurstAnalysisResult _latestVoiceResult;

  // HealthKit / Health Connect Biometrics state
  bool _healthOptIn = true;
  bool _healthDeclinedPermanently = false;
  String _selectedPlatformSource = 'Apple HealthKit (iOS)';
  String _selectedDeviceId = 'apple-watch-s9';
  double _simulatedLatestHrvMs = 29.0; // Below 25th percentile (~44.25 ms)
  double _simulatedSampleAgeHours = 2.0; // Fresh (< 12h)

  @override
  void initState() {
    super.initState();
    _companionService = GroundedAiCompanionService();
    // Seed an initial grounded conversation turn
    final seedResp = _companionService.sendUserMessage(
      userMessage:
          'Tên tôi là Minh, coi trọng gia đình và sức khỏe. Người tin cậy là Chị Lan. Tôi đang lo lắng và muốn làm Nhật ký suy nghĩ Thought Record.',
      currentMoodPolarity: widget.currentMoodPolarity,
    );
    _responses.add(seedResp);

    _latestVoiceResult = analyzeVoiceBurstRecording(
      transcript: _voiceTranscriptCtrl.text,
      durationSeconds: _voiceDurationSeconds,
      baselineWpm: _personalBaselineWpm,
      currentMoodPolarity: widget.currentMoodPolarity,
      userIntentOverride: _intentOverride,
    );
  }

  @override
  void dispose() {
    _chatInputCtrl.dispose();
    _ollamaEndpointCtrl.dispose();
    _voiceTranscriptCtrl.dispose();
    super.dispose();
  }

  void _handleSendChat([String? presetText]) {
    final text = (presetText ?? _chatInputCtrl.text).trim();
    if (text.isEmpty) return;
    setState(() {
      final resp = _companionService.sendUserMessage(
        userMessage: text,
        currentMoodPolarity: widget.currentMoodPolarity,
      );
      _responses.insert(0, resp);
      if (presetText == null) {
        _chatInputCtrl.clear();
      }
    });
  }

  void _recomputeVoiceBurst() {
    setState(() {
      _latestVoiceResult = analyzeVoiceBurstRecording(
        transcript: _voiceTranscriptCtrl.text,
        durationSeconds: _voiceDurationSeconds,
        baselineWpm: _personalBaselineWpm,
        currentMoodPolarity: widget.currentMoodPolarity,
        userIntentOverride: _intentOverride,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final memSnap = _companionService.memoryStore.snapshot;
    final bioSnap = _biometricsBridge.buildBaselineSnapshot(
      platformSourceLabel: _selectedPlatformSource,
      sourceDeviceId: _selectedDeviceId,
      latestHrvMs: _simulatedLatestHrvMs,
      latestSampleAgeHours: _simulatedSampleAgeHours,
      lastNightSleepHours: widget.currentSleepHours,
      feltNeedForSleep: widget.currentFeltNeedForSleep,
    );

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildGroundedAiCompanionCard(),
        const SizedBox(height: 14),
        _buildTwoTierMemoryInspectorCard(memSnap),
        const SizedBox(height: 14),
        _buildVoiceBurstStudioCard(),
        const SizedBox(height: 14),
        _buildHealthKitConnectBiometricsCard(bioSnap),
        const SizedBox(height: 72),
      ],
    );
  }

  // --------------------------------------------------------------------------
  // 1. GROUNDED AI CHAT COMPANION (0.46 ABSTENTION & LOCAL OLLAMA / OFFLINE)
  // --------------------------------------------------------------------------
  Widget _buildGroundedAiCompanionCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.verified_user_outlined, size: 20),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Grounded AI Companion (Ngưỡng RAG = 0.46 • 100% Abstention • Local Ollama Bridge)',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
                Chip(
                  label: Text(
                    'Threshold >= $kClinicalRagAbstentionThreshold',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<AiCompanionProviderMode>(
              value: _companionService.providerMode,
              isExpanded: true,
              decoration: const InputDecoration(
                labelText: 'Chế độ AI Engine (Offline / LAN Local Ollama / Cloud)',
                border: OutlineInputBorder(),
              ),
              items: AiCompanionProviderMode.values
                  .map(
                    (m) => DropdownMenuItem(
                      value: m,
                      child: Text(
                        m.labelVi,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  )
                  .toList(),
              onChanged: (mode) {
                if (mode != null) {
                  setState(() {
                    _companionService.setProviderMode(
                      mode,
                      customOllamaEndpoint: _ollamaEndpointCtrl.text,
                    );
                  });
                }
              },
            ),
            if (_companionService.providerMode ==
                AiCompanionProviderMode.localOllamaLan) ...[
              const SizedBox(height: 8),
              TextField(
                controller: _ollamaEndpointCtrl,
                decoration: const InputDecoration(
                  labelText:
                      'Địa chỉ LAN Local Ollama (VD: http://192.168.1.10:11434/api/chat)',
                  border: OutlineInputBorder(),
                ),
                onChanged: (val) {
                  _companionService.setProviderMode(
                    AiCompanionProviderMode.localOllamaLan,
                    customOllamaEndpoint: val,
                  );
                },
              ),
            ],
            const SizedBox(height: 10),
            const Text(
              'Thử nhanh kịch bản kiểm chứng RAG (Trích dẫn [KB:chunk_id] vs. Từ chối < 0.46):',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 6),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                ActionChip(
                  label: const Text('CBT Thought Record & Accuracy Check (>= 0.46)'),
                  onPressed: () => _handleSendChat(
                    'Hướng dẫn tôi kiểm tra Accuracy Check và bằng chứng trong Nhật ký suy nghĩ Thought Record.',
                  ),
                ),
                ActionChip(
                  label: const Text('Hưng cảm & Khoang Chờ 48 Giờ (>= 0.46)'),
                  onPressed: () => _handleSendChat(
                    'Tôi không cần ngủ và muốn đầu tư lớn trong pha hưng cảm lưỡng cực, mở 48 giờ Impulse Vault thế nào?',
                  ),
                ),
                ActionChip(
                  label: const Text('Ngoài phạm vi: Dự báo Bitcoin / Kê đơn (< 0.46 Abstain)'),
                  onPressed: () => _handleSendChat(
                    'Dự báo giá Bitcoin và chứng khoán hôm nay hoặc chỉ tôi tự tăng liều thuốc?',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _chatInputCtrl,
                    decoration: const InputDecoration(
                      labelText:
                          'Nhập chia sẻ hoặc câu hỏi về CBT / TEAM-CBT / DBT / IPSRT...',
                      border: OutlineInputBorder(),
                    ),
                    onSubmitted: (_) => _handleSendChat(),
                  ),
                ),
                const SizedBox(width: 8),
                FilledButton.icon(
                  onPressed: _handleSendChat,
                  icon: const Icon(Icons.send),
                  label: const Text('Gửi'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            for (final resp in _responses.take(4))
              Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: resp.safetyStopTriggered
                        ? const Color(0xFFB3261E)
                        : resp.abstained
                            ? const Color(0xFFB8864B)
                            : const Color(0xFF276359),
                    width: 1.4,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Bạn: "${resp.query}"',
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: [
                        Chip(
                          visualDensity: VisualDensity.compact,
                          backgroundColor: resp.abstained
                              ? const Color(0xFFFFF3CD)
                              : const Color(0xFFE4EFEA),
                          label: Text(
                            resp.safetyStopTriggered
                                ? 'SAFETY STOP (4-Layer Gate)'
                                : resp.abstained
                                    ? 'Abstained (${resp.topSimilarityScore.toStringAsFixed(2)} < 0.46)'
                                    : 'Grounded RAG (${resp.topSimilarityScore.toStringAsFixed(2)} >= 0.46)',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        for (final c in resp.citations)
                          Chip(
                            visualDensity: VisualDensity.compact,
                            avatar: const Icon(Icons.menu_book, size: 14),
                            label: Text(
                              '${c.inlineTag} (${c.similarityScore.toStringAsFixed(2)})',
                              style: const TextStyle(fontSize: 11),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(resp.replyTextVi),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  // --------------------------------------------------------------------------
  // 2. 2-TIER CLINICAL MEMORY INSPECTOR (20-MSG WINDOW + 15-MSG SUMMARY + PROFILE)
  // --------------------------------------------------------------------------
  Widget _buildTwoTierMemoryInspectorCard(ClinicalMemorySnapshot snap) {
    final profile = snap.personalProfile;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.memory, size: 20),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    'Trình Kiểm tra Bộ nhớ 2 Tầng (2-Tier Clinical Memory Inspector)',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
                OutlinedButton.icon(
                  onPressed: () {
                    setState(() {
                      _companionService.memoryStore.eraseAllDerivedMemory();
                    });
                  },
                  icon: const Icon(Icons.delete_forever, size: 18),
                  label: const Text('Xóa Bộ nhớ Suy diễn (Erase)'),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                Chip(
                  label: Text(
                    'Cửa sổ Ngữ cảnh: ${snap.activeWindowMessages.length}/${ClinicalMemoryStore.maxActiveWindowSize} tin nhắn',
                  ),
                ),
                Chip(
                  label: Text(
                    'Tổng tin nhắn đã xử lý: ${snap.totalMessagesProcessed}',
                  ),
                ),
                Chip(
                  label: Text(
                    'Chu kỳ Rolling Summary: mỗi ${ClinicalMemoryStore.rollingSummaryInterval} tin nhắn (Đã gom #${snap.rollingSummaryRefreshCount} lần)',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.04),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Tầng 1 — Structured Personal Profile (Trích xuất tức thì 0ms):',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  const SizedBox(height: 4),
                  Text('• Tên gọi ưu tiên: ${profile.preferredName ?? "Chưa cung cấp"}'),
                  Text(
                    '• Giá trị cốt lõi (Values): ${profile.coreValues.isEmpty ? "Chưa trích xuất" : profile.coreValues.join(", ")}',
                  ),
                  Text(
                    '• Người thân / Liên hệ tin cậy: ${profile.trustedPeople.isEmpty ? "Chưa trích xuất" : profile.trustedPeople.join(", ")}',
                  ),
                  Text(
                    '• Biến dạng nhận thức lặp lại: ${profile.recurrentDistortions.isEmpty ? "Chưa ghi nhận" : profile.recurrentDistortions.join(", ")}',
                  ),
                  Text(
                    '• Mức Socratic Pushback ưu tiên: ${profile.preferredPushbackLevel.labelVi}',
                  ),
                  const Divider(height: 16),
                  const Text(
                    'Tầng 2 — 15-Message Rolling Summary:',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  const SizedBox(height: 4),
                  Text(snap.rollingSummaryVi),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // --------------------------------------------------------------------------
  // 3. HOLD-TO-RECORD VOICE BURST STUDIO & PRESSURED-SPEECH MANIA DETECTOR
  // --------------------------------------------------------------------------
  Widget _buildVoiceBurstStudioCard() {
    final res = _latestVoiceResult;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.mic_none_outlined, size: 22),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Hold-to-Record Voice "Burst" Studio • Cảnh báo Nói nhanh Hưng cảm (> +30% WPM) & Mood-Palette',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            const Text(
              'Bấm giữ để xả cảm xúc bằng giọng nói khi quá mệt để gõ phím. Hệ thống đo tốc độ từ/phút (WPM) '
              'so với ngưỡng cá nhân để phát hiện sớm Pressured Speech (> +30% WPM) trong Rối loạn Lưỡng cực.',
              style: TextStyle(fontSize: 12),
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                ActionChip(
                  label: const Text('Mẫu 1: Nói nhanh Hưng cảm (> +30% WPM Spike)'),
                  onPressed: () {
                    _voiceTranscriptCtrl.text =
                        'Tôi vừa nảy ra ý tưởng thiên tài đêm qua, chỉ ngủ 3 tiếng nhưng tràn trề năng lượng, muốn rút hết tiết kiệm đầu tư ngay bây giờ vì chắc chắn thắng 100% không thể thua được, không cần ngủ luôn!';
                    _voiceDurationSeconds = 12;
                    _intentOverride = null;
                    _recomputeVoiceBurst();
                  },
                ),
                ActionChip(
                  label: const Text('Mẫu 2: Xả cảm xúc Kiệt sức (Expressive EAR)'),
                  onPressed: () {
                    _voiceTranscriptCtrl.text =
                        'Hôm nay tôi mệt rã rời và buồn lắm, chỉ muốn có người lắng nghe chứ chưa muốn phân tích đúng sai.';
                    _voiceDurationSeconds = 15;
                    _intentOverride = ComplaintIntent.expressive;
                    _recomputeVoiceBurst();
                  },
                ),
                ActionChip(
                  label: const Text('Mẫu 3: Cần bài tập CBT (Instrumental)'),
                  onPressed: () {
                    _voiceTranscriptCtrl.text =
                        'Làm sao để tôi bớt lo âu trước buổi thuyết trình ngày mai? Hướng dẫn tôi bài tập CBT cụ thể.';
                    _voiceDurationSeconds = 12;
                    _intentOverride = ComplaintIntent.instrumental;
                    _recomputeVoiceBurst();
                  },
                ),
              ],
            ),
            const SizedBox(height: 10),
            GestureDetector(
              onLongPressStart: (_) => setState(() => _isHoldingMic = true),
              onLongPressEnd: (_) {
                setState(() => _isHoldingMic = false);
                _recomputeVoiceBurst();
              },
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                decoration: BoxDecoration(
                  color: _isHoldingMic
                      ? const Color(0xFFB3261E)
                      : const Color(0xFF276359),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      _isHoldingMic ? Icons.graphic_eq : Icons.mic,
                      color: Colors.white,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _isHoldingMic
                          ? 'Đang thu âm Voice Burst... (Thả tay để phân tích WPM & Mood-Palette)'
                          : 'Bấm Giữ Để Thu Âm Voice Burst (Hoặc Chạm Để Phân Tích Bản Ghi)',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _voiceTranscriptCtrl,
              maxLines: 2,
              decoration: const InputDecoration(
                labelText: 'Văn bản chuyển từ giọng nói (Speech-to-Text Transcript)',
                border: OutlineInputBorder(),
              ),
              onChanged: (_) => _recomputeVoiceBurst(),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Thời lượng đoạn thu: $_voiceDurationSeconds giây'),
                      Slider(
                        value: _voiceDurationSeconds.toDouble(),
                        min: 5,
                        max: 60,
                        divisions: 55,
                        label: '${_voiceDurationSeconds}s',
                        onChanged: (v) {
                          _voiceDurationSeconds = v.round();
                          _recomputeVoiceBurst();
                        },
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: DropdownButtonFormField<ComplaintIntent?>(
                    value: _intentOverride,
                    isExpanded: true,
                    decoration: const InputDecoration(
                      labelText: 'Phân loại Ý định (Expressive vs Instrumental)',
                      border: OutlineInputBorder(),
                    ),
                    items: const [
                      DropdownMenuItem(
                        value: null,
                        child: Text('Tự động nhận diện (Auto)'),
                      ),
                      DropdownMenuItem(
                        value: ComplaintIntent.expressive,
                        child: Text('Expressive (Chỉ lắng nghe EAR)'),
                      ),
                      DropdownMenuItem(
                        value: ComplaintIntent.instrumental,
                        child: Text('Instrumental (Dẫn dắt kỹ thuật CBT/DBT)'),
                      ),
                    ],
                    onChanged: (val) {
                      _intentOverride = val;
                      _recomputeVoiceBurst();
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            if (res.pressuredSpeechAlertTriggered)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFF332615),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFD8A657), width: 1.5),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'CẢNH BÁO NÓI NHANH HƯNG CẢM (BIPOLAR PRESSURED SPEECH ALERT: ${res.wordsPerMinute} WPM • +${res.wpmSpikePercentage}% > +30%)',
                      style: const TextStyle(
                        color: Color(0xFFD8A657),
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      res.clinicalGuidanceVi,
                      style: const TextStyle(color: Color(0xFFE7DFD3), fontSize: 13),
                    ),
                  ],
                ),
              ),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                Chip(
                  label: Text(
                    'Tốc độ nói: ${res.wordsPerMinute} WPM (Baseline: ${res.baselineWpm.toStringAsFixed(0)} WPM • Chênh lệch: ${res.wpmSpikePercentage >= 0 ? "+" : ""}${res.wpmSpikePercentage}%)',
                  ),
                ),
                Chip(
                  label: Text('Ý định: ${res.classifiedIntent.labelVi}'),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'Bảng màu Cảm xúc 5 Sắc độ (Mood-Palette: ${res.moodPalette.gradientLabelVi}):',
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
            ),
            const SizedBox(height: 6),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: SizedBox(
                height: 34,
                child: Row(
                  children: [
                    for (final hex in res.moodPalette.hexColors)
                      Expanded(
                        child: Container(
                          color: Color(hex),
                          alignment: Alignment.center,
                          child: Text(
                            '#${hex.toRadixString(16).toUpperCase().substring(2)}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(res.empatheticEarResponseVi),
          ],
        ),
      ),
    );
  }

  // --------------------------------------------------------------------------
  // 4. HEALTHKIT (iOS) & HEALTH CONNECT (ANDROID) BASELINE-RELATIVE HRV & SLEEP
  // --------------------------------------------------------------------------
  Widget _buildHealthKitConnectBiometricsCard(
    BiometricSleepAndHrvSnapshot bio,
  ) {
    final hrv = bio.hrvAnalysis;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.monitor_heart_outlined, size: 22),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    'HealthKit (iOS) & Health Connect (Android) • Baseline-Relative HRV (14–30 Ngày) & Giấc ngủ',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
                Switch(
                  value: _healthOptIn && !_healthDeclinedPermanently,
                  onChanged: _healthDeclinedPermanently
                      ? null
                      : (v) => setState(() => _healthOptIn = v),
                ),
              ],
            ),
            if (_healthDeclinedPermanently || !_healthOptIn)
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Quyền đọc dữ liệu Sinh trắc học là hoàn toàn tùy chọn (Opt-in). '
                    'Ứng dụng vẫn hoạt động 100% đầy đủ mọi tính năng CBT/DBT/IPSRT khi tắt kết nối và không bao giờ nhắc lại làm phiền.',
                  ),
                  const SizedBox(height: 8),
                  if (_healthDeclinedPermanently)
                    OutlinedButton(
                      onPressed: () => setState(() {
                        _healthDeclinedPermanently = false;
                        _healthOptIn = true;
                      }),
                      child: const Text('Bật lại kết nối HealthKit / Health Connect'),
                    ),
                ],
              )
            else ...[
              const SizedBox(height: 6),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  ChoiceChip(
                    label: const Text('Apple HealthKit (iOS • Apple Watch)'),
                    selected: _selectedPlatformSource.contains('HealthKit'),
                    onSelected: (_) => setState(() {
                      _selectedPlatformSource = 'Apple HealthKit (iOS)';
                      _selectedDeviceId = 'apple-watch-s9';
                    }),
                  ),
                  ChoiceChip(
                    label: const Text('Health Connect (Android • Galaxy/Pixel Watch)'),
                    selected: _selectedPlatformSource.contains('Health Connect'),
                    onSelected: (_) => setState(() {
                      _selectedPlatformSource = 'Health Connect (Android)';
                      _selectedDeviceId = 'galaxy-watch-7';
                    }),
                  ),
                  TextButton(
                    onPressed: () => setState(() {
                      _healthOptIn = false;
                      _healthDeclinedPermanently = true;
                    }),
                    child: const Text('Từ chối vĩnh viễn (Không hỏi lại)'),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                'Giả lập Mẫu HRV mới nhất: ${_simulatedLatestHrvMs.toStringAsFixed(0)} ms '
                '(Đường nền 14–30 ngày trên $_selectedDeviceId: P25 = ${hrv.percentile25Ms?.toStringAsFixed(1) ?? "--"} ms • '
                'P75 = ${hrv.percentile75Ms?.toStringAsFixed(1) ?? "--"} ms)',
              ),
              Slider(
                value: _simulatedLatestHrvMs,
                min: 18,
                max: 75,
                divisions: 57,
                label: '${_simulatedLatestHrvMs.toStringAsFixed(0)} ms',
                onChanged: (v) => setState(() => _simulatedLatestHrvMs = v),
              ),
              Text(
                'Độ trễ mẫu đo (Freshness Check < 12 giờ): ${_simulatedSampleAgeHours.toStringAsFixed(1)} giờ trước',
              ),
              Slider(
                value: _simulatedSampleAgeHours,
                min: 0.5,
                max: 24.0,
                divisions: 47,
                label: '${_simulatedSampleAgeHours.toStringAsFixed(1)}h',
                onChanged: (v) => setState(() => _simulatedSampleAgeHours = v),
              ),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  Chip(
                    backgroundColor: hrv.context == HrvContext.belowBaseline
                        ? const Color(0xFFFFF3CD)
                        : const Color(0xFFE4EFEA),
                    label: Text(
                      'Phân loại HRV: ${hrv.context?.code ?? "stale-or-insufficient (> 12h)"}',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                  Chip(
                    label: Text(
                      hrv.isFreshWithin12Hours
                          ? 'Mẫu mới hợp lệ (< 12h)'
                          : 'Mẫu cũ (> 12h • Đã bỏ qua cảnh báo)',
                    ),
                  ),
                  Chip(
                    label: Text(
                      'Pre/Post Session HRV Delta: ${bio.withinSessionPrePostDeltaComputed ? "ENABLED" : "NEVER COMPUTED (Chuẩn Lâm sàng)"}',
                    ),
                  ),
                ],
              ),
              if (hrv.checkInOneLineNoticeVi != null) ...[
                const SizedBox(height: 8),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF3CD),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    hrv.checkInOneLineNoticeVi!,
                    style: const TextStyle(
                      color: Color(0xFF664D03),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 8),
              Text(
                bio.privacyAndClinicalNoticeVi,
                style: const TextStyle(fontSize: 12),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
