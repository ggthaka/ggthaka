'use client';

import { Section } from '@components/layout';
import { MarkdownPreview } from '@components/shared';
import { MarkdownEditorStyles } from '@styles/section';
import { useRouter } from 'next/navigation';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MutableRefObject,
  type UIEvent,
} from 'react';

const INITIAL_MARKDOWN = `# Markdown Editor

Write your content here and preview it live.

## Quick example

- **Bold text**
- _Italic text_
- ~~Strikethrough~~

\`\`\`ts
const hello = 'world';
console.log(hello);
\`\`\`
`;

const EDITOR_DRAFT_KEY = 'markdown-editor-draft';
const CREATE_BLOG_DRAFT_KEY = 'create-blog-draft';

type ViewMode = 'edit' | 'split' | 'preview';

type TextTransform = (
  value: string,
  start: number,
  end: number,
) => {
  next: string;
  selectionStart: number;
  selectionEnd: number;
};

interface Heading {
  id: string;
  level: number;
  text: string;
  lineStart: number;
  charStart: number;
}

type SlashAction =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'quote'
  | 'ul'
  | 'ol'
  | 'code'
  | 'table'
  | 'hr'
  | 'math'
  | 'footnote'
  | 'link'
  | 'image';

interface SlashCommand {
  key: string;
  label: string;
  action: SlashAction;
}

interface StoredDraft {
  markdown: string;
  saveLabel: string;
  restored: boolean;
}

