import { ThemeContext, ThemeContextProps } from '@library/contexts';
import { useContext } from 'react';

export default function useThemeContext(): ThemeContextProps {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('`useThemeContext` must be used within `Theme` provider.');
  }

  return context;
}
