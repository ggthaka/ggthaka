'use client';

import { Icon } from '@components/shared';
import { useTrigger } from '@library/hooks';
import { NavStyles } from '@styles/layout';
import { ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

export default function Nav({ children }: Props) {
  const { trigger, pullTrigger } = useTrigger();

  if (!children) return <nav className={NavStyles.Nav} />;

  return (
    <nav className={NavStyles.Nav}>
      <div className={NavStyles.Large}>{children}</div>
      <div className={NavStyles.Small}>
        <div
          className={NavStyles.Head}
          onClick={pullTrigger}
        >
          <Icon
            className={trigger ? NavStyles.Before : NavStyles.After}
            name='chevron'
            alt='Chevron Icon'
            size={16}
          />
        </div>
        {trigger && <div className={NavStyles.Body}>{children}</div>}
      </div>
    </nav>
  );
}
