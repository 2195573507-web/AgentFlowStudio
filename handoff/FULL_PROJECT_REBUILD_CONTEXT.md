# Full Project Rebuild Context

AgentFlowStudio is being rebuilt as a local-first beginner-friendly Agent Workflow Studio. The stable existing auth/RBAC/audit/provider foundation was preserved and reorganized around a clearer workflow mainline.

## Mainline

Login -> Dashboard -> Project -> Workflow template -> Provider/API key -> edit nodes -> run -> Timeline/Trace -> fix errors -> save version -> admin/audit/diagnostics.

## Important Branch

`codex-rebuild-from-mainline`

## Key New Files

- `src/shared/workflowTypes.ts`
- `src/core/workflowRuntime.ts`
- `src/templates/workflowTemplates.ts`
- `src/renderer/routes/Workflows.tsx`
- `tests/unit/workflowRuntime.test.ts`
- `docs/COMPETITOR_MAINLINE_REBUILD_STUDY.md`
- `docs/REBUILD_ARCHITECTURE_PLAN.md`
- `docs/SECURITY_REBUILD_REVIEW.md`
- `BUILD_JOURNEY.md`

## Security Fixes

- Memory context now honors project ACL.
- Config import blocks non-admin MCP/skills import.
- Config export filters privileged workspace resources for ordinary users.
- Workflow run/create/save audited and permission-checked.

## Final Validation

- `npm.cmd run typecheck`: PASS.
- `npm.cmd test`: PASS, 24 files / 177 tests.
- `npm.cmd run build`: PASS.
- `npm.cmd run lint`: PASS, 0 errors / 25 warnings.
- `npm.cmd run test:e2e`: PASS, 16/16.

## Remaining Risks

- Dedicated Diagnostics page still needs to become a first-class route.
- Historical mojibake remains in older source/static copy outside the new workflow mainline.
- `npm audit` dependency vulnerabilities remain for a separate dependency-upgrade pass.
