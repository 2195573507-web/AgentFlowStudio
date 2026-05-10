import { randomUUID } from 'crypto';
import type { AuditEvent, AuditIntegrityReport, AuditQuery } from '../shared/auditTypes.js';
import { computeAuditHash, filterAuditEvents, sanitizeAuditEvent, verifyAuditChain } from '../shared/auditCore.js';
import storage from './storage.js';

export type AuditInput = Omit<AuditEvent, 'id' | 'createdAt'> & { createdAt?: string };
const DEFAULT_RETENTION_DAYS = 180;

function retentionDate(createdAt: string): string {
  const created = new Date(createdAt);
  created.setUTCDate(created.getUTCDate() + DEFAULT_RETENTION_DAYS);
  return created.toISOString();
}

async function pruneExpiredAuditEvents(now = new Date()): Promise<void> {
  const events = await storage.getAll<AuditEvent>('auditLogs');
  const retained = events.filter((event) => !event.retentionUntil || new Date(event.retentionUntil).getTime() > now.getTime());
  if (retained.length === events.length) return;
  for (const event of events) {
    if (!retained.some((item) => item.id === event.id)) {
      await storage.delete('auditLogs', event.id);
    }
  }
}

export async function recordAudit(input: AuditInput): Promise<AuditEvent> {
  await pruneExpiredAuditEvents();
  const existing = await storage.getAll<AuditEvent>('auditLogs');
  const previous = [...existing].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).at(-1);
  const createdAt = input.createdAt ?? new Date().toISOString();
  const event = sanitizeAuditEvent({
    ...input,
    id: randomUUID(),
    createdAt,
    retentionUntil: input.retentionUntil ?? retentionDate(createdAt),
    previousHash: previous?.hash ?? '',
    chainVersion: 1,
  });
  event.hash = computeAuditHash(event);
  const created = await storage.create<AuditEvent>('auditLogs', event);
  await storage.create('runEvents', {
    id: randomUUID(),
    projectId: event.resource?.type === 'workflow' ? event.resource.id : String(event.metadata?.projectId ?? ''),
    runId: String(event.metadata?.runId ?? ''),
    auditEventId: event.id,
    type: event.type === 'permission.denied' ? 'permission.denied' : event.type === 'mcp.denied' ? 'mcp.denied' : event.type === 'mcp.allowed' ? 'mcp.allowed' : 'audit.recorded',
    status: event.status === 'success' ? 'success' : event.status === 'denied' ? 'denied' : 'failure',
    actorUserId: event.actor.userId,
    title: event.action,
    detail: event.resource?.label,
    metadata: event.metadata,
    createdAt: event.createdAt,
  } as never).catch(() => undefined);
  return created;
}

export async function listAuditEvents(query: AuditQuery = {}): Promise<AuditEvent[]> {
  await pruneExpiredAuditEvents();
  const events = await storage.getAll<AuditEvent>('auditLogs');
  return filterAuditEvents(events, query);
}

export async function verifyAuditIntegrity(): Promise<AuditIntegrityReport> {
  const events = await storage.getAll<AuditEvent>('auditLogs');
  return { ...verifyAuditChain(events), generatedAt: new Date().toISOString() };
}
