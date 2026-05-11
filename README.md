# LocalAI Nexus

**本地 AI 中枢**  
**Local AI Gateway, Runtime & AgentOps Hub**  
**本地 AI 网关、运行时切换与 AgentOps 控制中心**

LocalAI Nexus is the in-place evolution of AgentFlowStudio. The project remains in `D:\AgentFlowStudio` to preserve Git history, local JSON storage, desktop launchers, and the Shared Memory Hub.

## Current UI Direction

The desktop UI now uses a lightweight flat configuration-tool style. The default design system avoids Liquid Glass, glassmorphism, large transparent panels, backdrop blur, glow, and stacked gradients. Light mode uses near-white gray surfaces; dark mode uses low-saturation dark gray surfaces. The main accent is a restrained teal-blue, and the shared card primitive is `SurfaceCard`.

See `docs/UI_DESIGN_SYSTEM.md` for the color tokens, typography, spacing, component rules, and the CC Switch / cc-switch design-study notes.

## 中文

### 项目定位

LocalAI Nexus 是一个本地 AI 资源网关、Runtime 切换器、Token 健康度面板、Skill 管理器、Agent/Workflow 自动化平台与安全审计控制台。当前版本已经完成 LocalAI Nexus 的品牌、桌面启动、核心 Dashboard、首批 Gateway 诊断端点、基础 Token 用量统计、Provider 健康诊断、Runtime Profile 生成和 Prompt Skill 测试链路。

### 核心功能状态

| 模块 | 状态 | 说明 |
|---|---|---|
| 品牌重命名 | Completed | 包名、窗口标题、主 UI、静态入口、图标和桌面快捷方式已改为 LocalAI Nexus。 |
| Dashboard | Completed | 展示 Gateway、默认 Provider/模型、Token 用量、健康状态、最近错误和新手三步入口。 |
| Provider Hub | In progress | 保留安全 Provider 设置、加密/遮蔽 API Key、连接测试入口；完整独立页面仍在推进。 |
| Token Center | In progress | 已记录请求数、token、成功率、失败原因、延迟、Provider/模型聚合；完整 UI 和配额池仍在推进。 |
| Health Monitor | In progress | 已支持 Provider 配置诊断、凭据可读性、模型名、协议提示；真实网络探测仍在推进。 |
| Local Gateway | In progress | 已支持 `/health`、`/v1/models`、`/v1/chat/completions`、`/v1/responses`、`/responses` 诊断、`/v1/messages`；上游真实转发和流式输出仍在推进。 |
| Runtime Switcher | In progress | 已生成 Codex、Claude Code、CLI、自定义 Profile 和 Base URL 诊断建议；一键写入外部配置仍在推进。 |
| Skill Hub | In progress | 已支持 Prompt Skill 创建、启用/禁用、测试和 Token 归因；MCP/Tool/Composite Skill 仍在推进。 |
| Agent / Workflow | In progress | 保留现有 Workflow 基础、Agent 记录和 Skill 调用基础；完整可视化编排和真实执行仍在推进。 |
| Security Center | In progress | 保留登录、RBAC、ACL、审计、hash chain、脱敏、权限拒绝记录；报告导出和高级风控仍在推进。 |

### 架构说明

```text
React Renderer
  -> secure preload bridge
  -> Electron IPC guards
  -> main-process domain services
  -> Local Gateway / Router / Usage / Health / Runtime / Skills
  -> JSON storage + Electron safeStorage + audit log
```

Renderer 不直接接触敏感凭据。Provider key 在主进程保护和遮蔽；跨层数据通过 preload 和 IPC；通用错误、审计事件、Token 用量和 Provider 健康结果使用 shared 类型。

### 快速开始

```bat
cd /d D:\AgentFlowStudio
npm.cmd install
npm.cmd run build
D:\AgentFlowStudio\start-agentflow.bat
```

桌面快捷方式：

```text
C:\Users\至亲\Desktop\LocalAI Nexus.lnk
```

当前快捷方式指向最新可用的 Electron 启动入口：

```text
Target: D:\AgentFlowStudio\node_modules\electron\dist\electron.exe
Arguments: "D:\AgentFlowStudio\dist-electron\main\index.js"
Icon: D:\AgentFlowStudio\assets\localai-nexus.ico,0
```

