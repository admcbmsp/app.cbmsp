import { cn } from './cn';
import { COLOR_TRANSITION_CLASS } from '../../theme/motion';

export const fieldInputBaseClasses =
  `h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 outline-none ${COLOR_TRANSITION_CLASS} placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`;

export const fieldInputStateClasses = {
  default: 'border-slate-200 focus:border-primary focus:ring-[var(--color-focus)]',
  invalid: 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-100',
};

export function getFieldInputClasses({
  invalid = false,
  className,
}: {
  invalid?: boolean;
  className?: string;
}) {
  return cn(fieldInputBaseClasses, invalid ? fieldInputStateClasses.invalid : fieldInputStateClasses.default, className);
}

export const fieldLabelClasses = 'mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500';
export const fieldHelperClasses = 'mt-1.5 block text-xs leading-5 text-slate-500';
export const fieldErrorClasses = 'mt-1.5 block text-xs leading-5 text-rose-600';
