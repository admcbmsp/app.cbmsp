import { forwardRef, InputHTMLAttributes } from 'react';
import { getFieldInputClasses } from './utils/fieldStyles';

export type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { invalid = false, className, ...props },
  ref,
) {
  return (
    <input
      {...props}
      ref={ref}
      aria-invalid={invalid ? true : props['aria-invalid']}
      className={getFieldInputClasses({ invalid, className })}
    />
  );
});
