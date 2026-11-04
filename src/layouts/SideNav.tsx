import { useEffect, useRef, useState } from 'react';
import { UnitScopeSelector } from '../components/UnitScopeSelector';
import { Icon, IconName, cn } from '../library';
import { COLOR_TRANSITION_CLASS } from '../theme/motion';
import { AppPage, City } from '../types/inventory';

const sideNavId = 'inventory-side-navigation';
const closingDurationMs = 300;

type NavigationItem = {
  id: AppPage;
  href: string;
  icon: IconName;
  label: string;
};

export type SideNavProps = {
  isClosing: boolean;
  isVisible: boolean;
  navigation: ReadonlyArray<NavigationItem>;
  navigationLabel: string;
  selectedUnit: City | null;
  unitOptions: readonly City[];
  onSelectUnit: (unit: City | null) => void;
  onClose: () => void;
  onClosed: () => void;
  onExportAll: () => void;
  onLogout: () => void;
  onNavigate: (page: AppPage) => void;
  page: AppPage;
};

export function SideNav({
  isClosing,
  isVisible,
  navigation,
  navigationLabel,
  selectedUnit,
  unitOptions,
  onSelectUnit,
  onClose,
  onClosed,
  onExportAll,
  onLogout,
  onNavigate,
  page,
}: SideNavProps) {
  const sideNavRef = useRef<HTMLElement>(null);
  const [isEntered, setIsEntered] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setIsEntered(false);
      return;
    }

    const animationFrame = window.requestAnimationFrame(() => {
      setIsEntered(true);
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const sideNav = sideNavRef.current;
    const mainContent = document.getElementById('main-content');

    document.body.style.overflow = 'hidden';
    mainContent?.setAttribute('aria-hidden', 'true');
    mainContent?.setAttribute('inert', '');
    sideNav?.querySelector<HTMLElement>('a[href], button:not([disabled])')?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !sideNav) {
        return;
      }

      const focusable = Array.from(sideNav.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'));
      const first = focusable.at(0);
      const last = focusable.at(-1);

      if (!first || !last) {
        event.preventDefault();
        sideNav.focus();
      } else if (!sideNav.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      mainContent?.removeAttribute('aria-hidden');
      mainContent?.removeAttribute('inert');

      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };
  }, [isVisible, onClose]);

  useEffect(() => {
    if (!isVisible || !isClosing) {
      return;
    }

    const closingTimer = window.setTimeout(onClosed, closingDurationMs);
    return () => window.clearTimeout(closingTimer);
  }, [isClosing, isVisible, onClosed]);

  return (
    <div
      aria-hidden={!isVisible}
      className="application-side-navigation-overlay fixed inset-x-0 bottom-0 z-40"
      hidden={!isVisible}
    >
      <button
        type="button"
        aria-label="Fechar navegação lateral"
        onClick={onClose}
        className={cn(
          'application-backdrop absolute inset-0 motion-safe:transition-opacity motion-safe:duration-300 motion-safe:ease-out',
          isClosing || !isEntered ? 'opacity-0' : 'opacity-100',
        )}
      />
      <nav
        id={sideNavId}
        ref={sideNavRef}
        tabIndex={-1}
        aria-label={navigationLabel}
        className={cn(
          'absolute inset-y-0 left-0 flex w-[min(21rem,calc(100%-2rem))] flex-col overflow-y-auto overscroll-contain border-r border-slate-800 bg-slate-950 px-4 py-4 text-slate-100 shadow-2xl will-change-transform motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]',
          isClosing || !isEntered ? '-translate-x-full' : 'translate-x-0',
        )}
      >
        <UnitScopeSelector
          options={unitOptions}
          selectedUnit={selectedUnit}
          onChange={onSelectUnit}
          onSelect={onClose}
        />

        <div className="mt-5 rounded-md border border-white/10 bg-white/[0.04] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Ambiente atual</p>
          <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.1)]" />
            Protótipo local
          </div>
        </div>

        <div className="mt-7">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">Navegação principal</p>
          <ul className="grid gap-1">
            {navigation.map((item) => {
              const current = page === item.id || (page === 'details' && item.id === 'inventory');
              return (
                <li key={item.id}>
                  <a
                    href={item.href}
                    aria-current={current ? 'page' : undefined}
                    onClick={(event) => {
                      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
                        return;
                      }
                      event.preventDefault();
                      onNavigate(item.id);
                      onClose();
                    }}
                    className={`flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-300 ${COLOR_TRANSITION_CLASS} hover:bg-white/10 hover:text-white active:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-[current=page]:bg-primary aria-[current=page]:text-white aria-[current=page]:hover:bg-primary`}
                  >
                    <Icon name={item.icon} className="h-5 w-5 shrink-0" />
                    {item.label}
                    {current && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-5">
          <button
            type="button"
            onClick={() => {
              onExportAll();
              onClose();
            }}
            className={`flex min-h-11 w-full items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-left text-sm font-medium text-slate-300 ${COLOR_TRANSITION_CLASS} hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}
          >
            <Icon name="download" className="h-5 w-5 shrink-0" />
            Exportar almoxarifado
          </button>
        </div>

        <div className="mt-auto border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={onLogout}
            className={`flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium text-slate-300 ${COLOR_TRANSITION_CLASS} hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}
          >
            <Icon name="logout" className="h-5 w-5 shrink-0" />
            Sair
          </button>
        </div>
      </nav>
    </div>
  );
}
