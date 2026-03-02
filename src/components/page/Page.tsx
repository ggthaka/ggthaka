import { Header, Main, Nav } from '@components/layout';
import { Screen } from '@components/page';
import { Brand } from '@components/shared';
import { PageStyles } from '@styles/page';
import { ReactNode } from 'react';

interface Props {
  navItems?: ReactNode;
  mainItems?: ReactNode;
  screenItems?: ReactNode;
}

export default function Page({ navItems, mainItems, screenItems }: Props) {
  return (
    <div className={PageStyles.Page}>
      <Header type='page'>
        <Brand />
        <Nav>{navItems}</Nav>
        <Screen>{screenItems}</Screen>
      </Header>
      <Main type='page'>{mainItems}</Main>
    </div>
  );
}
