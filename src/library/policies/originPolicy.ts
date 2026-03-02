import { NextRequest } from 'next/server';

const ALLOWED_ORIGINS = process.env.ORIGINS?.split(',') || [];

export default async function originPolicy(
  request: NextRequest
): Promise<API.Success | API.Failure> {
  try {
    const origin = request.headers.get('origin');

    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return {
        ok: false,
        error: {
          message: `Origin ${origin} not allowed.`,
          origin: 'policies',
          method: 'originPolicy',
        },
      };
    }

    return {
      ok: true,
      data: {
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
        },
      },
    };
  } catch (e: unknown) {
    const error = e as Error;
    return {
      ok: false,
      error: {
        message: 'Unable to check origin.',
        origin: 'policies',
        method: 'originPolicy',
        raw: {
          name: error.name,
          message: error.message,
        },
      },
    };
  }
}
