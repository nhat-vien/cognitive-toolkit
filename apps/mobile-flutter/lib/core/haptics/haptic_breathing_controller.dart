// lib/core/haptics/haptic_breathing_controller.dart
// Tactile Haptic Feedback & Offline Ambient Sound Controller for Eyes-Closed
// Paced Breathing inside the SOS Portal (DBT TIPP - Paced Breathing):
// - 4-6 Pattern (Inhale 4s, Exhale 6s — Parasympathetic Vagal Activation)
// - 4-7-8 Pattern (Inhale 4s, Hold 7s, Exhale 8s)
// - Delivers distinct tactile pulse cues at phase transitions so a panicking user
//   can close their eyes and follow the rhythm by touch alone.

import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:just_audio/just_audio.dart';

enum BreathingPatternType {
  paced46(
    '4-6',
    'Thở Dẫn Nhịp DBT TIPP (4s Hít vào – 6s Thở ra)',
    4,
    0,
    6,
  ),
  relax478(
    '4-7-8',
    'Thở An Thần Sâu (4s Hít vào – 7s Giữ – 8s Thở ra)',
    4,
    7,
    8,
  );

  final String code;
  final String titleVi;
  final int inhaleSeconds;
  final int holdSeconds;
  final int exhaleSeconds;

  const BreathingPatternType(
    this.code,
    this.titleVi,
    this.inhaleSeconds,
    this.holdSeconds,
    this.exhaleSeconds,
  );

  int get totalCycleSeconds => inhaleSeconds + holdSeconds + exhaleSeconds;
}

enum BreathingPhase {
  idle('Sẵn sàng', 'Nhấn Bắt đầu và nhắm mắt cảm nhận nhịp rung trên tay'),
  inhale('Hít vào nhẹ nhàng bằng mũi...', 'Rung nhịp tăng dần'),
  hold('Giữ hơi thở tĩnh lặng...', 'Rung nhẹ giữ nhịp'),
  exhale('Thở ra thật chậm qua môi...', 'Thở ra dài hơn hít vào để kích hoạt dây thần kinh phế vị');

  final String instructionVi;
  final String subtitleVi;
  const BreathingPhase(this.instructionVi, this.subtitleVi);
}

class BreathingTickState {
  final BreathingPatternType pattern;
  final BreathingPhase phase;
  final int secondsRemainingInPhase;
  final int completedCycles;
  final double circleScale; // 0.55 (exhaled) to 1.0 (inhaled)
  final bool isRunning;

  const BreathingTickState({
    this.pattern = BreathingPatternType.paced46,
    this.phase = BreathingPhase.idle,
    this.secondsRemainingInPhase = 0,
    this.completedCycles = 0,
    this.circleScale = 0.65,
    this.isRunning = false,
  });

  BreathingTickState copyWith({
    BreathingPatternType? pattern,
    BreathingPhase? phase,
    int? secondsRemainingInPhase,
    int? completedCycles,
    double? circleScale,
    bool? isRunning,
  }) {
    return BreathingTickState(
      pattern: pattern ?? this.pattern,
      phase: phase ?? this.phase,
      secondsRemainingInPhase:
          secondsRemainingInPhase ?? this.secondsRemainingInPhase,
      completedCycles: completedCycles ?? this.completedCycles,
      circleScale: circleScale ?? this.circleScale,
      isRunning: isRunning ?? this.isRunning,
    );
  }
}

class HapticBreathingController extends ValueNotifier<BreathingTickState> {
  Timer? _timer;
  final AudioPlayer _ambientPlayer;
  int _elapsedInCycle = 0;

  HapticBreathingController({AudioPlayer? audioPlayer})
      : _ambientPlayer = audioPlayer ?? AudioPlayer(),
        super(const BreathingTickState());

  void selectPattern(BreathingPatternType pattern) {
    stop();
    value = value.copyWith(pattern: pattern);
  }

  void start() {
    _timer?.cancel();
    _elapsedInCycle = 0;
    _triggerPhaseTransitionHaptic(BreathingPhase.inhale);
    value = value.copyWith(
      phase: BreathingPhase.inhale,
      secondsRemainingInPhase: value.pattern.inhaleSeconds,
      circleScale: 1.0,
      isRunning: true,
    );

    _timer = Timer.periodic(const Duration(seconds: 1), (_) => _onSecondTick());
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
    try {
      _ambientPlayer.stop();
    } catch (_) {}
    value = value.copyWith(
      phase: BreathingPhase.idle,
      secondsRemainingInPhase: 0,
      circleScale: 0.65,
      isRunning: false,
    );
  }

  void _onSecondTick() {
    final p = value.pattern;
    _elapsedInCycle++;

    if (_elapsedInCycle >= p.totalCycleSeconds) {
      _elapsedInCycle = 0;
      _triggerPhaseTransitionHaptic(BreathingPhase.inhale);
      value = value.copyWith(
        phase: BreathingPhase.inhale,
        secondsRemainingInPhase: p.inhaleSeconds,
        completedCycles: value.completedCycles + 1,
        circleScale: 1.0,
      );
      return;
    }

    if (_elapsedInCycle < p.inhaleSeconds) {
      // Inhale phase: gentle tactile tick each second
      HapticFeedback.selectionClick();
      value = value.copyWith(
        phase: BreathingPhase.inhale,
        secondsRemainingInPhase: p.inhaleSeconds - _elapsedInCycle,
        circleScale: 1.0,
      );
    } else if (p.holdSeconds > 0 &&
        _elapsedInCycle < (p.inhaleSeconds + p.holdSeconds)) {
      final holdElapsed = _elapsedInCycle - p.inhaleSeconds;
      if (holdElapsed == 0) {
        _triggerPhaseTransitionHaptic(BreathingPhase.hold);
      }
      value = value.copyWith(
        phase: BreathingPhase.hold,
        secondsRemainingInPhase: p.holdSeconds - holdElapsed,
        circleScale: 0.95,
      );
    } else {
      final exhaleElapsed =
          _elapsedInCycle - (p.inhaleSeconds + p.holdSeconds);
      if (exhaleElapsed == 0) {
        _triggerPhaseTransitionHaptic(BreathingPhase.exhale);
      }
      value = value.copyWith(
        phase: BreathingPhase.exhale,
        secondsRemainingInPhase: p.exhaleSeconds - exhaleElapsed,
        circleScale: 0.58,
      );
    }
  }

  void _triggerPhaseTransitionHaptic(BreathingPhase nextPhase) {
    try {
      switch (nextPhase) {
        case BreathingPhase.inhale:
          HapticFeedback.mediumImpact();
          break;
        case BreathingPhase.hold:
          HapticFeedback.lightImpact();
          break;
        case BreathingPhase.exhale:
          HapticFeedback.heavyImpact();
          break;
        case BreathingPhase.idle:
          break;
      }
    } catch (_) {
      // Safe no-op in unit tests without platform channel
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    try {
      _ambientPlayer.dispose();
    } catch (_) {}
    super.dispose();
  }
}
