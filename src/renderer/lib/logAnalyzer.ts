import type { LogAnalysisResult } from '../../shared/types';

// ── Pattern definitions ──

interface LogPattern {
  /** Regex pattern to match in the log text. */
  pattern: RegExp;
  /** Human-readable error type label. */
  errorType: string;
  /** List of possible root causes. */
  possibleCauses: string[];
  /** Step-by-step fix instructions. */
  fixSteps: string[];
  /** CLI commands the user can run. */
  suggestedCommands: string[];
  /** Ready-to-use prompt to send to an AI for fixing. */
  fixPrompt: string;
  /** Whether this analysis outcome should be saved as a memory. */
  suggestMemory: boolean;
}

const PATTERNS: LogPattern[] = [
  // ── Module resolution ──
  {
    pattern: /Cannot find module\s+['"]([^'"]+)['"]/i,
    errorType: '模块未找到 (Module Not Found)',
    possibleCauses: [
      '依赖未安装 — 运行 npm install / yarn install',
      '路径错误 — 导入路径大小写不正确或文件不存在',
      '模块不是项目依赖 — 需要在 package.json 中添加',
      'TypeScript 路径别名未配置 — 检查 tsconfig.json paths',
      'node_modules 损坏 — 删除后重新安装',
    ],
    fixSteps: [
      '确认模块名称拼写正确',
      '运行 npm install 确保所有依赖已安装',
      '检查导入路径是否与实际文件路径匹配（注意大小写）',
      '如果是 TypeScript 路径别名，检查 tsconfig.json 的 paths 配置',
      '删除 node_modules 和 lock 文件后重新安装',
    ],
    suggestedCommands: [
      'npm install',
      'rm -rf node_modules package-lock.json && npm install',
      'npx tsc --noEmit --traceResolution',
    ],
    fixPrompt: `请修复模块找不到的错误。${'$1'} 模块无法被解析。

请：
1. 检查该模块是否在 package.json 的 dependencies 中
2. 确认导入路径是否正确（区分大小写）
3. 检查 tsconfig.json 的 paths 别名配置
4. 如果模块存在但路径不对，更正导入路径
5. 如果模块缺失，安装对应的 npm 包`,
    suggestMemory: false,
  },

  // ── npm install failures ──
  {
    pattern: /npm\s+(install|i)\s+.*(?:failed|error|ERR!)/i,
    errorType: 'npm 安装失败 (npm Install Failed)',
    possibleCauses: [
      '网络问题 — npm registry 无法访问或被防火墙拦截',
      '权限不足 — 没有写入 node_modules 的权限',
      'node-gyp 编译失败 — 缺少 C++ 构建工具（Python、Visual Studio Build Tools）',
      '包版本冲突 — peer dependency 不兼容',
      '磁盘空间不足',
    ],
    fixSteps: [
      '检查网络连接，尝试切换 npm registry（如 npmmirror.com）',
      '以管理员身份运行命令行（Windows）或使用 sudo（macOS/Linux）',
      '安装 node-gyp 所需的构建工具',
      '尝试使用 --legacy-peer-deps 标志',
      '清理 npm 缓存：npm cache clean --force',
      '删除 package-lock.json 后重试',
    ],
    suggestedCommands: [
      'npm config set registry https://registry.npmmirror.com',
      'npm install --legacy-peer-deps',
      'npm cache clean --force',
      'npm install -g windows-build-tools (Windows)',
      'rm -rf node_modules package-lock.json && npm install',
    ],
    fixPrompt: `npm install 失败了。请诊断问题并提供修复方案。

常见原因：
1. 网络问题 — 尝试切换镜像源
2. node-gyp 编译 — 需要 C++ 构建工具
3. 权限问题 — 需要管理员/sudo 权限
4. 依赖冲突 — 使用 --legacy-peer-deps

请检查完整的错误日志，确定具体原因并提供准确的修复命令。`,
    suggestMemory: true,
  },

  // ── Vite server failures ──
  {
    pattern: /vite.*(?:error|failed|cannot|EADDRINUSE)/i,
    errorType: 'Vite 开发服务器启动失败',
    possibleCauses: [
      '端口被占用 — 其他程序正在使用该端口',
      '配置文件错误 — vite.config.ts 语法或配置有误',
      '插件不兼容 — 某个 Vite 插件版本不匹配',
      '环境变量缺失 — 缺少必需的 .env 变量',
    ],
    fixSteps: [
      '检查端口是否被占用：netstat -ano | findstr :<port> (Windows) 或 lsof -i :<port> (macOS/Linux)',
      '修改 vite.config.ts 中的 server.port 为其他端口',
      '检查 vite.config.ts 语法是否正确',
      '确认所有 Vite 插件兼容当前 Vite 版本',
      '确保 .env 文件存在且包含必需变量',
    ],
    suggestedCommands: [
      'npx vite --port 3000',
      'netstat -ano | findstr :5173 (Windows)',
      'lsof -i :5173 (macOS/Linux)',
      'npx vite --debug',
    ],
    fixPrompt: `Vite 开发服务器无法启动。请诊断问题。

请检查：
1. 端口 5173（默认）是否被占用
2. vite.config.ts 配置是否正确
3. 是否有插件兼容性问题
4. 环境变量是否配置正确

提供具体的修复方案。`,
    suggestMemory: false,
  },

  // ── TypeScript errors ──
  {
    pattern: /(?:TS\d{4}[:;]|TypeScript.*error|tsc.*error)/i,
    errorType: 'TypeScript 编译错误',
    possibleCauses: [
      '类型不匹配 — 变量的实际类型与期望类型不一致',
      '缺少类型声明 — @types/* 未安装',
      'tsconfig.json 配置错误 — strict 模式导致隐式 any',
      '使用了未导入的类型或变量',
      '泛型约束不满足',
    ],
    fixSteps: [
      '阅读具体的 TS 错误代码和行号定位问题',
      '修正类型定义或类型断言',
      '安装缺失的 @types/* 包',
      '适当放宽 tsconfig 配置（不推荐）或添加显式类型注解',
      '检查导入语句是否完整',
    ],
    suggestedCommands: [
      'npx tsc --noEmit',
      'npx tsc --noEmit --pretty',
      'npm install -D @types/node @types/react',
    ],
    fixPrompt: `项目存在 TypeScript 编译错误。请逐一修复。

要求：
1. 不要使用 as any 回避类型错误
2. 如果缺少类型包，安装对应的 @types/*
3. 适当定义接口和类型别名
4. 使用类型收窄而非类型断言
5. 确保严格模式下所有类型正确`,
    suggestMemory: false,
  },

  // ── Electron preload errors ──
  {
    pattern: /electron.*preload.*(?:error|failed|cannot)/i,
    errorType: 'Electron Preload 脚本错误',
    possibleCauses: [
      'contextIsolation 配置问题 — contextBridge 未正确暴露 API',
      'nodeIntegration 设置不正确',
      'preload 脚本语法错误或路径错误',
      '在 preload 中使用了浏览器特有的 API（如 DOM API）',
      'sandbox 模式下某些 API 不可用',
    ],
    fixSteps: [
      '确认 preload 脚本路径在 BrowserWindow 配置中正确',
      '检查 contextBridge.exposeInMainWorld 调用是否正确',
      '确保 nodeIntegration: false 且 contextIsolation: true（安全配置）',
      '在 preload 中只能使用 Node.js API 的子集',
      '验证 preload 脚本可以正常编译（无语法错误）',
    ],
    suggestedCommands: [
      'npx tsc --noEmit -p tsconfig.node.json',
      'npx electron . --inspect',
    ],
    fixPrompt: `Electron 的 preload 脚本出现了错误。请分析并提供修复方案。

核心检查点：
1. contextBridge.exposeInMainWorld 的使用是否正确
2. 暴露的 API 结构是否与渲染进程期望一致
3. preload 脚本路径是否正确
4. 是否正确区分了 main / preload / renderer 的 TypeScript 配置`,
    suggestMemory: true,
  },

  // ── Electron main process errors ──
  {
    pattern: /electron.*(?:main process|app\.(?:on|crashed|quit)).*(?:error|crash|uncaught)/i,
    errorType: 'Electron 主进程错误',
    possibleCauses: [
      '主进程中有未捕获的异常',
      'BrowserWindow 创建失败',
      'IPC 通信通道未正确注册',
      '原生模块加载失败（如 better-sqlite3）',
      '内存不足导致进程崩溃',
    ],
    fixSteps: [
      '在主进程入口添加全局 uncaughtException 和 unhandledRejection 处理器',
      '检查 BrowserWindow 的 webPreferences 配置',
      '使用 ipcMain.handle / ipcMain.on 正确注册 IPC 通道',
      '确保原生模块与 Electron 版本兼容（可能需要重新编译）',
      '使用 --inspect 标志调试主进程',
    ],
    suggestedCommands: [
      'npx electron . --inspect=5858',
      'npm rebuild',
      'npx electron-rebuild',
    ],
    fixPrompt: `Electron 主进程崩溃或出错。请帮助诊断和修复。

常见检查项：
1. 是否有未捕获的异常？添加全局错误处理
2. 原生模块（如 better-sqlite3）与当前 Electron 版本是否兼容？
3. BrowserWindow 配置是否正确？
4. IPC 通信是否有未处理的 rejected promises？`,
    suggestMemory: true,
  },

  // ── Playwright browser missing ──
  {
    pattern: /playwright.*(?:browser|chromium|firefox|webkit).*(?:missing|not found|not installed|executable)/i,
    errorType: 'Playwright 浏览器未安装',
    possibleCauses: [
      'Playwright 安装不完整 — 需要运行 npx playwright install',
      '浏览器可执行文件路径变更或被删除',
      '系统缺少浏览器所需的依赖（Linux 常见）',
      'Playwright 缓存目录权限不足',
    ],
    fixSteps: [
      '运行 npx playwright install 安装浏览器',
      '如果只需要特定浏览器，运行 npx playwright install chromium',
      '在 Linux 上安装系统依赖：npx playwright install-deps',
      '检查 PLAYWRIGHT_BROWSERS_PATH 环境变量',
    ],
    suggestedCommands: [
      'npx playwright install',
      'npx playwright install chromium',
      'npx playwright install-deps',
    ],
    fixPrompt: `Playwright 找不到浏览器可执行文件。请按以下步骤修复：

1. 运行 npx playwright install 安装所有浏览器
2. 如果只需要 Chromium：npx playwright install chromium
3. Linux 上安装系统依赖：npx playwright install-deps
4. 验证安装：npx playwright test --list`,
    suggestMemory: false,
  },

  // ── Port in use ──
  {
    pattern: /EADDRINUSE/i,
    errorType: '端口已被占用 (EADDRINUSE)',
    possibleCauses: [
      '另一个程序正在使用该端口',
      '当前程序的另一个实例仍在运行',
      '系统服务占用了该端口',
    ],
    fixSteps: [
      '查找占用端口的进程并终止它',
      '修改应用配置使用其他端口',
      '等待一段时间后重试（如果进程正在退出）',
    ],
    suggestedCommands: [
      'netstat -ano | findstr :<PORT> (Windows)',
      'taskkill /PID <PID> /F (Windows)',
      'lsof -i :<PORT> (macOS/Linux)',
      'kill -9 <PID> (macOS/Linux)',
      'npx kill-port <PORT>',
    ],
    fixPrompt: `端口被占用 (EADDRINUSE)。请帮助：

1. 查找占用端口的进程
2. 安全地终止该进程或更换端口
3. 修改应用配置以避免冲突`,
    suggestMemory: false,
  },

  // ── Permission denied ──
  {
    pattern: /EPERM/i,
    errorType: '权限不足 (EPERM)',
    possibleCauses: [
      '当前用户没有对该文件/目录的操作权限',
      '文件被另一个进程锁定（Windows 常见）',
      '尝试在系统保护目录中创建或修改文件',
      '杀毒软件或安全策略阻止了操作',
    ],
    fixSteps: [
      '以管理员身份运行终端（Windows）或使用 sudo（macOS/Linux）',
      '检查文件是否被其他程序（如 VS Code、杀毒软件）占用',
      '将项目目录移动到非系统保护的路径（如 D: 或 ~/projects/ 中）',
      '关闭可能占用文件的程序后重试',
    ],
    suggestedCommands: [
      '以管理员身份运行 PowerShell/CMD (Windows 右键)',
      'sudo <command> (macOS/Linux)',
      'chmod 755 <file> (macOS/Linux)',
    ],
    fixPrompt: `操作被拒绝 (EPERM - 权限不足)。请提供解决方案：

1. 确认是什么操作导致的权限错误
2. 提供以正确权限重试的步骤
3. 如果是文件锁定问题，如何解除锁定`,
    suggestMemory: false,
  },

  // ── node-gyp failures ──
  {
    pattern: /node-gyp.*(?:failed|error|ERR!)/i,
    errorType: 'node-gyp 构建失败',
    possibleCauses: [
      '缺少 C++ 构建工具 — Windows 需要 Visual Studio Build Tools + Python',
      'Python 未安装或不在 PATH 中',
      'Node.js 版本与原生模块不兼容',
      '缺少 Windows SDK',
    ],
    fixSteps: [
      '安装 Visual Studio Build Tools（含 C++ 工作负载）',
      '安装 Python 3.x 并添加到 PATH',
      '运行 npm install -g windows-build-tools（已弃用，改用官方工具）',
      '确保 Node.js 版本 > 16 且原生模块支持',
      '使用 npm config set msvs_version 指定 VS 版本',
    ],
    suggestedCommands: [
      'npm install --global windows-build-tools (旧方法)',
      'npm config set msvs_version 2022',
      'python --version  # 确认 Python 已安装',
      'npm install -g node-gyp',
    ],
    fixPrompt: `node-gyp 构建失败。这通常发生在 Windows 上安装需要编译的原生模块时。

请帮助用户：
1. 确认是否安装了 Visual Studio Build Tools（含 C++ 工作负载）
2. 确认 Python 是否在 PATH 中
3. 提供具体的安装和配置步骤
4. 如果问题持续，建议替代方案`,
    suggestMemory: true,
  },

  // ── better-sqlite3 build failures ──
  {
    pattern: /better-sqlite3.*(?:failed|error|build)/i,
    errorType: 'better-sqlite3 构建失败',
    possibleCauses: [
      '缺少 C++ 构建工具（Windows 上最常见）',
      'Node.js 版本过高或过低',
      'Electron 版本与 better-sqlite3 版本不兼容',
      '缺少 Python 环境',
    ],
    fixSteps: [
      '安装 Visual Studio Build Tools 2022（含 C++ 工作负载）和 Python 3.x',
      '运行 npx electron-rebuild -f -w better-sqlite3',
      '考虑使用 JSON 文件存储作为替代方案（lightweight-database 或 lowdb）',
      '确认 better-sqlite3 版本兼容当前 Node.js 版本',
    ],
    suggestedCommands: [
      'npm install -g node-gyp',
      'npx electron-rebuild -f -w better-sqlite3',
      'npm install better-sqlite3@latest',
      // Alternative
      'npm install lowdb  # JSON-based alternative',
    ],
    fixPrompt: `better-sqlite3 在 Windows 上构建失败。这是一个常见问题。

解决方案：
1. 安装构建工具（Visual Studio Build Tools + Python）
2. 使用 electron-rebuild 重新编译
3. 如果仍然失败，建议使用 JSON 文件存储替代方案：
   - lowdb: 轻量 JSON 数据库
   - electron-store: Electron 简单的持久化存储
   - 直接使用 fs 读写 JSON 文件

请帮助用户选择并实现替代方案。`,
    suggestMemory: true,
  },

  // ── Chinese character path issues ──
  {
    pattern: /[一-鿿].*(?:path|file|folder|directory).*(?:error|invalid|failed|cannot)/i,
    errorType: '路径包含中文字符导致的问题',
    possibleCauses: [
      '当前用户名包含中文字符（Windows 用户目录路径）',
      '项目路径中包含中文字符',
      '某些工具/库不支持 Unicode 路径',
      '编码问题导致路径解析错误',
    ],
    fixSteps: [
      '将项目移动到不含中文的纯英文路径（如 D:\\projects\\）',
      '避免在用户目录（C:\\Users\\中文名\\）下创建项目',
      '在系统环境变量中设置编码为 UTF-8',
      '检查工具的文档确认 Unicode 路径支持情况',
    ],
    suggestedCommands: [
      'chcp 65001  # 设置控制台为 UTF-8',
      'set PYTHONUTF8=1  # Python UTF-8 模式',
      // Moving project is recommended
    ],
    fixPrompt: `项目路径中包含中文字符，导致工具报错。

建议：
1. 将项目移到纯英文路径（如 D:\\projects\\...）
2. 确保系统区域设置支持 UTF-8
3. 如果无法移动路径，设置相关环境变量：
   - chcp 65001
   - $env:PYTHONUTF8=1

请帮助用户迁移项目到安全路径或配置编码支持。`,
    suggestMemory: true,
  },

  // ── electron-builder icon errors ──
  {
    pattern: /electron-builder.*(?:icon|ico|icns).*(?:error|invalid|failed)/i,
    errorType: 'electron-builder 图标错误',
    possibleCauses: [
      '图标文件格式不正确 — Windows 需要 .ico，macOS 需要 .icns',
      '图标尺寸不符合要求 — .ico 至少 256x256',
      '图标文件路径错误或文件不存在',
      '图标文件损坏',
    ],
    fixSteps: [
      '确认图标文件路径在 electron-builder 配置中正确',
      'Windows: 生成 .ico 文件（至少包含 256x256、48x48、32x32、16x16 尺寸）',
      'macOS: 生成 .icns 文件',
      '使用在线工具或 sharp/ImageMagick 转换图标格式',
    ],
    suggestedCommands: [
      'npx electron-icon-builder --input=assets/icon.png --output=assets/',
      // Verify icon
      'file assets/icon.ico (macOS/Linux)',
    ],
    fixPrompt: `electron-builder 报告图标错误。请帮助修复：

1. 确认图标文件路径是否正确
2. 检查 .ico 文件格式和尺寸（Windows 需要 256x256 或更大）
3. 如果图标缺失，使用工具从 PNG 生成 .ico
4. 提供 electron-icon-builder 的使用方法`,
    suggestMemory: false,
  },

  // ── PowerShell execution policy ──
  {
    pattern: /PowerShell.*execution policy|running scripts is disabled|PSSecurityException/i,
    errorType: 'PowerShell 执行策略限制',
    possibleCauses: [
      'PowerShell 执行策略为 Restricted（默认）',
      '脚本没有数字签名',
      '企业组策略限制了脚本执行',
    ],
    fixSteps: [
      '以管理员身份运行 PowerShell',
      '执行 Set-ExecutionPolicy RemoteSigned -Scope CurrentUser',
      '或者针对单个命令使用：powershell -ExecutionPolicy Bypass -File script.ps1',
      '在 package.json scripts 中使用 -ExecutionPolicy Bypass 前缀',
    ],
    suggestedCommands: [
      'Set-ExecutionPolicy RemoteSigned -Scope CurrentUser',
      'powershell -ExecutionPolicy Bypass -File script.ps1',
      'Get-ExecutionPolicy -List',
    ],
    fixPrompt: `PowerShell 执行策略阻止了脚本运行。

解决方法（按安全性从高到低）：
1. 仅对当前用户设置 RemoteSigned：
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
2. 对单个脚本使用 Bypass：
   powershell -ExecutionPolicy Bypass -File your-script.ps1
3. 在 package.json 的 npm scripts 中使用 Bypass 前缀

请选择最安全的方法帮助用户解决。`,
    suggestMemory: false,
  },

  // ── npm script missing ──
  {
    pattern: /npm.*(?:script|run).*missing|npm ERR! Missing script/i,
    errorType: 'npm 脚本缺失',
    possibleCauses: [
      'package.json 中没有定义该脚本',
      '脚本名称拼写错误',
      '在错误的目录中运行了命令',
      'package.json 文件损坏',
    ],
    fixSteps: [
      '检查 package.json 的 scripts 字段',
      '确认脚本名称拼写正确',
      '确认当前工作目录正确（包含 package.json 的目录）',
      '如果脚本确实缺失，在 package.json 中添加对应脚本',
    ],
    suggestedCommands: [
      'npm run  # 列出所有可用脚本',
      'cat package.json | grep scripts (macOS/Linux)',
      'type package.json | findstr scripts (Windows)',
    ],
    fixPrompt: `npm 报告脚本缺失。请帮助用户：

1. 列出当前 package.json 中所有可用的脚本
2. 确认用户想运行的脚本名是否正确
3. 如果脚本确实缺失，帮助创建对应的脚本定义`,
    suggestMemory: false,
  },

  // ── tsconfig path errors ──
  {
    pattern: /(?:Cannot find|module).*(?:path|alias|@\/|\~\/).*(?:error|not found|resolve)/i,
    errorType: 'tsconfig 路径别名错误',
    possibleCauses: [
      'tsconfig.json 的 paths 配置与实际目录不匹配',
      'baseUrl 设置不正确',
      '构建工具（Vite/Webpack）的别名配置与 tsconfig 不一致',
      '使用了未配置的路径别名',
    ],
    fixSteps: [
      '检查 tsconfig.json 中的 compilerOptions.paths 和 baseUrl',
      '确保 Vite 的 resolve.alias 与 tsconfig paths 一致',
      '路径别名应以 /* 结尾以匹配子路径',
      '运行 tsc --traceResolution 查看模块解析过程',
    ],
    suggestedCommands: [
      'npx tsc --noEmit --traceResolution',
      'npx tsc --showConfig',
    ],
    fixPrompt: `TypeScript 无法解析路径别名（如 @/components/...）。

请检查：
1. tsconfig.json 中的 paths 配置
2. baseUrl 是否正确设置
3. Vite/Webpack 的 resolve.alias 是否与 tsconfig paths 一致

示例正确配置：
tsconfig.json:
  "baseUrl": ".",
  "paths": { "@/*": ["./src/*"] }

vite.config.ts:
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } }`,
    suggestMemory: false,
  },
];

