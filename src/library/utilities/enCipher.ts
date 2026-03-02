import crypto from 'crypto';

const algorithm = 'aes-256-cbc';

interface Props {
  message: string;
}

export default function enCipher({
  message,
}: Props): API.Success | API.Failure {
  try {
    const keyHex = process.env.CRYPTO_KEY;
    const ivHex = process.env.CRYPTO_IV;

    if (!keyHex || !ivHex) {
      return {
        ok: false,
        error: {
          message:
            'CRYPTO_KEY and CRYPTO_IV must be set in the environment variables',
          origin: 'utilities',
          method: 'enCipher',
        },
      };
    }

    const key = Buffer.from(keyHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(message, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      ok: true,
      data: { cipher: encrypted },
    };
  } catch (e: unknown) {
    const error = e as Error;

    return {
      ok: false,
      error: {
        message: 'Encryption failed.',
        origin: 'utilities',
        method: 'enCipher',
        raw: { name: error.name, message: error.message },
      },
    };
  }
}
