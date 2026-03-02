interface Props {
  sex: string;
  returnFieldName: string | null;
}

export default function sexPolicy({
  sex,
  returnFieldName,
}: Props): API.Success | API.Failure {
  try {
    const normalizedSex = sex?.trim().toLocaleLowerCase();

    if (!normalizedSex) {
      return {
        ok: false,
        error: {
          message:
            'Kindly ensure that the sex field is not left empty in order to proceed.',
          origin: 'policies',
          method: 'sexPolicy',
          field: returnFieldName,
        },
      };
    }

    if (normalizedSex !== 'male' && normalizedSex !== 'female') {
      return {
        ok: false,
        error: {
          message: 'Only male or female parameters are accepted.',
          origin: 'policies',
          method: 'sexPolicy',
          field: returnFieldName,
        },
      };
    }

    return {
      ok: true,
      data: { sex: normalizedSex },
    };
  } catch (e: unknown) {
    const error = e as Error;
    return {
      ok: false,
      error: {
        message: 'Unable to enforce sex policy.',
        origin: 'policies',
        method: 'sexPolicy',
        field: returnFieldName,
        raw: {
          name: error.name,
          message: error.message,
        },
      },
    };
  }
}
