interface Props {
  id: string;
  returnFieldName: string | null;
}

export default function idPolicy({
  id,
  returnFieldName,
}: Props): API.Success | API.Failure {
  try {
    const normalizedId = id?.trim();
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!normalizedId) {
      return {
        ok: false,
        error: {
          message:
            'Kindly ensure that the id field is not left empty. A valid UUID is required to proceed.',
          origin: 'policies',
          method: 'idPolicy',
          field: returnFieldName,
        },
      };
    }

    if (!uuidRegex.test(normalizedId)) {
      return {
        ok: false,
        error: {
          message: 'The id provided is not a valid UUID.',
          origin: 'policies',
          method: 'idPolicy',
          field: returnFieldName,
        },
      };
    }

    return {
      ok: true,
      data: { id: normalizedId },
    };
  } catch (e: unknown) {
    const error = e as Error;
    return {
      ok: false,
      error: {
        message: 'Unable to enforce id policy.',
        origin: 'policies',
        method: 'idPolicy',
        field: returnFieldName,
        raw: {
          name: error.name,
          message: error.message,
        },
      },
    };
  }
}
