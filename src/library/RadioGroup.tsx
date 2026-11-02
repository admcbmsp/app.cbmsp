import { ReactNode, useId } from 'react';
import { COLOR_TRANSITION_CLASS } from '../theme/motion';
import { cn } from './utils/cn';
import { fieldErrorClasses, fieldHelperClasses, fieldLabelClasses } from './utils/fieldStyles';

export type RadioOption = {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
};

export type RadioGroupProps = {
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  options: RadioOption[];
  onChange?: (value: string) => void;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
};

export function RadioGroup({
  label,
  description,
  error,
  required = false,
  id,
  name,
  value,
  defaultValue,
  options,
  onChange,
  orientation = 'vertical',
  className,
}: RadioGroupProps) {
  const generatedId = useId();
  const groupId = id ?? generatedId;
  const groupName = name ?? groupId;

  return (
    <fieldset className={cn('w-full', className)} aria-invalid={error ? true : undefined}>
      {label && <legend className={fieldLabelClasses}>{label}{required && <span className="ml-1 text-error" aria-hidden="true">*</span>}</legend>}
      {description && <p className={fieldHelperClasses}>{description}</p>}
      <div className={cn('mt-2 flex', orientation === 'vertical' ? 'flex-col gap-2' : 'flex-wrap gap-3')}>
        {options.map((option) => {
          const optionId = `${groupId}-${option.value}`;
          return (
            <label key={option.value} htmlFor={optionId} className={cn(`group flex items-start gap-3 rounded-xl border border-transparent p-3 ${COLOR_TRANSITION_CLASS}`, option.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-slate-200 hover:bg-slate-50')}>
              <input
                id={optionId}
                name={groupName}
                type="radio"
                value={option.value}
                checked={value !== undefined ? value === option.value : undefined}
                defaultChecked={value === undefined && defaultValue === option.value}
                disabled={option.disabled}
                onChange={() => onChange?.(option.value)}
                className="peer sr-only"
              />
              <span aria-hidden="true" className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border border-slate-300 bg-white ${COLOR_TRANSITION_CLASS} peer-checked:border-primary peer-checked:bg-primary peer-checked:ring-4 peer-checked:ring-[var(--color-focus)] peer-disabled:bg-slate-50`} />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-slate-800">{option.label}</span>
                {option.description && <span className={fieldHelperClasses}>{option.description}</span>}
              </span>
            </label>
          );
        })}
      </div>
      {error && <span className={fieldErrorClasses} role="alert">{error}</span>}
    </fieldset>
  );
}
