import type { ProviderSetting, NexusProviderTag } from '../../../shared/types.js';
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
}

function providerMatchesIntent(provider: ProviderSetting, intent: RouteModelRequest['intent']): boolean {
  if (!intent || intent === 'default') return provider.tags?.includes('default') ?? false;
  return provider.tags?.includes(intent) ?? false;
}

function isCoolingDown(provider: ProviderSetting): boolean {
  if (!provider.cooldownUntil) return false;
  return new Date(provider.cooldownUntil).getTime() > Date.now();
}

export async function routeModel(request: RouteModelRequest = {}): Promise<RouteModelResult> {
  const providers = (await storage.getAll<ProviderSetting>('providerSettings'))
    .filter((provider) => provider.enabled !== false)
    .filter((provider) => !isCoolingDown(provider));
  const requested = request.model?.trim() || '';
  const preferred = requested
    ? providers.find((provider) => provider.modelName === requested)
    : undefined;
  if (preferred) {
    return {
      provider: preferred,
      model: requested,
      reason: `Selected provider ${preferred.providerName} because it already uses requested model ${requested}.`,
      fallbackUsed: false,
    };
  }
  const intent = request.intent ?? 'default';
  const tagged = providers.find((provider) => providerMatchesIntent(provider, intent));
  if (tagged) {
    return {
      provider: tagged,
      model: requested || tagged.modelName,
      reason: `Selected provider ${tagged.providerName} by "${intent}" route tag.`,
      fallbackUsed: false,
    };
  }
  const fallback = providers.find((provider) => provider.tags?.includes('fallback')) ?? providers[0];
  if (fallback) {
    return {
      provider: fallback,
      model: requested || fallback.modelName,
      reason: `Selected fallback provider ${fallback.providerName}; no provider matched the requested route.`,
      fallbackUsed: true,
    };
  }
  return {
    model: requested || 'localai-nexus-diagnostic',
    reason: 'No enabled provider is configured. Returning LocalAI Nexus diagnostic response.',
    fallbackUsed: true,
  };
}
