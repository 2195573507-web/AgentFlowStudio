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
