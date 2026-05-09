# AgentFlow Studio 项目优化进度

更新时间：2026-05-09

## 1. 当前项目现状

- 项目根目录：`D:\AgentFlowStudio`，当前分支：`codex-liquid-glass-ui-agent-optimization`，远程仓库：`https://github.com/2195573507-web/AgentFlowStudio.git`。
- 工作区基线：开始本轮时 `git status -sb` 干净，HEAD 为 `febc4d6 feat: streamline project creation planning flow`。
- 技术栈：Electron 33 + React 18 + TypeScript + Vite + Tailwind CSS，数据仍采用本地 JSON 文件存储，Shared Memory Hub 仍是核心能力。
- 启动入口：
  - Electron / React 开发：`npm.cmd run dev` 或 `npm.cmd run dev:web`。
  - 当前稳定兜底入口：`D:\AgentFlowStudio\start-agentflow-static.bat`，由 `scripts/static-server.js` 服务 `static-app`。
- 现有功能：
  - Dashboard 已有 Liquid Glass 外观、新手下一步 CTA 和生命周期 rail：Idea -> Plan -> Tasks -> Prompt -> Safety -> Logs -> Memory -> Handoff。
  - Projects 已支持创建项目后进入详情并提示生成规划。
  - Prompt Lab 有 13 个 Prompt 模板、变量填充、记忆注入、保存/导出。
  - Project Detail 有规划生成、任务看板、Prompt、Agent 执行记录保存。
  - Log Analyzer、SafetyBox、Shared Memory Hub、Skills、Git Timeline、Settings 都已有基本页面。
  - Static fallback 是可用 SPA，但模板、日志规则、安全规则、Git 能力和设置能力比 React 主端轻量。
- 测试脚本现状：
  - `npm.cmd run test`：Vitest 单元测试。
  - `npm.cmd run test:e2e`：React Web Playwright 流程。
  - `npm.cmd run test:launch-static`、`test:static-browser`、`test:long-run`：静态入口、浏览器流程和长期稳定性。
  - `npm.cmd run test:electron-startup`：Electron 启动 smoke。
  - 本轮基线已通过：`npm.cmd install`、`npm.cmd run typecheck`、`npm.cmd run lint`、`npm.cmd run smoke`。`npm audit` 仍报告既有 17 个依赖漏洞，本轮先不做大版本依赖升级。
- 并发 agent 容量：
  - 本轮尝试创建 8 个子 agent，其中 6 个成功，第 7/8 个返回 `agent thread limit reached`。
  - 后续按 6 个稳定并发上限分配，空闲 agent 已关闭。

## 2. 对标项目可借鉴点

- Flowise AgentFlow V2：
  - 借鉴点：显式工作流编排、每个节点是独立操作单元、条件节点、迭代节点、人类输入节点、节点内存配置。
  - 对本项目启发：模板库不要只保存 Prompt 文本，应展示节点结构、输入输出、失败路径、循环/并发/人工确认节点。
  - 参考：https://docs.flowiseai.com/using-flowise/agentflowv2
- Flowise Sequential Agents：
  - 借鉴点：条件节点可用表格或 JavaScript 配置，Condition Agent 可基于关键词、状态变化、结构化输出做动态分支。
  - 对本项目启发：新手模板应把分支判断写成人类可理解的条件，而不是只给“让 AI 自己判断”的黑盒描述。
  - 参考：https://docs.flowiseai.com/using-flowise/agentflows/sequential-agents
- Dify Workflow / Chatflow：
  - 借鉴点：工作流从 User Input/Trigger 开始，节点输出可以被后续节点引用；Run ID 用于追踪节点执行日志；DSL 便于模板迁移。
  - 对本项目启发：模板应有“输入 -> 节点 -> 输出”的骨架；执行记录应保留 run id、节点输入输出摘要、耗时、失败原因。
  - 参考：https://docs.dify.ai/en/guides/workflow/node/start
- Dify Code Node：
  - 借鉴点：自定义代码运行在安全 sandbox，限制文件系统、网络请求和系统命令，并支持重试与错误分支。
  - 对本项目启发：SafetyBox 与执行记录区域要明确“不会执行命令”，未来若引入执行能力必须隔离、限制和提示。
  - 参考：https://docs.dify.ai/en/guides/workflow/node/code
