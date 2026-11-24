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

export type FullSpectrumAffectKey = 'Calm' | 'Elevated' | AffectLabelCard['family'];

export interface FullSpectrumAffectCard {
  id: string;
  key: FullSpectrumAffectKey;
  valence: 'euthymic' | 'elevated' | 'distress';
  icon: string;
  labelVi: string;
  labelEn: string;
  clinicalNoteVi: string;
  clinicalNoteEn: string;
}

/**
 * Full-Spectrum Natural Affect Cards (7 States):
 * Places Euthymic/Medicated Stability ('Calm' — Default) and Joy/Elevated Energy ('Elevated')
 * first so stabilized patients on maintenance treatment never feel forced into negative-only labels,
 * followed by the 5 classic difficult affect families (with Shame vs. Guilt distinction).
 */
export const FULL_SPECTRUM_AFFECT_CARDS: readonly FullSpectrumAffectCard[] = [
  {
    id: 'affect-calm-euthymic',
    key: 'Calm',
    valence: 'euthymic',
    icon: '🌿',
    labelVi: 'Bình ổn • Thư thái • Đáp ứng tốt điều trị',
    labelEn: 'Calm • Steady • Euthymic Balance',
    clinicalNoteVi:
      'Trạng thái cân bằng tự nhiên (rất phổ biến khi bạn đã uống thuốc đều đặn và giữ nhịp ngủ ổn định). Hãy ghi nhận và duy trì nhịp sinh hoạt lành mạnh.',
    clinicalNoteEn:
      'Natural steady baseline (common when treatment and sleep rhythms are consistent). Acknowledge and gently maintain your routine.',
  },
  {
    id: 'affect-elevated-joy',
    key: 'Elevated',
    valence: 'elevated',
    icon: '✨',
    labelVi: 'Vui vẻ • Hứng khởi • Hưng phấn năng lượng',
    labelEn: 'Joyful • Energized • Elevated Mood',
    clinicalNoteVi:
      'Năng lượng tích cực và nhiệt huyết đáng trân trọng. Lưu ý nhỏ cho nhóm RLLC: nếu thấy hưng phấn tăng nhanh kèm giảm nhu cầu ngủ đêm, hãy ưu tiên giữ mốc giờ đi ngủ IPSRT.',
    clinicalNoteEn:
      'Healthy enthusiasm and positive energy. Note for Bipolar (RLLC): if paired with reduced need for sleep or racing plans, protect your IPSRT bedtime anchor.',
  },
  ...FIVE_FAMILY_AFFECT_CARDS.map((card) => ({
    id: card.id,
    key: card.family as FullSpectrumAffectKey,
    valence: 'distress' as const,
    icon:
      card.family === 'Sadness'
        ? '🌧️'
        : card.family === 'Anxiety'
          ? '🌊'
          : card.family === 'Anger'
            ? '🔥'
            : card.family === 'Shame'
              ? '🥀'
              : '🌱',
    labelVi: card.labelVi,
    labelEn: card.labelEn,
    clinicalNoteVi: card.clinicalNoteVi,
    clinicalNoteEn: card.clinicalNoteEn,
  })),
];

/**
 * V2 Official Design Tokens & Information Architecture Contract (T05 & T06 — `UI_UX_V2_DESIGN_SPEC.md` & `INFORMATION_ARCHITECTURE.md`):
 * - Light Tokens:
 *   primary: #426B57 (WCAG AA compliant sage green)
 *   primaryContainer: #DFEBE1
 *   background: #F7F6F2
 *   surface: #FFFFFF
 *   text: #263B33
 *   caution: #B58B51
 *   emergency: #A34C48
 * - Typography: Be Vietnam Pro / Inter, body 16px, line-height 1.5, headings 24/20/18px
 * - Spacing: 4/8/12/16/24/32px, Radius: 12-16px, Touch Target: >= 48dp
 * - Layout: Desktop sidebar 240px, main max-width 960px; Mobile 4-tab bottom navigation
 */

export interface V2DesignTokens {
  primary: string;
  primaryContainer: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  caution: string;
  emergency: string;
  fontFamily: string;
  bodyFontSizePx: 16;
  bodyLineHeight: 1.5;
  headingSizesPx: { h1: 24; h2: 20; h3: 18 };
  spacingScalePx: readonly [4, 8, 12, 16, 24, 32];
  radiusRangePx: readonly [12, 16];
  minTouchTargetDp: 48;
  desktopSidebarWidthPx: 240;
  mainMaxWidthPx: 960;
  breakpointsPx: { mobileMax: 600; desktopMin: 1024 };
}

