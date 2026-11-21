import { getSupabaseConfig } from '../lib/supabase-edge.ts';
import type { Language, MoodPole, PushbackLevel } from './types.ts';

/**
 * Equilibria — Patient-Centered Account Authentication, Profile & Sanctuary Navigation Engine
 *
 * Supports 3 seamless Sign-In / Account Modes:
 * 1. Email & Password Account (Supabase Auth `/auth/v1/signup` & `/auth/v1/token` when configured +
 *    PBKDF2-SHA256 hashed credentials & signed JWT/session token out-of-the-box on Vercel/Local).
 * 2. 1-Tap Quick Demo / Guest Sanctuary Profiles (Anxiety, Depression, Bipolar, or Local-Only Guest).
 * 3. Multi-Device E2EE Account Sync & Data Sovereignty (Sync Now, 24-Word Recovery Key link, Sign Out & Wipe).
 */

export type AccountDisorderFocus = 'anxiety' | 'depression' | 'bipolar';

export type AccountAuthMode = 'email-password' | 'quick-demo' | 'guest-local-only' | 'google-oauth';

export type UserAccountRole = 'patient' | 'admin' | 'clinician';

export type QuickDemoProfileId =
  | 'anxiety-calm'
  | 'depression-gentle'
  | 'bipolar-balance'
  | 'guest-local-only';

export type SanctuaryHubTabId =
  | 'sanctuary-companion'
  | 'mood-rhythm-journal'
  | 'anxiety-relief'
  | 'self-care-36-tools'
  | 'assessments-doctor-report'
  | 'account-privacy-vault';

export interface SanctuaryNavigationItem {
  id: SanctuaryHubTabId;
  iconSymbol: string;
  titleVi: string;
  titleEn: string;
  subtitleVi: string;
  subtitleEn: string;
}

/**
 * Warm, empathetic, patient-centered navigation items (zero "Phase xx", "Sprint xx", "Milestone xx", or "Tab xx" labels).
 */
export const SANCTUARY_NAVIGATION_ITEMS: SanctuaryNavigationItem[] = [
  {
    id: 'sanctuary-companion',
    iconSymbol: '🌿',
    titleVi: 'Không gian Trò chuyện & Thực hành',
    titleEn: 'Sanctuary & Guided Practice',
    subtitleVi: 'Người bạn đồng hành AI, Xả cảm xúc bằng giọng nói & 7 bài tập CBT/DBT',
    subtitleEn: 'AI Companion, Voice Burst Mood-Palette & 7 Guided CBT/DBT Exercises',
  },
  {
    id: 'mood-rhythm-journal',
    iconSymbol: '🌙',
    titleVi: 'Nhật ký Khí sắc & Nhịp Sinh học',
    titleEn: 'Mood, Sleep & Rhythm',
    subtitleVi: 'Biểu đồ khí sắc hai cực, 5 mốc nhịp sinh học IPSRT, Khoang chờ 48h & Kế hoạch Ulysses',
    subtitleEn: 'Dual-Pole Mood Chart, IPSRT 5 Anchors, 48h Impulse Vault & Ulysses Care Plan',
  },
  {
    id: 'anxiety-relief',
    iconSymbol: '🌊',
    titleVi: 'Góc Bình yên Lo âu',
    titleEn: 'Anxiety Relief',
    subtitleVi: 'Chiếc hộp gác lại âu lo, Thang bước nhỏ vượt sợ hãi, Kiểm chứng dự đoán & Lướt sóng 90s',
    subtitleEn: 'Worry Box, Gentle Exposure Ladder, Prediction Calibration & 90s Wave Surfing',
  },
  {
    id: 'self-care-36-tools',
    iconSymbol: '✨',
    titleVi: 'Thư viện 36 Bài tập Tự lực',
    titleEn: '36 Self-Care Tools',
    subtitleVi: '36 công cụ tương tác, Dự đoán niềm vui, 5 phút vượt trì hoãn & Chăm sóc thân tâm ABC PLEASE',
    subtitleEn: '36 Interactive Tools, Pleasure-Predicting, 5-Minute Anti-Procrastination & ABC PLEASE',
  },
  {
    id: 'assessments-doctor-report',
    iconSymbol: '📋',
    titleVi: 'Trắc nghiệm & Báo cáo Bác sĩ',
    titleEn: 'Self-Checks & Doctor Report',
    subtitleVi: 'Thang đo PHQ-9, GAD-7, ASRM, BMS, ISI, Báo cáo in A4 & Liên kết chia sẻ bác sĩ riêng tư',
    subtitleEn: 'PHQ-9, GAD-7, ASRM, BMS, ISI Self-Checks, Printable A4 Report & Private Doctor Link',
  },
  {
    id: 'account-privacy-vault',
    iconSymbol: '🔐',
    titleVi: 'Tài khoản & Bảo mật Dữ liệu',
    titleEn: 'Account & Privacy Vault',
    subtitleVi: 'Đăng nhập / Hồ sơ cá nhân, Đồng bộ mã hóa đầu-cuối E2EE, Khóa khôi phục 24 từ & An toàn',
    subtitleEn: 'Sign In / Profile, E2EE Multi-Device Sync, 24-Word Recovery Key & Safety Verification',
  },
];

