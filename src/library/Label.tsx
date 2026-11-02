import { LabelHTMLAttributes } from 'react';
import { cn } from './utils/cn';
import { fieldLabelClasses } from './utils/fieldStyles';

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  required?: boolean;
};

export function Label({ required = false, className, children, ...props }: LabelProps) {
  return (
    <label {...props} className={cn(fieldLabelClasses, className)}>
      {children}
      {required && <span className="ml-1 text-error" aria-hidden="true">*</span>}
    </label>
  );
}
