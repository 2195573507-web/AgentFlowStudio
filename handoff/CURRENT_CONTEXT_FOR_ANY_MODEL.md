# Current Context — AgentFlow Studio

## Latest Codex Stability State - 2026-05-07

Current deliverable scheme: **Static fallback**.

Use this launcher now:

```bat
D:\AgentFlowStudio\start-agentflow-static.bat
```

The desktop shortcut exists at:

```text
C:\Users\至亲\Desktop\AgentFlow Studio.lnk
```

It points to `D:\AgentFlowStudio\start-agentflow-static.bat` and uses `D:\AgentFlowStudio\assets\icon.ico,0`.

### Verified

- `npm.cmd install`: pass.
- `npm.cmd run icon`: pass.
- `npm.cmd run typecheck`: pass.
- `node_modules\.bin\tsc.cmd -p tsconfig.node.json`: pass.
- `npm.cmd run lint`: pass with warnings only.
- `npm.cmd run smoke`: pass, 53/53.
- `npm.cmd run verify`: pass.
- Static local HTTP smoke: pass, `STATUS=200`, title `AgentFlow Studio`.
- `npm.cmd run shortcut`: pass with Desktop write permission.

### Environment Blocked Here

- `npm.cmd run dev`
- `npm.cmd run dev:web`
- `npm.cmd run test`
- `npm.cmd run build`
- `npm.cmd run build:web`

All fail in this main environment at Vite/Vitest config loading with esbuild `spawn EPERM`. Direct `node_modules\.bin\esbuild.cmd --version` works.

### Next Best Work

1. On a normal Windows shell, rerun `npm.cmd run test` and `npm.cmd run build`.
2. If Electron works there, switch shortcut priority back to Electron or packaged exe.
3. Fix Shared Memory context generation in Prompt Lab / SharedMemoryHub.
4. Add main-process recursive memory redaction.
5. Add route-level ErrorBoundary.

> **Purpose**: Give any AI model (Claude, GPT, DeepSeek, Codex, etc.) enough context to resume working on this project within 5 minutes of reading this file.

## What Is This Project?

**AgentFlow Studio** is a local Electron desktop app for managing AI-assisted software projects. It's like a control center for AI coding workflows.

Tech: Electron + React + TypeScript + Vite + Tailwind CSS + ECharts
Storage: Local JSON files (no database server needed)
Location: `D:\AgentFlowStudio`

## What Does It Do?

1. **Project Planner** — Give it a project idea, get back PRD, architecture, task breakdown, test plan, and AI-ready dev prompts
2. **Prompt Lab** — 13 prompt templates with variable filling and memory injection
3. **Log Analyzer** — Paste error logs, get diagnoses and fix instructions
4. **Safety Box** — Check if a shell command is dangerous before running it
5. **Git Timeline** — Browse git commit history visually
6. **Shared Memory Hub** — Persistent project memory that survives switching between AI tools/models
7. **Skills Manager** — 6 agent skill definitions
8. **Settings** — Theme, AI provider config, data management

## Current State (Phase 1 Complete)

**All source code is written.** Every file, every component, every function has a real implementation. No stubs or TODOs.

What exists:
- 10 React page components (fully implemented)
- 15 reusable UI components
- 12 pure logic modules
- 8 Electron main process files
- 9 unit test suites (107+ test cases)
- 1 E2E test file
- 6 agent skill definitions
- 4 utility scripts
- 8 handoff documentation files
- Demo data for first-launch experience
- All config files (TypeScript, Vite, Tailwind, Electron Builder)

## What Needs to Happen Next

1. **Install dependencies**: `npm install`
2. **Run tests**: `npm run test` (fix any failures)
3. **Verify build**: `npm run build` (fix any type errors)
4. **Test the app**: `npm run dev` (browser through the pages)
5. **UI Polish**: Review all pages for visual consistency
6. **Test coverage**: Add more edge case tests
7. **Icon fix**: Generate proper PNG/ICO from SVG
8. **Package**: `npm run dist` for Windows installer

## Critical Constraints

- **Electron security**: contextIsolation=true, nodeIntegration=false — NEVER change these
- **No cloud dependency**: All core features work offline
- **Secret redaction**: API keys must be redacted before storage/export
- **Shared Memory Hub**: Must be preserved — it's the key differentiator
- **Local storage only**: Data stays in `userData/agentflow-data/`
- **TypeScript strict**: Keep strict mode on

## How to Run

```bash
cd D:\AgentFlowStudio
npm install          # Install dependencies
npm run dev          # Start dev mode (Electron + Vite)
npm run test         # Run unit tests
npm run build        # Build for production
npm run verify       # Check all files present
npm run shortcut     # Create desktop shortcut
```

## Key Files to Read First

1. `AGENTS.md` — Rules and conventions for AI agents
2. `handoff/ARCHITECTURE.md` — Full architecture documentation
3. `handoff/FILE_MAP.md` — Every file and its purpose
4. `handoff/TASK_STATUS.md` — What's done vs. what's not
5. `README.md` — Human-focused documentation

## Known Issues

- Icon PNG/ICO are SVG copies (need proper rasterization)
- Playwright browsers may not be installed (need `npx playwright install chromium`)
- electron-builder may fail on icon until icons are fixed
- E2E tests skip gracefully if dev server isn't running

## What NOT to Do

- Don't rebuild from scratch
- Don't change the storage strategy
- Don't remove the Shared Memory Hub
- Don't disable Electron security features
- Don't add cloud dependencies to core features
- Don't delete the handoff/ directory
- Don't remove secret redaction

## Tech Stack Details

| Layer | Technology | Version |
|-------|-----------|---------|
| Desktop | Electron | 33.x |
| UI | React | 18.x |
| Language | TypeScript | 5.7.x |
| Build | Vite | 6.x |
| CSS | Tailwind CSS | 3.4.x |
| Charts | ECharts | 5.x |
| Icons | lucide-react | 0.487.x |
| Git | simple-git | 3.27.x |
| Tests | Vitest | 2.1.x |
| E2E | Playwright | 1.49.x |
| Package | electron-builder | 25.x |

## Project-Specific Terminology

- **Memory**: A unit of persistent context (project background, decision, fix, preference, etc.)
- **Injection Mode**: How much context to prepend to prompts (off/minimal/balanced/full)
- **Provider**: An AI API configuration (OpenAI-compatible base URL + model)
- **Skill**: A Markdown file defining an agent workflow (.agents/skills/*/SKILL.md)
- **Handoff**: Documentation package for passing the project to another AI developer
