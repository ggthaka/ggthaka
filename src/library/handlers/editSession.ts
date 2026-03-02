import { accessPostgreSQL } from '@library/utilities';

interface Props {
  by: { id?: string; user_id?: string };
  session: {
    id?: string;
    user_id?: string;
    ip?: string;
    browser?: string;
    cpu?: string;
    device?: string;
    engine?: string;
    os?: string;
    created?: string;
    updated?: string;
    expired?: string;
  };
}

export default async function editSession({
  by,
  session,
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
          method: 'editSession',
        },
      };
    }

    // Ignore the key in filtering and mapping to fix ESLint warnings
    const fields = Object.entries(session).filter(
      ([, value]) => value !== undefined,
    );

    if (fields.length === 0) {
      await client.query('ROLLBACK');
      return {
        ok: false,
        error: {
          message: 'No fields provided to update.',
          origin: 'handlers',
          method: 'editSession',
        },
      };
    }

    const setClauses = fields
      .map(([key], index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = [identifierValue, ...fields.map(([, value]) => value)];

    const query = `
      UPDATE sessions
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
          message: 'Session not found.',
          origin: 'handlers',
          method: 'editSession',
        },
      };
    }

    return {
      ok: true,
      data: { session: result.rows[0] },
    };
  } catch (e: unknown) {
    await client.query('ROLLBACK');

    const error = e as Error;

    return {
      ok: false,
      error: {
        message: 'Failed to edit session.',
        origin: 'handlers',
        method: 'editSession',
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
