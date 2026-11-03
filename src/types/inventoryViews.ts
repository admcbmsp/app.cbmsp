import type { InventoryColumnKey, ItemState, ItemStatus, OperationalStatus } from './inventory';

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
  version: 1;
  filters: InventoryFilters | null;
  columns: InventoryColumnKey[];
  createdAt: string;
  updatedAt: string;
};

export type SavedInventoryViewDraft = Pick<SavedInventoryView, 'name' | 'filters' | 'columns'>;
