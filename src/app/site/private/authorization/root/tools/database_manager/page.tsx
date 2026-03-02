import { Section } from '@components/layout';
import { Authorization, Panel } from '@components/page';
import { DatabaseManager } from '@components/section';
import { RootToolsAsideItems, Theme } from '@components/shared';

export default function DatabaseManagerTool() {
  return (
    <Authorization role='root'>
      <Panel
        screenItems={
          <Section>
            <Theme />
          </Section>
        }
        asideItems={<RootToolsAsideItems activeTool='database_manager' />}
        mainItems={<DatabaseManager />}
      />
    </Authorization>
  );
}