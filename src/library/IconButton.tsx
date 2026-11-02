import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './utils/cn';
import { ButtonSize, ButtonVariant, getButtonClasses } from './utils/buttonStyles';

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> & {
  label: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

export function IconButton({
  label,
  variant = 'ghost',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      {...props}
      type={props.type ?? 'button'}
      aria-label={label}
      title={label}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={getButtonClasses({
        variant,
        size,
        className: cn('aspect-square shrink-0 p-0', className),
      })}
    >
      {loading ? <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" /> : children}
    </button>
  );
}
