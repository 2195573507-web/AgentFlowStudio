import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryStore } from '../../src/renderer/lib/memoryStore'
import type { Memory } from '../../src/shared/types'

function makeMemory(overrides: Partial<Memory> = {}): Memory {
  return {
    id: 'm1',
    type: 'project_context',
    title: 'Test Memory',
    content: 'Test content for memory store',
    tags: ['test'],
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

describe('MemoryStore', () => {
  let store: MemoryStore

  beforeEach(() => {
    store = new MemoryStore()
  })

  it('starts empty', () => {
    expect(store.getAll()).toHaveLength(0)
  })

  it('sets and retrieves memories', () => {
    const mems = [makeMemory({ id: '1' }), makeMemory({ id: '2' })]
    store.setMemories(mems)
    expect(store.getAll()).toHaveLength(2)
  })

  it('gets memory by id', () => {
    store.setMemories([makeMemory({ id: 'abc' })])
    expect(store.getById('abc')).toBeDefined()
    expect(store.getById('xyz')).toBeUndefined()
  })

  it('filters by project', () => {
    store.setMemories([
      makeMemory({ id: '1', projectId: 'p1' }),
      makeMemory({ id: '2', projectId: 'p2' }),
      makeMemory({ id: '3', projectId: 'p1' }),
    ])
    expect(store.getByProject('p1')).toHaveLength(2)
    expect(store.getByProject('p2')).toHaveLength(1)
    expect(store.getByProject('p3')).toHaveLength(0)
  })

  it('filters by type', () => {
    store.setMemories([
      makeMemory({ id: '1', type: 'project_context' }),
      makeMemory({ id: '2', type: 'decision' }),
      makeMemory({ id: '3', type: 'project_context' }),
    ])
    expect(store.getByType('project_context')).toHaveLength(2)
    expect(store.getByType('decision')).toHaveLength(1)
    expect(store.getByType('issue_fix')).toHaveLength(0)
  })

  it('filters by provider', () => {
    store.setMemories([
      makeMemory({ id: '1', providerScope: 'Claude Code' }),
      makeMemory({ id: '2', providerScope: 'Codex' }),
      makeMemory({ id: '3', providerScope: 'Claude Code' }),
    ])
    expect(store.getByProvider('Claude Code')).toHaveLength(2)
    expect(store.getByProvider('Codex')).toHaveLength(1)
  })

  it('filters by status', () => {
    store.setMemories([
      makeMemory({ id: '1', status: 'active' }),
      makeMemory({ id: '2', status: 'pending' }),
      makeMemory({ id: '3', status: 'archived' }),
    ])
    expect(store.getByStatus('active')).toHaveLength(1)
    expect(store.getByStatus('pending')).toHaveLength(1)
    expect(store.getByStatus('archived')).toHaveLength(1)
  })

  it('searches by title and content', () => {
    store.setMemories([
      makeMemory({ id: '1', title: 'React Setup', content: 'Setting up React' }),
      makeMemory({ id: '2', title: 'Node Config', content: 'Node.js configuration' }),
    ])
    expect(store.search('React')).toHaveLength(1)
    expect(store.search('Node')).toHaveLength(1)
    expect(store.search('nonexistent')).toHaveLength(0)
  })

  it('searches by tags', () => {
    store.setMemories([
      makeMemory({ id: '1', tags: ['react', 'frontend'] }),
      makeMemory({ id: '2', tags: ['node', 'backend'] }),
    ])
    expect(store.search('react')).toHaveLength(1)
  })

  it('returns top memories by importance', () => {
    store.setMemories([
      makeMemory({ id: '1', importance: 1 }),
      makeMemory({ id: '2', importance: 5 }),
      makeMemory({ id: '3', importance: 3 }),
    ])
    const top = store.getTopByImportance(2)
    expect(top).toHaveLength(2)
    expect(top[0].importance).toBe(5)
    expect(top[1].importance).toBe(3)
  })

  it('returns active memories', () => {
    store.setMemories([
      makeMemory({ id: '1', status: 'active' }),
      makeMemory({ id: '2', status: 'pending' }),
      makeMemory({ id: '3', status: 'archived' }),
      makeMemory({ id: '4', status: 'active' }),
    ])
    expect(store.getActive()).toHaveLength(2)
  })

  it('handles empty store gracefully', () => {
    expect(store.search('anything')).toHaveLength(0)
    expect(store.getByProject('p1')).toHaveLength(0)
    expect(store.getByType('decision')).toHaveLength(0)
    expect(store.getTopByImportance(5)).toHaveLength(0)
    expect(store.getActive()).toHaveLength(0)
  })
})
