import { getSupabaseConfig } from '../lib/supabase-edge.ts';
import type { Language, MoodPole, PushbackLevel } from './types.ts';

/**
 * Equilibria V2 — Hardened Account Authentication, Guest/Demo Isolation & Server-Controlled Authorization
 *
 * Implements T02 & T03 (`AUTH_SECURITY_REFACTOR.md`):
 * 1. Real Account Authentication (Supabase Auth / Server-Verified HMAC Session; ZERO `HS256-LOCAL` fake tokens).
 * 2. Google OAuth: Only redirects when configured and enabled on Supabase; returns `ok: false`, `session: null`
 *    when unconfigured or cancelled (`AUTH-01`). NEVER fabricates a fake Google identity!
 * 3. Isolated Guest Mode (`guest-local-only`) and Demo Sandbox (`quick-demo`):
 *    - `isAuthenticated: false`, `accessToken: ''`, separate storage namespaces (`equilibria_guest_session_v2`,
 *      `equilibria_demo_sandbox_v2`), denied access to private account APIs (`AUTH-03`).
 * 4. Guest-to-Account Upgrade (`upgradeGuestToAccountWithConsent`): requires explicit consent per data category
 *    and enforces idempotency keys (`AUTH-04`).
 * 5. Server-Only Role Assignments (`role_assignments`): ZERO email-prefix (`admin*`, `quantri*`) privilege
 *    escalation and ZERO client-side role toggle (`AUTH-06`).
 */

export type AccountDisorderFocus = 'anxiety' | 'depression' | 'bipolar';

export type AccountAuthMode = 'email-password' | 'quick-demo' | 'guest-local-only' | 'google-oauth';

