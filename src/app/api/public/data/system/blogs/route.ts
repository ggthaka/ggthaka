import { getBlogs } from '@library/handlers';
import { originPolicy } from '@library/policies';
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
): Promise<NextResponse<API.Success | API.Failure>> {
  try {
    const allowedFields = [
      'slug',
      'image_url',
      'title',
      'excerpt',
      'published_at',
    ];
    const allowedFilterSet = new Set(allowedFields);

    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';

    const filters: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key.startsWith('filters[') && key.endsWith(']') && value) {
        const col = key.slice(8, -1);
        if (allowedFilterSet.has(col)) filters[col] = value;
      }
    });

    filters.published = 'true';

    const enforceOriginPolicy = await originPolicy(request);
    if (!enforceOriginPolicy.ok) {
      return NextResponse.json(enforceOriginPolicy, {
        status: 400,
      });
    }

    const blogs = await getBlogs({ page, limit, search, filters });
    if (!blogs.ok) {
      return NextResponse.json(blogs, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const safeBlogs: Array<Record<string, unknown>> = [];
    for (const row of blogs.data as Array<Record<string, unknown>>) {
      safeBlogs.push({
        slug: row.slug,
        image_url: row.image_url,
        title: row.title,
        excerpt: row.excerpt,
        published_at: row.published_at,
      });
    }

    return NextResponse.json(
      { ok: true, data: safeBlogs, meta: blogs.meta },
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
  }
}
