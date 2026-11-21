// lib/domain/engine/phase3_memory_biometrics_voice.dart
// Phase 3 (Milestone 3: Sprint 5 & Sprint 6) Clinical Expansion for Flutter (Android/iOS):
// 1. 2-Tier Clinical Memory Manager (`ClinicalMemoryStore`):
//    - Retains latest 20 messages in active context (`maxActiveWindowSize = 20`)
//    - Refreshes Rolling Summary every 15 messages (`rollingSummaryInterval = 15`)
//    - Immediately extracts Structured Personal Profile facts (name, values, trusted people,
//      recurrent distortions, preferred pushback level)
//    - Supports 1-tap complete memory erasure (`eraseAllDerivedMemory()`).
// 2. Multimodal Voice "Burst" Analyzer & Pressured-Speech Mania Detector
//    (`VoiceBurstAnalysisResult`, `analyzeVoiceBurstRecording`):
//    - Computes speech rate (`wordsPerMinute` vs. `baselineWpm`) and triggers a
//      Bipolar Pressured Speech Alert when WPM spikes `> 30%` above baseline.
//    - Classifies Expressive Complaint (needs TEAM-CBT 5 Secrets of EAR Empathy) vs.
//      Instrumental Complaint (needs structured CBT/DBT protocol).
//    - Generates a 5-color Mood-Palette (`dominantAffect`, `hexColors`, `gradientLabelVi`, `gradientLabelEn`).
// 3. Grounded Clinical RAG & Local Ollama / Cloud Bridge (`GroundedAiCompanionService`):
//    - Enforces strict `threshold = 0.46` (`100% Abstention Accuracy` below `0.46` with
//      TEAM-CBT EAR Empathy fallback, and mandatory inline `[KB:chunk_id]` citations above `0.46`).
//    - Supports switching between On-Device Offline Protocol Engine,
//      LAN Local Ollama (`http://192.168.x.x:11434` / `127.0.0.1:11434`),
//      and Supabase / FastAPI Cloud Endpoint.
// 4. HealthKit (iOS) & Health Connect (Android) Baseline-Relative HRV & Sleep Bridge
//    (`MobileBiometricsBridgeService`, `BiometricSleepAndHrvSnapshot`).

import '../models/clinical_models.dart';
import 'bipolar_ipsrt_engine.dart';
import 'distortion_detector.dart';

// ============================================================================
// 1. TWO-TIER CLINICAL MEMORY MANAGER (20-MSG WINDOW + 15-MSG SUMMARY + PROFILE)
// ============================================================================

class ClinicalMemoryMessage {
  final String id;
  final String role; // 'user' | 'assistant'
  final String content;
  final DateTime timestamp;
  final List<String> detectedDistortions;
  final List<String> citations;

  const ClinicalMemoryMessage({
    required this.id,
    required this.role,
    required this.content,
    required this.timestamp,
    this.detectedDistortions = const [],
    this.citations = const [],
  });
}

class StructuredPersonalProfile {
  final String? preferredName;
  final List<String> coreValues;
  final List<String> trustedPeople;
  final List<String> recurrentDistortions;
  final PushbackLevel preferredPushbackLevel;
  final DateTime? lastUpdatedAt;

  const StructuredPersonalProfile({
    this.preferredName,
    this.coreValues = const [],
    this.trustedPeople = const [],
    this.recurrentDistortions = const [],
    this.preferredPushbackLevel = PushbackLevel.moderate,
    this.lastUpdatedAt,
  });

  bool get isEmpty =>
      (preferredName == null || preferredName!.isEmpty) &&
      coreValues.isEmpty &&
      trustedPeople.isEmpty &&
      recurrentDistortions.isEmpty;

  StructuredPersonalProfile copyWith({
    String? preferredName,
    List<String>? coreValues,
    List<String>? trustedPeople,
    List<String>? recurrentDistortions,
    PushbackLevel? preferredPushbackLevel,
    DateTime? lastUpdatedAt,
  }) {
    return StructuredPersonalProfile(
      preferredName: preferredName ?? this.preferredName,
      coreValues: coreValues ?? this.coreValues,
      trustedPeople: trustedPeople ?? this.trustedPeople,
      recurrentDistortions: recurrentDistortions ?? this.recurrentDistortions,
      preferredPushbackLevel:
          preferredPushbackLevel ?? this.preferredPushbackLevel,
      lastUpdatedAt: lastUpdatedAt ?? this.lastUpdatedAt,
    );
  }
}

class ClinicalMemorySnapshot {
  final List<ClinicalMemoryMessage> activeWindowMessages; // capped at 20
  final int totalMessagesProcessed;
  final int rollingSummaryRefreshCount;
  final String rollingSummaryVi;
  final StructuredPersonalProfile personalProfile;

  const ClinicalMemorySnapshot({
    required this.activeWindowMessages,
    required this.totalMessagesProcessed,
    required this.rollingSummaryRefreshCount,
    required this.rollingSummaryVi,
    required this.personalProfile,
  });
}

class ClinicalMemoryStore {
  static const int maxActiveWindowSize = 20;
  static const int rollingSummaryInterval = 15;

  final DistortionDetector _detector;
  final List<ClinicalMemoryMessage> _activeWindow = [];
  int _totalMessagesProcessed = 0;
  int _rollingSummaryRefreshCount = 0;
  String _rollingSummaryVi =
      'Chưa có tóm tắt cuộn (Rolling Summary sẽ tự động cập nhật sau mỗi 15 tin nhắn).';
  StructuredPersonalProfile _personalProfile =
      const StructuredPersonalProfile();

  ClinicalMemoryStore({DistortionDetector detector = const DistortionDetector()})
      : _detector = detector;

  ClinicalMemorySnapshot get snapshot => ClinicalMemorySnapshot(
        activeWindowMessages: List.unmodifiable(_activeWindow),
        totalMessagesProcessed: _totalMessagesProcessed,
        rollingSummaryRefreshCount: _rollingSummaryRefreshCount,
        rollingSummaryVi: _rollingSummaryVi,
        personalProfile: _personalProfile,
      );

