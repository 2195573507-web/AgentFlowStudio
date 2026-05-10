# AgentFlow Studio Rebuild Journey

This file is the primary construction log for the AgentFlowStudio rebuild. Every stage should update it with baseline, design rationale, files changed, verification, commits, push state, and next recommendations.

## 1. Current Project Baseline

- Project path: `D:\AgentFlowStudio`
- Current branch: `codex-rebuild-from-mainline`
- Previous branch at takeover: `codex-security-sandbox-cleanup`
- Current remote: `origin https://github.com/2195573507-web/AgentFlowStudio.git`
- Baseline recent commit before rebuild branch: `b9674c6 docs: close security sandbox cleanup plan`
- Initial worktree state: dirty before this task, including existing changes in `src/main/ipc.ts`, `src/main/preload.ts`, `src/main/storage.ts`, renderer settings/skills/styles, shared types, static styles, tailwind config, and tests.
- Startup mode: `npm run dev` for Electron/Vite, `npm run dev:web` for web fallback, `npm run serve:static` for static fallback.
- PowerShell note: use `npm.cmd` in this environment because `npm.ps1` is blocked by execution policy.

## 2. Current Available Features

- Login/session foundation with default admin `123@admin.com`.
- Default admin password is hashed and marked `mustChangePassword`.
- RBAC permissions for admin/user roles.
- Admin user management and audit log page.
- Project creation, planning, prompt generation, shared memory, safety checks, git timeline, settings/providers, skills registry.
- Provider API keys are masked for renderer and protected in main process storage when possible.
- Audit hash chain and run event mirroring exist.
- Baseline unit tests and build pass before the rebuild edits.

## 3. Current Failed or Weak Features

- New user path is still fragmented across many feature pages.
- Workflow is not yet a first-class model with template creation, node editing, versioning, and runtime trace.
- Existing Chinese UI has mojibake in several files.
- Diagnostics and human simulation reports are incomplete for the rebuild target.
- Dedicated architecture folders `core`, `auth`, `audit`, `secrets`, `mcp`, `storage`, and `templates` are not yet explicit enough.
- Security review for the full rebuild is not yet documented.
- `npm install` via `npm.ps1` fails due PowerShell execution policy; `npm.cmd install` works.

## 4. Current Test Status

| Command | Status | Result |
| --- | --- | --- |
| `npm.cmd install` | PASS | Dependencies already up to date. npm audit reports 17 vulnerabilities in dependency tree. |
| `npm.cmd test` | PASS | 23 test files, 174 tests passed. |
| `npm.cmd run build` | PASS | Vite and Electron builds pass with non-fatal chunk/dynamic import warnings. |

## 5. Why Push-Down Rebuild Is Needed

AgentFlowStudio has strong early components, but the product line is still a feature pile: planner, prompt lab, logs, safety, memory, skills, settings, admin, and git are useful but not composed into a beginner path. A new user must infer the sequence themselves. The rebuild turns the app into a local-first Agent Workflow Studio where the main path is visible and executable:

First launch -> login/admin initialization -> dashboard -> create project -> choose template or blank workflow -> configure provider/API key -> edit nodes -> run workflow -> inspect timeline/trace -> fix errors -> save version/export/share -> admin/audit/diagnostics.

## 6. Competitor Study Status

In progress. The rebuild study will be written to `docs/COMPETITOR_MAINLINE_REBUILD_STUDY.md` and cover Flowise/AgentFlow V2, Dify, Langflow, n8n, Coze/Coze Studio, FastGPT, Open WebUI, OpenAI Agents SDK/Agent Builder, and lightweight config switchers.

## 7. New Mainline Design

- Dashboard becomes a beginner navigation page with explicit next actions: create project, use template, configure provider, run sample, view recent runs, view diagnostics.
- Workflows become first-class local objects with nodes, edges, versions, templates, runs, and trace.
- Main process remains the security boundary; renderer only calls preload APIs.
- IPC policy requires authentication and permissions for all non-public channels.
- Audit records permission denials, admin changes, provider/secret operations, and workflow runs.
- Provider secrets stay in main process storage and are masked in renderer.

## 8. Stage Log

