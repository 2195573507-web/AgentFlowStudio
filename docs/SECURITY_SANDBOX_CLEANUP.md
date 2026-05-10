# Security, Sandbox, And Cleanup Notes

Updated: 2026-05-10

## Durable Secret Storage

- Provider API keys are wrapped in the Electron main process with `safeStorage`.
- The renderer only receives masked key labels such as `Saved key ending in 1234`.
- Existing plaintext provider keys are lazily migrated when providers are listed.
- The active renderer session token remains main-process only. A protected session envelope is stored in settings for restart recovery, but `auth.activeSessionSecret` is blocked from renderer settings reads and writes.
- If OS encryption is unavailable, provider key writes fail closed and session recovery degrades to memory-only with an audit warning.

## Workflow Sharing ACL

- Projects are the current workflow resource boundary.
- Project create stamps owner metadata and a private owner ACL.
- Dedicated IPC channels manage sharing: `project:acl:get` and `project:acl:update`.
- `project:update` no longer accepts `acl` or `ownerUserId` from renderer payloads.
- ACL updates require owner/admin resource access in the main process. The Project Detail sharing panel is only a UI guard.

## MCP Runtime Gateway

- `mcp:gateway:evaluate` evaluates a tool request before runtime execution.
- Decisions require exact allowlist matches and validated server/tool names.
- The current sandbox policy is explicit deny-by-default: no network, read-only filesystem, no command execution, and a 64 KiB argument limit.
- Gateway decisions are recorded in audit logs and run events.
- This is a broker/control boundary, not an arbitrary command execution surface.

## Audit Export Manifest

- Audit events still use the existing SHA-256 hash chain.
- Full audit export now includes a manifest with event count, chain head hash, integrity hash, checkpoint hash, and manifest hash.
- The manifest is tamper-evident inside the exported JSON. It is not yet backed by an external key or append-only remote checkpoint.

## Cleanup

- Removed generated `src/shared/types.js` and `src/shared/types.js.map` from the source tree.
- Strengthened `scan:mojibake` to catch common historical mojibake markers.
- Root planning files and explicitly allowlisted legacy docs remain because they are part of the handoff/history workflow.
