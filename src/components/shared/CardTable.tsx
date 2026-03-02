'use client';

import { Screen } from '@components/page';
import { Icon, Loading, Message } from '@components/shared';
import { useCardTable } from '@library/hooks';
import { CardTableStyles } from '@styles/shared';
import { ReactNode, useMemo } from 'react';

interface ColumnDef<T> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: unknown, row: T) => ReactNode;
  truncate?: number;
  hidden?: boolean;
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
  rowIdKey?: keyof T;
}

const IMAGE_KEYS = [
  'image',
  'thumbnail',
  'cover',
  'poster',
  'banner',
  'avatar',
];
const TITLE_KEYS = ['title', 'name', 'headline'];
const DESCRIPTION_KEYS = [
  'description',
  'excerpt',
  'summary',
  'content',
  'body',
];

function detectColumn<T>(
  candidates: string[],
  fallback: ColumnDef<T> | undefined,
  source: ColumnDef<T>[],
) {
  const candidateSet = candidates.map((candidate) => candidate.toLowerCase());
  const found = source.find((col) => {
    const key = col.key.toLowerCase();
    return candidateSet.some((candidate) => key.includes(candidate));
  });
  return found ?? fallback;
}

export default function CardTable<T extends Record<string, unknown>>({
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
    columnPinning: false,
  },
  message,
  bulkActions,
  rowIdKey,
}: Props<T>) {
  const cardTableFeatures: Features = {
    ...features,
    columnPinning: false,
  };

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
    handleDragStart,
    handleDragOver,
    handleDrop,
    startResize,
    columnStyle,
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
  } = useCardTable<T>(
    endpoint,
    columns,
    cardTableFeatures,
    bulkActions ?? [],
    rowIdKey,
  );

  const sortableColumns = useMemo(
    () => visibleColumns.filter((col) => col.sortable),
    [visibleColumns],
  );

  const filterableColumns = useMemo(
    () => visibleColumns.filter((col) => col.filterable),
    [visibleColumns],
  );

  const imageColumn = useMemo(
    () => detectColumn(IMAGE_KEYS, visibleColumns[0], visibleColumns),
    [visibleColumns],
  );

  const titleColumn = useMemo(
    () =>
      detectColumn(
        TITLE_KEYS,
        visibleColumns[1] ?? visibleColumns[0],
        visibleColumns,
      ),
    [visibleColumns],
  );

  const descriptionColumn = useMemo(
    () =>
      detectColumn(
        DESCRIPTION_KEYS,
        visibleColumns[2] ?? visibleColumns[1] ?? visibleColumns[0],
        visibleColumns,
      ),
    [visibleColumns],
  );

  const excludedColumnKeys = useMemo(
    () =>
      new Set(
        [imageColumn?.key, titleColumn?.key, descriptionColumn?.key].filter(
          Boolean,
        ) as string[],
      ),
    [imageColumn?.key, titleColumn?.key, descriptionColumn?.key],
  );

  const additionalColumns = useMemo(
    () => visibleColumns.filter((col) => !excludedColumnKeys.has(col.key)),
    [visibleColumns, excludedColumnKeys],
  );

  const shouldShowControls =
    features.search ||
    features.export?.json ||
    features.export?.csv ||
    features.columnVisibility ||
    features.sorting ||
    filterableColumns.length > 0;

  return (
    <div className={CardTableStyles.TableContainer}>
      {shouldShowControls && (
        <div className={CardTableStyles.SearchWrapper}>
          {features.search && (
            <>
              <input
                type='text'
                value={searchInput}
                onChange={handleSearchInputChange}
                onKeyDown={handleSearchKeyDown}
                placeholder='Search all...'
                className={CardTableStyles.SearchInput}
              />
              <button
                onClick={handleSearch}
                className={CardTableStyles.SearchButton}
              >
                Go
              </button>
            </>
          )}

          <Screen icon='more'>
            {(features.export?.json || features.export?.csv) && (
              <div className={CardTableStyles.Exports}>
                <p>Export</p>
                <div className={CardTableStyles.GeneralExports}>
                  <div>
                    <p>All</p>
                  </div>
                  <div className={CardTableStyles.ExportOptions}>
                    {features.export?.json && (
                      <button
                        onClick={exportVisibleToJSON}
                        className={CardTableStyles.SearchButton}
                        disabled={!data.length || visibleColumnCount === 0}
                      >
                        JSON
                      </button>
                    )}
                    {features.export?.csv && (
                      <button
                        onClick={exportVisibleToCSV}
                        className={CardTableStyles.SearchButton}
                        disabled={!data.length || visibleColumnCount === 0}
                      >
                        CSV
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {resolvedBulkActions.length > 0 && selectedKeyCount > 0 && (
              <div className={CardTableStyles.Exports}>
                <p>Bulk Actions</p>
                <div className={CardTableStyles.BulkActionsBar}>
                  <div className={CardTableStyles.BulkActionsSelected}>
                    Selected - {selectedRows.length}
                  </div>

                  <div className={CardTableStyles.BulkActionsButtons}>
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
                          className={CardTableStyles.SearchButton}
                        >
                          {action.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className={CardTableStyles.BulkActionsClear}>
                    {activePendingConfirm && (
                      <>
                        <span style={{ fontWeight: 700 }}>
                          {activePendingConfirm.text}
                        </span>
                        <button
                          className={CardTableStyles.SearchButton}
                          onClick={confirmPendingAction}
                        >
                          Confirm
                        </button>
                        <button
                          className={CardTableStyles.SearchButton}
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
                      className={CardTableStyles.SearchButton}
                      style={{
                        backgroundColor: 'var(--color-background)',
                        color: 'var(--color-foreground)',
                      }}
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
              </div>
            )}

            {features.sorting && sortableColumns.length > 0 && (
              <div className={CardTableStyles.SortPanel}>
                <div className={CardTableStyles.ColumnToggleHeader}>
                  <span>Sorting</span>
                </div>
                <div className={CardTableStyles.SortActions}>
                  {sortableColumns.map((col) => (
                    <button
                      key={`sort-${col.key}`}
                      className={CardTableStyles.SortButton}
                      data-active={sortConfig.key === col.key}
                      onClick={() => requestSort(col.key as keyof T)}
                    >
                      <span>{col.label}</span>
                      {sortConfig.key === col.key && (
                        <Icon
                          name='chevron'
                          alt='Chevron Icon'
                          size={12}
                          className={
                            sortConfig.direction === 'asc'
                              ? CardTableStyles.Icon
                              : CardTableStyles.IconDefault
                          }
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filterableColumns.length > 0 && (
              <div className={CardTableStyles.FilterPanel}>
                <div className={CardTableStyles.ColumnToggleHeader}>
                  <span>Filters</span>
                </div>
                <div className={CardTableStyles.FilterList}>
                  {filterableColumns.map((col) => (
                    <div
                      key={`filter-${col.key}`}
                      className={CardTableStyles.FilterWrapper}
                    >
                      <input
                        style={{ flexGrow: 1 }}
                        type='text'
                        value={localFilters[col.key] || ''}
                        onChange={handleFilterInputChange(col.key)}
                        onKeyDown={handleFilterKeyDown(col.key)}
                        placeholder={`Filter ${col.label}...`}
                        className={`${CardTableStyles.SearchInput} ${CardTableStyles.SearchInputB}`}
                      />
                      <button
                        onClick={() => handleFilter(col.key)}
                        className={CardTableStyles.SearchButton}
                      >
                        Apply
                      </button>
                      {localFilters[col.key] && (
                        <button
                          onClick={() => clearLocalFilter(col.key)}
                          className={CardTableStyles.SearchButton}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {features.columnVisibility && (
              <div className={CardTableStyles.ColumnTogglePanel}>
                <div className={CardTableStyles.ColumnToggleHeader}>
                  <span>Columns</span>
                  <span>
                    {visibleColumns.length}/{columns.length}
                  </span>
                </div>
                <div className={CardTableStyles.ColumnToggleActions}>
                  <button
                    className={CardTableStyles.SearchButton}
                    onClick={() => setAllColumnsVisible(true)}
                  >
                    Show all
                  </button>
                  <button
                    className={CardTableStyles.SearchButton}
                    onClick={() => setAllColumnsVisible(false)}
                    style={{
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-foreground)',
                    }}
                  >
                    Hide all
                  </button>
                </div>
                <div className={CardTableStyles.ColumnToggleList}>
                  {columns.map((col) => (
                    <div
                      key={`toggle-${col.key}`}
                      className={CardTableStyles.ColumnToggleItem}
                      draggable={features.columnReorder}
                      onDragStart={handleDragStart(col.key)}
                      onDragOver={handleDragOver(col.key)}
                      onDrop={handleDrop(col.key)}
                      data-dragging={draggingKey === col.key}
                      data-cardtable-resize-host='true'
                    >
                      <label
                        htmlFor={`cardtable-column-${col.key}`}
                        className={CardTableStyles.CheckboxLabel}
                        aria-label={`Toggle ${col.label}`}
                      >
                        <input
                          id={`cardtable-column-${col.key}`}
                          type='checkbox'
                          checked={columnVisibility[col.key] !== false}
                          onChange={() => toggleColumn(col.key)}
                          className={CardTableStyles.CheckboxInput}
                        />
                        <span
                          className={CardTableStyles.CustomCheckbox}
                          aria-hidden='true'
                        />
                      </label>
                      <span className={CardTableStyles.ColumnToggleLabel}>
                        {col.label}
                      </span>

                      {features.columnResize && (
                        <span
                          className={CardTableStyles.ResizeHandle}
                          onMouseDown={startResize(col.key)}
                          role='separator'
                          aria-orientation='vertical'
                          aria-label={`Resize ${col.label}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Screen>

          {resolvedBulkActions.length > 0 && (
            <label
              className={CardTableStyles.CheckboxWithText}
              aria-label='Select all cards on page'
            >
              <input
                type='checkbox'
                checked={allSelectedOnPage}
                onChange={toggleAllOnPage}
                className={CardTableStyles.CheckboxInput}
              />
              <span
                className={CardTableStyles.CustomCheckbox}
                aria-hidden='true'
              />
              <span>Select page</span>
            </label>
          )}

          <button
            onClick={refresh}
            className={CardTableStyles.SearchButton}
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

      {loading ? (
        <div className={CardTableStyles.LoadingState}>
          <Loading />
        </div>
      ) : errorMessage ? (
        <Message>{errorMessage}</Message>
      ) : visibleColumnCount === 0 ? (
        <Message>No columns selected.</Message>
      ) : (
        <div className={CardTableStyles.CardGrid}>
          {data.map((row, index) => {
            const imageValue = imageColumn
              ? row[imageColumn.key as keyof T]
              : null;
            const imageSrc =
              typeof imageValue === 'string' && imageValue.trim().length > 0
                ? imageValue
                : null;

            const titleValue = titleColumn
              ? row[titleColumn.key as keyof T]
              : undefined;
            const descriptionValue = descriptionColumn
              ? row[descriptionColumn.key as keyof T]
              : undefined;

            return (
              <article
                key={`${index}-${String(titleValue ?? '')}`}
                className={CardTableStyles.Card}
              >
                {resolvedBulkActions.length > 0 && (
                  <div className={CardTableStyles.CardSelection}>
                    <label
                      className={CardTableStyles.CheckboxLabel}
                      aria-label='Select row'
                    >
                      <input
                        type='checkbox'
                        checked={isSelected(row as T, index)}
                        onChange={() => toggleRow(row as T, index)}
                        className={CardTableStyles.CheckboxInput}
                      />
                      <span
                        className={CardTableStyles.CustomCheckbox}
                        aria-hidden='true'
                      />
                    </label>
                  </div>
                )}

                <div className={CardTableStyles.CardImageWrap}>
                  {imageSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageSrc}
                      alt={
                        typeof titleValue === 'string' && titleValue
                          ? `${titleValue} image`
                          : 'Card image'
                      }
                      className={CardTableStyles.CardImage}
                    />
                  ) : (
                    <div className={CardTableStyles.CardImageFallback}>
                      No image
                    </div>
                  )}
                </div>

                <div className={CardTableStyles.CardBody}>
                  <h3 className={CardTableStyles.CardTitle}>
                    {titleColumn
                      ? formatCell(titleValue, titleColumn, row)
                      : 'Untitled content'}
                  </h3>

                  <p className={CardTableStyles.CardDescription}>
                    {descriptionColumn
                      ? formatCell(descriptionValue, descriptionColumn, row)
                      : 'No description available.'}
                  </p>

                  {additionalColumns.length > 0 && (
                    <div className={CardTableStyles.CardFields}>
                      {additionalColumns.map((col) => (
                        <div
                          key={`${index}-${col.key}`}
                          className={CardTableStyles.CardField}
                          data-cardtable-resize-host='true'
                          style={{
                            ...columnStyle(col.key),
                          }}
                        >
                          <span className={CardTableStyles.CardFieldLabel}>
                            {col.label}
                          </span>
                          <span className={CardTableStyles.CardFieldValue}>
                            {formatCell(row[col.key as keyof T], col, row)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {features.pagination && (
        <div className={CardTableStyles.Footer}>
          <div className={CardTableStyles.Controls}>
            {features.customLimit && (
              <>
                <input
                  type='number'
                  min={1}
                  value={customLimit}
                  onChange={handleCustomLimitChange}
                  className={CardTableStyles.CustomLimitInput}
                />
                <button
                  onClick={applyCustomLimit}
                  className={CardTableStyles.CustomLimitButton}
                >
                  Set
                </button>
              </>
            )}
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className={CardTableStyles.NavButton}
            >
              Prev
            </button>
            <span className={CardTableStyles.PageNumber}>{page}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= meta.pages}
              className={CardTableStyles.NavButton}
            >
              Next
            </button>
          </div>
          <div className={CardTableStyles.MetaInfo}>
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
