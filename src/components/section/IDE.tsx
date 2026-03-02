'use client';

import { Section } from '@components/layout';
import Editor from '@monaco-editor/react';
import { IDEStyles } from '@styles/section';
import { useCallback, useEffect, useMemo, useState } from 'react';

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

interface PreviewData {
  path: string;
  kind: 'text' | 'image' | 'binary';
  name: string;
  mime: string;
  size: number;
  truncated: boolean;
  content: string | null;
}

const resolveLanguageFromPath = (filePath: string): string => {
  const normalized = filePath.toLowerCase();
  if (normalized.endsWith('.ts')) return 'typescript';
  if (normalized.endsWith('.tsx')) return 'typescript';
  if (normalized.endsWith('.js')) return 'javascript';
  if (normalized.endsWith('.jsx')) return 'javascript';
  if (normalized.endsWith('.json')) return 'json';
  if (normalized.endsWith('.md')) return 'markdown';
  if (normalized.endsWith('.css')) return 'css';
  if (normalized.endsWith('.html')) return 'html';
  if (normalized.endsWith('.py')) return 'python';
  if (normalized.endsWith('.sql')) return 'sql';
  if (normalized.endsWith('.yaml') || normalized.endsWith('.yml')) return 'yaml';
  return 'plaintext';
};

