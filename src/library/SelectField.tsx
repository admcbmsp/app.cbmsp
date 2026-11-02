import { forwardRef, ReactNode, SelectHTMLAttributes, useId } from 'react';
import { Icon } from './Icon';
import { Field } from './Field';
import { FieldMetaProps } from './types';
import { cn } from './utils/cn';
import { getFieldInputClasses } from './utils/fieldStyles';

export type SelectOption = {
  value: string;
  label: ReactNode;
  disabled?: boolean;
};

export type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> & FieldMetaProps & {
  options?: SelectOption[];
  placeholder?: ReactNode;
};

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, description, error, required, id, fieldClassName, className, options, placeholder, children, ...props },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <Field label={label} description={description} error={error} required={required} id={selectId} className={fieldClassName}>
      <div className="relative">
        <select
          {...props}
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : props['aria-invalid']}
          className={getFieldInputClasses({ invalid: Boolean(error), className: cn('appearance-none pr-10', className) })}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options?.map((option) => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
          {children}
        </select>
        <Icon name="chevron-down" className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    </Field>
  );
});
