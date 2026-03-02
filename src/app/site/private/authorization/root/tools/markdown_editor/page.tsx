import { Section } from '@components/layout';
import { Authorization, Panel } from '@components/page';
import { MarkdownEditor } from '@components/section';
import { RootToolsAsideItems, Theme } from '@components/shared';

export default function MarkdownEditorTool() {
  return (
    <Authorization role='root'>
      <Panel
        screenItems={
          <Section>
            <Theme />
          </Section>
        }
        asideItems={<RootToolsAsideItems activeTool='markdown_editor' />}
        mainItems={
          <>
            <MarkdownEditor />
          </>
        }
      />
    </Authorization>
  );
}
