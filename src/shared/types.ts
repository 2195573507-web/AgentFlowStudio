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
export type { ResourceAcl, ResourceAclEntry, ResourceRole, ResourceType } from './authTypes.js'
export type { AuditSeverity, AuditStatus, AuditActor, AuditEvent, AuditQuery } from './auditTypes.js'

export interface Project {
  id: string
  ownerUserId?: string
  acl?: import('./authTypes.js').ResourceAcl
  name: string
  idea: string
  platform: Platform
  techStack: string
  uiStyle: string
  difficulty: Difficulty
  status: ProjectStatus
  defaultProviderRef?: string
  defaultModel?: string
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
  actorUserId?: string
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

export interface RunEvent {
  id: string
  runId?: string
  agentId?: string
  executionId?: string
  projectId?: string
  workflowId?: string
  auditEventId?: string
  type: 'run.created' | 'run.updated' | 'permission.denied' | 'audit.recorded' | 'mcp.denied' | 'mcp.allowed' | 'provider.test' | 'provider.switch' | 'agent.execution' | 'feedback.created'
  status: 'success' | 'failure' | 'denied' | 'info'
  actorUserId?: string
  title: string
  detail?: string
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface McpAllowlistEntry {
  id: string
  serverName: string
  toolName: string
  permission: string
  enabled: boolean
  riskLevel: WorkflowTemplateRisk
  description?: string
  createdAt: string
  updatedAt: string
}

export interface SkillRegistryEntry {
  id: string
  name: string
  description: string
  category: string
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export type AgentStatus = 'enabled' | 'disabled' | 'archived'
export type AgentType = 'assistant' | 'reviewer' | 'workflow' | 'demo' | 'custom'
export type AgentHealthStatus = 'unknown' | 'healthy' | 'warning' | 'error'

export interface AgentRecord {
  id: string
  name: string
  description: string
  type: AgentType
  status: AgentStatus
  ownerUserId?: string
  projectId?: string
  workflowId?: string
  providerRef?: string
  model?: string
  systemPrompt?: string
  toolsAllowlistRef?: string
  skillsRefs: string[]
  createdAt: string
  updatedAt: string
  lastRunAt?: string
  lastHealthStatus: AgentHealthStatus
  deletedAt?: string
}

export type AgentExecutionStatus = 'queued' | 'running' | 'success' | 'failed' | 'cancelled' | 'demo'

export interface AgentExecutionRecord {
  id: string
  agentId: string
  runId?: string
  workflowId?: string
  projectId?: string
  status: AgentExecutionStatus
  startedAt: string
  finishedAt?: string
  durationMs?: number
  inputSummary: string
  outputSummary: string
  errorSummary?: string
  customData?: Record<string, unknown>
  createdAt: string
}

export type AgentFeedbackStatus = 'open' | 'triaged' | 'resolved' | 'archived'

export interface AgentFeedbackRecord {
  id: string
  agentId?: string
  executionId?: string
  runId?: string
  projectId?: string
  rating: 'positive' | 'neutral' | 'negative'
  title: string
  message: string
  status: AgentFeedbackStatus
  createdByUserId?: string
  createdAt: string
  updatedAt: string
}

export interface McpGatewayRequest {
  serverName: string
  toolName: string
  arguments?: unknown
  projectId?: string
  runId?: string
}

export interface McpGatewayDecision {
  id: string
  serverName: string
  toolName: string
  allowed: boolean
  reason: string
  allowlistEntryId?: string
  riskLevel?: WorkflowTemplateRisk
  sandbox: {
    network: 'denied'
    filesystem: 'read-only'
    commandExecution: 'denied'
    maxArgumentBytes: number
  }
  checkedAt: string
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
  providerId?: string
  providerName: string
  displayName?: string
  baseUrl: string
  apiKey: string
  modelName: string
  recommendedModels?: string[]
  authType?: 'apiKey' | 'none' | 'bearer' | 'custom'
  docsHint?: string
  networkHint?: string
  needsApiKey?: boolean
  supportsStreaming?: boolean
  supportsVision?: boolean
  defaultTimeout?: number
  lastTestStatus?: 'untested' | 'success' | 'failure'
  lastTestMessage?: string
  lastTestedAt?: string
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
  activeProviderRef?: string
  activeModel?: string
  agentDefaultProviderRef?: string
}

export interface ProviderPreset {
  providerId: string
  displayName: string
  baseUrl: string
  recommendedModels: string[]
  authType: 'apiKey' | 'none' | 'bearer' | 'custom'
  docsHint: string
  networkHint: string
  needsApiKey: boolean
  supportsStreaming: boolean
  supportsVision: boolean
  defaultTimeout: number
}

export interface ActiveProviderConfig {
  providerRef: string
  model: string
  scope: 'workspace' | 'project' | 'agent'
  projectId?: string
  agentId?: string
}

export interface ConfigExportManifest {
  version: 1
  exportedAt: string
  hash: string
  redaction: 'secrets-omitted'
  counts: Record<string, number>
}

export interface ConfigBundle {
  manifest: ConfigExportManifest
  providerPresets: ProviderPreset[]
  providers: Array<Record<string, unknown>>
  projectDefaults: Array<{ projectId: string; defaultProviderRef?: string; defaultModel?: string }>
  agents: Array<Record<string, unknown>>
  templates: Array<Record<string, unknown>>
  mcpAllowlist: Array<Record<string, unknown>>
  skillsRegistry: SkillRegistryEntry[]
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
  PROJECT_ACL_GET: 'project:acl:get',
  PROJECT_ACL_UPDATE: 'project:acl:update',

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
  RUN_EVENTS_LIST: 'runEvents:list',