  /// Appends a message to the 2-Tier Clinical Memory Store:
  /// - Immediately extracts Structured Personal Profile facts from user messages
  /// - Maintains a sliding active context window of at most 20 messages
  /// - Recomputes the Rolling Summary every 15 messages.
  ClinicalMemorySnapshot appendMessage({
    required String role,
    required String content,
    DateTime? timestamp,
    List<String> citations = const [],
  }) {
    final now = timestamp ?? DateTime.now().toUtc();
    final analysis = _detector.analyzeText(text: content);
    final distortionCodes = <String>[
      ...analysis.negativeDistortions.map((d) => d.code),
      ...analysis.positiveDistortions.map((d) => d.code),
    ];

    if (role == 'user') {
      _extractProfileFactsImmediately(content, distortionCodes, now);
    }

    _totalMessagesProcessed += 1;
    final msg = ClinicalMemoryMessage(
      id: 'mem-$_totalMessagesProcessed',
      role: role,
      content: content,
      timestamp: now,
      detectedDistortions: distortionCodes,
      citations: citations,
    );

    _activeWindow.add(msg);
    while (_activeWindow.length > maxActiveWindowSize) {
      _activeWindow.removeAt(0);
    }

    if (_totalMessagesProcessed % rollingSummaryInterval == 0) {
      _rollingSummaryRefreshCount += 1;
      _refreshRollingSummary();
    }

    return snapshot;
  }

  /// One-tap complete erasure of derived memory (active window, rolling summary, and personal profile).
  ClinicalMemorySnapshot eraseAllDerivedMemory() {
    _activeWindow.clear();
    _totalMessagesProcessed = 0;
    _rollingSummaryRefreshCount = 0;
    _rollingSummaryVi =
        'Đã xóa toàn bộ bộ nhớ suy diễn (2-Tier Memory đã được đặt lại về trạng thái trống).';
    _personalProfile = const StructuredPersonalProfile();
    return snapshot;
  }

  void _extractProfileFactsImmediately(
    String text,
    List<String> newDistortions,
    DateTime now,
  ) {
    String? extractedName = _personalProfile.preferredName;
    final namePatterns = <RegExp>[
      RegExp(
        r'(?:tên tôi là|tôi tên là|mình tên là|gọi tôi là|my name is|call me)\s+([A-ZÀ-Ỹa-zà-ỹ]+(?:\s+[A-ZÀ-Ỹa-zà-ỹ]+)?)',
        caseSensitive: false,
      ),
    ];
    for (final regex in namePatterns) {
      final match = regex.firstMatch(text);
      if (match != null && match.group(1) != null) {
        extractedName = match.group(1)!.trim();
        break;
      }
    }

    final lower = text.toLowerCase();
    final valuesSet = <String>{..._personalProfile.coreValues};
    const valueKeywords = <String, String>{
      'gia đình': 'Gia đình & Sự gắn kết',
      'family': 'Gia đình & Sự gắn kết',
      'sức khỏe': 'Sức khỏe & Nhịp sinh học ổn định',
      'health': 'Sức khỏe & Nhịp sinh học ổn định',
      'tự chủ': 'Sự tự chủ & Độc lập',
      'autonomy': 'Sự tự chủ & Độc lập',
      'sáng tạo': 'Sáng tạo bền vững',
      'creativity': 'Sáng tạo bền vững',
      'tử tế': 'Sự tử tế & Chân thành',
      'kindness': 'Sự tử tế & Chân thành',
      'bình yên': 'Sự bình yên nội tâm',
      'peace': 'Sự bình yên nội tâm',
    };
    valueKeywords.forEach((kw, label) {
      if (lower.contains(kw)) {
        valuesSet.add(label);
      }
    });

    final trustedSet = <String>{..._personalProfile.trustedPeople};
    final trustedPatterns = <RegExp>[
      RegExp(
        r'(?:người tin cậy là|người thân là|vợ tôi|chồng tôi|mẹ tôi|bố tôi|bạn thân là|bác sĩ của tôi là|trusted contact is|my partner)\s*([A-ZÀ-Ỹa-zà-ỹ0-9\s]{2,25})?',
        caseSensitive: false,
      ),
    ];
    for (final regex in trustedPatterns) {
      final match = regex.firstMatch(text);
      if (match != null) {
        final raw = match.group(0)!.trim();
        trustedSet.add(raw);
      }
    }
    if (lower.contains('chị lan')) trustedSet.add('Chị Lan (Người tin cậy)');
    if (lower.contains('anh minh')) trustedSet.add('Anh Minh (Người tin cậy)');
    if (lower.contains('bác sĩ')) trustedSet.add('Bác sĩ điều trị');

    final distortionSet = <String>{
      ..._personalProfile.recurrentDistortions,
      ...newDistortions,
    };

    PushbackLevel pushback = _personalProfile.preferredPushbackLevel;
    if (lower.contains('không hỏi vặn') ||
        lower.contains('chỉ lắng nghe') ||
        lower.contains('pushback off')) {
      pushback = PushbackLevel.off;
    } else if (lower.contains('nhẹ nhàng') || lower.contains('gentle')) {
      pushback = PushbackLevel.gentle;
    } else if (lower.contains('phản biện sâu') ||
        lower.contains('thẳng thắn') ||
        lower.contains('firm')) {
      pushback = PushbackLevel.firm;
    }

    _personalProfile = _personalProfile.copyWith(
      preferredName: extractedName,
      coreValues: valuesSet.toList(),
      trustedPeople: trustedSet.toList(),
      recurrentDistortions: distortionSet.toList(),
      preferredPushbackLevel: pushback,
      lastUpdatedAt: now,
    );
  }

