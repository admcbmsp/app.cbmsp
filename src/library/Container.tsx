import { HTMLAttributes } from 'react';
import { cn } from './utils/cn';

export type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
};

const sizeClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-none',
};

export function Container({ size = 'xl', className, ...props }: ContainerProps) {
  return <div {...props} className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', sizeClasses[size], className)} />;
}
