'use client';

import { Section } from '@components/layout';
import { DatabaseManagerStyles } from '@styles/section';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface DatabaseName {
  name: string;
}

interface DatabaseSchema {
  name: string;
}

interface DatabaseTable {
  schema: string;
  name: string;
}

interface QueryResultPayload {
  command: string;
  rowCount: number;
  fields: string[];
  rows: Record<string, unknown>[];
}

const DEFAULT_LIMIT = 100;

const toTableKey = (table: DatabaseTable): string => `${table.schema}.${table.name}`;

const splitTableKey = (tableKey: string): { schema: string; name: string } | null => {
  if (!tableKey.includes('.')) return null;
  const [schema, name] = tableKey.split('.');
  if (!schema || !name) return null;
  return { schema, name };
};

const prettyJson = (value: unknown): string => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export default function DatabaseManager() {
  const [databases, setDatabases] = useState<DatabaseName[]>([]);
  const [schemas, setSchemas] = useState<DatabaseSchema[]>([]);
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState('');
  const [selectedSchema, setSelectedSchema] = useState('public');
  const [selectedTable, setSelectedTable] = useState('');
  const [tableFilter, setTableFilter] = useState('');
  const [sql, setSql] = useState('SELECT NOW();');

  const [newDatabaseName, setNewDatabaseName] = useState('');
  const [dropDatabaseConfirm, setDropDatabaseConfirm] = useState('');
  const [newSchemaName, setNewSchemaName] = useState('');
  const [dropSchemaConfirm, setDropSchemaConfirm] = useState('');
  const [newTableName, setNewTableName] = useState('');
  const [tableColumnsDefinition, setTableColumnsDefinition] = useState(
    'id SERIAL PRIMARY KEY,\ncreated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
  );
  const [dropTableConfirm, setDropTableConfirm] = useState('');

  const [tablePreview, setTablePreview] = useState<QueryResultPayload | null>(null);
  const [queryResult, setQueryResult] = useState<QueryResultPayload | null>(null);
  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingRows, setLoadingRows] = useState(false);
  const [runningAction, setRunningAction] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadMetadata = useCallback(async (targetDatabase?: string) => {
    setLoadingTables(true);
    setError('');
    setMessage('');

    try {
      const params = new URLSearchParams({ action: 'metadata' });
      if (targetDatabase) {
        params.set('database', targetDatabase);
      }

      const response = await fetch(
        `/api/private/authorization/root/tools/database-manager?${params.toString()}`,
      );

      const payload = (await response.json()) as {
        ok: boolean;
        data?: {
          currentDatabase: string;
          databases: DatabaseName[];
          schemas: DatabaseSchema[];
          tables: DatabaseTable[];
        };
        error?: { message?: string };
      };

      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(payload.error?.message || 'Unable to load database metadata.');
      }

      const metadata = payload.data!;

      setDatabases(metadata.databases);
      setSchemas(metadata.schemas);
      setTables(metadata.tables);
      setSelectedDatabase(metadata.currentDatabase);

      setSelectedSchema((current) => {
        if (metadata.schemas.some((schema) => schema.name === current)) {
          return current;
        }
        return metadata.schemas[0]?.name || 'public';
      });

      if (metadata.tables.length > 0) {
        setSelectedTable((current) => {
          const exists = metadata.tables.some((table) => toTableKey(table) === current);
          return exists ? current : toTableKey(metadata.tables[0]);
        });
      } else {
        setSelectedTable('');
      }

      setMessage('Database metadata loaded.');
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Unable to load database metadata.',
      );
    } finally {
      setLoadingTables(false);
    }
  }, []);

  const runAdminAction = useCallback(
    async (
      action:
        | 'query'
        | 'create-database'
        | 'drop-database'
        | 'create-schema'
        | 'drop-schema'
        | 'create-table'
        | 'drop-table',
      payload: Record<string, string>,
    ) => {
      setRunningAction(true);
      setError('');
      setMessage('');

      try {
        const response = await fetch('/api/private/authorization/root/tools/database-manager', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action, ...payload }),
        });

        const result = (await response.json()) as {
          ok: boolean;
          data?: {
            message?: string;
            database?: string;
            result?: QueryResultPayload;
          };
          error?: { message?: string };
        };

        if (!response.ok || !result.ok) {
          throw new Error(result.error?.message || 'Database action failed.');
        }

        if (result.data?.result) {
          setQueryResult(result.data.result);
          setMessage(
            `Query executed: ${result.data.result.command} (${result.data.result.rowCount} row(s)).`,
          );
        } else {
          setMessage(result.data?.message || 'Action completed successfully.');
        }

        await loadMetadata(selectedDatabase);
        return true;
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Database action failed.');
        return false;
      } finally {
        setRunningAction(false);
      }
    },
    [loadMetadata, selectedDatabase],
  );

  const loadRows = useCallback(async (tableRef: string) => {
    if (!tableRef) return;

    setLoadingRows(true);
    setError('');
    setMessage('');

    try {
      const params = new URLSearchParams({
        action: 'rows',
        database: selectedDatabase,
        table: tableRef,
        limit: String(DEFAULT_LIMIT),
      });
      const response = await fetch(
        `/api/private/authorization/root/tools/database-manager?${params.toString()}`,
      );

      const payload = (await response.json()) as {
        ok: boolean;
        data?: {
          database: string;
          table: string;
          limit: number;
          result: QueryResultPayload;
        };
        error?: { message?: string };
      };

      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(payload.error?.message || 'Unable to preview table rows.');
      }

      const rowPreview = payload.data!;

      setTablePreview(rowPreview.result);
      setMessage(
        `Loaded ${rowPreview.result.rowCount} row(s) from ${rowPreview.database}.${rowPreview.table}.`,
      );
      setSql(`SELECT * FROM ${rowPreview.table} LIMIT ${rowPreview.limit};`);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Unable to preview table rows.',
      );
    } finally {
      setLoadingRows(false);
    }
  }, [selectedDatabase]);

  const runQuery = useCallback(async () => {
    const value = sql.trim();
    if (!value) return;

    await runAdminAction('query', {
      database: selectedDatabase,
      sql: value,
    });
  }, [runAdminAction, selectedDatabase, sql]);

  const createDatabase = async () => {
    const value = newDatabaseName.trim();
    if (!value) return;

    const ok = await runAdminAction('create-database', {
      databaseName: value,
    });

    if (ok) {
      setNewDatabaseName('');
      await loadMetadata(value);
      setSelectedDatabase(value);
    }
  };

  const dropDatabase = async () => {
    if (!selectedDatabase || dropDatabaseConfirm.trim() !== selectedDatabase) {
      setError('Type the selected database name exactly before dropping it.');
      return;
    }

    const ok = await runAdminAction('drop-database', {
      databaseName: selectedDatabase,
    });

    if (ok) {
      setDropDatabaseConfirm('');
      await loadMetadata();
    }
  };

  const createSchema = async () => {
    const value = newSchemaName.trim();
    if (!value) return;

    const ok = await runAdminAction('create-schema', {
      database: selectedDatabase,
      schemaName: value,
    });

    if (ok) {
      setNewSchemaName('');
      setSelectedSchema(value);
    }
  };

  const dropSchema = async () => {
    if (!selectedSchema || dropSchemaConfirm.trim() !== selectedSchema) {
      setError('Type the selected schema name exactly before dropping it.');
      return;
    }

    const ok = await runAdminAction('drop-schema', {
      database: selectedDatabase,
      schemaName: selectedSchema,
    });

    if (ok) {
      setDropSchemaConfirm('');
    }
  };

  const createTable = async () => {
    const tableName = newTableName.trim();
    const definition = tableColumnsDefinition.trim();
    if (!tableName || !definition) return;

    const ok = await runAdminAction('create-table', {
      database: selectedDatabase,
      schemaName: selectedSchema,
      tableName,
      columnsDefinition: definition,
    });

    if (ok) {
      const key = `${selectedSchema}.${tableName}`;
      setNewTableName('');
      setDropTableConfirm('');
      setSelectedTable(key);
      await loadRows(key);
    }
  };

  const dropTable = async () => {
    const tableRef = splitTableKey(selectedTable);
    if (!tableRef) return;

    if (dropTableConfirm.trim() !== tableRef.name) {
      setError('Type the selected table name (without schema) exactly before dropping it.');
      return;
    }

    const ok = await runAdminAction('drop-table', {
      database: selectedDatabase,
      schemaName: tableRef.schema,
      tableName: tableRef.name,
    });

    if (ok) {
      setDropTableConfirm('');
      setTablePreview(null);
    }
  };

  useEffect(() => {
    void loadMetadata();
  }, [loadMetadata]);

  const filteredTables = useMemo(() => {
    const value = tableFilter.trim().toLowerCase();
    const scoped = tables.filter((table) => table.schema === selectedSchema);
    if (!value) return scoped;
    return scoped.filter((table) => toTableKey(table).toLowerCase().includes(value));
  }, [selectedSchema, tableFilter, tables]);

  const columns = useMemo(() => {
    if (!queryResult || queryResult.fields.length === 0) return [] as string[];
    return queryResult.fields;
  }, [queryResult]);

  const applySqlTemplate = (mode: 'select' | 'insert' | 'update' | 'delete') => {
    const tableRef = splitTableKey(selectedTable);
    if (!tableRef) return;
    const qualifiedTable = `${tableRef.schema}.${tableRef.name}`;

    if (mode === 'select') {
      setSql(`SELECT * FROM ${qualifiedTable} LIMIT ${DEFAULT_LIMIT};`);
      return;
    }

    if (mode === 'insert') {
      setSql(`INSERT INTO ${qualifiedTable} (column_name)\nVALUES (value);`);
      return;
    }

    if (mode === 'update') {
      setSql(`UPDATE ${qualifiedTable}\nSET column_name = value\nWHERE condition;`);
      return;
    }

    setSql(`DELETE FROM ${qualifiedTable}\nWHERE condition;`);
  };

  return (
    <Section
      id='database-manager'
      className={DatabaseManagerStyles.DatabaseManager}
    >
      <header className={DatabaseManagerStyles.Topbar}>
        <div className={DatabaseManagerStyles.Header}>
          <h2 className={DatabaseManagerStyles.Title}>Database Manager</h2>
          <p className={DatabaseManagerStyles.Subtitle}>
            Root-only PostgreSQL access for browsing tables and editing data with SQL.
          </p>
        </div>
      </header>

      <div className={DatabaseManagerStyles.Workspace}>
        <aside className={DatabaseManagerStyles.SidePanel}>
          <h3 className={DatabaseManagerStyles.PanelTitle}>Explorer</h3>
          <div className={DatabaseManagerStyles.SideBody}>
            <label className={DatabaseManagerStyles.Label}>Database</label>
            <select
              className={DatabaseManagerStyles.Select}
              value={selectedDatabase}
              onChange={(event) => {
                const value = event.target.value;
                setSelectedDatabase(value);
                setSelectedTable('');
                setTablePreview(null);
                void loadMetadata(value);
              }}
              disabled={loadingTables || loadingRows || runningAction}
            >
              {databases.map((database) => (
                <option
                  key={database.name}
                  value={database.name}
                >
                  {database.name}
                </option>
              ))}
            </select>

            <label className={DatabaseManagerStyles.Label}>Schema</label>
            <select
              className={DatabaseManagerStyles.Select}
              value={selectedSchema}
              onChange={(event) => {
                setSelectedSchema(event.target.value);
                setSelectedTable('');
              }}
              disabled={loadingTables || loadingRows || runningAction}
            >
              {schemas.map((schema) => (
                <option
                  key={schema.name}
                  value={schema.name}
                >
                  {schema.name}
                </option>
              ))}
            </select>

            <input
              className={DatabaseManagerStyles.Input}
              value={tableFilter}
              onChange={(event) => setTableFilter(event.target.value)}
              placeholder='Filter tables...'
              aria-label='Filter tables'
            />

            <button
              type='button'
              className={DatabaseManagerStyles.Button}
              onClick={() => void loadMetadata(selectedDatabase)}
              disabled={loadingTables || loadingRows || runningAction}
            >
              {loadingTables ? 'Refreshing...' : 'Refresh Metadata'}
            </button>

            <div className={DatabaseManagerStyles.TableList}>
              {filteredTables.length === 0 ? (
                <p className={DatabaseManagerStyles.Empty}>No tables found.</p>
              ) : (
                filteredTables.map((table) => {
                  const key = toTableKey(table);
                  const active = selectedTable === key;

                  return (
                    <button
                      key={key}
                      type='button'
                      className={`${DatabaseManagerStyles.TableItem} ${
                        active ? DatabaseManagerStyles.TableItemActive : ''
                      }`}
                      onClick={() => {
                        setSelectedTable(key);
                        void loadRows(key);
                      }}
                      disabled={loadingRows || runningAction}
                    >
                      {key}
                    </button>
                  );
                })
              )}
            </div>

            <h4 className={DatabaseManagerStyles.SubHeading}>Selected Table Preview</h4>
            {!tablePreview ? (
              <p className={DatabaseManagerStyles.Empty}>
                Select a table to preview up to {DEFAULT_LIMIT} rows.
              </p>
            ) : (
              <div className={DatabaseManagerStyles.PreviewMeta}>
                <span>Command: {tablePreview.command}</span>
                <span>Rows: {tablePreview.rowCount}</span>
                <span>Columns: {tablePreview.fields.length}</span>
              </div>
            )}

            <p className={DatabaseManagerStyles.Note}>
              Preview loads up to {DEFAULT_LIMIT} rows from selected table.
            </p>
          </div>
        </aside>

        <section className={DatabaseManagerStyles.MainPanel}>
          <h3 className={DatabaseManagerStyles.PanelTitle}>Database Actions</h3>
          <div className={DatabaseManagerStyles.MainBody}>
            <div className={DatabaseManagerStyles.ActionCard}>
              <h4 className={DatabaseManagerStyles.SubHeading}>Database Management</h4>
              <div className={DatabaseManagerStyles.FormRow}>
                <input
                  className={DatabaseManagerStyles.Input}
                  value={newDatabaseName}
                  onChange={(event) => setNewDatabaseName(event.target.value)}
                  placeholder='New database name'
                  aria-label='New database name'
                />
                <button
                  type='button'
                  className={DatabaseManagerStyles.Button}
                  onClick={() => void createDatabase()}
                  disabled={runningAction || loadingTables}
                >
                  Create Database
                </button>
              </div>

              <div className={DatabaseManagerStyles.FormRow}>
                <input
                  className={DatabaseManagerStyles.Input}
                  value={dropDatabaseConfirm}
                  onChange={(event) => setDropDatabaseConfirm(event.target.value)}
                  placeholder={`Type ${selectedDatabase || 'database_name'} to confirm drop`}
                  aria-label='Drop database confirmation'
                />
                <button
                  type='button'
                  className={DatabaseManagerStyles.Button}
                  onClick={() => void dropDatabase()}
                  disabled={runningAction || !selectedDatabase}
                >
                  Drop Database
                </button>
              </div>
            </div>

            <div className={DatabaseManagerStyles.ActionCard}>
              <h4 className={DatabaseManagerStyles.SubHeading}>Schema Management</h4>
              <div className={DatabaseManagerStyles.FormRow}>
                <input
                  className={DatabaseManagerStyles.Input}
                  value={newSchemaName}
                  onChange={(event) => setNewSchemaName(event.target.value)}
                  placeholder='New schema name'
                  aria-label='New schema name'
                />
                <button
                  type='button'
                  className={DatabaseManagerStyles.Button}
                  onClick={() => void createSchema()}
                  disabled={runningAction || !selectedDatabase}
                >
                  Create Schema
                </button>
              </div>

              <div className={DatabaseManagerStyles.FormRow}>
                <input
                  className={DatabaseManagerStyles.Input}
                  value={dropSchemaConfirm}
                  onChange={(event) => setDropSchemaConfirm(event.target.value)}
                  placeholder={`Type ${selectedSchema || 'schema_name'} to confirm drop`}
                  aria-label='Drop schema confirmation'
                />
                <button
                  type='button'
                  className={DatabaseManagerStyles.Button}
                  onClick={() => void dropSchema()}
                  disabled={runningAction || !selectedSchema}
                >
                  Drop Schema
                </button>
              </div>
            </div>

            <div className={DatabaseManagerStyles.ActionCard}>
              <h4 className={DatabaseManagerStyles.SubHeading}>Table Management</h4>
              <div className={DatabaseManagerStyles.FormRow}>
                <input
                  className={DatabaseManagerStyles.Input}
                  value={newTableName}
                  onChange={(event) => setNewTableName(event.target.value)}
                  placeholder='New table name'
                  aria-label='New table name'
                />
                <button
                  type='button'
                  className={DatabaseManagerStyles.Button}
                  onClick={() => void createTable()}
                  disabled={runningAction || !selectedSchema}
                >
                  Create Table
                </button>
              </div>

              <textarea
                className={DatabaseManagerStyles.Textarea}
                value={tableColumnsDefinition}
                onChange={(event) => setTableColumnsDefinition(event.target.value)}
                rows={4}
                spellCheck={false}
                placeholder='Column definition SQL for CREATE TABLE'
                aria-label='Table columns definition'
              />

              <div className={DatabaseManagerStyles.FormRow}>
                <input
                  className={DatabaseManagerStyles.Input}
                  value={dropTableConfirm}
                  onChange={(event) => setDropTableConfirm(event.target.value)}
                  placeholder='Type selected table name (without schema) to confirm drop'
                  aria-label='Drop table confirmation'
                />
                <button
                  type='button'
                  className={DatabaseManagerStyles.Button}
                  onClick={() => void dropTable()}
                  disabled={runningAction || !selectedTable}
                >
                  Drop Table
                </button>
              </div>
            </div>

            <h4 className={DatabaseManagerStyles.SubHeading}>SQL Console</h4>
            <div className={DatabaseManagerStyles.TemplateRow}>
              <button
                type='button'
                className={DatabaseManagerStyles.Button}
                onClick={() => applySqlTemplate('select')}
                disabled={!selectedTable}
              >
                SELECT Template
              </button>
              <button
                type='button'
                className={DatabaseManagerStyles.Button}
                onClick={() => applySqlTemplate('insert')}
                disabled={!selectedTable}
              >
                INSERT Template
              </button>
              <button
                type='button'
                className={DatabaseManagerStyles.Button}
                onClick={() => applySqlTemplate('update')}
                disabled={!selectedTable}
              >
                UPDATE Template
              </button>
              <button
                type='button'
                className={DatabaseManagerStyles.Button}
                onClick={() => applySqlTemplate('delete')}
                disabled={!selectedTable}
              >
                DELETE Template
              </button>
            </div>

            <textarea
              className={DatabaseManagerStyles.Textarea}
              value={sql}
              onChange={(event) => setSql(event.target.value)}
              rows={8}
              spellCheck={false}
              placeholder='Write SQL query here...'
              aria-label='SQL query'
            />

            <div className={DatabaseManagerStyles.ActionRow}>
              <button
                type='button'
                className={DatabaseManagerStyles.Button}
                onClick={() => void runQuery()}
                disabled={runningAction || loadingRows || loadingTables}
              >
                {runningAction ? 'Running...' : 'Run Query'}
              </button>
              <button
                type='button'
                className={DatabaseManagerStyles.Button}
                onClick={() => setSql('')}
                disabled={runningAction}
              >
                Clear SQL
              </button>
            </div>

            {error ? <p className={DatabaseManagerStyles.Error}>{error}</p> : null}
            {message ? <p className={DatabaseManagerStyles.Message}>{message}</p> : null}

            <div className={DatabaseManagerStyles.ResultCard}>
              <h4 className={DatabaseManagerStyles.SubHeading}>Query Result</h4>

              {!queryResult ? (
                <p className={DatabaseManagerStyles.Empty}>Run a query to see results.</p>
              ) : (
                <>
                  <div className={DatabaseManagerStyles.PreviewMeta}>
                    <span>Command: {queryResult.command}</span>
                    <span>Rows: {queryResult.rowCount}</span>
                    <span>Columns: {queryResult.fields.length}</span>
                  </div>

                  {columns.length > 0 && queryResult.rows.length > 0 ? (
                    <div className={DatabaseManagerStyles.TableWrap}>
                      <table className={DatabaseManagerStyles.ResultTable}>
                        <thead>
                          <tr>
                            {columns.map((column) => (
                              <th key={column}>{column}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {queryResult.rows.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {columns.map((column) => (
                                <td key={`${rowIndex}-${column}`}>
                                  {prettyJson(row[column])}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}

                  <div className={DatabaseManagerStyles.JsonPreview}>
                    <SyntaxHighlighter
                      language='json'
                      style={oneDark}
                      className={DatabaseManagerStyles.SyntaxBlock}
                      customStyle={{ margin: 0, borderRadius: 10, fontSize: 12 }}
                      codeTagProps={{ style: { color: '#abb2bf' } }}
                      wrapLongLines
                    >
                      {prettyJson(queryResult)}
                    </SyntaxHighlighter>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </Section>
  );
}