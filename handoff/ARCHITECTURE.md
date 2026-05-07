# AgentFlow Studio — Architecture Document

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────┐
│              Electron Main Process               │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ Storage  │  │   Git    │  │  FileSystem   │   │
│  │ (JSON)   │  │(simple-  │  │  (fs/promises)│   │
│  │          │  │  git)    │  │               │   │
│  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │
│       │             │               │            │
│  ┌────┴─────────────┴───────────────┴───────┐    │
│  │              IPC Handler Layer            │    │
│  │         (ipcMain.handle registrations)    │    │
│  └──────────────────┬───────────────────────┘    │
│                     │                            │
│  ┌──────────────────┴───────────────────────┐    │
│  │           Security Layer                  │    │
│  │  (path sanitization, secret redaction)    │    │
│  └──────────────────┬───────────────────────┘    │
└─────────────────────┼────────────────────────────┘
                      │ contextBridge
┌─────────────────────┼────────────────────────────┐
│              Renderer Process                     │
│                     │                             │
│  ┌──────────────────┴───────────────────────┐    │
│  │           window.agentflow API            │    │
│  │        (typed IPC proxy object)           │    │
│  └──────────────────┬───────────────────────┘    │
│                     │                             │
│  ┌──────────────────┴───────────────────────┐    │
│  │          React Application                │    │
│  │  ┌─────────┐  ┌──────────┐  ┌─────────┐  │    │
│  │  │ Routes  │  │Components │  │   Lib   │  │    │
│  │  │(10 pgs) │  │  (15)    │  │  (12)   │  │    │
│  │  └─────────┘  └──────────┘  └─────────┘  │    │
│  └───────────────────────────────────────────┘    │
└────────────────────────────────────────────────────┘
```

## 2. Main Process Architecture

### Lifecycle
1. `app.ready` → `registerIpcHandlers()` → `seedDemoDataIfNeeded()` → `createWindow()`
2. `window-all-closed` → `app.quit()` (Windows/Linux) or no-op (macOS)
3. `activate` (macOS) → re-create window if none exists

### Window Configuration
```typescript
{
  width: 1400, height: 900,
  minWidth: 1024, minHeight: 680,
  webPreferences: {
    contextIsolation: true,   // CRITICAL: never false
    nodeIntegration: false,   // CRITICAL: never true
    preload: path.join(__dirname, 'preload.js')
  }
}
```

### Module Dependencies
```
index.ts
  ├── ipc.ts → registers all handlers
  │     ├── storage.ts (singleton Storage)
  │     ├── git.ts (simple-git wrapper)
  │     ├── filesystem.ts (fs operations)
  │     ├── security.ts (path & secret utilities)
  │     └── shortcut.ts (desktop integration)
  └── preload.ts (independent, loaded by Electron)
```

## 3. Preload API Design

```typescript
// Exposed on window.agentflow
interface AgentFlowAPI {
  projects: { list, get, create, update, delete }
  tasks: { list, create, update, delete }
  prompts: { list, create, update, delete }
  runs: { list, create }
  git: { log, status, summary }
  memory: { list, get, create, update, delete, exportAll, importMemories, generateContext }
  settings: { get, set, getAll }
  providers: { list, create, update, delete }
  export: { markdown, json }
  skills: { list, read }
  app: { info, getDataPath }
  dialog: { open }
}
```

Each method = `ipcRenderer.invoke(channel, ...args)` with proper typing.

## 4. IPC Channel Design

All channel names defined in `src/shared/types.ts` as `IPC_CHANNELS` constant.

Pattern: `domain:action` (e.g., `project:create`, `memory:generateContext`)

### Memory IPC Channels
- `memory:list` → `{ projectId?, type?, providerScope?, status? }` → `Memory[]`
- `memory:get` → `{ id }` → `Memory | null`
- `memory:create` → `Partial<Memory>` → `Memory`
- `memory:update` → `{ id, updates }` → `Memory`
- `memory:delete` → `{ id }` → `boolean`
- `memory:export` → `{ projectId? }` → `string` (JSON)
- `memory:import` → `{ data: Memory[] }` → `{ imported, skipped }`
- `memory:generateContext` → `{ projectId?, mode, maxItems?, maxChars? }` → `string` (markdown)

### Export IPC Channels
- `export:markdown` → uses `dialog.showSaveDialog({ filters: [{ name: 'Markdown', extensions: ['md'] }] })`
- `export:json` → uses `dialog.showSaveDialog({ filters: [{ name: 'JSON', extensions: ['json'] }] })`

## 5. Renderer Page Architecture

### Route Structure (HashRouter)
```
/                     → Dashboard
/projects             → Projects (list)
/projects/:id         → ProjectDetail
/prompt-lab           → PromptLab
/log-analyzer         → LogAnalyzer
/git-timeline         → GitTimeline
/safety-box           → SafetyBox
/shared-memory-hub    → SharedMemoryHub
/skills               → Skills
/settings             → Settings
```

### Page Component Pattern
Each page follows this pattern:
```typescript
function PageName() {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { loadData() }, [])

  // 4 states:
  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={loadData} />
  if (data.length === 0) return <EmptyState ... />
  return <DataView data={data} />
}
```

## 6. Local Storage Structure

### File Layout
```
{userData}/agentflow-data/
├── projects.json          # Project[] — all projects
├── tasks.json             # Task[] — all tasks (linked by projectId)
├── prompts.json           # SavedPrompt[] — saved prompts
├── memories.json          # Memory[] — shared memories
├── runs.json              # Run[] — execution runs
├── riskChecks.json        # RiskCheck[] — safety check history
├── providerSettings.json  # ProviderSetting[] — AI provider configs
└── settings.json          # { key: value }[] — app settings
```

### Write Queue
```typescript
// Per-collection promise chain for safe concurrent writes
class Storage {
  private writeQueues: Map<string, Promise<void>> = new Map()

