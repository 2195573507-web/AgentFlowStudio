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
    'bg-slate-200/70 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300 ' +
    'border-slate-300/50 dark:border-slate-600/50',
  success:
    'bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 ' +
    'border-emerald-300/50 dark:border-emerald-700/50',
  warning:
    'bg-amber-100/80 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 ' +
    'border-amber-300/50 dark:border-amber-700/50',
  danger:
    'bg-red-100/80 dark:bg-red-900/40 text-red-700 dark:text-red-400 ' +
    'border-red-300/50 dark:border-red-700/50',
  info:
    'bg-sky-100/80 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400 ' +
    'border-sky-300/50 dark:border-sky-700/50',
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
        'text-xs font-medium rounded-full',
        'border backdrop-blur-sm',
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
