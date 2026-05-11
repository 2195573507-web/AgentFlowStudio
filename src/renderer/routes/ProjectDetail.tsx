import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  ClipboardList,
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
  Timer,
  Upload,
  Share2,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../lib/api';
import { generateProjectPlan } from '../lib/planner';
import { injectMemoryIntoPrompt, generateSharedMemoryContext } from '../lib/memoryInjection';
import { exportProjectPlanToMarkdown } from '../lib/exporters';
import {
  buildRunQualityChecklist,
  formatRunDuration,
  getFailedRunRetryAdvice,
  parseRunNodeTrace,
  serializeRun,
} from '../lib/runLogs';
import { SurfaceCard, Badge, Button, Input, Textarea, TaskBoard, Modal } from '../components/';
import type {
  Project, ProjectPlan, Task, Run, Memory, MemoryInjectionMode, MemoryType,
  RunNodeTrace,
} from '../lib/types';
import type { PublicUser, ResourceAcl, ResourceRole } from '../../shared/authTypes';
import { useAuth } from '../lib/auth';
import { formatDate, formatRelativeDate, copyToClipboard, classNames } from '../lib/utils';

// ── Demo project ───────────────────────────────────────────────────────────
const DEMO_PROJECT: Project = {
  id: 'demo-1',
  name: 'AI Chat Assistant',
  idea: 'A cross-platform AI chat app with memory persistence and multi-provider support. Users can switch between OpenAI, Anthropic, and local models seamlessly.',
  platform: 'Desktop',
  techStack: 'Electron, React 18, TypeScript, Tailwind CSS, SQLite, Better-sqlite3',
  uiStyle: 'Flat desktop tool UI',
  difficulty: 'Medium',
  status: 'active',
  createdAt: new Date(Date.now() - 7 * 864e5).toISOString(),
  updatedAt: new Date().toISOString(),
};

