'use client';

import { Loading } from '@components/shared';
import { ModeContext } from '@library/contexts';
import { useMode } from '@library/hooks';
import { ModeProviderStyles } from '@styles/provider';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export default function ModeProvider({ children }: Props) {
  const { mode, setMode } = useMode();

  if (!mode) {
    return (
      <div className={ModeProviderStyles.ModeProvider}>
        <Loading />
      </div>
    );
  }

  return (
    <ModeContext.Provider value={{ mode, setMode }}>
      {children}
    </ModeContext.Provider>
  );
}
