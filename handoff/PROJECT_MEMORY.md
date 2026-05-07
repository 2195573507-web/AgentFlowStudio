---
name: AgentFlow Studio Project Memory
description: Long-term project memory for AgentFlow Studio — used to inject context when resuming development with any AI model
type: project_context
importance: 5
---

# AgentFlow Studio — Long-Term Project Memory

## Project Identity

**Name**: AgentFlow Studio
**Type**: Local Electron desktop application
**Purpose**: AI project orchestration hub for Claude Code, Codex, Cursor, and other AI coding tools
**Current Version**: 1.0.0 (Phase 1 complete)
**Created**: 2026-05-07
**Last Updated**: 2026-05-07

## Project Positioning

AgentFlow Studio is NOT a simple todo app, not a web dashboard, not a demo project. It is a production-targeted desktop tool that manages the full lifecycle of AI-assisted software development projects.

The core insight is that AI coding tools (Claude Code, Codex, Cursor, etc.) each have their own context window that resets between sessions and cannot be shared across tools. AgentFlow Studio solves this by being the persistent, local source of truth for project context.

## User Preferences

### UI Style
- **Design language**: Apple Liquid Glass + Linear + Raycast
- **Key elements**: Frosted glass backgrounds, backdrop blur, soft shadows, thin subtle borders, compact layouts
- **Typography**: System font stack (-apple-system, BlinkMacSystemFont, Segoe UI, Inter)
- **Dark mode**: Supported and encouraged
- **Avoid**: Heavy gradients, rough/unstyled tables, pure black backgrounds, default browser/Vite templates, "toy" aesthetics
- **Must feel like**: A professional, polished macOS/Windows desktop application

### Development Preferences
- **Language**: TypeScript with strict mode always
- **Code style**: No unnecessary comments, no docstrings on obvious functions, clean and minimal
- **Naming**: camelCase for variables/functions, PascalCase for components/classes
- **File organization**: One component per file, grouped by domain
- **Testing**: Real assertions, no snapshot tests, test behavior not implementation

## Technical Decisions

### Why Electron (not Tauri)
- Tauri has excellent performance but requires Rust toolchain
- Electron has the largest ecosystem and best documentation for AI-assisted development
- Electron's Node.js integration makes local file operations simpler
- The target users are developers who already have Node.js installed
- Security can be adequately addressed with contextIsolation and preload patterns

### Why JSON Local Storage (not better-sqlite3)
- better-sqlite3 requires native compilation (node-gyp) which frequently fails on Windows
- Missing Python, C++ build tools, or Windows SDK are common issues
- JSON files are simple, portable, and human-readable (easy to debug)
- The Storage class uses an adapter pattern — SQLite can be added later as an alternative backend
- For the expected data volume (hundreds of records, not millions), JSON is sufficient

### Why Local-First (no cloud dependency)
- All core features work offline
- No account, no login, no internet required
- Data stays on the user's machine
- API keys stored locally, never transmitted
- Users can use any API provider without the app depending on any specific one
- Privacy: project ideas and code stay local

### Why API Provider Configurable
- Users switch between DeepSeek, GPT, Claude, 豆包,中转 API
- Each provider has different base URLs, models, and limitations
- The app should not be tied to any single provider
- Provider settings include memory injection configuration per provider
- Standard OpenAI-compatible API format means maximum compatibility

### Why Shared Memory Hub
- Core differentiator: context survives model/tool switches
- When switching from Claude Code to Codex, all project context is preserved
- Memories are automatically injected into generated prompts
- Three injection modes (minimal/balanced/full) give users control over context length
- Pending → Active → Archived workflow ensures memory quality
- Secret redaction prevents accidental credential leaks

## Important Constraints

1. **Electron Security**: contextIsolation=true, nodeIntegration=false, preload only, IPC for all native ops
2. **No arbitrary command execution**: Never expose exec/spawn via IPC
3. **Secret redaction**: Automatic on save, import, and export
4. **Local-only storage**: No cloud upload, no telemetry, no analytics
5. **TypeScript strict**: No `any` without good reason, no `@ts-ignore`
6. **UI standards**: Every data page must handle loading, empty, error, and data states
7. **Build must work**: `npm run build` must pass before considering work done

## Prohibited Actions

- Do NOT hardcode API keys or credentials
- Do NOT add cloud dependencies (Firebase, Supabase, etc.) to core features
- Do NOT remove secret redaction
- Do NOT disable TypeScript strict mode
- Do NOT change the storage backend without implementing the adapter
- Do NOT add new IPC channels that expose raw Node.js APIs
- Do NOT remove the handoff/ directory
- Do NOT remove the Shared Memory Hub
- Do NOT rebuild from scratch — iterate on existing code

## Current Status (as of handoff)

Phase 1 is COMPLETE:
- All 10 pages implemented
- All 15 components built
- All 12 lib modules working
- 9 unit test suites passing (or close to passing)
- E2E tests defined
- Handoff documentation complete
- Skills defined
- Build configuration ready

Phase 2 (Codex) needs:
- UI polish and consistency improvements
- Test coverage expansion
- Performance optimization
- Build/packaging fixes (especially icons)
- Playwright E2E setup

## Next Steps for Codex

See `handoff/CODEX_OPTIMIZE_PROMPT.md` for the complete optimization brief.
