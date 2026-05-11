# Project Progress

## Current Position

Project directory: `D:\AgentFlowStudio`  
Current product name: **LocalAI Nexus / 本地 AI 中枢**  
Subtitle: **Local AI Gateway, Runtime & AgentOps Hub**  
Branch: `refactor-localai-nexus`

## 2026-05-11 Lightweight UI Refactor

### Goal

This round changed the UI direction from Liquid Glass-style visuals to a lightweight desktop configuration tool: simple, clear, compact, low-chroma, and comfortable for long-running developer work.

### CC Switch / cc-switch Study Conclusions

- Keep provider, gateway, MCP, prompts, skills, sessions/logs, and status close to the controls they affect.
- Prefer compact configuration panels, direct lists, inline status, and explicit active context.
- Use restrained color and low-interference badges rather than decorative visual effects.
- Treat the product as an operations tool: scanability and predictable workflows matter more than dramatic styling.
- Do not copy CC Switch assets, logo, icons, trademarks, or code; only the layout and density principles informed this refactor.

### Completed UI Changes

- Replaced the global renderer color system with flat surface tokens for light and dark mode.
- Removed default KaiTi typography and switched to a professional system font stack for Chinese/English readability.
- Renamed the shared card primitive from `GlassCard` to `SurfaceCard` and moved call sites to `surface-card`.
- Flattened sidebar, topbar, cards, buttons, inputs, textarea, badges, empty states, modals, task board, and table/list styling.
- Reworked key pages toward tool-like surfaces: Dashboard, Projects, Workflows, PromptLab, Shared Memory, Git, Admin, Settings, and Safety.
- Reworked `static-app` fallback CSS to match the flat token system.
- Updated E2E and smoke tests to assert no backdrop blur and the presence of flat surface primitives.
- Regenerated app icons as a simpler geometric node mark without glass wording or glass-style SVG layers.
- Re-associated the desktop shortcut with the latest built Electron entry and verified the `.lnk` target through COM inspection.

### Not Completed In This UI Round

- Some historical demo text still contains mojibake unrelated to this refactor; typecheck/build/tests pass, but a future content cleanup pass should normalize those strings.
- Full provider forwarding, streaming, token quota UI, and advanced Agent/Workflow execution remain product roadmap work, not UI polish.

### Validation Snapshot

| Command | Result | Notes |
|---|---:|---|
| `git status -sb` | PASS | Branch `refactor-localai-nexus`; working changes present before final commit. |
| `npm.cmd run icon` | PASS | Minimal icon regenerated. |
| `npm.cmd run typecheck` | PASS | TypeScript passed after restoring corrupted UI strings. |
| `npm.cmd run lint` | PASS | 0 errors, 20 warnings under threshold. |
| `npm.cmd run test` | PASS | 25 files / 180 tests passed. |
| `npm.cmd run build` | PASS | Renderer and Electron builds passed; Vite chunk warnings are non-fatal. |
| `npm.cmd run smoke` | PASS | 184/184 smoke checks passed. |

### Next UI Suggestions

1. Do a copy/encoding cleanup pass for historical demo and Chinese strings.
2. Add focused visual snapshots for Dashboard, Projects, Workflows, PromptLab, Memory, Git, Admin, and Settings.
3. Continue replacing ad hoc page-level utility class clusters with shared list/table/form components.

LocalAI Nexus evolved from AgentFlowStudio in place. `.git`, history, JSON storage, Shared Memory Hub, Electron security boundaries, and compatibility launchers were preserved.

## Current Architecture State

- Electron + React + TypeScript app is still the desktop shell.
- Main-process domain services now include Local Gateway, usage, health, router, runtime profiles, and prompt skill testing.
- Renderer uses the secure preload bridge; sensitive provider values remain main-process controlled and masked for renderer display.
- Local Gateway starts on app ready and listens at `http://127.0.0.1:8317`.
- Static fallback remains available as a recovery path, but the primary desktop shortcut now points directly to the built Electron runtime.

## Completed

