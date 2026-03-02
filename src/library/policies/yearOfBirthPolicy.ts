interface Props {
  yearOfBirth: number | string;
  returnFieldName: string | null;
}

export default function yearOfBirthPolicy({
  yearOfBirth,
  returnFieldName,
}: Props): API.Success | API.Failure {
  try {
    const currentYear = new Date().getFullYear();
    const normalizedYearOfBirth =
      typeof yearOfBirth === 'string'
        ? Number(yearOfBirth.trim())
        : yearOfBirth;

    if (yearOfBirth === null || yearOfBirth === undefined) {
      return {
        ok: false,
        error: {
          message:
            'Kindly ensure that the year of birth field is not left empty in order to proceed.',
          origin: 'policies',
          method: 'yearOfBirthPolicy',
          field: returnFieldName,
        },
      };
    }

    if (!Number.isFinite(normalizedYearOfBirth)) {
      return {
        ok: false,
        error: {
          message: 'Year of birth must be a valid number.',
          origin: 'policies',
          method: 'yearOfBirthPolicy',
          field: returnFieldName,
        },
      };
    }

    if (!Number.isInteger(normalizedYearOfBirth)) {
      return {
        ok: false,
        error: {
          message: 'Year of birth must be a whole number.',
          origin: 'policies',
          method: 'yearOfBirthPolicy',
          field: returnFieldName,
        },
      };
    }

    if (normalizedYearOfBirth < 1900 || normalizedYearOfBirth > currentYear) {
      return {
        ok: false,
        error: {
          message: `Year of birth must be between 1900 and ${currentYear}.`,
          origin: 'policies',
          method: 'yearOfBirthPolicy',
          field: returnFieldName,
        },
      };
    }

    const age = currentYear - normalizedYearOfBirth;
    if (age < 13) {
      return {
        ok: false,
        error: {
          message: 'You must be at least 13 years old to proceed.',
          origin: 'policies',
          method: 'yearOfBirthPolicy',
          field: returnFieldName,
        },
      };
    }

    return {
      ok: true,
      data: { yearOfBirth: normalizedYearOfBirth },
    };
  } catch (e: unknown) {
    const error = e as Error;
    return {
      ok: false,
      error: {
        message: 'Unable to enforce year of birth policy.',
        origin: 'policies',
        method: 'yearOfBirthPolicy',
        field: returnFieldName,
        raw: {
          name: error.name,
          message: error.message,
        },
      },
    };
  }
}
