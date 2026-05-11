import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { NexusGatewayForwardResult, NexusSecurityReport, NexusTemplateBundle, NexusUsageRecord, ProviderSetting, SkillRegistryEntry } from '../../src/shared/types';
import type { RouteModelRequest, RouteModelResult } from '../../src/main/domain/router/modelRouter';
import type { NexusFailureCategory, NexusRuntimeProfile, NexusSkillTestResult, NexusUsageSummary } from '../../src/shared/types';

const collections = new Map<string, Array<Record<string, unknown>>>();
const uuidState = vi.hoisted(() => ({ count: 0 }));

let classifyFailure: (statusCode?: number, message?: string) => NexusFailureCategory;
let summarizeUsage: (now?: Date) => Promise<NexusUsageSummary>;
let generateRuntimeProfiles: () => Promise<NexusRuntimeProfile[]>;
let routeModel: (request?: RouteModelRequest) => Promise<RouteModelResult>;
let testPromptSkill: (skillId: string, input?: Record<string, unknown>) => Promise<NexusSkillTestResult>;
let forwardProviderRequest: (input: any, route: RouteModelResult) => Promise<NexusGatewayForwardResult>;
let generateSecurityReport: () => Promise<NexusSecurityReport>;
let listTemplateBundles: () => Promise<NexusTemplateBundle[]>;
let toggleTemplateBundle: (id: string, enabled: boolean) => Promise<NexusTemplateBundle>;

vi.stubGlobal('require', (id: string) => {
  if (id === 'crypto') {
    return { randomUUID: () => `test-uuid-${++uuidState.count}` };
  }
  throw new Error(`Unexpected CommonJS require in LocalAI Nexus unit test: ${id}`);
});

vi.mock('crypto', () => ({
  randomUUID: () => `test-uuid-${++uuidState.count}`,
}));

vi.mock('../../src/main/storage', () => ({
  default: {
    async getAll<T>(collection: string): Promise<T[]> {
      return ((collections.get(collection) ?? []) as T[]).map((item) => ({ ...item }));
    },
    async getById<T extends { id: string }>(collection: string, id: string): Promise<T | null> {
      const item = (collections.get(collection) ?? []).find((entry) => entry.id === id);
      return item ? ({ ...item } as T) : null;
    },
    async create<T extends { id: string }>(collection: string, item: T): Promise<T> {
      const items = collections.get(collection) ?? [];
      items.push({ ...item });
      collections.set(collection, items);
      return { ...item };
    },
    async update<T extends { id: string }>(collection: string, id: string, updates: Partial<T>): Promise<T | null> {
      const items = collections.get(collection) ?? [];
      const index = items.findIndex((entry) => entry.id === id);
      if (index < 0) return null;
      items[index] = { ...items[index], ...updates, id };
      collections.set(collection, items);
      return { ...items[index] } as T;
    },
    async delete(collection: string, id: string): Promise<boolean> {
      const items = collections.get(collection) ?? [];
      collections.set(collection, items.filter((entry) => entry.id !== id));
      return true;
    },
  },
}));

vi.mock('../../src/main/secureStore', () => ({
  isProtectedSecret: () => false,
  unprotectSecret: (value: string) => value,
}));

vi.mock('../../src/main/audit', () => ({
  listAuditEvents: async () => [
    { id: 'a1', type: 'permission.denied', action: 'provider:update', status: 'denied', severity: 'warning', actor: {}, createdAt: '2026-05-10T00:00:00.000Z' },
  ],
  recordAudit: async () => undefined,
}));

function seed(collection: string, items: Array<Record<string, unknown>>) {
  collections.set(collection, items.map((item) => ({ ...item })));
}

