// ── Types ──

export interface PromptTemplateVariable {
  name: string;
  label: string;
  placeholder: string;
  required: boolean;
}

export interface PromptTemplate {
  name: string;
  description: string;
  category: string;
  variables: PromptTemplateVariable[];
  template: string;
}

// ── Template definitions ──

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    name: '从零创建项目',
    description: '给 AI 提供完整上下文，从零开始创建一个新项目',
    category: '项目管理',
    variables: [
      {
        name: 'projectName',
        label: '项目名称',
        placeholder: '例如：my-awesome-app',
        required: true,
      },
      {
        name: 'platform',
        label: '目标平台',
        placeholder: 'Web / Desktop(CLI) / Mobile / Embedded / Other',
        required: true,
      },
      {
        name: 'techStack',
        label: '技术栈',
        placeholder: '例如：React + TypeScript + Vite',
        required: true,
      },
      {
        name: 'uiStyle',
        label: 'UI 风格',
        placeholder: '例如：Minimal / Modern / Glassmorphism',
        required: false,
      },
      {
        name: 'idea',
        label: '核心创意与功能描述',
        placeholder: '详细描述你的项目想法和核心功能...',
        required: true,
      },
      {
        name: 'additionalRequirements',
        label: '额外要求',
        placeholder: '其他需要 AI 注意的事项...',
        required: false,
      },
    ],
    template: `# 项目创建指令

## 项目信息
- **项目名称**: {{projectName}}
- **目标平台**: {{platform}}
- **技术栈**: {{techStack}}
{{#uiStyle}}- **UI 风格**: {{uiStyle}}{{/uiStyle}}

## 核心创意
{{idea}}

{{#additionalRequirements}}
## 额外要求
{{additionalRequirements}}
{{/additionalRequirements}}

## 你的任务
请从零开始创建一个完整的 {{platform}} 项目。步骤如下：

1. **初始化项目**: 使用 {{techStack}} 初始化项目结构，配置 TypeScript、Linter、构建工具
2. **搭建目录结构**: 按照最佳实践组织代码目录
3. **实现核心功能**: 根据核心创意实现主要业务逻辑
4. **UI 实现**{{#uiStyle}}: 采用 {{uiStyle}} 风格实现用户界面{{/uiStyle}}
5. **测试**: 为核心功能编写测试
6. **文档**: 生成 README.md 和必要的文档

## 要求
- 所有代码使用 TypeScript
- 遵循行业最佳实践
- 代码结构清晰，注释合理
- 确保项目可以直接运行`,
  },
  {
    name: '继续未完成项目',
    description: '让 AI 理解当前项目状态，继续完成剩余工作',
    category: '项目管理',
    variables: [
      {
        name: 'projectName',
        label: '项目名称',
        placeholder: '项目名称',
        required: true,
      },
      {
        name: 'completedTasks',
        label: '已完成的任务',
        placeholder: '列出已完成的任务...',
        required: true,
      },
      {
        name: 'currentState',
        label: '当前项目状态',
        placeholder: '描述当前代码的状态、有哪些文件、项目结构...',
        required: true,
      },
      {
        name: 'remainingTasks',
        label: '待完成的任务',
        placeholder: '列出还需要完成的任务...',
        required: true,
      },
      {
        name: 'blockers',
        label: '当前阻塞问题',
        placeholder: '如果有阻塞问题，请描述...',
        required: false,
      },
    ],
    template: `# 继续开发指令

## 项目
**{{projectName}}**

## 已完成的工作
{{completedTasks}}

## 当前项目状态
{{currentState}}

{{#blockers}}
## 阻塞问题
{{blockers}}
{{/blockers}}

## 待完成任务
{{remainingTasks}}

## 你的任务
请基于当前项目状态，继续完成上述待办任务。注意：
1. 先理解现有代码结构，不要重构已完成的工作
2. 优先解决阻塞问题（如果有）
3. 每完成一个任务后说明完成情况
4. 保持代码风格与现有代码一致`,
  },
  {
    name: '修复构建错误',
    description: '诊断并修复项目构建/编译错误',
    category: '调试与修复',
    variables: [
      {
        name: 'projectName',
        label: '项目名称',
        placeholder: '项目名称',
        required: true,
      },
      {
        name: 'errorLog',
        label: '错误日志',
        placeholder: '粘贴完整的错误日志...',
        required: true,
      },
      {
        name: 'techStack',
        label: '技术栈',
        placeholder: '例如：React + TypeScript + Vite',
        required: true,
      },
      {
        name: 'recentChanges',
        label: '最近的修改',
        placeholder: '描述你最近做了什么改动...',
        required: false,
      },
    ],
    template: `# 修复构建错误指令

## 项目
**{{projectName}}** | 技术栈: {{techStack}}

## 错误日志
\`\`\`
{{errorLog}}
\`\`\`

{{#recentChanges}}
## 最近的修改
{{recentChanges}}
{{/recentChanges}}

## 你的任务
请分析上述错误日志，找出根本原因并提供修复方案。请：
1. 逐一分析每个错误的原因
2. 提供具体的修复步骤和代码修改
3. 解释为什么会出现这些错误
4. 给出预防类似问题的建议`,
  },
  {
    name: '优化 UI',
    description: '优化和改善项目的用户界面',
    category: 'UI/UX',
    variables: [
      {
        name: 'projectName',
        label: '项目名称',
        placeholder: '项目名称',
        required: true,
      },
      {
        name: 'currentUI',
        label: '当前 UI 描述',
        placeholder: '描述当前 UI 的状态和问题...',
        required: true,
      },
      {
        name: 'targetStyle',
        label: '目标风格',
        placeholder: '例如：Modern / Minimal / Glassmorphism',
        required: true,
      },
      {
        name: 'specificIssues',
        label: '具体问题',
        placeholder: '列出具体的 UI 问题：布局、配色、动画、响应式等...',
        required: false,
      },
    ],
    template: `# UI 优化指令

## 项目
**{{projectName}}**

## 当前 UI 状态
{{currentUI}}

## 目标风格
{{targetStyle}}

{{#specificIssues}}
## 具体需要优化的问题
{{specificIssues}}
{{/specificIssues}}

## 你的任务
请优化项目 UI，具体要求：
1. 采用 {{targetStyle}} 风格重新设计/优化界面
2. 确保响应式设计，适配不同屏幕尺寸
3. 优化配色方案和排版
4. 添加合适的过渡动画和微交互
5. 改善可访问性（ARIA、键盘导航、颜色对比度）
6. 保持组件复用性和代码整洁`,
  },
  {
    name: '添加测试',
    description: '为现有项目编写完整的测试套件',
    category: '测试',
    variables: [
      {
        name: 'projectName',
        label: '项目名称',
        placeholder: '项目名称',
        required: true,
      },
      {
        name: 'techStack',
        label: '技术栈',
        placeholder: '例如：React + TypeScript',
        required: true,
      },
      {
        name: 'testFrameworks',
        label: '测试框架',
        placeholder: '例如：Vitest + Testing Library，或 Playwright',
        required: true,
      },
      {
        name: 'keyModules',
        label: '需要测试的关键模块',
        placeholder: '列出需要重点测试的模块和功能...',
        required: true,
      },
    ],
    template: `# 添加测试指令

## 项目
**{{projectName}}** | 技术栈: {{techStack}}

## 测试框架
{{testFrameworks}}

## 需要测试的关键模块
{{keyModules}}

## 你的任务
请为项目编写完整的测试套件：
1. **单元测试**: 测试工具函数、Hooks、纯逻辑模块
2. **组件测试**: 测试关键 UI 组件的渲染和交互
3. **集成测试**: 测试多个模块之间的协作
4. **边界测试**: 覆盖错误状态、空状态、加载状态

## 要求
- 使用 {{testFrameworks}} 编写测试
- 测试覆盖率目标 > 80%
- 测试用例命名清晰，描述预期行为
- Mock 外部依赖，确保测试独立性`,
  },
  {
    name: '代码审查',
    description: '对项目代码进行全面审查',
    category: '质量保证',
    variables: [
      {
        name: 'projectName',
        label: '项目名称',
        placeholder: '项目名称',
        required: true,
      },
      {
        name: 'reviewFocus',
        label: '审查重点',
        placeholder: '例如：安全性、性能、代码结构、最佳实践...',
        required: true,
      },
      {
        name: 'techStack',
        label: '技术栈',
        placeholder: '例如：React + TypeScript',
        required: true,
      },
    ],
    template: `# 代码审查指令

## 项目
**{{projectName}}** | 技术栈: {{techStack}}

## 审查重点
{{reviewFocus}}

## 你的任务
请对项目进行全面代码审查，重点关注：
1. **代码结构**: 目录组织、模块划分是否合理
2. **类型安全**: TypeScript 类型使用是否正确、是否有 any 滥用
3. **安全性**: 是否存在 XSS、注入等安全漏洞
4. **性能**: 是否有不必要的重渲染、内存泄漏、大 bundle
5. **可维护性**: 代码是否清晰、注释是否充分、是否有技术债
6. **最佳实践**: 是否符合 {{techStack}} 社区最佳实践

请以结构化方式输出审查结果，每个问题标注严重程度（Critical / High / Medium / Low）和修复建议。`,
  },
  {
    name: '打包发布',
    description: '准备项目进行打包和发布',
    category: '部署',
    variables: [
      {
        name: 'projectName',
        label: '项目名称',
        placeholder: '项目名称',
        required: true,
      },
      {
        name: 'platform',
        label: '目标平台',
        placeholder: 'Web / Desktop / CLI / Mobile',
        required: true,
      },
      {
        name: 'packageTarget',
        label: '打包目标',
        placeholder: '例如：npm publish / Vercel 部署 / Electron 打包...',
        required: true,
      },
      {
        name: 'version',
        label: '版本号',
        placeholder: '例如：1.0.0',
        required: true,
      },
    ],
    template: `# 打包发布指令

## 项目
**{{projectName}}** | 目标平台: {{platform}} | 版本: {{version}}

## 打包目标
{{packageTarget}}

## 你的任务
请准备项目进行打包和发布：
1. **版本管理**: 更新版本号至 {{version}}，生成 CHANGELOG
2. **构建优化**: 确认生产构建配置正确，优化 bundle 大小
3. **环境配置**: 确认环境变量和配置文件正确
4. **打包配置**: 配置 {{packageTarget}} 所需的所有文件
5. **发布检查清单**: 提供发布前的完整检查清单
6. **发布脚本**: 提供自动化发布脚本

## 要求
- 确保生产构建通过且无错误
- 排除不必要的文件（node_modules, 测试文件等）
- 提供清晰的发布步骤文档`,
  },
  {
    name: '生成 README',
    description: '为项目生成完整的 README.md 文档',
    category: '文档',
    variables: [
      {
        name: 'projectName',
        label: '项目名称',
        placeholder: '项目名称',
        required: true,
      },
      {
        name: 'projectDescription',
        label: '项目描述',
        placeholder: '用 1-2 句话描述项目是什么...',
        required: true,
      },
      {
        name: 'techStack',
        label: '技术栈',
        placeholder: '项目使用的技术栈',
        required: true,
      },
      {
        name: 'features',
        label: '核心功能',
        placeholder: '列出项目的主要功能...',
        required: false,
      },
      {
        name: 'specialSetup',
        label: '特殊配置说明',
        placeholder: '如果有特殊的环境配置要求...',
        required: false,
      },
    ],
    template: `# 生成 README 指令

## 项目
**{{projectName}}** | 技术栈: {{techStack}}

## 项目描述
{{projectDescription}}

{{#features}}
## 核心功能
{{features}}
{{/features}}

{{#specialSetup}}
## 特殊配置
{{specialSetup}}
{{/specialSetup}}

## 你的任务
请为本项目生成一份专业的 README.md，包含以下章节：
1. 项目名称与简介
2. 功能特性
3. 技术栈
4. 安装与运行指南
5. 项目结构说明
6. 开发指南
7. 构建与部署
8. 贡献指南（如适用）
9. 许可证信息

README 应该清晰、专业，方便新开发者快速上手。`,
  },
  {
    name: '生成 AGENTS.md',
    description: '生成 AGENTS.md 文件，为 AI 助手提供项目上下文',
    category: '文档',
    variables: [
      {
        name: 'projectName',
        label: '项目名称',
        placeholder: '项目名称',
        required: true,
      },
      {
        name: 'projectDescription',
        label: '项目描述',
        placeholder: '项目概述...',
        required: true,
      },
      {
        name: 'techStack',
        label: '技术栈',
        placeholder: '例如：Electron + React + TypeScript',
        required: true,
      },
      {
        name: 'codingRules',
        label: '编码规范',
        placeholder: '特殊的编码规则、命名约定等...',
        required: false,
      },
      {
        name: 'architecture',
        label: '架构说明',
        placeholder: '项目的架构设计说明...',
        required: false,
      },
    ],
    template: `# 生成 AGENTS.md 指令

## 项目
**{{projectName}}** | 技术栈: {{techStack}}

## 项目描述
{{projectDescription}}

{{#codingRules}}
## 编码规范
{{codingRules}}
{{/codingRules}}

{{#architecture}}
## 架构说明
{{architecture}}
{{/architecture}}

## 你的任务
请为本项目生成 AGENTS.md 文件。AGENTS.md 是为 AI 编程助手（如 Claude Code）提供项目上下文的标准文件。

应包含：
1. 项目概述和目标
2. 技术栈和工具链
3. 目录结构和模块说明
4. 编码规范和命名约定
5. 常用命令（开发、构建、测试、部署）
6. 特殊注意事项和已知问题
7. 测试策略
8. AI 助手操作指南（这个项目的特殊性）

文件应该让 AI 助手能够快速理解项目并高效工作。`,
  },
  {
    name: 'Claude Code 完整开发 Prompt',
    description: '生成给 Claude Code 的完整项目开发指令（包含所有上下文）',
    category: 'AI 工具专用',
    variables: [
      {
        name: 'projectName',
        label: '项目名称',
        placeholder: '项目名称',
        required: true,
      },
      {
        name: 'taskDescription',
        label: '任务描述',
        placeholder: '详细描述需要 Claude Code 完成的任务...',
        required: true,
      },
      {
        name: 'techStack',
        label: '技术栈',
        placeholder: '例如：React + TypeScript + Vite',
        required: true,
      },
      {
        name: 'fileStructure',
        label: '关键文件路径',
        placeholder: '列出关键文件及其作用...',
        required: false,
      },
      {
        name: 'constraints',
        label: '约束条件',
        placeholder: '例如：不要使用 any，必须保持 React 18 兼容...',
        required: false,
      },
    ],
    template: `# Claude Code 开发指令

## 项目
**{{projectName}}** | 技术栈: {{techStack}}

{{#fileStructure}}
## 关键文件结构
{{fileStructure}}
{{/fileStructure}}

## 任务
{{taskDescription}}

{{#constraints}}
## 约束条件
{{constraints}}
{{/constraints}}

## 工作规范
1. 使用 TypeScript 严格模式编写所有代码
2. 遵循 SOLID 原则和设计模式
3. 每个函数/类添加 JSDoc 注释
4. 错误处理要完整（try-catch + 用户友好提示）
5. 优先使用函数式编程风格
6. 确保无障碍访问（a11y）
7. 修改前先阅读相关文件，理解上下文

## 输出要求
- 完成代码修改
- 简要说明每一步做了什么
- 如果有需要注意的事项，请明确指出`,
  },
  {
    name: 'Codex 接手优化 Prompt',
    description: '为 Codex（OpenAI）生成的上下文恢复和任务接手 prompt',
    category: 'AI 工具专用',
    variables: [
      {
        name: 'projectName',
        label: '项目名称',
        placeholder: '项目名称',
        required: true,
      },
      {
        name: 'completedByClaude',
        label: 'Claude Code 已完成的工作',
        placeholder: '列出 Claude Code 已经完成的工作...',
        required: true,
      },
      {
        name: 'currentState',
        label: '当前代码状态',
        placeholder: '当前代码的整体状态...',
        required: true,
      },
      {
        name: 'taskForCodex',
        label: '需要 Codex 完成的任务',
        placeholder: '描述需要 Codex 接手完成的任务...',
        required: true,
      },
      {
        name: 'techStack',
        label: '技术栈',
        placeholder: '技术栈信息',
        required: true,
      },
    ],
    template: `# Codex 接手开发指令

你是 Codex（OpenAI），一个高级 AI 编程助手。以下是上下文信息，请基于这些信息继续开发。

## 项目
**{{projectName}}** | 技术栈: {{techStack}}

## Claude Code 已完成的工作
{{completedByClaude}}

## 当前代码状态
{{currentState}}

## 你的任务
{{taskForCodex}}

## 重要提示
- 不要重复或覆盖 Claude Code 已完成的工作
- 理解现有代码风格并保持一致
- 新增代码需要 TypeScript 严格类型
- 保持项目结构不变
- 如果遇到不确定的地方，优先查阅项目现有代码寻找模式

## 期望输出
- 完成任务所需的代码修改
- 简要说明修改原因
- 如果有任何风险或问题，请明确指出`,
  },
  {
    name: 'Cursor 项目 Prompt',
    description: '为 Cursor IDE 准备的完整项目开发 prompt',
    category: 'AI 工具专用',
    variables: [
      {
        name: 'projectName',
        label: '项目名称',
        placeholder: '项目名称',
        required: true,
      },
      {
        name: 'projectOverview',
        label: '项目概述',
        placeholder: '项目是什么、做什么...',
        required: true,
      },
      {
        name: 'techStack',
        label: '技术栈',
        placeholder: '技术栈信息',
        required: true,
      },
      {
        name: 'currentTask',
        label: '当前要做的任务',
        placeholder: '描述需要完成的具体任务...',
        required: true,
      },
      {
        name: 'rules',
        label: 'Cursor Rules',
        placeholder: '特定的 Cursor 规则或偏好...',
        required: false,
      },
    ],
    template: `# Cursor 开发 Prompt

将此内容保存为 .cursorrules 或放在 Cursor Chat 中使用。

## 项目背景
{{projectOverview}}

## 技术栈
{{techStack}}

## 当前任务
{{currentTask}}

{{#rules}}
## 特殊规则
{{rules}}
{{/rules}}

## AI 规则配置
\`\`\`yaml
# .cursorrules
project: {{projectName}}
language: typescript
framework: {{techStack}}
style:
  typescript: strict
  formatting: prettier
  linting: eslint
patterns:
  - use-typed-hooks
  - avoid-any
  - prefer-arrow-functions
  - single-export-per-file
\`\`\`

## 提示
- 每次修改后运行 \`npm run typecheck\` 验证类型
- 遵循项目已有的代码风格和目录结构
- 优先使用项目已有的工具函数和组件`,
  },
  {
    name: '跨模型恢复上下文 Prompt',
    description: '在不同 AI 模型间转移项目上下文时的恢复 prompt',
    category: 'AI 工具专用',
    variables: [
      {
        name: 'projectName',
        label: '项目名称',
        placeholder: '项目名称',
        required: true,
      },
      {
        name: 'previousModel',
        label: '之前使用的 AI 模型',
        placeholder: '例如：Claude Code、Codex、Cursor...',
        required: true,
      },
      {
        name: 'currentModel',
        label: '当前使用的 AI 模型',
        placeholder: '例如：Codex、Claude Code...',
        required: true,
      },
      {
        name: 'projectState',
        label: '项目状态摘要',
        placeholder: '项目的整体状态、文件结构、进度...',
        required: true,
      },
      {
        name: 'decisionsMade',
        label: '已做的关键决策',
        placeholder: '技术选型、架构决策、API 设计等...',
        required: true,
      },
      {
        name: 'knownIssues',
        label: '已知问题和注意事项',
        placeholder: '已知的 bug、陷阱、技术债...',
        required: false,
      },
      {
        name: 'nextSteps',
        label: '下一步计划',
        placeholder: '接下来要做的事情...',
        required: true,
      },
    ],
    template: `# 跨模型上下文恢复 Prompt

你正在接手一个之前由 {{previousModel}} 开发的项目。请基于以下上下文理解项目并继续工作。

## 项目
**{{projectName}}**

## 项目状态
{{projectState}}

## 关键决策记录
{{decisionsMade}}

{{#knownIssues}}
## 已知问题
{{knownIssues}}
{{/knownIssues}}

## 下一步计划
{{nextSteps}}

## 给你的指令（{{currentModel}}）
1. 首先通读项目文件，理解现有代码结构和风格
2. 阅读 package.json 了解依赖和脚本
3. 确认之前的关键决策并在开发中保持一致
4. 按照下一步计划推进工作
5. 如果遇到问题，参考已知问题列表避免重复踩坑
6. 不要大规模重构——保持与现有代码一致的风格

## 上下文完整性检查
- [ ] 理解了项目目标
- [ ] 理解了现有架构
- [ ] 确认了技术栈版本
- [ ] 知道了关键决策的来龙去脉
- [ ] 了解了下一步要做什么`,
  },
];

