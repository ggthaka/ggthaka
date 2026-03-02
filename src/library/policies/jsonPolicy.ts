import { NextRequest } from 'next/server';

export default async function jsonPolicy(
  request: NextRequest
): Promise<API.Success | API.Failure> {
  try {
    const body = await request.json();
    return {
      ok: true,
      data: body,
    };
  } catch (e: unknown) {
    const error = e as Error;
    return {
      ok: false,
      error: {
        message: 'Malformed JSON body.',
        origin: 'policies',
        method: 'jsonPolicy',
        raw: {
          name: error.name,
          message: error.message,
        },
      },
    };
  }
}
