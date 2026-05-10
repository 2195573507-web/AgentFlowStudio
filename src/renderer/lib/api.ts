// ── IPC API Wrapper ──
// Provides typed access to window.agentflow exposed by the preload script.
// Components import from here, never from electron directly.

import type {
  Project,
  Task,
  SavedPrompt,
  Run,
  Memory,
  ProviderSetting,
  AppSettings,
  SkillMeta,
  SafetyCheckResult,
  GitCommitEntry,
  ReleaseStatus,
  MemoryInjectionMode,
  McpGatewayDecision,
  McpGatewayRequest,
} from '../../shared/types';
import type { AuditEvent, AuditExportManifest, AuditIntegrityReport, AuditQuery } from '../../shared/auditTypes';
import type {
  AuthSessionState,
  ChangePasswordRequest,
  CreateUserRequest,
  LoginRequest,
  LoginResult,
  PublicUser,
  ResourceAcl,
  ResetPasswordRequest,
  ResetPasswordResult,
  SessionUser,
  UpdateUserRequest,
} from '../../shared/authTypes';

// ── Preload API interface ──

interface AgentFlowPreloadAPI {
  auth?: {
    bootstrap(): Promise<{ ok: boolean } | { error: string }>;
    login(request: LoginRequest): Promise<LoginResult | { error: string }>;
    logout(): Promise<boolean | { error: string }>;
    session(sessionId?: string): Promise<AuthSessionState | { error: string }>;
    changePassword(request: ChangePasswordRequest): Promise<SessionUser | { error: string }>;
  };
  users?: {
    list(): Promise<PublicUser[] | { error: string }>;
    directory?(): Promise<PublicUser[] | { error: string }>;
    create(request: CreateUserRequest): Promise<PublicUser | { error: string }>;
    update(request: UpdateUserRequest): Promise<PublicUser | { error: string }>;
    resetPassword(request: ResetPasswordRequest): Promise<ResetPasswordResult | { error: string }>;
  };
  audit?: {
    list(query?: AuditQuery): Promise<AuditEvent[] | { error: string }>;
    exportAll(): Promise<{ auditLogs: AuditEvent[]; integrity?: AuditIntegrityReport; manifest?: AuditExportManifest; exportedAt: string } | { error: string }>;
  };
  storage?: {
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: unknown): Promise<void>;
    delete(key: string): Promise<void>;
    getAll(): Promise<Record<string, unknown>>;
  };
  projects?: {
    list(): Promise<Project[]>;
    get(id: string): Promise<Project | null>;
    create(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> | Project): Promise<Project>;
    update(id: string, updates: Partial<Project>): Promise<Project | null>;
    delete(id: string): Promise<boolean>;
    getAcl?(id: string): Promise<{ projectId: string; acl: ResourceAcl; ownerUserId: string } | { error: string }>;
    updateAcl?(id: string, acl: ResourceAcl): Promise<Project | { error: string }>;
  };
  tasks?: {
    list(projectId?: string): Promise<Task[]>;
    create(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> | Task): Promise<Task>;
    update(id: string, updates: Partial<Task>): Promise<Task | null>;
    delete(id: string): Promise<boolean>;
  };
  prompts?: {
    list(projectId?: string): Promise<SavedPrompt[]>;
    create(prompt: Omit<SavedPrompt, 'id' | 'createdAt' | 'updatedAt'> | SavedPrompt): Promise<SavedPrompt>;
    update(id: string, updates: Partial<SavedPrompt>): Promise<SavedPrompt | null>;
    delete(id: string): Promise<boolean>;
  };
  runs?: {
    list(projectId: string): Promise<Run[]>;
    create(run: Omit<Run, 'id'>): Promise<Run>;
    events(projectId?: string): Promise<unknown[]>;
  };
  mcp?: {
    allowlist(): Promise<unknown[]>;
    check(request: { serverName: string; toolName: string }): Promise<{ allowed: boolean } | { error: string }>;
    upsert(entry: unknown): Promise<unknown>;
    evaluate?(request: McpGatewayRequest): Promise<McpGatewayDecision | { error: string }>;
  };
  git?: {
    log(repoPath: string): Promise<GitCommitEntry[]>;
    status(repoPath: string): Promise<string>;
    summary(repoPath: string): Promise<{
      branch: string;
      commitCount: number;
      recentCommits: GitCommitEntry[];
    }>;
  };
  release?: {
    status(repoPath?: string): Promise<ReleaseStatus>;
  };
  memory?: {
    list(filters?: Record<string, unknown>): Promise<Memory[]>;
    get(id: string): Promise<Memory | null>;
    create(memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt' | 'lastUsedAt'> | Memory): Promise<Memory>;
    update(id: string, updates: Partial<Memory>): Promise<Memory | null>;
    delete(id: string): Promise<boolean>;
    exportAll(): Promise<unknown>;
    importMemories(data: unknown): Promise<unknown>;
    generateContext(options: { projectId?: string; injectionMode?: MemoryInjectionMode }): Promise<string>;
  };
  checkCommandSafety(command: string): Promise<SafetyCheckResult>;
  settings?: {
    get(key?: string): Promise<unknown>;
    set(key: string, value: unknown): Promise<void>;
    getAll(): Promise<AppSettings>;
  };
  providers?: {
    list(): Promise<ProviderSetting[]>;
    create(provider: Omit<ProviderSetting, 'id' | 'createdAt' | 'updatedAt'> | ProviderSetting): Promise<ProviderSetting>;
    update(id: string, updates: Partial<ProviderSetting>): Promise<ProviderSetting | null>;
    delete(id: string): Promise<boolean>;
  };
  export?: {
    markdown(content: string, filename: string): Promise<string>;
    json(data: unknown, filename: string): Promise<string>;
  };
  skills?: {
    list(): Promise<SkillMeta[]>;
    read(path: string): Promise<string>;
  };
  app?: {
    info(): Promise<{
      version: string;
      electronVersion: string;
      nodeVersion: string;
      chromeVersion: string;
    }>;
    getDataPath(): Promise<string>;
  };
  dialog?: {
    open(options: unknown): Promise<{ canceled: boolean; filePaths: string[] }>;
  };

  // Storage
  storageGet<T>(key: string): Promise<T | null>;
  storageSet(key: string, value: unknown): Promise<void>;
  storageDelete(key: string): Promise<void>;
  storageGetAll(): Promise<Record<string, unknown>>;

  // Projects
  listProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | null>;
  createProject(
    project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Project>;
  updateProject(
    id: string,
    updates: Partial<Project>,
  ): Promise<Project | null>;
  deleteProject(id: string): Promise<boolean>;

  // Tasks
  listTasks(projectId?: string): Promise<Task[]>;
  createTask(
    task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task | null>;
  deleteTask(id: string): Promise<boolean>;

  // Prompts
  listPrompts(projectId?: string): Promise<SavedPrompt[]>;
  createPrompt(
    prompt: Omit<SavedPrompt, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<SavedPrompt>;
  updatePrompt(
    id: string,
    updates: Partial<SavedPrompt>,
  ): Promise<SavedPrompt | null>;
  deletePrompt(id: string): Promise<boolean>;

  // Runs
  listRuns(projectId: string): Promise<Run[]>;
  createRun(run: Omit<Run, 'id'>): Promise<Run>;

  // Git
  getGitLog(repoPath: string): Promise<GitCommitEntry[]>;
  getGitStatus(repoPath: string): Promise<string>;
  getGitSummary(
    repoPath: string,
  ): Promise<{
    branch: string;
    commitCount: number;
    recentCommits: GitCommitEntry[];
  }>;
  getReleaseStatus?(repoPath?: string): Promise<ReleaseStatus>;

  // Memory
  listMemories(projectId?: string): Promise<Memory[]>;
  getMemory(id: string): Promise<Memory | null>;
  createMemory(
    memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt' | 'lastUsedAt'>,
  ): Promise<Memory>;
  updateMemory(
    id: string,
    updates: Partial<Memory>,
  ): Promise<Memory | null>;
  deleteMemory(id: string): Promise<boolean>;
  exportMemories(projectId?: string): Promise<string>;
  importMemories(json: string): Promise<number>;
  generateMemoryContext(
    projectId: string,
    mode: MemoryInjectionMode,
  ): Promise<string>;

  // Safety
  checkCommandSafety(command: string): Promise<SafetyCheckResult>;

  // Settings
  getSetting(key: string): Promise<unknown>;
  setSetting(key: string, value: unknown): Promise<void>;
  getAllSettings(): Promise<AppSettings>;
  listProviders(): Promise<ProviderSetting[]>;
  createProvider(
    provider: Omit<ProviderSetting, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ProviderSetting>;
  updateProvider(
    id: string,
    updates: Partial<ProviderSetting>,
  ): Promise<ProviderSetting | null>;
  deleteProvider(id: string): Promise<boolean>;

  // Export
  exportMarkdown(content: string, filename: string): Promise<string>;
  exportJSON(data: unknown, filename: string): Promise<string>;

  // Skills
  listSkills(): Promise<SkillMeta[]>;
  readSkill(name: string): Promise<string>;

  // App
  getAppInfo(): Promise<{
    version: string;
    electronVersion: string;
    nodeVersion: string;
    chromeVersion: string;
  }>;
  getDataPath(): Promise<string>;

  // Dialog
  openDirectoryDialog(): Promise<string | null>;
  openFileDialog(filters?: {
    name: string;
    extensions: string[];
  }[]): Promise<string | null>;
}

// ── Declaration merging for window.agentflow ──

declare global {
  interface Window {
    agentflow?: AgentFlowPreloadAPI;
  }
}

// ── Fallback helpers ──

/**
 * Wraps a preload call with a fallback for environments where
 * window.agentflow is not defined (unit tests, SSR, etc.).
 */
function apiCall<T>(
  methodName: string,
  fn: (agentflow: AgentFlowPreloadAPI) => Promise<T>,
  fallback: T,
): Promise<T> {
  const bridge = window.agentflow;
  if (!bridge) {
    console.warn(
      `[AgentFlow Studio] window.agentflow is not available. ` +
        `"${methodName}" returning fallback value.`,
    );
    return Promise.resolve(fallback);
  }
  return fn(bridge);
}

/**
 * Same as apiCall but for void returns.
 */
function apiCallVoid(
  methodName: string,
  fn: (agentflow: AgentFlowPreloadAPI) => Promise<void>,
): Promise<void> {
  const bridge = window.agentflow;
  if (!bridge) {
    console.warn(
      `[AgentFlow Studio] window.agentflow is not available. ` +
        `"${methodName}" is a no-op.`,
    );
    return Promise.resolve();
  }
  return fn(bridge);
}

// ── Typed API object ──

export const api = {
  auth: {
    bootstrap: () =>
      apiCall<{ ok: boolean } | { error: string }>(
        'auth.bootstrap',
        (a) => a.auth?.bootstrap() ?? Promise.resolve({ error: 'Auth bridge unavailable.' }),
        { ok: true },
      ),
    login: (request: LoginRequest) =>
      apiCall<LoginResult | { error: string }>(
        'auth.login',
        (a) => a.auth?.login(request) ?? Promise.resolve({ ok: false, error: 'Auth bridge unavailable.' }),
        { ok: false, error: 'Auth bridge unavailable.' },
      ),
    logout: () =>
      apiCall<boolean | { error: string }>(
        'auth.logout',
        (a) => a.auth?.logout() ?? Promise.resolve(false),
        false,
      ),
    session: (sessionId?: string) =>
      apiCall<AuthSessionState | { error: string }>(
        'auth.session',
        (a) => a.auth?.session(sessionId) ?? Promise.resolve({ authenticated: false }),
        { authenticated: false },
      ),
    changePassword: (request: ChangePasswordRequest) =>
      apiCall<SessionUser | { error: string }>(
        'auth.changePassword',
        (a) => a.auth?.changePassword(request) ?? Promise.resolve({ error: 'Auth bridge unavailable.' }),
        { error: 'Auth bridge unavailable.' },
      ),
  },

  users: {
    list: () =>
      apiCall<PublicUser[] | { error: string }>(
        'users.list',
        (a) => a.users?.list() ?? Promise.resolve([]),
        [],
      ),
    directory: () =>
      apiCall<PublicUser[] | { error: string }>(
        'users.directory',
        (a) => a.users?.directory?.() ?? a.users?.list() ?? Promise.resolve([]),
        [],
      ),
    create: (request: CreateUserRequest) =>
      apiCall<PublicUser | { error: string }>(
        'users.create',
        (a) => a.users?.create(request) ?? Promise.resolve({ error: 'User bridge unavailable.' }),
        { error: 'User bridge unavailable.' },
      ),
    update: (request: UpdateUserRequest) =>
      apiCall<PublicUser | { error: string }>(
        'users.update',
        (a) => a.users?.update(request) ?? Promise.resolve({ error: 'User bridge unavailable.' }),
        { error: 'User bridge unavailable.' },
      ),
    resetPassword: (request: ResetPasswordRequest) =>
      apiCall<ResetPasswordResult | { error: string }>(
        'users.resetPassword',
        (a) => a.users?.resetPassword(request) ?? Promise.resolve({ error: 'User bridge unavailable.' }),
        { error: 'User bridge unavailable.' },
      ),
  },

  audit: {
    list: (query?: AuditQuery) =>
      apiCall<AuditEvent[] | { error: string }>(
        'audit.list',
        (a) => a.audit?.list(query) ?? Promise.resolve([]),
        [],
      ),
    exportAll: () =>
      apiCall<{ auditLogs: AuditEvent[]; integrity?: AuditIntegrityReport; manifest?: AuditExportManifest; exportedAt: string } | { error: string }>(
        'audit.exportAll',
        (a) => a.audit?.exportAll() ?? Promise.resolve({ auditLogs: [], exportedAt: new Date().toISOString() }),
        { auditLogs: [], exportedAt: new Date().toISOString() },
      ),
  },

  // ── Storage ──

  storage: {
    get: <T>(key: string) =>
      apiCall<T | null>(
        'storageGet',
        (a) => a.storage?.get<T>(key) ?? a.storageGet<T>(key),
        null,
      ),
    set: (key: string, value: unknown) =>
      apiCallVoid('storageSet', (a) => a.storage?.set(key, value) ?? a.storageSet(key, value)),
    delete: (key: string) =>
      apiCallVoid('storageDelete', (a) => a.storage?.delete(key) ?? a.storageDelete(key)),
    getAll: () =>
      apiCall<Record<string, unknown>>(
        'storageGetAll',
        (a) => a.storage?.getAll() ?? a.storageGetAll(),
        {},
      ),
  },

  // ── Projects ──

  projects: {
    list: () =>
      apiCall<Project[]>('listProjects', (a) => a.projects?.list() ?? a.listProjects(), []),
    get: (id: string) =>
      apiCall<Project | null>('getProject', (a) => a.projects?.get(id) ?? a.getProject(id), null),
    create: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) =>
      apiCall<Project>('createProject', (a) => a.projects?.create(project) ?? a.createProject(project), {
        ...project,
        id: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Project),
    update: (idOrProject: string | Project, updates?: Partial<Project>) =>
      apiCall<Project | null>(
        'updateProject',
        (a) => {
          const id = typeof idOrProject === 'string' ? idOrProject : idOrProject.id;
          const payload = updates ?? (typeof idOrProject === 'string' ? {} : idOrProject);
          return a.projects?.update(id, payload) ?? a.updateProject(id, payload);
        },
        null,
      ),
    delete: (id: string) =>
      apiCall<boolean>('deleteProject', (a) => a.projects?.delete(id) ?? a.deleteProject(id), false),
    getAcl: (id: string) =>
      apiCall<{ projectId: string; acl: ResourceAcl; ownerUserId: string } | { error: string }>(
        'projects.getAcl',
        (a) => a.projects?.getAcl?.(id) ?? Promise.resolve({ error: 'Project ACL bridge unavailable.' }),
        { error: 'Project ACL bridge unavailable.' },
      ),
    updateAcl: (id: string, acl: ResourceAcl) =>
      apiCall<Project | { error: string }>(
        'projects.updateAcl',
        (a) => a.projects?.updateAcl?.(id, acl) ?? Promise.resolve({ error: 'Project ACL bridge unavailable.' }),
        { error: 'Project ACL bridge unavailable.' },
      ),
  },

  // ── Tasks ──

  tasks: {
    list: (projectId?: string) =>
      apiCall<Task[]>('listTasks', (a) => a.tasks?.list(projectId) ?? a.listTasks(projectId), []),
    listByProject: (projectId: string) =>
      apiCall<Task[]>('listTasks', (a) => a.tasks?.list(projectId) ?? a.listTasks(projectId), []),
    create: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) =>
      apiCall<Task>('createTask', (a) => a.tasks?.create(task) ?? a.createTask(task), {
        ...task,
        id: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Task),
    update: (idOrTask: string | Task, updates?: Partial<Task>) =>
      apiCall<Task | null>(
        'updateTask',
        (a) => {
          const id = typeof idOrTask === 'string' ? idOrTask : idOrTask.id;
          const payload = updates ?? (typeof idOrTask === 'string' ? {} : idOrTask);
          return a.tasks?.update(id, payload) ?? a.updateTask(id, payload);
        },
        null,
      ),
    delete: (id: string) =>
      apiCall<boolean>('deleteTask', (a) => a.tasks?.delete(id) ?? a.deleteTask(id), false),
  },

  // ── Prompts ──

  prompts: {
    list: (projectId?: string) =>
      apiCall<SavedPrompt[]>(
        'listPrompts',
        (a) => a.prompts?.list(projectId) ?? a.listPrompts(projectId),
        [],
      ),
    create: (prompt: Omit<SavedPrompt, 'id' | 'createdAt' | 'updatedAt'>) =>
      apiCall<SavedPrompt>('createPrompt', (a) => a.prompts?.create(prompt) ?? a.createPrompt(prompt), {
        ...prompt,
        id: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as SavedPrompt),
    update: (idOrPrompt: string | SavedPrompt, updates?: Partial<SavedPrompt>) =>
      apiCall<SavedPrompt | null>(
        'updatePrompt',
        (a) => {
          const id = typeof idOrPrompt === 'string' ? idOrPrompt : idOrPrompt.id;
          const payload = updates ?? (typeof idOrPrompt === 'string' ? {} : idOrPrompt);
          return a.prompts?.update(id, payload) ?? a.updatePrompt(id, payload);
        },
        null,
      ),
    delete: (id: string) =>
      apiCall<boolean>('deletePrompt', (a) => a.prompts?.delete(id) ?? a.deletePrompt(id), false),
  },

  // ── Runs ──

  runs: {
    list: (projectId: string) =>
      apiCall<Run[]>('listRuns', (a) => a.runs?.list(projectId) ?? a.listRuns(projectId), []),
    create: (run: Omit<Run, 'id'>) =>
      apiCall<Run>('createRun', (a) => a.runs?.create(run) ?? a.createRun(run), {
        ...run,
        id: '',
      } as Run),
    events: (projectId?: string) =>
      apiCall<unknown[]>('listRunEvents', (a) => a.runs?.events?.(projectId) ?? Promise.resolve([]), []),
  },

  mcp: {
    allowlist: () => apiCall<unknown[]>('mcp.allowlist', (a) => a.mcp?.allowlist() ?? Promise.resolve([]), []),
    check: (request: { serverName: string; toolName: string }) =>
      apiCall<{ allowed: boolean } | { error: string }>('mcp.check', (a) => a.mcp?.check(request) ?? Promise.resolve({ allowed: false }), { allowed: false }),
    upsert: (entry: unknown) =>
      apiCall<unknown>('mcp.upsert', (a) => a.mcp?.upsert(entry) ?? Promise.resolve({ error: 'MCP bridge unavailable.' }), { error: 'MCP bridge unavailable.' }),
    evaluate: (request: McpGatewayRequest) =>
      apiCall<McpGatewayDecision | { error: string }>(
        'mcp.evaluate',
        (a) => a.mcp?.evaluate?.(request) ?? Promise.resolve({ error: 'MCP gateway bridge unavailable.' }),
        { error: 'MCP gateway bridge unavailable.' },
      ),
  },

  // ── Git ──

  git: {
    log: (repoPath: string) =>
      apiCall<GitCommitEntry[]>(
        'getGitLog',
        (a) => a.git?.log(repoPath) ?? a.getGitLog(repoPath),
        [],
      ),
    readLog: async (repoPath: string, _options?: { maxCount?: number }) => {
      const commits = await api.git.log(repoPath);
      const summary = await api.git.summary(repoPath);
      return {
        commits,
        branch: summary.branch,
        totalCommits: summary.commitCount,
        recentActivity: `${commits.length} commits loaded`,
        error: undefined as string | undefined,
      };
    },
    status: (repoPath: string) =>
      apiCall<string>(
        'getGitStatus',
        (a) => a.git?.status(repoPath) ?? a.getGitStatus(repoPath),
        '无法获取 Git 状态。',
      ),
    summary: (repoPath: string) =>
      apiCall<{
        branch: string;
        commitCount: number;
        recentCommits: GitCommitEntry[];
      }>('getGitSummary', (a) => a.git?.summary(repoPath) ?? a.getGitSummary(repoPath), {
        branch: '',
        commitCount: 0,
        recentCommits: [],
      }),
  },

  release: {
    status: (repoPath?: string) =>
      apiCall<ReleaseStatus>(
        'getReleaseStatus',
        (a) =>
          a.release?.status(repoPath) ??
          a.getReleaseStatus?.(repoPath) ??
          Promise.resolve({
            version: 'unknown',
            branch: 'unknown',
            gitStatus: 'Release status bridge is unavailable.',
            recentCommits: [],
            updateSummary: [],
            testResults: [],
            progressSummary: [],
            checkedAt: new Date().toISOString(),
          }),
        {
          version: 'unknown',
          branch: 'unknown',
          gitStatus: 'Unable to read release status.',
          recentCommits: [],
          updateSummary: [],
          testResults: [],
          progressSummary: [],
          checkedAt: new Date().toISOString(),
        },
      ),
  },

  // ── Memory ──

  memory: {
    list: (projectId?: string) =>
      apiCall<Memory[]>(
        'listMemories',
        (a) =>
          a.memory?.list(projectId ? { projectId } : undefined) ??
          a.listMemories(projectId),
        [],
      ),
    listByProject: (projectId: string) =>
      apiCall<Memory[]>(
        'listMemories',
        (a) => a.memory?.list({ projectId }) ?? a.listMemories(projectId),
        [],
      ),
    get: (id: string) =>
      apiCall<Memory | null>('getMemory', (a) => a.memory?.get(id) ?? a.getMemory(id), null),
    create: (
      memory: Omit<
        Memory,
        'id' | 'createdAt' | 'updatedAt' | 'lastUsedAt'
      >,
    ) =>
      apiCall<Memory>('createMemory', (a) => a.memory?.create(memory) ?? a.createMemory(memory), {
        ...memory,
        id: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
      } as Memory),
    update: (idOrMemory: string | Memory, updates?: Partial<Memory>) =>
      apiCall<Memory | null>(
        'updateMemory',
        (a) => {
          const id = typeof idOrMemory === 'string' ? idOrMemory : idOrMemory.id;
          const payload = updates ?? (typeof idOrMemory === 'string' ? {} : idOrMemory);
          return a.memory?.update(id, payload) ?? a.updateMemory(id, payload);
        },
        null,
      ),
    delete: (id: string) =>
      apiCall<boolean>('deleteMemory', (a) => a.memory?.delete(id) ?? a.deleteMemory(id), false),
    export: (projectId?: string) =>
      apiCall<string>(
        'exportMemories',
        async (a) => {
          const result = a.memory?.exportAll
            ? await a.memory.exportAll()
            : await a.exportMemories(projectId);
          return typeof result === 'string' ? result : JSON.stringify(result);
        },
        '',
      ),
    import: (json: string) =>
      apiCall<number>(
        'importMemories',
        async (a) => {
          const parsed = JSON.parse(json);
          const result = a.memory?.importMemories
            ? await a.memory.importMemories(parsed)
            : await a.importMemories(json);
          if (typeof result === 'number') return result;
          if (result && typeof result === 'object' && 'imported' in result) {
            return Number((result as { imported: unknown }).imported) || 0;
          }
          return 0;
        },
        0,
      ),
    generateContext: (projectId: string, mode: MemoryInjectionMode) =>
      apiCall<string>(
        'generateMemoryContext',
        (a) =>
          a.memory?.generateContext({ projectId, injectionMode: mode }) ??
          a.generateMemoryContext(projectId, mode),
        '',
      ),
  },

  // ── Safety ──

  safety: {
    check: (command: string) =>
      apiCall<SafetyCheckResult>(
        'checkCommandSafety',
        (a) => a.checkCommandSafety ? a.checkCommandSafety(command) : Promise.resolve({
          id: '',
          command,
          riskLevel: 'Safe',
          matchedRules: [],
          explanation: '',
          saferAlternative: '',
          suggestBackup: false,
          suggestIsolation: false,
          checkedAt: new Date().toISOString(),
        }),
        {
          id: '',
          command,
          riskLevel: 'Safe',
          matchedRules: [],
          explanation: '',
          saferAlternative: '',
          suggestBackup: false,
          suggestIsolation: false,
          checkedAt: new Date().toISOString(),
        },
      ),
  },

  // ── Settings ──

  settings: {
    get: (key?: string) =>
      key
        ? apiCall<unknown>(
            'getSetting',
            (a) => a.settings?.get(key) ?? a.getSetting(key),
            null,
          )
        : api.settings.getAll(),
    set: (key: string, value: unknown) =>
      apiCallVoid('setSetting', (a) => a.settings?.set(key, value) ?? a.setSetting(key, value)),
    update: async (settings: AppSettings) => {
      await Promise.all(
        Object.entries(settings).map(([key, value]) => api.settings.set(key, value)),
      );
    },
    reset: async () => {
      await api.settings.update({
        theme: 'system',
        defaultProjectPath: '',
        defaultAITool: 'Claude Code',
        dataPath: '',
        version: '1.0.0',
      });
    },
    getAll: () =>
      apiCall<AppSettings>('getAllSettings', (a) => a.settings?.getAll() ?? a.getAllSettings(), {
        theme: 'system',
        defaultProjectPath: '',
        defaultAITool: 'Claude Code',
        dataPath: '',
        version: '1.0.0',
        appVersion: '1.0.0',
      } as AppSettings),
    providers: {
      list: () =>
        apiCall<ProviderSetting[]>(
          'listProviders',
          (a) => a.providers?.list() ?? a.listProviders(),
          [],
        ),
      create: (
        provider: Omit<
          ProviderSetting,
          'id' | 'createdAt' | 'updatedAt'
        >,
      ) =>
        apiCall<ProviderSetting>(
          'createProvider',
          (a) => a.providers?.create(provider) ?? a.createProvider(provider),
          {
            ...provider,
            id: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as ProviderSetting,
        ),
      update: (idOrProvider: string | ProviderSetting, updates?: Partial<ProviderSetting>) =>
        apiCall<ProviderSetting | null>(
          'updateProvider',
          (a) => {
            const id = typeof idOrProvider === 'string' ? idOrProvider : idOrProvider.id;
            const payload =
              updates ?? (typeof idOrProvider === 'string' ? {} : idOrProvider);
            return a.providers?.update(id, payload) ?? a.updateProvider(id, payload);
          },
          null,
        ),
      delete: (id: string) =>
        apiCall<boolean>(
          'deleteProvider',
          (a) => a.providers?.delete(id) ?? a.deleteProvider(id),
          false,
        ),
    },
  },

  // ── Export ──

  providers: {
    list: () => api.settings.providers.list(),
    create: (
      provider: Omit<ProviderSetting, 'id' | 'createdAt' | 'updatedAt'> | ProviderSetting,
    ) =>
      api.settings.providers.create(
        provider as Omit<ProviderSetting, 'id' | 'createdAt' | 'updatedAt'>,
      ),
    update: (idOrProvider: string | ProviderSetting, updates?: Partial<ProviderSetting>) =>
      api.settings.providers.update(idOrProvider as ProviderSetting, updates),
    delete: (id: string) => api.settings.providers.delete(id),
  },

  export: {
    markdown: (content: string, filename: string) =>
      apiCall<string>(
        'exportMarkdown',
        (a) => a.export?.markdown(content, filename) ?? a.exportMarkdown(content, filename),
        '',
      ),
    exportMarkdown: (content: string, filename: string) =>
      api.export.markdown(content, filename),
    json: (data: unknown, filename: string) =>
      apiCall<string>(
        'exportJSON',
        (a) => a.export?.json(data, filename) ?? a.exportJSON(data, filename),
        '',
      ),
    exportJSON: (data: unknown, filename: string) =>
      api.export.json(data, filename),
    exportAll: async () => {
      const data = await api.storage.getAll();
      return api.export.json(data, `agentflow-export-${Date.now()}.json`);
    },
  },

  // ── Skills ──

  skills: {
    list: () =>
      apiCall<SkillMeta[]>(
        'listSkills',
        async (a) => {
          const skills = a.skills?.list ? await a.skills.list() : await a.listSkills();
          return skills.map((skill) => ({
            ...skill,
            filePath: skill.filePath ?? skill.path,
            lastModified: skill.lastModified ?? new Date().toISOString(),
          }));
        },
        [],
      ),
    read: (name: string) =>
      apiCall<string>('readSkill', (a) => a.skills?.read(name) ?? a.readSkill(name), ''),
  },

  // ── App ──

  app: {
    info: () =>
      apiCall<{
        version: string;
        electronVersion: string;
        nodeVersion: string;
        chromeVersion: string;
      }>('getAppInfo', (a) => a.app?.info() ?? a.getAppInfo(), {
        version: '1.0.0',
        electronVersion: '',
        nodeVersion: '',
        chromeVersion: '',
      }),
    dataPath: () =>
      apiCall<string>('getDataPath', (a) => a.app?.getDataPath() ?? a.getDataPath(), ''),
    clearDemoData: async () => undefined,
  },

  // ── Dialog ──

  dialog: {
    open: (options: unknown) =>
      apiCall<{ canceled: boolean; filePaths: string[] }>(
        'openDialog',
        (a) => a.dialog?.open(options) ?? Promise.resolve({ canceled: true, filePaths: [] }),
        { canceled: true, filePaths: [] },
      ),
    openDirectory: () =>
      apiCall<string | null>(
        'openDirectoryDialog',
        async (a) => {
          if (a.dialog?.open) {
            const result = await a.dialog.open({ properties: ['openDirectory'] });
            return result.canceled ? null : result.filePaths[0] ?? null;
          }
          return a.openDirectoryDialog();
        },
        null,
      ),
    openFile: (filters?: { name: string; extensions: string[] }[]) =>
      apiCall<string | null>(
        'openFileDialog',
        async (a) => {
          if (a.dialog?.open) {
            const result = await a.dialog.open({ properties: ['openFile'], filters });
            return result.canceled ? null : result.filePaths[0] ?? null;
          }
          return a.openFileDialog(filters);
        },
        null,
      ),
  },

  import: {
    importAll: async (_path: string) => undefined,
  },

  // ── Health check ──

  /**
   * Returns true if the preload bridge is available.
   */
  isAvailable(): boolean {
    return typeof window !== 'undefined' && window.agentflow !== undefined;
  },
};

export default api;
