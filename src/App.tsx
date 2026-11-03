import {
  ButtonHTMLAttributes,
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Icon } from './components/Icon';
import { Dialog } from './components/Dialog';
import { OperationalStatusBadge, StateBadge, StatusBadge } from './components/inventory/StatusBadges';
import { FilterDropdown } from './components/FilterDropdown';
import { InventoryViewTemplates } from './components/InventoryViewTemplates';
import { EditUserRoleModal } from './components/users/EditUserRoleModal';
import { Label as FieldLabel, SelectInput, TextInput } from './library';
import { inventorySeed } from './data/inventory';
import { demoPassword, demoUsers } from './data/users';
import { InventoryShell } from './layouts/InventoryShell';
import { UserManagementPage } from './pages/UserManagementPage';
import { ProfilePage } from './pages/ProfilePage';
import type { UserProfileValues } from './pages/ProfilePage';
import {
  AppPage,
  AppUser,
  City,
  InventoryHistoryAction,
  InventoryHistoryEntry,
  InventoryFormValues,
  InventoryItem,
  ItemState,
  ItemStatus,
  OperationalStatus,
  UserRole,
  cityOptions,
  itemStates,
  itemStatuses,
  operationalStatuses,
  operationalStatusLabels,
  stateLabels,
  statusLabels,
} from './types/inventory';
import {
  canCreateItems,
  descriptionKey,
  hasApprovedRegistration,
  canEditAdministrativeFields,
  canEditItem,
  formatCurrency,
  formatDateTime,
  formatQuantity,
  getRoleLabel,
  getTypeIcon,
  getTypeLabel,
  getUserDisplayName,
  visibleItemsForRole,
} from './utils/inventory';
import { createCsvContent, downloadTextFile } from './utils/exports';
import type { ExportColumn } from './utils/exports';
import {
  defaultInventoryColumns,
  getInventoryReportColumns,
  inventoryColumnOptions,
} from './services/inventoryReports';
import type { InventoryColumnKey } from './services/inventoryReports';
import { normalizeInventoryFilters } from './services/savedInventoryViews';
import { createReportHtml } from './services/reportHtml';
import { openPrintReport } from './services/printReport';
import { applyTheme, getInitialTheme, ThemeMode } from './theme/theme';
import { COLOR_TRANSITION_CLASS } from './theme/motion';
import type { InventoryFilters } from './types/inventoryViews';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
};

type Toast = {
  message: string;
  tone: 'success' | 'info';
  detail?: string;
} | null;

type ModalState =
  | { mode: 'create' }
  | { mode: 'edit'; item: InventoryItem }
  | null;

type DashboardInventoryFilter =
  | { field: 'status'; value: 'active' | 'pending' }
  | { field: 'operationalStatus'; value: OperationalStatus };

type AppRoute = {
  page: AppPage;
  filter: InventoryFilters | null;
};

const parseAppRoute = (hash: string): AppRoute => {
  const [rawPath, rawQuery = ''] = hash.replace(/^#/, '').split('?');
  const routeName = (rawPath ?? '').replace(/^\/+/, '');
  const page: AppPage = routeName === 'inventory' || routeName === 'users' || routeName === 'profile' ? routeName : 'dashboard';
  if (page !== 'inventory') {
    return { page, filter: null };
  }

  const params = new URLSearchParams(rawQuery);
  const statuses = Array.from(new Set(params.getAll('status').filter((status): status is ItemStatus => itemStatuses.includes(status as ItemStatus))));
  const states = Array.from(new Set(params.getAll('state').filter((state): state is ItemState => itemStates.includes(state as ItemState))));
  const operationalStatusFilters = Array.from(new Set(params.getAll('operationalStatus').filter((status): status is OperationalStatus => operationalStatuses.includes(status as OperationalStatus))));
  const types = Array.from(new Set(params.getAll('type').filter(Boolean)));
  const query = params.get('q') ?? '';
  const filter: InventoryFilters = {
    ...(query ? { query } : {}),
    ...(types.length ? { types } : {}),
    ...(statuses.length ? { statuses } : {}),
    ...(states.length ? { states } : {}),
    ...(operationalStatusFilters.length ? { operationalStatuses: operationalStatusFilters } : {}),
  };

  return { page, filter: Object.keys(filter).length > 0 ? filter : null };
};

const getAppRouteHash = (page: AppPage, filter: InventoryFilters | null = null) => {
  const params = new URLSearchParams();
  if (page === 'inventory' && filter?.query) params.set('q', filter.query);
  if (page === 'inventory') filter?.types?.forEach((type) => params.append('type', type));
  if (page === 'inventory') filter?.statuses?.forEach((status) => params.append('status', status));
  if (page === 'inventory') filter?.states?.forEach((state) => params.append('state', state));
  if (page === 'inventory') filter?.operationalStatuses?.forEach((status) => params.append('operationalStatus', status));
  const query = params.toString();
  return `#/${page}${query ? `?${query}` : ''}`;
};

const updateAppRouteUrl = (page: AppPage, filter: InventoryFilters | null = null, replace = false) => {
  const nextHash = getAppRouteHash(page, filter);
  if (window.location.hash === nextHash) return;
  if (replace) {
    window.history.replaceState(window.history.state, '', nextHash);
  } else {
    window.history.pushState(window.history.state, '', nextHash);
  }
};

const itemTypeOptions = [
  'viatura',
  'mangueira',
  'resgate',
  'epi',
  'ferramenta',
  'comunicacao',
  'infraestrutura',
];

const normalizeSearchText = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const historyActionLabels: Record<InventoryHistoryAction, string> = {
  created: 'Criado',
  edited: 'Editado',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  moved: 'Movimentado',
  deactivated: 'Desativado',
};

const createUuid = () => {
  const segment = () => Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0');
  return `${segment()}-${segment().slice(0, 4)}-4${segment().slice(0, 3)}-8${segment().slice(0, 3)}-${segment()}${segment().slice(0, 4)}`;
};

const createPatrimonyNumber = () =>
  `CBM-MOCK-${Date.now().toString(36).slice(-6).toUpperCase()}`;

const createHistoryEntry = (
  user: AppUser,
  action: InventoryHistoryAction,
  summary: string,
  fields: Partial<Pick<InventoryHistoryEntry, 'previousStatus' | 'nextStatus' | 'previousCity' | 'nextCity'>> = {},
): InventoryHistoryEntry => ({
  id: `history-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  action,
  userId: user.id,
  userName: user.name,
  timestamp: new Date().toISOString(),
  summary,
  ...fields,
});

function Button({ children, variant = 'primary', className = '', ...props }: ButtonProps) {
  const variants: Record<ButtonVariant, string> = {
    primary:
      'bg-primary text-white shadow-sm shadow-[var(--color-shadow)] hover:bg-primary-strong focus-visible:outline-primary',
    secondary:
      'bg-slate-900 text-white shadow-sm shadow-slate-900/10 hover:bg-slate-800 focus-visible:outline-slate-900',
    ghost:
      'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-slate-400',
    danger:
      'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 hover:bg-rose-100 focus-visible:outline-rose-600',
  };

  return (
    <button
      {...props}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${COLOR_TRANSITION_CLASS} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

function IconButton({
  label,
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return (
    <button
      {...props}
      aria-label={label}
      title={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 ${COLOR_TRANSITION_CLASS} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${className}`}
    >
      {children}
    </button>
  );
}

