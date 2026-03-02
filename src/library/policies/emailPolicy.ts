interface Props {
  email: string;
  returnFieldName: string | null;
}

export default function emailPolicy({
  email,
  returnFieldName,
}: Props): API.Success | API.Failure {
  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      return {
        ok: false,
        error: {
          message:
            'Kindly ensure that the email field is not left empty. A valid email address is required to proceed.',
          origin: 'policies',
          method: 'emailPolicy',
          field: returnFieldName,
        },
      };
    }

    if (!emailRegex.test(email)) {
      return {
        ok: false,
        error: {
          message:
            'The email address provided is not properly formatted. Please enter a valid email address.',
          origin: 'policies',
          method: 'emailPolicy',
          field: returnFieldName,
        },
      };
    }

    if (!email.endsWith('@gmail.com')) {
      return {
        ok: false,
        error: {
          message:
            'Kindly note that we currently accept Google email addresses (@gmail.com) only. Thank you for your understanding.',
          origin: 'policies',
          method: 'emailPolicy',
          field: returnFieldName,
        },
      };
    }

    return {
      ok: true,
      data: { email: email },
    };
  } catch (e: unknown) {
    const error = e as Error;
    return {
      ok: false,
      error: {
        message: 'Unable to enforce email policy.',
        origin: 'policies',
        method: 'emailPolicy',
        field: returnFieldName,
        raw: {
          name: error.name,
          message: error.message,
        },
      },
    };
  }
}
