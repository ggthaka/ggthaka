import nodemailer, { Transporter } from 'nodemailer';

let transporter: Transporter | null = null;

export default function accessNodemailer(): API.Success | API.Failure {
  try {
    const { GOOGLE_USER, GOOGLE_PASSWORD } = process.env;

    if (!GOOGLE_USER || !GOOGLE_PASSWORD) {
      return {
        ok: false,
        error: {
          message: 'GOOGLE_USER or GOOGLE_PASSWORD is not defined.',
          origin: 'utilities',
          method: 'accessNodemailer',
        },
      };
    }

    if (!transporter) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: GOOGLE_USER,
          pass: GOOGLE_PASSWORD,
        },
      });
    }

    return { ok: true, data: { transporter } };
  } catch (e: unknown) {
    const error = e as Error;
    return {
      ok: false,
      error: {
        message: 'Failed to initialize Nodemailer transporter.',
        origin: 'utilities',
        method: 'accessNodemailer',
        raw: { name: error.name, message: error.message },
      },
    };
  }
}
