# AgentFlow Studio - Test Report

## Mainline Workflow Rebuild Pass - 2026-05-10

### What Changed

- Added first-class Workflow models, templates, versions, run input/result, node trace, and diagnostics types.
- Added pure `src/core/workflowRuntime.ts` for Start, Prompt, LLM, Tool, Condition, Human Approval, and Output nodes.
- Added beginner workflow templates in `src/templates/workflowTemplates.ts`.
- Added main-process workflow IPC for template list, list/get, create from template, save version, run, and version history.
- Added preload and renderer API wrappers plus `/workflows` UI route.
- Added security fixes for memory context ACL and config import/export privilege filtering.
- Added rebuild docs, security review, and human simulation report.

### Current Results

| Check | Status | Details |
|---|---:|---|
| `npm.cmd install` | PASS | Dependencies were already up to date; npm audit reports 17 dependency vulnerabilities. |
| `npm.cmd test` baseline | PASS | Before edits: 23 files, 174 tests. |
| `npm.cmd run build` baseline | PASS | Before edits: build passed with non-fatal Vite chunk warnings. |
| `npm.cmd run typecheck` | PASS | Passed after Workflow/API/IPC types were fixed. |
| `npm.cmd test -- tests/unit/workflowRuntime.test.ts` | PENDING | To run in final validation batch. |
| `npm.cmd test` | PENDING | To run in final validation batch. |
| `npm.cmd run build` | PENDING | To run in final validation batch. |

### Known Notes

- Use `npm.cmd` instead of `npm` in this PowerShell environment because `npm.ps1` is blocked by execution policy.
- `rg.exe` is blocked by the local environment, so PowerShell search was used.
- E2E workflow coverage still needs a dedicated Playwright scenario in the next pass.

### Final Rebuild Validation Update

| Check | Status | Details |
|---|---:|---|
| `npm.cmd run typecheck` | PASS | TypeScript passed. |
| `npm.cmd test` | PASS | Vitest: 24 files / 177 tests passed. |
| `npm.cmd run build` | PASS | Renderer and Electron builds passed; only non-fatal Vite chunk/dynamic-import warnings. |
| `npm.cmd run lint` | PASS | 0 errors / 25 warnings, below configured threshold. |
| `npm.cmd run test:e2e` | PASS | Playwright: 16/16 passed. Covers auth/admin, Dashboard, provider settings, Skills, core routes, Prompt Lab, project creation/error handling, Workflow template run, Timeline / Trace, and redacted run export. |
| `npm.cmd run test:unit` | N/A | Script missing from `package.json`. |
| `npm.cmd run test:integration` | N/A | Script missing from `package.json`. |

Final note: workflow E2E coverage is no longer pending; `tests/e2e/app.spec.ts` now includes project/workflow/template/run/trace coverage.

## Login Recovery Follow-up - 2026-05-10

### What Changed

- Fixed the preload auth bridge so `auth.session(sessionId)` forwards the renderer-held `sessionId` to the main process.
- Fixed main-process session recovery so the secure active token is reused when the renderer supplies only the matching `sessionId`.
- Updated the login screen to show the default admin credentials clearly: `123@admin.com / 123456`.
- Updated the forced password-change screen with Chinese-first instructions, default current-password guidance, loading state, and concrete recovery errors for wrong current password, short new password, and expired sessions.

### Results

| Check | Status | Details |
|---|---:|---|
| Local admin data check | PASS | `123@admin.com` is active/unlocked and `123456` matches the stored hash. |
| `npm.cmd run typecheck` | PASS | TypeScript passed after preload/session/UI changes. |
| `npm.cmd test` | PASS | Vitest: 24 files / 177 tests passed. |
| `npm.cmd run build` | PASS | Renderer and Electron builds passed; existing non-fatal chunk/dynamic-import warnings remain. |
| `npm.cmd run test:e2e` | PASS | Playwright wrapper selected free port `5174`; 16/16 tests passed. |
| `npx.cmd playwright test tests/e2e/auth.spec.ts` | BLOCKED | Direct Playwright run could not bind `127.0.0.1:5173`; use `npm.cmd run test:e2e` on this machine. |

### Login Notes For Operators

