import { HTMLAttributes } from 'react';
import { cn } from './utils/cn';

export type CaptionProps = HTMLAttributes<HTMLSpanElement>;

export function Caption({ className, ...props }: CaptionProps) {
  return <span {...props} className={cn('text-xs leading-5 text-slate-400', className)} />;
}
