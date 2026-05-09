import { afterEach, describe, expect, it, vi } from 'vitest'
import { api } from '../../src/renderer/lib/api'
import type { Run } from '../../src/shared/types'

const originalWindow = globalThis.window

function setAgentflowBridge(agentflow: unknown) {
  Object.defineProperty(globalThis, 'window', {
    value: { agentflow },
    configurable: true,
    writable: true,
  })
}

describe('api.runs', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    Object.defineProperty(globalThis, 'window', {
      value: originalWindow,
      configurable: true,
      writable: true,
    })
  })

  it('creates and lists agent run records through the namespaced preload API', async () => {
    const createdRun: Run = {
      id: 'run-1',
      projectId: 'project-1',
      title: 'Codex regression pass',
      tool: 'Codex',
      status: 'done',
      log: 'npm.cmd run test -- tests/unit/apiRuns.test.ts',
      summary: 'Agent run record persisted for later review.',
      createdAt: '2026-05-09T10:00:00.000Z',
    }
    const create = vi.fn(async () => createdRun)
    const list = vi.fn(async () => [createdRun])
    setAgentflowBridge({ runs: { create, list } })

    const payload: Omit<Run, 'id'> = {
      projectId: createdRun.projectId,
      title: createdRun.title,
      tool: createdRun.tool,
      status: createdRun.status,
      log: createdRun.log,
      summary: createdRun.summary,
      createdAt: createdRun.createdAt,
    }

    await expect(api.runs.create(payload)).resolves.toEqual(createdRun)
    await expect(api.runs.list('project-1')).resolves.toEqual([createdRun])

    expect(create).toHaveBeenCalledTimes(1)
    expect(create).toHaveBeenCalledWith(payload)
    expect(list).toHaveBeenCalledTimes(1)
    expect(list).toHaveBeenCalledWith('project-1')
  })

  it('falls back to the legacy run API shape when namespaced runs are unavailable', async () => {
    const createdRun: Run = {
      id: 'run-legacy',
      projectId: 'project-legacy',
      title: 'Legacy bridge run',
      tool: 'Claude Code',
      status: 'blocked',
      log: 'manual validation pending',
      summary: 'Legacy bridge still supports run records.',
      createdAt: '2026-05-09T10:05:00.000Z',
    }
    const createRun = vi.fn(async () => createdRun)
    const listRuns = vi.fn(async () => [createdRun])
    setAgentflowBridge({ createRun, listRuns })

    const payload: Omit<Run, 'id'> = {
      projectId: createdRun.projectId,
      title: createdRun.title,
      tool: createdRun.tool,
      status: createdRun.status,
      log: createdRun.log,
      summary: createdRun.summary,
      createdAt: createdRun.createdAt,
    }

    await expect(api.runs.create(payload)).resolves.toEqual(createdRun)
    await expect(api.runs.list('project-legacy')).resolves.toEqual([createdRun])

    expect(createRun).toHaveBeenCalledWith(payload)
    expect(listRuns).toHaveBeenCalledWith('project-legacy')
  })

  it('returns safe fallbacks when Electron preload is not available', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    Object.defineProperty(globalThis, 'window', {
      value: {},
      configurable: true,
      writable: true,
    })

    await expect(api.runs.list('project-1')).resolves.toEqual([])
    await expect(
      api.runs.create({
        projectId: 'project-1',
        title: 'Unavailable bridge',
        tool: 'Codex',
        status: 'done',
        log: '',
        summary: '',
        createdAt: '2026-05-09T10:10:00.000Z',
      }),
    ).resolves.toMatchObject({ id: '', projectId: 'project-1' })

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('window.agentflow is not available'))
  })
})