- Dify Plugins：
  - 借鉴点：插件按 workspace 作用域安装，Marketplace/GitHub/Local Upload 分级来源，管理员控制可用插件类型。
  - 对本项目启发：Skills/工具集成需要显示来源、权限、是否可信，不应直接读取任意项目文件。
  - 参考：https://docs.dify.ai/en/use-dify/workspace/plugins
- Langflow：
  - 借鉴点：预置模板、拖拽组件节点、Playground 可实时测试 flow，可单独运行组件；全局变量用于凭据和配置并加密存储。
  - 对本项目启发：模板入口要更像“可试用的模板库”，Prompt Lab 应补“下一步做什么”，Provider/API Key 应更清晰地表达本地保存风险。
  - 参考：https://docs.langflow.org/ 与 https://docs.langflow.org/configuration-global-variables
- Sim：
  - 借鉴点：实时 Console 展示 block 进度、输出、耗时、状态；Logs 页面可按状态、触发方式、耗时等过滤；日志详情展示 block 级输入输出，API key 自动脱敏；工作流 snapshot 冻结运行时结构。
  - 对本项目启发：Agent 执行记录需要结构化节点列表、耗时、重试、失败原因、复制/导出按钮，并保存运行时模板快照。
  - 参考：https://docs.sim.ai/execution/logging 与 https://docs.sim.ai/execution/basics

## 3. 可执行任务拆分

### A. 新手小白流程优化
- 在 Dashboard 强化“创建工作流 -> 添加节点 -> 配置模型/API -> 运行 -> 查看结果”的路径。
- 在 Prompt Lab / Project Detail 增加更明确的“下一步”提示。
- 增加空状态和错误提示的中文说明，尤其是模板、运行记录、Git 版本区域。

### B. 模板库
- 新增工作流模板数据结构和入口。
- 至少内置 7 个模板：资料总结 Agent、网页搜索 Agent、代码修复 Agent、多 Agent 并发任务、人类确认节点流程、循环自测修复流程、Git 自动提交流程。
- 每个模板包含名称、用途、适用场景、节点结构、输入输出和风险提示。

### C. 执行追踪和日志面板
- 扩展 Project Detail 的 Agent 执行记录，从纯文本记录升级为节点执行摘要。
- 展示节点状态、耗时、输入输出摘要、失败原因、重试次数。
- 增加复制日志和导出日志功能，错误提示使用新手可读中文。

### D. Agent 模拟真人测试
- 扩展 React E2E：新手创建项目、保存运行记录、刷新后保留。
- 扩展 Log Analyzer E2E：输入典型 Electron preload error 并验证可读修复建议。
- 扩展 Electron smoke：探测 preload `window.agentflow` 和基础 API 可调用。
- 扩展 static browser smoke：显式切到 dark，并验证主题/关键面板可见。

### E. 安全隔离
- 限制 `shell.openExternal` 只允许 http/https。
- 限制 `skills.read` 只能读取 `.agents/skills/**/SKILL.md` 白名单文件。
- 调整导出路径校验，避免用户选择项目外路径时被静默改写到项目根。
- 为 static server 增加 realpath 越界检查，防止 symlink 跳出静态根。
- 在 UI 中对外部 API、命令执行、本地文件访问增加明显提示。

### F. GitHub 版本记录面板
- 增加 runtime/status 只读能力或在 Git Timeline 顶部展示本轮版本状态。
- 展示最近提交、当前分支、当前版本、本轮更新摘要、最新测试状态。
- 同步更新 `CHANGELOG.md` 和本文件。

### G. UI 优化
- 保留 Liquid Glass 风格，减少空洞装饰，强化真实工作路径。
- 调整模板、日志、版本区域的按钮层级、状态颜色和空间密度。
- 检查 1024x680、390x844、深色/浅色模式。

## 4. 风险点

- 中文源码中仍可见 mojibake 痕迹，现有测试可能依赖乱码文本，需要后续建立中文编码质量门。
- `static-app` 与 React 主端存在功能差距，同步改动时容易遗漏。
- 主进程安全修复涉及路径和导出行为，必须避免破坏用户保存文件、读取技能、Git Timeline 的既有流程。
- Provider API Key 当前仍是本地明文保存，短期可加强 UI 提示和遮罩，长期建议接入 Electron `safeStorage`。
- GitHub push 可能受凭据或远程权限影响；如失败，需要把最小用户操作写入本文件。
- 依赖漏洞需要单独升级评估，不能为了本轮通过测试盲目 `npm audit fix --force`。

