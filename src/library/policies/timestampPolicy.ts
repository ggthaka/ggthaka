interface Props {
  timestamp?: string | null;
  returnFieldName: string | null;
}

export default function timestampPolicy({
  timestamp,
  returnFieldName,
}: Props): API.Success | API.Failure {
  try {
    const normalizedTimestamp = timestamp?.trim();

    if (!normalizedTimestamp) {
      return {
        ok: true,
        data: { timestamp: null },
      };
    }

    const parsedTime = new Date(normalizedTimestamp).getTime();
    if (Number.isNaN(parsedTime)) {
      return {
        ok: false,
        error: {
          message: 'The timestamp provided is not a valid date value.',
          origin: 'policies',
          method: 'timestampPolicy',
          field: returnFieldName,
        },
      };
    }

    return {
      ok: true,
      data: { timestamp: normalizedTimestamp },
    };
  } catch (e: unknown) {
    const error = e as Error;
    return {
      ok: false,
      error: {
        message: 'Unable to enforce timestamp policy.',
        origin: 'policies',
        method: 'timestampPolicy',
        field: returnFieldName,
        raw: {
          name: error.name,
          message: error.message,
        },
      },
    };
  }
}
