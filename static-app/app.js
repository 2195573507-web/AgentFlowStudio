const STORAGE_KEY = 'agentflow.static.v1';
const APP_NAME = 'LocalAI Nexus';
const LANGUAGE_KEY = 'agentflow.language';
const THEME_KEY = 'agentflow.theme';
const REDACTED = '[REDACTED]';

const translations = {
  zh: {
    languageName: '中文',
    languageToggle: 'English',
    staticMode: '静态可交付模式',
    brandSubtitle: 'AI 项目编排中枢',
    export: '导出',
    dashboard: '仪表盘',
    projects: '项目管理',
    projectDetail: '项目详情',
    promptLab: '提示词实验室',
    logAnalyzer: '日志分析',
    safetyBox: '安全检查',
    sharedMemory: '共享记忆中心',
    skills: '技能管理',
    gitTimeline: 'Git 时间线',
    settings: '设置',
    interfacePreferences: '界面偏好',
    language: '语言',
    theme: '主题',
    light: '浅色',
    dark: '深色',
    system: '跟随系统',
    currentLanguage: '当前语言',
    currentTheme: '当前主题',
    injectMemory: '注入共享记忆',
    off: '不注入',
    minimal: '最小',
    balanced: '平衡',
    full: '完整',
    currentPageFailed: '当前页面加载失败',
    viewLogs: '查看日志',
    backDashboard: '返回仪表盘',
    retryHint: '当前页面遇到渲染错误，其他功能仍可继续使用。',
    searchMemory: '搜索记忆',
    archive: '归档',
    restore: '恢复',
    noMemories: '暂无共享记忆。请先新增记忆，或继续使用不注入模式。',
  },
  en: {
    languageName: 'English',
    languageToggle: '中文',
    staticMode: 'Static fallback',
    brandSubtitle: 'AI project orchestration hub',
    export: 'Export',
    dashboard: 'Dashboard',
    projects: 'Projects',
    projectDetail: 'Project Detail',
    promptLab: 'Prompt Lab',
    logAnalyzer: 'Log Analyzer',
    safetyBox: 'Safety Guard',
    sharedMemory: 'Shared Memory',
    skills: 'Skills',
    gitTimeline: 'Git Timeline',
    settings: 'Settings',
    interfacePreferences: 'Interface Preferences',
    language: 'Language',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    currentLanguage: 'Current language',
    currentTheme: 'Current theme',
    injectMemory: 'Inject Shared Memory',
    off: 'Off',
    minimal: 'Minimal',
    balanced: 'Balanced',
    full: 'Full',
    currentPageFailed: 'This page failed to load',
    viewLogs: 'View logs',
    backDashboard: 'Back to Dashboard',
    retryHint: 'This page hit a render error. The rest of the app is still available.',
    searchMemory: 'Search memories',
    archive: 'Archive',
    restore: 'Restore',
    noMemories: 'No shared memories yet. Add one first or keep injection off.',
  },
};

function getStoredLanguage() {
  return localStorage.getItem(LANGUAGE_KEY) === 'en' ? 'en' : 'zh';
}

function getStoredTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

function t(key) {
  const language = state?.language || getStoredLanguage();
  return translations[language]?.[key] || translations.zh[key] || key;
}

