import { createContext } from 'react';

export interface Props {
  mode: 'light' | 'dark';
  setMode: (mode: 'light' | 'dark') => void;
}

export const ModeContext = createContext<Props | null>(null);
