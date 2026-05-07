# AgentFlow Studio — File Map

## Root Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts, electron-builder config |
| `tsconfig.json` | TypeScript config for renderer and tests |
| `tsconfig.node.json` | TypeScript config for main process |
| `vite.config.ts` | Vite + electron plugin + vitest config |
| `tailwind.config.ts` | Tailwind CSS theme (glass-morphism design tokens) |
| `postcss.config.js` | PostCSS with Tailwind and Autoprefixer |
| `.gitignore` | Git ignore rules |
| `index.html` | HTML entry point for Vite/renderer |
| `AGENTS.md` | Developer guide for AI agents working on this project |
| `README.md` | Project documentation for human developers |
| `CHANGELOG.md` | Version history |

## src/main/ — Electron Main Process

| File | Purpose |
|------|---------|
| `index.ts` | App entry: creates window, seeds demo data, handles lifecycle |
| `preload.ts` | contextBridge API: exposes typed `window.agentflow` to renderer |
| `ipc.ts` | IPC handler registration: all `ipcMain.handle` for every channel |
| `storage.ts` | JSON file storage: CRUD operations, write queue, singleton pattern |
| `git.ts` | Git operations via simple-git: log, status, summary |
| `filesystem.ts` | File system utilities: read/write/exists/list + skill scanning |
| `security.ts` | Security utilities: path sanitization, secret redaction |
| `shortcut.ts` | Windows desktop shortcut creation |

## src/renderer/ — React Renderer

### Entry & Root
| File | Purpose |
|------|---------|
| `main.tsx` | React entry: renders App with HashRouter and StrictMode |
| `App.tsx` | Root component: Layout + lazy-loaded routes + theme management |
| `styles.css` | Global styles: CSS variables, glass-morphism classes, animations |

### routes/ — Page Components (10)
| File | Route | Purpose |
|------|-------|---------|
| `Dashboard.tsx` | `/` | Stats, charts, recent items, quick actions |
| `Projects.tsx` | `/projects` | Project CRUD, search, filter, card grid |
| `ProjectDetail.tsx` | `/projects/:id` | PRD generation, architecture, tasks, prompts |
| `PromptLab.tsx` | `/prompt-lab` | Template selection, variable filling, memory injection |
| `LogAnalyzer.tsx` | `/log-analyzer` | Error log analysis with fix suggestions |
| `GitTimeline.tsx` | `/git-timeline` | Commit history browser |
| `SafetyBox.tsx` | `/safety-box` | Command safety checker |
| `SharedMemoryHub.tsx` | `/shared-memory-hub` | Memory CRUD, search, export/import, context generation |
| `Skills.tsx` | `/skills` | Agent skill scanner and viewer |
| `Settings.tsx` | `/settings` | Theme, provider, data, about settings |

### components/ — Reusable UI Components (15)
| File | Purpose |
|------|---------|
| `Layout.tsx` | Main layout: Sidebar + Topbar + content area |
| `Sidebar.tsx` | Navigation sidebar with icons, collapsible |
| `Topbar.tsx` | Page title, theme toggle, action buttons |
| `GlassCard.tsx` | Frosted glass card with hover effects |
| `Button.tsx` | Button with variants (primary/secondary/ghost/danger), sizes, loading |
| `Input.tsx` | Styled text input with label, error, icon |
| `Textarea.tsx` | Styled textarea with label, char count |
| `Badge.tsx` | Status/type pill badges (5 color variants) |
| `Modal.tsx` | Glass modal dialog with backdrop, escape-to-close |
| `EmptyState.tsx` | Beautiful empty state with icon and action button |
| `StatCard.tsx` | Metric display card with icon and trend |
| `TaskBoard.tsx` | Kanban board with 4 columns (Todo/Doing/Blocked/Done) |
| `PromptPreview.tsx` | Generated prompt display with copy/save buttons |
| `RiskMeter.tsx` | Risk level visualization bar |
| `Charts.tsx` | ECharts wrappers: TaskStatusChart (pie), MemoryTypeChart (bar), ActivityTimeline (line) |

