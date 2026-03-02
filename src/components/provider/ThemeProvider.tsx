'use client';

import { Loading } from '@components/shared';
import { ThemeContext } from '@library/contexts';
import { useTheme } from '@library/hooks';
import { ThemeProviderStyles } from '@styles/provider';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export default function ThemeProvider({ children }: Props) {
  const { theme, triggerTheme } = useTheme();

  if (!theme) {
    return (
      <div className={ThemeProviderStyles.ThemeProvider}>
        <Loading />
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, triggerTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
