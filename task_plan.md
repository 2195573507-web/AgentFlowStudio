# AgentFlow Studio Codex Optimization Plan

## Goal
Complete the second-pass Codex handoff: verify, repair, polish, build, package where possible, create icon/shortcut, update handoff docs, and commit the work on `codex-optimization`.

## Phases

| Phase | Status | Notes |
|---|---|---|
| 1. Context recovery | complete | Read root docs, handoff files, source/test/script/assets/data/skills, git status/log. |
| 2. Branch and baseline | in_progress | Created `codex-optimization`; baseline commit skipped because worktree was clean. |
| 3. Dependency and first test pass | complete | `npm.cmd install` passed; first typecheck/lint/test/build failures captured. |
| 4. Startup/type/build repair | in_progress | Fix shared types, renderer API compatibility, route aliases, scripts/config. |
| 5. UI and Shared Memory polish | pending | Audit and refine desktop UI, memory flows, settings/provider UX. |
| 6. Icon and shortcut | pending | Generate real SVG/PNG/ICO and create Windows desktop shortcut. |
| 7. Verification loop | pending | Re-run typecheck, lint, test, build, dev, icon, shortcut, dist where possible. |
| 8. Handoff docs and commits | pending | Update handoff docs, changelog/report, stage and commit phases. |

## Errors Encountered

| Error | Attempt | Resolution |
|---|---|---|
| `npm` blocked by PowerShell execution policy | `npm install` | Use `npm.cmd` for npm commands. |
| Git branch creation permission denied in sandbox | `git checkout -b codex-optimization` | Re-ran with approved escalation. |
| `npm run typecheck` reported renderer/shared type drift | First verification pass | In progress: add compatibility to shared types and wrappers. |
| `npm run lint` missing ESLint config | First verification pass | Pending: add scoped ESLint config. |
| `vite`/`vitest` failed with esbuild `spawn EPERM` in sandbox | First verification pass | Pending: re-run with escalation after code repairs. |

## Completion Criteria

- `npm.cmd install` succeeds.
- `npm.cmd run dev` starts and app is not white-screen.
- `npm.cmd run typecheck`, `test`, and `build` pass or environment limitation is documented.
- `npm.cmd run lint` passes or remaining warnings are documented.
- `npm.cmd run icon` and `shortcut` succeed, with desktop shortcut verified.
- `npm.cmd run dist` succeeds or failure is documented with reason.
- Handoff docs are updated with actual results.
- At least one Codex optimization commit exists.
