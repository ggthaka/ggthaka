interface Props {
  lastName: string;
  returnFieldName: string | null;
}

export default function lastNamePolicy({
  lastName,
  returnFieldName,
}: Props): API.Success | API.Failure {
  try {
    const normalizedLastName = lastName?.trim();
    const nameRegex = /^[A-Za-z]+(?:['-][A-Za-z]+)*$/;

    if (!normalizedLastName) {
      return {
        ok: false,
        error: {
          message:
            'Kindly ensure that the last name field is not left empty in order to proceed.',
          origin: 'policies',
          method: 'lastNamePolicy',
          field: returnFieldName,
        },
      };
    }

    if (normalizedLastName.length < 2 || normalizedLastName.length > 50) {
      return {
        ok: false,
        error: {
          message: 'Last name must be between 2 and 50 characters long.',
          origin: 'policies',
          method: 'lastNamePolicy',
          field: returnFieldName,
        },
      };
    }

    if (!nameRegex.test(normalizedLastName)) {
      return {
        ok: false,
        error: {
          message:
            'Last name may only contain letters and conventional characters like apostrophes or hyphens, with no spaces.',
          origin: 'policies',
          method: 'lastNamePolicy',
          field: returnFieldName,
        },
      };
    }

    const lowerCasedLastName = normalizedLastName.toLocaleLowerCase();
    const formattedLastName =
      lowerCasedLastName.charAt(0).toLocaleUpperCase() +
      lowerCasedLastName.slice(1);

    return {
      ok: true,
      data: { lastName: formattedLastName },
    };
  } catch (e: unknown) {
    const error = e as Error;
    return {
      ok: false,
      error: {
        message: 'Unable to enforce last name policy.',
        origin: 'policies',
        method: 'lastNamePolicy',
        field: returnFieldName,
        raw: {
          name: error.name,
          message: error.message,
        },
      },
    };
  }
}