export default function IDE() {
  const [currentPath, setCurrentPath] = useState('/');
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [entries, setEntries] = useState<HostEntry[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [opening, setOpening] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selectedFilePath, setSelectedFilePath] = useState('');
  const [editorValue, setEditorValue] = useState('');
  const [initialValue, setInitialValue] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [editorTheme, setEditorTheme] = useState<'vs-dark' | 'light'>('vs-dark');

  const applyListing = useCallback((listing: ListingPayload) => {
    setCurrentPath(listing.currentPath);
    setParentPath(listing.parentPath);
    setEntries(listing.entries);
  }, []);

  const loadPath = useCallback(async (targetPath: string) => {
    setLoading(true);
    setError('');
    setMessage('');

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
        throw new Error(payload.error?.message || 'Unable to browse path.');
      }

      applyListing(payload.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to browse path.');
    } finally {
      setLoading(false);
    }
  }, [applyListing]);

  const openFile = useCallback(async (filePath: string) => {
    setOpening(true);
    setError('');
    setMessage('');

    try {
      const params = new URLSearchParams({ action: 'preview', path: filePath });
      const response = await fetch(
        `/api/private/authorization/root/tools/file-manager?${params.toString()}`,
      );
      const payload = (await response.json()) as {
        ok: boolean;
        data?: PreviewData;
        error?: { message?: string };
      };

      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(payload.error?.message || 'Unable to open file.');
      }

      if (payload.data.kind !== 'text') {
        throw new Error('Only text files can be edited in IDE.');
      }

      const content = payload.data.content || '';
      setSelectedFilePath(filePath);
      setEditorValue(content);
      setInitialValue(content);
      setMessage(payload.data.truncated ? 'Opened truncated preview (512KB).' : 'File opened.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to open file.');
    } finally {
      setOpening(false);
    }
  }, []);

  const saveFile = useCallback(async () => {
    if (!selectedFilePath) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(
        '/api/private/authorization/root/tools/file-manager?action=update-file',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filePath: selectedFilePath,
            content: editorValue,
          }),
        },
      );

      const payload = (await response.json()) as {
        ok: boolean;
        error?: { message?: string };
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error?.message || 'Unable to save file.');
      }

      setInitialValue(editorValue);
      setMessage('File saved.');
      await loadPath(currentPath);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save file.');
    } finally {
      setSaving(false);
    }
  }, [currentPath, editorValue, loadPath, selectedFilePath]);

  const createFile = useCallback(async () => {
    const fileName = newFileName.trim();
    if (!fileName) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(
        '/api/private/authorization/root/tools/file-manager?action=create-file',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            path: currentPath,
            fileName,
            content: '',
          }),
        },
      );

      const payload = (await response.json()) as {
        ok: boolean;
        data?: ListingPayload;
        error?: { message?: string };
      };

      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(payload.error?.message || 'Unable to create file.');
      }

      applyListing(payload.data);
      setNewFileName('');
      const createdPath = `${payload.data.currentPath.replace(/\/$/, '')}/${fileName}`;
      await openFile(createdPath);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to create file.');
    } finally {
      setSaving(false);
    }
  }, [applyListing, currentPath, newFileName, openFile]);

  useEffect(() => {
    void loadPath('/');
  }, [loadPath]);

  const filteredEntries = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return entries;
    return entries.filter((entry) => entry.name.toLowerCase().includes(value));
  }, [entries, query]);

  const pathSegments = useMemo(() => {
    const split = currentPath.split('/').filter(Boolean);
    return split.map((segment, index) => ({
      label: segment,
      value: `/${split.slice(0, index + 1).join('/')}`,
    }));
  }, [currentPath]);

  const language = useMemo(
    () => resolveLanguageFromPath(selectedFilePath),
    [selectedFilePath],
  );

  const dirty = editorValue !== initialValue;

  return (
    <Section
      id='ide'
      className={IDEStyles.IDE}
    >
      <header className={IDEStyles.Topbar}>
        <div className={IDEStyles.Header}>
          <h2 className={IDEStyles.Title}>IDE</h2>
          <p className={IDEStyles.Subtitle}>
            Monaco-powered in-browser code editor with root file-system access.
          </p>
        </div>

        <div className={IDEStyles.StateRow}>
          <span>{selectedFilePath || 'No file selected'}</span>
          <span>Language: {language}</span>
          <span>{dirty ? 'Unsaved changes' : 'Saved'}</span>
        </div>
      </header>

      <div className={IDEStyles.Workspace}>
        <aside className={IDEStyles.Explorer}>
          <h3 className={IDEStyles.PanelTitle}>Explorer</h3>
          <div className={IDEStyles.PanelBody}>
            <div className={IDEStyles.PathBar}>
              <button
                type='button'
                className={IDEStyles.Button}
                onClick={() => void loadPath('/')}
                disabled={loading || opening || saving}
              >
                /
              </button>
              {pathSegments.map((segment) => (
                <button
                  key={segment.value}
                  type='button'
                  className={IDEStyles.Button}
                  onClick={() => void loadPath(segment.value)}
                  disabled={loading || opening || saving}
                >
                  {segment.label}
                </button>
              ))}
            </div>

            <div className={IDEStyles.ActionRow}>
              <button
                type='button'
                className={IDEStyles.Button}
                onClick={() => {
                  if (parentPath) {
                    void loadPath(parentPath);
                  }
                }}
                disabled={!parentPath || loading || opening || saving}
              >
                Go Up
              </button>
              <button
                type='button'
                className={IDEStyles.Button}
                onClick={() => void loadPath(currentPath)}
                disabled={loading || opening || saving}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            <input
              className={IDEStyles.Input}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder='Filter files...'
              aria-label='Filter files'
            />

            <div className={IDEStyles.NewFileRow}>
              <input
                className={IDEStyles.Input}
                value={newFileName}
                onChange={(event) => setNewFileName(event.target.value)}
                placeholder='New file name'
                aria-label='New file name'
              />
              <button
                type='button'
                className={IDEStyles.Button}
                onClick={() => void createFile()}
                disabled={saving || loading || opening}
              >
                New File
              </button>
            </div>

            <div className={IDEStyles.EntryList}>
              {filteredEntries.length === 0 ? (
                <p className={IDEStyles.Empty}>No entries found.</p>
              ) : (
                filteredEntries.map((entry) => (
                  <button
                    key={`${entry.path}-${entry.modifiedAt}`}
                    type='button'
                    className={`${IDEStyles.Entry} ${
                      selectedFilePath === entry.path ? IDEStyles.EntryActive : ''
                    }`}
                    onClick={() => {
                      if (entry.type === 'directory') {
                        void loadPath(entry.path);
                        return;
                      }
                      void openFile(entry.path);
                    }}
                    disabled={opening || loading || saving}
                  >
                    {entry.type === 'directory' ? `📁 ${entry.name}` : `📄 ${entry.name}`}
                  </button>
                ))
              )}
            </div>
          </div>
        </aside>

        <section className={IDEStyles.EditorPanel}>
          <div className={IDEStyles.EditorHeader}>
            <div className={IDEStyles.ActionRow}>
              <button
                type='button'
                className={IDEStyles.Button}
                onClick={() => void saveFile()}
                disabled={!selectedFilePath || saving || opening || !dirty}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                type='button'
                className={IDEStyles.Button}
                onClick={() => setEditorValue(initialValue)}
                disabled={!selectedFilePath || !dirty || saving || opening}
              >
                Revert
              </button>
            </div>

            <select
              className={IDEStyles.Select}
              value={editorTheme}
              onChange={(event) =>
                setEditorTheme(event.target.value as 'vs-dark' | 'light')
              }
              aria-label='Editor theme'
            >
              <option value='vs-dark'>Dark</option>
              <option value='light'>Light</option>
            </select>
          </div>

          {error ? <p className={IDEStyles.Error}>{error}</p> : null}
          {message ? <p className={IDEStyles.Message}>{message}</p> : null}

          <div className={IDEStyles.EditorWrap}>
            <Editor
              language={language}
              theme={editorTheme}
              value={editorValue}
              onChange={(value) => setEditorValue(value ?? '')}
              options={{
                automaticLayout: true,
                minimap: { enabled: true },
                wordWrap: 'on',
                fontSize: 13,
                scrollBeyondLastLine: false,
              }}
            />
          </div>
        </section>
      </div>
    </Section>
  );
}