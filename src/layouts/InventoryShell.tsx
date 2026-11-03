import { ReactNode, useCallback, useState } from 'react';
import { BrandLogo } from '../components/BrandLogo';
import { Icon, IconButton } from '../library';
import { ThemeMode } from '../theme/theme';
import { AppPage, AppUser, City } from '../types/inventory';
import { getInitials, getRoleLabel } from '../utils/inventory';
import { SideNav } from './SideNav';

const pageDetails: Record<AppPage, { label: string; description: string }> = {
  dashboard: {
    label: 'Visão geral',
    description: 'Acompanhe o panorama do patrimônio operacional.',
  },
  inventory: {
    label: 'Controle de patrimônio',
    description: 'Consulte bens, estados físicos e pendências administrativas.',
  },
  details: {
    label: 'Detalhes do patrimônio',
    description: 'Consulte os patrimônios individuais deste item.',
  },
  users: {
    label: 'Usuários',
    description: 'Consulte contas e atualize seus perfis de acesso.',
  },
  profile: {
    label: 'Perfil',
    description: 'Atualize seus dados de identificação e contato.',
  },
};

const navigation = [
  { id: 'dashboard', href: '#/dashboard', icon: 'dashboard', label: 'Visão geral' },
  { id: 'inventory', href: '#/inventory', icon: 'archive', label: 'Controle de patrimônio' },
] as const;

const profileNavigation = { id: 'profile', href: '#/profile', icon: 'user', label: 'Perfil' } as const;
const navigationWithProfile = [...navigation, profileNavigation] as const;
const adminNavigation = [
  ...navigation,
  { id: 'users', href: '#/users', icon: 'users', label: 'Usuários' },
  profileNavigation,
] as const;

export type InventoryShellProps = {
  user: AppUser;
  page: AppPage;
  onNavigate: (page: AppPage) => void;
  onLogout: () => void;
  onExportAll: () => void;
  selectedUnit: City | null;
  onSelectUnit: (unit: City | null) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  children: ReactNode;
};

export function InventoryShell({ user, page, onNavigate, onLogout, onExportAll, selectedUnit, onSelectUnit, theme, onToggleTheme, children }: InventoryShellProps) {
  const [sideNavVisible, setSideNavVisible] = useState(false);
  const [sideNavClosing, setSideNavClosing] = useState(false);
  const userNavigation = user.role === 'reader'
    ? [{ id: 'inventory', href: '#/inventory', icon: 'archive', label: 'Consulta de ativos' }, profileNavigation] as const
    : user.role === 'adm' ? adminNavigation : navigationWithProfile;
  const currentPageLabel = user.role === 'reader' && page === 'inventory' ? 'Consulta de ativos' : pageDetails[page].label;

  const closeSideNav = useCallback(() => {
    setSideNavClosing(true);
  }, []);

  const finishClosingSideNav = useCallback(() => {
    setSideNavVisible(false);
    setSideNavClosing(false);
  }, []);

  const toggleSideNav = () => {
    if (sideNavVisible && !sideNavClosing) {
      closeSideNav();
      return;
    }

    setSideNavClosing(false);
    setSideNavVisible(true);
  };

  const handleNavigate = (nextPage: AppPage) => {
    onNavigate(nextPage);
    if (sideNavVisible) {
      closeSideNav();
    }
  };

  return (
    <div className="application-shell bg-slate-100 text-slate-900">
      <header className="fixed inset-x-0 top-0 z-30 h-16 border-b border-slate-800 bg-slate-950 text-slate-100 shadow-lg shadow-slate-950/20">
        <div className="relative mx-auto flex h-full w-full items-center px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-2">
            <IconButton
              label={sideNavVisible && !sideNavClosing ? 'Fechar navegação' : 'Abrir navegação'}
              aria-controls="inventory-side-navigation"
              aria-expanded={sideNavVisible && !sideNavClosing}
              onClick={toggleSideNav}
              className="border-transparent text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <Icon name={sideNavVisible && !sideNavClosing ? 'close' : 'menu'} className="h-5 w-5" />
            </IconButton>
            <BrandLogo className="h-10 w-10 sm:hidden" />
            <div className="hidden items-center gap-3 sm:flex">
              <BrandLogo className="h-10 w-10" />
              <div>
                <p className="text-xs font-bold tracking-[0.18em] text-white">CBM SP</p>
                <p className="text-[10px] text-slate-500">Gestão patrimonial</p>
              </div>
            </div>
          </div>

          <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-2 md:flex">
            <span className="font-semibold tracking-tight text-white">{currentPageLabel}</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold text-white">{user.name}</p>
              <p className="text-[10px] text-slate-500">{getRoleLabel(user.role)}</p>
            </div>
            <IconButton
              label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
              onClick={onToggleTheme}
              className="border-transparent text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="h-4 w-4" />
            </IconButton>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">{getInitials(user)}</div>
          </div>
        </div>
      </header>

      <div className="application-container">
        <div aria-hidden="true" className="h-16 shrink-0" />
        <main id="main-content" tabIndex={-1} className="min-h-[calc(100vh-4rem)] w-full min-w-0 flex-1 px-4 py-6 outline-none sm:px-6 lg:px-10 lg:py-9">
          {children}
        </main>
      </div>

      <SideNav
        isClosing={sideNavClosing}
        isVisible={sideNavVisible}
        navigation={userNavigation}
        navigationLabel="Navegação principal"
        selectedUnit={selectedUnit}
        unitOptions={Object.values(City)}
        onSelectUnit={onSelectUnit}
        onClose={closeSideNav}
        onClosed={finishClosingSideNav}
        onLogout={onLogout}
        onExportAll={onExportAll}
        onNavigate={handleNavigate}
        page={page}
      />
    </div>
  );
}
