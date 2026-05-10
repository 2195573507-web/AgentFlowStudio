# LocalAI Nexus Architecture

## 1. 总体架构图

```text
LocalAI Nexus Desktop
|
|-- React Renderer
|   |-- Dashboard
|   |-- AI Resources: Provider Hub, Token Center, Health Monitor, Model Router
|   |-- AI Runtime: Local Gateway, Runtime Switcher, Diagnostics
|   |-- Skill Hub
|   |-- Agent Studio
|   |-- Workflow Studio
|   |-- Security Center
|   |-- Admin / Settings
|
|-- Preload Bridge
|   `-- typed, least-privilege IPC calls
|
|-- Electron Main
|   |-- IPC Guard: origin, session, RBAC, schema validation
|   |-- Domain Services
|   |   |-- Auth / Access
|   |   |-- Provider Hub
|   |   |-- Token Center / Usage
|   |   |-- Health Monitor
|   |   |-- Local Gateway
|   |   |-- Runtime Switcher
|   |   |-- Model Router
|   |   |-- Skill Hub
|   |   |-- Agent Runtime
|   |   |-- Workflow Runtime
|   |   `-- Audit / Security
|   |-- Runtime Layer
|   |   |-- HTTP gateway on 127.0.0.1:8317
|   |   |-- protocol adapters
|   |   `-- route/fallback/streaming handlers
|   `-- Data Layer
|       |-- JSON repositories
|       |-- safeStorage credential envelopes
|       `-- append-style audit/usage logs
```

## 2. UI 层

Responsibilities:

- Present LocalAI Nexus control-plane pages.
- Never persist or display raw API keys after save.
- Use IPC bridge only.
- Show loading, empty, error, and data states.
- Provide actionable diagnostics for provider/runtime/gateway failures.

Key pages:

- Dashboard
- Provider Hub
- Token Center
- Health Monitor
- Local Gateway
- Runtime Switcher
- Diagnostics
- Skill Hub
- Agent Studio
- Workflow Studio
- Security Center
- Admin
- Settings

## 3. IPC 层

Responsibilities:

- Register per-domain handlers.
- Validate sender origin.
- Validate session and RBAC permission.
- Validate payload schemas before service calls.
- Normalize errors to a common shape.
- Record permission denied and sensitive operations in audit.

Target files:

```text
src/main/ipc/register.ts
src/main/ipc/guard.ts
src/main/ipc/permissions.ts
src/main/ipc/providerHandlers.ts
src/main/ipc/gatewayHandlers.ts
src/main/ipc/usageHandlers.ts
src/main/ipc/healthHandlers.ts
src/main/ipc/runtimeHandlers.ts
src/main/ipc/skillHandlers.ts
src/main/ipc/agentHandlers.ts
src/main/ipc/workflowHandlers.ts
src/main/ipc/securityHandlers.ts
```

## 4. Service 层

Responsibilities:

- Pure business behavior behind IPC.
- No direct React concerns.
- No direct arbitrary command execution.
- Dependencies injected or imported through domain repositories.
- Return typed results and structured errors.

Initial services:

- `providerService`
- `credentialService`
- `usageService`
- `healthService`
- `gatewayService`
- `runtimeProfileService`
- `modelRouterService`
- `skillService`
- `agentService`
- `workflowService`
- `auditService`

## 5. Runtime 层

Responsibilities:

- Local HTTP Gateway on `http://127.0.0.1:8317`.
- OpenAI-compatible endpoints:
  - `GET /health`
  - `GET /v1/models`
  - `POST /v1/chat/completions`
  - `POST /v1/responses`
  - `POST /responses`
  - `POST /v1/messages`
- Protocol conversion between OpenAI, Anthropic, Gemini, Ollama-compatible shapes.
- Streaming support planned; initial implementation may return structured non-streaming diagnostics.
- Request logs, token usage, error classification, fallback.

## 6. Data 层

Current:

- JSON collections under Electron `userData`.
- `safeStorage` wrapper for protected secrets.
- In-process write queues.

Target collections:

```text
providers.json
credentials.json or providerSettings.json with protected envelopes
tokenUsage.json
gatewayRequests.json
healthChecks.json
runtimeProfiles.json
modelRoutes.json
skillsRegistry.json
skillRuns.json
agents.json
agentExecutions.json
workflows.json
workflowVersions.json
workflowRuns.json
auditLogs.json
settings.json
```

