# AgentFlow Studio Static Quality Pass Findings

## Baseline

- Baseline commit for this session is `cec7dfb fix: stabilize localized static launcher`.
- Initial branch was `codex-stability-loop`; the required branch `codex-static-quality-pass` was created for this session.
- Previous `.codex-parallel` content was archived to `handoff\archived-agents\run-20260508-173352`.
- Previous launcher work must be preserved. The current stable delivery path is the Static fallback through `start-agentflow-static.bat` and `scripts\static-server.js`.

## Constraints To Preserve

- Do not remove or rebuild `static-app`, `start-agentflow-static.bat`, `scripts\static-server.js`, `assets\icon.ico`, or the Desktop shortcut.
- Do not treat Electron/Vite/Vitest esbuild EPERM as a blocker for this Static fallback pass.
- Do not commit `node_modules`, `.env`, API keys, secrets, `dist` temporary files, or user data.

## Regression Findings

- Agent A regression gate passed. Static fallback files and Desktop shortcut remain intact.
- `npm.cmd run test:launch-static` and `npm.cmd run shortcut` require escalation outside the sandbox because they spawn a local server and write the Desktop shortcut.
- Real `cmd /k` launcher verification returned HTTP 200 on `127.0.0.1:4173` after 15 seconds.
- The static response includes the core Chinese navigation keywords. The raw HTML did not include the new topbar `English` or theme labels before JavaScript rendering, so that remains part of the B/F hardening and test expansion work.

## Implementation Findings

- Static app now persists `agentflow.language` and `agentflow.theme` separately from `agentflow.static.v1`.
- Static app now has `translations.zh`, `translations.en`, and `t(key)`.
- Static app now renders a language toggle, three-state theme toggle, Interface Preferences, Shared Memory injection modes, memory search/archive, and route-level error fallback.
- Shared redaction is now implemented in `src/shared/secretRedaction.ts` and re-exported by the renderer.
- React routes are wrapped in `ErrorBoundary`; React helper files `i18n.ts` and `theme.ts` were added.
- `npm.cmd run test` and `npm.cmd run build` still fail at esbuild `spawn EPERM`; this is an environment limit rather than a Static fallback regression.
- Playwright click verification could not run because the Chromium headless shell is not installed.

## Launcher File Lock Finding

- `start-agentflow-static.bat` used one fixed `logs\launcher-static.log` path for every run.
- The batch file also redirected the long-running `node scripts\static-server.js` stdout/stderr into that same launcher log.
- If a previous launcher/server window is still running, or Windows has not released the append handle yet, a new launcher run can fail while truncating, appending, or printing `launcher-static.log`.
- The static server already maintains its own `logs\static-server.log`; launcher and server logs can be separated cleanly.
- Fix implemented: launcher logs are now per run, static server logs are per run when launched through the batch file, and `launcher-static.log` is only a best-effort latest-copy file.
- Regression result: with `logs\launcher-static.log` locked using exclusive `FileShare.None`, `start-agentflow-static.bat` still started and wrote `logs\launcher-static-20260508-191336-257.log` plus `logs\static-server-20260508-191336-257.log`.

## Liquid Glass UI Findings - 2026-05-09

- The stable startup boundary remains Static fallback: `start-agentflow-static.bat -> scripts/static-server.js -> static-app`.
- Tailwind `accent` palette was incomplete while components used `accent-400/500/600/700`; this was fixed by adding the missing shades.
- React and static fallback previously had separate glass definitions; both now expose surface, hover surface, border, highlight, inner stroke, shadow, and focus ring semantics.
- Dashboard now needs to function as an agent workflow guide, not only a metrics page. The implemented lifecycle rail is: Idea, Plan, Tasks, Prompt, Safety, Logs, Memory, Handoff.
- Static browser smoke now catches mobile-width horizontal overflow at `390x844`.
- A concurrent React E2E run can fail with `127.0.0.1:5173` connection refused when other local-service tests are running. Single rerun passed, so schedule local server tests sequentially when possible.

## Project Creation Close-Loop Findings - 2026-05-09

- New-user workflow gap: after creating a project, staying on the list made the next action ambiguous. The React flow now opens `/projects/:id?next=plan` and highlights plan generation.
- Accessibility finding: the new project modal used visible labels that were not bound to form controls. `Input`/`Textarea` labels and select `htmlFor`/`id` pairs now support `getByLabel` and screen readers.
- Stability finding from parallel review: `api.projects.create` can return an IPC error object instead of throwing. The Projects route now detects `{ error }` and keeps the user in the modal with a form error instead of navigating to a fake success.
- State finding from parallel review: ProjectDetail could carry an old generated plan while navigating between projects in the same component instance. The fetch path now clears `plan` before applying the loaded project data.
- Test coverage finding: React E2E now covers create -> detail -> `?next=plan` -> highlighted next-step card -> generate plan -> plan actions visible.
- Remaining test-infra risk: Playwright still uses fixed `5173` with `reuseExistingServer`; this did not block the new E2E but should be hardened next.

## E2E Lifecycle Findings - 2026-05-09

- Root cause confirmed: Playwright E2E and Electron startup smoke both used `5173`; when run concurrently, both could pick the same apparently-free port and one runner failed before startup.
- Fix implemented: `scripts/free-port.js` now reserves port lock directories under `.codex-parallel/port-locks`, Playwright E2E defaults to `5173-5199`, and Electron startup smoke defaults to `5200-5229`.
- Playwright now reads `AGENTFLOW_E2E_PORT`/`AGENTFLOW_E2E_BASE_URL` and defaults `AGENTFLOW_E2E_REUSE_SERVER` to `0`, avoiding accidental reuse of an unrelated dev server.
- Electron startup smoke now reads `AGENTFLOW_ELECTRON_SMOKE_PORT`, passes `--strictPort`, and logs the actual dev server URL.
- Validation evidence: one intentional concurrent run reproduced the old collision; after port reservation, concurrent `npm.cmd run test:e2e` and `npm.cmd run test:electron-startup` passed with E2E on `5173` and Electron on `5200`.
