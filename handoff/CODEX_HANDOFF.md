# Codex Handoff - AgentFlow Studio

## Latest Verified State - 2026-05-08

Current deliverable: **Static fallback / 静态可交付模式**.

Use this launcher:

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

This loop deliberately reset stale parallel-agent state. The old `.codex-parallel` directory was archived to `handoff\archived-agents\run-20260508-125051`, a clean `.codex-parallel\logs` directory was created, and seven fresh role logs now cover launcher crash, static server, shortcut, fallback app, localization, runtime smoke, and reporting. Agent G reporting was completed by the main Codex thread because the subagent limit was reached.

## What Was Fixed

- `start-agentflow-static.bat` no longer delegates through npm and no longer embeds UTF-8 Chinese command text that Windows cmd can mis-parse. It now uses an ASCII-safe batch skeleton, prints Chinese prompts through `scripts\launcher-message.ps1`, writes `logs\launcher-static.log`, runs `node scripts\static-server.js` directly, and pauses if the server exits.
- `scripts\static-server.js` is a pure Node HTTP server. It prioritizes `static-app`, includes `static-app/dist` fallback, falls back through `dist`, `dist-web`, and `public`, auto-creates a minimal fallback if needed, retries ports 4173-4177, opens the browser, logs to `logs\static-server.log`, and catches uncaught exceptions and unhandled rejections.
- `static-app` is a real Chinese static app with `index.html`, `app.js`, `styles.css`, and `assets/icon.svg`.
- `scripts\launch-static-test.js` and `npm.cmd run test:launch-static` were added for real runtime verification.
- `scripts\create-shortcut.ps1` now targets `D:\AgentFlowStudio\start-agentflow-static.bat` directly while Electron/Vite are blocked.

## Verified Commands And Checks

- `npm.cmd run icon`: PASS.
- `npm.cmd run smoke`: PASS, 64/64.
- `npm.cmd run test:launch-static`: PASS outside sandbox.
- `npm.cmd run shortcut`: PASS outside sandbox.
- PowerShell COM shortcut verification: PASS.
- Real bat launch: PASS; `cmd /k start-agentflow-static.bat` stayed open after 15 seconds and wrote logs.
- HTTP smoke: PASS; `http://127.0.0.1:4173` returned 200 and included `AgentFlow Studio`, `仪表盘`, `项目管理`, `提示词实验室`, `日志分析`, `安全检查`, `共享记忆中心`, and `设置`.

## Static Fallback Feature Scope

The current fallback app is not a blank placeholder. It includes:

- 仪表盘 / 项目总控台
- 项目管理 with localStorage create/delete/select project
- 项目详情 with task board and copyable project Prompt
- 提示词实验室 with templates, variables, shared memory injection, copy/save
- 日志分析 with error type, possible cause, fix steps, suggested command, and fix Prompt
- 安全检查 with risk level, matched rules, safer alternative, backup recommendation, and sandbox recommendation
- 共享记忆中心 with add memory and cross-model recovery Prompt
- 设置 with AI Provider/API fields, memory injection mode, theme, data export/clear/reset

Allowed English terms remain as product/domain names in Chinese context: AgentFlow Studio, Codex, Claude Code, Cursor, API, Prompt, Git, Shared Memory Hub, localStorage, Static fallback.

## Why Static Fallback Remains Active

Electron, Vite, Vitest, and Vite build were not the focus of this repair because the environment has repeatedly shown esbuild `spawn EPERM`. The user-facing problem was double-click launch failure and English UI. The stable verified path is now:

```text
Desktop shortcut -> start-agentflow-static.bat -> node scripts/static-server.js -> static-app
```

Do not switch the shortcut back to Electron or a packaged executable until `npm.cmd run dev`, `npm.cmd run build`, and the packaged app are truly verified in a normal Windows shell.

## Next Work

1. Continue low-frequency React localization polish while keeping allowed product/technical terms in Chinese context.
2. Retry Electron/Vite/Vitest in a normal unrestricted Windows terminal.
3. Add a route-level ErrorBoundary to the React app.
4. Harden Shared Memory Hub redaction and context generation in the Electron main process.

Do not rebuild from scratch. Do not remove Shared Memory Hub. Treat archived agent reports as historical only.
