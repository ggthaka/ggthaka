interface Props {
  password: string;
  confirmPassword?: string;
  type: 'login' | 'register';
}

export default function passwordPolicy({
  password,
  confirmPassword,
  type,
}: Props): API.Success | API.Failure {
  if (type == 'login') {
    if (!password) {
      return {
        ok: false,
        error: {
          message: 'Please ensure the password field is not left empty.',
          origin: 'policies',
          method: 'passwordPolicy',
          field: 'password',
        },
      };
    }
  }

  if (type === 'register') {
    if (!password) {
      return {
        ok: false,
        error: {
          message: 'Please ensure the password field is not left empty.',
          origin: 'policies',
          method: 'passwordPolicy',
          field: 'password',
        },
      };
    }

    if (!confirmPassword) {
      return {
        ok: false,
        error: {
          message:
            'Please ensure the confirm password field is not left empty.',
          origin: 'policies',
          method: 'passwordPolicy',
          field: 'confirmPassword',
        },
      };
    }

    if (password !== confirmPassword) {
      return {
        ok: false,
        error: {
          message:
            'Please ensure the password and confirm password fields match.',
          origin: 'policies',
          method: 'passwordPolicy',
          field: 'confirmPassword',
        },
      };
    }
  }

  if (password.length < 8) {
    return {
      ok: false,
      error: {
        message: 'Password must be at least 8 characters long.',
        origin: 'policies',
        method: 'passwordPolicy',
        field: 'password',
      },
    };
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const hasWhitespace = /\s/.test(password);

  if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
    return {
      ok: false,
      error: {
        message:
          'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character.',
        origin: 'policies',
        method: 'passwordPolicy',
        field: 'password',
      },
    };
  }

  if (hasWhitespace) {
    return {
      ok: false,
      error: {
        message: 'Password must not contain spaces.',
        origin: 'policies',
        method: 'passwordPolicy',
        field: 'password',
      },
    };
  }

  return {
    ok: true,
    data: { password: password, confirmPassword: confirmPassword },
  };
}
