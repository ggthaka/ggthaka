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

export default function useEditBlog({
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
    // Handle boolean for published field if necessary, though typical input is string.
    // For specific checkboxes or radio, might need different handling.
    // Assuming simple text input for 'true'/'false' as per component for now,
    // or if the component sends a boolean, we need to handle type.
    // But HTML input value is string.

    // Quick fix for published boolean if it comes from a text input trying to emulate boolean
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
        '/api/private/authorization/root/data/system/blogs/edit/blog',
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
        setMessage('Blog updated successfully!');
      }
    } catch {
      setMessage('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return { formData, handleChange, handleSubmit, message, loading, fieldError };
}
