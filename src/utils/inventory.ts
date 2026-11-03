import {
  AppUser,
  City,
  InventoryItem,
  ItemState,
  ItemStatus,
  OperationalStatus,
  UserRole,
  operationalStatusLabels,
  roleLabels,
  stateLabels,
  statusLabels,
} from '../types/inventory';

export const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export const formatCurrency = (value: number) => currencyFormatter.format(value);

export const formatQuantity = (value: number) =>
  new Intl.NumberFormat('pt-BR').format(value);

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

export const formatDateTime = (value: string) => dateTimeFormatter.format(new Date(value));

export const getCityLabel = (city: City) => city
  .replace(/^EB\s+/i, '')
  .toLocaleLowerCase('pt-BR')
  .replace(/(^|\s)\S/g, (part) => part.toLocaleUpperCase('pt-BR'));

export const itemsForUnit = (items: InventoryItem[], unit: City | null) =>
  unit ? items.filter((item) => item.cidade === unit) : items;

export const visibleItemsForRole = (
  items: InventoryItem[],
  role: UserRole,
) => {
  if (role === 'reader') {
    return items.filter((item) => item.status === 'active');
  }

  if (role === 'almoxarife') {
    return items.filter((item) => item.status !== 'deactivated' && item.status !== 'rejected');
  }

  return items;
};

export const canCreateItems = (role: UserRole) =>
  role === 'almoxarife' || role === 'adm';

export const canEditItem = (role: UserRole) =>
  role === 'almoxarife' || role === 'adm';

export const canEditAdministrativeFields = (role: UserRole) => role === 'adm';

export const getRoleLabel = (role: UserRole) => roleLabels[role];

export const getUserDisplayName = (user: Pick<AppUser, 'firstName' | 'lastName' | 'patente'>) =>
  [user.patente.trim(), user.firstName.trim(), user.lastName.trim()].filter(Boolean).join(' ');

export const getStatusLabel = (status: ItemStatus) => statusLabels[status];

export const getStateLabel = (state: ItemState) => stateLabels[state];

export const getOperationalStatusLabel = (status: OperationalStatus) => operationalStatusLabels[status];

export const getInitials = (user: AppUser) =>
  [user.firstName, user.lastName]
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0])
    .join('')
    .toUpperCase();

export const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    viatura: 'Viatura',
    mangueira: 'Mangueira',
    resgate: 'Resgate',
    epi: 'EPI',
    ferramenta: 'Ferramenta',
    comunicacao: 'Comunicação',
    infraestrutura: 'Infraestrutura',
  };

  return labels[type] ?? type;
};

export const getTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    viatura: 'VTR',
    mangueira: 'MG',
    resgate: 'RS',
    epi: 'EP',
    ferramenta: 'FR',
    comunicacao: 'CM',
    infraestrutura: 'IF',
  };

  return icons[type] ?? 'IT';
};


export const descriptionKey = (description: string) => description.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ');

export const hasApprovedRegistration = (items: InventoryItem[], description: string) =>
  items.some((item) => descriptionKey(item.description) === descriptionKey(description)
    && (item.status === 'active' || item.history.some((entry) => entry.action === 'approved' || entry.nextStatus === 'active')));
