# Validation Report

Date: 2026-05-09

Branch: `codex-liquid-glass-ui-agent-optimization`

Baseline tag: `codex-liquid-glass-ui-base-20260509-172941`

## Summary

Liquid Glass UI and workflow onboarding pass is validated. Static fallback remains the protected stable user entry.

## Commands

| Command | Status | Notes |
|---|---:|---|
| `npm.cmd install` | PASS | Dependencies up to date. `npm audit` reports 17 existing vulnerabilities; no dependency churn in this UI pass. |
| `npm.cmd run typecheck` | PASS | TypeScript passed. |
| `npm.cmd run lint` | PASS | 0 errors, 25 existing warnings under threshold after concurrent ProjectDetail edits. |
| `npm.cmd run smoke` | PASS | 132/132 checks passed, including Liquid Glass tokens and workflow rail markers. |
| `node --check static-app\app.js` | PASS | Static fallback JS syntax valid. |
| `npm.cmd run test -- tests/unit/apiRuns.test.ts` | PASS | New Agent run record API regression passed: 1 file, 3 tests. |
| `npm.cmd run test` | PASS | Vitest: 11 files, 116 tests passed. |
| `npm.cmd run build` | PASS | Renderer and Electron build passed; existing ECharts/Charts chunk-size warning only. |
| `npm.cmd run test:launch-static` | PASS | Static launcher returned HTTP 200 and validated localized/static markers. |
| `npm.cmd run test:static-browser` | PASS | Browser smoke passed, including Liquid Glass shadow/blur, workflow rail, Agent run record save flow, 1024x680, and 390x844 checks. |
| `npm.cmd run test:electron-startup` | PASS | Electron ready marker captured with project-local userData. |
| `npm.cmd run test:e2e` | PASS | React Playwright suite passed 7/7, including ProjectDetail Agent run record save flow. Earlier parallel local-service run hit `127.0.0.1:5173` connection refused. |
| `npm.cmd run verify` | PASS | 100/100 build completeness checks, then smoke 132/132. |

## UI Verification

- React and static fallback now share Liquid Glass token concepts: glass surface, hover surface, border, highlight, inner stroke, shadow, focus ring.
- React Dashboard and static Dashboard both show a next-step CTA.
- Lifecycle rail shows: Idea, Plan, Tasks, Prompt, Safety, Logs, Memory, Handoff.
- Static browser smoke verified no obvious overflow at `1024x680`.
- Static browser smoke verified no horizontal overflow at `390x844` for Dashboard, Projects, and Settings.
- Static browser smoke verified no browser console errors, page errors, or network failures.
- Agent run record workflow is covered in React E2E, static browser smoke, and focused `api.runs` unit regression; it stores local run metadata only and does not execute commands.

## Known Warnings

- `npm.cmd run lint` still reports 25 warnings around pre-existing `any` and one hook dependency warnings.
- `npm.cmd run build` still reports the existing non-failing Charts chunk-size warning.
- `npm.cmd install` reports existing dependency audit issues; not changed in this UI pass.

## Remaining Work

1. Navigate newly created projects directly to Project Detail.
2. Add Settings runtime status and provider test feedback.
3. Add Prompt Lab post-generation next actions and optional run recording.
4. Add unit gate for i18n mojibake.
5. Harden E2E server lifecycle to avoid parallel `5173` contention.
