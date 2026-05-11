import { randomUUID } from 'crypto';
import type {
  NexusFailureCategory,
  NexusGatewayForwardInput,
  NexusGatewayForwardResult,
  NexusGatewayRequestKind,
  NexusGatewayStreamEventType,
  ProviderSetting,
} from '../../../shared/types.js';
import { isProtectedSecret, unprotectSecret } from '../../secureStore.js';
import { classifyFailure } from '../usage/usageService.js';
import type { RouteModelResult } from '../router/modelRouter.js';

function estimateTokens(value: unknown): number {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  return text.trim() ? Math.ceil(text.trim().split(/\s+/).length * 1.25) : 0;
}

function readSecret(provider: ProviderSetting): string {
  if (provider.authType === 'none' || provider.needsApiKey === false) return '';
  if (!provider.apiKey) return '';
  if (isProtectedSecret(provider.apiKey)) return unprotectSecret(provider.apiKey) || '';
  if (typeof provider.apiKey === 'string' && !provider.apiKey.startsWith('Saved key ending in ')) return provider.apiKey;
  return '';
}

function normalizeBaseUrl(provider: ProviderSetting): string {
  const base = provider.baseUrl.trim().replace(/\/+$/, '');
  if (!base) throw new Error('Provider base URL is required.');
  const parsed = new URL(base);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Provider base URL must use http or https.');
  return parsed.toString().replace(/\/+$/, '');
}

function endpointPath(kind: NexusGatewayRequestKind): string {
  if (kind === 'responses') return '/responses';
  if (kind === 'messages') return '/messages';
  return '/chat/completions';
}

function buildOpenAiUrl(provider: ProviderSetting, kind: NexusGatewayRequestKind): string {
  const base = normalizeBaseUrl(provider);
  const hasV1 = /\/v1(?:\/)?$/i.test(base);
  const root = hasV1 ? base : `${base}/v1`;
  return `${root}${endpointPath(kind)}`;
}

function toText(body: unknown): string {
  if (!body || typeof body !== 'object') return String(body ?? '');
  const value = body as Record<string, unknown>;
  if (typeof value.output_text === 'string') return value.output_text;
  if (typeof value.text === 'string') return value.text;
  const choices = Array.isArray(value.choices) ? value.choices : [];
  const first = choices[0] as { message?: { content?: unknown }; delta?: { content?: unknown }; text?: unknown } | undefined;
  if (typeof first?.message?.content === 'string') return first.message.content;
  if (typeof first?.delta?.content === 'string') return first.delta.content;
  if (typeof first?.text === 'string') return first.text;
  const output = Array.isArray(value.output) ? value.output : [];
  const outputText = output
    .flatMap((item) => typeof item === 'object' && item ? ((item as { content?: unknown[] }).content ?? []) : [])
    .map((item) => typeof item === 'object' && item ? (item as { text?: unknown }).text : '')
    .filter((item): item is string => typeof item === 'string')
    .join('\n');
  return outputText || JSON.stringify(body);
}

function streamEvents(text: string): Array<{ type: NexusGatewayStreamEventType; data: unknown }> {
  const chunks = text.match(/.{1,80}(\s|$)/g)?.map((chunk) => chunk.trim()).filter(Boolean) ?? [text];
  return [
    { type: 'message_start', data: { role: 'assistant' } },
    ...chunks.map((chunk) => ({ type: 'content_delta' as const, data: { text: chunk } })),
    { type: 'message_delta', data: { usage: { output_tokens: estimateTokens(text) } } },
    { type: 'message_stop', data: { finish_reason: 'stop' } },
  ];
}

