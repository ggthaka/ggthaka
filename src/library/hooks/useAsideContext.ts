import { AsideContext, AsideContextProps } from '@library/contexts';
import { useContext } from 'react';

export default function useAsideContext(): AsideContextProps {
  const context = useContext(AsideContext);

  if (!context) {
    throw new Error(
      'The `useAsideContext` hook must be used within the `AsideProvider` component.',
    );
  }

  return context;
}
