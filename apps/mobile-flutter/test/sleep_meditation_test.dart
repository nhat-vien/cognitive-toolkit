// test/sleep_meditation_test.dart
// Unit tests for Sleep Body-Scan Relaxation ("Thiền Buông Thư Bên Dòng Suối Mát").

import 'package:equilibria_mobile_flutter/domain/models/sleep_meditation_script.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Thiền Buông Thư Bên Dòng Suối Mát (Kịch bản 1)', () {
    test('contains all 6 structured parts and 27 exact cues', () {
      expect(kScript1Brook432Hz.parts.length, equals(6));
      expect(kScript1Brook432Hz.allCues.length, equals(27));
      expect(kScript1Brook432Hz.introAmbientSeconds, equals(0));
      expect(kScript1Brook432Hz.defaultTotalDurationMinutes, equals(30));
      expect(
        kScript1Brook432Hz.ambientAudioAsset,
        equals('assets/audio/brook_432hz_loop.wav'),
      );
    });

    test('preserves exact [Nghỉ Xs] pause timings and final fade-out cue', () {
      final cues = kScript1Brook432Hz.allCues;
      expect(cues.first.pauseAfterSeconds, equals(5));
      expect(cues.first.textVi, contains('vòng tay của đất mẹ dịu dàng'));
      expect(cues.last.isFinalFadeOut, isTrue);
      expect(cues.last.pauseAfterSeconds, equals(0));
      expect(cues.last.textVi, contains('chìm sâu vào giấc ngủ ngon'));
      // Sum of all [Nghỉ Xs] across 26 paused cues:
      // P1: 5+8+10+10 = 33
      // P2: 10+8+10+8+12 = 48
      // P3: 10+12+12+12+15 = 61
      // P4: 12+10+15+12+15 = 64
      // P5: 12+12+15 = 39
      // P6: 10+12+15+15+0 = 52
      // Total = 297 seconds
      expect(kScript1Brook432Hz.totalPauseSeconds, equals(297));
    });

    test('provides all 3 studio voice tracks from ./voice', () {
      expect(kStudioMeditationTracks.length, equals(3));
      expect(
        kStudioMeditationTracks[0].audioAssetPath,
        equals('assets/audio/meditation/voice_1_suoi_mat_nam_tram.mp3'),
      );
      expect(
        kStudioMeditationTracks[1].audioAssetPath,
        equals('assets/audio/meditation/voice_2_haven_got_rua_phien_lo_nu_am.mp3'),
      );
      expect(
        kStudioMeditationTracks[2].audioAssetPath,
        equals('assets/audio/meditation/voice_3_giac_ngu_sau_nam_tram_sau.mp3'),
      );
    });

    test('formatMeditationClock formats mm:ss cleanly', () {
      expect(formatMeditationClock(0), equals('00:00'));
      expect(formatMeditationClock(30), equals('00:30'));
      expect(formatMeditationClock(1800), equals('30:00'));
      expect(formatMeditationClock(-5), equals('00:00'));
    });
  });
}
