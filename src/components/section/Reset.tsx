'use client';

import { Section } from '@components/layout';
import { Form, Input, Message } from '@components/shared';
import { useReset } from '@library/hooks';
import { ResetStyles } from '@styles/section';

export default function Reset() {
  const { formData, handleChange, handleSubmit, message, loading, fieldError } =
    useReset();

  return (
    <Section className={ResetStyles.Reset}>
      <Form
        method={handleSubmit}
        loading={loading}
      >
        {message && <Message>{message}</Message>}
        <Input
          type='email'
          placeholder='your@email.here'
          id='email'
          label='Email'
          value={formData.email}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='submit'
          value='Reset'
        />
      </Form>
    </Section>
  );
}
