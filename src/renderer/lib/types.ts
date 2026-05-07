// ── Re-export all shared types ──

export type {
  ProjectStatus,
  Platform,
  TaskStatus,
  Priority,
  MemoryType,
  MemoryStatus,
  MemoryInjectionMode,
  RiskLevel,
  ThemeMode,
  AITool,
  Project,
  Task,
  SavedPrompt,
  Run,
  RiskCheck,
  Memory,
  MemoryLink,
  ProviderSetting,
  AppSettings,
  SkillMeta,
  LogAnalysisResult,
  SafetyCheckResult,
  GitCommitEntry,
  ProjectPlan,
} from '../../shared/types';

export { IPC_CHANNELS } from '../../shared/types';

// ── Renderer-specific types ──

/** Status of an async operation within the renderer. */
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

/** Generic async state wrapper used by UI components. */
export interface AsyncState<T> {
  data: T | null;
  status: AsyncStatus;
  error: string | null;
}

/** A notification / toast shown in the UI. */
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number; // ms, 0 = sticky
  createdAt: string;
}

/** Filter state for the memory browser. */
export interface MemoryFilter {
  projectId?: string;
  type?: MemoryType;
  status?: MemoryStatus;
  providerScope?: string;
  searchQuery?: string;
  sortBy: 'importance' | 'updatedAt' | 'createdAt' | 'title';
  sortDirection: 'asc' | 'desc';
}

/** Filter state for the prompt library. */
export interface PromptFilter {
  projectId?: string;
  category?: string;
  favorite?: boolean;
  searchQuery?: string;
}

/** Tab definition for the main navigation / workspace tabs. */
export interface WorkspaceTab {
  id: string;
  projectId: string;
  type: 'planner' | 'prompts' | 'runs' | 'memory' | 'git' | 'settings';
  label: string;
  dirty: boolean;
}

/** Confirmation dialog payload. */
export interface ConfirmDialog {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  variant: 'default' | 'danger';
  onConfirm?: () => void;
}

/** Export format options. */
export type ExportFormat = 'markdown' | 'json';

/** Export options for any export operation. */
export interface ExportOptions {
  format: ExportFormat;
  filename: string;
  redactSecrets: boolean;
  includeMetadata: boolean;
}

/** A queued background operation shown in the status bar. */
export interface BackgroundJob {
  id: string;
  label: string;
  progress: number; // 0-100, -1 = indeterminate
  status: 'running' | 'done' | 'error';
  error?: string;
}
