import type {
  Project,
  Task,
  Memory,
  ProjectPlan,
  MemoryInjectionMode,
  Platform,
  Priority,
} from '../../shared/types';
import { generateId } from './utils';

// ── Helpers ──

function makeTask(
  projectId: string,
  role: string,
  title: string,
  description: string,
  input: string,
  output: string,
  acceptance: string,
  priority: Priority,
): Task {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    projectId,
    role,
    title,
    description,
    input,
    output,
    acceptance,
    priority,
    status: 'todo',
    createdAt: now,
    updatedAt: now,
  };
}

function directoryTreeForPlatform(platform: Platform, projectName: string): string {
  const slug = projectName.replace(/\s+/g, '-').toLowerCase();
  const base = (name: string) => `├── src/\n│   ├── index.${name}`;

  switch (platform) {
    case 'Web': {
      const tsx = `├── src/\n│   ├── main.tsx\n│   ├── App.tsx\n│   ├── components/\n│   │   ├── Header.tsx\n│   │   ├── Footer.tsx\n│   │   └── Layout.tsx\n│   ├── pages/\n│   │   └── HomePage.tsx\n│   ├── hooks/\n│   │   └── useData.ts\n│   ├── lib/\n│   │   ├── api.ts\n│   │   └── utils.ts\n│   ├── styles/\n│   │   └── globals.css\n├── public/\n│   └── favicon.ico\n├── index.html\n├── package.json\n├── tsconfig.json\n└── vite.config.ts`;
      return tsx;
    }
    case 'Desktop': {
      return `├── src/\n│   ├── main/\n│   │   ├── index.ts\n│   │   ├── ipc.ts\n│   │   └── window.ts\n│   ├── preload/\n│   │   └── index.ts\n│   ├── renderer/\n│   │   ├── index.html\n│   │   ├── main.tsx\n│   │   ├── App.tsx\n│   │   ├── components/\n│   │   └── pages/\n├── assets/\n├── package.json\n├── tsconfig.json\n├── tsconfig.node.json\n├── vite.config.ts\n└── electron-builder.yml`;
    }
    case 'CLI': {
      return `├── src/\n│   ├── index.ts\n│   ├── commands/\n│   │   └── main.ts\n│   ├── lib/\n│   │   ├── config.ts\n│   │   └── utils.ts\n│   └── types.ts\n├── bin/\n│   └── ${slug}.js\n├── package.json\n├── tsconfig.json\n└── README.md`;
    }
    case 'Mobile': {
      return `├── src/\n│   ├── App.tsx\n│   ├── screens/\n│   │   ├── HomeScreen.tsx\n│   │   └── DetailsScreen.tsx\n│   ├── components/\n│   │   ├── Button.tsx\n│   │   └── Card.tsx\n│   ├── navigation/\n│   │   └── RootNavigator.tsx\n│   ├── lib/\n│   │   └── api.ts\n│   └── styles/\n│       └── theme.ts\n├── assets/\n├── app.json\n├── package.json\n├── tsconfig.json\n└── babel.config.js`;
    }
    case 'Embedded': {
      return `├── src/\n│   ├── main.cpp\n│   ├── core/\n│   │   ├── app.cpp\n│   │   └── app.h\n│   ├── drivers/\n│   │   └── sensor.cpp\n│   ├── lib/\n│   │   └── utils.cpp\n│   └── config.h\n├── platformio.ini\n├── README.md\n└── lib/\n    └── README`;
    }
    default:
      return `├── src/\n│   ├── index.ts\n│   ├── lib/\n│   └── types.ts\n├── package.json\n├── tsconfig.json\n└── README.md`;
  }
}