// ── Public API ──

/**
 * Analyze a log text string and return a structured analysis result.
 * If no patterns match, returns a generic "unrecognized" result.
 */
export function analyzeLog(logText: string): LogAnalysisResult {
  if (!logText || logText.trim().length === 0) {
    return {
      errorType: '空日志',
      possibleCauses: ['日志内容为空'],
      fixSteps: ['请粘贴完整的错误日志后再试'],
      suggestedCommands: [],
      fixPrompt: '请提供完整的错误日志，以便我能帮助分析问题。',
      suggestMemory: false,
    };
  }

  // Find the first matching pattern
  const match = PATTERNS.find((p) => p.pattern.test(logText));

  if (!match) {
    return {
      errorType: '未识别的错误',
      possibleCauses: [
        '错误信息不完整或不在已知模式中',
        '可能是多个错误叠加导致的新问题',
        '可能是项目特定的自定义错误',
      ],
      fixSteps: [
        '仔细阅读完整的错误日志（包括堆栈跟踪）',
        '搜索错误消息中的关键词查找社区解决方案',
        '检查最近修改的代码，回退可疑的改动',
        '将完整错误日志提供给 AI 助手进行深度分析',
      ],
      suggestedCommands: [
        'npm run typecheck',
        'npm ls  # 检查依赖树',
      ],
      fixPrompt: `我遇到了以下错误，但无法匹配已知的错误模式。请帮我分析：

\`\`\`
${logText.slice(0, 2000)}
\`\`\`

请：
1. 逐行分析日志内容
2. 确定错误的根本原因
3. 提供具体的修复步骤
4. 给出可执行的命令`,
      suggestMemory: false,
    };
  }

  // Replace $1, $2 etc. in fixPrompt with captured groups
  const regexMatch = match.pattern.exec(logText);
  let fixPrompt = match.fixPrompt;
  if (regexMatch) {
    for (let i = 1; i < regexMatch.length; i++) {
      fixPrompt = fixPrompt.replace(`$${i}`, regexMatch[i] ?? '');
    }
  }

  return {
    errorType: match.errorType,
    possibleCauses: match.possibleCauses,
    fixSteps: match.fixSteps,
    suggestedCommands: match.suggestedCommands,
    fixPrompt,
    suggestMemory: match.suggestMemory,
  };
}

