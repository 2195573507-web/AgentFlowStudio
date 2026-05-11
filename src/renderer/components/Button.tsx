import React from 'react';
import { Loader2 } from 'lucide-react';
import { classNames } from '../lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant of the button. */
  variant?: ButtonVariant;
  /** Size preset. */
  size?: ButtonSize;
  /** Show a loading spinner and disable the button. */
  loading?: boolean;
  /** Optional icon rendered before the label. */
  icon?: React.ReactNode;
  /** When true, the button takes the full width of its parent. */
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border border-[var(--accent)] bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] hover:border-[var(--accent-hover)] active:bg-[var(--accent-hover)]',
  secondary:
    'bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)] active:bg-[var(--surface-muted)]',
  ghost:
    'text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] active:bg-[var(--surface-hover)]',
  danger:
    'border border-[var(--danger)] bg-[var(--danger)] text-white hover:bg-danger-hover hover:border-danger-hover active:bg-danger-hover',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-[30px] px-2.5 py-1.5 text-xs gap-1.5 rounded-tool',
  md: 'min-h-[36px] px-3.5 py-2 text-sm gap-2 rounded-tool',
  lg: 'min-h-[42px] px-4 py-2.5 text-sm gap-2.5 rounded-tool',
};

const spinnerSizes: Record<ButtonSize, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      fullWidth = false,
      disabled,
      className,
      children,
      ...rest
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={classNames(
          // Base styles
          'inline-flex items-center justify-center font-medium cursor-pointer',
          'transition-colors duration-150 ease-out',
          'focus-ring',
          'select-none',
          // Variant
          variantClasses[variant],
          // Size
          sizeClasses[size],
          // States
          isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          fullWidth && 'w-full',
          className,
        )}
        {...rest}
      >
        {loading ? (
          <Loader2
            className={classNames(spinnerSizes[size], 'animate-spin shrink-0')}
          />
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {children && <span>{children}</span>}
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;
