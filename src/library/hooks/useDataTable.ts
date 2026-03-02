import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';

interface Meta {
  total: number;
  page: number;
  pages: number;
  limit: number;
  search?: string | null;
}

type SortDirection = 'asc' | 'desc' | null;

interface SortConfig<T> {
  key: keyof T | null;
  direction: SortDirection;
}

export interface ColumnDef<T> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: unknown, row: T) => ReactNode;
  truncate?: number; // Optional max length for text values
  hidden?: boolean; // Optional initial hidden state
}

interface ExportOptions {
  json?: boolean;
  csv?: boolean;
  selected?: boolean;
}

export interface Features {
  search?: boolean;
  pagination?: boolean;
  sorting?: boolean;
  customLimit?: boolean;
  export?: ExportOptions;
  columnVisibility?: boolean;
  columnResize?: boolean;
  columnReorder?: boolean;
  columnPinning?: boolean;
}

export type BulkAction<T> =
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
    };

export default function useDataTable<T extends Record<string, unknown>>(
  endpoint: string,
  columns: ColumnDef<T>[],
  features: Features = {},
  bulkActions: BulkAction<T>[] = [],
  rowIdKey?: keyof T,
) {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [data, setData] = useState<T[]>([]);
  const [meta, setMeta] = useState<Meta>({
    total: 0,
    page: 0,
    pages: 0,
    limit: 0,
  });

  const [sortConfig, setSortConfig] = useState<SortConfig<T>>({
    key: null,
    direction: null,
  });
  const [refreshKey, setRefreshKey] = useState(0);

  const [searchInput, setSearchInput] = useState(search);
  const [customLimit, setCustomLimit] = useState(limit);
  const [localFilters, setLocalFilters] = useState(filters);

  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(() =>
    columns.reduce(
      (acc, col) => {
        acc[col.key] = col.hidden ? false : true;
        return acc;
      },
      {} as Record<string, boolean>,
    ),
  );
  const [columnOrder, setColumnOrder] = useState<string[]>(() =>
    columns.map((col) => col.key),
  );
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [columnPinning, setColumnPinning] = useState<
    Record<string, 'left' | 'right' | undefined>
  >({});
  const [resizing, setResizing] = useState<{
    key: string;
    startX: number;
    startWidth: number;
  } | null>(null);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);

  const [pendingConfirm, setPendingConfirm] = useState<{
    idx: number;
    text: string;
  } | null>(null);

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    const onRefresh = () => setRefreshKey((k) => k + 1);
    window.addEventListener('datatable:refresh', onRefresh);
    return () => window.removeEventListener('datatable:refresh', onRefresh);
  }, []);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    setCustomLimit(limit);
  }, [limit]);

  useEffect(() => {
    setColumnVisibility((prev) => {
      const next = { ...prev } as Record<string, boolean>;
      columns.forEach((col) => {
        if (!(col.key in next)) next[col.key] = col.hidden ? false : true;
      });
      Object.keys(next).forEach((key) => {
        if (!columns.some((col) => col.key === key)) delete next[key];
      });
      return next;
    });
  }, [columns]);

  useEffect(() => {
    setColumnOrder((prev) => {
      const next = prev.filter((key) => columns.some((col) => col.key === key));
      const missing = columns
        .map((col) => col.key)
        .filter((key) => !next.includes(key));
      return [...next, ...missing];
    });
  }, [columns]);

  useEffect(() => {
    setColumnPinning((prev) => {
      const next = { ...prev } as Record<string, 'left' | 'right' | undefined>;
      Object.keys(next).forEach((key) => {
        if (!columns.some((col) => col.key === key)) delete next[key];
      });
      return next;
    });
  }, [columns]);

  useEffect(() => {
    if (!resizing) return;
    const onMouseMove = (event: globalThis.MouseEvent) => {
      const delta = event.clientX - resizing.startX;
      const nextWidth = Math.max(80, resizing.startWidth + delta);
      setColumnWidths((prev) => ({
        ...prev,
        [resizing.key]: nextWidth,
      }));
    };
    const onMouseUp = () => setResizing(null);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [resizing]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchData = async () => {
      if (!isMounted) return;
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        if (search.trim()) params.append('search', search.trim());
        Object.entries(filters).forEach(([key, value]) => {
          if (value.trim()) params.append(`filters[${key}]`, value.trim());
        });

        const response = await fetch(`${endpoint}?${params}`, {
          signal: controller.signal,
        });
        const res = await response.json();

        if (!res.ok) {
          if (isMounted) {
            setErrorMessage(res.error?.message || 'Failed to fetch data.');
            setData([]);
          }
        } else if (isMounted) {
          setErrorMessage('');
          setData(res.data);
          setMeta(res.meta);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError' && isMounted) {
          setErrorMessage('Network error occurred.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [endpoint, page, limit, search, filters, refreshKey]);

  // === SORTING ===
  const requestSort = (key: keyof T) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return prev.direction === 'asc'
          ? { key, direction: 'desc' }
          : { key: null, direction: null };
      }
      return { key, direction: 'asc' };
    });
  };

  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return data;
    const key = sortConfig.key as keyof T;
    return [...data].sort((a, b) => {
      const aVal = a[key] ?? '';
      const bVal = b[key] ?? '';
      return sortConfig.direction === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [data, sortConfig]);

  // === FILTERS ===
  const updateFilter = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const clearFilter = useCallback((key: string) => {
    setFilters((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
    setPage(1);
  }, []);

  const handleSearch = useCallback(() => {
    setSearch(searchInput.trim());
    setPage(1);
  }, [searchInput]);

  const handleSearchInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setSearchInput(event.target.value);
    },
    [],
  );

  const handleSearchKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') handleSearch();
    },
    [handleSearch],
  );

  const handleFilter = useCallback(
    (key: string) => {
      const value = localFilters[key]?.trim() || '';
      if (value) updateFilter(key, value);
      else clearFilter(key);
    },
    [localFilters, updateFilter, clearFilter],
  );

  const handleFilterInputChange = useCallback(
    (key: string) => (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setLocalFilters((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [],
  );

  const handleFilterKeyDown = useCallback(
    (key: string) => (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') handleFilter(key);
    },
    [handleFilter],
  );

  const clearLocalFilter = useCallback(
    (key: string) => {
      setLocalFilters((prev) => {
        const updated = { ...prev } as Record<string, string>;
        delete updated[key];
        return updated;
      });
      clearFilter(key);
    },
    [clearFilter],
  );

  const handleCustomLimitChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setCustomLimit(Number(event.target.value));
    },
    [],
  );

  const applyCustomLimit = useCallback(() => {
    const val = Number(customLimit);
    if (val > 0) {
      setLimit(val);
      setPage(1);
    }
  }, [customLimit]);

  const DEFAULT_TRUNCATE = 120;

  const orderedColumnsBase = useMemo(
    () =>
      [
        ...columnOrder
          .map((key) => columns.find((col) => col.key === key))
          .filter(Boolean),
        ...columns.filter((col) => !columnOrder.includes(col.key)),
      ] as ColumnDef<T>[],
    [columnOrder, columns],
  );

  const pinnedLeftColumns = useMemo(
    () => orderedColumnsBase.filter((col) => columnPinning[col.key] === 'left'),
    [orderedColumnsBase, columnPinning],
  );
  const pinnedRightColumns = useMemo(
    () =>
      orderedColumnsBase.filter((col) => columnPinning[col.key] === 'right'),
    [orderedColumnsBase, columnPinning],
  );
  const unpinnedColumns = useMemo(
    () => orderedColumnsBase.filter((col) => !columnPinning[col.key]),
    [orderedColumnsBase, columnPinning],
  );

  const orderedColumns = useMemo(
    () => [...pinnedLeftColumns, ...unpinnedColumns, ...pinnedRightColumns],
    [pinnedLeftColumns, unpinnedColumns, pinnedRightColumns],
  );

  const visibleColumns = useMemo(
    () => orderedColumns.filter((col) => columnVisibility[col.key] !== false),
    [orderedColumns, columnVisibility],
  );
  const visibleColumnCount = visibleColumns.length;

  const columnStyle = useCallback(
    (key: string) =>
      columnWidths[key]
        ? {
            width: columnWidths[key],
            maxWidth: columnWidths[key],
          }
        : undefined,
    [columnWidths],
  );

  const getColumnWidth = useCallback(
    (key: string) => columnWidths[key] ?? 160,
    [columnWidths],
  );

  const selectionOffset = useMemo(
    () => (features.export?.selected || bulkActions.length > 0 ? 36 : 0),
    [features.export?.selected, bulkActions.length],
  );

  const pinnedOffsets = useMemo(() => {
    const pinnedLeftOffsets = new Map<string, number>();
    const pinnedRightOffsets = new Map<string, number>();
    let leftOffset = selectionOffset;
    visibleColumns.forEach((col) => {
      if (columnPinning[col.key] === 'left') {
        pinnedLeftOffsets.set(col.key, leftOffset);
        leftOffset += getColumnWidth(col.key);
      }
    });
    let rightOffset = 0;
    [...visibleColumns].reverse().forEach((col) => {
      if (columnPinning[col.key] === 'right') {
        pinnedRightOffsets.set(col.key, rightOffset);
        rightOffset += getColumnWidth(col.key);
      }
    });
    return { pinnedLeftOffsets, pinnedRightOffsets };
  }, [visibleColumns, columnPinning, getColumnWidth, selectionOffset]);

  const pinnedStyle = useCallback(
    (key: string) => {
      if (!features.columnPinning) return undefined;
      if (pinnedOffsets.pinnedLeftOffsets.has(key)) {
        return {
          position: 'sticky' as const,
          left: pinnedOffsets.pinnedLeftOffsets.get(key),
          zIndex: 3,
        };
      }
      if (pinnedOffsets.pinnedRightOffsets.has(key)) {
        return {
          position: 'sticky' as const,
          right: pinnedOffsets.pinnedRightOffsets.get(key),
          zIndex: 3,
        };
      }
      return undefined;
    },
    [features.columnPinning, pinnedOffsets],
  );

  const isPinned = useCallback(
    (key: string) =>
      columnPinning[key] === 'left' || columnPinning[key] === 'right',
    [columnPinning],
  );

  const formatCell = useCallback(
    (value: unknown, col: ColumnDef<T>, row: T) => {
      if (col.render) return col.render(value, row);
      const raw = value;
      const text =
        typeof raw === 'string' ? raw : raw != null ? String(raw) : '—';
      const limit = col.truncate ?? DEFAULT_TRUNCATE;
      if (text.length > limit) return text.slice(0, limit) + '…';
      return text;
    },
    [],
  );

  const exportVisibleToJSON = useCallback(() => {
    if (!features.export?.json || sortedData.length === 0) return;
    const headers = visibleColumns.map((col) => col.key);
    const jsonData = sortedData.map((row) =>
      headers.reduce(
        (acc, key) => {
          acc[key] = row[key as keyof T];
          return acc;
        },
        {} as Record<string, unknown>,
      ),
    );
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [features.export?.json, sortedData, visibleColumns]);

  const exportVisibleToCSV = useCallback(() => {
    if (!features.export?.csv || sortedData.length === 0) return;
    const headers = visibleColumns.map((col) => `"${col.label}"`).join(',');
    const rows = sortedData.map((row) =>
      visibleColumns
        .map((col) => {
          const value = row[col.key as keyof T];
          const rendered = col.render ? col.render(value, row) : (value ?? '');
          return `"${String(rendered).replace(/"/g, '""')}"`;
        })
        .join(','),
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `export-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [features.export?.csv, sortedData, visibleColumns]);

  const keyOf = useCallback(
    (row: T, index: number): string => {
      if (rowIdKey && row[rowIdKey] != null) return String(row[rowIdKey]);
      return `${meta.page}:${index}`;
    },
    [rowIdKey, meta.page],
  );

  const isSelected = useCallback(
    (row: T, index: number) => selectedKeys.has(keyOf(row, index)),
    [selectedKeys, keyOf],
  );

  const toggleRow = useCallback(
    (row: T, index: number) => {
      const k = keyOf(row, index);
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        if (next.has(k)) next.delete(k);
        else next.add(k);
        return next;
      });
    },
    [keyOf],
  );

  const currentPageKeys = useMemo(
    () => new Set(sortedData.map((row, i) => keyOf(row as T, i))),
    [sortedData, keyOf],
  );

  const allSelectedOnPage = useMemo(
    () =>
      sortedData.length > 0 &&
      [...currentPageKeys].every((k) => selectedKeys.has(k)),
    [sortedData.length, currentPageKeys, selectedKeys],
  );

  const toggleAllOnPage = useCallback(() => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (allSelectedOnPage) currentPageKeys.forEach((k) => next.delete(k));
      else currentPageKeys.forEach((k) => next.add(k));
      return next;
    });
  }, [allSelectedOnPage, currentPageKeys]);

  const clearSelection = useCallback(() => {
    setSelectedKeys(new Set());
    setPendingConfirm(null);
  }, []);

  const selectedRows = useMemo(
    () => sortedData.filter((row, i) => isSelected(row as T, i)) as T[],
    [sortedData, isSelected],
  );

  const activePendingConfirm = selectedKeys.size === 0 ? null : pendingConfirm;

  const exportSelectedToJSON = useCallback(() => {
    if (
      !features.export?.json ||
      selectedRows.length === 0 ||
      visibleColumnCount === 0
    )
      return;
    const headers = visibleColumns.map((col) => col.key);
    const jsonData = selectedRows.map((row) =>
      headers.reduce(
        (acc, key) => {
          acc[key] = row[key as keyof T];
          return acc;
        },
        {} as Record<string, unknown>,
      ),
    );
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `export-selected-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [features.export?.json, selectedRows, visibleColumns, visibleColumnCount]);

  const exportSelectedToCSV = useCallback(() => {
    if (
      !features.export?.csv ||
      selectedRows.length === 0 ||
      visibleColumnCount === 0
    )
      return;
    const headers = visibleColumns.map((col) => `"${col.label}"`).join(',');
    const rows = selectedRows.map((row) =>
      visibleColumns
        .map((col) => {
          const value = row[col.key as keyof T];
          const rendered = col.render ? col.render(value, row) : (value ?? '');
          return `"${String(rendered).replace(/"/g, '""')}"`;
        })
        .join(','),
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `export-selected-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [features.export?.csv, selectedRows, visibleColumns, visibleColumnCount]);

  const builtInBulkActions = useMemo(
    () =>
      features.export?.selected
        ? ([
            features.export?.json && {
              kind: 'button' as const,
              label: 'JSON',
              onAction: async () => {
                exportSelectedToJSON();
                return false;
              },
            },
            features.export?.csv && {
              kind: 'button' as const,
              label: 'CSV',
              onAction: async () => {
                exportSelectedToCSV();
                return false;
              },
            },
          ].filter(Boolean) as BulkAction<T>[])
        : [],
    [
      features.export?.selected,
      features.export?.json,
      features.export?.csv,
      exportSelectedToJSON,
      exportSelectedToCSV,
    ],
  );

  const resolvedBulkActions = useMemo(
    () => [...builtInBulkActions, ...bulkActions],
    [builtInBulkActions, bulkActions],
  );

  const setAllColumnsVisible = useCallback(
    (visible: boolean) => {
      setColumnVisibility(
        columns.reduce(
          (acc, col) => {
            acc[col.key] = visible;
            return acc;
          },
          {} as Record<string, boolean>,
        ),
      );
    },
    [columns],
  );

  const toggleColumn = useCallback((key: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const setColumnPin = useCallback(
    (key: string, side: 'left' | 'right' | null) => {
      if (!features.columnPinning) return;
      setColumnPinning((prev) => {
        if (!side) {
          const next = { ...prev };
          delete next[key];
          return next;
        }
        return { ...prev, [key]: side };
      });
    },
    [features.columnPinning],
  );

  const handleDragStart = useCallback(
    (key: string) => (event: DragEvent<HTMLTableCellElement>) => {
      if (!features.columnReorder) return;
      setDraggingKey(key);
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', key);
    },
    [features.columnReorder],
  );

  const handleDragOver = useCallback(
    (key: string) => (event: DragEvent<HTMLTableCellElement>) => {
      if (!features.columnReorder || draggingKey === key) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    },
    [features.columnReorder, draggingKey],
  );

  const handleDrop = useCallback(
    (key: string) => (event: DragEvent<HTMLTableCellElement>) => {
      if (!features.columnReorder) return;
      event.preventDefault();
      const dragged = event.dataTransfer.getData('text/plain') || draggingKey;
      if (!dragged || dragged === key) return;
      setColumnOrder((prev) => {
        const next = prev.filter((colKey) => colKey !== dragged);
        const targetIndex = next.indexOf(key);
        if (targetIndex === -1) return [...next, dragged];
        next.splice(targetIndex, 0, dragged);
        return next;
      });
      setDraggingKey(null);
    },
    [features.columnReorder, draggingKey],
  );

  const startResize = useCallback(
    (key: string) => (event: ReactMouseEvent<HTMLSpanElement>) => {
      if (!features.columnResize) return;
      event.preventDefault();
      event.stopPropagation();
      const headerCell = event.currentTarget
        .parentElement as HTMLElement | null;
      if (!headerCell) return;
      const width = headerCell.getBoundingClientRect().width;
      setResizing({ key, startX: event.clientX, startWidth: width });
    },
    [features.columnResize],
  );

  const isBulkActionDisabled = useCallback(
    () => selectedRows.length === 0 || !!activePendingConfirm,
    [selectedRows.length, activePendingConfirm],
  );

  const handleBulkActionClick = useCallback(
    (idx: number) => async () => {
      const action = resolvedBulkActions[idx];
      if (!action || 'render' in action) return;
      if (isBulkActionDisabled()) return;
      if (action.confirm) {
        setPendingConfirm({ idx, text: action.confirm });
        return;
      }
      const shouldClear = await action.onAction(selectedRows);
      if (shouldClear !== false) clearSelection();
    },
    [resolvedBulkActions, isBulkActionDisabled, selectedRows, clearSelection],
  );

  const confirmPendingAction = useCallback(async () => {
    if (!activePendingConfirm) return;
    const action = resolvedBulkActions[activePendingConfirm.idx];
    if (!action || 'render' in action) {
      setPendingConfirm(null);
      return;
    }
    setPendingConfirm(null);
    const shouldClear = await action.onAction(selectedRows);
    if (shouldClear !== false) clearSelection();
  }, [activePendingConfirm, resolvedBulkActions, selectedRows, clearSelection]);

  const cancelPendingAction = useCallback(() => {
    setPendingConfirm(null);
  }, []);

  return {
    data: sortedData,
    meta,
    page,
    setPage,
    limit,
    setLimit,
    search,
    setSearch,
    searchInput,
    setSearchInput,
    customLimit,
    setCustomLimit,
    localFilters,
    setLocalFilters,
    filters,
    updateFilter,
    clearFilter,
    sortConfig,
    requestSort,
    loading,
    errorMessage,
    refresh: () => setRefreshKey((k) => k + 1),
    handleSearch,
    handleSearchInputChange,
    handleSearchKeyDown,
    handleFilter,
    handleFilterInputChange,
    handleFilterKeyDown,
    clearLocalFilter,
    handleCustomLimitChange,
    applyCustomLimit,
    columnVisibility,
    setColumnVisibility,
    columnOrder,
    setColumnOrder,
    columnWidths,
    setColumnWidths,
    columnPinning,
    setColumnPinning,
    draggingKey,
    setDraggingKey,
    pendingConfirm,
    setPendingConfirm,
    selectedKeys,
    setSelectedKeys,
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
    selectionOffset,
    allSelectedOnPage,
    toggleAllOnPage,
    isSelected,
    toggleRow,
    clearSelection,
    isBulkActionDisabled,
    handleBulkActionClick,
    confirmPendingAction,
    cancelPendingAction,
    selectedKeyCount: selectedKeys.size,
  };
}