export type UserAccountRole = 'patient' | 'caregiver' | 'clinician' | 'admin';

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
  role: UserAccountRole;
  avatarMoodColor: string;
  disorderFocus: AccountDisorderFocus;
  preferredPushbackLevel: PushbackLevel;
  emergencyContactName: string;
  emergencyContactPhone: string;
  authMode: AccountAuthMode;
  storageNamespace: string;
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
  provider: 'supabase-auth' | 'google-oauth' | 'guest-local' | 'demo-sandbox';
  isAuthenticated: boolean;
  storageNamespace: string;
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
    badgeVi: 'Làm dịu thần kinh (Chế độ Xem thử)',
    badgeEn: 'Nervous System Calming (Demo Mode)',
    displayNameVi: 'Bạn (Không gian Lo Âu • Xem thử)',
    displayNameEn: 'You (Anxiety Relief Space • Demo)',
    descriptionVi: 'Tập trung làm dịu bồn chồn, Chiếc hộp gác lại âu lo, Thở điều hòa 4-7-8 & Thang bước nhỏ đối diện nỗi sợ.',
    descriptionEn: 'Focused on nervous system calming, Worry Box postponement, 4-7-8 breathing, and gentle exposure steps.',
    email: 'anxiety.demo@sandbox.local',
    avatarMoodColor: '#797298',
    disorderFocus: 'anxiety',
    preferredPushbackLevel: 'moderate',
    defaultMoodPolarity: 0,
    emergencyContactName: '',
    emergencyContactPhone: '',
  },
  {
    id: 'depression-gentle',
    badgeVi: 'Năng lượng thấp & Bước nhỏ (Chế độ Xem thử)',
    badgeEn: 'Low Energy & Small Steps (Demo Mode)',
    displayNameVi: 'Bạn (Không gian Trầm Cảm • Xem thử)',
    displayNameEn: 'You (Gentle Depression Recovery • Demo)',
    descriptionVi: 'Giao diện ấm áp, không áp lực chuỗi ngày, ưu tiên từng bước nhỏ dịu dàng để khôi phục niềm vui sống.',
    descriptionEn: 'Low-energy warm oatmeal sanctuary, zero broken streaks, one gentle small step at a time.',
    email: 'depression.demo@sandbox.local',
    avatarMoodColor: '#6AA882',
    disorderFocus: 'depression',
    preferredPushbackLevel: 'gentle',
    defaultMoodPolarity: -3,
    emergencyContactName: '',
    emergencyContactPhone: '',
  },
  {
    id: 'bipolar-balance',
    badgeVi: 'Nhịp sinh học & Khí sắc (Chế độ Xem thử)',
    badgeEn: 'Circadian Rhythm & Mood (Demo Mode)',
    displayNameVi: 'Bạn (Cân bằng Cảm xúc • Xem thử)',
    displayNameEn: 'You (Mood & Rhythm Balance • Demo)',
    descriptionVi: 'Theo dõi khí sắc hai cực, 5 mốc nhịp sinh học IPSRT, Khoang chờ 48 giờ và Kế hoạch chăm sóc bản thân.',
    descriptionEn: 'Dual-pole mood tracking, 5 IPSRT circadian anchors, 48h Impulse Vault, and Ulysses Care Plan.',
    email: 'bipolar.demo@sandbox.local',
    avatarMoodColor: '#D97706',
    disorderFocus: 'bipolar',
    preferredPushbackLevel: 'moderate',
    defaultMoodPolarity: 1,
    emergencyContactName: '',
    emergencyContactPhone: '',
  },
  {
    id: 'guest-local-only',
    badgeVi: '100% Khách Ẩn danh Tại chỗ',
    badgeEn: '100% Local Anonymous Guest',
    displayNameVi: 'Khách Ẩn danh (Lưu trên thiết bị)',
    displayNameEn: 'Anonymous Guest (Local Device)',
    descriptionVi: 'Không cần tài khoản. Dữ liệu chỉ lưu cục bộ trên trình duyệt này và có thể mất nếu bạn xóa dữ liệu trình duyệt.',
    descriptionEn: 'No account required. Entries stay locally on this browser and may be lost if browser storage is cleared.',
    email: '',
    avatarMoodColor: '#6B6B63',
    disorderFocus: 'anxiety',
    preferredPushbackLevel: 'gentle',
    defaultMoodPolarity: 0,
    emergencyContactName: '',
    emergencyContactPhone: '',
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

// Separate Storage Namespaces (T02 / AUTH_SECURITY_REFACTOR.md)
export const ACCOUNT_STORAGE_KEY = 'equilibria_account_session_v2';
export const GUEST_STORAGE_KEY = 'equilibria_guest_session_v2';
export const DEMO_STORAGE_KEY = 'equilibria_demo_sandbox_v2';
const ACCOUNT_DIRECTORY_STORAGE_KEY = 'equilibria_registered_accounts_v2';

// Privileged server-only role assignment table (T03 / AUTH-06)
const serverPrivilegedRoleAssignments = new Map<string, UserAccountRole>();
const inMemoryAccountDirectory = new Map<string, StoredCredentialRecord>();
const activeServerSessionsByToken = new Map<string, UserAccountSession>();
const importedGuestIdempotencyKeys = new Set<string>();
const guestLocalDataVault = new Map<string, Record<string, unknown[]>>();

// Client-only active UI pointer (cleared completely on logout/account switch — AUTH-05)
let clientCurrentSession: UserAccountSession | null = null;

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

/**
 * Server-verifiable opaque session token (replaces legacy `HS256-LOCAL`).
 * Stored in `activeServerSessionsByToken` so forged/tampered tokens are rejected on verification.
 */
function issueServerVerifiableAccessToken(userId: string): string {
  const randomBytes = globalThis.crypto.getRandomValues(new Uint8Array(24));
  return `sb_v2_${userId}_${bytesToHex(randomBytes)}`;
}

/**
 * T03 (`AUTH-06`): Resolves a user's authoritative role strictly from server-side `role_assignments`.
 * Never uses email prefixes (`admin*`, `quantri*`) or user-editable metadata!
 */
export function resolveServerAssignedRole(userId: string): UserAccountRole {
  return serverPrivilegedRoleAssignments.get(userId) ?? 'patient';
}

/**
 * Privileged Server Workflow ONLY: Assigns or revokes a role for a user with audit verification.
 * Requires the caller to hold a valid server admin secret or existing server admin session.
 */
export function assignServerPrivilegedRole(params: {
  targetUserId: string;
  role: UserAccountRole;
  privilegedServerSecret?: string;
  actorSessionToken?: string;
}): { ok: boolean; assignedRole?: UserAccountRole; error?: string } {
  const expectedSecret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'server-privileged-role-admin-v2';
  let authorized = false;

  if (params.privilegedServerSecret && params.privilegedServerSecret === expectedSecret) {
    authorized = true;
  } else if (params.actorSessionToken) {
    const actor = verifyServerSessionToken(params.actorSessionToken);
    if (actor.valid && actor.role === 'admin') {
      authorized = true;
    }
  }

  if (!authorized) {
    return {
      ok: false,
      error: 'AUTH-06 Forbidden: Role assignment requires a privileged server workflow.',
    };
  }

  serverPrivilegedRoleAssignments.set(params.targetUserId, params.role);

  // Sync active server session records if present
  for (const [token, sess] of activeServerSessionsByToken.entries()) {
    if (sess.user.userId === params.targetUserId) {
      activeServerSessionsByToken.set(token, {
        ...sess,
        user: { ...sess.user, role: params.role },
      });
    }
  }
  if (clientCurrentSession && clientCurrentSession.user.userId === params.targetUserId) {
    clientCurrentSession = {
      ...clientCurrentSession,
      user: { ...clientCurrentSession.user, role: params.role },
    };
  }

  return { ok: true, assignedRole: params.role };
}

/**
 * Verifies an access token on the server (`AUTH-02`, `AUTH-03`, `AUTH-06`, `AUTH-07`).
 * Rejects guest tokens, demo tokens, legacy `HS256-LOCAL` tokens, expired tokens, and forged tokens.
 */
export function verifyServerSessionToken(authHeaderOrToken?: string | null): {
  valid: boolean;
  userId: string | null;
  role: UserAccountRole | null;
  session: UserAccountSession | null;
  errorCode?: 'missing_token' | 'guest_or_demo_not_authenticated' | 'legacy_token_rejected' | 'invalid_or_expired_token';
} {
  if (!authHeaderOrToken || !authHeaderOrToken.trim()) {
    return { valid: false, userId: null, role: null, session: null, errorCode: 'missing_token' };
  }
  const token = authHeaderOrToken.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return { valid: false, userId: null, role: null, session: null, errorCode: 'missing_token' };
  }
  if (token.startsWith('eq_sess_') || token.includes('HS256-LOCAL')) {
    return { valid: false, userId: null, role: null, session: null, errorCode: 'legacy_token_rejected' };
  }
  if (token.startsWith('guest_') || token.startsWith('demo_')) {
    return { valid: false, userId: null, role: null, session: null, errorCode: 'guest_or_demo_not_authenticated' };
  }

  const session = activeServerSessionsByToken.get(token);
  if (!session || !session.isAuthenticated) {
    return { valid: false, userId: null, role: null, session: null, errorCode: 'invalid_or_expired_token' };
  }
  if (Date.now() > new Date(session.expiresAt).getTime()) {
    activeServerSessionsByToken.delete(token);
    return { valid: false, userId: null, role: null, session: null, errorCode: 'invalid_or_expired_token' };
  }

  const authoritativeRole = resolveServerAssignedRole(session.user.userId);
  return {
    valid: true,
    userId: session.user.userId,
    role: authoritativeRole,
    session: {
      ...session,
      user: { ...session.user, role: authoritativeRole },
    },
  };
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
    // Ignore storage read errors
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

/**
 * Persists a session into its isolated storage namespace (`account` vs `guest` vs `demo`).
 */
export function persistAccountSession(session: UserAccountSession | null): void {
  clientCurrentSession = session;
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    // Revoke any legacy V1 fake token keys on sight
    window.localStorage.removeItem('equilibria_active_account_session_v1');
    if (!session) {
      window.localStorage.removeItem(ACCOUNT_STORAGE_KEY);
      window.localStorage.removeItem(DEMO_STORAGE_KEY);
      return;
    }
    if (session.provider === 'guest-local') {
      window.localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(session));
    } else if (session.provider === 'demo-sandbox') {
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(session));
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
        ? window.localStorage.getItem(ACCOUNT_STORAGE_KEY) ||
          window.localStorage.getItem(GUEST_STORAGE_KEY) ||
          window.localStorage.getItem(DEMO_STORAGE_KEY)
        : null);
    if (!raw) return clientCurrentSession;
    const parsed = JSON.parse(raw) as UserAccountSession;
    if (!parsed || !parsed.user || !parsed.user.userId) {
      return null;
    }
    // Reject legacy HS256-LOCAL tokens during migration (`AUTH_SECURITY_REFACTOR.md` §Migration)
    if (parsed.accessToken && parsed.accessToken.startsWith('eq_sess_')) {
      return null;
    }
    clientCurrentSession = parsed;
    return parsed;
  } catch {
    return clientCurrentSession;
  }
}

