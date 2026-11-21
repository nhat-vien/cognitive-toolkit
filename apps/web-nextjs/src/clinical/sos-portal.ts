import type { IntensityScore, SessionOutcome } from './types.ts';

/**
 * 2. 1-Tap DBT SOS Portal Engine
 * - Fullscreen Paced Breathing (4-6 and 4-7-8) with visual breathing circle & Web Audio API soothing ambient tone generator (100% offline, zero external MP3 dependencies!)
 * - DBT TIPP guided wizard with Mandatory Medical Exclusion Screen before Cold Water
 *   (blocks cold water and redirects to Paced Breathing if heart condition, beta-blockers, slow HR, cold allergy, or eating disorder is checked)
 * - 5-4-3-2-1 Grounding interactive stepper & DBT STOP skill
 * - Safety circuit breaker after 2 TIPP skills if intensity remains >= 7/10
 */

export type BreathingPatternId = '4-6' | '4-7-8';

export interface BreathingPatternSpec {
  id: BreathingPatternId;
  nameVi: string;
  nameEn: string;
  inhaleSeconds: number;
  holdSeconds: number;
  exhaleSeconds: number;
  totalCycleSeconds: number;
  clinicalRationaleVi: string;
  clinicalRationaleEn: string;
}

export const BREATHING_PATTERNS: Record<BreathingPatternId, BreathingPatternSpec> = {
  '4-6': {
    id: '4-6',
    nameVi: 'Thở Dẫn Nhịp DBT TIPP (Hít 4s — Thở ra 6s)',
    nameEn: 'DBT TIPP Paced Breathing (Inhale 4s — Exhale 6s)',
    inhaleSeconds: 4,
    holdSeconds: 0,
    exhaleSeconds: 6,
    totalCycleSeconds: 10,
    clinicalRationaleVi:
      'Nhịp thở ra (6s) dài hơn nhịp hít vào (4s) kích hoạt dây thần kinh phế vị và hệ đối giao cảm, làm chậm nhịp tim.',
    clinicalRationaleEn:
      'Exhale (6s) longer than inhale (4s) stimulates the vagus nerve and parasympathetic nervous system.',
  },
  '4-7-8': {
    id: '4-7-8',
    nameVi: 'Thở Thư Giãn Sâu 4-7-8 (Hít 4s — Giữ 7s — Thở ra 8s)',
    nameEn: '4-7-8 Deep Parasympathetic Breathing (4s — 7s — 8s)',
    inhaleSeconds: 4,
    holdSeconds: 7,
    exhaleSeconds: 8,
    totalCycleSeconds: 19,
    clinicalRationaleVi:
      'Giúp cắt cơn hoảng loạn và hạ nhiệt kích thích thần kinh trước khi ngủ.',
    clinicalRationaleEn:
      'Rapidly down-regulates autonomic arousal during acute anxiety or pre-sleep restlessness.',
  },
};

export interface BreathingPhaseFrame {
  phase: 'inhale' | 'hold' | 'exhale';
  phaseRemainingSeconds: number;
  circleScale: number; // 1.0 to 1.65 for visual circle animation
  instructionVi: string;
  instructionEn: string;
  targetFrequencyHz: number; // For Web Audio API soothing tone modulation
}

