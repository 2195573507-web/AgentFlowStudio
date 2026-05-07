import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Brain,
  Search,
  Plus,
  Download,
  Upload,
  Sparkles,
  Copy,
  Check,
  Pencil,
  Trash2,
  Archive,
  RotateCcw,
  Star,
  X,
  Filter,
  ChevronDown,
  AlertTriangle,
  RefreshCw,
  Clock,
  Tag,
  FolderKanban,
  Layers,
  Cpu,
  Globe,
  Database,
  FileJson,
  FileText,
  EyeOff,
  Zap,
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
  Import,
} from 'lucide-react';
import { api } from '../lib/api';
import { retrieveMemories } from '../lib/memoryRetriever';
import { generateSharedMemoryContext } from '../lib/memoryInjection';
import { injectMemoryIntoPrompt } from '../lib/memoryInjection';
import { containsSecret, redactSecrets } from '../lib/secretRedaction';
import { exportMemoriesToMarkdown, exportJSON } from '../lib/exporters';
import { GlassCard, EmptyState, Button, Input, Textarea, Badge, Modal } from '../components/';
import type {
  Memory, MemoryType, MemoryStatus, MemoryInjectionMode, Project,
} from '../lib/types';
import { generateId, formatRelativeDate, copyToClipboard, classNames, truncate } from '../lib/utils';

