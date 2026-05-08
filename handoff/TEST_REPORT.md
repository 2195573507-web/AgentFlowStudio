# AgentFlow Studio - Test Report

## Localized Static Launcher Repair - 2026-05-08

This is the latest verified state. Do not treat the older 2026-05-07 PASS entries as proof of current usability; this loop re-ran the launcher, HTTP, shortcut, icon, smoke, and localization checks.

### Current Usable Entry

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
| Old parallel agents reset | PASS | Old `.codex-parallel` archived to `handoff\archived-agents\run-20260508-125051`; clean `.codex-parallel\logs` created. |
| New agent logs | PASS | Seven role logs exist under `.codex-parallel\logs`; Agent G reporter work handled by main thread due subagent limit. |
| `npm.cmd run icon` | PASS | Regenerated `assets\icon.svg`, `assets\icon.png`, and `assets\icon.ico` (57784 bytes). |
| `npm.cmd run smoke` | PASS | 64 checks passed, including `static-app` files and Chinese keyword checks. |
| `npm.cmd run test:launch-static` | PASS | Starts `scripts\static-server.js`, returns HTTP 200, validates title and Chinese keywords, confirms process stays alive >5 seconds. |
| `npm.cmd run shortcut` | PASS | Required Desktop write outside sandbox; recreated `AgentFlow Studio.lnk`. |
| Desktop shortcut COM verification | PASS | Target, working directory, icon, target file, and icon file all verified. |
| Real bat launch | PASS | `cmd /k start-agentflow-static.bat` stayed open after 15 seconds and wrote launcher/server logs. |
| Static HTTP smoke | PASS | `http://127.0.0.1:4173` returned HTTP 200, contained `AgentFlow Studio`, and contained `仪表盘、项目管理、提示词实验室、日志分析、安全检查、共享记忆中心、设置`. |
| Port fallback | PASS | With 4173 occupied, test server logged `端口 4173 被占用，尝试下一个端口` and used 4174 during test. |

### Runtime Evidence

```text
Listening: 127.0.0.1:4173
Owning process: node "scripts\static-server.js"
Parent process: cmd launched from start-agentflow-static.bat
HTTP: 200
Title: AgentFlow Studio - 静态可交付模式
Static root: D:\AgentFlowStudio\static-app
```

### Fixed Failure Cause

- The old launcher delegated to `npm.cmd run fallback:static`, opened the browser before the server was ready, and was sensitive to PATH/npm and cmd parsing behavior.
- The first UTF-8 Chinese `.bat` rewrite was not safe enough for Windows cmd parsing in the user's double-click path and produced errors such as `'errorlevel' is not recognized`, `for /f` fragments, and broken redirection.
- The final launcher uses an ASCII-safe batch control skeleton and lets the Node static server provide Chinese runtime logs and the Chinese UI. This prevents the console from closing immediately and avoids cmd parsing corruption.
- Chinese console prompts are emitted via `scripts\launcher-message.ps1`, keeping `start-agentflow-static.bat` command syntax ASCII-safe while still showing user-facing Chinese text.
- `scripts\static-server.js` no longer exits when `dist` is missing; it prioritizes `static-app`, includes `static-app/dist` fallback, writes logs, catches uncaught exceptions and unhandled rejections, retries ports 4173-4177, and keeps the process alive.

### Localization Verification

`static-app` is Chinese-first and includes:

- 仪表盘 / 项目总控台
- 项目管理
- 项目详情
- 提示词实验室
- 日志分析
- 安全检查
- 共享记忆中心
- 设置

Core actions are localized: 新建项目、保存、删除、导出、复制、生成、分析、检查风险、新增记忆、生成跨模型恢复上下文、清空、重置.

Allowed English terms are retained only as product or domain names in Chinese context: AgentFlow Studio, Codex, Claude Code, Cursor, API, Prompt, Git, Shared Memory Hub, localStorage, Static fallback.

### Environment Notes

- In the sandbox, Node child-process spawning can fail with `spawn EPERM`. The required `test:launch-static` command passed outside the sandbox with approval.
- Electron/Vite/Vitest remain de-prioritized for this loop because previous runs hit esbuild `spawn EPERM`. The current deliverable is the pure Node Static fallback.

### Logs To Inspect

```text
D:\AgentFlowStudio\logs\launcher-static.log
D:\AgentFlowStudio\logs\static-server.log
D:\AgentFlowStudio\.codex-parallel\PARALLEL_SUMMARY.md
D:\AgentFlowStudio\.codex-parallel\logs\
```
