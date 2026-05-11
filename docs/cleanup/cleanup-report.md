# Cleanup Report

Date: 2026-05-11
Workspace: `D:\AgentFlowStudio`
Branch: `refactor-localai-nexus`

## Scope

Clean and reorganize the repository in place without creating folders outside `D:\AgentFlowStudio`.

## Pre-Cleanup Scan

Checked before moving or deleting files:

- `AGENTS.md`, `README.md`, `package.json`, `PROJECT_PROGRESS.md`, and all active files under `handoff/`.
- Package scripts, Vite/Electron config, TypeScript config, Playwright config, launchers, shortcut scripts, smoke/verify scripts, and Electron IPC release-status readers.
- Source/test references using PowerShell and Git because `rg.exe` was blocked by Windows access control in this shell.

## Deleted

Deleted only ignored, regenerable build/test/log artifacts:

- `logs/`
- `dist/`
- `dist-electron/`
- `release/`
- `.codex-parallel/playwright-report/`
- `.codex-parallel/test-results/`
- `.codex-parallel/port-locks/`
- `.codex-parallel/npm-cache/`
- `.codex-parallel/electron-user-data-smoke/`
- `.codex-parallel/electron-auth-bridge-user-data/`
- `.codex-parallel/gateway-smoke-user-data/`
- `.codex-parallel/gateway-smoke-user-data-direct/`
- `.codex-parallel/write-probe-20260508200135/`
- `.codex-parallel/*.log`

## Moved

Moved historical material inside the repository:

| From | To |
|---|---|
| `docs/COMPETITOR_MAINLINE_REBUILD_STUDY.md` | `archive/2026-05/docs-history/COMPETITOR_MAINLINE_REBUILD_STUDY.md` |
| `docs/REBUILD_ARCHITECTURE_PLAN.md` | `archive/2026-05/docs-history/REBUILD_ARCHITECTURE_PLAN.md` |
| `docs/SECURITY_REBUILD_REVIEW.md` | `archive/2026-05/docs-history/SECURITY_REBUILD_REVIEW.md` |
| `docs/SECURITY_SANDBOX_CLEANUP.md` | `archive/2026-05/docs-history/SECURITY_SANDBOX_CLEANUP.md` |
| `docs/LOCALAI_NEXUS_REFACTOR_PLAN.md` | `archive/2026-05/docs-history/LOCALAI_NEXUS_REFACTOR_PLAN.md` |
| `handoff/FULL_PROJECT_REBUILD_CONTEXT.md` | `archive/2026-05/handoff-history/FULL_PROJECT_REBUILD_CONTEXT.md` |
| `handoff/FULL_REBUILD_HANDOFF.md` | `archive/2026-05/handoff-history/FULL_REBUILD_HANDOFF.md` |
| `handoff/HUMAN_SIMULATION_TEST_REPORT.md` | `archive/2026-05/handoff-history/HUMAN_SIMULATION_TEST_REPORT.md` |
| `handoff/NEXT_ROUND_SUGGESTIONS.md` | `archive/2026-05/handoff-history/NEXT_ROUND_SUGGESTIONS.md` |
| `handoff/archived-agents/` | `archive/2026-05/parallel-agents/handoff-archived-agents/` |
| `task_plan.md` | `archive/2026-05/root-progress/localai-nexus-iteration-0-12/task_plan.md` |
| `progress.md` | `archive/2026-05/root-progress/localai-nexus-iteration-0-12/progress.md` |
| `findings.md` | `archive/2026-05/root-progress/localai-nexus-iteration-0-12/findings.md` |

## Kept

Kept active source, scripts, tests, assets, static fallback, `.agents/skills/`, active handoff package, `README.md`, `PROJECT_PROGRESS.md`, and root package/config files because they are directly referenced by build, runtime, tests, smoke checks, or shortcut flows.

## Validation

Cleanup closeout validation completed on 2026-05-11 after the archive moves and ignored-artifact cleanup.

| Check | Result | Notes |
|---|---:|---|
| `npm.cmd install` | PASS | Dependencies were already up to date. `npm audit` still reports 17 known dependency advisories, so no forced dependency upgrade was applied during cleanup. |
| `npm.cmd run lint` | PASS | 0 errors / 21 warnings, within the configured threshold. |
| `npm.cmd run typecheck` | PASS | TypeScript check passed. |
| `npm.cmd run test` | PASS | 25 test files / 185 tests passed. |
| `npm.cmd run build` | PASS | Renderer and Electron builds passed; Vite chunk warnings are non-fatal. |
| `npm.cmd run smoke` | PASS | 213/213 smoke checks passed. |
| `npm.cmd run verify` | PASS | 131/131 build verification checks plus smoke 213/213 passed. |
| `npm.cmd run test:e2e` | PASS | 17/17 Playwright E2E tests passed. |
| `npm.cmd run test:static-browser` | PASS | Static fallback browser smoke passed, including responsive overflow checks. |
| `npm.cmd run test:launch-static` | PASS | Static launcher smoke passed. |
| `npm.cmd run test:electron-startup` | PASS | Electron startup reached the ready marker. |
| `npm.cmd run test:electron-auth-bridge` | PASS | Built renderer exposed the secure `window.agentflow` bridge. |
| `npm.cmd run scan:mojibake` | PASS | 162 files checked; 3 legacy docs remain allowlisted. |
| `npm.cmd run shortcut` | PASS | Recreated `C:\Users\至亲\Desktop\LocalAI Nexus.lnk`. |
| Shortcut COM inspection | PASS | Target, arguments, working directory, and icon point to the latest built Electron entry. |
| Direct Gateway HTTP smoke | PASS | Built Electron app served `/health`, `/v1/models`, `/v1/chat/completions`, `/v1/responses`, `/responses`, and `/v1/messages` on `127.0.0.1:8317`. |
| `npm.cmd run dist` | ENV-LIMITED | Build passed and `release/win-unpacked/LocalAI Nexus.exe` was produced, but electron-builder/app-builder did not finish before the 15-minute verification timeout. Residual packaging processes were stopped. |

Latest shortcut state:

```text
C:\Users\至亲\Desktop\LocalAI Nexus.lnk
TargetPath: D:\AgentFlowStudio\node_modules\electron\dist\electron.exe
Arguments: "D:\AgentFlowStudio\dist-electron\main\index.js"
WorkingDirectory: D:\AgentFlowStudio
IconLocation: D:\AgentFlowStudio\assets\localai-nexus.ico,0
```
