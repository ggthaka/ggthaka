'use client';

import { Section } from '@components/layout';
import { FileManagerStyles } from '@styles/section';
import Image from 'next/image';
import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

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

type TransferMode = 'copy' | 'move';

interface PendingTransfer {
  mode: TransferMode;
  sourcePath: string;
  sourceName: string;
  destination: string;
}

interface PendingRename {
  entryPath: string;
  currentName: string;
  nextName: string;
}

type DeleteTarget =
  | {
      mode: 'single';
      entryPath: string;
      entryName: string;
      entryType: HostEntry['type'];
    }
  | { mode: 'bulk'; entryPaths: string[] };

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function FileManager() {
  const [currentPath, setCurrentPath] = useState('/');
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [entries, setEntries] = useState<HostEntry[]>([]);
  const [query, setQuery] = useState('');
  const [folderName, setFolderName] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewDraft, setPreviewDraft] = useState('');
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [pendingTransfer, setPendingTransfer] =
    useState<PendingTransfer | null>(null);
  const [pendingRename, setPendingRename] = useState<PendingRename | null>(
    null,
  );
  const [pendingDelete, setPendingDelete] = useState<DeleteTarget | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const transferInputRef = useRef<HTMLInputElement | null>(null);
  const renameInputRef = useRef<HTMLInputElement | null>(null);
  const deleteConfirmRef = useRef<HTMLButtonElement | null>(null);

  const clearActionPanels = (keep?: 'transfer' | 'rename' | 'delete') => {
    if (keep !== 'transfer') {
      setPendingTransfer(null);
    }
    if (keep !== 'rename') {
      setPendingRename(null);
    }
    if (keep !== 'delete') {
      setPendingDelete(null);
    }
  };

  const applyListing = useCallback((listing: ListingPayload) => {
    setCurrentPath(listing.currentPath);
    setParentPath(listing.parentPath);
    setEntries(listing.entries);
  }, []);

  const loadPath = useCallback(
    async (targetPath: string) => {
      setLoading(true);
      setError('');
      setMessage('');
      setPreview(null);
      setPreviewDraft('');
      setSelectedPaths([]);
      setPendingTransfer(null);
      setPendingRename(null);
      setPendingDelete(null);

      try {
        const params = new URLSearchParams({
          action: 'list',
          path: targetPath,
        });
        const response = await fetch(
          `/api/private/authorization/root/tools/file-manager?${params.toString()}`,
        );
        const payload = (await response.json()) as {
          ok: boolean;
          data?: {
            currentPath: string;
            parentPath: string | null;
            entries: HostEntry[];
          };
          error?: { message?: string };
        };

        if (!response.ok || !payload.ok || !payload.data) {
          throw new Error(
            payload.error?.message || 'Unable to browse this path.',
          );
        }

        applyListing(payload.data);
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : 'Unable to access host file system path.',
        );
      } finally {
        setLoading(false);
      }
    },
    [applyListing],
  );

  const runJsonAction = useCallback(
    async (
      method: 'POST' | 'DELETE',
      action: string,
      body: Record<string, string>,
    ) => {
      setMutating(true);
      setError('');
      setMessage('');

      try {
        const response = await fetch(
          `/api/private/authorization/root/tools/file-manager?action=${action}`,
          {
            method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
          },
        );

        const payload = (await response.json()) as {
          ok: boolean;
          data?: ListingPayload;
          error?: { message?: string };
        };

        if (!response.ok || !payload.ok || !payload.data) {
          throw new Error(payload.error?.message || 'Action failed.');
        }

        applyListing(payload.data);
        setMessage('Action completed successfully.');
        return true;
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Action failed.');
        return false;
      } finally {
        setMutating(false);
      }
    },
    [applyListing],
  );

  const createFolder = async () => {
    const value = folderName.trim();
    if (!value) return;
    const ok = await runJsonAction('POST', 'mkdir', {
      path: currentPath,
      folderName: value,
    });
    if (ok) {
      setFolderName('');
    }
  };

  const createFile = async () => {
    const value = fileName.trim();
    if (!value) return;
    const ok = await runJsonAction('POST', 'create-file', {
      path: currentPath,
      fileName: value,
      content: fileContent,
    });
    if (ok) {
      setFileName('');
    }
  };

  const uploadFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setMutating(true);
    setError('');
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('path', currentPath);
      Array.from(files).forEach((file) => formData.append('files', file));

      const response = await fetch(
        '/api/private/authorization/root/tools/file-manager?action=upload',
        {
          method: 'POST',
          body: formData,
        },
      );

      const payload = (await response.json()) as {
        ok: boolean;
        data?: ListingPayload;
        error?: { message?: string };
      };

      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(payload.error?.message || 'Upload failed.');
      }

      applyListing(payload.data);
      setMessage('Files uploaded successfully.');
      clearActionPanels();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Upload failed.');
    } finally {
      setMutating(false);
      event.target.value = '';
    }
  };

  useEffect(() => {
    void loadPath('/');
  }, [loadPath]);

  useEffect(() => {
    if (pendingTransfer) {
      transferInputRef.current?.focus();
      return;
    }

    if (pendingRename) {
      renameInputRef.current?.focus();
      return;
    }

    if (pendingDelete) {
      deleteConfirmRef.current?.focus();
    }
  }, [pendingTransfer, pendingRename, pendingDelete]);

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return entries;
    return entries.filter((entry) => entry.name.toLowerCase().includes(value));
  }, [entries, query]);

  const openEntry = (entry: HostEntry) => {
    if (entry.type === 'directory') {
      void loadPath(entry.path);
      return;
    }

    const params = new URLSearchParams({
      action: 'download',
      path: entry.path,
    });
    window.open(
      `/api/private/authorization/root/tools/file-manager?${params.toString()}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  const segments = useMemo(() => {
    const split = currentPath.split('/').filter(Boolean);
    return split.map((segment, index) => {
      const value = `/${split.slice(0, index + 1).join('/')}`;
      return { label: segment, value };
    });
  }, [currentPath]);

  const startRenameEntry = (entry: HostEntry) => {
    clearActionPanels('rename');
    setPendingRename((current) =>
      current?.entryPath === entry.path
        ? null
        : {
            entryPath: entry.path,
            currentName: entry.name,
            nextName: entry.name,
          },
    );
  };

  const submitRenameEntry = async () => {
    if (!pendingRename) return;

    const nextName = pendingRename.nextName.trim();
    if (!nextName || nextName === pendingRename.currentName) {
      setPendingRename(null);
      return;
    }

    const ok = await runJsonAction('POST', 'rename', {
      entryPath: pendingRename.entryPath,
      newName: nextName,
    });

    if (ok) {
      setPendingRename(null);
    }
  };

  const copyEntry = (entry: HostEntry) => {
    clearActionPanels('transfer');
    setPendingTransfer({
      mode: 'copy',
      sourcePath: entry.path,
      sourceName: entry.name,
      destination: `${entry.name}.copy`,
    });
  };

  const duplicateEntry = async (entry: HostEntry) => {
    await runJsonAction('POST', 'duplicate', {
      sourcePath: entry.path,
      currentPath,
    });
  };

  const moveEntry = (entry: HostEntry) => {
    clearActionPanels('transfer');
    setPendingTransfer({
      mode: 'move',
      sourcePath: entry.path,
      sourceName: entry.name,
      destination: `${entry.name}`,
    });
  };

  const submitTransfer = async () => {
    if (!pendingTransfer) return;
    const destinationValue = pendingTransfer.destination.trim();
    if (!destinationValue) return;

    const destinationPath = destinationValue.startsWith('/')
      ? destinationValue
      : `${currentPath.replace(/\/$/, '')}/${destinationValue}`;

    const ok = await runJsonAction('POST', pendingTransfer.mode, {
      sourcePath: pendingTransfer.sourcePath,
      destinationPath,
      currentPath,
    });

    if (ok) {
      setPendingTransfer(null);
    }
  };

  const previewEntry = async (entry: HostEntry) => {
    if (entry.type !== 'file') {
      setPreview(null);
      return;
    }

    setMutating(true);
    setError('');
    setMessage('');

    try {
      const params = new URLSearchParams({
        action: 'preview',
        path: entry.path,
      });
      const response = await fetch(
        `/api/private/authorization/root/tools/file-manager?${params.toString()}`,
      );
      const payload = (await response.json()) as {
        ok: boolean;
        data?: PreviewData;
        error?: { message?: string };
      };

      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(payload.error?.message || 'Preview failed.');
      }

      setPreview(payload.data);
      setPreviewDraft(
        payload.data.kind === 'text' ? payload.data.content || '' : '',
      );
      setMessage('Preview loaded.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Preview failed.');
      setPreview(null);
    } finally {
      setMutating(false);
    }
  };

  const savePreviewText = async () => {
    if (!preview || preview.kind !== 'text') return;

    await runJsonAction('POST', 'update-file', {
      filePath: preview.path,
      content: previewDraft,
    });
    setMessage('File saved.');
  };

  const toggleSelected = (entryPath: string) => {
    setSelectedPaths((current) =>
      current.includes(entryPath)
        ? current.filter((value) => value !== entryPath)
        : [...current, entryPath],
    );
  };

  const bulkDelete = async (paths: string[]) => {
    if (paths.length === 0) return false;

    setMutating(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(
        '/api/private/authorization/root/tools/file-manager',
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            entryPaths: paths,
            currentPath,
          }),
        },
      );

      const payload = (await response.json()) as {
        ok: boolean;
        data?: ListingPayload;
        error?: { message?: string };
      };

      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(payload.error?.message || 'Bulk delete failed.');
      }

      applyListing(payload.data);
      setSelectedPaths([]);
      setMessage('Selected entries deleted.');
      return true;
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Bulk delete failed.',
      );
      return false;
    } finally {
      setMutating(false);
    }
  };

  const requestBulkDelete = () => {
    if (selectedPaths.length === 0) return;
    clearActionPanels('delete');
    setPendingDelete({ mode: 'bulk', entryPaths: [...selectedPaths] });
  };

  const requestSingleDelete = (entry: HostEntry) => {
    const shouldClose =
      pendingDelete?.mode === 'single' &&
      pendingDelete.entryPath === entry.path;
    if (shouldClose) {
      setPendingDelete(null);
      return;
    }

    clearActionPanels('delete');
    setPendingDelete({
      mode: 'single',
      entryPath: entry.path,
      entryName: entry.name,
      entryType: entry.type,
    });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;

    if (pendingDelete.mode === 'single') {
      const ok = await runJsonAction('DELETE', 'delete', {
        entryPath: pendingDelete.entryPath,
        currentPath,
      });
      if (ok) {
        setPendingDelete(null);
      }
      return;
    }

    const ok = await bulkDelete(pendingDelete.entryPaths);
    if (ok) {
      setPendingDelete(null);
    }
  };

  return (
    <Section
      id='file-manager'
      className={FileManagerStyles.FileManager}
    >
      <header className={FileManagerStyles.Topbar}>
        <div className={FileManagerStyles.Header}>
          <h2 className={FileManagerStyles.Title}>File Manager</h2>
          <p className={FileManagerStyles.Subtitle}>
            Browse the host file system as a root-only server tool.
          </p>
        </div>

        <div className={FileManagerStyles.Stats}>
          <span>Total: {entries.length}</span>
          <span>Visible: {filtered.length}</span>
        </div>
      </header>

      <div className={FileManagerStyles.Workspace}>
        <section className={FileManagerStyles.Controls}>
          <div className={FileManagerStyles.PathCard}>
            <p className={FileManagerStyles.PathLabel}>Current Path</p>
            <p className={FileManagerStyles.PathValue}>{currentPath}</p>
          </div>

          <div className={FileManagerStyles.Breadcrumbs}>
            <button
              type='button'
              className={FileManagerStyles.Button}
              onClick={() => void loadPath('/')}
            >
              /
            </button>
            {segments.map((segment) => (
              <button
                key={segment.value}
                type='button'
                className={FileManagerStyles.Button}
                onClick={() => void loadPath(segment.value)}
              >
                {segment.label}
              </button>
            ))}
          </div>

          <input
            className={FileManagerStyles.Input}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder='Search files by name...'
            aria-label='Search files'
          />

          <div className={FileManagerStyles.InlineGroup}>
            <input
              className={FileManagerStyles.Input}
              value={folderName}
              onChange={(event) => setFolderName(event.target.value)}
              placeholder='New folder name'
              aria-label='New folder name'
            />
            <button
              type='button'
              className={FileManagerStyles.Button}
              onClick={() => void createFolder()}
              disabled={mutating || loading}
            >
              New Folder
            </button>
          </div>

          <div className={FileManagerStyles.FieldGroup}>
            <input
              className={FileManagerStyles.Input}
              value={fileName}
              onChange={(event) => setFileName(event.target.value)}
              placeholder='New file name (e.g. notes.txt)'
              aria-label='New file name'
            />
            <textarea
              className={FileManagerStyles.Textarea}
              value={fileContent}
              onChange={(event) => setFileContent(event.target.value)}
              rows={4}
              placeholder='Optional initial file content'
              aria-label='New file content'
            />
            <button
              type='button'
              className={FileManagerStyles.Button}
              onClick={() => void createFile()}
              disabled={mutating || loading}
            >
              Create File
            </button>
          </div>

          <input
            ref={fileInputRef}
            className={FileManagerStyles.HiddenInput}
            type='file'
            multiple
            onChange={uploadFiles}
            aria-label='Upload files'
          />

          <div className={FileManagerStyles.Actions}>
            <button
              type='button'
              className={FileManagerStyles.Button}
              onClick={() => {
                if (parentPath) {
                  void loadPath(parentPath);
                }
              }}
              disabled={!parentPath || loading}
            >
              Go Up
            </button>
            <button
              type='button'
              className={FileManagerStyles.Button}
              onClick={() => void loadPath(currentPath)}
              disabled={loading || mutating}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              type='button'
              className={FileManagerStyles.Button}
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || mutating}
            >
              Upload Files
            </button>
            <button
              type='button'
              className={FileManagerStyles.Button}
              onClick={requestBulkDelete}
              disabled={loading || mutating || selectedPaths.length === 0}
            >
              Delete Selected ({selectedPaths.length})
            </button>
          </div>

          {pendingDelete?.mode === 'bulk' ? (
            <div className={FileManagerStyles.DeletePanel}>
              <p className={FileManagerStyles.DeleteTitle}>
                Delete {pendingDelete.entryPaths.length} selected entries? This
                action cannot be undone.
              </p>
              <div className={FileManagerStyles.DeleteRow}>
                <button
                  ref={deleteConfirmRef}
                  type='button'
                  className={FileManagerStyles.Button}
                  onClick={() => void confirmDelete()}
                  disabled={loading || mutating}
                >
                  Confirm Delete
                </button>
                <button
                  type='button'
                  className={FileManagerStyles.Button}
                  onClick={() => setPendingDelete(null)}
                  disabled={loading || mutating}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {pendingTransfer ? (
            <div className={FileManagerStyles.TransferPanel}>
              <p className={FileManagerStyles.TransferTitle}>
                {pendingTransfer.mode === 'copy' ? 'Copy' : 'Move'}:{' '}
                {pendingTransfer.sourceName}
              </p>
              <div className={FileManagerStyles.TransferRow}>
                <input
                  ref={transferInputRef}
                  className={FileManagerStyles.Input}
                  value={pendingTransfer.destination}
                  onChange={(event) =>
                    setPendingTransfer((current) =>
                      current
                        ? { ...current, destination: event.target.value }
                        : current,
                    )
                  }
                  placeholder='Destination path (absolute or relative)'
                  aria-label='Transfer destination path'
                />
                <button
                  type='button'
                  className={FileManagerStyles.Button}
                  onClick={() => void submitTransfer()}
                  disabled={loading || mutating}
                >
                  Apply
                </button>
                <button
                  type='button'
                  className={FileManagerStyles.Button}
                  onClick={() => setPendingTransfer(null)}
                  disabled={loading || mutating}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {message ? (
            <p className={FileManagerStyles.Message}>{message}</p>
          ) : null}

          <p className={FileManagerStyles.Note}>
            Click folders to navigate and files to download.
          </p>

          <div className={FileManagerStyles.PreviewPanel}>
            <p className={FileManagerStyles.PreviewTitle}>Preview</p>
            {!preview ? (
              <p className={FileManagerStyles.Empty}>
                Select a file and click Preview.
              </p>
            ) : preview.kind === 'image' && preview.content ? (
              <Image
                src={preview.content}
                alt={preview.name}
                className={FileManagerStyles.PreviewImage}
                width={1200}
                height={800}
                unoptimized
              />
            ) : preview.kind === 'text' ? (
              <>
                <textarea
                  className={FileManagerStyles.PreviewEditor}
                  value={previewDraft}
                  onChange={(event) => setPreviewDraft(event.target.value)}
                  rows={10}
                />
                <button
                  type='button'
                  className={FileManagerStyles.Button}
                  onClick={() => void savePreviewText()}
                  disabled={loading || mutating}
                >
                  Save File
                </button>
              </>
            ) : (
              <p className={FileManagerStyles.Empty}>
                Binary preview not available for this file type.
              </p>
            )}
            {preview?.truncated ? (
              <p className={FileManagerStyles.Note}>
                Preview truncated to 512KB.
              </p>
            ) : null}
          </div>
        </section>

        <section className={FileManagerStyles.ListPanel}>
          <h3 className={FileManagerStyles.PanelTitle}>Files</h3>
          <div className={FileManagerStyles.List}>
            {error ? <p className={FileManagerStyles.Error}>{error}</p> : null}
            {filtered.length === 0 ? (
              <p className={FileManagerStyles.Empty}>
                {loading ? 'Loading entries...' : 'No entries found.'}
              </p>
            ) : (
              filtered.map((entry) => (
                <article
                  key={`${entry.path}-${entry.modifiedAt}`}
                  className={FileManagerStyles.Item}
                >
                  <div className={FileManagerStyles.ItemMeta}>
                    <label className={FileManagerStyles.SelectEntry}>
                      <input
                        type='checkbox'
                        checked={selectedPaths.includes(entry.path)}
                        onChange={() => toggleSelected(entry.path)}
                      />
                      Select
                    </label>
                    <strong>
                      {entry.type === 'directory'
                        ? '📁'
                        : entry.type === 'symlink'
                          ? '🔗'
                          : '📄'}{' '}
                      {entry.name}
                    </strong>
                    <span>
                      {entry.type} • {formatSize(entry.size)} •{' '}
                      {new Date(entry.modifiedAt).toLocaleString()}
                    </span>
                  </div>

                  <div className={FileManagerStyles.ItemActions}>
                    <button
                      type='button'
                      className={FileManagerStyles.Button}
                      onClick={() => openEntry(entry)}
                    >
                      {entry.type === 'directory' ? 'Open' : 'Download'}
                    </button>
                    <button
                      type='button'
                      className={FileManagerStyles.Button}
                      onClick={() => void previewEntry(entry)}
                      disabled={entry.type !== 'file' || mutating || loading}
                    >
                      Preview
                    </button>
                    <button
                      type='button'
                      className={FileManagerStyles.Button}
                      onClick={() => startRenameEntry(entry)}
                      disabled={mutating || loading}
                    >
                      {pendingRename?.entryPath === entry.path
                        ? 'Cancel Rename'
                        : 'Rename'}
                    </button>
                    <button
                      type='button'
                      className={FileManagerStyles.Button}
                      onClick={() => requestSingleDelete(entry)}
                      disabled={mutating || loading}
                    >
                      {pendingDelete?.mode === 'single' &&
                      pendingDelete.entryPath === entry.path
                        ? 'Cancel Delete'
                        : 'Delete'}
                    </button>
                    <button
                      type='button'
                      className={FileManagerStyles.Button}
                      onClick={() => void copyEntry(entry)}
                      disabled={mutating || loading}
                    >
                      Copy
                    </button>
                    <button
                      type='button'
                      className={FileManagerStyles.Button}
                      onClick={() => void moveEntry(entry)}
                      disabled={mutating || loading}
                    >
                      Move
                    </button>
                    <button
                      type='button'
                      className={FileManagerStyles.Button}
                      onClick={() => void duplicateEntry(entry)}
                      disabled={mutating || loading}
                    >
                      Duplicate
                    </button>
                  </div>

                  {pendingRename?.entryPath === entry.path ? (
                    <div className={FileManagerStyles.RenamePanel}>
                      <p className={FileManagerStyles.RenameTitle}>
                        Rename {entry.name}
                      </p>
                      <div className={FileManagerStyles.RenameRow}>
                        <input
                          ref={renameInputRef}
                          className={FileManagerStyles.Input}
                          value={pendingRename.nextName}
                          onChange={(event) =>
                            setPendingRename((current) =>
                              current
                                ? { ...current, nextName: event.target.value }
                                : current,
                            )
                          }
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              void submitRenameEntry();
                            }
                          }}
                          placeholder='Enter new file or folder name'
                          aria-label={`Rename ${entry.name}`}
                        />
                        <button
                          type='button'
                          className={FileManagerStyles.Button}
                          onClick={() => void submitRenameEntry()}
                          disabled={loading || mutating}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {pendingDelete?.mode === 'single' &&
                  pendingDelete.entryPath === entry.path ? (
                    <div className={FileManagerStyles.DeletePanel}>
                      <p className={FileManagerStyles.DeleteTitle}>
                        Delete {pendingDelete.entryType}{' '}
                        {pendingDelete.entryName}? This action cannot be undone.
                      </p>
                      <div className={FileManagerStyles.DeleteRow}>
                        <button
                          ref={deleteConfirmRef}
                          type='button'
                          className={FileManagerStyles.Button}
                          onClick={() => void confirmDelete()}
                          disabled={loading || mutating}
                        >
                          Confirm Delete
                        </button>
                        <button
                          type='button'
                          className={FileManagerStyles.Button}
                          onClick={() => setPendingDelete(null)}
                          disabled={loading || mutating}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </Section>
  );
}
