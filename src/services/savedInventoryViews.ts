import {
  itemStates,
  itemStatuses,
  operationalStatuses,
} from '../types/inventory';
import type { InventoryColumnKey, ItemState, ItemStatus, OperationalStatus } from '../types/inventory';
import type { InventoryFilters, SavedInventoryView, SavedInventoryViewDraft } from '../types/inventoryViews';
import { inventoryColumnOptions } from './inventoryReports';

export type KeyValueStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

export type SavedInventoryViewRepository = {
  list: (userId: string) => Promise<SavedInventoryView[]>;
  getDefault: (userId: string) => Promise<string | null>;
  setDefault: (userId: string, id: string | null) => Promise<void>;
  create: (userId: string, draft: SavedInventoryViewDraft) => Promise<SavedInventoryView>;
  update: (userId: string, id: string, changes: Partial<SavedInventoryViewDraft>) => Promise<SavedInventoryView>;
  remove: (userId: string, id: string) => Promise<void>;
};

const storageKeyForUser = (userId: string) => `cbmsp:inventory-views:v1:${encodeURIComponent(userId)}`;
const defaultStorageKeyForUser = (userId: string) => `${storageKeyForUser(userId)}:default`;
const validColumnKeys = new Set(inventoryColumnOptions.map(({ key }) => key));

export const normalizeInventoryFilters = (filters: InventoryFilters | null): InventoryFilters | null => {
  if (!filters) return null;
  const normalized: InventoryFilters = {
    ...(filters.query ? { query: filters.query } : {}),
    ...(filters.types?.length ? { types: Array.from(new Set(filters.types)) } : {}),
    ...(filters.statuses?.length ? { statuses: Array.from(new Set(filters.statuses)) } : {}),
    ...(filters.states?.length ? { states: Array.from(new Set(filters.states)) } : {}),
    ...(filters.operationalStatuses?.length ? { operationalStatuses: Array.from(new Set(filters.operationalStatuses)) } : {}),
  };
  return Object.keys(normalized).length ? normalized : null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const stringValues = (value: unknown) =>
  Array.isArray(value) ? Array.from(new Set(value.filter((entry): entry is string => typeof entry === 'string'))) : [];

const enumValues = <T extends string>(value: unknown, allowed: readonly T[]): T[] =>
  stringValues(value).filter((entry): entry is T => allowed.includes(entry as T));

const sanitizeFilters = (value: unknown): InventoryFilters | null => {
  if (!isRecord(value)) return null;
  const statuses = enumValues<ItemStatus>(value.statuses, itemStatuses);
  const states = enumValues<ItemState>(value.states, itemStates);
  const operationalStatusFilters = enumValues<OperationalStatus>(value.operationalStatuses, operationalStatuses);
  return normalizeInventoryFilters({
    ...(typeof value.query === 'string' ? { query: value.query } : {}),
    types: stringValues(value.types),
    statuses,
    states,
    operationalStatuses: operationalStatusFilters,
  });
};

const sanitizeColumns = (value: unknown): InventoryColumnKey[] => {
  const columns = stringValues(value).filter((column): column is InventoryColumnKey => validColumnKeys.has(column as InventoryColumnKey));
  const uniqueColumns = Array.from(new Set(columns));
  return uniqueColumns.includes('nrPatrimonio') ? uniqueColumns : ['nrPatrimonio', ...uniqueColumns];
};

const parseSavedView = (value: unknown): SavedInventoryView | null => {
  if (!isRecord(value) || value.version !== 1) return null;
  if (typeof value.id !== 'string' || typeof value.name !== 'string' || !value.name.trim()) return null;
  if (typeof value.createdAt !== 'string' || typeof value.updatedAt !== 'string') return null;
  if (!Number.isFinite(Date.parse(value.createdAt)) || !Number.isFinite(Date.parse(value.updatedAt))) return null;
  return {
    id: value.id,
    name: value.name.trim(),
    version: 1,
    filters: sanitizeFilters(value.filters),
    columns: sanitizeColumns(value.columns),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
};

const createId = () => `view-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const prepareDraft = (draft: SavedInventoryViewDraft) => {
  const name = draft.name.trim();
  if (!name) throw new Error('Informe um nome para o template.');
  return {
    name,
    filters: normalizeInventoryFilters(draft.filters),
    columns: sanitizeColumns(draft.columns),
  };
};

export const createSavedInventoryViewRepository = (storage: KeyValueStorage): SavedInventoryViewRepository => {
  const list = async (userId: string) => {
    const stored = await storage.getItem(storageKeyForUser(userId));
    if (!stored) return [];

    try {
      const parsed: unknown = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map(parseSavedView)
        .filter((view): view is SavedInventoryView => view !== null)
        .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));
    } catch {
      return [];
    }
  };

  const write = async (userId: string, views: SavedInventoryView[]) => {
    await storage.setItem(storageKeyForUser(userId), JSON.stringify(views));
  };

  return {
    list,
    async getDefault(userId) {
      const id = await storage.getItem(defaultStorageKeyForUser(userId));
      return id || null;
    },
    async setDefault(userId, id) {
      if (id && !(await list(userId)).some((view) => view.id === id)) {
        throw new Error('Template padrão não encontrado.');
      }
      await storage.setItem(defaultStorageKeyForUser(userId), id ?? '');
    },
    async create(userId, draft) {
      const now = new Date().toISOString();
      const view: SavedInventoryView = {
        id: createId(),
        version: 1,
        ...prepareDraft(draft),
        createdAt: now,
        updatedAt: now,
      };
      const views = await list(userId);
      await write(userId, [view, ...views]);
      const currentDefault = await storage.getItem(defaultStorageKeyForUser(userId));
      if (!currentDefault || !views.some((existing) => existing.id === currentDefault)) {
        await storage.setItem(defaultStorageKeyForUser(userId), view.id);
      }
      return view;
    },
    async update(userId, id, changes) {
      const views = await list(userId);
      const target = views.find((view) => view.id === id);
      if (!target) throw new Error('Template não encontrado.');
      const updated: SavedInventoryView = {
        ...target,
        ...prepareDraft({
          name: changes.name ?? target.name,
          filters: changes.filters === undefined ? target.filters : changes.filters,
          columns: changes.columns ?? target.columns,
        }),
        updatedAt: new Date().toISOString(),
      };
      await write(userId, views.map((view) => view.id === id ? updated : view));
      return updated;
    },
    async remove(userId, id) {
      const views = await list(userId);
      const remaining = views.filter((view) => view.id !== id);
      await write(userId, remaining);
      const currentDefault = await storage.getItem(defaultStorageKeyForUser(userId));
      if (currentDefault === id || (currentDefault && !remaining.some((view) => view.id === currentDefault))) {
        await storage.setItem(defaultStorageKeyForUser(userId), remaining[0]?.id ?? '');
      }
    },
  };
};

export const browserKeyValueStorage: KeyValueStorage = {
  async getItem(key) {
    return window.localStorage.getItem(key);
  },
  async setItem(key, value) {
    window.localStorage.setItem(key, value);
  },
};
