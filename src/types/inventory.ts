export type UserRole = 'reader' | 'almoxarife' | 'adm';

export enum City {
  EB_HOLAMBRA = 'EB HOLAMBRA',
  EB_ITAPIRA = 'EB ITAPIRA',
  EB_JAGUARIUNA = 'EB JAGUARIÚNA',
  EB_MOGI_GUACU = 'EB MOGI GUAÇU',
  EB_PAULINIA = 'EB PAULÍNIA',
  EB_SA_POSSE = 'EB SA POSSE',
}

export const cityOptions: City[] = Object.values(City);

export type ItemStatus = 'active' | 'deactivated' | 'pending' | 'rejected';

export type ItemState = 'novo' | 'bom' | 'regular';

export type OperationalStatus = 'operacional' | 'em-manutencao' | 'inservivel' | 'em-transito';

export type InventoryColumnKey = 'item' | 'nrPatrimonio' | 'uuid' | 'type' | 'cidade' | 'state' | 'operationalStatus' | 'valor' | 'status' | 'lastTimeTouched';

export type InventoryHistoryAction = 'created' | 'edited' | 'approved' | 'rejected' | 'moved' | 'deactivated';

export type InventoryHistoryEntry = {
  id: string;
  action: InventoryHistoryAction;
  userId: string;
  userName: string;
  timestamp: string;
  summary: string;
  previousStatus?: ItemStatus;
  nextStatus?: ItemStatus;
  previousCity?: City;
  nextCity?: City;
};

export type AppPage = 'dashboard' | 'inventory' | 'users' | 'profile';

export type InventoryItem = {
  uuid: string;
  description: string;
  type: string;
  state: ItemState;
  operationalStatus: OperationalStatus;
  valor: number;
  quantidade: 1;
  nrPatrimonio: string;
  status: ItemStatus;
  cidade: City;
  lastTimeTouched: string;
  history: InventoryHistoryEntry[];
};

export type AppUser = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  patente: string;
  unidade: City | '';
  telefoneContato: string;
};

export type InventoryFormValues = Omit<InventoryItem, 'uuid' | 'lastTimeTouched' | 'history'>;

export const roleLabels: Record<UserRole, string> = {
  reader: 'Leitor',
  almoxarife: 'Almoxarife',
  adm: 'Administrador',
};

export const userRoles: UserRole[] = Object.keys(roleLabels) as UserRole[];

export const statusLabels: Record<ItemStatus, string> = {
  active: 'Ativo',
  deactivated: 'Desativado',
  pending: 'Pendente',
  rejected: 'Rejeitado',
};

export const stateLabels: Record<ItemState, string> = {
  novo: 'Novo',
  bom: 'Bom',
  regular: 'Regular',
};

export const operationalStatusLabels: Record<OperationalStatus, string> = {
  operacional: 'Operacional',
  'em-manutencao': 'Em manutenção',
  inservivel: 'Inservível',
  'em-transito': 'Em trânsito (FMM)',
};

export const itemStates: ItemState[] = [
  'novo',
  'bom',
  'regular',
];

export const operationalStatuses: OperationalStatus[] = [
  'operacional',
  'em-manutencao',
  'inservivel',
  'em-transito',
];

export const itemStatuses: ItemStatus[] = [
  'active',
  'pending',
  'rejected',
  'deactivated',
];