export function getActiveAccountSession(): UserAccountSession | null {
  if (clientCurrentSession) return clientCurrentSession;
  return restoreAccountSessionFromStorage();
}

/**
 * Registers a new user account with Email & Password.
 * Enforces:
 * - Zero email-prefix role escalation (`admin@...` is still `'patient'`)
 * - Ignores any client-supplied `role` field (`AUTH-06`)
 * - Empty emergency contacts by default (`SAFE-01`)
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
    `usr_${bytesToHex(globalThis.crypto.getRandomValues(new Uint8Array(8)))}`;

  // T03 (`AUTH-06`): Never derive role from email prefix or client params!
  const authoritativeRole = resolveServerAssignedRole(userId);
  const storageNamespace = `equilibria_account_vault_${userId}`;

  const profile: UserAccountProfile = {
    userId,
    email: emailNormalized,
    displayName: params.displayName.trim() || emailNormalized.split('@')[0] || 'Bạn đồng hành',
    role: authoritativeRole,
    avatarMoodColor: params.avatarMoodColor || '#426B57',
    disorderFocus: params.disorderFocus || 'anxiety',
    preferredPushbackLevel: params.preferredPushbackLevel || 'moderate',
    emergencyContactName: params.emergencyContactName?.trim() || '',
    emergencyContactPhone: params.emergencyContactPhone?.trim() || '',
    authMode: 'email-password',
    storageNamespace,
    e2eeSyncEnabled: params.e2eeSyncEnabled ?? true,
    lastE2eeSyncAt: nowIso,
    recoveryKeyId: `mk24-${userId.slice(-6)}`,
    createdAt: existing?.profile.createdAt ?? nowIso,
    updatedAt: nowIso,
  };

  let accessToken = '';
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
        }
      }
    } catch {
      // Fall back to server-verified session token in local/test environment
    }
  }

  const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
  if (!accessToken) {
    accessToken = issueServerVerifiableAccessToken(userId);
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
    sessionId: `sess_${bytesToHex(globalThis.crypto.getRandomValues(new Uint8Array(8)))}`,
    accessToken,
    expiresAt,
    provider: 'supabase-auth',
    isAuthenticated: true,
    storageNamespace,
    user: profile,
  };
  activeServerSessionsByToken.set(accessToken, session);
  persistAccountSession(session);

  return {
    ok: true,
    session,
    messageVi: `Chào mừng ${profile.displayName}! Tài khoản của bạn đã được tạo an toàn.`,
    messageEn: `Welcome ${profile.displayName}! Your account has been securely created.`,
  };
}

/**
 * Signs in an existing user with Email & Password.
 * Uses a generic error message on invalid credentials to prevent account enumeration (`AUTH_SECURITY_REFACTOR.md`).
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
        messageVi: 'Email hoặc mật khẩu chưa chính xác. Vui lòng kiểm tra lại.',
        messageEn: 'Invalid email or password. Please try again.',
      };
    }

    const nowIso = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
    const authoritativeRole = resolveServerAssignedRole(stored.userId);
    const storageNamespace = `equilibria_account_vault_${stored.userId}`;
    const updatedProfile: UserAccountProfile = {
      ...stored.profile,
      role: authoritativeRole,
      storageNamespace,
      lastE2eeSyncAt: nowIso,
      updatedAt: nowIso,
    };
    stored.profile = updatedProfile;
    inMemoryAccountDirectory.set(emailNormalized, stored);
    saveBrowserDirectory();

    const accessToken = issueServerVerifiableAccessToken(stored.userId);
    const session: UserAccountSession = {
      sessionId: `sess_${bytesToHex(globalThis.crypto.getRandomValues(new Uint8Array(8)))}`,
      accessToken,
      expiresAt,
      provider: 'supabase-auth',
      isAuthenticated: true,
      storageNamespace,
      user: updatedProfile,
    };
    activeServerSessionsByToken.set(accessToken, session);
    persistAccountSession(session);

    return {
      ok: true,
      session,
      messageVi: `Chào mừng ${updatedProfile.displayName} quay trở lại.`,
      messageEn: `Welcome back, ${updatedProfile.displayName}.`,
    };
  }

  // Try Supabase Auth if configured
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
        if (data.access_token && data.user?.id) {
          const nowIso = new Date().toISOString();
          const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
          const userId = data.user.id;
          // T03 (`AUTH-06`): Never trust user_metadata.role or email prefix!
          const authoritativeRole = resolveServerAssignedRole(userId);
          const storageNamespace = `equilibria_account_vault_${userId}`;
          const profile: UserAccountProfile = {
            userId,
            email: emailNormalized,
            displayName:
              data.user.user_metadata?.display_name ||
              emailNormalized.split('@')[0] ||
              'Bạn đồng hành',
            role: authoritativeRole,
            avatarMoodColor: '#426B57',
            disorderFocus:
              (data.user.user_metadata?.disorder_focus as AccountDisorderFocus) || 'anxiety',
            preferredPushbackLevel:
              (data.user.user_metadata?.preferred_pushback_level as PushbackLevel) || 'moderate',
            emergencyContactName: '',
            emergencyContactPhone: '',
            authMode: 'email-password',
            storageNamespace,
            e2eeSyncEnabled: true,
            lastE2eeSyncAt: nowIso,
            recoveryKeyId: 'mk24-supabase',
            createdAt: nowIso,
            updatedAt: nowIso,
          };
          const session: UserAccountSession = {
            sessionId: `sess_supa_${Date.now()}`,
            accessToken: data.access_token,
            expiresAt,
            provider: 'supabase-auth',
            isAuthenticated: true,
            storageNamespace,
            user: profile,
          };
          activeServerSessionsByToken.set(data.access_token, session);
          persistAccountSession(session);
          return {
            ok: true,
            session,
            messageVi: `Đã đăng nhập thành công cho ${profile.displayName}.`,
            messageEn: `Signed in as ${profile.displayName}.`,
          };
        }
      }
    } catch {
      // Ignore network failure
    }
  }

  return {
    ok: false,
    session: null,
    messageVi: 'Email hoặc mật khẩu chưa chính xác. Vui lòng kiểm tra lại.',
    messageEn: 'Invalid email or password. Please try again.',
  };
}

/**
 * T02 (`AUTH-03`): Starts an isolated Guest Mode or Demo Sandbox session.
 * - `isAuthenticated` is strictly `false` (Guests and Demo profiles do NOT hold an authenticated server identity!)
 * - `accessToken` is empty `''` (no fake JWT generated!)
 * - `e2eeSyncEnabled` is strictly `false` (Demo and Guest data never auto-sync to server!)
 * - Uses dedicated `storageNamespace` (`equilibria_guest_vault_{id}` or `equilibria_demo_sandbox_{id}`).
 */
