import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './utils/cn';
import { ButtonSize, ButtonVariant, getButtonClasses } from './utils/buttonStyles';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

function LoadingSpinner() {
  return <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={getButtonClasses({ variant, size, fullWidth, className })}
    >
      {loading ? <LoadingSpinner /> : leftIcon}
      <span className={cn(loading && 'opacity-90')}>{children}</span>
      {!loading && rightIcon}
    </button>
  );
}
