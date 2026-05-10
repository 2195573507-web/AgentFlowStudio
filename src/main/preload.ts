import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/types.js';
import type { MemoryInjectionMode } from '../shared/types.js';
import type { AuditQuery } from '../shared/auditTypes.js';
import type { ChangePasswordRequest, CreateUserRequest, LoginRequest, ResetPasswordRequest, UpdateUserRequest } from '../shared/authTypes.js';

// ---------------------------------------------------------------------------
// Type the exposed API so the renderer gets full IntelliSense.
// (Mirrors the shape we attach to the `window.agentflow` object.)
// ---------------------------------------------------------------------------

export interface AgentFlowAPI {
  auth: {
    bootstrap(): Promise<unknown>;
    login(request: LoginRequest): Promise<unknown>;
    logout(): Promise<unknown>;
    session(sessionId?: string): Promise<unknown>;
    changePassword(request: ChangePasswordRequest): Promise<unknown>;
  };
  users: {
    list(): Promise<unknown>;
    create(request: CreateUserRequest): Promise<unknown>;
    update(request: UpdateUserRequest): Promise<unknown>;
    resetPassword(request: ResetPasswordRequest): Promise<unknown>;
  };
  audit: {
    list(query?: AuditQuery): Promise<unknown>;
    exportAll(): Promise<unknown>;
  };
  projects: {
    list(): Promise<unknown>;
    get(id: string): Promise<unknown>;
    create(data: unknown): Promise<unknown>;
    update(id: string, data: unknown): Promise<unknown>;
    delete(id: string): Promise<unknown>;
  };
  tasks: {
    list(projectId: string): Promise<unknown>;
    create(data: unknown): Promise<unknown>;
    update(id: string, data: unknown): Promise<unknown>;
    delete(id: string): Promise<unknown>;
  };
  prompts: {
    list(projectId: string): Promise<unknown>;
    create(data: unknown): Promise<unknown>;
    update(id: string, data: unknown): Promise<unknown>;
    delete(id: string): Promise<unknown>;
  };
  runs: {
    list(projectId: string): Promise<unknown>;
    create(data: unknown): Promise<unknown>;
    events(projectId?: string): Promise<unknown>;
  };
  mcp: {
    allowlist(): Promise<unknown>;
    check(request: { serverName: string; toolName: string }): Promise<unknown>;
    upsert(entry: unknown): Promise<unknown>;
  };
  git: {
    log(repoPath: string): Promise<unknown>;
    status(repoPath: string): Promise<unknown>;
    summary(repoPath: string): Promise<unknown>;
  };
  release: {
    status(repoPath?: string): Promise<unknown>;
  };
  memory: {
    list(filters?: Record<string, unknown>): Promise<unknown>;
    get(id: string): Promise<unknown>;
    create(data: unknown): Promise<unknown>;
    update(id: string, data: unknown): Promise<unknown>;
    delete(id: string): Promise<unknown>;
    exportAll(): Promise<unknown>;
    importMemories(data: unknown): Promise<unknown>;
    generateContext(options: { projectId?: string; injectionMode?: MemoryInjectionMode }): Promise<unknown>;
  };
  settings: {
    get(key: string): Promise<unknown>;
    set(key: string, value: unknown): Promise<unknown>;
    getAll(): Promise<unknown>;
  };
  providers: {
    list(): Promise<unknown>;
    create(data: unknown): Promise<unknown>;
    update(id: string, data: unknown): Promise<unknown>;
    delete(id: string): Promise<unknown>;
  };
  export: {
    markdown(content: string, filename: string): Promise<unknown>;
    json(data: unknown, filename: string): Promise<unknown>;
  };
  skills: {
    list(): Promise<unknown>;
    read(skillPath: string): Promise<unknown>;
  };
  app: {
    info(): Promise<unknown>;
    getDataPath(): Promise<unknown>;
  };
  dialog: {
    open(options: unknown): Promise<unknown>;
  };
}

// ---------------------------------------------------------------------------
// Expose
// ---------------------------------------------------------------------------

function buildAuthEnvelope() {
  return { __auth: true };
}

