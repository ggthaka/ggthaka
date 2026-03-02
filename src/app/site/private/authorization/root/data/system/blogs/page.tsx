import { Section } from '@components/layout';
import { Authorization, Panel } from '@components/page';
import { Blogs as BlogsSection } from '@components/section';
import { Dropdown, NavItem, Theme } from '@components/shared';

export default function Blogs() {
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
            <Dropdown
              title='Data'
              active
            >
              <Dropdown
                title='System'
                active
              >
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
                  active
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
            <BlogsSection />
          </>
        }
      />
    </Authorization>
  );
}
