# LocalAI Nexus - File Map

## Root

| Path | Purpose |
|---|---|
| `package.json` | Scripts, dependencies, Electron builder config, product metadata. |
| `README.md` | Current LocalAI Nexus overview and commands. |
| `CHANGELOG.md` | Release and validation history. |
| `PROJECT_PROGRESS.md` | Current progress, completed/in-progress/planned/environment-limited status. |
| `AGENTS.md` | Project rules for AI agents. |

## Source

| Path | Purpose |
|---|---|
| `src/main/index.ts` | Electron lifecycle, BrowserWindow, gateway startup. |
| `src/main/preload.ts` | Secure `window.agentflow` bridge. |
| `src/main/ipc.ts` | IPC registration, permission/security boundary. |
| `src/main/storage.ts` | JSON storage collections and write queues. |
| `src/main/domain/provider/` | Provider Hub behavior and forwarding helpers. |
| `src/main/domain/gateway/` | Local Gateway endpoint behavior. |
| `src/main/domain/router/` | Model Router decisions and trace data. |
| `src/main/domain/usage/` | Token and request usage aggregation. |
| `src/main/domain/health/` | Provider health diagnostics. |
| `src/main/domain/runtime/` | Runtime profile generation. |
| `src/main/domain/skills/` | Skill creation/test behavior. |
| `src/main/domain/memory/` | Context-pack preview and recovery support. |
| `src/main/domain/security/` | Security report/risk surfaces. |
| `src/main/domain/ecosystem/` | Local skill/template bundle registry. |
| `src/renderer/App.tsx` | Route registration and protected app shell. |
| `src/renderer/components/` | Shared UI primitives such as SurfaceCard, Button, Sidebar, Topbar. |
| `src/renderer/routes/` | Product pages and feature surfaces. |
| `src/renderer/lib/` | Renderer API wrappers, i18n, auth/session, redaction, helpers. |
| `src/shared/` | Cross-process types, IPC channels, provider presets. |

## Important Routes

| File | Surface |
|---|---|
| `src/renderer/routes/Dashboard.tsx` | Dashboard |
| `src/renderer/routes/ProviderHub.tsx` | Provider Hub |
| `src/renderer/routes/TokenCenter.tsx` | Token Center |
| `src/renderer/routes/HealthMonitor.tsx` | Health Monitor |
| `src/renderer/routes/ModelRouter.tsx` | Model Router |
| `src/renderer/routes/LocalGateway.tsx` | Local Gateway |
| `src/renderer/routes/RuntimeSwitcher.tsx` | Runtime Switcher |
| `src/renderer/routes/Diagnostics.tsx` | Diagnostics |
| `src/renderer/routes/AgentStudio.tsx` | Agent Studio |
| `src/renderer/routes/SecurityCenter.tsx` | Security Center |
| `src/renderer/routes/Ecosystem.tsx` | Local Ecosystem |

## Tests And Scripts

| Path | Purpose |
|---|---|
| `tests/unit/` | Vitest unit tests. |
| `tests/e2e/app.spec.ts` | Playwright navigation and module coverage. |
| `tests/unit/localaiNexusServices.test.ts` | LocalAI Nexus service regression tests. |
| `scripts/verify-build.js` | Build/file/API surface verification. |
| `scripts/smoke-test.js` | Broad smoke/security/UI surface checks. |
| `scripts/long-run-stability-test.js` | Static long-run stability smoke. |
| `scripts/electron-startup-smoke.js` | Electron startup check. |
| `scripts/electron-auth-bridge-smoke.js` | Preload/auth bridge check. |
| `scripts/create-shortcut.ps1` | Windows shortcut creation. |

## Docs And Handoff

| Path | Purpose |
|---|---|
| `docs/LOCALAI_NEXUS_ITERATION_PLAN.md` | Completed Iteration 0-12 plan and closeout record. |
| `docs/LOCALAI_NEXUS_NEXT_ITERATION_PLAN.md` | Next-stage plan. |
| `docs/LOCALAI_NEXUS_ARCHITECTURE.md` | Detailed architecture and verified notes. |
| `docs/PROJECT_STRUCTURE_AUDIT.md` | Structure audit and artifact treatment. |
| `docs/PROJECT_WORKLOG.md` | Worklog and decisions. |
| `docs/cleanup/cleanup-review.md` | Cleanup candidates intentionally kept for review. |
| `docs/cleanup/cleanup-report.md` | Cleanup action log and validation matrix. |
| `handoff/TEST_REPORT.md` | Latest validation evidence. |
| `handoff/NEXT_STEPS.md` | Next-round priorities. |
| `handoff/CURRENT_CONTEXT_FOR_ANY_MODEL.md` | Short context recovery file. |
| `archive/2026-05/root-progress/localai-nexus-iteration-0-12/` | Archived file-based planning and closeout logs from the completed Iteration 0-12 round. |
| `archive/2026-05/docs-history/` | Historical rebuild/refactor planning documents removed from the active docs surface. |
| `archive/2026-05/handoff-history/` | Historical handoff/rebuild snapshots removed from the active handoff surface. |
| `archive/2026-05/parallel-agents/handoff-archived-agents/` | Historical parallel-agent prompts and logs removed from active handoff. |

## Assets And Launch

| Path | Purpose |
|---|---|
| `assets/localai-nexus.*` | Canonical LocalAI Nexus icon assets. |
| `assets/icon.*` | Compatibility icon aliases. |
| `static-app/` | Recovery fallback app. |
| `start-agentflow*.bat` | Compatibility launchers. |
