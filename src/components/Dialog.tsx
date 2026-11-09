// Operational documentation: ./Dialog.operations.md
import { ButtonHTMLAttributes, ReactNode, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import './Dialog.css';
import { Button } from '../library/Button';
import type { ButtonVariant } from '../library/utils/buttonStyles';
import { Icon } from './Icon';

export type DialogSize = 'sm' | 'md' | 'lg';
export type DialogActionVariant = 'primary' | 'secondary' | 'destructive';

export type DialogAction = Pick<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'type' | 'form' | 'disabled' | 'onClick'
> & {
  label: string;
  variant: DialogActionVariant;
  loading?: boolean;
};

export type DialogActions = readonly [DialogAction] | readonly [DialogAction, DialogAction];

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  caption?: ReactNode;
  closeLabel?: string;
  children: ReactNode;
  actions?: DialogActions;
  size?: DialogSize;
};

const dialogSizeClasses: Record<DialogSize, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-xl',
  lg: 'sm:max-w-2xl',
};

const actionButtonVariants: Record<DialogActionVariant, ButtonVariant> = {
  primary: 'primary',
  secondary: 'outline',
  destructive: 'danger',
};

const actionButtonThemeClasses: Record<DialogActionVariant, string> = {
  primary: '',
  secondary: '!border-line !bg-surface-muted !text-foreground hover:!bg-muted focus-visible:!outline-primary',
  destructive: '!border-error !bg-error-soft !text-error hover:!bg-error hover:!text-white focus-visible:!outline-error',
};

const focusableSelector = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** Shared modal shell. The consumer owns the open value and content state. */
export function Dialog({
  open,
  onOpenChange,
  title,
  caption,
  closeLabel = 'Fechar diálogo',
  children,
  actions,
  size = 'md',
}: DialogProps) {
  const titleId = useId();
  const captionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousBodyOverflow = document.body.style.overflow;
    const panel = panelRef.current;
    const focusableElements = () => Array.from(
      panel?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
    ).filter((element) => element.getAttribute('aria-hidden') !== 'true');

    document.body.style.overflow = 'hidden';
    (focusableElements()[0] ?? panel)?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        event.preventDefault();
        onOpenChangeRef.current(false);
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = focusableElements();
      if (focusable.length === 0) {
        event.preventDefault();
        panel?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !panel?.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !panel?.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  const requestClose = () => onOpenChange(false);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div
        aria-hidden="true"
        onPointerDown={requestClose}
        className="application-backdrop absolute inset-0"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={caption ? captionId : undefined}
        tabIndex={-1}
        className={`dialog-panel relative z-10 flex max-h-[90vh] w-full max-w-none flex-col overflow-hidden rounded-t-md border border-line bg-card shadow-2xl sm:max-h-[calc(100vh-2rem)] sm:rounded-md ${dialogSizeClasses[size]}`}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-6 py-5 sm:px-7">
          <div className="min-w-0">
            <h2 id={titleId} className="text-xl font-semibold leading-7 text-foreground">{title}</h2>
            {caption && <p id={captionId} className="mt-1 text-sm leading-6 text-muted-foreground">{caption}</p>}
          </div>
          <button
            type="button"
            aria-label={closeLabel}
            onClick={requestClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-7">{children}</div>

        {actions && actions.length > 0 && (
          <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-line px-6 py-5 sm:flex-row sm:justify-end sm:px-7">
            {actions.map((action, index) => (
              <Button
                key={`${action.label}-${index}`}
                type={action.type ?? 'button'}
                form={action.form}
                variant={actionButtonVariants[action.variant]}
                onClick={action.onClick}
                disabled={action.disabled}
                loading={action.loading}
                className={actionButtonThemeClasses[action.variant]}
              >
                {action.label}
              </Button>
            ))}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