## 5. 测试方案

- 每个实现切片后至少运行相关最小测试：
  - 模板库：`npm.cmd run test -- tests/unit/templates.test.ts`。
  - 运行记录/API：`npm.cmd run test -- tests/unit/apiRuns.test.ts`。
  - 安全隔离：`npm.cmd run smoke` 和相关单测。
  - UI/E2E：`npm.cmd run test:e2e` 或 focused Playwright。
- 全量验证：
  - `npm.cmd run typecheck`
  - `npm.cmd run lint`
  - `npm.cmd run test`
  - `npm.cmd run build`
  - `npm.cmd run smoke`
  - `npm.cmd run test:launch-static`
  - `npm.cmd run test:static-browser`
  - `npm.cmd run test:electron-startup`
  - `npm.cmd run test:e2e`
  - `npm.cmd run verify`
- UI 验证：
  - 检查启动入口、核心页面、工作流创建、模板加载、运行日志、错误提示、刷新保留、深色/浅色模式。
  - 保持静态 fallback 可启动，不切换桌面快捷方式。

## 6. 本轮完成记录

- 已读取 `AGENTS.md`、README、package、handoff、现有规划文件、关键源码结构、测试脚本、Git 状态和远程配置。
- 已联网学习 Flowise、Dify、Langflow、Sim 的工作流、模板、日志、安全、插件集成方式。
- 已验证子 agent 并发能力：6 个稳定，超过后触发 thread limit。
- 已完成 6 个只读子 agent 审查：React/UI、测试体系、安全面、static fallback、数据/API、Git 版本面板。
- 已通过本轮基线：
  - `npm.cmd install`：PASS，依赖已是最新安装状态；仍有既有 17 个 audit 漏洞。
  - `npm.cmd run typecheck`：PASS。
  - `npm.cmd run lint`：PASS，0 errors / 25 warnings。
  - `npm.cmd run smoke`：PASS，138/138。
- 代码修改尚未开始；本文件是按要求先落盘的优化计划。

## 7. 下一轮建议

- 本轮继续：优先落实工作流模板库、Project Detail 结构化执行追踪、安全隔离修复、Git Timeline 版本状态卡、E2E/Smoke 补测，并完成 commit/push。
- 下一轮继续：处理中文 mojibake 质量门、Provider API Key `safeStorage`、WorkflowTemplate/RunEvent/VersionRecord 持久模型、static-app 与 React 主端的规则库同步。
# 2026-05-10 本轮优化记录

## 学习的优秀项目与非 UI 能力

- Flowise：学习 Agentflow V2 的显式节点编排、Flow State、分支/循环、人类输入节点、节点级 trace、MCP 节点。适合 AgentFlowStudio 的是模板节点结构、运行追踪和人类确认；本轮落地模板节点、风险/HITL 元数据和运行 trace 展示。MCP 节点暂不做，因为需要工具 allowlist、权限审计和沙箱边界。
- Dify：学习 Workflow/Chatflow、DSL 导入导出、Secret 环境变量与 app 配置分离、日志标注、版本发布、Sandbox。适合本项目的是 secret 脱敏导出、运行日志沉淀和版本状态面板；本轮落地复制/导出脱敏、GitTimeline 报告快照提示和安全导出链路。Sandbox code node 暂不做，避免引入任意代码执行面。
- Langflow：学习 flow JSON、组件 span trace、Playground 试运行、全局变量/API key 导出策略、MCP client/server。适合本项目的是可审计模板 schema、节点输入输出摘要和变量引用；本轮落地共享 WorkflowTemplate 类型、模板筛选和 retrieval 节点预留。
- n8n：学习 trigger/action/core 节点分层、AI tool call 前 HITL、子 workflow、模板分类、source control/environments。适合本项目的是节点分类、模板元数据、失败分支和版本快照；本轮落地节点分类、风险等级、新手推荐、人类确认标识。
- Botpress：学习异常处理节点、Emulator 局部调试、Debugger logs、Versions、Audit logs。适合本项目的是错误恢复、运行回放和审计提示；本轮落地失败原因、重试建议和 run quality checklist。
- Coze / Coze Studio：学习 DAG 的 control/data flow、节点 schema registry、插件来源分级、workflow/knowledge/plugin 统一资源模型。适合本项目的是统一节点类型和插件信任等级；本轮落地模板类型统一到 shared types。
- FastGPT：学习 RAG 知识库流程、workflow start/finish 规则、Code Execution sandbox、MCP Server、App Evaluation。适合本项目的是 knowledge source/retrieval step 和 evals 最小闭环；本轮落地 retrieval 节点和运行质量 checklist。
- Open WebUI：学习 Tools/Functions 的高权限风险、RBAC、工具权限 gating、Evaluation Arena、audit/logging。适合本项目的是工具风险提示、权限审计和评测样本沉淀；本轮落地安全风险提示、剪贴板脱敏和测试报告快照提示。
- OpenAI Agent Builder / AgentKit / Agents SDK：学习 agent 编排、handoff、guardrails、tracing、evals/graders。适合本项目的是 trace schema、handoff 记录、评测检查清单；本轮落地节点 trace、失败建议和 quality checklist。

