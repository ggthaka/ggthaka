import { Page } from '@components/page';
import { Register as RegisterSection } from '@components/section';
import { NavItem } from '@components/shared';

export default function Register() {
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
            active
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
      mainItems={<RegisterSection />}
    />
  );
}
