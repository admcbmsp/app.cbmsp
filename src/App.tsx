import {
  ButtonHTMLAttributes,
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Icon } from './components/Icon';
import { BrandLogo } from './components/BrandLogo';
import { Dialog } from './components/Dialog';
import { DynamicDataTable } from './components/DynamicDataTable';
import type { TableAction } from './components/TableActionMenu';
import { FilterDropdown } from './components/FilterDropdown';
import { InventoryViewTemplates } from './components/InventoryViewTemplates';
import { RecentMovementsTable } from './components/inventory/RecentMovementsTable';
import { BadgeKind, StatusBadge } from './components/inventory/StatusBadge';
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
  inventoryHistoryActionLabels,
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
  getCityLabel,
  getRoleLabel,
  getTypeIcon,
  getTypeLabel,
  getUserDisplayName,
  itemsForUnit,
  visibleItemsForRole,
} from './utils/inventory';
import { getAppRouteHash, isValidAppRouteHash, parseAppRoute, updateAppRouteUrl } from './utils/appRouting';
import { createCsvContent, downloadTextFile } from './utils/exports';
import type { ExportColumn } from './utils/exports';
import {
  defaultInventoryColumns,
  getInventoryReportColumns,
} from './services/inventoryReports';
import type { InventoryColumnKey } from './services/inventoryReports';
import { normalizeInventoryFilters } from './services/savedInventoryViews';
import { createReportHtml } from './services/reportHtml';
import { openPrintReport } from './services/printReport';
import { applyTheme, getInitialTheme, ThemeMode } from './theme/theme';
import { COLOR_TRANSITION_CLASS } from './theme/motion';
import { useApplicationViewportHeight } from './hooks/useApplicationViewportHeight';
import { defaultInventoryGroupColumns } from './types/inventoryViews';
import type { InventoryFilters, InventoryGroupColumnKey } from './types/inventoryViews';
import type { DynamicDataTableColumn } from './components/DynamicDataTable';

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
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold ${COLOR_TRANSITION_CLASS} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
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
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 ${COLOR_TRANSITION_CLASS} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${className}`}
    >
      {children}
    </button>
  );
}

function LoginScreen({ users, onLogin }: { users: AppUser[]; onLogin: (user: AppUser) => void }) {
  const applicationHeight = useApplicationViewportHeight();
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
    <main className="application-login bg-[#0b1224] text-white" style={{ minHeight: `${applicationHeight}px` }}>
      <div className="mx-auto grid min-h-screen max-w-[1500px] flex-1 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden overflow-hidden px-12 py-12 lg:flex lg:flex-col lg:justify-between xl:px-20">
          <div className="relative flex items-center gap-3">
            <BrandLogo className="h-12 w-12" />
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
                <div key={label} className="rounded-md border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
                  <p className="text-2xl font-semibold text-white">{value}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="relative text-xs text-slate-500">Ambiente demonstrativo · sem conexão com sistemas reais</p>
        </section>

        <section className="flex items-center justify-center bg-slate-50 px-5 py-8 text-slate-900 sm:px-8 lg:rounded-l-md lg:px-16">
          <div className="w-full max-w-md">
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <BrandLogo className="h-12 w-12" />
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
                <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
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
                    className={`flex w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3.5 py-3 text-left ${COLOR_TRANSITION_CLASS} hover:border-primary hover:bg-[var(--color-hover)]`}
                  >
                    <span>
                      <span className="block text-sm font-semibold text-slate-800">{user.name}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">{user.email}</span>
                    </span>
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">{getRoleLabel(user.role)}</span>
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

// Operational documentation: ./App.DashboardPage.operations.md
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
          <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Valor estimado do estoque</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{formatCurrency(estimatedStockValue)}</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-600"><Icon name="currency" className="h-5 w-5" /></span>
            </div>
            <p className="mt-4 text-xs text-slate-500">Soma do valor estimado de {formatQuantity(activeItems.length)} patrimônio(s) ativo(s).</p>
          </div>
        </section>
      )}

      <>
          <section className="mt-6 rounded-md border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40 sm:p-6">
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
                  className={`group flex min-h-24 items-center justify-between gap-4 rounded-md border border-slate-200 bg-white p-4 text-left shadow-sm ${COLOR_TRANSITION_CLASS} hover:border-primary hover:bg-[var(--color-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}
                >
                  <span>
                    <span className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{metric.label}</span>
                    <span className="mt-2 block text-2xl font-semibold tracking-tight text-slate-950">{formatQuantity(metric.value)}</span>
                  </span>
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${metric.tone}`}>
                    <Icon name={metric.icon} className="h-5 w-5" />
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="mt-6">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Movimentações recentes</h2>
                <p className="mt-1 text-sm text-muted-foreground">Últimas alterações registradas nos itens disponíveis para este perfil.</p>
              </div>
              <button type="button" onClick={() => onNavigate('inventory')} className={`text-xs font-bold text-primary ${COLOR_TRANSITION_CLASS} hover:text-primary-strong`}>Controle de patrimônio <span aria-hidden="true">→</span></button>
            </div>
            <RecentMovementsTable
              movements={recentMovements}
              onActivate={({ item }) => user.role === 'adm' && item.status === 'pending' ? onEditItem(item) : onOpenHistory(item)}
            />
          </section>
      </>

      {user.role === 'adm' && (
        <section className="mt-6 rounded-md border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="text-lg font-semibold text-slate-950">Itens pendentes de aprovação</p>
                <p className="mt-1 text-sm text-slate-500">Selecione um item para editar os dados do patrimônio.</p>
              </div>
              <span className="rounded-md bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">{formatQuantity(pendingItems.length)} pendente(s)</span>
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
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-amber-50 text-xs font-bold text-amber-700">{getTypeIcon(item.type)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-800">{item.description}</span>
                    <span className="mt-1 block text-xs text-slate-500">{item.nrPatrimonio} · {getTypeLabel(item.type)} · {getCityLabel(item.cidade)}</span>
                  </span>
                  <StatusBadge kind={BadgeKind.Status} value={item.status} />
                  <Icon name="edit" className="h-4 w-4 shrink-0 text-slate-400" />
                </button>
              ))}
              {pendingItems.length === 0 && (
                <div className="flex items-center gap-3 py-6 text-sm text-slate-500">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-50 text-emerald-600"><Icon name="check" className="h-4 w-4" /></span>
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

// Operational documentation: ./App.InventorySummaryCard.operations.md
function InventorySummaryCard({ summary }: { summary: InventorySummary }) {
  const statesWithItems = (Object.entries(summary.stateCounts) as [ItemState, number][]).filter(([, count]) => count > 0);

  return (
    <article className="rounded-md border border-line bg-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tipo patrimonial</p>
          <h3 className="mt-1.5 break-words text-base font-semibold leading-6 text-foreground">{summary.description}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{getTypeLabel(summary.type)}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-2xl font-semibold tabular-nums leading-none text-foreground">{formatQuantity(summary.total)}</p>
          <p className="mt-1.5 text-xs text-muted-foreground">itens no total</p>
        </div>
      </div>

      {statesWithItems.length > 0 && (
        <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-4 sm:grid-cols-4">
          {statesWithItems.map(([state, count]) => (
            <div key={state} className="rounded-sm border border-line bg-surface-muted px-3 py-2">
              <dt className="text-xs leading-4 text-muted-foreground">{stateLabels[state]}</dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums leading-6 text-foreground">{formatQuantity(count)}</dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  );
}

const inventoryDetailColumns: DynamicDataTableColumn<InventoryItem, InventoryColumnKey>[] = [
  {
    key: 'nrPatrimonio',
    label: 'Número de patrimônio',
    locked: true,
    sortValue: (item) => item.nrPatrimonio,
    renderCell: (item) => <span className="text-sm font-semibold text-slate-700">{item.nrPatrimonio}</span>,
  },
  { key: 'item', label: 'Descrição do cadastro', align: 'start', sortValue: (item) => item.description, renderCell: (item) => <span className="text-sm text-slate-600">{item.description}</span> },
  { key: 'uuid', label: 'UUID', sortValue: (item) => item.uuid, renderCell: (item) => <span className="block max-w-[220px] truncate font-mono text-sm text-slate-500">{item.uuid}</span> },
  { key: 'type', label: 'Tipo', sortValue: (item) => getTypeLabel(item.type), renderCell: (item) => <span className="text-sm text-slate-600">{getTypeLabel(item.type)}</span> },
  { key: 'cidade', label: 'Cidade/unidade', sortValue: (item) => getCityLabel(item.cidade), renderCell: (item) => <span className="text-sm text-slate-600">{getCityLabel(item.cidade) || '—'}</span> },
  { key: 'state', label: 'Condição', sortValue: (item) => stateLabels[item.state], renderCell: (item) => <StatusBadge kind={BadgeKind.State} value={item.state} size="regular" /> },
  { key: 'operationalStatus', label: 'Operação', sortValue: (item) => operationalStatusLabels[item.operationalStatus], renderCell: (item) => <StatusBadge kind={BadgeKind.OperationalStatus} value={item.operationalStatus} size="regular" /> },
  { key: 'valor', label: 'Valor estimado', numeric: true, sortValue: (item) => item.valor, renderCell: (item) => <span className="text-sm text-slate-700">{formatCurrency(item.valor)}</span> },
  { key: 'status', label: 'Cadastro', sortValue: (item) => statusLabels[item.status], renderCell: (item) => <StatusBadge kind={BadgeKind.Status} value={item.status} size="regular" /> },
  { key: 'lastTimeTouched', label: 'Última movimentação', sortValue: (item) => Date.parse(item.lastTimeTouched), renderCell: (item) => <span className="whitespace-nowrap text-sm text-slate-500">{formatDateTime(item.lastTimeTouched)}</span> },
];

type InventoryGroupRow = [string, InventoryItem[]];

const inventoryGroupColumns: DynamicDataTableColumn<InventoryGroupRow, InventoryGroupColumnKey>[] = [
  {
    key: 'description',
    label: 'Item',
    align: 'start',
    locked: true,
    sortValue: ([description]) => description,
    renderCell: ([description]) => <span className="font-medium text-foreground">{description}</span>,
  },
  {
    key: 'total',
    label: 'Total',
    numeric: true,
    sortValue: ([, rows]) => rows.length,
    renderCell: ([, rows]) => <span className="font-semibold tabular-nums text-foreground">{formatQuantity(rows.length)}</span>,
  },
  ...operationalStatuses.map((status) => ({
    key: `operational:${status}` as InventoryGroupColumnKey,
    label: operationalStatusLabels[status],
    numeric: true,
    sortValue: ([, rows]: InventoryGroupRow) => rows.filter((item) => item.operationalStatus === status).length,
    renderCell: ([, rows]: InventoryGroupRow) => <span className="tabular-nums text-foreground">{formatQuantity(rows.filter((item) => item.operationalStatus === status).length)}</span>,
  })),
  ...itemStatuses.map((status) => ({
    key: `status:${status}` as InventoryGroupColumnKey,
    label: statusLabels[status],
    numeric: true,
    sortValue: ([, rows]: InventoryGroupRow) => rows.filter((item) => item.status === status).length,
    renderCell: ([, rows]: InventoryGroupRow) => <span className="tabular-nums text-foreground">{formatQuantity(rows.filter((item) => item.status === status).length)}</span>,
  })),
];

// Operational documentation: ./App.InventoryPage.operations.md
function InventoryPage({
  user,
  items,
  selectedDescription,
  initialFilter,
  onOpenHistory,
  onOpenDescription,
  onBackToInventory,
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
  selectedDescription: string | null;
  initialFilter: InventoryFilters | null;
  onOpenHistory: (item: InventoryItem) => void;
  onOpenDescription: (description: string) => void;
  onBackToInventory: (filter: InventoryFilters | null) => void;
  onEdit: (item: InventoryItem) => void;
  onCreate: () => void;
  onApproveItem: (item: InventoryItem) => void;
  onRejectItem: (item: InventoryItem) => void;
  onExportCurrent: (rows: InventoryItem[], columns: InventoryColumnKey[]) => void;
  onFilterChange: (filter: InventoryFilters | null) => void;
  onToast: (toast: Toast) => void;
}) {
  const [query, setQuery] = useState(() => initialFilter?.query ?? '');
  const [typeFilters, setTypeFilters] = useState<string[]>(() => initialFilter?.types ?? []);
  const [statusFilters, setStatusFilters] = useState<ItemStatus[]>(() => initialFilter?.statuses ?? []);
  const [stateFilters, setStateFilters] = useState<ItemState[]>(() => initialFilter?.states ?? []);
  const [operationalStatusFilters, setOperationalStatusFilters] = useState<OperationalStatus[]>(() => initialFilter?.operationalStatuses ?? []);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<InventoryColumnKey[]>(defaultInventoryColumns);
  const [visibleGroupColumns, setVisibleGroupColumns] = useState<InventoryGroupColumnKey[]>([...defaultInventoryGroupColumns]);
  const [groupColumnControlTarget, setGroupColumnControlTarget] = useState<HTMLDivElement | null>(null);
  const [detailColumnControlTarget, setDetailColumnControlTarget] = useState<HTMLDivElement | null>(null);
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
  const detailItems = useMemo(() => visibleItems.filter((item) => item.description === selectedDescription), [selectedDescription, visibleItems]);
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
  const activeFilterCount = [typeFilters, statusFilters, stateFilters, operationalStatusFilters].filter((values) => values.length > 0).length;
  const currentFilters = normalizeInventoryFilters({
    query,
    types: typeFilters,
    statuses: statusFilters,
    states: stateFilters,
    operationalStatuses: operationalStatusFilters,
  });

  const applySavedView = (filters: InventoryFilters | null, columns: InventoryColumnKey[], groupColumns: InventoryGroupColumnKey[]) => {
    const roleSafeFilters = user.role === 'reader'
      ? normalizeInventoryFilters({ ...(filters ?? {}), statuses: filters?.statuses?.filter((status) => status === 'active') })
      : normalizeInventoryFilters(filters);
    const roleSafeColumns: InventoryColumnKey[] = columns.includes('nrPatrimonio') ? columns : ['nrPatrimonio', ...columns];
    const roleSafeGroupColumns: InventoryGroupColumnKey[] = groupColumns.includes('description') ? groupColumns : ['description', ...groupColumns];
    setQuery(roleSafeFilters?.query ?? '');
    setTypeFilters(roleSafeFilters?.types ?? []);
    setStatusFilters(roleSafeFilters?.statuses ?? []);
    setStateFilters(roleSafeFilters?.states ?? []);
    setOperationalStatusFilters(roleSafeFilters?.operationalStatuses ?? []);
    setVisibleColumns(roleSafeColumns);
    setVisibleGroupColumns(roleSafeGroupColumns);
    setSummaryVisible(false);
    setSuggestionsOpen(false);
    if (selectedDescription !== null) {
      onBackToInventory(roleSafeFilters);
    } else {
      onFilterChange(roleSafeFilters);
    }
  };

  return (
    <>
      <section className="mb-3 flex flex-col justify-between gap-3 sm:mb-7 sm:gap-5 md:flex-row md:items-end">
        <div>
          <p className="mb-1 hidden text-xs font-bold uppercase tracking-[0.18em] text-primary sm:mb-2 sm:block">Consulta de ativos</p>
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">{selectedDescription ?? (user.role === 'reader' ? 'Consulta de Ativos' : 'Controle de patrimônio')}</h1>
          {selectedDescription !== null && <Button variant="ghost" onClick={() => onBackToInventory(currentFilters)} className="mt-2 sm:mt-3">Voltar ao estoque patrimonial</Button>}
          <p className="mt-3 hidden max-w-2xl text-sm leading-6 text-slate-500 sm:block">{selectedDescription === null ? 'Consulte os totais por descrição e abra um item para ver seus patrimônios.' : `${detailItems.length} patrimônio(s) visível(is) neste cadastro. Cada número de patrimônio corresponde a uma unidade.`}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            aria-label="Exportar PDF"
            onClick={() => selectedDescription === null ? exportGroups() : onExportCurrent(detailItems, visibleColumns)}
            disabled={displayedItems.length === 0}
          >
            <Icon name="download" className="h-4 w-4" aria-hidden="true" />
            <span className="sm:hidden" aria-hidden="true">PDF</span>
            <span className="hidden sm:inline" aria-hidden="true">Exportar PDF</span>
          </Button>
          <InventoryViewTemplates userId={user.id} autoApplyDefaultOnEntry={autoApplyDefaultOnEntry} filters={currentFilters} columns={visibleColumns} groupColumns={visibleGroupColumns} onApply={applySavedView} onToast={onToast} />
          {canCreateItems(user.role) && (
            <Button onClick={onCreate}>
              <Icon name="plus" className="h-4 w-4" />
              Novo item
            </Button>
          )}
        </div>
      </section>

      <section aria-label="Busca e filtros" hidden={selectedDescription !== null}>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="min-w-0 flex-1">
              <label htmlFor="inventory-search" className="sr-only">Descrição ou patrimônio</label>
              <div className="relative">
                <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <TextInput id="inventory-search" value={query} onChange={(event) => handleQueryChange(event.target.value)} onFocus={() => setSuggestionsOpen(query.trim().length >= 3)} placeholder="Ex.: mangueira, CBM-VTR-0001..." className="!h-10 pl-10" />
                {suggestionsOpen && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-md border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10">
                    <p className="px-3 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Sugestões de descrição</p>
                    <ul className="max-h-64 overflow-y-auto">
                      {suggestions.map((suggestion) => (
                        <li key={suggestion.description}>
                          <button type="button" onClick={() => selectSuggestion(suggestion.description)} className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left ${COLOR_TRANSITION_CLASS} hover:bg-[var(--color-hover)]`}>
                            <span className="min-w-0 truncate text-sm font-medium text-slate-700">{suggestion.description}</span>
                            <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">{suggestion.count} item(ns)</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              aria-expanded={filtersExpanded}
              aria-controls="inventory-filter-controls"
              onClick={() => setFiltersExpanded((expanded) => !expanded)}
              className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-sm font-medium text-slate-700 sm:hidden ${COLOR_TRANSITION_CLASS} ${activeFilterCount ? 'border-primary bg-[var(--color-hover)] text-primary' : 'border-slate-200 bg-white'}`}
            >
              <Icon name="filter" className="h-4 w-4" />
              Filtros
              {activeFilterCount > 0 && <span className="rounded-full bg-primary px-1.5 text-[10px] leading-4 text-white">{activeFilterCount}</span>}
            </button>
          </div>
          <div id="inventory-filter-controls" className={`${filtersExpanded ? 'flex' : 'hidden'} flex-wrap items-center gap-2 sm:flex`}>
            {selectedDescription === null && <div ref={setGroupColumnControlTarget} className="shrink-0" />}
            <FilterDropdown
              id="inventory-type-filter"
              label="Tipo"
              selectedValues={typeFilters}
              options={availableTypes.map((type) => ({ value: type, label: getTypeLabel(type) }))}
              onChange={(values) => { setTypeFilters(values); setSummaryVisible(false); syncFiltersToUrl({ types: values }); }}
            />
            <FilterDropdown
              id="inventory-status-filter"
              label="Cadastro"
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
              label="Operação"
              selectedValues={operationalStatusFilters}
              options={operationalStatuses.map((status) => ({ value: status, label: operationalStatusLabels[status] }))}
              onChange={(values) => {
                const nextOperationalStatuses = values as OperationalStatus[];
                setOperationalStatusFilters(nextOperationalStatuses);
                setSummaryVisible(false);
                syncFiltersToUrl({ operationalStatuses: nextOperationalStatuses });
              }}
            />
            {hasFilters && <Button type="button" variant="ghost" onClick={clearFilters} className="min-h-10 px-3">Limpar</Button>}
          </div>
        </div>
      </section>

      {selectedDescription === null && summaryVisible && (
        <section aria-label="Resumo da busca" aria-live="polite" className="mt-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Resumo da busca</p>
              <p className="mt-1 text-sm text-slate-500">Distribuição dos resultados por descrição e condição operacional.</p>
            </div>
            <span className="hidden text-xs font-medium text-slate-400 sm:block">{formatQuantity(filteredItems.length)} item(ns) considerado(s)</span>
          </div>
          {summaries.length > 0 ? (
            <div className="mt-3 grid gap-4 xl:grid-cols-2">
              {summaries.map((summary) => <InventorySummaryCard key={`${summary.type}-${summary.description}`} summary={summary} />)}
            </div>
          ) : (
            <p className="mt-3 rounded-md border border-slate-200 bg-white px-4 py-5 text-sm text-slate-500">Nenhum resultado corresponde à busca e aos filtros aplicados.</p>
          )}
        </section>
      )}

      <section aria-label="Bens cadastrados" className="mt-3 min-w-0 sm:mt-5">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 sm:mb-3 sm:gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-950">Bens cadastrados</h2>
            <p className="mt-1 text-xs text-slate-500">
              <span className="sm:hidden">{selectedDescription === null ? `${formatQuantity(groups.length)} descr. · ${formatQuantity(filteredItems.length)} de ${formatQuantity(visibleItems.length)} itens` : 'Detalhes individuais e histórico'}</span>
              <span className="hidden sm:inline">{selectedDescription === null ? `${formatQuantity(groups.length)} descrição(ões) · ${formatQuantity(filteredItems.length)} patrimônio(s) filtrado(s) de ${formatQuantity(visibleItems.length)} visível(is).` : 'Detalhes individuais e histórico de movimentações'}</span>
            </p>
          </div>
          {selectedDescription === null ? (
            <Button
              type="button"
              variant="secondary"
              aria-pressed={summaryVisible}
              onClick={() => { setSummaryVisible((current) => !current); setSuggestionsOpen(false); }}
              disabled={!hasFilters}
              className="min-h-9 px-3 py-1.5 text-xs"
            >
              <Icon name="archive" className="h-3.5 w-3.5" />
              {summaryVisible ? 'Ocultar resumo' : 'Fazer resumo'}
            </Button>
          ) : (
            <div ref={setDetailColumnControlTarget} className="shrink-0" />
          )}
        </div>
        {selectedDescription === null ? (
          <DynamicDataTable<InventoryGroupRow, InventoryGroupColumnKey>
            ariaLabel="Patrimônios por descrição"
            rows={groups}
            columns={inventoryGroupColumns}
            mobileCardLayout="grid"
            visibleColumnKeys={visibleGroupColumns}
            defaultColumnKeys={defaultInventoryGroupColumns}
            onVisibleColumnKeysChange={setVisibleGroupColumns}
            columnControlTarget={groupColumnControlTarget}
            getRowKey={([description]) => description}
            getRowLabel={([description]) => `Abrir patrimônios de ${description}`}
            onRowClick={([description]) => { onOpenDescription(description); setSuggestionsOpen(false); }}
            getActionMenuLabel={([description]) => `Ações para ${description}`}
            getActions={([description]): TableAction[] => [{
              key: 'open',
              label: 'Abrir patrimônios',
              icon: 'eye',
              onSelect: () => { onOpenDescription(description); setSuggestionsOpen(false); },
            }]}
          />
        ) : (
          <>
            <DynamicDataTable
              ariaLabel="Detalhes individuais dos patrimônios"
              rows={detailItems}
              columns={inventoryDetailColumns}
              mobileCardLayout="detail-grid"
              visibleColumnKeys={visibleColumns}
              defaultColumnKeys={defaultInventoryColumns}
              onVisibleColumnKeysChange={setVisibleColumns}
              columnControlTarget={detailColumnControlTarget}
              getRowKey={(item) => item.uuid}
              getActionMenuLabel={(item) => `Ações para ${item.description}, ${item.nrPatrimonio}`}
              getActions={(item): TableAction[] => [
                { key: 'history', label: 'Ver histórico', icon: 'history', onSelect: () => onOpenHistory(item) },
                ...(canEditItem(user.role) ? [{ key: 'edit', label: 'Editar item', icon: 'edit' as const, onSelect: () => onEdit(item) }] : []),
                ...(user.role === 'adm' && item.status === 'pending' ? [
                  { key: 'approve', label: 'Aprovar item', icon: 'check' as const, tone: 'success' as const, onSelect: () => onApproveItem(item) },
                  { key: 'reject', label: 'Rejeitar item', icon: 'close' as const, tone: 'danger' as const, onSelect: () => onRejectItem(item) },
                ] : []),
              ]}
            />
          </>
        )}
        {displayedItems.length === 0 && (
          <div className="py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-slate-100 text-slate-400"><Icon name="search" className="h-5 w-5" /></div>
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
      <button type="button" aria-label="Fechar detalhes" onClick={onClose} className="application-backdrop absolute inset-0" />
      <aside className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-5 sm:px-6">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Histórico</p>
            <h2 className="mt-2 max-w-sm break-words text-xl font-semibold leading-7 text-slate-950">Histórico de alterações</h2>
            <p className="mt-1 break-words text-sm font-medium text-slate-600">{item.description}</p>
            <p className="mt-1 break-words text-xs text-slate-500">Patrimônio {item.nrPatrimonio} · {getCityLabel(item.cidade)}</p>
          </div>
          <IconButton label="Fechar histórico" onClick={onClose} className="shrink-0"><Icon name="close" className="h-5 w-5" /></IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge kind={BadgeKind.Status} value={item.status} />
            <StatusBadge kind={BadgeKind.State} value={item.state} />
            <StatusBadge kind={BadgeKind.OperationalStatus} value={item.operationalStatus} />
            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{getTypeLabel(item.type)}</span>
          </div>

          <div className="mt-7 rounded-md border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Última movimentação</p>
            <p className="mt-2 text-sm font-semibold text-slate-800">{formatDateTime(item.lastTimeTouched)}</p>
            <p className="mt-1 text-xs text-slate-500">O histórico é mantido localmente nesta demonstração.</p>
          </div>

          <div className="mt-6 space-y-3">
            {history.map((entry) => (
              <article key={entry.id} className="relative rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--color-hover)] text-primary"><Icon name="history" className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">{inventoryHistoryActionLabels[entry.action]}</p>
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
        <div className="border-t border-slate-100 px-4 py-5 sm:px-6">
          <Button variant="ghost" onClick={onClose} className="w-full">Fechar histórico</Button>
        </div>
      </aside>
    </div>
  );
}

// Operational documentation: ./App.ItemFormModal.operations.md
function ItemFormModal({
  items,
  item,
  role,
  defaultCity,
  onClose,
  onSubmit,
}: {
  items: InventoryItem[];
  item: InventoryItem | null;
  role: UserRole;
  defaultCity: City | null;
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
          cidade: defaultCity ?? City.EB_PAULINIA,
          status: role === 'adm' ? 'active' : 'pending',
        },
  );
  const effectiveStatus = !isEditing && (role === 'adm' || hasApprovedRegistration(items, form.description)) ? 'active' : form.status;
  const [error, setError] = useState('');
  const [cityQuery, setCityQuery] = useState<string>(getCityLabel(item?.cidade ?? defaultCity ?? City.EB_PAULINIA));
  const [citySuggestionsOpen, setCitySuggestionsOpen] = useState(false);

  const citySuggestions = useMemo(() => {
    const normalizedQuery = normalizeSearchText(cityQuery.trim());

    return cityOptions
      .filter((city) => !normalizedQuery || normalizeSearchText(getCityLabel(city)).includes(normalizedQuery))
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
    setCityQuery(getCityLabel(city));
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
    const selectedCity = cityOptions.find((city) => normalizeSearchText(getCityLabel(city)) === normalizeSearchText(cityQuery.trim()));
    if (!selectedCity || form.cidade !== selectedCity) {
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
    <Dialog
      open
      onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}
      title={isEditing ? 'Editar registro' : 'Cadastrar novo item'}
      caption={isEditing && !isAdmin ? 'Seu perfil pode alterar o estado físico, a situação operacional e a cidade/unidade.' : 'Cada cadastro representa uma unidade com número de patrimônio único.'}
      closeLabel="Fechar formulário"
      size="lg"
      actions={[
        { label: 'Cancelar', variant: 'secondary', onClick: onClose },
        { label: 'Salvar registro', variant: 'primary', type: 'submit', form: 'item-form' },
      ]}
    >
        <form id="item-form" onSubmit={handleSubmit} className="space-y-5">
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
                <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-md border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10">
                  <ul id="item-city-options" role="listbox" className="grid gap-1">
                    {citySuggestions.map((city) => (
                      <li key={city}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={form.cidade === city}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => selectCity(city)}
                          className={`flex w-full items-center rounded-md px-3 py-2.5 text-left text-sm font-medium text-slate-700 ${COLOR_TRANSITION_CLASS} hover:bg-[var(--color-hover)] hover:text-primary`}
                        >
                          {getCityLabel(city)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div>
              <FieldLabel htmlFor="item-operational-status">Operação</FieldLabel>
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
              <FieldLabel htmlFor="item-status">Cadastro</FieldLabel>
              {isAdmin && isEditing ? (
                <SelectInput id="item-status" value={form.status} onChange={(event) => updateField('status', event.target.value as ItemStatus)}>
                  {itemStatuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
                </SelectInput>
              ) : (
                <div className={`flex h-11 items-center rounded-md border border-dashed px-3.5 text-sm font-semibold ${effectiveStatus === 'active' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-amber-300 bg-amber-50 text-amber-700'}`}>
                  <span className={`mr-2 h-2 w-2 rounded-full ${effectiveStatus === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {statusLabels[effectiveStatus]}
                </div>
              )}
            </div>
          </div>

          {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">{error}</div>}

          <div className="rounded-md bg-surface-muted p-4 text-xs leading-5 text-muted-foreground">
            <div className="flex gap-2"><Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /><span>{isEditing && !isAdmin ? 'O almoxarife pode atualizar condição operacional e cidade/unidade.' : role === 'almoxarife' ? 'Exemplares de cadastros já aprovados entram como ativos. Cadastros novos aguardam aprovação do gestor.' : 'Itens criados pelo gestor entram automaticamente como ativos.'}</span></div>
          </div>
        </form>
    </Dialog>
  );
}

function ToastBanner({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  if (!toast) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[60] flex w-auto max-w-sm items-start gap-3 rounded-md border border-emerald-200 bg-white px-4 py-3 shadow-xl shadow-slate-900/10 sm:bottom-5 sm:left-auto sm:right-5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600"><Icon name={toast.tone === 'success' ? 'check' : 'info'} className="h-4 w-4" /></div>
      <div className="min-w-0 flex-1 break-words pt-0.5"><p className="text-sm font-semibold text-slate-800">{toast.message}</p><p className="mt-0.5 text-xs text-slate-500">{toast.detail ?? 'Alteração aplicada apenas nesta sessão.'}</p></div>
      <IconButton label="Fechar mensagem" onClick={onClose} className="-mr-2 -mt-2"><Icon name="close" className="h-4 w-4" /></IconButton>
    </div>
  );
}

// Operational documentation: ./App.ExportFormatModal.operations.md
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
    <Dialog
      open
      onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}
      title="Escolha o formato"
      caption={`Serão exportados ${formatQuantity(itemCount)} registros permitidos para o seu perfil.`}
      closeLabel="Fechar exportação"
      size="sm"
      actions={[
        { label: 'Exportar CSV', variant: 'secondary', onClick: () => onExport('csv') },
        { label: 'Exportar PDF', variant: 'primary', onClick: () => onExport('pdf') },
      ]}
    >
      <p className="text-sm text-muted-foreground">Selecione um formato para gerar o arquivo.</p>
    </Dialog>
  );
}

function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());
  const [session, setSession] = useState<AppUser | null>(null);
  const [users, setUsers] = useState<AppUser[]>(demoUsers);
  const [initialRoute] = useState(() => parseAppRoute(window.location.hash));
  const [page, setPage] = useState<AppPage>(() => initialRoute.page);
  const [inventoryFilter, setInventoryFilter] = useState<InventoryFilters | null>(() => initialRoute.filter);
  const [selectedDescription, setSelectedDescription] = useState<string | null>(() => initialRoute.description);
  const [selectedUnit, setSelectedUnit] = useState<City | null>(() => initialRoute.unit);
  const [items, setItems] = useState<InventoryItem[]>(inventorySeed);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<InventoryItem | null>(null);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [exportScope, setExportScope] = useState<'all' | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const unitScopedItems = useMemo(() => itemsForUnit(items, selectedUnit), [items, selectedUnit]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const syncRouteFromLocation = () => {
      let nextRoute = parseAppRoute(window.location.hash);
      const nextUnit = nextRoute.hasUnit ? nextRoute.unit : session?.unidade || null;
      if (session && session.role !== 'adm' && nextRoute.page === 'users') {
        const fallbackPage: AppPage = session.role === 'reader' ? 'inventory' : 'dashboard';
        updateAppRouteUrl(fallbackPage, null, true, nextUnit);
        nextRoute = { ...nextRoute, page: fallbackPage, filter: null };
      }
      if (session?.role === 'reader') {
        const targetPage: AppPage = nextRoute.page === 'dashboard' || nextRoute.page === 'users'
          ? 'inventory'
          : nextRoute.page;
        if (targetPage === 'inventory' || targetPage === 'details') {
          const readerFilter = normalizeInventoryFilters({
            ...(nextRoute.filter ?? {}),
            statuses: nextRoute.filter?.statuses?.filter((status) => status === 'active'),
          });
          const targetDescription = targetPage === 'details' ? nextRoute.description : null;
          if (getAppRouteHash(targetPage, readerFilter, nextUnit, targetDescription) !== window.location.hash) {
            updateAppRouteUrl(targetPage, readerFilter, true, nextUnit, targetDescription);
          }
          nextRoute = { ...nextRoute, page: targetPage, filter: readerFilter, description: targetDescription };
        }
      }
      if (!isValidAppRouteHash(window.location.hash)) {
        const routeUnit = nextRoute.hasUnit ? nextRoute.unit : session?.unidade || undefined;
        updateAppRouteUrl(nextRoute.page, nextRoute.filter, true, routeUnit, nextRoute.description);
      }
      if (session?.unidade && !nextRoute.hasUnit) {
        updateAppRouteUrl(nextRoute.page, nextRoute.filter, true, session.unidade, nextRoute.description);
      }
      setPage(nextRoute.page);
      setInventoryFilter(nextRoute.filter);
      setSelectedDescription(nextRoute.description);
      setSelectedUnit(nextUnit);
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
    const nextUnit = requestedRoute.hasUnit ? requestedRoute.unit : user.unidade || null;
    const canOpenRequestedPage = requestedRoute.page !== 'users' || user.role === 'adm';
    const landingPage: AppPage = requestedRoute.page === 'profile'
      ? 'profile'
      : user.role === 'reader'
        ? requestedRoute.page === 'details' ? 'details' : 'inventory'
        : canOpenRequestedPage ? requestedRoute.page : 'dashboard';
    const requestedFilter = user.role === 'reader'
      ? normalizeInventoryFilters({ ...(requestedRoute.filter ?? {}), statuses: requestedRoute.filter?.statuses?.filter((status) => status === 'active') })
      : requestedRoute.filter;
    const landingFilter = landingPage === 'inventory' || landingPage === 'details' ? requestedFilter : null;
    const landingDescription = landingPage === 'details' ? requestedRoute.description : null;
    setSession(user);
    setSelectedUnit(nextUnit);
    setPage(landingPage);
    setInventoryFilter(landingFilter);
    setSelectedDescription(landingDescription);
    updateAppRouteUrl(landingPage, landingFilter, true, nextUnit, landingDescription);
    setSelectedHistoryItem(null);
    setSelectedUser(null);
    setModal(null);
    setExportScope(null);
  };

  const handleLogout = () => {
    setSession(null);
    setSelectedUnit(null);
    setInventoryFilter(null);
    setSelectedDescription(null);
    window.history.replaceState(window.history.state, '', '#/login');
    setSelectedHistoryItem(null);
    setSelectedUser(null);
    setModal(null);
    setExportScope(null);
    setToast(null);
  };

  const handleNavigate = (nextPage: AppPage) => {
    if (nextPage === 'details' && selectedDescription === null) {
      return;
    }

    if (nextPage === 'users' && session?.role !== 'adm') {
      return;
    }

    if (session?.role === 'reader' && nextPage !== 'profile' && nextPage !== 'details') {
      const nextFilter = nextPage === 'inventory' && page === 'details' ? inventoryFilter : null;
      setPage('inventory');
      setInventoryFilter(nextFilter);
      setSelectedDescription(null);
      updateAppRouteUrl('inventory', nextFilter, false, selectedUnit);
      return;
    }

    const nextFilter = nextPage === 'inventory' && page === 'details' ? inventoryFilter : null;
    const nextDescription = nextPage === 'details' ? selectedDescription : null;
    setInventoryFilter(nextFilter);
    setSelectedDescription(nextDescription);
    setPage(nextPage);
    setSelectedUser(null);
    updateAppRouteUrl(nextPage, nextFilter, false, selectedUnit, nextDescription);
  };

  const handleSelectUnit = (unit: City | null) => {
    const nextPage: AppPage = session?.role === 'reader' && page !== 'profile' && page !== 'details' ? 'inventory' : page;
    if (nextPage !== page) {
      setPage(nextPage);
      setSelectedDescription(null);
    }
    setSelectedUnit(unit);
    setSelectedHistoryItem(null);
    setModal(null);
    setExportScope(null);
    updateAppRouteUrl(nextPage, nextPage === 'inventory' || nextPage === 'details' ? inventoryFilter : null, false, unit, nextPage === 'details' ? selectedDescription : null);
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
      setSelectedDescription(null);
      updateAppRouteUrl(landingPage, null, true, selectedUnit);
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
    const nextUnit = profile.unidade !== session.unidade ? updatedUser.unidade || null : selectedUnit;
    setSelectedUnit(nextUnit);
    updateAppRouteUrl(page, page === 'inventory' || page === 'details' ? inventoryFilter : null, true, nextUnit, page === 'details' ? selectedDescription : null);
    setToast({ message: 'Perfil atualizado.', tone: 'success', detail: 'Seus dados foram atualizados nesta sessão do protótipo.' });
  };

  const handleFilterInventory = (filter: DashboardInventoryFilter) => {
    const nextFilter: InventoryFilters = filter.field === 'status'
      ? { statuses: [filter.value] }
      : { operationalStatuses: [filter.value] };
    setInventoryFilter(nextFilter);
    setSelectedDescription(null);
    setPage('inventory');
    updateAppRouteUrl('inventory', nextFilter, false, selectedUnit);
  };

  const handleOpenDescription = (description: string) => {
    setSelectedDescription(description);
    setSelectedHistoryItem(null);
    setPage('details');
    updateAppRouteUrl('details', inventoryFilter, false, selectedUnit, description);
  };

  const handleBackToInventory = (filter: InventoryFilters | null = inventoryFilter) => {
    setSelectedDescription(null);
    setPage('inventory');
    setInventoryFilter(filter);
    updateAppRouteUrl('inventory', filter, true, selectedUnit);
  };

  const handleInventoryFilterChange = (filter: InventoryFilters | null) => {
    const nextFilter = normalizeInventoryFilters(filter);
    setInventoryFilter(nextFilter);
    const routePage = page === 'details' && selectedDescription !== null ? 'details' : 'inventory';
    updateAppRouteUrl(routePage, nextFilter, true, selectedUnit, routePage === 'details' ? selectedDescription : null);
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
          const stateChanged = currentItem.state !== values.state;
          const operationalStatusChanged = currentItem.operationalStatus !== values.operationalStatus;
          const statusChanged = currentItem.status !== nextStatus;
          const changeSummaries = [
            cityChanged ? `Cidade/unidade alterada de ${getCityLabel(currentItem.cidade)} para ${getCityLabel(values.cidade)}.` : null,
            stateChanged ? `Condição alterada de ${stateLabels[currentItem.state]} para ${stateLabels[values.state]}.` : null,
            operationalStatusChanged ? `Operação alterada de ${operationalStatusLabels[currentItem.operationalStatus]} para ${operationalStatusLabels[values.operationalStatus]}.` : null,
            statusChanged ? `Cadastro alterado de ${statusLabels[currentItem.status]} para ${statusLabels[nextStatus]}.` : null,
          ].filter((summary): summary is string => summary !== null);
          const summary = changeSummaries.length > 0 ? changeSummaries.join(' ') : 'Dados do patrimônio atualizados.';
          const historyAction: InventoryHistoryAction = statusChanged
            ? nextStatus === 'rejected'
              ? 'rejected'
              : nextStatus === 'deactivated'
                ? 'deactivated'
                : 'administrativeStatusChanged'
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
      const status: ItemStatus = session.role === 'adm' || hasApprovedRegistration(unitScopedItems, values.description) ? 'active' : 'pending';
      const historyEntry = createHistoryEntry(session, 'created', status === 'active' ? 'Exemplar ativado em cadastro aprovado.' : 'Patrimônio criado e enviado para aprovação do gestor.', {
        nextStatus: status,
        nextCity: values.cidade,
      });
      const existingRegistration = unitScopedItems.find((item) => descriptionKey(item.description) === descriptionKey(values.description));
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
      if (currentItem.status !== 'pending' || (selectedUnit !== null && currentItem.cidade !== selectedUnit) || (nextStatus === 'active' ? descriptionKey(currentItem.description) !== descriptionKey(item.description) : currentItem.uuid !== item.uuid)) {
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

    handleExport(visibleItemsForRole(unitScopedItems, session.role), defaultInventoryColumns, format, 'almoxarifado-cbm-sp', session);
    setExportScope(null);
  };

  if (!session) {
    return <LoginScreen users={users} onLogin={handleLogin} />;
  }

  const currentPage: AppPage = session.role === 'reader' && page !== 'profile' && page !== 'details'
    ? 'inventory'
    : session.role !== 'adm' && page === 'users' ? 'dashboard' : page;

  return (
    <>
      <InventoryShell user={session} page={currentPage} selectedUnit={selectedUnit} onSelectUnit={handleSelectUnit} onNavigate={handleNavigate} onLogout={handleLogout} onExportAll={() => setExportScope('all')} theme={theme} onToggleTheme={toggleTheme}>
        {currentPage === 'dashboard' ? (
          <DashboardPage user={session} items={unitScopedItems} onNavigate={handleNavigate} onFilterInventory={handleFilterInventory} onOpenHistory={setSelectedHistoryItem} onEditItem={(item) => setModal({ mode: 'edit', item })} onCreate={() => setModal({ mode: 'create' })} />
        ) : currentPage === 'inventory' || currentPage === 'details' ? (
          <InventoryPage user={session} items={unitScopedItems} selectedDescription={currentPage === 'details' ? selectedDescription : null} initialFilter={inventoryFilter} onOpenHistory={setSelectedHistoryItem} onOpenDescription={handleOpenDescription} onBackToInventory={handleBackToInventory} onApproveItem={(item) => handleReviewStatus(item, 'active')} onRejectItem={(item) => handleReviewStatus(item, 'rejected')} onEdit={(item) => setModal({ mode: 'edit', item })} onCreate={() => setModal({ mode: 'create' })} onExportCurrent={handleExportCurrent} onFilterChange={handleInventoryFilterChange} onToast={(nextToast) => setToast(nextToast)} />
        ) : currentPage === 'users' ? (
          <UserManagementPage users={selectedUnit ? users.filter((user) => user.unidade === selectedUnit) : users} onSelectUser={setSelectedUser} />
        ) : (
          <ProfilePage user={session} onSave={handleSaveUserProfile} />
        )}
      </InventoryShell>

      <HistoryDrawer item={selectedHistoryItem} onClose={() => setSelectedHistoryItem(null)} />
      {modal && <ItemFormModal items={unitScopedItems} item={modal.mode === 'edit' ? modal.item : null} role={session.role} defaultCity={selectedUnit} onClose={() => setModal(null)} onSubmit={handleSaveItem} />}
      {selectedUser && session.role === 'adm' && <EditUserRoleModal user={selectedUser} onClose={() => setSelectedUser(null)} onSave={handleUpdateUserRole} />}
      {exportScope === 'all' && <ExportFormatModal itemCount={visibleItemsForRole(unitScopedItems, session.role).length} onClose={() => setExportScope(null)} onExport={handleExportAll} />}
      <ToastBanner toast={toast} onClose={() => setToast(null)} />
    </>
  );
}

export default App;
