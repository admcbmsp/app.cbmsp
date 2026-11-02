import { HTMLAttributes } from 'react';
import { cn } from './utils/cn';

export type GridProps = HTMLAttributes<HTMLDivElement> & {
  columns?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  gap?: '0' | '1' | '2' | '3' | '4' | '5' | '6' | '8';
};

const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  12: 'grid-cols-12',
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

export function Grid({ columns = 1, gap = '4', className, ...props }: GridProps) {
  return <div {...props} className={cn('grid', columnClasses[columns], gapClasses[gap], className)} />;
}
