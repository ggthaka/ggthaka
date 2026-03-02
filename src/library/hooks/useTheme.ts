import { useMode } from '@library/hooks';
import { useEffect, useState } from 'react';

type Theme = 'system' | 'light' | 'dark' | undefined;

export default function useTheme() {
  const [theme, setTheme] = useState<Theme>();
  const { mode } = useMode();

  const triggerTheme = () => {
    switch (theme) {
      case 'system':
        setTheme('light');
        localStorage.setItem('theme', 'light');
        document.querySelector('html')?.setAttribute('data-theme', 'light');
        break;
      case 'light':
        setTheme('dark');
        localStorage.setItem('theme', 'dark');
        document.querySelector('html')?.setAttribute('data-theme', 'dark');
        break;
      case 'dark':
        setTheme('system');
        localStorage.setItem('theme', 'system');
        document.querySelector('html')?.setAttribute('data-theme', 'system');
        break;
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentTheme = localStorage.getItem('theme');

    if (!currentTheme) {
      queueMicrotask(() => {
        setTheme(mode);
        localStorage.setItem('theme', mode || 'system');
        document
          .querySelector('html')
          ?.setAttribute('data-theme', mode || 'system');
      });
    } else {
      queueMicrotask(() => {
        setTheme(currentTheme as Theme);
        document
          .querySelector('html')
          ?.setAttribute('data-theme', currentTheme);
      });
    }
  }, [mode]);

  return { theme, triggerTheme };
}
