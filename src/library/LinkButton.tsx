import { AnchorHTMLAttributes, ReactNode } from 'react';
import { ButtonSize, ButtonVariant, getButtonClasses } from './utils/buttonStyles';

export type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  active?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export function LinkButton({
  variant = 'link',
  size = 'md',
  active = false,
  leftIcon,
  rightIcon,
  className,
  children,
  ...props
}: LinkButtonProps) {
  return (
    <a
      {...props}
      aria-current={active ? 'page' : props['aria-current']}
      className={getButtonClasses({
        variant,
        size,
        className: `${active ? 'ring-2 ring-[var(--color-focus)]' : ''} ${className ?? ''}`,
      })}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </a>
  );
}
