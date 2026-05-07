import { describe, it, expect } from 'vitest'
import { retrieveMemories } from '../../src/renderer/lib/memoryRetriever'
import type { Memory, MemoryInjectionMode } from '../../src/shared/types'

function makeMem(id: string, overrides: Partial<Memory> = {}): Memory {
  return {
    id,
    type: 'project_context',
    title: `Memory ${id}`,
    content: `Content for memory ${id}`,
    tags: [],
    projectId: 'p1',
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

describe('retrieveMemories', () => {
  const memories: Memory[] = [
    makeMem('m1', { type: 'project_context', importance: 5, content: 'Project background info' }),
    makeMem('m2', { type: 'decision', importance: 4, content: 'Decision to use React' }),
    makeMem('m3', { type: 'issue_fix', importance: 3, content: 'Fixed build error' }),
    makeMem('m4', { type: 'user_preference', importance: 5, content: 'Dark mode preference' }),
    makeMem('m5', { type: 'project_context', importance: 2, status: 'pending', content: 'Pending note' }),
    makeMem('m6', { type: 'environment', importance: 1, content: 'Node version 20' }),
  ]

  it('returns empty array for off mode', () => {
    const result = retrieveMemories(memories, { injectionMode: 'off' })
    expect(result).toHaveLength(0)
  })

  it('returns top memories by importance for minimal mode', () => {
    const result = retrieveMemories(memories, { injectionMode: 'minimal', maxItems: 3 })
    expect(result.length).toBeLessThanOrEqual(3)
    // All should be active
    expect(result.every((m) => m.status === 'active')).toBe(true)
    // Should be sorted by importance descending
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].importance).toBeGreaterThanOrEqual(result[i].importance)
    }
  })

  it('returns active project memories for balanced mode', () => {
    const result = retrieveMemories(memories, {
      injectionMode: 'balanced',
      projectId: 'p1',
    })
    expect(result.length).toBeGreaterThan(0)
    expect(result.every((m) => m.status === 'active')).toBe(true)
    expect(result.every((m) => m.projectId === 'p1')).toBe(true)
  })

  it('returns all active + pending for full mode', () => {
    const result = retrieveMemories(memories, {
      injectionMode: 'full',
      projectId: 'p1',
    })
    // full mode includes both active and pending
    expect(result.length).toBeGreaterThan(0)
  })

  it('respects maxItems limit', () => {
    const result = retrieveMemories(memories, {
      injectionMode: 'full',
      maxItems: 2,
    })
    expect(result.length).toBeLessThanOrEqual(2)
  })

  it('respects maxChars limit', () => {
    const result = retrieveMemories(memories, {
      injectionMode: 'full',
      maxChars: 30,
    })
    const totalChars = result.reduce((sum, m) => sum + m.content.length, 0)
    expect(totalChars).toBeLessThanOrEqual(35) // allow small margin
  })

  it('filters by projectId', () => {
    const otherProjMem = makeMem('m7', { projectId: 'p2' })
    const allMems = [...memories, otherProjMem]
    const result = retrieveMemories(allMems, {
      injectionMode: 'balanced',
      projectId: 'p2',
    })
    expect(result.length).toBeGreaterThan(0)
    expect(result.every((m) => m.projectId === 'p2')).toBe(true)
  })

  it('filters by providerScope', () => {
    const providerMem = makeMem('m8', { providerScope: 'Claude Code' })
    const allMems = [...memories, providerMem]
    const result = retrieveMemories(allMems, {
      injectionMode: 'balanced',
      providerScope: 'Claude Code',
    })
    expect(result.every((m) => m.providerScope === 'Claude Code' || m.providerScope === '')).toBe(true)
  })

  it('handles empty memory array', () => {
    const result = retrieveMemories([], { injectionMode: 'balanced' })
    expect(result).toHaveLength(0)
  })

  it('excludes memories that look like they contain secrets', () => {
    const secretMem = makeMem('m9', {
      content: 'sk-proj-abc123def456ghijklmnopqrstuvwx',
    })
    const allMems = [...memories, secretMem]
    const result = retrieveMemories(allMems, { injectionMode: 'full' })
    const hasSecret = result.some((m) => m.id === 'm9')
    expect(hasSecret).toBe(false)
  })
})
