# AgentFlow Studio Static Quality Pass Plan

## Goal

Starting from baseline commit `cec7dfb`, preserve the working Static fallback while hardening language switching, theme preferences, Shared Memory prompt injection, recursive secret redaction, route error handling, tests, and handoff docs.

## Current Session Phases

| Phase | Status | Notes |
|---|---|---|
| 1. Prepare fresh agent workspace | complete | Archived old `.codex-parallel`, recreated A-G task/log files, and kept historical archived agent runs untouched. |
| 2. Agent A regression gate | complete | Required commands, COM shortcut, and real launcher HTTP checks passed; sandbox-only failures were rerun with approval. |
| 3. Parallel enhancement agents | complete | Six true subagents B-G completed read-only audits; Agent A was executed in the main thread. |
| 4. Integrate implementation | complete | Static fallback and React paths were updated without rebuilding or replacing the project. |
| 5. Final verification | complete | Required commands and real launcher HTTP checks passed; test/build remain blocked by esbuild EPERM. |
| 6. Handoff and commit | in_progress | Handoff files and `.codex-parallel\PARALLEL_SUMMARY.md` updated; commit is next. |
| 7. Fix launcher log file locking | complete | Static launcher now uses per-run logs and no longer redirects the long-running server output into `launcher-static.log`; locked legacy log regression passed. |
| 8. Liquid Glass UI and workflow onboarding | complete | React/static glass tokens unified, Dashboard next-step CTA and lifecycle rail added, reports updated, and full validation passed. |
| 9. Commit and push Liquid Glass round | in_progress | Stage, commit, and push `codex-liquid-glass-ui-agent-optimization`. |
| 10. Auth/admin/RBAC/audit platform phase | complete | Local hashed users, sessions, RBAC-gated IPC, admin UI, audit logs, tests, docs, and validation completed. Commit/push remains in git phase. |
| 11. Platform security hardening | complete | Renderer token persistence removed, main-process password-change gate added, resource ACL, audit hash chain/retention/export integrity, run timeline, MCP allowlist, static fallback auth gate, mojibake scan, docs, and validation completed. |

## Acceptance Checklist

- Static fallback files remain present: `start-agentflow-static.bat`, `scripts\static-server.js`, `static-app`, `assets\icon.ico`.
- Desktop shortcut remains present and points to `D:\AgentFlowStudio\start-agentflow-static.bat`.
- `npm.cmd run icon`, `smoke`, `typecheck`, `test:launch-static`, and `shortcut` pass.
- Real `cmd /k start-agentflow-static.bat` launch returns HTTP 200 and includes required Chinese navigation keywords.
- Default UI is Chinese, with topbar Chinese/English switch and topbar light/dark/system theme switch.
- Settings contains Interface Preferences in both languages and persists `agentflow.language` and `agentflow.theme`.
- Shared Memory Hub can create/search/archive memories and generate a recovery context prompt.
- Prompt Lab can inject `[Shared Memory Context]` using off/minimal/balanced/full modes.
- Recursive secret redaction covers strings, arrays, objects, nesting, circular references, memory save/export/injection, and API key display.
- Page render errors show a route-level fallback rather than white-screening the app.
- Smoke and launch-static tests cover this quality pass.
- Handoff docs and A-G logs are updated.
- Git contains at least one commit for this round.

## Errors Encountered

| Error | Attempt | Resolution |
|---|---|---|
| `git switch -c codex-static-quality-pass` failed with `.git` ref lock permission denied under sandbox. | Branch creation | Re-ran with approved escalation and created the branch successfully. |
| `npm.cmd run test` failed at Vite/Vitest config load with esbuild `spawn EPERM`. | Post-change optional verification | Recorded as environment limitation; Static fallback verification is not blocked. |
| `npm.cmd run build` failed at Vite config load with esbuild `spawn EPERM`. | Post-change optional verification | Recorded as environment limitation; Static fallback verification is not blocked. |
| Playwright Chromium executable was missing. | Browser click check | Recorded as environment limitation; HTTP, launch-static, and Node VM static checks were used instead. |
| `The process cannot access the file because it is being used by another process.` during static launch. | User-reported launcher run | Fixed by separating per-run launcher/server logs and avoiding shared launcher log redirection. Regression locked `logs\launcher-static.log` while launching and passed. |
| `test:e2e` connection refused on `127.0.0.1:5173` | Ran concurrently with other local-service tests | Single rerun passed 6/6; record as local service concurrency issue, not app regression. |

