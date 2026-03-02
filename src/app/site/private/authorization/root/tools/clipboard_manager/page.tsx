import { Section } from '@components/layout';
import { Authorization, Panel } from '@components/page';
import { ClipboardManager } from '@components/section';
import { RootToolsAsideItems, Theme } from '@components/shared';

export default function ClipboardManagerTool() {
  return (
    <Authorization role='root'>
      <Panel
        screenItems={
          <Section>
            <Theme />
          </Section>
        }
        asideItems={<RootToolsAsideItems activeTool='clipboard_manager' />}
        mainItems={<ClipboardManager />}
      />
    </Authorization>
  );
}
