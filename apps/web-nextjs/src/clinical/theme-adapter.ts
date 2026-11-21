import type {
  AdaptiveThemeConfig,
  AffectLabelCard,
  MoodPole,
  UIThemeMode,
} from './types.ts';

/**
 * 1. Adaptive Theme & UI Mode System
 * - Standard Mode: Balanced calming slate/teal palette
 * - Low-Energy Depression Mode: Auto-activates when Mood Polarity <= -3
 *   (Simplified "One Small Step" view, Voice Burst input priority, Affect Labeling cards, No Broken Streaks)
 * - Low-Stimulus Mania / Dark Rest Mode: Auto-activates when Mood Polarity >= +2 or ASRM >= 6
 *   (Warm dark amber palette, zero flashy animations, 48-Hour Impulse Vault banner, Dark Therapy wind-down timer)
 * - Persistent 1-Tap SOS Portal Button at the top/corner of every screen.
 */

export const FIVE_FAMILY_AFFECT_CARDS: AffectLabelCard[] = [
  {
    id: 'affect-sadness',
    family: 'Sadness',
    labelVi: 'Buồn bã / Trống rỗng / Mất mát',
    labelEn: 'Sadness / Emptiness / Grief',
    clinicalNoteVi: 'Cảm xúc tự nhiên khi mất đi điều quan trọng hoặc cạn kiệt năng lượng.',
    clinicalNoteEn: 'Natural response to loss, disconnection, or biological exhaustion.',
  },
  {
    id: 'affect-anxiety',
    family: 'Anxiety',
    labelVi: 'Lo âu / Bất an / Sợ hãi',
    labelEn: 'Anxiety / Dread / Fear',
    clinicalNoteVi: 'Hệ thần kinh đang báo động về một mối đe dọa trong tương lai.',
    clinicalNoteEn: 'Nervous system scanning for future threat or uncertainty.',
  },
  {
    id: 'affect-anger',
    family: 'Anger',
    labelVi: 'Giận dữ / Bực bội / Bất công',
    labelEn: 'Anger / Frustration / Resentment',
    clinicalNoteVi: 'Dấu hiệu ranh giới cá nhân hoặc giá trị quan trọng bị xâm phạm.',
    clinicalNoteEn: 'Signal that a boundary, need, or fairness standard feels violated.',
  },
  {
    id: 'affect-shame',
    family: 'Shame',
    labelVi: 'Xấu hổ ("Tôi là người tồi tệ")',
    labelEn: 'Shame ("I am bad / flawed")',
    clinicalNoteVi: 'Phân biệt rõ: Xấu hổ tấn công toàn bộ con người bạn. Thôi thúc ẩn mình.',
    clinicalNoteEn: 'Crucial distinction: Shame attacks your entire self-worth ("I am bad").',
  },
  {
    id: 'affect-guilt',
    family: 'Guilt',
    labelVi: 'Tội lỗi ("Tôi đã làm sai một việc")',
    labelEn: 'Guilt ("I made a mistake in action")',
    clinicalNoteVi: 'Phân biệt rõ: Tội lỗi chỉ nhận xét về 1 hành vi cụ thể và có thể sửa chữa.',
    clinicalNoteEn: 'Crucial distinction: Guilt focuses on a specific behavior ("I did something wrong").',
  },
];

