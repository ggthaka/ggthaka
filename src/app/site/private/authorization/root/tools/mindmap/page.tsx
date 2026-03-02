import { Section } from '@components/layout';
import { Authorization, Panel } from '@components/page';
import { MindmapTool } from '@components/section';
import { RootToolsAsideItems, Theme } from '@components/shared';

export default function MindmapToolPage() {
  return (
    <Authorization role='root'>
      <Panel
        screenItems={
          <Section>
            <Theme />
          </Section>
        }
        asideItems={<RootToolsAsideItems activeTool='mindmap' />}
        mainItems={<MindmapTool />}
      />
    </Authorization>
  );
}
