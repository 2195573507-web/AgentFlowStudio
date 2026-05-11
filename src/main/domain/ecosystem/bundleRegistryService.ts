import { randomUUID } from 'crypto';
import type { NexusTemplateBundle } from '../../../shared/types.js';
import storage from '../../storage.js';

export const BUILTIN_TEMPLATE_BUNDLES: NexusTemplateBundle[] = [
  {
    id: 'builtin-desktop-app',
    name: 'Desktop App Pack',
    description: 'Local-first desktop application planning, prompts, tasks, workflow, and release checklist.',
    type: 'template',
    version: '1.0.0',
    riskLevel: 'low',
    enabled: true,
    localOnly: true,
    assumptions: ['Electron security remains enabled', 'JSON storage remains local', 'No cloud dependency is required'],
    templates: [{
      id: 'desktop-app-kickoff',
      name: 'Desktop app kickoff',
      projectType: 'desktop app',
      prompt: 'Create a local-first desktop feature with secure preload/IPC boundaries and full verification.',
      acceptance: ['typecheck passes', 'unit tests pass', 'build passes', 'handoff docs updated'],
    }],
    createdAt: '2026-05-11T00:00:00.000Z',
    updatedAt: '2026-05-11T00:00:00.000Z',
  },
  {
    id: 'builtin-firmware-project',
    name: 'Firmware Project Pack',
    description: 'Embedded project prompts for pin maps, serial output, build recipes, and hardware-state validation.',
    type: 'template',
    version: '1.0.0',
    riskLevel: 'medium',
    enabled: true,
    localOnly: true,
    assumptions: ['Hardware assumptions must be verified from schematics or logs', 'Build and runtime verification are reported separately'],
    templates: [{
      id: 'firmware-bringup',
      name: 'Firmware bring-up',
      projectType: 'firmware project',
      prompt: 'Inspect the actual checkout, anchor pin changes to source evidence, and keep serial output visible in main.',
      acceptance: ['source path verified', 'build command documented', 'runtime limitation documented'],
    }],
    createdAt: '2026-05-11T00:00:00.000Z',
    updatedAt: '2026-05-11T00:00:00.000Z',
  },
  {
    id: 'builtin-web-app',
    name: 'Web App Pack',
    description: 'Frontend feature scaffolding with UI states, accessibility, and browser smoke checks.',
    type: 'template',
    version: '1.0.0',
    riskLevel: 'low',
    enabled: true,
    localOnly: true,
    assumptions: ['Use existing design system', 'Check 1024x680 minimum layout', 'Avoid decorative-only UI'],
    templates: [{
      id: 'web-feature',
      name: 'Web feature',
      projectType: 'web app',
      prompt: 'Implement a usable first screen with loading, empty, error, and data states.',
      acceptance: ['responsive layout checked', 'E2E path covered', 'no console errors'],
    }],
    createdAt: '2026-05-11T00:00:00.000Z',
    updatedAt: '2026-05-11T00:00:00.000Z',
  },
];

export async function listTemplateBundles(): Promise<NexusTemplateBundle[]> {
  const custom = await storage.getAll<NexusTemplateBundle>('templateBundles').catch(() => []);
  const byId = new Map<string, NexusTemplateBundle>();
  for (const bundle of BUILTIN_TEMPLATE_BUNDLES) byId.set(bundle.id, bundle);
  for (const bundle of custom) byId.set(bundle.id, bundle);
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function upsertTemplateBundle(input: Partial<NexusTemplateBundle>): Promise<NexusTemplateBundle> {
  if (!input.name?.trim()) throw new Error('Bundle name is required.');
  if (input.localOnly === false) throw new Error('Remote-dependent bundles are not allowed.');
  const now = new Date().toISOString();
  const bundle: NexusTemplateBundle = {
    id: input.id || randomUUID(),
    name: input.name,
    description: input.description || 'LocalAI Nexus local bundle.',
    type: input.type || 'template',
    version: input.version || '0.1.0',
    riskLevel: input.riskLevel || 'low',
    enabled: input.enabled ?? true,
    localOnly: true,
    assumptions: input.assumptions || [],
    templates: input.templates || [],
    createdAt: input.createdAt || now,
    updatedAt: now,
  };
  const existing = await storage.getById('templateBundles', bundle.id);
  return existing
    ? await storage.update<NexusTemplateBundle>('templateBundles', bundle.id, bundle) as NexusTemplateBundle
    : await storage.create<NexusTemplateBundle>('templateBundles', bundle);
}

export async function toggleTemplateBundle(id: string, enabled: boolean): Promise<NexusTemplateBundle> {
  const builtIn = BUILTIN_TEMPLATE_BUNDLES.find((bundle) => bundle.id === id);
  const existing = await storage.getById<NexusTemplateBundle>('templateBundles', id);
  const source = existing ?? builtIn;
  if (!source) throw new Error('Bundle not found.');
  return upsertTemplateBundle({ ...source, enabled });
}

