import { useEffect, useState } from 'react';

type Mode = 'light' | 'dark' | undefined;

export default function useMode() {
  const [mode, setMode] = useState<Mode>(undefined);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const matchMedia = window.matchMedia('(prefers-color-scheme: dark)');

    const updateMode = () => {
      setMode(matchMedia.matches ? 'dark' : 'light');
    };

    updateMode();

    matchMedia.addEventListener('change', updateMode);

    return () => {
      matchMedia.removeEventListener('change', updateMode);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (mode !== undefined) {
      localStorage.setItem('mode', mode);
    }
  }, [mode]);

  return { mode, setMode };
}