function formatMockBody(kind: NexusGatewayRequestKind, model: string, text: string, traceId: string, inputTokens: number, outputTokens: number) {
  if (kind === 'responses') {
    return {
      id: `resp_${traceId}`,
      object: 'response',
      model,
      output: [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text }] }],
      usage: { input_tokens: inputTokens, output_tokens: outputTokens, total_tokens: inputTokens + outputTokens },
    };
  }
  if (kind === 'messages') {
    return {
      id: `msg_${traceId}`,
      type: 'message',
      role: 'assistant',
      model,
      content: [{ type: 'text', text }],
      usage: { input_tokens: inputTokens, output_tokens: outputTokens },
    };
  }
  return {
    id: `chatcmpl_${traceId}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [{ index: 0, message: { role: 'assistant', content: text }, finish_reason: 'stop' }],
    usage: { prompt_tokens: inputTokens, completion_tokens: outputTokens, total_tokens: inputTokens + outputTokens },
  };
}

function mockResponse(input: NexusGatewayForwardInput, route: RouteModelResult, started: number): NexusGatewayForwardResult {
  const traceId = input.requestId ?? randomUUID();
  const provider = route.provider;
  const inputTokens = estimateTokens(input.body.messages ?? input.body.input ?? input.body.prompt ?? input.body);
  const text = `LocalAI Nexus mock provider completed ${input.endpoint} through ${provider?.providerName ?? 'diagnostic provider'} with model ${route.model}.`;
  const outputTokens = estimateTokens(text);
  const body = formatMockBody(input.kind, route.model, text, traceId, inputTokens, outputTokens);
  const events = input.stream ? streamEvents(text) : undefined;
  return {
    ok: true,
    statusCode: 200,
    body: input.stream ? { ...body, stream: events } : body,
    providerId: provider?.id,
    providerName: provider?.providerName,
    model: route.model,
    routed: Boolean(provider),
    routeReason: route.reason,
    fallbackUsed: route.fallbackUsed,
    traceId,
    inputTokens,
    outputTokens,
    latencyMs: Date.now() - started,
    failureCategory: 'none',
    streamed: Boolean(input.stream),
    events,
  };
}

function diagnosticResponse(input: NexusGatewayForwardInput, route: RouteModelResult, started: number, message: string, category: NexusFailureCategory): NexusGatewayForwardResult {
  const traceId = input.requestId ?? randomUUID();
  const inputTokens = estimateTokens(input.body.messages ?? input.body.input ?? input.body.prompt ?? input.body);
  const outputTokens = estimateTokens(message);
  return {
    ok: false,
    statusCode: category === '401' || category === '403' ? Number(category) : 400,
    body: {
      error: {
        code: category,
        message,
        trace_id: traceId,
      },
      nexus: {
        routed: Boolean(route.provider),
        reason: route.reason,
        fallbackUsed: route.fallbackUsed,
      },
    },
    providerId: route.provider?.id,
    providerName: route.provider?.providerName,
    model: route.model,
    routed: Boolean(route.provider),
    routeReason: route.reason,
    fallbackUsed: route.fallbackUsed,
    traceId,
    inputTokens,
    outputTokens,
    latencyMs: Date.now() - started,
    failureCategory: category,
  };
}

export async function forwardProviderRequest(input: NexusGatewayForwardInput, route: RouteModelResult): Promise<NexusGatewayForwardResult> {
  const started = Date.now();
  const provider = route.provider;
  if (!provider) {
    return mockResponse(input, route, started);
  }

  const providerId = provider.providerId ?? provider.id;
  if (providerId === 'localai-mock' || provider.baseUrl.startsWith('mock://')) {
    return mockResponse(input, route, started);
  }

  if (!['openai-compatible', 'custom-provider', 'custom', provider.id].includes(String(providerId))) {
    return diagnosticResponse(
      input,
      route,
      started,
      `${provider.providerName} requires protocol conversion before live forwarding. Use a mock provider or an OpenAI-compatible provider for this route.`,
      'protocol_error',
    );
  }

  const apiKey = readSecret(provider);
  if (!apiKey && provider.needsApiKey !== false && provider.authType !== 'none') {
    return diagnosticResponse(input, route, started, 'Provider API key is missing or unavailable to the main process.', '401');
  }

  const traceId = input.requestId ?? randomUUID();
  const inputTokens = estimateTokens(input.body.messages ?? input.body.input ?? input.body.prompt ?? input.body);
  const url = buildOpenAiUrl(provider, input.kind);
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'x-localai-nexus-trace-id': traceId,
    ...(provider.customHeaders ?? {}),
  };
  if (apiKey) headers.authorization = provider.authType === 'apiKey' ? `Bearer ${apiKey}` : `Bearer ${apiKey}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), provider.defaultTimeout ?? 30_000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...input.body, model: input.body.model ?? route.model, stream: Boolean(input.stream) }),
      signal: controller.signal,
    });
    const raw = await response.text();
    let parsed: unknown = raw;
    try {
      parsed = raw ? JSON.parse(raw) : {};
    } catch {
      parsed = { text: raw };
    }
    const text = toText(parsed);
    const outputTokens = estimateTokens(text);
    const failureCategory = response.ok ? 'none' : classifyFailure(response.status, text);
    const events = input.stream && response.ok ? streamEvents(text) : undefined;
    return {
      ok: response.ok,
      statusCode: response.status,
      body: input.stream && response.ok ? { ...(parsed as Record<string, unknown>), stream: events } : parsed,
      providerId: provider.id,
      providerName: provider.providerName,
      model: route.model,
      routed: true,
      routeReason: route.reason,
      fallbackUsed: route.fallbackUsed,
      traceId,
      inputTokens,
      outputTokens,
      latencyMs: Date.now() - started,
      failureCategory,
      streamed: Boolean(input.stream && response.ok),
      events,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return diagnosticResponse(input, route, started, message, classifyFailure(undefined, message));
  } finally {
    clearTimeout(timeout);
  }
}
