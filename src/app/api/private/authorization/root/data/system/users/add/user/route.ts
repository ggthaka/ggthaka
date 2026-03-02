import { addUser, getSession, getUser } from '@library/handlers';
import {
  booleanPolicy,
  cookiePolicy,
  countryPolicy,
  emailPolicy,
  firstNamePolicy,
  hashPolicy,
  idPolicy,
  jsonPolicy,
  lastNamePolicy,
  originPolicy,
  otpPolicy,
  rolePolicy,
  sessionPolicy,
  sexPolicy,
  timestampPolicy,
  yearOfBirthPolicy,
} from '@library/policies';
import { deCipher, generateUuid } from '@library/utilities';
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

    const getSessionCookie = await cookiePolicy({
      action: 'read',
      name: 'session_id',
    });
    if (!getSessionCookie.ok) {
      return NextResponse.json(getSessionCookie, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const sessionId = deCipher({ cipher: getSessionCookie.data.cookie.value });
    if (!sessionId.ok) {
      return NextResponse.json(sessionId, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const session = await getSession({ by: { id: sessionId.data.message } });
    if (!session.ok) {
      return NextResponse.json(session, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const enforceSessionPolicy = sessionPolicy({
      expiry: session.data.session.expired,
    });
    if (!enforceSessionPolicy.ok) {
      return NextResponse.json(enforceSessionPolicy, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const user = await getUser({ by: { id: session.data.session.user_id } });
    if (!user.ok) {
      return NextResponse.json(user, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const enforceRolePolicy = rolePolicy({
      userRole: user.data.user.role,
      targetRole: 'root',
    });
    if (!enforceRolePolicy.ok) {
      return NextResponse.json(enforceRolePolicy, {
        status: 403,
        headers: enforceOriginPolicy.data.headers,
      });
    }

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

    const enforceHashPolicy = hashPolicy({
      hash: body.hash,
      returnFieldName: 'hash',
    });
    if (!enforceHashPolicy.ok) {
      return NextResponse.json(enforceHashPolicy, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const enforceRoleInputPolicy = rolePolicy({
      userRole: body.role,
      returnFieldName: 'role',
    });
    if (!enforceRoleInputPolicy.ok) {
      return NextResponse.json(enforceRoleInputPolicy, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    if (body.passwordResetOtp) {
      const enforceOtpPolicy = otpPolicy({
        otp: body.passwordResetOtp,
        returnFieldName: 'passwordResetOtp',
      });
      if (!enforceOtpPolicy.ok) {
        return NextResponse.json(enforceOtpPolicy, {
          status: 400,
          headers: enforceOriginPolicy.data.headers,
        });
      }
    }

    const enforcePasswordResetExpiryTimestampPolicy = timestampPolicy({
      timestamp: body.passwordResetExpiry,
      returnFieldName: 'passwordResetExpiry',
    });
    if (!enforcePasswordResetExpiryTimestampPolicy.ok) {
      return NextResponse.json(enforcePasswordResetExpiryTimestampPolicy, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const enforceFirstNamePolicy = firstNamePolicy({
      firstName: body.firstName,
      returnFieldName: 'firstName',
    });
    if (!enforceFirstNamePolicy.ok) {
      return NextResponse.json(enforceFirstNamePolicy, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const enforceLastNamePolicy = lastNamePolicy({
      lastName: body.lastName,
      returnFieldName: 'lastName',
    });
    if (!enforceLastNamePolicy.ok) {
      return NextResponse.json(enforceLastNamePolicy, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const enforceYearOfBirthPolicy = yearOfBirthPolicy({
      yearOfBirth: body.yearOfBirth,
      returnFieldName: 'yearOfBirth',
    });
    if (!enforceYearOfBirthPolicy.ok) {
      return NextResponse.json(enforceYearOfBirthPolicy, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const enforceSexPolicy = sexPolicy({
      sex: body.sex,
      returnFieldName: 'sex',
    });
    if (!enforceSexPolicy.ok) {
      return NextResponse.json(enforceSexPolicy, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const enforceCountryPolicy = countryPolicy({
      country: body.country,
      returnFieldName: 'country',
    });
    if (!enforceCountryPolicy.ok) {
      return NextResponse.json(enforceCountryPolicy, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const enforceDisabledPolicy = booleanPolicy({
      value: body.disabled,
      returnFieldName: 'disabled',
    });
    if (!enforceDisabledPolicy.ok) {
      return NextResponse.json(enforceDisabledPolicy, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const enforceVerifiedPolicy = booleanPolicy({
      value: body.verified,
      returnFieldName: 'verified',
    });
    if (!enforceVerifiedPolicy.ok) {
      return NextResponse.json(enforceVerifiedPolicy, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const enforceCreatedTimestampPolicy = timestampPolicy({
      timestamp: body.created,
      returnFieldName: 'created',
    });
    if (!enforceCreatedTimestampPolicy.ok) {
      return NextResponse.json(enforceCreatedTimestampPolicy, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const enforceUpdatedTimestampPolicy = timestampPolicy({
      timestamp: body.updated,
      returnFieldName: 'updated',
    });
    if (!enforceUpdatedTimestampPolicy.ok) {
      return NextResponse.json(enforceUpdatedTimestampPolicy, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const incomingPasswordResetAttempts = Number(body.passwordResetAttempts);
    if (
      Number.isNaN(incomingPasswordResetAttempts) ||
      !Number.isInteger(incomingPasswordResetAttempts) ||
      incomingPasswordResetAttempts < 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            message:
              'Password reset attempts must be a valid non-negative whole number.',
            origin: 'routes',
            method: 'POST',
            field: 'passwordResetAttempts',
          },
        },
        {
          status: 400,
          headers: enforceOriginPolicy.data.headers,
        },
      );
    }

    let userId = '';

    if (body.id) {
      const enforceIdPolicy = idPolicy({
        id: body.id,
        returnFieldName: 'id',
      });
      if (!enforceIdPolicy.ok) {
        return NextResponse.json(enforceIdPolicy, {
          status: 400,
          headers: enforceOriginPolicy.data.headers,
        });
      }

      userId = enforceIdPolicy.data.id;
    } else {
      const uuid = generateUuid();
      if (!uuid.ok) {
        return NextResponse.json(uuid, {
          status: 400,
          headers: enforceOriginPolicy.data.headers,
        });
      }

      userId = uuid.data.uuid;
    }

    const now = new Date().toISOString();

    const userResult = await addUser({
      user: {
        id: userId,
        email: enforceEmailPolicy.data.email,
        hash: enforceHashPolicy.data.hash,
        role: enforceRoleInputPolicy.data.userRole,
        password_reset_otp: body.passwordResetOtp
          ? String(body.passwordResetOtp).toUpperCase()
          : null,
        password_reset_expiry:
          enforcePasswordResetExpiryTimestampPolicy.data.timestamp,
        password_reset_attempts: incomingPasswordResetAttempts,
        first_name: enforceFirstNamePolicy.data.firstName,
        last_name: enforceLastNamePolicy.data.lastName,
        year_of_birth: enforceYearOfBirthPolicy.data.yearOfBirth,
        sex: enforceSexPolicy.data.sex,
        country: enforceCountryPolicy.data.country,
        disabled: enforceDisabledPolicy.data.value,
        verified: enforceVerifiedPolicy.data.value,
        created: enforceCreatedTimestampPolicy.data.timestamp ?? now,
        updated: enforceUpdatedTimestampPolicy.data.timestamp ?? now,
      },
    });
    if (!userResult.ok) {
      return NextResponse.json(userResult, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    return NextResponse.json(
      { ok: true, data: userResult.data },
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
