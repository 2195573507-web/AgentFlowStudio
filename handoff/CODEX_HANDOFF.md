# Codex Handoff Document — AgentFlow Studio

## Last Stability Loop Result - 2026-05-07

Codex ran a multi-agent stability loop. Six real subagents completed startup, shortcut/icon, build/smoke, UI runtime, shared memory, and fallback delivery checks. The seventh handoff reporter agent could not launch because of the platform thread limit, so the main thread completed reporting.

Current adopted launch scheme: **Static fallback**.

Use:

```bat
D:\AgentFlowStudio\start-agentflow-static.bat
```

Desktop shortcut:

```text
C:\Users\至亲\Desktop\AgentFlow Studio.lnk
Target: D:\AgentFlowStudio\start-agentflow-static.bat
Icon: D:\AgentFlowStudio\assets\icon.ico,0
```

Verified pass:

- `npm.cmd install`
- `npm.cmd run icon`
- `npm.cmd run typecheck`
- `node_modules\.bin\tsc.cmd -p tsconfig.node.json`
- `npm.cmd run lint` with warnings only
- `npm.cmd run smoke` with 53/53 checks
- `npm.cmd run verify`
- Static HTTP smoke returning `STATUS=200`, title `AgentFlow Studio`
- `npm.cmd run shortcut` with Desktop write permission

Environment blocked in this main execution context:

- `npm.cmd run dev`
- `npm.cmd run dev:web`
- `npm.cmd run test`
- `npm.cmd run build`
- `npm.cmd run build:web`

They all fail while loading Vite/Vitest config because Node child-process spawning of esbuild returns `EPERM`. Direct `node_modules\.bin\esbuild.cmd --version` succeeds.

Important follow-up: Shared Memory CRUD exists, but Prompt Lab / recovery prompt fallback context and main-process redaction enforcement should be hardened next.

## One-Line Summary

AgentFlow Studio is a local Electron desktop app that serves as an AI project orchestration hub — it turns project ideas into structured plans, prompts, tasks, and persistent cross-model memories.

## Project Goal

Build a local-first desktop tool that helps developers manage AI-assisted coding projects end-to-end. The app generates PRDs, architectures, task breakdowns, AI dev prompts, analyzes errors, checks command safety, manages shared project memories across AI tools/models, and produces Codex-ready handoff packages.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Shell | Electron 33 |
| Frontend | React 18 + TypeScript 5.7 |
| Build | Vite 6 + vite-plugin-electron |
| Styling | Tailwind CSS 3.4 (Apple Liquid Glass design) |
| Charts | ECharts 5 |
| Icons | lucide-react |
| Git Integration | simple-git |
| Storage | JSON files (local filesystem, adapter pattern for future SQLite) |
| Testing | Vitest (unit), Playwright (E2E) |
| Packaging | electron-builder (NSIS on Windows) |

## Directory Structure

```
AgentFlowStudio/
├── src/main/          # Electron main process (8 files)
├── src/renderer/      # React renderer (10 pages, 15 components, 12 lib modules)
├── src/shared/        # Shared TypeScript types
├── tests/             # Unit tests (9) + E2E tests (1)
├── handoff/           # Codex handoff package (8 files)
├── .agents/skills/    # 6 agent skill definitions
├── scripts/           # 4 utility scripts
├── assets/            # App icons
└── data/              # Demo/seed data
```

## Main Process (src/main/)

### index.ts — App Entry Point
- Creates BrowserWindow (1400x900, min 1024x680)
- Sets contextIsolation: true, nodeIntegration: false
- Registers all IPC handlers
- Seeds demo data on first launch (2 projects, 8 tasks, 5 memories)

### preload.ts — Security Boundary
- Uses contextBridge.exposeInMainWorld('agentflow', api)
- Exposes typed API for: projects, tasks, prompts, runs, git, memory, settings, providers, export, skills, app, dialog
- This is the ONLY bridge between renderer and main process

