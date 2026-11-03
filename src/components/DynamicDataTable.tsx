import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from './Icon';
import { TableActionMenu } from './TableActionMenu';
import type { TableAction } from './TableActionMenu';
import { COLOR_TRANSITION_CLASS } from '../theme/motion';

export type DynamicDataTableColumn<T, Key extends string = string> = {
  key: Key;
  label: string;
  renderCell: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number | null | undefined;
  locked?: boolean;
  numeric?: boolean;
};

type SortState<Key extends string> = { key: Key; direction: 'asc' | 'desc' } | null;

type DynamicDataTableProps<T, Key extends string = string> = {
  ariaLabel: string;
  rows: readonly T[];
  columns: readonly DynamicDataTableColumn<T, Key>[];
  visibleColumnKeys: Key[];
  defaultColumnKeys: Key[];
  onVisibleColumnKeysChange: (keys: Key[]) => void;
  getRowKey: (row: T) => string;
  getActions: (row: T) => TableAction[];
  getActionMenuLabel?: (row: T) => string;
  actionLabel?: string;
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
  getActionMenuLabel = () => 'Ações',
  actionLabel = 'Ações',
}: DynamicDataTableProps<T, Key>) {
  const [sort, setSort] = useState<SortState<Key>>(null);
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const columnsByKey = useMemo(() => new Map(columns.map((column) => [column.key, column])), [columns]);
  const normalizedVisibleKeys = useMemo(() => {
    const selected = Array.from(new Set(visibleColumnKeys.filter((key) => columnsByKey.has(key))));
    const lockedKeys = columns.filter((column) => column.locked).map((column) => column.key);
    return [...lockedKeys.filter((key) => !selected.includes(key)), ...selected];
  }, [columns, columnsByKey, visibleColumnKeys]);
  const visibleColumns = normalizedVisibleKeys
    .map((key) => columnsByKey.get(key))
    .filter((column): column is DynamicDataTableColumn<T, Key> => Boolean(column));
  const menuColumns = [
    ...normalizedVisibleKeys.map((key) => columnsByKey.get(key)).filter((column): column is DynamicDataTableColumn<T, Key> => Boolean(column)),
    ...columns.filter((column) => !normalizedVisibleKeys.includes(column.key)),
  ];
  const sortedColumn = sort ? visibleColumns.find((column) => column.key === sort.key && column.sortValue) : undefined;
  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((candidate) => candidate.key === sort.key && candidate.sortValue);
    if (!column?.sortValue || !visibleColumnKeys.includes(sort.key)) return rows;

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
  }, [columns, rows, sort, visibleColumnKeys]);

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
    if (column.locked) return;
    onVisibleColumnKeysChange(normalizedVisibleKeys.includes(column.key)
      ? normalizedVisibleKeys.filter((key) => key !== column.key)
      : [...normalizedVisibleKeys, column.key]);
  };

  const moveColumn = (key: Key, delta: number) => {
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
    const defaults = defaultColumnKeys.filter((key) => columnsByKey.has(key));
    const lockedKeys = columns.filter((column) => column.locked).map((column) => column.key);
    onVisibleColumnKeysChange([...lockedKeys.filter((key) => !defaults.includes(key)), ...defaults]);
  };

  return (
    <section className="min-w-0" aria-label={ariaLabel}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
        <div ref={containerRef} className="relative">
          <button
            ref={triggerRef}
            type="button"
            aria-label="Configurar colunas"
            aria-expanded={columnMenuOpen}
            aria-haspopup="true"
            onClick={() => setColumnMenuOpen((current) => !current)}
            className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium ${COLOR_TRANSITION_CLASS} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${columnMenuOpen ? 'border-primary bg-[var(--color-hover)] text-primary' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
          >
            <Icon name="columns" className="h-4 w-4" />
            Colunas
            <span className="text-xs text-slate-400">{visibleColumns.length}/{columns.length}</span>
          </button>
          {columnMenuOpen && (
            <div role="group" aria-label="Colunas da tabela" className="absolute left-0 top-[calc(100%+0.5rem)] z-50 flex max-h-[min(22rem,calc(100vh-8rem))] w-64 flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
              <div className="flex items-baseline gap-2 border-b border-slate-100 px-3 py-2">
                <span className="text-xs font-semibold text-slate-800">Colunas</span>
                <span className="text-xs text-slate-400">{visibleColumns.length}/{columns.length}</span>
              </div>
              <div className="overflow-y-auto py-1">
                {menuColumns.map((column) => {
                  const selectedIndex = normalizedVisibleKeys.indexOf(column.key);
                  const selected = selectedIndex >= 0;
                  return (
                    <div key={column.key} className={`flex min-h-10 items-center gap-2 px-2 ${column.locked ? 'text-slate-400' : 'text-slate-700 hover:bg-slate-50'}`}>
                      <span className="flex w-5 shrink-0 flex-col items-center">
                        <button type="button" aria-label={`Mover ${column.label} para cima`} disabled={!selected || selectedIndex === 0} onClick={() => moveColumn(column.key, -1)} className="flex h-4 w-5 items-center justify-center rounded-sm text-slate-500 hover:bg-slate-200 disabled:opacity-30">
                          <Icon name="chevron-up" className="h-3 w-3" />
                        </button>
                        <button type="button" aria-label={`Mover ${column.label} para baixo`} disabled={!selected || selectedIndex === normalizedVisibleKeys.length - 1} onClick={() => moveColumn(column.key, 1)} className="flex h-4 w-5 items-center justify-center rounded-sm text-slate-500 hover:bg-slate-200 disabled:opacity-30">
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
              <div className="flex items-center border-t border-slate-100 px-2 py-1">
                <button type="button" onClick={resetColumns} className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100">Restaurar</button>
                <button type="button" onClick={() => setColumnMenuOpen(false)} className="ml-auto rounded-md px-2 py-1 text-sm font-medium text-slate-800 hover:bg-slate-100">Concluir</button>
              </div>
            </div>
          )}
        </div>
        <span className="text-xs text-slate-400">Clique no título para ordenar</span>
      </div>

      <div className="overflow-x-auto">
        <table aria-label={ariaLabel} className="min-w-max w-full text-left text-sm">
          <thead className="bg-slate-50/80 text-[10px] uppercase tracking-[0.13em] text-slate-500">
            <tr>
              {visibleColumns.map((column) => {
                const direction = sort?.key === column.key ? sort.direction : null;
                return (
                  <th key={column.key} scope="col" aria-sort={direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none'} className={`px-4 py-3 font-bold first:pl-5 sm:first:pl-6 ${column.numeric ? 'text-right' : ''}`}>
                    {column.sortValue ? (
                      <button type="button" onClick={() => toggleSort(column.key)} className={`inline-flex items-center gap-1.5 ${column.numeric ? 'ml-auto' : ''} rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary`}>
                        {column.label}
                        {direction && <Icon name={direction === 'asc' ? 'arrow-up' : 'arrow-down'} className="h-3 w-3" />}
                      </button>
                    ) : column.label}
                  </th>
                );
              })}
              <th scope="col" aria-sort="none" className="sticky right-0 z-10 bg-slate-50 px-4 py-3 text-right font-bold sm:px-6">{actionLabel}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedRows.map((row) => (
              <tr key={getRowKey(row)} className={`group ${COLOR_TRANSITION_CLASS} hover:bg-slate-50/70`}>
                {visibleColumns.map((column) => (
                  <td key={column.key} className={`px-4 py-4 first:pl-5 sm:first:pl-6 ${column.numeric ? 'text-right tabular-nums' : ''}`}>
                    {column.renderCell(row)}
                  </td>
                ))}
                <td data-row-actions className="sticky right-0 z-[1] bg-white px-4 py-4 text-right transition-colors duration-150 group-hover:bg-slate-50/70 sm:px-6">
                  <TableActionMenu label={getActionMenuLabel(row)} actions={getActions(row)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sortedColumn && <span className="sr-only" aria-live="polite">Ordenado por {sortedColumn.label}, {sort?.direction === 'asc' ? 'crescente' : 'decrescente'}.</span>}
    </section>
  );
}
