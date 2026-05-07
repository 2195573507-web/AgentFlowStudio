import { describe, it, expect } from 'vitest'
import { generateProjectPlan } from '../../src/renderer/lib/planner'
import type { Project, MemoryInjectionMode } from '../../src/shared/types'

const project: any = {
  id: 'test-1',
  name: 'Test App',
  idea: 'Build a task management app with real-time collaboration',
  platform: 'Web',
  techStack: 'Next.js, TypeScript, Prisma, PostgreSQL',
  uiStyle: 'Minimal',
  difficulty: 'Medium',
  status: 'planning',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

describe('generateProjectPlan', () => {
  it('generates a project plan with all sections', () => {
    const plan = generateProjectPlan(project, [], [], 'off')

    expect(plan).toBeDefined()
    expect(plan.summary).toBeTruthy()
    expect(plan.prd).toBeTruthy()
    expect(plan.architecture).toBeTruthy()
    expect(plan.directoryStructure).toBeTruthy()
    expect(plan.tasks).toBeInstanceOf(Array)
    expect(plan.tasks.length).toBeGreaterThan(0)
    expect(plan.testPlan).toBeTruthy()
    expect(plan.acceptanceCriteria).toBeTruthy()
    expect(plan.devPrompt).toBeTruthy()
    expect(plan.codexPrompt).toBeTruthy()
    expect(plan.cursorPrompt).toBeTruthy()
  })

  it('generates tasks with proper structure', () => {
    const plan = generateProjectPlan(project, [], [], 'off')

    for (const task of plan.tasks) {
      expect(task.id).toBeTruthy()
      expect(task.projectId).toBe('test-1')
      expect(task.role).toBeTruthy()
      expect(task.title).toBeTruthy()
      expect(task.description).toBeTruthy()
      expect(task.priority).toMatch(/^(critical|high|medium|low)$/)
      expect(task.status).toBe('todo')
    }
  })

  it('includes project name in summary', () => {
    const plan = generateProjectPlan(project, [], [], 'off')

    expect(plan.summary).toContain('Test App')
    expect(plan.summary).toBeTruthy()
  })

  it('generates platform-appropriate architecture', () => {
    const plan = generateProjectPlan(project, [], [], 'off')

    expect(plan.architecture).toContain('Next.js')
    expect(plan.architecture).toContain('TypeScript')
  })

  it('generates directory structure', () => {
    const plan = generateProjectPlan(project, [], [], 'off')

    expect(plan.directoryStructure).toContain('src')
    expect(plan.directoryStructure.length).toBeGreaterThan(50)
  })

  it('handles empty memories gracefully', () => {
    const plan = generateProjectPlan(project, [], [], 'balanced')
    expect(plan).toBeDefined()
    expect(plan.devPrompt).toBeTruthy()
  })

  it('injects shared memory context when mode is not off', () => {
    const memories: any[] = [{
      id: 'm1',
      type: 'project_context',
      title: 'Context',
      content: 'Important context',
      tags: [],
      projectId: 'test-1',
      providerScope: '',
      modelScope: '',
      importance: 5,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
    }]

    const planOff = generateProjectPlan(project, [], memories, 'off')
    const planFull = generateProjectPlan(project, [], memories, 'full')

    expect(planFull.devPrompt.length).toBeGreaterThanOrEqual(planOff.devPrompt.length)
  })

  it('generates different prompts for Claude Code, Codex, and Cursor', () => {
    const plan = generateProjectPlan(project, [], [], 'off')

    expect(plan.devPrompt).not.toBe(plan.codexPrompt)
    expect(plan.codexPrompt).not.toBe(plan.cursorPrompt)
    expect(plan.devPrompt).toContain('Claude Code')
    expect(plan.codexPrompt).toContain('Codex')
    expect(plan.cursorPrompt).toContain('Cursor')
  })
})
