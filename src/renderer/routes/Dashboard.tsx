import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Brain,
  CheckCircle2,
  CheckSquare,
  Circle,
  ClipboardCheck,
  Database,
  FileSearch,
  FolderKanban,
  GitBranch,
  KeyRound,
  PlayCircle,
  RefreshCw,
  Settings,
  Shield,
  Sparkles,
  Wand2,
  Workflow,
} from 'lucide-react';
import { api } from '../lib/api';
import { EmptyState, SurfaceCard, StatCard } from '../components/';
import type {
  Memory,
  NexusGatewayStatus,
  NexusHealthCheckResult,
  NexusUsageSummary,
  Project,
  ProviderSetting,
  SavedPrompt,
  Task,
} from '../lib/types';
import { formatRelativeDate, truncate } from '../lib/utils';

const now = Date.now();

const DEMO_PROJECTS: Project[] = [
  {
    id: 'demo-nexus-1',
    name: 'Local coding cockpit',
    idea: 'A local workspace for coordinating AI coding agents, prompts, logs, memories, and release notes.',
    platform: 'Desktop',
    techStack: 'Electron, React, TypeScript, Tailwind',
    uiStyle: 'Compact desktop tool',
    difficulty: 'Medium',
    status: 'active',
    createdAt: new Date(now - 10 * 864e5).toISOString(),
    updatedAt: new Date(now - 2 * 3600e3).toISOString(),
  },
  {
    id: 'demo-nexus-2',
    name: 'Provider switchboard',
    idea: 'Track local and OpenAI-compatible providers without exposing secrets in prompts or exports.',
    platform: 'Desktop',
    techStack: 'Node.js, Electron IPC',
    uiStyle: 'Compact admin surface',
    difficulty: 'Hard',
    status: 'planning',
    createdAt: new Date(now - 5 * 864e5).toISOString(),
    updatedAt: new Date(now - 12 * 3600e3).toISOString(),
  },
  {
    id: 'demo-nexus-3',
    name: 'Memory recovery kit',
    idea: 'Capture decisions, issue fixes, and handoff context so another model can resume the project cleanly.',
    platform: 'Web',
    techStack: 'React, JSON storage',
    uiStyle: 'Linear-inspired knowledge hub',
    difficulty: 'Medium',
    status: 'done',
    createdAt: new Date(now - 21 * 864e5).toISOString(),
    updatedAt: new Date(now - 3 * 864e5).toISOString(),
  },
];

const DEMO_TASKS: Task[] = [
  { id: 'task-1', projectId: 'demo-nexus-1', title: 'Connect the first local project', status: 'done', priority: 'high', createdAt: new Date(now - 6 * 864e5).toISOString() },
  { id: 'task-2', projectId: 'demo-nexus-1', title: 'Generate task prompts for the next coding agent', status: 'in_progress', priority: 'high', createdAt: new Date(now - 2 * 864e5).toISOString() },
  { id: 'task-3', projectId: 'demo-nexus-2', title: 'Test provider connection before using it in prompts', status: 'todo', priority: 'medium', createdAt: new Date(now - 864e5).toISOString() },
  { id: 'task-4', projectId: 'demo-nexus-3', title: 'Save recovery context to Shared Memory', status: 'done', priority: 'medium', createdAt: new Date(now - 4 * 864e5).toISOString() },
];

const DEMO_PROMPTS: SavedPrompt[] = [
  { id: 'prompt-1', name: 'Implementation handoff prompt', templateId: 'handoff', variables: {}, content: 'Read the local project context, preserve existing changes, implement the next scoped task, and report verification.', starred: true, favorite: true, createdAt: new Date(now - 2 * 3600e3).toISOString() },
  { id: 'prompt-2', name: 'Safety review prompt', templateId: 'safety', variables: {}, content: 'Review the command for destructive behavior, secret exposure, and safer alternatives before execution.', starred: false, createdAt: new Date(now - 2 * 864e5).toISOString() },
];

const DEMO_MEMORIES: Memory[] = [
  { id: 'memory-1', type: 'decision', title: 'Local-first orchestration', content: 'Project context, provider settings, and memories stay local unless the user exports them.', tags: ['local-first', 'architecture'], importance: 5, status: 'active', projectId: 'demo-nexus-1', lastUsedAt: new Date(now - 3600e3).toISOString(), createdAt: new Date(now - 5 * 864e5).toISOString(), updatedAt: new Date(now - 3600e3).toISOString() },
  { id: 'memory-2', type: 'safety_check', title: 'Shortcut launch policy', content: 'Desktop shortcuts should prefer the Electron entry and skip devtools to avoid startup noise.', tags: ['launcher', 'safety'], importance: 4, status: 'active', projectId: 'demo-nexus-1', lastUsedAt: new Date(now - 2 * 3600e3).toISOString(), createdAt: new Date(now - 3 * 864e5).toISOString(), updatedAt: new Date(now - 2 * 3600e3).toISOString() },
];

