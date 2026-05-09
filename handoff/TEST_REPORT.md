# AgentFlow Studio - Test Report

## Static Quality Pass - 2026-05-08

Baseline commit: `cec7dfb fix: stabilize localized static launcher`

Current usable deliverable remains **Static fallback / 静态可交付模式**:

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

### Latest Verified Results

| Check | Status | Details |
|---|---:|---|
| Fresh agent workspace | PASS | Previous `.codex-parallel` archived to `handoff\archived-agents\run-20260508-173352`; new A-G task/log files created. |
| New subagents | PASS | Six real subagents B-G were started; Agent A regression guard was run in the main thread. |
| `npm.cmd run icon` | PASS | Regenerated `assets\icon.svg`, `assets\icon.png`, and `assets\icon.ico`. |
| `npm.cmd run smoke` | PASS | Expanded static QA passed, 111/111 checks, including launcher log-lock guards. |
| `npm.cmd run typecheck` | PASS | `tsc --noEmit -p tsconfig.json` completed successfully. |
| `npm.cmd run test:launch-static` | PASS | Starts `scripts\static-server.js`, returns HTTP 200, validates Chinese and English keywords, confirms process stays alive >5 seconds. |
| Locked launcher log regression | PASS | Held `logs\launcher-static.log` open with an exclusive lock; `start-agentflow-static.bat` still started and wrote per-run launcher/server logs. |
| `npm.cmd run shortcut` | PASS | Recreated/verified Desktop shortcut to the static launcher. |
| Desktop shortcut COM verification | PASS | Target, working directory, and icon match the required Static fallback values. |
| Real bat launch | PASS | `cmd /k start-agentflow-static.bat` stayed open after 15 seconds and wrote launcher/server logs. |
| Static HTTP smoke | PASS | `http://127.0.0.1:4173` returned HTTP 200 with AgentFlow Studio, core Chinese navigation, and English preference keywords. |
| Static JS syntax | PASS | `node --check static-app/app.js` passed. |

### Feature Verification

- Chinese-first UI remains the default.
- Topbar language toggle is present and uses `agentflow.language`.
- Topbar theme cycle supports `system`, `light`, and `dark` through `agentflow.theme`.
- Settings includes `界面偏好 / Interface Preferences`, language selector, theme selector, current language, and current theme.
- Static CSS includes `[data-theme="light"]`, `[data-theme="dark"]`, and `prefers-color-scheme`.
- Prompt Lab supports `off`, `minimal`, `balanced`, and `full` Shared Memory injection modes.
- Shared Memory context uses canonical markers:

```text
[Shared Memory Context]
...
[/Shared Memory Context]
```

- Recovery Prompt includes project name, current scheme, usable launcher, known limitation, and next step.
- Recursive secret redaction now covers strings, arrays, objects, nested objects, circular references, key-aware fields, and export/injection paths.
- React routes are wrapped in a route-level ErrorBoundary.
- Static fallback catches page render errors and shows localized fallback actions.
- Static launcher uses per-run `launcher-static-<timestamp>.log` and `static-server-<timestamp>.log` files, so an old open window or locked `launcher-static.log` no longer blocks startup.

### Environment Notes

- `npm.cmd run test`: blocked by Vite/Vitest esbuild `spawn EPERM`.
- `npm.cmd run build`: blocked by Vite esbuild `spawn EPERM`.
- Playwright browser binary is not installed, so browser click verification could not run in this environment. Static runtime was verified through HTTP, launch tests, and a Node VM execution check.
- These environment limits do not block the Static fallback.

### Logs To Inspect

```text
D:\AgentFlowStudio\logs\launcher-static.log
D:\AgentFlowStudio\logs\static-server.log
D:\AgentFlowStudio\logs\launcher-static-<timestamp>.log
D:\AgentFlowStudio\logs\static-server-<timestamp>.log
D:\AgentFlowStudio\.codex-parallel\PARALLEL_SUMMARY.md
D:\AgentFlowStudio\.codex-parallel\logs\
```
