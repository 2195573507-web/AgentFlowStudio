import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FolderKanban,
  Calendar,
  Layers,
  Monitor,
  Globe,
  Terminal,
  Smartphone,
  Cpu,
  Sparkles,
  Download,
  Brain,
  Copy,
  Check,
  Code2,
  FileText,
  GitBranch,
  TestTube,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Lightbulb,
  Wand2,
  CpuIcon,
} from 'lucide-react';
import { api } from '../lib/api';
import { generateProjectPlan } from '../lib/planner';
import { injectMemoryIntoPrompt, generateSharedMemoryContext } from '../lib/memoryInjection';
import { exportProjectPlanToMarkdown } from '../lib/exporters';
import { GlassCard, Badge, Button, EmptyState, TaskBoard, EmptyState as EmptyStateComp } from '../components/';
import type {
  Project, ProjectPlan, Task, Memory, MemoryInjectionMode, MemoryType,
} from '../lib/types';
import { formatDate, formatRelativeDate, copyToClipboard, classNames } from '../lib/utils';

// ── Demo project ───────────────────────────────────────────────────────────
const DEMO_PROJECT: Project = {
  id: 'demo-1',
  name: 'AI Chat Assistant',
  idea: 'A cross-platform AI chat app with memory persistence and multi-provider support. Users can switch between OpenAI, Anthropic, and local models seamlessly.',
  platform: 'Desktop',
  techStack: 'Electron, React 18, TypeScript, Tailwind CSS, SQLite, Better-sqlite3',
  uiStyle: 'Glassmorphism / Apple Liquid Glass',
  difficulty: 'Medium',
  status: 'active',
  createdAt: new Date(Date.now() - 7 * 864e5).toISOString(),
  updatedAt: new Date().toISOString(),
};

