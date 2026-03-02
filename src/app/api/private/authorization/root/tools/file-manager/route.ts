import { getSession, getUser } from '@library/handlers';
import {
  cookiePolicy,
  originPolicy,
  rolePolicy,
  sessionPolicy,
} from '@library/policies';
import { deCipher } from '@library/utilities';
import { promises as fs } from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export const runtime = 'nodejs';

interface ListedEntry {
  name: string;
  path: string;
  type: 'file' | 'directory' | 'symlink';
  size: number;
  modifiedAt: string;
}

interface PathListingData {
  currentPath: string;
  parentPath: string | null;
  entries: ListedEntry[];
}

const previewableImageExtensions = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.bmp',
  '.svg',
]);

const contentTypeFromExtension = (filePath: string): string => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.bmp') return 'image/bmp';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.json') return 'application/json';
  if (ext === '.md') return 'text/markdown; charset=utf-8';
  if (ext === '.txt') return 'text/plain; charset=utf-8';
  return 'application/octet-stream';
};

const isLikelyBinary = (buffer: Buffer): boolean => {
  const sampleLength = Math.min(buffer.length, 1024);
  for (let index = 0; index < sampleLength; index += 1) {
    if (buffer[index] === 0) return true;
  }
  return false;
};

const resolveTargetPath = (raw: string): string => {
  if (!raw || raw.trim() === '') return '/';
  return path.resolve(raw);
};

const isSafeChildName = (value: string): boolean => {
  const name = value.trim();
  if (!name || name === '.' || name === '..') return false;
  return !name.includes('/') && !name.includes('\\');
};

const isPathInside = (parent: string, child: string): boolean => {
  const parentResolved = path.resolve(parent);
  const childResolved = path.resolve(child);
  const root = path.parse(parentResolved).root;
  if (parentResolved === root) return path.isAbsolute(childResolved);
  return (
    childResolved === parentResolved ||
    childResolved.startsWith(`${parentResolved}${path.sep}`)
  );
};

const listPathEntries = async (
  targetPath: string,
): Promise<PathListingData> => {
  const dirEntries = await fs.readdir(targetPath, { withFileTypes: true });
  const listedEntries = (
    await Promise.all(
      dirEntries.map(async (entry) => {
        const entryPath = path.join(targetPath, entry.name);

        try {
          const info = await fs.lstat(entryPath);

          let type: ListedEntry['type'] = 'file';
          if (info.isDirectory()) {
            type = 'directory';
          } else if (info.isSymbolicLink()) {
            type = 'symlink';
          }

          return {
            name: entry.name,
            path: entryPath,
            type,
            size: info.size,
            modifiedAt: info.mtime.toISOString(),
          } satisfies ListedEntry;
        } catch {
          return null;
        }
      }),
    )
  ).filter((item): item is ListedEntry => item !== null);

  listedEntries.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const parentPath = path.dirname(targetPath);

  return {
    currentPath: targetPath,
    parentPath: targetPath === parentPath ? null : parentPath,
    entries: listedEntries,
  };
};

const authorizeRoot = async (
  request: NextRequest,
): Promise<
  | { ok: true; headers: HeadersInit }
  | { ok: false; response: NextResponse<API.Success | API.Failure> }