### Stage 1 - Baseline and Journey

- Files changed: `BUILD_JOURNEY.md`, `task_plan.md`, `findings.md`, `progress.md`.
- Why: establish persistent rebuild history and recovery context before code changes.
- Tests: baseline `npm.cmd test` and `npm.cmd run build` passed before edits.
- Problems found: `npm.ps1` blocked; `rg.exe` access denied; worktree already dirty.
- Fixes: switched to `npm.cmd`; used PowerShell discovery instead of `rg`.
- Remaining issues: competitor study, architecture doc, workflow runtime, UI mainline, security review, human simulation, final handoff.
- Commit hash: pending.
- Pushed: pending.

### Stage 2 - Competitor Study and Architecture Plan

- Files changed: `docs/COMPETITOR_MAINLINE_REBUILD_STUDY.md`, `docs/REBUILD_ARCHITECTURE_PLAN.md`.
- Why: turn Flowise/Dify/Langflow/n8n/Coze/FastGPT/Open WebUI/OpenAI Agents/cc switch learnings into AgentFlowStudio's local-first workflow mainline.
- Tests: documentation only; no runtime tests required for this stage.
- Problems found: existing product had features but not a clear user journey.
- Fixes: defined the mainline and architecture boundaries.
- Remaining issues: diagnostics UI, deeper E2E workflow simulation, broader mojibake cleanup.
- Commit hash: pending.
- Pushed: pending.

### Stage 3 - Workflow Runtime, IPC, UI, and Security Fixes

- Files changed: `src/shared/workflowTypes.ts`, `src/core/workflowRuntime.ts`, `src/templates/workflowTemplates.ts`, `src/main/ipc.ts`, `src/main/preload.ts`, `src/main/storage.ts`, `src/shared/types.ts`, `src/shared/auditTypes.ts`, `src/renderer/lib/api.ts`, `src/renderer/lib/types.ts`, `src/renderer/App.tsx`, `src/renderer/components/Sidebar.tsx`, `src/renderer/lib/i18n.ts`, `src/renderer/routes/Workflows.tsx`, `tests/unit/workflowRuntime.test.ts`.
- Why: make Workflow a first-class object with templates, node editing, versioning, run, timeline, and audit.
- Tests: `npm.cmd run typecheck` passed after type fixes; focused workflow runtime test pending in final validation.
- Problems found: memory context ACL bypass and config import/export privilege issues.
- Fixes: memory context now filters through ACL; non-admin config import blocks MCP/skills; non-admin config export filters privileged workspace resources.
- Remaining issues: full E2E workflow test, diagnostics page, older mojibake cleanup.
- Commit hash: pending.
- Pushed: pending.

## 9. Next Stage Suggestions

1. Add competitor study document and architecture plan.
2. Add shared workflow models and pure runtime tests.
3. Add main/preload/renderer workflow APIs with permission and audit.
4. Rebuild Dashboard and add `/workflows` beginner workbench.
5. Add security and human simulation reports.
6. Re-run quality gates, commit, and push.

## 10. Final Rebuild Validation - 2026-05-10

- Branch: `codex-rebuild-from-mainline`.
- Remote: `origin https://github.com/2195573507-web/AgentFlowStudio.git`.
- Startup commands: `npm.cmd run dev` for Vite/Electron development, `npm.cmd run dev:web` for web E2E/dev preview.
- New mainline landed: login -> Dashboard beginner navigation -> project -> workflow template -> provider settings -> node edit -> workflow run -> Timeline / Trace -> version history -> admin/audit.
- Workflow node coverage: Start, Prompt, LLM, Tool, Condition, Human Approval, Output.
- Security fixes landed: workflow IPC permission checks, workflow run audit, ACL-filtered memory context, admin-only privileged config import, role-aware config export, provider secrets masked at renderer boundary.
- UI fixes landed: `/workflows` workbench, Dashboard six-step newcomer navigation, Chinese/English navigation table, KaiTi-first font stack, Liquid Glass tokens retained.

### Final Quality Gates

