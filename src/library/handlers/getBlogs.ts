import { accessPostgreSQL } from '@library/utilities';

export default async function getBlogs({
  page = 1,
  limit = 10,
  search = '',
  filters = {},
}: {
  page?: number;
  limit?: number;
  search?: string;
  filters?: Record<string, string>;
}): Promise<API.Success | API.Failure> {
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

    const offset = (page - 1) * limit;
    const searchPattern = search.trim() ? `%${search.trim()}%` : null;

    // === Get column names ===
    const columnResult = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'blogs' ORDER BY ordinal_position
    `);
    const columns: string[] = columnResult.rows.map(
      (r: { column_name: string }) => r.column_name,
    );

    // === Build WHERE conditions ===
    const conditions: string[] = [];
    const params: unknown[] = [];
    const totalParams: unknown[] = [];
    let paramIndex = 1;

    // 1. Global search (OR across all columns)
    if (searchPattern) {
      const searchClauses: string[] = [];
      for (const col of columns) {
        searchClauses.push(`${col}::text ILIKE $${paramIndex}`);
      }
      if (searchClauses.length > 0) {
        conditions.push(`(${searchClauses.join(' OR ')})`);
        params.push(searchPattern);
        totalParams.push(searchPattern);
        paramIndex++;
      }
    }

    // 2. Column filters (AND)
    for (const [key, value] of Object.entries(filters)) {
      if (
        !value ||
        typeof value !== 'string' ||
        !value.trim() ||
        !columns.includes(key)
      )
        continue;
      const pattern = `%${value.trim()}%`;
      conditions.push(`${key}::text ILIKE $${paramIndex}`);
      params.push(pattern);
      totalParams.push(pattern);
      paramIndex++;
    }

    // 3. Save pagination indices
    const limitParamIndex = paramIndex++;
    const offsetParamIndex = paramIndex++;
    params.push(limit, offset);

    // === WHERE clause ===
    const whereClause = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // === Total count ===
    const totalResult = await client.query(
      `SELECT COUNT(*) FROM blogs ${whereClause}`,
      totalParams,
    );
    const total = parseInt(totalResult.rows[0].count, 10);

    // === Data query ===
    const result = await client.query(
      `
        SELECT * FROM blogs
        ${whereClause}
        ORDER BY created DESC
        LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
      `,
      params,
    );

    await client.query('COMMIT');

    if (result.rows.length === 0) {
      return {
        ok: false,
        error: {
          message: 'No blogs found!',
          origin: 'handlers',
          method: 'getBlogs',
        },
      };
    }

    return {
      ok: true,
      data: result.rows,
      meta: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
        search: search.trim() || null,
      },
    };
  } catch (e: unknown) {
    if (client) {
      await client.query('ROLLBACK');
    }

    const error = e as Error;

    return {
      ok: false,
      error: {
        message: 'Failed to get blogs.',
        origin: 'handlers',
        method: 'getBlogs',
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
