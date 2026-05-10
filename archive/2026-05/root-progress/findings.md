# AgentFlowStudio Rebuild Findings

## Baseline

- Current branch was `codex-security-sandbox-cleanup`; dedicated branch `codex-rebuild-from-mainline` was created.
- Remote: `origin https://github.com/2195573507-web/AgentFlowStudio.git`.
- Worktree had pre-existing modifications before this task; they are treated as user/project context and not reverted.
- `npm install` through `npm.ps1` failed due PowerShell execution policy. `npm.cmd install` succeeded.
- Baseline `npm.cmd test` passed: 23 files, 174 tests.
- Baseline `npm.cmd run build` passed with non-fatal Vite chunk/dynamic import warnings.
- Existing app already contains auth, RBAC, audit, provider secret masking, MCP allowlist, admin users, and audit pages.
- Existing UI has severe mojibake in many Chinese strings, so new Chinese-first surfaces should use clean UTF-8 text.

## Sub-Agent Findings

- Test explorer found existing unit and E2E coverage across auth, RBAC, audit, secure store, MCP, API bridge, run logs, theme, typography, and app/auth E2E.
- UI explorer found the main issue is not missing features only, but a navigation/product-flow problem: the app presents a feature directory instead of a beginner workflow path.
- UI explorer recommends sidebar grouping, Chinese-first login/admin text, Dashboard as single next-step page, and ProjectDetail/workflow stepper.

## Implementation Direction

- Keep the stable security/auth foundation.
- Add explicit workflow models and runtime rather than stretching projects/tasks/prompts into workflow concepts.
- Add a dedicated `/workflows` route for template creation, node editing, running, and traces.
- Use existing `runs` and `runEvents` collections for trace storage while adding `workflows` and `workflowVersions`.
- Add compatibility boundary folders under `src/core`, `src/auth`, `src/audit`, `src/secrets`, `src/mcp`, `src/storage`, and `src/templates`.
