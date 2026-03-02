interface Props {
  expiry: string;
}

export default function sessionPolicy({
  expiry,
}: Props): API.Success | API.Failure {
  const expiryTime = new Date(expiry).getTime();
  if (isNaN(expiryTime)) {
    return {
      ok: false,
      error: {
        message: 'Invalid OTP expiry timestamp format.',
        origin: 'policies',
        method: 'sessionPolicy',
      },
    };
  }

  const now = Date.now();
  if (now > expiryTime) {
    return {
      ok: false,
      error: {
        message: 'Session has expired. Please login again.',
        origin: 'policies',
        method: 'sessionPolicy',
      },
    };
  }

  return {
    ok: true,
  };
}