### lib/ — Pure Logic Modules (12)
| File | Purpose |
|------|---------|
| `types.ts` | Re-exports shared types + renderer-specific types |
| `api.ts` | IPC API wrapper: typed `window.agentflow` accessor with fallback |
| `utils.ts` | Utilities: generateId, formatDate, truncate, classNames, debounce, copyToClipboard |
| `planner.ts` | Project planning engine: generates PRD, architecture, tasks, dev prompts |
| `templates.ts` | Prompt templates: 13 templates with variables, fillTemplate function |
| `logAnalyzer.ts` | Log analysis: 15+ error patterns with causes, fixes, AI prompts |
| `safetyRules.ts` | Safety checker: 20+ dangerous command patterns with risk levels |
| `memoryStore.ts` | Client-side memory cache: filter, search, sort operations |
| `memoryRetriever.ts` | Memory retrieval: mode-based (off/minimal/balanced/full) selection |
| `memoryInjection.ts` | Context generation: format memories as [Shared Memory Context] block |
| `secretRedaction.ts` | Secret detection and redaction for API keys, tokens, passwords |
| `exporters.ts` | Export utilities: Markdown, JSON, memory export, plan export |

## src/shared/ — Shared Types

| File | Purpose |
|------|---------|
| `types.ts` | Core data types (Project, Task, Memory, etc.) + IPC_CHANNELS constants |

## tests/ — Test Files

### unit/ — Unit Tests (9)
| File | Tests |
|------|-------|
| `planner.test.ts` | Project plan generation, task structure, memory injection |
| `templates.test.ts` | Template definitions, template lookup, variable filling |
| `logAnalyzer.test.ts` | Error pattern detection for 12+ error types |
| `safetyRules.test.ts` | Dangerous command detection for 12+ patterns |
| `exporters.test.ts` | Markdown export, JSON export, memory export, plan export, secret redaction |
| `memoryStore.test.ts` | Memory CRUD, search, filter by type/project/provider/status, importance sort |
| `memoryRetriever.test.ts` | Retrieval modes (off/minimal/balanced/full), limits, filtering, secret exclusion |
| `memoryInjection.test.ts` | Context generation for all modes, maxChars, prompt injection |
| `secretRedaction.test.ts` | Secret detection, redaction patterns, multiple secrets, safe text preservation |

### e2e/ — E2E Tests (1)
| File | Tests |
|------|-------|
| `app.spec.ts` | Homepage loads, navigation to key pages, sidebar visibility, page title |

## scripts/ — Utility Scripts

| File | Purpose |
|------|---------|
| `create-icon.js` | Generate SVG icon + placeholder PNG/ICO |
| `create-shortcut.ps1` | Windows PowerShell: create desktop shortcut |
| `verify-build.js` | Check all required files exist |
| `seed-demo-data.js` | Seeding utility (reserved for future use) |

## data/ — Data Files

| File | Purpose |
|------|---------|
| `demo.json` | Fallback demo data when running without Electron IPC |

## .agents/skills/ — Agent Skill Definitions

| Directory | SKILL.md Purpose |
|-----------|-----------------|
| `product-planner/` | PRD, architecture, task breakdown generation |
| `ui-polisher/` | UI review and refinement workflow |
| `test-runner/` | Test execution and failure analysis |
| `git-release-manager/` | Version bump, changelog, release management |
| `safety-reviewer/` | Shell command and script safety review |
| `memory-curator/` | Shared memory quality control and curation |

## handoff/ — Codex Handoff Package

| File | Purpose |
|------|---------|
| `CODEX_HANDOFF.md` | Complete project overview for Codex |
| `PROJECT_MEMORY.md` | Long-term project memory for context injection |
| `ARCHITECTURE.md` | Detailed architecture documentation |
| `FILE_MAP.md` | This file — map of all project files |
| `TASK_STATUS.md` | Task completion status table |
| `TEST_REPORT.md` | Latest test and build results |
| `CODEX_OPTIMIZE_PROMPT.md` | Ready-to-use Codex optimization prompt |
| `CURRENT_CONTEXT_FOR_ANY_MODEL.md` | Quick context recovery for any AI model |

## assets/ — Application Assets

| File | Purpose |
|------|---------|
| `icon.svg` | Vector app icon (primary) |
| `icon.png` | Raster app icon (512x512 placeholder) |
| `icon.ico` | Windows ICO file (placeholder) |
