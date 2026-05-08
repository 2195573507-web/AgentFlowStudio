# AgentFlow Studio Localized Static Launcher Repair Findings

## Session Findings

- The user-facing failure is reproducible from file inspection: `start-agentflow-static.bat` starts a browser before the server is guaranteed alive, then calls an npm script. When the Node server exits, the console can close after a pause is missed or hidden by shortcut behavior.
- `scripts\static-server.js` originally served only the CLI root argument defaulting to `dist`; if that directory is absent or broken it prints English errors and exits immediately.
- `static-app` was absent at the start of this session, so there was no Vite/esbuild-independent fallback UI.
- `assets\icon.ico`, `assets\icon.png`, and `assets\icon.svg` already exist and are non-empty; `npm.cmd run icon` must still be rerun for this session.
- `scripts\create-shortcut.ps1` previously selected packaged exe before static fallback. The current requirement is to point the Desktop shortcut directly at `D:\AgentFlowStudio\start-agentflow-static.bat` while Electron/Vite remain environment-blocked.
- React renderer still has some English user-visible labels in navigation and shared controls. The static fallback app will be fully Chinese-first; React-side localization should be treated as a follow-up unless this session has time after launch verification.
- A first attempt to make the batch launcher fully Chinese exposed a real Windows cmd parsing problem in the user's double-click path. The stable launcher now keeps batch control text ASCII-only while the Node server and static app provide Chinese user-facing output.
- Real HTTP evidence is tied to the bat-launched service on `127.0.0.1:4173`; the separate `test:launch-static` process can temporarily switch to 4174 when 4173 is occupied and then close after the test.

## Known Environment Constraint

- Vite, Vitest, Electron dev, and build remain de-prioritized in this session because previous runs hit esbuild `spawn EPERM`. The accepted deliverable for this loop is a pure Node static fallback that does not load Vite, Vitest, Electron, or esbuild.

## Final Verification Findings

- `npm.cmd run icon`: passed.
- `npm.cmd run smoke`: passed with 64 checks.
- `npm.cmd run test:launch-static`: passed outside sandbox.
- `npm.cmd run shortcut`: passed outside sandbox.
- Desktop shortcut COM check: passed.
- Real bat launch: passed; cmd stayed open after 15 seconds and parented a Node static server process.
- HTTP smoke: passed at `http://127.0.0.1:4173` with required Chinese keywords.
