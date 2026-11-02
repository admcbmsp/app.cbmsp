import {
  ButtonHTMLAttributes,
  FormEvent,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Icon } from './components/Icon';
import { inventorySeed } from './data/inventory';
import { demoPassword, demoUsers } from './data/users';
import { InventoryShell } from './layouts/InventoryShell';
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
  canEditAdministrativeFields,
  canEditItem,
  formatCurrency,
  formatQuantity,
  getOperationalStatusClasses,
  getOperationalStatusLabel,
  getRoleLabel,
  getStateClasses,
  getStateLabel,
  getStatusClasses,
  getStatusLabel,
  getTypeIcon,
  getTypeLabel,
  visibleItemsForRole,
} from './utils/inventory';
import { createCsvContent, createPdfContent, downloadTextFile, ExportColumn } from './utils/exports';
import { applyTheme, getInitialTheme, ThemeMode } from './theme/theme';
import { COLOR_TRANSITION_CLASS } from './theme/motion';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
};

type Toast = {
  message: string;
  tone: 'success' | 'info';
} | null;

type ModalState =
  | { mode: 'create' }
  | { mode: 'edit'; item: InventoryItem }
  | null;

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

type InventoryColumnKey = 'item' | 'uuid' | 'type' | 'cidade' | 'state' | 'operationalStatus' | 'quantidade' | 'valor' | 'status' | 'lastTimeTouched';

const inventoryColumnOptions: Array<{ key: InventoryColumnKey; label: string }> = [
  { key: 'item', label: 'Item e patrimônio' },
  { key: 'uuid', label: 'UUID' },
  { key: 'type', label: 'Tipo' },
  { key: 'cidade', label: 'Cidade/unidade' },
  { key: 'state', label: 'Condição' },
  { key: 'operationalStatus', label: 'Status operacional' },
  { key: 'quantidade', label: 'Quantidade' },
  { key: 'valor', label: 'Valor estimado' },
  { key: 'status', label: 'Status administrativo' },
  { key: 'lastTimeTouched', label: 'Última movimentação' },
];

const defaultInventoryColumns: InventoryColumnKey[] = [
  'item',
  'type',
  'cidade',
  'operationalStatus',
  'status',
  'lastTimeTouched',
];

const formatDateTime = (value: string) => new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
}).format(new Date(value));

const historyActionLabels: Record<InventoryHistoryAction, string> = {
  created: 'Criado',
  edited: 'Editado',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  moved: 'Movimentado',
  deactivated: 'Desativado',
};

const getInventoryColumnValue = (item: InventoryItem, columnKey: InventoryColumnKey) => {
  switch (columnKey) {
    case 'item':
      return `${item.description} · ${item.nrPatrimonio}`;
    case 'type':
      return getTypeLabel(item.type);
    case 'uuid':
      return item.uuid;
    case 'cidade':
      return item.cidade;
    case 'state':
      return stateLabels[item.state];
    case 'operationalStatus':
      return operationalStatusLabels[item.operationalStatus];
    case 'quantidade':
      return formatQuantity(item.quantidade);
    case 'valor':
      return formatCurrency(item.valor);
    case 'status':
      return statusLabels[item.status];
    case 'lastTimeTouched':
      return formatDateTime(item.lastTimeTouched);
    default:
      return '';
  }
};

const getExportColumns = (columnKeys: InventoryColumnKey[]): ExportColumn<InventoryItem>[] =>
  columnKeys.map((columnKey) => ({
    key: columnKey,
    label: inventoryColumnOptions.find((column) => column.key === columnKey)?.label ?? columnKey,
    getValue: (item: InventoryItem) => getInventoryColumnValue(item, columnKey),
  }));

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

function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
      {children}
    </label>
  );
}

function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none ${COLOR_TRANSITION_CLASS} placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-[var(--color-focus)] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${props.className ?? ''}`}
    />
  );
}

function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none ${COLOR_TRANSITION_CLASS} focus:border-primary focus:ring-4 focus:ring-[var(--color-focus)] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${props.className ?? ''}`}
    />
  );
}

function StatusBadge({ status }: { status: ItemStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusClasses(status)}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {getStatusLabel(status)}
    </span>
  );
}

function StateBadge({ state }: { state: ItemState }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getStateClasses(state)}`}>
      {getStateLabel(state)}
    </span>
  );
}

function OperationalStatusBadge({ status }: { status: OperationalStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getOperationalStatusClasses(status)}`}>
      {getOperationalStatusLabel(status)}
    </span>
  );
}

