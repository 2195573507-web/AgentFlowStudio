# AgentFlowStudio Validation Report

## Session
- Date: 2026-05-09
- Branch: `codex-static-quality-pass`
- Starting commit: `fb442d686b21c993887c0d60c5c3a3a107d21d5d`
- Version under validation: `1.1.0`

## Validation Matrix

| Area | Method | Status | Notes / Fix |
|---|---|---:|---|
| Git baseline | `git status -sb`, branch, HEAD, remote | PASS | Started clean on `codex-static-quality-pass`, remote `https://github.com/2195573507-web/AgentFlowStudio.git`. |
| Dependency install | `npm install` | PASS | Dependencies already up to date; audit output saved under `.codex-parallel/logs/`. |
| TypeScript | `npm.cmd run typecheck` | PASS | Re-run after Dashboard, Electron, and script changes. |
| Lint | `npm.cmd run lint` | PASS | 0 errors, 36 pre-existing warnings. PromptLab lint error fixed. |
| Unit tests | `npm.cmd run test` | PASS | Vitest suite passed after redaction test additions. |
| Build | `npm.cmd run build` | PASS | Renderer and Electron main/preload build pass; Vite reports only chunk-size warning for Charts. |
| Static launch | `npm.cmd run test:launch-static` | PASS | Verifies launcher files, HTTP 200, keyword coverage, and server process liveness. |
| Static browser workflow | `npm.cmd run test:static-browser` | PASS | Browser smoke covers dashboard, project create, Prompt Lab, Log Analyzer, SafetyBox, Shared Memory, Skills, Git Timeline, Settings, persistence, redaction, layout, and console/network/page errors. |
| React web E2E | `npm.cmd run test:e2e` | PASS | 5/5 Playwright tests passed using project-local browser cache. |
| Electron startup | `npm.cmd run test:electron-startup` | PASS | Real Electron startup reached ready marker using project-local userData. Fixed ESM `__dirname` startup bug. |
| Long-run stability | `npm.cmd run test:long-run` | PASS | 30.04 minutes, 31 samples, no crash/errors/network failures, JS heap delta 0.00 MB. |
| Homepage/dashboard | E2E + browser smoke | PASS | Loads without serious browser errors; Dashboard icon render crash fixed. |
| New-user flow | Code + E2E | PASS | Added Dashboard "新手启动路径" with project, settings, and prompt steps. |
| Main buttons | Browser smoke + E2E navigation | PASS | Primary navigation and quick flows were clicked and validated. |
| Page transitions | E2E + long-run | PASS | Dashboard, Projects, Prompt Lab, Log Analyzer, SafetyBox, Shared Memory, Skills, Git Timeline, Settings verified. |
| Settings persistence | Browser smoke + E2E | PASS | Theme/language persisted across reload; API key redaction verified. |
| Dark/light mode | E2E + browser smoke | PASS | Theme cycle persisted; CSS variables and Liquid Glass remain active. |
| Chinese/English mode | E2E + browser smoke | PASS | Language toggle persisted and navigation changed to English. |
| Liquid Glass style | E2E + browser smoke | PASS | Backdrop blur detected on shell/panel; `GlassCard`/glass CSS retained. |
| Static fallback | Launch, browser smoke, long-run | PASS | `start-agentflow-static.bat -> scripts/static-server.js static-app 4173` remains protected and verified. |
| Error clarity | Static render fallback + React ErrorBoundary | PASS | Route-level ErrorBoundary exists; static render error fallback retained. |
| Refresh/persistence | E2E + browser smoke | PASS | Theme/language and static localStorage state survive reload. |
| Console errors | E2E + browser smoke + long-run | PASS | No serious console errors after fixes. |
| Network failures | E2E + browser smoke + long-run | PASS | No request failures reported. |
| Layout at 1024x680 | Static browser smoke screenshot/check | PASS | No obvious element overflow in static fallback. |
| Font | Source review + E2E | PASS | Unified mixed Chinese/English font stack in renderer base CSS. |
| API-key security | Unit + browser smoke + source review | PASS | Provider API keys masked for renderer, not prefilled when editing, memory/export paths sanitized. |

## Feature Notes
- Electron is now actually startable in this environment through the smoke path, with user data redirected inside `D:\AgentFlowStudio\.codex-parallel`.
- The static fallback remains the stable user-facing recovery entry and passed the longest runtime test.
- Some features are intentionally local-only or fallback/demo based in web/static mode; real file/git/native operations remain IPC-backed in Electron.

## Current Result
All requested core usability, startup, fallback, security, UI, and long-run validations have passed. Final commit/tag/push is still pending at the time this report section was written.
