import http from 'http';
import { randomUUID } from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';
import type { NexusFailureCategory, NexusGatewayStatus } from '../../../shared/types.js';
import storage from '../../storage.js';
import { recordAudit } from '../../audit.js';
import { routeModel } from '../router/modelRouter.js';
import { recordUsage } from '../usage/usageService.js';

const HOST = '127.0.0.1';
const PORT = 8317;
let server: http.Server | null = null;
let startedAt = '';
let lastError = '';

function json(res: ServerResponse, statusCode: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'content-type, authorization, x-api-key, anthropic-version',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  });
  res.end(payload);
}

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 2_000_000) {
        reject(new Error('Request body is too large.'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Request body must be valid JSON.'));
      }
    });
    req.on('error', reject);
  });
}

function estimateTokens(value: unknown): number {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  return text.trim() ? Math.ceil(text.trim().split(/\s+/).length * 1.25) : 0;
}

function gatewayError(code: NexusFailureCategory | 'not_found', message: string, hint?: string, status = 400) {
  return { status, body: { error: { code, message, hint } } };
}

async function handleModels(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  const providers = await storage.getAll<{ id: string; providerName?: string; modelName?: string; enabled?: boolean }>('providerSettings');
  const enabled = providers.filter((provider) => provider.enabled !== false && provider.modelName);
  json(res, 200, {
    object: 'list',
    data: enabled.length
      ? enabled.map((provider) => ({
          id: provider.modelName,
          object: 'model',
          owned_by: provider.providerName || 'localai-nexus',
          provider_id: provider.id,
        }))
      : [{
          id: 'localai-nexus-diagnostic',
          object: 'model',
          owned_by: 'localai-nexus',
        }],
  });
}

async function handleHealth(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  json(res, 200, await getGatewayStatus());
}