function LoginScreen({ onLogin }: { onLogin: (user: AppUser) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const user = demoUsers.find((candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase());

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
                {demoUsers.map((user) => (
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

function StatCard({
  label,
  value,
  helper,
  icon,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  icon: 'archive' | 'clock' | 'currency' | 'shield';
  tone: 'primary' | 'amber' | 'blue' | 'green';
}) {
  const toneClasses = {
    primary: 'bg-[var(--color-hover)] text-primary',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
          <Icon name={icon} className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-500">{helper}</p>
    </div>
  );
}

function DashboardPage({
  user,
  items,
  onNavigate,
  onOpenHistory,
  onApproveItem,
  onRejectItem,
  onCreate,
}: {
  user: AppUser;
  items: InventoryItem[];
  onNavigate: (page: AppPage) => void;
  onOpenHistory: (item: InventoryItem) => void;
  onApproveItem: (item: InventoryItem) => void;
  onRejectItem: (item: InventoryItem) => void;
  onCreate: () => void;
}) {
  const visibleItems = useMemo(() => visibleItemsForRole(items, user.role), [items, user.role]);
  const pendingItems = visibleItems.filter((item) => item.status === 'pending');
  const activeItems = visibleItems.filter((item) => item.status === 'active');
  const deactivatedItems = visibleItems.filter((item) => item.status === 'deactivated');
  const totalValue = visibleItems.reduce((total, item) => total + item.valor * item.quantidade, 0);
  const wornItems = visibleItems.filter((item) => item.operationalStatus !== 'operacional');
  const recentItems = [...visibleItems].reverse().slice(0, 5);
  const categoryTotals = Object.entries(
    visibleItems.reduce<Record<string, number>>((totals, item) => {
      totals[item.type] = (totals[item.type] ?? 0) + 1;
      return totals;
    }, {}),
  )
    .sort(([, first], [, second]) => second - first)
    .slice(0, 5);
  const maxCategoryTotal = categoryTotals[0]?.[1] ?? 1;

  return (
    <>
      <section className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">Bom trabalho, {user.name.split(' ')[0]}</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Visão geral do patrimônio</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Um resumo rápido do que está pronto para operação e do que precisa de atenção administrativa.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => onNavigate('inventory')}>
            <Icon name="archive" className="h-4 w-4" />
            Consultar estoque
          </Button>
          {canCreateItems(user.role) && (
            <Button onClick={onCreate}>
              <Icon name="plus" className="h-4 w-4" />
              Novo item
            </Button>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Itens visíveis" value={formatQuantity(visibleItems.length)} helper="Registros disponíveis para este perfil" icon="archive" tone="primary" />
        <StatCard label="Pendências" value={formatQuantity(pendingItems.length)} helper={user.role === 'adm' ? 'Aguardando decisão administrativa' : 'Registros em revisão'} icon="clock" tone="amber" />
        <StatCard label="Valor estimado" value={formatCurrency(totalValue)} helper="Valor unitário × quantidade" icon="currency" tone="blue" />
        <StatCard label="Atenção operacional" value={formatQuantity(wornItems.length)} helper={`${formatQuantity(deactivatedItems.length)} item(ns) desativado(s) no recorte`} icon="shield" tone="green" />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-slate-950">Acompanhamento rápido</p>
              <p className="mt-1 text-sm text-slate-500">Itens que podem exigir uma ação na próxima conferência.</p>
            </div>
            <button type="button" onClick={() => onNavigate('inventory')} className={`text-xs font-bold text-primary ${COLOR_TRANSITION_CLASS} hover:text-primary-strong`}>Ver estoque <span aria-hidden="true">→</span></button>
          </div>

          <div className="mt-6 divide-y divide-slate-100">
            {pendingItems.slice(0, 4).map((item) => (
              <div key={item.uuid} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                <button type="button" onClick={() => onOpenHistory(item)} className={`flex min-w-0 flex-1 items-center gap-3 text-left ${COLOR_TRANSITION_CLASS} hover:bg-slate-50`}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xs font-bold text-amber-700">{getTypeIcon(item.type)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{item.description}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.nrPatrimonio} · {getTypeLabel(item.type)}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </button>
                {user.role === 'adm' && (
                  <div className="flex shrink-0 gap-1">
                    <IconButton label="Aprovar item" onClick={() => onApproveItem(item)} className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700">
                      <Icon name="check" className="h-4 w-4" />
                    </IconButton>
                    <IconButton label="Rejeitar item" onClick={() => onRejectItem(item)} className="text-rose-600 hover:bg-rose-50 hover:text-rose-700">
                      <Icon name="close" className="h-4 w-4" />
                    </IconButton>
                  </div>
                )}
              </div>
            ))}
            {pendingItems.length === 0 && (
              <div className="flex items-center gap-3 py-5 text-sm text-slate-500">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Icon name="check" className="h-4 w-4" /></div>
                Nenhuma pendência neste recorte.
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-slate-400"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Ativos</div>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{formatQuantity(activeItems.length)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-slate-400"><span className="h-2 w-2 rounded-full bg-orange-500" /> Desgaste</div>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{formatQuantity(wornItems.length)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-slate-950">Distribuição por tipo</p>
              <p className="mt-1 text-sm text-slate-500">Onde estão concentrados os registros visíveis.</p>
            </div>
            <Icon name="filter" className="h-5 w-5 text-slate-300" />
          </div>
          <div className="mt-7 space-y-5">
            {categoryTotals.map(([type, total]) => (
              <div key={type}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{getTypeLabel(type)}</span>
                  <span className="font-semibold text-slate-950">{total}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(10, (total / maxCategoryTotal) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-lg font-semibold text-slate-950">Registros recentes</p>
            <p className="mt-1 text-sm text-slate-500">Amostra dos últimos itens da base demonstrativa.</p>
          </div>
          <button type="button" onClick={() => onNavigate('inventory')} className="hidden text-xs font-bold text-primary sm:block">Abrir lista completa →</button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {recentItems.map((item) => (
            <button key={item.uuid} type="button" onClick={() => onOpenHistory(item)} className={`rounded-xl border border-slate-100 bg-slate-50 p-4 text-left ${COLOR_TRANSITION_CLASS} hover:border-primary hover:bg-[var(--color-hover)]`}>
              <div className="flex items-center justify-between gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[10px] font-bold text-slate-500 shadow-sm">{getTypeIcon(item.type)}</span>
                <StatusBadge status={item.status} />
              </div>
              <p className="mt-3 line-clamp-2 text-sm font-semibold leading-5 text-slate-800">{item.description}</p>
              <p className="mt-2 truncate text-xs text-slate-500">{item.nrPatrimonio}</p>
            </button>
          ))}
        </div>
      </section>
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
  onOpenHistory,
  onEdit,
  onCreate,
  onApproveItem,
  onRejectItem,
  onExportCurrent,
}: {
  user: AppUser;
  items: InventoryItem[];
  onOpenHistory: (item: InventoryItem) => void;
  onEdit: (item: InventoryItem) => void;
  onCreate: () => void;
  onApproveItem: (item: InventoryItem) => void;
  onRejectItem: (item: InventoryItem) => void;
  onExportCurrent: (rows: InventoryItem[], columns: InventoryColumnKey[]) => void;
}) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<ItemStatus | ''>('');
  const [stateFilter, setStateFilter] = useState<ItemState | ''>('');
  const [operationalStatusFilter, setOperationalStatusFilter] = useState<OperationalStatus | ''>('');
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<InventoryColumnKey[]>(defaultInventoryColumns);

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
      const matchesType = !typeFilter || item.type === typeFilter;
      const matchesStatus = !statusFilter || item.status === statusFilter;
      const matchesState = !stateFilter || item.state === stateFilter;
      const matchesOperationalStatus = !operationalStatusFilter || item.operationalStatus === operationalStatusFilter;
      return matchesQuery && matchesType && matchesStatus && matchesState && matchesOperationalStatus;
    });
  }, [operationalStatusFilter, query, stateFilter, statusFilter, typeFilter, visibleItems]);

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

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setSuggestionsOpen(value.trim().length >= 3);
    setSummaryVisible(false);
  };

  const selectSuggestion = (description: string) => {
    setQuery(description);
    setSuggestionsOpen(false);
    setSummaryVisible(false);
  };

  const clearFilters = () => {
    setQuery('');
    setTypeFilter('');
    setStatusFilter('');
    setStateFilter('');
    setOperationalStatusFilter('');
    setSuggestionsOpen(false);
    setSummaryVisible(false);
  };

  const hasFilters = Boolean(query || typeFilter || statusFilter || stateFilter || operationalStatusFilter);

  const toggleColumn = (columnKey: InventoryColumnKey) => {
    setVisibleColumns((current) => current.includes(columnKey)
      ? current.filter((key) => key !== columnKey)
      : [...current, columnKey]);
  };

  return (
    <>
      <section className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">Consulta de ativos</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Estoque patrimonial</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Busque por descrição, tipo ou situação para encontrar um bem em poucos segundos.</p>
        </div>
        {canCreateItems(user.role) && (
          <Button onClick={onCreate}>
            <Icon name="plus" className="h-4 w-4" />
            Novo item
          </Button>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/40 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="min-w-0 flex-1">
            <FieldLabel htmlFor="inventory-search">Descrição ou patrimônio</FieldLabel>
            <div className="relative">
              <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <TextInput id="inventory-search" value={query} onChange={(event) => handleQueryChange(event.target.value)} onFocus={() => setSuggestionsOpen(query.trim().length >= 3)} placeholder="Ex.: mangueira, CBM-VTR-0001..." className="pl-10" />
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
          <div className="w-full lg:w-44">
            <FieldLabel htmlFor="inventory-type">Tipo</FieldLabel>
            <SelectInput id="inventory-type" value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value); setSummaryVisible(false); }}>
              <option value="">Todos os tipos</option>
              {availableTypes.map((type) => <option key={type} value={type}>{getTypeLabel(type)}</option>)}
            </SelectInput>
          </div>
          <div className="w-full lg:w-40">
            <FieldLabel htmlFor="inventory-status">Status</FieldLabel>
            <SelectInput id="inventory-status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as ItemStatus | ''); setSummaryVisible(false); }}>
              <option value="">Todos</option>
              {itemStatuses.filter((status) => user.role !== 'reader' || status === 'active').map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
            </SelectInput>
          </div>
          <div className="w-full lg:w-40">
            <FieldLabel htmlFor="inventory-state">Estado</FieldLabel>
            <SelectInput id="inventory-state" value={stateFilter} onChange={(event) => { setStateFilter(event.target.value as ItemState | ''); setSummaryVisible(false); }}>
              <option value="">Todos</option>
              {itemStates.map((state) => <option key={state} value={state}>{stateLabels[state]}</option>)}
            </SelectInput>
          </div>
          <div className="w-full lg:w-48">
            <FieldLabel htmlFor="inventory-operational-status">Status operacional</FieldLabel>
            <SelectInput id="inventory-operational-status" value={operationalStatusFilter} onChange={(event) => { setOperationalStatusFilter(event.target.value as OperationalStatus | ''); setSummaryVisible(false); }}>
              <option value="">Todos</option>
              {operationalStatuses.map((status) => <option key={status} value={status}>{operationalStatusLabels[status]}</option>)}
            </SelectInput>
          </div>
          <Button type="button" variant="ghost" onClick={clearFilters} disabled={!hasFilters} className="shrink-0">
            Limpar filtros
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <Icon name="filter" className="h-4 w-4 text-slate-400" />
          <span><strong className="font-bold text-slate-800">{formatQuantity(filteredItems.length)}</strong> resultado(s) de {formatQuantity(visibleItems.length)} visível(is)</span>
          <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
          <span className="text-slate-400">Perfil: {getRoleLabel(user.role)}</span>
          <Button type="button" variant="secondary" onClick={() => onExportCurrent(filteredItems, visibleColumns)} disabled={filteredItems.length === 0} className="ml-auto min-h-9 px-3 py-1.5 text-xs">
            <Icon name="download" className="h-3.5 w-3.5" />
            Exportar PDF
          </Button>
          <div className="relative">
            <Button type="button" variant="ghost" aria-expanded={columnsOpen} onClick={() => setColumnsOpen((current) => !current)} className="min-h-9 px-3 py-1.5 text-xs">
              <Icon name="filter" className="h-3.5 w-3.5" />
              Colunas
            </Button>
            {columnsOpen && (
              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-72 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-xl shadow-slate-900/10">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Configurar visualização</p>
                  <button type="button" onClick={() => setVisibleColumns(defaultInventoryColumns)} className="text-[11px] font-bold text-primary hover:text-primary-strong">Restaurar</button>
                </div>
                <div className="mt-3 grid gap-2">
                  {inventoryColumnOptions.map((column) => (
                    <label key={column.key} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
                      <input type="checkbox" checked={visibleColumns.includes(column.key)} onChange={() => toggleColumn(column.key)} className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-[var(--color-focus)]" />
                      {column.label}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
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

      {summaryVisible && summaries.length > 0 && (
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
            <p className="mt-1 text-xs text-slate-500">Última atualização simulada agora</p>
          </div>
          <div className="hidden items-center gap-2 text-xs text-slate-400 sm:flex"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Dados locais</div>
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
              {filteredItems.map((item) => (
                <tr key={item.uuid} className={`group ${COLOR_TRANSITION_CLASS} hover:bg-slate-50/70`}>
                  {visibleColumns.map((columnKey) => (
                    <td key={columnKey} className="px-4 py-4 first:pl-5 sm:first:pl-6">
                      {columnKey === 'item' && (
                        <div className="flex min-w-[230px] items-center gap-3">
                          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[10px] font-bold text-slate-500 ${COLOR_TRANSITION_CLASS} group-hover:bg-[var(--color-hover)] group-hover:text-primary`}>{getTypeIcon(item.type)}</span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-slate-800">{item.description}</span>
                            <span className="mt-1 block text-xs text-slate-400">{item.nrPatrimonio}</span>
                          </span>
                        </div>
                      )}
                      {columnKey === 'uuid' && <span className="block max-w-[220px] truncate font-mono text-[11px] text-slate-500">{item.uuid}</span>}
                      {columnKey === 'type' && <span className="text-sm text-slate-600">{getTypeLabel(item.type)}</span>}
                      {columnKey === 'cidade' && <span className="text-sm text-slate-600">{item.cidade || '—'}</span>}
                      {columnKey === 'state' && <StateBadge state={item.state} />}
                      {columnKey === 'operationalStatus' && <OperationalStatusBadge status={item.operationalStatus} />}
                      {columnKey === 'quantidade' && <span className="text-sm font-semibold text-slate-800">{formatQuantity(item.quantidade)}</span>}
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
        {filteredItems.length === 0 && (
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
  item,
  role,
  onClose,
  onSubmit,
}: {
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
    if (form.valor <= 0 || form.quantidade <= 0) {
      setError('Valor e quantidade devem ser maiores que zero.');
      return;
    }

    setError('');
    onSubmit({ ...form, description: form.description.trim(), nrPatrimonio: form.nrPatrimonio.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button type="button" aria-label="Fechar formulário" onClick={onClose} className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" />
      <section className="relative flex max-h-[min(850px,calc(100vh-2rem))] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5 sm:px-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{isEditing ? 'Atualização patrimonial' : 'Novo patrimônio'}</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">{isEditing ? 'Editar registro' : 'Cadastrar novo item'}</h2>
            <p className="mt-1 text-sm text-slate-500">{isEditing && !isAdmin ? 'Seu perfil pode alterar quantidade e estado físico.' : 'Preencha os dados para adicionar o bem ao estoque.'}</p>
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
              <FieldLabel htmlFor="item-quantity">Quantidade</FieldLabel>
              <TextInput id="item-quantity" type="number" min="1" step="1" value={form.quantidade} onChange={(event) => updateField('quantidade', Number(event.target.value))} />
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
                <div className={`flex h-11 items-center rounded-xl border border-dashed px-3.5 text-sm font-semibold ${form.status === 'active' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-amber-300 bg-amber-50 text-amber-700'}`}>
                  <span className={`mr-2 h-2 w-2 rounded-full ${form.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {statusLabels[form.status]}
                </div>
              )}
            </div>
          </div>

          {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">{error}</div>}

          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">
            <div className="flex gap-2"><Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /><span>{isEditing && !isAdmin ? 'O almoxarife pode atualizar quantidade, condição operacional e cidade/unidade.' : role === 'almoxarife' ? 'Novos itens criados por este perfil entram como pendentes e aguardam aprovação do gestor.' : 'Itens criados pelo gestor entram automaticamente como ativos.'}</span></div>
          </div>
        </form>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-6 py-5 sm:flex-row sm:justify-end sm:px-7">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="item-form">Salvar registro</Button>
        </div>
      </section>
    </div>
  );
}

function ToastBanner({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  if (!toast) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex max-w-sm items-start gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-xl shadow-slate-900/10">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Icon name={toast.tone === 'success' ? 'check' : 'info'} className="h-4 w-4" /></div>
      <div className="flex-1 pt-0.5"><p className="text-sm font-semibold text-slate-800">{toast.message}</p><p className="mt-0.5 text-xs text-slate-500">Alteração aplicada apenas nesta sessão.</p></div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Fechar exportação" onClick={onClose} className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" />
      <section className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Exportar almoxarifado</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">Escolha o formato</h2>
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
      </section>
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());
  const [session, setSession] = useState<AppUser | null>(null);
  const [page, setPage] = useState<AppPage>('dashboard');
  const [items, setItems] = useState<InventoryItem[]>(inventorySeed);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<InventoryItem | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [exportScope, setExportScope] = useState<'all' | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark');
  };

  const handleLogin = (user: AppUser) => {
    setSession(user);
    setPage('dashboard');
    setSelectedHistoryItem(null);
    setModal(null);
    setExportScope(null);
  };

  const handleLogout = () => {
    setSession(null);
    setSelectedHistoryItem(null);
    setModal(null);
    setExportScope(null);
    setToast(null);
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
              quantidade: values.quantidade,
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
      const status: ItemStatus = session.role === 'adm' ? 'active' : 'pending';
      const historyEntry = createHistoryEntry(session, 'created', status === 'active' ? 'Patrimônio criado e ativado pelo gestor.' : 'Patrimônio criado e enviado para aprovação do gestor.', {
        nextStatus: status,
        nextCity: values.cidade,
      });
      const newItem: InventoryItem = {
        ...values,
        uuid: createUuid(),
        status,
        lastTimeTouched: historyEntry.timestamp,
        history: [historyEntry],
      };
      setItems((currentItems) => [newItem, ...currentItems]);
      setToast({ message: session.role === 'adm' ? 'Novo patrimônio cadastrado.' : 'Novo item criado como pendente.', tone: 'success' });
    }

    setModal(null);
    setSelectedHistoryItem(null);
  };

  const handleReviewStatus = (item: InventoryItem, nextStatus: 'active' | 'rejected') => {
    if (!session || session.role !== 'adm' || item.status !== 'pending') {
      return;
    }

    setItems((currentItems) => currentItems.map((currentItem) => {
      if (currentItem.uuid !== item.uuid) {
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

  const handleExport = (rows: InventoryItem[], columnKeys: InventoryColumnKey[], format: 'csv' | 'pdf', filenamePrefix: string) => {
    const columns = getExportColumns(columnKeys);
    if (format === 'csv') {
      downloadTextFile(createCsvContent(rows, columns), `${filenamePrefix}.csv`, 'text/csv;charset=utf-8');
    } else {
      downloadTextFile(createPdfContent('Relatório patrimonial CBM SP', rows, columns), `${filenamePrefix}.pdf`, 'application/pdf');
    }
    setToast({ message: `${format.toUpperCase()} gerado com ${formatQuantity(rows.length)} registro(s).`, tone: 'success' });
  };

  const handleExportCurrent = (rows: InventoryItem[], columnKeys: InventoryColumnKey[]) => {
    handleExport(rows, columnKeys, 'pdf', 'consulta-patrimonial-cbm-sp');
  };

  const handleExportAll = (format: 'csv' | 'pdf') => {
    if (!session) {
      return;
    }

    handleExport(visibleItemsForRole(items, session.role), defaultInventoryColumns, format, 'almoxarifado-cbm-sp');
    setExportScope(null);
  };

  if (!session) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <>
      <InventoryShell user={session} page={page} onNavigate={setPage} onLogout={handleLogout} onExportAll={() => setExportScope('all')} theme={theme} onToggleTheme={toggleTheme}>
        {page === 'dashboard' ? (
          <DashboardPage user={session} items={items} onNavigate={setPage} onOpenHistory={setSelectedHistoryItem} onApproveItem={(item) => handleReviewStatus(item, 'active')} onRejectItem={(item) => handleReviewStatus(item, 'rejected')} onCreate={() => setModal({ mode: 'create' })} />
        ) : (
          <InventoryPage user={session} items={items} onOpenHistory={setSelectedHistoryItem} onApproveItem={(item) => handleReviewStatus(item, 'active')} onRejectItem={(item) => handleReviewStatus(item, 'rejected')} onEdit={(item) => setModal({ mode: 'edit', item })} onCreate={() => setModal({ mode: 'create' })} onExportCurrent={handleExportCurrent} />
        )}
      </InventoryShell>

      <HistoryDrawer item={selectedHistoryItem} onClose={() => setSelectedHistoryItem(null)} />
      {modal && <ItemFormModal item={modal.mode === 'edit' ? modal.item : null} role={session.role} onClose={() => setModal(null)} onSubmit={handleSaveItem} />}
      {exportScope === 'all' && <ExportFormatModal itemCount={visibleItemsForRole(items, session.role).length} onClose={() => setExportScope(null)} onExport={handleExportAll} />}
      <ToastBanner toast={toast} onClose={() => setToast(null)} />
    </>
  );
}

export default App;
