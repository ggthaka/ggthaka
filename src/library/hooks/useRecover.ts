import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type FormData = {
  password: string;
  confirmPassword: string;
};

type FieldError = {
  field: keyof FormData | '';
  message: string;
};

export default function useRecover() {
  const [formData, setFormData] = useState<FormData>({
    password: '',
    confirmPassword: '',
  });

  const [message, setMessage] = useState('');
  const [fieldError, setFieldError] = useState<FieldError>({
    field: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const searchParams = useSearchParams();

  useEffect(() => {
    const recovered = searchParams.get('recovered');
    if (recovered === 'true') {
      setMessage(
        'OTP confirmed successfully! You can now recover your password.',
      );
      const timer = setTimeout(() => {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [searchParams]);

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
      const response = await fetch('/api/private/authentication/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

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
        router.push('/site/public/authentication/login?recover=true');
      }
    } catch {
      setMessage('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return { formData, handleChange, handleSubmit, message, loading, fieldError };
}
