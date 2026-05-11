# Cleanup Review

Date: 2026-05-11
Workspace: `D:\AgentFlowStudio`

The cleanup pass kept these items because deletion or movement was not clearly safe after reference scanning.

## Kept For Functionality

| Path | Reason |
|---|---|
| `.codex-parallel/ms-playwright/` | Project-local Playwright browser cache. `scripts/run-playwright-e2e.js` and `scripts/static-browser-smoke.js` reuse it; deleting it can force a network browser download. |
| `.codex-parallel/results/` | Current smoke/static screenshots and JSON results may still be useful as verification evidence. |
| `.codex-parallel/logs/` | Current Electron/static smoke logs are regenerated, but recent failures and startup evidence may still be useful during this cleanup. |
| `.agents/skills/` | Runtime skill IPC reads `process.cwd()/.agents/skills`, and verification scripts check local skill files. |
| `assets/icon.*` | Compatibility aliases. `scripts/smoke-test.js`, icon generation, and historical static fallback references still expect these files. |
| `start-agentflow-electron.bat`, `start-agentflow-web.bat`, `start-agentflow-static.bat` | Compatibility launchers and fallback paths referenced by scripts and documentation. |
| `static-app/` | Recovery fallback UI used by static smoke and launch-static tests. |

## Kept For Review

| Path | Reason |
|---|---|
| `.codex-parallel/workspaces/AgentFlowStudio-LiquidGlass/` | Contains a nested git checkout with unmerged working-tree changes. It should be reviewed or archived only after confirming no useful changes remain. |
| `docs/excellent-project-learning.md` | Historical learning note, but `scripts/smoke-test.js` still checks it. |
| `handoff/ARCHITECTURE.md`, `handoff/CURRENT_STATUS.md`, `handoff/TASK_BREAKDOWN.md`, `handoff/TASK_STATUS.md` | Active handoff package or checked by verification/smoke scripts. |
| `data/demo.json` | Included by electron-builder extraResources and used by demo/seed tooling. |

## Deferred Decisions

- Decide whether to compact `.codex-parallel/results/` and `.codex-parallel/logs/` after the final cleanup validation is committed.
- Decide whether the nested `.codex-parallel/workspaces/AgentFlowStudio-LiquidGlass/` checkout should be archived, merged, or deleted after a manual diff review.
- Decide whether compatibility assets and launchers can be removed only after updating scripts, smoke checks, docs, and desktop shortcut fallback behavior.
