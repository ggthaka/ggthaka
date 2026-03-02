import { Page } from '@components/page';
import { NavItem } from '@components/shared';

export default function Landing() {
  return (
    <Page
      navItems={
        <>
          <NavItem
            name='Landing'
            href='/'
            active
          />
          <NavItem
            name='Works'
            href='/'
          />
          <NavItem
            name='Blogs'
            href='/'
          />
          <NavItem
            name='Courses'
            href='/'
          />
          <NavItem
            name='Account'
            href='/site/public/authentication/login'
            button
          />
        </>
      }
    />
  );
}
