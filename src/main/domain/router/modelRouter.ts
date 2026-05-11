import { randomUUID } from 'crypto';
import type { NexusProviderTag, NexusRouterDecision, NexusUsageRecord, ProviderSetting } from '../../../shared/types.js';
import storage from '../../storage.js';

export interface RouteModelRequest {
  intent?: NexusProviderTag | 'default';
  model?: string;
}

export interface RouteModelResult {
  provider?: ProviderSetting;
  model: string;
  reason: string;
  fallbackUsed: boolean;
  quotaState: NexusRouterDecision['quotaState'];
  decisionId?: string;
}

function providerMatchesIntent(provider: ProviderSetting, intent: RouteModelRequest['intent']): boolean {
  if (!intent || intent === 'default') return provider.tags?.includes('default') ?? false;
  return provider.tags?.includes(intent) ?? false;
}

function isCoolingDown(provider: ProviderSetting): boolean {
  if (!provider.cooldownUntil) return false;
  return new Date(provider.cooldownUntil).getTime() > Date.now();
}

async function recordDecision(result: Omit<NexusRouterDecision, 'id' | 'checkedAt'>): Promise<RouteModelResult> {
  const decision: NexusRouterDecision = {
    id: randomUUID(),
    checkedAt: new Date().toISOString(),
    ...result,
  };
  await storage.create('modelRoutes', decision as never).catch(() => undefined);
  return {
    provider: result.providerId
      ? (await storage.getById<ProviderSetting>('providerSettings', result.providerId).catch(() => undefined)) ?? undefined
      : undefined,
    model: result.model,
    reason: result.reason,
    fallbackUsed: result.fallbackUsed,
    quotaState: result.quotaState,
    decisionId: decision.id,
  };
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function startOfMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
}

async function providerQuotaState(provider: ProviderSetting): Promise<NexusRouterDecision['quotaState']> {
  if (isCoolingDown(provider)) return 'cooldown';
  const dailyQuota = Number(provider.dailyQuota ?? 0);
  const monthlyQuota = Number(provider.monthlyQuota ?? 0);
  if (dailyQuota > 0 || monthlyQuota > 0) {
    const now = new Date();
    const day = startOfDay(now);
    const month = startOfMonth(now);
    const usage = await storage.getAll<NexusUsageRecord>('tokenUsage').catch(() => []);
    const providerUsage = usage.filter((record) => record.providerId === provider.id);
    const dailyTokens = providerUsage
      .filter((record) => new Date(record.createdAt).getTime() >= day)
      .reduce((sum, record) => sum + record.totalTokens, 0);
    const monthlyTokens = providerUsage
      .filter((record) => new Date(record.createdAt).getTime() >= month)
      .reduce((sum, record) => sum + record.totalTokens, 0);
    if ((dailyQuota > 0 && dailyTokens >= dailyQuota) || (monthlyQuota > 0 && monthlyTokens >= monthlyQuota)) {
      return 'quota_exhausted';
    }
  }
  return 'available';
}

export async function routeModel(request: RouteModelRequest = {}): Promise<RouteModelResult> {
  const allProviders = (await storage.getAll<ProviderSetting>('providerSettings'))
    .filter((provider) => provider.enabled !== false);
  const stateEntries = await Promise.all(allProviders.map(async (provider) => [provider.id, await providerQuotaState(provider)] as const));
  const states = new Map(stateEntries);
  const providers = allProviders.filter((provider) => states.get(provider.id) === 'available');
  const requested = request.model?.trim() || '';
  const preferred = requested
    ? providers.find((provider) => provider.modelName === requested)
    : undefined;
  if (preferred) {
    return recordDecision({
      providerId: preferred.id,
      providerName: preferred.providerName,
      model: requested,
      intent: request.intent ?? 'default',
      reason: `Selected provider ${preferred.providerName} because it already uses requested model ${requested}.`,
      fallbackUsed: false,
      quotaState: 'available',
    });
  }
  const intent = request.intent ?? 'default';
  const tagged = providers.find((provider) => providerMatchesIntent(provider, intent));
  if (tagged) {
    return recordDecision({
      providerId: tagged.id,
      providerName: tagged.providerName,
      model: requested || tagged.modelName,
      intent,
      reason: `Selected provider ${tagged.providerName} by "${intent}" route tag.`,
      fallbackUsed: false,
      quotaState: 'available',
    });
  }
  const fallback = providers.find((provider) => provider.tags?.includes('fallback')) ?? providers[0];
  if (fallback) {
    return recordDecision({
      providerId: fallback.id,
      providerName: fallback.providerName,
      model: requested || fallback.modelName,
      intent,
      reason: `Selected fallback provider ${fallback.providerName}; no provider matched the requested route.`,
      fallbackUsed: true,
      quotaState: 'available',
    });
  }
  const cooling = allProviders.find((provider) => states.get(provider.id) === 'cooldown');
  const exhausted = allProviders.find((provider) => states.get(provider.id) === 'quota_exhausted');
  return recordDecision({
    model: requested || 'localai-nexus-diagnostic',
    intent,
    reason: exhausted
      ? 'All matching providers exceeded quota. Returning LocalAI Nexus diagnostic response.'
      : cooling
      ? 'All matching providers are cooling down. Returning LocalAI Nexus diagnostic response.'
      : 'No enabled provider is configured. Returning LocalAI Nexus diagnostic response.',
    fallbackUsed: true,
    quotaState: exhausted ? 'quota_exhausted' : cooling ? 'cooldown' : 'unconfigured',
  });
}
