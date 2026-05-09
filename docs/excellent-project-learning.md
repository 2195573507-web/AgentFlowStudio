# 优秀案例学习转化

## 学习边界

本文件只提炼可迁移的产品、交互、测试和结构原则，不照搬外部产品代码。AgentFlow Studio 的定位是本地优先的 AI 项目编排桌面应用，现有约束必须保留：Electron 安全 IPC、JSON 本地存储、Shared Memory Hub、静态回退路径、React + Tailwind + Liquid Glass 风格。

## 参考方向

- Langflow 文档把 Agent 描述为 LLM 加工具的执行单元，flow 则是接收输入、处理并输出的可保存工作流；本项目可借鉴“组件/工具/flow”的语义，但先落到结构化生命周期轨。
- Dify 文档强调串行/并行编排、Agent 节点、最大迭代、输出变量、日志和成功状态；本项目可借鉴“执行控制和日志回放”，不直接引入外部执行能力。
- Apple Liquid Glass 文档强调层级、和谐、跨设备一致性、谨慎使用颜色、标准导航和工具栏；本项目应使用玻璃材质表达层级，而不是做装饰性模糊。
- 本地部署面板的优秀体验是把启动入口、数据位置、验证状态和错误恢复公开展示，而不是隐藏环境限制。

参考来源：

- [Langflow Agents](https://docs.langflow.org/components-agents)
- [Langflow Build flows](https://docs.langflow.org/next/concepts-flows)
- [Dify Orchestration Logic](https://docs.dify.ai/en/use-dify/build/orchestrate-node)
- [Dify Agent node](https://docs.dify.ai/en/guides/workflow/node/agent)
- [Apple Liquid Glass](https://developer.apple.com/documentation/TechnologyOverviews/liquid-glass)

## 核心转化原则

### 1. Agent 工作流平台：让生命周期可见

优秀的 agent 平台不会只展示“功能入口”，而是展示从想法到交付的闭环。

| 优先级 | 任务 | 落点 | 验收 |
|---|---|---|---|
| P0 | 在 Dashboard 增加“工作流进度轨” | `Dashboard.tsx`, `static-app/app.js` | 显示 Idea -> Plan -> Tasks -> Prompt -> Safety -> Logs -> Memory -> Handoff，每步有状态和下一步按钮 |
| P1 | Project Detail 增加“下一步建议” | `ProjectDetail.tsx` | 根据是否已有 plan、tasks、prompt、memory，提示唯一主行动 |
| P1 | Log/Safety/Prompt 结果统一支持保存到 Memory | `LogAnalyzer.tsx`, `SafetyBox.tsx`, `PromptLab.tsx` | 用户能把一次分析结果沉淀为 `issue_fix`、`safety_check`、`prompt_pattern` |

### 2. No-code Workflow Builder：先做轻量编排

本项目当前更适合做“结构化流程卡 + 状态机”，不急着引入复杂节点画布。

| 优先级 | 任务 | 验收 |
|---|---|---|
| P1 | 为项目增加阶段字段或派生阶段函数 | Dashboard 和 Project Detail 能显示项目处于 planning/building/testing/handoff |
| P1 | 增加任务模板生成入口 | 从 PRD 自动生成任务后，可一键进入 TaskBoard |
| P2 | 增加“流程模板”概念 | 新建项目时可选择 Desktop、CLI、Library、SaaS 等模板 |

### 3. AI Agent Dashboard：指标服务决策

Dashboard 的重点是“现在该做什么、哪里有风险、最近发生了什么”。

| 优先级 | 任务 | 落点 |
|---|---|---|
| P0 | Dashboard 增加运行状态区 | 静态回退、Electron IPC、数据路径、最近验证结果 |
| P1 | 增加近期活动流 | 最近项目更新、Prompt 生成、日志分析、安全检查、记忆创建 |
| P1 | 将 pending memories 提升为首页风险项 | Shared Memory Hub 的 pending 数量直接出现在 Dashboard |

### 4. Liquid Glass：克制地表达层级

玻璃效果应表达层级和桌面质感，不应让页面变成卡片堆叠。

| 优先级 | 任务 | 验收 |
|---|---|---|
| P0 | 统一 GlassCard 半径、阴影、hover 策略 | `GlassCard.tsx` 和 `styles.css` 不再有多套冲突卡片规则 |
| P1 | 检查 10 个页面的深色/浅色对比 | 1024x680 下无文字重叠，正文对比度可读 |
| P1 | 减少嵌套卡片 | 页面区块用无框布局，卡片只用于列表项、模态框、工具面板 |
| P2 | 为按钮和图标按钮补齐 tooltip/aria-label | 所有 icon-only 操作可键盘和读屏识别 |

### 5. 本地部署工具面板：把“能不能跑”产品化

| 优先级 | 任务 | 落点 |
|---|---|---|
| P0 | Settings 增加“本地运行状态”面板 | 显示静态启动脚本、数据目录、版本、最近测试结果 |
| P1 | Dashboard 显示当前数据源 | Electron IPC、Static fallback、Demo fallback 明确标识 |
| P1 | 增加“复制恢复 Prompt”入口 | 使用 Shared Memory Context + 当前启动方式 + 已知限制 |

### 6. 新手 SaaS Onboarding：三步路径要状态化

| 优先级 | 任务 | 验收 |
|---|---|---|
| P0 | 新手路径根据数据自动完成 | 已有项目时第 1 步显示完成，下一步跳到设置或 Prompt |
| P1 | 新建项目表单改成渐进式 | idea、platform、constraints、generate plan 分步完成 |
| P1 | EmptyState 统一带样例输入和主按钮 | `EmptyState.tsx` 支持 sample/action 描述 |

## 测试转化清单

| 类型 | 应覆盖 |
|---|---|
| Unit | planner、templates、memory injection、secret redaction、safety rules、log analyzer |
| E2E | 首次启动、导航、主题/语言持久化、Prompt 生成、Memory 创建、Settings 保存 |
| UI Smoke | 1024x680、浅色/深色、模态框、空状态、长文本、按钮 loading |
| Security | API key 不回填明文，memory/export/import 全链路脱敏 |
| Local Runtime | static launcher、Electron startup、数据路径、无控制台错误 |

## 结构原则

1. Renderer 不直接碰 Node 能力，继续走 `api.ts -> preload -> IPC`。
2. Shared Memory Hub 是核心资产，只增强，不弱化。
3. 工作流状态优先使用派生逻辑，除非确实需要持久字段。
4. 新能力优先落在现有页面，不新建空壳页面。
5. 每个新增交互必须同时定义空、加载、错误、成功状态。

## 反模式

- 不做营销首页替代工作台。
- 不为了 no-code 过早引入复杂画布。
- 不用大面积模糊掩盖层级混乱。
- 不隐藏本地运行限制。
- 不把 API key、日志、记忆导出路径绕过现有脱敏层。
