import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Cpu,
  Database,
  Download,
  Eye,
  EyeOff,
  Globe,
  HardDrive,
  Key,
  Plus,
  Puzzle,
  RefreshCw,
  Server,
  Settings2,
  Shield,
  SlidersHorizontal,
  Trash2,
  Upload,
} from 'lucide-react';
import { api } from '../lib/api';
import { Badge, Button, EmptyState, GlassCard, Input, Modal } from '../components/';
import type {
  AppSettings,
  MemoryInjectionMode,
  ProviderPreset,
  ProviderSetting,
  SkillRegistryEntry,
  ThemeMode,
} from '../lib/types';
import { PROVIDER_PRESETS, presetToProvider } from '../../shared/providerPresets';
import { classNames, generateId } from '../lib/utils';

const MASKED_API_KEY_PREFIX = 'Saved key ending in ';

function isMaskedApiKey(value: string): boolean {
  return value === '' || value === '[REDACTED]' || value.startsWith(MASKED_API_KEY_PREFIX);
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  defaultProjectPath: '',
  defaultAITool: 'Claude Code',
  dataPath: '',
  appVersion: '1.1.1',
};

const emptyProviderForm = {
  providerName: '',
  baseUrl: '',
  apiKey: '',
  modelName: '',
  enabled: true,
  memoryEnabled: true,
  memoryInjectionMode: 'balanced' as MemoryInjectionMode,
  maxMemoryItems: 10,
  maxMemoryChars: 8000,
};

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [theme, setTheme] = useState<ThemeMode>('system');
  const [providers, setProviders] = useState<ProviderSetting[]>([]);
  const [presets, setPresets] = useState<ProviderPreset[]>(PROVIDER_PRESETS);
  const [active, setActive] = useState({ providerRef: '', model: '', agentDefaultProviderRef: '' });
  const [mcpAllowlist, setMcpAllowlist] = useState<Array<Record<string, unknown>>>([]);
  const [skillsRegistry, setSkillsRegistry] = useState<SkillRegistryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ProviderSetting | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState('openai-compatible');
  const [showApiKey, setShowApiKey] = useState(false);
  const [providerForm, setProviderForm] = useState(emptyProviderForm);
  const [importText, setImportText] = useState('');
  const [importPreview, setImportPreview] = useState<unknown>(null);
  const [exportManifest, setExportManifest] = useState<string>('');

  const activeProvider = useMemo(
    () => providers.find((provider) => provider.id === active.providerRef),
    [active.providerRef, providers],
  );

  const resetProviderForm = useCallback((presetId = selectedPresetId) => {
    const preset = presets.find((item) => item.providerId === presetId) ?? presets[0];
    const base = preset ? presetToProvider(preset) : null;
    setProviderForm({
      ...emptyProviderForm,
      providerName: base?.providerName ?? '',
      baseUrl: base?.baseUrl ?? '',
      modelName: base?.modelName ?? '',
      memoryInjectionMode: 'balanced',
    });
    setSelectedPresetId(presetId);
    setShowApiKey(false);
  }, [presets, selectedPresetId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsResult, providerList, presetList, activeConfig, mcpEntries, registry] = await Promise.all([
        api.settings.getAll(),
        api.providers.list(),
        api.providers.presets(),
        api.providers.getActive(),
        api.mcp.allowlist().catch(() => []),
        api.skills.registry().catch(() => []),
      ]);
      setSettings({ ...DEFAULT_SETTINGS, ...settingsResult });
      setTheme((settingsResult.theme as ThemeMode) ?? 'system');
      setProviders(Array.isArray(providerList) ? providerList : []);
      if (Array.isArray(presetList) && presetList.length > 0) setPresets(presetList);
      if (!('error' in activeConfig)) {
        setActive({
          providerRef: activeConfig.providerRef,
          model: activeConfig.model,
          agentDefaultProviderRef: activeConfig.agentDefaultProviderRef ?? '',
        });
      }
      if (Array.isArray(mcpEntries)) setMcpAllowlist(mcpEntries as Array<Record<string, unknown>>);
      if (Array.isArray(registry)) setSkillsRegistry(registry);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    if (theme === 'system') root.classList.add(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    else root.classList.add(theme);
  }, [theme]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      await api.settings.update({ ...settings, theme });
      setMessage('设置已保存。');
    } finally {
      setSaving(false);
      window.setTimeout(() => setMessage(null), 2200);
    }
  };

  const saveProvider = async () => {
    if (!providerForm.providerName.trim() || !providerForm.modelName.trim()) return;
    const preset = presets.find((item) => item.providerId === selectedPresetId) ?? presets[0];
    const payload = {
      ...(preset ? presetToProvider(preset, providerForm) : {}),
      ...providerForm,
      providerId: preset?.providerId ?? selectedPresetId,
      id: editingProvider?.id ?? generateId(),
    } as ProviderSetting;
    const saved = editingProvider
      ? await api.providers.update(editingProvider.id, payload)
      : await api.providers.create(payload);
    if (saved && typeof saved === 'object' && 'error' in saved) {
      setMessage(`Provider 保存失败：${saved.error}`);
      return;
    }
    setShowProviderModal(false);
    setEditingProvider(null);
    resetProviderForm();
    await load();
  };

  const editProvider = (provider: ProviderSetting) => {
    setEditingProvider(provider);
    setSelectedPresetId(provider.providerId ?? 'custom-provider');
    setProviderForm({
      providerName: provider.providerName,
      baseUrl: provider.baseUrl,
      apiKey: isMaskedApiKey(provider.apiKey) ? '' : provider.apiKey,
      modelName: provider.modelName,
      enabled: provider.enabled,
      memoryEnabled: provider.memoryEnabled,
      memoryInjectionMode: provider.memoryInjectionMode,
      maxMemoryItems: provider.maxMemoryItems,
      maxMemoryChars: provider.maxMemoryChars,
    });
    setShowProviderModal(true);
  };

  const testProvider = async (provider: ProviderSetting) => {
    const result = await api.providers.testConnection(provider.id);
    setMessage('error' in result ? `测试失败：${result.error}` : `${result.ok ? '测试通过' : '测试失败'}：${result.message}`);
    await load();
  };

  const switchProvider = async (provider: ProviderSetting) => {
    const result = await api.providers.setActive({ providerRef: provider.id, model: provider.modelName, scope: 'workspace' });
    if ('error' in result) {
      setMessage(result.error === 'provider_secret_missing' ? '请先为该 Provider 配置 API Key。' : `切换失败：${result.error}`);
      return;
    }
    setActive({ providerRef: result.providerRef, model: result.model, agentDefaultProviderRef: result.providerRef });
    setMessage(`当前模型已切换到 ${provider.providerName} / ${provider.modelName}`);
  };

  const exportConfig = async () => {
    const bundle = await api.config.exportAll();
    if (bundle && typeof bundle === 'object' && 'error' in bundle) {
      setMessage(`导出失败：${bundle.error}`);
      return;
    }
    await api.export.json(bundle, `localai-nexus-config-${Date.now()}.json`);
    setExportManifest(JSON.stringify((bundle as { manifest?: unknown }).manifest ?? {}, null, 2));
  };

  const previewImport = async () => {
    const preview = await api.config.importPreview(importText);
    setImportPreview(preview);
  };

  const applyImport = async () => {
    const result = await api.config.importApply(importText);
    setImportPreview(result);
    await load();
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6 animate-pulse">
        <div className="h-10 w-40 rounded-lg bg-white/10" />
        <div className="h-52 rounded-lg bg-white/10" />
        <div className="h-52 rounded-lg bg-white/10" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-zinc-100">设置</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">
          管理主题、Provider、当前模型、MCP allowlist、Skills registry 和安全导入导出。
        </p>
      </div>

      {message && (
        <div className="rounded-lg border border-blue-400/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-700 dark:text-blue-200">
          {message}
        </div>
      )}

      <GlassCard className="p-6 space-y-5">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-zinc-100">
          <Settings2 className="h-5 w-5 text-blue-500" /> 通用设置
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400">
            主题
            <select value={theme} onChange={(event) => setTheme(event.target.value as ThemeMode)} className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--glass-surface)] px-3 py-2 text-sm text-slate-900 dark:text-zinc-100">
              <option value="system">跟随系统</option>
              <option value="light">浅色</option>
              <option value="dark">深色</option>
            </select>
          </label>
          <label className="space-y-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400">
            默认项目路径
            <Input value={settings.defaultProjectPath} onChange={(event) => setSettings((prev) => ({ ...prev, defaultProjectPath: event.target.value }))} />
          </label>
          <label className="space-y-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400">
            数据目录
            <Input value={settings.dataPath} readOnly className="font-mono opacity-70" />
          </label>
          <label className="space-y-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400">
            版本
            <Input value={settings.appVersion ?? settings.version ?? ''} readOnly className="font-mono tabular-nums opacity-70" />
          </label>
        </div>
        <Button onClick={saveSettings} loading={saving} icon={<Check className="h-4 w-4" />}>保存设置</Button>
      </GlassCard>

      <GlassCard className="p-6 space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-zinc-100">
              <SlidersHorizontal className="h-5 w-5 text-purple-500" /> 当前模型配置
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">
              当前：{activeProvider ? `${activeProvider.providerName} / ${active.model || activeProvider.modelName}` : '尚未选择 Provider'}
            </p>
          </div>
          <Button onClick={() => { setEditingProvider(null); resetProviderForm(); setShowProviderModal(true); }} icon={<Plus className="h-4 w-4" />}>
            配置真实模型
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {providers.map((provider) => (
            <div key={provider.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-900 dark:text-zinc-100">{provider.providerName}</h3>
                    {active.providerRef === provider.id && <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-500">当前</Badge>}
                    {provider.lastTestStatus === 'failure' && <Badge className="border-red-500/30 bg-red-500/15 text-red-400">测试失败</Badge>}
                    {provider.apiKey === '' && provider.needsApiKey !== false && <Badge className="border-amber-500/30 bg-amber-500/15 text-amber-500">缺少密钥</Badge>}
                  </div>
                  <p className="mt-2 flex items-center gap-1 truncate text-xs text-slate-500 dark:text-zinc-500">
                    <Globe className="h-3 w-3" /> <span className="font-mono">{provider.baseUrl}</span>
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-500">
                    <Cpu className="h-3 w-3" /> <span>{provider.modelName}</span>
                  </p>
                  {provider.lastTestMessage && <p className="mt-2 text-xs text-slate-500 dark:text-zinc-500">{provider.lastTestMessage}</p>}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="ghost" onClick={() => void switchProvider(provider)}>一键切换</Button>
                <Button size="sm" variant="ghost" onClick={() => void testProvider(provider)}>测试连接</Button>
                <Button size="sm" variant="ghost" onClick={() => editProvider(provider)}>编辑</Button>
                <Button size="sm" variant="ghost" onClick={() => void api.providers.delete(provider.id).then(load)} className="text-red-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        {providers.length === 0 && (
          <EmptyState icon={Server} title="暂无 Provider" description="可以先体验 Demo Agent，或选择一个 preset 配置真实模型。" actionLabel="添加 Provider" onAction={() => setShowProviderModal(true)} />
        )}
      </GlassCard>

      <GlassCard className="p-6 space-y-5">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-zinc-100">
          <Server className="h-5 w-5 text-purple-500" /> Provider Preset Center
        </h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {presets.map((preset) => (
            <button
              key={preset.providerId}
              type="button"
              onClick={() => { setEditingProvider(null); resetProviderForm(preset.providerId); setShowProviderModal(true); }}
              className="rounded-lg border border-white/10 bg-white/5 p-4 text-left transition-colors hover:bg-white/10"
            >
              <div className="font-semibold text-slate-900 dark:text-zinc-100">{preset.displayName}</div>
              <div className="mt-2 text-xs text-slate-500 dark:text-zinc-500">{preset.docsHint}</div>
              <div className="mt-3 flex flex-wrap gap-1">
                {preset.needsApiKey ? <Badge>API Key</Badge> : <Badge>本地无密钥</Badge>}
                {preset.supportsStreaming && <Badge>Streaming</Badge>}
                {preset.supportsVision && <Badge>Vision</Badge>}
              </div>
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-6 space-y-5">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-zinc-100">
          <Shield className="h-5 w-5 text-emerald-500" /> MCP & Skills 管理
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h3 className="font-semibold text-slate-900 dark:text-zinc-100">MCP allowlist</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">当前只管理 allow/deny 规则和沙箱元数据，不直接执行外部工具。</p>
            <div className="mt-3 space-y-2">
              {mcpAllowlist.slice(0, 5).map((entry) => (
                <div key={String(entry.id)} className="flex items-center justify-between rounded-lg bg-black/5 px-3 py-2 text-xs dark:bg-white/5">
                  <span className="font-mono">{String(entry.serverName)}:{String(entry.toolName)}</span>
                  <Badge>{entry.enabled ? 'enabled' : 'disabled'}</Badge>
                </div>
              ))}
              {mcpAllowlist.length === 0 && <p className="text-sm text-slate-500 dark:text-zinc-500">暂无规则。MCP 调用默认由网关拒绝。</p>}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-zinc-100">
              <Puzzle className="h-4 w-4" /> Skills registry
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">本轮是本地管理骨架，不自动执行外部 skill。</p>
            <div className="mt-3 space-y-2">
              {skillsRegistry.map((skill) => (
                <div key={skill.id} className="flex items-center justify-between gap-2 rounded-lg bg-black/5 px-3 py-2 text-xs dark:bg-white/5">
                  <span>{skill.name}</span>
                  <button
                    type="button"
                    className={classNames('rounded-md px-2 py-1', skill.enabled ? 'bg-emerald-500/15 text-emerald-500' : 'bg-zinc-500/15 text-zinc-500')}
                    onClick={() => void api.skills.toggleRegistry(skill.id, !skill.enabled).then(load)}
                  >
                    {skill.enabled ? '启用' : '禁用'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6 space-y-5">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-zinc-100">
          <HardDrive className="h-5 w-5 text-amber-500" /> 配置导入 / 导出
        </h2>
        <p className="text-sm text-slate-600 dark:text-zinc-400">
          导出包含 provider metadata、项目默认 provider 引用、Agent metadata、模板、MCP allowlist 和 skills registry；API Key 只会省略或脱敏。
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" onClick={exportConfig} icon={<Download className="h-4 w-4" />}>导出安全配置</Button>
          <Button variant="ghost" onClick={previewImport} icon={<AlertTriangle className="h-4 w-4" />}>预览导入风险</Button>
          <Button variant="ghost" onClick={applyImport} icon={<Upload className="h-4 w-4" />}>应用导入</Button>
        </div>
        <textarea
          value={importText}
          onChange={(event) => setImportText(event.target.value)}
          placeholder="粘贴 LocalAI Nexus 配置 JSON，导入前会校验 schema、大小、字段白名单和风险。"
          className="min-h-[120px] w-full rounded-lg border border-white/10 bg-white/5 p-3 font-mono text-sm text-slate-900 dark:text-zinc-100"
        />
        {(exportManifest || importPreview !== null) && (
          <pre className="max-h-56 overflow-auto rounded-lg bg-black/80 p-3 text-xs text-zinc-100">
            {exportManifest || JSON.stringify(importPreview, null, 2)}
          </pre>
        )}
      </GlassCard>

      <Modal
        open={showProviderModal}
        onClose={() => { setShowProviderModal(false); setEditingProvider(null); resetProviderForm(); }}
        title={editingProvider ? '编辑 Provider' : '添加 Provider'}
        size="lg"
      >
        <div className="space-y-4">
          {!editingProvider && (
            <label className="block text-xs font-medium text-zinc-400">
              Provider preset
              <select
                value={selectedPresetId}
                onChange={(event) => resetProviderForm(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100"
              >
                {presets.map((preset) => <option key={preset.providerId} value={preset.providerId} className="bg-zinc-900">{preset.displayName}</option>)}
              </select>
            </label>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-xs font-medium text-zinc-400">名称<Input value={providerForm.providerName} onChange={(event) => setProviderForm((prev) => ({ ...prev, providerName: event.target.value }))} /></label>
            <label className="block text-xs font-medium text-zinc-400">模型<Input value={providerForm.modelName} onChange={(event) => setProviderForm((prev) => ({ ...prev, modelName: event.target.value }))} /></label>
          </div>
          <label className="block text-xs font-medium text-zinc-400">Base URL<Input value={providerForm.baseUrl} onChange={(event) => setProviderForm((prev) => ({ ...prev, baseUrl: event.target.value }))} className="font-mono" /></label>
          <label className="block text-xs font-medium text-zinc-400">
            API Key
            <div className="relative mt-1.5">
              <Input type={showApiKey ? 'text' : 'password'} value={providerForm.apiKey} onChange={(event) => setProviderForm((prev) => ({ ...prev, apiKey: event.target.value }))} placeholder="保存后只显示末四位，日志和导出不会包含明文。" className="font-mono pr-10" />
              <button type="button" onClick={() => setShowApiKey((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-zinc-300"><input type="checkbox" checked={providerForm.enabled} onChange={(event) => setProviderForm((prev) => ({ ...prev, enabled: event.target.checked }))} /> 启用</label>
            <label className="flex items-center gap-2 text-sm text-zinc-300"><input type="checkbox" checked={providerForm.memoryEnabled} onChange={(event) => setProviderForm((prev) => ({ ...prev, memoryEnabled: event.target.checked }))} /> 记忆注入</label>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-4">
          <Button variant="ghost" onClick={() => setShowProviderModal(false)}>取消</Button>
          <Button onClick={saveProvider} icon={<Key className="h-4 w-4" />}>保存 Provider</Button>
        </div>
      </Modal>
    </div>
  );
}
