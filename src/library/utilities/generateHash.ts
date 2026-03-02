import bcrypt from 'bcryptjs';

interface Props {
  value: string;
}

export default function generateHash({
  value,
}: Props): API.Success | API.Failure {
  try {
    const saltEnv = process.env.BCRYPTJS_SALT;
    if (!saltEnv) {
      return {
        ok: false,
        error: {
          message: 'BCRYPTJS_SALT environment variable is not defined.',
          origin: 'utilities',
          method: 'generateHash',
        },
      };
    }

    const saltRounds = Number(saltEnv);
    if (isNaN(saltRounds) || saltRounds <= 0) {
      return {
        ok: false,
        error: {
          message: 'BCRYPTJS_SALT must be a positive number.',
          origin: 'utilities',
          method: 'generateHash',
        },
      };
    }

    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(value, salt);

    return {
      ok: true,
      data: { hash },
    };
  } catch (e: unknown) {
    const error = e as Error;

    return {
      ok: false,
      error: {
        message: 'Unable to generate hash.',
        origin: 'utilities',
        method: 'generateHash',
        raw: {
          name: error.name,
          message: error.message,
        },
      },
    };
  }
}