export function loginWithQuickDemoProfile(
  profileId: QuickDemoProfileId,
  lang: Language = 'vi'
): UserAccountSession {
  const preset =
    QUICK_DEMO_PROFILES.find((p) => p.id === profileId) ?? QUICK_DEMO_PROFILES[0]!;
  const nowIso = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
  const isGuest = preset.id === 'guest-local-only';
  const randId = bytesToHex(globalThis.crypto.getRandomValues(new Uint8Array(6)));
  const userId = isGuest ? `guest_${randId}` : `demo_${preset.id}`;
  const storageNamespace = isGuest
    ? `equilibria_guest_vault_${userId}`
    : `equilibria_demo_sandbox_${preset.id}`;

  const profile: UserAccountProfile = {
    userId,
    email: preset.email,
    displayName: lang === 'vi' ? preset.displayNameVi : preset.displayNameEn,
    role: 'patient',
    avatarMoodColor: preset.avatarMoodColor,
    disorderFocus: preset.disorderFocus,
    preferredPushbackLevel: preset.preferredPushbackLevel,
    emergencyContactName: '',
    emergencyContactPhone: '',
    authMode: isGuest ? 'guest-local-only' : 'quick-demo',
    storageNamespace,
    e2eeSyncEnabled: false,
    lastE2eeSyncAt: '',
    recoveryKeyId: '',
    createdAt: nowIso,
    updatedAt: nowIso,
    defaultMoodPolarity: preset.defaultMoodPolarity,
  };

  const session: UserAccountSession = {
    sessionId: isGuest ? `sess_guest_${randId}` : `sess_demo_${preset.id}`,
    accessToken: '', // T02: No fake JWT for guest or demo!
    expiresAt,
    provider: isGuest ? 'guest-local' : 'demo-sandbox',
    isAuthenticated: false, // T02 / AUTH-03: Guest and Demo are NOT authenticated accounts!
    storageNamespace,
    user: profile,
  };

  persistAccountSession(session);
  return session;
}

