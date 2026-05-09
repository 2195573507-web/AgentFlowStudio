import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  FolderKanban,
  SlidersHorizontal,
  Pencil,
  Trash2,
  Monitor,
  Globe,
  Terminal,
  Smartphone,
  Cpu,
  Layers,
  Clock,
  AlertTriangle,
  RefreshCw,
  X,
  ChevronDown,
} from 'lucide-react';
import { api } from '../lib/api';
import { GlassCard, EmptyState, Modal, Button, Input, Textarea, Badge } from '../components/';
import type { Project, ProjectStatus, Platform, Difficulty } from '../lib/types';
import { generateId, formatRelativeDate, truncate, classNames } from '../lib/utils';

// ── Demo data ──────────────────────────────────────────────────────────────
const DEMO_PROJECTS: Project[] = [
  {
    id: 'demo-1', name: 'AI 聊天助手',
    idea: '带有记忆持久化和多接口支持的跨平台 AI 聊天应用。',
    platform: 'Desktop', techStack: 'Electron, React, TypeScript, Tailwind',
    uiStyle: '玻璃拟态工作台', difficulty: 'Medium', status: 'active',
    createdAt: new Date(Date.now() - 7 * 864e5).toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-2', name: '开发工具 CLI',
    idea: '面向开发者的命令行效率工具，集成 Git、日志分析和项目恢复上下文。',
    platform: 'CLI', techStack: 'Node.js, TypeScript, Ink',
    uiStyle: '极简终端', difficulty: 'Hard', status: 'planning',
    createdAt: new Date(Date.now() - 3 * 864e5).toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-3', name: '记忆同步服务',
    idea: '在项目与 AI 接口之间同步共享记忆的本地后台服务。',
    platform: 'Web', techStack: 'Go, SQLite, gRPC',
    uiStyle: 'Linear', difficulty: 'Hard', status: 'active',
    createdAt: new Date(Date.now() - 14 * 864e5).toISOString(), updatedAt: new Date(Date.now() - 2 * 864e5).toISOString(),
  },
  {
    id: 'demo-4', name: 'Prompt 模板管理器',
    idea: '用于管理、版本化和变量注入的 Prompt 模板界面。',
    platform: 'Web', techStack: 'Next.js, Prisma, PostgreSQL',
    uiStyle: 'Raycast', difficulty: 'Easy', status: 'done',
    createdAt: new Date(Date.now() - 30 * 864e5).toISOString(), updatedAt: new Date(Date.now() - 10 * 864e5).toISOString(),
  },
  {
    id: 'demo-5', name: '安全沙盒',
    idea: '用于测试 AI 生成命令、分析风险并给出替代方案的隔离环境。',
    platform: 'Desktop', techStack: 'Tauri, Rust, React',
    uiStyle: '玻璃拟态工作台', difficulty: 'Medium', status: 'paused',
    createdAt: new Date(Date.now() - 21 * 864e5).toISOString(), updatedAt: new Date(Date.now() - 5 * 864e5).toISOString(),
  },
  {
    id: 'demo-6', name: 'API Gateway',
    idea: '统一 API 网关，包含限流、鉴权和请求转换能力。',
    platform: 'Web', techStack: 'Rust, Axum, Redis',
    uiStyle: '极简控制台', difficulty: 'Hard', status: 'planning',
    createdAt: new Date(Date.now() - 2 * 864e5).toISOString(), updatedAt: new Date().toISOString(),
  },
];

// ── Constants ──────────────────────────────────────────────────────────────
const PLATFORMS: Platform[] = ['Web', 'Desktop', 'CLI', 'Mobile', 'Embedded', 'Other'];
const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard'];
const STATUSES: { value: ProjectStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'planning', label: '规划中' },
  { value: 'active', label: '进行中' },
  { value: 'paused', label: '已暂停' },
  { value: 'done', label: '已完成' },
];

const PLATFORM_LABELS: Record<Platform, string> = {
  Web: 'Web 网页',
  Desktop: '桌面应用',
  CLI: '命令行',
  Mobile: '移动端',
  Embedded: '嵌入式',
  Other: '其他',
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  Easy: '简单',
  Medium: '中等',
  Hard: '困难',
};

// ── Icons ──────────────────────────────────────────────────────────────────
const PlatformIcon: Record<Platform, React.ComponentType<any>> = {
  Web: Globe, Desktop: Monitor, CLI: Terminal, Mobile: Smartphone, Embedded: Cpu, Other: Layers,
};

const platformColor: Record<Platform, string> = {
  Web: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Desktop: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  CLI: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
  Mobile: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  Embedded: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  Other: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
};

const statusColor: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  planning: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  paused: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  done: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
};

const difficultyColor: Record<Difficulty, string> = {
  Easy: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  Medium: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  Hard: 'bg-red-500/20 text-red-300 border-red-500/30',
};

