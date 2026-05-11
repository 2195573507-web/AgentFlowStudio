import React from 'react';
import { GitFork, RefreshCw, Route } from 'lucide-react';
import { Badge, Button, EmptyState, SurfaceCard } from '../components';
import { api } from '../lib/api';
import type { NexusRouterDecision, ProviderSetting } from '../lib/types';

export default function ModelRouter() {
  const [providers, setProviders] = React.useState<ProviderSetting[]>([]);
  const [decisions, setDecisions] = React.useState<NexusRouterDecision[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    const [providerResult, decisionResult] = await Promise.all([
      api.providers.list().catch(() => []),
      api.router.decisions().catch(() => []),
    ]);
    setProviders(Array.isArray(providerResult) ? providerResult : []);
    setDecisions(Array.isArray(decisionResult) ? decisionResult : []);
    setLoading(false);
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  if (loading) return <div className="mx-auto max-w-7xl p-6"><div className="surface-card p-6">Loading Model Router...</div></div>;

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-6">
      <section className="surface-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Model Router</h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Explain provider/model selection by tags, requested model, fallback, quota, cooldown, and route trace.</p>
          </div>
          <Button variant="secondary" onClick={load} icon={<RefreshCw className="h-4 w-4" />}>Refresh</Button>
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {providers.map((provider) => (
          <SurfaceCard key={provider.id} className="p-5">
            <div className="flex items-start justify-between gap-3"><h2 className="font-semibold">{provider.providerName}</h2><Badge>{provider.enabled === false ? 'disabled' : 'enabled'}</Badge></div>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{provider.modelName}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(provider.tags ?? []).map((tag) => <Badge key={tag}>{tag}</Badge>)}
              {provider.cooldownUntil && <Badge>cooldown</Badge>}
              {(provider.dailyQuota ?? 0) > 0 && <Badge>daily {provider.dailyQuota}</Badge>}
            </div>
          </SurfaceCard>
        ))}
      </div>
      <SurfaceCard className="p-5">
        <h2 className="flex items-center gap-2 text-base font-semibold"><Route className="h-4 w-4" /> Recent decisions</h2>
        <div className="mt-4 space-y-2">
          {decisions.map((decision) => (
            <div key={decision.id} className="rounded-tool border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2"><Badge>{decision.quotaState}</Badge><Badge>{decision.fallbackUsed ? 'fallback' : 'primary'}</Badge><span className="font-semibold">{decision.providerName ?? 'diagnostic'} / {decision.model}</span></div>
              <p className="mt-2 text-xs text-[var(--text-secondary)]">{decision.reason}</p>
            </div>
          ))}
          {decisions.length === 0 && <EmptyState icon={GitFork} title="No routing decisions yet" description="Use the gateway, runtime switcher, or workflow run to create traceable decisions." />}
        </div>
      </SurfaceCard>
    </div>
  );
}
