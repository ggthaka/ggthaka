'use client';

import { Aside, Container, Header, Main, Nav } from '@components/layout';
import { Screen } from '@components/page';
import { Icon } from '@components/shared';
import { useAsideContext } from '@library/hooks';
import { PanelStyles } from '@styles/page';
import { ReactNode } from 'react';

interface Props {
  navItems?: ReactNode;
  mainItems?: ReactNode;
  screenItems?: ReactNode;
  asideItems?: ReactNode;
}

export default function Panel({
  navItems,
  mainItems,
  screenItems,
  asideItems,
}: Props) {
  const { trigger, pullTrigger } = useAsideContext();

  return (
    <div className={PanelStyles.Panel}>
      {trigger && <Aside>{asideItems}</Aside>}
      <Container>
        <Header type={trigger ? 'panel' : 'page'}>
          {!trigger && (
            <div
              className={PanelStyles.Trigger}
              onClick={pullTrigger}
            >
              <Icon
                name='aside'
                size={16}
                alt='Aside Icon'
              />
            </div>
          )}
          <Nav>{navItems}</Nav>
          <Screen>{screenItems}</Screen>
        </Header>
        <Main type={trigger ? 'panel' : 'page'}>{mainItems}</Main>
      </Container>
    </div>
  );
}
