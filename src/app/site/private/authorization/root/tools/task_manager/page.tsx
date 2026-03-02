import { Section } from '@components/layout';
import { Authorization, Panel } from '@components/page';
import { TaskManager } from '@components/section';
import { RootToolsAsideItems, Theme } from '@components/shared';

export default function TaskManagerTool() {
  return (
    <Authorization role='root'>
      <Panel
        screenItems={
          <Section>
            <Theme />
          </Section>
        }
        asideItems={<RootToolsAsideItems activeTool='task_manager' />}
        mainItems={<TaskManager />}
      />
    </Authorization>
  );
}