## Round 10 - Project Creation Planning Close Loop

| Phase | Status | Notes |
|---|---|---|
| 1. Parallel review | complete | Two read-only agents reviewed React create/detail flow and E2E coverage. |
| 2. Create-to-detail code path | complete | New projects now navigate directly to Project Detail with `?next=plan` and route-state fallback. |
| 3. Edge-case hardening | complete | IPC `{ error }` create responses now surface as form errors, and ProjectDetail clears stale plans on project switch. |
| 4. Accessibility cleanup | complete | New project modal fields now use bound `Input`/`Textarea` labels and `select` `htmlFor`/`id` pairs. |
| 5. E2E lifecycle hardening | complete | Playwright and Electron startup smoke now reserve separate free ports and default to no external server reuse. |
| 6. Validation | complete | Full matrix passed, including 30.07-minute long-run, static launch, static browser, React E2E, and concurrent E2E/Electron checks. |
| 7. Commit and push | pending | Commit after docs, long-run result, and final static validation complete. |

## Round 10 Next Suggestions

1. Add Settings local runtime status and provider validation feedback.
2. Add PromptLab post-generation next actions and optional run-record creation.
3. Add i18n mojibake quality gate for source/tests/docs.
4. Add a unit/source gate for future E2E port lifecycle regressions.
5. Continue warning reduction in `GitTimeline`, `LogAnalyzer`, `Projects`, and `ProjectDetail`.

## Round 11 - Platform Security Hardening

| Phase | Status | Notes |
|---|---|---|
| 1. Security design review | complete | Compared against Electron safeStorage, MCP authorization, OWASP logging, workflow sharing/RBAC, and agent tracing patterns. |
| 2. Session hardening | complete | Removed renderer plaintext `sessionToken`; main process now owns the live renderer session token. |
| 3. ACL and sharing model | complete | Added workflow/project ACL owner/editor/viewer/admin semantics and enforced project-scoped access on child resources. |
| 4. Audit integrity and timeline | complete | Added retention metadata, hash chain verification, complete export integrity report, and run event correlation. |
| 5. MCP and static fallback gates | complete | Added MCP allowlist IPC/storage and token/cookie-gated static fallback with loopback-only default. |
| 6. Mojibake quality gate | complete | Added `scan:mojibake` with explicit legacy documentation allowlist. |
| 7. Validation and publish | complete | Full required matrix passed again after the audit export/retention-window regression test update; git publish is next. |

## Round 11 Next Suggestions

1. Add durable Electron `safeStorage` wrapping for secrets that must survive app restart.
2. Build workflow sharing UI around the new ACL fields.
3. Add an MCP runtime gateway/sandbox that consumes the allowlist before tool execution.
4. Add signed audit export manifests or external hash checkpoints.
5. Plan a controlled UTF-8 cleanup of historical mojibake docs.

## Round 12 - Security Sandbox Cleanup

| Phase | Status | Notes |
|---|---|---|
| 1. Baseline and branch | complete | Ran `git status -sb`, `git fetch --all --prune --tags`, and created `codex-security-sandbox-cleanup`. |
| 2. Parallel reconnaissance | complete | Subagents returned findings for safeStorage/session, workflow sharing ACL UI, MCP gateway/audit/cleanup candidates. |
| 3. Durable secret/session wrapper | complete | Added main-process safeStorage wrapper, provider secret envelopes, protected active session recovery, and tests. |
| 4. Workflow sharing UI and IPC | complete | Added dedicated ACL IPC and Project Detail sharing UI; main process requires owner/admin ACL access. |
| 5. MCP runtime gateway/sandbox | complete | Added allowlist-backed gateway decision, restrictive sandbox metadata, audit/run-event trace, and tests. |
| 6. Audit export checkpoint | complete | Added export manifest/checkpoint hash over audit export metadata and chain head. |
| 7. Cleanup and mojibake docs | complete | Removed generated shared JS artifacts and strengthened mojibake scanner; broad UI copy cleanup deferred. |
| 8. Validation, docs, commits, push | complete | Full required matrix passed; committed and pushed `codex-security-sandbox-cleanup`. |