/**
 * Scan log text and return ALL matching pattern results (not just the first).
 */
export function analyzeLogAll(logText: string): LogAnalysisResult[] {
  if (!logText || logText.trim().length === 0) {
    return [
      {
        errorType: '空日志',
        possibleCauses: ['日志内容为空'],
        fixSteps: ['请粘贴完整的错误日志后再试'],
        suggestedCommands: [],
        fixPrompt: '请提供完整的错误日志。',
        suggestMemory: false,
      },
    ];
  }

  const results: LogAnalysisResult[] = [];

  for (const p of PATTERNS) {
    if (p.pattern.test(logText)) {
      const regexMatch = p.pattern.exec(logText);
      let fixPrompt = p.fixPrompt;
      if (regexMatch) {
        for (let i = 1; i < regexMatch.length; i++) {
          fixPrompt = fixPrompt.replace(`$${i}`, regexMatch[i] ?? '');
        }
      }

      results.push({
        errorType: p.errorType,
        possibleCauses: p.possibleCauses,
        fixSteps: p.fixSteps,
        suggestedCommands: p.suggestedCommands,
        fixPrompt,
        suggestMemory: p.suggestMemory,
      });
    }
  }

  if (results.length === 0) {
    results.push({
      errorType: '未识别的错误',
      possibleCauses: ['错误信息不在已知模式中'],
      fixSteps: ['检查完整日志', '搜索社区解决方案', '咨询 AI 助手'],
      suggestedCommands: [],
      fixPrompt: `请分析以下错误日志并给出修复方案：\n\n\`\`\`\n${logText.slice(0, 2000)}\n\`\`\``,
      suggestMemory: false,
    });
  }

  return results;
}