| Command | Status | Result |
| --- | --- | --- |
| `npm.cmd run typecheck` | PASS | TypeScript passed. |
| `npm.cmd test` | PASS | Vitest: 24 files / 177 tests passed. |
| `npm.cmd run build` | PASS | Renderer and Electron builds passed; non-fatal Vite chunk/dynamic-import warnings remain. |
| `npm.cmd run lint` | PASS | 0 errors / 25 warnings, below `--max-warnings 50`. |
| `npm.cmd run test:e2e` | PASS | Playwright: 16/16 passed, including auth/admin, Dashboard, workflow run, Timeline / Trace, provider settings, project error handling, and redacted run export. |
| `npm.cmd run test:unit` | N/A | Script does not exist in `package.json`; recorded as absent. |
| `npm.cmd run test:integration` | N/A | Script does not exist in `package.json`; recorded as absent. |

### Remaining Issues

- `npm audit` still reports 17 dependency vulnerabilities; not force-fixed in this rebuild to avoid major dependency churn.
- Historical mojibake remains in older source/docs/static fallback text. The main workflow, i18n navigation, Settings/Skills/Workflows, and E2E-covered paths are usable; broad copy cleanup should be a dedicated follow-up.
- Diagnostics are present as architecture/reporting and Settings/security entry points, but a dedicated first-class Diagnostics page is still a next iteration.
- JSON storage remains local-first and simple; it does not provide database transactions or externally signed audit immutability.

### Final Stage Files Changed

- Core runtime/types/templates: `src/core/workflowRuntime.ts`, `src/shared/workflowTypes.ts`, `src/templates/workflowTemplates.ts`.
- Security/IPC/storage: `src/main/ipc.ts`, `src/main/preload.ts`, `src/main/storage.ts`, `src/shared/types.ts`, `src/shared/auditTypes.ts`.
- Renderer mainline: `src/renderer/routes/Workflows.tsx`, `src/renderer/routes/Dashboard.tsx`, `src/renderer/App.tsx`, `src/renderer/components/Sidebar.tsx`, `src/renderer/lib/api.ts`, `src/renderer/lib/types.ts`, `src/renderer/lib/i18n.ts`.
- Tests: `tests/unit/workflowRuntime.test.ts`, `tests/e2e/app.spec.ts`, plus supporting unit coverage for agent/config/provider/typography.
- Docs/handoff: `BUILD_JOURNEY.md`, `PROJECT_PROGRESS.md`, `docs/COMPETITOR_MAINLINE_REBUILD_STUDY.md`, `docs/REBUILD_ARCHITECTURE_PLAN.md`, `docs/SECURITY_REBUILD_REVIEW.md`, `handoff/FULL_PROJECT_REBUILD_CONTEXT.md`, `handoff/FULL_REBUILD_HANDOFF.md`, `handoff/TEST_REPORT.md`, `handoff/HUMAN_SIMULATION_TEST_REPORT.md`, `handoff/NEXT_ROUND_SUGGESTIONS.md`.

### Commit / Push

- Final rebuild implementation commit: pending at the time of this validation entry.
- Pushed: pending at the time of this validation entry.

## 11. Login Recovery Fix - 2026-05-10

- User-reported symptom: desktop shortcut opens the rebuilt app, but the user cannot get past login / first-login password change.
- Confirmed desktop shortcut target from the previous pass: `C:\Users\至亲\Desktop\AgentFlow Studio.lnk` -> `D:\AgentFlowStudio\start-agentflow.bat`.
- Confirmed local default admin state in Electron user data:
  - Email: `123@admin.com`
  - Password: `123456`
  - Role: `admin`
  - Status: `active`
  - `mustChangePassword`: `true`
  - `failedLoginCount`: `0`
  - `lockedUntil`: none
  - Stored password hash matches `123456`.
- Root cause found: renderer calls `api.auth.session(sessionId)`, but preload dropped the `sessionId` before invoking `AUTH_SESSION`. After restart/refresh, session restoration could fail or feel like a login loop.
- Secondary root cause found: `sessionState(sessionId)` restored the secure active token but only reused it when both `sessionId` and `token` were absent. Passing only `sessionId` from renderer left `token` empty for validation.
- UX issue found: login and first-login password-change screens did not clearly tell beginners that the default password is `123456`, and the change-password form did not explain the next fix when the current password or new password was wrong.
- Files changed:
  - `src/main/preload.ts`
  - `src/main/session.ts`
  - `src/renderer/App.tsx`
  - `src/renderer/routes/Login.tsx`
  - `BUILD_JOURNEY.md`
  - `PROJECT_PROGRESS.md`
  - `handoff/TEST_REPORT.md`
  - `handoff/FULL_REBUILD_HANDOFF.md`
