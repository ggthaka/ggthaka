import { accessNodemailer, loadEmailTemplate } from '@library/utilities';

interface Props {
  to: string;
  subject: string;
  template: string;
  data: Record<string, string>;
}

export default async function sendOtp({
  to,
  subject,
  template,
  data,
}: Props): Promise<API.Success | API.Failure> {
  const templateResponse = await loadEmailTemplate(template, data);
  if (!templateResponse.ok) return templateResponse;

  const html = templateResponse.data.content;

  const mailer = accessNodemailer();
  if (!mailer.ok) return mailer;

  const { transporter } = mailer.data;

  const mailOptions = {
    from: 'noreply@githaka',
    to: String(to),
    subject: String(subject),
    html: String(html),
  };

  try {
    await transporter.sendMail(mailOptions);
    return { ok: true };
  } catch (e: unknown) {
    const error = e as Error;
    console.log(error);
    return {
      ok: false,
      error: {
        message: 'Failed to send OTP.',
        origin: 'utilities',
        method: 'sendOtp',
        raw: { name: error.name, message: error.message },
      },
    };
  }
}