> => {
  const enforceOriginPolicy = await originPolicy(request);
  if (!enforceOriginPolicy.ok) {
    return {
      ok: false,
      response: NextResponse.json(enforceOriginPolicy, {
        status: 400,
      }),
    };
  }

  const headers = enforceOriginPolicy.data.headers;
  const getSessionCookie = await cookiePolicy({
    action: 'read',
    name: 'session_id',
  });
  if (!getSessionCookie.ok) {
    return {
      ok: false,
      response: NextResponse.json(getSessionCookie, {
        status: 400,
        headers,
      }),
    };
  }

  const sessionId = deCipher({ cipher: getSessionCookie.data.cookie.value });
  if (!sessionId.ok) {
    return {
      ok: false,
      response: NextResponse.json(sessionId, {
        status: 400,
        headers,
      }),
    };
  }

  const session = await getSession({ by: { id: sessionId.data.message } });
  if (!session.ok) {
    return {
      ok: false,
      response: NextResponse.json(session, {
        status: 400,
        headers,
      }),
    };
  }

  const enforceSessionPolicy = sessionPolicy({
    expiry: session.data.session.expired,
  });
  if (!enforceSessionPolicy.ok) {
    return {
      ok: false,
      response: NextResponse.json(enforceSessionPolicy, {
        status: 400,
        headers,
      }),
    };
  }

  const user = await getUser({ by: { id: session.data.session.user_id } });
  if (!user.ok) {
    return {
      ok: false,
      response: NextResponse.json(user, {
        status: 400,
        headers,
      }),
    };
  }

  const enforceRolePolicy = rolePolicy({
    userRole: user.data.user.role,
    targetRole: 'root',
  });
  if (!enforceRolePolicy.ok) {
    return {
      ok: false,
      response: NextResponse.json(enforceRolePolicy, {
        status: 403,
        headers,
      }),
    };
  }

  return { ok: true, headers };
};

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
): Promise<NextResponse<API.Success | API.Failure> | NextResponse> {
  try {
    const auth = await authorizeRoot(request);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';
    const targetPath = resolveTargetPath(searchParams.get('path') || '/');

    if (action === 'download') {
      const stat = await fs.stat(targetPath);
      if (!stat.isFile()) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              message: 'Target path is not a file.',
              origin: 'routes',
              method: 'GET',
            },
          },
          {
            status: 400,
            headers: auth.headers,
          },
        );
      }

      const data = await fs.readFile(targetPath);
      return new NextResponse(data, {
        status: 200,
        headers: {
          ...auth.headers,
          'Content-Type': contentTypeFromExtension(targetPath),
          'Content-Disposition': `attachment; filename="${path.basename(targetPath)}"`,
        },
      });
    }

    if (action === 'preview') {
      const stat = await fs.stat(targetPath);
      if (!stat.isFile()) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              message: 'Preview target is not a file.',
              origin: 'routes',
              method: 'GET',
            },
          },
          {
            status: 400,
            headers: auth.headers,
          },
        );
      }

      const contentType = contentTypeFromExtension(targetPath);
      const raw = await fs.readFile(targetPath);
      const maxPreviewBytes = 1024 * 512;
      const truncated = raw.length > maxPreviewBytes;
      const buffer = truncated ? raw.subarray(0, maxPreviewBytes) : raw;

      const extension = path.extname(targetPath).toLowerCase();
      if (previewableImageExtensions.has(extension)) {
        return NextResponse.json(
          {
            ok: true,
            data: {
              path: targetPath,
              kind: 'image',
              name: path.basename(targetPath),
              mime: contentType,
              size: stat.size,
              truncated,
              content: `data:${contentType};base64,${buffer.toString('base64')}`,
            },
          },
          {
            status: 200,
            headers: auth.headers,
          },
        );
      }

      if (!isLikelyBinary(buffer)) {
        return NextResponse.json(
          {
            ok: true,
            data: {
              path: targetPath,
              kind: 'text',
              name: path.basename(targetPath),
              mime: contentType,
              size: stat.size,
              truncated,
              content: buffer.toString('utf-8'),
            },
          },
          {
            status: 200,
            headers: auth.headers,
          },
        );
      }

      return NextResponse.json(
        {
          ok: true,
          data: {
            path: targetPath,
            kind: 'binary',
            name: path.basename(targetPath),
            mime: contentType,
            size: stat.size,
            truncated,
            content: null,
          },
        },
        {
          status: 200,
          headers: auth.headers,
        },
      );
    }

    const listing = await listPathEntries(targetPath);

    return NextResponse.json(
      {
        ok: true,
        data: listing,
      },
      {
        status: 200,
        headers: auth.headers,
      },
    );
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json(
      {
        ok: false,
        error: {
          message: 'Failed to access file system path.',
          origin: 'routes',
          method: 'GET',
          raw: {
            name: error.name,
            message: error.message,
          },
        },
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<API.Success | API.Failure>> {
  try {
    const auth = await authorizeRoot(request);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || '';

    if (action === 'mkdir') {
      const body = (await request.json()) as {
        path?: string;
        folderName?: string;
      };

      const targetPath = resolveTargetPath(body.path || '/');
      const folderName = body.folderName?.trim() || '';
      if (!isSafeChildName(folderName)) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              message: 'Invalid folder name.',
              origin: 'routes',
              method: 'POST',
            },
          },
          { status: 400, headers: auth.headers },
        );
      }

      const folderPath = path.resolve(path.join(targetPath, folderName));
      if (!isPathInside(targetPath, folderPath)) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              message: 'Unsafe folder path.',
              origin: 'routes',
              method: 'POST',
            },
          },
          { status: 400, headers: auth.headers },
        );
      }

      await fs.mkdir(folderPath, { recursive: true });
      const listing = await listPathEntries(targetPath);
      return NextResponse.json(
        { ok: true, data: listing },
        { status: 200, headers: auth.headers },
      );
    }

    if (action === 'create-file') {
      const body = (await request.json()) as {
        path?: string;
        fileName?: string;
        content?: string;
      };

      const targetPath = resolveTargetPath(body.path || '/');
      const fileName = body.fileName?.trim() || '';
      if (!isSafeChildName(fileName)) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              message: 'Invalid file name.',
              origin: 'routes',
              method: 'POST',
            },
          },
          { status: 400, headers: auth.headers },
        );
      }

      const filePath = path.resolve(path.join(targetPath, fileName));
      if (!isPathInside(targetPath, filePath)) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              message: 'Unsafe file path.',
              origin: 'routes',
              method: 'POST',
            },
          },
          { status: 400, headers: auth.headers },
        );
      }

      await fs.writeFile(filePath, body.content ?? '', { encoding: 'utf-8' });
      const listing = await listPathEntries(targetPath);
      return NextResponse.json(
        { ok: true, data: listing },
        { status: 200, headers: auth.headers },
      );
    }

    if (action === 'update-file') {
      const body = (await request.json()) as {
        filePath?: string;
        content?: string;
      };

      const rawFilePath = body.filePath?.trim();
      if (!rawFilePath) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              message: 'Invalid file path for update.',
              origin: 'routes',
              method: 'POST',
            },
          },
          { status: 400, headers: auth.headers },
        );
      }

      const filePath = resolveTargetPath(rawFilePath);
      const fileInfo = await fs.lstat(filePath);
      if (!fileInfo.isFile()) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              message: 'Only regular files can be edited.',
              origin: 'routes',
              method: 'POST',
            },
          },
          { status: 400, headers: auth.headers },
        );
      }

      await fs.writeFile(filePath, body.content ?? '', { encoding: 'utf-8' });
      const listing = await listPathEntries(path.dirname(filePath));
      return NextResponse.json(
        { ok: true, data: listing },
        { status: 200, headers: auth.headers },
      );
    }

    if (action === 'upload') {
      const formData = await request.formData();
      const targetPath = resolveTargetPath(String(formData.get('path') || '/'));
      const files = formData
        .getAll('files')
        .filter((item): item is File => item instanceof File);

      if (files.length === 0) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              message: 'No files provided for upload.',
              origin: 'routes',
              method: 'POST',
            },
          },
          { status: 400, headers: auth.headers },
        );
      }

      await Promise.all(
        files.map(async (file) => {
          const safeName = path.basename(file.name);
          if (!isSafeChildName(safeName)) return;
          const destination = path.resolve(path.join(targetPath, safeName));
          if (!isPathInside(targetPath, destination)) return;
          const bytes = Buffer.from(await file.arrayBuffer());
          await fs.writeFile(destination, bytes);
        }),
      );

      const listing = await listPathEntries(targetPath);
      return NextResponse.json(
        { ok: true, data: listing },
        { status: 200, headers: auth.headers },
      );
    }

    if (action === 'rename') {
      const body = (await request.json()) as {
        entryPath?: string;
        newName?: string;
      };

      const entryPath = resolveTargetPath(body.entryPath || '');
      const newName = body.newName?.trim() || '';
      if (!entryPath || !isSafeChildName(newName)) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              message: 'Invalid rename payload.',
              origin: 'routes',
              method: 'POST',
            },
          },
          { status: 400, headers: auth.headers },
        );
      }

      const parent = path.dirname(entryPath);
      const destination = path.resolve(path.join(parent, newName));
      if (!isPathInside(parent, destination)) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              message: 'Unsafe rename destination.',
              origin: 'routes',
              method: 'POST',
            },
          },
          { status: 400, headers: auth.headers },
        );
      }

      await fs.rename(entryPath, destination);
      const listing = await listPathEntries(parent);
      return NextResponse.json(
        { ok: true, data: listing },
        { status: 200, headers: auth.headers },
      );
    }

    if (action === 'copy') {
      const body = (await request.json()) as {
        sourcePath?: string;
        destinationPath?: string;
        currentPath?: string;
      };

      const rawSourcePath = body.sourcePath?.trim();
      const rawDestinationPath = body.destinationPath?.trim();
      if (!rawSourcePath || !rawDestinationPath) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              message: 'Invalid copy payload.',
              origin: 'routes',
              method: 'POST',
            },
          },
          { status: 400, headers: auth.headers },
        );
      }

      const sourcePath = resolveTargetPath(rawSourcePath);
      const destinationPath = resolveTargetPath(rawDestinationPath);
      const currentPath = resolveTargetPath(
        body.currentPath || path.dirname(sourcePath),
      );

      const sourceInfo = await fs.lstat(sourcePath);
      if (sourceInfo.isDirectory()) {
        await fs.cp(sourcePath, destinationPath, {
          recursive: true,
          errorOnExist: true,
          force: false,
        });
      } else {
        await fs.copyFile(sourcePath, destinationPath);
      }

      const listing = await listPathEntries(currentPath);
      return NextResponse.json(
        { ok: true, data: listing },
        { status: 200, headers: auth.headers },
      );
    }

    if (action === 'duplicate') {
      const body = (await request.json()) as {
        sourcePath?: string;
        currentPath?: string;
      };

      const rawSourcePath = body.sourcePath?.trim();
      if (!rawSourcePath) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              message: 'Invalid duplicate payload.',
              origin: 'routes',
              method: 'POST',
            },
          },
          { status: 400, headers: auth.headers },
        );
      }

      const sourcePath = resolveTargetPath(rawSourcePath);
      const parent = path.dirname(sourcePath);
      const baseName = path.basename(sourcePath);
      const parsed = path.parse(baseName);
      const currentPath = resolveTargetPath(body.currentPath || parent);

      let duplicateIndex = 1;
      let destinationPath = '';
      while (true) {
        const suffix =
          duplicateIndex === 1 ? ' copy' : ` copy ${duplicateIndex}`;
        const nextName = `${parsed.name}${suffix}${parsed.ext}`;
        destinationPath = path.resolve(path.join(parent, nextName));
        try {
          await fs.access(destinationPath);
          duplicateIndex += 1;
        } catch {
          break;
        }
      }

      const sourceInfo = await fs.lstat(sourcePath);
      if (sourceInfo.isDirectory()) {
        await fs.cp(sourcePath, destinationPath, {
          recursive: true,
          errorOnExist: true,
          force: false,
        });
      } else {
        await fs.copyFile(sourcePath, destinationPath);
      }

      const listing = await listPathEntries(currentPath);
      return NextResponse.json(
        { ok: true, data: listing },
        { status: 200, headers: auth.headers },
      );
    }

    if (action === 'move') {
      const body = (await request.json()) as {
        sourcePath?: string;
        destinationPath?: string;
        currentPath?: string;
      };

      const rawSourcePath = body.sourcePath?.trim();
      const rawDestinationPath = body.destinationPath?.trim();
      if (!rawSourcePath || !rawDestinationPath) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              message: 'Invalid move payload.',
              origin: 'routes',
              method: 'POST',
            },
          },
          { status: 400, headers: auth.headers },
        );
      }

      const sourcePath = resolveTargetPath(rawSourcePath);
      const destinationPath = resolveTargetPath(rawDestinationPath);
      const currentPath = resolveTargetPath(
        body.currentPath || path.dirname(sourcePath),
      );

      try {
        await fs.rename(sourcePath, destinationPath);
      } catch {
        const sourceInfo = await fs.lstat(sourcePath);
        if (sourceInfo.isDirectory()) {
          await fs.cp(sourcePath, destinationPath, {
            recursive: true,
            errorOnExist: true,
            force: false,
          });
          await fs.rm(sourcePath, { recursive: true, force: false });
        } else {
          await fs.copyFile(sourcePath, destinationPath);
          await fs.rm(sourcePath, { force: false });
        }
      }

      const listing = await listPathEntries(currentPath);
      return NextResponse.json(
        { ok: true, data: listing },
        { status: 200, headers: auth.headers },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: {
          message: 'Unsupported action for POST.',
          origin: 'routes',
          method: 'POST',
        },
      },
      { status: 400, headers: auth.headers },
    );
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json(
      {
        ok: false,
        error: {
          message: 'Failed to modify file system path.',
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

export async function DELETE(
  request: NextRequest,
): Promise<NextResponse<API.Success | API.Failure>> {
  try {
    const auth = await authorizeRoot(request);
    if (!auth.ok) return auth.response;

    const body = (await request.json()) as {
      entryPath?: string;
      entryPaths?: string[];
      currentPath?: string;
    };
    const rawPaths = [
      ...(Array.isArray(body.entryPaths) ? body.entryPaths : []),
      ...(body.entryPath ? [body.entryPath] : []),
    ]
      .map((item) => item.trim())
      .filter(Boolean);

    if (rawPaths.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            message: 'Invalid entry path.',
            origin: 'routes',
            method: 'DELETE',
          },
        },
        { status: 400, headers: auth.headers },
      );
    }
    const currentPath = resolveTargetPath(body.currentPath || '/');

    await Promise.all(
      rawPaths.map(async (rawPath) => {
        const entryPath = resolveTargetPath(rawPath);
        await fs.rm(entryPath, { recursive: true, force: false });
      }),
    );

    const listing = await listPathEntries(currentPath);
    return NextResponse.json(
      { ok: true, data: listing },
      { status: 200, headers: auth.headers },
    );
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json(
      {
        ok: false,
        error: {
          message: 'Failed to delete file system entry.',
          origin: 'routes',
          method: 'DELETE',
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
