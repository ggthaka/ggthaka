import { SectionStyles } from '@styles/layout';
import { ReactNode } from 'react';

interface Props {
  id?: string;
  className?: string;
  children: ReactNode;
}

export default function Section({ id, className, children }: Props) {
  return (
    <section
      id={id}
      className={[SectionStyles.Section, className].join(' ')}
    >
      {children}
    </section>
  );
}
