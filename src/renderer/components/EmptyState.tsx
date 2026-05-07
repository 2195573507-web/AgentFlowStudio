import React from 'react';
import { Inbox } from 'lucide-react';
import { classNames } from '../lib/utils';
import Button from './Button';

export interface EmptyStateProps {
  /** Icon displayed at the top. Defaults to Inbox icon. */
  icon?: React.ReactNode | React.ComponentType<{ className?: string }>;
  /** Primary heading. */
  title: string;
  /** Supportive description below the title. */
  description?: string;
  /** Label for the optional call-to-action button. */
  actionLabel?: string;
  /** Called when the action button is clicked. */
  onAction?: () => void;
  /** Custom icon for the action button. */
  actionIcon?: React.ReactNode;
  /** Additional className. */
  className?: string;
  /** When true, renders a loading skeleton instead of content. */
  loading?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
  className,
  loading = false,
}) => {
  const Icon =
    typeof icon === 'function'
      ? (icon as React.ComponentType<{ className?: string }>)
      : null;
  let iconNode: React.ReactNode = <Inbox className="w-7 h-7" />;
  if (Icon) {
    iconNode = <Icon className="w-7 h-7" />;
  } else if (React.isValidElement(icon)) {
    iconNode = icon;
  }

  if (loading) {
    return (
      <div
        className={classNames(
          'flex flex-col items-center justify-center py-16 px-4 text-center',
          className,
        )}
      >
        <div className="w-16 h-16 rounded-2xl bg-slate-200/60 dark:bg-slate-700/40 animate-pulse mb-5" />
        <div className="w-48 h-5 bg-slate-200/60 dark:bg-slate-700/40 rounded-lg animate-pulse mb-2" />
        <div className="w-64 h-4 bg-slate-200/40 dark:bg-slate-700/30 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div
      className={classNames(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className,
      )}
    >
      {/* Icon */}
      <div
        className={classNames(
          'flex items-center justify-center w-16 h-16 rounded-2xl mb-5',
          'bg-slate-100/80 dark:bg-white/5',
          'border border-slate-200/60 dark:border-white/10',
          'text-slate-400 dark:text-slate-500',
        )}
      >
        {iconNode}
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-sm text-slate-400 dark:text-slate-500 max-w-sm leading-relaxed mb-6">
          {description}
        </p>
      )}

      {/* Action */}
      {actionLabel && onAction && (
        <Button
          variant="secondary"
          size="sm"
          icon={actionIcon}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
