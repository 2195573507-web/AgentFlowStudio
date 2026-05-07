import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/types';
import type { MemoryInjectionMode } from '../shared/types';

// ---------------------------------------------------------------------------
// Type the exposed API so the renderer gets full IntelliSense.
// (Mirrors the shape we attach to the `window.agentflow` object.)
// ---------------------------------------------------------------------------

export interface AgentFlowAPI {
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
  };
  git: {
    log(repoPath: string): Promise<unknown>;
    status(repoPath: string): Promise<unknown>;
    summary(repoPath: string): Promise<unknown>;
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

const api: AgentFlowAPI = {
  projects: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.PROJECT_LIST),
    get: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.PROJECT_GET, id),
    create: (data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.PROJECT_CREATE, data),
    update: (id: string, data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.PROJECT_UPDATE, id, data),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.PROJECT_DELETE, id),
  },

  tasks: {
    list: (projectId: string) => ipcRenderer.invoke(IPC_CHANNELS.TASK_LIST, projectId),
    create: (data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.TASK_CREATE, data),
    update: (id: string, data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.TASK_UPDATE, id, data),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.TASK_DELETE, id),
  },

  prompts: {
    list: (projectId: string) => ipcRenderer.invoke(IPC_CHANNELS.PROMPT_LIST, projectId),
    create: (data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.PROMPT_CREATE, data),
    update: (id: string, data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.PROMPT_UPDATE, id, data),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.PROMPT_DELETE, id),
  },

  runs: {
    list: (projectId: string) => ipcRenderer.invoke(IPC_CHANNELS.RUN_LIST, projectId),
    create: (data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.RUN_CREATE, data),
  },

  git: {
    log: (repoPath: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_LOG, repoPath),
    status: (repoPath: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_STATUS, repoPath),
    summary: (repoPath: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_SUMMARY, repoPath),
  },

  memory: {
    list: (filters?: Record<string, unknown>) =>
      ipcRenderer.invoke(IPC_CHANNELS.MEMORY_LIST, filters),
    get: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.MEMORY_GET, id),
    create: (data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.MEMORY_CREATE, data),
    update: (id: string, data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.MEMORY_UPDATE, id, data),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.MEMORY_DELETE, id),
    exportAll: () => ipcRenderer.invoke(IPC_CHANNELS.MEMORY_EXPORT),
    importMemories: (data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.MEMORY_IMPORT, data),
    generateContext: (options: { projectId?: string; injectionMode?: MemoryInjectionMode }) =>
      ipcRenderer.invoke(IPC_CHANNELS.MEMORY_GENERATE_CONTEXT, options),
  },

  settings: {
    get: (key: string) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET, key),
    set: (key: string, value: unknown) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, key, value),
    getAll: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET_ALL),
  },

  providers: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.PROVIDER_LIST),
    create: (data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.PROVIDER_CREATE, data),
    update: (id: string, data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.PROVIDER_UPDATE, id, data),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.PROVIDER_DELETE, id),
  },

  export: {
    markdown: (content: string, filename: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.EXPORT_MARKDOWN, content, filename),
    json: (data: unknown, filename: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.EXPORT_JSON, data, filename),
  },

  skills: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.SKILLS_LIST),
    read: (skillPath: string) => ipcRenderer.invoke(IPC_CHANNELS.SKILL_READ, skillPath),
  },

  app: {
    info: () => ipcRenderer.invoke(IPC_CHANNELS.APP_INFO),
    getDataPath: () => ipcRenderer.invoke(IPC_CHANNELS.GET_DATA_PATH),
  },

  dialog: {
    open: (options: unknown) => ipcRenderer.invoke(IPC_CHANNELS.DIALOG_OPEN, options),
  },
};

contextBridge.exposeInMainWorld('agentflow', api);
