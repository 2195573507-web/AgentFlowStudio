import React from 'react';
import { AlertCircle, CheckCircle2, RefreshCw, Stethoscope } from 'lucide-react';
import { Badge, Button, EmptyState, SurfaceCard } from '../components';
import { api } from '../lib/api';
import type { NexusHealthCheckResult, ProviderSetting } from '../lib/types';

export default function HealthMonitor() {
  const [providers, setProviders] = React.useState<ProviderSetting[]>([]);
  const [latest, setLatest] = React.useState<NexusHealthCheckResult[]>([]);
  const [byStatus, setByStatus] = React.useState<Record<string, number>>({});
  const [message, setMessage] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    const [providerResult, healthResult] = await Promise.all([
      api.providers.list().catch(() => []),
      api.health.summary().catch(() => ({ latest: [], byStatus: {} })),
    ]);
    setProviders(Array.isArray(providerResult) ? providerResult : []);
    if (!('error' in healthResult)) {
      setLatest(healthResult.latest);
      setByStatus(healthResult.byStatus);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const check = async (providerId: string) => {
    const result = await api.health.checkProvider(providerId);
    setMessage('error' in result ? result.error : `${result.providerName}: ${result.status} - ${result.suggestion}`);
    await load();
  };

  if (loading) return <div className="mx-auto max-w-7xl p-6"><div className="surface-card p-6">Loading Health Monitor...</div></div>;

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-6">
      <section className="surface-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Health Monitor</h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Run local provider diagnostics, see live-ready status, trend categories, and repair suggestions.</p>
          </div>
          <Button variant="secondary" onClick={load} icon={<RefreshCw className="h-4 w-4" />}>Refresh</Button>
        </div>
      </section>
      {message && <div className="rounded-tool border border-accent-500/30 bg-accent-500/10 p-3 text-sm text-[var(--accent)]">{message}</div>}
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
        {Object.entries(byStatus).map(([status, count]) => <SurfaceCard key={status} className="p-4"><div className="text-xs text-[var(--text-muted)]">{status}</div><div className="mt-2 text-xl font-bold">{count}</div></SurfaceCard>)}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {providers.map((provider) => {
          const checkResult = latest.find((item) => item.providerId === provider.id);
          return (
            <SurfaceCard key={provider.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div><h2 className="font-semibold">{provider.providerName}</h2><p className="mt-1 font-mono text-xs text-[var(--text-muted)]">{provider.baseUrl}</p></div>
                <Badge>{checkResult?.status ?? provider.lastTestStatus ?? 'untested'}</Badge>
              </div>
              <div className="mt-4 space-y-2">
                {(checkResult?.checks ?? []).map((item) => (
                  <div key={item.name} className="flex items-start gap-2 rounded-tool bg-[var(--surface-muted)] p-2 text-sm">
                    {item.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" /> : <AlertCircle className="mt-0.5 h-4 w-4 text-amber-500" />}
                    <div><div className="font-semibold">{item.name}</div><div className="text-xs text-[var(--text-secondary)]">{item.message}</div></div>
                  </div>
                ))}
                {checkResult?.suggestion && <p className="text-sm text-[var(--text-secondary)]">{checkResult.suggestion}</p>}
              </div>
              <Button className="mt-4" size="sm" onClick={() => void check(provider.id)} icon={<Stethoscope className="h-4 w-4" />}>Run check</Button>
            </SurfaceCard>
          );
        })}
      </div>
      {providers.length === 0 && <SurfaceCard className="p-8"><EmptyState icon={Stethoscope} title="No providers to check" description="Create a provider in Provider Hub, then return here for diagnostics." /></SurfaceCard>}
    </div>
  );
}
