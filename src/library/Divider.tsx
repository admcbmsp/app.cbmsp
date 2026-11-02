import { HTMLAttributes } from 'react';
import { cn } from './utils/cn';

export type DividerProps = HTMLAttributes<HTMLHRElement> & {
  orientation?: 'horizontal' | 'vertical';
};

export function Divider({ orientation = 'horizontal', className, ...props }: DividerProps) {
  return (
    <hr
      {...props}
      aria-orientation={orientation}
      className={cn(
        'border-0 bg-slate-200',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px self-stretch',
        className,
      )}
    />
  );
}
