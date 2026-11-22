// lib/presentation/screens/sleep_meditation_screen.dart
// Haven Night Sanctuary — 3 Studio Guided Sleep Body-Scan Meditations
// Plays the 3 studio recordings (DgNguyen Nam Trầm Ấm, Vita Nữ Dịu Ấm, DgNguyen Nam Trầm Sâu)
// layered over a pure seamless Forest Brook ambient loop via `just_audio`,
// with seek bar, speed control, independent mixer, and 15/30/45-min sleep timer.

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';

import '../../domain/models/sleep_meditation_script.dart';

enum _MeditationPhase {
  idle,
  playing,
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
  final AudioPlayer _freq432Player = AudioPlayer();
  final AudioPlayer _voicePlayer = AudioPlayer();

  late final AnimationController _rippleCtrl;
  StreamSubscription<Duration>? _posSub;
  StreamSubscription<Duration?>? _durSub;
  StreamSubscription<PlayerState>? _stateSub;

  int _selectedTrackIndex = 0;
  _MeditationPhase _phase = _MeditationPhase.idle;
  bool _isPaused = false;

  int _trackPositionSec = 0;
  int _trackDurationSec = kStudioMeditationTracks.first.durationSeconds;
  int _elapsedSessionSec = 0;
  int _sleepTimerMinutes = 30;
  int _runGeneration = 0;

  bool _voiceEnabled = true;
  double _voiceVolume = 0.90;
  double _voiceSpeed = 0.95;
  double _ambientVolume = 0.45;
  double _freq432Volume = 0.30;
  bool _loopTrack = false;
  bool _showFullScript = false;

  Timer? _sessionTimer;

  StudioMeditationTrack get _selectedTrack =>
      kStudioMeditationTracks[_selectedTrackIndex];