- Why: unblock the real first-run path from shortcut -> login -> forced password change -> Dashboard, while keeping raw session tokens out of renderer storage.
- Fixes:
  - Preload now forwards `sessionId` to `AUTH_SESSION`.
  - Main session recovery now uses the main-process active token when renderer supplies the matching `sessionId`.
  - Login page now shows the default admin email/password and explains the first-login password change.
  - Forced password-change page now uses Chinese-first guidance, validates missing/short passwords, and translates common auth errors into concrete next steps.
- Verification:
  - `npm.cmd run typecheck`: PASS.
  - `npm.cmd test`: PASS, 24 files / 177 tests.
  - `npm.cmd run build`: PASS, with non-fatal Vite chunk/dynamic-import warnings.
  - `npm.cmd run test:e2e`: PASS, 16/16.
  - Direct `npx.cmd playwright test tests/e2e/auth.spec.ts`: blocked by occupied port `127.0.0.1:5173`; project wrapper selected `5174` and passed.
- Remaining issues:
  - Historical mojibake remains outside the touched login path.
  - Existing Vite chunk-size warnings remain non-fatal.
  - `npm audit` dependency vulnerabilities remain for a dependency maintenance pass.
- Commit hash: pending.
- Pushed: pending.
- Next recommendation: add a dedicated Electron smoke test for first-launch default admin login and forced password change using project-local userData.

## 12. Electron Launcher/Auth Bridge Fix - 2026-05-10

- Resume id: `019e109c-7293-7e81-9c09-976bf9125f93`.
- User-reported symptom: the rebuilt app opened from the desktop shortcut, but login failed with `Auth bridge unavailable`.
- Confirmed current shortcut target: `C:\Users\鑷充翰\Desktop\AgentFlow Studio.lnk` -> `D:\AgentFlowStudio\start-agentflow.bat`.
- Root cause:
  - `start-agentflow.bat` still used the dev/Vite launch path instead of directly launching the built Electron shell.
  - `npm.cmd run build` ran `tsc -p tsconfig.node.json` after Vite, overwriting Vite's bundled Electron preload with ESM output. The built renderer loaded, but `window.agentflow` was not exposed.
- Fixes:
  - `start-agentflow.bat` now launches `node_modules\electron\dist\electron.exe dist-electron\main\index.js` with `AGENTFLOW_LOAD_DIST=1`.
  - `start-agentflow-electron.bat` delegates to `start-agentflow.bat`.
  - `src/main/index.ts` treats `AGENTFLOW_LOAD_DIST=1` as production-style file loading even when Electron is not packaged.
  - `package.json` build script now uses `tsc --noEmit -p tsconfig.node.json` after Vite.
  - `vite.config.ts` forces preload output to CommonJS and inline dynamic imports.
  - Added `scripts/electron-auth-bridge-smoke.js` and `npm.cmd run test:electron-auth-bridge`.
- Verification:
  - `npm.cmd run typecheck`: PASS.
  - `npm.cmd test`: PASS, 24 files / 177 tests.
  - `npm.cmd run build`: PASS, with non-fatal Vite chunk/dynamic-import warnings.
  - `npm.cmd run lint`: PASS, 0 errors / 25 warnings.
  - `npm.cmd run verify`: PASS, 100/100 build checks and 184/184 smoke checks.
  - `npm.cmd run test:electron-startup`: PASS.
  - `npm.cmd run test:electron-auth-bridge`: PASS, built renderer loaded from `file://` and exposed `window.agentflow.auth.login`.
- Remaining issues:
  - Existing Vite chunk-size warnings remain non-fatal.
  - Historical mojibake outside touched paths remains.
  - `npm audit` dependency vulnerabilities remain for a dependency maintenance pass.
