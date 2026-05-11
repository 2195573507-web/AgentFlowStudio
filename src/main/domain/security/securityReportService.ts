import { randomUUID } from 'crypto';
import type { AuditEvent } from '../../../shared/auditTypes.js';
import type { NexusSecurityReport, ProviderSetting } from '../../../shared/types.js';
import { listAuditEvents } from '../../audit.js';
import storage from '../../storage.js';

export async function generateSecurityReport(scope = 'workspace'): Promise<NexusSecurityReport> {
  const [auditLogs, providers] = await Promise.all([
    listAuditEvents({ limit: 500 }).catch(() => [] as AuditEvent[]),
    storage.getAll<ProviderSetting>('providerSettings').catch(() => []),
  ]);
  const denied = auditLogs.filter((event) => event.status === 'denied');
  const providerRisk = providers.filter((provider) => provider.riskLevel === 'high' || provider.riskLevel === 'critical');
  const findings: NexusSecurityReport['findings'] = [];

  if (denied.length > 0) {
    findings.push({
      id: 'permission-denials',
      severity: 'warning',
      title: 'Permission denials recorded',
      detail: `${denied.length} denied audit events were found in the recent audit window.`,
      recommendation: 'Review the Security Center audit table and confirm the denied actor, route, and permission are expected.',
    });
  }
  if (providerRisk.length > 0) {
    findings.push({
      id: 'high-risk-providers',
      severity: 'warning',
      title: 'High risk providers configured',
      detail: `${providerRisk.length} provider records are marked high or critical risk.`,
      recommendation: 'Confirm the provider base URL, headers, credential policy, and routing tags before making it active.',
    });
  }
  if (findings.length === 0) {
    findings.push({
      id: 'baseline-ok',
      severity: 'info',
      title: 'Baseline security posture is clean',
      detail: 'No denied audit events or high-risk providers were found in the recent local report window.',
      recommendation: 'Continue to keep secrets in the main process and export only redacted reports.',
    });
  }

  return {
    id: randomUUID(),
    generatedAt: new Date().toISOString(),
    scope,
    summary: 'Local security report generated from audit logs, provider risk metadata, and redaction policy.',
    findings,
    redaction: 'secrets-redacted',
    auditEventCount: auditLogs.length,
    deniedEventCount: denied.length,
    providerRiskCount: providerRisk.length,
    externalUrlPolicy: 'confirm-before-open',
  };
}