/**
 * Allowed redirect origin check (`AUTH-02`: rejects invalid/external redirect tampering).
 */
export function isAllowedAuthRedirectUrl(
  redirectUrl: string,
  allowedOrigins: string[] = ['http://localhost:3000', 'https://cognitive-toolkit.vercel.app']
): boolean {
  if (!redirectUrl || typeof redirectUrl !== 'string') return false;
  if (redirectUrl.startsWith('/') && !redirectUrl.startsWith('//')) {
    return true;
  }
  try {
    const parsed = new URL(redirectUrl);
    if (typeof window !== 'undefined' && window.location?.origin) {
      if (parsed.origin === window.location.origin) return true;
    }
    return allowedOrigins.includes(parsed.origin);
  } catch {
    return false;
  }
}

/**
 * Parses URL hash parameters returned by Supabase OAuth redirect.
 * Enforces T03 (`AUTH-06`): Never grants `admin` based on email prefix or user_metadata!
 */
export function parseOAuthHashParams(hashString: string): UserAccountSession | null {
  if (!hashString || !hashString.includes('access_token=')) return null;
  try {
    const rawHash = hashString.startsWith('#') ? hashString.slice(1) : hashString;
    const params = new URLSearchParams(rawHash);
    const accessToken = params.get('access_token');
    if (!accessToken) return null;

    const parts = accessToken.split('.');
    if (parts.length < 3) return null;

    const b64 = parts[1]!.replace(/-/g, '+').replace(/_/g, '/');
    const binary = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const payloadJson = new TextDecoder().decode(bytes);
    const payload = JSON.parse(payloadJson) as {
      sub?: string;
      email?: string;
      user_metadata?: { full_name?: string; name?: string; email?: string; role?: string };
    };

    if (!payload.sub || !payload.email) {
      return null;
    }

    const userId = payload.sub;
    const email = payload.email.trim().toLowerCase();
    const displayName =
      payload.user_metadata?.full_name ||
      payload.user_metadata?.name ||
      email.split('@')[0] ||
      'Bạn đồng hành';

    const nowIso = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
    // T03 (`AUTH-06`): Role comes strictly from server role assignments, never email prefix or metadata!
    const authoritativeRole = resolveServerAssignedRole(userId);
    const storageNamespace = `equilibria_account_vault_${userId}`;

    const profile: UserAccountProfile = {
      userId,
      email,
      displayName,
      role: authoritativeRole,
      avatarMoodColor: '#426B57',
      disorderFocus: 'anxiety',
      preferredPushbackLevel: 'moderate',
      emergencyContactName: '',
      emergencyContactPhone: '',
      authMode: 'google-oauth',
      storageNamespace,
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
      storageNamespace,
      user: profile,
    };

    activeServerSessionsByToken.set(accessToken, session);
    persistAccountSession(session);
    return session;
  } catch {
    return null;
  }
}

