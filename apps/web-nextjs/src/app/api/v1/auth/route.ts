import { NextRequest, NextResponse } from 'next/server';
import {
  QUICK_DEMO_PROFILES,
  SANCTUARY_NAVIGATION_ITEMS,
  getActiveAccountSession,
  loginUserAccount,
  loginWithQuickDemoProfile,
  registerUserAccount,
  signOutUserAccount,
  triggerAccountE2eeSyncNow,
  updateUserAccountProfile,
  type AccountDisorderFocus,
  type QuickDemoProfileId,
} from '../../../../clinical/auth-account.ts';
import type { Language, PushbackLevel } from '../../../../clinical/types.ts';

/**
 * Next.js Serverless API Route: /api/v1/auth
 * Supports Email & Password Registration/Login (PBKDF2-SHA256 + optional Supabase Auth),
 * 1-Tap Quick Demo Profiles, Profile Customization, E2EE Sync Trigger, and Sign Out.
 */
export async function GET() {
  const activeSession = getActiveAccountSession();
  return NextResponse.json({
    ok: true,
    session: activeSession,
    quickDemoProfiles: QUICK_DEMO_PROFILES,
    navigationItems: SANCTUARY_NAVIGATION_ITEMS,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      action?: 'register' | 'login' | 'quick-demo' | 'sync-now' | 'logout';
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
    };

    const action = body.action || 'login';

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
      return NextResponse.json(result, { status: result.ok ? 201 : 400 });
    }

    if (action === 'quick-demo') {
      const session = loginWithQuickDemoProfile(
        body.profileId || 'anxiety-calm',
        body.language || 'vi'
      );
      return NextResponse.json({
        ok: true,
        session,
        messageVi: `Đã kích hoạt nhanh ${session.user.displayName}.`,
        messageEn: `Activated quick profile ${session.user.displayName}.`,
      });
    }

    if (action === 'sync-now') {
      const syncResult = triggerAccountE2eeSyncNow();
      return NextResponse.json(syncResult, { status: syncResult.ok ? 200 : 400 });
    }

    if (action === 'logout') {
      const out = signOutUserAccount({ wipeLocalData: body.wipeLocalData });
      return NextResponse.json({ ok: true, ...out });
    }

    const loginResult = await loginUserAccount({
      email: body.email || '',
      password: body.password || '',
    });
    return NextResponse.json(loginResult, { status: loginResult.ok ? 200 : 401 });
  } catch (err) {
    return NextResponse.json(
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

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      displayName?: string;
      avatarMoodColor?: string;
      disorderFocus?: AccountDisorderFocus;
      preferredPushbackLevel?: PushbackLevel;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
      e2eeSyncEnabled?: boolean;
    };
    const updated = updateUserAccountProfile(body);
    return NextResponse.json(updated, { status: updated.ok ? 200 : 400 });
  } catch (err) {
    return NextResponse.json(
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

export async function DELETE(req: NextRequest) {
  const wipe = req.nextUrl.searchParams.get('wipe') === 'true';
  const result = signOutUserAccount({ wipeLocalData: wipe });
  return NextResponse.json({ ok: true, ...result });
}
