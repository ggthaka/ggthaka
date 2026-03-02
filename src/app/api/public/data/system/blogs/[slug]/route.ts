import { originPolicy } from '@library/policies';
import { accessPostgreSQL } from '@library/utilities';
import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS(request: NextRequest) {
  const enforceOriginPolicy = await originPolicy(request);
  if (!enforceOriginPolicy.ok) {
    return NextResponse.json(enforceOriginPolicy, {
      status: 400,
    });
  }

  return new NextResponse(null, {
    status: 204,
    headers: enforceOriginPolicy.data.headers,
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
): Promise<NextResponse<API.Success | API.Failure>> {
  let client: import('pg').PoolClient | null = null;

  try {
    const { slug } = await context.params;
    const decodedSlug = decodeURIComponent(slug);

    const enforceOriginPolicy = await originPolicy(request);
    if (!enforceOriginPolicy.ok) {
      return NextResponse.json(enforceOriginPolicy, {
        status: 400,
      });
    }

    const postgres = accessPostgreSQL();
    if (!postgres.ok) {
      return NextResponse.json(postgres, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    client = await postgres.data.pool.connect();
    if (!client) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            message: 'Failed to create database connection.',
            origin: 'routes',
            method: 'GET',
          },
        },
        { status: 500, headers: enforceOriginPolicy.data.headers },
      );
    }

    const result = await client.query(
      `
        SELECT slug, image_url, title, excerpt, content, published_at
        FROM blogs
        WHERE slug = $1 AND published = true
        LIMIT 1
      `,
      [decodedSlug],
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            message: 'Blog not found.',
            origin: 'routes',
            method: 'GET',
          },
        },
        { status: 404, headers: enforceOriginPolicy.data.headers },
      );
    }

    const current = result.rows[0] as {
      slug: string;
      image_url: string | null;
      title: string;
      excerpt: string;
      content: string;
      published_at: string;
    };

    const neighborsResult = await client.query(
      `
        WITH ordered AS (
          SELECT
            slug,
            title,
            row_number() OVER (
              ORDER BY COALESCE(published_at, created) ASC, slug ASC
            ) AS rn
          FROM blogs
          WHERE published = true
        ),
        current AS (
          SELECT rn FROM ordered WHERE slug = $1 LIMIT 1
        )
        SELECT
          (
            SELECT row_to_json(prev_row)
            FROM (
              SELECT slug, title
              FROM ordered
              WHERE rn = (SELECT rn - 1 FROM current)
              LIMIT 1
            ) AS prev_row
          ) AS previous,
          (
            SELECT row_to_json(next_row)
            FROM (
              SELECT slug, title
              FROM ordered
              WHERE rn = (SELECT rn + 1 FROM current)
              LIMIT 1
            ) AS next_row
          ) AS next
      `,
      [decodedSlug],
    );

    const neighborsRow = neighborsResult.rows[0] as
      | {
          previous?: { slug?: string; title?: string } | null;
          next?: { slug?: string; title?: string } | null;
        }
      | undefined;

    const previous =
      neighborsRow?.previous &&
      typeof neighborsRow.previous.slug === 'string' &&
      typeof neighborsRow.previous.title === 'string'
        ? {
            slug: neighborsRow.previous.slug,
            title: neighborsRow.previous.title,
          }
        : null;

    const next =
      neighborsRow?.next &&
      typeof neighborsRow.next.slug === 'string' &&
      typeof neighborsRow.next.title === 'string'
        ? {
            slug: neighborsRow.next.slug,
            title: neighborsRow.next.title,
          }
        : null;

    return NextResponse.json(
      {
        ok: true,
        data: {
          ...current,
          previous,
          next,
        },
      },
      { status: 200, headers: enforceOriginPolicy.data.headers },
    );
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json(
      {
        ok: false,
        error: {
          message: 'Internal server error.',
          origin: 'routes',
          method: 'GET',
          raw: {
            name: error.name,
            message: error.message,
          },
        },
      },
      { status: 500 },
    );
  } finally {
    client?.release();
  }
}
