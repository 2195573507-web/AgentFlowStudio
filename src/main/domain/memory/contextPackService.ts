import { randomUUID } from 'crypto';
import type { Memory, NexusContextPackPreview, NexusRecoveryPack } from '../../../shared/types.js';
import { sanitizeObject } from '../../../shared/secretRedaction.js';
import storage from '../../storage.js';

const STALE_DAYS = 45;

function isStale(memory: Memory, now = Date.now()): boolean {
  const source = new Date(memory.updatedAt || memory.lastUsedAt || memory.createdAt).getTime();
  return Number.isFinite(source) && now - source > STALE_DAYS * 86_400_000;
}

function relatedMemoryPairs(memories: Memory[]): NexusContextPackPreview['related'] {
  const pairs: NexusContextPackPreview['related'] = [];
  for (let index = 0; index < memories.length; index += 1) {
    for (let otherIndex = index + 1; otherIndex < memories.length; otherIndex += 1) {
      const left = memories[index];
      const right = memories[otherIndex];
      const sharedTags = (left.tags ?? []).filter((tag) => (right.tags ?? []).includes(tag));
      if (sharedTags.length > 0) {
        pairs.push({
          memoryId: left.id,
          relatedMemoryId: right.id,
          reason: `Shared tags: ${sharedTags.slice(0, 3).join(', ')}`,
        });
      } else if (left.projectId && left.projectId === right.projectId) {
        pairs.push({
          memoryId: left.id,
          relatedMemoryId: right.id,
          reason: `Same project: ${left.projectId}`,
        });
      }
      if (pairs.length >= 24) return pairs;
    }
  }
  return pairs;
}

export async function previewContextPack(projectId?: string): Promise<NexusContextPackPreview> {
  const all = await storage.getAll<Memory>('memories').catch(() => []);
  const memories = all
    .filter((memory) => memory.status === 'active')
    .filter((memory) => !projectId || !memory.projectId || memory.projectId === projectId)
    .sort((a, b) => b.importance - a.importance || b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 12);
  const stale = memories.filter((memory) => isStale(memory));
  const related = relatedMemoryPairs(memories);
  const memoryLines = memories.map((memory) => `- ${memory.title}: ${memory.content.slice(0, 240)}`);
  const redactedPrompt = sanitizeObject([
    '# LocalAI Nexus Recovery Context',
    '',
    `Generated: ${new Date().toISOString()}`,
    projectId ? `Project: ${projectId}` : 'Project: workspace',
    '',
    '## Active Memories',
    ...memoryLines,
    '',
    '## Verification Context',
    '- Include latest TEST_REPORT, PROJECT_PROGRESS, git diff, workflow run, provider trace, and security report before handing off.',
  ].join('\n')) as string;
  return {
    id: randomUUID(),
    generatedAt: new Date().toISOString(),
    sources: [
      { type: 'memory', label: 'Active Shared Memory', included: true, redacted: true },
      { type: 'docs', label: 'PROJECT_PROGRESS and TEST_REPORT', included: true, redacted: true },
      { type: 'git_diff', label: 'Current Git diff summary', included: true, redacted: true },
      { type: 'workflow_run', label: 'Recent workflow run timeline', included: true, redacted: true },
      { type: 'provider_trace', label: 'Gateway/provider trace IDs', included: true, redacted: true },
    ],
    memoryCount: memories.length,
    staleMemoryCount: stale.length,
    related,
    prompt: redactedPrompt,
  };
}

export async function buildRecoveryPack(projectId?: string): Promise<NexusRecoveryPack> {
  const preview = await previewContextPack(projectId);
  const memories = await storage.getAll<Memory>('memories').catch(() => []);
  const scoped = memories
    .filter((memory) => memory.status === 'active')
    .filter((memory) => !projectId || !memory.projectId || memory.projectId === projectId)
    .sort((a, b) => b.importance - a.importance || b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 12);
  const gatewayRequests = await storage.getAll<{ id: string; createdAt?: string; [key: string]: unknown }>('gatewayRequests').catch(() => []);
  const workflowRuns = await storage.getAll<{ id: string; projectId?: string; metadata?: Record<string, unknown>; createdAt?: string }>('runs').catch(() => []);
  const providerTraceIds = gatewayRequests
    .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))
    .slice(0, 10)
    .map((request) => request.id);
  const workflowRunIds = workflowRuns
    .filter((run) => !projectId || run.projectId === projectId)
    .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))
    .slice(0, 10)
    .map((run) => run.id);
  const staleMemoryIds = scoped.filter((memory) => isStale(memory)).map((memory) => memory.id);
  const pack: NexusRecoveryPack = {
    id: randomUUID(),
    generatedAt: new Date().toISOString(),
    projectId,
    sourceLabels: preview.sources.filter((source) => source.included).map((source) => source.label),
    memoryIds: scoped.map((memory) => memory.id),
    staleMemoryIds,
    providerTraceIds,
    workflowRunIds,
    redaction: 'secrets-redacted',
    prompt: sanitizeObject([
      preview.prompt,
      '',
      '## Related Memory Graph',
      ...preview.related.map((item) => `- ${item.memoryId} -> ${item.relatedMemoryId}: ${item.reason}`),
      '',
      '## Provider Trace IDs',
      ...providerTraceIds.map((id) => `- ${id}`),
      '',
      '## Workflow Run IDs',
      ...workflowRunIds.map((id) => `- ${id}`),
    ].join('\n')) as string,
  };
  return pack;
}