### Gateway 使用方式

默认地址：

```text
http://127.0.0.1:8317
```

OpenAI-compatible `/v1` 客户端可使用：

```text
http://127.0.0.1:8317/v1
```

已实现的诊断端点：

```text
GET  /health
GET  /v1/models
POST /v1/chat/completions
POST /v1/responses
POST /responses
POST /v1/messages
```

`/responses` 不会无解释 404；它会返回 Base URL 诊断，提示应该填 root URL 还是 `/v1` URL。

### Provider 配置说明

当前 Provider 设置支持 OpenAI-compatible、Anthropic-compatible、Gemini-compatible、Ollama/local 和自定义 Base URL/模型/Headers/代理等字段。API Key 由主进程保护，Renderer 长期显示遮蔽值。

### Token Center

当前实现记录基础请求、input/output/total tokens、成功率、失败率、平均延迟、P95、最近失败原因、Provider 聚合和模型聚合。额度、冷却、并发和项目/Workflow/Agent 维度将继续扩展。

### Runtime Switcher

当前实现可生成 Codex、Claude Code、CLI 和自定义 Profile，包括 root Base URL、`/v1` Base URL、模型名、env、JSON、TOML、YAML 和错误解释建议。

### Skill Hub

当前实现可创建和测试 Prompt Skill，支持输入样例、模板渲染、启用状态、风险等级和 Token 归因。Tool/MCP/Workflow/Composite Skill 是下一阶段重点。

### 安全说明

- `contextIsolation: true`
- `nodeIntegration: false`
- Native 能力只通过 preload/IPC 暴露
- 不通过 IPC 暴露任意命令执行
- API Key 不在 Renderer 长期明文暴露
- Shared Memory、导入导出和日志执行敏感信息脱敏
- RBAC、ACL、审计日志和 hash chain 保持启用
- 数据默认保存在本机 JSON 文件中

### 项目结构

```text
src/main/domain/       LocalAI Nexus domain services
src/main/ipc.ts        IPC registration and security gates
src/main/preload.ts    secure renderer bridge
src/renderer/          React UI and routes
src/shared/            shared types, auth/audit/provider contracts
tests/                 Vitest and Playwright tests
docs/                  refactor plan, architecture, audit, worklog
handoff/               active test report and next steps
assets/                LocalAI Nexus icon assets
static-app/            static fallback entry
archive/               archived historical process files
```

### 开发命令

```bat
npm.cmd run dev
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test
npm.cmd run test:e2e
npm.cmd run build
npm.cmd run verify
npm.cmd run icon
npm.cmd run shortcut
```

### 测试命令

本轮已验证：

```bat
npm.cmd install
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test
npm.cmd run build
npm.cmd run test:e2e
npm.cmd run test:launch-static
npm.cmd run test:static-browser
npm.cmd run test:electron-startup
npm.cmd run test:electron-auth-bridge
npm.cmd run verify
```

### 已完成

- LocalAI Nexus 品牌、窗口标题、图标、快捷方式、静态 fallback 标题。
- Dashboard 主线和新手三步入口。
- 首批 Gateway 诊断端点。
- 基础 Token 用量统计、Provider 健康诊断、Runtime Profile、Prompt Skill 测试。
- README、架构文档、计划文档、结构审计、工作日志、测试报告、下一步文档。

### 未完成 / 路线图

- 真实上游 Provider 转发和 stream。
- 完整 Token 池、限额、冷却、并发控制 UI。
- 独立 Provider Hub / Token Center / Health Monitor 页面精修。
- Runtime Profile 一键写入 Codex/Claude Code 配置。
- Agent Studio 与 Workflow Studio 的真实 Provider/Tool 执行。
- Security Center 报告导出和更细粒度风险评分。

---

## English

### Overview

LocalAI Nexus is a local AI gateway, runtime switcher, token health panel, skill manager, Agent/Workflow automation hub, and security audit console. It evolved from AgentFlowStudio in place, preserving the original repository path and Git history.

### Core Features