export const V2_LIGHT_DESIGN_TOKENS: V2DesignTokens = {
  primary: '#426B57',
  primaryContainer: '#DFEBE1',
  background: '#F7F6F2',
  surface: '#FFFFFF',
  text: '#263B33',
  textSecondary: '#4A6157',
  border: '#DCE5DF',
  caution: '#B58B51',
  emergency: '#A34C48',
  fontFamily: "'Be Vietnam Pro', 'Inter', system-ui, -apple-system, sans-serif",
  bodyFontSizePx: 16,
  bodyLineHeight: 1.5,
  headingSizesPx: { h1: 24, h2: 20, h3: 18 },
  spacingScalePx: [4, 8, 12, 16, 24, 32],
  radiusRangePx: [12, 16],
  minTouchTargetDp: 48,
  desktopSidebarWidthPx: 240,
  mainMaxWidthPx: 960,
  breakpointsPx: { mobileMax: 600, desktopMin: 1024 },
};

export const V2_DARK_DESIGN_TOKENS: V2DesignTokens = {
  ...V2_LIGHT_DESIGN_TOKENS,
  primary: '#78A890',
  primaryContainer: '#1E3329',
  background: '#141A17',
  surface: '#1C2420',
  text: '#EBF2EE',
  textSecondary: '#B5C7BD',
  border: '#2E3D36',
  caution: '#D4A86A',
  emergency: '#E07A75',
};

export type V2PrimaryTabId = 'today' | 'practice' | 'plan' | 'progress';

export interface V2PrimaryTabSpec {
  id: V2PrimaryTabId;
  routePath: '/today' | '/practice' | '/plan' | '/progress';
  iconSymbol: string;
  labelVi: string;
  labelEn: string;
  purposeVi: string;
  purposeEn: string;
  contentsVi: string;
  contentsEn: string;
}

/**
 * V2 4-Tab Navigation Contract (`INFORMATION_ARCHITECTURE.md`):
 * 1. Hôm nay (/today)
 * 2. Thực hành (/practice)
 * 3. Kế hoạch (/plan)
 * 4. Tiến trình (/progress)
 * Note: SOS (/help/urgent) is a global action, NOT a tab. Avatar opens Profile/Privacy/Settings.
 */
export const V2_PRIMARY_4_TABS: readonly V2PrimaryTabSpec[] = [
  {
    id: 'today',
    routePath: '/today',
    iconSymbol: '☀️',
    labelVi: 'Hôm nay',
    labelEn: 'Today',
    purposeVi: 'Việc phù hợp ngay lúc này',
    purposeEn: 'What fits right now',
    contentsVi: 'Check-in tùy chọn (có thể bỏ qua), một gợi ý đã duyệt, tiếp tục phiên, kế hoạch hôm nay',
    contentsEn: 'Optional skippable check-in, one eligible suggestion, resume session, today plan',
  },
  {
    id: 'practice',
    routePath: '/practice',
    iconSymbol: '🌿',
    labelVi: 'Thực hành',
    labelEn: 'Practice',
    purposeVi: 'Tìm và thực hiện bài tập',
    purposeEn: 'Discover and practice skills',
    contentsVi: 'Theo nhu cầu (Bình tâm, Ngủ, Suy nghĩ, Cảm xúc), tìm kiếm, lọc, thiền, công cụ, thư viện chuyên sâu',
    contentsEn: 'By need (Calm, Sleep, Thoughts, Emotions), search, filter, meditation, tools, protocol library',
  },
  {
    id: 'plan',
    routePath: '/plan',
    iconSymbol: '🧭',
    labelVi: 'Kế hoạch',
    labelEn: 'Plan',
    purposeVi: 'Mục tiêu cá nhân & An toàn',
    purposeEn: 'Personal goals & safety plan',
    contentsVi: 'Việc đã chọn, lịch nhắc thuốc/nhịp sinh học tùy chọn, kế hoạch an toàn 6 mục, người hỗ trợ',
    contentsEn: 'Selected practices, optional schedule/rhythm, 6-section safety plan, consented supporters',
  },
  {
    id: 'progress',
    routePath: '/progress',
    iconSymbol: '📊',
    labelVi: 'Tiến trình',
    labelEn: 'Progress',
    purposeVi: 'Nhìn lại & Báo cáo',
    purposeEn: 'Reflect & user-controlled reports',
    contentsVi: 'Nhật ký, lịch sử phiên, đánh giá tự nguyện, xuất báo cáo có bước ẩn thông tin nhạy cảm',
    contentsEn: 'Journal history, sessions, optional self-assessments, redacted report export',
  },
] as const;

export const V2_PROPOSED_ROUTES = [
  '/welcome',
  '/auth/login',
  '/auth/callback',
  '/auth/reset',
  '/help/urgent',
  '/today',
  '/practice',
  '/practice/library',
  '/practice/[id]',
  '/session/[id]',
  '/plan',
  '/plan/safety',
  '/plan/support',
  '/progress',
  '/settings/privacy',
  '/clinician',
  '/admin',
] as const;

export type V2NeedCategoryId = 'calm' | 'sleep' | 'thoughts' | 'emotions' | 'relationships' | 'rhythm';