  private async queueWrite(collection: string, fn: () => Promise<void>) {
    const prev = this.writeQueues.get(collection) ?? Promise.resolve()
    const next = prev.then(fn)
    this.writeQueues.set(collection, next)
    return next
  }
}
```

### Adapter Interface (for future SQLite)
```typescript
interface StorageAdapter {
  getAll<T>(collection: string): Promise<T[]>
  getById<T>(collection: string, id: string): Promise<T | null>
  create<T extends { id: string }>(collection: string, item: T): Promise<T>
  update<T>(collection: string, id: string, updates: Partial<T>): Promise<T>
  delete(collection: string, id: string): Promise<boolean>
}
```

## 7. Shared Memory Hub Data Model

```typescript
interface Memory {
  id: string
  type: MemoryType       // 7 types
  title: string
  content: string
  tags: string[]
  projectId: string      // "" for global memories
  providerScope: string   // "" for all providers
  modelScope: string      // "" for all models
  importance: number      // 1-5
  status: MemoryStatus    // active | pending | archived
  createdAt: string
  updatedAt: string
  lastUsedAt: string
}
```

### Retrieval Logic
```
off      → return []
minimal  → active only, sort by importance DESC, take 3
balanced → active only, project filter, sort by importance, include context/decision/preference types
full     → active + pending, project filter, sort by importance, cap by maxItems + maxChars
```

Filter out any memory where content matches secret patterns.

### Context Generation Format
```
[Shared Memory Context]
- 项目背景：{project_context memories}
- 已做决策：{decision memories}
- 当前进度：{project_context + issue_fix memories}
- 已知问题：{issue_fix memories}
- 用户偏好：{user_preference memories}
- API Provider 注意事项：{api_provider memories}
[/Shared Memory Context]
```

## 8. Log Analyzer Rules

15+ error patterns implemented. Each pattern maps to:
- `errorType`: Human-readable error category
- `possibleCauses`: Array of likely causes
- `fixSteps`: Step-by-step resolution instructions
- `suggestedCommands`: Ready-to-run CLI commands
- `fixPrompt`: AI-ready prompt for fixing this error
- `suggestMemory`: Boolean — should this become an issue_fix memory?

Detected errors: Cannot find module, npm install failed, vite server failed, TypeScript errors, Electron preload errors, Electron main process errors, Playwright browser missing, EADDRINUSE, EPERM, node-gyp failed, better-sqlite3 build failed, path with Chinese characters, electron-builder icon error, PowerShell execution policy, npm script missing, tsconfig path error.

## 9. SafetyBox Rules

Risk levels: Safe, Low, Medium, High, Critical

20+ dangerous patterns detected:
- System destruction (format, diskpart)
- Recursive deletion on system paths (rm -rf /, Remove-Item -Recurse, del /s)
- Remote code execution (iwr|iex, irm|iex, curl|bash)
- Credential exposure (env var printing, .env reading)
- System modification (hosts, registry, firewall)
- Unknown binary execution
- File upload operations

Each match returns: riskLevel, matchedRules, explanation, saferAlternative, suggestBackup, suggestIsolation.

## 10. Prompt Lab Template System

13 templates with variable interpolation using `{{variableName}}` syntax.

Template structure:
```typescript
interface PromptTemplate {
  name: string
  description: string
  category: string
  variables: { name, label, placeholder, required }[]
  template: string  // contains {{variable}} placeholders
}
```

Variable filling with `fillTemplate(name, vars)` replaces `{{key}}` with values.

## 11. Export System

- `exportMarkdown(content, filename)` → markdown with metadata header and timestamps
- `exportJSON(data, filename)` → formatted JSON with `_exportMeta`
- `exportMemoriesToMarkdown(memories, projectName?)` → grouped by type, human-readable
- `exportProjectPlanToMarkdown(plan)` → all plan sections as structured markdown
- All exports pass through secret redaction before output

## 12. Git Timeline

Uses `simple-git` with three operations:
1. `git.log()` → parsed into `GitCommitEntry[]` with files per commit
2. `git.status()` → human-readable status string
3. Summary: `git.branch()` + `git.log({ maxCount: 10 })` → branch name, count

Error handling: non-git repos, missing git binary, empty repos all return graceful error messages.

## 13. Settings Configuration Logic

Settings stored as key-value pairs: `{ key: string, value: any }[]`

Default settings: theme=light, defaultProjectPath, defaultAITool, version=1.0.0.

Provider settings: full CRUD with apiKey masking (only last 4 chars shown in UI after first save).

Theme application: dark class on `<html>`, CSS variables handle the rest.
