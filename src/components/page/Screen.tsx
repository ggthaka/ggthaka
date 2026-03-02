'use client';

import { Header, Main, Nav } from '@components/layout';
import { Icon } from '@components/shared';
import { useScreen } from '@library/hooks';
import { ScreenStyles } from '@styles/page';
import { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  children?: ReactNode;
  icon?: string;
}

export default function Screen({ children, icon = 'screen' }: Props) {
  const { trigger, pullTrigger, portalRoot } = useScreen();

  const overlay = trigger ? (
    <div className={ScreenStyles.Overlay}>
      <Header type='page'>
        <Nav>{null}</Nav>
        <div
          className={ScreenStyles.Trigger}
          onClick={pullTrigger}
        >
          <Icon
            name={icon}
            alt='Screen Icon'
            size={16}
            inverted
          />
        </div>
      </Header>
      <Main type='page'>{children}</Main>
    </div>
  ) : null;

  return (
    <div className={ScreenStyles.Screen}>
      <div
        className={ScreenStyles.Trigger}
        onClick={pullTrigger}
      >
        <Icon
          name={icon}
          alt='Screen Icon'
          size={16}
          inverted
        />
      </div>
      {portalRoot && overlay ? createPortal(overlay, portalRoot) : null}
    </div>
  );
}