- Default admin email: `123@admin.com`.
- Default admin password: `123456`.
- On the first-login password-change page, current password is still `123456`; new password must be at least 6 characters.

## Auth, Admin, RBAC, And Audit Pass - 2026-05-10

### What Changed

- Added local authentication with PBKDF2 password hashing, failed-login lockout, persistent opaque sessions, secure logout, and forced first-login password change for the default admin.
- Added main-process user, session, RBAC, and audit modules with explicit JSON collections for `users`, `sessions`, and `auditLogs`.
- Added admin-only user management and audit pages in the React renderer.
- Added route protection and IPC permission checks. The renderer can hide admin routes, but the main process is the authorization source of truth.
- Added redacted audit event storage and export for login, failed login, logout, password change, user creation, role/status changes, password reset, permission denial, and security initialization.
- Admin password resets now generate a one-time random temporary password in the main process and store only its hash.
- Added clean UTF-8 renderer i18n entries for auth/admin navigation labels.

### Results

| Check | Status | Details |
|---|---:|---|
| `npm.cmd run typecheck` | PASS | TypeScript passed after auth/session/RBAC/audit additions. |
| `npm.cmd run test` | PASS | Vitest: 16 files, 149 tests. New tests cover password hash/verify, session validity, lockout helpers, random reset passwords, RBAC, and audit redaction/filtering. |
| `npm.cmd run test:e2e` | PASS | Playwright: 14/14, including admin login, normal user login, logout, protected routes, admin denial, user creation, and audit UI. |
| `npm.cmd run lint` | PASS | 0 errors, 28 warnings under configured threshold. |
| `npm.cmd run build` | PASS | Renderer and Electron builds passed; existing Charts chunk-size warning and api dynamic-import note only. |
| `npm.cmd run smoke` | PASS | 168/168, now including auth/RBAC/audit file and IPC guard checks. |

### Architecture Debt Report

- JSON local storage is adequate for the local desktop phase but lacks transactional guarantees, migrations, retention, and multi-user conflict handling.
- Session tokens are opaque and stored hashed in the main process, but the renderer persists the raw token in localStorage. Future desktop hardening should wrap it with Electron `safeStorage`.
- RBAC is role-based only. Future team collaboration, workflow sharing, MCP, sandbox, and cloud sync need resource-scoped ACLs.
- Audit logs are redacted and searchable but not tamper-evident and not yet correlated with workflow run traces.
- Static fallback is not yet protected by the new auth system.
- Historical mojibake remains in older docs/source; this pass only cleaned the renderer i18n table needed for stable navigation/auth UI.

## Workflow Structure And Safety Trace Pass - 2026-05-10

### What Changed

- Learned non-UI workflow capabilities from Flowise, Dify, Langflow, OpenAI AgentKit/Agent Builder, n8n, Botpress, Coze, FastGPT, and Open WebUI.
- Fixed run log copy/export redaction for summary, error, raw log, node input/output summaries, and failure reasons.
- Moved run log parsing, serialization, redaction, retry advice, and quality checklist logic into `src/renderer/lib/runLogs.ts`.
- Moved workflow template filtering/search helpers into `src/renderer/lib/templates.ts` and unified workflow template types through `src/shared/types.ts`.
- Added workflow template metadata: category, difficulty, risk level, beginner recommendation, human approval requirement, retry advice, and retrieval node support.
- Added Prompt Lab workflow filters for category, risk, and beginner recommendations.
- Added ProjectDetail run quality checklist and retry suggestions.
- Hardened IPC origin checks, dev server URL validation, skill realpath guards, memory read redaction, clipboard redaction, large log limits, Shared Memory import limits/schema normalization, and duplicate React keys.
- GitTimeline now labels parsed test state as a report snapshot, not proof of a fresh test run.

### Focused Results

