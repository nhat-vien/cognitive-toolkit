/**
 * Haven — Guided Sleep Body-Scan Relaxation ("Thiền Buông Thư") Engine
 * Script 1: THIỀN BUÔNG THƯ BÊN DÒNG SUỐI MÁT
 * Ambient Audio: Synthesized Forest Brook (Tiếng suối chảy róc rách) + 432Hz Harmonic Soundscape
 * Voice Guidance: Exact Vietnamese sentences with [Nghỉ Xs] pause timings + 30-minute sleep ambient timer.
 */

export interface MeditationCue {
  readonly id: string;
  readonly partIndex: number;
  readonly partTitleVi: string;
  readonly textVi: string;
  readonly pauseAfterSeconds: number;
  readonly isFinalFadeOut?: boolean;
}

export interface MeditationPart {
  readonly index: number;
  readonly titleVi: string;
  readonly bodyRegionVi: string;
  readonly cues: readonly MeditationCue[];
}

export interface SleepMeditationScript {
  readonly id: string;
  readonly numberLabel: string;
  readonly titleVi: string;
  readonly settingVi: string;
  readonly soundscapeVi: string;
  readonly introAmbientSeconds: number;
  readonly defaultTotalDurationMinutes: number;
  readonly outroNoteVi: string;
  readonly parts: readonly MeditationPart[];
}

