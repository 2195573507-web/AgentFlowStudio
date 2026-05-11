# AGENTS.md - AgentFlow Studio

## Project Summary

AgentFlow Studio is a local desktop application that serves as an AI project orchestration hub. It helps developers manage the full lifecycle of AI-assisted coding projects: from idea to PRD, task breakdown, prompt generation, log analysis, safety checking, git timeline, shared memory management, and cross-model context recovery.

Built with Electron + React + TypeScript + Vite + Tailwind CSS.

## Tech Stack

- **Runtime**: Electron 33, Node.js 24
- **Frontend**: React 18, TypeScript 5.7
- **Build**: Vite 6, vite-plugin-electron
- **Styling**: Tailwind CSS 3.4, lightweight flat desktop-tool design
- **Charts**: ECharts 5
- **Icons**: lucide-react
- **Git**: simple-git
- **Testing**: Vitest (unit), Playwright (E2E)
- **Packaging**: electron-builder
- **Storage**: JSON file-based (with adapter interface for future SQLite)

## Directory Structure

```
src/main/       - Electron main process (index, preload, ipc, storage, git, filesystem, shortcut, security)
src/renderer/   - React renderer (App, routes/, components/, lib/)
src/shared/     - Shared TypeScript types and IPC channel definitions
tests/          - Unit tests (unit/) and E2E tests (e2e/)
scripts/        - Build and maintenance scripts
handoff/        - Codex handoff documentation package
.agents/skills/ - Local AI agent skill definitions
assets/         - Application icons
data/           - Demo data and seed files
```

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server with Electron
npm run build        # Build for production
npm run typecheck    # TypeScript type checking
npm run lint         # ESLint check
npm run format       # Prettier formatting
npm run test         # Run unit tests (Vitest)
npm run test:e2e     # Run E2E tests (Playwright)
npm run icon         # Generate app icons
npm run shortcut     # Create desktop shortcut
npm run verify       # Verify build completeness
npm run dist         # Package for distribution
```

## Electron Security Rules

1. **contextIsolation: true** - Always. Never set to false.
2. **nodeIntegration: false** - Always. Renderer has no direct Node access.
3. **Preload only** - All native operations go through preload.ts via contextBridge.
4. **IPC for everything** - File I/O, git, shortcuts, exports, storage - all via IPC handlers.
5. **No arbitrary command execution** - Never expose child_process.exec via IPC.
6. **Path sanitization** - All file paths go through security.sanitizeFilePath().
7. **Script safety** - create-shortcut.ps1 only creates project-specific shortcuts.

## Shared Memory Hub Rules

1. **Local only** - All memories stored locally in userData. Never uploaded.
2. **Secret redaction** - API keys, tokens, passwords are automatically redacted before storage.
3. **No key storage** - apiKey field in ProviderSettings is masked; never save raw keys to memory.
4. **Import safety** - Imported JSON memories are scanned for secrets; secret-only entries are skipped.
5. **Export redaction** - Exported memories have all secrets redacted.
6. **Status workflow** - pending → active (confirmed) or archived (rejected).

## API Key Security Rules

1. Never hardcode API keys in source code.
2. Provider apiKey is masked in UI (show only last 4 chars).
3. apiKey is stored locally but marked as sensitive.
4. .gitignore includes .env and .env.local.
5. Never write keys to memory or export files.
6. Secrets detection patterns: sk-..., Bearer, api_key=, password=, secret=, access_token=, refresh_token=.

## UI Conventions

- **Design language**: lightweight flat desktop tool, inspired by compact CCS / cc-switch style principles
- **Colors**: Use CSS variables (--bg-primary, --surface, --border, --text-primary, --accent, etc.)
- **Cards**: Use the SurfaceCard component and solid surface/border layers
- **Buttons**: Use Button component with variant/size props
- **States**: Every data page must handle loading, empty, error, and data states
- **Dark mode**: Use dark class on html element, CSS variables handle the rest
- **Charts**: Use Charts component (TaskStatusChart, MemoryTypeChart) for data viz
- **Icons**: Use lucide-react exclusively
- **Animations**: Keep only subtle hover/focus/loading feedback; avoid decorative transitions

## Git Commit Conventions

```
feat:     New feature
fix:      Bug fix
docs:     Documentation only
style:    UI/style changes
refactor: Code refactoring
test:     Test additions/updates
chore:    Build, config, dependencies
build:    Build system changes
```

## Claude Code Development Flow

1. Read AGENTS.md first
2. Read handoff/ directory for context
3. Explore src/ and tests/ to understand current state
4. Make changes following the security and UI rules above
5. Run `npm run typecheck` after changes
6. Run `npm run test` after changes
7. Run `npm run build` to verify build
8. Update handoff/TEST_REPORT.md with results
9. Commit with appropriate message format

## Codex Handoff Flow

1. Read AGENTS.md
2. Read ALL files in handoff/ directory
3. Read README.md and package.json
4. Explore src/ structure
5. Run `npm install && npm run test && npm run build`
6. Read TEST_REPORT.md for known issues
7. Read CODEX_OPTIMIZE_PROMPT.md for specific optimization instructions
8. DO NOT rebuild the project from scratch
9. DO NOT change the storage strategy without discussion
10. DO NOT remove Shared Memory Hub

## Post-Change Checklist

After any code change, run:

```bash
npm run typecheck     # Must pass
npm run test          # Must pass (or known failures documented)
npm run build         # Must pass
```

If changing UI:
- Check light AND dark mode
- Check loading, empty, error states
- Check at 1024x680 minimum size
