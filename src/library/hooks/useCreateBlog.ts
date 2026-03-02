import { useEffect, useState } from 'react';

type FormData = {
  slug: string;
  imageUrl: string;
  title: string;
  excerpt: string;
  content: string;
  published: string;
};

type FieldError = {
  field: keyof FormData | '';
  message: string;
};

export default function useCreateBlog() {
  const [formData, setFormData] = useState<FormData>({
    slug: '',
    imageUrl: '',
    title: '',
    excerpt: '',
    content: '',
    published: 'false',
  });

  const [message, setMessage] = useState('');
  const [fieldError, setFieldError] = useState<FieldError>({
    field: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('create-blog-draft');
      if (!raw) return;

      const draft = JSON.parse(raw) as Partial<FormData>;

      setFormData((prev) => ({
        ...prev,
        slug: typeof draft.slug === 'string' ? draft.slug : prev.slug,
        imageUrl:
          typeof draft.imageUrl === 'string' ? draft.imageUrl : prev.imageUrl,
        title: typeof draft.title === 'string' ? draft.title : prev.title,
        excerpt:
          typeof draft.excerpt === 'string' ? draft.excerpt : prev.excerpt,
        content:
          typeof draft.content === 'string' ? draft.content : prev.content,
        published:
          typeof draft.published === 'string'
            ? draft.published
            : prev.published,
      }));

      localStorage.removeItem('create-blog-draft');
      setMessage('Draft imported from Markdown Editor.');
    } catch {
      localStorage.removeItem('create-blog-draft');
    }
  }, []);

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
        '/api/private/authorization/root/data/system/blogs/add/blog',
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
        setMessage('Blog created successfully!');
        setFormData({
          slug: '',
          imageUrl: '',
          title: '',
          excerpt: '',
          content: '',
          published: 'false',
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
