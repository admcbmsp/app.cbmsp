// Operational documentation: ./DynamicDataTable.operations.md
import { ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';
import { ListPaginationFooter } from './ListPaginationFooter';
import type { PaginationPageSize } from './ListPaginationFooter';
import { TableActionMenu } from './TableActionMenu';
import type { TableAction } from './TableActionMenu';
import { COLOR_TRANSITION_CLASS } from '../theme/motion';

export type DynamicDataTableColumn<T, Key extends string = string> = {
  key: Key;
  label: string;
  renderCell: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number | null | undefined;
  align?: TableTextAlignment;
  locked?: boolean;
  numeric?: boolean;
};

export type TableTextAlignment = 'start' | 'center' | 'end';

const textAlignmentClasses: Record<TableTextAlignment, string> = {
  start: 'text-start',
  center: 'text-center',
  end: 'text-end',
};

const contentJustificationClasses: Record<TableTextAlignment, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
};

type SortState<Key extends string> = { key: Key; direction: 'asc' | 'desc' } | null;

type DynamicDataTableProps<T, Key extends string = string> = {
  ariaLabel: string;
  rows: readonly T[];
  columns: readonly DynamicDataTableColumn<T, Key>[];
  visibleColumnKeys?: Key[];
  defaultColumnKeys?: Key[];
  onVisibleColumnKeysChange?: (keys: Key[]) => void;
  getRowKey: (row: T) => string;
  getActions?: (row: T) => TableAction[];
  onRowClick?: (row: T) => void;
  getRowLabel?: (row: T) => string;
  getActionMenuLabel?: (row: T) => string;
  actionLabel?: string;
  actionAlign?: TableTextAlignment;
  pagination?: boolean;
  mobileCardLayout?: 'list' | 'grid' | 'detail-grid';
  emptyState?: ReactNode;
  /** Placement for the optional column picker; null waits for an external target. */
  columnControlTarget?: HTMLDivElement | null;
};

