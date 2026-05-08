# AgentFlow Studio

**Local AI Project Orchestration Hub** — for Claude Code, Codex, Cursor, and beyond.

AgentFlow Studio is a desktop application that manages the complete lifecycle of AI-assisted software projects. It turns project ideas into structured plans, prompts, tasks, and memories that persist across AI tools and models.

## Features

- **Project Planner** — Turn ideas into PRD, architecture, task breakdown, test plans, and AI-ready dev prompts
- **Prompt Lab** — 13 built-in prompt templates with variable filling and shared memory injection
- **Log Analyzer** — Identify 15+ common dev errors and get fix suggestions with ready-to-use AI prompts
- **Safety Box** — Check shell commands for 20+ dangerous patterns before execution
- **Git Timeline** — Browse commit history with visual timeline
- **Shared Memory Hub** — Persistent, cross-model project context that survives tool/model switches
- **Skills Manager** — Built-in agent skills for planning, UI polish, testing, releases, safety, and memory curation
- **Settings & Providers** — Configure multiple AI providers with per-provider memory injection settings
- **Export System** — Export to Markdown and JSON with automatic secret redaction

## Installation

```bash
git clone <repo-url>
cd AgentFlowStudio
npm install
```

Requirements: Node.js 18+, npm 9+

## Development

```bash
npm run dev        # Start Vite + Electron in development mode
```

The app opens an Electron window at 1400x900. React hot-reloads on changes; Electron restarts on main process changes.

## Testing

```bash
npm run test       # Run unit tests (Vitest)
npm run test:e2e   # Run E2E tests (requires Playwright browsers)
npm run typecheck  # TypeScript type checking
npm run lint       # ESLint
```

## Building

```bash
npm run build      # Build Vite + compile main process TypeScript
npm run dist       # Build + package with electron-builder (NSIS on Windows)
```

## Desktop Shortcut

```bash
npm run shortcut   # Create desktop shortcut (PowerShell script)
```

## Static Fallback / 静态可交付模式

If Electron or Vite is blocked by local environment restrictions, use the verified static launcher:

```bat
D:\AgentFlowStudio\start-agentflow-static.bat
```

The Desktop shortcut `AgentFlow Studio.lnk` currently points to this launcher. It starts a pure Node static server, serves `static-app`, opens the browser, and keeps the console open so startup errors remain visible. The fallback UI is Chinese-first and includes 仪表盘、项目管理、项目详情、提示词实验室、日志分析、安全检查、共享记忆中心、设置.

Verification:

```bash
npm.cmd run smoke
npm.cmd run test:launch-static
```

## Data Storage

All data is stored locally in the Electron `userData` directory:

```
%APPDATA%/agentflow-studio/agentflow-data/
  projects.json
  tasks.json
  prompts.json
  memories.json
  runs.json
  riskChecks.json
  providerSettings.json
  settings.json
```

No data is ever uploaded to cloud services. All processing is local.

## Shared Memory Hub

The Shared Memory Hub is the core differentiator of AgentFlow Studio. It maintains a local memory database that persists across:

- Different AI models (Claude, GPT, DeepSeek, etc.)
- Different AI tools (Claude Code, Codex, Cursor, etc.)
- Different API providers (OpenAI, Anthropic, custom endpoints)

Memories are automatically injected into generated prompts based on configurable injection modes (off/minimal/balanced/full).

### Memory Types
- `user_preference` — UI style, naming conventions, workflow preferences
- `project_context` — Project background, goals, current phase
- `decision` — Architecture decisions with rationale
- `issue_fix` — Recurring bugs and their solutions
- `api_provider` — Provider configuration patterns (keys redacted)
- `prompt_pattern` — Effective prompt templates discovered in practice
- `environment` — Dev environment setup notes

### Safety
- All API keys, tokens, and passwords are automatically redacted
- Imported memories are scanned for secrets
- Exports have secrets redacted
- No cloud upload — local only

## Codex Handoff

When handing this project to Codex for optimization:

1. Codex should first read `AGENTS.md`
2. Then read ALL files in `handoff/` directory
3. Then explore `src/` and `tests/`
4. Use `handoff/CODEX_OPTIMIZE_PROMPT.md` as the primary optimization instruction

See `handoff/` directory for the complete handoff package.

## Tech Architecture

```
┌──────────────────────────────────┐
│        Electron Main Process      │
│  ┌──────┐ ┌──────┐ ┌──────────┐  │
│  │Storage│ │  Git │ │FileSystem│  │
│  └──────┘ └──────┘ └──────────┘  │
│  ┌──────┐ ┌──────┐ ┌──────────┐  │
│  │Security│ │Shortcut│ │  IPC   │  │
│  └──────┘ └──────┘ └──────────┘  │
├──────────────────────────────────┤
│         contextBridge (preload)    │
├──────────────────────────────────┤
│       React Renderer Process      │
│  ┌─────────────────────────────┐  │
│  │   Pages (10 routes)         │  │
│  ├─────────────────────────────┤  │
│  │   Components (15 reusable)  │  │
│  ├─────────────────────────────┤  │
│  │   Lib (12 pure logic mods)  │  │
│  └─────────────────────────────┘  │
└──────────────────────────────────┘
```

## Roadmap

- [x] Phase 1: Core app with all pages, planning, prompts, safety, git, memory hub
- [ ] Phase 2 (Codex): UI polish, test coverage, performance optimization, packaging
- [ ] Phase 3: SQLite storage adapter, plugin system, cloud sync (optional, encrypted)

## Common Issues

| Issue | Solution |
|-------|----------|
| `electron-builder` fails | Check `assets/icon.ico` exists |
| `better-sqlite3` build error | Not used in v1 — JSON storage is default |
| Playwright browser missing | `npx playwright install chromium` |
| Path with Chinese characters | Move project to ASCII-only path |
| PowerShell execution policy | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |

## License

MIT
