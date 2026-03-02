'use client';

import { Section } from '@components/layout';
import { Form, Input, Message } from '@components/shared';
import { useOtp } from '@library/hooks';
import { OtpStyles } from '@styles/section';

export default function Otp() {
  const { formData, handleChange, handleSubmit, message, loading, fieldError } =
    useOtp();

  return (
    <Section className={OtpStyles.Otp}>
      <Form
        method={handleSubmit}
        loading={loading}
      >
        {message && <Message>{message}</Message>}
        <Input
          type='text'
          placeholder='3DYRLM'
          id='otp'
          label='OTP'
          value={formData.otp}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='submit'
          value='Submit'
        />
      </Form>
    </Section>
  );
}