export const SCRIPT_1_BROOK_432HZ: SleepMeditationScript = {
  id: 'thien-buong-thu-dong-suoi-432hz',
  numberLabel: 'Kịch bản 1',
  titleVi: 'Thiền Buông Thư Bên Dòng Suối Mát',
  settingVi: 'Dòng suối trong lành giữa rừng tĩnh lặng.',
  soundscapeVi: 'Tiếng suối chảy róc rách êm dịu • Giọng nữ trầm ấm VieNeu-TTS.',
  introAmbientSeconds: 0,
  defaultTotalDurationMinutes: 30,
  outroNoteVi: 'Giọng đọc nhỏ dần và tắt hẳn — giữ tiếng suối chảy róc rách êm dịu đến hết phút 30.',
  parts: [
    {
      index: 1,
      titleVi: 'Phần 1: Kết nối hơi thở và sự nâng đỡ',
      bodyRegionVi: 'Hơi thở & Toàn thân',
      cues: [
        {
          id: 'p1-c1',
          partIndex: 1,
          partTitleVi: 'Phần 1: Kết nối hơi thở và sự nâng đỡ',
          textVi:
            'Hãy nằm xuống, để cơ thể bạn được nâng niu bởi mặt đất, như được ôm trọn trong vòng tay của đất mẹ dịu dàng.',
          pauseAfterSeconds: 5,
        },
        {
          id: 'p1-c2',
          partIndex: 1,
          partTitleVi: 'Phần 1: Kết nối hơi thở và sự nâng đỡ',
          textVi:
            'Hãy khép nhẹ đôi mắt lại, thả lỏng từng nhịp thở, để mọi lo lắng của ngày dài tan dần như những làn khói mỏng, bay nhẹ trong gió.',
          pauseAfterSeconds: 8,
        },
        {
          id: 'p1-c3',
          partIndex: 1,
          partTitleVi: 'Phần 1: Kết nối hơi thở và sự nâng đỡ',
          textVi:
            'Bây giờ, hãy để tâm trí bạn trôi nhẹ theo hơi thở. Khi hít vào, cảm nhận làn khí mát lành chảy vào lồng ngực, như một dòng suối trong lành đang tưới mát từng tế bào. Khi thở ra, hãy thả lỏng, buông thư… để mọi căng thẳng theo hơi thở mà tan biến.',
          pauseAfterSeconds: 10,
        },
        {
          id: 'p1-c4',
          partIndex: 1,
          partTitleVi: 'Phần 1: Kết nối hơi thở và sự nâng đỡ',
          textVi: 'Tôi biết ơn hơi thở này. Tôi biết ơn sự sống đang chảy tràn trong tôi.',
          pauseAfterSeconds: 10,
        },
      ],
    },
    {
      index: 2,
      titleVi: 'Phần 2: Thư giãn vùng đầu và khuôn mặt',
      bodyRegionVi: 'Trán • Mắt • Khuôn mặt',
      cues: [
        {
          id: 'p2-c1',
          partIndex: 2,
          partTitleVi: 'Phần 2: Thư giãn vùng đầu và khuôn mặt',
          textVi:
            'Bây giờ, hãy đưa sự chú ý về vùng trán. Cảm nhận sự mềm mại, buông lỏng từng nếp nhăn, từng nét căng trên trán. Hãy để trán bạn được buông thư, nhẹ nhàng và mềm mại như những áng mây lững lờ trôi trên bầu trời.',
          pauseAfterSeconds: 10,
        },
        {
          id: 'p2-c2',
          partIndex: 2,
          partTitleVi: 'Phần 2: Thư giãn vùng đầu và khuôn mặt',
          textVi:
            'Di chuyển sự chú ý xuống đôi mắt. Hãy để đôi mắt khép lại thật êm đềm, thả lỏng, để ánh sáng của sự bình yên xoa dịu từng tế bào. Nếu đôi mắt đã mệt mỏi, hãy cho phép chúng nghỉ ngơi, trôi vào miền mơ dịu nhẹ.',
          pauseAfterSeconds: 8,
        },
        {
          id: 'p2-c3',
          partIndex: 2,
          partTitleVi: 'Phần 2: Thư giãn vùng đầu và khuôn mặt',
          textVi: 'Tôi biết ơn đôi mắt. Tôi biết ơn đôi mắt đã nhìn ngắm thế giới này.',
          pauseAfterSeconds: 10,
        },
        {
          id: 'p2-c4',
          partIndex: 2,
          partTitleVi: 'Phần 2: Thư giãn vùng đầu và khuôn mặt',
          textVi:
            'Tiếp tục thả lỏng cơ mặt, buông thư đôi má, thả lỏng đôi môi, để mọi căng thẳng tan đi như giọt sương tan vào ánh bình minh.',
          pauseAfterSeconds: 8,
        },
        {
          id: 'p2-c5',
          partIndex: 2,
          partTitleVi: 'Phần 2: Thư giãn vùng đầu và khuôn mặt',
          textVi:
            'Hãy để hàm dưới của bạn hơi tách nhẹ, lưỡi đặt êm ái bên trong khoang miệng. Mọi biểu cảm trên gương mặt lúc này đều được xóa nhòa, chỉ còn lại nét bình thản, dịu dàng.',
          pauseAfterSeconds: 12,
        },
      ],
    },
    {
      index: 3,
      titleVi: 'Phần 3: Buông thư vùng cổ, vai và đôi tay',
      bodyRegionVi: 'Cổ • Vai • Đôi tay',
      cues: [
        {
          id: 'p3-c1',
          partIndex: 3,
          partTitleVi: 'Phần 3: Buông thư vùng cổ, vai và đôi tay',
          textVi:
            'Từ khuôn mặt, hãy nhẹ nhàng dẫn sự chú ý xuống vùng cổ và gáy. Cảm nhận hơi ấm lan tỏa, làm mềm đi những nút thắt mỏi mệt tích tụ suốt cả ngày dài.',
          pauseAfterSeconds: 10,
        },
        {
          id: 'p3-c2',
          partIndex: 3,
          partTitleVi: 'Phần 3: Buông thư vùng cổ, vai và đôi tay',
          textVi:
            'Di chuyển ý thức sang đôi vai. Hãy để đôi vai của bạn chìm sâu xuống mặt giường. Bạn không cần phải gồng mình gánh vác bất cứ điều gì vào lúc này nữa. Mọi trách nhiệm, mọi suy tư đều được đặt sang một bên. Đôi vai bạn trở nên nhẹ nhõm, mềm mại và hoàn toàn được nâng đỡ.',
          pauseAfterSeconds: 12,
        },
        {
          id: 'p3-c3',
          partIndex: 3,
          partTitleVi: 'Phần 3: Buông thư vùng cổ, vai và đôi tay',
          textVi: 'Tôi biết ơn đôi vai này đã luôn vững vàng nâng đỡ tôi qua bao bộn bề cuộc sống.',
          pauseAfterSeconds: 12,
        },
        {
          id: 'p3-c4',
          partIndex: 3,
          partTitleVi: 'Phần 3: Buông thư vùng cổ, vai và đôi tay',
          textVi:
            'Dòng chảy thư giãn tiếp tục lan xuống hai cánh tay… qua khuỷu tay… cẳng tay… cổ tay… và chạm tới từng đầu ngón tay. Cảm nhận đôi bàn tay đang nằm yên bất động, ấm áp và thảnh thơi. Không còn nắm giữ, không còn vội vã.',
          pauseAfterSeconds: 12,
        },
        {
          id: 'p3-c5',
          partIndex: 3,
          partTitleVi: 'Phần 3: Buông thư vùng cổ, vai và đôi tay',
          textVi: 'Tôi biết ơn đôi tay đã giúp tôi làm việc, chăm sóc bản thân và kết nối yêu thương với cuộc đời.',
          pauseAfterSeconds: 15,
        },
      ],
    },
    {
      index: 4,
      titleVi: 'Phần 4: Buông thư lồng ngực, lưng và vùng bụng',
      bodyRegionVi: 'Ngực • Trái tim • Lưng • Bụng',
      cues: [
        {
          id: 'p4-c1',
          partIndex: 4,
          partTitleVi: 'Phần 4: Buông thư lồng ngực, lưng và vùng bụng',
          textVi:
            'Bây giờ, hãy quay trở về với vùng ngực. Cảm nhận lồng ngực bạn khẽ nâng lên khi hít vào, và hạ xuống thật êm ái khi thở ra. Hơi thở lúc này đã trở nên chậm rãi, sâu lắng và tự nhiên như nhịp sóng vỗ bờ.',
          pauseAfterSeconds: 12,
        },
        {
          id: 'p4-c2',
          partIndex: 4,
          partTitleVi: 'Phần 4: Buông thư lồng ngực, lưng và vùng bụng',
          textVi:
            'Lắng nghe nhịp đập dịu dàng nơi trái tim. Trái tim bạn đã làm việc cần mẫn suốt cả ngày, và giờ là lúc nó được nghỉ ngơi trong sự bình an tuyệt đối.',
          pauseAfterSeconds: 10,
        },
        {
          id: 'p4-c3',
          partIndex: 4,
          partTitleVi: 'Phần 4: Buông thư lồng ngực, lưng và vùng bụng',
          textVi: 'Tôi biết ơn trái tim luôn đập nhịp nhàng, nuôi dưỡng sự sống và tình yêu thương bên trong tôi.',
          pauseAfterSeconds: 15,
        },
        {
          id: 'p4-c4',
          partIndex: 4,
          partTitleVi: 'Phần 4: Buông thư lồng ngực, lưng và vùng bụng',
          textVi:
            'Đưa sự chú ý ra phía sau lưng. Cảm nhận toàn bộ cột sống, từ đốt sống cổ xuống tận thắt lưng, đang trải dài và áp sát vào mặt đệm êm ái. Mọi áp lực dồn nén lên lưng đều tan biến, nhường chỗ cho cảm giác vững chãi và dễ chịu.',
          pauseAfterSeconds: 12,
        },
        {
          id: 'p4-c5',
          partIndex: 4,
          partTitleVi: 'Phần 4: Buông thư lồng ngực, lưng và vùng bụng',
          textVi:
            'Chuyển sự chú ý sang vùng bụng. Hãy để vùng bụng hoàn toàn mềm mại, không còn bất kỳ sự co thắt nào. Mọi cơ quan bên trong cơ thể đang được vỗ về, phục hồi và tái tạo năng lượng trong sự tĩnh lặng.',
          pauseAfterSeconds: 15,
        },
      ],
    },
    {
      index: 5,
      titleVi: 'Phần 5: Buông thư đôi chân và bàn chân',
      bodyRegionVi: 'Đùi • Bắp chân • Bàn chân',
      cues: [
        {
          id: 'p5-c1',
          partIndex: 5,
          partTitleVi: 'Phần 5: Buông thư đôi chân và bàn chân',
          textVi:
            'Từ vùng hông, hãy để sự thư giãn chảy tràn xuống hai đùi… qua đầu gối… bắp chân… cổ chân… và lan tỏa khắp lòng bàn chân đến tận từng ngón chân.',
          pauseAfterSeconds: 12,
        },
        {
          id: 'p5-c2',
          partIndex: 5,
          partTitleVi: 'Phần 5: Buông thư đôi chân và bàn chân',
          textVi:
            'Cảm nhận đôi chân bạn đang nặng dần, chìm sâu vào sự êm ái của chiếc giường. Bao nhiêu bước đi, bao nhiêu chặng đường mệt nhoài của ngày hôm nay đều đang tan chảy vào mặt đất, trả lại sự thanh thản cho đôi chân.',
          pauseAfterSeconds: 12,
        },
        {
          id: 'p5-c3',
          partIndex: 5,
          partTitleVi: 'Phần 5: Buông thư đôi chân và bàn chân',
          textVi: 'Tôi biết ơn đôi chân đã vững bước, đưa tôi đi qua biết bao hành trình.',
          pauseAfterSeconds: 15,
        },
      ],
    },
    {
      index: 6,
      titleVi: 'Phần 6: Chìm vào giấc ngủ sâu',
      bodyRegionVi: 'An toàn & Giấc ngủ sâu',
      cues: [
        {
          id: 'p6-c1',
          partIndex: 6,
          partTitleVi: 'Phần 6: Chìm vào giấc ngủ sâu',
          textVi:
            'Lúc này, từ đỉnh đầu xuống tới tận các đầu ngón chân, toàn bộ cơ thể bạn là một khối thống nhất của sự bình yên, ấm áp và nhẹ bẫng.',
          pauseAfterSeconds: 10,
        },
        {
          id: 'p6-c2',
          partIndex: 6,
          partTitleVi: 'Phần 6: Chìm vào giấc ngủ sâu',
          textVi:
            'Bạn đang được bảo vệ, được che chở trong không gian tĩnh mịch của màn đêm. Bên tai chỉ còn lại tiếng suối chảy róc rách, trong lành, cuốn trôi đi những suy nghĩ cuối cùng còn sót lại trong tâm trí.',
          pauseAfterSeconds: 12,
        },
        {
          id: 'p6-c3',
          partIndex: 6,
          partTitleVi: 'Phần 6: Chìm vào giấc ngủ sâu',
          textVi:
            'Không cần cố gắng ngủ… cũng không cần điều khiển hơi thở nữa… Hãy cứ để cơ thể tự do trôi bồng bềnh trên dòng suối bình yên ấy…',
          pauseAfterSeconds: 15,
        },
        {
          id: 'p6-c4',
          partIndex: 6,
          partTitleVi: 'Phần 6: Chìm vào giấc ngủ sâu',
          textVi: 'Tôi an toàn. Tôi bình yên. Tôi xứng đáng có một giấc ngủ sâu và trọn vẹn.',
          pauseAfterSeconds: 15,
        },
        {
          id: 'p6-c5',
          partIndex: 6,
          partTitleVi: 'Phần 6: Chìm vào giấc ngủ sâu',
          textVi: 'Hãy thả lỏng… buông thư… và chìm sâu vào giấc ngủ ngon…',
          pauseAfterSeconds: 0,
          isFinalFadeOut: true,
        },
      ],
    },
  ],
};

