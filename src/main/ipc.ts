import { ipcMain, dialog, app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import { IPC_CHANNELS } from '../shared/types.js';
import type { MemoryType } from '../shared/types.js';
import { sanitizeObject } from '../shared/secretRedaction.js';
import storage from './storage.js';
import { getGitLog, getGitStatus, getGitSummary } from './git.js';
import { readSkillsFromDir, fileExists } from './filesystem.js';
import { sanitizeFilePath } from './security.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function handleError(err: unknown): { error: string } {
  if (err instanceof Error) return { error: err.message };
  return { error: String(err) };
}

const ALLOWED_STORAGE_COLLECTIONS = new Set([
  'projects',
  'tasks',
  'prompts',
  'runs',
  'memories',
  'riskChecks',
  'providerSettings',
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

  ipcMain.handle(IPC_CHANNELS.PROJECT_LIST, async () => {
    try {
      return await storage.getAll('projects');
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROJECT_GET, async (_event, id: string) => {
    try {
      return await storage.getById('projects', id);
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROJECT_CREATE, async (_event, data: unknown) => {
    try {
      return await storage.create('projects', data as never);
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROJECT_UPDATE, async (_event, id: string, data: unknown) => {
    try {
      return await storage.update('projects', id, data as never);
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROJECT_DELETE, async (_event, id: string) => {
    try {
      return await storage.delete('projects', id);
    } catch (err) {
      return handleError(err);
    }
  });

  // ── Tasks ────────────────────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.TASK_LIST, async (_event, projectId: string) => {
    try {
      const all = await storage.getAll<{ id: string; [key: string]: unknown }>('tasks');
      return all.filter((t) => t.projectId === projectId);
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.TASK_CREATE, async (_event, data: unknown) => {
    try {
      return await storage.create('tasks', data as never);
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.TASK_UPDATE, async (_event, id: string, data: unknown) => {
    try {
      return await storage.update('tasks', id, data as never);
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.TASK_DELETE, async (_event, id: string) => {
    try {
      return await storage.delete('tasks', id);
    } catch (err) {
      return handleError(err);
    }
  });

  // ── Prompts ──────────────────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.PROMPT_LIST, async (_event, projectId: string) => {
    try {
      const all = await storage.getAll<{ id: string; [key: string]: unknown }>('prompts');
      return all.filter((p) => p.projectId === projectId);
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROMPT_CREATE, async (_event, data: unknown) => {
    try {
      return await storage.create('prompts', data as never);
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROMPT_UPDATE, async (_event, id: string, data: unknown) => {
    try {
      return await storage.update('prompts', id, data as never);
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROMPT_DELETE, async (_event, id: string) => {
    try {
      return await storage.delete('prompts', id);
    } catch (err) {
      return handleError(err);
    }
  });

  // ── Runs ─────────────────────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.RUN_LIST, async (_event, projectId: string) => {
    try {
      const all = await storage.getAll<{ id: string; [key: string]: unknown }>('runs');
      return all.filter((r) => r.projectId === projectId);
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.RUN_CREATE, async (_event, data: unknown) => {
    try {
      return await storage.create('runs', data as never);
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

  // ── Memory ───────────────────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.MEMORY_LIST, async (_event, filters?: { id: string; [key: string]: unknown }) => {
    try {
      const all = await storage.getAll<{ id: string; [key: string]: unknown }>('memories');
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

  ipcMain.handle(IPC_CHANNELS.MEMORY_GET, async (_event, id: string) => {
    try {
      return await storage.getById('memories', id);
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.MEMORY_CREATE, async (_event, data: unknown) => {
    try {
      return await storage.create('memories', sanitizeObject(data) as never);
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.MEMORY_UPDATE, async (_event, id: string, data: unknown) => {
    try {
      return await storage.update('memories', id, sanitizeObject(data) as never);
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.MEMORY_DELETE, async (_event, id: string) => {
    try {
      return await storage.delete('memories', id);
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.MEMORY_EXPORT, async () => {
    try {
      const all = sanitizeObject(await storage.getAll('memories'));
      return { memories: all, exportedAt: new Date().toISOString() };
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.MEMORY_IMPORT, async (_event, data: unknown) => {
    try {
      const payload = sanitizeObject(data) as { memories?: Array<{ id: string; [key: string]: unknown }> };
      if (!payload || !Array.isArray(payload.memories)) {
        return { error: 'Invalid import data: expected { memories: [...] }' };
      }
      const existing = await storage.getAll<{ id: string; [key: string]: unknown }>('memories');
      const existingIds = new Set(existing.map((m) => m.id));
      let imported = 0;
      for (const mem of payload.memories) {
        if (existingIds.has(String(mem.id))) {
          await storage.update('memories', String(mem.id), sanitizeObject(mem) as never);
        } else {
          await storage.create('memories', sanitizeObject(mem) as never);
        }
        imported++;
      }
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
    ) => {
      try {
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

        const safePath = sanitizeFilePath(result.filePath);
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

        const safePath = sanitizeFilePath(result.filePath);
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
      const skillsDir = path.join(process.cwd(), '.agents', 'skills');
      return await readSkillsFromDir(skillsDir);
    } catch (err) {
      return handleError(err);
    }
  });

  ipcMain.handle(IPC_CHANNELS.SKILL_READ, async (_event, skillPath: string) => {
    try {
      const safePath = sanitizeFilePath(skillPath);
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
