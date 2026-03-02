import { accessPostgreSQL } from '@library/utilities';

interface Props {
  by: { email?: string; id?: string };
}

export default async function getUser({
  by,
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

    let query = '';
    let values: (string | undefined)[] = [];

    if (by.email) {
      query = 'SELECT * FROM users WHERE email = $1';
      values = [by.email];
    } else if (by.id) {
      query = 'SELECT * FROM users WHERE id = $1';
      values = [by.id];
    } else {
      await client.query('ROLLBACK');
      return {
        ok: false,
        error: {
          message: 'No identifier provided (email or id required).',
          origin: 'handlers',
          method: 'getUser',
        },
      };
    }

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return {
        ok: false,
        error: {
          message: 'No user found with the provided identifier.',
          origin: 'handlers',
          method: 'getUser',
        },
      };
    }

    await client.query('COMMIT');

    return {
      ok: true,
      data: { user: result.rows[0] },
    };
  } catch (e: unknown) {
    if (client) {
      await client.query('ROLLBACK');
    }

    const error = e as Error;

    return {
      ok: false,
      error: {
        message: 'Failed to get user.',
        origin: 'handlers',
        method: 'getUser',
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
