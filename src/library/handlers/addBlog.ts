import { accessPostgreSQL } from '@library/utilities';

interface Props {
  blog: {
    id: string;
    user_id: string;
    title: string;
    content: string;
    image_url?: string;
    slug: string;
    excerpt?: string;
    published?: boolean;
    published_at?: string;
    created: string;
    updated: string;
  };
}

export default async function addBlog({
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

    const query = `
      INSERT INTO blogs (
        id,
        user_id,
        title,
        content,
        image_url,
        slug,
        excerpt,
        published,
        published_at,
        created,
        updated
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11
      )
      RETURNING *;
    `;

    const values = [
      blog.id,
      blog.user_id,
      blog.title,
      blog.content,
      blog.image_url ?? null,
      blog.slug,
      blog.excerpt ?? null,
      blog.published ?? false,
      blog.published_at ?? null,
      blog.created,
      blog.updated,
    ];

    const result = await client.query(query, values);

    await client.query('COMMIT');

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
        message: 'Failed to add blog.',
        origin: 'handlers',
        method: 'addBlog',
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