function architectureForProject(project: Project): string {
  const stack = project.techStack.toLowerCase();
  const platform = project.platform;

  if (platform === 'Web') {
    if (stack.includes('next') || stack.includes('nuxt')) {
      return `SSR 全栈架构\n- 前端框架: ${project.techStack}\n- 渲染策略: 服务端渲染 (SSR) + 客户端水合\n- 路由: 文件系统路由\n- 数据获取: 服务端 getServerSideProps / 静态生成\n- API 层: 内置 API Routes\n- 部署: Vercel / Netlify / Node.js 服务器`;
    }
    return `CSR 单页应用架构\n- 前端框架: ${project.techStack}\n- 构建工具: Vite\n- 路由: 客户端路由 (React Router / Vue Router)\n- 状态管理: Context / Pinia / Zustand\n- HTTP 客户端: fetch / axios\n- 部署: 静态托管 (Vercel / Netlify / Cloudflare Pages)`;
  }

  if (platform === 'Desktop') {
    return `Electron 桌面应用架构\n- 框架: ${project.techStack}\n- 主进程: Node.js + Electron Main\n- 渲染进程: Chromium + React/Vue\n- 进程通信: contextBridge + ipcRenderer/ipcMain\n- 本地存储: better-sqlite3 / electron-store\n- 打包: electron-builder\n- 自动更新: electron-updater`;
  }

  if (platform === 'CLI') {
    return `Node.js CLI 工具架构\n- 运行时: Node.js\n- CLI 框架: Commander / yargs\n- 构建: TypeScript → CommonJS\n- 输出美化: chalk / ora\n- 配置管理: cosmiconfig\n- 发布: npm publish`;
  }

  if (platform === 'Mobile') {
    return `React Native 移动应用架构\n- 框架: ${project.techStack}\n- 导航: React Navigation\n- 状态管理: Zustand / Redux Toolkit\n- HTTP: fetch / axios\n- 本地存储: AsyncStorage\n- 打包: Fastlane / EAS Build`;
  }

  if (platform === 'Embedded') {
    return `嵌入式系统架构\n- 平台: ${project.techStack}\n- 硬件抽象层 (HAL)\n- RTOS / Bare-metal\n- 驱动层\n- 应用逻辑层\n- 调试: JTAG / SWD + 串口日志`;
  }

  return `${project.platform} 项目架构\n- 技术栈: ${project.techStack}\n- 分层架构: 展示层 → 业务逻辑层 → 数据层`;
}

function buildPRD(project: Project): string {
  const difficulties: Record<string, string> = {
    Easy: '入门级 - 适合快速原型和简单工具',
    Medium: '中级 - 需要合理的架构设计和错误处理',
    Hard: '高级 - 需要系统性的架构规划和性能优化',
  };

  return `# 产品需求文档 (PRD)

## 项目概述
- **项目名称**: ${project.name}
- **核心创意**: ${project.idea}
- **目标平台**: ${project.platform}
- **技术栈**: ${project.techStack}
- **UI 风格**: ${project.uiStyle}
- **难度等级**: ${difficulties[project.difficulty] || project.difficulty}

## 用户故事
1. 作为用户，我希望能直观地理解和使用核心功能
2. 作为用户，我希望界面响应迅速，操作流畅
3. 作为用户，我期望在遇到错误时得到清晰的提示
4. 作为用户，我希望数据能够安全持久化保存
5. 作为用户，我希望在不同设备/场景下有良好的体验

## 功能需求
- 核心业务逻辑实现
- 用户交互界面（基于 ${project.uiStyle} 风格）
- 数据持久化与状态管理
- 错误处理与用户提示
- 响应式 / 自适应布局

## 非功能需求
- 性能：首屏加载 < 3s，操作响应 < 200ms
- 安全：输入校验、XSS 防护
- 可维护性：TypeScript 类型覆盖、清晰的项目结构
- 兼容性：主流浏览器 / 目标平台支持

## 技术约束
- 开发语言: TypeScript
- 平台: ${project.platform}
- 技术栈: ${project.techStack}
- 代码风格: 遵循 ESLint + Prettier 配置`;
}

function buildDevPrompt(
  project: Project,
  tasks: Task[],
  tool: string,
): string {
  const taskList = tasks
    .map(
      (t, i) =>
        `${i + 1}. **${t.title}** (${t.role}, 优先级: ${t.priority})\n   描述: ${t.description}\n   验收: ${t.acceptance}`,
    )
    .join('\n');

  return `# ${tool} 开发指令

## 项目信息
- **项目名称**: ${project.name}
- **核心创意**: ${project.idea}
- **平台**: ${project.platform}
- **技术栈**: ${project.techStack}
- **UI 风格**: ${project.uiStyle}

## 你的角色
你是一位资深全栈工程师。请严格按照以下任务列表，逐步完成开发。

## 任务列表
${taskList}

## 开发要求
1. 所有代码使用 TypeScript，保持严格类型
2. 遵循项目目录结构，不要随意创建新目录
3. 每个任务完成后进行自测，确保验收标准通过
4. 保持代码风格一致，遵循 ESLint 配置
5. 遇到不确定的地方，优先选择社区最佳实践

## 输出格式
- 每完成一个任务，简要说明做了什么
- 如果遇到阻塞问题，清楚描述问题并提供可能的解决方案
- 完成后，给出整个项目的运行指南`;
}

