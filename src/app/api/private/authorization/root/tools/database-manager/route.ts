import { getSession, getUser } from '@library/handlers';
import {
    cookiePolicy,
    originPolicy,
    rolePolicy,
    sessionPolicy,
} from '@library/policies';
import { accessPostgreSQL, deCipher } from '@library/utilities';
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export const runtime = 'nodejs';

interface DatabaseTable {
  schema: string;
  name: string;
}

interface DatabaseSchema {
  name: string;
}

interface DatabaseName {
  name: string;
}

interface QueryResultPayload {
  command: string;
  rowCount: number;
  fields: string[];
  rows: Record<string, unknown>[];
}

const identifierPattern = /^[A-Za-z_][A-Za-z0-9_]*$/;

const quoteIdentifier = (value: string): string => `"${value.replace(/"/g, '""')}"`;

const parseIdentifier = (value: string): string | null => {
  const normalized = value.trim();
  if (!identifierPattern.test(normalized)) return null;
  return normalized;
};

const parseTableReference = (
  tableReference: string,
): { schema: string; table: string } | null => {
  const raw = tableReference.trim();
  if (!raw) return null;

  if (!raw.includes('.')) {
    if (!identifierPattern.test(raw)) return null;
    return { schema: 'public', table: raw };
  }

  const [schema, table] = raw.split('.');
  if (!schema || !table) return null;
  if (!identifierPattern.test(schema) || !identifierPattern.test(table)) {
    return null;
  }

  return { schema, table };
};

const toQueryResultPayload = (
  result: {
    command: string;
    rowCount: number | null;
    fields: { name: string }[];
    rows: Record<string, unknown>[];
  },
): QueryResultPayload => ({
  command: result.command,
  rowCount: result.rowCount ?? 0,
  fields: result.fields.map((field) => field.name),
  rows: result.rows,
});

const createDatabaseConnectionString = (databaseName: string): string | null => {
  const base = process.env.DATABASE_URL;
  if (!base) return null;

  const parsed = new URL(base);
  parsed.pathname = `/${databaseName}`;
  return parsed.toString();
};

const createPoolForDatabase = (databaseName: string): Pool | null => {
  const connectionString = createDatabaseConnectionString(databaseName);
  if (!connectionString) return null;

  return new Pool({
    connectionString,
    ssl:
      process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
  });
};

