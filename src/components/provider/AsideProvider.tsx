'use client';

import { AsideContext } from '@library/contexts';
import { useTrigger } from '@library/hooks';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export default function AsideProvider({ children }: Props) {
  const { trigger, pullTrigger } = useTrigger();

  return (
    <AsideContext.Provider value={{ trigger, pullTrigger }}>
      {children}
    </AsideContext.Provider>
  );
}
