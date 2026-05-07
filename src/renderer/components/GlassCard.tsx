import React from 'react';
import { classNames } from '../lib/utils';

export type GlassCardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface GlassCardProps {
  /** Card content. */
  children: React.ReactNode;
  /** Additional className applied to the card wrapper. */
  className?: string;
  /** Click handler on the card (optional). */
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
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
}) => {
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      onClick={onClick as React.MouseEventHandler<HTMLDivElement> | undefined}
      className={classNames(
        // Glass base
        'bg-white/40 dark:bg-white/5 backdrop-blur-xl',
        'border border-white/30 dark:border-white/10',
        'shadow-lg shadow-black/5 dark:shadow-black/30',
        'rounded-2xl',
        // Transition
        'transition-all duration-200 ease-out',
        // Padding
        paddingClasses[padding],
        // Hoverable
        hoverable &&
          'hover:bg-white/50 dark:hover:bg-white/10 hover:shadow-xl hover:shadow-black/8 dark:hover:shadow-black/40 hover:-translate-y-0.5',
        // Clickable
        onClick && 'cursor-pointer active:scale-[0.98]',
        // Layout
        'block w-full text-left',
        className,
      )}
    >
      {children}
    </Tag>
  );
};

export default GlassCard;
