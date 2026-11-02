import { forwardRef, InputHTMLAttributes, ReactNode, useId } from 'react';
import { Field } from './Field';
import { FieldMetaProps } from './types';
import { cn } from './utils/cn';
import { getFieldInputClasses } from './utils/fieldStyles';

export type IconFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & FieldMetaProps & {
  icon: ReactNode;
  iconLabel?: string;
};

export const IconField = forwardRef<HTMLInputElement, IconFieldProps>(function IconField(
  {
    label,
    description,
    error,
    required,
    id,
    fieldClassName,
    className,
    icon,
    iconLabel,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <Field label={label} description={description} error={error} required={required} id={inputId} className={fieldClassName}>
      <div className="relative">
        <span aria-label={iconLabel} className="pointer-events-none absolute left-3.5 top-1/2 flex -translate-y-1/2 items-center text-slate-400">
          {icon}
        </span>
        <input
          {...props}
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : props['aria-invalid']}
          className={getFieldInputClasses({ invalid: Boolean(error), className: cn('pl-10', className) })}
        />
      </div>
    </Field>
  );
});
