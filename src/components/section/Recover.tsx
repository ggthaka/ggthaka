'use client';

import { Section } from '@components/layout';
import { Form, Input, Message } from '@components/shared';
import { useRecover } from '@library/hooks';
import { RecoverStyles } from '@styles/section';

export default function Recover() {
  const { formData, handleChange, handleSubmit, message, loading, fieldError } =
    useRecover();

  return (
    <Section className={RecoverStyles.Recover}>
      <Form
        method={handleSubmit}
        loading={loading}
      >
        {message && <Message>{message}</Message>}
        <Input
          type='password'
          placeholder='<rgM_Xzv'
          id='password'
          label='Password'
          value={formData.password}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='password'
          placeholder='<rgM_Xzv'
          id='confirmPassword'
          label='Confirm Password'
          value={formData.confirmPassword}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='submit'
          value='Recover'
        />
      </Form>
    </Section>
  );
}
