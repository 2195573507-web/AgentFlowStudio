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

## Known Remaining Work

- Add diagnostics page UI.
- Continue cleaning historical mojibake in older pages/static fallback copy.
- Add route grouping in Sidebar beyond the new Workflow entry.
- Review npm audit vulnerabilities.
- Improve dev origin pinning.