  @override
  void initState() {
    super.initState();
    _sleepTimerMinutes = widget.script.defaultTotalDurationMinutes;
    _rippleCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 6),
    );

    _posSub = _voicePlayer.positionStream.listen((pos) {
      if (!mounted) return;
      setState(() => _trackPositionSec = pos.inSeconds);
    });
    _durSub = _voicePlayer.durationStream.listen((dur) {
      if (!mounted || dur == null || dur.inSeconds <= 0) return;
      setState(() => _trackDurationSec = dur.inSeconds);
    });
    _stateSub = _voicePlayer.playerStateStream.listen((state) {
      if (!mounted) return;
      if (state.processingState == ProcessingState.completed &&
          _phase == _MeditationPhase.playing) {
        setState(() => _phase = _MeditationPhase.outroAmbient);
      }
    });
  }

  @override
  void dispose() {
    _runGeneration++;
    _sessionTimer?.cancel();
    unawaited(_posSub?.cancel());
    unawaited(_durSub?.cancel());
    unawaited(_stateSub?.cancel());
    _rippleCtrl.dispose();
    unawaited(_voicePlayer.dispose());
    unawaited(_freq432Player.dispose());
    unawaited(_ambientPlayer.dispose());
    super.dispose();
  }

  Future<void> _startAmbientBrook() async {
    try {
      await _ambientPlayer.setAsset(widget.script.ambientAudioAsset);
      await _ambientPlayer.setLoopMode(LoopMode.one);
      await _ambientPlayer.setVolume(_ambientVolume);
      unawaited(_ambientPlayer.play());
    } catch (_) {}
    try {
      await _freq432Player.setAsset('assets/audio/freq_432hz_loop.wav');
      await _freq432Player.setLoopMode(LoopMode.one);
      await _freq432Player.setVolume(_freq432Volume * 0.45);
      unawaited(_freq432Player.play());
    } catch (_) {}
  }

  void _startSessionClock(int gen) {
    _sessionTimer?.cancel();
    final targetSec = _sleepTimerMinutes * 60;
    _sessionTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted || _runGeneration != gen) return;
      setState(() => _elapsedSessionSec++);
      if (_elapsedSessionSec >= targetSec) {
        unawaited(_finishSessionGracefully());
      }
    });
  }

  Future<void> _finishSessionGracefully() async {
    _runGeneration++;
    _sessionTimer?.cancel();
    _rippleCtrl.stop();
    try {
      await _voicePlayer.stop();
      for (int step = 4; step >= 0; step--) {
        await _ambientPlayer.setVolume(_ambientVolume * (step / 4.0));
        await _freq432Player.setVolume(_freq432Volume * 0.45 * (step / 4.0));
        await Future<void>.delayed(const Duration(milliseconds: 400));
      }
      await _ambientPlayer.stop();
      await _freq432Player.stop();
    } catch (_) {}
    if (!mounted) return;
    setState(() {
      _phase = _MeditationPhase.completed;
      _isPaused = false;
    });
  }

  void _stopSession() {
    _runGeneration++;
    _sessionTimer?.cancel();
    _rippleCtrl.stop();
    unawaited(_voicePlayer.stop());
    unawaited(_freq432Player.stop());
    unawaited(_ambientPlayer.stop());
    setState(() {
      _phase = _MeditationPhase.idle;
      _isPaused = false;
      _trackPositionSec = 0;
      _elapsedSessionSec = 0;
    });
  }

  Future<void> _playTrackAtIndex(int idx) async {
    _runGeneration++;
    final gen = _runGeneration;
    _sessionTimer?.cancel();

    final track = kStudioMeditationTracks[idx];
    setState(() {
      _selectedTrackIndex = idx;
      _trackPositionSec = 0;
      _trackDurationSec = track.durationSeconds;
      _elapsedSessionSec = 0;
      _isPaused = false;
      _phase = _MeditationPhase.playing;
    });

    await _startAmbientBrook();
    try {
      await _voicePlayer.stop();
      await _voicePlayer.setAsset(track.audioAssetPath);
      await _voicePlayer.setLoopMode(_loopTrack ? LoopMode.one : LoopMode.off);
      await _voicePlayer.setSpeed(_voiceSpeed);
      await _voicePlayer.setVolume(_voiceEnabled ? _voiceVolume : 0.0);
      unawaited(_voicePlayer.play());
    } catch (_) {}

    if (!mounted || _runGeneration != gen) return;
    unawaited(_rippleCtrl.repeat(reverse: true));
    _startSessionClock(gen);
  }

  Future<void> _togglePause() async {
    if (_phase == _MeditationPhase.idle ||
        _phase == _MeditationPhase.completed) {
      await _playTrackAtIndex(_selectedTrackIndex);
      return;
    }

    if (!_isPaused) {
      _sessionTimer?.cancel();
      _rippleCtrl.stop();
      await _voicePlayer.pause();
      await _freq432Player.pause();
      await _ambientPlayer.pause();
      if (!mounted) return;
      setState(() => _isPaused = true);
    } else {
      _runGeneration++;
      final gen = _runGeneration;
      unawaited(_ambientPlayer.play());
      unawaited(_freq432Player.play());
      if (_phase == _MeditationPhase.playing) {
        unawaited(_voicePlayer.play());
      }
      unawaited(_rippleCtrl.repeat(reverse: true));
      setState(() => _isPaused = false);
      _startSessionClock(gen);
    }
  }

  @override
  Widget build(BuildContext context) {
    final track = _selectedTrack;
    final totalTargetSec = _sleepTimerMinutes * 60;
    final remainingSessionSec =
        (totalTargetSec - _elapsedSessionSec).clamp(0, totalTargetSec);
    final maxDur = _trackDurationSec > 0 ? _trackDurationSec : 1;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 88),
      children: [
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
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF7EC8B8).withValues(alpha: 0.16),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: const Text(
                  '🌙 Bộ 3 Bài Thiền Buông Thư Phòng Thu',
                  style: TextStyle(
                    color: Color(0xFF9EE2D4),
                    fontSize: 11.5,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                '🌊 Thiền Buông Thư Hỗ Trợ Giấc Ngủ Sâu',
                style: TextStyle(
                  color: Color(0xFFF5FAF9),
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Chọn 1 trong 3 giọng đọc trầm ấm kết hợp tiếng suối chảy róc rách tự nhiên.',
                style: TextStyle(
                  color: Color(0xFFB3C8C5),
                  fontSize: 12.5,
                  height: 1.45,
                ),
              ),
              const SizedBox(height: 14),

              // 3 Studio Track Selection Cards
              for (int i = 0; i < kStudioMeditationTracks.length; i++)
                _buildTrackCard(i, kStudioMeditationTracks[i]),

              const SizedBox(height: 12),

              // Active Player Stage with Ripple & Seek Bar
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
                            width: 62,
                            height: 62,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: RadialGradient(
                                colors: [
                                  const Color(0xFF7EC8B8)
                                      .withValues(alpha: 0.55),
                                  const Color(0xFF3E7C71)
                                      .withValues(alpha: 0.15),
                                ],
                              ),
                              border: Border.all(
                                color: const Color(0xFF9EE2D4)
                                    .withValues(alpha: 0.5),
                              ),
                            ),
                            child: Icon(
                              _phase == _MeditationPhase.playing
                                  ? Icons.headphones_rounded
                                  : Icons.water_drop_outlined,
                              color: const Color(0xFFE5F9F4),
                              size: 26,
                            ),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 10),
                    Text(
                      _statusLabel(track),
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Color(0xFF9EE2D4),
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      _phase == _MeditationPhase.outroAmbient
                          ? 'Hãy thả lỏng toàn thân và lắng nghe tiếng suối chảy êm dịu để chìm vào giấc ngủ sâu…'
                          : track.descriptionVi,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Color(0xFFF1F7F6),
                        fontSize: 13.5,
                        height: 1.55,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Slider(
                      value: _trackPositionSec.clamp(0, maxDur).toDouble(),
                      min: 0,
                      max: maxDur.toDouble(),
                      onChanged: (v) {
                        setState(() => _trackPositionSec = v.round());
                        unawaited(_voicePlayer.seek(Duration(seconds: v.round())));
                      },
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          formatMeditationClock(_trackPositionSec),
                          style: const TextStyle(
                            color: Color(0xFF9EB6B3),
                            fontSize: 11.5,
                          ),
                        ),
                        Text(
                          'Hẹn giờ: ${formatMeditationClock(remainingSessionSec)}',
                          style: const TextStyle(
                            color: Color(0xFF9EB6B3),
                            fontSize: 11.5,
                          ),
                        ),
                        Text(
                          formatMeditationClock(_trackDurationSec),
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

              // Primary Playback Controls
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
                        horizontal: 20,
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
                          ? 'Phát Bài ${track.trackNumber}'
                          : _isPaused
                              ? 'Tiếp tục'
                              : 'Tạm dừng',
                      style: const TextStyle(fontWeight: FontWeight.w800),
                    ),
                  ),
                  OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      backgroundColor: _loopTrack
                          ? const Color(0xFF7EC8B8).withValues(alpha: 0.22)
                          : Colors.transparent,
                      foregroundColor: _loopTrack
                          ? const Color(0xFFE9FBF7)
                          : const Color(0xFFCBD9D7),
                      side: BorderSide(
                        color: _loopTrack
                            ? const Color(0xFF7EC8B8)
                            : Colors.white24,
                      ),
                    ),
                    onPressed: () {
                      final next = !_loopTrack;
                      setState(() => _loopTrack = next);
                      unawaited(
                        _voicePlayer.setLoopMode(
                          next ? LoopMode.one : LoopMode.off,
                        ),
                      );
                    },
                    icon: Icon(
                      _loopTrack
                          ? Icons.repeat_one_rounded
                          : Icons.repeat_rounded,
                      size: 18,
                    ),
                    label: Text(_loopTrack ? 'Lặp bài: Bật' : 'Lặp bài: Tắt'),
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

              const SizedBox(height: 14),

              // Continuous Speed Slider (0.70x - 1.15x)
              Row(
                children: [
                  SizedBox(
                    width: 112,
                    child: Text(
                      'Tốc độ (${_voiceSpeed.toStringAsFixed(2)}x)',
                      style: const TextStyle(
                        color: Color(0xFFB3C8C5),
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  Expanded(
                    child: Slider(
                      value: _voiceSpeed.clamp(0.70, 1.15),
                      min: 0.70,
                      max: 1.15,
                      divisions: 9,
                      label: '${_voiceSpeed.toStringAsFixed(2)}x',
                      onChanged: (v) {
                        setState(() => _voiceSpeed = v);
                        unawaited(_voicePlayer.setSpeed(v));
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Wrap(
                spacing: 8,
                runSpacing: 6,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  const Text(
                    'Hẹn giờ ngủ:',
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

              const SizedBox(height: 10),

              // 3-Channel Volume Sliders (Voice + Brook + 432Hz @ 30% default)
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text(
                  '🎙️ Giọng đọc dẫn thiền phòng thu',
                  style: TextStyle(color: Color(0xFFE7F2F0), fontSize: 13.5),
                ),
                value: _voiceEnabled,
                onChanged: (v) {
                  setState(() => _voiceEnabled = v);
                  unawaited(_voicePlayer.setVolume(v ? _voiceVolume : 0.0));
                },
              ),
              Row(
                children: [
                  SizedBox(
                    width: 112,
                    child: Text(
                      'Giọng (${(_voiceVolume * 100).round()}%)',
                      style: const TextStyle(color: Color(0xFFB3C8C5), fontSize: 12),
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
                              unawaited(_voicePlayer.setVolume(v));
                            }
                          : null,
                    ),
                  ),
                ],
              ),
              Row(
                children: [
                  SizedBox(
                    width: 112,
                    child: Text(
                      'Suối (${(_ambientVolume * 100).round()}%)',
                      style: const TextStyle(color: Color(0xFFB3C8C5), fontSize: 12),
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
              Row(
                children: [
                  SizedBox(
                    width: 112,
                    child: Text(
                      '432Hz (${(_freq432Volume * 100).round()}%)',
                      style: const TextStyle(color: Color(0xFFB3C8C5), fontSize: 12),
                    ),
                  ),
                  Expanded(
                    child: Slider(
                      value: _freq432Volume,
                      min: 0.0,
                      max: 1.0,
                      onChanged: (v) {
                        setState(() => _freq432Volume = v);
                        unawaited(_freq432Player.setVolume(v * 0.45));
                      },
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 8),
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
                        ? 'Ẩn kịch bản chữ'
                        : 'Xem kịch bản chữ 6 phần',
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
                        cue.textVi,
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

  Widget _buildTrackCard(int idx, StudioMeditationTrack track) {
    final isSelected = _selectedTrackIndex == idx;
    final isPlayingThis =
        isSelected && _phase == _MeditationPhase.playing && !_isPaused;

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () => unawaited(_playTrackAtIndex(idx)),
        child: Container(
          padding: const EdgeInsets.all(13),
          decoration: BoxDecoration(
            color: isSelected
                ? const Color(0xFF7EC8B8).withValues(alpha: 0.16)
                : Colors.white.withValues(alpha: 0.04),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isSelected
                  ? const Color(0xFF7EC8B8)
                  : Colors.white.withValues(alpha: 0.14),
              width: isSelected ? 1.5 : 1.0,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFF7EC8B8).withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      track.voiceStyleBadgeVi,
                      style: const TextStyle(
                        color: Color(0xFFA3E8D9),
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  Text(
                    isPlayingThis
                        ? '🔊 Đang phát'
                        : '⏱ ${formatMeditationClock(track.durationSeconds)}',
                    style: const TextStyle(
                      color: Color(0xFF9EB6B3),
                      fontSize: 11.5,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                track.titleVi,
                style: const TextStyle(
                  color: Color(0xFFF7FBFA),
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                track.voiceNameVi,
                style: const TextStyle(
                  color: Color(0xFF9EE2D4),
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _statusLabel(StudioMeditationTrack track) {
    switch (_phase) {
      case _MeditationPhase.idle:
        return '✨ Sẵn sàng: ${track.titleVi}';
      case _MeditationPhase.playing:
        return '🎙️ ${track.voiceNameVi}';
      case _MeditationPhase.outroAmbient:
        return '🌌 Giọng đọc đã kết thúc — Giữ tiếng suối chảy ru ngủ';
      case _MeditationPhase.completed:
        return '🌙 Đã hoàn tất phiên thiền — Chúc bạn ngủ ngon';
    }
  }
}
