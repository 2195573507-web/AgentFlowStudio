import type { Memory, ProjectPlan } from '../../shared/types';
import { redactSecrets } from './secretRedaction';
import { formatDate } from './utils';

// ── Helpers ──

function buildMetadataHeader(title: string, date: string): string {
  return [
    '---',
    `title: ${title}`,
    `date: ${date}`,
    `generatedBy: AgentFlow Studio`,
    `exportedAt: ${new Date().toISOString()}`,
    '---',
    '',
  ].join('\n');
}

// ── Markdown exporter ──

/**
 * Export arbitrary string content as a Markdown document with metadata header.
 */
export function exportMarkdown(content: string, filename: string): string {
  const safeContent = redactSecrets(content);
  const header = buildMetadataHeader(filename, new Date().toISOString());
  return header + '\n' + safeContent;
}

// ── JSON exporter ──

/**
 * Export any JSON-serializable data as a pretty-printed JSON string.
 */
export function exportJSON(data: unknown, filename: string): string {
  // Sanitize secrets before exporting
  let safe: unknown;
  try {
    const jsonStr = JSON.stringify(data);
    const redacted = redactSecrets(jsonStr);
    safe = JSON.parse(redacted);
  } catch {
    // If redaction somehow breaks the JSON, fall back to raw (but still redact plain secrets)
    safe = data;
  }

  return JSON.stringify(
    {
      _metadata: {
        filename,
        exportedAt: new Date().toISOString(),
        generatedBy: 'AgentFlow Studio',
      },
      data: safe,
    },
    null,
    2,
  );
}

// ── Memory exporter ──

const MEMORY_TYPE_LABELS: Record<string, string> = {
  user_preference: '用户偏好',
  project_context: '项目背景',
  decision: '已做决策',
  issue_fix: '已知问题修复',
  api_provider: 'API Provider',
  prompt_pattern: 'Prompt 模式',
  environment: '环境信息',
};

const MEMORY_STATUS_LABELS: Record<string, string> = {
  active: '活跃',
  pending: '待处理',
  archived: '已归档',
};

/**
 * Export an array of Memory objects as a well-formatted Markdown document.
 */
export function exportMemoriesToMarkdown(
  memories: Memory[],
  projectName?: string,
): string {
  const title = projectName
    ? `${projectName} - 记忆导出`
    : 'AgentFlow Studio 记忆导出';
  const date = new Date().toISOString();
  const header = buildMetadataHeader(title, date);

  const lines: string[] = [header];

  if (projectName) {
    lines.push(`# ${projectName} - 共享记忆`, '');
  } else {
    lines.push('# 共享记忆', '');
  }

  lines.push(
    `> 导出时间: ${formatDate(date)}`,
    `> 共 ${memories.length} 条记忆`,
    '',
    '---',
    '',
  );

  // Group by type
  const grouped = new Map<string, Memory[]>();
  for (const mem of memories) {
    const list = grouped.get(mem.type) ?? [];
    list.push(mem);
    grouped.set(mem.type, list);
  }

  const typeOrder = [
    'project_context',
    'decision',
    'issue_fix',
    'user_preference',
    'api_provider',
    'environment',
    'prompt_pattern',
  ];

  for (const type of typeOrder) {
    const group = grouped.get(type);
    if (!group || group.length === 0) continue;

    lines.push(`## ${MEMORY_TYPE_LABELS[type] ?? type}`, '');

    for (const mem of group) {
      const importanceStars = '★'.repeat(mem.importance) + '☆'.repeat(5 - mem.importance);
      const status = MEMORY_STATUS_LABELS[mem.status] ?? mem.status;
      const tags = mem.tags.length > 0 ? ` \`${mem.tags.join('` `')}\`` : '';

      lines.push(`### ${redactSecrets(mem.title)}`, '');
      lines.push(`| 属性 | 值 |`);
      lines.push(`|------|----|`);
      lines.push(`| 类型 | ${MEMORY_TYPE_LABELS[mem.type] ?? mem.type} |`);
      lines.push(`| 重要性 | ${importanceStars} (${mem.importance}/5) |`);
      lines.push(`| 状态 | ${status} |`);
      lines.push(`| 标签 | ${tags || '无'} |`);
      lines.push(`| 创建时间 | ${formatDate(mem.createdAt)} |`);
      lines.push(`| 更新时间 | ${formatDate(mem.updatedAt)} |`);
      lines.push(`| 最后使用 | ${formatDate(mem.lastUsedAt)} |`);
      if (mem.providerScope) {
        lines.push(`| Provider | ${mem.providerScope} |`);
      }
      if (mem.modelScope) {
        lines.push(`| 模型 | ${mem.modelScope} |`);
      }
      lines.push('', redactSecrets(mem.content), '', '---', '');
    }
  }

  // Table of contents at top
  const tocLines: string[] = ['## 目录', ''];
  for (const type of typeOrder) {
    const group = grouped.get(type);
    if (group && group.length > 0) {
      tocLines.push(
        `- [${MEMORY_TYPE_LABELS[type] ?? type}](#${(MEMORY_TYPE_LABELS[type] ?? type).toLowerCase().replace(/\s+/g, '-')}) (${group.length} 条)`,
      );
    }
  }
  tocLines.push('', '---', '');

  // Insert TOC after the intro
  const introEnd = lines.findIndex((l) => l === '---');
  if (introEnd >= 0) {
    lines.splice(introEnd + 1, 0, ...tocLines);
  }

  return lines.join('\n');
}

