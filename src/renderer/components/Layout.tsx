import React, { useState, useCallback, useEffect } from 'react';
import { classNames } from '../lib/utils';
import type { ThemeMode } from '../lib/types';
import type { Language } from '../lib/i18n';
import { getLanguage, setLanguage as storeLanguage } from '../lib/i18n';
import { applyTheme, getTheme, onSystemThemeChange, setStoredTheme, THEME_KEY } from '../lib/theme';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export interface LayoutProps {
  /** Main content to render in the content area. */
  children: React.ReactNode;
  /** Optional actions rendered in the topbar. */
  topbarActions?: React.ReactNode;
  /** Optional page title override. */
  pageTitle?: string;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  topbarActions,
  pageTitle,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const legacyTheme = localStorage.getItem('agentflow-theme');
      if (!localStorage.getItem(THEME_KEY) && (legacyTheme === 'light' || legacyTheme === 'dark' || legacyTheme === 'system')) {
        localStorage.setItem(THEME_KEY, legacyTheme);
      }
    }
    return getTheme();
  });
  const [language, setLanguageState] = useState<Language>(() => getLanguage());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== 'system') return;
    return onSystemThemeChange(() => applyTheme(theme));
  }, [theme]);

  useEffect(() => {
    storeLanguage(language);
  }, [language]);

  const handleThemeChange = useCallback((newTheme: ThemeMode) => {
    setTheme(newTheme);
    setStoredTheme(newTheme);
  }, []);

  const handleLanguageChange = useCallback((newLanguage: Language) => {
    setLanguageState(newLanguage);
    storeLanguage(newLanguage);
  }, []);

  return (
    <div
      className={classNames(
        'flex h-screen w-screen overflow-hidden',
        'bg-transparent',
      )}
    >
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        language={language}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <Topbar
          title={pageTitle}
          actions={topbarActions}
          theme={theme}
          onThemeChange={handleThemeChange}
          language={language}
          onLanguageChange={handleLanguageChange}
        />

        {/* Scrollable content */}
        <main
          className={classNames(
            'flex-1 overflow-y-auto overflow-x-hidden',
            'p-5',
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
