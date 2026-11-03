import {
  AppUser,
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

export const getStatusClasses = (status: ItemStatus) => {
  const classes: Record<ItemStatus, string> = {
    active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    rejected: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    deactivated: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  };

  return classes[status];
};

export const getStateClasses = (state: ItemState) => {
  const classes: Record<ItemState, string> = {
    novo: 'bg-sky-50 text-sky-700 ring-sky-600/20',
    bom: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
    regular: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  };

  return classes[state];
};

export const getOperationalStatusClasses = (status: OperationalStatus) => {
  const classes: Record<OperationalStatus, string> = {
    operacional: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    'em-manutencao': 'bg-amber-50 text-amber-700 ring-amber-600/20',
    inservivel: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    'em-transito': 'bg-blue-50 text-blue-700 ring-blue-600/20',
  };

  return classes[status];
};

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
