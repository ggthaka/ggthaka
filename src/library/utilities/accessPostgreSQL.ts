import { Pool } from 'pg';

let pool: Pool | null = null;

export default function accessPostgreSQL(): API.Success | API.Failure {
  try {
    if (!process.env.DATABASE_URL) {
      return {
        ok: false,
        error: {
          message: 'DATABASE_URL is not defined.',
          origin: 'utilities',
          method: 'accessPostgreSQL',
        },
      };
    }

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false,
    });

    return { ok: true, data: { pool } };
  } catch (e: unknown) {
    const error = e as Error;
    return {
      ok: false,
      error: {
        message: 'Failed to initialize PostgreSQL pool.',
        origin: 'utilities',
        method: 'accessPostgreSQL',
        raw: { name: error.name, message: error.message },
      },
    };
  }
}
