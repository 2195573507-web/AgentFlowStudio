import type { Run, RunNodeTrace } from '../../shared/types';
import { redactSecrets } from './secretRedaction';

export interface RunQualityChecklistItem {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export function parseRunNodeTrace(log: string, status: string): RunNodeTrace[] {
  const lines = log
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const selected = lines.length > 0 ? lines.slice(0, 4) : ['等待执行'];

  return selected.map((line, index) => {
    const failed = /fail|error|失败|错误|blocked|阻塞/i.test(line) || status === 'failed';
    return {
      id: `node-${index + 1}`,
      name: index === 0 ? '输入与准备' : index === selected.length - 1 ? '结果整理' : `节点 ${index + 1}`,
      status: failed ? 'failed' : status === 'blocked' ? 'blocked' : status === 'running' ? 'running' : 'success',
      durationMs: 800 + index * 420,
      inputSummary: index === 0 ? '项目目标、Prompt、测试命令或用户描述' : selected[index - 1],
      outputSummary: line,
      failureReason: failed ? line : undefined,
      retryCount: failed ? 1 : 0,
    };
  });
}

export function formatRunDuration(ms?: number): string {
  if (!ms || ms <= 0) return '未记录';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function clean(value: string | undefined): string {
  return redactSecrets(value ?? '');
}

export function serializeRun(run: Run): string {
  const nodeLines = (run.nodeTrace ?? [])
    .map((node, index) => {
      const parts = [
        `${index + 1}. ${node.name}`,
        `状态: ${node.status}`,
        `耗时: ${formatRunDuration(node.durationMs)}`,
        `重试: ${node.retryCount ?? 0}`,
        node.inputSummary ? `输入: ${clean(node.inputSummary)}` : '',
        node.outputSummary ? `输出: ${clean(node.outputSummary)}` : '',
        node.failureReason ? `失败原因: ${clean(node.failureReason)}` : '',
      ].filter(Boolean);
      return parts.join('\n   ');
    })
    .join('\n');

  return [
    `# ${run.title}`,
    `工具: ${run.tool}`,
    `状态: ${run.status}`,
    `创建时间: ${run.createdAt}`,
    `总耗时: ${formatRunDuration(run.durationMs)}`,
    `重试次数: ${run.retryCount ?? 0}`,
    run.summary ? `摘要: ${clean(run.summary)}` : '',
    run.error ? `失败原因: ${clean(run.error)}` : '',
    '',
    '## 节点追踪',
    nodeLines || '暂无节点追踪',
    '',
    '## 原始日志',
    clean(run.log) || '暂无日志',
  ].filter(Boolean).join('\n');
}

export function buildRunQualityChecklist(run: Run): RunQualityChecklistItem[] {
  const nodeTrace = run.nodeTrace ?? [];
  const hasFailureReason = run.status !== 'failed' || Boolean(run.error || nodeTrace.some((node) => node.failureReason));
  const hasVerification = /typecheck|test|lint|build|e2e|verify|smoke|通过|passed/i.test(`${run.summary}\n${run.log}`);
  const hasRetrySignal = run.status !== 'failed' || (run.retryCount ?? 0) > 0 || /retry|重试|rerun|重新运行/i.test(run.log);

  return [
    {
      id: 'summary',
      label: '结果摘要',
      passed: Boolean(run.summary?.trim()),
      detail: '保存一句可接手的完成/受阻说明。',
    },
    {
      id: 'nodes',
      label: '节点追踪',
      passed: nodeTrace.length > 0,
      detail: '记录至少一个输入、输出或失败节点。',
    },
    {
      id: 'verification',
      label: '验证信号',
      passed: hasVerification,
      detail: '日志中应出现 typecheck/test/lint/build/e2e 等验证结果。',
    },
    {
      id: 'failure',
      label: '失败原因',
      passed: hasFailureReason,
      detail: '失败或受阻时要写清原因，方便下一轮重试。',
    },
    {
      id: 'retry',
      label: '重试记录',
      passed: hasRetrySignal,
      detail: '失败记录应保留重试次数或下一步重试建议。',
    },
  ];
}

export function getFailedRunRetryAdvice(run: Run): string[] {
  if (!['failed', 'blocked'].includes(run.status)) return [];
  const text = `${run.error ?? ''}\n${run.summary ?? ''}\n${run.log ?? ''}`.toLowerCase();
  if (/type|tsc|typescript/.test(text)) return ['先运行 npm.cmd run typecheck，按首个 TypeScript 错误收敛修复。'];
  if (/e2e|playwright|locator|timeout/.test(text)) return ['先复现单个 Playwright 用例，检查选择器是否匹配当前 UI 文案。'];
  if (/lint|eslint/.test(text)) return ['先运行 npm.cmd run lint，优先修复 error，再处理新增 warning。'];
  if (/build|vite|electron/.test(text)) return ['先运行 npm.cmd run build，确认是 renderer、main 还是 preload 阶段失败。'];
  return ['先提取最小失败日志，确认输入、期望行为、实际错误和可重跑命令。'];
}
