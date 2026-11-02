import { HTMLAttributes } from 'react';
import { cn } from './utils/cn';
import { fieldErrorClasses } from './utils/fieldStyles';

export type ErrorTextProps = HTMLAttributes<HTMLParagraphElement>;

export function ErrorText({ className, ...props }: ErrorTextProps) {
  return <p {...props} role="alert" className={cn(fieldErrorClasses, className)} />;
}
