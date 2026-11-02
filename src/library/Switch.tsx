import { ButtonHTMLAttributes, ReactNode } from 'react';
import { COLOR_TRANSITION_CLASS, TRANSFORM_TRANSITION_CLASS } from '../theme/motion';
import { cn } from './utils/cn';
import { fieldHelperClasses } from './utils/fieldStyles';

export type SwitchProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'children'> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
};

export function Switch({ checked, onCheckedChange, label, description, disabled, className, ...props }: SwitchProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      {(label || description) && (
        <div className="min-w-0">
          {label && <p className="text-sm font-medium text-slate-800">{label}</p>}
          {description && <p className={fieldHelperClasses}>{description}</p>}
        </div>
      )}
      <button
        {...props}
        type={props.type ?? 'button'}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 ${COLOR_TRANSITION_CLASS} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50`, checked ? 'bg-primary' : 'bg-slate-300')}
      >
        <span aria-hidden="true" className={cn(`h-5 w-5 rounded-full bg-white shadow-sm ${TRANSFORM_TRANSITION_CLASS}`, checked ? 'translate-x-5' : 'translate-x-0')} />
      </button>
    </div>
  );
}
