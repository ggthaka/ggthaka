'use client';

import { Section } from '@components/layout';
import { Form, Input, Message } from '@components/shared';
import { useRegister } from '@library/hooks';
import { RegisterStyles } from '@styles/section';

export default function Register() {
  const { formData, handleChange, handleSubmit, message, loading, fieldError } =
    useRegister();

  return (
    <Section className={RegisterStyles.Register}>
      <Form
        method={handleSubmit}
        loading={loading}
      >
        {message && <Message>{message}</Message>}
        <Input
          type='email'
          id='email'
          label='Email'
          placeholder='your@email.here'
          value={formData.email}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='password'
          id='password'
          label='Password'
          placeholder='<rgM_Xzv'
          value={formData.password}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='password'
          id='confirmPassword'
          label='Confirm Password'
          placeholder='<rgM_Xzv'
          value={formData.confirmPassword}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='text'
          id='firstName'
          label='First Name'
          placeholder='John'
          value={formData.firstName}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='text'
          id='lastName'
          label='Last Name'
          placeholder='Doe'
          value={formData.lastName}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='number'
          id='yearOfBirth'
          label='Year Of Birth'
          placeholder='2000'
          value={formData.yearOfBirth}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='text'
          id='sex'
          label='Sex'
          placeholder='Male/Female'
          value={formData.sex}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='text'
          id='country'
          label='Country'
          placeholder='Kenya'
          value={formData.country}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='submit'
          value='Register'
        />
      </Form>
    </Section>
  );
}