const isProject = (value: unknown): value is Project =>
  Boolean(
    value &&
    typeof value === 'object' &&
    typeof (value as Project).id === 'string' &&
    typeof (value as Project).name === 'string' &&
    typeof (value as Project).idea === 'string',
  );

const getCreateError = (value: unknown) => {
  if (!value || typeof value !== 'object' || !('error' in value)) return null;
  const error = (value as { error?: unknown }).error;
  return typeof error === 'string' && error.trim() ? error : '创建失败';
};

// ── Component ──────────────────────────────────────────────────────────────
export default function Projects() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiAvailable, setApiAvailable] = useState(true);

  // Filters & search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');

  // Modals
  const [showNewModal, setShowNewModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form
  const [form, setForm] = useState({
    name: '', idea: '', platform: 'Web' as Platform,
    techStack: '', uiStyle: '', difficulty: 'Medium' as Difficulty,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!api || typeof api.projects?.list !== 'function') {
        setApiAvailable(false);
        setProjects(DEMO_PROJECTS);
        setLoading(false);
        return;
      }
      const data = await api.projects.list();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Projects fetch error:', err);
      setApiAvailable(false);
      setProjects(DEMO_PROJECTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  // ── Filtered projects ──────────────────────────────────────────────────
  const filtered = React.useMemo(() => {
    return projects.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q || p.name.toLowerCase().includes(q) || p.idea.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  // ── Form handler ───────────────────────────────────────────────────────
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = '项目名称不能为空';
    if (!form.idea.trim()) errors.idea = '项目描述不能为空';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const newProject: Project = {
        id: generateId(),
        name: form.name.trim(),
        idea: form.idea.trim(),
        platform: form.platform,
        techStack: form.techStack.trim(),
        uiStyle: form.uiStyle.trim(),
        difficulty: form.difficulty,
        status: 'planning',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const createdProject =
        api && typeof api.projects?.create === 'function'
          ? await api.projects.create(newProject)
          : newProject;
      const createError = getCreateError(createdProject);
      if (createError) throw new Error(createError);
      const savedProject = isProject(createdProject) ? createdProject : newProject;

      setProjects((prev) => [savedProject, ...prev]);
      resetForm();
      setShowNewModal(false);
      navigate(`/projects/${savedProject.id}?next=plan`, {
        state: { highlightPlan: true, project: savedProject },
      });
    } catch (err: any) {
      setFormErrors({ _form: err?.message || '创建失败' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingProject || !validateForm()) return;
    setSaving(true);
    try {
      const updated: Project = {
        ...editingProject,
        name: form.name.trim(),
        idea: form.idea.trim(),
        platform: form.platform,
        techStack: form.techStack.trim(),
        uiStyle: form.uiStyle.trim(),
        difficulty: form.difficulty,
        updatedAt: new Date().toISOString(),
      };

      if (api && typeof api.projects?.update === 'function') {
        await api.projects.update(updated);
      }

      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      resetForm();
      setEditingProject(null);
    } catch (err: any) {
      setFormErrors({ _form: err?.message || '更新失败' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (api && typeof api.projects?.delete === 'function') {
        await api.projects.delete(deleteTarget.id);
      }
      setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      console.error('Delete error:', err);
    }
  };

  const resetForm = () => {
    setForm({ name: '', idea: '', platform: 'Web', techStack: '', uiStyle: '', difficulty: 'Medium' });
    setFormErrors({});
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
    setForm({
      name: project.name,
      idea: project.idea,
      platform: project.platform,
      techStack: project.techStack || '',
      uiStyle: project.uiStyle || '',
      difficulty: project.difficulty,
    });
    setFormErrors({});
  };

  const openNew = () => {
    resetForm();
    setEditingProject(null);
    setShowNewModal(true);
  };

  // ── Form fields component ──────────────────────────────────────────────
  const renderFormFields = () => (
    <div className="space-y-4">
      {formErrors._form && (
        <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          {formErrors._form}
        </div>
      )}

      <Input
        label="项目名称 *"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        placeholder="输入项目名称"
        error={formErrors.name}
      />

      <Textarea
        label="项目描述 *"
        value={form.idea}
        onChange={(e) => setForm((f) => ({ ...f, idea: e.target.value }))}
        placeholder="描述项目想法和核心功能"
        rows={4}
        error={formErrors.idea}
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="project-platform" className="block text-xs font-medium text-zinc-400 mb-1.5">平台</label>
          <select
            id="project-platform"
            value={form.platform}
            onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value as Platform }))}
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-200 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p} className="bg-zinc-900">{PLATFORM_LABELS[p]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="project-difficulty" className="block text-xs font-medium text-zinc-400 mb-1.5">难度</label>
          <select
            id="project-difficulty"
            value={form.difficulty}
            onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value as Difficulty }))}
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-200 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d} className="bg-zinc-900">{DIFFICULTY_LABELS[d]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="技术栈"
          value={form.techStack}
          onChange={(e) => setForm((f) => ({ ...f, techStack: e.target.value }))}
          placeholder="如: React, Node.js"
        />
        <Input
          label="UI 风格"
          value={form.uiStyle}
          onChange={(e) => setForm((f) => ({ ...f, uiStyle: e.target.value }))}
          placeholder="如: Glassmorphism"
        />
      </div>
    </div>
  );

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6 animate-pulse">
        <div className="h-10 w-48 rounded-xl bg-white/5" />
        <div className="flex gap-3">
          <div className="h-10 w-64 rounded-xl bg-white/5" />
          <div className="h-10 w-32 rounded-xl bg-white/5" />
          <div className="h-10 w-32 rounded-xl bg-white/5" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-white/5 border border-white/10" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────
  if (error && projects.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <GlassCard className="p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-zinc-100 mb-2">加载失败</h2>
          <p className="text-zinc-400 mb-4">{error}</p>
          <button onClick={fetchProjects} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-200 transition-colors">
            <RefreshCw className="w-4 h-4" /> 重试
          </button>
        </GlassCard>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">项目</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {filtered.length} / {projects.length} 个项目
          </p>
        </div>
        <Button onClick={openNew} icon={<Plus className="w-4 h-4" />}>
          新建项目
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索项目名称或描述..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-200 text-sm
                       placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50
                       focus:border-blue-500/50 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={classNames(
                'px-3 py-2 rounded-xl text-xs font-medium transition-all border',
                statusFilter === s.value
                  ? 'bg-white/10 border-white/20 text-zinc-200'
                  : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Project grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => {
            const PIcon = PlatformIcon[project.platform] || Layers;
            return (
              <GlassCard
                key={project.id}
                className="p-5 cursor-pointer hover:scale-[1.02] transition-transform duration-200 group"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <PIcon className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                    <h3 className="font-semibold text-zinc-200 text-sm truncate">{project.name}</h3>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit(project); }}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-zinc-300 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(project); }}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 mb-3 line-clamp-2 leading-relaxed">
                  {project.idea}
                </p>

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge className={statusColor[project.status]}>
                    {STATUSES.find((s) => s.value === project.status)?.label || project.status}
                  </Badge>
                  <Badge className={platformColor[project.platform]}>
                    <PIcon className="w-3 h-3 mr-1" />
                    {PLATFORM_LABELS[project.platform] ?? project.platform}
                  </Badge>
                  <Badge className={difficultyColor[project.difficulty]}>
                    {DIFFICULTY_LABELS[project.difficulty] ?? project.difficulty}
                  </Badge>
                </div>

                {project.techStack && (
                  <p className="text-[11px] text-zinc-500 mb-2 truncate">
                    {project.techStack}
                  </p>
                )}

                <div className="flex items-center gap-1 text-[11px] text-zinc-600">
                  <Clock className="w-3 h-3" />
                  {formatRelativeDate(project.createdAt)}
                </div>
              </GlassCard>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={FolderKanban}
          title={search || statusFilter !== 'all' ? '没有匹配的项目' : '暂无项目'}
          description={
            search || statusFilter !== 'all'
              ? '尝试更改筛选条件或搜索词'
              : '创建你的第一个项目来开始使用 AgentFlow Studio'
          }
          actionLabel="新建项目"
          onAction={openNew}
        />
      )}

      {/* ── New/Edit Modal ────────────────────────────────────────────────── */}
      <Modal
        open={showNewModal || !!editingProject}
        onClose={() => { setShowNewModal(false); setEditingProject(null); resetForm(); }}
        title={editingProject ? '编辑项目' : '新建项目'}
        size="md"
      >
        {renderFormFields()}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
          <Button
            variant="ghost"
            onClick={() => { setShowNewModal(false); setEditingProject(null); resetForm(); }}
          >
            取消
          </Button>
          <Button
            onClick={editingProject ? handleUpdate : handleCreate}
            loading={saving}
            icon={editingProject ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          >
            {editingProject ? '保存修改' : '创建项目'}
          </Button>
        </div>
      </Modal>

      {/* ── Delete confirmation modal ─────────────────────────────────────── */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="确认删除"
        size="sm"
      >
        <div className="text-center py-4">
          <Trash2 className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-zinc-200 font-medium mb-1">删除项目 &ldquo;{deleteTarget?.name}&rdquo;？</p>
          <p className="text-sm text-zinc-500">此操作不可撤销，所有相关任务和记忆将被移除。</p>
        </div>
        <div className="flex justify-center gap-3 mt-4 pt-4 border-t border-white/10">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>取消</Button>
          <Button variant="danger" onClick={handleDelete} icon={<Trash2 className="w-4 h-4" />}>
            确认删除
          </Button>
        </div>
      </Modal>
    </div>
  );
}
