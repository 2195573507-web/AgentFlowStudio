import React, { useId } from 'react';
import { classNames } from '../lib/utils';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Label text displayed above the input. */
  label?: string;
  /** Error message shown below the input (turns border red). */
  error?: string;
  /** Hint text displayed below the input when no error. */
  hint?: string;
  /** Icon rendered on the left side of the input. */
  icon?: React.ReactNode;
  /** Icon rendered on the right side (e.g., a clear button). */
  rightIcon?: React.ReactNode;
  /** Optional wrapper className for the outer container. */
  wrapperClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      icon,
      rightIcon,
      className,
      wrapperClassName,
      disabled,
      id: idProp,
      ...rest
    },
    ref,
  ) => {
    const autoId = useId();
    const inputId = idProp || autoId;

    return (
      <div className={classNames('flex flex-col gap-1.5', wrapperClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-[var(--text-secondary)] tracking-wide uppercase select-none"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[var(--text-muted)]">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={classNames(
              // Base
              'w-full border outline-none transition-colors duration-150',
              'bg-[var(--surface)]',
              'border-[var(--border)]',
              // Text
              'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
              // Spacing
              'rounded-tool px-3 py-2.5 text-sm',
              icon && 'pl-10',
              rightIcon && 'pr-10',
              // Focus
              'focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--accent)]',
              // Error
              error &&
                'border-[var(--danger)] focus:ring-[var(--focus-ring)] focus:border-[var(--danger)]',
              // Disabled
              disabled && 'opacity-50 cursor-not-allowed',
              className,
            )}
            {...rest}
          />

          {rightIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--text-muted)]">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-[var(--danger)] mt-0.5">{error}</p>
        )}
        {!error && hint && (
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{hint}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
