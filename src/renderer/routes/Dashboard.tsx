import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  CheckSquare,
  Wand2,
  Shield,
  Brain,
  Plus,
  FileText,
  AlertTriangle,
  Database,
  GitBranch,
  Package,
  RefreshCw,
  ChevronRight,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { api } from '../lib/api';
import { GlassCard, StatCard, EmptyState, Charts } from '../components/';
import type { Project, SavedPrompt, Task, Memory } from '../lib/types';
import { formatRelativeDate, truncate } from '../lib/utils';

const { TaskStatusChart, MemoryTypeChart } = Charts;

// ── Demo data (used when api is unavailable) ────────────────────────────────
const DEMO_PROJECTS: Project[] = [
  {
    id: 'demo-1',
    name: 'AI Chat Assistant',
    idea: 'A cross-platform AI chat app with memory persistence and multi-provider support.',
    platform: 'Desktop',
    techStack: 'Electron, React, TypeScript, Tailwind',
    uiStyle: 'Glassmorphism',
    difficulty: 'Medium',
    status: 'active',
    createdAt: new Date(Date.now() - 7 * 864e5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    name: 'DevTool CLI',
    idea: 'Command-line productivity suite for developers with git integration and log analysis.',
    platform: 'CLI',
    techStack: 'Node.js, TypeScript, Ink',
    uiStyle: 'Minimal',
    difficulty: 'Hard',
    status: 'planning',
    createdAt: new Date(Date.now() - 3 * 864e5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-3',
    name: 'Memory Sync Service',
    idea: 'Background service that syncs shared AI memories across projects and providers.',
    platform: 'Web',
    techStack: 'Go, SQLite, gRPC',
    uiStyle: 'Linear',
    difficulty: 'Hard',
    status: 'active',
    createdAt: new Date(Date.now() - 14 * 864e5).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 864e5).toISOString(),
  },
  {
    id: 'demo-4',
    name: 'Prompt Template Manager',
    idea: 'Web UI for managing and versioning AI prompt templates with variable injection.',
    platform: 'Web',
    techStack: 'Next.js, Prisma, PostgreSQL',
    uiStyle: 'Raycast',
    difficulty: 'Easy',
    status: 'done',
    createdAt: new Date(Date.now() - 30 * 864e5).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 864e5).toISOString(),
  },
  {
    id: 'demo-5',
    name: 'Safety Sandbox',
    idea: 'Isolated environment for testing AI-generated shell commands with risk analysis.',
    platform: 'Desktop',
    techStack: 'Tauri, Rust, React',
    uiStyle: 'Glassmorphism',
    difficulty: 'Medium',
    status: 'paused',
    createdAt: new Date(Date.now() - 21 * 864e5).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 864e5).toISOString(),
  },
];

const DEMO_TASKS: Task[] = [
  { id: 't1', projectId: 'demo-1', title: 'Set up project scaffolding', status: 'done', priority: 'high', createdAt: new Date().toISOString() },
  { id: 't2', projectId: 'demo-1', title: 'Implement auth flow', status: 'in_progress', priority: 'high', createdAt: new Date().toISOString() },
  { id: 't3', projectId: 'demo-1', title: 'Design chat UI', status: 'in_progress', priority: 'medium', createdAt: new Date().toISOString() },
  { id: 't4', projectId: 'demo-2', title: 'Write CLI argument parser', status: 'todo', priority: 'medium', createdAt: new Date().toISOString() },
  { id: 't5', projectId: 'demo-3', title: 'Define gRPC proto schema', status: 'done', priority: 'high', createdAt: new Date().toISOString() },
  { id: 't6', projectId: 'demo-3', title: 'Implement memory CRUD', status: 'in_progress', priority: 'high', createdAt: new Date().toISOString() },
];

const DEMO_PROMPTS: SavedPrompt[] = [
  { id: 'p1', name: 'System Architect', templateId: 'system-architect', variables: {}, content: 'You are a senior system architect...', starred: true, createdAt: new Date().toISOString() },
  { id: 'p2', name: 'Code Reviewer', templateId: 'code-reviewer', variables: {}, content: 'Review this code for bugs...', starred: false, createdAt: new Date(Date.now() - 2 * 864e5).toISOString() },
  { id: 'p3', name: 'Bug Fixer', templateId: 'bug-fixer', variables: {}, content: 'Analyze and fix the following bug...', starred: true, createdAt: new Date(Date.now() - 5 * 864e5).toISOString() },
];

