import React from 'react';
import { Languages, Monitor, Moon, Network, Sun } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { classNames } from '../lib/utils';
import type { ThemeMode } from '../lib/types';
import type { Language } from '../lib/i18n';
import { t } from '../lib/i18n';
import { navItems } from './Sidebar';
import { useAuth } from '../lib/auth';
import Button from './Button';

export interface TopbarProps {
  /** Optional title override. If not provided, derived from current route. */
  title?: string;
  /** Optional actions rendered on the right side. */
  actions?: React.ReactNode;
  /** Current theme mode. */
  theme?: ThemeMode;
  /** Called when the theme is toggled. */
  onThemeChange?: (theme: ThemeMode) => void;
  language?: Language;
  onLanguageChange?: (language: Language) => void;
  /** Additional className. */
  className?: string;
}

const Topbar: React.FC<TopbarProps> = ({
  title: titleOverride,
  actions,
  theme = 'system',
  onThemeChange,
  language = 'zh',
  onLanguageChange,
  className,
}) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const themeLabels: Record<ThemeMode, string> = {
    system: t('theme.system', language),
    light: t('theme.light', language),
    dark: t('theme.dark', language),
  };

  const routeTitle = (() => {
    const path = location.pathname;
    if (path === '/') return 'Nexus Home';
    const item = navItems.find((nav) => nav.to !== '/' && path.startsWith(nav.to));
    return item ? item.label : path.slice(1);
  })();

  const displayTitle = titleOverride || routeTitle;

  const handleThemeToggle = () => {
    if (!onThemeChange) return;
    const cycle: ThemeMode[] = ['system', 'light', 'dark'];
    const currentIndex = cycle.indexOf(theme);
    onThemeChange(cycle[(currentIndex + 1) % cycle.length]);
  };

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
  const nextLanguage: Language = language === 'zh' ? 'en' : 'zh';

  return (
    <header
      className={classNames(
        'flex items-center justify-between h-14 px-5',
        'liquid-glass-chrome border-b',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Network className="hidden h-4 w-4 shrink-0 text-accent-500 sm:block" />
        <h1 className="truncate text-base font-semibold tracking-tight text-slate-800 dark:text-slate-200">
          {displayTitle}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {actions}

        {user && (
          <div className="hidden items-center gap-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-surface)] px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 sm:flex">
            <span className="max-w-[140px] truncate font-semibold">{user.profile.displayName || user.email}</span>
            <span className="rounded-md bg-accent-500/15 px-1.5 py-0.5 text-accent-700 dark:text-accent-300">{user.role}</span>
          </div>
        )}

        {onLanguageChange && (
          <button
            type="button"
            onClick={() => onLanguageChange(nextLanguage)}
            className={classNames(
              'inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition-all duration-200',
              'text-slate-500 dark:text-slate-400',
              'hover:bg-slate-200/60 dark:hover:bg-white/10',
              'hover:text-slate-700 dark:hover:text-slate-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400',
            )}
            title={language === 'zh' ? 'Switch to English' : 'Switch to Chinese'}
          >
            <Languages className="h-4 w-4" />
            <span>{t('topbar.language', language)}</span>
          </button>
        )}

        {onThemeChange && (
          <button
            type="button"
            onClick={handleThemeToggle}
            className={classNames(
              'rounded-xl p-2 transition-all duration-200',
              'text-slate-400 dark:text-slate-500',
              'hover:bg-slate-200/60 dark:hover:bg-white/10',
              'hover:text-slate-600 dark:hover:text-slate-300',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400',
            )}
            title={`Theme: ${themeLabels[theme]}. Click to switch.`}
          >
            <ThemeIcon className="h-4 w-4" />
          </button>
        )}

        {user && (
          <Button variant="ghost" size="sm" onClick={() => void logout()}>
            Sign out
          </Button>
        )}
      </div>
    </header>
  );
};

export default Topbar;