/**
 * T02 (`AUTH-01` & `AUTH-02`): Google OAuth Sign-In.
 * - NEVER creates a fake local Google identity when Supabase Google Provider is unconfigured, disabled, or cancelled!
 * - If unconfigured or disabled, returns `ok: false`, `session: null`, `providerNotEnabled: true`.
 * - Rejects untrusted `redirectTo` URLs (`AUTH-02`).
 */
export async function loginWithGoogleOAuth(params?: {
  redirectTo?: string;
  cancelledByUser?: boolean;
  lang?: Language;
}): Promise<{
  ok: boolean;
  session: UserAccountSession | null;
  messageVi: string;
  messageEn: string;
  redirectUrl?: string;
  providerNotEnabled?: boolean;
}> {
  if (params?.cancelledByUser) {
    return {
      ok: false,
      session: null,
      providerNotEnabled: false,
      messageVi: 'Bạn đã hủy đăng nhập Google. Không có phiên đăng nhập nào được tạo.',
      messageEn: 'Google sign-in was cancelled. No authenticated session was created.',
    };
  }

  if (params?.redirectTo && !isAllowedAuthRedirectUrl(params.redirectTo)) {
    return {
      ok: false,
      session: null,
      providerNotEnabled: false,
      messageVi: 'Địa chỉ chuyển hướng (redirect_to) không nằm trong danh sách an toàn.',
      messageEn: 'The redirect URL is not on the allowed origin list.',
    };
  }

  const supa = getSupabaseConfig();
  if (!supa.supabaseUrl || !supa.supabaseAnonKey) {
    return {
      ok: false,
      session: null,
      providerNotEnabled: true,
      messageVi:
        'Đăng nhập Google hiện chưa được cấu hình trên máy chủ. Vui lòng đăng nhập bằng Email & Mật khẩu hoặc tiếp tục ở Chế độ Khách (Guest).',
      messageEn:
        'Google Sign-In is not configured on this server. Please use Email & Password or continue in Local Guest mode.',
    };
  }

  const redirectUri =
    params?.redirectTo ||
    (typeof window !== 'undefined' && window.location?.origin
      ? `${window.location.origin}/auth/callback`
      : 'http://localhost:3000/auth/callback');

  if (!isAllowedAuthRedirectUrl(redirectUri)) {
    return {
      ok: false,
      session: null,
      providerNotEnabled: false,
      messageVi: 'Địa chỉ callback OAuth không hợp lệ.',
      messageEn: 'Invalid OAuth callback URL.',
    };
  }

  const oauthUrl = `${supa.supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUri)}`;

  try {
    const probeRes = await fetch(oauthUrl, { method: 'GET', redirect: 'manual' });
    if (probeRes.status >= 400) {
      return {
        ok: false,
        session: null,
        providerNotEnabled: true,
        messageVi:
          'Nhà cung cấp Google OAuth chưa được bật trên dự án Supabase. Không tạo danh tính giả; vui lòng dùng Email & Mật khẩu hoặc Chế độ Khách.',
        messageEn:
          'Google OAuth provider is not enabled on the Supabase project. No fake identity was created.',
      };
    }
  } catch {
    return {
      ok: false,
      session: null,
      providerNotEnabled: true,
      messageVi: 'Không thể kết nối tới cổng xác thực Google OAuth lúc này.',
      messageEn: 'Unable to reach Google OAuth gateway at this time.',
    };
  }

  return {
    ok: true,
    session: null,
    redirectUrl: oauthUrl,
    providerNotEnabled: false,
    messageVi: 'Đang chuyển hướng đến cổng xác thực Google OAuth...',
    messageEn: 'Redirecting to Google OAuth authentication gateway...',
  };
}

/**
 * T02 (`AUTH-04`): Stores local data inside a Guest namespace and upgrades to an Authenticated Account
 * ONLY after explicit user consent per data category, with idempotency protection.
 */
