import { HeaderStyles } from '@styles/layout';
import { ReactNode } from 'react';

interface Props {
  type: 'page' | 'panel';
  children?: ReactNode;
}

export default function Header({ type, children }: Props) {
  return (
    <header
      className={[
        HeaderStyles.Header,
        type === 'page'
          ? HeaderStyles.Page
          : type === 'panel'
            ? HeaderStyles.Panel
            : '',
      ].join(' ')}
    >
      {children}
    </header>
  );
}
