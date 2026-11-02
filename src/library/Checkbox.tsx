import { InputHTMLAttributes, ReactNode, useId } from 'react';
import { Icon } from './Icon';
import { COLOR_TRANSITION_CLASS } from '../theme/motion';
import { cn } from './utils/cn';
import { fieldErrorClasses, fieldHelperClasses } from './utils/fieldStyles';

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> & {
  label: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  id?: string;
  fieldClassName?: string;
};

export function Checkbox({
  label,
  description,
  error,
  required = false,
  id,
  fieldClassName,
  className,
  ...props
}: CheckboxProps) {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;

  return (
    <div className={cn('w-full', fieldClassName)}>
      <label htmlFor={checkboxId} className={cn('flex items-start gap-3', props.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer')}>
        <input {...props} id={checkboxId} type="checkbox" aria-invalid={error ? true : props['aria-invalid']} className={cn('peer sr-only', className)} />
        <span aria-hidden="true" className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white text-transparent ${COLOR_TRANSITION_CLASS} peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-4 peer-focus-visible:ring-[var(--color-focus)] peer-disabled:bg-slate-50 peer-disabled:text-transparent`}>
          <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.5} />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-medium text-slate-800">{label}{required && <span className="ml-1 text-error" aria-hidden="true">*</span>}</span>
          {description && <span className={fieldHelperClasses}>{description}</span>}
        </span>
      </label>
      {error && <span className={fieldErrorClasses} role="alert">{error}</span>}
    </div>
  );
}
