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
            className="text-xs font-medium text-slate-600 dark:text-slate-400 tracking-wide uppercase select-none"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 dark:text-slate-500">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={classNames(
              // Base
              'w-full border outline-none transition-all duration-200',
              // Glass styling
              'bg-[var(--glass-surface)] backdrop-blur-md',
              'border-[var(--glass-border)] shadow-[var(--glass-inner)]',
              // Text
              'text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500',
              // Spacing
              'rounded-xl px-3.5 py-2.5 text-sm',
              icon && 'pl-10',
              rightIcon && 'pr-10',
              // Focus
              'focus:ring-2 focus:ring-accent-400/60 focus:border-accent-400/70',
              // Error
              error &&
                'border-red-400 dark:border-red-500 focus:ring-red-400/40 focus:border-red-400',
              // Disabled
              disabled && 'opacity-50 cursor-not-allowed',
              className,
            )}
            {...rest}
          />

          {rightIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 dark:text-slate-500">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{error}</p>
        )}
        {!error && hint && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{hint}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
