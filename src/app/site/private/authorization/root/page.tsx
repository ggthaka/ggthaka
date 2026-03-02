import { Authorization, Panel } from '@components/page';
import { Dropdown, NavItem } from '@components/shared';

export default function User() {
  return (
    <Authorization role='root'>
      <Panel
        asideItems={
          <>
            <NavItem
              name='Root'
              href='/site/private/authorization/root'
              active
            />
            <Dropdown title='Create'>
              <NavItem
                name='User'
                href='/site/private/authorization/root/create/user'
              />
              <NavItem
                name='Session'
                href='/site/private/authorization/root/create/session'
              />
              <NavItem
                name='Blog'
                href='/site/private/authorization/root/create/blog'
              />
            </Dropdown>
            <Dropdown title='Tools'>
              <NavItem
                name='Markdown Editor'
                href='/site/private/authorization/root/tools/markdown_editor'
              />
              <NavItem
                name='Clipboard Manager'
                href='/site/private/authorization/root/tools/clipboard_manager'
              />
              <NavItem
                name='Task Manager'
                href='/site/private/authorization/root/tools/task_manager'
              />
              <NavItem
                name='File Manager'
                href='/site/private/authorization/root/tools/file_manager'
              />
              <NavItem
                name='Database Manager'
                href='/site/private/authorization/root/tools/database_manager'
              />
              <NavItem
                name='IDE'
                href='/site/private/authorization/root/tools/ide'
              />
              <NavItem
                name='Terminal'
                href='/site/private/authorization/root/tools/terminal'
              />
              <NavItem
                name='API Tester'
                href='/site/private/authorization/root/tools/api_tester'
              />
              <NavItem
                name='Mindmap Tool'
                href='/site/private/authorization/root/tools/mindmap'
              />
              <NavItem
                name='Whiteboard Tool'
                href='/site/private/authorization/root/tools/whiteboard'
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
      />
    </Authorization>
  );
}
