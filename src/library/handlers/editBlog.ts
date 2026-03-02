import { accessPostgreSQL } from '@library/utilities';

interface Props {
  by: { id?: string; slug?: string };
  blog: {
    id?: string;
    user_id?: string;
    title?: string;
    content?: string;
    image_url?: string | null;
    slug?: string;
    excerpt?: string;
    published?: boolean;
    published_at?: string;
    created?: string;
    updated?: string;
  };
}

export default async function editBlog({
  by,
  blog,
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
          method: 'editBlog',
        },
      };
    }

    // Ignore the key in filtering and mapping to fix ESLint warnings
    const fields = Object.entries(blog).filter(
      ([, value]) => value !== undefined,
    );

    if (fields.length === 0) {
      await client.query('ROLLBACK');
      return {
        ok: false,
        error: {
          message: 'No fields provided to update.',
          origin: 'handlers',
          method: 'editBlog',
        },
      };
    }

    const setClauses = fields
      .map(([key], index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = [identifierValue, ...fields.map(([, value]) => value)];

    const query = `
      UPDATE blogs
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
          message: 'Blog not found.',
          origin: 'handlers',
          method: 'editBlog',
        },
      };
    }

    return {
      ok: true,
      data: { blog: result.rows[0] },
    };
  } catch (e: unknown) {
    await client.query('ROLLBACK');

    const error = e as Error;

    return {
      ok: false,
      error: {
        message: 'Failed to edit blog.',
        origin: 'handlers',
        method: 'editBlog',
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