export interface StudioMeditationTrack {
  readonly id: string;
  readonly trackNumber: number;
  readonly titleVi: string;
  readonly voiceNameVi: string;
  readonly voiceStyleBadgeVi: string;
  readonly descriptionVi: string;
  readonly durationSeconds: number;
  readonly audioUrl: string;
}

export const STUDIO_MEDITATION_TRACKS: readonly StudioMeditationTrack[] = [
  {
    id: 'voice-1-suoi-mat',
    trackNumber: 1,
    titleVi: 'Bài 1: Thiền Buông Thư Bên Dòng Suối Mát',
    voiceNameVi: 'Giọng Nam Trầm Ấm (DgNguyen)',
    voiceStyleBadgeVi: 'Nam · Miền Bắc · Trầm ấm',
    descriptionVi:
      'Hãy nằm xuống để cơ thể được nâng niu bởi đất mẹ dịu dàng, thả lỏng từng nhịp thở cho mọi lo lắng tan dần.',
    durationSeconds: 264, // 04:24
    audioUrl: '/audio/meditation/voice_1_suoi_mat_nam_tram.mp3',
  },
  {
    id: 'voice-2-haven-got-rua',
    trackNumber: 2,
    titleVi: 'Bài 2: Thiền Buông Thư Cùng Haven — Gột Rửa Phiền Lo',
    voiceNameVi: 'Giọng Nữ Dịu Ấm (Vita)',
    voiceStyleBadgeVi: 'Nữ · Dịu dàng · Ấm áp',
    descriptionVi:
      'Thiết kế dành riêng cho bạn để gột rửa mọi phiền lo và vỗ về tâm trí sau một ngày dài vất vả.',
    durationSeconds: 359, // 05:59
    audioUrl: '/audio/meditation/voice_2_haven_got_rua_phien_lo_nu_am.mp3',
  },
  {
    id: 'voice-3-giac-ngu-sau',
    trackNumber: 3,
    titleVi: 'Bài 3: Thiền Buông Thư Giấc Ngủ Sâu — Ôm Trọn Bình Yên',
    voiceNameVi: 'Giọng Nam Trầm Sâu (DgNguyen)',
    voiceStyleBadgeVi: 'Nam · Miền Bắc · Trầm sâu',
    descriptionVi:
      'Thả lỏng toàn thân trên chiếc giường êm ái, dẫn dắt nhịp chậm rãi giúp bạn dễ dàng chìm vào giấc ngủ sâu.',
    durationSeconds: 363, // 06:03
    audioUrl: '/audio/meditation/voice_3_giac_ngu_sau_nam_tram_sau.mp3',
  },
];