describe('LocalAI Nexus services', () => {
  beforeAll(async () => {
    ({ classifyFailure, summarizeUsage } = await import('../../src/main/domain/usage/usageService'));
    ({ generateRuntimeProfiles } = await import('../../src/main/domain/runtime/runtimeProfileService'));
    ({ routeModel } = await import('../../src/main/domain/router/modelRouter'));
    ({ testPromptSkill } = await import('../../src/main/domain/skills/skillService'));
    ({ forwardProviderRequest } = await import('../../src/main/domain/provider/providerForwardService'));
    ({ generateSecurityReport } = await import('../../src/main/domain/security/securityReportService'));
    ({ listTemplateBundles, toggleTemplateBundle } = await import('../../src/main/domain/ecosystem/bundleRegistryService'));
  });

  it('summarizes token usage and classifies common failures', async () => {
    seed('tokenUsage', [
      {
        id: 'u1',
        providerId: 'p1',
        providerName: 'OpenAI-compatible',
        model: 'gpt-test',
        endpoint: '/v1/chat/completions',
        inputTokens: 10,
        outputTokens: 20,
        totalTokens: 30,
        success: true,
        failureCategory: 'none',
        latencyMs: 100,
        createdAt: '2026-05-10T00:00:00.000Z',
      },
      {
        id: 'u2',
        providerId: 'p1',
        providerName: 'OpenAI-compatible',
        model: 'gpt-test',
        endpoint: '/v1/responses',
        inputTokens: 2,
        outputTokens: 0,
        totalTokens: 2,
        success: false,
        failureCategory: '429',
        statusCode: 429,
        latencyMs: 300,
        createdAt: '2026-05-10T01:00:00.000Z',
      },
    ] satisfies NexusUsageRecord[]);

    const summary = await summarizeUsage(new Date('2026-05-10T12:00:00.000Z'));
    expect(summary.todayRequests).toBe(2);
    expect(summary.totalTokens).toBe(32);
    expect(summary.successRate).toBe(0.5);
    expect(summary.p95LatencyMs).toBe(300);
    expect(summary.byProvider[0].providerName).toBe('OpenAI-compatible');
    expect(classifyFailure(404, 'model not found')).toBe('model_not_found');
    expect(classifyFailure(undefined, 'Base URL mismatch')).toBe('base_url_mismatch');
  });

  it('routes by provider tags and generates runtime profiles', async () => {
    seed('providerSettings', [
      {
        id: 'p1',
        providerName: 'Primary',
        baseUrl: 'https://example.test/v1',
        apiKey: '',
        modelName: 'model-a',
        enabled: true,
        memoryEnabled: true,
        memoryInjectionMode: 'balanced',
        maxMemoryItems: 10,
        maxMemoryChars: 8000,
        tags: ['default'],
      },
    ] satisfies ProviderSetting[]);
    seed('settings', [{ id: 'activeProviderRef', value: 'p1' }]);

    const route = await routeModel({ intent: 'default' });
    expect(route.provider?.providerName).toBe('Primary');
    expect(route.model).toBe('model-a');

    const profiles = await generateRuntimeProfiles();
    expect(profiles.map((profile) => profile.kind)).toEqual(['codex', 'claude-code', 'cli', 'custom']);
    expect(profiles[0].baseUrl).toBe('http://127.0.0.1:8317/v1');
    expect(profiles[0].diagnostics.join(' ')).toContain('root Base URL');
    expect(profiles[0].redaction).toBe('no-secrets');
  });

  it('forwards through the CI-safe mock provider and records route metadata', async () => {
    seed('providerSettings', [
      {
        id: 'mock-1',
        providerId: 'localai-mock',
        providerName: 'LocalAI Mock',
        baseUrl: 'mock://localai',
        apiKey: '',
        modelName: 'mock-model',
        enabled: true,
        memoryEnabled: false,
        memoryInjectionMode: 'off',
        maxMemoryItems: 0,
        maxMemoryChars: 0,
        tags: ['default'],
      },
    ] satisfies ProviderSetting[]);
    seed('modelRoutes', []);
    const route = await routeModel({ model: 'mock-model' });
    const result = await forwardProviderRequest({
      endpoint: '/v1/chat/completions',
      kind: 'chat.completions',
      body: { model: 'mock-model', messages: [{ role: 'user', content: 'ping' }], stream: true },
      stream: true,
      requestId: 'trace-1',
    }, route);
    expect(result.ok).toBe(true);
    expect(result.streamed).toBe(true);
    expect(result.events?.some((event) => event.type === 'content_delta')).toBe(true);
    expect(JSON.stringify(result.body)).toContain('LocalAI Nexus mock provider');
  });

  it('generates redacted security reports and local ecosystem bundles', async () => {
    seed('providerSettings', [
      {
        id: 'risk-1',
        providerName: 'Risky',
        baseUrl: 'https://example.test/v1',
        apiKey: 'Saved key ending in 1234',
        modelName: 'risky-model',
        enabled: true,
        memoryEnabled: false,
        memoryInjectionMode: 'off',
        maxMemoryItems: 0,
        maxMemoryChars: 0,
        riskLevel: 'high',
      },
    ] satisfies ProviderSetting[]);
    seed('templateBundles', []);
    const report = await generateSecurityReport();
    expect(report.redaction).toBe('secrets-redacted');
    expect(report.deniedEventCount).toBe(1);
    expect(report.providerRiskCount).toBe(1);

    const bundles = await listTemplateBundles();
    expect(bundles.some((bundle) => bundle.id === 'builtin-desktop-app')).toBe(true);
    const toggled = await toggleTemplateBundle('builtin-web-app', false);
    expect(toggled.enabled).toBe(false);
  });

  it('tests prompt skills with token attribution', async () => {
    seed('skillsRegistry', [
      {
        id: 'skill-1',
        name: 'Summarizer',
        description: 'Prompt skill',
        category: 'prompt',
        type: 'prompt',
        riskLevel: 'low',
        promptTemplate: 'Summarize: {{input}}',
        testSample: { input: 'Local gateway diagnostics' },
        enabled: true,
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ] satisfies SkillRegistryEntry[]);
    seed('tokenUsage', []);
    seed('skillRuns', []);

    const result = await testPromptSkill('skill-1');
    expect(result.ok).toBe(true);
    expect(result.output).toContain('Local gateway diagnostics');
    expect(result.tokens.total).toBeGreaterThan(0);
    expect(collections.get('tokenUsage')).toHaveLength(1);
    expect(collections.get('skillRuns')).toHaveLength(1);
  });
});
