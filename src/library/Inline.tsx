import { HTMLAttributes } from 'react';
import { cn } from './utils/cn';

export type InlineProps = HTMLAttributes<HTMLDivElement> & {
  gap?: '0' | '1' | '2' | '3' | '4' | '5' | '6' | '8';
  align?: 'start' | 'center' | 'end' | 'baseline' | 'stretch';
  wrap?: boolean;
};

const gapClasses = {
  '0': 'gap-0',
  '1': 'gap-1',
  '2': 'gap-2',
  '3': 'gap-3',
  '4': 'gap-4',
  '5': 'gap-5',
  '6': 'gap-6',
  '8': 'gap-8',
};

const alignClasses = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  baseline: 'items-baseline',
  stretch: 'items-stretch',
};

export function Inline({ gap = '4', align = 'center', wrap = false, className, ...props }: InlineProps) {
  return <div {...props} className={cn('flex flex-row', gapClasses[gap], alignClasses[align], wrap && 'flex-wrap', className)} />;
}
