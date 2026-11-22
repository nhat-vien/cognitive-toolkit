// lib/presentation/screens/ai_companion_biometrics_screen.dart
// Haven AI Companion & Biometrics — Pure, warm Vietnamese patient-facing UI.
// Zero developer English jargon; clean chat focus + collapsible Voice, Sleep/HRV & Memory cards.

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
  final GroundedAiCompanionService _companionService =
      GroundedAiCompanionService();
  final MultimodalVoiceBurstAnalyzer _voiceAnalyzer =
      const MultimodalVoiceBurstAnalyzer();
  final HealthBiometricsEngine _biometricsEngine =
      const HealthBiometricsEngine();

  final TextEditingController _chatInputCtrl = TextEditingController();
  final TextEditingController _ollamaEndpointCtrl = TextEditingController(
    text: 'http://192.168.1.10:11434/api/chat',
  );
  final List<GroundedCompanionResponse> _chatHistory = [];

  final TextEditingController _voiceTranscriptCtrl = TextEditingController();
  bool _isHoldingVoiceRecord = false;
  VoiceBurstAnalysisResult? _latestVoiceResult;

  bool _healthOptIn = false;
  String _selectedPlatformSource = 'Health Connect (Android)';
  String _selectedDeviceId = 'galaxy-watch-7';
  double _simulatedLatestHrvMs = 46;
  late List<HrvReadingSample> _baselineSamples;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _baselineSamples = List<HrvReadingSample>.generate(
      14,
      (i) => HrvReadingSample(
        deviceId: _selectedDeviceId,
        recordedAt: now.subtract(Duration(days: i + 1)),
        rmssdMs: 42.0 + (i % 5) * 4.0,
      ),
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

    final response = _companionService.generateGroundedResponse(
      userMessage: text,
      moodPolarity: widget.currentMoodPolarity,
      energyLevel: widget.currentEnergyLevel,
    );
    _chatInputCtrl.clear();
    setState(() {
      _chatHistory.insert(0, response);
    });
  }

  void _analyzeVoiceNote() {
    final transcript = _voiceTranscriptCtrl.text.trim();
    if (transcript.isEmpty) return;
    setState(() {
      _latestVoiceResult = _voiceAnalyzer.analyzeVoiceBurst(
        transcript: transcript,
        durationSeconds: 15,
        moodPolarity: widget.currentMoodPolarity,
        energyLevel: widget.currentEnergyLevel,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final memSnap = _companionService.memoryStore.snapshot();
    final now = DateTime.now();
    final bioSnap = _biometricsEngine.evaluateBiometrics(
      optInEnabled: _healthOptIn,
      platformSource: _selectedPlatformSource,
      latestHrvSample: _healthOptIn
          ? HrvReadingSample(
              deviceId: _selectedDeviceId,
              recordedAt: now.subtract(const Duration(hours: 2)),
              rmssdMs: _simulatedLatestHrvMs,
            )
          : null,
      historical14To30DayBaseline: _baselineSamples,
      now: now,
      latestSleepDurationHours: widget.currentSleepHours,
      feltNeedForSleep: widget.currentFeltNeedForSleep,
    );

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 90),
      children: [
        _buildCleanChatCard(),
        const SizedBox(height: 14),
        _buildVoiceNoteExpansionCard(),
        const SizedBox(height: 12),
        _buildBiometricsExpansionCard(bioSnap),
        const SizedBox(height: 12),
        _buildMemoryAndSettingsExpansionCard(memSnap),
      ],
    );
  }

  // 1. CLEAN PATIENT-FRIENDLY VIETNAMESE CHAT CARD
  Widget _buildCleanChatCard() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              CircleAvatar(
                backgroundColor: Color(0xFFE5F1EB),
                child: Icon(Icons.spa_outlined, color: Color(0xFF4F7A65)),
              ),
              SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Trợ lý Tâm lý Haven',
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF1F2C33),
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'Lắng nghe dịu dàng & gợi ý bài tập chuẩn tâm lý học',
                      style: TextStyle(fontSize: 12.5, color: Color(0xFF6B7982)),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          const Text(
            'Gợi ý bắt đầu cuộc trò chuyện:',
            style: TextStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.w600,
              color: Color(0xFF5A6972),
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              ActionChip(
                backgroundColor: const Color(0xFFF3F7F5),
                side: BorderSide.none,
                label: const Text('Mình đang thấy hơi lo lắng'),
                onPressed: () => _handleSendChat(
                  'Mình đang thấy hơi lo lắng và suy nghĩ nhiều, bạn hướng dẫn giúp mình bài tập gỡ rối suy nghĩ nhé.',
                ),
              ),
              ActionChip(
                backgroundColor: const Color(0xFFF3F7F5),
                side: BorderSide.none,
                label: const Text('Gợi ý cách thư giãn nhanh'),
                onPressed: () => _handleSendChat(
                  'Mình thấy căng thẳng quá, có cách thở hay thư giãn nào nhanh không?',
                ),
              ),
              ActionChip(
                backgroundColor: const Color(0xFFF3F7F5),
                side: BorderSide.none,
                label: const Text('Làm sao để dễ ngủ hơn tối nay?'),
                onPressed: () => _handleSendChat(
                  'Tối nay mình khó ngủ, cho mình vài gợi ý nhẹ nhàng để dễ đi vào giấc ngủ hơn.',
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _chatInputCtrl,
                  decoration: InputDecoration(
                    hintText: 'Chia sẻ điều bạn đang nghĩ...',
                    hintStyle: const TextStyle(fontSize: 13.5),
                    filled: true,
                    fillColor: const Color(0xFFF5F8F9),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 12,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide.none,
                    ),
                  ),
                  onSubmitted: (_) => _handleSendChat(),
                ),
              ),
              const SizedBox(width: 8),
              FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFF6E9883),
                  shape: const CircleBorder(),
                  padding: const EdgeInsets.all(14),
                ),
                onPressed: _handleSendChat,
                child: const Icon(Icons.send_rounded, size: 18),
              ),
            ],
          ),
          if (_chatHistory.isNotEmpty) ...[
            const SizedBox(height: 16),
            for (final turn in _chatHistory.take(4))
              Container(
                width: double.infinity,
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: turn.isSafetyStop
                      ? const Color(0xFFFDF0EE)
                      : const Color(0xFFF5F8F7),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Text(
                  turn.replyVi,
                  style: const TextStyle(
                    fontSize: 13.5,
                    height: 1.5,
                    color: Color(0xFF233036),
                  ),
                ),
              ),
          ],
        ],
      ),
    );
  }

  // 2. COLLAPSIBLE VOICE NOTE CARD (Pure Vietnamese)
  Widget _buildVoiceNoteExpansionCard() {
    final res = _latestVoiceResult;
    return Card(
      color: Colors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: ExpansionTile(
        leading: const Icon(Icons.mic_none_rounded, color: Color(0xFF4F7A65)),
        title: const Text(
          'Tâm sự nhanh bằng giọng nói',
          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
        ),
        subtitle: const Text(
          'Nói ra cho nhẹ lòng khi bạn ngại gõ chữ',
          style: TextStyle(fontSize: 12, color: Color(0xFF6B7982)),
        ),
        childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        children: [
          TextField(
            controller: _voiceTranscriptCtrl,
            maxLines: 3,
            decoration: InputDecoration(
              hintText: 'Nhập hoặc ghi lại vài dòng bạn muốn tâm sự...',
              filled: true,
              fillColor: const Color(0xFFF5F8F9),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide.none,
              ),
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    setState(() {
                      _isHoldingVoiceRecord = !_isHoldingVoiceRecord;
                      if (!_isHoldingVoiceRecord &&
                          _voiceTranscriptCtrl.text.isEmpty) {
                        _voiceTranscriptCtrl.text =
                            'Hôm nay mình hơi mệt và muốn được lắng nghe một chút.';
                      }
                    });
                    if (!_isHoldingVoiceRecord) _analyzeVoiceNote();
                  },
                  icon: Icon(_isHoldingVoiceRecord ? Icons.stop : Icons.mic),
                  label: Text(
                    _isHoldingVoiceRecord ? 'Dừng ghi âm' : 'Ghi âm tâm sự',
                  ),
                ),
              ),
              const SizedBox(width: 8),
              FilledButton.tonal(
                onPressed: _analyzeVoiceNote,
                child: const Text('Lắng nghe'),
              ),
            ],
          ),
          if (res != null) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF2F7F5),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                res.empatheticEarResponseVi,
                style: const TextStyle(fontSize: 13, height: 1.45),
              ),
            ),
          ],
        ],
      ),
    );
  }

  // 3. COLLAPSIBLE BIOMETRICS CARD (Pure Vietnamese)
  Widget _buildBiometricsExpansionCard(BiometricSleepAndHrvSnapshot bio) {
    final hrv = bio.hrvAnalysis;
    return Card(
      color: Colors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: ExpansionTile(
        leading: const Icon(Icons.favorite_border_rounded,
            color: Color(0xFF4F7A65)),
        title: const Text(
          'Đồng bộ Nhịp tim & Giấc ngủ',
          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
        ),
        subtitle: Text(
          _healthOptIn
              ? 'Đang bật · Ngủ ${widget.currentSleepHours.toStringAsFixed(1)} giờ'
              : 'Tùy chọn kết nối với đồng hồ sức khỏe',
          style: const TextStyle(fontSize: 12, color: Color(0xFF6B7982)),
        ),
        childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        children: [
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text(
              'Cho phép đọc dữ liệu sức khỏe',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
            ),
            subtitle: const Text(
              'Hoàn toàn tùy chọn — dữ liệu chỉ lưu riêng trên máy bạn',
              style: TextStyle(fontSize: 12),
            ),
            value: _healthOptIn,
            onChanged: (v) => setState(() => _healthOptIn = v),
          ),
          if (_healthOptIn) ...[
            Wrap(
              spacing: 8,
              children: [
                ChoiceChip(
                  label: const Text('Apple Health (iPhone)'),
                  selected: _selectedPlatformSource.contains('HealthKit'),
                  onSelected: (_) => setState(() {
                    _selectedPlatformSource = 'Apple HealthKit (iOS)';
                    _selectedDeviceId = 'apple-watch-s9';
                  }),
                ),
                ChoiceChip(
                  label: const Text('Health Connect (Android)'),
                  selected: _selectedPlatformSource.contains('Health Connect'),
                  onSelected: (_) => setState(() {
                    _selectedPlatformSource = 'Health Connect (Android)';
                    _selectedDeviceId = 'galaxy-watch-7';
                  }),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Chỉ số biến thiên nhịp tim:',
                    style: TextStyle(fontSize: 13)),
                Text(
                  '${_simulatedLatestHrvMs.toStringAsFixed(0)} ms',
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF4F7A65),
                  ),
                ),
              ],
            ),
            Slider(
              value: _simulatedLatestHrvMs,
              min: 18,
              max: 75,
              onChanged: (v) => setState(() => _simulatedLatestHrvMs = v),
            ),
            if (hrv.checkInOneLineNoticeVi != null)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF6E0),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  hrv.checkInOneLineNoticeVi!,
                  style: const TextStyle(fontSize: 12.5, height: 1.4),
                ),
              ),
          ],
        ],
      ),
    );
  }

  // 4. COLLAPSIBLE MEMORY & AI SETTINGS (Pure Vietnamese, tucked out of the way)
  Widget _buildMemoryAndSettingsExpansionCard(ClinicalMemorySnapshot snap) {
    final profile = snap.personalProfile;
    return Card(
      color: Colors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: ExpansionTile(
        leading: const Icon(Icons.tune_rounded, color: Color(0xFF4F7A65)),
        title: const Text(
          'Bộ nhớ Cá nhân hóa & Kết nối AI',
          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
        ),
        subtitle: Text(
          'Đã ghi nhớ ${snap.activeWindowMessages.length} tin nhắn gần nhất',
          style: const TextStyle(fontSize: 12, color: Color(0xFF6B7982)),
        ),
        childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        children: [
          DropdownButtonFormField<AiCompanionProviderMode>(
            value: _companionService.providerMode,
            isExpanded: true,
            decoration: const InputDecoration(
              labelText: 'Chế độ hoạt động của Trợ lý AI',
              border: OutlineInputBorder(),
            ),
            items: AiCompanionProviderMode.values
                .map(
                  (m) => DropdownMenuItem(
                    value: m,
                    child: Text(m.labelVi, overflow: TextOverflow.ellipsis),
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
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFF5F8F9),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '• Tên gọi: ${profile.preferredName ?? "Chưa cung cấp"}',
                  style: const TextStyle(fontSize: 13),
                ),
                Text(
                  '• Giá trị quan trọng: ${profile.coreValues.isEmpty ? "Chưa ghi nhận" : profile.coreValues.join(", ")}',
                  style: const TextStyle(fontSize: 13),
                ),
                Text(
                  '• Người thân tin cậy: ${profile.trustedPeople.isEmpty ? "Chưa ghi nhận" : profile.trustedPeople.join(", ")}',
                  style: const TextStyle(fontSize: 13),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Align(
            alignment: Alignment.centerRight,
            child: OutlinedButton.icon(
              onPressed: () {
                setState(() {
                  _companionService.memoryStore.eraseAllDerivedMemory();
                });
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('✓ Đã xóa sạch bộ nhớ ghi nhớ của Trợ lý AI.'),
                  ),
                );
              },
              icon: const Icon(Icons.delete_outline, size: 16),
              label: const Text('Xóa bộ nhớ trò chuyện'),
            ),
          ),
        ],
      ),
    );
  }
}
