import { editUser, getUser } from '@library/handlers';
import {
  cookiePolicy,
  emailPolicy,
  jsonPolicy,
  originPolicy,
  otpPolicy,
  passwordPolicy,
} from '@library/policies';
import { deCipher, generateHash } from '@library/utilities';
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

    const enforcePasswordPolicy = passwordPolicy({
      password: body.password,
      confirmPassword: body.confirmPassword,
      type: 'register',
    });
    if (!enforcePasswordPolicy.ok) {
      return NextResponse.json(enforcePasswordPolicy, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const emailCookie = await cookiePolicy({ action: 'read', name: 'email' });
    if (!emailCookie.ok) {
      return NextResponse.json(emailCookie, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const otpCookie = await cookiePolicy({ action: 'read', name: 'otp' });
    if (!otpCookie.ok) {
      return NextResponse.json(otpCookie, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const decryptEmailCookie = deCipher({
      cipher: emailCookie.data.cookie.value,
    });
    if (!decryptEmailCookie.ok) {
      return NextResponse.json(decryptEmailCookie, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const decryptOtpCookie = deCipher({
      cipher: otpCookie.data.cookie.value,
    });
    if (!decryptOtpCookie.ok) {
      return NextResponse.json(decryptOtpCookie, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const enforceEmailPolicy = emailPolicy({
      email: decryptEmailCookie.data.message,
      returnFieldName: null,
    });
    if (!enforceEmailPolicy.ok) {
      return NextResponse.json(enforceEmailPolicy, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const userGet = await getUser({
      by: { email: enforceEmailPolicy.data.email },
    });
    if (!userGet.ok) {
      return NextResponse.json(userGet, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const enforceOtpPolicy = otpPolicy({
      otp: decryptOtpCookie.data.message,
      validate: {
        passwordOtp: userGet.data.user.password_reset_otp,
        passwordOtpExpiry: userGet.data.user.password_reset_expiry,
      },
      returnFieldName: null,
    });
    if (!enforceOtpPolicy.ok) {
      return NextResponse.json(enforceOtpPolicy, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const hash = generateHash({ value: enforcePasswordPolicy.data.password });
    if (!hash.ok) {
      return NextResponse.json(hash, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const user = await editUser({
      by: { email: enforceEmailPolicy.data.email },
      user: {
        hash: hash.data.hash,
        password_reset_attempts: 3,
      },
    });
    if (!user.ok) {
      return NextResponse.json(user, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const deleteCookie = await cookiePolicy({
      action: 'delete',
      name: 'email',
    });

    if (!deleteCookie.ok) {
      return NextResponse.json(deleteCookie, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const deleteOTPCookie = await cookiePolicy({
      action: 'delete',
      name: 'otp',
    });

    if (!deleteOTPCookie.ok) {
      return NextResponse.json(deleteOTPCookie, {
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
