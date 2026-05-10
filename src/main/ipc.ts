import { ipcMain, dialog, app, BrowserWindow, type IpcMainInvokeEvent } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import { randomUUID } from 'crypto';
import { IPC_CHANNELS } from '../shared/types.js';
import type { MemoryType, ReleaseStatus, ReleaseTestResult, ReleaseTestStatus } from '../shared/types.js';
import { sanitizeObject } from '../shared/secretRedaction.js';
import storage from './storage.js';
import { getGitLog, getGitStatus, getGitSummary } from './git.js';
import { readSkillsFromDir, fileExists } from './filesystem.js';
import { sanitizeFilePath, sanitizeRealFilePath, validateUserChosenSavePath } from './security.js';
import type { AuditQuery } from '../shared/auditTypes.js';
import type { ChangePasswordRequest, CreateUserRequest, LoginRequest, ResetPasswordRequest, UpdateUserRequest } from '../shared/authTypes.js';
import { assertProjectAccess, canAccessProjectResource, canRole, type Permission, type ResourceAction } from './rbac.js';
import {
  bootstrapAuth,
  changePassword,
  clearActiveRendererSession,
  createUser,
  getActiveRendererSession,
  listUsers,
  login,
  resetPassword,
  sessionState,
  updateUser,
  validateSession,
  type SessionContext,
} from './session.js';
import { listAuditEvents, recordAudit } from './audit.js';
import { verifyAuditIntegrity } from './audit.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function handleError(err: unknown): { error: string } {
  if (err instanceof Error) return { error: err.message };
  return { error: String(err) };
}

const PUBLIC_CHANNELS = new Set<string>([
  IPC_CHANNELS.AUTH_BOOTSTRAP,
  IPC_CHANNELS.AUTH_LOGIN,
  IPC_CHANNELS.AUTH_SESSION,
  IPC_CHANNELS.APP_INFO,
]);

const CHANNEL_PERMISSIONS: Partial<Record<string, Permission>> = {
  [IPC_CHANNELS.AUTH_LOGOUT]: 'app:read',
  [IPC_CHANNELS.AUTH_CHANGE_PASSWORD]: 'app:read',
  [IPC_CHANNELS.STORAGE_GET]: 'admin:users',
  [IPC_CHANNELS.STORAGE_GET_ALL]: 'admin:users',
  [IPC_CHANNELS.STORAGE_SET]: 'admin:users',
  [IPC_CHANNELS.STORAGE_DELETE]: 'admin:users',
  [IPC_CHANNELS.PROJECT_LIST]: 'project:read',
  [IPC_CHANNELS.PROJECT_GET]: 'project:read',
  [IPC_CHANNELS.PROJECT_CREATE]: 'project:write',
  [IPC_CHANNELS.PROJECT_UPDATE]: 'project:write',
  [IPC_CHANNELS.PROJECT_DELETE]: 'project:write',
  [IPC_CHANNELS.TASK_LIST]: 'project:read',
  [IPC_CHANNELS.TASK_CREATE]: 'task:write',
  [IPC_CHANNELS.TASK_UPDATE]: 'task:write',
  [IPC_CHANNELS.TASK_DELETE]: 'task:write',
  [IPC_CHANNELS.PROMPT_LIST]: 'project:read',
  [IPC_CHANNELS.PROMPT_CREATE]: 'prompt:write',
  [IPC_CHANNELS.PROMPT_UPDATE]: 'prompt:write',
  [IPC_CHANNELS.PROMPT_DELETE]: 'prompt:write',
  [IPC_CHANNELS.RUN_LIST]: 'project:read',
  [IPC_CHANNELS.RUN_CREATE]: 'run:write',
  [IPC_CHANNELS.RUN_EVENTS_LIST]: 'project:read',
  [IPC_CHANNELS.MCP_ALLOWLIST_LIST]: 'mcp:write',
  [IPC_CHANNELS.MCP_ALLOWLIST_CHECK]: 'mcp:write',
  [IPC_CHANNELS.MCP_ALLOWLIST_UPSERT]: 'mcp:write',
  [IPC_CHANNELS.GIT_LOG]: 'git:read',
  [IPC_CHANNELS.GIT_STATUS]: 'git:read',
  [IPC_CHANNELS.GIT_SUMMARY]: 'git:read',
  [IPC_CHANNELS.RELEASE_STATUS]: 'git:read',
  [IPC_CHANNELS.MEMORY_LIST]: 'memory:read',
  [IPC_CHANNELS.MEMORY_GET]: 'memory:read',
  [IPC_CHANNELS.MEMORY_CREATE]: 'memory:write',
  [IPC_CHANNELS.MEMORY_UPDATE]: 'memory:write',
  [IPC_CHANNELS.MEMORY_DELETE]: 'memory:write',
  [IPC_CHANNELS.MEMORY_EXPORT]: 'memory:export',
  [IPC_CHANNELS.MEMORY_IMPORT]: 'memory:write',
  [IPC_CHANNELS.MEMORY_GENERATE_CONTEXT]: 'memory:read',
  [IPC_CHANNELS.SETTINGS_GET]: 'settings:read',
  [IPC_CHANNELS.SETTINGS_GET_ALL]: 'settings:read',
  [IPC_CHANNELS.SETTINGS_SET]: 'settings:write',
  [IPC_CHANNELS.PROVIDER_LIST]: 'provider:read',
  [IPC_CHANNELS.PROVIDER_CREATE]: 'provider:write',
  [IPC_CHANNELS.PROVIDER_UPDATE]: 'provider:write',
  [IPC_CHANNELS.PROVIDER_DELETE]: 'provider:write',
  [IPC_CHANNELS.EXPORT_MARKDOWN]: 'export:write',
  [IPC_CHANNELS.EXPORT_JSON]: 'export:write',
  [IPC_CHANNELS.SKILLS_LIST]: 'skill:read',
  [IPC_CHANNELS.SKILL_READ]: 'skill:read',
  [IPC_CHANNELS.GET_DATA_PATH]: 'app:read',
  [IPC_CHANNELS.DIALOG_OPEN]: 'dialog:open',
  [IPC_CHANNELS.USER_LIST]: 'admin:users',
  [IPC_CHANNELS.USER_CREATE]: 'admin:users',
  [IPC_CHANNELS.USER_UPDATE]: 'admin:users',
  [IPC_CHANNELS.USER_RESET_PASSWORD]: 'admin:users',
  [IPC_CHANNELS.AUDIT_LIST]: 'admin:audit',
  [IPC_CHANNELS.AUDIT_EXPORT]: 'admin:audit',
};