const secretPatterns = [
  /sk-[a-zA-Z0-9_\-]{16,}/g,
  /Bearer\s+([a-zA-Z0-9_\-\.=:+/]{8,})/gi,
  /authorization\s*[=:]\s*['"]?([^'"\s]{4,})['"]?/gi,
  /api[_-]?key\s*[=:]\s*['"]?([^'"\s]{4,})['"]?/gi,
  /password\s*[=:]\s*['"]?([^'"\s]{3,})['"]?/gi,
  /secret\s*[=:]\s*['"]?([^'"\s]{3,})['"]?/gi,
  /access[_-]?token\s*[=:]\s*['"]?([^'"\s]{3,})['"]?/gi,
  /refresh[_-]?token\s*[=:]\s*['"]?([^'"\s]{3,})['"]?/gi,
  /(?:^|[\s,{])token\s*[=:]\s*['"]?([^'"\s]{4,})['"]?/gi,
];

const sensitiveKeyPattern = /^(apiKey|api_key|API_KEY|authorization|token|password|secret|access_token|refresh_token)$/i;

function redactText(value) {
  let result = String(value ?? '');
  for (const pattern of secretPatterns) {
    pattern.lastIndex = 0;
    result = result.replace(pattern, (match, group) => {
      if (typeof group === 'string' && group.length > 0) {
        const index = match.indexOf(group);
        return index >= 0 ? `${match.slice(0, index)}${REDACTED}${match.slice(index + group.length)}` : REDACTED;
      }
      return REDACTED;
    });
  }
  return result;
}

function redactDeep(value, seen = new WeakMap(), keyHint = '') {
  if (typeof value === 'string') return sensitiveKeyPattern.test(keyHint) ? REDACTED : redactText(value);
  if (!value || typeof value !== 'object') return value;
  if (seen.has(value)) return '[Circular]';
  if (Array.isArray(value)) {
    const result = [];
    seen.set(value, result);
    value.forEach((item) => result.push(redactDeep(item, seen)));
    return result;
  }
  const result = {};
  seen.set(value, result);
  Object.entries(value).forEach(([key, child]) => {
    result[key] = sensitiveKeyPattern.test(key) ? REDACTED : redactDeep(child, seen, key);
  });
  return result;
}

const statusLabels = {
  active: '进行中',
  pending: '待确认',
  archived: '已归档',
  planning: '规划中',
  paused: '已暂停',
  done: '已完成',
  planned: '待执行',
  running: '运行中',
  success: '已完成',
  failed: '失败',
  todo: '待办',
  doing: '进行中',
  blocked: '受阻',
};

const riskLabels = {
  Safe: '安全',
  Low: '低风险',
  Medium: '中风险',
  High: '高风险',
  Critical: '严重风险',
};

const memoryTypeLabels = {
  decision: '决策',
  pattern: '模式',
  insight: '洞察',
  knowledge: '知识',
  issue_fix: '问题修复',
  security: '安全',
  git_summary: 'Git 摘要',
  log_analysis: '日志分析',
  safety_check: '安全检查',
};

const pageDefinitions = [
  { id: 'dashboard', labelKey: 'dashboard', icon: '▦', zhDescription: '项目总控台与运行概览', enDescription: 'Project dashboard and runtime overview' },
  { id: 'projects', labelKey: 'projects', icon: '□', zhDescription: '创建、查看和整理 AI 项目', enDescription: 'Create, inspect, and organize AI projects' },
  { id: 'project-detail', labelKey: 'projectDetail', icon: '◇', zhDescription: '计划、任务和开发 Prompt', enDescription: 'Plans, tasks, and development Prompt' },
  { id: 'prompt-lab', labelKey: 'promptLab', icon: '✦', zhDescription: '模板化生成 Prompt 并注入共享记忆', enDescription: 'Generate Prompt templates and inject Shared Memory' },
  { id: 'log-analyzer', labelKey: 'logAnalyzer', icon: '⌕', zhDescription: '识别错误类型、原因与修复步骤', enDescription: 'Classify logs and generate repair steps' },
  { id: 'safety-box', labelKey: 'safetyBox', icon: '◈', zhDescription: '检查命令风险等级和更安全替代命令', enDescription: 'Check shell command risk and safer alternatives' },
  { id: 'shared-memory', labelKey: 'sharedMemory', icon: '◎', zhDescription: '维护跨模型恢复上下文', enDescription: 'Maintain cross-model recovery context' },
  { id: 'skills', labelKey: 'skills', icon: '◇', zhDescription: '查看本地 agent 技能与工作流', enDescription: 'Browse local agent skills and workflows' },
  { id: 'git-timeline', labelKey: 'gitTimeline', icon: '⌁', zhDescription: '查看 Git 提交时间线和交付记录', enDescription: 'Review Git commit timeline and delivery notes' },
  { id: 'settings', labelKey: 'settings', icon: '⚙', zhDescription: 'AI 接口配置、本地数据和界面偏好', enDescription: 'API configuration, local data, and interface preferences' },
];

function pages() {
  const language = state?.language || getStoredLanguage();
  return pageDefinitions.map((page) => ({
    id: page.id,
    icon: page.icon,
    label: t(page.labelKey),
    description: language === 'en' ? page.enDescription : page.zhDescription,
  }));
}

const promptTemplates = [
  {
    id: 'feature',
    name: '功能开发 Prompt',
    template:
      '你是资深工程师。请为「{{project}}」实现「{{task}}」。\n\n要求：\n1. 阅读现有代码并遵循项目风格。\n2. 输出清晰的实现步骤。\n3. 完成后说明验证方式。',
  },
  {
    id: 'fix',
    name: '问题修复 Prompt',
    template:
      '请分析并修复以下问题：\n\n项目：{{project}}\n问题：{{task}}\n\n请定位根因、给出最小修复，并补充测试或验证步骤。',
  },
  {
    id: 'handoff',
    name: '跨模型交接 Prompt',
    template:
      '请接手 LocalAI Nexus 项目。\n\n当前目标：{{task}}\n\n请先读取项目上下文，再继续执行，不要重建项目，不要删除 Shared Memory。',
  },
];

function nowIso() {
  return new Date().toISOString();
}

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function defaultState() {
  return {
    language: getStoredLanguage(),
    theme: getStoredTheme(),
    memorySearch: '',
    activePage: 'dashboard',
    selectedProjectId: 'project-agentflow',
    settings: {
      providerName: 'OpenAI-compatible API',
      baseUrl: 'http://127.0.0.1:11434/v1',
      apiKey: '',
      modelName: 'gpt-4.1-mini',
      memoryEnabled: true,
      memoryInjectionMode: 'balanced',
      maxMemoryItems: 10,
      maxMemoryChars: 8000,
      defaultProjectPath: 'D:\\AgentFlowStudio',
    },
    projects: [
      {
        id: 'project-agentflow',
        name: 'LocalAI Nexus desktop launch polish',
        idea: '修复双击启动闪退，提供静态可交付模式，并完成中文界面。',
        platform: 'Windows Desktop / Static Web',
        techStack: 'Node.js, 静态 HTML, CSS, JavaScript, localStorage',
        uiStyle: 'Apple Flat UI + Linear 工作台',
        difficulty: 'Medium',
        status: 'active',
        updatedAt: nowIso(),
        createdAt: nowIso(),
        tasks: [
          { id: uid('task'), title: '修复 start-agentflow-static.bat 闪退', status: 'done' },
          { id: uid('task'), title: '生成 static-app 静态降级版', status: 'doing' },
          { id: uid('task'), title: '重建桌面快捷方式并验证 HTTP', status: 'todo' },
          { id: uid('task'), title: '更新 handoff 测试报告', status: 'blocked' },
        ],
        agentRuns: [
          {
            id: uid('run'),
            tool: 'Codex',
            status: 'success',
            summary: '建立静态 fallback 交付路径，保留本地优先和中文界面。',
            log: '记录启动脚本、静态页面和本机 localStorage 数据路径；未执行远程操作。',
            createdAt: nowIso(),
          },
        ],
      },
      {
        id: 'project-memory',
        name: '共享记忆中心增强',
        idea: '沉淀项目决策、错误修复和跨模型恢复上下文。',
        platform: 'Local first',
        techStack: 'localStorage, JSON, Prompt',
        uiStyle: '安静、清晰、面向重复工作',
        difficulty: 'Easy',
        status: 'planning',
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        tasks: [
          { id: uid('task'), title: '梳理记忆类型', status: 'todo' },
          { id: uid('task'), title: '生成恢复上下文 Prompt', status: 'todo' },
        ],
      },
    ],
    memories: [
      {
        id: 'memory-static',
        type: 'decision',
        title: '当前采用 Static fallback',
        content:
          'Electron / Vite 在当前环境可能受 esbuild spawn EPERM 限制，因此本轮交付优先使用纯 Node 静态服务器和 static-app。',
        tags: ['launcher', 'static', 'handoff'],
        importance: 5,
        status: 'active',
        providerScope: 'all',
        modelScope: 'all',
        lastUsedAt: nowIso(),
        createdAt: nowIso(),
      },
      {
        id: 'memory-localized',
        type: 'knowledge',
        title: '用户要求界面汉化',
        content:
          '用户明确要求网站 / 应用界面不能继续大面积英文。保留 LocalAI Nexus、Codex、Claude Code、Cursor、API、Prompt、Git 等专有名词，但要放在中文上下文中。',
        tags: ['localization', 'zh-CN'],
        importance: 5,
        status: 'active',
        providerScope: 'all',
        modelScope: 'all',
        lastUsedAt: nowIso(),
        createdAt: nowIso(),
      },
    ],
    prompts: [],
    riskChecks: [],
    logAnalyses: [],
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const base = defaultState();
    if (!raw) return base;
    return { ...base, ...JSON.parse(raw), language: getStoredLanguage(), theme: getStoredTheme() };
  } catch (error) {
    console.error('Static state load error:', error);
    return defaultState();
  }
}

let state = loadState();

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(redactDeep(state)));
  localStorage.setItem(LANGUAGE_KEY, state.language || 'zh');
  localStorage.setItem(THEME_KEY, state.theme || 'system');
}

function setTheme(theme) {
  const nextTheme = theme === 'dark' || theme === 'light' || theme === 'system' ? theme : 'system';
  state.theme = nextTheme;
  localStorage.setItem(THEME_KEY, nextTheme);
  applyTheme();
  saveState();
}

