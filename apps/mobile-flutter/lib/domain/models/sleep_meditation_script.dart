// lib/domain/models/sleep_meditation_script.dart
// Guided Sleep Body-Scan Relaxation ("Thiền Buông Thư") domain model & Script 1.
// Script 1: THIỀN BUÔNG THƯ BÊN DÒNG SUỐI MÁT (Tiếng suối chảy róc rách + Sóng âm 432Hz).

class MeditationCue {
  final String id;
  final int partIndex;
  final String partTitleVi;
  final String textVi;
  final int pauseAfterSeconds;
  final bool isFinalFadeOut;

  const MeditationCue({
    required this.id,
    required this.partIndex,
    required this.partTitleVi,
    required this.textVi,
    required this.pauseAfterSeconds,
    this.isFinalFadeOut = false,
  });
}

class MeditationPart {
  final int index;
  final String titleVi;
  final String bodyRegionVi;
  final List<MeditationCue> cues;

  const MeditationPart({
    required this.index,
    required this.titleVi,
    required this.bodyRegionVi,
    required this.cues,
  });
}

class SleepMeditationScript {
  final String id;
  final String numberLabel;
  final String titleVi;
  final String settingVi;
  final String soundscapeVi;
  final String ambientAudioAsset;
  final int introAmbientSeconds;
  final int defaultTotalDurationMinutes;
  final String outroNoteVi;
  final List<MeditationPart> parts;

  const SleepMeditationScript({
    required this.id,
    required this.numberLabel,
    required this.titleVi,
    required this.settingVi,
    required this.soundscapeVi,
    required this.ambientAudioAsset,
    required this.introAmbientSeconds,
    required this.defaultTotalDurationMinutes,
    required this.outroNoteVi,
    required this.parts,
  });

  List<MeditationCue> get allCues =>
      parts.expand((part) => part.cues).toList(growable: false);

  int get totalPauseSeconds =>
      allCues.fold(0, (sum, cue) => sum + cue.pauseAfterSeconds);
}

String formatMeditationClock(int totalSeconds) {
  final safe = totalSeconds < 0 ? 0 : totalSeconds;
  final m = safe ~/ 60;
  final s = safe % 60;
  return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
}

class StudioMeditationTrack {
  final String id;
  final int trackNumber;
  final String titleVi;
  final String voiceNameVi;
  final String voiceStyleBadgeVi;
  final String descriptionVi;
  final int durationSeconds;
  final String audioAssetPath;

  const StudioMeditationTrack({
    required this.id,
    required this.trackNumber,
    required this.titleVi,
    required this.voiceNameVi,
    required this.voiceStyleBadgeVi,
    required this.descriptionVi,
    required this.durationSeconds,
    required this.audioAssetPath,
  });
}

const List<StudioMeditationTrack> kStudioMeditationTracks = [
  StudioMeditationTrack(
    id: 'voice-1-suoi-mat',
    trackNumber: 1,
    titleVi: 'Bài 1: Thiền Buông Thư Bên Dòng Suối Mát',
    voiceNameVi: 'Giọng Nam Trầm Ấm (DgNguyen)',
    voiceStyleBadgeVi: 'Nam · Miền Bắc · Trầm ấm',
    descriptionVi:
        'Hãy nằm xuống để cơ thể được nâng niu bởi đất mẹ dịu dàng, thả lỏng từng nhịp thở cho mọi lo lắng tan dần.',
    durationSeconds: 264,
    audioAssetPath: 'assets/audio/meditation/voice_1_suoi_mat_nam_tram.mp3',
  ),
  StudioMeditationTrack(
    id: 'voice-2-haven-got-rua',
    trackNumber: 2,
    titleVi: 'Bài 2: Thiền Buông Thư Cùng Haven — Gột Rửa Phiền Lo',
    voiceNameVi: 'Giọng Nữ Dịu Ấm (Vita)',
    voiceStyleBadgeVi: 'Nữ · Dịu dàng · Ấm áp',
    descriptionVi:
        'Thiết kế dành riêng cho bạn để gột rửa mọi phiền lo và vỗ về tâm trí sau một ngày dài vất vả.',
    durationSeconds: 359,
    audioAssetPath:
        'assets/audio/meditation/voice_2_haven_got_rua_phien_lo_nu_am.mp3',
  ),
  StudioMeditationTrack(
    id: 'voice-3-giac-ngu-sau',
    trackNumber: 3,
    titleVi: 'Bài 3: Thiền Buông Thư Giấc Ngủ Sâu — Ôm Trọn Bình Yên',
    voiceNameVi: 'Giọng Nam Trầm Sâu (DgNguyen)',
    voiceStyleBadgeVi: 'Nam · Miền Bắc · Trầm sâu',
    descriptionVi:
        'Thả lỏng toàn thân trên chiếc giường êm ái, dẫn dắt nhịp chậm rãi giúp bạn dễ dàng chìm vào giấc ngủ sâu.',
    durationSeconds: 363,
    audioAssetPath:
        'assets/audio/meditation/voice_3_giac_ngu_sau_nam_tram_sau.mp3',
  ),
];

