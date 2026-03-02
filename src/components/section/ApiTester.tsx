'use client';

import { Section } from '@components/layout';
import { ApiTesterStyles } from '@styles/section';
import {
    ChangeEvent,
    KeyboardEvent,
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';
type AuthType = 'none' | 'basic' | 'apikey' | 'bearer';
type ApiKeyPlacement = 'header' | 'query';
type BodyMode = 'json' | 'multipart';

interface KeyValuePair {
  id: string;
  key: string;
  value: string;
}

interface AuthState {
  type: AuthType;
  basicUsername: string;
  basicPassword: string;
  bearerToken: string;
  apiKeyName: string;
  apiKeyValue: string;
  apiKeyPlacement: ApiKeyPlacement;
}

interface RequestTemplate {
  method: Method;
  url: string;
  headers: string;
  body: string;
  bodyMode: BodyMode;
  queryParams: KeyValuePair[];
  auth: AuthState;
  multipartFields: KeyValuePair[];
}

interface SavedPreset extends RequestTemplate {
  id: string;
  name: string;
  updatedAt: string;
}

interface RequestHistoryEntry extends RequestTemplate {
  id: string;
  createdAt: string;
}

interface JsonEditorProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  helpText: string;
  error?: string;
  rows?: number;
}

interface KeyValueEditorProps {
  idPrefix: string;
  label: string;
  rows: KeyValuePair[];
  onChange: (rows: KeyValuePair[]) => void;
  addLabel: string;
  keyPlaceholder: string;
  valuePlaceholder: string;
  helpText?: string;
}

const PRESET_STORAGE_KEY = 'tool-api-tester-presets-v2';
const HISTORY_STORAGE_KEY = 'tool-api-tester-history-v2';
const MAX_HISTORY = 10;
const MAX_PRESETS = 40;
const RESPONSE_PREVIEW_LIMIT = 12000;

const methods: Method[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
const bodyMethods: Method[] = ['POST', 'PUT', 'PATCH'];

const createKeyValue = (): KeyValuePair => ({
  id: crypto.randomUUID(),
  key: '',
  value: '',
});

const defaultAuthState = (): AuthState => ({
  type: 'none',
  basicUsername: '',
  basicPassword: '',
  bearerToken: '',
  apiKeyName: '',
  apiKeyValue: '',
  apiKeyPlacement: 'header',
});

const supportsBody = (method: Method): boolean => bodyMethods.includes(method);

const readStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const toRequestHeaders = (value: string): Record<string, string> | null => {
  const text = value.trim();
  if (!text) return {};

  try {
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }

    return Object.fromEntries(
      Object.entries(parsed).map(([key, current]) => [key, String(current)]),
    );
  } catch {
    return null;
  }
};

const buildUrlWithQuery = (
  baseUrl: string,
  queryRows: KeyValuePair[],
): string | null => {
  const target = baseUrl.trim();
  if (!target) return null;

  try {
    const parsed = new URL(target);
    queryRows.forEach(({ key, value }) => {
      const nextKey = key.trim();
      if (!nextKey) return;
      parsed.searchParams.set(nextKey, value);
    });
    return parsed.toString();
  } catch {
    return null;
  }
};

const safeDisplayText = (value: string): string => value.replace(/\u0000/g, '');