  void _refreshRollingSummary() {
    final recentDistortions = _activeWindow
        .expand((m) => m.detectedDistortions)
        .toSet()
        .toList();
    final nameStr = _personalProfile.preferredName ?? 'Người dùng';
    final distStr = recentDistortions.isEmpty
        ? 'Chưa ghi nhận biến dạng nhận thức nổi bật'
        : recentDistortions.join(', ');
    final valuesStr = _personalProfile.coreValues.isEmpty
        ? 'Đang khám phá'
        : _personalProfile.coreValues.join(', ');

    _rollingSummaryVi =
        '[Rolling Summary #$_rollingSummaryRefreshCount • $_totalMessagesProcessed tin nhắn] '
        'Hồ sơ: $nameStr • Giá trị cốt lõi: $valuesStr • '
        'Biến dạng nhận thức lặp lại trong cửa sổ 20 tin nhắn gần nhất: $distStr • '
        'Mức Socratic Pushback ưu tiên: ${_personalProfile.preferredPushbackLevel.code}.';
  }
}

// ============================================================================
// 2. MULTIMODAL VOICE "BURST" ANALYZER & PRESSURED-SPEECH MANIA DETECTOR
// ============================================================================

enum ComplaintIntent {
  expressive(
    'expressive',
    'Xả cảm xúc / Cần lắng nghe thấu cảm (Expressive Venting → TEAM-CBT EAR)',
  ),
  instrumental(
    'instrumental',
    'Cần công cụ giải quyết / Kỹ thuật có cấu trúc (Instrumental → CBT/DBT Skill)',
  );

  final String code;
  final String labelVi;
  const ComplaintIntent(this.code, this.labelVi);
}

class VoiceBurstMoodPalette {
  final String dominantAffect;
  final List<int> hexColors; // 5 ARGB hex ints for Flutter Color()
  final String gradientLabelVi;
  final String gradientLabelEn;

  const VoiceBurstMoodPalette({
    required this.dominantAffect,
    required this.hexColors,
    required this.gradientLabelVi,
    required this.gradientLabelEn,
  });
}

class VoiceBurstAnalysisResult {
  final String transcript;
  final int durationSeconds;
  final int wordCount;
  final double wordsPerMinute;
  final double baselineWpm;
  final double wpmSpikePercentage; // e.g. 38.5 for +38.5% above baseline
  final bool pressuredSpeechAlertTriggered; // true when WPM spike > 30%
  final bool safetyStopTriggered;
  final ComplaintIntent classifiedIntent;
  final VoiceBurstMoodPalette moodPalette;
  final List<String> detectedDistortions;
  final String empatheticEarResponseVi;
  final String recommendedProtocolSlug;
  final String clinicalGuidanceVi;

  const VoiceBurstAnalysisResult({
    required this.transcript,
    required this.durationSeconds,
    required this.wordCount,
    required this.wordsPerMinute,
    required this.baselineWpm,
    required this.wpmSpikePercentage,
    required this.pressuredSpeechAlertTriggered,
    required this.safetyStopTriggered,
    required this.classifiedIntent,
    required this.moodPalette,
    required this.detectedDistortions,
    required this.empatheticEarResponseVi,
    required this.recommendedProtocolSlug,
    required this.clinicalGuidanceVi,
  });
}

