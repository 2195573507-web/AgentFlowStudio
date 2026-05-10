import { randomUUID } from 'crypto';
import type { AuditEvent, AuditQuery } from '../shared/auditTypes.js';
import { filterAuditEvents, sanitizeAuditEvent } from '../shared/auditCore.js';
import storage from './storage.js';

export type AuditInput = Omit<AuditEvent, 'id' | 'createdAt'> & { createdAt?: string };

export async function recordAudit(input: AuditInput): Promise<AuditEvent> {
  const event = sanitizeAuditEvent({
    ...input,
    id: randomUUID(),
    createdAt: input.createdAt ?? new Date().toISOString(),
  });
  return storage.create('auditLogs', event as never);
}

export async function listAuditEvents(query: AuditQuery = {}): Promise<AuditEvent[]> {
  const events = await storage.getAll<AuditEvent>('auditLogs');
  return filterAuditEvents(events, query);
}
