# Rebuild Architecture Plan

## Mainline

First launch -> login/admin initialization -> Dashboard -> create Project -> choose Template or blank Workflow -> configure Provider/API Key -> edit nodes -> run Workflow -> view Run Timeline/Trace -> fix errors -> save Workflow version -> export/share -> admin users/audit/diagnostics.

## Boundaries

- `src/main`: Electron security boundary, IPC auth, session, storage access, audit, secrets, MCP gateway, provider operations, workflow persistence.
- `src/main/preload.ts`: minimal typed bridge. It exposes named capabilities, never raw `ipcRenderer`.
- `src/renderer`: UI, local state, interaction. It never persists raw API keys or makes final permission decisions.
- `src/shared`: shared TypeScript models, IPC constants, auth/audit/workflow types, error shapes.
- `src/core`: pure workflow runtime, node registry, graph validation, run lifecycle logic.
- `src/auth`: compatibility boundary for future auth modules.
- `src/audit`: compatibility boundary for future audit modules.
- `src/secrets`: compatibility boundary for future secrets modules.
- `src/mcp`: compatibility boundary for future MCP gateway modules.
- `src/storage`: compatibility boundary for future storage adapters.
- `src/templates`: workflow templates and starter examples.
- `tests`: unit, e2e, security, human simulation.
- `scripts`: startup, diagnostics, quality gates, mojibake scan, safety checks.

## Data Models

Rebuild target models:

- User, Session, ACL.
- Project.
- Workflow, WorkflowVersion, WorkflowNode, WorkflowEdge.
- Run, RunEvent.
- Provider, Secret.
- AuditLog.
- Template.
- AppSettings.
- DiagnosticReport.

## Security Rules

- Main process is the only trust boundary.
- Every non-public IPC channel must have a permission policy.
- Renderer route guards are convenience only.
- Provider API keys are protected in main storage and masked before returning to renderer.
- Permission denial, admin operations, Provider/Secret operations, and Workflow runs are audited.
- Config import/export is role-aware: ordinary users cannot import MCP allowlist or export privileged workspace config.

## Workflow Runtime

Minimum supported nodes:

- Start
- Prompt
- LLM
- Tool
- Condition
- Human Approval
- Output

The current runtime is a deterministic local dry-run engine. It validates Start/Output nodes, follows edges, records node trace, blocks on missing LLM provider/model, and returns actionable next-step guidance.

## UI Mainline

- Dashboard: beginner checklist and direct actions.
- Workflows: template creation, node editor, save version, run, trace.
- Settings: Provider/API key configuration.
- Admin: users and audit.
- Diagnostics: documented for next implementation pass.

## Testing Plan

- Unit: workflow runtime, auth, RBAC, audit, provider masking, secret redaction, memory ACL.
- E2E: login, first-run password change, create project, create workflow from template, run, inspect trace.
- Security: ordinary user denied admin/MCP/config import privileges.
- Human simulation: novice user, admin, unauthorized user, error recovery user.
