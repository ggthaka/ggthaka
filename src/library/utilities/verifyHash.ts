import bcrypt from 'bcryptjs';

interface Props {
  hash: string;
  value: string;
  remainingAttempts: number;
}

export default function verifyHash({
  hash,
  value,
  remainingAttempts,
}: Props): API.Success | API.Failure {
  try {
    const match = bcrypt.compareSync(value, hash);

    if (!match) {
      const attemptMessage =
        remainingAttempts > 1
          ? `Incorrect password. You have ${remainingAttempts} attempts left.`
          : remainingAttempts === 1
          ? `Incorrect password. This is your last attempt before your account is temporarily locked.`
          : `Your account has been locked due to too many failed login attempts. Please reset your password or contact support.`;

      return {
        ok: false,
        error: {
          message: attemptMessage,
          origin: 'utilities',
          method: 'verifyHash',
        },
      };
    }

    return {
      ok: true,
    };
  } catch (e: unknown) {
    const error = e as Error;

    return {
      ok: false,
      error: {
        message:
          'An unexpected error occurred while verifying your password. Please try again.',
        origin: 'utilities',
        method: 'verifyHash',
        raw: {
          name: error.name,
          message: error.message,
        },
      },
    };
  }
}
