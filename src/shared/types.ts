// ── Core Data Models ──

export type ProjectStatus = 'planning' | 'active' | 'paused' | 'done'
export type Platform = 'Web' | 'Desktop' | 'CLI' | 'Mobile' | 'Embedded' | 'Other'
export type TaskStatus = 'todo' | 'doing' | 'in_progress' | 'blocked' | 'done'
export type Priority = 'critical' | 'high' | 'medium' | 'low'
export type Difficulty = 'Easy' | 'Medium' | 'Hard'
export type MemoryType =
  | 'user_preference'
  | 'project_context'
  | 'decision'
  | 'issue_fix'
  | 'api_provider'
  | 'prompt_pattern'
  | 'environment'
  | 'pattern'
  | 'insight'
  | 'knowledge'
  | 'code_snippet'
  | 'security'
  | 'git_summary'
  | 'log_analysis'
  | 'safety_check'
export type MemoryStatus = 'active' | 'pending' | 'archived'
export type MemoryInjectionMode = 'off' | 'minimal' | 'balanced' | 'full'
export type RiskLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical' | 'Safe' | 'Low' | 'Medium' | 'High' | 'Critical'
export type ThemeMode = 'light' | 'dark' | 'system'
export type AITool = 'Claude Code' | 'Codex' | 'Cursor' | 'Other'
export type { UserRole, UserStatus, AuthUser, StoredAuthUser, AuthSession, SessionUser, AuthSessionState, LoginRequest, LoginResult, ChangePasswordRequest, CreateUserRequest, ResetPasswordRequest, UpdateUserRequest, PublicUser } from './authTypes.js'
export type { AuditSeverity, AuditStatus, AuditActor, AuditEvent, AuditQuery } from './auditTypes.js'

export interface Project {
  id: string
  name: string
  idea: string
  platform: Platform
  techStack: string
  uiStyle: string
  difficulty: Difficulty
  status: ProjectStatus
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: string
  projectId: string
  role?: string
  title: string
  description?: string
  input?: string
  output?: string
  acceptance?: string
  assignee?: string
  priority: Priority
  status: TaskStatus
  createdAt: string
  updatedAt?: string
}

export interface SavedPrompt {
  id: string
  projectId?: string
  templateName?: string
  title?: string
  content: string
  favorite?: boolean
  name?: string
  templateId?: string
  variables?: Record<string, string>
  starred?: boolean
  createdAt: string
  updatedAt?: string
}

export interface Run {
  id: string
  projectId: string
  workflowTemplateId?: string
  promptId?: string
  providerId?: string
  versionId?: string
  title: string
  tool: string
  status: string
  log: string
  summary: string
  startedAt?: string
  endedAt?: string
  durationMs?: number
  retryCount?: number
  error?: string
  nodeTrace?: RunNodeTrace[]
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface RunNodeTrace {
  id: string
  name: string
  status: 'planned' | 'running' | 'success' | 'failed' | 'blocked'
  durationMs?: number
  inputSummary?: string
  outputSummary?: string
  failureReason?: string
  retryCount?: number
}

export interface WorkflowTemplateNode {
  id: string
  name: string
  type: 'input' | 'agent' | 'tool' | 'human' | 'condition' | 'loop' | 'parallel' | 'git' | 'retrieval' | 'output'
  description: string
  input?: string
  output?: string
  safetyNote?: string
  retryAdvice?: string
}

export type WorkflowTemplateDifficulty = 'beginner' | 'intermediate' | 'advanced'
export type WorkflowTemplateRisk = 'low' | 'medium' | 'high'

export interface WorkflowTemplate {
  id: string
  name: string
  purpose: string
  description: string
  scenario: string
  category: string
  difficulty: WorkflowTemplateDifficulty
  riskLevel: WorkflowTemplateRisk
  beginnerRecommended: boolean
  requiresHumanApproval: boolean
  nodes: WorkflowTemplateNode[]
  tags: string[]
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
  projectId?: string
  providerScope?: string
  modelScope?: string
  metadata?: Record<string, unknown>
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
  createdAt?: string
  updatedAt?: string
}

export interface AppSettings {
  theme: ThemeMode
  defaultProjectPath: string
  defaultAITool: AITool
  dataPath: string
  version?: string
  appVersion?: string
  techStack?: string[]
}

// ── Skill types ──

export interface SkillMeta {
  name: string
  description: string
  path?: string
  filePath?: string
  lastModified?: string
  valid: boolean
  missingFields: string[]
}

// ── Log analysis types ──

export interface LogAnalysisResult {
  id?: string
  errorType: string
  summary?: string
  possibleCauses: string[]
  fixSteps: string[]
  suggestedCommands: string[]
  fixPrompt: string
  suggestMemory?: boolean
  analyzedAt?: string
  rawLog?: string
}

// ── Safety check types ──

export interface SafetyCheckResult {
  id?: string
  command?: string
  riskLevel: RiskLevel
  matchedRules: Array<string | { name: string; description: string }>
  explanation: string
  saferAlternative: string
  suggestBackup?: boolean
  suggestIsolation?: boolean
  backupSuggested?: boolean
  isolationSuggested?: boolean
  checkedAt?: string
}

// ── Git timeline types ──

export interface GitCommitEntry {
  hash: string
  message: string
  author: string
  date: string
  files: string[]
}

export type ReleaseTestStatus = 'PASS' | 'FAIL' | 'BLOCKED' | 'UNKNOWN'

export interface ReleaseTestResult {
  command: string
  status: ReleaseTestStatus
  details: string
}

export interface ReleaseStatus {
  version: string
  branch: string
  gitStatus: string
  recentCommits: GitCommitEntry[]
  updateSummary: string[]
  testResults: ReleaseTestResult[]
  progressSummary: string[]
  checkedAt: string
}

// ── Planning types ──

export interface ProjectPlan {
  title?: string
  overview?: string
  summary: string
  prd: string
  architecture: string
  directoryStructure: string
  tasks: Task[]
  testPlan: string
  acceptanceCriteria: string
  devPrompt: string
  claudeCodePrompt?: string
  codexPrompt: string
  cursorPrompt: string
}

export interface PromptTemplateVariable {
  name: string
  key?: string
  label: string
  placeholder: string
  required: boolean
  type?: 'text' | 'textarea'
}

export interface PromptTemplate {
  id?: string
  name: string
  description: string
  category: string
  variables: PromptTemplateVariable[]
  template: string
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
  RELEASE_STATUS: 'release:status',

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

  // Auth
  AUTH_BOOTSTRAP: 'auth:bootstrap',
  AUTH_LOGIN: 'auth:login',
  AUTH_LOGOUT: 'auth:logout',
  AUTH_SESSION: 'auth:session',
  AUTH_CHANGE_PASSWORD: 'auth:changePassword',

  // Users / Admin
  USER_LIST: 'user:list',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_RESET_PASSWORD: 'user:resetPassword',

  // Audit
  AUDIT_LIST: 'audit:list',
  AUDIT_EXPORT: 'audit:export',
} as const
