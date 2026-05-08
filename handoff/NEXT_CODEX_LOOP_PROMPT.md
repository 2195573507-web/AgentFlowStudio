# Next Codex Loop Prompt

Continue AgentFlow Studio in `D:\AgentFlowStudio`.

Read first:

- `AGENTS.md`
- `handoff/TEST_REPORT.md`
- `handoff/TASK_STATUS.md`
- `handoff/CURRENT_CONTEXT_FOR_ANY_MODEL.md`
- `handoff/CODEX_HANDOFF.md`
- `.codex-parallel/PARALLEL_SUMMARY.md`

Important: old `.codex-parallel` results were archived to `handoff\archived-agents\run-20260508-125051`. Do not use the archived reports as current PASS evidence.

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

It is Chinese-first and covers 仪表盘、项目管理、项目详情、提示词实验室、日志分析、安全检查、共享记忆中心、设置.

The high-frequency React UI has also been localized in the main shell, TaskBoard, Charts, Dashboard, Projects, SharedMemoryHub, Settings, and Skills. Remaining English should be limited to allowed product/technical terms or future deep polish.

## Verified In Latest Loop

Run evidence from 2026-05-08:

```bat
npm.cmd run icon
npm.cmd run smoke
npm.cmd run test:launch-static
npm.cmd run shortcut
```

`test:launch-static` and `shortcut` required running outside the sandbox because the sandbox can block child process spawn and Desktop writes. Real bat launch was also verified: `cmd /k start-agentflow-static.bat` stayed open after 15 seconds, wrote `logs\launcher-static.log` and `logs\static-server.log`, and `http://127.0.0.1:4173` returned HTTP 200 with the required Chinese keywords.

## Recommended Next Work

1. Continue low-frequency React localization polish beyond the already-localized high-frequency UI.
2. Retry `npm.cmd run test`, `npm.cmd run build`, and `npm.cmd run dev` in a normal unrestricted Windows shell.
3. Keep the shortcut pointed at Static fallback until Electron/Vite are truly verified.
4. Add route-level ErrorBoundary.
5. Harden Shared Memory Hub redaction and context generation.

Do not rebuild from scratch. Do not remove Shared Memory Hub. Use `npm.cmd`, not `npm`, from PowerShell.
