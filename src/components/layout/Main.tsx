import { Container, Footer } from '@components/layout';
import { MainStyles } from '@styles/layout';
import { ReactNode } from 'react';

interface Props {
  type: 'page' | 'panel';
  children?: ReactNode;
}

export default function Main({ type, children }: Props) {
  return (
    <main
      className={[
        MainStyles.Main,
        type === 'page'
          ? MainStyles.Page
          : type === 'panel'
            ? MainStyles.Panel
            : '',
      ].join(' ')}
    >
      <Container className={MainStyles.Container}>{children}</Container>
      <Footer />
    </main>
  );
}
