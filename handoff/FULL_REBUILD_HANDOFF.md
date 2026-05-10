# Full Rebuild Handoff

## What Changed

AgentFlowStudio now has a first-class Workflow foundation:

- Shared workflow models.
- Beginner workflow templates.
- Deterministic local workflow runtime.
- Main-process workflow IPC with auth/RBAC/audit.
- Preload and renderer API wrappers.
- `/workflows` route for template creation, node editing, run, trace, and versions.
- Unit tests for runtime validation and error guidance.

## How To Start

```powershell
Set-Location D:\AgentFlowStudio
npm.cmd run dev
```

## Login Notes

- Desktop shortcut should open `D:\AgentFlowStudio\start-agentflow.bat`.
- Default admin account: `123@admin.com`.
- Default admin password: `123456`.
- First login intentionally opens a password-change screen. Use current password `123456`, then set a new password of at least 6 characters.
- The renderer stores only `sessionId`; the main process owns the active session token and validates all privileged IPC.

## Quality Gates

Use `npm.cmd` on this machine:

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

Final validation on 2026-05-10:

- `npm.cmd run typecheck`: PASS.
- `npm.cmd test`: PASS, 24 files / 177 tests.
- `npm.cmd run build`: PASS, with non-fatal Vite chunk/dynamic-import warnings.
- `npm.cmd run lint`: PASS, 0 errors / 25 warnings.
- `npm.cmd run test:e2e`: PASS, 16/16.
- `npm.cmd run test:unit`: script missing.
- `npm.cmd run test:integration`: script missing.

Login recovery validation on 2026-05-10:

- `npm.cmd run typecheck`: PASS.
- `npm.cmd test`: PASS, 24 files / 177 tests.
- `npm.cmd run build`: PASS, with non-fatal Vite chunk/dynamic-import warnings.
- `npm.cmd run test:e2e`: PASS, 16/16.
- Local admin data check: PASS, `123456` matches the stored default admin hash and the account is not locked.

Electron launcher/auth bridge validation on 2026-05-10:

- `start-agentflow.bat` launches the built Electron shell directly with `AGENTFLOW_LOAD_DIST=1`.
- `npm.cmd run build` keeps Vite as the owner of `dist-electron` output and uses `tsc --noEmit -p tsconfig.node.json` for Node/Electron type checking.
- The Electron preload bundle is CommonJS so `contextBridge` is available to the renderer.
- `npm.cmd run test:electron-auth-bridge`: PASS, built renderer loaded from `file://` and `window.agentflow.auth.login` existed.
- `npm.cmd run verify`: PASS, 100/100 build checks and 184/184 smoke checks.

## Known Remaining Work

- Add diagnostics page UI.
- Continue cleaning historical mojibake in older pages/static fallback copy.
- Add route grouping in Sidebar beyond the new Workflow entry.
- Review npm audit vulnerabilities.
- Improve dev origin pinning.