export function resolveAdaptiveTheme(params: {
  moodPolarity: MoodPole;
  asrmScore?: number;
  manualOverride?: UIThemeMode | null;
   maniaThreshold?: number;
  depressionThreshold?: number;
}): AdaptiveThemeConfig {
  const maniaPole = params.maniaThreshold ?? 2;
  const depressionPole = params.depressionThreshold ?? -3;
  const asrm = params.asrmScore ?? 0;

  let mode: UIThemeMode = 'standard';
  if (params.manualOverride) {
    mode = params.manualOverride;
  } else if (params.moodPolarity >= maniaPole || asrm >= 6) {
    mode = 'low-stimulus-mania';
  } else if (params.moodPolarity <= depressionPole) {
    mode = 'low-energy-depression';
  }

  if (mode === 'low-energy-depression') {
    return {
      mode: 'low-energy-depression',
      titleVi: 'Chế độ Trầm cảm Nặng — Một Bước Nhỏ Tiếp Theo (Low-Energy Mode)',
      titleEn: 'Low-Energy Depression Mode — One Small Step',
      reasonVi:
        'Tự động kích hoạt khi Cực khí sắc <= -3. Đã ẩn toàn bộ bảng điều khiển phức tạp và tắt đếm chuỗi ngày (No Broken Streaks) để tránh áp lực.',
      reasonEn:
        'Auto-activated because Mood Polarity <= -3. Complex dashboards and streak counters are hidden (No Broken Streaks) to eliminate self-blame.',
      palette: {
        background: '#0f172a',
        surface: '#1e293b',
        primary: '#38bdf8',
        accent: '#7dd3fc',
        textPrimary: '#f1f5f9',
        textSecondary: '#cbd5e1',
        border: '#334155',
        sosBanner: '#e11d48',
      },
      animationsEnabled: false,
      showStreaks: false, // NO BROKEN STREAKS in Depression Mode
      simplifiedOneSmallStep: true,
      voiceBurstPrimary: true,
      showAffectLabelingCards: true,
      show48hImpulseVaultBanner: false,
      showDarkTherapyTimer: false,
      blockHighActivationBA: false,
      persistentSosVisible: true,
    };
  }

  if (mode === 'low-stimulus-mania') {
    return {
      mode: 'low-stimulus-mania',
      titleVi: 'Chế độ Bảo vệ Hưng cảm — Giảm Kích thích & Nghỉ Tối (Low-Stimulus / Dark Rest)',
      titleEn: 'Low-Stimulus Mania / Dark Rest Mode (Hypomania Guard)',
      reasonVi:
        'Tự động kích hoạt khi Cực khí sắc >= +2 hoặc ASRM >= 6. Bảng màu hổ phách trầm ấm (loại bỏ ánh sáng xanh), tắt 100% animation và kích hoạt Khoang Chờ 48 Giờ.',
      reasonEn:
        'Auto-activated because Mood Polarity >= +2 or ASRM >= 6. Warm dark amber palette (zero blue light), zero flashy animations, 48-Hour Impulse Vault banner active.',
      palette: {
        background: '#14110f',
        surface: '#1c1917',
        primary: '#d97706',
        accent: '#f59e0b',
        textPrimary: '#fef3c7',
        textSecondary: '#d6d3d1',
        border: '#44403c',
        sosBanner: '#dc2626',
      },
      animationsEnabled: false, // ZERO FLASHY ANIMATIONS
      showStreaks: false,
      simplifiedOneSmallStep: false,
      voiceBurstPrimary: false,
      showAffectLabelingCards: true,
      show48hImpulseVaultBanner: true,
      showDarkTherapyTimer: true,
      blockHighActivationBA: true, // Prevent manic switch / over-stimulation
      persistentSosVisible: true,
    };
  }

  return {
    mode: 'standard',
    titleVi: 'Chế độ Tiêu chuẩn — Cân bằng & Phản tư (Standard Mode)',
    titleEn: 'Standard Mode — Balanced Calming Slate & Teal',
    reasonVi: 'Khí sắc trong vùng ổn định (-2 đến +1). Mở đầy đủ các phân hệ CBT, TEAM-CBT, DBT và IPSRT.',
    reasonEn: 'Mood polarity within stable range (-2 to +1). Full CBT, TEAM-CBT, DBT, and IPSRT modules available.',
    palette: {
      background: '#f8fafc',
      surface: '#ffffff',
      primary: '#0f766e',
      accent: '#0d9488',
      textPrimary: '#0f172a',
      textSecondary: '#475569',
      border: '#e2e8f0',
      sosBanner: '#e11d48',
    },
    animationsEnabled: true,
    showStreaks: true,
    simplifiedOneSmallStep: false,
    voiceBurstPrimary: false,
    showAffectLabelingCards: true,
    show48hImpulseVaultBanner: false,
    showDarkTherapyTimer: false,
    blockHighActivationBA: false,
    persistentSosVisible: true,
  };
}

export interface DarkTherapyWindDownStatus {
  targetShutdownHour: string; // HH:mm
  minutesRemaining: number;
  isDarkRestActiveNow: boolean;
  bannerTextVi: string;
  bannerTextEn: string;
}

/**
 * Computes Dark Therapy Wind-Down timer for Bipolar Mania / Hypomania protection.
 */
export function computeDarkTherapyTimer(
  currentTimeHHmm: string,
  targetShutdownHour = '22:00'
): DarkTherapyWindDownStatus {
  const [curH = 21, curM = 0] = currentTimeHHmm.split(':').map(Number);
  const [tarH = 22, tarM = 0] = targetShutdownHour.split(':').map(Number);

  const curTotal = curH * 60 + curM;
  const tarTotal = tarH * 60 + tarM;

  let diff = tarTotal - curTotal;
  // Between target hour and 06:00 AM is active Dark Therapy rest period
  const isNightRest = curTotal >= tarTotal || curTotal < 360;
  if (diff < 0) {
    diff = 0;
  }

  return {
    targetShutdownHour,
    minutesRemaining: isNightRest ? 0 : diff,
    isDarkRestActiveNow: isNightRest,
    bannerTextVi: isNightRest
      ? `Đang trong khung giờ Liêu pháp Bóng tối (Dark Therapy sau ${targetShutdownHour}). Hãy giảm độ sáng màn hình, dừng làm việc và để não bộ nghỉ ngơi.`
      : `Còn ${diff} phút nữa đến giờ Hạ nhiệt Bóng tối (${targetShutdownHour}) — giữ vững mốc ngủ IPSRT.`,
    bannerTextEn: isNightRest
      ? `Dark Therapy Rest Window active (after ${targetShutdownHour}). Dim screens, pause projects, and protect circadian sleep.`
      : `${diff} minutes until Dark Therapy Wind-Down (${targetShutdownHour}) — protect your IPSRT sleep anchor.`,
  };
}
