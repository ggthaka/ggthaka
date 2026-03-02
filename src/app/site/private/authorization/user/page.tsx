import { Authorization, Panel } from '@components/page';
import { NavItem } from '@components/shared';

export default function User() {
  return (
    <Authorization role='user'>
      <Panel
        asideItems={
          <>
            <NavItem
              name='User'
              href='/site/private/authorization/user'
              active
            />
          </>
        }
      />
    </Authorization>
  );
}
