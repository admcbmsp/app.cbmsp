import { City } from '../types/inventory';
import type { InventoryFilters } from '../types/inventoryViews';
import { getAppRouteHash, isValidAppRouteHash, parseAppRoute } from './appRouting';

test.each(['dashboard', 'inventory', 'users', 'profile'] as const)(
  'round-trips the %s navigation route and its unit scope',
  (page) => {
    const hash = getAppRouteHash(page, null, City.EB_HOLAMBRA);

    expect(parseAppRoute(hash)).toMatchObject({
      page,
      unit: City.EB_HOLAMBRA,
      hasUnit: true,
      description: null,
    });
  },
);

test('serializes grouped inventory details with its description, filters, and unit', () => {
  const description = 'Adaptador storz de engate rápido';
  const filter: InventoryFilters = {
    query: 'Adaptador',
    types: ['ferramenta'],
    statuses: ['active'],
    states: ['bom'],
    operationalStatuses: ['operacional'],
  };
  const hash = getAppRouteHash('details', filter, null, description);

  expect(hash).toContain('#/details?');
  expect(parseAppRoute(hash)).toMatchObject({
    page: 'details',
    description,
    unit: null,
    hasUnit: true,
    filter,
  });
});

test('falls back to inventory when a details route has no description', () => {
  expect(parseAppRoute('#/details?unit=all')).toMatchObject({
    page: 'inventory',
    description: null,
    unit: null,
    hasUnit: true,
  });
  expect(getAppRouteHash('details', null, null)).toBe('#/inventory?unit=all');
});

test('unknown routes return to the dashboard', () => {
  expect(parseAppRoute('#/unknown?unit=all')).toMatchObject({
    page: 'dashboard',
    filter: null,
    unit: null,
    hasUnit: true,
    description: null,
  });
  expect(isValidAppRouteHash('#/unknown?unit=all')).toBe(false);
  expect(isValidAppRouteHash('#/details?unit=all')).toBe(false);
  expect(isValidAppRouteHash('#/details?description=Adaptador')).toBe(true);
});
