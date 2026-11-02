import { HTMLAttributes } from 'react';
import { cn } from './utils/cn';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  level?: HeadingLevel;
};

const levelClasses: Record<HeadingLevel, string> = {
  1: 'text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl',
  2: 'text-3xl font-semibold tracking-tight text-slate-950',
  3: 'text-2xl font-semibold tracking-tight text-slate-950',
  4: 'text-xl font-semibold text-slate-950',
  5: 'text-lg font-semibold text-slate-950',
  6: 'text-base font-semibold text-slate-950',
};

const headingTags: Record<HeadingLevel, 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'> = {
  1: 'h1',
  2: 'h2',
  3: 'h3',
  4: 'h4',
  5: 'h5',
  6: 'h6',
};

export function Heading({ level = 2, className, ...props }: HeadingProps) {
  const Tag = headingTags[level];
  return <Tag {...props} className={cn(levelClasses[level], className)} />;
}
