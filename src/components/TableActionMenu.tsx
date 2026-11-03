import { CSSProperties, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { IconName } from './Icon';
import { Icon } from './Icon';
import { COLOR_TRANSITION_CLASS } from '../theme/motion';

export type TableAction = {
  key: string;
  label: string;
  onSelect: () => void;
  icon?: IconName;
  tone?: 'default' | 'success' | 'danger';
  disabled?: boolean;
};

type TableActionMenuProps = {
  label: string;
  actions: TableAction[];
};

export function TableActionMenu({ label, actions }: TableActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!isOpen) return;

    const triggerRect = triggerRef.current?.getBoundingClientRect();
    const menuRect = menuRef.current?.getBoundingClientRect();
    if (!triggerRect) return;

    const menuHeight = menuRect?.height ?? 0;
    const belowTop = triggerRect.bottom + 4;
    const top = belowTop + menuHeight <= window.innerHeight - 8
      ? belowTop
      : Math.max(8, triggerRect.top - menuHeight - 4);
    const right = Math.max(8, window.innerWidth - triggerRect.right);
    setMenuStyle({ top, right });
    menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const closeIfOutside = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      if (!menuRef.current?.contains(event.target) && !triggerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const closeOnViewportChange = () => setIsOpen(false);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener('pointerdown', closeIfOutside);
    document.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', closeOnViewportChange);
    window.addEventListener('scroll', closeOnViewportChange, true);
    return () => {
      document.removeEventListener('pointerdown', closeIfOutside);
      document.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', closeOnViewportChange);
      window.removeEventListener('scroll', closeOnViewportChange, true);
    };
  }, [isOpen]);

  const focusRelativeItem = (current: HTMLElement, direction: -1 | 1) => {
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ?? []);
    if (items.length === 0) return;
    const currentIndex = items.indexOf(current as HTMLButtonElement);
    const nextIndex = (currentIndex + direction + items.length) % items.length;
    items[nextIndex].focus();
  };

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      focusRelativeItem(event.target as HTMLElement, event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const items = menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)');
      (event.key === 'Home' ? items?.[0] : items?.[items.length - 1])?.focus();
    }
  };

  const closeAfterSelect = (action: TableAction) => {
    if (action.disabled) return;
    action.onSelect();
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const toneClasses = {
    default: 'text-slate-700 hover:bg-slate-50',
    success: 'text-emerald-700 hover:bg-emerald-50',
    danger: 'text-rose-700 hover:bg-rose-50',
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => {
          setMenuStyle(null);
          setIsOpen((current) => !current);
        }}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 ${COLOR_TRANSITION_CLASS} hover:bg-slate-100 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}
      >
        <Icon name="more-horizontal" className="h-5 w-5" />
        <span className="sr-only">Abrir menu de ações</span>
      </button>
      {isOpen && createPortal(
        <div
          ref={menuRef}
          role="menu"
          aria-label={label}
          onKeyDown={handleMenuKeyDown}
          style={{ position: 'fixed', top: 8, right: 8, ...menuStyle, visibility: menuStyle ? 'visible' : 'hidden' }}
          className="z-[100] min-w-52 overflow-hidden rounded-md border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/15"
        >
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              role="menuitem"
              disabled={action.disabled}
              onClick={() => closeAfterSelect(action)}
              className={`flex min-h-10 w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium ${COLOR_TRANSITION_CLASS} ${toneClasses[action.tone ?? 'default']} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {action.icon && <Icon name={action.icon} className="h-4 w-4 shrink-0" />}
              <span>{action.label}</span>
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}
