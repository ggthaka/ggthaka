import { Section } from '@components/layout';
import { Authorization, Panel } from '@components/page';
import { CreateSession } from '@components/section';
import { Dropdown, NavItem, Theme } from '@components/shared';

export default function Session() {
  return (
    <Authorization role='root'>
      <Panel
        screenItems={
          <Section>
            <Theme />
          </Section>
        }
        asideItems={
          <>
            <NavItem
              name='Root'
              href='/site/private/authorization/root'
            />
            <Dropdown
              title='Create'
              active
            >
              <NavItem
                name='User'
                href='/site/private/authorization/root/create/user'
              />
              <NavItem
                name='Session'
                href='/site/private/authorization/root/create/session'
                active
              />
              <NavItem
                name='Blog'
                href='/site/private/authorization/root/create/blog'
              />
            </Dropdown>
            <Dropdown title='Analytics'>
              <Dropdown title='System'>
                <NavItem
                  name='Users'
                  href=''
                />
                <NavItem
                  name='Sessions'
                  href=''
                />
              </Dropdown>
              <Dropdown title='Usage'>
                <NavItem
                  name='API'
                  href=''
                />
                <NavItem
                  name='Site'
                  href=''
                />
              </Dropdown>
            </Dropdown>
            <Dropdown title='Data'>
              <Dropdown title='System'>
                <NavItem
                  name='Users'
                  href='/site/private/authorization/root/data/system/users'
                />
                <NavItem
                  name='Sessions'
                  href='/site/private/authorization/root/data/system/sessions'
                />
                <NavItem
                  name='Blogs'
                  href='/site/private/authorization/root/data/system/blogs'
                />
              </Dropdown>
              <Dropdown title='Usage'>
                <NavItem
                  name='API'
                  href=''
                />
                <NavItem
                  name='Site'
                  href=''
                />
              </Dropdown>
            </Dropdown>
          </>
        }
        mainItems={
          <>
            <CreateSession />
          </>
        }
      />
    </Authorization>
  );
}
