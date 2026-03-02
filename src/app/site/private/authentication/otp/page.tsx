import { Page } from '@components/page';
import { Otp as OtpSection } from '@components/section';
import { NavItem } from '@components/shared';

export default function Otp() {
  return (
    <Page
      navItems={
        <>
          <NavItem
            name='OTP'
            href='/site/private/authentication/otp'
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
      mainItems={<OtpSection />}
    />
  );
}
