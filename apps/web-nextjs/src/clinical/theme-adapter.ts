import type {
  AdaptiveThemeConfig,
  AffectLabelCard,
  MoodPole,
  UIThemeMode,
} from './types.ts';

/**
 * 1. Adaptive Theme & UI Mode System (Inspired by KazKozDev/cbt-assistant, irolinski/Well_CBT & Andrew-FungKinHo/whynot)
 * - Standard Serene Sanctuary Mode: Warm Alabaster Paper (#FAF9F6), Soft Charcoal ink (#2F2F2B),
 *   Muted Sage/Stone secondary (#6B6B63), Soft Lavender-Slate therapeutic accent (#797298),
 *   Healing Sage green (#6AA882), Terracotta warm alert (#C56548), Warm Cream cards (#FFFFFF with #E6E4DC border).
 * - Low-Energy Depression Mode: Auto-activates when Mood Polarity <= -3
 *   (Soft Warm Oatmeal #F4F1EA, extra-spacious comforting layout, "Hôm nay một bước nhỏ thôi là đủ",
 *   large Voice Burst pill, 5-family Affect Cards, zero broken streaks).
 * - Low-Stimulus Mania / Dark Rest Mode: Auto-activates when Mood Polarity >= +2 or ASRM >= 6
 *   (Deep Warm Obsidian-Amber #14110F background, #1E1916 card, #D97706 muted amber accent, zero blue light, zero animations).
 * - Persistent 1-Tap SOS Bình tĩnh Ngay Button at the top header of every screen.
 */

export const FIVE_FAMILY_AFFECT_CARDS: AffectLabelCard[] = [
  {
    id: 'affect-sadness',
    family: 'Sadness',
    labelVi: 'Buồn bã • Trống rỗng • Mất mát',
    labelEn: 'Sadness • Emptiness • Grief',
    clinicalNoteVi: 'Cảm xúc tự nhiên khi mất đi điều quan trọng hoặc khi cơ thể cạn kiệt năng lượng.',
    clinicalNoteEn: 'Natural response to loss, disconnection, or biological exhaustion.',
  },
  {
    id: 'affect-anxiety',
    family: 'Anxiety',
    labelVi: 'Lo âu • Bất an • Căng thẳng',
    labelEn: 'Anxiety • Unease • Worry',
    clinicalNoteVi: 'Hệ thần kinh đang cố gắng bảo vệ bạn trước một điều chưa chắc chắn trong tương lai.',
    clinicalNoteEn: 'Nervous system scanning to protect you from future uncertainty.',
  },
  {
    id: 'affect-anger',
    family: 'Anger',
    labelVi: 'Giận dữ • Bức bối • Tổn thương',
    labelEn: 'Anger • Frustration • Hurt',
    clinicalNoteVi: 'Tín hiệu cho thấy một ranh giới cá nhân hoặc giá trị quan trọng của bạn đang cần được tôn trọng.',
    clinicalNoteEn: 'Signal that a personal boundary, need, or fairness value needs respect.',
  },
  {
    id: 'affect-shame',
    family: 'Shame',
    labelVi: 'Xấu hổ ("Mình thật kém cỏi")',
    labelEn: 'Shame ("I am flawed / not enough")',
    clinicalNoteVi: 'Xấu hổ khiến ta muốn thu mình lại vì tự phán xét toàn bộ giá trị bản thân. Bạn xứng đáng được thấu cảm.',
    clinicalNoteEn: 'Shame attacks your whole self-worth ("I am bad"). You deserve gentle compassion.',
  },
  {
    id: 'affect-guilt',
    family: 'Guilt',
    labelVi: 'Áy náy ("Mình lỡ làm chưa đúng")',
    labelEn: 'Guilt ("I made a mistake in action")',
    clinicalNoteVi: 'Áy náy chỉ hướng về một hành động cụ thể — và mọi hành động đều có thể học hỏi hoặc sửa chữa.',
    clinicalNoteEn: 'Guilt focuses on a specific action — and actions can always be repaired or learned from.',
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
      titleVi: 'Không gian Dịu dàng — Hôm nay một bước nhỏ thôi là đủ',
      titleEn: 'Gentle Sanctuary — One Small Step Today Is Enough',
      reasonVi:
        'Khi cơ thể và tâm trí đang mệt, bạn không cần ép mình làm nhiều việc. Hãy chọn một điều nhỏ nhẹ nhất hoặc đơn giản là nghỉ ngơi.',
      reasonEn:
        'When your mind and body feel heavy, you do not need to push yourself. Choose one tiny step or simply rest without guilt.',
      palette: {
        background: '#F4F1EA',
        surface: '#FAF8F5',
        primary: '#797298',
        accent: '#6AA882',
        textPrimary: '#2F2F2B',
        textSecondary: '#6B6B63',
        border: '#E4E0D5',
        sosBanner: '#C56548',
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
      titleVi: 'Không gian Trầm ấm Hạ nhiệt & Bảo vệ Giấc ngủ',
      titleEn: 'Warm Evening Rest — Gentle Wind-Down & Sleep Guard',
      reasonVi:
        'Không gian đã chuyển sang tông trầm dịu mắt để giúp hệ thần kinh của bạn thư giãn và chuẩn bị cho giấc ngủ sâu.',
      reasonEn:
        'Shifted to a warm, low-stimulus evening space to help your nervous system wind down for restful sleep.',
      palette: {
        background: '#14110F',
        surface: '#1E1916',
        primary: '#D97706',
        accent: '#F59E0B',
        textPrimary: '#FAF3E0',
        textSecondary: '#C8C2B8',
        border: '#38302A',
        sosBanner: '#C56548',
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
    titleVi: 'Không gian lắng nghe & chăm sóc tâm trí mỗi ngày',
    titleEn: 'Your daily space for calm reflection & mental clarity',
    reasonVi:
      'Hãy thả lỏng vai và hít một hơi thật sâu. Bạn đang ở trong không gian an toàn và không phán xét của riêng mình.',
    reasonEn:
      'Relax your shoulders and take a slow breath. You are in your safe, judgment-free sanctuary.',
    palette: {
      background: '#FAF9F6',
      surface: '#FFFFFF',
      primary: '#797298',
      accent: '#6AA882',
      textPrimary: '#2F2F2B',
      textSecondary: '#6B6B63',
      border: '#E6E4DC',
      sosBanner: '#C56548',
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
  const isNightRest = curTotal >= tarTotal || curTotal < 360;
  if (diff < 0) {
    diff = 0;
  }

  return {
    targetShutdownHour,
    minutesRemaining: isNightRest ? 0 : diff,
    isDarkRestActiveNow: isNightRest,
    bannerTextVi: isNightRest
      ? `Đang trong khung giờ Nghỉ tối Bảo vệ Nhịp Sinh học (sau ${targetShutdownHour}). Hãy giảm độ sáng màn hình, tạm gác công việc và để tâm trí lắng dịu.`
      : `Còn ${diff} phút nữa đến giờ Hạ nhiệt Nghỉ tối (${targetShutdownHour}) — giữ vững nhịp ngủ sinh học của bạn.`,
    bannerTextEn: isNightRest
      ? `Evening Rest Window active (after ${targetShutdownHour}). Dim screens, pause projects, and let your nervous system rest.`
      : `${diff} minutes until Evening Wind-Down (${targetShutdownHour}) — protect your sleep rhythm anchor.`,
  };
}