const SLASH_COMMANDS: SlashCommand[] = [
  { key: 'h1', label: 'Heading 1', action: 'h1' },
  { key: 'h2', label: 'Heading 2', action: 'h2' },
  { key: 'h3', label: 'Heading 3', action: 'h3' },
  { key: 'quote', label: 'Blockquote', action: 'quote' },
  { key: 'ul', label: 'Unordered List', action: 'ul' },
  { key: 'ol', label: 'Ordered List', action: 'ol' },
  { key: 'code', label: 'Code Block', action: 'code' },
  { key: 'table', label: 'Table', action: 'table' },
  { key: 'hr', label: 'Horizontal Rule', action: 'hr' },
  { key: 'math', label: 'Math Block', action: 'math' },
  { key: 'footnote', label: 'Footnote', action: 'footnote' },
  { key: 'link', label: 'Link', action: 'link' },
  { key: 'image', label: 'Image', action: 'image' },
];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const parseHeadings = (markdown: string): Heading[] => {
  const seen = new Map<string, number>();
  const lines = markdown.split('\n');
  const headings: Heading[] = [];
  let charOffset = 0;

  lines.forEach((line, lineIndex) => {
    const match = /^(#{1,6})\s+(.+)$/.exec(line.trim());

    if (match) {
      const text = match[2].trim();
      const baseId = slugify(text);
      const count = seen.get(baseId) ?? 0;
      seen.set(baseId, count + 1);

      headings.push({
        id: count === 0 ? baseId : `${baseId}-${count}`,
        level: match[1].length,
        text,
        lineStart: lineIndex,
        charStart: charOffset,
      });
    }

    charOffset += line.length + 1;
  });

  return headings;
};

const readStoredDraft = (): StoredDraft => {
  if (typeof window === 'undefined') {
    return {
      markdown: INITIAL_MARKDOWN,
      saveLabel: 'Not saved',
      restored: false,
    };
  }

  try {
    const saved = localStorage.getItem(EDITOR_DRAFT_KEY);
    if (!saved) {
      return {
        markdown: INITIAL_MARKDOWN,
        saveLabel: 'No draft',
        restored: false,
      };
    }

    const parsed = JSON.parse(saved) as {
      markdown?: string;
      savedAt?: number;
    };

    const saveLabel =
      typeof parsed.savedAt === 'number'
        ? `Saved ${new Date(parsed.savedAt).toLocaleTimeString()}`
        : 'Saved draft';

    return {
      markdown:
        typeof parsed.markdown === 'string' && parsed.markdown.length > 0
          ? parsed.markdown
          : INITIAL_MARKDOWN,
      saveLabel,
      restored:
        typeof parsed.markdown === 'string' && parsed.markdown.length > 0,
    };
  } catch {
    return {
      markdown: INITIAL_MARKDOWN,
      saveLabel: 'Save unavailable',
      restored: false,
    };
  }
};

export default function MarkdownEditor() {
  const router = useRouter();
  const [initialDraft] = useState<StoredDraft>(() => readStoredDraft());
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const editorPaneRef = useRef<HTMLDivElement | null>(null);
  const syncingFromInputRef = useRef(false);
  const syncingFromPreviewRef = useRef(false);
  const undoStackRef = useRef<string[]>([]);
  const redoStackRef = useRef<string[]>([]);
  const saveTimerRef = useRef<number | null>(null);
  const previewTimerRef = useRef<number | null>(null);
  const [markdown, setMarkdown] = useState(initialDraft.markdown);
  const [previewMarkdown, setPreviewMarkdown] = useState(initialDraft.markdown);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [copyLabel, setCopyLabel] = useState('Copy');
  const [saveLabel, setSaveLabel] = useState(initialDraft.saveLabel);
  const [announce, setAnnounce] = useState(
    initialDraft.restored ? 'Draft restored' : '',
  );
  const [showHelp, setShowHelp] = useState(false);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashRange, setSlashRange] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const [slashIndex, setSlashIndex] = useState(0);

  useEffect(() => {
    if (previewTimerRef.current) window.clearTimeout(previewTimerRef.current);

    previewTimerRef.current = window.setTimeout(() => {
      setPreviewMarkdown(markdown);
    }, 120);

    return () => {
      if (previewTimerRef.current) window.clearTimeout(previewTimerRef.current);
    };
  }, [markdown]);

  useEffect(() => {
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);

    saveTimerRef.current = window.setTimeout(() => {
      try {
        const savedAt = Date.now();

        localStorage.setItem(
          EDITOR_DRAFT_KEY,
          JSON.stringify({
            markdown,
            savedAt,
          }),
        );

        setSaveLabel(`Saved ${new Date(savedAt).toLocaleTimeString()}`);
      } catch {
        setSaveLabel('Save unavailable');
      }
    }, 550);

    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [markdown]);

  const headings = useMemo<Heading[]>(
    () => parseHeadings(previewMarkdown),
    [previewMarkdown],
  );

  const applyMarkdown = (next: string) => {
    if (next === markdown) return;
    undoStackRef.current.push(markdown);
    if (undoStackRef.current.length > 250) undoStackRef.current.shift();
    redoStackRef.current = [];
    setMarkdown(next);
  };

  const applyTransform = (transform: TextTransform) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd, value } = textarea;
    const outcome = transform(value, selectionStart, selectionEnd);
    applyMarkdown(outcome.next);

    requestAnimationFrame(() => {
      const element = textareaRef.current;
      if (!element) return;
      element.focus();
      element.setSelectionRange(outcome.selectionStart, outcome.selectionEnd);
    });
  };

  const wrapSelection = (
    prefix: string,
    suffix = prefix,
    placeholder = 'text',
  ) => {
    applyTransform((value, start, end) => {
      const hasSelection = start !== end;
      const selected = hasSelection ? value.slice(start, end) : placeholder;
      const replacement = `${prefix}${selected}${suffix}`;

      return {
        next: value.slice(0, start) + replacement + value.slice(end),
        selectionStart: start + prefix.length,
        selectionEnd:
          start +
          prefix.length +
          (hasSelection ? selected.length : placeholder.length),
      };
    });
  };

  const prefixSelectedLines = (prefix: string) => {
    applyTransform((value, start, end) => {
      const lineStart = value.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
      const lineEndIndex = value.indexOf('\n', end);
      const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;
      const block = value.slice(lineStart, lineEnd);
      const updatedBlock = block
        .split('\n')
        .map((line) => `${prefix}${line}`)
        .join('\n');

      return {
        next: value.slice(0, lineStart) + updatedBlock + value.slice(lineEnd),
        selectionStart: lineStart,
        selectionEnd: lineStart + updatedBlock.length,
      };
    });
  };

  const indentSelectedLines = (indent: string, outdent = false) => {
    applyTransform((value, start, end) => {
      const lineStart = value.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
      const lineEndIndex = value.indexOf('\n', end);
      const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;
      const block = value.slice(lineStart, lineEnd);

      const lines = block.split('\n');
      const updatedLines = lines.map((line) => {
        if (!outdent) return `${indent}${line}`;

        if (line.startsWith(indent)) return line.slice(indent.length);
        if (line.startsWith('  ')) return line.slice(2);
        if (line.startsWith('\t')) return line.slice(1);
        return line;
      });

      const updatedBlock = updatedLines.join('\n');

      return {
        next: value.slice(0, lineStart) + updatedBlock + value.slice(lineEnd),
        selectionStart: lineStart,
        selectionEnd: lineStart + updatedBlock.length,
      };
    });
  };

  const setHeading = (level: number) => {
    const prefix = `${'#'.repeat(level)} `;

    applyTransform((value, start, end) => {
      const lineStart = value.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
      const lineEndIndex = value.indexOf('\n', end);
      const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;
      const block = value.slice(lineStart, lineEnd);
      const updatedBlock = block
        .split('\n')
        .map((line) => `${prefix}${line.replace(/^#{1,6}\s+/, '')}`)
        .join('\n');

      return {
        next: value.slice(0, lineStart) + updatedBlock + value.slice(lineEnd),
        selectionStart: lineStart,
        selectionEnd: lineStart + updatedBlock.length,
      };
    });
  };

  const insertText = (text: string) => {
    applyTransform((value, start, end) => ({
      next: value.slice(0, start) + text + value.slice(end),
      selectionStart: start + text.length,
      selectionEnd: start + text.length,
    }));
  };

  const replaceRange = (start: number, end: number, replacement: string) => {
    applyTransform((value, currentStart, currentEnd) => {
      const next = value.slice(0, start) + replacement + value.slice(end);
      const cursor = start + replacement.length;

      if (currentStart < start || currentEnd > end) {
        return {
          next,
          selectionStart: currentStart,
          selectionEnd: currentEnd,
        };
      }

      return {
        next,
        selectionStart: cursor,
        selectionEnd: cursor,
      };
    });
  };

  const undo = () => {
    const previous = undoStackRef.current.pop();
    if (!previous) return;
    redoStackRef.current.push(markdown);
    setMarkdown(previous);
    setAnnounce('Undo');
  };

  const redo = () => {
    const next = redoStackRef.current.pop();
    if (!next) return;
    undoStackRef.current.push(markdown);
    setMarkdown(next);
    setAnnounce('Redo');
  };

  const fallbackCopy = () => {
    const helper = document.createElement('textarea');
    helper.value = markdown;
    helper.style.position = 'fixed';
    helper.style.left = '-9999px';
    document.body.appendChild(helper);
    helper.focus();
    helper.select();

    const ok = document.execCommand('copy');
    document.body.removeChild(helper);
    return ok;
  };

  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopyLabel('Copied!');
      setAnnounce('Copied markdown to clipboard');
    } catch {
      const ok = fallbackCopy();
      setCopyLabel(ok ? 'Copied!' : 'Copy failed');
      setAnnounce(ok ? 'Copied markdown to clipboard' : 'Copy failed');
    }

    window.setTimeout(() => setCopyLabel('Copy'), 1200);
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        setAnnounce('Clipboard is empty');
        return;
      }
      insertText(text);
      setAnnounce('Pasted from clipboard');
    } catch {
      const manual = window.prompt('Clipboard access was blocked. Paste here:');
      if (manual) {
        insertText(manual);
        setAnnounce('Pasted text');
      }
    }
  };

  const restoreDraft = () => {
    try {
      const saved = localStorage.getItem(EDITOR_DRAFT_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as { markdown?: string };
      if (typeof parsed.markdown !== 'string') return;
      applyMarkdown(parsed.markdown);
      setAnnounce('Draft restored');
    } catch {
      setAnnounce('No draft to restore');
    }
  };

  const clearDraft = () => {
    localStorage.removeItem(EDITOR_DRAFT_KEY);
    setSaveLabel('Draft cleared');
    setAnnounce('Draft cleared');
  };

  const toCreateBlog = () => {
    const lines = markdown.split('\n').map((line) => line.trim());
    const heading = lines.find((line) => /^#{1,6}\s+/.test(line));
    const firstParagraph = lines.find(
      (line) =>
        line.length > 0 &&
        !/^#{1,6}\s+/.test(line) &&
        !/^[-*+]\s+/.test(line) &&
        !/^\d+\.\s+/.test(line),
    );

    const title = heading?.replace(/^#{1,6}\s+/, '') || 'New Blog';
    const excerpt = (firstParagraph || '').slice(0, 160);
    const slug = slugify(title || 'new-blog');

    localStorage.setItem(
      CREATE_BLOG_DRAFT_KEY,
      JSON.stringify({
        slug,
        imageUrl: '',
        title,
        excerpt,
        content: markdown,
        published: 'false',
      }),
    );

    router.push('/site/private/authorization/root/create/blog');
  };

  const handleDrop = async (event: React.DragEvent<HTMLTextAreaElement>) => {
    event.preventDefault();

    const imageFile = Array.from(event.dataTransfer.files).find((file) =>
      file.type.startsWith('image/'),
    );

    if (!imageFile) return;

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.readAsDataURL(imageFile);
    });

    insertText(`![${imageFile.name}](${dataUrl})`);
    setAnnounce('Image inserted');
  };

  const scrollToHeading = (id: string) => {
    const heading = headings.find((item) => item.id === id);
    const preview = editorPaneRef.current;
    const textarea = textareaRef.current;
    if (!heading || !preview || !textarea) return;

    const previewTarget = preview.querySelector(`#${id}`);
    if (previewTarget instanceof HTMLElement) {
      const top = previewTarget.offsetTop - 20;
      preview.scrollTo({ top, behavior: 'smooth' });
    }

    const lineHeight = Number.parseFloat(
      window.getComputedStyle(textarea).lineHeight || '24',
    );
    const lineTop = Math.max(
      0,
      heading.lineStart * (Number.isFinite(lineHeight) ? lineHeight : 24),
    );
    textarea.scrollTo({ top: lineTop, behavior: 'smooth' });
    textarea.focus();
    textarea.setSelectionRange(heading.charStart, heading.charStart);
  };

  const syncScroll = (
    source: HTMLElement,
    target: HTMLElement,
    sourceFlag: MutableRefObject<boolean>,
    targetFlag: MutableRefObject<boolean>,
  ) => {
    if (sourceFlag.current) {
      sourceFlag.current = false;
      return;
    }

    const sourceMax = source.scrollHeight - source.clientHeight;
    const targetMax = target.scrollHeight - target.clientHeight;

    if (sourceMax <= 0 || targetMax <= 0) return;

    const ratio = source.scrollTop / sourceMax;
    targetFlag.current = true;
    target.scrollTop = ratio * targetMax;
  };

  const onInputScroll = (event: UIEvent<HTMLTextAreaElement>) => {
    const preview = editorPaneRef.current;
    if (!preview || viewMode !== 'split') return;

    syncScroll(
      event.currentTarget,
      preview,
      syncingFromPreviewRef,
      syncingFromInputRef,
    );
  };

  const onPreviewScroll = (event: UIEvent<HTMLDivElement>) => {
    const textarea = textareaRef.current;
    if (!textarea || viewMode !== 'split') return;

    syncScroll(
      event.currentTarget,
      textarea,
      syncingFromInputRef,
      syncingFromPreviewRef,
    );
  };

  const detectSlashQuery = (value: string, cursor: number) => {
    const lineStart = value.lastIndexOf('\n', Math.max(0, cursor - 1)) + 1;
    const lineToCursor = value.slice(lineStart, cursor);
    const slashMatch = /^\/(\w*)$/.exec(lineToCursor.trim());

    if (!slashMatch) {
      setSlashOpen(false);
      setSlashQuery('');
      setSlashRange(null);
      setSlashIndex(0);
      return;
    }

    const tokenStart = lineStart + lineToCursor.indexOf('/');
    setSlashOpen(true);
    setSlashQuery(slashMatch[1].toLowerCase());
    setSlashRange({ start: tokenStart, end: cursor });
    setSlashIndex(0);
  };

  const onInputChange = (value: string) => {
    applyMarkdown(value);

    const textarea = textareaRef.current;
    if (!textarea) return;
    detectSlashQuery(value, textarea.selectionStart);
  };

  const onCommandApply = (command: SlashCommand) => {
    if (slashRange) {
      replaceRange(slashRange.start, slashRange.end, '');
    }

    if (command.action === 'h1') setHeading(1);
    if (command.action === 'h2') setHeading(2);
    if (command.action === 'h3') setHeading(3);
    if (command.action === 'quote') prefixSelectedLines('> ');
    if (command.action === 'ul') prefixSelectedLines('- ');
    if (command.action === 'ol') prefixSelectedLines('1. ');
    if (command.action === 'code') insertText('\n```ts\ncode\n```\n');
    if (command.action === 'table') {
      insertText(
        '\n| Column 1 | Column 2 |\n| --- | --- |\n| Value A | Value B |\n',
      );
    }
    if (command.action === 'hr') insertText('\n---\n');
    if (command.action === 'math') insertText('\n$$\nE = mc^2\n$$\n');
    if (command.action === 'footnote') insertText('[^1]\n\n[^1]: Footnote');
    if (command.action === 'link') {
      wrapSelection('[', '](https://example.com)', 'label');
    }
    if (command.action === 'image') {
      wrapSelection('![', '](https://example.com/image.png)', 'alt text');
    }

    setSlashOpen(false);
    setSlashQuery('');
    setSlashRange(null);
    setSlashIndex(0);
  };

  const filteredSlashCommands = useMemo(
    () =>
      SLASH_COMMANDS.filter(
        (item) =>
          item.key.includes(slashQuery) ||
          item.label.toLowerCase().includes(slashQuery),
      ),
    [slashQuery],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    if (slashOpen) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSlashIndex((current) =>
          filteredSlashCommands.length === 0
            ? 0
            : (current + 1) % filteredSlashCommands.length,
        );
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSlashIndex((current) =>
          filteredSlashCommands.length === 0
            ? 0
            : (current - 1 + filteredSlashCommands.length) %
              filteredSlashCommands.length,
        );
        return;
      }

      if (event.key === 'Enter') {
        const command = filteredSlashCommands[slashIndex];
        if (!command) return;
        event.preventDefault();
        onCommandApply(command);
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        setSlashOpen(false);
        return;
      }
    }

    const mod = event.metaKey || event.ctrlKey;
    const key = event.key.toLowerCase();

    if (mod && key === '/') {
      event.preventDefault();
      setShowHelp((current) => !current);
      return;
    }

    if (mod && key === 'b') {
      event.preventDefault();
      wrapSelection('**');
      return;
    }

    if (mod && key === 'i') {
      event.preventDefault();
      wrapSelection('_');
      return;
    }

    if (mod && key === 'k') {
      event.preventDefault();
      wrapSelection('[', '](https://example.com)', 'label');
      return;
    }

    if (mod && key === 'z' && !event.shiftKey) {
      event.preventDefault();
      undo();
      return;
    }

    if (mod && ((key === 'z' && event.shiftKey) || key === 'y')) {
      event.preventDefault();
      redo();
      return;
    }

    if (mod && key === 'x' && event.shiftKey) {
      event.preventDefault();
      wrapSelection('~~');
      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      indentSelectedLines('  ', event.shiftKey);
      return;
    }

    if (event.key === 'Enter') {
      const { value, selectionStart, selectionEnd } = textarea;
      if (selectionStart !== selectionEnd) return;

      const lineStart =
        value.lastIndexOf('\n', Math.max(0, selectionStart - 1)) + 1;
      const lineEnd = value.indexOf('\n', selectionStart);
      const end = lineEnd === -1 ? value.length : lineEnd;
      const line = value.slice(lineStart, end);

      const emptyListMatch = /^(\s*)([-*+]|\d+\.)\s*$/.exec(line);
      if (emptyListMatch) {
        event.preventDefault();
        replaceRange(lineStart, end, emptyListMatch[1]);
        insertText('\n');
        return;
      }

      const listMatch = /^(\s*)([-*+]|\d+\.)\s+/.exec(line);
      if (listMatch) {
        event.preventDefault();
        insertText(`\n${listMatch[1]}${listMatch[2]} `);
        return;
      }

      const quoteMatch = /^(\s*>+\s?)/.exec(line);
      if (quoteMatch) {
        event.preventDefault();
        insertText(`\n${quoteMatch[1]}`);
      }
    }

    if (event.key === '`') {
      const { value, selectionStart, selectionEnd } = textarea;
      if (selectionStart !== selectionEnd) return;

      const previousTwo = value.slice(
        Math.max(0, selectionStart - 2),
        selectionStart,
      );
      if (previousTwo === '``') {
        event.preventDefault();
        insertText('`\n\n```');

        requestAnimationFrame(() => {
          const input = textareaRef.current;
          if (!input) return;
          const cursor = input.selectionStart - 4;
          input.setSelectionRange(cursor, cursor);
        });
      }
    }
  };

  const showInputPane = viewMode === 'edit' || viewMode === 'split';
  const showPreviewPane = viewMode === 'preview' || viewMode === 'split';

  return (
    <Section
      id='markdown-editor'
      className={MarkdownEditorStyles.MarkdownEditor}
    >
      <div
        className={MarkdownEditorStyles.Announcer}
        aria-live='polite'
      >
        {announce}
      </div>

      <div
        className={MarkdownEditorStyles.Toolbar}
        role='toolbar'
        aria-label='Markdown actions'
      >
        <div className={MarkdownEditorStyles.ViewMode}>
          <button
            className={MarkdownEditorStyles.ToolbarButton}
            onClick={() => setViewMode('edit')}
            type='button'
            aria-pressed={viewMode === 'edit'}
          >
            Edit
          </button>
          <button
            className={MarkdownEditorStyles.ToolbarButton}
            onClick={() => setViewMode('split')}
            type='button'
            aria-pressed={viewMode === 'split'}
          >
            Split
          </button>
          <button
            className={MarkdownEditorStyles.ToolbarButton}
            onClick={() => setViewMode('preview')}
            type='button'
            aria-pressed={viewMode === 'preview'}
          >
            Preview
          </button>
        </div>

        <details className={MarkdownEditorStyles.ToolbarToc}>
          <summary className={MarkdownEditorStyles.ToolbarButton}>TOC</summary>
          <div className={MarkdownEditorStyles.ToolbarTocBody}>
            {headings.length === 0 && (
              <span className={MarkdownEditorStyles.ToolbarTocEmpty}>
                No headings yet
              </span>
            )}
            {headings.map((heading) => (
              <button
                key={`toc-${heading.id}`}
                className={MarkdownEditorStyles.ToolbarTocButton}
                data-level={heading.level}
                onClick={() => scrollToHeading(heading.id)}
                type='button'
              >
                {heading.text}
              </button>
            ))}
          </div>
        </details>

        <details
          className={MarkdownEditorStyles.Help}
          open={showHelp}
          onToggle={(event) =>
            setShowHelp((event.target as HTMLDetailsElement).open)
          }
        >
          <summary className={MarkdownEditorStyles.ToolbarButton}>Help</summary>
          <div className={MarkdownEditorStyles.HelpBody}>
            <p>Shortcuts</p>
            <ul>
              <li>Ctrl/Cmd + B: Bold</li>
              <li>Ctrl/Cmd + I: Italic</li>
              <li>Ctrl/Cmd + K: Link</li>
              <li>Ctrl/Cmd + Shift + X: Strikethrough</li>
              <li>Ctrl/Cmd + Z / Shift + Z: Undo / Redo</li>
              <li>Ctrl/Cmd + /: Toggle Help</li>
              <li>Type / in a new line: Slash commands</li>
            </ul>
          </div>
        </details>

        <button
          className={MarkdownEditorStyles.ToolbarButton}
          onClick={() => wrapSelection('**')}
          type='button'
          aria-label='Bold'
        >
          Bold
        </button>
        <button
          className={MarkdownEditorStyles.ToolbarButton}
          onClick={() => wrapSelection('_')}
          type='button'
          aria-label='Italic'
        >
          Italic
        </button>
        <button
          className={MarkdownEditorStyles.ToolbarButton}
          onClick={() => wrapSelection('~~')}
          type='button'
          aria-label='Strikethrough'
        >
          Strike
        </button>
        {[1, 2, 3, 4, 5, 6].map((level) => (
          <button
            key={`h-${level}`}
            className={MarkdownEditorStyles.ToolbarButton}
            onClick={() => setHeading(level)}
            type='button'
            aria-label={`Heading ${level}`}
          >
            H{level}
          </button>
        ))}
        <button
          className={MarkdownEditorStyles.ToolbarButton}
          onClick={() => wrapSelection('[', '](https://example.com)', 'label')}
          type='button'
        >
          Link
        </button>
        <button
          className={MarkdownEditorStyles.ToolbarButton}
          onClick={() =>
            wrapSelection('![', '](https://example.com/image.png)', 'alt text')
          }
          type='button'
        >
          Image
        </button>
        <button
          className={MarkdownEditorStyles.ToolbarButton}
          onClick={() => prefixSelectedLines('- ')}
          type='button'
        >
          UL
        </button>
        <button
          className={MarkdownEditorStyles.ToolbarButton}
          onClick={() => prefixSelectedLines('1. ')}
          type='button'
        >
          OL
        </button>
        <button
          className={MarkdownEditorStyles.ToolbarButton}
          onClick={() => prefixSelectedLines('> ')}
          type='button'
        >
          Quote
        </button>
        <button
          className={MarkdownEditorStyles.ToolbarButton}
          onClick={() => insertText('\n```ts\ncode\n```\n')}
          type='button'
        >
          Code
        </button>
        <button
          className={MarkdownEditorStyles.ToolbarButton}
          onClick={() =>
            insertText(
              '\n| Column 1 | Column 2 |\n| --- | --- |\n| Value A | Value B |\n',
            )
          }
          type='button'
        >
          Table
        </button>
        <button
          className={MarkdownEditorStyles.ToolbarButton}
          onClick={() => insertText('\n---\n')}
          type='button'
        >
          HR
        </button>
        <button
          className={MarkdownEditorStyles.ToolbarButton}
          onClick={undo}
          type='button'
        >
          Undo
        </button>
        <button
          className={MarkdownEditorStyles.ToolbarButton}
          onClick={redo}
          type='button'
        >
          Redo
        </button>
        <button
          className={MarkdownEditorStyles.ToolbarButton}
          onClick={copyMarkdown}
          type='button'
        >
          {copyLabel}
        </button>
        <button
          className={MarkdownEditorStyles.ToolbarButton}
          onClick={pasteFromClipboard}
          type='button'
        >
          Paste
        </button>
        <button
          className={MarkdownEditorStyles.ToolbarButton}
          onClick={restoreDraft}
          type='button'
        >
          Restore
        </button>
        <button
          className={MarkdownEditorStyles.ToolbarButton}
          onClick={clearDraft}
          type='button'
        >
          Clear Draft
        </button>
        <button
          className={MarkdownEditorStyles.ToolbarButton}
          onClick={toCreateBlog}
          type='button'
        >
          Use in Create Blog
        </button>
      </div>

      <div className={MarkdownEditorStyles.StatusRow}>
        <span className={MarkdownEditorStyles.PaneMeta}>{saveLabel}</span>
      </div>

      <div
        className={[
          MarkdownEditorStyles.Panes,
          viewMode === 'split' ? MarkdownEditorStyles.PanesSplit : '',
        ].join(' ')}
      >
        {showInputPane && (
          <section className={MarkdownEditorStyles.Pane}>
            <header className={MarkdownEditorStyles.PaneHeader}>
              <h2 className={MarkdownEditorStyles.PaneTitle}>Markdown Input</h2>
              <span className={MarkdownEditorStyles.PaneMeta}>
                {markdown.length} chars
              </span>
            </header>
            <div className={MarkdownEditorStyles.InputWrap}>
              <textarea
                ref={textareaRef}
                className={MarkdownEditorStyles.Textarea}
                value={markdown}
                onChange={(event) => onInputChange(event.target.value)}
                onKeyDown={onKeyDown}
                onScroll={onInputScroll}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
                spellCheck
                aria-label='Markdown input'
              />

              {slashOpen && filteredSlashCommands.length > 0 && (
                <div className={MarkdownEditorStyles.SlashMenu}>
                  {filteredSlashCommands.map((command, index) => (
                    <button
                      key={command.key}
                      className={[
                        MarkdownEditorStyles.SlashMenuItem,
                        index === slashIndex
                          ? MarkdownEditorStyles.SlashMenuItemActive
                          : '',
                      ].join(' ')}
                      type='button'
                      onClick={() => onCommandApply(command)}
                    >
                      {command.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {showPreviewPane && (
          <section className={MarkdownEditorStyles.Pane}>
            <header className={MarkdownEditorStyles.PaneHeader}>
              <h2 className={MarkdownEditorStyles.PaneTitle}>Live Preview</h2>
              <span className={MarkdownEditorStyles.PaneMeta}>
                Supports math, footnotes, tables, and code highlighting
              </span>
            </header>

            <div
              ref={editorPaneRef}
              className={MarkdownEditorStyles.Preview}
              onScroll={onPreviewScroll}
            >
              <MarkdownPreview
                markdown={previewMarkdown}
                className={[
                  MarkdownEditorStyles.Markdown,
                  'markdown-body',
                ].join(' ')}
                classNames={{
                  inlineCode: MarkdownEditorStyles.InlineCode,
                  syntaxBlock: MarkdownEditorStyles.SyntaxBlock,
                  link: MarkdownEditorStyles.MarkdownLink,
                  imageLink: MarkdownEditorStyles.MarkdownImageLink,
                  image: MarkdownEditorStyles.MarkdownImage,
                }}
              />
            </div>
          </section>
        )}
      </div>
    </Section>
  );
}