const JsonEditor = memo(function JsonEditor({
  id,
  label,
  value,
  onChange,
  helpText,
  error,
  rows = 6,
}: JsonEditorProps) {
  return (
    <div className={ApiTesterStyles.FieldGroup}>
      <label
        className={ApiTesterStyles.Label}
        htmlFor={id}
      >
        {label}
      </label>
      <p
        id={`${id}-help`}
        className={ApiTesterStyles.HelpText}
      >
        {helpText}
      </p>
      <textarea
        id={id}
        className={`${ApiTesterStyles.Textarea} ${
          error ? ApiTesterStyles.InputError : ''
        }`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        spellCheck={false}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-help ${id}-error` : `${id}-help`}
      />
      {error ? (
        <p
          id={`${id}-error`}
          className={ApiTesterStyles.ErrorText}
          role='alert'
        >
          {error}
        </p>
      ) : null}
      <div className={ApiTesterStyles.SyntaxBlock}>
        <span className={ApiTesterStyles.SyntaxLabel}>Preview</span>
        <SyntaxHighlighter
          className={ApiTesterStyles.SyntaxBlock}
          language='json'
          style={atomDark}
          customStyle={{ margin: 0, borderRadius: 10, fontSize: 12 }}
          codeTagProps={{
            style: {
              color: '#abb2bf',
            },
          }}
          wrapLongLines
        >
          {value.trim() || '{}'}
        </SyntaxHighlighter>
      </div>
    </div>
  );
});

const KeyValueEditor = memo(function KeyValueEditor({
  idPrefix,
  label,
  rows,
  onChange,
  addLabel,
  keyPlaceholder,
  valuePlaceholder,
  helpText,
}: KeyValueEditorProps) {
  const updateRow = useCallback(
    (id: string, patch: Partial<KeyValuePair>) => {
      onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
    },
    [onChange, rows],
  );

  const addRow = useCallback(() => {
    onChange([...rows, createKeyValue()]);
  }, [onChange, rows]);

  const deleteRow = useCallback(
    (id: string) => {
      const next = rows.filter((row) => row.id !== id);
      onChange(next.length > 0 ? next : [createKeyValue()]);
    },
    [onChange, rows],
  );

  return (
    <div className={ApiTesterStyles.FieldGroup}>
      <div className={ApiTesterStyles.LabelRow}>
        <span className={ApiTesterStyles.Label}>{label}</span>
        <button
          type='button'
          className={ApiTesterStyles.GhostButton}
          onClick={addRow}
          aria-label={addLabel}
        >
          + Add
        </button>
      </div>
      {helpText ? <p className={ApiTesterStyles.HelpText}>{helpText}</p> : null}
      <div className={ApiTesterStyles.KeyValueList}>
        {rows.map((row, index) => (
          <div
            key={row.id}
            className={ApiTesterStyles.KeyValueRow}
          >
            <input
              className={ApiTesterStyles.Input}
              value={row.key}
              onChange={(event) =>
                updateRow(row.id, { key: event.target.value })
              }
              placeholder={keyPlaceholder}
              aria-label={`${label} key ${index + 1}`}
              id={`${idPrefix}-key-${row.id}`}
            />
            <input
              className={ApiTesterStyles.Input}
              value={row.value}
              onChange={(event) =>
                updateRow(row.id, { value: event.target.value })
              }
              placeholder={valuePlaceholder}
              aria-label={`${label} value ${index + 1}`}
              id={`${idPrefix}-value-${row.id}`}
            />
            <button
              type='button'
              className={ApiTesterStyles.GhostButton}
              onClick={() => deleteRow(row.id)}
              aria-label={`Remove ${label} ${index + 1}`}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
});

export default function ApiTester() {
  const [method, setMethod] = useState<Method>('GET');
  const [url, setUrl] = useState(
    'https://jsonplaceholder.typicode.com/posts/1',
  );
  const [headers, setHeaders] = useState(
    '{\n  "Content-Type": "application/json"\n}',
  );
  const [body, setBody] = useState(
    '{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}',
  );
  const [bodyMode, setBodyMode] = useState<BodyMode>('json');
  const [queryParams, setQueryParams] = useState<KeyValuePair[]>([
    createKeyValue(),
  ]);
  const [multipartFields, setMultipartFields] = useState<KeyValuePair[]>([
    createKeyValue(),
  ]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [auth, setAuth] = useState<AuthState>(() => defaultAuthState());
  const [showAuth, setShowAuth] = useState(false);

  const [history, setHistory] = useState<RequestHistoryEntry[]>(() =>
    readStorage<RequestHistoryEntry[]>(HISTORY_STORAGE_KEY, []),
  );
  const [presets, setPresets] = useState<SavedPreset[]>(() =>
    readStorage<SavedPreset[]>(PRESET_STORAGE_KEY, []),
  );
  const [presetName, setPresetName] = useState('');
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);

  const [responseStatus, setResponseStatus] = useState('Idle');
  const [responseText, setResponseText] = useState('No response yet.');
  const [responseRawText, setResponseRawText] = useState('No response yet.');
  const [responseIsJson, setResponseIsJson] = useState(false);
  const [responseIsOk, setResponseIsOk] = useState(true);
  const [responseDuration, setResponseDuration] = useState<number | null>(null);
  const [responseError, setResponseError] = useState<string | null>(null);
  const [showPretty, setShowPretty] = useState(true);
  const [showFullResponse, setShowFullResponse] = useState(false);

  const [headersError, setHeadersError] = useState('');
  const [bodyError, setBodyError] = useState('');
  const [urlError, setUrlError] = useState('');
  const [globalMessage, setGlobalMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [curlPreview, setCurlPreview] = useState('');

  const responseTitleRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
  }, [presets]);

  useEffect(() => {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const requestTemplate = useMemo<RequestTemplate>(
    () => ({
      method,
      url,
      headers,
      body,
      bodyMode,
      queryParams,
      auth,
      multipartFields,
    }),
    [auth, body, bodyMode, headers, method, multipartFields, queryParams, url],
  );

  const previewUrl = useMemo(
    () => buildUrlWithQuery(url, queryParams) ?? url,
    [queryParams, url],
  );

  const applyTemplate = useCallback((template: RequestTemplate) => {
    setMethod(template.method);
    setUrl(template.url);
    setHeaders(template.headers);
    setBody(template.body);
    setBodyMode(template.bodyMode);
    setQueryParams(
      template.queryParams.length > 0
        ? template.queryParams
        : [createKeyValue()],
    );
    setMultipartFields(
      template.multipartFields.length > 0
        ? template.multipartFields
        : [createKeyValue()],
    );
    setAuth(template.auth);
    setUploadFile(null);
  }, []);

  const appendHistory = useCallback((template: RequestTemplate) => {
    const entry: RequestHistoryEntry = {
      id: crypto.randomUUID(),
      ...template,
      createdAt: new Date().toISOString(),
    };
    setHistory((current) => [entry, ...current].slice(0, MAX_HISTORY));
  }, []);

  const buildFinalRequest = useCallback(() => {
    setHeadersError('');
    setBodyError('');
    setUrlError('');
    setGlobalMessage('');

    const nextUrl = buildUrlWithQuery(url, queryParams);
    if (!nextUrl) {
      setUrlError(
        'Please enter a valid absolute URL (e.g. https://api.example.com).',
      );
      return null;
    }

    const parsedHeaders = toRequestHeaders(headers);
    if (!parsedHeaders) {
      setHeadersError(
        'Headers must be a valid JSON object, for example {"X-Key":"value"}.',
      );
      return null;
    }

    const finalHeaders: Record<string, string> = { ...parsedHeaders };
    let finalUrl = nextUrl;
    let finalBody: BodyInit | undefined;

    if (auth.type === 'basic') {
      const token = `${auth.basicUsername}:${auth.basicPassword}`;
      finalHeaders.Authorization = `Basic ${window.btoa(token)}`;
    }

    if (auth.type === 'bearer' && auth.bearerToken.trim()) {
      finalHeaders.Authorization = `Bearer ${auth.bearerToken.trim()}`;
    }

    if (
      auth.type === 'apikey' &&
      auth.apiKeyName.trim() &&
      auth.apiKeyValue.trim()
    ) {
      if (auth.apiKeyPlacement === 'header') {
        finalHeaders[auth.apiKeyName.trim()] = auth.apiKeyValue.trim();
      } else {
        const parsed = new URL(finalUrl);
        parsed.searchParams.set(
          auth.apiKeyName.trim(),
          auth.apiKeyValue.trim(),
        );
        finalUrl = parsed.toString();
      }
    }

    const canSendBody = supportsBody(method);
    if (canSendBody) {
      if (bodyMode === 'json') {
        if (body.trim()) {
          try {
            const parsed = JSON.parse(body);
            finalBody = JSON.stringify(parsed);
          } catch {
            setBodyError('Body must be valid JSON for JSON mode.');
            return null;
          }
        }
      } else {
        const formData = new FormData();
        multipartFields.forEach(({ key, value }) => {
          if (!key.trim()) return;
          formData.append(key.trim(), value);
        });
        if (uploadFile) {
          formData.append('file', uploadFile, uploadFile.name);
        }
        finalBody = formData;
        if (finalHeaders['Content-Type']) {
          delete finalHeaders['Content-Type'];
        }
      }
    }

    return {
      finalUrl,
      finalHeaders,
      finalBody,
      canSendBody,
    };
  }, [
    auth,
    body,
    bodyMode,
    headers,
    method,
    multipartFields,
    queryParams,
    uploadFile,
    url,
  ]);

  const generateCurl = useCallback(() => {
    const built = buildFinalRequest();
    if (!built) return;

    const parts: string[] = ['curl', '-X', method, `'${built.finalUrl}'`];
    Object.entries(built.finalHeaders).forEach(([key, value]) => {
      parts.push('-H', `'${key}: ${value.replaceAll("'", "'\\''")}'`);
    });

    if (built.canSendBody && bodyMode === 'json' && body.trim()) {
      parts.push('--data-raw', `'${body.replaceAll("'", "'\\''")}'`);
    }

    if (built.canSendBody && bodyMode === 'multipart') {
      multipartFields.forEach(({ key, value }) => {
        if (!key.trim()) return;
        parts.push(
          '--form',
          `'${key.trim()}=${value.replaceAll("'", "'\\''")}'`,
        );
      });
      if (uploadFile) {
        parts.push(
          '--form',
          `'file=@${uploadFile.name.replaceAll("'", "'\\''")}'`,
        );
      }
    }

    setCurlPreview(parts.join(' '));
  }, [body, bodyMode, buildFinalRequest, method, multipartFields, uploadFile]);

  const runRequest = useCallback(async () => {
    const built = buildFinalRequest();
    if (!built) return;

    setLoading(true);
    setResponseStatus('Sending...');
    setResponseError(null);
    setShowFullResponse(false);

    try {
      const startedAt = performance.now();
      const response = await fetch(built.finalUrl, {
        method,
        headers: built.finalHeaders,
        body: built.canSendBody ? built.finalBody : undefined,
      });
      const elapsed = Math.round(performance.now() - startedAt);
      const contentType = response.headers.get('content-type') || '';
      const rawText = await response.text();

      let isJson = false;
      let formattedText = safeDisplayText(rawText);
      if (contentType.includes('application/json')) {
        try {
          const parsed = rawText ? (JSON.parse(rawText) as unknown) : {};
          formattedText = JSON.stringify(parsed, null, 2);
          isJson = true;
        } catch {
          isJson = false;
        }
      }

      const status = `${response.status} ${response.statusText}`;
      setResponseStatus(status);
      setResponseDuration(elapsed);
      setResponseIsJson(isJson);
      setResponseRawText(safeDisplayText(rawText || '(empty response)'));
      setResponseText(formattedText || '(empty response)');
      setResponseIsOk(response.ok);

      if (!response.ok) {
        setResponseError('Request completed with a non-success status.');
      }

      appendHistory(requestTemplate);
      responseTitleRef.current?.focus();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Request failed unexpectedly. Check URL or CORS configuration.';
      setResponseStatus('Request Failed');
      setResponseDuration(null);
      setResponseIsJson(false);
      setResponseIsOk(false);
      setResponseError(message);
      setResponseText(message);
      setResponseRawText(message);
      appendHistory(requestTemplate);
      responseTitleRef.current?.focus();
    } finally {
      setLoading(false);
    }
  }, [appendHistory, buildFinalRequest, method, requestTemplate]);

  const savePreset = useCallback(() => {
    const finalName = presetName.trim() || `${method} preset`;
    const now = new Date().toISOString();

    if (editingPresetId) {
      setPresets((current) =>
        current.map((item) =>
          item.id === editingPresetId
            ? {
                ...item,
                ...requestTemplate,
                name: finalName,
                updatedAt: now,
              }
            : item,
        ),
      );
      setGlobalMessage('Preset updated.');
      return;
    }

    const next: SavedPreset = {
      id: crypto.randomUUID(),
      name: finalName,
      ...requestTemplate,
      updatedAt: now,
    };

    setPresets((current) => [next, ...current].slice(0, MAX_PRESETS));
    setEditingPresetId(next.id);
    setGlobalMessage('Preset saved.');
  }, [editingPresetId, method, presetName, requestTemplate]);

  const loadPreset = useCallback(
    (preset: SavedPreset) => {
      applyTemplate(preset);
      setPresetName(preset.name);
      setEditingPresetId(preset.id);
      setGlobalMessage(`Loaded preset: ${preset.name}`);
    },
    [applyTemplate],
  );

  const clearPresetEditor = useCallback(() => {
    setEditingPresetId(null);
    setPresetName('');
  }, []);

  const deletePreset = useCallback((id: string) => {
    setPresets((current) => current.filter((preset) => preset.id !== id));
    setGlobalMessage('Preset deleted.');
    setEditingPresetId((current) => (current === id ? null : current));
  }, []);

  const replayHistory = useCallback(
    (entry: RequestHistoryEntry) => {
      applyTemplate(entry);
      setGlobalMessage('History item loaded.');
    },
    [applyTemplate],
  );

  const copyResponse = useCallback(async () => {
    const value = showPretty ? responseText : responseRawText;
    try {
      await navigator.clipboard.writeText(value);
      setGlobalMessage('Response copied to clipboard.');
    } catch {
      setGlobalMessage('Clipboard copy failed.');
    }
  }, [responseRawText, responseText, showPretty]);

  const downloadResponse = useCallback(() => {
    const payload = showPretty ? responseText : responseRawText;
    const mimeType = responseIsJson ? 'application/json' : 'text/plain';
    const blob = new Blob([payload], { type: mimeType });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = responseIsJson ? 'response.json' : 'response.txt';
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }, [responseIsJson, responseRawText, responseText, showPretty]);

  const onFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setUploadFile(selected);
  }, []);

  const visibleResponse = useMemo(() => {
    const source = showPretty ? responseText : responseRawText;
    if (showFullResponse || source.length <= RESPONSE_PREVIEW_LIMIT) {
      return source;
    }
    return `${source.slice(0, RESPONSE_PREVIEW_LIMIT)}\n\n... output truncated ...`;
  }, [responseRawText, responseText, showFullResponse, showPretty]);

  const requestCanHaveBody = supportsBody(method);

  const handleUrlKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      void runRequest();
    }
  };

  return (
    <Section
      id='api-tester'
      className={ApiTesterStyles.ApiTester}
    >
      <header className={ApiTesterStyles.Topbar}>
        <div className={ApiTesterStyles.Header}>
          <h2 className={ApiTesterStyles.Title}>API Tester</h2>
          <p className={ApiTesterStyles.Subtitle}>
            Compose requests, test auth, and inspect API responses.
          </p>
        </div>
        <div className={ApiTesterStyles.StatusBlock}>
          <span className={ApiTesterStyles.StatusBadge}>
            Status: {responseStatus}
          </span>
          {responseDuration !== null ? (
            <span className={ApiTesterStyles.StatusMeta}>
              {responseDuration} ms
            </span>
          ) : null}
        </div>
      </header>

      <p
        className={ApiTesterStyles.Warning}
        role='status'
      >
        Avoid sending secrets or credentials to untrusted APIs.
      </p>

      {globalMessage ? (
        <p
          className={ApiTesterStyles.Message}
          role='status'
        >
          {globalMessage}
        </p>
      ) : null}

      <div className={ApiTesterStyles.Workspace}>
        <section className={ApiTesterStyles.RequestPanel}>
          <div className={ApiTesterStyles.Composer}>
            <div className={ApiTesterStyles.Row}>
              <div className={ApiTesterStyles.FieldGroup}>
                <label
                  className={ApiTesterStyles.Label}
                  htmlFor='api-method'
                >
                  Method
                </label>
                <select
                  id='api-method'
                  className={ApiTesterStyles.Select}
                  value={method}
                  onChange={(event) => setMethod(event.target.value as Method)}
                  aria-label='HTTP method'
                >
                  {methods.map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div
                className={`${ApiTesterStyles.FieldGroup} ${ApiTesterStyles.UrlGroup}`}
              >
                <label
                  className={ApiTesterStyles.Label}
                  htmlFor='api-url'
                >
                  URL
                </label>
                <input
                  id='api-url'
                  className={`${ApiTesterStyles.Input} ${
                    urlError ? ApiTesterStyles.InputError : ''
                  }`}
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder='https://example.com/api'
                  aria-label='Request URL'
                  aria-invalid={Boolean(urlError)}
                  onKeyDown={handleUrlKeyDown}
                />
                <p className={ApiTesterStyles.HelpText}>
                  Press Ctrl/Cmd + Enter to send quickly.
                </p>
                {urlError ? (
                  <p className={ApiTesterStyles.ErrorText}>{urlError}</p>
                ) : null}
              </div>
            </div>

            <KeyValueEditor
              idPrefix='api-query'
              label='Query Parameters'
              rows={queryParams}
              onChange={setQueryParams}
              addLabel='Add query parameter'
              keyPlaceholder='param'
              valuePlaceholder='value'
              helpText='Key-value entries are appended to the URL automatically.'
            />
            <p className={ApiTesterStyles.PreviewUrl}>
              Final URL: {previewUrl}
            </p>

            <JsonEditor
              id='api-headers'
              label='Headers JSON'
              value={headers}
              onChange={setHeaders}
              helpText='Enter JSON as {"header":"value"}.'
              error={headersError}
              rows={5}
            />

            <details
              className={ApiTesterStyles.Accordion}
              open={showAuth}
              onToggle={(event) =>
                setShowAuth((event.target as HTMLDetailsElement).open)
              }
            >
              <summary className={ApiTesterStyles.AccordionSummary}>
                Authentication
              </summary>
              <div className={ApiTesterStyles.AccordionContent}>
                <div className={ApiTesterStyles.FieldGroup}>
                  <label
                    className={ApiTesterStyles.Label}
                    htmlFor='api-auth-type'
                  >
                    Type
                  </label>
                  <select
                    id='api-auth-type'
                    className={ApiTesterStyles.Select}
                    value={auth.type}
                    onChange={(event) =>
                      setAuth((current) => ({
                        ...current,
                        type: event.target.value as AuthType,
                      }))
                    }
                  >
                    <option value='none'>None</option>
                    <option value='basic'>Basic</option>
                    <option value='apikey'>API Key</option>
                    <option value='bearer'>Bearer Token</option>
                  </select>
                </div>

                {auth.type === 'basic' ? (
                  <div className={ApiTesterStyles.Row}>
                    <input
                      className={ApiTesterStyles.Input}
                      value={auth.basicUsername}
                      onChange={(event) =>
                        setAuth((current) => ({
                          ...current,
                          basicUsername: event.target.value,
                        }))
                      }
                      placeholder='Username'
                      aria-label='Basic auth username'
                      autoComplete='username'
                    />
                    <input
                      className={ApiTesterStyles.Input}
                      value={auth.basicPassword}
                      onChange={(event) =>
                        setAuth((current) => ({
                          ...current,
                          basicPassword: event.target.value,
                        }))
                      }
                      placeholder='Password'
                      aria-label='Basic auth password'
                      autoComplete='current-password'
                      type='password'
                    />
                  </div>
                ) : null}

                {auth.type === 'bearer' ? (
                  <input
                    className={ApiTesterStyles.Input}
                    value={auth.bearerToken}
                    onChange={(event) =>
                      setAuth((current) => ({
                        ...current,
                        bearerToken: event.target.value,
                      }))
                    }
                    placeholder='Bearer token'
                    aria-label='Bearer token'
                  />
                ) : null}

                {auth.type === 'apikey' ? (
                  <div className={ApiTesterStyles.GridThree}>
                    <input
                      className={ApiTesterStyles.Input}
                      value={auth.apiKeyName}
                      onChange={(event) =>
                        setAuth((current) => ({
                          ...current,
                          apiKeyName: event.target.value,
                        }))
                      }
                      placeholder='Key name (e.g. X-API-Key)'
                      aria-label='API key name'
                    />
                    <input
                      className={ApiTesterStyles.Input}
                      value={auth.apiKeyValue}
                      onChange={(event) =>
                        setAuth((current) => ({
                          ...current,
                          apiKeyValue: event.target.value,
                        }))
                      }
                      placeholder='Key value'
                      aria-label='API key value'
                    />
                    <select
                      className={ApiTesterStyles.Select}
                      value={auth.apiKeyPlacement}
                      onChange={(event) =>
                        setAuth((current) => ({
                          ...current,
                          apiKeyPlacement: event.target
                            .value as ApiKeyPlacement,
                        }))
                      }
                      aria-label='API key placement'
                    >
                      <option value='header'>Header</option>
                      <option value='query'>Query</option>
                    </select>
                  </div>
                ) : null}
              </div>
            </details>

            {requestCanHaveBody ? (
              <div className={ApiTesterStyles.FieldGroup}>
                <div className={ApiTesterStyles.LabelRow}>
                  <label
                    className={ApiTesterStyles.Label}
                    htmlFor='api-body-mode'
                  >
                    Body
                  </label>
                  <select
                    id='api-body-mode'
                    className={ApiTesterStyles.SelectCompact}
                    value={bodyMode}
                    onChange={(event) =>
                      setBodyMode(event.target.value as BodyMode)
                    }
                    aria-label='Body mode'
                  >
                    <option value='json'>JSON</option>
                    <option value='multipart'>Multipart</option>
                  </select>
                </div>

                {bodyMode === 'json' ? (
                  <JsonEditor
                    id='api-body'
                    label='Request Body JSON'
                    value={body}
                    onChange={setBody}
                    helpText='Used for POST, PUT, PATCH. Must be valid JSON.'
                    error={bodyError}
                    rows={8}
                  />
                ) : (
                  <>
                    <KeyValueEditor
                      idPrefix='api-multipart'
                      label='Multipart Fields'
                      rows={multipartFields}
                      onChange={setMultipartFields}
                      addLabel='Add multipart field'
                      keyPlaceholder='field'
                      valuePlaceholder='value'
                    />
                    <div className={ApiTesterStyles.FieldGroup}>
                      <label
                        className={ApiTesterStyles.Label}
                        htmlFor='api-file-upload'
                      >
                        File Upload
                      </label>
                      <input
                        id='api-file-upload'
                        className={ApiTesterStyles.Input}
                        type='file'
                        onChange={onFileChange}
                        aria-label='Attach file for multipart request'
                      />
                      <p className={ApiTesterStyles.HelpText}>
                        File is sent with field name <strong>file</strong>.
                      </p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className={ApiTesterStyles.HelpText}>
                Body is disabled for {method} requests.
              </p>
            )}

            <div className={ApiTesterStyles.Actions}>
              <button
                type='button'
                className={ApiTesterStyles.Button}
                onClick={() => void runRequest()}
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? (
                  <span className={ApiTesterStyles.ButtonWithSpinner}>
                    <span
                      className={ApiTesterStyles.Spinner}
                      aria-hidden='true'
                    />
                    Sending...
                  </span>
                ) : (
                  'Send Request'
                )}
              </button>

              <button
                type='button'
                className={ApiTesterStyles.Button}
                onClick={savePreset}
              >
                {editingPresetId ? 'Update Preset' : 'Save Preset'}
              </button>

              <button
                type='button'
                className={ApiTesterStyles.Button}
                onClick={generateCurl}
              >
                Export cURL
              </button>

              <button
                type='button'
                className={ApiTesterStyles.GhostButton}
                onClick={clearPresetEditor}
              >
                Clear Preset Edit
              </button>
            </div>

            <div className={ApiTesterStyles.FieldGroup}>
              <label
                className={ApiTesterStyles.Label}
                htmlFor='api-preset-name'
              >
                Preset Name
              </label>
              <input
                id='api-preset-name'
                className={ApiTesterStyles.Input}
                value={presetName}
                onChange={(event) => setPresetName(event.target.value)}
                placeholder='Example: Posts single item'
                aria-label='Preset name'
              />
            </div>

            {curlPreview ? (
              <div className={ApiTesterStyles.FieldGroup}>
                <label className={ApiTesterStyles.Label}>cURL Command</label>
                <textarea
                  className={ApiTesterStyles.Textarea}
                  value={curlPreview}
                  readOnly
                  rows={4}
                  aria-label='Generated cURL command'
                />
              </div>
            ) : null}
          </div>
        </section>

        <section className={ApiTesterStyles.SidePanel}>
          <div className={ApiTesterStyles.Presets}>
            <h3 className={ApiTesterStyles.PanelTitle}>Saved Presets</h3>
            <div className={ApiTesterStyles.PanelBody}>
              {presets.length === 0 ? (
                <p className={ApiTesterStyles.Empty}>No presets saved.</p>
              ) : (
                presets.map((preset) => (
                  <div
                    key={preset.id}
                    className={ApiTesterStyles.Preset}
                  >
                    <button
                      type='button'
                      className={ApiTesterStyles.PresetButton}
                      onClick={() => loadPreset(preset)}
                    >
                      <strong>{preset.name}</strong>
                      <span>
                        {preset.method} {preset.url}
                      </span>
                    </button>
                    <div className={ApiTesterStyles.PresetActions}>
                      <button
                        type='button'
                        className={ApiTesterStyles.GhostButton}
                        onClick={() => loadPreset(preset)}
                      >
                        Edit
                      </button>
                      <button
                        type='button'
                        className={ApiTesterStyles.GhostButton}
                        onClick={() => deletePreset(preset.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={ApiTesterStyles.History}>
            <h3 className={ApiTesterStyles.PanelTitle}>Recent Requests</h3>
            <div className={ApiTesterStyles.PanelBody}>
              {history.length === 0 ? (
                <p className={ApiTesterStyles.Empty}>No history yet.</p>
              ) : (
                history.map((entry) => (
                  <button
                    key={entry.id}
                    type='button'
                    className={ApiTesterStyles.HistoryButton}
                    onClick={() => replayHistory(entry)}
                  >
                    <span>{entry.method}</span>
                    <span className={ApiTesterStyles.HistoryUrl}>
                      {entry.url}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className={ApiTesterStyles.Response}>
            <h3
              className={ApiTesterStyles.PanelTitle}
              ref={responseTitleRef}
              tabIndex={-1}
            >
              Response
            </h3>
            <div className={ApiTesterStyles.ResponseMeta}>
              <span
                className={`${ApiTesterStyles.ResponseStatus} ${
                  responseIsOk
                    ? ApiTesterStyles.Success
                    : ApiTesterStyles.Failure
                }`}
              >
                {responseStatus}
              </span>
              <div className={ApiTesterStyles.ResponseActions}>
                <button
                  type='button'
                  className={ApiTesterStyles.GhostButton}
                  onClick={copyResponse}
                >
                  Copy
                </button>
                <button
                  type='button'
                  className={ApiTesterStyles.GhostButton}
                  onClick={downloadResponse}
                >
                  Download
                </button>
                <button
                  type='button'
                  className={ApiTesterStyles.GhostButton}
                  onClick={() => setShowPretty((current) => !current)}
                  disabled={!responseIsJson}
                >
                  {showPretty ? 'Raw' : 'Pretty'}
                </button>
              </div>
            </div>

            {responseError ? (
              <p
                className={ApiTesterStyles.ErrorText}
                role='alert'
              >
                {responseError}
              </p>
            ) : null}

            {responseIsJson ? (
              <div className={ApiTesterStyles.OutputJson}>
                <SyntaxHighlighter
                  className={ApiTesterStyles.SyntaxBlock}
                  language='json'
                  style={atomDark}
                  customStyle={{ margin: 0, borderRadius: 10, fontSize: 12 }}
                  codeTagProps={{
                    style: {
                      color: '#abb2bf',
                    },
                  }}
                  wrapLongLines
                >
                  {visibleResponse}
                </SyntaxHighlighter>
              </div>
            ) : (
              <pre className={ApiTesterStyles.Output}>{visibleResponse}</pre>
            )}

            {(showPretty ? responseText : responseRawText).length >
            RESPONSE_PREVIEW_LIMIT ? (
              <button
                type='button'
                className={ApiTesterStyles.GhostButton}
                onClick={() => setShowFullResponse((current) => !current)}
              >
                {showFullResponse ? 'Show Less' : 'Show More'}
              </button>
            ) : null}
          </div>
        </section>
      </div>

      {/* Test with jest: mock fetch responses for success, error, and non-JSON payloads. */}
    </Section>
  );
}
