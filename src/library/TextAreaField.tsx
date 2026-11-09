import { forwardRef, TextareaHTMLAttributes, useId } from 'react';
import { Field } from './Field';
import { FieldMetaProps } from './types';
import { COLOR_TRANSITION_CLASS } from '../theme/motion';
import { cn } from './utils/cn';
import { fieldInputStateClasses } from './utils/fieldStyles';

export type TextAreaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & FieldMetaProps;

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(function TextAreaField(
  { label, description, error, required, id, fieldClassName, className, ...props },
  ref,
) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;

  return (
    <Field label={label} description={description} error={error} required={required} id={textareaId} className={fieldClassName}>
      <textarea
        {...props}
        ref={ref}
        id={textareaId}
        required={required}
        aria-invalid={error ? true : props['aria-invalid']}
        className={cn(`min-h-28 w-full resize-y rounded-md border bg-white px-3.5 py-3 text-sm text-slate-900 outline-none ${COLOR_TRANSITION_CLASS} placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`, error ? fieldInputStateClasses.invalid : fieldInputStateClasses.default, className)}
      />
    </Field>
  );
});
