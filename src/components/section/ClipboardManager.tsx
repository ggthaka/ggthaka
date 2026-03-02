'use client';

import { Section } from '@components/layout';
import { ClipboardManagerStyles } from '@styles/section';
import { KeyboardEvent, useEffect, useMemo, useState } from 'react';

interface ClipItem {
  id: string;
  value: string;
  pinned: boolean;
  createdAt: number;
}

const STORAGE_KEY = 'tool-clipboard-manager-items';

const readInitialItems = (): ClipItem[] => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ClipItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function ClipboardManager() {
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<ClipItem[]>(() => readInitialItems());
  const [feedbackMessage, setFeedbackMessage] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...items].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.createdAt - a.createdAt;
    });

    if (!q) return sorted;
    return sorted.filter((item) => item.value.toLowerCase().includes(q));
  }, [items, query]);

  const pinnedCount = useMemo(
    () => items.filter((item) => item.pinned).length,
    [items],
  );

  const draftLength = draft.trim().length;
  const canAdd = draftLength > 0;

  const addItem = () => {
    const value = draft.trim();
    if (!value) return;

    const next: ClipItem = {
      id: crypto.randomUUID(),
      value,
      pinned: false,
      createdAt: Date.now(),
    };

    setItems((current) => [next, ...current].slice(0, 120));
    setDraft('');
    setFeedbackMessage('Item added.');
  };

  const copyItem = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setFeedbackMessage('Copied to clipboard.');
    } catch {
      setFeedbackMessage('Copy failed.');
    }

    window.setTimeout(() => setFeedbackMessage(''), 1100);
  };

  const pasteFromClipboard = async () => {
    try {
      const value = await navigator.clipboard.readText();
      if (!value.trim()) {
        setFeedbackMessage('Clipboard is empty.');
        return;
      }
      setDraft(value);
      setFeedbackMessage('Clipboard loaded into draft.');
    } catch {
      setFeedbackMessage('Unable to read clipboard.');
    }

    window.setTimeout(() => setFeedbackMessage(''), 1400);
  };

  const removeItem = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const togglePin = (id: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, pinned: !item.pinned } : item,
      ),
    );
  };

  const clearDraft = () => {
    setDraft('');
    setFeedbackMessage('Draft cleared.');
    window.setTimeout(() => setFeedbackMessage(''), 900);
  };

  const clearAll = () => {
    if (items.length === 0) return;

    if (!window.confirm('Delete all saved clips?')) return;
    setItems([]);
    setFeedbackMessage('All clips deleted.');
    window.setTimeout(() => setFeedbackMessage(''), 1200);
  };

  const handleDraftKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      addItem();
    }
  };

  return (
    <Section
      id='clipboard-manager'
      className={ClipboardManagerStyles.ClipboardManager}
    >
      <header className={ClipboardManagerStyles.Topbar}>
        <div className={ClipboardManagerStyles.Header}>
          <h2 className={ClipboardManagerStyles.Title}>Clipboard Manager</h2>
          <p className={ClipboardManagerStyles.Subtitle}>
            Save, pin, search, and reuse snippets across your admin tools.
          </p>
        </div>

        <div className={ClipboardManagerStyles.Stats}>
          <span>Total: {items.length}</span>
          <span>Pinned: {pinnedCount}</span>
          <span>Visible: {filtered.length}</span>
        </div>
      </header>

      <div className={ClipboardManagerStyles.Workspace}>
        <section className={ClipboardManagerStyles.Controls}>
          <div className={ClipboardManagerStyles.ControlHeader}>
            <h3 className={ClipboardManagerStyles.PanelTitle}>New Clip</h3>
            <p className={ClipboardManagerStyles.PanelDescription}>
              Type or paste content and press Ctrl/Cmd + Enter to save quickly.
            </p>
          </div>

          <label
            className={ClipboardManagerStyles.Label}
            htmlFor='clipboard-draft'
          >
            Clipboard draft
          </label>
          <textarea
            id='clipboard-draft'
            className={ClipboardManagerStyles.Textarea}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleDraftKeyDown}
            placeholder='Paste or type clipboard content...'
            rows={8}
            aria-label='Clipboard draft'
          />

          <div className={ClipboardManagerStyles.HelperRow}>
            <span>{draftLength} characters</span>
            <span>Max saved clips: 120</span>
          </div>

          <div className={ClipboardManagerStyles.Actions}>
            <button
              className={ClipboardManagerStyles.Button}
              type='button'
              onClick={addItem}
              disabled={!canAdd}
            >
              Add Item
            </button>
            <button
              className={ClipboardManagerStyles.Button}
              type='button'
              onClick={pasteFromClipboard}
            >
              Paste from Clipboard
            </button>
            <button
              className={ClipboardManagerStyles.Button}
              type='button'
              onClick={clearDraft}
              disabled={draft.length === 0}
            >
              Clear Draft
            </button>
          </div>

          <label
            className={ClipboardManagerStyles.Label}
            htmlFor='clipboard-query'
          >
            Search clips
          </label>
          <input
            id='clipboard-query'
            className={ClipboardManagerStyles.Search}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder='Search saved clips...'
            aria-label='Search clips'
          />

          {feedbackMessage && (
            <span
              className={ClipboardManagerStyles.Message}
              aria-live='polite'
            >
              {feedbackMessage}
            </span>
          )}

          <button
            className={ClipboardManagerStyles.Button}
            type='button'
            onClick={clearAll}
            disabled={items.length === 0}
          >
            Delete All Clips
          </button>
        </section>

        <section className={ClipboardManagerStyles.ListPanel}>
          <div className={ClipboardManagerStyles.ListHeader}>
            <span>Saved Clips</span>
            <span>{filtered.length} shown</span>
          </div>

          <div className={ClipboardManagerStyles.List}>
            {filtered.length === 0 && (
              <p className={ClipboardManagerStyles.Empty}>
                No clips found. Save a new clip or adjust your search.
              </p>
            )}

            {filtered.map((item) => (
              <article
                key={item.id}
                className={ClipboardManagerStyles.Item}
              >
                <div className={ClipboardManagerStyles.ItemMeta}>
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                  <span>{item.value.length} chars</span>
                  {item.pinned && <span>Pinned</span>}
                </div>
                <pre className={ClipboardManagerStyles.ItemValue}>
                  {item.value}
                </pre>
                <div className={ClipboardManagerStyles.ItemActions}>
                  <button
                    className={ClipboardManagerStyles.Button}
                    type='button'
                    onClick={() => copyItem(item.value)}
                  >
                    Copy
                  </button>
                  <button
                    className={ClipboardManagerStyles.Button}
                    type='button'
                    onClick={() => togglePin(item.id)}
                  >
                    {item.pinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button
                    className={ClipboardManagerStyles.Button}
                    type='button'
                    onClick={() => removeItem(item.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </Section>
  );
}
