import { randomUUID } from 'crypto';
import type { Memory, NexusContextPackPreview } from '../../../shared/types.js';
import { sanitizeObject } from '../../../shared/secretRedaction.js';
import storage from '../../storage.js';

const STALE_DAYS = 45;

function isStale(memory: Memory, now = Date.now()): boolean {
  const source = new Date(memory.updatedAt || memory.lastUsedAt || memory.createdAt).getTime();
  return Number.isFinite(source) && now - source > STALE_DAYS * 86_400_000;
}

export async function previewContextPack(projectId?: string): Promise<NexusContextPackPreview> {
  const all = await storage.getAll<Memory>('memories').catch(() => []);
  const memories = all
    .filter((memory) => memory.status === 'active')
    .filter((memory) => !projectId || !memory.projectId || memory.projectId === projectId)
    .sort((a, b) => b.importance - a.importance || b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 12);
  const stale = memories.filter((memory) => isStale(memory));
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
    prompt: redactedPrompt,
  };
}

