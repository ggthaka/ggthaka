'use client';

import { Section } from '@components/layout';
import { Form, Input, Message } from '@components/shared';
import { useEditUser } from '@library/hooks';
import { EditUserStyles } from '@styles/section';

interface Props {
  id: string;
  email: string;
  hash: string;
  role: string;
  passwordResetOtp: string;
  passwordResetExpiry: string;
  passwordResetAttempts: number;
  firstName: string;
  lastName: string;
  yearOfBirth: number;
  sex: string;
  country: string;
  disabled: string;
  verified: string;
  created: string;
  updated: string;
}

export default function EditUser({
  id,
  email,
  hash,
  role,
  passwordResetOtp,
  passwordResetExpiry,
  passwordResetAttempts,
  firstName,
  lastName,
  yearOfBirth,
  sex,
  country,
  disabled,
  verified,
  created,
  updated,
}: Props) {
  const { formData, handleChange, handleSubmit, message, loading, fieldError } =
    useEditUser({
      id,
      email,
      hash,
      role,
      passwordResetOtp,
      passwordResetExpiry,
      passwordResetAttempts,
      firstName,
      lastName,
      yearOfBirth,
      sex,
      country,
      disabled,
      verified,
      created,
      updated,
    });
  return (
    <Section
      id='edit-user'
      className={EditUserStyles.EditUser}
    >
      <Form
        method={handleSubmit}
        loading={loading}
      >
        {message && <Message>{message}</Message>}
        <Input
          type='text'
          placeholder='dde14517-3404-4755-bb2f-56f16e3ea775'
          id='id'
          label='ID'
          value={formData.id}
          method={handleChange}
          fieldError={fieldError}
        />
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
          type='hash'
          placeholder='$2b$10$8teCs3/Fqv.8tp7C44fiw.KMtXXizjkKKr4cMTgmwyINYGKD26NQ2'
          id='hash'
          label='Hash'
          value={formData.hash}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='text'
          placeholder='user/root ...'
          id='role'
          label='Role'
          value={formData.role}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='text'
          placeholder='123ABC'
          id='passwordResetOtp'
          label='Password Reset OTP'
          value={formData.passwordResetOtp}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='text'
          placeholder='2026-02-08T10:51:12.126Z'
          id='passwordResetExpiry'
          label='Password Reset Expiry'
          value={formData.passwordResetExpiry}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='number'
          placeholder='3'
          id='passwordResetAttempts'
          label='Password Reset Attempts'
          value={formData.passwordResetAttempts}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='text'
          placeholder='John'
          id='firstName'
          label='First Name'
          value={formData.firstName}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='text'
          placeholder='Doe'
          id='lastName'
          label='Last Name'
          value={formData.lastName}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='number'
          placeholder='2000'
          id='yearOfBirth'
          label='Year Of Birth'
          value={formData.yearOfBirth}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='text'
          placeholder='Sex'
          id='sex'
          label='Sex'
          value={formData.sex}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='country'
          placeholder='Kenya'
          id='country'
          label='Country'
          value={formData.country}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='text'
          placeholder='true/false'
          id='disabled'
          label='Disabled'
          value={String(formData.disabled)}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='text'
          placeholder='true/false'
          id='verified'
          label='Verified'
          value={String(formData.verified)}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='text'
          placeholder='Created'
          id='created'
          label='Created'
          value={formData.created}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='text'
          placeholder='Updated'
          id='updated'
          label='Updated'
          value={formData.updated}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='submit'
          value='Update'
        />
      </Form>
    </Section>
  );
}
