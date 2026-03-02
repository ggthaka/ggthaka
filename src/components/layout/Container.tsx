'use client';

import { ContainerStyles } from '@styles/layout';
import { ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  className?: ReactNode;
}

export default function Container({ children, className }: Props) {
  return (
    <div className={[ContainerStyles.Container, className].join(' ')}>
      {children}
    </div>
  );
}