export function DynamicDataTable<T, Key extends string = string>({
  ariaLabel,
  rows,
  columns,
  visibleColumnKeys,
  defaultColumnKeys,
  onVisibleColumnKeysChange,
  getRowKey,
  getActions,
  onRowClick,
  getRowLabel,
  getActionMenuLabel = () => 'Ações',
  actionLabel = 'Ações',
  actionAlign = 'center',
  pagination = true,
  mobileCardLayout = 'list',
  emptyState,
  columnControlTarget,
}: DynamicDataTableProps<T, Key>) {
  const [sort, setSort] = useState<SortState<Key>>(null);
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<PaginationPageSize>(10);
  const mobileSortId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const columnsByKey = useMemo(() => new Map(columns.map((column) => [column.key, column])), [columns]);
  const allColumnKeys = useMemo(() => columns.map((column) => column.key), [columns]);
  const requestedVisibleKeys = visibleColumnKeys ?? allColumnKeys;
  const normalizedVisibleKeys = useMemo(() => {
    const selected = Array.from(new Set(requestedVisibleKeys.filter((key) => columnsByKey.has(key))));
    const lockedKeys = columns.filter((column) => column.locked).map((column) => column.key);
    return [...lockedKeys.filter((key) => !selected.includes(key)), ...selected];
  }, [columns, columnsByKey, requestedVisibleKeys]);
  const visibleColumns = normalizedVisibleKeys
    .map((key) => columnsByKey.get(key))
    .filter((column): column is DynamicDataTableColumn<T, Key> => Boolean(column));
  const menuColumns = [
    ...normalizedVisibleKeys.map((key) => columnsByKey.get(key)).filter((column): column is DynamicDataTableColumn<T, Key> => Boolean(column)),
    ...columns.filter((column) => !normalizedVisibleKeys.includes(column.key)),
  ];
  const canConfigureColumns = Boolean(visibleColumnKeys && defaultColumnKeys && onVisibleColumnKeysChange);
  const hasActions = getActions !== undefined;
  const hasSortableColumns = rows.length > 0 && visibleColumns.some((column) => column.sortValue !== undefined);
  const sortedColumn = sort ? visibleColumns.find((column) => column.key === sort.key && column.sortValue) : undefined;
  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((candidate) => candidate.key === sort.key && candidate.sortValue);
    if (!column?.sortValue || !normalizedVisibleKeys.includes(sort.key)) return rows;

    const direction = sort.direction === 'asc' ? 1 : -1;
    return rows.map((row, index) => ({ row, index, value: column.sortValue?.(row) }))
      .sort((first, second) => {
        let comparison = 0;
        if (first.value == null && second.value != null) comparison = 1;
        else if (first.value != null && second.value == null) comparison = -1;
        else if (typeof first.value === 'number' && typeof second.value === 'number') comparison = first.value - second.value;
        else if (first.value != null && second.value != null) {
          comparison = String(first.value).localeCompare(String(second.value), 'pt-BR', { numeric: true, sensitivity: 'base' });
        }
        return comparison === 0 ? first.index - second.index : comparison * direction;
      })
      .map(({ row }) => row);
  }, [columns, normalizedVisibleKeys, rows, sort]);
  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const activePage = Math.max(1, Math.min(currentPage, pageCount));
  const pageRows = pagination
    ? sortedRows.slice((activePage - 1) * pageSize, activePage * pageSize)
    : sortedRows;

  useEffect(() => {
    setCurrentPage(1);
  }, [rows]);

  useEffect(() => {
    if (!columnMenuOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setColumnMenuOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setColumnMenuOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [columnMenuOpen]);

  const toggleColumn = (column: DynamicDataTableColumn<T, Key>) => {
    if (column.locked || !onVisibleColumnKeysChange) return;
    onVisibleColumnKeysChange(normalizedVisibleKeys.includes(column.key)
      ? normalizedVisibleKeys.filter((key) => key !== column.key)
      : [...normalizedVisibleKeys, column.key]);
  };

  const moveColumn = (key: Key, delta: number) => {
    if (!onVisibleColumnKeysChange) return;
    const index = normalizedVisibleKeys.indexOf(key);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= normalizedVisibleKeys.length) return;
    const next = [...normalizedVisibleKeys];
    [next[index], next[target]] = [next[target], next[index]];
    onVisibleColumnKeysChange(next);
  };

  const toggleSort = (key: Key) => {
    setSort((current) => {
      if (!current || current.key !== key) return { key, direction: 'asc' };
      if (current.direction === 'asc') return { key, direction: 'desc' };
      return null;
    });
  };

  const resetColumns = () => {
    if (!defaultColumnKeys || !onVisibleColumnKeysChange) return;
    const defaults = defaultColumnKeys.filter((key) => columnsByKey.has(key));
    const lockedKeys = columns.filter((column) => column.locked).map((column) => column.key);
    onVisibleColumnKeysChange([...lockedKeys.filter((key) => !defaults.includes(key)), ...defaults]);
  };

  const columnControl = (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Configurar colunas"
        aria-expanded={columnMenuOpen}
        aria-haspopup="true"
        onClick={() => setColumnMenuOpen((current) => !current)}
        className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium ${COLOR_TRANSITION_CLASS} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${columnMenuOpen ? 'border-primary bg-[var(--color-hover)] text-primary' : 'border-line bg-card text-foreground hover:bg-muted/50'}`}
      >
        <Icon name="columns" className="h-4 w-4" />
        Colunas
        <span className="text-xs text-muted-foreground">{visibleColumns.length}/{columns.length}</span>
      </button>
      {columnMenuOpen && (
        <div role="group" aria-label="Colunas da tabela" className="absolute left-0 top-[calc(100%+0.5rem)] z-50 flex max-h-[min(22rem,calc(100vh-8rem))] w-64 flex-col overflow-hidden rounded-md border border-line bg-card shadow-xl shadow-slate-900/10">
          <div className="flex items-baseline gap-2 border-b border-line px-3 py-2">
            <span className="text-xs font-semibold text-foreground">Colunas</span>
            <span className="text-xs text-muted-foreground">{visibleColumns.length}/{columns.length}</span>
          </div>
          <div className="overflow-y-auto py-1">
            {menuColumns.map((column) => {
              const selectedIndex = normalizedVisibleKeys.indexOf(column.key);
              const selected = selectedIndex >= 0;
              return (
                <div key={column.key} className={`flex min-h-10 items-center gap-2 px-2 ${column.locked ? 'text-muted-foreground' : 'text-foreground hover:bg-muted/50'}`}>
                  <span className="flex w-5 shrink-0 flex-col items-center">
                    <button type="button" aria-label={`Mover ${column.label} para cima`} disabled={!selected || selectedIndex === 0} onClick={() => moveColumn(column.key, -1)} className="flex h-4 w-5 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted disabled:opacity-30">
                      <Icon name="chevron-up" className="h-3 w-3" />
                    </button>
                    <button type="button" aria-label={`Mover ${column.label} para baixo`} disabled={!selected || selectedIndex === normalizedVisibleKeys.length - 1} onClick={() => moveColumn(column.key, 1)} className="flex h-4 w-5 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted disabled:opacity-30">
                      <Icon name="chevron-down" className="h-3 w-3" />
                    </button>
                  </span>
                  <label className={`flex min-w-0 flex-1 items-center gap-2.5 text-sm ${column.locked ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input type="checkbox" checked={selected} disabled={column.locked} onChange={() => toggleColumn(column)} className="h-4 w-4 shrink-0 rounded-sm accent-primary disabled:opacity-60" />
                    <span className="truncate">{column.label}</span>
                  </label>
                  {column.locked && <span className="shrink-0 text-[10px]">Obrigatória</span>}
                </div>
              );
            })}
          </div>
          <div className="flex items-center border-t border-line px-2 py-1">
            <button type="button" onClick={resetColumns} className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted/50">Restaurar</button>
            <button type="button" onClick={() => setColumnMenuOpen(false)} className="ml-auto rounded-md px-2 py-1 text-sm font-medium text-foreground hover:bg-muted/50">Concluir</button>
          </div>
        </div>
      )}
    </div>
  );
  const columnControlNode = !canConfigureColumns
    ? null
    : columnControlTarget === undefined
      ? columnControl
      : columnControlTarget === null
        ? null
        : createPortal(columnControl, columnControlTarget);

  const isRowControl = (target: EventTarget | null) =>
    target instanceof Element && Boolean(target.closest('[data-row-control], button, a, input, select, textarea, [role="button"], [role="link"]'));

  const handleRowKeyDown = (row: T, event: ReactKeyboardEvent<HTMLTableRowElement>) => {
    if (!onRowClick || isRowControl(event.target)) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onRowClick(row);
  };

  return (
    <section className="min-w-0" aria-label={ariaLabel}>
      {columnControlNode}

      {hasSortableColumns && (
        <div className="mb-2 flex flex-wrap items-center gap-2 xl:hidden">
          <label htmlFor={mobileSortId} className="text-xs font-semibold text-muted-foreground">Ordenar por</label>
          <select
            id={mobileSortId}
            value={sortedColumn ? sort?.key ?? '' : ''}
            onChange={(event) => setSort(event.target.value ? { key: event.target.value as Key, direction: 'asc' } : null)}
            className="h-9 min-w-0 flex-1 rounded-md border border-line bg-card px-2 text-sm text-foreground"
          >
            <option value="">Ordem original</option>
            {visibleColumns.filter((column) => column.sortValue).map((column) => <option key={column.key} value={column.key}>{column.label}</option>)}
          </select>
          <button
            type="button"
            aria-label={`Inverter ordem. Atual: ${sortedColumn && sort?.direction === 'desc' ? 'decrescente' : 'crescente'}`}
            disabled={!sortedColumn}
            onClick={() => setSort((current) => current ? { ...current, direction: current.direction === 'asc' ? 'desc' : 'asc' } : current)}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-line bg-card px-3 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icon name={sort?.direction === 'desc' ? 'arrow-down' : 'arrow-up'} className="h-4 w-4" />
            {sortedColumn && sort?.direction === 'desc' ? 'Decrescente' : 'Crescente'}
          </button>
        </div>
      )}

      <div className="data-table-scroll max-w-full overflow-x-auto rounded-md border border-line bg-card">
        <table role="table" aria-label={ariaLabel} className={`data-table ${mobileCardLayout !== 'list' ? 'data-table--grid' : ''} ${mobileCardLayout === 'detail-grid' ? 'data-table--detail-grid' : ''} w-max min-w-full text-center text-body text-foreground`}>
          <thead className="bg-muted/50 text-label font-medium text-foreground">
            <tr role="row">
              {visibleColumns.map((column) => {
                const direction = sort?.key === column.key ? sort.direction : null;
                return (
                  <th key={column.key} role="columnheader" scope="col" aria-label={column.label} data-align={column.align ?? 'center'} aria-sort={direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none'} className={`border-b border-line px-4 py-3 font-medium first:pl-5 sm:first:pl-6 ${textAlignmentClasses[column.align ?? 'center']}`}>
                  {column.sortValue && rows.length > 0 ? (
                      <button type="button" onClick={() => toggleSort(column.key)} className="inline-flex items-center gap-1.5 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                        {column.label}
                        {direction && <Icon name={direction === 'asc' ? 'arrow-up' : 'arrow-down'} className="h-3 w-3" />}
                      </button>
                    ) : column.label}
                  </th>
                );
              })}
              {hasActions && (
                <th role="columnheader" scope="col" data-align={actionAlign} aria-sort="none" className={`xl:sticky xl:right-0 z-10 border-b border-line bg-muted/50 px-4 py-3 font-medium sm:px-6 ${textAlignmentClasses[actionAlign]}`}>{actionLabel}</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {pageRows.map((row) => (
              <tr
                key={getRowKey(row)}
                role="row"
                aria-label={onRowClick ? getRowLabel?.(row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={(event) => {
                  if (onRowClick && !isRowControl(event.target)) onRowClick(row);
                }}
                onKeyDown={(event) => handleRowKeyDown(row, event)}
                className={`group ${COLOR_TRANSITION_CLASS} even:bg-muted/60 hover:bg-muted ${onRowClick ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary' : ''}`}
              >
                {visibleColumns.map((column) => (
                  <td key={column.key} role="cell" data-label={column.label} data-align={column.align ?? 'center'} className="px-4 py-4 first:pl-5 sm:first:pl-6">
                    <div data-cell-content data-align={column.align ?? 'center'} className={`flex w-full min-w-0 items-center ${contentJustificationClasses[column.align ?? 'center']} ${textAlignmentClasses[column.align ?? 'center']} ${column.numeric ? 'tabular-nums' : ''}`}>
                      {column.renderCell(row)}
                    </div>
                  </td>
                ))}
                {hasActions && (
                  <td role="cell" data-label={actionLabel} data-align={actionAlign} data-row-actions data-row-control className="xl:sticky xl:right-0 z-[1] bg-card px-4 py-4 transition-colors duration-150 group-hover:bg-muted sm:px-6">
                    <div data-cell-content data-align={actionAlign} className={`flex w-full min-w-0 items-center ${contentJustificationClasses[actionAlign]} ${textAlignmentClasses[actionAlign]}`}>
                      <TableActionMenu label={getActionMenuLabel(row)} actions={getActions?.(row) ?? []} />
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {pageRows.length === 0 && emptyState && (
              <tr role="row">
                <td role="cell" colSpan={visibleColumns.length + Number(hasActions)} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {emptyState}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {pagination && sortedRows.length > 0 && (
        <ListPaginationFooter
          ariaLabel={ariaLabel}
          page={activePage}
          pageSize={pageSize}
          totalItems={sortedRows.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(nextPageSize) => { setPageSize(nextPageSize); setCurrentPage(1); }}
        />
      )}
      {sortedColumn && <span className="sr-only" aria-live="polite">Ordenado por {sortedColumn.label}, {sort?.direction === 'asc' ? 'crescente' : 'decrescente'}.</span>}
    </section>
  );
}
