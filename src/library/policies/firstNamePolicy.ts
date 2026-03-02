interface Props {
  firstName: string;
  returnFieldName: string | null;
}

export default function firstNamePolicy({
  firstName,
  returnFieldName,
}: Props): API.Success | API.Failure {
  try {
    const normalizedFirstName = firstName?.trim();
    const nameRegex = /^[A-Za-z]+(?:['-][A-Za-z]+)*$/;

    if (!normalizedFirstName) {
      return {
        ok: false,
        error: {
          message:
            'Kindly ensure that the first name field is not left empty in order to proceed.',
          origin: 'policies',
          method: 'firstNamePolicy',
          field: returnFieldName,
        },
      };
    }

    if (normalizedFirstName.length < 2 || normalizedFirstName.length > 50) {
      return {
        ok: false,
        error: {
          message: 'First name must be between 2 and 50 characters long.',
          origin: 'policies',
          method: 'firstNamePolicy',
          field: returnFieldName,
        },
      };
    }

    if (!nameRegex.test(normalizedFirstName)) {
      return {
        ok: false,
        error: {
          message:
            'First name may only contain letters and conventional characters like apostrophes or hyphens, with no spaces.',
          origin: 'policies',
          method: 'firstNamePolicy',
          field: returnFieldName,
        },
      };
    }

    const lowerCasedFirstName = normalizedFirstName.toLocaleLowerCase();
    const formattedFirstName =
      lowerCasedFirstName.charAt(0).toLocaleUpperCase() +
      lowerCasedFirstName.slice(1);

    return {
      ok: true,
      data: { firstName: formattedFirstName },
    };
  } catch (e: unknown) {
    const error = e as Error;
    return {
      ok: false,
      error: {
        message: 'Unable to enforce first name policy.',
        origin: 'policies',
        method: 'firstNamePolicy',
        field: returnFieldName,
        raw: {
          name: error.name,
          message: error.message,
        },
      },
    };
  }
}