export function computeBreathingFrame(
  patternId: BreathingPatternId,
  elapsedSecondsInCycle: number
): BreathingPhaseFrame {
  const spec = BREATHING_PATTERNS[patternId];
  const t = ((elapsedSecondsInCycle % spec.totalCycleSeconds) + spec.totalCycleSeconds) % spec.totalCycleSeconds;

  if (t < spec.inhaleSeconds) {
    const progress = t / spec.inhaleSeconds;
    return {
      phase: 'inhale',
      phaseRemainingSeconds: Math.ceil(spec.inhaleSeconds - t),
      circleScale: Number((1.0 + progress * 0.6).toFixed(3)),
      instructionVi: 'Hít vào nhẹ nhàng bằng mũi...',
      instructionEn: 'Inhale gently through your nose...',
      targetFrequencyHz: 174 + progress * 46, // Warm harmonic rise 174Hz -> 220Hz
    };
  }

  if (spec.holdSeconds > 0 && t < spec.inhaleSeconds + spec.holdSeconds) {
    const holdElapsed = t - spec.inhaleSeconds;
    return {
      phase: 'hold',
      phaseRemainingSeconds: Math.ceil(spec.holdSeconds - holdElapsed),
      circleScale: 1.6,
      instructionVi: 'Giữ hơi thở êm dịu...',
      instructionEn: 'Hold gently without straining...',
      targetFrequencyHz: 220,
    };
  }

  const exhaleElapsed = t - spec.inhaleSeconds - spec.holdSeconds;
  const progress = exhaleElapsed / spec.exhaleSeconds;
  return {
    phase: 'exhale',
    phaseRemainingSeconds: Math.ceil(spec.exhaleSeconds - exhaleElapsed),
    circleScale: Number((1.6 - progress * 0.6).toFixed(3)),
    instructionVi: 'Thở ra thật chậm qua môi mím nhẹ (dài hơn hít vào)...',
    instructionEn: 'Exhale slowly through pursed lips (longer than inhale)...',
    targetFrequencyHz: 220 - progress * 46, // Soothing descent 220Hz -> 174Hz
  };
}

/**
 * 100% Offline Web Audio API Soothing Ambient Tone Generator (Zero external MP3 dependencies!)
 * Synthesizes a warm 174Hz/220Hz harmonic drone + low-pass filtered soothing soundscape.
 */
export class OfflineAmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private oscPrimary: OscillatorNode | null = null;
  private oscSub: OscillatorNode | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying = false;

  public start(initialFreqHz = 174): { started: boolean; mode: 'web-audio-api' | 'headless-simulated' } {
    if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') {
      this.isPlaying = true;
      return { started: true, mode: 'headless-simulated' };
    }

    try {
      if (!this.ctx) {
        this.ctx = new window.AudioContext();
      }
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.001, now);
      this.masterGain.gain.exponentialRampToValueAtTime(0.12, now + 1.2);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, now);

      this.oscPrimary = this.ctx.createOscillator();
      this.oscPrimary.type = 'sine';
      this.oscPrimary.frequency.setValueAtTime(initialFreqHz, now);

      this.oscSub = this.ctx.createOscillator();
      this.oscSub.type = 'triangle';
      this.oscSub.frequency.setValueAtTime(initialFreqHz / 2, now);

      this.oscPrimary.connect(filter);
      this.oscSub.connect(filter);
      filter.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.oscPrimary.start();
      this.oscSub.start();
      this.isPlaying = true;
      return { started: true, mode: 'web-audio-api' };
    } catch {
      this.isPlaying = true;
      return { started: true, mode: 'headless-simulated' };
    }
  }

  public modulateFrequency(targetFreqHz: number): void {
    if (!this.isPlaying || !this.ctx || !this.oscPrimary || !this.oscSub) return;
    const now = this.ctx.currentTime;
    this.oscPrimary.frequency.setTargetAtTime(targetFreqHz, now, 0.3);
    this.oscSub.frequency.setTargetAtTime(targetFreqHz / 2, now, 0.3);
  }

  public stop(): void {
    this.isPlaying = false;
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      if (this.masterGain) {
        this.masterGain.gain.setTargetAtTime(0.0001, now, 0.2);
      }
      setTimeout(() => {
        try {
          this.oscPrimary?.stop();
          this.oscSub?.stop();
          this.oscPrimary?.disconnect();
          this.oscSub?.disconnect();
        } catch {
          // ignore cleanup errors
        }
      }, 250);
    } catch {
      // ignore
    }
  }

  public getStatus(): boolean {
    return this.isPlaying;
  }
}

