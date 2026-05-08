# AgentFlow Studio Localized Static Launcher Repair Plan

## Goal

Make `D:\AgentFlowStudio` double-click launch reliably through a localized Static fallback app, independent of Vite/Electron/esbuild, and verify it with real HTTP, launcher, shortcut, and documentation updates.

## Current Session Phases

| Phase | Status | Notes |
|---|---|---|
| 1. Reset stale parallel agents | complete | Old `.codex-parallel` archived to `handoff\archived-agents\run-20260508-125051`; clean `.codex-parallel\logs` created. |
| 2. Start new parallel checks | complete | Agents A-F completed; Agent G reporter work handled in main thread due subagent limit. |
| 3. Repair static launcher/server | complete | Launcher now runs Node directly; server is pure Node HTTP with logging, fallback root selection, port retry, browser open, and exception capture. |
| 4. Build Chinese static fallback app | complete | `static-app/index.html`, `app.js`, `styles.css`, and `assets/icon.svg` created with localStorage-backed workflows. |
| 5. Fix desktop shortcut and icon flow | complete | Shortcut targets `start-agentflow-static.bat`; icon regenerated and verified. |
| 6. Runtime verification | complete | `icon`, `smoke`, `test:launch-static`, `shortcut`, COM verification, real bat launch, and HTTP checks passed. |
| 7. Handoff and commit | complete | Handoff docs and parallel summary updated; this repair is ready for git commit. |

## Acceptance Checklist

- Clean `.codex-parallel` with new logs: complete.
- `start-agentflow-static.bat` does not flash-close and logs to `logs\launcher-static.log`: complete.
- `scripts\static-server.js` is pure Node HTTP, logs, falls back to `static-app`, switches ports, opens browser, and stays alive: complete.
- `static-app` exists, is Chinese-first, and exposes core AgentFlow Studio workflows: complete.
- Desktop shortcut exists and targets `D:\AgentFlowStudio\start-agentflow-static.bat`: complete.
- `npm.cmd run test:launch-static` passes: complete outside sandbox.
- Real HTTP response is 200 and includes AgentFlow Studio plus Chinese navigation keywords: complete.
- Handoff docs and `.codex-parallel\PARALLEL_SUMMARY.md` reflect this session: complete.
- Git commit exists for this repair: complete.

## Errors Encountered

| Error | Resolution |
|---|---|
| Previous static launcher opened browser before server and delegated to npm script. | Replaced with direct `node scripts\static-server.js` and pause-on-exit behavior. |
| Old static server exited when `dist` was missing. | Made `static-app` first serving root and added auto fallback generation. |
| UTF-8 Chinese batch control text broke in Windows cmd. | Rewrote `start-agentflow-static.bat` with an ASCII-safe command skeleton and kept Chinese UI/logging in Node/static app. |
| Subagent thread limit blocked Agent G. | Main thread completed reporter role and wrote `.codex-parallel\logs\agent-g-reporter.md`. |
