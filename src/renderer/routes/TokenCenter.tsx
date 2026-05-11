import React from 'react';
import { Activity, BarChart3, Clock, Database, RefreshCw, Zap } from 'lucide-react';
import { Badge, Button, EmptyState, SurfaceCard } from '../components';
import { api } from '../lib/api';
import type { NexusUsageRecord, NexusUsageSummary, ProviderSetting } from '../lib/types';

export default function TokenCenter() {
  const [summary, setSummary] = React.useState<NexusUsageSummary | null>(null);
  const [records, setRecords] = React.useState<NexusUsageRecord[]>([]);
  const [providers, setProviders] = React.useState<ProviderSetting[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    const [summaryResult, recordsResult, providerResult] = await Promise.all([
      api.usage.summary().catch(() => null),
      api.usage.list({ limit: 100 }).catch(() => []),
      api.providers.list().catch(() => []),
    ]);
    if (summaryResult && typeof summaryResult === 'object' && !('error' in summaryResult)) setSummary(summaryResult);
    setRecords(Array.isArray(recordsResult) ? recordsResult : []);
    setProviders(Array.isArray(providerResult) ? providerResult : []);
    setLoading(false);
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const quotaRows = providers.map((provider) => ({
    provider,
    dailyQuota: provider.dailyQuota ?? 0,
    monthlyQuota: provider.monthlyQuota ?? 0,
    concurrency: provider.concurrencyLimit ?? 1,
    cooldown: provider.cooldownUntil ? new Date(provider.cooldownUntil).toLocaleString() : 'none',
  }));

  if (loading) return <div className="mx-auto max-w-7xl p-6"><div className="surface-card p-6">Loading Token Center...</div></div>;

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-6">
      <section className="surface-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Token Center</h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Track usage, success rate, failure categories, latency, quotas, cooldown, concurrency, and router impact.</p>
          </div>
          <Button variant="secondary" onClick={load} icon={<RefreshCw className="h-4 w-4" />}>Refresh</Button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SurfaceCard className="p-5"><div className="flex items-center gap-2 text-xs text-[var(--text-muted)]"><Zap className="h-4 w-4" /> Total tokens</div><div className="mt-2 text-2xl font-bold">{summary?.totalTokens ?? 0}</div></SurfaceCard>
        <SurfaceCard className="p-5"><div className="flex items-center gap-2 text-xs text-[var(--text-muted)]"><Activity className="h-4 w-4" /> Requests today</div><div className="mt-2 text-2xl font-bold">{summary?.todayRequests ?? 0}</div></SurfaceCard>
        <SurfaceCard className="p-5"><div className="flex items-center gap-2 text-xs text-[var(--text-muted)]"><BarChart3 className="h-4 w-4" /> Success rate</div><div className="mt-2 text-2xl font-bold">{Math.round((summary?.successRate ?? 0) * 100)}%</div></SurfaceCard>
        <SurfaceCard className="p-5"><div className="flex items-center gap-2 text-xs text-[var(--text-muted)]"><Clock className="h-4 w-4" /> P95 latency</div><div className="mt-2 text-2xl font-bold">{summary?.p95LatencyMs ?? 0} ms</div></SurfaceCard>
      </div>

      <SurfaceCard className="p-5">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Provider quotas and cooldown</h2>
        <div className="mt-4 overflow-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase text-[var(--text-muted)]"><tr><th className="py-2">Provider</th><th>Daily</th><th>Monthly</th><th>Concurrency</th><th>Cooldown</th><th>Router state</th></tr></thead>
            <tbody>
              {quotaRows.map(({ provider, dailyQuota, monthlyQuota, concurrency, cooldown }) => (
                <tr key={provider.id} className="border-t border-[var(--border)]">
                  <td className="py-3 font-semibold">{provider.providerName}</td>
                  <td>{dailyQuota || 'unlimited'}</td>
                  <td>{monthlyQuota || 'unlimited'}</td>
                  <td>{concurrency}</td>
                  <td>{cooldown}</td>
                  <td><Badge>{provider.enabled === false ? 'disabled' : provider.cooldownUntil ? 'cooldown' : 'available'}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {quotaRows.length === 0 && <EmptyState icon={Database} title="No quota policy yet" description="Provider quotas appear here after providers are configured." />}
      </SurfaceCard>

      <SurfaceCard className="p-5">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Recent usage</h2>
        <div className="mt-4 space-y-2">
          {records.map((record) => (
            <div key={record.id} className="grid gap-2 rounded-tool border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-sm md:grid-cols-[1fr_120px_120px_120px]">
              <div><div className="font-semibold">{record.endpoint}</div><div className="text-xs text-[var(--text-muted)]">{record.providerName ?? 'Unassigned'} / {record.model ?? 'unknown'}</div></div>
              <div>{record.totalTokens} tokens</div>
              <div>{record.latencyMs} ms</div>
              <Badge>{record.success ? 'success' : record.failureCategory}</Badge>
            </div>
          ))}
          {records.length === 0 && <EmptyState icon={Database} title="No usage records" description="Gateway, workflow, and skill runs will record usage here." />}
        </div>
      </SurfaceCard>
    </div>
  );
}