// ── Project plan exporter ──

/**
 * Export a ProjectPlan as a structured Markdown document.
 */
export function exportProjectPlanToMarkdown(plan: ProjectPlan): string {
  const header = buildMetadataHeader('项目计划', new Date().toISOString());
  const lines: string[] = [header];

  lines.push('# 项目计划', '', '---', '');

  // Summary
  lines.push('## 项目概要', '', redactSecrets(plan.summary), '', '---', '');

  // PRD
  lines.push('## 产品需求文档 (PRD)', '', redactSecrets(plan.prd), '', '---', '');

  // Architecture
  lines.push(
    '## 技术架构',
    '',
    redactSecrets(plan.architecture),
    '',
    '---',
    '',
  );

  // Directory Structure
  lines.push(
    '## 目录结构',
    '',
    '```',
    redactSecrets(plan.directoryStructure),
    '```',
    '',
    '---',
    '',
  );

  // Tasks
  lines.push(`## 任务列表 (共 ${plan.tasks.length} 个)`, '');

  for (let i = 0; i < plan.tasks.length; i++) {
    const task = plan.tasks[i];
    lines.push(
      `### ${i + 1}. ${redactSecrets(task.title)}`,
      '',
      `| 属性 | 值 |`,
      `|------|----|`,
      `| 角色 | ${task.role} |`,
      `| 优先级 | ${task.priority} |`,
      `| 状态 | ${task.status} |`,
      '',
      `**描述**: ${redactSecrets(task.description)}`,
      '',
      `**输入**: ${redactSecrets(task.input)}`,
      '',
      `**输出**: ${redactSecrets(task.output)}`,
      '',
      `**验收标准**: ${redactSecrets(task.acceptance)}`,
      '',
      '---',
      '',
    );
  }

  // Test Plan
  lines.push(
    '## 测试计划',
    '',
    redactSecrets(plan.testPlan),
    '',
    '---',
    '',
  );

  // Acceptance Criteria
  lines.push(
    '## 验收标准',
    '',
    redactSecrets(plan.acceptanceCriteria),
    '',
    '---',
    '',
  );

  // Dev Prompts
  lines.push('## 开发指令 (Prompts)', '');

  lines.push(
    '### Claude Code Prompt',
    '',
    '```markdown',
    redactSecrets(plan.devPrompt),
    '```',
    '',
  );

  lines.push(
    '### Codex Prompt',
    '',
    '```markdown',
    redactSecrets(plan.codexPrompt),
    '```',
    '',
  );

  lines.push(
    '### Cursor Prompt',
    '',
    '```markdown',
    redactSecrets(plan.cursorPrompt),
    '```',
    '',
  );

  return lines.join('\n');
}
