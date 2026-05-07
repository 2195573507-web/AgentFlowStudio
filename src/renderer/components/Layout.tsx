import React, { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { classNames, capitalize } from '../lib/utils';
import type { ThemeMode } from '../lib/types';
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
    // Read from localStorage if available
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('agentflow-theme');
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    }
    return 'system';
  });

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    root.classList.toggle('dark', isDark);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle('dark', e.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const handleThemeChange = useCallback((newTheme: ThemeMode) => {
    setTheme(newTheme);
    localStorage.setItem('agentflow-theme', newTheme);
  }, []);

  return (
    <div
      className={classNames(
        'flex h-screen w-screen overflow-hidden',
        // Global glass background
        'bg-gradient-to-br from-slate-100 via-sky-50 to-indigo-50',
        'dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950',
      )}
    >
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <Topbar
          title={pageTitle}
          actions={topbarActions}
          theme={theme}
          onThemeChange={handleThemeChange}
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
