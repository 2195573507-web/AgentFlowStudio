# AgentFlow Studio Codex Findings

## Initial Repository State

- Current branch at handoff start: `master`; new branch created: `codex-optimization`.
- Git history contains six Claude Code baseline commits ending at `014df2c chore: add package-lock.json`.
- Worktree was clean before Codex edits, so the requested baseline capture commit was skipped as an empty commit.

## Files and Feature Surface

- Source tree includes Electron main/preload/IPC/storage/security/git/file helpers, 10 renderer routes, reusable UI components, pure logic libs, shared types, unit and E2E tests, scripts, assets, demo data, handoff docs, and six local skills.
- Important pages exist: Dashboard, Projects, ProjectDetail, PromptLab, LogAnalyzer, SafetyBox, GitTimeline, SharedMemoryHub, Skills, Settings.
- Shared Memory Hub support files exist: `memoryStore.ts`, `memoryRetriever.ts`, `memoryInjection.ts`, `secretRedaction.ts`, and `SharedMemoryHub.tsx`.

## First Verification Results

- `npm.cmd install`: pass.
- `npm.cmd run typecheck`: failed with many type/API mismatches between shared types, renderer routes, components, and preload wrapper.
- `npm.cmd run lint`: failed because ESLint config is missing.
- `npm.cmd run test`: failed before running tests due esbuild `spawn EPERM`.
- `npm.cmd run build`: failed before build due esbuild `spawn EPERM`.

## Key Code Findings

- App routes and sidebar/dashboard links use different route names. App registers `/prompt-lab`, `/git-timeline`, `/safety-box`, `/shared-memory-hub`; navigation uses `/prompts`, `/git`, `/safety`, `/memory`.
- Renderer API wrapper expects flat preload method names while the actual preload exposes nested objects. This can make real Electron data unavailable even when IPC exists.
- Shared types are narrower than the renderer feature implementation: legacy prompt fields (`name`, `templateId`, `variables`, `starred`), memory categories (`knowledge`, `security`, `git_summary`, etc.), lower-case risk levels, and UI metadata fields are used by routes.
- Component props are narrower than page usage, especially `Modal.open`, `GlassCard.onClick`, `StatCard.color/onClick`, and `TaskBoard.projectId`.
- Playwright package is installed as `playwright`, not `@playwright/test`; E2E imports need compatibility or dependency update.
