import { describe, expect, it } from 'vitest'
import {
  createDefaultAdmin,
  createSession,
  createTemporaryPassword,
  createUserFromRequest,
  getLockUntil,
  hashPassword,
  isSessionActive,
  toPublicUser,
  verifyPassword,
} from '../../src/shared/authCore'

describe('auth password hashing', () => {
  it('hashes and verifies passwords without returning plaintext', () => {
    const hashed = hashPassword('123456')
    expect(hashed.passwordHash).not.toContain('123456')
    expect(hashed.passwordSalt).not.toContain('123456')
    expect(verifyPassword('123456', hashed)).toBe(true)
    expect(verifyPassword('bad-password', hashed)).toBe(false)
  })

  it('initializes the default admin as hashed and must-change-password', () => {
    const admin = createDefaultAdmin(new Date('2026-05-10T00:00:00.000Z'))
    expect(admin.email).toBe('123@admin.com')
    expect(admin.role).toBe('admin')
    expect(admin.mustChangePassword).toBe(true)
    expect(admin.passwordHash).not.toContain('123456')
    expect(verifyPassword('123456', admin)).toBe(true)
  })

  it('removes password fields from public users', () => {
    const user = createUserFromRequest({ email: 'user@example.com', password: 'abcdef', role: 'user' })
    const safe = toPublicUser(user) as unknown as Record<string, unknown>
    expect(safe.email).toBe('user@example.com')
    expect(safe.passwordHash).toBeUndefined()
    expect(safe.passwordSalt).toBeUndefined()
  })
})

describe('auth sessions and rate limits', () => {
  it('validates active session tokens and rejects wrong tokens', () => {
    const { session, token } = createSession('u1', 'token-1', new Date('2026-05-10T00:00:00.000Z'))
    expect(token).toBe('token-1')
    expect(isSessionActive(session, 'token-1', new Date('2026-05-10T00:01:00.000Z'))).toBe(true)
    expect(isSessionActive(session, 'token-2', new Date('2026-05-10T00:01:00.000Z'))).toBe(false)
  })

  it('expires sessions', () => {
    const { session } = createSession('u1', 'token-1', new Date('2026-05-10T00:00:00.000Z'))
    expect(isSessionActive(session, 'token-1', new Date('2026-05-20T00:00:00.000Z'))).toBe(false)
  })

  it('locks on the configured failed-login threshold', () => {
    const now = new Date('2026-05-10T00:00:00.000Z')
    expect(getLockUntil(3, now)).toBeUndefined()
    expect(getLockUntil(4, now)).toBe('2026-05-10T00:15:00.000Z')
  })

  it('generates non-default temporary passwords for admin resets', () => {
    const password = createTemporaryPassword()
    expect(password).not.toBe('123456')
    expect(password.length).toBeGreaterThanOrEqual(20)
  })
})
