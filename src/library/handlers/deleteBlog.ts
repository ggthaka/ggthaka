import { accessPostgreSQL } from '@library/utilities';

interface Props {
  by: { id?: string; slug?: string };
}

export default async function deleteBlog({
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
    } else if (by.slug) {
      identifierField = 'slug';
      identifierValue = by.slug;
    } else {
      await client.query('ROLLBACK');
      return {
        ok: false,
        error: {
          message: 'No identifier provided (id or slug required).',
          origin: 'handlers',
          method: 'deleteBlog',
        },
      };
    }

    const query = `
      DELETE FROM blogs
      WHERE ${identifierField} = $1
      RETURNING *;
    `;

    const result = await client.query(query, [identifierValue]);

    await client.query('COMMIT');

    if (result.rows.length === 0) {
      return {
        ok: false,
        error: {
          message: 'Blog not found.',
          origin: 'handlers',
          method: 'deleteBlog',
        },
      };
    }

    return {
      ok: true,
      data: { blog: result.rows[0] },
    };
  } catch (e: unknown) {
    if (client) {
      await client.query('ROLLBACK');
    }

    const error = e as Error;

    return {
      ok: false,
      error: {
        message: 'Failed to delete blog.',
        origin: 'handlers',
        method: 'deleteBlog',
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