- Renamed package/product/window/UI surface to LocalAI Nexus.
- Rebuilt icon assets: `assets/localai-nexus.svg`, `assets/localai-nexus.png`, `assets/localai-nexus.ico`, plus compatibility aliases.
- Updated Electron BrowserWindow icon and electron-builder Windows icon path.
- Created/verified `C:\Users\至亲\Desktop\LocalAI Nexus.lnk`.
- Removed the old desktop shortcut `C:\Users\至亲\Desktop\AgentFlow Studio.lnk`.
- Avoided `.bat` console popup in the primary shortcut by targeting `node_modules\electron\dist\electron.exe` with `dist-electron\main\index.js` as arguments.
- Added LocalAI Nexus Dashboard status cards and first-run actions.
- Added Local Gateway endpoints: `/health`, `/v1/models`, `/v1/chat/completions`, `/v1/responses`, `/responses`, `/v1/messages`.
- Added `/responses` Base URL diagnostic instead of unexplained 404.
- Added basic Token usage records and summaries.
- Added Provider health configuration diagnostics.
- Added Runtime Profile generation for Codex, Claude Code, CLI, and custom profiles.
- Added Prompt Skill create/test support with usage attribution.
- Updated E2E/static tests for LocalAI Nexus expectations.
- Updated README, architecture plan, structure audit, worklog, test report, and next steps.

## In Progress

- Provider Hub first-class page polish.
- Token Center full pool/quota/cooldown/concurrency UI.
- Health Monitor live upstream probes.
- Local Gateway live upstream forwarding and streaming.
- Runtime Switcher one-click writes to external client config.
- Agent Studio and Workflow Studio live provider/tool execution.
- Security Center exportable reports and deeper provider risk scoring.

## Not Completed Yet

- Real upstream Provider forwarding.
- Streamed chat/responses output.
- Full token pool with daily/monthly quota enforcement.
- Cost/latency optimized routing and sticky sessions.
- Full MCP/Tool/Composite Skill execution.
- Production installer smoke after packaging with `npm.cmd run dist`.

## Known Issues / Risks

- Gateway responses are diagnostic/mock-style until upstream forwarding is completed.
- Health checks validate local configuration, not remote provider behavior.
- Some internal compatibility names remain (`window.agentflow`, `agentflow-data`, `start-agentflow*.bat`) to avoid breaking storage, preload bridge, and existing launch paths.
- Historical handoff/archive files still mention AgentFlow Studio as history; active product docs and visible launch UI use LocalAI Nexus.
- Existing npm audit dependency vulnerabilities remain outside this refactor scope.

## Latest Verified Commands

| Command | Result |
|---|---:|
| `npm.cmd install` | PASS |
| `npm.cmd run icon` | PASS |
| `npm.cmd run typecheck` | PASS |
| `npm.cmd run lint` | PASS |
| `npm.cmd run test` | PASS |
| `npm.cmd run build` | PASS |
| `npm.cmd run test:e2e` | PASS |
| `npm.cmd run test:launch-static` | PASS |
| `npm.cmd run test:static-browser` | PASS |
| `npm.cmd run test:electron-startup` | PASS |
| `npm.cmd run test:electron-auth-bridge` | PASS |
| `npm.cmd run verify` | PASS |
| Gateway direct Electron smoke | PASS |

## Current Desktop Entry State

- Shortcut name: `LocalAI Nexus.lnk`
- Target: `D:\AgentFlowStudio\node_modules\electron\dist\electron.exe`
- Arguments: `"D:\AgentFlowStudio\dist-electron\main\index.js"`
- Working directory: `D:\AgentFlowStudio`
- Icon: `D:\AgentFlowStudio\assets\localai-nexus.ico,0`
- Old shortcut: removed.

## Current Icon State

- Canonical icon: `assets/localai-nexus.ico`
- Source SVG: `assets/localai-nexus.svg`
- PNG: `assets/localai-nexus.png`
- Static fallback icon: `static-app/assets/localai-nexus.svg`
- Legacy `assets/icon.*` aliases retained for compatibility only.

## Startup Popup Check

- Primary desktop shortcut targets Electron directly, so no launcher console window is expected from the shortcut.
- Electron default production launch loads `dist/index.html`.
- DevTools are skipped through the launcher environment.
- Electron startup smoke passed.
- No extra Electron window, external browser tab, or old welcome popup was found in the verified primary startup path.

## Latest Commit Record

Prepared final commit message for this session:

```text
refactor: evolve AgentFlowStudio into LocalAI Nexus
```

## Next Step Plan

1. Commit and push `refactor-localai-nexus`.
2. Continue next round with live Provider forwarding, streaming, full Token Center UI, and richer Agent/Workflow execution.
