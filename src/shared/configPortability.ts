import { sanitizeObject } from './secretRedaction.js';
import { PROVIDER_PRESETS } from './providerPresets.js';
import type { ConfigBundle, ConfigExportManifest, Project, ProviderSetting, SkillRegistryEntry } from './types.js';

const MAX_IMPORT_BYTES = 512 * 1024;
const SCRIPT_KEYS = new Set(['script', 'scripts', 'command', 'commands', 'postinstall', 'preinstall']);

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => `${JSON.stringify(key)}:${stableStringify(val)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export function simpleHash(value: unknown): string {
  const text = stableStringify(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function omitSecretFields<T extends Record<string, unknown>>(record: T): T {
  const clean = sanitizeObject(record) as T;
  delete (clean as Record<string, unknown>).apiKey;
  delete (clean as Record<string, unknown>).sessionToken;
  delete (clean as Record<string, unknown>).cookie;
  delete (clean as Record<string, unknown>).authorization;
  return clean;
}

export function buildConfigBundle(input: {
  providers?: ProviderSetting[];
  projects?: Project[];
  agents?: Array<Record<string, unknown>>;
  templates?: Array<Record<string, unknown>>;
  mcpAllowlist?: Array<Record<string, unknown>>;
  skillsRegistry?: SkillRegistryEntry[];
  now?: Date;
}): ConfigBundle {
  const bundleWithoutManifest = {
    providerPresets: PROVIDER_PRESETS,
    providers: (input.providers ?? []).map((provider) => omitSecretFields(provider as unknown as Record<string, unknown>)),
    projectDefaults: (input.projects ?? []).map((project) => ({
      projectId: project.id,
      defaultProviderRef: project.defaultProviderRef,
      defaultModel: project.defaultModel,
    })),
    agents: (input.agents ?? []).map(omitSecretFields),
    templates: (input.templates ?? []).map(omitSecretFields),
    mcpAllowlist: (input.mcpAllowlist ?? []).map(omitSecretFields),
    skillsRegistry: (input.skillsRegistry ?? []).map((skill) => ({ ...skill })),
  };
  const manifest: ConfigExportManifest = {
    version: 1,
    exportedAt: (input.now ?? new Date()).toISOString(),
    hash: simpleHash(bundleWithoutManifest),
    redaction: 'secrets-omitted',
    counts: {
      providers: bundleWithoutManifest.providers.length,
      projectDefaults: bundleWithoutManifest.projectDefaults.length,
      agents: bundleWithoutManifest.agents.length,
      templates: bundleWithoutManifest.templates.length,
      mcpAllowlist: bundleWithoutManifest.mcpAllowlist.length,
      skillsRegistry: bundleWithoutManifest.skillsRegistry.length,
    },
  };
  return { manifest, ...bundleWithoutManifest };
}

function hasDangerousKeys(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasDangerousKeys);
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value as Record<string, unknown>).some(([key, val]) => {
    const normalized = key.toLowerCase();
    if (SCRIPT_KEYS.has(normalized)) return true;
    if (typeof val === 'string' && /(\.\.\/|\.\.\\|<script|javascript:|powershell|cmd\.exe)/i.test(val)) return true;
    return hasDangerousKeys(val);
  });
}

export function previewConfigImport(raw: string): {
  ok: boolean;
  warnings: string[];
  errors: string[];
  bundle?: ConfigBundle;
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (Buffer.byteLength(raw, 'utf8') > MAX_IMPORT_BYTES) {
    errors.push('Import file is too large.');
    return { ok: false, warnings, errors };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    errors.push('Import file is not valid JSON.');
    return { ok: false, warnings, errors };
  }
  if (!parsed || typeof parsed !== 'object') errors.push('Import root must be an object.');
  if (hasDangerousKeys(parsed)) errors.push('Import contains script, command, path traversal, or HTML script-like content.');
  const candidate = parsed as Partial<ConfigBundle>;
  if (!candidate.manifest || candidate.manifest.version !== 1) errors.push('Manifest version is missing or unsupported.');
  for (const key of ['providers', 'projectDefaults', 'agents', 'templates', 'mcpAllowlist', 'skillsRegistry'] as const) {
    if (candidate[key] !== undefined && !Array.isArray(candidate[key])) errors.push(`${key} must be an array.`);
  }
  if (candidate.manifest?.hash) {
    const { manifest: _manifest, ...rest } = candidate as ConfigBundle;
    const actual = simpleHash(rest);
    if (actual !== candidate.manifest.hash) warnings.push('Manifest hash does not match payload; review before applying.');
  }
  return {
    ok: errors.length === 0,
    warnings,
    errors,
    bundle: errors.length === 0 ? sanitizeObject(candidate) as ConfigBundle : undefined,
  };
}
