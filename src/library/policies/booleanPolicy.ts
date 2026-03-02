interface Props {
  value?: boolean | string | null;
  returnFieldName: string | null;
}

export default function booleanPolicy({
  value,
  returnFieldName,
}: Props): API.Success | API.Failure {
  try {
    if (value === null || value === undefined || value === '') {
      return {
        ok: false,
        error: {
          message:
            'Kindly ensure that the field is not left empty. A boolean value is required to proceed.',
          origin: 'policies',
          method: 'booleanPolicy',
          field: returnFieldName,
        },
      };
    }

    if (typeof value === 'boolean') {
      return {
        ok: true,
        data: { value: value },
      };
    }

    if (typeof value === 'string') {
      const normalizedValue = value.trim().toLowerCase();
      if (normalizedValue === 'true') {
        return {
          ok: true,
          data: { value: true },
        };
      }

      if (normalizedValue === 'false') {
        return {
          ok: true,
          data: { value: false },
        };
      }
    }

    return {
      ok: false,
      error: {
        message: 'The value provided is not a valid boolean.',
        origin: 'policies',
        method: 'booleanPolicy',
        field: returnFieldName,
      },
    };
  } catch (e: unknown) {
    const error = e as Error;
    return {
      ok: false,
      error: {
        message: 'Unable to enforce boolean policy.',
        origin: 'policies',
        method: 'booleanPolicy',
        field: returnFieldName,
        raw: {
          name: error.name,
          message: error.message,
        },
      },
    };
  }
}