const resolveTargetDatabase = async (
  providedDatabase: string | null,
): Promise<string> => {
  const parsedDatabase = parseIdentifier(providedDatabase || '');
  if (parsedDatabase) return parsedDatabase;

  const base = process.env.DATABASE_URL;
  if (!base) return 'postgres';

  try {
    const parsed = new URL(base);
    return parseIdentifier(parsed.pathname.replace(/^\//, '')) || 'postgres';
  } catch {
    return 'postgres';
  }
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
): Promise<NextResponse<API.Success | API.Failure>> {
  try {
    const auth = await authorizeRoot(request);
    if (!auth.ok) return auth.response;

    const postgres = accessPostgreSQL();
    if (!postgres.ok) {
      return NextResponse.json(postgres, {
        status: 500,
        headers: auth.headers,
      });
    }

    const client = await postgres.data.pool.connect();

    try {
      const { searchParams } = new URL(request.url);
      const action = searchParams.get('action') || 'metadata';
      const requestedDatabase = searchParams.get('database');

      const targetDatabase = await resolveTargetDatabase(requestedDatabase);

      const targetPool = createPoolForDatabase(targetDatabase);
      if (!targetPool) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              message: 'Unable to resolve target database connection.',
              origin: 'routes',
              method: 'GET',
            },
          },
          {
            status: 500,
            headers: auth.headers,
          },
        );
      }

      const targetClient = await targetPool.connect();

      try {
        if (action === 'rows') {
          const table = parseTableReference(searchParams.get('table') || '');
          if (!table) {
            return NextResponse.json(
              {
                ok: false,
                error: {
                  message: 'Invalid table reference.',
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

          const parsedLimit = Number(searchParams.get('limit') || '100');
          const limit = Number.isFinite(parsedLimit)
            ? Math.max(1, Math.min(500, Math.floor(parsedLimit)))
            : 100;

          const sql = `SELECT * FROM ${quoteIdentifier(table.schema)}.${quoteIdentifier(table.table)} LIMIT $1`;
          const result = await targetClient.query<Record<string, unknown>>(sql, [limit]);

          return NextResponse.json(
            {
              ok: true,
              data: {
                database: targetDatabase,
                table: `${table.schema}.${table.table}`,
                limit,
                result: toQueryResultPayload(result),
              },
            },
            {
              status: 200,
              headers: auth.headers,
            },
          );
        }

        const databasesResult = await client.query<DatabaseName>(`
          SELECT datname AS name
          FROM pg_database
          WHERE datistemplate = false
          ORDER BY datname ASC
        `);

        const schemasResult = await targetClient.query<DatabaseSchema>(`
          SELECT schema_name AS name
          FROM information_schema.schemata
          WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
          ORDER BY schema_name ASC
        `);

        const tablesResult = await targetClient.query<DatabaseTable>(`
          SELECT table_schema AS schema, table_name AS name
          FROM information_schema.tables
          WHERE table_type = 'BASE TABLE'
            AND table_schema NOT IN ('pg_catalog', 'information_schema')
          ORDER BY table_schema ASC, table_name ASC
        `);

        return NextResponse.json(
          {
            ok: true,
            data: {
              currentDatabase: targetDatabase,
              databases: databasesResult.rows,
              schemas: schemasResult.rows,
              tables: tablesResult.rows,
            },
          },
          {
            status: 200,
            headers: auth.headers,
          },
        );
      } finally {
        targetClient.release();
        await targetPool.end();
      }
    } finally {
      client.release();
    }
  } catch (caught) {
    const error = caught as Error;
    return NextResponse.json(
      {
        ok: false,
        error: {
          message: 'Database manager request failed.',
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

    const postgres = accessPostgreSQL();
    if (!postgres.ok) {
      return NextResponse.json(postgres, {
        status: 500,
        headers: auth.headers,
      });
    }

    const payload = (await request.json()) as {
      action?: string;
      database?: string;
      schemaName?: string;
      tableName?: string;
      columnsDefinition?: string;
      databaseName?: string;
      sql?: string;
    };

    const client = await postgres.data.pool.connect();

    try {
      const action = payload.action || 'query';

      if (action === 'create-database') {
        const databaseName = parseIdentifier(payload.databaseName || '');
        if (!databaseName) {
          return NextResponse.json(
            {
              ok: false,
              error: {
                message: 'Invalid database name.',
                origin: 'routes',
                method: 'POST',
              },
            },
            {
              status: 400,
              headers: auth.headers,
            },
          );
        }

        await client.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
        return NextResponse.json(
          {
            ok: true,
            data: {
              message: `Database ${databaseName} created.`,
            },
          },
          {
            status: 200,
            headers: auth.headers,
          },
        );
      }

      if (action === 'drop-database') {
        const databaseName = parseIdentifier(payload.databaseName || '');
        if (!databaseName) {
          return NextResponse.json(
            {
              ok: false,
              error: {
                message: 'Invalid database name.',
                origin: 'routes',
                method: 'POST',
              },
            },
            {
              status: 400,
              headers: auth.headers,
            },
          );
        }

        const currentDatabaseResult = await client.query<{ current_database: string }>(
          'SELECT current_database() AS current_database',
        );

        if (currentDatabaseResult.rows[0]?.current_database === databaseName) {
          return NextResponse.json(
            {
              ok: false,
              error: {
                message: 'Cannot drop currently connected database.',
                origin: 'routes',
                method: 'POST',
              },
            },
            {
              status: 400,
              headers: auth.headers,
            },
          );
        }

        await client.query(`DROP DATABASE ${quoteIdentifier(databaseName)}`);
        return NextResponse.json(
          {
            ok: true,
            data: {
              message: `Database ${databaseName} dropped.`,
            },
          },
          {
            status: 200,
            headers: auth.headers,
          },
        );
      }

      const targetDatabase = await resolveTargetDatabase(payload.database || null);
      const targetPool = createPoolForDatabase(targetDatabase);
      if (!targetPool) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              message: 'Unable to resolve target database connection.',
              origin: 'routes',
              method: 'POST',
            },
          },
          {
            status: 500,
            headers: auth.headers,
          },
        );
      }

      const targetClient = await targetPool.connect();

      try {
        if (action === 'create-schema') {
          const schemaName = parseIdentifier(payload.schemaName || '');
          if (!schemaName) {
            return NextResponse.json(
              {
                ok: false,
                error: {
                  message: 'Invalid schema name.',
                  origin: 'routes',
                  method: 'POST',
                },
              },
              {
                status: 400,
                headers: auth.headers,
              },
            );
          }

          await targetClient.query(`CREATE SCHEMA ${quoteIdentifier(schemaName)}`);
          return NextResponse.json(
            {
              ok: true,
              data: {
                message: `Schema ${schemaName} created in ${targetDatabase}.`,
              },
            },
            {
              status: 200,
              headers: auth.headers,
            },
          );
        }

        if (action === 'drop-schema') {
          const schemaName = parseIdentifier(payload.schemaName || '');
          if (!schemaName) {
            return NextResponse.json(
              {
                ok: false,
                error: {
                  message: 'Invalid schema name.',
                  origin: 'routes',
                  method: 'POST',
                },
              },
              {
                status: 400,
                headers: auth.headers,
              },
            );
          }

          await targetClient.query(`DROP SCHEMA ${quoteIdentifier(schemaName)} CASCADE`);
          return NextResponse.json(
            {
              ok: true,
              data: {
                message: `Schema ${schemaName} dropped from ${targetDatabase}.`,
              },
            },
            {
              status: 200,
              headers: auth.headers,
            },
          );
        }

        if (action === 'create-table') {
          const schemaName = parseIdentifier(payload.schemaName || 'public');
          const tableName = parseIdentifier(payload.tableName || '');
          const columnsDefinition = payload.columnsDefinition?.trim() || '';

          if (!schemaName || !tableName || !columnsDefinition) {
            return NextResponse.json(
              {
                ok: false,
                error: {
                  message: 'Schema, table, and column definition are required.',
                  origin: 'routes',
                  method: 'POST',
                },
              },
              {
                status: 400,
                headers: auth.headers,
              },
            );
          }

          const createTableSql = `
            CREATE TABLE ${quoteIdentifier(schemaName)}.${quoteIdentifier(tableName)} (
              ${columnsDefinition}
            )
          `;

          await targetClient.query(createTableSql);
          return NextResponse.json(
            {
              ok: true,
              data: {
                message: `Table ${schemaName}.${tableName} created in ${targetDatabase}.`,
              },
            },
            {
              status: 200,
              headers: auth.headers,
            },
          );
        }

        if (action === 'drop-table') {
          const schemaName = parseIdentifier(payload.schemaName || 'public');
          const tableName = parseIdentifier(payload.tableName || '');

          if (!schemaName || !tableName) {
            return NextResponse.json(
              {
                ok: false,
                error: {
                  message: 'Schema and table are required.',
                  origin: 'routes',
                  method: 'POST',
                },
              },
              {
                status: 400,
                headers: auth.headers,
              },
            );
          }

          await targetClient.query(
            `DROP TABLE ${quoteIdentifier(schemaName)}.${quoteIdentifier(tableName)} CASCADE`,
          );

          return NextResponse.json(
            {
              ok: true,
              data: {
                message: `Table ${schemaName}.${tableName} dropped from ${targetDatabase}.`,
              },
            },
            {
              status: 200,
              headers: auth.headers,
            },
          );
        }

        if (action !== 'query') {
          return NextResponse.json(
            {
              ok: false,
              error: {
                message: 'Unsupported action.',
                origin: 'routes',
                method: 'POST',
              },
            },
            {
              status: 400,
              headers: auth.headers,
            },
          );
        }

        const sql = payload.sql?.trim() || '';
        if (!sql) {
          return NextResponse.json(
            {
              ok: false,
              error: {
                message: 'SQL query is required.',
                origin: 'routes',
                method: 'POST',
              },
            },
            {
              status: 400,
              headers: auth.headers,
            },
          );
        }

        const result = await targetClient.query<Record<string, unknown>>(sql);
        return NextResponse.json(
          {
            ok: true,
            data: {
              database: targetDatabase,
              result: toQueryResultPayload(result),
            },
          },
          {
            status: 200,
            headers: auth.headers,
          },
        );
      } finally {
        targetClient.release();
        await targetPool.end();
      }
    } finally {
      client.release();
    }
  } catch (caught) {
    const error = caught as Error;
    return NextResponse.json(
      {
        ok: false,
        error: {
          message: 'Failed to execute SQL query.',
          origin: 'routes',
          method: 'POST',
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