const DEMO_PLAN: ProjectPlan = {
  title: 'AI Chat Assistant',
  summary: 'AI Chat Assistant is a desktop AI chat app with multi-provider support, persistent memory, and a glass desktop interface.',
  overview: `## 项目简介

AI Chat Assistant 是一款跨平台的桌面聊天应用，支持多种 AI 模型提供商，并具备持久化记忆功能。用户可以无缝切换 OpenAI、Anthropic 及本地模型。

### 核心功能
- 多模型支持（OpenAI、Anthropic、本地模型）
- 对话记忆持久化（SQLite）
- 流式响应显示
- 暗色/亮色主题切换
- Prompt 模板管理`,
  prd: `## PRD — 产品需求文档

### 目标用户
- 开发者、研究者、需要 AI 辅助的普通用户

### 用户故事
1. 作为用户，我可以选择不同的 AI 模型进行对话
2. 作为用户，我可以保存和搜索历史对话
3. 作为用户，我可以创建和管理 Prompt 模板
4. 作为用户，我可以在对话中引用之前的记忆`,
  architecture: `## 技术架构

### 前端
- Electron 主进程 + 渲染进程
- React 18 + TypeScript
- Tailwind CSS — Apple Liquid Glass 风格
- ECharts 图表
- React Router v6

### 后端/数据层
- SQLite（Better-sqlite3）
- IPC 通信（contextBridge）
- 流式 HTTP 客户端（fetch API）

### 数据流
\`\`\`
User Input → React Component → IPC → Main Process → AI API
                                  ↓
                              SQLite (Memory/Chat Storage)
\`\`\``,
  directoryStructure: `## 目录结构

\`\`\`
ai-chat-assistant/
├── src/
│   ├── main/           # Electron 主进程
│   │   ├── ipc/        # IPC 处理器
│   │   ├── db/         # SQLite 数据库
│   │   └── ai/         # AI Provider 客户端
│   ├── renderer/       # React 渲染进程
│   │   ├── components/ # 通用组件
│   │   ├── routes/     # 路由页面
│   │   ├── lib/        # 工具库
│   │   └── hooks/      # 自定义 Hooks
│   └── shared/         # 共享类型
├── resources/          # 应用资源
├── package.json
└── electron-builder.yml
\`\`\``,
  tasks: [
    { id: 't1', projectId: 'demo-1', title: '初始化 Electron 项目结构', description: '搭建 Electron + React + TypeScript 基础架构', status: 'done', priority: 'high', assignee: 'Dev', createdAt: new Date(Date.now() - 7 * 864e5).toISOString(), updatedAt: new Date(Date.now() - 6 * 864e5).toISOString() },
    { id: 't2', projectId: 'demo-1', title: '实现 SQLite 数据库层', description: '使用 better-sqlite3 实现对话和记忆的 CRUD', status: 'done', priority: 'high', assignee: 'Dev', createdAt: new Date(Date.now() - 6 * 864e5).toISOString(), updatedAt: new Date(Date.now() - 4 * 864e5).toISOString() },
    { id: 't3', projectId: 'demo-1', title: '实现 AI Provider 抽象层', description: '统一的 API 调用接口支持 OpenAI 和 Anthropic', status: 'in_progress', priority: 'high', assignee: 'Dev', createdAt: new Date(Date.now() - 5 * 864e5).toISOString(), updatedAt: new Date(Date.now() - 1 * 864e5).toISOString() },
    { id: 't4', projectId: 'demo-1', title: '设计聊天界面', description: '实现流式消息显示、用户头像、Glass 风格卡片', status: 'in_progress', priority: 'medium', assignee: 'Designer', createdAt: new Date(Date.now() - 4 * 864e5).toISOString(), updatedAt: new Date(Date.now() - 1 * 864e5).toISOString() },
    { id: 't5', projectId: 'demo-1', title: '实现 Prompt 模板系统', description: '支持变量替换和模板保存', status: 'todo', priority: 'medium', assignee: 'Dev', createdAt: new Date(Date.now() - 3 * 864e5).toISOString(), updatedAt: new Date(Date.now() - 3 * 864e5).toISOString() },
    { id: 't6', projectId: 'demo-1', title: '实现记忆注入系统', description: '在对话上下文中注入相关记忆', status: 'todo', priority: 'low', assignee: 'Dev', createdAt: new Date(Date.now() - 2 * 864e5).toISOString(), updatedAt: new Date(Date.now() - 2 * 864e5).toISOString() },
    { id: 't7', projectId: 'demo-1', title: '暗色/亮色主题切换', description: '支持跟随系统主题', status: 'todo', priority: 'low', assignee: 'Designer', createdAt: new Date(Date.now() - 1 * 864e5).toISOString(), updatedAt: new Date(Date.now() - 1 * 864e5).toISOString() },
  ],
  testPlan: `## 测试计划

### 单元测试
- IPC 处理器单元测试（Jest）
- AI Provider 客户端 Mock 测试
- 数据库 CRUD 操作测试

### 集成测试
- React 组件渲染测试（Testing Library）
- IPC 通信端到端测试
- SQLite 内存数据库测试

### UI 测试
- 多窗口切换测试
- 主题切换测试
- 响应式布局测试`,
  acceptanceCriteria: `## 验收标准

1. ✅ 用户可以创建新对话并选择 AI 模型
2. ✅ 流式响应在 200ms 内开始显示
3. ✅ 对话历史可搜索且结果在 500ms 内返回
4. ✅ Prompt 模板支持变量替换
5. ✅ 记忆在对话中自动注入
6. ✅ 暗色/亮色主题切换流畅
7. ✅ 应用打包为 Windows/macOS/Linux 安装包`,
  claudeCodePrompt: `# Claude Code Development Prompt

You are building a cross-platform AI chat desktop application using Electron + React 18 + TypeScript + Tailwind CSS.

## Project: AI Chat Assistant

### Setup
1. Initialize Electron project with \`npm create electron-app@latest\`
2. Add React 18, TypeScript, Tailwind CSS
3. Install better-sqlite3 for persistence

### Key Architecture Decisions
- Use contextBridge for secure IPC
- SQLite for chat history and memory storage
- Factory pattern for AI provider clients
- Observer pattern for streaming responses

### Development Steps
1. Set up Electron main process with IPC handlers
2. Create React renderer with chat UI
3. Implement streaming response handler
4. Add memory injection into chat context
5. Build prompt template system

### Code Style
- TypeScript strict mode
- Functional components with hooks
- Tailwind utility-first CSS
- Glassmorphism design system`,
  devPrompt: `# Claude Code Development Prompt

Continue the AI Chat Assistant desktop app using Electron, React, TypeScript, Tailwind CSS, secure IPC, and local persistence. Preserve the existing architecture and focus on provider switching, memory injection, prompt templates, tests, and production packaging.`,
  codexPrompt: `# Codex Optimization Prompt

Optimize the AI Chat Assistant for Codex CLI usage:

## Agent Instructions
- Use Codex to manage the full development lifecycle
- Each feature is a codex task with acceptance criteria
- Use shared memory to persist architectural decisions
- Codex should read and write files directly

## Project Structure
Electron app with React frontend and SQLite backend.

## Optimization Points
1. Minimize Webpack/Vite config — use defaults
2. Prefer IPC over HTTP for internal communication
3. Use better-sqlite3 synchronously (it's fast enough)
4. Bundle all assets in ASAR for production

## Testing Strategy
- Unit tests: Jest + Testing Library
- E2E: Playwright for Electron`,
  cursorPrompt: `# Cursor Development Prompt

Build a cross-platform AI chat desktop app with Electron, React 18, TypeScript, and Tailwind CSS.

## Tech Stack
- Electron (main + renderer)
- React 18 with TypeScript
- Tailwind CSS (Apple Liquid Glass design)
- SQLite via better-sqlite3
- ECharts for analytics

## File Structure
\`\`\`
src/
├── main/          # Electron main process
├── renderer/      # React UI
└── shared/        # Types
\`\`\`

## Key Files to Create
1. \`src/main/index.ts\` — Electron entry
2. \`src/main/ipc/handlers.ts\` — IPC handlers
3. \`src/main/db/database.ts\` — SQLite setup
4. \`src/renderer/App.tsx\` — React root
5. \`src/renderer/components/ChatWindow.tsx\` — Main chat UI

## Design System
- Glassmorphism cards: \`backdrop-blur-xl bg-white/10\`
- Soft shadows: \`shadow-lg shadow-black/10\`
- Colors: Indigo primary, Emerald success, Amber warning`,
};
DEMO_PLAN.summary = DEMO_PLAN.summary ?? DEMO_PLAN.overview ?? '';
DEMO_PLAN.devPrompt = DEMO_PLAN.devPrompt ?? DEMO_PLAN.claudeCodePrompt ?? '';