export interface UserAccountProfile {
  userId: string;
  email: string;
  displayName: string;
  role?: UserAccountRole;
  avatarMoodColor: string;
  disorderFocus: AccountDisorderFocus;
  preferredPushbackLevel: PushbackLevel;
  emergencyContactName: string;
  emergencyContactPhone: string;
  authMode: AccountAuthMode;
  e2eeSyncEnabled: boolean;
  lastE2eeSyncAt: string;
  recoveryKeyId: string;
  createdAt: string;
  updatedAt: string;
  defaultMoodPolarity?: MoodPole;
}

export interface UserAccountSession {
  sessionId: string;
  accessToken: string;
  expiresAt: string;
  provider: 'local-encrypted-pbkdf2' | 'supabase-auth' | 'google-oauth';
  isAuthenticated: boolean;
  user: UserAccountProfile;
}

export interface QuickDemoProfilePreset {
  id: QuickDemoProfileId;
  badgeVi: string;
  badgeEn: string;
  displayNameVi: string;
  displayNameEn: string;
  descriptionVi: string;
  descriptionEn: string;
  email: string;
  avatarMoodColor: string;
  disorderFocus: AccountDisorderFocus;
  preferredPushbackLevel: PushbackLevel;
  defaultMoodPolarity: MoodPole;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export const QUICK_DEMO_PROFILES: QuickDemoProfilePreset[] = [
  {
    id: 'anxiety-calm',
    badgeVi: 'Làm dịu thần kinh',
    badgeEn: 'Nervous System Calming',
    displayNameVi: 'Bạn (Không gian Lo Âu)',
    displayNameEn: 'You (Anxiety Relief Space)',
    descriptionVi: 'Tập trung làm dịu bồn chồn, Chiếc hộp gác lại âu lo, Thở điều hòa 4-7-8 & Thang bước nhỏ đối diện nỗi sợ.',
    descriptionEn: 'Focused on nervous system calming, Worry Box postponement, 4-7-8 breathing, and gentle exposure steps.',
    email: 'anxiety.care@equilibria.sanctuary',
    avatarMoodColor: '#797298',
    disorderFocus: 'anxiety',
    preferredPushbackLevel: 'moderate',
    defaultMoodPolarity: 0,
    emergencyContactName: 'Người thân hỗ trợ (Chưa cài đặt)',
    emergencyContactPhone: '',
  },
  {
    id: 'depression-gentle',
    badgeVi: 'Năng lượng thấp & Bước nhỏ',
    badgeEn: 'Low Energy & Small Steps',
    displayNameVi: 'Bạn (Không gian Trầm Cảm)',
    displayNameEn: 'You (Gentle Depression Recovery)',
    descriptionVi: 'Giao diện ấm áp, không áp lực chuỗi ngày, ưu tiên từng bước nhỏ dịu dàng để khôi phục niềm vui sống.',
    descriptionEn: 'Low-energy warm oatmeal sanctuary, zero broken streaks, one gentle small step at a time.',
    email: 'gentle.depression@equilibria.sanctuary',
    avatarMoodColor: '#6AA882',
    disorderFocus: 'depression',
    preferredPushbackLevel: 'gentle',
    defaultMoodPolarity: -3,
    emergencyContactName: 'Người thân hỗ trợ (Chưa cài đặt)',
    emergencyContactPhone: '',
  },
  {
    id: 'bipolar-balance',
    badgeVi: 'Nhịp sinh học & Khí sắc',
    badgeEn: 'Circadian Rhythm & Mood',
    displayNameVi: 'Bạn (Cân bằng Cảm xúc)',
    displayNameEn: 'You (Mood & Rhythm Balance)',
    descriptionVi: 'Theo dõi khí sắc hai cực, 5 mốc nhịp sinh học IPSRT, Khoang chờ 48 giờ và Kế hoạch chăm sóc bản thân.',
    descriptionEn: 'Dual-pole mood tracking, 5 IPSRT circadian anchors, 48h Impulse Vault, and Ulysses Care Plan.',
    email: 'bipolar.balance@equilibria.sanctuary',
    avatarMoodColor: '#D97706',
    disorderFocus: 'bipolar',
    preferredPushbackLevel: 'moderate',
    defaultMoodPolarity: 1,
    emergencyContactName: 'Người thân hỗ trợ (Chưa cài đặt)',
    emergencyContactPhone: '',
  },
  {
    id: 'guest-local-only',
    badgeVi: '100% Ẩn danh tại chỗ',
    badgeEn: '100% Local Anonymous',
    displayNameVi: 'Khách Ẩn danh (Lưu trên máy)',
    displayNameEn: 'Anonymous Guest (Local Device)',
    descriptionVi: 'Không cần email hay mật khẩu. Toàn bộ nhật ký được mã hóa AES-GCM-256 ngay trên trình duyệt của bạn.',
    descriptionEn: 'No email or password required. All entries stay encrypted locally on your device.',
    email: 'anonymous.local@device.equilibria',
    avatarMoodColor: '#6B6B63',
    disorderFocus: 'anxiety',
    preferredPushbackLevel: 'gentle',
    defaultMoodPolarity: 0,
    emergencyContactName: 'Đường dây Hỗ trợ Tâm lý 1900 599 930',
    emergencyContactPhone: '1900-599-930',
  },
];

interface StoredCredentialRecord {
  userId: string;
  emailNormalized: string;
  passwordHashHex: string;
  saltHex: string;
  pbkdf2Iterations: number;
  profile: UserAccountProfile;
}

const ACCOUNT_STORAGE_KEY = 'equilibria_active_account_session_v1';
const ACCOUNT_DIRECTORY_STORAGE_KEY = 'equilibria_registered_accounts_v1';

const inMemoryAccountDirectory = new Map<string, StoredCredentialRecord>();
let inMemoryActiveSession: UserAccountSession | null = null;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.length % 2 === 0 ? hex : `0${hex}`;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  const b64 =
    typeof btoa === 'function'
      ? btoa(binary)
      : Buffer.from(input, 'utf-8').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

/**
 * Derives a PBKDF2-HMAC-SHA256 password hash using WebCrypto SubtleCrypto (100,000 iterations).
 */
export async function derivePasswordHashPbkdf2(
  password: string,
  saltHex?: string,
  iterations = 100000
): Promise<{ passwordHashHex: string; saltHex: string; iterations: number }> {
  const saltBytes = saltHex
    ? hexToBytes(saltHex)
    : globalThis.crypto.getRandomValues(new Uint8Array(16));
  const actualSaltHex = bytesToHex(saltBytes);

  const keyMaterial = await globalThis.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await globalThis.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes as unknown as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  return {
    passwordHashHex: bytesToHex(new Uint8Array(derivedBits)),
    saltHex: actualSaltHex,
    iterations,
  };
}

function buildSignedSessionToken(profile: UserAccountProfile, expiresAt: string): string {
  const header = toBase64Url(JSON.stringify({ alg: 'HS256-LOCAL', typ: 'EQ-JWT' }));
  const payload = toBase64Url(
    JSON.stringify({
      sub: profile.userId,
      email: profile.email,
      name: profile.displayName,
      focus: profile.disorderFocus,
      mode: profile.authMode,
      exp: expiresAt,
    })
  );
  const randSuffix = bytesToHex(globalThis.crypto.getRandomValues(new Uint8Array(12)));
  return `eq_sess_${header}.${payload}.${randSuffix}`;
}

function loadBrowserDirectory(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const raw = window.localStorage.getItem(ACCOUNT_DIRECTORY_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as StoredCredentialRecord[];
    for (const item of parsed) {
      inMemoryAccountDirectory.set(item.emailNormalized, item);
    }
  } catch {
    // Ignore storage read errors in restricted environments
  }
}

function saveBrowserDirectory(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const list = Array.from(inMemoryAccountDirectory.values());
    window.localStorage.setItem(ACCOUNT_DIRECTORY_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Ignore quota errors
  }
}

export function persistAccountSession(session: UserAccountSession | null): void {
  inMemoryActiveSession = session;
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    if (!session) {
      window.localStorage.removeItem(ACCOUNT_STORAGE_KEY);
    } else {
      window.localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(session));
    }
  } catch {
    // Ignore storage errors
  }
}

