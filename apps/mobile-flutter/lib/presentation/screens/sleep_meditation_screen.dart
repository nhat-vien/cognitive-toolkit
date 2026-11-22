// lib/presentation/screens/sleep_meditation_screen.dart
// Haven Calm Audio Sanctuary — Inspired by minimalist meditation apps:
// 1. Clean Categorized Audio List ("Thiền Buông Thư" + "Bài thở thư giãn")
// 2. Full-Screen Uncluttered Dark Now Playing Screen with centered artwork,
//    minimalist 15s-back / Play / 15s-forward transport, Loop toggle,
//    and a 1-tap "Tùy chỉnh âm thanh" bottom sheet for Speed, Brook, 432Hz (30%),
//    Sleep Timer (15/30/45m), and Script.

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';

import '../../domain/models/sleep_meditation_script.dart';

const List<List<Color>> _kTrackArtGradients = [
  [Color(0xFF2F5E62), Color(0xFF172C33)],
  [Color(0xFF9F7A9F), Color(0xFF4D2E54)],
  [Color(0xFF3E5678), Color(0xFF1A2538)],
];

class SleepMeditationScreen extends StatelessWidget {
  final VoidCallback? onOpenBreathing;

  const SleepMeditationScreen({
    super.key,
    this.onOpenBreathing,
  });

