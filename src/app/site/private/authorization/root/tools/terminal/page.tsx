import { Section } from '@components/layout';
import { Authorization, Panel } from '@components/page';
import { TerminalTool } from '@components/section';
import { RootToolsAsideItems, Theme } from '@components/shared';

export default function TerminalPageTool() {
  return (
    <Authorization role='root'>
      <Panel
        screenItems={
          <Section>
            <Theme />
          </Section>
        }
        asideItems={<RootToolsAsideItems activeTool='terminal' />}
        mainItems={<TerminalTool />}
      />
    </Authorization>
  );
}
