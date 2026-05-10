import { describe, expect, it } from 'vitest'
import {
  isProtectedSecret,
  isSecureStoreAvailable,
  maskSecret,
  protectSecret,
  type SecureStorageAdapter,
  unprotectSecret,
} from '../../src/main/secureStore'

function adapter(available = true): SecureStorageAdapter {
  return {
    isEncryptionAvailable: () => available,
    encryptString: (value) => Buffer.from(`enc:${value}`, 'utf8'),
    decryptString: (value) => {
      const text = value.toString('utf8')
      if (!text.startsWith('enc:')) throw new Error('bad ciphertext')
      return text.slice(4)
    },
  }
}

describe('secureStore', () => {
  it('wraps and unwraps secrets without keeping plaintext in the envelope', () => {
    const envelope = protectSecret('sk-test-secret-1234', 'provider.apiKey', adapter(), new Date('2026-05-10T00:00:00.000Z'))
    expect(isProtectedSecret(envelope)).toBe(true)
    expect(JSON.stringify(envelope)).not.toContain('sk-test-secret-1234')
    expect(envelope.last4).toBe('1234')
    expect(maskSecret(envelope)).toBe('Saved key ending in 1234')
    expect(unprotectSecret(envelope, adapter())).toBe('sk-test-secret-1234')
  })

  it('fails closed when OS encryption is unavailable', () => {
    expect(isSecureStoreAvailable(adapter(false))).toBe(false)
    expect(() => protectSecret('secret', 'auth.session', adapter(false))).toThrow(/Secure storage/)
  })

  it('returns null for corrupt ciphertext', () => {
    const envelope = protectSecret('secret-value', 'auth.session', adapter())
    expect(unprotectSecret({ ...envelope, ciphertext: Buffer.from('broken').toString('base64') }, adapter())).toBeNull()
  })
})