async function handleChat(req: IncomingMessage, res: ServerResponse, endpoint: string): Promise<void> {
  const started = Date.now();
  const requestId = randomUUID();
  const body = await readBody(req) as Record<string, unknown>;
  const model = typeof body.model === 'string' ? body.model : undefined;
  const route = await routeModel({ model, intent: 'default' });
  const inputTokens = estimateTokens(body.messages ?? body.input ?? body.prompt ?? body);
  const outputText = route.provider
    ? `LocalAI Nexus routed ${endpoint} to ${route.provider.providerName} using model ${route.model}. Provider forwarding is configured for this Nexus route; live upstream calls are in progress for this build.`
    : `LocalAI Nexus diagnostic response. ${route.reason}`;
  const outputTokens = estimateTokens(outputText);
  await recordUsage({
    provider: route.provider,
    model: route.model,
    endpoint,
    inputTokens,
    outputTokens,
    success: true,
    failureCategory: 'none',
    latencyMs: Date.now() - started,
    requestId,
  });
  await storage.create('gatewayRequests', {
    id: requestId,
    endpoint,
    model: route.model,
    providerId: route.provider?.id,
    status: 'success',
    createdAt: new Date().toISOString(),
  } as never);

  if (endpoint.includes('responses')) {
    json(res, 200, {
      id: `resp_${requestId}`,
      object: 'response',
      model: route.model,
      output: [{
        type: 'message',
        role: 'assistant',
        content: [{ type: 'output_text', text: outputText }],
      }],
      usage: { input_tokens: inputTokens, output_tokens: outputTokens, total_tokens: inputTokens + outputTokens },
      nexus: { routed: Boolean(route.provider), reason: route.reason, fallbackUsed: route.fallbackUsed },
    });
    return;
  }

  if (endpoint.includes('messages')) {
    json(res, 200, {
      id: `msg_${requestId}`,
      type: 'message',
      role: 'assistant',
      model: route.model,
      content: [{ type: 'text', text: outputText }],
      usage: { input_tokens: inputTokens, output_tokens: outputTokens },
      nexus: { routed: Boolean(route.provider), reason: route.reason, fallbackUsed: route.fallbackUsed },
    });
    return;
  }

  json(res, 200, {
    id: `chatcmpl_${requestId}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: route.model,
    choices: [{ index: 0, message: { role: 'assistant', content: outputText }, finish_reason: 'stop' }],
    usage: { prompt_tokens: inputTokens, completion_tokens: outputTokens, total_tokens: inputTokens + outputTokens },
    nexus: { routed: Boolean(route.provider), reason: route.reason, fallbackUsed: route.fallbackUsed },
  });
}

function responsesDiagnostic(res: ServerResponse): void {
  const error = gatewayError(
    'base_url_mismatch',
    'LocalAI Nexus received /responses at the gateway root.',
    'Use Base URL http://127.0.0.1:8317 if your client sends /responses, or use http://127.0.0.1:8317/v1 if your client sends /responses relative to /v1.',
    200,
  );
  json(res, error.status, {
    ...error.body,
    compatibility: {
      rootBaseUrl: 'http://127.0.0.1:8317',
      v1BaseUrl: 'http://127.0.0.1:8317/v1',
      supported: ['/health', '/v1/models', '/v1/chat/completions', '/v1/responses', '/responses', '/v1/messages'],
    },
  });
}

async function requestHandler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method === 'OPTIONS') {
    json(res, 204, {});
    return;
  }
  const url = new URL(req.url || '/', `http://${HOST}:${PORT}`);
  try {
    if (req.method === 'GET' && url.pathname === '/health') {
      await handleHealth(req, res);
      return;
    }
    if (req.method === 'GET' && url.pathname === '/v1/models') {
      await handleModels(req, res);
      return;
    }
    if (req.method === 'POST' && url.pathname === '/v1/chat/completions') {
      await handleChat(req, res, '/v1/chat/completions');
      return;
    }
    if (req.method === 'POST' && url.pathname === '/v1/responses') {
      await handleChat(req, res, '/v1/responses');
      return;
    }
    if (req.method === 'POST' && url.pathname === '/responses') {
      responsesDiagnostic(res);
      return;
    }
    if (req.method === 'POST' && url.pathname === '/v1/messages') {
      await handleChat(req, res, '/v1/messages');
      return;
    }
    const error = gatewayError(
      'not_found',
      `Unsupported LocalAI Nexus gateway path: ${url.pathname}`,
      'Supported paths: /health, /v1/models, /v1/chat/completions, /v1/responses, /responses, /v1/messages.',
      404,
    );
    json(res, error.status, error.body);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    lastError = message;
    await recordUsage({
      endpoint: url.pathname,
      inputTokens: 0,
      outputTokens: 0,
      success: false,
      failureCategory: 'protocol_error',
      latencyMs: 0,
    }).catch(() => undefined);
    json(res, 500, { error: { code: 'gateway_error', message, hint: 'Open LocalAI Nexus Diagnostics for details.' } });
  }
}

export async function startGateway(): Promise<NexusGatewayStatus> {
  if (server) return getGatewayStatus();
  server = http.createServer((req, res) => {
    requestHandler(req, res).catch((error) => {
      lastError = error instanceof Error ? error.message : String(error);
      json(res, 500, { error: { code: 'gateway_error', message: lastError } });
    });
  });
  await new Promise<void>((resolve, reject) => {
    server?.once('error', reject);
    server?.listen(PORT, HOST, () => {
      startedAt = new Date().toISOString();
      lastError = '';
      resolve();
    });
  }).catch((error) => {
    server = null;
    lastError = error instanceof Error ? error.message : String(error);
    throw error;
  });
  await recordAudit({
    type: 'gateway.request',
    action: 'gateway.start',
    status: 'success',
    severity: 'info',
    actor: {},
    metadata: { host: HOST, port: PORT },
  }).catch(() => undefined);
  return getGatewayStatus();
}

export async function stopGateway(): Promise<NexusGatewayStatus> {
  if (!server) return getGatewayStatus();
  await new Promise<void>((resolve) => {
    server?.close(() => resolve());
  });
  server = null;
  startedAt = '';
  return getGatewayStatus();
}

export async function getGatewayStatus(): Promise<NexusGatewayStatus> {
  const providers = await storage.getAll<{ id: string; enabled?: boolean }>('providerSettings').catch(() => []);
  const activeProviderRef = String((await storage.getById<{ id: string; value?: unknown }>('settings', 'activeProviderRef').catch(() => null))?.value ?? '');
  const activeModel = String((await storage.getById<{ id: string; value?: unknown }>('settings', 'activeModel').catch(() => null))?.value ?? '');
  return {
    online: Boolean(server?.listening),
    host: HOST,
    port: PORT,
    baseUrl: `http://${HOST}:${PORT}`,
    startedAt: startedAt || undefined,
    lastError: lastError || undefined,
    activeProviderRef,
    activeModel,
    providerCount: providers.filter((provider) => provider.enabled !== false).length,
    defaultBaseUrlHint: `http://${HOST}:${PORT}`,
    v1BaseUrlHint: `http://${HOST}:${PORT}/v1`,
  };
}