/**
 * DBT TIPP — Mandatory Medical Exclusion Screen before Cold Water (T - Temperature)
 */
export interface TippMedicalExclusionInput {
  hasHeartCondition: boolean;
  takesBetaBlockers: boolean;
  hasSlowHeartRateOrPacemaker: boolean;
  hasColdAllergyOrRaynauds: boolean;
  hasEatingDisorder: boolean;
  isUnsureOrPregnantWithComplications?: boolean;
}

export interface TippMedicalExclusionDecision {
  coldWaterAllowed: boolean;
  activeSkill: 'temperature-cold-water' | 'paced-breathing';
  redirectedToPacedBreathing: boolean;
  exclusionReasons: string[];
  guidanceVi: string;
  guidanceEn: string;
  timerSeconds: number;
}

export function evaluateTippColdWaterSafety(
  input: TippMedicalExclusionInput
): TippMedicalExclusionDecision {
  const reasons: string[] = [];
  if (input.hasHeartCondition) reasons.push('Bệnh tim mạch / Heart condition');
  if (input.takesBetaBlockers) reasons.push('Đang dùng thuốc chẹn beta / Taking beta-blockers');
  if (input.hasSlowHeartRateOrPacemaker) reasons.push('Nhịp tim chậm / Slow heart rate (bradycardia)');
  if (input.hasColdAllergyOrRaynauds) reasons.push('Dị ứng lạnh / Cold allergy (Raynaud/urticaria)');
  if (input.hasEatingDisorder) reasons.push('Rối loạn ăn uống / Eating disorder');
  if (input.isUnsureOrPregnantWithComplications) reasons.push('Không chắc chắn hoặc thai kỳ cần lưu ý / Unsure or medical precaution');

  if (reasons.length > 0) {
    return {
      coldWaterAllowed: false,
      activeSkill: 'paced-breathing',
      redirectedToPacedBreathing: true,
      exclusionReasons: reasons,
      guidanceVi:
        'An toàn Y khoa: Phản xạ lặn bằng nước lạnh có thể làm giảm nhịp tim đột ngột và KHÔNG an toàn với tình trạng bạn vừa chọn. Hệ thống đã khóa bước Nước lạnh và tự động chuyển sang Thở Dẫn Nhịp (Paced Breathing 4-6).',
      guidanceEn:
        'Medical Safety Gate: Cold water triggers the mammalian dive reflex (rapid vagal bradycardia) and is contraindicated for your checked items. Cold Water is blocked; automatically redirecting to Paced Breathing (4-6).',
      timerSeconds: 60,
    };
  }

  return {
    coldWaterAllowed: true,
    activeSkill: 'temperature-cold-water',
    redirectedToPacedBreathing: false,
    exclusionReasons: [],
    guidanceVi:
      'Đã qua sàng lọc y khoa: Hãy cúi người nhẹ, nín thở và áp khăn lạnh / túi chườm lạnh hoặc nước mát lên vùng mắt và hai gò má trong 15–30 giây để kích hoạt Phản xạ Lặn giúp hạ nhịp tim tức thì. (Không ngâm toàn thân trong bồn đá).',
    guidanceEn:
      'Medical screen cleared: Lean forward slightly, hold your breath, and apply cool water or a cold pack to your eyes and upper cheeks for 15–30 seconds to activate the Mammalian Dive Reflex. (Never use full-body ice baths).',
    timerSeconds: 25,
  };
}

export interface TippSessionEvaluation {
  skillsAttemptedCount: number;
  preIntensity: IntensityScore;
  postIntensity: IntensityScore;
  shouldStopLoop: boolean;
  suggestSecondSkill: boolean;
  outcome: SessionOutcome;
  messageVi: string;
  messageEn: string;
}

