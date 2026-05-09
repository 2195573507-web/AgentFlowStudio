import { describe, it, expect } from 'vitest'
import { containsSecret, redactSecrets, sanitizeObject } from '../../src/renderer/lib/secretRedaction'

describe('containsSecret', () => {
  it('detects OpenAI-style API keys', () => {
    expect(containsSecret('sk-proj-abc123def456ghijklmnopqrstuvwx')).toBe(true)
    expect(containsSecret('sk-ant-api1234567890abcdefghijklmn')).toBe(true)
  })

  it('detects Bearer tokens', () => {
    expect(containsSecret('Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')).toBe(true)
  })

  it('detects api_key assignments', () => {
    expect(containsSecret("api_key = 'my-secret-key-123'")).toBe(true)
    expect(containsSecret('api_key="abc123456"')).toBe(true)
    expect(containsSecret('api_key: sk-abcdefghijklmnopqrstuv')).toBe(true)
  })

  it('detects password assignments', () => {
    expect(containsSecret("password = 'mypassword123'")).toBe(true)
    expect(containsSecret('password: secretpass')).toBe(true)
  })

  it('detects secret assignments', () => {
    expect(containsSecret("secret = 'mysecret'")).toBe(true)
  })

  it('detects access_token assignments', () => {
    expect(containsSecret('access_token: abc123xyz')).toBe(true)
  })

  it('detects refresh_token assignments', () => {
    expect(containsSecret('refresh_token: abc123xyz')).toBe(true)
  })

  it('returns false for normal text', () => {
    expect(containsSecret('This is normal project context')).toBe(false)
    expect(containsSecret('npm install react')).toBe(false)
    expect(containsSecret('')).toBe(false)
  })

  it('returns false for safe words containing "key"', () => {
    expect(containsSecret('Press any key to continue')).toBe(false)
    expect(containsSecret('The keyboard shortcut is Ctrl+K')).toBe(false)
  })
})

describe('redactSecrets', () => {
  it('redacts API keys', () => {
    const result = redactSecrets('My key is sk-proj-abc123def456ghijklmnopqrstuvwx')
    expect(result).not.toContain('sk-proj-abc123def456ghijklmnopqrstuvwx')
    expect(result).toContain('[REDACTED]')
  })

  it('redacts short sk-style leak markers in copied logs', () => {
    const result = redactSecrets('clipboard contained sk-test-secret and a second sk- marker')
    expect(result).not.toContain('sk-test-secret')
    expect(result).not.toContain('sk-')
    expect(result).toContain('[REDACTED]')
  })

  it('redacts Bearer tokens', () => {
    const result = redactSecrets('Authorization: Bearer token123abc')
    expect(result).not.toContain('token123abc')
    expect(result).toContain('[REDACTED]')
  })

  it('redacts api_key values', () => {
    const result = redactSecrets("api_key = 'secret-value-123'")
    expect(result).not.toContain('secret-value-123')
    expect(result).toContain('[REDACTED]')
  })

  it('redacts password values', () => {
    const result = redactSecrets("password = 'p@ssw0rd!'")
    expect(result).not.toContain('p@ssw0rd!')
    expect(result).toContain('[REDACTED]')
  })

  it('redacts multiple secrets in one text', () => {
    const text = "api_key: sk-abc123\npassword: secret123"
    const result = redactSecrets(text)
    expect(result).not.toContain('sk-abc123')
    expect(result).not.toContain('secret123')
  })

  it('preserves non-secret text', () => {
    const text = 'This is normal project context about React and TypeScript'
    const result = redactSecrets(text)
    expect(result).toBe(text)
  })

  it('handles empty string', () => {
    expect(redactSecrets('')).toBe('')
  })

  it('preserves key names but redacts values', () => {
    const result = redactSecrets('api_key: my-key-123')
    expect(result).toContain('api_key')
    expect(result).not.toContain('my-key-123')
  })
})

describe('sanitizeObject', () => {
  it('redacts nested sensitive keys and values', () => {
    const result = sanitizeObject({
      title: 'Provider config',
      apiKey: 'sk-provider-secret1234567890',
      nested: {
        authorization: 'Bearer nested-token-1234567890',
        notes: ['safe text', 'password=plain-secret'],
      },
    })

    expect(JSON.stringify(result)).not.toContain('sk-provider-secret1234567890')
    expect(JSON.stringify(result)).not.toContain('nested-token-1234567890')
    expect(JSON.stringify(result)).not.toContain('plain-secret')
    expect(JSON.stringify(result)).toContain('[REDACTED]')
  })

  it('redacts provider scope and metadata secrets without changing safe text', () => {
    const result = sanitizeObject({
      providerScope: 'api_key=scope-secret-value',
      modelScope: 'gpt-4.1',
      metadata: {
        databaseUrl: 'postgres://user:database-secret@localhost:5432/db',
        safe: 'AgentFlow local memory',
      },
    })

    expect(JSON.stringify(result)).not.toContain('scope-secret-value')
    expect(JSON.stringify(result)).not.toContain('database-secret')
    expect(JSON.stringify(result)).toContain('gpt-4.1')
    expect(JSON.stringify(result)).toContain('AgentFlow local memory')
  })

  it('handles circular references safely', () => {
    const value: Record<string, unknown> = {
      title: 'Circular',
      apiKey: 'sk-circular-secret1234567890',
    }
    value.self = value

    const result = sanitizeObject(value) as Record<string, unknown>

    expect(result.apiKey).toBe('[REDACTED]')
    expect(result.self).toBe('[Circular]')
  })
})
