# AgentFlowStudio Rebuild Task Plan

Goal: rebuild AgentFlowStudio into a local-first, beginner-friendly Agent Workflow Studio with secure main-process boundaries, Chinese-first UI, workflow templates, traceable runs, admin controls, audit, diagnostics, tests, commits, and push.

## Phases

| Phase | Status | Notes |
| --- | --- | --- |
| 1. Baseline and journey files | in_progress | Branch created, npm install/test/build baseline collected. |
| 2. Competitor mainline study | complete | Study doc created from parallel research. |
| 3. Architecture and data model redesign | complete | Added shared workflow models and architecture plan. |
| 4. Workflow runtime and templates | complete | Implemented template creation, node editor, run execution, run timeline/trace. |
| 5. Beginner dashboard and UI mainline | complete | Added `/workflows` and Dashboard six-step beginner navigation. |
| 6. Security review and fixes | complete | Fixed memory ACL and config import/export privilege issues. |
| 7. Human simulation and tests | complete | Human simulation report updated; Playwright covers workflow template -> run -> trace. |
| 8. Quality gates, docs, commit, push | in_progress | Quality gates pass; commit and push next. |

## Current Constraints

- Work only inside `D:\AgentFlowStudio`.
- Preserve existing user changes and do not reset the worktree.
- Use `npm.cmd` instead of `npm` in PowerShell because `npm.ps1` is blocked by execution policy.
- `rg.exe` is blocked by the local environment, so use PowerShell file discovery/search.

## Completion Promise

Do not stop until the requested rebuild has been implemented as far as practical in this turn, verified, documented, committed, and pushed or a real external blocker is recorded.
