# LocalAI Nexus Iteration Plan

Date: 2026-05-11  
Workspace: `D:\AgentFlowStudio`  
Product state: LocalAI Nexus is the active product identity in the existing AgentFlowStudio repository.

## 1. Purpose

This plan turns LocalAI Nexus into a mature local-first AI gateway, runtime switcher, AgentOps console, workflow orchestrator, and security/memory hub through measurable iterations.

The plan intentionally covers all major dimensions:

- UI and interaction quality
- Product information architecture
- Main-process architecture and IPC boundaries
- Renderer structure and shared components
- Provider, gateway, router, token, health, runtime, skill, agent, workflow, memory, security, and admin logic
- Operation flow from first launch to provider setup, execution, audit, recovery, and handoff
- Testing, packaging, performance, accessibility, documentation, and release discipline

## 2. Non-Negotiable Constraints

- Do not rebuild the project from scratch.
- Keep the repository rooted at `D:\AgentFlowStudio`.
- Keep Electron security invariants: `contextIsolation: true`, `nodeIntegration: false`, all native actions through preload and IPC.
- Do not expose arbitrary command execution through IPC.
- Do not remove Shared Memory Hub.
- Do not change the JSON storage strategy without an explicit design discussion.
- Do not claim real provider forwarding, streaming, workflow automation, or security enforcement is complete until code and tests prove it.
- Keep static fallback as a recovery path, not the primary product target.
- Use `npm.cmd` commands on Windows because plain `npm` may resolve to a blocked PowerShell shim.

## 3. External Product Learning

The following products were reviewed only for transferable product and UX principles. Do not copy their code, brand, icons, or proprietary assets.