const DEMO_MEMORIES: Memory[] = [
  { id: 'm1', type: 'decision', title: 'Use Electron for cross-platform', content: 'Decided to use Electron...', tags: ['architecture', 'frontend'], importance: 4, status: 'active', projectId: 'demo-1', lastUsedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'm2', type: 'pattern', title: 'Repository pattern for data', content: 'All data access goes through...', tags: ['backend', 'architecture'], importance: 3, status: 'active', projectId: 'demo-1', lastUsedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'm3', type: 'insight', title: 'Memory injection improves output', content: 'Testing shows 40% better...', tags: ['research', 'ai'], importance: 5, status: 'active', lastUsedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

// ── Component ───────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();

  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [riskCount, setRiskCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiAvailable, setApiAvailable] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!api || typeof api.projects?.list !== 'function') {
        // API not available — use demo data
        setApiAvailable(false);
        setProjects(DEMO_PROJECTS);
        setTasks(DEMO_TASKS);
        setPrompts(DEMO_PROMPTS);
        setMemories(DEMO_MEMORIES);
        setRiskCount(12);
        setLoading(false);
        return;
      }

      const [pRes, tRes, prRes, mRes] = await Promise.all([
        api.projects.list(),
        api.tasks.list(),
        api.prompts.list(),
        api.memory.list(),
      ]);

      setProjects(Array.isArray(pRes) ? pRes : []);
      setTasks(Array.isArray(tRes) ? tRes : []);
      setPrompts(Array.isArray(prRes) ? prRes : []);
      setMemories(Array.isArray(mRes) ? mRes : []);

      // Count risk checks from safety history
      const safetyMemories = (Array.isArray(mRes) ? mRes : []).filter(
        (m: Memory) => m.type === 'safety_check' || (m.tags || []).includes('safety')
      );
      setRiskCount(safetyMemories.length || 0);
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      // Fallback to demo data on error
      setApiAvailable(false);
      setProjects(DEMO_PROJECTS);
      setTasks(DEMO_TASKS);
      setPrompts(DEMO_PROMPTS);
      setMemories(DEMO_MEMORIES);
      setRiskCount(12);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Derived data ────────────────────────────────────────────────────────
  const taskStatusDistribution = React.useMemo(() => {
    const dist: Record<string, number> = { done: 0, in_progress: 0, todo: 0 };
    tasks.forEach((t) => {
      dist[t.status] = (dist[t.status] || 0) + 1;
    });
    return dist;
  }, [tasks]);

  const memoryTypeDistribution = React.useMemo(() => {
    const dist: Record<string, number> = {};
    memories.forEach((m) => {
      dist[m.type] = (dist[m.type] || 0) + 1;
    });
    return dist;
  }, [memories]);

  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const recentPrompts = [...prompts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // ── Quick actions ───────────────────────────────────────────────────────
  const quickActions = [
    { label: 'New Project', icon: Plus, route: '/projects', color: 'text-blue-400', bg: 'bg-blue-500/10 hover:bg-blue-500/20' },
    { label: 'Prompt Lab', icon: Wand2, route: '/prompts', color: 'text-purple-400', bg: 'bg-purple-500/10 hover:bg-purple-500/20' },
    { label: 'Log Analyzer', icon: FileText, route: '/log-analyzer', color: 'text-amber-400', bg: 'bg-amber-500/10 hover:bg-amber-500/20' },
    { label: 'Safety Box', icon: Shield, route: '/safety', color: 'text-green-400', bg: 'bg-green-500/10 hover:bg-green-500/20' },
    { label: 'Shared Memory Hub', icon: Brain, route: '/memory', color: 'text-pink-400', bg: 'bg-pink-500/10 hover:bg-pink-500/20' },
    { label: 'Codex Handoff', icon: Package, route: '/skills', color: 'text-cyan-400', bg: 'bg-cyan-500/10 hover:bg-cyan-500/20' },
  ];

  // ── Status badge helper ─────────────────────────────────────────────────
  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      active:   { label: 'Active', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
      planning: { label: 'Planning', cls: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
      paused:   { label: 'Paused', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
      done:     { label: 'Done', cls: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30' },
    };
    const m = map[status] || { label: status, cls: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30' };
    return (
      <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full border ${m.cls}`}>
        {m.label}
      </span>
    );
  };

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 animate-pulse">
        {/* Stat cards skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-white/5 border border-white/10" />
          ))}
        </div>
        {/* Quick actions skeleton */}
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 w-40 rounded-xl bg-white/5 border border-white/10" />
          ))}
        </div>
        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 rounded-2xl bg-white/5 border border-white/10" />
          <div className="h-80 rounded-2xl bg-white/5 border border-white/10" />
        </div>
        {/* Cards skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 rounded-2xl bg-white/5 border border-white/10" />
          <div className="h-64 rounded-2xl bg-white/5 border border-white/10" />
        </div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────
  if (error && !apiAvailable) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <GlassCard className="p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-zinc-100 mb-2">数据加载失败</h2>
          <p className="text-zinc-400 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> 重试
          </button>
        </GlassCard>
      </div>
    );
  }

  // ── Demo banner ─────────────────────────────────────────────────────────
  const DemoBanner = !apiAvailable ? (
    <div className="mb-6 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm flex items-center gap-2">
      <Sparkles className="w-4 h-4 flex-shrink-0" />
      正在使用演示数据。启动 Electron 应用以连接真实数据。
    </div>
  ) : null;

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {DemoBanner}

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">仪表板</h1>
          <p className="text-zinc-400 mt-1 text-sm">AgentFlow Studio 项目总览</p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors"
          title="刷新数据"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          icon={FolderKanban}
          label="项目总数"
          value={projects.length}
          color="blue"
          onClick={() => navigate('/projects')}
        />
        <StatCard
          icon={CheckSquare}
          label="任务总数"
          value={tasks.length}
          color="emerald"
          onClick={() => navigate('/projects')}
        />
        <StatCard
          icon={Wand2}
          label="Prompt 数量"
          value={prompts.length}
          color="purple"
          onClick={() => navigate('/prompts')}
        />
        <StatCard
          icon={Shield}
          label="风险检查"
          value={riskCount}
          color="amber"
          onClick={() => navigate('/safety')}
        />
        <StatCard
          icon={Brain}
          label="共享记忆"
          value={memories.length}
          color="pink"
          onClick={() => navigate('/memory')}
        />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.route)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 transition-all duration-200 ${action.bg} text-zinc-200 text-sm font-medium`}
          >
            <action.icon className={`w-4 h-4 ${action.color}`} />
            {action.label}
            <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-blue-400" />
            任务状态分布
          </h3>
          {tasks.length > 0 ? (
            <div className="h-64">
              <TaskStatusChart data={taskStatusDistribution} />
            </div>
          ) : (
            <EmptyState
              icon={CheckSquare}
              title="暂无任务"
              description="创建项目后即可添加任务"
            />
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
            <Brain className="w-4 h-4 text-pink-400" />
            记忆类型分布
          </h3>
          {memories.length > 0 ? (
            <div className="h-64">
              <MemoryTypeChart data={memoryTypeDistribution} />
            </div>
          ) : (
            <EmptyState
              icon={Brain}
              title="暂无记忆"
              description="在项目中创建共享记忆以开始积累知识"
            />
          )}
        </GlassCard>
      </div>

      {/* Bottom cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-blue-400" />
              最近项目
            </h3>
            <button
              onClick={() => navigate('/projects')}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              查看全部 <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {recentProjects.length > 0 ? (
            <div className="space-y-2">
              {recentProjects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-white/10"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-200">{p.name}</span>
                    {statusBadge(p.status)}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">{truncate(p.idea, 80)}</p>
                  <p className="text-[11px] text-zinc-600 mt-1">{formatRelativeDate(p.updatedAt)}</p>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FolderKanban}
              title="暂无项目"
              description="创建第一个项目开始使用"
              actionLabel="创建项目"
              onAction={() => navigate('/projects')}
            />
          )}
        </GlassCard>

        {/* Recent Prompts */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-purple-400" />
              最近 Prompt
            </h3>
            <button
              onClick={() => navigate('/prompts')}
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
            >
              查看全部 <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {recentPrompts.length > 0 ? (
            <div className="space-y-2">
              {recentPrompts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate('/prompts')}
                  className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-white/10 flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium text-zinc-200 block truncate">
                      {p.name}
                    </span>
                    <span className="text-xs text-zinc-500 block truncate mt-0.5">
                      {truncate(p.content, 60)}
                    </span>
                  </div>
                  {p.starred && <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 ml-2" />}
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Wand2}
              title="暂无 Prompt"
              description="在 Prompt Lab 中创建你的第一个模板"
              actionLabel="前往 Prompt Lab"
              onAction={() => navigate('/prompts')}
            />
          )}
        </GlassCard>
      </div>

      {/* Subtle footer info */}
      <p className="text-center text-xs text-zinc-600 pt-4">
        AgentFlow Studio {apiAvailable ? '' : '— 离线模式'}
      </p>
    </div>
  );
}
