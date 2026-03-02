import { Page } from '@components/page';
import { Login as LoginSection } from '@components/section';
import { NavItem } from '@components/shared';

export default function Login() {
  return (
    <Page
      navItems={
        <>
          <NavItem
            name='Login'
            href='/site/public/authentication/login'
            active
          />
          <NavItem
            name='Register'
            href='/site/public/authentication/register'
          />
          <NavItem
            name='Reset'
            href='/site/public/authentication/reset'
          />
          <NavItem
            name='Landing'
            href='/'
            button
          />
        </>
      }
      mainItems={<LoginSection />}
    />
  );
}
