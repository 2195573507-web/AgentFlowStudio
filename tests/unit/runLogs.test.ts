import { describe, expect, it } from 'vitest'
import { buildRunQualityChecklist, parseRunNodeTrace, serializeRun } from '../../src/renderer/lib/runLogs'
import type { Run } from '../../src/shared/types'

function makeRun(overrides: Partial<Run> = {}): Run {
  return {
    id: 'run-1',
    projectId: 'project-1',
    title: 'Secret regression',
    tool: 'Codex',
    status: 'failed',
    summary: 'api key leaked as sk-test-secret',
    error: 'Bearer token-super-secret',
    log: 'npm.cmd run test failed with password=plain-secret and sk-test-secret',
    durationMs: 1200,
    retryCount: 1,
    nodeTrace: [
      {
        id: 'node-1',
        name: 'Collect input',
        status: 'failed',
        inputSummary: 'api_key=hidden-secret',
        outputSummary: 'secret=output-secret',
        failureReason: 'token=node-token',
        retryCount: 1,
      },
    ],
    createdAt: '2026-05-10T00:00:00.000Z',
    ...overrides,
  }
}

describe('runLogs', () => {
  it('serializes runs with all exported log fields redacted', () => {
    const serialized = serializeRun(makeRun())

    for (const leaked of [
      'sk-test-secret',
      'sk-',
      'token-super-secret',
      'plain-secret',
      'hidden-secret',
      'output-secret',
      'node-token',
    ]) {
      expect(serialized).not.toContain(leaked)
    }
    expect(serialized).toContain('[REDACTED]')
  })

  it('parses logs into node traces and marks failures', () => {
    const nodes = parseRunNodeTrace('setup ok\nPlaywright error timeout', 'failed')
    expect(nodes).toHaveLength(2)
    expect(nodes.some((node) => node.failureReason)).toBe(true)
  })

  it('builds a run quality checklist for handoff readiness', () => {
    const checklist = buildRunQualityChecklist(makeRun({ status: 'success', summary: 'tests passed', log: 'npm.cmd run test passed' }))
    expect(checklist.every((item) => typeof item.passed === 'boolean')).toBe(true)
    expect(checklist.find((item) => item.id === 'verification')?.passed).toBe(true)
  })
})
