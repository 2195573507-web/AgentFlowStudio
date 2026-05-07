import { describe, it, expect } from 'vitest'
import { generateSharedMemoryContext, injectMemoryIntoPrompt } from '../../src/renderer/lib/memoryInjection'
import type { Memory, MemoryInjectionMode } from '../../src/shared/types'

function makeMem(overrides: Partial<Memory> = {}): Memory {
  return {
    id: 'm1',
    type: 'project_context',
    title: 'Test',
    content: 'Test content',
    tags: [],
    projectId: '',
    providerScope: '',
    modelScope: '',
    importance: 3,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('generateSharedMemoryContext', () => {
  it('returns empty string for off mode', () => {
    const result = generateSharedMemoryContext([], 'off')
    expect(result).toBe('')
  })

  it('returns empty string for empty memories', () => {
    const result = generateSharedMemoryContext([], 'balanced')
    expect(result).toBe('')
  })

  it('generates minimal context with limited memories', () => {
    const mems = [
      makeMem({ id: '1', type: 'project_context', title: 'Project', content: 'background', importance: 5 }),
      makeMem({ id: '2', type: 'decision', title: 'Decision', content: 'choice', importance: 4 }),
      makeMem({ id: '3', type: 'issue_fix', title: 'Fix', content: 'solution', importance: 3 }),
      makeMem({ id: '4', type: 'user_preference', title: 'Pref', content: 'style', importance: 2 }),
    ]
    const result = generateSharedMemoryContext(mems, 'minimal')
    expect(result).toContain('[Shared Memory Context]')
    expect(result).toContain('[/Shared Memory Context]')
  })

  it('generates balanced context', () => {
    const mems = [
      makeMem({ id: '1', type: 'project_context', title: 'Project Background', content: 'We are building a desktop app', importance: 5 }),
      makeMem({ id: '2', type: 'decision', title: 'Tech Decision', content: 'Chose Electron over Tauri', importance: 4 }),
    ]
    const result = generateSharedMemoryContext(mems, 'balanced')
    expect(result).toContain('项目背景')
    expect(result).toContain('已做决策')
  })

  it('generates full context', () => {
    const mems = [
      makeMem({ id: '1', type: 'project_context', title: 'BG', content: 'content 1', importance: 5 }),
      makeMem({ id: '2', type: 'decision', title: 'D1', content: 'content 2', importance: 4 }),
      makeMem({ id: '3', type: 'issue_fix', title: 'F1', content: 'content 3', importance: 3 }),
      makeMem({ id: '4', type: 'user_preference', title: 'P1', content: 'content 4', importance: 2 }),
    ]
    const result = generateSharedMemoryContext(mems, 'full')
    expect(result).toContain('[Shared Memory Context]')
    expect(result).toContain('[/Shared Memory Context]')
    // Full mode should include more content
    expect(result.length).toBeGreaterThan(50)
  })

  it('respects maxChars limit', () => {
    const mems = [
      makeMem({ id: '1', type: 'project_context', title: 'BG', content: 'A'.repeat(500), importance: 5 }),
      makeMem({ id: '2', type: 'decision', title: 'D1', content: 'B'.repeat(500), importance: 4 }),
    ]
    const result = generateSharedMemoryContext(mems, 'full', 200)
    expect(result.length).toBeLessThanOrEqual(220)
  })
})

describe('injectMemoryIntoPrompt', () => {
  const prompt = 'Build a React component for user profile'

  it('returns prompt unchanged when mode is off', () => {
    const result = injectMemoryIntoPrompt(prompt, [], 'off')
    expect(result).toBe(prompt)
  })

  it('prepends shared memory context to prompt', () => {
    const mems = [
      makeMem({ id: '1', type: 'project_context', title: 'Project', content: 'We use React 18', importance: 5 }),
    ]
    const result = injectMemoryIntoPrompt(prompt, mems, 'balanced')
    expect(result).toContain('[Shared Memory Context]')
    expect(result).toContain(prompt)
    // Context should come before the original prompt
    expect(result.indexOf('[Shared Memory Context]')).toBeLessThan(result.indexOf(prompt))
  })

  it('handles empty memories gracefully', () => {
    const result = injectMemoryIntoPrompt(prompt, [], 'full')
    expect(result).toContain(prompt)
  })
})