### ipc.ts — IPC Handler Registry
- Registers ipcMain.handle for ALL IPC_CHANNELS
- Every handler wrapped in try-catch returning { error } on failure
- Memory handlers: full CRUD + export/import + generateContext
- Settings handlers: key-value pair storage
- Export handlers: dialog.showSaveDialog + fs.writeFile

### storage.ts — JSON File Storage
- Singleton Storage class
- Data in app.getPath('userData')/agentflow-data/
- Each collection = one JSON file
- Promise-chain write queue per collection (prevents concurrent writes)
- Interface: getAll, getById, create, update, delete
- IDs via crypto.randomUUID()

### git.ts — Git Operations
- Uses simple-git library
- getGitLog(repoPath) → GitCommitEntry[]
- getGitStatus(repoPath) → status string
- getGitSummary(repoPath) → { branch, commitCount, recentCommits }
- Graceful error handling for non-repos

### filesystem.ts — File Operations
- ensureDir, readFile, writeFile, fileExists, listDir
- readSkillsFromDir(dir) → scans .agents/skills for SKILL.md frontmatter
- All wrapped in try-catch

### security.ts — Safety Utilities
- sanitizeFilePath(input) — prevents path traversal
- redactSecrets(text) — redacts API keys, tokens, passwords
- validateCommand(command) — checks for dangerous patterns

### shortcut.ts — Desktop Integration
- createDesktopShortcut() — creates .lnk on Windows desktop
- Points to built .exe if available, otherwise creates start-agentflow.bat

## Renderer Process (src/renderer/)

### Pages (routes/)
1. **Dashboard** — Stats, charts (ECharts), recent projects, quick actions
2. **Projects** — CRUD, search, filter, project cards grid
3. **ProjectDetail** — PRD generation, architecture, tasks board, dev prompts
4. **PromptLab** — Template selection, variable filling, memory injection, save/copy/export
5. **LogAnalyzer** — Paste logs, detect errors, get fix suggestions + AI fix prompts
6. **GitTimeline** — Browse commits, see changed files, generate summary
7. **SafetyBox** — Command safety checker with RiskMeter visualization
8. **SharedMemoryHub** — Full memory CRUD, search, filter, export/import, context generation
9. **Skills** — Scan and display .agents/skills
10. **Settings** — Theme, provider config, data management, about

### Components (15 reusable)
Layout, Sidebar, Topbar, GlassCard, Button, Input, Textarea, Badge, Modal, EmptyState, StatCard, TaskBoard, PromptPreview, RiskMeter, Charts

### Lib Modules (12 pure logic)
types, api, utils, planner, templates, logAnalyzer, safetyRules, memoryStore, memoryRetriever, memoryInjection, secretRedaction, exporters

## Storage Design

JSON file-based, one file per collection in userData/agentflow-data/:

```
projects.json, tasks.json, prompts.json, memories.json,
runs.json, riskChecks.json, providerSettings.json, settings.json
```

The Storage class implements a simple adapter interface:
```typescript
interface StorageAdapter {
  getAll(collection: string): Promise<T[]>
  getById(collection: string, id: string): Promise<T | null>
  create(collection: string, item: T): Promise<T>
  update(collection: string, id: string, updates: Partial<T>): Promise<T>
  delete(collection: string, id: string): Promise<boolean>
}
```

Future: implement SQLite adapter with same interface.

## Shared Memory Hub Design

### Data Model
Each memory has: id, type (7 types), title, content, tags[], projectId, providerScope, modelScope, importance (1-5), status (active/pending/archived), timestamps.

### Injection Modes
- **off**: No memory injection
- **minimal**: Top 3 highest-importance active memories
- **balanced**: Active project memories (context, decisions, preferences)
- **full**: Active + pending, capped by maxItems and maxChars

### Context Format
```
[Shared Memory Context]
- Project background: ...
- Decisions made: ...
- Current progress: ...
- Known issues: ...
- User preferences: ...
- API Provider notes: ...
[/Shared Memory Context]
```

