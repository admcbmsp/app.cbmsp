import type { AppPage, City, ItemState, ItemStatus, OperationalStatus } from '../types/inventory';
import { cityOptions, itemStates, itemStatuses, operationalStatuses as operationalStatusOptions } from '../types/inventory';
import type { InventoryFilters } from '../types/inventoryViews';

export type AppRoute = {
  page: AppPage;
  filter: InventoryFilters | null;
  unit: City | null;
  hasUnit: boolean;
  description: string | null;
};

const routablePages: AppPage[] = ['dashboard', 'inventory', 'details', 'users', 'profile'];

export const isValidAppRouteHash = (hash: string) => {
  const [rawPath, rawQuery = ''] = hash.replace(/^#/, '').split('?');
  const routeName = (rawPath ?? '').replace(/^\/+|\/+$/g, '');
  if (routeName === 'login') return true;
  if (!routablePages.includes(routeName as AppPage)) return false;
  if (routeName !== 'details') return true;
  return Boolean(new URLSearchParams(rawQuery).get('description')?.trim());
};

const parseUnitParameter = (params: URLSearchParams) => {
  const value = params.get('unit');
  if (value === 'all') return { unit: null, hasUnit: true };
  if (cityOptions.includes(value as City)) return { unit: value as City, hasUnit: true };
  return { unit: null, hasUnit: false };
};

const parseInventoryFilter = (params: URLSearchParams): InventoryFilters | null => {
  const statuses = Array.from(new Set(params.getAll('status').filter((status): status is ItemStatus => itemStatuses.includes(status as ItemStatus))));
  const states = Array.from(new Set(params.getAll('state').filter((state): state is ItemState => itemStates.includes(state as ItemState))));
  const operationalStatuses = Array.from(new Set(params.getAll('operationalStatus').filter((status): status is OperationalStatus => operationalStatusOptions.includes(status as OperationalStatus))));
  const types = Array.from(new Set(params.getAll('type').filter(Boolean)));
  const query = params.get('q') ?? '';
  const filter: InventoryFilters = {
    ...(query ? { query } : {}),
    ...(types.length ? { types } : {}),
    ...(statuses.length ? { statuses } : {}),
    ...(states.length ? { states } : {}),
    ...(operationalStatuses.length ? { operationalStatuses } : {}),
  };

  return Object.keys(filter).length > 0 ? filter : null;
};

export const parseAppRoute = (hash: string): AppRoute => {
  const [rawPath, rawQuery = ''] = hash.replace(/^#/, '').split('?');
  const routeName = (rawPath ?? '').replace(/^\/+|\/+$/g, '');
  const requestedPage = routablePages.includes(routeName as AppPage) ? routeName as AppPage : 'dashboard';
  const params = new URLSearchParams(rawQuery);
  const requestedDescription = requestedPage === 'details' ? params.get('description')?.trim() || null : null;
  const page = requestedPage === 'details' && requestedDescription === null ? 'inventory' : requestedPage;
  const isInventoryRoute = page === 'inventory' || page === 'details';

  return {
    page,
    filter: isInventoryRoute ? parseInventoryFilter(params) : null,
    description: page === 'details' ? requestedDescription : null,
    ...parseUnitParameter(params),
  };
};

export const getAppRouteHash = (
  page: AppPage,
  filter: InventoryFilters | null = null,
  unit?: City | null,
  description?: string | null,
) => {
  const routePage: AppPage = page === 'details' && !description?.trim() ? 'inventory' : page;
  const params = new URLSearchParams();
  if (routePage === 'details' && description?.trim()) params.set('description', description.trim());
  if (unit === null) params.set('unit', 'all');
  else if (unit) params.set('unit', unit);
  if ((routePage === 'inventory' || routePage === 'details') && filter?.query) params.set('q', filter.query);
  if (routePage === 'inventory' || routePage === 'details') filter?.types?.forEach((type) => params.append('type', type));
  if (routePage === 'inventory' || routePage === 'details') filter?.statuses?.forEach((status) => params.append('status', status));
  if (routePage === 'inventory' || routePage === 'details') filter?.states?.forEach((state) => params.append('state', state));
  if (routePage === 'inventory' || routePage === 'details') filter?.operationalStatuses?.forEach((status) => params.append('operationalStatus', status));
  const query = params.toString();
  return `#/${routePage}${query ? `?${query}` : ''}`;
};

export const updateAppRouteUrl = (
  page: AppPage,
  filter: InventoryFilters | null = null,
  replace = false,
  unit?: City | null,
  description?: string | null,
) => {
  const nextHash = getAppRouteHash(page, filter, unit, description);
  if (window.location.hash === nextHash) return;
  if (replace) {
    window.history.replaceState(window.history.state, '', nextHash);
  } else {
    window.history.pushState(window.history.state, '', nextHash);
  }
};
