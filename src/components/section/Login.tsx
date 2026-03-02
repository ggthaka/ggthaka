'use client';

import { Section } from '@components/layout';
import { Form, Input, Message } from '@components/shared';
import { useLogin } from '@library/hooks';
import { LoginStyles } from '@styles/section';

export default function Login() {
  const { formData, handleChange, handleSubmit, message, loading, fieldError } =
    useLogin();

  return (
    <Section className={LoginStyles.Login}>
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
          type='password'
          placeholder='<rgM_Xzv'
          id='password'
          label='Password'
          value={formData.password}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='submit'
          value='Login'
        />
      </Form>
    </Section>
  );
}
