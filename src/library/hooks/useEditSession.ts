import { useState } from 'react';

type FormData = {
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
};

type FieldError = {
  field: keyof FormData | '';
  message: string;
};

export default function useEditSession({
  id,
  userId,
  ip,
  browser,
  cpu,
  device,
  engine,
  os,
  created,
  updated,
  expired,
}: FormData) {
  const [formData, setFormData] = useState<FormData>({
    id: id,
    userId: userId,
    ip: ip,
    browser: browser,
    cpu: cpu,
    device: device,
    engine: engine,
    os: os,
    created: created,
    updated: updated,
    expired: expired,
  });

  const [message, setMessage] = useState('');
  const [fieldError, setFieldError] = useState<FieldError>({
    field: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));

    if (fieldError.field === id) {
      setFieldError({ field: '', message: '' });
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setFieldError({ field: '', message: '' });

    try {
      const response = await fetch(
        '/api/private/authorization/root/data/system/sessions/edit/session',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        },
      );

      const data = await response.json();

      if (!data.ok) {
        if (data.error?.field) {
          setFieldError({
            field: data.error.field,
            message: data.error.message,
          });
        } else {
          setMessage(data.error?.message || 'An unknown error occurred.');
        }
      } else {
        setMessage('Session updated successfully!');
      }
    } catch {
      setMessage('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return { formData, handleChange, handleSubmit, message, loading, fieldError };
}
