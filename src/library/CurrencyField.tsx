import { forwardRef, InputHTMLAttributes, useId } from 'react';
import { Field } from './Field';
import { FieldMetaProps } from './types';
import { cn } from './utils/cn';
import { getFieldInputClasses } from './utils/fieldStyles';

export type CurrencyFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> & FieldMetaProps & {
  currencySymbol?: string;
};

export const CurrencyField = forwardRef<HTMLInputElement, CurrencyFieldProps>(function CurrencyField(
  {
    label,
    description,
    error,
    required,
    id,
    fieldClassName,
    className,
    currencySymbol = 'R$',
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <Field label={label} description={description} error={error} required={required} id={inputId} className={fieldClassName}>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">{currencySymbol}</span>
        <input
          {...props}
          ref={ref}
          id={inputId}
          type="number"
          inputMode="decimal"
          step={props.step ?? '0.01'}
          aria-invalid={error ? true : props['aria-invalid']}
          className={getFieldInputClasses({ invalid: Boolean(error), className: cn('pl-11', className) })}
        />
      </div>
    </Field>
  );
});
