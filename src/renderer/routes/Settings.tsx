import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings2,
  Sun,
  Moon,
  Monitor,
  FolderOpen,
  Cpu,
  Database,
  Download,
  Upload,
  Trash2,
  RotateCcw,
  Plus,
  Pencil,
  Eye,
  EyeOff,
  Globe,
  Key,
  HardDrive,
  Layers,
  Info,
  Check,
  AlertTriangle,
  RefreshCw,
  Server,
  ToggleLeft,
  ToggleRight,
  Shield,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { api } from '../lib/api';
import { GlassCard, EmptyState, Button, Input, Badge, Modal } from '../components/';
import type { ProviderSetting, AppSettings, ThemeMode, AITool, MemoryInjectionMode } from '../lib/types';
import { generateId, classNames } from '../lib/utils';

// ── Demo data ──────────────────────────────────────────────────────────────
const DEMO_SETTINGS: AppSettings = {
  theme: 'dark',
  defaultProjectPath: '/home/user/projects',
  defaultAITool: 'Claude Code',
  dataPath: '/home/user/.agentflow-studio',
  appVersion: '1.0.0',
  techStack: ['Electron 28', 'React 18', 'TypeScript 5.3', 'Tailwind CSS 3.4', 'SQLite'],
};

const DEMO_PROVIDERS: ProviderSetting[] = [
  {
    id: 'p1', providerName: 'OpenAI', baseUrl: 'https://api.openai.com/v1',
    apiKey: 'sk-••••••••••••••••••••', modelName: 'gpt-4-turbo',
    enabled: true, memoryEnabled: true,
    memoryInjectionMode: 'balanced', maxMemoryItems: 10, maxMemoryChars: 8000,
  },
  {
    id: 'p2', providerName: 'Anthropic', baseUrl: 'https://api.anthropic.com/v1',
    apiKey: 'sk-ant-••••••••••••••••', modelName: 'claude-sonnet-4-20250514',
    enabled: true, memoryEnabled: true,
    memoryInjectionMode: 'full', maxMemoryItems: 20, maxMemoryChars: 12000,
  },
  {
    id: 'p3', providerName: 'Local LLM', baseUrl: 'http://localhost:11434/v1',
    apiKey: '', modelName: 'llama3',
    enabled: false, memoryEnabled: false,
    memoryInjectionMode: 'off', maxMemoryItems: 5, maxMemoryChars: 4000,
  },
];

