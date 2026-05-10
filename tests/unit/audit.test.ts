import { describe, expect, it } from 'vitest'
import type { AuditEvent } from '../../src/shared/auditTypes'
import { computeAuditHash, filterAuditEvents, sanitizeAuditEvent, verifyAuditChain } from '../../src/shared/auditCore'

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

  it('verifies a tamper-evident audit hash chain', () => {
    const first = { ...base, previousHash: '', chainVersion: 1 as const, retentionUntil: '2026-11-10T00:00:00.000Z' }
    first.hash = computeAuditHash(first)
    const second = {
      ...base,
      id: 'a2',
      action: 'user.create',
      type: 'user.create' as const,
      previousHash: first.hash,
      chainVersion: 1 as const,
      retentionUntil: '2026-11-10T00:00:00.000Z',
      createdAt: '2026-05-10T00:01:00.000Z',
    }
    second.hash = computeAuditHash(second)
    expect(verifyAuditChain([first, second]).ok).toBe(true)
    expect(verifyAuditChain([second]).ok).toBe(true)
    expect(verifyAuditChain([first, { ...second, action: 'user.disable' }]).ok).toBe(false)
  })

  it('allows explicit full audit exports beyond the default list cap', () => {
    const events = Array.from({ length: 1005 }, (_, index) => ({
      ...base,
      id: `a${index}`,
      createdAt: `2026-05-10T00:${String(index % 60).padStart(2, '0')}:00.000Z`,
    }))

    expect(filterAuditEvents(events).length).toBe(200)
    expect(filterAuditEvents(events, { limit: Number.MAX_SAFE_INTEGER }).length).toBe(1005)
  })
})