### Security
- API keys NEVER stored in memory
- Automatic redaction of secrets (sk-*, Bearer, api_key=, password=, secret=, tokens)
- Import validation: secret-only entries are skipped
- Export redaction: all secrets redacted in output
- All data local, no cloud upload

## AI Provider Configuration

Each provider has: providerName, baseUrl, apiKey (masked), modelName, enabled flag, memoryEnabled, memoryInjectionMode, maxMemoryItems, maxMemoryChars.

Supports any OpenAI-compatible API. apiKey is stored locally but masked in UI and never saved to memory.

## Completed Features

- [x] Full Electron shell with security best practices
- [x] All 10 pages with complete implementations
- [x] All 15 reusable components
- [x] Project planning engine (PRD, architecture, tasks, prompts)
- [x] 13 prompt templates with variable filling
- [x] Log analyzer with 15+ error patterns
- [x] Safety checker with 20+ dangerous command patterns
- [x] Git timeline integration via simple-git
- [x] Shared Memory Hub with full CRUD
- [x] Memory injection (3 modes)
- [x] Secret redaction system
- [x] Cross-model context recovery prompt generation
- [x] Export to Markdown and JSON
- [x] Settings with provider configuration
- [x] 6 agent skill definitions
- [x] Desktop shortcut creation
- [x] Build verification script
- [x] Unit tests (9 test suites)
- [x] E2E tests (Playwright)
- [x] Demo data seeding
- [x] Dark mode support
- [x] Complete Codex handoff documentation

## Incomplete / Needs Optimization

- [ ] Proper icon rasterization (PNG/ICO are SVG copies, need real conversion with sharp)
- [ ] Playwright browser installation for E2E tests
- [ ] electron-builder packaging may need icon fixes for .ico
- [ ] SQLite storage adapter (interface exists, implementation not yet done)
- [ ] Drag-and-drop for TaskBoard kanban
- [ ] Undo/redo for memory edits
- [ ] Memory auto-archiving based on age
- [ ] More comprehensive test coverage (edge cases)
- [ ] Performance profiling and optimization
- [ ] Accessibility audit

## Test Commands

```bash
npm run test          # Vitest unit tests (9 suites)
npm run test:e2e      # Playwright E2E tests (requires browsers)
npm run typecheck     # TypeScript type checking
npm run lint          # ESLint
```

## Build Commands

```bash
npm run build         # Vite build + main process TypeScript compilation
npm run dist          # Full build + electron-builder packaging
npm run verify        # Check all files present
npm run shortcut      # Create desktop shortcut
```

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| Preload script not found | vite-plugin-electron output path mismatch | Check vite.config.ts entry.output |
| port 5173 in use | Another Vite instance | Kill the other process or use another port |
| simple-git not working | Not a git repo or no git installed | Ensure project is in a git repo |
| electron-builder fails | Missing icon.ico or icon format wrong | Run `npm run icon` first |
| E2E tests skip | Playwright browsers not installed | `npx playwright install chromium` |
| TypeScript errors in build | Missing type declarations | Run `npm run typecheck` first |

## Codex: First Steps After Handoff

1. Run `npm install` to ensure all dependencies are installed
2. Run `npm run test` to see current test status
3. Run `npm run build` to verify the build works
4. Read `handoff/CODEX_OPTIMIZE_PROMPT.md` for specific optimization tasks
5. Start with UI polish (the most impactful quick win)
6. Then improve test coverage
7. Then optimize build/packaging

## Codex: What NOT to Do

- Do NOT rebuild the project from scratch
- Do NOT change the storage strategy (JSON → SQLite) without discussion
- Do NOT remove the Shared Memory Hub
- Do NOT delete the handoff/ directory
- Do NOT modify the Electron security settings (contextIsolation, nodeIntegration)
- Do NOT expose arbitrary command execution via IPC
- Do NOT remove the secret redaction system
- Do NOT disable TypeScript strict mode
- Do NOT change the UI framework (stay with React + Tailwind)
- Do NOT add cloud dependencies to core features
