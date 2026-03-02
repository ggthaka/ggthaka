'use client';

import { Section } from '@components/layout';
import { Form, Input, Message } from '@components/shared';
import { useCreateUser } from '@library/hooks';
import { CreateBlogStyles } from '@styles/section';

export default function CreateUser() {
  const { formData, handleChange, handleSubmit, message, loading, fieldError } =
    useCreateUser();

  return (
    <Section
      id='create-user'
      className={CreateBlogStyles.CreateBlog}
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
          type='text'
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
          placeholder='0'
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
          placeholder='male/female'
          id='sex'
          label='Sex'
          value={formData.sex}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='text'
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
          value={formData.disabled}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='text'
          placeholder='true/false'
          id='verified'
          label='Verified'
          value={formData.verified}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='text'
          placeholder='2026-02-08T10:51:12.126Z'
          id='created'
          label='Created'
          value={formData.created}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='text'
          placeholder='2026-02-08T10:51:12.126Z'
          id='updated'
          label='Updated'
          value={formData.updated}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='submit'
          value='Create'
        />
      </Form>
    </Section>
  );
}
