import type { AuditEvent, AuditQuery } from './auditTypes.js';
import { sanitizeObject } from './secretRedaction.js';

export function sanitizeAuditEvent(event: AuditEvent): AuditEvent {
  return sanitizeObject(event) as AuditEvent;
}

export function filterAuditEvents(events: AuditEvent[], query: AuditQuery = {}): AuditEvent[] {
  const search = query.search?.trim().toLowerCase();
  const limit = Math.min(Math.max(Number(query.limit) || 200, 1), 1000);
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

