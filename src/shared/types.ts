// ── Core Data Models ──

export type ProjectStatus = 'planning' | 'active' | 'paused' | 'done'
export type Platform = 'Web' | 'Desktop' | 'CLI' | 'Mobile' | 'Embedded' | 'Other'
export type TaskStatus = 'todo' | 'doing' | 'blocked' | 'done'
export type Priority = 'critical' | 'high' | 'medium' | 'low'
export type MemoryType = 'user_preference' | 'project_context' | 'decision' | 'issue_fix' | 'api_provider' | 'prompt_pattern' | 'environment'
export type MemoryStatus = 'active' | 'pending' | 'archived'
export type MemoryInjectionMode = 'off' | 'minimal' | 'balanced' | 'full'
export type RiskLevel = 'Safe' | 'Low' | 'Medium' | 'High' | 'Critical'
export type ThemeMode = 'light' | 'dark' | 'system'
export type AITool = 'Claude Code' | 'Codex' | 'Cursor' | 'Other'

export interface Project {
  id: string
  name: string
  idea: string
  platform: Platform
  techStack: string
  uiStyle: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  status: ProjectStatus
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: string
  projectId: string
  role: string
  title: string
  description: string
  input: string
  output: string
  acceptance: string
  priority: Priority
  status: TaskStatus
  createdAt: string
  updatedAt: string
}

export interface SavedPrompt {
  id: string
  projectId: string
  templateName: string
  title: string
  content: string
  favorite: boolean
  createdAt: string
  updatedAt: string
}

export interface Run {
  id: string
  projectId: string
  title: string
  tool: string
  status: string
  log: string
  summary: string
  createdAt: string
}

export interface RiskCheck {
  id: string
  command: string
  riskLevel: RiskLevel
  matchedRules: string[]
  explanation: string
  saferAlternative: string
  createdAt: string
}

export interface Memory {
  id: string
  type: MemoryType
  title: string
  content: string
  tags: string[]
  projectId: string
  providerScope: string
  modelScope: string
  importance: number
  status: MemoryStatus
  createdAt: string
  updatedAt: string
  lastUsedAt: string
}

export interface MemoryLink {
  id: string
  memoryId: string
  entityType: string
  entityId: string
  createdAt: string
}

export interface ProviderSetting {
  id: string
  providerName: string
  baseUrl: string
  apiKey: string
  modelName: string
  enabled: boolean
  memoryEnabled: boolean
  memoryInjectionMode: MemoryInjectionMode
  maxMemoryItems: number
  maxMemoryChars: number
  createdAt: string
  updatedAt: string
}

export interface AppSettings {
  theme: ThemeMode
  defaultProjectPath: string
  defaultAITool: AITool
  dataPath: string
  version: string
}

// ── Skill types ──

export interface SkillMeta {
  name: string
  description: string
  path: string
  valid: boolean
  missingFields: string[]
}

// ── Log analysis types ──

export interface LogAnalysisResult {
  errorType: string
  possibleCauses: string[]
  fixSteps: string[]
  suggestedCommands: string[]
  fixPrompt: string
  suggestMemory: boolean
}

// ── Safety check types ──

export interface SafetyCheckResult {
  riskLevel: RiskLevel
  matchedRules: string[]
  explanation: string
  saferAlternative: string
  suggestBackup: boolean
  suggestIsolation: boolean
}

// ── Git timeline types ──

export interface GitCommitEntry {
  hash: string
  message: string
  author: string
  date: string
  files: string[]
}

// ── Planning types ──

export interface ProjectPlan {
  summary: string
  prd: string
  architecture: string
  directoryStructure: string
  tasks: Task[]
  testPlan: string
  acceptanceCriteria: string
  devPrompt: string
  codexPrompt: string
  cursorPrompt: string
}

// ── IPC channel names ──

export const IPC_CHANNELS = {
  // Storage
  STORAGE_GET: 'storage:get',
  STORAGE_SET: 'storage:set',
  STORAGE_DELETE: 'storage:delete',
  STORAGE_GET_ALL: 'storage:getAll',

  // Projects
  PROJECT_LIST: 'project:list',
  PROJECT_GET: 'project:get',
  PROJECT_CREATE: 'project:create',
  PROJECT_UPDATE: 'project:update',
  PROJECT_DELETE: 'project:delete',

  // Tasks
  TASK_LIST: 'task:list',
  TASK_CREATE: 'task:create',
  TASK_UPDATE: 'task:update',
  TASK_DELETE: 'task:delete',

  // Prompts
  PROMPT_LIST: 'prompt:list',
  PROMPT_CREATE: 'prompt:create',
  PROMPT_UPDATE: 'prompt:update',
  PROMPT_DELETE: 'prompt:delete',

  // Runs
  RUN_LIST: 'run:list',
  RUN_CREATE: 'run:create',

  // Git
  GIT_LOG: 'git:log',
  GIT_STATUS: 'git:status',
  GIT_SUMMARY: 'git:summary',

  // Memory
  MEMORY_LIST: 'memory:list',
  MEMORY_GET: 'memory:get',
  MEMORY_CREATE: 'memory:create',
  MEMORY_UPDATE: 'memory:update',
  MEMORY_DELETE: 'memory:delete',
  MEMORY_EXPORT: 'memory:export',
  MEMORY_IMPORT: 'memory:import',
  MEMORY_GENERATE_CONTEXT: 'memory:generateContext',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_GET_ALL: 'settings:getAll',
  PROVIDER_LIST: 'provider:list',
  PROVIDER_CREATE: 'provider:create',
  PROVIDER_UPDATE: 'provider:update',
  PROVIDER_DELETE: 'provider:delete',

  // Export
  EXPORT_MARKDOWN: 'export:markdown',
  EXPORT_JSON: 'export:json',

  // Skills
  SKILLS_LIST: 'skills:list',
  SKILL_READ: 'skill:read',

  // App
  APP_INFO: 'app:info',
  GET_DATA_PATH: 'app:dataPath',

  // Dialog
  DIALOG_OPEN: 'dialog:open',
} as const
