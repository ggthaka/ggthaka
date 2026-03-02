import crypto from 'crypto';

const algorithm = 'aes-256-cbc';

interface Props {
  cipher: string;
}

export default function deCipher({ cipher }: Props): API.Success | API.Failure {
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
          method: 'deCipher',
        },
      };
    }

    const key = Buffer.from(keyHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(cipher, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return {
      ok: true,
      data: { message: decrypted },
    };
  } catch (e: unknown) {
    const error = e as Error;

    return {
      ok: false,
      error: {
        message: 'Decryption failed.',
        origin: 'utilities',
        method: 'deCipher',
        raw: { name: error.name, message: error.message },
      },
    };
  }
}
