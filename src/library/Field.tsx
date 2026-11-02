import { ReactNode, useId } from 'react';
import { cn } from './utils/cn';
import { fieldErrorClasses, fieldHelperClasses, fieldLabelClasses } from './utils/fieldStyles';

export type FieldProps = {
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  id?: string;
  children: ReactNode;
  className?: string;
};

export function Field({
  label,
  description,
  error,
  required = false,
  id,
  children,
  className,
}: FieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={fieldId} className={fieldLabelClasses}>
          {label}
          {required && <span className="ml-1 text-error" aria-hidden="true">*</span>}
        </label>
      )}
      {children}
      {error ? <span className={fieldErrorClasses} role="alert">{error}</span> : description ? <span className={fieldHelperClasses}>{description}</span> : null}
    </div>
  );
}