// ── Platform config ────────────────────────────────────────────────────────
const PLATFORM_ICONS: Record<string, React.ComponentType<any>> = {
  Web: Globe, Desktop: Monitor, CLI: Terminal, Mobile: Smartphone, Embedded: Cpu,
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: '进行中', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  planning: { label: '规划中', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  paused: { label: '已暂停', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  done: { label: '已完成', color: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30' },
};

// ── Component ──────────────────────────────────────────────────────────────
export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [plan, setPlan] = useState<ProjectPlan | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [injectionMode, setInjectionMode] = useState<MemoryInjectionMode>('off');
  const [generatedPrompt, setGeneratedPrompt] = useState<Record<string, string>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [apiAvailable, setApiAvailable] = useState(true);
  const [memoryGenStatus, setMemoryGenStatus] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchProject = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      let proj: Project | null | undefined;
      let taskList: Task[] = [];
      let memList: Memory[] = [];

      if (api && typeof api.projects?.get === 'function') {
        proj = await api.projects.get(id);
        if (api.tasks?.listByProject) {
          taskList = await api.tasks.listByProject(id);
        }
        if (api.memory?.listByProject) {
          memList = await api.memory.listByProject(id);
        }
      } else {
        // Demo fallback
        setApiAvailable(false);
        proj = DEMO_PROJECT.id === id ? DEMO_PROJECT : undefined;
        taskList = DEMO_PLAN.tasks.filter((t) => t.projectId === id);
        memList = [];
      }

      if (!proj) {
        setProject(null);
        setLoading(false);
        return;
      }

      setProject(proj);
      setTasks(Array.isArray(taskList) ? taskList : DEMO_PLAN.tasks);
      setMemories(Array.isArray(memList) ? memList : []);

      // If demo, show plan
      if (!api || typeof api.projects?.get !== 'function') {
        setPlan(id === 'demo-1' ? DEMO_PLAN : null);
      }
    } catch (err: any) {
      console.error('ProjectDetail fetch error:', err);
      setError(err?.message || '加载项目失败');
      // Fallback to demo
      if (id === 'demo-1') {
        setProject(DEMO_PROJECT);
        setPlan(DEMO_PLAN);
        setTasks(DEMO_PLAN.tasks);
        setApiAvailable(false);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  // ── Generate plan ──────────────────────────────────────────────────────
  const handleGeneratePlan = async () => {
    if (!project) return;
    setGenerating(true);
    try {
      const generated = generateProjectPlan(project);
      setPlan(generated);
    } catch (err: any) {
      console.error('Generate plan error:', err);
    } finally {
      setGenerating(false);
    }
  };

  // ── Export markdown ────────────────────────────────────────────────────
  const handleExport = () => {
    if (!plan) return;
    const md = exportProjectPlanToMarkdown(plan);
    if (api && typeof api.export?.exportMarkdown === 'function') {
      api.export.exportMarkdown(md, `${project?.name || 'project'}_plan.md`);
    } else {
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project?.name || 'project'}_plan.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // ── Create memory ──────────────────────────────────────────────────────
  const handleCreateMemory = async () => {
    if (!project || !plan) return;
    try {
      const memory: Omit<Memory, 'id'> & { id?: string } = {
        type: 'decision' as MemoryType,
        title: `${project.name} — 项目规划`,
        content: `项目 ${project.name} 的完整规划已生成。技术栈: ${project.techStack}。平台: ${project.platform}。`,
        tags: ['project-plan', 'auto-generated'],
        importance: 4,
        status: 'active',
        projectId: project.id,
        lastUsedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (api && typeof api.memory?.create === 'function') {
        await api.memory.create(memory);
      }
      setMemoryGenStatus('记忆已创建');
      setTimeout(() => setMemoryGenStatus(null), 2000);
    } catch (err: any) {
      setMemoryGenStatus('创建失败');
      setTimeout(() => setMemoryGenStatus(null), 2000);
    }
  };

  // ── Generate prompts with memory injection ─────────────────────────────
  const handleGeneratePrompts = useCallback(async () => {
    if (!plan) return;
    const prompts: Record<string, string> = {
      claudeCode: plan.claudeCodePrompt || '',
      codex: plan.codexPrompt || '',
      cursor: plan.cursorPrompt || '',
    };

    if (injectionMode !== 'off') {
      try {
        let context = '';
        if (api && typeof generateSharedMemoryContext === 'function') {
          context = await generateSharedMemoryContext(project?.id, injectionMode);
        }
        for (const key of Object.keys(prompts)) {
          const injected = await injectMemoryIntoPrompt(prompts[key], context, injectionMode);
          prompts[key] = injected;
        }
      } catch {
        // If memory injection fails, use original prompts
      }
    }

    setGeneratedPrompt(prompts);
  }, [plan, injectionMode, project?.id]);

  // ── Copy to clipboard ──────────────────────────────────────────────────
  const handleCopy = async (text: string, key: string) => {
    await copyToClipboard(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6 animate-pulse">
        <div className="h-8 w-32 rounded-lg bg-white/5" />
        <div className="h-16 rounded-2xl bg-white/5 border border-white/10" />
        <div className="h-10 w-80 rounded-xl bg-white/5" />
        <div className="h-96 rounded-2xl bg-white/5 border border-white/10" />
      </div>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────
  if (!project) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <GlassCard className="p-16 text-center">
          <div className="text-6xl mb-4 font-bold text-zinc-700">404</div>
          <h2 className="text-xl font-semibold text-zinc-300 mb-2">项目未找到</h2>
          <p className="text-zinc-500 mb-6">
            项目 <code className="text-zinc-400 bg-white/5 px-2 py-0.5 rounded">{id}</code> 不存在或已被删除。
          </p>
          <Button onClick={() => navigate('/projects')} icon={<ArrowLeft className="w-4 h-4" />}>
            返回项目列表
          </Button>
        </GlassCard>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────
  if (error && !project) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <GlassCard className="p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-zinc-100 mb-2">加载失败</h2>
          <p className="text-zinc-400 mb-4">{error}</p>
          <div className="flex justify-center gap-3">
            <Button onClick={fetchProject} icon={<RefreshCw className="w-4 h-4" />}>重试</Button>
            <Button variant="ghost" onClick={() => navigate('/projects')}>返回列表</Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  const PlatformIcon = PLATFORM_ICONS[project.platform] || Cpu;
  const statusInfo = STATUS_MAP[project.status] || { label: project.status, color: 'bg-zinc-500/20' };

  // ── Tabs ───────────────────────────────────────────────────────────────
  const tabs = [
    { key: 'overview', label: '项目简介 & PRD', icon: FileText },
    { key: 'architecture', label: '技术架构', icon: Layers },
    { key: 'structure', label: '目录结构', icon: GitBranch },
    { key: 'tasks', label: '任务看板', icon: CheckCircle },
    { key: 'tests', label: '测试计划', icon: TestTube },
    { key: 'acceptance', label: '验收标准', icon: CheckCircle },
    { key: 'prompt-claude', label: 'Claude Code Prompt', icon: Code2 },
    { key: 'prompt-codex', label: 'Codex Prompt', icon: Code2 },
    { key: 'prompt-cursor', label: 'Cursor Prompt', icon: Code2 },
  ];

  const tabContent: Record<string, string | undefined> = plan ? {
    overview: plan.overview + '\n\n' + (plan.prd || ''),
    architecture: plan.architecture || '',
    structure: plan.directoryStructure || '',
    tests: plan.testPlan || '',
    acceptance: plan.acceptanceCriteria || '',
    'prompt-claude': generatedPrompt.claudeCode || plan.claudeCodePrompt || '',
    'prompt-codex': generatedPrompt.codex || plan.codexPrompt || '',
    'prompt-cursor': generatedPrompt.cursor || plan.cursorPrompt || '',
  } : {};

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/projects')}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> 返回项目列表
      </button>

      {/* Header */}
      <GlassCard className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center flex-shrink-0">
              <PlatformIcon className="w-6 h-6 text-blue-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-zinc-100 truncate">{project.name}</h1>
                <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">{project.platform}</Badge>
              </div>
              <p className="text-sm text-zinc-400 mt-1">{project.idea}</p>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-zinc-500">
                {project.techStack && (
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3" /> {project.techStack}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {formatDate(project.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleGeneratePlan}
              loading={generating}
              icon={<Sparkles className="w-4 h-4" />}
            >
              生成规划
            </Button>
            {plan && (
              <>
                <Button variant="ghost" onClick={handleExport} icon={<Download className="w-4 h-4" />}>
                  导出 Markdown
                </Button>
                <Button variant="ghost" onClick={handleCreateMemory} icon={<Brain className="w-4 h-4" />}>
                  创建记忆
                </Button>
              </>
            )}
            {memoryGenStatus && (
              <span className="text-xs text-emerald-400 animate-in fade-in">
                {memoryGenStatus}
              </span>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Memory injection mode selector */}
      {plan && (
        <GlassCard className="p-4 flex items-center gap-4">
          <span className="text-sm text-zinc-400 flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-pink-400" />
            记忆注入模式:
          </span>
          <div className="flex gap-1">
            {(['off', 'minimal', 'balanced', 'full'] as MemoryInjectionMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setInjectionMode(mode)}
                className={classNames(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  injectionMode === mode
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                )}
              >
                {{ off: '关闭', minimal: '最少', balanced: '均衡', full: '完整' }[mode]}
              </button>
            ))}
          </div>
          <button
            onClick={handleGeneratePrompts}
            className="ml-auto px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-colors"
          >
            重新生成 Prompts
          </button>
        </GlassCard>
      )}

      {/* Tab Navigation */}
      {plan && (
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={classNames(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0',
                activeTab === tab.key
                  ? 'bg-white/10 text-zinc-200'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab Content */}
      {plan ? (
        <GlassCard className="p-6">
          {activeTab === 'tasks' ? (
            <div>
              <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> 任务看板
              </h3>
              <TaskBoard tasks={tasks} projectId={project.id} />
            </div>
          ) : activeTab.startsWith('prompt-') ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-purple-400" />
                  {tabs.find((t) => t.key === activeTab)?.label}
                  {injectionMode !== 'off' && (
                    <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/30">
                      + 记忆注入 ({injectionMode})
                    </Badge>
                  )}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(tabContent[activeTab] || '', activeTab)}
                  icon={copiedKey === activeTab ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                >
                  {copiedKey === activeTab ? '已复制' : '复制'}
                </Button>
              </div>
              <pre className="text-xs text-zinc-300 bg-zinc-900/50 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed border border-white/5 max-h-[60vh] overflow-y-auto">
                {tabContent[activeTab] || '点击上方的"重新生成 Prompts"以生成带有记忆注入的 Prompt。'}
              </pre>
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                {(() => {
                  const Icon = tabs.find((t) => t.key === activeTab)?.icon
                  return Icon ? <Icon className="w-4 h-4 text-blue-400" /> : null
                })()}
                {tabs.find((t) => t.key === activeTab)?.label}
              </h3>
              <div className="prose prose-invert prose-sm max-w-none text-zinc-300 whitespace-pre-wrap font-mono text-xs leading-relaxed bg-zinc-900/30 rounded-xl p-4 max-h-[60vh] overflow-y-auto">
                {tabContent[activeTab] || '暂无内容。点击"生成规划"以创建项目规划。'}
              </div>
            </div>
          )}
        </GlassCard>
      ) : (
        <GlassCard className="p-12 text-center">
          <Lightbulb className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-zinc-300 mb-2">尚未生成项目规划</h2>
          <p className="text-sm text-zinc-500 mb-4 max-w-md mx-auto">
            点击上方的"生成规划"按钮，AI 将根据项目信息自动生成完整的技术规划，
            包括架构设计、目录结构、任务看板和开发 Prompt。
          </p>
          <Button onClick={handleGeneratePlan} loading={generating} icon={<Sparkles className="w-4 h-4" />}>
            生成规划
          </Button>
        </GlassCard>
      )}
    </div>
  );
}
