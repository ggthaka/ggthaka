interface Props {
  attempts: number;
  minAttempts?: number;
}

export default function loginPolicy({
  attempts,
  minAttempts = 1,
}: Props): API.Success | API.Failure {
  if (attempts === undefined || attempts === null || Number.isNaN(attempts)) {
    return {
      ok: false,
      error: {
        message:
          'We couldn’t verify your login attempt count. Please try again or contact support if the issue continues.',
        origin: 'policies',
        method: 'loginPolicy',
      },
    };
  }

  if (attempts < 0) {
    return {
      ok: false,
      error: {
        message:
          'Something went wrong while tracking your login attempts. Please contact support for assistance.',
        origin: 'policies',
        method: 'loginPolicy',
      },
    };
  }

  if (attempts < minAttempts) {
    return {
      ok: false,
      error: {
        message:
          'Your account has been temporarily locked for security reasons after multiple failed login attempts. Please reset your password or reach out to support to regain access.',
        origin: 'policies',
        method: 'loginPolicy',
      },
    };
  }

  return {
    ok: true,
  };
}
