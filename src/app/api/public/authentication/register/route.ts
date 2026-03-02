import { addUser, noUser } from '@library/handlers';
import {
  countryPolicy,
  emailPolicy,
  firstNamePolicy,
  jsonPolicy,
  lastNamePolicy,
  originPolicy,
  passwordPolicy,
  sexPolicy,
  yearOfBirthPolicy,
} from '@library/policies';
import { generateHash, generateUuid } from '@library/utilities';
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

    const checkUser = await noUser({
      by: {
        email: enforceEmailPolicy.data.email,
      },
    });
    if (!checkUser.ok) {
      return NextResponse.json(checkUser, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const uuid = generateUuid();
    if (!uuid.ok) {
      return NextResponse.json(uuid, {
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

    const user = await addUser({
      user: {
        id: uuid.data.uuid,
        email: enforceEmailPolicy.data.email,
        hash: hash.data.hash,
        role: 'user',
        password_reset_attempts: 3,
        first_name: enforceFirstNamePolicy.data.firstName,
        last_name: enforceLastNamePolicy.data.lastName,
        year_of_birth: enforceYearOfBirthPolicy.data.yearOfBirth,
        sex: enforceSexPolicy.data.sex,
        country: enforceCountryPolicy.data.country,
        disabled: false,
        verified: false,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      },
    });
    if (!user.ok) {
      return NextResponse.json(user, {
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