export function evaluateTippPostSkill(params: {
  skillsAttemptedCount: number;
  preIntensity: IntensityScore;
  postIntensity: IntensityScore;
}): TippSessionEvaluation {
  if (params.postIntensity <= 6) {
    return {
      ...params,
      shouldStopLoop: true,
      suggestSecondSkill: false,
      outcome: 'completed',
      messageVi: `Cường độ căng thẳng đã hạ từ ${params.preIntensity}/10 xuống ${params.postIntensity}/10. Cơ thể bạn đã qua cơn ngập lụt sinh lý.`,
      messageEn: `Distress intensity dropped from ${params.preIntensity}/10 to ${params.postIntensity}/10. Your nervous system has down-regulated.`,
    };
  }

  if (params.skillsAttemptedCount >= 2) {
    return {
      ...params,
      shouldStopLoop: true,
      suggestSecondSkill: false,
      outcome: 'stopped-early',
      messageVi:
        'Bạn đã thử 2 kỹ năng TIPP nhưng cường độ vẫn >= 7/10. Chúng ta sẽ dừng bài tập tại đây để không gây quá tải, chuyển sang đồng hành tĩnh lặng và hiển thị danh bạ hỗ trợ khẩn cấp.',
      messageEn:
        'You have completed 2 TIPP skills and distress remains >= 7/10. Stopping the exercise loop now to avoid overwhelm and displaying crisis support contacts.',
    };
  }

  return {
    ...params,
    shouldStopLoop: false,
    suggestSecondSkill: true,
    outcome: 'completed',
    messageVi:
      'Cường độ vẫn còn cao (>= 7/10). Bạn có muốn thử thêm 1 kỹ năng TIPP khác (Thở dẫn nhịp 4-6 hoặc Thư giãn cơ PMR) không?',
    messageEn:
      'Intensity is still >= 7/10. Would you like to try one more TIPP skill (Paced Breathing 4-6 or Paired Muscle Relaxation)?',
  };
}

export interface Grounding54321State {
  sight5: string[];
  touch4: string[];
  hear3: string[];
  smell2: string[];
  taste1: string[];
}

export interface DbtStopStep {
  letter: 'S' | 'T' | 'O' | 'P';
  titleVi: string;
  titleEn: string;
  instructionVi: string;
  instructionEn: string;
}

export const DBT_STOP_STEPS: DbtStopStep[] = [
  {
    letter: 'S',
    titleVi: 'Stop — Dừng lại ngay!',
    titleEn: 'Stop — Freeze your body!',
    instructionVi: 'Đừng phản ứng, đừng bấm gửi tin nhắn hay thanh toán. Giữ nguyên cơ thể 3 giây.',
    instructionEn: 'Do not react, send that message, or click buy. Freeze your muscles for 3 seconds.',
  },
  {
    letter: 'T',
    titleVi: 'Take a step back — Lùi lại 1 bước',
    titleEn: 'Take a step back — Detach & breathe',
    instructionVi: 'Đặt điện thoại xuống hoặc lùi khỏi tình huống. Hít sâu 1 hơi thật chậm.',
    instructionEn: 'Put the phone down or step back physically. Take one slow deep breath.',
  },
  {
    letter: 'O',
    titleVi: 'Observe — Quan sát bên trong & bên ngoài',
    titleEn: 'Observe — Notice facts & urges',
    instructionVi: 'Chuyện gì đang thực sự xảy ra? Cảm xúc và thôi thúc hành động nào đang kéo bạn đi?',
    instructionEn: 'What are the camera facts? What emotion or action urge is pulling at you right now?',
  },
  {
    letter: 'P',
    titleVi: 'Proceed Mindfully — Hành động từ Tâm Trí Tuệ',
    titleEn: 'Proceed Mindfully — Act from Wise Mind',
    instructionVi: 'Hỏi Tâm Trí Tuệ: Hành động nào lúc này sẽ giúp tình hình tốt hơn thay vì tồi tệ hơn?',
    instructionEn: 'Ask Wise Mind: What action right now will make this situation better rather than worse?',
  },
];
