'use client';

import { Brand, Icon } from '@components/shared';
import { useAsideContext } from '@library/hooks';
import { AsideStyles } from '@styles/layout';
import { ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

export default function Aside({ children }: Props) {
  const { pullTrigger } = useAsideContext();

  return (
    <aside className={AsideStyles.Aside}>
      <div className={AsideStyles.Content}>
        <div className={AsideStyles.Header}>
          <Brand />
          <div
            className={AsideStyles.Trigger}
            onClick={pullTrigger}
          >
            <Icon
              name='aside'
              size={16}
              alt='Aside Icon'
            />
          </div>
        </div>
        <div className={AsideStyles.Main}>{children}</div>
      </div>
      <div
        className={AsideStyles.Cover}
        onClick={pullTrigger}
      ></div>
    </aside>
  );
}
