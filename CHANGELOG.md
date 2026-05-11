# Changelog

## [Unreleased] - 2026-05-10

### Added
- Completed the LocalAI Nexus Iteration 0-12 roadmap with first-class Provider Hub, Token Center, Health Monitor, Model Router, Local Gateway, Runtime Switcher, Diagnostics, Agent Studio, Security Center, Ecosystem, Shared Memory, Git/Handoff, Admin, and Settings surfaces.
- Added CI-safe mock provider/gateway coverage, OpenAI-compatible non-streaming gateway path, router decision traces, runtime export formats, context-pack preview, security report surfaces, and local skill/template bundle registry behavior.
- Added `docs/LOCALAI_NEXUS_ITERATION_PLAN.md` and `docs/LOCALAI_NEXUS_NEXT_ITERATION_PLAN.md` to record the completed roadmap and next-stage milestones.
- Added local authentication with PBKDF2 password hashing, persistent opaque sessions, secure logout, failed-login lockout, and forced default-admin password rotation.
- Added admin user management for listing users, creating users, changing roles, enabling/disabling users, and resetting passwords with one-time random temporary passwords.
- Added RBAC policy enforcement across renderer routes and Electron IPC channels, including admin-only user/audit operations and provider write restrictions.
- Added redacted audit logging for login, failed login, logout, password change, admin operations, permission denial, export, and security events.
- Added admin audit UI with search, security-event summary, and redacted audit export.
- Added workflow template metadata for category, difficulty, risk level, beginner recommendation, and human approval.
- Added Prompt Lab workflow search/filter controls and a knowledge retrieval node type.
- Added run log serialization utilities, redacted run copy/export, quality checklist, and retry advice.
- Added GitTimeline release-status snapshot labeling so parsed report data is not confused with fresh test execution.

### Fixed
- Fixed long-run stability testing so authenticated static launch URLs reuse the tokenized `AGENTFLOW_STATIC_LAUNCH_URL` instead of losing the auth token.
- Fixed LocalAI Nexus provider/runtime type exports and storage collection coverage for new bundle and service surfaces.
- Redacted copied/exported run fields including summary, error, raw log, node input/output summaries, and failure reasons.
- Updated E2E onboarding assertion to current UI text: `查看结果和日志`.
- Hardened short `sk-` leak marker redaction, clipboard redaction, legacy memory read redaction, Shared Memory import normalization, and large-log handling.
- Hardened IPC sender origin validation, localhost-only dev server URLs, and skill realpath checks.
- Fixed duplicate React key risks in GitTimeline and SharedMemoryHub repeated values.

### Changed
- Cleaned the active repository structure by deleting ignored regenerable build/test/log artifacts and moving historical rebuild/refactor/parallel-agent documents into `archive/2026-05/`.
- Added cleanup documentation at `docs/cleanup/cleanup-review.md` and `docs/cleanup/cleanup-report.md`.
- Updated smoke, verify, and E2E coverage to check the new LocalAI Nexus routes, IPC/preload/API surfaces, gateway/router/runtime/security/context/bundle surfaces, and required next-stage plan file.
- Reconciled active progress, handoff, architecture, worklog, and test-report docs so Completed / In progress / Planned / Environment-limited statuses are explicit.
- Login is now the public entry point, with authenticated app routes rendered behind a protected Liquid Glass shell.
- Renderer API calls now attach an opaque session envelope through preload; authorization is still decided only in the main process.
- Replaced the renderer i18n table with a clean UTF-8 translation map for nav/admin labels.
- Moved workflow template filtering into `src/renderer/lib/templates.ts`.
- Moved run log parsing/serialization/checklist logic into `src/renderer/lib/runLogs.ts`.
- Unified workflow template types through `src/shared/types.ts`.

### Validation
- `npm.cmd run typecheck`: PASS.
- `npm.cmd run lint`: PASS, warnings under threshold.
- `npm.cmd run test`: PASS, 25 files / 185 tests.
- `npm.cmd run smoke`: PASS, 213/213.
- `npm.cmd run verify`: PASS, 131/131 plus smoke 213/213.
- `npm.cmd run build`: PASS, Vite chunk/dynamic import warnings only.
- `npm.cmd run test:e2e`: PASS, 17/17.
- `npm.cmd run test:static-browser`: PASS.
- `npm.cmd run test:launch-static`: PASS.
- `npm.cmd run test:electron-startup`: PASS.
- `npm.cmd run test:electron-auth-bridge`: PASS.
- `npm.cmd run test:long-run`: PASS.
- `npm.cmd run shortcut`: PASS.
- Shortcut COM inspection: PASS.
- Gateway HTTP smoke: PASS for `/health`, `/v1/models`, `/v1/chat/completions`, `/v1/responses`, `/responses`, and `/v1/messages`.
- `npm.cmd run dist`: ENV-LIMITED after successful build; electron-builder could not download Electron `v33.4.11` Windows zip from GitHub due network timeout / `ERR_ELECTRON_BUILDER_CANNOT_EXECUTE`.
- `npm.cmd run typecheck`: PASS.
- `npm.cmd run test`: PASS, 16 files, 149 tests.
- `npm.cmd run test:e2e`: PASS, 14/14.
- `npm.cmd run lint`: PASS, 0 errors / 21 warnings under threshold.
- `npm.cmd run build`: PASS, existing Charts chunk-size warning plus api dynamic-import note.
- `npm.cmd run smoke`: PASS, 168/168.
- `npm.cmd run test -- templates safety theme apiRuns runLogs utils secretRedaction`: PASS, 72/72.
- `npm.cmd run typecheck`: PASS.
- `npm.cmd run smoke`: PASS, 157/157.

