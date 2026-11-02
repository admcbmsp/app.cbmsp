import { HTMLAttributes } from 'react';
import { INTERACTION_TRANSITION_CLASS } from '../theme/motion';
import { cn } from './utils/cn';

export type CardBoxProps = HTMLAttributes<HTMLDivElement> & {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
};

const paddingClasses = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

export function CardBox({ padding = 'md', interactive = false, className, ...props }: CardBoxProps) {
  return (
    <div
      {...props}
      className={cn(
        'rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40',
        paddingClasses[padding],
        interactive && `${INTERACTION_TRANSITION_CLASS} hover:-translate-y-0.5 hover:border-primary hover:shadow-md hover:shadow-[var(--color-shadow)]`,
        className,
      )}
    />
  );
}
