'use client';

import { Section } from '@components/layout';
import { Form, Input, Message } from '@components/shared';
import { useEditSession } from '@library/hooks';
import { EditSessionStyles } from '@styles/section';

interface Props {
  id: string;
  userId: string;
  ip: string;
  browser: string;
  cpu: string;
  device: string;
  engine: string;
  os: string;
  created: string;
  updated: string;
  expired: string;
}

export default function EditSession({
  id,
  ip,
  userId,
  browser,
  cpu,
  device,
  engine,
  os,
  created,
  updated,
  expired,
}: Props) {
  const { formData, handleChange, handleSubmit, message, loading, fieldError } =
    useEditSession({
      id,
      ip,
      userId,
      browser,
      cpu,
      device,
      engine,
      os,
      created,
      updated,
      expired,
    });

  return (
    <Section
      id='edit-session'
      className={EditSessionStyles.EditSession}
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
          placeholder='IP'
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
          textarea
          rows={3}
        />
        <Input
          type='text'
          placeholder='amd64'
          id='cpu'
          label='CPU'
          value={formData.cpu}
          method={handleChange}
          fieldError={fieldError}
          textarea
          rows={3}
        />
        <Input
          type='text'
          placeholder='desktop'
          id='device'
          label='Device'
          value={formData.device}
          method={handleChange}
          fieldError={fieldError}
          textarea
          rows={3}
        />
        <Input
          type='text'
          placeholder='Blink'
          id='engine'
          label='Engine'
          value={formData.engine}
          method={handleChange}
          fieldError={fieldError}
          textarea
          rows={3}
        />
        <Input
          type='text'
          placeholder='Windows'
          id='os'
          label='OS'
          value={formData.os}
          method={handleChange}
          fieldError={fieldError}
          textarea
          rows={3}
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
          value='Update'
        />
      </Form>
    </Section>
  );
}
