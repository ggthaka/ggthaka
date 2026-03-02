import { NavGroupStyles } from '@styles/shared';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  title: string;
}

export default function NavGroup({ children, title }: Props) {
  return (
    <div className={NavGroupStyles.NavGroup}>
      <span>{title}</span>
      <div className={NavGroupStyles.Group}>{children}</div>
    </div>
  );
}