const PASSWORD_CHANGE_ALLOWED = new Set<string>([
  IPC_CHANNELS.AUTH_LOGOUT,
  IPC_CHANNELS.AUTH_CHANGE_PASSWORD,
  IPC_CHANNELS.AUTH_SESSION,
]);

function readAuthHeader(args: unknown[]): { sessionId?: string; sessionToken?: string; rest: unknown[] } {
  const first = args[0];
  if (first && typeof first === 'object' && '__auth' in first) {
    const auth = (first as { __auth?: { sessionId?: unknown; sessionToken?: unknown } }).__auth;
    const active = getActiveRendererSession();
    return { sessionId: typeof auth?.sessionId === 'string' ? auth.sessionId : active.sessionId, sessionToken: active.sessionToken, rest: args.slice(1) };
  }
  return { rest: args };
}

async function guardIpcCall(channel: string, args: unknown[]): Promise<{ args: unknown[]; context?: SessionContext }> {
  const { sessionId, sessionToken, rest } = readAuthHeader(args);
  if (PUBLIC_CHANNELS.has(channel)) return { args };
  const permission = CHANNEL_PERMISSIONS[channel];
  if (!permission) throw new Error(`No IPC permission policy for channel: ${channel}`);
  const context = await validateSession(sessionId, sessionToken);
  if (!context) {
    await recordAudit({
      type: 'permission.denied',
      action: channel,
      status: 'denied',
      severity: 'warning',
      actor: {},
      metadata: { reason: 'missing_or_invalid_session', channel },
    });
    throw new Error('Authentication required.');
  }
  if (!canRole(context.user.role, permission)) {
    await recordAudit({
      type: 'permission.denied',
      action: channel,
      status: 'denied',
      severity: 'warning',
      actor: { userId: context.user.id, email: context.user.email, role: context.user.role, sessionId: context.session.id },
      metadata: { permission, channel },
    });
    throw new Error(`Permission denied: ${permission}`);
  }
  if (context.user.mustChangePassword && !PASSWORD_CHANGE_ALLOWED.has(channel)) {
    await recordAudit({
      type: 'permission.denied',
      action: channel,
      status: 'denied',
      severity: 'critical',
      actor: { userId: context.user.id, email: context.user.email, role: context.user.role, sessionId: context.session.id },
      metadata: { reason: 'must_change_password', channel },
    });
    throw new Error('Password change required before using this workspace.');
  }
  return { args: rest, context };
}

function actorFor(context?: SessionContext) {
  return context
    ? { userId: context.user.id, email: context.user.email, role: context.user.role, sessionId: context.session.id }
    : {};
}

function aclForOwner(context: SessionContext) {
  const now = new Date().toISOString();
  return {
    ownerUserId: context.user.id,
    visibility: 'private' as const,
    entries: [{ userId: context.user.id, role: 'owner' as const, grantedBy: context.user.id, grantedAt: now }],
  };
}

async function getProjectForAccess(projectId: string) {
  return storage.getById<{ id: string; [key: string]: unknown }>('projects', projectId);
}

async function assertProjectResourceAccess(context: SessionContext | undefined, projectId: string, action: ResourceAction) {
  if (!context) throw new Error('Authentication required.');
  const project = await getProjectForAccess(projectId);
  assertProjectAccess(context, project as never, action);
  return project;
}

async function assertChildResourceAccess(
  context: SessionContext | undefined,
  collection: 'tasks' | 'prompts' | 'runs' | 'memories',
  id: string,
  action: ResourceAction,
) {
  if (!context) throw new Error('Authentication required.');
  const item = await storage.getById<{ id: string; projectId?: string; [key: string]: unknown }>(collection, id);
  if (!item) throw new Error('Resource not found.');
  if (item.projectId) await assertProjectResourceAccess(context, item.projectId, action);
  return item;
}

async function filterProjectScoped<T extends { projectId?: string }>(context: SessionContext | undefined, items: T[]) {
  if (!context) return [];
  if (context.user.role === 'admin') return items;
  const visible: T[] = [];
  for (const item of items) {
    if (!item.projectId) continue;
    const project = await getProjectForAccess(item.projectId);
    if (canAccessProjectResource(context, project as never, 'read')) visible.push(item);
  }
  return visible;
}