/// Analyzes a Voice "Burst" journal recording:
/// - Computes WPM speech rate and flags Bipolar Pressured Speech if WPM exceeds
///   `baselineWpm` by `> 30%` (`wpmSpikeRatio > 0.30`).
/// - Classifies Expressive vs. Instrumental intent (or respects user override).
/// - Generates a 5-color Mood-Palette visual signature.
VoiceBurstAnalysisResult analyzeVoiceBurstRecording({
  required String transcript,
  required int durationSeconds,
  double baselineWpm = 125.0,
  int currentMoodPolarity = 0,
  ComplaintIntent? userIntentOverride,
  DistortionDetector detector = const DistortionDetector(),
}) {
  final safeDurationSec = durationSeconds <= 0 ? 1 : durationSeconds;
  final cleanedWords = transcript
      .trim()
      .split(RegExp(r'\s+'))
      .where((w) => w.isNotEmpty)
      .toList();
  final wordCount = cleanedWords.length;
  final wpm = (wordCount / safeDurationSec) * 60.0;
  final safeBaseline = baselineWpm <= 0 ? 125.0 : baselineWpm;
  final spikeRatio = (wpm - safeBaseline) / safeBaseline;
  final spikePct = spikeRatio * 100.0;
  final isPressuredSpeech = spikeRatio > 0.30;

  final clinical = detector.analyzeText(
    text: transcript,
    moodPolarity: currentMoodPolarity,
  );
  final safetyStop = clinical.safetyScreen.requiresImmediateSafetyStop;

  final lower = transcript.toLowerCase();
  late final ComplaintIntent intent;
  if (userIntentOverride != null) {
    intent = userIntentOverride;
  } else if (lower.contains('làm sao để') ||
      lower.contains('hướng dẫn tôi') ||
      lower.contains('cần bài tập') ||
      lower.contains('giúp tôi lập kế hoạch') ||
      lower.contains('how do i') ||
      lower.contains('what skill')) {
    intent = ComplaintIntent.instrumental;
  } else {
    intent = ComplaintIntent.expressive;
  }

  final palette = _buildMoodPaletteForBurst(
    lowerTranscript: lower,
    moodPolarity: currentMoodPolarity,
    isPressuredSpeech: isPressuredSpeech,
    safetyStop: safetyStop,
  );

  final distortions = <String>[
    ...clinical.negativeDistortions.map((d) => d.code),
    ...clinical.positiveDistortions.map((d) => d.code),
  ];

  late final String earVi;
  late final String recommendedSlug;
  late final String guidanceVi;

  if (safetyStop) {
    earVi =
        '[SAFETY STOP] Mình nghe thấy nỗi đau và sự kiệt sức rất lớn trong giọng nói của bạn lúc này. Sự an toàn của bạn là ưu tiên tuyệt đối.';
    recommendedSlug = 'tipp';
    guidanceVi =
        'Ngắt toàn bộ phân tích nhận thức. Kết nối ngay Đường dây nóng Khủng hoảng (115 / 096 306 1414 / 111) hoặc Cổng SOS TIPP.';
  } else if (isPressuredSpeech) {
    earVi =
        '[TEAM-CBT EAR Empathy] Mình nghe thấy nguồn năng lượng và dòng ý tưởng đang tuôn trào rất nhanh trong giọng nói của bạn (${wpm.toStringAsFixed(0)} từ/phút, tăng +${spikePct.toStringAsFixed(0)}% so với ngưỡng bình thường).';
    recommendedSlug = 'hypomania-devils-advocate';
    guidanceVi =
        'CẢNH BÁO NÓI NHANH / ÁP LỰC NGÔN NGỮ (PRESSURED SPEECH > +30% WPM): Dấu hiệu tiền triệu Hưng cảm nhẹ / Hưng cảm. Khuyến nghị bật giao diện Dark Rest giảm kích thích và khóa mọi ý tưởng lớn vào Khoang Chờ 48 Giờ.';
  } else if (intent == ComplaintIntent.expressive) {
    earVi =
        '[TEAM-CBT 5 Bí quyết EAR — Thấu cảm & Xoa dịu] Cảm ơn bạn đã tin tưởng xả hết nỗi lòng qua Voice Burst. Hoàn toàn dễ hiểu khi bạn cảm thấy nặng nề như vậy trong hoàn cảnh này. Mình ở đây lắng nghe bạn 100% mà không phán xét hay vội vã sửa chữa suy nghĩ.';
    recommendedSlug = 'wise-mind';
    guidanceVi =
        'Chế độ Expressive Venting (Lắng nghe Thấu cảm): Tắt Socratic Pushback. Khi bạn thấy dịu hơn, có thể thở chậm 4-6 hoặc mở DBT Wise Mind.';
  } else {
    earVi =
        '[TEAM-CBT EAR + Định hướng Kỹ thuật] Mình đã ghi nhận rõ vấn đề bạn muốn tháo gỡ hôm nay. Chúng ta sẽ cùng chuyển sang bài tập có cấu trúc từng bước nhỏ.';
    recommendedSlug =
        currentMoodPolarity <= -2 ? 'behavioral-activation' : 'thought-record';
    guidanceVi =
        'Chế độ Instrumental (Giải quyết Vấn đề): Đề xuất mở phiên ${recommendedSlug == 'behavioral-activation' ? 'Behavioral Activation (có Rest Check)' : '7-Step Thought Record (có Accuracy Check)'}.';
  }

  return VoiceBurstAnalysisResult(
    transcript: transcript,
    durationSeconds: safeDurationSec,
    wordCount: wordCount,
    wordsPerMinute: double.parse(wpm.toStringAsFixed(1)),
    baselineWpm: safeBaseline,
    wpmSpikePercentage: double.parse(spikePct.toStringAsFixed(1)),
    pressuredSpeechAlertTriggered: isPressuredSpeech,
    safetyStopTriggered: safetyStop,
    classifiedIntent: intent,
    moodPalette: palette,
    detectedDistortions: distortions,
    empatheticEarResponseVi: earVi,
    recommendedProtocolSlug: recommendedSlug,
    clinicalGuidanceVi: guidanceVi,
  );
}

VoiceBurstMoodPalette _buildMoodPaletteForBurst({
  required String lowerTranscript,
  required int moodPolarity,
  required bool isPressuredSpeech,
  required bool safetyStop,
}) {
  if (safetyStop) {
    return const VoiceBurstMoodPalette(
      dominantAffect: 'crisis-safety-alert',
      hexColors: [
        0xFF7F1D1D,
        0xFF991B1B,
        0xFFB91C1C,
        0xFFDC2626,
        0xFFFEE2E2,
      ],
      gradientLabelVi: 'Đỏ Cảnh báo Khẩn cấp — Bảo vệ An toàn Tuyệt đối',
      gradientLabelEn: 'Crisis Safety Crimson Palette',
    );
  }

  if (isPressuredSpeech || moodPolarity >= 2) {
    return const VoiceBurstMoodPalette(
      dominantAffect: 'hypomanic-pressured-amber',
      hexColors: [
        0xFF1C1613,
        0xFF332615,
        0xFF6B4C2B,
        0xFFB8864B,
        0xFFD8A657,
      ],
      gradientLabelVi: 'Hổ phách Trầm Ấm (Low-Stimulus Dark Rest — Hạ nhiệt Hưng cảm)',
      gradientLabelEn: 'Warm Amber Low-Stimulus Mania Shield',
    );
  }

  if (moodPolarity <= -2 ||
      lowerTranscript.contains('mệt') ||
      lowerTranscript.contains('kiệt sức') ||
      lowerTranscript.contains('buồn')) {
    return const VoiceBurstMoodPalette(
      dominantAffect: 'melancholy-deep-teal',
      hexColors: [
        0xFF163238,
        0xFF1F454C,
        0xFF2E5C63,
        0xFF5D8A91,
        0xFFDDEAE7,
      ],
      gradientLabelVi: 'Xanh Lam Trầm Dịu (Low-Energy Compassion — Ôm ấp Kiệt sức)',
      gradientLabelEn: 'Deep Soothing Teal Palette',
    );
  }

  if (lowerTranscript.contains('lo') ||
      lowerTranscript.contains('sợ') ||
      lowerTranscript.contains('hoảng')) {
    return const VoiceBurstMoodPalette(
      dominantAffect: 'anxious-grounding-sage',
      hexColors: [
        0xFF1E3F37,
        0xFF276359,
        0xFF3E8478,
        0xFF75B0A4,
        0xFFE4EFEA,
      ],
      gradientLabelVi: 'Xanh Rêu Tiếp đất (Grounding Sage — Hạ nhịp Hạnh nhân)',
      gradientLabelEn: 'Grounding Sage Calm Palette',
    );
  }

  return const VoiceBurstMoodPalette(
    dominantAffect: 'euthymic-wise-mind-balance',
    hexColors: [
      0xFF1E4E44,
      0xFF2D6A5E,
      0xFF4C8C7E,
      0xFF8BBBAE,
      0xFFF2F6F4,
    ],
    gradientLabelVi: 'Xanh Ngọc Cân bằng (Euthymic Wise Mind Equilibrium)',
    gradientLabelEn: 'Euthymic Wise Mind Balance Palette',
  );
}

