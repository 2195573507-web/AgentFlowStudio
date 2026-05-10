import { describe, expect, it } from 'vitest'
import type { AuditEvent } from '../../src/shared/auditTypes'
import { filterAuditEvents, sanitizeAuditEvent } from '../../src/shared/auditCore'

const base: AuditEvent = {
  id: 'a1',
  type: 'auth.login_failed',
  action: 'auth.login',
  status: 'failure',
  severity: 'warning',
  actor: { email: 'user@example.com' },
  metadata: { reason: 'password=plain-secret', token: 'Bearer abc1234567890' },
  createdAt: '2026-05-10T00:00:00.000Z',
}

describe('audit logs', () => {
  it('redacts secret-looking metadata', () => {
    const sanitized = sanitizeAuditEvent(base)
    const raw = JSON.stringify(sanitized)
    expect(raw).not.toContain('plain-secret')
    expect(raw).not.toContain('abc1234567890')
    expect(raw).toContain('[REDACTED]')
  })

  it('filters and sorts audit events', () => {
    const events = [
      base,
      { ...base, id: 'a2', type: 'user.create', action: 'user.create', status: 'success', severity: 'info', createdAt: '2026-05-10T01:00:00.000Z' },
    ] as AuditEvent[]
    expect(filterAuditEvents(events, { search: 'user.create' }).map((event) => event.id)).toEqual(['a2'])
    expect(filterAuditEvents(events, { limit: 1 }).map((event) => event.id)).toEqual(['a2'])
  })
})