// ── Main export ──

/**
 * Generate a comprehensive project plan from the given project, tasks, and
 * memory context.
 *
 * The injection mode controls how much of the shared memory is embedded into
 * the AI tool prompts.
 */
export function generateProjectPlan(
  project: Project,
  tasks: Task[],
  memories: Memory[],
  injectionMode: MemoryInjectionMode,
): ProjectPlan {
  const projectId = project.id;

  // ── Summary ──
  const summary = `${project.name} — ${project.platform} 项目，基于 ${project.techStack} 技术栈，UI 风格 ${project.uiStyle}。难度: ${project.difficulty}。`;

  // ── PRD ──
  const prd = buildPRD(project);

  // ── Architecture ──
  const architecture = architectureForProject(project);

  // ── Directory structure ──
  const directoryStructure = directoryTreeForPlatform(
    project.platform,
    project.name,
  );

  // ── Tasks ──
  // If no tasks are provided, generate a sensible default list.
  let planTasks: Task[];
  if (tasks.length > 0) {
    planTasks = tasks;
  } else {
    planTasks = [
      makeTask(
        projectId,
        '架构师',
        '项目初始化与环境配置',
        `初始化 ${project.techStack} 项目，配置 TypeScript、Linter、构建工具`,
        '无',
        '可运行的项目骨架',
        'npm install && npm run dev 成功启动',
        'critical',
      ),
      makeTask(
        projectId,
        '前端开发',
        '实现核心 UI 布局',
        `基于 ${project.uiStyle} 风格实现主要页面布局和导航结构`,
        '项目骨架',
        '完整的页面布局框架',
        '所有页面的基本布局结构完整，导航正常工作',
        'high',
      ),
      makeTask(
        projectId,
        '前端开发',
        '实现核心业务组件',
        '开发核心业务逻辑的前端组件',
        'UI 布局',
        '可交互的核心组件',
        '核心组件功能完备，覆盖主要用户流程',
        'high',
      ),
      makeTask(
        projectId,
        '后端开发',
        '实现数据层和服务层',
        '编写数据获取、状态管理、持久化逻辑',
        '核心组件',
        '完整的数据流',
        '数据在不同组件间正确流转，持久化正常',
        'high',
      ),
      makeTask(
        projectId,
        '全栈开发',
        'API 集成（如适用）',
        '对接后端 API，处理请求/响应/错误',
        '数据层',
        'API 客户端模块',
        'API 调用正常，错误处理健全',
        'medium',
      ),
      makeTask(
        projectId,
        '前端开发',
        '交互增强与动画',
        '添加过渡动画、加载状态、空状态、错误状态处理',
        '核心组件',
        '完善的用户体验',
        '所有交互状态都有对应 UI，动画流畅自然',
        'medium',
      ),
      makeTask(
        projectId,
        '测试工程师',
        '编写测试用例',
        '为关键功能编写单元测试和集成测试',
        '完整功能',
        '测试套件',
        '测试覆盖率 > 80%，关键路径全覆盖',
        'medium',
      ),
      makeTask(
        projectId,
        '全栈开发',
        '性能优化',
        '优化加载速度、减少 bundle 大小、代码分割',
        '完整功能',
        '优化后的构建产物',
        'Lighthouse 评分 > 90，首屏加载 < 3s',
        'low',
      ),
    ];
  }

  // ── Test plan ──
  const testPlan = `# 测试计划

## 单元测试
- 工具函数测试: 覆盖所有纯函数
- 组件测试: 关键组件渲染与交互验证
- Hook 测试: 自定义 Hooks 的边界条件

## 集成测试
- 用户主流程端到端测试
- API 集成测试 (使用 MSW 或 mock)
- 状态管理集成测试

## E2E 测试 (如适用)
- 核心用户旅程: 从进入到完成主要任务
- 错误场景: 网络故障、数据为空等
- 跨平台兼容性测试

## 测试工具
- Vitest + Testing Library (单元/集成)
- Playwright (E2E, Desktop 项目)
- 持续集成: GitHub Actions`;

  // ── Acceptance criteria ──
  const acceptanceCriteria = `# 验收标准

1. **功能完整性**: 所有 ${planTasks.length} 个任务完成，验收标准通过
2. **代码质量**: TypeScript 严格模式通过，ESLint 0 warnings
3. **构建成功**: \`npm run build\` 无错误
4. **测试通过**: 所有测试用例通过，覆盖率达标
5. **UI 一致性**: 符合 ${project.uiStyle} 风格规范
6. **性能指标**: 首屏加载 < 3s，交互响应 < 200ms
7. **文档完整**: README 包含安装、运行、构建说明`;

  // ── Build shared memory context string if needed ──
  let memoryContext = '';
  if (injectionMode !== 'off' && memories.length > 0) {
    memoryContext = buildMemoryContext(memories, injectionMode);
  }

  // ── Dev prompts (with optional memory context) ──
  const baseClaudePrompt = buildDevPrompt(project, planTasks, 'Claude Code');
  const baseCodexPrompt = buildDevPrompt(project, planTasks, 'Codex');
  const baseCursorPrompt = buildDevPrompt(project, planTasks, 'Cursor');

  const devPrompt = memoryContext
    ? `${memoryContext}\n\n---\n\n${baseClaudePrompt}`
    : baseClaudePrompt;

  const codexPrompt = memoryContext
    ? `${memoryContext}\n\n---\n\n${baseCodexPrompt}`
    : baseCodexPrompt;

  const cursorPrompt = memoryContext
    ? `${memoryContext}\n\n---\n\n${baseCursorPrompt}`
    : baseCursorPrompt;

  return {
    summary,
    prd,
    architecture,
    directoryStructure,
    tasks: planTasks,
    testPlan,
    acceptanceCriteria,
    devPrompt,
    codexPrompt,
    cursorPrompt,
  };
}