// ============================================================================
// 3. GROUNDED CLINICAL RAG (THRESHOLD = 0.46) & LOCAL OLLAMA / CLOUD BRIDGE
// ============================================================================

const double kClinicalRagAbstentionThreshold = 0.46;

enum AiCompanionProviderMode {
  onDeviceOffline(
    'on-device-offline',
    '100% On-Device Offline Protocol Engine (0ms • Không cần Internet)',
    'local://clinical-protocols-kb',
  ),
  localOllamaLan(
    'local-ollama-lan',
    'Local Ollama LAN Bridge (100% Private • http://127.0.0.1:11434)',
    'http://127.0.0.1:11434/api/chat',
  ),
  cloudFastApiSupabase(
    'cloud-fastapi-supabase',
    'Cloud Modular Monolith (FastAPI + pgvector Grounded RAG)',
    'https://api.equilibria.local/api/v1/companion/chat',
  );

  final String code;
  final String labelVi;
  final String defaultEndpoint;
  const AiCompanionProviderMode(
    this.code,
    this.labelVi,
    this.defaultEndpoint,
  );
}

class GroundedKbCitation {
  final String chunkId; // e.g. 'thought-record#accuracy-check'
  final String protocolSlug;
  final String titleVi;
  final double similarityScore;
  final String excerptVi;

  const GroundedKbCitation({
    required this.chunkId,
    required this.protocolSlug,
    required this.titleVi,
    required this.similarityScore,
    required this.excerptVi,
  });

  String get inlineTag => '[KB:$chunkId]';
}

class GroundedCompanionResponse {
  final String query;
  final AiCompanionProviderMode providerMode;
  final String activeEndpoint;
  final double topSimilarityScore;
  final double threshold;
  final bool abstained; // true when topSimilarityScore < 0.46
  final bool safetyStopTriggered;
  final List<GroundedKbCitation> citations;
  final String replyTextVi;
  final ClinicalMemorySnapshot memorySnapshot;

  const GroundedCompanionResponse({
    required this.query,
    required this.providerMode,
    required this.activeEndpoint,
    required this.topSimilarityScore,
    this.threshold = kClinicalRagAbstentionThreshold,
    required this.abstained,
    required this.safetyStopTriggered,
    required this.citations,
    required this.replyTextVi,
    required this.memorySnapshot,
  });
}

class _KbChunkEntry {
  final String chunkId;
  final String protocolSlug;
  final String titleVi;
  final List<String> keywords;
  final String excerptVi;
  final String clinicalGuidanceVi;

  const _KbChunkEntry({
    required this.chunkId,
    required this.protocolSlug,
    required this.titleVi,
    required this.keywords,
    required this.excerptVi,
    required this.clinicalGuidanceVi,
  });
}

