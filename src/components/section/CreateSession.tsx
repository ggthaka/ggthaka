'use client';

import { Section } from '@components/layout';
import { Form, Input, Message } from '@components/shared';
import { useCreateSession } from '@library/hooks';
import { CreateBlogStyles } from '@styles/section';

export default function CreateSession() {
  const { formData, handleChange, handleSubmit, message, loading, fieldError } =
    useCreateSession();

  return (
    <Section
      id='create-session'
      className={CreateBlogStyles.CreateBlog}
    >
      <Form
        method={handleSubmit}
        loading={loading}
      >
        {message && <Message>{message}</Message>}
        <Input
          type='text'
          placeholder='session id'
          id='id'
          label='ID'
          value={formData.id}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='text'
          placeholder='user id'
          id='userId'
          label='User ID'
          value={formData.userId}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='text'
          placeholder='127.0.0.1'
          id='ip'
          label='IP'
          value={formData.ip}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='text'
          placeholder='Chrome'
          id='browser'
          label='Browser'
          value={formData.browser}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='text'
          placeholder='amd64'
          id='cpu'
          label='CPU'
          value={formData.cpu}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='text'
          placeholder='desktop'
          id='device'
          label='Device'
          value={formData.device}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='text'
          placeholder='Blink'
          id='engine'
          label='Engine'
          value={formData.engine}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='text'
          placeholder='Windows'
          id='os'
          label='OS'
          value={formData.os}
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
          type='text'
          placeholder='2026-02-08T10:51:12.126Z'
          id='expired'
          label='Expired'
          value={formData.expired}
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
