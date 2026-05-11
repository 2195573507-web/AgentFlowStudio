# LocalAI Nexus - Current Handoff

## What Changed

The project has moved beyond the earlier workflow rebuild stage into LocalAI Nexus:

- First-class AI resource and runtime pages.
- Provider Hub, Token Center, Health Monitor, Model Router, Local Gateway, Runtime Switcher, Diagnostics.
- Agent Studio, Workflow Studio, Shared Memory, Security Center, Ecosystem.
- Domain services for provider, gateway, router, runtime, memory/context, security, and local bundles.
- Expanded test/smoke/verify/E2E coverage.

## How To Start

```powershell
Set-Location D:\AgentFlowStudio
npm.cmd run build
D:\AgentFlowStudio\start-agentflow.bat
```

Desktop shortcut:

```text
C:\Users\至亲\Desktop\LocalAI Nexus.lnk
```

## Quality Gates

Use `npm.cmd` on this machine:

```powershell
npm.cmd run typecheck
npm.cmd run test
npm.cmd run verify
```

Latest closeout:

- `npm.cmd run typecheck`: PASS.
- `npm.cmd run test`: PASS, 25 files / 182 tests.
- `npm.cmd run verify`: PASS, 130/130 plus smoke 210/210.

## Known Remaining Work

- Live provider smoke with user-supplied credentials.
- Real upstream streaming and cancellation.
- Deeper token policy enforcement.
- Advanced Agent/Workflow controls.
- Packaging once electron-builder can download Electron.
