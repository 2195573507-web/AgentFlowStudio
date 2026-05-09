import React from 'react';
import { Languages, Sun, Moon, Monitor } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { classNames } from '../lib/utils';
import type { ThemeMode } from '../lib/types';
import type { Language } from '../lib/i18n';
import { t } from '../lib/i18n';
import { navItems } from './Sidebar';

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
  const themeLabels: Record<ThemeMode, string> = {
    system: t('theme.system', language),
    light: t('theme.light', language),
    dark: t('theme.dark', language),
  };

  // Derive page title from current route
  const routeTitle = (() => {
    const path = location.pathname;
    if (path === '/') return '仪表盘';
    const item = navItems.find(
      (nav) => nav.to !== '/' && path.startsWith(nav.to),
    );
    return item ? t(item.labelKey, language) : path.slice(1);
  })();

  const displayTitle = titleOverride || routeTitle;

  // Cycle theme: system -> light -> dark -> system
  const handleThemeToggle = () => {
    if (!onThemeChange) return;
    const cycle: ThemeMode[] = ['system', 'light', 'dark'];
    const currentIndex = cycle.indexOf(theme);
    const nextIndex = (currentIndex + 1) % cycle.length;
    onThemeChange(cycle[nextIndex]);
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
      {/* Left: page title */}
      <div className="flex items-center gap-4 min-w-0">
        <h1 className="text-base font-semibold text-slate-800 dark:text-slate-200 truncate tracking-tight">
          {displayTitle}
        </h1>
      </div>

      {/* Right: actions + theme toggle */}
      <div className="flex items-center gap-2 shrink-0">
        {actions}

        {onLanguageChange && (
          <button
            onClick={() => onLanguageChange(nextLanguage)}
            className={classNames(
              'inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition-all duration-200',
              'text-slate-500 dark:text-slate-400',
              'hover:bg-slate-200/60 dark:hover:bg-white/10',
              'hover:text-slate-700 dark:hover:text-slate-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400',
            )}
            title={language === 'zh' ? 'Switch to English' : '切换到中文'}
          >
            <Languages className="w-4 h-4" />
            <span>{t('topbar.language', language)}</span>
          </button>
        )}

        {/* Theme toggle */}
        {onThemeChange && (
          <button
            onClick={handleThemeToggle}
            className={classNames(
              'p-2 rounded-xl transition-all duration-200',
              'text-slate-400 dark:text-slate-500',
              'hover:bg-slate-200/60 dark:hover:bg-white/10',
              'hover:text-slate-600 dark:hover:text-slate-300',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400',
            )}
            title={`主题：${themeLabels[theme]}，点击切换。`}
          >
            <ThemeIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};

export default Topbar;
