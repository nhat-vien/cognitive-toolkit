import {
  verifyServerSessionToken,
  previewGuestLocalDataForUpgrade,
  upgradeGuestToAccountWithConsent,
} from '../../../../clinical/auth-account.ts';

/**
 * V2 Guest-to-Account Import API (`GET/POST /api/v2/import`) — `DATA_ARCHITECTURE.md` & `AUTH-04`
 * - GET previews local guest categories before import.
 * - POST imports only explicitly consented categories with idempotency protection (`idempotencyKey`).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const guestUserId = searchParams.get('guestUserId') || '';
  const preview = previewGuestLocalDataForUpgrade(guestUserId);

  return Response.json(
    {
      status: 'ok',
      preview,
    },
    { status: 200, headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization') || '';
  const verified = verifyServerSessionToken(authHeader);

  if (!verified.valid || !verified.userId) {
    return Response.json(
      {
        status: 'unauthorized',
        errorCode: verified.errorCode,
        messageVi: 'Cần phiên đăng nhập tài khoản xác thực hợp lệ để nhập dữ liệu từ chế độ Khách.',
      },
      {
        status: verified.errorCode === 'guest_or_demo_not_authenticated' ? 403 : 401,
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  }

  const body = (await request.json()) as {
    guestUserId?: string;
    explicitConsentGranted?: boolean;
    consentedCategories?: Array<'journals' | 'sessions' | 'plan_items' | 'safety_plan'>;
    idempotencyKey?: string;
    wipeGuestLocalAfterImport?: boolean;
  };

  if (!body.idempotencyKey || !body.guestUserId) {
    return Response.json(
      {
        status: 'unprocessable',
        errorCode: 'missing_guest_id_or_idempotency_key',
      },
      { status: 422, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const result = upgradeGuestToAccountWithConsent({
    guestUserId: body.guestUserId,
    targetAccountSessionToken: authHeader,
    explicitConsentGranted: body.explicitConsentGranted === true,
    consentedCategories: body.consentedCategories ?? [],
    idempotencyKey: body.idempotencyKey,
    wipeGuestLocalAfterImport: body.wipeGuestLocalAfterImport,
  });

  return Response.json(result, {
    status: result.status === 'unauthorized' ? 401 : 200,
    headers: { 'Cache-Control': 'no-store' },
  });
}
