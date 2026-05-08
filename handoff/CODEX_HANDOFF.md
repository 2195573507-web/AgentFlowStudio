# Codex Handoff - AgentFlow Studio

## Latest Verified State - 2026-05-08

Baseline commit for this round: `cec7dfb fix: stabilize localized static launcher`

Current deliverable remains **Static fallback / 静态可交付模式**.

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

Do not switch the shortcut back to Electron or a packaged executable until `npm.cmd run dev`, `npm.cmd run build`, and the packaged app are truly verified in a normal Windows shell.

## This Round

- Previous `.codex-parallel` was archived to `handoff\archived-agents\run-20260508-173352`.
- New `.codex-parallel\tasks` and `.codex-parallel\logs` were created for agents A-G.
- Six real subagents were used for B-G; Agent A regression was executed by the main thread.
- Static fallback remained stable and was verified before enhancements.

## What Changed

- Static app now has `zh/en` translations, a `t(key)` function, and topbar language toggle.
- Static app persists `agentflow.language` and `agentflow.theme`.
- Static and React theme controls support light, dark, and system.
- Settings now includes `界面偏好 / Interface Preferences` with language and theme controls.
- Prompt Lab Shared Memory injection supports `off`, `minimal`, `balanced`, and `full`.
- Shared Memory recovery Prompt includes project name, current scheme, usable launch method, known limitation, and next step.
- Recursive secret redaction is shared across renderer/main code and covers nested structures, key-aware fields, and circular references.
- Static export, memory save, recovery prompt, and injection paths redact secrets.
- React routes are wrapped by a route-level ErrorBoundary.
- Static render errors show a localized fallback instead of white-screening.
- Smoke and launch-static tests were expanded for language, theme, memory injection, redaction, and error fallback markers.

## Verified Commands And Checks

- `npm.cmd run icon`: PASS.
- `npm.cmd run smoke`: PASS, 106/106.
- `npm.cmd run typecheck`: PASS.
- `npm.cmd run test:launch-static`: PASS.
- `npm.cmd run shortcut`: PASS.
- PowerShell COM shortcut verification: PASS.
- Real bat launch: PASS; `cmd /k start-agentflow-static.bat` stayed open after 15 seconds and wrote logs.
- HTTP smoke: PASS; `http://127.0.0.1:4173` returned 200 and included required Chinese navigation plus English preference keywords.

## Environment Limits

- `npm.cmd run test`: blocked by Vite/Vitest esbuild `spawn EPERM`.
- `npm.cmd run build`: blocked by Vite esbuild `spawn EPERM`.
- Playwright browser binary is not installed, so browser-click verification could not run.

These are environment limitations, not Static fallback blockers.

## Current Static Scope

The Static fallback includes:

- 仪表盘 / Dashboard
- 项目管理 / Projects
- 项目详情 / Project Detail
- 提示词实验室 / Prompt Lab
- 日志分析 / Log Analyzer
- 安全检查 / SafetyBox
- 共享记忆中心 / Shared Memory Hub
- 技能管理 / Skills
- Git 时间线 / Git Timeline
- 设置 / Settings
- 界面偏好 / Interface Preferences

Allowed English terms remain as product/domain names in context: AgentFlow Studio, Codex, Claude Code, Cursor, DeepSeek, API, Prompt, Git, Shared Memory Hub, localStorage, Static fallback.

## Next Work

1. Retry Electron/Vite/Vitest in a normal unrestricted Windows terminal.
2. Install Playwright browsers and add browser-level E2E for language/theme/memory injection.
3. Continue low-frequency React route copy polish.
4. Decide with the user whether to switch launch priority only after Electron is truly verified.

Do not rebuild from scratch. Do not remove Shared Memory Hub. Treat archived agent reports as historical only.