// ── Component ──────────────────────────────────────────────────────────────
export default function Settings() {
  // General
  const [settings, setSettings] = useState<AppSettings>(DEMO_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [apiAvailable, setApiAvailable] = useState(true);

  // Theme
  const [theme, setTheme] = useState<ThemeMode>('dark');

  // Providers
  const [providers, setProviders] = useState<ProviderSetting[]>([]);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ProviderSetting | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  // Provider form
  const [providerForm, setProviderForm] = useState({
    providerName: '', baseUrl: '', apiKey: '', modelName: '',
    enabled: true, memoryEnabled: true,
    memoryInjectionMode: 'balanced' as MemoryInjectionMode,
    maxMemoryItems: 10, maxMemoryChars: 8000,
  });

  // Default injection mode for new providers
  const [defaultInjectionMode, setDefaultInjectionMode] = useState<MemoryInjectionMode>('balanced');

  // Confirmation modals
  const [showClearDemo, setShowClearDemo] = useState(false);
  const [showResetSettings, setShowResetSettings] = useState(false);

  // ── Fetch settings ────────────────────────────────────────────────────
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      if (api && typeof api.settings?.get === 'function') {
        const s = await api.settings.get();
        if (s) setSettings(s);
      } else {
        setApiAvailable(false);
      }

      if (api && typeof api.providers?.list === 'function') {
        const p = await api.providers.list();
        setProviders(Array.isArray(p) && p.length > 0 ? p : DEMO_PROVIDERS);
      } else {
        setProviders(DEMO_PROVIDERS);
      }
    } catch {
      setApiAvailable(false);
      setProviders(DEMO_PROVIDERS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  // Sync theme to HTML
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(prefersDark ? 'dark' : 'light');
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  // ── Save settings ─────────────────────────────────────────────────────
  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const updated = { ...settings, theme };
      if (api && typeof api.settings?.update === 'function') {
        await api.settings.update(updated);
      }
      setSettings(updated);
      setSaveMessage('设置已保存');
      setTimeout(() => setSaveMessage(null), 2000);
    } catch { /* silently handle */ } finally {
      setSaving(false);
    }
  };

  // ── Provider CRUD ─────────────────────────────────────────────────────
  const resetProviderForm = () => {
    setProviderForm({
      providerName: '', baseUrl: '', apiKey: '', modelName: '',
      enabled: true, memoryEnabled: true,
      memoryInjectionMode: defaultInjectionMode,
      maxMemoryItems: 10, maxMemoryChars: 8000,
    });
    setShowApiKey(false);
  };

  const handleAddProvider = async () => {
    if (!providerForm.providerName.trim()) return;
    try {
      const provider: ProviderSetting = {
        id: generateId(),
        ...providerForm,
      };

      if (api && typeof api.providers?.create === 'function') {
        await api.providers.create(provider);
      }
      setProviders((prev) => [...prev, provider]);
      resetProviderForm();
      setShowProviderModal(false);
      setEditingProvider(null);
    } catch {}
  };

  const handleUpdateProvider = async () => {
    if (!editingProvider || !providerForm.providerName.trim()) return;
    try {
      const updated: ProviderSetting = {
        ...editingProvider,
        ...providerForm,
      };
      if (api && typeof api.providers?.update === 'function') {
        await api.providers.update(updated);
      }
      setProviders((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      resetProviderForm();
      setEditingProvider(null);
    } catch {}
  };

  const handleDeleteProvider = async (id: string) => {
    if (api && typeof api.providers?.delete === 'function') {
      try { await api.providers.delete(id); } catch {}
    }
    setProviders((prev) => prev.filter((p) => p.id !== id));
  };

  const openEditProvider = (p: ProviderSetting) => {
    setEditingProvider(p);
    setProviderForm({
      providerName: p.providerName,
      baseUrl: p.baseUrl,
      apiKey: p.apiKey,
      modelName: p.modelName,
      enabled: p.enabled,
      memoryEnabled: p.memoryEnabled,
      memoryInjectionMode: p.memoryInjectionMode,
      maxMemoryItems: p.maxMemoryItems,
      maxMemoryChars: p.maxMemoryChars,
    });
    setShowApiKey(false);
  };

  // ── Data operations ───────────────────────────────────────────────────
  const handleExportAll = async () => {
    try {
      if (api && typeof api.export?.exportAll === 'function') {
        await api.export.exportAll();
      } else {
        alert('Export not available in demo mode');
      }
    } catch {}
  };

  const handleImportData = async () => {
    try {
      if (api && typeof api.dialog?.open === 'function') {
        const result = await api.dialog.open({
          properties: ['openFile'],
          filters: [{ name: 'JSON', extensions: ['json'] }],
        });
        if (result && !result.canceled && result.filePaths?.[0]) {
          if (api.import?.importAll) {
            await api.import.importAll(result.filePaths[0]);
          }
        }
      } else {
        alert('Import not available in demo mode');
      }
    } catch {}
  };

  const handleClearDemo = async () => {
    try {
      if (api && typeof api.app?.clearDemoData === 'function') {
        await api.app.clearDemoData();
      }
      setShowClearDemo(false);
      fetchSettings();
    } catch {}
  };

  const handleResetSettings = async () => {
    try {
      if (api && typeof api.settings?.reset === 'function') {
        await api.settings.reset();
      }
      setShowResetSettings(false);
      fetchSettings();
    } catch {}
  };

  // ── Provider form component ───────────────────────────────────────────
  const renderProviderForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Provider 名称</label>
          <Input
            value={providerForm.providerName}
            onChange={(e) => setProviderForm((f) => ({ ...f, providerName: e.target.value }))}
            placeholder="如: OpenAI"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Model 名称</label>
          <Input
            value={providerForm.modelName}
            onChange={(e) => setProviderForm((f) => ({ ...f, modelName: e.target.value }))}
            placeholder="如: gpt-4-turbo"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Base URL</label>
        <Input
          value={providerForm.baseUrl}
          onChange={(e) => setProviderForm((f) => ({ ...f, baseUrl: e.target.value }))}
          placeholder="https://api.openai.com/v1"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">API Key</label>
        <div className="relative">
          <Input
            type={showApiKey ? 'text' : 'password'}
            value={providerForm.apiKey}
            onChange={(e) => setProviderForm((f) => ({ ...f, apiKey: e.target.value }))}
            placeholder="sk-..."
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
          >
            {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">记忆注入模式</label>
          <select
            value={providerForm.memoryInjectionMode}
            onChange={(e) =>
              setProviderForm((f) => ({
                ...f,
                memoryInjectionMode: e.target.value as MemoryInjectionMode,
              }))
            }
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-200 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="off" className="bg-zinc-900">关闭 (Off)</option>
            <option value="minimal" className="bg-zinc-900">最少 (Minimal)</option>
            <option value="balanced" className="bg-zinc-900">均衡 (Balanced)</option>
            <option value="full" className="bg-zinc-900">完整 (Full)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Max Memory Items</label>
          <Input
            type="number"
            value={String(providerForm.maxMemoryItems)}
            onChange={(e) =>
              setProviderForm((f) => ({ ...f, maxMemoryItems: Number(e.target.value) || 10 }))
            }
            min={1}
            max={100}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Max Memory Chars</label>
        <Input
          type="number"
          value={String(providerForm.maxMemoryChars)}
          onChange={(e) =>
            setProviderForm((f) => ({ ...f, maxMemoryChars: Number(e.target.value) || 8000 }))
          }
          min={100}
          max={100000}
        />
      </div>

      <div className="flex items-center gap-6 pt-2">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={providerForm.enabled}
            onChange={(e) => setProviderForm((f) => ({ ...f, enabled: e.target.checked }))}
            className="rounded bg-white/10 border-white/20 text-emerald-500 focus:ring-emerald-500/50"
          />
          <span className="text-sm text-zinc-300">启用</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={providerForm.memoryEnabled}
            onChange={(e) => setProviderForm((f) => ({ ...f, memoryEnabled: e.target.checked }))}
            className="rounded bg-white/10 border-white/20 text-pink-500 focus:ring-pink-500/50"
          />
          <span className="text-sm text-zinc-300">启用记忆注入</span>
        </label>
      </div>
    </div>
  );

  // ── Loading state ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6 animate-pulse">
        <div className="h-10 w-32 rounded-xl bg-white/5" />
        <div className="h-64 rounded-2xl bg-white/5 border border-white/10" />
        <div className="h-48 rounded-2xl bg-white/5 border border-white/10" />
        <div className="h-32 rounded-2xl bg-white/5 border border-white/10" />
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">设置</h1>
        <p className="text-zinc-400 text-sm mt-1">配置 AgentFlow Studio</p>
      </div>

      {/* ── Section 1: General ─────────────────────────────────────────── */}
      <GlassCard className="p-6 space-y-5">
        <h2 className="text-base font-semibold text-zinc-200 flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-blue-400" /> 通用
        </h2>

        {/* Theme */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-2">主题</label>
          <div className="flex gap-2">
            {([
              { value: 'light' as ThemeMode, label: '浅色', icon: Sun },
              { value: 'dark' as ThemeMode, label: '深色', icon: Moon },
              { value: 'system' as ThemeMode, label: '跟随系统', icon: Monitor },
            ]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={classNames(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border',
                  theme === opt.value
                    ? 'bg-white/10 border-white/20 text-zinc-200'
                    : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                )}
              >
                <opt.icon className="w-4 h-4" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Default project path */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">默认项目路径</label>
          <div className="flex gap-2">
            <Input
              value={settings.defaultProjectPath}
              onChange={(e) => setSettings((s) => ({ ...s, defaultProjectPath: e.target.value }))}
              placeholder="/home/user/projects"
              className="flex-1"
            />
            <Button variant="ghost" onClick={async () => {
              if (api && typeof api.dialog?.open === 'function') {
                const r = await api.dialog.open({ properties: ['openDirectory'] });
                if (r && !r.canceled && r.filePaths?.length) {
                  setSettings((s) => ({ ...s, defaultProjectPath: r.filePaths![0] }));
                }
              }
            }} icon={<FolderOpen className="w-4 h-4" />}>
              浏览
            </Button>
          </div>
        </div>

        {/* Default AI tool */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">默认 AI 工具</label>
          <select
            value={settings.defaultAITool}
            onChange={(e) => setSettings((s) => ({ ...s, defaultAITool: e.target.value as AITool }))}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-200 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-56"
          >
            <option value="Claude Code" className="bg-zinc-900">Claude Code</option>
            <option value="Codex" className="bg-zinc-900">Codex</option>
            <option value="Cursor" className="bg-zinc-900">Cursor</option>
            <option value="Other" className="bg-zinc-900">Other</option>
          </select>
        </div>

        {/* Read-only paths */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">数据路径</label>
            <Input value={settings.dataPath} readOnly className="opacity-60 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">应用版本</label>
            <Input value={settings.appVersion} readOnly className="opacity-60 cursor-not-allowed" />
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSaveSettings} loading={saving} icon={<Check className="w-4 h-4" />}>
            保存设置
          </Button>
          {saveMessage && (
            <span className="text-xs text-emerald-400 animate-in fade-in">{saveMessage}</span>
          )}
        </div>
      </GlassCard>

      {/* ── Section 2: AI Provider Configuration ────────────────────────── */}
      <GlassCard className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-200 flex items-center gap-2">
            <Server className="w-5 h-5 text-purple-400" /> AI Provider 配置
          </h2>
          <Button
            size="sm"
            onClick={() => { resetProviderForm(); setEditingProvider(null); setShowProviderModal(true); }}
            icon={<Plus className="w-4 h-4" />}
          >
            添加 Provider
          </Button>
        </div>

        {providers.length > 0 ? (
          <div className="space-y-3">
            {providers.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-zinc-200">{p.providerName}</h4>
                    {p.enabled ? (
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">已启用</Badge>
                    ) : (
                      <Badge className="bg-zinc-500/20 text-zinc-500 border-zinc-500/20">已禁用</Badge>
                    )}
                    {p.memoryEnabled && (
                      <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/30">记忆注入</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" /> {p.baseUrl}
                    </span>
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3 h-3" /> {p.modelName}
                    </span>
                    <span>
                      记忆: {p.memoryInjectionMode} ({p.maxMemoryItems} 条 / {p.maxMemoryChars} 字符)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-3">
                  <button
                    onClick={() => openEditProvider(p)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-zinc-300"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteProvider(p.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-500 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Server}
            title="暂无 Provider"
            description="添加 AI Provider 以配置 API 连接"
            actionLabel="添加 Provider"
            onAction={() => { resetProviderForm(); setShowProviderModal(true); }}
          />
        )}
      </GlassCard>

      {/* ── Section 3: Shared Memory Config ─────────────────────────────── */}
      <GlassCard className="p-6 space-y-4">
        <h2 className="text-base font-semibold text-zinc-200 flex items-center gap-2">
          <Database className="w-5 h-5 text-pink-400" /> 共享记忆配置
        </h2>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-2">
            新 Provider 默认记忆注入模式
          </label>
          <div className="flex gap-1">
            {(['off', 'minimal', 'balanced', 'full'] as MemoryInjectionMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setDefaultInjectionMode(mode)}
                className={classNames(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-all border',
                  defaultInjectionMode === mode
                    ? 'bg-white/10 border-white/20 text-zinc-200'
                    : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                )}
              >
                {{ off: '关闭', minimal: '最少', balanced: '均衡', full: '完整' }[mode]}
              </button>
            ))}
          </div>
          <p className="text-xs text-zinc-600 mt-2">
            此设置决定新添加的 Provider 默认使用哪种记忆注入模式。
          </p>
        </div>
      </GlassCard>

      {/* ── Section 4: Data Management ──────────────────────────────────── */}
      <GlassCard className="p-6 space-y-4">
        <h2 className="text-base font-semibold text-zinc-200 flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-amber-400" /> 数据管理
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" onClick={handleExportAll} icon={<Download className="w-4 h-4" />}>
            导出全部数据
          </Button>
          <Button variant="ghost" onClick={handleImportData} icon={<Upload className="w-4 h-4" />}>
            导入数据
          </Button>
          <Button
            variant="ghost"
            onClick={() => setShowClearDemo(true)}
            icon={<Trash2 className="w-4 h-4" />}
            className="text-red-400 hover:text-red-300"
          >
            清空演示数据
          </Button>
          <Button
            variant="ghost"
            onClick={() => setShowResetSettings(true)}
            icon={<RotateCcw className="w-4 h-4" />}
            className="text-amber-400 hover:text-amber-300"
          >
            重置设置
          </Button>
        </div>
      </GlassCard>

      {/* ── Section 5: About ────────────────────────────────────────────── */}
      <GlassCard className="p-6 space-y-4">
        <h2 className="text-base font-semibold text-zinc-200 flex items-center gap-2">
          <Info className="w-5 h-5 text-cyan-400" /> 关于
        </h2>
        <div className="space-y-2 text-sm text-zinc-400">
          <div className="flex justify-between py-2 border-b border-white/5">
            <span className="text-zinc-500">版本</span>
            <span className="text-zinc-300 font-mono">{settings.appVersion}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-white/5">
            <span className="text-zinc-500">技术栈</span>
            <span className="text-zinc-300">
              {settings.techStack?.join(', ') || 'Electron, React, TypeScript'}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-white/5">
            <span className="text-zinc-500">数据存储路径</span>
            <span className="text-zinc-300 font-mono text-xs">{settings.dataPath}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-white/5">
            <span className="text-zinc-500">默认 AI 工具</span>
            <span className="text-zinc-300">{settings.defaultAITool}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-zinc-500">Providers</span>
            <span className="text-zinc-300">{providers.filter((p) => p.enabled).length} 已启用 / {providers.length} 总计</span>
          </div>
        </div>

        <div className="pt-4 flex items-center gap-4 text-xs text-zinc-600">
          <Sparkles className="w-3.5 h-3.5" />
          AgentFlow Studio — AI-powered project planning and development management
        </div>
      </GlassCard>

      {/* ── Provider add/edit modal ─────────────────────────────────────── */}
      <Modal
        open={showProviderModal || !!editingProvider}
        onClose={() => { setShowProviderModal(false); setEditingProvider(null); resetProviderForm(); }}
        title={editingProvider ? '编辑 Provider' : '添加 Provider'}
        size="lg"
      >
        {renderProviderForm()}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
          <Button
            variant="ghost"
            onClick={() => { setShowProviderModal(false); setEditingProvider(null); resetProviderForm(); }}
          >
            取消
          </Button>
          <Button
            onClick={editingProvider ? handleUpdateProvider : handleAddProvider}
            icon={editingProvider ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          >
            {editingProvider ? '保存修改' : '添加'}
          </Button>
        </div>
      </Modal>

      {/* ── Clear demo data confirmation ────────────────────────────────── */}
      <Modal open={showClearDemo} onClose={() => setShowClearDemo(false)} title="确认清空演示数据" size="sm">
        <div className="text-center py-4">
          <Trash2 className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-zinc-200 font-medium mb-1">清空所有演示数据？</p>
          <p className="text-sm text-zinc-500">
            此操作将删除所有演示项目、任务、Prompt 和记忆数据，不可撤销。
          </p>
        </div>
        <div className="flex justify-center gap-3 mt-4 pt-4 border-t border-white/10">
          <Button variant="ghost" onClick={() => setShowClearDemo(false)}>取消</Button>
          <Button variant="danger" onClick={handleClearDemo} icon={<Trash2 className="w-4 h-4" />}>
            确认清空
          </Button>
        </div>
      </Modal>

      {/* ── Reset settings confirmation ─────────────────────────────────── */}
      <Modal open={showResetSettings} onClose={() => setShowResetSettings(false)} title="确认重置设置" size="sm">
        <div className="text-center py-4">
          <RotateCcw className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <p className="text-zinc-200 font-medium mb-1">重置所有设置？</p>
          <p className="text-sm text-zinc-500">
            设置将恢复为默认值。项目数据不会被删除。
          </p>
        </div>
        <div className="flex justify-center gap-3 mt-4 pt-4 border-t border-white/10">
          <Button variant="ghost" onClick={() => setShowResetSettings(false)}>取消</Button>
          <Button variant="danger" onClick={handleResetSettings} icon={<RotateCcw className="w-4 h-4" />}>
            确认重置
          </Button>
        </div>
      </Modal>
    </div>
  );
}