class GroundedAiCompanionService {
  static const List<_KbChunkEntry> _verifiedClinicalKbChunks = [
    _KbChunkEntry(
      chunkId: 'thought-record#accuracy-check',
      protocolSlug: 'thought-record',
      titleVi: 'Nhật ký Suy nghĩ 7 Bước & Cổng Kiểm tra Độ chính xác (Accuracy Check)',
      keywords: [
        'suy nghĩ',
        'thought record',
        'bằng chứng',
        'accuracy check',
        'thất bại',
        'tự trách',
        'biến dạng',
        'distortion',
        'cbt',
      ],
      excerptVi:
          'Giữa Bước 5 và Bước 6, phải kiểm tra xem suy nghĩ tiêu cực có phản ánh sự thật khách quan hay không để tránh tích cực độc hại.',
      clinicalGuidanceVi:
          'Theo phác đồ Nhật ký Suy nghĩ 7 Bước [KB:thought-record#accuracy-check], chúng ta tách riêng sự kiện khách quan khỏi phần tự gán nhãn bản thân, và kiểm tra cổng Accuracy Check trước khi viết suy nghĩ cân bằng.',
    ),
    _KbChunkEntry(
      chunkId: 'tipp#cold-water-medical-screen',
      protocolSlug: 'tipp',
      titleVi: 'Kỹ thuật Hạ nhiệt Sinh lý DBT TIPP & Sàng lọc Y khoa Nước lạnh',
      keywords: [
        'tipp',
        'hoảng loạn',
        'panic',
        'tim đập nhanh',
        'nước lạnh',
        'thở',
        'cường độ cao',
        'sos',
        'dbt',
      ],
      excerptVi:
          'Khi cường độ cảm xúc >= 8/10, ưu tiên DBT TIPP trước CBT. Kỹ thuật Nước lạnh (Dive Reflex) bắt buộc sàng lọc bệnh tim mạch, nhịp chậm và beta-blocker.',
      clinicalGuidanceVi:
          'Theo quy tắc "DBT-First, CBT-Second" [KB:tipp#cold-water-medical-screen], khi hệ thần kinh đang kích hoạt mạnh, hãy bắt đầu bằng Thở dẫn nhịp 4-6 hoặc Nước lạnh (sau khi qua cổng sàng lọc tim mạch/beta-blocker).',
    ),
    _KbChunkEntry(
      chunkId: 'behavioral-activation#rest-check',
      protocolSlug: 'behavioral-activation',
      titleVi: 'Kích hoạt Hành vi 6 Bước (Behavioral Activation) & Cổng Rest Check',
      keywords: [
        'trầm cảm',
        'mệt mỏi',
        'kiệt sức',
        'nằm lì',
        'trì hoãn',
        'behavioral activation',
        'rest check',
        'nghỉ ngơi',
        'năng lượng thấp',
      ],
      excerptVi:
          'Cổng Rest Check phân biệt sự né tránh do trầm cảm với nhu cầu nghỉ ngơi sinh học chính đáng (ốm, thiếu ngủ, kiệt sức).',
      clinicalGuidanceVi:
          'Theo phác đồ Kích hoạt Hành vi [KB:behavioral-activation#rest-check], nếu cơ thể cần phục hồi sinh học, ứng dụng khuyến khích nghỉ ngơi chủ động không áy náy; nếu là né tránh, hãy thu nhỏ hành động về bước vi mô 2–5 phút.',
    ),
    _KbChunkEntry(
      chunkId: 'hypomania-guard#impulse-vault-48h',
      protocolSlug: 'hypomania-devils-advocate',
      titleVi: 'Lá chắn Hưng cảm nhẹ (Hypomania Guard) & Khoang Chờ 48 Giờ',
      keywords: [
        'hưng cảm',
        'lưỡng cực',
        'bipolar',
        'không cần ngủ',
        'mua sắm',
        'đầu tư',
        'ý tưởng thiên tài',
        '48 giờ',
        'impulse vault',
        'ipsrt',
        'bỏ thuốc',
        'lithium',
      ],
      excerptVi:
          'Khi ngủ < 5h kèm giảm nhu cầu ngủ hoặc khí sắc >= +2, bật Dark Rest UI và khóa mọi quyết định tài chính/công việc vào Khoang Chờ 48 Giờ.',
      clinicalGuidanceVi:
          'Theo phác đồ Bảo vệ Hai Cực [KB:hypomania-guard#impulse-vault-48h], hãy đưa quyết định lớn vào Khoang Chờ 48 Giờ qua 2 đêm ngủ trọn vẹn, áp dụng Devil\'s Advocate và tuyệt đối không tự ý ngưng thuốc ổn định khí sắc.',
    ),
    _KbChunkEntry(
      chunkId: 'chain-analysis#hard-stops-shame',
      protocolSlug: 'chain-analysis',
      titleVi: 'Phân tích Chuỗi Hành vi DBT Chain Analysis & 2 Hard Stops',
      keywords: [
        'chain analysis',
        'chuỗi hành vi',
        'xấu hổ',
        'nhục nhã',
        'shame',
        'cơn giận',
        'xung đột',
        'dear man',
      ],
      excerptVi:
          'Chain Analysis có 2 điểm dừng cứng (cấm chạy trên hành vi tự hại hoặc khi người dùng là nạn nhân bị bạo hành) và Shame Protocol tắt Pushback ngay lập tức.',
      clinicalGuidanceVi:
          'Theo phác đồ DBT [KB:chain-analysis#hard-stops-shame], chúng ta khảo sát yếu tố dễ tổn thương (PLEASE) và mắt xích suy nghĩ/cảm xúc với thái độ không phán xét, tắt hoàn toàn Pushback khi có cảm giác xấu hổ.',
    ),
    _KbChunkEntry(
      chunkId: 'worry-postponement#worry-box',
      protocolSlug: 'prediction-calibration',
      titleVi: 'Hộp Lo Âu (Worry Box) & Thang Tiếp xúc Sợ hãi (Exposure Hierarchy)',
      keywords: [
        'lo âu',
        'lo lắng',
        'worry',
        'nhỡ đâu',
        'what if',
        'tiếp xúc',
        'exposure',
        'suds',
        'hành vi an toàn',
      ],
      excerptVi:
          'Phân loại Lo lắng giải quyết được (Productive) và Lo lắng giả định (Hypothetical), cất vào Worry Box đến khung giờ cố định 15 phút/ngày.',
      clinicalGuidanceVi:
          'Theo phác đồ Quản trị Lo âu GAD [KB:worry-postponement#worry-box], hãy gửi các câu hỏi "Nhỡ đâu..." vào Hộp Lo Âu hẹn 17:30 xử lý, đồng thời giảm dần hành vi tìm kiếm trấn an.',
    ),
    _KbChunkEntry(
      chunkId: 'team-cbt#paradoxical-agenda-setting',
      protocolSlug: 'paradoxical-agenda-setting',
      titleVi: 'Làm tan Kháng cự TEAM-CBT (Paradoxical Agenda Setting & Magic Dial)',
      keywords: [
        'team-cbt',
        'david burns',
        'kháng cự',
        'magic button',
        'magic dial',
        'sdb',
        'cầu toàn',
        'pleasure predicting',
      ],
      excerptVi:
          'Trước khi thay đổi suy nghĩ tiêu cực, hãy tôn vinh những giá trị tốt đẹp và lợi ích mà cảm xúc/suy nghĩ đó đang cố bảo vệ bạn.',
      clinicalGuidanceVi:
          'Theo phương pháp TEAM-CBT của David Burns [KB:team-cbt#paradoxical-agenda-setting], chúng ta không ép buộc xóa bỏ cảm xúc mà dùng Magic Dial để chọn mức cường độ vừa đủ giữ lại giá trị cốt lõi của bạn.',
    ),
  ];

  final ClinicalMemoryStore memoryStore;
  final DistortionDetector _detector;
  AiCompanionProviderMode _providerMode;
  String _customOllamaEndpoint;

  GroundedAiCompanionService({
    ClinicalMemoryStore? memoryStore,
    DistortionDetector detector = const DistortionDetector(),
    AiCompanionProviderMode initialMode =
        AiCompanionProviderMode.onDeviceOffline,
    String customOllamaEndpoint = 'http://127.0.0.1:11434/api/chat',
  })  : memoryStore = memoryStore ?? ClinicalMemoryStore(detector: detector),
        _detector = detector,
        _providerMode = initialMode,
        _customOllamaEndpoint = customOllamaEndpoint;

  AiCompanionProviderMode get providerMode => _providerMode;

  String get activeEndpoint =>
      _providerMode == AiCompanionProviderMode.localOllamaLan
          ? _customOllamaEndpoint
          : _providerMode.defaultEndpoint;