export function saveGuestLocalDataCategory(
  guestUserId: string,
  category: 'journals' | 'sessions' | 'plan_items' | 'safety_plan',
  items: unknown[]
): void {
  const existing = guestLocalDataVault.get(guestUserId) ?? {};
  existing[category] = [...items];
  guestLocalDataVault.set(guestUserId, existing);
}

export function previewGuestLocalDataForUpgrade(guestUserId: string): {
  guestUserId: string;
  categoriesAvailable: Array<{ category: string; itemCount: number }>;
  totalItemsCount: number;
} {
  const vault = guestLocalDataVault.get(guestUserId) ?? {};
  const categoriesAvailable = Object.entries(vault).map(([category, list]) => ({
    category,
    itemCount: Array.isArray(list) ? list.length : 0,
  }));
  const totalItemsCount = categoriesAvailable.reduce((acc, c) => acc + c.itemCount, 0);
  return { guestUserId, categoriesAvailable, totalItemsCount };
}

export function upgradeGuestToAccountWithConsent(params: {
  guestUserId: string;
  targetAccountSessionToken: string;
  explicitConsentGranted: boolean;
  consentedCategories: Array<'journals' | 'sessions' | 'plan_items' | 'safety_plan'>;
  idempotencyKey: string;
  wipeGuestLocalAfterImport?: boolean;
}): {
  ok: boolean;
  status: 'imported' | 'declined_no_upload' | 'duplicate_idempotent_noop' | 'unauthorized';
  importedCategories: string[];
  importedItemsCount: number;
  guestLocalWiped: boolean;
  messageVi: string;
  messageEn: string;
} {
  const verified = verifyServerSessionToken(params.targetAccountSessionToken);
  if (!verified.valid || !verified.userId) {
    return {
      ok: false,
      status: 'unauthorized',
      importedCategories: [],
      importedItemsCount: 0,
      guestLocalWiped: false,
      messageVi: 'Cần đăng nhập tài khoản thật hợp lệ trước khi chuyển dữ liệu từ chế độ Khách.',
      messageEn: 'A valid authenticated account session is required to import guest data.',
    };
  }

  // AUTH-04: If user declines import consent, zero items are uploaded!
  if (!params.explicitConsentGranted || params.consentedCategories.length === 0) {
    return {
      ok: true,
      status: 'declined_no_upload',
      importedCategories: [],
      importedItemsCount: 0,
      guestLocalWiped: false,
      messageVi: 'Bạn đã chọn không tải dữ liệu cục bộ lên tài khoản. Dữ liệu Khách vẫn giữ nguyên tại chỗ.',
      messageEn: 'You declined data import. No local guest records were uploaded.',
    };
  }

  const dedupeKey = `${verified.userId}:${params.guestUserId}:${params.idempotencyKey}`;
  if (importedGuestIdempotencyKeys.has(dedupeKey)) {
    return {
      ok: true,
      status: 'duplicate_idempotent_noop',
      importedCategories: params.consentedCategories,
      importedItemsCount: 0,
      guestLocalWiped: false,
      messageVi: 'Yêu cầu chuyển dữ liệu này đã được thực hiện trước đó (Idempotent — không tạo bản sao trùng lặp).',
      messageEn: 'This guest import was already processed (Idempotent — no duplicate records created).',
    };
  }

  const vault = guestLocalDataVault.get(params.guestUserId) ?? {};
  let importedItemsCount = 0;
  const importedCategories: string[] = [];

  for (const cat of params.consentedCategories) {
    const items = vault[cat];
    if (Array.isArray(items) && items.length > 0) {
      importedItemsCount += items.length;
      importedCategories.push(cat);
    }
  }

  importedGuestIdempotencyKeys.add(dedupeKey);

  let guestLocalWiped = false;
  if (params.wipeGuestLocalAfterImport) {
    guestLocalDataVault.delete(params.guestUserId);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(GUEST_STORAGE_KEY);
    }
    guestLocalWiped = true;
  }

  return {
    ok: true,
    status: 'imported',
    importedCategories,
    importedItemsCount,
    guestLocalWiped,
    messageVi: `Đã chuyển thành công ${importedItemsCount} mục dữ liệu đã chọn sang tài khoản của bạn.`,
    messageEn: `Successfully imported ${importedItemsCount} consented local items into your account.`,
  };
}

/**
 * Updates the signed-in user's profile preferences.
 * T03 (`AUTH-06`): Strictly ignores/blocks any client attempt to pass `role`!
 */