async function recordMutationAudit(context: SessionContext | undefined, action: string, resource: { type: string; id?: string; label?: string }, metadata: Record<string, unknown> = {}) {
  if (!context) return;
  await recordAudit({
    type: action === 'run.create' ? 'run.create' : 'admin.operation',
    action,
    status: 'success',
    severity: 'info',
    actor: actorFor(context),
    resource,
    metadata,
  });
}

function assertTrustedIpcSender(event: IpcMainInvokeEvent): void {
  const frameUrl = event.senderFrame?.url ?? '';
  if (frameUrl.startsWith('file://')) return;
  try {
    const parsed = new URL(frameUrl);
    if (parsed.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(parsed.hostname)) return;
  } catch {
    // Fall through to the denial below.
  }
  throw new Error(`Blocked IPC call from untrusted origin: ${frameUrl || 'unknown'}`);
}

function installIpcOriginGuard(): void {
  const originalHandle = ipcMain.handle.bind(ipcMain);
  ipcMain.handle = ((channel: string, listener: (event: IpcMainInvokeEvent, ...args: unknown[]) => unknown) => {
    return originalHandle(channel, async (event, ...args) => {
      assertTrustedIpcSender(event);
      const guarded = await guardIpcCall(channel, args);
      return listener(event, ...guarded.args, guarded.context);
    });
  }) as typeof ipcMain.handle;
}

const ALLOWED_STORAGE_COLLECTIONS = new Set([
  'projects',
  'tasks',
  'prompts',
  'runs',
  'memories',
  'riskChecks',
  'settings',
]);

const MASKED_SECRET = '[REDACTED]';
const MASKED_API_KEY_PREFIX = 'Saved key ending in ';

type ProviderRecord = { id: string; apiKey?: string; [key: string]: unknown };

function assertAllowedCollection(collection: string): void {
  if (!ALLOWED_STORAGE_COLLECTIONS.has(collection)) {
    throw new Error(`Storage collection is not allowed: ${collection}`);
  }
}

function sanitizeForCollection(collection: string, value: unknown): unknown {
  if (collection === 'providerSettings') {
    const providers = Array.isArray(value) ? value : value ? [value] : [];
    const masked = providers.map((provider) =>
      maskProviderForRenderer(provider as { apiKey?: string; [key: string]: unknown }),
    );
    return Array.isArray(value) ? masked : masked[0] ?? value;
  }
  if (collection === 'memories') {
    return sanitizeObject(value);
  }
  return value;
}

function sanitizeStorageWriteForCollection(collection: string, value: unknown): unknown {
  if (collection === 'providerSettings') {
    return sanitizeProviderForStorage(value);
  }
  if (collection === 'memories') {
    return sanitizeObject(value);
  }
  return value;
}

function getSkillsRoot(): string {
  return path.resolve(process.cwd(), '.agents', 'skills');
}

function resolveSkillReadPath(skillPath: string): string {
  const skillsRoot = getSkillsRoot();
  const safePath = sanitizeRealFilePath(skillPath, skillsRoot);
  if (path.basename(safePath) !== 'SKILL.md') {
    throw new Error('Only SKILL.md files can be read from the skills directory.');
  }
  return safePath;
}

async function readProjectText(relativePath: string): Promise<string> {
  const safePath = sanitizeFilePath(relativePath, process.cwd());
  return fs.readFile(safePath, 'utf-8');
}

function extractMarkdownBullets(markdown: string, sectionNames: string[], limit = 6): string[] {
  const lines = markdown.split(/\r?\n/);
  const sectionSet = new Set(sectionNames.map((name) => name.toLowerCase()));
  const bullets: string[] = [];
  let collecting = false;

  for (const line of lines) {
    const heading = line.match(/^#{2,4}\s+(.+?)\s*$/);
    if (heading) {
      const headingText = heading[1].replace(/`/g, '').toLowerCase();
      collecting = sectionSet.has(headingText);
      continue;
    }

    if (!collecting) continue;
    const bullet = line.match(/^\s*[-*]\s+(.+?)\s*$/);
    if (bullet) {
      bullets.push(bullet[1].replace(/`/g, '').trim());
      if (bullets.length >= limit) break;
    }
  }

  return bullets;
}

function parseTestStatus(value: string): ReleaseTestStatus {
  const normalized = value.toUpperCase();
  if (normalized.includes('PASS')) return 'PASS';
  if (normalized.includes('FAIL')) return 'FAIL';
  if (normalized.includes('BLOCK') || normalized.includes('SKIP')) return 'BLOCKED';
  return 'UNKNOWN';
}

function extractLatestTestResults(markdown: string, limit = 8): ReleaseTestResult[] {
  const lines = markdown.split(/\r?\n/);
  const latestIndex = lines.findIndex((line) => /latest results/i.test(line));
  const start = latestIndex >= 0 ? latestIndex : 0;
  const results: ReleaseTestResult[] = [];

  for (let index = start; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line.startsWith('|') || line.includes('---')) continue;
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim());
    if (cells.length < 3 || /^check$/i.test(cells[0])) continue;
    results.push({
      command: cells[0].replace(/`/g, ''),
      status: parseTestStatus(cells[1]),
      details: cells[2].replace(/`/g, ''),
    });
    if (results.length >= limit) break;
  }

  return results;
}

