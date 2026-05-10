import { randomUUID } from 'crypto';
import type {
  NexusHealthCheckResult,
  NexusHealthStatus,
  ProviderSetting,
} from '../../../shared/types.js';
import { isProtectedSecret, unprotectSecret } from '../../secureStore.js';
import storage from '../../storage.js';
import { classifyFailure } from '../usage/usageService.js';

type ProviderRecord = ProviderSetting & { apiKey?: unknown };

function normalizeProviderUrl(baseUrl: unknown): URL {
  if (typeof baseUrl !== 'string' || !baseUrl.trim()) throw new Error('Provider base URL is required.');
  const parsed = new URL(baseUrl.trim());
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Provider base URL must use http or https.');
  return parsed;
}

function hasReadableSecret(provider: ProviderRecord): boolean {
  if (provider.needsApiKey === false || provider.authType === 'none') return true;
  if (!provider.apiKey) return false;
  if (isProtectedSecret(provider.apiKey)) return Boolean(unprotectSecret(provider.apiKey));
  return typeof provider.apiKey === 'string' && provider.apiKey.length > 0 && !provider.apiKey.startsWith('Saved key ending in ');
}

function statusFromFailure(message: string): NexusHealthStatus {
  const lower = message.toLowerCase();
  if (lower.includes('secret') || lower.includes('api key') || lower.includes('401') || lower.includes('403')) return 'AuthFailed';
  if (lower.includes('model')) return 'ModelUnavailable';
  if (lower.includes('protocol') || lower.includes('base url')) return 'ProtocolError';
  if (lower.includes('quota')) return 'QuotaLow';
  if (lower.includes('429')) return 'RateLimited';
  if (lower.includes('url') || lower.includes('http')) return 'Offline';
  return 'Unknown';
}

function diagnosticSuggestion(status: NexusHealthStatus, provider: ProviderRecord): string {
  if (status === 'Healthy') return 'Provider passed local configuration diagnostics.';
  if (status === 'AuthFailed') return 'Check the API key or credential envelope, then run the provider test again.';
  if (status === 'ProtocolError') return 'Check Base URL and whether the client should use the root URL or a /v1 URL.';
  if (status === 'ModelUnavailable') return `Check model name "${provider.modelName || 'unknown'}" and sync models from the provider.`;
  if (status === 'RateLimited') return 'Wait for cooldown or switch to a fallback provider.';
  if (status === 'Offline') return 'Check whether the base URL is reachable from this machine.';
  return 'Review provider settings and run diagnostics again.';
}

export async function checkProviderHealth(providerId: string): Promise<NexusHealthCheckResult> {
  const started = Date.now();
  const provider = await storage.getById<ProviderRecord>('providerSettings', providerId);
  if (!provider) throw new Error('Provider not found.');
  const checks: NexusHealthCheckResult['checks'] = [];
  let status: NexusHealthStatus = 'Healthy';
  let failureMessage = '';

  try {
    const url = normalizeProviderUrl(provider.baseUrl);
    checks.push({
      name: 'base_url',
      ok: true,
      message: `Base URL parsed as ${url.origin}${url.pathname.replace(/\/$/, '')}`,
      latencyMs: Date.now() - started,
    });
  } catch (error) {
    failureMessage = error instanceof Error ? error.message : String(error);
    status = statusFromFailure(failureMessage);
    checks.push({ name: 'base_url', ok: false, message: failureMessage, latencyMs: Date.now() - started });
  }

  const secretOk = hasReadableSecret(provider);
  checks.push({
    name: 'credential',
    ok: secretOk,
    message: secretOk ? 'Credential policy satisfied.' : 'API key is missing or cannot be read from secure storage.',
  });
  if (!secretOk && status === 'Healthy') {
    status = 'AuthFailed';
    failureMessage = 'API key is missing or cannot be read.';
  }

  const modelOk = Boolean(provider.modelName?.trim());
  checks.push({
    name: 'model',
    ok: modelOk,
    message: modelOk ? `Default model: ${provider.modelName}` : 'Default model is empty.',
  });
  if (!modelOk && status === 'Healthy') {
    status = 'ModelUnavailable';
    failureMessage = 'Default model is empty.';
  }

  const supportsV1 = String(provider.baseUrl ?? '').includes('/v1') || provider.providerId !== 'gemini-compatible';
  checks.push({
    name: 'protocol_hint',
    ok: true,
    message: supportsV1
      ? 'Provider can be routed through OpenAI-compatible /v1 diagnostics.'
      : 'Provider may require protocol conversion before /v1 compatibility.',
  });

  const result: NexusHealthCheckResult = {
    id: randomUUID(),
    providerId: provider.id,
    providerName: provider.providerName,
    baseUrl: provider.baseUrl,
    model: provider.modelName,
    status,
    checks,
    averageLatencyMs: Math.max(1, Date.now() - started),
    errorRate: status === 'Healthy' ? 0 : 1,
    failureCategory: status === 'Healthy' ? 'none' : classifyFailure(undefined, failureMessage),
    suggestion: diagnosticSuggestion(status, provider),
    checkedAt: new Date().toISOString(),
  };

  await storage.create<NexusHealthCheckResult>('healthChecks', result);
  await storage.update('providerSettings', provider.id, {
    lastTestStatus: status === 'Healthy' ? 'success' : 'failure',
    lastTestMessage: result.suggestion,
    lastTestedAt: result.checkedAt,
  } as never);
  return result;
}

export async function listLatestHealthChecks(limit = 20): Promise<NexusHealthCheckResult[]> {
  const checks = await storage.getAll<NexusHealthCheckResult>('healthChecks');
  return checks.sort((a, b) => b.checkedAt.localeCompare(a.checkedAt)).slice(0, Math.min(Math.max(limit, 1), 100));
}

export async function healthSummary(): Promise<{
  latest: NexusHealthCheckResult[];
  byStatus: Record<NexusHealthStatus, number>;
}> {
  const latestByProvider = new Map<string, NexusHealthCheckResult>();
  for (const check of await listLatestHealthChecks(200)) {
    const key = check.providerId || check.providerName || check.id;
    if (!latestByProvider.has(key)) latestByProvider.set(key, check);
  }
  const latest = [...latestByProvider.values()];
  const byStatus = {
    Healthy: 0,
    Degraded: 0,
    RateLimited: 0,
    AuthFailed: 0,
    QuotaLow: 0,
    ModelUnavailable: 0,
    ProtocolError: 0,
    Offline: 0,
    Unknown: 0,
  } satisfies Record<NexusHealthStatus, number>;
  for (const check of latest) byStatus[check.status] += 1;
  return { latest, byStatus };
}