## [1.1.1] - 2026-05-09 15:21 +08:00

### Branch and Version
- Branch: `codex-static-quality-pass`
- Starting commit: `97e37f7473f67a6ac41d25f2ac1f5f3e4200f691`
- Final commit: `v1.1.1 tag target / release HEAD`
- Tag: `v1.1.1` pushed
- Push status: branch and tag pushed to GitHub

### Changed
- Added a continuation stability record after the `v1.1.0` release.
- Bumped package, lockfile, and `VERSION` from `1.1.0` to `1.1.1`.
- Updated handoff progress and final summary so the continuation state is recoverable after terminal or context loss.

### Validation
- `npm.cmd run test:long-run`: PASS, 30.04 minutes, 31 samples, no console errors, page errors, network failures, crashes, or heap growth.
- `npm.cmd run typecheck`: PASS
- `npm.cmd run lint`: PASS with 36 existing warnings and 0 errors
- `npm.cmd run smoke`: PASS 117/117
- `npm.cmd run verify`: PASS 99/99 plus smoke 117/117
- `npm.cmd run test`: PASS 109/109
- `npm.cmd run build`: PASS with existing Charts chunk-size warning only
- `npm.cmd run test:launch-static`: PASS
- `npm.cmd run test:static-browser`: PASS
- `npm.cmd run test:e2e`: PASS 5/5
- `npm.cmd run test:electron-startup`: PASS
- Visited pages: Dashboard, Projects, Prompt Lab, Log Analyzer, SafetyBox, Shared Memory Hub, Settings.
- Result file: `D:\AgentFlowStudio\.codex-parallel\results\long-run-static-20260509065035.json`

### Push
- GitHub branch push: complete (`codex-static-quality-pass`)
- GitHub tag push: complete (`v1.1.1`)

## [1.1.0] - 2026-05-09 14:05 +08:00

### Branch and Version
- Branch: `codex-static-quality-pass`
- Starting commit: `fb442d686b21c993887c0d60c5c3a3a107d21d5d`
- Final commit: `v1.1.0 tag target / release HEAD`
- Tag: `v1.1.0` pushed
- Push status: branch and tag pushed to GitHub

### Fixed
- Fixed Electron production startup by replacing ESM-unsafe `__dirname` usage in the main process.
- Added project-local Electron startup smoke support with `AGENTFLOW_USER_DATA_DIR`, keeping test data under `.codex-parallel`.
- Fixed Dashboard crashes from rendering lucide `forwardRef` icon objects as raw React children.
- Hardened main-process storage/provider/memory/export IPC secret redaction and provider API-key masking.
- Fixed Prompt Lab duplicate branch lint failure.
- Kept the static launcher on the explicit `static-app 4173` entry path.

### Added
- Added Playwright E2E wrapper using project-local `.codex-parallel/ms-playwright` browsers.
- Added static browser smoke coverage for navigation, persistence, redaction, console errors, layout, and Liquid Glass blur.
- Added Electron startup smoke test.
- Added 30-minute static fallback long-run stability test with HTTP, page navigation, error, process, and heap sampling.
- Added a beginner-friendly Dashboard onboarding path and unified mixed Chinese/English font stack.
- Added recoverable handoff files: `current-progress.md`, `validation-report.md`, `long-run-test-log.md`, and `final-summary.md`.

### Validation
- `npm.cmd run typecheck`: PASS
- `npm.cmd run lint`: PASS with 36 existing warnings and 0 errors
- `npm.cmd run smoke`: PASS
- `npm.cmd run verify`: PASS
- `npm.cmd run test`: PASS
- `npm.cmd run build`: PASS
- `npm.cmd run test:launch-static`: PASS
- `npm.cmd run test:static-browser`: PASS
- `npm.cmd run test:e2e`: PASS 5/5
- `npm.cmd run test:electron-startup`: PASS
- 30-minute long-run static fallback: PASS, 31 samples, no console errors, page errors, network failures, crashes, or heap growth.

### Push
- GitHub branch push: complete (`codex-static-quality-pass`)
- GitHub tag push: complete (`v1.1.0`)

## [1.0.0] - 2026-05-07

### Added
- Initial release of AgentFlow Studio
- Project Planner: idea 鈫?PRD 鈫?architecture 鈫?tasks 鈫?prompts
- Prompt Lab with 13 built-in templates and variable filling
- Log Analyzer detecting 15+ common development errors
- Safety Box checking 20+ dangerous command patterns
- Git Timeline with commit history visualization
- Shared Memory Hub for cross-model context persistence
- Memory injection into prompts (minimal/balanced/full modes)
- Skills manager with 6 built-in agent skills
- Settings page with theme, AI provider, and memory configuration
- Multi-provider support with OpenAI-compatible API
- Export to Markdown and JSON with secret redaction
- Apple Liquid Glass UI design system
- Dark mode support
- Desktop shortcut creation
- Electron security: contextIsolation, no nodeIntegration, IPC-only native access
- Demo data seeding on first launch
- Complete Codex handoff documentation package
- Unit tests for planner, templates, log analyzer, safety rules, exporters, memory store, memory retriever, memory injection, and secret redaction
- E2E test suite with Playwright
- Build verification script
