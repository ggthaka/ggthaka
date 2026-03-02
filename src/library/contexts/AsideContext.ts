import { createContext } from 'react';

export interface Props {
  trigger: boolean;
  pullTrigger: () => void;
}

export const AsideContext = createContext<Props | null>(null);
