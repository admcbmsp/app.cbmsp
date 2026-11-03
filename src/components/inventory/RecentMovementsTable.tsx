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
    <DynamicDataTable
      ariaLabel="Movimentações recentes"
      rows={movements}
      columns={recentMovementColumns}
      getRowKey={({ entry }) => entry.id}
      getRowLabel={({ item, entry }) => `${inventoryHistoryActionLabels[entry.action]} do item ${item.description}, patrimônio ${item.nrPatrimonio}`}
      onRowClick={onActivate}
      pagination={false}
      emptyState="Nenhuma movimentação registrada."
    />
  );
}