const SleepMeditationScript kScript1Brook432Hz = SleepMeditationScript(
  id: 'thien-buong-thu-dong-suoi-432hz',
  numberLabel: 'Kịch bản 1',
  titleVi: 'Thiền Buông Thư Bên Dòng Suối Mát',
  settingVi: 'Dòng suối trong lành giữa rừng tĩnh lặng.',
  soundscapeVi: 'Tiếng suối chảy róc rách êm dịu • Giọng nữ trầm ấm VieNeu-TTS.',
  ambientAudioAsset: 'assets/audio/brook_432hz_loop.wav',
  introAmbientSeconds: 0,
  defaultTotalDurationMinutes: 30,
  outroNoteVi:
      'Giọng đọc nhỏ dần và tắt hẳn — giữ tiếng suối chảy róc rách êm dịu đến hết phút 30.',
  parts: [
    MeditationPart(
      index: 1,
      titleVi: 'Phần 1: Kết nối hơi thở và sự nâng đỡ',
      bodyRegionVi: 'Hơi thở & Toàn thân',
      cues: [
        MeditationCue(
          id: 'p1-c1',
          partIndex: 1,
          partTitleVi: 'Phần 1: Kết nối hơi thở và sự nâng đỡ',
          textVi:
              'Hãy nằm xuống, để cơ thể bạn được nâng niu bởi mặt đất, như được ôm trọn trong vòng tay của đất mẹ dịu dàng.',
          pauseAfterSeconds: 5,
        ),
        MeditationCue(
          id: 'p1-c2',
          partIndex: 1,
          partTitleVi: 'Phần 1: Kết nối hơi thở và sự nâng đỡ',
          textVi:
              'Hãy khép nhẹ đôi mắt lại, thả lỏng từng nhịp thở, để mọi lo lắng của ngày dài tan dần như những làn khói mỏng, bay nhẹ trong gió.',
          pauseAfterSeconds: 8,
        ),
        MeditationCue(
          id: 'p1-c3',
          partIndex: 1,
          partTitleVi: 'Phần 1: Kết nối hơi thở và sự nâng đỡ',
          textVi:
              'Bây giờ, hãy để tâm trí bạn trôi nhẹ theo hơi thở. Khi hít vào, cảm nhận làn khí mát lành chảy vào lồng ngực, như một dòng suối trong lành đang tưới mát từng tế bào. Khi thở ra, hãy thả lỏng, buông thư… để mọi căng thẳng theo hơi thở mà tan biến.',
          pauseAfterSeconds: 10,
        ),
        MeditationCue(
          id: 'p1-c4',
          partIndex: 1,
          partTitleVi: 'Phần 1: Kết nối hơi thở và sự nâng đỡ',
          textVi:
              'Tôi biết ơn hơi thở này. Tôi biết ơn sự sống đang chảy tràn trong tôi.',
          pauseAfterSeconds: 10,
        ),
      ],
    ),
    MeditationPart(
      index: 2,
      titleVi: 'Phần 2: Thư giãn vùng đầu và khuôn mặt',
      bodyRegionVi: 'Trán • Mắt • Khuôn mặt',
      cues: [
        MeditationCue(
          id: 'p2-c1',
          partIndex: 2,
          partTitleVi: 'Phần 2: Thư giãn vùng đầu và khuôn mặt',
          textVi:
              'Bây giờ, hãy đưa sự chú ý về vùng trán. Cảm nhận sự mềm mại, buông lỏng từng nếp nhăn, từng nét căng trên trán. Hãy để trán bạn được buông thư, nhẹ nhàng và mềm mại như những áng mây lững lờ trôi trên bầu trời.',
          pauseAfterSeconds: 10,
        ),
        MeditationCue(
          id: 'p2-c2',
          partIndex: 2,
          partTitleVi: 'Phần 2: Thư giãn vùng đầu và khuôn mặt',
          textVi:
              'Di chuyển sự chú ý xuống đôi mắt. Hãy để đôi mắt khép lại thật êm đềm, thả lỏng, để ánh sáng của sự bình yên xoa dịu từng tế bào. Nếu đôi mắt đã mệt mỏi, hãy cho phép chúng nghỉ ngơi, trôi vào miền mơ dịu nhẹ.',
          pauseAfterSeconds: 8,
        ),
        MeditationCue(
          id: 'p2-c3',
          partIndex: 2,
          partTitleVi: 'Phần 2: Thư giãn vùng đầu và khuôn mặt',
          textVi:
              'Tôi biết ơn đôi mắt. Tôi biết ơn đôi mắt đã nhìn ngắm thế giới này.',
          pauseAfterSeconds: 10,
        ),
        MeditationCue(
          id: 'p2-c4',
          partIndex: 2,
          partTitleVi: 'Phần 2: Thư giãn vùng đầu và khuôn mặt',
          textVi:
              'Tiếp tục thả lỏng cơ mặt, buông thư đôi má, thả lỏng đôi môi, để mọi căng thẳng tan đi như giọt sương tan vào ánh bình minh.',
          pauseAfterSeconds: 8,
        ),
        MeditationCue(
          id: 'p2-c5',
          partIndex: 2,
          partTitleVi: 'Phần 2: Thư giãn vùng đầu và khuôn mặt',
          textVi:
              'Hãy để hàm dưới của bạn hơi tách nhẹ, lưỡi đặt êm ái bên trong khoang miệng. Mọi biểu cảm trên gương mặt lúc này đều được xóa nhòa, chỉ còn lại nét bình thản, dịu dàng.',
          pauseAfterSeconds: 12,
        ),
      ],
    ),
    MeditationPart(
      index: 3,
      titleVi: 'Phần 3: Buông thư vùng cổ, vai và đôi tay',
      bodyRegionVi: 'Cổ • Vai • Đôi tay',
      cues: [
        MeditationCue(
          id: 'p3-c1',
          partIndex: 3,
          partTitleVi: 'Phần 3: Buông thư vùng cổ, vai và đôi tay',
          textVi:
              'Từ khuôn mặt, hãy nhẹ nhàng dẫn sự chú ý xuống vùng cổ và gáy. Cảm nhận hơi ấm lan tỏa, làm mềm đi những nút thắt mỏi mệt tích tụ suốt cả ngày dài.',
          pauseAfterSeconds: 10,
        ),
        MeditationCue(
          id: 'p3-c2',
          partIndex: 3,
          partTitleVi: 'Phần 3: Buông thư vùng cổ, vai và đôi tay',
          textVi:
              'Di chuyển ý thức sang đôi vai. Hãy để đôi vai của bạn chìm sâu xuống mặt giường. Bạn không cần phải gồng mình gánh vác bất cứ điều gì vào lúc này nữa. Mọi trách nhiệm, mọi suy tư đều được đặt sang một bên. Đôi vai bạn trở nên nhẹ nhõm, mềm mại và hoàn toàn được nâng đỡ.',
          pauseAfterSeconds: 12,
        ),
        MeditationCue(
          id: 'p3-c3',
          partIndex: 3,
          partTitleVi: 'Phần 3: Buông thư vùng cổ, vai và đôi tay',
          textVi:
              'Tôi biết ơn đôi vai này đã luôn vững vàng nâng đỡ tôi qua bao bộn bề cuộc sống.',
          pauseAfterSeconds: 12,
        ),
        MeditationCue(
          id: 'p3-c4',
          partIndex: 3,
          partTitleVi: 'Phần 3: Buông thư vùng cổ, vai và đôi tay',
          textVi:
              'Dòng chảy thư giãn tiếp tục lan xuống hai cánh tay… qua khuỷu tay… cẳng tay… cổ tay… và chạm tới từng đầu ngón tay. Cảm nhận đôi bàn tay đang nằm yên bất động, ấm áp và thảnh thơi. Không còn nắm giữ, không còn vội vã.',
          pauseAfterSeconds: 12,
        ),
        MeditationCue(
          id: 'p3-c5',
          partIndex: 3,
          partTitleVi: 'Phần 3: Buông thư vùng cổ, vai và đôi tay',
          textVi:
              'Tôi biết ơn đôi tay đã giúp tôi làm việc, chăm sóc bản thân và kết nối yêu thương với cuộc đời.',
          pauseAfterSeconds: 15,
        ),
      ],
    ),
    MeditationPart(
      index: 4,
      titleVi: 'Phần 4: Buông thư lồng ngực, lưng và vùng bụng',
      bodyRegionVi: 'Ngực • Trái tim • Lưng • Bụng',
      cues: [
        MeditationCue(
          id: 'p4-c1',
          partIndex: 4,
          partTitleVi: 'Phần 4: Buông thư lồng ngực, lưng và vùng bụng',
          textVi:
              'Bây giờ, hãy quay trở về với vùng ngực. Cảm nhận lồng ngực bạn khẽ nâng lên khi hít vào, và hạ xuống thật êm ái khi thở ra. Hơi thở lúc này đã trở nên chậm rãi, sâu lắng và tự nhiên như nhịp sóng vỗ bờ.',
          pauseAfterSeconds: 12,
        ),
        MeditationCue(
          id: 'p4-c2',
          partIndex: 4,
          partTitleVi: 'Phần 4: Buông thư lồng ngực, lưng và vùng bụng',
          textVi:
              'Lắng nghe nhịp đập dịu dàng nơi trái tim. Trái tim bạn đã làm việc cần mẫn suốt cả ngày, và giờ là lúc nó được nghỉ ngơi trong sự bình an tuyệt đối.',
          pauseAfterSeconds: 10,
        ),
        MeditationCue(
          id: 'p4-c3',
          partIndex: 4,
          partTitleVi: 'Phần 4: Buông thư lồng ngực, lưng và vùng bụng',
          textVi:
              'Tôi biết ơn trái tim luôn đập nhịp nhàng, nuôi dưỡng sự sống và tình yêu thương bên trong tôi.',
          pauseAfterSeconds: 15,
        ),
        MeditationCue(
          id: 'p4-c4',
          partIndex: 4,
          partTitleVi: 'Phần 4: Buông thư lồng ngực, lưng và vùng bụng',
          textVi:
              'Đưa sự chú ý ra phía sau lưng. Cảm nhận toàn bộ cột sống, từ đốt sống cổ xuống tận thắt lưng, đang trải dài và áp sát vào mặt đệm êm ái. Mọi áp lực dồn nén lên lưng đều tan biến, nhường chỗ cho cảm giác vững chãi và dễ chịu.',
          pauseAfterSeconds: 12,
        ),
        MeditationCue(
          id: 'p4-c5',
          partIndex: 4,
          partTitleVi: 'Phần 4: Buông thư lồng ngực, lưng và vùng bụng',
          textVi:
              'Chuyển sự chú ý sang vùng bụng. Hãy để vùng bụng hoàn toàn mềm mại, không còn bất kỳ sự co thắt nào. Mọi cơ quan bên trong cơ thể đang được vỗ về, phục hồi và tái tạo năng lượng trong sự tĩnh lặng.',
          pauseAfterSeconds: 15,
        ),
      ],
    ),
    MeditationPart(
      index: 5,
      titleVi: 'Phần 5: Buông thư đôi chân và bàn chân',
      bodyRegionVi: 'Đùi • Bắp chân • Bàn chân',
      cues: [
        MeditationCue(
          id: 'p5-c1',
          partIndex: 5,
          partTitleVi: 'Phần 5: Buông thư đôi chân và bàn chân',
          textVi:
              'Từ vùng hông, hãy để sự thư giãn chảy tràn xuống hai đùi… qua đầu gối… bắp chân… cổ chân… và lan tỏa khắp lòng bàn chân đến tận từng ngón chân.',
          pauseAfterSeconds: 12,
        ),
        MeditationCue(
          id: 'p5-c2',
          partIndex: 5,
          partTitleVi: 'Phần 5: Buông thư đôi chân và bàn chân',
          textVi:
              'Cảm nhận đôi chân bạn đang nặng dần, chìm sâu vào sự êm ái của chiếc giường. Bao nhiêu bước đi, bao nhiêu chặng đường mệt nhoài của ngày hôm nay đều đang tan chảy vào mặt đất, trả lại sự thanh thản cho đôi chân.',
          pauseAfterSeconds: 12,
        ),
        MeditationCue(
          id: 'p5-c3',
          partIndex: 5,
          partTitleVi: 'Phần 5: Buông thư đôi chân và bàn chân',
          textVi:
              'Tôi biết ơn đôi chân đã vững bước, đưa tôi đi qua biết bao hành trình.',
          pauseAfterSeconds: 15,
        ),
      ],
    ),
    MeditationPart(
      index: 6,
      titleVi: 'Phần 6: Chìm vào giấc ngủ sâu',
      bodyRegionVi: 'An toàn & Giấc ngủ sâu',
      cues: [
        MeditationCue(
          id: 'p6-c1',
          partIndex: 6,
          partTitleVi: 'Phần 6: Chìm vào giấc ngủ sâu',
          textVi:
              'Lúc này, từ đỉnh đầu xuống tới tận các đầu ngón chân, toàn bộ cơ thể bạn là một khối thống nhất của sự bình yên, ấm áp và nhẹ bẫng.',
          pauseAfterSeconds: 10,
        ),
        MeditationCue(
          id: 'p6-c2',
          partIndex: 6,
          partTitleVi: 'Phần 6: Chìm vào giấc ngủ sâu',
          textVi:
              'Bạn đang được bảo vệ, được che chở trong không gian tĩnh mịch của màn đêm. Bên tai chỉ còn lại tiếng suối chảy róc rách, trong lành, cuốn trôi đi những suy nghĩ cuối cùng còn sót lại trong tâm trí.',
          pauseAfterSeconds: 12,
        ),
        MeditationCue(
          id: 'p6-c3',
          partIndex: 6,
          partTitleVi: 'Phần 6: Chìm vào giấc ngủ sâu',
          textVi:
              'Không cần cố gắng ngủ… cũng không cần điều khiển hơi thở nữa… Hãy cứ để cơ thể tự do trôi bồng bềnh trên dòng suối bình yên ấy…',
          pauseAfterSeconds: 15,
        ),
        MeditationCue(
          id: 'p6-c4',
          partIndex: 6,
          partTitleVi: 'Phần 6: Chìm vào giấc ngủ sâu',
          textVi:
              'Tôi an toàn. Tôi bình yên. Tôi xứng đáng có một giấc ngủ sâu và trọn vẹn.',
          pauseAfterSeconds: 15,
        ),
        MeditationCue(
          id: 'p6-c5',
          partIndex: 6,
          partTitleVi: 'Phần 6: Chìm vào giấc ngủ sâu',
          textVi:
              'Hãy thả lỏng… buông thư… và chìm sâu vào giấc ngủ ngon…',
          pauseAfterSeconds: 0,
          isFinalFadeOut: true,
        ),
      ],
    ),
  ],
);
