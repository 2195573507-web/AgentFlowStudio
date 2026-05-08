# Next Codex Loop Prompt

Continue AgentFlow Studio in `D:\AgentFlowStudio`.

Read first:

- `AGENTS.md`
- `handoff/TEST_REPORT.md`
- `handoff/TASK_STATUS.md`
- `handoff/CURRENT_CONTEXT_FOR_ANY_MODEL.md`
- `handoff/CODEX_HANDOFF.md`
- `.codex-parallel/PARALLEL_SUMMARY.md`

Important: archived reports under `handoff\archived-agents\run-20260508-125051` and `handoff\archived-agents\run-20260508-173352` are historical only. Do not use archived results as current PASS evidence.

## Current Verified Deliverable

Static fallback is the active usable scheme.

```bat
D:\AgentFlowStudio\start-agentflow-static.bat
```

Desktop shortcut:

```text
C:\Users\至亲\Desktop\AgentFlow Studio.lnk
TargetPath: D:\AgentFlowStudio\start-agentflow-static.bat
WorkingDirectory: D:\AgentFlowStudio
IconLocation: D:\AgentFlowStudio\assets\icon.ico,0
```

The static app is in:

```text
D:\AgentFlowStudio\static-app
```

It now covers bilingual language switching, light/dark/system theme preferences, Shared Memory Prompt injection, recursive redaction, route fallback errors, and expanded static QA.

## Verified In Latest Loop

Run evidence from 2026-05-08:

```bat
npm.cmd run icon
npm.cmd run smoke
npm.cmd run typecheck
npm.cmd run test:launch-static
npm.cmd run shortcut
```

Real bat launch was verified:

```bat
cmd /k start-agentflow-static.bat
```

After 15 seconds, logs existed and `http://127.0.0.1:4173` returned HTTP 200.

## Known Environment Limits

- `npm.cmd run test` fails at Vite/Vitest esbuild `spawn EPERM`.
- `npm.cmd run build` fails at Vite esbuild `spawn EPERM`.
- Playwright Chromium is not installed in this environment.

Do not treat these as Static fallback blockers.

## Recommended Next Work

1. Retry Electron/Vite/Vitest in a normal unrestricted Windows shell.
2. Install Playwright browsers and add click-level E2E for language/theme/Shared Memory injection.
3. Continue low-frequency React route copy polish.
4. Keep shortcut pointed at Static fallback until Electron/Vite are truly verified.

Do not rebuild from scratch. Do not remove Shared Memory Hub. Use `npm.cmd`, not `npm`, from PowerShell.