  void _openPlayer(BuildContext context, int trackIndex) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => MeditationNowPlayingScreen(initialTrackIndex: trackIndex),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 100),
      children: [
        const Text(
          'Thiền / Thở',
          style: TextStyle(
            fontSize: 26,
            fontWeight: FontWeight.w800,
            color: Color(0xFF1D292F),
            letterSpacing: -0.4,
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'Chọn một bài thiền hoặc nhịp thở nhẹ nhàng để buông lỏng tâm trí.',
          style: TextStyle(
            fontSize: 13.5,
            color: Color(0xFF64737B),
            height: 1.4,
          ),
        ),
        const SizedBox(height: 22),

        // Section 1: Thiền Buông Thư (3 Studio Recordings)
        const Text(
          'Thiền Buông Thư Phòng Thu',
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w800,
            color: Color(0xFF1F2C33),
          ),
        ),
        const SizedBox(height: 12),
        for (int i = 0; i < kStudioMeditationTracks.length; i++)
          _buildAudioRow(
            context: context,
            title: kStudioMeditationTracks[i].titleVi.replaceFirst(
                  RegExp(r'^Bài \d+:\s*'),
                  '',
                ),
            subtitle:
                '${kStudioMeditationTracks[i].voiceNameVi} · ${formatMeditationClock(kStudioMeditationTracks[i].durationSeconds)}',
            gradient: _kTrackArtGradients[i % _kTrackArtGradients.length],
            icon: i == 1 ? Icons.spa_outlined : Icons.water_drop_outlined,
            badge: i == 1 ? 'Nữ dịu ấm' : null,
            onTap: () => _openPlayer(context, i),
          ),

        const SizedBox(height: 24),

        // Section 2: Bài thở thư giãn
        const Text(
          'Bài thở thư giãn',
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w800,
            color: Color(0xFF1F2C33),
          ),
        ),
        const SizedBox(height: 12),
        _buildAudioRow(
          context: context,
          title: 'Thở dễ ngủ 4-7-8',
          subtitle: 'Làm dịu hệ thần kinh · 3 phút',
          gradient: const [Color(0xFF283A5E), Color(0xFF10182B)],
          icon: Icons.nights_stay_outlined,
          onTap: onOpenBreathing ?? () => _openPlayer(context, 0),
        ),
        _buildAudioRow(
          context: context,
          title: 'Thở cân bằng 4-6',
          subtitle: 'Hạ nhịp tim, giảm lo âu nhanh · 2 phút',
          gradient: const [Color(0xFF6B8E7A), Color(0xFF2F4A3B)],
          icon: Icons.air_rounded,
          onTap: onOpenBreathing ?? () => _openPlayer(context, 0),
        ),
      ],
    );
  }

  Widget _buildAudioRow({
    required BuildContext context,
    required String title,
    required String subtitle,
    required List<Color> gradient,
    required IconData icon,
    String? badge,
    required VoidCallback onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(14),
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: gradient,
                  ),
                ),
                child: Icon(icon, color: Colors.white, size: 26),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            title,
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF1F2B31),
                            ),
                          ),
                        ),
                        if (badge != null)
                          Container(
                            margin: const EdgeInsets.only(left: 6),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFCEAE6),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              badge,
                              style: const TextStyle(
                                fontSize: 10.5,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFFC05A47),
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        fontSize: 12.5,
                        color: Color(0xFF6B7982),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              const Icon(
                Icons.play_circle_outline_rounded,
                color: Color(0xFF6E9883),
                size: 26,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Full-Screen Minimalist Dark Audio Player (inspired by calm bedtime player UI).
class MeditationNowPlayingScreen extends StatefulWidget {
  final int initialTrackIndex;

  const MeditationNowPlayingScreen({
    super.key,
    required this.initialTrackIndex,
  });

  @override
  State<MeditationNowPlayingScreen> createState() =>
      _MeditationNowPlayingScreenState();
}

class _MeditationNowPlayingScreenState extends State<MeditationNowPlayingScreen>
    with SingleTickerProviderStateMixin {
  final AudioPlayer _voicePlayer = AudioPlayer();
  final AudioPlayer _ambientPlayer = AudioPlayer();
  final AudioPlayer _freq432Player = AudioPlayer();

  late final AnimationController _glowCtrl;
  StreamSubscription<Duration>? _posSub;
  StreamSubscription<Duration?>? _durSub;
  StreamSubscription<PlayerState>? _stateSub;

  late int _trackIndex;
  bool _isPlaying = false;
  bool _loopTrack = false;
  int _positionSec = 0;
  int _durationSec = 300;
  int _sleepTimerMinutes = 30;
  int _elapsedSessionSec = 0;

  double _voiceVolume = 0.90;
  double _voiceSpeed = 0.95;
  double _brookVolume = 0.45;
  double _freq432Volume = 0.30; // Default 30% warm 432Hz

  Timer? _sessionTimer;

  StudioMeditationTrack get _track => kStudioMeditationTracks[_trackIndex];

  @override
  void initState() {
    super.initState();
    _trackIndex =
        widget.initialTrackIndex.clamp(0, kStudioMeditationTracks.length - 1);
    _durationSec = _track.durationSeconds;
    _glowCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 5),
    );

    _posSub = _voicePlayer.positionStream.listen((pos) {
      if (!mounted) return;
      setState(() => _positionSec = pos.inSeconds);
    });
    _durSub = _voicePlayer.durationStream.listen((dur) {
      if (!mounted || dur == null || dur.inSeconds <= 0) return;
      setState(() => _durationSec = dur.inSeconds);
    });
    _stateSub = _voicePlayer.playerStateStream.listen((st) {
      if (!mounted) return;
      if (st.processingState == ProcessingState.completed && !_loopTrack) {
        setState(() => _isPlaying = false);
      }
    });

    unawaited(_startTrack());
  }

  @override
  void dispose() {
    _sessionTimer?.cancel();
    unawaited(_posSub?.cancel());
    unawaited(_durSub?.cancel());
    unawaited(_stateSub?.cancel());
    _glowCtrl.dispose();
    unawaited(_voicePlayer.dispose());
    unawaited(_ambientPlayer.dispose());
    unawaited(_freq432Player.dispose());
    super.dispose();
  }

  Future<void> _startTrack() async {
    _sessionTimer?.cancel();
    setState(() {
      _positionSec = 0;
      _durationSec = _track.durationSeconds;
      _elapsedSessionSec = 0;
      _isPlaying = true;
    });

    try {
      await _ambientPlayer.setAsset('assets/audio/brook_432hz_loop.wav');
      await _ambientPlayer.setLoopMode(LoopMode.one);
      await _ambientPlayer.setVolume(_brookVolume);
      unawaited(_ambientPlayer.play());
    } catch (_) {}

    try {
      await _freq432Player.setAsset('assets/audio/freq_432hz_loop.wav');
      await _freq432Player.setLoopMode(LoopMode.one);
      await _freq432Player.setVolume(_freq432Volume * 0.45);
      unawaited(_freq432Player.play());
    } catch (_) {}

    try {
      await _voicePlayer.stop();
      await _voicePlayer.setAsset(_track.audioAssetPath);
      await _voicePlayer.setLoopMode(_loopTrack ? LoopMode.one : LoopMode.off);
      await _voicePlayer.setSpeed(_voiceSpeed);
      await _voicePlayer.setVolume(_voiceVolume);
      unawaited(_voicePlayer.play());
    } catch (_) {}

    unawaited(_glowCtrl.repeat(reverse: true));
    _sessionTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      _elapsedSessionSec++;
      if (_elapsedSessionSec >= _sleepTimerMinutes * 60) {
        unawaited(_fadeOutAndStop());
      }
    });
  }

  Future<void> _fadeOutAndStop() async {
    _sessionTimer?.cancel();
    _glowCtrl.stop();
    try {
      await _voicePlayer.stop();
      await _ambientPlayer.stop();
      await _freq432Player.stop();
    } catch (_) {}
    if (mounted) setState(() => _isPlaying = false);
  }

  Future<void> _togglePlayPause() async {
    if (_isPlaying) {
      _glowCtrl.stop();
      await _voicePlayer.pause();
      await _ambientPlayer.pause();
      await _freq432Player.pause();
      if (mounted) setState(() => _isPlaying = false);
    } else {
      unawaited(_glowCtrl.repeat(reverse: true));
      unawaited(_ambientPlayer.play());
      unawaited(_freq432Player.play());
      unawaited(_voicePlayer.play());
      if (mounted) setState(() => _isPlaying = true);
    }
  }

  Future<void> _seekBy(int deltaSec) async {
    final target = (_positionSec + deltaSec).clamp(0, _durationSec);
    setState(() => _positionSec = target);
    await _voicePlayer.seek(Duration(seconds: target));
  }

  void _openAudioSettingsSheet() {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: const Color(0xFF151F1C),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) {
          return SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(22, 18, 22, 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Tùy chỉnh Âm thanh & Hẹn giờ',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16.5,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _sheetSliderRow(
                    label: 'Tốc độ (${_voiceSpeed.toStringAsFixed(2)}x)',
                    value: _voiceSpeed.clamp(0.70, 1.15),
                    min: 0.70,
                    max: 1.15,
                    divisions: 9,
                    onChanged: (v) {
                      setSheetState(() => _voiceSpeed = v);
                      setState(() => _voiceSpeed = v);
                      unawaited(_voicePlayer.setSpeed(v));
                    },
                  ),
                  _sheetSliderRow(
                    label: 'Giọng đọc (${(_voiceVolume * 100).round()}%)',
                    value: _voiceVolume,
                    min: 0.1,
                    max: 1.0,
                    onChanged: (v) {
                      setSheetState(() => _voiceVolume = v);
                      setState(() => _voiceVolume = v);
                      unawaited(_voicePlayer.setVolume(v));
                    },
                  ),
                  _sheetSliderRow(
                    label: 'Suối chảy (${(_brookVolume * 100).round()}%)',
                    value: _brookVolume,
                    min: 0.0,
                    max: 1.0,
                    onChanged: (v) {
                      setSheetState(() => _brookVolume = v);
                      setState(() => _brookVolume = v);
                      unawaited(_ambientPlayer.setVolume(v));
                    },
                  ),
                  _sheetSliderRow(
                    label: '432Hz (${(_freq432Volume * 100).round()}%)',
                    value: _freq432Volume,
                    min: 0.0,
                    max: 1.0,
                    onChanged: (v) {
                      setSheetState(() => _freq432Volume = v);
                      setState(() => _freq432Volume = v);
                      unawaited(_freq432Player.setVolume(v * 0.45));
                    },
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      const Text(
                        'Hẹn giờ ngủ:',
                        style: TextStyle(color: Colors.white70, fontSize: 13),
                      ),
                      for (final m in [15, 30, 45])
                        ChoiceChip(
                          label: Text('$m phút'),
                          selected: _sleepTimerMinutes == m,
                          onSelected: (_) {
                            setSheetState(() => _sleepTimerMinutes = m);
                            setState(() => _sleepTimerMinutes = m);
                          },
                        ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _sheetSliderRow({
    required String label,
    required double value,
    required double min,
    required double max,
    int? divisions,
    required ValueChanged<double> onChanged,
  }) {
    return Row(
      children: [
        SizedBox(
          width: 122,
          child: Text(
            label,
            style: const TextStyle(color: Colors.white70, fontSize: 13),
          ),
        ),
        Expanded(
          child: Slider(
            value: value,
            min: min,
            max: max,
            divisions: divisions,
            activeColor: const Color(0xFF7EC8B8),
            onChanged: onChanged,
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final gradient =
        _kTrackArtGradients[_trackIndex % _kTrackArtGradients.length];
    final maxDur = _durationSec > 0 ? _durationSec : 1;
    final remainingSec = (_durationSec - _positionSec).clamp(0, _durationSec);

    return Scaffold(
      backgroundColor: const Color(0xFF0E1513),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 10, 24, 28),
          child: Column(
            children: [
              // Top Bar: Đóng · Đang phát · Tùy chỉnh âm thanh
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  TextButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text(
                      'Đóng',
                      style: TextStyle(color: Colors.white70, fontSize: 15),
                    ),
                  ),
                  const Text(
                    'Đang phát',
                    style: TextStyle(
                      color: Colors.white60,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  IconButton(
                    tooltip: 'Tùy chỉnh âm thanh & tốc độ',
                    icon: const Icon(Icons.tune_rounded, color: Colors.white70),
                    onPressed: _openAudioSettingsSheet,
                  ),
                ],
              ),

              const Spacer(),

              // Centered Serene Rounded Artwork
              AnimatedBuilder(
                animation: _glowCtrl,
                builder: (_, __) {
                  return Container(
                    width: 230,
                    height: 230,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(32),
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: gradient,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: gradient.first.withValues(
                            alpha: 0.28 + (_glowCtrl.value * 0.16),
                          ),
                          blurRadius: 40,
                          spreadRadius: 4,
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.spa_outlined,
                      size: 86,
                      color: Colors.white70,
                    ),
                  );
                },
              ),

              const SizedBox(height: 32),

              // Title & Narrator
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  _track.titleVi.replaceFirst(RegExp(r'^Bài \d+:\s*'), ''),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 23,
                    fontWeight: FontWeight.w700,
                    height: 1.25,
                  ),
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  const CircleAvatar(
                    radius: 14,
                    backgroundColor: Color(0xFF283A35),
                    child: Icon(Icons.record_voice_over,
                        size: 15, color: Color(0xFF9EE2D4)),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Thiền dẫn · ${_track.voiceNameVi}',
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ],
              ),

              const Spacer(),

              // Minimalist Seek Slider
              SliderTheme(
                data: SliderTheme.of(context).copyWith(
                  trackHeight: 3,
                  thumbShape:
                      const RoundSliderThumbShape(enabledThumbRadius: 6),
                  activeTrackColor: Colors.white,
                  inactiveTrackColor: Colors.white24,
                  thumbColor: Colors.white,
                ),
                child: Slider(
                  value: _positionSec.clamp(0, maxDur).toDouble(),
                  min: 0,
                  max: maxDur.toDouble(),
                  onChanged: (v) {
                    setState(() => _positionSec = v.round());
                    unawaited(_voicePlayer.seek(Duration(seconds: v.round())));
                  },
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    formatMeditationClock(_positionSec),
                    style: const TextStyle(color: Colors.white54, fontSize: 12),
                  ),
                  Text(
                    '-${formatMeditationClock(remainingSec)}',
                    style: const TextStyle(color: Colors.white54, fontSize: 12),
                  ),
                ],
              ),

              const SizedBox(height: 22),

              // Minimalist Circular Transport Row: -15s | Play/Pause | +15s
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _circleSeekButton('-15', () => unawaited(_seekBy(-15))),
                  const SizedBox(width: 28),
                  GestureDetector(
                    onTap: () => unawaited(_togglePlayPause()),
                    child: Container(
                      width: 72,
                      height: 72,
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        _isPlaying
                            ? Icons.pause_rounded
                            : Icons.play_arrow_rounded,
                        size: 36,
                        color: const Color(0xFF0E1513),
                      ),
                    ),
                  ),
                  const SizedBox(width: 28),
                  _circleSeekButton('+15', () => unawaited(_seekBy(15))),
                ],
              ),

              const SizedBox(height: 18),

              // Subtle Bottom Action Row: Loop & Sound Mixer
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  TextButton.icon(
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
                      color: _loopTrack
                          ? const Color(0xFF8FD4C4)
                          : Colors.white54,
                    ),
                    label: Text(
                      _loopTrack ? 'Lặp bài: Bật' : 'Lặp bài',
                      style: TextStyle(
                        color: _loopTrack
                            ? const Color(0xFF8FD4C4)
                            : Colors.white54,
                        fontSize: 12.5,
                      ),
                    ),
                  ),
                  TextButton.icon(
                    onPressed: _openAudioSettingsSheet,
                    icon: const Icon(
                      Icons.graphic_eq_rounded,
                      size: 18,
                      color: Colors.white54,
                    ),
                    label: Text(
                      '${_voiceSpeed.toStringAsFixed(2)}x · 432Hz ${( _freq432Volume * 100).round()}%',
                      style: const TextStyle(
                        color: Colors.white54,
                        fontSize: 12.5,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _circleSeekButton(String label, VoidCallback onTap) {
    return InkWell(
      borderRadius: BorderRadius.circular(999),
      onTap: onTap,
      child: Container(
        width: 48,
        height: 48,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white24),
        ),
        child: Text(
          label,
          style: const TextStyle(
            color: Colors.white70,
            fontSize: 12.5,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}
