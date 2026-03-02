import { accessPostgreSQL } from '@library/utilities';

interface Props {
  user: {
    id: string;

    // authentication & authorization
    email: string;
    hash: string;
    role: string;

    // password reset
    password_reset_otp?: string | null;
    password_reset_expiry?: string | null;
    password_reset_attempts: number;

    // profile
    first_name: string;
    last_name: string;
    year_of_birth: number;
    sex: string;
    country: string;

    // meta
    disabled: boolean;
    verified: boolean;
    created: string;
    updated: string;
  };
}

export default async function addUser({
  user,
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
      INSERT INTO users (
        id,
        email,
        hash,
        role,
        password_reset_otp,
        password_reset_expiry,
        password_reset_attempts,
        first_name,
        last_name,
        year_of_birth,
        sex,
        country,
        disabled,
        verified,
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
        $11,
        $12,
        $13,
        $14,
        $15,
        $16
      )
      RETURNING *;
    `;

    const values = [
      user.id,
      user.email,
      user.hash,
      user.role,
      user.password_reset_otp ?? null,
      user.password_reset_expiry ?? null,
      user.password_reset_attempts,
      user.first_name,
      user.last_name,
      user.year_of_birth,
      user.sex,
      user.country,
      user.disabled,
      user.verified,
      user.created,
      user.updated,
    ];

    const result = await client.query(query, values);

    await client.query('COMMIT');

    return {
      ok: true,
      data: { user: result.rows[0] },
    };
  } catch (e: unknown) {
    if (client) {
      await client.query('ROLLBACK');
    }

    const error = e as Error;

    return {
      ok: false,
      error: {
        message: 'Failed to add user.',
        origin: 'handlers',
        method: 'addUser',
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
