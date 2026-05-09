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
  Settings,
  PlayCircle,
  ClipboardCheck,
  Circle,
  CheckCircle2,
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
    name: 'AI 聊天助手',
    idea: '带有记忆持久化和多接口支持的跨平台 AI 聊天应用。',
    platform: 'Desktop',
    techStack: 'Electron, React, TypeScript, Tailwind',
    uiStyle: '玻璃拟态工作台',
    difficulty: 'Medium',
    status: 'active',
    createdAt: new Date(Date.now() - 7 * 864e5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    name: '开发工具 CLI',
    idea: '面向开发者的命令行效率工具，集成 Git、日志分析和项目恢复上下文。',
    platform: 'CLI',
    techStack: 'Node.js, TypeScript, Ink',
    uiStyle: '极简终端',
    difficulty: 'Hard',
    status: 'planning',
    createdAt: new Date(Date.now() - 3 * 864e5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-3',
    name: '记忆同步服务',
    idea: '在项目与 AI 接口之间同步共享记忆的本地后台服务。',
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
    name: 'Prompt 模板管理器',
    idea: '用于管理、版本化和变量注入的 Prompt 模板界面。',
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
    name: '安全沙盒',
    idea: '用于测试 AI 生成命令、分析风险并给出替代方案的隔离环境。',
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
  { id: 't1', projectId: 'demo-1', title: '搭建项目脚手架', status: 'done', priority: 'high', createdAt: new Date().toISOString() },
  { id: 't2', projectId: 'demo-1', title: '实现登录与权限流程', status: 'in_progress', priority: 'high', createdAt: new Date().toISOString() },
  { id: 't3', projectId: 'demo-1', title: '设计聊天工作台界面', status: 'in_progress', priority: 'medium', createdAt: new Date().toISOString() },
  { id: 't4', projectId: 'demo-2', title: '编写 CLI 参数解析器', status: 'todo', priority: 'medium', createdAt: new Date().toISOString() },
  { id: 't5', projectId: 'demo-3', title: '定义 gRPC 协议结构', status: 'done', priority: 'high', createdAt: new Date().toISOString() },
  { id: 't6', projectId: 'demo-3', title: '实现记忆 CRUD 流程', status: 'in_progress', priority: 'high', createdAt: new Date().toISOString() },
];

const DEMO_PROMPTS: SavedPrompt[] = [
  { id: 'p1', name: '系统架构师 Prompt', templateId: 'system-architect', variables: {}, content: '你是资深系统架构师，请先分析约束再给出方案...', starred: true, createdAt: new Date().toISOString() },
  { id: 'p2', name: '代码审查 Prompt', templateId: 'code-reviewer', variables: {}, content: '请审查这段代码中的缺陷、风险和遗漏测试...', starred: false, createdAt: new Date(Date.now() - 2 * 864e5).toISOString() },
  { id: 'p3', name: '问题修复 Prompt', templateId: 'bug-fixer', variables: {}, content: '请定位并修复以下问题，说明根因和验证步骤...', starred: true, createdAt: new Date(Date.now() - 5 * 864e5).toISOString() },
];

const DEMO_MEMORIES: Memory[] = [
  { id: 'm1', type: 'decision', title: '采用 Electron 作为跨平台桌面方案', content: '保留 Electron 方案，同时在 esbuild 受限时使用 Static fallback 交付。', tags: ['architecture', 'frontend'], importance: 4, status: 'active', projectId: 'demo-1', lastUsedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'm2', type: 'pattern', title: '数据访问统一走仓储模式', content: '项目、任务、记忆等实体通过统一仓储接口访问，便于后续迁移存储层。', tags: ['backend', 'architecture'], importance: 3, status: 'active', projectId: 'demo-1', lastUsedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'm3', type: 'insight', title: '记忆注入能提升 Prompt 输出质量', content: '在生成 Prompt 前注入相关共享记忆，可以减少上下文丢失和重复解释。', tags: ['research', 'ai'], importance: 5, status: 'active', lastUsedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Dashboard fetch error:', message, err);
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
    { label: '新建项目', icon: Plus, route: '/projects', color: 'text-blue-400', bg: 'bg-blue-500/10 hover:bg-blue-500/20' },
    { label: '提示词实验室', icon: Wand2, route: '/prompts', color: 'text-purple-400', bg: 'bg-purple-500/10 hover:bg-purple-500/20' },
    { label: '日志分析', icon: FileText, route: '/logs', color: 'text-amber-400', bg: 'bg-amber-500/10 hover:bg-amber-500/20' },
    { label: '安全检查', icon: Shield, route: '/safety', color: 'text-green-400', bg: 'bg-green-500/10 hover:bg-green-500/20' },
    { label: '共享记忆中心', icon: Brain, route: '/memory', color: 'text-pink-400', bg: 'bg-pink-500/10 hover:bg-pink-500/20' },
    { label: 'Codex 交接', icon: Package, route: '/skills', color: 'text-cyan-400', bg: 'bg-cyan-500/10 hover:bg-cyan-500/20' },
  ];

  const beginnerSteps = [
    {
      title: '1. 创建项目',
      description: '写下想法，生成 PRD、任务和可交给 AI 的开发提示词。',
      icon: FolderKanban,
      route: '/projects',
      action: '进入项目',
    },
    {
      title: '2. 配置工具',
      description: '设置默认路径、AI 提供商和共享记忆注入方式。',
      icon: Settings,
      route: '/settings',
      action: '打开设置',
    },
    {
      title: '3. 开始闭环',
      description: '用 Prompt Lab、日志分析和安全检查把问题跑到可验证结果。',
      icon: PlayCircle,
      route: '/prompts',
      action: '生成 Prompt',
    },
  ];

  const hasProjects = projects.length > 0;
  const hasPrompts = prompts.length > 0;
  const hasMemories = memories.length > 0;
  const hasSafetyChecks = riskCount > 0;
  const hasActiveTasks = tasks.some((task) => task.status === 'in_progress' || task.status === 'todo');
  const workflowSteps = [
    { label: 'Idea', title: '记录想法', done: hasProjects, route: '/projects' },
    { label: 'Plan', title: '生成规划', done: hasProjects && tasks.length > 0, route: recentProjects[0] ? `/projects/${recentProjects[0].id}` : '/projects' },
    { label: 'Tasks', title: '拆成任务', done: tasks.length > 0, route: recentProjects[0] ? `/projects/${recentProjects[0].id}` : '/projects' },
    { label: 'Prompt', title: '生成 Prompt', done: hasPrompts, route: '/prompts' },
    { label: 'Safety', title: '检查命令', done: hasSafetyChecks, route: '/safety' },
    { label: 'Logs', title: '分析结果', done: false, route: '/logs' },
    { label: 'Memory', title: '沉淀记忆', done: hasMemories, route: '/memory' },
    { label: 'Handoff', title: '交接恢复', done: hasMemories && hasPrompts, route: '/memory' },
  ];
  const nextStep = workflowSteps.find((step) => !step.done) || workflowSteps[workflowSteps.length - 1];
  const nextStepCopy = !hasProjects
    ? '先创建一个项目，把目标、约束和技术栈写清楚。'
    : !hasActiveTasks && tasks.length === 0
      ? '进入项目详情，把想法拆成可交给 AI 的任务。'
      : !hasPrompts
        ? '打开 Prompt Lab，把任务变成可复制给 Codex / Claude Code / Cursor 的执行提示词。'
        : !hasSafetyChecks
          ? '运行前先把命令放进安全检查，避免误删文件或泄露密钥。'
          : !hasMemories
            ? '把关键决策和修复结果保存到共享记忆，方便下一轮恢复上下文。'
            : '复制恢复上下文，准备进入下一轮验证和交接。';

  // ── Status badge helper ─────────────────────────────────────────────────
  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      active:   { label: '进行中', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
      planning: { label: '规划中', cls: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
      paused:   { label: '已暂停', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
      done:     { label: '已完成', cls: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30' },
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
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/45 px-3 py-1 text-xs font-semibold text-slate-600 shadow-[var(--glass-inner)] backdrop-blur-md dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-accent-500" />
            本地优先的 AI 项目编排工作台
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">仪表板</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-zinc-400">
            从想法、规划、任务、Prompt、安全检查到日志和共享记忆，把一次 AI 协作变成可验证、可恢复的闭环。
          </p>
        </div>
        <button
          onClick={fetchData}
          className="liquid-focus rounded-xl border border-white/30 bg-white/45 p-2 text-slate-500 transition-colors hover:bg-white/70 hover:text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-zinc-400 dark:hover:bg-white/15 dark:hover:text-zinc-200"
          title="刷新数据"
          aria-label="刷新数据"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <GlassCard className="p-5 md:p-6" hoverable>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent-600 dark:text-accent-300">
              <ClipboardCheck className="h-4 w-4" />
              下一步
            </div>
            <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-zinc-100">{nextStep.title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-zinc-400">{nextStepCopy}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate(nextStep.route)}
            className="liquid-focus inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-all hover:bg-accent-500 active:scale-[0.98]"
          >
            继续到 {nextStep.title}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
          {workflowSteps.map((step) => (
            <button
              key={step.label}
              type="button"
              onClick={() => navigate(step.route)}
              className="liquid-focus rounded-lg border border-white/25 bg-white/35 p-3 text-left transition-colors hover:bg-white/60 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              aria-label={`${step.title}${step.done ? '，已完成' : '，待处理'}`}
            >
              {step.done ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <Circle className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              )}
              <div className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{step.label}</div>
              <div className="mt-1 text-xs font-medium text-slate-800 dark:text-zinc-200">{step.title}</div>
            </button>
          ))}
        </div>
      </GlassCard>

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
            type="button"
            onClick={() => navigate(action.route)}
            aria-label={`打开${action.label}`}
            title={`打开${action.label}`}
            className={`liquid-focus inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-[var(--glass-inner)] transition-all duration-200 dark:text-zinc-200 ${action.bg}`}
          >
            <action.icon className={`w-4 h-4 ${action.color}`} />
            {action.label}
            <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
          </button>
        ))}
      </div>

      <GlassCard className="p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">新手启动路径</h2>
            <p className="text-sm text-slate-600 dark:text-zinc-400 mt-1">第一次打开时，按这三步就能从想法进入可验证的 AI 开发流程。</p>
          </div>
          <span className="text-xs text-slate-500 dark:text-zinc-500">本地优先 · 可恢复 · 可验证</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          {beginnerSteps.map((step) => (
            <button
              key={step.title}
              type="button"
              onClick={() => navigate(step.route)}
              aria-label={`${step.title}：${step.action}`}
              title={step.action}
              className="liquid-focus text-left rounded-lg border border-white/20 bg-white/35 p-4 min-h-[142px] transition-colors hover:bg-white/60 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            >
              <step.icon className="w-5 h-5 text-blue-300 mb-3" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">{step.title}</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-5 mt-2">{step.description}</p>
              <span className="inline-flex items-center gap-1 text-xs text-blue-300 mt-3">
                {step.action}
                <ChevronRight className="w-3 h-3" />
              </span>
            </button>
          ))}
        </div>
      </GlassCard>

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
