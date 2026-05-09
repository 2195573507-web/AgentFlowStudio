# AgentFlow Studio Static Quality Pass Plan

## Goal

Starting from baseline commit `cec7dfb`, preserve the working Static fallback while hardening language switching, theme preferences, Shared Memory prompt injection, recursive secret redaction, route error handling, tests, and handoff docs.

## Current Session Phases

| Phase | Status | Notes |
|---|---|---|
| 1. Prepare fresh agent workspace | complete | Archived old `.codex-parallel`, recreated A-G task/log files, and kept historical archived agent runs untouched. |
| 2. Agent A regression gate | complete | Required commands, COM shortcut, and real launcher HTTP checks passed; sandbox-only failures were rerun with approval. |
| 3. Parallel enhancement agents | complete | Six true subagents B-G completed read-only audits; Agent A was executed in the main thread. |
| 4. Integrate implementation | complete | Static fallback and React paths were updated without rebuilding or replacing the project. |
| 5. Final verification | complete | Required commands and real launcher HTTP checks passed; test/build remain blocked by esbuild EPERM. |
| 6. Handoff and commit | in_progress | Handoff files and `.codex-parallel\PARALLEL_SUMMARY.md` updated; commit is next. |
| 7. Fix launcher log file locking | complete | Static launcher now uses per-run logs and no longer redirects the long-running server output into `launcher-static.log`; locked legacy log regression passed. |
| 8. Liquid Glass UI and workflow onboarding | complete | React/static glass tokens unified, Dashboard next-step CTA and lifecycle rail added, reports updated, and full validation passed. |
| 9. Commit and push Liquid Glass round | in_progress | Stage, commit, and push `codex-liquid-glass-ui-agent-optimization`. |

## Acceptance Checklist

- Static fallback files remain present: `start-agentflow-static.bat`, `scripts\static-server.js`, `static-app`, `assets\icon.ico`.
- Desktop shortcut remains present and points to `D:\AgentFlowStudio\start-agentflow-static.bat`.
- `npm.cmd run icon`, `smoke`, `typecheck`, `test:launch-static`, and `shortcut` pass.
- Real `cmd /k start-agentflow-static.bat` launch returns HTTP 200 and includes required Chinese navigation keywords.
- Default UI is Chinese, with topbar Chinese/English switch and topbar light/dark/system theme switch.
- Settings contains Interface Preferences in both languages and persists `agentflow.language` and `agentflow.theme`.
- Shared Memory Hub can create/search/archive memories and generate a recovery context prompt.
- Prompt Lab can inject `[Shared Memory Context]` using off/minimal/balanced/full modes.
- Recursive secret redaction covers strings, arrays, objects, nesting, circular references, memory save/export/injection, and API key display.
- Page render errors show a route-level fallback rather than white-screening the app.
- Smoke and launch-static tests cover this quality pass.
- Handoff docs and A-G logs are updated.
- Git contains at least one commit for this round.

## Errors Encountered

| Error | Attempt | Resolution |
|---|---|---|
| `git switch -c codex-static-quality-pass` failed with `.git` ref lock permission denied under sandbox. | Branch creation | Re-ran with approved escalation and created the branch successfully. |
| `npm.cmd run test` failed at Vite/Vitest config load with esbuild `spawn EPERM`. | Post-change optional verification | Recorded as environment limitation; Static fallback verification is not blocked. |
| `npm.cmd run build` failed at Vite config load with esbuild `spawn EPERM`. | Post-change optional verification | Recorded as environment limitation; Static fallback verification is not blocked. |
| Playwright Chromium executable was missing. | Browser click check | Recorded as environment limitation; HTTP, launch-static, and Node VM static checks were used instead. |
| `The process cannot access the file because it is being used by another process.` during static launch. | User-reported launcher run | Fixed by separating per-run launcher/server logs and avoiding shared launcher log redirection. Regression locked `logs\launcher-static.log` while launching and passed. |
| `test:e2e` connection refused on `127.0.0.1:5173` | Ran concurrently with other local-service tests | Single rerun passed 6/6; record as local service concurrency issue, not app regression. |