| Reference | What To Learn | LocalAI Nexus Translation |
|---|---|---|
| [Raycast](https://www.raycast.com/) | Keyboard-first launcher, snippets, quicklinks, aliases, automation, fast command access. | Add a command palette / quick action layer for provider switch, gateway start, create workflow, run skill, export context, open logs. |
| [Linear Plan](https://linear.app/plan) and [Linear project updates](https://linear.app/docs/initiative-and-project-updates) | Project health, structured updates, roadmap visibility, status communication. | Dashboard and Project Detail should show health, blockers, recent updates, next action, and stale work warnings. |
| [Linear AI Agents](https://linear.app/docs/agents-in-linear) | Agents act like delegated collaborators, but humans remain responsible. | Agent Studio should record agent delegation, capability, permission, trace, and responsible human owner. |
| [VS Code UX Guidelines](https://code.visualstudio.com/api/ux-guidelines/overview) | Clear workbench containers: sidebar, editor, panel, status bar, command palette, quick pick, notifications. | Use a restrained desktop shell: sidebar for modules, main area for work, bottom/status area for gateway/provider state, command palette for fast actions. |
| [GitHub Desktop](https://docs.github.com/en/desktop/overview/about-github-desktop) | Simplify complex Git operations while preserving best-practice workflow. | Make Git timeline, commit context, safety checks, and handoff export understandable without hiding important state. |
| [Obsidian data storage](https://obsidian.md/help/data-storage), [core plugins](https://obsidian.md/help/plugins), and [graph view](https://obsidian.md/help/plugins/graph) | Local files, plugin model, searchable knowledge graph, recoverable local state. | Treat Shared Memory Hub as a local vault with search, graph, import/export, redaction, recovery, and plugin-like context providers. |
| [Continue context providers](https://docs.continue.dev/customize/custom-providers) | Explicit context sources such as files, code, git diff, terminal, docs, web, repo map, MCP. | Build a context selection model for prompts, skills, agents, and workflows so users know exactly what the AI can see. |

## 4. Global Definition Of Done

Every implementation iteration must finish with:

- A clear user-visible outcome.
- A code path and data path that match the documented behavior.
- Loading, empty, error, and data states for every changed data surface.
- Security review for any IPC, file, key, provider, external URL, MCP, or export path.
- Updated `handoff/TEST_REPORT.md` and `PROJECT_PROGRESS.md` when behavior changes.
- Passing verification or a documented environment limitation.

Default verification gate after code changes:

```bat
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
npm.cmd run verify
```

Additional UI verification when renderer/static UI changes:

```bat
npm.cmd run lint
npm.cmd run test:e2e
npm.cmd run test:static-browser
```

Additional startup / desktop verification when launch, icon, shortcut, or packaging changes:

```bat
npm.cmd run test:electron-startup
npm.cmd run test:electron-auth-bridge
npm.cmd run shortcut
```

## 5. Target Operation Flow

The finished product should support this end-to-end loop:

1. Launch LocalAI Nexus.
2. See current gateway, provider, health, token, workflow, memory, and security state on Dashboard.
3. Add or select a provider with masked credentials.
4. Test provider health and model availability.
5. Start Local Gateway and verify OpenAI-compatible endpoints.
6. Generate or copy runtime profiles for tools such as Codex, Claude Code, Continue, or CLI clients.
7. Create a project or import an existing repo context.
8. Create a skill, agent, or workflow using explicit context sources.
9. Run a workflow through provider/router/gateway or safe mocked execution.
10. Inspect timeline, logs, token usage, health changes, security audit events, and failure reasons.
11. Save important decisions/results into Shared Memory Hub after redaction.
12. Export handoff context, test report, or security report.

Each iteration below moves one part of this loop from partial to trustworthy.

## 6. Iteration Roadmap

### Iteration 0 - Baseline Truth And Product Contract

Final goal:

Establish one trusted baseline for what exists, what is partial, what is planned, and which claims are verified.

Scope:

- Reconcile `README.md`, `PROJECT_PROGRESS.md`, `handoff/TEST_REPORT.md`, `handoff/NEXT_STEPS.md`, and `docs/LOCALAI_NEXUS_REFACTOR_PLAN.md`.
- Confirm visible product name, branch, launcher target, app entry, gateway state, and verification state.
- Classify every module as `Completed`, `In progress`, or `Planned`.

Acceptance indicators:

- Active docs agree on product identity and current limitations.
- No active top-level doc claims upstream forwarding or streaming is complete before implementation.
- `git status --short --branch` is captured in the iteration note.
- Baseline command gate result is recorded:

```bat
npm.cmd run verify
```

Evidence to update:

- `PROJECT_PROGRESS.md`
- `handoff/TEST_REPORT.md`
- `handoff/NEXT_STEPS.md`

### Iteration 1 - Information Architecture And Navigation Flow

Final goal:

Make the application feel like one coherent desktop console instead of a set of loosely connected pages.

Scope:

- Define primary navigation groups:
  - Dashboard
  - AI Resources: Provider Hub, Token Center, Health Monitor, Model Router
  - AI Runtime: Local Gateway, Runtime Switcher, Diagnostics
  - Skill Hub
  - Agent Studio
  - Workflow Studio
  - Shared Memory
  - Security Center
  - Git / Handoff
  - Admin / Settings
- Add or refine a fast action model inspired by launcher and command-palette products.
- Make Dashboard's first-run loop explicit: Add Provider -> Start Gateway -> Create Workflow -> Run -> Review.
- Add a compact status surface for active provider, gateway state, token usage, and latest security issue.

Acceptance indicators:

- Every primary module has a visible route, icon, and short label.
- The user can start from Dashboard and reach provider setup, gateway start, workflow creation, and memory review in one click each.
- Sidebar and topbar remain usable at `1024x680`.
- No page relies only on hidden hover actions for primary work.
- E2E navigation test covers all primary route entries.

Verification:

```bat
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test:e2e
```

### Iteration 2 - UI Design System And Page Polish

Final goal:

Apply one restrained, compact, flat desktop-tool visual system across renderer and static fallback.

Scope:

- Use `SurfaceCard`, `Button`, `Input`, `Textarea`, `Badge`, `Modal`, `Sidebar`, `Topbar`, and chart primitives consistently.
- Keep CSS token usage aligned with `docs/UI_DESIGN_SYSTEM.md`.
- Remove active UI reliance on glassmorphism, large gradients, heavy blur, decorative orbs, oversized marketing layouts, and nested cards.
- Standardize empty, loading, error, success, warning, destructive, and disabled states.
- Add tooltips and `aria-label` to icon-only controls.
- Verify light and dark modes separately.

Acceptance indicators:

- All active routes use shared primitives for core controls.
- Every data page has loading, empty, error, and data states.
- Text does not overlap or overflow at `1024x680`.
- Dark and light mode remain readable and visually distinct.
- No active renderer/static shell element uses `backdrop-filter` or glass-only styling as a core visual language.
- UI smoke or Playwright screenshot review records at least Dashboard, Settings, Shared Memory, Workflow, and Prompt/Skill pages.

Verification:

```bat
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test:e2e
npm.cmd run test:static-browser
```

### Iteration 3 - Main Architecture And IPC Decomposition

Final goal:

Move from a large central IPC file toward maintainable domain services while preserving the secure preload bridge.

Scope:

- Keep renderer -> preload -> IPC -> domain service as the only native boundary.
- Gradually split `src/main/ipc.ts` by domain without breaking `window.agentflow` compatibility.
- Strengthen service modules under `src/main/domain/*`:
  - provider / resources
  - gateway
  - router
  - health
  - usage
  - runtime
  - skills
  - agents
  - workflows
  - audit / security
- Split shared types into stable modules only when it reduces real complexity.
- Add structured result types for domain calls: success, validation error, security denial, provider failure, timeout, unavailable.

Acceptance indicators:

- No renderer file imports Node-only modules or main-process services.
- New IPC handlers include permission checks, input validation, sanitized output, and audit behavior where relevant.
- Domain service unit tests cover happy path and failure path.
- `src/main/ipc.ts` is smaller or has clear routing registration boundaries.
- Storage schema changes are additive and migration-safe.

Verification:

```bat
npm.cmd run typecheck
npm.cmd run test
npm.cmd run verify
```

### Iteration 4 - Provider Hub And Credential Safety

Final goal:

Make provider setup reliable, secure, and self-explanatory.

Scope:

- Promote provider configuration into a first-class Provider Hub page.
- Support OpenAI-compatible, Anthropic-compatible, Gemini-compatible, Ollama/local, and custom providers.
- Handle base URL, `/v1` URL hints, model names, headers, proxy, tags, default model, and enabled state.
- Keep API keys protected in the main process and masked in renderer.
- Add provider test action with actionable diagnostics.
- Record provider create/update/delete/test/switch events in audit.

Acceptance indicators:

- A user can create, edit, disable, delete, and test an OpenAI-compatible provider from UI.
- Renderer never receives raw API keys after save.
- Import/export and memory generation paths redact provider secrets.
- Provider test returns clear categories: success, missing key, bad base URL, auth failure, timeout, network failure, unsupported route.
- Active provider/model switch updates Dashboard and Runtime Switcher.

Verification:

```bat
npm.cmd run typecheck
npm.cmd run test -- --runInBand
npm.cmd run test:e2e
```

If the test command does not accept the extra flag in this repo, use:

```bat
npm.cmd run test
```

### Iteration 5 - Local Gateway And Model Router

Final goal:

Turn the diagnostic gateway into a usable local OpenAI-compatible gateway with safe routing and clear fallback behavior.

Scope:

- Implement non-streaming upstream forwarding first.
- Preserve diagnostic behavior for root `/responses` and `/v1` base URL mismatch cases.
- Add streaming after non-streaming forwarding is stable.
- Model Router selects provider/model based on health, role, tags, local/cloud preference, cooldown, quota, and fallback policy.
- Normalize OpenAI-compatible chat/responses errors.
- Add request timeout, abort/cancel, retry policy, and trace IDs.

Acceptance indicators:

- `GET /health`, `GET /v1/models`, `POST /v1/chat/completions`, `POST /v1/responses`, `POST /responses`, and `POST /v1/messages` have tests or documented behavior.
- Non-streaming real provider call works with a configured test provider, or a mock provider proves the exact router/gateway path in CI-safe tests.
- Streaming path emits incremental chunks and final usage metadata.
- Gateway records token usage, latency, selected provider/model, failure category, and audit trace.
- Fallback selection reason is visible to the user.
- Gateway never logs raw keys or full sensitive prompts unless explicitly allowed by a redacted debug mode.

Verification:

```bat
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
npm.cmd run verify
```

Manual smoke after launching app:

```bat
powershell -NoProfile -Command "Invoke-RestMethod http://127.0.0.1:8317/health"
powershell -NoProfile -Command "Invoke-RestMethod http://127.0.0.1:8317/v1/models"
```

### Iteration 6 - Token Center And Health Monitor

Final goal:

Make cost, quota, cooldown, latency, and health visible enough to guide decisions.

Scope:

- Build Token Center page from the existing usage service.
- Add quota, cooldown, concurrency, and pool configuration.
- Show usage by provider, model, project, workflow, agent, skill, and day.
- Build Health Monitor page with real network probes where allowed.
- Add health trend, last check, failure category, and repair recommendation.

Acceptance indicators:

- Token Center shows total requests, input/output/total tokens, success rate, failure rate, average latency, P95 latency, and top failure reasons.
- Users can configure per-provider or per-model limits and see enforcement state.
- Health Monitor distinguishes local config diagnostics from live network checks.
- A failed health check links to the provider record and suggested fix.
- Cooldown/quota decisions affect Model Router selection.

Verification:

```bat
npm.cmd run typecheck
npm.cmd run test
npm.cmd run test:e2e
```

### Iteration 7 - Runtime Switcher And Config Portability

Final goal:

Let users connect LocalAI Nexus to external AI tools without guessing which URL, model, or environment variables to use.

Scope:

- Generate profiles for Codex, Claude Code, Continue, generic CLI, and custom OpenAI-compatible clients.
- Provide copy/export for `.env`, JSON, TOML, YAML, and command snippets.
- Add diagnostics for root URL vs `/v1` URL.
- Optionally inspect local config files only after explicit user action.
- Never write external tool config without a preview and confirmation.

Acceptance indicators:

- Runtime Switcher can generate a working profile using the active gateway URL and model.
- Copy/export actions are audited and show success/failure state.
- Profile output never includes raw API key unless the user explicitly requests an export format that needs it and confirms the risk.
- UI explains whether a client should use `http://127.0.0.1:8317` or `http://127.0.0.1:8317/v1`.
- Unit tests cover profile generation and redaction.

Verification:

```bat
npm.cmd run typecheck
npm.cmd run test
npm.cmd run test:e2e
```

### Iteration 8 - Skill Hub, Agent Studio, And Workflow Studio

Final goal:

Move from isolated prompt tools to a trustworthy repeatable execution system.

Scope:

- Expand Skill Hub beyond Prompt Skill:
  - prompt skill
  - tool skill
  - MCP skill
  - workflow skill
  - composite skill
  - agent skill
- Add explicit input/output schemas, allowed tools, permission level, risk level, test fixtures, and version history.
- Agent Studio models agents as delegated actors with owner, allowed providers, allowed skills, memory scope, and audit policy.
- Workflow Studio supports readable node lists first, then richer graph/canvas only if needed.
- Add run timeline, retry, pause, cancel, resume, and handoff export.

Acceptance indicators:

- User can create a skill, test it with sample input, enable/disable it, and bind it to a workflow or agent.
- Agent execution records selected model/provider, tools used, context sources, token usage, result, and failure reason.
- Workflow run timeline shows node status and can retry a failed safe node.
- Human owner/responsibility is visible for agent-delegated work.
- Dangerous tool/MCP actions require explicit permission and audit events.

Verification:

```bat
npm.cmd run typecheck
npm.cmd run test
npm.cmd run test:e2e
```

### Iteration 9 - Shared Memory Hub And Context Recovery

Final goal:

Make Shared Memory Hub a reliable local knowledge vault for cross-model context recovery.

Scope:

- Strengthen memory create, confirm, archive, import, export, and search flows.
- Add memory graph / relationship view inspired by local knowledge tools.
- Add context-pack builder with explicit selectable sources:
  - memory
  - files
  - git diff
  - logs
  - terminal summary
  - docs
  - workflow run
  - provider trace
- Add stale-memory indicators and provenance.
- Improve secret redaction across memory import/export/generate context paths.

Acceptance indicators:

- Pending -> active -> archived workflow is visible and tested.
- Context pack preview shows exactly which sources are included.
- Exported memory and generated context are redacted.
- Search supports type, tag, status, project, date, and risk filters.
- Memory graph can open related memories without losing current context.
- A recovery prompt can be generated from current project state, latest test result, known limitations, and selected memories.

Verification:

```bat
npm.cmd run typecheck
npm.cmd run test
npm.cmd run test:e2e
```

### Iteration 10 - Security Center, Audit, And Governance

Final goal:

Make local security behavior inspectable, enforceable, and exportable.

Scope:

- Expand Security Center into a full control surface for:
  - auth state
  - RBAC
  - ACL
  - audit log
  - redaction status
  - secret scan
  - external URL policy
  - provider risk
  - MCP/tool risk
  - prompt-injection warnings
- Add exportable security report.
- Validate `shell.openExternal` and external links.
- Add hash-chain verification UI if the audit layer supports it.

Acceptance indicators:

- Ordinary users cannot access admin-only actions through UI or direct IPC.
- Permission denial produces audit events without leaking sensitive payloads.
- Security report export is redacted and includes timestamp, scope, summary, findings, and recommended fixes.
- Secret scanner catches representative key/token/password patterns in memory, logs, imports, and exports.
- External URL opening is allowlisted or confirmed with a clear risk prompt.

Verification:

```bat
npm.cmd run typecheck
npm.cmd run test
npm.cmd run test:e2e
npm.cmd run test:electron-auth-bridge
```

### Iteration 11 - Reliability, Packaging, Performance, And Accessibility

Final goal:

Make LocalAI Nexus dependable as a daily Windows desktop tool.

Scope:

- Validate Electron startup, auth bridge, gateway startup, static fallback, and desktop shortcut.
- Build installer through `electron-builder`.
- Keep static fallback aligned enough for recovery.
- Add performance checks for route load, large logs, memory search, and long-running workflows.
- Add accessibility checks for keyboard flow, focus states, labels, contrast, reduced motion, and screen reader labels.
- Add long-run stability checks for gateway and static fallback.

Acceptance indicators:

- Primary shortcut opens Electron without a console popup.
- Packaged installer builds and launches on the target Windows machine.
- Startup smoke reaches ready marker.
- Static fallback still runs manually and clearly identifies itself as fallback.
- No obvious memory growth after long-run smoke.
- Critical workflows are keyboard reachable.
- Accessibility review records fixed or accepted gaps.

Verification:

```bat
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
npm.cmd run test:electron-startup
npm.cmd run test:electron-auth-bridge
npm.cmd run test:launch-static
npm.cmd run test:static-browser
npm.cmd run test:long-run
npm.cmd run dist
```

### Iteration 12 - Ecosystem, Templates, And Extensibility

Final goal:

Turn LocalAI Nexus from a single app into a controlled local ecosystem for skills, templates, workflows, and integrations.

Scope:

- Add skill/template marketplace-like local registry without remote dependence.
- Support importing local skill bundles after validation.
- Add template packs for common project types:
  - desktop app
  - CLI tool
  - firmware project
  - library
  - web app
  - data/reporting project
- Add MCP/tool integration catalog with risk levels and permission preview.
- Add versioned workflow templates and migration rules.

Acceptance indicators:

- A local skill/template bundle can be imported, validated, enabled, disabled, and removed.
- Invalid or risky bundle is rejected with actionable errors.
- Installed bundle cannot bypass IPC security or arbitrary command rules.
- Template creation produces project/task/prompt/workflow scaffolding with visible assumptions.
- Docs explain how to author a safe local skill/template.

Verification:

```bat
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
npm.cmd run verify
```

## 7. Cross-Cutting Acceptance Matrix

| Area | Final Standard |
|---|---|
| UI | Compact, scan-friendly, flat desktop tool; light/dark mode; no overlap at `1024x680`; shared primitives; all states covered. |
| Structure | Domain services own logic; IPC owns boundary/security; renderer owns presentation; shared types stay stable and migration-safe. |
| Operation flow | Dashboard leads to provider -> gateway -> runtime profile -> skill/agent/workflow -> logs/token/audit -> memory/handoff. |
| Logic | Provider/router/gateway/usage/health decisions are explicit, testable, and visible to users. |
| Security | Secrets masked, redaction enforced, permissions checked in main process, dangerous actions audited, external links controlled. |
| Memory | Local-first, redacted, searchable, source-aware, graphable, exportable, and useful for cross-model recovery. |
| Agent/Workflow | Human-owned, traceable, retryable, cancellable, permissioned, and token-attributed. |
| Testing | Unit, E2E, smoke, startup, static fallback, and packaging gates run according to change risk. |
| Docs | README, progress, test report, architecture, and next steps reflect reality after each iteration. |
| Release | Shortcut, icon, installer, fallback, and handoff are verified before calling a milestone complete. |

## 8. Suggested Milestone Grouping

Short-term milestone:

- Iteration 0
- Iteration 1
- Iteration 2
- Iteration 3

Goal: make the shell, structure, and verified state coherent.

Core product milestone:

- Iteration 4
- Iteration 5
- Iteration 6
- Iteration 7

Goal: make LocalAI Nexus genuinely useful as a local AI gateway and runtime switcher.

AgentOps milestone:

- Iteration 8
- Iteration 9
- Iteration 10

Goal: make skill/agent/workflow execution auditable, recoverable, and safe.

Daily-driver milestone:

- Iteration 11
- Iteration 12

Goal: make it installable, reliable, extensible, and maintainable.

## 9. Per-Iteration Working Template

For every iteration, use this checklist before implementation:

```markdown
## Iteration N - Name

### Goal
One sentence describing the final user-visible outcome.

### Current Baseline
What exists today, with file references and test status.

### Scope
What will change in UI, main process, shared types, renderer, tests, docs, and scripts.

### Out Of Scope
What will not be claimed in this iteration.

### Acceptance Indicators
Measurable conditions for completion.

### Verification
Exact commands run and results.

### Rollback / Recovery
What to revert or disable if the iteration breaks startup or security.
```

## 10. Release Discipline

Do not mark an iteration complete until:

- Implementation is merged into the active branch.
- Verification commands are run or limitations are documented.
- `handoff/TEST_REPORT.md` records the result.
- `PROJECT_PROGRESS.md` records completed and remaining work.
- Any new limitations appear in `handoff/NEXT_STEPS.md`.
- The final user-facing claim matches the real verification level.

## 11. 2026-05-11 Closeout Record

Status: Iteration 0-12 completed to the locally verifiable level.

Completed:

- Product contract, active docs, IA/navigation, compact flat UI, and IPC/preload compatibility were reconciled.
- Provider Hub, Token Center, Health Monitor, Model Router, Local Gateway, Runtime Switcher, Diagnostics, Agent Studio, Security Center, Ecosystem, Shared Memory, Git/Handoff, Admin, and Settings are visible first-class product surfaces.
- Provider, gateway, router, runtime, memory/context, security, and ecosystem domain services are connected through the main-process boundary.
- CI-safe mock provider behavior and OpenAI-compatible non-streaming gateway paths are covered. Real credentialed provider smoke remains opt-in.
- Token/health/router surfaces show usage, trends, failures, quota/cooldown signals, repair hints, fallback reasons, and trace IDs.
- Runtime exports cover `.env`, JSON, TOML, YAML, and CLI snippets without silently writing external config.
- Shared Memory context-pack preview, security report/risk surfaces, and local bundle registry behavior were added or connected.
- `docs/LOCALAI_NEXUS_NEXT_ITERATION_PLAN.md` was created as the required next-stage plan.

Verification:

- `npm.cmd run typecheck`: PASS.
- `npm.cmd run lint`: PASS.
- `npm.cmd run test`: PASS.
- `npm.cmd run smoke`: PASS.
- `npm.cmd run verify`: PASS.
- `npm.cmd run build`: PASS.
- `npm.cmd run test:e2e`: PASS.
- `npm.cmd run test:static-browser`: PASS.
- `npm.cmd run test:launch-static`: PASS.
- `npm.cmd run test:electron-startup`: PASS.
- `npm.cmd run test:electron-auth-bridge`: PASS.
- `npm.cmd run test:long-run`: PASS.
- `npm.cmd run shortcut`: PASS.
- Shortcut COM inspection: PASS.
- Gateway HTTP smoke for `/health`, `/v1/models`, `/v1/chat/completions`, `/v1/responses`, `/responses`, and `/v1/messages`: PASS.

Environment-limited:

- `npm.cmd run dist` completed the build step but electron-builder failed to download Electron `v33.4.11` for Windows from GitHub due network timeout / `ERR_ELECTRON_BUILDER_CANNOT_EXECUTE`.
- 2026-05-11 cleanup closeout rerun: `npm.cmd run dist` rebuilt the app and produced `release/win-unpacked/LocalAI Nexus.exe`, but electron-builder/app-builder did not finish before the 15-minute verification timeout.
