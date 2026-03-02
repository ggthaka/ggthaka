'use client';

import { Screen } from '@components/page';
import { Icon, Loading, Message } from '@components/shared';
import { useDataTable } from '@library/hooks';
import { DataTableStyles } from '@styles/shared';
import { ReactNode } from 'react';

interface ColumnDef<T> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: unknown, row: T) => ReactNode;
  truncate?: number; // Optional max length for text values
  hidden?: boolean; // Optional initial hidden state
}

interface Features {
  search?: boolean;
  pagination?: boolean;
  sorting?: boolean;
  customLimit?: boolean;
  export?: { json?: boolean; csv?: boolean; selected?: boolean };
  columnVisibility?: boolean;
  columnResize?: boolean;
  columnReorder?: boolean;
  columnPinning?: boolean;
}

interface Props<T> {
  endpoint: string;
  columns: ColumnDef<T>[];
  features?: Features;
  message?: string;
  bulkActions?:
    | Array<
        | {
            kind?: 'button';
            label: string;
            // Return `false` to prevent DataTable from clearing selection.
            onAction: (rows: T[]) => void | false | Promise<void | false>;
            confirm?: string;
          }
        | {
            kind: 'render';
            render: (ctx: {
              selectedRows: T[];
              clearSelection: () => void;
              refresh: () => void;
            }) => ReactNode;
          }
      >
    | undefined;
  rowIdKey?: keyof T; // Used to identify rows across operations
}

