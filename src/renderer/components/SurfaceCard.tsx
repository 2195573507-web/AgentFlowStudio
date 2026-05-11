import React from 'react';
import { classNames } from '../lib/utils';

export type SurfaceCardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface SurfaceCardProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onClick'> {
  /** Card content. */
  children: React.ReactNode;
  /** Additional className applied to the card wrapper. */
  className?: string;
  /** Click handler on the card (optional). */
  onClick?: React.MouseEventHandler<HTMLElement>;
  /** When true, adds hover scale and shadow effects. */
  hoverable?: boolean;
  /** Inner padding preset. */
  padding?: SurfaceCardPadding;
}

const paddingClasses: Record<SurfaceCardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

const SurfaceCard: React.FC<SurfaceCardProps> = ({
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
          'surface-card focus-ring',
          // Padding
          paddingClasses[padding],
          // Hoverable
          hoverable && 'surface-card-hover',
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
        'surface-card',
        // Padding
        paddingClasses[padding],
        // Hoverable
        hoverable && 'surface-card-hover',
        // Layout
        'block w-full text-left',
        className,
      )}
    >
      {children}
    </div>
  );
};

export default SurfaceCard;
