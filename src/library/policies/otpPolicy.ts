interface Props {
  otp: string;
  length?: number;
  validate?: {
    passwordOtp: string;
    passwordOtpExpiry: string;
  };
  returnFieldName: string | null;
}

export default function otpPolicy({
  otp,
  length = 6,
  validate,
  returnFieldName,
}: Props): API.Success | API.Failure {
  const allowedChars = /^[A-Z0-9]+$/;

  if (!otp) {
    return {
      ok: false,
      error: {
        message: 'OTP must not be empty.',
        origin: 'policies',
        method: 'otpPolicy',
        field: returnFieldName,
      },
    };
  }

  if (otp.length !== length) {
    return {
      ok: false,
      error: {
        message: `OTP must be exactly ${length} characters long.`,
        origin: 'policies',
        method: 'otpPolicy',
        field: returnFieldName,
      },
    };
  }

  if (!allowedChars.test(otp)) {
    return {
      ok: false,
      error: {
        message:
          'OTP must contain only uppercase letters (A-Z) and numbers (0-9), with no spaces or special characters.',
        origin: 'policies',
        method: 'otpPolicy',
        field: returnFieldName,
      },
    };
  }

  if (validate) {
    const { passwordOtp, passwordOtpExpiry } = validate;

    if (!passwordOtp) {
      return {
        ok: false,
        error: {
          message: 'Stored PASSWORD_OTP must be provided for validation.',
          origin: 'policies',
          method: 'otpPolicy',
          field: returnFieldName,
        },
      };
    }

    if (otp !== passwordOtp.toUpperCase()) {
      return {
        ok: false,
        error: {
          message: 'Invalid OTP. Please check and try again.',
          origin: 'policies',
          method: 'otpPolicy',
          field: returnFieldName,
        },
      };
    }

    if (!passwordOtpExpiry) {
      return {
        ok: false,
        error: {
          message: 'OTP expiry timestamp (PASSWORD_OTP_EXPIRY) is missing.',
          origin: 'policies',
          method: 'otpPolicy',
          field: returnFieldName,
        },
      };
    }

    const expiryTime = new Date(passwordOtpExpiry).getTime();
    if (isNaN(expiryTime)) {
      return {
        ok: false,
        error: {
          message: 'Invalid OTP expiry timestamp format (PASSWORD_OTP_EXPIRY).',
          origin: 'policies',
          method: 'otpPolicy',
          field: returnFieldName,
        },
      };
    }

    const now = Date.now();
    if (now > expiryTime) {
      return {
        ok: false,
        error: {
          message: 'OTP has expired. Please request a new one.',
          origin: 'policies',
          method: 'otpPolicy',
          field: returnFieldName,
        },
      };
    }
  }

  return {
    ok: true,
    data: { otp: otp.toUpperCase() },
  };
}
