import { cn } from './cn';
import { COLOR_TRANSITION_CLASS } from '../../theme/motion';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

export const buttonBaseClasses =
  `inline-flex items-center justify-center gap-2 rounded-xl border font-semibold ${COLOR_TRANSITION_CLASS} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50`;

export const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary: 'border-primary bg-primary text-white hover:border-primary-strong hover:bg-primary-strong focus-visible:outline-primary',
  secondary: 'border-slate-900 bg-slate-900 text-white hover:border-slate-800 hover:bg-slate-800 focus-visible:outline-slate-900',
  outline: 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-slate-500',
  ghost: 'border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-slate-400',
  danger: 'border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100 focus-visible:outline-rose-600',
  link: 'border-transparent bg-transparent px-0 text-primary hover:text-primary-strong hover:underline focus-visible:outline-primary',
};

export const buttonSizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 text-xs',
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-5 text-base',
};

export function getButtonClasses({
  variant = 'primary',
  size = 'md',
  className,
  fullWidth = false,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  fullWidth?: boolean;
}) {
  return cn(
    buttonBaseClasses,
    buttonVariantClasses[variant],
    buttonSizeClasses[size],
    variant === 'link' && 'px-0',
    fullWidth && 'w-full',
    className,
  );
}
