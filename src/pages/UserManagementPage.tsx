import { Badge, CardBox, Heading, Icon } from '../library';
import type { BadgeVariant } from '../library';
import type { AppUser, UserRole } from '../types/inventory';
import { getRoleLabel } from '../utils/inventory';

type UserManagementPageProps = {
  users: AppUser[];
  onSelectUser: (user: AppUser) => void;
};

const roleBadgeVariants: Record<UserRole, BadgeVariant> = {
  reader: 'neutral',
  almoxarife: 'info',
  adm: 'success',
};

export function UserManagementPage({ users, onSelectUser }: UserManagementPageProps) {
  return (
    <section aria-labelledby="users-page-title">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Administração</p>
          <Heading id="users-page-title" level={1} className="mt-2 text-3xl sm:text-4xl">Usuários</Heading>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Consulte as contas cadastradas e ajuste o perfil de acesso de cada usuário.</p>
        </div>
        <Badge variant="info" size="md">{users.length} usuário(s)</Badge>
      </header>

      <CardBox padding="none" className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <h2 className="text-sm font-semibold text-slate-950">Contas cadastradas</h2>
          <p className="mt-1 text-xs text-slate-500">Selecione uma conta para editar seu perfil.</p>
        </div>
        <ul className="divide-y divide-slate-100">
          {users.map((user) => (
            <li key={user.id}>
              <button
                type="button"
                aria-label={`Editar perfil de ${user.name}`}
                onClick={() => onSelectUser(user)}
                className="flex min-h-[76px] w-full flex-wrap items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:flex-nowrap sm:px-6"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-hover)] text-primary">
                  <Icon name="user" className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-900">{user.name}</span>
                  <span className="mt-1 block truncate text-xs text-slate-500">{user.email}</span>
                </span>
                <span className="ml-[52px] flex items-center gap-3 sm:ml-0">
                  <Badge variant={roleBadgeVariants[user.role]}>{getRoleLabel(user.role)}</Badge>
                  <span className="hidden items-center gap-1 text-xs font-semibold text-primary sm:inline-flex">
                    Editar perfil <Icon name="chevron-right" className="h-4 w-4" />
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </CardBox>
    </section>
  );
}
