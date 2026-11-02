import { HTMLAttributes } from 'react';
import { cn } from './utils/cn';

export type TextProps = HTMLAttributes<HTMLElement> & {
  as?: 'p' | 'span' | 'div';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  tone?: 'default' | 'muted' | 'subtle' | 'danger' | 'success';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
};

const sizeClasses = {
  xs: 'text-xs leading-5',
  sm: 'text-sm leading-6',
  md: 'text-base leading-7',
  lg: 'text-lg leading-8',
};

const toneClasses = {
  default: 'text-slate-800',
  muted: 'text-slate-600',
  subtle: 'text-slate-400',
  danger: 'text-rose-700',
  success: 'text-emerald-700',
};

const weightClasses = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

export function Text({ as: Component = 'p', size = 'md', tone = 'default', weight = 'normal', className, ...props }: TextProps) {
  return <Component {...props} className={cn(sizeClasses[size], toneClasses[tone], weightClasses[weight], className)} />;
}
