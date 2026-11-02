import { forwardRef, InputHTMLAttributes, useId } from 'react';
import { Icon } from './Icon';
import { Field } from './Field';
import { FieldMetaProps } from './types';
import { cn } from './utils/cn';
import { getFieldInputClasses } from './utils/fieldStyles';

export type DateFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> & FieldMetaProps;

export const DateField = forwardRef<HTMLInputElement, DateFieldProps>(function DateField(
  { label, description, error, required, id, fieldClassName, className, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <Field label={label} description={description} error={error} required={required} id={inputId} className={fieldClassName}>
      <div className="relative">
        <input
          {...props}
          ref={ref}
          id={inputId}
          type="date"
          aria-invalid={error ? true : props['aria-invalid']}
          className={getFieldInputClasses({ invalid: Boolean(error), className: cn('pr-10', className) })}
        />
        <Icon name="calendar" className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    </Field>
  );
});
