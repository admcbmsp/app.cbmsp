import { forwardRef, SelectHTMLAttributes } from 'react';
import { cn } from './utils/cn';
import { getFieldInputClasses } from './utils/fieldStyles';

export type SelectInputProps = SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean;
};

export const SelectInput = forwardRef<HTMLSelectElement, SelectInputProps>(function SelectInput(
  { invalid = false, className, ...props },
  ref,
) {
  return (
    <select
      {...props}
      ref={ref}
      aria-invalid={invalid ? true : props['aria-invalid']}
      className={getFieldInputClasses({ invalid, className: cn('appearance-none', className) })}
    />
  );
});
