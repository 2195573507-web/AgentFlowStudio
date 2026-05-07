import React from 'react';
import { Shield, ShieldAlert, ShieldCheck, ShieldOff, ShieldQuestion } from 'lucide-react';
import { classNames } from '../lib/utils';
import type { RiskLevel } from '../lib/types';

export interface RiskMeterProps {
  /** The current risk level. */
  riskLevel: RiskLevel;
  /** When true, renders a compact inline pill instead of the full meter. */
  compact?: boolean;
  /** Optional label shown above the meter. */
  label?: string;
  /** Optional className. */
  className?: string;
}

interface RiskConfig {
  level: RiskLevel;
  label: string;
  color: string;
  bgColor: string;
  barColor: string;
  textColor: string;
  icon: React.FC<{ className?: string }>;
  percentage: number; // 0-100 for the meter bar width
}

const riskConfigs: Record<RiskLevel, RiskConfig> = {
  Safe: {
    level: 'Safe',
    label: 'Safe',
    color: 'border-emerald-400 dark:border-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    barColor: 'bg-emerald-400 dark:bg-emerald-500',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    icon: ShieldCheck,
    percentage: 0,
  },
  Low: {
    level: 'Low',
    label: 'Low Risk',
    color: 'border-sky-400 dark:border-sky-500',
    bgColor: 'bg-sky-50 dark:bg-sky-950/30',
    barColor: 'bg-sky-400 dark:bg-sky-500',
    textColor: 'text-sky-600 dark:text-sky-400',
    icon: Shield,
    percentage: 25,
  },
  Medium: {
    level: 'Medium',
    label: 'Medium Risk',
    color: 'border-amber-400 dark:border-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    barColor: 'bg-amber-400 dark:bg-amber-500',
    textColor: 'text-amber-600 dark:text-amber-400',
    icon: ShieldQuestion,
    percentage: 50,
  },
  High: {
    level: 'High',
    label: 'High Risk',
    color: 'border-orange-400 dark:border-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    barColor: 'bg-orange-400 dark:bg-orange-500',
    textColor: 'text-orange-600 dark:text-orange-400',
    icon: ShieldAlert,
    percentage: 75,
  },
  Critical: {
    level: 'Critical',
    label: 'Critical Risk',
    color: 'border-red-400 dark:border-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    barColor: 'bg-red-500 dark:bg-red-500',
    textColor: 'text-red-600 dark:text-red-400',
    icon: ShieldOff,
    percentage: 100,
  },
};

const RiskMeter: React.FC<RiskMeterProps> = ({
  riskLevel,
  compact = false,
  label,
  className,
}) => {
  const config = riskConfigs[riskLevel] || riskConfigs.Safe;
  const Icon = config.icon;

  if (compact) {
    return (
      <div
        className={classNames(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full',
          'border backdrop-blur-sm',
          config.bgColor,
          config.color,
          config.textColor,
          className,
        )}
      >
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs font-semibold">{config.label}</span>
      </div>
    );
  }

  return (
    <div className={classNames('flex flex-col gap-2', className)}>
      {label && (
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          {label}
        </span>
      )}

      <div
        className={classNames(
          'flex items-center gap-3 p-3.5 rounded-xl',
          'border backdrop-blur-md',
          config.bgColor,
          config.color,
        )}
      >
        {/* Icon */}
        <div
          className={classNames(
            'flex items-center justify-center w-9 h-9 rounded-lg shrink-0',
            'bg-white/50 dark:bg-black/20',
            config.textColor,
          )}
        >
          <Icon className="w-5 h-5" />
        </div>

        {/* Meter */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span
              className={classNames(
                'text-sm font-semibold',
                config.textColor,
              )}
            >
              {config.label}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
              {config.percentage}%
            </span>
          </div>

          {/* Meter bar */}
          <div className="w-full h-2 rounded-full bg-white/40 dark:bg-black/20 overflow-hidden">
            <div
              className={classNames(
                'h-full rounded-full transition-all duration-700 ease-out',
                config.barColor,
              )}
              style={{ width: `${config.percentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskMeter;
