import type { ExportColumn } from '../utils/exports';
import { operationalStatusLabels, stateLabels, statusLabels } from '../types/inventory';
import type { InventoryColumnKey, InventoryItem } from '../types/inventory';
import { formatCurrency, formatDateTime, getCityLabel, getTypeLabel } from '../utils/inventory';

export type { InventoryColumnKey } from '../types/inventory';

export const inventoryColumnOptions: Array<{ key: InventoryColumnKey; label: string }> = [
  { key: 'nrPatrimonio', label: 'Número de patrimônio' },
  { key: 'item', label: 'Descrição do cadastro' },
  { key: 'uuid', label: 'UUID' },
  { key: 'type', label: 'Tipo' },
  { key: 'cidade', label: 'Cidade/unidade' },
  { key: 'state', label: 'Condição' },
  { key: 'operationalStatus', label: 'Status operacional' },
  { key: 'valor', label: 'Valor estimado' },
  { key: 'status', label: 'Status administrativo' },
  { key: 'lastTimeTouched', label: 'Última movimentação' },
];

export const defaultInventoryColumns: InventoryColumnKey[] = [
  'nrPatrimonio',
  'type',
  'cidade',
  'state',
  'operationalStatus',
  'status',
  'lastTimeTouched',
];

export const getInventoryReportColumns = (columnKeys: InventoryColumnKey[]): ExportColumn<InventoryItem>[] =>
  columnKeys.map((columnKey) => ({
    key: columnKey,
    label: inventoryColumnOptions.find((column) => column.key === columnKey)?.label ?? columnKey,
    getValue: (item) => {
      switch (columnKey) {
        case 'item':
          return item.description;
        case 'nrPatrimonio':
          return item.nrPatrimonio;
        case 'uuid':
          return item.uuid;
        case 'type':
          return getTypeLabel(item.type);
        case 'cidade':
          return getCityLabel(item.cidade);
        case 'state':
          return stateLabels[item.state];
        case 'operationalStatus':
          return operationalStatusLabels[item.operationalStatus];
        case 'valor':
          return formatCurrency(item.valor);
        case 'status':
          return statusLabels[item.status];
        case 'lastTimeTouched':
          return formatDateTime(item.lastTimeTouched);
        default:
          return '';
      }
    },
  }));