| Area | Status | Notes |
|---|---|---|
| Branding | Completed | Package, window title, UI, static fallback, icon, and desktop shortcut now use LocalAI Nexus. |
| Dashboard | Completed | Gateway, provider/model, token usage, health, errors, workflows, security risks, and first-run actions. |
| Provider Hub | In progress | Secure provider settings and credential masking exist; first-class pages continue next. |
| Token Center | In progress | Request/token/failure/latency/provider/model aggregation exists; full pool and quota UI continue next. |
| Health Monitor | In progress | Local configuration diagnostics exist; live provider probing continues next. |
| Local Gateway | In progress | Diagnostic OpenAI/Anthropic-compatible endpoints exist; upstream forwarding and streaming continue next. |
| Runtime Switcher | In progress | Codex, Claude Code, CLI, and custom profile generation exists. |
| Skill Hub | In progress | Prompt Skill create/test/toggle and token attribution exist. |
| Agent/Workflow | In progress | Foundations exist; richer execution and visual automation continue next. |
| Security Center | In progress | Login, RBAC, ACL, audit, hash chain, and redaction foundations exist. |

### Architecture

```text
React Renderer
  -> secure preload bridge
  -> Electron IPC guards
  -> main-process domain services
  -> Local Gateway / Router / Usage / Health / Runtime / Skills
  -> JSON storage + Electron safeStorage + audit log
```

### Quick Start

```bat
cd /d D:\AgentFlowStudio
npm.cmd install
npm.cmd run build
D:\AgentFlowStudio\start-agentflow.bat
```

Desktop shortcut:

```text
C:\Users\至亲\Desktop\LocalAI Nexus.lnk
```

Current shortcut target:

```text
Target: D:\AgentFlowStudio\node_modules\electron\dist\electron.exe
Arguments: "D:\AgentFlowStudio\dist-electron\main\index.js"
Icon: D:\AgentFlowStudio\assets\localai-nexus.ico,0
```

### Installation

```bat
npm.cmd install
```

### Run Commands

```bat
npm.cmd run dev
npm.cmd run build
npm.cmd run shortcut
```

### Gateway Usage

Default root:

```text
http://127.0.0.1:8317
```

OpenAI-compatible `/v1` base:

```text
http://127.0.0.1:8317/v1
```

Implemented diagnostic endpoints:

```text
GET  /health
GET  /v1/models
POST /v1/chat/completions
POST /v1/responses
POST /responses
POST /v1/messages
```

### Provider Configuration

Provider settings support compatible providers, custom base URLs, model names, headers, proxy fields, enable/disable state, tags, protected credentials, and masked renderer display.

### Token Center

Usage records capture requests, token counts, success/failure, failure category, latency, provider grouping, and model grouping.

### Runtime Switcher

Generated profiles include Codex, Claude Code, CLI, and custom outputs with env, JSON, TOML, YAML, and base URL diagnostics.

### Skill Hub

Prompt Skills can be created, enabled/disabled, tested, audited through run records, and attributed to token usage.

### Security Model

The renderer has no direct Node access. Native actions use preload and IPC. Credentials are protected in the main process, logs and exports are redacted, RBAC/ACL/audit checks remain in the main process, and JSON storage remains local.

### Project Structure

See `docs/PROJECT_STRUCTURE_AUDIT.md` for the complete audit and cleanup record.

### Development Commands

```bat
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test
npm.cmd run test:e2e
npm.cmd run build
npm.cmd run verify
```

### Test Commands

See `handoff/TEST_REPORT.md` for the latest PASS/PARTIAL details.

### Completed Work

Branding, launcher/icon, dashboard, first gateway diagnostics, usage summaries, health diagnostics, runtime profile generation, prompt skill tests, docs, and smoke/build verification.

### Pending Work

Real upstream forwarding, streaming, full token pool controls, full provider/token/health pages, advanced routing, richer Agent/Workflow execution, and security report export.

### Roadmap

1. Finish live provider forwarding and stream support.
2. Promote Provider Hub, Token Center, Health Monitor, and Runtime Switcher into full feature pages.
3. Expand Skill Hub and connect Agent/Workflow execution to audited provider calls.
4. Add richer Security Center reports and risk scoring.

### Note

LocalAI Nexus evolved from AgentFlowStudio. Historical references remain only where they describe repository history, compatibility paths, or archived handoff context.

## License

MIT