## 本轮真实落地

- 修复 ProjectDetail 运行日志复制/导出泄漏：新增 `src/renderer/lib/runLogs.ts`，统一对 `run.summary`、`run.error`、`run.log`、`node.inputSummary`、`node.outputSummary`、`node.failureReason` 脱敏。
- 修复 E2E 文案断言：当前仓库没有 `tests/e2e/agent-user-simulation.spec.ts`，已在实际存在的 `tests/e2e/app.spec.ts` 把断言改为“查看结果和日志”。
- 结构优化：模板类型统一从 `src/shared/types.ts` 导出；模板搜索/过滤移入 `src/renderer/lib/templates.ts`；运行日志解析/序列化/质量检查移入 `src/renderer/lib/runLogs.ts`。
- 功能优化：工作流模板增加分类、难度、场景、风险等级、新手推荐、是否需要人工确认；Prompt Lab 增加模板搜索/分类/风险/新手过滤；ProjectDetail 增加 run quality checklist、节点失败原因与重试建议；模板加入 knowledge retrieval 节点；GitTimeline 显示测试状态为报告快照。
- 安全修复：IPC handler 加来源校验；dev server URL 限制为 localhost/127.0.0.1；skill read 使用 realpath 防 symlink/junction 逃逸；memory 读取出口脱敏；剪贴板统一兜底脱敏；Log Analyzer 限制超大日志；Shared Memory JSON 导入防大文件和畸形字段；GitTimeline/SharedMemoryHub 修复重复 key 风险。

## 已检查漏洞面

- 已检查并修复或加护栏：路径逃逸、任意 SKILL.md 读取边界、外链协议、IPC 来源、preload 暴露边界、renderer Node 风险、secrets/clipboard/export 泄漏、大日志性能、JSON import schema、React key warning、测试状态伪造提示、Git 状态展示准确性提示。
- 未发现直接暴露 `child_process.exec`、`nodeIntegration: true`、`dangerouslySetInnerHTML` 的高危点。

## 为什么暂不做

- MCP client/server：需要工具权限 allowlist、审计日志、只读/写入分级，本轮只做模板和类型预留。
- Sandbox code node：风险面大，必须先设计网络/文件系统/时间/内存限制。
- 完整 RBAC/多租户权限：当前是本地桌面单用户应用，先做来源校验和敏感出口脱敏。
- 通用自动化节点市场：会偏离 AI coding orchestration hub 的核心目标，先强化项目生命周期。
- 自动 graders/evals：需要先沉淀稳定 run/eval 样本，本轮先做 quality checklist。

## 下一轮建议

- 设计 workflow JSON schema：nodes、edges、variables、secretsRef、version、traceRef。
- 增加 workflow/version 快照与 diff，支持导入导出且默认不导出 secrets。
- 建立 MCP allowlist 与只读工具试点，先暴露查询项目、列任务、读记忆等低风险能力。
- 引入沙箱执行调研：优先只做受限模板/Jinja 或只读代码片段验证。
- 把 run quality checklist 产生的失败样本转成 eval case，并加入人工评分入口。