const api: AgentFlowAPI = {
  auth: {
    bootstrap: () => ipcRenderer.invoke(IPC_CHANNELS.AUTH_BOOTSTRAP),
    login: (request: LoginRequest) => ipcRenderer.invoke(IPC_CHANNELS.AUTH_LOGIN, request),
    logout: () => ipcRenderer.invoke(IPC_CHANNELS.AUTH_LOGOUT, buildAuthEnvelope()),
    session: () => ipcRenderer.invoke(IPC_CHANNELS.AUTH_SESSION),
    changePassword: (request: ChangePasswordRequest) =>
      ipcRenderer.invoke(IPC_CHANNELS.AUTH_CHANGE_PASSWORD, buildAuthEnvelope(), request),
  },

  users: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.USER_LIST, buildAuthEnvelope()),
    create: (request: CreateUserRequest) => ipcRenderer.invoke(IPC_CHANNELS.USER_CREATE, buildAuthEnvelope(), request),
    update: (request: UpdateUserRequest) => ipcRenderer.invoke(IPC_CHANNELS.USER_UPDATE, buildAuthEnvelope(), request),
    resetPassword: (request: ResetPasswordRequest) =>
      ipcRenderer.invoke(IPC_CHANNELS.USER_RESET_PASSWORD, buildAuthEnvelope(), request),
  },

  audit: {
    list: (query?: AuditQuery) => ipcRenderer.invoke(IPC_CHANNELS.AUDIT_LIST, buildAuthEnvelope(), query),
    exportAll: () => ipcRenderer.invoke(IPC_CHANNELS.AUDIT_EXPORT, buildAuthEnvelope()),
  },

  projects: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.PROJECT_LIST, buildAuthEnvelope()),
    get: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.PROJECT_GET, buildAuthEnvelope(), id),
    create: (data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.PROJECT_CREATE, buildAuthEnvelope(), data),
    update: (id: string, data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.PROJECT_UPDATE, buildAuthEnvelope(), id, data),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.PROJECT_DELETE, buildAuthEnvelope(), id),
  },

  tasks: {
    list: (projectId: string) => ipcRenderer.invoke(IPC_CHANNELS.TASK_LIST, buildAuthEnvelope(), projectId),
    create: (data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.TASK_CREATE, buildAuthEnvelope(), data),
    update: (id: string, data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.TASK_UPDATE, buildAuthEnvelope(), id, data),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.TASK_DELETE, buildAuthEnvelope(), id),
  },

  prompts: {
    list: (projectId: string) => ipcRenderer.invoke(IPC_CHANNELS.PROMPT_LIST, buildAuthEnvelope(), projectId),
    create: (data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.PROMPT_CREATE, buildAuthEnvelope(), data),
    update: (id: string, data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.PROMPT_UPDATE, buildAuthEnvelope(), id, data),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.PROMPT_DELETE, buildAuthEnvelope(), id),
  },

  runs: {
    list: (projectId: string) => ipcRenderer.invoke(IPC_CHANNELS.RUN_LIST, buildAuthEnvelope(), projectId),
    create: (data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.RUN_CREATE, buildAuthEnvelope(), data),
    events: (projectId?: string) => ipcRenderer.invoke(IPC_CHANNELS.RUN_EVENTS_LIST, buildAuthEnvelope(), projectId),
  },

  mcp: {
    allowlist: () => ipcRenderer.invoke(IPC_CHANNELS.MCP_ALLOWLIST_LIST, buildAuthEnvelope()),
    check: (request: { serverName: string; toolName: string }) =>
      ipcRenderer.invoke(IPC_CHANNELS.MCP_ALLOWLIST_CHECK, buildAuthEnvelope(), request),
    upsert: (entry: unknown) => ipcRenderer.invoke(IPC_CHANNELS.MCP_ALLOWLIST_UPSERT, buildAuthEnvelope(), entry),
  },

  git: {
    log: (repoPath: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_LOG, buildAuthEnvelope(), repoPath),
    status: (repoPath: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_STATUS, buildAuthEnvelope(), repoPath),
    summary: (repoPath: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_SUMMARY, buildAuthEnvelope(), repoPath),
  },

  release: {
    status: (repoPath?: string) => ipcRenderer.invoke(IPC_CHANNELS.RELEASE_STATUS, buildAuthEnvelope(), repoPath),
  },

  memory: {
    list: (filters?: Record<string, unknown>) =>
      ipcRenderer.invoke(IPC_CHANNELS.MEMORY_LIST, buildAuthEnvelope(), filters),
    get: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.MEMORY_GET, buildAuthEnvelope(), id),
    create: (data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.MEMORY_CREATE, buildAuthEnvelope(), data),
    update: (id: string, data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.MEMORY_UPDATE, buildAuthEnvelope(), id, data),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.MEMORY_DELETE, buildAuthEnvelope(), id),
    exportAll: () => ipcRenderer.invoke(IPC_CHANNELS.MEMORY_EXPORT, buildAuthEnvelope()),
    importMemories: (data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.MEMORY_IMPORT, buildAuthEnvelope(), data),
    generateContext: (options: { projectId?: string; injectionMode?: MemoryInjectionMode }) =>
      ipcRenderer.invoke(IPC_CHANNELS.MEMORY_GENERATE_CONTEXT, buildAuthEnvelope(), options),
  },

  settings: {
    get: (key: string) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET, buildAuthEnvelope(), key),
    set: (key: string, value: unknown) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, buildAuthEnvelope(), key, value),
    getAll: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET_ALL, buildAuthEnvelope()),
  },

  providers: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.PROVIDER_LIST, buildAuthEnvelope()),
    create: (data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.PROVIDER_CREATE, buildAuthEnvelope(), data),
    update: (id: string, data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.PROVIDER_UPDATE, buildAuthEnvelope(), id, data),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.PROVIDER_DELETE, buildAuthEnvelope(), id),
  },

  export: {
    markdown: (content: string, filename: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.EXPORT_MARKDOWN, buildAuthEnvelope(), content, filename),
    json: (data: unknown, filename: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.EXPORT_JSON, buildAuthEnvelope(), data, filename),
  },

  skills: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.SKILLS_LIST, buildAuthEnvelope()),
    read: (skillPath: string) => ipcRenderer.invoke(IPC_CHANNELS.SKILL_READ, buildAuthEnvelope(), skillPath),
  },

  app: {
    info: () => ipcRenderer.invoke(IPC_CHANNELS.APP_INFO),
    getDataPath: () => ipcRenderer.invoke(IPC_CHANNELS.GET_DATA_PATH, buildAuthEnvelope()),
  },

  dialog: {
    open: (options: unknown) => ipcRenderer.invoke(IPC_CHANNELS.DIALOG_OPEN, buildAuthEnvelope(), options),
  },
};

contextBridge.exposeInMainWorld('agentflow', api);
