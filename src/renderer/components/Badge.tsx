import React from 'react';
import { classNames } from '../lib/utils';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps {
  /** Visual variant of the badge. */
  variant?: BadgeVariant;
  /** Badge content. */
  children: React.ReactNode;
  /** Optional additional className. */
  className?: string;
  /** Optional small dot indicator before the label. */
  dot?: boolean;
  /** Optional icon before the label. */
  icon?: React.ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  default:
    'bg-[var(--surface-muted)] text-[var(--text-secondary)] border-[var(--border)]',
  success:
    'bg-[var(--success-muted)] text-[var(--success)] border-[color-mix(in_srgb,var(--success)_32%,var(--border))]',
  warning:
    'bg-[var(--warning-muted)] text-[var(--warning)] border-[color-mix(in_srgb,var(--warning)_32%,var(--border))]',
  danger:
    'bg-[var(--danger-muted)] text-[var(--danger)] border-[color-mix(in_srgb,var(--danger)_32%,var(--border))]',
  info:
    'bg-[var(--info-muted)] text-[var(--info)] border-[color-mix(in_srgb,var(--info)_32%,var(--border))]',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-slate-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-sky-500',
};

const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className,
  dot = false,
  icon,
}) => {
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1 px-2.5 py-0.5',
        'text-xs font-semibold rounded-full',
        'border',
        'transition-colors duration-150',
        variantClasses[variant],
        className,
      )}
    >
      {dot && (
        <span
          className={classNames(
            'inline-block w-1.5 h-1.5 rounded-full',
            dotColors[variant],
          )}
        />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </span>
  );
};

export default Badge;
