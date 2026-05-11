# LocalAI Nexus Refactor Plan

## 1. 总目标

将 `D:\AgentFlowStudio` 内的现有 AgentFlow Studio 演进为 LocalAI Nexus / 本地 AI 中枢。

Product:

- Name: LocalAI Nexus
- Chinese name: 本地 AI 中枢
- English subtitle: Local AI Gateway, Runtime & AgentOps Hub
- Chinese subtitle: 本地 AI 网关、运行时切换与 AgentOps 控制中心

Positioning:

LocalAI Nexus is a local AI resource gateway, runtime switcher, token health panel, skill manager, Agent/Workflow automation platform, and security audit console.

## 2. 非目标

- Do not rebuild from scratch.
- Do not create a replacement project outside `D:\AgentFlowStudio`.
- Do not remove `.git` or rewrite Git history.
- Do not remove Shared Memory Hub without discussion.
- Do not change storage strategy from local JSON to SQLite in this round.
- Do not claim real provider invocation, token accounting, or workflow automation is complete until tested.
- Do not make static fallback the final desktop shortcut target.

## 3. 功能模块拆分

| Module | Scope | Minimum Completion Standard |
|---|---|---|
| Brand | LocalAI Nexus names, titles, README, app/window/package/shortcut/icon | No visible old title except historical note |
| Provider Hub | OpenAI/Anthropic/Gemini/Ollama/custom providers, headers, proxy, tags, risk | create/save/test one OpenAI-compatible provider |
| Token Center | credential list/pool, usage counters, failure classes, limits/cooldown | basic request/token/failure recording |
| Health Monitor | provider health states and endpoint diagnostics | display health and last check result |
| Local Gateway | localhost `127.0.0.1:8317`, `/health`, `/v1/models`, chat/responses/messages | no unexplained 404 for `/responses` |
| Runtime Switcher | Codex/Claude/CLI/custom profiles, config export suggestions | generate Codex or Claude config recommendation |
| Model Router | default/code/fast/long/local/fallback routes | select enabled healthy provider/model and explain fallback |
| Skill Hub | prompt/tool/workflow/MCP/script/agent/composite skills | create, enable, disable, test one Prompt Skill |
| Agent Studio | agent metadata, model strategy, skill binding, execution records | agent can call one skill or provider mock |
| Workflow Studio | nodes, timeline, retry/pause/cancel planned | workflow can call one skill or provider mock |
| Security Center | auth/RBAC/ACL/audit/redaction/risk reports | key audit events and permission denial visible |
| Admin | users, audit, settings | existing admin retained under Nexus navigation |

## 4. 架构模块拆分

Target main process:

```text
src/main/domain/auth
src/main/domain/access
src/main/domain/ai-resources
src/main/domain/gateway
src/main/domain/router
src/main/domain/health
src/main/domain/usage
src/main/domain/skills
src/main/domain/workflow
src/main/domain/agents
src/main/domain/audit
src/main/domain/storage
src/main/ipc
```

Target shared:

```text
src/shared/types
src/shared/schemas
src/shared/protocols
src/shared/constants
```

Target renderer:

```text
src/renderer/features/dashboard
src/renderer/features/ai-resources
src/renderer/features/runtime
src/renderer/features/token-center
src/renderer/features/health
src/renderer/features/skills
src/renderer/features/agents
src/renderer/features/workflows
src/renderer/features/security
src/renderer/features/admin
src/renderer/components
src/renderer/layouts
```

## 5. 多 agent 分工方案

Initial read-only agents used:

| Agent | Status | Result |
|---|---|---|
| Agent A | Complete | Current architecture and target boundaries audited |
| Agent B | Complete | Cleanup/archive/deletion risks audited |
| Agent C | Complete | UI/brand/icon/startup risks audited |

Implementation agents:

