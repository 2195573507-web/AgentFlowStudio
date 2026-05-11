import React, { useId } from 'react';
import { classNames } from '../lib/utils';

export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  /** Label text displayed above the textarea. */
  label?: string;
  /** Error message (turns border red). */
  error?: string;
  /** Hint text when no error. */
  hint?: string;
  /** When true, displays a character count below the textarea. */
  showCharCount?: boolean;
  /** Maximum character count (for visual display only, not enforcement). */
  maxChars?: number;
  /** Optional className for the outer wrapper. */
  wrapperClassName?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      hint,
      showCharCount = false,
      maxChars,
      className,
      wrapperClassName,
      disabled,
      id: idProp,
      value,
      ...rest
    },
    ref,
  ) => {
    const autoId = useId();
    const textareaId = idProp || autoId;
    const charCount = typeof value === 'string' ? value.length : 0;
    const isNearLimit = maxChars != null && charCount > maxChars * 0.85;
    const isOverLimit = maxChars != null && charCount > maxChars;

    return (
      <div className={classNames('flex flex-col gap-1.5', wrapperClassName)}>
        {(label || (showCharCount && maxChars != null)) && (
          <div className="flex items-center justify-between">
            {label && (
              <label
                htmlFor={textareaId}
                className="text-xs font-semibold text-[var(--text-secondary)] tracking-wide uppercase select-none"
              >
                {label}
              </label>
            )}
            {showCharCount && maxChars != null && (
              <span
                className={classNames(
                  'text-xs tabular-nums transition-colors',
                  isOverLimit
                    ? 'text-red-500'
                    : isNearLimit
                      ? 'text-amber-500'
                      : 'text-[var(--text-muted)]',
                )}
              >
                {charCount}/{maxChars}
              </span>
            )}
          </div>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          value={value}
          className={classNames(
            // Base
            'w-full border outline-none transition-colors duration-150 resize-y min-h-[80px]',
            'bg-[var(--surface)]',
            'border-[var(--border)]',
            // Text
            'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
            // Spacing
            'rounded-tool px-3 py-2.5 text-sm',
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

Textarea.displayName = 'Textarea';

export default Textarea;