const statusLabel: Record<string, string> = {
  active: 'Active',
  planning: 'Planning',
  paused: 'Paused',
  done: 'Done',
};

const statusClass: Record<string, string> = {
  active: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
  planning: 'border-blue-400/30 bg-blue-500/15 text-blue-600 dark:text-blue-300',
  paused: 'border-amber-400/30 bg-amber-500/15 text-amber-600 dark:text-amber-300',
  done: 'border-slate-400/30 bg-slate-500/15 text-[var(--text-secondary)] dark:text-slate-300',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [riskCount, setRiskCount] = useState(0);
  const [providers, setProviders] = useState<ProviderSetting[]>([]);
  const [activeProvider, setActiveProvider] = useState({ providerRef: '', model: '' });
  const [gatewayStatus, setGatewayStatus] = useState<NexusGatewayStatus | null>(null);
  const [usageSummary, setUsageSummary] = useState<NexusUsageSummary | null>(null);
  const [healthState, setHealthState] = useState<{ latest: NexusHealthCheckResult[]; byStatus: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiAvailable, setApiAvailable] = useState(true);
  const [gatewayBusy, setGatewayBusy] = useState(false);

  const applyDemoData = useCallback(() => {
    setApiAvailable(false);
    setProjects(DEMO_PROJECTS);
    setTasks(DEMO_TASKS);
    setPrompts(DEMO_PROMPTS);
    setMemories(DEMO_MEMORIES);
    setRiskCount(DEMO_MEMORIES.filter((memory) => memory.type === 'safety_check').length);
    setProviders([]);
    setActiveProvider({ providerRef: '', model: '' });
    setGatewayStatus(null);
    setUsageSummary(null);
    setHealthState(null);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (!api || typeof api.projects?.list !== 'function') {
        applyDemoData();
        return;
      }

      const [
        projectResult,
        taskResult,
        promptResult,
        memoryResult,
        providerResult,
        activeResult,
        gatewayResult,
        usageResult,
        healthResult,
      ] = await Promise.all([
        api.projects.list(),
        api.tasks.list(),
        api.prompts.list(),
        api.memory.list(),
        api.providers.list().catch(() => []),
        api.providers.getActive().catch(() => ({ providerRef: '', model: '' })),
        api.gateway.status().catch(() => null),
        api.usage.summary().catch(() => null),
        api.health.summary().catch(() => null),
      ]);

      const projectList = Array.isArray(projectResult) ? projectResult : [];
      const taskList = Array.isArray(taskResult) ? taskResult : [];
      const promptList = Array.isArray(promptResult) ? promptResult : [];
      const memoryList = Array.isArray(memoryResult) ? memoryResult : [];

      setApiAvailable(true);
      setProjects(projectList);
      setTasks(taskList);
      setPrompts(promptList);
      setMemories(memoryList);
      setProviders(Array.isArray(providerResult) ? providerResult : []);
      if (activeResult && typeof activeResult === 'object' && !('error' in activeResult)) {
        setActiveProvider({ providerRef: activeResult.providerRef, model: activeResult.model });
      }
      if (gatewayResult && typeof gatewayResult === 'object' && !('error' in gatewayResult)) {
        setGatewayStatus(gatewayResult);
      }
      if (usageResult && typeof usageResult === 'object' && !('error' in usageResult)) {
        setUsageSummary(usageResult);
      }
      if (healthResult && typeof healthResult === 'object' && !('error' in healthResult)) {
        setHealthState(healthResult);
      }
      setRiskCount(
        memoryList.filter((memory) => memory.type === 'safety_check' || (memory.tags || []).includes('safety')).length,
      );
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      applyDemoData();
    } finally {
      setLoading(false);
    }
  }, [applyDemoData]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const recentProjects = useMemo(
    () => [...projects].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 4),
    [projects],
  );

  const recentPrompts = useMemo(
    () => [...prompts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4),
    [prompts],
  );

  const hasProjects = projects.length > 0;
  const hasTasks = tasks.length > 0;
  const hasPrompts = prompts.length > 0;
  const hasMemories = memories.length > 0;
  const hasSafetyChecks = riskCount > 0;
  const activeProviderRecord = providers.find((provider) => provider.id === activeProvider.providerRef);
  const providerHealth = healthState?.latest[0]?.status ?? 'Unknown';
  const recentFailure = usageSummary?.recentFailureReason ?? 'None';
  const gatewayOnline = Boolean(gatewayStatus?.online);

  const startGateway = async () => {
    setGatewayBusy(true);
    try {
      const status = await api.gateway.start();
      if (status && typeof status === 'object' && !('error' in status)) setGatewayStatus(status);
      await fetchData();
    } finally {
      setGatewayBusy(false);
    }
  };

  const firstRunSteps = [
    {
      label: 'Provider',
      title: 'Add a provider',
      body: 'Connect OpenAI-compatible, Anthropic-compatible, Gemini, Ollama, or custom local providers.',
      icon: KeyRound,
      route: '/settings',
      done: providers.length > 0,
    },
    {
      label: 'Gateway',
      title: 'Start the local gateway',
      body: 'Expose the local OpenAI-compatible gateway at http://127.0.0.1:8317.',
      icon: Activity,
      route: '/settings',
      done: gatewayOnline,
    },
    {
      label: 'Workflow',
      title: 'Create the first workflow',
      body: 'Bind a task, prompt skill, provider route, and audit timeline into a repeatable run.',
      icon: Workflow,
      route: '/workflows',
      done: hasTasks,
    },
    {
      label: 'Project',
      title: 'Create or open a project',
      body: 'Capture the goal, constraints, stack, and delivery boundary before asking an agent to act.',
      icon: FolderKanban,
      route: '/projects',
      done: hasProjects,
    },
    {
      label: 'Prompt',
      title: 'Generate the handoff prompt',
      body: 'Turn a scoped task into an executable prompt for Codex, Claude Code, Cursor, or another agent.',
      icon: Wand2,
      route: '/prompts',
      done: hasPrompts,
    },
    {
      label: 'Guard',
      title: 'Check risky commands',
      body: 'Run command ideas through Safety before they touch the local workspace.',
      icon: Shield,
      route: '/safety',
      done: hasSafetyChecks,
    },
    {
      label: 'Memory',
      title: 'Save recovery context',
      body: 'Store decisions, fixes, and handoff notes so the next model can resume without guesswork.',
      icon: Brain,
      route: '/memory',
      done: hasMemories,
    },
  ];

  const nextStep = firstRunSteps.find((step) => !step.done) || firstRunSteps[firstRunSteps.length - 1];

  const quickActions = [
    { label: 'Provider Hub', icon: Settings, route: '/settings', tone: 'text-blue-500' },
    { label: 'Runtime Profile', icon: Activity, route: '/settings', tone: 'text-emerald-500' },
    { label: 'Skill Hub', icon: Wand2, route: '/skills', tone: 'text-violet-500' },
    { label: 'Diagnostics', icon: FileSearch, route: '/settings', tone: 'text-amber-500' },
    { label: 'Shared Memory', icon: Brain, route: '/memory', tone: 'text-rose-500' },
    { label: 'Git Timeline', icon: GitBranch, route: '/git', tone: 'text-cyan-500' },
  ];

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8 animate-pulse">
        <div className="h-44 rounded-panel bg-[var(--surface-muted)]" />
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-28 rounded-panel bg-[var(--surface-muted)]" />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="h-72 rounded-panel bg-[var(--surface-muted)]" />
          <div className="h-72 rounded-panel bg-[var(--surface-muted)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7 px-6 py-8">
      {!apiAvailable && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-200">
          <Sparkles className="h-4 w-4 shrink-0" />
          LocalAI Nexus is showing demo data because the desktop data bridge is not available in this session.
        </div>
      )}

      <section className="surface-card overflow-hidden p-0">
        <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:p-7">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-accent-700 dark:text-accent-300">
              <Activity className="h-3.5 w-3.5" />
              Local-first AI orchestration hub
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--text-primary)] dark:text-[var(--text-primary)]">
              LocalAI Nexus
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
              Bring projects, model providers, task prompts, safety checks, logs, git context, and shared memory into one local control surface.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  if (nextStep.label === 'Gateway') void startGateway();
                  else navigate(nextStep.route);
                }}
                className="focus-ring inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white  transition-colors hover:bg-accent-500"
                disabled={gatewayBusy}
              >
                {gatewayBusy ? 'Starting gateway...' : `Continue: ${nextStep.title}`}
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => void fetchData()}
                className="focus-ring inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-hover)] dark:text-[var(--text-primary)] dark:hover:bg-[var(--surface-hover)]"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>

          <div className="rounded-panel border border-[var(--border)] bg-[var(--surface-muted)] p-4  dark:bg-[var(--surface-muted)]">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-[var(--text-muted)] dark:text-[var(--text-secondary)]">
              <ClipboardCheck className="h-4 w-4" />
              First-run checklist
            </div>
            <div className="mt-4 space-y-2">
              {firstRunSteps.slice(0, 3).map((step) => (
                <button
                  key={step.label}
                  type="button"
                  onClick={() => {
                    if (step.label === 'Gateway') void startGateway();
                    else navigate(step.route);
                  }}
                  className="focus-ring flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-[var(--surface-hover)] dark:hover:bg-[var(--surface-hover)]"
                >
                  {step.done ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-[var(--text-muted)]" />}
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--text-primary)] dark:text-[var(--text-primary)]">{step.title}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SurfaceCard className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-[var(--text-muted)] dark:text-[var(--text-muted)]">Gateway</p>
              <h2 className="mt-1 text-lg font-bold text-[var(--text-primary)] dark:text-[var(--text-primary)]">
                {gatewayOnline ? 'Online' : 'Offline'}
              </h2>
              <p className="mt-1 text-xs text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
                {gatewayStatus?.baseUrl ?? 'http://127.0.0.1:8317'}
              </p>
            </div>
            <span className={`rounded-full px-2 py-1 text-xs font-semibold ${gatewayOnline ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300' : 'bg-amber-500/15 text-amber-600 dark:text-amber-300'}`}>
              {gatewayOnline ? 'Ready' : 'Start needed'}
            </span>
          </div>
          {!gatewayOnline && (
            <button
              type="button"
              onClick={() => void startGateway()}
              className="focus-ring mt-3 inline-flex min-h-[36px] items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-hover)] dark:text-[var(--text-primary)] dark:hover:bg-[var(--surface-hover)]"
              disabled={gatewayBusy}
            >
              <PlayCircle className="h-3.5 w-3.5" />
              {gatewayBusy ? 'Starting' : 'Start Gateway'}
            </button>
          )}
        </SurfaceCard>

        <SurfaceCard className="p-4">
          <p className="text-xs font-semibold uppercase text-[var(--text-muted)] dark:text-[var(--text-muted)]">Default Provider</p>
          <h2 className="mt-1 truncate text-lg font-bold text-[var(--text-primary)] dark:text-[var(--text-primary)]">
            {activeProviderRecord?.providerName || 'Not selected'}
          </h2>
          <p className="mt-1 truncate text-xs text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
            {activeProvider.model || activeProviderRecord?.modelName || 'Choose a model in Settings'}
          </p>
        </SurfaceCard>

        <SurfaceCard className="p-4">
          <p className="text-xs font-semibold uppercase text-[var(--text-muted)] dark:text-[var(--text-muted)]">Token Today</p>
          <h2 className="mt-1 text-lg font-bold tabular-nums text-[var(--text-primary)] dark:text-[var(--text-primary)]">
            {usageSummary?.totalTokens ?? 0}
          </h2>
          <p className="mt-1 text-xs text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
            {usageSummary?.todayRequests ?? 0} requests / failure {Math.round((usageSummary?.failureRate ?? 0) * 100)}%
          </p>
        </SurfaceCard>

        <SurfaceCard className="p-4">
          <p className="text-xs font-semibold uppercase text-[var(--text-muted)] dark:text-[var(--text-muted)]">Health</p>
          <h2 className="mt-1 text-lg font-bold text-[var(--text-primary)] dark:text-[var(--text-primary)]">{providerHealth}</h2>
          <p className="mt-1 truncate text-xs text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
            Recent failure: {recentFailure}
          </p>
        </SurfaceCard>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard icon={FolderKanban} label="Projects" value={projects.length} color="blue" onClick={() => navigate('/projects')} />
        <StatCard icon={CheckSquare} label="Tasks" value={tasks.length} color="emerald" onClick={() => navigate('/projects')} />
        <StatCard icon={Wand2} label="Prompts" value={prompts.length} color="purple" onClick={() => navigate('/prompts')} />
        <StatCard icon={Shield} label="Safety checks" value={riskCount} color="amber" onClick={() => navigate('/safety')} />
        <StatCard icon={Brain} label="Memories" value={memories.length} color="pink" onClick={() => navigate('/memory')} />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
        {quickActions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => navigate(action.route)}
            className="focus-ring flex min-h-[76px] items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-left  transition-colors hover:bg-[var(--surface-hover)] dark:hover:bg-[var(--surface-hover)]"
          >
            <action.icon className={`h-5 w-5 shrink-0 ${action.tone}`} />
            <span className="min-w-0 text-sm font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">{action.label}</span>
          </button>
        ))}
      </div>

      <SurfaceCard className="p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">Nexus path</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
              A practical route from first idea to recoverable agent handoff.
            </p>
          </div>
          <span className="text-xs font-medium text-[var(--text-muted)] dark:text-[var(--text-muted)]">Local data, explicit handoffs, safer execution</span>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {firstRunSteps.map((step) => (
            <button
              key={step.label}
              type="button"
              onClick={() => navigate(step.route)}
              className="focus-ring min-h-[176px] rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-left transition-colors hover:bg-[var(--surface-hover)] dark:bg-[var(--surface-muted)] dark:hover:bg-[var(--surface-hover)]"
            >
              <div className="flex items-center justify-between">
                <step.icon className="h-5 w-5 text-accent-500" />
                {step.done ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-[var(--text-muted)]" />}
              </div>
              <div className="mt-4 text-[11px] font-semibold uppercase text-[var(--text-muted)] dark:text-[var(--text-muted)]">{step.label}</div>
              <h3 className="mt-1 text-sm font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">{step.title}</h3>
              <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">{step.body}</p>
            </button>
          ))}
        </div>
      </SurfaceCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SurfaceCard className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">
              <FolderKanban className="h-4 w-4 text-blue-500" />
              Recent projects
            </h2>
            <button type="button" onClick={() => navigate('/projects')} className="text-xs font-semibold text-accent-600 dark:text-accent-300">
              View all
            </button>
          </div>
          {recentProjects.length > 0 ? (
            <div className="space-y-2">
              {recentProjects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="focus-ring w-full rounded-lg border border-transparent bg-[var(--surface-muted)] p-3 text-left transition-colors hover:border-[var(--border)] hover:bg-[var(--surface-hover)] dark:bg-[var(--surface-muted)] dark:hover:bg-[var(--surface-hover)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-sm font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">{project.name}</span>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusClass[project.status] || statusClass.done}`}>
                      {statusLabel[project.status] || project.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">{truncate(project.idea, 96)}</p>
                  <p className="mt-2 text-[11px] text-[var(--text-muted)] dark:text-[var(--text-muted)]">{formatRelativeDate(project.updatedAt)}</p>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState icon={FolderKanban} title="No projects yet" description="Create a project to start building a recoverable AI workflow." actionLabel="Create project" onAction={() => navigate('/projects')} />
          )}
        </SurfaceCard>

        <SurfaceCard className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">
              <Wand2 className="h-4 w-4 text-violet-500" />
              Recent prompts
            </h2>
            <button type="button" onClick={() => navigate('/prompts')} className="text-xs font-semibold text-accent-600 dark:text-accent-300">
              Open Lab
            </button>
          </div>
          {recentPrompts.length > 0 ? (
            <div className="space-y-2">
              {recentPrompts.map((prompt) => (
                <button
                  key={prompt.id}
                  type="button"
                  onClick={() => navigate('/prompts')}
                  className="focus-ring flex w-full items-center gap-3 rounded-lg border border-transparent bg-[var(--surface-muted)] p-3 text-left transition-colors hover:border-[var(--border)] hover:bg-[var(--surface-hover)] dark:bg-[var(--surface-muted)] dark:hover:bg-[var(--surface-hover)]"
                >
                  <Database className="h-4 w-4 shrink-0 text-violet-500" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">{prompt.name || prompt.title || 'Untitled prompt'}</div>
                    <div className="mt-0.5 truncate text-xs text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">{truncate(prompt.content, 84)}</div>
                  </div>
                  {(prompt.starred || prompt.favorite) && <Sparkles className="h-4 w-4 shrink-0 text-amber-500" />}
                </button>
              ))}
            </div>
          ) : (
            <EmptyState icon={Wand2} title="No saved prompts yet" description="Use Prompt Lab to turn tasks into reusable agent handoffs." actionLabel="Open Prompt Lab" onAction={() => navigate('/prompts')} />
          )}
        </SurfaceCard>
      </div>

      <p className="pb-2 text-center text-xs text-[var(--text-muted)] dark:text-[var(--text-muted)]">
        LocalAI Nexus {apiAvailable ? '' : '- demo mode'}
      </p>
    </div>
  );
}
