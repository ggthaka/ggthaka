import { getUser } from '@library/handlers';
import {
  cookiePolicy,
  emailPolicy,
  jsonPolicy,
  originPolicy,
  otpPolicy,
} from '@library/policies';
import { deCipher, enCipher } from '@library/utilities';
import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS(request: NextRequest) {
  const enforceOriginPolicy = await originPolicy(request);
  if (!enforceOriginPolicy.ok) {
    return NextResponse.json(enforceOriginPolicy, {
      status: 400,
    });
  }

  return new NextResponse(null, {
    status: 204,
    headers: enforceOriginPolicy.data.headers,
  });
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<API.Success | API.Failure>> {
  try {
    const enforceOriginPolicy = await originPolicy(request);
    if (!enforceOriginPolicy.ok) {
      return NextResponse.json(enforceOriginPolicy, {
        status: 400,
      });
    }

    const enforceJsonPolicy = await jsonPolicy(request);
    if (!enforceJsonPolicy.ok) {
      return NextResponse.json(enforceJsonPolicy, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const body = enforceJsonPolicy.data;

    const cookie = await cookiePolicy({ action: 'read', name: 'email' });
    if (!cookie.ok) {
      return NextResponse.json(cookie, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const decryptEmailCookie = deCipher({ cipher: cookie.data.cookie.value });
    if (!decryptEmailCookie.ok) {
      return NextResponse.json(decryptEmailCookie, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const enforceEmailPolicy = emailPolicy({
      email: decryptEmailCookie.data.message,
      returnFieldName: 'none',
    });
    if (!enforceEmailPolicy.ok) {
      return NextResponse.json(enforceEmailPolicy, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const user = await getUser({
      by: { email: enforceEmailPolicy.data.email },
    });
    if (!user.ok) {
      return NextResponse.json(user, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const enforceOtpPolicy = otpPolicy({
      otp: body.otp,
      validate: {
        passwordOtp: user.data.user.password_reset_otp,
        passwordOtpExpiry: user.data.user.password_reset_expiry,
      },
      returnFieldName: 'otp',
    });
    if (!enforceOtpPolicy.ok) {
      return NextResponse.json(enforceOtpPolicy, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const encryptOtp = enCipher({ message: user.data.user.password_reset_otp });
    if (!encryptOtp.ok) {
      return NextResponse.json(encryptOtp, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const otpCookie = await cookiePolicy({
      action: 'create',
      name: 'otp',
      value: encryptOtp.data.cipher,
    });

    if (!otpCookie.ok) {
      return NextResponse.json(otpCookie, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    return NextResponse.json(
      { ok: true },
      { status: 200, headers: enforceOriginPolicy.data.headers },
    );
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json(
      {
        ok: false,
        error: {
          message: 'Internal server error.',
          origin: 'routes',
          method: 'POST',
          raw: {
            name: error.name,
            message: error.message,
          },
        },
      },
      { status: 500 },
    );
  }
}