| Check | Status | Details |
|---|---:|---|
| `npm.cmd run test -- templates safety theme apiRuns runLogs utils secretRedaction` | PASS | 7 files, 72 tests. Covers workflow template filters, run log redaction, clipboard redaction, safety, theme, and API run bridge behavior. |
| `npm.cmd run typecheck` | PASS | TypeScript passed after Badge prop and import normalization fixes. |
| `npm.cmd run smoke` | PASS | 157/157 smoke checks, including IPC origin guard, localhost-only dev URL, skill realpath guard, and memory read redaction checks. |
| `npm.cmd run test -- templates safety theme apiRuns` | PASS | Required focused suite: 4 files, 44 tests. |
| `npm.cmd run test` | PASS | Full Vitest suite: 13 files, 137 tests. |
| `npm.cmd run test:e2e` | PASS | React Playwright suite: 10/10 tests, including Prompt Lab workflow filters and ProjectDetail redacted run copy/export. |
| `npm.cmd run lint` | PASS | 0 errors, 27 warnings under the configured threshold. |
| `npm.cmd run build` | PASS | Renderer and Electron build passed; existing Charts chunk-size warning only. |

### Remaining Risks

- Full MCP client/server, sandboxed code nodes, RBAC/resource ACL, and automated graders are intentionally deferred because they need explicit permission, audit, and isolation design.
- Existing historical Chinese mojibake remains in some docs/source strings; this pass only appended clean new records and avoided broad text churn.
- Dependency audit issues are still known from previous reports and were not force-fixed to avoid major dependency churn.

## Platform Security Hardening Round - 2026-05-10

Baseline commit: `2087f56 feat: add authentication and admin management`

Branch: `codex-liquid-glass-ui-agent-optimization`

### Latest Results

| Check | Status | Details |
|---|---:|---|
| `npm.cmd run typecheck` | PASS | TypeScript passed after session, ACL, audit, timeline, MCP, and static fallback changes. |
| `npm.cmd run test` | PASS | Vitest: 17 files, 155 tests. |
| `npm.cmd run test:e2e` | PASS | React Playwright suite: 14/14. |
| `npm.cmd run lint` | PASS | 0 errors, 28 warnings under configured threshold. |
| `npm.cmd run build` | PASS | Renderer and Electron build passed; existing Vite chunk-size warning only. |
| `npm.cmd run test:electron-startup` | PASS | Electron startup smoke passed. |
| `npm.cmd run test:launch-static` | PASS | Static fallback launch passed with token-gated URL handling. |
| `npm.cmd run test:static-browser` | PASS | Static browser smoke passed after token URL update. |
| `npm.cmd run smoke` | PASS | 179/179 checks passed. |
| `npm.cmd run verify` | PASS | 100/100 build completeness checks, then smoke 179/179. |
| `npm.cmd run scan:mojibake` | PASS | 141 files checked; legacy docs remain explicitly allowlisted. |

### Fixes Verified

- Renderer no longer persists raw `sessionToken` in localStorage or reads it from preload.
- Main-process `mustChangePassword` guard blocks privileged IPC access until password change completes.
- Project/workflow resources now carry owner ACL metadata, and project-scoped child resources enforce ACL-derived read/write/admin checks.
- Admin safety checks prevent self-demotion/self-disable and preserve at least one active admin.
- Password change/reset and role/status updates revoke stale sessions as appropriate.
- Audit logs include retention dates, hash-chain fields, export integrity reports, and timeline correlation records.
- MCP allowlist IPC is admin-gated and writes audited timeline records.
- Static fallback is token/cookie gated, loopback-only by default, and denies sensitive file classes.
- Mojibake scan is available as `npm.cmd run scan:mojibake`.

### Remaining Risk

- Session token hardening is main-process memory based, not durable Electron `safeStorage` persistence.
- JSON storage does not provide database transactions or append-only audit guarantees.
- MCP allowlist is not yet a runtime sandbox; it is the policy layer for the next pass.
- Audit hash chain is tamper-evident but not externally signed.
- Resource ACL is centered on workflow/project resources; standalone resource-level sharing needs future expansion.

## Security Sandbox Cleanup Round - 2026-05-10

### What Changed

- Added `src/main/secureStore.ts` for Electron `safeStorage` secret envelopes.
- Provider API keys are now stored as protected envelopes and only returned masked to the renderer.
- Added durable main-process active session recovery through a protected settings value while keeping raw tokens out of renderer storage.
- Added dedicated workflow ACL IPC and a Project Detail sharing panel.
- Added MCP gateway decisions with deny-by-default sandbox metadata and audit/run-event correlation.
- Added audit export manifests with chain-head checkpoint hashes.
- Removed generated shared JS artifacts from `src/shared`.
- Strengthened mojibake scan coverage for common historical corruption markers.

