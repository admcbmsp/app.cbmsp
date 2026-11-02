import { ElementType, HTMLAttributes } from 'react';
import { cn } from './utils/cn';

export type BoxProps = HTMLAttributes<HTMLElement> & {
  as?: Extract<ElementType, 'div' | 'section' | 'article' | 'main' | 'aside' | 'span'>;
};

export function Box({ as: Component = 'div', className, ...props }: BoxProps) {
  return <Component {...props} className={cn(className)} />;
}
