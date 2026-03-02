import { accessPostgreSQL } from '@library/utilities';

interface Props {
  by: { id?: string; user_id?: string };
}

export default async function deleteSession({
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

    let identifierField = '';
    let identifierValue: string | undefined;

    if (by.id) {
      identifierField = 'id';
      identifierValue = by.id;
    } else if (by.user_id) {
      identifierField = 'user_id';
      identifierValue = by.user_id;
    } else {
      await client.query('ROLLBACK');
      return {
        ok: false,
        error: {
          message: 'No identifier provided (user_id or id required).',
          origin: 'handlers',
          method: 'deleteSession',
        },
      };
    }

    const query = `
      DELETE FROM sessions
      WHERE ${identifierField} = $1
      RETURNING *;
    `;

    const result = await client.query(query, [identifierValue]);

    await client.query('COMMIT');

    if (result.rows.length === 0) {
      return {
        ok: false,
        error: {
          message: 'Session not found.',
          origin: 'handlers',
          method: 'deleteSession',
        },
      };
    }

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
        message: 'Failed to delete session.',
        origin: 'handlers',
        method: 'deleteSession',
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
