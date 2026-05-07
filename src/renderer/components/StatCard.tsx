import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { classNames } from '../lib/utils';
import GlassCard from './GlassCard';

export type TrendDirection = 'up' | 'down' | 'neutral';

export interface Trend {
  /** Direction of the trend arrow. */
  direction: TrendDirection;
  /** Label text beside the arrow (e.g., "12%"). */
  label: string;
  /** When true, green=good even for "up". When false, "up" is colored red. */
  positiveIsUp?: boolean;
}

export interface StatCardProps {
  /** Label displayed above the value. */
  label: string;
  /** The main numeric/string value. */
  value: string | number;
  /** Optional icon (lucide-react element). */
  icon?: React.ReactNode;
  /** Optional trend data (direction + label). */
  trend?: Trend;
  /** Optional description below the value. */
  description?: string;
  /** Additional className. */
  className?: string;
}

const trendConfig = {
  up: { icon: TrendingUp, positive: 'text-emerald-500', negative: 'text-red-500' },
  down: { icon: TrendingDown, positive: 'text-red-500', negative: 'text-emerald-500' },
  neutral: { icon: Minus, positive: 'text-slate-400', negative: 'text-slate-400' },
};

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  trend,
  description,
  className,
}) => {
  const getTrendColor = (direction: TrendDirection, positiveIsUp: boolean): string => {
    const colors = trendConfig[direction];
    if (direction === 'neutral') return colors.positive;
    if (positiveIsUp) {
      return direction === 'up' ? colors.positive : colors.negative;
    }
    return direction === 'up' ? colors.negative : colors.positive;
  };

  const TrendIcon = trend ? trendConfig[trend.direction].icon : null;

  return (
    <GlassCard padding="lg" className={classNames('min-w-[160px]', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight tabular-nums truncate">
            {value}
          </p>

          {trend && (
            <div className="flex items-center gap-1 mt-1.5">
              {TrendIcon && (
                <TrendIcon
                  className={classNames(
                    'w-3.5 h-3.5',
                    getTrendColor(trend.direction, trend.positiveIsUp ?? true),
                  )}
                />
              )}
              <span
                className={classNames(
                  'text-xs font-medium tabular-nums',
                  getTrendColor(trend.direction, trend.positiveIsUp ?? true),
                )}
              >
                {trend.label}
              </span>
            </div>
          )}

          {description && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {description}
            </p>
          )}
        </div>

        {icon && (
          <div
            className={classNames(
              'flex items-center justify-center w-10 h-10 rounded-xl shrink-0',
              'bg-white/30 dark:bg-white/10 text-accent-500',
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </GlassCard>
  );
};

export default StatCard;
