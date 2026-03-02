'use client';

import { Section } from '@components/layout';
import { TerminalToolStyles } from '@styles/section';
import { KeyboardEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface TerminalEntry {
  id: string;
  command: string;
  output: string;
  mode: ActiveTab;
}

interface HostEntry {
  name: string;
  path: string;
  type: 'file' | 'directory' | 'symlink';
  size: number;
  modifiedAt: string;
}

interface ListingPayload {
  currentPath: string;
  parentPath: string | null;
  entries: HostEntry[];
}

interface AutocompleteItem {
  value: string;
  label: string;
  detail: 'command' | 'directory';
}

const browserCommands = [
  'clear',
  'cls',
  'document.title',
  'window.location.href',
  'navigator.userAgent',
  'Object.keys(localStorage)',
  'new Date().toISOString()',
];

const browserSafeExamples = [
  'document.title',
  'window.location.href',
  'navigator.userAgent',
  'Object.keys(localStorage)',
  'new Date().toISOString()',
];

type ActiveTab = 'workspace' | 'git' | 'browser';

const workspaceCommands = [
  'clear',
  'cls',
  'pwd',
  'ls',
  'cd ..',
  'cd /',
  'whoami',
  'date',
  'echo hello',
  'cat README.md',
];

const gitCommands = [
  'clear',
  'cls',
  'git status',
  'git branch',
  'git log --oneline -5',
  'git diff --stat',
  'git remote -v',
  'git fetch --all',
];

const runLocalCommand = (command: string, currentPath: string): string => {
  const value = command.trim();

  if (value === 'whoami') return 'root';
  if (value === 'date') return new Date().toString();
  if (value === 'cat README.md') {
    return `README preview from ${currentPath}`;
  }

  if (value.startsWith('echo ')) {
    return value.slice(5).trim();
  }

  if (value === 'git status') {
    return 'On branch development\nYour branch is up to date with origin/development.';
  }

  if (value === 'git branch') {
    return '* development\n  staging\n  production';
  }

  if (value === 'git log --oneline -5') {
    return 'd13fe21 feat: add tool split\n9a11e8c refactor: modernize tools';
  }

  if (value === 'git diff --stat') {
    return ' src/components/section/ApiTester.tsx | 120 ++++++++++++++\n 1 file changed';
  }

  if (value === 'git remote -v') {
    return 'origin\thttps://example.com/repo.git (fetch)\norigin\thttps://example.com/repo.git (push)';
  }

  if (value === 'git fetch --all') {
    return 'Fetching origin\nAlready up to date.';
  }

  return 'Command not recognized in this sandbox terminal.';
};

const normalizePath = (currentPath: string, inputPath: string): string => {
  const value = inputPath.trim();
  if (!value || value === '~') return '/';

  const source = value.startsWith('/')
    ? value
    : `${currentPath.replace(/\/$/, '')}/${value}`;

  const stack: string[] = [];
  for (const segment of source.split('/')) {
    if (!segment || segment === '.') continue;
    if (segment === '..') {
      stack.pop();
      continue;
    }
    stack.push(segment);
  }

  return `/${stack.join('/')}`;
};

const formatList = (entries: HostEntry[]): string => {
  if (entries.length === 0) return '(empty)';
  return entries
    .map((entry) => {
      if (entry.type === 'directory') return `${entry.name}/`;
      if (entry.type === 'symlink') return `${entry.name}@`;
      return entry.name;
    })
    .join('\n');
};

const formatBrowserResult = (value: unknown): string => {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return value;

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const formatBrowserLogValue = (value: unknown): string => {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const runBrowserCommand = async (command: string): Promise<string> => {
  const source = command.trim();
  if (!source) return '';

  const capturedLogs: string[] = [];
  const scopedConsole = {
    log: (...args: unknown[]) => {
      capturedLogs.push(args.map((arg) => formatBrowserLogValue(arg)).join(' '));
    },
    info: (...args: unknown[]) => {
      capturedLogs.push(args.map((arg) => formatBrowserLogValue(arg)).join(' '));
    },
    warn: (...args: unknown[]) => {
      capturedLogs.push(`warn: ${args.map((arg) => formatBrowserLogValue(arg)).join(' ')}`);
    },
    error: (...args: unknown[]) => {
      capturedLogs.push(`error: ${args.map((arg) => formatBrowserLogValue(arg)).join(' ')}`);
    },
    debug: (...args: unknown[]) => {
      capturedLogs.push(`debug: ${args.map((arg) => formatBrowserLogValue(arg)).join(' ')}`);
    },
  };

  const composeResult = (result: unknown): string => {
    const rendered = formatBrowserResult(result);
    if (capturedLogs.length === 0) {
      return rendered;
    }

    if (rendered === 'undefined') {
      return capturedLogs.join('\n');
    }

    return `${capturedLogs.join('\n')}\n${rendered}`;
  };

  try {
    const evaluateExpression = new Function(
      'window',
      'document',
      'navigator',
      'localStorage',
      'console',
      `"use strict"; return (${source});`,
    );

    const expressionResult = evaluateExpression(
      window,
      document,
      navigator,
      localStorage,
      scopedConsole,
    );
    const resolved = expressionResult instanceof Promise
      ? await expressionResult
      : expressionResult;
    return composeResult(resolved);
  } catch {
    try {
      const evaluateStatement = new Function(
        'window',
        'document',
        'navigator',
        'localStorage',
        'console',
        `"use strict"; ${source}`,
      );
      const statementResult = evaluateStatement(
        window,
        document,
        navigator,
        localStorage,
        scopedConsole,
      );
      const resolved = statementResult instanceof Promise
        ? await statementResult
        : statementResult;
      return composeResult(resolved);
    } catch (caught) {
      return caught instanceof Error ? `${caught.name}: ${caught.message}` : 'Execution failed.';
    }
  }
};

export default function TerminalTool() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('workspace');
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState<TerminalEntry[]>([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [entries, setEntries] = useState<HostEntry[]>([]);
  const [navigationLoading, setNavigationLoading] = useState(false);
  const [navigationError, setNavigationError] = useState('');
  const [activeAutocompleteIndex, setActiveAutocompleteIndex] = useState(0);

  const loadPath = useCallback(async (targetPath: string) => {
    setNavigationLoading(true);
    setNavigationError('');

    try {
      const params = new URLSearchParams({ action: 'list', path: targetPath });
      const response = await fetch(
        `/api/private/authorization/root/tools/file-manager?${params.toString()}`,
      );
      const payload = (await response.json()) as {
        ok: boolean;
        data?: ListingPayload;
        error?: { message?: string };
      };

      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(payload.error?.message || 'Unable to open this path.');
      }

      setCurrentPath(payload.data.currentPath);
      setParentPath(payload.data.parentPath);
      setEntries(payload.data.entries);
      return {
        ok: true,
        path: payload.data.currentPath,
      };
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : 'Unable to navigate this path.';
      setNavigationError(message);
      return {
        ok: false,
        message,
      };
    } finally {
      setNavigationLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPath('/');
  }, [loadPath]);

  const segments = useMemo(() => {
    const split = currentPath.split('/').filter(Boolean);
    return split.map((segment, index) => ({
      label: segment,
      value: `/${split.slice(0, index + 1).join('/')}`,
    }));
  }, [currentPath]);

  const directories = useMemo(
    () => entries.filter((entry) => entry.type === 'directory'),
    [entries],
  );

  const autocompleteItems = useMemo<AutocompleteItem[]>(() => {
    const value = input.trimStart();
    const commandPool =
      activeTab === 'workspace'
        ? workspaceCommands
        : activeTab === 'git'
          ? gitCommands
          : browserCommands;

    if (!value) {
      return commandPool.map((command) => ({
        value: command,
        label: command,
        detail: 'command',
      }));
    }

    if (activeTab === 'workspace' && value.startsWith('cd')) {
      const rawArgument = value.slice(2).trimStart();

      if (!rawArgument) {
        const defaultDirs: AutocompleteItem[] = [
          { value: 'cd ..', label: '..', detail: 'directory' },
          { value: 'cd /', label: '/', detail: 'directory' },
        ];
        const currentDirs = directories.map((directory) => ({
          value: `cd ${directory.name}`,
          label: `${directory.name}/`,
          detail: 'directory' as const,
        }));
        return [...defaultDirs, ...currentDirs];
      }

      const lastSlashIndex = rawArgument.lastIndexOf('/');
      const basePathPart =
        lastSlashIndex >= 0 ? rawArgument.slice(0, lastSlashIndex + 1) : '';
      const fragment = (
        lastSlashIndex >= 0
          ? rawArgument.slice(lastSlashIndex + 1)
          : rawArgument
      ).toLowerCase();

      const matchingDirs = directories
        .filter((directory) =>
          directory.name.toLowerCase().startsWith(fragment),
        )
        .map((directory) => ({
          value: `cd ${basePathPart}${directory.name}`,
          label: `${basePathPart}${directory.name}/`,
          detail: 'directory' as const,
        }));

      if ('..'.startsWith(fragment)) {
        matchingDirs.unshift({
          value: `cd ${basePathPart}..`,
          label: `${basePathPart}..`,
          detail: 'directory',
        });
      }

      if ('/'.startsWith(fragment)) {
        matchingDirs.unshift({
          value: 'cd /',
          label: '/',
          detail: 'directory',
        });
      }

      return matchingDirs;
    }

    const normalized = value.toLowerCase();
    return commandPool
      .filter((command) => command.toLowerCase().startsWith(normalized))
      .map((command) => ({
        value: command,
        label: command,
        detail: 'command' as const,
      }));
  }, [activeTab, directories, input]);

  useEffect(() => {
    if (activeAutocompleteIndex >= autocompleteItems.length) {
      setActiveAutocompleteIndex(0);
    }
  }, [activeAutocompleteIndex, autocompleteItems.length]);

  const applyAutocomplete = (index: number) => {
    if (autocompleteItems.length === 0) return;
    const selected = autocompleteItems[index] || autocompleteItems[0];
    setInput(selected.value);
    setActiveAutocompleteIndex(0);
  };

  const appendLog = (command: string, output: string, mode: ActiveTab = activeTab) => {
    setLogs((current) => [
      {
        id: crypto.randomUUID(),
        command,
        output,
        mode,
      },
      ...current,
    ]);
  };

  const navigateAndLog = async (targetPath: string, command: string) => {
    const result = await loadPath(targetPath);
    if (result.ok) {
      appendLog(command, `Changed directory to ${result.path}`, 'workspace');
      return;
    }

    appendLog(command, `cd: ${result.message}`, 'workspace');
  };

  const runCommand = async () => {
    const value = input.trim();
    if (!value) return;

    if (value === 'clear' || value === 'cls') {
      setLogs([]);
      setInput('');
      return;
    }

    if (activeTab === 'workspace') {
      if (value === 'pwd') {
        appendLog(value, currentPath);
        setInput('');
        return;
      }

      if (value === 'ls') {
        appendLog(value, formatList(entries));
        setInput('');
        return;
      }

      if (value.startsWith('cd')) {
        const argument = value.slice(2).trim();
        const targetPath = normalizePath(currentPath, argument || '/');
        await navigateAndLog(targetPath, value);
        setInput('');
        return;
      }
    }

    if (activeTab === 'browser') {
      const output = await runBrowserCommand(value);
      appendLog(value, output, 'browser');
      setInput('');
      return;
    }

    appendLog(value, runLocalCommand(value, currentPath), 'git');
    setInput('');
  };

  const handleCommandKeyDown = (
    event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (event.key === 'Tab' && autocompleteItems.length > 0) {
      event.preventDefault();
      applyAutocomplete(activeAutocompleteIndex);
      return;
    }

    if (event.key === 'ArrowDown' && autocompleteItems.length > 0) {
      event.preventDefault();
      setActiveAutocompleteIndex((current) =>
        current >= autocompleteItems.length - 1 ? 0 : current + 1,
      );
      return;
    }

    if (event.key === 'ArrowUp' && autocompleteItems.length > 0) {
      event.preventDefault();
      setActiveAutocompleteIndex((current) =>
        current <= 0 ? autocompleteItems.length - 1 : current - 1,
      );
      return;
    }

    if (activeTab === 'browser') {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        void runCommand();
      }
      return;
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void runCommand();
    }
  };

  return (
    <Section
      id='terminal-tool'
      className={TerminalToolStyles.TerminalTool}
    >
      <header className={TerminalToolStyles.Topbar}>
        <div className={TerminalToolStyles.Header}>
          <h2 className={TerminalToolStyles.Title}>Terminal</h2>
          <p className={TerminalToolStyles.Subtitle}>
            Run safe helper commands in-app.
          </p>
        </div>

        <div className={TerminalToolStyles.Tabs}>
          <button
            type='button'
            className={`${TerminalToolStyles.Tab} ${
              activeTab === 'workspace' ? TerminalToolStyles.ActiveTab : ''
            }`}
            onClick={() => setActiveTab('workspace')}
          >
            Workspace
          </button>
          <button
            type='button'
            className={`${TerminalToolStyles.Tab} ${
              activeTab === 'git' ? TerminalToolStyles.ActiveTab : ''
            }`}
            onClick={() => setActiveTab('git')}
          >
            Git
          </button>
          <button
            type='button'
            className={`${TerminalToolStyles.Tab} ${
              activeTab === 'browser' ? TerminalToolStyles.ActiveTab : ''
            }`}
            onClick={() => setActiveTab('browser')}
          >
            Browser
          </button>
        </div>
      </header>

      <div
        className={`${TerminalToolStyles.Workspace} ${
          activeTab !== 'workspace' ? TerminalToolStyles.WorkspaceGit : ''
        }`}
      >
        {activeTab === 'workspace' ? (
          <aside className={TerminalToolStyles.SuggestionsPanel}>
            <>
              <h3 className={TerminalToolStyles.PanelTitle}>Navigator</h3>

              <div className={TerminalToolStyles.NavigatorSection}>
                <div className={TerminalToolStyles.PathCard}>
                  <p className={TerminalToolStyles.PathLabel}>Current Path</p>
                  <p className={TerminalToolStyles.PathValue}>{currentPath}</p>
                </div>

                <div className={TerminalToolStyles.Breadcrumbs}>
                  <button
                    type='button'
                    className={TerminalToolStyles.Button}
                    onClick={() => void navigateAndLog('/', 'cd /')}
                    disabled={navigationLoading}
                  >
                    /
                  </button>
                  {segments.map((segment) => (
                    <button
                      key={segment.value}
                      type='button'
                      className={TerminalToolStyles.Button}
                      onClick={() =>
                        void navigateAndLog(
                          segment.value,
                          `cd ${segment.value}`,
                        )
                      }
                      disabled={navigationLoading}
                    >
                      {segment.label}
                    </button>
                  ))}
                </div>

                <div className={TerminalToolStyles.NavActions}>
                  <button
                    type='button'
                    className={TerminalToolStyles.Button}
                    onClick={() => {
                      if (parentPath) {
                        void navigateAndLog(parentPath, 'cd ..');
                      }
                    }}
                    disabled={!parentPath || navigationLoading}
                  >
                    Go Up
                  </button>
                  <button
                    type='button'
                    className={TerminalToolStyles.Button}
                    onClick={() => void loadPath(currentPath)}
                    disabled={navigationLoading}
                  >
                    {navigationLoading ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
              </div>

              <h3 className={TerminalToolStyles.PanelTitle}>Folders</h3>
              <div className={TerminalToolStyles.Suggestions}>
                {navigationError ? (
                  <p className={TerminalToolStyles.Error}>{navigationError}</p>
                ) : directories.length === 0 ? (
                  <p className={TerminalToolStyles.Empty}>
                    No folders available in this path.
                  </p>
                ) : (
                  directories.map((directory) => (
                    <button
                      key={directory.path}
                      type='button'
                      className={TerminalToolStyles.Suggestion}
                      onClick={() =>
                        void navigateAndLog(
                          directory.path,
                          `cd ${directory.path}`,
                        )
                      }
                    >
                      {directory.name}/
                    </button>
                  ))
                )}
              </div>
            </>
          </aside>
        ) : null}

        <section className={TerminalToolStyles.TerminalPanel}>
          <div className={TerminalToolStyles.Composer}>
            {activeTab === 'browser' ? (
              <textarea
                className={TerminalToolStyles.BrowserTextarea}
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  setActiveAutocompleteIndex(0);
                }}
                placeholder='Write JavaScript here. Use Ctrl+Enter (or Cmd+Enter) to run.'
                aria-label='Browser JavaScript input'
                rows={7}
                spellCheck={false}
                onKeyDown={handleCommandKeyDown}
              />
            ) : (
              <input
                className={TerminalToolStyles.Input}
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  setActiveAutocompleteIndex(0);
                }}
                placeholder={
                  activeTab === 'workspace'
                    ? `Enter command (cwd: ${currentPath})`
                    : 'Enter command'
                }
                aria-label='Command input'
                onKeyDown={handleCommandKeyDown}
              />
            )}
            <button
              type='button'
              className={TerminalToolStyles.Button}
              onClick={() => void runCommand()}
            >
              Run
            </button>

            {activeTab === 'browser' ? (
              <div className={TerminalToolStyles.ScriptPreview}>
                <p className={TerminalToolStyles.ScriptPreviewLabel}>JavaScript Preview</p>
                <SyntaxHighlighter
                  className={TerminalToolStyles.SyntaxBlock}
                  language='javascript'
                  style={oneDark}
                  customStyle={{ margin: 0, borderRadius: 10, fontSize: 12 }}
                  codeTagProps={{
                    style: {
                      color: '#abb2bf',
                    },
                  }}
                  wrapLongLines
                >
                  {input.trim() || '// Write JavaScript and run it'}
                </SyntaxHighlighter>
              </div>
            ) : null}
          </div>

          <div className={TerminalToolStyles.Terminal}>
            {logs.length === 0 ? (
              <p className={TerminalToolStyles.Empty}>
                No commands yet. Use autocomplete in the right panel to run
                commands.
              </p>
            ) : (
              logs.map((entry) => (
                <div
                  key={entry.id}
                  className={TerminalToolStyles.Log}
                >
                  <div className={TerminalToolStyles.Command}>
                    <SyntaxHighlighter
                      className={TerminalToolStyles.SyntaxBlock}
                      language={entry.mode === 'browser' ? 'javascript' : 'bash'}
                      style={oneDark}
                      customStyle={{
                        margin: 0,
                        borderRadius: 0,
                        padding: '8px 10px',
                      }}
                      codeTagProps={{
                        style: {
                          fontSize: 12,
                          lineHeight: 1.4,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          overflowWrap: 'anywhere',
                          color: '#abb2bf',
                        },
                      }}
                      wrapLongLines
                      PreTag='div'
                    >
                      {`$ ${entry.command}`}
                    </SyntaxHighlighter>
                  </div>
                  <div className={TerminalToolStyles.Output}>
                    <SyntaxHighlighter
                      className={TerminalToolStyles.SyntaxBlock}
                      language={entry.mode === 'browser' ? 'javascript' : 'bash'}
                      style={oneDark}
                      customStyle={{
                        margin: 0,
                        borderRadius: 0,
                        padding: '10px',
                      }}
                      codeTagProps={{
                        style: {
                          fontSize: 12,
                          lineHeight: 1.5,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          overflowWrap: 'anywhere',
                          color: '#abb2bf',
                        },
                      }}
                      wrapLongLines
                      PreTag='div'
                    >
                      {entry.output || '(no output)'}
                    </SyntaxHighlighter>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <aside className={TerminalToolStyles.AutocompleteAside}>
          <h3 className={TerminalToolStyles.PanelTitle}>Autocomplete</h3>
          <div className={TerminalToolStyles.Suggestions}>
            {activeTab === 'browser' ? (
              <div className={TerminalToolStyles.BrowserHelpCard}>
                <p className={TerminalToolStyles.BrowserHelpTitle}>Browser JS</p>
                <p className={TerminalToolStyles.BrowserHelpText}>
                  Run scripts in your browser session. Avoid destructive code.
                </p>
                <div className={TerminalToolStyles.BrowserHelpExamples}>
                  {browserSafeExamples.map((example) => (
                    <button
                      key={example}
                      type='button'
                      className={TerminalToolStyles.Suggestion}
                      onClick={() => {
                        setInput(example);
                        setActiveAutocompleteIndex(0);
                      }}
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {autocompleteItems.length === 0 ? (
              <p className={TerminalToolStyles.Empty}>No suggestions.</p>
            ) : (
              autocompleteItems.slice(0, 20).map((item, index) => (
                <button
                  key={`${item.value}-${index}`}
                  type='button'
                  className={`${TerminalToolStyles.AutocompleteItem} ${
                    index === activeAutocompleteIndex
                      ? TerminalToolStyles.AutocompleteItemActive
                      : ''
                  }`}
                  onClick={() => applyAutocomplete(index)}
                >
                  <span>{item.label}</span>
                  <span className={TerminalToolStyles.AutocompleteDetail}>
                    {item.detail}
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>
      </div>
    </Section>
  );
}
