import { describe, expect, it } from 'vitest'
import { PROVIDER_PRESETS, presetToProvider } from '../../src/shared/providerPresets'

describe('provider presets', () => {
  it('contains the required cc-switch inspired provider presets', () => {
    expect(PROVIDER_PRESETS.map((preset) => preset.providerId)).toEqual([
      'openai-compatible',
      'deepseek',
      'doubao-volcano-ark',
      'openrouter',
      'ollama-local',
      'claude-compatible',
      'gemini-compatible',
      'custom-provider',
    ])
  })

  it('creates provider drafts without secrets', () => {
    const deepseek = PROVIDER_PRESETS.find((preset) => preset.providerId === 'deepseek')!
    const provider = presetToProvider(deepseek)
    expect(provider.providerName).toBe('DeepSeek')
    expect(provider.apiKey).toBe('')
    expect(provider.modelName).toBe('deepseek-chat')
    expect(provider.needsApiKey).toBe(true)
  })
})