export default function DataTable<T extends Record<string, unknown>>({
  endpoint,
  columns,
  features = {
    search: true,
    pagination: true,
    sorting: true,
    customLimit: true,
    export: { json: true, csv: true, selected: true },
    columnVisibility: true,
    columnResize: true,
    columnReorder: true,
    columnPinning: true,
  },
  message,
  bulkActions,
  rowIdKey,
}: Props<T>) {
  const {
    data,
    meta,
    page,
    setPage,
    sortConfig,
    requestSort,
    loading,
    errorMessage,
    refresh,
    searchInput,
    handleSearch,
    handleSearchInputChange,
    handleSearchKeyDown,
    customLimit,
    handleCustomLimitChange,
    applyCustomLimit,
    localFilters,
    handleFilter,
    handleFilterInputChange,
    handleFilterKeyDown,
    clearLocalFilter,
    columnVisibility,
    columnPinning,
    draggingKey,
    visibleColumns,
    visibleColumnCount,
    exportVisibleToJSON,
    exportVisibleToCSV,
    formatCell,
    selectedRows,
    activePendingConfirm,
    resolvedBulkActions,
    setAllColumnsVisible,
    toggleColumn,
    setColumnPin,
    handleDragStart,
    handleDragOver,
    handleDrop,
    startResize,
    columnStyle,
    pinnedStyle,
    isPinned,
    allSelectedOnPage,
    toggleAllOnPage,
    isSelected,
    toggleRow,
    clearSelection,
    isBulkActionDisabled,
    handleBulkActionClick,
    confirmPendingAction,
    cancelPendingAction,
    selectedKeyCount,
  } = useDataTable<T>(endpoint, columns, features, bulkActions ?? [], rowIdKey);

  return (
    <div className={DataTableStyles.TableContainer}>
      {(features.search || features.export?.json || features.export?.csv) && (
        <div className={DataTableStyles.SearchWrapper}>
          {features.search && (
            <>
              <input
                type='text'
                value={searchInput}
                onChange={handleSearchInputChange}
                onKeyDown={handleSearchKeyDown}
                placeholder='Search all...'
                className={`${DataTableStyles.SearchInput}`}
              />
              <button
                onClick={handleSearch}
                className={DataTableStyles.SearchButton}
              >
                Go
              </button>
            </>
          )}
          {features.columnVisibility && (
            <Screen icon='more'>
              <div className={DataTableStyles.Exports}>
                <p>Export</p>
                <div className={DataTableStyles.GeneralExports}>
                  <div>
                    <p>All</p>
                  </div>
                  <div className={DataTableStyles.ExportOptions}>
                    {features.export?.json && (
                      <button
                        onClick={exportVisibleToJSON}
                        className={DataTableStyles.SearchButton}
                        disabled={!data.length || visibleColumnCount === 0}
                      >
                        JSON
                      </button>
                    )}
                    {features.export?.csv && (
                      <button
                        onClick={exportVisibleToCSV}
                        className={DataTableStyles.SearchButton}
                        disabled={!data.length || visibleColumnCount === 0}
                      >
                        CSV
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  {resolvedBulkActions.length > 0 && selectedKeyCount > 0 && (
                    <div className={DataTableStyles.BulkActionsBar}>
                      <div className={DataTableStyles.BulkActionsSelected}>
                        Selected - {selectedRows.length}
                      </div>

                      <div className={DataTableStyles.BulkActionsButtons}>
                        {resolvedBulkActions.map((action, idx) => {
                          if ('render' in action) {
                            return (
                              <div key={`bulk-render-${idx}`}>
                                {action.render({
                                  selectedRows,
                                  clearSelection,
                                  refresh,
                                })}
                              </div>
                            );
                          }
                          return (
                            <button
                              key={`${action.label}-${idx}`}
                              onClick={handleBulkActionClick(idx)}
                              disabled={isBulkActionDisabled()}
                              className={DataTableStyles.SearchButton}
                            >
                              {action.label}
                            </button>
                          );
                        })}
                      </div>

                      <div className={DataTableStyles.BulkActionsClear}>
                        {activePendingConfirm && (
                          <>
                            <span style={{ fontWeight: 700 }}>
                              {activePendingConfirm.text}
                            </span>
                            <button
                              className={DataTableStyles.SearchButton}
                              onClick={confirmPendingAction}
                            >
                              Confirm
                            </button>
                            <button
                              className={DataTableStyles.SearchButton}
                              onClick={cancelPendingAction}
                              style={{
                                backgroundColor: 'var(--color-background)',
                                color: 'var(--color-foreground)',
                              }}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        <button
                          onClick={clearSelection}
                          className={DataTableStyles.SearchButton}
                          style={{
                            backgroundColor: 'var(--color-background)',
                            color: 'var(--color-foreground)',
                          }}
                        >
                          Clear Selection
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={DataTableStyles.ColumnTogglePanel}>
                <div className={DataTableStyles.ColumnToggleHeader}>
                  <span>Columns</span>
                  <span>
                    {visibleColumns.length}/{columns.length}
                  </span>
                </div>
                <div className={DataTableStyles.ColumnToggleActions}>
                  <button
                    className={DataTableStyles.SearchButton}
                    onClick={() => setAllColumnsVisible(true)}
                  >
                    Show all
                  </button>
                  <button
                    className={DataTableStyles.SearchButton}
                    onClick={() => setAllColumnsVisible(false)}
                    style={{
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-foreground)',
                    }}
                  >
                    Hide all
                  </button>
                </div>
                <div className={DataTableStyles.ColumnToggleList}>
                  {columns.map((col) => (
                    <label
                      key={`toggle-${col.key}`}
                      className={DataTableStyles.ColumnToggleItem}
                    >
                      <span
                        className={DataTableStyles.CheckboxLabel}
                        aria-label={`Toggle ${col.label}`}
                      >
                        <input
                          type='checkbox'
                          checked={columnVisibility[col.key] !== false}
                          onChange={() => toggleColumn(col.key)}
                          className={DataTableStyles.CheckboxInput}
                        />
                        <span
                          className={DataTableStyles.CustomCheckbox}
                          aria-hidden='true'
                        />
                      </span>
                      <span className={DataTableStyles.ColumnToggleLabel}>
                        {col.label}
                      </span>
                      {features.columnPinning && (
                        <span className={DataTableStyles.PinActions}>
                          <button
                            type='button'
                            className={DataTableStyles.PinButton}
                            onClick={() => setColumnPin(col.key, 'left')}
                            aria-pressed={columnPinning[col.key] === 'left'}
                            data-active={columnPinning[col.key] === 'left'}
                          >
                            Pin L
                          </button>
                          <button
                            type='button'
                            className={DataTableStyles.PinButton}
                            onClick={() => setColumnPin(col.key, 'right')}
                            aria-pressed={columnPinning[col.key] === 'right'}
                            data-active={columnPinning[col.key] === 'right'}
                          >
                            Pin R
                          </button>
                          <button
                            type='button'
                            className={DataTableStyles.PinButton}
                            onClick={() => setColumnPin(col.key, null)}
                          >
                            Unpin
                          </button>
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            </Screen>
          )}
          <button
            onClick={refresh}
            className={DataTableStyles.SearchButton}
            disabled={loading}
            style={{
              backgroundColor: 'var(--color-background)',
              color: 'var(--color-foreground)',
            }}
          >
            Refresh
          </button>
        </div>
      )}
      {message && <Message>{message}</Message>}
      {/* Inline bulk actions (sticky like the search bar; does not scroll with the table) */}

      <div className={DataTableStyles.TableWrapper}>
        <table className={DataTableStyles.Table}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-background)' }}>
              {resolvedBulkActions.length > 0 && (
                <th
                  style={{
                    width: 36,
                    textAlign: 'center',
                    position: features.columnPinning ? 'sticky' : undefined,
                    left: 0,
                    zIndex: 4,
                    backgroundColor: 'var(--color-background)',
                  }}
                  className={
                    features.columnPinning ? DataTableStyles.PinnedCell : ''
                  }
                >
                  <label
                    className={DataTableStyles.CheckboxLabel}
                    aria-label='Select all on page'
                  >
                    <input
                      type='checkbox'
                      checked={allSelectedOnPage}
                      onChange={toggleAllOnPage}
                      className={DataTableStyles.CheckboxInput}
                    />
                    <span
                      className={DataTableStyles.CustomCheckbox}
                      aria-hidden='true'
                    />
                  </label>
                </th>
              )}
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  draggable={features.columnReorder}
                  onDragStart={handleDragStart(col.key)}
                  onDragOver={handleDragOver(col.key)}
                  onDrop={handleDrop(col.key)}
                  onClick={
                    features.sorting && col.sortable
                      ? () => requestSort(col.key as keyof T)
                      : undefined
                  }
                  className={[
                    features.sorting && col.sortable
                      ? DataTableStyles.Sortable
                      : '',
                    features.columnReorder
                      ? DataTableStyles.DraggableHeader
                      : '',
                    draggingKey === col.key
                      ? DataTableStyles.DraggingHeader
                      : '',
                    isPinned(col.key) ? DataTableStyles.PinnedCell : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={{
                    padding: '8px 20px',
                    ...columnStyle(col.key),
                    ...pinnedStyle(col.key),
                    backgroundColor: 'var(--color-background)',
                  }}
                >
                  <div className={DataTableStyles.ThContent}>
                    <span>{col.label}</span>
                    {sortConfig.key === col.key && (
                      <Icon
                        name='chevron'
                        alt='Chevron Icon'
                        size={12}
                        className={
                          sortConfig.direction === 'asc'
                            ? DataTableStyles.Icon
                            : DataTableStyles.IconDefault
                        }
                      />
                    )}
                  </div>
                  {features.columnResize && (
                    <span
                      className={DataTableStyles.ResizeHandle}
                      onMouseDown={startResize(col.key)}
                      role='separator'
                      aria-orientation='vertical'
                      aria-label={`Resize ${col.label}`}
                    />
                  )}
                </th>
              ))}
            </tr>
            {visibleColumns.some((c) => c.filterable) && (
              <tr style={{ backgroundColor: 'var(--color-background)' }}>
                {resolvedBulkActions.length > 0 && (
                  <th
                    style={{
                      width: 36,
                      position: features.columnPinning ? 'sticky' : undefined,
                      left: 0,
                      zIndex: 3,
                      backgroundColor: 'var(--color-background)',
                    }}
                    className={
                      features.columnPinning ? DataTableStyles.PinnedCell : ''
                    }
                  />
                )}
                {visibleColumns.map((col) => (
                  <th
                    key={`filter-${col.key}`}
                    className={
                      isPinned(col.key) ? DataTableStyles.PinnedCell : ''
                    }
                    style={{
                      padding: '8px 20px',
                      ...columnStyle(col.key),
                      ...pinnedStyle(col.key),
                      backgroundColor: 'var(--color-background)',
                    }}
                  >
                    {col.filterable ? (
                      <div className={DataTableStyles.FilterWrapper}>
                        <input
                          style={{ flexGrow: 1 }}
                          type='text'
                          value={localFilters[col.key] || ''}
                          onChange={handleFilterInputChange(col.key)}
                          onKeyDown={handleFilterKeyDown(col.key)}
                          placeholder={`Filter ${col.label}...`}
                          className={`${DataTableStyles.SearchInput} ${DataTableStyles.SearchInputB}`}
                        />
                        <button
                          onClick={() => handleFilter(col.key)}
                          className={DataTableStyles.SearchButton}
                        >
                          Apply
                        </button>
                        {localFilters[col.key] && (
                          <button
                            onClick={() => clearLocalFilter(col.key)}
                            className={DataTableStyles.SearchButton}
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    ) : (
                      <div style={{ height: '36px' }} />
                    )}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={
                    (resolvedBulkActions.length > 0 ? 1 : 0) +
                    Math.max(visibleColumnCount, 1)
                  }
                >
                  <Loading />
                </td>
              </tr>
            ) : errorMessage ? (
              <tr>
                <td
                  colSpan={
                    (resolvedBulkActions.length > 0 ? 1 : 0) +
                    Math.max(visibleColumnCount, 1)
                  }
                >
                  <Message>{errorMessage}</Message>
                </td>
              </tr>
            ) : visibleColumnCount === 0 ? (
              <tr>
                <td colSpan={(resolvedBulkActions.length > 0 ? 1 : 0) + 1}>
                  <Message>No columns selected.</Message>
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={i}>
                  {resolvedBulkActions.length > 0 && (
                    <td
                      style={{
                        textAlign: 'center',
                        position: features.columnPinning ? 'sticky' : undefined,
                        left: 0,
                        zIndex: 2,
                        backgroundColor: 'var(--color-background)',
                      }}
                      className={
                        features.columnPinning ? DataTableStyles.PinnedCell : ''
                      }
                    >
                      <label
                        className={DataTableStyles.CheckboxLabel}
                        aria-label='Select row'
                      >
                        <input
                          type='checkbox'
                          checked={isSelected(row as T, i)}
                          onChange={() => toggleRow(row as T, i)}
                          className={DataTableStyles.CheckboxInput}
                        />
                        <span
                          className={DataTableStyles.CustomCheckbox}
                          aria-hidden='true'
                        />
                      </label>
                    </td>
                  )}
                  {visibleColumns.map((col) => {
                    const cellValue = row[col.key as keyof T];
                    const fullText =
                      typeof cellValue === 'string'
                        ? cellValue
                        : cellValue != null
                          ? String(cellValue)
                          : '—';
                    return (
                      <td
                        key={col.key}
                        title={fullText}
                        className={
                          isPinned(col.key) ? DataTableStyles.PinnedCell : ''
                        }
                        style={{
                          ...columnStyle(col.key),
                          ...pinnedStyle(col.key),
                          backgroundColor: 'var(--color-background)',
                        }}
                      >
                        {formatCell(cellValue, col, row)}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {features.pagination && (
        <div className={DataTableStyles.Footer}>
          <div className={DataTableStyles.Controls}>
            {features.customLimit && (
              <>
                <input
                  type='number'
                  min={1}
                  value={customLimit}
                  onChange={handleCustomLimitChange}
                  className={`${DataTableStyles.CustomLimitInput}`}
                />
                <button
                  onClick={applyCustomLimit}
                  className={DataTableStyles.CustomLimitButton}
                >
                  Set
                </button>
              </>
            )}
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className={DataTableStyles.NavButton}
            >
              Prev
            </button>
            <span className={DataTableStyles.PageNumber}>{page}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= meta.pages}
              className={DataTableStyles.NavButton}
            >
              Next
            </button>
          </div>
          <div className={DataTableStyles.MetaInfo}>
            <span>Total: {meta.total}</span>
            <span>
              Page {meta.page} of {meta.pages}
            </span>
            <span>Showing {data.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}
