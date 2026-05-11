# Findings

## Initial State
- Branch: `refactor-localai-nexus`
- Initial `git status -sb`: `## refactor-localai-nexus...origin/refactor-localai-nexus`
- Existing project folders include `src`, `static-app`, `assets`, `scripts`, `tests`, `docs`, `handoff`, `dist`, `dist-electron`, and `node_modules`.

## UI Audit
- `rg` could not run in this environment: PowerShell reported `Access is denied`; fallback was PowerShell file enumeration and `Select-String`.
- Current UI is still driven by Liquid Glass-era tokens in `src/renderer/styles.css`, `tailwind.config.ts`, and `static-app/styles.css`: glass variables, backdrop blur, radial highlights, high-shadow cards, and gradient backgrounds.
- Global default font stack uses KaiTi/STKaiti, which makes the app feel like a document/calligraphy surface instead of a professional desktop tool.
- Shared primitives still encode glass styling: `GlassCard`, `Button`, `Input`, `Textarea`, `Badge`, `Modal`, `Sidebar`, `Topbar`, `TaskBoard`, and `RiskMeter`.
- Routes contain many bespoke controls and hardcoded dark-mode utility classes, especially `Projects`, `Workflows`, `Settings`, `GitTimeline`, `PromptLab`, `SafetyBox`, and `SharedMemoryHub`.
- Several active/historical docs and route strings display as mojibake when read from PowerShell. This needs a UI-facing cleanup pass, but core logic should not be rewritten.
- Hidden hover-only project actions reduce discoverability and keyboard confidence.
- Static fallback has its own Liquid Glass-like design system and must be aligned enough to avoid a split visual language.

## CCS / cc-switch UI Principles
- Public CC Switch references describe a desktop control surface for AI coding CLIs with provider switching, MCP/prompts/skills, proxy/gateway status, session search, sync, and usage dashboards in one place.
- Useful design ideas to adopt: compact desktop-tool density, clear active context, provider/gateway/skills/logs grouped operationally, low-friction switching, inline status, masked/validated config values, explicit risky actions, and list/table-first layouts.
- Do not copy CC Switch branding, assets, icons, or code.

## Implementation Notes
- Desktop shortcut inspection found `C:\Users\至亲\Desktop\LocalAI Nexus.lnk` already targets `D:\AgentFlowStudio\node_modules\electron\dist\electron.exe` with `D:\AgentFlowStudio\dist-electron\main\index.js` arguments and the current icon.
- Required launch artifacts already exist: Electron executable, built main/preload files, renderer `dist/index.html`, and `assets/localai-nexus.ico`.
- `ui-ux-pro-max` script attempt failed because the local Python runtime resolved stdlib under `D:\AgentFlowStudio\Lib` and could not import `encodings`; continue with skill rules and manual synthesis.

## Test Notes
- Required validation after changes: `npm.cmd install` or dependency check, `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run test`, `npm.cmd run build`, `npm.cmd run test:e2e`, `npm.cmd run test:static-browser`, `npm.cmd run test:electron-startup`, `npm.cmd run test:electron-auth-bridge`, and `npm.cmd run verify`.
- Existing Playwright E2E covers dashboard, navigation, settings, skills, workflows, prompt lab, project create flow, theme/language persistence, and browser errors.
- Static browser smoke targets `static-app`, so renderer UI visual checks still need a dedicated smoke script or manual Playwright screenshot checks.
