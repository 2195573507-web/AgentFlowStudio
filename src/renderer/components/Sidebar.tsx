import React, { useState, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Wand2,
  FileSearch,
  GitBranch,
  Shield,
  Brain,
  Puzzle,
  Settings,
  Workflow,
  Users,
  ScrollText,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { classNames } from '../lib/utils';
import type { Language } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import { hasPermission } from '../lib/permissions';

export interface NavItem {
  to: string;
  icon: React.FC<{ className?: string }>;
  label: string;
  labelKey: string;
}

const navItems: NavItem[] = [
  { to: '/', icon: LayoutDashboard, label: 'Nexus Home', labelKey: 'nav.dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Project Hub', labelKey: 'nav.projects' },
  { to: '/workflows', icon: Workflow, label: 'Agent Flows', labelKey: 'nav.workflows' },
  { to: '/prompts', icon: Wand2, label: 'Prompt Lab', labelKey: 'nav.promptLab' },
  { to: '/logs', icon: FileSearch, label: 'Log Analyzer', labelKey: 'nav.logAnalyzer' },
  { to: '/git', icon: GitBranch, label: 'Git Timeline', labelKey: 'nav.gitTimeline' },
  { to: '/safety', icon: Shield, label: 'Safety Guard', labelKey: 'nav.safetyBox' },
  { to: '/memory', icon: Brain, label: 'Shared Memory', labelKey: 'nav.sharedMemory' },
  { to: '/skills', icon: Puzzle, label: 'Skills', labelKey: 'nav.skills' },
  { to: '/admin/users', icon: Users, label: 'Admin Users', labelKey: 'nav.adminUsers' },
  { to: '/admin/audit', icon: ScrollText, label: 'Audit Logs', labelKey: 'nav.adminAudit' },
  { to: '/settings', icon: Settings, label: 'Settings', labelKey: 'nav.settings' },
];

export interface SidebarProps {
  /** Whether the sidebar is collapsed (icons-only mode). */
  collapsed: boolean;
  /** Called to toggle collapsed state. */
  onToggleCollapse: () => void;
  language?: Language;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse, language = 'zh' }) => {
  const location = useLocation();
  const { user } = useAuth();
  void language;
  const visibleNavItems = navItems.filter((item) => {
    if (item.to.startsWith('/admin/users')) return hasPermission(user, 'admin:users');
    if (item.to.startsWith('/admin/audit')) return hasPermission(user, 'admin:audit');
    return true;
  });

  return (
    <aside
      className={classNames(
        'relative flex flex-col h-full',
        'liquid-glass-chrome border-r',
        'transition-all duration-300 ease-out',
        collapsed ? 'w-[64px]' : 'w-[240px]',
        'shrink-0',
      )}
    >
      {/* App logo / brand */}
      <div
        className={classNames(
          'flex items-center h-14 px-4 border-b border-white/10 dark:border-white/5',
          collapsed ? 'justify-center' : 'justify-between',
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent-500/20 flex items-center justify-center">
              <Network className="w-4 h-4 text-accent-500" />
            </div>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight">
              LocalAI Nexus
            </span>
          </div>
        )}
        {collapsed && (
          <div className="w-7 h-7 rounded-lg bg-accent-500/20 flex items-center justify-center">
            <Network className="w-4 h-4 text-accent-500" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const label = item.label;
          const isActive =
            item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={classNames(
                'flex items-center gap-3 rounded-xl transition-all duration-200 ease-out',
                'text-sm font-medium',
                collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5',
                // Active state
                isActive
                  ? 'bg-accent-500/15 text-accent-600 dark:text-accent-400 shadow-sm ring-1 ring-accent-400/20'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-white/45 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-slate-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/70',
              )}
              title={collapsed ? label : undefined}
            >
              <Icon
                className={classNames(
                  'w-5 h-5 shrink-0 transition-transform duration-200',
                  isActive && 'scale-110',
                )}
              />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-white/10 dark:border-white/5">
        <button
          onClick={onToggleCollapse}
          className={classNames(
            'w-full flex items-center gap-3 rounded-xl transition-all duration-200',
            'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300',
            'hover:bg-slate-200/50 dark:hover:bg-white/5',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/70',
            collapsed ? 'justify-center py-2.5' : 'px-3 py-2.5',
          )}
          title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          {collapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <>
              <PanelLeftClose className="w-4 h-4 shrink-0" />
              <span className="text-sm font-medium truncate">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

// Re-export navItems for use elsewhere
export { navItems };
