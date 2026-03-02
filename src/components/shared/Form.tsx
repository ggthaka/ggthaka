import { Icon, Loading } from '@components/shared';
import { FormStyles } from '@styles/shared';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  method?: (e: React.FormEvent<HTMLFormElement>) => void;
  loading?: boolean;
  brand?: boolean;
}

export default function Form({
  children,
  className,
  method,
  loading,
  brand = true,
}: Props) {
  return (
    <form
      className={[FormStyles.Form, className].join(' ')}
      onSubmit={method}
    >
      {loading && (
        <div className={FormStyles.Loading}>
          <Loading />
        </div>
      )}
      {brand && (
        <Icon
          name='logo'
          size={28}
          alt='Logo Icon'
          className={FormStyles.LogoIcon}
        />
      )}
      {children}
    </form>
  );
}
