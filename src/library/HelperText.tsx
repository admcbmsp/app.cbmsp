import { HTMLAttributes } from 'react';
import { cn } from './utils/cn';
import { fieldHelperClasses } from './utils/fieldStyles';

export type HelperTextProps = HTMLAttributes<HTMLParagraphElement>;

export function HelperText({ className, ...props }: HelperTextProps) {
  return <p {...props} className={cn(fieldHelperClasses, className)} />;
}