### Focused Results

| Check | Status | Details |
|---|---:|---|
| `npm.cmd run typecheck` | PASS | TypeScript passed after security gateway and sharing UI changes. |
| `npm.cmd run test -- tests/unit/secureStore.test.ts tests/unit/mcpGateway.test.ts tests/unit/audit.test.ts tests/unit/resourceAcl.test.ts tests/unit/apiRuns.test.ts` | PASS | 5 files / 20 tests. |
| `npm.cmd run scan:mojibake` | PASS | 144 files checked; 6 legacy docs allowlisted. |

### Full Validation Results

| Check | Status | Details |
|---|---:|---|
| `npm.cmd run typecheck` | PASS | TypeScript passed. |
| `npm.cmd run test` | PASS | Vitest: 19 files / 163 tests. |
| `npm.cmd run test:e2e` | PASS | Playwright React suite: 14/14. |
| `npm.cmd run lint` | PASS | 0 errors / 28 warnings under threshold. |
| `npm.cmd run build` | PASS | Renderer and Electron build passed; existing Charts chunk-size and api dynamic-import warnings only. |
| `npm.cmd run test:electron-startup` | PASS | Electron ready marker captured on `127.0.0.1:5200`. |
| `npm.cmd run test:launch-static` | PASS | Token-gated static fallback launch returned HTTP 200 and remained alive. |
| `npm.cmd run test:static-browser` | PASS | Static browser workflow, layout, persistence, redaction, and console/network checks passed. |
| `npm.cmd run smoke` | PASS | 184/184 checks. |
| `npm.cmd run verify` | PASS | 100/100 build verification plus smoke 184/184. |
| `npm.cmd run scan:mojibake` | PASS | 144 files checked; 6 legacy docs allowlisted. |

### Remaining Risk

- Audit manifest checkpoints are local hash manifests, not external signatures.
- MCP runtime gateway is a decision/sandbox broker only; no tool execution path was added.
- Full historical UI copy cleanup is still deferred to avoid broad text churn in this security round.

## Liquid Glass UI And Workflow Onboarding Pass - 2026-05-09

Baseline tag: `codex-liquid-glass-ui-base-20260509-172941`

Branch: `codex-liquid-glass-ui-agent-optimization`

### Project Creation Planning Close Loop - 2026-05-09

| Check | Status | Details |
|---|---:|---|
| `npm.cmd run typecheck` | PASS | TypeScript passed after route-state and create-result hardening. |
| `npm.cmd run lint` | PASS | 0 errors, 25 existing warnings under threshold. |
| `npm.cmd run test -- tests/unit/planner.test.ts tests/unit/memoryInjection.test.ts tests/unit/exporters.test.ts` | PASS | Focused planning/export/memory regression: 3 files, 30 tests. |
| `npm.cmd run test` | PASS | Vitest: 11 files, 116 tests. |
| `npm.cmd run build` | PASS | Renderer and Electron build passed; existing Charts chunk-size warning only. |
| `npm.cmd run smoke` | PASS | 138/138 checks passed, including E2E/Electron port lifecycle guards. |
| `npm.cmd run verify` | PASS | 100/100 build completeness checks, then smoke 138/138. |
| `npm.cmd run test:electron-startup` | PASS | Electron ready marker captured with project-local userData. |
| `npm.cmd run test:e2e` | PASS | React Playwright suite passed 9/9, including create -> detail -> plan next-step flow and IPC error handling. |
| Concurrent `test:e2e` + `test:electron-startup` | PASS | Port reservation hardening avoided the previous `5173` collision; Electron used `5200` in the successful run. |
| `npm.cmd run test:long-run` | PASS | 30.07-minute static stability run, 31 samples, no crash/error/network failure/heap growth. |
| `npm.cmd run test:launch-static` | PASS | Static fallback launch and localized markers verified after long-run completed. |
| `npm.cmd run test:static-browser` | PASS | Static browser workflow, Agent run record flow, 1024x680, 390x844, and browser error checks passed. |

### Fixes Verified In This Close Loop

