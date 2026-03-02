import { Section } from '@components/layout';
import { Authorization, Panel } from '@components/page';
import { IDE } from '@components/section';
import { RootToolsAsideItems, Theme } from '@components/shared';

export default function IDETool() {
  return (
    <Authorization role='root'>
      <Panel
        screenItems={
          <Section>
            <Theme />
          </Section>
        }
        asideItems={<RootToolsAsideItems activeTool='ide' />}
        mainItems={<IDE />}
      />
    </Authorization>
  );
}