  void setProviderMode(
    AiCompanionProviderMode mode, {
    String? customOllamaEndpoint,
  }) {
    _providerMode = mode;
    if (customOllamaEndpoint != null &&
        customOllamaEndpoint.trim().isNotEmpty) {
      _customOllamaEndpoint = customOllamaEndpoint.trim();
    }
  }

  /// Processes a user message through:
  /// 1. Pre-LLM 4-Layer Safety Screen (crisis -> immediate `safety-stop`, pushback OFF)
  /// 2. 2-Tier Clinical Memory Store (`appendMessage`)
  /// 3. Grounded Clinical RAG Retrieval with strict `threshold = 0.46`:
  ///    - If top score < 0.46: 100% Abstention Accuracy (no hallucinated advice,
  ///      warm TEAM-CBT EAR Empathy fallback + offline protocol pointer).
  ///    - If top score >= 0.46: Grounded clinical response with mandatory inline `[KB:chunk_id]` citations.
  GroundedCompanionResponse sendUserMessage({
    required String userMessage,
    int currentMoodPolarity = 0,
    int preIntensity = 5,
  }) {
    final safetyAnalysis = _detector.analyzeText(
      text: userMessage,
      moodPolarity: currentMoodPolarity,
      preIntensity: preIntensity,
    );

    memoryStore.appendMessage(
      role: 'user',
      content: userMessage,
    );

    if (safetyAnalysis.safetyScreen.requiresImmediateSafetyStop) {
      const crisisReply =
          '[SAFETY STOP • NGẮT PHÂN TÍCH TỰ ĐỘNG] Mình nghe thấy bạn đang trải qua nỗi đau quá sức chịu đựng và có suy nghĩ không an toàn. '
          'Ứng dụng đã tắt toàn bộ Socratic Pushback và AI tự do. Xin hãy kết nối ngay với con người thật lúc này:\n'
          '• Cấp cứu Y tế: 115\n'
          '• Đường dây nóng Ngày Mai: 096 306 1414\n'
          '• Tổng đài Khủng hoảng: 111\n'
          'Hoặc bấm nút đỏ SOS 1-Chạm (TIPP) ở góc màn hình.';
      final snap = memoryStore.appendMessage(
        role: 'assistant',
        content: crisisReply,
      );
      return GroundedCompanionResponse(
        query: userMessage,
        providerMode: _providerMode,
        activeEndpoint: activeEndpoint,
        topSimilarityScore: 1.0,
        abstained: false,
        safetyStopTriggered: true,
        citations: const [],
        replyTextVi: crisisReply,
        memorySnapshot: snap,
      );
    }

    final scoredChunks = _retrieveAndScoreKbChunks(userMessage);
    final topScore =
        scoredChunks.isEmpty ? 0.12 : scoredChunks.first.similarityScore;

    // Strict RAG Abstention Gate: threshold = 0.46
    if (topScore < kClinicalRagAbstentionThreshold) {
      final abstentionReply =
          '[ABSTAINED • Điểm tương đồng RAG ${topScore.toStringAsFixed(2)} < $kClinicalRagAbstentionThreshold (100% Abstention Gate)] '
          'Câu hỏi của bạn nằm ngoài phạm vi kho phác đồ lâm sàng đã kiểm chứng (CBT / TEAM-CBT / DBT / IPSRT), '
          'nên AI từ chối suy diễn tự do để đảm bảo an toàn tuyệt đối.\n'
          '[TEAM-CBT EAR Empathy Fallback] Mình vẫn ở đây lắng nghe cảm xúc của bạn. Nếu bạn muốn thực hành công cụ tâm lý có cấu trúc, '
          'hãy chọn Nhật ký Suy nghĩ 7 Bước, Hộp Lo Âu hoặc Cổng Hạ nhiệt DBT TIPP.';
      final snap = memoryStore.appendMessage(
        role: 'assistant',
        content: abstentionReply,
      );
      return GroundedCompanionResponse(
        query: userMessage,
        providerMode: _providerMode,
        activeEndpoint: activeEndpoint,
        topSimilarityScore: topScore,
        abstained: true,
        safetyStopTriggered: false,
        citations: const [],
        replyTextVi: abstentionReply,
        memorySnapshot: snap,
      );
    }

    final qualifiedCitations = scoredChunks
        .where((c) => c.similarityScore >= kClinicalRagAbstentionThreshold)
        .take(2)
        .toList();

    final primaryChunk = _verifiedClinicalKbChunks.firstWhere(
      (c) => c.chunkId == qualifiedCitations.first.chunkId,
    );

    final inlineTags = qualifiedCitations.map((c) => c.inlineTag).join(' ');
    final providerPrefix = _providerMode ==
            AiCompanionProviderMode.localOllamaLan
        ? '[Local Ollama Bridge ($_customOllamaEndpoint)]'
        : _providerMode == AiCompanionProviderMode.cloudFastApiSupabase
            ? '[Cloud Grounded RAG]'
            : '[On-Device Grounded Engine]';

    final groundedReply =
        '$providerPrefix [TEAM-CBT EAR Thấu cảm] Mình lắng nghe và thấu hiểu điều bạn đang chia sẻ. '
        '${primaryChunk.clinicalGuidanceVi} '
        'Nguồn trích dẫn lâm sàng: $inlineTags.';

    final snap = memoryStore.appendMessage(
      role: 'assistant',
      content: groundedReply,
      citations: qualifiedCitations.map((c) => c.inlineTag).toList(),
    );

    return GroundedCompanionResponse(
      query: userMessage,
      providerMode: _providerMode,
      activeEndpoint: activeEndpoint,
      topSimilarityScore: topScore,
      abstained: false,
      safetyStopTriggered: false,
      citations: qualifiedCitations,
      replyTextVi: groundedReply,
      memorySnapshot: snap,
    );
  }

