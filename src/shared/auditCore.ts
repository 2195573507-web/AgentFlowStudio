import type { AuditEvent, AuditQuery } from './auditTypes.js';
import { sanitizeObject } from './secretRedaction.js';
import crypto from 'node:crypto';

export function sanitizeAuditEvent(event: AuditEvent): AuditEvent {
  return sanitizeObject(event) as AuditEvent;
}

export function canonicalAuditPayload(event: AuditEvent): string {
  const { hash: _hash, ...payload } = event;
  return stableStringify(payload);
}

export function computeAuditHash(event: AuditEvent): string {
  return crypto.createHash('sha256').update(canonicalAuditPayload(event)).digest('hex');
}

export function verifyAuditChain(events: AuditEvent[]) {
  const ordered = [...events].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  let previousHash = '';
  for (const [index, event] of ordered.entries()) {
    if (index > 0 && event.previousHash !== previousHash) {
      return { ok: false, checked: index, firstBrokenEventId: event.id, lastHash: previousHash };
    }
    if (computeAuditHash(event) !== event.hash) {
      return { ok: false, checked: index, firstBrokenEventId: event.id, lastHash: previousHash };
    }
    previousHash = event.hash ?? '';
  }
  return { ok: true, checked: ordered.length, lastHash: previousHash };
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => `${JSON.stringify(key)}:${stableStringify(child)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export function filterAuditEvents(events: AuditEvent[], query: AuditQuery = {}): AuditEvent[] {
  const search = query.search?.trim().toLowerCase();
  const rawLimit = Number(query.limit) || 200;
  const limit = rawLimit === Number.MAX_SAFE_INTEGER ? rawLimit : Math.min(Math.max(rawLimit, 1), 1000);
  return events
    .filter((event) => !query.type || event.type === query.type)
    .filter((event) => !query.status || event.status === query.status)
    .filter((event) => !query.severity || event.severity === query.severity)
    .filter((event) => !query.actorUserId || event.actor.userId === query.actorUserId)
    .filter((event) => {
      if (!search) return true;
      const haystack = [
        event.type,
        event.action,
        event.actor.email,
        event.resource?.type,
        event.resource?.id,
        event.resource?.label,
        JSON.stringify(event.metadata ?? {}),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(search);
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map(sanitizeAuditEvent);
}
