import { useEffect, useState } from 'react';

interface Props {
  role: 'root' | 'user';
}

export default function useAuthorization({ role }: Props) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuthorization = async () => {
      try {
        const response = await fetch('/api/private/authorization', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: role }),
        });
        const data = await response.json();

        if (!data.ok) {
          setMessage(data.error.message);
        } else {
          setLoading(false);
        }
      } catch {
        setMessage('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchAuthorization();
  }, [role]);

  return { message, loading };
}
