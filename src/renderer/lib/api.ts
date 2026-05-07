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
  MemoryInjectionMode,
} from '../../shared/types';

// ── Preload API interface ──

interface AgentFlowPreloadAPI {
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
  listTasks(projectId: string): Promise<Task[]>;
  createTask(
    task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task | null>;
  deleteTask(id: string): Promise<boolean>;

  // Prompts
  listPrompts(projectId: string): Promise<SavedPrompt[]>;
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
  // ── Storage ──

  storage: {
    get: <T>(key: string) =>
      apiCall<T | null>('storageGet', (a) => a.storageGet<T>(key), null),
    set: (key: string, value: unknown) =>
      apiCallVoid('storageSet', (a) => a.storageSet(key, value)),
    delete: (key: string) =>
      apiCallVoid('storageDelete', (a) => a.storageDelete(key)),
    getAll: () =>
      apiCall<Record<string, unknown>>(
        'storageGetAll',
        (a) => a.storageGetAll(),
        {},
      ),
  },

  // ── Projects ──

  projects: {
    list: () =>
      apiCall<Project[]>('listProjects', (a) => a.listProjects(), []),
    get: (id: string) =>
      apiCall<Project | null>('getProject', (a) => a.getProject(id), null),
    create: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) =>
      apiCall<Project>('createProject', (a) => a.createProject(project), {
        ...project,
        id: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Project),
    update: (id: string, updates: Partial<Project>) =>
      apiCall<Project | null>(
        'updateProject',
        (a) => a.updateProject(id, updates),
        null,
      ),
    delete: (id: string) =>
      apiCall<boolean>('deleteProject', (a) => a.deleteProject(id), false),
  },

  // ── Tasks ──

  tasks: {
    list: (projectId: string) =>
      apiCall<Task[]>('listTasks', (a) => a.listTasks(projectId), []),
    create: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) =>
      apiCall<Task>('createTask', (a) => a.createTask(task), {
        ...task,
        id: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Task),
    update: (id: string, updates: Partial<Task>) =>
      apiCall<Task | null>(
        'updateTask',
        (a) => a.updateTask(id, updates),
        null,
      ),
    delete: (id: string) =>
      apiCall<boolean>('deleteTask', (a) => a.deleteTask(id), false),
  },

  // ── Prompts ──

  prompts: {
    list: (projectId: string) =>
      apiCall<SavedPrompt[]>(
        'listPrompts',
        (a) => a.listPrompts(projectId),
        [],
      ),
    create: (prompt: Omit<SavedPrompt, 'id' | 'createdAt' | 'updatedAt'>) =>
      apiCall<SavedPrompt>('createPrompt', (a) => a.createPrompt(prompt), {
        ...prompt,
        id: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as SavedPrompt),
    update: (id: string, updates: Partial<SavedPrompt>) =>
      apiCall<SavedPrompt | null>(
        'updatePrompt',
        (a) => a.updatePrompt(id, updates),
        null,
      ),
    delete: (id: string) =>
      apiCall<boolean>('deletePrompt', (a) => a.deletePrompt(id), false),
  },

  // ── Runs ──

  runs: {
    list: (projectId: string) =>
      apiCall<Run[]>('listRuns', (a) => a.listRuns(projectId), []),
    create: (run: Omit<Run, 'id'>) =>
      apiCall<Run>('createRun', (a) => a.createRun(run), {
        ...run,
        id: '',
      } as Run),
  },

  // ── Git ──

  git: {
    log: (repoPath: string) =>
      apiCall<GitCommitEntry[]>(
        'getGitLog',
        (a) => a.getGitLog(repoPath),
        [],
      ),
    status: (repoPath: string) =>
      apiCall<string>(
        'getGitStatus',
        (a) => a.getGitStatus(repoPath),
        '无法获取 Git 状态。',
      ),
    summary: (repoPath: string) =>
      apiCall<{
        branch: string;
        commitCount: number;
        recentCommits: GitCommitEntry[];
      }>('getGitSummary', (a) => a.getGitSummary(repoPath), {
        branch: '',
        commitCount: 0,
        recentCommits: [],
      }),
  },

  // ── Memory ──

  memory: {
    list: (projectId?: string) =>
      apiCall<Memory[]>(
        'listMemories',
        (a) => a.listMemories(projectId),
        [],
      ),
    get: (id: string) =>
      apiCall<Memory | null>('getMemory', (a) => a.getMemory(id), null),
    create: (
      memory: Omit<
        Memory,
        'id' | 'createdAt' | 'updatedAt' | 'lastUsedAt'
      >,
    ) =>
      apiCall<Memory>('createMemory', (a) => a.createMemory(memory), {
        ...memory,
        id: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
      } as Memory),
    update: (id: string, updates: Partial<Memory>) =>
      apiCall<Memory | null>(
        'updateMemory',
        (a) => a.updateMemory(id, updates),
        null,
      ),
    delete: (id: string) =>
      apiCall<boolean>('deleteMemory', (a) => a.deleteMemory(id), false),
    export: (projectId?: string) =>
      apiCall<string>(
        'exportMemories',
        (a) => a.exportMemories(projectId),
        '',
      ),
    import: (json: string) =>
      apiCall<number>(
        'importMemories',
        (a) => a.importMemories(json),
        0,
      ),
    generateContext: (projectId: string, mode: MemoryInjectionMode) =>
      apiCall<string>(
        'generateMemoryContext',
        (a) => a.generateMemoryContext(projectId, mode),
        '',
      ),
  },

  // ── Safety ──

  safety: {
    check: (command: string) =>
      apiCall<SafetyCheckResult>(
        'checkCommandSafety',
        (a) => a.checkCommandSafety(command),
        {
          riskLevel: 'Safe',
          matchedRules: [],
          explanation: '',
          saferAlternative: '',
          suggestBackup: false,
          suggestIsolation: false,
        },
      ),
  },

  // ── Settings ──

  settings: {
    get: (key: string) =>
      apiCall<unknown>('getSetting', (a) => a.getSetting(key), null),
    set: (key: string, value: unknown) =>
      apiCallVoid('setSetting', (a) => a.setSetting(key, value)),
    getAll: () =>
      apiCall<AppSettings>('getAllSettings', (a) => a.getAllSettings(), {
        theme: 'system',
        defaultProjectPath: '',
        defaultAITool: 'Claude Code',
        dataPath: '',
        version: '1.0.0',
      } as AppSettings),
    providers: {
      list: () =>
        apiCall<ProviderSetting[]>(
          'listProviders',
          (a) => a.listProviders(),
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
          (a) => a.createProvider(provider),
          {
            ...provider,
            id: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as ProviderSetting,
        ),
      update: (id: string, updates: Partial<ProviderSetting>) =>
        apiCall<ProviderSetting | null>(
          'updateProvider',
          (a) => a.updateProvider(id, updates),
          null,
        ),
      delete: (id: string) =>
        apiCall<boolean>(
          'deleteProvider',
          (a) => a.deleteProvider(id),
          false,
        ),
    },
  },

  // ── Export ──

  export: {
    markdown: (content: string, filename: string) =>
      apiCall<string>(
        'exportMarkdown',
        (a) => a.exportMarkdown(content, filename),
        '',
      ),
    json: (data: unknown, filename: string) =>
      apiCall<string>(
        'exportJSON',
        (a) => a.exportJSON(data, filename),
        '',
      ),
  },

  // ── Skills ──

  skills: {
    list: () =>
      apiCall<SkillMeta[]>('listSkills', (a) => a.listSkills(), []),
    read: (name: string) =>
      apiCall<string>('readSkill', (a) => a.readSkill(name), ''),
  },

  // ── App ──

  app: {
    info: () =>
      apiCall<{
        version: string;
        electronVersion: string;
        nodeVersion: string;
        chromeVersion: string;
      }>('getAppInfo', (a) => a.getAppInfo(), {
        version: '1.0.0',
        electronVersion: '',
        nodeVersion: '',
        chromeVersion: '',
      }),
    dataPath: () =>
      apiCall<string>('getDataPath', (a) => a.getDataPath(), ''),
  },

  // ── Dialog ──

  dialog: {
    openDirectory: () =>
      apiCall<string | null>(
        'openDirectoryDialog',
        (a) => a.openDirectoryDialog(),
        null,
      ),
    openFile: (filters?: { name: string; extensions: string[] }[]) =>
      apiCall<string | null>(
        'openFileDialog',
        (a) => a.openFileDialog(filters),
        null,
      ),
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
