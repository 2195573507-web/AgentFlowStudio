import React from 'react';
import { Activity, FileJson, RefreshCw, ShieldCheck } from 'lucide-react';
import { Badge, Button, SurfaceCard } from '../components';
import { api } from '../lib/api';
import type { NexusContextPackPreview, NexusGatewayStatus, NexusSecurityReport } from '../lib/types';

export default function Diagnostics() {
  const [gateway, setGateway] = React.useState<NexusGatewayStatus | null>(null);
  const [contextPack, setContextPack] = React.useState<NexusContextPackPreview | null>(null);
  const [security, setSecurity] = React.useState<NexusSecurityReport | null>(null);

  const load = React.useCallback(async () => {
    const [gatewayResult, contextResult, securityResult] = await Promise.all([
      api.gateway.status().catch(() => null),
      api.contextPack.preview().catch(() => null),
      api.security.report().catch(() => null),
    ]);
    if (gatewayResult && typeof gatewayResult === 'object' && !('error' in gatewayResult)) setGateway(gatewayResult);
    if (contextResult && typeof contextResult === 'object' && !('error' in contextResult)) setContextPack(contextResult);
    if (securityResult && typeof securityResult === 'object' && !('error' in securityResult)) setSecurity(securityResult);
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-6">
      <section className="surface-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h1 className="text-2xl font-bold">Diagnostics</h1><p className="mt-2 text-sm text-[var(--text-secondary)]">One place for gateway status, context recovery, security report state, and handoff evidence.</p></div><Button variant="secondary" onClick={load} icon={<RefreshCw className="h-4 w-4" />}>Refresh</Button></div>
      </section>
      <div className="grid gap-4 lg:grid-cols-3">
        <SurfaceCard className="p-5"><div className="flex items-center gap-2 text-sm font-semibold"><Activity className="h-4 w-4" /> Gateway</div><div className="mt-3 text-2xl font-bold">{gateway?.online ? 'Online' : 'Offline'}</div><p className="mt-2 text-xs text-[var(--text-muted)]">{gateway?.baseUrl ?? 'http://127.0.0.1:8317'}</p><Badge>{gateway?.lastTraceId ?? 'no trace yet'}</Badge></SurfaceCard>
        <SurfaceCard className="p-5"><div className="flex items-center gap-2 text-sm font-semibold"><FileJson className="h-4 w-4" /> Context Pack</div><div className="mt-3 text-2xl font-bold">{contextPack?.memoryCount ?? 0}</div><p className="mt-2 text-xs text-[var(--text-muted)]">{contextPack?.staleMemoryCount ?? 0} stale memories / {contextPack?.sources.length ?? 0} sources</p><Badge>redacted preview</Badge></SurfaceCard>
        <SurfaceCard className="p-5"><div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4" /> Security</div><div className="mt-3 text-2xl font-bold">{security?.findings.length ?? 0}</div><p className="mt-2 text-xs text-[var(--text-muted)]">{security?.deniedEventCount ?? 0} denied / {security?.providerRiskCount ?? 0} provider risks</p><Badge>{security?.redaction ?? 'secrets-redacted'}</Badge></SurfaceCard>
      </div>
      <SurfaceCard className="p-5">
        <h2 className="text-base font-semibold">Recovery prompt preview</h2>
        <pre className="mt-4 max-h-96 overflow-auto rounded-tool bg-black/80 p-4 text-xs text-white">{contextPack?.prompt ?? 'No context pack generated yet.'}</pre>
      </SurfaceCard>
    </div>
  );
}