- New project creation opens Project Detail directly and marks plan generation as the next action.
- Form labels in the new project modal are bound to controls for accessibility and stable E2E selectors.
- Create responses containing IPC `{ error }` no longer navigate as successful creations.
- ProjectDetail clears stale `plan` state during project loads, preventing an old plan from hiding the next-step card.
- E2E verifies the full user-visible path: create project, land on detail, see next-step card, generate plan, and see export/memory actions.
- Playwright and Electron startup validations now reserve separate free ports, use strict Vite ports, and no longer default to reusing an arbitrary existing `5173` service.
- Long-run result JSON: `D:\AgentFlowStudio\.codex-parallel\results\long-run-static-20260509150812.json`.
- Static browser smoke result JSON: `D:\AgentFlowStudio\.codex-parallel\results\static-browser-smoke-20260509153918.json`.

### Latest Results

| Check | Status | Details |
|---|---:|---|
| `npm.cmd install` | PASS | Dependencies up to date; existing audit issues unchanged. |
| `npm.cmd run typecheck` | PASS | TypeScript passed. |
| `npm.cmd run lint` | PASS | 0 errors, 25 existing warnings under threshold after concurrent ProjectDetail edits. |
| `npm.cmd run smoke` | PASS | 132/132 checks passed, including Liquid Glass tokens and workflow lifecycle rail markers. |
| `node --check static-app\app.js` | PASS | Static fallback JS syntax valid. |
| `npm.cmd run test -- tests/unit/apiRuns.test.ts` | PASS | New focused regression: 1 file, 3 tests passed for Agent run record create/list bridge behavior. |
| `npm.cmd run test` | PASS | Vitest: 11 files, 116 tests passed. |
| `npm.cmd run build` | PASS | Renderer and Electron build passed; existing Charts chunk-size warning only. |
| `npm.cmd run test:launch-static` | PASS | Static fallback launch, HTTP 200, localized keywords, and static markers verified. |
| `npm.cmd run test:static-browser` | PASS | Liquid Glass blur/shadow, next-step CTA, lifecycle rail, Agent run record save flow, 1024x680, 390x844, persistence, redaction, and console/network/page errors verified. |
| `npm.cmd run test:electron-startup` | PASS | Electron ready marker captured with project-local userData. |
| `npm.cmd run test:e2e` | PASS | React Playwright suite passed 7/7, including ProjectDetail Agent run record save flow. Earlier parallel local-service run hit `127.0.0.1:5173` connection refused. |
| `npm.cmd run verify` | PASS | 100/100 build completeness checks, then smoke 132/132. |

### Fixes Verified

- Tailwind accent palette now includes the shades already used by components.
- React and static fallback both use stronger Liquid Glass tokens: surface, hover surface, border, highlight, inner stroke, layered shadow, and focus ring.
- Dashboard now tells users the next action and shows the AI collaboration lifecycle: Idea, Plan, Tasks, Prompt, Safety, Logs, Memory, Handoff.
- Static fallback preserves the stable launcher while gaining the same onboarding rail.
- Static browser smoke now covers mobile-width `390x844` no-horizontal-overflow checks.
- Agent run record API regression now covers `api.runs.create()` and `api.runs.list()` against the namespaced preload bridge, legacy bridge fallback, and no-preload fallback.
- ProjectDetail now has browser-click validation for saving a local-only Agent execution record.

### Remaining Work

- Navigate newly created projects directly to detail and highlight plan generation.
- Add Settings runtime status and provider test feedback.
- Add Prompt Lab post-generation next actions.
- Add i18n mojibake quality gate.
- Harden E2E server lifecycle to avoid parallel `5173` contention.

## Continuation Stability Release 1.1.1 - 2026-05-09

Baseline commit: `97e37f7473f67a6ac41d25f2ac1f5f3e4200f691`

Branch: `codex-static-quality-pass`

### Latest Continuation Results

