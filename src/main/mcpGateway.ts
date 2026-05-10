import { randomUUID } from 'node:crypto';
import type { McpAllowlistEntry, McpGatewayDecision, McpGatewayRequest } from '../shared/types.js';

const MAX_ARGUMENT_BYTES = 64 * 1024;
const NAME_PATTERN = /^[a-zA-Z0-9_.:-]{1,80}$/;

function byteLength(value: unknown): number {
  return Buffer.byteLength(JSON.stringify(value ?? {}), 'utf8');
}

function normalizeName(value: unknown): string {
  return String(value ?? '').trim();
}

export function evaluateMcpGatewayRequest(
  request: McpGatewayRequest,
  allowlist: McpAllowlistEntry[],
  now = new Date(),
): McpGatewayDecision {
  const serverName = normalizeName(request.serverName);
  const toolName = normalizeName(request.toolName);
  const argumentBytes = byteLength(request.arguments);
  const base = {
    id: randomUUID(),
    serverName,
    toolName,
    sandbox: {
      network: 'denied' as const,
      filesystem: 'read-only' as const,
      commandExecution: 'denied' as const,
      maxArgumentBytes: MAX_ARGUMENT_BYTES,
    },
    checkedAt: now.toISOString(),
  };

  if (!NAME_PATTERN.test(serverName) || !NAME_PATTERN.test(toolName)) {
    return { ...base, allowed: false, reason: 'Invalid MCP server or tool name.' };
  }
  if (argumentBytes > MAX_ARGUMENT_BYTES) {
    return { ...base, allowed: false, reason: 'MCP tool arguments exceed sandbox input limit.' };
  }

  const entry = allowlist.find(
    (item) => item.enabled && item.serverName === serverName && item.toolName === toolName,
  );
  if (!entry) {
    return { ...base, allowed: false, reason: 'MCP tool is not in the runtime allowlist.' };
  }

  return {
    ...base,
    allowed: true,
    reason: 'Allowed by MCP runtime gateway.',
    allowlistEntryId: entry.id,
    riskLevel: entry.riskLevel,
  };
}