// ── Demo data ──────────────────────────────────────────────────────────────
const DEMO_MEMORIES: Memory[] = [
  {
    id: 'm1', type: 'decision', title: 'Use Electron for cross-platform desktop',
    content: 'Decision: Use Electron for the cross-platform desktop application. Reasoning: Mature ecosystem, good TypeScript support, extensive community. Alternatives considered: Tauri (too new), Qt (C++ overhead too high).',
    tags: ['architecture', 'frontend', 'decision'],
    importance: 5, status: 'active',
    projectId: 'demo-1',
    lastUsedAt: new Date(Date.now() - 2 * 3600e3).toISOString(),
    createdAt: new Date(Date.now() - 7 * 864e5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'm2', type: 'pattern', title: 'Repository pattern for data access',
    content: 'Pattern: All data access goes through repository classes that abstract the underlying SQLite database. Each entity (Project, Task, Memory) has its own repository with CRUD operations.',
    tags: ['backend', 'architecture', 'pattern'],
    importance: 4, status: 'active',
    projectId: 'demo-1',
    lastUsedAt: new Date(Date.now() - 8 * 3600e3).toISOString(),
    createdAt: new Date(Date.now() - 5 * 864e5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'm3', type: 'insight', title: 'Memory injection improves output quality ~40%',
    content: 'Insight: Testing across 50 prompts showed that injecting relevant shared memories improves output quality by approximately 40%. Most effective with "balanced" injection mode.',
    tags: ['research', 'ai', 'quality'],
    importance: 5, status: 'active',
    lastUsedAt: new Date(Date.now() - 24 * 3600e3).toISOString(),
    createdAt: new Date(Date.now() - 3 * 864e5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'm4', type: 'security', title: 'Use contextBridge for IPC security',
    content: 'Security: Always use contextBridge.exposeInMainWorld() for IPC communication. Never enable nodeIntegration or use remote module. Follow Electron security best practices.',
    tags: ['security', 'electron', 'best-practice'],
    importance: 5, status: 'active',
    projectId: 'demo-1',
    lastUsedAt: new Date(Date.now() - 5 * 3600e3).toISOString(),
    createdAt: new Date(Date.now() - 6 * 864e5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'm5', type: 'code_snippet', title: 'SQLite migrations template',
    content: '```typescript\nimport Database from \'better-sqlite3\';\n\nconst MIGRATIONS = [\n  `CREATE TABLE IF NOT EXISTS projects (\n    id TEXT PRIMARY KEY,\n    name TEXT NOT NULL\n  )`,\n  `CREATE TABLE IF NOT EXISTS tasks (\n    id TEXT PRIMARY KEY,\n    project_id TEXT REFERENCES projects(id)\n  )`\n];\n\nexport function migrate(db: Database.Database) {\n  db.exec(\'PRAGMA journal_mode=WAL\');\n  for (const sql of MIGRATIONS) {\n    db.exec(sql);\n  }\n}\n```',
    tags: ['database', 'sqlite', 'code'],
    importance: 3, status: 'active',
    projectId: 'demo-1',
    lastUsedAt: new Date(Date.now() - 10 * 3600e3).toISOString(),
    createdAt: new Date(Date.now() - 8 * 864e5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'm6', type: 'issue_fix', title: 'Fix: streaming response buffer overflow',
    content: 'Fix: Increased streaming buffer size from 4KB to 64KB. Implemented backpressure handling. Added chunk boundary detection for UTF-8 multi-byte characters.',
    tags: ['bug', 'streaming', 'fix'],
    importance: 3, status: 'pending',
    projectId: 'demo-1',
    lastUsedAt: new Date(Date.now() - 1 * 864e5).toISOString(),
    createdAt: new Date(Date.now() - 1 * 864e5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'm7', type: 'knowledge', title: 'Electron IPC best practices',
    content: 'Knowledge: 1) Use invoke/handle pattern for request-response. 2) Use on/send for events. 3) Validate all data crossing IPC boundary. 4) Keep main process logic minimal. 5) Use preload script for contextBridge.',
    tags: ['electron', 'ipc', 'best-practice'],
    importance: 4, status: 'active',
    lastUsedAt: new Date(Date.now() - 12 * 3600e3).toISOString(),
    createdAt: new Date(Date.now() - 10 * 864e5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'm8', type: 'decision', title: 'Tailwind over CSS Modules',
    content: 'Decision: Use Tailwind CSS over CSS Modules. Reasoning: Faster prototyping, utility-first approach suits component architecture, built-in dark mode support, smaller bundle with purging.',
    tags: ['frontend', 'styling', 'decision'],
    importance: 3, status: 'archived',
    projectId: 'demo-1',
    lastUsedAt: new Date(Date.now() - 30 * 864e5).toISOString(),
    createdAt: new Date(Date.now() - 15 * 864e5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEMO_PROJECTS: Project[] = [
  { id: 'demo-1', name: 'AI Chat Assistant', idea: '', platform: 'Desktop', techStack: '', uiStyle: '', difficulty: 'Medium', status: 'active', createdAt: '', updatedAt: '' },
  { id: 'demo-2', name: 'DevTool CLI', idea: '', platform: 'CLI', techStack: '', uiStyle: '', difficulty: 'Hard', status: 'planning', createdAt: '', updatedAt: '' },
];

// ── Constants ──────────────────────────────────────────────────────────────
const MEMORY_TYPES: MemoryType[] = ['decision', 'pattern', 'insight', 'knowledge', 'code_snippet', 'security', 'issue_fix', 'git_summary', 'log_analysis', 'safety_check'];
const MEMORY_STATUSES: MemoryStatus[] = ['active', 'pending', 'archived'];
const INJECTION_MODES: MemoryInjectionMode[] = ['off', 'minimal', 'balanced', 'full'];

const TYPE_COLORS: Record<string, string> = {
  decision: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  pattern: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  insight: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  knowledge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  code_snippet: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  security: 'bg-red-500/20 text-red-300 border-red-500/30',
  issue_fix: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  git_summary: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  log_analysis: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  safety_check: 'bg-green-500/20 text-green-300 border-green-500/30',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  pending: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  archived: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/20',
};

// ── Component ──────────────────────────────────────────────────────────────
export default function SharedMemoryHub() {
  // Data
  const [memories, setMemories] = useState<Memory[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiAvailable, setApiAvailable] = useState(true);

  // Search & filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Memory | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showContextModal, setShowContextModal] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);

  // Form
  const [form, setForm] = useState({
    type: 'knowledge' as MemoryType,
    title: '',
    content: '',
    tags: '',
    projectId: '',
    providerScope: '',
    modelScope: '',
    importance: 3,
    status: 'active' as MemoryStatus,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Context generation
  const [contextInjectionMode, setContextInjectionMode] = useState<MemoryInjectionMode>('balanced');
  const [generatedContext, setGeneratedContext] = useState<string>('');
  const [generatingContext, setGeneratingContext] = useState(false);
  const [copiedContext, setCopiedContext] = useState(false);

  // UI state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch data ────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let mems: Memory[] = [];
      let projs: Project[] = [];

      if (api && typeof api.memory?.list === 'function') {
        mems = await api.memory.list();
      } else {
        setApiAvailable(false);
        mems = DEMO_MEMORIES;
      }

      if (api && typeof api.projects?.list === 'function') {
        projs = await api.projects.list();
      } else {
        projs = DEMO_PROJECTS;
      }

      setMemories(Array.isArray(mems) ? mems : DEMO_MEMORIES);
      setProjects(Array.isArray(projs) ? projs : DEMO_PROJECTS);
    } catch (err: any) {
      console.error('Memory fetch error:', err);
      setApiAvailable(false);
      setMemories(DEMO_MEMORIES);
      setProjects(DEMO_PROJECTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Filtered memories ─────────────────────────────────────────────────
  const filteredMemories = useMemo(() => {
    return memories.filter((m) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        m.title.toLowerCase().includes(q) ||
        m.content.toLowerCase().includes(q) ||
        (m.tags || []).some((t) => t.toLowerCase().includes(q));
      const matchType = typeFilter === 'all' || m.type === typeFilter;
      const matchProject = projectFilter === 'all' || m.projectId === projectFilter;
      const matchStatus = statusFilter === 'all' || m.status === statusFilter;
      return matchSearch && matchType && matchProject && matchStatus;
    });
  }, [memories, search, typeFilter, projectFilter, statusFilter]);

  const pendingMemories = useMemo(
    () => memories.filter((m) => m.status === 'pending'),
    [memories]
  );

  // ── Form handlers ─────────────────────────────────────────────────────
  const resetForm = () => {
    setForm({ type: 'knowledge', title: '', content: '', tags: '', projectId: '', providerScope: '', modelScope: '', importance: 3, status: 'active' });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = '标题不能为空';
    if (!form.content.trim()) errors.content = '内容不能为空';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const memory: Memory = {
        id: generateId(),
        type: form.type,
        title: form.title.trim(),
        content: form.content.trim(),
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        importance: form.importance,
        status: form.status,
        projectId: form.projectId || undefined,
        providerScope: form.providerScope || undefined,
        modelScope: form.modelScope || undefined,
        lastUsedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (api && typeof api.memory?.create === 'function') {
        await api.memory.create(memory);
      }

      setMemories((prev) => [memory, ...prev]);
      resetForm();
      setShowCreateModal(false);
    } catch { /* silently handle */ } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingMemory || !validateForm()) return;
    setSaving(true);
    try {
      const updated: Memory = {
        ...editingMemory,
        type: form.type,
        title: form.title.trim(),
        content: form.content.trim(),
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        importance: form.importance,
        status: form.status,
        projectId: form.projectId || undefined,
        providerScope: form.providerScope || undefined,
        modelScope: form.modelScope || undefined,
        updatedAt: new Date().toISOString(),
      };

      if (api && typeof api.memory?.update === 'function') {
        await api.memory.update(updated);
      }

      setMemories((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      resetForm();
      setEditingMemory(null);
    } catch { /* silently handle */ } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (api && typeof api.memory?.delete === 'function') {
        await api.memory.delete(deleteTarget.id);
      }
      setMemories((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {}
  };

  const handleToggleStatus = async (memory: Memory) => {
    const newStatus: MemoryStatus = memory.status === 'active' ? 'archived' : 'active';
    const updated = { ...memory, status: newStatus, updatedAt: new Date().toISOString() };

    if (api && typeof api.memory?.update === 'function') {
      try { await api.memory.update(updated); } catch {}
    }
    setMemories((prev) => prev.map((m) => (m.id === memory.id ? updated : m)));
  };

  const handleConfirmPending = async (memory: Memory) => {
    const updated = { ...memory, status: 'active' as MemoryStatus, updatedAt: new Date().toISOString() };
    if (api && typeof api.memory?.update === 'function') {
      try { await api.memory.update(updated); } catch {}
    }
    setMemories((prev) => prev.map((m) => (m.id === memory.id ? updated : m)));
  };

  const openEdit = (memory: Memory) => {
    setEditingMemory(memory);
    setForm({
      type: memory.type,
      title: memory.title,
      content: memory.content,
      tags: (memory.tags || []).join(', '),
      projectId: memory.projectId || '',
      providerScope: memory.providerScope || '',
      modelScope: memory.modelScope || '',
      importance: memory.importance,
      status: memory.status,
    });
    setFormErrors({});
  };

  // ── Export all as JSON ────────────────────────────────────────────────
  const handleExportJSON = async () => {
    try {
      // Redact secrets before export
      const redacted = memories.map((m) => {
        let content = m.content;
        if (containsSecret(content)) {
          content = redactSecrets(content);
        }
        return { ...m, content };
      });

      const json = JSON.stringify(redacted, null, 2);
      if (api && typeof api.export?.exportJSON === 'function') {
        await api.export.exportJSON(json, `memories_${Date.now()}.json`);
      } else {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `memories_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {}
  };

  // ── Export current project as Markdown ────────────────────────────────
  const handleExportMarkdown = async () => {
    try {
      const md = exportMemoriesToMarkdown(memories, projectFilter !== 'all' ? projectFilter : undefined);
      if (api && typeof api.export?.exportMarkdown === 'function') {
        await api.export.exportMarkdown(md, `memories_project_${projectFilter}.md`);
      } else {
        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `memories_${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {}
  };

  // ── Import JSON ───────────────────────────────────────────────────────
  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const items: Partial<Memory>[] = Array.isArray(data) ? data : [data];

      let imported = 0;
      let skipped = 0;
      const importErrors: string[] = [];

      for (const item of items) {
        // Skip secrets-only containers
        if (item.content && containsSecret(item.content)) {
          item.content = redactSecrets(item.content);
          // If after redaction the content is empty, skip
          if (!item.content || item.content.trim() === '[REDACTED]' || item.content.trim() === '') {
            skipped++;
            continue;
          }
        }

        // Skip items without meaningful content
        if (!item.title && !item.content) {
          skipped++;
          continue;
        }

        const memory: Memory = {
          id: item.id || generateId(),
          type: item.type || 'knowledge',
          title: item.title || 'Imported Memory',
          content: item.content || '',
          tags: item.tags || [],
          importance: Math.min(5, Math.max(1, item.importance || 3)),
          status: (item.status === 'active' || item.status === 'pending' || item.status === 'archived') ? item.status : 'active',
          projectId: item.projectId,
          providerScope: item.providerScope,
          modelScope: item.modelScope,
          lastUsedAt: item.lastUsedAt || new Date().toISOString(),
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (api && typeof api.memory?.create === 'function') {
          try {
            await api.memory.create(memory);
          } catch {
            importErrors.push(`Failed to import: ${memory.title}`);
            continue;
          }
        }

        setMemories((prev) => {
          if (prev.find((m) => m.id === memory.id)) {
            return prev.map((m) => (m.id === memory.id ? memory : m));
          }
          return [memory, ...prev];
        });
        imported++;
      }

      setImportResult({ imported, skipped, errors: importErrors });
    } catch (err: any) {
      setImportResult({ imported: 0, skipped: 0, errors: [`Parse error: ${err.message}`] });
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Context generation ────────────────────────────────────────────────
  const handleGenerateContext = async () => {
    setGeneratingContext(true);
    try {
      let context = '';
      if (typeof generateSharedMemoryContext === 'function') {
        context = await generateSharedMemoryContext(undefined, contextInjectionMode);
      } else {
        // Fallback: build context from active memories
        const activeMemories = memories.filter((m) => m.status === 'active');
        const sortedMemories = [...activeMemories].sort((a, b) => b.importance - a.importance);
        const modeLimits = { minimal: 2, balanced: 5, full: 20 };
        const limit = modeLimits[contextInjectionMode] || 5;

        const contextParts = sortedMemories.slice(0, limit).map((m) =>
          `### [${m.type}] ${m.title}\n${m.content}\nTags: ${(m.tags || []).join(', ')}`
        );
        context = `# Shared Memory Context (${contextInjectionMode})\n\n${contextParts.join('\n\n')}`;
      }

      setGeneratedContext(context);
    } catch {
      setGeneratedContext('# Error generating context\n\nPlease try again.');
    } finally {
      setGeneratingContext(false);
    }
  };

  // ── Copy helper ───────────────────────────────────────────────────────
  const handleCopy = async (text: string, key: string) => {
    await copyToClipboard(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // ── Importance stars ──────────────────────────────────────────────────
  const renderStars = (importance: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={classNames(
            'w-3 h-3',
            s <= importance ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'
          )}
        />
      ))}
    </div>
  );

  // ── Form fields component ─────────────────────────────────────────────
  const renderFormFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">类型</label>
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as MemoryType }))}
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-200 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            {MEMORY_TYPES.map((t) => (
              <option key={t} value={t} className="bg-zinc-900">{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">状态</label>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as MemoryStatus }))}
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-200 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            {MEMORY_STATUSES.map((s) => (
              <option key={s} value={s} className="bg-zinc-900">
                {{ active: 'Active', pending: 'Pending', archived: 'Archived' }[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">标题 *</label>
        <Input
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="记忆标题"
          error={formErrors.title}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">内容 *</label>
        <Textarea
          value={form.content}
          onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
          placeholder="记忆内容 — 包括决策理由、代码片段、经验教训等"
          rows={5}
          error={formErrors.content}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">标签 (逗号分隔)</label>
          <Input
            value={form.tags}
            onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            placeholder="architecture, frontend"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">关联项目</label>
          <select
            value={form.projectId}
            onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-200 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="" className="bg-zinc-900">无</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id} className="bg-zinc-900">{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Provider Scope</label>
          <Input
            value={form.providerScope}
            onChange={(e) => setForm((f) => ({ ...f, providerScope: e.target.value }))}
            placeholder="如: openai"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Model Scope</label>
          <Input
            value={form.modelScope}
            onChange={(e) => setForm((f) => ({ ...f, modelScope: e.target.value }))}
            placeholder="如: gpt-4"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">
          重要性: {form.importance} / 5
        </label>
        <input
          type="range"
          min={1}
          max={5}
          value={form.importance}
          onChange={(e) => setForm((f) => ({ ...f, importance: Number(e.target.value) }))}
          className="w-full h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                     [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>
    </div>
  );

  // ── Loading state ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6 animate-pulse">
        <div className="h-10 w-48 rounded-xl bg-white/5" />
        <div className="flex gap-3">
          <div className="h-10 flex-1 rounded-xl bg-white/5" />
          <div className="h-10 w-28 rounded-xl bg-white/5" />
          <div className="h-10 w-28 rounded-xl bg-white/5" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-white/5 border border-white/10" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────
  if (error && memories.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <GlassCard className="p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-zinc-100 mb-2">加载失败</h2>
          <p className="text-zinc-400 mb-4">{error}</p>
          <Button onClick={fetchData} icon={<RefreshCw className="w-4 h-4" />}>重试</Button>
        </GlassCard>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">Shared Memory Hub</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {filteredMemories.length} / {memories.length} 条记忆
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => { resetForm(); setShowCreateModal(true); }} icon={<Plus className="w-4 h-4" />}>
            新增记忆
          </Button>
          <Button variant="ghost" onClick={handleExportJSON} icon={<Download className="w-4 h-4" />}>
            导出 JSON
          </Button>
          <Button variant="ghost" onClick={() => { setShowImportModal(true); setImportResult(null); }} icon={<Upload className="w-4 h-4" />}>
            导入 JSON
          </Button>
          <Button variant="ghost" onClick={() => { setShowContextModal(true); setGeneratedContext(''); }} icon={<Sparkles className="w-4 h-4" />}>
            生成跨模型恢复 Prompt
          </Button>
          {projectFilter !== 'all' && (
            <Button variant="ghost" onClick={handleExportMarkdown} icon={<FileText className="w-4 h-4" />}>
              导出 Markdown
            </Button>
          )}
        </div>
      </div>

      {/* Search & filters */}
      <GlassCard className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索记忆标题、内容、标签..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-200 text-sm
                         placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300 text-xs
                       focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-w-[100px]"
          >
            <option value="all" className="bg-zinc-900">全部类型</option>
            {MEMORY_TYPES.map((t) => (
              <option key={t} value={t} className="bg-zinc-900">{t}</option>
            ))}
          </select>

          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300 text-xs
                       focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-w-[120px]"
          >
            <option value="all" className="bg-zinc-900">全部项目</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id} className="bg-zinc-900">{p.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300 text-xs
                       focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-w-[100px]"
          >
            <option value="all" className="bg-zinc-900">全部状态</option>
            <option value="active" className="bg-zinc-900">Active</option>
            <option value="pending" className="bg-zinc-900">Pending</option>
            <option value="archived" className="bg-zinc-900">Archived</option>
          </select>
        </div>
      </GlassCard>

      {/* Pending memories alert */}
      {pendingMemories.length > 0 && (
        <GlassCard className="p-4 border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-300 text-sm">
              <AlertCircle className="w-4 h-4" />
              {pendingMemories.length} 条待确认记忆
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setStatusFilter('pending')}
              icon={<ChevronDown className="w-3.5 h-3.5" />}
            >
              查看待确认
            </Button>
          </div>
          <div className="mt-3 space-y-2">
            {pendingMemories.slice(0, 3).map((m) => (
              <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge className={TYPE_COLORS[m.type] || 'bg-zinc-500/20 text-zinc-400'}>{m.type}</Badge>
                  <span className="text-sm text-zinc-300 truncate">{m.title}</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleConfirmPending(m)}
                  icon={<CheckCircle className="w-3.5 h-3.5" />}
                >
                  确认
                </Button>
              </div>
            ))}
            {pendingMemories.length > 3 && (
              <p className="text-xs text-zinc-500 text-center">
                还有 {pendingMemories.length - 3} 条待确认...
              </p>
            )}
          </div>
        </GlassCard>
      )}

      {/* Memory cards grid */}
      {filteredMemories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMemories.map((memory) => {
            const project = memory.projectId
              ? projects.find((p) => p.id === memory.projectId)
              : null;

            return (
              <GlassCard
                key={memory.id}
                className={classNames(
                  'p-4 flex flex-col group transition-all',
                  memory.status === 'archived' && 'opacity-60'
                )}
              >
                {/* Top row: type + actions */}
                <div className="flex items-start justify-between mb-2">
                  <Badge className={TYPE_COLORS[memory.type] || 'bg-zinc-500/20 text-zinc-400'}>
                    {memory.type}
                  </Badge>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(memory)}
                      className="p-1 rounded hover:bg-white/10 text-zinc-500 hover:text-zinc-300"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(memory)}
                      className="p-1 rounded hover:bg-white/10 text-zinc-500 hover:text-zinc-300"
                      title={memory.status === 'active' ? 'Archive' : 'Activate'}
                    >
                      {memory.status === 'archived' ? (
                        <RotateCcw className="w-3 h-3" />
                      ) : (
                        <Archive className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(memory)}
                      className="p-1 rounded hover:bg-red-500/20 text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-sm font-semibold text-zinc-200 mb-1.5 line-clamp-1">
                  {memory.title}
                </h3>

                {/* Content preview */}
                <p className="text-xs text-zinc-400 mb-3 line-clamp-2 leading-relaxed flex-1">
                  {memory.content}
                </p>

                {/* Tags */}
                {memory.tags && memory.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {memory.tags.slice(0, 4).map((tag) => (
                      <Badge key={tag} className="text-[10px] bg-white/5 text-zinc-500 border-white/10">
                        {tag}
                      </Badge>
                    ))}
                    {memory.tags.length > 4 && (
                      <Badge className="text-[10px] bg-white/5 text-zinc-500 border-white/10">
                        +{memory.tags.length - 4}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Bottom metadata row */}
                <div className="flex items-center justify-between text-[11px] text-zinc-600 mt-auto pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <Badge className={STATUS_COLORS[memory.status] || 'bg-zinc-500/20'}>
                      {memory.status}
                    </Badge>
                    {project && (
                      <span className="flex items-center gap-1">
                        <FolderKanban className="w-3 h-3" /> {project.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStars(memory.importance)}
                  </div>
                </div>

                {/* Last used */}
                {memory.lastUsedAt && (
                  <div className="flex items-center gap-1 mt-1.5 text-[10px] text-zinc-600">
                    <Clock className="w-3 h-3" />
                    上次使用: {formatRelativeDate(memory.lastUsedAt)}
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      ) : (
        <GlassCard className="p-12">
          <EmptyState
            icon={Brain}
            title={search || typeFilter !== 'all' || statusFilter !== 'all' ? '没有匹配的记忆' : '暂无共享记忆'}
            description={
              search || typeFilter !== 'all' || statusFilter !== 'all'
                ? '尝试更改筛选条件或搜索词'
                : '创建第一条共享记忆，让 AI 跨项目、跨模型保持知识连续性'
            }
            actionLabel="创建第一条记忆"
            onAction={() => { resetForm(); setShowCreateModal(true); }}
          />
        </GlassCard>
      )}

      {/* ── Create/Edit Modal ─────────────────────────────────────────────── */}
      <Modal
        open={showCreateModal || !!editingMemory}
        onClose={() => { setShowCreateModal(false); setEditingMemory(null); resetForm(); }}
        title={editingMemory ? '编辑记忆' : '新增记忆'}
        size="lg"
      >
        {renderFormFields()}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
          <Button variant="ghost" onClick={() => { setShowCreateModal(false); setEditingMemory(null); resetForm(); }}>
            取消
          </Button>
          <Button
            onClick={editingMemory ? handleUpdate : handleCreate}
            loading={saving}
            icon={editingMemory ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          >
            {editingMemory ? '保存修改' : '创建记忆'}
          </Button>
        </div>
      </Modal>

      {/* ── Delete confirmation ───────────────────────────────────────────── */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="确认删除" size="sm">
        <div className="text-center py-4">
          <Trash2 className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-zinc-200 font-medium mb-1">删除记忆 &ldquo;{deleteTarget?.title}&rdquo;？</p>
          <p className="text-sm text-zinc-500">此操作不可撤销。</p>
        </div>
        <div className="flex justify-center gap-3 mt-4 pt-4 border-t border-white/10">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>取消</Button>
          <Button variant="danger" onClick={handleDelete} icon={<Trash2 className="w-4 h-4" />}>
            确认删除
          </Button>
        </div>
      </Modal>

      {/* ── Import Modal ──────────────────────────────────────────────────── */}
      <Modal open={showImportModal} onClose={() => { setShowImportModal(false); setImportResult(null); }} title="导入 JSON" size="md">
        <div className="space-y-4">
          {!importResult ? (
            <>
              <p className="text-sm text-zinc-400">
                选择一个 JSON 文件导入共享记忆。导入过程中会自动过滤包含敏感信息的记忆条目。
              </p>
              <div className="flex flex-col items-center gap-3 p-8 border-2 border-dashed border-white/10 rounded-2xl bg-white/5">
                <Upload className="w-8 h-8 text-zinc-500" />
                <p className="text-sm text-zinc-400">拖拽文件到此处或点击选择</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="block text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl
                             file:border-0 file:text-sm file:font-medium file:bg-white/10 file:text-zinc-200
                             hover:file:bg-white/20 file:cursor-pointer"
                />
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-emerald-400">
                <CheckCircle className="w-12 h-12" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold text-zinc-200">导入完成</p>
                <div className="flex justify-center gap-6 text-sm">
                  <span className="text-emerald-400">导入 {importResult.imported} 条</span>
                  <span className="text-amber-400">跳过 {importResult.skipped} 条</span>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="mt-2 text-left">
                    {importResult.errors.map((err, i) => (
                      <p key={i} className="text-xs text-red-400">{err}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
          <Button variant="ghost" onClick={() => { setShowImportModal(false); setImportResult(null); }}>
            {importResult ? '完成' : '取消'}
          </Button>
        </div>
      </Modal>

      {/* ── Context Generation Modal ──────────────────────────────────────── */}
      <Modal
        open={showContextModal}
        onClose={() => { setShowContextModal(false); setGeneratedContext(''); }}
        title="生成跨模型恢复 Prompt"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            生成的 Prompt 包含所有活跃共享记忆的上下文，可以粘贴到任何 AI 模型中以恢复完整的项目知识。
          </p>

          <div className="flex items-center gap-3">
            <label className="text-xs text-zinc-400">注入模式:</label>
            <div className="flex gap-1">
              {INJECTION_MODES.filter((m) => m !== 'off').map((mode) => (
                <button
                  key={mode}
                  onClick={() => setContextInjectionMode(mode)}
                  className={classNames(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    contextInjectionMode === mode
                      ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                  )}
                >
                  {{ minimal: '最少', balanced: '均衡', full: '完整' }[mode]}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleGenerateContext}
            loading={generatingContext}
            icon={<Sparkles className="w-4 h-4" />}
            fullWidth
          >
            生成 Prompt
          </Button>

          {generatedContext && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  生成的 Prompt
                </h4>
                <button
                  onClick={() => {
                    copyToClipboard(generatedContext);
                    setCopiedContext(true);
                    setTimeout(() => setCopiedContext(false), 2000);
                  }}
                  className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {copiedContext ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> 已复制
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> 复制
                    </>
                  )}
                </button>
              </div>
              <pre className="px-4 py-3 rounded-xl bg-zinc-900/50 text-xs text-zinc-300 font-mono whitespace-pre-wrap border border-white/5 max-h-96 overflow-y-auto">
                {generatedContext}
              </pre>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
          <Button variant="ghost" onClick={() => { setShowContextModal(false); setGeneratedContext(''); }}>
            关闭
          </Button>
        </div>
      </Modal>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImportJSON}
        className="hidden"
      />
    </div>
  );
}