  // Workflows
  WORKFLOW_TEMPLATE_LIST: 'workflow:templates:list',
  WORKFLOW_LIST: 'workflow:list',
  WORKFLOW_GET: 'workflow:get',
  WORKFLOW_CREATE_FROM_TEMPLATE: 'workflow:createFromTemplate',
  WORKFLOW_SAVE: 'workflow:save',
  WORKFLOW_RUN: 'workflow:run',
  WORKFLOW_VERSION_LIST: 'workflow:versions:list',

  // MCP
  MCP_ALLOWLIST_LIST: 'mcp:allowlist:list',
  MCP_ALLOWLIST_CHECK: 'mcp:allowlist:check',
  MCP_ALLOWLIST_UPSERT: 'mcp:allowlist:upsert',
  MCP_GATEWAY_EVALUATE: 'mcp:gateway:evaluate',

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
  PROVIDER_PRESETS: 'provider:presets',
  PROVIDER_TEST: 'provider:test',
  PROVIDER_ACTIVE_GET: 'provider:active:get',
  PROVIDER_ACTIVE_SET: 'provider:active:set',

  // Agents
  AGENT_LIST: 'agent:list',
  AGENT_GET: 'agent:get',
  AGENT_CREATE: 'agent:create',
  AGENT_UPDATE: 'agent:update',
  AGENT_SOFT_DELETE: 'agent:softDelete',
  AGENT_ENABLE: 'agent:enable',
  AGENT_DISABLE: 'agent:disable',
  AGENT_HEALTH: 'agent:health',
  AGENT_EXECUTIONS_LIST: 'agent:executions:list',
  AGENT_TIMELINE_LIST: 'agent:timeline:list',
  AGENT_FEEDBACK_CREATE: 'agentFeedback:create',
  AGENT_FEEDBACK_LIST: 'agentFeedback:list',
  AGENT_FEEDBACK_GET: 'agentFeedback:get',
  AGENT_FEEDBACK_UPDATE_STATUS: 'agentFeedback:updateStatus',
  AGENT_FEEDBACK_EXPORT: 'agentFeedback:export',
  AGENT_FEEDBACK_SYNTHETIC: 'agentFeedback:createSyntheticFromExecution',

  // Config portability
  CONFIG_EXPORT: 'config:export',
  CONFIG_IMPORT_PREVIEW: 'config:importPreview',
  CONFIG_IMPORT_APPLY: 'config:importApply',

  // Skills registry
  SKILLS_REGISTRY_LIST: 'skillsRegistry:list',
  SKILLS_REGISTRY_UPSERT: 'skillsRegistry:upsert',
  SKILLS_REGISTRY_TOGGLE: 'skillsRegistry:toggle',

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
  USER_DIRECTORY: 'user:directory',

  // Audit
  AUDIT_LIST: 'audit:list',
  AUDIT_EXPORT: 'audit:export',
} as const
