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
    <footer className="mt-2 flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor={pageSizeId} className="font-medium text-foreground">Itens por página</label>
        <select
          id={pageSizeId}
          aria-label={`Itens por página da ${ariaLabel}`}
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value) as PaginationPageSize)}
          className="h-9 rounded-md border border-line bg-card px-2.5 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size}</option>)}
        </select>
        <span aria-live="polite">
          Mostrando {firstItem}–{lastItem} de {totalItems} {totalItems === 1 ? 'registro' : 'registros'}
        </span>
      </div>

      <nav aria-label={`Paginação da ${ariaLabel}`} className="flex items-center gap-2 self-end sm:self-auto">
        <button
          type="button"
          aria-label="Página anterior"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className={`inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-card text-foreground ${COLOR_TRANSITION_CLASS} hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <Icon name="chevron-left" className="h-4 w-4" />
        </button>
        <span aria-current="page" className="min-w-24 text-center text-foreground">Página {currentPage} de {pageCount}</span>
        <button
          type="button"
          aria-label="Próxima página"
          disabled={currentPage >= pageCount}
          onClick={() => onPageChange(Math.min(pageCount, currentPage + 1))}
          className={`inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-card text-foreground ${COLOR_TRANSITION_CLASS} hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <Icon name="chevron-right" className="h-4 w-4" />
        </button>
      </nav>
    </footer>
  );
}
