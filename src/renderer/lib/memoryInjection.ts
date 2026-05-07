import type { Memory, MemoryInjectionMode, MemoryType } from '../../shared/types';
import { retrieveMemories } from './memoryRetriever';

// ── Defaults ──

const DEFAULT_MAX_CHARS = 2000;

// ── Type → label mapping ──

const TYPE_LABELS: Partial<Record<MemoryType, string>> = {
  user_preference: '用户偏好',
  project_context: '项目背景',
  decision: '已做决策',
  issue_fix: '已知问题',
  api_provider: 'API Provider 注意事项',
  prompt_pattern: '常用 Prompt 模式',
  environment: '环境信息',
};

const TYPE_ORDER: MemoryType[] = [
  'project_context',
  'decision',
  'issue_fix',
  'user_preference',
  'api_provider',
  'environment',
  'prompt_pattern',
];

// ── Public API ──

/**
 * Generate a formatted "Shared Memory Context" block suitable for inserting
 * into an AI prompt. The output respects the given injection mode and
 * total character limit.
 */
export function generateSharedMemoryContext(
  memories: Memory[] | string | undefined,
  mode: MemoryInjectionMode,
  maxChars: number = DEFAULT_MAX_CHARS,
): string {
  const memoryList = Array.isArray(memories) ? memories : [];
  if (mode === 'off' || memoryList.length === 0) {
    return '';
  }

  // Retrieve memories using the retriever (filters by mode, caps items/chars)
  const retrievable = retrieveMemories(memoryList, {
    injectionMode: mode,
    maxChars: maxChars * 2, // generous internal limit; we trim text later
  });

  if (retrievable.length === 0) {
    return '';
  }

  // Group by type
  const grouped = new Map<MemoryType, Memory[]>();
  for (const mem of retrievable) {
    const list = grouped.get(mem.type) ?? [];
    list.push(mem);
    grouped.set(mem.type, list);
  }

  // Build output in a consistent order
  const lines: string[] = ['[Shared Memory Context]', ''];

  for (const type of TYPE_ORDER) {
    const group = grouped.get(type);
    if (!group || group.length === 0) continue;

    const label = TYPE_LABELS[type] ?? type;
    lines.push(`## ${label}`);
    for (const mem of group) {
      const tags =
        mem.tags.length > 0 ? ` [${mem.tags.slice(0, 3).join(', ')}]` : '';
      const importance = '★'.repeat(mem.importance);
      lines.push(`- **${mem.title}** ${importance}${tags}`);
      if (mem.content) {
        // Indent multi-line content
        const contentLines = mem.content.split('\n');
        for (const cl of contentLines) {
          lines.push(`  ${cl}`);
        }
      }
    }
    lines.push('');
  }

  lines.push('[/Shared Memory Context]');

  let result = lines.join('\n').trim();

  // Trim to maxChars
  if (result.length > maxChars) {
    result = result.slice(0, maxChars - 3) + '...';
  }

  return result;
}

/**
 * Inject a shared memory context block at the beginning of a prompt string.
 * If the injection mode is 'off', the prompt is returned unchanged.
 */
export function injectMemoryIntoPrompt(
  prompt: string,
  memories: Memory[] | string | undefined,
  mode: MemoryInjectionMode,
): string {
  if (mode === 'off' || !prompt) return prompt;

  if (typeof memories === 'string') {
    return memories ? `${memories}\n\n---\n\n${prompt}` : prompt;
  }

  const context = generateSharedMemoryContext(memories, mode);
  if (!context) return prompt;

  return `${context}\n\n---\n\n${prompt}`;
}

/**
 * Build a compact, single-line context summary for use in tight spaces
 * (e.g. status bar hover, tooltips).
 */
export function generateCompactMemoryContext(
  memories: Memory[],
  mode: MemoryInjectionMode,
): string {
  if (mode === 'off' || memories.length === 0) return '';

  const retrievable = retrieveMemories(memories, {
    injectionMode: mode,
    maxItems: 5,
    maxChars: 500,
  });

  if (retrievable.length === 0) return '';

  return retrievable
    .map((m) => `[${TYPE_LABELS[m.type] ?? m.type}] ${m.title}`)
    .join(' | ');
}

/**
 * Returns only the project_context items as a simple formatted block.
 * Useful for quick project context injection without the full memory set.
 */
export function generateProjectContext(memories: Memory[]): string {
  const ctx = memories.filter(
    (m) => m.type === 'project_context' && m.status === 'active',
  );

  if (ctx.length === 0) return '';

  const lines: string[] = ['## 当前项目进展'];

  for (const mem of ctx) {
    lines.push(`- **${mem.title}**: ${mem.content}`);
  }

  return lines.join('\n');
}
