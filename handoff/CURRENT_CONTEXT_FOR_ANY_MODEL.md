# Current Context - AgentFlow Studio

## Latest State - 2026-05-08

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

## What Changed In The Latest Loop

- Old `.codex-parallel` was archived to `handoff\archived-agents\run-20260508-125051`.
- Clean `.codex-parallel\logs` was recreated.
- Seven fresh roles checked launcher crash, static server, shortcut, fallback app, Chinese localization, runtime smoke, and reporting. Agent G was completed by the main thread due subagent limit.
- A real Static fallback app was created under `static-app`.
- `start-agentflow-static.bat` was rewritten with an ASCII-safe batch skeleton so Windows cmd no longer mis-parses Chinese text or redirection; Chinese console prompts are printed through `scripts\launcher-message.ps1`.
- `scripts\static-server.js` now serves `static-app` first, includes `static-app/dist` fallback, logs to `logs\static-server.log`, retries ports 4173-4177, catches fatal errors, supports SPA fallback, and opens the browser.
- `scripts\launch-static-test.js` and `npm.cmd run test:launch-static` were added.
- Desktop shortcut creation now targets `start-agentflow-static.bat` directly.

## Verified

- `npm.cmd run icon`: PASS.
- `npm.cmd run smoke`: PASS, 64/64.
- `npm.cmd run test:launch-static`: PASS outside sandbox.
- `npm.cmd run shortcut`: PASS outside sandbox.
- PowerShell COM shortcut verification: PASS.
- Real bat launch: PASS; cmd stayed open after 15 seconds.
- Real HTTP: `http://127.0.0.1:4173` returned 200 and included `AgentFlow Studio`, `仪表盘`, `项目管理`, `提示词实验室`, `日志分析`, `安全检查`, `共享记忆中心`, `设置`.

## Why Static Fallback Is Current

Electron, Vite build, and Vitest are still not the active deliverable because previous runs hit esbuild `spawn EPERM` in this environment. The current user issue is launcher usability, so the stable path is pure Node + static files:

```text
start-agentflow-static.bat -> node scripts/static-server.js -> static-app
```

## Static App Scope

The Static fallback is Chinese-first and supports:

- 仪表盘 / 项目总控台
- 项目管理
- 项目详情
- 提示词实验室
- 日志分析
- 安全检查
- 共享记忆中心
- 设置
- localStorage persistence
- New project, new memory, Prompt generation, log analysis, risk check, and cross-model recovery Prompt generation

Allowed English terms remain as names only: AgentFlow Studio, Codex, Claude Code, Cursor, API, Prompt, Git, Shared Memory Hub, localStorage, Static fallback.

## Important Constraints

- Do not rebuild from scratch.
- Do not remove Shared Memory Hub.
- Do not switch the shortcut away from Static fallback until Electron/Vite are truly verified in a normal Windows shell.
- Use `npm.cmd`, not `npm`, from PowerShell.
- Treat old `.codex-parallel` reports as historical only.

## Next Best Work

1. Finish full React route localization beyond the Static fallback.
2. Retry `npm.cmd run test`, `npm.cmd run build`, and `npm.cmd run dev` in a normal unrestricted Windows terminal.
3. If Electron passes, decide with the user whether to switch shortcut priority back to packaged Electron.
4. Add route-level ErrorBoundary.
5. Harden main-process Shared Memory redaction and context generation.