Do not migrate to SQLite in this round unless separately approved.

## 7. Security 层

Responsibilities:

- Login and local admin.
- RBAC and resource ACL.
- API key encryption with Electron `safeStorage`.
- Secret redaction for logs, exports, memory, and UI.
- Prompt Injection risk notes.
- High-risk operation detection.
- Audit hash chain.
- Permission denial records.

Renderer boundary:

- Renderer receives masked key metadata only.
- Renderer can request tests/runs through IPC, but provider invocation occurs in main/runtime only.

## 8. Provider Hub

Data model additions:

- provider type: OpenAI-compatible, Anthropic-compatible, Gemini-compatible, Ollama/local, custom.
- base URL, model names, custom headers, proxy URL.
- credential ref, auth type, OAuth planned.
- tags: default, code, fast, long-context, local, fallback.
- enabled/disabled.
- risk level.
- last health/test result.

Calls:

```text
UI -> provider IPC -> providerService -> storage/secureStore/audit
providerService -> healthService for test
```

## 9. Token Center

Tracks:

- request count: today/week/month.
- input/output/total tokens.
- success/failure rate.
- average and P95 latency.
- failure category: 401, 403, 404, 429, timeout, model_not_found, protocol_error.
- rate limit, cooldown, daily/monthly quota, concurrency limit.
- dimensions: provider, model, project, workflow, agent.

Initial token counts can be recorded from request payload/response usage when available; approximate counters must be labeled as such.

## 10. Health Monitor

States:

- Healthy
- Degraded
- RateLimited
- AuthFailed
- QuotaLow
- ModelUnavailable
- ProtocolError
- Offline
- Unknown

Checks:

- Base URL reachable.
- API key valid.
- `/v1/models`.
- `/v1/chat/completions`.
- `/v1/responses`.
- `/responses` diagnostic/compatibility.
- `/v1/messages`.
- `/health`.
- stream/tool calling/model existence when supported.

## 11. Local Gateway

Default:

```text
http://127.0.0.1:8317
```

Endpoint behavior:

- `/health`: always returns gateway status and active route state.
- `/v1/models`: returns available local routed models.
- `/v1/chat/completions`: routes to selected provider or returns clear mock/diagnostic if no provider.
- `/v1/responses`: routes or returns clear diagnostic.
- `/responses`: never unexplained 404; explain whether client should use root base URL or `/v1`.
- `/v1/messages`: Anthropic-compatible path.

Error standard:

```json
{
  "error": {
    "code": "base_url_mismatch",
    "message": "Use http://127.0.0.1:8317 as the Base URL for /v1/responses.",
    "hint": "If your client appends /v1 automatically, do not include /v1 in the Base URL."
  }
}
```

## 12. Runtime Switcher

Profiles:

- Codex Profile
- Claude Code Profile
- CLI Profile
- Custom Runtime Profile

Outputs:

- `.env`
- JSON
- TOML
- YAML
- copyable instructions

Diagnostics:

- 404: base URL or endpoint mismatch.
- 401: auth missing/invalid.
- 429: rate limit/cooldown.
- model_not_found: wrong model name or provider mapping.

## 13. Model Router

Routes:

- default model
- code model
- fast model
- long-context model
- local privacy model
- fallback model

Policy:

- Prefer healthy enabled providers.
- Respect tags and profile.
- Cool down after 429.
- Fallback on retryable failure.
- Cost/latency/sticky session planned.

## 14. Skill Hub

Skill types:

- Prompt Skill
- Tool Skill
- Workflow Skill
- MCP Skill
- Script Skill
- Agent Skill
- Composite Skill

Minimum capabilities:

- list/create/import.
- enable/disable.
- risk and permission metadata.
- input/output schema.
- test sample.
- run test.
- audit and usage attribution.

## 15. Agent Studio

Capabilities:

- Agent list.
- Capability description.
- Default model strategy.
- Available skills/tools.
- Run records.
- Token attribution.
- Audit.
- Feedback records.

Runtime path:

```text
Agent -> Model Router -> Provider/Gateway
Agent -> Skill Hub -> Skill Test/Run
Agent -> Usage + Audit + Timeline
```

## 16. Workflow Studio

Nodes:

- LLM
- Skill
- Tool
- Condition
- HTTP
- Human confirmation

Runtime:

