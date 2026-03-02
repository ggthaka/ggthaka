import { useTrigger } from '@library/hooks';
import { useMemo } from 'react';

type Options = {
  portalId?: string;
};

type ScreenPortal = HTMLElement | null;

export default function useScreen(options?: Options) {
  const { trigger, pullTrigger } = useTrigger();
  const portalId = options?.portalId ?? 'screen-portal';
  const portalRoot: ScreenPortal = useMemo(() => {
    if (typeof document === 'undefined') return null;
    return document.getElementById(portalId);
  }, [portalId]);

  return { trigger, pullTrigger, portalRoot };
}
