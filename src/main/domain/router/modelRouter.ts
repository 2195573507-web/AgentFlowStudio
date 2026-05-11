import { randomUUID } from 'crypto';
import type { NexusProviderTag, NexusRouterDecision, ProviderSetting } from '../../../shared/types.js';
import storage from '../../storage.js';
import { evaluateTokenPolicy } from '../usage/tokenPolicyService.js';

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

export async function routeModel(request: RouteModelRequest = {}): Promise<RouteModelResult> {
  const allProviders = (await storage.getAll<ProviderSetting>('providerSettings'))
    .filter((provider) => provider.enabled !== false);
  const requested = request.model?.trim() || '';
  const stateEntries = await Promise.all(
    allProviders.map(async (provider) => [provider.id, await evaluateTokenPolicy(provider, requested || provider.modelName)] as const),
  );
  const states = new Map(stateEntries.map(([id, evaluation]) => [id, evaluation.state] as const));
  const selectableStates = new Set<NexusRouterDecision['quotaState']>(['available', 'unconfigured']);
  const providers = allProviders.filter((provider) => selectableStates.has(states.get(provider.id) ?? 'unconfigured'));
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
      quotaState: states.get(preferred.id) ?? 'unconfigured',
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
      quotaState: states.get(tagged.id) ?? 'unconfigured',
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
      quotaState: states.get(fallback.id) ?? 'unconfigured',
    });
  }
  const cooling = allProviders.find((provider) => states.get(provider.id) === 'cooldown');
  const exhausted = allProviders.find((provider) => states.get(provider.id) === 'quota_exhausted');
  const concurrency = allProviders.find((provider) => states.get(provider.id) === 'concurrency_limited');
  return recordDecision({
    model: requested || 'localai-nexus-diagnostic',
    intent,
    reason: exhausted
      ? 'All matching providers exceeded quota. Returning LocalAI Nexus diagnostic response.'
      : concurrency
      ? 'All matching providers reached concurrency limits. Returning LocalAI Nexus diagnostic response.'
      : cooling
      ? 'All matching providers are cooling down. Returning LocalAI Nexus diagnostic response.'
      : 'No enabled provider is configured. Returning LocalAI Nexus diagnostic response.',
    fallbackUsed: true,
    quotaState: exhausted ? 'quota_exhausted' : concurrency ? 'concurrency_limited' : cooling ? 'cooldown' : 'unconfigured',
  });
}
