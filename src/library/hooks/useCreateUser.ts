import { useState } from 'react';

type FormData = {
  id: string;
  email: string;
  hash: string;
  role: string;
  passwordResetOtp: string;
  passwordResetExpiry: string;
  passwordResetAttempts: number;
  firstName: string;
  lastName: string;
  yearOfBirth: string;
  sex: string;
  country: string;
  disabled: string;
  verified: string;
  created: string;
  updated: string;
};

type FieldError = {
  field: keyof FormData | '';
  message: string;
};

export default function useCreateUser() {
  const [formData, setFormData] = useState<FormData>({
    id: '',
    email: '',
    hash: '',
    role: '',
    passwordResetOtp: '',
    passwordResetExpiry: '',
    passwordResetAttempts: 0,
    firstName: '',
    lastName: '',
    yearOfBirth: '',
    sex: '',
    country: '',
    disabled: 'false',
    verified: 'false',
    created: '',
    updated: '',
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
    setFormData((prev) => ({
      ...prev,
      [id]: id === 'passwordResetAttempts' ? Number(value) : value,
    }));

    if (fieldError.field === id) {
      setFieldError({
        field: '',
        message: '',
      });
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setFieldError({ field: '', message: '' });

    try {
      const response = await fetch(
        '/api/private/authorization/root/data/system/users/add/user',
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
        setMessage('User created successfully!');
        setFormData({
          id: '',
          email: '',
          hash: '',
          role: '',
          passwordResetOtp: '',
          passwordResetExpiry: '',
          passwordResetAttempts: 0,
          firstName: '',
          lastName: '',
          yearOfBirth: '',
          sex: '',
          country: '',
          disabled: 'false',
          verified: 'false',
          created: '',
          updated: '',
        });
      }
    } catch {
      setMessage('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return { formData, handleChange, handleSubmit, message, loading, fieldError };
}
