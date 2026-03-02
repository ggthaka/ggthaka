import {
  cookiePolicy,
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
import { NextRequest, NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname) {
    const enforceOriginPolicy = await originPolicy(request);
    if (!enforceOriginPolicy.ok) {
      return NextResponse.json(enforceOriginPolicy, {
        status: 400,
      });
    }

    if (pathname.startsWith('/site/public/')) {
      const cookie = await cookiePolicy({
        action: 'delete',
        name: 'session_id',
      });

      if (!cookie.ok) {
        return NextResponse.next();
      }

      return NextResponse.next();
    }

    if (pathname.startsWith('/site/private/authentication')) {
      const cookie = await cookiePolicy({ action: 'read', name: 'email' });
      if (!cookie.ok) {
        const loginUrl = new URL(
          '/site/public/authentication/reset?proxy=true',
          request.url,
        );
        return NextResponse.redirect(loginUrl);
      }

      return NextResponse.next();
    }

    if (pathname.startsWith('/site/private/authorization')) {
      const cookie = await cookiePolicy({ action: 'read', name: 'session_id' });
      if (!cookie.ok) {
        const loginUrl = new URL(
          '/site/public/authentication/login?proxy=true',
          request.url,
        );
        return NextResponse.redirect(loginUrl);
      }

      return NextResponse.next();
    }

    if (pathname === '/api/public/authentication/login') {
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
        type: 'login',
      });
      if (!enforcePasswordPolicy.ok) {
        return NextResponse.json(enforcePasswordPolicy, {
          status: 400,
          headers: enforceOriginPolicy.data.headers,
        });
      }

      return NextResponse.next();
    }

    if (pathname === '/api/public/authentication/register') {
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

      return NextResponse.next();
    }

    if (pathname === '/api/public/authentication/reset') {
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

      return NextResponse.next();
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/public/authentication/login',
    '/api/public/authentication/register',
    '/api/public/authentication/reset',
    '/site/public/:path*',
    '/site/private/authentication/:path*',
    '/site/private/authorization/:path*',
  ],
};
