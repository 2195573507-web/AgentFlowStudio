import { randomUUID } from 'crypto';
import type { NexusSkillTestResult, SkillRegistryEntry } from '../../../shared/types.js';
import storage from '../../storage.js';
import { recordUsage } from '../usage/usageService.js';

export async function createPromptSkill(input: Partial<SkillRegistryEntry>): Promise<SkillRegistryEntry> {
  const now = new Date().toISOString();
  const skill: SkillRegistryEntry = {
    id: input.id || randomUUID(),
    name: String(input.name || 'Untitled Prompt Skill'),
    description: String(input.description || 'Prompt skill managed by LocalAI Nexus.'),
    category: String(input.category || 'prompt'),
    type: 'prompt',
    riskLevel: input.riskLevel || 'low',
    inputSchema: input.inputSchema || { type: 'object', properties: { input: { type: 'string' } } },
    outputSchema: input.outputSchema || { type: 'object', properties: { output: { type: 'string' } } },
    promptTemplate: input.promptTemplate || 'Process this input:\n\n{{input}}',
    testSample: input.testSample || { input: 'Hello LocalAI Nexus' },
    version: input.version || '0.1.0',
    permissions: input.permissions || [],
    enabled: input.enabled ?? true,
    createdAt: input.createdAt || now,
    updatedAt: now,
  };
  const existing = await storage.getById('skillsRegistry', skill.id);
  return existing
    ? await storage.update<SkillRegistryEntry>('skillsRegistry', skill.id, skill) as SkillRegistryEntry
    : await storage.create<SkillRegistryEntry>('skillsRegistry', skill);
}

function renderTemplate(template: string, input: Record<string, unknown>): string {
  return template.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_match, key: string) => {
    const value = input[key];
    return value === undefined || value === null ? '' : String(value);
  });
}

function countTokens(value: string): number {
  return value.trim() ? Math.ceil(value.trim().split(/\s+/).length * 1.3) : 0;
}

export async function testPromptSkill(
  skillId: string,
  input: Record<string, unknown> = {},
): Promise<NexusSkillTestResult> {
  const skill = await storage.getById<SkillRegistryEntry>('skillsRegistry', skillId);
  if (!skill) throw new Error('Skill not found.');
  if (skill.enabled === false) throw new Error('Skill is disabled.');
  const prompt = renderTemplate(skill.promptTemplate || '{{input}}', {
    ...(skill.testSample || {}),
    ...input,
  });
  const output = `Prompt Skill "${skill.name}" rendered successfully.\n\n${prompt}`;
  const tokens = {
    input: countTokens(prompt),
    output: countTokens(output),
    total: countTokens(prompt) + countTokens(output),
  };
  await recordUsage({
    endpoint: 'skill:test',
    skillId,
    inputTokens: tokens.input,
    outputTokens: tokens.output,
    success: true,
    failureCategory: 'none',
    latencyMs: 1,
  });
  const result: NexusSkillTestResult = {
    ok: true,
    skillId,
    output,
    input,
    riskLevel: skill.riskLevel || 'low',
    tokens,
    createdAt: new Date().toISOString(),
  };
  await storage.create('skillRuns', {
    id: randomUUID(),
    skillId,
    status: 'success',
    input,
    output,
    tokens,
    createdAt: result.createdAt,
  } as never);
  return result;
}
