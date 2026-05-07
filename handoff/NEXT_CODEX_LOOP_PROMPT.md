# Next Codex Loop Prompt

Continue the AgentFlow Studio stability loop in `D:\AgentFlowStudio`.

Read first:
- `AGENTS.md`
- `.codex-parallel/PARALLEL_SUMMARY.md`
- `handoff/TEST_REPORT.md`
- `handoff/TASK_STATUS.md`
- `handoff/CURRENT_CONTEXT_FOR_ANY_MODEL.md`

Current verified deliverable:
- Static fallback is the active usable scheme.
- Launch with `D:\AgentFlowStudio\start-agentflow-static.bat`.
- Desktop shortcut exists at `C:\Users\至亲\Desktop\AgentFlow Studio.lnk`.
- Shortcut target is `D:\AgentFlowStudio\start-agentflow-static.bat`.
- Shortcut icon is `D:\AgentFlowStudio\assets\icon.ico,0`.

Known environment limitation in the last main Codex run:
- `npm.cmd run dev`, `dev:web`, `test`, `build`, and `build:web` all failed at Vite/Vitest config loading with esbuild `spawn EPERM`.
- Direct `node_modules\.bin\esbuild.cmd --version` worked.
- Treat this as a Windows/sandbox/antivirus child-process restriction unless reproduced in a normal terminal.

Start by running:

```bat
cd /d D:\AgentFlowStudio
npm.cmd install
npm.cmd run icon
npm.cmd run typecheck
npm.cmd run smoke
npm.cmd run verify
```

Then, in a normal unrestricted Windows terminal if possible, retry:

```bat
npm.cmd run test
npm.cmd run build
npm.cmd run dev
```

If Electron works, switch `scripts/create-shortcut.ps1` launcher priority back to packaged exe > Electron > Web > Static and rerun `npm.cmd run shortcut`.

If Electron remains blocked, keep Static as the deliverable and work on:
1. Prompt Lab and SharedMemoryHub context generation so Shared Memory Context is injected reliably.
2. Main-process recursive redaction for memory create/update/import/export/generateContext.
3. Route-level ErrorBoundary in `src/renderer/App.tsx`.
4. Lint warning cleanup without disabling lint.
5. Packaging once `npm.cmd run build` works outside the EPERM-restricted environment.

Do not rebuild from scratch. Do not delete handoff. Do not remove Shared Memory Hub. Use `npm.cmd`, not `npm`, from PowerShell.
