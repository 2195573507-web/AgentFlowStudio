# Security Rebuild Review

Date: 2026-05-10.

## Reviewed Areas

- Renderer token and API key persistence.
- Preload bridge exposure.
- IPC permission policy.
- Provider secret storage and masking.
- Memory context ACL.
- Config export/import privileges.
- Audit logging.
- MCP allowlist gateway.
- Workflow run audit and trace.

## Fixed This Round

1. `memory:generateContext` now filters memories through project ACL instead of returning all active memories.
2. Ordinary users can no longer import MCP allowlists or skills registry entries through config import.
3. Config export is role-aware: ordinary users only export visible projects/resources and do not receive provider workspace config, MCP allowlist, or skills registry.
4. Workflow create/save/run channels require authenticated project permissions and write audit records.

## Existing Protections Kept

- Default admin `123@admin.com / 123456` is hashed at rest and marked `mustChangePassword`.
- Users with `mustChangePassword` can only call logout/session/changePassword before using the workspace.
- Provider API keys are protected through main-process secure storage envelope where available.
- Renderer receives masked provider keys.
- Preload does not expose raw `ipcRenderer`.
- Permission denials are audited.
- Skill reads are constrained to `SKILL.md` under `.agents/skills`.

## Residual Risks

- The default admin password is public by requirement. Mitigation: forced first-login password change and clear UI warning. Future improvement: one-time generated setup secret.
- Dev IPC origin guard currently trusts localhost/file origins. Future improvement: pin to actual Vite dev origin and block navigation.
- Preload exposes a broad app API; main IPC permissions remain the enforcement layer. Future improvement: route-scoped capabilities and recent-auth checks for sensitive admin/secret operations.
- npm audit reports dependency vulnerabilities. They need dependency review because `npm audit fix --force` may introduce breaking changes.

## Verification

- `npm.cmd run typecheck`: PASS after fixes.
- Unit workflow runtime coverage added.
- `npm.cmd test`: PASS, 24 files / 177 tests.
- `npm.cmd run build`: PASS, renderer and Electron builds complete with non-fatal Vite warnings.
- `npm.cmd run lint`: PASS, 0 errors / 25 warnings under threshold.
- `npm.cmd run test:e2e`: PASS, 16/16 Playwright scenarios, including ordinary-user admin denial, provider settings, workflow run, Timeline / Trace, and redacted run export.
