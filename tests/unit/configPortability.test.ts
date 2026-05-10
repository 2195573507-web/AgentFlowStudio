import { describe, expect, it } from 'vitest'
import { buildConfigBundle, previewConfigImport } from '../../src/shared/configPortability'

describe('config import/export portability', () => {
  it('omits provider secrets and adds a hash checkpoint', () => {
    const bundle = buildConfigBundle({
      providers: [
        {
          id: 'p1',
          providerName: 'OpenAI',
          baseUrl: 'https://api.openai.com/v1',
          apiKey: 'sk-secret-123456',
          modelName: 'gpt-4.1',
          enabled: true,
          memoryEnabled: true,
          memoryInjectionMode: 'balanced',
          maxMemoryItems: 10,
          maxMemoryChars: 8000,
        },
      ],
      projects: [],
      agents: [],
      templates: [],
      mcpAllowlist: [],
      skillsRegistry: [],
      now: new Date('2026-05-10T00:00:00.000Z'),
    })
    expect(JSON.stringify(bundle)).not.toContain('sk-secret')
    expect(bundle.providers[0]).not.toHaveProperty('apiKey')
    expect(bundle.manifest.hash).toMatch(/^fnv1a-/)
    expect(bundle.manifest.redaction).toBe('secrets-omitted')
  })

  it('rejects script-like import payloads and oversize data', () => {
    const dangerous = JSON.stringify({
      manifest: { version: 1, hash: 'bad' },
      skillsRegistry: [{ id: 'x', name: 'x', description: 'x', category: 'x', enabled: true, script: 'powershell', createdAt: '', updatedAt: '' }],
    })
    expect(previewConfigImport(dangerous).ok).toBe(false)
    expect(previewConfigImport('x'.repeat(600_000)).ok).toBe(false)
  })
})
