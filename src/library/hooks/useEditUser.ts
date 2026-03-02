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
  yearOfBirth: number;
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

export default function useEditUser({
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
}: FormData) {
  const [formData, setFormData] = useState<FormData>({
    id: id,
    email: email,
    hash: hash,
    role: role,
    passwordResetOtp: passwordResetOtp,
    passwordResetExpiry: passwordResetExpiry,
    passwordResetAttempts: passwordResetAttempts,
    firstName: firstName,
    lastName: lastName,
    yearOfBirth: yearOfBirth,
    sex: sex,
    country: country,
    disabled: disabled,
    verified: verified,
    created: created,
    updated: updated,
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
        '/api/private/authorization/root/data/system/users/edit/user',
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
        setMessage('User updated successfully!');
      }
    } catch {
      setMessage('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return { formData, handleChange, handleSubmit, message, loading, fieldError };
}
