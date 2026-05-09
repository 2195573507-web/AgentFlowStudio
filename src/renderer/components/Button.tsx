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
    'bg-accent-600 text-white hover:bg-accent-500 active:bg-accent-700 ' +
    'shadow-lg shadow-accent-500/25 dark:shadow-accent-400/20',
  secondary:
    'bg-[var(--glass-surface)] text-slate-700 dark:text-slate-200 ' +
    'border border-[var(--glass-border)] shadow-[var(--glass-inner)] ' +
    'hover:bg-[var(--glass-surface-hover)] active:bg-white/30 dark:active:bg-white/15 ' +
    'backdrop-blur-md',
  ghost:
    'text-slate-600 dark:text-slate-300 ' +
    'hover:bg-slate-200/50 dark:hover:bg-white/10 ' +
    'active:bg-slate-300/30 dark:active:bg-white/15',
  danger:
    'bg-red-600/90 text-white hover:bg-red-500 active:bg-red-700 ' +
    'shadow-lg shadow-red-500/25 dark:shadow-red-400/15',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
  md: 'px-4 py-2 text-sm gap-2 rounded-xl',
  lg: 'px-6 py-3 text-base gap-2.5 rounded-xl',
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
          'transition-all duration-200 ease-out',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/70 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent',
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
