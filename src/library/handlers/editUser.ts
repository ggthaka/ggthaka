import { accessPostgreSQL } from '@library/utilities';

interface Props {
  by: { id?: string; email?: string };
  user: {
    id?: string;

    // authentication & authorization
    email?: string;
    hash?: string;
    role?: string;

    // password reset
    password_reset_otp?: string | null;
    password_reset_expiry?: string | null;
    password_reset_attempts?: number;

    // profile
    first_name?: string;
    last_name?: string;
    year_of_birth?: number;
    sex?: string;
    country?: string;

    // meta
    disabled?: boolean;
    verified?: boolean;
    created?: string;
    updated?: string;
  };
}

export default async function editUser({
  by,
  user,
}: Props): Promise<API.Success | API.Failure> {
  const postgres = accessPostgreSQL();

  if (!postgres.ok) {
    return {
      ok: false,
      error: {
        message: postgres.error.message,
        origin: postgres.error.origin,
        method: postgres.error.method,
        raw: {
          name: postgres.error.raw?.name,
          message: postgres.error.raw?.message,
        },
      },
    };
  }

  const client = await postgres.data.pool.connect();

  try {
    await client.query('BEGIN');

    let identifierField = '';
    let identifierValue: string | undefined;

    if (by.id) {
      identifierField = 'id';
      identifierValue = by.id;
    } else if (by.email) {
      identifierField = 'email';
      identifierValue = by.email;
    } else {
      await client.query('ROLLBACK');
      return {
        ok: false,
        error: {
          message: 'No identifier provided (email or id required).',
          origin: 'handlers',
          method: 'editUser',
        },
      };
    }

    // Ignore the key in filtering and mapping to fix ESLint warnings
    const fields = Object.entries(user).filter(
      ([, value]) => value !== undefined,
    );

    if (fields.length === 0) {
      await client.query('ROLLBACK');
      return {
        ok: false,
        error: {
          message: 'No fields provided to update.',
          origin: 'handlers',
          method: 'editUser',
        },
      };
    }

    const setClauses = fields
      .map(([key], index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = [identifierValue, ...fields.map(([, value]) => value)];

    const query = `
      UPDATE users
      SET ${setClauses}
      WHERE ${identifierField} = $1
      RETURNING *;
    `;

    const result = await client.query(query, values);
    await client.query('COMMIT');

    if (result.rows.length === 0) {
      return {
        ok: false,
        error: {
          message: 'User not found.',
          origin: 'handlers',
          method: 'editUser',
        },
      };
    }

    return {
      ok: true,
      data: { user: result.rows[0] },
    };
  } catch (e: unknown) {
    await client.query('ROLLBACK');

    const error = e as Error;

    return {
      ok: false,
      error: {
        message: 'Failed to edit user.',
        origin: 'handlers',
        method: 'editUser',
        raw: {
          name: error.name,
          message: error.message,
        },
      },
    };
  } finally {
    client.release();
  }
}