| Check | Status | Details |
|---|---:|---|
| `npm.cmd run test:long-run` | PASS | Additional 30.04-minute static fallback run, 31 samples, no crash, disconnect, console error, page error, network failure, or heap growth. |
| `npm.cmd run typecheck` | PASS | TypeScript checks passed at `1.1.1`. |
| `npm.cmd run lint` | PASS | 0 errors, 36 existing warnings under configured threshold. |
| `npm.cmd run smoke` | PASS | 117/117 checks passed. |
| `npm.cmd run verify` | PASS | 99/99 build completeness checks passed, then smoke passed. |
| `npm.cmd run test` | PASS | Vitest: 9 files, 109 tests passed. |
| `npm.cmd run build` | PASS | Renderer and Electron build passed; existing Charts chunk-size warning only. |
| `npm.cmd run test:launch-static` | PASS | Static launcher, HTTP 200, localized keywords, and server liveness verified. |
| `npm.cmd run test:static-browser` | PASS | Navigation, persistence, redaction, Liquid Glass blur, layout, and console/network/page errors verified. |
| `npm.cmd run test:e2e` | PASS | Playwright React web suite: 5/5 passed. |
| `npm.cmd run test:electron-startup` | PASS | Electron ready marker captured with project-local userData. |

### Continuation Notes

- Result JSON: `D:\AgentFlowStudio\.codex-parallel\results\long-run-static-20260509065035.json`
- Screenshot: `D:\AgentFlowStudio\.codex-parallel\results\long-run-static-20260509065035.png`
- Server log: `D:\AgentFlowStudio\.codex-parallel\logs\long-run-static-server-20260509065035.log`
- Version files are bumped to `1.1.1`; source code behavior is unchanged from the verified `v1.1.0` release.

## Stability Release 1.1.0 - 2026-05-09

Baseline commit: `fb442d686b21c993887c0d60c5c3a3a107d21d5d`

Branch: `codex-static-quality-pass`

### Latest Verified Results

| Check | Status | Details |
|---|---:|---|
| `npm.cmd run typecheck` | PASS | TypeScript renderer/main checks passed. |
| `npm.cmd run lint` | PASS | 0 errors, 36 existing warnings under the configured threshold. |
| `npm.cmd run smoke` | PASS | 117/117 smoke checks passed. |
| `npm.cmd run verify` | PASS | 99/99 build completeness checks passed, then smoke passed. |
| `npm.cmd run test` | PASS | Vitest: 9 files, 109 tests passed. |
| `npm.cmd run build` | PASS | Renderer and Electron main/preload built successfully; Charts chunk-size warning only. |
| `npm.cmd run test:launch-static` | PASS | Static server starts, returns HTTP 200, validates Chinese/English keywords, and remains alive. |
| `npm.cmd run test:static-browser` | PASS | Browser workflow covers navigation, project creation, Prompt Lab, log analysis, safety, memory, settings, persistence, redaction, Liquid Glass, 1024x680 layout, and console/network/page errors. |
| `npm.cmd run test:e2e` | PASS | Playwright React web suite: 5/5 tests passed with project-local browser cache. |
| `npm.cmd run test:electron-startup` | PASS | Real Electron startup reached ready marker using project-local `.codex-parallel/electron-user-data-smoke`. |
| `npm.cmd run test:long-run` | PASS | 30.04-minute static fallback run: 31 samples, no crash, disconnect, console error, page error, network failure, or heap growth. |

### Fixes Verified

- Electron production startup no longer crashes on ESM `__dirname`.
- Dashboard no longer crashes when rendering lucide `forwardRef` icons in `StatCard`.
- Prompt Lab lint blocker is fixed.
- Provider API keys are masked for renderer display and not prefilled back into the edit form.
- Memory/export/storage paths redact secrets.
- Static fallback remains available through `start-agentflow-static.bat -> scripts/static-server.js static-app 4173`.
- Liquid Glass blur is still present in React and static paths.
- Dashboard now includes a beginner-friendly three-step path.
- Renderer base CSS now has a unified Chinese/English font stack.

### Current Notes

- All test/browser/cache/log artifacts from this pass stay under `D:\AgentFlowStudio\.codex-parallel` or `D:\AgentFlowStudio\handoff`.
- `npm audit` still reports dependency vulnerabilities that require major upgrades; they were not changed in this stability release to avoid dependency churn.
- Build still reports a non-failing Vite chunk-size warning for Charts.

## Static Quality Pass - 2026-05-08

Baseline commit: `cec7dfb fix: stabilize localized static launcher`

