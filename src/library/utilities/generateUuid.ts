import { v4 as uuidv4 } from 'uuid';

export default function generateUuid(): API.Success | API.Failure {
  try {
    const uuid = uuidv4();

    return {
      ok: true,
      data: { uuid: uuid },
    };
  } catch (e: unknown) {
    const error = e as Error;

    return {
      ok: false,
      error: {
        message: 'Unable to generate UUID.',
        origin: 'utilities',
        method: 'generateUuid',
        raw: {
          name: error.name,
          message: error.message,
        },
      },
    };
  }
}
