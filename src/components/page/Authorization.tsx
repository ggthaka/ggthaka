'use client';

import { Panel } from '@components/page';
import { Loading, Message, NavGroup, NavItem } from '@components/shared';
import { useAuthorization } from '@library/hooks';
import { AuthorizationStyles } from '@styles/page';
import { ReactNode } from 'react';

interface Props {
  role: 'root' | 'user';
  children: ReactNode;
}

export default function Authorization({ role, children }: Props) {
  const { message, loading } = useAuthorization({ role: role });
  if (loading)
    return (
      <div className={AuthorizationStyles.Authorization}>
        <Loading />
      </div>
    );
  return message ? (
    <Panel
      asideItems={
        <>
          <NavItem
            name='Authorization'
            href=''
            active
          />
          <NavItem
            name='Landing'
            href='/'
          />
          <NavGroup title='AUTHENTICATION'>
            <NavItem
              name='Login'
              href='/site/public/authentication/login'
            />
            <NavItem
              name='Register'
              href='/site/public/authentication/register'
            />
            <NavItem
              name='Reset'
              href='/site/public/authentication/reset'
            />
          </NavGroup>
        </>
      }
      mainItems={message && <Message>{message}</Message>}
      screenItems={null}
    />
  ) : (
    <>{children}</>
  );
}
