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
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { classNames } from '../lib/utils';
import type { Language } from '../lib/i18n';
import { t } from '../lib/i18n';

export interface NavItem {
  to: string;
  icon: React.FC<{ className?: string }>;
  label: string;
  labelKey: string;
}

const navItems: NavItem[] = [
  { to: '/', icon: LayoutDashboard, label: '仪表盘', labelKey: 'nav.dashboard' },
  { to: '/projects', icon: FolderKanban, label: '项目管理', labelKey: 'nav.projects' },
  { to: '/prompts', icon: Wand2, label: '提示词实验室', labelKey: 'nav.promptLab' },
  { to: '/logs', icon: FileSearch, label: '日志分析', labelKey: 'nav.logAnalyzer' },
  { to: '/git', icon: GitBranch, label: 'Git 时间线', labelKey: 'nav.gitTimeline' },
  { to: '/safety', icon: Shield, label: '安全检查', labelKey: 'nav.safetyBox' },
  { to: '/memory', icon: Brain, label: '共享记忆中心', labelKey: 'nav.sharedMemory' },
  { to: '/skills', icon: Puzzle, label: '技能管理', labelKey: 'nav.skills' },
  { to: '/settings', icon: Settings, label: '设置', labelKey: 'nav.settings' },
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
              <Brain className="w-4 h-4 text-accent-500" />
            </div>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight">
              AgentFlow
            </span>
          </div>
        )}
        {collapsed && (
          <div className="w-7 h-7 rounded-lg bg-accent-500/20 flex items-center justify-center">
            <Brain className="w-4 h-4 text-accent-500" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const label = t(item.labelKey, language);
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
          title={collapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {collapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <>
              <PanelLeftClose className="w-4 h-4 shrink-0" />
              <span className="text-sm font-medium truncate">收起</span>
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