- existing pure dry-run engine remains as safe base.
- add Skill and Provider mock execution first.
- durable async execution, pause/resume/cancel planned.

## 17. Security Center

Capabilities:

- login/admin/RBAC.
- project and workflow ACL.
- audit logs and hash chain.
- sensitive data scan.
- redaction preview.
- provider risk scoring.
- request content preview.
- permission denial records.
- security report export planned.

## 18. Admin

Admin owns:

- users.
- audit.
- config import/export risk preview.
- storage path.
- diagnostic bundle.

Admin must not expose raw provider secrets.

## 19. 模块调用链

```text
Renderer -> Preload -> IPC Guard -> Schema -> Domain Service -> Repository
                                                |-> SecureStore
                                                |-> Audit
                                                |-> Usage
                                                `-> Runtime/Gateway
```

Gateway call chain:

```text
HTTP request -> Gateway Router -> Model Router -> Provider Adapter -> Usage -> Audit -> HTTP response
```

Workflow call chain:

```text
Workflow UI -> workflow IPC -> workflowService -> skill/provider mock -> runEvents -> usage/audit
```

## 20. 权限边界

- Public IPC: login/session/bootstrap/app info only.
- Authenticated IPC: projects, providers read, skills read, settings read.
- Admin IPC: user management, audit export, privileged config import.
- Provider secrets: write only through main process; read never returns plaintext to renderer.
- Gateway: localhost only by default.
- Static fallback: manual recovery only.

## 21. 数据流

Provider save:

```text
Provider form -> IPC -> providerService -> protectSecret -> providerSettings -> audit -> masked provider to UI
```

Gateway request:

```text
Client -> localhost:8317 -> gatewayService -> router -> providerAdapter -> usage -> audit -> response
```

Skill run:

```text
Skill test input -> skillService -> risk check -> mock/runner -> usage/audit -> result
```

## 22. 审计流

Audit events:

- auth login/logout/password change/failure.
- provider secret stored/test/switch.
- gateway request failure.
- usage anomaly.
- skill create/toggle/test.
- workflow run.
- agent execution.
- permission denied.
- config import/export.

Hash chain:

```text
previousHash + canonical event -> sha256 -> event.hash
```

## 23. 错误处理流

Unified error:

```ts
type NexusError = {
  code: string
  message: string
  hint?: string
  status?: number
  retryable?: boolean
  details?: Record<string, unknown>
}
```

Renderer shows:

- concise message.
- fix suggestion.
- copyable config/diagnostic when useful.

## 24. 测试策略

Required commands:

```text
npm install
npm run typecheck
npm run lint
npm test
npm run build
```

Additional:

- gateway HTTP smoke.
- provider mock.
- usage aggregation.
- health monitor.
- runtime profile generation.
- skill create/toggle/test.
- agent/workflow skill call.
- permission denial.
- audit/redaction.
- electron startup smoke.
- shortcut/icon verification.

Results go to `handoff/TEST_REPORT.md`.

## 25. 后续扩展点

- SQLite storage adapter.
- real streaming provider adapters.
- OAuth provider token refresh.
- scheduler and workflow queue.
- signed audit checkpoints.
- remote channel gateway.
- plugin marketplace.
- cost-aware routing.
- sticky runtime sessions.

## 26. 桌面启动链路

Target:

```text
LocalAI Nexus.lnk
-> D:\AgentFlowStudio\start-localai-nexus.bat
-> node_modules\electron\dist\electron.exe dist-electron\main\index.js
-> BrowserWindow title/icon LocalAI Nexus
-> Dashboard route
```

Compatibility:

- Existing `start-agentflow.bat` may remain as wrapper during migration.
- Static fallback remains manual, not shortcut default.

## 27. 图标资源链路

Target:

```text
scripts/create-icon.js
-> assets/localai-nexus.svg
-> assets/localai-nexus.png
-> assets/localai-nexus.ico
-> static-app/assets/localai-nexus.svg
```

Consumers:

- BrowserWindow `icon`.
- electron-builder `win.icon`.
- shortcut `IconLocation`.
- static fallback favicon.
- README.

## 28. 弹窗控制边界

Allowed at startup:

- One LocalAI Nexus main window.

Allowed after explicit user action:

- save/open dialogs for export/import.
- external links opened by user action.

Not allowed at startup:

- DevTools window.
- alert/system message box.
- browser tab.
- file explorer.
- old static fallback window.
- duplicate BrowserWindow.
