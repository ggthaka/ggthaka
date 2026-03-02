import { Section } from '@components/layout';
import { Authorization, Panel } from '@components/page';
import { ApiTester } from '@components/section';
import { RootToolsAsideItems, Theme } from '@components/shared';

export default function ApiTesterPageTool() {
  return (
    <Authorization role='root'>
      <Panel
        screenItems={
          <Section>
            <Theme />
          </Section>
        }
        asideItems={<RootToolsAsideItems activeTool='api_tester' />}
        mainItems={<ApiTester />}
      />
    </Authorization>
  );
}