export interface V2NeedQuickChip {
  id: V2NeedCategoryId;
  labelVi: string;
  labelEn: string;
  icon: string;
  targetRoute: string;
  defaultSubView: string;
}

export const V2_TODAY_NEED_CHIPS: readonly V2NeedQuickChip[] = [
  { id: 'calm', labelVi: 'Bình tâm', labelEn: 'Calm', icon: '🌊', targetRoute: '/practice?need=calm', defaultSubView: 'anxiety-hub' },
  { id: 'sleep', labelVi: 'Ngủ', labelEn: 'Sleep', icon: '🌙', targetRoute: '/practice?need=sleep', defaultSubView: 'sleep-meditation' },
  { id: 'thoughts', labelVi: 'Suy nghĩ', labelEn: 'Thoughts', icon: '📝', targetRoute: '/practice?need=thoughts', defaultSubView: 'session-player' },
  { id: 'emotions', labelVi: 'Cảm xúc', labelEn: 'Emotions', icon: '🌱', targetRoute: '/practice?need=emotions', defaultSubView: 'tools-36-team-cbt' },
] as const;

/**
 * Maps any legacy V1 tab/route identifier to its canonical V2 4-Tab & Route destination (`INFORMATION_ARCHITECTURE.md` §Mapping hub cũ).
 */
export function resolveV2RouteAndTabRedirect(legacyOrV2Identifier: string): {
  v2Tab: V2PrimaryTabId;
  v2Route: string;
  mappedSubSection: string;
  isGlobalOverlay?: 'sos' | 'account-privacy' | null;
} {
  const clean = legacyOrV2Identifier.trim().toLowerCase();
  if (clean === 'sos' || clean === '/help/urgent' || clean === 'help/urgent') {
    return { v2Tab: 'today', v2Route: '/help/urgent', mappedSubSection: 'sos-urgent', isGlobalOverlay: 'sos' };
  }
  if (
    clean === 'account-privacy-vault' ||
    clean === 'phase4-e2ee-clinician-qa' ||
    clean === '/settings/privacy' ||
    clean === 'settings/privacy'
  ) {
    return {
      v2Tab: 'plan',
      v2Route: '/settings/privacy',
      mappedSubSection: 'account-privacy-vault',
      isGlobalOverlay: 'account-privacy',
    };
  }
  if (
    clean === 'today' ||
    clean === '/today' ||
    clean === 'sanctuary-companion' ||
    clean === 'ai-companion-biometrics' ||
    clean === 'phase3-ai-biometrics-voice'
  ) {
    return { v2Tab: 'today', v2Route: '/today', mappedSubSection: 'today-home', isGlobalOverlay: null };
  }
  if (
    clean === 'practice' ||
    clean === '/practice' ||
    clean === '/practice/library' ||
    clean === 'session-player' ||
    clean === 'tools-36-team-cbt' ||
    clean === 'self-care-36-tools' ||
    clean === 'anxiety-hub' ||
    clean === 'anxiety-relief' ||
    clean === 'protocols-68' ||
    clean === 'clinical-master-plan'
  ) {
    return {
      v2Tab: 'practice',
      v2Route: clean.includes('library') || clean === 'protocols-68' || clean === 'clinical-master-plan'
        ? '/practice/library'
        : '/practice',
      mappedSubSection: clean,
      isGlobalOverlay: null,
    };
  }
  if (
    clean === 'plan' ||
    clean === '/plan' ||
    clean === '/plan/safety' ||
    clean === '/plan/support' ||
    clean === 'three-tier-journey' ||
    clean === 'safety-plan-directory' ||
    clean === 'meds-and-bipolar' ||
    clean === 'fft-caregiver' ||
    clean === 'bipolar-ipsrt-hub' ||
    clean === 'mood-rhythm-journal'
  ) {
    const route =
      clean === 'safety-plan-directory' || clean === '/plan/safety'
        ? '/plan/safety'
        : clean === 'fft-caregiver' || clean === '/plan/support'
          ? '/plan/support'
          : '/plan';
    return { v2Tab: 'plan', v2Route: route, mappedSubSection: clean, isGlobalOverlay: null };
  }
  if (
    clean === 'progress' ||
    clean === '/progress' ||
    clean === 'assessments-report' ||
    clean === 'assessments-doctor-report' ||
    clean === 'who5-and-redaction'
  ) {
    return { v2Tab: 'progress', v2Route: '/progress', mappedSubSection: clean, isGlobalOverlay: null };
  }
  return { v2Tab: 'today', v2Route: '/today', mappedSubSection: 'today-home', isGlobalOverlay: null };
}

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
      background: '#F7F6F2',
      surface: '#FFFFFF',
      primary: '#426B57',
      accent: '#426B57',
      textPrimary: '#263B33',
      textSecondary: '#4A6157',
      border: '#DCE5DF',
      sosBanner: '#A34C48',
    },
    animationsEnabled: true,
    showStreaks: false, // V2 interaction rule: no streak pressure!
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
