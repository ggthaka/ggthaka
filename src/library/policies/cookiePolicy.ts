'use server';

import { cookies } from 'next/headers';

interface CookieProps {
  action: 'create' | 'read' | 'delete';
  name: string;
  value?: string;
  options?: {
    maxAge?: number;
    expires?: Date;
    domain?: string;
    path?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: boolean | 'lax' | 'strict' | 'none';
    priority?: 'low' | 'medium' | 'high';
    partitioned?: boolean;
  };
}

export default async function cookiePolicy({
  action,
  name,
  value,
  options = {},
}: CookieProps): Promise<API.Success | API.Failure> {
  const cookieStore = await cookies();

  if (!action || !['create', 'read', 'delete'].includes(action)) {
    return {
      ok: false,
      error: {
        message:
          'Invalid cookie action. Must be "create", "read", or "delete".',
        origin: 'policies',
        method: 'cookiePolicy',
      },
    };
  }

  if (!name || typeof name !== 'string') {
    return {
      ok: false,
      error: {
        message: 'Invalid cookie name. It must be a non-empty string.',
        origin: 'policies',
        method: 'cookiePolicy',
      },
    };
  }

  try {
    if (action === 'create') {
      if (value === undefined || value === null) {
        return {
          ok: false,
          error: {
            message: 'Cookie value is required when creating a cookie.',
            origin: 'policies',
            method: 'cookiePolicy',
          },
        };
      }

      cookieStore.set({
        name,
        value,
        ...options,
      });

      return {
        ok: true,
        data: {
          message: `Cookie "${name}" created successfully.`,
          cookie: { name, value, ...options },
        },
      };
    }

    if (action === 'read') {
      const cookie = cookieStore.get(name);

      if (!cookie) {
        return {
          ok: false,
          error: {
            message: `Cookie "${name}" not found.`,
            origin: 'policies',
            method: 'cookiePolicy',
          },
        };
      }

      return {
        ok: true,
        data: {
          message: `Cookie "${name}" read successfully.`,
          cookie,
        },
      };
    }

    if (action === 'delete') {
      const exists = cookieStore.has(name);
      if (!exists) {
        return {
          ok: false,
          error: {
            message: `Cookie "${name}" does not exist or is already deleted.`,
            origin: 'policies',
            method: 'cookiePolicy',
          },
        };
      }

      cookieStore.delete(name);

      return {
        ok: true,
        data: {
          message: `Cookie "${name}" deleted successfully.`,
          cookie: { name },
        },
      };
    }

    return {
      ok: false,
      error: {
        message: 'Unhandled cookie action.',
        origin: 'policies',
        method: 'cookiePolicy',
      },
    };
  } catch (error: unknown) {
    const e = error as Error;
    return {
      ok: false,
      error: {
        message: 'Failed to execute cookie action.',
        origin: 'policies',
        method: 'cookiePolicy',
        raw: {
          name: e.name,
          message: e.message,
        },
      },
    };
  }
}