Current usable deliverable remains **Static fallback / 静态可交付模式**:

```bat
D:\AgentFlowStudio\start-agentflow-static.bat
```

Desktop shortcut:

```text
C:\Users\至亲\Desktop\AgentFlow Studio.lnk
TargetPath: D:\AgentFlowStudio\start-agentflow-static.bat
WorkingDirectory: D:\AgentFlowStudio
IconLocation: D:\AgentFlowStudio\assets\icon.ico,0
```

### Latest Verified Results

| Check | Status | Details |
|---|---:|---|
| Fresh agent workspace | PASS | Previous `.codex-parallel` archived to `handoff\archived-agents\run-20260508-173352`; new A-G task/log files created. |
| New subagents | PASS | Six real subagents B-G were started; Agent A regression guard was run in the main thread. |
| `npm.cmd run icon` | PASS | Regenerated `assets\icon.svg`, `assets\icon.png`, and `assets\icon.ico`. |
| `npm.cmd run smoke` | PASS | Expanded static QA passed, 111/111 checks, including launcher log-lock guards. |
| `npm.cmd run typecheck` | PASS | `tsc --noEmit -p tsconfig.json` completed successfully. |
| `npm.cmd run test:launch-static` | PASS | Starts `scripts\static-server.js`, returns HTTP 200, validates Chinese and English keywords, confirms process stays alive >5 seconds. |
| Locked launcher log regression | PASS | Held `logs\launcher-static.log` open with an exclusive lock; `start-agentflow-static.bat` still started and wrote per-run launcher/server logs. |
| `npm.cmd run shortcut` | PASS | Recreated/verified Desktop shortcut to the static launcher. |
| Desktop shortcut COM verification | PASS | Target, working directory, and icon match the required Static fallback values. |
| Real bat launch | PASS | `cmd /k start-agentflow-static.bat` stayed open after 15 seconds and wrote launcher/server logs. |
| Static HTTP smoke | PASS | `http://127.0.0.1:4173` returned HTTP 200 with AgentFlow Studio, core Chinese navigation, and English preference keywords. |
| Static JS syntax | PASS | `node --check static-app/app.js` passed. |

### Feature Verification

- Chinese-first UI remains the default.
- Topbar language toggle is present and uses `agentflow.language`.
- Topbar theme cycle supports `system`, `light`, and `dark` through `agentflow.theme`.
- Settings includes `界面偏好 / Interface Preferences`, language selector, theme selector, current language, and current theme.
- Static CSS includes `[data-theme="light"]`, `[data-theme="dark"]`, and `prefers-color-scheme`.
- Prompt Lab supports `off`, `minimal`, `balanced`, and `full` Shared Memory injection modes.
- Shared Memory context uses canonical markers:

```text
[Shared Memory Context]
...
[/Shared Memory Context]
```

- Recovery Prompt includes project name, current scheme, usable launcher, known limitation, and next step.
- Recursive secret redaction now covers strings, arrays, objects, nested objects, circular references, key-aware fields, and export/injection paths.
- React routes are wrapped in a route-level ErrorBoundary.
- Static fallback catches page render errors and shows localized fallback actions.
- Static launcher uses per-run `launcher-static-<timestamp>.log` and `static-server-<timestamp>.log` files, so an old open window or locked `launcher-static.log` no longer blocks startup.

### Environment Notes

- `npm.cmd run test`: blocked by Vite/Vitest esbuild `spawn EPERM`.
- `npm.cmd run build`: blocked by Vite esbuild `spawn EPERM`.
- Playwright browser binary is not installed, so browser click verification could not run in this environment. Static runtime was verified through HTTP, launch tests, and a Node VM execution check.
- These environment limits do not block the Static fallback.

### Logs To Inspect

```text
D:\AgentFlowStudio\logs\launcher-static.log
D:\AgentFlowStudio\logs\static-server.log
D:\AgentFlowStudio\logs\launcher-static-<timestamp>.log
D:\AgentFlowStudio\logs\static-server-<timestamp>.log
D:\AgentFlowStudio\.codex-parallel\PARALLEL_SUMMARY.md
D:\AgentFlowStudio\.codex-parallel\logs\
```
