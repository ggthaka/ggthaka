interface Props {
  hash: string;
  returnFieldName: string | null;
}

export default function hashPolicy({
  hash,
  returnFieldName,
}: Props): API.Success | API.Failure {
  try {
    const normalizedHash = hash?.trim();
    const bcryptHashRegex = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

    if (!normalizedHash) {
      return {
        ok: false,
        error: {
          message:
            'Kindly ensure that the hash field is not left empty. A valid hash is required to proceed.',
          origin: 'policies',
          method: 'hashPolicy',
          field: returnFieldName,
        },
      };
    }

    if (!bcryptHashRegex.test(normalizedHash)) {
      return {
        ok: false,
        error: {
          message: 'The hash provided is not a valid bcrypt hash.',
          origin: 'policies',
          method: 'hashPolicy',
          field: returnFieldName,
        },
      };
    }

    return {
      ok: true,
      data: { hash: normalizedHash },
    };
  } catch (e: unknown) {
    const error = e as Error;
    return {
      ok: false,
      error: {
        message: 'Unable to enforce hash policy.',
        origin: 'policies',
        method: 'hashPolicy',
        field: returnFieldName,
        raw: {
          name: error.name,
          message: error.message,
        },
      },
    };
  }
}