async function buildReleaseStatus(repoPath?: string): Promise<ReleaseStatus> {
  const cwd = sanitizeFilePath(repoPath ?? process.cwd());
  const [gitSummary, gitStatus, appInfo, changelog, testReport, progress] = await Promise.all([
    getGitSummary(cwd),
    getGitStatus(cwd),
    Promise.resolve({ version: app.getVersion() }),
    readProjectText('CHANGELOG.md').catch(() => ''),
    readProjectText('handoff/TEST_REPORT.md').catch(() => ''),
    readProjectText('PROJECT_PROGRESS.md').catch(() => ''),
  ]);

  const updateSummary = [
    ...extractMarkdownBullets(changelog, ['Changed', 'Added', 'Fixed'], 4),
    ...extractMarkdownBullets(progress, ['6. 本轮完成记录', '本轮完成记录'], 4),
  ].slice(0, 6);

  return {
    version: appInfo.version,
    branch: gitSummary.branch || 'unknown',
    gitStatus,
    recentCommits: gitSummary.recentCommits.slice(0, 5),
    updateSummary: updateSummary.length
      ? updateSummary
      : ['本轮摘要将从 CHANGELOG.md 与 PROJECT_PROGRESS.md 自动读取。'],
    testResults: extractLatestTestResults(testReport),
    progressSummary: extractMarkdownBullets(progress, ['7. 下一轮建议', '下一轮建议'], 4),
    checkedAt: new Date().toISOString(),
  };
}

function maskApiKey(apiKey: unknown): string {
  if (typeof apiKey !== 'string' || apiKey.length === 0) return '';
  if (apiKey === MASKED_SECRET || apiKey.startsWith(MASKED_API_KEY_PREFIX)) return apiKey;
  const last4 = apiKey.slice(-4);
  return last4 ? `${MASKED_API_KEY_PREFIX}${last4}` : MASKED_SECRET;
}

function maskProviderForRenderer<T extends { apiKey?: unknown }>(provider: T): T {
  return {
    ...sanitizeObject(provider),
    apiKey: maskApiKey(provider.apiKey),
  };
}

function isMaskedApiKey(value: unknown): boolean {
  return (
    typeof value === 'string' &&
    (value === '' || value === MASKED_SECRET || value.startsWith(MASKED_API_KEY_PREFIX))
  );
}

function sanitizeProviderForStorage(data: unknown, existingApiKey = ''): unknown {
  const payload = sanitizeObject(data) as { apiKey?: unknown; [key: string]: unknown };
  const source =
    data && typeof data === 'object' ? (data as { apiKey?: unknown; [key: string]: unknown }) : {};
  const submittedApiKey = source.apiKey;

  if (typeof submittedApiKey === 'string') {
    if (isMaskedApiKey(submittedApiKey)) {
      payload.apiKey = existingApiKey;
    } else {
      payload.apiKey = submittedApiKey;
    }
  }

  return payload;
}

async function mergeProviderUpdate(id: string, data: unknown): Promise<unknown> {
  const existing = await storage.getById<ProviderRecord>('providerSettings', id);
  return sanitizeProviderForStorage(data, existing?.apiKey ?? '');
}

// ---------------------------------------------------------------------------
// Memory context generation
// ---------------------------------------------------------------------------

