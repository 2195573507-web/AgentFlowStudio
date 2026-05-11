import React from 'react';
import { Activity, Edit3, KeyRound, PauseCircle, Plus, RefreshCw, RotateCcw, Server, ShieldCheck, Trash2 } from 'lucide-react';
import { Badge, Button, EmptyState, Input, Modal, SurfaceCard } from '../components';
import { api } from '../lib/api';
import type { ProviderPreset, ProviderSetting } from '../lib/types';
import { PROVIDER_PRESETS, presetToProvider } from '../../shared/providerPresets';
import { generateId } from '../lib/utils';

const emptyProvider: Pick<ProviderSetting, 'providerName' | 'baseUrl' | 'apiKey' | 'modelName' | 'enabled' | 'memoryEnabled' | 'memoryInjectionMode' | 'maxMemoryItems' | 'maxMemoryChars'> = {
  providerName: '',
  baseUrl: '',
  apiKey: '',
  modelName: '',
  enabled: true,
  memoryEnabled: true,
  memoryInjectionMode: 'balanced' as const,
  maxMemoryItems: 10,
  maxMemoryChars: 8000,
};

export default function ProviderHub() {
  const [providers, setProviders] = React.useState<ProviderSetting[]>([]);
  const [presets, setPresets] = React.useState<ProviderPreset[]>(PROVIDER_PRESETS);
  const [active, setActive] = React.useState({ providerRef: '', model: '' });
  const [loading, setLoading] = React.useState(true);
  const [message, setMessage] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState('');
  const [deleteTarget, setDeleteTarget] = React.useState<ProviderSetting | null>(null);
  const [disableTarget, setDisableTarget] = React.useState<ProviderSetting | null>(null);
  const [presetId, setPresetId] = React.useState('openai-compatible');
  const [form, setForm] = React.useState<Partial<ProviderSetting>>(emptyProvider);

  const load = React.useCallback(async () => {
    setLoading(true);
    const [providerList, presetList, activeResult] = await Promise.all([
      api.providers.list().catch(() => []),
      api.providers.presets().catch(() => []),
      api.providers.getActive().catch(() => ({ providerRef: '', model: '' })),
    ]);
    setProviders(Array.isArray(providerList) ? providerList : []);
    if (Array.isArray(presetList) && presetList.length) setPresets(presetList);
    if (!('error' in activeResult)) setActive(activeResult);
    setLoading(false);
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const resetFromPreset = (nextPresetId = presetId) => {
    const preset = presets.find((item) => item.providerId === nextPresetId) ?? presets[0];
    const base = preset ? presetToProvider(preset) : {};
    setPresetId(nextPresetId);
    setForm({ ...emptyProvider, ...base, apiKey: '' });
    setEditingId('');
  };

  const openEdit = (provider: ProviderSetting, rotateKey = false) => {
    setEditingId(provider.id);
    setPresetId(provider.providerId ?? 'custom');
    setForm({
      ...emptyProvider,
      ...provider,
      apiKey: rotateKey ? '' : provider.apiKey || '',
    });
    setOpen(true);
  };

  const save = async () => {
    const preset = presets.find((item) => item.providerId === presetId) ?? presets[0];
    const payload = {
      ...(preset ? presetToProvider(preset, form) : {}),
      ...form,
      providerId: preset?.providerId ?? presetId,
      id: editingId || generateId(),
    } as ProviderSetting;
    const saved = editingId ? await api.providers.update(editingId, payload) : await api.providers.create(payload);
    if (!saved) setMessage('Provider save failed.');
    else if ('error' in saved) setMessage(typeof saved.error === 'string' ? saved.error : 'Provider save failed.');
    else {
      setMessage(`${editingId ? 'Updated' : 'Saved'} ${saved.providerName}`);
      setOpen(false);
      setEditingId('');
      await load();
    }
  };

  const test = async (provider: ProviderSetting) => {
    const result = await api.providers.testConnection(provider.id);
    setMessage('error' in result ? String(result.error) : String(result.message ?? 'Provider test finished.'));
    await load();
  };

  const switchProvider = async (provider: ProviderSetting) => {
    const result = await api.providers.setActive({ providerRef: provider.id, model: provider.modelName, scope: 'workspace' });
    setMessage('error' in result ? result.error : `Active provider: ${provider.providerName} / ${provider.modelName}`);
    await load();
  };

  const toggleEnabled = async (provider: ProviderSetting, enabled: boolean) => {
    const result = await api.providers.update(provider.id, { enabled });
    setMessage(!result ? 'Provider update failed.' : 'error' in result ? String(result.error) : `${provider.providerName} ${enabled ? 'enabled' : 'disabled'}.`);
    setDisableTarget(null);
    await load();
  };

  const removeProvider = async (provider: ProviderSetting) => {
    await api.providers.delete(provider.id);
    setMessage(`Deleted ${provider.providerName}.`);
    setDeleteTarget(null);
    await load();
  };

  if (loading) return <div className="mx-auto max-w-7xl p-6"><div className="surface-card p-6">Loading Provider Hub...</div></div>;

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-6">
      <section className="surface-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Provider Hub</h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Create, test, switch, and audit OpenAI-compatible, Anthropic-compatible, Gemini, Ollama, and custom providers. Raw keys stay in the main process.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={load} icon={<RefreshCw className="h-4 w-4" />}>Refresh</Button>
            <Button onClick={() => { resetFromPreset(); setOpen(true); }} icon={<Plus className="h-4 w-4" />}>Add Provider</Button>
          </div>
        </div>
      </section>

      {message && <div className="rounded-tool border border-accent-500/30 bg-accent-500/10 p-3 text-sm text-[var(--accent)]">{message}</div>}

      {providers.length === 0 ? (
        <SurfaceCard className="p-8">
          <EmptyState icon={Server} title="No providers configured" description="Add a local mock provider for CI-safe routing or configure a compatible provider with masked credentials." actionLabel="Add Provider" onAction={() => setOpen(true)} />
        </SurfaceCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {providers.map((provider) => (
            <SurfaceCard key={provider.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-[var(--text-primary)]">{provider.providerName}</h2>
                  <p className="mt-1 truncate font-mono text-xs text-[var(--text-muted)]">{provider.baseUrl}</p>
                </div>
                {active.providerRef === provider.id && <Badge>Active</Badge>}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge>{provider.providerId ?? 'custom'}</Badge>
                <Badge>{provider.modelName}</Badge>
                <Badge>{provider.enabled === false ? 'disabled' : 'enabled'}</Badge>
                <Badge>{provider.lastTestStatus ?? 'untested'}</Badge>
                {provider.supportsStreaming && <Badge>streaming</Badge>}
              </div>
              <div className="mt-4 rounded-tool border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-xs text-[var(--text-secondary)]">
                <div className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5" /> Key: {provider.apiKey || provider.needsApiKey === false ? 'masked or not required' : 'missing'}</div>
                <div className="mt-1 flex items-center gap-2"><Activity className="h-3.5 w-3.5" /> {provider.lastTestMessage ?? 'Run diagnostics before making this provider active.'}</div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => void test(provider)}>Test</Button>
                <Button size="sm" onClick={() => void switchProvider(provider)}>Set Active</Button>
                <Button size="sm" variant="ghost" onClick={() => openEdit(provider)} aria-label={`Edit ${provider.providerName}`}>
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => openEdit(provider, true)} aria-label={`Rotate key for ${provider.providerName}`}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
                {provider.enabled === false ? (
                  <Button size="sm" variant="secondary" onClick={() => void toggleEnabled(provider, true)}>Enable</Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => setDisableTarget(provider)} aria-label={`Disable ${provider.providerName}`}>
                    <PauseCircle className="h-4 w-4" />
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="text-red-500" onClick={() => setDeleteTarget(provider)} aria-label={`Delete ${provider.providerName}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </SurfaceCard>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => { setOpen(false); setEditingId(''); }} title={editingId ? 'Edit Provider' : 'Add Provider'} size="lg">
        <div className="space-y-4">
          <label className="block text-xs font-semibold text-[var(--text-secondary)]">Preset</label>
          <select className="control-input" value={presetId} onChange={(event) => resetFromPreset(event.target.value)}>
            {presets.map((preset) => <option key={preset.providerId} value={preset.providerId}>{preset.displayName}</option>)}
            <option value="localai-mock">LocalAI Mock</option>
          </select>
          <div className="grid gap-3 md:grid-cols-2">
            <Input label="Name" value={form.providerName} onChange={(event) => setForm((prev) => ({ ...prev, providerName: event.target.value }))} />
            <Input label="Model" value={form.modelName} onChange={(event) => setForm((prev) => ({ ...prev, modelName: event.target.value }))} />
          </div>
          <Input label="Base URL" value={form.baseUrl} onChange={(event) => setForm((prev) => ({ ...prev, baseUrl: event.target.value }))} />
          <Input label={editingId ? 'API Key / rotate credential' : 'API Key'} type="password" icon={<KeyRound className="h-4 w-4" />} value={form.apiKey} onChange={(event) => setForm((prev) => ({ ...prev, apiKey: event.target.value }))} placeholder="Stored protected; renderer sees only a mask after save." />
          <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <input type="checkbox" checked={form.enabled !== false} onChange={(event) => setForm((prev) => ({ ...prev, enabled: event.target.checked }))} />
            Enabled for routing
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2 border-t border-[var(--border)] pt-4">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save}>{editingId ? 'Update Provider' : 'Save Provider'}</Button>
        </div>
      </Modal>

      <Modal open={!!disableTarget} onClose={() => setDisableTarget(null)} title="Disable Provider" size="sm">
        <p className="text-sm text-[var(--text-secondary)]">Disable {disableTarget?.providerName}? Model Router will skip it and audit the change.</p>
        <div className="mt-5 flex justify-end gap-2 border-t border-[var(--border)] pt-4">
          <Button variant="ghost" onClick={() => setDisableTarget(null)}>Cancel</Button>
          <Button variant="secondary" onClick={() => disableTarget && void toggleEnabled(disableTarget, false)}>Disable</Button>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Provider" size="sm">
        <p className="text-sm text-[var(--text-secondary)]">Delete {deleteTarget?.providerName}? Runtime profiles and existing traces remain, but this provider can no longer be routed.</p>
        <div className="mt-5 flex justify-end gap-2 border-t border-[var(--border)] pt-4">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => deleteTarget && void removeProvider(deleteTarget)}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
