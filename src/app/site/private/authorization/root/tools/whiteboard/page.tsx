import { Section } from '@components/layout';
import { Authorization, Panel } from '@components/page';
import { WhiteboardTool } from '@components/section';
import { RootToolsAsideItems, Theme } from '@components/shared';

export default function WhiteboardToolPage() {
  return (
    <Authorization role='root'>
      <Panel
        screenItems={
          <Section>
            <Theme />
          </Section>
        }
        asideItems={<RootToolsAsideItems activeTool='whiteboard' />}
        mainItems={<WhiteboardTool />}
      />
    </Authorization>
  );
}