function resolvedTheme() {
  if (state.theme === 'system') {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return state.theme || 'light';
}

function applyTheme() {
  document.documentElement.dataset.themePreference = state.theme || 'system';
  document.documentElement.dataset.theme = resolvedTheme();
}

function setLanguage(language) {
  state.language = language === 'en' ? 'en' : 'zh';
  localStorage.setItem(LANGUAGE_KEY, state.language);
  document.documentElement.lang = state.language === 'zh' ? 'zh-CN' : 'en';
  saveState();
}

function nextThemeLabel() {
  if (state.theme === 'system') return `${t('system')} / System`;
  if (state.theme === 'dark') return `${t('light')} / Light`;
  return `${t('dark')} / Dark`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(value) {
  if (!value) return '未知';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '未知' : date.toLocaleString('zh-CN', { hour12: false });
}

function selectedProject() {
  return state.projects.find((project) => project.id === state.selectedProjectId) || state.projects[0];
}

function toast(message) {
  const old = document.querySelector('.toast');
  if (old) old.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  document.body.appendChild(el);
  window.setTimeout(() => el.remove(), 2600);
}

function copyText(text, label = '内容') {
  navigator.clipboard
    ?.writeText(text)
    .then(() => toast(`${label}已复制`))
    .catch(() => {
      const box = document.createElement('textarea');
      box.value = text;
      document.body.appendChild(box);
      box.select();
      document.execCommand('copy');
      box.remove();
      toast(`${label}已复制`);
    });
}

function navigate(pageId) {
  state.activePage = pageId;
  saveState();
  render();
}

function statusBadge(status) {
  return `<span class="status-pill">${statusLabels[status] || status}</span>`;
}

function riskBadge(level) {
  const cls = {
    Safe: 'risk-safe',
    Low: 'risk-low',
    Medium: 'risk-medium',
    High: 'risk-high',
    Critical: 'risk-critical',
  }[level] || 'risk-low';
  return `<span class="risk-pill ${cls}">${riskLabels[level] || level}</span>`;
}

function field(name, label, value = '', type = 'text', placeholder = '') {
  return `
    <div class="field">
      <label for="${name}">${label}</label>
      <input id="${name}" name="${name}" type="${type}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" />
    </div>
  `;
}

function textarea(name, label, value = '', placeholder = '') {
  return `
    <div class="field">
      <label for="${name}">${label}</label>
      <textarea id="${name}" name="${name}" placeholder="${escapeHtml(placeholder)}">${escapeHtml(value)}</textarea>
    </div>
  `;
}

function select(name, label, value, options) {
  return `
    <div class="field">
      <label for="${name}">${label}</label>
      <select id="${name}" name="${name}">
        ${options
          .map(
            (option) =>
              `<option value="${escapeHtml(option.value)}" ${option.value === value ? 'selected' : ''}>${escapeHtml(option.label)}</option>`,
          )
          .join('')}
      </select>
    </div>
  `;
}

function shell(content) {
  const pageList = pages();
  const page = pageList.find((item) => item.id === state.activePage) || pageList[0];
  return `
    <div class="layout">
      <aside class="sidebar">
        <div class="brand">
          <img src="/assets/localai-nexus.svg" alt="LocalAI Nexus icon" />
          <div>
            <p class="brand-title">${APP_NAME}</p>
            <p class="brand-subtitle">${escapeHtml(t('brandSubtitle'))}</p>
          </div>
        </div>
        <nav class="nav" aria-label="主导航">
          ${pageList
            .map(
              (item) => `
                <button type="button" class="${item.id === state.activePage ? 'active' : ''}" data-page="${item.id}" title="${escapeHtml(item.label)}">
                  <span class="nav-icon">${item.icon}</span>
                  <span>${item.label}</span>
                </button>
              `,
            )
            .join('')}
        </nav>
        <div class="sidebar-footer">
          <strong>${escapeHtml(t('staticMode'))}</strong><br />
          ${state.language === 'en' ? 'Pure Node static server. No Vite, Electron, or esbuild required. Data is stored in localStorage.' : '纯 Node 静态服务，无需 Vite、Electron 或 esbuild。数据保存在 localStorage。'}
        </div>
      </aside>
      <main class="main">
        <header class="topbar">
          <div>
            <h1>${escapeHtml(page.label)}</h1>
            <p>${escapeHtml(page.description)}</p>
          </div>
          <div class="topbar-actions">
            <span class="mode-pill">${escapeHtml(t('staticMode'))}</span>
            <button class="btn ghost small" type="button" data-action="toggle-language">${escapeHtml(t('languageToggle'))}</button>
            <button class="btn ghost small" type="button" data-action="cycle-theme">${escapeHtml(nextThemeLabel())}</button>
            <button class="btn ghost small" type="button" data-action="export-data">${escapeHtml(t('export'))}</button>
          </div>
        </header>
        ${content}
      </main>
    </div>
  `;
}

function renderDashboard() {
  const totalTasks = state.projects.reduce((sum, project) => sum + (project.tasks?.length || 0), 0);
  const activeProject = selectedProject();
  const riskCount = state.riskChecks.length;
  const hasProjects = state.projects.length > 0;
  const hasTasks = totalTasks > 0;
  const hasPrompts = state.prompts.length > 0;
  const hasSafety = riskCount > 0;
  const hasMemories = state.memories.length > 0;
  const workflowSteps = [
    { label: 'Idea', title: '记录想法', done: hasProjects, page: 'projects' },
    { label: 'Plan', title: '生成规划', done: hasTasks, page: 'project-detail' },
    { label: 'Tasks', title: '拆成任务', done: hasTasks, page: 'project-detail' },
    { label: 'Prompt', title: '生成 Prompt', done: hasPrompts, page: 'prompt-lab' },
    { label: 'Safety', title: '检查命令', done: hasSafety, page: 'safety-box' },
    { label: 'Logs', title: '分析结果', done: false, page: 'log-analyzer' },
    { label: 'Memory', title: '沉淀记忆', done: hasMemories, page: 'shared-memory' },
    { label: 'Handoff', title: '交接恢复', done: hasMemories && hasPrompts, page: 'shared-memory' },
  ];
  const nextStep = workflowSteps.find((step) => !step.done) || workflowSteps[workflowSteps.length - 1];
  const nextStepCopy = !hasProjects
    ? '先创建一个项目，把目标、约束和技术栈写清楚。'
    : !hasTasks
      ? '进入项目详情，把想法拆成可交给 AI 的任务。'
      : !hasPrompts
        ? '打开 Prompt Lab，把任务变成可复制给 Codex / Claude Code / Cursor 的执行提示词。'
        : !hasSafety
          ? '运行前先把命令放进安全检查，避免误删文件或泄露密钥。'
          : !hasMemories
            ? '把关键决策和修复结果保存到共享记忆，方便下一轮恢复上下文。'
            : '复制恢复上下文，准备进入下一轮验证和交接。';
  return shell(`
    <section class="panel">
      <div class="next-action">
        <div>
          <span class="tag">下一步</span>
          <h2>${escapeHtml(nextStep.title)}</h2>
          <p class="muted">${escapeHtml(nextStepCopy)}</p>
        </div>
        <button class="btn primary" type="button" data-page="${nextStep.page}">继续到 ${escapeHtml(nextStep.title)}</button>
      </div>
      <div class="workflow-rail" aria-label="AI 协作生命周期">
        ${workflowSteps
          .map(
            (step) => `
              <button class="workflow-step ${step.done ? 'done' : ''}" type="button" data-page="${step.page}" aria-label="${escapeHtml(step.title)}${step.done ? '，已完成' : '，待处理'}">
                <span class="workflow-mark">${step.done ? '✓' : ''}</span>
                <div class="workflow-label">${escapeHtml(step.label)}</div>
                <div class="workflow-title">${escapeHtml(step.title)}</div>
              </button>
            `,
          )
          .join('')}
      </div>
    </section>

    <section class="grid stats-grid">
      <div class="stat-card"><div class="stat-label">项目总数</div><div class="stat-value">${state.projects.length}</div><div class="stat-note">当前项目管理池</div></div>
      <div class="stat-card"><div class="stat-label">任务总数</div><div class="stat-value">${totalTasks}</div><div class="stat-note">待办、进行中、受阻、已完成</div></div>
      <div class="stat-card"><div class="stat-label">提示词数量</div><div class="stat-value">${state.prompts.length}</div><div class="stat-note">Prompt Lab 生成结果</div></div>
      <div class="stat-card"><div class="stat-label">风险检查</div><div class="stat-value">${riskCount}</div><div class="stat-note">命令安全扫描记录</div></div>
      <div class="stat-card"><div class="stat-label">共享记忆</div><div class="stat-value">${state.memories.length}</div><div class="stat-note">跨模型恢复上下文素材</div></div>
    </section>

    <section class="grid two-col" style="margin-top:16px">
      <div class="panel">
        <div class="section-title">
          <div><h2>项目总控台</h2><p>核心入口保持可用，先从一个项目进入可验证的 AI 协作闭环。</p></div>
        </div>
        <div class="row">
          <button class="btn primary" type="button" data-page="projects">新建项目</button>
          <button class="btn" type="button" data-page="prompt-lab">生成 Prompt</button>
          <button class="btn" type="button" data-page="log-analyzer">分析日志</button>
          <button class="btn" type="button" data-page="safety-box">检查风险</button>
          <button class="btn" type="button" data-page="shared-memory">生成跨模型恢复上下文</button>
        </div>
      </div>
      <div class="panel">
        <div class="section-title">
          <div><h2>当前项目</h2><p>${escapeHtml(activeProject?.name || '暂无项目')}</p></div>
          ${activeProject ? statusBadge(activeProject.status) : ''}
        </div>
        <p class="muted">${escapeHtml(activeProject?.idea || '请先创建项目。')}</p>
      </div>
    </section>

    <section class="grid two-col" style="margin-top:16px">
      <div class="panel">
        <div class="section-title"><h2>最近项目</h2><button class="btn small" type="button" data-page="projects">项目管理</button></div>
        <div class="stack">
          ${state.projects
            .slice()
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, 4)
            .map(
              (project) => `
                <article class="item-card">
                  <div class="spread">
                    <div>
                      <h3>${escapeHtml(project.name)}</h3>
                      <p>${escapeHtml(project.idea)}</p>
                    </div>
                    ${statusBadge(project.status)}
                  </div>
                </article>
              `,
            )
            .join('')}
        </div>
      </div>
      <div class="panel">
        <div class="section-title"><h2>快捷操作</h2><span class="tag">localStorage 已启用</span></div>
        <div class="stack">
          <button class="btn" type="button" data-page="project-detail">查看项目详情</button>
          <button class="btn" type="button" data-page="shared-memory">新增记忆</button>
          <button class="btn" type="button" data-action="reset-demo">重置演示数据</button>
        </div>
      </div>
    </section>
  `);
}

function renderProjects() {
  return shell(`
    <section class="grid two-col">
      <div class="panel">
        <div class="section-title"><h2>新建项目</h2><span class="tag">保存到 localStorage</span></div>
        <form class="grid" data-form="project">
          ${field('name', '项目名称', '', 'text', '例如：LocalAI Nexus 修复任务')}
          ${textarea('idea', '项目想法', '', '描述目标、约束和交付物')}
          <div class="grid three-col">
            ${field('platform', '平台', 'Static Web')}
            ${field('techStack', '技术栈', 'Node.js, HTML, CSS, JavaScript')}
            ${select('difficulty', '难度', 'Medium', [
              { value: 'Easy', label: '简单' },
              { value: 'Medium', label: '中等' },
              { value: 'Hard', label: '困难' },
            ])}
          </div>
          <button class="btn primary" type="submit">新建项目</button>
        </form>
      </div>
      <div class="panel">
        <div class="section-title"><h2>项目列表</h2><span class="tag">${state.projects.length} 个项目</span></div>
        <div class="stack">
          ${state.projects
            .map(
              (project) => `
                <article class="item-card">
                  <div class="spread">
                    <div>
                      <h3>${escapeHtml(project.name)}</h3>
                      <p>${escapeHtml(project.idea)}</p>
                      <div class="row">
                        <span class="tag">${escapeHtml(project.platform)}</span>
                        <span class="tag">${escapeHtml(project.techStack)}</span>
                      </div>
                    </div>
                    <div class="stack">
                      ${statusBadge(project.status)}
                      <button class="btn small" type="button" data-select-project="${project.id}">查看详情</button>
                      <button class="btn danger small" type="button" data-delete-project="${project.id}">删除</button>
                    </div>
                  </div>
                </article>
              `,
            )
            .join('')}
        </div>
      </div>
    </section>
  `);
}

function renderProjectDetail() {
  const project = selectedProject();
  if (!project) {
    return shell('<div class="empty">暂无项目，请先进入项目管理新建项目。</div>');
  }
  const columns = [
    ['todo', '待办'],
    ['doing', '进行中'],
    ['blocked', '受阻'],
    ['done', '已完成'],
  ];
  const runStatuses = [
    ['planned', '待执行'],
    ['running', '运行中'],
    ['success', '已完成'],
    ['failed', '失败'],
    ['blocked', '受阻'],
  ];
  const recentRuns = [...(project.agentRuns || [])]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 6);
  return shell(`
    <section class="grid two-col">
      <div class="panel">
        <div class="section-title">
          <div><h2>${escapeHtml(project.name)}</h2><p>${escapeHtml(project.idea)}</p></div>
          ${statusBadge(project.status)}
        </div>
        <div class="grid three-col">
          <div class="stat-card"><div class="stat-label">平台</div><div class="stat-note">${escapeHtml(project.platform)}</div></div>
          <div class="stat-card"><div class="stat-label">技术栈</div><div class="stat-note">${escapeHtml(project.techStack)}</div></div>
          <div class="stat-card"><div class="stat-label">更新时间</div><div class="stat-note">${formatDate(project.updatedAt)}</div></div>
        </div>
      </div>
      <div class="panel">
        <div class="section-title"><h2>新增任务</h2><span class="tag">项目详情</span></div>
        <form class="row" data-form="task">
          <div class="field" style="flex:1;min-width:220px">
            <label for="taskTitle">任务标题</label>
            <input id="taskTitle" name="taskTitle" placeholder="例如：修复桌面快捷方式" />
          </div>
          ${select('taskStatus', '状态', 'todo', columns.map(([value, label]) => ({ value, label })))}
          <button class="btn primary" type="submit">保存</button>
        </form>
      </div>
    </section>
    <section class="panel" style="margin-top:16px">
      <div class="section-title">
        <div><h2>任务看板</h2><p>基础看板保留待办、进行中、受阻、已完成状态。</p></div>
      </div>
      <div class="kanban">
        ${columns
          .map(
            ([status, label]) => `
              <div class="kanban-col">
                <div class="kanban-title">${label}</div>
                ${(project.tasks || [])
                  .filter((task) => task.status === status)
                  .map((task) => `<div class="task">${escapeHtml(task.title)}</div>`)
                  .join('') || '<div class="empty">暂无任务</div>'}
              </div>
            `,
          )
          .join('')}
      </div>
    </section>
    <section class="panel" style="margin-top:16px">
      <div class="section-title">
        <div><h2>开发 Prompt</h2><p>可复制给 Codex、Claude Code 或 Cursor 继续处理。</p></div>
        <button class="btn small" type="button" data-copy-project-prompt>复制</button>
      </div>
      <pre class="output">${escapeHtml(projectPrompt(project))}</pre>
    </section>
    <section class="grid two-col" style="margin-top:16px">
      <div class="panel">
        <div class="section-title">
          <div><h2>Agent 运行记录</h2><p>只记录本地协作过程，不执行命令，不上传数据。</p></div>
          <span class="tag">${recentRuns.length} 条最近记录</span>
        </div>
        <form class="grid" data-form="agent-run">
          <div class="grid two-col compact-fields">
            ${field('runTool', '工具 / Agent', '', 'text', '例如：Codex、Claude Code、Cursor')}
            ${select('runStatus', '状态', 'success', runStatuses.map(([value, label]) => ({ value, label })))}
          </div>
          ${field('runSummary', '摘要', '', 'text', '例如：完成静态详情页记录面板')}
          <div class="field">
            <label for="runLog">日志 / 备注</label>
            <textarea id="runLog" name="runLog" placeholder="粘贴关键日志、验证结果或接手说明。敏感信息会按现有规则脱敏。"></textarea>
          </div>
          <div class="row">
            <button class="btn primary" type="submit">保存运行记录</button>
            <span class="subtle">保存到当前浏览器 localStorage。</span>
          </div>
        </form>
      </div>
      <div class="panel">
        <div class="section-title"><h2>最近运行</h2><span class="tag">Local only</span></div>
        <div class="run-list">
          ${recentRuns
            .map(
              (run) => `
                <article class="run-card">
                  <div class="spread">
                    <div>
                      <h3>${escapeHtml(run.tool || '未命名 Agent')}</h3>
                      <p>${escapeHtml(run.summary || '暂无摘要')}</p>
                    </div>
                    ${statusBadge(run.status || 'success')}
                  </div>
                  ${run.log ? `<pre>${escapeHtml(run.log)}</pre>` : ''}
                  <div class="subtle">${formatDate(run.createdAt)}</div>
                </article>
              `,
            )
            .join('') || '<div class="empty">暂无运行记录</div>'}
        </div>
      </div>
    </section>
  `);
}

function projectPrompt(project) {
  return redactText(`# LocalAI Nexus 项目详情 Prompt

项目：${project.name}
目标：${project.idea}
平台：${project.platform}
技术栈：${project.techStack}

请继续完成该项目，遵循本地优先、中文界面、Shared Memory 不可移除的约束。`);
}

function fillPrompt(template, values) {
  return template
    .replaceAll('{{project}}', values.project || APP_NAME)
    .replaceAll('{{task}}', values.task || '继续完成当前修复任务');
}

function memoryContext() {
  if (state.settings.memoryInjectionMode === 'off') return '';
  const active = redactDeep(state.memories.filter((memory) => memory.status === 'active'));
  const limit = state.settings.memoryInjectionMode === 'minimal' ? 3 : state.settings.memoryInjectionMode === 'full' ? 20 : 8;
  const selected = active.slice(0, limit);
  const language = state.language || 'zh';
  const labels =
    language === 'en'
      ? ['Project background', 'Decisions', 'Current progress', 'Known issues', 'User preferences', 'API Provider notes']
      : ['项目背景', '已做决策', '当前进度', '已知问题', '用户偏好', 'API Provider 注意事项'];
  const colon = language === 'en' ? ':' : '：';
  const buckets = {
    0: ['project_context', 'knowledge', 'environment'],
    1: ['decision', 'pattern'],
    2: ['git_summary', 'log_analysis', 'prompt_pattern'],
    3: ['issue_fix', 'security', 'safety_check'],
    4: ['user_preference', 'insight'],
    5: ['api_provider'],
  };
  const lines = ['[Shared Memory Context]'];
  labels.forEach((label, index) => {
    const items = selected.filter((memory) => buckets[index].includes(memory.type));
    lines.push(`- ${label}${colon}`);
    if (!items.length) {
      lines.push(`  - ${language === 'en' ? 'No records yet' : '暂无记录'}`);
      return;
    }
    items.forEach((memory) => {
      const tags = memory.tags?.length ? ` [${memory.tags.slice(0, 3).map(redactText).join(', ')}]` : '';
      lines.push(`  - ${redactText(memory.title)}${tags}: ${redactText(memory.content)}`);
    });
  });
  lines.push('[/Shared Memory Context]');
  return lines.join('\n');
}

function renderPromptLab() {
  const project = selectedProject();
  return shell(`
    <section class="grid two-col">
      <div class="panel">
        <div class="section-title"><h2>提示词模板</h2><span class="tag">Prompt Template</span></div>
        <form class="grid" data-form="prompt">
          ${select(
            'templateId',
            '提示词模板',
            'feature',
            promptTemplates.map((template) => ({ value: template.id, label: template.name })),
          )}
          ${field('project', '变量：项目', project?.name || APP_NAME)}
          ${textarea('task', '变量：任务', '修复静态启动链路并完成中文界面', '填写本次要交给 AI 的任务')}
          ${select('memoryMode', `${t('injectMemory')} / Inject Shared Memory`, state.settings.memoryInjectionMode, [
            { value: 'off', label: t('off') },
            { value: 'minimal', label: t('minimal') },
            { value: 'balanced', label: t('balanced') },
            { value: 'full', label: t('full') },
          ])}
          <button class="btn primary" type="submit">生成</button>
        </form>
      </div>
      <div class="panel">
        <div class="section-title">
          <div><h2>生成结果</h2><p>Generated Prompt</p></div>
          <button class="btn small" type="button" data-copy-last-prompt>复制</button>
        </div>
        <pre class="output">${escapeHtml(state.lastPrompt || '请填写变量后点击“生成”。')}</pre>
      </div>
    </section>
    <section class="panel" style="margin-top:16px">
      <div class="section-title"><h2>最近提示词</h2><span class="tag">${state.prompts.length} 条</span></div>
      <div class="stack">
        ${state.prompts
          .slice(0, 5)
          .map(
            (prompt) => `
              <article class="item-card">
                <div class="spread">
                  <div>
                    <h3>${escapeHtml(prompt.title)}</h3>
                    <p>${escapeHtml(prompt.content.slice(0, 130))}...</p>
                  </div>
                  <button class="btn small" type="button" data-copy-prompt="${prompt.id}">复制</button>
                </div>
              </article>
            `,
          )
          .join('') || '<div class="empty">暂无已保存的 Prompt。</div>'}
      </div>
    </section>
  `);
}

function analyzeLog(text) {
  const lower = text.toLowerCase();
  if (!text.trim()) {
    return {
      type: '空日志',
      cause: '尚未输入日志内容。',
      steps: ['粘贴控制台、构建或启动日志。', '点击“分析”。'],
      command: 'npm.cmd run test:launch-static',
      prompt: '请先提供完整日志。',
    };
  }
  if (lower.includes('eaddrinuse') || text.includes('端口')) {
    return {
      type: '端口占用',
      cause: '目标端口已有进程监听，旧服务器未关闭或其他应用占用。',
      steps: ['查看 static-server.log 中的实际端口。', '让服务器自动切换到 4174-4177。', '浏览器访问日志中的服务地址。'],
      command: 'netstat -ano | findstr :4173',
      prompt: `请帮我处理端口占用问题，并确保服务自动切换端口：\n\n${text}`,
    };
  }
  if (lower.includes('eperm') && lower.includes('esbuild')) {
    return {
      type: 'esbuild EPERM',
      cause: '当前环境限制 Vite/Vitest 启动 esbuild 子进程。',
      steps: ['不要继续死磕 Vite build。', '使用 Static fallback 验证真实可用入口。', '在普通 Windows 终端后续复测 Electron。'],
      command: 'npm.cmd run test:launch-static',
      prompt: `当前环境出现 esbuild EPERM，请改用静态交付链路并记录限制：\n\n${text}`,
    };
  }
  if (lower.includes('not found') || text.includes('未找到')) {
    return {
      type: '文件缺失',
      cause: '启动脚本或静态资源路径缺失。',
      steps: ['确认 start-agentflow-static.bat 存在。', '确认 scripts/static-server.js 存在。', '确认 static-app/index.html 存在。'],
      command: 'npm.cmd run smoke',
      prompt: `请定位缺失文件并修复静态启动链路：\n\n${text}`,
    };
  }
  return {
    type: '一般运行错误',
    cause: '日志未命中特定规则，需要结合上下文进一步判断。',
    steps: ['保留完整日志。', '检查 launcher-static.log 与 static-server.log。', '先运行 test:launch-static 复现。'],
    command: 'npm.cmd run test:launch-static',
    prompt: `请分析以下日志，找出可能原因并给出修复步骤：\n\n${text}`,
  };
}

function renderLogAnalyzer() {
  const latest = state.lastLogAnalysis;
  return shell(`
    <section class="grid two-col">
      <div class="panel">
        <div class="section-title"><h2>日志分析</h2><span class="tag">Log Analyzer</span></div>
        <form class="grid" data-form="log">
          ${textarea('logText', '日志内容', state.lastLogInput || '', '粘贴启动、构建、测试或浏览器控制台日志')}
          <button class="btn primary" type="submit">分析</button>
        </form>
      </div>
      <div class="panel">
        <div class="section-title">
          <div><h2>分析结果</h2><p>错误类型、可能原因、修复步骤、建议命令。</p></div>
          <button class="btn small" type="button" data-copy-fix-prompt>生成修复提示词</button>
        </div>
        ${
          latest
            ? `
              <div class="stack">
                <div class="item-card"><h3>错误类型</h3><p>${escapeHtml(latest.type)}</p></div>
                <div class="item-card"><h3>可能原因</h3><p>${escapeHtml(latest.cause)}</p></div>
                <div class="item-card"><h3>修复步骤</h3><p>${latest.steps.map((step, index) => `${index + 1}. ${escapeHtml(step)}`).join('<br />')}</p></div>
                <div class="item-card"><h3>建议命令</h3><p><code>${escapeHtml(latest.command)}</code></p></div>
                <pre class="output">${escapeHtml(latest.prompt)}</pre>
              </div>
            `
            : '<div class="empty">等待日志输入。</div>'
        }
      </div>
    </section>
  `);
}

function checkRisk(command) {
  const rules = [
    { pattern: /rm\s+-rf|Remove-Item.+-Recurse|del\s+\/s/i, level: 'Critical', rule: '递归删除', safer: '先列出目标路径并确认范围，再使用备份或移动到临时目录。' },
    { pattern: /git\s+reset\s+--hard|git\s+clean\s+-fd/i, level: 'High', rule: '破坏性 Git 操作', safer: '先运行 git status 和 git diff，必要时创建备份分支。' },
    { pattern: /Invoke-WebRequest|curl|wget/i, level: 'Medium', rule: '网络下载', safer: '确认来源可信，下载到临时目录并校验内容。' },
    { pattern: /npm\s+install|npm\.cmd\s+install/i, level: 'Low', rule: '依赖变更', safer: '检查 package-lock.json 变化并运行 smoke。' },
  ];
  const matched = rules.filter((rule) => rule.pattern.test(command));
  const level = matched[0]?.level || 'Safe';
  return {
    id: uid('risk'),
    command,
    level,
    matchedRules: matched.map((rule) => rule.rule),
    saferAlternative: matched[0]?.safer || '命令未命中高风险规则，仍建议确认工作目录后执行。',
    backupRecommended: ['High', 'Critical'].includes(level),
    sandboxRecommended: level !== 'Safe',
    createdAt: nowIso(),
  };
}

function renderSafetyBox() {
  const result = state.lastRiskCheck;
  return shell(`
    <section class="grid two-col">
      <div class="panel">
        <div class="section-title"><h2>安全检查</h2><span class="tag">Safety Guard</span></div>
        <form class="grid" data-form="risk">
          ${textarea('command', '待检查命令', state.lastCommand || 'npm.cmd run test:launch-static', '粘贴将要执行的 shell 命令')}
          <button class="btn primary" type="submit">检查风险</button>
        </form>
      </div>
      <div class="panel">
        <div class="section-title"><h2>风险结果</h2>${result ? riskBadge(result.level) : ''}</div>
        ${
          result
            ? `
              <div class="stack">
                <div class="item-card"><h3>风险等级</h3><p>${riskLabels[result.level]}</p></div>
                <div class="item-card"><h3>命中规则</h3><p>${result.matchedRules.length ? result.matchedRules.map(escapeHtml).join('、') : '未命中危险规则'}</p></div>
                <div class="item-card"><h3>更安全替代命令</h3><p>${escapeHtml(result.saferAlternative)}</p></div>
                <div class="item-card"><h3>建议备份</h3><p>${result.backupRecommended ? '建议备份' : '通常无需额外备份'}</p></div>
                <div class="item-card"><h3>建议隔离运行</h3><p>${result.sandboxRecommended ? '建议在沙箱中运行' : '可在确认目录后运行'}</p></div>
              </div>
            `
            : '<div class="empty">输入命令后点击“检查风险”。</div>'
        }
      </div>
    </section>
  `);
}

function renderSkills() {
  return shell(`
    <section class="grid two-col">
      <div class="panel">
        <div class="section-title"><h2>${escapeHtml(t('skills'))}</h2><span class="tag">Skills</span></div>
        <div class="stack">
          <article class="item-card"><h3>product-planner</h3><p>生成 PRD、架构、任务拆解和验收标准。</p></article>
          <article class="item-card"><h3>test-runner</h3><p>运行测试、分析失败并更新测试报告。</p></article>
          <article class="item-card"><h3>ui-polisher</h3><p>检查界面质量、响应式表现和深浅色兼容性。</p></article>
        </div>
      </div>
      <div class="panel">
        <div class="section-title"><h2>Agent 工作流</h2><span class="tag">Codex / Claude Code / Cursor</span></div>
        <p class="muted">Static fallback 保留技能管理入口，用于记录本地 agent skill 的用途和下一轮接手上下文。</p>
      </div>
    </section>
  `);
}

function renderGitTimeline() {
  return shell(`
    <section class="grid two-col">
      <div class="panel">
        <div class="section-title"><h2>${escapeHtml(t('gitTimeline'))}</h2><span class="tag">Git Timeline</span></div>
        <div class="stack">
          <article class="item-card"><h3>cec7dfb</h3><p>fix: stabilize localized static launcher</p></article>
          <article class="item-card"><h3>本轮质量加固</h3><p>中英切换、主题偏好、Shared Memory Prompt 注入、递归脱敏和错误边界。</p></article>
        </div>
      </div>
      <div class="panel">
        <div class="section-title"><h2>当前分支</h2><span class="tag">codex-static-quality-pass</span></div>
        <p class="muted">Git 时间线在 Static fallback 中展示关键交付节点；完整 Git 操作仍由本地仓库和 Electron 版本承担。</p>
      </div>
    </section>
  `);
}

function recoveryPrompt() {
  const project = selectedProject();
  return redactText(`# LocalAI Nexus 跨模型恢复上下文 Prompt

项目名：${project?.name || APP_NAME}

当前方案：Static fallback
可用启动方式：D:\\AgentFlowStudio\\start-agentflow-static.bat
已知限制：Electron / Vite / Vitest 在当前环境可能受 esbuild EPERM 限制。
下一步：继续维护 Static fallback 稳定性，逐步恢复 Electron 验证。

${memoryContext()}

请继续工作时遵守：
1. 不要重建项目。
2. 不要移除 Shared Memory（共享记忆）。
3. 用户界面保持中文优先。
4. Electron / Vite 若受 esbuild EPERM 限制，先维护 Static fallback 可用性。`);
}

function renderSharedMemory() {
  const query = state.memorySearch || '';
  const filtered = state.memories.filter((memory) => {
    const text = `${memory.title} ${memory.content} ${(memory.tags || []).join(' ')}`.toLowerCase();
    return !query || text.includes(query.toLowerCase());
  });
  return shell(`
    <section class="grid two-col">
      <div class="panel">
        <div class="section-title"><h2>新增记忆</h2><span class="tag">Shared Memory</span></div>
        <form class="grid" data-form="memory">
          ${select('type', '记忆类型', 'knowledge', Object.entries(memoryTypeLabels).map(([value, label]) => ({ value, label })))}
          ${field('title', '标题', '', 'text', '例如：静态入口已修复')}
          ${textarea('content', '内容', '', '记录约束、决策、问题修复或用户偏好')}
          ${field('tags', '标签', 'static,zh-CN')}
          ${select('importance', '重要度', '4', [
            { value: '1', label: '1 - 低' },
            { value: '3', label: '3 - 中' },
            { value: '5', label: '5 - 高' },
          ])}
          <div class="grid three-col">
            ${field('providerScope', '接口范围', 'all')}
            ${field('modelScope', '模型范围', 'all')}
            ${select('status', '状态', 'active', [
              { value: 'active', label: '进行中' },
              { value: 'pending', label: '待确认' },
              { value: 'archived', label: '已归档' },
            ])}
          </div>
          <button class="btn primary" type="submit">新增记忆</button>
        </form>
      </div>
      <div class="panel">
        <div class="section-title">
          <div><h2>跨模型恢复上下文 Prompt</h2><p>可复制到 Codex、Claude Code、Cursor 或其他 API 模型。</p></div>
          <button class="btn small" type="button" data-copy-recovery>复制</button>
        </div>
        <pre class="output">${escapeHtml(recoveryPrompt())}</pre>
      </div>
    </section>
    <section class="panel" style="margin-top:16px">
      <div class="section-title"><h2>${escapeHtml(t('sharedMemory'))}</h2><span class="tag">${filtered.length} / ${state.memories.length}</span></div>
      <div class="toolbar">
        <div class="field">
          <label for="memorySearch">${escapeHtml(t('searchMemory'))}</label>
          <input id="memorySearch" value="${escapeHtml(query)}" placeholder="${state.language === 'en' ? 'Search title, content, or tags' : '搜索标题、内容或标签'}" data-input="memory-search" />
        </div>
      </div>
      <div class="grid three-col">
        ${
          filtered.length
            ? filtered
          .map(
            (memory) => `
              <article class="item-card">
                <div class="spread">
                  <h3>${escapeHtml(memory.title)}</h3>
                  ${statusBadge(memory.status)}
                </div>
                <p>${escapeHtml(memory.content)}</p>
                <div class="row">
                  <span class="tag">${memoryTypeLabels[memory.type] || memory.type}</span>
                  <span class="tag">重要度 ${memory.importance}</span>
                  <span class="tag">最近使用 ${formatDate(memory.lastUsedAt)}</span>
                </div>
                <div class="row" style="margin-top:10px">
                  <button class="btn small" type="button" data-archive-memory="${memory.id}">
                    ${memory.status === 'archived' ? escapeHtml(t('restore')) : escapeHtml(t('archive'))}
                  </button>
                </div>
              </article>
            `,
          )
          .join('')
            : `<div class="empty">${escapeHtml(t('noMemories'))}</div>`
        }
      </div>
    </section>
  `);
}

function renderSettings() {
  const s = state.settings;
  const maskedApiKey = s.apiKey ? `已保存，尾号 ${redactText(s.apiKey).includes(REDACTED) ? REDACTED : s.apiKey.slice(-4)}` : '';
  return shell(`
    <section class="grid two-col">
      <div class="panel">
        <div class="section-title"><h2>AI 接口配置</h2><span class="tag">API Provider</span></div>
        <form class="grid" data-form="settings">
          ${field('providerName', '接口名称', s.providerName)}
          ${field('baseUrl', '接口地址', s.baseUrl)}
          ${field('apiKey', 'API 密钥', maskedApiKey, 'password', '仅本地保存，界面和导出会脱敏')}
          ${field('modelName', '模型名称', s.modelName)}
          ${select('memoryEnabled', '启用共享记忆', String(s.memoryEnabled), [
            { value: 'true', label: '启用' },
            { value: 'false', label: '关闭' },
          ])}
          ${select('memoryInjectionMode', '记忆注入模式', s.memoryInjectionMode, [
            { value: 'off', label: t('off') },
            { value: 'minimal', label: t('minimal') },
            { value: 'balanced', label: t('balanced') },
            { value: 'full', label: t('full') },
          ])}
          <div class="grid three-col">
            ${field('maxMemoryItems', '最大记忆条数', s.maxMemoryItems, 'number')}
            ${field('maxMemoryChars', '最大记忆字符数', s.maxMemoryChars, 'number')}
            ${select('theme', t('theme'), state.theme, [
              { value: 'light', label: `${t('light')} / Light` },
              { value: 'dark', label: `${t('dark')} / Dark` },
              { value: 'system', label: `${t('system')} / System` },
            ])}
          </div>
          <div class="panel compact-panel">
            <div class="section-title"><h2>${escapeHtml(t('interfacePreferences'))}</h2><span class="tag">Interface Preferences</span></div>
            <div class="grid three-col">
              ${select('language', t('language'), state.language, [
                { value: 'zh', label: '中文' },
                { value: 'en', label: 'English' },
              ])}
              ${select('preferenceTheme', t('theme'), state.theme, [
                { value: 'light', label: `${t('light')} / Light` },
                { value: 'dark', label: `${t('dark')} / Dark` },
                { value: 'system', label: `${t('system')} / System` },
              ])}
              <div class="item-card">
                <h3>${escapeHtml(t('currentLanguage'))}</h3>
                <p>${state.language === 'zh' ? '中文' : 'English'}</p>
                <h3>${escapeHtml(t('currentTheme'))}</h3>
                <p>${escapeHtml(t(state.theme))}</p>
              </div>
            </div>
          </div>
          ${field('defaultProjectPath', '默认项目路径', s.defaultProjectPath)}
          <button class="btn primary" type="submit">保存</button>
        </form>
      </div>
      <div class="panel">
        <div class="section-title"><h2>数据管理</h2><span class="tag">localStorage</span></div>
        <div class="stack">
          <p class="muted">静态可交付模式不连接云服务，所有项目、Prompt、风险检查和共享记忆都保存在本机浏览器 localStorage。</p>
          <button class="btn" type="button" data-action="export-data">导出</button>
          <button class="btn danger" type="button" data-action="clear-data">清空</button>
          <button class="btn" type="button" data-action="reset-demo">重置</button>
        </div>
      </div>
    </section>
  `);
}

function render() {
  applyTheme();
  document.documentElement.lang = state.language === 'en' ? 'en' : 'zh-CN';
  const app = document.querySelector('#app');
  if (!app) return;
  try {
    const renderers = {
      dashboard: renderDashboard,
      projects: renderProjects,
      'project-detail': renderProjectDetail,
      'prompt-lab': renderPromptLab,
      'log-analyzer': renderLogAnalyzer,
    'safety-box': renderSafetyBox,
    'shared-memory': renderSharedMemory,
    skills: renderSkills,
    'git-timeline': renderGitTimeline,
    settings: renderSettings,
  };
    app.innerHTML = (renderers[state.activePage] || renderDashboard)();
  } catch (error) {
    console.error('Static render error:', error);
    app.innerHTML = `
      <main class="main route-error">
        <section class="panel">
          <div class="section-title">
            <div>
              <h1>${escapeHtml(t('currentPageFailed'))}</h1>
              <p>${escapeHtml(t('retryHint'))}</p>
            </div>
          </div>
          <pre class="output">${escapeHtml(error?.message || String(error))}</pre>
          <div class="row">
            <button class="btn" type="button" data-page="log-analyzer">${escapeHtml(t('viewLogs'))}</button>
            <button class="btn primary" type="button" data-page="dashboard">${escapeHtml(t('backDashboard'))}</button>
          </div>
        </section>
      </main>
    `;
  }
}

function onInput(event) {
  const target = event.target;
  if (target?.dataset?.input === 'memory-search') {
    state.memorySearch = target.value;
    saveState();
    render();
  }
}

function onSubmit(event) {
  const form = event.target.closest('form');
  if (!form) return;
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());

  if (form.dataset.form === 'project') {
    const project = {
      id: uid('project'),
      name: data.name || '未命名项目',
      idea: data.idea || '暂无描述',
      platform: data.platform || 'Static Web',
      techStack: data.techStack || 'HTML, CSS, JavaScript',
      uiStyle: '中文工作台',
      difficulty: data.difficulty || 'Medium',
      status: 'active',
      tasks: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    state.projects.unshift(project);
    state.selectedProjectId = project.id;
    state.activePage = 'project-detail';
    saveState();
    render();
    toast('项目已创建');
  }

  if (form.dataset.form === 'task') {
    const project = selectedProject();
    if (!project) return;
    project.tasks = project.tasks || [];
    project.tasks.push({ id: uid('task'), title: data.taskTitle || '未命名任务', status: data.taskStatus || 'todo' });
    project.updatedAt = nowIso();
    saveState();
    render();
    toast('任务已保存');
  }

  if (form.dataset.form === 'agent-run') {
    const project = selectedProject();
    if (!project) return;
    project.agentRuns = project.agentRuns || [];
    project.agentRuns.unshift(redactDeep({
      id: uid('run'),
      tool: data.runTool || '未命名 Agent',
      status: data.runStatus || 'success',
      summary: data.runSummary || '暂无摘要',
      log: data.runLog || '',
      createdAt: nowIso(),
    }));
    project.agentRuns = project.agentRuns.slice(0, 30);
    project.updatedAt = nowIso();
    saveState();
    render();
    toast('运行记录已保存');
  }

  if (form.dataset.form === 'prompt') {
    const template = promptTemplates.find((item) => item.id === data.templateId) || promptTemplates[0];
    state.settings.memoryInjectionMode = data.memoryMode || state.settings.memoryInjectionMode;
    const context = memoryContext();
    const basePrompt = fillPrompt(template.template, data);
    const content = redactText(context ? `${context}\n\n---\n\n${basePrompt}` : basePrompt);
    state.lastPrompt = content;
    state.prompts.unshift({
      id: uid('prompt'),
      title: template.name,
      content,
      createdAt: nowIso(),
    });
    saveState();
    render();
    toast('Prompt 已生成');
  }

  if (form.dataset.form === 'log') {
    state.lastLogInput = data.logText || '';
    state.lastLogAnalysis = analyzeLog(state.lastLogInput);
    state.logAnalyses.unshift({ id: uid('log'), ...state.lastLogAnalysis, createdAt: nowIso() });
    saveState();
    render();
    toast('日志分析完成');
  }

  if (form.dataset.form === 'risk') {
    state.lastCommand = data.command || '';
    const result = checkRisk(state.lastCommand);
    state.lastRiskCheck = result;
    state.riskChecks.unshift(result);
    saveState();
    render();
    toast('风险检查完成');
  }

  if (form.dataset.form === 'memory') {
    state.memories.unshift(redactDeep({
      id: uid('memory'),
      type: data.type || 'knowledge',
      title: data.title || '未命名记忆',
      content: data.content || '',
      tags: String(data.tags || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      importance: Number(data.importance || 3),
      status: data.status || 'active',
      providerScope: data.providerScope || 'all',
      modelScope: data.modelScope || 'all',
      lastUsedAt: nowIso(),
      createdAt: nowIso(),
    }));
    saveState();
    render();
    toast('记忆已新增');
  }

  if (form.dataset.form === 'settings') {
    state.settings = {
      providerName: data.providerName || '',
      baseUrl: data.baseUrl || '',
      apiKey: data.apiKey?.startsWith('已保存') ? state.settings.apiKey : data.apiKey || '',
      modelName: data.modelName || '',
      memoryEnabled: data.memoryEnabled === 'true',
      memoryInjectionMode: data.memoryInjectionMode || 'balanced',
      maxMemoryItems: Number(data.maxMemoryItems || 10),
      maxMemoryChars: Number(data.maxMemoryChars || 8000),
      defaultProjectPath: data.defaultProjectPath || '',
    };
    setLanguage(data.language || state.language);
    setTheme(data.preferenceTheme || data.theme || state.theme);
    saveState();
    render();
    toast('设置已保存');
  }
}

function onClick(event) {
  const target = event.target.closest('button');
  if (!target) return;

  if (target.dataset.page) {
    navigate(target.dataset.page);
    return;
  }

  if (target.dataset.selectProject) {
    state.selectedProjectId = target.dataset.selectProject;
    state.activePage = 'project-detail';
    saveState();
    render();
    return;
  }

  if (target.dataset.deleteProject) {
    state.projects = state.projects.filter((project) => project.id !== target.dataset.deleteProject);
    if (state.selectedProjectId === target.dataset.deleteProject) {
      state.selectedProjectId = state.projects[0]?.id;
    }
    saveState();
    render();
    toast('项目已删除');
    return;
  }

  if (target.dataset.archiveMemory) {
    const memory = state.memories.find((item) => item.id === target.dataset.archiveMemory);
    if (memory) {
      memory.status = memory.status === 'archived' ? 'active' : 'archived';
      memory.updatedAt = nowIso();
      saveState();
      render();
      toast(memory.status === 'archived' ? '记忆已归档' : '记忆已恢复');
    }
    return;
  }

  if (target.dataset.copyProjectPrompt !== undefined) copyText(projectPrompt(selectedProject()), '项目 Prompt');
  if (target.dataset.copyLastPrompt !== undefined) copyText(state.lastPrompt || '', '生成结果');
  if (target.dataset.copyFixPrompt !== undefined) copyText(state.lastLogAnalysis?.prompt || '', '修复提示词');
  if (target.dataset.copyRecovery !== undefined) copyText(recoveryPrompt(), '跨模型恢复上下文 Prompt');
  if (target.dataset.copyPrompt) {
    const prompt = state.prompts.find((item) => item.id === target.dataset.copyPrompt);
    copyText(prompt?.content || '', 'Prompt');
  }

  if (target.dataset.action === 'toggle-language') {
    setLanguage(state.language === 'zh' ? 'en' : 'zh');
    render();
    return;
  }

  if (target.dataset.action === 'cycle-theme' || target.dataset.action === 'toggle-theme') {
    const cycle = ['system', 'light', 'dark'];
    const index = cycle.indexOf(state.theme);
    setTheme(cycle[(index + 1) % cycle.length]);
    render();
    return;
  }

  if (target.dataset.action === 'export-data') {
    copyText(JSON.stringify(redactDeep(state), null, 2), '导出数据');
  }

  if (target.dataset.action === 'clear-data') {
    if (confirm('确认清空所有 localStorage 数据？此操作不可撤销。')) {
      localStorage.removeItem(STORAGE_KEY);
      state = defaultState();
      saveState();
      render();
      toast('数据已清空并恢复默认状态');
    }
  }

  if (target.dataset.action === 'reset-demo') {
    state = defaultState();
    saveState();
    render();
    toast('演示数据已重置');
  }
}

document.addEventListener('submit', onSubmit);
document.addEventListener('click', onClick);
document.addEventListener('input', onInput);
window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
  if (state.theme === 'system') render();
});
setLanguage(state.language || 'zh');
setTheme(state.theme || 'system');
render();