function LoginScreen({ users, onLogin }: { users: AppUser[]; onLogin: (user: AppUser) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const user = users.find((candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase());

    if (!user || password !== demoPassword) {
      setError('Use um dos usuários demonstrativos e a senha 123456.');
      return;
    }

    setError('');
    onLogin(user);
  };

  const chooseDemoUser = (user: AppUser) => {
    setEmail(user.email);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#0b1224] text-white">
      <div className="mx-auto grid min-h-screen max-w-[1500px] lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden overflow-hidden px-12 py-12 lg:flex lg:flex-col lg:justify-between xl:px-20">
          <div className="absolute -left-28 top-20 h-80 w-80 rounded-full bg-[var(--color-focus)] blur-3xl" />
          <div className="absolute -bottom-20 right-10 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-[var(--color-shadow)]">
              <Icon name="flame" className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-[0.18em] text-white">CBM SP</p>
              <p className="text-xs text-slate-400">Gestão patrimonial</p>
            </div>
          </div>

          <div className="relative max-w-xl pb-10">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.25em] text-primary">Protótipo operacional · v0.1</p>
            <h1 className="max-w-2xl text-5xl font-semibold leading-[1.08] tracking-tight text-white xl:text-6xl">
              Equipamento pronto é resposta mais rápida.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
              Um primeiro olhar sobre o patrimônio que sustenta cada atendimento: viaturas, proteção, resgate e infraestrutura.
            </p>
            <div className="mt-10 grid max-w-lg grid-cols-3 gap-3">
              {[
                ['140', 'patrimônios importados'],
                ['03', 'níveis de acesso'],
                ['100%', 'dados locais'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
                  <p className="text-2xl font-semibold text-white">{value}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="relative text-xs text-slate-500">Ambiente demonstrativo · sem conexão com sistemas reais</p>
        </section>

        <section className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-8 text-slate-900 sm:px-8 lg:rounded-l-[2.5rem] lg:px-16">
          <div className="w-full max-w-md">
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white">
                <Icon name="flame" className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold tracking-[0.18em] text-slate-900">CBM SP</p>
                <p className="text-xs text-slate-500">Gestão patrimonial</p>
              </div>
            </div>

            <div className="mb-8">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">Bem-vindo de volta</p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">Entrar no almoxarifado</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">Use uma conta demonstrativa para explorar as permissões do protótipo.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <FieldLabel htmlFor="login-email">E-mail</FieldLabel>
                <TextInput id="login-email" type="email" autoComplete="username" placeholder="seu@email.com" value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="login-password">Senha</FieldLabel>
                  <span className="mb-2 text-xs font-medium text-slate-400">demo: 123456</span>
                </div>
                <TextInput id="login-password" type="password" autoComplete="current-password" placeholder="Digite sua senha" value={password} onChange={(event) => setPassword(event.target.value)} />
              </div>

              {error && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full">
                Entrar no protótipo
                <Icon name="arrow-up-right" className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-10 border-t border-slate-200 pt-6">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Acesso rápido por perfil</p>
              <div className="mt-3 space-y-2">
                {users.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => chooseDemoUser(user)}
                    className={`flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left ${COLOR_TRANSITION_CLASS} hover:border-primary hover:bg-[var(--color-hover)]`}
                  >
                    <span>
                      <span className="block text-sm font-semibold text-slate-800">{user.name}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">{user.email}</span>
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">{getRoleLabel(user.role)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function DashboardPage({
  user,
  items,
  onNavigate,
  onFilterInventory,
  onOpenHistory,
  onEditItem,
  onCreate,
}: {
  user: AppUser;
  items: InventoryItem[];
  onNavigate: (page: AppPage) => void;
  onFilterInventory: (filter: DashboardInventoryFilter) => void;
  onOpenHistory: (item: InventoryItem) => void;
  onEditItem: (item: InventoryItem) => void;
  onCreate: () => void;
}) {
  const visibleItems = useMemo(() => visibleItemsForRole(items, user.role), [items, user.role]);
  const pendingItems = items.filter((item) => item.status === 'pending');
  const activeItems = items.filter((item) => item.status === 'active');
  const estimatedStockValue = activeItems.reduce((total, item) => total + item.valor, 0);
  const recentMovements = visibleItems
    .flatMap((item) => item.history.map((entry) => ({ item, entry })))
    .sort((first, second) => new Date(second.entry.timestamp).getTime() - new Date(first.entry.timestamp).getTime())
    .slice(0, 6);
  const summaryMetrics: Array<{
    label: string;
    value: number;
    icon: 'check' | 'clock' | 'shield' | 'truck' | 'archive';
    tone: string;
    filter: DashboardInventoryFilter;
  }> = [
    { label: 'Operacional', value: visibleItems.filter((item) => item.operationalStatus === 'operacional').length, icon: 'check', tone: 'text-emerald-700 bg-emerald-50', filter: { field: 'operationalStatus', value: 'operacional' } },
    { label: 'Em manutenção', value: visibleItems.filter((item) => item.operationalStatus === 'em-manutencao').length, icon: 'clock', tone: 'text-amber-700 bg-amber-50', filter: { field: 'operationalStatus', value: 'em-manutencao' } },
    { label: 'Inservível', value: visibleItems.filter((item) => item.operationalStatus === 'inservivel').length, icon: 'shield', tone: 'text-rose-700 bg-rose-50', filter: { field: 'operationalStatus', value: 'inservivel' } },
    { label: 'Em trânsito', value: visibleItems.filter((item) => item.operationalStatus === 'em-transito').length, icon: 'truck', tone: 'text-blue-700 bg-blue-50', filter: { field: 'operationalStatus', value: 'em-transito' } },
    { label: 'Ativo', value: visibleItems.filter((item) => item.status === 'active').length, icon: 'archive', tone: 'text-primary bg-[var(--color-hover)]', filter: { field: 'status', value: 'active' } },
    { label: 'Pendente', value: visibleItems.filter((item) => item.status === 'pending').length, icon: 'clock', tone: 'text-orange-700 bg-orange-50', filter: { field: 'status', value: 'pending' } },
  ];

  return (
    <>
      <section className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">Bom trabalho, {user.firstName.split(' ')[0]}</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{user.role === 'adm' ? 'Registro' : 'Visão geral do almoxarifado'}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{user.role === 'adm' ? 'Revise os itens que aguardam aprovação.' : 'Acompanhe as movimentações e a situação dos itens do patrimônio.'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {user.role !== 'reader' && <Button variant="secondary" onClick={() => onNavigate('inventory')}>
            <Icon name="archive" className="h-4 w-4" />
            Controle de patrimônio
          </Button>}
          {canCreateItems(user.role) && (
            <Button onClick={onCreate}>
              <Icon name="plus" className="h-4 w-4" />
              Novo item
            </Button>
          )}
        </div>
      </section>

      {user.role === 'adm' && (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Valor estimado do estoque</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{formatCurrency(estimatedStockValue)}</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Icon name="currency" className="h-5 w-5" /></span>
            </div>
            <p className="mt-4 text-xs text-slate-500">Soma do valor estimado de {formatQuantity(activeItems.length)} patrimônio(s) ativo(s).</p>
          </div>
        </section>
      )}

      <>
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-slate-950">Acompanhamento rápido</p>
                <p className="mt-1 text-sm text-slate-500">Selecione um indicador para abrir o controle de patrimônio já filtrado.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {summaryMetrics.map((metric) => (
                <button
                  key={metric.label}
                  type="button"
                  onClick={() => onFilterInventory(metric.filter)}
                  className={`group flex min-h-24 items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm ${COLOR_TRANSITION_CLASS} hover:border-primary hover:bg-[var(--color-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}
                >
                  <span>
                    <span className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{metric.label}</span>
                    <span className="mt-2 block text-2xl font-semibold tracking-tight text-slate-950">{formatQuantity(metric.value)}</span>
                  </span>
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${metric.tone}`}>
                    <Icon name={metric.icon} className="h-5 w-5" />
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-slate-950">Movimentações recentes</p>
                <p className="mt-1 text-sm text-slate-500">Últimas alterações registradas nos itens disponíveis para este perfil.</p>
              </div>
              <button type="button" onClick={() => onNavigate('inventory')} className={`text-xs font-bold text-primary ${COLOR_TRANSITION_CLASS} hover:text-primary-strong`}>Controle de patrimônio <span aria-hidden="true">→</span></button>
            </div>
            <div className="mt-5 divide-y divide-slate-100">
              {recentMovements.map(({ item, entry }) => (
                <button key={entry.id} type="button" onClick={() => user.role === 'adm' && item.status === 'pending' ? onEditItem(item) : onOpenHistory(item)} className={`flex w-full flex-wrap items-center gap-3 py-3 text-left first:pt-0 last:pb-0 ${COLOR_TRANSITION_CLASS} hover:bg-slate-50`}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-hover)] text-xs font-bold text-primary">{getTypeIcon(item.type)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-800">{item.description}</span>
                    <span className="mt-1 block truncate text-xs text-slate-500">{entry.summary}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-xs font-semibold text-slate-600">{historyActionLabels[entry.action]}</span>
                    <span className="mt-1 block text-[11px] text-slate-400">{formatDateTime(entry.timestamp)}</span>
                  </span>
                </button>
              ))}
              {recentMovements.length === 0 && <p className="py-5 text-sm text-slate-500">Nenhuma movimentação registrada.</p>}
            </div>
          </section>
      </>

      {user.role === 'adm' && (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="text-lg font-semibold text-slate-950">Itens pendentes de aprovação</p>
                <p className="mt-1 text-sm text-slate-500">Selecione um item para editar seu cadastro e status administrativo.</p>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">{formatQuantity(pendingItems.length)} pendente(s)</span>
            </div>
            <div className="divide-y divide-slate-100">
              {pendingItems.map((item) => (
                <button
                  key={item.uuid}
                  type="button"
                  onClick={() => onEditItem(item)}
                  aria-label={`Editar item pendente: ${item.description}, ${item.nrPatrimonio}`}
                  className={`flex w-full flex-wrap items-center gap-3 py-3 text-left ${COLOR_TRANSITION_CLASS} hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xs font-bold text-amber-700">{getTypeIcon(item.type)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-800">{item.description}</span>
                    <span className="mt-1 block text-xs text-slate-500">{item.nrPatrimonio} · {getTypeLabel(item.type)} · {item.cidade}</span>
                  </span>
                  <StatusBadge status={item.status} />
                  <Icon name="edit" className="h-4 w-4 shrink-0 text-slate-400" />
                </button>
              ))}
              {pendingItems.length === 0 && (
                <div className="flex items-center gap-3 py-6 text-sm text-slate-500">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Icon name="check" className="h-4 w-4" /></span>
                  Nenhum item pendente de aprovação.
                </div>
              )}
            </div>
          </section>
      )}
    </>
  );
}

type InventorySummary = {
  description: string;
  type: string;
  total: number;
  stateCounts: Partial<Record<ItemState, number>>;
};

function InventorySummaryCard({ summary }: { summary: InventorySummary }) {
  const statesWithItems = (Object.entries(summary.stateCounts) as [ItemState, number][]).filter(([, count]) => count > 0);

  return (
    <article className="rounded-2xl border border-primary bg-gradient-to-br from-white to-[var(--color-hover)] p-5 shadow-sm shadow-[var(--color-shadow)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Tipo patrimonial</p>
          <h3 className="mt-2 text-lg font-semibold leading-6 text-slate-950">{summary.description}</h3>
          <p className="mt-1 text-xs font-medium text-slate-500">{getTypeLabel(summary.type)}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-hover)] text-xs font-bold text-primary">{getTypeIcon(summary.type)}</div>
      </div>

      <div className="mt-5 flex items-baseline gap-2 border-t border-primary pt-4">
        <span className="text-3xl font-semibold tracking-tight text-slate-950">{formatQuantity(summary.total)}</span>
        <span className="text-sm text-slate-500">itens no total</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {statesWithItems.map(([state, count]) => (
          <div key={state} className="rounded-xl bg-white/80 px-3 py-2.5 ring-1 ring-inset ring-slate-100">
            <p className="text-lg font-semibold text-slate-950">{formatQuantity(count)}</p>
            <p className="mt-0.5 text-[11px] font-medium leading-4 text-slate-500">{stateLabels[state]}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function InventoryPage({
  user,
  items,
  initialFilter,
  onOpenHistory,
  onEdit,
  onCreate,
  onApproveItem,
  onRejectItem,
  onExportCurrent,
  onFilterChange,
  onToast,
}: {
  user: AppUser;
  items: InventoryItem[];
  initialFilter: InventoryFilters | null;
  onOpenHistory: (item: InventoryItem) => void;
  onEdit: (item: InventoryItem) => void;
  onCreate: () => void;
  onApproveItem: (item: InventoryItem) => void;
  onRejectItem: (item: InventoryItem) => void;
  onExportCurrent: (rows: InventoryItem[], columns: InventoryColumnKey[]) => void;
  onFilterChange: (filter: InventoryFilters | null) => void;
  onToast: (toast: Toast) => void;
}) {
  const [selectedDescription, setSelectedDescription] = useState<string | null>(null);
  const [query, setQuery] = useState(() => initialFilter?.query ?? '');
  const [typeFilters, setTypeFilters] = useState<string[]>(() => initialFilter?.types ?? []);
  const [statusFilters, setStatusFilters] = useState<ItemStatus[]>(() => initialFilter?.statuses ?? []);
  const [stateFilters, setStateFilters] = useState<ItemState[]>(() => initialFilter?.states ?? []);
  const [operationalStatusFilters, setOperationalStatusFilters] = useState<OperationalStatus[]>(() => initialFilter?.operationalStatuses ?? []);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<InventoryColumnKey[]>(defaultInventoryColumns);
  const [autoApplyDefaultOnEntry] = useState(() => initialFilter === null);

  useEffect(() => {
    setQuery(initialFilter?.query ?? '');
    setTypeFilters(initialFilter?.types ?? []);
    setStatusFilters(initialFilter?.statuses ?? []);
    setStateFilters(initialFilter?.states ?? []);
    setOperationalStatusFilters(initialFilter?.operationalStatuses ?? []);
  }, [initialFilter?.query, initialFilter?.types, initialFilter?.statuses, initialFilter?.states, initialFilter?.operationalStatuses]);

  const visibleItems = useMemo(() => visibleItemsForRole(items, user.role), [items, user.role]);
  const availableTypes = useMemo(() => Array.from(new Set(visibleItems.map((item) => item.type))).sort(), [visibleItems]);

  const suggestions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (normalizedQuery.length < 3) {
      return [];
    }

    const matches = new Map<string, number>();
    visibleItems.forEach((item) => {
      if (item.description.toLowerCase().includes(normalizedQuery)) {
        matches.set(item.description, (matches.get(item.description) ?? 0) + 1);
      }
    });

    return Array.from(matches.entries())
      .map(([description, count]) => ({ description, count }))
      .sort((first, second) => second.count - first.count || first.description.localeCompare(second.description))
      .slice(0, 6);
  }, [query, visibleItems]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return visibleItems.filter((item) => {
      const matchesQuery = !normalizedQuery || item.description.toLowerCase().includes(normalizedQuery) || item.nrPatrimonio.toLowerCase().includes(normalizedQuery);
      const matchesType = typeFilters.length === 0 || typeFilters.includes(item.type);
      const matchesStatus = statusFilters.length === 0 || statusFilters.includes(item.status);
      const matchesState = stateFilters.length === 0 || stateFilters.includes(item.state);
      const matchesOperationalStatus = operationalStatusFilters.length === 0 || operationalStatusFilters.includes(item.operationalStatus);
      return matchesQuery && matchesType && matchesStatus && matchesState && matchesOperationalStatus;
    });
  }, [operationalStatusFilters, query, stateFilters, statusFilters, typeFilters, visibleItems]);

  // Each record represents one identified patrimony, regardless of its lot quantity.
  const groups = useMemo(() => {
    const grouped = new Map<string, InventoryItem[]>();
    filteredItems.forEach((item) => {
      const group = grouped.get(item.description) ?? [];
      group.push(item);
      grouped.set(item.description, group);
    });
    return Array.from(grouped.entries()).sort(([first], [second]) => first.localeCompare(second, 'pt-BR'));
  }, [filteredItems]);
  const detailItems = visibleItems.filter((item) => item.description === selectedDescription);
  const displayedItems = selectedDescription === null ? filteredItems : detailItems;

  const exportGroups = () => {
    const columns: ExportColumn<[string, InventoryItem[]]>[] = [
      { key: 'description', label: 'Item', getValue: ([description]) => description },
      { key: 'total', label: 'Total', getValue: ([, rows]) => String(rows.length) },
      ...operationalStatuses.map((status) => ({
        key: status, label: operationalStatusLabels[status],
        getValue: ([, rows]: [string, InventoryItem[]]) => String(rows.filter((item) => item.operationalStatus === status).length),
      })),
      ...itemStatuses.map((status) => ({
        key: status, label: statusLabels[status],
        getValue: ([, rows]: [string, InventoryItem[]]) => String(rows.filter((item) => item.status === status).length),
      })),
    ];
    const opened = openPrintReport(createReportHtml({ title: 'Estoque patrimonial por descrição', rows: groups, columns, generatedBy: user }));
    onToast(opened
      ? { message: 'Relatório aberto para impressão.', tone: 'info', detail: 'Na janela de impressão, escolha “Salvar como PDF”.' }
      : { message: 'Não foi possível abrir o relatório.', tone: 'info', detail: 'Permita pop-ups para este site e tente novamente.' });
  };

  const summaries = useMemo(() => {
    const grouped = new Map<string, InventorySummary>();

    filteredItems.forEach((item) => {
      const current = grouped.get(item.description) ?? {
        description: item.description,
        type: item.type,
        total: 0,
        stateCounts: {},
      };

      current.total += 1;
      current.stateCounts[item.state] = (current.stateCounts[item.state] ?? 0) + 1;
      grouped.set(item.description, current);
    });

    return Array.from(grouped.values()).sort((first, second) => second.total - first.total);
  }, [filteredItems]);

  const syncFiltersToUrl = (changes: Partial<InventoryFilters> = {}) => {
    onFilterChange({
      query: changes.query ?? query,
      types: changes.types ?? typeFilters,
      statuses: changes.statuses ?? statusFilters,
      states: changes.states ?? stateFilters,
      operationalStatuses: changes.operationalStatuses ?? operationalStatusFilters,
    });
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setSuggestionsOpen(value.trim().length >= 3);
    setSummaryVisible(false);
    syncFiltersToUrl({ query: value });
  };

  const selectSuggestion = (description: string) => {
    setQuery(description);
    setSuggestionsOpen(false);
    setSummaryVisible(false);
    syncFiltersToUrl({ query: description });
  };

  const clearFilters = () => {
    setQuery('');
    setTypeFilters([]);
    setStatusFilters([]);
    setStateFilters([]);
    setOperationalStatusFilters([]);
    setSuggestionsOpen(false);
    setSummaryVisible(false);
    onFilterChange(null);
  };

  const hasFilters = Boolean(query.trim() || typeFilters.length || statusFilters.length || stateFilters.length || operationalStatusFilters.length);
  const currentFilters = normalizeInventoryFilters({
    query,
    types: typeFilters,
    statuses: statusFilters,
    states: stateFilters,
    operationalStatuses: operationalStatusFilters,
  });

  const applySavedView = (filters: InventoryFilters | null, columns: InventoryColumnKey[]) => {
    const roleSafeFilters = user.role === 'reader'
      ? normalizeInventoryFilters({ ...(filters ?? {}), statuses: filters?.statuses?.filter((status) => status === 'active') })
      : normalizeInventoryFilters(filters);
    const roleSafeColumns: InventoryColumnKey[] = columns.includes('nrPatrimonio') ? columns : ['nrPatrimonio', ...columns];
    setSelectedDescription(null);
    setQuery(roleSafeFilters?.query ?? '');
    setTypeFilters(roleSafeFilters?.types ?? []);
    setStatusFilters(roleSafeFilters?.statuses ?? []);
    setStateFilters(roleSafeFilters?.states ?? []);
    setOperationalStatusFilters(roleSafeFilters?.operationalStatuses ?? []);
    setVisibleColumns(roleSafeColumns);
    setSummaryVisible(false);
    setSuggestionsOpen(false);
    onFilterChange(roleSafeFilters);
  };

  const toggleColumn = (columnKey: InventoryColumnKey) => {
    if (columnKey === 'nrPatrimonio') return;
    setVisibleColumns((current) => current.includes(columnKey)
      ? current.filter((key) => key !== columnKey)
      : [...current, columnKey]);
  };

  return (
    <>
      <section className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">Consulta de ativos</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{selectedDescription ?? (user.role === 'reader' ? 'Consulta de Ativos' : 'Controle de patrimônio')}</h1>
          {selectedDescription !== null && <Button variant="ghost" onClick={() => setSelectedDescription(null)} className="mt-3">Voltar ao estoque patrimonial</Button>}
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{selectedDescription === null ? 'Consulte os totais por descrição e abra um item para ver seus patrimônios.' : `${detailItems.length} patrimônio(s) visível(is) neste cadastro. Cada número de patrimônio corresponde a uma unidade.`}</p>
        </div>
        {canCreateItems(user.role) && (
          <Button onClick={onCreate}>
            <Icon name="plus" className="h-4 w-4" />
            Novo item
          </Button>
        )}
      </section>

      <section hidden={selectedDescription !== null} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/40 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <label htmlFor="inventory-search" className="sr-only">Descrição ou patrimônio</label>
            <div className="relative">
              <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <TextInput id="inventory-search" value={query} onChange={(event) => handleQueryChange(event.target.value)} onFocus={() => setSuggestionsOpen(query.trim().length >= 3)} placeholder="Ex.: mangueira, CBM-VTR-0001..." className="!h-10 pl-10" />
              {suggestionsOpen && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10">
                  <p className="px-3 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Sugestões de descrição</p>
                  <ul className="max-h-64 overflow-y-auto">
                    {suggestions.map((suggestion) => (
                      <li key={suggestion.description}>
                        <button type="button" onClick={() => selectSuggestion(suggestion.description)} className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left ${COLOR_TRANSITION_CLASS} hover:bg-[var(--color-hover)]`}>
                          <span className="min-w-0 truncate text-sm font-medium text-slate-700">{suggestion.description}</span>
                          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">{suggestion.count} item(ns)</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FilterDropdown
              id="inventory-type-filter"
              label="Tipo"
              selectedValues={typeFilters}
              options={availableTypes.map((type) => ({ value: type, label: getTypeLabel(type) }))}
              onChange={(values) => { setTypeFilters(values); setSummaryVisible(false); syncFiltersToUrl({ types: values }); }}
            />
            <FilterDropdown
              id="inventory-status-filter"
              label="Status"
              selectedValues={statusFilters}
              options={itemStatuses.filter((status) => user.role !== 'reader' || status === 'active').map((status) => ({ value: status, label: statusLabels[status] }))}
              onChange={(values) => {
                const nextStatuses = values as ItemStatus[];
                setStatusFilters(nextStatuses);
                setSummaryVisible(false);
                syncFiltersToUrl({ statuses: nextStatuses });
              }}
            />
            <FilterDropdown
              id="inventory-state-filter"
              label="Estado"
              selectedValues={stateFilters}
              options={itemStates.map((state) => ({ value: state, label: stateLabels[state] }))}
              onChange={(values) => { const nextStates = values as ItemState[]; setStateFilters(nextStates); setSummaryVisible(false); syncFiltersToUrl({ states: nextStates }); }}
            />
            <FilterDropdown
              id="inventory-operational-status-filter"
              label="Status operacional"
              selectedValues={operationalStatusFilters}
              options={operationalStatuses.map((status) => ({ value: status, label: operationalStatusLabels[status] }))}
              onChange={(values) => {
                const nextOperationalStatuses = values as OperationalStatus[];
                setOperationalStatusFilters(nextOperationalStatuses);
                setSummaryVisible(false);
                syncFiltersToUrl({ operationalStatuses: nextOperationalStatuses });
              }}
            />
            <div className="relative shrink-0">
              <button type="button" aria-expanded={columnsOpen} onClick={() => setColumnsOpen((current) => !current)} className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-medium ${COLOR_TRANSITION_CLASS} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${columnsOpen ? 'border-primary bg-[var(--color-hover)] text-primary' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
                Colunas <Icon name="chevron-down" className="h-3.5 w-3.5 text-slate-400" />
              </button>
              {columnsOpen && (
                <div role="group" aria-label="Colunas dos detalhes patrimoniais" className="absolute right-0 top-[calc(100%+0.5rem)] z-40 max-h-80 w-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10">
                  <p className="px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Colunas dos exemplares</p>
                  {inventoryColumnOptions.map((column) => (
                    <label key={column.key} className={`flex min-h-9 cursor-pointer items-center gap-2 rounded-lg px-2 text-xs ${COLOR_TRANSITION_CLASS} hover:bg-slate-50`}>
                      <input type="checkbox" checked={visibleColumns.includes(column.key)} disabled={column.key === 'nrPatrimonio'} onChange={() => toggleColumn(column.key)} className="h-4 w-4 rounded accent-primary" />
                      {column.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
            <InventoryViewTemplates userId={user.id} autoApplyDefaultOnEntry={autoApplyDefaultOnEntry} filters={currentFilters} columns={visibleColumns} onApply={applySavedView} onToast={onToast} />
            {hasFilters && <Button type="button" variant="ghost" onClick={clearFilters} className="min-h-10 px-3">Limpar</Button>}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <Icon name="filter" className="h-4 w-4 text-slate-400" />
          <span><strong className="font-bold text-slate-800">{formatQuantity(filteredItems.length)}</strong> resultado(s) de {formatQuantity(visibleItems.length)} visível(is)</span>
          <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
          <span className="text-slate-400">Perfil: {getRoleLabel(user.role)}</span>
          <Button type="button" variant="secondary" onClick={exportGroups} disabled={filteredItems.length === 0} className="ml-auto min-h-9 px-3 py-1.5 text-xs">
            <Icon name="download" className="h-3.5 w-3.5" />
            Exportar PDF
          </Button>
          {query.trim().length >= 3 && (
            <Button
              type="button"
              variant="secondary"
              aria-pressed={summaryVisible}
              onClick={() => { setSummaryVisible((current) => !current); setSuggestionsOpen(false); }}
              disabled={filteredItems.length === 0}
              className="ml-auto min-h-9 px-3 py-1.5 text-xs"
            >
              <Icon name="archive" className="h-3.5 w-3.5" />
              {summaryVisible ? 'Ocultar resumo' : 'Fazer resumo'}
            </Button>
          )}
        </div>
      </section>

      {selectedDescription === null && summaryVisible && summaries.length > 0 && (
        <section aria-label="Resumo da busca" aria-live="polite" className="mt-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Resumo da busca</p>
              <p className="mt-1 text-sm text-slate-500">Distribuição dos resultados por descrição e condição operacional.</p>
            </div>
            <span className="hidden text-xs font-medium text-slate-400 sm:block">{formatQuantity(filteredItems.length)} item(ns) considerado(s)</span>
          </div>
          <div className="mt-3 grid gap-4 xl:grid-cols-2">
            {summaries.map((summary) => <InventorySummaryCard key={`${summary.type}-${summary.description}`} summary={summary} />)}
          </div>
        </section>
      )}

      <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <p className="text-sm font-semibold text-slate-950">Bens cadastrados</p>
            <p className="mt-1 text-xs text-slate-500">{selectedDescription === null ? `${groups.length} descrição(ões) · Totais em patrimônios cadastrados, conforme os filtros e o perfil.` : 'Detalhes individuais e histórico de movimentações'}</p>
          </div>
          <div className="hidden items-center gap-2 text-xs text-slate-400 sm:flex"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Dados locais</div>
        </div>
        {selectedDescription === null ? (
          <div className="overflow-x-auto">
            <table aria-label="Patrimônios por descrição" className="w-full min-w-[1200px] text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th scope="col" rowSpan={2} className="px-5 py-3">Item</th>
                  <th scope="col" rowSpan={2} className="px-4 py-3">Total</th>
                  <th scope="colgroup" colSpan={operationalStatuses.length} className="px-4 py-3 text-center">Estado operacional</th>
                  <th scope="colgroup" colSpan={itemStatuses.length} className="px-4 py-3 text-center">Status administrativo</th>
                </tr>
                <tr>
                  {operationalStatuses.map((status) => <th scope="col" key={status} className="px-4 py-3">{operationalStatusLabels[status]}</th>)}
                  {itemStatuses.map((status) => <th scope="col" key={status} className="px-4 py-3">{statusLabels[status]}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groups.map(([description, rows]) => (
                  <tr key={description} className="hover:bg-slate-50">
                    <th scope="row" className="px-5 py-4"><button type="button" onClick={() => { setSelectedDescription(description); setSuggestionsOpen(false); }} className="text-left font-semibold text-primary underline-offset-4 hover:underline focus-visible:underline">{description}</button></th>
                    <td className="px-4 py-4 font-bold">{formatQuantity(rows.length)}</td>
                    {operationalStatuses.map((status) => <td key={status} className="px-4 py-4">{formatQuantity(rows.filter((item) => item.operationalStatus === status).length)}</td>)}
                    {itemStatuses.map((status) => <td key={status} className="px-4 py-4">{formatQuantity(rows.filter((item) => item.status === status).length)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-3 px-5 py-3">
              <Button variant="secondary" onClick={() => onExportCurrent(detailItems, visibleColumns)}>Exportar PDF</Button>
              <Button variant="ghost" onClick={() => setColumnsOpen((current) => !current)} aria-expanded={columnsOpen}>Colunas</Button>
              {columnsOpen && inventoryColumnOptions.map((column) => <label key={column.key} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={visibleColumns.includes(column.key)} disabled={column.key === 'nrPatrimonio'} onChange={() => toggleColumn(column.key)} />{column.label}</label>)}
            </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1050px] w-full text-left">
            <thead className="bg-slate-50/80 text-[10px] uppercase tracking-[0.13em] text-slate-400">
              <tr>
                {visibleColumns.map((columnKey) => (
                  <th key={columnKey} className="px-4 py-3 font-bold first:pl-5 sm:first:pl-6">{inventoryColumnOptions.find((column) => column.key === columnKey)?.label}</th>
                ))}
                <th className="px-4 py-3 text-right font-bold sm:px-6">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {detailItems.map((item) => (
                <tr key={item.uuid} className={`group ${COLOR_TRANSITION_CLASS} hover:bg-slate-50/70`}>
                  {visibleColumns.map((columnKey) => (
                    <td key={columnKey} className="px-4 py-4 first:pl-5 sm:first:pl-6">
                      {columnKey === 'nrPatrimonio' && <span className="inline-flex rounded-lg bg-[var(--color-hover)] px-3 py-2 font-mono text-base font-bold text-primary">{item.nrPatrimonio}</span>}
                      {columnKey === 'item' && <span className="text-sm text-slate-600">{item.description}</span>}
                      {columnKey === 'uuid' && <span className="block max-w-[220px] truncate font-mono text-[11px] text-slate-500">{item.uuid}</span>}
                      {columnKey === 'type' && <span className="text-sm text-slate-600">{getTypeLabel(item.type)}</span>}
                      {columnKey === 'cidade' && <span className="text-sm text-slate-600">{item.cidade || '—'}</span>}
                      {columnKey === 'state' && <StateBadge state={item.state} />}
                      {columnKey === 'operationalStatus' && <OperationalStatusBadge status={item.operationalStatus} />}
                      {columnKey === 'valor' && <span className="text-sm text-slate-700">{formatCurrency(item.valor)}</span>}
                      {columnKey === 'status' && <StatusBadge status={item.status} />}
                      {columnKey === 'lastTimeTouched' && <span className="whitespace-nowrap text-xs text-slate-500">{formatDateTime(item.lastTimeTouched)}</span>}
                    </td>
                  ))}
                  <td className="px-4 py-4 sm:px-6">
                    <div className="flex justify-end gap-1">
                      <IconButton label="Ver histórico" onClick={() => onOpenHistory(item)}><Icon name="history" className="h-4 w-4" /></IconButton>
                      {canEditItem(user.role) && <IconButton label="Editar item" onClick={() => onEdit(item)}><Icon name="edit" className="h-4 w-4" /></IconButton>}
                      {user.role === 'adm' && item.status === 'pending' && <IconButton label="Aprovar item" onClick={() => onApproveItem(item)} className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"><Icon name="check" className="h-4 w-4" /></IconButton>}
                      {user.role === 'adm' && item.status === 'pending' && <IconButton label="Rejeitar item" onClick={() => onRejectItem(item)} className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"><Icon name="close" className="h-4 w-4" /></IconButton>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          </>
        )}
        {displayedItems.length === 0 && (
          <div className="border-t border-slate-100 px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><Icon name="search" className="h-5 w-5" /></div>
            <p className="mt-4 text-sm font-semibold text-slate-800">Nenhum bem encontrado</p>
            <p className="mt-1 text-sm text-slate-500">Tente ajustar a busca ou limpar os filtros.</p>
            {hasFilters && <Button variant="ghost" onClick={clearFilters} className="mt-3">Limpar filtros</Button>}
          </div>
        )}
      </section>
    </>
  );
}

function HistoryDrawer({
  item,
  onClose,
}: {
  item: InventoryItem | null;
  onClose: () => void;
}) {
  if (!item) {
    return null;
  }

  const history = [...item.history].sort((first, second) => second.timestamp.localeCompare(first.timestamp));

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button type="button" aria-label="Fechar detalhes" onClick={onClose} className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" />
      <aside className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Histórico</p>
            <h2 className="mt-2 max-w-sm text-xl font-semibold leading-7 text-slate-950">Histórico de alterações</h2>
            <p className="mt-1 text-sm font-medium text-slate-600">{item.description}</p>
            <p className="mt-1 text-xs text-slate-500">Patrimônio {item.nrPatrimonio} · {item.cidade}</p>
          </div>
          <IconButton label="Fechar histórico" onClick={onClose}><Icon name="close" className="h-5 w-5" /></IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={item.status} />
            <StateBadge state={item.state} />
            <OperationalStatusBadge status={item.operationalStatus} />
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{getTypeLabel(item.type)}</span>
          </div>

          <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Última movimentação</p>
            <p className="mt-2 text-sm font-semibold text-slate-800">{formatDateTime(item.lastTimeTouched)}</p>
            <p className="mt-1 text-xs text-slate-500">O histórico é mantido localmente nesta demonstração.</p>
          </div>

          <div className="mt-6 space-y-3">
            {history.map((entry) => (
              <article key={entry.id} className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-hover)] text-primary"><Icon name="history" className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">{historyActionLabels[entry.action]}</p>
                      <time className="text-[11px] text-slate-400">{formatDateTime(entry.timestamp)}</time>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-600">{entry.summary}</p>
                    <p className="mt-2 text-[11px] font-medium text-slate-400">Por {entry.userName}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
        <div className="border-t border-slate-100 px-6 py-5">
          <Button variant="ghost" onClick={onClose} className="w-full">Fechar histórico</Button>
        </div>
      </aside>
    </div>
  );
}

function ItemFormModal({
  items,
  item,
  role,
  onClose,
  onSubmit,
}: {
  items: InventoryItem[];
  item: InventoryItem | null;
  role: UserRole;
  onClose: () => void;
  onSubmit: (values: InventoryFormValues) => void;
}) {
  const isEditing = Boolean(item);
  const isAdmin = canEditAdministrativeFields(role);
  const [form, setForm] = useState<InventoryFormValues>(() =>
    item
      ? (({ uuid: _uuid, history: _history, lastTimeTouched: _lastTimeTouched, ...editableValues }) => editableValues)(item)
      : {
          description: '',
          type: 'viatura',
          state: 'novo',
          operationalStatus: 'operacional',
          valor: 0,
          quantidade: 1,
          nrPatrimonio: createPatrimonyNumber(),
          cidade: City.EB_PAULINIA,
          status: role === 'adm' ? 'active' : 'pending',
        },
  );
  const effectiveStatus = !isEditing && (role === 'adm' || hasApprovedRegistration(items, form.description)) ? 'active' : form.status;
  const [error, setError] = useState('');
  const [cityQuery, setCityQuery] = useState<string>(item?.cidade ?? City.EB_PAULINIA);
  const [citySuggestionsOpen, setCitySuggestionsOpen] = useState(false);

  const citySuggestions = useMemo(() => {
    const normalizedQuery = normalizeSearchText(cityQuery.trim());

    return cityOptions
      .filter((city) => !normalizedQuery || normalizeSearchText(city).includes(normalizedQuery))
      .slice(0, 4);
  }, [cityQuery]);

  const updateField = (field: keyof InventoryFormValues, value: string | number) => {
    setForm((current) => ({ ...current, [field]: value } as InventoryFormValues));
  };

  const handleCityInputChange = (value: string) => {
    setCityQuery(value);
    setCitySuggestionsOpen(true);
    setError('');
    updateField('cidade', '');
  };

  const selectCity = (city: City) => {
    setCityQuery(city);
    setCitySuggestionsOpen(false);
    setError('');
    updateField('cidade', city);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.description.trim() || !form.nrPatrimonio.trim() || !cityQuery.trim()) {
      setError('Preencha a descrição, o número de patrimônio e a cidade/unidade.');
      return;
    }
    if (!cityOptions.includes(form.cidade) || form.cidade !== cityQuery) {
      setError('Selecione uma cidade/unidade disponível na lista.');
      return;
    }
    if (form.valor <= 0) {
      setError('O valor deve ser maior que zero.');
      return;
    }

    setError('');
    onSubmit({ ...form, description: form.description.trim(), nrPatrimonio: form.nrPatrimonio.trim() });
  };

  return (
    <Dialog labelledBy="item-form-title" closeLabel="Fechar formulário" onClose={onClose} size="lg" panelClassName="flex max-h-[min(850px,calc(100vh-2rem))] flex-col">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5 sm:px-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{isEditing ? 'Atualização patrimonial' : 'Novo patrimônio'}</p>
            <h2 id="item-form-title" className="mt-2 text-xl font-semibold text-slate-950">{isEditing ? 'Editar registro' : 'Cadastrar novo item'}</h2>
            <p className="mt-1 text-sm text-slate-500">{isEditing && !isAdmin ? 'Seu perfil pode alterar o estado físico, a situação operacional e a cidade/unidade.' : 'Cada cadastro representa uma unidade com número de patrimônio único.'}</p>
          </div>
          <IconButton label="Fechar formulário" onClick={onClose}><Icon name="close" className="h-5 w-5" /></IconButton>
        </div>

        <form id="item-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 sm:px-7">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FieldLabel htmlFor="item-description">Descrição do item</FieldLabel>
              <TextInput id="item-description" value={form.description} onChange={(event) => updateField('description', event.target.value)} placeholder="Ex.: Caminhão Auto Bomba Tanque" disabled={isEditing && !isAdmin} />
            </div>
            <div>
              <FieldLabel htmlFor="item-type">Tipo</FieldLabel>
              <SelectInput id="item-type" value={form.type} onChange={(event) => updateField('type', event.target.value)} disabled={isEditing && !isAdmin}>
                {itemTypeOptions.map((type) => <option key={type} value={type}>{getTypeLabel(type)}</option>)}
              </SelectInput>
            </div>
            <div>
              <FieldLabel htmlFor="item-patrimony">Número de patrimônio</FieldLabel>
              <TextInput id="item-patrimony" value={form.nrPatrimonio} onChange={(event) => updateField('nrPatrimonio', event.target.value)} disabled={isEditing && !isAdmin} />
            </div>
            <div className="relative">
              <FieldLabel htmlFor="item-city">Cidade/unidade</FieldLabel>
              <TextInput
                id="item-city"
                required
                value={cityQuery}
                onChange={(event) => handleCityInputChange(event.target.value)}
                onFocus={() => setCitySuggestionsOpen(true)}
                onBlur={() => window.setTimeout(() => setCitySuggestionsOpen(false), 150)}
                role="combobox"
                aria-autocomplete="list"
                aria-controls="item-city-options"
                aria-expanded={citySuggestionsOpen}
                autoComplete="off"
                placeholder="Digite para buscar uma unidade"
              />
              {citySuggestionsOpen && citySuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10">
                  <ul id="item-city-options" role="listbox" className="grid gap-1">
                    {citySuggestions.map((city) => (
                      <li key={city}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={form.cidade === city}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => selectCity(city)}
                          className={`flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 ${COLOR_TRANSITION_CLASS} hover:bg-[var(--color-hover)] hover:text-primary`}
                        >
                          {city}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div>
              <FieldLabel htmlFor="item-operational-status">Status operacional</FieldLabel>
              <SelectInput id="item-operational-status" value={form.operationalStatus} onChange={(event) => updateField('operationalStatus', event.target.value as OperationalStatus)}>
                {operationalStatuses.map((status) => <option key={status} value={status}>{operationalStatusLabels[status]}</option>)}
              </SelectInput>
            </div>
            <div>
              <FieldLabel htmlFor="item-state">Condição operacional</FieldLabel>
              <SelectInput id="item-state" value={form.state} onChange={(event) => updateField('state', event.target.value as ItemState)}>
                {itemStates.map((state) => <option key={state} value={state}>{stateLabels[state]}</option>)}
              </SelectInput>
            </div>
            <div>
              <FieldLabel htmlFor="item-value">Valor unitário (R$)</FieldLabel>
              <TextInput id="item-value" type="number" min="0.01" step="0.01" value={form.valor} onChange={(event) => updateField('valor', Number(event.target.value))} disabled={isEditing && !isAdmin} />
            </div>
            <div>
              <FieldLabel htmlFor="item-status">Status administrativo</FieldLabel>
              {isAdmin && isEditing ? (
                <SelectInput id="item-status" value={form.status} onChange={(event) => updateField('status', event.target.value as ItemStatus)}>
                  {itemStatuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
                </SelectInput>
              ) : (
                <div className={`flex h-11 items-center rounded-xl border border-dashed px-3.5 text-sm font-semibold ${effectiveStatus === 'active' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-amber-300 bg-amber-50 text-amber-700'}`}>
                  <span className={`mr-2 h-2 w-2 rounded-full ${effectiveStatus === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {statusLabels[effectiveStatus]}
                </div>
              )}
            </div>
          </div>

          {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">{error}</div>}

          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">
            <div className="flex gap-2"><Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /><span>{isEditing && !isAdmin ? 'O almoxarife pode atualizar condição operacional e cidade/unidade.' : role === 'almoxarife' ? 'Exemplares de cadastros já aprovados entram como ativos. Cadastros novos aguardam aprovação do gestor.' : 'Itens criados pelo gestor entram automaticamente como ativos.'}</span></div>
          </div>
        </form>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-6 py-5 sm:flex-row sm:justify-end sm:px-7">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="item-form">Salvar registro</Button>
        </div>
    </Dialog>
  );
}

function ToastBanner({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  if (!toast) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex max-w-sm items-start gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-xl shadow-slate-900/10">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Icon name={toast.tone === 'success' ? 'check' : 'info'} className="h-4 w-4" /></div>
      <div className="flex-1 pt-0.5"><p className="text-sm font-semibold text-slate-800">{toast.message}</p><p className="mt-0.5 text-xs text-slate-500">{toast.detail ?? 'Alteração aplicada apenas nesta sessão.'}</p></div>
      <IconButton label="Fechar mensagem" onClick={onClose} className="-mr-2 -mt-2"><Icon name="close" className="h-4 w-4" /></IconButton>
    </div>
  );
}

function ExportFormatModal({
  itemCount,
  onClose,
  onExport,
}: {
  itemCount: number;
  onClose: () => void;
  onExport: (format: 'csv' | 'pdf') => void;
}) {
  return (
    <Dialog labelledBy="export-format-title" closeLabel="Fechar exportação" onClose={onClose} size="sm" panelClassName="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Exportar almoxarifado</p>
            <h2 id="export-format-title" className="mt-2 text-xl font-semibold text-slate-950">Escolha o formato</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Serão exportados {formatQuantity(itemCount)} registros permitidos para o seu perfil.</p>
          </div>
          <IconButton label="Fechar exportação" onClick={onClose}><Icon name="close" className="h-5 w-5" /></IconButton>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button type="button" variant="secondary" onClick={() => onExport('csv')} className="min-h-12">
            <Icon name="download" className="h-4 w-4" />
            Exportar CSV
          </Button>
          <Button type="button" onClick={() => onExport('pdf')} className="min-h-12">
            <Icon name="download" className="h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
        <Button type="button" variant="ghost" onClick={onClose} className="mt-3 w-full">Cancelar</Button>
    </Dialog>
  );
}

function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());
  const [session, setSession] = useState<AppUser | null>(null);
  const [users, setUsers] = useState<AppUser[]>(demoUsers);
  const [initialRoute] = useState<AppRoute>(() => parseAppRoute(window.location.hash));
  const [page, setPage] = useState<AppPage>(() => initialRoute.page);
  const [inventoryFilter, setInventoryFilter] = useState<InventoryFilters | null>(() => initialRoute.filter);
  const [items, setItems] = useState<InventoryItem[]>(inventorySeed);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<InventoryItem | null>(null);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [exportScope, setExportScope] = useState<'all' | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const syncRouteFromLocation = () => {
      let nextRoute = parseAppRoute(window.location.hash);
      if (session && session.role !== 'adm' && nextRoute.page === 'users') {
        const fallbackPage: AppPage = session.role === 'reader' ? 'inventory' : 'dashboard';
        updateAppRouteUrl(fallbackPage, null, true);
        nextRoute = { page: fallbackPage, filter: null };
      }
      if (session?.role === 'reader' && nextRoute.page !== 'profile') {
        const readerFilter = normalizeInventoryFilters({
          ...(nextRoute.filter ?? {}),
          statuses: nextRoute.filter?.statuses?.filter((status) => status === 'active'),
        });
        if (nextRoute.page !== 'inventory' || getAppRouteHash('inventory', readerFilter) !== window.location.hash) {
          updateAppRouteUrl('inventory', readerFilter, true);
        }
        nextRoute = { page: 'inventory', filter: readerFilter };
      }
      setPage(nextRoute.page);
      setInventoryFilter(nextRoute.filter);
      setSelectedHistoryItem(null);
      setSelectedUser(null);
      setModal(null);
      setExportScope(null);
    };

    window.addEventListener('popstate', syncRouteFromLocation);
    window.addEventListener('hashchange', syncRouteFromLocation);
    return () => {
      window.removeEventListener('popstate', syncRouteFromLocation);
      window.removeEventListener('hashchange', syncRouteFromLocation);
    };
  }, [session]);

  const toggleTheme = () => {
    setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark');
  };

  const handleLogin = (user: AppUser) => {
    const requestedRoute = parseAppRoute(window.location.hash);
    const canOpenRequestedPage = requestedRoute.page !== 'users' || user.role === 'adm';
    const landingPage: AppPage = requestedRoute.page === 'profile'
      ? 'profile'
      : user.role === 'reader'
        ? 'inventory'
        : canOpenRequestedPage ? requestedRoute.page : 'dashboard';
    const requestedFilter = user.role === 'reader'
      ? normalizeInventoryFilters({ ...(requestedRoute.filter ?? {}), statuses: requestedRoute.filter?.statuses?.filter((status) => status === 'active') })
      : requestedRoute.filter;
    const landingFilter = landingPage === 'inventory' ? requestedFilter : null;
    setSession(user);
    setPage(landingPage);
    setInventoryFilter(landingFilter);
    updateAppRouteUrl(landingPage, landingFilter, true);
    setSelectedHistoryItem(null);
    setSelectedUser(null);
    setModal(null);
    setExportScope(null);
  };

  const handleLogout = () => {
    setSession(null);
    setInventoryFilter(null);
    window.history.replaceState(window.history.state, '', '#/login');
    setSelectedHistoryItem(null);
    setSelectedUser(null);
    setModal(null);
    setExportScope(null);
    setToast(null);
  };

  const handleNavigate = (nextPage: AppPage) => {
    if (nextPage === 'users' && session?.role !== 'adm') {
      return;
    }

    if (session?.role === 'reader' && nextPage !== 'profile') {
      setPage('inventory');
      setInventoryFilter(null);
      updateAppRouteUrl('inventory', null, true);
      return;
    }

    setInventoryFilter(null);
    setPage(nextPage);
    setSelectedUser(null);
    updateAppRouteUrl(nextPage);
  };

  const handleUpdateUserRole = (userId: string, role: UserRole) => {
    if (session?.role !== 'adm') {
      return;
    }

    const userToUpdate = users.find((user) => user.id === userId);
    if (!userToUpdate) {
      return;
    }

    const updatedUser = { ...userToUpdate, role };
    setUsers((currentUsers) => currentUsers.map((user) => user.id === userId ? updatedUser : user));
    setSelectedUser(null);
    setToast({ message: `Perfil de ${userToUpdate.name} atualizado.`, tone: 'success', detail: 'A alteração fica ativa nesta sessão do protótipo.' });

    if (session.id === userId && role !== 'adm') {
      const landingPage: AppPage = role === 'reader' ? 'inventory' : 'dashboard';
      setSession(updatedUser);
      setPage(landingPage);
      setInventoryFilter(null);
      updateAppRouteUrl(landingPage, null, true);
    }
  };

  const handleSaveUserProfile = (profile: UserProfileValues) => {
    if (!session) {
      return;
    }

    const updatedUser: AppUser = {
      ...session,
      ...profile,
      name: getUserDisplayName(profile),
    };
    setUsers((currentUsers) => currentUsers.map((user) => user.id === session.id ? updatedUser : user));
    setSession(updatedUser);
    setToast({ message: 'Perfil atualizado.', tone: 'success', detail: 'Seus dados foram atualizados nesta sessão do protótipo.' });
  };

  const handleFilterInventory = (filter: DashboardInventoryFilter) => {
    const nextFilter: InventoryFilters = filter.field === 'status'
      ? { statuses: [filter.value] }
      : { operationalStatuses: [filter.value] };
    setInventoryFilter(nextFilter);
    setPage('inventory');
    updateAppRouteUrl('inventory', nextFilter);
  };

  const handleInventoryFilterChange = (filter: InventoryFilters | null) => {
    const nextFilter = normalizeInventoryFilters(filter);
    setInventoryFilter(nextFilter);
    updateAppRouteUrl('inventory', nextFilter, true);
  };

  const handleSaveItem = (values: InventoryFormValues) => {
    if (!session || !modal) {
      return;
    }

    if (modal.mode === 'edit') {
      setItems((currentItems) => currentItems.map((currentItem) => {
          if (currentItem.uuid !== modal.item.uuid) {
            return currentItem;
          }

          const nextStatus = session.role === 'adm' ? values.status : currentItem.status;
          const cityChanged = currentItem.cidade !== values.cidade;
          const statusChanged = currentItem.status !== nextStatus;
          const summary = cityChanged
            ? `Cidade/unidade alterada de ${currentItem.cidade} para ${values.cidade}.`
            : statusChanged
              ? `Status administrativo alterado de ${statusLabels[currentItem.status]} para ${statusLabels[nextStatus]}.`
              : 'Dados do patrimônio atualizados.';
          const historyAction: InventoryHistoryAction = statusChanged
            ? nextStatus === 'rejected'
              ? 'rejected'
              : nextStatus === 'deactivated'
                ? 'deactivated'
                : 'edited'
            : cityChanged ? 'moved' : 'edited';
          const historyEntry = createHistoryEntry(session, historyAction, summary, {
            previousStatus: currentItem.status,
            nextStatus,
            previousCity: currentItem.cidade,
            nextCity: values.cidade,
          });

          const editableValues = session.role === 'adm'
            ? { ...values, status: nextStatus }
            : {
              ...currentItem,
              quantidade: 1 as const,
              state: values.state,
              operationalStatus: values.operationalStatus,
              cidade: values.cidade,
              status: currentItem.status,
            };

          return {
            ...currentItem,
            ...editableValues,
            lastTimeTouched: historyEntry.timestamp,
            history: [...currentItem.history, historyEntry],
          };
        }));
      setToast({ message: 'Registro atualizado com sucesso.', tone: 'success' });
    } else {
      const status: ItemStatus = session.role === 'adm' || hasApprovedRegistration(items, values.description) ? 'active' : 'pending';
      const historyEntry = createHistoryEntry(session, 'created', status === 'active' ? 'Exemplar ativado em cadastro aprovado.' : 'Patrimônio criado e enviado para aprovação do gestor.', {
        nextStatus: status,
        nextCity: values.cidade,
      });
      const existingRegistration = items.find((item) => descriptionKey(item.description) === descriptionKey(values.description));
      const newItem: InventoryItem = {
        ...values,
        description: existingRegistration?.description ?? values.description,
        uuid: createUuid(),
        status,
        lastTimeTouched: historyEntry.timestamp,
        history: [historyEntry],
      };
      setItems((currentItems) => [newItem, ...currentItems]);
      setToast({ message: status === 'active' ? 'Novo patrimônio cadastrado como ativo.' : 'Novo item criado como pendente.', tone: 'success' });
    }

    setModal(null);
    setSelectedHistoryItem(null);
  };

  const handleReviewStatus = (item: InventoryItem, nextStatus: 'active' | 'rejected') => {
    if (!session || session.role !== 'adm' || item.status !== 'pending') {
      return;
    }

    setItems((currentItems) => currentItems.map((currentItem) => {
      if (currentItem.status !== 'pending' || (nextStatus === 'active' ? descriptionKey(currentItem.description) !== descriptionKey(item.description) : currentItem.uuid !== item.uuid)) {
        return currentItem;
      }

      const historyEntry = createHistoryEntry(session, nextStatus === 'active' ? 'approved' : 'rejected', nextStatus === 'active' ? 'Patrimônio aprovado pelo gestor.' : 'Patrimônio rejeitado pelo gestor.', {
        previousStatus: currentItem.status,
        nextStatus,
        nextCity: currentItem.cidade,
      });

      return {
        ...currentItem,
        status: nextStatus,
        lastTimeTouched: historyEntry.timestamp,
        history: [...currentItem.history, historyEntry],
      };
    }));
    setSelectedHistoryItem(null);
    setToast({ message: nextStatus === 'active' ? 'Patrimônio aprovado e liberado para consulta.' : 'Patrimônio rejeitado e mantido fora da lista operacional.', tone: nextStatus === 'active' ? 'success' : 'info' });
  };

  const handleExport = (rows: InventoryItem[], columnKeys: InventoryColumnKey[], format: 'csv' | 'pdf', filenamePrefix: string, generatedBy: AppUser) => {
    const columns = getInventoryReportColumns(columnKeys);
    if (format === 'csv') {
      downloadTextFile(createCsvContent(rows, columns), `${filenamePrefix}.csv`, 'text/csv;charset=utf-8');
      setToast({ message: `CSV gerado com ${formatQuantity(rows.length)} registro(s).`, tone: 'success', detail: 'O arquivo foi baixado pelo navegador.' });
    } else {
      const opened = openPrintReport(createReportHtml({ title: 'Relatório patrimonial CBM SP', rows, columns, generatedBy }));
      setToast(opened
        ? { message: `Relatório aberto com ${formatQuantity(rows.length)} registro(s).`, tone: 'info', detail: 'Na janela de impressão, escolha “Salvar como PDF”.' }
        : { message: 'Não foi possível abrir o relatório.', tone: 'info', detail: 'Permita pop-ups para este site e tente novamente.' });
    }
  };

  const handleExportCurrent = (rows: InventoryItem[], columnKeys: InventoryColumnKey[]) => {
    if (!session) {
      return;
    }
    handleExport(rows, columnKeys, 'pdf', 'consulta-patrimonial-cbm-sp', session);
  };

  const handleExportAll = (format: 'csv' | 'pdf') => {
    if (!session) {
      return;
    }

    handleExport(visibleItemsForRole(items, session.role), defaultInventoryColumns, format, 'almoxarifado-cbm-sp', session);
    setExportScope(null);
  };

  if (!session) {
    return <LoginScreen users={users} onLogin={handleLogin} />;
  }

  const currentPage: AppPage = session.role === 'reader' && page !== 'profile'
    ? 'inventory'
    : session.role !== 'adm' && page === 'users' ? 'dashboard' : page;

  return (
    <>
      <InventoryShell user={session} page={currentPage} onNavigate={handleNavigate} onLogout={handleLogout} onExportAll={() => setExportScope('all')} theme={theme} onToggleTheme={toggleTheme}>
        {currentPage === 'dashboard' ? (
          <DashboardPage user={session} items={items} onNavigate={handleNavigate} onFilterInventory={handleFilterInventory} onOpenHistory={setSelectedHistoryItem} onEditItem={(item) => setModal({ mode: 'edit', item })} onCreate={() => setModal({ mode: 'create' })} />
        ) : currentPage === 'inventory' ? (
          <InventoryPage user={session} items={items} initialFilter={inventoryFilter} onOpenHistory={setSelectedHistoryItem} onApproveItem={(item) => handleReviewStatus(item, 'active')} onRejectItem={(item) => handleReviewStatus(item, 'rejected')} onEdit={(item) => setModal({ mode: 'edit', item })} onCreate={() => setModal({ mode: 'create' })} onExportCurrent={handleExportCurrent} onFilterChange={handleInventoryFilterChange} onToast={(nextToast) => setToast(nextToast)} />
        ) : currentPage === 'users' ? (
          <UserManagementPage users={users} onSelectUser={setSelectedUser} />
        ) : (
          <ProfilePage user={session} onSave={handleSaveUserProfile} />
        )}
      </InventoryShell>

      <HistoryDrawer item={selectedHistoryItem} onClose={() => setSelectedHistoryItem(null)} />
      {modal && <ItemFormModal items={items} item={modal.mode === 'edit' ? modal.item : null} role={session.role} onClose={() => setModal(null)} onSubmit={handleSaveItem} />}
      {selectedUser && session.role === 'adm' && <EditUserRoleModal user={selectedUser} onClose={() => setSelectedUser(null)} onSave={handleUpdateUserRole} />}
      {exportScope === 'all' && <ExportFormatModal itemCount={visibleItemsForRole(items, session.role).length} onClose={() => setExportScope(null)} onExport={handleExportAll} />}
      <ToastBanner toast={toast} onClose={() => setToast(null)} />
    </>
  );
}

export default App;
