import { editBlog, getSession, getUser } from '@library/handlers';
import {
  blogPolicy,
  cookiePolicy,
  idPolicy,
  jsonPolicy,
  originPolicy,
  rolePolicy,
  sessionPolicy,
  timestampPolicy,
} from '@library/policies';
import { deCipher } from '@library/utilities';
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

export async function POST(
  request: NextRequest,
): Promise<NextResponse<API.Success | API.Failure>> {
  try {
    const enforceOriginPolicy = await originPolicy(request);
    if (!enforceOriginPolicy.ok) {
      return NextResponse.json(enforceOriginPolicy, {
        status: 400,
      });
    }

    const enforceJsonPolicy = await jsonPolicy(request);
    if (!enforceJsonPolicy.ok) {
      return NextResponse.json(enforceJsonPolicy, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const body = enforceJsonPolicy.data;

    const getSessionCookie = await cookiePolicy({
      action: 'read',
      name: 'session_id',
    });
    if (!getSessionCookie.ok) {
      return NextResponse.json(getSessionCookie, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const sessionId = deCipher({ cipher: getSessionCookie.data.cookie.value });
    if (!sessionId.ok) {
      return NextResponse.json(sessionId, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const session = await getSession({ by: { id: sessionId.data.message } });
    if (!session.ok) {
      return NextResponse.json(session, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const enforceSessionPolicy = sessionPolicy({
      expiry: session.data.session.expired,
    });
    if (!enforceSessionPolicy.ok) {
      return NextResponse.json(enforceSessionPolicy, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const user = await getUser({ by: { id: session.data.session.user_id } });
    if (!user.ok) {
      return NextResponse.json(user, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const enforceRolePolicy = rolePolicy({
      userRole: user.data.user.role,
      targetRole: 'root',
    });
    if (!enforceRolePolicy.ok) {
      return NextResponse.json(enforceRolePolicy, {
        status: 403,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const enforceIdPolicy = idPolicy({
      id: body.id,
      returnFieldName: 'id',
    });
    if (!enforceIdPolicy.ok) {
      return NextResponse.json(enforceIdPolicy, {
        status: 403,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const enforceUserIdPolicy = idPolicy({
      id: body.userId,
      returnFieldName: 'userId',
    });
    if (!enforceUserIdPolicy.ok) {
      return NextResponse.json(enforceUserIdPolicy, {
        status: 403,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const enforceCreatedTimestampPolicy = timestampPolicy({
      timestamp: body.created,
      returnFieldName: 'created',
    });
    if (!enforceCreatedTimestampPolicy.ok) {
      return NextResponse.json(enforceCreatedTimestampPolicy, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const enforceUpdatedTimestampPolicy = timestampPolicy({
      timestamp: body.updated,
      returnFieldName: 'updated',
    });
    if (!enforceUpdatedTimestampPolicy.ok) {
      return NextResponse.json(enforceUpdatedTimestampPolicy, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const enforcePublishedAtTimestampPolicy = timestampPolicy({
      timestamp: body.publishedAt,
      returnFieldName: 'publishedAt',
    });
    if (!enforcePublishedAtTimestampPolicy.ok) {
      return NextResponse.json(enforcePublishedAtTimestampPolicy, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const enforceBlogPolicy = blogPolicy({
      slug: body.slug,
      imageUrl: body.imageUrl,
      title: body.title,
      excerpt: body.excerpt,
      content: body.content,
      published: body.published,
    });
    if (!enforceBlogPolicy.ok) {
      return NextResponse.json(enforceBlogPolicy, {
        status: 400,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    const updateBlog = await editBlog({
      by: { id: enforceIdPolicy.data.id },
      blog: {
        id: enforceIdPolicy.data.id,
        user_id: enforceUserIdPolicy.data.id,
        slug: enforceBlogPolicy.data.slug,
        image_url: enforceBlogPolicy.data.imageUrl,
        title: enforceBlogPolicy.data.title,
        excerpt: enforceBlogPolicy.data.excerpt,
        content: enforceBlogPolicy.data.content,
        published: enforceBlogPolicy.data.published as boolean | undefined,
        published_at: enforcePublishedAtTimestampPolicy.data.timestamp,
        created: enforceCreatedTimestampPolicy.data.timestamp,
        updated: enforceUpdatedTimestampPolicy.data.timestamp,
      },
    });
    if (!updateBlog.ok) {
      return NextResponse.json(updateBlog, {
        status: 403,
        headers: enforceOriginPolicy.data.headers,
      });
    }

    return NextResponse.json(
      { ok: true },
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
          method: 'POST',
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
