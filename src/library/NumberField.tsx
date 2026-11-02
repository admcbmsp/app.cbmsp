import { forwardRef, InputHTMLAttributes, useId } from 'react';
import { Field } from './Field';
import { FieldMetaProps } from './types';
import { getFieldInputClasses } from './utils/fieldStyles';

export type NumberFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> & FieldMetaProps;

export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(function NumberField(
  { label, description, error, required, id, fieldClassName, className, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <Field label={label} description={description} error={error} required={required} id={inputId} className={fieldClassName}>
      <input
        {...props}
        ref={ref}
        id={inputId}
        type="number"
        inputMode="numeric"
        aria-invalid={error ? true : props['aria-invalid']}
        className={getFieldInputClasses({ invalid: Boolean(error), className })}
      />
    </Field>
  );
});
