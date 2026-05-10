# AgentFlowStudio Rebuild Progress

## 2026-05-10

- Created branch `codex-rebuild-from-mainline`.
- Spawned four explorer sub-agents for competitor study, security review, UI review, and test review.
- Read planning/test/safety skills. `ralph-loop` was available from `.agents`, not from the `.codex/.system` path.
- Collected git baseline: remote, branch, recent commits, dirty worktree.
- Ran `npm.cmd install`: passed, with npm audit reporting 17 vulnerabilities from dependency tree.
- Ran `npm.cmd test`: passed, 23 files and 174 tests.
- Ran `npm.cmd run build`: passed, with non-fatal Vite warnings.
- Started persistent planning files and build journey.
- Added workflow shared types, templates, runtime, IPC handlers, preload bridge, renderer API, `/workflows` route, and runtime tests.
- Fixed memory context ACL filtering and config import/export privilege gaps from security review.
- Ran `npm.cmd run typecheck`: passed after resolving workflow template type conflicts.
- Fixed E2E selectors and mocks for clean workflow mainline coverage.
- Ran `npm.cmd run test:e2e`: passed, 16/16 Playwright tests.
- Ran final quality gates: `npm.cmd run typecheck` PASS, `npm.cmd test` PASS (24 files / 177 tests), `npm.cmd run build` PASS, `npm.cmd run lint` PASS (0 errors / 25 warnings).
- Confirmed `npm.cmd run test:unit` and `npm.cmd run test:integration` scripts are absent.
- Updated BUILD_JOURNEY, PROJECT_PROGRESS, TEST_REPORT, and HUMAN_SIMULATION_TEST_REPORT with final validation.
- Resumed interrupted launcher/auth-bridge recovery for `019e109c-7293-7e81-9c09-976bf9125f93`.
- Changed `start-agentflow.bat` to launch the built Electron shell directly with `AGENTFLOW_LOAD_DIST=1`, so the desktop shortcut no longer opens the web fallback path.
- Changed Electron preload packaging to keep Vite's generated preload output and build it as CommonJS, preventing `tsc` from overwriting `dist-electron/main/preload.js` with an ESM file that Electron did not expose through `contextBridge`.
- Added `npm.cmd run test:electron-auth-bridge`, which starts the built Electron app with project-local userData and requires `window.agentflow.auth.login` to exist.
- Resumed verification: `npm.cmd run typecheck` PASS, `npm.cmd test` PASS (24 files / 177 tests), `npm.cmd run build` PASS, `npm.cmd run lint` PASS (0 errors / 25 warnings), `npm.cmd run verify` PASS (100 build checks and 184 smoke checks), `npm.cmd run test:electron-startup` PASS, `npm.cmd run test:electron-auth-bridge` PASS.