export const SLEEP_MEDITATION_SCRIPTS: readonly SleepMeditationScript[] = [SCRIPT_1_BROOK_432HZ];

export function flattenMeditationCues(script: SleepMeditationScript): MeditationCue[] {
  return script.parts.flatMap((p) => [...p.cues]);
}

export function computeScriptPauseTotalSeconds(script: SleepMeditationScript): number {
  return flattenMeditationCues(script).reduce((acc, c) => acc + c.pauseAfterSeconds, 0);
}

export function formatMeditationClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * 100% Offline Web Audio API Engine for Sleep Meditation:
 * Layer 1: Forest Brook / Flowing Stream (pink/brown noise + dual modulated bandpass filters)
 * Layer 2: 432Hz Harmonic Drone (432Hz sine + 216Hz sub-octave + subtle 648Hz fifth + breathing LFO)
 */
export class SleepMeditationAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private brookGain: GainNode | null = null;
  private freq432Gain: GainNode | null = null;
  private brookSource: AudioBufferSourceNode | null = null;
  private osc432: OscillatorNode | null = null;
  private osc216: OscillatorNode | null = null;
  private osc648: OscillatorNode | null = null;
  private lfoWater: OscillatorNode | null = null;
  private lfoBreath: OscillatorNode | null = null;
  private playing = false;
  private brookVolume = 0.45;
  private freq432Volume = 0.30;

  public start(options?: {
    brookVolume?: number;
    freq432Volume?: number;
  }): { started: boolean; mode: 'web-audio-api' | 'headless-simulated' } {
    if (options?.brookVolume !== undefined) {
      this.brookVolume = Math.max(0, Math.min(1, options.brookVolume));
    }
    if (options?.freq432Volume !== undefined) {
      this.freq432Volume = Math.max(0, Math.min(1, options.freq432Volume));
    }

    if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') {
      this.playing = true;
      return { started: true, mode: 'headless-simulated' };
    }

    if (this.playing) {
      return { started: true, mode: 'web-audio-api' };
    }

    try {
      if (!this.ctx) {
        this.ctx = new window.AudioContext();
      }
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }

      const ctx = this.ctx;
      const now = ctx.currentTime;

      this.masterGain = ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.0001, now);
      this.masterGain.gain.exponentialRampToValueAtTime(0.85, now + 2.5);
      this.masterGain.connect(ctx.destination);

      // --- LAYER 1: Synthesized Forest Brook (Tiếng suối chảy róc rách) ---
      const bufferSeconds = 6;
      const bufferLength = ctx.sampleRate * bufferSeconds;
      const noiseBuffer = ctx.createBuffer(2, bufferLength, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const output = noiseBuffer.getChannelData(ch);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferLength; i++) {
          const white = Math.random() * 2 - 1;
          // Paul Kellet's pink noise filter for warm organic water texture
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.06;
          b6 = white * 0.115926;
        }
      }

      this.brookSource = ctx.createBufferSource();
      this.brookSource.buffer = noiseBuffer;
      this.brookSource.loop = true;

      const brookBandpass = ctx.createBiquadFilter();
      brookBandpass.type = 'bandpass';
      brookBandpass.frequency.setValueAtTime(640, now);
      brookBandpass.Q.setValueAtTime(0.6, now);

      const brookLowpass = ctx.createBiquadFilter();
      brookLowpass.type = 'lowpass';
      brookLowpass.frequency.setValueAtTime(1400, now);

      // Slow organic trickle modulation on brook filter
      this.lfoWater = ctx.createOscillator();
      this.lfoWater.type = 'sine';
      this.lfoWater.frequency.setValueAtTime(0.16, now);
      const lfoWaterDepth = ctx.createGain();
      lfoWaterDepth.gain.setValueAtTime(200, now);
      this.lfoWater.connect(lfoWaterDepth);
      lfoWaterDepth.connect(brookBandpass.frequency);

      this.brookGain = ctx.createGain();
      this.brookGain.gain.setValueAtTime(this.brookVolume * 0.80, now);

      this.brookSource.connect(brookBandpass);
      brookBandpass.connect(brookLowpass);
      brookLowpass.connect(this.brookGain);
      this.brookGain.connect(this.masterGain);

      this.brookSource.start(now);
      this.lfoWater.start(now);

      // --- LAYER 2: Warm, Soft 432Hz Harmonic Undertone (default 30%, lowpass 520Hz, zero piercing overtone) ---
      const padFilter = ctx.createBiquadFilter();
      padFilter.type = 'lowpass';
      padFilter.frequency.setValueAtTime(520, now);

      this.freq432Gain = ctx.createGain();
      this.freq432Gain.gain.setValueAtTime(this.freq432Volume * 0.045, now);

      this.lfoBreath = ctx.createOscillator();
      this.lfoBreath.type = 'sine';
      this.lfoBreath.frequency.setValueAtTime(0.08, now);
      const lfoBreathDepth = ctx.createGain();
      lfoBreathDepth.gain.setValueAtTime(0.008, now);
      this.lfoBreath.connect(lfoBreathDepth);
      lfoBreathDepth.connect(this.freq432Gain.gain);

      this.osc432 = ctx.createOscillator();
      this.osc432.type = 'sine';
      this.osc432.frequency.setValueAtTime(432, now);
      const main432Gain = ctx.createGain();
      main432Gain.gain.setValueAtTime(0.62, now);

      this.osc216 = ctx.createOscillator();
      this.osc216.type = 'sine';
      this.osc216.frequency.setValueAtTime(216, now);
      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.75, now);

      this.osc648 = null;

      this.osc432.connect(main432Gain);
      main432Gain.connect(padFilter);
      this.osc216.connect(subGain);
      subGain.connect(padFilter);

      padFilter.connect(this.freq432Gain);
      this.freq432Gain.connect(this.masterGain);

      this.osc432.start(now);
      this.osc216.start(now);
      this.lfoBreath.start(now);

      this.playing = true;
      return { started: true, mode: 'web-audio-api' };
    } catch {
      this.playing = true;
      return { started: true, mode: 'headless-simulated' };
    }
  }

  public setBrookVolume(volume: number): void {
    this.brookVolume = Math.max(0, Math.min(1, volume));
    if (this.ctx && this.brookGain) {
      this.brookGain.gain.setTargetAtTime(this.brookVolume * 0.80, this.ctx.currentTime, 0.15);
    }
  }

  public setFreq432Volume(volume: number): void {
    this.freq432Volume = Math.max(0, Math.min(1, volume));
    if (this.ctx && this.freq432Gain) {
      this.freq432Gain.gain.setTargetAtTime(this.freq432Volume * 0.045, this.ctx.currentTime, 0.15);
    }
  }

  public stop(fadeOutSeconds = 1.2): void {
    this.playing = false;
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      if (this.masterGain) {
        this.masterGain.gain.setTargetAtTime(0.0001, now, Math.max(0.1, fadeOutSeconds / 4));
      }
      const toStop = [
        this.brookSource,
        this.osc432,
        this.osc216,
        this.osc648,
        this.lfoWater,
        this.lfoBreath,
      ];
      this.brookSource = null;
      this.osc432 = null;
      this.osc216 = null;
      this.osc648 = null;
      this.lfoWater = null;
      this.lfoBreath = null;

      setTimeout(() => {
        for (const node of toStop) {
          try {
            node?.stop();
            node?.disconnect();
          } catch {
            // ignore cleanup errors
          }
        }
      }, Math.round(fadeOutSeconds * 1000) + 150);
    } catch {
      // ignore
    }
  }

  public isPlaying(): boolean {
    return this.playing;
  }
}
