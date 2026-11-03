import { HTMLAttributes, ReactNode } from 'react';
import { cn } from './utils/cn';

export type BadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  children: ReactNode;
};

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  info: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  danger: 'bg-rose-50 text-rose-700 ring-rose-600/20',
};

export function Badge({ variant = 'neutral', size = 'sm', dot = false, className, children, ...props }: BadgeProps) {
  return (
    <span {...props} className={cn('inline-flex items-center gap-1.5 rounded-md font-semibold ring-1 ring-inset', size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm', variantClasses[variant], className)}>
      {dot && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
