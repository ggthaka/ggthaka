import { Page } from '@components/page';
import { Reset as ResetSection } from '@components/section';
import { NavItem } from '@components/shared';

export default function Reset() {
  return (
    <Page
      navItems={
        <>
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
            active
          />
          <NavItem
            name='Landing'
            href='/'
            button
          />
        </>
      }
      mainItems={<ResetSection />}
    />
  );
}
