import { accessPostgreSQL } from '@library/utilities';

interface Props {
  by: { id?: string; user_id?: string };
}

export default async function getSession({
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

    if (by.id) {
      query = 'SELECT * FROM sessions WHERE id = $1';
      values = [by.id];
    } else if (by.user_id) {
      query = 'SELECT * FROM sessions WHERE user_id = $1';
      values = [by.user_id];
    } else {
      await client.query('ROLLBACK');
      return {
        ok: false,
        error: {
          message: 'No identifier provided (id or user_id required).',
          origin: 'handlers',
          method: 'getSession',
        },
      };
    }

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return {
        ok: false,
        error: {
          message: 'No session found with the provided identifier.',
          origin: 'handlers',
          method: 'getSession',
        },
      };
    }

    await client.query('COMMIT');

    return {
      ok: true,
      data: { session: result.rows[0] },
    };
  } catch (e: unknown) {
    if (client) {
      await client.query('ROLLBACK');
    }

    const error = e as Error;

    return {
      ok: false,
      error: {
        message: 'Failed to get session.',
        origin: 'handlers',
        method: 'getSession',
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