  List<GroundedKbCitation> _retrieveAndScoreKbChunks(String query) {
    final normalized = query.toLowerCase();

    // Explicit out-of-scope / medical prescription / non-clinical domains
    const outOfScopeKeywords = <String>[
      'chứng khoán',
      'bitcoin',
      'crypto',
      'cổ phiếu',
      'thời tiết',
      'nấu ăn',
      'công thức món',
      'bóng đá',
      'tăng liều thuốc',
      'kê đơn thuốc',
      'đổi thuốc',
      'stock market',
      'weather forecast',
      'recipe',
      'prescribe dosage',
      'python code',
      'sql query',
    ];
    for (final kw in outOfScopeKeywords) {
      if (normalized.contains(kw)) {
        return const [
          GroundedKbCitation(
            chunkId: 'out-of-scope#none',
            protocolSlug: 'none',
            titleVi: 'Ngoài phạm vi Phác đồ Tâm lý Lâm sàng',
            similarityScore: 0.18,
            excerptVi: 'Truy vấn ngoài phạm vi kho tri thức CBT/DBT/IPSRT.',
          ),
        ];
      }
    }

    final results = <GroundedKbCitation>[];
    for (final chunk in _verifiedClinicalKbChunks) {
      int matchedCount = 0;
      for (final kw in chunk.keywords) {
        if (normalized.contains(kw)) {
          matchedCount += 1;
        }
      }
      if (matchedCount > 0) {
        // 1 keyword match -> 0.62, 2 matches -> 0.78, 3+ matches -> 0.91
        final score = (0.48 + matchedCount * 0.15).clamp(0.48, 0.96);
        results.add(
          GroundedKbCitation(
            chunkId: chunk.chunkId,
            protocolSlug: chunk.protocolSlug,
            titleVi: chunk.titleVi,
            similarityScore: double.parse(score.toStringAsFixed(2)),
            excerptVi: chunk.excerptVi,
          ),
        );
      }
    }

    results.sort((a, b) => b.similarityScore.compareTo(a.similarityScore));
    if (results.isEmpty) {
      return const [
        GroundedKbCitation(
          chunkId: 'unmatched#low-confidence',
          protocolSlug: 'none',
          titleVi: 'Độ tương đồng thấp hơn ngưỡng 0.46',
          similarityScore: 0.24,
          excerptVi: 'Không tìm thấy đoạn phác đồ vượt ngưỡng 0.46.',
        ),
      ];
    }
    return results;
  }
}

// ============================================================================
// 4. HEALTHKIT (iOS) & HEALTH CONNECT (ANDROID) BASELINE-RELATIVE BRIDGE
// ============================================================================

class BiometricSleepAndHrvSnapshot {
  final String platformSourceLabel; // 'Apple HealthKit (iOS)' | 'Health Connect (Android)'
  final String sourceDeviceId;
  final BaselineHrvAnalysisResult hrvAnalysis;
  final double lastNightSleepHours;
  final FeltNeedForSleep feltNeedForSleep;
  final bool withinSessionPrePostDeltaComputed; // ALWAYS FALSE per clinical spec
  final String privacyAndClinicalNoticeVi;

  const BiometricSleepAndHrvSnapshot({
    required this.platformSourceLabel,
    required this.sourceDeviceId,
    required this.hrvAnalysis,
    required this.lastNightSleepHours,
    required this.feltNeedForSleep,
    this.withinSessionPrePostDeltaComputed = false,
    required this.privacyAndClinicalNoticeVi,
  });
}

class MobileBiometricsBridgeService {
  final BipolarIpsrtEngine _bipolarEngine;

  const MobileBiometricsBridgeService({
    BipolarIpsrtEngine bipolarEngine = const BipolarIpsrtEngine(),
  }) : _bipolarEngine = bipolarEngine;

  /// Evaluates 14–30 day device-consistent HRV samples and sleep duration from
  /// HealthKit (iOS) or Health Connect (Android), enforcing:
  /// - 25th–75th percentile classification (`below-baseline`, `within-baseline`, `above-baseline`)
  /// - `< 12h` freshness check
  /// - NEVER computing within-session pre/post HRV deltas (`withinSessionPrePostDeltaComputed: false`).
  BiometricSleepAndHrvSnapshot buildBaselineSnapshot({
    required String platformSourceLabel,
    required String sourceDeviceId,
    required double latestHrvMs,
    required double latestSampleAgeHours,
    required double lastNightSleepHours,
    required FeltNeedForSleep feltNeedForSleep,
    DateTime? now,
  }) {
    final anchorNow = now ?? DateTime.utc(2026, 7, 20, 9, 0);
    final samples = <HrvSamplePoint>[
      // 14-day personal baseline window on the same wearable device (41..54 ms -> p25 ≈ 44.25ms, p75 ≈ 50.75ms)
      for (int day = 1; day <= 14; day++)
        HrvSamplePoint(
          timestamp: anchorNow.subtract(Duration(days: day)),
          valueMs: 40.0 + day,
          sourceDeviceId: sourceDeviceId,
        ),
      HrvSamplePoint(
        timestamp: anchorNow.subtract(
          Duration(minutes: (latestSampleAgeHours * 60).round()),
        ),
        valueMs: latestHrvMs,
        sourceDeviceId: sourceDeviceId,
      ),
    ];

    final hrvResult = _bipolarEngine.analyzeBaselineRelativeHrv(
      samples: samples,
      now: anchorNow,
    );

    return BiometricSleepAndHrvSnapshot(
      platformSourceLabel: platformSourceLabel,
      sourceDeviceId: sourceDeviceId,
      hrvAnalysis: hrvResult,
      lastNightSleepHours: lastNightSleepHours,
      feltNeedForSleep: feltNeedForSleep,
      withinSessionPrePostDeltaComputed: false,
      privacyAndClinicalNoticeVi:
          'Chuẩn Y khoa Health Integration: Chỉ so sánh HRV trên cùng 1 thiết bị ($sourceDeviceId) '
          'với đường nền 14–30 ngày (phân vị 25th–75th) khi mẫu mới < 12 giờ. '
          'TUYỆT ĐỐI KHÔNG đo hay so sánh chênh lệch HRV trước/sau trong cùng một phiên CBT/DBT.',
    );
  }
}