const DEMO_PLAN: ProjectPlan = {
  title: 'AI Chat Assistant',
  summary: 'AI Chat Assistant is a desktop AI chat app with multi-provider support, persistent memory, and a flat desktop interface.',
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
- Tailwind CSS — Apple Flat UI 风格
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
    { id: 't4', projectId: 'demo-1', title: '设计聊天界面', description: '实现流式消息显示、用户头像、flat surface 风格卡片', status: 'in_progress', priority: 'medium', assignee: 'Designer', createdAt: new Date(Date.now() - 4 * 864e5).toISOString(), updatedAt: new Date(Date.now() - 1 * 864e5).toISOString() },
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
- Flat surface design system`,
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
- Tailwind CSS (Apple Flat UI design)
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
- Flat surface cards: \` bg-[var(--surface-muted)]\`
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
  done: { label: '已完成', color: 'bg-[var(--surface-muted)] text-[var(--text-secondary)] border-[var(--border)]' },
};

const RUN_TOOL_OPTIONS = ['Codex', 'Claude Code', 'Cursor', 'ChatGPT', 'Other'];

const RUN_STATUS_OPTIONS = [
  { value: 'planned', label: '待执行', variant: 'default' as const },
  { value: 'running', label: '执行中', variant: 'info' as const },
  { value: 'success', label: '已完成', variant: 'success' as const },
  { value: 'failed', label: '失败', variant: 'danger' as const },
  { value: 'blocked', label: '受阻', variant: 'warning' as const },
];

const WORKFLOW_SHARE_ROLES: ResourceRole[] = ['viewer', 'editor', 'owner'];

function defaultAclForProject(project: Project): ResourceAcl {
  const ownerUserId = project.ownerUserId || project.acl?.ownerUserId || '';
  return {
    ownerUserId,
    visibility: project.acl?.visibility ?? 'private',
    entries: project.acl?.entries?.length
      ? project.acl.entries
      : ownerUserId
        ? [{ userId: ownerUserId, role: 'owner', grantedAt: project.createdAt }]
        : [],
  };
}

function getRunStatusInfo(status: string) {
  return RUN_STATUS_OPTIONS.find((item) => item.value === status) || RUN_STATUS_OPTIONS[0];
}

// ── Component ──────────────────────────────────────────────────────────────
export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [plan, setPlan] = useState<ProjectPlan | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
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
  const [runTitle, setRunTitle] = useState('下一轮 Agent 执行');
  const [runTool, setRunTool] = useState('Codex');
  const [runStatus, setRunStatus] = useState('planned');
  const [runSummary, setRunSummary] = useState('');
  const [runLog, setRunLog] = useState('');
  const [runSaveStatus, setRunSaveStatus] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUsers, setShareUsers] = useState<PublicUser[]>([]);
  const [shareAcl, setShareAcl] = useState<ResourceAcl | null>(null);
  const [shareUserId, setShareUserId] = useState('');
  const [shareRole, setShareRole] = useState<ResourceRole>('viewer');
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const navigationState = useMemo(
    () => location.state as { highlightPlan?: boolean; project?: Project } | null,
    [location.state],
  );
  const shouldHighlightPlan =
    new URLSearchParams(location.search).get('next') === 'plan' ||
    Boolean(navigationState?.highlightPlan);
  const projectAcl = project ? (shareAcl ?? defaultAclForProject(project)) : null;
  const currentAclRole = projectAcl?.entries.find((entry) => entry.userId === user?.id)?.role;
  const canManageSharing = Boolean(
    user?.role === 'admin' ||
      currentAclRole === 'owner' ||
      project?.ownerUserId === user?.id ||
      project?.acl?.ownerUserId === user?.id,
  );

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchProject = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      let proj: Project | null | undefined;
      let taskList: Task[] = [];
      let runList: Run[] = [];
      let memList: Memory[] = [];

      if (api && typeof api.projects?.get === 'function') {
        proj = await api.projects.get(id);
        if (!proj && navigationState?.project?.id === id) {
          proj = navigationState.project;
        }
        if (api.tasks?.listByProject) {
          taskList = await api.tasks.listByProject(id);
        }
        if (api.runs?.list) {
          runList = await api.runs.list(id);
        }
        if (api.memory?.listByProject) {
          memList = await api.memory.listByProject(id);
        }
      } else {
        // Demo fallback
        setApiAvailable(false);
        proj =
          navigationState?.project?.id === id
            ? navigationState.project
            : DEMO_PROJECT.id === id
              ? DEMO_PROJECT
              : undefined;
        taskList = DEMO_PLAN.tasks.filter((t) => t.projectId === id);
        runList = [];
        memList = [];
      }

      if (!proj) {
        setProject(null);
        setLoading(false);
        return;
      }

      setProject(proj);
      setPlan(null);
      setTasks(Array.isArray(taskList) ? taskList : DEMO_PLAN.tasks);
      setRuns(Array.isArray(runList) ? runList : []);
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
        setRuns([]);
        setApiAvailable(false);
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigationState]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  const loadSharing = useCallback(async () => {
    if (!id || !project) return;
    setShareStatus(null);
    const [aclResult, usersResult] = await Promise.all([
      api.projects.getAcl(id),
      api.users.directory(),
    ]);
    if (aclResult && typeof aclResult === 'object' && 'error' in aclResult) {
      setShareStatus(String(aclResult.error));
    } else {
      setShareAcl(aclResult.acl);
    }
    if (Array.isArray(usersResult)) setShareUsers(usersResult.filter((item) => item.status === 'active'));
  }, [id, project]);

  const openShareModal = async () => {
    setShowShareModal(true);
    await loadSharing();
  };

  const saveAcl = async (nextAcl: ResourceAcl) => {
    if (!project) return;
    setShareStatus('Saving access changes...');
    const result = await api.projects.updateAcl(project.id, nextAcl);
    if (result && typeof result === 'object' && 'error' in result) {
      setShareStatus(String(result.error));
      return;
    }
    setProject(result as Project);
    setShareAcl((result as Project).acl ?? nextAcl);
    setShareStatus('Access updated.');
  };

  const addShareMember = async () => {
    if (!projectAcl || !shareUserId) return;
    const now = new Date().toISOString();
    const entries = projectAcl.entries.filter((entry) => entry.userId !== shareUserId);
    await saveAcl({
      ...projectAcl,
      visibility: 'shared',
      entries: [...entries, { userId: shareUserId, role: shareRole, grantedBy: user?.id, grantedAt: now }],
    });
    setShareUserId('');
    setShareRole('viewer');
  };

  const updateShareRole = async (memberUserId: string, role: ResourceRole) => {
    if (!projectAcl) return;
    await saveAcl({
      ...projectAcl,
      entries: projectAcl.entries.map((entry) => entry.userId === memberUserId ? { ...entry, role } : entry),
    });
  };

  const removeShareMember = async (memberUserId: string) => {
    if (!projectAcl) return;
    const entries = projectAcl.entries.filter((entry) => entry.userId !== memberUserId);
    await saveAcl({
      ...projectAcl,
      visibility: entries.length > 1 ? 'shared' : 'private',
      entries,
    });
  };

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

  // ── Record agent run ────────────────────────────────────────────────────
  const handleCreateRun = async () => {
    if (!project) return;
    const title = runTitle.trim();
    if (!title) {
      setRunSaveStatus('请先填写执行标题');
      setTimeout(() => setRunSaveStatus(null), 2200);
      return;
    }

    const createdAt = new Date().toISOString();
    const nodeTrace = parseRunNodeTrace(runLog.trim() || runSummary.trim(), runStatus);
    const durationMs = nodeTrace.reduce((sum, node) => sum + (node.durationMs ?? 0), 0);
    const retryCount = nodeTrace.reduce((sum, node) => sum + (node.retryCount ?? 0), 0);
    const payload: Omit<Run, 'id'> = {
      projectId: project.id,
      title,
      tool: runTool,
      status: runStatus,
      summary: runSummary.trim(),
      log: runLog.trim(),
      startedAt: createdAt,
      endedAt: runStatus === 'running' || runStatus === 'planned' ? undefined : createdAt,
      durationMs,
      retryCount,
      error: runStatus === 'failed' || runStatus === 'blocked' ? runSummary.trim() || runLog.trim() : undefined,
      nodeTrace,
      metadata: {
        source: 'manual-agent-run-panel',
        guidance: 'local-only record; no command execution',
      },
      createdAt,
    };

    try {
      const created = await api.runs.create(payload);
      const normalized: Run = {
        ...payload,
        ...created,
        id: created.id || `local-${Date.now()}`,
      };
      setRuns((current) => [normalized, ...current.filter((run) => run.id !== normalized.id)]);
      setRunTitle('下一轮 Agent 执行');
      setRunTool('Codex');
      setRunStatus('planned');
      setRunSummary('');
      setRunLog('');
      setRunSaveStatus('执行记录已保存');
    } catch (err: any) {
      console.error('Create run record error:', err);
      setRunSaveStatus(err?.message || '保存失败，请稍后重试');
    } finally {
      setTimeout(() => setRunSaveStatus(null), 2400);
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
        const scopedMemories = memories.filter(
          (memory) => !project?.id || memory.projectId === project.id || !memory.projectId,
        );
        const context = generateSharedMemoryContext(scopedMemories, injectionMode);
        for (const key of Object.keys(prompts)) {
          const injected = injectMemoryIntoPrompt(prompts[key], context, injectionMode);
          prompts[key] = injected;
        }
      } catch (err) {
        console.error('Project prompt memory injection failed:', err);
        // If memory injection fails, use original prompts
      }
    }

    setGeneratedPrompt(prompts);
  }, [plan, injectionMode, project?.id, memories]);

  // ── Copy to clipboard ──────────────────────────────────────────────────
  const handleCopy = async (text: string, key: string) => {
    await copyToClipboard(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyRun = async (run: Run) => {
    await copyToClipboard(serializeRun(run));
    setCopiedKey(`run-${run.id}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleExportRun = (run: Run) => {
    const content = serializeRun(run);
    const filename = `${run.title.replace(/[\\/:*?"<>|]+/g, '-').slice(0, 60) || 'agent-run'}.md`;
    if (api && typeof api.export?.exportMarkdown === 'function') {
      api.export.exportMarkdown(content, filename);
      return;
    }
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6 animate-pulse">
        <div className="h-8 w-32 rounded-lg bg-[var(--surface-muted)]" />
        <div className="h-16 rounded-panel bg-[var(--surface-muted)] border border-[var(--border)]" />
        <div className="h-10 w-80 rounded-panel bg-[var(--surface-muted)]" />
        <div className="h-96 rounded-panel bg-[var(--surface-muted)] border border-[var(--border)]" />
      </div>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────
  if (!project) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <SurfaceCard className="p-16 text-center">
          <div className="text-6xl mb-4 font-bold text-[var(--text-muted)]">404</div>
          <h2 className="text-xl font-semibold text-[var(--text-secondary)] mb-2">项目未找到</h2>
          <p className="text-[var(--text-primary)]0 mb-6">
            项目 <code className="text-[var(--text-muted)] bg-[var(--surface-muted)] px-2 py-0.5 rounded">{id}</code> 不存在或已被删除。
          </p>
          <Button onClick={() => navigate('/projects')} icon={<ArrowLeft className="w-4 h-4" />}>
            返回项目列表
          </Button>
        </SurfaceCard>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────
  if (error && !project) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <SurfaceCard className="p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">加载失败</h2>
          <p className="text-[var(--text-muted)] mb-4">{error}</p>
          <div className="flex justify-center gap-3">
            <Button onClick={fetchProject} icon={<RefreshCw className="w-4 h-4" />}>重试</Button>
            <Button variant="ghost" onClick={() => navigate('/projects')}>返回列表</Button>
          </div>
        </SurfaceCard>
      </div>
    );
  }

  const PlatformIcon = PLATFORM_ICONS[project.platform] || Cpu;
  const statusInfo = STATUS_MAP[project.status] || { label: project.status, color: 'bg-[var(--surface-muted)]' };

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
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-primary)]0 hover:text-[var(--text-secondary)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> 返回项目列表
      </button>

      {/* Header */}
      <SurfaceCard className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-12 h-12 rounded-panel bg-[var(--accent-muted)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
              <PlatformIcon className="w-6 h-6 text-blue-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-[var(--text-primary)] truncate">{project.name}</h1>
                <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">{project.platform}</Badge>
              </div>
              <p className="text-sm text-[var(--text-muted)] mt-1">{project.idea}</p>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-[var(--text-primary)]0">
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
              variant="ghost"
              onClick={openShareModal}
              icon={<Share2 className="w-4 h-4" />}
            >
              Access
            </Button>
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
              <span className="text-xs text-emerald-400 animate-fade-in">
                {memoryGenStatus}
              </span>
            )}
          </div>
        </div>
      </SurfaceCard>

      <Modal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Workflow access"
        size="lg"
      >
        <div className="space-y-4">
          <div className="rounded-panel border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-accent-400" />
                <div>
                  <div className="text-sm font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">
                    {projectAcl?.visibility === 'shared' ? 'Shared workflow' : 'Private workflow'}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] dark:text-[var(--text-primary)]0">
                    IPC enforces workflow access; this panel only manages the ACL.
                  </div>
                </div>
              </div>
              <Badge variant={canManageSharing ? 'success' : 'warning'}>
                {canManageSharing ? 'Owner/Admin' : 'Read only'}
              </Badge>
            </div>
          </div>

          {canManageSharing && (
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px_auto]">
              <select
                aria-label="Share user"
                value={shareUserId}
                onChange={(event) => setShareUserId(event.target.value)}
                className="w-full rounded-panel border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] dark:text-[var(--text-primary)]"
              >
                <option value="">Select user</option>
                {shareUsers
                  .filter((item) => !projectAcl?.entries.some((entry) => entry.userId === item.id))
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.profile.displayName || item.email} ({item.email})
                    </option>
                  ))}
              </select>
              <select
                aria-label="Share role"
                value={shareRole}
                onChange={(event) => setShareRole(event.target.value as ResourceRole)}
                className="w-full rounded-panel border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] dark:text-[var(--text-primary)]"
              >
                {WORKFLOW_SHARE_ROLES.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              <Button onClick={addShareMember} disabled={!shareUserId} icon={<Users className="w-4 h-4" />}>
                Add
              </Button>
            </div>
          )}

          <div className="space-y-2">
            {(projectAcl?.entries ?? []).map((entry) => {
              const member = shareUsers.find((item) => item.id === entry.userId);
              const label = member?.profile.displayName || member?.email || entry.userId;
              const isOwner = entry.userId === projectAcl?.ownerUserId || entry.role === 'owner';
              return (
                <div
                  key={entry.userId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-[var(--border)] bg-[var(--surface-muted)] p-3 dark:bg-[var(--surface-muted)]"
                >
                  <div>
                    <div className="text-sm font-medium text-[var(--text-primary)] dark:text-[var(--text-primary)]">{label}</div>
                    <div className="text-xs text-[var(--text-muted)] dark:text-[var(--text-primary)]0">{member?.email || entry.userId}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canManageSharing && !isOwner ? (
                      <select
                        aria-label={`Role for ${label}`}
                        value={entry.role}
                        onChange={(event) => updateShareRole(entry.userId, event.target.value as ResourceRole)}
                        className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--text-primary)] dark:text-[var(--text-primary)]"
                      >
                        {WORKFLOW_SHARE_ROLES.filter((role) => role !== 'owner').map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    ) : (
                      <Badge variant={isOwner ? 'success' : 'default'}>{entry.role}</Badge>
                    )}
                    {canManageSharing && !isOwner && (
                      <Button size="sm" variant="ghost" onClick={() => removeShareMember(entry.userId)}>
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {shareStatus && (
            <p className="text-xs text-[var(--text-muted)] dark:text-[var(--text-muted)]">{shareStatus}</p>
          )}
        </div>
      </Modal>

      {shouldHighlightPlan && !plan && (
        <SurfaceCard
          className="p-5 border-accent-400/50 bg-accent-500/10"
          data-testid="plan-next-step"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-panel border border-accent-400/30 bg-accent-400/15 p-2 text-accent-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">
                  下一步：生成项目规划
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)] dark:text-[var(--text-muted)]">
                  项目已创建。现在可以把想法转成 PRD、架构、任务看板和可复制给 Agent 的开发 Prompt。
                </p>
              </div>
            </div>
            <Button
              onClick={handleGeneratePlan}
              loading={generating}
              icon={<Sparkles className="w-4 h-4" />}
            >
              生成规划
            </Button>
          </div>
        </SurfaceCard>
      )}

      {/* Memory injection mode selector */}
      {plan && (
        <SurfaceCard className="p-4 flex items-center gap-4">
          <span className="text-sm text-[var(--text-muted)] flex items-center gap-1.5">
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
                    : 'text-[var(--text-primary)]0 hover:text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]'
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
        </SurfaceCard>
      )}

      {/* Agent run record */}
      <SurfaceCard className="p-6" data-testid="agent-run-panel">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-accent-400" />
              <h2 className="text-base font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">
                Agent 执行记录
              </h2>
            </div>
            <p className="text-sm text-[var(--text-secondary)] dark:text-[var(--text-muted)] mt-1 max-w-2xl">
              记录 Codex、Claude Code、Cursor 或 ChatGPT 的执行结果，便于下一轮接手。这里只保存本地日志，不会执行任何命令。
            </p>
          </div>
          <Badge variant={apiAvailable ? 'success' : 'warning'} dot>
            {apiAvailable ? '本地存储已连接' : '演示模式'}
          </Badge>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.82fr)]">
          <div className="space-y-4">
            <Input
              label="执行标题"
              value={runTitle}
              onChange={(event) => setRunTitle(event.target.value)}
              placeholder="例如：修复设置页 API 错误提示"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="run-tool" className="text-xs font-medium text-[var(--text-secondary)] dark:text-[var(--text-muted)] tracking-wide uppercase">
                  工具
                </label>
                <select
                  id="run-tool"
                  value={runTool}
                  onChange={(event) => setRunTool(event.target.value)}
                  className="w-full rounded-panel border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] shadow-[var(--shadow-sm)] outline-none  transition-all duration-200 focus:border-accent-400/70 focus:ring-2 focus:ring-accent-400/60 dark:text-[var(--text-primary)]"
                >
                  {RUN_TOOL_OPTIONS.map((tool) => (
                    <option key={tool} value={tool}>{tool}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="run-status" className="text-xs font-medium text-[var(--text-secondary)] dark:text-[var(--text-muted)] tracking-wide uppercase">
                  状态
                </label>
                <select
                  id="run-status"
                  value={runStatus}
                  onChange={(event) => setRunStatus(event.target.value)}
                  className="w-full rounded-panel border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] shadow-[var(--shadow-sm)] outline-none  transition-all duration-200 focus:border-accent-400/70 focus:ring-2 focus:ring-accent-400/60 dark:text-[var(--text-primary)]"
                >
                  {RUN_STATUS_OPTIONS.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <Textarea
              label="结果摘要"
              value={runSummary}
              onChange={(event) => setRunSummary(event.target.value)}
              placeholder="一句话说明完成内容、卡点或下一步"
              className="min-h-[92px]"
            />
            <Textarea
              label="关键日志"
              value={runLog}
              onChange={(event) => setRunLog(event.target.value)}
              placeholder="粘贴关键错误、测试结果或人工观察，不要粘贴密钥"
              className="min-h-[132px] font-mono"
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={handleCreateRun} icon={<ClipboardList className="w-4 h-4" />}>
                保存执行记录
              </Button>
              {runSaveStatus && (
                <span className="text-xs text-emerald-500 dark:text-emerald-400">
                  {runSaveStatus}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-panel border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)] ">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">
                最近执行
              </h3>
              <Badge variant="info">{runs.length} 条</Badge>
            </div>
            {runs.length ? (
              <div className="space-y-3 max-h-[430px] overflow-y-auto pr-1">
                {runs.slice(0, 6).map((run) => {
                  const status = getRunStatusInfo(run.status);
                  const nodeTrace = run.nodeTrace?.length
                    ? run.nodeTrace
                    : parseRunNodeTrace(run.log || run.summary || '', run.status);
                  return (
                    <article
                      key={run.id}
                      className="rounded-panel border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm  dark:bg-[var(--surface-muted)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="truncate text-sm font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">
                            {run.title}
                          </h4>
                          <p className="mt-1 text-xs text-[var(--text-muted)] dark:text-[var(--text-primary)]0">
                            {run.tool} · {formatRelativeDate(run.createdAt)}
                          </p>
                        </div>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-[var(--text-muted)] dark:text-[var(--text-primary)]0">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--surface-muted)] px-2 py-1 dark:bg-[var(--surface)]/40">
                          <Timer className="h-3 w-3" /> {formatRunDuration(run.durationMs)}
                        </span>
                        <span className="rounded-lg bg-[var(--surface-muted)] px-2 py-1 dark:bg-[var(--surface)]/40">
                          重试 {run.retryCount ?? 0}
                        </span>
                        <span className="rounded-lg bg-[var(--surface-muted)] px-2 py-1 dark:bg-[var(--surface)]/40">
                          {nodeTrace.length} 节点
                        </span>
                      </div>
                      {run.summary && (
                        <p className="mt-2 text-sm text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
                          {run.summary}
                        </p>
                      )}
                      <div className="mt-2 space-y-2">
                        {nodeTrace.map((node) => (
                          <div
                            key={node.id}
                            className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-2 text-xs dark:bg-[var(--surface)]/35"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-[var(--text-primary)] dark:text-[var(--text-secondary)]">{node.name}</span>
                              <span className="text-[var(--text-muted)] dark:text-[var(--text-primary)]0">
                                {node.status} · {formatRunDuration(node.durationMs)} · 重试 {node.retryCount ?? 0}
                              </span>
                            </div>
                            {(node.inputSummary || node.outputSummary || node.failureReason) && (
                              <div className="mt-1 space-y-0.5 text-[var(--text-muted)] dark:text-[var(--text-primary)]0">
                                {node.inputSummary && <p>输入：{node.inputSummary}</p>}
                                {node.outputSummary && <p>输出：{node.outputSummary}</p>}
                                {node.failureReason && <p className="text-red-500 dark:text-red-300">失败原因：{node.failureReason}</p>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {run.log && (
                        <pre className="mt-2 max-h-28 overflow-y-auto whitespace-pre-wrap rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-2 text-xs leading-relaxed text-[var(--text-primary)]">
                          {run.log}
                        </pre>
                      )}
                      <div className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2">
                        <div className="mb-1 text-[11px] font-semibold text-[var(--text-secondary)] dark:text-[var(--text-muted)]">
                          Run quality checklist
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {buildRunQualityChecklist({ ...run, nodeTrace }).map((item) => (
                            <span key={item.id} title={item.detail}>
                              <Badge
                                className={
                                  item.passed
                                    ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/25 dark:text-emerald-300'
                                    : 'bg-amber-500/15 text-amber-600 border-amber-500/25 dark:text-amber-300'
                                }
                              >
                                {item.label}
                              </Badge>
                            </span>
                          ))}
                        </div>
                        {getFailedRunRetryAdvice({ ...run, nodeTrace }).map((advice) => (
                          <p key={advice} className="mt-1 text-[11px] text-[var(--text-muted)] dark:text-[var(--text-primary)]0">
                            重试建议：{advice}
                          </p>
                        ))}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyRun(run)}
                          icon={copiedKey === `run-${run.id}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        >
                          {copiedKey === `run-${run.id}` ? '已复制' : '复制日志'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleExportRun(run)}
                          icon={<Upload className="h-3.5 w-3.5" />}
                        >
                          导出日志
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-panel border border-dashed border-[var(--border)] bg-[var(--surface-muted)] p-5 text-sm text-[var(--text-secondary)] dark:bg-[var(--surface-muted)] dark:text-[var(--text-muted)]">
                还没有执行记录。建议在每次 Agent 修改、测试或受阻后保存一条，下一轮就能直接接手。
              </div>
            )}
          </div>
        </div>
      </SurfaceCard>

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
                  ? 'bg-[var(--surface-muted)] text-[var(--text-primary)]'
                  : 'text-[var(--text-primary)]0 hover:text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]'
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
        <SurfaceCard className="p-6">
          {activeTab === 'tasks' ? (
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> 任务看板
              </h3>
              <TaskBoard tasks={tasks} projectId={project.id} />
            </div>
          ) : activeTab.startsWith('prompt-') ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] flex items-center gap-2">
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
              <pre className="text-xs text-[var(--text-secondary)] bg-[var(--surface-muted)] rounded-panel p-4 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed border border-[var(--border)] max-h-[60vh] overflow-y-auto">
                {tabContent[activeTab] || '点击上方的"重新生成 Prompts"以生成带有记忆注入的 Prompt。'}
              </pre>
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4 flex items-center gap-2">
                {(() => {
                  const Icon = tabs.find((t) => t.key === activeTab)?.icon
                  return Icon ? <Icon className="w-4 h-4 text-blue-400" /> : null
                })()}
                {tabs.find((t) => t.key === activeTab)?.label}
              </h3>
              <div className="prose prose-invert prose-sm max-w-none text-[var(--text-secondary)] whitespace-pre-wrap font-mono text-xs leading-relaxed bg-[var(--surface-muted)] rounded-panel p-4 max-h-[60vh] overflow-y-auto">
                {tabContent[activeTab] || '暂无内容。点击"生成规划"以创建项目规划。'}
              </div>
            </div>
          )}
        </SurfaceCard>
      ) : (
        <SurfaceCard className="p-12 text-center">
          <Lightbulb className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-[var(--text-secondary)] mb-2">尚未生成项目规划</h2>
          <p className="text-sm text-[var(--text-primary)]0 mb-4 max-w-md mx-auto">
            点击上方的"生成规划"按钮，AI 将根据项目信息自动生成完整的技术规划，
            包括架构设计、目录结构、任务看板和开发 Prompt。
          </p>
          <Button onClick={handleGeneratePlan} loading={generating} icon={<Sparkles className="w-4 h-4" />}>
            生成规划
          </Button>
        </SurfaceCard>
      )}
    </div>
  );
}
