import type { Memory, MemoryInjectionMode, MemoryType } from '../../shared/types';
import { retrieveMemories } from './memoryRetriever';
import { redactSecrets, sanitizeObject } from './secretRedaction';

const DEFAULT_MAX_CHARS = 2000;

const TYPE_LABELS: Partial<Record<MemoryType, string>> = {
  user_preference: '用户偏好',
  project_context: '项目背景',
  decision: '已做决策',
  issue_fix: '已知问题',
  api_provider: 'API Provider 注意事项',
  prompt_pattern: '常用 Prompt 模式',
  environment: '环境信息',
  pattern: '模式',
  insight: '洞察',
  knowledge: '知识',
  code_snippet: '代码片段',
  security: '安全',
  git_summary: 'Git 摘要',
  log_analysis: '日志分析',
  safety_check: '安全检查',
};

const CONTEXT_SECTIONS = {
  zh: [
    { label: '项目背景', empty: '暂无记录', types: ['project_context', 'knowledge', 'environment'] as MemoryType[] },
    { label: '已做决策', empty: '暂无记录', types: ['decision', 'pattern'] as MemoryType[] },
    { label: '当前进度', empty: '暂无记录', types: ['git_summary', 'log_analysis', 'prompt_pattern'] as MemoryType[] },
    { label: '已知问题', empty: '暂无记录', types: ['issue_fix', 'security', 'safety_check'] as MemoryType[] },
    { label: '用户偏好', empty: '暂无记录', types: ['user_preference', 'insight'] as MemoryType[] },
    { label: 'API Provider 注意事项', empty: '暂无记录', types: ['api_provider'] as MemoryType[] },
  ],
  en: [
    { label: 'Project background', empty: 'No records yet', types: ['project_context', 'knowledge', 'environment'] as MemoryType[] },
    { label: 'Decisions', empty: 'No records yet', types: ['decision', 'pattern'] as MemoryType[] },
    { label: 'Current progress', empty: 'No records yet', types: ['git_summary', 'log_analysis', 'prompt_pattern'] as MemoryType[] },
    { label: 'Known issues', empty: 'No records yet', types: ['issue_fix', 'security', 'safety_check'] as MemoryType[] },
    { label: 'User preferences', empty: 'No records yet', types: ['user_preference', 'insight'] as MemoryType[] },
    { label: 'API Provider notes', empty: 'No records yet', types: ['api_provider'] as MemoryType[] },
  ],
} as const;

function formatMemory(mem: Memory): string {
  const tags = (mem.tags ?? []).length > 0 ? ` [${mem.tags.slice(0, 3).map(redactSecrets).join(', ')}]` : '';
  return `${redactSecrets(mem.title)}${tags}: ${redactSecrets(mem.content)}`;
}

export function generateSharedMemoryContext(
  memories: Memory[] | string | undefined,
  mode: MemoryInjectionMode,
  maxChars: number = DEFAULT_MAX_CHARS,
  language: 'zh' | 'en' = 'zh',
): string {
  const memoryList = Array.isArray(memories) ? sanitizeObject(memories) : [];
  if (mode === 'off' || memoryList.length === 0) {
    return '';
  }

  const retrievable = sanitizeObject(
    retrieveMemories(memoryList, {
      injectionMode: mode,
      maxChars: maxChars * 2,
    }),
  );

  if (retrievable.length === 0) {
    return '';
  }

  const grouped = new Map<MemoryType, Memory[]>();
  for (const mem of retrievable) {
    const list = grouped.get(mem.type) ?? [];
    list.push(mem);
    grouped.set(mem.type, list);
  }

  const sections = CONTEXT_SECTIONS[language];
  const colon = language === 'en' ? ':' : '：';
  const used = new Set<string>();
  const lines: string[] = ['[Shared Memory Context]'];

  for (const section of sections) {
    const items = section.types.flatMap((type) => grouped.get(type) ?? []);
    lines.push(`- ${section.label}${colon}`);
    if (items.length === 0) {
      lines.push(`  - ${section.empty}`);
      continue;
    }
    for (const mem of items) {
      used.add(mem.id);
      lines.push(`  - ${formatMemory(mem)}`);
    }
  }

  const otherItems = retrievable.filter((mem) => !used.has(mem.id));
  if (otherItems.length > 0) {
    lines.push(`- ${language === 'zh' ? '其他上下文' : 'Other context'}${colon}`);
    for (const mem of otherItems) {
      lines.push(`  - [${TYPE_LABELS[mem.type] ?? mem.type}] ${formatMemory(mem)}`);
    }
  }

  lines.push('[/Shared Memory Context]');
  let result = lines.join('\n').trim();

  if (result.length > maxChars) {
    result = `${result.slice(0, maxChars - 3)}...`;
  }

  return result;
}

export function injectMemoryIntoPrompt(
  prompt: string,
  memories: Memory[] | string | undefined,
  mode: MemoryInjectionMode,
): string {
  const safePrompt = redactSecrets(prompt);
  if (mode === 'off' || !safePrompt) return safePrompt;

  if (typeof memories === 'string') {
    return memories ? `${redactSecrets(memories)}\n\n---\n\n${safePrompt}` : safePrompt;
  }

  const context = generateSharedMemoryContext(memories, mode);
  if (!context) return safePrompt;

  return `${context}\n\n---\n\n${safePrompt}`;
}

export function generateCompactMemoryContext(
  memories: Memory[],
  mode: MemoryInjectionMode,
): string {
  if (mode === 'off' || memories.length === 0) return '';

  const retrievable = sanitizeObject(
    retrieveMemories(memories, {
      injectionMode: mode,
      maxItems: 5,
      maxChars: 500,
    }),
  );

  if (retrievable.length === 0) return '';

  return retrievable
    .map((m) => `[${TYPE_LABELS[m.type] ?? m.type}] ${redactSecrets(m.title)}`)
    .join(' | ');
}

export function generateProjectContext(memories: Memory[]): string {
  const ctx = sanitizeObject(memories).filter(
    (m) => m.type === 'project_context' && m.status === 'active',
  );

  if (ctx.length === 0) return '';

  const lines: string[] = ['## 当前项目进展'];
  for (const mem of ctx) {
    lines.push(`- **${redactSecrets(mem.title)}**: ${redactSecrets(mem.content)}`);
  }

  return lines.join('\n');
}
