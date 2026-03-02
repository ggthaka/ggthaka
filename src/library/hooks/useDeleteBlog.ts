import { useState } from 'react';

type FormData = {
  id: string;
  userId: string;
  slug: string;
  title: string;
  imageUrl?: string | null;
  excerpt?: string;
  content?: string;
  created: string;
  updated: string;
  published: boolean;
  publishedAt?: string;
};

type FieldError = {
  field: keyof FormData | '';
  message: string;
};

export default function useDeleteBlog({
  id,
  userId,
  slug,
  title,
  imageUrl,
  excerpt,
  content,
  created,
  updated,
  published,
  publishedAt,
}: FormData) {
  const [formData, setFormData] = useState<FormData>({
    id,
    userId,
    slug,
    title,
    imageUrl,
    excerpt,
    content,
    created,
    updated,
    published,
    publishedAt,
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
    if (id === 'published') {
      setFormData((prev) => ({ ...prev, [id]: value === 'true' }));
    } else {
      setFormData((prev) => ({ ...prev, [id]: value }));
    }

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
        '/api/private/authorization/root/data/system/blogs/delete/blog',
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
        setMessage('Blog deleted successfully!');
      }
    } catch {
      setMessage('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return { formData, handleChange, handleSubmit, message, loading, fieldError };
}
