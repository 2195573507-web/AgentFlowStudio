# AgentFlow Studio - Test Report

## Liquid Glass UI And Workflow Onboarding Pass - 2026-05-09

Baseline tag: `codex-liquid-glass-ui-base-20260509-172941`

Branch: `codex-liquid-glass-ui-agent-optimization`

### Latest Results

| Check | Status | Details |
|---|---:|---|
| `npm.cmd install` | PASS | Dependencies up to date; existing audit issues unchanged. |
| `npm.cmd run typecheck` | PASS | TypeScript passed. |
| `npm.cmd run lint` | PASS | 0 errors, 24 existing warnings under threshold. |
| `npm.cmd run smoke` | PASS | 132/132 checks passed, including Liquid Glass tokens and workflow lifecycle rail markers. |
| `node --check static-app\app.js` | PASS | Static fallback JS syntax valid. |
| `npm.cmd run test` | PASS | Vitest: 10 files, 113 tests passed. |
| `npm.cmd run build` | PASS | Renderer and Electron build passed; existing Charts chunk-size warning only. |
| `npm.cmd run test:launch-static` | PASS | Static fallback launch, HTTP 200, localized keywords, and static markers verified. |
| `npm.cmd run test:static-browser` | PASS | Liquid Glass blur/shadow, next-step CTA, lifecycle rail, 1024x680, 390x844, persistence, redaction, and console/network/page errors verified. |
| `npm.cmd run test:electron-startup` | PASS | Electron ready marker captured with project-local userData. |
| `npm.cmd run test:e2e` | PASS after rerun | First concurrent local-service run hit `127.0.0.1:5173` connection refused; single rerun passed 6/6. |
| `npm.cmd run verify` | PASS | 100/100 build completeness checks, then smoke 132/132. |

### Fixes Verified

- Tailwind accent palette now includes the shades already used by components.
- React and static fallback both use stronger Liquid Glass tokens: surface, hover surface, border, highlight, inner stroke, layered shadow, and focus ring.
- Dashboard now tells users the next action and shows the AI collaboration lifecycle: Idea, Plan, Tasks, Prompt, Safety, Logs, Memory, Handoff.
- Static fallback preserves the stable launcher while gaining the same onboarding rail.
- Static browser smoke now covers mobile-width `390x844` no-horizontal-overflow checks.

### Remaining Work

- Add ProjectDetail run-record panel using `api.runs` without arbitrary command execution.
- Navigate newly created projects directly to detail and highlight plan generation.
- Add Settings runtime status and provider test feedback.
- Add Prompt Lab post-generation next actions.
- Add i18n mojibake quality gate.

## Continuation Stability Release 1.1.1 - 2026-05-09

Baseline commit: `97e37f7473f67a6ac41d25f2ac1f5f3e4200f691`

Branch: `codex-static-quality-pass`

### Latest Continuation Results

| Check | Status | Details |
|---|---:|---|
| `npm.cmd run test:long-run` | PASS | Additional 30.04-minute static fallback run, 31 samples, no crash, disconnect, console error, page error, network failure, or heap growth. |
| `npm.cmd run typecheck` | PASS | TypeScript checks passed at `1.1.1`. |
| `npm.cmd run lint` | PASS | 0 errors, 36 existing warnings under configured threshold. |
| `npm.cmd run smoke` | PASS | 117/117 checks passed. |
| `npm.cmd run verify` | PASS | 99/99 build completeness checks passed, then smoke passed. |
| `npm.cmd run test` | PASS | Vitest: 9 files, 109 tests passed. |
| `npm.cmd run build` | PASS | Renderer and Electron build passed; existing Charts chunk-size warning only. |
| `npm.cmd run test:launch-static` | PASS | Static launcher, HTTP 200, localized keywords, and server liveness verified. |
| `npm.cmd run test:static-browser` | PASS | Navigation, persistence, redaction, Liquid Glass blur, layout, and console/network/page errors verified. |
| `npm.cmd run test:e2e` | PASS | Playwright React web suite: 5/5 passed. |
| `npm.cmd run test:electron-startup` | PASS | Electron ready marker captured with project-local userData. |

### Continuation Notes

- Result JSON: `D:\AgentFlowStudio\.codex-parallel\results\long-run-static-20260509065035.json`
- Screenshot: `D:\AgentFlowStudio\.codex-parallel\results\long-run-static-20260509065035.png`
- Server log: `D:\AgentFlowStudio\.codex-parallel\logs\long-run-static-server-20260509065035.log`
- Version files are bumped to `1.1.1`; source code behavior is unchanged from the verified `v1.1.0` release.

## Stability Release 1.1.0 - 2026-05-09

Baseline commit: `fb442d686b21c993887c0d60c5c3a3a107d21d5d`

Branch: `codex-static-quality-pass`

### Latest Verified Results

| Check | Status | Details |
|---|---:|---|
| `npm.cmd run typecheck` | PASS | TypeScript renderer/main checks passed. |
| `npm.cmd run lint` | PASS | 0 errors, 36 existing warnings under the configured threshold. |
| `npm.cmd run smoke` | PASS | 117/117 smoke checks passed. |
| `npm.cmd run verify` | PASS | 99/99 build completeness checks passed, then smoke passed. |
| `npm.cmd run test` | PASS | Vitest: 9 files, 109 tests passed. |
| `npm.cmd run build` | PASS | Renderer and Electron main/preload built successfully; Charts chunk-size warning only. |
| `npm.cmd run test:launch-static` | PASS | Static server starts, returns HTTP 200, validates Chinese/English keywords, and remains alive. |
| `npm.cmd run test:static-browser` | PASS | Browser workflow covers navigation, project creation, Prompt Lab, log analysis, safety, memory, settings, persistence, redaction, Liquid Glass, 1024x680 layout, and console/network/page errors. |
| `npm.cmd run test:e2e` | PASS | Playwright React web suite: 5/5 tests passed with project-local browser cache. |
| `npm.cmd run test:electron-startup` | PASS | Real Electron startup reached ready marker using project-local `.codex-parallel/electron-user-data-smoke`. |
| `npm.cmd run test:long-run` | PASS | 30.04-minute static fallback run: 31 samples, no crash, disconnect, console error, page error, network failure, or heap growth. |

### Fixes Verified

- Electron production startup no longer crashes on ESM `__dirname`.
- Dashboard no longer crashes when rendering lucide `forwardRef` icons in `StatCard`.
- Prompt Lab lint blocker is fixed.
- Provider API keys are masked for renderer display and not prefilled back into the edit form.
- Memory/export/storage paths redact secrets.
- Static fallback remains available through `start-agentflow-static.bat -> scripts/static-server.js static-app 4173`.
- Liquid Glass blur is still present in React and static paths.
- Dashboard now includes a beginner-friendly three-step path.
- Renderer base CSS now has a unified Chinese/English font stack.

### Current Notes

- All test/browser/cache/log artifacts from this pass stay under `D:\AgentFlowStudio\.codex-parallel` or `D:\AgentFlowStudio\handoff`.
- `npm audit` still reports dependency vulnerabilities that require major upgrades; they were not changed in this stability release to avoid dependency churn.
- Build still reports a non-failing Vite chunk-size warning for Charts.

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
