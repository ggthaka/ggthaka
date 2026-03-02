import { Page } from '@components/page';
import { Recover as RecoverSection } from '@components/section';
import { NavItem } from '@components/shared';

export default function Recover() {
  return (
    <Page
      navItems={
        <>
          <NavItem
            name='Recover'
            href='/site/private/authentication/recover'
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
      mainItems={<RecoverSection />}
    />
  );
}