async function generateMemoryContext(options: {
  projectId?: string;
  injectionMode?: string;
}): Promise<string> {
  const allMemories = sanitizeObject(
    await storage.getAll<{ id: string; [key: string]: unknown }>('memories'),
  );
  let filtered = allMemories;

  // Filter by project if requested
  if (options.projectId) {
    filtered = filtered.filter(
      (m) => m.projectId === options.projectId || !m.projectId,
    );
  }

  // Only active memories
  filtered = filtered.filter((m) => m.status === 'active');

  // Sort by importance desc, then lastUsedAt desc
  filtered.sort((a, b) => {
    const imp = (Number(b.importance) || 0) - (Number(a.importance) || 0);
    if (imp !== 0) return imp;
    const aDate = String(a.lastUsedAt || '');
    const bDate = String(b.lastUsedAt || '');
    return bDate.localeCompare(aDate);
  });

  // Limit based on injection mode
  let limit = 20;
  if (options.injectionMode === 'minimal') limit = 5;
  else if (options.injectionMode === 'balanced') limit = 10;
  else if (options.injectionMode === 'full') limit = 50;

  const selected = filtered.slice(0, limit);

  // Build context string
  const lines: string[] = [];
  lines.push('# AgentFlow Memory Context');
  lines.push('');

  const categories: Record<string, Array<{ id: string; [key: string]: unknown }>> = {};
  for (const m of selected) {
    const type = String(m.type || 'other');
    if (!categories[type]) categories[type] = [];
    categories[type].push(m);
  }

  for (const [type, mems] of Object.entries(categories)) {
    lines.push(`## ${type}`);
    for (const m of mems) {
      lines.push(`- **${m.title}**: ${m.content}`);
      if (m.tags && Array.isArray(m.tags) && (m.tags as unknown[]).length > 0) {
        lines.push(`  Tags: ${(m.tags as string[]).join(', ')}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Register all handlers
// ---------------------------------------------------------------------------

export function registerIpcHandlers(): void {
  installIpcOriginGuard();
  // Auth and admin channels are explicit and never expose password hashes.

  ipcMain.handle(IPC_CHANNELS.AUTH_BOOTSTRAP, async () => {
    try {
      await bootstrapAuth();
      return { ok: true };
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.AUTH_LOGIN, async (_event, request: LoginRequest) => {
    try {
      return await login(request);
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.AUTH_SESSION, async (_event, sessionId?: string, sessionToken?: string) => {
    try {
      return await sessionState(sessionId, sessionToken);
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.AUTH_LOGOUT, async (_event, context?: SessionContext) => {
    try {
      if (!context) return false;
      await storage.update('sessions', context.session.id, { revokedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as never);
      clearActiveRendererSession(context.session.id);
      await recordAudit({
        type: 'auth.logout',
        action: 'auth.logout',
        status: 'success',
        severity: 'info',
        actor: { userId: context.user.id, email: context.user.email, role: context.user.role, sessionId: context.session.id },
        resource: { type: 'session', id: context.session.id },
      });
      return true;
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.AUTH_CHANGE_PASSWORD, async (_event, request: ChangePasswordRequest, context?: SessionContext) => {
    try {
      if (!context) throw new Error('Authentication required.');
      return await changePassword(context, request.currentPassword, request.newPassword);
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.USER_LIST, async () => {
    try {
      return await listUsers();
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.USER_CREATE, async (_event, request: CreateUserRequest, context?: SessionContext) => {
    try {
      if (!context) throw new Error('Authentication required.');
      return await createUser(context, request);
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.USER_UPDATE, async (_event, request: UpdateUserRequest, context?: SessionContext) => {
    try {
      if (!context) throw new Error('Authentication required.');
      return await updateUser(context, request);
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.USER_RESET_PASSWORD, async (_event, request: ResetPasswordRequest, context?: SessionContext) => {
    try {
      if (!context) throw new Error('Authentication required.');
      return await resetPassword(context, request);
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.AUDIT_LIST, async (_event, query?: AuditQuery) => {
    try {
      return await listAuditEvents(query ?? {});
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.AUDIT_EXPORT, async () => {
    try {
      const events = await listAuditEvents({ limit: Number.MAX_SAFE_INTEGER });
      const integrity = await verifyAuditIntegrity();
      return { auditLogs: events, integrity, exportedAt: new Date().toISOString() };
    } catch (err) {
      return handleError(err);
    }
  });

  // ── Storage (generic) ────────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.STORAGE_GET, async (_event, collection: string, id: string) => {
    try {
      assertAllowedCollection(collection);
      return sanitizeForCollection(collection, await storage.getById(collection as never, id));
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.STORAGE_GET_ALL, async (_event, collection: string) => {
    try {
      assertAllowedCollection(collection);
      return sanitizeForCollection(collection, await storage.getAll(collection as never));
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.STORAGE_SET, async (_event, collection: string, id: string, data: unknown) => {
    try {
      assertAllowedCollection(collection);
      return await storage.update(
        collection as never,
        id,
        sanitizeStorageWriteForCollection(collection, data) as never,
      );
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.STORAGE_DELETE, async (_event, collection: string, id: string) => {
    try {
      assertAllowedCollection(collection);
      return await storage.delete(collection as never, id);
    } catch (err) {
      return handleError(err);
    }
  });

  // ── Projects ─────────────────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.PROJECT_LIST, async (_event, context?: SessionContext) => {
    try {
      const projects = await storage.getAll<{ id: string; [key: string]: unknown }>('projects');
      if (!context || context.user.role === 'admin') return projects;
      return projects.filter((project) => canAccessProjectResource(context, project as never, 'read'));
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROJECT_GET, async (_event, id: string, context?: SessionContext) => {
    try {
      const project = await storage.getById<{ id: string; [key: string]: unknown }>('projects', id);
      if (project && context) assertProjectAccess(context, project as never, 'read');
      return project;
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROJECT_CREATE, async (_event, data: unknown, context?: SessionContext) => {
    try {
      if (!context) throw new Error('Authentication required.');
      const payload = {
        ...(data && typeof data === 'object' ? data : {}),
        ownerUserId: context.user.id,
        acl: aclForOwner(context),
      };
      const created = await storage.create('projects', payload as never);
      await recordMutationAudit(context, 'workflow.create', { type: 'workflow', id: created.id, label: String((created as { name?: unknown }).name ?? '') });
      return created;
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROJECT_UPDATE, async (_event, id: string, data: unknown, context?: SessionContext) => {
    try {
      await assertProjectResourceAccess(context, id, 'write');
      const existing = await storage.getById<{ id: string; ownerUserId?: string; acl?: unknown }>('projects', id);
      const incoming = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
      const payload = {
        ...incoming,
        ownerUserId: existing?.ownerUserId,
        acl: incoming.acl ?? existing?.acl,
      };
      const updated = await storage.update('projects', id, payload as never);
      await recordMutationAudit(context, 'workflow.update', { type: 'workflow', id });
      return updated;
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROJECT_DELETE, async (_event, id: string, context?: SessionContext) => {
    try {
      await assertProjectResourceAccess(context, id, 'admin');
      const deleted = await storage.delete('projects', id);
      await recordMutationAudit(context, 'workflow.delete', { type: 'workflow', id });
      return deleted;
    } catch (err) {
      return handleError(err);
    }
  });

  // ── Tasks ────────────────────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.TASK_LIST, async (_event, projectId: string, context?: SessionContext) => {
    try {
      await assertProjectResourceAccess(context, projectId, 'read');
      const all = await storage.getAll<{ id: string; [key: string]: unknown }>('tasks');
      return all.filter((t) => t.projectId === projectId);
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.TASK_CREATE, async (_event, data: unknown, context?: SessionContext) => {
    try {
      const projectId = String((data as { projectId?: unknown })?.projectId ?? '');
      await assertProjectResourceAccess(context, projectId, 'write');
      const created = await storage.create('tasks', data as never);
      await recordMutationAudit(context, 'task.create', { type: 'task', id: created.id }, { projectId });
      return created;
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.TASK_UPDATE, async (_event, id: string, data: unknown, context?: SessionContext) => {
    try {
      const existing = await assertChildResourceAccess(context, 'tasks', id, 'write');
      const updated = await storage.update('tasks', id, { ...(data as Record<string, unknown>), projectId: existing.projectId } as never);
      await recordMutationAudit(context, 'task.update', { type: 'task', id }, { projectId: existing.projectId });
      return updated;
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.TASK_DELETE, async (_event, id: string, context?: SessionContext) => {
    try {
      const existing = await assertChildResourceAccess(context, 'tasks', id, 'write');
      const deleted = await storage.delete('tasks', id);
      await recordMutationAudit(context, 'task.delete', { type: 'task', id }, { projectId: existing.projectId });
      return deleted;
    } catch (err) {
      return handleError(err);
    }
  });

  // ── Prompts ──────────────────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.PROMPT_LIST, async (_event, projectId: string, context?: SessionContext) => {
    try {
      await assertProjectResourceAccess(context, projectId, 'read');
      const all = await storage.getAll<{ id: string; [key: string]: unknown }>('prompts');
      return all.filter((p) => p.projectId === projectId);
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROMPT_CREATE, async (_event, data: unknown, context?: SessionContext) => {
    try {
      const projectId = String((data as { projectId?: unknown })?.projectId ?? '');
      if (projectId) await assertProjectResourceAccess(context, projectId, 'write');
      const created = await storage.create('prompts', data as never);
      await recordMutationAudit(context, 'prompt.create', { type: 'prompt', id: created.id }, { projectId });
      return created;
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROMPT_UPDATE, async (_event, id: string, data: unknown, context?: SessionContext) => {
    try {
      const existing = await assertChildResourceAccess(context, 'prompts', id, 'write');
      const updated = await storage.update('prompts', id, { ...(data as Record<string, unknown>), projectId: existing.projectId } as never);
      await recordMutationAudit(context, 'prompt.update', { type: 'prompt', id }, { projectId: existing.projectId });
      return updated;
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROMPT_DELETE, async (_event, id: string, context?: SessionContext) => {
    try {
      const existing = await assertChildResourceAccess(context, 'prompts', id, 'write');
      const deleted = await storage.delete('prompts', id);
      await recordMutationAudit(context, 'prompt.delete', { type: 'prompt', id }, { projectId: existing.projectId });
      return deleted;
    } catch (err) {
      return handleError(err);
    }
  });

  // ── Runs ─────────────────────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.RUN_LIST, async (_event, projectId: string, context?: SessionContext) => {
    try {
      await assertProjectResourceAccess(context, projectId, 'read');
      const all = await storage.getAll<{ id: string; [key: string]: unknown }>('runs');
      return all.filter((r) => r.projectId === projectId);
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.RUN_CREATE, async (_event, data: unknown, context?: SessionContext) => {
    try {
      if (!context) throw new Error('Authentication required.');
      const projectId = String((data as { projectId?: unknown })?.projectId ?? '');
      await assertProjectResourceAccess(context, projectId, 'write');
      const created = await storage.create('runs', { ...(data as Record<string, unknown>), actorUserId: context.user.id } as never);
      await storage.create('runEvents', {
        id: randomUUID(),
        runId: created.id,
        projectId,
        workflowId: projectId,
        type: 'run.created',
        status: 'success',
        actorUserId: context.user.id,
        title: String((created as { title?: unknown }).title ?? 'Run created'),
        detail: String((created as { summary?: unknown }).summary ?? ''),
        createdAt: new Date().toISOString(),
      } as never);
      await recordMutationAudit(context, 'run.create', { type: 'run', id: created.id }, { projectId, runId: created.id });
      return created;
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.RUN_EVENTS_LIST, async (_event, projectId?: string, context?: SessionContext) => {
    try {
      const all = await storage.getAll<{ id: string; projectId?: string; createdAt: string; [key: string]: unknown }>('runEvents');
      const scoped = projectId ? all.filter((event) => event.projectId === projectId) : all;
      const visible = projectId
        ? (await assertProjectResourceAccess(context, projectId, 'read'), scoped)
        : await filterProjectScoped(context, scoped);
      return visible.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.MCP_ALLOWLIST_LIST, async () => {
    try {
      return await storage.getAll('mcpAllowlist');
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.MCP_ALLOWLIST_CHECK, async (_event, request: unknown, context?: SessionContext) => {
    try {
      const serverName = String((request as { serverName?: unknown })?.serverName ?? '');
      const toolName = String((request as { toolName?: unknown })?.toolName ?? '');
      const entries = await storage.getAll<{ id: string; serverName: string; toolName: string; enabled: boolean; permission?: string }>('mcpAllowlist');
      const allowed = entries.some((entry) => entry.enabled && entry.serverName === serverName && entry.toolName === toolName);
      await recordAudit({
        type: allowed ? 'mcp.allowed' : 'mcp.denied',
        action: 'mcp.allowlist.check',
        status: allowed ? 'success' : 'denied',
        severity: allowed ? 'info' : 'warning',
        actor: actorFor(context),
        resource: { type: 'mcp_tool', id: `${serverName}:${toolName}`, label: toolName },
        metadata: { serverName, toolName },
      });
      return { allowed };
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.MCP_ALLOWLIST_UPSERT, async (_event, entry: unknown, context?: SessionContext) => {
    try {
      const now = new Date().toISOString();
      const payload = {
        ...(entry as Record<string, unknown>),
        id: String((entry as { id?: unknown })?.id ?? `${(entry as { serverName?: unknown })?.serverName}:${(entry as { toolName?: unknown })?.toolName}`),
        enabled: Boolean((entry as { enabled?: unknown })?.enabled ?? true),
        updatedAt: now,
        createdAt: String((entry as { createdAt?: unknown })?.createdAt ?? now),
      };
      const existing = await storage.getById('mcpAllowlist', String(payload.id));
      const saved = existing
        ? await storage.update('mcpAllowlist', String(payload.id), payload as never)
        : await storage.create('mcpAllowlist', payload as never);
      await recordMutationAudit(context, 'mcp.allowlist.upsert', { type: 'mcp_tool', id: String(payload.id) });
      return saved;
    } catch (err) {
      return handleError(err);
    }
  });

  // ── Git ──────────────────────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.GIT_LOG, async (_event, repoPath?: string) => {
    try {
      const cwd = sanitizeFilePath(repoPath ?? process.cwd());
      return await getGitLog(cwd);
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.GIT_STATUS, async (_event, repoPath?: string) => {
    try {
      const cwd = sanitizeFilePath(repoPath ?? process.cwd());
      return await getGitStatus(cwd);
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.GIT_SUMMARY, async (_event, repoPath?: string) => {
    try {
      const cwd = sanitizeFilePath(repoPath ?? process.cwd());
      return await getGitSummary(cwd);
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.RELEASE_STATUS, async (_event, repoPath?: string) => {
    try {
      return await buildReleaseStatus(repoPath);
    } catch (err) {
      return handleError(err);
    }
  });

  // ── Memory ───────────────────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.MEMORY_LIST, async (_event, filters?: { id: string; [key: string]: unknown }, context?: SessionContext) => {
    try {
      const raw = await storage.getAll<{ id: string; projectId?: string; [key: string]: unknown }>('memories');
      const scoped = await filterProjectScoped(context, raw);
      const all = sanitizeObject(scoped) as Array<{ id: string; [key: string]: unknown }>;
      if (!filters) return all;
      return all.filter((m) => {
        for (const [key, value] of Object.entries(filters)) {
          if (m[key] !== value) return false;
        }
        return true;
      });
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.MEMORY_GET, async (_event, id: string, context?: SessionContext) => {
    try {
      const memory = await storage.getById<{ id: string; projectId?: string; [key: string]: unknown }>('memories', id);
      if (memory?.projectId) await assertProjectResourceAccess(context, memory.projectId, 'read');
      return sanitizeObject(memory);
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.MEMORY_CREATE, async (_event, data: unknown, context?: SessionContext) => {
    try {
      const projectId = String((data as { projectId?: unknown })?.projectId ?? '');
      if (projectId) await assertProjectResourceAccess(context, projectId, 'write');
      const created = await storage.create('memories', sanitizeObject(data) as never);
      await recordMutationAudit(context, 'memory.create', { type: 'memory', id: created.id }, { projectId });
      return created;
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.MEMORY_UPDATE, async (_event, id: string, data: unknown, context?: SessionContext) => {
    try {
      const existing = await assertChildResourceAccess(context, 'memories', id, 'write');
      const updated = await storage.update('memories', id, sanitizeObject({ ...(data as Record<string, unknown>), projectId: existing.projectId }) as never);
      await recordMutationAudit(context, 'memory.update', { type: 'memory', id }, { projectId: existing.projectId });
      return updated;
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.MEMORY_DELETE, async (_event, id: string, context?: SessionContext) => {
    try {
      const existing = await assertChildResourceAccess(context, 'memories', id, 'write');
      const deleted = await storage.delete('memories', id);
      await recordMutationAudit(context, 'memory.delete', { type: 'memory', id }, { projectId: existing.projectId });
      return deleted;
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.MEMORY_EXPORT, async (_event, context?: SessionContext) => {
    try {
      const raw = await storage.getAll<{ id: string; projectId?: string; [key: string]: unknown }>('memories');
      const all = sanitizeObject(await filterProjectScoped(context, raw));
      await recordMutationAudit(context, 'memory.export', { type: 'memory' });
      return { memories: all, exportedAt: new Date().toISOString() };
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.MEMORY_IMPORT, async (_event, data: unknown, context?: SessionContext) => {
    try {
      const payload = sanitizeObject(data) as { memories?: Array<{ id: string; [key: string]: unknown }> };
      if (!payload || !Array.isArray(payload.memories)) {
        return { error: 'Invalid import data: expected { memories: [...] }' };
      }
      const existing = await storage.getAll<{ id: string; [key: string]: unknown }>('memories');
      const existingIds = new Set(existing.map((m) => m.id));
      let imported = 0;
      for (const mem of payload.memories) {
        const projectId = String(mem.projectId ?? '');
        if (projectId) await assertProjectResourceAccess(context, projectId, 'write');
        if (existingIds.has(String(mem.id))) {
          await storage.update('memories', String(mem.id), sanitizeObject(mem) as never);
        } else {
          await storage.create('memories', sanitizeObject(mem) as never);
        }
        imported++;
      }
      await recordMutationAudit(context, 'memory.import', { type: 'memory' }, { imported });
      return { imported };
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(
    IPC_CHANNELS.MEMORY_GENERATE_CONTEXT,
    async (
      _event,
      options?: { projectId?: string; injectionMode?: string },
      context?: SessionContext,
    ) => {
      try {
        if (options?.projectId) await assertProjectResourceAccess(context, options.projectId, 'read');
        return await generateMemoryContext(options ?? {});
      } catch (err) {
        return handleError(err);
      }
    },
  );

  // ── Settings ─────────────────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, async (_event, key: string) => {
    try {
      const all = await storage.getAll<{ id: string; [key: string]: unknown }>('settings');
      const entry = all.find((s) => s.id === key);
      return entry ?? null;
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, async (_event, key: string, value: unknown) => {
    try {
      const all = await storage.getAll<{ id: string; [key: string]: unknown }>('settings');
      const existing = all.find((s) => s.id === key);
      if (existing) {
        return await storage.update('settings', key, { ...existing, value } as never);
      }
      return await storage.create('settings', { id: key, value } as never);
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET_ALL, async () => {
    try {
      const all = await storage.getAll<{ id: string; [key: string]: unknown }>('settings');
      const result: Record<string, unknown> = {};
      for (const s of all) {
        result[String(s.id)] = s.value;
      }
      return result;
    } catch (err) {
      return handleError(err);
    }
  });

  // ── Providers ────────────────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.PROVIDER_LIST, async () => {
    try {
      const providers = await storage.getAll<ProviderRecord>('providerSettings');
      return providers.map(maskProviderForRenderer);
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROVIDER_CREATE, async (_event, data: unknown) => {
    try {
      const provider = await storage.create(
        'providerSettings',
        sanitizeProviderForStorage(data) as never,
      );
      return maskProviderForRenderer(provider as ProviderRecord);
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROVIDER_UPDATE, async (_event, id: string, data: unknown) => {
    try {
      const payload = await mergeProviderUpdate(id, data);
      const provider = await storage.update('providerSettings', id, payload as never);
      return maskProviderForRenderer(provider as ProviderRecord);
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROVIDER_DELETE, async (_event, id: string) => {
    try {
      return await storage.delete('providerSettings', id);
    } catch (err) {
      return handleError(err);
    }
  });

  // ── Export ───────────────────────────────────────────────────────────

  ipcMain.handle(
    IPC_CHANNELS.EXPORT_MARKDOWN,
    async (_event, content: string, filename: string) => {
      try {
        const win = BrowserWindow.getFocusedWindow();
        if (!win) return { error: 'No focused window for save dialog' };

        const result = await dialog.showSaveDialog(win, {
          title: 'Export Markdown',
          defaultPath: filename.endsWith('.md') ? filename : `${filename}.md`,
          filters: [
            { name: 'Markdown', extensions: ['md'] },
            { name: 'All Files', extensions: ['*'] },
          ],
        });

        if (result.canceled || !result.filePath) return { canceled: true };

        const safePath = validateUserChosenSavePath(result.filePath);
        await fs.writeFile(safePath, sanitizeObject(content), 'utf-8');
        return { success: true, path: safePath };
      } catch (err) {
        return handleError(err);
      }
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.EXPORT_JSON,
    async (_event, data: unknown, filename: string) => {
      try {
        const win = BrowserWindow.getFocusedWindow();
        if (!win) return { error: 'No focused window for save dialog' };

        const result = await dialog.showSaveDialog(win, {
          title: 'Export JSON',
          defaultPath: filename.endsWith('.json') ? filename : `${filename}.json`,
          filters: [
            { name: 'JSON', extensions: ['json'] },
            { name: 'All Files', extensions: ['*'] },
          ],
        });

        if (result.canceled || !result.filePath) return { canceled: true };

        const safePath = validateUserChosenSavePath(result.filePath);
        await fs.writeFile(safePath, JSON.stringify(sanitizeObject(data), null, 2), 'utf-8');
        return { success: true, path: safePath };
      } catch (err) {
        return handleError(err);
      }
    },
  );

  // ── Skills ───────────────────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.SKILLS_LIST, async () => {
    try {
      const skillsDir = getSkillsRoot();
      return await readSkillsFromDir(skillsDir);
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.SKILL_READ, async (_event, skillPath: string) => {
    try {
      const safePath = resolveSkillReadPath(skillPath);
      const exists = await fileExists(safePath);
      if (!exists) return { error: `File not found: ${safePath}` };
      const content = await fs.readFile(safePath, 'utf-8');
      return { path: safePath, content };
    } catch (err) {
      return handleError(err);
    }
  });

  // ── App ──────────────────────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.APP_INFO, async () => {
    try {
      return {
        name: app.getName(),
        version: app.getVersion(),
        electronVersion: process.versions.electron,
        nodeVersion: process.versions.node,
        chromeVersion: process.versions.chrome,
        platform: process.platform,
        arch: process.arch,
      };
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.GET_DATA_PATH, async () => {
    try {
      return app.getPath('userData');
    } catch (err) {
      return handleError(err);
    }
  });

  // ── Dialog ───────────────────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.DIALOG_OPEN, async (_event, options: unknown) => {
    try {
      const win = BrowserWindow.getFocusedWindow();
      if (!win) return { error: 'No focused window for open dialog' };

      const opts = (options as { id: string; [key: string]: unknown }) ?? {};
      const result = await dialog.showOpenDialog(win, {
        title: (opts.title as string) ?? 'Open',
        defaultPath: (opts.defaultPath as string) ?? undefined,
        properties: (opts.properties as Array<'openFile' | 'openDirectory' | 'multiSelections'>) ?? ['openFile'],
        filters: (opts.filters as Array<{ name: string; extensions: string[] }>) ?? [],
      });

      return {
        canceled: result.canceled,
        filePaths: result.filePaths,
      };
    } catch (err) {
      return handleError(err);
    }
  });
}
