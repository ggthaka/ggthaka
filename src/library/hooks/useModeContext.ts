import { ModeContext, ModeContextProps } from '@library/contexts';
import { useContext } from 'react';

export default function useModeContext(): ModeContextProps {
  const context = useContext(ModeContext);

  if (!context) {
    throw new Error('`useModeContext` must be used within `Mode` provider.');
  }

  return context;
}