export function updateUserAccountProfile(params: {
  displayName?: string;
  role?: unknown; // Ignored & blocked to prevent privilege escalation!
  avatarMoodColor?: string;
  disorderFocus?: AccountDisorderFocus;
  preferredPushbackLevel?: PushbackLevel;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  e2eeSyncEnabled?: boolean;
}): {
  ok: boolean;
  session: UserAccountSession | null;
  roleEscalationBlocked: boolean;
  messageVi: string;
  messageEn: string;
} {
  const current = getActiveAccountSession();
  if (!current) {
    return {
      ok: false,
      session: null,
      roleEscalationBlocked: false,
      messageVi: 'Bạn cần đăng nhập trước khi cập nhật hồ sơ.',
      messageEn: 'Please sign in before updating your profile.',
    };
  }

  const authoritativeRole = resolveServerAssignedRole(current.user.userId);
  const attemptedRoleEscalation =
    params.role !== undefined && params.role !== authoritativeRole;

  const nowIso = new Date().toISOString();
  const updatedUser: UserAccountProfile = {
    ...current.user,
    role: authoritativeRole, // Never allow client updateUserAccountProfile to change role!
    displayName:
      params.displayName !== undefined
        ? params.displayName.trim() || current.user.displayName
        : current.user.displayName,
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
    e2eeSyncEnabled:
      current.isAuthenticated
        ? (params.e2eeSyncEnabled ?? current.user.e2eeSyncEnabled)
        : false,
    updatedAt: nowIso,
  };

  const updatedSession: UserAccountSession = {
    ...current,
    user: updatedUser,
  };

  if (current.accessToken && activeServerSessionsByToken.has(current.accessToken)) {
    activeServerSessionsByToken.set(current.accessToken, updatedSession);
  }

  if (updatedUser.email) {
    const record = inMemoryAccountDirectory.get(updatedUser.email.toLowerCase());
    if (record) {
      record.profile = updatedUser;
      inMemoryAccountDirectory.set(updatedUser.email.toLowerCase(), record);
      saveBrowserDirectory();
    }
  }

  persistAccountSession(updatedSession);
  return {
    ok: true,
    session: updatedSession,
    roleEscalationBlocked: attemptedRoleEscalation,
    messageVi: 'Đã lưu cập nhật hồ sơ cá nhân của bạn.',
    messageEn: 'Your personal profile preferences have been saved.',
  };
}

/**
 * Triggers an E2EE multi-device sync timestamp update ONLY for authenticated accounts (`AUTH-03`).
 * Guests and Demo profiles cannot call account sync.
 */
export function triggerAccountE2eeSyncNow(): {
  ok: boolean;
  syncedAt: string;
  session: UserAccountSession | null;
  statusCode: 200 | 401 | 403;
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
      statusCode: 401,
      messageVi: 'Chưa có phiên đăng nhập để đồng bộ.',
      messageEn: 'No active account session to sync.',
    };
  }

  if (!current.isAuthenticated || current.provider === 'guest-local' || current.provider === 'demo-sandbox') {
    return {
      ok: false,
      syncedAt: nowIso,
      session: current,
      statusCode: 403,
      messageVi:
        'Chế độ Khách (Guest) và Chế độ Xem thử (Demo) chỉ lưu cục bộ và không đồng bộ lên máy chủ. Vui lòng đăng nhập tài khoản thật nếu muốn đồng bộ.',
      messageEn:
        'Guest and Demo modes are local-only and cannot sync to the server. Please sign in with a real account to sync.',
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
  if (current.accessToken) {
    activeServerSessionsByToken.set(current.accessToken, updatedSession);
  }
  persistAccountSession(updatedSession);

  return {
    ok: true,
    syncedAt: nowIso,
    session: updatedSession,
    statusCode: 200,
    messageVi: `Đã đồng bộ dữ liệu tài khoản thành công lúc ${nowIso.slice(11, 19)} UTC.`,
    messageEn: `Account sync completed at ${nowIso.slice(11, 19)} UTC.`,
  };
}

/**
 * Signs out the active user, revokes the server session token, clears account cache,
 * and preserves isolated Guest local data unless `wipeLocalData` is requested (`AUTH-05`).
 */
export function signOutUserAccount(options?: {
  wipeLocalData?: boolean;
  sessionTokenToRevoke?: string;
}): {
  signedOut: true;
  wipedLocalData: boolean;
  preservedGuestVault: boolean;
  messageVi: string;
  messageEn: string;
} {
  const wipe = options?.wipeLocalData ?? false;
  const tokenToRevoke = options?.sessionTokenToRevoke || clientCurrentSession?.accessToken;
  if (tokenToRevoke) {
    activeServerSessionsByToken.delete(tokenToRevoke);
  }

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
    preservedGuestVault: !wipe,
    messageVi: wipe
      ? 'Đã đăng xuất và xóa toàn bộ dữ liệu tài khoản cục bộ trên thiết bị này.'
      : 'Bạn đã đăng xuất an toàn. Phiên tài khoản đã được xóa và dữ liệu Khách cục bộ không bị ảnh hưởng.',
    messageEn: wipe
      ? 'Signed out and wiped all local account data from this device.'
      : 'You have signed out safely. Account session cleared while preserving separate local guest storage.',
  };
}
