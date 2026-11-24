import {
  QUICK_DEMO_PROFILES,
  SANCTUARY_NAVIGATION_ITEMS,
  loginUserAccount,
  loginWithGoogleOAuth,
  loginWithQuickDemoProfile,
  registerUserAccount,
  signOutUserAccount,
  triggerAccountE2eeSyncNow,
  updateUserAccountProfile,
  upgradeGuestToAccountWithConsent,
  verifyServerSessionToken,
  type AccountDisorderFocus,
  type QuickDemoProfileId,
} from '../../../../clinical/auth-account.ts';
import type { Language, PushbackLevel } from '../../../../clinical/types.ts';

/**
 * Next.js Serverless API Route: /api/v1/auth
 * Hardened in V2 (T02 & T03):
 * - GET verifies the caller's `Authorization: Bearer <token>` header instead of reading a global
 *   in-memory variable (`AUTH-05`, cross-request leak prevention).
 * - Rejects legacy `HS256-LOCAL` tokens, unauthenticated Guest/Demo tokens on private actions (`AUTH-03`),
 *   and client-supplied `role` privilege escalation (`AUTH-06`).
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const verified = verifyServerSessionToken(authHeader);

  return Response.json(
    {
      ok: true,
      session: verified.valid ? verified.session : null,
      isAuthenticated: verified.valid,
      quickDemoProfiles: QUICK_DEMO_PROFILES,
      navigationItems: SANCTUARY_NAVIGATION_ITEMS,
    },
    {
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      action?: 'register' | 'login' | 'quick-demo' | 'google-oauth' | 'upgrade-guest' | 'sync-now' | 'logout';
      email?: string;
      password?: string;
      displayName?: string;
      disorderFocus?: AccountDisorderFocus;
      preferredPushbackLevel?: PushbackLevel;
      avatarMoodColor?: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
      profileId?: QuickDemoProfileId;
      language?: Language;
      wipeLocalData?: boolean;
      redirectTo?: string;
      guestUserId?: string;
      explicitConsentGranted?: boolean;
      consentedCategories?: Array<'journals' | 'sessions' | 'plan_items' | 'safety_plan'>;
      idempotencyKey?: string;
    };

    const action = body.action || 'login';
    const authHeader = req.headers.get('authorization');

    if (action === 'register') {
      const result = await registerUserAccount({
        email: body.email || '',
        password: body.password || '',
        displayName: body.displayName || '',
        disorderFocus: body.disorderFocus,
        preferredPushbackLevel: body.preferredPushbackLevel,
        avatarMoodColor: body.avatarMoodColor,
        emergencyContactName: body.emergencyContactName,
        emergencyContactPhone: body.emergencyContactPhone,
      });
      return Response.json(result, { status: result.ok ? 201 : 400 });
    }

    if (action === 'google-oauth') {
      const result = await loginWithGoogleOAuth({
        redirectTo: body.redirectTo,
        lang: body.language || 'vi',
      });
      return Response.json(result, { status: result.ok ? 200 : 400 });
    }

    if (action === 'quick-demo') {
      const session = loginWithQuickDemoProfile(
        body.profileId || 'anxiety-calm',
        body.language || 'vi'
      );
      return Response.json({
        ok: true,
        session,
        messageVi: `Đã kích hoạt chế độ cục bộ: ${session.user.displayName}.`,
        messageEn: `Activated local profile: ${session.user.displayName}.`,
      });
    }

    if (action === 'upgrade-guest') {
      const upgradeRes = upgradeGuestToAccountWithConsent({
        guestUserId: body.guestUserId || '',
        targetAccountSessionToken: authHeader || '',
        explicitConsentGranted: Boolean(body.explicitConsentGranted),
        consentedCategories: body.consentedCategories || [],
        idempotencyKey: body.idempotencyKey || 'default-key',
        wipeGuestLocalAfterImport: Boolean(body.wipeLocalData),
      });
      return Response.json(upgradeRes, {
        status: upgradeRes.status === 'unauthorized' ? 401 : 200,
      });
    }

    if (action === 'sync-now') {
      const verified = verifyServerSessionToken(authHeader);
      if (!verified.valid) {
        return Response.json(
          {
            ok: false,
            errorCode: verified.errorCode,
            messageVi: 'Từ chối đồng bộ: Cần đăng nhập tài khoản xác thực hợp lệ (Chế độ Khách/Demo không đồng bộ máy chủ).',
            messageEn: 'Sync denied: A valid authenticated account session is required (Guest/Demo modes are local-only).',
          },
          { status: verified.errorCode === 'guest_or_demo_not_authenticated' ? 403 : 401 }
        );
      }
      const syncResult = triggerAccountE2eeSyncNow();
      return Response.json(syncResult, { status: syncResult.statusCode });
    }

    if (action === 'logout') {
      const out = signOutUserAccount({
        wipeLocalData: body.wipeLocalData,
        sessionTokenToRevoke: authHeader?.replace(/^Bearer\s+/i, '').trim(),
      });
      return Response.json({ ok: true, ...out });
    }

    const loginResult = await loginUserAccount({
      email: body.email || '',
      password: body.password || '',
    });
    return Response.json(loginResult, { status: loginResult.ok ? 200 : 401 });
  } catch (err) {
    return Response.json(
      {
        ok: false,
        messageVi: 'Không thể xử lý yêu cầu xác thực.',
        messageEn: 'Failed to process authentication request.',
        error: err instanceof Error ? err.message : 'unknown_error',
      },
      { status: 400 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const verified = verifyServerSessionToken(authHeader);
    if (!verified.valid) {
      return Response.json(
        {
          ok: false,
          messageVi: 'Bạn cần đăng nhập tài khoản xác thực để cập nhật hồ sơ trên máy chủ.',
          messageEn: 'Authentication required to update server profile.',
        },
        { status: 401 }
      );
    }

    const body = (await req.json()) as {
      displayName?: string;
      role?: unknown;
      avatarMoodColor?: string;
      disorderFocus?: AccountDisorderFocus;
      preferredPushbackLevel?: PushbackLevel;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
      e2eeSyncEnabled?: boolean;
    };

    if (body.role !== undefined && body.role !== verified.role) {
      return Response.json(
        {
          ok: false,
          errorCode: 'role_escalation_forbidden',
          messageVi: 'Từ chối truy cập (403): Người dùng không được phép tự thay đổi quyền (role) từ phía client.',
          messageEn: 'Forbidden (403): Client-side role modification is strictly prohibited.',
        },
        { status: 403 }
      );
    }

    const updated = updateUserAccountProfile(body);
    return Response.json(updated, { status: updated.ok ? 200 : 400 });
  } catch (err) {
    return Response.json(
      {
        ok: false,
        messageVi: 'Không thể cập nhật hồ sơ cá nhân.',
        messageEn: 'Failed to update profile.',
        error: err instanceof Error ? err.message : 'unknown_error',
      },
      { status: 400 }
    );
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const wipe = searchParams.get('wipe') === 'true';
  const authHeader = req.headers.get('authorization');
  const result = signOutUserAccount({
    wipeLocalData: wipe,
    sessionTokenToRevoke: authHeader?.replace(/^Bearer\s+/i, '').trim(),
  });
  return Response.json({ ok: true, ...result });
}
