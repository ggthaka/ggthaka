import { MessageStyles } from '@styles/shared';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export default function Message({ children }: Props) {
  return <div className={MessageStyles.Message}>{children}</div>;
}
