import React from 'react';
import { classNames } from '../lib/utils';

export type GlassCardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface GlassCardProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onClick'> {
  /** Card content. */
  children: React.ReactNode;
  /** Additional className applied to the card wrapper. */
  className?: string;
  /** Click handler on the card (optional). */
  onClick?: React.MouseEventHandler<HTMLElement>;
  /** When true, adds hover scale and shadow effects. */
  hoverable?: boolean;
  /** Inner padding preset. */
  padding?: GlassCardPadding;
}

const paddingClasses: Record<GlassCardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  onClick,
  hoverable = false,
  padding = 'lg',
  ...rest
}) => {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
        {...rest}
        className={classNames(
          'liquid-glass-card liquid-focus',
          // Padding
          paddingClasses[padding],
          // Hoverable
          hoverable && 'hover:-translate-y-0.5',
          // Clickable
          'cursor-pointer active:scale-[0.98]',
          // Layout
          'block w-full text-left',
          className,
        )}
      >
        {children}
      </button>
    );
  }

  return (
    <div
      {...rest}
      className={classNames(
        'liquid-glass-card',
        // Padding
        paddingClasses[padding],
        // Hoverable
        hoverable && 'hover:-translate-y-0.5',
        // Layout
        'block w-full text-left',
        className,
      )}
    >
      {children}
    </div>
  );
};

export default GlassCard;
