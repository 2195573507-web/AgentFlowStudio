# Current Context - AgentFlow Studio

## Latest State - 2026-05-08

Baseline commit: `cec7dfb fix: stabilize localized static launcher`

Current deliverable: **Static fallback / 静态可交付模式**.

Use:

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

## Current Agent Workspace

- Previous parallel workspace archived to `handoff\archived-agents\run-20260508-173352`.
- Older archive `handoff\archived-agents\run-20260508-125051` remains historical.
- Archived 2026-05 parallel-agent summary: `archive\2026-05\parallel-agents\run-20260508-current\PARALLEL_SUMMARY.md`.
- Archived 2026-05 parallel-agent logs: `archive\2026-05\parallel-agents\run-20260508-current\logs\agent-a-regression-guard.log` through `agent-g-reporter.log`.

## Verified

- `npm.cmd run icon`: PASS.
- `npm.cmd run smoke`: PASS, 106/106.
- `npm.cmd run typecheck`: PASS.
- `npm.cmd run test:launch-static`: PASS.
- `npm.cmd run shortcut`: PASS.
- PowerShell COM shortcut verification: PASS.
- Real bat launch: PASS after 15 seconds.
- Real HTTP: `http://127.0.0.1:4173` returned 200 and included `AgentFlow Studio`, `仪表盘`, `项目管理`, `提示词实验室`, `共享记忆中心`, `设置`, `Dashboard`, and `Interface Preferences`.

## What Is Now Hardened

- Default UI is Chinese-first.
- Topbar language toggle switches Chinese / English and persists `agentflow.language`.
- Topbar theme toggle cycles system / light / dark and persists `agentflow.theme`.
- Settings has `界面偏好 / Interface Preferences`.
- Prompt Lab can inject Shared Memory Context using `off`, `minimal`, `balanced`, or `full`.
- Shared Memory recovery Prompt can be generated and copied.
- API key/token/password/secret fields are recursively redacted with `[REDACTED]`.
- Page render errors do not white-screen the entire app.

## Why Static Fallback Is Current

Electron, Vite build, and Vitest are not the active deliverable because this environment hits esbuild `spawn EPERM`. The stable path is pure Node + static files:

```text
start-agentflow-static.bat -> node scripts/static-server.js -> static-app
```

## Important Constraints

- Do not rebuild from scratch.
- Do not remove Shared Memory Hub.
- Do not remove `static-app`, `start-agentflow-static.bat`, `scripts\static-server.js`, or `assets\icon.ico`.
- Do not switch the shortcut away from Static fallback until Electron/Vite are truly verified.
- Use `npm.cmd`, not `npm`, from PowerShell.
- Treat old archived agent reports as historical only.

## Next Best Work

1. Retry `npm.cmd run test`, `npm.cmd run build`, and `npm.cmd run dev` in a normal unrestricted Windows terminal.
2. Install Playwright browsers and add real click E2E for language/theme/memory injection.
3. Continue low-frequency React localization polish.
4. If Electron passes, ask before switching shortcut priority away from Static fallback.
