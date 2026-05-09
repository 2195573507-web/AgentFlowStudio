# Human Agent Simulation Report

Date: 2026-05-09

Branch: `codex-liquid-glass-ui-agent-optimization`

## Simulation Method

Used code review plus automated browser checks as the simulated user evidence:

- Static browser smoke exercised first launch, navigation, project creation, Prompt Lab, Log Analyzer, SafetyBox, Shared Memory Hub, Settings, persistence, redaction, 1024x680, and 390x844.
- React E2E exercised dashboard, navigation, quick actions, language/theme persistence, Prompt Lab, and browser error collection.
- Electron startup smoke verified the Electron path still reaches ready state.
- Focused unit regression now exercises Agent run record create/list behavior through `api.runs`, including preload and fallback paths.
- React E2E and static browser smoke now both save a local-only Agent execution record from the UI.

## User 1: 完全新手

- 目标: 第一次打开后知道下一步点哪里。
- 操作路径: 打开 Dashboard -> 看到“下一步” -> 查看 Idea/Plan/Tasks/Prompt/Safety/Logs/Memory/Handoff 生命周期轨 -> 点击创建/继续入口。
- 卡住的位置: 旧版只有功能入口和三步说明，不足以表达完整 AI 协作闭环。
- UI/文案问题: 首屏缺少唯一主行动；工作流生命周期不可见。
- 功能问题: 无。
- 建议修复: 增加下一步 CTA 和生命周期轨。
- 是否已修复: 已修复，React 和 static fallback 都已添加。
- 回归测试结果: `npm.cmd run test:static-browser` PASS；`npm.cmd run test:e2e` PASS；`npm.cmd run smoke` PASS。

## User 2: 普通用户

- 目标: 创建一个 agent 工作流并跑到可复制 Prompt。
- 操作路径: Dashboard -> Projects -> 新建项目 -> Project Detail/Prompt Lab -> 生成 Prompt -> SafetyBox 检查命令 -> Log Analyzer 记录结果 -> Shared Memory Hub 沉淀上下文。
- 卡住的位置: 旧版没有把这些页面串成“工作流”。
- UI/文案问题: 用户需要自己理解每个页面之间的关系。
- 功能问题: 当前仍没有真正的内置 agent 执行器，本项目安全边界要求不暴露任意命令执行。
- 建议修复: 增加本地运行记录面板，用 `api.runs` 记录外部 AI 工具执行结果，但不执行命令。
- 是否已修复: 已修复，React ProjectDetail 和 static fallback 都可保存 Agent 运行记录。
- 回归测试结果: Static workflow creation, Agent run save, Prompt generation PASS；React E2E run-record save PASS。

## User 3: 高级用户

- 目标: 查看日志、配置模型、排查错误和恢复上下文。
- 操作路径: Dashboard -> Settings -> API Provider -> Log Analyzer -> Shared Memory Hub -> Git Timeline。
- 卡住的位置: Settings 还缺本地运行状态面板和连接测试反馈。
- UI/文案问题: 运行状态、启动入口、最近验证结果仍主要在 handoff 文档里。
- 功能问题: Provider test connection 还没有落地；不应在 UI 层直接绕过 IPC 或执行命令。
- 建议修复: Settings 增加“本地运行状态”和 provider 校验/测试结果 badge。
- 是否已修复: 未完全修复，列入下一轮 P1。
- 回归测试结果: Settings persistence and redaction PASS。

## User 4: 移动端用户

- 目标: 窄屏访问时能查看主要页面并完成基础操作。
- 操作路径: 390x844 -> Dashboard -> Projects -> Settings。
- 卡住的位置: 旧测试没有覆盖移动窄屏。
- UI/文案问题: 需要防止侧栏、顶部工具、生命周期轨造成横向滚动。
- 功能问题: 无。
- 建议修复: static browser smoke 增加 390x844 无横向溢出检查。
- 是否已修复: 已修复。
- 回归测试结果: `390x844/dashboard`, `390x844/projects`, `390x844/settings` all PASS。

## User 5: 错误场景用户

- 目标: 遇到 API 配置错误、启动失败、空数据、网络异常时知道如何恢复。
- 操作路径: Static fallback -> Settings API key -> SafetyBox risky command -> Log Analyzer error text -> route error fallback。
- 卡住的位置: 运行状态和错误恢复建议还可以更靠前；当前 route fallback 和 secret redaction 已有保护。
- UI/文案问题: Dashboard 可以进一步显示当前数据源和稳定启动路径。
- 功能问题: React E2E 首次与其它服务测试并发时出现 `127.0.0.1:5173` connection refused，单独重跑通过，说明本地服务并发启动会互相影响。
- 建议修复: 下一轮把并发验证拆分执行，或增强 `run-playwright-e2e.js` 的端口等待/旧服务清理。
- 是否已修复: 已记录；本轮最终 E2E 单独重跑 PASS。
- 回归测试结果: Static launcher PASS, Electron startup PASS, React E2E rerun PASS。

## Remaining Feedback

1. Project creation should navigate directly to Project Detail and highlight plan generation.
2. Settings needs runtime status and provider validation/test feedback.
3. Prompt Lab needs post-generation next actions and optional run recording.
4. Add i18n mojibake quality gate in unit tests.
5. Harden E2E server lifecycle to avoid parallel `5173` contention.

## Round 10 Simulation Addendum - 2026-05-09

- User 1 follow-up path improved: after creating a project, the app now lands on Project Detail and highlights "下一步：生成项目规划" instead of leaving the user on the list.
- User 2 workflow improved: clicking the highlighted next-step action immediately generates PRD/architecture/tasks/prompts, then exposes export and memory actions.
- Error scenario improved: if project creation returns an IPC `{ error }` object, the create modal now shows an error instead of silently navigating as if creation succeeded.
- State-switch scenario improved: switching from a project with an existing plan to a newly created project no longer risks showing the previous plan.
- Browser simulation evidence: React Playwright E2E passed 9/9 and covers create -> detail -> next-step -> generate plan plus IPC create error handling.
- Multi-agent pressure simulation improved: concurrent React E2E and Electron startup smoke now reserve different ports, so parallel validators no longer collide on `5173` by default.
- Long-run user simulation evidence: static fallback ran 30.07 minutes across core pages with no crash, console error, page error, network failure, or heap growth.

## Worker TestingDocs Addendum

- Added `tests/unit/apiRuns.test.ts` to cover the Agent run record API contract without adding any arbitrary command execution path.
- Regression scope: `api.runs.create()` and `api.runs.list()` through the namespaced preload bridge, legacy bridge fallback, and no-preload fallback.
- Validation: `npm.cmd run test -- tests/unit/apiRuns.test.ts` PASS, `npm.cmd run test` PASS, `npm.cmd run lint` PASS with 25 warnings under the configured threshold, `npm.cmd run test:e2e` PASS 7/7, and `npm.cmd run test:static-browser` PASS.
- Remaining manual simulation risk: provider connection testing and Settings runtime status still need a dedicated next pass.
