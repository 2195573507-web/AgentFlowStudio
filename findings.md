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

## Auth/Admin/RBAC Reconnaissance - 2026-05-10

- Electron main currently acts as the local privileged backend. IPC handlers are centralized in `src/main/ipc.ts`, storage is JSON-backed in `src/main/storage.ts`, preload exposes `window.agentflow`, and shared IPC channel constants live in `src/shared/types.ts`.
- Existing IPC protection validates sender origin (`file://`, `localhost`, `127.0.0.1`) but has no session validation or role policy. The global `ipcMain.handle` wrapper is the right guard insertion point for session/RBAC/audit.
- Renderer routing is flat under HashRouter. `App.tsx` always renders `Layout`, so login should be a public route outside the protected shell, with the rest wrapped by an auth gate.
- State management is local React state plus preload-backed API wrapper; add a small AuthProvider rather than introducing a global state library.
- High-risk IPC surfaces for RBAC/audit: generic storage, provider settings, memory import/export/context, export markdown/json, git status/log, skill read, dialog open, app data path.
- Unit tests should target pure auth/session/RBAC/audit helpers and the renderer API wrapper. E2E can mock `window.agentflow.auth/users/audit` and validate protected routes, admin denial, login/logout, create user, and audit UI.

## Platform Security Hardening Findings - 2026-05-10

- Electron `safeStorage` is main-process only and backed by OS cryptography, but platform semantics vary. On Windows it uses DPAPI and protects against other users more than same-user processes; this supports the decision to remove renderer plaintext token persistence first and defer durable secret persistence to a focused follow-up.
- MCP authorization guidance emphasizes scoped authorization and secure token storage. For this app, the first safe step is an admin-managed allowlist plus audit records before enabling any MCP runtime execution path.
- OWASP logging guidance supports retention boundaries, tamper detection, and testing logging failure behavior. The implemented hash chain and retention metadata are a local JSON-compatible first layer, not a replacement for append-only or externally signed logs.
- Workflow tools such as n8n use workflow/project sharing roles like admin/editor/viewer and restrict workflow actions by role. The new ACL model mirrors that shape around workflow/project resources.
- Agent tracing systems model workflow runs as timelines/traces of tool calls, guardrails, handoffs, and custom events. The new `runEvents` collection is the local foundation for correlating run creation, permission denial, MCP decisions, and audit events.

## Round 12 Reconnaissance Notes - 2026-05-10

- `src/main/ipc.ts` is the central permission truth. Renderer preload only sends an auth envelope, while `readAuthHeader()` resolves the active main-process session token.
- Provider settings still store raw `apiKey` values in JSON with renderer masking on read. This is the primary durable `safeStorage` target.
- `src/main/storage.ts` has a closed `CollectionName` union. New security state should be explicit collections, not ad hoc files.
- `src/shared/types.js` and `src/shared/types.js.map` are generated artifacts inside `src/shared`; they should be deleted if no runtime import requires them.
- Handoff/README docs still contain legacy mojibake content. The previous scanner allowed these as historical docs; Round 12 should clean actively maintained docs and keep or remove allowlist entries accordingly.

## Round 12 Implementation Findings

- `project:update` previously preserved incoming `acl` under project write access. This would let editors attempt ACL mutation through a generic update payload. Dedicated ACL IPC now owns sharing changes and requires resource admin access.
- Provider key masking alone was insufficient because JSON storage still held raw submitted keys. Provider writes now protect new keys and lazy-migrate plaintext legacy keys when listing providers.
- The MCP allowlist needed a runtime decision object rather than a boolean check. The gateway now returns sandbox metadata and denial reasons before any future execution path can run.
- `src/shared/types.js` and `src/shared/types.js.map` were tracked generated artifacts with no repository references; they were removed.
