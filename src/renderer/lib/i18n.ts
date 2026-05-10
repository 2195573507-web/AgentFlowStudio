export type Language = 'zh' | 'en';

export const LANGUAGE_KEY = 'agentflow.language';

const translations = {
  zh: {
    'nav.dashboard': '仪表板',
    'nav.projects': '项目管理',
    'nav.projectDetail': '项目详情',
    'nav.promptLab': '提示词实验室',
    'nav.logAnalyzer': '日志分析',
    'nav.safetyBox': '安全检查',
    'nav.sharedMemory': '共享记忆中心',
    'nav.skills': '技能管理',
    'nav.adminUsers': 'Admin Users',
    'nav.adminAudit': 'Audit Logs',
    'nav.gitTimeline': 'Git 时间线',
    'nav.settings': '设置',
    'topbar.language': 'English',
    'theme.light': '浅色',
    'theme.dark': '深色',
    'theme.system': '跟随系统',
    'settings.interfacePreferences': '界面偏好',
    'error.title': '页面加载失败',
    'error.body': '当前页面遇到渲染错误，其他功能仍可继续使用。',
    'error.retry': '重试',
    'error.backDashboard': '返回仪表板',
  },
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.projects': 'Projects',
    'nav.projectDetail': 'Project Detail',
    'nav.promptLab': 'Prompt Lab',
    'nav.logAnalyzer': 'Log Analyzer',
    'nav.safetyBox': 'SafetyBox',
    'nav.sharedMemory': 'Shared Memory Hub',
    'nav.skills': 'Skills',
    'nav.adminUsers': 'Admin Users',
    'nav.adminAudit': 'Audit Logs',
    'nav.gitTimeline': 'Git Timeline',
    'nav.settings': 'Settings',
    'topbar.language': '中文',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.system': 'System',
    'settings.interfacePreferences': 'Interface Preferences',
    'error.title': 'This page failed to load',
    'error.body': 'This route hit a render error. The rest of the app is still available.',
    'error.retry': 'Retry',
    'error.backDashboard': 'Back to Dashboard',
  },
} as const;

export function getLanguage(): Language {
  if (typeof window === 'undefined') return 'zh';
  const stored = window.localStorage.getItem(LANGUAGE_KEY);
  return stored === 'en' ? 'en' : 'zh';
}

export function setLanguage(language: Language): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LANGUAGE_KEY, language);
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
}

export function t(key: keyof typeof translations.zh | string, language = getLanguage()): string {
  const table = translations[language] as Record<string, string>;
  return table[key] ?? translations.zh[key as keyof typeof translations.zh] ?? key;
}

export { translations };