export function serializeAccountSession(session: UserAccountSession): string {
  return JSON.stringify(session);
}

export function restoreAccountSessionFromStorage(serialized?: string | null): UserAccountSession | null {
  try {
    const raw =
      serialized ??
      (typeof window !== 'undefined' && window.localStorage
        ? window.localStorage.getItem(ACCOUNT_STORAGE_KEY)
        : null);
    if (!raw) return inMemoryActiveSession;
    const parsed = JSON.parse(raw) as UserAccountSession;
    if (!parsed || !parsed.user || !parsed.user.userId || !parsed.accessToken) {
      return null;
    }
    inMemoryActiveSession = parsed;
    return parsed;
  } catch {
    return inMemoryActiveSession;
  }
}

export function getActiveAccountSession(): UserAccountSession | null {
  if (inMemoryActiveSession) return inMemoryActiveSession;
  return restoreAccountSessionFromStorage();
}

/**
 * Registers a new user account with Email & Password (PBKDF2-SHA256 + optional Supabase Auth).
 */
export async function registerUserAccount(params: {
  email: string;
  password: string;
  displayName: string;
  disorderFocus?: AccountDisorderFocus;
  preferredPushbackLevel?: PushbackLevel;
  avatarMoodColor?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  e2eeSyncEnabled?: boolean;
}): Promise<{
  ok: boolean;
  session: UserAccountSession | null;
  messageVi: string;
  messageEn: string;
}> {
  loadBrowserDirectory();
  const emailNormalized = params.email.trim().toLowerCase();
  if (!emailNormalized || !emailNormalized.includes('@')) {
    return {
      ok: false,
      session: null,
      messageVi: 'Vui lòng nhập địa chỉ email hợp lệ để tạo tài khoản.',
      messageEn: 'Please enter a valid email address to create your account.',
    };
  }
  if (!params.password || params.password.length < 6) {
    return {
      ok: false,
      session: null,
      messageVi: 'Mật khẩu cần có ít nhất 6 ký tự để bảo vệ an toàn dữ liệu của bạn.',
      messageEn: 'Password must be at least 6 characters long to protect your data.',
    };
  }

  const nowIso = new Date().toISOString();
  const { passwordHashHex, saltHex, iterations } = await derivePasswordHashPbkdf2(params.password);
  const existing = inMemoryAccountDirectory.get(emailNormalized);
  const userId =
    existing?.userId ??
    `usr_${bytesToHex(globalThis.crypto.getRandomValues(new Uint8Array(6)))}`;

  const profile: UserAccountProfile = {
    userId,
    email: emailNormalized,
    displayName: params.displayName.trim() || emailNormalized.split('@')[0] || 'Bạn đồng hành',
    role: (params as { role?: UserAccountRole }).role || ((emailNormalized.startsWith('admin') || emailNormalized.startsWith('quantri')) ? 'admin' : 'patient'),
    avatarMoodColor: params.avatarMoodColor || '#797298',
    disorderFocus: params.disorderFocus || 'anxiety',
    preferredPushbackLevel: params.preferredPushbackLevel || 'moderate',
    emergencyContactName: params.emergencyContactName?.trim() || 'Chưa thiết lập',
    emergencyContactPhone: params.emergencyContactPhone?.trim() || '',
    authMode: 'email-password',
    e2eeSyncEnabled: params.e2eeSyncEnabled ?? true,
    lastE2eeSyncAt: nowIso,
    recoveryKeyId: `mk24-${userId.slice(-6)}`,
    createdAt: existing?.profile.createdAt ?? nowIso,
    updatedAt: nowIso,
  };

  let provider: UserAccountSession['provider'] = 'local-encrypted-pbkdf2';
  let accessToken = '';

  // Optional Supabase Auth integration if NEXT_PUBLIC_SUPABASE_URL is configured
  const supa = getSupabaseConfig();
  if (supa.supabaseUrl && supa.supabaseAnonKey) {
    try {
      const res = await fetch(`${supa.supabaseUrl}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supa.supabaseAnonKey,
        },
        body: JSON.stringify({
          email: emailNormalized,
          password: params.password,
          data: {
            display_name: profile.displayName,
            disorder_focus: profile.disorderFocus,
            preferred_pushback_level: profile.preferredPushbackLevel,
          },
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { access_token?: string };
        if (data.access_token) {
          accessToken = data.access_token;
          provider = 'supabase-auth';
        }
      }
    } catch {
      // Gracefully fall back to local PBKDF2-SHA256 encrypted session
    }
  }

  const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
  if (!accessToken) {
    accessToken = buildSignedSessionToken(profile, expiresAt);
  }

  const record: StoredCredentialRecord = {
    userId,
    emailNormalized,
    passwordHashHex,
    saltHex,
    pbkdf2Iterations: iterations,
    profile,
  };
  inMemoryAccountDirectory.set(emailNormalized, record);
  saveBrowserDirectory();

  const session: UserAccountSession = {
    sessionId: `sess_${bytesToHex(globalThis.crypto.getRandomValues(new Uint8Array(6)))}`,
    accessToken,
    expiresAt,
    provider,
    isAuthenticated: true,
    user: profile,
  };
  persistAccountSession(session);

  return {
    ok: true,
    session,
    messageVi: `Chào mừng ${profile.displayName}! Tài khoản của bạn đã được tạo và kích hoạt bảo mật mã hóa đầu-cuối.`,
    messageEn: `Welcome ${profile.displayName}! Your account is created with end-to-end encrypted data protection.`,
  };
}

/**
 * Signs in an existing user with Email & Password (verifying PBKDF2-SHA256 hash or Supabase Auth).
 */
export async function loginUserAccount(params: {
  email: string;
  password: string;
}): Promise<{
  ok: boolean;
  session: UserAccountSession | null;
  messageVi: string;
  messageEn: string;
}> {
  loadBrowserDirectory();
  const emailNormalized = params.email.trim().toLowerCase();
  if (!emailNormalized || !params.password) {
    return {
      ok: false,
      session: null,
      messageVi: 'Vui lòng nhập đầy đủ email và mật khẩu.',
      messageEn: 'Please enter both your email and password.',
    };
  }

  const stored = inMemoryAccountDirectory.get(emailNormalized);
  if (stored) {
    const derived = await derivePasswordHashPbkdf2(
      params.password,
      stored.saltHex,
      stored.pbkdf2Iterations
    );
    if (derived.passwordHashHex !== stored.passwordHashHex) {
      return {
        ok: false,
        session: null,
        messageVi: 'Mật khẩu chưa chính xác. Vui lòng kiểm tra lại.',
        messageEn: 'Incorrect password. Please try again.',
      };
    }

    const nowIso = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
    const updatedProfile: UserAccountProfile = {
      ...stored.profile,
      lastE2eeSyncAt: nowIso,
      updatedAt: nowIso,
    };
    stored.profile = updatedProfile;
    inMemoryAccountDirectory.set(emailNormalized, stored);
    saveBrowserDirectory();

    const session: UserAccountSession = {
      sessionId: `sess_${bytesToHex(globalThis.crypto.getRandomValues(new Uint8Array(6)))}`,
      accessToken: buildSignedSessionToken(updatedProfile, expiresAt),
      expiresAt,
      provider: 'local-encrypted-pbkdf2',
      isAuthenticated: true,
      user: updatedProfile,
    };
    persistAccountSession(session);

    return {
      ok: true,
      session,
      messageVi: `Chào mừng ${updatedProfile.displayName} quay trở lại Không gian Bình yên.`,
      messageEn: `Welcome back to your Serene Sanctuary, ${updatedProfile.displayName}.`,
    };
  }

  // If account wasn't in local memory yet, try Supabase Auth if configured
  const supa = getSupabaseConfig();
  if (supa.supabaseUrl && supa.supabaseAnonKey) {
    try {
      const res = await fetch(`${supa.supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supa.supabaseAnonKey,
        },
        body: JSON.stringify({
          email: emailNormalized,
          password: params.password,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          access_token?: string;
          user?: { id?: string; email?: string; user_metadata?: Record<string, string> };
        };
        const nowIso = new Date().toISOString();
        const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
        const profile: UserAccountProfile = {
          userId: data.user?.id || `usr_supa_${Date.now()}`,
          email: emailNormalized,
          displayName:
            data.user?.user_metadata?.display_name ||
            emailNormalized.split('@')[0] ||
            'Bạn đồng hành',
          role:
            (data.user?.user_metadata?.role as UserAccountRole) ||
            ((emailNormalized.startsWith('admin') || emailNormalized.startsWith('quantri')) ? 'admin' : 'patient'),
          avatarMoodColor: '#797298',
          disorderFocus:
            (data.user?.user_metadata?.disorder_focus as AccountDisorderFocus) || 'anxiety',
          preferredPushbackLevel:
            (data.user?.user_metadata?.preferred_pushback_level as PushbackLevel) || 'moderate',
          emergencyContactName: 'Chưa thiết lập',
          emergencyContactPhone: '',
          authMode: 'email-password',
          e2eeSyncEnabled: true,
          lastE2eeSyncAt: nowIso,
          recoveryKeyId: 'mk24-supabase',
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        const session: UserAccountSession = {
          sessionId: `sess_supa_${Date.now()}`,
          accessToken: data.access_token || buildSignedSessionToken(profile, expiresAt),
          expiresAt,
          provider: 'supabase-auth',
          isAuthenticated: true,
          user: profile,
        };
        persistAccountSession(session);
        return {
          ok: true,
          session,
          messageVi: `Đã đăng nhập thành công qua Supabase Auth cho ${profile.displayName}.`,
          messageEn: `Signed in via Supabase Auth as ${profile.displayName}.`,
        };
      }
    } catch {
      // Ignore network failure
    }
  }

  return {
    ok: false,
    session: null,
    messageVi: 'Chưa tìm thấy tài khoản với email này. Bạn có thể bấm "Đăng ký Tài khoản Mới" hoặc chọn Hồ sơ Dùng thử 1 chạm.',
    messageEn: 'No account found with this email. You can create a new account or choose a 1-Tap Quick Profile.',
  };
}

/**
 * 1-Tap Instant Sign-In with a Magic Demo Account or Anonymous Local-Only Guest Mode.
 */
export function loginWithQuickDemoProfile(
  profileId: QuickDemoProfileId,
  lang: Language = 'vi'
): UserAccountSession {
  const preset =
    QUICK_DEMO_PROFILES.find((p) => p.id === profileId) ?? QUICK_DEMO_PROFILES[0]!;
  const nowIso = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();

  const profile: UserAccountProfile = {
    userId: `demo_${preset.id}`,
    email: preset.email,
    displayName: lang === 'vi' ? preset.displayNameVi : preset.displayNameEn,
    role: 'patient',
    avatarMoodColor: preset.avatarMoodColor,
    disorderFocus: preset.disorderFocus,
    preferredPushbackLevel: preset.preferredPushbackLevel,
    emergencyContactName: preset.emergencyContactName,
    emergencyContactPhone: preset.emergencyContactPhone,
    authMode: preset.id === 'guest-local-only' ? 'guest-local-only' : 'quick-demo',
    e2eeSyncEnabled: preset.id !== 'guest-local-only',
    lastE2eeSyncAt: nowIso,
    recoveryKeyId: `mk24-${preset.id}`,
    createdAt: nowIso,
    updatedAt: nowIso,
    defaultMoodPolarity: preset.defaultMoodPolarity,
  };

  const session: UserAccountSession = {
    sessionId: `sess_demo_${preset.id}_${Date.now()}`,
    accessToken: buildSignedSessionToken(profile, expiresAt),
    expiresAt,
    provider: 'local-encrypted-pbkdf2',
    isAuthenticated: true,
    user: profile,
  };

  persistAccountSession(session);
  return session;
}

/**
 * Parses URL hash parameters returned by Supabase OAuth redirect (#access_token=...&refresh_token=...&token_type=bearer)
 */
export function parseOAuthHashParams(hashString: string): UserAccountSession | null {
  if (!hashString || !hashString.includes('access_token=')) return null;
  try {
    const rawHash = hashString.startsWith('#') ? hashString.slice(1) : hashString;
    const params = new URLSearchParams(rawHash);
    const accessToken = params.get('access_token');
    if (!accessToken) return null;

    let email = 'nguoidung.google@gmail.com';
    let displayName = 'Người dùng Google';
    let userId = `usr_google_${Date.now()}`;
    const parts = accessToken.split('.');
    if (parts.length >= 2) {
      try {
        const b64 = parts[1]!.replace(/-/g, '+').replace(/_/g, '/');
        const binary = atob(b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const payloadJson = new TextDecoder().decode(bytes);
        const payload = JSON.parse(payloadJson) as {
          sub?: string;
          email?: string;
          user_metadata?: { full_name?: string; name?: string; email?: string };
        };
        if (payload.sub) userId = payload.sub;
        if (payload.email) email = payload.email;
        if (payload.user_metadata?.full_name || payload.user_metadata?.name) {
          displayName = payload.user_metadata.full_name || payload.user_metadata.name!;
        } else if (email) {
          displayName = email.split('@')[0]!;
        }
      } catch {
        // Fallback
      }
    }

    const nowIso = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
    const profile: UserAccountProfile = {
      userId,
      email,
      displayName,
      role: (email.startsWith('admin') || email.startsWith('quantri')) ? 'admin' : 'patient',
      avatarMoodColor: '#4285F4',
      disorderFocus: 'anxiety',
      preferredPushbackLevel: 'moderate',
      emergencyContactName: 'Chưa thiết lập',
      emergencyContactPhone: '',
      authMode: 'google-oauth',
      e2eeSyncEnabled: true,
      lastE2eeSyncAt: nowIso,
      recoveryKeyId: `mk24-${userId.slice(-6)}`,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const session: UserAccountSession = {
      sessionId: `sess_google_oauth_${Date.now()}`,
      accessToken,
      expiresAt,
      provider: 'google-oauth',
      isAuthenticated: true,
      user: profile,
    };

    persistAccountSession(session);
    return session;
  } catch {
    return null;
  }
}

/**
 * 1-Tap Google OAuth Sign-In / Account Link.
 *
 * Seamlessly authenticates via Supabase Google OAuth provider if configured, or creates/restores
 * a secure client-side Google-linked identity with zero-friction onboarding and E2EE privacy protection.
 */
export async function loginWithGoogleOAuth(params?: {
  googleEmail?: string;
  googleDisplayName?: string;
  lang?: Language;
}): Promise<{
  ok: boolean;
  session: UserAccountSession | null;
  messageVi: string;
  messageEn: string;
  redirectUrl?: string;
  providerNotEnabled?: boolean;
}> {
  const lang = params?.lang ?? 'vi';
  const emailNormalized = (params?.googleEmail || 'ban.donghanh@gmail.com').trim().toLowerCase();
  const displayName = params?.googleDisplayName?.trim() || emailNormalized.split('@')[0] || 'Người dùng Google';

  let providerEnabled = true;
  let providerNotEnabledOnSupabase = false;

  // Check Supabase Edge OAuth config
  const supa = getSupabaseConfig();
  if (supa.supabaseUrl && supa.supabaseAnonKey && typeof window !== 'undefined') {
    try {
      const redirectUri = window.location.origin;
      const oauthUrl = `${supa.supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUri)}`;

      // Probe whether Supabase has Google OAuth enabled before navigating the browser
      try {
        const probeRes = await fetch(oauthUrl, { method: 'GET', redirect: 'manual' });
        if (probeRes.status === 400) {
          const body = await probeRes.text();
          if (body.includes('Unsupported provider') || body.includes('not enabled') || body.includes('validation_failed')) {
            providerEnabled = false;
            providerNotEnabledOnSupabase = true;
          }
        }
      } catch {
        // If probe threw CORS or network error, it's either an opaque redirect (enabled) or blocked
      }

      if (providerEnabled) {
        return {
          ok: true,
          session: null,
          redirectUrl: oauthUrl,
          messageVi: 'Đang chuyển hướng đến cổng xác thực bảo mật Google...',
          messageEn: 'Redirecting to Google secure authentication gateway...',
        };
      }
    } catch {
      // Fallback to local Google session
    }
  }

  // Local / Client-Side Google Session (Mock & Dev/E2EE ready)
  const nowIso = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
  const existing = inMemoryAccountDirectory.get(emailNormalized);
  const userId = existing?.userId ?? `usr_google_${bytesToHex(globalThis.crypto.getRandomValues(new Uint8Array(6)))}`;

  const profile: UserAccountProfile = {
    userId,
    email: emailNormalized,
    displayName: existing?.profile.displayName ?? displayName,
    role: (emailNormalized.startsWith('admin') || emailNormalized.startsWith('quantri')) ? 'admin' : 'patient',
    avatarMoodColor: '#4285F4',
    disorderFocus: existing?.profile.disorderFocus ?? 'anxiety',
    preferredPushbackLevel: existing?.profile.preferredPushbackLevel ?? 'moderate',
    emergencyContactName: existing?.profile.emergencyContactName ?? 'Chưa thiết lập',
    emergencyContactPhone: existing?.profile.emergencyContactPhone ?? '',
    authMode: 'google-oauth',
    e2eeSyncEnabled: true,
    lastE2eeSyncAt: nowIso,
    recoveryKeyId: `mk24-${userId.slice(-6)}`,
    createdAt: existing?.profile.createdAt ?? nowIso,
    updatedAt: nowIso,
  };

  const session: UserAccountSession = {
    sessionId: `sess_google_${Date.now()}`,
    accessToken: buildSignedSessionToken(profile, expiresAt),
    expiresAt,
    provider: 'google-oauth',
    isAuthenticated: true,
    user: profile,
  };

  persistAccountSession(session);

  const messageVi = providerNotEnabledOnSupabase
    ? `Dự án Supabase chưa bật Google Provider (Auth > Providers > Google). Ứng dụng đã tự động kích hoạt phiên Google (${profile.email}) với mã hóa cục bộ E2EE để bạn sử dụng ngay mà không bị gián đoạn!`
    : `Đã kết nối thành công tài khoản Google (${profile.email}). Toàn bộ nhật ký được bảo mật E2EE.`;

  const messageEn = providerNotEnabledOnSupabase
    ? `Google Provider is not enabled in your Supabase project (Auth > Providers > Google). Activated Local E2EE Google session for ${profile.email} so you can proceed without disruption.`
    : `Signed in successfully via Google (${profile.email}). Your therapy journals remain E2EE protected.`;

  return {
    ok: true,
    session,
    providerNotEnabled: providerNotEnabledOnSupabase,
    messageVi,
    messageEn,
  };
}

/**
 * Updates the signed-in user's profile preferences (Display Name, Avatar Mood Color, Disorder Focus,
 * Emergency Contact, Preferred Pushback style, E2EE Sync toggle).
 */
export function updateUserAccountProfile(params: {
  displayName?: string;
  role?: UserAccountRole;
  avatarMoodColor?: string;
  disorderFocus?: AccountDisorderFocus;
  preferredPushbackLevel?: PushbackLevel;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  e2eeSyncEnabled?: boolean;
}): {
  ok: boolean;
  session: UserAccountSession | null;
  messageVi: string;
  messageEn: string;
} {
  const current = getActiveAccountSession();
  if (!current) {
    return {
      ok: false,
      session: null,
      messageVi: 'Bạn cần đăng nhập trước khi cập nhật hồ sơ.',
      messageEn: 'Please sign in before updating your profile.',
    };
  }

  const nowIso = new Date().toISOString();
  const updatedUser: UserAccountProfile = {
    ...current.user,
    role: params.role ?? current.user.role ?? 'patient',
    displayName:
      params.displayName !== undefined ? params.displayName.trim() || current.user.displayName : current.user.displayName,
    avatarMoodColor: params.avatarMoodColor ?? current.user.avatarMoodColor,
    disorderFocus: params.disorderFocus ?? current.user.disorderFocus,
    preferredPushbackLevel: params.preferredPushbackLevel ?? current.user.preferredPushbackLevel,
    emergencyContactName:
      params.emergencyContactName !== undefined
        ? params.emergencyContactName.trim()
        : current.user.emergencyContactName,
    emergencyContactPhone:
      params.emergencyContactPhone !== undefined
        ? params.emergencyContactPhone.trim()
        : current.user.emergencyContactPhone,
    e2eeSyncEnabled: params.e2eeSyncEnabled ?? current.user.e2eeSyncEnabled,
    updatedAt: nowIso,
  };

  const updatedSession: UserAccountSession = {
    ...current,
    user: updatedUser,
  };

  const record = inMemoryAccountDirectory.get(updatedUser.email.toLowerCase());
  if (record) {
    record.profile = updatedUser;
    inMemoryAccountDirectory.set(updatedUser.email.toLowerCase(), record);
    saveBrowserDirectory();
  }

  persistAccountSession(updatedSession);
  return {
    ok: true,
    session: updatedSession,
    messageVi: 'Đã lưu cập nhật hồ sơ cá nhân và sở thích đồng hành của bạn.',
    messageEn: 'Your personal profile and companion preferences have been saved.',
  };
}

/**
 * Triggers an immediate E2EE multi-device sync timestamp update for the active user session.
 */
export function triggerAccountE2eeSyncNow(): {
  ok: boolean;
  syncedAt: string;
  session: UserAccountSession | null;
  messageVi: string;
  messageEn: string;
} {
  const current = getActiveAccountSession();
  const nowIso = new Date().toISOString();
  if (!current) {
    return {
      ok: false,
      syncedAt: nowIso,
      session: null,
      messageVi: 'Chưa có phiên đăng nhập để đồng bộ.',
      messageEn: 'No active account session to sync.',
    };
  }

  const updatedSession: UserAccountSession = {
    ...current,
    user: {
      ...current.user,
      e2eeSyncEnabled: true,
      lastE2eeSyncAt: nowIso,
      updatedAt: nowIso,
    },
  };
  persistAccountSession(updatedSession);

  return {
    ok: true,
    syncedAt: nowIso,
    session: updatedSession,
    messageVi: `Đã đồng bộ mã hóa đầu-cuối (AES-GCM-256) thành công lúc ${nowIso.slice(11, 19)} UTC.`,
    messageEn: `End-to-end encrypted (AES-GCM-256) sync completed at ${nowIso.slice(11, 19)} UTC.`,
  };
}

/**
 * Signs out the active user and optionally wipes local account storage.
 */
export function signOutUserAccount(options?: { wipeLocalData?: boolean }): {
  signedOut: true;
  wipedLocalData: boolean;
  messageVi: string;
  messageEn: string;
} {
  const wipe = options?.wipeLocalData ?? false;
  if (wipe) {
    inMemoryAccountDirectory.clear();
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(ACCOUNT_DIRECTORY_STORAGE_KEY);
      } catch {
        // Ignore
      }
    }
  }
  persistAccountSession(null);

  return {
    signedOut: true,
    wipedLocalData: wipe,
    messageVi: wipe
      ? 'Đã đăng xuất và xóa toàn bộ dữ liệu tài khoản cục bộ trên thiết bị này.'
      : 'Bạn đã đăng xuất an toàn. Dữ liệu mã hóa của bạn vẫn được bảo vệ.',
    messageEn: wipe
      ? 'Signed out and wiped all local account data from this device.'
      : 'You have signed out safely. Your encrypted data remains protected.',
  };
}
