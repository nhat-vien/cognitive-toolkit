// lib/presentation/screens/sleep_meditation_screen.dart
// Haven Night Sanctuary — Guided Sleep Body-Scan Relaxation ("Thiền Buông Thư")
// Plays seamless offline Forest Brook + 432Hz audio via `just_audio`
// combined with Vietnamese voice guidance (`flutter_tts`) honoring exact [Nghỉ Xs] pauses.

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:just_audio/just_audio.dart';

import '../../domain/models/sleep_meditation_script.dart';

enum _MeditationPhase {
  idle,
  introAmbient,
  speaking,
  pausing,
  outroAmbient,
  completed,
}

class SleepMeditationScreen extends StatefulWidget {
  final SleepMeditationScript script;

  const SleepMeditationScreen({
    super.key,
    this.script = kScript1Brook432Hz,
  });

  @override
  State<SleepMeditationScreen> createState() => _SleepMeditationScreenState();
}

class _SleepMeditationScreenState extends State<SleepMeditationScreen>
    with SingleTickerProviderStateMixin {
  final AudioPlayer _ambientPlayer = AudioPlayer();
  final FlutterTts _tts = FlutterTts();

  late final List<MeditationCue> _allCues;
  late final AnimationController _rippleCtrl;

  _MeditationPhase _phase = _MeditationPhase.idle;
  bool _isPaused = false;
  int _cueIndex = 0;
  int _countdownSeconds = 0;
  int _elapsedSeconds = 0;
  int _sleepTimerMinutes = 30;
  int _runGeneration = 0;

  bool _voiceEnabled = true;
  double _voiceVolume = 0.88;
  double _ambientVolume = 0.62;
  bool _showFullScript = false;

  Timer? _pauseTimer;
  Timer? _sessionTimer;

  @override
  void initState() {
    super.initState();
    _allCues = widget.script.allCues;
    _sleepTimerMinutes = widget.script.defaultTotalDurationMinutes;
    _rippleCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 6),
    );
    unawaited(_initAudioAndTts());
  }

  Future<void> _initAudioAndTts() async {
    try {
      await _tts.setLanguage('vi-VN');
      await _tts.setSpeechRate(0.42);
      await _tts.setPitch(0.95);
      await _tts.setVolume(_voiceVolume);
      await _tts.awaitSpeakCompletion(true);
    } catch (_) {
      // Gracefully continue if TTS engine is unavailable (e.g., headless test)
    }
  }

  @override
  void dispose() {
    _runGeneration++;
    _pauseTimer?.cancel();
    _sessionTimer?.cancel();
    _rippleCtrl.dispose();
    unawaited(_tts.stop());
    unawaited(_ambientPlayer.dispose());
    super.dispose();
  }

  Future<void> _startAmbientAudio() async {
    try {
      await _ambientPlayer.setAsset(widget.script.ambientAudioAsset);
      await _ambientPlayer.setLoopMode(LoopMode.one);
      await _ambientPlayer.setVolume(_ambientVolume);
      unawaited(_ambientPlayer.play());
    } catch (_) {
      // Continue silently in environments without audio device
    }
  }

  void _startSessionClock(int gen) {
    _sessionTimer?.cancel();
    final targetSec = _sleepTimerMinutes * 60;
    _sessionTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted || _runGeneration != gen) return;
      setState(() => _elapsedSeconds++);
      if (_elapsedSeconds >= targetSec) {
        unawaited(_finishSessionGracefully());
      }
    });
  }

  Future<void> _finishSessionGracefully() async {
    _runGeneration++;
    _pauseTimer?.cancel();
    _sessionTimer?.cancel();
    _rippleCtrl.stop();
    try {
      await _tts.stop();
      // Gentle volume fade out over 2 seconds
      for (int step = 4; step >= 0; step--) {
        await _ambientPlayer.setVolume(_ambientVolume * (step / 4.0));
        await Future<void>.delayed(const Duration(milliseconds: 400));
      }
      await _ambientPlayer.stop();
    } catch (_) {}
    if (!mounted) return;
    setState(() {
      _phase = _MeditationPhase.completed;
      _isPaused = false;
      _countdownSeconds = 0;
    });
  }

  void _stopSession() {
    _runGeneration++;
    _pauseTimer?.cancel();
    _sessionTimer?.cancel();
    _rippleCtrl.stop();
    unawaited(_tts.stop());
    unawaited(_ambientPlayer.stop());
    setState(() {
      _phase = _MeditationPhase.idle;
      _isPaused = false;
      _countdownSeconds = 0;
      _elapsedSeconds = 0;
    });
  }

  void _runCountdown(int seconds, int gen, VoidCallback onComplete) {
    _pauseTimer?.cancel();
    if (seconds <= 0) {
      if (mounted) setState(() => _countdownSeconds = 0);
      onComplete();
      return;
    }
    int remaining = seconds;
    if (mounted) setState(() => _countdownSeconds = remaining);
    _pauseTimer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted || _runGeneration != gen) {
        t.cancel();
        return;
      }
      remaining--;
      setState(() => _countdownSeconds = remaining < 0 ? 0 : remaining);
      if (remaining <= 0) {
        t.cancel();
        onComplete();
      }
    });
  }

  Future<void> _playCueAt(int index, int gen) async {
    if (!mounted || _runGeneration != gen) return;
    if (index >= _allCues.length) {
      setState(() {
        _phase = _MeditationPhase.outroAmbient;
        _countdownSeconds = 0;
      });
      return;
    }

    final cue = _allCues[index];
    setState(() {
      _cueIndex = index;
      _phase = _MeditationPhase.speaking;
      _countdownSeconds = 0;
    });

    if (_voiceEnabled) {
      try {
        await _tts.setVolume(
          cue.isFinalFadeOut
              ? (_voiceVolume * 0.55).clamp(0.2, 1.0)
              : _voiceVolume,
        );
        await _tts.setSpeechRate(cue.isFinalFadeOut ? 0.36 : 0.42);
        await _tts.speak(cue.textVi);
      } catch (_) {
        // Fallback timed reading if TTS fails
        final estSec = (cue.textVi.split(' ').length / 2.6).round().clamp(4, 14);
        await Future<void>.delayed(Duration(seconds: estSec));
      }
    } else {
      final estSec = (cue.textVi.split(' ').length / 2.6).round().clamp(4, 14);
      await Future<void>.delayed(Duration(seconds: estSec));
    }

    if (!mounted || _runGeneration != gen) return;

    if (cue.isFinalFadeOut) {
      setState(() {
        _phase = _MeditationPhase.outroAmbient;
        _countdownSeconds = 0;
      });
      return;
    }

    setState(() => _phase = _MeditationPhase.pausing);
    _runCountdown(cue.pauseAfterSeconds, gen, () {
      unawaited(_playCueAt(index + 1, gen));
    });
  }

  Future<void> _startMeditation({
    bool skipIntro = false,
    int startAtCue = 0,
  }) async {
    _runGeneration++;
    final gen = _runGeneration;
    _pauseTimer?.cancel();
    _sessionTimer?.cancel();
    await _tts.stop();
    await _startAmbientAudio();

    if (!mounted || _runGeneration != gen) return;
    unawaited(_rippleCtrl.repeat(reverse: true));
    setState(() {
      _isPaused = false;
      _elapsedSeconds = 0;
      _cueIndex = startAtCue;
    });
    _startSessionClock(gen);

    if (skipIntro || startAtCue > 0) {
      unawaited(_playCueAt(startAtCue, gen));
    } else {
      setState(() => _phase = _MeditationPhase.introAmbient);
      _runCountdown(widget.script.introAmbientSeconds, gen, () {
        unawaited(_playCueAt(0, gen));
      });
    }
  }

  Future<void> _togglePause() async {
    if (_phase == _MeditationPhase.idle ||
        _phase == _MeditationPhase.completed) {
      await _startMeditation();
      return;
    }

    if (!_isPaused) {
      _runGeneration++;
      _pauseTimer?.cancel();
      _sessionTimer?.cancel();
      _rippleCtrl.stop();
      await _tts.stop();
      await _ambientPlayer.pause();
      if (!mounted) return;
      setState(() => _isPaused = true);
    } else {
      _runGeneration++;
      final gen = _runGeneration;
      unawaited(_ambientPlayer.play());
      unawaited(_rippleCtrl.repeat(reverse: true));
      setState(() => _isPaused = false);
      _startSessionClock(gen);
      if (_phase == _MeditationPhase.introAmbient) {
        _runCountdown(
          _countdownSeconds > 0 ? _countdownSeconds : 1,
          gen,
          () => unawaited(_playCueAt(0, gen)),
        );
      } else if (_phase != _MeditationPhase.outroAmbient) {
        unawaited(_playCueAt(_cueIndex, gen));
      }
    }
  }

  void _jumpToPart(int partIndex) {
    final idx = _allCues.indexWhere((c) => c.partIndex == partIndex);
    if (idx >= 0) {
      unawaited(_startMeditation(skipIntro: true, startAtCue: idx));
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentCue = _allCues[_cueIndex.clamp(0, _allCues.length - 1)];
    final totalTargetSec = _sleepTimerMinutes * 60;
    final remainingSec = (totalTargetSec - _elapsedSeconds).clamp(0, totalTargetSec);
    final progress = totalTargetSec > 0
        ? (_elapsedSeconds / totalTargetSec).clamp(0.0, 1.0)
        : 0.0;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 88),
      children: [
        // Main Night Sanctuary Card
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF131B26), Color(0xFF1A2834), Color(0xFF132528)],
            ),
            borderRadius: BorderRadius.circular(22),
            border: Border.all(
              color: const Color(0xFF7EC8B8).withValues(alpha: 0.28),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Tag & Title
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF7EC8B8).withValues(alpha: 0.16),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  '🌙 ${widget.script.numberLabel} • Hỗ trợ Giấc ngủ Sâu',
                  style: const TextStyle(
                    color: Color(0xFF9EE2D4),
                    fontSize: 11.5,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '🌊 ${widget.script.titleVi}',
                style: const TextStyle(
                  color: Color(0xFFF5FAF9),
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '${widget.script.settingVi}\n${widget.script.soundscapeVi}',
                style: const TextStyle(
                  color: Color(0xFFB3C8C5),
                  fontSize: 12.5,
                  height: 1.45,
                ),
              ),

              const SizedBox(height: 16),

              // Animated Water Ripple + Live Teleprompter
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF0A1118).withValues(alpha: 0.58),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: const Color(0xFF7EC8B8).withValues(alpha: 0.2),
                  ),
                ),
                child: Column(
                  children: [
                    AnimatedBuilder(
                      animation: _rippleCtrl,
                      builder: (_, __) {
                        final scale = 0.88 + (_rippleCtrl.value * 0.22);
                        return Transform.scale(
                          scale: scale,
                          child: Container(
                            width: 68,
                            height: 68,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: RadialGradient(
                                colors: [
                                  const Color(0xFF7EC8B8).withValues(alpha: 0.55),
                                  const Color(0xFF3E7C71).withValues(alpha: 0.15),
                                ],
                              ),
                              border: Border.all(
                                color: const Color(0xFF9EE2D4).withValues(alpha: 0.5),
                              ),
                            ),
                            child: Icon(
                              _phase == _MeditationPhase.speaking
                                  ? Icons.record_voice_over_outlined
                                  : Icons.water_drop_outlined,
                              color: const Color(0xFFE5F9F4),
                              size: 28,
                            ),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 12),
                    Text(
                      _phaseStatusLabel(currentCue),
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Color(0xFF9EE2D4),
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _activeTeleprompterText(currentCue),
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Color(0xFFF1F7F6),
                        fontSize: 14.5,
                        height: 1.6,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 14),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(999),
                      child: LinearProgressIndicator(
                        value: progress,
                        minHeight: 5,
                        backgroundColor: Colors.white12,
                        valueColor: const AlwaysStoppedAnimation(Color(0xFF7EC8B8)),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          formatMeditationClock(_elapsedSeconds),
                          style: const TextStyle(
                            color: Color(0xFF9EB6B3),
                            fontSize: 11.5,
                          ),
                        ),
                        Text(
                          'Câu ${_cueIndex + 1}/${_allCues.length}',
                          style: const TextStyle(
                            color: Color(0xFF9EB6B3),
                            fontSize: 11.5,
                          ),
                        ),
                        Text(
                          '-${formatMeditationClock(remainingSec)}',
                          style: const TextStyle(
                            color: Color(0xFF9EB6B3),
                            fontSize: 11.5,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 14),

              // Primary Playback Controls (Wrap to avoid overflow)
              Wrap(
                spacing: 8,
                runSpacing: 8,
                alignment: WrapAlignment.center,
                children: [
                  FilledButton.icon(
                    style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFF63B3A1),
                      foregroundColor: const Color(0xFF0B1816),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 18,
                        vertical: 11,
                      ),
                    ),
                    onPressed: () => unawaited(_togglePause()),
                    icon: Icon(
                      _phase == _MeditationPhase.idle ||
                              _phase == _MeditationPhase.completed ||
                              _isPaused
                          ? Icons.play_arrow_rounded
                          : Icons.pause_rounded,
                    ),
                    label: Text(
                      _phase == _MeditationPhase.idle ||
                              _phase == _MeditationPhase.completed
                          ? 'Bắt đầu Thiền (30s nhạc dạo)'
                          : _isPaused
                              ? 'Tiếp tục'
                              : 'Tạm dừng',
                      style: const TextStyle(fontWeight: FontWeight.w800),
                    ),
                  ),
                  if (_phase == _MeditationPhase.idle ||
                      _phase == _MeditationPhase.introAmbient)
                    OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFFD0F2EA),
                        side: BorderSide(
                          color: const Color(0xFF9EE2D4).withValues(alpha: 0.45),
                        ),
                      ),
                      onPressed: () =>
                          unawaited(_startMeditation(skipIntro: true)),
                      icon: const Icon(Icons.skip_next, size: 18),
                      label: const Text('Vào ngay Phần 1'),
                    ),
                  if (_phase != _MeditationPhase.idle)
                    OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFFCBD9D7),
                        side: const BorderSide(color: Colors.white24),
                      ),
                      onPressed: _stopSession,
                      icon: const Icon(Icons.stop_rounded, size: 18),
                      label: const Text('Dừng'),
                    ),
                ],
              ),

              const SizedBox(height: 16),

              // Sleep Timer Chips
              Wrap(
                spacing: 8,
                runSpacing: 6,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  const Text(
                    'Hẹn giờ tắt nhạc:',
                    style: TextStyle(color: Color(0xFF9EB6B3), fontSize: 12),
                  ),
                  for (final mins in [15, 30, 45])
                    ChoiceChip(
                      label: Text('$mins phút'),
                      selected: _sleepTimerMinutes == mins,
                      onSelected: (_) =>
                          setState(() => _sleepTimerMinutes = mins),
                    ),
                ],
              ),

              const SizedBox(height: 12),

              // Audio Mixer Sliders
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text(
                  '🎙️ Giọng đọc dẫn thiền tiếng Việt',
                  style: TextStyle(color: Color(0xFFE7F2F0), fontSize: 13.5),
                ),
                value: _voiceEnabled,
                onChanged: (v) => setState(() => _voiceEnabled = v),
              ),
              Row(
                children: [
                  const SizedBox(
                    width: 112,
                    child: Text(
                      'Âm lượng giọng',
                      style: TextStyle(color: Color(0xFFB3C8C5), fontSize: 12),
                    ),
                  ),
                  Expanded(
                    child: Slider(
                      value: _voiceVolume,
                      min: 0.1,
                      max: 1.0,
                      onChanged: _voiceEnabled
                          ? (v) {
                              setState(() => _voiceVolume = v);
                              unawaited(_tts.setVolume(v));
                            }
                          : null,
                    ),
                  ),
                ],
              ),
              Row(
                children: [
                  const SizedBox(
                    width: 112,
                    child: Text(
                      'Suối & 432Hz',
                      style: TextStyle(color: Color(0xFFB3C8C5), fontSize: 12),
                    ),
                  ),
                  Expanded(
                    child: Slider(
                      value: _ambientVolume,
                      min: 0.0,
                      max: 1.0,
                      onChanged: (v) {
                        setState(() => _ambientVolume = v);
                        unawaited(_ambientPlayer.setVolume(v));
                      },
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 10),

              // 6 Parts Quick Jump
              const Text(
                'Chuyển nhanh đến từng phần:',
                style: TextStyle(
                  color: Color(0xFF9EB6B3),
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final part in widget.script.parts)
                    ActionChip(
                      backgroundColor: _phase != _MeditationPhase.idle &&
                              currentCue.partIndex == part.index
                          ? const Color(0xFF2D5E55)
                          : const Color(0xFF1F303B),
                      side: BorderSide(
                        color: const Color(0xFF7EC8B8).withValues(alpha: 0.35),
                      ),
                      label: Text(
                        'Phần ${part.index}: ${part.bodyRegionVi}',
                        style: const TextStyle(
                          color: Color(0xFFE6F5F2),
                          fontSize: 12,
                        ),
                      ),
                      onPressed: () => _jumpToPart(part.index),
                    ),
                ],
              ),

              const SizedBox(height: 12),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  onPressed: () =>
                      setState(() => _showFullScript = !_showFullScript),
                  icon: Icon(
                    _showFullScript
                        ? Icons.keyboard_arrow_up
                        : Icons.keyboard_arrow_down,
                    color: const Color(0xFF9EE2D4),
                  ),
                  label: Text(
                    _showFullScript
                        ? 'Ẩn toàn văn kịch bản'
                        : 'Xem toàn văn kịch bản & [Nghỉ Xs]',
                    style: const TextStyle(
                      color: Color(0xFF9EE2D4),
                      fontSize: 12.5,
                    ),
                  ),
                ),
              ),

              if (_showFullScript) ...[
                const Divider(color: Colors.white12),
                for (final part in widget.script.parts) ...[
                  Padding(
                    padding: const EdgeInsets.only(top: 8, bottom: 4),
                    child: Text(
                      part.titleVi,
                      style: const TextStyle(
                        color: Color(0xFF9EE2D4),
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                      ),
                    ),
                  ),
                  for (final cue in part.cues)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Text(
                        cue.pauseAfterSeconds > 0
                            ? '${cue.textVi}  [Nghỉ ${cue.pauseAfterSeconds}s]'
                            : cue.textVi,
                        style: const TextStyle(
                          color: Color(0xFFD5E3E1),
                          fontSize: 12.5,
                          height: 1.5,
                        ),
                      ),
                    ),
                ],
              ],
            ],
          ),
        ),
      ],
    );
  }

  String _phaseStatusLabel(MeditationCue currentCue) {
    switch (_phase) {
      case _MeditationPhase.idle:
        return '✨ Sẵn sàng buông thư — Hãy nằm xuống thoải mái';
      case _MeditationPhase.introAmbient:
        return '🌊 Nhạc nền suối chảy & 432Hz mở đầu (${_countdownSeconds}s)';
      case _MeditationPhase.speaking:
        return '🎙️ ${currentCue.partTitleVi}';
      case _MeditationPhase.pausing:
        return '🍃 ${currentCue.partTitleVi} • Thả lỏng (${_countdownSeconds}s)';
      case _MeditationPhase.outroAmbient:
        return '🌌 Giọng đọc đã lắng xuống — Giữ tiếng suối & sóng 432Hz ru ngủ';
      case _MeditationPhase.completed:
        return '🌙 Đã hoàn tất phiên thiền — Chúc bạn ngủ ngon';
    }
  }

  String _activeTeleprompterText(MeditationCue currentCue) {
    switch (_phase) {
      case _MeditationPhase.idle:
        return '“Hãy nằm xuống, để cơ thể bạn được nâng niu bởi mặt đất, như được ôm trọn trong vòng tay của đất mẹ dịu dàng.”';
      case _MeditationPhase.introAmbient:
        return 'Khép nhẹ đôi mắt… lắng nghe tiếng suối chảy róc rách và sóng âm 432Hz êm dịu lan tỏa khắp không gian…';
      case _MeditationPhase.speaking:
      case _MeditationPhase.pausing:
        return '“${currentCue.textVi}”';
      case _MeditationPhase.outroAmbient:
        return widget.script.outroNoteVi;
      case _MeditationPhase.completed:
        return 'Chúc bạn một giấc ngủ thật sâu, an lành và trọn vẹn.';
    }
  }
}
