// Operational documentation: ./RecentMovementsTable.operations.md
import { DynamicDataTable } from '../DynamicDataTable';
import type { DynamicDataTableColumn } from '../DynamicDataTable';
import { formatDateTime } from '../../utils/inventory';
import { inventoryHistoryActionLabels } from '../../types/inventory';
import type { InventoryHistoryEntry, InventoryItem } from '../../types/inventory';

export type RecentMovement = {
  item: InventoryItem;
  entry: InventoryHistoryEntry;
};

const getMovementLabel = ({ item, entry }: RecentMovement) =>
  `${inventoryHistoryActionLabels[entry.action]} do item ${item.description}, patrimônio ${item.nrPatrimonio}`;

const getMovementCardLabel = (movement: RecentMovement) =>
  `${getMovementLabel(movement)}. ${movement.entry.summary}. Data ${formatDateTime(movement.entry.timestamp)}. Responsável ${movement.entry.userName}.`;

type RecentMovementsTableProps = {
  movements: readonly RecentMovement[];
  onActivate: (movement: RecentMovement) => void;
};

type RecentMovementColumnKey = 'item' | 'action' | 'date' | 'responsible';

const recentMovementColumns: DynamicDataTableColumn<RecentMovement, RecentMovementColumnKey>[] = [
  {
    key: 'item',
    label: 'Item',
    align: 'start',
    renderCell: ({ item }) => (
      <div className="w-full min-w-0">
        <span className="block font-medium text-foreground">{item.description}</span>
        <span className="mt-1 block text-xs text-muted-foreground">{item.nrPatrimonio}</span>
      </div>
    ),
  },
  {
    key: 'action',
    label: 'Ação',
    align: 'start',
    renderCell: ({ entry }) => (
      <div className="w-full min-w-0">
        <span className="block font-medium text-foreground">{inventoryHistoryActionLabels[entry.action]}</span>
        <span className="mt-1 block whitespace-normal text-xs leading-5 text-muted-foreground">{entry.summary}</span>
      </div>
    ),
  },
  {
    key: 'date',
    label: 'Data',
    align: 'start',
    renderCell: ({ entry }) => <time dateTime={entry.timestamp}>{formatDateTime(entry.timestamp)}</time>,
  },
  {
    key: 'responsible',
    label: 'Responsável',
    align: 'start',
    renderCell: ({ entry }) => entry.userName,
  },
];

export function RecentMovementsTable({ movements, onActivate }: RecentMovementsTableProps) {
  return (
    <>
      <div className="space-y-3 xl:hidden">
        {movements.map((movement) => (
          <button
            key={movement.entry.id}
            type="button"
            aria-label={getMovementCardLabel(movement)}
            onClick={() => onActivate(movement)}
            className="w-full rounded-md border border-line bg-card p-4 text-left text-foreground transition-colors hover:bg-muted/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span className="flex items-start justify-between gap-3">
              <span className="min-w-0 flex-1">
                <span className="block break-words font-medium">{movement.item.description}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{movement.item.nrPatrimonio}</span>
              </span>
              <span className="max-w-[45%] shrink-0 rounded-sm bg-surface-muted px-2 py-1 text-xs font-semibold leading-4 text-foreground">
                {inventoryHistoryActionLabels[movement.entry.action]}
              </span>
            </span>
            <span className="mt-3 block text-sm leading-5 text-muted-foreground">{movement.entry.summary}</span>
            <span className="mt-3 grid grid-cols-2 gap-3 border-t border-line pt-3">
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-muted-foreground">Data</span>
                <time className="mt-1 block text-sm text-foreground" dateTime={movement.entry.timestamp}>
                  {formatDateTime(movement.entry.timestamp)}
                </time>
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-muted-foreground">Responsável</span>
                <span className="mt-1 block break-words text-sm text-foreground">{movement.entry.userName}</span>
              </span>
            </span>
          </button>
        ))}
        {movements.length === 0 && (
          <p className="rounded-md border border-line bg-card px-4 py-6 text-center text-sm text-muted-foreground">
            Nenhuma movimentação registrada.
          </p>
        )}
      </div>

      <div className="hidden xl:block">
        <DynamicDataTable
          ariaLabel="Movimentações recentes"
          rows={movements}
          columns={recentMovementColumns}
          getRowKey={({ entry }) => entry.id}
          getRowLabel={getMovementLabel}
          onRowClick={onActivate}
          pagination={false}
          emptyState="Nenhuma movimentação registrada."
        />
      </div>
    </>
  );
}
