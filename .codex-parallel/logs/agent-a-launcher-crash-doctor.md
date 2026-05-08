# Agent A - Launcher Crash Doctor

Date: 2026-05-08
Workspace: D:\AgentFlowStudio
Scope: Checked current `start-agentflow-static.bat`, Node/npm availability, `scripts\static-server.js`, launcher/static logs, and port/path risks. Did not use old `.codex-parallel` history summaries. Did not modify project files other than this report.

## Verdict: PASS

Double-clicking `start-agentflow-static.bat` is unlikely to still produce a one-second flash exit under the checked conditions.

## Evidence

- `start-agentflow-static.bat` changes to its own directory with `cd /d "%~dp0"`, creates `logs`, writes `logs\launcher-static.log`, checks `where node`, checks `scripts\static-server.js`, then runs `node "scripts\static-server.js"` and pauses after server exit.
- Node is available:
  - `node --version` returned `v24.14.1`.
  - `where.exe node` found `D:\Program Files\node.exe`.
- npm is available from cmd:
  - `cmd /c npm --version` returned `11.11.0`.
  - `where.exe npm` found `D:\Program Files\npm` and `D:\Program Files\npm.cmd`.
- `scripts\static-server.js` passes syntax validation:
  - `node --check .\scripts\static-server.js` exited successfully.
- Static roots exist:
  - `static-app\index.html` exists.
  - `dist\index.html` exists.
  - The server prefers `static-app`, so it has a usable root without needing to generate fallback files.
- Existing launcher log shows a successful start on `http://127.0.0.1:4173`.
- Existing static-server log shows port fallback working: when `4173` was occupied, the server started on `4174`.
- Current check of ports `4173` through `4177` returned no active listeners.

## Findings

- PASS: The batch file has visible error handling and `pause` paths for missing Node, missing server script, and server exit. That substantially reduces the chance of a silent one-second close.
- PASS: The static server has port fallback candidates `4173` through `4177`, so a single occupied port should not crash the launcher.
- PASS: Project path contains no spaces, but the batch file still quotes key paths, so path spacing would not be the obvious failure mode here.
- PASS: Browser opening is detached and errors are logged, so browser launch failure should not kill the server.
- WARNING: Running `npm --version` directly from PowerShell fails because `D:\Program Files\npm.ps1` is blocked by the current PowerShell execution policy. This does not affect this batch launcher because it does not call npm, and `cmd /c npm --version` works.
- WARNING: `scripts\static-server.js` and logs contain mojibake text for Chinese messages. This is mostly readability/copy encoding risk, not an observed launcher-crash risk. The JavaScript syntax still validates.
- WARNING: Some log lines appear concatenated because several message strings appear to contain malformed trailing characters instead of clean line endings in the displayed output. This affects diagnostics readability more than launch behavior.

## Recommendations

- No blocking launcher-crash fix is required based on this inspection.
- If users will run npm commands from PowerShell, use `npm.cmd` or `cmd /c npm ...`, or adjust PowerShell execution policy intentionally.
- Clean up mojibake in `scripts\static-server.js` log/user-facing strings later so future crash reports are easier to read.
- Keep the current `pause` behavior in the batch file; it is important for diagnosing any future exit.
