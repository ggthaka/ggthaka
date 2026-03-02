export default function generateOtp(length = 6): API.Success | API.Failure {
  try {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let otp = '';

    for (let i = 0; i < length; i++) {
      otp += chars[Math.floor(Math.random() * chars.length)];
    }

    return {
      ok: true,
      data: { otp: otp },
    };
  } catch (e: unknown) {
    const error = e as Error;

    return {
      ok: false,
      error: {
        message: 'Unable to generate OTP.',
        origin: 'utilities',
        method: 'generateOtp',
        raw: {
          name: error.name,
          message: error.message,
        },
      },
    };
  }
}
