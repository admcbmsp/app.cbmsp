import { HTMLAttributes } from 'react';
import { cn } from './utils/cn';

export type StackProps = HTMLAttributes<HTMLDivElement> & {
  gap?: '0' | '1' | '2' | '3' | '4' | '5' | '6' | '8' | '10' | '12';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between';
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
  '10': 'gap-10',
  '12': 'gap-12',
};

const alignClasses = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

const justifyClasses = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
};

export function Stack({ gap = '4', align = 'stretch', justify = 'start', className, ...props }: StackProps) {
  return <div {...props} className={cn('flex flex-col', gapClasses[gap], alignClasses[align], justifyClasses[justify], className)} />;
}
