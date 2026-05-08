# AgentFlow Studio Localized Static Launcher Repair Progress

## 2026-05-08

- Read `AGENTS.md`, root planning files, `README.md`, `package.json`, launch scripts, static server, shortcut script, smoke script, and handoff report structure.
- Archived stale `.codex-parallel` to `handoff\archived-agents\run-20260508-125051`.
- Recreated clean `.codex-parallel` and `.codex-parallel\logs`.
- Launched new subagents A-F for launcher, static server, shortcut, fallback app, localization, and runtime smoke checks.
- Agent G could not spawn because the thread limit was reached; main thread completed reporter work and wrote `.codex-parallel\logs\agent-g-reporter.md`.
- Confirmed the old `start-agentflow-static.bat` depended on npm and could exit or parse badly in double-click scenarios.
- Rewrote `start-agentflow-static.bat` as an ASCII-safe batch launcher that writes `logs\launcher-static.log`, checks Node, runs `node scripts\static-server.js`, and pauses if the server exits.
- Hardened `scripts\static-server.js` with `static-app` priority, fallback generation, 4173-4177 retry, browser open, SPA fallback, MIME types, logging, `uncaughtException`, and `unhandledRejection` handling.
- Created `static-app/index.html`, `static-app/app.js`, `static-app/styles.css`, and `static-app/assets/icon.svg`.
- Added `scripts\launch-static-test.js` and `test:launch-static`.
- Updated `scripts\create-shortcut.ps1` to point the Desktop shortcut directly at `D:\AgentFlowStudio\start-agentflow-static.bat`.
- Localized React shell navigation, Topbar loading/title, and PromptPreview high-frequency labels.
- Ran `npm.cmd run icon`: PASS.
- Ran `npm.cmd run smoke`: PASS, 64/64.
- Ran `npm.cmd run test:launch-static`: PASS outside sandbox.
- Ran `npm.cmd run shortcut`: PASS outside sandbox.
- Verified Desktop shortcut with PowerShell COM: target, working directory, and icon are correct.
- Verified real launcher: `cmd /k start-agentflow-static.bat` stayed open after 15 seconds, wrote logs, and started `node scripts\static-server.js`.
- Verified HTTP: `http://127.0.0.1:4173` returned 200 and included AgentFlow Studio plus required Chinese keywords.
- Updated handoff docs and `.codex-parallel\PARALLEL_SUMMARY.md`.
