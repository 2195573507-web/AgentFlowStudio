import React from 'react';
import { Download, RefreshCw, ShieldAlert } from 'lucide-react';
import { Badge, Button, SurfaceCard } from '../components';
import { api } from '../lib/api';
import type { AuditEvent, NexusSecurityReport } from '../lib/types';

export default function SecurityCenter() {
  const [report, setReport] = React.useState<NexusSecurityReport | null>(null);
  const [audit, setAudit] = React.useState<AuditEvent[]>([]);
  const [message, setMessage] = React.useState('');

  const load = React.useCallback(async () => {
    const [reportResult, auditResult] = await Promise.all([
      api.security.report('workspace').catch(() => null),
      api.audit.list({ limit: 50 }).catch(() => []),
    ]);
    if (reportResult && typeof reportResult === 'object' && !('error' in reportResult)) setReport(reportResult);
    setAudit(Array.isArray(auditResult) ? auditResult : []);
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const exportReport = async () => {
    if (!report) return;
    await api.export.json(report, `localai-nexus-security-${Date.now()}.json`);
    setMessage('Security report exported with secrets redacted.');
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-6">
      <section className="surface-card p-6"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h1 className="text-2xl font-bold">Security Center</h1><p className="mt-2 text-sm text-[var(--text-secondary)]">Auth, RBAC, ACL, audit, redaction, secret scan posture, provider risk, MCP/tool risk, and exportable security report.</p></div><div className="flex gap-2"><Button variant="secondary" onClick={load} icon={<RefreshCw className="h-4 w-4" />}>Refresh</Button><Button onClick={exportReport} icon={<Download className="h-4 w-4" />}>Export</Button></div></div></section>
      {message && <div className="rounded-tool border border-accent-500/30 bg-accent-500/10 p-3 text-sm text-[var(--accent)]">{message}</div>}
      <div className="grid gap-4 md:grid-cols-4">
        <SurfaceCard className="p-5"><div className="text-xs text-[var(--text-muted)]">Audit events</div><div className="mt-2 text-2xl font-bold">{report?.auditEventCount ?? audit.length}</div></SurfaceCard>
        <SurfaceCard className="p-5"><div className="text-xs text-[var(--text-muted)]">Denied</div><div className="mt-2 text-2xl font-bold">{report?.deniedEventCount ?? 0}</div></SurfaceCard>
        <SurfaceCard className="p-5"><div className="text-xs text-[var(--text-muted)]">Provider risk</div><div className="mt-2 text-2xl font-bold">{report?.providerRiskCount ?? 0}</div></SurfaceCard>
        <SurfaceCard className="p-5"><div className="text-xs text-[var(--text-muted)]">External URLs</div><div className="mt-2 text-sm font-bold">{report?.externalUrlPolicy ?? 'confirm-before-open'}</div></SurfaceCard>
      </div>
      <SurfaceCard className="p-5">
        <h2 className="flex items-center gap-2 text-base font-semibold"><ShieldAlert className="h-4 w-4" /> Findings</h2>
        <div className="mt-4 space-y-2">
          {(report?.findings ?? []).map((finding) => <div key={finding.id} className="rounded-tool border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-sm"><div className="flex items-center gap-2"><Badge>{finding.severity}</Badge><span className="font-semibold">{finding.title}</span></div><p className="mt-1 text-xs text-[var(--text-secondary)]">{finding.detail}</p><p className="mt-1 text-xs text-[var(--text-muted)]">{finding.recommendation}</p></div>)}
        </div>
      </SurfaceCard>
      <SurfaceCard className="p-5">
        <h2 className="text-base font-semibold">Recent audit</h2>
        <div className="mt-4 space-y-2">
          {audit.slice(0, 12).map((event) => <div key={event.id} className="rounded-tool border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-xs"><div className="font-semibold">{event.action}</div><div className="text-[var(--text-muted)]">{event.status} / {event.severity} / {event.createdAt}</div></div>)}
        </div>
      </SurfaceCard>
    </div>
  );
}
