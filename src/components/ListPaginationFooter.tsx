// Operational documentation: ./ListPaginationFooter.operations.md
import { useId } from 'react';
import { Icon } from './Icon';
import { COLOR_TRANSITION_CLASS } from '../theme/motion';

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

export type PaginationPageSize = typeof PAGE_SIZE_OPTIONS[number];

type ListPaginationFooterProps = {
  ariaLabel: string;
  page: number;
  pageSize: PaginationPageSize;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: PaginationPageSize) => void;
};

export function ListPaginationFooter({
  ariaLabel,
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: ListPaginationFooterProps) {
  const pageSizeId = useId();
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.max(1, Math.min(page, pageCount));
  const firstItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <footer className="mt-2 flex flex-row flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[11px] text-muted-foreground sm:gap-3 sm:text-xs">
      <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
        <label htmlFor={pageSizeId} className="hidden font-medium text-foreground sm:inline">Itens por página</label>
        <select
          id={pageSizeId}
          aria-label={`Itens por página da ${ariaLabel}`}
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value) as PaginationPageSize)}
          className="h-8 rounded-md border border-line bg-card px-2 text-xs text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:h-9 sm:px-2.5 sm:text-sm"
        >
          {PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size}</option>)}
        </select>
        <span className="sm:hidden" aria-live="polite">
          {firstItem}–{lastItem} de {totalItems}
        </span>
        <span className="hidden sm:inline" aria-live="polite">
          Mostrando {firstItem}–{lastItem} de {totalItems} {totalItems === 1 ? 'registro' : 'registros'}
        </span>
      </div>

      <nav aria-label={`Paginação da ${ariaLabel}`} className="flex shrink-0 items-center gap-1 sm:gap-2">
        <button
          type="button"
          aria-label="Página anterior"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-md border border-line bg-card text-foreground sm:h-9 sm:w-9 ${COLOR_TRANSITION_CLASS} hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <Icon name="chevron-left" className="h-4 w-4" />
        </button>
        <span aria-current="page" className="min-w-0 text-center text-foreground sm:min-w-24">
          <span className="sm:hidden">{currentPage}/{pageCount}</span>
          <span className="hidden sm:inline">Página {currentPage} de {pageCount}</span>
        </span>
        <button
          type="button"
          aria-label="Próxima página"
          disabled={currentPage >= pageCount}
          onClick={() => onPageChange(Math.min(pageCount, currentPage + 1))}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-md border border-line bg-card text-foreground sm:h-9 sm:w-9 ${COLOR_TRANSITION_CLASS} hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <Icon name="chevron-right" className="h-4 w-4" />
        </button>
      </nav>
    </footer>
  );
}
