import type { AgentWorkflowTemplate } from '../shared/workflowTypes.js';

export const BEGINNER_WORKFLOW_TEMPLATES: AgentWorkflowTemplate[] = [
  {
    id: 'beginner-prompt-llm-output',
    name: '新手 Prompt 到输出',
    description: '从输入开始，整理 Prompt，调用 LLM，最后输出结果。适合第一次运行。',
    category: 'beginner',
    beginnerRecommended: true,
    nodes: [
      { id: 'start', type: 'start', title: 'Start', description: '接收用户输入', config: {}, position: { x: 80, y: 120 } },
      { id: 'prompt', type: 'prompt', title: 'Prompt', description: '整理任务说明', config: { prompt: '请把用户输入整理成清晰、可执行的步骤。' }, position: { x: 260, y: 120 } },
      { id: 'llm', type: 'llm', title: 'LLM', description: '使用配置好的 Provider 生成结果', config: { model: 'demo-local-model' }, position: { x: 440, y: 120 } },
      { id: 'output', type: 'output', title: 'Output', description: '输出最终结果', config: { outputKey: 'answer' }, position: { x: 620, y: 120 } },
    ],
    edges: [
      { id: 'e-start-prompt', source: 'start', target: 'prompt' },
      { id: 'e-prompt-llm', source: 'prompt', target: 'llm' },
      { id: 'e-llm-output', source: 'llm', target: 'output' },
    ],
  },
  {
    id: 'approval-tool-condition',
    name: '工具调用与人工审批',
    description: '包含 Tool、Condition、Human Approval，展示更接近真实 Agent 的安全运行链路。',
    category: 'approval',
    beginnerRecommended: true,
    nodes: [
      { id: 'start', type: 'start', title: 'Start', description: '接收需求', config: {}, position: { x: 80, y: 180 } },
      { id: 'prompt', type: 'prompt', title: 'Prompt', description: '生成执行草案', config: { prompt: '请生成一个需要检查的执行草案。' }, position: { x: 250, y: 180 } },
      { id: 'tool', type: 'tool', title: 'Tool', description: '本地 dry-run 工具', config: { toolName: 'local.dryRun' }, position: { x: 420, y: 180 } },
      { id: 'condition', type: 'condition', title: 'Condition', description: '检查输入非空', config: { conditionExpression: 'not-empty' }, position: { x: 590, y: 180 } },
      { id: 'approval', type: 'human_approval', title: 'Human Approval', description: '关键步骤人工确认', config: { approvalQuestion: '是否允许继续输出？' }, position: { x: 760, y: 180 } },
      { id: 'output', type: 'output', title: 'Output', description: '输出审批后的结果', config: { outputKey: 'approved_result' }, position: { x: 940, y: 180 } },
    ],
    edges: [
      { id: 'e-start-prompt', source: 'start', target: 'prompt' },
      { id: 'e-prompt-tool', source: 'prompt', target: 'tool' },
      { id: 'e-tool-condition', source: 'tool', target: 'condition' },
      { id: 'e-condition-approval', source: 'condition', target: 'approval', condition: 'true' },
      { id: 'e-approval-output', source: 'approval', target: 'output', condition: 'approved' },
    ],
  },
];
