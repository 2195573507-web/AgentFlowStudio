import { describe, it, expect } from 'vitest'
import { exportMarkdown, exportJSON, exportMemoriesToMarkdown, exportProjectPlanToMarkdown } from '../../src/renderer/lib/exporters'
import type { Memory, ProjectPlan } from '../../src/shared/types'

describe('exportMarkdown', () => {
  it('returns markdown string with metadata header', () => {
    const result = exportMarkdown('# Hello World', 'test-export')
    expect(result).toContain('test-export')
    expect(result).toContain('Hello World')
  })

  it('includes generation date', () => {
    const result = exportMarkdown('content', 'test')
    expect(result).toContain('date:')
  })

  it('handles empty content', () => {
    const result = exportMarkdown('', 'empty')
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })
})

describe('exportJSON', () => {
  it('returns formatted JSON string', () => {
    const data = { name: 'test', items: [1, 2, 3] }
    const result = exportJSON(data, 'test')
    const parsed = JSON.parse(result)
    expect(parsed._metadata).toBeDefined()
    expect(parsed.data.name).toBe('test')
    expect(parsed.data.items).toEqual([1, 2, 3])
  })

  it('includes metadata in export', () => {
    const result = exportJSON({ key: 'value' }, 'my-export')
    const parsed = JSON.parse(result)
    expect(parsed._metadata).toBeDefined()
    expect(parsed._metadata.filename).toBe('my-export')
  })

  it('redacts secrets in exported JSON', () => {
    const data = { apiKey: 'sk-proj-abc123def456ghijklmnopqrstuvwx', name: 'test' }
    const result = exportJSON(data, 'test')
    expect(result).not.toContain('sk-proj-abc123def456ghijklmnopqrstuvwx')
  })
})

describe('exportMemoriesToMarkdown', () => {
  const memories: Memory[] = [
    {
      id: 'm1',
      type: 'project_context',
      title: 'Project Overview',
      content: 'Building a desktop app',
      tags: ['electron', 'react'],
      projectId: 'p1',
      providerScope: '',
      modelScope: '',
      importance: 5,
      status: 'active',
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-01T00:00:00.000Z',
      lastUsedAt: '2026-05-01T00:00:00.000Z',
    },
    {
      id: 'm2',
      type: 'decision',
      title: 'Use JSON storage',
      content: 'Decided to use JSON storage for v1',
      tags: ['architecture'],
      projectId: 'p1',
      providerScope: '',
      modelScope: '',
      importance: 4,
      status: 'active',
      createdAt: '2026-05-02T00:00:00.000Z',
      updatedAt: '2026-05-02T00:00:00.000Z',
      lastUsedAt: '2026-05-02T00:00:00.000Z',
    },
  ]

  it('exports memories as markdown', () => {
    const result = exportMemoriesToMarkdown(memories, 'My Project')
    expect(result).toContain('My Project')
    expect(result).toContain('Project Overview')
    expect(result).toContain('Use JSON storage')
    expect(result).toContain('项目背景')
    expect(result).toContain('已做决策')
  })

  it('redacts secrets in exported memories', () => {
    const memsWithSecret = [
      { ...memories[0], content: 'My key is sk-proj-abc123def456ghijklmnopqrstuvwx' },
    ]
    const result = exportMemoriesToMarkdown(memsWithSecret)
    expect(result).not.toContain('sk-proj-abc123def456ghijklmnopqrstuvwx')
    expect(result).toContain('[REDACTED]')
  })

  it('handles empty memory array', () => {
    const result = exportMemoriesToMarkdown([])
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })

  it('handles unnamed project', () => {
    const result = exportMemoriesToMarkdown(memories)
    expect(result).toBeTruthy()
  })
})

describe('exportProjectPlanToMarkdown', () => {
  const plan: ProjectPlan = {
    summary: 'A test project',
    prd: '## Requirements\nThe app should do X.',
    architecture: '## Architecture\n- Frontend: React\n- Backend: Node.js',
    directoryStructure: 'src/\n  components/\n  pages/',
    tasks: [],
    testPlan: '## Test Plan\n- Unit tests\n- E2E tests',
    acceptanceCriteria: '## Acceptance\n- All tests pass\n- Build succeeds',
    devPrompt: 'Build this app step by step...',
    codexPrompt: 'Optimize this app...',
    cursorPrompt: 'Create this project...',
  }

  it('exports plan as markdown', () => {
    const result = exportProjectPlanToMarkdown(plan)
    expect(result).toContain('A test project')
    expect(result).toContain('Requirements')
    expect(result).toContain('Architecture')
    expect(result).toContain('Test Plan')
    expect(result).toContain('Acceptance')
  })

  it('includes all major sections', () => {
    const result = exportProjectPlanToMarkdown(plan)
    expect(result).toContain('PRD')
    expect(result).toContain('Architecture')
    expect(result).toContain('目录结构')
    expect(result).toContain('Claude Code Prompt')
    expect(result).toContain('Codex Prompt')
    expect(result).toContain('Cursor Prompt')
  })

  it('handles empty plan sections', () => {
    const emptyPlan: ProjectPlan = {
      summary: '',
      prd: '',
      architecture: '',
      directoryStructure: '',
      tasks: [],
      testPlan: '',
      acceptanceCriteria: '',
      devPrompt: '',
      codexPrompt: '',
      cursorPrompt: '',
    }
    const result = exportProjectPlanToMarkdown(emptyPlan)
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })
})
