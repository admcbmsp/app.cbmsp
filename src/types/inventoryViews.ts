import type { InventoryColumnKey, ItemState, ItemStatus, OperationalStatus } from './inventory';

export type InventoryGroupColumnKey = 'description' | 'total' | `operational:${OperationalStatus}` | `status:${ItemStatus}`;

export const defaultInventoryGroupColumns: InventoryGroupColumnKey[] = [
  'description',
  'total',
  'operational:operacional',
];

export type InventoryFilters = {
  query?: string;
  types?: string[];
  statuses?: ItemStatus[];
  states?: ItemState[];
  operationalStatuses?: OperationalStatus[];
};

export type SavedInventoryView = {
  id: string;
  name: string;
  version: 2;
  filters: InventoryFilters | null;
  columns: InventoryColumnKey[];
  groupColumns: InventoryGroupColumnKey[];
  createdAt: string;
  updatedAt: string;
};

export type SavedInventoryViewDraft = Pick<SavedInventoryView, 'name' | 'filters' | 'columns' | 'groupColumns'>;