/**
 * Build a compact memory context block for inclusion in AI prompts.
 */
function buildMemoryContext(
  memories: Memory[],
  mode: MemoryInjectionMode,
): string {
  let filtered: Memory[];

  switch (mode) {
    case 'minimal':
      filtered = memories
        .filter((m) => m.status === 'active')
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 3);
      break;
    case 'balanced':
      filtered = memories
        .filter(
          (m) =>
            m.status === 'active' &&
            ['project_context', 'decision', 'user_preference'].includes(m.type),
        )
        .sort((a, b) => b.importance - a.importance);
      break;
    case 'full':
      filtered = memories
        .filter((m) => m.status === 'active' || m.status === 'pending')
        .sort((a, b) => b.importance - a.importance);
      break;
    default:
      return '';
  }

  if (filtered.length === 0) return '';

  const lines: string[] = ['[Shared Memory Context]'];

  const ctx = filtered.filter((m) => m.type === 'project_context');
  if (ctx.length) {
    lines.push('- 项目背景：');
    ctx.forEach((m) => lines.push(`  - ${m.title}: ${m.content}`));
  }

  const dec = filtered.filter((m) => m.type === 'decision');
  if (dec.length) {
    lines.push('- 已做决策：');
    dec.forEach((m) => lines.push(`  - ${m.title}: ${m.content}`));
  }

  const prefs = filtered.filter((m) => m.type === 'user_preference');
  if (prefs.length) {
    lines.push('- 用户偏好：');
    prefs.forEach((m) => lines.push(`  - ${m.title}: ${m.content}`));
  }

  const issues = filtered.filter((m) => m.type === 'issue_fix');
  if (issues.length) {
    lines.push('- 已知问题：');
    issues.forEach((m) => lines.push(`  - ${m.title}: ${m.content}`));
  }

  const api = filtered.filter((m) => m.type === 'api_provider');
  if (api.length) {
    lines.push('- API 注意事项：');
    api.forEach((m) => lines.push(`  - ${m.title}: ${m.content}`));
  }

  const env = filtered.filter((m) => m.type === 'environment');
  if (env.length) {
    lines.push('- 环境信息：');
    env.forEach((m) => lines.push(`  - ${m.title}: ${m.content}`));
  }

  lines.push('[/Shared Memory Context]');

  return lines.join('\n');
}