// ── Public API ──

/**
 * Fill a template by name with the given variable values.
 * Variables in the template use the {{variableName}} syntax.
 * Conditional blocks use {{#variableName}}...{{/variableName}} syntax —
 * the block is included only if the variable has a truthy value.
 *
 * Throws if the template name is not found.
 */
export function fillTemplate(
  templateName: string,
  variables: Record<string, string>,
): string {
  const template = getTemplateByName(templateName);
  if (!template) {
    throw new Error(`Template not found: "${templateName}"`);
  }

  let result = template.template;

  // Handle conditional blocks: {{#var}}...{{/var}}
  result = result.replace(
    /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
    (_match, varName: string, content: string) => {
      const value = variables[varName];
      return value && value.trim() ? content : '';
    },
  );

  // Handle simple variable substitution: {{var}}
  result = result.replace(/\{\{(\w+)\}\}/g, (_match, varName: string) => {
    return variables[varName] ?? `{{${varName}}}`;
  });

  // Clean up extra blank lines (3+ consecutive newlines → 2)
  result = result.replace(/\n{3,}/g, '\n\n');

  return result.trim();
}

/**
 * Look up a prompt template by its name.
 * Returns undefined if no template matches.
 */
export function getTemplateByName(name: string): PromptTemplate | undefined {
  return PROMPT_TEMPLATES.find((t) => t.name === name);
}

/**
 * Return all templates in a given category.
 */
export function getTemplatesByCategory(category: string): PromptTemplate[] {
  return PROMPT_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Return all unique category names.
 */
export function getTemplateCategories(): string[] {
  return [...new Set(PROMPT_TEMPLATES.map((t) => t.category))];
}