| Agent | Ownership | Write Scope | Notes |
|---|---|---|---|
| A Architecture | domain/service/ipc split, shared type/schema/protocol plan | `src/main/domain/**`, `src/main/ipc/**`, `src/shared/**` | Must avoid broad rewrites of renderer |
| B Cleanup | archive/docs/handoff/root cleanup | `docs/**`, `handoff/**`, `archive/**`, root docs | No source deletion without audit entry |
| C Provider/Token/Health | provider model, credential metadata, usage/health service, UI | `src/main/domain/ai-resources/**`, `usage/**`, `health/**`, renderer AI resources | Coordinate shared types |
| D Gateway/Runtime/Router | local HTTP gateway, runtime profile, model router | `src/main/domain/gateway/**`, `router/**`, runtime UI/tests | Own port `8317` |
| E Skill/Agent/Workflow | Skill Hub, prompt skill test, workflow/agent calls | `src/main/domain/skills/**`, `workflow/**`, `agents/**`, renderer features | No MCP execution beyond policy until safe |
| F Security/Audit/RBAC | audit events, redaction, permission UI, risk scoring | `src/main/domain/audit/**`, `access/**`, security UI | Preserve current auth behavior |
| G UI/Docs/Icon | navigation, dashboard, README bilingual, icon | renderer shell/assets/scripts docs | Must not break tests |
| H Tests/Release/Shortcut | test report, smoke, build, shortcut, commit/push | tests/scripts/handoff | Final integration owner |

Coordination:

- All workers read this plan and `docs/LOCALAI_NEXUS_ARCHITECTURE.md` first.
- `src/main/ipc.ts` and `src/shared/types.ts` are conflict hotspots. One owner at a time.
- Workers do not revert each other's changes.
- Unknown functionality is marked `planned`, not `completed`.

## 6. 各模块输入输出

| Module | Inputs | Outputs |
|---|---|---|
| Provider Hub | provider form, credentials, headers, proxy, tags | masked provider records, test result, audit event |
| Token Center | gateway/provider calls, mock calls, workflow/agent ids | usage records, failure class, latency metrics |
| Health Monitor | provider configs, gateway endpoints | health state, diagnostics, risk hints |
| Local Gateway | OpenAI/Anthropic/Gemini/Ollama-compatible requests | normalized response, error shape, usage event |
| Runtime Switcher | active provider/model/profile | config snippets `.env`/JSON/TOML/YAML |
| Model Router | request intent, health, usage, tags | selected provider/model, fallback reason |
| Skill Hub | skill definition, schema, test input | test result, audit, usage attribution |
| Agent Studio | agent config, skills, model route | execution record, timeline, audit |
| Workflow Studio | workflow graph, input, node config | run result, timeline, token attribution |
| Security Center | audit logs, ACL/RBAC, scans | risk dashboard, export-ready report |

## 7. 各模块依赖关系

```text
Provider Hub -> Credential/SecureStore -> Health Monitor -> Model Router
Model Router -> Local Gateway -> Usage/Token Center -> Audit
Runtime Switcher -> Provider Hub + Model Router + Gateway Diagnostics
Skill Hub -> Security Policy + Usage + Audit
Agent Studio -> Skill Hub + Model Router + Workflow/Run Timeline
Workflow Studio -> Skill Hub + Provider/Router + Usage + Audit
Security Center -> Auth/RBAC + Audit + Redaction + Risk Scoring
Dashboard -> Gateway + Provider + Health + Usage + Workflow + Security summaries
```

## 8. 各模块完成标准

Minimum definition of done for this refactor:

- App launches as LocalAI Nexus.
- Dashboard shows gateway, provider, token, errors, workflows, security risks.
- Provider Hub can configure and test an OpenAI-compatible provider.
- API keys remain main-process protected/masked.
- Token Center records basic request/token/failure data.
- Health Monitor shows provider health.
- Gateway supports `/health`, `/v1/models`, `/v1/chat/completions`, and diagnostic `/responses`.
- Runtime Switcher generates Codex or Claude Code config advice.
- Skill Hub can create/toggle/test a Prompt Skill.
- Workflow or Agent can call one Skill or Provider mock.
- Security Center records audit events.
- New icon and shortcut are updated.
- README is bilingual and honest about completed/in progress/planned.

## 9. 各模块测试标准

| Module | Tests |
|---|---|
| Provider Hub | unit provider persistence/masking/test mock |
| Token Center | unit usage aggregation and failure classification |
| Health Monitor | unit health state transitions |
| Local Gateway | HTTP tests for `/health`, `/v1/models`, chat, responses, `/responses` |
| Runtime Switcher | unit config generation |
| Model Router | unit route/fallback/cooldown behavior |
| Skill Hub | unit create/toggle/test prompt skill |
| Agent/Workflow | unit skill/provider mock execution |
| Security | unit redaction/audit/permission denial |
| UI | typecheck, lint, smoke, Playwright if available |
| Startup/Icon/Shortcut | electron startup smoke, shortcut COM verification, icon file validation |

