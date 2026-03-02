import { Section } from '@components/layout';
import { Authorization, Panel } from '@components/page';
import { FileManager } from '@components/section';
import { RootToolsAsideItems, Theme } from '@components/shared';

export default function FileManagerTool() {
  return (
    <Authorization role='root'>
      <Panel
        screenItems={
          <Section>
            <Theme />
          </Section>
        }
        asideItems={<RootToolsAsideItems activeTool='file_manager' />}
        mainItems={<FileManager />}
      />
    </Authorization>
  );
}
