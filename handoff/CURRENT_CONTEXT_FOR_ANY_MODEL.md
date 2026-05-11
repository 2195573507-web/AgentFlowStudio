# Current Context - LocalAI Nexus

## Latest State - 2026-05-11

Workspace: `D:\AgentFlowStudio`
Branch: `refactor-localai-nexus`
Product: LocalAI Nexus

The active deliverable is the built Electron LocalAI Nexus app. Static fallback remains available for recovery only.

## Current Shortcut

```text
C:\Users\至亲\Desktop\LocalAI Nexus.lnk
TargetPath: D:\AgentFlowStudio\node_modules\electron\dist\electron.exe
Arguments: "D:\AgentFlowStudio\dist-electron\main\index.js"
WorkingDirectory: D:\AgentFlowStudio
IconLocation: D:\AgentFlowStudio\assets\localai-nexus.ico,0
```

## Verified

- `npm.cmd run typecheck`: PASS.
- `npm.cmd run lint`: PASS.
- `npm.cmd run test`: PASS.
- `npm.cmd run smoke`: PASS.
- `npm.cmd run verify`: PASS.
- `npm.cmd run build`: PASS.
- `npm.cmd run test:e2e`: PASS.
- `npm.cmd run test:static-browser`: PASS.
- `npm.cmd run test:launch-static`: PASS.
- `npm.cmd run test:electron-startup`: PASS.
- `npm.cmd run test:electron-auth-bridge`: PASS.
- `npm.cmd run test:long-run`: PASS.
- `npm.cmd run shortcut`: PASS.
- Shortcut COM inspection: PASS.
- Gateway HTTP smoke: PASS.

## Environment-Limited

`npm.cmd run dist` passed the application build step, then electron-builder failed to download the Electron `v33.4.11` Windows artifact from GitHub due network timeout / `ERR_ELECTRON_BUILDER_CANNOT_EXECUTE`.

## Current Product Surfaces

- Dashboard
- Provider Hub
- Token Center
- Health Monitor
- Model Router
- Local Gateway
- Runtime Switcher
- Diagnostics
- Skill Hub
- Agent Studio
- Workflow Studio
- Shared Memory
- Security Center
- Ecosystem
- Git/Handoff
- Admin
- Settings

## Important Constraints

- Do not rebuild from scratch.
- Do not remove Shared Memory Hub.
- Preserve JSON storage.
- Preserve Electron security invariants.
- Preserve `window.agentflow` compatibility.
- Use `npm.cmd`, not plain `npm`, from PowerShell.

## Next Best Work

Continue from `docs/LOCALAI_NEXUS_NEXT_ITERATION_PLAN.md`: live provider confidence, streaming/cancellation, token policy enforcement, Agent/Workflow controls, memory graph/recovery packs, and packaging/release hardening.