## 10. 清理策略

- Keep `.git`, package files, lock files, active launchers, active source, active tests, active handoff.
- Archive historical process docs under `archive/YYYY-MM/...`.
- Delete only generated/ignored artifacts after tests prove rebuildability.
- Document all deletions and migrations in `PROJECT_STRUCTURE_AUDIT.md` and this worklog.

## 11. 迁移策略

- Add new domain files first, then route IPC handlers to services.
- Preserve current `window.agentflow` bridge during migration; later add `window.localaiNexus` alias if needed.
- Keep existing data collections and add new collections rather than destructive migrations.
- Keep old localStorage keys with migration aliases.
- Keep old AgentFlow name only in README historical note and data migration notes.

## 12. 风险控制

| Risk | Mitigation |
|---|---|
| IPC conflicts | One owner for `ipc.ts`; extract incrementally |
| Shared type breakage | Add compatibility exports while splitting |
| Secret exposure | Keep keys in main safeStorage; renderer sees masks only |
| Gateway hangs | Add timeout, diagnostic errors, no default remote calls in tests |
| Static fallback browser launch | Keep as fallback, remove from desktop shortcut |
| Mojibake | Replace visible corrupted copy during rebrand |
| Test instability | Use existing smoke/unit/build gates repeatedly |

## 13. 回滚策略

- Git branch isolates refactor.
- Commit coherent milestones.
- Before major deletion, ensure archived copy exists.
- If a module breaks build, revert only that module patch, not user changes.
- Keep old launch scripts as compatibility wrappers until new shortcut is verified.

## 14. UI 参考 CCS 的具体原则

Sources reviewed:

- CCS: https://github.com/kaitranntt/ccs and https://ccs-7e541244.mintlify.app/
- CliGate: https://github.com/codeking-ai/cligate

Borrow principles, not copy:

- One visible profile system instead of scattered config.
- Runtime, Provider, Profile are separate concepts.
- Clear active/default state.
- One-click test, enable/disable, copy config.
- Diagnostic errors must say what to fix.
- Local Gateway URL guidance must distinguish `http://127.0.0.1:8317` and `/v1`.

LocalAI Nexus-specific UI:

- Main nav:
  - Dashboard
  - AI Resources: Provider Hub, Token Center, Health Monitor, Model Router
  - AI Runtime: Local Gateway, Runtime Switcher, Diagnostics
  - Skill Hub
  - Agent Studio
  - Workflow Studio
  - Security Center
  - Admin
  - Settings
- Dashboard has three first-run buttons:
  - Add Provider
  - Start Local Gateway
  - Create First Workflow
- Product feel: dense, calm, operator-focused control center, not a marketing page.

## 15. 图标重设计方案

- Use a minimal Nexus node mark.
- Suggested geometry: rounded square or squircle, central local AI core, 3 connected nodes, subtle shield/gateway outline.
- Palette: restrained neutral background plus one green/blue accent, no complex gradient.
- Outputs:
  - `assets/localai-nexus.svg`
  - `assets/localai-nexus.png`
  - `assets/localai-nexus.ico`
  - `static-app/assets/localai-nexus.svg`
- Update:
  - BrowserWindow icon
  - electron-builder `win.icon`
  - shortcut script icon path
  - static fallback favicon
  - README project display section

## 16. 启动体验重构方案

Final desktop behavior:

- Only one LocalAI Nexus Electron BrowserWindow.
- Window title: `LocalAI Nexus`.
- Default route: Dashboard.
- No DevTools unless explicitly enabled.
- No old welcome/debug/system alert popup.
- No external browser auto-open from desktop shortcut.
- Static fallback remains manual recovery path.
- Login/initialization/errors are in the main window, not external popups.

Implementation order:

1. Add brand constants.
2. Update Electron app/window names and icon.
3. Update launcher labels and environment names.
4. Update shortcut script.
5. Verify Electron startup smoke.
6. Update static fallback metadata without making it desktop default.
