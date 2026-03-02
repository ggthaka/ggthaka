import { createContext } from 'react';

export type Theme = 'system' | 'light' | 'dark';

export interface Props {
  theme: Theme | undefined;
  triggerTheme: () => void;
}

export const ThemeContext = createContext<Props | undefined>(undefined);
