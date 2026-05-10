import { describe, expect, it } from 'vitest'
import { evaluateMcpGatewayRequest } from '../../src/main/mcpGateway'
import type { McpAllowlistEntry } from '../../src/shared/types'

const allowlist: McpAllowlistEntry[] = [
  {
    id: 'filesystem:read_file',
    serverName: 'filesystem',
    toolName: 'read_file',
    permission: 'mcp:write',
    enabled: true,
    riskLevel: 'medium',
    createdAt: '2026-05-10T00:00:00.000Z',
    updatedAt: '2026-05-10T00:00:00.000Z',
  },
]

describe('MCP runtime gateway', () => {
  it('allows exact allowlisted tools with a restrictive sandbox decision', () => {
    const decision = evaluateMcpGatewayRequest(
      { serverName: 'filesystem', toolName: 'read_file', arguments: { path: 'README.md' } },
      allowlist,
      new Date('2026-05-10T00:00:00.000Z'),
    )
    expect(decision.allowed).toBe(true)
    expect(decision.sandbox).toMatchObject({
      network: 'denied',
      filesystem: 'read-only',
      commandExecution: 'denied',
    })
    expect(decision.allowlistEntryId).toBe('filesystem:read_file')
  })

  it('denies malformed names, missing allowlist entries, and oversized arguments', () => {
    expect(evaluateMcpGatewayRequest({ serverName: '../bad', toolName: 'read_file' }, allowlist).allowed).toBe(false)
    expect(evaluateMcpGatewayRequest({ serverName: 'filesystem', toolName: 'write_file' }, allowlist).allowed).toBe(false)
    expect(evaluateMcpGatewayRequest({ serverName: 'filesystem', toolName: 'read_file', arguments: 'x'.repeat(70_000) }, allowlist).allowed).toBe(false)
  })
})
