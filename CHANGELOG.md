# Changelog

## [Unreleased] - 2026-05-10

### Added
- Added workflow template metadata for category, difficulty, risk level, beginner recommendation, and human approval.
- Added Prompt Lab workflow search/filter controls and a knowledge retrieval node type.
- Added run log serialization utilities, redacted run copy/export, quality checklist, and retry advice.
- Added GitTimeline release-status snapshot labeling so parsed report data is not confused with fresh test execution.

### Fixed
- Redacted copied/exported run fields including summary, error, raw log, node input/output summaries, and failure reasons.
- Updated E2E onboarding assertion to current UI text: `查看结果和日志`.
- Hardened short `sk-` leak marker redaction, clipboard redaction, legacy memory read redaction, Shared Memory import normalization, and large-log handling.
- Hardened IPC sender origin validation, localhost-only dev server URLs, and skill realpath checks.
- Fixed duplicate React key risks in GitTimeline and SharedMemoryHub repeated values.

### Changed
- Moved workflow template filtering into `src/renderer/lib/templates.ts`.
- Moved run log parsing/serialization/checklist logic into `src/renderer/lib/runLogs.ts`.
- Unified workflow template types through `src/shared/types.ts`.

### Validation
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
