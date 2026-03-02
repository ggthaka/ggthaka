import { editUser, getUser } from '@library/handlers';
import {
  cookiePolicy,
  emailPolicy,
  jsonPolicy,
  originPolicy,
} from '@library/policies';
import { enCipher, generateOtp, sendOtp } from '@library/utilities';
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

    const enforceEmailPolicy = emailPolicy({
      email: body.email,
      returnFieldName: 'email',
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

    const otp = generateOtp();
    if (!otp.ok) {
      return NextResponse.json(otp, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const updateOTP = await editUser({
      by: { id: user.data.user.id },
      user: {
        password_reset_otp: otp.data.otp,
        password_reset_expiry: new Date(
          Date.now() + 5 * 60 * 1000,
        ).toISOString(),
      },
    });
    if (!updateOTP.ok) {
      return NextResponse.json(updateOTP, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const sendEmail = await sendOtp({
      to: enforceEmailPolicy.data.email,
      subject: 'Password Reset OTP',
      template: 'password-reset-otp',
      data: { otp: otp.data.otp },
    });
    if (!sendEmail.ok) {
      return NextResponse.json(sendEmail, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const cipher = enCipher({ message: enforceEmailPolicy.data.email });
    if (!cipher.ok) {
      return NextResponse.json(cipher, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const cookie = await cookiePolicy({
      action: 'create',
      name: 'email',
      value: cipher.data.cipher,
    });

    if (!cookie.ok) {
      return NextResponse.json(cookie, {
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
